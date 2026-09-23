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

// =========================================================================
// TRANSCRIPT TEMPLATE & DRAG-AND-DROP CANVAS ARCHITECTURE
// =========================================================================

export type TranscriptOrientation = 'portrait' | 'landscape';
export type TranscriptPaperSize = 'A4' | 'Letter' | 'Legal' | 'Custom';
export type TranscriptTemplateStatus = 'draft' | 'published' | 'archived';
export type TranscriptCanvasElementKind = 'placeholder' | 'static-text' | 'image' | 'qr' | 'performance-table' | 'divider';

export interface TranscriptCanvasElementStyle {
  fontFamily?: string;
  fontSizePt?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidthPx?: number;
  borderRadiusPx?: number;
  align?: 'left' | 'center' | 'right';
  overflow?: 'fit' | 'wrap' | 'truncate';
  lineHeight?: number;
  letterSpacing?: number;
  opacity?: number;
}

export interface TranscriptCanvasElement {
  id: string;
  kind: TranscriptCanvasElementKind;
  token?: string;         // e.g. {{trainee_name}}, {{scope_name}}, etc.
  text?: string;          // Static text
  imageUrl?: string;
  x: number;              // % of canvas width (0-100)
  y: number;              // % of canvas height (0-100)
  w: number;              // % of canvas width (0-100)
  h: number;              // % of canvas height (0-100)
  z: number;              // z-index layer
  rotation?: number;      // degrees
  style: TranscriptCanvasElementStyle;
  tableConfig?: {
    showItemCode: boolean;
    showCredits: boolean;
    showScores: boolean;
    showPercentage: boolean;
    showGrade: boolean;
    showStatus: boolean;
    headerBgColor?: string;
    headerTextColor?: string;
  };
}

export interface TranscriptBackgroundPreset {
  name: string;
  url: string;
  type: string;
  theme: 'light' | 'formal' | 'academic' | 'modern' | 'parchment';
}

export const TRANSCRIPT_BACKGROUND_PRESETS: TranscriptBackgroundPreset[] = [
  {
    name: 'Formal Academic Ledger (Clean)',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    type: 'Official Institution Ivory & Subtle Border',
    theme: 'formal'
  },
  {
    name: 'Executive Parchment Certificate & Transcript',
    url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1600&q=80',
    type: 'Gold Accent Border & Classic Parchment',
    theme: 'parchment'
  },
  {
    name: 'Modern Navy & Slate Technical Registry',
    url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=1600&q=80',
    type: 'Contemporary Geometric Clean Line',
    theme: 'modern'
  },
  {
    name: 'Minimal High-Contrast Institutional White',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
    type: 'High Precision Minimal White Canvas',
    theme: 'light'
  }
];

export const SAMPLE_BACKGROUND_PRESETS = TRANSCRIPT_BACKGROUND_PRESETS;

export interface TranscriptPlaceholderTokenDef {
  key: string;
  token?: string;
  label: string;
  category: 'Recipient / Trainee' | 'Curriculum & Scope' | 'Grades & Evaluation' | 'Assessment Matrix' | 'Dates & Security' | 'Institutional & Signatory';
  sampleValue: string;
  description: string;
  icon: string;
  defaultStyle?: Partial<TranscriptCanvasElementStyle>;
  defaultWidth?: number;
  defaultHeight?: number;
}

export type TranscriptPlaceholderToken = TranscriptPlaceholderTokenDef & { token: string };

export const TRANSCRIPT_PLACEHOLDER_TOKENS: TranscriptPlaceholderTokenDef[] = [
  // 1. Recipient / Trainee
  {
    key: '{{trainee_name}}',
    label: 'Learner / Trainee Full Name',
    category: 'Recipient / Trainee',
    sampleValue: 'Kazi Naimur Rahman',
    description: 'Full legal name of the enrolled learner',
    icon: 'person',
    defaultStyle: { fontSizePt: 18, bold: true, color: '#0f172a', align: 'left' },
    defaultWidth: 40,
    defaultHeight: 5
  },
  {
    key: '{{trainee_id}}',
    label: 'Learner Academic / Staff ID',
    category: 'Recipient / Trainee',
    sampleValue: 'STAFF-BRAC-8891',
    description: 'Unique institutional identification code',
    icon: 'badge',
    defaultStyle: { fontSizePt: 12, bold: true, color: '#334155', align: 'left' },
    defaultWidth: 25,
    defaultHeight: 4
  },
  {
    key: '{{trainee_email}}',
    label: 'Learner Email Address',
    category: 'Recipient / Trainee',
    sampleValue: 'naimur.rahman@brac.net',
    description: 'Primary verified email of the learner',
    icon: 'mail',
    defaultStyle: { fontSizePt: 11, bold: false, color: '#64748b', align: 'left' },
    defaultWidth: 30,
    defaultHeight: 4
  },
  {
    key: '{{department}}',
    label: 'Department / Division',
    category: 'Recipient / Trainee',
    sampleValue: 'Micro-Enterprise Operations',
    description: 'Learner assigned organizational department',
    icon: 'domain',
    defaultStyle: { fontSizePt: 11, bold: false, color: '#334155', align: 'left' },
    defaultWidth: 30,
    defaultHeight: 4
  },
  {
    key: '{{designation}}',
    label: 'Official Designation',
    category: 'Recipient / Trainee',
    sampleValue: 'Senior Branch Credit Manager',
    description: 'Learner job title or role',
    icon: 'work',
    defaultStyle: { fontSizePt: 11, bold: false, color: '#334155', align: 'left' },
    defaultWidth: 30,
    defaultHeight: 4
  },

  // 2. Curriculum & Scope
  {
    key: '{{scope_name}}',
    label: 'Academic Scope / Course / Plan Title',
    category: 'Curriculum & Scope',
    sampleValue: '2026 Microfinance Branch Transformation & Ethics Plan',
    description: 'Title of the completed course, phase, or certified plan',
    icon: 'school',
    defaultStyle: { fontSizePt: 16, bold: true, color: '#0f172a', align: 'left' },
    defaultWidth: 60,
    defaultHeight: 6
  },
  {
    key: '{{plan_name}}',
    label: 'Parent Training Plan',
    category: 'Curriculum & Scope',
    sampleValue: '2026 Microfinance Branch Transformation & Ethics Plan',
    description: 'Name of the overarching curriculum plan',
    icon: 'event_note',
    defaultStyle: { fontSizePt: 12, bold: false, color: '#475569', align: 'left' },
    defaultWidth: 50,
    defaultHeight: 4
  },
  {
    key: '{{level}}',
    label: 'Transcript Record Level',
    category: 'Curriculum & Scope',
    sampleValue: 'PLAN LEVEL',
    description: 'Classification level (Course, Phase, or Plan)',
    icon: 'layers',
    defaultStyle: { fontSizePt: 10, bold: true, color: '#2563eb', align: 'center' },
    defaultWidth: 18,
    defaultHeight: 3.5
  },
  {
    key: '{{total_credits}}',
    label: 'Total Credit Hours',
    category: 'Curriculum & Scope',
    sampleValue: '12.0 Credit Hours',
    description: 'Cumulative accredited academic credit hours',
    icon: 'schedule',
    defaultStyle: { fontSizePt: 12, bold: true, color: '#0f172a', align: 'left' },
    defaultWidth: 22,
    defaultHeight: 4
  },
  {
    key: '{{grading_type}}',
    label: 'Grading Standard',
    category: 'Curriculum & Scope',
    sampleValue: 'Percentage Scale',
    description: 'Evaluation system (Percentage, CGPA, Letter Grade)',
    icon: 'rule',
    defaultStyle: { fontSizePt: 11, bold: false, color: '#475569', align: 'left' },
    defaultWidth: 20,
    defaultHeight: 4
  },

  // 3. Grades & Evaluation
  {
    key: '{{score}}',
    label: 'Aggregate Score',
    category: 'Grades & Evaluation',
    sampleValue: '92.5%',
    description: 'Numerical score or points attained',
    icon: 'military_tech',
    defaultStyle: { fontSizePt: 16, bold: true, color: '#0f172a', align: 'center' },
    defaultWidth: 20,
    defaultHeight: 5
  },
  {
    key: '{{cgpa}}',
    label: 'Cumulative Grade Point (CGPA)',
    category: 'Grades & Evaluation',
    sampleValue: '3.85 / 4.00',
    description: 'Calculated grade point average',
    icon: 'grade',
    defaultStyle: { fontSizePt: 14, bold: true, color: '#0f172a', align: 'center' },
    defaultWidth: 20,
    defaultHeight: 4
  },
  {
    key: '{{result}}',
    label: 'Result & Distinction',
    category: 'Grades & Evaluation',
    sampleValue: '92.5% (Distinction)',
    description: 'Formatted outcome statement',
    icon: 'stars',
    defaultStyle: { fontSizePt: 14, bold: true, color: '#059669', align: 'left' },
    defaultWidth: 35,
    defaultHeight: 4.5
  },
  {
    key: '{{status}}',
    label: 'Assessment Status (PASS/FAIL)',
    category: 'Grades & Evaluation',
    sampleValue: 'PASS',
    description: 'Official academic pass or completed state',
    icon: 'verified',
    defaultStyle: { fontSizePt: 12, bold: true, color: '#059669', align: 'center' },
    defaultWidth: 15,
    defaultHeight: 4
  },

  // 4. Assessment Matrix Component
  {
    key: '{{performance_table}}',
    label: 'Performance Breakdown Table (Grid)',
    category: 'Assessment Matrix',
    sampleValue: '[Modular Evaluation Matrix Grid with Code, Hours, Scores, and Grades]',
    description: 'Detailed curriculum course/module breakdown table with grades and credits',
    icon: 'table_chart',
    defaultStyle: { fontSizePt: 10, bold: false, color: '#1e293b', align: 'left' },
    defaultWidth: 92,
    defaultHeight: 32
  },

  // 5. Dates & Security
  {
    key: '{{issued_date}}',
    label: 'Issue Date',
    category: 'Dates & Security',
    sampleValue: '26/02/2026',
    description: 'Date the transcript record was officially issued',
    icon: 'event',
    defaultStyle: { fontSizePt: 11, bold: false, color: '#334155', align: 'left' },
    defaultWidth: 22,
    defaultHeight: 3.5
  },
  {
    key: '{{completion_date}}',
    label: 'Curriculum Completion Date',
    category: 'Dates & Security',
    sampleValue: '25/02/2026',
    description: 'Final completion timestamp of coursework',
    icon: 'event_available',
    defaultStyle: { fontSizePt: 11, bold: false, color: '#334155', align: 'left' },
    defaultWidth: 22,
    defaultHeight: 3.5
  },
  {
    key: '{{serial_number}}',
    label: 'Official Serial Registry Number',
    category: 'Dates & Security',
    sampleValue: 'TR-2026-BRAC-001',
    description: 'Unique audit trail serial code for verification',
    icon: 'tag',
    defaultStyle: { fontSizePt: 12, bold: true, color: '#0f172a', align: 'left' },
    defaultWidth: 28,
    defaultHeight: 4
  },
  {
    key: '{{verification_code}}',
    label: 'Cryptographic Verification Code',
    category: 'Dates & Security',
    sampleValue: 'VFY-8821-KNR1',
    description: 'Short authentication token for public registry validation',
    icon: 'shield_lock',
    defaultStyle: { fontSizePt: 11, bold: true, color: '#4338ca', align: 'center' },
    defaultWidth: 24,
    defaultHeight: 3.5
  },
  {
    key: '{{verification_qr}}',
    label: 'Verification QR Code',
    category: 'Dates & Security',
    sampleValue: '[QR Code]',
    description: 'Scannable digital authentication QR linking to verified audit record',
    icon: 'qr_code_2',
    defaultStyle: { fontSizePt: 10, bold: false, color: '#0f172a', align: 'center' },
    defaultWidth: 14,
    defaultHeight: 14
  },

  // 6. Institutional & Signatory
  {
    key: '{{org_name}}',
    label: 'Organization / Tenant Name',
    category: 'Institutional & Signatory',
    sampleValue: 'BRAC Global Microfinance',
    description: 'Issuing parent enterprise name',
    icon: 'corporate_fare',
    defaultStyle: { fontSizePt: 18, bold: true, color: '#0f172a', align: 'left' },
    defaultWidth: 50,
    defaultHeight: 5
  },
  {
    key: '{{lms_name}}',
    label: 'LMS Academic Portal Name',
    category: 'Institutional & Signatory',
    sampleValue: 'Microfinance Academy',
    description: 'Issuing learning management system workspace',
    icon: 'hub',
    defaultStyle: { fontSizePt: 12, bold: false, color: '#475569', align: 'left' },
    defaultWidth: 40,
    defaultHeight: 4
  },
  {
    key: '{{signatory_name}}',
    label: 'Academic Director / Signatory Name',
    category: 'Institutional & Signatory',
    sampleValue: 'Farhana Ahmed',
    description: 'Authorized signatory academic executive',
    icon: 'draw',
    defaultStyle: { fontSizePt: 13, bold: true, color: '#0f172a', align: 'center' },
    defaultWidth: 30,
    defaultHeight: 4
  },
  {
    key: '{{signatory_designation}}',
    label: 'Signatory Designation',
    category: 'Institutional & Signatory',
    sampleValue: 'Dean of Academic Affairs & Certification',
    description: 'Executive title of signatory',
    icon: 'assignment_ind',
    defaultStyle: { fontSizePt: 10, bold: false, color: '#64748b', align: 'center' },
    defaultWidth: 32,
    defaultHeight: 3.5
  },
  {
    key: '{{academic_remarks}}',
    label: 'Institutional Remarks / Evaluator Notes',
    category: 'Institutional & Signatory',
    sampleValue: 'Exemplary performance across client protection, digital tablet sync recovery, and micro-loan delinquency mitigation.',
    description: 'Official academic remarks notes',
    icon: 'notes',
    defaultStyle: { fontSizePt: 10, bold: false, color: '#475569', align: 'left' },
    defaultWidth: 80,
    defaultHeight: 6
  }
];

export interface TranscriptTemplate {
  id: string;
  name: string;
  description?: string;
  orientation: TranscriptOrientation;
  paperSize: TranscriptPaperSize;
  backgroundUrl: string;
  backgroundFileName?: string;
  elements: TranscriptCanvasElement[];
  isDefault: boolean;
  status: TranscriptTemplateStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export const INITIAL_TRANSCRIPT_TEMPLATES: TranscriptTemplate[] = [
  {
    id: 'tpl-transcript-default',
    name: 'Executive Academic Ledger (Standard Formal)',
    description: 'Official academic transcript layout featuring institution header, learner profile, curriculum details, performance matrix, and verification QR.',
    orientation: 'portrait',
    paperSize: 'A4',
    backgroundUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    backgroundFileName: 'clean_academic_cream.jpg',
    isDefault: true,
    status: 'published',
    createdBy: 'System Architect',
    createdAt: '01/01/2026 09:00:00',
    updatedAt: '26/02/2026 14:00:00',
    usageCount: 42,
    elements: [
      // Header Org & LMS
      {
        id: 'el-org-name',
        kind: 'placeholder',
        token: '{{org_name}}',
        x: 4,
        y: 4,
        w: 60,
        h: 5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 20,
          bold: true,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'left'
        }
      },
      {
        id: 'el-lms-name',
        kind: 'placeholder',
        token: '{{lms_name}}',
        x: 4,
        y: 9.5,
        w: 55,
        h: 3.5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 11,
          bold: false,
          italic: false,
          underline: false,
          color: '#475569',
          align: 'left'
        }
      },
      {
        id: 'el-title-label',
        kind: 'static-text',
        text: 'ACADEMIC PERFORMANCE TRANSCRIPT',
        x: 4,
        y: 13.5,
        w: 60,
        h: 3,
        z: 2,
        style: {
          fontFamily: "'Cinzel', serif",
          fontSizePt: 11,
          bold: true,
          italic: false,
          underline: false,
          color: '#2563eb',
          align: 'left'
        }
      },
      // Serial & Dates Top Right
      {
        id: 'el-serial',
        kind: 'placeholder',
        token: '{{serial_number}}',
        x: 65,
        y: 4,
        w: 31,
        h: 4,
        z: 2,
        style: {
          fontFamily: "'Courier Prime', monospace",
          fontSizePt: 12,
          bold: true,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'right'
        }
      },
      {
        id: 'el-issued-date',
        kind: 'placeholder',
        token: '{{issued_date}}',
        x: 65,
        y: 8.5,
        w: 31,
        h: 3.5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 10,
          bold: false,
          italic: false,
          underline: false,
          color: '#64748b',
          align: 'right'
        }
      },
      {
        id: 'el-qr',
        kind: 'placeholder',
        token: '{{verification_qr}}',
        x: 83,
        y: 12.5,
        w: 13,
        h: 9,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 10,
          bold: false,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'center'
        }
      },
      // Divider
      {
        id: 'el-div-1',
        kind: 'divider',
        x: 4,
        y: 22.5,
        w: 92,
        h: 0.5,
        z: 1,
        style: {
          fontFamily: 'sans-serif',
          fontSizePt: 10,
          bold: false,
          italic: false,
          underline: false,
          color: '#cbd5e1',
          borderColor: '#cbd5e1',
          borderWidthPx: 1,
          align: 'center'
        }
      },
      // Learner Information Section
      {
        id: 'el-lbl-trainee',
        kind: 'static-text',
        text: 'TRAINEE / LEARNER PROFILE',
        x: 4,
        y: 24,
        w: 44,
        h: 2.5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 9,
          bold: true,
          italic: false,
          underline: false,
          color: '#64748b',
          align: 'left'
        }
      },
      {
        id: 'el-trainee-name',
        kind: 'placeholder',
        token: '{{trainee_name}}',
        x: 4,
        y: 27,
        w: 44,
        h: 4.5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 15,
          bold: true,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'left'
        }
      },
      {
        id: 'el-trainee-id',
        kind: 'placeholder',
        token: '{{trainee_id}}',
        x: 4,
        y: 32,
        w: 44,
        h: 3.5,
        z: 2,
        style: {
          fontFamily: "'Courier Prime', monospace",
          fontSizePt: 11,
          bold: true,
          italic: false,
          underline: false,
          color: '#334155',
          align: 'left'
        }
      },
      // Academic Scope Section
      {
        id: 'el-lbl-scope',
        kind: 'static-text',
        text: 'ACADEMIC SCOPE & CURRICULUM',
        x: 52,
        y: 24,
        w: 44,
        h: 2.5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 9,
          bold: true,
          italic: false,
          underline: false,
          color: '#64748b',
          align: 'left'
        }
      },
      {
        id: 'el-scope-name',
        kind: 'placeholder',
        token: '{{scope_name}}',
        x: 52,
        y: 27,
        w: 44,
        h: 4.5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 13,
          bold: true,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'left'
        }
      },
      {
        id: 'el-credits',
        kind: 'placeholder',
        token: '{{total_credits}}',
        x: 52,
        y: 32,
        w: 44,
        h: 3.5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 11,
          bold: true,
          italic: false,
          underline: false,
          color: '#2563eb',
          align: 'left'
        }
      },
      // Performance Table Component
      {
        id: 'el-perf-table',
        kind: 'performance-table',
        token: '{{performance_table}}',
        x: 4,
        y: 37,
        w: 92,
        h: 38,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 9.5,
          bold: false,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'left'
        },
        tableConfig: {
          showItemCode: true,
          showCredits: true,
          showScores: true,
          showPercentage: true,
          showGrade: true,
          showStatus: true,
          headerBgColor: '#0f172a',
          headerTextColor: '#ffffff'
        }
      },
      // Aggregate Result Box
      {
        id: 'el-result-box',
        kind: 'placeholder',
        token: '{{result}}',
        x: 4,
        y: 77,
        w: 44,
        h: 5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 14,
          bold: true,
          italic: false,
          underline: false,
          color: '#059669',
          align: 'left'
        }
      },
      {
        id: 'el-status-pill',
        kind: 'placeholder',
        token: '{{status}}',
        x: 4,
        y: 82.5,
        w: 20,
        h: 4,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 11,
          bold: true,
          italic: false,
          underline: false,
          color: '#059669',
          align: 'center'
        }
      },
      // Remarks
      {
        id: 'el-remarks',
        kind: 'placeholder',
        token: '{{academic_remarks}}',
        x: 4,
        y: 87.5,
        w: 60,
        h: 7,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 9.5,
          bold: false,
          italic: true,
          underline: false,
          color: '#475569',
          align: 'left'
        }
      },
      // Signatory Section
      {
        id: 'el-signatory-name',
        kind: 'placeholder',
        token: '{{signatory_name}}',
        x: 68,
        y: 85,
        w: 28,
        h: 4,
        z: 2,
        style: {
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSizePt: 14,
          bold: true,
          italic: true,
          underline: false,
          color: '#0f172a',
          align: 'center'
        }
      },
      {
        id: 'el-signatory-desig',
        kind: 'placeholder',
        token: '{{signatory_designation}}',
        x: 68,
        y: 89.5,
        w: 28,
        h: 3.5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 9,
          bold: false,
          italic: false,
          underline: false,
          color: '#64748b',
          align: 'center'
        }
      }
    ]
  },
  {
    id: 'tpl-transcript-parchment',
    name: 'Executive Gold Parchment Transcript',
    description: 'Traditional formal parchment style suitable for diploma supplements, high-stakes certifications, and legal transcripts.',
    orientation: 'portrait',
    paperSize: 'A4',
    backgroundUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1600&q=80',
    backgroundFileName: 'gold_parchment.jpg',
    isDefault: false,
    status: 'published',
    createdBy: 'Academic Registrar',
    createdAt: '15/01/2026 10:30:00',
    updatedAt: '20/02/2026 11:15:00',
    usageCount: 18,
    elements: [
      {
        id: 'el-p-org',
        kind: 'placeholder',
        token: '{{org_name}}',
        x: 8,
        y: 6,
        w: 84,
        h: 6,
        z: 2,
        style: {
          fontFamily: "'Cinzel', serif",
          fontSizePt: 22,
          bold: true,
          italic: false,
          underline: false,
          color: '#1e293b',
          align: 'center'
        }
      },
      {
        id: 'el-p-title',
        kind: 'static-text',
        text: 'OFFICIAL RECORD OF ACADEMIC ACHIEVEMENT & TRANSCRIPT',
        x: 8,
        y: 12.5,
        w: 84,
        h: 3.5,
        z: 2,
        style: {
          fontFamily: "'Cinzel', serif",
          fontSizePt: 10,
          bold: true,
          italic: false,
          underline: false,
          color: '#854d0e',
          align: 'center'
        }
      },
      {
        id: 'el-p-trainee',
        kind: 'placeholder',
        token: '{{trainee_name}}',
        x: 8,
        y: 20,
        w: 84,
        h: 5.5,
        z: 2,
        style: {
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSizePt: 20,
          bold: true,
          italic: true,
          underline: false,
          color: '#0f172a',
          align: 'center'
        }
      },
      {
        id: 'el-p-table',
        kind: 'performance-table',
        token: '{{performance_table}}',
        x: 6,
        y: 30,
        w: 88,
        h: 42,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 9.5,
          bold: false,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'left'
        },
        tableConfig: {
          showItemCode: true,
          showCredits: true,
          showScores: true,
          showPercentage: true,
          showGrade: true,
          showStatus: true,
          headerBgColor: '#78350f',
          headerTextColor: '#ffffff'
        }
      },
      {
        id: 'el-p-result',
        kind: 'placeholder',
        token: '{{result}}',
        x: 6,
        y: 75,
        w: 45,
        h: 5,
        z: 2,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSizePt: 14,
          bold: true,
          italic: false,
          underline: false,
          color: '#047857',
          align: 'left'
        }
      },
      {
        id: 'el-p-serial',
        kind: 'placeholder',
        token: '{{serial_number}}',
        x: 6,
        y: 82,
        w: 40,
        h: 3.5,
        z: 2,
        style: {
          fontFamily: "'Courier Prime', monospace",
          fontSizePt: 10,
          bold: true,
          italic: false,
          underline: false,
          color: '#475569',
          align: 'left'
        }
      },
      {
        id: 'el-p-sig',
        kind: 'placeholder',
        token: '{{signatory_name}}',
        x: 60,
        y: 82,
        w: 34,
        h: 4,
        z: 2,
        style: {
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSizePt: 14,
          bold: true,
          italic: true,
          underline: false,
          color: '#0f172a',
          align: 'center'
        }
      }
    ]
  }
];

