import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Venue, Room, SeatingLayout, calculateVenueTotalCapacity } from '../../../models/venue.model';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';

@Component({
  selector: 'app-venue-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    StepperComponent
  ],
  templateUrl: './venue-create.component.html'
})
export class VenueCreateComponent implements OnInit {
  private lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  venueForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  venueId = signal<string | null>(null);

  steps: StepperStep[] = [
    { id: 1, shortTitle: 'Basic Info', title: 'Basic Info & Location', icon: 'pin_drop' },
    { id: 2, shortTitle: 'Rooms', title: 'Rooms & Seating Layout', icon: 'meeting_room' },
    { id: 3, shortTitle: 'Amenities', title: 'Amenities & Facilities', icon: 'tune' },
    { id: 4, shortTitle: 'Manager', title: 'Facility Manager', icon: 'badge' }
  ];
  currentStep = signal<number>(1);
  completedSteps = signal<number[]>([]);
  showWelcomeBanner = signal<boolean>(true);
  successAlert = signal<string | null>(null);
  formErrorAlert = signal<string | null>(null);
  private successTimer: any = null;

  getCurrentStepTitle(): string {
    const step = this.steps.find(s => s.id === this.currentStep());
    return step?.title || step?.shortTitle || 'Basic Info & Location';
  }

  isFieldInvalid(name: string): boolean {
    const ctrl = this.venueForm?.get(name);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  isRoomFieldInvalid(index: number, name: string): boolean {
    const room = this.roomsArray?.at(index);
    const ctrl = room?.get(name);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  validateStep(step: number): { valid: boolean; message?: string } {
    if (!this.venueForm) return { valid: true };

    if (step === 1) {
      const step1Fields = ['code', 'name', 'addressLine1', 'city', 'country'];
      step1Fields.forEach(f => this.venueForm.get(f)?.markAsTouched());

      const codeCtrl = this.venueForm.get('code');
      if (!codeCtrl?.value) {
        this.venueForm.get('code')?.setValue(`VEN-${Date.now().toString().slice(-4)}`);
      }
      const nameCtrl = this.venueForm.get('name');
      const addrCtrl = this.venueForm.get('addressLine1');
      const cityCtrl = this.venueForm.get('city');
      const countryCtrl = this.venueForm.get('country');
      if (nameCtrl?.invalid) {
        return { valid: false, message: 'Venue Name is required (up to 120 characters).' };
      }
      if (addrCtrl?.invalid) {
        return { valid: false, message: 'Street Address Line 1 is required.' };
      }
      if (cityCtrl?.invalid) {
        return { valid: false, message: 'City is required.' };
      }
      if (countryCtrl?.invalid) {
        return { valid: false, message: 'Country is required.' };
      }
    } else if (step === 2) {
      if (this.roomsArray.length === 0) {
        return { valid: false, message: 'At least one training room / hall must be configured.' };
      }

      for (let i = 0; i < this.roomsArray.length; i++) {
        const roomGroup = this.roomsArray.at(i);
        roomGroup.get('name')?.markAsTouched();
        roomGroup.get('capacity')?.markAsTouched();

        const nameVal = roomGroup.get('name')?.value;
        const capVal = Number(roomGroup.get('capacity')?.value);

        if (!nameVal || !nameVal.toString().trim()) {
          return { valid: false, message: `Room #${i + 1} Name / Label is required.` };
        }
        if (isNaN(capVal) || capVal < 1) {
          return { valid: false, message: `Room #${i + 1} Capacity must be at least 1 seat.` };
        }
      }
    } else if (step === 3) {
      return { valid: true };
    } else if (step === 4) {
      const step4Fields = ['contactName', 'contactPhone', 'contactEmail'];
      step4Fields.forEach(f => this.venueForm.get(f)?.markAsTouched());

      const contactNameCtrl = this.venueForm.get('contactName');
      const contactPhoneCtrl = this.venueForm.get('contactPhone');
      const contactEmailCtrl = this.venueForm.get('contactEmail');

      if (contactNameCtrl?.invalid) {
        return { valid: false, message: 'Contact Officer Name is required.' };
      }
      if (contactPhoneCtrl?.invalid) {
        return { valid: false, message: 'Direct Telephone / Mobile is required.' };
      }
      if (contactEmailCtrl?.invalid) {
        return { valid: false, message: 'A valid official contact email address is required.' };
      }
    }

    return { valid: true };
  }

  private triggerSuccessAlert(message: string): void {
    this.successAlert.set(message);
    if (this.successTimer) {
      clearTimeout(this.successTimer);
    }
    this.successTimer = setTimeout(() => {
      if (this.successAlert() === message) {
        this.successAlert.set(null);
      }
    }, 5000);
  }

  goToStep(targetStep: number): void {
    if (targetStep < 1 || targetStep > 4) return;
    const current = this.currentStep();

    if (targetStep > current) {
      for (let s = current; s < targetStep; s++) {
        const validation = this.validateStep(s);
        if (!validation.valid) {
          this.currentStep.set(s);
          this.formErrorAlert.set(validation.message || 'Please fill in all mandatory fields before proceeding.');
          this.successAlert.set(null);
          this.lmsData.showToast(validation.message || 'Validation error encountered.', 'error', 4500, 'Step Validation');
          this.scrollToFirstError();
          return;
        }
        if (!this.completedSteps().includes(s)) {
          this.completedSteps.update(c => [...c, s]);
        }
      }

      const prevStepObj = this.steps.find(s => s.id === current);
      const targetStepObj = this.steps.find(s => s.id === targetStep);
      const successMsg = `Stage ${current} (${prevStepObj?.shortTitle || 'Step ' + current}) saved successfully! Proceeding to Stage ${targetStep}: ${targetStepObj?.shortTitle || 'Step ' + targetStep}.`;

      this.currentStep.set(targetStep);
      this.formErrorAlert.set(null);
      this.triggerSuccessAlert(successMsg);
      this.lmsData.showToast(successMsg, 'success', 4000, 'Stage Completed');
      this.scrollTop();
    } else if (targetStep < current) {
      this.currentStep.set(targetStep);
      this.formErrorAlert.set(null);
      this.scrollTop();
    }
  }

  nextStep(): void {
    this.goToStep(this.currentStep() + 1);
  }

  prevStep(): void {
    this.goToStep(this.currentStep() - 1);
  }

  facilitiesOtherInput = signal<string>('');

  ngOnInit(): void {
    this.initForm();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.venueId.set(params['id']);
        this.loadVenue(params['id']);
      }
    });
  }

  initForm(): void {
    this.venueForm = this.fb.group({
      code: [`VEN-${Date.now().toString().slice(-4)}`, [Validators.required, Validators.maxLength(30)]],
      name: ['', [Validators.required, Validators.maxLength(120)]],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['Dhaka', Validators.required],
      postcode: ['1212'],
      country: ['Bangladesh', Validators.required],
      lat: [23.7925],
      lng: [90.4078],
      internet: [true],
      parking: [true],
      accessibility: [true],
      contactName: ['Lt. Col. Farhad Reza (Retd.)', Validators.required],
      contactPhone: ['+880 1711-445566', Validators.required],
      contactEmail: ['farhad.reza@learningcenter.brac.net', [Validators.required, Validators.email]],
      contactRole: ['Senior Facilities Director'],
      rooms: this.fb.array([])
    });

    // Add 1 default room for convenience
    if (!this.isEditMode()) {
      this.addRoomRow({
        name: 'Main Auditorium / Hall A',
        capacity: 50,
        floorLevel: 'Ground Floor',
        notes: 'Equipped with dual 4K projection & surround sound system',
        hasProjector: true,
        hasSoundSystem: true,
        hasMicrophone: true,
        hasDisplayScreen: true,
        theatre: true,
        classroom: true,
        uShape: false,
        boardroom: false
      });
    }
  }

  get roomsArray(): FormArray {
    return this.venueForm.get('rooms') as FormArray;
  }

  addRoomRow(initial?: any): void {
    const roomGroup = this.fb.group({
      roomId: [initial?.roomId || `room-${Date.now()}-${Math.floor(Math.random()*100)}`],
      name: [initial?.name || 'Classroom ' + (this.roomsArray.length + 1), Validators.required],
      capacity: [initial?.capacity || 30, [Validators.required, Validators.min(1)]],
      floorLevel: [initial?.floorLevel || '1st Floor'],
      notes: [initial?.notes || ''],
      hasProjector: [initial?.hasProjector ?? true],
      hasSoundSystem: [initial?.hasSoundSystem ?? true],
      hasMicrophone: [initial?.hasMicrophone ?? true],
      hasDisplayScreen: [initial?.hasDisplayScreen ?? true],
      theatre: [initial?.theatre ?? true],
      classroom: [initial?.classroom ?? true],
      uShape: [initial?.uShape ?? false],
      boardroom: [initial?.boardroom ?? false],
      banquet: [initial?.banquet ?? false]
    });

    this.roomsArray.push(roomGroup);
  }

  removeRoomRow(index: number): void {
    if (this.roomsArray.length > 1) {
      this.roomsArray.removeAt(index);
    }
  }

  loadVenue(id: string): void {
    const venue = this.lmsData.getVenueById(id);
    if (!venue) {
      this.router.navigate(['/venues']);
      return;
    }

    this.venueForm.patchValue({
      code: venue.code,
      name: venue.name,
      addressLine1: venue.address.line1,
      city: venue.address.city,
      postcode: venue.address.postcode,
      country: venue.address.country,
      lat: venue.geo?.lat || 23.7925,
      lng: venue.geo?.lng || 90.4078,
      internet: venue.facilities.internet,
      parking: venue.facilities.parking,
      accessibility: venue.facilities.accessibility,
      contactName: venue.contactPerson?.name || '',
      contactPhone: venue.contactPerson?.phone || '',
      contactEmail: venue.contactPerson?.email || ''
    });

    this.roomsArray.clear();
    venue.rooms.forEach(r => {
      this.addRoomRow({
        roomId: r.roomId,
        name: r.name,
        capacity: r.capacity,
        floorLevel: r.floorLevel || '',
        notes: r.notes || '',
        hasProjector: r.equipment.projector,
        hasSoundSystem: r.equipment.soundSystem,
        hasMicrophone: r.equipment.microphone,
        hasDisplayScreen: r.equipment.displayScreen,
        theatre: r.seatingLayouts.includes('theatre'),
        classroom: r.seatingLayouts.includes('classroom'),
        uShape: r.seatingLayouts.includes('uShape'),
        boardroom: r.seatingLayouts.includes('boardroom'),
        banquet: r.seatingLayouts.includes('banquet')
      });
    });
  }

  calculateTotalCapacity(): number {
    let total = 0;
    for (let i = 0; i < this.roomsArray.length; i++) {
      const cap = Number(this.roomsArray.at(i).get('capacity')?.value) || 0;
      total += cap;
    }
    return total;
  }

  saveVenue(): void {
    // Validate all 4 steps before saving
    for (let s = 1; s <= 4; s++) {
      const res = this.validateStep(s);
      if (!res.valid) {
        this.currentStep.set(s);
        this.formErrorAlert.set(res.message || 'Please complete all required fields.');
        this.successAlert.set(null);
        this.lmsData.showToast(res.message || 'Please complete all required fields.', 'error', 5000, 'Validation Error');
        this.scrollToFirstError();
        return;
      }
      if (!this.completedSteps().includes(s)) {
        this.completedSteps.update(c => [...c, s]);
      }
    }

    if (this.venueForm.invalid) {
      this.venueForm.markAllAsTouched();
      this.formErrorAlert.set('Some fields contain invalid data. Please review the highlighted fields.');
      this.scrollToFirstError();
      return;
    }

    const val = this.venueForm.value;
    const rooms: Room[] = val.rooms.map((r: any) => {
      const layouts: SeatingLayout[] = [];
      if (r.theatre) layouts.push('theatre');
      if (r.classroom) layouts.push('classroom');
      if (r.uShape) layouts.push('uShape');
      if (r.boardroom) layouts.push('boardroom');
      if (r.banquet) layouts.push('banquet');

      return {
        roomId: r.roomId || `room-${Date.now()}-${Math.floor(Math.random()*100)}`,
        venueId: this.venueId() || '',
        name: r.name,
        capacity: Number(r.capacity),
        floorLevel: r.floorLevel,
        notes: r.notes,
        equipment: {
          projector: !!r.hasProjector,
          soundSystem: !!r.hasSoundSystem,
          microphone: !!r.hasMicrophone,
          displayScreen: !!r.hasDisplayScreen,
          otherTags: []
        },
        seatingLayouts: layouts.length > 0 ? layouts : ['classroom'],
        status: 'active',
        usedInClassesCount: 0,
        createdAt: new Date().toISOString()
      };
    });

    const venuePayload: Partial<Venue> = {
      code: val.code.toUpperCase().trim(),
      name: val.name.trim(),
      type: 'physical',
      address: {
        line1: val.addressLine1,
        city: val.city,
        postcode: val.postcode,
        country: val.country,
        formatted: `${val.addressLine1}, ${val.city} ${val.postcode}, ${val.country}`
      },
      geo: {
        lat: Number(val.lat) || null,
        lng: Number(val.lng) || null
      },
      facilities: {
        internet: !!val.internet,
        parking: !!val.parking,
        accessibility: !!val.accessibility,
        otherTags: []
      },
      rooms,
      contactPerson: val.contactName ? {
        name: val.contactName,
        phone: val.contactPhone,
        email: val.contactEmail
      } : undefined
    };

    if (this.isEditMode() && this.venueId()) {
      this.lmsData.updateVenue(this.venueId()!, venuePayload);
      this.lmsData.showToast(`Venue "${venuePayload.name}" updated successfully!`, 'success', 4000, 'Venue Updated');
      this.router.navigate(['/venues/view', this.venueId()]);
    } else {
      const created = this.lmsData.createVenue(venuePayload);
      this.lmsData.showToast(`Venue "${created.name}" registered successfully!`, 'success', 4500, 'Venue Registered');
      this.router.navigate(['/venues/view', created.venueId]);
    }
  }

  cancel(): void {
    if (this.isEditMode() && this.venueId()) {
      this.router.navigate(['/venues/view', this.venueId()]);
    } else {
      this.router.navigate(['/venues']);
    }
  }

  private scrollTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private scrollToFirstError(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const errorEl = document.querySelector(
        'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, .border-rose-500, .border-red-500, [aria-invalid="true"], [data-error="true"], .text-rose-500:not(:empty), #form-error-banner'
      );
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ((errorEl as HTMLElement).focus && typeof (errorEl as HTMLElement).focus === 'function') {
          (errorEl as HTMLElement).focus();
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  }
}
