import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { 
  LmsInstance, 
  LmsDraft, 
  LmsStatus, 
  LmsType, 
  LmsGridFilters, 
  LmsDetailsPermissions 
} from '../../models/lms-instance.model';

@Component({
  selector: 'app-lms-list',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lms-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LmsListComponent {
  lms = inject(LmsDataService);
  private router = inject(Router);

  // 1. Search Query (Strictly searches LMS Name only as specified in §2.2)
  searchQuery = signal<string>('');

  // 2. Filter Panel State
  isFilterPanelOpen = signal<boolean>(false);

  // Temporary filter selections inside panel before clicking "Apply Filter"
  draftFilters = signal<LmsGridFilters>({
    status: [],
    programmeDepartment: [],
    lmsAdmin: '',
    createdDateFrom: null,
    createdDateTo: null,
  });

  // Active applied filters driving the grid
  appliedFilters = signal<LmsGridFilters>({
    status: [],
    programmeDepartment: [],
    lmsAdmin: '',
    createdDateFrom: null,
    createdDateTo: null,
  });

  // Department search inside filter dropdown
  deptSearchQuery = signal<string>('');

  // View Mode: Grid (default) or Table
  viewMode = signal<'grid' | 'table'>('grid');

  // Infinite Scroll / Lazy Load page size & count
  displayedCount = signal<number>(6);
  pageSizeIncrement = 6;

  // Selected LMS for Details / Edit Screen (§4)
  selectedLms = signal<LmsInstance | null>(null);
  isEditingDetails = signal<boolean>(false);

  // Editable Form Model for Details Screen
  editForm = signal<{
    lmsName: string;
    programmeDepartment: string;
    summary: string;
    goal: string;
    urlDomain: string;
    lmsType: LmsType;
    timezone: string;
    databaseSizeGb: number;
    fileStorageGb: number;
    usageAlertThresholdPct: number;
  }>({
    lmsName: '',
    programmeDepartment: '',
    summary: '',
    goal: '',
    urlDomain: '',
    lmsType: 'Private',
    timezone: 'Asia/Dhaka',
    databaseSizeGb: 50,
    fileStorageGb: 100,
    usageAlertThresholdPct: 80
  });

  // Validation errors for Details Edit Form
  formErrors = signal<{
    lmsName?: string;
    programmeDepartment?: string;
    urlDomain?: string;
    databaseSizeGb?: string;
    fileStorageGb?: string;
  }>({});

  // Permissions matrix for Details Screen (§4.2)
  permissions = signal<LmsDetailsPermissions>({
    canEditLmsName: true,
    canEditProgrammeDepartment: true,
    canEditDomain: true,
    canEditLmsType: true,
    canManageResources: true
  });

  // Show Permissions Settings Drawer/Toggle inside Details modal
  showPermissionControls = signal<boolean>(false);

  togglePermissionControls() {
    this.showPermissionControls.update(v => !v);
  }

  togglePermission(key: keyof LmsDetailsPermissions) {
    this.permissions.update(p => ({
      ...p,
      [key]: !p[key]
    }));
  }

  // Activation Confirmation Dialog State (§5)
  activatingLms = signal<LmsInstance | null>(null);
  isActivatingInProgress = signal<boolean>(false);

  // Available Status Options (§6.4)
  statusOptions: LmsStatus[] = ['Active', 'Under Processing', 'Drafted', 'Deactivated'];

  // Available Departments for active Organization (§2.3)
  allDepartments = computed(() => this.lms.getOrganizationDepartments());

  filteredDepartmentsList = computed(() => {
    const q = this.deptSearchQuery().toLowerCase().trim();
    if (!q) return this.allDepartments();
    return this.allDepartments().filter(d => d.toLowerCase().includes(q));
  });

  // Available LMS Admins for active Organization (§2.3)
  allLmsAdmins = computed(() => this.lms.getOrgLmsAdmins());

  // Capacity snapshot for active organization
  capacity = computed(() => this.lms.activeOrgCapacitySnapshot());

  // Active drafts for current org
  activeDrafts = computed(() => this.lms.activeOrgLmsDrafts());

  // Check if any filters are active
  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return f.status.length > 0 || 
           f.programmeDepartment.length > 0 || 
           !!f.lmsAdmin || 
           !!f.createdDateFrom || 
           !!f.createdDateTo;
  });

  // Check if grid has either active search or active filter (triggers Reset button §2.4)
  isResetVisible = computed<boolean>(() => {
    return !!this.searchQuery().trim() || this.hasActiveFilters();
  });

  // Total count of active filter criteria
  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    let count = f.status.length + f.programmeDepartment.length;
    if (f.lmsAdmin) count++;
    if (f.createdDateFrom || f.createdDateTo) count++;
    return count;
  });

  // -------------------------------------------------------------------------
  // CORE FILTERING & SORTING LOGIC (§2.2, §2.3, §2.5)
  // -------------------------------------------------------------------------
  filteredAndSortedInstances = computed<LmsInstance[]>(() => {
    const orgInstances = this.lms.activeOrgLmsInstances();
    const query = this.searchQuery().toLowerCase().trim();
    const filters = this.appliedFilters();

    const filtered = orgInstances.filter(instance => {
      // 1. Search Query: Strict search on LMS Name only (§2.2)
      if (query) {
        const nameMatches = instance.basicInfo.lmsName.toLowerCase().includes(query);
        if (!nameMatches) return false;
      }

      // 2. Status Filter (OR within category)
      if (filters.status.length > 0) {
        if (!filters.status.includes(instance.status)) {
          return false;
        }
      }

      // 3. Programme / Department Filter (OR within category)
      if (filters.programmeDepartment.length > 0) {
        if (!filters.programmeDepartment.includes(instance.basicInfo.programmeDepartment)) {
          return false;
        }
      }

      // 4. LMS Admin Filter
      if (filters.lmsAdmin) {
        const hasAdmin = instance.admins?.some(a => 
          a.email.toLowerCase() === filters.lmsAdmin.toLowerCase() ||
          a.name.toLowerCase() === filters.lmsAdmin.toLowerCase()
        );
        if (!hasAdmin) return false;
      }

      // 5. Created Date Range Filter (DD/MM/YYYY comparison)
      if (filters.createdDateFrom || filters.createdDateTo) {
        const itemDate = new Date(instance.createdAt).getTime();
        if (filters.createdDateFrom) {
          const fromDate = this.parseDateInput(filters.createdDateFrom);
          if (fromDate && itemDate < fromDate.getTime()) return false;
        }
        if (filters.createdDateTo) {
          const toDate = this.parseDateInput(filters.createdDateTo);
          if (toDate) {
            // End of the day
            toDate.setHours(23, 59, 59, 999);
            if (itemDate > toDate.getTime()) return false;
          }
        }
      }

      return true;
    });

    // Sort: Active LMS instance pinned first to ensure it's on page 1, then latest created LMS (§2.5)
    const activeId = this.lms.activeLmsId();
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

  // Visible instances for infinite scroll / pagination (§2.5)
  visibleInstances = computed<LmsInstance[]>(() => {
    return this.filteredAndSortedInstances().slice(0, this.displayedCount());
  });

  hasMoreToLoad = computed<boolean>(() => {
    return this.displayedCount() < this.filteredAndSortedInstances().length;
  });

  // -------------------------------------------------------------------------
  // EMPTY STATES DETERMINATION (§2.6)
  // -------------------------------------------------------------------------
  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    const orgTotal = this.lms.activeOrgLmsInstances().length;
    if (orgTotal === 0) return 'true_empty';

    if (this.filteredAndSortedInstances().length === 0) {
      if (this.hasActiveFilters()) {
        return 'filter_miss'; // No LMS found matching the selected filters.
      }
      if (this.searchQuery().trim()) {
        return 'search_miss'; // No LMS found
      }
      return 'true_empty';
    }

    return 'none';
  });

  // -------------------------------------------------------------------------
  // SEARCH & FILTER HANDLERS
  // -------------------------------------------------------------------------
  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.displayedCount.set(6);
  }

  toggleFilterPanel() {
    if (!this.isFilterPanelOpen()) {
      // Sync draft filters with applied filters on open
      this.draftFilters.set(JSON.parse(JSON.stringify(this.appliedFilters())));
    }
    this.isFilterPanelOpen.update(v => !v);
  }

  closeFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  // Toggle status selection in draft filter
  toggleStatusDraft(status: LmsStatus) {
    this.draftFilters.update(f => {
      const exists = f.status.includes(status);
      const nextStatus = exists 
        ? f.status.filter(s => s !== status)
        : [...f.status, status];
      return { ...f, status: nextStatus };
    });
  }

  // Toggle department selection in draft filter
  toggleDeptDraft(dept: string) {
    this.draftFilters.update(f => {
      const exists = f.programmeDepartment.includes(dept);
      const next = exists 
        ? f.programmeDepartment.filter(d => d !== dept)
        : [...f.programmeDepartment, dept];
      return { ...f, programmeDepartment: next };
    });
  }

  // Set admin selection in draft filter
  setAdminDraft(adminEmail: string) {
    this.draftFilters.update(f => ({ ...f, lmsAdmin: adminEmail }));
  }

  // Set date from/to
  setDateFromDraft(val: string) {
    this.draftFilters.update(f => ({ ...f, createdDateFrom: val || null }));
  }

  setDateToDraft(val: string) {
    this.draftFilters.update(f => ({ ...f, createdDateTo: val || null }));
  }

  // Apply Filter button in panel (§2.3)
  applyFilterPanel() {
    this.appliedFilters.set(JSON.parse(JSON.stringify(this.draftFilters())));
    this.isFilterPanelOpen.set(false);
    this.displayedCount.set(6);
    this.lms.showToast(`Applied ${this.activeFilterCount()} filter criteria`, 'info');
  }

  // Clear All button in panel (§2.3)
  clearFilterPanelDraft() {
    this.draftFilters.set({
      status: [],
      programmeDepartment: [],
      lmsAdmin: '',
      createdDateFrom: null,
      createdDateTo: null,
    });
  }

  // Remove individual filter chip (§2.3)
  removeStatusFilter(status: LmsStatus) {
    this.appliedFilters.update(f => ({
      ...f,
      status: f.status.filter(s => s !== status)
    }));
    this.draftFilters.update(f => ({
      ...f,
      status: f.status.filter(s => s !== status)
    }));
  }

  removeDeptFilter(dept: string) {
    this.appliedFilters.update(f => ({
      ...f,
      programmeDepartment: f.programmeDepartment.filter(d => d !== dept)
    }));
    this.draftFilters.update(f => ({
      ...f,
      programmeDepartment: f.programmeDepartment.filter(d => d !== dept)
    }));
  }

  removeAdminFilter() {
    this.appliedFilters.update(f => ({ ...f, lmsAdmin: '' }));
    this.draftFilters.update(f => ({ ...f, lmsAdmin: '' }));
  }

  removeDateFilter() {
    this.appliedFilters.update(f => ({ ...f, createdDateFrom: null, createdDateTo: null }));
    this.draftFilters.update(f => ({ ...f, createdDateFrom: null, createdDateTo: null }));
  }

  // Grid-level Reset button (§2.4)
  resetGrid() {
    this.searchQuery.set('');
    this.appliedFilters.set({
      status: [],
      programmeDepartment: [],
      lmsAdmin: '',
      createdDateFrom: null,
      createdDateTo: null,
    });
    this.draftFilters.set({
      status: [],
      programmeDepartment: [],
      lmsAdmin: '',
      createdDateFrom: null,
      createdDateTo: null,
    });
    this.displayedCount.set(6);
    this.lms.showToast('Reset grid to default view', 'info');
  }

  loadMore() {
    this.displayedCount.update(c => c + this.pageSizeIncrement);
  }

  // -------------------------------------------------------------------------
  // CARD CLICK & LMS DETAILS SCREEN (§3.3, §4)
  // -------------------------------------------------------------------------
  openLmsDetails(instance: LmsInstance) {
    this.selectedLms.set(instance);
    this.isEditingDetails.set(false);
    this.formErrors.set({});
    this.showPermissionControls.set(false);

    // Initialize edit form
    this.editForm.set({
      lmsName: instance.basicInfo.lmsName,
      programmeDepartment: instance.basicInfo.programmeDepartment,
      summary: instance.basicInfo.summary || '',
      goal: instance.basicInfo.goal || '',
      urlDomain: instance.basicInfo.urlDomain,
      lmsType: instance.basicInfo.lmsType,
      timezone: instance.basicInfo.timezone || 'Asia/Dhaka',
      databaseSizeGb: instance.resources.databaseSizeGb || 50,
      fileStorageGb: instance.resources.fileStorageGb || 100,
      usageAlertThresholdPct: instance.resources.usageAlertThresholdPct || 80
    });
  }

  closeLmsDetails() {
    this.selectedLms.set(null);
    this.isEditingDetails.set(false);
    this.formErrors.set({});
  }

  startEditingDetails() {
    const lms = this.selectedLms();
    if (!lms) return;

    this.editForm.set({
      lmsName: lms.basicInfo.lmsName,
      programmeDepartment: lms.basicInfo.programmeDepartment,
      summary: lms.basicInfo.summary || '',
      goal: lms.basicInfo.goal || '',
      urlDomain: lms.basicInfo.urlDomain,
      lmsType: lms.basicInfo.lmsType,
      timezone: lms.basicInfo.timezone || 'Asia/Dhaka',
      databaseSizeGb: lms.resources.databaseSizeGb || 50,
      fileStorageGb: lms.resources.fileStorageGb || 100,
      usageAlertThresholdPct: lms.resources.usageAlertThresholdPct || 80
    });
    this.formErrors.set({});
    this.isEditingDetails.set(true);
  }

  cancelEditingDetails() {
    this.isEditingDetails.set(false);
    this.formErrors.set({});
  }

  saveLmsDetails() {
    const lms = this.selectedLms();
    if (!lms) return;

    const form = this.editForm();
    const errors: { [key: string]: string } = {};

    // 1. Mandatory field validation
    if (!form.lmsName.trim()) {
      errors['lmsName'] = 'LMS Name is required and cannot be empty.';
    }

    if (!form.programmeDepartment.trim()) {
      errors['programmeDepartment'] = 'Programme / Department is required.';
    }

    if (!form.urlDomain.trim()) {
      errors['urlDomain'] = 'URL / Domain is required.';
    } else {
      const cleanDomain = form.urlDomain.trim().replace(/^https?:\/\//, '');
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleanDomain)) {
        errors['urlDomain'] = 'Please provide a valid domain format (e.g., portal.brac.net).';
      }
    }

    if (form.databaseSizeGb <= 0) {
      errors['databaseSizeGb'] = 'Database size must be greater than 0 GB.';
    }

    if (form.fileStorageGb <= 0) {
      errors['fileStorageGb'] = 'File storage must be greater than 0 GB.';
    }

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      this.lms.showToast('Please resolve validation errors before saving.', 'error');
      return;
    }

    // 2. Perform Update via unified LmsDataService
    const result = this.lms.updateLmsInstance(lms.id, {
      basicInfo: {
        ...lms.basicInfo,
        lmsName: form.lmsName.trim(),
        programmeDepartment: form.programmeDepartment.trim(),
        summary: form.summary.trim(),
        goal: form.goal.trim(),
        urlDomain: form.urlDomain.trim().replace(/^https?:\/\//, ''),
        lmsType: form.lmsType,
        timezone: form.timezone
      },
      resources: {
        databaseSizeGb: Number(form.databaseSizeGb),
        fileStorageGb: Number(form.fileStorageGb),
        usageAlertThresholdPct: Number(form.usageAlertThresholdPct)
      }
    });

    if (!result.success) {
      this.formErrors.set({ lmsName: result.error || 'Failed to update LMS details.' });
      this.lms.showToast(result.error || 'Failed to update LMS details.', 'error');
      return;
    }

    // 3. Success behavior: Refresh Details view & trigger dynamic alert (§4.4)
    const updated = this.lms.lmsInstances().find(i => i.id === lms.id);
    if (updated) {
      this.selectedLms.set(updated);
    }
    this.isEditingDetails.set(false);
    this.formErrors.set({});

    // Dynamic success message exactly as specified in §4.4:
    // Alert: [LMS Name] details have been updated successfully
    this.lms.showToast(`${form.lmsName.trim()} details have been updated successfully`, 'success', 5000, 'Details Updated');
  }

  // -------------------------------------------------------------------------
  // ACTIVATION FLOW (§5)
  // -------------------------------------------------------------------------
  requestActivation(instance: LmsInstance, event?: Event) {
    if (event) {
      event.stopPropagation(); // §3.3: Critical - independent click target
    }
    this.activatingLms.set(instance);
  }

  cancelActivation() {
    this.activatingLms.set(null);
  }

  confirmActivation() {
    const target = this.activatingLms();
    if (!target) return;

    this.isActivatingInProgress.set(true);

    // Simulate instant service activation checks
    setTimeout(() => {
      this.lms.activateLmsInstance(target.id);
      this.isActivatingInProgress.set(false);
      this.activatingLms.set(null);

      // Refresh inspected instance if open
      if (this.selectedLms()?.id === target.id) {
        const updated = this.lms.lmsInstances().find(i => i.id === target.id);
        if (updated) this.selectedLms.set(updated);
      }

      // Success alert exactly as specified in §5.3:
      // Alert: [LMS Name] is activated
      this.lms.showToast(`${target.basicInfo.lmsName} is activated`, 'success', 5000, 'LMS Activated');
    }, 600);
  }

  // -------------------------------------------------------------------------
  // WIZARD / DRAFTS NAVIGATION
  // -------------------------------------------------------------------------
  openCreateWizard() {
    this.router.navigate(['/lms/create']);
  }

  resumeDraft(draftId: string, event?: Event) {
    if (event) event.stopPropagation();
    this.router.navigate(['/lms/create'], { queryParams: { draftId } });
  }

  deleteDraft(draftId: string, event: Event) {
    event.stopPropagation();
    this.lms.deleteLmsDraft(draftId);
    this.lms.showToast(`LMS Draft ID ${draftId} discarded`, 'info');
  }

  // -------------------------------------------------------------------------
  // UI HELPERS & BADGES
  // -------------------------------------------------------------------------
  getStatusBadgeClass(status: LmsStatus): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Under Processing':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'Drafted':
      case 'In-Progress':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'Deactivated':
      case 'Suspended':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-base-200 text-text-secondary border-base-300';
    }
  }

  private parseDateInput(str: string): Date | null {
    // Accepts YYYY-MM-DD or DD/MM/YYYY
    if (!str) return null;
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
}
