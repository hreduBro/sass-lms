import { UserRole } from './lms.model';

export interface NavChildItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
  description?: string;
  roles?: UserRole[];
  matchPatterns?: (string | RegExp)[];
  queryParams?: Record<string, string>;
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
  queryParams?: Record<string, string>;
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
        label: 'Transcripts', 
        route: '/transcripts', 
        icon: 'receipt_long', 
        badge: 'Official', 
        description: 'View and export trainee transcripts across courses, phases and plans',
        matchPatterns: ['/transcripts', '/transcripts/**']
      },
      { 
        label: 'Engagement Hub', 
        route: '/engagement', 
        icon: 'reviews', 
        badge: 'Community', 
        description: 'Ratings telemetry, feedback questionnaires & discussion forums',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/engagement', '/engagement/**']
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
    description: 'Design, configure & manage reusable curriculum modules',
    matchPatterns: ['/courses', '/courses/dashboard', '/courses/create', '/courses/edit/**', '/courses/*/learn', '/courses/learn/**'],
    children: [
      {
        label: 'Course Library',
        route: '/courses',
        icon: 'grid_view',
        description: 'Browse, filter & search curriculum catalog',
        matchPatterns: ['/courses']
      },
      {
        label: 'Course Dashboard',
        route: '/courses/dashboard',
        icon: 'space_dashboard',
        badge: 'Overview',
        description: 'High-level course status, content split & publish governance',
        matchPatterns: ['/courses/dashboard']
      },
      {
        label: 'Create Course',
        route: '/courses/create',
        icon: 'add_circle',
        badge: 'Builder',
        description: '6-step structured curriculum creation wizard',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/courses/create', '/courses/edit/**']
      }
    ]
  },
  {
    label: 'Assessments & Exams',
    route: '/assessments',
    icon: 'quiz',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'],
    badge: 'Bank',
    description: 'Centralized Assessment Bank, Scoring Policy, Exam Runtime & Manual Grading',
    matchPatterns: ['/assessments', '/assessments/**'],
    children: [
      {
        label: 'Assessment Bank',
        route: '/assessments',
        icon: 'grid_view',
        description: 'Browse, filter & manage authorable assessment instruments',
        matchPatterns: ['/assessments', '/assessments/view/**']
      },
      {
        label: 'Assessment Dashboard',
        route: '/assessments/dashboard',
        icon: 'space_dashboard',
        badge: 'Telemetry',
        description: 'Assessment repository health, publish blockers & score telemetry',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/assessments/dashboard']
      },
      {
        label: 'Create Assessment',
        route: '/assessments/create',
        icon: 'add_circle',
        badge: 'Builder',
        description: '4-step assessment, question authoring & scoring policy builder',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/assessments/create', '/assessments/edit/**']
      },
      {
        label: 'Results & Analytics',
        route: '/assessments/results',
        icon: 'fact_check',
        badge: 'Scores',
        description: 'Learner attempt results, score distributions & manual grading queue',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'],
        matchPatterns: ['/assessments/results', '/assessments/grade/**']
      }
    ]
  },
  {
    label: 'Course Templates',
    route: '/courses/templates',
    icon: 'dashboard_customize',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
    badge: 'Builder',
    description: 'Structural blueprints, module slots, builder & studio',
    matchPatterns: ['/courses/templates/**'],
    children: [
      {
        label: 'Template Grid',
        route: '/courses/templates',
        icon: 'grid_view',
        description: 'Browse, filter & manage course blueprints',
        matchPatterns: ['/courses/templates', '/courses/templates/view/**']
      },
      {
        label: 'Template Dashboard',
        route: '/courses/templates/dashboard',
        icon: 'space_dashboard',
        badge: 'Telemetry',
        description: 'Blueprint metrics, adoption velocity & slot telemetry',
        matchPatterns: ['/courses/templates/dashboard']
      },
      {
        label: 'Create Template',
        route: '/courses/templates/create',
        icon: 'add_circle',
        badge: 'Builder',
        description: 'Multi-step modular course blueprint builder',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/courses/templates/create', '/courses/templates/edit/**']
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
    label: 'Skill Mapping',
    route: '/skills',
    icon: 'psychology',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
    badge: 'Competency',
    description: 'Centralized skill repository, competency clusters, polymorphic element mappings & gap reports',
    matchPatterns: ['/skills', '/skills/**'],
    children: [
      {
        label: 'Skills Repository',
        route: '/skills',
        icon: 'list_alt',
        description: 'Manage skills, statuses, domain categories & element mappings',
        matchPatterns: ['/skills']
      },
      {
        label: 'Competency Clusters',
        route: '/skills/clusters',
        icon: 'bubble_chart',
        description: 'Group skills into broader competency areas',
        matchPatterns: ['/skills/clusters']
      },
      {
        label: 'Skill Dashboard',
        route: '/skills/dashboard',
        icon: 'space_dashboard',
        badge: 'Analytics',
        description: 'Skill coverage metrics, distribution, learner progress & gap reports',
        matchPatterns: ['/skills/dashboard']
      }
    ]
  },
  {
    label: 'Certificate Templates',
    route: '/certificates/templates',
    icon: 'workspace_premium',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor', 'learner'],
    badge: 'Studio',
    description: 'WYSIWYG designer, template grid, sharing & credentials',
    matchPatterns: ['/certificates/templates/**', '/certificates/templates', '/certificates/vault', '/certificates/signatories/**'],
    children: [
      {
        label: 'Template Grid',
        route: '/certificates/templates',
        icon: 'grid_view',
        description: 'Browse, filter & manage certificate templates',
        matchPatterns: ['/certificates/templates', '/certificates/templates/view/**']
      },
      {
        label: 'Template Dashboard',
        route: '/certificates/templates/dashboard',
        icon: 'space_dashboard',
        badge: 'Studio',
        description: 'KPI summary, status & sharing analytics studio',
        matchPatterns: ['/certificates/templates/dashboard']
      },
      {
        label: 'Create Template',
        route: '/certificates/templates/create',
        icon: 'add_circle',
        badge: 'Wizard',
        description: '3-step WYSIWYG canvas & placeholder authoring',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/certificates/templates/create', '/certificates/templates/edit/**']
      },
      {
        label: 'Certificates Vault',
        route: '/certificates/vault',
        icon: 'verified',
        badge: 'Issued',
        description: 'Verifiable credentials & issued student certificates',
        matchPatterns: ['/certificates/vault', '/certificates']
      },
      {
        label: 'Signatories',
        route: '/certificates/signatories',
        icon: 'edit_note',
        badge: 'Repository',
        description: 'Centralized repository of authorized signatories & digital signatures',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/certificates/signatories', '/signatories']
      },
      {
        label: 'Signatory Dashboard',
        route: '/certificates/signatories/dashboard',
        icon: 'space_dashboard',
        badge: 'Analytics',
        description: 'Signatory repository health, usage & propagation telemetry',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/certificates/signatories/dashboard', '/signatories/dashboard']
      },
      {
        label: 'My Transcripts',
        route: '/my-transcripts',
        icon: 'school',
        badge: 'Records',
        description: 'Personal verified academic transcripts & grades',
        matchPatterns: ['/my-transcripts', '/my-transcripts/**']
      }
    ]
  },
  {
    label: 'Badge Templates',
    route: '/certificates/badges',
    icon: 'military_tech',
    roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
    badge: 'Badges',
    description: 'Design, manage, and track OpenBadges digital credentials',
    matchPatterns: ['/certificates/badges/**', '/certificates/badges', '/badges/**', '/badges'],
    children: [
      {
        label: 'Badge Repository',
        route: '/certificates/badges',
        icon: 'grid_view',
        description: 'Browse, filter & manage digital badge templates',
        matchPatterns: ['/certificates/badges', '/badges', '/certificates/badges/view/**']
      },
      {
        label: 'Badge Dashboard',
        route: '/certificates/badges/dashboard',
        icon: 'space_dashboard',
        badge: 'Analytics',
        description: 'Badge telemetry, level/tier breakdown & utilization metrics',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/certificates/badges/dashboard', '/badges/dashboard', '/certificates/badges/analytics']
      },
      {
        label: 'Create Badge',
        route: '/certificates/badges/create',
        icon: 'add_task',
        badge: 'Wizard',
        description: '3-step emblem design, criteria & placeholder authoring',
        roles: ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'],
        matchPatterns: ['/certificates/badges/create', '/badges/create', '/certificates/badges/edit/**']
      }
    ]
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
  if (!url || !pattern) return false;
  if (pattern instanceof RegExp) {
    return pattern.test(url);
  }

  const cleanUrl = url.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const cleanPattern = pattern.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  // Exact pattern without wildcards must match exactly
  if (!pattern.includes('*')) {
    return cleanUrl === cleanPattern || url === pattern;
  }

  // If pattern has wildcards, convert glob to regex:
  // '**' matches any character including slashes (.*)
  // '*' matches path segments except slashes ([^/]+)
  const escaped = cleanPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§§DOUBLE§§§')
    .replace(/\*/g, '[^/]+')
    .replace(/§§§DOUBLE§§§/g, '.*');

  const regexPattern = '^' + escaped + '$';
  return new RegExp(regexPattern).test(cleanUrl) || new RegExp(regexPattern).test(url);
}

/**
 * Checks if a child navigation route is active for the current URL.
 */
export function isNavChildActive(currentUrl: string, child: NavChildItem | string): boolean {
  if (!currentUrl || !child) return false;
  if (typeof child === 'string') {
    const rawUrl = currentUrl.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    const target = child.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    return rawUrl === target;
  }

  const childRoute = child.route;
  const childQueryParams = child.queryParams;
  const cleanUrl = currentUrl.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const cleanChildRoute = childRoute.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  // Handle items with specific tab query parameters (e.g., Competency Clusters)
  if (childQueryParams && childQueryParams['tab']) {
    const tabVal = childQueryParams['tab'];
    if (currentUrl.includes(`tab=${tabVal}`) || currentUrl.includes(`${childRoute}/${tabVal}`)) {
      return true;
    }
  }

  // If this child has no queryParams.tab, check if another tab query param is present in current URL
  if (childRoute === '/skills' && (!childQueryParams || !childQueryParams['tab'])) {
    if (currentUrl.includes('tab=clusters') || currentUrl.includes('tab=mappings') || currentUrl.includes('/skills/clusters') || currentUrl.includes('/skills/mappings')) {
      return false;
    }
  }

  const matchPatterns = child.matchPatterns;

  // 1. Explicit Custom Match Patterns
  if (matchPatterns && matchPatterns.length > 0) {
    for (const pattern of matchPatterns) {
      if (matchesUrlPattern(cleanUrl, pattern) || matchesUrlPattern(currentUrl, pattern)) {
        return true;
      }
    }
    return false;
  }

  // 2. Exact match if no custom patterns provided
  return cleanUrl === cleanChildRoute;
}

/**
 * Checks if a parent navigation item or any of its child items is active for the current URL.
 */
export function isNavigationItemActive(currentUrl: string, item: NavItem): boolean {
  if (!currentUrl || !item) return false;
  const cleanUrl = currentUrl.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  // 1. If item has children, it is active ONLY IF at least one child is active
  if (item.children && item.children.length > 0) {
    return item.children.some(child => isNavChildActive(currentUrl, child));
  }

  // 2. Explicit Custom Match Patterns on the Parent Item
  if (item.matchPatterns && item.matchPatterns.length > 0) {
    for (const pattern of item.matchPatterns) {
      if (matchesUrlPattern(cleanUrl, pattern) || matchesUrlPattern(currentUrl, pattern)) {
        return true;
      }
    }
    return false;
  }

  // 3. Single Item Route match
  if (item.route) {
    const cleanItemRoute = item.route.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    if (cleanItemRoute === '/dashboard') {
      return cleanUrl === '/dashboard' || cleanUrl === '/';
    }
    return cleanUrl === cleanItemRoute;
  }

  return false;
}
