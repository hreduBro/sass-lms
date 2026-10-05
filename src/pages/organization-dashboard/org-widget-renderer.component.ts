import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { OrgDashboardWidget } from '../../models/organization-dashboard.model';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { CustomSelectComponent, SelectOption } from '../../components/custom-select/custom-select.component';
import { Kpi } from '../../models/dashboard.model';
import { Tenant } from '../../models/lms.model';

@Component({
  selector: 'app-org-widget-renderer',
  imports: [CommonModule, RouterModule, FormsModule, KpiCardComponent, CustomSelectComponent],
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

  // Role Scoping
  isOrgAdmin = computed(() => this.lms.activeRole() === 'tenant_admin');
  activeOrg = computed(() => this.lms.activeTenant());

  // Scoped LMS instances for active organization
  orgLmsList = computed(() => {
    const tenantId = this.lms.activeTenantId();
    return this.lms.lmsInstances().filter(l => l.organizationId === tenantId);
  });

  // Corner resize internal state
  isResizing = signal<boolean>(false);
  previewColSpan = signal<1 | 2 | 3 | 4>(2);
  previewRowSpan = signal<1 | 2 | 3 | 4>(2);

  // Widget interactive filters
  kpiPeriod = signal<'30d' | 'quarter' | 'ytd'>('30d');
  statusFilter = signal<string>('all');
  activityFilter = signal<string>('all');
  directorySearch = signal<string>('');
  contentFamilyFilter = signal<string>('all');
  dismissedBanner = signal<boolean>(false);

  activityFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Events' },
    { value: 'activated', label: 'Activated' },
    { value: 'deactivated', label: 'Deactivated' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' }
  ];

  contentFamilyOptions: SelectOption[] = [
    { value: 'all', label: 'All Content Types' },
    { value: 'Video', label: 'Videos' },
    { value: 'PDF', label: 'PDF Documents' },
    { value: 'Assessment', label: 'Question Sets / Banks' },
    { value: 'Slides', label: 'Presentations / Slides' }
  ];

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

  // Content Repository Stats for Content Management
  contentStats = computed(() => {
    const items = this.lms.repositoryItems();
    const activeOrgId = this.lms.activeTenantId();
    const isOrg = this.isOrgAdmin();

    const filtered = isOrg 
      ? items.filter(i => !(i as any).organizationId || (i as any).organizationId === activeOrgId || i.owningOrganizationId === activeOrgId || (i as any).sharingLevel === 'Organization' || i.sharingMode === 'Organization-wide' || (i as any).sharingLevel === 'Platform')
      : items;

    const videos = filtered.filter(i => (i.family as any) === 'Video' || (i.type || '').toLowerCase().includes('video')).length;
    const pdfs = filtered.filter(i => (i.family as any) === 'PDF' || (i.type || '').toLowerCase().includes('pdf')).length;
    const slides = filtered.filter(i => (i.family as any) === 'Slides' || (i.type || '').toLowerCase().includes('slide')).length;
    const assessments = filtered.filter(i => i.family === 'Assessment' || (i.type || '').toLowerCase().includes('question') || (i.type || '').toLowerCase().includes('quiz')).length;
    const audio = filtered.filter(i => (i.family as any) === 'Audio' || (i.type || '').toLowerCase().includes('audio')).length;
    const books = filtered.filter(i => (i.family as any) === 'Book' || (i.type || '').toLowerCase().includes('book')).length;
    const shared = filtered.filter(i => (i as any).sharingLevel === 'Organization' || i.sharingMode === 'Organization-wide' || (i as any).sharingLevel === 'Platform').length;

    return {
      total: filtered.length,
      shared,
      local: filtered.length - shared,
      videos,
      pdfs,
      slides,
      assessments,
      audio,
      books,
      items: filtered.slice(0, 8)
    };
  });

  // Courses Summary for Content Management
  coursesSummary = computed(() => {
    const courses = this.lms.courses();
    const isOrg = this.isOrgAdmin();
    const activeLmsIds = this.orgLmsList().map(l => l.id);

    const filtered = isOrg
      ? courses.filter(c => (c as any).lmsId && activeLmsIds.includes((c as any).lmsId))
      : courses;

    const published = filtered.filter(c => (c.status as string) === 'Published' || (c.status as string) === 'published').length;
    const draft = filtered.filter(c => (c.status as string) === 'Draft' || (c.status as string) === 'draft').length;
    const totalEnrollments = filtered.reduce((acc, c) => acc + (c.enrolledCount || (c as any).enrollmentCount || 0), 0);

    return {
      total: filtered.length,
      published,
      draft,
      totalEnrollments,
      courses: filtered.slice(0, 6)
    };
  });

  // 1. KPI Items Computation for org_kpi_summary
  kpiItems = computed<Kpi[]>(() => {
    const period = this.kpiPeriod();
    const periodLabel = period === '30d' ? 'vs last 30 days' : period === 'quarter' ? 'vs last quarter' : 'vs prior year';

    if (this.isOrgAdmin()) {
      const org = this.activeOrg();
      const lmsList = this.orgLmsList();
      const activeLms = lmsList.filter(l => l.status === 'Active').length;
      const draftLms = lmsList.filter(l => l.status !== 'Active').length;
      const allocatedGb = org.resourceAllocation?.fileStorageGb || org.stats?.storageLimitGb || 500;
      const usedGb = org.stats?.storageUsedGb || 120;
      const seatsUsed = org.stats?.seatsUsed || 240;
      const seatLimit = org.stats?.seatLimit || 1000;
      const repoTotal = this.contentStats().total;

      return [
        {
          title: 'LMS Instances',
          value: lmsList.length.toString(),
          change: `${activeLms} Active`,
          icon: 'server',
          color: 'indigo',
          subtext: `${draftLms} Draft / In-Progress`
        },
        {
          title: 'Learner Seats',
          value: `${seatsUsed} / ${seatLimit}`,
          change: `${Math.round((seatsUsed / seatLimit) * 100)}% Allocated`,
          icon: 'users',
          color: 'emerald',
          subtext: `${seatLimit - seatsUsed} Seats Available`
        },
        {
          title: 'Storage Quota',
          value: `${usedGb} / ${allocatedGb} GB`,
          change: `${Math.round((usedGb / allocatedGb) * 100)}% Used`,
          icon: 'database',
          color: 'sky',
          subtext: `${allocatedGb - usedGb} GB Available`
        },
        {
          title: 'Content Repository Assets',
          value: repoTotal.toString(),
          change: `${this.contentStats().shared} Shared Across LMS`,
          icon: 'folder',
          color: 'amber',
          subtext: 'Single Source of Truth'
        }
      ];
    }

    const summary = this.lms.orgStatusSummary();
    const lmsCount = this.lms.lmsInstances().length;

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
  statusSummary = computed(() => {
    if (this.isOrgAdmin()) {
      const lmsList = this.orgLmsList();
      const total = lmsList.length;
      const active = lmsList.filter(l => l.status === 'Active').length;
      const inProgress = lmsList.filter(l => l.status === 'In-Progress' || l.status === 'Under Processing').length;
      const suspended = lmsList.filter(l => l.status === 'Suspended' || (l.status as string) === 'Inactive' || l.status === 'Deactivated').length;
      const draft = lmsList.filter(l => l.status === 'Drafted').length;

      return {
        total,
        active,
        inProgress,
        suspended,
        draft,
        activePct: total > 0 ? Math.round((active / total) * 100) : 0,
        inProgressPct: total > 0 ? Math.round((inProgress / total) * 100) : 0,
        suspendedPct: total > 0 ? Math.round((suspended / total) * 100) : 0,
        draftPct: total > 0 ? Math.round((draft / total) * 100) : 0
      };
    }
    return this.lms.orgStatusSummary();
  });

  // 3. Platform / Org Capacity Computation
  platformCapacity = computed(() => {
    if (this.isOrgAdmin()) {
      const org = this.activeOrg();
      const dbTotalGb = org.resourceAllocation?.databaseSizeGb || 250;
      const dbUsedGb = 45;
      const fileTotalGb = org.resourceAllocation?.fileStorageGb || org.stats?.storageLimitGb || 500;
      const fileUsedGb = org.stats?.storageUsedGb || 120;

      return {
        dbTotalGb,
        dbUsedGb,
        dbAvailableGb: Math.max(0, dbTotalGb - dbUsedGb),
        fileTotalGb,
        fileUsedGb,
        fileAvailableGb: Math.max(0, fileTotalGb - fileUsedGb)
      };
    }
    return this.lms.platformCapacity();
  });

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
    const isOrg = this.isOrgAdmin();
    const orgName = this.activeOrg().name;

    let list = isOrg 
      ? feed.filter(item => item.orgName === orgName || item.orgName === 'Organization')
      : feed;

    if (list.length === 0) {
      list = feed;
    }

    if (filter !== 'all') {
      list = list.filter(item => item.type === filter);
    }
    return list.slice(0, max);
  });

  // 5. Top Orgs / LMS List Filtered
  topOrgsList = computed(() => {
    if (this.isOrgAdmin()) {
      const lmsList = this.orgLmsList();
      const org = this.activeOrg();
      const max = this.widget().config?.maxItems || 6;
      return lmsList.slice(0, max).map(l => ({
        tenant: {
          id: l.id,
          name: l.basicInfo?.lmsName || l.id,
          domain: l.basicInfo?.urlDomain || 'portal.onelms.com',
          status: l.status,
          branding: { logoUrl: org.branding?.logoUrl }
        } as any,
        lmsCount: 1,
        activeLmsCount: l.status === 'Active' ? 1 : 0,
        totalStorageGb: l.resources?.fileStorageGb || 100,
        totalDbGb: l.resources?.databaseSizeGb || 50
      }));
    }

    const list = this.lms.topOrganizationsByLms();
    const max = this.widget().config?.maxItems || 5;
    return list.slice(0, max);
  });

  // 6. Resource Leaderboard
  resourceLeaderboard = computed(() => {
    if (this.isOrgAdmin()) {
      const lmsList = this.orgLmsList();
      const totalAllocDb = this.activeOrg().resourceAllocation?.databaseSizeGb || 250;
      const totalAllocFile = this.activeOrg().resourceAllocation?.fileStorageGb || 500;

      return lmsList.map(l => {
        const dbGb = l.resources?.databaseSizeGb || 25;
        const fileGb = l.resources?.fileStorageGb || 50;
        const threshold = l.resources?.usageAlertThresholdPct || 80;
        return {
          tenant: {
            id: l.id,
            name: l.basicInfo?.lmsName || l.id
          } as any,
          dbGb,
          fileGb,
          totalGb: dbGb + fileGb,
          dbPctOfInfra: Math.round((dbGb / totalAllocDb) * 100 * 10) / 10,
          filePctOfInfra: Math.round((fileGb / totalAllocFile) * 100 * 10) / 10,
          threshold,
          sharingMode: l.resources?.dataSharing?.enabled ? 'Active Shared' : 'Segregated'
        };
      });
    }

    const list = this.lms.orgResourceLeaderboard();
    const max = this.widget().config?.maxItems || 6;
    return list.slice(0, max);
  });

  // 7. Admin Directory Filtered
  filteredAdminDirectory = computed(() => {
    if (this.isOrgAdmin()) {
      const org = this.activeOrg();
      const lmsList = this.orgLmsList();
      const list: any[] = [
        {
          tenantId: org.id,
          tenantNumericId: org.numericId,
          tenantName: org.name,
          adminName: org.adminInfo?.adminName || 'Primary Org Admin',
          adminEmail: org.adminInfo?.contactEmail || org.adminEmail,
          contactNumber: org.adminInfo?.contactNumber || '+880 1700-000000',
          status: org.status,
          division: org.address?.division || 'Headquarters',
          district: org.address?.district || '',
          isVerified: true
        }
      ];

      lmsList.forEach(l => {
        const primaryAdmin = (l as any).adminInfo || (l.admins && l.admins[0]);
        if (primaryAdmin) {
          list.push({
            tenantId: l.id,
            tenantNumericId: 100,
            tenantName: l.basicInfo?.lmsName || l.id,
            adminName: primaryAdmin.adminName || primaryAdmin.name || 'LMS Coordinator',
            adminEmail: primaryAdmin.contactEmail || primaryAdmin.email || 'admin@' + (l.basicInfo?.urlDomain || 'lms.org'),
            contactNumber: primaryAdmin.contactNumber || 'N/A',
            status: l.status,
            division: 'LMS Portal Team',
            district: '',
            isVerified: true
          });
        }
      });

      const q = (this.directorySearch() || '').toLowerCase().trim();
      if (!q) return list;
      return list.filter(a => 
        (a.adminName || '').toLowerCase().includes(q) || 
        (a.tenantName || '').toLowerCase().includes(q) || 
        (a.adminEmail || '').toLowerCase().includes(q)
      );
    }

    const list = this.lms.orgAdminDirectoryList();
    const q = (this.directorySearch() || '').toLowerCase().trim();
    if (!q) return list;
    return list.filter(a => 
      (a.adminName || '').toLowerCase().includes(q) || 
      (a.tenantName || '').toLowerCase().includes(q) || 
      (a.adminEmail || '').toLowerCase().includes(q)
    );
  });

  // 8. Timezone Distribution
  timezoneList = computed(() => this.lms.orgTimezoneDistribution());

  // Navigation helpers
  navigateToOrg(tenantId: string) {
    if (this.isOrgAdmin()) {
      this.router.navigate(['/lms']);
      return;
    }
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

  navigateToContentRepository() {
    this.router.navigate(['/content-repository']);
  }

  navigateToCourses() {
    this.router.navigate(['/courses']);
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
      case 'Drafted':
      default:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
  }
}
