import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { OrgDashboardWidget } from '../../models/organization-dashboard.model';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { Kpi } from '../../models/dashboard.model';
import { Tenant } from '../../models/lms.model';

@Component({
  selector: 'app-org-widget-renderer',
  imports: [CommonModule, RouterModule, FormsModule, KpiCardComponent],
  templateUrl: './org-widget-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgWidgetRendererComponent {
  widget = input.required<OrgDashboardWidget>();
  isBuilderMode = input<boolean>(false);

  // Studio Events
  editWidget = output<OrgDashboardWidget>();
  removeWidget = output<string>();
  duplicateWidget = output<OrgDashboardWidget>();
  moveUp = output<string>();
  moveDown = output<string>();
  changeColSpan = output<{ id: string; colSpan: 1 | 2 | 3 | 4 }>();
  changeRowSpan = output<{ id: string; rowSpan: 1 | 2 | 3 | 4 }>();
  changeDimensions = output<{ id: string; colSpan: 1 | 2 | 3 | 4; rowSpan: 1 | 2 | 3 | 4 }>();

  lms = inject(LmsDataService);
  private router = inject(Router);

  // Corner resize internal state
  isResizing = signal<boolean>(false);
  previewColSpan = signal<1 | 2 | 3 | 4>(2);
  previewRowSpan = signal<1 | 2 | 3 | 4>(2);

  // Widget interactive filters
  kpiPeriod = signal<'30d' | 'quarter' | 'ytd'>('30d');
  statusFilter = signal<string>('all');
  activityFilter = signal<string>('all');
  directorySearch = signal<string>('');
  dismissedBanner = signal<boolean>(false);

  showToast(msg: string) {
    this.lms.showToast(msg, 'info');
  }

  // Corner Resize Handler (Smooth interactive drag resizing)
  startCornerResize(event: MouseEvent, cardEl: HTMLElement) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const initialColSpan = this.widget().colSpan || 2;
    const initialRowSpan = this.widget().rowSpan || 2;
    const rect = cardEl.getBoundingClientRect();
    const colStep = rect.width / initialColSpan;
    const rowStep = 150;

    this.isResizing.set(true);
    this.previewColSpan.set(initialColSpan);
    this.previewRowSpan.set(initialRowSpan);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const colDiff = Math.round(deltaX / Math.max(colStep * 0.7, 100));
      let newColSpan = Math.max(1, Math.min(4, initialColSpan + colDiff)) as 1 | 2 | 3 | 4;

      const rowDiff = Math.round(deltaY / rowStep);
      let newRowSpan = Math.max(1, Math.min(4, initialRowSpan + rowDiff)) as 1 | 2 | 3 | 4;

      this.previewColSpan.set(newColSpan);
      this.previewRowSpan.set(newRowSpan);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const finalCol = this.previewColSpan();
      const finalRow = this.previewRowSpan();
      this.isResizing.set(false);

      if (finalCol !== this.widget().colSpan || finalRow !== (this.widget().rowSpan || 2)) {
        this.changeDimensions.emit({
          id: this.widget().id,
          colSpan: finalCol,
          rowSpan: finalRow
        });
        this.showToast(`Resized to ${finalCol * 25}% width × ${finalRow}x height`);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // 1. KPI Items Computation for org_kpi_summary
  kpiItems = computed<Kpi[]>(() => {
    const summary = this.lms.orgStatusSummary();
    const lmsCount = this.lms.lmsInstances().length;
    const period = this.kpiPeriod();

    const periodLabel = period === '30d' ? 'vs last 30 days' : period === 'quarter' ? 'vs last quarter' : 'vs prior year';

    return [
      {
        title: 'Total Organizations',
        value: summary.total.toString(),
        change: '+2 this month',
        icon: 'building',
        color: 'indigo',
        subtext: periodLabel
      },
      {
        title: 'Active Organizations',
        value: summary.active.toString(),
        change: `${summary.activePct}% of total`,
        icon: 'check',
        color: 'emerald',
        subtext: 'Operational & Provisioned'
      },
      {
        title: 'Total LMS Instances',
        value: lmsCount.toString(),
        change: '+4 new portals',
        icon: 'server',
        color: 'sky',
        subtext: 'Multi-portal roll-up'
      },
      {
        title: 'Draft Organizations',
        value: (summary.draft + summary.inProgress).toString(),
        change: summary.draft > 0 ? `${summary.draft} in wizard` : 'Up to date',
        icon: 'trending',
        color: 'amber',
        subtext: 'Pending activation'
      }
    ];
  });

  // 2. Status Summary Computation
  statusSummary = computed(() => this.lms.orgStatusSummary());

  // 3. Platform Capacity Computation
  platformCapacity = computed(() => this.lms.platformCapacity());

  // Capacity Percentages
  dbUsedPct = computed(() => {
    const cap = this.platformCapacity();
    return Math.min(100, Math.round((cap.dbUsedGb / cap.dbTotalGb) * 100));
  });

  fileUsedPct = computed(() => {
    const cap = this.platformCapacity();
    return Math.min(100, Math.round((cap.fileUsedGb / cap.fileTotalGb) * 100));
  });

  // 4. Activity Feed Filtered
  filteredActivities = computed(() => {
    const feed = this.lms.recentOrgActivityFeed();
    const filter = this.activityFilter();
    const max = this.widget().config?.maxItems || 10;

    let list = feed;
    if (filter !== 'all') {
      list = list.filter(item => item.type === filter);
    }
    return list.slice(0, max);
  });

  // 5. Top Orgs by LMS Filtered
  topOrgsList = computed(() => {
    const list = this.lms.topOrganizationsByLms();
    const max = this.widget().config?.maxItems || 5;
    return list.slice(0, max);
  });

  // 6. Resource Leaderboard
  resourceLeaderboard = computed(() => {
    const list = this.lms.orgResourceLeaderboard();
    const max = this.widget().config?.maxItems || 6;
    return list.slice(0, max);
  });

  // 7. Admin Directory Filtered
  filteredAdminDirectory = computed(() => {
    const list = this.lms.orgAdminDirectoryList();
    const q = this.directorySearch().toLowerCase().trim();
    if (!q) return list;
    return list.filter(a => 
      a.adminName.toLowerCase().includes(q) || 
      a.tenantName.toLowerCase().includes(q) || 
      a.adminEmail.toLowerCase().includes(q)
    );
  });

  // 8. Timezone Distribution
  timezoneList = computed(() => this.lms.orgTimezoneDistribution());

  // Navigation helpers
  navigateToOrg(tenantId: string) {
    this.lms.switchTenant(tenantId);
    this.router.navigate(['/tenants']);
  }

  navigateToOrgLms(tenantId: string) {
    this.lms.switchTenant(tenantId);
    this.router.navigate(['/lms']);
  }

  navigateToOrgCreate() {
    this.router.navigate(['/tenants/create']);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'In-Progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Suspended':
      case 'Inactive':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Draft':
      default:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
  }
}
