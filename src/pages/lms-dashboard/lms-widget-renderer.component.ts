import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { LmsDashboardWidget } from '../../models/lms-dashboard.model';
import { LmsInstance, LmsDraft, LmsStatus } from '../../models/lms-instance.model';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { Kpi } from '../../models/dashboard.model';

@Component({
  selector: 'app-lms-widget-renderer',
  imports: [CommonModule, RouterModule, FormsModule, KpiCardComponent],
  templateUrl: './lms-widget-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LmsWidgetRendererComponent {
  widget = input.required<LmsDashboardWidget>();
  isBuilderMode = input<boolean>(false);

  // Studio Action Events
  editWidget = output<LmsDashboardWidget>();
  removeWidget = output<string>();
  duplicateWidget = output<LmsDashboardWidget>();
  moveUp = output<string>();
  moveDown = output<string>();
  changeColSpan = output<{ id: string; colSpan: 1 | 2 | 3 | 4 }>();
  changeRowSpan = output<{ id: string; rowSpan: 1 | 2 | 3 | 4 }>();
  changeDimensions = output<{ id: string; colSpan: 1 | 2 | 3 | 4; rowSpan: 1 | 2 | 3 | 4 }>();

  // Card click / Details event
  openLmsDetails = output<LmsInstance>();
  confirmDeleteDraft = output<LmsDraft>();

  lms = inject(LmsDataService);
  private router = inject(Router);

  // Corner drag-resize state
  isResizing = signal<boolean>(false);
  previewColSpan = signal<1 | 2 | 3 | 4>(2);
  previewRowSpan = signal<1 | 2 | 3 | 4>(2);

  // Interactive filters inside widgets
  kpiPeriod = signal<'30d' | 'quarter' | 'ytd'>('30d');
  activityFilter = signal<string>('all');
  adminSearch = signal<string>('');
  dismissedBanner = signal<boolean>(false);

  // Active Organization Info
  activeTenant = this.lms.activeTenant;

  // Active Org Capacity Snapshot (§4.1)
  capacity = computed(() => this.lms.activeOrgCapacitySnapshot());

  dbUsedPct = computed(() => {
    const cap = this.capacity();
    if (!cap.dbTotalGb) return 0;
    return Math.min(100, Math.round((cap.dbUsedGb / cap.dbTotalGb) * 100));
  });

  fileUsedPct = computed(() => {
    const cap = this.capacity();
    if (!cap.fileTotalGb) return 0;
    return Math.min(100, Math.round((cap.fileUsedGb / cap.fileTotalGb) * 100));
  });

  // Active Drafts
  activeDrafts = computed(() => this.lms.activeOrgLmsDrafts());

  // Status Summary
  statusSummary = computed(() => this.lms.lmsStatusSummary());

  // 0. KPI Items Computation for lms_kpi_summary (§2.2)
  kpiItems = computed<Kpi[]>(() => {
    const summary = this.statusSummary();
    const period = this.kpiPeriod();
    const isEmpty = summary.total === 0;

    const periodSubtext = period === '30d' ? 'vs last 30 days' : period === 'quarter' ? 'vs last quarter' : 'vs prior year';
    const totalTrend = isEmpty 
      ? '+0 this period' 
      : (period === '30d' ? '+1 this month' : period === 'quarter' ? '+3 this quarter' : '+5 this year');

    return [
      {
        title: 'Total LMS Instances',
        value: summary.total.toString(),
        change: totalTrend,
        icon: 'server',
        color: 'indigo',
        subtext: periodSubtext
      },
      {
        title: 'Active LMS',
        value: summary.active.toString(),
        change: isEmpty ? '0% of total' : `+${summary.activePct}% of total`,
        icon: 'check',
        color: 'emerald',
        subtext: 'Operational & Provisioned'
      },
      {
        title: 'Under Processing',
        value: summary.underProcessing.toString(),
        change: `${summary.underProcessing} pending`,
        icon: 'pending',
        color: 'amber',
        subtext: 'Awaiting activation'
      },
      {
        title: 'Drafted',
        value: summary.drafted.toString(),
        change: `${summary.drafted} in wizard`,
        icon: 'draft',
        color: 'indigo',
        subtext: 'Pending completion'
      }
    ];
  });

  // Recent Activity Feed
  filteredActivities = computed(() => {
    const feed = this.lms.recentLmsActivityFeed();
    const filter = this.activityFilter();
    const max = this.widget().config?.maxItems || 8;

    let list = feed;
    if (filter !== 'all') {
      list = list.filter(item => item.type === filter);
    }
    return list.slice(0, max);
  });

  // Top LMS Instances Snapshot
  topInstances = computed(() => {
    const list = this.lms.topLmsInstancesSnapshot();
    const max = this.widget().config?.maxItems || 4;
    return list.slice(0, max);
  });

  // Programme Distribution
  programmeDistribution = computed(() => this.lms.lmsProgrammeDistribution());

  // Admin Roster Filtered
  filteredAdminRoster = computed(() => {
    const roster = this.lms.lmsAdminRoster();
    const q = this.adminSearch().toLowerCase().trim();
    if (!q) return roster;
    return roster.filter(a => 
      a.adminName.toLowerCase().includes(q) || 
      a.email.toLowerCase().includes(q) ||
      a.lmsNames.some(n => n.toLowerCase().includes(q))
    );
  });

  // Total instances count for organization
  totalLmsCount = computed(() => this.lms.activeOrgLmsInstances().length);

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
      const newColSpan = Math.max(1, Math.min(4, initialColSpan + colDiff)) as 1 | 2 | 3 | 4;

      const rowDiff = Math.round(deltaY / rowStep);
      const newRowSpan = Math.max(1, Math.min(4, initialRowSpan + rowDiff)) as 1 | 2 | 3 | 4;

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

  // Navigation and actions
  navigateToCreateLms() {
    this.router.navigate(['/lms/create']);
  }

  resumeDraft(draftId: string, event?: Event) {
    if (event) event.stopPropagation();
    this.router.navigate(['/lms/create'], { queryParams: { draftId } });
  }

  requestDeleteDraft(draft: LmsDraft, event?: Event) {
    if (event) event.stopPropagation();
    this.confirmDeleteDraft.emit(draft);
  }

  navigateToLmsGrid(filterStatus?: string) {
    this.router.navigate(['/lms']);
  }

  onCardClick(instance: LmsInstance) {
    this.openLmsDetails.emit(instance);
  }

  getStatusBadgeClass(status: LmsStatus): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Under Processing':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'Drafted':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'Deactivated':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-base-200 text-text-secondary border-base-300';
    }
  }

  formatStepName(step?: string): string {
    if (!step) return 'STEP: BASIC-INFO';
    return `STEP: ${step.toUpperCase().replace('-', '_')}`;
  }
}
