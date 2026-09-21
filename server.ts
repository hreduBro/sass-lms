import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

// ----------------------------------------------------
// In-Memory Multi-Tenant LMS Database Seed
// ----------------------------------------------------
interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  domain: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Trial' | 'Suspended';
  branding: {
    primaryColor: string;
    accentColor: string;
    tagline: string;
    bannerUrl: string;
    logoUrl: string;
    faviconUrl?: string;
    customCssEnabled: boolean;
    ssoProvider: 'SAML 2.0' | 'Okta' | 'Azure AD' | 'Google Workspace' | 'None';
  };
  departments: string[];
  stats: {
    seatLimit: number;
    seatsUsed: number;
    totalCourses: number;
    totalLearners: number;
    completionRate: number;
    complianceRate: number;
    storageUsedGb: number;
    storageLimitGb: number;
  };
  createdAt: string;
  renewalDate: string;
}

interface CourseRecord {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMinutes: number;
  thumbnailUrl: string;
  instructorName: string;
  instructorTitle: string;
  instructorAvatar: string;
  isMandatory: boolean;
  complianceDueDate?: string;
  enrolledCount: number;
  rating: number;
  status: 'Published' | 'Draft' | 'Archived';
  tags: string[];
  modulesCount: number;
  createdAt: string;
}

interface LearnerRecord {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'instructor' | 'learner';
  department: string;
  avatarUrl: string;
  enrolledCourseIds: string[];
  completedCourseIds: string[];
  complianceStatus: 'Compliant' | 'At Risk' | 'Overdue';
  lastActive: string;
  learningHours: number;
  certificatesCount: number;
}

interface DashboardLayoutConfig {
  tenantId: string;
  updatedAt: string;
  updatedBy: string;
  widgets: Array<{
    id: string;
    type: string;
    title: string;
    size: 'sm' | 'md' | 'lg' | 'full';
    enabled: boolean;
    order: number;
  }>;
}

// Initial In-Memory State
let tenants: TenantRecord[] = [
  {
    id: 'tenant-1',
    name: 'Apex Global Enterprises',
    slug: 'apex-global',
    domain: 'learn.apexglobal.com',
    plan: 'Enterprise',
    status: 'Active',
    branding: {
      primaryColor: '#4f46e5',
      accentColor: '#06b6d4',
      tagline: 'Empowering enterprise excellence through continuous workforce learning',
      bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&h=200&q=80',
      customCssEnabled: true,
      ssoProvider: 'Okta'
    },
    departments: ['Executive Leadership', 'Cloud Architecture', 'Security & SecOps', 'Product Design', 'Global Sales'],
    stats: {
      seatLimit: 5000,
      seatsUsed: 3840,
      totalCourses: 142,
      totalLearners: 3840,
      completionRate: 88.4,
      complianceRate: 96.2,
      storageUsedGb: 412,
      storageLimitGb: 1000
    },
    createdAt: '2024-01-15',
    renewalDate: '2027-01-15'
  },
  {
    id: 'tenant-2',
    name: 'BioHealth Sciences Institute',
    slug: 'biohealth-institute',
    domain: 'academy.biohealthsci.org',
    plan: 'Enterprise',
    status: 'Active',
    branding: {
      primaryColor: '#059669',
      accentColor: '#10b981',
      tagline: 'Clinical protocols, FDA compliance, and biomedical continuing education',
      bannerUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1600&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=200&h=200&q=80',
      customCssEnabled: true,
      ssoProvider: 'Azure AD'
    },
    departments: ['Clinical Research', 'Regulatory Affairs', 'Laboratory Operations', 'Pharmacovigilance', 'Nursing'],
    stats: {
      seatLimit: 2500,
      seatsUsed: 1950,
      totalCourses: 98,
      totalLearners: 1950,
      completionRate: 93.1,
      complianceRate: 99.4,
      storageUsedGb: 280,
      storageLimitGb: 500
    },
    createdAt: '2024-03-10',
    renewalDate: '2026-03-10'
  },
  {
    id: 'tenant-3',
    name: 'FinTech Capital Partners',
    slug: 'fintech-capital',
    domain: 'portal.fintechcapital.io',
    plan: 'Pro',
    status: 'Active',
    branding: {
      primaryColor: '#0284c7',
      accentColor: '#f59e0b',
      tagline: 'Anti-Money Laundering, SOC2 governance, and quant finance academies',
      bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&h=200&q=80',
      customCssEnabled: false,
      ssoProvider: 'SAML 2.0'
    },
    departments: ['Trading & Analytics', 'Risk & AML Compliance', 'Engineering & DevSecOps', 'Legal & Governance'],
    stats: {
      seatLimit: 1200,
      seatsUsed: 890,
      totalCourses: 64,
      totalLearners: 890,
      completionRate: 85.7,
      complianceRate: 94.8,
      storageUsedGb: 145,
      storageLimitGb: 250
    },
    createdAt: '2024-06-20',
    renewalDate: '2026-06-20'
  }
];

let courses: CourseRecord[] = [
  {
    id: 'c-101',
    tenantId: 'tenant-1',
    title: 'ISO 27001 & SOC-2 Cybersecurity Governance 2026',
    description: 'Mandatory annual information security compliance training for all employees with privileged access.',
    category: 'Compliance & Security',
    level: 'Intermediate',
    durationMinutes: 75,
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    instructorName: 'Dr. Sarah Sterling',
    instructorTitle: 'Chief Information Security Officer',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80',
    isMandatory: true,
    complianceDueDate: '2026-09-30',
    enrolledCount: 1420,
    rating: 4.9,
    status: 'Published',
    tags: ['Cybersecurity', 'SOC-2', 'ISO27001', 'Mandatory'],
    modulesCount: 4,
    createdAt: '2024-01-20'
  },
  {
    id: 'c-102',
    tenantId: 'tenant-1',
    title: 'Modern Generative AI Architecture & LLM Engineering',
    description: 'Master practical prompt engineering, RAG pipelines, and multi-agent systems for enterprise applications.',
    category: 'AI & Data',
    level: 'Advanced',
    durationMinutes: 180,
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
    instructorName: 'Marcus Thorne',
    instructorTitle: 'VP of AI Research',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
    isMandatory: false,
    enrolledCount: 980,
    rating: 4.95,
    status: 'Published',
    tags: ['Generative AI', 'LLM', 'RAG', 'Python'],
    modulesCount: 6,
    createdAt: '2024-02-15'
  },
  {
    id: 'c-103',
    tenantId: 'tenant-2',
    title: 'Good Clinical Practice (GCP) & FDA 21 CFR Part 11',
    description: 'Essential certification for clinical trial investigators, data managers, and laboratory staff.',
    category: 'Healthcare',
    level: 'Advanced',
    durationMinutes: 120,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
    instructorName: 'Prof. Elena Rostova',
    instructorTitle: 'Head of Clinical Compliance',
    instructorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&h=100&q=80',
    isMandatory: true,
    complianceDueDate: '2026-10-15',
    enrolledCount: 840,
    rating: 4.88,
    status: 'Published',
    tags: ['FDA', 'GCP', 'Clinical Trials', 'Compliance'],
    modulesCount: 5,
    createdAt: '2024-03-25'
  }
];

let learners: LearnerRecord[] = [
  {
    id: 'u-1',
    tenantId: 'tenant-1',
    name: 'Alexandra Wright',
    email: 'alexandra.w@apexglobal.com',
    role: 'tenant_admin',
    department: 'Cloud Architecture',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    enrolledCourseIds: ['c-101', 'c-102'],
    completedCourseIds: ['c-101'],
    complianceStatus: 'Compliant',
    lastActive: '2026-08-20 09:30',
    learningHours: 42.5,
    certificatesCount: 4
  },
  {
    id: 'u-2',
    tenantId: 'tenant-1',
    name: 'David Chen',
    email: 'david.c@apexglobal.com',
    role: 'learner',
    department: 'Security & SecOps',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    enrolledCourseIds: ['c-101', 'c-102'],
    completedCourseIds: ['c-101', 'c-102'],
    complianceStatus: 'Compliant',
    lastActive: '2026-08-19 16:45',
    learningHours: 68.0,
    certificatesCount: 7
  },
  {
    id: 'u-3',
    tenantId: 'tenant-1',
    name: 'Sophia Patel',
    email: 'sophia.p@apexglobal.com',
    role: 'learner',
    department: 'Global Sales',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    enrolledCourseIds: ['c-101'],
    completedCourseIds: [],
    complianceStatus: 'At Risk',
    lastActive: '2026-08-10 11:20',
    learningHours: 12.0,
    certificatesCount: 1
  }
];

let auditLogs = [
  { id: 'log-1', tenantId: 'tenant-1', action: 'Tenant Settings Update', details: 'Updated theme branding and SSO metadata', user: 'Alexandra Wright', timestamp: new Date().toISOString(), type: 'info' },
  { id: 'log-2', tenantId: 'tenant-1', action: 'Course Publication', details: 'Published ISO 27001 course version 2026', user: 'Dr. Sarah Sterling', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'success' },
  { id: 'log-3', tenantId: 'tenant-1', action: 'Compliance Audit', details: 'Triggered annual automated compliance status check', user: 'System Service', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'warning' }
];

let dashboardConfigs: Record<string, DashboardLayoutConfig> = {
  'tenant-1': {
    tenantId: 'tenant-1',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Alexandra Wright (Super Admin)',
    widgets: [
      { id: 'w-kpi-1', type: 'kpi_cards', title: 'Executive KPI Metrics', size: 'full', enabled: true, order: 0 },
      { id: 'w-compliance-1', type: 'compliance_radar', title: 'Compliance & Audit Health', size: 'lg', enabled: true, order: 1 },
      { id: 'w-courses-1', type: 'course_grid', title: 'Active & Mandatory Courses', size: 'full', enabled: true, order: 2 },
      { id: 'w-analytics-1', type: 'completion_chart', title: 'Weekly Learning Trends', size: 'md', enabled: true, order: 3 },
      { id: 'w-leaderboard-1', type: 'learner_leaderboard', title: 'Department Leaderboard', size: 'sm', enabled: true, order: 4 }
    ]
  }
};

// ----------------------------------------------------
// REST API Endpoints
// ----------------------------------------------------

// 1. Health & Server Telemetry
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    version: '2.4.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      tenantsCount: tenants.length,
      coursesCount: courses.length,
      learnersCount: learners.length,
      auditLogsCount: auditLogs.length
    },
    aiEnabled: Boolean(process.env.GEMINI_API_KEY)
  });
});

// 2. Tenants API
app.get('/api/tenants', (req: Request, res: Response) => {
  const { search, plan, status } = req.query;
  let results = [...tenants];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(t => t.name.toLowerCase().includes(q) || t.domain.toLowerCase().includes(q));
  }
  if (plan && typeof plan === 'string') {
    results = results.filter(t => t.plan === plan);
  }
  if (status && typeof status === 'string') {
    results = results.filter(t => t.status === status);
  }

  res.json({ success: true, count: results.length, data: results });
});

app.get('/api/tenants/:id', (req: Request, res: Response) => {
  const tenant = tenants.find(t => t.id === req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Tenant workspace not found' });
  }
  res.json({ success: true, data: tenant });
});

app.post('/api/tenants', (req: Request, res: Response) => {
  const { name, domain, plan = 'Starter', branding, departments = [] } = req.body;
  if (!name || !domain) {
    return res.status(400).json({ success: false, error: 'Name and domain are required' });
  }

  const newTenant: TenantRecord = {
    id: `tenant-${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    domain,
    plan,
    status: 'Active',
    branding: branding || {
      primaryColor: '#4f46e5',
      accentColor: '#06b6d4',
      tagline: 'Welcome to your enterprise learning portal',
      bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&h=200&q=80',
      customCssEnabled: false,
      ssoProvider: 'None'
    },
    departments: departments.length ? departments : ['General'],
    stats: {
      seatLimit: plan === 'Enterprise' ? 5000 : plan === 'Pro' ? 1000 : 250,
      seatsUsed: 1,
      totalCourses: 0,
      totalLearners: 1,
      completionRate: 0,
      complianceRate: 100,
      storageUsedGb: 0.5,
      storageLimitGb: plan === 'Enterprise' ? 1000 : plan === 'Pro' ? 250 : 50
    },
    createdAt: new Date().toISOString().split('T')[0],
    renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  tenants.push(newTenant);
  auditLogs.unshift({
    id: `log-${Date.now()}`,
    tenantId: newTenant.id,
    action: 'Tenant Provisioned',
    details: `Provisioned new workspace: ${newTenant.name} (${newTenant.plan})`,
    user: 'Super Admin',
    timestamp: new Date().toISOString(),
    type: 'success'
  });

  res.status(201).json({ success: true, message: 'Tenant provisioned successfully', data: newTenant });
});

app.put('/api/tenants/:id', (req: Request, res: Response) => {
  const index = tenants.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Tenant workspace not found' });
  }

  tenants[index] = {
    ...tenants[index],
    ...req.body,
    branding: { ...tenants[index].branding, ...(req.body.branding || {}) }
  };

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    tenantId: req.params.id,
    action: 'Tenant Branding Updated',
    details: `Updated workspace settings and theme branding for ${tenants[index].name}`,
    user: 'Administrator',
    timestamp: new Date().toISOString(),
    type: 'info'
  });

  res.json({ success: true, message: 'Tenant updated successfully', data: tenants[index] });
});

app.delete('/api/tenants/:id', (req: Request, res: Response) => {
  const index = tenants.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Tenant not found' });
  }
  const deleted = tenants.splice(index, 1)[0];
  res.json({ success: true, message: `Tenant ${deleted.name} decommissioned` });
});

// ----------------------------------------------------
// 2b. Login Branding & Authentication Experience API
// ----------------------------------------------------
let loginBrandingConfig: any = {
  id: 'branding-brac-master',
  tenantId: 'tenant-brac',
  pageTitle: 'BRAC Learning Management Portal — Sign In',
  headline: 'Welcome to BRAC Learning Portal',
  subheadline: 'Enterprise Multi-Tenant Learning Management System',
  tagline: 'Empowering knowledge and skills across Bangladesh and global operations',
  logoUrlLight: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=300&h=80&q=80',
  logoUrlDark: '',
  logoHeightPx: 44,
  faviconUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=32&h=32&q=80',
  layout: 'split_modern_canvas',
  splitPosition: 'right',
  backgroundType: 'image',
  backgroundImageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1920&q=85',
  backgroundGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
  backgroundOverlayColor: '#090d16',
  backgroundOverlayOpacity: 65,
  backgroundBlurPx: 0,
  cardStyle: 'glassmorphism',
  cardBlurAmount: 16,
  cardBorderRadius: '2xl',
  cardShadow: '2xl',
  primaryColor: '#e1197e',
  accentColor: '#005b94',
  textColor: '#0f172a',
  buttonStyle: 'rounded',
  buttonGradientEnabled: false,
  enableSsoGoogle: true,
  enableSsoMicrosoft: true,
  enableSsoOkta: true,
  enableSsoSaml: false,
  enablePasswordLogin: true,
  enableRememberMe: true,
  enableForgotPassword: true,
  enableSelfRegistration: true,
  supportContactEmail: 'learning.support@brac.net',
  supportContactPhone: '+880 2 2222 81265',
  helpdeskUrl: 'https://helpdesk.brac.net',
  copyrightText: '© 2026 BRAC. All Rights Reserved.',
  privacyPolicyUrl: 'https://brac.net/privacy-policy',
  termsOfServiceUrl: 'https://brac.net/terms',
  showLanguagePicker: true,
  defaultLanguage: 'English',
  announcementBanner: {
    enabled: true,
    text: 'Scheduled system maintenance on Sunday at 02:00 UTC. SSO logins will remain uninterrupted.',
    type: 'info',
    style: 'floating_pill',
    dismissible: true
  },
  sidePanel: {
    badgeText: 'ENTERPRISE PORTAL',
    badgeIcon: 'verified_user',
    theme: 'glass',
    bullets: [
      { id: 'b1', icon: 'shield_lock', title: 'Protected by Cloud Security Shield', description: '256-bit AES encryption & adaptive threat radar' },
      { id: 'b2', icon: 'auto_awesome', title: 'Adaptive AI Learning Path', description: 'Real-time skill cluster mapping and smart recommendations' },
      { id: 'b3', icon: 'sync_saved_locally', title: 'Real-time Transcript Sync', description: 'Instant credentials and verifiable digital certificates' }
    ],
    showSecurityShield: true,
    showStatsRow: true,
    stat1Value: '24,500+',
    stat1Label: 'Active Learners',
    stat2Value: '99.99%',
    stat2Label: 'SSO Uptime'
  },
  securityBadges: {
    showSslBadge: true,
    showSoc2Badge: true,
    showIsoBadge: true
  },
  customHtml: '',
  customCss: '',
  useCustomContentPanel: false,
  status: 'Published',
  version: 2.4,
  lastUpdatedBy: 'System Admin',
  lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
};

// GET current login branding configuration
app.get('/api/login-branding', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  // If specific tenant is queried, we can customize or merge tenant brand colors
  if (tenantId && tenantId !== 'all') {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      return res.json({
        success: true,
        data: {
          ...loginBrandingConfig,
          tenantId: tenant.id,
          headline: `Welcome to ${tenant.name}`,
          tagline: tenant.branding.tagline,
          primaryColor: tenant.branding.primaryColor || loginBrandingConfig.primaryColor,
          accentColor: tenant.branding.accentColor || loginBrandingConfig.accentColor,
          logoUrlLight: tenant.branding.logoUrl || loginBrandingConfig.logoUrlLight
        }
      });
    }
  }
  res.json({ success: true, data: loginBrandingConfig });
});

// PUT update draft branding configuration
app.put('/api/login-branding', (req: Request, res: Response) => {
  const updates = req.body;
  loginBrandingConfig = {
    ...loginBrandingConfig,
    ...updates,
    status: 'Draft',
    lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  res.json({
    success: true,
    message: 'Login branding configuration updated as Draft',
    data: loginBrandingConfig
  });
});

// POST publish branding configuration
app.post('/api/login-branding/publish', (req: Request, res: Response) => {
  const incoming = req.body || {};
  const author = req.body?.author || 'System Administrator';
  const newVersion = Math.round(((loginBrandingConfig.version || 2.4) + 0.1) * 10) / 10;

  loginBrandingConfig = {
    ...loginBrandingConfig,
    ...incoming,
    status: 'Published',
    version: newVersion,
    lastUpdatedBy: author,
    lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    tenantId: loginBrandingConfig.tenantId || 'tenant-brac',
    action: 'Login Branding Published',
    details: `Published Login Branding configuration v${newVersion} by ${author}`,
    user: author,
    timestamp: new Date().toISOString(),
    type: 'success'
  });

  res.json({
    success: true,
    message: `Login branding configuration v${newVersion} published successfully`,
    data: loginBrandingConfig
  });
});

// POST reset to enterprise defaults
app.post('/api/login-branding/reset', (req: Request, res: Response) => {
  loginBrandingConfig = {
    id: 'branding-brac-master',
    tenantId: 'tenant-brac',
    pageTitle: 'BRAC Learning Management Portal — Sign In',
    headline: 'Welcome to BRAC Learning Portal',
    subheadline: 'Enterprise Multi-Tenant Learning Management System',
    tagline: 'Empowering knowledge and skills across Bangladesh and global operations',
    logoUrlLight: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=300&h=80&q=80',
    logoHeightPx: 44,
    layout: 'split_modern_canvas',
    splitPosition: 'right',
    backgroundType: 'image',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1920&q=85',
    backgroundGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
    backgroundOverlayColor: '#090d16',
    backgroundOverlayOpacity: 65,
    backgroundBlurPx: 0,
    cardStyle: 'glassmorphism',
    cardBlurAmount: 16,
    cardBorderRadius: '2xl',
    cardShadow: '2xl',
    primaryColor: '#e1197e',
    accentColor: '#005b94',
    textColor: '#0f172a',
    buttonStyle: 'rounded',
    buttonGradientEnabled: false,
    enableSsoGoogle: true,
    enableSsoMicrosoft: true,
    enableSsoOkta: true,
    enableSsoSaml: false,
    enablePasswordLogin: true,
    enableRememberMe: true,
    enableForgotPassword: true,
    enableSelfRegistration: true,
    supportContactEmail: 'learning.support@brac.net',
    copyrightText: '© 2026 BRAC. All Rights Reserved.',
    privacyPolicyUrl: 'https://brac.net/privacy-policy',
    termsOfServiceUrl: 'https://brac.net/terms',
    showLanguagePicker: true,
    defaultLanguage: 'English',
    announcementBanner: {
      enabled: true,
      text: 'Scheduled system maintenance on Sunday at 02:00 UTC. SSO logins will remain uninterrupted.',
      type: 'info',
      style: 'floating_pill',
      dismissible: true
    },
    sidePanel: {
      badgeText: 'ENTERPRISE PORTAL',
      badgeIcon: 'verified_user',
      theme: 'glass',
      bullets: [
        { id: 'b1', icon: 'shield_lock', title: 'Protected by Cloud Security Shield', description: '256-bit AES encryption & adaptive threat radar' },
        { id: 'b2', icon: 'auto_awesome', title: 'Adaptive AI Learning Path', description: 'Real-time skill cluster mapping and smart recommendations' },
        { id: 'b3', icon: 'sync_saved_locally', title: 'Real-time Transcript Sync', description: 'Instant credentials and verifiable digital certificates' }
      ],
      showSecurityShield: true,
      showStatsRow: true,
      stat1Value: '24,500+',
      stat1Label: 'Active Learners',
      stat2Value: '99.99%',
      stat2Label: 'SSO Uptime'
    },
    securityBadges: {
      showSslBadge: true,
      showSoc2Badge: true,
      showIsoBadge: true
    },
    customHtml: '',
    customCss: '',
    status: 'Published',
    version: 1.0,
    lastUpdatedBy: 'System Admin',
    lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  res.json({
    success: true,
    message: 'Login branding reset to default enterprise settings',
    data: loginBrandingConfig
  });
});

// PATCH emergency announcement callout banner
app.patch('/api/login-branding/announcement', (req: Request, res: Response) => {
  const { enabled, text, type, style, actionText, dismissible } = req.body;
  loginBrandingConfig.announcementBanner = {
    ...loginBrandingConfig.announcementBanner,
    ...(enabled !== undefined && { enabled }),
    ...(text !== undefined && { text }),
    ...(type !== undefined && { type }),
    ...(style !== undefined && { style }),
    ...(actionText !== undefined && { actionText }),
    ...(dismissible !== undefined && { dismissible })
  };
  loginBrandingConfig.lastUpdatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

  res.json({
    success: true,
    message: 'Announcement callout banner updated successfully',
    data: loginBrandingConfig.announcementBanner
  });
});

// 3. Courses API
app.get('/api/courses', (req: Request, res: Response) => {
  const { tenantId, category, level, mandatory, status } = req.query;
  let results = [...courses];

  if (tenantId && typeof tenantId === 'string') {
    results = results.filter(c => c.tenantId === tenantId);
  }
  if (category && typeof category === 'string') {
    results = results.filter(c => c.category === category);
  }
  if (level && typeof level === 'string') {
    results = results.filter(c => c.level === level);
  }
  if (mandatory !== undefined) {
    results = results.filter(c => c.isMandatory === (mandatory === 'true'));
  }
  if (status && typeof status === 'string') {
    results = results.filter(c => c.status === status);
  }

  res.json({ success: true, count: results.length, data: results });
});

app.get('/api/courses/:id', (req: Request, res: Response) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }
  res.json({ success: true, data: course });
});

app.post('/api/courses', (req: Request, res: Response) => {
  const { tenantId, title, description, category, level = 'Beginner', durationMinutes = 60, instructorName, isMandatory = false } = req.body;
  if (!tenantId || !title || !description) {
    return res.status(400).json({ success: false, error: 'tenantId, title, and description are required' });
  }

  const newCourse: CourseRecord = {
    id: `c-${Date.now()}`,
    tenantId,
    title,
    description,
    category: category || 'Engineering',
    level,
    durationMinutes: Number(durationMinutes) || 60,
    thumbnailUrl: req.body.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    instructorName: instructorName || 'Instructional Lead',
    instructorTitle: req.body.instructorTitle || 'Senior Instructor',
    instructorAvatar: req.body.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
    isMandatory: Boolean(isMandatory),
    complianceDueDate: req.body.complianceDueDate,
    enrolledCount: 0,
    rating: 5.0,
    status: 'Published',
    tags: req.body.tags || [category || 'General'],
    modulesCount: req.body.modulesCount || 3,
    createdAt: new Date().toISOString().split('T')[0]
  };

  courses.unshift(newCourse);
  res.status(201).json({ success: true, message: 'Course created successfully', data: newCourse });
});

app.put('/api/courses/:id', (req: Request, res: Response) => {
  const index = courses.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }
  courses[index] = { ...courses[index], ...req.body };
  res.json({ success: true, message: 'Course updated successfully', data: courses[index] });
});

app.delete('/api/courses/:id', (req: Request, res: Response) => {
  const index = courses.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }
  const deleted = courses.splice(index, 1)[0];
  res.json({ success: true, message: `Course "${deleted.title}" deleted` });
});

// 4. Learners & Progress API
app.get('/api/learners', (req: Request, res: Response) => {
  const { tenantId, department, role, compliance } = req.query;
  let results = [...learners];

  if (tenantId && typeof tenantId === 'string') {
    results = results.filter(l => l.tenantId === tenantId);
  }
  if (department && typeof department === 'string') {
    results = results.filter(l => l.department === department);
  }
  if (role && typeof role === 'string') {
    results = results.filter(l => l.role === role);
  }
  if (compliance && typeof compliance === 'string') {
    results = results.filter(l => l.complianceStatus === compliance);
  }

  res.json({ success: true, count: results.length, data: results });
});

app.post('/api/learners/:id/progress', (req: Request, res: Response) => {
  const { courseId, completed = false, timeSpentMinutes = 15 } = req.body;
  const learner = learners.find(l => l.id === req.params.id);
  if (!learner) {
    return res.status(404).json({ success: false, error: 'Learner not found' });
  }

  learner.learningHours += Number(timeSpentMinutes) / 60;
  learner.lastActive = new Date().toISOString().replace('T', ' ').substring(0, 16);

  if (completed && !learner.completedCourseIds.includes(courseId)) {
    learner.completedCourseIds.push(courseId);
    learner.certificatesCount += 1;
  }

  res.json({ success: true, message: 'Progress recorded', data: learner });
});

// 5. Analytics & Multi-Tenant KPI Overview
app.get('/api/analytics', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const targetCourses = tenantId ? courses.filter(c => c.tenantId === tenantId) : courses;
  const targetLearners = tenantId ? learners.filter(l => l.tenantId === tenantId) : learners;

  const totalEnrollments = targetCourses.reduce((acc, c) => acc + c.enrolledCount, 0);
  const compliantCount = targetLearners.filter(l => l.complianceStatus === 'Compliant').length;
  const complianceRate = targetLearners.length ? Math.round((compliantCount / targetLearners.length) * 100) : 100;
  const avgLearningHours = targetLearners.length ? +(targetLearners.reduce((acc, l) => acc + l.learningHours, 0) / targetLearners.length).toFixed(1) : 0;

  res.json({
    success: true,
    data: {
      totalTenants: tenants.length,
      activeCourses: targetCourses.length,
      totalLearners: targetLearners.length,
      totalEnrollments,
      complianceRate,
      avgLearningHours,
      completionRate: 89.2,
      departmentDistribution: [
        { name: 'Cloud Architecture', learners: 124, completionRate: 94 },
        { name: 'Security & SecOps', learners: 88, completionRate: 98 },
        { name: 'Global Sales', learners: 156, completionRate: 82 },
        { name: 'Clinical Research', learners: 210, completionRate: 96 }
      ]
    }
  });
});

// 6. Drag-and-Drop Customizable Dashboard Configs API
app.get('/api/dashboards/:tenantId', (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const config = dashboardConfigs[tenantId] || {
    tenantId,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Default Template',
    widgets: [
      { id: 'w-kpi', type: 'kpi_cards', title: 'Key Performance Indicators', size: 'full', enabled: true, order: 0 },
      { id: 'w-compliance', type: 'compliance_radar', title: 'Compliance Radar', size: 'lg', enabled: true, order: 1 },
      { id: 'w-courses', type: 'course_grid', title: 'Course Catalog', size: 'full', enabled: true, order: 2 }
    ]
  };
  res.json({ success: true, data: config });
});

app.post('/api/dashboards/:tenantId', (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { widgets, updatedBy = 'Administrator' } = req.body;

  if (!widgets || !Array.isArray(widgets)) {
    return res.status(400).json({ success: false, error: 'Widgets array is required' });
  }

  dashboardConfigs[tenantId] = {
    tenantId,
    updatedAt: new Date().toISOString(),
    updatedBy,
    widgets
  };

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    tenantId,
    action: 'Dashboard Layout Published',
    details: `Updated and published custom dashboard layout with ${widgets.length} widgets`,
    user: updatedBy,
    timestamp: new Date().toISOString(),
    type: 'success'
  });

  res.json({ success: true, message: 'Custom dashboard layout published successfully', data: dashboardConfigs[tenantId] });
});

// 7. AI Course & Quiz Generator (Powered by Server-Side Gemini API)
app.post('/api/ai/generate-course', async (req: Request, res: Response) => {
  const { topic, audience = 'Enterprise Professionals', category = 'Compliance & Security', difficulty = 'Intermediate' } = req.body;

  if (!topic) {
    return res.status(400).json({ success: false, error: 'Course topic is required' });
  }

  try {
    const ai = getGenAI();

    if (ai) {
      // Real Server-Side Gemini Call
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `You are an expert Instructional Designer and Enterprise LMS Curriculum Architect.
Generate a comprehensive, structured course curriculum in strict valid JSON format for the topic: "${topic}".
Target Audience: ${audience}
Category: ${category}
Difficulty Level: ${difficulty}

Return ONLY valid JSON matching this exact structure:
{
  "title": "A compelling course title",
  "description": "2-3 sentence executive course summary",
  "estimatedMinutes": 90,
  "level": "${difficulty}",
  "category": "${category}",
  "learningObjectives": ["objective 1", "objective 2", "objective 3"],
  "modules": [
    {
      "id": "mod-1",
      "title": "Module 1 Title",
      "lessons": [
        { "title": "Lesson 1 Title", "type": "video", "durationMinutes": 15, "summary": "Brief summary" },
        { "title": "Lesson 2 Title", "type": "interactive_lab", "durationMinutes": 20, "summary": "Brief summary" }
      ]
    },
    {
      "id": "mod-2",
      "title": "Module 2 Title",
      "lessons": [
        { "title": "Lesson 3 Title", "type": "article", "durationMinutes": 15, "summary": "Brief summary" },
        { "title": "Final Assessment Quiz", "type": "quiz", "durationMinutes": 20, "summary": "Knowledge check" }
      ]
    }
  ]
}`
      });

      const text = response.text || '';
      // Clean JSON if model returned markdown code block
      const cleanJson = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleanJson);

      return res.json({
        success: true,
        source: 'gemini-3.7-flash',
        data: parsed
      });
    }

    // Fallback structured generation if API key is not yet set in environment
    const generatedCourse = {
      title: `${topic}: Masterclass for ${audience}`,
      description: `Comprehensive industry curriculum on ${topic}, designed specifically for ${audience} in ${category}.`,
      estimatedMinutes: 90,
      level: difficulty,
      category,
      learningObjectives: [
        `Understand core principles and regulatory frameworks of ${topic}`,
        `Execute hands-on workflows and standard operating procedures`,
        `Apply compliance checks and best practices in enterprise environments`
      ],
      modules: [
        {
          id: 'mod-1',
          title: 'Foundations & Architecture',
          lessons: [
            { title: `Introduction to ${topic}`, type: 'video', durationMinutes: 15, summary: 'Executive overview and high-level principles.' },
            { title: 'Core Terminology & Standards', type: 'article', durationMinutes: 20, summary: 'Key definitions and regulatory boundaries.' }
          ]
        },
        {
          id: 'mod-2',
          title: 'Practical Implementation & Lab',
          lessons: [
            { title: 'Hands-on Execution Lab', type: 'interactive_lab', durationMinutes: 30, summary: 'Step-by-step interactive simulated exercise.' },
            { title: 'Certification Knowledge Check', type: 'quiz', durationMinutes: 25, summary: 'Adaptive multiple-choice quiz assessment.' }
          ]
        }
      ],
      note: 'To enable live generative AI, configure GEMINI_API_KEY in server environment.'
    };

    return res.json({ success: true, source: 'curriculum-engine', data: generatedCourse });
  } catch (error: any) {
    console.error('Error generating course curriculum:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate curriculum' });
  }
});

// 8. Audit Logs API
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const { tenantId, limit = 50 } = req.query;
  let results = [...auditLogs];

  if (tenantId && typeof tenantId === 'string') {
    results = results.filter(l => l.tenantId === tenantId);
  }

  res.json({ success: true, count: results.length, data: results.slice(0, Number(limit)) });
});

// 9. SCORM & Compliance Export API
app.get('/api/export/scorm/:courseId', (req: Request, res: Response) => {
  const course = courses.find(c => c.id === req.params.courseId);
  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  const manifestXml = `<?xml version="1.0" standalone="no" ?>
<manifest identifier="com.omnilearn.lms.${course.id}" version="1.3"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org-1">
    <organization identifier="org-1">
      <title>${course.title}</title>
      <item identifier="item-1" identifierref="res-1">
        <title>${course.title} - Main Learning Object</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res-1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Disposition', `attachment; filename="imsmanifest-${course.id}.xml"`);
  res.send(manifestXml);
});

// ----------------------------------------------------
// Landing Page Builder & Public SEO Engine (SSR)
// ----------------------------------------------------
interface LandingPageRecord {
  id: string;
  lmsId: string;
  tenantId: string;
  lmsName: string;
  status: 'Published' | 'Draft';
  version: number;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  seo: {
    pageTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    ogImageUrl: string;
    canonicalUrl: string;
    schemaType: string;
    author: string;
    language: string;
  };
  navbar: any;
  sections: any[];
  footer: any;
}

let landingPagesStore: Record<string, LandingPageRecord> = {};

function getDefaultLandingPageRecord(lmsId: string): LandingPageRecord {
  const t = tenants.find(ten => ten.id === lmsId || ten.slug === lmsId) || tenants[0];
  const safeName = t ? t.name : 'Enterprise LMS Academy';
  const tagline = t?.branding?.tagline || 'Empowering global teams with accredited certifications, practical skills, and compliance pathways.';

  return {
    id: `landing-${lmsId}`,
    lmsId: lmsId,
    tenantId: t?.id || 'tenant-1',
    lmsName: safeName,
    status: 'Published',
    version: 1.0,
    lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    lastUpdatedBy: 'System Administrator',
    seo: {
      pageTitle: `${safeName} — Official Learning Portal & Academy`,
      metaDescription: `${safeName}: ${tagline} Explore accredited courses, live interactive classrooms, expert instructors, and verified digital credentials.`,
      metaKeywords: [safeName, 'Enterprise LMS', 'Online Learning', 'Accredited Certification', 'Workforce Training', 'Compliance'],
      ogImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&h=630&q=85',
      canonicalUrl: `https://academy.enterprise.io/p/${lmsId}`,
      schemaType: 'EducationalOrganization',
      author: safeName,
      language: 'en'
    },
    navbar: {
      siteTitle: safeName,
      logoOverride: t?.branding?.logoUrl || '',
      sticky: true,
      style: 'glass',
      links: [
        { id: 'nav-home', label: 'Home', type: 'scroll', target: '#hero' },
        { id: 'nav-courses', label: 'Courses', type: 'scroll', target: '#courses', badge: 'Popular' },
        { id: 'nav-video', label: 'Platform Tour', type: 'scroll', target: '#video' },
        { id: 'nav-instructors', label: 'Instructors', type: 'scroll', target: '#instructors' },
        { id: 'nav-news', label: 'Latest News', type: 'scroll', target: '#news' },
        { id: 'nav-about', label: 'About Us', type: 'scroll', target: '#about' },
        { id: 'nav-contact', label: 'Contact', type: 'scroll', target: '#contact' }
      ],
      ctaButton: {
        label: 'Sign In to Portal',
        action: 'login',
        target: '/login',
        variant: 'primary',
        enabled: true
      },
      showAnnouncementBar: true,
      announcementText: '🚀 Spring 2026 Course Catalogs and Certifications are now live! Enroll today to claim early bird credentials.',
      announcementLink: '#courses',
      announcementType: 'highlight'
    },
    sections: [
      {
        id: 'hero',
        type: 'hero_banner',
        title: 'Welcome Hero Banner',
        subtitle: 'Main introductory banner',
        badge: 'Premier Academy',
        enabled: true,
        order: 0,
        layout: 'split',
        background: { type: 'theme_gradient', overlayOpacity: 10 },
        padding: 'spacious',
        content: {
          headline: `Transform Your Potential with ${safeName}`,
          subheadline: tagline,
          badgeText: '🌟 2026 Accredited Enterprise Learning',
          badgeIcon: 'verified',
          primaryCtaText: 'Explore Certified Courses',
          primaryCtaAction: '#courses',
          secondaryCtaText: 'Watch Platform Tour',
          secondaryCtaAction: '#video',
          heroMedia: 'interactive_card',
          heroImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
          showSearchBox: true,
          searchPlaceholder: 'Search 250+ courses, skills, or certifications...',
          statChips: [
            { id: 's1', value: '45,000+', label: 'Active Learners', icon: 'groups' },
            { id: 's2', value: '98.6%', label: 'Completion Rate', icon: 'trending_up' },
            { id: 's3', value: '180+', label: 'Accredited Programs', icon: 'workspace_premium' }
          ]
        }
      },
      {
        id: 'highlights-slider',
        type: 'carousel_slider',
        title: 'Featured Initiatives',
        subtitle: 'Interactive highlight carousel showcasing core program pillars',
        badge: 'Featured',
        enabled: true,
        order: 1,
        layout: 'fullwidth',
        background: { type: 'neutral' },
        padding: 'standard',
        content: {
          autoPlayIntervalMs: 6000,
          showDots: true,
          showArrows: true,
          slides: [
            {
              id: 'slide-1',
              title: 'AI & Next-Gen Cloud Architecture Specialization',
              subtitle: 'Comprehensive deep dive into multi-agent systems, LLM fine-tuning, and enterprise security frameworks.',
              imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
              badge: 'Featured Specialization',
              ctaText: 'View Curriculum',
              ctaAction: '#courses',
              overlayStyle: 'dark'
            },
            {
              id: 'slide-2',
              title: 'Global Compliance & ISO 27001 Master Series',
              subtitle: 'Mandatory and elective compliance paths designed by top industry practitioners with automated certificates.',
              imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
              badge: 'Certification',
              ctaText: 'Explore Compliance',
              ctaAction: '#courses',
              overlayStyle: 'gradient'
            }
          ]
        }
      },
      {
        id: 'video',
        type: 'video_showcase',
        title: 'Experience Our Learning Ecosystem',
        subtitle: 'Watch how our immersive classroom player, interactive labs, and instant digital certificates accelerate career growth.',
        badge: 'Interactive Tour',
        enabled: true,
        order: 2,
        layout: 'centered',
        background: { type: 'theme_light' },
        padding: 'spacious',
        content: {
          videoTitle: 'Inside the Learner Portal & Classroom Player',
          badgeText: 'HD Video Walkthrough (3:45)',
          description: 'A 360-degree tour of our modular curriculum architecture, live virtual classrooms, real-time quizzes, and verifiable blockchain-grade certificates.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          posterUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
          durationText: '3 Min Video',
          bulletPoints: [
            'Bite-sized interactive microlearning lessons on any device',
            'Live instructor office hours and collaborative discussion boards',
            'Automated gradebook sync, transcripts, and verifiable badge credentials'
          ],
          statsList: [
            { label: 'Video Lessons', value: '1,200+' },
            { label: 'Avg Rating', value: '4.9 / 5.0' },
            { label: 'Mobile Ready', value: '100%' }
          ],
          autoPlay: false
        }
      },
      {
        id: 'courses',
        type: 'courses_grid',
        title: 'Featured Curriculum & Programs',
        subtitle: 'Explore our highest rated programs taught by leading industry practitioners with verifiable digital certificates upon completion.',
        badge: 'Top Programs',
        enabled: true,
        order: 3,
        layout: 'standard',
        background: { type: 'neutral' },
        padding: 'spacious',
        content: {
          sectionTagline: 'Curated by master instructional designers to guarantee job-ready competency.',
          filterCategories: ['All Categories', 'Compliance & Security', 'AI & Data', 'Healthcare', 'Engineering', 'Leadership'],
          displayCount: 6,
          columns: 3,
          showPrice: true,
          showRating: true,
          showEnrollButton: true,
          viewAllLink: '/courses'
        }
      },
      {
        id: 'instructors',
        type: 'instructors_directory',
        title: 'Learn from Recognized Global Experts',
        subtitle: 'Our instructors combine world-class research with decades of active executive and technical leadership.',
        badge: 'Distinguished Faculty',
        enabled: true,
        order: 4,
        layout: 'standard',
        background: { type: 'theme_light' },
        padding: 'spacious',
        content: {
          displayCount: 4,
          layout: 'cards',
          instructors: [
            {
              id: 'inst-1',
              name: 'Dr. Sarah Sterling',
              title: 'Chief Information Security Officer & Fellow',
              department: 'Cybersecurity & Governance',
              bio: 'Former Fortune 500 security director with 18+ years leading SOC-2, ISO 27001, and Zero-Trust architecture.',
              avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300&q=80',
              rating: 4.96,
              coursesCount: 8,
              studentsCount: '14,200',
              specialties: ['ISO 27001', 'Cloud Security', 'Threat Modeling']
            },
            {
              id: 'inst-2',
              name: 'Marcus Thorne',
              title: 'VP of AI Research & Lead Architect',
              department: 'Artificial Intelligence & Systems',
              bio: 'Author of enterprise LLM playbooks and pioneer in multi-agent orchestration and production RAG pipelines.',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80',
              rating: 4.98,
              coursesCount: 12,
              studentsCount: '19,800',
              specialties: ['Generative AI', 'Agentic Workflows', 'Python']
            }
          ]
        }
      },
      {
        id: 'testimonials',
        type: 'testimonials',
        title: 'Trusted by Thousands of Professionals',
        subtitle: 'Read real reviews and success stories from learners and enterprise teams who transformed their careers.',
        badge: 'Social Proof',
        enabled: true,
        order: 5,
        layout: 'standard',
        background: { type: 'neutral' },
        padding: 'spacious',
        content: {
          layout: 'grid',
          testimonials: [
            {
              id: 't-1',
              name: 'Alexandra Wright',
              role: 'Lead Cloud Architect',
              organization: 'Apex Global Enterprises',
              avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
              rating: 5,
              comment: 'The structured learning phases and instant certificate verification helped our entire engineering department attain SOC-2 compliance in half the standard timeframe.',
              verified: true,
              courseTaken: 'ISO 27001 & SOC-2 Cybersecurity Governance'
            }
          ]
        }
      },
      {
        id: 'partners',
        type: 'partners_ticker',
        title: 'Accreditation & Industry Partners',
        subtitle: 'Our programs align with recognized international frameworks and top technology alliances.',
        badge: 'Accreditation',
        enabled: true,
        order: 6,
        layout: 'standard',
        background: { type: 'theme_light' },
        padding: 'compact',
        content: {
          title: 'Accredited by Leading Industry Authorities',
          subtitle: 'Certified curriculum compliant with international quality and credentialing standards',
          grayscale: true,
          tickerSpeed: 'normal',
          partners: [
            { id: 'p1', name: 'ISO / IEC 27001', logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=180&h=60&q=80', category: 'Standards' },
            { id: 'p2', name: 'OpenBadges 2.0', logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=180&h=60&q=80', category: 'Credentials' },
            { id: 'p3', name: 'Google Cloud Partner', logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=180&h=60&q=80', category: 'Technology' }
          ]
        }
      },
      {
        id: 'news',
        type: 'latest_news',
        title: 'Latest News & Insights',
        subtitle: 'Stay updated with executive summaries, research papers, and platform announcements.',
        badge: 'Insights',
        enabled: true,
        order: 7,
        layout: 'standard',
        background: { type: 'neutral' },
        padding: 'spacious',
        content: {
          displayCount: 3,
          enableSubscribeNewsletter: true,
          items: [
            {
              id: 'news-1',
              title: '2026 Global Workforce Learning Trends Report Released',
              excerpt: 'Discover how AI-assisted skill cluster mapping and micro-credentials are revolutionizing enterprise talent mobility and retention.',
              category: 'Research Report',
              date: 'September 15, 2026',
              author: 'Dr. Sarah Sterling',
              authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80',
              imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
              readTime: '5 min read',
              tag: 'Industry'
            }
          ]
        }
      },
      {
        id: 'about',
        type: 'about_us',
        title: `About ${safeName}`,
        subtitle: 'Our story, mission, and dedication to accessible, high-impact enterprise education.',
        badge: 'Our Mission',
        enabled: true,
        order: 8,
        layout: 'split',
        background: { type: 'theme_light' },
        padding: 'spacious',
        content: {
          missionTitle: 'Bridging the Global Competency Gap with Next-Generation Learning Infrastructure',
          missionText: `${safeName} was established to eliminate fragmented learning silos and provide an institutional-grade portal for continuous upskilling.`,
          visionText: 'We envision a future where high-quality education is seamlessly accessible and verifiable.',
          pillars: [
            { icon: 'military_tech', title: 'Rigorous Academic Quality', description: 'Dual peer review by domain practitioners and instructional architects.' },
            { icon: 'security', title: 'Enterprise Governance', description: 'Multi-role access controls, SSO integration, and ISO 27001 compliant residency.' }
          ],
          achievementStats: [
            { value: '14+', label: 'Years of Excellence', icon: 'history_edu' },
            { value: '99.4%', label: 'Learner Satisfaction', icon: 'sentiment_very_satisfied' }
          ],
          image1Url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
        }
      },
      {
        id: 'contact',
        type: 'contact_form',
        title: 'Get in Touch with Our Academic Advisors',
        subtitle: 'Have questions about enterprise cohort enrollments, custom curriculum authoring, or LMS integration? We are here to help.',
        badge: 'Direct Connect',
        enabled: true,
        order: 9,
        layout: 'split',
        background: { type: 'neutral' },
        padding: 'spacious',
        content: {
          heading: 'We’d Love to Hear From You',
          description: 'Fill out the form and our advisory team will respond within 24 business hours.',
          email: 'admissions@enterprise-lms.net',
          phone: '+1 (800) 555-0199',
          address: '75 Mohakhali, Dhaka 1212 / Global Innovation Hub',
          workingHours: 'Monday – Friday: 08:00 AM – 07:00 PM (UTC)',
          subjectOptions: [
            'General Inquiries & Admissions',
            'Enterprise Team License & Multi-Tenant Setup',
            'Custom Course Authoring & SCORM Import'
          ],
          enableMapOrGraphic: true,
          successMessage: 'Thank you for reaching out! Your inquiry has been dispatched to our advisory team.'
        }
      },
      {
        id: 'faq',
        type: 'faq_accordion',
        title: 'Frequently Asked Questions',
        subtitle: 'Everything you need to know about accessing courses and earning certificates.',
        badge: 'Knowledge Base',
        enabled: true,
        order: 10,
        layout: 'centered',
        background: { type: 'theme_light' },
        padding: 'spacious',
        content: {
          faqs: [
            {
              id: 'faq-1',
              question: 'How do I access my enrolled courses and classroom materials?',
              answer: 'Once you sign in to the portal via SSO or email credentials, all active courses are immediately accessible in your Learner Dashboard.'
            },
            {
              id: 'faq-2',
              question: 'Are the digital certificates verifiable?',
              answer: 'Yes. Every issued certificate includes a unique cryptographic verification hash and OpenBadges 2.0 metadata.'
            }
          ]
        }
      },
      {
        id: 'cta-footer',
        type: 'cta_banner',
        title: 'Ready to Accelerate Your Career?',
        subtitle: 'Join over 45,000 active learners and start earning recognized credentials today.',
        badge: 'Start Today',
        enabled: true,
        order: 11,
        layout: 'centered',
        background: { type: 'theme_gradient' },
        padding: 'spacious',
        content: {
          title: 'Start Learning Today and Unlock Certified Excellence',
          subtitle: 'Create your account or log in via your organization SSO to access comprehensive course modules.',
          ctaText: 'Access Learner Portal',
          ctaAction: '/login',
          badgeText: 'Instant Digital Access',
          backgroundStyle: 'gradient'
        }
      }
    ],
    footer: {
      brandSummary: `${safeName} provides scalable, accredited enterprise learning pathways and verifiable digital credentials.`,
      copyrightText: `© ${new Date().getFullYear()} ${safeName}. All Rights Reserved.`,
      showSocialLinks: true,
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
        { platform: 'youtube', url: 'https://youtube.com' }
      ],
      columns: [
        {
          title: 'Curriculum & Programs',
          links: [
            { label: 'All Courses', url: '#courses' },
            { label: 'Cybersecurity & SOC-2', url: '#courses' },
            { label: 'Generative AI Architecture', url: '#courses' }
          ]
        },
        {
          title: 'Platform Navigation',
          links: [
            { label: 'Interactive Tour', url: '#video' },
            { label: 'Distinguished Faculty', url: '#instructors' },
            { label: 'About Our Mission', url: '#about' }
          ]
        },
        {
          title: 'Support & Resources',
          links: [
            { label: 'Frequently Asked Questions', url: '#faq' },
            { label: 'Contact Academic Advisors', url: '#contact' },
            { label: 'Sign In to Portal', url: '/login' }
          ]
        }
      ],
      showNewsletter: true,
      newsletterHeadline: 'Subscribe to Executive Briefings',
      newsletterSubtext: 'Receive monthly curriculum updates and compliance alerts.',
      showLegalLinks: true,
      privacyUrl: '/privacy',
      termsUrl: '/terms'
    }
  };
}

// Pre-seed default landing pages
['default', 'tenant-1', 'tenant-2', 'tenant-3', 'tenant-brac', 'LMS-7419', 'LMS-9201'].forEach(id => {
  landingPagesStore[id] = getDefaultLandingPageRecord(id);
});

// Landing Pages REST Endpoints
app.get('/api/landing-pages', (req: Request, res: Response) => {
  res.json({ success: true, data: Object.values(landingPagesStore) });
});

app.get('/api/landing-pages/:lmsId', (req: Request, res: Response) => {
  const lmsId = req.params.lmsId || 'default';
  let page = landingPagesStore[lmsId];
  if (!page) {
    page = getDefaultLandingPageRecord(lmsId);
    landingPagesStore[lmsId] = page;
  }
  res.json({ success: true, data: page });
});

app.put('/api/landing-pages/:lmsId', (req: Request, res: Response) => {
  const lmsId = req.params.lmsId || 'default';
  const updates = req.body || {};
  let current = landingPagesStore[lmsId] || getDefaultLandingPageRecord(lmsId);

  const updated: LandingPageRecord = {
    ...current,
    ...updates,
    lmsId: lmsId,
    version: (current.version || 1) + 0.1,
    lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    lastUpdatedBy: updates.lastUpdatedBy || 'System Administrator'
  };

  landingPagesStore[lmsId] = updated;
  res.json({ success: true, message: 'Landing page configuration updated successfully', data: updated });
});

app.post('/api/landing-pages/:lmsId/publish', (req: Request, res: Response) => {
  const lmsId = req.params.lmsId || 'default';
  let current = landingPagesStore[lmsId] || getDefaultLandingPageRecord(lmsId);
  current.status = 'Published';
  current.version = Math.floor((current.version || 1) + 1);
  current.lastUpdatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  landingPagesStore[lmsId] = current;
  res.json({ success: true, message: `Landing page for ${current.lmsName} published live (v${current.version})!`, data: current });
});

app.post('/api/landing-pages/:lmsId/reset', (req: Request, res: Response) => {
  const lmsId = req.params.lmsId || 'default';
  const fresh = getDefaultLandingPageRecord(lmsId);
  landingPagesStore[lmsId] = fresh;
  res.json({ success: true, message: 'Landing page reset to LMS theme defaults', data: fresh });
});

app.post('/api/landing-pages/:lmsId/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body || {};
  console.log(`[Contact Form Submission] [${req.params.lmsId}] From: ${name} <${email}> - ${subject}`);
  res.json({
    success: true,
    message: 'Your inquiry has been received! An academic advisor will reach out to you within 24 hours.'
  });
});

app.post('/api/landing-pages/:lmsId/newsletter', (req: Request, res: Response) => {
  const { email } = req.body || {};
  console.log(`[Newsletter Subscription] [${req.params.lmsId}] Email: ${email}`);
  res.json({
    success: true,
    message: 'Thank you for subscribing to our executive briefings!'
  });
});

// ----------------------------------------------------
// Interceptor & Notification Test Suite Endpoints
// ----------------------------------------------------
let retryTracker503 = 0;

app.get('/api/test/error/:statusCode', (req: Request, res: Response) => {
  const code = parseInt(req.params.statusCode, 10);
  switch (code) {
    case 401:
      return res.status(401).json({ message: 'Session expired, please login again' });
    case 400:
      return res.status(400).json({ message: 'Invalid Request: Required parameters are missing' });
    case 500:
      return res.status(500).json({ message: 'Internal Server Error: Database connection pool failure' });
    case 503:
      retryTracker503++;
      if (retryTracker503 % 4 === 0) {
        return res.json({ success: true, message: 'Recovered after retry attempts!', attempts: retryTracker503 });
      }
      return res.status(503).json({ message: `Service Unavailable: Server busy (Retry attempt #${retryTracker503})` });
    case 200:
      return res.json({ success: true, message: 'Endpoint executed successfully (200 OK)' });
    default:
      return res.status(code || 418).json({ message: `HTTP Error ${code || 418}` });
  }
});

app.get('/api/test/blob-error', (req: Request, res: Response) => {
  res.status(400);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(Buffer.from(JSON.stringify({ message: 'Binary stream validation failed (Parsed from Blob)' })));
});

app.get('/api/test/delay', async (req: Request, res: Response) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  res.json({ success: true, message: 'Delayed response completed after 1.5s', timestamp: new Date().toISOString() });
});


// ----------------------------------------------------
// Production Static Files Serving & SPA Fallback
// ----------------------------------------------------
// Static assets middleware
app.use('/assets', express.static(join(__dirname, 'assets')));
app.use('/assets', express.static(join(__dirname, 'public', 'assets')));
app.use('/assets', express.static(join(__dirname, 'src', 'assets')));
app.use(express.static(join(__dirname, 'public')));

const distDirs = [
  join(__dirname, 'dist', 'browser'),
  join(__dirname, 'dist'),
  join(__dirname, 'dist', 'app'),
  join(__dirname, 'dist', 'ai-chatbot-admin-console'),
  join(__dirname, 'build')
];

for (const dir of distDirs) {
  if (existsSync(dir)) {
    app.use(express.static(dir));
  }
}

// SPA Catch-all Fallback with Server-Side SEO Injection (Express 5 compatible)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();

  let targetIndexPath = '';
  for (const dir of distDirs) {
    const p = join(dir, 'index.html');
    if (existsSync(p)) {
      targetIndexPath = p;
      break;
    }
  }

  if (!targetIndexPath && existsSync(join(__dirname, 'index.html'))) {
    targetIndexPath = join(__dirname, 'index.html');
  }

  if (targetIndexPath) {
    // Check if this is a public landing page route (/landing, /landing/:lmsId, /p/:lmsId)
    const isLandingRoute = req.path.startsWith('/landing') || req.path.startsWith('/p/');
    if (isLandingRoute) {
      try {
        let lmsId = 'default';
        const parts = req.path.split('/').filter(Boolean);
        if (parts.length > 1) {
          lmsId = parts[1];
        }
        const page = landingPagesStore[lmsId] || getDefaultLandingPageRecord(lmsId);

        let html = readFileSync(targetIndexPath, 'utf-8');
        const seoTitle = page.seo?.pageTitle || `${page.lmsName} — Official Learning Portal & Academy`;
        const seoDesc = page.seo?.metaDescription || `${page.lmsName} Enterprise Learning Academy`;
        const seoKeywords = page.seo?.metaKeywords?.join(', ') || `${page.lmsName}, LMS, Courses, Training`;
        const ogImage = page.seo?.ogImageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200';
        const canonical = page.seo?.canonicalUrl || `https://${req.get('host')}${req.originalUrl}`;

        // Structured Data Schema.org
        const jsonLd = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': page.seo?.schemaType || 'EducationalOrganization',
          'name': page.lmsName,
          'description': seoDesc,
          'url': canonical,
          'logo': page.navbar?.logoOverride || '',
          'sameAs': page.footer?.socialLinks?.map((s: any) => s.url) || [],
          'offers': {
            '@type': 'AggregateOffer',
            'category': 'Online Education & Certifications',
            'priceCurrency': 'USD'
          }
        });

        // Replace or inject title and meta tags
        html = html.replace(/<title>.*?<\/title>/i, `<title>${seoTitle}</title>`);
        
        const injectedHeadTags = `
    <!-- Dynamic Server-Side SEO & OpenGraph Injection -->
    <meta name="description" content="${seoDesc}">
    <meta name="keywords" content="${seoKeywords}">
    <meta name="author" content="${page.lmsName}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${seoTitle}">
    <meta property="og:description" content="${seoDesc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${page.lmsName}">
    <meta property="og:url" content="${canonical}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${seoTitle}">
    <meta name="twitter:description" content="${seoDesc}">
    <meta name="twitter:image" content="${ogImage}">
    <script type="application/ld+json" id="server-seo-jsonld">
    ${jsonLd}
    </script>
`;
        html = html.replace('</head>', `${injectedHeadTags}\n</head>`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      } catch (err) {
        console.error('Error injecting landing SEO tags:', err);
      }
    }

    return res.sendFile(targetIndexPath);
  }

  next();
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Multi-Tenant LMS Express Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health endpoint available at http://localhost:${PORT}/api/health`);
});

export default app;
