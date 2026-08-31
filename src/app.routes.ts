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

  // Theming, Layout & Branding Setup (LMS Admin, Org Admin, System Admin)
  { 
    path: 'settings', 
    component: SettingsComponent, 
    title: 'LMS Theming & Settings | Multi-Tenant LMS',
    canActivate: [roleGuard],
    data: { roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin'] }
  },

  { path: '**', redirectTo: 'dashboard' },
];
