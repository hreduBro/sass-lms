export type RatingLevel = 'plan' | 'phase' | 'course';
export type RatingDimension = 'overall' | 'content' | 'instructor';
export type RatingScale = 'star5' | 'csat10' | 'smiley3';
export type RatingAvailability = 'onCompletion' | 'earlyAllowed';

export interface RatingSubmission {
  id: string;
  planId: string;
  phaseId?: string;
  phaseName?: string;
  courseId?: string;
  courseTitle?: string;
  level: RatingLevel;
  dimension: RatingDimension;
  value: number; // 1-5 for star5, 1-10 for csat10, 1-3 for smiley3
  scale: RatingScale;
  comment?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  submittedAt: string; // DD:MM:YYYY HH:MM:SS
}

export interface RatingSummary {
  level: RatingLevel;
  entityId: string;
  entityName: string;
  averageValue: number;
  totalCount: number;
  scale: RatingScale;
  dimensionAverages: {
    overall: number;
    content: number;
    instructor: number;
  };
  distribution: { [score: number]: number };
  recentComments: {
    userId: string;
    userName: string;
    userAvatar?: string;
    value: number;
    comment: string;
    dimension: RatingDimension;
    submittedAt: string;
  }[];
}

// -------------------------------------------------------------
// PART B — FEEDBACK FORMS & VERSIONING ENGINE
// -------------------------------------------------------------

export type FeedbackQuestionType = 'text' | 'singleSelect' | 'multiSelect';
export type FeedbackVersionState = 'draft' | 'published-current' | 'published-superseded' | 'archived';

export interface FeedbackOption {
  optionId: string;
  text: string;
}

export interface FeedbackQuestion {
  questionId: string;
  type: FeedbackQuestionType;
  text: string;
  required: boolean;
  options?: FeedbackOption[];
  placeholder?: string;
  order: number;
}

export interface FeedbackFormVersion {
  versionId: string;
  feedbackFormId: string;
  versionLabel: string; // e.g. 'v1', 'v2', 'v3'
  state: FeedbackVersionState;
  questions: FeedbackQuestion[];
  publishedAt?: string;
  publishedBy?: string;
  changeSummary?: string;
  responseCount: number;
}

export interface FeedbackForm {
  feedbackFormId: string;
  planId: string;
  planName?: string;
  title: string;
  description?: string;
  enabled: boolean;
  currentVersionId: string;
  versions: FeedbackFormVersion[];
  associatedPhaseIds: string[]; // Phase IDs associated with this form
  releaseTiming: 'after_plan_completion' | 'after_phase_completion' | 'on_demand';
  anonymous: boolean;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  text?: string | null;
}

export interface FeedbackResponse {
  responseId: string;
  feedbackFormId: string;
  feedbackFormVersionId: string; // Required for historical interpretability (§3.3)
  versionLabel: string;
  planId: string;
  planName?: string;
  phaseId?: string;
  phaseName?: string;
  traineeId?: string;
  traineeName?: string;
  traineeEmail?: string;
  traineeAvatar?: string;
  isAnonymous: boolean;
  answers: FeedbackAnswer[];
  submittedAt: string; // DD:MM:YYYY HH:MM:SS
}

// -------------------------------------------------------------
// PART C — DISCUSSION FORUM & RICH ATTACHMENTS
// -------------------------------------------------------------

export type TopicCreationPermission = 'instructorsOnly' | 'instructorsAndTrainees';
export type TopicPostPermission = 'instructorsOnly' | 'instructorsAndTrainees';
export type ModerationPermission = 'instructors' | 'admins' | 'instructorsAndAdmins';
export type VisibilityScope = 'allUsers' | 'selectedBatches';
export type AttachmentSource = 'contentRepository' | 'directUpload';
export type AttachmentType = 'video' | 'audio' | 'file';

export interface AllowedPostFormats {
  text: boolean;
  attachmentsFromContentRepository: boolean;
  directUpload: boolean;
  allowedTypes: AttachmentType[];
  maxAttachmentSizeMb: number;
}

export interface ForumAttachment {
  attachmentId: string;
  source: AttachmentSource;
  type: AttachmentType;
  ref: string; // Repo Asset ID or File URL
  name: string;
  sizeBytes: number;
  mime: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
}

export interface ForumPost {
  postId: string;
  topicId: string;
  parentPostId?: string | null; // For threaded replies
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: 'instructor' | 'trainee' | 'admin';
  authorAvatar?: string;
  text: string;
  attachments: ForumAttachment[];
  createdAt: string; // DD:MM:YYYY HH:MM:SS
  editedAt?: string | null;
  hidden: boolean; // Hidden via moderation
  likesCount?: number;
  likedByCurrentUser?: boolean;
  replies?: ForumPost[];
}

export interface ForumTopic {
  topicId: string;
  forumId: string;
  planId: string;
  title: string;
  description?: string;
  categoryTag?: string;
  createdBy: string;
  createdById: string;
  createdByRole: 'instructor' | 'trainee' | 'admin';
  createdByAvatar?: string;
  createdAt: string; // DD:MM:YYYY HH:MM:SS
  postPermission: TopicPostPermission; // Per-topic override (§4.4)
  locked: boolean;
  pinned: boolean;
  postCount: number;
  lastActivityAt: string; // DD:MM:YYYY HH:MM:SS
  posts: ForumPost[];
}

export interface DiscussionForum {
  forumId: string;
  planId: string;
  enabled: boolean;
  topicCreationPermission: TopicCreationPermission;
  moderationPermission: ModerationPermission;
  visibilityScope: VisibilityScope;
  selectedBatchIds: string[];
  allowedPostFormats: AllowedPostFormats;
  topics: ForumTopic[];
}

// -------------------------------------------------------------
// CONTENT REPOSITORY CONTRACT (for attachments browsing/picking)
// -------------------------------------------------------------

export interface ContentRepoAsset {
  id: string;
  title: string;
  type: AttachmentType;
  category: string;
  sizeBytes: number;
  sizeFormatted: string;
  url: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
}

// -------------------------------------------------------------
// INITIAL REPOSITORY ASSETS FOR ATTACHMENT BROWSER
// -------------------------------------------------------------

export const INITIAL_CONTENT_REPO_ASSETS: ContentRepoAsset[] = [
  {
    id: 'asset-vid-01',
    title: 'Village Organization Micro-Disbursement Protocol Video',
    type: 'video',
    category: 'Field Operations',
    sizeBytes: 48500000,
    sizeFormatted: '46.2 MB',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=400&q=80',
    durationMinutes: 12,
    tags: ['Disbursement', 'Village Organization', 'Security'],
    uploadedBy: 'Farhana Ahmed',
    uploadedAt: '12/01/2026'
  },
  {
    id: 'asset-vid-02',
    title: 'Biometric Tablet POS KYC Troubleshooting Walkthrough',
    type: 'video',
    category: 'Digital Systems',
    sizeBytes: 32400000,
    sizeFormatted: '30.9 MB',
    url: 'https://www.w3schools.com/html/movie.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
    durationMinutes: 8,
    tags: ['Biometric POS', 'KYC', 'Troubleshooting'],
    uploadedBy: 'Tanvir Hossain',
    uploadedAt: '18/01/2026'
  },
  {
    id: 'asset-aud-01',
    title: 'Client Financial Grievance De-escalation Audio Case Study',
    type: 'audio',
    category: 'Customer Protection',
    sizeBytes: 14200000,
    sizeFormatted: '13.5 MB',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    durationMinutes: 14,
    tags: ['Grievance', 'Customer Service', 'Audio Case Study'],
    uploadedBy: 'Dr. Imran Matin',
    uploadedAt: '20/01/2026'
  },
  {
    id: 'asset-aud-02',
    title: 'Branch Manager Weekly Debrief Podcast - Over-indebtedness Prevention',
    type: 'audio',
    category: 'Leadership & Risk',
    sizeBytes: 18500000,
    sizeFormatted: '17.6 MB',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    durationMinutes: 19,
    tags: ['Podcast', 'Risk Mitigation', 'Leadership'],
    uploadedBy: 'Tanvir Hossain',
    uploadedAt: '25/01/2026'
  },
  {
    id: 'asset-doc-01',
    title: 'Smart Campaign Client Protection Standards Manual (2026 Edition)',
    type: 'file',
    category: 'Compliance Manuals',
    sizeBytes: 4200000,
    sizeFormatted: '4.0 MB',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    tags: ['Smart Campaign', 'Compliance', 'Field Manual'],
    uploadedBy: 'Farhana Ahmed',
    uploadedAt: '05/01/2026'
  },
  {
    id: 'asset-doc-02',
    title: 'Emergency Flood Relief Micro-Insurance Claim Form & Guidelines',
    type: 'file',
    category: 'Disaster Relief',
    sizeBytes: 2800000,
    sizeFormatted: '2.7 MB',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    tags: ['Micro-Insurance', 'Disaster Relief', 'Forms'],
    uploadedBy: 'Tanvir Hossain',
    uploadedAt: '10/02/2026'
  },
  {
    id: 'asset-doc-03',
    title: 'Cybersecurity Incident Escalation Matrix (SOC-2 Verified)',
    type: 'file',
    category: 'Security Protocols',
    sizeBytes: 1900000,
    sizeFormatted: '1.8 MB',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    tags: ['Cybersecurity', 'SOC-2', 'Escalation'],
    uploadedBy: 'Shakil Anwar',
    uploadedAt: '15/02/2026'
  }
];

// -------------------------------------------------------------
// INITIAL RATINGS MOCK DATA
// -------------------------------------------------------------

export const INITIAL_RATINGS: RatingSubmission[] = [
  {
    id: 'rat-01',
    planId: 'plan-brac-01',
    level: 'plan',
    dimension: 'overall',
    value: 5,
    scale: 'star5',
    comment: 'Exceptional curriculum. The blend of Village Organization field ethics and digital POS workflows directly improved our branch operations.',
    userId: 'usr-brac-10',
    userName: 'Kazi Naimur Rahman',
    userEmail: 'naimur.rahman@brac.net',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    submittedAt: '18:02:2026 14:22:10'
  },
  {
    id: 'rat-02',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-1',
    phaseName: 'Phase 1: Foundation & Smart Campaign Principles',
    level: 'phase',
    dimension: 'content',
    value: 5,
    scale: 'star5',
    comment: 'The Smart Campaign case studies and responsible finance interactive labs were extremely insightful.',
    userId: 'usr-brac-11',
    userName: 'Sabina Yasmin',
    userEmail: 'sabina.yasmin@brac.net',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    submittedAt: '20:02:2026 16:45:30'
  },
  {
    id: 'rat-03',
    planId: 'plan-brac-01',
    courseId: 'course-brac-101',
    courseTitle: 'BRAC Microfinance Operations & Client Protection Principles (2026)',
    level: 'course',
    dimension: 'instructor',
    value: 5,
    scale: 'star5',
    comment: 'Tanvir Hossain explains complex credit risk and client safeguarding protocols with real village examples.',
    userId: 'usr-brac-12',
    userName: 'Mahmudul Hasan',
    userEmail: 'mahmudul.hasan@brac.net',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    submittedAt: '22:02:2026 11:15:00'
  },
  {
    id: 'rat-04',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-2',
    phaseName: 'Phase 2: Digital Credit & Biometric KYC Operations',
    level: 'phase',
    dimension: 'overall',
    value: 4,
    scale: 'star5',
    comment: 'Great tablet POS simulations, though additional exercises on low-network offline syncing would be great.',
    userId: 'usr-brac-13',
    userName: 'Farzana Parveen',
    userEmail: 'farzana.parveen@brac.net',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    submittedAt: '24:02:2026 09:30:15'
  },
  {
    id: 'rat-05',
    planId: 'plan-brac-02',
    level: 'plan',
    dimension: 'overall',
    value: 5,
    scale: 'star5',
    comment: 'The participatory community mapping and household poverty scorecards have revolutionized our field casework.',
    userId: 'usr-brac-14',
    userName: 'Rezaul Karim',
    userEmail: 'rezaul.karim@brac.net',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    submittedAt: '26:02:2026 15:10:45'
  }
];

// -------------------------------------------------------------
// INITIAL FEEDBACK FORMS & HISTORICAL VERSIONS MOCK DATA
// -------------------------------------------------------------

export const INITIAL_FEEDBACK_FORMS: FeedbackForm[] = [
  {
    feedbackFormId: 'fb-form-brac-01',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    title: 'Comprehensive Plan & Curriculum Evaluation Form',
    description: 'Mandatory feedback instrument evaluating instructional clarity, field relevance, and technological tooling.',
    enabled: true,
    currentVersionId: 'fb-ver-brac-01-v2',
    associatedPhaseIds: ['phase-brac-01-1', 'phase-brac-01-2', 'phase-brac-01-3', 'phase-brac-01-4'],
    releaseTiming: 'after_plan_completion',
    anonymous: false,
    status: 'published',
    createdAt: '15/01/2026',
    updatedAt: '20/02/2026',
    versions: [
      {
        versionId: 'fb-ver-brac-01-v1',
        feedbackFormId: 'fb-form-brac-01',
        versionLabel: 'v1',
        state: 'published-superseded',
        publishedAt: '15/01/2026 10:00:00',
        publishedBy: 'Farhana Ahmed',
        changeSummary: 'Initial baseline survey with 3 core questions.',
        responseCount: 24,
        questions: [
          {
            questionId: 'q1',
            type: 'singleSelect',
            text: 'How relevant was the curriculum to your daily branch and field credit operations?',
            required: true,
            order: 1,
            options: [
              { optionId: 'o1', text: 'Extremely Relevant — applied immediately to Village Organizations' },
              { optionId: 'o2', text: 'Moderately Relevant — reinforced existing knowledge' },
              { optionId: 'o3', text: 'Slightly Relevant — needed more local field context' },
              { optionId: 'o4', text: 'Not Relevant' }
            ]
          },
          {
            questionId: 'q2',
            type: 'multiSelect',
            text: 'Which operational modules delivered the highest practical value?',
            required: true,
            order: 2,
            options: [
              { optionId: 'm1', text: 'Smart Campaign Client Protection & Transparent Pricing' },
              { optionId: 'm2', text: 'Biometric Tablet POS & Instant Disbursement Verification' },
              { optionId: 'm3', text: 'Borrower Over-indebtedness & Capacity Scoring' },
              { optionId: 'm4', text: 'Emergency Flood Relief Insurance Processing' }
            ]
          },
          {
            questionId: 'q3',
            type: 'text',
            text: 'What specific operational topics or simulation labs should be expanded in future cycles?',
            required: false,
            placeholder: 'Share your recommendations for syllabus enhancement...',
            order: 3
          }
        ]
      },
      {
        versionId: 'fb-ver-brac-01-v2',
        feedbackFormId: 'fb-form-brac-01',
        versionLabel: 'v2',
        state: 'published-current',
        publishedAt: '20/02/2026 14:30:00',
        publishedBy: 'Farhana Ahmed',
        changeSummary: 'Added instructor responsiveness question and streamlined options.',
        responseCount: 16,
        questions: [
          {
            questionId: 'q1',
            type: 'singleSelect',
            text: 'How relevant was the curriculum to your daily branch and field credit operations?',
            required: true,
            order: 1,
            options: [
              { optionId: 'o1', text: 'Extremely Relevant — applied immediately to Village Organizations' },
              { optionId: 'o2', text: 'Moderately Relevant — reinforced existing knowledge' },
              { optionId: 'o3', text: 'Slightly Relevant — needed more local field context' },
              { optionId: 'o4', text: 'Not Relevant' }
            ]
          },
          {
            questionId: 'q2',
            type: 'multiSelect',
            text: 'Which operational modules delivered the highest practical value?',
            required: true,
            order: 2,
            options: [
              { optionId: 'm1', text: 'Smart Campaign Client Protection & Transparent Pricing' },
              { optionId: 'm2', text: 'Biometric Tablet POS & Instant Disbursement Verification' },
              { optionId: 'm3', text: 'Borrower Over-indebtedness & Capacity Scoring' },
              { optionId: 'm4', text: 'Emergency Flood Relief Insurance Processing' }
            ]
          },
          {
            questionId: 'q3_new',
            type: 'singleSelect',
            text: 'How satisfied were you with the timeliness and depth of instructor feedback in the Discussion Forum?',
            required: true,
            order: 3,
            options: [
              { optionId: 'ins1', text: 'Very Satisfied — fast turnarounds within 24 hours' },
              { optionId: 'ins2', text: 'Satisfied — questions were addressed adequately' },
              { optionId: 'ins3', text: 'Neutral — some topics took longer to answer' },
              { optionId: 'ins4', text: 'Unsatisfied — need more direct instructor office hours' }
            ]
          },
          {
            questionId: 'q4',
            type: 'text',
            text: 'What specific operational topics or simulation labs should be expanded in future cycles?',
            required: false,
            placeholder: 'Share your recommendations for syllabus enhancement...',
            order: 4
          }
        ]
      }
    ]
  }
];

export const INITIAL_FEEDBACK_RESPONSES: FeedbackResponse[] = [
  {
    responseId: 'resp-01',
    feedbackFormId: 'fb-form-brac-01',
    feedbackFormVersionId: 'fb-ver-brac-01-v1',
    versionLabel: 'v1',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    phaseId: 'phase-brac-01-1',
    phaseName: 'Phase 1: Foundation & Smart Campaign Principles',
    traineeId: 'usr-brac-10',
    traineeName: 'Kazi Naimur Rahman',
    traineeEmail: 'naimur.rahman@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isAnonymous: false,
    submittedAt: '28:01:2026 17:40:12',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o1'] },
      { questionId: 'q2', selectedOptionIds: ['m1', 'm2'] },
      { questionId: 'q3', text: 'Please include more simulated field roleplays on handling complex loan restructuring.' }
    ]
  },
  {
    responseId: 'resp-02',
    feedbackFormId: 'fb-form-brac-01',
    feedbackFormVersionId: 'fb-ver-brac-01-v1',
    versionLabel: 'v1',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-1',
    phaseName: 'Phase 1: Foundation & Smart Campaign Principles',
    traineeId: 'usr-brac-11',
    traineeName: 'Sabina Yasmin',
    traineeEmail: 'sabina.yasmin@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    isAnonymous: false,
    submittedAt: '02:02:2026 11:20:05',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o1'] },
      { questionId: 'q2', selectedOptionIds: ['m1', 'm3'] },
      { questionId: 'q3', text: 'The client protection checklists were easy to adapt in weekly Village meetings.' }
    ]
  },
  {
    responseId: 'resp-03',
    feedbackFormId: 'fb-form-brac-01',
    feedbackFormVersionId: 'fb-ver-brac-01-v2',
    versionLabel: 'v2',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-2',
    phaseName: 'Phase 2: Digital Credit & Biometric KYC Operations',
    traineeId: 'usr-brac-12',
    traineeName: 'Mahmudul Hasan',
    traineeEmail: 'mahmudul.hasan@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    isAnonymous: false,
    submittedAt: '24:02:2026 15:15:30',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o1'] },
      { questionId: 'q2', selectedOptionIds: ['m2', 'm3', 'm4'] },
      { questionId: 'q3_new', selectedOptionIds: ['ins1'] },
      { questionId: 'q4', text: 'Biometric POS tutorials in the discussion forum helped resolve offline sync bugs in 10 minutes.' }
    ]
  },
  {
    responseId: 'resp-04',
    feedbackFormId: 'fb-form-brac-01',
    feedbackFormVersionId: 'fb-ver-brac-01-v2',
    versionLabel: 'v2',
    planId: 'plan-brac-01',
    phaseId: 'phase-brac-01-2',
    phaseName: 'Phase 2: Digital Credit & Biometric KYC Operations',
    isAnonymous: true,
    submittedAt: '25:02:2026 18:05:40',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o2'] },
      { questionId: 'q2', selectedOptionIds: ['m2'] },
      { questionId: 'q3_new', selectedOptionIds: ['ins2'] },
      { questionId: 'q4', text: 'More practical video walkthroughs would make the assessment easier.' }
    ]
  }
];

// -------------------------------------------------------------
// INITIAL DISCUSSION FORUMS, TOPICS & POSTS MOCK DATA
// -------------------------------------------------------------

export const INITIAL_DISCUSSION_FORUMS: DiscussionForum[] = [
  {
    forumId: 'forum-brac-01',
    planId: 'plan-brac-01',
    enabled: true,
    topicCreationPermission: 'instructorsAndTrainees',
    moderationPermission: 'instructorsAndAdmins',
    visibilityScope: 'allUsers',
    selectedBatchIds: [],
    allowedPostFormats: {
      text: true,
      attachmentsFromContentRepository: true,
      directUpload: true,
      allowedTypes: ['video', 'audio', 'file'],
      maxAttachmentSizeMb: 50
    },
    topics: [
      {
        topicId: 'top-brac-01',
        forumId: 'forum-brac-01',
        planId: 'plan-brac-01',
        title: '📢 Official Announcement: Phase 2 Biometric POS Field Testing Guidelines',
        description: 'Mandatory operational directive regarding tablet firmware updates, biometric KYC checks, and offline buffer reconciliation.',
        categoryTag: 'Announcements',
        createdBy: 'Tanvir Hossain',
        createdById: 'usr-brac-01',
        createdByRole: 'instructor',
        createdByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        createdAt: '10:02:2026 09:00:00',
        postPermission: 'instructorsOnly', // Instructors only post in announcements (§4.4)
        locked: false,
        pinned: true,
        postCount: 2,
        lastActivityAt: '12:02:2026 14:15:00',
        posts: [
          {
            postId: 'post-01-1',
            topicId: 'top-brac-01',
            authorId: 'usr-brac-01',
            authorName: 'Tanvir Hossain',
            authorEmail: 'tanvir.hossain@brac.net',
            authorRole: 'instructor',
            authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
            text: 'Welcome to Phase 2 of our Microfinance Transformation Track. All branch personnel must download the attached **Client Protection Standards Manual (2026)** and watch the **Disbursement Protocol Video** before conducting live village disbursements.\n\nPlease note: This topic is reserved for faculty announcements. Trainees can post general questions in the "Q&A and Operational Debrief" topic.',
            attachments: [
              {
                attachmentId: 'att-01',
                source: 'contentRepository',
                type: 'video',
                ref: 'asset-vid-01',
                name: 'Village Organization Micro-Disbursement Protocol Video.mp4',
                sizeBytes: 48500000,
                mime: 'video/mp4',
                durationMinutes: 12,
                thumbnailUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=400&q=80'
              },
              {
                attachmentId: 'att-02',
                source: 'contentRepository',
                type: 'file',
                ref: 'asset-doc-01',
                name: 'Smart Campaign Client Protection Standards Manual (2026).pdf',
                sizeBytes: 4200000,
                mime: 'application/pdf'
              }
            ],
            createdAt: '10:02:2026 09:00:00',
            hidden: false,
            likesCount: 14,
            likedByCurrentUser: true
          },
          {
            postId: 'post-01-2',
            topicId: 'top-brac-01',
            authorId: 'usr-brac-01',
            authorName: 'Tanvir Hossain',
            authorEmail: 'tanvir.hossain@brac.net',
            authorRole: 'instructor',
            authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
            text: 'Update: We have uploaded the supplementary **Biometric Tablet POS KYC Troubleshooting Walkthrough**. Ensure your devices are running firmware v3.4.2 before Monday morning.',
            attachments: [
              {
                attachmentId: 'att-03',
                source: 'contentRepository',
                type: 'video',
                ref: 'asset-vid-02',
                name: 'Biometric Tablet POS KYC Troubleshooting Walkthrough.mp4',
                sizeBytes: 32400000,
                mime: 'video/mp4',
                durationMinutes: 8,
                thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80'
              }
            ],
            createdAt: '12:02:2026 14:15:00',
            hidden: false,
            likesCount: 8
          }
        ]
      },
      {
        topicId: 'top-brac-02',
        forumId: 'forum-brac-01',
        planId: 'plan-brac-01',
        title: '💬 Week 2 Q&A: Handling Offline Disconnects During Village Disbursements',
        description: 'Open discussion on network dropout handling, local SQLite cache security, and client verification procedures in rural areas.',
        categoryTag: 'Field Q&A',
        createdBy: 'Kazi Naimur Rahman',
        createdById: 'usr-brac-10',
        createdByRole: 'trainee',
        createdByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        createdAt: '14:02:2026 11:30:00',
        postPermission: 'instructorsAndTrainees', // Open to all participants
        locked: false,
        pinned: false,
        postCount: 3,
        lastActivityAt: '15:02:2026 16:20:00',
        posts: [
          {
            postId: 'post-02-1',
            topicId: 'top-brac-02',
            authorId: 'usr-brac-10',
            authorName: 'Kazi Naimur Rahman',
            authorEmail: 'naimur.rahman@brac.net',
            authorRole: 'trainee',
            authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            text: 'During our field visit in Netrokona haor area, cellular 4G signals dropped completely. The tablet stored 18 offline loan collections, but when syncing back at the branch, 2 records flagged a timestamp discrepancy. What is the standard protocol for supervisor manual clearance in this scenario?',
            attachments: [
              {
                attachmentId: 'att-04',
                source: 'directUpload',
                type: 'file',
                ref: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                name: 'Netrokona_Branch_Sync_Log_Excerpt.pdf',
                sizeBytes: 1240000,
                mime: 'application/pdf'
              }
            ],
            createdAt: '14:02:2026 11:30:00',
            hidden: false,
            likesCount: 6,
            likedByCurrentUser: true
          },
          {
            postId: 'post-02-2',
            topicId: 'top-brac-02',
            parentPostId: 'post-02-1',
            authorId: 'usr-brac-01',
            authorName: 'Tanvir Hossain',
            authorEmail: 'tanvir.hossain@brac.net',
            authorRole: 'instructor',
            authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
            text: 'Excellent question Naimur. When timestamp discrepancies happen due to device clock drift in offline mode:\n\n1. Branch Accounts Officer reviews the physical Village Collection Sheet (Form 04B).\n2. Cross-verify with the local fingerprint hash generated on the device.\n3. Execute the Supervisor Override PIN on the central portal.\n\nPlease listen to the attached audio case study explaining this exact scenario.',
            attachments: [
              {
                attachmentId: 'att-05',
                source: 'contentRepository',
                type: 'audio',
                ref: 'asset-aud-01',
                name: 'Client Financial Grievance De-escalation Audio Case Study.mp3',
                sizeBytes: 14200000,
                mime: 'audio/mpeg',
                durationMinutes: 14
              }
            ],
            createdAt: '14:02:2026 14:05:00',
            hidden: false,
            likesCount: 9
          },
          {
            postId: 'post-02-3',
            topicId: 'top-brac-02',
            parentPostId: 'post-02-2',
            authorId: 'usr-brac-11',
            authorName: 'Sabina Yasmin',
            authorEmail: 'sabina.yasmin@brac.net',
            authorRole: 'trainee',
            authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
            text: 'Thank you Tanvir Bhai! We followed this in Sylhet branch yesterday and the override cleared smoothly without delaying customer disbursement.',
            attachments: [],
            createdAt: '15:02:2026 16:20:00',
            hidden: false,
            likesCount: 4
          }
        ]
      },
      {
        topicId: 'top-brac-03',
        forumId: 'forum-brac-01',
        planId: 'plan-brac-01',
        title: '🔒 [Archived] Q1 Climate Insurance Policy Review & Flood Relief Protocols',
        description: 'Completed consultation topic for Phase 1. Topic is locked for archiving purposes.',
        categoryTag: 'Disaster Relief',
        createdBy: 'Farhana Ahmed',
        createdById: 'usr-brac-admin',
        createdByRole: 'admin',
        createdByAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
        createdAt: '01/02/2026 10:00:00',
        postPermission: 'instructorsAndTrainees',
        locked: true, // Locked topic (§4.7)
        pinned: false,
        postCount: 1,
        lastActivityAt: '05/02/2026 17:00:00',
        posts: [
          {
            postId: 'post-03-1',
            topicId: 'top-brac-03',
            authorId: 'usr-brac-admin',
            authorName: 'Farhana Ahmed',
            authorEmail: 'learning.admin@brac.net',
            authorRole: 'admin',
            authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
            text: 'Phase 1 climate insurance policy review concluded successfully. The revised Emergency Flood Relief Claim Form is archived below for future reference.',
            attachments: [
              {
                attachmentId: 'att-06',
                source: 'contentRepository',
                type: 'file',
                ref: 'asset-doc-02',
                name: 'Emergency Flood Relief Micro-Insurance Claim Form.pdf',
                sizeBytes: 2800000,
                mime: 'application/pdf'
              }
            ],
            createdAt: '01/02/2026 10:00:00',
            hidden: false,
            likesCount: 5
          }
        ]
      }
    ]
  }
];

// -------------------------------------------------------------
// PART D — PRE-TEST / POST-TEST QUESTIONNAIRES & VERSIONING ENGINE
// -------------------------------------------------------------

export type TestType = 'preTest' | 'postTest' | 'pre_test' | 'post_test';
export type QuestionType = 'text' | 'singleSelect' | 'multiSelect';
export type ScoringMode = 'scored' | 'unscored';
export type VersionState = 'draft' | 'published-current' | 'published-superseded' | 'archived';

export interface QuestionOption {
  optionId: string;
  text: string;
  correct?: boolean; // For auto-scoring when scored mode
}

export interface QuestionnaireQuestion {
  questionId: string;
  type: QuestionType;
  text: string;
  required: boolean;
  points?: number; // Point value for scored questions
  options?: QuestionOption[];
  placeholder?: string;
  explanation?: string;
  order: number;
}

export interface QuestionnaireVersion {
  versionId: string; // The retained "version identifier" (Mandatory)
  questionnaireId: string;
  versionLabel: string; // e.g. 'v1', 'v2', 'v3'
  state: VersionState;
  questions: QuestionnaireQuestion[];
  publishedAt?: string;
  publishedBy?: string;
  changeSummary?: string;
  responseCount: number;
}

export interface Questionnaire {
  questionnaireId: string; // Stable across versions
  id?: string;
  type?: 'pre_test' | 'post_test' | 'assessment' | 'diagnostic' | 'survey' | string;
  title: string;
  description?: string;
  category: string; // e.g. 'Field Credit Operations', 'Client Protection', 'Digital Systems'
  scoringMode: ScoringMode;
  currentVersionId: string; // Pointer to current published version
  status: 'draft' | 'published' | 'archived';
  versions: QuestionnaireVersion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  text?: string | null;
  isCorrect?: boolean;
  earnedPoints?: number;
  maxPoints?: number;
}

export interface TestResponse {
  responseId: string;
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  traineeAvatar?: string;
  planId: string;
  planName?: string;
  testType: TestType;
  questionnaireId: string;
  questionnaireVersionId: string; // ⚠️ MANDATORY version identifier (§5.4)
  versionLabel: string;
  submittedAt: string; // ⚠️ MANDATORY submission timestamp (§5.4) DD/MM/YYYY HH:MM:SS
  answers: TestAnswer[];
  score?: number; // Total points earned
  maxScore?: number; // Max possible points
  percentage?: number; // 0 - 100%
  result?: string; // e.g. "8/10 (80%)" or "Pass"
  passed?: boolean;
  attemptNumber: number;
}

export interface PrivacyPolicyConfig {
  resultsVisibilityMode: 'anonymized' | 'aggregatedOnly' | 'fullWithConsent' | 'adminOnly';
  allowExport: boolean;
  requireLearnerConsent: boolean;
  redactPersonalIdentifiableInfo: boolean;
  minResponsesForAggregate: number;
}

export interface RatingConfig {
  level: RatingLevel;
  enabled: boolean;
  scale: RatingScale;
  commentEnabled: boolean;
  commentRequired: boolean;
  availability: RatingAvailability;
}

// -------------------------------------------------------------
// INITIAL PRE/POST TEST QUESTIONNAIRES MOCK DATA
// -------------------------------------------------------------

export const INITIAL_QUESTIONNAIRES: Questionnaire[] = [
  {
    questionnaireId: 'qnr-brac-01',
    id: 'qnr-brac-01',
    type: 'pre_test',
    title: 'Microfinance Field Ethics, Client Protection & POS Operations Knowledge Check',
    description: 'Standardized assessment covering Smart Campaign Client Protection Standards, village micro-disbursement protocols, and tablet POS sync failure recovery.',
    category: 'Field Credit Operations',
    scoringMode: 'scored',
    currentVersionId: 'qver-brac-01-v2',
    status: 'published',
    createdBy: 'Farhana Ahmed',
    createdAt: '10/01/2026',
    updatedAt: '18/02/2026',
    versions: [
      {
        versionId: 'qver-brac-01-v1',
        questionnaireId: 'qnr-brac-01',
        versionLabel: 'v1',
        state: 'published-superseded',
        publishedAt: '10/01/2026 09:30:00',
        publishedBy: 'Farhana Ahmed',
        changeSummary: 'Baseline version featuring 4 foundational questions.',
        responseCount: 18,
        questions: [
          {
            questionId: 'q1',
            type: 'singleSelect',
            text: 'Under the Smart Campaign Client Protection Standards, what is the maximum permissible annual effective interest rate disclosure format?',
            required: true,
            points: 2,
            order: 1,
            options: [
              { optionId: 'o1', text: 'All-inclusive Annual Percentage Rate (APR) including processing fees and insurance', correct: true },
              { optionId: 'o2', text: 'Flat monthly nominal rate without processing fees', correct: false },
              { optionId: 'o3', text: 'Declining balance rate excluding compulsory group emergency funds', correct: false },
              { optionId: 'o4', text: 'Verbally communicated estimated weekly repayment amount', correct: false }
            ],
            explanation: 'Smart Campaign mandates full transparent disclosure of APR incorporating all compulsory add-on charges.'
          },
          {
            questionId: 'q2',
            type: 'multiSelect',
            text: 'Which of the following actions violate client safeguarding protocols during Village Organization weekly collections? (Select all that apply)',
            required: true,
            points: 3,
            order: 2,
            options: [
              { optionId: 'o1', text: 'Collecting repayments at a borrower\'s residence after 8:00 PM without consent', correct: true },
              { optionId: 'o2', text: 'Retaining a borrower\'s original National ID card as collateral security', correct: true },
              { optionId: 'o3', text: 'Issuing a verified digital receipt via SMS/Tablet POS immediately upon cash handover', correct: false },
              { optionId: 'o4', text: 'Publicly announcing overdue balances during group congregation', correct: true }
            ],
            explanation: 'Night visits, document retention, and public shaming are severe violations of client protection ethics.'
          },
          {
            questionId: 'q3',
            type: 'singleSelect',
            text: 'When a Biometric Tablet POS loses cellular connectivity during village disbursement, what is the immediate required protocol?',
            required: true,
            points: 2,
            order: 3,
            options: [
              { optionId: 'o1', text: 'Capture local offline biometric hash, record physical Form 04B, and sync at branch', correct: true },
              { optionId: 'o2', text: 'Halt all disbursements until 4G signal is restored', correct: false },
              { optionId: 'o3', text: 'Bypass biometric check and disburse purely on borrower oral acknowledgement', correct: false }
            ],
            explanation: 'Offline buffer with dual-entry Form 04B reconciliation ensures both security and uninterrupted client service.'
          },
          {
            questionId: 'q4',
            type: 'text',
            text: 'Describe the three key indicator flags that indicate borrower over-indebtedness risk during loan appraisal.',
            required: false,
            points: 3,
            order: 4,
            placeholder: 'Detail cash flow ratio, multiple MFI memberships, and utility payment delays...'
          }
        ]
      },
      {
        versionId: 'qver-brac-01-v2',
        questionnaireId: 'qnr-brac-01',
        versionLabel: 'v2',
        state: 'published-current',
        publishedAt: '18/02/2026 11:00:00',
        publishedBy: 'Tanvir Hossain',
        changeSummary: 'Updated question 3 with SOC-2 tablet encryption requirements and added climate insurance module question.',
        responseCount: 14,
        questions: [
          {
            questionId: 'q1',
            type: 'singleSelect',
            text: 'Under the Smart Campaign Client Protection Standards, what is the maximum permissible annual effective interest rate disclosure format?',
            required: true,
            points: 2,
            order: 1,
            options: [
              { optionId: 'o1', text: 'All-inclusive Annual Percentage Rate (APR) including processing fees and insurance', correct: true },
              { optionId: 'o2', text: 'Flat monthly nominal rate without processing fees', correct: false },
              { optionId: 'o3', text: 'Declining balance rate excluding compulsory group emergency funds', correct: false },
              { optionId: 'o4', text: 'Verbally communicated estimated weekly repayment amount', correct: false }
            ],
            explanation: 'Smart Campaign mandates full transparent disclosure of APR incorporating all compulsory add-on charges.'
          },
          {
            questionId: 'q2',
            type: 'multiSelect',
            text: 'Which of the following actions violate client safeguarding protocols during Village Organization weekly collections? (Select all that apply)',
            required: true,
            points: 3,
            order: 2,
            options: [
              { optionId: 'o1', text: 'Collecting repayments at a borrower\'s residence after 8:00 PM without consent', correct: true },
              { optionId: 'o2', text: 'Retaining a borrower\'s original National ID card as collateral security', correct: true },
              { optionId: 'o3', text: 'Issuing a verified digital receipt via SMS/Tablet POS immediately upon cash handover', correct: false },
              { optionId: 'o4', text: 'Publicly announcing overdue balances during group congregation', correct: true }
            ],
            explanation: 'Night visits, document retention, and public shaming are severe violations of client protection ethics.'
          },
          {
            questionId: 'q3',
            type: 'singleSelect',
            text: 'When a Biometric Tablet POS loses cellular connectivity during village disbursement, what is the immediate required protocol?',
            required: true,
            points: 2,
            order: 3,
            options: [
              { optionId: 'o1', text: 'Capture local offline biometric hash, record physical Form 04B, and sync at branch', correct: true },
              { optionId: 'o2', text: 'Halt all disbursements until 4G signal is restored', correct: false },
              { optionId: 'o3', text: 'Bypass biometric check and disburse purely on borrower oral acknowledgement', correct: false }
            ],
            explanation: 'Offline buffer with dual-entry Form 04B reconciliation ensures both security and uninterrupted client service.'
          },
          {
            questionId: 'q5_new',
            type: 'singleSelect',
            text: 'What is the required claim verification turnaround time for Emergency Flood Relief Micro-Insurance claims?',
            required: true,
            points: 3,
            order: 4,
            options: [
              { optionId: 'c1', text: 'Within 72 hours of Union Parishad flood declaration', correct: true },
              { optionId: 'c2', text: '14 calendar days after crop harvesting season', correct: false },
              { optionId: 'c3', text: '30 business days following satellite imagery confirmation', correct: false }
            ],
            explanation: 'Climate emergency micro-insurance claims must be disbursed within 72 hours to prevent distress asset sales.'
          },
          {
            questionId: 'q4',
            type: 'text',
            text: 'Describe the three key indicator flags that indicate borrower over-indebtedness risk during loan appraisal.',
            required: false,
            points: 2,
            order: 5,
            placeholder: 'Detail cash flow ratio, multiple MFI memberships, and utility payment delays...'
          }
        ]
      }
    ]
  },
  {
    questionnaireId: 'qnr-brac-02',
    title: 'Ultra-Poor Graduation Model: Household Targeting & Scorecard Methodology',
    description: 'Evaluation instrument testing participatory rural appraisal, wealth ranking methodologies, and asset transfer monitoring.',
    category: 'Poverty Graduation Programs',
    scoringMode: 'scored',
    currentVersionId: 'qver-brac-02-v1',
    status: 'published',
    createdBy: 'Dr. Imran Matin',
    createdAt: '20/01/2026',
    updatedAt: '20/01/2026',
    versions: [
      {
        versionId: 'qver-brac-02-v1',
        questionnaireId: 'qnr-brac-02',
        versionLabel: 'v1',
        state: 'published-current',
        publishedAt: '20/01/2026 14:00:00',
        publishedBy: 'Dr. Imran Matin',
        changeSummary: 'Initial release of household targeting questionnaire.',
        responseCount: 12,
        questions: [
          {
            questionId: 'up1',
            type: 'singleSelect',
            text: 'In the Ultra-Poor Graduation targeting funnel, which step follows Community Wealth Ranking?',
            required: true,
            points: 5,
            order: 1,
            options: [
              { optionId: 'u1', text: 'Primary Household Survey & Poverty Scorecard Verification', correct: true },
              { optionId: 'u2', text: 'Immediate Livelihood Asset Transfer', correct: false },
              { optionId: 'u3', text: 'Credit Bureau Bureaucratic Cross-Check', correct: false }
            ]
          },
          {
            questionId: 'up2',
            type: 'multiSelect',
            text: 'Which of the following are mandatory inclusion criteria for Ultra-Poor Asset Grant eligibility? (Select all that apply)',
            required: true,
            points: 5,
            order: 2,
            options: [
              { optionId: 'crit1', text: 'Female-headed household with active working-age labor capacity', correct: true },
              { optionId: 'crit2', text: 'Total land ownership under 10 decimals (including homestead)', correct: true },
              { optionId: 'crit3', text: 'Existing commercial micro-credit debt above BDT 50,000', correct: false },
              { optionId: 'crit4', text: 'No productive asset ownership generating regular income', correct: true }
            ]
          }
        ]
      }
    ]
  }
];

// -------------------------------------------------------------
// INITIAL TEST RESPONSES MOCK DATA (PRE-TEST & POST-TEST)
// -------------------------------------------------------------

export const INITIAL_TEST_RESPONSES: TestResponse[] = [
  // Learner 1 (Kazi Naimur Rahman) - PRE-TEST (Taken under v1)
  {
    responseId: 'tresp-01',
    traineeId: 'usr-brac-10',
    traineeName: 'Kazi Naimur Rahman',
    traineeEmail: 'naimur.rahman@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    testType: 'preTest',
    questionnaireId: 'qnr-brac-01',
    questionnaireVersionId: 'qver-brac-01-v1', // Retained v1 snapshot
    versionLabel: 'v1',
    submittedAt: '15/01/2026 10:45:12',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o2'], isCorrect: false, earnedPoints: 0, maxPoints: 2 },
      { questionId: 'q2', selectedOptionIds: ['o1', 'o2'], isCorrect: false, earnedPoints: 2, maxPoints: 3 },
      { questionId: 'q3', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q4', text: 'Heavy indebtedness, multiple borrowings, irregular repayment history.', isCorrect: true, earnedPoints: 2, maxPoints: 3 }
    ],
    score: 6,
    maxScore: 10,
    percentage: 60,
    result: '6/10 (60%)',
    passed: false,
    attemptNumber: 1
  },
  // Learner 1 (Kazi Naimur Rahman) - POST-TEST (Taken after plan completion under v2)
  {
    responseId: 'tresp-02',
    traineeId: 'usr-brac-10',
    traineeName: 'Kazi Naimur Rahman',
    traineeEmail: 'naimur.rahman@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    testType: 'postTest',
    questionnaireId: 'qnr-brac-01',
    questionnaireVersionId: 'qver-brac-01-v2', // Evaluated against v2
    versionLabel: 'v2',
    submittedAt: '25/02/2026 16:30:00',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q2', selectedOptionIds: ['o1', 'o2', 'o4'], isCorrect: true, earnedPoints: 3, maxPoints: 3 },
      { questionId: 'q3', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q5_new', selectedOptionIds: ['c1'], isCorrect: true, earnedPoints: 3, maxPoints: 3 },
      { questionId: 'q4', text: 'Debt-service-to-income ratio exceeding 40%, concurrent borrowing from 3+ MFIs, and selling productive livestock.', isCorrect: true, earnedPoints: 2, maxPoints: 2 }
    ],
    score: 12,
    maxScore: 12,
    percentage: 100,
    result: '12/12 (100%)',
    passed: true,
    attemptNumber: 1
  },
  // Learner 2 (Sabina Yasmin) - PRE-TEST
  {
    responseId: 'tresp-03',
    traineeId: 'usr-brac-11',
    traineeName: 'Sabina Yasmin',
    traineeEmail: 'sabina.yasmin@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    testType: 'preTest',
    questionnaireId: 'qnr-brac-01',
    questionnaireVersionId: 'qver-brac-01-v1',
    versionLabel: 'v1',
    submittedAt: '16/01/2026 09:15:30',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q2', selectedOptionIds: ['o1'], isCorrect: false, earnedPoints: 1, maxPoints: 3 },
      { questionId: 'q3', selectedOptionIds: ['o2'], isCorrect: false, earnedPoints: 0, maxPoints: 2 },
      { questionId: 'q4', text: 'Emergency loans taken from informal money lenders.', isCorrect: true, earnedPoints: 2, maxPoints: 3 }
    ],
    score: 5,
    maxScore: 10,
    percentage: 50,
    result: '5/10 (50%)',
    passed: false,
    attemptNumber: 1
  },
  // Learner 2 (Sabina Yasmin) - POST-TEST
  {
    responseId: 'tresp-04',
    traineeId: 'usr-brac-11',
    traineeName: 'Sabina Yasmin',
    traineeEmail: 'sabina.yasmin@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    testType: 'postTest',
    questionnaireId: 'qnr-brac-01',
    questionnaireVersionId: 'qver-brac-01-v2',
    versionLabel: 'v2',
    submittedAt: '26/02/2026 14:10:20',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q2', selectedOptionIds: ['o1', 'o2', 'o4'], isCorrect: true, earnedPoints: 3, maxPoints: 3 },
      { questionId: 'q3', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q5_new', selectedOptionIds: ['c1'], isCorrect: true, earnedPoints: 3, maxPoints: 3 },
      { questionId: 'q4', text: 'Repeated loan cycle without asset growth, high DTI, unverified guarantor.', isCorrect: true, earnedPoints: 2, maxPoints: 2 }
    ],
    score: 12,
    maxScore: 12,
    percentage: 100,
    result: '12/12 (100%)',
    passed: true,
    attemptNumber: 1
  },
  // Learner 3 (Mahmudul Hasan) - PRE-TEST
  {
    responseId: 'tresp-05',
    traineeId: 'usr-brac-12',
    traineeName: 'Mahmudul Hasan',
    traineeEmail: 'mahmudul.hasan@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    testType: 'preTest',
    questionnaireId: 'qnr-brac-01',
    questionnaireVersionId: 'qver-brac-01-v1',
    versionLabel: 'v1',
    submittedAt: '18/01/2026 11:20:00',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q2', selectedOptionIds: ['o1', 'o2', 'o4'], isCorrect: true, earnedPoints: 3, maxPoints: 3 },
      { questionId: 'q3', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q4', text: 'Household budget deficit, multiple borrowing sources.', isCorrect: true, earnedPoints: 2, maxPoints: 3 }
    ],
    score: 9,
    maxScore: 10,
    percentage: 90,
    result: '9/10 (90%)',
    passed: true,
    attemptNumber: 1
  },
  // Learner 3 (Mahmudul Hasan) - POST-TEST
  {
    responseId: 'tresp-06',
    traineeId: 'usr-brac-12',
    traineeName: 'Mahmudul Hasan',
    traineeEmail: 'mahmudul.hasan@brac.net',
    traineeAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    planId: 'plan-brac-01',
    planName: '2026 Microfinance Branch Transformation & Ethics Plan',
    testType: 'postTest',
    questionnaireId: 'qnr-brac-01',
    questionnaireVersionId: 'qver-brac-01-v2',
    versionLabel: 'v2',
    submittedAt: '27/02/2026 10:05:45',
    answers: [
      { questionId: 'q1', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q2', selectedOptionIds: ['o1', 'o2', 'o4'], isCorrect: true, earnedPoints: 3, maxPoints: 3 },
      { questionId: 'q3', selectedOptionIds: ['o1'], isCorrect: true, earnedPoints: 2, maxPoints: 2 },
      { questionId: 'q5_new', selectedOptionIds: ['c1'], isCorrect: true, earnedPoints: 3, maxPoints: 3 },
      { questionId: 'q4', text: 'Over 50% income committed to debt service, multiple micro-loans.', isCorrect: true, earnedPoints: 2, maxPoints: 2 }
    ],
    score: 12,
    maxScore: 12,
    percentage: 100,
    result: '12/12 (100%)',
    passed: true,
    attemptNumber: 1
  }
];

export const DEFAULT_PRIVACY_POLICY: PrivacyPolicyConfig = {
  resultsVisibilityMode: 'fullWithConsent',
  allowExport: true,
  requireLearnerConsent: true,
  redactPersonalIdentifiableInfo: false,
  minResponsesForAggregate: 3
};

