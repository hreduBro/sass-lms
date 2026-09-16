import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  OfflineTraining, 
  OfflineTrainingEmbedding, 
  OfflineTraineeResult,
  OfflineAssessmentItem,
  OfflineContentItem,
  AttendanceStatus
} from '../../../models/offline-training.model';
import { ModalOverlayComponent } from '../../../components/modal-overlay/modal-overlay.component';

export type OfflineViewTab = 'overview' | 'facility' | 'faculty' | 'assessments' | 'materials' | 'embeddings' | 'results';

@Component({
  selector: 'app-offline-training-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ModalOverlayComponent
  ],
  templateUrl: './offline-training-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfflineTrainingViewComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  trainingId = signal<string>('');
  training = computed<OfflineTraining | undefined>(() => this.lmsData.getOfflineTrainingById(this.trainingId()));

  // Active Tab navigation
  activeTab = signal<OfflineViewTab>('overview');

  // Embeddings for this training (handles matching by id, code, or trainingId)
  embeddings = computed<OfflineTrainingEmbedding[]>(() => {
    const t = this.training();
    const id = this.trainingId();
    return this.lmsData.offlineTrainingEmbeddings().filter(e => 
      e.offlineTrainingId === id || (t && (e.offlineTrainingId === t.id || e.offlineTrainingId === t.code || (t as any).trainingId === e.offlineTrainingId))
    );
  });

  // Results for this training
  traineeResults = computed<OfflineTraineeResult[]>(() => {
    const t = this.training();
    const id = this.trainingId();
    return this.lmsData.offlineTraineeResults().filter(r => 
      r.offlineTrainingId === id || (t && (r.offlineTrainingId === t.id || r.offlineTrainingId === t.code || (t as any).trainingId === r.offlineTrainingId))
    );
  });

  // Result filter for gradebook tab
  resultFilter = signal<'all' | 'present' | 'absent' | 'passed' | 'failed'>('all');

  filteredResults = computed<OfflineTraineeResult[]>(() => {
    const results = this.traineeResults();
    const filter = this.resultFilter();
    if (filter === 'all') return results;
    if (filter === 'present') return results.filter(r => r.attendance.status === 'present');
    if (filter === 'absent') return results.filter(r => r.attendance.status === 'absent' || r.attendance.status === 'late');
    if (filter === 'passed') return results.filter(r => r.passed);
    if (filter === 'failed') return results.filter(r => !r.passed);
    return results;
  });

  // Computed helper signals for rich template consumption
  trainingCode = computed(() => this.training()?.code || this.trainingId() || 'OFL-TRAINING');
  trainingTitle = computed(() => this.training()?.title || 'Offline Training Masterclass');
  trainingStatus = computed(() => this.training()?.status || 'draft');

  categoryTags = computed<string[]>(() => {
    const t = this.training();
    if (!t) return ['Training'];
    if (t.categoryTags && t.categoryTags.length > 0) return t.categoryTags;
    if (t.category) return [t.category];
    return ['Technical', 'Hands-On'];
  });

  durationFormatted = computed<string>(() => {
    const t = this.training();
    if (!t) return '4 Hours';
    if (t.durationHours) {
      return `${t.durationHours} Hours${t.durationDays ? ` (${t.durationDays} Days)` : ''}`;
    }
    if (t.sessionMeta?.durationMinutes) {
      const hrs = Math.round((t.sessionMeta.durationMinutes / 60) * 10) / 10;
      return `${hrs} Hours (${t.sessionMeta.durationMinutes} mins)`;
    }
    return '3 Hours (In-Person)';
  });

  sessionDate = computed<string>(() => this.training()?.sessionMeta?.sessionDate || 'Scheduled on-demand');
  sessionTime = computed<string>(() => this.training()?.sessionMeta?.startTime || '10:00 AM');
  cohortName = computed<string>(() => this.training()?.sessionMeta?.cohortName || 'Enterprise Cohort');

  venueName = computed<string>(() => this.training()?.venueName || 'Executive Training Institute');
  roomName = computed<string>(() => this.training()?.roomName || 'Skills Lab 01');
  roomCapacity = computed<number>(() => this.training()?.roomCapacityAtTagging || this.training()?.maxCapacity || 30);

  trainerName = computed<string>(() => this.training()?.defaultTrainerName || this.training()?.primaryTrainerName || 'Senior Enterprise Facilitator');
  trainerEmail = computed<string>(() => this.training()?.defaultTrainerEmail || this.training()?.primaryTrainerEmail || 'trainer@enterprise.lms');
  trainerAvatar = computed<string>(() => this.training()?.defaultTrainerAvatar || '');

  minAttendance = computed<number>(() => this.training()?.attendance?.minimumAttendancePercentage ?? this.training()?.attendance?.minAttendancePercentage ?? 80);
  attendanceRequired = computed<boolean>(() => this.training()?.attendance?.required ?? true);

  completionRuleFormatted = computed<string>(() => {
    const rule = this.training()?.completionRule;
    if (rule === 'attended_and_passed') return 'Attendance & Assessment Pass Required';
    if (rule === 'passed_only') return 'Assessment Pass Only';
    if (rule === 'attended_only') return 'Verified Attendance Only';
    return 'Attendance or Score Benchmark';
  });

  assessments = computed<OfflineAssessmentItem[]>(() => this.training()?.assessments || []);
  materials = computed<OfflineContentItem[]>(() => {
    const t = this.training();
    if (!t) return [];
    if (t.content && t.content.length > 0) return t.content;
    if (t.reusableMaterials && t.reusableMaterials.length > 0) return t.reusableMaterials;
    return [];
  });

  totalLearnersCount = computed<number>(() => this.traineeResults().length);
  passedLearnersCount = computed<number>(() => this.traineeResults().filter(r => r.passed).length);

  passRate = computed<number>(() => {
    const total = this.totalLearnersCount();
    if (total === 0) return 100;
    return Math.round((this.passedLearnersCount() / total) * 100);
  });

  attendanceRate = computed<number>(() => {
    const total = this.totalLearnersCount();
    if (total === 0) return 100;
    const present = this.traineeResults().filter(r => r.attendance.status === 'present').length;
    return Math.round((present / total) * 100);
  });

  // Embed Modal State
  isEmbedModalOpen = signal<boolean>(false);
  embedForm!: FormGroup;

  // Confirmation Dialog State
  confirmDialog = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'publish' | 'deactivate' | 'reactivate' | 'delete' | 'duplicate' | null;
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    confirmLabel: 'Proceed'
  });

  ngOnInit(): void {
    this.initEmbedForm();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.trainingId.set(params['id']);
      }
    });
  }

  initEmbedForm(): void {
    this.embedForm = this.fb.group({
      hostEntityType: ['course', Validators.required],
      hostEntityId: ['course-cloud-202', Validators.required],
      hostEntityTitle: ['Cloud Solutions Architect Certification Track', Validators.required],
      overrideTrainer: [false],
      customTrainerName: [''],
      customScheduledDate: ['2026-05-15', Validators.required],
      customScheduledStartTime: ['10:00 AM', Validators.required],
      customBatchName: ['Q2 Special Batch']
    });
  }

  openEmbedModal(): void {
    const t = this.training();
    this.embedForm.reset({
      hostEntityType: 'course',
      hostEntityId: 'course-cloud-202',
      hostEntityTitle: 'Cloud Solutions Architect Certification Track',
      overrideTrainer: false,
      customTrainerName: '',
      customScheduledDate: '2026-05-15',
      customScheduledStartTime: '10:00 AM',
      customBatchName: `Cohort-${t?.code || '2026'}`
    });
    this.isEmbedModalOpen.set(true);
  }

  closeEmbedModal(): void {
    this.isEmbedModalOpen.set(false);
  }

  submitEmbed(): void {
    if (this.embedForm.invalid || !this.training()) return;
    const val = this.embedForm.value;
    const t = this.training()!;

    this.lmsData.embedOfflineTraining({
      offlineTrainingId: t.id || this.trainingId(),
      offlineTrainingVersion: t.version || 1,
      hostType: val.hostEntityType || 'course',
      hostId: val.hostEntityId || 'course-01',
      hostTitle: val.hostEntityTitle || 'Enterprise Course Track',
      effectiveTrainerId: val.overrideTrainer && val.customTrainerName ? 'OVR-01' : t.defaultTrainerId,
      effectiveTrainerName: val.overrideTrainer && val.customTrainerName ? val.customTrainerName : (t.defaultTrainerName || 'Lead Trainer'),
      trainerOverridden: !!(val.overrideTrainer && val.customTrainerName),
      customSessionDate: val.customScheduledDate,
      customSessionTime: val.customScheduledStartTime,
      embeddedBy: 'Curriculum Administrator'
    });

    this.closeEmbedModal();
    this.activeTab.set('embeddings');
  }

  promptPublish(): void {
    const t = this.training();
    if (!t) return;
    this.confirmDialog.set({
      isOpen: true,
      title: 'Publish Offline Module',
      message: `Publish "${t.title}" (${t.code})? It will immediately become eligible for course embedding and cohort scheduling.`,
      action: 'publish',
      confirmLabel: 'Publish Module'
    });
  }

  promptDeactivate(): void {
    const t = this.training();
    if (!t) return;
    this.confirmDialog.set({
      isOpen: true,
      title: 'Deactivate Training',
      message: `Deactivate "${t.title}"? Existing embeddings and learner records remain intact, but new embeddings will be prevented.`,
      action: 'deactivate',
      confirmLabel: 'Deactivate Training'
    });
  }

  promptReactivate(): void {
    const t = this.training();
    if (!t) return;
    this.confirmDialog.set({
      isOpen: true,
      title: 'Reactivate Training',
      message: `Reactivate "${t.title}" to restore it to the active training catalog?`,
      action: 'reactivate',
      confirmLabel: 'Reactivate'
    });
  }

  promptDuplicate(): void {
    const t = this.training();
    if (!t) return;
    this.confirmDialog.set({
      isOpen: true,
      title: 'Duplicate Training Module',
      message: `Create a copy of "${t.title}" with a draft version for syllabus customization?`,
      action: 'duplicate',
      confirmLabel: 'Duplicate'
    });
  }

  promptDelete(): void {
    const t = this.training();
    if (!t) return;
    this.confirmDialog.set({
      isOpen: true,
      title: 'Delete Training Module',
      message: `Are you sure you want to delete "${t.title}"? This action cannot be undone.`,
      action: 'delete',
      confirmLabel: 'Delete'
    });
  }

  executeConfirm(): void {
    const d = this.confirmDialog();
    const t = this.training();
    if (!t) return;
    const targetId = t.id || (t as any).trainingId || t.code;

    if (d.action === 'publish') {
      this.lmsData.publishOfflineTraining(targetId);
    } else if (d.action === 'deactivate') {
      this.lmsData.deactivateOfflineTraining(targetId);
    } else if (d.action === 'reactivate') {
      this.lmsData.reactivateOfflineTraining(targetId);
    } else if (d.action === 'duplicate') {
      const copy = this.lmsData.duplicateOfflineTraining(targetId);
      if (copy) {
        this.router.navigate(['/offline-trainings/view', copy.id]);
      }
    } else if (d.action === 'delete') {
      const res = this.lmsData.deleteOfflineTraining(targetId);
      if (res.success) {
        this.router.navigate(['/offline-trainings']);
      }
    }

    this.closeConfirm();
  }

  closeConfirm(): void {
    this.confirmDialog.set({
      isOpen: false,
      title: '',
      message: '',
      action: null,
      confirmLabel: 'Proceed'
    });
  }

  updateTraineeAttendance(result: OfflineTraineeResult, status: AttendanceStatus): void {
    this.lmsData.saveOfflineAttendance(result.embeddingId, result.traineeId, status);
  }

  exportRosterCsv(): void {
    const results = this.traineeResults();
    if (results.length === 0) {
      this.lmsData.showToast('No trainee records to export.', 'info', 3000, 'Export Empty');
      return;
    }

    const headers = ['Trainee Name', 'Email', 'Attendance Status', 'Score', 'Passed Status', 'Updated Date'];
    const rows = results.map(r => [
      `"${r.traineeName}"`,
      `"${r.traineeEmail}"`,
      `"${r.attendance.status}"`,
      `"${r.overallScore || r.manualMarks?.[0]?.mark || 'N/A'}"`,
      `"${r.passed ? 'PASSED' : 'FAILED'}"`,
      `"${r.updatedAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${this.trainingCode()}-roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.lmsData.showToast('Trainee roster exported as CSV.', 'success', 2500, 'Export Complete');
  }

  printPage(): void {
    window.print();
  }
}
