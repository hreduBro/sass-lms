export type AssessmentType = 'exam' | 'quiz' | 'assignment' | 'survey' | 'diagnostic';
export type AssessmentScoringMode = 'scored' | 'unscored';
export type AssessmentStatus = 'draft' | 'published' | 'inactive' | 'archived';
export type AssessmentVersionState = 'draft' | 'published-current' | 'published-superseded' | 'archived';

export type AssessmentQuestionType =
  | 'text'
  | 'singleSelect'
  | 'multiSelect'
  | 'trueFalse'
  | 'numeric'
  | 'matching'
  | 'ordering'
  | 'fillBlank'
  | 'fileUpload'
  | 'essay';

export type MultiSelectCreditRule = 'allOrNothing' | 'partial';
export type ScoreRetentionRule = 'highest' | 'latest' | 'average' | 'first';
export type ResultDisplayTrigger = 'afterSubmit' | 'afterGrading' | 'afterWindowClose' | 'never';
export type ManualGradingStatus = 'notRequired' | 'pending' | 'graded';

export interface AssessmentQuestionOption {
  optionId: string;
  text: string;
  correct?: boolean;
  isCorrect?: boolean;
  feedback?: string;
  order?: number;
}

export interface MatchingPair {
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
  pairId?: string;
  leftItem?: string;
  rightItem?: string;
}

export interface AssessmentQuestion {
  questionId: string;
  type: AssessmentQuestionType;
  text: string;
  prompt?: string;
  required: boolean;
  points: number;
  options?: AssessmentQuestionOption[];
  matchingPairs?: MatchingPair[];
  correctSequence?: string[]; // Item IDs or texts in correct order for ordering
  numericAnswer?: { targetValue: number; tolerance?: number };
  acceptedBlankAnswers?: string[]; // Accepted case-insensitive string answers
  placeholder?: string;
  explanation?: string;
  manualGraded: boolean;
  order: number;
  multiSelectScoring?: MultiSelectCreditRule;
  numericTarget?: number;
  numericTolerance?: number;
  orderingItems?: string[];
  acceptableBlanks?: string[];
  scoringRule?: {
    multiSelect?: MultiSelectCreditRule;
  };
}

export interface AssessmentScoringPolicy {
  totalMarks: number;
  passMarkPercent: number; // e.g., 60
  negativeMarking: {
    enabled: boolean;
    penalty: number; // points deducted for wrong auto answers
  };
  attempts: {
    allowed: number; // 0 = unlimited, 1 = single attempt, etc.
    keep: ScoreRetentionRule;
  };
  timeLimitMinutes?: number | null; // null = untimed
  availability?: {
    opensAt?: string | null; // DD/MM/YYYY HH:MM
    closesAt?: string | null;
  };
  resultDisplay: {
    showScore: ResultDisplayTrigger;
    showCorrect: boolean;
    showFeedback: boolean;
  };
}

export interface AssessmentVersion {
  versionId: string;
  assessmentId: string;
  versionLabel: string; // 'v1', 'v2'
  state: AssessmentVersionState;
  questions: AssessmentQuestion[];
  scoringPolicy: AssessmentScoringPolicy;
  publishedAt?: string;
  publishedBy?: string;
  changeSummary?: string;
  responseCount: number;
}

export interface UsedInReference {
  type: 'course' | 'plan' | 'standalone';
  id: string;
  title: string;
}

export interface Assessment {
  assessmentId: string;
  code: string;
  title: string;
  description?: string;
  type: AssessmentType;
  categoryTags: string[];
  scoringMode: AssessmentScoringMode;
  currentVersionId: string;
  status: AssessmentStatus;
  responsibleInstructorId?: string;
  responsibleInstructorName?: string;
  sharingLevel: 'private' | 'lms' | 'org';
  usedInCount: number;
  usedInReferences?: UsedInReference[];
  versions: AssessmentVersion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentAttemptAnswer {
  questionId: string;
  type?: AssessmentQuestionType;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textResponse?: string;
  fileRef?: { name: string; url: string; sizeBytes: number };
  numericValue?: number;
  numericResponse?: number;
  matchedPairs?: { leftId: string; rightId: string }[];
  matchingSelections?: Record<string, string>;
  orderedSequence?: string[];
  isCorrect?: boolean;
  earnedPoints?: number;
  maxPoints?: number;
  instructorFeedback?: string;
}

export type LearnerQuestionAnswer = AssessmentAttemptAnswer;

export interface AssessmentAttempt {
  attemptId: string;
  assessmentId: string;
  assessmentVersionId: string;
  versionLabel: string;
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  traineeAvatar?: string;
  attemptNumber: number;
  answers: AssessmentAttemptAnswer[];
  autoScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  manualGradingStatus: ManualGradingStatus;
  submittedAt: string; // DD/MM/YYYY HH:MM:SS
  gradedBy?: string;
  gradedAt?: string;
  timeTakenSeconds?: number;
}

export interface AssessmentPermissions {
  canViewFeature: boolean;
  canCreateAssessment: boolean;
  canEditAssessment: boolean;
  canPublishAssessment: boolean;
  canVersionAssessment: boolean;
  canDeactivateAssessment: boolean;
  canConfigureScoringDefaults: boolean;
  canManualGrade: boolean;
  canViewResults: boolean;
  canExportResults: boolean;
  canManageDashboardStudio: boolean;
}

// -------------------------------------------------------------
// DASHBOARD STUDIO MODEL FOR ASSESSMENTS
// -------------------------------------------------------------

export type AssessmentDashboardWidgetType =
  | 'kpi_summary'
  | 'type_distribution'
  | 'publish_blockers'
  | 'pass_rate_trend'
  | 'recent_activity'
  | 'top_attempted_exams'
  | 'score_distribution';

export interface AssessmentDashboardWidget {
  id: string;
  type: AssessmentDashboardWidgetType;
  title: string;
  description: string;
  visible: boolean;
  columnSpan: 25 | 50 | 75 | 100;
  order: number;
}

export interface AssessmentDashboardLayout {
  layoutId: string;
  presetName: string;
  updatedAt: string;
  widgets: AssessmentDashboardWidget[];
}

export const DEFAULT_ASSESSMENT_DASHBOARD_LAYOUT: AssessmentDashboardLayout = {
  layoutId: 'default-assessment-layout',
  presetName: 'Overview Studio',
  updatedAt: '31/08/2026',
  widgets: [
    {
      id: 'w-kpi-summary',
      type: 'kpi_summary',
      title: 'Assessment Repository KPIs',
      description: 'Total, published, draft, and manual-graded assessment counts',
      visible: true,
      columnSpan: 100,
      order: 1
    },
    {
      id: 'w-publish-blockers',
      type: 'publish_blockers',
      title: 'Governance & Publish Blockers',
      description: 'Assessments containing manual questions missing responsible instructors',
      visible: true,
      columnSpan: 50,
      order: 2
    },
    {
      id: 'w-type-distribution',
      type: 'type_distribution',
      title: 'Assessment Types Breakdown',
      description: 'Split between Exams, Quizzes, Assignments, Surveys, and Diagnostics',
      visible: true,
      columnSpan: 50,
      order: 3
    },
    {
      id: 'w-pass-rate-trend',
      type: 'pass_rate_trend',
      title: 'Pass Rate & Qualification Metrics',
      description: 'Average scores and qualification ratios across published exams',
      visible: true,
      columnSpan: 50,
      order: 4
    },
    {
      id: 'w-top-attempted',
      type: 'top_attempted_exams',
      title: 'Top Referenced & Attempted Exams',
      description: 'Most frequently assigned and completed assessments across plans & courses',
      visible: true,
      columnSpan: 50,
      order: 5
    },
    {
      id: 'w-recent-activity',
      type: 'recent_activity',
      title: 'Recent Assessment Activity Feed',
      description: 'Audit log of publishes, edits, attempts, and manual grade recordings',
      visible: true,
      columnSpan: 100,
      order: 6
    }
  ]
};

// -------------------------------------------------------------
// INITIAL MOCK ASSESSMENTS
// -------------------------------------------------------------

export const INITIAL_ASSESSMENTS: Assessment[] = [
  {
    assessmentId: 'asm-brac-01',
    code: 'EXAM-SEC-2026',
    title: 'Microfinance Field Ethics, Client Protection & POS Operations Final Exam',
    description: 'Comprehensive exam evaluating Smart Campaign standards, tablet POS offline synchronization, and disaster relief protocol ethics.',
    type: 'exam',
    categoryTags: ['Field Credit Operations', 'Client Protection', 'Digital Systems'],
    scoringMode: 'scored',
    currentVersionId: 'asm-ver-01-v2',
    status: 'published',
    responsibleInstructorId: 'usr-brac-01',
    responsibleInstructorName: 'Tanvir Hossain',
    sharingLevel: 'lms',
    usedInCount: 3,
    usedInReferences: [
      { type: 'course', id: 'course-brac-101', title: 'BRAC Microfinance Operations & Client Protection Principles (2026)' },
      { type: 'plan', id: 'plan-brac-01', title: '2026 Microfinance Branch Transformation & Ethics Plan' },
      { type: 'standalone', id: 'standalone-batch-01', title: 'Q3 Direct Field Officer Certification Cohort' }
    ],
    createdBy: 'Farhana Ahmed',
    createdAt: '10/01/2026',
    updatedAt: '18/02/2026',
    versions: [
      {
        versionId: 'asm-ver-01-v1',
        assessmentId: 'asm-brac-01',
        versionLabel: 'v1',
        state: 'published-superseded',
        publishedAt: '10/01/2026 09:30:00',
        publishedBy: 'Farhana Ahmed',
        changeSummary: 'Baseline version featuring 4 foundational questions.',
        responseCount: 18,
        scoringPolicy: {
          totalMarks: 10,
          passMarkPercent: 60,
          negativeMarking: { enabled: false, penalty: 0 },
          attempts: { allowed: 2, keep: 'highest' },
          timeLimitMinutes: 45,
          availability: { opensAt: '01/01/2026 00:00', closesAt: '31/12/2026 23:59' },
          resultDisplay: { showScore: 'afterSubmit', showCorrect: true, showFeedback: true }
        },
        questions: [
          {
            questionId: 'q1',
            type: 'singleSelect',
            text: 'Under the Smart Campaign Client Protection Standards, what is the maximum permissible annual effective interest rate disclosure format?',
            required: true,
            points: 2,
            order: 1,
            manualGraded: false,
            options: [
              { optionId: 'o1', text: 'All-inclusive Annual Percentage Rate (APR) including processing fees and insurance', correct: true },
              { optionId: 'o2', text: 'Flat monthly nominal rate without processing fees', correct: false },
              { optionId: 'o3', text: 'Declining balance rate excluding compulsory group emergency funds', correct: false },
              { optionId: 'o4', text: 'Verbally communicated estimated weekly repayment amount', correct: false }
            ],
            explanation: 'Smart Campaign mandates full transparent disclosure of APR incorporating all compulsory add-on charges.'
          },
          {
            questionId: 'q2',
            type: 'multiSelect',
            text: 'Which of the following actions violate client safeguarding protocols during Village Organization weekly collections? (Select all that apply)',
            required: true,
            points: 3,
            order: 2,
            manualGraded: false,
            scoringRule: { multiSelect: 'allOrNothing' },
            options: [
              { optionId: 'o1', text: 'Collecting repayments at a borrower\'s residence after 8:00 PM without consent', correct: true },
              { optionId: 'o2', text: 'Retaining a borrower\'s original National ID card as collateral security', correct: true },
              { optionId: 'o3', text: 'Issuing a verified digital receipt via SMS/Tablet POS immediately upon cash handover', correct: false },
              { optionId: 'o4', text: 'Publicly announcing overdue balances during group congregation', correct: true }
            ],
            explanation: 'Night visits, document retention, and public shaming are severe violations of client protection ethics.'
          },
          {
            questionId: 'q3',
            type: 'singleSelect',
            text: 'When a Biometric Tablet POS loses cellular connectivity during village disbursement, what is the immediate required protocol?',
            required: true,
            points: 2,
            order: 3,
            manualGraded: false,
            options: [
              { optionId: 'o1', text: 'Capture local offline biometric hash, record physical Form 04B, and sync at branch', correct: true },
              { optionId: 'o2', text: 'Halt all disbursements until 4G signal is restored', correct: false },
              { optionId: 'o3', text: 'Bypass biometric check and disburse purely on borrower oral acknowledgement', correct: false }
            ],
            explanation: 'Offline buffer with dual-entry Form 04B reconciliation ensures both security and uninterrupted client service.'
          },
          {
            questionId: 'q4',
            type: 'essay',
            text: 'Describe the three key indicator flags that indicate borrower over-indebtedness risk during loan appraisal.',
            required: false,
            points: 3,
            order: 4,
            manualGraded: true,
            placeholder: 'Detail cash flow ratio, multiple MFI memberships, and utility payment delays...'
          }
        ]
      },
      {
        versionId: 'asm-ver-01-v2',
        assessmentId: 'asm-brac-01',
        versionLabel: 'v2',
        state: 'published-current',
        publishedAt: '18/02/2026 11:00:00',
        publishedBy: 'Tanvir Hossain',
        changeSummary: 'Added True/False and Matching questions for enhanced tablet & flood compliance evaluation.',
        responseCount: 14,
        scoringPolicy: {
          totalMarks: 15,
          passMarkPercent: 60,
          negativeMarking: { enabled: false, penalty: 0 },
          attempts: { allowed: 2, keep: 'highest' },
          timeLimitMinutes: 60,
          availability: { opensAt: '01/01/2026 00:00', closesAt: '31/12/2026 23:59' },
          resultDisplay: { showScore: 'afterGrading', showCorrect: true, showFeedback: true }
        },
        questions: [
          {
            questionId: 'q1',
            type: 'singleSelect',
            text: 'Under the Smart Campaign Client Protection Standards, what is the maximum permissible annual effective interest rate disclosure format?',
            required: true,
            points: 2,
            order: 1,
            manualGraded: false,
            options: [
              { optionId: 'o1', text: 'All-inclusive Annual Percentage Rate (APR) including processing fees and insurance', correct: true },
              { optionId: 'o2', text: 'Flat monthly nominal rate without processing fees', correct: false },
              { optionId: 'o3', text: 'Declining balance rate excluding compulsory group emergency funds', correct: false },
              { optionId: 'o4', text: 'Verbally communicated estimated weekly repayment amount', correct: false }
            ],
            explanation: 'Smart Campaign mandates full transparent disclosure of APR incorporating all compulsory add-on charges.'
          },
          {
            questionId: 'q2',
            type: 'multiSelect',
            text: 'Which of the following actions violate client safeguarding protocols during Village Organization weekly collections? (Select all that apply)',
            required: true,
            points: 3,
            order: 2,
            manualGraded: false,
            scoringRule: { multiSelect: 'allOrNothing' },
            options: [
              { optionId: 'o1', text: 'Collecting repayments at a borrower\'s residence after 8:00 PM without consent', correct: true },
              { optionId: 'o2', text: 'Retaining a borrower\'s original National ID card as collateral security', correct: true },
              { optionId: 'o3', text: 'Issuing a verified digital receipt via SMS/Tablet POS immediately upon cash handover', correct: false },
              { optionId: 'o4', text: 'Publicly announcing overdue balances during group congregation', correct: true }
            ],
            explanation: 'Night visits, document retention, and public shaming are severe violations of client protection ethics.'
          },
          {
            questionId: 'q3',
            type: 'trueFalse',
            text: 'Is it mandatory for branch personnel to obtain supervisor override clearance prior to manual sync override in low-network offline mode?',
            required: true,
            points: 2,
            order: 3,
            manualGraded: false,
            options: [
              { optionId: 'tf-true', text: 'True', correct: true },
              { optionId: 'tf-false', text: 'False', correct: false }
            ],
            explanation: 'Supervisor PIN override is strictly required to authorize offline reconciliation.'
          },
          {
            questionId: 'q4',
            type: 'matching',
            text: 'Match each operational incident with its corresponding response protocol.',
            required: true,
            points: 4,
            order: 4,
            manualGraded: false,
            matchingPairs: [
              { leftId: 'l1', leftText: 'Cellular 4G Network Drop', rightId: 'r1', rightText: 'Capture Offline Biometric Hash + Form 04B' },
              { leftId: 'l2', leftText: 'Flash Flood Declaration', rightId: 'r2', rightText: 'Trigger 72-hr Emergency Micro-Insurance Claim' },
              { leftId: 'l3', leftText: 'Client Over-indebtedness Flag', rightId: 'r3', rightText: 'Conduct Restructuring Appraisal & Multi-MFI Audit' },
              { leftId: 'l4', leftText: 'Device Clock Drift Error', rightId: 'r4', rightText: 'Re-sync NTP Server Timestamp via Branch LAN' }
            ]
          },
          {
            questionId: 'q5',
            type: 'essay',
            text: 'Provide a detailed case analysis of handling a borrower grievance regarding loan processing transparency in a rural village organization.',
            required: true,
            points: 4,
            order: 5,
            manualGraded: true,
            placeholder: 'Explain de-escalation steps, record checks, and resolution documentation...'
          }
        ]
      }
    ]
  },
  {
    assessmentId: 'asm-brac-02',
    code: 'QUIZ-GRAD-02',
    title: 'Ultra-Poor Graduation Model: Household Targeting & Scorecard Diagnostic',
    description: 'Targeted assessment evaluating participatory rural appraisal, wealth ranking methodologies, and asset transfer monitoring.',
    type: 'quiz',
    categoryTags: ['Poverty Graduation Programs', 'Household Targeting'],
    scoringMode: 'scored',
    currentVersionId: 'asm-ver-02-v1',
    status: 'published',
    responsibleInstructorId: 'usr-brac-admin',
    responsibleInstructorName: 'Farhana Ahmed',
    sharingLevel: 'lms',
    usedInCount: 1,
    usedInReferences: [
      { type: 'plan', id: 'plan-brac-02', title: 'Ultra-Poor Graduation & Sustainable Livelihoods Program' }
    ],
    createdBy: 'Dr. Imran Matin',
    createdAt: '20/01/2026',
    updatedAt: '20/01/2026',
    versions: [
      {
        versionId: 'asm-ver-02-v1',
        assessmentId: 'asm-brac-02',
        versionLabel: 'v1',
        state: 'published-current',
        publishedAt: '20/01/2026 14:00:00',
        publishedBy: 'Dr. Imran Matin',
        changeSummary: 'Initial release of household targeting quiz.',
        responseCount: 12,
        scoringPolicy: {
          totalMarks: 10,
          passMarkPercent: 70,
          negativeMarking: { enabled: false, penalty: 0 },
          attempts: { allowed: 3, keep: 'highest' },
          timeLimitMinutes: 30,
          availability: { opensAt: null, closesAt: null },
          resultDisplay: { showScore: 'afterSubmit', showCorrect: true, showFeedback: true }
        },
        questions: [
          {
            questionId: 'up1',
            type: 'singleSelect',
            text: 'In the Ultra-Poor Graduation targeting funnel, which step follows Community Wealth Ranking?',
            required: true,
            points: 5,
            order: 1,
            manualGraded: false,
            options: [
              { optionId: 'u1', text: 'Primary Household Survey & Poverty Scorecard Verification', correct: true },
              { optionId: 'u2', text: 'Immediate Livelihood Asset Transfer', correct: false },
              { optionId: 'u3', text: 'Credit Bureau Bureaucratic Cross-Check', correct: false }
            ]
          },
          {
            questionId: 'up2',
            type: 'multiSelect',
            text: 'Which of the following are mandatory inclusion criteria for Ultra-Poor Asset Grant eligibility? (Select all that apply)',
            required: true,
            points: 5,
            order: 2,
            manualGraded: false,
            scoringRule: { multiSelect: 'allOrNothing' },
            options: [
              { optionId: 'crit1', text: 'Female-headed household with active working-age labor capacity', correct: true },
              { optionId: 'crit2', text: 'Total land ownership under 10 decimals (including homestead)', correct: true },
              { optionId: 'crit3', text: 'Existing commercial micro-credit debt above BDT 50,000', correct: false },
              { optionId: 'crit4', text: 'No productive asset ownership generating regular income', correct: true }
            ]
          }
        ]
      }
    ]
  },
  {
    assessmentId: 'asm-brac-03',
    code: 'ASSIGN-RISK-2026',
    title: 'Branch Risk Audit & Climate Emergency Preparedness Portfolio Assignment',
    description: 'Practical assignment submission evaluating branch vulnerability mapping, disaster reserve funds allocation, and emergency credit lines.',
    type: 'assignment',
    categoryTags: ['Leadership & Risk', 'Disaster Relief'],
    scoringMode: 'scored',
    currentVersionId: 'asm-ver-03-v1',
    status: 'published',
    responsibleInstructorId: 'usr-brac-01',
    responsibleInstructorName: 'Tanvir Hossain',
    sharingLevel: 'lms',
    usedInCount: 1,
    usedInReferences: [
      { type: 'course', id: 'course-brac-102', title: 'Branch Risk Leadership & Climate Adaptation' }
    ],
    createdBy: 'Tanvir Hossain',
    createdAt: '05/02/2026',
    updatedAt: '05/02/2026',
    versions: [
      {
        versionId: 'asm-ver-03-v1',
        assessmentId: 'asm-brac-03',
        versionLabel: 'v1',
        state: 'published-current',
        publishedAt: '05/02/2026 10:00:00',
        publishedBy: 'Tanvir Hossain',
        changeSummary: 'Initial release of branch risk assignment.',
        responseCount: 8,
        scoringPolicy: {
          totalMarks: 20,
          passMarkPercent: 60,
          negativeMarking: { enabled: false, penalty: 0 },
          attempts: { allowed: 1, keep: 'highest' },
          timeLimitMinutes: null,
          availability: { opensAt: null, closesAt: null },
          resultDisplay: { showScore: 'afterGrading', showCorrect: false, showFeedback: true }
        },
        questions: [
          {
            questionId: 'asg1',
            type: 'fileUpload',
            text: 'Upload your branch climate vulnerability map and emergency liquidity reserve allocation sheet (.pdf or .docx).',
            required: true,
            points: 10,
            order: 1,
            manualGraded: true,
            placeholder: 'Select or drag & drop portfolio audit file...'
          },
          {
            questionId: 'asg2',
            type: 'essay',
            text: 'Provide an executive summary of your branch de-escalation plan during a major flood emergency.',
            required: true,
            points: 10,
            order: 2,
            manualGraded: true,
            placeholder: 'Detail emergency communications, safe cash transport, and client relief coordination...'
          }
        ]
      }
    ]
  },
  {
    assessmentId: 'asm-brac-04',
    code: 'SURVEY-FEED-01',
    title: 'Digital Banking POS Trainee Onboarding Feedback Survey',
    description: 'Unscored survey collecting qualitative feedback on tablet usability, UI clarity, and training module pacing.',
    type: 'survey',
    categoryTags: ['Digital Systems', 'Training Feedback'],
    scoringMode: 'unscored',
    currentVersionId: 'asm-ver-04-v1',
    status: 'draft',
    sharingLevel: 'private',
    usedInCount: 0,
    createdBy: 'Farhana Ahmed',
    createdAt: '25/02/2026',
    updatedAt: '25/02/2026',
    versions: [
      {
        versionId: 'asm-ver-04-v1',
        assessmentId: 'asm-brac-04',
        versionLabel: 'v1',
        state: 'draft',
        responseCount: 0,
        scoringPolicy: {
          totalMarks: 0,
          passMarkPercent: 0,
          negativeMarking: { enabled: false, penalty: 0 },
          attempts: { allowed: 1, keep: 'first' },
          timeLimitMinutes: null,
          availability: { opensAt: null, closesAt: null },
          resultDisplay: { showScore: 'never', showCorrect: false, showFeedback: false }
        },
        questions: [
          {
            questionId: 's1',
            type: 'singleSelect',
            text: 'How intuitive did you find the Biometric Tablet POS touch interface during field simulations?',
            required: true,
            points: 0,
            order: 1,
            manualGraded: false,
            options: [
              { optionId: 'so1', text: 'Extremely easy & intuitive' },
              { optionId: 'so2', text: 'Moderately clear with minimal training' },
              { optionId: 'so3', text: 'Difficult — required frequent supervisor assistance' }
            ]
          },
          {
            questionId: 's2',
            type: 'text',
            text: 'What specific feature additions would improve offline POS transaction logging?',
            required: false,
            points: 0,
            order: 2,
            manualGraded: false,
            placeholder: 'Share your hardware and interface suggestions...'
          }
        ]
      }
    ]
  }
];

// -------------------------------------------------------------
// INITIAL ATTEMPTS MOCK DATA
// -------------------------------------------------------------

export const INITIAL_ASSESSMENT_ATTEMPTS: AssessmentAttempt[] = [
  {
    attemptId: 'att-brac-101',
    assessmentId: 'asm-brac-01',
    assessmentVersionId: 'asm-ver-01-v2',
    versionLabel: 'v2',
    traineeId: 'usr-brac-10',
    traineeName: 'Kazi Naimur Rahman',
    traineeEmail: 'naimur.rahman@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    attemptNumber: 1,
    autoScore: 11,
    manualScore: 3,
    totalScore: 14,
    maxScore: 15,
    percentage: 93.3,
    passed: true,
    manualGradingStatus: 'graded',
    submittedAt: '20/02/2026 14:10:00',
    gradedBy: 'Tanvir Hossain',
    gradedAt: '21/02/2026 09:30:00',
    timeTakenSeconds: 2150,
    answers: [
      { questionId: 'q1', type: 'singleSelect', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q2', type: 'multiSelect', selectedOptionIds: ['o1', 'o2', 'o4'], isCorrect: true, earnedPoints: 3, maxPoints: 3 },
      { questionId: 'q3', type: 'trueFalse', selectedOptionIds: ['tf-true'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      {
        questionId: 'q4',
        type: 'matching',
        matchedPairs: [
          { leftId: 'l1', rightId: 'r1' },
          { leftId: 'l2', rightId: 'r2' },
          { leftId: 'l3', rightId: 'r3' },
          { leftId: 'l4', rightId: 'r4' }
        ],
        isCorrect: true,
        earnedPoints: 4,
        maxPoints: 4
      },
      {
        questionId: 'q5',
        type: 'essay',
        textResponse: 'Conducted immediate VO group meeting, verified Form 04B cash receipts, and clarified APR processing fees in Bengali.',
        earnedPoints: 3,
        maxPoints: 4,
        instructorFeedback: 'Excellent application of Smart Campaign transparency protocols.'
      }
    ]
  },
  {
    attemptId: 'att-brac-102',
    assessmentId: 'asm-brac-01',
    assessmentVersionId: 'asm-ver-01-v2',
    versionLabel: 'v2',
    traineeId: 'usr-brac-11',
    traineeName: 'Sabina Yasmin',
    traineeEmail: 'sabina.yasmin@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    attemptNumber: 1,
    autoScore: 11,
    manualScore: 0,
    totalScore: 11,
    maxScore: 15,
    percentage: 73.3,
    passed: true,
    manualGradingStatus: 'pending',
    submittedAt: '25/02/2026 11:45:00',
    timeTakenSeconds: 2800,
    answers: [
      { questionId: 'q1', type: 'singleSelect', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q2', type: 'multiSelect', selectedOptionIds: ['o1', 'o2', 'o4'], isCorrect: true, earnedPoints: 3, maxPoints: 3 },
      { questionId: 'q3', type: 'trueFalse', selectedOptionIds: ['tf-true'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      {
        questionId: 'q4',
        type: 'matching',
        matchedPairs: [
          { leftId: 'l1', rightId: 'r1' },
          { leftId: 'l2', rightId: 'r2' },
          { leftId: 'l3', rightId: 'r3' },
          { leftId: 'l4', rightId: 'r4' }
        ],
        isCorrect: true,
        earnedPoints: 4,
        maxPoints: 4
      },
      {
        questionId: 'q5',
        type: 'essay',
        textResponse: 'Reviewed village borrower register and escalated over-indebtedness flag to Branch Accounts Officer.',
        earnedPoints: 0,
        maxPoints: 4
      }
    ]
  },
  {
    attemptId: 'att-brac-103',
    assessmentId: 'asm-brac-02',
    assessmentVersionId: 'asm-ver-02-v1',
    versionLabel: 'v1',
    traineeId: 'usr-brac-12',
    traineeName: 'Mahmudul Hasan',
    traineeEmail: 'mahmudul.hasan@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    attemptNumber: 1,
    autoScore: 10,
    manualScore: 0,
    totalScore: 10,
    maxScore: 10,
    percentage: 100,
    passed: true,
    manualGradingStatus: 'notRequired',
    submittedAt: '22/02/2026 16:30:00',
    timeTakenSeconds: 980,
    answers: [
      { questionId: 'up1', type: 'singleSelect', selectedOptionIds: ['u1'], isCorrect: true, earnedPoints: 5, maxPoints: 5 },
      { questionId: 'up2', type: 'multiSelect', selectedOptionIds: ['crit1', 'crit2', 'crit4'], isCorrect: true, earnedPoints: 5, maxPoints: 5 }
    ]
  }
];

// -------------------------------------------------------------
// SCORING ENGINE UTILITY FUNCTION
// -------------------------------------------------------------

export function calculateAssessmentAttemptScore(
  questions: AssessmentQuestion[],
  policy: AssessmentScoringPolicy,
  answers: AssessmentAttemptAnswer[]
): {
  autoScore: number;
  manualScore: number;
  manualPendingPoints: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  manualGradingStatus: ManualGradingStatus;
  evaluatedAnswers: AssessmentAttemptAnswer[];
} {
  let autoScore = 0;
  let manualScore = 0;
  let manualPendingPoints = 0;
  let maxScore = 0;
  let hasManualQuestions = false;
  let hasPendingManualQuestions = false;

  const evaluatedAnswers: AssessmentAttemptAnswer[] = answers.map(ans => {
    const q = questions.find(item => item.questionId === ans.questionId);
    if (!q) return ans;

    maxScore += q.points;
    let earnedPoints = 0;
    let isCorrect = false;

    if (q.manualGraded) {
      hasManualQuestions = true;
      if (ans.earnedPoints !== undefined && ans.earnedPoints !== null) {
        earnedPoints = ans.earnedPoints;
        manualScore += earnedPoints;
      } else {
        hasPendingManualQuestions = true;
        manualPendingPoints += q.points;
      }
      return {
        ...ans,
        type: q.type,
        earnedPoints,
        maxPoints: q.points
      };
    }

    // Auto-scored questions
    if (q.type === 'singleSelect' || q.type === 'trueFalse') {
      const correctOpt = q.options?.find(o => o.correct);
      if (ans.selectedOptionIds && ans.selectedOptionIds.length === 1 && correctOpt && ans.selectedOptionIds[0] === correctOpt.optionId) {
        isCorrect = true;
        earnedPoints = q.points;
      } else if (policy.negativeMarking.enabled) {
        earnedPoints = -policy.negativeMarking.penalty;
      }
    } else if (q.type === 'multiSelect') {
      const correctOptionIds = q.options?.filter(o => o.correct).map(o => o.optionId) || [];
      const userOptionIds = ans.selectedOptionIds || [];

      if (q.scoringRule?.multiSelect === 'partial') {
        const totalCorrectOpt = correctOptionIds.length;
        if (totalCorrectOpt > 0) {
          let correctHits = 0;
          let wrongHits = 0;
          userOptionIds.forEach(id => {
            if (correctOptionIds.includes(id)) correctHits++;
            else wrongHits++;
          });
          const pointPerHit = q.points / totalCorrectOpt;
          earnedPoints = Math.max(0, (correctHits * pointPerHit) - (wrongHits * pointPerHit));
          isCorrect = correctHits === totalCorrectOpt && wrongHits === 0;
        }
      } else {
        // All-or-nothing
        const matchesAll =
          correctOptionIds.length === userOptionIds.length &&
          correctOptionIds.every(id => userOptionIds.includes(id));
        if (matchesAll) {
          isCorrect = true;
          earnedPoints = q.points;
        } else if (policy.negativeMarking.enabled) {
          earnedPoints = -policy.negativeMarking.penalty;
        }
      }
    } else if (q.type === 'numeric') {
      if (ans.numericValue !== undefined && q.numericAnswer) {
        const target = q.numericAnswer.targetValue;
        const tol = q.numericAnswer.tolerance || 0;
        if (Math.abs(ans.numericValue - target) <= tol) {
          isCorrect = true;
          earnedPoints = q.points;
        }
      }
    } else if (q.type === 'matching') {
      const matchedPairsList = ans.matchedPairs || (ans.matchingSelections ? Object.entries(ans.matchingSelections).map(([l, r]) => ({ leftId: l, rightId: r })) : undefined);
      if (matchedPairsList && q.matchingPairs) {
        let correctMatches = 0;
        q.matchingPairs.forEach(mp => {
          const lKey = mp.leftId || mp.pairId || mp.leftText || mp.leftItem;
          const userMatch = matchedPairsList.find(u => u.leftId === lKey || (mp.leftId && u.leftId === mp.leftId));
          const targetRightId = mp.rightId;
          const targetRightText = mp.rightText || mp.rightItem;
          if (userMatch && (userMatch.rightId === targetRightId || userMatch.rightId === targetRightText)) {
            correctMatches++;
          }
        });
        if (correctMatches === q.matchingPairs.length) {
          isCorrect = true;
          earnedPoints = q.points;
        } else if (correctMatches > 0 && q.matchingPairs.length > 0) {
          earnedPoints = Math.round((correctMatches / q.matchingPairs.length) * q.points * 10) / 10;
        }
      }
    } else if (q.type === 'fillBlank') {
      if (ans.textResponse && q.acceptedBlankAnswers) {
        const cleanedUser = ans.textResponse.trim().toLowerCase();
        const matchesAny = q.acceptedBlankAnswers.some(a => a.trim().toLowerCase() === cleanedUser);
        if (matchesAny) {
          isCorrect = true;
          earnedPoints = q.points;
        }
      }
    } else if (q.type === 'ordering') {
      if (ans.orderedSequence && q.correctSequence) {
        const isSeqCorrect =
          ans.orderedSequence.length === q.correctSequence.length &&
          ans.orderedSequence.every((val, idx) => val === q.correctSequence![idx]);
        if (isSeqCorrect) {
          isCorrect = true;
          earnedPoints = q.points;
        }
      }
    }

    autoScore += Math.max(0, earnedPoints);

    return {
      ...ans,
      type: q.type,
      isCorrect,
      earnedPoints,
      maxPoints: q.points
    };
  });

  const totalScore = autoScore + manualScore;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;
  const passed = policy.passMarkPercent ? percentage >= policy.passMarkPercent : true;

  let manualGradingStatus: ManualGradingStatus = 'notRequired';
  if (hasManualQuestions) {
    manualGradingStatus = hasPendingManualQuestions ? 'pending' : 'graded';
  }

  return {
    autoScore,
    manualScore,
    manualPendingPoints,
    totalScore,
    maxScore,
    percentage,
    passed,
    manualGradingStatus,
    evaluatedAnswers
  };
}
