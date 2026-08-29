import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { Tenant, TenantPlan, TenantStatus } from '../../models/lms.model';
import { OrganizationDraft } from '../../models/organization.model';

export interface OrgGridFilters {
  status: TenantStatus[];
  createdDateFrom: string;
  createdDateTo: string;
}

@Component({
  selector: 'app-tenants',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tenants.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantsComponent {
  lms = inject(LmsDataService);
  private router = inject(Router);

  // 1. Search Query (Search by Name, ID, Domain, City/District, Admin)
  searchQuery = signal<string>('');
  selectedPlanFilter = signal<string>('All Plans');
  selectedStatusFilter = signal<string>('All Statuses');

  // 2. View Mode (Grid vs Table)
  viewMode = signal<'grid' | 'table'>('grid');

  // 3. Filter Panel State (Status + Created Date Range)
  isFilterPanelOpen = signal<boolean>(false);

  draftFilters = signal<OrgGridFilters>({
    status: [],
    createdDateFrom: '',
    createdDateTo: '',
  });

  appliedFilters = signal<OrgGridFilters>({
    status: [],
    createdDateFrom: '',
    createdDateTo: '',
  });

  // 4. Modal inspection and editing
  selectedTenant = signal<Tenant | null>(null);
  editingTenant = signal<Tenant | null>(null);
  activatingTenant = signal<Tenant | null>(null);
  isActivatingInProgress = signal<boolean>(false);

  // 5. Pagination & Infinite Display
  displayedCount = signal<number>(6);
  pageSizeIncrement = 6;
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  // Status options
  statusOptions: TenantStatus[] = ['Active', 'In-Progress', 'Suspended', 'Trial'];

  // Active Drafts
  activeDrafts = computed(() => this.lms.organizationDrafts());

  // Check if any filter panel filters are active
  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return f.status.length > 0 || !!f.createdDateFrom || !!f.createdDateTo;
  });

  // Is reset button visible
  isResetVisible = computed<boolean>(() => {
    return !!this.searchQuery().trim() || this.hasActiveFilters() || this.selectedPlanFilter() !== 'All Plans' || this.selectedStatusFilter() !== 'All Statuses';
  });

  // Active filter count
  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    let count = f.status.length;
    if (f.createdDateFrom || f.createdDateTo) count++;
    if (this.selectedPlanFilter() !== 'All Plans') count++;
    if (this.selectedStatusFilter() !== 'All Statuses') count++;
    return count;
  });

  // -------------------------------------------------------------------------
  // FILTERING & SORTING LOGIC
  // -------------------------------------------------------------------------
  filteredAndSortedTenants = computed<Tenant[]>(() => {
    const list = this.lms.tenants();
    const query = this.searchQuery().toLowerCase().trim();
    const filters = this.appliedFilters();
    const plan = this.selectedPlanFilter();
    const statusQuick = this.selectedStatusFilter();

    const filtered = list.filter(t => {
      // 1. Search Query
      if (query) {
        const matchSearch = 
          t.name.toLowerCase().includes(query) || 
          t.domain.toLowerCase().includes(query) || 
          t.slug.toLowerCase().includes(query) ||
          (t.numericId && t.numericId.toLowerCase().includes(query)) ||
          (t.id && t.id.toLowerCase().includes(query)) ||
          (t.adminInfo?.adminName && t.adminInfo.adminName.toLowerCase().includes(query)) ||
          (t.adminInfo?.contactEmail && t.adminInfo.contactEmail.toLowerCase().includes(query)) ||
          (t.adminEmail && t.adminEmail.toLowerCase().includes(query)) ||
          (t.address?.division && t.address.division.toLowerCase().includes(query)) ||
          (t.address?.district && t.address.district.toLowerCase().includes(query));

        if (!matchSearch) return false;
      }

      // Quick Plan filter from toolbar
      if (plan !== 'All Plans') {
        if (t.plan !== plan) return false;
      }

      // Quick Status filter from toolbar
      if (statusQuick !== 'All Statuses') {
        if (statusQuick === 'Active' && t.status !== 'Active') return false;
        if (statusQuick === 'In-Progress' && (t.status !== 'In-Progress' && t.status !== 'Trial')) return false;
        if (statusQuick === 'Suspended' && t.status !== 'Suspended') return false;
      }

      // 2. Panel Status Multi-select Filter
      if (filters.status.length > 0) {
        if (filters.status.includes('Suspended') && t.status === 'Trial') {
          // Allow Trial in suspended category if selected
        } else if (!filters.status.includes(t.status)) {
          return false;
        }
      }

      // 3. Date Range Filter
      if (filters.createdDateFrom) {
        const itemDate = t.createdAt ? new Date(t.createdAt).getTime() : 0;
        const start = new Date(filters.createdDateFrom).getTime();
        if (itemDate < start) return false;
      }
      if (filters.createdDateTo) {
        const itemDate = t.createdAt ? new Date(t.createdAt).getTime() : 0;
        const end = new Date(filters.createdDateTo).getTime() + (24 * 60 * 60 * 1000 - 1);
        if (itemDate > end) return false;
      }

      return true;
    });

    // Sort: Active workspace pinned first to ensure it's on page 1, then latest created first
    const activeId = this.lms.activeTenantId();
    return filtered.sort((a, b) => {
      const isAActive = a.id === activeId;
      const isBActive = b.id === activeId;
      if (isAActive && !isBActive) return -1;
      if (!isAActive && isBActive) return 1;

      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;
      return dateB - dateA;
    });
  });

  visibleTenants = computed<Tenant[]>(() => {
    return this.paginatedTenants();
  });

  startItemIndex = computed(() => {
    if (this.filteredAndSortedTenants().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endItemIndex = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.filteredAndSortedTenants().length);
  });

  hasMoreToLoad = computed<boolean>(() => {
    return this.currentPage() < this.totalPages();
  });

  // Table pagination
  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredAndSortedTenants().length / this.pageSize()));
  });

  paginatedTenants = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAndSortedTenants().slice(start, start + this.pageSize());
  });

  pagesList = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  // Empty state type
  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    const total = this.lms.tenants().length;
    if (total === 0) return 'true_empty';

    if (this.filteredAndSortedTenants().length === 0) {
      if (this.hasActiveFilters()) {
        return 'filter_miss';
      }
      if (this.searchQuery().trim()) {
        return 'search_miss';
      }
      return 'true_empty';
    }

    return 'none';
  });

  // -------------------------------------------------------------------------
  // ACTIONS & HANDLERS
  // -------------------------------------------------------------------------
  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.displayedCount.set(6);
    this.currentPage.set(1);
  }

  toggleFilterPanel() {
    if (!this.isFilterPanelOpen()) {
      this.draftFilters.set(JSON.parse(JSON.stringify(this.appliedFilters())));
    }
    this.isFilterPanelOpen.update(v => !v);
  }

  closeFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  toggleStatusDraft(st: TenantStatus) {
    this.draftFilters.update(f => {
      const exists = f.status.includes(st);
      const next = exists ? f.status.filter(s => s !== st) : [...f.status, st];
      return { ...f, status: next };
    });
  }

  setDateFromDraft(dateStr: string) {
    this.draftFilters.update(f => ({ ...f, createdDateFrom: dateStr }));
  }

  setDateToDraft(dateStr: string) {
    this.draftFilters.update(f => ({ ...f, createdDateTo: dateStr }));
  }

  applyFilterPanel() {
    this.appliedFilters.set(JSON.parse(JSON.stringify(this.draftFilters())));
    this.isFilterPanelOpen.set(false);
    this.displayedCount.set(6);
    this.currentPage.set(1);
    this.lms.showToast(`Applied ${this.activeFilterCount()} filter criteria`, 'info');
  }

  clearFilterPanelDraft() {
    this.draftFilters.set({
      status: [],
      createdDateFrom: '',
      createdDateTo: '',
    });
  }

  removeStatusFilter(st: TenantStatus) {
    this.appliedFilters.update(f => ({ ...f, status: f.status.filter(s => s !== st) }));
    this.draftFilters.update(f => ({ ...f, status: f.status.filter(s => s !== st) }));
  }

  removeDateRangeFilter() {
    this.appliedFilters.update(f => ({ ...f, createdDateFrom: '', createdDateTo: '' }));
    this.draftFilters.update(f => ({ ...f, createdDateFrom: '', createdDateTo: '' }));
  }

  resetGrid() {
    this.searchQuery.set('');
    this.selectedPlanFilter.set('All Plans');
    this.selectedStatusFilter.set('All Statuses');
    this.appliedFilters.set({
      status: [],
      createdDateFrom: '',
      createdDateTo: '',
    });
    this.draftFilters.set({
      status: [],
      createdDateFrom: '',
      createdDateTo: '',
    });
    this.displayedCount.set(6);
    this.currentPage.set(1);
    this.isFilterPanelOpen.set(false);
    this.lms.showToast('Reset filters to default view', 'info');
  }

  loadMore() {
    this.displayedCount.update(c => c + this.pageSizeIncrement);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  // Details Modal
  openTenantDetails(tenant: Tenant) {
    this.selectedTenant.set(tenant);
  }

  closeTenantDetails() {
    this.selectedTenant.set(null);
  }

  selectTenant(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.lms.switchTenant(id);
    this.lms.showToast(`Switched active workspace to "${this.lms.activeTenant().name}"`, 'success');
  }

  manageOrgLms(tenantId: string, event: Event) {
    event.stopPropagation();
    this.lms.switchTenant(tenantId);
    this.router.navigate(['/lms']);
  }

  createOrgLms(tenantId: string, event: Event) {
    event.stopPropagation();
    this.lms.switchTenant(tenantId);
    this.router.navigate(['/lms/create']);
  }

  toggleStatus(id: string, event: Event) {
    event.stopPropagation();
    this.lms.toggleTenantStatus(id);
  }

  // Activation Flow
  requestActivation(tenant: Tenant, event?: Event) {
    if (event) event.stopPropagation();
    this.activatingTenant.set(tenant);
  }

  cancelActivation() {
    this.activatingTenant.set(null);
  }

  confirmActivation() {
    const target = this.activatingTenant();
    if (!target) return;

    this.isActivatingInProgress.set(true);

    setTimeout(() => {
      this.lms.toggleTenantStatus(target.id);
      this.isActivatingInProgress.set(false);
      this.activatingTenant.set(null);

      // Refresh inspected tenant if open
      if (this.selectedTenant()?.id === target.id) {
        const updated = this.lms.tenants().find(t => t.id === target.id);
        if (updated) this.selectedTenant.set(updated);
      }

      this.lms.showToast(`${target.name} is activated`, 'success', 5000, 'Organization Activated');
    }, 600);
  }

  openCreateWizard() {
    if (!this.lms.isSystemAdmin()) {
      this.lms.showToast('Access Denied: SYS_ADMIN realm role required to create organizations.', 'warning');
      return;
    }
    this.router.navigate(['/tenants/create']);
  }

  resumeDraft(draftId: string, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.lms.isSystemAdmin()) {
      this.lms.showToast('Access Denied: SYS_ADMIN realm role required to resume drafts.', 'warning');
      return;
    }
    this.router.navigate(['/tenants/create'], { queryParams: { draftId } });
  }

  deleteDraft(draftId: string, event: Event) {
    event.stopPropagation();
    if (!this.lms.isSystemAdmin()) {
      this.lms.showToast('Access Denied: SYS_ADMIN realm role required to delete drafts.', 'warning');
      return;
    }
    this.lms.deleteOrganizationDraft(draftId);
    this.lms.showToast(`Draft ID ${draftId} removed`, 'info');
  }

  openEditModal(tenant: Tenant, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.lms.isSystemAdmin()) {
      this.lms.showToast('Access Denied: SYS_ADMIN realm role required to edit organizations.', 'warning');
      return;
    }
    this.router.navigate(['/tenants/create'], { queryParams: { editOrgId: tenant.id } });
  }

  saveTenantEdit() {
    const tenant = this.editingTenant();
    if (tenant) {
      this.lms.updateTenant(tenant);
      if (this.selectedTenant()?.id === tenant.id) {
        this.selectedTenant.set(tenant);
      }
      this.editingTenant.set(null);
      this.lms.showToast(`Updated organization "${tenant.name}"`, 'success');
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      case 'In-Progress':
      case 'Under Processing':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-400 dark:border-amber-700';
      case 'Drafted':
      case 'Suspended':
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600';
      case 'Deactivated':
      case 'Inactive':
      case 'Trial':
      default:
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    }
  }

  getSharingModeText(tenant: Tenant): string {
    const mode = tenant.resourceAllocation?.dataSharingMode;
    if (mode === 'No – Segregated' || tenant.id === 'tenant-stanford' || tenant.id === 'tenant-finedge') {
      return 'No – Segregated';
    }
    if (mode === 'Custom' || tenant.id === 'tenant-apexhealth') {
      return 'Custom';
    }
    return 'Yes – Shared';
  }

  getLearnerUsagePct(tenant: Tenant): number {
    const used = tenant.stats.seatsUsed || tenant.stats.totalLearners || 0;
    const limit = tenant.stats.seatLimit || 1;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  getProgressBarColor(tenant: Tenant): string {
    if (tenant.id === this.lms.activeTenantId() || tenant.id === 'tenant-brac') {
      return '#ec008c'; // Official BRAC Pantone Magenta
    }
    if (tenant.id === 'tenant-lumina') {
      return '#06b6d4'; // Cyan
    }
    if (tenant.id === 'tenant-acme') {
      return '#7c3aed'; // Violet / purple
    }
    if (tenant.id === 'tenant-stanford') {
      return '#dc2626'; // Red
    }
    if (tenant.id === 'tenant-apexhealth') {
      return '#059669'; // Emerald
    }
    if (tenant.id === 'tenant-finedge') {
      return '#4f46e5'; // Indigo
    }
    return tenant.branding.primaryColor || '#ec008c';
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  createNewLmsForOrg(tenant: Tenant, event?: Event) {
    if (event) event.stopPropagation();
    this.router.navigate(['/lms/create'], { queryParams: { orgId: tenant.id } });
  }

  togglePauseOrg(tenant: Tenant, event?: Event) {
    if (event) event.stopPropagation();
    const newStatus: TenantStatus = tenant.status === 'Active' ? 'Suspended' : 'Active';
    this.lms.updateTenant({ ...tenant, status: newStatus });
    this.lms.showToast(`Organization "${tenant.name}" status updated to ${newStatus}`, 'info');
  }

  getLmsCountForTenant(tenantId: string): number {
    return this.lms.lmsInstances().filter(i => i.organizationId === tenantId).length;
  }
}

