import { UserRole } from './lms.model';

export interface NavChildItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
  description?: string;
}

export interface NavItem {
  label: string;
  route?: string;
  icon: string;
  roles: UserRole[];
  badge?: string;
  description?: string;
  children?: NavChildItem[];
}

export const APP_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'space_dashboard',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin', 'instructor', 'learner'],
    description: 'Overview metrics, recent activities & quick insights'
  },
  {
    label: 'Organizations',
    route: '/tenants',
    icon: 'corporate_fare',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin'],
    badge: 'Multi',
    description: 'Manage workspace tenants & subsidiaries',
    children: [
      { label: 'All Organizations', route: '/tenants', icon: 'domain', description: 'Browse and switch workspaces' },
      { label: 'Organization Dashboard', route: '/organization/dashboard', icon: 'space_dashboard', badge: 'Overview', description: 'Platform-wide status, health & capacity metrics' },
      { label: 'Create Organization', route: '/tenants/create', icon: 'domain_add', badge: 'Wizard', description: 'Step-by-step enterprise onboarding' }
    ]
  },
  {
    label: 'LMS Instances',
    route: '/lms',
    icon: 'layers',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin'],
    description: 'Multi-portal LMS instance allocation',
    children: [
      { label: 'LMS Dashboard', route: '/lms/dashboard', icon: 'space_dashboard', badge: 'Overview', description: 'Organization LMS status, active drafts & capacity metrics' },
      { label: 'LMS Instances Grid', route: '/lms', icon: 'grid_view', description: 'View organization LMS instances' },
      { label: 'Create LMS', route: '/lms/create', icon: 'add_circle', badge: 'Wizard', description: '4-step LMS creation wizard' }
    ]
  },
  {
    label: 'Plan Management',
    route: '/plans',
    icon: 'event_note',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin', 'instructor'],
    badge: 'LMS Scope',
    description: 'Plan Grid, Owner Assignment, Phase Architecture & Lifecycle',
    children: [
      { label: 'Plan Grid', route: '/plans', icon: 'table_view', description: 'View & filter plans in current LMS workspace' },
      { label: 'Plan Dashboard', route: '/plans/dashboard', icon: 'monitoring', badge: 'Telemetry', description: 'Plan progress, phase sequencing & completion rates' },
      { label: 'Create Plan', route: '/plans/create', icon: 'add_task', badge: 'Builder', description: 'Design new learning plan & phase structure' }
    ]
  },
  {
    label: 'Courses & Catalog',
    route: '/courses',
    icon: 'school',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin', 'instructor', 'learner'],
    description: 'Curriculum library & training materials',
    children: [
      { label: 'Course Directory', route: '/courses', icon: 'auto_stories', description: 'Browse courses, modules & tracks' },
      { label: 'Interactive Player', route: '/courses/c1/learn', icon: 'play_lesson', badge: 'Player', description: 'Resume multimedia training session' }
    ]
  },
  {
    label: 'Users & Personnel',
    route: '/users',
    icon: 'groups',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin', 'instructor'],
    description: 'Personnel directory & permissions'
  },
  {
    label: 'Compliance & Analytics',
    route: '/analytics',
    icon: 'analytics',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin'],
    description: 'KPI metrics, audit reports & compliance'
  },
  {
    label: 'Certificates Vault',
    route: '/certificates',
    icon: 'verified',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin', 'instructor', 'learner'],
    description: 'Verifiable credentials & issued certificates'
  },
  {
    label: 'Live Classrooms',
    route: '/webinars',
    icon: 'videocam',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin', 'instructor', 'learner'],
    badge: 'Live',
    description: 'Virtual interactive classrooms & webinars'
  },
  {
    label: 'My Profile',
    route: '/profile',
    icon: 'account_circle',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin', 'instructor', 'learner'],
    description: 'Personal profile & skills'
  },
  {
    label: 'LMS Theming & Layout',
    route: '/settings',
    icon: 'palette',
    roles: ['system_admin', 'lms_admin', 'super_admin', 'tenant_admin'],
    description: 'LMS-mapped theme, layout & brand customizer'
  }
];

/**
 * Checks if a route or any of its child items is active for the current URL.
 */
export function isNavigationItemActive(currentUrl: string, item: NavItem): boolean {
  if (item.children && item.children.length > 0) {
    return item.children.some(child => {
      if (child.route === '/tenants' || child.route === '/courses' || child.route === '/lms') {
        return currentUrl === child.route;
      }
      return currentUrl === child.route || currentUrl.startsWith(child.route);
    });
  }

  if (item.route) {
    if (item.route === '/dashboard') {
      return currentUrl === '/dashboard' || currentUrl === '/';
    }
    return currentUrl === item.route || currentUrl.startsWith(item.route);
  }

  return false;
}
