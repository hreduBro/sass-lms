export type SkillCategory = 
  | 'Technical' 
  | 'Behavioral' 
  | 'Leadership' 
  | 'Functional' 
  | 'Compliance' 
  | 'Operations' 
  | 'Domain Knowledge';

export type SkillStatus = 'active' | 'inactive' | 'draft';

export type SkillTargetType = 'content' | 'class' | 'course' | 'phase' | 'plan';

export interface Skill {
  skillId: string;                     // Unique system ID (e.g. 'skl-001')
  skillCode: string;                   // System code (e.g. 'SKL-0001' or 'TECH-0001')
  name: string;                        // Required
  description: string;                 // Required
  category: SkillCategory | string;    // Required
  clusterId?: string;                  // Optional cluster assignment
  clusterName?: string;
  levels?: string[];                   // e.g. ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  status: SkillStatus;
  sharing?: {
    level: 'lms' | 'organization' | 'private';
    lmsId?: string;
    organizationId?: string;
  };
  mappedElementCount: number;
  learnersAcquiredCount: number;
  createdBy: string;
  createdAt: string;                   // DD/MM/YYYY
  updatedAt: string;                   // DD/MM/YYYY
}

export interface SkillCluster {
  clusterId: string;
  clusterCode: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  skillCount?: number;
  createdBy: string;
  createdAt: string;                   // DD/MM/YYYY
  updatedAt: string;                   // DD/MM/YYYY
}

export interface SkillMapping {
  mappingId: string;
  skillId: string;
  skillName?: string;
  targetType: SkillTargetType;
  targetId: string;
  targetName?: string;
  achievementRule?: string;
  mappedBy: string;
  mappedAt: string;                   // DD/MM/YYYY
}

export interface LearnerSkillProgress {
  learnerId: string;
  learnerName: string;
  skillId: string;
  skillName: string;
  skillCategory: string;
  acquired: boolean;
  level: string;                       // e.g. 'Intermediate', 'Advanced'
  progressPercent: number;             // 0 to 100
  contributingElements: {
    targetType: SkillTargetType;
    targetId: string;
    targetName: string;
    completedAt: string;
  }[];
  linkedCredentials: {
    type: 'badge' | 'certificate';
    id: string;
    title: string;
  }[];
  firstAcquiredAt?: string;
  updatedAt: string;
}

export interface SkillChangeLog {
  logId: string;
  skillId: string;
  skillName: string;
  changedBy: string;
  changedAt: string;                   // DD:MM:YYYY HH:MM:SS
  changedFields: string[];
  propagatedTargetCount: number;
  summary: string;
}

export interface SkillPermissions {
  canViewFeature: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageClusters: boolean;
  canMapToElements: boolean;
  canViewReports: boolean;
  canManageDashboardStudio: boolean;
}

// Initial Mock Seed Data
export const INITIAL_SKILL_CLUSTERS: SkillCluster[] = [
  {
    clusterId: 'cls-001',
    clusterCode: 'CLS-DATA-01',
    name: 'Data & Analytics Competency',
    description: 'Core skills relating to relational querying, reporting, data hygiene, and performance metrics.',
    status: 'active',
    skillCount: 3,
    createdBy: 'System Admin',
    createdAt: '10/01/2026',
    updatedAt: '15/02/2026'
  },
  {
    clusterId: 'cls-002',
    clusterCode: 'CLS-ETHICS-02',
    name: 'Field Operations & Ethics',
    description: 'Smart Campaign Client Protection Standards, Village Disbursement, and Field Audit Compliance.',
    status: 'active',
    skillCount: 3,
    createdBy: 'Compliance Officer',
    createdAt: '12/01/2026',
    updatedAt: '20/02/2026'
  },
  {
    clusterId: 'cls-003',
    clusterCode: 'CLS-LEAD-03',
    name: 'Leadership & Team Management',
    description: 'Branch management, agile team coaching, conflict resolution, and strategic planning.',
    status: 'active',
    skillCount: 2,
    createdBy: 'HR Director',
    createdAt: '01/02/2026',
    updatedAt: '25/02/2026'
  },
  {
    clusterId: 'cls-004',
    clusterCode: 'CLS-TECH-04',
    name: 'Digital Systems & Mobile POS',
    description: 'Tablet POS operations, offline sync recovery, security protocols, and mobile banking app usage.',
    status: 'active',
    skillCount: 2,
    createdBy: 'IT Operations',
    createdAt: '05/02/2026',
    updatedAt: '28/02/2026'
  }
];

export const INITIAL_SKILLS: Skill[] = [
  {
    skillId: 'skl-001',
    skillCode: 'SKL-0001',
    name: 'SQL Querying & Data Extraction',
    description: 'Proficiency in writing complex SELECT queries, JOINs, aggregations, and data exports for business analytics.',
    category: 'Technical',
    clusterId: 'cls-001',
    clusterName: 'Data & Analytics Competency',
    levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    status: 'active',
    mappedElementCount: 4,
    learnersAcquiredCount: 42,
    createdBy: 'System Admin',
    createdAt: '12/01/2026',
    updatedAt: '20/02/2026'
  },
  {
    skillId: 'skl-002',
    skillCode: 'SKL-0002',
    name: 'Client Protection & Transparency Protocols',
    description: 'Adherence to Smart Campaign standards regarding transparent pricing, fair treatment, and respectful debt collection.',
    category: 'Compliance',
    clusterId: 'cls-002',
    clusterName: 'Field Operations & Ethics',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    status: 'active',
    mappedElementCount: 6,
    learnersAcquiredCount: 128,
    createdBy: 'Compliance Officer',
    createdAt: '15/01/2026',
    updatedAt: '22/02/2026'
  },
  {
    skillId: 'skl-003',
    skillCode: 'SKL-0003',
    name: 'Micro-Disbursement POS Operations',
    description: 'Operating mobile point-of-sale hardware, cash reconciliation, biometrics verification, and receipt issuance.',
    category: 'Operations',
    clusterId: 'cls-004',
    clusterName: 'Digital Systems & Mobile POS',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    status: 'active',
    mappedElementCount: 5,
    learnersAcquiredCount: 95,
    createdBy: 'IT Operations',
    createdAt: '18/01/2026',
    updatedAt: '25/02/2026'
  },
  {
    skillId: 'skl-004',
    skillCode: 'SKL-0004',
    name: 'Agile Branch Team Leadership',
    description: 'Coaching loan officers, managing daily huddles, velocity tracking, and empathetic team motivation.',
    category: 'Leadership',
    clusterId: 'cls-003',
    clusterName: 'Leadership & Team Management',
    levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    status: 'active',
    mappedElementCount: 3,
    learnersAcquiredCount: 24,
    createdBy: 'HR Director',
    createdAt: '02/02/2026',
    updatedAt: '26/02/2026'
  },
  {
    skillId: 'skl-005',
    skillCode: 'SKL-0005',
    name: 'Data Privacy & GDPR / National Compliance',
    description: 'Handling personal identifiable information (PII), customer consent records, and data breach escalation.',
    category: 'Compliance',
    clusterId: 'cls-002',
    clusterName: 'Field Operations & Ethics',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    status: 'active',
    mappedElementCount: 5,
    learnersAcquiredCount: 150,
    createdBy: 'Compliance Officer',
    createdAt: '05/02/2026',
    updatedAt: '27/02/2026'
  },
  {
    skillId: 'skl-006',
    skillCode: 'SKL-0006',
    name: 'Financial Modeling & Portfolio Risk Assessment',
    description: 'Analyzing non-performing loans (NPL), yield calculations, provisioning, and portfolio stress testing.',
    category: 'Domain Knowledge',
    clusterId: 'cls-001',
    clusterName: 'Data & Analytics Competency',
    levels: ['Intermediate', 'Advanced', 'Expert'],
    status: 'active',
    mappedElementCount: 2,
    learnersAcquiredCount: 18,
    createdBy: 'System Admin',
    createdAt: '10/02/2026',
    updatedAt: '28/02/2026'
  },
  {
    skillId: 'skl-007',
    skillCode: 'SKL-0007',
    name: 'Conflict Resolution in Field Operations',
    description: 'De-escalating customer grievances, resolving group loan disputes, and maintaining community rapport.',
    category: 'Behavioral',
    clusterId: 'cls-003',
    clusterName: 'Leadership & Team Management',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    status: 'active',
    mappedElementCount: 3,
    learnersAcquiredCount: 60,
    createdBy: 'HR Director',
    createdAt: '14/02/2026',
    updatedAt: '28/02/2026'
  },
  {
    skillId: 'skl-008',
    skillCode: 'SKL-0008',
    name: 'Legacy Micro-Credit Manual Ledger Accounting',
    description: 'Historical manual ledger maintenance. Phased out in favor of digital POS.',
    category: 'Operations',
    clusterId: undefined,
    levels: ['Beginner'],
    status: 'inactive',
    mappedElementCount: 0,
    learnersAcquiredCount: 12,
    createdBy: 'System Admin',
    createdAt: '01/01/2025',
    updatedAt: '10/01/2026'
  }
];

export const INITIAL_SKILL_MAPPINGS: SkillMapping[] = [
  {
    mappingId: 'map-001',
    skillId: 'skl-001',
    skillName: 'SQL Querying & Data Extraction',
    targetType: 'plan',
    targetId: 'plan-001',
    targetName: 'Field Credit Operations & Data Analytics Certification 2026',
    achievementRule: 'Complete Phase 2 Database Modules with >= 80% score',
    mappedBy: 'System Admin',
    mappedAt: '15/01/2026'
  },
  {
    mappingId: 'map-002',
    skillId: 'skl-001',
    skillName: 'SQL Querying & Data Extraction',
    targetType: 'course',
    targetId: 'crs-101',
    targetName: 'Advanced SQL for Financial Analysts',
    achievementRule: 'Pass final practical assessment',
    mappedBy: 'System Admin',
    mappedAt: '20/01/2026'
  },
  {
    mappingId: 'map-003',
    skillId: 'skl-002',
    skillName: 'Client Protection & Transparency Protocols',
    targetType: 'plan',
    targetId: 'plan-001',
    targetName: 'Field Credit Operations & Data Analytics Certification 2026',
    achievementRule: 'Complete Ethics Phase with 100% attendance & pass pre/post test',
    mappedBy: 'Compliance Officer',
    mappedAt: '16/01/2026'
  },
  {
    mappingId: 'map-004',
    skillId: 'skl-002',
    skillName: 'Client Protection & Transparency Protocols',
    targetType: 'phase',
    targetId: 'phs-001',
    targetName: 'Phase 1: Field Ethics & Client Protection Foundation',
    achievementRule: 'Pass Ethics Exam',
    mappedBy: 'Compliance Officer',
    mappedAt: '18/01/2026'
  },
  {
    mappingId: 'map-005',
    skillId: 'skl-003',
    skillName: 'Micro-Disbursement POS Operations',
    targetType: 'course',
    targetId: 'crs-102',
    targetName: 'POS Hardware & Offline Sync Mastery',
    achievementRule: 'Complete simulation exam without errors',
    mappedBy: 'IT Operations',
    mappedAt: '22/01/2026'
  },
  {
    mappingId: 'map-006',
    skillId: 'skl-004',
    skillName: 'Agile Branch Team Leadership',
    targetType: 'plan',
    targetId: 'plan-002',
    targetName: 'Senior Branch Manager Leadership Academy',
    achievementRule: 'Complete leadership portfolio & peer review',
    mappedBy: 'HR Director',
    mappedAt: '05/02/2026'
  },
  {
    mappingId: 'map-007',
    skillId: 'skl-005',
    skillName: 'Data Privacy & GDPR / National Compliance',
    targetType: 'content',
    targetId: 'cnt-201',
    targetName: 'PII Data Handling Guidelines PDF Guide',
    achievementRule: 'Read and acknowledge compliance policy',
    mappedBy: 'Compliance Officer',
    mappedAt: '10/02/2026'
  }
];

export const INITIAL_LEARNER_SKILL_PROGRESS: LearnerSkillProgress[] = [
  {
    learnerId: 'usr-001',
    learnerName: 'Trainee User',
    skillId: 'skl-001',
    skillName: 'SQL Querying & Data Extraction',
    skillCategory: 'Technical',
    acquired: true,
    level: 'Advanced',
    progressPercent: 85,
    contributingElements: [
      { targetType: 'course', targetId: 'crs-101', targetName: 'Advanced SQL for Financial Analysts', completedAt: '15/02/2026' }
    ],
    linkedCredentials: [
      { type: 'badge', id: 'bdg-001', title: 'Data Analyst Specialist Badge' }
    ],
    firstAcquiredAt: '15/02/2026',
    updatedAt: '25/02/2026'
  },
  {
    learnerId: 'usr-001',
    learnerName: 'Trainee User',
    skillId: 'skl-002',
    skillName: 'Client Protection & Transparency Protocols',
    skillCategory: 'Compliance',
    acquired: true,
    level: 'Expert',
    progressPercent: 100,
    contributingElements: [
      { targetType: 'phase', targetId: 'phs-001', targetName: 'Phase 1: Field Ethics & Client Protection Foundation', completedAt: '20/01/2026' }
    ],
    linkedCredentials: [
      { type: 'certificate', id: 'cert-001', title: 'Certified Client Protection Officer' }
    ],
    firstAcquiredAt: '20/01/2026',
    updatedAt: '20/01/2026'
  },
  {
    learnerId: 'usr-001',
    learnerName: 'Trainee User',
    skillId: 'skl-003',
    skillName: 'Micro-Disbursement POS Operations',
    skillCategory: 'Operations',
    acquired: true,
    level: 'Intermediate',
    progressPercent: 70,
    contributingElements: [
      { targetType: 'course', targetId: 'crs-102', targetName: 'POS Hardware & Offline Sync Mastery', completedAt: '28/02/2026' }
    ],
    linkedCredentials: [],
    firstAcquiredAt: '28/02/2026',
    updatedAt: '28/02/2026'
  },
  {
    learnerId: 'usr-001',
    learnerName: 'Trainee User',
    skillId: 'skl-005',
    skillName: 'Data Privacy & GDPR / National Compliance',
    skillCategory: 'Compliance',
    acquired: false,
    level: 'Beginner',
    progressPercent: 40,
    contributingElements: [],
    linkedCredentials: [],
    updatedAt: '28/02/2026'
  }
];

export const INITIAL_SKILL_CHANGE_LOGS: SkillChangeLog[] = [
  {
    logId: 'log-001',
    skillId: 'skl-001',
    skillName: 'SQL Querying & Data Extraction',
    changedBy: 'System Admin',
    changedAt: '20:02:2026 14:30:00',
    changedFields: ['description', 'levels'],
    propagatedTargetCount: 4,
    summary: 'Updated proficiency level descriptors and extended description to cover CTEs and window functions.'
  },
  {
    logId: 'log-002',
    skillId: 'skl-002',
    skillName: 'Client Protection & Transparency Protocols',
    changedBy: 'Compliance Officer',
    changedAt: '22:02:2026 09:15:00',
    changedFields: ['category'],
    propagatedTargetCount: 6,
    summary: 'Reclassified category to Compliance to align with national regulatory guidelines.'
  }
];
