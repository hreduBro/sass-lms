export type PlanStatus = 'Draft' | 'Published' | 'Active' | 'Completed' | 'Archived';
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
export type GradingType = 'Percentage' | 'CGPA';
export type CertificateStatus = 'Pass' | 'Fail' | 'Completed';
export type EvaluationRequirement = 'Mandatory' | 'Optional';
export type EnrollmentConfirmation = 'Auto Onboard' | 'Manual Review';

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
  cycleConfig: string;
  currentCycle: string;
  historicalCycleRetention: string;
  structureChangePolicy: string;
  reEnrollmentRule: string;
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
  durationType: DurationType[];
  enrollmentType: EnrollmentType[];
  startDate: string | null;
  endDate: string | null;
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
