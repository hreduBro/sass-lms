import { UserRole } from './lms.model';

export type ContentFamily = 'Learning' | 'Assessment';

export type LearningContentType =
  | 'Video'
  | 'Audio'
  | 'PDF / Document'
  | 'Slides / Presentation'
  | 'Reading'
  | 'Recorded Class'
  | 'Book / E-book'
  | 'External Link';

export type AssessmentContentType = 'Question Bank / Question Set';

export type ContentType = LearningContentType | AssessmentContentType;

export type SharingMode = 'Private' | 'Organization-wide' | 'Custom Share';

export type ContentStatus = 'Draft' | 'Scheduled' | 'Active' | 'Inactive' | 'Expired';

export interface VideoContentConfig {
  source: 'upload' | 'embed';
  videoUrl?: string;
  fileName?: string;
  fileSize?: string;
  durationMinutes?: number;
}

export interface AudioContentConfig {
  audioUrl?: string;
  fileName?: string;
  fileSize?: string;
  durationMinutes?: number;
}

export interface DocumentContentConfig {
  fileCategory: 'PDF' | 'DOC' | 'DOCX' | 'XLS' | 'XLSX' | 'PPT' | 'TXT';
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
}

export interface SlidesContentConfig {
  format: '.ppt' | '.pptx' | '.odp';
  slideCount: number;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
}

export interface ReadingContentConfig {
  contentHtml: string;
  wordCount: number;
  estimatedReadMinutes: number;
}

export interface RecordedClassContentConfig {
  deliverySource: 'upload' | 'platform_link';
  platform?: 'Zoom' | 'MS Teams' | 'Google Meet' | 'WebRTC' | 'Platform CDN';
  sessionUrl?: string;
  sessionDate: string; // DD/MM/YYYY
  durationMinutes: number;
  instructorName?: string;
}

export interface BookContentConfig {
  format: 'PDF' | 'EPUB';
  isbn?: string;
  edition?: string;
  pageCount?: number;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
}

export interface ExternalLinkContentConfig {
  url: string;
  platformTag?: string;
  openMode: 'new_tab' | 'embed';
  verificationStatus: 'verified' | 'unverified';
}

export interface QuestionSetConfig {
  assessmentId: string;
  assessmentTitle: string;
  assessmentCode?: string;
  questionCount: number;
  scoringMode: 'scored' | 'unscored';
  passMarkPercent?: number;
  totalMarks?: number;
}

export type ContentPayloadConfig =
  | VideoContentConfig
  | AudioContentConfig
  | DocumentContentConfig
  | SlidesContentConfig
  | ReadingContentConfig
  | RecordedClassContentConfig
  | BookContentConfig
  | ExternalLinkContentConfig
  | QuestionSetConfig;

export interface RepositoryItemReference {
  id: string;
  name: string;
  type: 'Plan' | 'Phase' | 'Course';
  lmsName?: string;
}

export interface RepositoryItem {
  id: string;
  title: string; // Max 199 characters (English)
  titleBangla?: string; // Max 199 characters (Bangla)
  family: ContentFamily;
  type: ContentType;
  authorIds: string[];
  authorNames: string[];
  publishDate: string; // DD/MM/YYYY
  expiryDate: string | null; // DD/MM/YYYY or null if no expiry
  hasNoExpiry: boolean;
  description?: string;
  thumbnailUrl?: string;
  altText?: string; // Only shown if thumbnail is set
  owningLmsId: string;
  owningLmsName: string;
  owningOrganizationId: string;
  sharingMode: SharingMode;
  sharedWithLmsIds?: string[]; // Specific LMS ids for Custom Share
  status: ContentStatus;
  createdAt: string; // DD/MM/YYYY
  updatedAt: string; // DD/MM/YYYY
  createdBy: string;
  contentConfig: ContentPayloadConfig;
  referencedInPlansCount: number;
  referencedInCoursesCount: number;
  referencedEntities?: RepositoryItemReference[];
}

export const AUTHORITATIVE_LEARNING_CONTENT_TYPES: { type: LearningContentType; icon: string; description: string; formats: string }[] = [
  {
    type: 'Video',
    icon: 'smart_display',
    description: 'Upload video file (MP4, WebM) or embed streaming URL from YouTube or Vimeo',
    formats: 'MP4, WebM, YouTube URL'
  },
  {
    type: 'Audio',
    icon: 'volume_up',
    description: 'Upload audio masterclass, field podcast, or voice lecture',
    formats: 'MP3, WAV, AAC, M4A'
  },
  {
    type: 'PDF / Document',
    icon: 'description',
    description: 'Manuals, research reports, guides, spreadsheets across 7 standard office formats',
    formats: 'PDF, DOC, DOCX, XLS, XLSX, PPT, TXT'
  },
  {
    type: 'Slides / Presentation',
    icon: 'slideshow',
    description: 'Pitch decks, visual lesson slides, and structured lecture presentations',
    formats: '.ppt, .pptx, .odp'
  },
  {
    type: 'Reading',
    icon: 'article',
    description: 'Author interactive articles and rich-text manuals directly in the studio editor',
    formats: 'In-app Rich Text & Embedded Media'
  },
  {
    type: 'Recorded Class',
    icon: 'videocam',
    description: 'Recorded live virtual sessions, webinars, and classroom recordings with session metadata',
    formats: 'Session Video or Platform Link (Zoom, Teams, Meet)'
  },
  {
    type: 'Book / E-book',
    icon: 'menu_book',
    description: 'Complete e-books, training textbooks, and digital reference publications',
    formats: 'PDF, EPUB'
  },
  {
    type: 'External Link',
    icon: 'open_in_new',
    description: 'Curated references to externally hosted resources, tools, and regulatory guidelines',
    formats: 'Secured HTTPS URL with metadata'
  }
];

export const AUTHORITATIVE_ASSESSMENT_CONTENT_TYPES: { type: AssessmentContentType; icon: string; description: string; formats: string }[] = [
  {
    type: 'Question Bank / Question Set',
    icon: 'quiz',
    description: 'Reusable question set linked from the Central Assessment Bank (MCQ, Multi-select, Open Essay)',
    formats: 'Assessment Bank Reference'
  }
];

export const ALL_CONTENT_TYPES: ContentType[] = [
  'Video',
  'Audio',
  'PDF / Document',
  'Slides / Presentation',
  'Reading',
  'Recorded Class',
  'Book / E-book',
  'External Link',
  'Question Bank / Question Set'
];

/**
 * Parses DD/MM/YYYY into a standard Date object
 */
export function parseDateString(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === 'No Expiry') return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

/**
 * Formats a Date object to DD/MM/YYYY
 */
export function formatDateToDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Determines whether a repository item is available to learners
 * Only Active items are available to learners everywhere.
 */
export function isLearnerAvailable(status: ContentStatus): boolean {
  return status === 'Active';
}

/**
 * Helper to compute status transition based on publish date, expiry date, and current status.
 */
export function evaluateAutomaticStatus(
  currentStatus: ContentStatus,
  publishDate: string,
  expiryDate: string | null,
  hasNoExpiry: boolean,
  now = new Date()
): ContentStatus {
  if (currentStatus === 'Draft') return 'Draft';
  if (currentStatus === 'Inactive') return 'Inactive';

  // Compare dates (normalized to midnight)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pub = parseDateString(publishDate);
  const exp = hasNoExpiry ? null : parseDateString(expiryDate);

  if (exp && today.getTime() > exp.getTime()) {
    return 'Expired';
  }

  if (pub && pub.getTime() > today.getTime()) {
    return 'Scheduled';
  }

  return 'Active';
}

/**
 * Initial mock repository seed data
 */
export const INITIAL_REPOSITORY_ITEMS: RepositoryItem[] = [
  {
    id: 'repo-item-01',
    title: 'BRAC Microfinance Operations & Village Banking Field Handbook',
    titleBangla: 'ব্র্যাক ক্ষুদ্রঋণ পরিচালনা ও পল্লী সংগঠন ফিল্ড নির্দেশিকা',
    family: 'Learning',
    type: 'PDF / Document',
    authorIds: ['usr-brac-auth-1'],
    authorNames: ['Tanvir Hossain', 'Farhana Ahmed'],
    publishDate: '15/01/2026',
    expiryDate: null,
    hasNoExpiry: true,
    description: 'Standard operating handbook detailing Village Organization formation, credit appraisal, passbook balancing, and zero-coercion collection standards.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    altText: 'Village Banking Handbook Cover Illustration',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Organization-wide',
    status: 'Active',
    createdAt: '10/01/2026',
    updatedAt: '15/01/2026',
    createdBy: 'Tanvir Hossain',
    contentConfig: {
      fileCategory: 'PDF',
      fileName: 'BRAC_Village_Banking_Field_Handbook_2026.pdf',
      fileSize: '4.8 MB',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    },
    referencedInPlansCount: 2,
    referencedInCoursesCount: 3,
    referencedEntities: [
      { id: 'plan-brac-01', name: '2026 Microfinance Branch Transformation Plan', type: 'Plan' },
      { id: 'course-brac-101', name: 'BRAC Microfinance Operations & Client Protection Principles', type: 'Course' }
    ]
  },
  {
    id: 'repo-item-02',
    title: 'Biometric Tablet POS KYC Troubleshooting Video Guide',
    titleBangla: 'বায়োমেট্রিক ট্যাবলেট পিওএস কেওয়াইসি সমাধান ভিডিও গাইড',
    family: 'Learning',
    type: 'Video',
    authorIds: ['usr-brac-auth-1'],
    authorNames: ['Tanvir Hossain'],
    publishDate: '20/01/2026',
    expiryDate: '31/12/2026',
    hasNoExpiry: false,
    description: 'High-definition video walkthrough demonstrating offline buffer syncing, fingerprint reader calibration, and supervisor override during connectivity drops.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
    altText: 'Tablet POS demonstration screenshot',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Custom Share',
    sharedWithLmsIds: ['LMS-1972-02', 'LMS-1972-03'],
    status: 'Active',
    createdAt: '18/01/2026',
    updatedAt: '20/01/2026',
    createdBy: 'Tanvir Hossain',
    contentConfig: {
      source: 'upload',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileName: 'Biometric_Tablet_POS_KYC_Troubleshooting.mp4',
      fileSize: '48.5 MB',
      durationMinutes: 14
    },
    referencedInPlansCount: 1,
    referencedInCoursesCount: 1,
    referencedEntities: [
      { id: 'plan-brac-01', name: '2026 Microfinance Branch Transformation Plan', type: 'Plan' }
    ]
  },
  {
    id: 'repo-item-03',
    title: 'Smart Campaign Client Protection Core Ethics & Standards Exam',
    titleBangla: 'স্মার্ট ক্যাম্পেইন গ্রাহক সুরক্ষা নীতি ও মান মূল্যায়ন প্রশ্নব্যাংক',
    family: 'Assessment',
    type: 'Question Bank / Question Set',
    authorIds: ['usr-brac-auth-2'],
    authorNames: ['Farhana Ahmed'],
    publishDate: '01/02/2026',
    expiryDate: null,
    hasNoExpiry: true,
    description: 'Certified 12-question randomized assessment bank assessing consumer rights, non-harassment collections, and grievance reporting.',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Organization-wide',
    status: 'Active',
    createdAt: '28/01/2026',
    updatedAt: '01/02/2026',
    createdBy: 'Farhana Ahmed',
    contentConfig: {
      assessmentId: 'asm-101',
      assessmentTitle: 'Microfinance Client Protection & Ethics Exam',
      assessmentCode: 'ASM-1972-MF',
      questionCount: 12,
      scoringMode: 'scored',
      passMarkPercent: 80,
      totalMarks: 50
    },
    referencedInPlansCount: 2,
    referencedInCoursesCount: 2,
    referencedEntities: [
      { id: 'plan-brac-01', name: '2026 Microfinance Branch Transformation Plan', type: 'Plan' },
      { id: 'course-brac-101', name: 'BRAC Microfinance Operations & Client Protection Principles', type: 'Course' }
    ]
  },
  {
    id: 'repo-item-04',
    title: 'Early Childhood Play Facilitation Audio Masterclass',
    titleBangla: 'প্রাক-প্রাথমিক খেলাধুলাভিত্তিক শিখন অডিও মাস্টারক্লাস',
    family: 'Learning',
    type: 'Audio',
    authorIds: ['usr-brac-auth-3'],
    authorNames: ['Nusrat Jahan'],
    publishDate: '10/02/2026',
    expiryDate: '15/12/2026',
    hasNoExpiry: false,
    description: 'Audio podcast series covering emotional attunement, neuro-divergent toddler encouragement, and storytelling techniques in community play labs.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80',
    altText: 'Early Childhood Learning Audio Banner',
    owningLmsId: 'LMS-1972-03',
    owningLmsName: 'Play Labs Early Childhood Portal',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Organization-wide',
    status: 'Active',
    createdAt: '05/02/2026',
    updatedAt: '10/02/2026',
    createdBy: 'Nusrat Jahan',
    contentConfig: {
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      fileName: 'Early_Play_Facilitation_Masterclass_Ep1.mp3',
      fileSize: '18.4 MB',
      durationMinutes: 22
    },
    referencedInPlansCount: 1,
    referencedInCoursesCount: 1,
    referencedEntities: [
      { id: 'plan-brac-02', name: 'Community Child Educators Training', type: 'Plan' }
    ]
  },
  {
    id: 'repo-item-05',
    title: 'Multidimensional Poverty Scorecard & Household Audit Framework',
    titleBangla: 'বহুমাত্রিক দারিদ্র্য স্কোরকার্ড ও পারিবারিক যাচাই রূপরেখা',
    family: 'Learning',
    type: 'Slides / Presentation',
    authorIds: ['usr-brac-auth-4'],
    authorNames: ['Dr. Imran Matin'],
    publishDate: '01/03/2026',
    expiryDate: null,
    hasNoExpiry: true,
    description: '45-slide structured visual lecture detailing asset grants, health nutrition stipends, and coaching visits for the ultra-poor graduation methodology.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80',
    altText: 'Poverty Graduation Slide Deck Cover',
    owningLmsId: 'LMS-1972-02',
    owningLmsName: 'Ultra-Poor Graduation Portal',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Organization-wide',
    status: 'Active',
    createdAt: '25/02/2026',
    updatedAt: '01/03/2026',
    createdBy: 'Dr. Imran Matin',
    contentConfig: {
      format: '.pptx',
      slideCount: 45,
      fileName: 'UPG_Household_Poverty_Scorecard_2026.pptx',
      fileSize: '12.6 MB',
      fileUrl: '#'
    },
    referencedInPlansCount: 1,
    referencedInCoursesCount: 1,
    referencedEntities: [
      { id: 'plan-brac-01', name: '2026 Microfinance Branch Transformation Plan', type: 'Plan' }
    ]
  },
  {
    id: 'repo-item-06',
    title: 'Coastal Cyclone Evacuation Protocol & Early Warning Reading Manual',
    titleBangla: 'উপকূলীয় ঘূর্ণিঝড় আশ্রয় ও আগাম সতর্কবার্তা পাঠ নির্দেশিকা',
    family: 'Learning',
    type: 'Reading',
    authorIds: ['usr-brac-auth-5'],
    authorNames: ['Shakil Anwar'],
    publishDate: '15/03/2026',
    expiryDate: '15/03/2027',
    hasNoExpiry: false,
    description: 'Essential interactive guide with emergency response matrices, radio signal flags, and vulnerable family shelter prioritization.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80',
    altText: 'Cyclone shelter preparedness article',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Private',
    status: 'Active',
    createdAt: '10/03/2026',
    updatedAt: '15/03/2026',
    createdBy: 'Shakil Anwar',
    contentConfig: {
      contentHtml: `
        <h3>Coastal Cyclone Evacuation & Early Warning Protocol (2026)</h3>
        <p>This protocol provides branch managers, Village Organization leaders, and community mobilizers with mandatory standard actions when Signal 4 or higher is hoisted by meteorological departments.</p>
        <h4>Core Directives:</h4>
        <ul>
          <li><strong>Pre-warning Stage (Signal 4):</strong> Secure cash in waterproof vaults, activate emergency cellular backup phones.</li>
          <li><strong>Alert Stage (Signal 6-7):</strong> Pause loan collections, mobilize pregnant women and elderly residents towards designated cyclone centers.</li>
          <li><strong>Evacuation Stage (Signal 8-10):</strong> Total evacuation to reinforced shelters with emergency dry food rations.</li>
        </ul>
      `,
      wordCount: 1250,
      estimatedReadMinutes: 8
    },
    referencedInPlansCount: 0,
    referencedInCoursesCount: 0,
    referencedEntities: []
  },
  {
    id: 'repo-item-07',
    title: 'Digital Wallets & QR Payment Integration Live Session Recording',
    titleBangla: 'ডিজিটাল ওয়ালেট ও কিউআর পেমেন্ট একীভূতকরণ লাইভ রেকর্ডিং',
    family: 'Learning',
    type: 'Recorded Class',
    authorIds: ['usr-brac-auth-1'],
    authorNames: ['Tanvir Hossain'],
    publishDate: '28/03/2026',
    expiryDate: null,
    hasNoExpiry: true,
    description: 'Recording of the 90-minute live demonstration on bKash/Nagad automated repayment ledger posting and merchant QR integration.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80',
    altText: 'Digital Payment Class Recording',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Custom Share',
    sharedWithLmsIds: ['LMS-1972-02'],
    status: 'Active',
    createdAt: '22/03/2026',
    updatedAt: '28/03/2026',
    createdBy: 'Tanvir Hossain',
    contentConfig: {
      deliverySource: 'platform_link',
      platform: 'Zoom',
      sessionUrl: 'https://zoom.us/rec/play/sample-session-brac',
      sessionDate: '28/03/2026',
      durationMinutes: 85,
      instructorName: 'Tanvir Hossain'
    },
    referencedInPlansCount: 1,
    referencedInCoursesCount: 1,
    referencedEntities: [
      { id: 'plan-brac-01', name: '2026 Microfinance Branch Transformation Plan', type: 'Plan' }
    ]
  },
  {
    id: 'repo-item-08',
    title: 'Field Microfinance Accounting & Statutory Compliance E-Book',
    titleBangla: 'ফিল্ড ক্ষুদ্রঋণ হিসাববিজ্ঞান ও বিধিবদ্ধ কমপ্লায়েন্স ই-বুক',
    family: 'Learning',
    type: 'Book / E-book',
    authorIds: ['usr-brac-auth-2'],
    authorNames: ['Farhana Ahmed'],
    publishDate: '01/04/2026',
    expiryDate: null,
    hasNoExpiry: true,
    description: 'Comprehensive 240-page digital reference textbook outlining accounting standards, general ledger reconciliations, and external audit readiness.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
    altText: 'Field Accounting Textbook Cover',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Organization-wide',
    status: 'Active',
    createdAt: '25/03/2026',
    updatedAt: '01/04/2026',
    createdBy: 'Farhana Ahmed',
    contentConfig: {
      format: 'EPUB',
      isbn: '978-984-34-5892-1',
      edition: '4th Edition (2026)',
      pageCount: 240,
      fileName: 'Field_Microfinance_Accounting_Manual.epub',
      fileSize: '8.2 MB',
      fileUrl: '#'
    },
    referencedInPlansCount: 1,
    referencedInCoursesCount: 1,
    referencedEntities: [
      { id: 'course-brac-101', name: 'BRAC Microfinance Operations & Client Protection Principles', type: 'Course' }
    ]
  },
  {
    id: 'repo-item-09',
    title: 'Bangladesh Bank Regulatory FinTech Sandbox Portal Reference',
    titleBangla: 'বাংলাদেশ ব্যাংক রেগুলেটরি ফিনটেক স্যান্ডবক্স নির্দেশিকা লিঙ্ক',
    family: 'Learning',
    type: 'External Link',
    authorIds: ['usr-brac-auth-1'],
    authorNames: ['Tanvir Hossain'],
    publishDate: '10/04/2026',
    expiryDate: null,
    hasNoExpiry: true,
    description: 'Official regulator portal link providing updated electronic KYC circulars, micro-merchant licensing parameters, and regulatory APIs.',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Organization-wide',
    status: 'Active',
    createdAt: '08/04/2026',
    updatedAt: '10/04/2026',
    createdBy: 'Tanvir Hossain',
    contentConfig: {
      url: 'https://www.bb.org.bd/en/index.php/financialactivity/fintech',
      platformTag: 'Central Bank Official Portal',
      openMode: 'new_tab',
      verificationStatus: 'verified'
    },
    referencedInPlansCount: 0,
    referencedInCoursesCount: 1,
    referencedEntities: [
      { id: 'course-brac-101', name: 'BRAC Microfinance Operations & Client Protection Principles', type: 'Course' }
    ]
  },
  {
    id: 'repo-item-10',
    title: 'Q3 Agricultural Climate Weather Index Insurance Module',
    titleBangla: 'কিউ৩ কৃষি আবহাওয়া সূচক বীমা মডিউল',
    family: 'Learning',
    type: 'PDF / Document',
    authorIds: ['usr-brac-auth-5'],
    authorNames: ['Shakil Anwar'],
    publishDate: '15/11/2026', // Future date -> Scheduled status!
    expiryDate: '15/11/2027',
    hasNoExpiry: false,
    description: 'Satellite rainfall measurement indices and automated micro-payout thresholds for monsoon flash-flood vulnerable farmers.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=400&q=80',
    altText: 'Weather Index Insurance document thumbnail',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Organization-wide',
    status: 'Scheduled',
    createdAt: '02/10/2026',
    updatedAt: '02/10/2026',
    createdBy: 'Shakil Anwar',
    contentConfig: {
      fileCategory: 'PDF',
      fileName: 'Weather_Index_Insurance_Framework_2026.pdf',
      fileSize: '3.5 MB',
      fileUrl: '#'
    },
    referencedInPlansCount: 0,
    referencedInCoursesCount: 0,
    referencedEntities: []
  },
  {
    id: 'repo-item-11',
    title: 'Legacy Paper Passbook Reconciliation Guidelines (Archived 2024)',
    titleBangla: 'কাগজের পাসবুক সমন্বয় নির্দেশিকা (সংরক্ষিত)',
    family: 'Learning',
    type: 'PDF / Document',
    authorIds: ['usr-brac-auth-2'],
    authorNames: ['Farhana Ahmed'],
    publishDate: '01/01/2024',
    expiryDate: '01/01/2026', // Expired date!
    hasNoExpiry: false,
    description: 'Archived operating procedure for manual ledger posting prior to tablet digitization.',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Private',
    status: 'Expired',
    createdAt: '15/12/2023',
    updatedAt: '01/01/2024',
    createdBy: 'Farhana Ahmed',
    contentConfig: {
      fileCategory: 'PDF',
      fileName: 'Paper_Passbook_Legacy_Audit_2024.pdf',
      fileSize: '2.1 MB',
      fileUrl: '#'
    },
    referencedInPlansCount: 0,
    referencedInCoursesCount: 0,
    referencedEntities: []
  },
  {
    id: 'repo-item-12',
    title: 'Youth Freelancing & Digital Outsourcing Skills Blueprint [DRAFT]',
    titleBangla: 'যুব ফ্রিল্যান্সিং ও ডিজিটাল আউটসোর্সিং দক্ষতা ব্লুপ্রিন্ট',
    family: 'Learning',
    type: 'Reading',
    authorIds: ['usr-brac-auth-3'],
    authorNames: ['Nusrat Jahan'],
    publishDate: '20/10/2026',
    expiryDate: null,
    hasNoExpiry: true,
    description: 'In-progress curriculum draft covering graphic design, virtual assistance, and cross-border payment compliance for rural youth.',
    owningLmsId: 'LMS-1972-01',
    owningLmsName: 'Microfinance Academy',
    owningOrganizationId: 'tenant-brac',
    sharingMode: 'Private',
    status: 'Draft',
    createdAt: '03/10/2026',
    updatedAt: '03/10/2026',
    createdBy: 'Nusrat Jahan',
    contentConfig: {
      contentHtml: '<p>Draft in progress. Youth curriculum outline under faculty review...</p>',
      wordCount: 220,
      estimatedReadMinutes: 2
    },
    referencedInPlansCount: 0,
    referencedInCoursesCount: 0,
    referencedEntities: []
  }
];
