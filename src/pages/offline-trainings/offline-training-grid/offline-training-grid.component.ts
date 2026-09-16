import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineTrainingStatus, OfflineAssessmentMode } from '../../../models/offline-training.model';
import { SelectOption } from '../../../components/custom-select/custom-select.component';
import { ModalOverlayComponent } from '../../../components/modal-overlay/modal-overlay.component';

@Component({
  selector: 'app-offline-training-grid',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ModalOverlayComponent
  ],
  templateUrl: './offline-training-grid.component.html',
  host: {
    '(document:click)': 'onDocumentClick()'
  }
})
export class OfflineTrainingGridComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Permissions
  permissions = this.lmsData.offlineTrainingPermissions;

  // View Mode: Grid vs Table
  viewMode = signal<'grid' | 'table'>('grid');

  // Search & Applied Filters
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all'); // all | draft | published | inactive
  selectedVenue = signal<string>('all');
  selectedAssessmentMode = signal<string>('all');
  sortBy = signal<string>('newest'); // newest | oldest | title_asc | title_desc | duration_desc | capacity_desc

  // Drawer Draft Filters (controlled inside FILTER OFFLINE TRAININGS drawer)
  draftStatus = signal<string>('all');
  draftVenue = signal<string>('all');
  draftAssessmentMode = signal<string>('all');
  draftSort = signal<string>('newest');

  // Expandable Filter State
  isFilterExpanded = signal<boolean>(false);
  openFilterDropdown = signal<'status' | 'venue' | 'assessment' | 'sort' | null>(null);

  toggleFilterDrawer() {
    const nextState = !this.isFilterExpanded();
    if (nextState) {
      // Synchronize draft selections with currently applied filters
      this.draftStatus.set(this.selectedStatus());
      this.draftVenue.set(this.selectedVenue());
      this.draftAssessmentMode.set(this.selectedAssessmentMode());
      this.draftSort.set(this.sortBy());
    }
    this.openFilterDropdown.set(null);
    this.isFilterExpanded.set(nextState);
  }

  applyDrawerFilter() {
    this.selectedStatus.set(this.draftStatus());
    this.selectedVenue.set(this.draftVenue());
    this.selectedAssessmentMode.set(this.draftAssessmentMode());
    this.sortBy.set(this.draftSort());
    this.openFilterDropdown.set(null);
    this.isFilterExpanded.set(false);
  }

  cancelDrawer() {
    this.draftStatus.set(this.selectedStatus());
    this.draftVenue.set(this.selectedVenue());
    this.draftAssessmentMode.set(this.selectedAssessmentMode());
    this.draftSort.set(this.sortBy());
    this.openFilterDropdown.set(null);
    this.isFilterExpanded.set(false);
  }

  clearDrawerSelections() {
    this.draftStatus.set('all');
    this.draftVenue.set('all');
    this.draftAssessmentMode.set('all');
    this.draftSort.set('newest');
    this.selectedStatus.set('all');
    this.selectedVenue.set('all');
    this.selectedAssessmentMode.set('all');
    this.sortBy.set('newest');
    this.openFilterDropdown.set(null);
  }

  hasActiveFilters = computed(() => {
    return this.selectedStatus() !== 'all' || 
           this.selectedVenue() !== 'all' || 
           this.selectedAssessmentMode() !== 'all' || 
           this.sortBy() !== 'newest';
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedVenue() !== 'all') count++;
    if (this.selectedAssessmentMode() !== 'all') count++;
    if (this.sortBy() !== 'newest') count++;
    return count;
  });

  // Labels for Applied Filters (Chips & Bar)
  currentStatusLabel = computed(() => {
    const s = this.selectedStatus();
    if (s === 'all') return 'All Statuses';
    const found = this.statusOptions.find(o => o.value === s);
    return found ? found.label : 'All Statuses';
  });

  currentVenueLabel = computed(() => {
    const v = this.selectedVenue();
    if (v === 'all') return 'All Venues';
    const found = this.venueOptions().find(o => o.value === v);
    return found ? found.label : 'All Venues';
  });

  currentAssessmentLabel = computed(() => {
    const a = this.selectedAssessmentMode();
    if (a === 'all') return 'All Assessment Types';
    if (a === 'reference_assessment') return 'Mode A (Ref)';
    if (a === 'inline_assessment') return 'Mode B (Inline)';
    if (a === 'manual_marks') return 'Mode C (Manual)';
    if (a === 'none') return 'No Assessment';
    return 'All Assessment Types';
  });

  currentSortLabel = computed(() => {
    const s = this.sortBy();
    const found = this.sortOptions.find(o => o.value === s);
    return found ? found.label : 'Newest First';
  });

  // Labels for Drawer Draft Selectors
  draftStatusLabel = computed(() => {
    const s = this.draftStatus();
    if (s === 'all') return 'All Statuses';
    const found = this.statusOptions.find(o => o.value === s);
    return found ? found.label : 'All Statuses';
  });

  draftVenueLabel = computed(() => {
    const v = this.draftVenue();
    if (v === 'all') return 'All Venues';
    const found = this.venueOptions().find(o => o.value === v);
    return found ? found.label : 'All Venues';
  });

  draftAssessmentLabel = computed(() => {
    const a = this.draftAssessmentMode();
    if (a === 'all') return 'All Assessment Types';
    const found = this.assessmentModeOptions.find(o => o.value === a);
    return found ? found.label : 'All Assessment Types';
  });

  draftSortLabel = computed(() => {
    const s = this.draftSort();
    const found = this.sortOptions.find(o => o.value === s);
    return found ? found.label : 'Newest First';
  });

  toggleFilterDropdown(type: 'status' | 'venue' | 'assessment' | 'sort', event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.openFilterDropdown.update(curr => curr === type ? null : type);
  }

  selectFilterValue(type: 'status' | 'venue' | 'assessment' | 'sort', value: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (this.isFilterExpanded()) {
      if (type === 'status') this.draftStatus.set(value);
      else if (type === 'venue') this.draftVenue.set(value);
      else if (type === 'assessment') this.draftAssessmentMode.set(value);
      else if (type === 'sort') this.draftSort.set(value);
    } else {
      if (type === 'status') {
        this.selectedStatus.set(value);
        this.draftStatus.set(value);
      } else if (type === 'venue') {
        this.selectedVenue.set(value);
        this.draftVenue.set(value);
      } else if (type === 'assessment') {
        this.selectedAssessmentMode.set(value);
        this.draftAssessmentMode.set(value);
      } else if (type === 'sort') {
        this.sortBy.set(value);
        this.draftSort.set(value);
      }
    }
    this.openFilterDropdown.set(null);
  }

  resetFilter(type: 'status' | 'venue' | 'assessment' | 'sort', event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (type === 'status') {
      this.selectedStatus.set('all');
      this.draftStatus.set('all');
    } else if (type === 'venue') {
      this.selectedVenue.set('all');
      this.draftVenue.set('all');
    } else if (type === 'assessment') {
      this.selectedAssessmentMode.set('all');
      this.draftAssessmentMode.set('all');
    } else if (type === 'sort') {
      this.sortBy.set('newest');
      this.draftSort.set('newest');
    }
  }

  onDocumentClick() {
    this.openFilterDropdown.set(null);
    this.openActionMenuId.set(null);
  }

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
    { value: 'all', label: 'Status: All', icon: 'filter_list' },
    { value: 'published', label: 'Published', icon: 'verified', badge: 'Published', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    { value: 'draft', label: 'Draft', icon: 'edit_note', badge: 'Draft', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
    { value: 'inactive', label: 'Inactive', icon: 'cancel', badge: 'Inactive', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' }
  ];

  sortOptions: SelectOption[] = [
    { value: 'newest', label: 'Newest First', icon: 'schedule' },
    { value: 'oldest', label: 'Oldest First', icon: 'history' },
    { value: 'title_asc', label: 'Title (A-Z)', icon: 'sort_by_alpha' },
    { value: 'title_desc', label: 'Title (Z-A)', icon: 'sort_by_alpha' },
    { value: 'duration_desc', label: 'Longest Duration', icon: 'timelapse' },
    { value: 'capacity_desc', label: 'Max Seating Capacity', icon: 'groups' }
  ];

  venueOptions = computed<SelectOption[]>(() => {
    const venues = this.lmsData.venues();
    return [
      { value: 'all', label: 'All Venues', icon: 'apartment' },
      ...venues.map(v => ({ value: v.venueId, label: v.name, icon: 'apartment' }))
    ];
  });

  assessmentModeOptions: SelectOption[] = [
    { value: 'all', label: 'All Assessment Types', icon: 'fact_check' },
    { value: 'reference_assessment', label: 'Referenced Assessment (Mode A)', icon: 'link' },
    { value: 'inline_assessment', label: 'Inline Assessment (Mode B)', icon: 'quiz' },
    { value: 'manual_marks', label: 'Manual Instructor Marks (Mode C)', icon: 'rate_review' },
    { value: 'none', label: 'No Assessment', icon: 'remove_circle_outline' }
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
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.categoryTags && Array.isArray(t.categoryTags) && t.categoryTags.some(tag => tag && tag.toLowerCase().includes(q))) ||
        (t.venueName && t.venueName.toLowerCase().includes(q)) ||
        (t.roomName && t.roomName.toLowerCase().includes(q)) ||
        (t.defaultTrainerName && t.defaultTrainerName.toLowerCase().includes(q)) ||
        (t.primaryTrainerName && t.primaryTrainerName.toLowerCase().includes(q))
      );
    }

    if (status !== 'all') {
      list = list.filter(t => t.status === status);
    }

    if (venue !== 'all') {
      list = list.filter(t => t.venueId === venue);
    }

    if (assessMode !== 'all') {
      list = list.filter(t => {
        if (assessMode === 'reference_assessment') {
          return t.assessmentMode === 'reference_assessment' || (t.assessments && t.assessments.some(a => a.mode === 'reference'));
        }
        if (assessMode === 'inline_assessment') {
          return t.assessmentMode === 'inline_assessment' || (t.assessments && t.assessments.some(a => a.mode === 'inline'));
        }
        if (assessMode === 'manual_marks') {
          return t.assessmentMode === 'manual_marks' || (t.assessments && t.assessments.some(a => a.mode === 'manual'));
        }
        if (assessMode === 'none') {
          return t.assessmentMode === 'none' || !t.assessments || t.assessments.length === 0;
        }
        return t.assessmentMode === assessMode;
      });
    }

    return [...list].sort((a, b) => {
      if (sort === 'newest') {
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.trainingId || b.id || '').localeCompare(a.trainingId || a.id || '');
      }
      if (sort === 'oldest') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) return dateA - dateB;
        return (a.trainingId || a.id || '').localeCompare(b.trainingId || b.id || '');
      }
      if (sort === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sort === 'title_desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      if (sort === 'duration_desc') {
        const durB = b.durationHours || (b.sessionMeta?.durationMinutes ? b.sessionMeta.durationMinutes / 60 : 0);
        const durA = a.durationHours || (a.sessionMeta?.durationMinutes ? a.sessionMeta.durationMinutes / 60 : 0);
        return durB - durA;
      }
      if (sort === 'capacity_desc') {
        const capB = b.maxCapacity || b.roomCapacityAtTagging || 0;
        const capA = a.maxCapacity || a.roomCapacityAtTagging || 0;
        return capB - capA;
      }
      return 0;
    });
  });

  // Telemetry counts
  totalCount = computed(() => this.lmsData.offlineTrainings().length);
  publishedCount = computed(() => this.lmsData.offlineTrainings().filter(t => t.status === 'published').length);
  draftCount = computed(() => this.lmsData.offlineTrainings().filter(t => t.status === 'draft').length);
  embeddedCount = computed(() => this.lmsData.offlineTrainingEmbeddings().length);

  getEmbeddingCount(trainingId?: string): number {
    if (!trainingId) return 0;
    return this.lmsData.offlineTrainingEmbeddings().filter(e => e.offlineTrainingId === trainingId).length;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs';
      case 'draft':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800 shadow-2xs';
      case 'inactive':
      default:
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-2xs';
    }
  }

  getCapacityDisplay(item: OfflineTraining): string {
    if (item.maxCapacity) {
      return `${item.maxCapacity} seats`;
    }
    if (item.roomCapacityAtTagging) {
      return `${item.roomCapacityAtTagging} seats`;
    }
    return '30 seats';
  }

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

  navigateToCreate(): void {
    this.router.navigate(['/offline-trainings/create']);
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

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedVenue.set('all');
    this.selectedAssessmentMode.set('all');
    this.sortBy.set('newest');
    this.clearDrawerSelections();
  }
}
