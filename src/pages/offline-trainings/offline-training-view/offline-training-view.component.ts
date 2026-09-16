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
    return this.lmsData.offlineTrainingEmbeddings().filter(e => e.offlineTrainingId === this.trainingId());
  });

  // Results for this training
  traineeResults = computed<OfflineTraineeResult[]>(() => {
    return this.lmsData.offlineTraineeResults().filter(r => r.offlineTrainingId === this.trainingId());
  });

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

    if (d.action === 'publish') {
      this.lmsData.publishOfflineTraining(t.trainingId);
    } else if (d.action === 'deactivate') {
      this.lmsData.deactivateOfflineTraining(t.trainingId);
    } else if (d.action === 'reactivate') {
      this.lmsData.reactivateOfflineTraining(t.trainingId);
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
