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
import { UsersComponent } from './pages/users/users.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { CertificatesComponent } from './pages/certificates/certificates.component';
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

  // Certificates Vault
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
