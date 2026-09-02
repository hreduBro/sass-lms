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
