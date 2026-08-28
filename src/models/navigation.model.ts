import { UserRole } from './lms.model';

export interface NavChildItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
  description?: string;
  roles?: UserRole[];
  matchPatterns?: (string | RegExp)[];
}

export interface NavItem {
  label: string;
  route?: string;
  icon: string;
  roles: UserRole[];
  badge?: string;
  description?: string;
  children?: NavChildItem[];
  matchPatterns?: (string | RegExp)[];
}

export const APP_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'space_dashboard',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'],
    description: 'Overview metrics, recent activities & quick insights'
  },
  {
    label: 'Organizations',
    route: '/tenants',
    icon: 'corporate_fare',
    roles: ['system_admin', 'super_admin'],
    badge: 'Multi',
    description: 'Manage workspace tenants & subsidiaries',
    matchPatterns: ['/tenants/**', '/organization/**'],
    children: [
      { 
        label: 'All Organizations', 
        route: '/tenants', 
        icon: 'domain', 
        description: 'Browse and switch workspaces', 
        roles: ['system_admin', 'super_admin'],
        matchPatterns: ['/tenants', '/tenants/edit/**', '/tenants/details/**', '/tenants/view/**']
      },
      { 
        label: 'Organization Dashboard', 
        route: '/organization/dashboard', 
        icon: 'space_dashboard', 
        badge: 'Overview', 
        description: 'Platform-wide status, health & capacity metrics', 
        roles: ['system_admin', 'super_admin'],
        matchPatterns: ['/organization/dashboard', '/tenants/dashboard']
      },
      { 
        label: 'Create Organization', 
        route: '/tenants/create', 
        icon: 'domain_add', 
        badge: 'Wizard', 
        description: 'Step-by-step enterprise onboarding', 
        roles: ['system_admin', 'super_admin'],
        matchPatterns: ['/tenants/create', '/organization/create']
      }
    ]
  },
  {
    label: 'Org Dashboard',
    route: '/organization/dashboard',
    icon: 'space_dashboard',
    roles: ['tenant_admin'],
    badge: 'Overview',
    description: 'Organization-wide health, capacity & LMS allocation',
    matchPatterns: ['/organization/dashboard', '/tenants/dashboard']
  },
  {
    label: 'LMS Instances',
    route: '/lms',
    icon: 'layers',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin'],
    description: 'Multi-portal LMS instance allocation',
    matchPatterns: ['/lms/**'],
    children: [
      { 
        label: 'LMS Dashboard', 
        route: '/lms/dashboard', 
        icon: 'space_dashboard', 
        badge: 'Overview', 
        description: 'Organization LMS status, active drafts & capacity metrics',
        matchPatterns: ['/lms/dashboard']
      },
      { 
        label: 'LMS Instances Grid', 
        route: '/lms', 
        icon: 'grid_view', 
        description: 'View organization LMS instances',
        matchPatterns: ['/lms', '/lms/edit/**', '/lms/details/**', '/lms/view/**']
      },
      { 
        label: 'Create LMS', 
        route: '/lms/create', 
        icon: 'add_circle', 
        badge: 'Wizard', 
        description: '4-step LMS creation wizard', 
        roles: ['system_admin', 'super_admin', 'tenant_admin'],
        matchPatterns: ['/lms/create']
      }
    ]
  },
  {
    label: 'Plan Management',
    route: '/plans',
    icon: 'event_note',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
    badge: 'LMS Scope',
    description: 'Plan Grid, Owner Assignment, Phase Architecture & Lifecycle',
    matchPatterns: ['/plans/**', '/phases/**'],
    children: [
      { 
        label: 'Plan Grid', 
        route: '/plans', 
        icon: 'table_view', 
        description: 'View & filter plans in current LMS workspace',
        matchPatterns: ['/plans', '/plans/details/**', '/plans/view/**']
      },
      { 
        label: 'Phase Grid', 
        route: '/plans/phases', 
        icon: 'timeline', 
        badge: 'Phases', 
        description: 'Curriculum phases, prerequisites & task roadmaps',
        matchPatterns: ['/plans/phases', '/phases', '/plans/*/phases/**', '/plans/phases/**', '/phases/**']
      },
      { 
        label: 'Plan Dashboard', 
        route: '/plans/dashboard', 
        icon: 'monitoring', 
        badge: 'Telemetry', 
        description: 'Plan progress, phase sequencing & completion rates',
        matchPatterns: ['/plans/dashboard']
      },
      { 
        label: 'Create Plan', 
        route: '/plans/create', 
        icon: 'add_task', 
        badge: 'Builder', 
        description: 'Design new learning plan & phase structure', 
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/plans/create', '/plans/edit/**']
      }
    ]
  },
  {
    label: 'Courses & Catalog',
    route: '/courses',
    icon: 'school',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'],
    description: 'Curriculum library & training materials',
    matchPatterns: ['/courses/**'],
    children: [
      { 
        label: 'Course Directory', 
        route: '/courses', 
        icon: 'auto_stories', 
        description: 'Browse courses, modules & tracks',
        matchPatterns: ['/courses', '/courses/details/**']
      },
      { 
        label: 'Interactive Player', 
        route: '/courses/c1/learn', 
        icon: 'play_lesson', 
        badge: 'Player', 
        description: 'Resume multimedia training session',
        matchPatterns: ['/courses/*/learn', '/courses/learn/**']
      }
    ]
  },
  {
    label: 'Users & Personnel',
    route: '/users',
    icon: 'groups',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
    description: 'Personnel directory & permissions',
    matchPatterns: ['/users/**']
  },
  {
    label: 'Compliance & Analytics',
    route: '/analytics',
    icon: 'analytics',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin'],
    description: 'KPI metrics, audit reports & compliance',
    matchPatterns: ['/analytics/**']
  },
  {
    label: 'Certificates Vault',
    route: '/certificates',
    icon: 'verified',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'],
    description: 'Verifiable credentials & issued certificates',
    matchPatterns: ['/certificates/**']
  },
  {
    label: 'Live Classrooms',
    route: '/webinars',
    icon: 'videocam',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'],
    badge: 'Live',
    description: 'Virtual interactive classrooms & webinars',
    matchPatterns: ['/webinars/**']
  },
  {
    label: 'LMS Theming & Layout',
    route: '/settings',
    icon: 'palette',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin'],
    description: 'LMS-mapped theme, layout & brand customizer',
    matchPatterns: ['/settings/**']
  },
  {
    label: 'My Profile',
    route: '/profile',
    icon: 'account_circle',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'],
    description: 'Personal profile & skills',
    matchPatterns: ['/profile/**']
  }
];

/**
 * Utility helper that checks whether a URL path matches a glob or wildcard pattern:
 * e.g. '/tenants/**', '/plans/edit/**', '/courses/*\/learn'
 */
export function matchesUrlPattern(url: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(url);
  }

  // Exact pattern without wildcards must match exactly
  if (!pattern.includes('*')) {
    return url === pattern;
  }

  // If pattern has wildcards, convert glob to regex:
  // '**' matches any character including slashes (.*)
  // '*' matches path segments except slashes ([^/]+)
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§§DOUBLE§§§')
    .replace(/\*/g, '[^/]+')
    .replace(/§§§DOUBLE§§§/g, '.*');

  const regexPattern = '^' + escaped + '$';
  return new RegExp(regexPattern).test(url);
}

/**
 * Checks if a child navigation route is active for the current URL.
 */
export function isNavChildActive(currentUrl: string, child: NavChildItem | string): boolean {
  const childRoute = typeof child === 'string' ? child : child.route;
  const matchPatterns = typeof child === 'object' ? child.matchPatterns : undefined;
  const url = currentUrl.split('?')[0];

  // 1. Explicit Custom Match Patterns
  if (matchPatterns && matchPatterns.length > 0) {
    for (const pattern of matchPatterns) {
      if (matchesUrlPattern(url, pattern)) {
        return true;
      }
    }
    return false;
  }

  // 2. Exact match if no custom patterns provided
  return url === childRoute;
}

/**
 * Checks if a parent navigation item or any of its child items is active for the current URL.
 */
export function isNavigationItemActive(currentUrl: string, item: NavItem): boolean {
  const url = currentUrl.split('?')[0];

  // 1. If item has children, it is active ONLY IF at least one child is active
  if (item.children && item.children.length > 0) {
    return item.children.some(child => isNavChildActive(url, child));
  }

  // 2. Explicit Custom Match Patterns on the Parent Item
  if (item.matchPatterns && item.matchPatterns.length > 0) {
    for (const pattern of item.matchPatterns) {
      if (matchesUrlPattern(url, pattern)) {
        return true;
      }
    }
    return false;
  }

  // 3. Single Item Route match
  if (item.route) {
    if (item.route === '/dashboard') {
      return url === '/dashboard' || url === '/';
    }
    return url === item.route;
  }

  return false;
}
