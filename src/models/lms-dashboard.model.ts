export type LmsDashboardWidgetType =
  | 'org_capacity'
  | 'active_lms_drafts'
  | 'lms_status_breakdown'
  | 'recent_lms_activity'
  | 'lms_snapshot_cards'
  | 'quick_lms_actions'
  | 'programme_distribution'
  | 'lms_admin_roster'
  | 'lms_broadcast_banner';

export type LmsWidgetCategory = 'capacity' | 'drafts' | 'status-activity' | 'instances' | 'operational';

export interface LmsDashboardWidgetConfig {
  bannerText?: string;
  bannerType?: 'info' | 'warning' | 'success' | 'indigo';
  chartType?: 'donut' | 'bar' | 'cards';
  maxItems?: number;
  showTrend?: boolean;
  highlightStatus?: string;
  showSummaryBadge?: boolean;
  sortBy?: 'recent' | 'usage' | 'name';
}

export interface LmsDashboardWidget {
  id: string;
  type: LmsDashboardWidgetType;
  title: string;
  subtitle?: string;
  colSpan: 1 | 2 | 3 | 4; // 1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%
  rowSpan?: 1 | 2 | 3 | 4; // 1 = 1x (~180px), 2 = 2x (~340px), 3 = 3x (~500px), 4 = 4x (~660px)
  heightPx?: number;
  audience?: string[]; // e.g. ['org-admin']
  config?: LmsDashboardWidgetConfig;
}

export interface LmsDashboardLayout {
  version: number;
  publishedAt: string;
  publishedBy: string;
  lastEditedAt?: string;
  widgets: LmsDashboardWidget[];
}

export interface LmsWidgetCatalogItem {
  id: string;
  type: LmsDashboardWidgetType;
  name: string;
  category: LmsWidgetCategory;
  categoryLabel: string;
  defaultWidthPct: 25 | 50 | 75 | 100;
  defaultColSpan: 1 | 2 | 3 | 4;
  defaultRowSpan: 1 | 2 | 3 | 4;
  icon: string;
  description: string;
  badge?: string;
}

export interface LmsDashboardPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge?: string;
  widgetTemplates: {
    type: LmsDashboardWidgetType;
    colSpan: 1 | 2 | 3 | 4;
    rowSpan: 1 | 2 | 3 | 4;
  }[];
}

export const LMS_WIDGET_CATALOG: LmsWidgetCatalogItem[] = [
  {
    id: 'cat-org-capacity',
    type: 'org_capacity',
    name: 'Organization Capacity',
    category: 'capacity',
    categoryLabel: 'Capacity & Resources',
    defaultWidthPct: 100,
    defaultColSpan: 4,
    defaultRowSpan: 1,
    icon: 'storage',
    badge: 'Core',
    description: 'Organization-scoped resource quota (DB and File Storage) shared across all internal LMS instances.'
  },
  {
    id: 'cat-active-lms-drafts',
    type: 'active_lms_drafts',
    name: 'Active LMS Creation Drafts',
    category: 'drafts',
    categoryLabel: 'Drafts & Creation',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'edit_note',
    badge: 'Drafts',
    description: 'In-progress LMS configuration drafts with last completed step badges, instant Resume wizard, and delete controls.'
  },
  {
    id: 'cat-lms-status-breakdown',
    type: 'lms_status_breakdown',
    name: 'LMS Status Breakdown',
    category: 'status-activity',
    categoryLabel: 'Status & Metrics',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'pie_chart',
    badge: 'KPIs',
    description: 'Status breakdown across the 4 verified states: Active, Under Processing, Drafted, and Deactivated.'
  },
  {
    id: 'cat-recent-lms-activity',
    type: 'recent_lms_activity',
    name: 'Recent LMS Activity',
    category: 'status-activity',
    categoryLabel: 'Status & Metrics',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'history',
    badge: 'Audit',
    description: 'Chronological timeline of LMS creation, activations, updates, and status changes scoped to this Organization.'
  },
  {
    id: 'cat-lms-snapshot-cards',
    type: 'lms_snapshot_cards',
    name: 'LMS Instances Snapshot',
    category: 'instances',
    categoryLabel: 'Instances & Directory',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'layers',
    badge: 'Preview',
    description: 'Compact 3–4 card preview of recently created or high-usage LMS instances with shortcut to full LMS Grid.'
  },
  {
    id: 'cat-quick-lms-actions',
    type: 'quick_lms_actions',
    name: 'Executive LMS Dispatcher',
    category: 'operational',
    categoryLabel: 'Operations',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 1,
    icon: 'bolt',
    badge: 'Shortcuts',
    description: 'One-click shortcuts to create an LMS instance, resume saved drafts, or manage organization storage.'
  },
  {
    id: 'cat-programme-distribution',
    type: 'programme_distribution',
    name: 'Programme / Department Matrix',
    category: 'instances',
    categoryLabel: 'Instances & Directory',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'account_tree',
    description: 'Distribution of specialized LMS portals across departments and operational programmes.'
  },
  {
    id: 'cat-lms-admin-roster',
    type: 'lms_admin_roster',
    name: 'LMS Administrator Roster',
    category: 'instances',
    categoryLabel: 'Instances & Directory',
    defaultWidthPct: 50,
    defaultColSpan: 2,
    defaultRowSpan: 2,
    icon: 'badge',
    description: 'Designated LMS administrators across portals with contact credentials and invite status.'
  },
  {
    id: 'cat-lms-broadcast-banner',
    type: 'lms_broadcast_banner',
    name: 'Organization Broadcast Notice',
    category: 'operational',
    categoryLabel: 'Operations',
    defaultWidthPct: 100,
    defaultColSpan: 4,
    defaultRowSpan: 1,
    icon: 'campaign',
    badge: 'Notice',
    description: 'Organization-wide alert banner for system updates, compliance announcements, and maintenance alerts.'
  }
];

export const DEFAULT_LMS_DASHBOARD_WIDGETS: LmsDashboardWidget[] = [
  {
    id: 'w-org-capacity-main',
    type: 'org_capacity',
    title: 'Organization Capacity',
    subtitle: 'Resource quota allocated by platform operators, shared across all internal LMS instances',
    colSpan: 4,
    rowSpan: 1,
    audience: ['org-admin']
  },
  {
    id: 'w-active-drafts-main',
    type: 'active_lms_drafts',
    title: 'Active LMS Creation Drafts',
    subtitle: 'Unsaved configuration progress',
    colSpan: 2,
    rowSpan: 2,
    audience: ['org-admin']
  },
  {
    id: 'w-status-breakdown-main',
    type: 'lms_status_breakdown',
    title: 'LMS Status Breakdown',
    subtitle: 'Active, Under Processing, Drafted & Deactivated instances',
    colSpan: 2,
    rowSpan: 2,
    audience: ['org-admin'],
    config: {
      chartType: 'cards'
    }
  },
  {
    id: 'w-recent-activity-main',
    type: 'recent_lms_activity',
    title: 'Recent LMS Activity',
    subtitle: 'Real-time alerts and instance lifecycle events',
    colSpan: 2,
    rowSpan: 2,
    audience: ['org-admin'],
    config: {
      maxItems: 8
    }
  },
  {
    id: 'w-snapshot-cards-main',
    type: 'lms_snapshot_cards',
    title: 'LMS Instances Snapshot',
    subtitle: 'Top specialized learning portals for this organization',
    colSpan: 2,
    rowSpan: 2,
    audience: ['org-admin'],
    config: {
      maxItems: 4,
      sortBy: 'recent'
    }
  }
];

export const DEFAULT_LMS_DASHBOARD_LAYOUT: LmsDashboardLayout = {
  version: 1,
  publishedAt: '2026-08-24T12:00:00.000Z',
  publishedBy: 'Organization Administrator',
  widgets: DEFAULT_LMS_DASHBOARD_WIDGETS
};

export const LMS_DASHBOARD_PRESETS: LmsDashboardPreset[] = [
  {
    id: 'preset-lms-standard',
    name: 'Standard Overview',
    description: 'Capacity, Active Drafts, Status Breakdown, Recent Activity & Snapshot',
    icon: 'grid_view',
    badge: 'Recommended',
    widgetTemplates: [
      { type: 'org_capacity', colSpan: 4, rowSpan: 1 },
      { type: 'active_lms_drafts', colSpan: 2, rowSpan: 2 },
      { type: 'lms_status_breakdown', colSpan: 2, rowSpan: 2 },
      { type: 'recent_lms_activity', colSpan: 2, rowSpan: 2 },
      { type: 'lms_snapshot_cards', colSpan: 2, rowSpan: 2 }
    ]
  },
  {
    id: 'preset-lms-capacity-ops',
    name: 'Capacity & Operations',
    description: 'Capacity Card, Status Breakdown, Quick Actions & Recent Activity Feed',
    icon: 'storage',
    badge: 'Operations',
    widgetTemplates: [
      { type: 'org_capacity', colSpan: 4, rowSpan: 1 },
      { type: 'quick_lms_actions', colSpan: 2, rowSpan: 1 },
      { type: 'lms_status_breakdown', colSpan: 2, rowSpan: 1 },
      { type: 'recent_lms_activity', colSpan: 2, rowSpan: 2 },
      { type: 'programme_distribution', colSpan: 2, rowSpan: 2 }
    ]
  },
  {
    id: 'preset-lms-portfolio-drafts',
    name: 'Portfolio & Drafts Focus',
    description: 'Active Drafts, LMS Snapshot Cards, Programme Matrix & Admins',
    icon: 'layers',
    badge: 'Creation',
    widgetTemplates: [
      { type: 'org_capacity', colSpan: 4, rowSpan: 1 },
      { type: 'active_lms_drafts', colSpan: 2, rowSpan: 2 },
      { type: 'lms_snapshot_cards', colSpan: 2, rowSpan: 2 },
      { type: 'programme_distribution', colSpan: 2, rowSpan: 2 },
      { type: 'lms_admin_roster', colSpan: 2, rowSpan: 2 }
    ]
  },
  {
    id: 'preset-lms-executive',
    name: 'Executive Complete Hub',
    description: 'Comprehensive 7-widget layout featuring all LMS intelligence panels',
    icon: 'dashboard',
    badge: 'Complete',
    widgetTemplates: [
      { type: 'lms_broadcast_banner', colSpan: 4, rowSpan: 1 },
      { type: 'org_capacity', colSpan: 4, rowSpan: 1 },
      { type: 'active_lms_drafts', colSpan: 2, rowSpan: 2 },
      { type: 'lms_status_breakdown', colSpan: 2, rowSpan: 2 },
      { type: 'lms_snapshot_cards', colSpan: 2, rowSpan: 2 },
      { type: 'recent_lms_activity', colSpan: 2, rowSpan: 2 },
      { type: 'programme_distribution', colSpan: 4, rowSpan: 2 }
    ]
  }
];
