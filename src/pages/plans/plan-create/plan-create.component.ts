import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray, FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  Plan, 
  PlanStatus,
  Phase, 
  PlanOwner, 
  DurationType, 
  EnrollmentType, 
  ProgressionMode,
  GradingScope,
  GradingType,
  EvaluationRequirement,
  EnrollmentConfirmation,
  PlanValidationIssue,
  formatDateDDMMYYYY, 
  validateComprehensivePlan,
  validatePlanAndPhases,
  parseDateDDMMYYYY
} from '../../../models/plan.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { StepperComponent, StepperStep, StepItem } from '../../../components/stepper/stepper.component';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';

export type { StepItem };

@Component({
  selector: 'app-plan-create',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CustomSelectComponent, StepperComponent],
  templateUrl: './plan-create.component.html',
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
})
export class PlanCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private lmsData = inject(LmsDataService);
  modalService = inject(ConfirmationModalService);

  activeTenant = this.lmsData.activeTenant;
  activeLms = this.lmsData.activeLms;

  // Edit Mode State
  isEditing = signal<boolean>(false);
  editingPlanId = signal<string | null>(null);
  editingPlan = signal<Plan | null>(null);

  // Active Wizard Step (1 through 11)
  currentStep = signal<number>(1);
  completedSteps = signal<Set<number>>(new Set());
  stepperOrientation = signal<'horizontal' | 'vertical'>('vertical');

  progressPercent = computed<number>(() => {
    return Math.round((this.completedSteps().size / this.steps.length) * 100);
  });

  // Action / State signals
  isSubmitting = signal(false);
  showPublishModal = signal(false);
  showActivateModal = signal(false);
  showCancelModal = signal(false);
  showAddPhaseModal = signal(false);
  editingPhaseIndex = signal<number | null>(null);
  qrCodeVisible = signal(false);
  savedPlanResult = signal<Plan | null>(null);
  formErrorAlert = signal<string | null>(null);

  // Validation state
  sectionErrors = signal<Record<number, string[]>>({});
  validationIssues = signal<PlanValidationIssue[]>([]);
  isSection1Passed = signal(false);

  // 11 Sections Specification (§0.1, §2)
  steps: StepItem[] = [
    { id: 1, key: 'basic', title: 'Basic Information & Timeframe', shortTitle: 'Basic Info', sublabel: 'Identity & Bounds', icon: 'info' },
    { id: 2, key: 'structure', title: 'Plan Structure & Phases', shortTitle: 'Structure', sublabel: 'Phase Milestones', icon: 'account_tree' },
    { id: 3, key: 'progression', title: 'Progression & Unlock Rules', shortTitle: 'Progression', sublabel: 'Sequence & Gates', icon: 'timeline' },
    { id: 4, key: 'enrollment', title: 'Enrollment & Cohorting', shortTitle: 'Enrollment', sublabel: 'Capacity & Links', icon: 'groups' },
    { id: 5, key: 'equivalency', title: 'Prior Completion & Equivalency', shortTitle: 'Equivalency', sublabel: 'Course Credits', icon: 'verified' },
    { id: 6, key: 'grading', title: 'Grading Policy & Weights', shortTitle: 'Grading', sublabel: 'Pass Mark & Scale', icon: 'grade', isDeferrable: true },
    { id: 7, key: 'credentials', title: 'Credentials & Outputs', shortTitle: 'Credentials', sublabel: 'Certificates & Badges', icon: 'workspace_premium', isDeferrable: true },
    { id: 8, key: 'evaluation', title: 'Diagnostic Evaluation', shortTitle: 'Evaluation', sublabel: 'Pre & Post Tests', icon: 'quiz' },
    { id: 9, key: 'engagement', title: 'Engagement & Community', shortTitle: 'Engagement', sublabel: 'Ratings & Forum', icon: 'forum' },
    { id: 10, key: 'recurring', title: 'Recurring Cycles & Alumni', shortTitle: 'Recurring', sublabel: 'Alumni & Cycles', icon: 'update' },
    { id: 11, key: 'review', title: 'Review & Publish', shortTitle: 'Preview', sublabel: 'Validate & Launch', icon: 'rate_review' }
  ];

  // Options & Dropdowns
  durationOptions: SelectOption[] = [
    { value: 'Yearly', label: 'Yearly (12 Months)', sublabel: 'Annual comprehensive curriculum', icon: 'event' },
    { value: 'Half-Yearly', label: 'Half-Yearly (6 Months)', sublabel: 'Semester curriculum track', icon: 'date_range' },
    { value: 'Quarterly', label: 'Quarterly (3 Months)', sublabel: 'Accelerated quarterly sprint', icon: 'calendar_view_month' }
  ];

  enrollmentOptions: SelectOption[] = [
    { value: 'Closed', label: 'Closed / Cohort-Assigned', sublabel: 'Admins or batch rosters assign learners', icon: 'lock' },
    { value: 'Open', label: 'Open Self-Registration', sublabel: 'Self-registration enabled via link & QR', icon: 'lock_open' }
  ];

  confirmationOptions: SelectOption[] = [
    { value: 'Auto Onboard', label: 'Auto Onboard', sublabel: 'Instant enrollment on registration', icon: 'flash_on' },
    { value: 'Manual Review', label: 'Manual Review', sublabel: 'Admin reviews applicants (Accept, Reject, Waitlist)', icon: 'how_to_reg' }
  ];

  progressionModeOptions: SelectOption[] = [
    { value: 'Sequential', label: 'Sequential Progression', sublabel: 'Enforces ordered phase completion before next phase unlocks', icon: 'format_list_numbered' },
    { value: 'Free', label: 'Free Progression', sublabel: 'Phases accessed in any order, subject to phase prerequisites', icon: 'dashboard_customize' }
  ];

  unlockRequirementOptions: SelectOption[] = [
    { value: 'All Courses & Assessments 100% Completed', label: 'All Courses & Tasks Completed (100%)', icon: 'task_alt' },
    { value: 'Phase Pass Mark Met in Core Assessments', label: 'Phase Pass Mark Met in Core Assessments', icon: 'check_circle' },
    { value: 'Minimum 80% Attendance & Task Submission', label: '80% Attendance & Task Submission Satisfied', icon: 'fact_check' },
    { value: 'Instructor Manual Clearance', label: 'Instructor Manual Clearance Sign-off', icon: 'approval' }
  ];

  gradingScopeOptions: SelectOption[] = [
    { value: 'Whole Plan', label: 'Whole Plan Unified Grading', sublabel: 'Single cumulative score across all phases', icon: 'done_all' },
    { value: 'Per Phase', label: 'Per-Phase Modular Grading', sublabel: 'Independent passing criteria for each phase', icon: 'view_week' }
  ];

  gradingTypeOptions: SelectOption[] = [
    { value: 'Percentage', label: 'Percentage Scale (0% - 100%)', sublabel: 'Standard numeric percentage pass mark', icon: 'percent' },
    { value: 'CGPA', label: 'CGPA Scale (0.00 - 4.00)', sublabel: 'Grade Point Average scale', icon: 'school' }
  ];

  retakePolicyOptions: SelectOption[] = [
    { value: 'Latest Valid Score', label: 'Latest Valid Score (Default)', sublabel: 'Most recent attempt counts towards transcript', icon: 'history' },
    { value: 'Highest Score Among Attempts', label: 'Highest Score Among Attempts', sublabel: 'Best score achieved is retained', icon: 'emoji_events' },
    { value: 'Average of All Attempts', label: 'Average of All Attempts', sublabel: 'Mean grade calculated', icon: 'calculate' }
  ];

  certificateTemplateOptions: SelectOption[] = [
    { value: 'cert-exec-01', label: 'Executive Leadership Diploma', sublabel: 'Official corporate certification template with gold seal', icon: 'military_tech' },
    { value: 'cert-mfi-02', label: 'Professional Microfinance Specialist Certificate', sublabel: 'BRAC Village Organization accredited format', icon: 'badge' },
    { value: 'cert-compliance-03', label: 'National Banking Compliance Credential', sublabel: 'Regulatory compliance certificate format', icon: 'verified' },
    { value: 'cert-general-04', label: 'Standard Achievement Certificate', sublabel: 'Clean minimalist completion certificate', icon: 'description' }
  ];

  badgeOptions: SelectOption[] = [
    { value: 'badge-foundation', label: 'Foundational Achiever Pin', sublabel: 'Issued upon Phase 1 completion', icon: 'stars' },
    { value: 'badge-specialist', label: 'Master Practitioner Digital Badge', sublabel: 'Issued upon Plan distinction', icon: 'workspace_premium' },
    { value: 'badge-honors', label: 'Honors Capstone Ribbon', sublabel: 'Issued for top 10% cohort learners', icon: 'military_tech' }
  ];

  visibilityOptions: SelectOption[] = [
    { value: 'Public', label: 'Public & Shareable (LinkedIn, PDF Download)', icon: 'public' },
    { value: 'Enrolled Trainees Only', label: 'Enrolled Trainees Only', icon: 'lock_open' },
    { value: 'Plan Administrators Only', label: 'Plan Administrators & Instructors Only', icon: 'lock' }
  ];

  preTestQuestionnaires: SelectOption[] = [
    { value: 'q-baseline-2026', label: 'Baseline Technical Aptitude Q-2026 (v2.4)', sublabel: '30 diagnostic items covering core domain knowledge', icon: 'quiz' },
    { value: 'q-readiness-mfi', label: 'Field Officer Readiness Survey (v1.8)', sublabel: 'Ethics & customer service scenario diagnostics', icon: 'checklist' },
    { value: 'q-cyber-eval', label: 'Cybersecurity Diagnostic Baseline (v3.0)', sublabel: 'Phishing hygiene and password protocols', icon: 'security' }
  ];

  postTestQuestionnaires: SelectOption[] = [
    { value: 'q-summative-2026', label: 'Comprehensive Summative Evaluation Q-2026 (v2.0)', sublabel: '50-item final competency assessment', icon: 'assignment_turned_in' },
    { value: 'q-impact-survey', label: 'Post-Training Impact & Knowledge Retention Survey (v1.5)', sublabel: 'Self-assessment and practical application review', icon: 'insights' }
  ];

  ratingScaleOptions: SelectOption[] = [
    { value: '5-Star Scale', label: '5-Star Rating Scale (1 to 5 Stars)', icon: 'star' },
    { value: '10-Point CSAT', label: '10-Point CSAT Satisfaction Index', icon: 'thumb_up' },
    { value: '3-Point Smiley', label: '3-Point Sentiment Rating (Positive / Neutral / Negative)', icon: 'sentiment_satisfied' }
  ];

  recurrenceIntervalOptions: SelectOption[] = [
    { value: 'Quarterly Cycle', label: 'Quarterly Recurrence (Every 3 Months)', icon: 'calendar_view_month' },
    { value: 'Half-Yearly Cycle', label: 'Half-Yearly Recurrence (Every 6 Months)', icon: 'date_range' },
    { value: 'Annual Cycle', label: 'Annual Recurrence (Every 12 Months)', icon: 'event' }
  ];

  // Generated Plan Code (§3.1 #3, §12.2)
  generatedPlanCode = computed<string>(() => {
    const lmsNumeric = this.activeTenant().numericId || '1972';
    const randomSeq = String(Math.floor(100 + Math.random() * 900));
    return `PLN-${lmsNumeric}-${randomSeq}`;
  });

  // Generated Open Enrollment Link (§6.2)
  generatedRegistrationLink = computed<string>(() => {
    return `https://portal.onelms.org/enroll/${this.generatedPlanCode()}`;
  });

  // User Roster for Plan Owner selector (§3.1 #6)
  userOptions = computed<SelectOption[]>(() => {
    const users = this.lmsData.tenantUsers();
    return users.map(u => ({
      value: u.id,
      label: u.name,
      sublabel: `${u.role.replace('_', ' ')} • ${u.email}`,
      icon: 'account_circle'
    }));
  });

  // Comprehensive Plan Reactive Form
  planForm: FormGroup = this.fb.group({
    // Section 01: Basic Information
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    startDate: ['01/01/2026', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
    endDate: ['31/12/2026', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
    durationType: ['Yearly', [Validators.required]],
    recurringPlan: [false],
    owner: this.fb.group({
      userId: [null],
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/)]],
      contactNumber: ['', [Validators.pattern(/^01[3-9]\d{8}$/)]]
    }),

    // Section 02: Plan Structure
    phases: this.fb.array([]),

    // Section 03: Progression
    progression: this.fb.group({
      mode: ['', [Validators.required]],
      completionRequirementForUnlock: ['All Courses & Assessments 100% Completed']
    }),

    // Section 04: Enrollment & Cohorting
    enrollment: this.fb.group({
      mode: ['Open', [Validators.required]],
      existingTraineeSelfRegistration: [false],
      capacityEnabled: [false],
      capacity: [100],
      waitlistEnabled: [false],
      confirmation: ['Auto Onboard'],
      termsRequirements: ['Trainees must adhere to BRAC Code of Conduct and complete all modules prior to certification.'],
      traineeProfileFilters: this.fb.group({
        locations: [['Dhaka', 'Chittagong', 'Sylhet']],
        genders: [['All']],
        departments: [['Microfinance', 'Operations', 'Credit Analysis']],
        grades: [['Junior Officer', 'Officer', 'Senior Officer']]
      })
    }),

    // Section 05: Prior Completion & Equivalency
    equivalency: this.fb.group({
      samePublishedVersionSatisfies: [false],
      newerVersionRequiresRetake: [false],
      overrideEnabled: [false],
      explanation: ['Course credit granted based on certified prior version completion. Trainee is exempt from re-taking identical syllabus modules.']
    }),

    // Section 06: Grading Policy
    grading: this.fb.group({
      scope: ['Whole Plan'],
      type: ['Percentage'],
      planPassMark: [70],
      contentLevelPassRequired: [false],
      retakePolicy: ['Latest Valid Score']
    }),

    // Section 07: Credentials & Outputs
    credentials: this.fb.group({
      transcripts: this.fb.group({
        enabledAtPlan: [false],
        enabledAtPhase: [false],
        enabledAtCourse: [false],
        scope: ['Whole Plan'],
        minScore: [70],
        minCompletionPct: [100],
        gatedOnPreviousPhaseTranscript: [false]
      }),
      certificates: this.fb.group({
        enabledAtPlan: [false],
        enabledAtPhase: [false],
        enabledAtCourse: [false],
        scope: ['Whole Plan'],
        templateId: ['cert-mfi-02'],
        templateName: ['Professional Microfinance Specialist Certificate'],
        minScore: [70],
        minCompletionPct: [100]
      }),
      badges: this.fb.group({
        enabled: [false],
        templateId: ['badge-specialist'],
        templateName: ['Master Practitioner Digital Badge'],
        rule: ['Issued to trainees scoring >= 85% overall']
      }),
      visibility: ['Public']
    }),

    // Section 08: Evaluation
    evaluation: this.fb.group({
      preTest: this.fb.group({
        enabled: [false],
        requirement: ['Optional'],
        questionnaireId: ['q-baseline-2026'],
        questionnaireTitle: ['Baseline Technical Aptitude Q-2026 (v2.4)'],
        questionnaireVersion: ['v2.4']
      }),
      postTest: this.fb.group({
        enabled: [false],
        requirement: ['Mandatory'],
        questionnaireId: ['q-summative-2026'],
        questionnaireTitle: ['Comprehensive Summative Evaluation Q-2026 (v2.0)'],
        questionnaireVersion: ['v2.0']
      }),
      releaseTiming: ['Immediate upon Plan Completion'],
      resultDownloadEnabled: [false]
    }),

    // Section 09: Engagement
    engagement: this.fb.group({
      rating: this.fb.group({
        enabled: [false],
        scale: ['5-Star Scale'],
        availability: ['Post-Completion Only']
      }),
      feedback: this.fb.group({
        enabled: [false],
        templateId: ['fb-std-2026'],
        templateName: ['Standard Course & Plan Feedback Form'],
        version: ['v2.3'],
        releaseTiming: ['At Plan Completion']
      }),
      forum: this.fb.group({
        enabled: [false],
        topicCreationPermission: ['Instructors & Trainees'],
        moderationPermission: ['LMS Co-Admins & Instructors'],
        visibilityScope: ['All users'],
        allowedPostFormats: [['Text', 'PDF Attachments', 'Code Snippets']]
      })
    }),

    // Section 10: Recurring & Alumni
    recurring: this.fb.group({
      enabled: [false],
      cycleConfig: ['Annual Cycle'],
      currentCycle: ['Cycle 1 (2026 Initial Cohort)'],
      historicalCycleRetention: ['Full Snapshot & Immutable Transcript History'],
      structureChangePolicy: ['Allow Phase Updates for Future Cycles without altering past records'],
      reEnrollmentRule: ['Allow Trainees from Prior Cycles to Re-enroll']
    }),
    alumniTracking: [false]
  });

  // Modal temporary phase form
  phaseModalForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    startDate: ['01/01/2026', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
    endDate: ['31/03/2026', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
    courseCount: [3, [Validators.min(0)]],
    taskCount: [6, [Validators.min(0)]],
    deliveryClassCount: [2, [Validators.min(0)]],
    prerequisiteStatus: ['None'],
    certificateBadgeStatus: ['Configured'],
    weight: [50, [Validators.min(0), Validators.max(100)]]
  });

  get phasesArray(): FormArray {
    return this.planForm.get('phases') as FormArray;
  }

  // Weight sum calculation for Section 06
  totalPhaseWeight = computed<number>(() => {
    let sum = 0;
    this.phasesArray.controls.forEach(ctrl => {
      sum += Number(ctrl.get('weight')?.value) || 0;
    });
    return sum;
  });

  ngOnInit() {
    // Check if editing an existing plan via route param /plans/edit/:id
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadPlanForEdit(id);
      }
    });

    // Check if editing or resuming draft from query params
    this.route.queryParams.subscribe(params => {
      const editId = params['editPlanId'] || params['editId'] || (!this.route.snapshot.paramMap.get('id') ? params['id'] : null);
      const draftId = params['draftId'];
      const stepParam = params['step'] || params['returnStep'];

      if (editId) {
        this.loadPlanForEdit(editId);
      } else if (draftId) {
        this.loadDraft(draftId);
      } else if (!this.route.snapshot.paramMap.get('id') && this.phasesArray.length === 0) {
        // Initialize default 2 phases only for fresh creation
        this.addPhaseToForm('Phase 1: Foundation & Core Principles', '01/01/2026', '30/06/2026', 3, 6, 2, 50);
        this.addPhaseToForm('Phase 2: Advanced Application & Capstone', '01/07/2026', '31/12/2026', 2, 4, 2, 50);
      }

      if (stepParam) {
        const stepNum = Number(stepParam);
        if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 11) {
          this.currentStep.set(stepNum);
          for (let s = 1; s < stepNum; s++) {
            this.completedSteps.update(set => new Set(set).add(s));
          }
          this.scrollToActiveStep(stepNum);
        }
      }
    });

    // Sync Recurring toggle in §1 with §10
    this.planForm.get('recurringPlan')?.valueChanges.subscribe(val => {
      this.planForm.get('recurring.enabled')?.setValue(!!val, { emitEvent: false });
    });

    this.planForm.get('recurring.enabled')?.valueChanges.subscribe(val => {
      this.planForm.get('recurringPlan')?.setValue(!!val, { emitEvent: false });
    });

    // Run initial validation check
    this.runValidationAudit();

    // Show initial step alert
    if (!this.isEditing()) {
      this.showStepAlert(1, 'entered');
    }

    // Scroll active step to front
    this.scrollToActiveStep(this.currentStep());
  }

  /**
   * Dispatches a prominent step alert mentioning the exact step number and description
   */
  private showStepAlert(step: number, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<number, string> = {
      1: 'Step 1 of 11: Basic Information & Timeframe',
      2: 'Step 2 of 11: Plan Structure & Phases',
      3: 'Step 3 of 11: Progression & Unlock Rules',
      4: 'Step 4 of 11: Enrollment & Cohorting',
      5: 'Step 5 of 11: Prior Completion & Equivalency',
      6: 'Step 6 of 11: Grading Policy & Weights',
      7: 'Step 7 of 11: Credentials & Outputs',
      8: 'Step 8 of 11: Diagnostic Evaluation',
      9: 'Step 9 of 11: Engagement & Community',
      10: 'Step 10 of 11: Recurring Cycles & Alumni',
      11: 'Step 11 of 11: Review & Publish'
    };

    const stepDescriptions: Record<number, string> = {
      1: 'Step 1 of 11 — Basic Information: Define core identity, bounds, timeframe, and appointed administrator.',
      2: 'Step 2 of 11 — Plan Structure: Structure curriculum phases with courses, tasks, and date boundaries.',
      3: 'Step 3 of 11 — Progression Rules: Configure sequential or free progression and phase unlocking criteria.',
      4: 'Step 4 of 11 — Enrollment & Cohorting: Set open or closed enrollment, seat capacity, and registration rules.',
      5: 'Step 5 of 11 — Equivalency: Set prior completion credit recognition and syllabus version migration policies.',
      6: 'Step 6 of 11 — Grading Policy: Define pass mark thresholds, grading scales, and modular phase weights.',
      7: 'Step 7 of 11 — Credentials & Outputs: Configure completion certificates, digital badges, and transcript templates.',
      8: 'Step 8 of 11 — Diagnostic Evaluation: Configure pre-test baseline and post-test summative questionnaires.',
      9: 'Step 9 of 11 — Engagement & Community: Enable trainee CSAT feedback surveys, ratings, and discussion forum.',
      10: 'Step 10 of 11 — Recurring Cycles: Setup recurring cohort cycles and historical alumni transcript indexing.',
      11: 'Step 11 of 11 — Review & Publish: Audit plan parameters, verify validation gates, and publish or activate.'
    };

    let title = stepTitles[step] || `Step ${step} of 11`;
    let badge = `STEP ${step} / 11`;
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    let msg = stepDescriptions[step] || `Active: Step ${step} of 11`;
    if (action === 'completed') {
      const prev = step - 1;
      const prevTitle = stepTitles[prev]?.split(': ')[1] || `Step ${prev}`;
      const nextTitle = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      title = `Step ${prev} Completed Successfully`;
      badge = `STEP ${prev} COMPLETED`;
      msg = `Step ${prev} (${prevTitle}) saved & verified. Now proceeding to Step ${step} of 11: ${nextTitle}.`;
      type = 'success';
    } else if (action === 'back') {
      const stepName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      msg = `Navigated back to Step ${step} of 11 (${stepName}).`;
      type = 'info';
    } else if (action === 'jump') {
      const stepName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      msg = `Active: Step ${step} of 11 (${stepName}).`;
      type = 'info';
    }

    this.lmsData.showToast(msg, type, 4000, title, badge);
  }

  // Smoothly position active step element
  scrollToActiveStep(stepId: number) {
    setTimeout(() => {
      const vStepEl = document.getElementById(`app-step-item-v-${stepId}`);
      if (vStepEl) {
        vStepEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      const container = document.getElementById('plan-stepper-container');
      const stepEl = document.getElementById(`app-step-item-${stepId}`) || document.getElementById(`plan-step-item-${stepId}`);
      if (container && stepEl) {
        const containerRect = container.getBoundingClientRect();
        const stepRect = stepEl.getBoundingClientRect();
        const scrollOffset = container.scrollLeft + (stepRect.left - containerRect.left) - 20;
        container.scrollTo({
          left: Math.max(0, scrollOffset),
          behavior: 'smooth'
        });
      }
    }, 60);
  }

  /**
   * Load existing plan into stepper form for editing
   */
  loadPlanForEdit(planId: string) {
    const plan = this.lmsData.plans().find(p => p.id === planId);
    if (!plan) return;

    this.isEditing.set(true);
    this.editingPlanId.set(plan.id);
    this.editingPlan.set(plan);
    this.savedPlanResult.set(plan);

    // Patch plan form fields
    this.planForm.patchValue({
      name: plan.name || '',
      description: plan.description || '',
      startDate: plan.startDate || '01/01/2026',
      endDate: plan.endDate || '31/12/2026',
      durationType: plan.durationType || 'Yearly',
      recurringPlan: !!plan.recurringPlan,
      owner: {
        userId: plan.owner?.userId || null,
        name: plan.owner?.name || '',
        email: plan.owner?.email || '',
        contactNumber: plan.owner?.contactNumber || ''
      },
      progression: plan.progression || {
        mode: 'Sequential',
        completionRequirementForUnlock: 'All Courses & Assessments 100% Completed'
      },
      enrollment: plan.enrollmentConfig || {
        mode: plan.enrollmentType || 'Open',
        existingTraineeSelfRegistration: true,
        capacityEnabled: false,
        capacity: 100,
        waitlistEnabled: false,
        confirmation: 'Auto Onboard',
        termsRequirements: 'Trainees must adhere to BRAC Code of Conduct and complete all modules prior to certification.',
        traineeProfileFilters: {
          locations: ['Dhaka', 'Chittagong', 'Sylhet'],
          genders: ['All'],
          departments: ['Microfinance', 'Operations', 'Credit Analysis'],
          grades: ['Junior Officer', 'Officer', 'Senior Officer']
        }
      },
      equivalency: plan.equivalency || {
        samePublishedVersionSatisfies: true,
        newerVersionRequiresRetake: true,
        overrideEnabled: false,
        explanation: 'Course credit granted based on certified prior version completion. Trainee is exempt from re-taking identical syllabus modules.'
      },
      grading: plan.grading || {
        scope: 'Whole Plan',
        type: 'Percentage',
        planPassMark: 70,
        retakePolicy: 'Latest Valid Score',
        contentLevelPassRequired: true
      },
      credentials: plan.credentials || {
        certificateEnabled: true,
        certificateTemplateId: 'cert-exec-01',
        badgeEnabled: true,
        badgeId: 'badge-foundation',
        digitalBadges: ['badge-foundation'],
        honorsEnabled: true,
        honorsTopPercentile: 10,
        visibilityScope: 'Public',
        printVerificationEnabled: true,
        exportPdfEnabled: true,
        shareableSocialLinksEnabled: true
      },
      evaluation: plan.evaluation || {
        preTest: {
          enabled: false,
          requirement: 'Optional',
          questionnaireId: 'q-baseline-2026',
          questionnaireTitle: 'Baseline Technical Aptitude Q-2026 (v2.4)',
          questionnaireVersion: 'v2.4'
        },
        postTest: {
          enabled: true,
          requirement: 'Mandatory',
          questionnaireId: 'q-summative-2026',
          questionnaireTitle: 'Comprehensive Summative Evaluation Q-2026 (v2.0)',
          questionnaireVersion: 'v2.0'
        },
        releaseTiming: 'Immediate upon Plan Completion',
        resultDownloadEnabled: true
      },
      engagement: plan.engagement || {
        rating: { enabled: true, scale: '5-Star Scale', availability: 'Post-Completion Only' },
        feedback: { enabled: true, templateId: 'fb-std-2026', templateName: 'Standard Course & Plan Feedback Form', version: 'v2.3', releaseTiming: 'At Plan Completion' },
        forum: { enabled: true, topicCreationPermission: 'Instructors & Trainees', moderationPermission: 'LMS Co-Admins & Instructors', visibilityScope: 'All users', allowedPostFormats: ['Text', 'PDF Attachments', 'Code Snippets'] }
      },
      recurring: plan.recurringConfig || {
        enabled: !!plan.recurringPlan,
        cycleConfig: 'Annual Cycle',
        currentCycle: 'Cycle 1 (2026 Initial Cohort)',
        historicalCycleRetention: 'Full Snapshot & Immutable Transcript History',
        structureChangePolicy: 'Allow Phase Updates for Future Cycles without altering past records',
        reEnrollmentRule: 'Allow Trainees from Prior Cycles to Re-enroll'
      },
      alumniTracking: plan.alumniTracking !== undefined ? plan.alumniTracking : true
    });

    // Populate phases
    while (this.phasesArray.length !== 0) {
      this.phasesArray.removeAt(0);
    }
    if (plan.phases && plan.phases.length > 0) {
      plan.phases.forEach(p => {
        const weight = plan.grading?.phaseWeights?.find(w => w.phaseId === p.id)?.weight || Math.round(100 / plan.phases.length);
        this.addPhaseToForm(
          p.name,
          p.startDate,
          p.endDate,
          p.courseCount || 0,
          p.taskCount || 0,
          p.deliveryClassCount || 0,
          weight,
          p.prerequisiteStatus || 'None',
          p.certificateBadgeStatus || 'Configured',
          p.id,
          p.status || 'Ready'
        );
      });
    }

    // Enable direct step navigation for edit mode
    this.completedSteps.set(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
    this.isSection1Passed.set(true);

    this.lmsData.showToast(
      `Editing training plan: "${plan.name}". Navigate between steps to update any parameter.`,
      'info',
      4500,
      'Edit Mode Active',
      'STEPPER WIZARD'
    );
  }

  /**
   * Load draft into stepper form
   */
  loadDraft(draftId: string) {
    const draft = this.lmsData.plans().find(p => p.id === draftId && p.status === 'Draft');
    if (!draft) return;

    this.editingPlanId.set(draft.id);
    this.planForm.patchValue({
      name: draft.name || '',
      startDate: draft.startDate || '01/01/2026',
      endDate: draft.endDate || '31/12/2026',
      durationType: draft.durationType || 'Yearly'
    });

    if (draft.phases && draft.phases.length > 0) {
      while (this.phasesArray.length !== 0) {
        this.phasesArray.removeAt(0);
      }
      draft.phases.forEach(p => {
        this.addPhaseToForm(p.name, p.startDate, p.endDate, p.courseCount || 0, p.taskCount || 0, p.deliveryClassCount || 0, 50, p.prerequisiteStatus, p.certificateBadgeStatus, p.id, p.status);
      });
    }
  }

  addPhaseToForm(
    name: string,
    startDate: string,
    endDate: string,
    courseCount = 2,
    taskCount = 4,
    deliveryClassCount = 1,
    weight = 50,
    prerequisiteStatus: any = 'None',
    certificateBadgeStatus: any = 'Configured',
    id?: string,
    status: any = 'Ready'
  ) {
    const nextSeq = this.phasesArray.length + 1;
    const group = this.fb.group({
      id: [id || `phase-gen-${Date.now()}-${nextSeq}`],
      name: [name || `Phase ${nextSeq}: Milestone`, [Validators.required]],
      sequence: [nextSeq],
      startDate: [startDate, [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
      endDate: [endDate, [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
      status: [status || 'Ready'],
      courseCount: [courseCount],
      taskCount: [taskCount],
      deliveryClassCount: [deliveryClassCount],
      prerequisiteStatus: [prerequisiteStatus || (nextSeq === 1 ? 'None' : 'Pending')],
      certificateBadgeStatus: [certificateBadgeStatus || 'Configured'],
      weight: [weight]
    });
    this.phasesArray.push(group);
    this.planForm.markAsDirty();
  }

  saveDraftSilently(): Plan {
    const draftPlan = this.buildPlanObject('Draft');
    const existingIndex = this.lmsData.plans().findIndex(p => p.id === draftPlan.id);
    if (existingIndex >= 0) {
      this.lmsData.plans.update(list => {
        const copy = [...list];
        copy[existingIndex] = draftPlan;
        return copy;
      });
    } else {
      this.lmsData.plans.update(list => [draftPlan, ...list]);
    }
    this.editingPlanId.set(draftPlan.id);
    this.editingPlan.set(draftPlan);
    return draftPlan;
  }

  extractPhaseAtIndex(index: number) {
    const ctrl = this.phasesArray.at(index);
    const plan = this.editingPlan();
    const id = ctrl?.get('id')?.value || `PHASE-${plan?.planCode || 'PLAN'}-${String(index + 1).padStart(2, '0')}`;
    return {
      id,
      planId: plan?.id || 'plan-brac-01',
      name: ctrl?.get('name')?.value || `Phase ${index + 1}`,
      sequence: index + 1,
      startDate: ctrl?.get('startDate')?.value || '01/01/2026',
      endDate: ctrl?.get('endDate')?.value || '30/06/2026',
      status: ctrl?.get('status')?.value || 'Draft',
      courseCount: ctrl?.get('courseCount')?.value || 0,
      taskCount: ctrl?.get('taskCount')?.value || 0,
      deliveryClassCount: ctrl?.get('deliveryClassCount')?.value || 0,
      prerequisiteStatus: ctrl?.get('prerequisiteStatus')?.value || (index === 0 ? 'None' : 'Pending'),
      certificateBadgeStatus: ctrl?.get('certificateBadgeStatus')?.value || 'Configured',
      description: '',
      assignedCourses: []
    };
  }

  launchPhaseCreationFlow() {
    let planId = this.editingPlanId() || (this.editingPlan() ? this.editingPlan()!.id : null);
    if (!planId) {
      const draft = this.saveDraftSilently();
      planId = draft.id;
    }
    this.router.navigate(['/plans', planId, 'phases', 'create'], {
      queryParams: { returnUrl: `/plans/edit/${planId}`, returnStep: 2 }
    });
  }

  editPhaseInWizard(index: number) {
    const ctrl = this.phasesArray.at(index);
    if (!ctrl) return;

    let planId = this.editingPlanId() || (this.editingPlan() ? this.editingPlan()!.id : null);
    if (!planId) {
      const draft = this.saveDraftSilently();
      planId = draft.id;
    }

    const phaseId = ctrl.get('id')?.value;
    if (phaseId) {
      this.router.navigate(['/plans', planId, 'phases', 'edit', phaseId], {
        queryParams: { returnUrl: `/plans/edit/${planId}`, returnStep: 2 }
      });
    } else {
      this.router.navigate(['/plans', planId, 'phases', 'create'], {
        queryParams: { returnUrl: `/plans/edit/${planId}`, returnStep: 2 }
      });
    }
  }

  // Phase Modal Actions
  openAddPhaseModal() {
    this.editingPhaseIndex.set(null);
    const planStart = this.planForm.get('startDate')?.value || '01/01/2026';
    const planEnd = this.planForm.get('endDate')?.value || '31/12/2026';
    const nextSeq = this.phasesArray.length + 1;
    
    this.phaseModalForm.reset({
      name: `Phase ${nextSeq}: Milestone`,
      startDate: planStart,
      endDate: planEnd,
      courseCount: 2,
      taskCount: 4,
      deliveryClassCount: 1,
      prerequisiteStatus: nextSeq === 1 ? 'None' : 'Pending',
      certificateBadgeStatus: 'Configured',
      weight: Math.round(100 / nextSeq)
    });
    this.showAddPhaseModal.set(true);
  }

  openEditPhaseModal(index: number) {
    this.editingPhaseIndex.set(index);
    const ctrl = this.phasesArray.at(index);
    if (ctrl) {
      this.phaseModalForm.patchValue({
        name: ctrl.get('name')?.value,
        startDate: ctrl.get('startDate')?.value,
        endDate: ctrl.get('endDate')?.value,
        courseCount: ctrl.get('courseCount')?.value,
        taskCount: ctrl.get('taskCount')?.value,
        deliveryClassCount: ctrl.get('deliveryClassCount')?.value,
        prerequisiteStatus: ctrl.get('prerequisiteStatus')?.value,
        certificateBadgeStatus: ctrl.get('certificateBadgeStatus')?.value,
        weight: ctrl.get('weight')?.value || 50
      });
      this.showAddPhaseModal.set(true);
    }
  }

  savePhaseFromModal() {
    if (this.phaseModalForm.invalid) {
      this.phaseModalForm.markAllAsTouched();
      return;
    }

    const val = this.phaseModalForm.value;
    const editIdx = this.editingPhaseIndex();

    if (editIdx !== null) {
      const ctrl = this.phasesArray.at(editIdx);
      if (ctrl) {
        ctrl.patchValue({
          name: val.name.trim(),
          startDate: val.startDate.trim(),
          endDate: val.endDate.trim(),
          courseCount: Number(val.courseCount) || 0,
          taskCount: Number(val.taskCount) || 0,
          deliveryClassCount: Number(val.deliveryClassCount) || 0,
          prerequisiteStatus: val.prerequisiteStatus,
          certificateBadgeStatus: val.certificateBadgeStatus,
          weight: Number(val.weight) || 0
        });
      }
    } else {
      this.addPhaseToForm(
        val.name.trim(),
        val.startDate.trim(),
        val.endDate.trim(),
        Number(val.courseCount) || 0,
        Number(val.taskCount) || 0,
        Number(val.deliveryClassCount) || 0,
        Number(val.weight) || 0
      );
    }

    this.showAddPhaseModal.set(false);
    this.runValidationAudit();
  }

  removePhase(index: number) {
    if (this.phasesArray.length > 1) {
      this.phasesArray.removeAt(index);
      this.resequencePhases();
      this.runValidationAudit();
    }
  }

  movePhase(index: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= this.phasesArray.length) return;

    const current = this.phasesArray.at(index);
    const target = this.phasesArray.at(targetIdx);

    const tempVal = current.value;
    current.patchValue(target.value);
    target.patchValue(tempVal);

    this.resequencePhases();
    this.runValidationAudit();
  }

  resequencePhases() {
    this.phasesArray.controls.forEach((ctrl, idx) => {
      ctrl.patchValue({ sequence: idx + 1 });
    });
  }

  // Wizard Step State & Navigation Helpers
  getStepState(stepId: number): 'current' | 'done' | 'disabled' {
    if (this.currentStep() === stepId) return 'current';
    if (this.completedSteps().has(stepId)) return 'done';
    return 'disabled';
  }

  isStepClickable(stepId: number): boolean {
    if (stepId === 1) return true;
    if (this.isSection1Passed() || this.completedSteps().has(stepId) || stepId <= this.currentStep()) return true;
    return false;
  }

  getCurrentStepTitle(): string {
    const step = this.steps.find(s => s.id === this.currentStep());
    return step ? step.title : 'Design Learning Plan';
  }

  getCurrentStepSubtitle(): string {
    switch (this.currentStep()) {
      case 1:
        return 'Define core identity, bounds, timeframe, and appointed administrator for this learning plan.';
      case 2:
        return 'Structure sequential curriculum phases. Phases must be non-overlapping and bounded by Plan dates.';
      case 3:
        return 'Configure progression rules, unlocking criteria, and prerequisite enforcement between phases.';
      case 4:
        return 'Set enrollment model, seat capacity limits, self-registration links, and approval workflows.';
      case 5:
        return 'Determine prior completion equivalency, syllabus version upgrades, and exemption credits.';
      case 6:
        return 'Configure grading scale, pass mark thresholds, and modular phase weight allocations.';
      case 7:
        return 'Set official transcript templates, accredited certificate formats, and digital badge awards.';
      case 8:
        return 'Configure pre-test diagnostic baselines and summative post-test evaluation questionnaires.';
      case 9:
        return 'Enable learner CSAT feedback surveys, 5-star ratings, and cohort discussion community forums.';
      case 10:
        return 'Configure repeating annual/quarterly cycles and historical alumni transcript indexing.';
      case 11:
        return 'Review all 10 architectural blocks, run live validation audits, and publish the learning plan.';
      default:
        return 'Configure comprehensive learning plan parameters.';
    }
  }

  resetCurrentStep() {
    const step = this.currentStep();
    if (step === 1) {
      this.planForm.patchValue({
        name: '',
        description: '',
        startDate: '01/01/2026',
        endDate: '31/12/2026',
        durationType: 'Yearly',
        recurringPlan: false,
        owner: {
          userId: null,
          name: '',
          email: '',
          contactNumber: ''
        }
      });
      this.formErrorAlert.set(null);
    } else if (step === 2) {
      while (this.phasesArray.length !== 0) {
        this.phasesArray.removeAt(0);
      }
      this.addPhaseToForm('Phase 1: Foundation & Core Principles', '01/01/2026', '30/06/2026', 3, 6, 2, 50);
      this.addPhaseToForm('Phase 2: Advanced Application & Capstone', '01/07/2026', '31/12/2026', 2, 4, 2, 50);
    } else if (step === 3) {
      this.planForm.get('progression')?.reset({
        mode: '',
        completionRequirementForUnlock: 'All Courses & Assessments 100% Completed'
      });
    } else if (step === 4) {
      this.planForm.get('enrollment')?.reset({
        mode: 'Open',
        existingTraineeSelfRegistration: false,
        capacityEnabled: false,
        capacity: 100,
        waitlistEnabled: false,
        confirmation: 'Auto Onboard',
        termsRequirements: 'Trainees must adhere to BRAC Code of Conduct and complete all modules prior to certification.'
      });
    } else if (step === 6) {
      this.planForm.get('grading')?.reset({
        scope: 'Whole Plan',
        type: 'Percentage',
        planPassMark: 70,
        contentLevelPassRequired: false,
        retakePolicy: 'Latest Valid Score'
      });
    }
    this.lmsData.showToast('Current step form fields have been reset.', 'info', 3000, 'Step Reset');
  }

  // Wizard Step Navigation & Validation Gates (§2, §3.3, §13)
  goToStep(stepId: number) {
    if (stepId === this.currentStep()) return;

    // Gate: Section 01 must pass before accessing other sections (§3.3)
    if (stepId > 1 && !this.validateSection1()) {
      this.formErrorAlert.set('Please complete all mandatory fields in Basic Information (Name, Valid Start & End Date, Duration, and Owner Email) before proceeding.');
      this.lmsData.showToast(
        'Please complete and fix mandatory Basic Information before proceeding to other sections.',
        'error',
        4000,
        'Validation Required'
      );
      this.currentStep.set(1);
      this.scrollToFirstError();
      return;
    }

    this.formErrorAlert.set(null);
    this.currentStep.set(stepId);
    this.showStepAlert(stepId, 'jump');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.scrollToActiveStep(stepId);
    this.runValidationAudit();
  }

  nextStep() {
    this.formErrorAlert.set(null);

    if (this.currentStep() === 1) {
      if (!this.validateSection1()) {
        this.formErrorAlert.set('All mandatory fields in Basic Information (Plan Name, Start Date, End Date, Duration Type, Owner Name, and Owner Email) must be filled with valid values.');
        this.lmsData.showToast(
          'All mandatory fields in Basic Information must be filled up with valid values.',
          'error',
          4000,
          'Basic Information Incomplete'
        );
        this.scrollToFirstError();
        return;
      }
      this.isSection1Passed.set(true);
      this.completedSteps.update(set => {
        const s = new Set(set);
        s.add(1);
        return s;
      });
    }

    if (this.currentStep() === 2) {
      if (this.phasesArray.length === 0) {
        this.formErrorAlert.set('At least one phase must be configured in Plan Structure before proceeding.');
        this.scrollToFirstError();
        return;
      }
    }

    if (this.currentStep() < this.steps.length) {
      this.completedSteps.update(set => {
        const s = new Set(set);
        s.add(this.currentStep());
        return s;
      });
      const next = this.currentStep() + 1;
      this.currentStep.set(next);
      this.showStepAlert(next, 'completed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.scrollToActiveStep(next);
      this.runValidationAudit();
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      const prev = this.currentStep() - 1;
      this.currentStep.set(prev);
      this.showStepAlert(prev, 'back');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.scrollToActiveStep(prev);
    }
  }

  validateSection1(): boolean {
    const name = this.planForm.get('name');
    const start = this.planForm.get('startDate');
    const end = this.planForm.get('endDate');
    const duration = this.planForm.get('durationType');
    const ownerName = this.planForm.get('owner.name');
    const ownerEmail = this.planForm.get('owner.email');

    name?.markAsTouched();
    start?.markAsTouched();
    end?.markAsTouched();
    duration?.markAsTouched();
    ownerName?.markAsTouched();
    ownerEmail?.markAsTouched();

    if (!name?.valid || !start?.valid || !end?.valid || !duration?.valid || !ownerName?.valid || !ownerEmail?.valid) {
      return false;
    }

    const startDateParsed = parseDateDDMMYYYY(start.value);
    const endDateParsed = parseDateDDMMYYYY(end.value);

    if (!startDateParsed || !endDateParsed || startDateParsed.getTime() >= endDateParsed.getTime()) {
      return false;
    }

    return true;
  }

  runValidationAudit() {
    const plan = this.buildPlanObject('Draft');
    const phases = this.extractPhases();
    const result = validateComprehensivePlan(plan, phases);
    this.validationIssues.set(result.issues);
  }

  criticalErrors = computed(() => {
    return this.validationIssues().filter(i => i.severity === 'critical');
  });

  warningIssues = computed(() => {
    return this.validationIssues().filter(i => i.severity === 'warning' || i.severity === 'info');
  });

  isFieldInvalid(name: string): boolean {
    const f = this.planForm.get(name);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  isOwnerFieldInvalid(name: string): boolean {
    const f = this.planForm.get(`owner.${name}`);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  onSelectExistingUser(userId: string | null) {
    if (!userId) return;
    const user = this.lmsData.tenantUsers().find(u => u.id === userId);
    if (user) {
      this.planForm.get('owner')?.patchValue({
        userId: user.id,
        name: user.name,
        email: user.email,
        contactNumber: '0171300' + Math.floor(1000 + Math.random() * 9000)
      });
      this.planForm.get('owner')?.markAsDirty();
    }
  }

  copyRegistrationLink() {
    navigator.clipboard?.writeText(this.generatedRegistrationLink());
    this.lmsData.showToast(
      'Open Registration Link copied to clipboard.',
      'success',
      3000,
      'Link Copied'
    );
  }

  copyPlanCode() {
    navigator.clipboard?.writeText(this.generatedPlanCode());
    this.lmsData.showToast(
      `Plan Code ${this.generatedPlanCode()} copied.`,
      'success',
      3000,
      'Code Copied'
    );
  }

  // Extract Phases from Form
  extractPhases(): Phase[] {
    return this.phasesArray.controls.map((ctrl, idx) => ({
      id: ctrl.get('id')?.value || `phase-${Date.now()}-${idx + 1}`,
      planId: `plan-${Date.now()}`,
      name: ctrl.get('name')?.value || `Phase ${idx + 1}`,
      sequence: idx + 1,
      startDate: ctrl.get('startDate')?.value || '01/01/2026',
      endDate: ctrl.get('endDate')?.value || '31/03/2026',
      status: ctrl.get('status')?.value || 'Ready',
      courseCount: Number(ctrl.get('courseCount')?.value) || 0,
      taskCount: Number(ctrl.get('taskCount')?.value) || 0,
      deliveryClassCount: Number(ctrl.get('deliveryClassCount')?.value) || 0,
      prerequisiteStatus: ctrl.get('prerequisiteStatus')?.value || 'None',
      certificateBadgeStatus: ctrl.get('certificateBadgeStatus')?.value || 'Configured'
    }));
  }

  // Build Full Plan Object
  buildPlanObject(status: PlanStatus = 'Published'): Plan {
    const val = this.planForm.value;
    const todayStr = formatDateDDMMYYYY(new Date());
    const phases = this.extractPhases();
    const existing = this.editingPlan();

    return {
      id: this.editingPlanId() || this.savedPlanResult()?.id || `plan-${Date.now()}`,
      planCode: existing?.planCode || this.generatedPlanCode(),
      lmsId: existing?.lmsId || this.activeLms().id,
      organizationId: existing?.organizationId || this.activeTenant().id,
      name: (val.name || '').trim(),
      description: (val.description || '').trim(),
      owner: {
        userId: val.owner?.userId || null,
        name: (val.owner?.name || '').trim(),
        email: (val.owner?.email || '').trim(),
        contactNumber: val.owner?.contactNumber ? val.owner.contactNumber.trim() : undefined,
        assignedAt: existing?.owner?.assignedAt || todayStr,
        assignedBy: existing?.owner?.assignedBy || (this.lmsData.activeUser().name || 'LMS Admin'),
        invitationStatus: existing?.owner?.invitationStatus || 'accepted'
      },
      durationType: val.durationType as DurationType,
      startDate: (val.startDate || '').trim(),
      endDate: (val.endDate || '').trim(),
      enrollmentType: val.enrollment?.mode as EnrollmentType || val.enrollmentType || 'Open',
      recurringPlan: val.recurring?.enabled ? `Yes (${val.recurring?.cycleConfig || 'Annual Cycle'})` : null,
      status: this.isEditing() ? (existing?.status || status) : status,
      phaseCount: phases.length,
      createdDate: existing?.createdDate || todayStr,
      createdBy: existing?.createdBy || (this.lmsData.activeUser().name || 'LMS Admin'),
      updatedDate: todayStr,
      publishedAt: existing?.publishedAt || (status === 'Published' || status === 'Active' ? todayStr : null),
      publishedBy: existing?.publishedBy || (status === 'Published' || status === 'Active' ? this.lmsData.activeUser().name : null),
      lastCompletedSection: this.currentStep(),
      phases,
      capabilities: existing?.capabilities || {
        canEdit: true,
        canAssignOwner: true,
        canActivate: status === 'Published',
        canArchive: true,
        protectedFields: status === 'Active' ? ['startDate', 'endDate', 'durationType'] : []
      },
      progression: val.progression,
      enrollmentConfig: val.enrollment,
      equivalency: val.equivalency,
      grading: {
        ...val.grading,
        phaseWeights: phases.map((p, idx) => ({
          phaseId: p.id,
          phaseName: p.name,
          weight: this.phasesArray.at(idx)?.get('weight')?.value || 50
        }))
      },
      credentials: val.credentials,
      evaluation: val.evaluation,
      engagement: val.engagement,
      recurringConfig: val.recurring,
      alumniTracking: val.alumniTracking
    };
  }

  // Save Draft Action (§14)
  saveDraft() {
    this.isSubmitting.set(true);
    const draftPlan = this.buildPlanObject('Draft');

    // Add or update in service
    const existingIndex = this.lmsData.plans().findIndex(p => p.id === draftPlan.id);
    if (existingIndex >= 0) {
      this.lmsData.plans.update(list => {
        const copy = [...list];
        copy[existingIndex] = draftPlan;
        return copy;
      });
    } else {
      this.lmsData.plans.update(list => [draftPlan, ...list]);
    }

    this.savedPlanResult.set(draftPlan);
    this.isSubmitting.set(false);

    this.lmsData.logAction(
      'Plan Draft Saved',
      `Saved training plan "${draftPlan.name || draftPlan.planCode}" as Draft.`,
      'info'
    );

    // Exact required message (§18.2): "Plan saved as Draft."
    this.lmsData.showToast(
      'Plan saved as Draft.',
      'success',
      4000,
      'Draft Saved'
    );
  }

  // Publish / Update Action (§15)
  onPublishClick() {
    this.runValidationAudit();
    if (this.criticalErrors().length > 0) {
      this.lmsData.showToast(
        'Cannot save Plan. Please fix critical validation errors first.',
        'error',
        4000,
        'Critical Validation Failed'
      );
      this.currentStep.set(11);
      return;
    }
    if (this.isEditing()) {
      this.confirmUpdatePlan();
    } else {
      this.showPublishModal.set(true);
    }
  }

  confirmUpdatePlan() {
    this.isSubmitting.set(true);
    const updatedPlan = this.buildPlanObject(this.editingPlan()?.status || 'Published');

    const existingIndex = this.lmsData.plans().findIndex(p => p.id === updatedPlan.id);
    if (existingIndex >= 0) {
      this.lmsData.plans.update(list => {
        const copy = [...list];
        copy[existingIndex] = updatedPlan;
        return copy;
      });
    } else {
      this.lmsData.plans.update(list => [updatedPlan, ...list]);
    }

    this.savedPlanResult.set(updatedPlan);
    this.isSubmitting.set(false);

    this.lmsData.logAction(
      'Plan Updated',
      `Updated plan "${updatedPlan.name}" (${updatedPlan.planCode}) successfully via stepper wizard.`,
      'success'
    );

    this.lmsData.showToast(
      `Plan "${updatedPlan.name}" updated successfully.`,
      'success',
      4500,
      'Plan Updated'
    );

    this.router.navigate(['/plans/details', updatedPlan.id]);
  }

  confirmPublish() {
    this.isSubmitting.set(true);
    this.showPublishModal.set(false);

    const publishedPlan = this.buildPlanObject('Published');
    publishedPlan.status = 'Published';
    publishedPlan.publishedAt = formatDateDDMMYYYY(new Date());
    publishedPlan.publishedBy = this.lmsData.activeUser().name || 'LMS Admin';
    publishedPlan.capabilities = {
      canEdit: true,
      canAssignOwner: true,
      canActivate: true,
      canArchive: true,
      protectedFields: []
    };

    const existingIndex = this.lmsData.plans().findIndex(p => p.id === publishedPlan.id);
    if (existingIndex >= 0) {
      this.lmsData.plans.update(list => {
        const copy = [...list];
        copy[existingIndex] = publishedPlan;
        return copy;
      });
    } else {
      this.lmsData.plans.update(list => [publishedPlan, ...list]);
    }

    this.savedPlanResult.set(publishedPlan);
    this.isSubmitting.set(false);

    this.lmsData.logAction(
      'Plan Published',
      `Published plan "${publishedPlan.name}" (${publishedPlan.planCode}) successfully.`,
      'success'
    );

    this.lmsData.showToast(
      'Plan published successfully.',
      'success',
      4500,
      'Plan Published'
    );

    // Final submit redirects back to Plan Grid page
    this.router.navigate(['/plans']);
  }

  // Activate Action (§16 - Lifecycle)
  onActivateClick() {
    this.showActivateModal.set(true);
  }

  confirmActivate() {
    const plan = this.savedPlanResult();
    if (!plan) return;

    this.showActivateModal.set(false);
    this.isSubmitting.set(true);

    const activePlan: Plan = {
      ...plan,
      status: 'Active',
      capabilities: {
        canEdit: true,
        canAssignOwner: true,
        canActivate: false,
        canArchive: true,
        protectedFields: ['startDate', 'endDate', 'durationType']
      }
    };

    const existingIndex = this.lmsData.plans().findIndex(p => p.id === activePlan.id);
    if (existingIndex >= 0) {
      this.lmsData.plans.update(list => {
        const copy = [...list];
        copy[existingIndex] = activePlan;
        return copy;
      });
    }

    this.savedPlanResult.set(activePlan);
    this.isSubmitting.set(false);

    this.lmsData.logAction(
      'Plan Activated',
      `Activated learning plan "${activePlan.name}" (${activePlan.planCode})`,
      'success'
    );

    // Exact required message (§16 #6, §18.2): "[Plan_Name] is activated"
    this.lmsData.showToast(
      `${activePlan.name} is activated`,
      'success',
      5000,
      'Plan Activated'
    );

    // Final submit redirects back to Plan Grid page
    this.router.navigate(['/plans']);
  }

  async onCancel() {
    this.discardChanges();
  }

  discardChanges() {
    this.modalService.confirmDiscard({
      title: 'Discard Plan Wizard?',
      message: 'You have active changes in this learning plan wizard. Would you like to save your progress as a draft to resume later?',
      draftText: 'Save as Draft & Exit',
      discardText: 'Discard & Exit',
      cancelText: 'Continue Editing',
      onDraft: () => this.saveAsDraftAndExit(),
      onDiscard: () => this.router.navigate(['/plans'])
    });
  }

  saveAsDraftAndExit() {
    this.saveDraft();
    this.router.navigate(['/plans']);
  }

  saveDraftInPlace() {
    this.saveDraft();
  }

  goBack() {
    this.discardChanges();
  }

  private scrollToFirstError() {
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
