import { GradingType, GradingScope } from './plan.model';

export type TranscriptLevel = 'course' | 'phase' | 'plan';
export type TranscriptStatus = 'pass' | 'fail' | 'completed';
export type TranscriptReleaseState = 'pending' | 'available' | 'released' | 'revoked';

export interface PhaseReleaseRule {
  phaseId: string;
  phaseName: string;
  minScore: number;
  minCompletionPercent: number;
  dependsOnPhaseId?: string | null;
}

export interface TranscriptConfig {
  enabled: {
    course: boolean;
    phase: boolean;
    plan: boolean;
  };
  releaseRule: {
    scope: 'perPhase' | 'wholePlan';
    minScore: number;
    minCompletionPercent: number;
    perPhase: PhaseReleaseRule[];
  };
  allowPdfDownload: {
    course: boolean;
    phase: boolean;
    plan: boolean;
  };
  visibility: string;
}

export interface TranscriptItemBreakdown {
  itemCode: string;
  itemName: string;
  type: 'course' | 'module' | 'assessment' | 'practicum';
  creditHours: number;
  maxScore: number;
  scoreEarned: number;
  percentage: number;
  grade: string;
  gradePoint?: number;
  status: TranscriptStatus;
  instructorName?: string;
  completionDate: string;
}

export interface TranscriptContent {
  traineeName: string;
  traineeId: string;
  traineeEmail: string;
  department?: string;
  designation?: string;
  location?: string;
  score: string | number;
  maxScore?: number;
  percentage?: number;
  cgpa?: number;
  gradingType: GradingType;
  result: string; // e.g. "88.5%" or "3.85 CGPA"
  status: TranscriptStatus;
  completionDate: string; // DD/MM/YYYY
  issuedDate: string; // DD/MM/YYYY
  releasedAt?: string; // DD/MM/YYYY HH:MM:SS
  serialNumber: string; // e.g. "TR-2026-BRAC-08941"
  verificationCode: string; // e.g. "VFY-9921-X81A"
  securityHash: string; // e.g. "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
  totalCredits: number;
  remarks?: string;
  itemsBreakdown: TranscriptItemBreakdown[];
}

export interface TranscriptRecord {
  transcriptId: string;
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  traineeAvatar?: string;
  level: TranscriptLevel;
  scopeId: string;
  scopeName: string;
  planId: string;
  planName: string;
  phaseId?: string;
  phaseName?: string;
  orgId: string;
  orgName: string;
  lmsId: string;
  lmsName: string;
  content: TranscriptContent;
  releaseState: TranscriptReleaseState;
  releasedAt?: string;
  planClosed: boolean; // The hard gate for plan-level (§2.1)
  downloadEnabled: boolean;
  version: number;
  generatedAt: string;
  updatedAt: string;
  revocationReason?: string;
}

export interface TranscriptExportJob {
  jobId: string;
  requestedBy: string;
  requesterRole: string;
  filter: {
    level?: TranscriptLevel[];
    status?: TranscriptStatus[];
    releaseState?: TranscriptReleaseState[];
    planId?: string;
    phaseId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  selectedTranscriptIds: string[];
  format: 'pdfZip' | 'csv' | 'both';
  includeUnreleased: boolean;
  status: 'processing' | 'ready' | 'failed';
  totalRecords: number;
  progressPercent: number;
  resultUrl?: string;
  requestedAt: string;
  completedAt?: string;
}

export interface TranscriptPermissions {
  canViewFeature: boolean;
  canConfigureRules: boolean;
  canExportIndividual: boolean;
  canExportBulk: boolean;
  canManuallyRelease: boolean;
  canManageDashboardStudio: boolean;
}

// -------------------------------------------------------------
// INITIAL TRANSCRIPTS MOCK DATA (COURSE, PHASE, AND PLAN LEVELS)
// -------------------------------------------------------------

export const INITIAL_TRANSCRIPTS: TranscriptRecord[] = [
  // 1. Plan Level Transcript - Released (Plan Completed AND Closed)
  {
    transcriptId: 'TR-2026-BRAC-001',
    traineeId: 'usr-brac-10',
    traineeName: 'Kazi Naimur Rahman',
    traineeEmail: 'naimur.rahman@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    level: 'plan',
    scopeId: 'plan-brac-01',
    scopeName: '2026 Microfinance Branch Transformation & Ethics Plan',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    orgId: 'org-brac',
    orgName: 'BRAC Global Microfinance',
    lmsId: 'lms-mf-01',
    lmsName: 'Microfinance Academy',
    content: {
      traineeName: 'Kazi Naimur Rahman',
      traineeId: 'STAFF-BRAC-8891',
      traineeEmail: 'naimur.rahman@brac.net',
      department: 'Micro-Enterprise Operations',
      designation: 'Senior Branch Credit Manager',
      location: 'Bogura Regional Zone, Bangladesh',
      score: 92.5,
      maxScore: 100,
      percentage: 92.5,
      cgpa: 3.85,
      gradingType: 'Percentage',
      result: '92.5% (Distinction)',
      status: 'pass',
      completionDate: '25/02/2026',
      issuedDate: '26/02/2026',
      releasedAt: '26/02/2026 14:00:00',
      serialNumber: 'TR-2026-BRAC-001',
      verificationCode: 'VFY-8821-KNR1',
      securityHash: 'sha256:4a8b7c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
      totalCredits: 12.0,
      remarks: 'Exemplary performance across client protection, digital tablet sync recovery, and micro-loan delinquency mitigation.',
      itemsBreakdown: [
        {
          itemCode: 'MF-CR-101',
          itemName: 'Smart Campaign Client Protection & Non-Coercive Collections',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 95.0,
          percentage: 95.0,
          grade: 'A+',
          gradePoint: 4.0,
          status: 'pass',
          instructorName: 'Farhana Ahmed',
          completionDate: '20/01/2026'
        },
        {
          itemCode: 'MF-CR-102',
          itemName: 'Village Organization Group Loan Appraisal & Cash Flow Audit',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 90.0,
          percentage: 90.0,
          grade: 'A',
          gradePoint: 3.75,
          status: 'pass',
          instructorName: 'Tanvir Hossain',
          completionDate: '05/02/2026'
        },
        {
          itemCode: 'MF-SYS-201',
          itemName: 'Offline Biometric Tablet POS Operations & Reconciliation',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 94.0,
          percentage: 94.0,
          grade: 'A',
          gradePoint: 3.85,
          status: 'pass',
          instructorName: 'Engr. Rakibul Islam',
          completionDate: '18/02/2026'
        },
        {
          itemCode: 'MF-CLI-301',
          itemName: 'Emergency Micro-Insurance & Flood Distress Claim Verification',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 91.0,
          percentage: 91.0,
          grade: 'A',
          gradePoint: 3.75,
          status: 'pass',
          instructorName: 'Dr. Imran Matin',
          completionDate: '25/02/2026'
        }
      ]
    },
    releaseState: 'released',
    releasedAt: '26/02/2026 14:00:00',
    planClosed: true,
    downloadEnabled: true,
    version: 1,
    generatedAt: '25/02/2026 18:30:00',
    updatedAt: '26/02/2026 14:00:00'
  },

  // 2. Phase Level Transcript - Released
  {
    transcriptId: 'TR-2026-BRAC-002',
    traineeId: 'usr-brac-10',
    traineeName: 'Kazi Naimur Rahman',
    traineeEmail: 'naimur.rahman@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    level: 'phase',
    scopeId: 'phase-brac-01',
    scopeName: 'Phase 1: Compliance, Ethics & Village Group Governance',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    phaseId: 'phase-brac-01',
    phaseName: 'Phase 1: Compliance, Ethics & Village Group Governance',
    orgId: 'org-brac',
    orgName: 'BRAC Global Microfinance',
    lmsId: 'lms-mf-01',
    lmsName: 'Microfinance Academy',
    content: {
      traineeName: 'Kazi Naimur Rahman',
      traineeId: 'STAFF-BRAC-8891',
      traineeEmail: 'naimur.rahman@brac.net',
      department: 'Micro-Enterprise Operations',
      designation: 'Senior Branch Credit Manager',
      score: 92.5,
      maxScore: 100,
      percentage: 92.5,
      cgpa: 3.85,
      gradingType: 'Percentage',
      result: '92.5%',
      status: 'pass',
      completionDate: '05/02/2026',
      issuedDate: '06/02/2026',
      releasedAt: '06/02/2026 10:15:00',
      serialNumber: 'TR-2026-BRAC-002',
      verificationCode: 'VFY-PH1-KNR8',
      securityHash: 'sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      totalCredits: 6.0,
      remarks: 'Completed all prerequisite phase courses meeting the 80% passing threshold.',
      itemsBreakdown: [
        {
          itemCode: 'MF-CR-101',
          itemName: 'Smart Campaign Client Protection & Non-Coercive Collections',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 95.0,
          percentage: 95.0,
          grade: 'A+',
          gradePoint: 4.0,
          status: 'pass',
          instructorName: 'Farhana Ahmed',
          completionDate: '20/01/2026'
        },
        {
          itemCode: 'MF-CR-102',
          itemName: 'Village Organization Group Loan Appraisal & Cash Flow Audit',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 90.0,
          percentage: 90.0,
          grade: 'A',
          gradePoint: 3.75,
          status: 'pass',
          instructorName: 'Tanvir Hossain',
          completionDate: '05/02/2026'
        }
      ]
    },
    releaseState: 'released',
    releasedAt: '06/02/2026 10:15:00',
    planClosed: false,
    downloadEnabled: true,
    version: 1,
    generatedAt: '05/02/2026 16:45:00',
    updatedAt: '06/02/2026 10:15:00'
  },

  // 3. Course Level Transcript - Released
  {
    transcriptId: 'TR-2026-BRAC-003',
    traineeId: 'usr-brac-10',
    traineeName: 'Kazi Naimur Rahman',
    traineeEmail: 'naimur.rahman@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    level: 'course',
    scopeId: 'crs-brac-101',
    scopeName: 'Smart Campaign Client Protection & Non-Coercive Collections',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    phaseId: 'phase-brac-01',
    phaseName: 'Phase 1: Compliance, Ethics & Village Group Governance',
    orgId: 'org-brac',
    orgName: 'BRAC Global Microfinance',
    lmsId: 'lms-mf-01',
    lmsName: 'Microfinance Academy',
    content: {
      traineeName: 'Kazi Naimur Rahman',
      traineeId: 'STAFF-BRAC-8891',
      traineeEmail: 'naimur.rahman@brac.net',
      department: 'Micro-Enterprise Operations',
      designation: 'Senior Branch Credit Manager',
      score: 95.0,
      maxScore: 100,
      percentage: 95.0,
      cgpa: 4.0,
      gradingType: 'Percentage',
      result: '95.0% (Grade A+)',
      status: 'pass',
      completionDate: '20/01/2026',
      issuedDate: '20/01/2026',
      releasedAt: '20/01/2026 18:00:00',
      serialNumber: 'TR-2026-BRAC-003',
      verificationCode: 'VFY-CRS-101-KNR',
      securityHash: 'sha256:9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
      totalCredits: 3.0,
      itemsBreakdown: [
        {
          itemCode: 'MOD-01',
          itemName: 'Client Safeguarding Principles & Regulatory Directives',
          type: 'module',
          creditHours: 1.0,
          maxScore: 30,
          scoreEarned: 29.0,
          percentage: 96.6,
          grade: 'A+',
          status: 'pass',
          completionDate: '15/01/2026'
        },
        {
          itemCode: 'MOD-02',
          itemName: 'Ethical Loan Collection Protocols & Night-Visit Prohibition',
          type: 'module',
          creditHours: 1.0,
          maxScore: 30,
          scoreEarned: 28.0,
          percentage: 93.3,
          grade: 'A',
          status: 'pass',
          completionDate: '18/01/2026'
        },
        {
          itemCode: 'ASM-03',
          itemName: 'Final Proctored Scenario Assessment & Oral Viva',
          type: 'assessment',
          creditHours: 1.0,
          maxScore: 40,
          scoreEarned: 38.0,
          percentage: 95.0,
          grade: 'A+',
          status: 'pass',
          completionDate: '20/01/2026'
        }
      ]
    },
    releaseState: 'released',
    releasedAt: '20/01/2026 18:00:00',
    planClosed: false,
    downloadEnabled: true,
    version: 1,
    generatedAt: '20/01/2026 17:30:00',
    updatedAt: '20/01/2026 18:00:00'
  },

  // 4. Learner 2: Plan Level Transcript - PENDING (Completed Plan, BUT Plan NOT Closed Yet)
  {
    transcriptId: 'TR-2026-BRAC-004',
    traineeId: 'usr-brac-11',
    traineeName: 'Sabina Yasmin',
    traineeEmail: 'sabina.yasmin@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    level: 'plan',
    scopeId: 'plan-brac-02',
    scopeName: 'Ultra-Poor Graduation & Rural Livelihood Facilitator Cohort 2026',
    planId: 'plan-brac-02',
    planName: 'Ultra-Poor Graduation & Rural Livelihood Facilitator Cohort 2026',
    orgId: 'org-brac',
    orgName: 'BRAC Global Microfinance',
    lmsId: 'lms-upg-02',
    lmsName: 'Graduation Institute',
    content: {
      traineeName: 'Sabina Yasmin',
      traineeId: 'STAFF-BRAC-9102',
      traineeEmail: 'sabina.yasmin@brac.net',
      department: 'Ultra-Poor Graduation Program',
      designation: 'Field Livelihood Officer',
      location: 'Rangpur Division, Bangladesh',
      score: 87.0,
      maxScore: 100,
      percentage: 87.0,
      cgpa: 3.65,
      gradingType: 'Percentage',
      result: '87.0% (Merit)',
      status: 'pass',
      completionDate: '26/02/2026',
      issuedDate: '26/02/2026',
      serialNumber: 'TR-2026-BRAC-004',
      verificationCode: 'VFY-UPG-SY92',
      securityHash: 'sha256:5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
      totalCredits: 10.0,
      remarks: 'Plan completed with distinction. Official transcript release pending final administrative Plan closure by Academic Directorate.',
      itemsBreakdown: [
        {
          itemCode: 'UPG-PR-101',
          itemName: 'Participatory Rural Wealth Appraisal & Community Mapping',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 88.0,
          percentage: 88.0,
          grade: 'A-',
          gradePoint: 3.5,
          status: 'pass',
          completionDate: '10/02/2026'
        },
        {
          itemCode: 'UPG-PR-102',
          itemName: 'Asset Transfer Verification & Micro-Enterprise Budgeting',
          type: 'course',
          creditHours: 4.0,
          maxScore: 100,
          scoreEarned: 86.0,
          percentage: 86.0,
          grade: 'A-',
          gradePoint: 3.5,
          status: 'pass',
          completionDate: '20/02/2026'
        },
        {
          itemCode: 'UPG-PR-103',
          itemName: 'Bi-Weekly Coaching & Household Food Security Scorecard',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 88.0,
          percentage: 88.0,
          grade: 'A',
          gradePoint: 3.75,
          status: 'pass',
          completionDate: '26/02/2026'
        }
      ]
    },
    releaseState: 'pending', // ⚠️ Plan completed, but planClosed = false (Plan-closed hard gate)
    planClosed: false,
    downloadEnabled: false, // Locked until released
    version: 1,
    generatedAt: '26/02/2026 15:00:00',
    updatedAt: '26/02/2026 15:00:00'
  },

  // 5. Learner 3: Phase Level Transcript - Available (Unreleased, waiting for admin approval/rule)
  {
    transcriptId: 'TR-2026-BRAC-005',
    traineeId: 'usr-brac-12',
    traineeName: 'Mahmudul Hasan',
    traineeEmail: 'mahmudul.hasan@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    level: 'phase',
    scopeId: 'phase-brac-01',
    scopeName: 'Phase 1: Compliance, Ethics & Village Group Governance',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    phaseId: 'phase-brac-01',
    phaseName: 'Phase 1: Compliance, Ethics & Village Group Governance',
    orgId: 'org-brac',
    orgName: 'BRAC Global Microfinance',
    lmsId: 'lms-mf-01',
    lmsName: 'Microfinance Academy',
    content: {
      traineeName: 'Mahmudul Hasan',
      traineeId: 'STAFF-BRAC-7734',
      traineeEmail: 'mahmudul.hasan@brac.net',
      department: 'Audit & Compliance',
      designation: 'Junior Credit Inspector',
      score: 76.0,
      maxScore: 100,
      percentage: 76.0,
      cgpa: 3.15,
      gradingType: 'Percentage',
      result: '76.0%',
      status: 'pass',
      completionDate: '27/02/2026',
      issuedDate: '27/02/2026',
      serialNumber: 'TR-2026-BRAC-005',
      verificationCode: 'VFY-PH1-MH77',
      securityHash: 'sha256:7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
      totalCredits: 6.0,
      remarks: 'Passed all Phase 1 courses. Available for release.',
      itemsBreakdown: [
        {
          itemCode: 'MF-CR-101',
          itemName: 'Smart Campaign Client Protection & Non-Coercive Collections',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 78.0,
          percentage: 78.0,
          grade: 'B+',
          gradePoint: 3.25,
          status: 'pass',
          completionDate: '15/02/2026'
        },
        {
          itemCode: 'MF-CR-102',
          itemName: 'Village Organization Group Loan Appraisal & Cash Flow Audit',
          type: 'course',
          creditHours: 3.0,
          maxScore: 100,
          scoreEarned: 74.0,
          percentage: 74.0,
          grade: 'B',
          gradePoint: 3.0,
          status: 'pass',
          completionDate: '27/02/2026'
        }
      ]
    },
    releaseState: 'available', // Available unreleased
    planClosed: false,
    downloadEnabled: true,
    version: 1,
    generatedAt: '27/02/2026 12:00:00',
    updatedAt: '27/02/2026 12:00:00'
  },

  // 6. Course Level Transcript - Failed Status
  {
    transcriptId: 'TR-2026-BRAC-006',
    traineeId: 'usr-brac-13',
    traineeName: 'Tariqul Islam',
    traineeEmail: 'tariqul.islam@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    level: 'course',
    scopeId: 'crs-brac-102',
    scopeName: 'Village Organization Group Loan Appraisal & Cash Flow Audit',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    phaseId: 'phase-brac-01',
    phaseName: 'Phase 1: Compliance, Ethics & Village Group Governance',
    orgId: 'org-brac',
    orgName: 'BRAC Global Microfinance',
    lmsId: 'lms-mf-01',
    lmsName: 'Microfinance Academy',
    content: {
      traineeName: 'Tariqul Islam',
      traineeId: 'STAFF-BRAC-6621',
      traineeEmail: 'tariqul.islam@brac.net',
      department: 'Field Operations',
      designation: 'Trainee Loan Officer',
      score: 48.0,
      maxScore: 100,
      percentage: 48.0,
      cgpa: 1.8,
      gradingType: 'Percentage',
      result: '48.0% (Fail - Retake Required)',
      status: 'fail',
      completionDate: '22/02/2026',
      issuedDate: '22/02/2026',
      releasedAt: '22/02/2026 17:00:00',
      serialNumber: 'TR-2026-BRAC-006',
      verificationCode: 'VFY-CRS-102-TI66',
      securityHash: 'sha256:3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
      totalCredits: 3.0,
      remarks: 'Did not meet the minimum 60% passing mark on loan default modeling. Mandatory retake assigned.',
      itemsBreakdown: [
        {
          itemCode: 'MOD-10',
          itemName: 'Borrower Cash Flow Ratio Calculation',
          type: 'module',
          creditHours: 1.0,
          maxScore: 50,
          scoreEarned: 22.0,
          percentage: 44.0,
          grade: 'F',
          status: 'fail',
          completionDate: '22/02/2026'
        },
        {
          itemCode: 'MOD-11',
          itemName: 'Field Verification Case Study Simulation',
          type: 'module',
          creditHours: 2.0,
          maxScore: 50,
          scoreEarned: 26.0,
          percentage: 52.0,
          grade: 'D',
          status: 'fail',
          completionDate: '22/02/2026'
        }
      ]
    },
    releaseState: 'released',
    releasedAt: '22/02/2026 17:00:00',
    planClosed: false,
    downloadEnabled: true,
    version: 1,
    generatedAt: '22/02/2026 16:30:00',
    updatedAt: '22/02/2026 17:00:00'
  }
];

export const DEFAULT_TRANSCRIPT_PERMISSIONS: TranscriptPermissions = {
  canViewFeature: true,
  canConfigureRules: true,
  canExportIndividual: true,
  canExportBulk: true,
  canManuallyRelease: true,
  canManageDashboardStudio: true
};
