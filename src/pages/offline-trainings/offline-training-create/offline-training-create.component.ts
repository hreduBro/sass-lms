import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineAssessmentMode, OfflineAttendanceConfig, OfflineContentAttachment, ManualMarkCriteria } from '../../../models/offline-training.model';
import { Venue, Room } from '../../../models/venue.model';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-offline-training-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    StepperComponent,
    CustomSelectComponent
  ],
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
  steps: StepperStep[] = [
    { id: 1, shortTitle: 'Basics', title: 'Basic Details & Scope', icon: 'info' },
    { id: 2, shortTitle: 'Venue', title: 'Venue & Room Allocation', icon: 'location_city' },
    { id: 3, shortTitle: 'Trainers', title: 'Faculty & Trainers', icon: 'school' },
    { id: 4, shortTitle: 'Evaluation', title: 'Assessment Architecture', icon: 'fact_check' },
    { id: 5, shortTitle: 'Compliance', title: 'Attendance & Certs', icon: 'verified' }
  ];
  currentStep = signal<number>(1);
  completedSteps = signal<number[]>([]);

  // Alerts state: Welcome, Error, Success
  showWelcomeAlert = signal<boolean>(false);
  formErrors = signal<string[]>([]);
  showSuccessAlert = signal<boolean>(false);

  validateCurrentStep(step: number): boolean {
    const errors: string[] = [];

    if (step === 1) {
      const codeCtrl = this.trainingForm.get('code');
      const titleCtrl = this.trainingForm.get('title');
      const descCtrl = this.trainingForm.get('description');
      const catCtrl = this.trainingForm.get('category');
      const hrsCtrl = this.trainingForm.get('durationHours');
      const daysCtrl = this.trainingForm.get('durationDays');

      if (codeCtrl?.invalid) {
        codeCtrl.markAsTouched();
        errors.push('Training Code is required (max 30 characters).');
      }
      if (titleCtrl?.invalid) {
        titleCtrl.markAsTouched();
        errors.push('Training Title is required.');
      }
      if (descCtrl?.invalid) {
        descCtrl.markAsTouched();
        errors.push('Curriculum Description & Objectives is required.');
      }
      if (catCtrl?.invalid) {
        catCtrl.markAsTouched();
        errors.push('Training Category is required.');
      }
      if (hrsCtrl?.invalid) {
        hrsCtrl.markAsTouched();
        errors.push('Duration in Hours must be at least 1.');
      }
      if (daysCtrl?.invalid) {
        daysCtrl.markAsTouched();
        errors.push('Duration in Days must be at least 1.');
      }
    } else if (step === 2) {
      const venueCtrl = this.trainingForm.get('venueId');
      const roomCtrl = this.trainingForm.get('roomId');
      const capCtrl = this.trainingForm.get('maxCapacity');

      if (venueCtrl?.invalid) {
        venueCtrl.markAsTouched();
        errors.push('Physical Training Venue must be selected.');
      }
      if (roomCtrl?.invalid) {
        roomCtrl.markAsTouched();
        errors.push('Room / Classroom allocation must be selected.');
      }
      if (capCtrl?.invalid) {
        capCtrl.markAsTouched();
        errors.push('Classroom Maximum Capacity must be at least 1.');
      }
    } else if (step === 3) {
      const trainerCtrl = this.trainingForm.get('primaryTrainerName');
      if (trainerCtrl?.invalid) {
        trainerCtrl.markAsTouched();
        errors.push('Lead Instructor / Trainer Name is required.');
      }
    } else if (step === 4) {
      const mode = this.trainingForm.get('assessmentMode')?.value;
      if (mode === 'manual_marks') {
        const maxMarksCtrl = this.trainingForm.get('manualMaxMarks');
        const passMarksCtrl = this.trainingForm.get('manualPassMarks');
        if (maxMarksCtrl?.invalid) {
          maxMarksCtrl.markAsTouched();
          errors.push('Assessment Maximum Marks must be at least 1.');
        }
        if (passMarksCtrl?.invalid) {
          passMarksCtrl.markAsTouched();
          errors.push('Assessment Passing Marks must be at least 1.');
        }
      }
    } else if (step === 5) {
      const attCtrl = this.trainingForm.get('minAttendancePercentage');
      if (attCtrl?.invalid) {
        attCtrl.markAsTouched();
        errors.push('Minimum Attendance Percentage must be between 0 and 100%.');
      }
    }

    this.formErrors.set(errors);

    if (errors.length > 0) {
      this.lmsData.showToast(
        `Please resolve the highlighted validation errors (${errors.length} issue${errors.length > 1 ? 's' : ''}) before continuing.`,
        'error',
        4500,
        'Validation Error',
        'REQUIRED'
      );
      this.scrollToFirstError();
      return false;
    }
    return true;
  }

  scrollToFirstError(): void {
    setTimeout(() => {
      const invalidEl = document.querySelector(
        'form input.ng-invalid, form select.ng-invalid, form textarea.ng-invalid, [formcontrolname].ng-invalid'
      ) as HTMLElement | null;

      if (invalidEl) {
        invalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        invalidEl.focus?.();
        invalidEl.classList.add('ring-2', 'ring-rose-500', 'animate-pulse');
        setTimeout(() => {
          invalidEl.classList.remove('ring-2', 'ring-rose-500', 'animate-pulse');
        }, 2500);
      } else {
        const errorBanner = document.getElementById('training-error-alert');
        errorBanner?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  goToStep(stepId: number): void {
    if (stepId > this.currentStep()) {
      if (!this.validateCurrentStep(this.currentStep())) {
        return;
      }
    }
    this.formErrors.set([]);
    if (stepId >= 1 && stepId <= 5) {
      this.currentStep.set(stepId);
    }
  }

  nextStep(): void {
    const cur = this.currentStep();
    if (!this.validateCurrentStep(cur)) {
      return;
    }
    this.formErrors.set([]);
    if (!this.completedSteps().includes(cur)) {
      this.completedSteps.update(c => [...c, cur]);
    }
    if (cur < 5) {
      this.currentStep.set(cur + 1);
    }
  }

  prevStep(): void {
    this.formErrors.set([]);
    const cur = this.currentStep();
    if (cur > 1) {
      this.currentStep.set(cur - 1);
    }
  }

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

  venueOptions = computed<SelectOption[]>(() => {
    return this.venues().map(v => ({
      value: v.venueId,
      label: `${v.name} (${v.address.city})`,
      sublabel: `${v.rooms.length} room(s) available`,
      icon: 'location_city'
    }));
  });

  roomOptions = computed<SelectOption[]>(() => {
    return this.availableRooms().map(r => ({
      value: r.roomId,
      label: `${r.name} — ${r.capacity} Max Seats`,
      badge: `${r.capacity} seats`,
      icon: 'meeting_room'
    }));
  });

  attendanceModeOptions: SelectOption[] = [
    { value: 'multi_session_daily', label: 'Multi-Session Daily (Morning & Afternoon Sign-in)', icon: 'event_repeat' },
    { value: 'once_daily', label: 'Once Daily Sign-in', icon: 'today' },
    { value: 'single_event', label: 'Single Event Checklist', icon: 'check_circle' }
  ];

  certTemplateOptions = computed<SelectOption[]>(() => {
    return [
      { value: '', label: '-- None (No Certificate Issued) --', icon: 'block' },
      ...this.certTemplates().map(t => ({
        value: t.id,
        label: `${t.name}`,
        badge: 'Template',
        icon: 'workspace_premium'
      }))
    ];
  });

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

    const isEdit = this.router.url.includes('/edit') || 
                   !!this.route.snapshot.params['id'] || 
                   !!this.route.snapshot.queryParams['id'] || 
                   !!this.route.snapshot.queryParams['editId'] || 
                   !!this.route.snapshot.queryParams['edit'];

    if (isEdit) {
      this.isEditMode.set(true);
      this.showWelcomeAlert.set(false);
    }

    this.route.params.subscribe(params => {
      const editId = params['id'] || this.route.snapshot.queryParams['id'] || this.route.snapshot.queryParams['editId'] || this.route.snapshot.queryParams['edit'];
      if (editId || this.router.url.includes('/edit')) {
        this.isEditMode.set(true);
        this.showWelcomeAlert.set(false);
        if (editId) {
          this.trainingId.set(editId);
          this.loadTraining(editId);
        }
      } else {
        this.isEditMode.set(false);
        this.showWelcomeAlert.set(true);
        // Welcome alert toast on create only
        this.lmsData.showToast(
          'Welcome to the Offline Training Designer! Follow the 5 horizontal stages to configure your course.',
          'info',
          5000,
          'Welcome',
          'DESIGNER'
        );
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
      const allErrors: string[] = [];
      if (this.trainingForm.get('code')?.invalid) allErrors.push('Training Code is required.');
      if (this.trainingForm.get('title')?.invalid) allErrors.push('Training Title is required.');
      if (this.trainingForm.get('description')?.invalid) allErrors.push('Curriculum Description is required.');
      if (this.trainingForm.get('category')?.invalid) allErrors.push('Training Category is required.');
      if (this.trainingForm.get('durationHours')?.invalid) allErrors.push('Duration (Hours) must be at least 1.');
      if (this.trainingForm.get('durationDays')?.invalid) allErrors.push('Duration (Days) must be at least 1.');
      if (this.trainingForm.get('venueId')?.invalid) allErrors.push('Venue allocation is required.');
      if (this.trainingForm.get('roomId')?.invalid) allErrors.push('Room allocation is required.');
      if (this.trainingForm.get('primaryTrainerName')?.invalid) allErrors.push('Lead Trainer Name is required.');
      if (this.trainingForm.get('minAttendancePercentage')?.invalid) allErrors.push('Attendance Percentage must be 0-100%.');

      if (allErrors.length === 0) {
        allErrors.push('Please ensure all required fields marked with * are filled accurately.');
      }
      this.formErrors.set(allErrors);
      this.lmsData.showToast(
        'Training form has missing or invalid entries. Review the highlighted fields.',
        'error',
        5000,
        'Form Incomplete',
        'ACTION REQUIRED'
      );

      // Auto-switch to the first step that contains an invalid field
      if (this.trainingForm.get('title')?.invalid || this.trainingForm.get('description')?.invalid || this.trainingForm.get('code')?.invalid) {
        this.currentStep.set(1);
      } else if (this.trainingForm.get('venueId')?.invalid || this.trainingForm.get('roomId')?.invalid) {
        this.currentStep.set(2);
      } else if (this.trainingForm.get('primaryTrainerName')?.invalid) {
        this.currentStep.set(3);
      } else if (this.trainingForm.get('manualMaxMarks')?.invalid || this.trainingForm.get('manualPassMarks')?.invalid) {
        this.currentStep.set(4);
      } else if (this.trainingForm.get('minAttendancePercentage')?.invalid) {
        this.currentStep.set(5);
      }

      this.scrollToFirstError();
      return;
    }

    this.formErrors.set([]);

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
      this.lmsData.showToast('Offline training module updated successfully!', 'success', 5000, 'Training Updated', 'ACTIVE');
      this.router.navigate(['/offline-trainings/view', this.trainingId()]);
    } else {
      const created = this.lmsData.createOfflineTraining(payload);
      this.lmsData.showToast('Offline training module finalized & published successfully!', 'success', 5000, 'Training Created', 'PUBLISHED');
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
