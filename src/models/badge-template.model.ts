import { CanvasElement, ElementOverflowMode } from './certificate-template.model';

export type BadgeTemplateStatus = 'draft' | 'published' | 'archived';
export type BadgeSharingLevel = 'private' | 'lms' | 'organization';
export type BadgeCategory = 'Skill' | 'Achievement' | 'Participation' | 'Milestone' | 'Certification';
export type BadgeLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4' | 'Level 5';
export type BadgeBaseShape = 'Circle' | 'Shield' | 'Hexagon' | 'Star' | 'Ribbon' | 'Rosette' | 'Square';

export interface BadgeEmblem {
  source: 'upload' | 'base-shape';
  artUrl?: string;
  mime?: string;
  sizeBytes?: number;
  baseShape?: BadgeBaseShape;
  fillColor?: string;
  accentColor?: string;
  gradient?: string;
  iconRef?: string;
}

export interface BadgeCanvas {
  widthPx: number;
  heightPx: number;
}

export interface BadgeEarningValidity {
  amount: number;
  unit: 'days' | 'months' | 'years';
}

export interface BadgeEarningMetadata {
  criteria: string;
  level?: string;
  skillTags: string[];
  expires: boolean;
  validity?: BadgeEarningValidity;
  issuerName?: string;
  machineRule?: string | null;
}

export type BadgeElement = CanvasElement;

export interface BadgeSharingPolicy {
  level: BadgeSharingLevel;
  lmsId?: string;
  organizationId?: string;
}

export interface BadgeTemplate {
  templateId: string;
  templateKind: 'badge';
  name: string;
  description?: string;
  category?: BadgeCategory;
  emblem: BadgeEmblem;
  canvas: BadgeCanvas;
  earning: BadgeEarningMetadata;
  elements: BadgeElement[];
  sharing: BadgeSharingPolicy;
  status: BadgeTemplateStatus;
  version: number;
  creationStatus: 'draft' | 'saved';
  lastCompletedStep: 'emblem-details' | 'designer' | 'preview';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  mappedElementCount?: number;
}

export interface BadgePermissions {
  canViewFeature: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDuplicate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canSetOrgWideSharing: boolean;
  canManageDashboardStudio: boolean;
}

export interface BadgePlaceholderToken {
  key: string;
  label: string;
  category: 'Badge' | 'Learner' | 'Course & Plan' | 'System';
  sampleValue: string;
  description: string;
  icon: string;
  defaultStyle: {
    fontSizePt: number;
    bold: boolean;
    align: 'left' | 'center' | 'right';
    color: string;
  };
}

export const BADGE_PLACEHOLDER_TOKENS: BadgePlaceholderToken[] = [
  {
    key: '{{badge_name}}',
    label: 'Badge Name / Label',
    category: 'Badge',
    sampleValue: 'Data Analyst Gold',
    description: 'Main display title of the badge',
    icon: 'military_tech',
    defaultStyle: { fontSizePt: 16, bold: true, align: 'center', color: '#0f172a' }
  },
  {
    key: '{{badge_level}}',
    label: 'Badge Level / Tier',
    category: 'Badge',
    sampleValue: 'GOLD TIER',
    description: 'Level or tier of the badge (e.g. Bronze, Gold)',
    icon: 'stars',
    defaultStyle: { fontSizePt: 12, bold: true, align: 'center', color: '#b45309' }
  },
  {
    key: '{{trainee_name}}',
    label: 'Recipient / Trainee Name',
    category: 'Learner',
    sampleValue: 'Ayesha Rahman',
    description: 'Full name of the badge earner',
    icon: 'person',
    defaultStyle: { fontSizePt: 11, bold: false, align: 'center', color: '#334155' }
  },
  {
    key: '{{course_name}}',
    label: 'Course Name',
    category: 'Course & Plan',
    sampleValue: 'Advanced Data Science & AI',
    description: 'Name of the course associated with badge award',
    icon: 'menu_book',
    defaultStyle: { fontSizePt: 10, bold: false, align: 'center', color: '#475569' }
  },
  {
    key: '{{plan_name}}',
    label: 'Parent Plan Name',
    category: 'Course & Plan',
    sampleValue: 'Executive Leadership Track 2026',
    description: 'Parent learning plan title',
    icon: 'schema',
    defaultStyle: { fontSizePt: 10, bold: false, align: 'center', color: '#475569' }
  },
  {
    key: '{{issue_date}}',
    label: 'Issue Date',
    category: 'System',
    sampleValue: '31/08/2026',
    description: 'Date badge was awarded',
    icon: 'calendar_today',
    defaultStyle: { fontSizePt: 9, bold: false, align: 'center', color: '#64748b' }
  },
  {
    key: '{{expiry_date}}',
    label: 'Expiry Date',
    category: 'System',
    sampleValue: '31/08/2028',
    description: 'Date badge validity expires if applicable',
    icon: 'event_busy',
    defaultStyle: { fontSizePt: 9, bold: false, align: 'center', color: '#94a3b8' }
  },
  {
    key: '{{organization_name}}',
    label: 'Organization Name',
    category: 'System',
    sampleValue: 'BRAC Global Education Network',
    description: 'Owning organization name',
    icon: 'domain',
    defaultStyle: { fontSizePt: 10, bold: true, align: 'center', color: '#0f172a' }
  },
  {
    key: '{{issuer_name}}',
    label: 'Issuer Name',
    category: 'System',
    sampleValue: 'OneLMS Credentialing Authority',
    description: 'Designated badge issuer entity',
    icon: 'verified',
    defaultStyle: { fontSizePt: 9, bold: false, align: 'center', color: '#475569' }
  },
  {
    key: '{{badge_serial}}',
    label: 'Badge Serial / ID',
    category: 'System',
    sampleValue: 'BDG-2026-88902',
    description: 'Unique tamper-proof issuance serial code',
    icon: 'qr_code_2',
    defaultStyle: { fontSizePt: 8, bold: false, align: 'center', color: '#64748b' }
  }
];

export const INITIAL_BADGE_TEMPLATES: BadgeTemplate[] = [
  {
    templateId: 'BDG-1001',
    templateKind: 'badge',
    name: 'Data Science Specialist – Gold',
    description: 'Awarded to learners who complete all advanced analytics modules with a score above 85%.',
    category: 'Certification',
    emblem: {
      source: 'base-shape',
      baseShape: 'Shield',
      fillColor: '#0d9488',
      accentColor: '#f59e0b',
      iconRef: 'analytics'
    },
    canvas: { widthPx: 512, heightPx: 512 },
    earning: {
      criteria: 'Complete all Phase courses in the Data Analytics Track with score >= 85%.',
      level: 'Gold',
      skillTags: ['Data Analysis', 'Python', 'SQL', 'Data Visualization'],
      expires: true,
      validity: { amount: 2, unit: 'years' },
      issuerName: 'BRAC Learning Institute'
    },
    elements: [
      {
        id: 'el_b1',
        kind: 'placeholder',
        token: '{{badge_name}}',
        x: 10, y: 70, w: 80, h: 12, z: 1,
        style: { fontFamily: 'Inter', fontSizePt: 15, bold: true, italic: false, underline: false, color: '#ffffff', align: 'center', overflow: 'fit' }
      },
      {
        id: 'el_b2',
        kind: 'placeholder',
        token: '{{badge_level}}',
        x: 20, y: 84, w: 60, h: 8, z: 2,
        style: { fontFamily: 'Inter', fontSizePt: 11, bold: true, italic: false, underline: false, color: '#fef08a', align: 'center', overflow: 'fit' }
      }
    ],
    sharing: { level: 'organization', organizationId: 'tenant-brac' },
    status: 'published',
    version: 1,
    creationStatus: 'saved',
    lastCompletedStep: 'preview',
    createdBy: 'Farhana Ahmed',
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15T10:30:00',
    usageCount: 12
  },
  {
    templateId: 'BDG-1002',
    templateKind: 'badge',
    name: 'Agile Leadership Champion',
    description: 'Recognizes excellence in team agile transformation and sprint management.',
    category: 'Skill',
    emblem: {
      source: 'base-shape',
      baseShape: 'Circle',
      fillColor: '#4f46e5',
      accentColor: '#6366f1',
      iconRef: 'groups'
    },
    canvas: { widthPx: 512, heightPx: 512 },
    earning: {
      criteria: 'Lead at least 3 agile phases with 100% submission adherence and peer reviews.',
      level: 'Silver',
      skillTags: ['Agile', 'Scrum', 'Leadership', 'Project Management'],
      expires: false,
      issuerName: 'Global Leadership Academy'
    },
    elements: [
      {
        id: 'el_b3',
        kind: 'placeholder',
        token: '{{badge_name}}',
        x: 15, y: 68, w: 70, h: 12, z: 1,
        style: { fontFamily: 'Inter', fontSizePt: 14, bold: true, italic: false, underline: false, color: '#ffffff', align: 'center', overflow: 'fit' }
      }
    ],
    sharing: { level: 'lms', lmsId: 'LMS-1972-01' },
    status: 'published',
    version: 1,
    creationStatus: 'saved',
    lastCompletedStep: 'preview',
    createdBy: 'Karim Rahman',
    createdAt: '2026-02-20',
    updatedAt: '2026-02-20T14:15:00',
    usageCount: 8
  },
  {
    templateId: 'BDG-1003',
    templateKind: 'badge',
    name: 'Cybersecurity Sentinel Level 1',
    description: 'Foundational badge for completing enterprise security awareness & compliance training.',
    category: 'Certification',
    emblem: {
      source: 'base-shape',
      baseShape: 'Hexagon',
      fillColor: '#0f172a',
      accentColor: '#10b981',
      iconRef: 'security'
    },
    canvas: { widthPx: 512, heightPx: 512 },
    earning: {
      criteria: 'Pass annual security compliance assessment with 100% correct answers.',
      level: 'Level 1',
      skillTags: ['Cybersecurity', 'Compliance', 'Data Privacy'],
      expires: true,
      validity: { amount: 1, unit: 'years' },
      issuerName: 'BRAC IT Security Office'
    },
    elements: [
      {
        id: 'el_b4',
        kind: 'placeholder',
        token: '{{badge_name}}',
        x: 10, y: 72, w: 80, h: 12, z: 1,
        style: { fontFamily: 'Inter', fontSizePt: 13, bold: true, italic: false, underline: false, color: '#34d399', align: 'center', overflow: 'fit' }
      }
    ],
    sharing: { level: 'organization', organizationId: 'tenant-brac' },
    status: 'published',
    version: 1,
    creationStatus: 'saved',
    lastCompletedStep: 'preview',
    createdBy: 'System Administrator',
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01T09:00:00',
    usageCount: 25
  },
  {
    templateId: 'BDG-1004',
    templateKind: 'badge',
    name: 'Financial Modeling Practitioner',
    description: 'Draft template for corporate financial modeling and budget planning.',
    category: 'Milestone',
    emblem: {
      source: 'base-shape',
      baseShape: 'Star',
      fillColor: '#d97706',
      accentColor: '#fbbf24',
      iconRef: 'payments'
    },
    canvas: { widthPx: 512, heightPx: 512 },
    earning: {
      criteria: 'Complete 5 financial case studies and obtain approval from finance director.',
      level: 'Bronze',
      skillTags: ['Finance', 'Excel', 'Budgeting'],
      expires: false,
      issuerName: 'BRAC Finance Unit'
    },
    elements: [],
    sharing: { level: 'private' },
    status: 'draft',
    version: 1,
    creationStatus: 'draft',
    lastCompletedStep: 'designer',
    createdBy: 'Tanvir Hossain',
    createdAt: '2026-04-10',
    updatedAt: '2026-04-10T16:45:00',
    usageCount: 0
  },
  {
    templateId: 'BDG-1005',
    templateKind: 'badge',
    name: 'Community Development Specialist',
    description: 'Legacy badge awarded for field service and rural development training.',
    category: 'Achievement',
    emblem: {
      source: 'base-shape',
      baseShape: 'Ribbon',
      fillColor: '#059669',
      accentColor: '#a7f3d0',
      iconRef: 'nature'
    },
    canvas: { widthPx: 512, heightPx: 512 },
    earning: {
      criteria: 'Complete 100 hours of community development field assignments.',
      level: 'Platinum',
      skillTags: ['Field Work', 'Community', 'Sustainability'],
      expires: false,
      issuerName: 'BRAC Social Innovation Lab'
    },
    elements: [],
    sharing: { level: 'lms', lmsId: 'LMS-1972-01' },
    status: 'archived',
    version: 1,
    creationStatus: 'saved',
    lastCompletedStep: 'preview',
    createdBy: 'Nusrat Jahan',
    createdAt: '2024-11-12',
    updatedAt: '2026-01-05T11:20:00',
    usageCount: 4
  }
];

export type BadgeTargetType = 'content' | 'class' | 'course' | 'phase' | 'plan';

export interface BadgeMapping {
  mappingId: string;
  templateId: string;
  badgeName?: string;
  targetType: BadgeTargetType;
  targetId: string;
  targetName?: string;
  achievementRule?: string;
  mappedBy: string;
  mappedAt: string;
}

export interface EarnedBadge {
  id: string;
  badgeTemplateId: string;
  userId: string;
  userName: string;
  userEmail: string;
  name: string;
  description: string;
  category: BadgeCategory;
  level: string;
  
  // Origin LMS Metadata (§Trainee LMS Provenance)
  lmsId: string;
  lmsName: string;
  lmsDomain?: string;
  lmsLogo?: string;
  organizationId: string;
  organizationName: string;
  department: string;
  
  // Educational & Issuance Context
  courseId?: string;
  courseName?: string;
  phaseId?: string;
  phaseName?: string;
  planId?: string;
  planName?: string;
  earnedDate: string;
  expiryDate?: string;
  serialNumber: string;
  gradeScore?: number;
  criteria: string;
  issuerName: string;
  skillTags: string[];
  emblem: BadgeEmblem;
  status: 'active' | 'expired' | 'revoked';
  verified: boolean;
  xpPoints?: number;
}

export const INITIAL_EARNED_BADGES: EarnedBadge[] = [
  {
    id: 'EB-2026-001',
    badgeTemplateId: 'BDG-1001',
    userId: 'usr-1',
    userName: 'Ayesha Rahman',
    userEmail: 'ayesha.rahman@brac.net',
    name: 'Data Science Specialist – Gold',
    description: 'Mastered high-volume credit risk modeling and portfolio data analytics with distinction score.',
    category: 'Certification',
    level: 'Gold',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Learning Portal',
    lmsDomain: 'microfinance.learn.brac.net',
    lmsLogo: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    department: 'Microfinance',
    courseId: 'crs-101',
    courseName: 'Advanced SQL for Financial Analysts (CRS-101)',
    phaseName: 'Phase 2: Portfolio Risk & Delinquency Modeling',
    planName: 'Field Credit Operations & Data Analytics Certification 2026',
    earnedDate: '18 Jan 2026',
    expiryDate: '18 Jan 2028',
    serialNumber: 'BDG-MF-2026-9041',
    gradeScore: 94,
    criteria: 'Complete all practical analytics modules and achieve >= 85% on final evaluation.',
    issuerName: 'BRAC Learning Institute & Risk Council',
    skillTags: ['Data Analysis', 'Python', 'SQL', 'Financial Analytics'],
    emblem: {
      source: 'base-shape',
      baseShape: 'Shield',
      fillColor: '#0d9488',
      accentColor: '#f59e0b',
      iconRef: 'analytics'
    },
    status: 'active',
    verified: true,
    xpPoints: 350
  },
  {
    id: 'EB-2026-002',
    badgeTemplateId: 'BDG-1002',
    userId: 'usr-1',
    userName: 'Ayesha Rahman',
    userEmail: 'ayesha.rahman@brac.net',
    name: 'Agile Leadership Champion',
    description: 'Demonstrated agile sprint velocity and cross-functional field team leadership.',
    category: 'Skill',
    level: 'Silver',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Learning Portal',
    lmsDomain: 'microfinance.learn.brac.net',
    lmsLogo: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    department: 'Microfinance',
    phaseName: 'Phase 1: Field Ethics & Client Protection Foundation',
    planName: 'Field Credit Operations & Data Analytics Certification 2026',
    earnedDate: '28 Jan 2026',
    serialNumber: 'BDG-MF-2026-9112',
    gradeScore: 90,
    criteria: 'Lead 3 consecutive agile phase reviews with 100% submission adherence.',
    issuerName: 'Global Leadership Academy',
    skillTags: ['Agile', 'Scrum', 'Leadership', 'Field Management'],
    emblem: {
      source: 'base-shape',
      baseShape: 'Circle',
      fillColor: '#4f46e5',
      accentColor: '#6366f1',
      iconRef: 'groups'
    },
    status: 'active',
    verified: true,
    xpPoints: 250
  },
  {
    id: 'EB-2026-003',
    badgeTemplateId: 'BDG-1003',
    userId: 'usr-1',
    userName: 'Ayesha Rahman',
    userEmail: 'ayesha.rahman@brac.net',
    name: 'Cybersecurity Sentinel Level 1',
    description: 'Passed organizational zero-trust data protection and customer privacy covenants.',
    category: 'Certification',
    level: 'Level 1',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Learning Portal',
    lmsDomain: 'microfinance.learn.brac.net',
    lmsLogo: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    department: 'IT Security',
    courseId: 'crs-102',
    courseName: 'POS Hardware & Offline Sync Mastery (CRS-102)',
    earnedDate: '05 Feb 2026',
    expiryDate: '05 Feb 2027',
    serialNumber: 'BDG-MF-2026-9488',
    gradeScore: 100,
    criteria: 'Pass annual security compliance assessment with 100% correct answers.',
    issuerName: 'BRAC IT Security Office',
    skillTags: ['Cybersecurity', 'Zero Trust', 'Data Privacy'],
    emblem: {
      source: 'base-shape',
      baseShape: 'Hexagon',
      fillColor: '#0f172a',
      accentColor: '#10b981',
      iconRef: 'security'
    },
    status: 'active',
    verified: true,
    xpPoints: 300
  },
  {
    id: 'EB-2026-004',
    badgeTemplateId: 'BDG-UPG-01',
    userId: 'usr-1',
    userName: 'Ayesha Rahman',
    userEmail: 'ayesha.rahman@brac.net',
    name: 'Ultra-Poor Graduation Coach',
    description: 'Certified in the 24-month multidimensional graduation methodology and coaching protocols.',
    category: 'Milestone',
    level: 'Gold',
    lmsId: 'LMS-1972-02',
    lmsName: 'BRAC Ultra-Poor Graduation Academy',
    lmsDomain: 'upg-academy.learn.brac.net',
    lmsLogo: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=200&q=80',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    department: 'Ultra-Poor Graduation',
    courseName: 'Graduation Model Field Coaching Masterclass',
    phaseName: 'Phase 3: Household Livelihood Asset Transfer',
    earnedDate: '12 Feb 2026',
    serialNumber: 'BDG-UPG-2026-1029',
    gradeScore: 92,
    criteria: 'Complete 40 hours of case studies and pass field simulation with distinction.',
    issuerName: 'BRAC Ultra-Poor Graduation Centre of Excellence',
    skillTags: ['Poverty Graduation', 'Community Coaching', 'Household Asset Management'],
    emblem: {
      source: 'base-shape',
      baseShape: 'Star',
      fillColor: '#059669',
      accentColor: '#34d399',
      iconRef: 'volunteer_activism'
    },
    status: 'active',
    verified: true,
    xpPoints: 400
  },
  {
    id: 'EB-2026-005',
    badgeTemplateId: 'BDG-PLAY-01',
    userId: 'usr-1',
    userName: 'Ayesha Rahman',
    userEmail: 'ayesha.rahman@brac.net',
    name: 'Play Labs Early Learning Champion',
    description: 'Mastery in interactive play pedagogy and early childhood psychology observations.',
    category: 'Achievement',
    level: 'Platinum',
    lmsId: 'LMS-1972-03',
    lmsName: 'Play Labs Early Childhood Portal',
    lmsDomain: 'playlabs.learn.brac.net',
    lmsLogo: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=200&q=80',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    department: 'Education & Youth Skills',
    courseName: 'Play-Based Curriculum & Child Development Pedagogy',
    earnedDate: '22 Feb 2026',
    serialNumber: 'BDG-PLAY-2026-3021',
    gradeScore: 98,
    criteria: 'Submit 5 gamified lesson plans and complete peer review evaluation.',
    issuerName: 'BRAC Institute of Educational Development (BIED)',
    skillTags: ['Child Pedagogy', 'Play-Based Learning', 'Early Development'],
    emblem: {
      source: 'base-shape',
      baseShape: 'Rosette',
      fillColor: '#db2777',
      accentColor: '#f472b6',
      iconRef: 'toys'
    },
    status: 'active',
    verified: true,
    xpPoints: 500
  },
  {
    id: 'EB-2026-006',
    badgeTemplateId: 'BDG-1005',
    userId: 'usr-1',
    userName: 'Ayesha Rahman',
    userEmail: 'ayesha.rahman@brac.net',
    name: 'Community Development Specialist',
    description: 'Awarded for exceptional field immersion and 100+ hours of community development service.',
    category: 'Achievement',
    level: 'Platinum',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Learning Portal',
    lmsDomain: 'microfinance.learn.brac.net',
    lmsLogo: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    department: 'Social Innovation',
    courseId: 'crs-101',
    courseName: 'Advanced SQL for Financial Analysts (CRS-101)',
    earnedDate: '02 Mar 2026',
    serialNumber: 'BDG-MF-2026-9882',
    gradeScore: 95,
    criteria: 'Complete 100 hours practical community fieldwork and submit case report.',
    issuerName: 'BRAC Social Innovation Lab',
    skillTags: ['Field Work', 'Community', 'Sustainability'],
    emblem: {
      source: 'base-shape',
      baseShape: 'Ribbon',
      fillColor: '#059669',
      accentColor: '#a7f3d0',
      iconRef: 'nature'
    },
    status: 'active',
    verified: true,
    xpPoints: 300
  }
];

export const INITIAL_BADGE_MAPPINGS: BadgeMapping[] = [
  {
    mappingId: 'bdg-map-001',
    templateId: 'BDG-1001',
    badgeName: 'Data Science Specialist – Gold',
    targetType: 'course',
    targetId: 'crs-101',
    targetName: 'Advanced SQL for Financial Analysts (CRS-101)',
    achievementRule: 'Score >= 85% on Final Practical Assessment',
    mappedBy: 'Farhana Ahmed',
    mappedAt: '16/01/2026'
  },
  {
    mappingId: 'bdg-map-002',
    templateId: 'BDG-1001',
    badgeName: 'Data Science Specialist – Gold',
    targetType: 'plan',
    targetId: 'plan-001',
    targetName: 'Field Credit Operations & Data Analytics Certification 2026',
    achievementRule: 'Complete Data Science Phase with score >= 85%',
    mappedBy: 'Farhana Ahmed',
    mappedAt: '18/01/2026'
  },
  {
    mappingId: 'bdg-map-003',
    templateId: 'BDG-1002',
    badgeName: 'Agile Leadership Champion',
    targetType: 'plan',
    targetId: 'plan-001',
    targetName: 'Field Credit Operations & Data Analytics Certification 2026',
    achievementRule: 'Complete Sprint & Team Coaching Track',
    mappedBy: 'System Administrator',
    mappedAt: '22/01/2026'
  },
  {
    mappingId: 'bdg-map-004',
    templateId: 'BDG-1002',
    badgeName: 'Agile Leadership Champion',
    targetType: 'phase',
    targetId: 'phs-001',
    targetName: 'Phase 1: Field Ethics & Client Protection Foundation',
    achievementRule: '100% Attendance & Leadership Submission',
    mappedBy: 'System Administrator',
    mappedAt: '25/01/2026'
  },
  {
    mappingId: 'bdg-map-005',
    templateId: 'BDG-1003',
    badgeName: 'Environmental & Social Safeguards',
    targetType: 'course',
    targetId: 'crs-102',
    targetName: 'POS Hardware & Offline Sync Mastery (CRS-102)',
    achievementRule: 'Pass Compliance and Safeguards Module',
    mappedBy: 'System Administrator',
    mappedAt: '02/03/2026'
  },
  {
    mappingId: 'bdg-map-006',
    templateId: 'BDG-1005',
    badgeName: 'Community Development Specialist',
    targetType: 'course',
    targetId: 'crs-101',
    targetName: 'Advanced SQL for Financial Analysts (CRS-101)',
    achievementRule: 'Complete 100 hours practical community fieldwork',
    mappedBy: 'Nusrat Jahan',
    mappedAt: '15/12/2025'
  }
];

