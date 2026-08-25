import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { Tenant } from '../../models/lms.model';
import { OrganizationDraft } from '../../models/organization.model';

@Component({
  selector: 'app-tenants',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tenants.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantsComponent {
  lms = inject(LmsDataService);
  private router = inject(Router);

  searchQuery = signal<string>('');
  planFilter = signal<string>('All');
  statusFilter = signal<string>('All');
  showAddModal = signal<boolean>(false);
  editingTenant = signal<Tenant | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  // Filtered tenants list with multi-field search
  filteredTenants = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const plan = this.planFilter();
    const status = this.statusFilter();

    return this.lms.tenants().filter(t => {
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.numericId && t.numericId.includes(q)) ||
        (t.adminInfo?.adminName && t.adminInfo.adminName.toLowerCase().includes(q)) ||
        (t.address?.division && t.address.division.toLowerCase().includes(q)) ||
        (t.address?.district && t.address.district.toLowerCase().includes(q));

      const matchPlan = plan === 'All' || t.plan === plan;
      const matchStatus = status === 'All' || t.status === status;
      return matchSearch && matchPlan && matchStatus;
    });
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredTenants().length / this.pageSize()));
  });

  paginatedTenants = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredTenants().slice(start, start + this.pageSize());
  });

  pagesList = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  // Global telemetry
  totalLearners = computed(() => this.lms.tenants().reduce((sum, t) => sum + (t.stats?.totalLearners || 0), 0));
  totalSeats = computed(() => this.lms.tenants().reduce((sum, t) => sum + (t.stats?.seatLimit || 0), 0));
  totalStorage = computed(() => this.lms.tenants().reduce((sum, t) => sum + (t.resourceAllocation?.fileStorageGb || t.stats?.storageLimitGb || 0), 0));

  // Active Drafts
  activeDrafts = computed(() => this.lms.organizationDrafts());

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onFilterChange() {
    this.currentPage.set(1);
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

  selectTenant(id: string) {
    this.lms.switchTenant(id);
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

  openCreateWizard() {
    this.router.navigate(['/tenants/create']);
  }

  resumeDraft(draftId: string, event?: Event) {
    if (event) event.stopPropagation();
    this.router.navigate(['/tenants/create'], { queryParams: { draftId } });
  }

  deleteDraft(draftId: string, event: Event) {
    event.stopPropagation();
    this.lms.deleteOrganizationDraft(draftId);
    this.lms.showToast(`Draft ID ${draftId} removed`, 'info');
  }

  openEditModal(tenant: Tenant, event: Event) {
    event.stopPropagation();
    this.editingTenant.set(JSON.parse(JSON.stringify(tenant)));
  }

  saveTenantEdit() {
    const tenant = this.editingTenant();
    if (tenant) {
      this.lms.updateTenant(tenant);
      this.editingTenant.set(null);
      this.lms.showToast(`Updated organization "${tenant.name}"`, 'success');
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'In-Progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Suspended':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Inactive':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }
}
