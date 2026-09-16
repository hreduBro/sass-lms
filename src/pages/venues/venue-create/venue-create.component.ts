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

  // Alerts state: Welcome, Error, Success
  showWelcomeAlert = signal<boolean>(false);
  formErrors = signal<string[]>([]);
  showSuccessAlert = signal<boolean>(false);

  validateCurrentStep(step: number): boolean {
    const errors: string[] = [];
    if (step === 1) {
      const codeCtrl = this.venueForm.get('code');
      const nameCtrl = this.venueForm.get('name');
      const addrCtrl = this.venueForm.get('addressLine1');
      const cityCtrl = this.venueForm.get('city');
      const countryCtrl = this.venueForm.get('country');

      if (codeCtrl?.invalid) {
        codeCtrl.markAsTouched();
        errors.push('Venue Unique Code is required (max 30 characters).');
      }
      if (nameCtrl?.invalid) {
        nameCtrl.markAsTouched();
        errors.push('Venue Name is required.');
      }
      if (addrCtrl?.invalid) {
        addrCtrl.markAsTouched();
        errors.push('Street Address Line 1 is required.');
      }
      if (cityCtrl?.invalid) {
        cityCtrl.markAsTouched();
        errors.push('City is required.');
      }
      if (countryCtrl?.invalid) {
        countryCtrl.markAsTouched();
        errors.push('Country is required.');
      }
    } else if (step === 2) {
      if (this.roomsArray.length === 0) {
        errors.push('At least one room must be configured.');
      }
      for (let i = 0; i < this.roomsArray.length; i++) {
        const r = this.roomsArray.at(i);
        if (r.get('name')?.invalid) {
          r.get('name')?.markAsTouched();
          errors.push(`Room #${i + 1}: Room Name is required.`);
        }
        if (r.get('capacity')?.invalid) {
          r.get('capacity')?.markAsTouched();
          errors.push(`Room #${i + 1}: Capacity must be at least 1 seat.`);
        }
      }
    }

    this.formErrors.set(errors);
    if (errors.length > 0) {
      this.lmsData.showToast(
        `Please resolve the highlighted validation errors (${errors.length} issue${errors.length > 1 ? 's' : ''}) to proceed.`,
        'error',
        4500,
        'Validation Error',
        'REQUIRED'
      );
      this.scrollToFirstError();
      return false;
    }
    return true;
  }

  scrollToFirstError(): void {
    setTimeout(() => {
      // Find the first invalid input element or field with ng-invalid
      const invalidEl = document.querySelector(
        'form input.ng-invalid, form select.ng-invalid, form textarea.ng-invalid, [formcontrolname].ng-invalid'
      ) as HTMLElement | null;

      if (invalidEl) {
        invalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        invalidEl.focus?.();
        invalidEl.classList.add('ring-2', 'ring-rose-500', 'animate-pulse');
        setTimeout(() => {
          invalidEl.classList.remove('ring-2', 'ring-rose-500', 'animate-pulse');
        }, 2500);
      } else {
        const errorBanner = document.getElementById('venue-error-alert');
        errorBanner?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  goToStep(stepId: number): void {
    if (stepId > this.currentStep()) {
      if (!this.validateCurrentStep(this.currentStep())) {
        return;
      }
    }
    this.formErrors.set([]);
    if (stepId >= 1 && stepId <= 4) {
      this.currentStep.set(stepId);
    }
  }

  nextStep(): void {
    const cur = this.currentStep();
    if (!this.validateCurrentStep(cur)) {
      return;
    }
    this.formErrors.set([]);
    if (!this.completedSteps().includes(cur)) {
      this.completedSteps.update(c => [...c, cur]);
    }
    if (cur < 4) {
      this.currentStep.set(cur + 1);
    }
  }

  prevStep(): void {
    this.formErrors.set([]);
    const cur = this.currentStep();
    if (cur > 1) {
      this.currentStep.set(cur - 1);
    }
  }

  facilitiesOtherInput = signal<string>('');

  ngOnInit(): void {
    this.initForm();

    const isEdit = this.router.url.includes('/edit') || 
                   !!this.route.snapshot.params['id'] || 
                   !!this.route.snapshot.queryParams['id'] || 
                   !!this.route.snapshot.queryParams['editId'] || 
                   !!this.route.snapshot.queryParams['edit'];

    if (isEdit) {
      this.isEditMode.set(true);
      this.showWelcomeAlert.set(false);
    }

    this.route.params.subscribe(params => {
      const editId = params['id'] || this.route.snapshot.queryParams['id'] || this.route.snapshot.queryParams['editId'] || this.route.snapshot.queryParams['edit'];
      if (editId || this.router.url.includes('/edit')) {
        this.isEditMode.set(true);
        this.showWelcomeAlert.set(false);
        if (editId) {
          this.venueId.set(editId);
          this.loadVenue(editId);
        }
      } else {
        this.isEditMode.set(false);
        this.showWelcomeAlert.set(true);
        // Welcome alert toast on create only
        this.lmsData.showToast(
          'Welcome to Facility Registration! Complete the 4 horizontal steps to configure your venue.',
          'info',
          5000,
          'Welcome',
          'GUIDE'
        );
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
      contactName: ['Lt. Col. Farhad Reza (Retd.)'],
      contactPhone: ['+880 1711-445566'],
      contactEmail: ['farhad.reza@learningcenter.brac.net'],
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
    if (this.venueForm.invalid) {
      this.venueForm.markAllAsTouched();
      const allErrors: string[] = [];
      if (this.venueForm.get('code')?.invalid) allErrors.push('Venue Unique Code is required.');
      if (this.venueForm.get('name')?.invalid) allErrors.push('Venue Name is required.');
      if (this.venueForm.get('addressLine1')?.invalid) allErrors.push('Street Address Line 1 is required.');
      if (this.venueForm.get('city')?.invalid) allErrors.push('City is required.');
      if (this.venueForm.get('country')?.invalid) allErrors.push('Country is required.');
      for (let i = 0; i < this.roomsArray.length; i++) {
        const r = this.roomsArray.at(i);
        if (r.get('name')?.invalid) allErrors.push(`Room #${i + 1} Name is required.`);
        if (r.get('capacity')?.invalid) allErrors.push(`Room #${i + 1} Capacity must be at least 1.`);
      }
      if (allErrors.length === 0) {
        allErrors.push('Please ensure all required fields marked with * are filled accurately.');
      }
      this.formErrors.set(allErrors);
      this.lmsData.showToast(
        'Form has invalid or missing required entries. Review the highlighted fields.',
        'error',
        5000,
        'Form Incomplete',
        'ACTION REQUIRED'
      );
      // Auto-navigate to first invalid step if needed
      if (this.venueForm.get('code')?.invalid || this.venueForm.get('name')?.invalid || this.venueForm.get('addressLine1')?.invalid || this.venueForm.get('city')?.invalid || this.venueForm.get('country')?.invalid) {
        this.currentStep.set(1);
      } else if (this.roomsArray.invalid) {
        this.currentStep.set(2);
      }
      this.scrollToFirstError();
      return;
    }

    this.formErrors.set([]);

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
      this.lmsData.showToast('Facility configuration updated successfully!', 'success', 5000, 'Venue Updated', 'ACTIVE');
      this.router.navigate(['/venues/view', this.venueId()]);
    } else {
      const created = this.lmsData.createVenue(venuePayload);
      this.lmsData.showToast('New physical facility registered successfully!', 'success', 5000, 'Venue Registered', 'ACTIVE');
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
}
