import { Plan, Phase, PlanComponent, PlanComponentClassSession } from './plan.model';

export type TraineeComponentState =
  | 'Locked'
  | 'Available'
  | 'In progress'
  | 'Submitted'
  | 'Completed'
  | 'Not passed'
  | 'Missed'
  | 'Optional';

export interface TraineeComponentProgress {
  componentId: string;
  state: TraineeComponentState;
  lockReason?: string;
  progressPct: number;
  consumedPct?: number;       // For Content (Video % watched, PDF % read)
  score?: number;             // For Exams
  maxScore?: number;
  passed?: boolean;
  attendedSessions?: string[]; // IDs of attended class sessions
  missedSessions?: string[];   // IDs of missed class sessions
  attemptsUsed?: number;
  completedAt?: string;
  userNotes?: string;
}

export interface TraineeCredential {
  id: string;
  type: 'badge' | 'certificate';
  title: string;
  subtitle?: string;
  planId: string;
  planName: string;
  phaseId?: string;
  phaseName?: string;
  componentId?: string;
  issueDate?: string;
  verificationCode?: string;
  recipientName: string;
  status: 'Earned' | 'Locked';
  imageUrl?: string;
  skills?: string[];
  grade?: string | number;
  signatoryName?: string;
  signatoryTitle?: string;
}

export interface TraineeScheduleItem {
  id: string;
  planId: string;
  planName: string;
  phaseId?: string;
  phaseName?: string;
  componentId: string;
  componentName: string;
  type: 'class_session' | 'exam' | 'phase_window' | 'deadline';
  title: string;
  date: string;          // DD/MM/YYYY
  time?: string;
  duration?: string;
  venue?: string;
  instructor?: string;
  status: 'Upcoming' | 'Attended' | 'Missed' | 'Active' | 'Completed';
  isMandatory: boolean;
  meetingLink?: string;
  room?: string;
}

export interface TraineePersona {
  id: string;
  name: string;
  roleTitle: string;
  avatar: string;
  department: string;
  planEnrollments: {
    planId: string;
    // If undefined or empty array, enrolled in ALL phases of the plan
    // If populated, enrolled ONLY in the specified phase IDs (Scope-Aware trainee)
    scopedPhaseIds?: string[];
    customComponentProgress?: Record<string, Partial<TraineeComponentProgress>>;
  }[];
  description: string;
  tag: string;
}

export const TRAINEE_PERSONAS: TraineePersona[] = [
  {
    id: 'persona-maya',
    name: 'Maya Lin',
    roleTitle: 'Credit Officer Trainee',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    department: 'Microfinance & Field Inclusion',
    tag: 'Full Plan (In Progress)',
    description: 'Enrolled in full 4-phase journey. Phase 1 completed, Phase 2 in progress with upcoming in-person class session.',
    planEnrollments: [
      {
        planId: 'plan-brac-01',
        customComponentProgress: {
          'comp-b1-1': { state: 'Completed', progressPct: 100, completedAt: '12/01/2026' },
          'comp-b1-2': { state: 'Completed', progressPct: 100, consumedPct: 100, completedAt: '25/01/2026' },
          'comp-b1-3': { state: 'Completed', progressPct: 100, score: 90, passed: true, completedAt: '15/02/2026' },
          'comp-b1-4': { state: 'Completed', progressPct: 100, attendedSessions: ['ses-b1-1', 'ses-b1-2'], completedAt: '28/02/2026' },
          'comp-b1-5': { state: 'Completed', progressPct: 100, completedAt: '02/03/2026' },
          'comp-b2-1': { state: 'In progress', progressPct: 60, consumedPct: 60 },
          'comp-b2-2': { state: 'Available', progressPct: 0 },
          'comp-b2-3': { state: 'Locked', progressPct: 0, lockReason: 'Complete preceding interactive module and class session.' },
          'comp-b2-4': { state: 'Locked', progressPct: 0, lockReason: 'Complete preceding components in Phase 2.' },
          'comp-b3-1': { state: 'Locked', progressPct: 0, lockReason: 'Phase 2 must be completed first.' },
          'comp-b3-2': { state: 'Locked', progressPct: 0, lockReason: 'Phase 2 must be completed first.' },
          'comp-b4-1': { state: 'Locked', progressPct: 0, lockReason: 'Phase 3 must be completed first.' },
          'comp-b4-2': { state: 'Locked', progressPct: 0, lockReason: 'Phase 3 must be completed first.' },
          // Backwards-compatible aliases
          'comp-1-1': { state: 'Completed', progressPct: 100 },
          'comp-1-2': { state: 'Completed', progressPct: 100 },
          'comp-1-3': { state: 'Completed', progressPct: 100 },
          'comp-1-4': { state: 'Completed', progressPct: 100, attendedSessions: ['ses-1-1-1'] },
          'comp-1-5': { state: 'In progress', progressPct: 60 }
        }
      },
      {
        planId: 'plan-brac-02',
        customComponentProgress: {
          'comp-u1-1': { state: 'Completed', progressPct: 100, consumedPct: 100, completedAt: '10/02/2026' },
          'comp-u1-2': { state: 'In progress', progressPct: 40, attendedSessions: ['ses-u1-1'] },
          'comp-u1-3': { state: 'Available', progressPct: 0 },
          'comp-u2-1': { state: 'Locked', progressPct: 0, lockReason: 'Complete Phase 1 certification test first.' },
          'comp-u2-2': { state: 'Locked', progressPct: 0, lockReason: 'Complete Phase 1 certification test first.' },
          'comp-u2-3': { state: 'Locked', progressPct: 0, lockReason: 'Complete Phase 1 certification test first.' }
        }
      },
      {
        planId: 'plan-brac-03',
        customComponentProgress: {
          'comp-c1-1': { state: 'Completed', progressPct: 100, consumedPct: 100, completedAt: '05/01/2026' },
          'comp-c1-2': { state: 'Available', progressPct: 0 },
          'comp-c1-3': { state: 'Locked', progressPct: 0, lockReason: 'Participate in live threat drill first.' }
        }
      }
    ]
  },
  {
    id: 'persona-devin',
    name: 'Devin Vance',
    roleTitle: 'Senior Field Auditor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    department: 'Internal Audit & Governance',
    tag: 'All Plans (Completed)',
    description: 'Fast-tracked senior learner who has graduated from all phases and earned official credentials.',
    planEnrollments: [
      {
        planId: 'plan-brac-01',
        customComponentProgress: {
          'comp-b1-1': { state: 'Completed', progressPct: 100, completedAt: '10/01/2026' },
          'comp-b1-2': { state: 'Completed', progressPct: 100, completedAt: '15/01/2026' },
          'comp-b1-3': { state: 'Completed', progressPct: 100, score: 95, passed: true, completedAt: '20/01/2026' },
          'comp-b1-4': { state: 'Completed', progressPct: 100, attendedSessions: ['ses-b1-1', 'ses-b1-2'], completedAt: '25/01/2026' },
          'comp-b1-5': { state: 'Completed', progressPct: 100, completedAt: '10/02/2026' },
          'comp-b2-1': { state: 'Completed', progressPct: 100, completedAt: '15/02/2026' },
          'comp-b2-2': { state: 'Completed', progressPct: 100, attendedSessions: ['ses-b2-1', 'ses-b2-2'], completedAt: '20/02/2026' },
          'comp-b2-3': { state: 'Completed', progressPct: 100, score: 92, passed: true, completedAt: '25/02/2026' },
          'comp-b2-4': { state: 'Completed', progressPct: 100, completedAt: '28/02/2026' },
          'comp-b3-1': { state: 'Completed', progressPct: 100, completedAt: '05/03/2026' },
          'comp-b3-2': { state: 'Completed', progressPct: 100, completedAt: '10/03/2026' },
          'comp-b4-1': { state: 'Completed', progressPct: 100, score: 96, passed: true, completedAt: '15/03/2026' },
          'comp-b4-2': { state: 'Completed', progressPct: 100, completedAt: '20/03/2026' }
        }
      },
      {
        planId: 'plan-brac-02',
        customComponentProgress: {
          'comp-u1-1': { state: 'Completed', progressPct: 100, completedAt: '05/02/2026' },
          'comp-u1-2': { state: 'Completed', progressPct: 100, attendedSessions: ['ses-u1-1'], completedAt: '12/02/2026' },
          'comp-u1-3': { state: 'Completed', progressPct: 100, score: 94, passed: true, completedAt: '20/02/2026' },
          'comp-u2-1': { state: 'Completed', progressPct: 100, completedAt: '28/02/2026' },
          'comp-u2-2': { state: 'Completed', progressPct: 100, attendedSessions: ['ses-u2-1'], completedAt: '05/03/2026' },
          'comp-u2-3': { state: 'Completed', progressPct: 100, completedAt: '10/03/2026' }
        }
      },
      {
        planId: 'plan-brac-03',
        customComponentProgress: {
          'comp-c1-1': { state: 'Completed', progressPct: 100, completedAt: '08/01/2026' },
          'comp-c1-2': { state: 'Completed', progressPct: 100, attendedSessions: ['ses-c1-1'], completedAt: '18/01/2026' },
          'comp-c1-3': { state: 'Completed', progressPct: 100, score: 98, passed: true, completedAt: '25/01/2026' }
        }
      }
    ]
  },
  {
    id: 'persona-samira',
    name: 'Samira Khan',
    roleTitle: 'Specialist Trainee',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    department: 'Social Innovation & Strategy',
    tag: 'Single-Phase Enrolled (Scope-Aware)',
    description: 'Enrolled exclusively in Phase 2 of the 2026 Microfinance Plan. The system correctly isolates Phase 2 and scopes metrics solely to this phase.',
    planEnrollments: [
      {
        planId: 'plan-brac-01',
        scopedPhaseIds: ['phase-brac-01-2'],
        customComponentProgress: {
          'comp-b2-1': { state: 'In progress', progressPct: 50, consumedPct: 50 },
          'comp-b2-2': { state: 'Available', progressPct: 0 },
          'comp-b2-3': { state: 'Locked', progressPct: 0, lockReason: 'Complete preceding interactive module and class session.' },
          'comp-b2-4': { state: 'Locked', progressPct: 0, lockReason: 'Complete preceding components in Phase 2.' }
        }
      }
    ]
  },
  {
    id: 'persona-alex',
    name: 'Alex Rivera',
    roleTitle: 'Junior Field Associate',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    department: 'Branch Operations',
    tag: 'Prerequisite Blocked',
    description: 'Learner who failed a mandatory pre-test and missed a class session, experiencing explicit locking guidance.',
    planEnrollments: [
      {
        planId: 'plan-brac-01',
        customComponentProgress: {
          'comp-b1-1': { state: 'Completed', progressPct: 100, completedAt: '01/02/2026' },
          'comp-b1-2': { state: 'Completed', progressPct: 100, completedAt: '05/02/2026' },
          'comp-b1-3': { state: 'Not passed', progressPct: 100, score: 55, passed: false, lockReason: 'Score 55% is below 80% passing threshold. Retake required.' },
          'comp-b1-4': { state: 'Locked', progressPct: 0, lockReason: 'Prerequisite "Baseline Ethics & Smart Campaign Pre-Assessment" must be passed first.' },
          'comp-b1-5': { state: 'Locked', progressPct: 0, lockReason: 'Sequential progression: Complete prior phase requirements.' },
          'comp-b2-1': { state: 'Locked', progressPct: 0, lockReason: 'Prerequisite Phase 1 must be completed first.' },
          'comp-b2-2': { state: 'Locked', progressPct: 0, lockReason: 'Prerequisite Phase 1 must be completed first.' }
        }
      }
    ]
  }
];
