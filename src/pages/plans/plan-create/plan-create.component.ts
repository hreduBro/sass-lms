import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  Plan, 
  PlanStatus,
  PlanComponent,
  PlanComponentType,
  PlanOnboardedUser,
  OnboardingScope,
  PlanBudget,
  RegistrationFormField,
  MarketingEnrollmentConfig,
  createWorkedExamplePlan,
  validateComponentBasedPlan,
  getDurationDays,
  parseDateDDMMYYYY,
  formatDateDDMMYYYY
} from '../../../models/plan.model';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';
import { DatePickerComponent } from '../../../components/date-picker/date-picker.component';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import { ComponentDrawerComponent } from './component-drawer/component-drawer.component';
import { ReviewModalComponent } from './review-modal/review-modal.component';
import { BulkUploadModalComponent } from './bulk-upload-modal/bulk-upload-modal.component';

@Component({
  selector: 'app-plan-create',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    StepperComponent,
    CustomSelectComponent,
    CustomAvatarComponent,
    DatePickerComponent,
    ComponentDrawerComponent,
    ReviewModalComponent,
    BulkUploadModalComponent
  ],
  templateUrl: './plan-create.component.html',
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-step {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
})
export class PlanCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private lmsData = inject(LmsDataService);
  private modalService = inject(ConfirmationModalService);

  activeTenant = this.lmsData.activeTenant;
  activeLms = this.lmsData.activeLms;

  // Active Wizard Step (1: Basic Info, 2: Plan Builder, 3: User Onboarding)
  currentStep = signal<1 | 2 | 3>(1);

  // Welcome Alert & Form Error States
  showWelcomeAlert = signal<boolean>(true);
  formErrorAlert = signal<string | null>(null);
  stepSuccessAlert = signal<string | null>(null);

  // Stepper definition
  steps: StepperStep[] = [
    { id: 1, shortTitle: 'Curriculum Identity', sublabel: 'Identity & Bounds', icon: 'info' },
    { id: 2, shortTitle: 'Component Canvas', sublabel: 'Structure & Phases', icon: 'account_tree' },
    { id: 3, shortTitle: 'User Tagging', sublabel: 'Cohorts & Rosters', icon: 'groups' }
  ];

  completedSteps = computed<Set<number>>(() => {
    const s = new Set<number>();
    if (this.currentStep() > 1 && this.basicForm.valid) {
      s.add(1);
    }
    if (this.currentStep() > 2) {
      s.add(2);
    }
    return s;
  });

  // Edit / Plan state
  isEditing = signal<boolean>(false);
  planId = signal<string>('plan-fodp-2026');
  planCode = signal<string>('PLN-1972-882');
  planStatus = signal<PlanStatus>('Draft');
  lastSavedAt = signal<string>('Just now');

  // Plan Completion Tagging State (§ Requirements 5 & 6)
  planCompletionSkills = signal<string[]>(['skill-001', 'skill-002']);

  // Core Data
  components = signal<PlanComponent[]>([]);
  onboardedUsers = signal<PlanOnboardedUser[]>([]);

  // Step 01 Form: Basic Information
  basicForm: FormGroup = this.fb.group({
    name: ['Field Officer Development Programme 2026', [Validators.required, Validators.minLength(3)]],
    description: [
      'Comprehensive annual qualification track for BRAC rural microfinance field officers, encompassing grassroots operations, digital credit assessment, and community development methodologies.',
      [Validators.required]
    ],
    startDate: ['01/01/2026', [Validators.required]],
    endDate: ['31/12/2026', [Validators.required]],
    durationType: ['Yearly', [Validators.required]],
    enrollmentType: ['Closed', [Validators.required]],
    recurringPlan: [true],
    fiscalStartDate: ['01/01/2026', [Validators.required]],
    fiscalEndDate: ['31/12/2026', [Validators.required]],
    budgetYear: ['FY 2026'],
    budgetAmount: [4500000, [Validators.required, Validators.min(0)]],
    actualBurn: [0, [Validators.min(0)]],
    currency: ['BDT', [Validators.required]],
    defaultProgressionMode: ['Sequential', [Validators.required]],
    ownerUserId: ['usr-admin-01', [Validators.required]],
    planCompletionCertificateId: ['cert-tpl-001'],
    planCompletionBadgeId: ['badge-tpl-001']
  });

  // Marketing & Trainee Intake Form Template State
  enrollmentMode = signal<'internal' | 'public'>('internal');
  marketingEnabled = signal<boolean>(false);
  marketingSlug = signal<string>('pln-fodp-2026');
  marketingCampaignTitle = signal<string>('Field Officer Development Programme 2026');
  marketingCampaignDescription = signal<string>('Open intake enrollment for aspiring BRAC microfinance leaders and field credit officers.');
  marketingBannerHeadline = signal<string>('Join BRAC Community Transformation Academy');
  showMarketingPreview = signal<boolean>(false);

  enrollmentModeOptions: SelectOption[] = [
    { value: 'internal', label: 'Internal Cohort Only (Default)', sublabel: 'Restricted roster onboarding for internal personnel' },
    { value: 'public', label: 'Public / Marketing Enrollment', sublabel: 'Generate public enrollment link and configure trainee intake form' }
  ];

  onEnrollmentModeChange(mode: string) {
    this.enrollmentMode.set(mode as 'internal' | 'public');
    this.marketingEnabled.set(mode === 'public');
  }

  // New Custom Intake Field Form State
  newFieldLabel = signal<string>('');
  newFieldType = signal<'text' | 'email' | 'tel' | 'number' | 'textarea'>('text');
  newFieldRequired = signal<boolean>(false);
  showAddCustomFieldModal = signal<boolean>(false);

  intakeFormFields = signal<RegistrationFormField[]>([
    { id: 'fld-name', name: 'fullName', label: 'Full Legal Name', type: 'text', required: true, enabled: true, placeholder: 'e.g. Farhana Ahmed', helpText: 'Official identity as per national NID' },
    { id: 'fld-email', name: 'email', label: 'Primary Email Address', type: 'email', required: true, enabled: true, placeholder: 'e.g. farhana.ahmed@brac.net', helpText: 'Confirmation credentials will be delivered here' },
    { id: 'fld-phone', name: 'phone', label: 'Telephone / Mobile Number', type: 'tel', required: true, enabled: true, placeholder: 'e.g. +880 1713-001122', helpText: 'Direct SMS notifications for batch schedules' },
    { id: 'fld-dept', name: 'department', label: 'Organization / Branch Name', type: 'text', required: false, enabled: true, placeholder: 'e.g. Microfinance Field Operations (Rangpur)', helpText: 'Current operational assignment' },
    { id: 'fld-pin', name: 'pin', label: 'BRAC PIN / Staff ID', type: 'text', required: false, enabled: true, placeholder: 'e.g. PIN-77291', helpText: 'Leave empty if external candidate' },
    { id: 'fld-title', name: 'designation', label: 'Current Designation / Role', type: 'text', required: false, enabled: true, placeholder: 'e.g. Junior Field Officer', helpText: 'Current job responsibility' },
    { id: 'fld-motivation', name: 'motivation', label: 'Statement of Purpose / Why do you wish to join?', type: 'textarea', required: false, enabled: true, placeholder: 'Briefly explain your learning goals and field expectations...', helpText: 'Reviewed by the Plan Admissions Committee' }
  ]);

  marketingPublicLink = computed(() => {
    const pid = this.planId();
    const slug = this.marketingSlug();
    return `/login?enrollType=plan&targetId=${pid}&code=${slug}`;
  });

  generateMarketingLink() {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newSlug = `mkt-${this.planCode().toLowerCase()}-${randomSuffix}`;
    this.marketingSlug.set(newSlug);
    this.marketingEnabled.set(true);
    this.copyMarketingLink();
    this.lmsData.showToast(`New marketing enrollment link generated and copied to clipboard!`, 'success', 4000, 'Marketing Link Active', 'MARKETING');
  }

  copyMarketingLink() {
    const fullUrl = `${window?.location?.origin || ''}${this.marketingPublicLink()}`;
    navigator.clipboard?.writeText(fullUrl);
    this.lmsData.showToast(`Marketing enrollment link copied: ${fullUrl}`, 'info', 3500, 'Link Copied');
  }

  toggleFieldEnabled(id: string) {
    this.intakeFormFields.update(fields => fields.map(f => {
      if (f.id === id) {
        if (f.required && f.enabled) return f;
        return { ...f, enabled: !f.enabled };
      }
      return f;
    }));
  }

  toggleFieldRequired(id: string) {
    this.intakeFormFields.update(fields => fields.map(f => {
      if (f.id === id) {
        if (f.name === 'fullName' || f.name === 'email') return f;
        return { ...f, required: !f.required };
      }
      return f;
    }));
  }

  addCustomField() {
    const label = this.newFieldLabel().trim();
    if (!label) {
      this.lmsData.showToast('Field label is required.', 'error');
      return;
    }
    const name = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newField: RegistrationFormField = {
      id: `custom-fld-${Date.now()}`,
      name,
      label,
      type: this.newFieldType(),
      required: this.newFieldRequired(),
      enabled: true,
      placeholder: `Enter ${label}...`
    };
    this.intakeFormFields.update(f => [...f, newField]);
    this.newFieldLabel.set('');
    this.newFieldRequired.set(false);
    this.showAddCustomFieldModal.set(false);
    this.lmsData.showToast(`Added custom intake field "${label}" to registration template.`, 'success');
  }

  removeCustomField(id: string) {
    this.intakeFormFields.update(f => f.filter(item => item.id !== id));
    this.lmsData.showToast('Field removed from template.', 'info');
  }

  // Step 02 State: Plan Builder
  activePhaseFilter = signal<string>('all'); // 'all' or phaseId
  collapsedPhases = signal<Set<string>>(new Set());

  // Component Drawer State
  isDrawerOpen = signal<boolean>(false);
  isEditingComponent = signal<boolean>(false);
  componentToEdit = signal<PlanComponent | null>(null);
  drawerInitialType = signal<PlanComponentType>('Task');
  drawerTargetPhaseId = signal<string | null>(null);

  // Review & Validation Modal
  isReviewModalOpen = signal<boolean>(false);

  // Bulk Upload Modal State
  isBulkUploadOpen = signal<boolean>(false);

  // Step 03 State: User Onboarding
  activeOnboardingScope = signal<OnboardingScope>('Whole Plan');
  onboardingSearchQuery = signal<string>('');
  onboardingStatusFilter = signal<string>('all');
  onboardingMethodFilter = signal<string>('all');

  // Add individual user form state
  showAddIndividualForm = signal<boolean>(false);
  individualUserForm: FormGroup = this.fb.group({
    identifierType: ['BRAC PIN', Validators.required],
    identifierValue: ['', [Validators.required, Validators.minLength(2)]],
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    designation: ['Junior Field Officer'],
    department: ['Microfinance (Field Operations)']
  });

  // Dropdown options
  durationTypeOptions: SelectOption[] = [
    { value: 'Yearly', label: 'Yearly (12 Months)', sublabel: 'Full financial or calendar year' },
    { value: 'Fixed Window', label: 'Fixed Window (Specified Date Range)', sublabel: 'Explicit start and end calendar dates' },
    { value: 'Quarterly', label: 'Quarterly (3 Months)', sublabel: 'Seasonal / quarterly training track' },
    { value: 'Monthly', label: 'Monthly (30 Days)', sublabel: 'Short-term targeted onboarding' },
    { value: 'Self-Paced / Open', label: 'Self-Paced / Open', sublabel: 'Continuous enrollment without rigid deadlines' }
  ];

  enrollmentTypeOptions: SelectOption[] = [
    { value: 'Closed', label: 'Closed (Cohort Roster Only)', sublabel: 'Strict enrollment via Step 3 roster upload' },
    { value: 'Open', label: 'Open Self-Enrollment', sublabel: 'Any eligible staff can enroll directly' },
    { value: 'Approval Required', label: 'Manager / Supervisor Approval', sublabel: 'Requires departmental sign-off' }
  ];

  progressionModeOptions: SelectOption[] = [
    { value: 'Sequential', label: 'Sequential (Strict Path)', sublabel: 'Must complete items in exact sequential order' },
    { value: 'Non-Sequential', label: 'Non-Sequential (Flexible Free-Flow)', sublabel: 'Learners can complete components in any order' },
    { value: 'Hybrid Phase-Gated', label: 'Hybrid Phase-Gated', sublabel: 'Free flow within phase, sequential across phases' }
  ];

  budgetYearOptions: SelectOption[] = [
    { value: 'FY 2025', label: 'FY 2025' },
    { value: 'FY 2026', label: 'FY 2026' },
    { value: 'FY 2027', label: 'FY 2027' },
    { value: 'FY 2028', label: 'FY 2028' }
  ];

  currencyOptions: SelectOption[] = [
    { value: 'BDT', label: 'BDT (Bangladeshi Taka)' },
    { value: 'USD', label: 'USD (US Dollar)' },
    { value: 'EUR', label: 'EUR (Euro)' },
    { value: 'GBP', label: 'GBP (British Pound)' }
  ];

  ownerOptions = computed<SelectOption[]>(() => {
    return [
      { value: 'usr-admin-01', label: 'Farhana Ahmed', sublabel: 'Lead Training Architect · farhana.ahmed@brac.net' },
      { value: 'usr-admin-02', label: 'Dr. Rafiqul Islam', sublabel: 'Senior Field Operations Advisor · rafiqul.islam@brac.net' },
      { value: 'usr-admin-03', label: 'Nasreen Begum', sublabel: 'Regional Training Manager · nasreen.begum@brac.net' },
      { value: 'usr-admin-04', label: 'Tariq Rahman', sublabel: 'LMS System Administrator · tariq.rahman@brac.net' }
    ];
  });

  // Step 3 Filter options
  onboardingStatusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Ready', label: 'Ready', badge: 'Ready', badgeClass: 'bg-amber-100 text-amber-800' },
    { value: 'Active', label: 'Active', badge: 'Active', badgeClass: 'bg-emerald-100 text-emerald-800' },
    { value: 'Unresolved', label: 'Unresolved', badge: 'Action Required', badgeClass: 'bg-rose-100 text-rose-800' }
  ];

  onboardingMethodOptions: SelectOption[] = [
    { value: 'all', label: 'All Sources' },
    { value: 'Bulk Upload', label: 'Bulk Upload (.CSV)' },
    { value: 'Individual', label: 'Individual Entry' }
  ];

  individualIdentifierOptions: SelectOption[] = [
    { value: 'BRAC PIN', label: 'BRAC PIN (Staff ID)', sublabel: 'e.g. PIN-10492' },
    { value: 'Email', label: 'Email Address', sublabel: 'e.g. user@brac.net' }
  ];

  // Plan Completion Competencies & Credentials (§ Requirements 5 & 6)
  skillOptions = computed<SelectOption[]>(() => {
    return this.lmsData.skills().map(s => ({
      value: s.skillId,
      label: s.name,
      sublabel: `${s.skillCode} • ${s.category || 'Competency'}`
    }));
  });

  certificateOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'None (No Graduation Certificate)' },
    ...this.lmsData.certificateTemplates().map(c => ({
      value: c.id,
      label: c.name,
      sublabel: `Template: ${c.type || 'Standard'}`
    }))
  ]);

  badgeOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'None (No Graduation Badge)' },
    ...this.lmsData.badgeTemplates().map(b => ({
      value: b.templateId,
      label: b.name,
      sublabel: `Category: ${b.category || 'Milestone'}`
    }))
  ]);

  onPlanCompletionSkillsChange(skills: string[]) {
    this.planCompletionSkills.set(skills || []);
  }

  // Current Plan representation
  currentPlan = computed<Plan>(() => {
    const val = this.basicForm.value;
    const ownerObj = this.ownerOptions().find(o => o.value === val.ownerUserId);
    const certObj = this.certificateOptions().find(c => c.value === val.planCompletionCertificateId);
    const badgeObj = this.badgeOptions().find(b => b.value === val.planCompletionBadgeId);

    return {
      id: this.planId(),
      planCode: this.planCode(),
      lmsId: this.activeLms()?.id || 'lms-microfinance-brac',
      organizationId: this.activeTenant()?.id || 'tenant-brac',
      name: val.name || 'Untitled Plan',
      description: val.description || '',
      owner: {
        userId: val.ownerUserId || 'usr-admin-01',
        name: ownerObj?.label || 'Farhana Ahmed',
        email: ownerObj?.sublabel?.split('· ')[1] || 'farhana.ahmed@brac.net',
        contactNumber: '+880 1713 000000',
        assignedAt: '01/01/2026',
        assignedBy: 'System Administrator'
      },
      durationType: val.durationType,
      startDate: val.startDate,
      endDate: val.endDate,
      enrollmentType: val.enrollmentType,
      recurringPlan: val.recurringPlan,
      status: this.planStatus(),
      phaseCount: this.phases().length,
      createdDate: '01/01/2026',
      createdBy: 'Farhana Ahmed',
      updatedDate: '01/01/2026',
      defaultProgressionMode: val.defaultProgressionMode,
      budget: {
        budgetYear: `${val.fiscalStartDate} - ${val.fiscalEndDate}`,
        fiscalStartDate: val.fiscalStartDate,
        fiscalEndDate: val.fiscalEndDate,
        budgetAmount: Number(val.budgetAmount) || 0,
        actualBurn: Number(val.actualBurn) || 0,
        currency: val.currency
      },
      marketingEnrollment: {
        enabled: this.marketingEnabled(),
        marketingSlug: this.marketingSlug(),
        publicLink: this.marketingPublicLink(),
        campaignTitle: this.marketingCampaignTitle(),
        campaignDescription: this.marketingCampaignDescription(),
        bannerHeadline: this.marketingBannerHeadline(),
        formTemplate: {
          formTitle: 'Curriculum Trainee Enrollment Application',
          formDescription: 'Please submit your personnel credentials to apply for this learning plan.',
          fields: this.intakeFormFields()
        }
      },
      // Plan Completion Tagging (§ Requirements 5 & 6)
      completionSkills: this.planCompletionSkills(),
      completionCertificateId: val.planCompletionCertificateId || undefined,
      completionCertificateName: certObj && certObj.value ? certObj.label : undefined,
      completionBadgeId: val.planCompletionBadgeId || undefined,
      completionBadgeName: badgeObj && badgeObj.value ? badgeObj.label : undefined
    };
  });

  // Derived Phases
  phases = computed<PlanComponent[]>(() => {
    return this.components().filter(c => c.type === 'Phase');
  });

  activeScopeDisplayName = computed<string>(() => {
    const scope = this.activeOnboardingScope();
    if (scope === 'Whole Plan') {
      return 'Whole Plan Cohort';
    }
    const ph = this.phases().find(p => p.id === scope);
    return ph?.name || scope;
  });

  existingUsersForActiveScope = computed<PlanOnboardedUser[]>(() => {
    const scope = this.activeOnboardingScope();
    return this.onboardedUsers().filter(u => u.scope === scope);
  });

  phaseFilterOptions = computed<SelectOption[]>(() => {
    const totalPhases = this.phases().length;
    const base: SelectOption[] = [
      {
        value: 'all',
        label: `All Phases (${totalPhases})`,
        icon: 'view_agenda'
      }
    ];

    const phaseOptions = this.phases().map((ph, idx) => ({
      value: ph.id,
      label: ph.name || `Phase ${idx + 1}`,
      sublabel: ph.startDate && ph.endDate ? `${ph.startDate} – ${ph.endDate}` : undefined,
      icon: 'timeline'
    }));

    return [...base, ...phaseOptions];
  });

  // Plan date order validation
  planDateOrderError = computed<string | null>(() => {
    const s = this.basicForm.get('startDate')?.value;
    const e = this.basicForm.get('endDate')?.value;
    const ds = parseDateDDMMYYYY(s);
    const de = parseDateDDMMYYYY(e);
    if (ds && de && de.getTime() < ds.getTime()) {
      return 'End date cannot be earlier than start date.';
    }
    return null;
  });

  // Plan duration in days
  computedPlanDuration = computed<number>(() => {
    const s = this.basicForm.get('startDate')?.value;
    const e = this.basicForm.get('endDate')?.value;
    const ds = parseDateDDMMYYYY(s);
    const de = parseDateDDMMYYYY(e);
    if (ds && de && de.getTime() < ds.getTime()) {
      return 0;
    }
    return getDurationDays(s, e);
  });

  // Validation report
  validationReport = computed(() => {
    return validateComponentBasedPlan(
      this.currentPlan(),
      this.components(),
      this.onboardedUsers()
    );
  });

  // Filtered onboarded users
  filteredOnboardedUsers = computed<PlanOnboardedUser[]>(() => {
    let list = this.onboardedUsers();
    const scope = this.activeOnboardingScope();

    // Filter by scope
    list = list.filter(u => u.scope === scope);

    // Search query
    const q = this.onboardingSearchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(u => 
        u.fullName.toLowerCase().includes(q) ||
        (u.bracPin && u.bracPin.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.designation && u.designation.toLowerCase().includes(q))
      );
    }

    // Filter status
    const sf = this.onboardingStatusFilter();
    if (sf !== 'all') {
      list = list.filter(u => u.status === sf);
    }

    // Filter method
    const mf = this.onboardingMethodFilter();
    if (mf !== 'all') {
      list = list.filter(u => u.source === mf);
    }

    return list;
  });

  // Unresolved users in whole plan or current scope
  unresolvedUsers = computed<PlanOnboardedUser[]>(() => {
    return this.onboardedUsers().filter(u => u.status === 'Unresolved');
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditing.set(true);
        this.planId.set(id);
        const existing = this.lmsData.plans().find(p => p.id === id);
        if (existing) {
          this.loadExistingPlan(existing);
          return;
        }
      }
      // Load the Worked Example as default starting preset
      this.loadWorkedExample();
    });

    // Display Welcome Toast Alert when landing on Step 1
    if (this.currentStep() === 1) {
      this.showWelcomeAlert.set(true);
      this.lmsData.showToast(
        'Welcome to Curriculum Plan Creation! Define core identifiers, duration bounds, budget, and curriculum owner.',
        'info',
        5000,
        'Welcome: Plan Creation Wizard',
        'STEP 1 / 3'
      );
    }
  }

  dismissWelcomeAlert() {
    this.showWelcomeAlert.set(false);
  }

  loadWorkedExample() {
    const example = createWorkedExamplePlan(
      this.activeLms()?.id || 'lms-microfinance-brac',
      this.activeTenant()?.id || 'tenant-brac'
    );

    this.planId.set(example.plan.id);
    this.planCode.set(example.plan.planCode);
    this.planStatus.set(example.plan.status);

    this.basicForm.patchValue({
      name: example.plan.name,
      description: example.plan.description,
      startDate: example.plan.startDate,
      endDate: example.plan.endDate,
      durationType: example.plan.durationType,
      enrollmentType: example.plan.enrollmentType,
      recurringPlan: example.plan.recurringPlan,
      budgetYear: example.plan.budget?.budgetYear || 'FY 2026',
      budgetAmount: example.plan.budget?.budgetAmount || 4500000,
      currency: example.plan.budget?.currency || 'BDT',
      defaultProgressionMode: example.plan.defaultProgressionMode || 'Sequential',
      ownerUserId: example.plan.owner?.userId || 'usr-admin-01',
      planCompletionCertificateId: example.plan.completionCertificateId || 'CERT-TMP-1972-01',
      planCompletionBadgeId: example.plan.completionBadgeId || 'badge-champ-01'
    });

    this.planCompletionSkills.set(example.plan.completionSkills || ['skl-001', 'skl-002']);
    this.components.set(example.components);
    this.onboardedUsers.set(example.onboardedUsers);
  }

  loadExistingPlan(plan: Plan) {
    this.planId.set(plan.id);
    this.planCode.set(plan.planCode);
    this.planStatus.set(plan.status);

    this.basicForm.patchValue({
      name: plan.name,
      description: plan.description,
      startDate: plan.startDate,
      endDate: plan.endDate,
      durationType: plan.durationType,
      enrollmentType: plan.enrollmentType,
      recurringPlan: plan.recurringPlan,
      budgetYear: plan.budget?.budgetYear || 'FY 2026',
      fiscalStartDate: plan.budget?.fiscalStartDate || plan.startDate,
      fiscalEndDate: plan.budget?.fiscalEndDate || plan.endDate,
      budgetAmount: plan.budget?.budgetAmount || 0,
      actualBurn: plan.budget?.actualBurn || 0,
      currency: plan.budget?.currency || 'BDT',
      defaultProgressionMode: plan.defaultProgressionMode || 'Sequential',
      ownerUserId: plan.owner?.userId || 'usr-admin-01'
    });

    if (plan.marketingEnrollment) {
      this.marketingEnabled.set(!!plan.marketingEnrollment.enabled);
      this.enrollmentMode.set(plan.marketingEnrollment.enabled ? 'public' : 'internal');
      if (plan.marketingEnrollment.marketingSlug) {
        this.marketingSlug.set(plan.marketingEnrollment.marketingSlug);
      }
      if (plan.marketingEnrollment.campaignTitle) {
        this.marketingCampaignTitle.set(plan.marketingEnrollment.campaignTitle);
      }
      if (plan.marketingEnrollment.campaignDescription) {
        this.marketingCampaignDescription.set(plan.marketingEnrollment.campaignDescription);
      }
      if (plan.marketingEnrollment.bannerHeadline) {
        this.marketingBannerHeadline.set(plan.marketingEnrollment.bannerHeadline);
      }
      if (plan.marketingEnrollment.formTemplate?.fields?.length) {
        this.intakeFormFields.set(plan.marketingEnrollment.formTemplate.fields);
      }
    }

    if (plan.components && plan.components.length > 0) {
      this.components.set(plan.components);
    }
    if (plan.onboardedUsers && plan.onboardedUsers.length > 0) {
      this.onboardedUsers.set(plan.onboardedUsers);
    }
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goToStep(step: number) {
    if (step === this.currentStep()) return;
    this.formErrorAlert.set(null);

    // Validation check when advancing from Step 1
    if (step > 1 && this.currentStep() === 1 && (this.basicForm.invalid || !!this.planDateOrderError())) {
      this.markFormGroupTouched(this.basicForm);
      const errMsg = this.planDateOrderError() || 'All mandatory fields are not filled up. Please complete all highlighted required fields in Step 1 before proceeding.';
      this.formErrorAlert.set(errMsg);
      this.lmsData.showToast(
        errMsg,
        'error',
        4500,
        'Step 1 Validation Blocked',
        'STEP 1 / 3'
      );
      this.scrollToFirstError();
      return;
    }

    const prevStep = this.currentStep();
    this.currentStep.set(step as 1 | 2 | 3);

    // Auto-save per stage (§ Auto-saved per stage)
    if (step > prevStep) {
      try {
        const plan = this.currentPlan();
        plan.components = this.components();
        plan.onboardedUsers = this.onboardedUsers();
        this.lmsData.savePlan(plan);
        this.lastSavedAt.set('Just now');
      } catch (e) {
        console.warn('Auto-save error', e);
      }
    }

    const stepNames: Record<number, string> = {
      1: 'Step 1: Curriculum Identity & Bounds',
      2: 'Step 2: Component & Phase Plan Builder',
      3: 'Step 3: User Tagging & Scope Assignment'
    };

    const successMsg = `Successfully transitioned to ${stepNames[step]} from ${stepNames[prevStep]}.`;
    this.stepSuccessAlert.set(successMsg);

    this.lmsData.showToast(
      successMsg,
      'success',
      3500,
      'Step Navigation Complete',
      `STEP ${step} OF 3`
    );

    this.scrollToTop();
  }

  scrollToTop() {
    if (typeof window === 'undefined') return;
    const scrollFn = () => {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: 'instant' });
        mainEl.scrollTop = 0;
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const topEl = document.getElementById('plan-wizard-top');
      if (topEl) {
        topEl.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    };
    scrollFn();
    setTimeout(scrollFn, 30);
    setTimeout(scrollFn, 120);
  }

  resetCurrentStep() {
    this.modalService.confirm({
      title: 'Reset Current Step?',
      message: 'Are you sure you want to reset all data in this step? Any unsaved modifications in this step will be restored.',
      confirmText: 'Yes, Reset',
      cancelText: 'Keep Editing',
      onConfirm: () => {
        if (this.currentStep() === 1) {
          this.basicForm.reset({
            name: '',
            description: '',
            startDate: '01/01/2026',
            endDate: '31/12/2026',
            durationType: 'Yearly',
            enrollmentType: 'Closed',
            recurringPlan: true,
            budgetYear: 'FY 2026',
            budgetAmount: 4500000,
            currency: 'BDT',
            defaultProgressionMode: 'Sequential',
            ownerUserId: 'usr-admin-01'
          });
        } else if (this.currentStep() === 2) {
          const example = createWorkedExamplePlan(
            this.activeLms()?.id || 'lms-microfinance-brac',
            this.activeTenant()?.id || 'tenant-brac'
          );
          this.components.set(example.components);
        } else if (this.currentStep() === 3) {
          this.onboardedUsers.set([]);
        }
        this.lmsData.showToast('Current step has been reset.', 'info');
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  scrollToFirstError() {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const errorEl = document.querySelector(
        'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, app-custom-select.ng-invalid, .border-rose-500, .border-rose-400, .border-red-500, [aria-invalid="true"], [data-error="true"], .text-rose-500:not(:empty), #form-error-banner'
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

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.onboardingSearchQuery.set(target.value || '');
  }

  // Phase Filtering & Management
  setPhaseFilter(filter: any) {
    this.activePhaseFilter.set(filter || 'all');
  }

  togglePhaseCollapse(phaseId: string) {
    const collapsed = new Set(this.collapsedPhases());
    if (collapsed.has(phaseId)) {
      collapsed.delete(phaseId);
    } else {
      collapsed.add(phaseId);
    }
    this.collapsedPhases.set(collapsed);
  }

  isPhaseCollapsed(phaseId: string): boolean {
    return this.collapsedPhases().has(phaseId);
  }

  getComponentsForPhase(phaseId: string): PlanComponent[] {
    return this.components().filter(c => c.phaseId === phaseId && c.type !== 'Phase');
  }

  getStandaloneComponents(): PlanComponent[] {
    return this.components().filter(c => !c.phaseId && c.type !== 'Phase');
  }

  addPhase() {
    this.openAddDrawer('Phase');
  }

  editPhase(phase: PlanComponent) {
    this.openEditDrawer(phase);
  }

  // Component Drawer Openers
  openAddDrawer(type: PlanComponentType = 'Task', phaseId: string | null = null) {
    this.isEditingComponent.set(false);
    this.componentToEdit.set(null);
    this.drawerInitialType.set(type);
    this.drawerTargetPhaseId.set(phaseId);
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(comp: PlanComponent) {
    this.isEditingComponent.set(true);
    this.componentToEdit.set(comp);
    this.drawerInitialType.set(comp.type);
    this.drawerTargetPhaseId.set(comp.phaseId || null);
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.componentToEdit.set(null);
  }

  onSaveComponent(savedComp: PlanComponent) {
    const list = [...this.components()];
    const index = list.findIndex(c => c.id === savedComp.id);
    if (index >= 0) {
      list[index] = savedComp;
      this.lmsData.showToast(`Component "${savedComp.name}" updated successfully.`, 'success');
    } else {
      list.push(savedComp);
      this.lmsData.showToast(`Component "${savedComp.name}" added to curriculum.`, 'success');
    }
    this.components.set(list);
    this.isDrawerOpen.set(false);
    this.componentToEdit.set(null);
  }

  deleteComponent(compId: string) {
    this.modalService.confirm({
      title: 'Remove Component?',
      message: 'Are you sure you want to remove this component from the curriculum track?',
      confirmText: 'Remove',
      iconType: 'danger',
      onConfirm: () => {
        const updated = this.components().filter(c => c.id !== compId);
        this.components.set(updated);
        if (this.activePhaseFilter() === compId) {
          this.activePhaseFilter.set('all');
        }
        this.lmsData.showToast('Component removed from curriculum.', 'info');
      }
    });
  }

  // Step 03 User Onboarding Actions
  setScope(scope: OnboardingScope) {
    this.activeOnboardingScope.set(scope);
    this.cancelAddIndividualUser();
  }

  getScopeDisplayName(scope: OnboardingScope): string {
    if (scope === 'Whole Plan') {
      return 'Whole Plan';
    }
    const ph = this.phases().find(p => p.id === scope);
    return ph?.name || scope;
  }

  getScopeUserCount(scope: OnboardingScope): number {
    return this.onboardedUsers().filter(u => u.scope === scope).length;
  }

  removeOnboardedUser(userId: string) {
    const updated = this.onboardedUsers().filter(u => u.id !== userId);
    this.onboardedUsers.set(updated);
    this.lmsData.showToast('User removed from roster.', 'info');
  }

  cancelAddIndividualUser() {
    this.showAddIndividualForm.set(false);
    this.individualUserForm.reset({
      identifierType: 'BRAC PIN',
      identifierValue: '',
      fullName: '',
      designation: 'Junior Field Officer',
      department: 'Microfinance (Field Operations)'
    });
  }

  addIndividualUser() {
    const val = this.individualUserForm.value;
    const idVal = (val.identifierValue || '').trim();
    const nameVal = (val.fullName || '').trim();

    if (!idVal || !nameVal) {
      this.individualUserForm.markAllAsTouched();
      this.lmsData.showToast('Please provide both Identifier and Full Name.', 'warning');
      return;
    }

    if (val.identifierType === 'Email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(idVal)) {
        this.lmsData.showToast('Please enter a valid email address.', 'warning');
        return;
      }
    }

    const activeScope = this.activeOnboardingScope();
    const isDuplicate = this.onboardedUsers().some(u => {
      if (u.scope !== activeScope) return false;
      if (val.identifierType === 'BRAC PIN') {
        return u.identifierType === 'BRAC PIN' && (u.bracPin || '').trim().toLowerCase() === idVal.toLowerCase();
      } else {
        return u.identifierType === 'Email' && (u.email || '').trim().toLowerCase() === idVal.toLowerCase();
      }
    });

    if (isDuplicate) {
      this.lmsData.showToast(`User with ${val.identifierType} "${idVal}" is already tagged to this scope.`, 'warning');
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateFormatted = `${dd}/${mm}/${yyyy}`;

    const newUser: PlanOnboardedUser = {
      id: `usr-ind-${Date.now()}`,
      scope: activeScope,
      identifierType: val.identifierType,
      bracPin: val.identifierType === 'BRAC PIN' ? idVal : undefined,
      email: val.identifierType === 'Email' ? idVal : `${idVal.toLowerCase()}@brac.net`,
      fullName: nameVal,
      designation: val.designation?.trim() || 'Junior Field Officer',
      department: val.department?.trim() || 'Microfinance (Field Operations)',
      notes: 'Individually added by Planner',
      status: 'Ready',
      dateAdded: dateFormatted,
      source: 'Individual'
    };

    this.onboardedUsers.set([...this.onboardedUsers(), newUser]);
    this.cancelAddIndividualUser();
    this.lmsData.showToast(`User "${nameVal}" added to roster.`, 'success');
  }

  onBulkUsersCommitted(newUsers: PlanOnboardedUser[]) {
    this.onboardedUsers.set([...this.onboardedUsers(), ...newUsers]);
    this.lmsData.showToast(
      `Successfully onboarded ${newUsers.length} users to ${this.activeOnboardingScope()}.`,
      'success',
      4000,
      'Batch Onboarding Complete',
      'ONBOARDED'
    );
  }

  fixUnresolvedUsers() {
    const updated = this.onboardedUsers().map(u => {
      if (u.status === 'Unresolved') {
        return {
          ...u,
          status: 'Ready' as const,
          notes: 'Resolved via Staff Directory lookup'
        };
      }
      return u;
    });
    this.onboardedUsers.set(updated);
    this.lmsData.showToast('All unresolved user records verified and set to Ready.', 'success');
  }

  // Lifecycle Operations: Save Draft, Publish, Activate
  saveAsDraft() {
    const plan = this.currentPlan();
    plan.status = 'Draft';
    plan.components = this.components();
    plan.onboardedUsers = this.onboardedUsers();

    this.lmsData.savePlan(plan);
    this.lastSavedAt.set('Just now');
    this.lmsData.showToast(
      'Plan saved as Draft. You can resume editing anytime.',
      'success',
      3500,
      'Draft Saved',
      'DRAFT'
    );
  }

  publishPlan() {
    const report = this.validationReport();
    if (!report.isValidForPublish) {
      this.isReviewModalOpen.set(true);
      this.lmsData.showToast('Cannot publish Plan. Please fix blocking validation errors first.', 'error');
      return;
    }

    const formTitle = (this.basicForm.get('name')?.value || 'Field Officer Development Programme 2026') + ' Application Form';

    this.modalService.confirm({
      title: 'Publish Learning Plan?',
      message: `Publishing "${this.currentPlan().name}" will lock its core structural configuration, activate code ${this.planCode()}, and publish "${formTitle}" to the public enrollment page. Form information will automatically be registered in the Appointed Plan Administrators Roster.`,
      confirmText: 'Publish Plan',
      iconType: 'info',
      onConfirm: () => {
        this.planStatus.set('Published');
        const plan = this.currentPlan();
        plan.status = 'Published';
        plan.components = this.components();

        // Register Public Marketing Application Form info into Appointed Plan Administrators Roster (§ User Request)
        const formAdminRecord: PlanOnboardedUser = {
          id: `usr-adm-mkt-${Date.now()}`,
          scope: this.activeOnboardingScope(),
          identifierType: 'BRAC PIN',
          bracPin: `ADM-MKT-2026`,
          email: 'intake.form@brac.net',
          fullName: `${formTitle} (Appointed Public Intake Lead)`,
          designation: 'Appointed Plan Administrator & Public Intake Form Lead',
          department: 'Microfinance (Public Marketing Intake)',
          notes: `Published Public Enrollment Application Form (${this.marketingSlug()}) registered to Appointed Plan Administrators Roster`,
          status: 'Ready',
          dateAdded: new Date().toLocaleDateString('en-GB'),
          source: 'Marketing Link'
        };

        const existingUsers = this.onboardedUsers();
        if (!existingUsers.some(u => u.bracPin === 'ADM-MKT-2026')) {
          this.onboardedUsers.set([formAdminRecord, ...existingUsers]);
        }

        plan.onboardedUsers = this.onboardedUsers();
        this.lmsData.savePlan(plan);
        this.lastSavedAt.set('Just now');
        this.isReviewModalOpen.set(false);

        this.lmsData.showToast(
          `Plan published! "${formTitle}" information registered in Appointed Plan Administrators Roster.`,
          'success',
          5000,
          'Plan Published & Form Registered',
          'PUBLISHED'
        );

        this.scrollToRosterTable();
      }
    });
  }

  activatePlan() {
    if (this.planStatus() !== 'Published' && this.planStatus() !== 'Active') {
      this.lmsData.showToast('Please publish the Plan first before activating learning tracks.', 'warning');
      return;
    }

    this.modalService.confirm({
      title: 'Activate Curriculum Tracks?',
      message: `Activating "${this.currentPlan().name}" will initiate learner invites for all ${this.onboardedUsers().length} onboarded trainees, open self-paced content, and enable planner task completion. Proceed?`,
      confirmText: 'Activate Plan Now',
      iconType: 'success',
      onConfirm: () => {
        this.planStatus.set('Active');
        const activatedUsers = this.onboardedUsers().map(u => ({
          ...u,
          status: 'Active' as const
        }));
        this.onboardedUsers.set(activatedUsers);

        const plan = this.currentPlan();
        plan.status = 'Active';
        plan.components = this.components();
        plan.onboardedUsers = this.onboardedUsers();

        this.lmsData.savePlan(plan);
        this.lastSavedAt.set('Just now');

        this.lmsData.showToast(
          'Learning Plan is now Active! Trainees can commence learning pathways.',
          'success',
          5000,
          'Curriculum Live',
          'ACTIVE'
        );
      }
    });
  }

  cancelAndExit() {
    this.router.navigate(['/plans']);
  }

  copyPlanCode() {
    navigator.clipboard.writeText(this.planCode());
    this.lmsData.showToast(`Plan code ${this.planCode()} copied to clipboard.`, 'info');
  }

  // Helpers for canvas pills
  getTypeBadgeClass(type: PlanComponentType): string {
    switch (type) {
      case 'Task': return 'bg-sky-500 text-white';
      case 'Content': return 'bg-indigo-500 text-white';
      case 'Course': return 'bg-emerald-600 text-white';
      case 'Offline Training': return 'bg-teal-600 text-white';
      case 'Pre-Test': return 'bg-amber-500 text-white';
      case 'Post-Test': return 'bg-rose-500 text-white';
      case 'Survey': return 'bg-purple-600 text-white';
      case 'Phase': return 'bg-slate-700 text-white';
    }
  }

  getTypeBorderClass(type: PlanComponentType): string {
    switch (type) {
      case 'Task': return 'border-l-sky-500';
      case 'Content': return 'border-l-indigo-500';
      case 'Course': return 'border-l-emerald-600';
      case 'Offline Training': return 'border-l-teal-600';
      case 'Pre-Test': return 'border-l-amber-500';
      case 'Post-Test': return 'border-l-rose-500';
      case 'Survey': return 'border-l-purple-600';
      case 'Phase': return 'border-l-slate-700';
    }
  }

  getTypeIcon(type: PlanComponentType): string {
    switch (type) {
      case 'Task': return 'task_alt';
      case 'Content': return 'play_lesson';
      case 'Course': return 'school';
      case 'Offline Training': return 'business';
      case 'Pre-Test': return 'quiz';
      case 'Post-Test': return 'assignment_turned_in';
      case 'Survey': return 'reviews';
      case 'Phase': return 'timeline';
    }
  }

  getComponentPrerequisiteNames(comp: PlanComponent): string[] {
    if (!comp.prerequisiteIds || comp.prerequisiteIds.length === 0) return [];
    return this.components()
      .filter(c => comp.prerequisiteIds?.includes(c.id))
      .map(c => c.name);
  }

  onSubmitPreviewForm() {
    const newEnrolledUser: PlanOnboardedUser = {
      id: `usr-mkt-${Date.now()}`,
      scope: this.activeOnboardingScope(),
      identifierType: 'BRAC PIN',
      bracPin: `MKT-${Math.floor(1000 + Math.random() * 9000)}`,
      email: 'applicant.public@brac.net',
      fullName: 'Public Enrolled Learner',
      designation: 'Trainee Applicant',
      department: 'Microfinance (Public Intake)',
      notes: 'Self-enrolled via Public Marketing Page Link',
      status: 'Ready',
      dateAdded: new Date().toLocaleDateString('en-GB'),
      source: 'Marketing Link'
    };

    this.onboardedUsers.set([newEnrolledUser, ...this.onboardedUsers()]);

    this.modalService.confirm({
      title: 'Enrollment Application Submitted!',
      message: 'Form submitted successfully! A new prospective learner record ("Public Enrolled Learner") has been enrolled and added to your Trainee Roster table below.',
      confirmText: 'View in Roster',
      cancelText: 'Close',
      icon: 'how_to_reg',
      iconType: 'success'
    });

    this.lmsData.showToast(
      'Enrollment application submitted! Prospective learner added to roster.',
      'success',
      4000,
      'Enrollment Complete',
      'ENROLLED'
    );

    this.scrollToRosterTable();
  }

  scrollToRosterTable() {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const el = document.getElementById('trainee-roster-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }
}
