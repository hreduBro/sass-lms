import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { LmsDataService } from './lms-data.service';
import { Plan, Phase, PlanComponent, PlanComponentClassSession, parseDateDDMMYYYY, formatDateDDMMYYYY, compareDDMMYYYY, getDurationDays, createWorkedExamplePlan } from '../models/plan.model';
import {
  TraineeComponentState,
  TraineeComponentProgress,
  TraineePersona,
  TraineeCredential,
  TraineeScheduleItem,
  TRAINEE_PERSONAS
} from '../models/trainee-plan.model';

export interface TraineePlanSummary {
  plan: Plan;
  scopedPhases: Phase[];
  scopedComponents: PlanComponent[];
  overallProgressPct: number;
  completedComponentsCount: number;
  totalComponentsCount: number;
  status: 'Not started' | 'In progress' | 'Completed';
  nextActionComponent?: PlanComponent;
  nextActionReason?: string;
  isNextActionLocked?: boolean;
  earnedBadges: TraineeCredential[];
  earnedCertificates: TraineeCredential[];
  isScopeConstrained: boolean;
}

// Built-in authentic components catalog for the primary BRAC Microfinance learning plans
const PLAN_BRAC_01_COMPONENTS: PlanComponent[] = [
  // Phase 1: Foundation & Smart Campaign Principles
  {
    id: 'comp-b1-1',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-1',
    type: 'Task',
    name: 'Trainee Orientation & Branch Setup Checklist',
    description: 'System initialization, field roster verification, mentor allocation, and trainee profile validation.',
    sequence: 1,
    startDate: '01/01/2026',
    endDate: '10/01/2026',
    durationDays: 10,
    isMandatory: true,
    prerequisiteIds: [],
    source: { sourceType: 'Task Template', itemName: 'Branch Induction Protocol' },
    taskType: 'Setup',
    checklist: [
      { id: 'chk-b1', text: 'Confirm branch cohort roster & assigned mentor', done: true },
      { id: 'chk-b2', text: 'Verify field tablet credentials & digital ID', done: true },
      { id: 'chk-b3', text: 'Complete village territory safety briefing', done: true }
    ]
  },
  {
    id: 'comp-b1-2',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-1',
    type: 'Content',
    name: 'BRAC Microfinance Code of Conduct & Client Protection Principles',
    description: 'Interactive video and policy standard detailing transparency in pricing, fair collection practices, and grievance redressal.',
    sequence: 2,
    startDate: '11/01/2026',
    endDate: '25/01/2026',
    durationDays: 14,
    isMandatory: true,
    prerequisiteIds: ['comp-b1-1'],
    source: { sourceType: 'Content Library', itemName: 'Client Protection Standard v3' },
    contentType: 'Video',
    contentLength: '28 mins'
  },
  {
    id: 'comp-b1-3',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-1',
    type: 'Pre-Test',
    name: 'Baseline Ethics & Smart Campaign Pre-Assessment',
    description: '10-question baseline knowledge assessment evaluating understanding of borrower rights, debt over-indebtedness checks, and privacy.',
    sequence: 3,
    startDate: '26/01/2026',
    endDate: '15/02/2026',
    durationDays: 20,
    isMandatory: true,
    prerequisiteIds: ['comp-b1-2'],
    source: { sourceType: 'Assessment Bank', itemName: 'Pre-Test Ethics & Protection' },
    passMark: 80,
    attemptLimit: 3
  },
  {
    id: 'comp-b1-4',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-1',
    type: 'Course',
    name: 'Village Organization (VO) Field Methodology & Group Lending',
    description: 'Blended flagship training course including classroom labs, group dynamic simulations, and weekly collection routines.',
    sequence: 4,
    startDate: '16/02/2026',
    endDate: '28/02/2026',
    durationDays: 13,
    isMandatory: true,
    prerequisiteIds: ['comp-b1-3'],
    source: { sourceType: 'Course Catalog', itemName: 'VO Field Methodology 2026' },
    deliveryMode: 'Blended',
    includedClasses: [
      {
        id: 'ses-b1-1',
        name: 'VO Credit Principles & Field Orientation',
        date: '15/01/2026',
        time: '10:00 - 12:30',
        duration: '2.5 hrs',
        venue: 'BRAC Regional Learning Center (RLC), Gazipur',
        instructor: 'Rafiqul Islam (Lead Training Specialist)'
      },
      {
        id: 'ses-b1-2',
        name: 'Ethical Collection & Grievance Mechanism Workshop',
        date: '12/02/2026',
        time: '14:00 - 16:30',
        duration: '2.5 hrs',
        venue: 'Training Hall B, Dhaka Central',
        instructor: 'Salma Begum (Principal Field Instructor)'
      }
    ]
  },
  {
    id: 'comp-b1-5',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-1',
    type: 'Task',
    name: 'Phase 1 Field Practicum & Mentor Sign-off',
    description: 'Direct field shadowing of 3 live VO meetings with evaluation by senior branch manager.',
    sequence: 5,
    startDate: '01/03/2026',
    endDate: '31/03/2026',
    durationDays: 31,
    isMandatory: true,
    prerequisiteIds: ['comp-b1-4'],
    source: { sourceType: 'Task Template', itemName: 'Practicum Evaluation Protocol' },
    taskType: 'Approval',
    checklist: [
      { id: 'chk-f1', text: 'Shadow senior credit officer in VO #104 meeting', done: true },
      { id: 'chk-f2', text: 'Review cash collection sheet reconciliation', done: true },
      { id: 'chk-f3', text: 'Obtain branch manager formal endorsement', done: true }
    ]
  },

  // Phase 2: Digital Credit & Biometric KYC Operations
  {
    id: 'comp-b2-1',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-2',
    type: 'Content',
    name: 'Digital Credit & Biometric KYC Field Handbook',
    description: 'Digital interactive guide covering optical biometric fingerprint capture, National ID (NID) API verification, and offline transaction syncing.',
    sequence: 1,
    startDate: '01/04/2026',
    endDate: '15/04/2026',
    durationDays: 15,
    isMandatory: true,
    prerequisiteIds: [],
    source: { sourceType: 'Content Library', itemName: 'Biometric POS Ops Guide' },
    contentType: 'PDF / Document',
    contentLength: '45 mins'
  },
  {
    id: 'comp-b2-2',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-2',
    type: 'Course',
    name: 'Tablet POS Live Disbursement & Biometric Sync Lab',
    description: 'Hands-on hardware laboratory covering live tablet pairing, biometric fingerprint scanner cleaning, instant loan disbursement, and exception handling.',
    sequence: 2,
    startDate: '16/04/2026',
    endDate: '30/04/2026',
    durationDays: 15,
    isMandatory: true,
    prerequisiteIds: ['comp-b2-1'],
    source: { sourceType: 'Course Catalog', itemName: 'Tablet POS Operations Lab' },
    deliveryMode: 'Blended',
    includedClasses: [
      {
        id: 'ses-b2-1',
        name: 'Live Tablet POS Loan Disbursement & Biometric Sync',
        date: '15/04/2026',
        time: '09:30 - 12:00',
        duration: '2.5 hrs',
        venue: 'Digital Innovation Lab 1, BRAC Center',
        instructor: 'Tariqul Huq (FinTech Systems Lead)'
      },
      {
        id: 'ses-b2-2',
        name: 'Customer Due Diligence & AML Field Exercises',
        date: '28/04/2026',
        time: '11:00 - 13:30',
        duration: '2.5 hrs',
        venue: 'Seminar Room 204, Training Wing',
        instructor: 'Nusrat Jahan (Compliance Officer)'
      }
    ]
  },
  {
    id: 'comp-b2-3',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-2',
    type: 'Post-Test',
    name: 'Biometric KYC & Tablet Operations Qualification Exam',
    description: 'Proctored qualification test assessing procedural mastery of biometric verification, fraud prevention, and device offline buffering.',
    sequence: 3,
    startDate: '01/05/2026',
    endDate: '20/05/2026',
    durationDays: 20,
    isMandatory: true,
    prerequisiteIds: ['comp-b2-2'],
    source: { sourceType: 'Assessment Bank', itemName: 'KYC Qualification Test' },
    passMark: 75,
    attemptLimit: 3
  },
  {
    id: 'comp-b2-4',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-2',
    type: 'Task',
    name: '10-KYC Field Verification Submission',
    description: 'Submission of 10 live audit records from field collections reviewed for zero KYC discrepancies.',
    sequence: 4,
    startDate: '21/05/2026',
    endDate: '30/06/2026',
    durationDays: 40,
    isMandatory: true,
    prerequisiteIds: ['comp-b2-3'],
    source: { sourceType: 'Task Template', itemName: 'KYC Field Verification Batch' },
    taskType: 'Other'
  },

  // Phase 3: Disaster-Resilient Micro-Insurance & Restructuring
  {
    id: 'comp-b3-1',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-3',
    type: 'Course',
    name: 'Climate Risk Coverage & Flood Emergency Fund Management',
    description: 'Specialized course on parametric flood micro-insurance, livestock mortality claims, and rapid emergency liquidity disbursement.',
    sequence: 1,
    startDate: '01/07/2026',
    endDate: '15/08/2026',
    durationDays: 45,
    isMandatory: true,
    prerequisiteIds: [],
    source: { sourceType: 'Course Catalog', itemName: 'Climate Micro-Insurance 2026' },
    deliveryMode: 'Self-paced'
  },
  {
    id: 'comp-b3-2',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-3',
    type: 'Survey',
    name: 'Mid-Year Branch Climate Resilience Survey',
    description: 'Field officer feedback questionnaire on borrower risk perceptions and insurance claim settlement timelines.',
    sequence: 2,
    startDate: '16/08/2026',
    endDate: '30/09/2026',
    durationDays: 45,
    isMandatory: false,
    prerequisiteIds: [],
    source: { sourceType: 'Survey Bank', itemName: 'Officer Climate Perception Survey' }
  },

  // Phase 4: Annual Compliance Audits & Leadership Evaluation
  {
    id: 'comp-b4-1',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-4',
    type: 'Post-Test',
    name: 'Annual Compliance Mock Audit & Regulation Exam',
    description: 'Comprehensive 20-question capstone examination reviewing statutory microfinance regulation and anti-fraud protocols.',
    sequence: 1,
    startDate: '01/10/2026',
    endDate: '15/11/2026',
    durationDays: 45,
    isMandatory: true,
    prerequisiteIds: [],
    source: { sourceType: 'Assessment Bank', itemName: 'Annual Regulatory Mock Exam' },
    passMark: 85,
    attemptLimit: 2
  },
  {
    id: 'comp-b4-2',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-4',
    type: 'Task',
    name: 'Leadership Evaluation & Capstone Graduation Sign-off',
    description: 'Final performance appraisal by regional director, verifying portfolio quality, ethics compliance, and client retention.',
    sequence: 2,
    startDate: '16/11/2026',
    endDate: '31/12/2026',
    durationDays: 45,
    isMandatory: true,
    prerequisiteIds: ['comp-b4-1'],
    source: { sourceType: 'Task Template', itemName: 'Graduation Capstone Sign-off' },
    taskType: 'Approval'
  }
];

const PLAN_BRAC_02_COMPONENTS: PlanComponent[] = [
  // Phase 1: Household Selection & Vulnerability Indexing
  {
    id: 'comp-u1-1',
    planId: 'plan-brac-02',
    phaseId: 'phase-brac-02-1',
    type: 'Content',
    name: 'Participatory Rural Appraisal (PRA) & Wealth Ranking Manual',
    description: 'Methodology guide for participatory wealth ranking in rural villages, community mapping, and vulnerability indicators.',
    sequence: 1,
    startDate: '01/02/2026',
    endDate: '15/02/2026',
    durationDays: 15,
    isMandatory: true,
    prerequisiteIds: [],
    source: { sourceType: 'Content Library', itemName: 'PRA Manual 2026' },
    contentType: 'PDF / Document',
    contentLength: '35 mins'
  },
  {
    id: 'comp-u1-2',
    planId: 'plan-brac-02',
    phaseId: 'phase-brac-02-1',
    type: 'Course',
    name: 'Household Poverty Scorecard (PPI) Calibration',
    description: 'Standardized field training on evaluating food security, dwelling structure materials, and school-age child enrolment.',
    sequence: 2,
    startDate: '16/02/2026',
    endDate: '15/03/2026',
    durationDays: 28,
    isMandatory: true,
    prerequisiteIds: ['comp-u1-1'],
    source: { sourceType: 'Course Catalog', itemName: 'Poverty Scorecard PPI' },
    deliveryMode: 'Blended',
    includedClasses: [
      {
        id: 'ses-u1-1',
        name: 'Household Poverty Mapping & PPI Scoring Workshop',
        date: '20/02/2026',
        time: '10:00 - 13:00',
        duration: '3.0 hrs',
        venue: 'Field Training Center, Mymensingh Hub',
        instructor: 'Dr. Imran Matin (Executive Director, BIGD)'
      }
    ]
  },
  {
    id: 'comp-u1-3',
    planId: 'plan-brac-02',
    phaseId: 'phase-brac-02-1',
    type: 'Pre-Test',
    name: 'Ultra-Poor Vulnerability Scorecard Certification Test',
    description: 'Qualification exam for certified poverty assessment caseworkers.',
    sequence: 3,
    startDate: '16/03/2026',
    endDate: '30/04/2026',
    durationDays: 45,
    isMandatory: true,
    prerequisiteIds: ['comp-u1-2'],
    source: { sourceType: 'Assessment Bank', itemName: 'PPI Certification Test' },
    passMark: 80,
    attemptLimit: 3
  },

  // Phase 2: Asset Management Coaching & Health Linkages
  {
    id: 'comp-u2-1',
    planId: 'plan-brac-02',
    phaseId: 'phase-brac-02-2',
    type: 'Course',
    name: 'Productive Asset Transfer & Livestock Veterinary Management',
    description: 'Training coaches on cattle and poultry procurement, shed construction, vaccination schedules, and disease management.',
    sequence: 1,
    startDate: '01/05/2026',
    endDate: '31/05/2026',
    durationDays: 31,
    isMandatory: true,
    prerequisiteIds: [],
    source: { sourceType: 'Course Catalog', itemName: 'Livestock Asset Coaching' },
    deliveryMode: 'Self-paced'
  },
  {
    id: 'comp-u2-2',
    planId: 'plan-brac-02',
    phaseId: 'phase-brac-02-2',
    type: 'Course',
    name: 'Bi-weekly Home Mentoring & Health Linkages Workshop',
    description: 'In-person practical workshop on nutrition coaching, handwashing hygiene habits, and community clinic referrals.',
    sequence: 2,
    startDate: '01/06/2026',
    endDate: '30/06/2026',
    durationDays: 30,
    isMandatory: true,
    prerequisiteIds: ['comp-u2-1'],
    source: { sourceType: 'Course Catalog', itemName: 'Home Mentoring Standard' },
    deliveryMode: 'Blended',
    includedClasses: [
      {
        id: 'ses-u2-1',
        name: 'Asset Management & Livestock Veterinary Linkages',
        date: '10/05/2026',
        time: '14:00 - 17:00',
        duration: '3.0 hrs',
        venue: 'Gazipur Regional Agricultural Hub',
        instructor: 'Dr. M. Rahman (Veterinary Extension Specialist)'
      }
    ]
  },
  {
    id: 'comp-u2-3',
    planId: 'plan-brac-02',
    phaseId: 'phase-brac-02-2',
    type: 'Task',
    name: '24-Month Household Graduation Field Verification',
    description: 'Final assessment of household savings, nutritional intake, and microfinance transition readiness.',
    sequence: 3,
    startDate: '01/07/2026',
    endDate: '31/07/2026',
    durationDays: 31,
    isMandatory: true,
    prerequisiteIds: ['comp-u2-2'],
    source: { sourceType: 'Task Template', itemName: 'Graduation Benchmark Audit' },
    taskType: 'Approval'
  }
];

const PLAN_BRAC_03_COMPONENTS: PlanComponent[] = [
  {
    id: 'comp-c1-1',
    planId: 'plan-brac-03',
    phaseId: 'phase-brac-03-1',
    type: 'Content',
    name: 'Phishing Vector Recognition & 2FA Hygiene Guide',
    description: 'Interactive walkthrough on recognizing spear-phishing emails, malicious SMS OTP prompts, and branch tablet security.',
    sequence: 1,
    startDate: '05/01/2026',
    endDate: '15/01/2026',
    durationDays: 10,
    isMandatory: true,
    prerequisiteIds: [],
    source: { sourceType: 'Content Library', itemName: 'Cyber Hygiene 2026' },
    contentType: 'Video',
    contentLength: '20 mins'
  },
  {
    id: 'comp-c1-2',
    planId: 'plan-brac-03',
    phaseId: 'phase-brac-03-1',
    type: 'Course',
    name: 'Live Threat Simulation Drill',
    description: 'Hands-on simulation responding to simulated branch network intrusion and compromised credentials.',
    sequence: 2,
    startDate: '16/01/2026',
    endDate: '28/02/2026',
    durationDays: 43,
    isMandatory: true,
    prerequisiteIds: ['comp-c1-1'],
    source: { sourceType: 'Course Catalog', itemName: 'Threat Simulation Drill' },
    deliveryMode: 'Blended',
    includedClasses: [
      {
        id: 'ses-c1-1',
        name: 'Hands-on Social Engineering & Phishing Simulation',
        date: '18/03/2026',
        time: '15:00 - 17:00',
        duration: '2.0 hrs',
        venue: 'Cyber Security Lab 4, IT Tower',
        instructor: 'Shakil Anwar (Head of InfoSec)'
      }
    ]
  },
  {
    id: 'comp-c1-3',
    planId: 'plan-brac-03',
    phaseId: 'phase-brac-03-1',
    type: 'Post-Test',
    name: '2026 Staff Security & Cyber Threat Final Exam',
    description: 'Final mandatory compliance certification for all branch operations personnel.',
    sequence: 3,
    startDate: '01/03/2026',
    endDate: '31/03/2026',
    durationDays: 31,
    isMandatory: true,
    prerequisiteIds: ['comp-c1-2'],
    source: { sourceType: 'Assessment Bank', itemName: 'Staff Security Exam' },
    passMark: 80,
    attemptLimit: 3
  }
];

@Injectable({
  providedIn: 'root'
})
export class TraineePlanService {
  private lms = inject(LmsDataService);

  // Active persona for trainee perspective simulation
  activePersona = signal<TraineePersona>(TRAINEE_PERSONAS[0]);

  // Dynamic runtime progress tracking override table
  // Key: componentId -> TraineeComponentProgress
  progressOverrides = signal<Record<string, TraineeComponentProgress>>({});

  // Dynamic session attendance tracking
  // Key: sessionId -> 'Attended' | 'Missed' | 'Upcoming'
  sessionAttendance = signal<Record<string, 'Attended' | 'Missed' | 'Upcoming'>>({});

  constructor() {
    this.applyPersonaState(this.activePersona());
  }

  // Switch persona
  setPersona(personaId: string) {
    const found = TRAINEE_PERSONAS.find(p => p.id === personaId);
    if (found) {
      this.activePersona.set(found);
      this.applyPersonaState(found);
      this.lms.showToast(`Switched trainee view to: ${found.name} (${found.tag})`, 'info', 3000, 'Persona Active');
    }
  }

  private applyPersonaState(persona: TraineePersona) {
    const overrides: Record<string, TraineeComponentProgress> = {};
    const sessions: Record<string, 'Attended' | 'Missed' | 'Upcoming'> = {};

    for (const enr of persona.planEnrollments) {
      if (enr.customComponentProgress) {
        for (const [compId, prog] of Object.entries(enr.customComponentProgress)) {
          overrides[compId] = {
            componentId: compId,
            state: prog.state || 'Available',
            lockReason: prog.lockReason,
            progressPct: prog.progressPct ?? (prog.state === 'Completed' ? 100 : 0),
            consumedPct: prog.consumedPct,
            score: prog.score,
            maxScore: prog.maxScore || 100,
            passed: prog.passed,
            attendedSessions: prog.attendedSessions || [],
            missedSessions: prog.missedSessions || [],
            attemptsUsed: prog.attemptsUsed ?? (prog.score !== undefined ? 1 : 0),
            completedAt: prog.completedAt,
            userNotes: prog.userNotes
          };

          if (prog.attendedSessions) {
            prog.attendedSessions.forEach(sId => { sessions[sId] = 'Attended'; });
          }
          if (prog.missedSessions) {
            prog.missedSessions.forEach(sId => { sessions[sId] = 'Missed'; });
          }
        }
      }
    }

    this.progressOverrides.set(overrides);
    this.sessionAttendance.set(sessions);
  }

  // Helper to get components of a plan
  getPlanComponents(planId: string): PlanComponent[] {
    const plan = this.lms.plans().find(p => p.id === planId);
    if (plan && plan.components && plan.components.length > 0) {
      return plan.components;
    }

    // Direct match against rich component catalogs
    if (planId === 'plan-brac-01' || planId === 'plan-1' || planId === 'plan-fodp-2026') {
      return PLAN_BRAC_01_COMPONENTS;
    }
    if (planId === 'plan-brac-02' || planId === 'plan-2') {
      return PLAN_BRAC_02_COMPONENTS;
    }
    if (planId === 'plan-brac-03' || planId === 'plan-3') {
      return PLAN_BRAC_03_COMPONENTS;
    }

    // Fallback: create worked example components if matching
    const sample = createWorkedExamplePlan();
    if (planId === sample.plan.id) {
      return sample.components;
    }

    // Default fallback: return plan-brac-01 components so data is never empty
    return PLAN_BRAC_01_COMPONENTS;
  }

  // Resolve scoped phases for a trainee
  getScopedPhases(plan: Plan, persona: TraineePersona = this.activePersona()): Phase[] {
    const enrollment = persona.planEnrollments.find(e => e.planId === plan.id || (plan.id === 'plan-brac-01' && e.planId === 'plan-1'));
    const allPhases = plan.phases || [];

    if (!enrollment) {
      return allPhases;
    }

    if (enrollment.scopedPhaseIds && enrollment.scopedPhaseIds.length > 0) {
      const scopedSet = new Set(enrollment.scopedPhaseIds);
      const filtered = allPhases.filter(p => scopedSet.has(p.id) || (p.sequence === 2 && scopedSet.has('phase-2')));
      return filtered.length > 0 ? filtered : allPhases;
    }

    return allPhases;
  }

  // Resolve scoped components for a trainee
  getScopedComponents(plan: Plan, persona: TraineePersona = this.activePersona()): PlanComponent[] {
    const allComponents = this.getPlanComponents(plan.id);
    if (!allComponents || allComponents.length === 0) return [];

    const scopedPhases = this.getScopedPhases(plan, persona);
    const enrollment = persona.planEnrollments.find(e => e.planId === plan.id || (plan.id === 'plan-brac-01' && e.planId === 'plan-1'));

    if (enrollment?.scopedPhaseIds && enrollment.scopedPhaseIds.length > 0) {
      const phaseIdSet = new Set(scopedPhases.map(p => p.id));
      const filtered = allComponents.filter(c => c.phaseId && phaseIdSet.has(c.phaseId));
      return filtered.length > 0 ? filtered : allComponents;
    }

    return allComponents;
  }

  // Calculate component state following Section D rules
  getComponentState(
    component: PlanComponent,
    plan: Plan,
    allComponents: PlanComponent[] = this.getPlanComponents(plan.id),
    persona: TraineePersona = this.activePersona()
  ): { state: TraineeComponentState; lockReason?: string; progressPct: number } {
    const override = this.progressOverrides()[component.id];
    if (override && override.state) {
      return {
        state: override.state,
        lockReason: override.lockReason,
        progressPct: override.progressPct
      };
    }

    // Check optional
    if (!component.isMandatory) {
      return { state: 'Optional', progressPct: 0 };
    }

    // Check prerequisites
    if (component.prerequisiteIds && component.prerequisiteIds.length > 0) {
      for (const prereqId of component.prerequisiteIds) {
        const prereqProgress = this.progressOverrides()[prereqId];
        if (!prereqProgress || prereqProgress.state !== 'Completed') {
          const prereqComp = allComponents.find(c => c.id === prereqId);
          return {
            state: 'Locked',
            lockReason: `Prerequisite "${prereqComp?.name || prereqId}" must be completed first.`,
            progressPct: 0
          };
        }
      }
    }

    // Check sequential progression mode
    const isSequential = (plan.defaultProgressionMode || 'Sequential') === 'Sequential' && component.progressionModeOverride !== 'Free';
    if (isSequential) {
      const sameScopeComponents = allComponents
        .filter(c => c.phaseId === component.phaseId && c.isMandatory)
        .sort((a, b) => a.sequence - b.sequence);

      const currentIndex = sameScopeComponents.findIndex(c => c.id === component.id);
      if (currentIndex > 0) {
        const previousComponent = sameScopeComponents[currentIndex - 1];
        const prevProg = this.progressOverrides()[previousComponent.id];
        if (!prevProg || prevProg.state !== 'Completed') {
          return {
            state: 'Locked',
            lockReason: `Sequential progression: Complete "${previousComponent.name}" before unlocking this item.`,
            progressPct: 0
          };
        }
      }
    }

    return {
      state: 'Available',
      progressPct: 0
    };
  }

  // Up Next card resolution (Section B.2)
  getUpNext(plan: Plan, persona: TraineePersona = this.activePersona()): {
    component: PlanComponent;
    reason: string;
    isLocked: boolean;
    state: TraineeComponentState;
  } | null {
    const scopedComponents = this.getScopedComponents(plan, persona);
    if (!scopedComponents || scopedComponents.length === 0) return null;

    // 1. First priority: Any item currently "In progress"
    for (const comp of scopedComponents) {
      const stateInfo = this.getComponentState(comp, plan, scopedComponents, persona);
      if (stateInfo.state === 'In progress') {
        return {
          component: comp,
          reason: 'Resume your in-progress learning module.',
          isLocked: false,
          state: 'In progress'
        };
      }
    }

    // 2. Second priority: Upcoming class session
    for (const comp of scopedComponents) {
      if (comp.type === 'Course' && comp.includedClasses && comp.includedClasses.length > 0) {
        const stateInfo = this.getComponentState(comp, plan, scopedComponents, persona);
        if (stateInfo.state !== 'Completed') {
          const unattendedClass = comp.includedClasses.find(s => {
            const att = this.sessionAttendance()[s.id];
            return att !== 'Attended';
          });
          if (unattendedClass) {
            return {
              component: comp,
              reason: `Upcoming Class Session: "${unattendedClass.name}" scheduled for ${unattendedClass.date} at ${unattendedClass.time}.`,
              isLocked: stateInfo.state === 'Locked',
              state: stateInfo.state
            };
          }
        }
      }
    }

    // 3. Third priority: First available item not yet completed
    for (const comp of scopedComponents) {
      const stateInfo = this.getComponentState(comp, plan, scopedComponents, persona);
      if (stateInfo.state === 'Available') {
        return {
          component: comp,
          reason: 'Ready to begin. Proceed to complete this module.',
          isLocked: false,
          state: 'Available'
        };
      }
    }

    // 4. Fourth priority: If all remaining items are locked, show the first locked item
    for (const comp of scopedComponents) {
      const stateInfo = this.getComponentState(comp, plan, scopedComponents, persona);
      if (stateInfo.state === 'Locked' || stateInfo.state === 'Not passed') {
        return {
          component: comp,
          reason: stateInfo.lockReason || 'Locked item. Fulfill prerequisites to proceed.',
          isLocked: true,
          state: stateInfo.state
        };
      }
    }

    return null;
  }

  // Full Plan summary for trainee
  getPlanSummary(planId: string, persona: TraineePersona = this.activePersona()): TraineePlanSummary | undefined {
    const plan = this.lms.plans().find(p => p.id === planId);
    if (!plan) return undefined;

    const scopedPhases = this.getScopedPhases(plan, persona);
    const scopedComponents = this.getScopedComponents(plan, persona);

    let completedCount = 0;
    let totalProgressSum = 0;
    const totalMandatory = scopedComponents.filter(c => c.isMandatory).length;

    for (const comp of scopedComponents) {
      const info = this.getComponentState(comp, plan, scopedComponents, persona);
      if (info.state === 'Completed') {
        completedCount++;
      }
      totalProgressSum += info.progressPct;
    }

    const overallProgressPct = scopedComponents.length > 0 
      ? Math.round(totalProgressSum / scopedComponents.length) 
      : 0;

    let status: 'Not started' | 'In progress' | 'Completed' = 'Not started';
    if (completedCount === totalMandatory && totalMandatory > 0) {
      status = 'Completed';
    } else if (overallProgressPct > 0 || completedCount > 0) {
      status = 'In progress';
    }

    const upNext = this.getUpNext(plan, persona);
    const credentials = this.getPlanCredentials(plan, persona);

    const enrollment = persona.planEnrollments.find(e => e.planId === plan.id || (plan.id === 'plan-brac-01' && e.planId === 'plan-1'));
    const isScopeConstrained = !!(enrollment?.scopedPhaseIds && enrollment.scopedPhaseIds.length > 0 && enrollment.scopedPhaseIds.length < (plan.phases?.length || 0));

    return {
      plan,
      scopedPhases,
      scopedComponents,
      overallProgressPct,
      completedComponentsCount: completedCount,
      totalComponentsCount: scopedComponents.length,
      status,
      nextActionComponent: upNext?.component,
      nextActionReason: upNext?.reason,
      isNextActionLocked: upNext?.isLocked,
      earnedBadges: credentials.filter(c => c.type === 'badge' && c.status === 'Earned'),
      earnedCertificates: credentials.filter(c => c.type === 'certificate' && c.status === 'Earned'),
      isScopeConstrained
    };
  }

  // All plans for the trainee
  getTraineePlans(persona: TraineePersona = this.activePersona()): TraineePlanSummary[] {
    const enrolledIds = new Set(persona.planEnrollments.map(e => e.planId));
    const allPlans = this.lms.plans();

    // Match enrolled plans
    let targetPlans = allPlans.filter(p => enrolledIds.has(p.id));

    // Fallback: If no plans matched the exact IDs, match plan-brac-01, plan-brac-02, plan-brac-03
    if (targetPlans.length === 0) {
      targetPlans = allPlans.filter(p => 
        p.id === 'plan-brac-01' || 
        p.id === 'plan-brac-02' || 
        p.id === 'plan-brac-03'
      );
    }

    // Second fallback: Show active/published plans
    if (targetPlans.length === 0 && allPlans.length > 0) {
      targetPlans = allPlans.filter(p => p.status === 'Active' || p.status === 'Published');
    }

    // Final fallback: all plans
    if (targetPlans.length === 0) {
      targetPlans = allPlans;
    }

    return targetPlans.map(plan => {
      return this.getPlanSummary(plan.id, persona)!;
    }).filter(Boolean);
  }

  // Generate badges and certificates for a plan
  getPlanCredentials(plan: Plan, persona: TraineePersona = this.activePersona()): TraineeCredential[] {
    const scopedPhases = this.getScopedPhases(plan, persona);
    const scopedComponents = this.getScopedComponents(plan, persona);
    const creds: TraineeCredential[] = [];

    // 1. Course Badges
    const courseComponents = scopedComponents.filter(c => c.type === 'Course' || c.type === 'Content');
    for (const comp of courseComponents) {
      const stateInfo = this.getComponentState(comp, plan, scopedComponents, persona);
      const isEarned = stateInfo.state === 'Completed';

      const compNameLower = comp.name.toLowerCase();
      let skills = ['Microfinance Operations', 'Client Protection Principles', 'Field Governance'];
      if (compNameLower.includes('cyber') || compNameLower.includes('phishing') || compNameLower.includes('2fa')) {
        skills = ['Cyber Hygiene', 'Phishing Defense', 'Field Tablet Security'];
      } else if (compNameLower.includes('poverty') || compNameLower.includes('ultra') || compNameLower.includes('asset') || compNameLower.includes('livestock') || compNameLower.includes('mentoring')) {
        skills = ['Poverty Scorecard (PPI)', 'Household Mentoring', 'Livestock Asset Transfer'];
      } else if (compNameLower.includes('tablet') || compNameLower.includes('pos') || compNameLower.includes('disbursement') || compNameLower.includes('biometric')) {
        skills = ['Tablet POS Disbursement', 'Biometric Sync', 'AML / KYC Compliance'];
      } else if (compNameLower.includes('code of conduct') || compNameLower.includes('ethics') || compNameLower.includes('smart campaign')) {
        skills = ['Smart Campaign Principles', 'Client Protection', 'Ethical Standards'];
      }

      creds.push({
        id: `badge-${comp.id}`,
        type: 'badge',
        title: `${comp.name} Badge`,
        subtitle: `Course Credential • ${comp.deliveryMode || 'Digital Learning'}`,
        planId: plan.id,
        planName: plan.name,
        phaseId: comp.phaseId || undefined,
        componentId: comp.id,
        issueDate: isEarned ? '15/02/2026' : undefined,
        verificationCode: isEarned ? `BDG-${comp.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-5)}-2026` : undefined,
        recipientName: persona.name,
        status: isEarned ? 'Earned' : 'Locked',
        imageUrl: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?auto=format&fit=crop&w=200&q=80',
        skills
      });
    }

    // 2. Phase Certificates
    for (const phase of scopedPhases) {
      const phaseComponents = scopedComponents.filter(c => c.phaseId === phase.id && c.isMandatory);
      const allDone = phaseComponents.length > 0 && phaseComponents.every(c => {
        const s = this.getComponentState(c, plan, scopedComponents, persona);
        return s.state === 'Completed';
      });

      creds.push({
        id: `cert-phase-${phase.id}`,
        type: 'certificate',
        title: `${phase.name} Certificate`,
        subtitle: `Official Phase Qualification • ${plan.name}`,
        planId: plan.id,
        planName: plan.name,
        phaseId: phase.id,
        phaseName: phase.name,
        issueDate: allDone ? phase.endDate : undefined,
        verificationCode: allDone ? `CERT-${phase.id.toUpperCase().slice(-6)}-2026` : undefined,
        recipientName: persona.name,
        status: allDone ? 'Earned' : 'Locked',
        grade: allDone ? 'Distinction' : undefined,
        signatoryName: 'Farhana Ahmed',
        signatoryTitle: 'Director of Learning & Development, BRAC'
      });
    }

    // 3. Plan Graduation Diploma
    const totalMandatory = scopedComponents.filter(c => c.isMandatory).length;
    const completedCount = scopedComponents.filter(c => {
      const s = this.getComponentState(c, plan, scopedComponents, persona);
      return s.state === 'Completed';
    }).length;

    const isGraduated = totalMandatory > 0 && completedCount === totalMandatory;
    creds.push({
      id: `diploma-${plan.id}`,
      type: 'certificate',
      title: `${plan.name} Diploma`,
      subtitle: `Comprehensive Programme Graduation Credential`,
      planId: plan.id,
      planName: plan.name,
      issueDate: isGraduated ? plan.endDate : undefined,
      verificationCode: isGraduated ? `DIP-${plan.planCode}-2026` : undefined,
      recipientName: persona.name,
      status: isGraduated ? 'Earned' : 'Locked',
      grade: isGraduated ? 'Honours' : undefined,
      signatoryName: plan.owner?.name || 'Tanvir Hossain',
      signatoryTitle: 'Head of Branch Operations'
    });

    return creds;
  }

  // All credentials across all enrolled plans
  getAllCredentials(persona: TraineePersona = this.activePersona()): TraineeCredential[] {
    const plans = this.getTraineePlans(persona);
    const allCreds: TraineeCredential[] = [];
    for (const ps of plans) {
      const creds = this.getPlanCredentials(ps.plan, persona);
      allCreds.push(...creds);
    }
    return allCreds;
  }

  // Aggregate all dated schedule items (Class sessions, exams, phase windows)
  getScheduleItems(persona: TraineePersona = this.activePersona()): TraineeScheduleItem[] {
    const plans = this.getTraineePlans(persona);
    const items: TraineeScheduleItem[] = [];

    for (const ps of plans) {
      const plan = ps.plan;
      
      // Phase Windows
      for (const ph of ps.scopedPhases) {
        items.push({
          id: `sched-ph-${ph.id}`,
          planId: plan.id,
          planName: plan.name,
          phaseId: ph.id,
          phaseName: ph.name,
          componentId: ph.id,
          componentName: ph.name,
          type: 'phase_window',
          title: `Phase Window: ${ph.name}`,
          date: ph.startDate,
          time: 'All Day',
          duration: `${ph.startDate} - ${ph.endDate}`,
          status: 'Active',
          isMandatory: true
        });
      }

      // Components
      for (const comp of ps.scopedComponents) {
        if (comp.type === 'Course' && comp.includedClasses) {
          for (const session of comp.includedClasses) {
            const att = this.sessionAttendance()[session.id] || 'Upcoming';
            items.push({
              id: session.id,
              planId: plan.id,
              planName: plan.name,
              phaseId: comp.phaseId || undefined,
              componentId: comp.id,
              componentName: comp.name,
              type: 'class_session',
              title: session.name,
              date: session.date,
              time: session.time,
              duration: session.duration,
              venue: session.venue,
              instructor: session.instructor,
              status: att,
              isMandatory: comp.isMandatory,
              room: 'Room 402, Training Wing'
            });
          }
        } else if (comp.type === 'Pre-Test' || comp.type === 'Post-Test') {
          items.push({
            id: `sched-test-${comp.id}`,
            planId: plan.id,
            planName: plan.name,
            phaseId: comp.phaseId || undefined,
            componentId: comp.id,
            componentName: comp.name,
            type: 'exam',
            title: `Assessment Window: ${comp.name}`,
            date: comp.startDate,
            time: '09:00 - 18:00',
            duration: '45 mins',
            status: 'Upcoming',
            isMandatory: comp.isMandatory
          });
        }
      }
    }

    // Sort chronologically by date DD/MM/YYYY
    items.sort((a, b) => compareDDMMYYYY(a.date, b.date));
    return items;
  }

  // Content consumption tracking called by ContentViewerModal and CoursePlayerModal
  updateContentConsumption(componentId: string, percentage: number, markCompleted?: boolean) {
    this.progressOverrides.update(map => {
      const prev = map[componentId] || { componentId, state: 'In progress', progressPct: 0 };
      const isComplete = markCompleted !== undefined ? markCompleted : percentage >= 100;
      return {
        ...map,
        [componentId]: {
          ...prev,
          consumedPct: percentage,
          progressPct: isComplete ? 100 : percentage,
          state: isComplete ? 'Completed' : 'In progress',
          completedAt: isComplete ? formatDateDDMMYYYY(new Date()) : prev.completedAt
        }
      };
    });

    if (percentage >= 100 || markCompleted) {
      this.lms.showToast('Module completed! Progress updated successfully.', 'success', 3000, 'Module Completed');
    }
  }

  // Class session attendance toggle called by MySchedule, PlanOverview, and CoursePlayerModal
  toggleSessionAttendanceState(sessionId: string) {
    const current = this.sessionAttendance()[sessionId] || 'Upcoming';
    const nextState = current === 'Attended' ? 'Upcoming' : 'Attended';
    this.sessionAttendance.update(map => ({
      ...map,
      [sessionId]: nextState
    }));

    if (nextState === 'Attended') {
      this.lms.showToast('Attendance recorded as Attended.', 'success', 3000, 'Attendance Confirmed');
    } else {
      this.lms.showToast('Attendance reset to Upcoming.', 'info', 3000, 'Attendance Reset');
    }
  }

  // Exam result submission called by ExamFlowModal
  submitExamResult(componentId: string, score: number, maxScore: number = 100, passingScore: number = 80) {
    const passed = score >= passingScore;
    this.progressOverrides.update(map => {
      const prev = map[componentId] || { componentId, state: 'In progress', progressPct: 0 };
      return {
        ...map,
        [componentId]: {
          ...prev,
          score,
          maxScore,
          passed,
          progressPct: passed ? 100 : Math.round((score / Math.max(passingScore, 1)) * 80),
          state: passed ? 'Completed' : 'Not passed',
          lockReason: passed ? undefined : `Score ${score}% is below passing threshold (${passingScore}%). Retake allowed.`,
          completedAt: passed ? formatDateDDMMYYYY(new Date()) : prev.completedAt
        }
      };
    });

    if (passed) {
      this.lms.showToast(`Congratulations! You passed with ${score}%.`, 'success', 4000, 'Assessment Passed');
    } else {
      this.lms.showToast(`Score: ${score}%. Retake is available to reach ${passingScore}%.`, 'warning', 4000, 'Retake Available');
    }
  }

  // Task & milestone submission called by TaskMilestoneModal
  submitTaskMilestone(componentId: string, notes?: string) {
    this.progressOverrides.update(map => {
      const prev = map[componentId] || { componentId, state: 'In progress', progressPct: 0 };
      return {
        ...map,
        [componentId]: {
          ...prev,
          state: 'Completed',
          progressPct: 100,
          completedAt: formatDateDDMMYYYY(new Date()),
          userNotes: notes
        }
      };
    });
    this.lms.showToast('Task marked as complete and verified.', 'success', 3000, 'Task Complete');
  }

  // Survey submission called by SurveyModal
  submitSurveyResponse(componentId: string) {
    this.progressOverrides.update(map => {
      const prev = map[componentId] || { componentId, state: 'In progress', progressPct: 0 };
      return {
        ...map,
        [componentId]: {
          ...prev,
          state: 'Completed',
          progressPct: 100,
          completedAt: formatDateDDMMYYYY(new Date())
        }
      };
    });
    this.lms.showToast('Thank you! Your feedback has been recorded.', 'success', 3000, 'Survey Submitted');
  }
}
