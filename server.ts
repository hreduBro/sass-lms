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
  __dirname
];

let staticServed = false;
for (const dir of distDirs) {
  if (existsSync(join(dir, 'index.html')) && dir !== __dirname) {
    app.use(express.static(dir));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(join(dir, 'index.html'));
    });
    staticServed = true;
    break;
  }
}

if (!staticServed) {
  // If static directory not yet built, serve index.html from root if present
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    if (existsSync(join(__dirname, 'index.html'))) {
      return res.sendFile(join(__dirname, 'index.html'));
    }
    next();
  });
}

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
