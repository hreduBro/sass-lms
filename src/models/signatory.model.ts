export type SignatoryStatus = 'active' | 'inactive' | 'draft';

export interface SignatureImage {
  fileUrl: string;
  fileName?: string;
  mime?: string;
  sizeBytes?: number;
  widthPx?: number;
  heightPx?: number;
}

export interface SignatorySharingConfig {
  level: 'private' | 'lms' | 'organization';
  lmsId?: string;
  lmsName?: string;
  organizationId?: string;
  organizationName?: string;
}

export interface Signatory {
  signatoryId: string;              // Unique ID e.g. SIG-1001
  name: string;                     // Signatory Name (mandatory)
  designation: string;              // Designation e.g. "Director of Training" (mandatory)
  department?: string;              // Department/Unit (optional)
  signatureImage: SignatureImage;   // Digital Signature Image (mandatory)
  status: SignatoryStatus;          // active | inactive | draft
  sharing?: SignatorySharingConfig;
  linkedTemplateCount: number;      // Derived count of linked certificate templates
  createdBy: string;
  createdAt: string;                // DD/MM/YYYY or DD:MM:YYYY HH:MM:SS
  updatedAt: string;                // DD/MM/YYYY or DD:MM:YYYY HH:MM:SS
}

export interface SignatoryTemplateLink {
  id: string;
  signatoryId: string;
  certificateTemplateId: string;
  certificateTemplateName?: string;
  slotId: string;                   // Which slot on the certificate canvas
  slotLabel: string;                // e.g. "Director", "Chief Instructor"
  slotRequired?: boolean;
  order: number;                    // Display order (1, 2, 3...)
  linkedAt: string;
}

export interface SignatoryChangeLog {
  id: string;
  signatoryId: string;
  signatoryName: string;
  changedBy: string;
  changedAt: string;
  changedFields: string[];          // e.g. ["name", "designation", "signatureImage"]
  propagatedTemplateIds: string[];
  propagatedTemplateCount: number;
  actionSummary: string;
}

// Sample SVG signature image data URLs for realistic default mock data
export const SAMPLE_SIGNATURE_IMAGES = {
  sig1: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="300" height="100"><path d="M 20 60 C 50 10, 70 90, 100 40 C 130 -10, 150 80, 180 50 C 200 30, 230 70, 270 40 M 80 75 Q 160 85 240 70" fill="none" stroke="%231e293b" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sig2: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="300" height="100"><path d="M 30 70 Q 60 10 90 60 T 150 50 T 210 40 T 270 60 M 40 40 L 260 40" fill="none" stroke="%230f172a" stroke-width="3" stroke-linecap="round"/></svg>',
  sig3: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="300" height="100"><path d="M 25 50 C 60 20, 80 80, 110 30 S 170 70, 200 40 S 240 80, 280 30 M 100 70 Q 180 90 250 65" fill="none" stroke="%230284c7" stroke-width="3.2" stroke-linecap="round"/></svg>',
  sig4: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="300" height="100"><path d="M 35 65 C 55 15, 85 85, 120 45 C 150 15, 180 75, 210 35 C 230 25, 250 65, 275 45" fill="none" stroke="%2315803d" stroke-width="3.8" stroke-linecap="round"/></svg>'
};

export const INITIAL_SIGNATORIES: Signatory[] = [
  {
    signatoryId: 'SIG-1001',
    name: 'Dr. Karim Rahman',
    designation: 'Director of Academic Affairs',
    department: 'Learning & Development',
    signatureImage: {
      fileUrl: SAMPLE_SIGNATURE_IMAGES.sig1,
      fileName: 'dr_karim_rahman_sig.svg',
      mime: 'image/svg+xml',
      sizeBytes: 12400,
      widthPx: 600,
      heightPx: 200
    },
    status: 'active',
    sharing: { level: 'lms', lmsName: 'Global Corporate LMS' },
    linkedTemplateCount: 3,
    createdBy: 'System Admin',
    createdAt: '15/01/2026 09:30:00',
    updatedAt: '20/02/2026 14:15:00'
  },
  {
    signatoryId: 'SIG-1002',
    name: 'Prof. Farhana Yasmin',
    designation: 'Head of Quality Assurance & Accreditation',
    department: 'Standards & Compliance',
    signatureImage: {
      fileUrl: SAMPLE_SIGNATURE_IMAGES.sig2,
      fileName: 'farhana_yasmin_sig.svg',
      mime: 'image/svg+xml',
      sizeBytes: 10800,
      widthPx: 600,
      heightPx: 200
    },
    status: 'active',
    sharing: { level: 'lms', lmsName: 'Global Corporate LMS' },
    linkedTemplateCount: 2,
    createdBy: 'System Admin',
    createdAt: '18/01/2026 11:20:00',
    updatedAt: '18/01/2026 11:20:00'
  },
  {
    signatoryId: 'SIG-1003',
    name: 'Tariq Hasan',
    designation: 'VP of Human Resources & Talent',
    department: 'Human Resources',
    signatureImage: {
      fileUrl: SAMPLE_SIGNATURE_IMAGES.sig3,
      fileName: 'tariq_hasan_sig.svg',
      mime: 'image/svg+xml',
      sizeBytes: 14200,
      widthPx: 600,
      heightPx: 200
    },
    status: 'active',
    sharing: { level: 'organization', organizationName: 'Enterprise Org' },
    linkedTemplateCount: 4,
    createdBy: 'Org Admin',
    createdAt: '01/02/2026 10:05:00',
    updatedAt: '10/02/2026 16:40:00'
  },
  {
    signatoryId: 'SIG-1004',
    name: 'Sarah Jenkins',
    designation: 'Chief Technical Instructor',
    department: 'Engineering & Technology',
    signatureImage: {
      fileUrl: SAMPLE_SIGNATURE_IMAGES.sig4,
      fileName: 'sarah_jenkins_sig.svg',
      mime: 'image/svg+xml',
      sizeBytes: 11500,
      widthPx: 600,
      heightPx: 200
    },
    status: 'inactive',
    sharing: { level: 'lms', lmsName: 'Global Corporate LMS' },
    linkedTemplateCount: 0,
    createdBy: 'LMS Admin',
    createdAt: '05/02/2026 15:00:00',
    updatedAt: '25/02/2026 09:10:00'
  }
];

export const INITIAL_SIGNATORY_LINKS: SignatoryTemplateLink[] = [
  {
    id: 'LINK-1',
    signatoryId: 'SIG-1001',
    certificateTemplateId: 'CERT-TMP-1001',
    certificateTemplateName: 'Executive Leadership Completion Certificate',
    slotId: 'sig_slot_left',
    slotLabel: 'Director of Academic Affairs',
    slotRequired: true,
    order: 1,
    linkedAt: '20/01/2026 10:00:00'
  },
  {
    id: 'LINK-2',
    signatoryId: 'SIG-1001',
    certificateTemplateId: 'CERT-TMP-1002',
    certificateTemplateName: 'Compliance & Cyber Safety Certificate',
    slotId: 'sig_slot_right',
    slotLabel: 'Academic Director',
    slotRequired: false,
    order: 2,
    linkedAt: '22/01/2026 14:30:00'
  },
  {
    id: 'LINK-3',
    signatoryId: 'SIG-1001',
    certificateTemplateId: 'CERT-TMP-1003',
    certificateTemplateName: 'Professional Masterclass Distinction',
    slotId: 'sig_slot_center',
    slotLabel: 'Lead Authority',
    slotRequired: true,
    order: 1,
    linkedAt: '05/02/2026 11:15:00'
  },
  {
    id: 'LINK-4',
    signatoryId: 'SIG-1002',
    certificateTemplateId: 'CERT-TMP-1001',
    certificateTemplateName: 'Executive Leadership Completion Certificate',
    slotId: 'sig_slot_right',
    slotLabel: 'Head of Quality Assurance',
    slotRequired: true,
    order: 2,
    linkedAt: '20/01/2026 10:00:00'
  },
  {
    id: 'LINK-5',
    signatoryId: 'SIG-1002',
    certificateTemplateId: 'CERT-TMP-1004',
    certificateTemplateName: 'ISO Compliance Assessor Certificate',
    slotId: 'sig_slot_center',
    slotLabel: 'Accreditation Head',
    slotRequired: true,
    order: 1,
    linkedAt: '12/02/2026 16:00:00'
  },
  {
    id: 'LINK-6',
    signatoryId: 'SIG-1003',
    certificateTemplateId: 'CERT-TMP-1001',
    certificateTemplateName: 'Executive Leadership Completion Certificate',
    slotId: 'sig_slot_center',
    slotLabel: 'VP of Human Resources',
    slotRequired: false,
    order: 3,
    linkedAt: '02/02/2026 09:45:00'
  },
  {
    id: 'LINK-7',
    signatoryId: 'SIG-1003',
    certificateTemplateId: 'CERT-TMP-1002',
    certificateTemplateName: 'Compliance & Cyber Safety Certificate',
    slotId: 'sig_slot_left',
    slotLabel: 'HR Authority',
    slotRequired: true,
    order: 1,
    linkedAt: '03/02/2026 10:20:00'
  },
  {
    id: 'LINK-8',
    signatoryId: 'SIG-1003',
    certificateTemplateId: 'CERT-TMP-1005',
    certificateTemplateName: 'Annual Safety Award',
    slotId: 'sig_slot_right',
    slotLabel: 'HR Executive',
    slotRequired: false,
    order: 2,
    linkedAt: '08/02/2026 13:00:00'
  },
  {
    id: 'LINK-9',
    signatoryId: 'SIG-1003',
    certificateTemplateId: 'CERT-TMP-1006',
    certificateTemplateName: 'Talent Acceleration Program Certificate',
    slotId: 'sig_slot_center',
    slotLabel: 'VP HR',
    slotRequired: true,
    order: 1,
    linkedAt: '15/02/2026 15:30:00'
  }
];

export const INITIAL_SIGNATORY_CHANGE_LOGS: SignatoryChangeLog[] = [
  {
    id: 'LOG-101',
    signatoryId: 'SIG-1001',
    signatoryName: 'Dr. Karim Rahman',
    changedBy: 'System Admin',
    changedAt: '20/02/2026 14:15:00',
    changedFields: ['designation', 'department'],
    propagatedTemplateIds: ['CERT-TMP-1001', 'CERT-TMP-1002', 'CERT-TMP-1003'],
    propagatedTemplateCount: 3,
    actionSummary: 'Updated designation to Director of Academic Affairs. Propagated to 3 certificate templates.'
  },
  {
    id: 'LOG-102',
    signatoryId: 'SIG-1003',
    signatoryName: 'Tariq Hasan',
    changedBy: 'Org Admin',
    changedAt: '10/02/2026 16:40:00',
    changedFields: ['signatureImage'],
    propagatedTemplateIds: ['CERT-TMP-1001', 'CERT-TMP-1002', 'CERT-TMP-1005', 'CERT-TMP-1006'],
    propagatedTemplateCount: 4,
    actionSummary: 'Uploaded high-resolution digital signature SVG. Propagated to 4 certificate templates.'
  }
];
