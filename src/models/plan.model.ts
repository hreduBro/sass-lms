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
  phases?: Phase[];
  capabilities?: PlanCapabilities;
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
