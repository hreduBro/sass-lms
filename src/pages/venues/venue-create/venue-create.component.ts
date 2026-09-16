import { Component, signal, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Venue, Room, SeatingLayout, calculateVenueTotalCapacity } from '../../../models/venue.model';

@Component({
  selector: 'app-venue-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
  activeTab = signal<'basic' | 'rooms' | 'facilities' | 'contact' | 'review'>('basic');

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
      this.router.navigate(['/venues/view', this.venueId()]);
    } else {
      const created = this.lmsData.createVenue(venuePayload);
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
