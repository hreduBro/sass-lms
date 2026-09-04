import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OrganizationDashboardComponent } from './pages/organization-dashboard/organization-dashboard.component';
import { TenantsComponent } from './pages/tenants/tenants.component';
import { OrganizationCreateComponent } from './pages/organization-create/organization-create.component';
import { LmsListComponent } from './pages/lms-list/lms-list.component';
import { LmsDashboardComponent } from './pages/lms-dashboard/lms-dashboard.component';
import { LmsCreateComponent } from './pages/lms-create/lms-create.component';
import { PlanGridComponent } from './pages/plans/plan-grid/plan-grid.component';
import { PlanDashboardComponent } from './pages/plans/plan-dashboard/plan-dashboard.component';
import { PlanCreateComponent } from './pages/plans/plan-create/plan-create.component';
import { PlanDetailsComponent } from './pages/plans/plan-details/plan-details.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { CoursePlayerComponent } from './pages/course-player/course-player.component';
import { CourseTemplateGridComponent } from './pages/course-templates/template-grid/course-template-grid.component';
import { CourseTemplateDashboardComponent } from './pages/course-templates/template-dashboard/course-template-dashboard.component';
import { CourseTemplateCreateComponent } from './pages/course-templates/template-create/course-template-create.component';
import { UsersComponent } from './pages/users/users.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { CertificatesComponent } from './pages/certificates/certificates.component';
import { CertificateTemplateGridComponent } from './pages/certificate-templates/template-grid/template-grid.component';
import { CertificateTemplateDashboardComponent } from './pages/certificate-templates/template-dashboard/template-dashboard.component';
import { CertificateTemplateCreateComponent } from './pages/certificate-templates/template-create/template-create.component';
import { CertificatesVaultComponent } from './pages/certificate-templates/certificates-vault/certificates-vault.component';
import { SignatoryGridComponent } from './pages/signatories/signatory-grid/signatory-grid.component';
import { SignatoryDashboardComponent } from './pages/signatories/signatory-dashboard/signatory-dashboard.component';
import { BadgeGridComponent } from './pages/badge-templates/badge-grid/badge-grid.component';
import { BadgeDashboardComponent } from './pages/badge-templates/badge-dashboard/badge-dashboard.component';
import { BadgeCreateComponent } from './pages/badge-templates/badge-create/badge-create.component';
import { WebinarsComponent } from './pages/webinars/webinars.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  
  // Dashboard & Profile: Accessible to all roles
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    title: 'Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },
  { 
    path: 'profile', 
    component: ProfileComponent, 
    title: 'User Profile | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },

  // Organization Level Routes:
  // - Organization Dashboard: System Admin & Org Admin (tenant_admin)
  // - Organization Grid & Organization Creation: Strictly System Admin
  { 
    path: 'organization/dashboard', 
    component: OrganizationDashboardComponent, 
    title: 'Organization Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin'] }
  },
  { path: 'tenants/dashboard', redirectTo: 'organization/dashboard', pathMatch: 'full' },
  { 
    path: 'tenants', 
    component: TenantsComponent, 
    title: 'Organizations | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin'] }
  },
  { 
    path: 'tenants/create', 
    component: OrganizationCreateComponent, 
    title: 'Create Organization | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin'] }
  },
  { path: 'organization/create', redirectTo: 'tenants/create', pathMatch: 'full' },

  // LMS Instance Level Routes:
  // - LMS Grid & Dashboard: System Admin, Org Admin, and LMS Admin
  // - LMS Creation & Edit: System Admin & Org Admin (Org Admin provisions LMS under their Org)
  { 
    path: 'lms', 
    component: LmsListComponent, 
    title: 'LMS Instances | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin'] }
  },
  { 
    path: 'lms/dashboard', 
    component: LmsDashboardComponent, 
    title: 'LMS Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin'] }
  },
  { 
    path: 'lms/create', 
    component: LmsCreateComponent, 
    title: 'Create LMS Instance | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin'] }
  },
  { 
    path: 'lms/edit/:id', 
    component: LmsCreateComponent, 
    title: 'Edit LMS Instance | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin'] }
  },

  // Plan Management: System Admin, Org Admin, LMS Admin, and Instructor
  { 
    path: 'plans', 
    component: PlanGridComponent, 
    title: 'Plan Grid | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'plans/dashboard', 
    component: PlanDashboardComponent, 
    title: 'Plan Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'plans/create', 
    component: PlanCreateComponent, 
    title: 'Create Plan | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'plans/edit/:id', 
    component: PlanCreateComponent, 
    title: 'Edit Plan | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'plans/details/:id', 
    component: PlanDetailsComponent, 
    title: 'Plan Details | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'engagement', 
    loadComponent: () => import('./pages/engagement/engagement-hub.component').then(m => m.EngagementHubComponent), 
    title: 'Engagement Hub & Telemetry | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },
  { 
    path: 'transcripts', 
    loadComponent: () => import('./pages/transcripts/transcript-grid/transcript-grid.component').then(m => m.TranscriptGridComponent), 
    title: 'Transcripts | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'my-transcripts', 
    loadComponent: () => import('./pages/transcripts/my-transcripts/my-transcripts.component').then(m => m.MyTranscriptsComponent), 
    title: 'My Transcripts | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },
  { 
    path: 'plans/phases', 
    loadComponent: () => import('./pages/plans/phase-grid/phase-grid.component').then(m => m.PhaseGridComponent), 
    title: 'Phase Grid | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'phases', 
    loadComponent: () => import('./pages/plans/phase-grid/phase-grid.component').then(m => m.PhaseGridComponent), 
    title: 'Phase Grid | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'plans/:planId/phases/create', 
    loadComponent: () => import('./pages/plans/phase-create/phase-create.component').then(m => m.PhaseCreateComponent), 
    title: 'Create Phase | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'plans/:planId/phases/edit/:phaseId', 
    loadComponent: () => import('./pages/plans/phase-create/phase-create.component').then(m => m.PhaseCreateComponent), 
    title: 'Edit Phase | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'plans/phases/create', 
    loadComponent: () => import('./pages/plans/phase-create/phase-create.component').then(m => m.PhaseCreateComponent), 
    title: 'Create Phase | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },

  // Courses & Learning Player
  { 
    path: 'courses/dashboard', 
    loadComponent: () => import('./pages/courses/course-dashboard/course-dashboard.component').then(m => m.CourseDashboardComponent), 
    title: 'Course Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'courses/create', 
    loadComponent: () => import('./pages/courses/course-create/course-create.component').then(m => m.CourseCreateComponent), 
    title: 'Create Course | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'courses/edit/:id', 
    loadComponent: () => import('./pages/courses/course-create/course-create.component').then(m => m.CourseCreateComponent), 
    title: 'Edit Course | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'courses/templates', 
    component: CourseTemplateGridComponent, 
    title: 'Course Templates | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'courses/templates/dashboard', 
    component: CourseTemplateDashboardComponent, 
    title: 'Course Templates Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'courses/templates/create', 
    component: CourseTemplateCreateComponent, 
    title: 'Create Course Template | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'courses/templates/edit/:id', 
    component: CourseTemplateCreateComponent, 
    title: 'Edit Course Template | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'courses', 
    component: CoursesComponent, 
    title: 'Courses | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },
  { 
    path: 'courses/:id/learn', 
    component: CoursePlayerComponent, 
    title: 'Classroom Player | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },

  // Personnel & Directory
  { 
    path: 'users', 
    component: UsersComponent, 
    title: 'Personnel Directory | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },

  // Compliance Analytics & Audit
  { 
    path: 'analytics', 
    component: AnalyticsComponent, 
    title: 'Compliance Analytics | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin'] }
  },

  // Certificate Templates & Studio Module
  { 
    path: 'certificates/templates', 
    component: CertificateTemplateGridComponent, 
    title: 'Certificate Templates | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'certificates/templates/dashboard', 
    component: CertificateTemplateDashboardComponent, 
    title: 'Certificate Templates Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'certificates/templates/create', 
    component: CertificateTemplateCreateComponent, 
    title: 'Create Certificate Template | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'certificates/templates/edit/:id', 
    component: CertificateTemplateCreateComponent, 
    title: 'Edit Certificate Template | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'certificates/vault', 
    component: CertificatesVaultComponent, 
    title: 'Issued Certificates Vault | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },

  // Signatory Management (§4.8.1)
  {
    path: 'certificates/signatories',
    component: SignatoryGridComponent,
    title: 'Signatories Repository | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  {
    path: 'certificates/signatories/dashboard',
    component: SignatoryDashboardComponent,
    title: 'Signatory Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { path: 'signatories', redirectTo: 'certificates/signatories', pathMatch: 'full' },
  { path: 'signatories/dashboard', redirectTo: 'certificates/signatories/dashboard', pathMatch: 'full' },

  // Badge Template Management (§4.8.2)
  {
    path: 'certificates/badges',
    component: BadgeGridComponent,
    title: 'Badge Repository | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  {
    path: 'certificates/badges/dashboard',
    component: BadgeDashboardComponent,
    title: 'Badge Templates Overview | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  {
    path: 'certificates/badges/create',
    component: BadgeCreateComponent,
    title: 'Create Badge Template | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { path: 'badges', redirectTo: 'certificates/badges', pathMatch: 'full' },
  { path: 'badges/dashboard', redirectTo: 'certificates/badges/dashboard', pathMatch: 'full' },
  { path: 'badges/create', redirectTo: 'certificates/badges/create', pathMatch: 'full' },

  // Certificates Vault (Legacy / Root)
  { 
    path: 'certificates', 
    component: CertificatesComponent, 
    title: 'Certificates Vault | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },

  // Live Virtual Classrooms & Webinars
  { 
    path: 'webinars', 
    component: WebinarsComponent, 
    title: 'Live Virtual Classrooms | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },

  // Skill Mapping Module (§4.10)
  { 
    path: 'skills/dashboard', 
    loadComponent: () => import('./pages/skills/skill-dashboard/skill-dashboard.component').then(m => m.SkillDashboardComponent), 
    title: 'Skill Mapping Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'skills/clusters', 
    loadComponent: () => import('./pages/skills/skill-clusters/skill-clusters.component').then(m => m.SkillClustersComponent), 
    title: 'Competency Clusters | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'skills', 
    loadComponent: () => import('./pages/skills/skill-grid/skill-grid.component').then(m => m.SkillGridComponent), 
    title: 'Skill Repository & Mapping | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },

  // Assessment & Quiz Module
  { 
    path: 'assessments', 
    loadComponent: () => import('./pages/assessments/assessment-grid/assessment-grid.component').then(m => m.AssessmentGridComponent), 
    title: 'Assessments & Exam Bank | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },
  { 
    path: 'assessments/dashboard', 
    loadComponent: () => import('./pages/assessments/assessment-dashboard/assessment-dashboard.component').then(m => m.AssessmentDashboardComponent), 
    title: 'Assessment Studio Dashboard | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'assessments/create', 
    loadComponent: () => import('./pages/assessments/assessment-create/assessment-create.component').then(m => m.AssessmentCreateComponent), 
    title: 'Author Assessment | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'assessments/edit/:id', 
    loadComponent: () => import('./pages/assessments/assessment-create/assessment-create.component').then(m => m.AssessmentCreateComponent), 
    title: 'Edit Assessment | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'assessments/take/:id', 
    loadComponent: () => import('./pages/assessments/assessment-runtime/assessment-runtime.component').then(m => m.AssessmentRuntimeComponent), 
    title: 'Take Assessment Exam | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'] }
  },
  { 
    path: 'assessments/results', 
    loadComponent: () => import('./pages/assessments/assessment-results/assessment-results.component').then(m => m.AssessmentResultsComponent), 
    title: 'Assessment Results & Grading | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },
  { 
    path: 'assessments/results/:attemptId', 
    loadComponent: () => import('./pages/assessments/assessment-results/assessment-results.component').then(m => m.AssessmentResultsComponent), 
    title: 'Grade Assessment Attempt | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'] }
  },

  // Theming, Layout & Branding Setup (LMS Admin, Org Admin, System Admin)
  { 
    path: 'settings', 
    component: SettingsComponent, 
    title: 'LMS Theming & Settings | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin'] }
  },

  // Dedicated Error & Exception Pages (§4.15)
  {
    path: '403',
    loadComponent: () => import('./pages/errors/forbidden.component').then(m => m.ForbiddenComponent),
    title: '403 Forbidden | Multi-Tenant LMS'
  },
  { path: 'forbidden', redirectTo: '403', pathMatch: 'full' },
  {
    path: '404',
    loadComponent: () => import('./pages/errors/not-found.component').then(m => m.NotFoundComponent),
    title: '404 Not Found | Multi-Tenant LMS'
  },
  { path: 'not-found', redirectTo: '404', pathMatch: 'full' },
  {
    path: '500',
    loadComponent: () => import('./pages/errors/server-error.component').then(m => m.ServerErrorComponent),
    title: '500 Server Error | Multi-Tenant LMS'
  },
  { path: 'server-error', redirectTo: '500', pathMatch: 'full' },

  // Wildcard Route -> 404 Not Found
  { 
    path: '**', 
    loadComponent: () => import('./pages/errors/not-found.component').then(m => m.NotFoundComponent),
    title: '404 Not Found | Multi-Tenant LMS'
  },
];
