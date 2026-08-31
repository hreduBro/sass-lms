import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Tenant,
  TenantBranding,
  User,
  Course,
  CourseEnrollment,
  Certificate,
  LiveWebinar,
  AuditLog,
  UserRole,
  DepartmentMetric,
  AdminLayoutPreferences,
  NavigationLayoutMode,
  DashboardWidget,
  DashboardWidgetType,
  CustomTenantDashboard,
  ToastAlert,
  ToastType
} from '../models/lms.model';
import {
  OrganizationDraft,
  OrganizationBasicInfo,
  OrganizationResourceAllocation,
  PlatformCapacity
} from '../models/organization.model';
import {
  LmsInstance,
  LmsDraft,
  LmsStatus,
  LmsType,
  LmsBasicInfo,
  LmsResourceAllocation,
  LmsAdminInfo,
  OrganizationCapacitySnapshot
} from '../models/lms-instance.model';
import {
  OrgDashboardWidget,
  OrgDashboardWidgetType,
  OrgDashboardLayout,
  DEFAULT_ORG_DASHBOARD_LAYOUT,
  DEFAULT_ORG_DASHBOARD_WIDGETS,
  ORG_DASHBOARD_PRESETS,
  ORG_WIDGET_CATALOG
} from '../models/organization-dashboard.model';
import {
  LmsDashboardWidget,
  LmsDashboardWidgetType,
  LmsDashboardLayout,
  DEFAULT_LMS_DASHBOARD_LAYOUT,
  DEFAULT_LMS_DASHBOARD_WIDGETS,
  LMS_DASHBOARD_PRESETS,
  LMS_WIDGET_CATALOG
} from '../models/lms-dashboard.model';
import {
  Plan,
  Phase,
  PlanOwner,
  PlanStatus,
  DurationType,
  EnrollmentType,
  INITIAL_PLANS,
  validatePlanAndPhases,
  formatDateDDMMYYYY
} from '../models/plan.model';
import {
  CourseTemplate,
  CourseTemplateModule,
  CourseTemplateSlot,
  CourseTemplateStructure,
  CourseTemplateStatus,
  CourseTemplateScope,
  CourseSlotType,
  CourseTemplatePermissions,
  CourseTemplateSummaryStats,
  CourseTemplateVisibility,
  INITIAL_COURSE_TEMPLATES,
  DEFAULT_REQUIRED_COMPONENTS,
  deepCopyTemplateStructure
} from '../models/course-template.model';
import {
  CertificateTemplate,
  CertificateTemplateStatus,
  CertificateSharingLevel,
  CertificateTemplatePermissions,
  CertificateDashboardLayout,
  CertificateDashboardWidget,
  CertificateActivityEvent,
  INITIAL_CERTIFICATE_TEMPLATES,
  DEFAULT_CERTIFICATE_DASHBOARD_LAYOUT,
  INITIAL_CERTIFICATE_ACTIVITIES,
  CANVAS_SIZE_MAP
} from '../models/certificate-template.model';

const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-brac',
    numericId: '1972',
    name: 'BRAC',
    slug: 'brac',
    domain: 'learn.brac.net',
    websiteUrl: 'https://www.brac.net',
    plan: 'Enterprise',
    status: 'Active',
    timezone: 'Asia/Dhaka',
    description: 'World-leading development organisation empowering millions across social enterprises, microfinance, health, climate resilience, and education.',
    address: {
      line1: 'BRAC Centre, 75 Mohakhali',
      line2: 'Level 18, Learning & People Division',
      division: 'Dhaka',
      district: 'Dhaka',
      postalCode: '1212'
    },
    adminInfo: {
      adminName: 'Farhana Ahmed',
      contactNumber: '01713000000',
      contactEmail: 'learning.admin@brac.net'
    },
    resourceAllocation: {
      databaseSizeGb: 800,
      fileStorageGb: 2000,
      usageAlertThresholdPct: 85,
      dataSharingMode: 'Yes – Shared'
    },
    adminEmail: 'learning.admin@brac.net',
    createdAt: '2023-01-01',
    renewalDate: '2028-01-01',
    branding: {
      primaryColor: '#EC008C', // 100% Pantone Magenta (BRAC Standard)
      accentColor: '#C40072',  // Deep Magenta Complement
      tagline: 'Creating Opportunities For People To Realise Potential',
      bannerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
      customCssEnabled: true,
      themePreset: 'solid',
      ssoProvider: 'Google Workspace'
    },
    departments: ['Microfinance & Financial Inclusion', 'Education & Youth Skills (BEP)', 'Health, Nutrition & Population', 'Climate Change & Disaster Management', 'Ultra-Poor Graduation', 'Gender, Justice & Diversity', 'Human Resources & Leadership'],
    stats: {
      seatLimit: 20000,
      seatsUsed: 14850,
      totalCourses: 56,
      totalLearners: 14850,
      completionRate: 94.8,
      complianceRate: 98.7,
      storageUsedGb: 680.5,
      storageLimitGb: 2000
    },
    features: {
      scormSupport: true,
      aiTutor: true,
      liveWebinars: true,
      customCertificates: true,
      whiteLabel: true,
      customDomain: true
    }
  },
  {
    id: 'tenant-lumina',
    numericId: '5528',
    name: 'Lumina Spatial Labs',
    slug: 'lumina-glass',
    domain: 'academy.lumina-glass.io',
    websiteUrl: 'https://lumina-glass.io',
    plan: 'Enterprise',
    status: 'Active',
    timezone: 'Asia/Dhaka',
    description: 'Spatial computing, neural intelligence, and next-gen glassmorphic human-computer interaction laboratory.',
    address: {
      line1: 'Quantum Tower, Level 24, Silicon Enclave',
      line2: 'Spatial UI & Neural Dynamics Division',
      division: 'Dhaka',
      district: 'Dhaka',
      postalCode: '1229'
    },
    adminInfo: {
      adminName: 'Aria Vance',
      contactNumber: '01799887766',
      contactEmail: 'aria.admin@lumina-glass.io'
    },
    resourceAllocation: {
      databaseSizeGb: 500,
      fileStorageGb: 1500,
      usageAlertThresholdPct: 80,
      dataSharingMode: 'Yes – Shared'
    },
    adminEmail: 'aria.admin@lumina-glass.io',
    createdAt: '2024-02-01',
    renewalDate: '2028-02-01',
    branding: {
      primaryColor: '#06b6d4', // Vibrant Cyan Neon
      accentColor: '#8b5cf6',  // Electric Violet
      tagline: 'Next-Gen Glassmorphic Spatial Learning & AI Simulation Canvas',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      themePreset: 'glassmorphism',
      ssoProvider: 'Okta'
    },
    departments: ['Spatial UI & Generative Vision', 'Neural LLM Architecture', 'Quantum AI Systems', 'Robotics Simulation', 'Cybernetic Security'],
    stats: {
      seatLimit: 10000,
      seatsUsed: 7850,
      totalCourses: 34,
      totalLearners: 7850,
      completionRate: 92.4,
      complianceRate: 97.6,
      storageUsedGb: 340.2,
      storageLimitGb: 1500
    },
    features: {
      scormSupport: true,
      aiTutor: true,
      liveWebinars: true,
      customCertificates: true,
      whiteLabel: true,
      customDomain: true
    }
  },
  {
    id: 'tenant-acme',
    numericId: '4821',
    name: 'Acme Global Enterprise',
    slug: 'acme-corp',
    domain: 'academy.acme.com',
    websiteUrl: 'https://academy.acme.com',
    plan: 'Enterprise',
    status: 'Active',
    timezone: 'Asia/Dhaka',
    description: 'Global enterprise learning workspace covering engineering, cloud compliance, and leadership training.',
    address: {
      line1: 'Plot 14, Road 7, Block C, Banani Commercial Area',
      line2: 'Suite 1204, Tower Alpha',
      division: 'Dhaka',
      district: 'Dhaka',
      postalCode: '1213'
    },
    adminInfo: {
      adminName: 'Clara Oswald',
      contactNumber: '01712345678',
      contactEmail: 'clara.admin@acme.com'
    },
    resourceAllocation: {
      databaseSizeGb: 250,
      fileStorageGb: 500,
      usageAlertThresholdPct: 80,
      dataSharingMode: 'Yes – Shared'
    },
    adminEmail: 'clara.admin@acme.com',
    createdAt: '2024-01-15',
    renewalDate: '2027-01-15',
    branding: {
      primaryColor: '#4f46e5', // Indigo
      accentColor: '#06b6d4',  // Cyan
      tagline: 'Empowering Next-Generation Workforce Skills',
      bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      ssoProvider: 'Okta'
    },
    departments: ['Engineering', 'Cloud & Security', 'Sales & Growth', 'Product Management', 'People & HR'],
    stats: {
      seatLimit: 1200,
      seatsUsed: 945,
      totalCourses: 18,
      totalLearners: 945,
      completionRate: 84.6,
      complianceRate: 96.2,
      storageUsedGb: 142.5,
      storageLimitGb: 500
    },
    features: {
      scormSupport: true,
      aiTutor: true,
      liveWebinars: true,
      customCertificates: true,
      whiteLabel: true,
      customDomain: true
    }
  },
  {
    id: 'tenant-stanford',
    numericId: '7384',
    name: 'Stanford Tech Institute',
    slug: 'stanford-tech',
    domain: 'learn.stanfordtech.edu',
    websiteUrl: 'https://learn.stanfordtech.edu',
    plan: 'Enterprise',
    status: 'Active',
    timezone: 'America/Los_Angeles',
    description: 'Pioneering research institute offering cutting-edge robotics and computer science curriculum.',
    address: {
      line1: '450 Serra Mall, Computing Quad',
      line2: 'Gates Building Room 302',
      division: 'Chattogram',
      district: 'Chattogram',
      postalCode: '4000'
    },
    adminInfo: {
      adminName: 'Marcus Vance',
      contactNumber: '01812345678',
      contactEmail: 'provost@stanfordtech.edu'
    },
    resourceAllocation: {
      databaseSizeGb: 400,
      fileStorageGb: 1000,
      usageAlertThresholdPct: 85,
      dataSharingMode: 'No – Segregated'
    },
    adminEmail: 'provost@stanfordtech.edu',
    createdAt: '2023-08-01',
    renewalDate: '2027-08-01',
    branding: {
      primaryColor: '#b91c1c', // Deep Crimson
      accentColor: '#d97706',  // Amber
      tagline: 'Pioneering Excellence in Research & Computing',
      bannerUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      ssoProvider: 'SAML 2.0'
    },
    departments: ['Computer Science', 'AI Research Lab', 'Robotics & Hardware', 'Bioinformatics', 'Data Analytics'],
    stats: {
      seatLimit: 5000,
      seatsUsed: 4280,
      totalCourses: 42,
      totalLearners: 4280,
      completionRate: 91.4,
      complianceRate: 98.8,
      storageUsedGb: 412.0,
      storageLimitGb: 1000
    },
    features: {
      scormSupport: true,
      aiTutor: true,
      liveWebinars: true,
      customCertificates: true,
      whiteLabel: true,
      customDomain: true
    }
  },
  {
    id: 'tenant-apexhealth',
    numericId: '8512',
    name: 'Apex Health System',
    slug: 'apex-health',
    domain: 'training.apexhealth.org',
    websiteUrl: 'https://training.apexhealth.org',
    plan: 'Enterprise',
    status: 'Active',
    timezone: 'Asia/Dhaka',
    description: 'Hospital network training portal managing clinical mandatory certifications and patient privacy.',
    address: {
      line1: 'Medical College Road, Sector 4',
      line2: 'Clinical Education Center',
      division: 'Rajshahi',
      district: 'Rajshahi',
      postalCode: '6000'
    },
    adminInfo: {
      adminName: 'Dr. Sarah Jenkins',
      contactNumber: '01912345678',
      contactEmail: 'chief.medical.officer@apexhealth.org'
    },
    resourceAllocation: {
      databaseSizeGb: 300,
      fileStorageGb: 750,
      usageAlertThresholdPct: 90,
      dataSharingMode: 'Custom',
      customBatches: [
        { id: 'b1', name: 'Clinical & ICU Batch', lmsInstanceIds: ['LMS-ICU-1', 'LMS-CLINIC-2'] }
      ]
    },
    adminEmail: 'chief.medical.officer@apexhealth.org',
    createdAt: '2024-03-10',
    renewalDate: '2027-03-10',
    branding: {
      primaryColor: '#059669', // Emerald
      accentColor: '#0284c7',  // Sky Blue
      tagline: 'Clinical Clinical Training, HIPAA & Patient Safety Hub',
      bannerUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      ssoProvider: 'Azure AD'
    },
    departments: ['Emergency Medicine', 'Surgical Staff', 'Nursing & ICU', 'Pharmacy', 'Clinical Compliance'],
    stats: {
      seatLimit: 2500,
      seatsUsed: 2120,
      totalCourses: 26,
      totalLearners: 2120,
      completionRate: 88.9,
      complianceRate: 99.4,
      storageUsedGb: 285.4,
      storageLimitGb: 750
    },
    features: {
      scormSupport: true,
      aiTutor: true,
      liveWebinars: true,
      customCertificates: true,
      whiteLabel: true,
      customDomain: true
    }
  },
  {
    id: 'tenant-finedge',
    numericId: '6241',
    name: 'FinEdge Compliance Academy',
    slug: 'finedge-bank',
    domain: 'learn.finedgecapital.com',
    websiteUrl: 'https://learn.finedgecapital.com',
    plan: 'Pro',
    status: 'Active',
    timezone: 'Europe/London',
    description: 'Financial compliance and AML governance certification platform.',
    address: {
      line1: 'Commercial Area, Agrabad',
      line2: 'Finance Tower Level 8',
      division: 'Chattogram',
      district: 'Chattogram',
      postalCode: '4100'
    },
    adminInfo: {
      adminName: 'Victoria Sterling',
      contactNumber: '01612345678',
      contactEmail: 'compliance.head@finedgecapital.com'
    },
    resourceAllocation: {
      databaseSizeGb: 150,
      fileStorageGb: 250,
      usageAlertThresholdPct: 75,
      dataSharingMode: 'No – Segregated'
    },
    adminEmail: 'compliance.head@finedgecapital.com',
    createdAt: '2024-06-01',
    renewalDate: '2026-06-01',
    branding: {
      primaryColor: '#2563eb', // Royal Blue
      accentColor: '#ca8a04',  // Gold
      tagline: 'Global Regulatory, AML & Financial Risk Certification',
      bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: false,
      ssoProvider: 'Azure AD'
    },
    departments: ['Investment Banking', 'AML Compliance', 'Risk Management', 'Wealth Advisors', 'Retail Banking'],
    stats: {
      seatLimit: 600,
      seatsUsed: 490,
      totalCourses: 14,
      totalLearners: 490,
      completionRate: 79.2,
      complianceRate: 94.0,
      storageUsedGb: 88.0,
      storageLimitGb: 250
    },
    features: {
      scormSupport: true,
      aiTutor: false,
      liveWebinars: true,
      customCertificates: true,
      whiteLabel: false,
      customDomain: true
    }
  },
  {
    id: 'tenant-innovate',
    numericId: '9035',
    name: 'Innovate AI Labs',
    slug: 'innovate-ai',
    domain: 'academy.innovate-ai.io',
    websiteUrl: 'https://academy.innovate-ai.io',
    plan: 'Pro',
    status: 'In-Progress',
    timezone: 'Asia/Dhaka',
    description: 'Next-gen generative AI research, prompting frameworks, and automated agents.',
    address: {
      line1: 'KDA Avenue, Sonadanga',
      line2: 'Tech Innovation Hub',
      division: 'Khulna',
      district: 'Khulna',
      postalCode: '9100'
    },
    adminInfo: {
      adminName: 'Rahim Chowdhury',
      contactNumber: '01512345678',
      contactEmail: 'founder@innovate-ai.io'
    },
    resourceAllocation: {
      databaseSizeGb: 100,
      fileStorageGb: 200,
      usageAlertThresholdPct: 80,
      dataSharingMode: 'Yes – Shared'
    },
    adminEmail: 'founder@innovate-ai.io',
    createdAt: '2024-11-20',
    renewalDate: '2026-11-20',
    branding: {
      primaryColor: '#7c3aed', // Purple
      accentColor: '#db2777',  // Pink
      tagline: 'Advanced Neural Architectures & GenAI Systems',
      bannerUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      ssoProvider: 'Google Workspace'
    },
    departments: ['Deep Learning', 'Prompt Engineering', 'MLOps Infrastructure', 'Autonomous Agents'],
    stats: {
      seatLimit: 250,
      seatsUsed: 185,
      totalCourses: 9,
      totalLearners: 185,
      completionRate: 86.5,
      complianceRate: 91.2,
      storageUsedGb: 64.2,
      storageLimitGb: 200
    },
    features: {
      scormSupport: false,
      aiTutor: true,
      liveWebinars: true,
      customCertificates: true,
      whiteLabel: false,
      customDomain: true
    }
  }
];

const INITIAL_COURSES: Course[] = [
  {
    id: 'course-brac-101',
    tenantId: 'tenant-brac',
    title: 'BRAC Microfinance Operations & Client Protection Principles (2026)',
    subtitle: 'Mandatory operational compliance, responsible lending, grievance redressal & field ethics',
    description: 'Master BRAC’s gold-standard microfinance methodologies: group lending discipline, transparent pricing, client financial capability development, safeguarding against over-indebtedness, and digitized collection workflows.',
    coverImage: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80',
    category: 'Microfinance & Compliance',
    level: 'Intermediate',
    durationMinutes: 120,
    isMandatory: true,
    complianceDeadlineDays: 14,
    instructorName: 'Tanvir Hossain',
    instructorTitle: 'Head of Microfinance Capacity Building, BRAC',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 4.96,
    reviewCount: 1480,
    enrolledCount: 12450,
    certificateEnabled: true,
    status: 'Published',
    tags: ['BRAC Microfinance', 'Client Protection', 'Compliance', 'Smart Campaign'],
    createdAt: '2025-01-05',
    targetDepartments: ['Microfinance & Financial Inclusion', 'Education & Youth Skills (BEP)', 'Health, Nutrition & Population', 'Climate Change & Disaster Management', 'Ultra-Poor Graduation', 'Gender, Justice & Diversity', 'Human Resources & Leadership'],
    modules: [
      {
        id: 'brac-mod-1',
        title: 'Core Principles of Responsible Financial Inclusion',
        durationMinutes: 45,
        lessons: [
          {
            id: 'brac-les-1-1',
            title: '1.1 The BRAC Village Organization (VO) Ecosystem',
            type: 'video',
            durationMinutes: 18,
            summary: 'Understanding the grassroots structure of Village Organizations, social cohesion, and member-centric micro-enterprise financing.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            resources: [
              { title: 'BRAC_Microfinance_Field_Manual_2026.pdf', size: '3.8 MB', url: '#', type: 'PDF' },
              { title: 'Client_Protection_Checklist.pdf', size: '1.2 MB', url: '#', type: 'PDF' }
            ]
          },
          {
            id: 'brac-les-1-2',
            title: '1.2 Preventing Over-Indebtedness & Ethical Recovery Protocols',
            type: 'article',
            durationMinutes: 27,
            summary: 'Strict code of conduct prohibiting coercive collection, safeguarding client dignity, and leveraging credit bureau assessments.',
            contentHtml: `
              <h3 class="text-xl font-bold mb-3 text-tenant-700 dark:text-tenant-200">The 7 Universal Client Protection Standards</h3>
              <p class="mb-4 text-text-secondary leading-relaxed">BRAC is globally endorsed for client protection. Every field officer and branch manager is bound by strict ethical covenants preventing aggressive recovery, ensuring full pricing transparency, and maintaining confidential client records.</p>
              
              <div class="p-4 rounded-xl bg-tenant-50 dark:bg-tenant-200/10 border border-tenant-200 dark:border-tenant-200/20 mb-4">
                <h4 class="font-semibold text-tenant-600 dark:text-tenant-200 mb-1 flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">verified_user</span> Standard of Conduct
                </h4>
                <p class="text-sm text-text-secondary">Field workers must never accept gifts, must record all collections digitally at the Village Organization meeting in the client's presence, and provide immediate SMS receipts.</p>
              </div>
            `,
            resources: [
              { title: 'Ethical_Field_Practices.pdf', size: '890 KB', url: '#', type: 'PDF' }
            ]
          }
        ]
      },
      {
        id: 'brac-mod-2',
        title: 'Compliance Assessment & Certification Quiz',
        durationMinutes: 75,
        lessons: [
          {
            id: 'brac-les-2-1',
            title: '2.1 Microfinance Client Protection & Ethics Exam',
            type: 'quiz',
            durationMinutes: 25,
            summary: 'Mandatory 4-question assessment. Score at least 80% to earn the certified BRAC Client Protection credential.',
            passingScorePercent: 80,
            quizQuestions: [
              {
                id: 'bq1',
                question: 'What is the primary objective of BRAC’s Village Organization (VO) model?',
                options: [
                  'Maximizing short-term institutional revenue',
                  'Fostering peer solidarity, financial capability, and social empowerment',
                  'Replacing commercial bank lending entirely',
                  'Eliminating all local government health interventions'
                ],
                correctAnswerIndex: 1,
                explanation: 'VO meetings serve as community empowerment hubs uniting financial services with social awareness and collective problem-solving.',
                points: 25
              },
              {
                id: 'bq2',
                question: 'Under BRAC Client Protection standards, what action is strictly prohibited during collection?',
                options: [
                  'Issuing an electronic receipt via mobile POS',
                  'Any form of coercive, abusive, or intimidating recovery practices',
                  'Providing financial literacy counseling',
                  'Verifying national identity numbers'
                ],
                correctAnswerIndex: 1,
                explanation: 'Coercive collection or harassment violates BRAC fundamental ethos and leads to immediate termination and disciplinary action.',
                points: 25
              },
              {
                id: 'bq3',
                question: 'How does BRAC safeguard microfinance clients from debt distress?',
                options: [
                  'By lending without repayment schedules',
                  'Conducting thorough repayment capacity analysis and household cash-flow auditing',
                  'Charging hidden processing surcharges',
                  'Requiring physical gold collateral'
                ],
                correctAnswerIndex: 1,
                explanation: 'Strict debt-to-income and cash-flow evaluations prevent over-indebtedness across all household members.',
                points: 25
              },
              {
                id: 'bq4',
                question: 'What is the standard response if a client reports an operational grievance at the branch?',
                options: [
                  'Dismiss the inquiry if loan repayment is on time',
                  'Log into the official Grievance Redressal Mechanism (GRM) ticket system within 24 hours',
                  'Instruct the client to contact external media',
                  'Confiscate the passbook indefinitely'
                ],
                correctAnswerIndex: 1,
                explanation: 'All feedback is tracked in BRAC’s central GRM system with a 72-hour mandatory resolution window.',
                points: 25
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-brac-102',
    tenantId: 'tenant-brac',
    title: 'Ultra-Poor Graduation (UPG) & Sustainable Livelihoods Masterclass',
    subtitle: 'Proven holistic intervention to graduate extreme-poor households into self-reliance',
    description: 'Study the globally acclaimed BRAC Graduation Approach—combining productive asset transfers, consumption support, financial inclusion, intensive coaching, and healthcare access.',
    coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    category: 'Ultra-Poor Graduation',
    level: 'Advanced',
    durationMinutes: 150,
    isMandatory: false,
    complianceDeadlineDays: 30,
    instructorName: 'Dr. Imran Matin',
    instructorTitle: 'Executive Director, BRAC Institute of Governance and Development (BIGD)',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: 4.98,
    reviewCount: 890,
    enrolledCount: 6300,
    certificateEnabled: true,
    status: 'Published',
    tags: ['UPG', 'Graduation Approach', 'Poverty Alleviation', 'Global Evidence'],
    createdAt: '2025-01-12',
    targetDepartments: ['Ultra-Poor Graduation', 'Microfinance & Financial Inclusion', 'Education & Youth Skills (BEP)'],
    modules: []
  },
  {
    id: 'course-brac-103',
    tenantId: 'tenant-brac',
    title: 'Play-Based Early Childhood Pedagogy (Play Labs)',
    subtitle: 'Empowering children through joyful, child-centered experiential learning',
    description: 'Equip educators and community tutors with playful learning methodologies, culturally contextual curriculum design, and social-emotional development metrics.',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    category: 'Education & Youth Skills',
    level: 'Beginner',
    durationMinutes: 90,
    isMandatory: false,
    instructorName: 'Nusrat Jahan',
    instructorTitle: 'Early Childhood Education Lead',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    rating: 4.92,
    reviewCount: 520,
    enrolledCount: 4100,
    certificateEnabled: true,
    status: 'Published',
    tags: ['Play Labs', 'Early Learning', 'Pedagogy', 'Inclusive Education'],
    createdAt: '2025-01-20',
    targetDepartments: ['Education & Youth Skills (BEP)'],
    modules: []
  },
  {
    id: 'course-lumina-101',
    tenantId: 'tenant-lumina',
    title: 'Spatial UI & Glassmorphism Design Engineering (2026)',
    subtitle: 'Building luminescent spatial canvases, frosted acrylic shaders & backdrop-filter architectures',
    description: 'Master the principles of next-generation glassmorphic human-computer interfaces: optical refraction physics, specular reflections, multi-layer ambient blur composition, WCAG AA accessibility contrast in translucent containers, and dynamic CSS variable shaders.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    category: 'Engineering',
    level: 'Advanced',
    durationMinutes: 135,
    isMandatory: true,
    complianceDeadlineDays: 14,
    instructorName: 'Aria Vance',
    instructorTitle: 'Principal Spatial Systems Architect, Lumina Labs',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: 4.99,
    reviewCount: 420,
    enrolledCount: 3150,
    certificateEnabled: true,
    status: 'Published',
    tags: ['Glassmorphism', 'Spatial UI', 'CSS Shaders', 'Neural Design'],
    createdAt: '2025-01-25',
    targetDepartments: ['Spatial UI & Generative Vision', 'Neural LLM Architecture', 'Quantum AI Systems'],
    modules: [
      {
        id: 'lum-mod-1',
        title: 'Glassmorphism Optical Principles & Shader Architecture',
        durationMinutes: 45,
        lessons: [
          {
            id: 'lum-les-1-1',
            title: '1.1 Optical Refraction, Depth Stacking & Frosted Acrylic Shaders',
            type: 'video',
            durationMinutes: 20,
            summary: 'Explore multi-layer backdrop-filter saturation and ambient gradient lighting.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
          },
          {
            id: 'lum-les-1-2',
            title: '1.2 Accessible Contrast & Text Luminance on Glass Surfaces',
            type: 'article',
            durationMinutes: 25,
            summary: 'Ensuring WCAG AA 4.5:1 contrast compliance with dynamic specular highlights.',
            contentHtml: '<h3 class="text-xl font-bold mb-3 text-cyan-600 dark:text-cyan-300">Glassmorphism Standards</h3><p class="text-text-secondary">True glassmorphism balances translucent elegance with flawless legibility...</p>'
          }
        ]
      }
    ]
  },
  {
    id: 'course-lumina-102',
    tenantId: 'tenant-lumina',
    title: 'Autonomous Multi-Agent AI & Neural Systems Architecture',
    subtitle: 'Orchestrating agent swarms, memory vectors, tool calling & real-time telemetry',
    description: 'Design robust autonomous agent workflows leveraging Gemini 2.5 Pro, function calling, persistent vector embeddings, and real-time streaming interfaces.',
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    category: 'AI & Data',
    level: 'Advanced',
    durationMinutes: 180,
    isMandatory: false,
    instructorName: 'Dr. Orion Sterling',
    instructorTitle: 'Chief AI Scientist, Lumina Spatial Labs',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 4.96,
    reviewCount: 380,
    enrolledCount: 2840,
    certificateEnabled: true,
    status: 'Published',
    tags: ['Multi-Agent AI', 'Gemini', 'LLMOps', 'Vector Memory'],
    createdAt: '2025-02-01',
    targetDepartments: ['Neural LLM Architecture', 'Quantum AI Systems', 'Robotics Simulation'],
    modules: []
  },
  {
    id: 'course-sec-101',
    tenantId: 'tenant-acme',
    title: 'Cybersecurity & Zero Trust Architecture (2026)',
    subtitle: 'Mandatory enterprise security protocol, phishing defense & access token protection',
    description: 'Learn modern security principles including Zero Trust defense-in-depth, credential governance, multi-factor hardware keys, social engineering mitigation, and cloud infrastructure access management.',
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    category: 'Compliance & Security',
    level: 'Intermediate',
    durationMinutes: 90,
    isMandatory: true,
    complianceDeadlineDays: 14,
    instructorName: 'Marcus Vance, CISSP',
    instructorTitle: 'Principal Security Architect',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: 4.9,
    reviewCount: 312,
    enrolledCount: 840,
    certificateEnabled: true,
    status: 'Published',
    tags: ['Security', 'Zero Trust', 'Compliance', 'SOC-2'],
    createdAt: '2025-01-10',
    targetDepartments: ['Engineering', 'Cloud & Security', 'Sales & Growth', 'Product Management', 'People & HR'],
    modules: [
      {
        id: 'mod-1',
        title: 'Core Zero Trust Architecture & Defense in Depth',
        durationMinutes: 30,
        lessons: [
          {
            id: 'les-1-1',
            title: '1.1 The Death of the Perimeter & Micro-segmentation',
            type: 'video',
            durationMinutes: 12,
            summary: 'Understanding why perimeter-based security fails in distributed cloud environments and how identity becomes the primary firewall perimeter.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            resources: [
              { title: 'Zero_Trust_Implementation_Framework.pdf', size: '2.4 MB', url: '#', type: 'PDF' },
              { title: 'Enterprise_Credential_Matrix.xlsx', size: '640 KB', url: '#', type: 'Spreadsheet' }
            ]
          },
          {
            id: 'les-1-2',
            title: '1.2 Phishing, Session Hijacking & Hardware MFA',
            type: 'article',
            durationMinutes: 18,
            summary: 'Deep-dive into modern spear-phishing attack vectors, browser session cookie stealing, and why FIDO2/WebAuthn hardware security keys provide phishing-resistant authentication.',
            contentHtml: `
              <h3 class="text-xl font-bold mb-3 text-tenant-700 dark:text-tenant-200">The Modern Phishing Landscape</h3>
              <p class="mb-4 text-text-secondary leading-relaxed">Traditional SMS and TOTP authenticator app codes are increasingly vulnerable to Adversary-in-the-Middle (AitM) reverse proxy kits such as Evilginx. Attackers proxy legitimate login pages, intercepting both passwords and session session tokens in real time.</p>
              
              <div class="p-4 rounded-xl bg-tenant-50 dark:bg-tenant-200/10 border border-tenant-200 dark:border-tenant-200/20 mb-4">
                <h4 class="font-semibold text-tenant-600 dark:text-tenant-200 mb-1 flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">shield</span> Key Takeaway: FIDO2 / WebAuthn
                </h4>
                <p class="text-sm text-text-secondary">Hardware keys cryptographically bind the authentication signature to the exact origin domain (e.g. <code>academy.acme.com</code>), making phishing mathematically impossible even if the user clicks a deceptive link.</p>
              </div>

              <h3 class="text-xl font-bold mb-3 mt-6 text-tenant-700 dark:text-tenant-200">Emergency Protocol: Compromised Session</h3>
              <ul class="list-disc pl-6 space-y-2 text-text-secondary mb-4">
                <li>Immediately revoke all active OAuth & SSO sessions via the security dashboard.</li>
                <li>Trigger an emergency password rotation and register a new security key.</li>
                <li>Report the incident to <code>security-ops@acme.com</code> with complete browser header dumps.</li>
              </ul>
            `,
            resources: [
              { title: 'Phishing_Incident_Response_Playbook.pdf', size: '1.1 MB', url: '#', type: 'PDF' }
            ]
          }
        ]
      },
      {
        id: 'mod-2',
        title: 'Interactive Assessment & Certification Quiz',
        durationMinutes: 60,
        lessons: [
          {
            id: 'les-2-1',
            title: '2.1 Security & Zero Trust Knowledge Assessment',
            type: 'quiz',
            durationMinutes: 20,
            summary: 'Mandatory 4-question assessment. You must score at least 75% to achieve certification and maintain organizational compliance.',
            passingScorePercent: 75,
            quizQuestions: [
              {
                id: 'q1',
                question: 'What is the fundamental tenet of a Zero Trust Architecture (ZTA)?',
                options: [
                  'Trust all internal network traffic once behind the corporate VPN',
                  'Never trust, always verify every request regardless of origin',
                  'Only encrypt external communications while leaving internal APIs unauthenticated',
                  'Rely strictly on 8-character alphanumeric passwords changed monthly'
                ],
                correctAnswerIndex: 1,
                explanation: 'Zero Trust assumes the network is hostile and mandates strict identity verification, least privilege, and continuous telemetry on every single transaction.',
                points: 25
              },
              {
                id: 'q2',
                question: 'Why are FIDO2/WebAuthn hardware tokens resistant to reverse-proxy phishing attacks (e.g. AitM)?',
                options: [
                  'They produce a 12-digit PIN that changes every 10 seconds',
                  'They cryptographically bind challenge responses to the verified browser origin URL',
                  'They block all incoming traffic at the operating system firewall level',
                  'They require manual approval from a security administrator for every login'
                ],
                correctAnswerIndex: 1,
                explanation: 'WebAuthn protocol binds the cryptographic assertion to the browser-verified origin, preventing deceptive phishing proxies from reusing credentials.',
                points: 25
              },
              {
                id: 'q3',
                question: 'If you receive an urgent Slack message from an executive asking for a gift card purchase or confidential API token, what should you do?',
                options: [
                  'Fulfill the request immediately to avoid delaying company operations',
                  'Post the API credentials in a private Slack channel with auto-delete enabled',
                  'Verify through a secondary out-of-band communication channel and notify SecOps',
                  'Reply with dummy credentials to see if they are a real executive'
                ],
                correctAnswerIndex: 2,
                explanation: 'Executive impersonation via business email/chat compromise requires out-of-band verification and prompt incident escalation.',
                points: 25
              },
              {
                id: 'q4',
                question: 'What is the recommended protocol when an engineer detects an accidental API secret commit to a Git repository?',
                options: [
                  'Delete the commit with git push --force and tell no one',
                  'Immediately rotate/revoke the compromised secret in the cloud provider, then audit logs',
                  'Wait until the end of the sprint to rotate credentials in production',
                  'Change the file name in the repository so scanners cannot find it'
                ],
                correctAnswerIndex: 1,
                explanation: 'Secrets exposed in version control must be treated as instantly compromised. Immediate revocation and log audit are non-negotiable.',
                points: 25
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-cloud-202',
    tenantId: 'tenant-acme',
    title: 'Cloud Native Microservices & Kubernetes in Production',
    subtitle: 'Container orchestration, Service Mesh, CI/CD pipelines and resilience patterns',
    description: 'Master Kubernetes orchestration, Istio service mesh, distributed tracing with OpenTelemetry, Helm chart package management, and zero-downtime blue/green deployment strategies.',
    coverImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80',
    category: 'Engineering',
    level: 'Advanced',
    durationMinutes: 240,
    isMandatory: false,
    instructorName: 'Dr. Elena Rostova',
    instructorTitle: 'VP of Cloud Infrastructure',
    instructorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    rating: 4.85,
    reviewCount: 184,
    enrolledCount: 420,
    certificateEnabled: true,
    status: 'Published',
    tags: ['Kubernetes', 'Cloud', 'DevOps', 'Go'],
    createdAt: '2025-02-01',
    targetDepartments: ['Engineering', 'Cloud & Security'],
    modules: [
      {
        id: 'mod-c1',
        title: 'Container Orchestration & Pod Lifecycle',
        durationMinutes: 60,
        lessons: [
          {
            id: 'les-c1-1',
            title: '1.1 Pod Scheduling, Affinity & Topology Spread',
            type: 'video',
            durationMinutes: 25,
            summary: 'Detailed inspection of the kube-scheduler, node affinity rules, and balancing workloads across multi-region availability zones.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
          },
          {
            id: 'les-c1-2',
            title: '1.2 Helm 3 & GitOps Workflow with ArgoCD',
            type: 'article',
            durationMinutes: 35,
            summary: 'Declarative Kubernetes continuous deployment utilizing ArgoCD, repository webhooks, and automated drift reconciliation.',
            contentHtml: `
              <h3 class="text-xl font-bold mb-3 text-tenant-700 dark:text-tenant-200">The GitOps Operating Model</h3>
              <p class="mb-4 text-text-secondary leading-relaxed">GitOps treats Git as the single source of truth for declarative infrastructure and applications. ArgoCD runs in-cluster and continuously compares desired state against live cluster status.</p>
              <div class="p-4 bg-base-300 rounded-xl font-mono text-sm mb-4">
                apiVersion: argoproj.io/v1alpha1<br>
                kind: Application<br>
                metadata:<br>
                &nbsp;&nbsp;name: production-microservices<br>
                spec:<br>
                &nbsp;&nbsp;destination:<br>
                &nbsp;&nbsp;&nbsp;&nbsp;server: https://kubernetes.default.svc
              </div>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'course-hipaa-303',
    tenantId: 'tenant-apexhealth',
    title: 'HIPAA & Clinical Patient Data Privacy Standards',
    subtitle: 'Comprehensive compliance protocol for clinicians, EHR data handlers & nurses',
    description: 'Mandatory clinical training covering HIPAA Privacy Rule, Security Rule, Protected Health Information (PHI) safeguards, breach notification procedures, and telehealth encryption standards.',
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    category: 'Healthcare',
    level: 'Beginner',
    durationMinutes: 75,
    isMandatory: true,
    complianceDeadlineDays: 7,
    instructorName: 'Dr. Sarah Jenkins, MD',
    instructorTitle: 'Chief Compliance & Patient Safety Officer',
    instructorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
    rating: 4.95,
    reviewCount: 890,
    enrolledCount: 1980,
    certificateEnabled: true,
    status: 'Published',
    tags: ['HIPAA', 'Healthcare', 'Compliance', 'Patient Privacy'],
    createdAt: '2024-12-01',
    targetDepartments: ['Emergency Medicine', 'Surgical Staff', 'Nursing & ICU', 'Pharmacy', 'Clinical Compliance'],
    modules: [
      {
        id: 'mod-h1',
        title: 'HIPAA Essentials & PHI Identifiers',
        durationMinutes: 45,
        lessons: [
          {
            id: 'les-h1-1',
            title: '1.1 The 18 Direct Identifiers of Protected Health Information',
            type: 'article',
            durationMinutes: 20,
            summary: 'Recognizing all 18 identifiers under HIPAA including medical record numbers, biometric identifiers, device serial numbers, and geographic subdivisions.',
            contentHtml: `<p class="text-text-secondary">Never share patient records over unencrypted communication channels...</p>`
          },
          {
            id: 'les-h1-2',
            title: '1.2 Clinical HIPAA Mastery Assessment',
            type: 'quiz',
            durationMinutes: 25,
            summary: 'Evaluate clinical compliance scenarios and breach reporting rules.',
            passingScorePercent: 80,
            quizQuestions: [
              {
                id: 'qh1',
                question: 'Which of the following is considered Protected Health Information (PHI) under HIPAA?',
                options: [
                  'De-identified aggregate statistical health trends without patient markers',
                  'Patient discharge summary containing medical record number and admission date',
                  'Hospital cafeteria menu schedule',
                  'Public medical dictionary definitions'
                ],
                correctAnswerIndex: 1,
                explanation: 'Any health data linked with patient identifiers (dates, MRNs, names) constitutes PHI.',
                points: 50
              },
              {
                id: 'qh2',
                question: 'Under the HIPAA Breach Notification Rule, within what timeframe must covered entities notify affected individuals following discovery of a major breach?',
                options: [
                  'Within 60 calendar days without unreasonable delay',
                  'Within 1 year during annual audit review',
                  'Notification is not required if fewer than 10,000 individuals are impacted',
                  'Only if requested by local news agencies'
                ],
                correctAnswerIndex: 0,
                explanation: 'Covered entities must notify affected individuals within 60 calendar days of breach discovery.',
                points: 50
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-ai-404',
    tenantId: 'tenant-innovate',
    title: 'Generative AI Architecture & Autonomous Agents',
    subtitle: 'Building production LLM pipelines, RAG systems, Tool Calling & Multi-Agent Teams',
    description: 'Practical engineering guide to designing scalable generative AI systems: vector indexing with hybrid search, context compression, function-calling workflows, and self-correcting agent loops.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    category: 'AI & Data',
    level: 'Advanced',
    durationMinutes: 180,
    isMandatory: false,
    instructorName: 'Prof. Alex Chen, PhD',
    instructorTitle: 'AI Research Director',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 4.98,
    reviewCount: 142,
    enrolledCount: 165,
    certificateEnabled: true,
    status: 'Published',
    tags: ['LLM', 'AI Agents', 'RAG', 'Python', 'Vector DB'],
    createdAt: '2025-01-22',
    targetDepartments: ['Deep Learning', 'Prompt Engineering', 'MLOps Infrastructure', 'Autonomous Agents'],
    modules: [
      {
        id: 'mod-ai-1',
        title: 'Retrieval Augmented Generation (RAG) Architecture',
        durationMinutes: 90,
        lessons: [
          {
            id: 'les-ai-1-1',
            title: '1.1 Chunking Strategies & Vector Indexing',
            type: 'video',
            durationMinutes: 30,
            summary: 'Comparing recursive character splitting vs semantic AST chunking for high recall in domain-specific technical corpora.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
          }
        ]
      }
    ]
  },
  {
    id: 'course-aml-505',
    tenantId: 'tenant-finedge',
    title: 'Anti-Money Laundering (AML) & Financial Crime Prevention',
    subtitle: 'BSA/AML regulatory compliance, suspicious activity reporting (SAR) & KYC audits',
    description: 'Learn regulatory compliance frameworks, detecting illicit financial structuring, international transaction sanctions screening, customer due diligence (CDD), and FinCEN SAR filing protocols.',
    coverImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    category: 'Finance',
    level: 'Intermediate',
    durationMinutes: 110,
    isMandatory: true,
    complianceDeadlineDays: 10,
    instructorName: 'Victoria Sterling, CAMS',
    instructorTitle: 'Chief Anti-Money Laundering Officer',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    rating: 4.88,
    reviewCount: 340,
    enrolledCount: 470,
    certificateEnabled: true,
    status: 'Published',
    tags: ['Finance', 'AML', 'Banking', 'FinCEN', 'Compliance'],
    createdAt: '2025-01-05',
    targetDepartments: ['Investment Banking', 'AML Compliance', 'Risk Management', 'Wealth Advisors', 'Retail Banking'],
    modules: [
      {
        id: 'mod-aml-1',
        title: 'AML Red Flags & Transaction Monitoring',
        durationMinutes: 60,
        lessons: [
          {
            id: 'les-aml-1-1',
            title: '1.1 Structuring & Layering Detection Techniques',
            type: 'article',
            durationMinutes: 25,
            summary: 'Identifying suspicious smurfing patterns, rapid account movement, and shell company transaction indicators.',
            contentHtml: `<p class="text-text-secondary">Financial institutions must file a Suspicious Activity Report (SAR) whenever suspicious transaction anomalies are identified...</p>`
          }
        ]
      }
    ]
  }
];

const INITIAL_USERS: User[] = [
  // BRAC Users
  {
    id: 'usr-brac-1',
    tenantId: 'tenant-brac',
    name: 'Farhana Ahmed',
    email: 'farhana.ahmed@brac.net',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    role: 'tenant_admin',
    department: 'Human Resources & Leadership',
    enrolledCourses: ['course-brac-101', 'course-brac-102'],
    completedCourses: ['course-brac-101'],
    earnedCertificates: ['cert-brac-101'],
    points: 4850,
    badges: ['Chief Learning Officer', 'BRAC Master Architect', 'Client Protection Steward'],
    lastActive: 'Just now',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  {
    id: 'usr-brac-2',
    tenantId: 'tenant-brac',
    name: 'Tanvir Hossain',
    email: 'tanvir.h@brac.net',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    role: 'instructor',
    department: 'Microfinance & Financial Inclusion',
    enrolledCourses: ['course-brac-101'],
    completedCourses: ['course-brac-101'],
    earnedCertificates: ['cert-brac-101'],
    points: 3900,
    badges: ['Master Field Trainer', 'Financial Inclusion Lead'],
    lastActive: '12 mins ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  {
    id: 'usr-brac-3',
    tenantId: 'tenant-brac',
    name: 'Nusrat Jahan',
    email: 'nusrat.jahan@brac.net',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    role: 'learner',
    department: 'Education & Youth Skills (BEP)',
    enrolledCourses: ['course-brac-101', 'course-brac-103'],
    completedCourses: ['course-brac-101'],
    earnedCertificates: ['cert-brac-101'],
    points: 2150,
    badges: ['Play Labs Champion', 'Rapid Certified'],
    lastActive: '25 mins ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  {
    id: 'usr-brac-4',
    tenantId: 'tenant-brac',
    name: 'Arifur Rahman',
    email: 'arifur.r@brac.net',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    role: 'learner',
    department: 'Ultra-Poor Graduation',
    enrolledCourses: ['course-brac-101', 'course-brac-102'],
    completedCourses: [],
    earnedCertificates: [],
    points: 820,
    badges: ['UPG Field Associate'],
    lastActive: '1 hour ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  // Lumina Spatial Labs (Glassmorphism LMS Users)
  {
    id: 'usr-lum-1',
    tenantId: 'tenant-lumina',
    name: 'Aria Vance',
    email: 'aria.admin@lumina-glass.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    role: 'tenant_admin',
    department: 'Spatial UI & Generative Vision',
    enrolledCourses: ['course-lumina-101', 'course-lumina-102'],
    completedCourses: ['course-lumina-101'],
    earnedCertificates: ['cert-lum-101'],
    points: 5400,
    badges: ['Spatial Glass Pioneer', 'Neural UI Architect', 'Chief Vision Officer'],
    lastActive: 'Just now',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  {
    id: 'usr-lum-2',
    tenantId: 'tenant-lumina',
    name: 'Dr. Orion Sterling',
    email: 'orion.s@lumina-glass.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    role: 'instructor',
    department: 'Neural LLM Architecture',
    enrolledCourses: ['course-lumina-102'],
    completedCourses: ['course-lumina-102'],
    earnedCertificates: ['cert-lum-102'],
    points: 4320,
    badges: ['Multi-Agent Maestro', 'Quantum Systems Fellow'],
    lastActive: '8 mins ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  {
    id: 'usr-lum-3',
    tenantId: 'tenant-lumina',
    name: 'Kaelen Thorne',
    email: 'kaelen.t@lumina-glass.io',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    role: 'learner',
    department: 'Quantum AI Systems',
    enrolledCourses: ['course-lumina-101'],
    completedCourses: ['course-lumina-101'],
    earnedCertificates: ['cert-lum-101'],
    points: 2950,
    badges: ['Glass Shader Master', 'Fast Learner'],
    lastActive: '14 mins ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  // Acme Corp Users
  {
    id: 'usr-acme-1',
    tenantId: 'tenant-acme',
    name: 'Clara Oswald',
    email: 'clara.admin@acme.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    role: 'tenant_admin',
    department: 'People & HR',
    enrolledCourses: ['course-sec-101'],
    completedCourses: ['course-sec-101'],
    earnedCertificates: ['cert-101'],
    points: 1250,
    badges: ['Security Champion', 'Tenant Admin Ace'],
    lastActive: '10 mins ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  {
    id: 'usr-acme-2',
    tenantId: 'tenant-acme',
    name: 'David Kim',
    email: 'david.kim@acme.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    role: 'learner',
    department: 'Engineering',
    enrolledCourses: ['course-sec-101', 'course-cloud-202'],
    completedCourses: ['course-sec-101'],
    earnedCertificates: ['cert-102'],
    points: 840,
    badges: ['Cloud Architect', 'Early Finisher'],
    lastActive: '1 hour ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  {
    id: 'usr-acme-3',
    tenantId: 'tenant-acme',
    name: 'Sophia Rodriguez',
    email: 'sophia.r@acme.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    role: 'learner',
    department: 'Sales & Growth',
    enrolledCourses: ['course-sec-101'],
    completedCourses: [],
    earnedCertificates: [],
    points: 210,
    badges: ['New Explorer'],
    lastActive: '3 days ago',
    status: 'Active',
    complianceStatus: 'At Risk'
  },
  {
    id: 'usr-acme-4',
    tenantId: 'tenant-acme',
    name: 'Marcus Vance',
    email: 'marcus.vance@acme.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    role: 'instructor',
    department: 'Cloud & Security',
    enrolledCourses: ['course-sec-101'],
    completedCourses: ['course-sec-101'],
    earnedCertificates: [],
    points: 3400,
    badges: ['Master Instructor', 'Content Creator'],
    lastActive: '25 mins ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  // Apex Health Users
  {
    id: 'usr-apex-1',
    tenantId: 'tenant-apexhealth',
    name: 'Dr. Sarah Jenkins',
    email: 'dr.jenkins@apexhealth.org',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
    role: 'tenant_admin',
    department: 'Clinical Compliance',
    enrolledCourses: ['course-hipaa-303'],
    completedCourses: ['course-hipaa-303'],
    earnedCertificates: ['cert-301'],
    points: 2800,
    badges: ['HIPAA Master', 'Clinical Safety Lead'],
    lastActive: '5 mins ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  {
    id: 'usr-apex-2',
    tenantId: 'tenant-apexhealth',
    name: 'Nurse Emily Watson',
    email: 'e.watson@apexhealth.org',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    role: 'learner',
    department: 'Nursing & ICU',
    enrolledCourses: ['course-hipaa-303'],
    completedCourses: ['course-hipaa-303'],
    earnedCertificates: ['cert-302'],
    points: 920,
    badges: ['Patient Guardian'],
    lastActive: '2 hours ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  },
  {
    id: 'usr-apex-3',
    tenantId: 'tenant-apexhealth',
    name: 'Dr. Robert Torres',
    email: 'r.torres@apexhealth.org',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80',
    role: 'learner',
    department: 'Emergency Medicine',
    enrolledCourses: ['course-hipaa-303'],
    completedCourses: [],
    earnedCertificates: [],
    points: 100,
    badges: [],
    lastActive: '6 days ago',
    status: 'Active',
    complianceStatus: 'Overdue'
  },
  // Stanford Tech Users
  {
    id: 'usr-stanford-1',
    tenantId: 'tenant-stanford',
    name: 'Prof. Katherine Bell',
    email: 'kbell@stanfordtech.edu',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    role: 'tenant_admin',
    department: 'Computer Science',
    enrolledCourses: [],
    completedCourses: [],
    earnedCertificates: [],
    points: 4100,
    badges: ['Academic Dean'],
    lastActive: '12 mins ago',
    status: 'Active',
    complianceStatus: 'Compliant'
  }
];

const INITIAL_ENROLLMENTS: CourseEnrollment[] = [
  {
    id: 'enr-brac-1',
    tenantId: 'tenant-brac',
    userId: 'usr-brac-3', // Nusrat Jahan
    courseId: 'course-brac-101',
    progressPercent: 100,
    completedLessonIds: ['brac-les-1-1', 'brac-les-1-2', 'brac-les-2-1'],
    quizScores: { 'brac-les-2-1': 100 },
    status: 'completed',
    startedAt: '2025-02-05T09:00:00Z',
    completedAt: '2025-02-05T11:30:00Z'
  },
  {
    id: 'enr-brac-2',
    tenantId: 'tenant-brac',
    userId: 'usr-brac-4', // Arifur Rahman
    courseId: 'course-brac-101',
    progressPercent: 50,
    completedLessonIds: ['brac-les-1-1'],
    quizScores: {},
    status: 'in_progress',
    startedAt: '2025-02-14T10:00:00Z',
    lastAccessedLessonId: 'brac-les-1-2'
  },
  {
    id: 'enr-1',
    tenantId: 'tenant-acme',
    userId: 'usr-acme-2', // David Kim
    courseId: 'course-sec-101',
    progressPercent: 100,
    completedLessonIds: ['les-1-1', 'les-1-2', 'les-2-1'],
    quizScores: { 'les-2-1': 100 },
    status: 'completed',
    startedAt: '2025-02-10T09:00:00Z',
    completedAt: '2025-02-10T10:45:00Z'
  },
  {
    id: 'enr-2',
    tenantId: 'tenant-acme',
    userId: 'usr-acme-2', // David Kim
    courseId: 'course-cloud-202',
    progressPercent: 50,
    completedLessonIds: ['les-c1-1'],
    quizScores: {},
    status: 'in_progress',
    startedAt: '2025-02-14T14:30:00Z',
    lastAccessedLessonId: 'les-c1-2'
  },
  {
    id: 'enr-3',
    tenantId: 'tenant-acme',
    userId: 'usr-acme-3', // Sophia Rodriguez
    courseId: 'course-sec-101',
    progressPercent: 33,
    completedLessonIds: ['les-1-1'],
    quizScores: {},
    status: 'in_progress',
    startedAt: '2025-02-12T11:20:00Z',
    dueDate: '2025-02-26T23:59:59Z'
  }
];

const INITIAL_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-brac-101',
    tenantId: 'tenant-brac',
    tenantName: 'BRAC',
    tenantLogo: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
    userId: 'usr-brac-1',
    userName: 'Farhana Ahmed',
    userEmail: 'farhana.ahmed@brac.net',
    courseId: 'course-brac-101',
    courseTitle: 'BRAC Microfinance Operations & Client Protection Principles (2026)',
    category: 'Microfinance & Compliance',
    issuedDate: '2025-02-05',
    verificationCode: 'BRAC-MF-2026-89410',
    gradeScore: 100,
    instructorName: 'Tanvir Hossain',
    expiryDate: '2027-02-05'
  },
  {
    id: 'cert-brac-102',
    tenantId: 'tenant-brac',
    tenantName: 'BRAC',
    tenantLogo: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
    userId: 'usr-brac-3',
    userName: 'Nusrat Jahan',
    userEmail: 'nusrat.jahan@brac.net',
    courseId: 'course-brac-101',
    courseTitle: 'BRAC Microfinance Operations & Client Protection Principles (2026)',
    category: 'Microfinance & Compliance',
    issuedDate: '2025-02-05',
    verificationCode: 'BRAC-MF-2026-89411',
    gradeScore: 98,
    instructorName: 'Tanvir Hossain',
    expiryDate: '2027-02-05'
  },
  {
    id: 'cert-lum-101',
    tenantId: 'tenant-lumina',
    tenantName: 'Lumina Spatial Labs',
    tenantLogo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=200&q=80',
    userId: 'usr-lum-1',
    userName: 'Aria Vance',
    userEmail: 'aria.admin@lumina-glass.io',
    courseId: 'course-lumina-101',
    courseTitle: 'Spatial UI & Glassmorphism Design Engineering (2026)',
    category: 'Engineering',
    issuedDate: '2025-02-08',
    verificationCode: 'LUM-GLASS-2026-77341',
    gradeScore: 100,
    instructorName: 'Aria Vance',
    expiryDate: '2028-02-08'
  },
  {
    id: 'cert-101',
    tenantId: 'tenant-acme',
    tenantName: 'Acme Global Enterprise',
    tenantLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    userId: 'usr-acme-1',
    userName: 'Clara Oswald',
    userEmail: 'clara.admin@acme.com',
    courseId: 'course-sec-101',
    courseTitle: 'Cybersecurity & Zero Trust Architecture (2026)',
    category: 'Compliance & Security',
    issuedDate: '2025-02-08',
    verificationCode: 'ACM-SEC-2026-98421',
    gradeScore: 98,
    instructorName: 'Marcus Vance, CISSP',
    expiryDate: '2027-02-08'
  },
  {
    id: 'cert-102',
    tenantId: 'tenant-acme',
    tenantName: 'Acme Global Enterprise',
    tenantLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    userId: 'usr-acme-2',
    userName: 'David Kim',
    userEmail: 'david.kim@acme.com',
    courseId: 'course-sec-101',
    courseTitle: 'Cybersecurity & Zero Trust Architecture (2026)',
    category: 'Compliance & Security',
    issuedDate: '2025-02-10',
    verificationCode: 'ACM-SEC-2026-41908',
    gradeScore: 100,
    instructorName: 'Marcus Vance, CISSP',
    expiryDate: '2027-02-10'
  },
  {
    id: 'cert-301',
    tenantId: 'tenant-apexhealth',
    tenantName: 'Apex Health System',
    tenantLogo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=200&q=80',
    userId: 'usr-apex-1',
    userName: 'Dr. Sarah Jenkins',
    userEmail: 'dr.jenkins@apexhealth.org',
    courseId: 'course-hipaa-303',
    courseTitle: 'HIPAA & Clinical Patient Data Privacy Standards',
    category: 'Healthcare',
    issuedDate: '2025-01-18',
    verificationCode: 'APX-MED-2025-11042',
    gradeScore: 100,
    instructorName: 'Dr. Sarah Jenkins, MD',
    expiryDate: '2026-01-18'
  }
];

const INITIAL_WEBINARS: LiveWebinar[] = [
  {
    id: 'web-brac-1',
    tenantId: 'tenant-brac',
    title: 'Sir Fazle Hasan Abed Memorial Lecture: Scaling Frugal Innovation & Human Dignity',
    description: 'Annual global leadership symposium exploring community empowerment at scale and systemic social change across 11 countries.',
    instructor: 'Asif Saleh (Executive Director, BRAC)',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    scheduledAt: '2025-03-10T15:00:00Z',
    durationMinutes: 90,
    attendeeCount: 1840,
    maxAttendees: 5000,
    platform: 'BRAC Digital Stage (WebRTC)',
    status: 'Upcoming',
    joinUrl: '#'
  },
  {
    id: 'web-brac-2',
    tenantId: 'tenant-brac',
    title: '2026 Microfinance Digital Transformation & Climate Risk Shielding',
    description: 'Interactive session exploring digital wallets, agricultural insurance, and cyclone-resilient loan restructuring.',
    instructor: 'Tanvir Hossain',
    instructorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    scheduledAt: '2025-03-18T11:00:00Z',
    durationMinutes: 60,
    attendeeCount: 780,
    maxAttendees: 2000,
    platform: 'BRAC Digital Stage (WebRTC)',
    status: 'Upcoming',
    joinUrl: '#'
  },
  {
    id: 'web-1',
    tenantId: 'tenant-acme',
    title: 'Zero-Day Incident Response & Live Threat Hunting',
    description: 'Interactive live simulation investigating malware persistence mechanisms and live memory forensics.',
    instructor: 'Marcus Vance',
    instructorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    scheduledAt: '2025-03-05T18:00:00Z',
    durationMinutes: 60,
    attendeeCount: 142,
    maxAttendees: 500,
    platform: 'Built-in WebRTC',
    status: 'Upcoming',
    joinUrl: '#'
  },
  {
    id: 'web-2',
    tenantId: 'tenant-acme',
    title: 'Q1 2026 Engineering All-Hands: AI Agent Integration',
    description: 'Quarterly review of production microservices migration and enterprise AI tooling.',
    instructor: 'Dr. Elena Rostova',
    instructorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    scheduledAt: '2025-03-12T17:00:00Z',
    durationMinutes: 90,
    attendeeCount: 285,
    maxAttendees: 1000,
    platform: 'Zoom',
    status: 'Upcoming',
    joinUrl: '#'
  },
  {
    id: 'web-3',
    tenantId: 'tenant-apexhealth',
    title: 'Clinical Telehealth Security & EHR Audit Updates',
    description: 'Mandatory clinical safety session for hospital department heads and senior nursing supervisors.',
    instructor: 'Dr. Sarah Jenkins',
    instructorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
    scheduledAt: '2025-03-08T15:00:00Z',
    durationMinutes: 45,
    attendeeCount: 410,
    maxAttendees: 1000,
    platform: 'Teams',
    status: 'Upcoming',
    joinUrl: '#'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    tenantId: 'tenant-acme',
    tenantName: 'Acme Global Enterprise',
    actor: 'Clara Oswald',
    actorRole: 'Tenant Admin',
    action: 'Mandatory Course Assignment',
    target: 'Cybersecurity & Zero Trust Architecture (2026) -> Sales Dept',
    timestamp: '15 mins ago',
    severity: 'info',
    ipAddress: '192.0.2.45'
  },
  {
    id: 'log-2',
    tenantId: 'tenant-acme',
    tenantName: 'Acme Global Enterprise',
    actor: 'David Kim',
    actorRole: 'Learner',
    action: 'Certificate Earned (Grade: 100%)',
    target: 'Cybersecurity & Zero Trust (ACM-SEC-2026-41908)',
    timestamp: '1 hour ago',
    severity: 'success',
    ipAddress: '198.51.100.12'
  },
  {
    id: 'log-3',
    tenantId: 'tenant-acme',
    tenantName: 'Acme Global Enterprise',
    actor: 'Super Admin',
    actorRole: 'Platform Super Admin',
    action: 'Tenant Quota Expansion',
    target: 'Seats increased 1000 -> 1200',
    timestamp: '4 hours ago',
    severity: 'warning',
    ipAddress: '203.0.113.88'
  },
  {
    id: 'log-4',
    tenantId: 'tenant-apexhealth',
    tenantName: 'Apex Health System',
    actor: 'Dr. Sarah Jenkins',
    actorRole: 'Tenant Admin',
    action: 'Automated Compliance Reminder Sent',
    target: '34 Overdue Hospital Personnel',
    timestamp: '6 hours ago',
    severity: 'info',
    ipAddress: '198.51.100.74'
  }
];

const INITIAL_LMS_INSTANCES: LmsInstance[] = [
  {
    id: 'LMS-1972-01',
    organizationId: 'tenant-brac',
    organizationNumericId: '1972',
    organizationName: 'BRAC',
    status: 'Active',
    isDraft: false,
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
    createdBy: 'System Admin',
    basicInfo: {
      lmsName: 'BRAC Microfinance Learning Portal',
      programmeDepartment: 'Microfinance',
      summary: 'Specialized enterprise LMS managing field officer certifications, client protection ethics, and digitized credit recovery workflows across 64 districts.',
      goal: 'Certify 15,000+ branch accountants, program organizers, and area managers on responsible lending compliance.',
      lmsType: 'Private',
      urlDomain: 'microfinance.learn.brac.net',
      timezone: 'Asia/Dhaka',
      logo: {
        url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=200&q=80',
        fileName: 'brac-mf-logo.png'
      }
    },
    resources: {
      databaseSizeGb: 200,
      fileStorageGb: 600,
      usageAlertThresholdPct: 85
    },
    admins: [
      {
        name: 'Tanvir Hossain',
        email: 'tanvir.admin@brac.net',
        contactNumber: '01711002233',
        role: 'LMS Admin',
        invitationStatus: 'accepted'
      }
    ],
    branding: {
      primaryColor: '#EC008C', // 100% Pantone Magenta (BRAC Pink Standard)
      accentColor: '#C40072',  // Deep Magenta Complement
      tagline: 'Digitized Microfinance & Client Protection Compliance',
      bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
      customCssEnabled: true,
      themePreset: 'solid',
      ssoProvider: 'Okta'
    },
    layoutPreferences: {
      navigationMode: 'sidebar',
      headerDensity: 'comfortable',
      showBreadcrumbs: true,
      stickyHeader: true,
      contentWidth: 'fluid',
      accentMode: 'brand'
    }
  },
  {
    id: 'LMS-1972-02',
    organizationId: 'tenant-brac',
    organizationNumericId: '1972',
    organizationName: 'BRAC',
    status: 'Active',
    isDraft: false,
    createdAt: '2024-06-15',
    updatedAt: '2024-06-15',
    createdBy: 'Tanvir Hossain',
    basicInfo: {
      lmsName: 'BRAC Ultra-Poor Graduation Academy',
      programmeDepartment: 'Ultra-Poor Graduation',
      summary: 'Global learning hub for researchers, coaches, and development practitioners mastering the 24-month multidimensional graduation methodology.',
      goal: 'Scale evidence-based poverty graduation interventions globally through interactive masterclasses and field assessment rubrics.',
      lmsType: 'Public',
      urlDomain: 'upg-academy.learn.brac.net',
      timezone: 'Asia/Dhaka',
      logo: {
        url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=200&q=80',
        fileName: 'upg-logo.png'
      }
    },
    resources: {
      databaseSizeGb: 150,
      fileStorageGb: 400,
      usageAlertThresholdPct: 80
    },
    admins: [
      {
        name: 'Dr. Imran Matin',
        email: 'imran.matin@brac.net',
        contactNumber: '01712003344',
        role: 'LMS Admin',
        invitationStatus: 'accepted'
      }
    ],
    branding: {
      primaryColor: '#059669', // Emerald Green
      accentColor: '#10b981',  // Bright Green
      tagline: 'Evidence-Based Multidimensional Poverty Graduation Methodology',
      bannerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      themePreset: 'solid',
      ssoProvider: 'Google Workspace'
    },
    layoutPreferences: {
      navigationMode: 'sidebar',
      headerDensity: 'comfortable',
      showBreadcrumbs: true,
      stickyHeader: true,
      contentWidth: 'fluid',
      accentMode: 'brand'
    }
  },
  {
    id: 'LMS-1972-03',
    organizationId: 'tenant-brac',
    organizationNumericId: '1972',
    organizationName: 'BRAC',
    status: 'Under Processing',
    isDraft: false,
    provisioningProgress: 65,
    createdAt: '2025-02-21',
    updatedAt: '2025-02-21',
    createdBy: 'Tanvir Hossain',
    basicInfo: {
      lmsName: 'Play Labs Early Childhood Portal',
      programmeDepartment: 'Education & Youth Skills',
      summary: 'Community early-learning facilitator toolkit, child psychology observation modules, and interactive play pedagogy.',
      goal: 'Provide 3,000+ Play Lab teachers with gamified lesson plans and parent engagement frameworks.',
      lmsType: 'Public',
      urlDomain: 'playlabs.learn.brac.net',
      timezone: 'Asia/Dhaka',
      logo: {
        url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=200&q=80',
        fileName: 'playlabs-logo.png'
      }
    },
    resources: {
      databaseSizeGb: 100,
      fileStorageGb: 250,
      usageAlertThresholdPct: 80
    },
    admins: [
      {
        name: 'Nusrat Jahan',
        email: 'nusrat.jahan@brac.net',
        contactNumber: '01713004455',
        role: 'LMS Admin',
        invitationStatus: 'pending'
      }
    ],
    branding: {
      primaryColor: '#d97706', // Warm Amber
      accentColor: '#f59e0b',
      tagline: 'Early Childhood Play Pedagogy & Community Learning Facilitation',
      bannerUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      themePreset: 'solid',
      ssoProvider: 'Okta'
    },
    layoutPreferences: {
      navigationMode: 'sidebar',
      headerDensity: 'compact',
      showBreadcrumbs: true,
      stickyHeader: true,
      contentWidth: 'fluid',
      accentMode: 'brand'
    }
  },
  {
    id: 'LMS-1972-04',
    organizationId: 'tenant-brac',
    organizationNumericId: '1972',
    organizationName: 'BRAC',
    status: 'Drafted',
    isDraft: true,
    createdAt: '2025-01-10',
    updatedAt: '2025-01-12',
    createdBy: 'Nusrat Jahan',
    basicInfo: {
      lmsName: 'Climate Resilience & Disaster Management Hub',
      programmeDepartment: 'Climate Change & Disaster Management',
      summary: 'Emergency evacuation logistics, cyclone shelter protocols, and community-led climate adaptation micro-insurance certification.',
      goal: 'Train 10,000 coastal community responders on storm warning dissemination and disaster risk reduction.',
      lmsType: 'Public',
      urlDomain: 'climate.learn.brac.net',
      timezone: 'Asia/Dhaka',
      logo: {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=200&q=80',
        fileName: 'climate-logo.png'
      }
    },
    resources: {
      databaseSizeGb: 60,
      fileStorageGb: 150,
      usageAlertThresholdPct: 75
    },
    admins: [
      {
        name: 'Shakil Anwar',
        email: 'shakil.anwar@brac.net',
        contactNumber: '01714005566',
        role: 'LMS Admin',
        invitationStatus: 'pending'
      }
    ],
    branding: {
      primaryColor: '#0284c7', // Sky Blue
      accentColor: '#0ea5e9',
      tagline: 'Coastal Climate Adaptation, Disaster Preparedness & Cyclone Safety',
      bannerUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      themePreset: 'solid',
      ssoProvider: 'None'
    },
    layoutPreferences: {
      navigationMode: 'sidebar',
      headerDensity: 'comfortable',
      showBreadcrumbs: true,
      stickyHeader: true,
      contentWidth: 'fluid',
      accentMode: 'brand'
    }
  },
  {
    id: 'LMS-1972-05',
    organizationId: 'tenant-brac',
    organizationNumericId: '1972',
    organizationName: 'BRAC',
    status: 'Deactivated',
    isDraft: false,
    createdAt: '2023-11-20',
    updatedAt: '2024-12-01',
    createdBy: 'System Admin',
    basicInfo: {
      lmsName: 'Legacy Procurement & Inventory System LMS',
      programmeDepartment: 'Procurement',
      summary: 'Archived procurement training portal for legacy ERP 2023 rollout. Replaced by unified supply chain module.',
      goal: 'Historical archive of procurement standard operating procedure modules.',
      lmsType: 'Private',
      urlDomain: 'procurement-archive.learn.brac.net',
      timezone: 'Asia/Dhaka',
      logo: {
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80',
        fileName: 'procure-logo.png'
      }
    },
    resources: {
      databaseSizeGb: 40,
      fileStorageGb: 100,
      usageAlertThresholdPct: 90
    },
    admins: [
      {
        name: 'Tanvir Hossain',
        email: 'tanvir.admin@brac.net',
        contactNumber: '01711002233',
        role: 'LMS Admin',
        invitationStatus: 'accepted'
      }
    ],
    branding: {
      primaryColor: '#64748b', // Slate
      accentColor: '#94a3b8',
      tagline: 'Archived ERP Standard Operating Procedures & Procurement',
      bannerUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      themePreset: 'solid',
      ssoProvider: 'None'
    },
    layoutPreferences: {
      navigationMode: 'sidebar',
      headerDensity: 'comfortable',
      showBreadcrumbs: true,
      stickyHeader: true,
      contentWidth: 'fluid',
      accentMode: 'brand'
    }
  },
  {
    id: 'LMS-1972-06',
    organizationId: 'tenant-brac',
    organizationNumericId: '1972',
    organizationName: 'BRAC',
    status: 'Under Processing',
    isDraft: false,
    provisioningProgress: 40,
    createdAt: '2025-02-23',
    updatedAt: '2025-02-23',
    createdBy: 'Tanvir Hossain',
    basicInfo: {
      lmsName: 'BRAC Health & Community Nutrition Portal',
      programmeDepartment: 'Health',
      summary: 'Shasthya Shebika community health worker diagnostic protocols, maternal health checklists, and infant nutrition tracking.',
      goal: 'Equip 20,000 frontline health workers with digital health diagnostic skills.',
      lmsType: 'Private',
      urlDomain: 'health.learn.brac.net',
      timezone: 'Asia/Dhaka',
      logo: {
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=200&q=80',
        fileName: 'health-logo.png'
      }
    },
    resources: {
      databaseSizeGb: 120,
      fileStorageGb: 300,
      usageAlertThresholdPct: 80
    },
    admins: [
      {
        name: 'Farhana Rahman',
        email: 'farhana.health@brac.net',
        contactNumber: '01715006677',
        role: 'LMS Admin',
        invitationStatus: 'pending'
      }
    ],
    branding: {
      primaryColor: '#e11d48', // Rose / Ruby
      accentColor: '#f43f5e',
      tagline: 'Frontline Community Health & Maternal Nutrition Diagnostic Toolkits',
      bannerUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      themePreset: 'solid',
      ssoProvider: 'Okta'
    },
    layoutPreferences: {
      navigationMode: 'sidebar',
      headerDensity: 'comfortable',
      showBreadcrumbs: true,
      stickyHeader: true,
      contentWidth: 'fluid',
      accentMode: 'brand'
    }
  },
  {
    id: 'LMS-5520-01',
    organizationId: 'tenant-lumina',
    organizationNumericId: '5520',
    organizationName: 'Lumina Spatial Labs',
    status: 'Active',
    isDraft: false,
    createdAt: '2024-04-10',
    updatedAt: '2024-04-10',
    createdBy: 'Aria Vance',
    basicInfo: {
      lmsName: 'Spatial UI & Neural Dynamics Academy',
      programmeDepartment: 'Spatial UI & Generative Vision',
      summary: 'High-performance interactive simulation canvas for optical refraction, glassmorphic UI architecture, and autonomous agent orchestration.',
      goal: 'Train engineers on spatial computing headsets and WebGPU shader pipelines.',
      lmsType: 'Private',
      urlDomain: 'spatial.academy.lumina-glass.io',
      timezone: 'Asia/Dhaka'
    },
    resources: {
      databaseSizeGb: 150,
      fileStorageGb: 450,
      usageAlertThresholdPct: 80
    },
    admins: [
      {
        name: 'Aria Vance',
        email: 'aria.admin@lumina-glass.io',
        contactNumber: '01799887766',
        role: 'LMS Admin',
        invitationStatus: 'accepted'
      }
    ],
    branding: {
      primaryColor: '#7c3aed', // Vibrant Violet
      accentColor: '#06b6d4',  // Cyan
      tagline: 'Spatial Computing, Optical Refraction & Generative Vision',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      themePreset: 'glassmorphism',
      ssoProvider: 'Okta'
    },
    layoutPreferences: {
      navigationMode: 'top_menu',
      headerDensity: 'comfortable',
      showBreadcrumbs: true,
      stickyHeader: true,
      contentWidth: 'fluid',
      accentMode: 'brand'
    }
  },
  {
    id: 'LMS-4821-01',
    organizationId: 'tenant-acme',
    organizationNumericId: '4821',
    organizationName: 'Acme Global Enterprise',
    status: 'Active',
    isDraft: false,
    createdAt: '2024-02-05',
    updatedAt: '2024-02-05',
    createdBy: 'Clara Oswald',
    basicInfo: {
      lmsName: 'Enterprise Cloud & Zero Trust Security',
      programmeDepartment: 'Engineering',
      summary: 'Corporate compliance, Zero Trust SOC-2 credential governance, and Kubernetes cluster engineering portal.',
      goal: 'Achieve 100% staff certification on phishing resistance and secure cloud deployment.',
      lmsType: 'Private',
      urlDomain: 'eng.academy.acme.com',
      timezone: 'Asia/Dhaka'
    },
    resources: {
      databaseSizeGb: 100,
      fileStorageGb: 200,
      usageAlertThresholdPct: 80
    },
    admins: [
      {
        name: 'Clara Oswald',
        email: 'clara.admin@acme.com',
        contactNumber: '01712345678',
        role: 'LMS Admin',
        invitationStatus: 'accepted'
      }
    ],
    branding: {
      primaryColor: '#2563eb', // Enterprise Blue
      accentColor: '#38bdf8',  // Sky
      tagline: 'Zero Trust Architecture, SOC-2 Credential Governance & Cloud Security',
      bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80',
      customCssEnabled: true,
      themePreset: 'solid',
      ssoProvider: 'Azure AD'
    },
    layoutPreferences: {
      navigationMode: 'compact_rail',
      headerDensity: 'compact',
      showBreadcrumbs: true,
      stickyHeader: true,
      contentWidth: 'fluid',
      accentMode: 'brand'
    }
  }
];

const INITIAL_LMS_DRAFTS: LmsDraft[] = [
  {
    id: 'LMS-DRAFT-1972-88',
    organizationId: 'tenant-brac',
    organizationName: 'BRAC',
    status: 'In-Progress',
    isDraft: true,
    lastCompletedStep: 'basic-info',
    createdAt: '2025-02-20',
    updatedAt: '2025-02-20',
    basicInfo: {
      lmsName: 'Climate Resilience & Disaster Adaptation LMS',
      programmeDepartment: 'Climate Change & Disaster Management',
      summary: 'Emergency evacuation logistics, cyclone shelter training, and climate micro-insurance modules for coastal branches.',
      goal: 'Prepare 5,000 community volunteers for rapid cyclone response.',
      lmsType: 'Public',
      urlDomain: 'climate.learn.brac.net',
      timezone: 'Asia/Dhaka'
    },
    resources: {
      databaseSizeGb: 80,
      fileStorageGb: 200,
      usageAlertThresholdPct: 75
    },
    admins: [
      {
        name: 'Shakil Anwar',
        email: 'shakil.anwar@brac.net',
        contactNumber: '01714005566',
        role: 'LMS Admin',
        invitationStatus: 'pending'
      }
    ]
  }
];

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidget[] = [
  {
    id: 'w-announcement-1',
    type: 'announcement_banner',
    title: 'Tenant Skill & Compliance Directive',
    colSpan: 4,
    rowSpan: 1,
    visibleForRoles: ['super_admin', 'tenant_admin', 'instructor', 'learner'],
    config: {
      bannerText: 'Annual Mandatory Cybersecurity & Regulatory Certification cycle is in effect. All personnel must complete assignments before the due date.',
      bannerType: 'indigo'
    }
  },
  {
    id: 'w-kpi-grid-1',
    type: 'kpi_grid',
    title: 'High-Level Operational Key Performance Indicators',
    subtitle: 'Real-time telemetry aggregated for active tenant and role',
    colSpan: 4,
    rowSpan: 1,
    visibleForRoles: ['super_admin', 'tenant_admin', 'instructor', 'learner']
  },
  {
    id: 'w-learner-courses-1',
    type: 'learner_in_progress',
    title: 'Continue Active Learning',
    subtitle: 'Enrolled interactive curricula & mandatory certification modules',
    colSpan: 3,
    rowSpan: 2,
    visibleForRoles: ['learner']
  },
  {
    id: 'w-gamification-1',
    type: 'gamification_leaderboard',
    title: 'Skill Mastery & XP Leaderboard',
    subtitle: 'Top achievers and credential badge showcase',
    colSpan: 1,
    rowSpan: 2,
    visibleForRoles: ['learner', 'instructor']
  },
  {
    id: 'w-dept-matrix-1',
    type: 'chart_department_matrix',
    title: 'Department Progress & Compliance Matrix',
    subtitle: 'Aggregated progress across operational units',
    colSpan: 2,
    rowSpan: 2,
    visibleForRoles: ['super_admin', 'tenant_admin', 'instructor']
  },
  {
    id: 'w-enrollment-trends-1',
    type: 'chart_enrollment_trends',
    title: 'Enrollment & Completion Velocity',
    subtitle: 'Monthly progression trends across active cohorts',
    colSpan: 2,
    rowSpan: 2,
    visibleForRoles: ['super_admin', 'tenant_admin']
  },
  {
    id: 'w-escalation-queue-1',
    type: 'escalation_queue',
    title: 'Compliance Risk & Escalation Queue',
    subtitle: 'Personnel requiring immediate remediation',
    colSpan: 2,
    rowSpan: 2,
    visibleForRoles: ['super_admin', 'tenant_admin', 'instructor']
  },
  {
    id: 'w-live-audit-1',
    type: 'live_audit_feed',
    title: 'Real-Time Security & Audit Stream',
    subtitle: 'Live tamper-proof event logs and compliance traces',
    colSpan: 2,
    rowSpan: 2,
    visibleForRoles: ['super_admin', 'tenant_admin']
  },
  {
    id: 'w-upcoming-webinars-1',
    type: 'upcoming_webinars',
    title: 'Upcoming Live Virtual Classrooms',
    subtitle: 'Interactive instructor-led sessions and workshops',
    colSpan: 2,
    rowSpan: 2,
    visibleForRoles: ['super_admin', 'tenant_admin', 'instructor', 'learner']
  },
  {
    id: 'w-quick-actions-1',
    type: 'quick_actions',
    title: 'Executive LMS Dispatcher',
    subtitle: 'Quick operational actions and escalation alerts',
    colSpan: 2,
    rowSpan: 2,
    visibleForRoles: ['super_admin', 'tenant_admin']
  }
];

export const CATALOG_WIDGET_TEMPLATES: { type: DashboardWidgetType; name: string; description: string; defaultColSpan: 1 | 2 | 3 | 4; defaultRowSpan: 1 | 2 | 3 | 4; icon: string; category: string }[] = [
  {
    type: 'kpi_grid',
    name: 'Dynamic KPI Metrics Grid',
    description: '4-card responsive KPI matrix adapting to active role (Learners, Compliance, Completed, Certificates).',
    defaultColSpan: 4,
    defaultRowSpan: 1,
    icon: 'speed',
    category: 'KPIs & Summary'
  },
  {
    type: 'kpi_highlight',
    name: 'Compliance Health Focus Gauge',
    description: 'High-impact circular radial progress metric displaying tenant target compliance score.',
    defaultColSpan: 1,
    defaultRowSpan: 1,
    icon: 'donut_large',
    category: 'KPIs & Summary'
  },
  {
    type: 'announcement_banner',
    name: 'Broadcast Announcement Banner',
    description: 'Customizable alert banner for tenant-wide announcements, deadlines, or welcome notices.',
    defaultColSpan: 4,
    defaultRowSpan: 1,
    icon: 'campaign',
    category: 'Operational'
  },
  {
    type: 'chart_department_matrix',
    name: 'Department Completion & Compliance Matrix',
    description: 'Detailed horizontal progress bar matrix showing completion rates and overdue counts by department.',
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'bar_chart',
    category: 'Analytics & Charts'
  },
  {
    type: 'chart_enrollment_trends',
    name: 'Enrollment & Completion Velocity Trend',
    description: 'Smooth SVG area chart visualizing monthly cohort enrollment growth and completions.',
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'show_chart',
    category: 'Analytics & Charts'
  },
  {
    type: 'chart_compliance_gauge',
    name: 'Regulatory Compliance vs Risk Breakdown',
    description: 'Visual breakdown of Compliant vs At-Risk vs Overdue learners with percentage indicators.',
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'pie_chart',
    category: 'Analytics & Charts'
  },
  {
    type: 'chart_activity_heatmap',
    name: '7-Day Learning Activity Heatmap',
    description: 'Daily activity heatmap visualizing peak learning hours across the organization.',
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'calendar_view_week',
    category: 'Analytics & Charts'
  },
  {
    type: 'learner_in_progress',
    name: 'In-Progress Learning Path Carousel',
    description: 'Resume active lessons, view progress percentage, and launch interactive course players.',
    defaultColSpan: 3,
    defaultRowSpan: 2,
    icon: 'play_circle',
    category: 'Courseware'
  },
  {
    type: 'escalation_queue',
    name: 'Overdue Compliance Escalation Queue',
    description: 'Personnel roster at risk of missing compliance deadlines with 1-click reminder triggers.',
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'priority_high',
    category: 'Operational'
  },
  {
    type: 'live_audit_feed',
    name: 'Live Tamper-Proof Audit Feed',
    description: 'Real-time security log stream of all tenant actions, certificate issuances, and enrollments.',
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'history_toggle_off',
    category: 'Security & Audit'
  },
  {
    type: 'upcoming_webinars',
    name: 'Upcoming Live Virtual Classrooms',
    description: 'Scheduled instructor webinars, attendee counters, platform badges, and direct Join links.',
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'videocam',
    category: 'Live Sessions'
  },
  {
    type: 'gamification_leaderboard',
    name: 'Skill Mastery Leaderboard & Badges',
    description: 'Top organizational learners ranked by XP points, earned badges, and milestone awards.',
    defaultColSpan: 1,
    defaultRowSpan: 2,
    icon: 'military_tech',
    category: 'Gamification'
  },
  {
    type: 'quick_actions',
    name: 'Executive LMS Dispatcher',
    description: 'Quick-access action hub for sending reminders, adding learners, creating courses, and downloading audit reports.',
    defaultColSpan: 2,
    defaultRowSpan: 1,
    icon: 'bolt',
    category: 'Operational'
  },
  {
    type: 'certificates_ticker',
    name: 'Verified Certificates Issuance Ticker',
    description: 'Live ticker of recently earned tamper-proof credentials with verification codes.',
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'verified',
    category: 'Credentials'
  }
];

@Injectable({
  providedIn: 'root'
})
export class LmsDataService {
  // Core reactive signals
  tenants = signal<Tenant[]>(INITIAL_TENANTS);
  activeTenantId = signal<string>('tenant-brac');
  activeRole = signal<UserRole>('system_admin');

  private router = inject(Router, { optional: true });

  // Role check computed signals
  isSystemAdmin = computed<boolean>(() => {
    const role = this.activeRole();
    return role === 'system_admin' || (role as any) === 'super_admin';
  });

  isOrgAdmin = computed<boolean>(() => {
    const role = this.activeRole();
    return role === 'tenant_admin';
  });

  isLmsAdmin = computed<boolean>(() => {
    const role = this.activeRole();
    return role === 'lms_admin';
  });

  isInstructor = computed<boolean>(() => {
    const role = this.activeRole();
    return role === 'instructor';
  });

  isLearner = computed<boolean>(() => {
    const role = this.activeRole();
    return role === 'learner';
  });
  courses = signal<Course[]>(INITIAL_COURSES);
  users = signal<User[]>(INITIAL_USERS);
  enrollments = signal<CourseEnrollment[]>(INITIAL_ENROLLMENTS);
  certificates = signal<Certificate[]>(INITIAL_CERTIFICATES);
  webinars = signal<LiveWebinar[]>(INITIAL_WEBINARS);
  auditLogs = signal<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Active LMS Instance Signal (LMS Admin switches between LMS instances)
  activeLmsId = signal<string>('LMS-1972-01');

  // Platform Capacity Infra Hardcoded Limits (YYYY values based on infra setup)
  readonly dbTotalInfraGb = 5000;
  readonly fileTotalInfraGb = 20000;

  // Platform Capacity dynamically computed across active organizations
  platformCapacity = computed<PlatformCapacity>(() => {
    const activeOrgs = this.tenants().filter(t => t.status === 'Active');
    
    const dbUsedGb = activeOrgs.reduce((sum, t) => {
      if (t.resourceAllocation?.databaseSizeGb) {
        return sum + t.resourceAllocation.databaseSizeGb;
      }
      return sum + (t.stats?.storageLimitGb ? Math.round(t.stats.storageLimitGb * 0.4) : 200);
    }, 0);

    const fileUsedGb = activeOrgs.reduce((sum, t) => {
      if (t.resourceAllocation?.fileStorageGb) {
        return sum + t.resourceAllocation.fileStorageGb;
      }
      return sum + (t.stats?.storageLimitGb ? t.stats.storageLimitGb : 500);
    }, 0);

    const dbAvailableGb = Math.max(0, this.dbTotalInfraGb - dbUsedGb);
    const fileAvailableGb = Math.max(0, this.fileTotalInfraGb - fileUsedGb);

    return {
      dbTotalGb: this.dbTotalInfraGb,
      dbUsedGb,
      dbAvailableGb,
      fileTotalGb: this.fileTotalInfraGb,
      fileUsedGb,
      fileAvailableGb
    };
  });

  // Organization Drafts Signal for Resuming Creation Flow
  organizationDrafts = signal<OrganizationDraft[]>([
    {
      id: '5194',
      status: 'In-Progress',
      isDraft: true,
      lastCompletedStep: 'basic-info',
      createdAt: '2025-02-18',
      updatedAt: '2025-02-18',
      basicInfo: {
        organizationName: 'Global Cloud Academy',
        organizationId: '5194',
        websiteUrl: 'https://academy.globalcloud.io',
        tagline: 'Multi-Cloud Certification & DevOps Infrastructure Lab',
        description: 'Dedicated enterprise tenant for Azure, AWS, and GCP architect onboarding.',
        organizationEmail: 'operations@globalcloud.io',
        timezone: 'Asia/Dhaka',
        logo: {
          url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80',
          fileName: 'global-cloud-logo.png'
        },
        address: {
          line1: 'Gulshan Center Point, Road 90',
          line2: 'Floor 14, Suite B',
          division: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1212'
        },
        admin: {
          adminName: 'Kamal Hossain',
          contactNumber: '01711223344',
          contactEmail: 'kamal.admin@globalcloud.io'
        }
      },
      resources: {
        databaseSizeGb: 200,
        fileStorageGb: 500,
        usageAlertThresholdPct: 80,
        dataSharingMode: 'Yes – Shared'
      }
    }
  ]);

  // Organization Dashboard Studio Layout State
  orgDashboardLayout = signal<OrgDashboardLayout>(JSON.parse(JSON.stringify(DEFAULT_ORG_DASHBOARD_LAYOUT)));

  // Organization Status Summary Breakdown
  orgStatusSummary = computed(() => {
    const tenants = this.tenants();
    const drafts = this.organizationDrafts();
    const active = tenants.filter(t => t.status === 'Active').length;
    const inProgress = tenants.filter(t => t.status === 'In-Progress').length;
    const suspended = tenants.filter(t => t.status === 'Suspended' || (t.status as any) === 'Trial' || (t.status as any) === 'Inactive').length;
    const draftCount = drafts.length;
    const total = tenants.length + draftCount;

    return {
      total,
      active,
      inProgress,
      suspended,
      draft: draftCount,
      activePct: total > 0 ? Math.round((active / total) * 100) : 0,
      inProgressPct: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      suspendedPct: total > 0 ? Math.round((suspended / total) * 100) : 0,
      draftPct: total > 0 ? Math.round((draftCount / total) * 100) : 0
    };
  });

  // Top Organizations by LMS Instance Count
  topOrganizationsByLms = computed(() => {
    const tenants = this.tenants();
    const lmsList = this.lmsInstances();
    return tenants.map(t => {
      const orgLms = lmsList.filter(l => l.organizationId === t.id);
      return {
        tenant: t,
        lmsCount: orgLms.length,
        activeLmsCount: orgLms.filter(l => l.status === 'Active').length,
        totalStorageGb: t.resourceAllocation?.fileStorageGb || t.stats?.storageLimitGb || 500,
        totalDbGb: t.resourceAllocation?.databaseSizeGb || 200
      };
    }).sort((a, b) => b.lmsCount - a.lmsCount);
  });

  // Organization Admin Directory List
  orgAdminDirectoryList = computed(() => {
    return this.tenants().map(t => ({
      tenantId: t.id,
      tenantNumericId: t.numericId,
      tenantName: t.name,
      tenantLogo: t.branding?.logoUrl,
      adminName: t.adminInfo?.adminName || 'System Admin',
      adminEmail: t.adminInfo?.contactEmail || t.adminEmail,
      contactNumber: t.adminInfo?.contactNumber || 'N/A',
      status: t.status,
      division: t.address?.division || 'N/A',
      district: t.address?.district || '',
      isVerified: true
    }));
  });

  // Timezone Distribution breakdown
  orgTimezoneDistribution = computed(() => {
    const map: Record<string, { timezone: string; count: number; orgNames: string[] }> = {};
    this.tenants().forEach(t => {
      const tz = t.timezone || 'Asia/Dhaka';
      if (!map[tz]) {
        map[tz] = { timezone: tz, count: 0, orgNames: [] };
      }
      map[tz].count++;
      map[tz].orgNames.push(t.name);
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  });

  // Resource Allocation Leaderboard
  orgResourceLeaderboard = computed(() => {
    const totalInfraDb = this.dbTotalInfraGb;
    const totalInfraFile = this.fileTotalInfraGb;
    return this.tenants().map(t => {
      const dbGb = t.resourceAllocation?.databaseSizeGb || 200;
      const fileGb = t.resourceAllocation?.fileStorageGb || 500;
      const threshold = t.resourceAllocation?.usageAlertThresholdPct || 80;
      return {
        tenant: t,
        dbGb,
        fileGb,
        totalGb: dbGb + fileGb,
        dbPctOfInfra: Math.round((dbGb / totalInfraDb) * 100 * 10) / 10,
        filePctOfInfra: Math.round((fileGb / totalInfraFile) * 100 * 10) / 10,
        threshold,
        sharingMode: t.resourceAllocation?.dataSharingMode || 'Yes – Shared'
      };
    }).sort((a, b) => b.totalGb - a.totalGb);
  });

  // Recent Organization Activity Feed
  recentOrgActivityFeed = computed(() => {
    const auditLogs = this.auditLogs();
    const orgEvents: {
      id: string;
      title: string;
      description: string;
      orgName: string;
      timestamp: string;
      type: 'created' | 'activated' | 'deactivated' | 'updated' | 'draft';
      severity: 'info' | 'success' | 'danger' | 'warning';
      actor: string;
    }[] = [];

    // Derive from audit logs that touch organizations / tenants
    auditLogs.forEach(log => {
      const isOrgRelated = log.action.toLowerCase().includes('tenant') || 
                           log.action.toLowerCase().includes('organization') || 
                           log.target.toLowerCase().includes('tenant') ||
                           log.target.toLowerCase().includes('organization');
      if (isOrgRelated) {
        let type: 'created' | 'activated' | 'deactivated' | 'updated' | 'draft' = 'updated';
        if (log.action.toLowerCase().includes('created') || log.action.toLowerCase().includes('provisioned')) {
          type = 'created';
        } else if (log.action.toLowerCase().includes('activated') || (log.action.toLowerCase().includes('status') && log.target.includes('Active'))) {
          type = 'activated';
        } else if (log.action.toLowerCase().includes('suspended') || log.action.toLowerCase().includes('deactivated')) {
          type = 'deactivated';
        } else if (log.action.toLowerCase().includes('draft')) {
          type = 'draft';
        }

        orgEvents.push({
          id: log.id,
          title: log.action,
          description: log.target,
          orgName: log.tenantName || 'Organization',
          timestamp: log.timestamp,
          type,
          severity: log.severity,
          actor: log.actor
        });
      }
    });

    // Add standard historical seed events if audit log has few org entries
    if (orgEvents.length < 5) {
      orgEvents.unshift(
        {
          id: 'org-act-1',
          title: 'Organization created',
          description: 'Global Cloud Academy entered In-Progress status',
          orgName: 'Global Cloud Academy',
          timestamp: '24:08:2026 11:30:15',
          type: 'created',
          severity: 'info',
          actor: 'System Admin'
        },
        {
          id: 'org-act-2',
          title: 'Organization activated',
          description: 'BRAC is activated',
          orgName: 'BRAC',
          timestamp: '24:08:2026 09:14:22',
          type: 'activated',
          severity: 'success',
          actor: 'System Admin'
        },
        {
          id: 'org-act-3',
          title: 'Organization details updated',
          description: 'Lumina Spatial Labs details updated (Branding & SSO)',
          orgName: 'Lumina Spatial Labs',
          timestamp: '23:08:2026 16:45:00',
          type: 'updated',
          severity: 'info',
          actor: 'Aria Vance'
        },
        {
          id: 'org-act-4',
          title: 'Organization activated',
          description: 'Acme Global Enterprise is activated',
          orgName: 'Acme Global Enterprise',
          timestamp: '22:08:2026 14:10:05',
          type: 'activated',
          severity: 'success',
          actor: 'System Admin'
        },
        {
          id: 'org-act-5',
          title: 'Organization deactivated',
          description: 'Innovate AI Labs is deactivated',
          orgName: 'Innovate AI Labs',
          timestamp: '21:08:2026 18:22:40',
          type: 'deactivated',
          severity: 'danger',
          actor: 'System Admin'
        }
      );
    }

    return orgEvents.slice(0, 15);
  });

  // Publish Organization Dashboard
  publishOrgDashboard(widgets: OrgDashboardWidget[], publisherName: string = 'System Admin'): OrgDashboardLayout {
    const current = this.orgDashboardLayout();
    const newVersion = current.version + 1;
    const updated: OrgDashboardLayout = {
      version: newVersion,
      publishedAt: new Date().toISOString(),
      publishedBy: publisherName,
      lastEditedAt: new Date().toISOString(),
      widgets: JSON.parse(JSON.stringify(widgets))
    };
    this.orgDashboardLayout.set(updated);
    this.logAction('Org Dashboard Published', `Dashboard layout published successfully (v${newVersion})`, 'success');
    this.showToast(
      `Organization dashboard layout (v${newVersion}) is now live for all platform users.`,
      'success',
      4500,
      'Layout Published',
      'Live Published'
    );
    return updated;
  }

  // Reset Organization Dashboard
  resetOrgDashboard(): OrgDashboardLayout {
    const defaults: OrgDashboardLayout = {
      version: 1,
      publishedAt: new Date().toISOString(),
      publishedBy: 'System Administrator',
      widgets: JSON.parse(JSON.stringify(DEFAULT_ORG_DASHBOARD_WIDGETS))
    };
    this.orgDashboardLayout.set(defaults);
    this.logAction('Org Dashboard Reset', 'Reset Organization Dashboard layout to factory defaults', 'warning');
    this.showToast('Organization dashboard layout restored to system factory defaults.', 'info', 4000, 'Reset Complete');
    return defaults;
  }

  // Uniform Toast Alert Stack
  toasts = signal<ToastAlert[]>([]);

  // Backwards compatibility computed signal
  currentToast = computed<{ message: string; type: 'success' | 'error' | 'info' } | null>(() => {
    const list = this.toasts();
    if (list.length === 0) return null;
    const last = list[list.length - 1];
    return {
      message: last.message,
      type: last.type === 'warning' ? 'info' : last.type
    };
  });

  // Global Modals Coordinator
  showLayoutModal = signal(false);
  showBackendConsole = signal(false);
  showNewTenantModal = signal(false);
  showSignOutModal = signal(false);

  openLayoutModal() {
    this.closeNavDropdown();
    this.showLayoutModal.set(true);
  }

  closeLayoutModal() {
    this.showLayoutModal.set(false);
  }

  openBackendConsole() {
    this.closeNavDropdown();
    this.showBackendConsole.set(true);
  }

  closeBackendConsole() {
    this.showBackendConsole.set(false);
  }

  openNewTenantModal() {
    this.closeNavDropdown();
    this.showNewTenantModal.set(true);
  }

  closeNewTenantModal() {
    this.showNewTenantModal.set(false);
  }

  openSignOutModal() {
    this.closeNavDropdown();
    this.showSignOutModal.set(true);
  }

  closeSignOutModal() {
    this.showSignOutModal.set(false);
  }

  // Global Unified Dropdown Coordinator across Header and Top-Menu Navigation
  activeNavDropdown = signal<string | null>(null);

  openNavDropdown(id: string) {
    this.activeNavDropdown.set(id);
  }

  closeNavDropdown(id?: string) {
    if (!id || this.activeNavDropdown() === id) {
      this.activeNavDropdown.set(null);
    }
  }

  toggleNavDropdown(id: string) {
    this.activeNavDropdown.set(this.activeNavDropdown() === id ? null : id);
  }

  isNavDropdownOpen(id: string): boolean {
    return this.activeNavDropdown() === id;
  }

  showToast(
    message: string, 
    type: ToastType = 'success', 
    durationMs: number = 4500,
    title?: string,
    badgeText?: string
  ): string {
    const id = `toast-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newToast: ToastAlert = {
      id,
      type,
      message,
      title,
      badgeText,
      durationMs,
      createdAt: Date.now()
    };

    // Keep max 4 toasts visible in stack to prevent viewport clutter
    this.toasts.update(list => [...list.slice(-3), newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, durationMs);
    }
    return id;
  }

  showAlert(
    message: string, 
    type: ToastType = 'info', 
    durationMs: number = 4500,
    title?: string,
    badgeText?: string
  ): string {
    return this.showToast(message, type, durationMs, title, badgeText);
  }

  removeToast(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  clearToast() {
    this.clearAllToasts();
  }

  clearAllToasts() {
    this.toasts.set([]);
  }

  // Generate random unique 4-digit numeric Organization ID
  generateUniqueOrgId(): string {
    const existingIds = new Set<string>();
    this.tenants().forEach(t => {
      if (t.numericId) existingIds.add(t.numericId);
    });
    this.organizationDrafts().forEach(d => {
      if (d.id) existingIds.add(d.id);
      if (d.basicInfo?.organizationId) existingIds.add(d.basicInfo.organizationId);
    });

    let generated = '';
    let attempts = 0;
    do {
      generated = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    } while (existingIds.has(generated) && attempts < 1000);

    return generated;
  }

  // Save or update organization draft
  saveOrganizationDraft(draft: OrganizationDraft): OrganizationDraft {
    const existingIndex = this.organizationDrafts().findIndex(d => d.id === draft.id);
    const updatedDraft: OrganizationDraft = {
      ...draft,
      isDraft: true,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (existingIndex >= 0) {
      this.organizationDrafts.update(list => {
        const copy = [...list];
        copy[existingIndex] = updatedDraft;
        return copy;
      });
    } else {
      this.organizationDrafts.update(list => [updatedDraft, ...list]);
    }

    this.logAction('Organization Draft Saved', `Saved draft for organization "${draft.basicInfo.organizationName || draft.id}" at step ${draft.lastCompletedStep}`, 'info');
    return updatedDraft;
  }

  // Get draft by ID
  getOrganizationDraft(id?: string): OrganizationDraft | undefined {
    if (!id) {
      return this.organizationDrafts()[0];
    }
    return this.organizationDrafts().find(d => d.id === id);
  }

  // Delete draft
  deleteOrganizationDraft(id: string) {
    this.organizationDrafts.update(list => list.filter(d => d.id !== id));
    this.logAction('Organization Draft Removed', `Deleted draft ID ${id}`, 'info');
  }

  // Finalize Creation: Create Organization in In-Progress status
  createOrganizationFromWizard(draft: OrganizationDraft): Tenant {
    const slug = draft.basicInfo.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `org-${draft.id}`;
    const domain = draft.basicInfo.websiteUrl 
      ? draft.basicInfo.websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '') 
      : `${slug}.lmscloud.io`;

    const newTenant: Tenant = {
      id: `tenant-${slug}`,
      numericId: draft.id || draft.basicInfo.organizationId || this.generateUniqueOrgId(),
      name: draft.basicInfo.organizationName,
      slug,
      domain,
      websiteUrl: draft.basicInfo.websiteUrl || `https://${domain}`,
      plan: 'Enterprise',
      status: 'In-Progress', // As specified: created with In-Progress status
      isDraft: false,
      timezone: draft.basicInfo.timezone || 'Asia/Dhaka',
      description: draft.basicInfo.description || draft.basicInfo.tagline || '',
      address: draft.basicInfo.address,
      adminInfo: draft.basicInfo.admin,
      resourceAllocation: {
        databaseSizeGb: draft.resources.databaseSizeGb || 100,
        fileStorageGb: draft.resources.fileStorageGb || 250,
        usageAlertThresholdPct: draft.resources.usageAlertThresholdPct || 80,
        dataSharingMode: draft.resources.dataSharingMode || 'Yes – Shared',
        customBatches: draft.resources.customBatches
      },
      branding: {
        primaryColor: '#EC008C', // 100% Pantone Magenta (BRAC Pink Standard)
        accentColor: '#C40072',  // Deep Magenta Complement
        tagline: draft.basicInfo.tagline || 'Excellence in Enterprise Skill Mastery',
        bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        logoUrl: draft.basicInfo.logo?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        customCssEnabled: true,
        ssoProvider: 'Okta'
      },
      departments: ['Leadership', 'Operations', 'Compliance', 'General Staff'],
      stats: {
        seatLimit: 1000,
        seatsUsed: 1,
        totalCourses: 2,
        totalLearners: 1,
        completionRate: 0,
        complianceRate: 100,
        storageUsedGb: 0.5,
        storageLimitGb: draft.resources.fileStorageGb || 250
      },
      createdAt: new Date().toISOString().split('T')[0],
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      adminEmail: draft.basicInfo.admin.contactEmail || `admin@${domain}`,
      features: {
        scormSupport: true,
        aiTutor: true,
        liveWebinars: true,
        customCertificates: true,
        whiteLabel: true,
        customDomain: true
      }
    };

    // Add new tenant
    this.tenants.update(list => [newTenant, ...list]);

    // Create Organization Admin user (Side effect cross-story hook)
    const adminUser: User = {
      id: `usr-org-admin-${newTenant.numericId}`,
      tenantId: newTenant.id,
      name: draft.basicInfo.admin.adminName || 'Organization Admin',
      email: draft.basicInfo.admin.contactEmail,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      role: 'tenant_admin',
      department: 'Executive Administration',
      enrolledCourses: [],
      completedCourses: [],
      earnedCertificates: [],
      points: 1000,
      badges: ['Organization Admin', 'Founding Member'],
      lastActive: 'Just now',
      status: 'Active',
      complianceStatus: 'Compliant'
    };
    this.users.update(list => [adminUser, ...list]);

    // Clean up draft if this was created from a draft
    if (draft.id) {
      this.deleteOrganizationDraft(draft.id);
    }

    this.logAction(
      'Organization Created',
      `Organization "${newTenant.name}" (ID: ${newTenant.numericId}) created under In-Progress status`,
      'success'
    );

    return newTenant;
  }

  // =========================================================================
  // LMS INSTANCE LIFECYCLE & CAPACITY MANAGEMENT (§4.1, §6.3, §6.4, §8)
  // =========================================================================
  lmsInstances = signal<LmsInstance[]>(INITIAL_LMS_INSTANCES);
  lmsDrafts = signal<LmsDraft[]>(INITIAL_LMS_DRAFTS);

  // LMS Instances scoped to the active organization (§0, §1)
  activeOrgLmsInstances = computed<LmsInstance[]>(() => {
    const currentOrgId = this.activeTenantId();
    return this.lmsInstances().filter(l => l.organizationId === currentOrgId);
  });

  // Currently active LMS instance computed (Theming and Layouting is mapped to this LMS)
  activeLms = computed<LmsInstance>(() => {
    const list = this.lmsInstances();
    const current = list.find(l => l.id === this.activeLmsId());
    if (current) return current;
    const orgLms = this.activeOrgLmsInstances();
    return orgLms[0] || list[0];
  });

  // LMS Drafts scoped to the active organization
  activeOrgLmsDrafts = computed<LmsDraft[]>(() => {
    const currentOrgId = this.activeTenantId();
    return this.lmsDrafts().filter(d => d.organizationId === currentOrgId);
  });

  // Organization-level capacity snapshot (§4.1)
  // Bounded by the active Organization's own allocated capacity, not platform-wide capacity!
  activeOrgCapacitySnapshot = computed<OrganizationCapacitySnapshot>(() => {
    const org = this.activeTenant();
    const existingLms = this.activeOrgLmsInstances();

    // YYYY = Total DB & File Storage allocated to this Organization
    const dbTotalGb = org.resourceAllocation?.databaseSizeGb || (org.stats?.storageLimitGb ? Math.round(org.stats.storageLimitGb * 0.4) : 500);
    const fileTotalGb = org.resourceAllocation?.fileStorageGb || org.stats?.storageLimitGb || 1000;

    // XXX = Amount already allocated to existing LMS instances under this Organization
    const dbUsedGb = existingLms.reduce((sum, lms) => sum + (lms.resources.databaseSizeGb || 0), 0);
    const fileUsedGb = existingLms.reduce((sum, lms) => sum + (lms.resources.fileStorageGb || 0), 0);

    // DB & File Available = (YYYY - XXX) GB
    const dbAvailableGb = Math.max(0, dbTotalGb - dbUsedGb);
    const fileAvailableGb = Math.max(0, fileTotalGb - fileUsedGb);

    return {
      dbTotalGb,
      dbUsedGb,
      dbAvailableGb,
      fileTotalGb,
      fileUsedGb,
      fileAvailableGb
    };
  });

  // LMS Dashboard Studio Layout State
  lmsDashboardLayout = signal<LmsDashboardLayout>(JSON.parse(JSON.stringify(DEFAULT_LMS_DASHBOARD_LAYOUT)));

  // LMS Status Breakdown scoped to active Organization (Active, Under Processing, Drafted, Deactivated)
  lmsStatusSummary = computed(() => {
    const instances = this.activeOrgLmsInstances();
    const drafts = this.activeOrgLmsDrafts();
    const active = instances.filter(l => l.status === 'Active').length;
    const underProcessing = instances.filter(l => l.status === 'Under Processing').length;
    const drafted = instances.filter(l => l.status === 'Drafted').length + drafts.length;
    const deactivated = instances.filter(l => l.status === 'Deactivated').length;
    const total = instances.length + drafts.length;

    return {
      total,
      active,
      underProcessing,
      drafted,
      deactivated,
      activePct: total > 0 ? Math.round((active / total) * 100) : 0,
      underProcessingPct: total > 0 ? Math.round((underProcessing / total) * 100) : 0,
      draftedPct: total > 0 ? Math.round((drafted / total) * 100) : 0,
      deactivatedPct: total > 0 ? Math.round((deactivated / total) * 100) : 0
    };
  });

  // Recent LMS Activity Feed for the active Organization
  recentLmsActivityFeed = computed(() => {
    const currentOrgId = this.activeTenantId();
    const currentOrgName = this.activeTenant().name;
    const auditLogs = this.auditLogs();
    const instances = this.activeOrgLmsInstances();
    
    const events: {
      id: string;
      title: string;
      description: string;
      lmsName: string;
      lmsId?: string;
      timestamp: string;
      type: 'created' | 'activated' | 'deactivated' | 'updated' | 'draft';
      severity: 'info' | 'success' | 'danger' | 'warning';
      actor: string;
    }[] = [];

    // Derive from audit logs matching LMS
    auditLogs.forEach(log => {
      const isLmsRelated = log.action.toLowerCase().includes('lms') || log.target.toLowerCase().includes('lms');
      if (isLmsRelated && (log.tenantId === currentOrgId || !log.tenantId)) {
        let type: 'created' | 'activated' | 'deactivated' | 'updated' | 'draft' = 'updated';
        if (log.action.toLowerCase().includes('created') || log.action.toLowerCase().includes('provisioned')) {
          type = 'created';
        } else if (log.action.toLowerCase().includes('activated')) {
          type = 'activated';
        } else if (log.action.toLowerCase().includes('deactivated')) {
          type = 'deactivated';
        } else if (log.action.toLowerCase().includes('draft')) {
          type = 'draft';
        }

        events.push({
          id: log.id,
          title: log.action,
          description: log.target,
          lmsName: log.target.split(' ')[0] || 'LMS Portal',
          timestamp: log.timestamp,
          type,
          severity: log.severity,
          actor: log.actor
        });
      }
    });

    // Provide contextual live-seeded events using exact strings from specs
    if (events.length < 4 && instances.length > 0) {
      instances.slice(0, 4).forEach((lms, idx) => {
        if (lms.status === 'Active') {
          events.push({
            id: `lms-evt-act-${lms.id}`,
            title: `${lms.basicInfo.lmsName} is activated`,
            description: `Activated on ${lms.updatedAt || lms.createdAt} for ${lms.basicInfo.programmeDepartment}`,
            lmsName: lms.basicInfo.lmsName,
            lmsId: lms.id,
            timestamp: lms.updatedAt || lms.createdAt,
            type: 'activated',
            severity: 'success',
            actor: 'System / Org Admin'
          });
        } else if (lms.status === 'Under Processing') {
          events.push({
            id: `lms-evt-proc-${lms.id}`,
            title: `${lms.basicInfo.lmsName} created — Under Processing`,
            description: `Provisioning pipeline initiated (${lms.provisioningProgress || 25}% complete)`,
            lmsName: lms.basicInfo.lmsName,
            lmsId: lms.id,
            timestamp: lms.createdAt,
            type: 'created',
            severity: 'warning',
            actor: 'LMS Provisioner'
          });
        }
      });
    }

    return events.slice(0, 10);
  });

  // Top LMS Instances Snapshot for active organization
  topLmsInstancesSnapshot = computed(() => {
    const list = this.activeOrgLmsInstances();
    return [...list].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;
      return dateB - dateA;
    }).slice(0, 4);
  });

  // Programme / Department Distribution
  lmsProgrammeDistribution = computed(() => {
    const instances = this.activeOrgLmsInstances();
    const map: Record<string, { programme: string; count: number; activeCount: number }> = {};
    
    instances.forEach(lms => {
      const dept = lms.basicInfo.programmeDepartment || 'General Administration';
      if (!map[dept]) {
        map[dept] = { programme: dept, count: 0, activeCount: 0 };
      }
      map[dept].count++;
      if (lms.status === 'Active') {
        map[dept].activeCount++;
      }
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  });

  // LMS Administrator Roster for the active organization
  lmsAdminRoster = computed(() => {
    const instances = this.activeOrgLmsInstances();
    const roster: {
      adminName: string;
      email: string;
      contactNumber?: string;
      lmsCount: number;
      lmsNames: string[];
      invitationStatus: string;
    }[] = [];

    const map = new Map<string, { adminName: string; email: string; contactNumber?: string; lmsCount: number; lmsNames: string[]; invitationStatus: string }>();

    instances.forEach(lms => {
      lms.admins.forEach(admin => {
        const key = admin.email.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            adminName: admin.name,
            email: admin.email,
            contactNumber: admin.contactNumber,
            lmsCount: 1,
            lmsNames: [lms.basicInfo.lmsName],
            invitationStatus: admin.invitationStatus || 'accepted'
          });
        } else {
          const item = map.get(key)!;
          item.lmsCount++;
          item.lmsNames.push(lms.basicInfo.lmsName);
        }
      });
    });

    return Array.from(map.values());
  });

  // Publish LMS Dashboard
  publishLmsDashboard(widgets: LmsDashboardWidget[], publisherName: string = 'Organization Administrator'): LmsDashboardLayout {
    const current = this.lmsDashboardLayout();
    const newVersion = current.version + 1;
    const updated: LmsDashboardLayout = {
      version: newVersion,
      publishedAt: new Date().toISOString(),
      publishedBy: publisherName,
      lastEditedAt: new Date().toISOString(),
      widgets: JSON.parse(JSON.stringify(widgets))
    };
    this.lmsDashboardLayout.set(updated);
    this.logAction('LMS Dashboard Published', `LMS dashboard layout published successfully (v${newVersion})`, 'success');
    this.showToast(
      `LMS dashboard layout (v${newVersion}) is now live.`,
      'success',
      4500,
      'Layout Published',
      'Live Published'
    );
    return updated;
  }

  // Reset LMS Dashboard
  resetLmsDashboard(): LmsDashboardLayout {
    const defaults: LmsDashboardLayout = {
      version: 1,
      publishedAt: new Date().toISOString(),
      publishedBy: 'Organization Administrator',
      widgets: JSON.parse(JSON.stringify(DEFAULT_LMS_DASHBOARD_WIDGETS))
    };
    this.lmsDashboardLayout.set(defaults);
    this.logAction('LMS Dashboard Reset', 'Reset LMS Dashboard layout to factory defaults', 'warning');
    this.showToast('LMS dashboard layout restored to system factory defaults.', 'info', 4000, 'Reset Complete');
    return defaults;
  }

  // Generate unique LMS ID within platform/organization (§6.3)
  generateUniqueLmsId(orgNumericId?: string): string {
    const orgPrefix = orgNumericId || this.activeTenant().numericId || 'ORG';
    const existingIds = new Set<string>();
    this.lmsInstances().forEach(l => existingIds.add(l.id));
    this.lmsDrafts().forEach(d => existingIds.add(d.id));

    let generated = '';
    let attempts = 0;
    do {
      const suffix = Math.floor(10 + Math.random() * 90).toString();
      generated = `LMS-${orgPrefix}-${suffix}`;
      attempts++;
    } while (existingIds.has(generated) && attempts < 1000);

    return generated;
  }

  // Get dynamic configured departments/programmes for an organization (§3.1.1)
  getOrganizationDepartments(orgId?: string): string[] {
    const targetId = orgId || this.activeTenantId();
    const org = this.tenants().find(t => t.id === targetId);
    const defaultList = ['Microfinance', 'Procurement', 'Health', 'Education & Youth Skills', 'Ultra-Poor Graduation', 'Climate Change & Disaster Management', 'Engineering', 'Leadership', 'General Administration'];
    
    if (org && org.departments && org.departments.length > 0) {
      // Merge unique
      const merged = Array.from(new Set([...org.departments, ...defaultList]));
      return merged;
    }
    return defaultList;
  }

  // Add custom department/programme to an organization
  addOrganizationDepartment(department: string, orgId?: string) {
    const targetId = orgId || this.activeTenantId();
    this.tenants.update(list => list.map(t => {
      if (t.id === targetId) {
        const existing = t.departments || [];
        if (!existing.includes(department)) {
          return { ...t, departments: [...existing, department] };
        }
      }
      return t;
    }));
  }

  // Save or update LMS draft (§3.2, §4.3, §5.3, §6.2)
  saveLmsDraft(draft: LmsDraft): LmsDraft {
    const existingIndex = this.lmsDrafts().findIndex(d => d.id === draft.id);
    const updatedDraft: LmsDraft = {
      ...draft,
      isDraft: true,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (existingIndex >= 0) {
      this.lmsDrafts.update(list => {
        const copy = [...list];
        copy[existingIndex] = updatedDraft;
        return copy;
      });
    } else {
      this.lmsDrafts.update(list => [updatedDraft, ...list]);
    }

    this.logAction(
      'LMS Draft Saved',
      `Saved draft for LMS "${draft.basicInfo.lmsName || draft.id}" under ${draft.organizationName} at step ${draft.lastCompletedStep}`,
      'info'
    );
    return updatedDraft;
  }

  // Get LMS draft by ID
  getLmsDraft(id?: string): LmsDraft | undefined {
    if (!id) {
      return this.lmsDrafts()[0];
    }
    return this.lmsDrafts().find(d => d.id === id);
  }

  // Delete LMS draft
  deleteLmsDraft(id: string) {
    this.lmsDrafts.update(list => list.filter(d => d.id !== id));
    this.logAction('LMS Draft Removed', `Deleted LMS draft ID ${id}`, 'info');
  }

  // Finalize Creation: Create LMS in "Under Processing" status (§6.3, §6.4)
  createLmsFromWizard(draft: LmsDraft): LmsInstance {
    const org = this.activeTenant();
    const lmsId = draft.id.startsWith('LMS-DRAFT-') 
      ? this.generateUniqueLmsId(org.numericId)
      : (draft.id || this.generateUniqueLmsId(org.numericId));

    const newLms: LmsInstance = {
      id: lmsId,
      organizationId: org.id,
      organizationNumericId: org.numericId,
      organizationName: org.name,
      status: 'Under Processing', // CRITICAL: LMS is always created in "Under Processing" status (never Active on creation)
      isDraft: false,
      provisioningProgress: 25, // Initial provisioning state
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      basicInfo: {
        lmsName: draft.basicInfo.lmsName || 'New LMS Instance',
        programmeDepartment: draft.basicInfo.programmeDepartment || 'General Administration',
        summary: draft.basicInfo.summary || '',
        goal: draft.basicInfo.goal || '',
        lmsType: draft.basicInfo.lmsType || 'Private',
        urlDomain: draft.basicInfo.urlDomain || `${draft.basicInfo.lmsName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'lms'}.${org.domain}`,
        timezone: draft.basicInfo.timezone || org.timezone || 'Asia/Dhaka',
        logo: draft.basicInfo.logo
      },
      resources: {
        databaseSizeGb: draft.resources.databaseSizeGb || 50,
        fileStorageGb: draft.resources.fileStorageGb || 100,
        usageAlertThresholdPct: draft.resources.usageAlertThresholdPct || 80
      },
      admins: draft.admins && draft.admins.length > 0 ? draft.admins : [
        {
          name: org.adminInfo?.adminName || 'LMS Administrator',
          email: org.adminInfo?.contactEmail || 'admin@' + org.domain,
          contactNumber: org.adminInfo?.contactNumber || '01710000000',
          role: 'LMS Admin',
          invitationStatus: 'pending'
        }
      ]
    };

    // Prepend to LMS list
    this.lmsInstances.update(list => [newLms, ...list]);

    // Create LMS Admin user record (cross-story dependency hook §9.1)
    if (newLms.admins && newLms.admins.length > 0) {
      newLms.admins.forEach((admin, idx) => {
        const adminUser: User = {
          id: `usr-lms-admin-${newLms.id}-${idx + 1}`,
          tenantId: org.id,
          name: admin.name,
          email: admin.email,
          phone: admin.contactNumber,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          role: 'tenant_admin',
          department: newLms.basicInfo.programmeDepartment,
          title: `LMS Admin – ${newLms.basicInfo.lmsName}`,
          enrolledCourses: [],
          completedCourses: [],
          earnedCertificates: [],
          points: 500,
          badges: ['LMS Admin'],
          lastActive: 'Just now',
          status: 'Invited',
          complianceStatus: 'Compliant'
        };
        this.users.update(uList => [adminUser, ...uList]);
      });
    }

    // Clean up draft if this was created from a draft
    if (draft.id) {
      this.deleteLmsDraft(draft.id);
    }

    this.logAction(
      'LMS Instance Created',
      `LMS "${newLms.basicInfo.lmsName}" (ID: ${newLms.id}) created under ${org.name} with status "Under Processing"`,
      'success'
    );

    return newLms;
  }

  // Hook to simulate activation of an LMS instance (§6.4, §9.4)
  activateLmsInstance(lmsId: string): boolean {
    const target = this.lmsInstances().find(l => l.id === lmsId);
    if (!target) return false;

    this.lmsInstances.update(list => list.map(lms => {
      if (lms.id === lmsId) {
        return {
          ...lms,
          status: 'Active',
          provisioningProgress: 100,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return lms;
    }));

    this.logAction(
      'LMS Instance Activated',
      `LMS "${target.basicInfo.lmsName}" (ID: ${lmsId}) is activated`,
      'success'
    );
    return true;
  }

  // Update an existing LMS instance with validation (§4.2, §4.3)
  updateLmsInstance(lmsId: string, updatedData: Partial<LmsInstance>): { success: boolean; error?: string } {
    const currentList = this.lmsInstances();
    const existing = currentList.find(l => l.id === lmsId);
    if (!existing) {
      return { success: false, error: 'LMS instance not found' };
    }

    // Check LMS name uniqueness within organization if changed
    if (updatedData.basicInfo?.lmsName && updatedData.basicInfo.lmsName.trim() !== existing.basicInfo.lmsName) {
      const isUnique = this.isLmsNameUniqueInOrg(updatedData.basicInfo.lmsName.trim(), existing.organizationId, lmsId);
      if (!isUnique) {
        return { success: false, error: `An LMS instance named "${updatedData.basicInfo.lmsName}" already exists in this organization.` };
      }
    }

    // Check domain uniqueness within organization if changed
    if (updatedData.basicInfo?.urlDomain && updatedData.basicInfo.urlDomain.trim() !== existing.basicInfo.urlDomain) {
      const isDomainUnique = this.isLmsDomainUniqueInOrg(updatedData.basicInfo.urlDomain.trim(), existing.organizationId, lmsId);
      if (!isDomainUnique) {
        return { success: false, error: `The domain "${updatedData.basicInfo.urlDomain}" is already in use by another LMS instance.` };
      }
    }

    const mergedInstance: LmsInstance = {
      ...existing,
      ...updatedData,
      id: existing.id, // ID is strictly immutable
      organizationId: existing.organizationId, // Immutable
      organizationNumericId: existing.organizationNumericId,
      organizationName: existing.organizationName,
      createdAt: existing.createdAt, // Immutable
      updatedAt: new Date().toISOString().split('T')[0],
      basicInfo: {
        ...existing.basicInfo,
        ...(updatedData.basicInfo || {})
      },
      resources: {
        ...existing.resources,
        ...(updatedData.resources || {})
      },
      admins: updatedData.admins || existing.admins
    };

    this.lmsInstances.update(list => list.map(l => l.id === lmsId ? mergedInstance : l));

    this.logAction(
      'LMS Details Updated',
      `Updated configuration for LMS "${mergedInstance.basicInfo.lmsName}" (${lmsId})`,
      'info'
    );

    return { success: true };
  }

  // Check if LMS name is unique within the given Organization
  isLmsNameUniqueInOrg(name: string, orgId?: string, excludeLmsId?: string): boolean {
    const targetOrgId = orgId || this.activeTenantId();
    const cleanName = name.toLowerCase().trim();
    return !this.lmsInstances().some(l => 
      l.organizationId === targetOrgId &&
      l.id !== excludeLmsId &&
      l.basicInfo.lmsName.toLowerCase().trim() === cleanName
    );
  }

  // Check if LMS domain is unique within the given Organization
  isLmsDomainUniqueInOrg(domain: string, orgId?: string, excludeLmsId?: string): boolean {
    const targetOrgId = orgId || this.activeTenantId();
    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '');
    return !this.lmsInstances().some(l => 
      l.organizationId === targetOrgId &&
      l.id !== excludeLmsId &&
      l.basicInfo.urlDomain.toLowerCase().trim().replace(/^https?:\/\//, '') === cleanDomain
    );
  }

  // Get list of distinct LMS Admins for the specified or active organization
  getOrgLmsAdmins(orgId?: string): { name: string; email: string; contactNumber?: string }[] {
    const targetOrgId = orgId || this.activeTenantId();
    const orgLms = this.lmsInstances().filter(l => l.organizationId === targetOrgId);
    const map = new Map<string, { name: string; email: string; contactNumber?: string }>();

    orgLms.forEach(lms => {
      lms.admins.forEach(admin => {
        if (admin.name && admin.email) {
          map.set(admin.email.toLowerCase(), {
            name: admin.name,
            email: admin.email,
            contactNumber: admin.contactNumber
          });
        }
      });
    });

    return Array.from(map.values());
  }

  // Trigger notice email to LMS admin
  sendLmsAdminNoticeEmail(contactEmail: string, adminName: string, lmsName: string): boolean {
    this.logAction(
      'LMS Admin Setup Notice Email Dispatched',
      `Sent "LMS Setup Under Processing" notification email to ${adminName} (${contactEmail}) for ${lmsName}`,
      'info'
    );
    return true;
  }

  // Trigger notice email to organization admin
  sendAdminSetupNoticeEmail(contactEmail: string, adminName: string, orgName: string): boolean {
    this.logAction(
      'Admin Setup Notice Email Dispatched',
      `Sent "organization creation is in progress" update email to ${adminName} (${contactEmail}) for ${orgName}`,
      'info'
    );
    return true;
  }

  // Admin Layout Preferences Signal
  adminLayoutPreferences = signal<AdminLayoutPreferences>({
    navigationMode: 'sidebar', // 'sidebar' | 'top_menu' | 'compact_rail'
    headerDensity: 'comfortable', // 'comfortable' | 'compact'
    showBreadcrumbs: true,
    stickyHeader: true,
    contentWidth: 'fluid',
    accentMode: 'brand'
  });

  // Multi-Tenant Customizable Dashboards Store
  tenantDashboards = signal<Record<string, CustomTenantDashboard>>({
    'tenant-brac': {
      tenantId: 'tenant-brac',
      isPublished: true,
      publishedAt: '2025-02-20 09:00 AM',
      publishedBy: 'Farhana Ahmed (Chief Learning Officer)',
      version: 1,
      widgets: JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS))
    },
    'tenant-lumina': {
      tenantId: 'tenant-lumina',
      isPublished: true,
      publishedAt: '2025-02-22 11:00 AM',
      publishedBy: 'Aria Vance (Chief Spatial Architect)',
      version: 1,
      widgets: JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS))
    },
    'tenant-acme': {
      tenantId: 'tenant-acme',
      isPublished: true,
      publishedAt: '2025-02-18 10:30 AM',
      publishedBy: 'Clara Oswald (Tenant Admin)',
      version: 1,
      widgets: JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS))
    },
    'tenant-stanford': {
      tenantId: 'tenant-stanford',
      isPublished: true,
      publishedAt: '2025-02-15 02:15 PM',
      publishedBy: 'Provost Admin',
      version: 1,
      widgets: JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS))
    },
    'tenant-apexhealth': {
      tenantId: 'tenant-apexhealth',
      isPublished: true,
      publishedAt: '2025-02-10 09:00 AM',
      publishedBy: 'Dr. Sarah Jenkins',
      version: 1,
      widgets: JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS))
    },
    'tenant-finedge': {
      tenantId: 'tenant-finedge',
      isPublished: true,
      publishedAt: '2025-02-12 11:45 AM',
      publishedBy: 'Victoria Sterling',
      version: 1,
      widgets: JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS))
    }
  });

  // Active Tenant Dashboard Computed
  activeTenantDashboard = computed<CustomTenantDashboard>(() => {
    const tenantId = this.activeTenantId();
    const dashboards = this.tenantDashboards();
    if (dashboards[tenantId]) {
      return dashboards[tenantId];
    }
    return {
      tenantId,
      isPublished: false,
      publishedAt: 'Not published yet',
      publishedBy: 'System Default',
      version: 1,
      widgets: JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS))
    };
  });

  // Search & Filter state
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedDepartment = signal<string>('All');

  // Currently active tenant computed
  activeTenant = computed<Tenant>(() => {
    const list = this.tenants();
    const current = list.find(t => t.id === this.activeTenantId());
    return current || list[0];
  });

  // Currently active user based on activeTenant, activeLms, and activeRole
  activeUser = computed<User>(() => {
    const currentTenantId = this.activeTenantId();
    const currentRole = this.activeRole();
    const currentLms = this.activeLms();
    const tenantUsers = this.users().filter(u => u.tenantId === currentTenantId);

    // Look for matching user role in tenant
    const matched = tenantUsers.find(u => u.role === currentRole);
    if (matched) return matched;

    if (currentRole === 'system_admin' || (currentRole as any) === 'super_admin') {
      return {
        id: 'usr-system-admin',
        tenantId: 'global',
        name: 'Alexandre Sterling',
        email: 'systemadmin@omnilearn-cloud.io',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        role: 'system_admin',
        department: 'Global Platform Operations',
        enrolledCourses: [],
        completedCourses: [],
        earnedCertificates: [],
        points: 9999,
        badges: ['System Admin', 'Platform Architect'],
        lastActive: 'Just now',
        status: 'Active',
        complianceStatus: 'Compliant'
      };
    }

    if (currentRole === 'lms_admin' || (currentRole as any) === 'tenant_admin') {
      const lmsAdmin = currentLms?.admins?.[0];
      return {
        id: `usr-lms-admin-${currentLms?.id || 'default'}`,
        tenantId: currentTenantId,
        name: lmsAdmin?.name || 'Tanvir Hossain',
        email: lmsAdmin?.email || 'tanvir.admin@brac-mf.lmscloud.io',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        role: 'lms_admin',
        department: currentLms?.basicInfo?.programmeDepartment || 'Executive Management',
        enrolledCourses: [],
        completedCourses: [],
        earnedCertificates: [],
        points: 1200,
        badges: ['LMS Admin', 'Portal Director'],
        lastActive: 'Just now',
        status: 'Active',
        complianceStatus: 'Compliant'
      };
    }

    // Default fallback
    return tenantUsers[0] || {
      id: 'usr-default',
      tenantId: currentTenantId,
      name: 'Default User',
      email: 'user@tenant.io',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: currentRole,
      department: 'General',
      enrolledCourses: [],
      completedCourses: [],
      earnedCertificates: [],
      points: 500,
      badges: [],
      lastActive: 'Just now',
      status: 'Active',
      complianceStatus: 'Compliant'
    };
  });

  // Filtered courses for active tenant
  tenantCourses = computed<Course[]>(() => {
    const tenantId = this.activeTenantId();
    const role = this.activeRole();
    const all = this.courses();

    // If system admin, they can see all courses or filter
    if (role === 'system_admin' || (role as any) === 'super_admin') {
      return all;
    }
    return all.filter(c => c.tenantId === tenantId || c.tenantId === 'global');
  });

  // Filtered users for active tenant
  tenantUsers = computed<User[]>(() => {
    const tenantId = this.activeTenantId();
    const role = this.activeRole();
    if (role === 'system_admin' || (role as any) === 'super_admin') {
      return this.users();
    }
    return this.users().filter(u => u.tenantId === tenantId);
  });

  // Filtered certificates for active tenant
  tenantCertificates = computed<Certificate[]>(() => {
    const tenantId = this.activeTenantId();
    const role = this.activeRole();
    if (role === 'system_admin' || (role as any) === 'super_admin') {
      return this.certificates();
    }
    return this.certificates().filter(c => c.tenantId === tenantId);
  });

  // Department metrics for active tenant
  departmentMetrics = computed<DepartmentMetric[]>(() => {
    const tenant = this.activeTenant();
    const users = this.tenantUsers();
    
    return tenant.departments.map(dept => {
      const deptUsers = users.filter(u => u.department === dept);
      const learnersCount = deptUsers.length;
      const overdueCount = deptUsers.filter(u => u.complianceStatus === 'Overdue').length;
      const compliantCount = deptUsers.filter(u => u.complianceStatus === 'Compliant').length;
      const complianceRate = learnersCount > 0 ? Math.round((compliantCount / learnersCount) * 100) : 100;
      
      const avgCompletionRate = learnersCount > 0 
        ? Math.round(deptUsers.reduce((sum, u) => sum + (u.completedCourses.length > 0 ? 100 : 45), 0) / learnersCount) 
        : 85;

      return {
        department: dept,
        learnersCount: learnersCount || 1,
        avgCompletionRate,
        complianceRate,
        overdueCount
      };
    });
  });

  constructor() {
    // Dynamic CSS theme and favicon injection effect:
    // Theming & layouting setup is STRICTLY dependent on the LMS and mapped with LMS
    effect(() => {
      const lms = this.activeLms();
      if (lms && lms.branding) {
        this.applyTenantTheme(
          lms.branding.primaryColor,
          lms.branding.accentColor,
          lms.branding.faviconUrl,
          lms.basicInfo.lmsName,
          lms.branding.themePreset
        );
        if (lms.layoutPreferences) {
          this.adminLayoutPreferences.set({ ...lms.layoutPreferences });
        }
      }
    });
  }

  // Switch tenant / organization (System Admin only)
  switchTenant(tenantId: string) {
    if (!this.isSystemAdmin()) {
      this.showToast('Only System Administrators can switch between organizations.', 'warning', 3500, 'Access Restricted');
      return;
    }

    this.activeTenantId.set(tenantId);
    // When switching organization, auto-select its first LMS instance
    const orgLms = this.lmsInstances().filter(l => l.organizationId === tenantId);
    if (orgLms.length > 0) {
      this.activeLmsId.set(orgLms[0].id);
      if (orgLms[0].layoutPreferences) {
        this.adminLayoutPreferences.set({ ...orgLms[0].layoutPreferences });
      }
    }
    this.logAction('Organization Switch', `Switched active organization to: ${this.activeTenant().name}`, 'info');
    this.showToast(`Switched active organization to "${this.activeTenant().name}"`, 'info', 3000, 'Organization Switched');
  }

  // Switch active LMS portal (LMS Admin switches between their org's LMS instances; System Admin can switch between all LMS instances)
  switchLms(lmsId: string) {
    const targetLms = this.lmsInstances().find(l => l.id === lmsId);
    if (!targetLms) return;

    // Non-system admins can only switch between LMS instances belonging to their active organization
    if (!this.isSystemAdmin() && targetLms.organizationId !== this.activeTenantId()) {
      this.showToast('LMS Admins can only switch between LMS portals in their assigned organization.', 'warning', 3500, 'Access Restricted');
      return;
    }

    this.activeLmsId.set(lmsId);
    
    // Sync organization if the LMS belongs to a different organization (for System Admin)
    if (targetLms.organizationId !== this.activeTenantId()) {
      this.activeTenantId.set(targetLms.organizationId);
    }

    // Apply LMS-mapped layout preferences
    if (targetLms.layoutPreferences) {
      this.adminLayoutPreferences.set({ ...targetLms.layoutPreferences });
    }

    // Apply LMS-mapped branding
    if (targetLms.branding) {
      this.applyTenantTheme(
        targetLms.branding.primaryColor,
        targetLms.branding.accentColor,
        targetLms.branding.faviconUrl,
        targetLms.basicInfo.lmsName,
        targetLms.branding.themePreset
      );
    }

    this.logAction('LMS Switch', `Switched active LMS portal to: ${targetLms.basicInfo.lmsName} (${targetLms.id})`, 'info');
    this.showToast(`Switched active LMS portal to "${targetLms.basicInfo.lmsName}"`, 'info', 3500, 'LMS Portal Switched');
  }

  // Update branding mapped to a specific LMS instance
  updateLmsBranding(lmsId: string, brandingChanges: Partial<TenantBranding>) {
    this.lmsInstances.update(list => list.map(lms => {
      if (lms.id === lmsId) {
        const currentBranding = lms.branding || {
          primaryColor: '#EC008C',
          accentColor: '#C40072',
          tagline: lms.basicInfo.summary || '',
          bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
          logoUrl: lms.basicInfo.logo?.url || '',
          customCssEnabled: true,
          themePreset: 'solid',
          ssoProvider: 'Okta'
        };
        return {
          ...lms,
          branding: {
            ...currentBranding,
            ...brandingChanges
          },
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return lms;
    }));

    if (this.activeLmsId() === lmsId) {
      const active = this.activeLms();
      if (active && active.branding) {
        this.applyTenantTheme(
          active.branding.primaryColor,
          active.branding.accentColor,
          active.branding.faviconUrl,
          active.basicInfo.lmsName,
          active.branding.themePreset
        );
      }
    }

    this.logAction('LMS Branding Updated', `Updated branding for LMS portal ID: ${lmsId}`, 'info');
    this.showToast('LMS portal branding & theme updated successfully', 'success', 4000, 'Branding Saved');
  }

  // Update layout preferences mapped to a specific LMS instance
  updateLmsLayoutPreferences(lmsId: string, prefs: Partial<AdminLayoutPreferences>) {
    this.lmsInstances.update(list => list.map(lms => {
      if (lms.id === lmsId) {
        const currentPrefs = lms.layoutPreferences || {
          navigationMode: 'sidebar',
          headerDensity: 'comfortable',
          showBreadcrumbs: true,
          stickyHeader: true,
          contentWidth: 'fluid',
          accentMode: 'brand'
        };
        return {
          ...lms,
          layoutPreferences: {
            ...currentPrefs,
            ...prefs
          },
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return lms;
    }));

    if (this.activeLmsId() === lmsId) {
      this.adminLayoutPreferences.update(cur => ({ ...cur, ...prefs }));
    }
  }

  // Route authorization checker for RBAC
  isRouteAllowedForRole(url: string, role: UserRole): boolean {
    const cleanPath = url.split('?')[0].split('#')[0].replace(/^\//, '');
    
    // System admin / super admin has unrestricted access to all routes
    if (role === 'system_admin' || (role as string) === 'super_admin') {
      return true;
    }

    // Role-specific restrictions:
    // 1. Organization creation & all organizations list are strictly System Admin
    if (cleanPath === 'tenants' || cleanPath.startsWith('tenants/create') || cleanPath.startsWith('organization/create')) {
      return false;
    }

    // 2. Org dashboard is for System Admin and Org Admin (tenant_admin)
    if (cleanPath.startsWith('organization/dashboard') || cleanPath.startsWith('tenants/dashboard')) {
      return role === 'tenant_admin';
    }

    // 3. LMS Creation & editing is for System Admin and Org Admin (Org Admin provisions LMS under their Org)
    if (cleanPath.startsWith('lms/create') || cleanPath.startsWith('lms/edit')) {
      return role === 'tenant_admin';
    }

    // 4. Settings / theming is for System Admin, Org Admin, and LMS Admin
    if (cleanPath.startsWith('settings')) {
      return role === 'tenant_admin' || role === 'lms_admin';
    }

    // 5. Analytics & LMS Management is for System Admin, Org Admin, and LMS Admin
    if (cleanPath.startsWith('analytics') || cleanPath === 'lms' || cleanPath.startsWith('lms/dashboard')) {
      return role === 'tenant_admin' || role === 'lms_admin';
    }

    // 6. Plan creation/edit is for System Admin, Org Admin, LMS Admin, and Instructor
    if (cleanPath.startsWith('plans/create') || cleanPath.startsWith('plans/edit')) {
      return role === 'tenant_admin' || role === 'lms_admin' || role === 'instructor';
    }

    // 7. Plan list/details/dashboard & users is for System Admin, Org Admin, LMS Admin, and Instructor
    if (cleanPath.startsWith('plans') || cleanPath.startsWith('users')) {
      return role === 'tenant_admin' || role === 'lms_admin' || role === 'instructor';
    }

    // 8. General routes (dashboard, courses, certificates, webinars, profile) are allowed for all (including learner)
    return true;
  }

  // Switch active role preview & enforce route authorization
  switchRole(role: UserRole) {
    this.activeRole.set(role);
    const roleLabels: Record<string, string> = {
      system_admin: 'System Admin',
      super_admin: 'System Admin',
      tenant_admin: 'Org Admin',
      lms_admin: 'LMS Admin',
      instructor: 'Instructor',
      learner: 'Learner'
    };
    const roleName = roleLabels[role] || role;
    this.logAction('Role Switch', `Switched active view mode to: ${roleName}`, 'info');
    this.showToast(`Switched active view mode to "${roleName.toUpperCase()}"`, 'info', 3000, 'Role Switched', 'RBAC');

    // If current route is restricted for newly active role, immediately redirect to /dashboard
    if (this.router) {
      const currentUrl = this.router.url;
      if (!this.isRouteAllowedForRole(currentUrl, role)) {
        this.showToast(
          `Access Restricted: "${roleName}" cannot access this page. Redirecting to Dashboard.`,
          'warning',
          4000,
          'Route Restricted',
          'GUARD'
        );
        this.router.navigate(['/dashboard']);
      }
    }
  }

  // Apply tenant branding CSS custom properties, glassmorphism theme classes, and dynamic favicon
  applyTenantTheme(
    primary: string,
    accent?: string,
    customFavicon?: string,
    tenantName?: string,
    themePreset?: 'solid' | 'glassmorphism' | 'neumorphic'
  ) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const cleanPrimary = (primary && primary.startsWith('#')) ? primary : '#EC008C';
    const cleanAccent = (accent && accent.startsWith('#')) ? accent : this.adjustColor(cleanPrimary, -25);
    
    const hoverColor = this.adjustColor(cleanPrimary, -18);
    const darkColor = this.adjustColor(cleanPrimary, -38);
    const lightHoverColor = this.adjustColor(cleanPrimary, 20);

    // Primary & accents
    root.style.setProperty('--tenant-primary', cleanPrimary);
    root.style.setProperty('--tenant-primary-hover', hoverColor);
    root.style.setProperty('--tenant-primary-dark', darkColor);
    root.style.setProperty('--tenant-accent', cleanAccent);
    root.style.setProperty('--brand-primary', cleanPrimary);
    root.style.setProperty('--brand-secondary', cleanAccent);

    // Dynamic Gradients mapped directly to the primary and accent colors
    root.style.setProperty('--tenant-gradient', `linear-gradient(135deg, ${cleanPrimary} 0%, ${cleanAccent} 100%)`);
    root.style.setProperty('--tenant-gradient-hover', `linear-gradient(135deg, ${lightHoverColor} 0%, ${hoverColor} 100%)`);
    root.style.setProperty('--tenant-gradient-subtle', `linear-gradient(135deg, ${this.hexToRgba(cleanPrimary, 0.12)} 0%, ${this.hexToRgba(cleanAccent, 0.05)} 100%)`);
    root.style.setProperty('--tenant-gradient-radial', `radial-gradient(circle at 10% 20%, ${cleanPrimary} 0%, ${cleanAccent} 90%)`);

    // Dynamic button & card shadows based on current primary color
    root.style.setProperty('--tenant-shadow', `0 4px 14px 0 ${this.hexToRgba(cleanPrimary, 0.35)}`);
    root.style.setProperty('--tenant-shadow-hover', `0 6px 20px 0 ${this.hexToRgba(cleanPrimary, 0.48)}`);

    // Tints
    root.style.setProperty('--tenant-50', this.hexToRgba(cleanPrimary, 0.08));
    root.style.setProperty('--tenant-100', this.hexToRgba(cleanPrimary, 0.18));
    root.style.setProperty('--tenant-200', this.getHighContrastLightTint(cleanPrimary, 0.88));
    root.style.setProperty('--tenant-300', this.getHighContrastLightTint(cleanPrimary, 0.78));
    root.style.setProperty('--tenant-400', this.getHighContrastLightTint(cleanPrimary, 0.68));

    // Handle Theme Presets: Glassmorphism vs Solid
    if (themePreset === 'glassmorphism') {
      root.classList.add('theme-glassmorphism');
    } else {
      root.classList.remove('theme-glassmorphism');
    }

    this.updateFavicon(cleanPrimary, cleanAccent, customFavicon, tenantName);
  }

  private updateFavicon(primary: string, accent: string, customFaviconUrl?: string, tenantName?: string) {
    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }

      if (customFaviconUrl && !customFaviconUrl.includes('unsplash.com')) {
        link.type = 'image/x-icon';
        link.href = customFaviconUrl;
        return;
      }

      // Generate dynamic SVG favicon tinted with active tenant brand primary & accent
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
        <defs>
          <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stop-color='${primary}'/>
            <stop offset='100%' stop-color='${accent}'/>
          </linearGradient>
        </defs>
        <rect width='64' height='64' rx='16' fill='#0f172a'/>
        <path d='M32 14 L52 24 L32 34 L12 24 Z' fill='url(#g)'/>
        <path d='M20 30 L20 42 C20 47 44 47 44 42 L44 30 L32 36 Z' fill='url(#g)' opacity='0.85'/>
        <path d='M50 25 L50 38' stroke='${accent}' stroke-width='2.5' stroke-linecap='round'/>
        <circle cx='50' cy='39' r='2.5' fill='${accent}'/>
        <circle cx='32' cy='24' r='3.5' fill='#ffffff'/>
      </svg>`;

      link.type = 'image/svg+xml';
      link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    } catch (e) {
      // ignore DOM error in non-browser context
    }
  }

  private getHighContrastLightTint(hex: string, targetLightness: number = 0.85): string {
    try {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      const r = ((num >> 16) & 255) / 255;
      const g = ((num >> 8) & 255) / 255;
      const b = (num & 255) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      // Reconstruct with target lightness and controlled saturation for perfect dark mode readability
      const finalS = Math.min(s, 0.85);
      const finalL = targetLightness;

      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = finalL < 0.5 ? finalL * (1 + finalS) : finalL + finalS - finalL * finalS;
      const p = 2 * finalL - q;
      const outR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
      const outG = Math.round(hue2rgb(p, q, h) * 255);
      const outB = Math.round(hue2rgb(p, q, h - 1/3) * 255);

      const toHex = (x: number) => {
        const hStr = x.toString(16);
        return hStr.length === 1 ? '0' + hStr : hStr;
      };
      return `#${toHex(outR)}${toHex(outG)}${toHex(outB)}`;
    } catch {
      return '#c7d2fe';
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    try {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch {
      return `rgba(236, 0, 140, ${alpha})`;
    }
  }

  private adjustColor(color: string, amount: number): string {
    try {
      let c = color.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      let r = (num >> 16) + amount;
      let g = ((num >> 8) & 255) + amount;
      let b = (num & 255) + amount;

      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));

      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return color;
    }
  }

  // Add new tenant
  addTenant(newTenant: Partial<Tenant>): Tenant {
    const id = `tenant-${newTenant.slug || 'org-' + Date.now()}`;
    const tenant: Tenant = {
      id,
      name: newTenant.name || 'New Organization Academy',
      slug: newTenant.slug || 'new-org',
      domain: newTenant.domain || `${newTenant.slug}.lmscloud.io`,
      plan: newTenant.plan || 'Starter',
      status: 'Active',
      adminEmail: newTenant.adminEmail || 'admin@neworg.io',
      createdAt: new Date().toISOString().split('T')[0],
      renewalDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      branding: {
        primaryColor: newTenant.branding?.primaryColor || '#EC008C', // 100% Pantone Magenta (BRAC Pink Standard)
        accentColor: newTenant.branding?.accentColor || '#C40072',
        tagline: newTenant.branding?.tagline || 'Custom Enterprise Learning Experience',
        bannerUrl: newTenant.branding?.bannerUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        logoUrl: newTenant.branding?.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        customCssEnabled: true,
        ssoProvider: newTenant.branding?.ssoProvider || 'None'
      },
      departments: newTenant.departments && newTenant.departments.length > 0 
        ? newTenant.departments 
        : ['Engineering', 'Marketing', 'Sales', 'Operations'],
      stats: {
        seatLimit: newTenant.stats?.seatLimit || 500,
        seatsUsed: 1,
        totalCourses: 2,
        totalLearners: 1,
        completionRate: 0,
        complianceRate: 100,
        storageUsedGb: 5.0,
        storageLimitGb: 200
      },
      features: {
        scormSupport: true,
        aiTutor: true,
        liveWebinars: true,
        customCertificates: true,
        whiteLabel: newTenant.plan === 'Enterprise',
        customDomain: true
      }
    };

    this.tenants.update(list => [tenant, ...list]);
    this.activeTenantId.set(tenant.id);
    this.logAction('Tenant Provisioned', `New tenant created: ${tenant.name} (${tenant.plan} Plan)`, 'success');
    return tenant;
  }

  // Update existing tenant settings & branding
  updateTenant(updatedTenant: Tenant) {
    this.tenants.update(list => list.map(t => t.id === updatedTenant.id ? updatedTenant : t));
    this.logAction('Tenant Settings Updated', `Updated branding & config for ${updatedTenant.name}`, 'info');
  }

  // Toggle tenant status
  toggleTenantStatus(tenantId: string) {
    this.tenants.update(list => list.map(t => {
      if (t.id === tenantId) {
        const nextStatus = t.status === 'Active' ? 'Suspended' : 'Active';
        this.logAction('Tenant Status Changed', `${t.name} status updated to ${nextStatus}`, nextStatus === 'Active' ? 'success' : 'danger');
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  }

  // Add course
  addCourse(newCourse: Partial<Course>): Course {
    const tenantId = this.activeRole() === 'super_admin' ? (newCourse.tenantId || 'global') : this.activeTenantId();
    const course: Course = {
      id: `course-${Date.now()}`,
      tenantId,
      title: newCourse.title || 'Untitled Course',
      subtitle: newCourse.subtitle || '',
      description: newCourse.description || '',
      coverImage: newCourse.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      category: newCourse.category || 'Engineering',
      level: newCourse.level || 'Beginner',
      durationMinutes: newCourse.durationMinutes || 60,
      isMandatory: newCourse.isMandatory || false,
      complianceDeadlineDays: newCourse.complianceDeadlineDays,
      instructorName: newCourse.instructorName || this.activeUser().name,
      instructorTitle: newCourse.instructorTitle || 'Course Instructor',
      instructorAvatar: newCourse.instructorAvatar || this.activeUser().avatar,
      rating: 5.0,
      reviewCount: 1,
      enrolledCount: 0,
      certificateEnabled: newCourse.certificateEnabled ?? true,
      status: 'Published',
      tags: newCourse.tags || ['Training'],
      createdAt: new Date().toISOString().split('T')[0],
      targetDepartments: newCourse.targetDepartments || this.activeTenant().departments,
      modules: newCourse.modules || [
        {
          id: `mod-${Date.now()}-1`,
          title: 'Module 1: Introduction & Fundamentals',
          durationMinutes: 30,
          lessons: [
            {
              id: `les-${Date.now()}-1`,
              title: '1.1 Course Overview & Key Objectives',
              type: 'article',
              durationMinutes: 10,
              summary: 'Welcome to this comprehensive course. Review objectives and roadmap.',
              contentHtml: '<p class="text-text-secondary">Welcome to this course module. Complete all lessons and knowledge checks to earn your verified certificate.</p>'
            }
          ]
        }
      ]
    };

    this.courses.update(list => [course, ...list]);
    this.logAction('Course Created', `New course published: ${course.title}`, 'success');
    return course;
  }

  // Enroll in course
  enrollInCourse(courseId: string, userId: string): CourseEnrollment {
    const existing = this.enrollments().find(e => e.courseId === courseId && e.userId === userId);
    if (existing) return existing;

    const newEnrollment: CourseEnrollment = {
      id: `enr-${Date.now()}`,
      tenantId: this.activeTenantId(),
      userId,
      courseId,
      progressPercent: 0,
      completedLessonIds: [],
      quizScores: {},
      status: 'in_progress',
      startedAt: new Date().toISOString()
    };

    this.enrollments.update(list => [newEnrollment, ...list]);
    
    // Update user enrolled courses
    this.users.update(list => list.map(u => {
      if (u.id === userId && !u.enrolledCourses.includes(courseId)) {
        return { ...u, enrolledCourses: [...u.enrolledCourses, courseId] };
      }
      return u;
    }));

    // Increment course enrolled count
    this.courses.update(list => list.map(c => {
      if (c.id === courseId) {
        return { ...c, enrolledCount: c.enrolledCount + 1 };
      }
      return c;
    }));

    this.logAction('Course Enrolled', `User enrolled in course (${courseId})`, 'info');
    return newEnrollment;
  }

  // Mark lesson completed and update progress / certificate trigger
  completeLesson(courseId: string, lessonId: string, userId: string, quizScore?: number) {
    let enrollment = this.enrollments().find(e => e.courseId === courseId && e.userId === userId);
    if (!enrollment) {
      enrollment = this.enrollInCourse(courseId, userId);
    }

    const course = this.courses().find(c => c.id === courseId);
    if (!course) return;

    // Total lessons count
    let allLessons: string[] = [];
    course.modules.forEach(m => m.lessons.forEach(l => allLessons.push(l.id)));
    const totalLessons = allLessons.length;

    const completedIds = Array.from(new Set([...enrollment.completedLessonIds, lessonId]));
    const progressPercent = Math.min(100, Math.round((completedIds.length / totalLessons) * 100));
    const isCompleted = progressPercent === 100;

    const updatedQuizScores = { ...enrollment.quizScores };
    if (quizScore !== undefined) {
      updatedQuizScores[lessonId] = quizScore;
    }

    this.enrollments.update(list => list.map(e => {
      if (e.id === enrollment!.id) {
        return {
          ...e,
          completedLessonIds: completedIds,
          progressPercent,
          quizScores: updatedQuizScores,
          status: isCompleted ? 'completed' : 'in_progress',
          completedAt: isCompleted ? new Date().toISOString() : e.completedAt
        };
      }
      return e;
    }));

    // If 100% completed, award certificate and user points
    if (isCompleted && !this.certificates().some(c => c.courseId === courseId && c.userId === userId)) {
      this.issueCertificate(course, userId);
    }
  }

  // Issue dynamic certificate
  issueCertificate(course: Course, userId: string): Certificate {
    const user = this.users().find(u => u.id === userId) || this.activeUser();
    const tenant = this.activeTenant();

    const certId = `cert-${Date.now().toString().slice(-5)}`;
    const verificationCode = `${tenant.slug.slice(0, 3).toUpperCase()}-${course.category.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newCert: Certificate = {
      id: certId,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantLogo: tenant.branding.logoUrl,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      courseId: course.id,
      courseTitle: course.title,
      category: course.category,
      issuedDate: new Date().toISOString().split('T')[0],
      verificationCode,
      gradeScore: 98,
      instructorName: course.instructorName,
      expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    this.certificates.update(list => [newCert, ...list]);

    // Update user achievements
    this.users.update(list => list.map(u => {
      if (u.id === userId) {
        const completedCourses = Array.from(new Set([...u.completedCourses, course.id]));
        const earnedCertificates = Array.from(new Set([...u.earnedCertificates, certId]));
        const newPoints = u.points + 250;
        return {
          ...u,
          completedCourses,
          earnedCertificates,
          points: newPoints,
          complianceStatus: 'Compliant'
        };
      }
      return u;
    }));

    this.logAction('Certificate Issued', `Earned verified certificate for "${course.title}" (${verificationCode})`, 'success');
    return newCert;
  }

  // Add user to tenant
  addUser(newUser: Partial<User>): User {
    const tenantId = newUser.tenantId || this.activeTenantId();
    const user: User = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      tenantId,
      name: newUser.name || 'New Learner',
      email: newUser.email || 'learner@domain.io',
      avatar: newUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: newUser.role || 'learner',
      department: newUser.department || this.activeTenant().departments[0] || 'General',
      enrolledCourses: [],
      completedCourses: [],
      earnedCertificates: [],
      points: 100,
      badges: ['Welcome'],
      lastActive: 'Just now',
      status: 'Active',
      complianceStatus: 'Compliant'
    };

    this.users.update(list => [user, ...list]);
    
    // Update tenant seat stats
    this.tenants.update(list => list.map(t => {
      if (t.id === tenantId) {
        return {
          ...t,
          stats: {
            ...t.stats,
            seatsUsed: Math.min(t.stats.seatLimit, t.stats.seatsUsed + 1),
            totalLearners: t.stats.totalLearners + 1
          }
        };
      }
      return t;
    }));

    this.logAction('User Invited', `Added user: ${user.name} (${user.email}) -> ${user.department}`, 'success');
    return user;
  }

  // Trigger automated compliance reminder
  sendComplianceReminders(department?: string): number {
    const overdueUsers = this.tenantUsers().filter(u => 
      u.complianceStatus === 'Overdue' || u.complianceStatus === 'At Risk'
    );
    const count = department ? overdueUsers.filter(u => u.department === department).length : overdueUsers.length;
    this.logAction('Compliance Reminders Dispatched', `Sent automated email notifications to ${count} personnel at risk`, 'warning');
    return count;
  }

  // Schedule Live Webinar
  addWebinar(newWebinar: Partial<LiveWebinar>): LiveWebinar {
    const webinar: LiveWebinar = {
      id: `web-${Date.now().toString().slice(-5)}`,
      tenantId: this.activeTenantId(),
      title: newWebinar.title || 'Live Virtual Classroom',
      description: newWebinar.description || 'Live instructor session',
      instructor: newWebinar.instructor || this.activeUser().name,
      instructorAvatar: newWebinar.instructorAvatar || this.activeUser().avatar,
      scheduledAt: newWebinar.scheduledAt || new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: newWebinar.durationMinutes || 60,
      attendeeCount: 1,
      maxAttendees: newWebinar.maxAttendees || 250,
      platform: newWebinar.platform || 'Built-in WebRTC',
      status: 'Upcoming',
      joinUrl: '#'
    };

    this.webinars.update(list => [webinar, ...list]);
    this.logAction('Webinar Scheduled', `Live session created: "${webinar.title}"`, 'info');
    return webinar;
  }

  // Log system actions
  logAction(action: string, target: string, severity: 'info' | 'warning' | 'success' | 'danger') {
    const tenant = this.activeTenant();
    const user = this.activeUser();
    const newLog: AuditLog = {
      id: `log-${Date.now().toString().slice(-6)}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      actor: user.name,
      actorRole: user.role === 'system_admin' || (user.role as any) === 'super_admin' ? 'System Admin' : (user.role === 'lms_admin' || (user.role as any) === 'tenant_admin') ? 'LMS Admin' : user.role,
      action,
      target,
      timestamp: 'Just now',
      severity,
      ipAddress: '192.168.1.1'
    };

    this.auditLogs.update(list => [newLog, ...list.slice(0, 49)]);
  }

  // Update Admin Layout Preferences (Mapped with active LMS)
  updateLayoutPreferences(prefs: Partial<AdminLayoutPreferences>) {
    this.adminLayoutPreferences.update(current => ({
      ...current,
      ...prefs
    }));
    const currentLmsId = this.activeLmsId();
    if (currentLmsId) {
      this.updateLmsLayoutPreferences(currentLmsId, prefs);
    }
    this.logAction('Layout Customization Changed', `Switched layout to navigation mode: ${prefs.navigationMode || this.adminLayoutPreferences().navigationMode}`, 'info');
  }

  // Publish / Save Custom Tenant Dashboard
  publishTenantDashboard(tenantId: string, widgets: DashboardWidget[], publishedByName?: string): CustomTenantDashboard {
    const user = this.activeUser();
    const current = this.tenantDashboards()[tenantId];
    const newVersion = current ? current.version + 1 : 1;

    const published: CustomTenantDashboard = {
      tenantId,
      isPublished: true,
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      publishedBy: publishedByName || `${user.name} (${user.role === 'super_admin' ? 'Super Admin' : 'Tenant Admin'})`,
      version: newVersion,
      widgets: JSON.parse(JSON.stringify(widgets))
    };

    this.tenantDashboards.update(map => ({
      ...map,
      [tenantId]: published
    }));

    this.logAction('Custom Dashboard Published', `Published v${newVersion} dashboard layout with ${widgets.length} modular widgets for tenant ${this.activeTenant().name}`, 'success');
    this.showToast(
      `Tenant dashboard layout (v${newVersion}) has been published successfully.`,
      'success',
      4500,
      'Dashboard Published',
      'Live Published'
    );
    return published;
  }

  // Reset Tenant Dashboard to standard default widgets
  resetTenantDashboard(tenantId: string): CustomTenantDashboard {
    const user = this.activeUser();
    const defaults: CustomTenantDashboard = {
      tenantId,
      isPublished: true,
      publishedAt: 'Reset to System Default',
      publishedBy: user.name,
      version: 1,
      widgets: JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS))
    };

    this.tenantDashboards.update(map => ({
      ...map,
      [tenantId]: defaults
    }));

    this.logAction('Dashboard Reset', `Reset dashboard layout to factory template for ${this.activeTenant().name}`, 'warning');
    this.showToast(
      `Tenant dashboard layout has been reset to system factory defaults.`,
      'info',
      4000,
      'Reset Complete'
    );
    return defaults;
  }

  // Update a user by ID
  updateUser(userId: string, changes: Partial<User>) {
    this.users.update(list => list.map(u => {
      if (u.id === userId) {
        return { ...u, ...changes };
      }
      return u;
    }));
    this.logAction('User Profile Updated', `Updated profile information for user ${userId}`, 'info');
  }

  // Update current active user's profile
  updateActiveUserProfile(changes: Partial<User>) {
    const current = this.activeUser();
    this.updateUser(current.id, changes);
  }

  // Log out or reset session simulation
  logout() {
    this.logAction('User Sign Out', `User ${this.activeUser().name} signed out of session`, 'info');
  }

  // =========================================================================
  // PLAN MANAGEMENT & LIFECYCLE (OneLMS Hierarchy: Org -> LMS -> Plan -> Phase)
  // =========================================================================
  plans = signal<Plan[]>(INITIAL_PLANS);

  // Plans scoped to the currently active LMS workspace context
  activeLmsPlans = computed<Plan[]>(() => {
    const currentLmsId = this.activeLmsId();
    return this.plans().filter(p => p.lmsId === currentLmsId);
  });

  // Get specific plan by ID
  getPlan(planId: string): Plan | undefined {
    return this.plans().find(p => p.id === planId);
  }

  // Get phases for a specific plan
  getPlanPhases(planId: string): Phase[] {
    const plan = this.getPlan(planId);
    return plan?.phases || [];
  }

  // Assign Plan Owner (§7 - LMS Admin action, single owner per plan)
  assignPlanOwner(planId: string, owner: PlanOwner): { success: boolean; error?: string } {
    const plan = this.getPlan(planId);
    if (!plan) {
      return { success: false, error: 'Plan not found.' };
    }

    if (!owner.name || !owner.name.trim()) {
      return { success: false, error: 'Plan Owner name is mandatory.' };
    }

    if (!owner.email || !owner.email.trim()) {
      return { success: false, error: 'Plan Owner email is mandatory.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(owner.email.trim())) {
      return { success: false, error: 'Invalid email address format.' };
    }

    if (owner.contactNumber && owner.contactNumber.trim()) {
      const phoneRegex = /^01[3-9]\d{8}$/;
      if (!phoneRegex.test(owner.contactNumber.trim())) {
        return { success: false, error: 'Contact number must be 11 digits starting with 013-019.' };
      }
    }

    const todayStr = formatDateDDMMYYYY(new Date());
    const currentUser = this.activeUser();

    const updatedOwner: PlanOwner = {
      userId: owner.userId || null,
      name: owner.name.trim(),
      email: owner.email.trim(),
      contactNumber: owner.contactNumber ? owner.contactNumber.trim() : undefined,
      assignedAt: todayStr,
      assignedBy: currentUser.name || 'LMS Admin',
      invitationStatus: 'accepted'
    };

    this.plans.update(list => list.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          owner: updatedOwner,
          updatedDate: todayStr
        };
      }
      return p;
    }));

    this.logAction(
      'Plan Owner Assigned',
      `Assigned "${updatedOwner.name}" (${updatedOwner.email}) as Plan Owner for "${plan.name}" (${plan.planCode})`,
      'success'
    );

    this.showToast(
      `Plan Owner "${updatedOwner.name}" assigned successfully.`,
      'success',
      4500,
      'Plan Owner Assigned',
      'OWNER ASSIGNED'
    );

    return { success: true };
  }

  // Edit / Update Plan details (§10)
  updatePlan(planId: string, changes: Partial<Plan>): { success: boolean; errors?: string[] } {
    const existing = this.getPlan(planId);
    if (!existing) {
      return { success: false, errors: ['Plan not found.'] };
    }

    // Archived plans are locked
    if (existing.status === 'Archived') {
      return { success: false, errors: ['Archived Plans are not editable through standard operations.'] };
    }

    const merged: Plan = {
      ...existing,
      ...changes,
      // Immutable properties
      id: existing.id,
      planCode: existing.planCode,
      lmsId: existing.lmsId,
      organizationId: existing.organizationId,
      createdDate: existing.createdDate,
      createdBy: existing.createdBy,
      status: existing.status
    };

    // Validate integrity and date constraints
    const validation = validatePlanAndPhases(merged, changes.phases || existing.phases);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const todayStr = formatDateDDMMYYYY(new Date());
    merged.updatedDate = todayStr;
    merged.phaseCount = merged.phases ? merged.phases.length : existing.phaseCount;

    this.plans.update(list => list.map(p => p.id === planId ? merged : p));

    this.logAction(
      'Plan Updated',
      `Updated plan details for "${merged.name}" (${merged.planCode})`,
      'info'
    );

    this.showToast(
      'Plan details updated successfully.',
      'success',
      4500,
      'Plan Updated',
      'SAVED'
    );

    return { success: true };
  }

  // Activate Plan (§11: Published -> Active)
  activatePlan(planId: string): { success: boolean; errors?: string[] } {
    const plan = this.getPlan(planId);
    if (!plan) {
      return { success: false, errors: ['Plan not found.'] };
    }

    if (plan.status !== 'Published') {
      return { success: false, errors: [`Plan must be in "Published" status to activate. Current status: ${plan.status}.`] };
    }

    const errors: string[] = [];

    if (!plan.owner || !plan.owner.name || !plan.owner.email) {
      errors.push('Plan must have an assigned Plan Owner before activation.');
    }

    const phases = plan.phases || [];
    if (phases.length === 0) {
      errors.push('Required Phase structure is missing. A Plan must have at least one Phase before activation.');
    }

    const integrity = validatePlanAndPhases(plan, phases);
    if (!integrity.isValid) {
      errors.push(...integrity.errors);
    }

    if (errors.length > 0) {
      this.showToast(
        'Cannot activate Plan. Critical validation conditions are incomplete.',
        'error',
        5000,
        'Activation Blocked'
      );
      return { success: false, errors };
    }

    const todayStr = formatDateDDMMYYYY(new Date());

    this.plans.update(list => list.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          status: 'Active',
          updatedDate: todayStr,
          capabilities: {
            ...p.capabilities,
            canEdit: true,
            canAssignOwner: true,
            canActivate: false,
            canArchive: true,
            protectedFields: ['startDate', 'endDate', 'durationType']
          }
        };
      }
      return p;
    }));

    this.logAction(
      'Plan Activated',
      `Activated Plan "${plan.name}" (${plan.planCode}) for LMS ${plan.lmsId}`,
      'success'
    );

    this.showToast(
      `${plan.name} is activated`,
      'success',
      4500,
      'Plan Activated',
      'ACTIVE'
    );

    return { success: true };
  }

  // Archive Plan (§12)
  archivePlan(planId: string): { success: boolean; error?: string } {
    const plan = this.getPlan(planId);
    if (!plan) {
      return { success: false, error: 'Plan not found.' };
    }

    if (plan.status === 'Archived') {
      return { success: false, error: 'Plan is already archived.' };
    }

    const todayStr = formatDateDDMMYYYY(new Date());

    this.plans.update(list => list.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          status: 'Archived',
          updatedDate: todayStr,
          capabilities: {
            canEdit: false,
            canAssignOwner: false,
            canActivate: false,
            canArchive: false,
            protectedFields: ['*']
          }
        };
      }
      return p;
    }));

    this.logAction(
      'Plan Archived',
      `Archived Plan "${plan.name}" (${plan.planCode})`,
      'warning'
    );

    this.showToast(
      'Plan archived successfully.',
      'info',
      4500,
      'Plan Archived',
      'ARCHIVED'
    );

    return { success: true };
  }

  // =========================================================================
  // PHASE MANAGEMENT & PHASE CREATION FLOW (§0 - §13 OneLMS Phase Spec)
  // =========================================================================
  phaseDrafts = signal<Record<string, any>>({});

  savePhaseDraft(draft: any) {
    this.phaseDrafts.update(m => ({ ...m, [draft.id]: draft }));
    this.logAction('Phase Draft Saved', `Saved draft for Phase "${draft.basicInfo?.name || draft.id}"`, 'info');
  }

  getPhaseDraft(id: string): any {
    return this.phaseDrafts()[id];
  }

  // Add new Phase to a Plan
  addPhaseToPlan(planId: string, phaseData: Partial<Phase>, silent = false): { success: boolean; phase?: Phase; error?: string } {
    const plan = this.getPlan(planId);
    if (!plan) {
      return { success: false, error: 'Parent Plan not found.' };
    }

    const currentPhases = plan.phases || [];
    const newSeq = phaseData.sequence || (currentPhases.length + 1);
    const newId = phaseData.id || `PHASE-${plan.planCode || 'PLAN'}-${String(newSeq).padStart(2, '0')}`;

    const newPhase: Phase = {
      id: newId,
      planId: plan.id,
      name: phaseData.name || `Phase ${newSeq}`,
      sequence: newSeq,
      startDate: phaseData.startDate || plan.startDate,
      endDate: phaseData.endDate || plan.endDate,
      status: phaseData.status || 'Draft',
      courseCount: phaseData.assignedCourses ? phaseData.assignedCourses.length : (phaseData.courseCount || 0),
      taskCount: phaseData.taskCount || 0,
      deliveryClassCount: phaseData.deliveryClassCount || 0,
      prerequisiteStatus: phaseData.prerequisiteStatus || 'None',
      certificateBadgeStatus: phaseData.certificateBadgeStatus || 'None',
      description: phaseData.description || '',
      assignedCourses: phaseData.assignedCourses || []
    };

    const updatedPhases = [...currentPhases, newPhase].sort((a, b) => a.sequence - b.sequence);
    const todayStr = formatDateDDMMYYYY(new Date());

    this.plans.update(list => list.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          phases: updatedPhases,
          phaseCount: updatedPhases.length,
          updatedDate: todayStr
        };
      }
      return p;
    }));

    this.logAction(
      'Phase Created',
      `Created Phase "${newPhase.name}" (#${newPhase.sequence}) under Plan "${plan.name}"`,
      'success'
    );

    if (!silent) {
      this.showToast(
        `Phase "${newPhase.name}" created successfully.`,
        'success',
        4500,
        'Phase Created',
        'SAVED'
      );
    }

    return { success: true, phase: newPhase };
  }

  // Update existing Phase in Plan
  updatePhaseInPlan(planId: string, phaseId: string, phaseData: Partial<Phase>, silent = false): { success: boolean; phase?: Phase; error?: string } {
    const plan = this.getPlan(planId);
    if (!plan) {
      return { success: false, error: 'Parent Plan not found.' };
    }

    const currentPhases = plan.phases || [];
    const existingIndex = currentPhases.findIndex(ph => ph.id === phaseId);
    if (existingIndex === -1) {
      return { success: false, error: 'Phase not found in this Plan.' };
    }

    const updatedPhase: Phase = {
      ...currentPhases[existingIndex],
      ...phaseData,
      id: phaseId,
      planId: plan.id
    };

    const updatedPhases = currentPhases.map(ph => ph.id === phaseId ? updatedPhase : ph).sort((a, b) => a.sequence - b.sequence);
    const todayStr = formatDateDDMMYYYY(new Date());

    this.plans.update(list => list.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          phases: updatedPhases,
          updatedDate: todayStr
        };
      }
      return p;
    }));

    this.logAction(
      'Phase Updated',
      `Updated Phase "${updatedPhase.name}" (#${updatedPhase.sequence}) in Plan "${plan.name}"`,
      'info'
    );

    if (!silent) {
      this.showToast(
        `Phase "${updatedPhase.name}" updated successfully.`,
        'success',
        4500,
        'Phase Updated',
        'SAVED'
      );
    }

    return { success: true, phase: updatedPhase };
  }

  // Delete Phase from Plan
  deletePhaseFromPlan(planId: string, phaseId: string): { success: boolean; error?: string } {
    const plan = this.getPlan(planId);
    if (!plan) {
      return { success: false, error: 'Parent Plan not found.' };
    }

    const currentPhases = plan.phases || [];
    const target = currentPhases.find(ph => ph.id === phaseId);
    if (!target) {
      return { success: false, error: 'Phase not found in this Plan.' };
    }

    const remainingPhases = currentPhases.filter(ph => ph.id !== phaseId);
    const todayStr = formatDateDDMMYYYY(new Date());

    this.plans.update(list => list.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          phases: remainingPhases,
          phaseCount: remainingPhases.length,
          updatedDate: todayStr
        };
      }
      return p;
    }));

    this.logAction(
      'Phase Deleted',
      `Deleted Phase "${target.name}" from Plan "${plan.name}"`,
      'warning'
    );

    this.showToast(
      `Phase "${target.name}" removed from ${plan.name}.`,
      'info',
      4000,
      'Phase Removed'
    );

    return { success: true };
  }

  // =========================================================================
  // CERTIFICATE TEMPLATES MANAGEMENT (§0 - §13 OneLMS Certificate Spec)
  // =========================================================================
  certificateTemplates = signal<CertificateTemplate[]>(INITIAL_CERTIFICATE_TEMPLATES);
  certificateDashboardLayout = signal<CertificateDashboardLayout>(JSON.parse(JSON.stringify(DEFAULT_CERTIFICATE_DASHBOARD_LAYOUT)));
  certificateActivities = signal<CertificateActivityEvent[]>(INITIAL_CERTIFICATE_ACTIVITIES);

  // Dynamic Permission Capability Object based on active user role (§0.1)
  certificateTemplatePermissions = computed<CertificateTemplatePermissions>(() => {
    const role = this.activeRole();
    const isSysAdmin = role === 'system_admin' || (role as any) === 'super_admin';
    const isOrgAdmin = role === 'tenant_admin';
    const isLmsAdmin = role === 'lms_admin';
    const isTrainer = role === 'instructor';
    const isLearner = role === 'learner';

    return {
      canViewFeature: true,
      canCreate: isSysAdmin || isOrgAdmin || isLmsAdmin || isTrainer,
      canEdit: isSysAdmin || isOrgAdmin || isLmsAdmin || isTrainer,
      canDuplicate: isSysAdmin || isOrgAdmin || isLmsAdmin || isTrainer,
      canDelete: isSysAdmin || isOrgAdmin || isLmsAdmin || isTrainer,
      canArchive: isSysAdmin || isOrgAdmin || isLmsAdmin,
      canPublish: isSysAdmin || isOrgAdmin || isLmsAdmin || isTrainer,
      canSetOrgWideSharing: isSysAdmin || isOrgAdmin,
      canManageDashboardStudio: isSysAdmin || isOrgAdmin || isLmsAdmin
    };
  });

  // Scoped certificate templates based on sharing level and current scope
  scopedCertificateTemplates = computed<CertificateTemplate[]>(() => {
    const all = this.certificateTemplates();
    const role = this.activeRole();
    const tenantId = this.activeTenantId();
    const lmsId = this.activeLmsId();
    const user = this.activeUser();

    // System Admins see all templates
    if (role === 'system_admin' || (role as any) === 'super_admin') {
      return all;
    }

    return all.filter(t => {
      // 1. Organization-shared templates in the same organization
      if (t.sharing.level === 'organization') {
        return !t.sharing.organizationId || t.sharing.organizationId === tenantId;
      }

      // 2. LMS-shared templates in the same LMS workspace
      if (t.sharing.level === 'lms') {
        return (t.sharing.organizationId === tenantId) && (!t.sharing.lmsId || t.sharing.lmsId === lmsId);
      }

      // 3. Private templates: only the creator or Org/LMS admin in the same workspace
      if (t.sharing.level === 'private') {
        if (t.createdById === user.id || t.createdBy === user.name || t.createdBy === user.email) {
          return true;
        }
        if (role === 'tenant_admin' && t.sharing.organizationId === tenantId) {
          return true;
        }
        if (role === 'lms_admin' && t.sharing.lmsId === lmsId) {
          return true;
        }
        return false;
      }

      return true;
    });
  });

  // Published Certificate Templates (For Phase Outputs Selector and Published Views)
  publishedCertificateTemplates = computed<CertificateTemplate[]>(() => {
    return this.scopedCertificateTemplates().filter(t => t.status === 'published');
  });

  // Active Creation Drafts (Resumable)
  activeCertificateDrafts = computed<CertificateTemplate[]>(() => {
    return this.scopedCertificateTemplates().filter(t => t.status === 'draft');
  });

  // Certificate KPI Summary
  certificateKpis = computed(() => {
    const templates = this.scopedCertificateTemplates();
    const total = templates.length;
    const published = templates.filter(t => t.status === 'published').length;
    const draft = templates.filter(t => t.status === 'draft').length;
    const archived = templates.filter(t => t.status === 'archived').length;

    const privateCount = templates.filter(t => t.sharing.level === 'private').length;
    const lmsCount = templates.filter(t => t.sharing.level === 'lms').length;
    const orgCount = templates.filter(t => t.sharing.level === 'organization').length;

    return {
      total,
      published,
      draft,
      archived,
      privateCount,
      lmsCount,
      orgCount,
      publishedPct: total > 0 ? Math.round((published / total) * 100) : 0,
      draftPct: total > 0 ? Math.round((draft / total) * 100) : 0,
      archivedPct: total > 0 ? Math.round((archived / total) * 100) : 0
    };
  });

  getCertificateTemplateById(id: string): CertificateTemplate | undefined {
    return this.certificateTemplates().find(t => t.id === id);
  }

  // Create new Certificate Template
  createCertificateTemplate(data: Partial<CertificateTemplate>): CertificateTemplate {
    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;

    const tenant = this.activeTenant();
    const lms = this.activeLms();
    const user = this.activeUser();

    const numericId = Math.floor(1000 + Math.random() * 9000);
    const id = data.id || `CERT-TMP-${tenant.numericId || '1972'}-${numericId}`;

    const newTemplate: CertificateTemplate = {
      id,
      name: data.name || 'Untitled Certificate Template',
      description: data.description || '',
      type: data.type || 'Achievement',
      orientation: data.orientation || 'landscape',
      paperSize: data.paperSize || 'A4',
      canvas: data.canvas || { widthPx: 3508, heightPx: 2480, referenceDpi: 300 },
      background: data.background || {
        fileUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1600&q=80',
        fileName: 'certificate-background.png',
        mime: 'image/png'
      },
      elements: data.elements || [],
      sharing: data.sharing || {
        level: 'lms',
        organizationId: tenant.id,
        organizationName: tenant.name,
        lmsId: lms?.id || 'LMS-1972-01',
        lmsName: lms?.basicInfo.lmsName || 'Main LMS Workspace'
      },
      status: data.status || 'draft',
      version: 1,
      creationStatus: data.creationStatus || 'saved',
      lastCompletedStep: data.lastCompletedStep || 'background-details',
      createdBy: data.createdBy || user.name,
      createdById: data.createdById || user.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      usageCount: 0,
      previewThumbnail: data.previewThumbnail || data.background?.fileUrl
    };

    this.certificateTemplates.update(list => [newTemplate, ...list]);

    this.logCertificateActivity({
      templateId: newTemplate.id,
      templateName: newTemplate.name,
      eventType: newTemplate.status === 'published' ? 'published' : 'created',
      actorName: user.name,
      timestamp,
      message: newTemplate.status === 'published' 
        ? `${newTemplate.name} has been published successfully` 
        : `Created new certificate template "${newTemplate.name}"`
    });

    return newTemplate;
  }

  // Update existing Certificate Template
  updateCertificateTemplate(id: string, updates: Partial<CertificateTemplate>): boolean {
    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;
    const user = this.activeUser();

    let targetName = '';
    this.certificateTemplates.update(list => list.map(t => {
      if (t.id === id) {
        targetName = updates.name || t.name;
        return {
          ...t,
          ...updates,
          id: t.id, // Immutable ID
          updatedAt: timestamp
        };
      }
      return t;
    }));

    if (targetName) {
      this.logCertificateActivity({
        templateId: id,
        templateName: targetName,
        eventType: 'edited',
        actorName: user.name,
        timestamp,
        message: `${targetName} details have been updated successfully`
      });
      return true;
    }
    return false;
  }

  // Publish Certificate Template
  publishCertificateTemplate(id: string): boolean {
    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;
    const user = this.activeUser();

    let templateName = '';
    this.certificateTemplates.update(list => list.map(t => {
      if (t.id === id) {
        templateName = t.name;
        return {
          ...t,
          status: 'published',
          creationStatus: 'saved',
          lastCompletedStep: 'preview',
          updatedAt: timestamp
        };
      }
      return t;
    }));

    if (templateName) {
      this.logCertificateActivity({
        templateId: id,
        templateName,
        eventType: 'published',
        actorName: user.name,
        timestamp,
        message: `${templateName} has been published successfully`
      });

      this.showToast('Certificate template has been published successfully.', 'success', 4500, 'Template Published', 'PUBLISHED');
      return true;
    }
    return false;
  }

  // Archive Certificate Template (§7.5, §9)
  archiveCertificateTemplate(id: string): { success: boolean; error?: string } {
    const template = this.getCertificateTemplateById(id);
    if (!template) {
      return { success: false, error: 'Certificate template not found.' };
    }

    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;
    const user = this.activeUser();

    this.certificateTemplates.update(list => list.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'archived',
          updatedAt: timestamp
        };
      }
      return t;
    }));

    this.logCertificateActivity({
      templateId: id,
      templateName: template.name,
      eventType: 'archived',
      actorName: user.name,
      timestamp,
      message: `${template.name} has been archived`
    });

    this.showToast(`${template.name} has been archived`, 'info', 4500, 'Template Archived', 'ARCHIVED');
    return { success: true };
  }

  // Delete Draft Certificate Template (§7.5)
  deleteCertificateTemplate(id: string): { success: boolean; error?: string } {
    const template = this.getCertificateTemplateById(id);
    if (!template) {
      return { success: false, error: 'Certificate template not found.' };
    }

    if (template.status !== 'draft') {
      return { success: false, error: 'Only draft templates can be deleted.' };
    }

    this.certificateTemplates.update(list => list.filter(t => t.id !== id));

    this.showToast(`${template.name} has been deleted`, 'warning', 4500, 'Draft Deleted', 'DELETED');
    return { success: true };
  }

  // Duplicate Certificate Template (§7.5) -> creates new Draft copy
  duplicateCertificateTemplate(id: string): CertificateTemplate {
    const original = this.getCertificateTemplateById(id);
    const tenant = this.activeTenant();
    const lms = this.activeLms();
    const user = this.activeUser();

    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;

    const numericId = Math.floor(1000 + Math.random() * 9000);
    const newId = `CERT-TMP-${tenant.numericId || '1972'}-${numericId}`;

    const copy: CertificateTemplate = {
      ...(original ? JSON.parse(JSON.stringify(original)) : {}),
      id: newId,
      name: original ? `${original.name} (Copy)` : 'Certificate Template (Copy)',
      status: 'draft',
      version: 1,
      usageCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: user.name,
      createdById: user.id,
      creationStatus: 'draft',
      lastCompletedStep: 'designer'
    };

    this.certificateTemplates.update(list => [copy, ...list]);

    this.logCertificateActivity({
      templateId: copy.id,
      templateName: copy.name,
      eventType: 'duplicated',
      actorName: user.name,
      timestamp,
      message: `Duplicated "${original?.name || id}" as new draft "${copy.name}"`
    });

    this.showToast(`Template duplicated as draft "${copy.name}".`, 'success', 4500, 'Template Duplicated', 'DRAFT');
    return copy;
  }

  // Log Certificate Activity
  private logCertificateActivity(event: Omit<CertificateActivityEvent, 'id'>) {
    const id = `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newEvent: CertificateActivityEvent = { id, ...event };
    this.certificateActivities.update(list => [newEvent, ...list.slice(0, 19)]);
  }

  // Reset Certificate Dashboard Studio to defaults
  resetCertificateDashboard(): CertificateDashboardLayout {
    const defaults: CertificateDashboardLayout = {
      isPublished: true,
      publishedAt: '2026-08-31 00:00:00',
      publishedBy: 'System Default',
      version: 1,
      widgets: JSON.parse(JSON.stringify(DEFAULT_CERTIFICATE_DASHBOARD_LAYOUT.widgets))
    };
    this.certificateDashboardLayout.set(defaults);
    return defaults;
  }

  // =========================================================================
  // COURSE TEMPLATES MANAGEMENT (BRD §4.6 - Course Template Manager)
  // =========================================================================
  courseTemplates = signal<CourseTemplate[]>(INITIAL_COURSE_TEMPLATES);

  // Dynamic Permission Capability Object based on BRD §4.6 & §0.1
  courseTemplatePermissions = computed<CourseTemplatePermissions>(() => {
    const role = this.activeRole();
    const isSysAdmin = role === 'system_admin' || (role as any) === 'super_admin';
    const isOrgAdmin = role === 'tenant_admin';
    const isLmsAdmin = role === 'lms_admin';
    const isCourseOwnerOrTrainer = role === 'instructor';

    return {
      canViewFeature: true,
      canCreateTemplate: isSysAdmin || isOrgAdmin || isLmsAdmin || isCourseOwnerOrTrainer,
      canEditTemplate: isSysAdmin || isOrgAdmin || isLmsAdmin || isCourseOwnerOrTrainer,
      canDeactivateTemplate: isSysAdmin || isOrgAdmin || isLmsAdmin,
      canManageVisibility: isSysAdmin || isOrgAdmin || isLmsAdmin,
      canUseTemplate: isSysAdmin || isOrgAdmin || isLmsAdmin || isCourseOwnerOrTrainer,
      canManageDashboardStudio: isSysAdmin || isOrgAdmin || isLmsAdmin
    };
  });

  // Scoped course templates (LMS by default, Org sharing future)
  scopedCourseTemplates = computed<CourseTemplate[]>(() => {
    const all = this.courseTemplates();
    const role = this.activeRole();
    const lmsId = this.activeLmsId();
    const tenantId = this.activeTenantId();
    const user = this.activeUser();

    if (role === 'system_admin' || (role as any) === 'super_admin') {
      return all;
    }

    return all.filter(t => {
      // Check org match
      if (t.organizationId && t.organizationId !== tenantId) {
        return false;
      }
      // Check LMS scope or org scope
      if (t.scope === 'lms' && t.lmsId && t.lmsId !== lmsId) {
        return false;
      }
      // Check restricted visibility
      if (t.visibility?.mode === 'restricted') {
        const isAllowed = t.createdById === user.id || 
          (t.visibility.allowedUserIds && t.visibility.allowedUserIds.includes(user.id)) ||
          role === 'lms_admin' || role === 'tenant_admin';
        if (!isAllowed) return false;
      }
      return true;
    });
  });

  // Summary stats for Course Templates Grid KPI row
  courseTemplateStats = computed<CourseTemplateSummaryStats>(() => {
    const templates = this.scopedCourseTemplates();
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.status === 'active').length;
    const inactiveTemplates = templates.filter(t => t.status === 'inactive').length;
    const draftTemplates = templates.filter(t => t.status === 'draft').length;
    const totalCoursesSpawned = templates.reduce((acc, t) => acc + (t.usedCount || 0), 0);

    return {
      totalTemplates,
      activeTemplates,
      inactiveTemplates,
      draftTemplates,
      totalCoursesSpawned
    };
  });

  getCourseTemplates(lmsId?: string): CourseTemplate[] {
    const targetLmsId = lmsId || this.activeLmsId();
    return this.courseTemplates().filter(t => !t.lmsId || t.lmsId === targetLmsId);
  }

  getCourseTemplateById(id: string): CourseTemplate | undefined {
    return this.courseTemplates().find(t => t.id === id);
  }

  // Path 2: Dedicated Template Builder Create (§4)
  createCourseTemplate(templateData: Partial<CourseTemplate>): CourseTemplate {
    const tenant = this.activeTenant();
    const lms = this.activeLms();
    const user = this.activeUser();

    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;

    const numericRand = Math.floor(1000 + Math.random() * 9000);
    const newId = `CTMP-${tenant.numericId || '1972'}-${numericRand}`;
    const newCode = templateData.code?.trim() || `TMP-MOD-${numericRand}`;

    const defaultStructure: CourseTemplateStructure = {
      modules: templateData.structure?.modules && templateData.structure.modules.length > 0 
        ? deepCopyTemplateStructure(templateData.structure).modules 
        : [
            {
              moduleId: `m-01`,
              order: 1,
              title: 'Module 1: Foundational Framework & Core Principles',
              description: 'Introductory concepts and regulatory baseline.',
              contentSlots: [
                { slotId: 's-01', order: 1, title: 'Orientation & Overview Video', type: 'video', required: true, estimatedMinutes: 15 },
                { slotId: 's-02', order: 2, title: 'Foundational Knowledge Article', type: 'article', required: true, estimatedMinutes: 10 },
                { slotId: 's-03', order: 3, title: 'Knowledge Check Quiz', type: 'quiz', required: true, estimatedMinutes: 15 }
              ]
            }
          ],
      requiredComponents: templateData.structure?.requiredComponents || JSON.parse(JSON.stringify(DEFAULT_REQUIRED_COMPONENTS)),
      structuralDefaults: templateData.structure?.structuralDefaults || {
        passingScorePercent: 80,
        completionTracking: 'all_slots',
        sequentialUnlock: true,
        certificateEnabled: true,
        allowRetakes: true,
        maxRetakeAttempts: 3,
        pace: 'cohort_scheduled'
      }
    };

    const newTemplate: CourseTemplate = {
      id: newId,
      code: newCode,
      name: templateData.name?.trim() || 'Untitled Course Template',
      description: templateData.description?.trim() || '',
      categoryTags: templateData.categoryTags && templateData.categoryTags.length > 0 ? templateData.categoryTags : ['General'],
      scope: templateData.scope || 'lms',
      lmsId: templateData.lmsId || lms.id,
      lmsName: lms.basicInfo?.lmsName || 'Current LMS Workspace',
      organizationId: tenant.id,
      organizationName: tenant.name,
      version: 1,
      structure: defaultStructure,
      status: templateData.status || 'active',
      usedCount: 0,
      visibility: templateData.visibility || { mode: 'all_lms_instructors' },
      createdBy: user.name,
      createdById: user.id,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.courseTemplates.update(list => [newTemplate, ...list]);

    this.logAction(
      'Template Created',
      `Created course template "${newTemplate.name}" (${newTemplate.code})`,
      'success'
    );

    this.showToast('Template has been created.', 'success', 4500, 'Template Created', 'SUCCESS');
    return newTemplate;
  }

  // Path 1: Save Course Structure as Template (§3)
  saveCourseStructureAsTemplate(courseId: string, metadata: { name: string; code?: string; description?: string; categoryTags?: string[]; scope?: CourseTemplateScope }): { success: boolean; template?: CourseTemplate; error?: string } {
    const course = this.courses().find(c => c.id === courseId);
    if (!course) {
      return { success: false, error: 'Course not found.' };
    }

    const tenant = this.activeTenant();
    const lms = this.activeLms();
    const user = this.activeUser();

    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;

    const numericRand = Math.floor(1000 + Math.random() * 9000);
    const newId = `CTMP-${tenant.numericId || '1972'}-${numericRand}`;
    const newCode = metadata.code?.trim() || `TMP-${course.category.slice(0, 3).toUpperCase()}-${numericRand}`;

    // Extract structural blueprint from Course: modules and lessons transformed to slots, stripping content/progress (§3.2)
    const extractedModules: CourseTemplateModule[] = (course.modules || []).map((m, mIdx) => ({
      moduleId: `m-${String(mIdx + 1).padStart(2, '0')}`,
      order: mIdx + 1,
      title: m.title || `Module ${mIdx + 1}`,
      description: `Structural blueprint extracted from ${course.title}`,
      contentSlots: (m.lessons || []).map((l, lIdx) => ({
        slotId: `s-${String(mIdx + 1)}-${String(lIdx + 1)}`,
        order: lIdx + 1,
        title: l.title || `Lesson ${lIdx + 1}`,
        type: (l.type === 'interactive_lab' ? 'interactive_lab' : l.type === 'quiz' ? 'quiz' : l.type === 'video' ? 'video' : 'article') as CourseSlotType,
        required: true,
        estimatedMinutes: l.durationMinutes || 15,
        description: `Content placeholder extracted from lesson layout.`
      }))
    }));

    if (extractedModules.length === 0) {
      extractedModules.push({
        moduleId: 'm-01',
        order: 1,
        title: 'Module 1: General Instruction',
        contentSlots: [
          { slotId: 's-01', order: 1, title: 'Introduction Video Slot', type: 'video', required: true, estimatedMinutes: 15 }
        ]
      });
    }

    const extractedStructure: CourseTemplateStructure = {
      modules: extractedModules,
      requiredComponents: JSON.parse(JSON.stringify(DEFAULT_REQUIRED_COMPONENTS)),
      structuralDefaults: {
        passingScorePercent: 80,
        completionTracking: 'all_slots',
        sequentialUnlock: true,
        certificateEnabled: course.certificateEnabled ?? true,
        allowRetakes: true,
        maxRetakeAttempts: 3,
        pace: 'cohort_scheduled'
      }
    };

    const newTemplate: CourseTemplate = {
      id: newId,
      code: newCode,
      name: metadata.name.trim(),
      description: metadata.description?.trim() || `Reusable course blueprint extracted from course "${course.title}".`,
      categoryTags: metadata.categoryTags && metadata.categoryTags.length > 0 ? metadata.categoryTags : [course.category, 'Extracted Blueprint'],
      scope: 'lms',
      lmsId: lms.id,
      lmsName: lms.basicInfo?.lmsName || 'Current LMS Workspace',
      organizationId: tenant.id,
      organizationName: tenant.name,
      version: 1,
      structure: extractedStructure,
      status: 'active',
      sourceCourseId: course.id,
      sourceCourseName: course.title,
      usedCount: 0,
      visibility: { mode: 'all_lms_instructors' },
      createdBy: user.name,
      createdById: user.id,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.courseTemplates.update(list => [newTemplate, ...list]);

    this.logAction(
      'Course Saved as Template',
      `Saved structure of "${course.title}" as template "${newTemplate.name}"`,
      'success'
    );

    this.showToast('Course structure has been saved as a template.', 'success', 4500, 'Structure Saved', 'SUCCESS');
    return { success: true, template: newTemplate };
  }

  // Update Template (THE RULE: Updating a template must NOT change existing courses created from it - §5.2)
  updateCourseTemplate(id: string, updates: Partial<CourseTemplate>): { success: boolean; template?: CourseTemplate; error?: string } {
    const existing = this.getCourseTemplateById(id);
    if (!existing) {
      return { success: false, error: 'Course template not found.' };
    }

    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;

    let updatedTemplate: CourseTemplate = existing;

    this.courseTemplates.update(list => list.map(t => {
      if (t.id === id) {
        updatedTemplate = {
          ...t,
          ...updates,
          structure: updates.structure ? deepCopyTemplateStructure(updates.structure) : t.structure,
          version: t.version + 1,
          updatedAt: timestamp
        };
        return updatedTemplate;
      }
      return t;
    }));

    this.logAction(
      'Template Updated',
      `Updated course template "${updatedTemplate.name}" (Existing courses remain decoupled & untouched)`,
      'info'
    );

    this.showToast(`Template "${updatedTemplate.name}" has been updated.`, 'success', 4500, 'Template Updated', 'SUCCESS');
    return { success: true, template: updatedTemplate };
  }

  // Duplicate Course Template (§8.4)
  duplicateCourseTemplate(id: string): CourseTemplate {
    const original = this.getCourseTemplateById(id);
    const tenant = this.activeTenant();
    const lms = this.activeLms();
    const user = this.activeUser();

    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;

    const numericRand = Math.floor(1000 + Math.random() * 9000);
    const newId = `CTMP-${tenant.numericId || '1972'}-${numericRand}`;

    const copy: CourseTemplate = {
      ...(original ? JSON.parse(JSON.stringify(original)) : {}),
      id: newId,
      code: `TMP-COPY-${numericRand}`,
      name: original ? `${original.name} (Copy)` : 'Course Template (Copy)',
      status: 'draft',
      version: 1,
      usedCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: user.name,
      createdById: user.id
    };

    this.courseTemplates.update(list => [copy, ...list]);

    this.logAction(
      'Template Duplicated',
      `Duplicated template "${original?.name || id}" as draft "${copy.name}"`,
      'info'
    );

    this.showToast(`Template duplicated as draft "${copy.name}".`, 'success', 4500, 'Template Duplicated', 'DRAFT');
    return copy;
  }

  // Deactivate Course Template (§8.4)
  deactivateCourseTemplate(id: string): { success: boolean; error?: string } {
    const template = this.getCourseTemplateById(id);
    if (!template) {
      return { success: false, error: 'Course template not found.' };
    }

    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;

    this.courseTemplates.update(list => list.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'inactive',
          updatedAt: timestamp
        };
      }
      return t;
    }));

    this.logAction(
      'Template Deactivated',
      `Deactivated course template "${template.name}". Spawned courses remain unaffected.`,
      'warning'
    );

    this.showToast(`${template.name} has been deactivated`, 'error', 4500, 'Template Deactivated', 'INACTIVE');
    return { success: true };
  }

  // Reactivate Course Template (§8.4)
  reactivateCourseTemplate(id: string): { success: boolean; error?: string } {
    const template = this.getCourseTemplateById(id);
    if (!template) {
      return { success: false, error: 'Course template not found.' };
    }

    const today = new Date();
    const dateStr = formatDateDDMMYYYY(today);
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${timeStr}`;

    this.courseTemplates.update(list => list.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'active',
          updatedAt: timestamp
        };
      }
      return t;
    }));

    this.logAction(
      'Template Reactivated',
      `Reactivated course template "${template.name}"`,
      'success'
    );

    this.showToast(`${template.name} has been reactivated`, 'success', 4500, 'Template Reactivated', 'ACTIVE');
    return { success: true };
  }

  // Delete Course Template (§8.4)
  deleteCourseTemplate(id: string): { success: boolean; error?: string } {
    const template = this.getCourseTemplateById(id);
    if (!template) {
      return { success: false, error: 'Course template not found.' };
    }

    this.courseTemplates.update(list => list.filter(t => t.id !== id));

    this.logAction(
      'Template Deleted',
      `Deleted course template "${template.name}"`,
      'warning'
    );

    this.showToast(`Template "${template.name}" has been deleted.`, 'warning', 4500, 'Template Deleted', 'DELETED');
    return { success: true };
  }

  // Manage Template Visibility (§7 & §8.4)
  updateTemplateVisibility(id: string, visibility: CourseTemplateVisibility): { success: boolean; error?: string } {
    const template = this.getCourseTemplateById(id);
    if (!template) {
      return { success: false, error: 'Course template not found.' };
    }

    this.courseTemplates.update(list => list.map(t => {
      if (t.id === id) {
        return {
          ...t,
          visibility
        };
      }
      return t;
    }));

    this.showToast(`Visibility settings updated for "${template.name}".`, 'info', 3500, 'Visibility Updated');
    return { success: true };
  }

  // Consumer Flow: Create Course From Template (Snapshot Deep Copy - §6)
  createCourseFromTemplate(
    templateId: string,
    courseMetadata: {
      title: string;
      subtitle?: string;
      description?: string;
      category: any;
      level: any;
      instructorName?: string;
      durationMinutes?: number;
      isMandatory?: boolean;
      coverImage?: string;
    }
  ): { success: boolean; course?: Course; error?: string } {
    const template = this.getCourseTemplateById(templateId);
    if (!template) {
      return { success: false, error: 'Template not found.' };
    }

    if (template.status !== 'active') {
      return { success: false, error: 'A course can only be created from an Active template.' };
    }

    const tenant = this.activeTenant();
    const user = this.activeUser();
    const now = new Date();
    const courseId = `course-from-tpl-${Date.now()}`;

    // Deep copy the blueprint structure into concrete course modules and lessons (§6.3)
    const clonedStructure = deepCopyTemplateStructure(template.structure);
    let calculatedTotalDuration = 0;

    const generatedModules = clonedStructure.modules.map((m, mIdx) => {
      let modDuration = 0;
      const generatedLessons = m.contentSlots.map((slot, sIdx) => {
        const slotDuration = slot.estimatedMinutes || 15;
        modDuration += slotDuration;

        let lessonType: any = 'article';
        if (slot.type === 'video') lessonType = 'video';
        else if (slot.type === 'quiz') lessonType = 'quiz';
        else if (slot.type === 'interactive_lab' || slot.type === 'simulation' || slot.type === 'scorm') lessonType = 'interactive_lab';

        return {
          id: `les-${courseId}-${mIdx + 1}-${sIdx + 1}`,
          title: slot.title,
          type: lessonType,
          durationMinutes: slotDuration,
          summary: slot.description || `Instructional content slot for "${slot.title}" created from blueprint layout.`,
          contentHtml: `<div class="p-6">
            <h3 class="text-xl font-bold mb-3">${slot.title}</h3>
            <p class="text-slate-600 dark:text-slate-300 mb-4">
              This instructional lesson was initialized from template blueprint <strong>${template.name}</strong>.
            </p>
            <div class="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm">
              <span class="font-semibold text-primary">Required Component:</span> ${slot.required ? 'Yes (Mandatory for completion)' : 'Optional Supplementary Material'}
            </div>
          </div>`,
          videoUrl: slot.type === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : undefined
        };
      });

      calculatedTotalDuration += modDuration;

      return {
        id: `mod-${courseId}-${mIdx + 1}`,
        title: m.title,
        durationMinutes: modDuration,
        lessons: generatedLessons
      };
    });

    const newCourse: Course = {
      id: courseId,
      tenantId: tenant.id,
      title: courseMetadata.title.trim(),
      subtitle: courseMetadata.subtitle?.trim() || `Course blueprint generated from ${template.name}`,
      description: courseMetadata.description?.trim() || template.description || 'Instructional curriculum course created from standardized organizational blueprint.',
      coverImage: courseMetadata.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      category: courseMetadata.category || 'Compliance & Security',
      level: courseMetadata.level || 'Intermediate',
      durationMinutes: courseMetadata.durationMinutes || calculatedTotalDuration || 60,
      isMandatory: courseMetadata.isMandatory ?? false,
      instructorName: courseMetadata.instructorName?.trim() || user.name,
      instructorTitle: 'Course Owner & Certified Trainer',
      instructorAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      rating: 5.0,
      reviewCount: 0,
      enrolledCount: 0,
      modules: generatedModules,
      certificateEnabled: template.structure.structuralDefaults?.certificateEnabled ?? true,
      status: 'Published',
      tags: [...(template.categoryTags || []), 'Template Blueprint'],
      createdAt: now.toISOString().split('T')[0],
      createdFromTemplateId: template.id,
      createdFromTemplateVersion: template.version,
      templateProvenanceName: template.name
    };

    // Add generated course to catalog
    this.courses.update(list => [newCourse, ...list]);

    // Increment template adoption count (§8.3)
    this.courseTemplates.update(list => list.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          usedCount: (t.usedCount || 0) + 1
        };
      }
      return t;
    }));

    this.logAction(
      'Course Created from Template',
      `Spawned new independent course "${newCourse.title}" from template "${template.name}" (Snapshot Decoupled)`,
      'success'
    );

    this.showToast(
      'A new course has been created from the template. Add your content to finish.',
      'success',
      5500,
      'Course Created',
      'SUCCESS'
    );

    return { success: true, course: newCourse };
  }
}




