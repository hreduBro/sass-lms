export type OrgDashboardWidgetType =
  | 'org_kpi_summary'
  | 'org_status_breakdown'
  | 'platform_capacity_overview'
  | 'recent_org_activity'
  | 'top_orgs_by_lms'
  | 'org_broadcast_banner'
  | 'resource_allocation_leaderboard'
  | 'org_admin_directory'
  | 'timezone_distribution';

export type OrgWidgetCategory = 'kpis-summary' | 'status-activity' | 'capacity' | 'directory';

export interface OrgDashboardWidgetConfig {
  bannerText?: string;
  bannerType?: 'info' | 'warning' | 'success' | 'indigo';
  chartType?: 'donut' | 'bar';
  maxItems?: number;
  showTrend?: boolean;
  highlightCategory?: string;
  showSummaryBadge?: boolean;
  customAccentColor?: string;
}

export interface OrgDashboardWidget {
  id: string;
  type: OrgDashboardWidgetType;
  title: string;
  subtitle?: string;
  colSpan: 1 | 2 | 3 | 4; // 1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%
  rowSpan?: 1 | 2 | 3 | 4; // 1 = 1x (~180px), 2 = 2x (~360px), 3 = 3x (~520px), 4 = 4x (~680px)
  heightPx?: number;
  audience?: string[]; // e.g. ['system-admin']
  config?: OrgDashboardWidgetConfig;
}

export interface OrgDashboardLayout {
  version: number;
  publishedAt: string;
  publishedBy: string;
  lastEditedAt?: string;
  widgets: OrgDashboardWidget[];
}

export interface OrgWidgetCatalogItem {
  id: string;
  type: OrgDashboardWidgetType;
  name: string;
  category: OrgWidgetCategory;
  categoryLabel: string;
  defaultWidthPct: 25 | 50 | 75 | 100;
  defaultColSpan: 1 | 2 | 3 | 4;
  defaultRowSpan: 1 | 2 | 3 | 4;
  icon: string;
  description: string;
  badge?: string;
}

export interface OrgDashboardPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge?: string;
  widgetTemplates: {
    type: OrgDashboardWidgetType;
    colSpan: 1 | 2 | 3 | 4;
    rowSpan: 1 | 2 | 3 | 4;
  }[];
}

export const ORG_WIDGET_CATALOG: OrgWidgetCatalogItem[] = [
  {
    id: 'cat-org-kpi-summary',
    type: 'org_kpi_summary',
    name: 'Organization KPI Summary',
    category: 'kpis-summary',
    categoryLabel: 'KPIs & Summary',
    defaultWidthPct: 100,
    defaultColSpan: 4,
    defaultRowSpan: 1,
    icon: 'insights',
    badge: 'Core',
    description: '4-card platform summary: Total Organizations, Active Organizations, Total LMS Instances, and Draft Organizations.'
  },
  {
    id: 'cat-org-status-breakdown',
    type: 'org_status_breakdown',
    name: 'Organization Status Breakdown',
    category: 'status-activity',
    categoryLabel: 'Status & Activity',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'pie_chart',
    badge: 'Visual',
    description: 'Visual status distribution chart (Active, Suspended/Inactive, In-Progress, Draft) matching grid badge conventions.'
  },
  {
    id: 'cat-platform-capacity-overview',
    type: 'platform_capacity_overview',
    name: 'Platform Capacity Overview',
    category: 'capacity',
    categoryLabel: 'Capacity',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'dns',
    badge: 'Infra',
    description: 'Platform-wide Database and File Storage consumption metrics with health threshold indicators.'
  },
  {
    id: 'cat-recent-org-activity',
    type: 'recent_org_activity',
    name: 'Recent Organization Activity',
    category: 'status-activity',
    categoryLabel: 'Status & Activity',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'history',
    badge: 'Audit',
    description: 'Chronological timeline feed of organization activations, deactivations, creation events, and configuration edits.'
  },
  {
    id: 'cat-top-orgs-by-lms',
    type: 'top_orgs_by_lms',
    name: 'Organizations by LMS Count',
    category: 'directory',
    categoryLabel: 'Directory',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'format_list_numbered',
    badge: 'Ranked',
    description: 'Top-ranked organizations sorted by number of allocated LMS instances with direct navigation links.'
  },
  {
    id: 'cat-org-broadcast-banner',
    type: 'org_broadcast_banner',
    name: 'Broadcast Announcement Banner',
    category: 'status-activity',
    categoryLabel: 'Status & Activity',
    defaultWidthPct: 100,
    defaultColSpan: 4,
    defaultRowSpan: 1,
    icon: 'campaign',
    badge: 'Alert',
    description: 'Full-width platform notice banner for maintenance schedules, policy updates, and system announcements.'
  },
  {
    id: 'cat-resource-leaderboard',
    type: 'resource_allocation_leaderboard',
    name: 'Resource Allocation Leaderboard',
    category: 'capacity',
    categoryLabel: 'Capacity',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'leaderboard',
    description: 'Ranked comparison table of organizations by Database and File Storage quota utilization.'
  },
  {
    id: 'cat-org-admin-directory',
    type: 'org_admin_directory',
    name: 'Organization Admin Directory',
    category: 'directory',
    categoryLabel: 'Directory',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'contact_mail',
    description: 'Directory list of all primary Organization Administrators with email, phone, and verification status.'
  },
  {
    id: 'cat-timezone-distribution',
    type: 'timezone_distribution',
    name: 'Timezone Distribution',
    category: 'directory',
    categoryLabel: 'Directory',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'schedule',
    description: 'Geographic and operational breakdown of registered organizations across global timezones.'
  }
];

export const DEFAULT_ORG_DASHBOARD_WIDGETS: OrgDashboardWidget[] = [
  {
    id: 'w-org-kpi-summary',
    type: 'org_kpi_summary',
    title: 'Organization KPI Summary',
    subtitle: 'Platform-wide telemetry across all registered organizations',
    colSpan: 4,
    rowSpan: 1,
    audience: ['system-admin']
  },
  {
    id: 'w-org-status-breakdown',
    type: 'org_status_breakdown',
    title: 'Organization Status Breakdown',
    subtitle: 'Active, In-Progress, Suspended & Draft distribution',
    colSpan: 2,
    rowSpan: 2,
    audience: ['system-admin'],
    config: {
      chartType: 'donut'
    }
  },
  {
    id: 'w-platform-capacity-overview',
    type: 'platform_capacity_overview',
    title: 'Platform Capacity Overview',
    subtitle: 'Global DB and File Storage capacity consumption',
    colSpan: 2,
    rowSpan: 2,
    audience: ['system-admin']
  },
  {
    id: 'w-recent-org-activity',
    type: 'recent_org_activity',
    title: 'Recent Organization Activity',
    subtitle: 'System-logged lifecycle events & status updates',
    colSpan: 2,
    rowSpan: 2,
    audience: ['system-admin'],
    config: {
      maxItems: 10
    }
  },
  {
    id: 'w-top-orgs-by-lms',
    type: 'top_orgs_by_lms',
    title: 'Organizations by LMS Count',
    subtitle: 'Top enterprise organizations ranked by active LMS instances',
    colSpan: 2,
    rowSpan: 2,
    audience: ['system-admin'],
    config: {
      maxItems: 5
    }
  },
  {
    id: 'w-org-broadcast-banner',
    type: 'org_broadcast_banner',
    title: 'Platform Notice',
    subtitle: 'System Announcement',
    colSpan: 4,
    rowSpan: 1,
    audience: ['system-admin'],
    config: {
      bannerText: '⚡ System Maintenance Window scheduled for Sunday 02:00 UTC. All multi-tenant services will remain active with read-only database replication.',
      bannerType: 'indigo'
    }
  }
];

export const DEFAULT_ORG_DASHBOARD_LAYOUT: OrgDashboardLayout = {
  version: 1,
  publishedAt: '2026-08-24T12:00:00.000Z',
  publishedBy: 'System Administrator',
  widgets: DEFAULT_ORG_DASHBOARD_WIDGETS
};

export const ORG_DASHBOARD_PRESETS: OrgDashboardPreset[] = [
  {
    id: 'preset-platform-overview',
    name: 'Platform Overview',
    description: 'KPI Matrix, Status Distribution & Platform Capacity',
    icon: 'grid_view',
    badge: 'Popular',
    widgetTemplates: [
      { type: 'org_kpi_summary', colSpan: 4, rowSpan: 1 },
      { type: 'org_status_breakdown', colSpan: 2, rowSpan: 2 },
      { type: 'platform_capacity_overview', colSpan: 2, rowSpan: 2 },
      { type: 'top_orgs_by_lms', colSpan: 4, rowSpan: 2 }
    ]
  },
  {
    id: 'preset-activity-monitor',
    name: 'Activity Monitor',
    description: 'Live Activity Stream, Status Breakdown & Broadcast Banner',
    icon: 'timeline',
    badge: 'Operations',
    widgetTemplates: [
      { type: 'org_broadcast_banner', colSpan: 4, rowSpan: 1 },
      { type: 'org_kpi_summary', colSpan: 4, rowSpan: 1 },
      { type: 'recent_org_activity', colSpan: 2, rowSpan: 3 },
      { type: 'org_status_breakdown', colSpan: 2, rowSpan: 3 }
    ]
  },
  {
    id: 'preset-capacity-watch',
    name: 'Capacity Watch',
    description: 'Platform Capacity, Resource Allocation Leaderboard & KPIs',
    icon: 'dns',
    badge: 'Infrastructure',
    widgetTemplates: [
      { type: 'org_kpi_summary', colSpan: 4, rowSpan: 1 },
      { type: 'platform_capacity_overview', colSpan: 2, rowSpan: 2 },
      { type: 'resource_allocation_leaderboard', colSpan: 2, rowSpan: 2 },
      { type: 'timezone_distribution', colSpan: 4, rowSpan: 2 }
    ]
  },
  {
    id: 'preset-full-overview',
    name: 'Full Enterprise Matrix',
    description: 'Complete 6-widget standard layout with all platform metrics',
    icon: 'dashboard',
    badge: 'Complete',
    widgetTemplates: [
      { type: 'org_kpi_summary', colSpan: 4, rowSpan: 1 },
      { type: 'org_status_breakdown', colSpan: 2, rowSpan: 2 },
      { type: 'platform_capacity_overview', colSpan: 2, rowSpan: 2 },
      { type: 'recent_org_activity', colSpan: 2, rowSpan: 2 },
      { type: 'top_orgs_by_lms', colSpan: 2, rowSpan: 2 },
      { type: 'org_broadcast_banner', colSpan: 4, rowSpan: 1 }
    ]
  }
];
