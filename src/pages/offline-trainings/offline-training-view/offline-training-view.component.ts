import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineTrainingEmbedding, OfflineTraineeResult } from '../../../models/offline-training.model';
import { Venue, Room } from '../../../models/venue.model';
import { ModalOverlayComponent } from '../../../components/modal-overlay/modal-overlay.component';

export type ViewTab = 'overview' | 'facility' | 'instructors' | 'assessments' | 'materials' | 'embeddings' | 'roster';

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

  // Active Tab
  activeTab = signal<ViewTab>('overview');

  // Filter for Roster tab
  rosterFilter = signal<'all' | 'present' | 'absent' | 'passed'>('all');

  filteredTraineeResults = computed<OfflineTraineeResult[]>(() => {
    const list = this.traineeResults();
    const filter = this.rosterFilter();
    if (filter === 'all') return list;
    if (filter === 'present') return list.filter(r => r.attendance?.status === 'present');
    if (filter === 'absent') return list.filter(r => r.attendance?.status !== 'present');
    if (filter === 'passed') return list.filter(r => r.passed);
    return list;
  });

  markQuickAttendance(traineeId: string, status: 'present' | 'absent'): void {
    const list = this.traineeResults();
    const target = list.find(r => r.traineeId === traineeId);
    if (target) {
      target.attendance = {
        status,
        markedBy: 'Facilitator',
        markedAt: new Date().toISOString()
      };
      if (status === 'absent') {
        target.passed = false;
      }
    }
  }

  // Copy code feedback
  copied = signal<boolean>(false);

  // Embeddings for this training
  embeddings = computed<OfflineTrainingEmbedding[]>(() => {
    const t = this.training();
    const id = this.trainingId();
    const list = this.lmsData.offlineTrainingEmbeddings().filter(e => 
      e.offlineTrainingId === id || (t && (e.offlineTrainingId === t.trainingId || e.offlineTrainingId === t.id))
    );
    if (list.length > 0) return list;
    // Fallback demo embeddings if none yet
    return [
      {
        embeddingId: 'embed-001',
        offlineTrainingId: id,
        offlineTrainingVersion: 1,
        hostType: 'phase',
        hostId: 'phase-01',
        hostTitle: 'Foundation Phase: Safety & Operational Protocols',
        effectiveTrainerId: t?.defaultTrainerId || 'inst-01',
        effectiveTrainerName: t?.defaultTrainerName || 'Dr. Tanvir Hossain',
        effectiveTrainerEmail: t?.defaultTrainerEmail || 'tanvir.hossain@grameenphone.com',
        effectiveTrainerAvatar: t?.defaultTrainerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        trainerOverridden: false,
        customSessionDate: '28/03/2026',
        customSessionTime: '09:00 AM',
        embeddedBy: 'Plan Academic Lead',
        embeddedAt: '15/01/2026 11:30:00'
      },
      {
        embeddingId: 'embed-002',
        offlineTrainingId: id,
        offlineTrainingVersion: 1,
        hostType: 'phase',
        hostId: 'phase-02',
        hostTitle: 'Regional Field Preparedness Phase',
        effectiveTrainerId: 'inst-02',
        effectiveTrainerName: 'Engr. Sarah Rahman',
        effectiveTrainerEmail: 'sarah.rahman@grameenphone.com',
        effectiveTrainerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        trainerOverridden: true,
        customSessionDate: '02/04/2026',
        customSessionTime: '10:00 AM',
        embeddedBy: 'Regional Phaser Lead',
        embeddedAt: '20/01/2026 14:00:00'
      }
    ];
  });

  // Results for this training
  traineeResults = computed<OfflineTraineeResult[]>(() => {
    const t = this.training();
    const id = this.trainingId();
    const results = this.lmsData.offlineTraineeResults().filter(r => 
      r.offlineTrainingId === id || (t && (r.offlineTrainingId === t.trainingId || r.offlineTrainingId === t.id))
    );
    if (results.length > 0) return results;
    // Fallback sample results if empty
    return [
      {
        traineeId: 'usr-101',
        traineeName: 'Shakil Ahmed',
        traineeEmail: 'shakil.ahmed@grameenphone.com',
        traineeAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        embeddingId: 'embed-001',
        offlineTrainingId: id,
        manualMarks: [{ assessmentRef: 'CPR Exam', mark: 88, maxMark: 100, remark: 'Excellent tempo', enteredBy: 'Dr. Tanvir', enteredAt: '28/03/2026' }],
        attendance: { status: 'present', markedBy: 'Dr. Tanvir', markedAt: '28/03/2026 09:05:00' },
        onlineAssessmentPassed: true,
        onlineScore: 92,
        overallScore: 90,
        completed: true,
        passed: true,
        updatedAt: '28/03/2026'
      },
      {
        traineeId: 'usr-102',
        traineeName: 'Rashedul Karim',
        traineeEmail: 'rashedul.karim@grameenphone.com',
        traineeAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        embeddingId: 'embed-001',
        offlineTrainingId: id,
        manualMarks: [{ assessmentRef: 'CPR Exam', mark: 74, maxMark: 100, remark: 'Satisfactory', enteredBy: 'Dr. Tanvir', enteredAt: '28/03/2026' }],
        attendance: { status: 'present', markedBy: 'Dr. Tanvir', markedAt: '28/03/2026 09:10:00' },
        onlineAssessmentPassed: true,
        onlineScore: 80,
        overallScore: 77,
        completed: true,
        passed: true,
        updatedAt: '28/03/2026'
      },
      {
        traineeId: 'usr-103',
        traineeName: 'Mahmuda Akter',
        traineeEmail: 'mahmuda.akter@grameenphone.com',
        traineeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        embeddingId: 'embed-001',
        offlineTrainingId: id,
        manualMarks: [{ assessmentRef: 'CPR Exam', mark: 95, maxMark: 100, remark: 'Flawless execution', enteredBy: 'Dr. Tanvir', enteredAt: '28/03/2026' }],
        attendance: { status: 'present', markedBy: 'Dr. Tanvir', markedAt: '28/03/2026 09:00:00' },
        onlineAssessmentPassed: true,
        onlineScore: 98,
        overallScore: 96,
        completed: true,
        passed: true,
        updatedAt: '28/03/2026'
      },
      {
        traineeId: 'usr-104',
        traineeName: 'Kamrul Hassan',
        traineeEmail: 'kamrul.hassan@grameenphone.com',
        traineeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        embeddingId: 'embed-001',
        offlineTrainingId: id,
        manualMarks: [],
        attendance: { status: 'absent', markedBy: 'Dr. Tanvir', markedAt: '28/03/2026 09:30:00', remarks: 'Excused absence' },
        onlineAssessmentPassed: false,
        completed: false,
        passed: false,
        updatedAt: '28/03/2026'
      }
    ];
  });

  // Venue details
  venueDetails = computed<Venue | undefined>(() => {
    const t = this.training();
    if (!t || !t.venueId) return undefined;
    return this.lmsData.venues().find(v => v.venueId === t.venueId || v.id === t.venueId);
  });

  currentRoom = computed<Room | undefined>(() => {
    const t = this.training();
    const v = this.venueDetails();
    if (!t || !v || !v.rooms) return undefined;
    return v.rooms.find(r => r.roomId === t.roomId || r.id === t.roomId || r.name === t.roomName);
  });

  // Counts for tabs
  assessmentsCount = computed<number>(() => {
    const t = this.training();
    return t?.assessments?.length || 2;
  });

  materialsCount = computed<number>(() => {
    const t = this.training();
    return this.getMaterialsList(t).length || 2;
  });

  embeddingsCount = computed<number>(() => this.embeddings().length);

  rosterCount = computed<number>(() => this.traineeResults().length);

  // Helper methods for error-free template rendering
  getCategoryDisplay(t: OfflineTraining | undefined): string {
    if (!t) return 'Emergency Response';
    return t.category || (t.categoryTags && t.categoryTags.length ? t.categoryTags[0] : 'Emergency Response');
  }

  getDurationHours(t: OfflineTraining | undefined): number {
    if (!t) return 4;
    return t.durationHours || (t.sessionMeta?.durationMinutes ? Math.round(t.sessionMeta.durationMinutes / 60) : 4);
  }

  getDurationMinutes(t: OfflineTraining | undefined): number {
    if (!t) return 240;
    return t.sessionMeta?.durationMinutes || (t.durationHours ? t.durationHours * 60 : 240);
  }

  getDurationDays(t: OfflineTraining | undefined): number {
    return t?.durationDays || 1;
  }

  getDeliveryModeDisplay(t: OfflineTraining | undefined): string {
    if (!t || !t.deliveryMode) return 'In-Person Practical Workshop';
    return t.deliveryMode.replace(/_/g, ' ');
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
    if (!t) return 100;
    return t.attendanceConfig?.minAttendancePercentage ?? t.attendance?.minimumAttendancePercentage ?? 100;
  }

  getAttendanceModeDisplay(t: OfflineTraining | undefined): string {
    if (!t) return 'Facilitator Roll-Call';
    const mode = t.attendanceConfig?.mode || t.attendance?.mode || 'Facilitator Roll-Call';
    if (mode === 'physical_rollcall') return 'Facilitator Roll-Call';
    return String(mode).replace(/_/g, ' ');
  }

  getCapacityDisplay(t: OfflineTraining | undefined): number {
    return t?.maxCapacity || t?.roomCapacityAtTagging || 65;
  }

  getMaterialsList(t: OfflineTraining | undefined): any[] {
    if (!t) {
      return [
        {
          attachmentId: 'c-01',
          title: 'Trauma Care & Triage Handbook (PDF Standard)',
          fileType: 'pdf',
          fileSize: '4.8 MB',
          isRequiredPreRead: true,
          url: 'https://assets.onelms.enterprise/docs/first-aid-triage-2026.pdf'
        },
        {
          attachmentId: 'c-02',
          title: 'AED Device Deployment & Rhythm Analysis Demo',
          fileType: 'video',
          fileSize: '12 mins',
          isRequiredPreRead: false,
          url: 'https://assets.onelms.enterprise/videos/aed-deployment.mp4'
        }
      ];
    }
    if (t.reusableMaterials && t.reusableMaterials.length > 0) return t.reusableMaterials;
    if (t.content && t.content.length > 0) {
      return t.content.map(c => ({
        attachmentId: c.contentId || c.attachmentId,
        title: c.title,
        fileType: c.subtype || c.fileType || 'pdf',
        fileSize: c.fileSizeOrDuration || (c.fileSizeBytes ? `${(c.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : '1.5 MB'),
        isRequiredPreRead: c.isRequired || c.isRequiredPreRead || false,
        url: c.urlOrRef || c.fileUrl
      }));
    }
    return [
      {
        attachmentId: 'c-01',
        title: 'Trauma Care & Triage Handbook (PDF Standard)',
        fileType: 'pdf',
        fileSize: '4.8 MB',
        isRequiredPreRead: true
      },
      {
        attachmentId: 'c-02',
        title: 'AED Device Deployment & Rhythm Analysis Demo',
        fileType: 'video',
        fileSize: '12 mins',
        isRequiredPreRead: false
      }
    ];
  }

  getTrainerDisplayName(t: OfflineTraining | undefined): string {
    if (!t) return 'Dr. Tanvir Hossain';
    return t.primaryTrainerName || t.defaultTrainerName || 'Dr. Tanvir Hossain';
  }

  getTrainerInitial(t: OfflineTraining | undefined): string {
    const name = this.getTrainerDisplayName(t);
    return name ? name.charAt(0).toUpperCase() : 'T';
  }

  copyCode(code: string): void {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  printTraining(): void {
    window.print();
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

