import { UserRole } from './lms.model';

export type CourseTemplateStatus = 'active' | 'inactive' | 'draft';
export type CourseTemplateScope = 'lms' | 'organization';
export type CourseTemplateCreationPath = 'saveFromCourse' | 'dedicatedBuilder';

export type CourseSlotType = 
  | 'video' 
  | 'article' 
  | 'quiz' 
  | 'interactive_lab' 
  | 'scorm' 
  | 'assignment' 
  | 'reading' 
  | 'live_session' 
  | 'simulation';

export interface CourseTemplateSlot {
  slotId: string;
  order: number;
  title: string;
  type: CourseSlotType;
  required: boolean;
  estimatedMinutes: number;
  description?: string;
}

export interface CourseTemplateModule {
  moduleId: string;
  order: number;
  title: string;
  description?: string;
  contentSlots: CourseTemplateSlot[];
}

export interface CourseTemplateRequiredComponent {
  id: string;
  name: string;
  description: string;
  category: 'assessment' | 'feedback' | 'proctoring' | 'certificate' | 'attendance';
  enabled: boolean;
}

export interface CourseTemplateStructuralDefaults {
  passingScorePercent: number;
  completionTracking: 'all_slots' | 'all_mandatory_slots' | 'required_slots_only' | 'final_assessment_only' | 'assessment_only';
  sequentialUnlock: boolean;
  certificateEnabled: boolean;
  allowRetakes: boolean;
  maxRetakeAttempts?: number;
  pace: 'self_paced' | 'instructor_led' | 'cohort_scheduled';
}

export interface CourseTemplateStructure {
  modules: CourseTemplateModule[];
  requiredComponents: CourseTemplateRequiredComponent[];
  structuralDefaults: CourseTemplateStructuralDefaults;
}

export interface CourseTemplateVisibility {
  mode: 'all_lms_instructors' | 'restricted' | 'org_wide';
  allowedUserIds?: string[];
}

export interface CourseTemplate {
  id: string;                               // system-generated, unique (e.g. CTMP-1972-01)
  code: string;                             // human readable code (e.g. TMP-MF-001)
  name: string;                             // required
  description?: string;                     // optional description of what the blueprint is for
  categoryTags: string[];                   // discovery & filtering tags

  scope: CourseTemplateScope;               // 'lms' by default, 'organization' reserved
  lmsId: string;                            // workspace ID
  lmsName?: string;
  organizationId: string;                   // owning org ID
  organizationName?: string;
  approvalState?: 'pending' | 'approved' | 'rejected' | null; // reserved for future Org sharing
  version: number;                          // template version

  // THE STRUCTURAL BLUEPRINT (No content, no learner progress, no final metadata)
  structure: CourseTemplateStructure;

  status: CourseTemplateStatus;             // active | inactive | draft
  sourceCourseId?: string;                  // provenance if saved-from-course (audit only!)
  sourceCourseName?: string;
  usedCount: number;                        // derived: # of courses created from this template
  visibility: CourseTemplateVisibility;

  createdBy: string;
  createdById: string;
  createdAt: string;                        // DD/MM/YYYY or DD:MM:YYYY HH:MM:SS
  updatedAt: string;
}

export interface CourseTemplatePermissions {
  canViewFeature: boolean;
  canCreateTemplate: boolean;
  canEditTemplate: boolean;
  canDeactivateTemplate: boolean;
  canManageVisibility: boolean;
  canUseTemplate: boolean;
  canManageDashboardStudio: boolean;
}

export interface CourseTemplateSummaryStats {
  totalTemplates: number;
  activeTemplates: number;
  inactiveTemplates: number;
  draftTemplates: number;
  totalCoursesSpawned: number;
}

// Available Content Slot Type Definitions for Builder UI
export interface SlotTypeDefinition {
  type: CourseSlotType;
  label: string;
  icon: string;
  defaultTitle: string;
  defaultMinutes: number;
  badgeColor: string;
  description: string;
}

export const AVAILABLE_SLOT_TYPES: SlotTypeDefinition[] = [
  {
    type: 'video',
    label: 'Video Presentation',
    icon: 'play_circle',
    defaultTitle: 'Core Video Lecture & Demonstration',
    defaultMinutes: 15,
    badgeColor: 'badge-info',
    description: 'High-definition streaming video lecture, keynote, or scenario demonstration.'
  },
  {
    type: 'article',
    label: 'Article / Guide',
    icon: 'article',
    defaultTitle: 'Foundational Knowledge Briefing',
    defaultMinutes: 10,
    badgeColor: 'badge-neutral',
    description: 'Structured rich-text guide, regulatory standard, or procedural overview.'
  },
  {
    type: 'quiz',
    label: 'Knowledge Check / Quiz',
    icon: 'quiz',
    defaultTitle: 'Formative Assessment & Knowledge Check',
    defaultMinutes: 15,
    badgeColor: 'badge-warning',
    description: 'Multiple choice questions, knowledge checks with instant feedback.'
  },
  {
    type: 'interactive_lab',
    label: 'Hands-on Lab',
    icon: 'science',
    defaultTitle: 'Guided Interactive Field Simulation',
    defaultMinutes: 30,
    badgeColor: 'badge-accent',
    description: 'Step-by-step interactive exercise or simulated branch environment.'
  },
  {
    type: 'scorm',
    label: 'SCORM / e-Learning Package',
    icon: 'extension',
    defaultTitle: 'SCORM 1.2 / 2004 Interactive Module',
    defaultMinutes: 25,
    badgeColor: 'badge-primary',
    description: 'Standards-compliant interactive e-learning multimedia package.'
  },
  {
    type: 'assignment',
    label: 'Practical Assignment',
    icon: 'assignment',
    defaultTitle: 'Field Case Study Submission',
    defaultMinutes: 45,
    badgeColor: 'badge-secondary',
    description: 'Deliverable submission evaluated against a standardized rubric.'
  },
  {
    type: 'reading',
    label: 'Required Reference Reading',
    icon: 'menu_book',
    defaultTitle: 'Standard Operating Procedures Document',
    defaultMinutes: 20,
    badgeColor: 'badge-neutral',
    description: 'Official policy documents, manuals, and compliance references.'
  },
  {
    type: 'live_session',
    label: 'Live Virtual Session',
    icon: 'videocam',
    defaultTitle: 'Live Instructor-led Webinar / Q&A',
    defaultMinutes: 60,
    badgeColor: 'badge-error',
    description: 'Scheduled synchronous web conference or masterclass.'
  },
  {
    type: 'simulation',
    label: 'Scenario Simulation',
    icon: 'psychology',
    defaultTitle: 'Branch Escalation & Crisis Simulation',
    defaultMinutes: 25,
    badgeColor: 'badge-info',
    description: 'Branch-level dynamic scenario decision branching.'
  }
];

export const DEFAULT_REQUIRED_COMPONENTS: CourseTemplateRequiredComponent[] = [
  {
    id: 'comp-pre-assess',
    name: 'Learner Diagnostic Baseline',
    description: 'Mandatory diagnostic evaluation prior to starting instructional modules.',
    category: 'assessment',
    enabled: true
  },
  {
    id: 'comp-feedback-survey',
    name: 'End-of-Course Feedback Survey',
    description: 'Learner satisfaction and instructor rating survey required before completion certificate.',
    category: 'feedback',
    enabled: true
  },
  {
    id: 'comp-final-exam',
    name: 'Comprehensive Evaluation Exam',
    description: 'Final proctored assessment testing all module learning objectives.',
    category: 'assessment',
    enabled: true
  },
  {
    id: 'comp-cert-issue',
    name: 'Verified Digital Credential Issuance',
    description: 'Automatic generation and issuance of verifiable completion certificate upon passing criteria.',
    category: 'certificate',
    enabled: true
  }
];

export const INITIAL_COURSE_TEMPLATES: CourseTemplate[] = [
  {
    id: 'CTMP-1972-01',
    code: 'TMP-MF-OPS-01',
    name: 'Standard Microfinance Branch Officer Foundation Blueprint',
    description: 'Comprehensive 4-module pedagogical structure designed for grassroots field officers. Includes diagnostics, field simulations, and formal compliance sign-offs.',
    categoryTags: ['Microfinance', 'Compliance', 'Field Operations', 'Branch Banking'],
    scope: 'lms',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    version: 1,
    status: 'active',
    usedCount: 8,
    visibility: { mode: 'all_lms_instructors' },
    createdBy: 'Farhana Ahmed',
    createdById: 'usr-brac-1',
    createdAt: '12/01/2026 09:30:00',
    updatedAt: '24/02/2026 14:15:00',
    structure: {
      modules: [
        {
          moduleId: 'm-01',
          order: 1,
          title: 'Module 1: Regulatory Framework & Client Protection Principles',
          description: 'Ethical lending guidelines and grassroots compliance standards.',
          contentSlots: [
            { slotId: 's-01', order: 1, title: 'Orientation & Regulatory Policy Video', type: 'video', required: true, estimatedMinutes: 15 },
            { slotId: 's-02', order: 2, title: 'BRAC Client Protection Manual (SOP)', type: 'reading', required: true, estimatedMinutes: 20 },
            { slotId: 's-03', order: 3, title: 'Ethical Lending & Fair Treatment Quiz', type: 'quiz', required: true, estimatedMinutes: 15 }
          ]
        },
        {
          moduleId: 'm-02',
          order: 2,
          title: 'Module 2: Village Organization (VO) Meeting Protocols & Cash Handling',
          description: 'Step-by-step procedures for weekly collection meetings and vault reconciliations.',
          contentSlots: [
            { slotId: 's-04', order: 1, title: 'VO Meeting Conduct Demonstration Video', type: 'video', required: true, estimatedMinutes: 20 },
            { slotId: 's-05', order: 2, title: 'Cash Reconciliation & Daily Ledger Interactive Lab', type: 'interactive_lab', required: true, estimatedMinutes: 30 },
            { slotId: 's-06', order: 3, title: 'Discrepancy Resolution & Escalation Guide', type: 'article', required: false, estimatedMinutes: 10 }
          ]
        },
        {
          moduleId: 'm-03',
          order: 3,
          title: 'Module 3: Field Appraisal & Risk Assessment Methodologies',
          description: 'Evaluating household cashflow and enterprise viability.',
          contentSlots: [
            { slotId: 's-07', order: 1, title: 'Household Cashflow Assessment SCORM Package', type: 'scorm', required: true, estimatedMinutes: 25 },
            { slotId: 's-08', order: 2, title: 'Simulated Loan Appraisal Case Study', type: 'assignment', required: true, estimatedMinutes: 40 },
            { slotId: 's-09', order: 3, title: 'Appraisal Quality Check Assessment', type: 'quiz', required: true, estimatedMinutes: 15 }
          ]
        },
        {
          moduleId: 'm-04',
          order: 4,
          title: 'Module 4: Final Practical Evaluation & Certification Readiness',
          description: 'Summative assessment and instructor evaluation session.',
          contentSlots: [
            { slotId: 's-10', order: 1, title: 'Live Field Debrief & Review Session', type: 'live_session', required: true, estimatedMinutes: 60 },
            { slotId: 's-11', order: 2, title: 'Final Comprehensive Microfinance Exam', type: 'quiz', required: true, estimatedMinutes: 45 },
            { slotId: 's-12', order: 3, title: 'End of Course Program Evaluation Survey', type: 'article', required: true, estimatedMinutes: 10 }
          ]
        }
      ],
      requiredComponents: [
        { id: 'comp-pre-assess', name: 'Learner Diagnostic Baseline', description: 'Diagnostic test before starting module 1', category: 'assessment', enabled: true },
        { id: 'comp-feedback-survey', name: 'End-of-Course Feedback Survey', description: 'Learner survey before certificate unlock', category: 'feedback', enabled: true },
        { id: 'comp-final-exam', name: 'Comprehensive Evaluation Exam', description: 'Passing score >= 80% on module 4 final quiz', category: 'assessment', enabled: true },
        { id: 'comp-cert-issue', name: 'Verified Digital Credential Issuance', description: 'Issues BRAC Executive Standard Certificate', category: 'certificate', enabled: true }
      ],
      structuralDefaults: {
        passingScorePercent: 80,
        completionTracking: 'all_slots',
        sequentialUnlock: true,
        certificateEnabled: true,
        allowRetakes: true,
        maxRetakeAttempts: 3,
        pace: 'cohort_scheduled'
      }
    }
  },
  {
    id: 'CTMP-1972-02',
    code: 'TMP-LEAD-EXEC-02',
    name: 'Executive Leadership & Field Management Masterclass Blueprint',
    description: '3-module advanced managerial template incorporating leadership case studies, synchronous webinars, and peer coaching assignments.',
    categoryTags: ['Leadership', 'Management', 'Strategy', 'Executive'],
    scope: 'lms',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    version: 1,
    status: 'active',
    usedCount: 5,
    visibility: { mode: 'all_lms_instructors' },
    createdBy: 'Tanvir Hossain',
    createdById: 'usr-brac-2',
    createdAt: '18/01/2026 11:00:00',
    updatedAt: '20/02/2026 16:40:00',
    structure: {
      modules: [
        {
          moduleId: 'm-01',
          order: 1,
          title: 'Module 1: Strategic Vision & People Leadership in Crisis',
          description: 'Navigating organizational changes and team motivation.',
          contentSlots: [
            { slotId: 's-01', order: 1, title: 'Executive Keynote: Adaptive Leadership', type: 'video', required: true, estimatedMinutes: 25 },
            { slotId: 's-02', order: 2, title: 'Case Study: Managing Large Field Units', type: 'reading', required: true, estimatedMinutes: 30 },
            { slotId: 's-03', order: 3, title: 'Reflective Leadership Journal', type: 'assignment', required: true, estimatedMinutes: 45 }
          ]
        },
        {
          moduleId: 'm-02',
          order: 2,
          title: 'Module 2: Operational Analytics & Performance Metrics',
          description: 'Leveraging data for branch optimization and KPI management.',
          contentSlots: [
            { slotId: 's-04', order: 1, title: 'Executive Dashboard & KPI Walkthrough', type: 'video', required: true, estimatedMinutes: 20 },
            { slotId: 's-05', order: 2, title: 'Scenario Simulation: Branch Turnaround', type: 'simulation', required: true, estimatedMinutes: 35 },
            { slotId: 's-06', order: 3, title: 'Data-Driven Decision Making Quiz', type: 'quiz', required: true, estimatedMinutes: 20 }
          ]
        },
        {
          moduleId: 'm-03',
          order: 3,
          title: 'Module 3: Executive Coaching & Capstone Defense',
          description: 'Live presentation of strategic branch transformation project.',
          contentSlots: [
            { slotId: 's-07', order: 1, title: 'Live Executive Round Table & Defense', type: 'live_session', required: true, estimatedMinutes: 90 },
            { slotId: 's-08', order: 2, title: 'Capstone Project Proposal Document', type: 'assignment', required: true, estimatedMinutes: 60 },
            { slotId: 's-09', order: 3, title: '360 Leadership Feedback Survey', type: 'article', required: true, estimatedMinutes: 15 }
          ]
        }
      ],
      requiredComponents: [
        { id: 'comp-feedback-survey', name: 'End-of-Course Feedback Survey', description: 'Executive feedback', category: 'feedback', enabled: true },
        { id: 'comp-cert-issue', name: 'Verified Digital Credential Issuance', description: 'Executive Leadership Credential', category: 'certificate', enabled: true }
      ],
      structuralDefaults: {
        passingScorePercent: 85,
        completionTracking: 'required_slots_only',
        sequentialUnlock: false,
        certificateEnabled: true,
        allowRetakes: false,
        pace: 'instructor_led'
      }
    }
  },
  {
    id: 'CTMP-1972-03',
    code: 'TMP-CLIM-EMERG-03',
    name: 'Climate Disaster Rapid Emergency Response Protocol Blueprint',
    description: 'High-urgency 4-module framework structured for rapid deployment in flood, cyclone, and climate relief zones. Features disaster decision simulations.',
    categoryTags: ['Climate Resilience', 'Disaster Management', 'Emergency Response', 'Safety'],
    scope: 'lms',
    lmsId: 'LMS-1972-04',
    lmsName: 'Climate Resilience & Disaster Management Hub',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    version: 1,
    status: 'active',
    usedCount: 4,
    visibility: { mode: 'all_lms_instructors' },
    createdBy: 'Shakil Anwar',
    createdById: 'usr-brac-shakil',
    createdAt: '02/02/2026 10:15:00',
    updatedAt: '15/02/2026 12:00:00',
    structure: {
      modules: [
        {
          moduleId: 'm-01',
          order: 1,
          title: 'Module 1: Early Warning Indicators & Community Mobilization',
          description: 'Disaster warning levels, sirens, and swift community alerts.',
          contentSlots: [
            { slotId: 's-01', order: 1, title: 'Early Warning Protocols Video', type: 'video', required: true, estimatedMinutes: 15 },
            { slotId: 's-02', order: 2, title: 'Community Evacuation Checklist', type: 'reading', required: true, estimatedMinutes: 15 },
            { slotId: 's-03', order: 3, title: 'Warning Level Recognition Quiz', type: 'quiz', required: true, estimatedMinutes: 15 }
          ]
        },
        {
          moduleId: 'm-02',
          order: 2,
          title: 'Module 2: Emergency Relief Supply Chain & Cold-Chain Logistics',
          description: 'Managing medical rations, water purification, and shelter supplies.',
          contentSlots: [
            { slotId: 's-04', order: 1, title: 'Relief Inventory Management SCORM', type: 'scorm', required: true, estimatedMinutes: 20 },
            { slotId: 's-05', order: 2, title: 'Cold-Chain & Water Purification SOPs', type: 'article', required: true, estimatedMinutes: 15 },
            { slotId: 's-06', order: 3, title: 'Relief Distribution Simulation', type: 'simulation', required: true, estimatedMinutes: 25 }
          ]
        },
        {
          moduleId: 'm-03',
          order: 3,
          title: 'Module 3: Rapid Damage & Needs Assessment (RDNA)',
          description: 'Standardized digital tools for on-ground survey reporting.',
          contentSlots: [
            { slotId: 's-07', order: 1, title: 'RDNA Mobile Tool Demonstration', type: 'video', required: true, estimatedMinutes: 15 },
            { slotId: 's-08', order: 2, title: 'Simulated Damage Survey Exercise', type: 'interactive_lab', required: true, estimatedMinutes: 30 },
            { slotId: 's-09', order: 3, title: 'Field Data Integrity Check Quiz', type: 'quiz', required: true, estimatedMinutes: 15 }
          ]
        },
        {
          moduleId: 'm-04',
          order: 4,
          title: 'Module 4: Post-Crisis Recovery & Psycho-Social First Aid',
          description: 'Supporting vulnerable households and trauma mitigation.',
          contentSlots: [
            { slotId: 's-10', order: 1, title: 'Psycho-Social Support Guide', type: 'reading', required: true, estimatedMinutes: 20 },
            { slotId: 's-11', order: 2, title: 'Final Certification Exam', type: 'quiz', required: true, estimatedMinutes: 30 }
          ]
        }
      ],
      requiredComponents: [
        { id: 'comp-pre-assess', name: 'Learner Diagnostic Baseline', description: 'Diagnostic test', category: 'assessment', enabled: true },
        { id: 'comp-final-exam', name: 'Comprehensive Evaluation Exam', description: 'Emergency response test', category: 'assessment', enabled: true },
        { id: 'comp-cert-issue', name: 'Verified Digital Credential Issuance', description: 'Climate Disaster Certification', category: 'certificate', enabled: true }
      ],
      structuralDefaults: {
        passingScorePercent: 80,
        completionTracking: 'all_slots',
        sequentialUnlock: true,
        certificateEnabled: true,
        allowRetakes: true,
        maxRetakeAttempts: 5,
        pace: 'self_paced'
      }
    }
  },
  {
    id: 'CTMP-1972-04',
    code: 'TMP-UPG-COACH-04',
    name: 'Ultra-Poor Graduation Household Mentorship Plan Blueprint',
    description: '3-module holistic coaching blueprint designed for field mentors assisting families transitioning out of extreme poverty.',
    categoryTags: ['Ultra-Poor Graduation', 'Social Development', 'Mentorship', 'Asset Transfer'],
    scope: 'lms',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    version: 1,
    status: 'active',
    usedCount: 3,
    visibility: { mode: 'all_lms_instructors' },
    createdBy: 'Nusrat Jahan',
    createdById: 'usr-brac-3',
    createdAt: '10/02/2026 14:20:00',
    updatedAt: '25/02/2026 11:30:00',
    structure: {
      modules: [
        {
          moduleId: 'm-01',
          order: 1,
          title: 'Module 1: Household Asset Selection & Enterprise Planning',
          description: 'Assisting participants in choosing sustainable livelihood assets.',
          contentSlots: [
            { slotId: 's-01', order: 1, title: 'Asset Transfer Model Video Lecture', type: 'video', required: true, estimatedMinutes: 20 },
            { slotId: 's-02', order: 2, title: 'Livestock & Retail Enterprise SOPs', type: 'reading', required: true, estimatedMinutes: 25 },
            { slotId: 's-03', order: 3, title: 'Asset Feasibility Check Quiz', type: 'quiz', required: true, estimatedMinutes: 15 }
          ]
        },
        {
          moduleId: 'm-02',
          order: 2,
          title: 'Module 2: Weekly Household Coaching & Financial Literacy',
          description: 'Budgeting, emergency savings, and health hygiene facilitation.',
          contentSlots: [
            { slotId: 's-04', order: 1, title: 'Household Visit Coaching Demonstration', type: 'video', required: true, estimatedMinutes: 20 },
            { slotId: 's-05', order: 2, title: 'Passbook Savings Interactive Exercise', type: 'interactive_lab', required: true, estimatedMinutes: 25 },
            { slotId: 's-06', order: 3, title: 'Family Health & Nutrition Module', type: 'article', required: false, estimatedMinutes: 15 }
          ]
        },
        {
          moduleId: 'm-03',
          order: 3,
          title: 'Module 3: Graduation Criteria Audit & Mentorship Sign-off',
          description: 'Evaluating household criteria metrics for formal graduation.',
          contentSlots: [
            { slotId: 's-07', order: 1, title: 'Graduation Assessment Rubric Review', type: 'reading', required: true, estimatedMinutes: 20 },
            { slotId: 's-08', order: 2, title: 'Final Mentor Certification Exam', type: 'quiz', required: true, estimatedMinutes: 30 }
          ]
        }
      ],
      requiredComponents: [
        { id: 'comp-final-exam', name: 'Comprehensive Evaluation Exam', description: 'Passing score >= 80%', category: 'assessment', enabled: true },
        { id: 'comp-cert-issue', name: 'Verified Digital Credential Issuance', description: 'Graduation Coach Credential', category: 'certificate', enabled: true }
      ],
      structuralDefaults: {
        passingScorePercent: 80,
        completionTracking: 'all_slots',
        sequentialUnlock: true,
        certificateEnabled: true,
        allowRetakes: true,
        maxRetakeAttempts: 2,
        pace: 'cohort_scheduled'
      }
    }
  },
  {
    id: 'CTMP-1972-05',
    code: 'TMP-SEC-BASE-05',
    name: 'Self-Paced Digital Compliance & Security Baseline (Draft)',
    description: 'Work-in-progress modular blueprint for mandatory cybersecurity and data privacy compliance.',
    categoryTags: ['Compliance & Security', 'Cybersecurity', 'Data Privacy', 'Self-Paced'],
    scope: 'lms',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    version: 1,
    status: 'draft',
    usedCount: 0,
    visibility: { mode: 'restricted', allowedUserIds: ['usr-brac-1'] },
    createdBy: 'Farhana Ahmed',
    createdById: 'usr-brac-1',
    createdAt: '26/02/2026 15:45:00',
    updatedAt: '27/02/2026 17:10:00',
    structure: {
      modules: [
        {
          moduleId: 'm-01',
          order: 1,
          title: 'Module 1: Information Security & Phishing Awareness',
          description: 'Basic cyber hygiene and spotting deceptive emails.',
          contentSlots: [
            { slotId: 's-01', order: 1, title: 'Phishing Threat Vector Briefing', type: 'video', required: true, estimatedMinutes: 10 },
            { slotId: 's-02', order: 2, title: 'Simulated Suspicious Email Exercise', type: 'interactive_lab', required: true, estimatedMinutes: 15 },
            { slotId: 's-03', order: 3, title: 'Password & MFA Standards Quiz', type: 'quiz', required: true, estimatedMinutes: 10 }
          ]
        },
        {
          moduleId: 'm-02',
          order: 2,
          title: 'Module 2: Client Data Privacy & GDPR Compliance',
          description: 'Safeguarding personal data and reporting breaches.',
          contentSlots: [
            { slotId: 's-04', order: 1, title: 'Data Privacy Guidelines (Reading)', type: 'reading', required: true, estimatedMinutes: 15 },
            { slotId: 's-05', order: 2, title: 'Incident Escalation Protocol', type: 'article', required: true, estimatedMinutes: 10 },
            { slotId: 's-06', order: 3, title: 'Security Baseline Final Quiz', type: 'quiz', required: true, estimatedMinutes: 15 }
          ]
        }
      ],
      requiredComponents: [
        { id: 'comp-final-exam', name: 'Comprehensive Evaluation Exam', description: 'Passing score >= 85%', category: 'assessment', enabled: true },
        { id: 'comp-cert-issue', name: 'Verified Digital Credential Issuance', description: 'Security Compliance Certificate', category: 'certificate', enabled: true }
      ],
      structuralDefaults: {
        passingScorePercent: 85,
        completionTracking: 'all_slots',
        sequentialUnlock: true,
        certificateEnabled: true,
        allowRetakes: true,
        maxRetakeAttempts: 3,
        pace: 'self_paced'
      }
    }
  }
];

// Helper: Deep copy template structure for course creation (Snapshot Decoupling!)
export function deepCopyTemplateStructure(structure: CourseTemplateStructure): CourseTemplateStructure {
  return JSON.parse(JSON.stringify(structure));
}

export function calculateTemplateDuration(input: CourseTemplate | CourseTemplateStructure): number {
  if (!input) return 0;
  const modules = 'structure' in input ? input.structure?.modules : input?.modules;
  if (!modules) return 0;
  return modules.reduce((acc, mod) => {
    return acc + (mod.contentSlots || []).reduce((slotAcc, slot) => slotAcc + (slot.estimatedMinutes || 0), 0);
  }, 0);
}

export function countTemplateSlots(input: CourseTemplate | CourseTemplateStructure): number {
  if (!input) return 0;
  const modules = 'structure' in input ? input.structure?.modules : input?.modules;
  if (!modules) return 0;
  return modules.reduce((acc, mod) => acc + (mod.contentSlots?.length || 0), 0);
}

