import { Component, signal, computed, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineTrainingStatus, OfflineAssessmentMode } from '../../../models/offline-training.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-offline-training-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CustomSelectComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
  viewMode = signal<'grid' | 'table'>('grid');

  // Search & Filters
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all'); // all | draft | published | inactive
  selectedVenue = signal<string>('all');
  selectedAssessmentMode = signal<string>('all');
  sortBy = signal<string>('newest'); // newest | oldest | title_asc | title_desc | duration_desc | capacity_desc

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
      { value: 'all', label: 'All Venues', icon: 'location_city' },
      ...venues.map(v => ({ value: v.venueId, label: v.name, icon: 'domain' }))
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
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.venueName && t.venueName.toLowerCase().includes(q)) ||
        (t.roomName && t.roomName.toLowerCase().includes(q)) ||
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
      list = list.filter(t => t.assessmentMode === assessMode);
    }

    return [...list].sort((a, b) => {
      if (sort === 'newest') return b.trainingId.localeCompare(a.trainingId);
      if (sort === 'oldest') return a.trainingId.localeCompare(b.trainingId);
      if (sort === 'title_asc') return a.title.localeCompare(b.title);
      if (sort === 'title_desc') return b.title.localeCompare(a.title);
      if (sort === 'duration_desc') return b.durationHours - a.durationHours;
      if (sort === 'capacity_desc') return (b.maxCapacity || 0) - (a.maxCapacity || 0);
      return 0;
    });
  });

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
  }
}
