import { AssessmentQuestion } from './assessment.model';

export type AssessmentMode = 'reference' | 'inline' | 'manual';
export type OfflineTrainingStatus = 'draft' | 'published' | 'inactive';
export type OfflineAssessmentMode = AssessmentMode;
export type OfflineContentAttachment = OfflineContentItem;
export type ManualMarkCriteria = any;
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type OfflineCompletionRule = 'attended_and_passed' | 'passed_only' | 'attended_only' | 'any';

export interface OfflineContentItem {
  contentId?: string;
  attachmentId?: string;
  fileType?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  isRequiredPreRead?: boolean;
  displayOrder?: number;
  source?: 'repository' | 'new' | string;
  family?: 'learning' | 'resource' | 'supplement' | string;
  subtype?: 'document' | 'video' | 'audio' | 'slides' | 'reading' | 'interactive' | string;
  title: string;
  description?: string;
  urlOrRef?: string;
  fileSizeOrDuration?: string;
  isRequired?: boolean;
}

export interface OfflineAssessmentItem {
  id: string;
  mode: AssessmentMode; // 'reference' (Mode A), 'inline' (Mode B), 'manual' (Mode C)
  // Mode A: Reference
  assessmentId?: string;
  assessmentTitle?: string;
  assessmentVersionId?: string;
  // Mode B: Inline
  inlineQuestions?: AssessmentQuestion[];
  // Mode C: Manual mark entry (Gradebook)
  label?: string; // e.g. "Practical Demonstration Rubric", "Physical Drill Evaluation"
  maxMarks?: number; // e.g. 100
  passMarkPercent?: number; // e.g. 60 (%)
  passingScore?: number;
  weightagePercent?: number;
}

export interface OfflineAttendanceConfig {
  required: boolean;
  requiredForCompletion?: boolean;
  minimumAttendancePercentage?: number;
  minAttendancePercentage?: number;
  sessionsCount?: number;
  mode?: string;
}

export interface OfflineOutputsConfig {
  certificateTemplateId?: string | null;
  certificateTemplateName?: string;
  badgeTemplateId?: string | null;
  badgeTemplateName?: string;
  transcriptEnabled: boolean;
}

export interface OfflineSessionMeta {
  sessionDate?: string; // DD/MM/YYYY
  startTime?: string;
  durationMinutes?: number;
  cohortName?: string;
}

export interface OfflineTraining {
  id: string;
  trainingId?: string;
  code: string;
  title: string;
  description: string;
  categoryTags: string[];
  category?: string;
  deliveryMode?: string;
  targetAudience?: string;
  durationHours?: number;
  durationDays?: number;
  sessionMeta?: OfflineSessionMeta;
  
  // Venue & Room reference (BRD §4.11 / Spec §4.1)
  venueId: string;
  venueName?: string;
  roomId: string;
  roomName?: string;
  roomCapacityAtTagging: number;
  maxCapacity?: number;

  // Trainer (Instructor Person Pool) & Overrides (Spec §4.4)
  defaultTrainerId: string;
  defaultTrainerName?: string;
  defaultTrainerAvatar?: string;
  defaultTrainerEmail?: string;
  coTrainerIds?: string[];
  coTrainers?: any[];
  primaryTrainerId?: string;
  primaryTrainerName?: string;
  primaryTrainerEmail?: string;

  // Reusable Content Items (Spec §5)
  content: OfflineContentItem[];
  reusableMaterials?: any[];

  // 3 Assessment Modes (Spec §6)
  assessments: OfflineAssessmentItem[];
  assessmentMode?: string;
  referenceAssessmentId?: string;
  referenceAssessmentTitle?: string;
  manualMarksConfig?: any;

  // Attendance (Spec §7)
  attendance: OfflineAttendanceConfig;
  attendanceConfig?: any;

  // Outputs (Spec §8)
  outputs: OfflineOutputsConfig;
  linkedCertificateTemplateId?: string;
  completionRule: OfflineCompletionRule;
  skillIds?: string[];

  // Lifecycle
  status: OfflineTrainingStatus;
  version: number;
  usedInCount?: number; // Count of Course, Phase, or Plan embeddings
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OfflineTrainingEmbedding {
  embeddingId: string;
  offlineTrainingId: string;
  offlineTrainingVersion: number;
  hostType: 'course' | 'phase' | 'plan';
  hostEntityType?: string;
  hostId: string;
  hostEntityId?: string;
  hostTitle: string;
  hostEntityTitle?: string;
  effectiveTrainerId: string;
  effectiveTrainerName: string;
  effectiveTrainerEmail?: string;
  effectiveTrainerAvatar?: string;
  trainerOverridden: boolean; // Flagged true if phaser/course owner changed the trainer
  customTrainerOverride?: boolean;
  customSessionDate?: string;
  customSessionTime?: string;
  embeddedBy: string;
  embeddedAt: string;
}

export interface OfflineManualMarkEntry {
  assessmentRef: string; // e.g. "manual:Practical Demonstration Rubric"
  mark: number;
  maxMark: number;
  remark?: string;
  enteredBy: string;
  enteredAt: string;
}

export interface OfflineTraineeResult {
  traineeId: string;
  resultId?: string;
  traineeName: string;
  traineeEmail: string;
  traineeAvatar?: string;
  embeddingId: string;
  offlineTrainingId: string;
  manualMarks: OfflineManualMarkEntry[];
  manualMarkScore?: number;
  attendancePercentage?: number;
  instructorRemarks?: string;
  finalOverallScore?: number;
  passStatus?: string;
  attendance: {
    status: AttendanceStatus;
    markedBy: string;
    markedAt: string;
    remarks?: string;
  };
  onlineAssessmentPassed?: boolean;
  onlineScore?: number;
  overallScore?: number;
  completed: boolean;
  passed: boolean;
  updatedAt: string;
}

export interface OfflineTrainingPermissions {
  canViewFeature: boolean;
  canCreate?: boolean;
  canCreateOfflineTraining: boolean;
  canEditOfflineTraining: boolean;
  canPublishOfflineTraining: boolean;
  canDeactivateOfflineTraining: boolean;
  canEmbedInLearning: boolean;
  canOverrideTrainer: boolean;
  canEnterManualMarks: boolean;
  canRecordAttendance: boolean;
  canManageDashboardStudio: boolean;
}

export const DEFAULT_OFFLINE_TRAINING_PERMISSIONS: OfflineTrainingPermissions = {
  canViewFeature: true,
  canCreateOfflineTraining: true,
  canEditOfflineTraining: true,
  canPublishOfflineTraining: true,
  canDeactivateOfflineTraining: true,
  canEmbedInLearning: true,
  canOverrideTrainer: true,
  canEnterManualMarks: true,
  canRecordAttendance: true,
  canManageDashboardStudio: true
};

export const INITIAL_OFFLINE_TRAININGS: OfflineTraining[] = [
  {
    id: 'off-001',
    code: 'OFL-FIRST-AID-2026',
    title: 'Advanced Tactical First-Aid & Emergency Response Workshop',
    description: 'In-person simulation workshop covering triage protocol, CPR certification, automated external defibrillator (AED) operation, and practical field trauma management.',
    categoryTags: ['Emergency Response', 'Occupational Safety', 'Field Operations', 'Healthcare'],
    sessionMeta: {
      sessionDate: '28/03/2026',
      startTime: '09:00 AM',
      durationMinutes: 240,
      cohortName: 'Q1 Field Operations Batch'
    },
    venueId: 'venue-001',
    venueName: 'Dhaka Executive Learning Center',
    roomId: 'room-101',
    roomName: 'Hall A (Grand Auditorium)',
    roomCapacityAtTagging: 65,
    defaultTrainerId: 'inst-01',
    defaultTrainerName: 'Dr. Tanvir Hossain',
    defaultTrainerEmail: 'tanvir.hossain@grameenphone.com',
    defaultTrainerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: [
      {
        contentId: 'c-01',
        source: 'repository',
        family: 'learning',
        subtype: 'document',
        title: 'Trauma Care & Triage Handbook (PDF Standard)',
        urlOrRef: 'https://assets.onelms.enterprise/docs/first-aid-triage-2026.pdf',
        fileSizeOrDuration: '4.8 MB',
        isRequired: true
      },
      {
        contentId: 'c-02',
        source: 'new',
        family: 'learning',
        subtype: 'video',
        title: 'AED Device Deployment & Rhythm Analysis Demo',
        urlOrRef: 'https://assets.onelms.enterprise/videos/aed-deployment.mp4',
        fileSizeOrDuration: '12 mins',
        isRequired: false
      }
    ],
    assessments: [
      {
        id: 'asm-off-01',
        mode: 'reference',
        assessmentId: 'asm-001',
        assessmentTitle: 'Workplace Safety & Ergonomics Knowledge Check',
        assessmentVersionId: 'v1.0',
        weightagePercent: 40
      },
      {
        id: 'asm-off-02',
        mode: 'manual',
        label: 'Practical Trauma & CPR Mannequin Exam',
        maxMarks: 100,
        passMarkPercent: 70,
        passingScore: 70,
        weightagePercent: 60
      }
    ],
    attendance: {
      required: true,
      requiredForCompletion: true,
      minimumAttendancePercentage: 100
    },
    outputs: {
      certificateTemplateId: 'cert-001',
      certificateTemplateName: 'Executive Milestone Certificate',
      badgeTemplateId: 'badge-001',
      badgeTemplateName: 'Compliance Master Credential',
      transcriptEnabled: true
    },
    completionRule: 'attended_and_passed',
    skillIds: ['skill-01', 'skill-02'],
    status: 'published',
    version: 1,
    usedInCount: 3,
    createdBy: 'Chief Medical & Safety Officer',
    createdAt: '12/01/2026 10:15:00',
    updatedAt: '15/02/2026 16:30:00'
  },
  {
    id: 'off-002',
    code: 'OFL-DATA-LAB-2026',
    title: 'Executive Cloud Architecture & SQL Performance Masterclass',
    description: 'Hands-on laboratory training exploring Postgres query tuning, database indexing strategies, scale-to-zero serverless deployment, and high-availability clustering.',
    categoryTags: ['Cloud Architecture', 'Database Tuning', 'DevOps', 'Software Engineering'],
    sessionMeta: {
      sessionDate: '05/04/2026',
      startTime: '10:00 AM',
      durationMinutes: 180,
      cohortName: 'Senior Engineering Cohort'
    },
    venueId: 'venue-002',
    venueName: 'Chittagong Coastal Training Institute',
    roomId: 'room-202',
    roomName: 'Karnaphuli Skills Lab',
    roomCapacityAtTagging: 25,
    defaultTrainerId: 'inst-02',
    defaultTrainerName: 'Engr. Sarah Rahman',
    defaultTrainerEmail: 'sarah.rahman@grameenphone.com',
    defaultTrainerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    content: [
      {
        contentId: 'c-03',
        source: 'repository',
        family: 'learning',
        subtype: 'slides',
        title: 'Postgres Indexing & EXPLAIN ANALYZE Deck',
        urlOrRef: 'https://assets.onelms.enterprise/decks/sql-perf-v2.pptx',
        fileSizeOrDuration: '18 Slides',
        isRequired: true
      }
    ],
    assessments: [
      {
        id: 'asm-off-03',
        mode: 'manual',
        label: 'Hands-on Query Optimization Benchmark Rubric',
        maxMarks: 50,
        passMarkPercent: 60,
        passingScore: 30,
        weightagePercent: 100
      }
    ],
    attendance: {
      required: true,
      requiredForCompletion: true,
      minimumAttendancePercentage: 80
    },
    outputs: {
      certificateTemplateId: 'cert-002',
      certificateTemplateName: 'Technical Proficiency Certificate',
      badgeTemplateId: 'badge-002',
      badgeTemplateName: 'Cloud Specialist Badge',
      transcriptEnabled: true
    },
    completionRule: 'attended_and_passed',
    skillIds: ['skill-03'],
    status: 'published',
    version: 1,
    usedInCount: 2,
    createdBy: 'DevOps Lead Architect',
    createdAt: '18/01/2026 14:00:00',
    updatedAt: '02/03/2026 11:20:00'
  },
  {
    id: 'off-003',
    code: 'OFL-NEGOTIATION-2026',
    title: 'High-Stakes Strategic Negotiation & Dispute Resolution Clinic',
    description: 'Intensive peer-to-peer roleplay session evaluating executive negotiation psychology, term-sheet compromise tactics, and live arbitrations.',
    categoryTags: ['Leadership', 'Negotiation', 'Executive Soft Skills', 'Conflict Resolution'],
    sessionMeta: {
      sessionDate: '15/04/2026',
      startTime: '01:30 PM',
      durationMinutes: 210,
      cohortName: 'Enterprise Leadership Fellows'
    },
    venueId: 'venue-001',
    venueName: 'Dhaka Executive Learning Center',
    roomId: 'room-103',
    roomName: 'Room 202 (Executive Boardroom)',
    roomCapacityAtTagging: 20,
    defaultTrainerId: 'inst-03',
    defaultTrainerName: 'Prof. Anisul Haque',
    defaultTrainerEmail: 'anisul.haque@grameenphone.com',
    defaultTrainerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: [
      {
        contentId: 'c-04',
        source: 'new',
        family: 'learning',
        subtype: 'reading',
        title: 'Harvard Program on Negotiation Case Briefs',
        urlOrRef: 'https://assets.onelms.enterprise/readings/pon-cases.pdf',
        fileSizeOrDuration: '15 Pages',
        isRequired: true
      }
    ],
    assessments: [
      {
        id: 'asm-off-04',
        mode: 'manual',
        label: 'Live Roleplay Performance Assessment',
        maxMarks: 100,
        passMarkPercent: 75,
        passingScore: 75,
        weightagePercent: 100
      }
    ],
    attendance: {
      required: true,
      requiredForCompletion: true
    },
    outputs: {
      certificateTemplateId: 'cert-001',
      certificateTemplateName: 'Executive Milestone Certificate',
      badgeTemplateId: null,
      transcriptEnabled: true
    },
    completionRule: 'attended_and_passed',
    status: 'draft',
    version: 1,
    usedInCount: 0,
    createdBy: 'Executive Education Board',
    createdAt: '01/02/2026 15:45:00',
    updatedAt: '01/02/2026 15:45:00'
  }
];

export const INITIAL_OFFLINE_TRAINING_EMBEDDINGS: OfflineTrainingEmbedding[] = [
  {
    embeddingId: 'embed-001',
    offlineTrainingId: 'off-001',
    offlineTrainingVersion: 1,
    hostType: 'phase',
    hostId: 'phase-01',
    hostTitle: 'Foundation Phase: Safety & Operational Protocols',
    effectiveTrainerId: 'inst-01',
    effectiveTrainerName: 'Dr. Tanvir Hossain',
    effectiveTrainerEmail: 'tanvir.hossain@grameenphone.com',
    effectiveTrainerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    trainerOverridden: false,
    customSessionDate: '28/03/2026',
    customSessionTime: '09:00 AM',
    embeddedBy: 'Plan Academic Lead',
    embeddedAt: '15/01/2026 11:30:00'
  },
  {
    embeddingId: 'embed-002',
    offlineTrainingId: 'off-001',
    offlineTrainingVersion: 1,
    hostType: 'phase',
    hostId: 'phase-02',
    hostTitle: 'Regional Field Preparedness Phase',
    effectiveTrainerId: 'inst-02', // Overridden trainer for this specific cohort!
    effectiveTrainerName: 'Engr. Sarah Rahman',
    effectiveTrainerEmail: 'sarah.rahman@grameenphone.com',
    effectiveTrainerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    trainerOverridden: true,
    customSessionDate: '02/04/2026',
    customSessionTime: '10:00 AM',
    embeddedBy: 'Regional Phaser Lead',
    embeddedAt: '20/01/2026 14:00:00'
  }
];

export const INITIAL_OFFLINE_TRAINEE_RESULTS: OfflineTraineeResult[] = [
  {
    traineeId: 'usr-101',
    traineeName: 'Shakil Ahmed',
    traineeEmail: 'shakil.ahmed@grameenphone.com',
    traineeAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    embeddingId: 'embed-001',
    offlineTrainingId: 'off-001',
    manualMarks: [
      {
        assessmentRef: 'manual:Practical Trauma & CPR Mannequin Exam',
        mark: 88,
        maxMark: 100,
        remark: 'Excellent chest compression tempo and accurate AED paddle placement.',
        enteredBy: 'Dr. Tanvir Hossain',
        enteredAt: '28/03/2026 14:00:00'
      }
    ],
    attendance: {
      status: 'present',
      markedBy: 'Dr. Tanvir Hossain',
      markedAt: '28/03/2026 09:05:00'
    },
    onlineAssessmentPassed: true,
    onlineScore: 92,
    overallScore: 90,
    completed: true,
    passed: true,
    updatedAt: '28/03/2026 14:30:00'
  },
  {
    traineeId: 'usr-102',
    traineeName: 'Rashedul Karim',
    traineeEmail: 'rashedul.karim@grameenphone.com',
    traineeAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    embeddingId: 'embed-001',
    offlineTrainingId: 'off-001',
    manualMarks: [
      {
        assessmentRef: 'manual:Practical Trauma & CPR Mannequin Exam',
        mark: 74,
        maxMark: 100,
        remark: 'Satisfactory bandage wrapping; needs minor review on triage color tagging.',
        enteredBy: 'Dr. Tanvir Hossain',
        enteredAt: '28/03/2026 14:15:00'
      }
    ],
    attendance: {
      status: 'present',
      markedBy: 'Dr. Tanvir Hossain',
      markedAt: '28/03/2026 09:10:00'
    },
    onlineAssessmentPassed: true,
    onlineScore: 80,
    overallScore: 77,
    completed: true,
    passed: true,
    updatedAt: '28/03/2026 14:30:00'
  },
  {
    traineeId: 'usr-103',
    traineeName: 'Mahmuda Akter',
    traineeEmail: 'mahmuda.akter@grameenphone.com',
    traineeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    embeddingId: 'embed-001',
    offlineTrainingId: 'off-001',
    manualMarks: [
      {
        assessmentRef: 'manual:Practical Trauma & CPR Mannequin Exam',
        mark: 95,
        maxMark: 100,
        remark: 'Flawless execution of emergency airway stabilization.',
        enteredBy: 'Dr. Tanvir Hossain',
        enteredAt: '28/03/2026 14:20:00'
      }
    ],
    attendance: {
      status: 'present',
      markedBy: 'Dr. Tanvir Hossain',
      markedAt: '28/03/2026 09:00:00'
    },
    onlineAssessmentPassed: true,
    onlineScore: 98,
    overallScore: 96,
    completed: true,
    passed: true,
    updatedAt: '28/03/2026 14:30:00'
  },
  {
    traineeId: 'usr-104',
    traineeName: 'Kamrul Hassan',
    traineeEmail: 'kamrul.hassan@grameenphone.com',
    traineeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    embeddingId: 'embed-001',
    offlineTrainingId: 'off-001',
    manualMarks: [],
    attendance: {
      status: 'absent',
      markedBy: 'Dr. Tanvir Hossain',
      markedAt: '28/03/2026 09:30:00',
      remarks: 'Excused medical absence'
    },
    onlineAssessmentPassed: false,
    completed: false,
    passed: false,
    updatedAt: '28/03/2026 14:30:00'
  }
];
