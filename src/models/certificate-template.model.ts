import { UserRole } from './lms.model';

export type CertificateOrientation = 'landscape' | 'portrait';
export type CertificatePaperSize = 'A4' | 'Letter' | 'A3' | 'Custom';
export type CertificateSharingLevel = 'private' | 'lms' | 'organization';
export type CertificateTemplateStatus = 'draft' | 'published' | 'archived';
export type CertificateType = 'Completion' | 'Achievement' | 'Participation' | 'Merit' | 'Professional' | 'Compliance';
export type ElementOverflowMode = 'fit' | 'wrap' | 'truncate';
export type CanvasElementKind = 'placeholder' | 'static-text' | 'image' | 'qr';

export interface CanvasElementStyle {
  fontFamily: string;
  fontSizePt: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  align: 'left' | 'center' | 'right';
  overflow: ElementOverflowMode;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface CanvasElement {
  id: string;
  kind: CanvasElementKind;
  token?: string;         // e.g. {{trainee_name}}
  text?: string;          // Static text content
  imageUrl?: string;      // Image URL if kind === 'image'
  x: number;              // % of canvas width (0–100)
  y: number;              // % of canvas height (0–100)
  w: number;              // % of canvas width (0–100)
  h: number;              // % of canvas height (0–100)
  rotation?: number;      // degrees 0-360
  z: number;              // z-order index
  style: CanvasElementStyle;
}

export interface CertificateCanvasConfig {
  widthPx: number;
  heightPx: number;
  referenceDpi: number;
}

export interface CertificateBackground {
  fileUrl: string;
  fileName?: string;
  mime?: string;
  sizeBytes?: number;
  widthPx?: number;
  heightPx?: number;
}

export interface CertificateSharingConfig {
  level: CertificateSharingLevel;
  lmsId?: string;
  lmsName?: string;
  organizationId?: string;
  organizationName?: string;
}

export interface CertificateTemplate {
  id: string;                               // system-generated, unique (e.g. CERT-TMP-1972-01)
  name: string;                             // max 99 chars
  description?: string;                     // max 255 chars
  type: CertificateType;                    // Category
  orientation: CertificateOrientation;      // landscape | portrait
  paperSize: CertificatePaperSize;          // A4 | Letter | A3 | Custom
  canvas: CertificateCanvasConfig;
  background: CertificateBackground;
  elements: CanvasElement[];
  sharing: CertificateSharingConfig;
  status: CertificateTemplateStatus;        // draft | published | archived
  version: number;                          // increments on copy-on-edit
  creationStatus?: 'draft' | 'saved';
  lastCompletedStep?: 'background-details' | 'designer' | 'preview';
  createdBy: string;                        // user name / email
  createdById?: string;
  createdAt: string;                        // DD:MM:YYYY HH:MM:SS
  updatedAt: string;                        // DD:MM:YYYY HH:MM:SS
  usageCount: number;                       // # of Phases referencing this template
  previewThumbnail?: string;
}

export interface PlaceholderTokenDef {
  key: string;
  label: string;
  category: 'Recipient' | 'Curriculum' | 'Organization' | 'Dates & ID' | 'Assessment' | 'Authorities' | 'Verification';
  sampleValue: string;
  description: string;
  icon: string;
  defaultStyle?: Partial<CanvasElementStyle>;
}

export const PLACEHOLDER_TOKENS: PlaceholderTokenDef[] = [
  {
    key: '{{trainee_name}}',
    label: 'Recipient / Trainee Name',
    category: 'Recipient',
    sampleValue: 'Ayesha Rahman',
    description: 'Full legal name of the enrolled trainee / learner',
    icon: 'person',
    defaultStyle: { fontSizePt: 30, bold: true, align: 'center', color: '#0f172a' }
  },
  {
    key: '{{course_name}}',
    label: 'Course Name',
    category: 'Curriculum',
    sampleValue: 'BRAC Microfinance Operations & Client Protection Principles',
    description: 'Title of the course assigned to the phase',
    icon: 'school',
    defaultStyle: { fontSizePt: 18, bold: true, align: 'center', color: '#1e293b' }
  },
  {
    key: '{{plan_name}}',
    label: 'Plan Name',
    category: 'Curriculum',
    sampleValue: '2026 Microfinance Branch Operations Certification Plan',
    description: 'Title of the parent training plan',
    icon: 'event_note',
    defaultStyle: { fontSizePt: 14, bold: false, align: 'center', color: '#475569' }
  },
  {
    key: '{{phase_name}}',
    label: 'Phase Name',
    category: 'Curriculum',
    sampleValue: 'Phase 1: Grassroots VO Facilitation & Field Ethics',
    description: 'Name of the specific curriculum phase',
    icon: 'timeline',
    defaultStyle: { fontSizePt: 15, bold: true, align: 'center', color: '#334155' }
  },
  {
    key: '{{lms_name}}',
    label: 'LMS Name',
    category: 'Organization',
    sampleValue: 'BRAC Microfinance Learning Hub',
    description: 'Name of the issuing LMS workspace',
    icon: 'layers',
    defaultStyle: { fontSizePt: 13, bold: false, align: 'center', color: '#64748b' }
  },
  {
    key: '{{organization_name}}',
    label: 'Organization Name',
    category: 'Organization',
    sampleValue: 'BRAC',
    description: 'Owning organization / tenant name',
    icon: 'corporate_fare',
    defaultStyle: { fontSizePt: 14, bold: true, align: 'center', color: '#0f172a' }
  },
  {
    key: '{{completion_date}}',
    label: 'Completion Date',
    category: 'Dates & ID',
    sampleValue: '18/08/2026',
    description: 'Date when the phase / course was marked completed',
    icon: 'calendar_month',
    defaultStyle: { fontSizePt: 12, bold: false, align: 'center', color: '#475569' }
  },
  {
    key: '{{issue_date}}',
    label: 'Issue Date',
    category: 'Dates & ID',
    sampleValue: '31/08/2026',
    description: 'Timestamp when certificate was issued',
    icon: 'today',
    defaultStyle: { fontSizePt: 12, bold: false, align: 'center', color: '#475569' }
  },
  {
    key: '{{certificate_serial}}',
    label: 'Certificate ID / Serial',
    category: 'Dates & ID',
    sampleValue: 'BRAC-CERT-2026-98214',
    description: 'System-generated unique credential serial',
    icon: 'badge',
    defaultStyle: { fontSizePt: 10, bold: false, align: 'center', color: '#64748b' }
  },
  {
    key: '{{grade}}',
    label: 'Grade / Score',
    category: 'Assessment',
    sampleValue: '96.5% (Distinction)',
    description: 'Evaluated score or letter grade',
    icon: 'grade',
    defaultStyle: { fontSizePt: 13, bold: true, align: 'center', color: '#059669' }
  },
  {
    key: '{{trainer_name}}',
    label: 'Trainer / Instructor Name',
    category: 'Authorities',
    sampleValue: 'Tanvir Hossain',
    description: 'Name of the lead instructor / trainer',
    icon: 'supervisor_account',
    defaultStyle: { fontSizePt: 13, bold: true, align: 'center', color: '#1e293b' }
  },
  {
    key: '{{signatory_name}}',
    label: 'Authorized Signatory Name',
    category: 'Authorities',
    sampleValue: 'Dr. Karim Rahman',
    description: 'Name of linked authorized signatory from repository',
    icon: 'draw',
    defaultStyle: { fontSizePt: 12, bold: true, align: 'center', color: '#1e293b' }
  },
  {
    key: '{{signatory_designation}}',
    label: 'Authorized Signatory Designation',
    category: 'Authorities',
    sampleValue: 'Director of Academic Affairs',
    description: 'Designation of linked authorized signatory from repository',
    icon: 'badge',
    defaultStyle: { fontSizePt: 10, bold: false, align: 'center', color: '#475569' }
  },
  {
    key: '{{signatory_signature_image}}',
    label: 'Digital Signature Graphic',
    category: 'Authorities',
    sampleValue: '[Digital Signature Graphic]',
    description: 'Digital signature image of linked signatory',
    icon: 'edit',
    defaultStyle: { fontSizePt: 10, bold: false, align: 'center', color: '#0f172a' }
  },
  {
    key: '{{verification_qr}}',
    label: 'QR / Verification Code',
    category: 'Verification',
    sampleValue: 'https://verify.onelms.net/cert/BRAC-CERT-2026-98214',
    description: 'Dynamic scannable QR verification code',
    icon: 'qr_code_2',
    defaultStyle: { fontSizePt: 10, bold: false, align: 'center', color: '#0f172a' }
  }
];

export const SUPPORTED_FONTS = [
  { name: 'Cinzel (Classical Serif)', value: 'Cinzel, serif' },
  { name: 'Playfair Display (Elegant Serif)', value: 'Playfair Display, serif' },
  { name: 'Merriweather (Formal Editorial)', value: 'Merriweather, serif' },
  { name: 'Plus Jakarta Sans (Modern Clean)', value: 'Plus Jakarta Sans, sans-serif' },
  { name: 'Inter (High-Legibility Sans)', value: 'Inter, sans-serif' },
  { name: 'Montserrat (Geometric Display)', value: 'Montserrat, sans-serif' },
  { name: 'Great Vibes (Calligraphic Script)', value: 'Great Vibes, cursive' },
  { name: 'Courier Prime (Monospace)', value: 'Courier Prime, monospace' }
];

export const CANVAS_SIZE_MAP: Record<CertificatePaperSize, Record<CertificateOrientation, { widthPx: number; heightPx: number }>> = {
  'A4': {
    landscape: { widthPx: 3508, heightPx: 2480 },
    portrait: { widthPx: 2480, heightPx: 3508 }
  },
  'Letter': {
    landscape: { widthPx: 3300, heightPx: 2550 },
    portrait: { widthPx: 2550, heightPx: 3300 }
  },
  'A3': {
    landscape: { widthPx: 4960, heightPx: 3508 },
    portrait: { widthPx: 3508, heightPx: 4960 }
  },
  'Custom': {
    landscape: { widthPx: 3200, heightPx: 2200 },
    portrait: { widthPx: 2200, heightPx: 3200 }
  }
};

export interface CertificateTemplatePermissions {
  canViewFeature: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDuplicate: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canPublish: boolean;
  canSetOrgWideSharing: boolean;
  canManageDashboardStudio: boolean;
}

// =========================================================================
// Dashboard Studio Models for Certificate Templates
// =========================================================================
export type CertificateWidgetType = 
  | 'kpi_summary'
  | 'status_breakdown'
  | 'sharing_breakdown'
  | 'most_used_templates'
  | 'active_drafts'
  | 'recent_activity'
  | 'templates_snapshot';

export interface CertificateDashboardWidget {
  id: string;
  type: CertificateWidgetType;
  title: string;
  subtitle?: string;
  colSpan: 1 | 2 | 3 | 4; // 1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%
  rowSpan?: 1 | 2 | 3 | 4; // 1x = Compact, 2x = Standard, 3x = Tall, 4x = Deep
  visibleForRoles?: UserRole[];
  audience?: string[];
}

export interface CertificateDashboardLayout {
  isPublished: boolean;
  publishedAt: string;
  publishedBy: string;
  version: number;
  widgets: CertificateDashboardWidget[];
}

export interface CertificateActivityEvent {
  id: string;
  templateId: string;
  templateName: string;
  eventType: 'published' | 'archived' | 'edited' | 'created' | 'draft_saved' | 'duplicated';
  actorName: string;
  timestamp: string; // DD:MM:YYYY HH:MM:SS
  message: string;
}

// Pre-seeded Certificate Templates
export const INITIAL_CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'CERT-TMP-1972-01',
    name: 'BRAC Executive Standard Achievement Certificate',
    description: 'Gold-embossed executive credential with security watermark, dual verification signatures, and instant QR resolution.',
    type: 'Achievement',
    orientation: 'landscape',
    paperSize: 'A4',
    canvas: { widthPx: 3508, heightPx: 2480, referenceDpi: 300 },
    background: {
      fileUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1600&q=80',
      fileName: 'brac_gold_border_parchment.png',
      mime: 'image/png',
      sizeBytes: 1845000,
      widthPx: 3508,
      heightPx: 2480
    },
    elements: [
      {
        id: 'el-title-01',
        kind: 'static-text',
        text: 'CERTIFICATE OF ACHIEVEMENT',
        x: 10,
        y: 20,
        w: 80,
        h: 7,
        z: 1,
        style: {
          fontFamily: 'Cinzel, serif',
          fontSizePt: 28,
          bold: true,
          italic: false,
          underline: false,
          color: '#1e293b',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-sub-02',
        kind: 'static-text',
        text: 'THIS CREDENTIAL IS PROUDLY CONFERRED UPON',
        x: 15,
        y: 30,
        w: 70,
        h: 4,
        z: 2,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 12,
          bold: false,
          italic: false,
          underline: false,
          color: '#64748b',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-name-03',
        kind: 'placeholder',
        token: '{{trainee_name}}',
        x: 15,
        y: 36,
        w: 70,
        h: 11,
        z: 3,
        style: {
          fontFamily: 'Playfair Display, serif',
          fontSizePt: 36,
          bold: true,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-for-04',
        kind: 'static-text',
        text: 'For successfully demonstrating operational mastery, ethical excellence and fulfilling all requirements of',
        x: 15,
        y: 50,
        w: 70,
        h: 5,
        z: 4,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 12,
          bold: false,
          italic: false,
          underline: false,
          color: '#475569',
          align: 'center',
          overflow: 'wrap'
        }
      },
      {
        id: 'el-course-05',
        kind: 'placeholder',
        token: '{{course_name}}',
        x: 12,
        y: 57,
        w: 76,
        h: 9,
        z: 5,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 20,
          bold: true,
          italic: false,
          underline: false,
          color: '#0369a1',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-grade-06',
        kind: 'placeholder',
        token: '{{grade}}',
        x: 35,
        y: 69,
        w: 30,
        h: 5,
        z: 6,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 13,
          bold: true,
          italic: false,
          underline: false,
          color: '#059669',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-date-07',
        kind: 'placeholder',
        token: '{{issue_date}}',
        x: 10,
        y: 82,
        w: 25,
        h: 6,
        z: 7,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 12,
          bold: true,
          italic: false,
          underline: false,
          color: '#334155',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-date-label',
        kind: 'static-text',
        text: 'DATE OF ISSUANCE',
        x: 10,
        y: 88,
        w: 25,
        h: 4,
        z: 8,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 9,
          bold: true,
          italic: false,
          underline: false,
          color: '#94a3b8',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-sig-08',
        kind: 'placeholder',
        token: '{{signatory_name}}',
        x: 65,
        y: 82,
        w: 25,
        h: 6,
        z: 9,
        style: {
          fontFamily: 'Playfair Display, serif',
          fontSizePt: 13,
          bold: true,
          italic: true,
          underline: false,
          color: '#334155',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-sig-label',
        kind: 'static-text',
        text: 'EXECUTIVE REGISTRAR',
        x: 65,
        y: 88,
        w: 25,
        h: 4,
        z: 10,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 9,
          bold: true,
          italic: false,
          underline: false,
          color: '#94a3b8',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-serial-09',
        kind: 'placeholder',
        token: '{{certificate_serial}}',
        x: 35,
        y: 88,
        w: 30,
        h: 4,
        z: 11,
        style: {
          fontFamily: 'Courier Prime, monospace',
          fontSizePt: 9,
          bold: false,
          italic: false,
          underline: false,
          color: '#64748b',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-qr-10',
        kind: 'placeholder',
        token: '{{verification_qr}}',
        x: 46,
        y: 77,
        w: 8,
        h: 9,
        z: 12,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 8,
          bold: false,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'center',
          overflow: 'fit'
        }
      }
    ],
    sharing: {
      level: 'organization',
      organizationId: 'tenant-brac',
      organizationName: 'BRAC',
      lmsId: 'LMS-1972-01',
      lmsName: 'BRAC Microfinance Operations & Enterprise Academy'
    },
    status: 'published',
    version: 1,
    creationStatus: 'saved',
    lastCompletedStep: 'preview',
    createdBy: 'Farhana Ahmed',
    createdById: 'usr-brac-1',
    createdAt: '15/01/2026 10:30:00',
    updatedAt: '12/02/2026 14:20:00',
    usageCount: 6,
    previewThumbnail: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'CERT-TMP-1972-02',
    name: 'Microfinance Field Specialist Phase Milestone',
    description: 'Clean modern certificate designed for grassroots field branch officers, featuring phase milestone details and mentor sign-off.',
    type: 'Professional',
    orientation: 'landscape',
    paperSize: 'A4',
    canvas: { widthPx: 3508, heightPx: 2480, referenceDpi: 300 },
    background: {
      fileUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=1600&q=80',
      fileName: 'blue_geometric_certificate_bg.png',
      mime: 'image/png',
      sizeBytes: 1540000,
      widthPx: 3508,
      heightPx: 2480
    },
    elements: [
      {
        id: 'm-title-01',
        kind: 'static-text',
        text: 'PHASE MILESTONE CREDENTIAL',
        x: 10,
        y: 22,
        w: 80,
        h: 7,
        z: 1,
        style: {
          fontFamily: 'Montserrat, sans-serif',
          fontSizePt: 26,
          bold: true,
          italic: false,
          underline: false,
          color: '#0369a1',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'm-name-02',
        kind: 'placeholder',
        token: '{{trainee_name}}',
        x: 15,
        y: 38,
        w: 70,
        h: 10,
        z: 2,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 32,
          bold: true,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'm-phase-03',
        kind: 'placeholder',
        token: '{{phase_name}}',
        x: 15,
        y: 55,
        w: 70,
        h: 8,
        z: 3,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 18,
          bold: true,
          italic: false,
          underline: false,
          color: '#1e293b',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'm-trainer-04',
        kind: 'placeholder',
        token: '{{trainer_name}}',
        x: 12,
        y: 80,
        w: 30,
        h: 6,
        z: 4,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 13,
          bold: true,
          italic: false,
          underline: false,
          color: '#334155',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'm-date-05',
        kind: 'placeholder',
        token: '{{completion_date}}',
        x: 58,
        y: 80,
        w: 30,
        h: 6,
        z: 5,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 13,
          bold: true,
          italic: false,
          underline: false,
          color: '#334155',
          align: 'center',
          overflow: 'fit'
        }
      }
    ],
    sharing: {
      level: 'lms',
      organizationId: 'tenant-brac',
      organizationName: 'BRAC',
      lmsId: 'LMS-1972-01',
      lmsName: 'BRAC Microfinance Operations & Enterprise Academy'
    },
    status: 'published',
    version: 1,
    creationStatus: 'saved',
    lastCompletedStep: 'preview',
    createdBy: 'Tanvir Hossain',
    createdById: 'usr-brac-2',
    createdAt: '22/01/2026 14:15:00',
    updatedAt: '18/02/2026 09:40:00',
    usageCount: 4,
    previewThumbnail: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'CERT-TMP-1972-03',
    name: 'Climate Resilience Emergency Response Certificate',
    description: 'Emergency response qualification credential with disaster warning verification stamp and instructor endorsement.',
    type: 'Compliance',
    orientation: 'landscape',
    paperSize: 'A4',
    canvas: { widthPx: 3508, heightPx: 2480, referenceDpi: 300 },
    background: {
      fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=80',
      fileName: 'climate_emergency_bg.png',
      mime: 'image/png',
      sizeBytes: 1620000,
      widthPx: 3508,
      heightPx: 2480
    },
    elements: [
      {
        id: 'c-title-01',
        kind: 'static-text',
        text: 'CLIMATE RESILIENCE READINESS CERTIFICATE',
        x: 10,
        y: 20,
        w: 80,
        h: 7,
        z: 1,
        style: {
          fontFamily: 'Montserrat, sans-serif',
          fontSizePt: 24,
          bold: true,
          italic: false,
          underline: false,
          color: '#047857',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'c-name-02',
        kind: 'placeholder',
        token: '{{trainee_name}}',
        x: 15,
        y: 38,
        w: 70,
        h: 10,
        z: 2,
        style: {
          fontFamily: 'Playfair Display, serif',
          fontSizePt: 32,
          bold: true,
          italic: false,
          underline: false,
          color: '#064e3b',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'c-course-03',
        kind: 'placeholder',
        token: '{{course_name}}',
        x: 15,
        y: 56,
        w: 70,
        h: 8,
        z: 3,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 17,
          bold: true,
          italic: false,
          underline: false,
          color: '#1e293b',
          align: 'center',
          overflow: 'fit'
        }
      }
    ],
    sharing: {
      level: 'lms',
      organizationId: 'tenant-brac',
      organizationName: 'BRAC',
      lmsId: 'LMS-1972-04',
      lmsName: 'Climate Resilience & Disaster Management Hub'
    },
    status: 'published',
    version: 1,
    creationStatus: 'saved',
    lastCompletedStep: 'preview',
    createdBy: 'Shakil Anwar',
    createdById: 'usr-brac-shakil',
    createdAt: '05/02/2026 11:20:00',
    updatedAt: '20/02/2026 16:30:00',
    usageCount: 2,
    previewThumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'CERT-TMP-1972-04',
    name: 'Ultra-Poor Graduation Coaching Honors (Draft)',
    description: 'Work-in-progress certificate for master household asset coaching and holistic mentorship training.',
    type: 'Merit',
    orientation: 'landscape',
    paperSize: 'A4',
    canvas: { widthPx: 3508, heightPx: 2480, referenceDpi: 300 },
    background: {
      fileUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
      fileName: 'parchment_draft.png',
      mime: 'image/png',
      sizeBytes: 1120000,
      widthPx: 3508,
      heightPx: 2480
    },
    elements: [
      {
        id: 'd-title-01',
        kind: 'static-text',
        text: 'HONORS GRADUATION CERTIFICATE',
        x: 15,
        y: 24,
        w: 70,
        h: 7,
        z: 1,
        style: {
          fontFamily: 'Cinzel, serif',
          fontSizePt: 26,
          bold: true,
          italic: false,
          underline: false,
          color: '#1e293b',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'd-name-02',
        kind: 'placeholder',
        token: '{{trainee_name}}',
        x: 20,
        y: 40,
        w: 60,
        h: 9,
        z: 2,
        style: {
          fontFamily: 'Playfair Display, serif',
          fontSizePt: 30,
          bold: true,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'center',
          overflow: 'fit'
        }
      }
    ],
    sharing: {
      level: 'private',
      organizationId: 'tenant-brac',
      organizationName: 'BRAC',
      lmsId: 'LMS-1972-01',
      lmsName: 'BRAC Microfinance Operations & Enterprise Academy'
    },
    status: 'draft',
    version: 1,
    creationStatus: 'draft',
    lastCompletedStep: 'designer',
    createdBy: 'Nusrat Jahan',
    createdById: 'usr-brac-3',
    createdAt: '24/02/2026 16:45:00',
    updatedAt: '26/02/2026 18:10:00',
    usageCount: 0,
    previewThumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'CERT-TMP-1972-05',
    name: 'Legacy 2024 Branch Accounting Protocol (Archived)',
    description: 'Archived legacy paper certificate template replaced by unified OneLMS digital credentials.',
    type: 'Participation',
    orientation: 'landscape',
    paperSize: 'Letter',
    canvas: { widthPx: 3300, heightPx: 2550, referenceDpi: 300 },
    background: {
      fileUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
      fileName: 'legacy_accounting_bg.png',
      mime: 'image/png',
      sizeBytes: 1340000,
      widthPx: 3300,
      heightPx: 2550
    },
    elements: [
      {
        id: 'arch-title',
        kind: 'static-text',
        text: 'CERTIFICATE OF PARTICIPATION',
        x: 10,
        y: 25,
        w: 80,
        h: 6,
        z: 1,
        style: {
          fontFamily: 'Montserrat, sans-serif',
          fontSizePt: 22,
          bold: true,
          italic: false,
          underline: false,
          color: '#475569',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'arch-name',
        kind: 'placeholder',
        token: '{{trainee_name}}',
        x: 15,
        y: 42,
        w: 70,
        h: 9,
        z: 2,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 28,
          bold: true,
          italic: false,
          underline: false,
          color: '#334155',
          align: 'center',
          overflow: 'fit'
        }
      }
    ],
    sharing: {
      level: 'lms',
      organizationId: 'tenant-brac',
      organizationName: 'BRAC',
      lmsId: 'LMS-1972-05',
      lmsName: 'Legacy Procurement & Inventory System LMS'
    },
    status: 'archived',
    version: 1,
    creationStatus: 'saved',
    lastCompletedStep: 'preview',
    createdBy: 'System Admin',
    createdById: 'usr-system-admin',
    createdAt: '10/06/2024 09:00:00',
    updatedAt: '01/01/2025 00:00:00',
    usageCount: 1,
    previewThumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
  }
];

export const DEFAULT_CERTIFICATE_DASHBOARD_WIDGETS: CertificateDashboardWidget[] = [
  {
    id: 'w-cert-status-2',
    type: 'status_breakdown',
    title: 'Status Breakdown',
    subtitle: 'Draft, Published, and Archived template ratio',
    colSpan: 2,
    rowSpan: 2
  },
  {
    id: 'w-cert-sharing-3',
    type: 'sharing_breakdown',
    title: 'Sharing Policy Distribution',
    subtitle: 'Private vs LMS vs Organization-shared assets',
    colSpan: 2,
    rowSpan: 2
  },
  {
    id: 'w-cert-most-used-4',
    type: 'most_used_templates',
    title: 'Most-Used Templates (Top Ranked)',
    subtitle: 'Published templates ranked by active Phase curriculum references',
    colSpan: 2,
    rowSpan: 2
  },
  {
    id: 'w-cert-drafts-5',
    type: 'active_drafts',
    title: 'Active Creation Drafts',
    subtitle: 'In-progress wizards with resumable steps',
    colSpan: 2,
    rowSpan: 2
  },
  {
    id: 'w-cert-recent-6',
    type: 'recent_activity',
    title: 'Recent Template Activity',
    subtitle: 'Live feed of template publishing, archiving, and updates',
    colSpan: 2,
    rowSpan: 2
  },
  {
    id: 'w-cert-snapshot-7',
    type: 'templates_snapshot',
    title: 'Templates Snapshot',
    subtitle: 'Quick visual inspection cards of top templates',
    colSpan: 2,
    rowSpan: 2
  }
];

export const DEFAULT_CERTIFICATE_DASHBOARD_LAYOUT: CertificateDashboardLayout = {
  isPublished: true,
  publishedAt: '2026-08-31 00:00:00',
  publishedBy: 'System Default',
  version: 1,
  widgets: JSON.parse(JSON.stringify(DEFAULT_CERTIFICATE_DASHBOARD_WIDGETS))
};

export const INITIAL_CERTIFICATE_ACTIVITIES: CertificateActivityEvent[] = [
  {
    id: 'act-01',
    templateId: 'CERT-TMP-1972-01',
    templateName: 'BRAC Executive Standard Achievement Certificate',
    eventType: 'published',
    actorName: 'Farhana Ahmed',
    timestamp: '12/02/2026 14:20:00',
    message: 'BRAC Executive Standard Achievement Certificate has been published successfully'
  },
  {
    id: 'act-02',
    templateId: 'CERT-TMP-1972-02',
    templateName: 'Microfinance Field Specialist Phase Milestone',
    eventType: 'published',
    actorName: 'Tanvir Hossain',
    timestamp: '18/02/2026 09:40:00',
    message: 'Microfinance Field Specialist Phase Milestone has been published successfully'
  },
  {
    id: 'act-03',
    templateId: 'CERT-TMP-1972-04',
    templateName: 'Ultra-Poor Graduation Coaching Honors (Draft)',
    eventType: 'draft_saved',
    actorName: 'Nusrat Jahan',
    timestamp: '26/02/2026 18:10:00',
    message: 'Ultra-Poor Graduation Coaching Honors (Draft) details have been saved as draft'
  },
  {
    id: 'act-04',
    templateId: 'CERT-TMP-1972-05',
    templateName: 'Legacy 2024 Branch Accounting Protocol',
    eventType: 'archived',
    actorName: 'System Admin',
    timestamp: '01/01/2025 00:00:00',
    message: 'Legacy 2024 Branch Accounting Protocol has been archived'
  }
];
