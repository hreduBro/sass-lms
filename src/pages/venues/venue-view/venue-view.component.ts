import { Component, signal, computed, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Venue, Room, SeatingLayout, calculateVenueTotalCapacity, getActiveRoomsCount } from '../../../models/venue.model';

@Component({
  selector: 'app-venue-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './venue-view.component.html'
})
export class VenueViewComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  venueId = signal<string>('');
  venue = computed<Venue | undefined>(() => this.lmsData.getVenueById(this.venueId()));

  // Active Tab
  activeTab = signal<'rooms' | 'telemetry' | 'classes' | 'info'>('rooms');

  // Room creation / edit modal
  isRoomModalOpen = signal<boolean>(false);
  editingRoom = signal<Room | null>(null);
  roomForm!: FormGroup;

  // Capacity Checker Interactive Tool
  testBatchSize = signal<number>(35);
  selectedRoomForCapacityCheck = signal<string>('');
  capacityCheckResult = computed(() => {
    const roomId = this.selectedRoomForCapacityCheck();
    if (!roomId) return null;
    return this.lmsData.checkCapacityGuidance(roomId, this.testBatchSize());
  });

  // Deactivate dialog
  confirmDialog = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'deactivateVenue' | 'reactivateVenue' | 'deactivateRoom' | 'reactivateRoom' | null;
    confirmLabel?: string;
    targetRoom?: Room | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    confirmLabel: 'Proceed',
    targetRoom: null
  });

  ngOnInit(): void {
    this.initRoomForm();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.venueId.set(params['id']);
        const v = this.venue();
        if (v && v.rooms.length > 0) {
          this.selectedRoomForCapacityCheck.set(v.rooms[0].roomId);
        }
      }
    });
  }

  initRoomForm(): void {
    this.roomForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      capacity: [30, [Validators.required, Validators.min(1), Validators.max(1000)]],
      floorLevel: ['Ground Floor'],
      notes: [''],
      hasProjector: [true],
      hasSoundSystem: [true],
      hasMicrophone: [true],
      hasDisplayScreen: [true],
      layoutTheatre: [true],
      layoutClassroom: [true],
      layoutUshape: [false],
      layoutBoardroom: [false],
      layoutBanquet: [false]
    });
  }

  getTotalCapacity(): number {
    const v = this.venue();
    if (!v) return 0;
    return calculateVenueTotalCapacity(v);
  }

  getActiveRoomsCount(): number {
    const v = this.venue();
    if (!v) return 0;
    return getActiveRoomsCount(v);
  }

  openAddRoomModal(): void {
    this.editingRoom.set(null);
    this.roomForm.reset({
      name: '',
      capacity: 35,
      floorLevel: '1st Floor',
      notes: '',
      hasProjector: true,
      hasSoundSystem: true,
      hasMicrophone: true,
      hasDisplayScreen: true,
      layoutTheatre: true,
      layoutClassroom: true,
      layoutUshape: false,
      layoutBoardroom: false,
      layoutBanquet: false
    });
    this.isRoomModalOpen.set(true);
  }

  openEditRoomModal(room: Room): void {
    this.editingRoom.set(room);
    this.roomForm.patchValue({
      name: room.name,
      capacity: room.capacity,
      floorLevel: room.floorLevel || '',
      notes: room.notes || '',
      hasProjector: room.equipment.projector,
      hasSoundSystem: room.equipment.soundSystem,
      hasMicrophone: room.equipment.microphone,
      hasDisplayScreen: room.equipment.displayScreen,
      layoutTheatre: room.seatingLayouts.includes('theatre'),
      layoutClassroom: room.seatingLayouts.includes('classroom'),
      layoutUshape: room.seatingLayouts.includes('uShape'),
      layoutBoardroom: room.seatingLayouts.includes('boardroom'),
      layoutBanquet: room.seatingLayouts.includes('banquet')
    });
    this.isRoomModalOpen.set(true);
  }

  closeRoomModal(): void {
    this.isRoomModalOpen.set(false);
    this.editingRoom.set(null);
  }

  submitRoomForm(): void {
    if (this.roomForm.invalid || !this.venue()) return;

    const val = this.roomForm.value;
    const layouts: SeatingLayout[] = [];
    if (val.layoutTheatre) layouts.push('theatre');
    if (val.layoutClassroom) layouts.push('classroom');
    if (val.layoutUshape) layouts.push('uShape');
    if (val.layoutBoardroom) layouts.push('boardroom');
    if (val.layoutBanquet) layouts.push('banquet');

    const equipment = {
      projector: !!val.hasProjector,
      soundSystem: !!val.hasSoundSystem,
      microphone: !!val.hasMicrophone,
      displayScreen: !!val.hasDisplayScreen,
      otherTags: []
    };

    if (this.editingRoom()) {
      this.lmsData.updateRoom(this.venue()!.venueId, this.editingRoom()!.roomId, {
        name: val.name,
        capacity: Number(val.capacity),
        floorLevel: val.floorLevel,
        notes: val.notes,
        equipment,
        seatingLayouts: layouts.length > 0 ? layouts : ['classroom']
      });
    } else {
      this.lmsData.addRoom(this.venue()!.venueId, {
        name: val.name,
        capacity: Number(val.capacity),
        floorLevel: val.floorLevel,
        notes: val.notes,
        equipment,
        seatingLayouts: layouts.length > 0 ? layouts : ['classroom']
      });
    }

    this.closeRoomModal();
  }

  // Deactivation and Reactivation Prompts
  promptDeactivateVenue(): void {
    const v = this.venue();
    if (!v) return;
    this.confirmDialog.set({
      isOpen: true,
      title: 'Deactivate Venue',
      message: `Are you sure to deactivate this venue? Deactivating "${v.name}" will exclude all its rooms from new class scheduling. Existing and historical class records will remain unchanged.`,
      action: 'deactivateVenue',
      confirmLabel: 'Deactivate Venue'
    });
  }

  promptReactivateVenue(): void {
    const v = this.venue();
    if (!v) return;
    this.confirmDialog.set({
      isOpen: true,
      title: 'Reactivate Venue',
      message: `Reactivating "${v.name}" will restore its active rooms to the scheduling pool for new in-person offline trainings.`,
      action: 'reactivateVenue',
      confirmLabel: 'Reactivate Venue'
    });
  }

  promptDeactivateRoom(room: Room): void {
    this.confirmDialog.set({
      isOpen: true,
      title: 'Deactivate Room',
      message: `Deactivate "${room.name}"? It will not be selectable for new offline training sessions.`,
      action: 'deactivateRoom',
      confirmLabel: 'Deactivate Room',
      targetRoom: room
    });
  }

  promptReactivateRoom(room: Room): void {
    this.confirmDialog.set({
      isOpen: true,
      title: 'Reactivate Room',
      message: `Reactivate "${room.name}" to make it available for training cohort scheduling?`,
      action: 'reactivateRoom',
      confirmLabel: 'Reactivate Room',
      targetRoom: room
    });
  }

  executeConfirm(): void {
    const d = this.confirmDialog();
    const v = this.venue();
    if (!v) return;

    if (d.action === 'deactivateVenue') {
      this.lmsData.deactivateVenue(v.venueId);
    } else if (d.action === 'reactivateVenue') {
      this.lmsData.reactivateVenue(v.venueId);
    } else if (d.action === 'deactivateRoom' && d.targetRoom) {
      this.lmsData.deactivateRoom(v.venueId, d.targetRoom.roomId);
    } else if (d.action === 'reactivateRoom' && d.targetRoom) {
      this.lmsData.reactivateRoom(v.venueId, d.targetRoom.roomId);
    }

    this.closeConfirm();
  }

  closeConfirm(): void {
    this.confirmDialog.set({
      isOpen: false,
      title: '',
      message: '',
      action: null,
      confirmLabel: 'Proceed',
      targetRoom: null
    });
  }
}
