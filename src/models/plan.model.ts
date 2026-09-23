export type PlanStatus = 'Draft' | 'Published' | 'Active' | 'Completed' | 'Archived' | 'Under Processing' | 'Drafted' | 'Trial' | 'In-Progress' | 'Deactivated' | 'Suspended';
export type DurationType = 'Yearly' | 'Half-Yearly' | 'Quarterly';
export type EnrollmentType = 'Open' | 'Closed';

export type PhaseStatus = 'Draft' | 'Ready' | 'In-Progress' | 'Completed' | 'Upcoming';
export type PrerequisiteStatus = 'Met' | 'Pending' | 'None';
export type CertificateBadgeStatus = 'Configured' | 'Issued' | 'None';

export interface PlanOwner {
  userId?: string | null;
  name: string;
  email: string;
  contactNumber?: string;
  assignedAt?: string;
  assignedBy?: string;
  invitationStatus?: 'pending' | 'sent' | 'accepted' | null;
}

export interface Phase {
  id: string;
  planId: string;
  name: string;
  sequence: number;
  startDate: string; // DD/MM/YYYY
  endDate: string;   // DD/MM/YYYY
  status: PhaseStatus;
  courseCount: number;
  taskCount: number;
  deliveryClassCount: number;
  prerequisiteStatus: PrerequisiteStatus;
  certificateBadgeStatus: CertificateBadgeStatus;
  description?: string;
  assignedCourses?: string[];
}

export interface PlanCapabilities {
  canEdit: boolean;
  canAssignOwner: boolean;
  canActivate: boolean;
  canArchive: boolean;
  protectedFields?: string[];
}

export type ProgressionMode = 'Sequential' | 'Free';
export type GradingScope = 'Whole Plan' | 'Per Phase';
export type GradingType = 'Percentage' | 'CGPA' | 'percentage' | 'cgpa';
export type CertificateStatus = 'Pass' | 'Fail' | 'Completed';
export type EvaluationRequirement = 'Mandatory' | 'Optional';
export type EnrollmentConfirmation = 'Auto Onboard' | 'Manual Review';

// =========================================================================
// COMPONENT-BASED PLAN BUILDER SPECIFICATION (v2.3)
// =========================================================================
export type PlanComponentType = 'Task' | 'Content' | 'Course' | 'Pre-Test' | 'Post-Test' | 'Survey' | 'Phase';

export interface PlanBudget {
  budgetYear: string;  // e.g. "FY 2026"
  budgetAmount: number; // e.g. 4500000
  currency: string;    // e.g. "BDT"
}

export interface PlanComponentClassSession {
  id: string;
  name: string;
  date: string;       // DD/MM/YYYY
  time: string;       // e.g. "09:30 - 12:30"
  duration: string;   // e.g. "3 hours"
  venue: string;      // e.g. "BRAC Centre, Room 402"
  instructor: string; // e.g. "Dr. Rafiqul Islam"
}

export interface PlanComponentChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface PlanComponentProgressionCondition {
  type?: string; // 'manual_tick' | 'opened' | 'min_consumed' | 'trainee_self_report' | 'course_completed' | 'pass_mark' | 'min_attendance' | 'submitted' | 'score_threshold' | 'all_mandatory' | 'all_courses' | 'all_components' | 'min_share'
  rule?: string;
  value?: number | string;
  threshold?: number | string;
  label?: string;
}

export interface PlanComponent {
  id: string;
  planId?: string;
  type: PlanComponentType;
  name: string;
  description?: string;
  sequence: number;
  phaseId?: string | null; // null if at Plan level, or string if inside a Phase
  owner?: string;          // defaults to Plan Owner
  startDate: string;       // DD/MM/YYYY
  endDate: string;         // DD/MM/YYYY
  durationDays?: number;   // derived read-only
  isMandatory: boolean;
  progressionCondition?: PlanComponentProgressionCondition;
  progressionModeOverride?: 'Inherit' | 'Sequential' | 'Free';
  prerequisiteIds: string[];
  source?: {
    sourceType: string;
    itemId?: string;
    itemName?: string;
    version?: string;
  };
  // Completion for Active plan (Tasks)
  isComplete?: boolean;
  completedBy?: string;
  completedAt?: string;
  completionNotes?: string;
  
  // Task specific
  taskType?: 'Setup' | 'Onboarding' | 'Assignment' | 'Procurement' | 'Approval' | 'Other';
  assignedTo?: string;
  assignedToName?: string;
  checklist?: PlanComponentChecklistItem[];
  evidenceRequired?: boolean;

  // Content specific
  contentType?: 'Video' | 'PDF / Document' | 'Recorded Class' | 'Book / E-book' | 'Audio' | 'External Link';
  contentItem?: string;
  contentLength?: string;
  downloadable?: boolean;

  // Course specific (Read-Only from Course Library)
  deliveryMode?: 'Self-paced' | 'Instructor-led' | 'Blended';
  includedClasses?: PlanComponentClassSession[];
  courseGradingPolicy?: string;
  courseCertificate?: string;
  courseBadges?: string[];
  courseSkills?: string[];

  // Pre-Test & Post-Test specific
  questionnaireId?: string;
  questionnaireTitle?: string;
  questionnaireVersion?: string;
  passMark?: number;
  attemptLimit?: number;
  resultVisibility?: string;
  retakePolicy?: string;

  // Survey specific
  surveyFormId?: string;
  surveyFormTitle?: string;
  surveyVersion?: string;
  anonymousResponses?: boolean;
  targetAudience?: string;

  // Phase specific (when type === 'Phase')
  phaseCompletionRule?: 'All mandatory components completed' | 'All courses completed' | 'All components completed' | 'Minimum share of components completed';
  phaseCompletionMinSharePct?: number;
  phaseProgressionMode?: 'Plan Default' | 'Sequential' | 'Free';
  phaseGradingOverride?: string;
  phaseCertificateOverride?: string;
  phaseTranscriptOverride?: string;
  phaseBadgeOverride?: string;

  // Status
  isIncomplete?: boolean;
  validationErrors?: string[];
}

export type OnboardingScope = 'Whole Plan' | string;
export type OnboardingIdentifierType = 'BRAC PIN' | 'Email';
export type OnboardingStatus = 'Ready' | 'Invited' | 'Active' | 'Unresolved' | 'Removed';

export interface PlanOnboardedUser {
  id: string;
  scope: OnboardingScope; // 'Whole Plan' or phaseId
  identifierType: OnboardingIdentifierType;
  bracPin?: string;
  email: string;
  fullName: string;
  designation?: string;
  department?: string;
  notes?: string;
  status: OnboardingStatus;
  dateAdded: string; // DD/MM/YYYY
  source: 'Bulk Upload' | 'Individual' | 'Copied';
  errorMessage?: string;
}

export interface ProgressionConfig {
  mode: ProgressionMode;
  completionRequirementForUnlock: string;
}

export interface EnrollmentConfig {
  mode: EnrollmentType;
  openRegistrationLink?: string;
  openRegistrationQr?: boolean;
  individualEnrollment?: string[];
  batchEnrollment?: string[];
  existingTraineeSelfRegistration: boolean;
  capacityEnabled: boolean;
  capacity?: number | null;
  waitlistEnabled: boolean;
  confirmation: EnrollmentConfirmation;
  termsRequirements?: string;
  traineeProfileFilters?: {
    locations?: string[];
    genders?: string[];
    departments?: string[];
    grades?: string[];
  };
}

export interface EquivalencyConfig {
  samePublishedVersionSatisfies: boolean;
  newerVersionRequiresRetake: boolean;
  overrideEnabled: boolean;
  explanation: string;
}

export interface PhaseWeight {
  phaseId: string;
  phaseName: string;
  weight: number;
}

export interface GradingConfig {
  scope: GradingScope;
  type: GradingType;
  planPassMark: number;
  phaseWeights: PhaseWeight[];
  contentLevelPassRequired: boolean;
  retakePolicy: string;
  aggregationPreview?: string;
}

export interface TranscriptRule {
  enabledAtPlan: boolean;
  enabledAtPhase: boolean;
  enabledAtCourse: boolean;
  scope: GradingScope;
  minScore: number;
  minCompletionPct: number;
  gatedOnPreviousPhaseTranscript: boolean;
}

export interface CertificateConfig {
  enabledAtPlan: boolean;
  enabledAtPhase: boolean;
  enabledAtCourse: boolean;
  scope: GradingScope;
  templateId: string;
  templateName: string;
  minScore: number;
  minCompletionPct: number;
}

export interface BadgeConfig {
  enabled: boolean;
  templateId: string;
  templateName: string;
  rule: string;
}

export interface CredentialsConfig {
  transcripts: TranscriptRule;
  certificates: CertificateConfig;
  badges: BadgeConfig;
  visibility: 'Public' | 'Enrolled Trainees Only' | 'Plan Administrators Only';
}

export interface TestConfig {
  enabled: boolean;
  requirement: EvaluationRequirement;
  questionnaireId: string;
  questionnaireTitle: string;
  questionnaireVersion: string;
}

export interface EvaluationConfig {
  preTest: TestConfig;
  postTest: TestConfig;
  releaseTiming: string;
  resultDownloadEnabled: boolean;
}

export interface FeedbackQuestion {
  id: string;
  type: 'Text Response' | 'Single Select' | 'Multi-Select';
  question: string;
  options?: string[];
}

export interface EngagementConfig {
  rating: {
    enabled: boolean;
    scale: '5-Star Scale' | '10-Point CSAT' | '3-Point Smiley';
    availability: 'Post-Completion Only' | 'Per Phase Completion' | 'Open Anytime';
  };
  feedback: {
    enabled: boolean;
    templateId: string;
    templateName: string;
    version: string;
    questions: FeedbackQuestion[];
    phaseIds: string[];
    releaseTiming: string;
  };
  forum: {
    enabled: boolean;
    topicCreationPermission: 'Instructors Only' | 'Instructors & Trainees';
    moderationPermission: 'LMS Co-Admins & Instructors' | 'Designated Moderators';
    visibilityScope: 'All users' | 'Selected batches';
    allowedPostFormats: string[];
  };
}

export interface RecurringConfig {
  enabled: boolean;
  cycleConfig?: string | any;
  currentCycle?: string;
  historicalCycleRetention?: string;
  structureChangePolicy?: string;
  reEnrollmentRule?: string;
}

export interface ValidationIssue {
  code: string;
  field: string;
  message: string;
  componentId?: string;
}

export interface ValidationReport {
  isValidForPublish: boolean;
  blockingErrors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface PlanValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  section: number;
  sectionTitle: string;
  field?: string;
  entityType?: 'Plan' | 'Phase' | 'Course';
  entityId?: string;
  message: string;
}

export interface Plan {
  id: string;
  planCode: string; // System-generated read-only identifier (e.g. PLN-1972-001)
  lmsId: string;    // Scoped to fixed LMS workspace
  organizationId: string;
  name: string;
  description: string;
  owner: PlanOwner;
  durationType: DurationType;
  startDate: string; // DD/MM/YYYY
  endDate: string;   // DD/MM/YYYY
  enrollmentType: EnrollmentType;
  recurringPlan?: boolean | string | null;
  status: PlanStatus;
  phaseCount: number;
  enrolledLearnersCount?: number;
  capacityLimit?: number;
  certificatesIssuedCount?: number;
  createdDate: string; // DD/MM/YYYY
  createdBy: string;
  updatedDate: string; // DD/MM/YYYY
  publishedAt?: string | null;
  publishedBy?: string | null;
  lastCompletedSection?: number;
  phases?: Phase[];
  capabilities?: PlanCapabilities;
  // Extended configuration modules (§5 - §12)
  progression?: ProgressionConfig;
  defaultProgressionMode?: ProgressionMode; // Sequential | Free
  budget?: PlanBudget;                      // Plan-level single budget (v2.3)
  components?: PlanComponent[];             // Component-based plan tree (v2.3)
  onboardedUsers?: PlanOnboardedUser[];     // Whole Plan & Phase-scoped onboarded users (v2.3)
  enrollmentConfig?: EnrollmentConfig;
  equivalency?: EquivalencyConfig;
  grading?: GradingConfig;
  credentials?: CredentialsConfig;
  evaluation?: EvaluationConfig;
  engagement?: EngagementConfig;
  recurringConfig?: RecurringConfig;
  alumniTracking?: boolean;
}

export interface PlanGridFilter {
  search: string;
  status: PlanStatus[];
  planOwnerEmail: string | null;
  planOwnerEmails?: string[];
  durationType: DurationType[];
  enrollmentType: EnrollmentType[];
  startDate: string | null;
  endDate: string | null;
  createdDateFrom?: string | null;
  createdDateTo?: string | null;
}

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-brac-01',
    planCode: 'PLN-1972-001',
    lmsId: 'LMS-1972-01',
    organizationId: 'tenant-brac',
    name: '2026 Microfinance Branch Transformation & Ethics Plan',
    description: 'Comprehensive annual training framework for branch managers and field credit officers covering client protection, digital payments, and risk management.',
    owner: {
      userId: 'usr-brac-01',
      name: 'Tanvir Hossain',
      email: 'tanvir.hossain@brac.net',
      contactNumber: '01713001122',
      assignedAt: '15/01/2026',
      assignedBy: 'Farhana Ahmed',
      invitationStatus: 'accepted'
    },
    durationType: 'Yearly',
    startDate: '01/01/2026',
    endDate: '31/12/2026',
    enrollmentType: 'Open',
    recurringPlan: 'Yes (Annual Cycle)',
    status: 'Active',
    phaseCount: 4,
    createdDate: '10/01/2026',
    createdBy: 'Farhana Ahmed',
    updatedDate: '15/02/2026',
    capabilities: {
      canEdit: true,
      canAssignOwner: true,
      canActivate: false,
      canArchive: true,
      protectedFields: ['startDate', 'endDate', 'durationType']
    },
    phases: [
      {
        id: 'phase-brac-01-1',
        planId: 'plan-brac-01',
        name: 'Phase 1: Foundation & Smart Campaign Principles',
        sequence: 1,
        startDate: '01/01/2026',
        endDate: '31/03/2026',
        status: 'Completed',
        courseCount: 3,
        taskCount: 8,
        deliveryClassCount: 2,
        prerequisiteStatus: 'None',
        certificateBadgeStatus: 'Issued',
        description: 'Core onboarding on BRAC Village Organization (VO) principles and ethical collection protocols.'
      },
      {
        id: 'phase-brac-01-2',
        planId: 'plan-brac-01',
        name: 'Phase 2: Digital Credit & Biometric KYC Operations',
        sequence: 2,
        startDate: '01/04/2026',
        endDate: '30/06/2026',
        status: 'In-Progress',
        courseCount: 4,
        taskCount: 12,
        deliveryClassCount: 4,
        prerequisiteStatus: 'Met',
        certificateBadgeStatus: 'Configured',
        description: 'Hands-on tablet POS workflows, instant disbursement checks, and borrower capacity scoring.'
      },
      {
        id: 'phase-brac-01-3',
        planId: 'plan-brac-01',
        name: 'Phase 3: Disaster-Resilient Micro-Insurance & Restructuring',
        sequence: 3,
        startDate: '01/07/2026',
        endDate: '30/09/2026',
        status: 'Upcoming',
        courseCount: 2,
        taskCount: 6,
        deliveryClassCount: 3,
        prerequisiteStatus: 'Pending',
        certificateBadgeStatus: 'Configured',
        description: 'Climate risk coverage, flood relief emergency funds, and borrower protection restructures.'
      },
      {
        id: 'phase-brac-01-4',
        planId: 'plan-brac-01',
        name: 'Phase 4: Annual Compliance Audits & Leadership Evaluation',
        sequence: 4,
        startDate: '01/10/2026',
        endDate: '31/12/2026',
        status: 'Upcoming',
        courseCount: 3,
        taskCount: 10,
        deliveryClassCount: 2,
        prerequisiteStatus: 'Pending',
        certificateBadgeStatus: 'Configured',
        description: 'Branch-level mock audits, customer grievance review, and final certification exam.'
      }
    ]
  },
  {
    id: 'plan-brac-02',
    planCode: 'PLN-1972-002',
    lmsId: 'LMS-1972-01',
    organizationId: 'tenant-brac',
    name: 'Ultra-Poor Graduation (UPG) Coach Certification Plan',
    description: 'Specialized half-yearly track for field caseworkers delivering asset transfers and family mentoring.',
    owner: {
      userId: 'usr-brac-02',
      name: 'Dr. Imran Matin',
      email: 'imran.matin@brac.net',
      contactNumber: '01713005588',
      assignedAt: '02/02/2026',
      assignedBy: 'Farhana Ahmed',
      invitationStatus: 'accepted'
    },
    durationType: 'Half-Yearly',
    startDate: '01/02/2026',
    endDate: '31/07/2026',
    enrollmentType: 'Closed',
    recurringPlan: null,
    status: 'Published',
    phaseCount: 2,
    createdDate: '25/01/2026',
    createdBy: 'Farhana Ahmed',
    updatedDate: '02/02/2026',
    capabilities: {
      canEdit: true,
      canAssignOwner: true,
      canActivate: true,
      canArchive: true,
      protectedFields: []
    },
    phases: [
      {
        id: 'phase-brac-02-1',
        planId: 'plan-brac-02',
        name: 'Phase 1: Household Selection & Vulnerability Indexing',
        sequence: 1,
        startDate: '01/02/2026',
        endDate: '30/04/2026',
        status: 'Ready',
        courseCount: 3,
        taskCount: 7,
        deliveryClassCount: 3,
        prerequisiteStatus: 'None',
        certificateBadgeStatus: 'Configured',
        description: 'Participatory community mapping and household poverty scorecards.'
      },
      {
        id: 'phase-brac-02-2',
        planId: 'plan-brac-02',
        name: 'Phase 2: Asset Management Coaching & Health Linkages',
        sequence: 2,
        startDate: '01/05/2026',
        endDate: '31/07/2026',
        status: 'Ready',
        courseCount: 2,
        taskCount: 9,
        deliveryClassCount: 2,
        prerequisiteStatus: 'Met',
        certificateBadgeStatus: 'Configured',
        description: 'Livestock management, kitchen gardening, and primary healthcare referral networks.'
      }
    ]
  },
  {
    id: 'plan-brac-03',
    planCode: 'PLN-1972-003',
    lmsId: 'LMS-1972-01',
    organizationId: 'tenant-brac',
    name: 'Q1 Staff Cybersecurity & Anti-Phishing Sprint',
    description: 'Quarterly accelerated refresher on threat prevention, 2FA hygiene, and secure data handling.',
    owner: {
      userId: 'usr-brac-03',
      name: 'Shakil Anwar',
      email: 'shakil.anwar@brac.net',
      contactNumber: '01714005566',
      assignedAt: '05/01/2026',
      assignedBy: 'Farhana Ahmed',
      invitationStatus: 'accepted'
    },
    durationType: 'Quarterly',
    startDate: '01/01/2026',
    endDate: '31/03/2026',
    enrollmentType: 'Open',
    recurringPlan: 'Yes (Quarterly)',
    status: 'Draft',
    phaseCount: 1,
    createdDate: '05/01/2026',
    createdBy: 'Farhana Ahmed',
    updatedDate: '12/01/2026',
    capabilities: {
      canEdit: true,
      canAssignOwner: true,
      canActivate: false,
      canArchive: true,
      protectedFields: []
    },
    phases: [
      {
        id: 'phase-brac-03-1',
        planId: 'plan-brac-03',
        name: 'Phase 1: Phishing Simulation & Incident Escalation',
        sequence: 1,
        startDate: '01/01/2026',
        endDate: '31/03/2026',
        status: 'Draft',
        courseCount: 2,
        taskCount: 4,
        deliveryClassCount: 1,
        prerequisiteStatus: 'None',
        certificateBadgeStatus: 'Configured',
        description: 'Zero-day email vector identification and security response drill.'
      }
    ]
  },
  {
    id: 'plan-brac-04',
    planCode: 'PLN-1972-004',
    lmsId: 'LMS-1972-01',
    organizationId: 'tenant-brac',
    name: '2025 Branch Manager Leadership Academy',
    description: 'Archived historical annual leadership development curriculum for senior branch personnel.',
    owner: {
      userId: 'usr-brac-01',
      name: 'Tanvir Hossain',
      email: 'tanvir.hossain@brac.net',
      contactNumber: '01713001122',
      assignedAt: '01/01/2025',
      assignedBy: 'Farhana Ahmed',
      invitationStatus: 'accepted'
    },
    durationType: 'Yearly',
    startDate: '01/01/2025',
    endDate: '31/12/2025',
    enrollmentType: 'Closed',
    recurringPlan: null,
    status: 'Archived',
    phaseCount: 3,
    createdDate: '15/12/2024',
    createdBy: 'Farhana Ahmed',
    updatedDate: '31/12/2025',
    capabilities: {
      canEdit: false,
      canAssignOwner: false,
      canActivate: false,
      canArchive: false,
      protectedFields: ['*']
    },
    phases: [
      {
        id: 'phase-brac-04-1',
        planId: 'plan-brac-04',
        name: 'Phase 1: Operational Excellence',
        sequence: 1,
        startDate: '01/01/2025',
        endDate: '30/04/2025',
        status: 'Completed',
        courseCount: 3,
        taskCount: 6,
        deliveryClassCount: 2,
        prerequisiteStatus: 'None',
        certificateBadgeStatus: 'Issued'
      },
      {
        id: 'phase-brac-04-2',
        planId: 'plan-brac-04',
        name: 'Phase 2: People Management & Coaching',
        sequence: 2,
        startDate: '01/05/2025',
        endDate: '31/08/2025',
        status: 'Completed',
        courseCount: 4,
        taskCount: 8,
        deliveryClassCount: 3,
        prerequisiteStatus: 'Met',
        certificateBadgeStatus: 'Issued'
      },
      {
        id: 'phase-brac-04-3',
        planId: 'plan-brac-04',
        name: 'Phase 3: Final Strategic Capstone',
        sequence: 3,
        startDate: '01/09/2025',
        endDate: '31/12/2025',
        status: 'Completed',
        courseCount: 2,
        taskCount: 5,
        deliveryClassCount: 2,
        prerequisiteStatus: 'Met',
        certificateBadgeStatus: 'Issued'
      }
    ]
  },
  {
    id: 'plan-lumina-01',
    planCode: 'PLN-5520-001',
    lmsId: 'LMS-5520-01',
    organizationId: 'tenant-lumina',
    name: 'Spatial UI Shader & WebGPU Engineering Master Plan',
    description: 'Year-long engineering curriculum on real-time spatial rendering, neural volumetric shaders, and headset interaction.',
    owner: {
      userId: 'usr-lumina-01',
      name: 'Aria Vance',
      email: 'aria.admin@lumina-glass.io',
      contactNumber: '01799887766',
      assignedAt: '10/01/2026',
      assignedBy: 'Aria Vance',
      invitationStatus: 'accepted'
    },
    durationType: 'Yearly',
    startDate: '01/01/2026',
    endDate: '31/12/2026',
    enrollmentType: 'Open',
    recurringPlan: 'Yes (Annual)',
    status: 'Active',
    phaseCount: 3,
    createdDate: '01/01/2026',
    createdBy: 'Aria Vance',
    updatedDate: '10/02/2026',
    capabilities: {
      canEdit: true,
      canAssignOwner: true,
      canActivate: false,
      canArchive: true,
      protectedFields: ['startDate', 'endDate', 'durationType']
    },
    phases: [
      {
        id: 'phase-lum-01-1',
        planId: 'plan-lumina-01',
        name: 'Phase 1: WebGPU Compute Shaders & Buffer Management',
        sequence: 1,
        startDate: '01/01/2026',
        endDate: '30/04/2026',
        status: 'In-Progress',
        courseCount: 3,
        taskCount: 10,
        deliveryClassCount: 4,
        prerequisiteStatus: 'None',
        certificateBadgeStatus: 'Configured'
      },
      {
        id: 'phase-lum-01-2',
        planId: 'plan-lumina-01',
        name: 'Phase 2: Glassmorphism Refraction & Light Scattering',
        sequence: 2,
        startDate: '01/05/2026',
        endDate: '31/08/2026',
        status: 'Upcoming',
        courseCount: 3,
        taskCount: 8,
        deliveryClassCount: 3,
        prerequisiteStatus: 'Pending',
        certificateBadgeStatus: 'Configured'
      },
      {
        id: 'phase-lum-01-3',
        planId: 'plan-lumina-01',
        name: 'Phase 3: Headset UI Latency Optimization',
        sequence: 3,
        startDate: '01/09/2026',
        endDate: '31/12/2026',
        status: 'Upcoming',
        courseCount: 2,
        taskCount: 6,
        deliveryClassCount: 2,
        prerequisiteStatus: 'Pending',
        certificateBadgeStatus: 'Configured'
      }
    ]
  },
  {
    id: 'plan-acme-01',
    planCode: 'PLN-4821-001',
    lmsId: 'LMS-4821-01',
    organizationId: 'tenant-acme',
    name: '2026 Zero Trust Cloud & SOC-2 Certification Plan',
    description: 'Enterprise security posture and cloud governance plan required for all backend and DevOps engineers.',
    owner: {
      userId: 'usr-acme-01',
      name: 'Clara Oswald',
      email: 'clara.admin@acme.com',
      contactNumber: '01712345678',
      assignedAt: '05/01/2026',
      assignedBy: 'Clara Oswald',
      invitationStatus: 'accepted'
    },
    durationType: 'Yearly',
    startDate: '01/01/2026',
    endDate: '31/12/2026',
    enrollmentType: 'Open',
    recurringPlan: 'Yes',
    status: 'Active',
    phaseCount: 3,
    createdDate: '02/01/2026',
    createdBy: 'Clara Oswald',
    updatedDate: '15/02/2026',
    capabilities: {
      canEdit: true,
      canAssignOwner: true,
      canActivate: false,
      canArchive: true,
      protectedFields: ['startDate', 'endDate', 'durationType']
    },
    phases: [
      {
        id: 'phase-acme-01-1',
        planId: 'plan-acme-01',
        name: 'Phase 1: IAM Least Privilege & RBAC Hardening',
        sequence: 1,
        startDate: '01/01/2026',
        endDate: '30/04/2026',
        status: 'In-Progress',
        courseCount: 3,
        taskCount: 9,
        deliveryClassCount: 2,
        prerequisiteStatus: 'None',
        certificateBadgeStatus: 'Configured'
      },
      {
        id: 'phase-acme-01-2',
        planId: 'plan-acme-01',
        name: 'Phase 2: Kubernetes Network Policies & Secret Management',
        sequence: 2,
        startDate: '01/05/2026',
        endDate: '31/08/2026',
        status: 'Upcoming',
        courseCount: 4,
        taskCount: 11,
        deliveryClassCount: 3,
        prerequisiteStatus: 'Pending',
        certificateBadgeStatus: 'Configured'
      },
      {
        id: 'phase-acme-01-3',
        planId: 'plan-acme-01',
        name: 'Phase 3: Continuous SOC-2 Audit Telemetry',
        sequence: 3,
        startDate: '01/09/2026',
        endDate: '31/12/2026',
        status: 'Upcoming',
        courseCount: 2,
        taskCount: 6,
        deliveryClassCount: 2,
        prerequisiteStatus: 'Pending',
        certificateBadgeStatus: 'Configured'
      }
    ]
  }
];

/**
 * Date Helper functions for DD/MM/YYYY format parsing, formatting, and validation.
 */
export function parseDateDDMMYYYY(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) {
    // Check if ISO format YYYY-MM-DD
    const isoParts = dateStr.trim().split('-');
    if (isoParts.length === 3) {
      const year = parseInt(isoParts[0], 10);
      const month = parseInt(isoParts[1], 10) - 1;
      const day = parseInt(isoParts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateDDMMYYYY(date: Date | string | null | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') {
    if (date.includes('/')) return date;
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return date;
    date = parsed;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function compareDDMMYYYY(d1: string, d2: string): number {
  const date1 = parseDateDDMMYYYY(d1);
  const date2 = parseDateDDMMYYYY(d2);
  if (!date1 || !date2) return 0;
  return date1.getTime() - date2.getTime();
}

export function getDurationDays(d1: string, d2: string): number {
  const date1 = parseDateDDMMYYYY(d1);
  const date2 = parseDateDDMMYYYY(d2);
  if (!date1 || !date2) return 0;
  const diff = Math.max(0, date2.getTime() - date1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Validates Plan & Phase integrity rules:
 * - Every Phase belongs to the Plan
 * - Phase dates fall within Plan dates
 * - Phases cannot overlap
 * - First phase cannot start before plan start date
 * - Last phase must end on or before plan end date
 */
export function validatePlanAndPhases(plan: Plan, phases?: Phase[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const planPhases = phases || plan.phases || [];

  const planStart = parseDateDDMMYYYY(plan.startDate);
  const planEnd = parseDateDDMMYYYY(plan.endDate);

  if (!plan.name || !plan.name.trim()) {
    errors.push('Plan Name is mandatory and cannot be empty.');
  }

  if (!planStart || !planEnd) {
    errors.push('Plan Start Date and End Date must be in valid DD/MM/YYYY format.');
  } else if (planStart.getTime() > planEnd.getTime()) {
    errors.push('Plan Start Date cannot be after Plan End Date.');
  }

  if (planPhases.length === 0 && plan.status === 'Published') {
    errors.push('A Published or Active Plan must have at least one Phase structured.');
  }

  const sortedPhases = [...planPhases].sort((a, b) => a.sequence - b.sequence);

  sortedPhases.forEach((phase, index) => {
    const pStart = parseDateDDMMYYYY(phase.startDate);
    const pEnd = parseDateDDMMYYYY(phase.endDate);

    if (!pStart || !pEnd) {
      errors.push(`Phase "${phase.name}" has invalid dates (expected DD/MM/YYYY).`);
      return;
    }

    if (pStart.getTime() > pEnd.getTime()) {
      errors.push(`Phase "${phase.name}" Start Date cannot be after its End Date.`);
    }

    if (planStart && pStart.getTime() < planStart.getTime()) {
      errors.push(`Phase "${phase.name}" start date (${phase.startDate}) cannot start before Plan start date (${plan.startDate}).`);
    }

    if (planEnd && pEnd.getTime() > planEnd.getTime()) {
      errors.push(`Phase "${phase.name}" end date (${phase.endDate}) cannot end after Plan end date (${plan.endDate}).`);
    }

    if (index > 0) {
      const prevPhase = sortedPhases[index - 1];
      const prevEnd = parseDateDDMMYYYY(prevPhase.endDate);
      if (prevEnd && pStart.getTime() < prevEnd.getTime()) {
        errors.push(`Phase "${phase.name}" overlaps with previous phase "${prevPhase.name}". Phases cannot overlap.`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates the full 12-section Plan configuration for Review & Validation screen
 */
export function validateComprehensivePlan(plan: Plan, phases: Phase[]): {
  isValidForPublish: boolean;
  issues: PlanValidationIssue[];
} {
  const issues: PlanValidationIssue[] = [];

  // Section 01: Basic Information
  if (!plan.name || plan.name.trim().length < 3) {
    issues.push({
      severity: 'critical',
      section: 1,
      sectionTitle: 'Basic Information',
      field: 'name',
      message: 'Plan Name is mandatory and must be at least 3 characters.'
    });
  }

  const pStart = parseDateDDMMYYYY(plan.startDate);
  const pEnd = parseDateDDMMYYYY(plan.endDate);
  if (!pStart || !pEnd) {
    issues.push({
      severity: 'critical',
      section: 1,
      sectionTitle: 'Basic Information',
      field: 'dates',
      message: 'Plan Start Date and End Date must be in valid DD/MM/YYYY format.'
    });
  } else if (pStart.getTime() >= pEnd.getTime()) {
    issues.push({
      severity: 'critical',
      section: 1,
      sectionTitle: 'Basic Information',
      field: 'dates',
      message: 'Plan Start Date must be strictly before Plan End Date.'
    });
  }

  if (!plan.owner?.name || !plan.owner?.email) {
    issues.push({
      severity: 'critical',
      section: 1,
      sectionTitle: 'Basic Information',
      field: 'owner',
      message: 'A valid Plan Owner with name and email address is required.'
    });
  }

  if (!['Yearly', 'Half-Yearly', 'Quarterly'].includes(plan.durationType)) {
    issues.push({
      severity: 'critical',
      section: 1,
      sectionTitle: 'Basic Information',
      field: 'durationType',
      message: 'Duration Type must be an approved value (Yearly, Half-Yearly, Quarterly).'
    });
  }

  // Section 02: Plan Structure
  if (phases.length === 0) {
    issues.push({
      severity: 'critical',
      section: 2,
      sectionTitle: 'Plan Structure',
      message: 'A usable Plan must contain at least one Phase before it can be published.'
    });
  } else {
    const sorted = [...phases].sort((a, b) => a.sequence - b.sequence);
    sorted.forEach((phase, idx) => {
      const phStart = parseDateDDMMYYYY(phase.startDate);
      const phEnd = parseDateDDMMYYYY(phase.endDate);

      if (!phStart || !phEnd) {
        issues.push({
          severity: 'critical',
          section: 2,
          sectionTitle: 'Plan Structure',
          entityType: 'Phase',
          entityId: phase.id,
          message: `Phase "${phase.name}" has invalid dates.`
        });
        return;
      }

      if (phStart.getTime() > phEnd.getTime()) {
        issues.push({
          severity: 'critical',
          section: 2,
          sectionTitle: 'Plan Structure',
          entityType: 'Phase',
          entityId: phase.id,
          message: `Phase "${phase.name}" Start Date cannot be after its End Date.`
        });
      }

      if (pStart && phStart.getTime() < pStart.getTime()) {
        issues.push({
          severity: 'critical',
          section: 2,
          sectionTitle: 'Plan Structure',
          entityType: 'Phase',
          entityId: phase.id,
          message: `Phase "${phase.name}" start date (${phase.startDate}) cannot precede Plan start date (${plan.startDate}).`
        });
      }

      if (pEnd && phEnd.getTime() > pEnd.getTime()) {
        issues.push({
          severity: 'critical',
          section: 2,
          sectionTitle: 'Plan Structure',
          entityType: 'Phase',
          entityId: phase.id,
          message: `Phase "${phase.name}" end date (${phase.endDate}) cannot exceed Plan end date (${plan.endDate}).`
        });
      }

      if (idx > 0) {
        const prev = sorted[idx - 1];
        const prevE = parseDateDDMMYYYY(prev.endDate);
        if (prevE && phStart.getTime() < prevE.getTime()) {
          issues.push({
            severity: 'critical',
            section: 2,
            sectionTitle: 'Plan Structure',
            entityType: 'Phase',
            entityId: phase.id,
            message: `Phase "${phase.name}" overlaps with preceding Phase "${prev.name}". Overlapping phases are forbidden.`
          });
        }
      }
    });
  }

  // Section 03: Progression
  if (plan.progression && plan.progression.mode === 'Sequential') {
    if (!plan.progression.completionRequirementForUnlock) {
      issues.push({
        severity: 'warning',
        section: 3,
        sectionTitle: 'Progression',
        message: 'Sequential progression unlock condition is not specified. Defaulting to 100% completion.'
      });
    }
  }

  // Section 04: Enrollment
  if (plan.enrollmentConfig?.capacityEnabled) {
    if (!plan.enrollmentConfig.capacity || plan.enrollmentConfig.capacity <= 0) {
      issues.push({
        severity: 'critical',
        section: 4,
        sectionTitle: 'Enrollment & Cohorting',
        field: 'capacity',
        message: 'Capacity must be a positive number when capacity limit is enabled.'
      });
    }
  }

  // Section 06: Grading (Deferrable - Warning if empty)
  if (!plan.grading || !plan.grading.planPassMark) {
    issues.push({
      severity: 'info',
      section: 6,
      sectionTitle: 'Grading Policy',
      message: 'Grading Policy is not fully configured (deferrable for Draft; default pass mark will apply if published).'
    });
  } else {
    if (plan.grading.type === 'Percentage' && (plan.grading.planPassMark < 0 || plan.grading.planPassMark > 100)) {
      issues.push({
        severity: 'critical',
        section: 6,
        sectionTitle: 'Grading Policy',
        field: 'planPassMark',
        message: 'Percentage pass mark must be between 0% and 100%.'
      });
    } else if (plan.grading.type === 'CGPA' && (plan.grading.planPassMark < 0 || plan.grading.planPassMark > 4.0)) {
      issues.push({
        severity: 'critical',
        section: 6,
        sectionTitle: 'Grading Policy',
        field: 'planPassMark',
        message: 'CGPA pass mark must be on a 0.00 - 4.00 scale.'
      });
    }
  }

  // Section 07: Credentials (Deferrable - Info/Warning if empty)
  if (plan.credentials?.certificates?.enabledAtPlan && !plan.credentials.certificates.templateId) {
    issues.push({
      severity: 'warning',
      section: 7,
      sectionTitle: 'Credentials & Outputs',
      field: 'templateId',
      message: 'Certificate is enabled at Plan level but no template has been selected.'
    });
  }

  // Section 08: Evaluation
  if (plan.evaluation?.preTest?.enabled && plan.evaluation.preTest.requirement === 'Mandatory' && !plan.evaluation.preTest.questionnaireId) {
    issues.push({
      severity: 'critical',
      section: 8,
      sectionTitle: 'Evaluation',
      field: 'preTest',
      message: 'A mandatory Pre-Test must have a designated questionnaire.'
    });
  }

  // Section 10: Recurring
  if (plan.recurringConfig?.enabled && !plan.recurringConfig.cycleConfig) {
    issues.push({
      severity: 'warning',
      section: 10,
      sectionTitle: 'Recurring & Alumni',
      field: 'cycleConfig',
      message: 'Recurring Plan is enabled but recurrence cycle configuration is incomplete.'
    });
  }

  const criticalIssues = issues.filter(i => i.severity === 'critical');

  return {
    isValidForPublish: criticalIssues.length === 0,
    issues
  };
}

/**
 * Validates a Component-Based Plan (v2.3 Specification Sections I, J, K)
 */
export function validateComponentBasedPlan(
  plan: Plan,
  components: PlanComponent[],
  onboardedUsers: PlanOnboardedUser[]
): ValidationReport {
  const blockingErrors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const addBlock = (code: string, field: string, message: string, componentId?: string) => {
    blockingErrors.push({ code, field, message, componentId });
  };
  const addWarn = (code: string, field: string, message: string, componentId?: string) => {
    warnings.push({ code, field, message, componentId });
  };

  // 1. Plan Basic Info (Step 01)
  if (!plan.name || plan.name.trim().length < 3) {
    addBlock('VAL-01', 'Plan Name', 'Plan Name is mandatory and must be at least 3 characters.');
  }

  if (!plan.owner?.name || !plan.owner?.email) {
    addBlock('VAL-02', 'Plan Owner', 'A valid Plan Owner with name and email is required.');
  }

  const pStart = parseDateDDMMYYYY(plan.startDate);
  const pEnd = parseDateDDMMYYYY(plan.endDate);
  if (!pStart || !pEnd) {
    addBlock('VAL-03', 'Plan Dates', 'Plan Start Date and End Date must be in DD/MM/YYYY format.');
  } else if (pStart.getTime() >= pEnd.getTime()) {
    addBlock('VAL-04', 'Timeline Inversion', 'Plan Start Date must be strictly before Plan End Date.');
  }

  if (!plan.budget?.budgetYear || !plan.budget?.currency || (plan.budget?.budgetAmount ?? 0) <= 0) {
    addBlock('VAL-05', 'Plan Budget', 'Plan Budget Year, Currency, and a positive Budget Amount are required.');
  }

  // 2. Component Structure (Step 02)
  if (components.length === 0) {
    addBlock('VAL-06', 'Components', 'The Plan contains no components. Add at least one component before publishing.');
    return { isValidForPublish: false, blockingErrors, warnings };
  }

  // Phases and non-phase items
  const phases = components.filter(c => c.type === 'Phase');
  const nonPhases = components.filter(c => c.type === 'Phase' ? false : true);

  // Validate Phases
  const sortedPhases = [...phases].sort((a, b) => {
    const da = parseDateDDMMYYYY(a.startDate)?.getTime() || 0;
    const db = parseDateDDMMYYYY(b.startDate)?.getTime() || 0;
    return da - db;
  });

  sortedPhases.forEach((phase, idx) => {
    const phStart = parseDateDDMMYYYY(phase.startDate);
    const phEnd = parseDateDDMMYYYY(phase.endDate);

    if (!phStart || !phEnd) {
      addBlock('PH-01', phase.name, `Phase "${phase.name}" dates are invalid.`, phase.id);
      return;
    }

    if (phStart.getTime() > phEnd.getTime()) {
      addBlock('PH-02', phase.name, `Phase "${phase.name}" Start Date cannot be after its End Date.`, phase.id);
    }

    if (pStart && phStart.getTime() < pStart.getTime()) {
      addBlock('PH-03', phase.name, `Phase "${phase.name}" start date (${phase.startDate}) falls before Plan start date (${plan.startDate}).`, phase.id);
    }

    if (pEnd && phEnd.getTime() > pEnd.getTime()) {
      addBlock('PH-04', phase.name, `Phase "${phase.name}" end date (${phase.endDate}) falls after Plan end date (${plan.endDate}).`, phase.id);
    }

    // Overlapping phases check
    if (idx > 0) {
      const prev = sortedPhases[idx - 1];
      const prevEnd = parseDateDDMMYYYY(prev.endDate);
      if (prevEnd && phStart.getTime() < prevEnd.getTime()) {
        addBlock('PH-05', phase.name, `Phases cannot overlap: Phase "${phase.name}" (${phase.startDate}) overlaps with previous Phase "${prev.name}" (${prev.endDate}).`, phase.id);
      }
    }

    // Phase must contain at least one component
    const children = nonPhases.filter(c => c.phaseId === phase.id);
    if (children.length === 0) {
      addBlock('PH-06', phase.name, `Phase "${phase.name}" contains no components. Every Phase must have at least one component to publish.`, phase.id);
    }
  });

  // Validate Components
  nonPhases.forEach(comp => {
    if (!comp.name || comp.name.trim().length === 0) {
      addBlock('CMP-01', `Component #${comp.sequence}`, `Component #${comp.sequence} has an empty name.`, comp.id);
    }

    const cStart = parseDateDDMMYYYY(comp.startDate);
    const cEnd = parseDateDDMMYYYY(comp.endDate);

    if (!cStart || !cEnd) {
      addBlock('CMP-02', comp.name, `Component "${comp.name}" has invalid dates.`, comp.id);
      return;
    }

    if (cStart.getTime() > cEnd.getTime()) {
      addBlock('CMP-03', comp.name, `Component "${comp.name}" Start Date (${comp.startDate}) is after its End Date (${comp.endDate}).`, comp.id);
    }

    // Bounds checking against Plan
    if (pStart && cStart.getTime() < pStart.getTime()) {
      addBlock('CMP-04', comp.name, `Component "${comp.name}" Start Date (${comp.startDate}) precedes Plan start date (${plan.startDate}).`, comp.id);
    }
    if (pEnd && cEnd.getTime() > pEnd.getTime()) {
      addBlock('CMP-05', comp.name, `Component "${comp.name}" End Date (${comp.endDate}) exceeds Plan end date (${plan.endDate}).`, comp.id);
    }

    // Bounds checking against Phase if inside one
    if (comp.phaseId) {
      const parentPhase = phases.find(p => p.id === comp.phaseId);
      if (parentPhase) {
        const phStart = parseDateDDMMYYYY(parentPhase.startDate);
        const phEnd = parseDateDDMMYYYY(parentPhase.endDate);
        if (phStart && cStart.getTime() < phStart.getTime()) {
          addBlock('CMP-06', comp.name, `Component "${comp.name}" (${comp.startDate}) starts before its parent Phase "${parentPhase.name}" window (${parentPhase.startDate}).`, comp.id);
        }
        if (phEnd && cEnd.getTime() > phEnd.getTime()) {
          addBlock('CMP-07', comp.name, `Component "${comp.name}" (${comp.endDate}) ends after its parent Phase "${parentPhase.name}" window (${parentPhase.endDate}).`, comp.id);
        }
      }
    }

    // Course with included classes — fixed dates must fit inside component, Phase & Plan
    if (comp.type === 'Course' && comp.includedClasses && comp.includedClasses.length > 0) {
      comp.includedClasses.forEach(cls => {
        const clsDate = parseDateDDMMYYYY(cls.date);
        if (clsDate) {
          if (cStart && clsDate.getTime() < cStart.getTime()) {
            addBlock('CLS-01', cls.name, `Class session "${cls.name}" (${cls.date}) falls before Course "${comp.name}" start date (${comp.startDate}).`, comp.id);
          }
          if (cEnd && clsDate.getTime() > cEnd.getTime()) {
            addBlock('CLS-02', cls.name, `Class session "${cls.name}" (${cls.date}) falls after Course "${comp.name}" end date (${comp.endDate}).`, comp.id);
          }
          if (pStart && clsDate.getTime() < pStart.getTime()) {
            addBlock('CLS-03', cls.name, `Class session "${cls.name}" (${cls.date}) falls outside Plan timeline.`, comp.id);
          }
          if (pEnd && clsDate.getTime() > pEnd.getTime()) {
            addBlock('CLS-04', cls.name, `Class session "${cls.name}" (${cls.date}) falls outside Plan timeline.`, comp.id);
          }
        }
      });
    }

    // Progression condition for mandatory items
    if (comp.isMandatory) {
      if (!comp.progressionCondition || (!comp.progressionCondition.type && !comp.progressionCondition.rule)) {
        addBlock('PRG-01', comp.name, `Mandatory component "${comp.name}" must have a progression condition.`, comp.id);
      }
      if (
        (comp.progressionCondition?.type === 'pass_mark' || comp.progressionCondition?.type === 'score_threshold') &&
        (comp.progressionCondition.value === undefined || comp.progressionCondition.value === null || Number(comp.progressionCondition.value) <= 0)
      ) {
        addBlock('PRG-02', comp.name, `Component "${comp.name}" requires a numeric pass mark / score threshold.`, comp.id);
      }
    }
  });

  // Circular Prerequisite Check
  const compMap = new Map<string, PlanComponent>();
  components.forEach(c => compMap.set(c.id, c));

  const hasCycle = (startId: string, visited: Set<string>, path: Set<string>): boolean => {
    visited.add(startId);
    path.add(startId);

    const comp = compMap.get(startId);
    if (comp && comp.prerequisiteIds) {
      for (const preId of comp.prerequisiteIds) {
        if (!visited.has(preId)) {
          if (hasCycle(preId, visited, path)) return true;
        } else if (path.has(preId)) {
          return true; // Cycle detected
        }
      }
    }

    path.delete(startId);
    return false;
  };

  const visited = new Set<string>();
  for (const comp of components) {
    if (!visited.has(comp.id)) {
      if (hasCycle(comp.id, visited, new Set())) {
        addBlock('CYC-01', comp.name, `Circular prerequisite dependency detected involving component "${comp.name}".`, comp.id);
        break;
      }
    }
  }

  // 3. User Onboarding (Step 03)
  const unresolvedUsers = onboardedUsers.filter(u => u.status === 'Unresolved');
  if (unresolvedUsers.length > 0) {
    addBlock('USR-01', 'Unresolved Users', `There are ${unresolvedUsers.length} unresolved onboarding entries (e.g. unmatched BRAC PIN or invalid email). They must be corrected or removed before publishing.`);
  }

  // Warnings
  if (onboardedUsers.length === 0) {
    addWarn('W-01', 'Learner Cohort', 'No users have been onboarded to this Plan yet (warning: can still publish as draft cohort).');
  } else {
    // Check if phases have users
    const wholePlanUsers = onboardedUsers.filter(u => u.scope === 'Whole Plan');
    phases.forEach(phase => {
      const phaseUsers = onboardedUsers.filter(u => u.scope === phase.id);
      if (wholePlanUsers.length === 0 && phaseUsers.length === 0) {
        addWarn('W-02', phase.name, `Phase "${phase.name}" has no direct users, and there are no Whole-Plan users. Components in this phase won't be delivered.`, phase.id);
      }
    });
  }

  const hasPreTest = components.some(c => c.type === 'Pre-Test');
  if (!hasPreTest) {
    addWarn('W-03', 'Assessments', 'No Pre-Test diagnostic assessment has been placed in this Plan.');
  }

  const hasPostTest = components.some(c => c.type === 'Post-Test');
  if (!hasPostTest) {
    addWarn('W-04', 'Assessments', 'No Post-Test summative assessment has been placed in this Plan.');
  }

  const hasSurvey = components.some(c => c.type === 'Survey');
  if (!hasSurvey) {
    addWarn('W-05', 'Feedback', 'No feedback Survey questionnaire has been placed in this Plan.');
  }

  return {
    isValidForPublish: blockingErrors.length === 0,
    blockingErrors,
    warnings
  };
}

/**
 * Creates the exact worked example Plan as documented in Plan Creation Flow v2.3 Specification
 */
export function createWorkedExamplePlan(lmsId = 'lms-microfinance-brac', orgId = 'tenant-brac'): {
  plan: Plan;
  components: PlanComponent[];
  onboardedUsers: PlanOnboardedUser[];
} {
  const planId = 'plan-fodp-2026';
  const phase1Id = 'comp-ph-1';
  const phase2Id = 'comp-ph-2';

  const plan: Plan = {
    id: planId,
    planCode: 'PLN-1972-882',
    lmsId,
    organizationId: orgId,
    name: 'Field Officer Development Programme 2026',
    description: 'Comprehensive annual qualification track for BRAC rural microfinance field officers, encompassing grassroots operations, digital credit assessment, and community development methodologies.',
    owner: {
      userId: 'usr-admin-01',
      name: 'Farhana Ahmed',
      email: 'farhana.ahmed@brac.net',
      contactNumber: '+880 1713 000000',
      assignedAt: '01/01/2026',
      assignedBy: 'System Administrator'
    },
    durationType: 'Yearly',
    startDate: '01/01/2026',
    endDate: '31/12/2026',
    enrollmentType: 'Closed',
    recurringPlan: true,
    status: 'Draft',
    phaseCount: 2,
    createdDate: '01/01/2026',
    createdBy: 'Farhana Ahmed',
    updatedDate: '01/01/2026',
    defaultProgressionMode: 'Sequential',
    budget: {
      budgetYear: 'FY 2026',
      budgetAmount: 4500000,
      currency: 'BDT'
    },
    recurringConfig: {
      enabled: true,
      cycleConfig: {
        frequency: 'Annual Cycle',
        nextCycleDate: '01/01/2027',
        rolloverPolicy: 'Carry over enrolled active roster',
        alumniCohortPrefix: 'ALU-FODP-'
      }
    }
  };

  const components: PlanComponent[] = [
    {
      id: 'comp-01',
      type: 'Task',
      name: 'Programme setup',
      description: 'System initialization, instructor allocation, portal configuration & branch roster validation.',
      sequence: 1,
      phaseId: null,
      startDate: '01/01/2026',
      endDate: '10/01/2026',
      durationDays: 10,
      isMandatory: true,
      progressionCondition: {
        type: 'manual_tick',
        label: 'Manual mark complete by Planner'
      },
      prerequisiteIds: [],
      source: { sourceType: 'Task Template', itemName: 'Operational Setup Checklist' },
      taskType: 'Setup',
      checklist: [
        { id: 'chk-1', text: 'Confirm branch cohort roster', done: true },
        { id: 'chk-2', text: 'Assign senior trainers', done: true },
        { id: 'chk-3', text: 'Verify field tablet allocations', done: false }
      ]
    },
    {
      id: 'comp-02',
      type: 'Task',
      name: 'Trainee onboarding',
      description: 'Distribution of welcome kits, login credential verification, and portal orientation.',
      sequence: 2,
      phaseId: null,
      startDate: '11/01/2026',
      endDate: '20/01/2026',
      durationDays: 10,
      isMandatory: true,
      progressionCondition: {
        type: 'manual_tick',
        label: 'Manual mark complete by Planner'
      },
      prerequisiteIds: ['comp-01'],
      source: { sourceType: 'Task Template', itemName: 'Trainee Onboarding Standard' },
      taskType: 'Onboarding'
    },
    {
      id: 'comp-03',
      type: 'Task',
      name: 'Planner assignment',
      description: 'Designate regional mentors and schedule supervisory touchpoints.',
      sequence: 3,
      phaseId: null,
      startDate: '21/01/2026',
      endDate: '25/01/2026',
      durationDays: 5,
      isMandatory: true,
      progressionCondition: {
        type: 'manual_tick',
        label: 'Manual mark complete by Planner'
      },
      prerequisiteIds: ['comp-02'],
      source: { sourceType: 'Task Template', itemName: 'Staff Mentorship Assignment' },
      taskType: 'Assignment'
    },
    {
      id: 'comp-04',
      type: 'Pre-Test',
      name: 'Baseline competency assessment',
      description: 'Diagnostic baseline assessment gauging pre-existing field numeracy, community communication and microfinance basics.',
      sequence: 4,
      phaseId: null,
      startDate: '26/01/2026',
      endDate: '05/02/2026',
      durationDays: 11,
      isMandatory: true,
      progressionCondition: {
        type: 'pass_mark',
        value: 40,
        label: 'Pass mark 40 achieved'
      },
      passMark: 40,
      attemptLimit: 2,
      resultVisibility: 'Immediate',
      prerequisiteIds: ['comp-03'],
      source: {
        sourceType: 'Questionnaire Library',
        itemId: 'q-baseline-2026',
        itemName: 'Baseline Technical Aptitude Q-2026',
        version: 'v2.4'
      }
    },
    {
      id: 'comp-05',
      type: 'Content',
      name: 'Programme orientation',
      description: 'Self-paced introductory video series covering BRAC values, safeguarding and field expectations.',
      sequence: 5,
      phaseId: null,
      startDate: '06/02/2026',
      endDate: '15/02/2026',
      durationDays: 10,
      isMandatory: true,
      contentType: 'Video',
      contentLength: '45 mins',
      downloadable: false,
      progressionCondition: {
        type: 'min_consumed',
        value: 90,
        label: 'Watched ≥ 90%'
      },
      prerequisiteIds: ['comp-04'],
      source: {
        sourceType: 'Content Repository',
        itemId: 'asset-orientation-vid',
        itemName: 'BRAC Values & Orientation Video Master',
        version: 'v1.2'
      }
    },
    {
      id: 'comp-06',
      type: 'Course',
      name: 'Introduction to Field Operations',
      description: 'Foundational course detailing grassroots survey protocols and branch routine.',
      sequence: 6,
      phaseId: null,
      startDate: '16/02/2026',
      endDate: '28/02/2026',
      durationDays: 13,
      isMandatory: true,
      deliveryMode: 'Self-paced',
      progressionCondition: {
        type: 'course_completed',
        label: 'Course completed (by Course own rule)'
      },
      prerequisiteIds: ['comp-05'],
      source: {
        sourceType: 'Course Library',
        itemId: 'course-mf-101',
        itemName: 'Introduction to Field Operations',
        version: 'v3.0'
      }
    },
    {
      id: phase1Id,
      type: 'Phase',
      name: 'Phase 1 — Core Field Skills',
      description: 'Intensive modular phase developing primary field interaction, safety protocols and basic survey data collection.',
      sequence: 7,
      phaseId: null,
      startDate: '02/03/2026',
      endDate: '26/06/2026',
      durationDays: 117,
      isMandatory: true,
      phaseCompletionRule: 'All mandatory components completed',
      phaseProgressionMode: 'Sequential',
      progressionCondition: {
        type: 'all_mandatory',
        label: 'All mandatory components completed'
      },
      prerequisiteIds: ['comp-06'],
      source: { sourceType: 'Phase Template', itemName: 'Core Field Foundation' }
    },
    // Children of Phase 1
    {
      id: 'comp-07-child-1',
      type: 'Task',
      name: 'Cohort briefing',
      description: 'Live field briefing with Area Manager regarding regional targets and field protocol.',
      sequence: 8,
      phaseId: phase1Id,
      startDate: '02/03/2026',
      endDate: '06/03/2026',
      durationDays: 5,
      isMandatory: true,
      progressionCondition: {
        type: 'manual_tick',
        label: 'Manual mark complete by Planner'
      },
      prerequisiteIds: [],
      source: { sourceType: 'Task Template', itemName: 'Area Cohort Briefing' },
      taskType: 'Setup'
    },
    {
      id: 'comp-07-child-2',
      type: 'Content',
      name: 'Field safety handbook',
      description: 'Standard operating procedures for rural mobility, extreme weather and emergency escalation.',
      sequence: 9,
      phaseId: phase1Id,
      startDate: '07/03/2026',
      endDate: '15/03/2026',
      durationDays: 9,
      isMandatory: true,
      contentType: 'PDF / Document',
      contentLength: '24 pages',
      downloadable: true,
      progressionCondition: {
        type: 'opened',
        label: 'Opened / viewed'
      },
      prerequisiteIds: ['comp-07-child-1'],
      source: {
        sourceType: 'Content Repository',
        itemId: 'asset-safety-handbook',
        itemName: 'Field Safety Handbook 2026',
        version: 'v4.1'
      }
    },
    {
      id: 'comp-07-child-3',
      type: 'Course',
      name: 'Community Engagement',
      description: 'Blended course covering rural rapport building, Village Organization meetings, and includes mandatory 3-day field practical.',
      sequence: 10,
      phaseId: phase1Id,
      startDate: '16/03/2026',
      endDate: '15/05/2026',
      durationDays: 61,
      isMandatory: true,
      deliveryMode: 'Blended',
      progressionCondition: {
        type: 'min_attendance',
        value: 80,
        label: 'Attendance ≥ 80%'
      },
      includedClasses: [
        {
          id: 'cls-ce-1',
          name: 'Day 1: Grassroots Facilitation',
          date: '05/05/2026',
          time: '09:00 - 16:00',
          duration: '7 hours',
          venue: 'BRAC Centre, Room 402',
          instructor: 'Dr. Rafiqul Islam'
        },
        {
          id: 'cls-ce-2',
          name: 'Day 2: Village Organization Practical',
          date: '06/05/2026',
          time: '09:00 - 17:00',
          duration: '8 hours',
          venue: 'Manikganj Field Training Site',
          instructor: 'Dr. Rafiqul Islam'
        },
        {
          id: 'cls-ce-3',
          name: 'Day 3: Simulation & Debrief',
          date: '07/05/2026',
          time: '09:00 - 13:00',
          duration: '4 hours',
          venue: 'BRAC Centre, Room 402',
          instructor: 'Dr. Rafiqul Islam'
        }
      ],
      prerequisiteIds: ['comp-07-child-2'],
      source: {
        sourceType: 'Course Library',
        itemId: 'course-ce-201',
        itemName: 'Community Engagement & VO Dynamics',
        version: 'v2.0'
      }
    },
    {
      id: 'comp-07-child-4',
      type: 'Course',
      name: 'Data Collection Basics',
      description: 'Mobile tablet survey software, real-time sync, and client biometric data entry.',
      sequence: 11,
      phaseId: phase1Id,
      startDate: '16/05/2026',
      endDate: '26/06/2026',
      durationDays: 42,
      isMandatory: true,
      deliveryMode: 'Instructor-led',
      progressionCondition: {
        type: 'pass_mark',
        value: 60,
        label: 'Pass mark 60%'
      },
      prerequisiteIds: ['comp-07-child-3'],
      source: {
        sourceType: 'Course Library',
        itemId: 'course-dc-102',
        itemName: 'Digital Survey & Household Data Collection',
        version: 'v1.5'
      }
    },
    // Between Phases Component
    {
      id: 'comp-08',
      type: 'Content',
      name: 'Recorded session: case studies',
      description: 'Archived webinar recording reviewing authentic branch case studies and problem loans.',
      sequence: 12,
      phaseId: null,
      startDate: '27/06/2026',
      endDate: '30/06/2026',
      durationDays: 4,
      isMandatory: true,
      contentType: 'Recorded Class',
      contentLength: '90 mins',
      progressionCondition: {
        type: 'min_consumed',
        value: 75,
        label: 'Watched ≥ 75%'
      },
      prerequisiteIds: ['comp-07-child-4'],
      source: {
        sourceType: 'Content Repository',
        itemId: 'asset-rec-cases',
        itemName: 'Branch Case Studies Masterclass (Recorded)',
        version: 'v1.0'
      }
    },
    // Phase 2
    {
      id: phase2Id,
      type: 'Phase',
      name: 'Phase 2 — Advanced Practice',
      description: 'Advanced field risk analysis, delinquency recovery, and supervisory audits.',
      sequence: 13,
      phaseId: null,
      startDate: '01/07/2026',
      endDate: '23/10/2026',
      durationDays: 115,
      isMandatory: true,
      phaseCompletionRule: 'All mandatory components completed',
      phaseProgressionMode: 'Sequential',
      progressionCondition: {
        type: 'all_mandatory',
        label: 'All mandatory components completed'
      },
      prerequisiteIds: ['comp-08'],
      source: { sourceType: 'Phase Template', itemName: 'Advanced Field Practice' }
    },
    // Children of Phase 2
    {
      id: 'comp-09-child-1',
      type: 'Course',
      name: 'Advanced Field Methods',
      description: 'Risk assessment in loan appraisal, group liability management, and recovery protocols.',
      sequence: 14,
      phaseId: phase2Id,
      startDate: '01/07/2026',
      endDate: '10/10/2026',
      durationDays: 102,
      isMandatory: true,
      deliveryMode: 'Blended',
      progressionCondition: {
        type: 'course_completed',
        label: 'Course completed'
      },
      includedClasses: [
        {
          id: 'cls-afm-1',
          name: 'Day 1: Delinquency Management Workshop',
          date: '01/10/2026',
          time: '09:00 - 17:00',
          duration: '8 hours',
          venue: 'Regional Training Centre Rajshahi',
          instructor: 'Nasreen Begum'
        },
        {
          id: 'cls-afm-2',
          name: 'Day 2: Portfolio Audit Simulation',
          date: '02/10/2026',
          time: '09:00 - 15:00',
          duration: '6 hours',
          venue: 'Regional Training Centre Rajshahi',
          instructor: 'Nasreen Begum'
        }
      ],
      prerequisiteIds: [],
      source: {
        sourceType: 'Course Library',
        itemId: 'course-afm-301',
        itemName: 'Advanced Field Risk & Credit Methods',
        version: 'v2.1'
      }
    },
    {
      id: 'comp-09-child-2',
      type: 'Post-Test',
      name: 'Phase 2 skills check',
      description: 'Modular post-test evaluating grasp of delinquency resolution and portfolio auditing.',
      sequence: 15,
      phaseId: phase2Id,
      startDate: '11/10/2026',
      endDate: '23/10/2026',
      durationDays: 13,
      isMandatory: true,
      passMark: 50,
      progressionCondition: {
        type: 'pass_mark',
        value: 50,
        label: 'Pass mark 50'
      },
      prerequisiteIds: ['comp-09-child-1'],
      source: {
        sourceType: 'Questionnaire Library',
        itemId: 'q-phase2-check',
        itemName: 'Phase 2 Skills Verification Q-2026',
        version: 'v1.0'
      }
    },
    // Final components at Plan level
    {
      id: 'comp-10',
      type: 'Post-Test',
      name: 'Final competency assessment',
      description: 'Comprehensive summative qualification examination across entire curriculum.',
      sequence: 16,
      phaseId: null,
      startDate: '24/10/2026',
      endDate: '15/11/2026',
      durationDays: 23,
      isMandatory: true,
      passMark: 60,
      progressionCondition: {
        type: 'pass_mark',
        value: 60,
        label: 'Pass mark 60'
      },
      prerequisiteIds: ['comp-09-child-2'],
      source: {
        sourceType: 'Questionnaire Library',
        itemId: 'q-summative-2026',
        itemName: 'Comprehensive Summative Evaluation Q-2026',
        version: 'v2.0'
      }
    },
    {
      id: 'comp-11',
      type: 'Survey',
      name: 'Programme feedback survey',
      description: 'Standard trainee CSAT feedback survey assessing course quality, venue, and instructor support.',
      sequence: 17,
      phaseId: null,
      startDate: '16/11/2026',
      endDate: '15/12/2026',
      durationDays: 30,
      isMandatory: true,
      anonymousResponses: true,
      progressionCondition: {
        type: 'submitted',
        label: 'Submitted'
      },
      prerequisiteIds: ['comp-10'],
      source: {
        sourceType: 'Survey Form Library',
        itemId: 'fb-form-2026',
        itemName: 'Annual Trainee Satisfaction & Venue Survey',
        version: 'v1.1'
      }
    }
  ];

  const onboardedUsers: PlanOnboardedUser[] = [
    // Whole Plan users (240 users represented by representative batch)
    {
      id: 'usr-wp-01',
      scope: 'Whole Plan',
      identifierType: 'BRAC PIN',
      bracPin: 'PIN-10492',
      email: 'tahmina.akter@brac.net',
      fullName: 'Tahmina Akter',
      designation: 'Junior Field Officer',
      department: 'Microfinance (Dhaka North)',
      notes: 'Batch 2026-A Recruit',
      status: 'Ready',
      dateAdded: '01/01/2026',
      source: 'Bulk Upload'
    },
    {
      id: 'usr-wp-02',
      scope: 'Whole Plan',
      identifierType: 'BRAC PIN',
      bracPin: 'PIN-10493',
      email: 'shofiul.islam@brac.net',
      fullName: 'Md. Shofiul Islam',
      designation: 'Junior Field Officer',
      department: 'Microfinance (Manikganj)',
      notes: 'Batch 2026-A Recruit',
      status: 'Ready',
      dateAdded: '01/01/2026',
      source: 'Bulk Upload'
    },
    {
      id: 'usr-wp-03',
      scope: 'Whole Plan',
      identifierType: 'BRAC PIN',
      bracPin: 'PIN-10494',
      email: 'nargis.khatun@brac.net',
      fullName: 'Nargis Khatun',
      designation: 'Field Officer',
      department: 'Microfinance (Gazipur)',
      notes: 'Batch 2026-A Recruit',
      status: 'Ready',
      dateAdded: '01/01/2026',
      source: 'Bulk Upload'
    },
    {
      id: 'usr-wp-04',
      scope: 'Whole Plan',
      identifierType: 'BRAC PIN',
      bracPin: 'PIN-10495',
      email: 'anwar.hossain@brac.net',
      fullName: 'Anwar Hossain',
      designation: 'Junior Credit Officer',
      department: 'Microfinance (Mymensingh)',
      notes: 'Batch 2026-A Recruit',
      status: 'Ready',
      dateAdded: '01/01/2026',
      source: 'Bulk Upload'
    },
    {
      id: 'usr-wp-05',
      scope: 'Whole Plan',
      identifierType: 'BRAC PIN',
      bracPin: 'PIN-10496',
      email: 'salma.begum@brac.net',
      fullName: 'Salma Begum',
      designation: 'Field Assistant',
      department: 'Microfinance (Tangail)',
      notes: 'Batch 2026-A Recruit',
      status: 'Ready',
      dateAdded: '01/01/2026',
      source: 'Bulk Upload'
    },
    // Phase 1 only (35 users represented)
    {
      id: 'usr-ph1-01',
      scope: phase1Id,
      identifierType: 'BRAC PIN',
      bracPin: 'PIN-20811',
      email: 'rakibul.hasan@brac.net',
      fullName: 'Rakibul Hasan',
      designation: 'Interim Field Trainee',
      department: 'Microfinance (Bogura)',
      notes: 'Core skills foundation only',
      status: 'Ready',
      dateAdded: '01/01/2026',
      source: 'Bulk Upload'
    },
    {
      id: 'usr-ph1-02',
      scope: phase1Id,
      identifierType: 'BRAC PIN',
      bracPin: 'PIN-20812',
      email: 'fahima.jahan@brac.net',
      fullName: 'Fahima Jahan',
      designation: 'Probationary Officer',
      department: 'Microfinance (Sirajganj)',
      notes: 'Core skills foundation only',
      status: 'Ready',
      dateAdded: '01/01/2026',
      source: 'Bulk Upload'
    },
    // Phase 2 only (12 users represented)
    {
      id: 'usr-ph2-01',
      scope: phase2Id,
      identifierType: 'Email',
      email: 'kabir.partner@brac-ngo.org',
      fullName: 'Kabir Chowdhury',
      designation: 'Regional Partner Specialist',
      department: 'Microfinance Audit',
      notes: 'Advanced practice refresher',
      status: 'Ready',
      dateAdded: '01/01/2026',
      source: 'Individual'
    }
  ];

  return { plan, components, onboardedUsers };
}
