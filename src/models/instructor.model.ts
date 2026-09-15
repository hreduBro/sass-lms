export interface InstructorProfile {
  id: string;
  personId: string;
  name: string;
  email: string;
  contactNumber?: string;
  bio?: string;
  specialization: string[];
  avatar: string;
  status: 'Active' | 'Inactive';
  isAuthor: boolean;
  authorId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt?: string;
  assignmentsCount?: number;
  department?: string;
  title?: string;
  rating?: number;
}

export interface InstructorAssignmentRecord {
  id: string;
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  courseId: string;
  courseName: string;
  layer: string;
  layerType: 'course' | 'module' | 'lesson' | 'quiz' | 'assignment' | string;
  nodeId?: string;
  lmsId: string;
  lmsName: string;
  courseStatus: 'Published' | 'Draft' | 'Inactive' | 'Archived';
  assignedDate: string;
}

export interface InstructorDeactivationResolution {
  assignmentId: string;
  courseId: string;
  layer: string;
  action: 'reassign' | 'remove';
  replacementInstructorId?: string;
}

export interface InstructorCreateForm {
  name: string;
  email: string;
  contactNumber?: string;
  bio?: string;
  specialization: string; // Comma separated or single string from form
  status: 'Active' | 'Inactive';
  department?: string;
  title?: string;
}

export interface BulkAssignRequest {
  personnelType: 'instructor' | 'author';
  personIds: string[];
  targetItems: {
    courseId: string;
    courseName: string;
    layerTitle: string;
    layerType?: string;
    lmsId: string;
    lmsName?: string;
  }[];
}

export interface EmailMessagePayload {
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  templateKey?: string;
  body: string;
}

export const EMAIL_TEMPLATES = [
  {
    key: 'schedule_notice',
    name: 'Course Teaching Schedule & Delivery Notice',
    subject: 'Teaching Assignment & Term Schedule Update',
    body: 'Dear {{name}},\n\nThis notification confirms your instructional assignment for upcoming course deliveries across the organization. Please review your active course structure and lesson materials in the LMS portal.\n\nBest regards,\nLMS Academic Administration'
  },
  {
    key: 'curriculum_feedback',
    name: 'Curriculum & Pedagogical Review Request',
    subject: 'Curriculum Feedback & Unit Quality Review',
    body: 'Dear {{name}},\n\nWe have scheduled a pedagogical quality review for the content modules and assessment units under your supervision. Kindly access the course builder and provide your feedback before the scheduled release.\n\nThank you,\nCurriculum Review Committee'
  },
  {
    key: 'onboarding_welcome',
    name: 'Faculty & Creator Welcome Letter',
    subject: 'Welcome to the OneLMS Organization Faculty Pool',
    body: 'Dear {{name}},\n\nWelcome to the organization-wide faculty and instructional creator pool! Your profile has been activated and you can now be tagged directly to course delivery layers and curriculum authoring units.\n\nWarm regards,\nOneLMS Operations Team'
  },
  {
    key: 'general_notice',
    name: 'General Operational Communication',
    subject: 'Important Operational Notice regarding Course Delivery',
    body: 'Dear {{name}},\n\nPlease be advised of the upcoming maintenance window and platform updates affecting active classroom sessions.\n\nSincerely,\nLMS Support Office'
  }
];

export const INITIAL_INSTRUCTORS_REPO: InstructorProfile[] = [
  {
    id: 'inst-tanvir',
    personId: 'person-tanvir',
    name: 'Tanvir Hossain',
    email: 'tanvir.hossain@brac.net',
    contactNumber: '+880 1819-234567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    title: 'Lead Microfinance Master Instructor',
    department: 'Microfinance & Financial Inclusion',
    specialization: ['Responsible Lending', 'Credit Risk', 'Client Protection', 'Microfinance SOPs'],
    bio: 'Lead Microfinance Master Instructor with 12+ years of field operations leadership across 64 districts in Bangladesh. Master trainer on client dignity, transparent interest calculation, and anti-harassment recovery protocols.',
    status: 'Active',
    isAuthor: true,
    authorId: 'auth-tanvir',
    organizationId: 'tenant-brac',
    createdAt: '15/01/2026',
    assignmentsCount: 4,
    rating: 4.95
  },
  {
    id: 'inst-farhana',
    personId: 'person-farhana',
    name: 'Farhana Ahmed',
    email: 'farhana.ahmed@brac.net',
    contactNumber: '+880 1714-556677',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    title: 'Principal Compliance & Operations Specialist',
    department: 'Learning & People Division',
    specialization: ['Regulatory Frameworks', 'Anti-Money Laundering', 'Operational Audit', 'Whistleblower Protocols'],
    bio: 'Principal Compliance Officer and executive faculty lead. Specializes in statutory banking compliance, AML/CFT auditing, institutional risk governance, and regulatory investigative procedures.',
    status: 'Active',
    isAuthor: true,
    authorId: 'auth-farhana',
    organizationId: 'tenant-brac',
    createdAt: '01/03/2026',
    assignmentsCount: 3,
    rating: 4.98
  },
  {
    id: 'inst-nusrat',
    personId: 'person-nusrat',
    name: 'Nusrat Jahan',
    email: 'nusrat.jahan@brac.net',
    contactNumber: '+880 1913-778899',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    title: 'Ultra-Poor Graduation Program Lead',
    department: 'Ultra-Poor Graduation',
    specialization: ['Livelihood Coaching', 'Asset Transfer', 'Household Mentorship', 'Social Protection'],
    bio: 'Senior Director of BRAC Ultra-Poor Graduation (UPG) program. International speaker and field pedagogue on multi-dimensional poverty alleviation, household coaching, and productive asset transfer methodologies.',
    status: 'Active',
    isAuthor: false,
    organizationId: 'tenant-brac',
    createdAt: '20/01/2026',
    assignmentsCount: 3,
    rating: 4.92
  },
  {
    id: 'inst-shakil',
    personId: 'person-shakil',
    name: 'Shakil Anwar',
    email: 'shakil.anwar@brac.net',
    contactNumber: '+880 1611-443322',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    title: 'Climate Resilience & Disaster Hub Director',
    department: 'Climate Change & Disaster Management',
    specialization: ['Early Warning Systems', 'Emergency Logistics', 'Needs Assessment', 'Community Shelters'],
    bio: 'Emergency Response Lead with extensive deployment across Cyclone, Flash Flood, and Coastal Disaster relief operations. Trains emergency rapid deployment volunteers and community disaster teams.',
    status: 'Active',
    isAuthor: false,
    organizationId: 'tenant-brac',
    createdAt: '05/02/2026',
    assignmentsCount: 2,
    rating: 4.88
  },
  {
    id: 'inst-sadia',
    personId: 'person-sadia',
    name: 'Sadia Rahman',
    email: 'sadia.rahman@brac.net',
    contactNumber: '+880 1713-334455',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    title: 'Digital Pedagogy & Assessment Lead',
    department: 'Education & Youth Skills (BEP)',
    specialization: ['Curriculum Design', 'Instructional Assessment', 'Interactive Media', 'Youth Empowerment'],
    bio: 'Senior Educational Technologist overseeing teacher training and adaptive e-learning curriculum design for BRAC Education Programme schools and technical vocational centers.',
    status: 'Active',
    isAuthor: true,
    authorId: 'auth-sadia',
    organizationId: 'tenant-brac',
    createdAt: '18/02/2026',
    assignmentsCount: 3,
    rating: 4.91
  },
  {
    id: 'inst-rafiq',
    personId: 'person-rafiq',
    name: 'Rafiqul Islam',
    email: 'rafiqul.i@brac.net',
    contactNumber: '+880 1718-990011',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    title: 'Senior Field Audit Instructor',
    department: 'Internal Audit & Governance',
    specialization: ['Financial Audit', 'Field Risk Sampling', 'Branch Verification'],
    bio: 'Veteran internal audit inspector with 15 years experience conducting surprise branch inspections and train-the-trainer workshops for junior credit officers.',
    status: 'Inactive',
    isAuthor: false,
    organizationId: 'tenant-brac',
    createdAt: '10/01/2026',
    assignmentsCount: 0,
    rating: 4.75
  }
];

export const INITIAL_INSTRUCTOR_ASSIGNMENTS: InstructorAssignmentRecord[] = [
  {
    id: 'inst-asg-1',
    instructorId: 'inst-tanvir',
    instructorName: 'Tanvir Hossain',
    instructorEmail: 'tanvir.hossain@brac.net',
    courseId: 'crs-brac-101',
    courseName: 'BRAC Microfinance Operations & Client Protection Principles',
    layer: 'Course Lead Faculty',
    layerType: 'course',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    courseStatus: 'Published',
    assignedDate: '10/01/2026'
  },
  {
    id: 'inst-asg-2',
    instructorId: 'inst-tanvir',
    instructorName: 'Tanvir Hossain',
    instructorEmail: 'tanvir.hossain@brac.net',
    courseId: 'crs-brac-101',
    courseName: 'BRAC Microfinance Operations & Client Protection Principles',
    layer: 'Module 1: Village Organization (VO) Foundations & Governance',
    layerType: 'module',
    nodeId: 'mod-1',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    courseStatus: 'Published',
    assignedDate: '12/01/2026'
  },
  {
    id: 'inst-asg-3',
    instructorId: 'inst-tanvir',
    instructorName: 'Tanvir Hossain',
    instructorEmail: 'tanvir.hossain@brac.net',
    courseId: 'crs-brac-101',
    courseName: 'BRAC Microfinance Operations & Client Protection Principles',
    layer: 'Lesson 1.1.2: Digital Ledger Reconciliation & Cash Security',
    layerType: 'lesson',
    nodeId: 'les-1-1-2',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    courseStatus: 'Published',
    assignedDate: '14/01/2026'
  },
  {
    id: 'inst-asg-4',
    instructorId: 'inst-tanvir',
    instructorName: 'Tanvir Hossain',
    instructorEmail: 'tanvir.hossain@brac.net',
    courseId: 'crs-brac-103',
    courseName: 'Community Disaster Preparedness & Flood Relief Logistics',
    layer: 'Module 2: Field Resource Logistics & Safe Cash Transfers',
    layerType: 'module',
    nodeId: 'mod-dp-2',
    lmsId: 'LMS-1972-03',
    lmsName: 'Climate Resilience & Humanitarian Action Institute',
    courseStatus: 'Published',
    assignedDate: '25/01/2026'
  },
  {
    id: 'inst-asg-5',
    instructorId: 'inst-farhana',
    instructorName: 'Farhana Ahmed',
    instructorEmail: 'farhana.ahmed@brac.net',
    courseId: 'crs-brac-101',
    courseName: 'BRAC Microfinance Operations & Client Protection Principles',
    layer: 'Module 2: Smart Credit Risk Assessment & Delinquency Prevention',
    layerType: 'module',
    nodeId: 'mod-2',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    courseStatus: 'Published',
    assignedDate: '15/01/2026'
  },
  {
    id: 'inst-asg-6',
    instructorId: 'inst-farhana',
    instructorName: 'Farhana Ahmed',
    instructorEmail: 'farhana.ahmed@brac.net',
    courseId: 'crs-brac-104',
    courseName: 'Social Enterprises Financial Governance & Compliance',
    layer: 'Course Lead Faculty',
    layerType: 'course',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    courseStatus: 'Draft',
    assignedDate: '02/02/2026'
  },
  {
    id: 'inst-asg-7',
    instructorId: 'inst-farhana',
    instructorName: 'Farhana Ahmed',
    instructorEmail: 'farhana.ahmed@brac.net',
    courseId: 'crs-brac-104',
    courseName: 'Social Enterprises Financial Governance & Compliance',
    layer: 'Module 1: Statutory Auditing & AML Compliance Standards',
    layerType: 'module',
    nodeId: 'mod-se-1',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    courseStatus: 'Draft',
    assignedDate: '05/02/2026'
  },
  {
    id: 'inst-asg-8',
    instructorId: 'inst-nusrat',
    instructorName: 'Nusrat Jahan',
    instructorEmail: 'nusrat.jahan@brac.net',
    courseId: 'crs-brac-102',
    courseName: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery',
    layer: 'Course Lead Faculty',
    layerType: 'course',
    lmsId: 'LMS-1972-02',
    lmsName: 'Ultra-Poor Graduation & Social Development Institute',
    courseStatus: 'Published',
    assignedDate: '20/01/2026'
  },
  {
    id: 'inst-asg-9',
    instructorId: 'inst-nusrat',
    instructorName: 'Nusrat Jahan',
    instructorEmail: 'nusrat.jahan@brac.net',
    courseId: 'crs-brac-102',
    courseName: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery',
    layer: 'Module 1: Household Selection & Vulnerability Indexing',
    layerType: 'module',
    nodeId: 'mod-upg-1',
    lmsId: 'LMS-1972-02',
    lmsName: 'Ultra-Poor Graduation & Social Development Institute',
    courseStatus: 'Published',
    assignedDate: '22/01/2026'
  },
  {
    id: 'inst-asg-10',
    instructorId: 'inst-nusrat',
    instructorName: 'Nusrat Jahan',
    instructorEmail: 'nusrat.jahan@brac.net',
    courseId: 'crs-brac-102',
    courseName: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery',
    layer: 'Lesson 1.1: Multi-Dimensional Poverty Scoring & Home Visits',
    layerType: 'lesson',
    nodeId: 'les-upg-1-1',
    lmsId: 'LMS-1972-02',
    lmsName: 'Ultra-Poor Graduation & Social Development Institute',
    courseStatus: 'Published',
    assignedDate: '24/01/2026'
  },
  {
    id: 'inst-asg-11',
    instructorId: 'inst-shakil',
    instructorName: 'Shakil Anwar',
    instructorEmail: 'shakil.anwar@brac.net',
    courseId: 'crs-brac-103',
    courseName: 'Community Disaster Preparedness & Flood Relief Logistics',
    layer: 'Course Lead Faculty',
    layerType: 'course',
    lmsId: 'LMS-1972-03',
    lmsName: 'Climate Resilience & Humanitarian Action Institute',
    courseStatus: 'Published',
    assignedDate: '25/01/2026'
  },
  {
    id: 'inst-asg-12',
    instructorId: 'inst-shakil',
    instructorName: 'Shakil Anwar',
    instructorEmail: 'shakil.anwar@brac.net',
    courseId: 'crs-brac-103',
    courseName: 'Community Disaster Preparedness & Flood Relief Logistics',
    layer: 'Module 1: Rapid Cyclone Warning & Emergency Evacuation Logistics',
    layerType: 'module',
    nodeId: 'mod-dp-1',
    lmsId: 'LMS-1972-03',
    lmsName: 'Climate Resilience & Humanitarian Action Institute',
    courseStatus: 'Published',
    assignedDate: '28/01/2026'
  },
  {
    id: 'inst-asg-13',
    instructorId: 'inst-sadia',
    instructorName: 'Sadia Rahman',
    instructorEmail: 'sadia.rahman@brac.net',
    courseId: 'crs-brac-102',
    courseName: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery',
    layer: 'Module 2: Sustainable Livelihood Asset Transfer Protocols',
    layerType: 'module',
    nodeId: 'mod-upg-2',
    lmsId: 'LMS-1972-02',
    lmsName: 'Ultra-Poor Graduation & Social Development Institute',
    courseStatus: 'Published',
    assignedDate: '25/01/2026'
  },
  {
    id: 'inst-asg-14',
    instructorId: 'inst-sadia',
    instructorName: 'Sadia Rahman',
    instructorEmail: 'sadia.rahman@brac.net',
    courseId: 'crs-brac-101',
    courseName: 'BRAC Microfinance Operations & Client Protection Principles',
    layer: 'Lesson 1.1.1: VO Formation & Meeting Governance',
    layerType: 'lesson',
    nodeId: 'les-1-1-1',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    courseStatus: 'Published',
    assignedDate: '12/01/2026'
  },
  {
    id: 'inst-asg-15',
    instructorId: 'inst-sadia',
    instructorName: 'Sadia Rahman',
    instructorEmail: 'sadia.rahman@brac.net',
    courseId: 'crs-brac-104',
    courseName: 'Social Enterprises Financial Governance & Compliance',
    layer: 'Module 2: Internal Control Frameworks & Whistleblower Operations',
    layerType: 'module',
    nodeId: 'mod-se-2',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    courseStatus: 'Draft',
    assignedDate: '10/02/2026'
  }
];
