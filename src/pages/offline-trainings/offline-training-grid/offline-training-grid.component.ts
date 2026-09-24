import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineTrainingStatus, OfflineAssessmentMode } from '../../../models/offline-training.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { ModalOverlayComponent } from '../../../components/modal-overlay/modal-overlay.component';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { DatePickerComponent } from '../../../components/date-picker/date-picker.component';
import { GridViewMode, GridEmptyStateType, GridActiveChip } from '../../../components/data-grid/data-grid.types';

@Component({
  selector: 'app-offline-training-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CustomSelectComponent,
    ModalOverlayComponent,
    DataGridComponent,
    DatePickerComponent
  ],
  templateUrl: './offline-training-grid.component.html'
})
export class OfflineTrainingGridComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Permissions
  permissions = this.lmsData.offlineTrainingPermissions;

  // View Mode: Grid vs Table
  viewMode = signal<GridViewMode>('grid');

  // Filter Drawer Open State
  isFilterPanelOpen = signal<boolean>(false);

  // Search & Filters
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all'); // all | draft | published | inactive
  selectedVenue = signal<string>('all');
  selectedAssessmentMode = signal<string>('all');
  sortBy = signal<string>('newest'); // newest | oldest | title_asc | title_desc | duration_desc | capacity_desc

  draftStatus = signal<string>('all');
  draftVenue = signal<string>('all');
  draftAssessmentMode = signal<string>('all');
  draftSortBy = signal<string>('newest');

  // 3-dot action dropdown
  openActionMenuId = signal<string | null>(null);

  // Quick Embed Modal
  isEmbedModalOpen = signal<boolean>(false);
  activeTrainingForEmbed = signal<OfflineTraining | null>(null);
  embedForm!: FormGroup;

  // Confirmation dialog state
  confirmDialog = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'publish' | 'deactivate' | 'reactivate' | 'duplicate' | 'delete' | null;
    confirmBtnLabel?: string;
    training: OfflineTraining | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    confirmBtnLabel: 'Yes, Proceed',
    training: null
  });

  statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses', icon: 'check_circle' },
    { value: 'published', label: 'Published', icon: 'verified', badge: 'Published', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    { value: 'draft', label: 'Draft', icon: 'edit_note', badge: 'Draft', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
    { value: 'inactive', label: 'Inactive', icon: 'cancel', badge: 'Inactive', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' }
  ];

  venueOptions = computed<SelectOption[]>(() => {
    const venues = this.lmsData.venues();
    return [
      { value: 'all', label: 'All Venues', icon: 'domain' },
      ...venues.map(v => ({ value: v.venueId, label: v.name, icon: 'location_city' }))
    ];
  });

  assessmentModeOptions: SelectOption[] = [
    { value: 'all', label: 'All Assessment Types', icon: 'fact_check' },
    { value: 'reference_assessment', label: 'Referenced Assessment (Mode A)', icon: 'link' },
    { value: 'inline_assessment', label: 'Inline Assessment (Mode B)', icon: 'quiz' },
    { value: 'manual_marks', label: 'Manual Instructor Marks (Mode C)', icon: 'rate_review' },
    { value: 'none', label: 'No Assessment', icon: 'remove_circle_outline' }
  ];

  sortOptions: SelectOption[] = [
    { value: 'newest', label: 'Newest First', icon: 'sort' },
    { value: 'oldest', label: 'Oldest First', icon: 'history' },
    { value: 'title_asc', label: 'Title (A-Z)', icon: 'sort_by_alpha' },
    { value: 'title_desc', label: 'Title (Z-A)', icon: 'sort_by_alpha' },
    { value: 'duration_desc', label: 'Longest Duration', icon: 'timelapse' },
    { value: 'capacity_desc', label: 'Max Seating Capacity', icon: 'groups' }
  ];

  // Filtered trainings
  filteredTrainings = computed(() => {
    let list = this.lmsData.offlineTrainings();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const venue = this.selectedVenue();
    const assessMode = this.selectedAssessmentMode();
    const sort = this.sortBy();

    if (q) {
      list = list.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.venueName && t.venueName.toLowerCase().includes(q)) ||
        (t.roomName && t.roomName.toLowerCase().includes(q)) ||
        (t.primaryTrainerName && t.primaryTrainerName.toLowerCase().includes(q)) ||
        (t.defaultTrainerName && t.defaultTrainerName.toLowerCase().includes(q))
      );
    }

    if (status !== 'all') {
      list = list.filter(t => t.status === status);
    }

    if (venue !== 'all') {
      list = list.filter(t => t.venueId === venue);
    }

    if (assessMode !== 'all') {
      list = list.filter(t => t.assessmentMode === assessMode || (assessMode === 'manual_marks' && (!t.assessmentMode || t.assessmentMode === 'manual')));
    }

    return [...list].sort((a, b) => {
      const aId = a.trainingId || a.id || '';
      const bId = b.trainingId || b.id || '';
      if (sort === 'newest') return bId.localeCompare(aId);
      if (sort === 'oldest') return aId.localeCompare(bId);
      if (sort === 'title_asc') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'title_desc') return (b.title || '').localeCompare(a.title || '');
      if (sort === 'duration_desc') return (b.durationHours || 0) - (a.durationHours || 0);
      if (sort === 'capacity_desc') return (b.maxCapacity || 0) - (a.maxCapacity || 0);
      return 0;
    });
  });

  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() && this.selectedStatus() !== 'all') count++;
    if (this.selectedVenue() && this.selectedVenue() !== 'all') count++;
    if (this.selectedAssessmentMode() && this.selectedAssessmentMode() !== 'all') count++;
    return count;
  });

  hasActiveFilters = computed<boolean>(() => {
    return this.searchQuery().trim() !== '' || this.activeFilterCount() > 0;
  });

  activeChips = computed<GridActiveChip[]>(() => {
    const chips: GridActiveChip[] = [];
    if (this.selectedStatus() && this.selectedStatus() !== 'all') {
      const opt = this.statusOptions.find(o => o.value === this.selectedStatus());
      chips.push({ id: 'status', label: 'Status', value: opt ? opt.label : this.selectedStatus() });
    }
    if (this.selectedVenue() && this.selectedVenue() !== 'all') {
      const opt = this.venueOptions().find(o => o.value === this.selectedVenue());
      chips.push({ id: 'venue', label: 'Venue', value: opt ? opt.label : this.selectedVenue() });
    }
    if (this.selectedAssessmentMode() && this.selectedAssessmentMode() !== 'all') {
      const opt = this.assessmentModeOptions.find(o => o.value === this.selectedAssessmentMode());
      chips.push({ id: 'assessment', label: 'Assessment', value: opt ? opt.label : this.selectedAssessmentMode() });
    }
    return chips;
  });

  emptyStateType = computed<GridEmptyStateType>(() => {
    if (this.filteredTrainings().length > 0) return 'none';
    if (this.searchQuery().trim()) return 'search_miss';
    if (this.activeFilterCount() > 0) return 'filter_miss';
    return 'true_empty';
  });

  onSearchChange(val: string): void {
    this.searchQuery.set(val || '');
  }

  onRemoveChip(chip: GridActiveChip): void {
    if (chip.id === 'status') this.selectedStatus.set('all');
    if (chip.id === 'venue') this.selectedVenue.set('all');
    if (chip.id === 'assessment') this.selectedAssessmentMode.set('all');
  }

  onFilterToggle(isOpen: boolean): void {
    this.isFilterPanelOpen.set(isOpen);
    if (isOpen) {
      this.draftStatus.set(this.selectedStatus());
      this.draftVenue.set(this.selectedVenue());
      this.draftAssessmentMode.set(this.selectedAssessmentMode());
      this.draftSortBy.set(this.sortBy());
    }
  }

  applyFilters(): void {
    this.selectedStatus.set(this.draftStatus() || 'all');
    this.selectedVenue.set(this.draftVenue() || 'all');
    this.selectedAssessmentMode.set(this.draftAssessmentMode() || 'all');
    this.sortBy.set(this.draftSortBy() || 'newest');
    this.isFilterPanelOpen.set(false);
  }

  cancelFilters(): void {
    this.isFilterPanelOpen.set(false);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedVenue.set('all');
    this.selectedAssessmentMode.set('all');
    this.draftStatus.set('all');
    this.draftVenue.set('all');
    this.draftAssessmentMode.set('all');
    this.draftSortBy.set('newest');
    this.sortBy.set('newest');
    this.isFilterPanelOpen.set(false);
  }

  navigateToCreate(): void {
    this.router.navigate(['/offline-trainings/create']);
  }

  getTrainerDisplayName(item: OfflineTraining): string {
    return item.primaryTrainerName || item.defaultTrainerName || 'Senior Faculty Trainer';
  }

  getTrainerEmail(item: OfflineTraining): string {
    return item.primaryTrainerEmail || item.defaultTrainerEmail || 'trainer@grameenphone.com';
  }

  getTrainerInitial(item: OfflineTraining): string {
    const name = this.getTrainerDisplayName(item);
    return name ? name.charAt(0).toUpperCase() : 'T';
  }

  getDurationHours(item: OfflineTraining): number {
    return item.durationHours || (item.sessionMeta?.durationMinutes ? Math.round(item.sessionMeta.durationMinutes / 60) : 4);
  }

  getDurationDisplay(item: OfflineTraining): string {
    const hours = this.getDurationHours(item);
    return `${hours} Hours`;
  }

  getEmbedsCount(item: OfflineTraining): number {
    const tId = item.trainingId || item.id;
    const direct = this.lmsData.offlineTrainingEmbeddings().filter(e => e.offlineTrainingId === tId).length;
    if (direct > 0) return direct;
    return item.usedInCount !== undefined ? item.usedInCount : 0;
  }

  getAssessmentModeLabel(mode: string | undefined): string {
    if (!mode) return 'Mode C (Manual Marks)';
    if (mode === 'manual_marks' || mode === 'manual') return 'Mode C (Manual Marks)';
    if (mode === 'inline_assessment' || mode === 'inline') return 'Mode B (Inline Exam)';
    if (mode === 'reference_assessment' || mode === 'reference') return 'Mode A (Ref Module)';
    return mode.replace(/_/g, ' ');
  }

  getCapacityDisplay(item: OfflineTraining): string | number {
    return item.maxCapacity || item.roomCapacityAtTagging || 20;
  }

  getCategoryDisplay(item: OfflineTraining): string {
    return item.category || (item.categoryTags && item.categoryTags.length ? item.categoryTags[0] : 'In-Person Workshop');
  }

  // Telemetry counts
  totalCount = computed(() => this.lmsData.offlineTrainings().length);
  publishedCount = computed(() => this.lmsData.offlineTrainings().filter(t => t.status === 'published').length);
  draftCount = computed(() => this.lmsData.offlineTrainings().filter(t => t.status === 'draft').length);
  embeddedCount = computed(() => this.lmsData.offlineTrainingEmbeddings().length);

  ngOnInit(): void {
    this.initEmbedForm();
  }

  initEmbedForm(): void {
    this.embedForm = this.fb.group({
      hostEntityType: ['course', Validators.required],
      hostEntityId: ['CRS-001', Validators.required],
      hostEntityTitle: ['Humanitarian Leadership Fundamentals', Validators.required],
      overrideTrainer: [false],
      customTrainerId: [''],
      customTrainerName: [''],
      customScheduledDate: ['2026-10-15'],
      customScheduledStartTime: ['09:00'],
      customScheduledEndTime: ['17:00'],
      customBatchName: ['Batch-Cohort 2026-A']
    });
  }

  toggleActionMenu(trainingId: string, event: Event): void {
    event.stopPropagation();
    this.openActionMenuId.update(curr => curr === trainingId ? null : trainingId);
  }

  closeActionMenu(): void {
    this.openActionMenuId.set(null);
  }

  navigateToView(id: string): void {
    this.router.navigate(['/offline-trainings/view', id]);
  }

  navigateToEdit(id: string): void {
    this.router.navigate(['/offline-trainings/edit', id]);
  }

  navigateToResults(): void {
    this.router.navigate(['/offline-trainings/results']);
  }

  openEmbedModal(training: OfflineTraining): void {
    this.closeActionMenu();
    this.activeTrainingForEmbed.set(training);
    this.embedForm.reset({
      hostEntityType: 'course',
      hostEntityId: 'CRS-001',
      hostEntityTitle: 'Humanitarian Leadership Fundamentals',
      overrideTrainer: false,
      customTrainerId: '',
      customTrainerName: '',
      customScheduledDate: '2026-10-15',
      customScheduledStartTime: '09:00',
      customScheduledEndTime: '17:00',
      customBatchName: `Cohort-${training.code}-B1`
    });
    this.isEmbedModalOpen.set(true);
  }

  closeEmbedModal(): void {
    this.isEmbedModalOpen.set(false);
    this.activeTrainingForEmbed.set(null);
  }

  submitEmbed(): void {
    if (this.embedForm.invalid || !this.activeTrainingForEmbed()) return;
    const val = this.embedForm.value;
    const training = this.activeTrainingForEmbed()!;

    this.lmsData.embedOfflineTraining({
      offlineTrainingId: training.trainingId || training.id,
      offlineTrainingVersion: training.version || 1,
      hostType: val.hostEntityType || 'course',
      hostId: val.hostEntityId || 'host-01',
      hostTitle: val.hostEntityTitle || 'Host Title',
      effectiveTrainerId: val.overrideTrainer && val.customTrainerId ? val.customTrainerId : training.defaultTrainerId,
      effectiveTrainerName: val.overrideTrainer && val.customTrainerName ? val.customTrainerName : (training.defaultTrainerName || 'Trainer'),
      trainerOverridden: !!(val.overrideTrainer && val.customTrainerId),
      customSessionDate: val.customScheduledDate,
      customSessionTime: val.customScheduledStartTime,
      embeddedBy: 'Admin'
    });

    this.closeEmbedModal();
  }

  // Quick Action Prompts
  promptPublish(training: OfflineTraining): void {
    this.closeActionMenu();
    this.confirmDialog.set({
      isOpen: true,
      title: 'Publish Offline Training Module',
      message: `Publish "${training.title}"? Once published, this offline training module will be immediately available to embed into courses and learning plans.`,
      action: 'publish',
      confirmBtnLabel: 'Publish Module',
      training
    });
  }

  promptDeactivate(training: OfflineTraining): void {
    this.closeActionMenu();
    this.confirmDialog.set({
      isOpen: true,
      title: 'Deactivate Offline Training',
      message: `Are you sure you want to deactivate "${training.title}"? Deactivating will prevent new course embeddings while preserving existing cohort records.`,
      action: 'deactivate',
      confirmBtnLabel: 'Deactivate Training',
      training
    });
  }

  promptReactivate(training: OfflineTraining): void {
    this.closeActionMenu();
    this.confirmDialog.set({
      isOpen: true,
      title: 'Reactivate Offline Training',
      message: `Reactivate "${training.title}" to make it available for new course deliveries?`,
      action: 'reactivate',
      confirmBtnLabel: 'Reactivate Training',
      training
    });
  }

  promptDuplicate(training: OfflineTraining): void {
    this.closeActionMenu();
    const cloned = this.lmsData.duplicateOfflineTraining(training.trainingId);
    if (cloned) {
      this.router.navigate(['/offline-trainings/view', cloned.trainingId]);
    }
  }

  promptDelete(training: OfflineTraining): void {
    this.closeActionMenu();
    this.confirmDialog.set({
      isOpen: true,
      title: 'Delete Training Module',
      message: `Permanently remove "${training.title}"? This action cannot be undone.`,
      action: 'delete',
      confirmBtnLabel: 'Delete Permanently',
      training
    });
  }

  executeConfirmAction(): void {
    const dialog = this.confirmDialog();
    if (!dialog.training) return;

    if (dialog.action === 'publish') {
      this.lmsData.publishOfflineTraining(dialog.training.trainingId);
    } else if (dialog.action === 'deactivate') {
      this.lmsData.deactivateOfflineTraining(dialog.training.trainingId);
    } else if (dialog.action === 'reactivate') {
      this.lmsData.reactivateOfflineTraining(dialog.training.trainingId);
    } else if (dialog.action === 'delete') {
      this.lmsData.deleteOfflineTraining(dialog.training.trainingId);
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
      training: null
    });
  }
}
