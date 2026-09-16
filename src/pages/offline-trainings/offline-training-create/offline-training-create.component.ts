import { Component, signal, computed, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineAssessmentMode, OfflineAttendanceConfig, OfflineContentAttachment, ManualMarkCriteria } from '../../../models/offline-training.model';
import { Venue, Room } from '../../../models/venue.model';

@Component({
  selector: 'app-offline-training-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './offline-training-create.component.html'
})
export class OfflineTrainingCreateComponent implements OnInit {
  private lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  trainingForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  trainingId = signal<string | null>(null);

  // 5 Steps Wizard
  currentStep = signal<number>(1);

  // Available Venues and Rooms
  venues = computed(() => this.lmsData.venues().filter(v => v.status === 'active'));
  selectedVenueId = signal<string>('');
  availableRooms = computed<Room[]>(() => {
    const venue = this.venues().find(v => v.venueId === this.selectedVenueId());
    return venue ? venue.rooms.filter(r => r.status === 'active') : [];
  });
  selectedRoomId = signal<string>('');
  selectedRoom = computed<Room | undefined>(() => {
    return this.availableRooms().find(r => r.roomId === this.selectedRoomId());
  });

  // Certificate templates
  certTemplates = computed(() => this.lmsData.certificateTemplates().filter(t => (t as any).status === 'active' || true));

  // Content attachment custom items
  attachments = signal<OfflineContentAttachment[]>([
    {
      attachmentId: 'att-1',
      title: 'Workshop Participant Handbook & Case Studies',
      fileType: 'pdf',
      fileUrl: '/assets/docs/handbook.pdf',
      fileSizeBytes: 2450000,
      isRequiredPreRead: true,
      displayOrder: 1
    }
  ]);

  ngOnInit(): void {
    this.initForm();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.trainingId.set(params['id']);
        this.loadTraining(params['id']);
      }
    });
  }

  initForm(): void {
    const defaultVenue = this.venues()[0];
    const defaultRoom = defaultVenue?.rooms[0];

    this.trainingForm = this.fb.group({
      // Step 1: Basic Info
      code: [`TRN-OFF-${Date.now().toString().slice(-4)}`, [Validators.required, Validators.maxLength(30)]],
      title: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      category: ['Leadership & Field Operations', Validators.required],
      deliveryMode: ['in_person', Validators.required],
      targetAudience: ['Field Officers & Area Managers'],
      durationHours: [16, [Validators.required, Validators.min(1), Validators.max(200)]],
      durationDays: [2, [Validators.required, Validators.min(1)]],

      // Step 2: Venue & Room
      venueId: [defaultVenue ? defaultVenue.venueId : '', Validators.required],
      roomId: [defaultRoom ? defaultRoom.roomId : '', Validators.required],
      maxCapacity: [defaultRoom ? defaultRoom.capacity : 30, [Validators.required, Validators.min(1)]],

      // Step 3: Trainers
      primaryTrainerId: ['INST-001', Validators.required],
      primaryTrainerName: ['Dr. Tanvir Ahmed', Validators.required],
      primaryTrainerEmail: ['tanvir.ahmed@learningcenter.brac.net'],
      coTrainerName1: ['Fatima Rahman'],
      coTrainerName2: [''],

      // Step 4: Assessment Mode
      assessmentMode: ['manual_marks', Validators.required], // reference_assessment | inline_assessment | manual_marks | none
      refAssessmentId: ['ASM-001'],
      refAssessmentTitle: ['Crisis Logistics Post-Evaluation'],
      inlineTitle: ['Classroom Practical Assessment'],
      inlineTotalMarks: [100],
      inlinePassMarks: [70],
      manualRubricTitle: ['Trainer Classroom Observation & Viva Rubric'],
      manualMaxMarks: [100, [Validators.required, Validators.min(1)]],
      manualPassMarks: [60, [Validators.required, Validators.min(1)]],

      // Step 5: Attendance & Certs
      minAttendancePercentage: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
      attendanceMode: ['multi_session_daily', Validators.required],
      linkedCertificateTemplateId: ['CERT-TMPL-001'],
      publishDirectly: [true]
    });

    if (defaultVenue) {
      this.selectedVenueId.set(defaultVenue.venueId);
      if (defaultRoom) {
        this.selectedRoomId.set(defaultRoom.roomId);
      }
    }
  }

  onVenueChange(venueId: string): void {
    this.selectedVenueId.set(venueId);
    const v = this.venues().find(x => x.venueId === venueId);
    if (v && v.rooms.length > 0) {
      this.selectedRoomId.set(v.rooms[0].roomId);
      this.trainingForm.patchValue({
        roomId: v.rooms[0].roomId,
        maxCapacity: v.rooms[0].capacity
      });
    } else {
      this.selectedRoomId.set('');
      this.trainingForm.patchValue({ roomId: '', maxCapacity: 0 });
    }
  }

  onRoomChange(roomId: string): void {
    this.selectedRoomId.set(roomId);
    const room = this.availableRooms().find(r => r.roomId === roomId);
    if (room) {
      this.trainingForm.patchValue({
        maxCapacity: room.capacity
      });
    }
  }

  loadTraining(id: string): void {
    const training = this.lmsData.getOfflineTrainingById(id);
    if (!training) {
      this.router.navigate(['/offline-trainings']);
      return;
    }

    this.selectedVenueId.set(training.venueId || '');
    this.selectedRoomId.set(training.roomId || '');

    this.trainingForm.patchValue({
      code: training.code,
      title: training.title,
      description: training.description,
      category: training.category,
      deliveryMode: training.deliveryMode,
      targetAudience: training.targetAudience || '',
      durationHours: training.durationHours,
      durationDays: training.durationDays,
      venueId: training.venueId,
      roomId: training.roomId,
      maxCapacity: training.maxCapacity,
      primaryTrainerId: training.primaryTrainerId,
      primaryTrainerName: training.primaryTrainerName,
      primaryTrainerEmail: training.primaryTrainerEmail || '',
      coTrainerName1: training.coTrainers && training.coTrainers[0] ? training.coTrainers[0].trainerName : '',
      coTrainerName2: training.coTrainers && training.coTrainers[1] ? training.coTrainers[1].trainerName : '',
      assessmentMode: training.assessmentMode,
      manualMaxMarks: training.manualMarksConfig?.maxMarks || 100,
      manualPassMarks: training.manualMarksConfig?.passMarks || 60,
      minAttendancePercentage: training.attendanceConfig.minAttendancePercentage,
      attendanceMode: training.attendanceConfig.mode,
      linkedCertificateTemplateId: training.linkedCertificateTemplateId || '',
      publishDirectly: training.status === 'published'
    });

    if (training.reusableMaterials) {
      this.attachments.set([...training.reusableMaterials]);
    }
  }

  addAttachment(): void {
    const newAtt: OfflineContentAttachment = {
      attachmentId: `att-${Date.now()}`,
      title: 'New Training Handout / Presentation Slide',
      fileType: 'pdf',
      fileUrl: '/assets/docs/presentation.pdf',
      fileSizeBytes: 1200000,
      isRequiredPreRead: false,
      displayOrder: this.attachments().length + 1
    };
    this.attachments.update(a => [...a, newAtt]);
  }

  removeAttachment(index: number): void {
    this.attachments.update(a => a.filter((_, i) => i !== index));
  }

  saveTraining(): void {
    if (this.trainingForm.invalid) {
      this.trainingForm.markAllAsTouched();
      return;
    }

    const val = this.trainingForm.value;
    const v = this.lmsData.getVenueById(val.venueId);
    const r = v?.rooms.find(x => x.roomId === val.roomId);

    const coTrainers = [];
    if (val.coTrainerName1) {
      coTrainers.push({ trainerId: 'CO-01', trainerName: val.coTrainerName1, role: 'Co-Facilitator' });
    }
    if (val.coTrainerName2) {
      coTrainers.push({ trainerId: 'CO-02', trainerName: val.coTrainerName2, role: 'Support Instructor' });
    }

    const attendanceConfig: OfflineAttendanceConfig = {
      required: true,
      minAttendancePercentage: Number(val.minAttendancePercentage),
      mode: val.attendanceMode,
      sessionsCount: val.durationDays * 2
    };

    const manualMarksConfig = val.assessmentMode === 'manual_marks' ? {
      maxMarks: Number(val.manualMaxMarks),
      passMarks: Number(val.manualPassMarks),
      rubricTitle: val.manualRubricTitle || 'Instructor Observation & Viva Rubric',
      criteria: [
        { criteriaId: 'c1', label: 'Class Participation & Discussion', maxMarks: 30, weightage: 30 },
        { criteriaId: 'c2', label: 'Practical Field Simulation', maxMarks: 40, weightage: 40 },
        { criteriaId: 'c3', label: 'Final Action Plan & Viva', maxMarks: 30, weightage: 30 }
      ]
    } : undefined;

    const payload: Partial<OfflineTraining> = {
      code: val.code.toUpperCase().trim(),
      title: val.title.trim(),
      description: val.description.trim(),
      category: val.category,
      deliveryMode: val.deliveryMode,
      targetAudience: val.targetAudience,
      durationHours: Number(val.durationHours),
      durationDays: Number(val.durationDays),
      venueId: val.venueId,
      venueName: v?.name || 'Dhaka Learning Center',
      roomId: val.roomId,
      roomName: r?.name || 'Main Hall',
      maxCapacity: Number(val.maxCapacity),
      primaryTrainerId: val.primaryTrainerId,
      primaryTrainerName: val.primaryTrainerName,
      primaryTrainerEmail: val.primaryTrainerEmail,
      coTrainers,
      reusableMaterials: this.attachments(),
      assessmentMode: val.assessmentMode,
      referenceAssessmentId: val.assessmentMode === 'reference_assessment' ? val.refAssessmentId : undefined,
      referenceAssessmentTitle: val.assessmentMode === 'reference_assessment' ? val.refAssessmentTitle : undefined,
      manualMarksConfig,
      attendanceConfig,
      linkedCertificateTemplateId: val.linkedCertificateTemplateId || undefined,
      status: val.publishDirectly ? 'published' : 'draft'
    };

    if (this.isEditMode() && this.trainingId()) {
      this.lmsData.updateOfflineTraining(this.trainingId()!, payload);
      this.router.navigate(['/offline-trainings/view', this.trainingId()]);
    } else {
      const created = this.lmsData.createOfflineTraining(payload);
      this.router.navigate(['/offline-trainings/view', created.trainingId]);
    }
  }

  cancel(): void {
    if (this.isEditMode() && this.trainingId()) {
      this.router.navigate(['/offline-trainings/view', this.trainingId()]);
    } else {
      this.router.navigate(['/offline-trainings']);
    }
  }
}
