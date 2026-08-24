export type UserRole = 'system_admin' | 'lms_admin' | 'super_admin' | 'tenant_admin' | 'instructor' | 'learner';
export type TenantPlan = 'Starter' | 'Pro' | 'Enterprise';
export type TenantStatus = 'Active' | 'Trial' | 'Suspended' | 'In-Progress';
export type LessonType = 'video' | 'article' | 'quiz' | 'interactive_lab';
export type CourseCategory = 'Engineering' | 'Compliance & Security' | 'Leadership' | 'Healthcare' | 'Finance' | 'AI & Data' | 'Microfinance & Compliance' | 'Ultra-Poor Graduation' | 'Education & Youth Skills';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface TenantBranding {
  primaryColor: string;
  accentColor: string;
  tagline: string;
  bannerUrl: string;
  logoUrl: string;
  faviconUrl?: string;
  customCssEnabled: boolean;
  themePreset?: 'solid' | 'glassmorphism' | 'neumorphic';
  ssoProvider: 'SAML 2.0' | 'Okta' | 'Azure AD' | 'Google Workspace' | 'None';
}

export interface TenantStats {
  seatLimit: number;
  seatsUsed: number;
  totalCourses: number;
  totalLearners: number;
  completionRate: number;
  complianceRate: number;
  storageUsedGb: number;
  storageLimitGb: number;
}

export interface Tenant {
  id: string;
  numericId?: string; // 4-digit unique system-generated numeric ID (e.g. "4821")
  name: string;
  slug: string;
  domain: string;
  websiteUrl?: string;
  plan: TenantPlan;
  status: TenantStatus;
  isDraft?: boolean;
  timezone?: string;
  description?: string;
  address?: {
    line1: string;
    line2?: string;
    division: string;
    district: string;
    postalCode: string;
  };
  adminInfo?: {
    adminName: string;
    contactNumber: string;
    contactEmail: string;
  };
  resourceAllocation?: {
    databaseSizeGb: number;
    fileStorageGb: number;
    usageAlertThresholdPct: number;
    dataSharingMode: 'Yes – Shared' | 'No – Segregated' | 'Custom';
    customBatches?: { id: string; name: string; lmsInstanceIds: string[] }[];
  };
  branding: TenantBranding;
  departments: string[];
  stats: TenantStats;
  createdAt: string;
  renewalDate: string;
  adminEmail: string;
  features: {
    scormSupport: boolean;
    aiTutor: boolean;
    liveWebinars: boolean;
    customCertificates: boolean;
    whiteLabel: boolean;
    customDomain: boolean;
  };
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  title?: string;
  phone?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  skills?: string[];
  enrolledCourses: string[];
  completedCourses: string[];
  earnedCertificates: string[];
  points: number;
  badges: string[];
  lastActive: string;
  status: 'Active' | 'Invited' | 'Suspended';
  complianceStatus: 'Compliant' | 'At Risk' | 'Overdue';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  points: number;
}

export interface LessonResource {
  title: string;
  size: string;
  url: string;
  type: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number;
  summary: string;
  contentHtml?: string;
  videoUrl?: string;
  resources?: LessonResource[];
  quizQuestions?: QuizQuestion[];
  passingScorePercent?: number;
}

export interface CourseModule {
  id: string;
  title: string;
  durationMinutes: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  tenantId: string; // 'global' or specific tenant ID
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  category: CourseCategory;
  level: CourseLevel;
  durationMinutes: number;
  isMandatory: boolean;
  complianceDeadlineDays?: number;
  instructorName: string;
  instructorTitle: string;
  instructorAvatar: string;
  rating: number;
  reviewCount: number;
  enrolledCount: number;
  modules: CourseModule[];
  certificateEnabled: boolean;
  status: 'Published' | 'Draft' | 'Archived';
  tags: string[];
  createdAt: string;
  targetDepartments?: string[];
}

export interface CourseEnrollment {
  id: string;
  tenantId: string;
  userId: string;
  courseId: string;
  progressPercent: number;
  completedLessonIds: string[];
  quizScores: Record<string, number>;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt: string;
  completedAt?: string;
  lastAccessedLessonId?: string;
  assignedBy?: string;
  dueDate?: string;
}

export interface Certificate {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantLogo: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  category: string;
  issuedDate: string;
  verificationCode: string;
  gradeScore: number;
  instructorName: string;
  expiryDate?: string;
}

export interface LiveWebinar {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  instructor: string;
  instructorAvatar: string;
  hostName?: string;
  hostAvatar?: string;
  scheduledAt: string;
  durationMinutes: number;
  attendeeCount: number;
  attendeesCount?: number;
  maxAttendees?: number;
  platform: 'Zoom' | 'Teams' | 'Google Meet' | 'Built-in WebRTC' | 'MS Teams' | 'WebRTC' | 'BRAC Digital Stage (WebRTC)';
  status?: 'Upcoming' | 'Live' | 'Ended';
  joinUrl: string;
  courseId?: string;
  courseTitle?: string;
}

export type Webinar = LiveWebinar;

export interface AuditLog {
  id: string;
  tenantId: string;
  tenantName: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
  ipAddress: string;
}

export interface DepartmentMetric {
  department: string;
  learnersCount: number;
  avgCompletionRate: number;
  complianceRate: number;
  overdueCount: number;
}

// Navigation & Layout Configuration for Admins
export type NavigationLayoutMode = 'sidebar' | 'top_menu' | 'compact_rail';
export type HeaderDensity = 'comfortable' | 'compact';
export type ContentWidthMode = 'fluid' | 'constrained';

export interface AdminLayoutPreferences {
  navigationMode: NavigationLayoutMode;
  headerDensity: HeaderDensity;
  showBreadcrumbs: boolean;
  stickyHeader: boolean;
  contentWidth: ContentWidthMode;
  accentMode: 'brand' | 'neutral' | 'subtle';
}

// Dashboard Studio Widget Types & Models
export type DashboardWidgetType =
  | 'kpi_grid'
  | 'kpi_highlight'
  | 'chart_department_matrix'
  | 'chart_enrollment_trends'
  | 'chart_compliance_gauge'
  | 'chart_activity_heatmap'
  | 'learner_in_progress'
  | 'escalation_queue'
  | 'live_audit_feed'
  | 'upcoming_webinars'
  | 'gamification_leaderboard'
  | 'quick_actions'
  | 'certificates_ticker'
  | 'announcement_banner';

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  subtitle?: string;
  colSpan: 1 | 2 | 3 | 4; // Grid columns out of 4 (1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%)
  rowSpan?: 1 | 2 | 3 | 4; // Grid rows (1 = Compact ~220px, 2 = Standard ~380px, 3 = Tall ~540px, 4 = Deep ~700px)
  heightPx?: number; // Optional custom height override in pixels
  visibleForRoles: UserRole[];
  config?: {
    highlightMetric?: 'learners' | 'compliance' | 'completion' | 'xp' | 'certificates' | 'seats';
    bannerText?: string;
    bannerType?: 'info' | 'warning' | 'success' | 'indigo';
    chartTimeframe?: '7d' | '30d' | '90d';
    maxItems?: number;
    showSummaryBadge?: boolean;
    customAccentColor?: string;
  };
}

export interface CustomTenantDashboard {
  tenantId: string;
  isPublished: boolean;
  publishedAt: string;
  publishedBy: string;
  version: number;
  widgets: DashboardWidget[];
}

// Uniform Alert / Toast System Model
export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastAlert {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
  createdAt: number;
  badgeText?: string;
}

