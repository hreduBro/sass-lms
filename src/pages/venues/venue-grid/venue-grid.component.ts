import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Venue, Room, VenueStatus, RoomStatus, SeatingLayout, calculateVenueTotalCapacity, getActiveRoomsCount } from '../../../models/venue.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DataGridComponent, FilterSectionComponent, GridViewMode } from '../../../components/data-grid';
import { ModalOverlayComponent } from '../../../components/modal-overlay/modal-overlay.component';

@Component({
  selector: 'app-venue-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CustomSelectComponent,
    DataGridComponent,
    FilterSectionComponent,
    ModalOverlayComponent
  ],
  templateUrl: './venue-grid.component.html'
})
export class VenueGridComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeTenant = computed(() => this.lmsData.activeTenant());

  // Permissions
  permissions = this.lmsData.venuePermissions;

  // View Mode: Grid vs Table
  viewMode = signal<GridViewMode>('table');

  // Filter Drawer Open State
  isFilterPanelOpen = signal<boolean>(false);

  // Search & Filters
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all'); // all | active | inactive
  selectedCity = signal<string>('all');
  selectedFacility = signal<string>('all'); // all | internet | parking | accessibility
  sortBy = signal<string>('newest'); // newest | oldest | name_asc | name_desc | capacity_desc | rooms_desc

  draftStatus = signal<string>('all');
  draftCity = signal<string>('all');
  draftFacility = signal<string>('all');

  // Dropdown action menu ID
  openActionMenuId = signal<string | null>(null);

  // Quick Room Modal
  isAddRoomModalOpen = signal<boolean>(false);
  activeVenueForRoom = signal<Venue | null>(null);
  roomForm!: FormGroup;

  // Confirmation dialog state (e.g. BRD requirement: "Are you sure to deactivate this venue?" -> alert "[Venue Name] has been deactivated")
  confirmDialog = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'deactivate' | 'reactivate' | 'delete' | 'deleteRoom' | null;
    confirmBtnLabel?: string;
    venue: Venue | null;
    room?: Room | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    confirmBtnLabel: 'Yes, Proceed',
    venue: null,
    room: null
  });

  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Status: All', icon: 'filter_list' },
    { value: 'active', label: 'Active', icon: 'check_circle', badge: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    { value: 'inactive', label: 'Inactive', icon: 'cancel', badge: 'Inactive', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' }
  ];

  sortOptions: SelectOption[] = [
    { value: 'newest', label: 'Newest First', icon: 'schedule' },
    { value: 'oldest', label: 'Oldest First', icon: 'history' },
    { value: 'name_asc', label: 'Venue Name (A-Z)', icon: 'sort_by_alpha' },
    { value: 'name_desc', label: 'Venue Name (Z-A)', icon: 'sort_by_alpha' },
    { value: 'capacity_desc', label: 'Highest Capacity', icon: 'groups' },
    { value: 'rooms_desc', label: 'Most Rooms', icon: 'meeting_room' }
  ];

  cityOptions = computed<SelectOption[]>(() => {
    const venues = this.lmsData.venues();
    const cities = Array.from(new Set(venues.map(v => v.address.city).filter(Boolean)));
    return [
      { value: 'all', label: 'All Cities', icon: 'location_on' },
      ...cities.map(c => ({ value: c, label: c, icon: 'location_city' }))
    ];
  });

  facilityOptions: SelectOption[] = [
    { value: 'all', label: 'All Facilities', icon: 'tune' },
    { value: 'internet', label: 'High-Speed Wi-Fi', icon: 'wifi' },
    { value: 'parking', label: 'Dedicated Parking', icon: 'local_parking' },
    { value: 'accessibility', label: 'Wheelchair Accessible', icon: 'accessible' }
  ];

  // Filtered venues
  filteredVenues = computed(() => {
    let list = this.lmsData.venues();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const city = this.selectedCity();
    const facility = this.selectedFacility();
    const sort = this.sortBy();

    if (q) {
      list = list.filter(v => 
        v.name.toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q) ||
        v.address.city.toLowerCase().includes(q) ||
        v.address.formatted.toLowerCase().includes(q) ||
        v.rooms.some(r => r.name.toLowerCase().includes(q))
      );
    }

    if (status !== 'all') {
      list = list.filter(v => v.status === status);
    }

    if (city !== 'all') {
      list = list.filter(v => v.address.city.toLowerCase() === city.toLowerCase());
    }

    if (facility !== 'all') {
      if (facility === 'internet') list = list.filter(v => v.facilities.internet);
      if (facility === 'parking') list = list.filter(v => v.facilities.parking);
      if (facility === 'accessibility') list = list.filter(v => v.facilities.accessibility);
    }

    return [...list].sort((a, b) => {
      if (sort === 'newest') return b.venueId.localeCompare(a.venueId);
      if (sort === 'oldest') return a.venueId.localeCompare(b.venueId);
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      if (sort === 'name_desc') return b.name.localeCompare(a.name);
      if (sort === 'capacity_desc') return calculateVenueTotalCapacity(b) - calculateVenueTotalCapacity(a);
      if (sort === 'rooms_desc') return b.rooms.length - a.rooms.length;
      return 0;
    });
  });

  // Telemetry summaries
  totalVenuesCount = computed(() => this.lmsData.venues().length);
  activeVenuesCount = computed(() => this.lmsData.venues().filter(v => v.status === 'active').length);
  totalRoomsCount = computed(() => this.lmsData.venues().reduce((acc, v) => acc + v.rooms.length, 0));
  totalLearnerCapacity = computed(() => this.lmsData.venues().reduce((acc, v) => acc + calculateVenueTotalCapacity(v), 0));

  ngOnInit(): void {
    this.initRoomForm();

    // Check query params if deactivating or opening specific modal
    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.selectedStatus.set(params['filter']);
      }
    });
  }

  initRoomForm(): void {
    this.roomForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      capacity: [30, [Validators.required, Validators.min(1), Validators.max(1000)]],
      floorLevel: ['Level 2'],
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

  openAddRoomModal(venue: Venue): void {
    this.activeVenueForRoom.set(venue);
    this.roomForm.reset({
      name: '',
      capacity: 35,
      floorLevel: 'Ground Floor',
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
    this.isAddRoomModalOpen.set(true);
    this.closeActionMenu();
  }

  closeAddRoomModal(): void {
    this.isAddRoomModalOpen.set(false);
    this.activeVenueForRoom.set(null);
  }

  submitAddRoom(): void {
    if (this.roomForm.invalid || !this.activeVenueForRoom()) return;

    const val = this.roomForm.value;
    const layouts: SeatingLayout[] = [];
    if (val.layoutTheatre) layouts.push('theatre');
    if (val.layoutClassroom) layouts.push('classroom');
    if (val.layoutUshape) layouts.push('uShape');
    if (val.layoutBoardroom) layouts.push('boardroom');
    if (val.layoutBanquet) layouts.push('banquet');

    this.lmsData.addRoom(this.activeVenueForRoom()!.venueId, {
      name: val.name,
      capacity: Number(val.capacity),
      floorLevel: val.floorLevel,
      notes: val.notes,
      equipment: {
        projector: !!val.hasProjector,
        soundSystem: !!val.hasSoundSystem,
        microphone: !!val.hasMicrophone,
        displayScreen: !!val.hasDisplayScreen,
        otherTags: []
      },
      seatingLayouts: layouts.length > 0 ? layouts : ['classroom']
    });

    this.closeAddRoomModal();
  }

  toggleActionMenu(venueId: string, event: Event): void {
    event.stopPropagation();
    this.openActionMenuId.update(curr => curr === venueId ? null : venueId);
  }

  closeActionMenu(): void {
    this.openActionMenuId.set(null);
  }

  getTotalCapacity(venue: Venue): number {
    return calculateVenueTotalCapacity(venue);
  }

  getActiveRooms(venue: Venue): number {
    return getActiveRoomsCount(venue);
  }

  navigateToCreate(): void {
    this.router.navigate(['/venues/create']);
  }

  navigateToView(venueId: string): void {
    this.router.navigate(['/venues/view', venueId]);
  }

  navigateToEdit(venueId: string): void {
    this.router.navigate(['/venues/edit', venueId]);
  }

  // Confirm Actions
  promptDeactivate(venue: Venue): void {
    this.closeActionMenu();
    this.confirmDialog.set({
      isOpen: true,
      title: 'Deactivate Venue',
      message: `Are you sure to deactivate this venue? Deactivating "${venue.name}" will exclude its rooms from new class scheduling. Historical class references will be preserved.`,
      action: 'deactivate',
      confirmBtnLabel: 'Deactivate Venue',
      venue
    });
  }

  promptReactivate(venue: Venue): void {
    this.closeActionMenu();
    this.confirmDialog.set({
      isOpen: true,
      title: 'Reactivate Venue',
      message: `Do you want to reactivate "${venue.name}"? Its active rooms will immediately become available for scheduling in-person workshops and classes.`,
      action: 'reactivate',
      confirmBtnLabel: 'Reactivate Venue',
      venue
    });
  }

  promptDelete(venue: Venue): void {
    this.closeActionMenu();
    this.confirmDialog.set({
      isOpen: true,
      title: 'Delete Physical Venue',
      message: `Are you sure you want to permanently delete "${venue.name}"? This action cannot be undone.`,
      action: 'delete',
      confirmBtnLabel: 'Delete Permanently',
      venue
    });
  }

  executeConfirmAction(): void {
    const dialog = this.confirmDialog();
    if (!dialog.venue) return;

    if (dialog.action === 'deactivate') {
      this.lmsData.deactivateVenue(dialog.venue.venueId);
    } else if (dialog.action === 'reactivate') {
      this.lmsData.reactivateVenue(dialog.venue.venueId);
    } else if (dialog.action === 'delete') {
      this.lmsData.deleteVenue(dialog.venue.venueId);
    }

    this.closeConfirmDialog();
  }

  closeConfirmDialog(): void {
    this.confirmDialog.set({
      isOpen: false,
      title: '',
      message: '',
      action: null,
      confirmBtnLabel: 'Yes, Proceed',
      venue: null,
      room: null
    });
  }

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedCity() !== 'all') count++;
    if (this.selectedFacility() !== 'all') count++;
    return count;
  });

  hasActiveFilters = computed(() => this.searchQuery().trim() !== '' || this.activeFilterCount() > 0);

  onFilterToggle(isOpen: boolean): void {
    this.isFilterPanelOpen.set(isOpen);
    if (isOpen) {
      this.draftStatus.set(this.selectedStatus());
      this.draftCity.set(this.selectedCity());
      this.draftFacility.set(this.selectedFacility());
    }
  }

  applyFilters(): void {
    this.selectedStatus.set(this.draftStatus());
    this.selectedCity.set(this.draftCity());
    this.selectedFacility.set(this.draftFacility());
    this.isFilterPanelOpen.set(false);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedCity.set('all');
    this.selectedFacility.set('all');
    this.draftStatus.set('all');
    this.draftCity.set('all');
    this.draftFacility.set('all');
    this.sortBy.set('newest');
    this.isFilterPanelOpen.set(false);
  }
}
