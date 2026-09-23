import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineTrainingEmbedding, OfflineTraineeResult } from '../../../models/offline-training.model';
import { ModalOverlayComponent } from '../../../components/modal-overlay/modal-overlay.component';

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
  templateUrl: './offline-training-view.component.html'
})
export class OfflineTrainingViewComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  trainingId = signal<string>('');
  training = computed<OfflineTraining | undefined>(() => this.lmsData.getOfflineTrainingById(this.trainingId()));

  // Active Tab: overview | embeddings | results | materials
  activeTab = signal<'overview' | 'embeddings' | 'results' | 'materials'>('overview');

  // Embeddings for this training
  embeddings = computed<OfflineTrainingEmbedding[]>(() => {
    const t = this.training();
    const id = this.trainingId();
    return this.lmsData.offlineTrainingEmbeddings().filter(e => 
      e.offlineTrainingId === id || (t && (e.offlineTrainingId === t.trainingId || e.offlineTrainingId === t.id))
    );
  });

  // Results for this training
  traineeResults = computed<OfflineTraineeResult[]>(() => {
    const t = this.training();
    const id = this.trainingId();
    return this.lmsData.offlineTraineeResults().filter(r => 
      r.offlineTrainingId === id || (t && (r.offlineTrainingId === t.trainingId || r.offlineTrainingId === t.id))
    );
  });

  // Helper methods for error-free template rendering
  getCategoryDisplay(t: OfflineTraining | undefined): string {
    if (!t) return 'Physical Workshop';
    return t.category || (t.categoryTags && t.categoryTags.length ? t.categoryTags[0] : 'In-Person Workshop');
  }

  getDurationHours(t: OfflineTraining | undefined): number {
    if (!t) return 4;
    return t.durationHours || (t.sessionMeta?.durationMinutes ? Math.round(t.sessionMeta.durationMinutes / 60) : 4);
  }

  getDurationDays(t: OfflineTraining | undefined): number {
    return t?.durationDays || 1;
  }

  getDeliveryModeDisplay(t: OfflineTraining | undefined): string {
    if (!t || !t.deliveryMode) return 'IN-PERSON CLASSROOM';
    return t.deliveryMode.replace(/_/g, ' ').toUpperCase();
  }

  getAssessmentModeDisplay(t: OfflineTraining | undefined): string {
    if (!t) return 'Mode C (Manual Marks)';
    const mode = t.assessmentMode || (t.assessments && t.assessments.length ? t.assessments[0].mode : 'manual_marks');
    if (mode === 'manual_marks' || mode === 'manual') return 'Mode C (Manual Marks)';
    if (mode === 'inline_assessment' || mode === 'inline') return 'Mode B (Inline Exam)';
    if (mode === 'reference_assessment' || mode === 'reference') return 'Mode A (Ref Module)';
    return String(mode).replace(/_/g, ' ');
  }

  getMinAttendance(t: OfflineTraining | undefined): number {
    if (!t) return 80;
    return t.attendanceConfig?.minAttendancePercentage ?? t.attendance?.minimumAttendancePercentage ?? 80;
  }

  getAttendanceModeDisplay(t: OfflineTraining | undefined): string {
    if (!t) return 'Physical Rollcall';
    const mode = t.attendanceConfig?.mode || t.attendance?.mode || 'physical_rollcall';
    return String(mode).replace(/_/g, ' ');
  }

  getCapacityDisplay(t: OfflineTraining | undefined): number {
    return t?.maxCapacity || t?.roomCapacityAtTagging || 25;
  }

  getMaterialsList(t: OfflineTraining | undefined): any[] {
    if (!t) return [];
    if (t.reusableMaterials && t.reusableMaterials.length > 0) return t.reusableMaterials;
    if (t.content && t.content.length > 0) {
      return t.content.map(c => ({
        attachmentId: c.contentId,
        title: c.title,
        fileType: c.subtype || 'pdf',
        isRequiredPreRead: c.isRequired || false,
        url: c.urlOrRef
      }));
    }
    return [];
  }

  getTrainerDisplayName(t: OfflineTraining | undefined): string {
    if (!t) return 'Senior Faculty Trainer';
    return t.primaryTrainerName || t.defaultTrainerName || 'Senior Faculty Trainer';
  }

  getTrainerInitial(t: OfflineTraining | undefined): string {
    const name = this.getTrainerDisplayName(t);
    return name ? name.charAt(0).toUpperCase() : 'T';
  }

  // Embed Modal
  isEmbedModalOpen = signal<boolean>(false);
  embedForm!: FormGroup;

  // Confirmation
  confirmDialog = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'publish' | 'deactivate' | 'reactivate' | 'delete' | null;
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

  openEmbedModal(): void {
    const t = this.training();
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
      customBatchName: `Cohort-${t?.code || 'B1'}`
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
      offlineTrainingId: this.trainingId(),
      offlineTrainingVersion: t.version || 1,
      hostType: val.hostEntityType || 'course',
      hostId: val.hostEntityId || 'host-01',
      hostTitle: val.hostEntityTitle || 'Host Title',
      effectiveTrainerId: val.overrideTrainer && val.customTrainerName ? 'OVR-01' : t.defaultTrainerId,
      effectiveTrainerName: val.overrideTrainer && val.customTrainerName ? val.customTrainerName : (t.defaultTrainerName || 'Trainer'),
      trainerOverridden: !!(val.overrideTrainer && val.customTrainerName),
      customSessionDate: val.customScheduledDate,
      customSessionTime: val.customScheduledStartTime,
      embeddedBy: 'Admin'
    });

    this.closeEmbedModal();
  }

  promptPublish(): void {
    const t = this.training();
    if (!t) return;
    this.confirmDialog.set({
      isOpen: true,
      title: 'Publish Offline Module',
      message: `Publish "${t.title}" to make it available for all course instructors and plan builders?`,
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
      message: `Deactivate "${t.title}"? Existing embeddings and trainee records will be preserved.`,
      action: 'deactivate',
      confirmLabel: 'Deactivate'
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

  executeConfirm(): void {
    const d = this.confirmDialog();
    const t = this.training();
    if (!t) return;

    const targetId = t.trainingId || t.id;
    if (d.action === 'publish') {
      this.lmsData.publishOfflineTraining(targetId);
    } else if (d.action === 'deactivate') {
      this.lmsData.deactivateOfflineTraining(targetId);
    } else if (d.action === 'reactivate') {
      this.lmsData.reactivateOfflineTraining(targetId);
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
}
