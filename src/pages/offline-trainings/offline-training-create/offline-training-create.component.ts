import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineAssessmentMode, OfflineAttendanceConfig, OfflineContentAttachment, ManualMarkCriteria } from '../../../models/offline-training.model';
import { Venue, Room } from '../../../models/venue.model';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';

@Component({
  selector: 'app-offline-training-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    StepperComponent
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
    { id: 2, shortTitle: 'Venue', title: 'Venue', icon: 'location_city' },
    { id: 3, shortTitle: 'Trainers', title: 'Trainers', icon: 'school' },
    { id: 4, shortTitle: 'Evaluation', title: 'Evaluation', icon: 'fact_check' },
    { id: 5, shortTitle: 'Compliance', title: 'Compliance', icon: 'verified' }
  ];
  currentStep = signal<number>(1);
  completedSteps = signal<number[]>([]);
  showWelcomeBanner = signal<boolean>(true);
  successAlert = signal<string | null>(null);
  formErrorAlert = signal<string | null>(null);
  private successTimer: any = null;

  getCurrentStepTitle(): string {
    const step = this.steps.find(s => s.id === this.currentStep());
    return step?.title || step?.shortTitle || 'Basic Details & Scope';
  }

  isFieldInvalid(name: string): boolean {
    const ctrl = this.trainingForm?.get(name);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  validateStep(step: number): { valid: boolean; message?: string } {
    if (!this.trainingForm) return { valid: true };

    if (step === 1) {
      const step1Fields = ['code', 'title', 'description', 'category', 'durationHours', 'durationDays'];
      step1Fields.forEach(f => this.trainingForm.get(f)?.markAsTouched());

      const codeCtrl = this.trainingForm.get('code');
      const titleCtrl = this.trainingForm.get('title');
      const descCtrl = this.trainingForm.get('description');
      const catCtrl = this.trainingForm.get('category');
      const hoursCtrl = this.trainingForm.get('durationHours');
      const daysCtrl = this.trainingForm.get('durationDays');

      if (codeCtrl?.invalid) {
        return { valid: false, message: 'Training Code is required (alphanumeric, up to 30 characters).' };
      }
      if (titleCtrl?.invalid) {
        return { valid: false, message: 'Workshop Title is required (up to 150 characters).' };
      }
      if (descCtrl?.invalid) {
        return { valid: false, message: 'Comprehensive Description is required.' };
      }
      if (catCtrl?.invalid) {
        return { valid: false, message: 'Curriculum Category is required.' };
      }
      if (hoursCtrl?.invalid) {
        return { valid: false, message: 'Delivery Duration (Hours) is required and must be between 1 and 200.' };
      }
      if (daysCtrl?.invalid) {
        return { valid: false, message: 'Estimated Days must be at least 1 day.' };
      }
    } else if (step === 2) {
      const step2Fields = ['venueId', 'roomId', 'maxCapacity'];
      step2Fields.forEach(f => this.trainingForm.get(f)?.markAsTouched());

      const venueCtrl = this.trainingForm.get('venueId');
      const roomCtrl = this.trainingForm.get('roomId');
      const capCtrl = this.trainingForm.get('maxCapacity');

      if (!venueCtrl?.value) {
        return { valid: false, message: 'Please select a designated training venue.' };
      }
      if (!roomCtrl?.value) {
        return { valid: false, message: 'Please select a classroom / hall inside the venue.' };
      }
      if (capCtrl?.invalid || Number(capCtrl?.value) < 1) {
        return { valid: false, message: 'Configured Enrollment Capacity must be at least 1 seat.' };
      }
    } else if (step === 3) {
      const step3Fields = ['primaryTrainerId', 'primaryTrainerName'];
      step3Fields.forEach(f => this.trainingForm.get(f)?.markAsTouched());

      const trainerIdCtrl = this.trainingForm.get('primaryTrainerId');
      const trainerNameCtrl = this.trainingForm.get('primaryTrainerName');

      if (trainerIdCtrl?.invalid) {
        return { valid: false, message: 'Primary Trainer ID is required.' };
      }
      if (trainerNameCtrl?.invalid) {
        return { valid: false, message: 'Instructor Full Name is required.' };
      }
    } else if (step === 4) {
      const mode = this.trainingForm.get('assessmentMode')?.value;
      if (mode === 'manual_marks') {
        this.trainingForm.get('manualMaxMarks')?.markAsTouched();
        this.trainingForm.get('manualPassMarks')?.markAsTouched();

        const maxMarks = Number(this.trainingForm.get('manualMaxMarks')?.value);
        const passMarks = Number(this.trainingForm.get('manualPassMarks')?.value);

        if (!maxMarks || maxMarks < 1) {
          return { valid: false, message: 'Max Total Score must be at least 1 mark.' };
        }
        if (!passMarks || passMarks < 1) {
          return { valid: false, message: 'Required Pass Marks must be at least 1 mark.' };
        }
        if (passMarks > maxMarks) {
          return { valid: false, message: 'Pass Marks cannot exceed the Max Total Score.' };
        }
      }
    } else if (step === 5) {
      const step5Fields = ['minAttendancePercentage', 'attendanceMode'];
      step5Fields.forEach(f => this.trainingForm.get(f)?.markAsTouched());

      const attPct = Number(this.trainingForm.get('minAttendancePercentage')?.value);
      const attMode = this.trainingForm.get('attendanceMode')?.value;

      if (isNaN(attPct) || attPct < 0 || attPct > 100) {
        return { valid: false, message: 'Minimum Attendance Threshold must be between 0% and 100%.' };
      }
      if (!attMode) {
        return { valid: false, message: 'Please select an Attendance Tracking Mode.' };
      }
    }

    return { valid: true };
  }

  private triggerSuccessAlert(message: string): void {
    this.successAlert.set(message);
    if (this.successTimer) {
      clearTimeout(this.successTimer);
    }
    this.successTimer = setTimeout(() => {
      if (this.successAlert() === message) {
        this.successAlert.set(null);
      }
    }, 5000);
  }

  goToStep(targetStep: number): void {
    if (targetStep < 1 || targetStep > 5) return;
    const current = this.currentStep();

    if (targetStep > current) {
      // Validate all steps from current to targetStep - 1
      for (let s = current; s < targetStep; s++) {
        const validation = this.validateStep(s);
        if (!validation.valid) {
          this.currentStep.set(s);
          this.formErrorAlert.set(validation.message || 'Please fill in all mandatory fields before proceeding.');
          this.successAlert.set(null);
          this.lmsData.showToast(validation.message || 'Validation error encountered.', 'error', 4500, 'Step Validation');
          this.scrollToFirstError();
          return;
        }
        if (!this.completedSteps().includes(s)) {
          this.completedSteps.update(c => [...c, s]);
        }
      }

      const prevStepObj = this.steps.find(s => s.id === current);
      const targetStepObj = this.steps.find(s => s.id === targetStep);
      const successMsg = `Stage ${current} (${prevStepObj?.shortTitle || 'Step ' + current}) saved successfully! Proceeding to Stage ${targetStep}: ${targetStepObj?.shortTitle || 'Step ' + targetStep}.`;

      this.currentStep.set(targetStep);
      this.formErrorAlert.set(null);
      this.triggerSuccessAlert(successMsg);
      this.lmsData.showToast(successMsg, 'success', 4000, 'Stage Completed');
      this.scrollTop();
    } else if (targetStep < current) {
      this.currentStep.set(targetStep);
      this.formErrorAlert.set(null);
      this.scrollTop();
    }
  }

  nextStep(): void {
    this.goToStep(this.currentStep() + 1);
  }

  prevStep(): void {
    this.goToStep(this.currentStep() - 1);
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
    // Validate all 5 steps before saving
    for (let s = 1; s <= 5; s++) {
      const res = this.validateStep(s);
      if (!res.valid) {
        this.currentStep.set(s);
        this.formErrorAlert.set(res.message || 'Please complete all required fields.');
        this.successAlert.set(null);
        this.lmsData.showToast(res.message || 'Please complete all required fields.', 'error', 5000, 'Validation Error');
        this.scrollToFirstError();
        return;
      }
      if (!this.completedSteps().includes(s)) {
        this.completedSteps.update(c => [...c, s]);
      }
    }

    if (this.trainingForm.invalid) {
      this.trainingForm.markAllAsTouched();
      this.formErrorAlert.set('Some fields contain invalid data. Please review the highlighted fields.');
      this.scrollToFirstError();
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
      this.lmsData.showToast(`Training "${payload.title}" updated successfully!`, 'success', 4000, 'Training Updated');
      this.router.navigate(['/offline-trainings/view', this.trainingId()]);
    } else {
      const created = this.lmsData.createOfflineTraining(payload);
      this.lmsData.showToast(`Offline Training "${created.title}" published successfully!`, 'success', 4500, 'Training Published');
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

  private scrollTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private scrollToFirstError(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const errorEl = document.querySelector(
        'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, .border-rose-500, .border-red-500, [aria-invalid="true"], [data-error="true"], .text-rose-500:not(:empty), #form-error-banner'
      );
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ((errorEl as HTMLElement).focus && typeof (errorEl as HTMLElement).focus === 'function') {
          (errorEl as HTMLElement).focus();
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  }
}
