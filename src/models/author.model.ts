export interface PersonRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  bio?: string;
  roles: ('author' | 'instructor' | 'lms_admin' | 'learner' | 'system_admin')[];
  organizationId: string;
  department?: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PersonnelAttachment {
  id: string;
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  category: 'CV / Resume' | 'Certificate / Credential' | 'Portfolio / Sample' | 'Identity / Government ID' | 'General Document' | 'Other Media';
  url: string;
  uploadedAt: string;
  isImage?: boolean;
}

export interface AuthorProfile {
  id: string;
  personId: string;
  name: string;
  email: string;
  contactNumber?: string;
  bio?: string;
  specialization: string;
  avatar: string;
  status: 'Active' | 'Inactive';
  isInstructor: boolean;
  instructorId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt?: string;
  authoredItemsCount?: number;
  isProfileComplete?: boolean;
  incompleteReason?: string;
  attachments?: PersonnelAttachment[];
}

export interface AuthorshipRecord {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  contentItemId: string;
  contentItemTitle: string;
  contentType: 'video' | 'audio' | 'document' | 'quiz' | 'reading' | 'interactive' | 'assignment' | 'lab' | string;
  courseId: string;
  courseName: string;
  courseStatus: 'Published' | 'Draft' | 'Inactive' | 'Archived';
  lmsId: string;
  lmsName: string;
  version: string;
  nodeTitle?: string;
  creditedDate: string;
}

export interface DeactivationBlockResolution {
  contentItemId: string;
  courseId: string;
  action: 'reassign' | 'remove';
  replacementAuthorId?: string;
}

export interface AuthorCreateForm {
  name: string;
  email: string;
  contactNumber?: string;
  bio?: string;
  specialization: string;
  status: 'Active' | 'Inactive';
  avatar?: string;
  attachments?: PersonnelAttachment[];
  isQuickAdd?: boolean;
}

export const INITIAL_AUTHORS_REPO: AuthorProfile[] = [
  {
    id: 'auth-mahbubur',
    personId: 'person-mahbubur',
    name: 'Mahbubur Rahman',
    email: 'mahbubur.r@brac.net',
    contactNumber: '+880 1711-450921',
    bio: 'Award-winning instructional media designer with 8+ years developing interactive microlearning videos, animated compliance guides, and multimedia scenario simulations across BRAC global operations.',
    specialization: 'Video Scripting & Interactive Media Production',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    isInstructor: false,
    organizationId: 'tenant-brac',
    createdAt: '10/01/2026',
    authoredItemsCount: 5
  },
  {
    id: 'auth-tanvir',
    personId: 'person-tanvir',
    name: 'Tanvir Hossain',
    email: 'tanvir.hossain@brac.net',
    contactNumber: '+880 1819-234567',
    bio: 'Lead Microfinance Master Instructor and Curriculum Author. Co-author of BRAC Client Protection Manual and Responsible Microcredit SOPs, holding dual Master Instructor and Course Author roles.',
    specialization: 'Microfinance SOPs, Responsible Lending & Credit Risk Rubrics',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    isInstructor: true,
    instructorId: 'inst-tanvir',
    organizationId: 'tenant-brac',
    createdAt: '15/01/2026',
    authoredItemsCount: 4
  },
  {
    id: 'auth-ayesha',
    personId: 'person-ayesha',
    name: 'Ayesha Siddiqua',
    email: 'ayesha.s@brac.net',
    contactNumber: '+880 1912-887766',
    bio: 'Senior Pedagogical Field Researcher specializing in participatory community learning frameworks, ultra-poor household coaching materials, and social accountability assessment design.',
    specialization: 'Instructional Design, Case Studies & Qualitative Assessments',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    isInstructor: false,
    organizationId: 'tenant-brac',
    createdAt: '22/01/2026',
    authoredItemsCount: 3
  },
  {
    id: 'auth-kamrul',
    personId: 'person-kamrul',
    name: 'Kamrul Hasan',
    email: 'kamrul.h@brac.net',
    contactNumber: '+880 1610-998811',
    bio: 'Curriculum Architect and Technical Content Developer. Focuses on digital toolkits, SCORM/xAPI compliant interactive sandboxes, and automated diagnostic quiz banks.',
    specialization: 'Interactive Simulators & Assessment Question Banks',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    isInstructor: false,
    organizationId: 'tenant-brac',
    createdAt: '05/02/2026',
    authoredItemsCount: 4
  },
  {
    id: 'auth-sadia',
    personId: 'person-sadia',
    name: 'Sadia Rahman',
    email: 'sadia.rahman@brac.net',
    contactNumber: '+880 1713-334455',
    bio: 'Digital Pedagogy & Assessment Lead. Dual role holder as Master Faculty and Instructional Designer with specialization in youth skill development pathways and adaptive question banks.',
    specialization: 'Curriculum Architecture, Youth Pedagogy & Adaptive Quizzes',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    isInstructor: true,
    instructorId: 'inst-sadia',
    organizationId: 'tenant-brac',
    createdAt: '18/02/2026',
    authoredItemsCount: 3
  },
  {
    id: 'auth-farhana',
    personId: 'person-farhana',
    name: 'Farhana Ahmed',
    email: 'farhana.ahmed@brac.net',
    contactNumber: '+880 1714-556677',
    bio: 'Principal Compliance Specialist and co-author of AML/CFT compliance modules and anti-fraud interactive case studies.',
    specialization: 'Regulatory Compliance Modules & Audit Simulations',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    isInstructor: true,
    instructorId: 'inst-farhana',
    organizationId: 'tenant-brac',
    createdAt: '01/03/2026',
    authoredItemsCount: 2
  }
];

export const INITIAL_AUTHORSHIP_RECORDS: AuthorshipRecord[] = [
  {
    id: 'auth-rec-1',
    authorId: 'auth-mahbubur',
    authorName: 'Mahbubur Rahman',
    authorEmail: 'mahbubur.r@brac.net',
    contentItemId: 'cnt-1',
    contentItemTitle: 'VO Grassroots Structure & Member Onboarding Video',
    contentType: 'video',
    courseId: 'crs-brac-101',
    courseName: 'BRAC Microfinance Operations & Client Protection Principles',
    courseStatus: 'Published',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    version: 'v1.0',
    nodeTitle: 'Lesson 1.1.1: VO Formation & Meeting Governance',
    creditedDate: '10/01/2026'
  },
  {
    id: 'auth-rec-2',
    authorId: 'auth-tanvir',
    authorName: 'Tanvir Hossain',
    authorEmail: 'tanvir.hossain@brac.net',
    contentItemId: 'cnt-2',
    contentItemTitle: 'BRAC Client Protection Manual (SOP Ref Guide)',
    contentType: 'document',
    courseId: 'crs-brac-101',
    courseName: 'BRAC Microfinance Operations & Client Protection Principles',
    courseStatus: 'Published',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    version: 'v1.0',
    nodeTitle: 'Lesson 1.1.1: VO Formation & Meeting Governance',
    creditedDate: '15/01/2026'
  },
  {
    id: 'auth-rec-3',
    authorId: 'auth-kamrul',
    authorName: 'Kamrul Hasan',
    authorEmail: 'kamrul.h@brac.net',
    contentItemId: 'cnt-3',
    contentItemTitle: 'Formative Check: Client Dignity & Code of Conduct Quiz',
    contentType: 'quiz',
    courseId: 'crs-brac-101',
    courseName: 'BRAC Microfinance Operations & Client Protection Principles',
    courseStatus: 'Published',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    version: 'v1.0',
    nodeTitle: 'Lesson 1.1.1: VO Formation & Meeting Governance',
    creditedDate: '05/02/2026'
  },
  {
    id: 'auth-rec-4',
    authorId: 'auth-mahbubur',
    authorName: 'Mahbubur Rahman',
    authorEmail: 'mahbubur.r@brac.net',
    contentItemId: 'cnt-4',
    contentItemTitle: 'Field Cash Handling & Digital Collections Walkthrough',
    contentType: 'video',
    courseId: 'crs-brac-101',
    courseName: 'BRAC Microfinance Operations & Client Protection Principles',
    courseStatus: 'Published',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    version: 'v1.0',
    nodeTitle: 'Lesson 1.1.2: Digital Ledger Reconciliation',
    creditedDate: '12/01/2026'
  },
  {
    id: 'auth-rec-5',
    authorId: 'auth-ayesha',
    authorName: 'Ayesha Siddiqua',
    authorEmail: 'ayesha.s@brac.net',
    contentItemId: 'cnt-upg-1',
    contentItemTitle: 'Household Mentorship Coaching Video Simulation',
    contentType: 'video',
    courseId: 'crs-brac-102',
    courseName: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery',
    courseStatus: 'Published',
    lmsId: 'LMS-1972-02',
    lmsName: 'Ultra-Poor Graduation & Social Development Institute',
    version: 'v1.1',
    nodeTitle: 'Lesson 1.1: Household Selection & Vulnerability Index',
    creditedDate: '24/01/2026'
  },
  {
    id: 'auth-rec-6',
    authorId: 'auth-sadia',
    authorName: 'Sadia Rahman',
    authorEmail: 'sadia.rahman@brac.net',
    contentItemId: 'cnt-upg-2',
    contentItemTitle: 'Asset Transfer Diagnostic Questionnaire & Scoring Matrix',
    contentType: 'quiz',
    courseId: 'crs-brac-102',
    courseName: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery',
    courseStatus: 'Published',
    lmsId: 'LMS-1972-02',
    lmsName: 'Ultra-Poor Graduation & Social Development Institute',
    version: 'v1.1',
    nodeTitle: 'Lesson 1.2: Asset Allocation & Livelihood Planning',
    creditedDate: '20/02/2026'
  },
  {
    id: 'auth-rec-7',
    authorId: 'auth-kamrul',
    authorName: 'Kamrul Hasan',
    authorEmail: 'kamrul.h@brac.net',
    contentItemId: 'cnt-upg-3',
    contentItemTitle: 'Graduation Criteria Milestone Verification Simulator',
    contentType: 'interactive',
    courseId: 'crs-brac-102',
    courseName: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery',
    courseStatus: 'Published',
    lmsId: 'LMS-1972-02',
    lmsName: 'Ultra-Poor Graduation & Social Development Institute',
    version: 'v1.1',
    nodeTitle: 'Lesson 1.3: Milestone Tracking & Graduation Evaluation',
    creditedDate: '08/02/2026'
  },
  {
    id: 'auth-rec-8',
    authorId: 'auth-farhana',
    authorName: 'Farhana Ahmed',
    authorEmail: 'farhana.ahmed@brac.net',
    contentItemId: 'cnt-aml-1',
    contentItemTitle: 'Anti-Money Laundering & Sanctions Screening Standard SOP',
    contentType: 'document',
    courseId: 'crs-brac-103',
    courseName: 'Enterprise Compliance, AML & Operational Risk Governance',
    courseStatus: 'Published',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    version: 'v2.0',
    nodeTitle: 'Lesson 2.1: KYC Verification & Suspicious Transaction Reporting',
    creditedDate: '05/03/2026'
  },
  {
    id: 'auth-rec-9',
    authorId: 'auth-mahbubur',
    authorName: 'Mahbubur Rahman',
    authorEmail: 'mahbubur.r@brac.net',
    contentItemId: 'cnt-repo-reused-1',
    contentItemTitle: 'VO Grassroots Structure & Member Onboarding Video',
    contentType: 'video',
    courseId: 'crs-brac-104',
    courseName: 'Field Operations Leadership & Branch Management',
    courseStatus: 'Draft',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    version: 'v1.0',
    nodeTitle: 'Lesson 1.1: Foundations of Branch Oversight',
    creditedDate: '10/01/2026'
  }
];
