import { Routes } from '@angular/router';
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
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard | Multi-Tenant LMS' },
  { path: 'organization/dashboard', component: OrganizationDashboardComponent, title: 'Organization Dashboard | Multi-Tenant LMS' },
  { path: 'tenants/dashboard', redirectTo: 'organization/dashboard', pathMatch: 'full' },
  { path: 'profile', component: ProfileComponent, title: 'User Profile | Multi-Tenant LMS' },
  { path: 'tenants', component: TenantsComponent, title: 'Organizations | Multi-Tenant LMS' },
  { path: 'tenants/create', component: OrganizationCreateComponent, title: 'Create Organization | Multi-Tenant LMS' },
  { path: 'organization/create', component: OrganizationCreateComponent, title: 'Create Organization | Multi-Tenant LMS' },
  { path: 'lms', component: LmsListComponent, title: 'LMS Instances | Multi-Tenant LMS' },
  { path: 'lms/dashboard', component: LmsDashboardComponent, title: 'LMS Dashboard | Multi-Tenant LMS' },
  { path: 'lms/create', component: LmsCreateComponent, title: 'Create LMS Instance | Multi-Tenant LMS' },
  { path: 'lms/edit/:id', component: LmsCreateComponent, title: 'Edit LMS Instance | Multi-Tenant LMS' },
  { path: 'plans', component: PlanGridComponent, title: 'Plan Grid | Multi-Tenant LMS' },
  { path: 'plans/dashboard', component: PlanDashboardComponent, title: 'Plan Dashboard | Multi-Tenant LMS' },
  { path: 'plans/create', component: PlanCreateComponent, title: 'Create Plan | Multi-Tenant LMS' },
  { path: 'plans/details/:id', component: PlanDetailsComponent, title: 'Plan Details | Multi-Tenant LMS' },
  { path: 'courses', component: CoursesComponent, title: 'Courses | Multi-Tenant LMS' },
  { path: 'courses/:id/learn', component: CoursePlayerComponent, title: 'Classroom Player | Multi-Tenant LMS' },
  { path: 'users', component: UsersComponent, title: 'Personnel Directory | Multi-Tenant LMS' },
  { path: 'analytics', component: AnalyticsComponent, title: 'Compliance Analytics | Multi-Tenant LMS' },
  { path: 'certificates', component: CertificatesComponent, title: 'Certificates Vault | Multi-Tenant LMS' },
  { path: 'webinars', component: WebinarsComponent, title: 'Live Virtual Classrooms | Multi-Tenant LMS' },
  { path: 'settings', component: SettingsComponent, title: 'Branding & Security | Multi-Tenant LMS' },
  { path: '**', redirectTo: 'dashboard' },
];
