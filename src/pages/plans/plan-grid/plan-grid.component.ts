import { Component, inject, computed, signal, OnInit, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  Plan, 
  PlanStatus, 
  DurationType, 
  EnrollmentType, 
  PlanGridFilter, 
  parseDateDDMMYYYY, 
  compareDDMMYYYY 
} from '../../../models/plan.model';
import { AssignOwnerModalComponent } from '../assign-owner-modal/assign-owner-modal.component';
import { EditPlanModalComponent } from '../edit-plan-modal/edit-plan-modal.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-plan-grid',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    AssignOwnerModalComponent,
    EditPlanModalComponent,
    CustomSelectComponent
  ],
  templateUrl: './plan-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanGridComponent implements OnInit {
  private router = inject(Router);
  private lmsData = inject(LmsDataService);

  activeTenant = this.lmsData.activeTenant;
  activeLms = this.lmsData.activeLms;
  plans = this.lmsData.activeLmsPlans;

  // 1. Search Query
  searchQuery = signal<string>('');

  // 2. View Mode (Grid vs Table)
  viewMode = signal<'grid' | 'table'>('grid');

  // 3. Filter Panel Drawer State
  isFilterPanelOpen = signal<boolean>(false);

  // Available Filter Options
  availableStatuses: PlanStatus[] = ['Active', 'Published', 'Draft', 'Completed', 'Archived'];
  availableDurations: DurationType[] = ['Yearly', 'Half-Yearly', 'Quarterly'];
  availableEnrollments: EnrollmentType[] = ['Open', 'Closed'];

  // Draft filters (active inside panel before clicking Apply)
  draftFilters = signal<PlanGridFilter>({
    search: '',
    status: [],
    planOwnerEmail: null,
    planOwnerEmails: [],
    durationType: [],
    enrollmentType: [],
    startDate: null,
    endDate: null,
    createdDateFrom: null,
    createdDateTo: null
  });

  // Applied filters driving the grid data
  appliedFilters = signal<PlanGridFilter>({
    search: '',
    status: [],
    planOwnerEmail: null,
    planOwnerEmails: [],
    durationType: [],
    enrollmentType: [],
    startDate: null,
    endDate: null,
    createdDateFrom: null,
    createdDateTo: null
  });

  // Sorting
  sortField = signal<'createdDate' | 'name' | 'startDate'>('createdDate');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Pagination & Display
  displayedCount = signal<number>(10);
  pageSizeIncrement = 10;

  // Action Menu Dropdown State (Floating Fixed Menu)
  activeMenuPlan = signal<Plan | null>(null);
  menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Modals & Dialogs
  selectedPlanForAssign = signal<Plan | null>(null);
  selectedPlanForEdit = signal<Plan | null>(null);
  activatingPlan = signal<Plan | null>(null);
  isActivatingInProgress = signal<boolean>(false);

  // Operational Telemetry Statistics
  activePlansCount = computed(() => this.plans().filter(p => p.status === 'Active').length);
  publishedPlansCount = computed(() => this.plans().filter(p => p.status === 'Published').length);
  draftPlansCount = computed(() => this.plans().filter(p => p.status === 'Draft').length);
  totalPhasesCount = computed(() => this.plans().reduce((acc, p) => acc + (p.phases?.length || p.phaseCount || 0), 0));
  totalEnrolledLearners = computed(() => this.plans().reduce((acc, p) => acc + (p.enrolledLearnersCount || 120), 0));
  totalCapacityLimit = computed(() => this.plans().reduce((acc, p) => acc + (p.capacityLimit || 300), 0));
  totalCertificatesIssued = computed(() => this.plans().reduce((acc, p) => acc + (p.certificatesIssuedCount || 85), 0));

  draftPlans = computed(() => this.plans().filter(p => p.status === 'Draft'));

  // Owner options derived from existing plans + well-known organization plan owners
  ownerOptions = computed<SelectOption[]>(() => {
    const list = this.plans();
    const map = new Map<string, string>();
    
    // Seed with existing plan owners
    list.forEach(p => {
      if (p.owner?.email && p.owner?.name) {
        map.set(p.owner.email, p.owner.name);
      }
    });

    // Add standard qualified plan owners / coordinators
    const defaultInstructors = [
      { name: 'Tanvir Hossain', email: 'tanvir.hossain@brac.net' },
      { name: 'Farhana Ahmed', email: 'farhana.ahmed@brac.net' },
      { name: 'Mahmudur Rahman', email: 'mahmud.rahman@brac.net' },
      { name: 'Nusrat Jahan', email: 'nusrat.jahan@brac.net' },
      { name: 'Joy Basak', email: 'basakjoy125@gmail.com' }
    ];

    defaultInstructors.forEach(item => {
      if (!map.has(item.email)) {
        map.set(item.email, item.name);
      }
    });

    const result: SelectOption[] = [];
    map.forEach((name, email) => {
      result.push({
        value: email,
        label: name,
        sublabel: email,
        icon: 'person'
      });
    });
    return result;
  });

  // Draft selected owner emails helper
  draftSelectedOwners = computed(() => this.draftFilters().planOwnerEmails || []);

  // Check if any filters are active
  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return f.status.length > 0 || 
           (!!f.planOwnerEmails && f.planOwnerEmails.length > 0) ||
           !!f.planOwnerEmail || 
           f.durationType.length > 0 || 
           f.enrollmentType.length > 0 || 
           !!f.startDate || 
           !!f.endDate ||
           !!f.createdDateFrom ||
           !!f.createdDateTo;
  });

  // Check if grid has either active search or active filter (triggers Reset button)
  isResetVisible = computed<boolean>(() => {
    return !!this.searchQuery().trim() || this.hasActiveFilters();
  });

  // Total count of active filter criteria
  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    let count = f.status.length;
    if (f.planOwnerEmails && f.planOwnerEmails.length > 0) {
      count += f.planOwnerEmails.length;
    } else if (f.planOwnerEmail) {
      count++;
    }
    count += f.durationType.length;
    count += f.enrollmentType.length;
    if (f.startDate || f.endDate) count++;
    if (f.createdDateFrom || f.createdDateTo) count++;
    return count;
  });

  // Filtered and sorted learning plans
  filteredPlans = computed<Plan[]>(() => {
    const all = this.plans();
    const query = this.searchQuery().toLowerCase().trim();
    const f = this.appliedFilters();

    const filtered = all.filter(p => {
      // Archived filter rule: Archived plans hidden by default unless 'Archived' is in status filter
      if (p.status === 'Archived' && !f.status.includes('Archived')) {
        return false;
      }

      // Search Query: Name OR Code OR Owner
      if (query) {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCode = p.planCode.toLowerCase().includes(query);
        const matchesOwner = p.owner?.name?.toLowerCase().includes(query) || p.owner?.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesOwner) {
          return false;
        }
      }

      // Status filter (OR within category)
      if (f.status.length > 0) {
        const matchesStatus = f.status.some(st => {
          if (st === p.status) return true;
          if ((st === 'Drafted' || st === 'Draft') && (p.status === 'Draft' || p.status === 'Drafted')) return true;
          if ((st === 'Under Processing' || st === 'In-Progress') && (p.status === 'Under Processing' || p.status === 'In-Progress')) return true;
          if ((st === 'Archived' || st === 'Deactivated' || st === 'Suspended') && (p.status === 'Archived' || p.status === 'Deactivated' || p.status === 'Suspended')) return true;
          return false;
        });
        if (!matchesStatus) {
          return false;
        }
      }

      // Plan Owner multi-select filter (OR logic among selected owners)
      if (f.planOwnerEmails && f.planOwnerEmails.length > 0) {
        if (!p.owner?.email || !f.planOwnerEmails.includes(p.owner.email)) {
          return false;
        }
      } else if (f.planOwnerEmail && p.owner?.email !== f.planOwnerEmail) {
        return false;
      }

      // Duration Type filter
      if (f.durationType.length > 0 && !f.durationType.includes(p.durationType)) {
        return false;
      }

      // Enrollment Type filter
      if (f.enrollmentType.length > 0 && !f.enrollmentType.includes(p.enrollmentType)) {
        return false;
      }

      // Start Date comparison
      if (f.startDate) {
        const fromDate = this.parseDate(f.startDate);
        const planDate = parseDateDDMMYYYY(p.startDate);
        if (fromDate && planDate && planDate.getTime() < fromDate.getTime()) {
          return false;
        }
      }

      // End Date comparison
      if (f.endDate) {
        const toDate = this.parseDate(f.endDate);
        const planEndDate = parseDateDDMMYYYY(p.endDate);
        if (toDate && planEndDate && planEndDate.getTime() > toDate.getTime()) {
          return false;
        }
      }

      // Created Date From comparison
      if (f.createdDateFrom) {
        const fromDate = this.parseDate(f.createdDateFrom);
        const planCreatedDate = parseDateDDMMYYYY(p.createdDate);
        if (fromDate && planCreatedDate && planCreatedDate.getTime() < fromDate.getTime()) {
          return false;
        }
      }

      // Created Date To comparison
      if (f.createdDateTo) {
        const toDate = this.parseDate(f.createdDateTo);
        const planCreatedDate = parseDateDDMMYYYY(p.createdDate);
        if (toDate && planCreatedDate && planCreatedDate.getTime() > toDate.getTime()) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      const field = this.sortField();
      const order = this.sortOrder() === 'asc' ? 1 : -1;
      if (field === 'createdDate') {
        return compareDDMMYYYY(b.createdDate, a.createdDate) * (this.sortOrder() === 'desc' ? 1 : -1);
      }
      return a.name.localeCompare(b.name) * order;
    });
  });

  // Displayed plans for pagination / lazy scrolling
  displayedPlans = computed<Plan[]>(() => {
    return this.filteredPlans().slice(0, this.displayedCount());
  });

  // Active filter badges
  activeFilterBadges = computed<{ id: string; label: string; value: string; remove: () => void }[]>(() => {
    const f = this.appliedFilters();
    const badges: { id: string; label: string; value: string; remove: () => void }[] = [];

    f.status.forEach(st => {
      badges.push({
        id: `status-${st}`,
        label: 'Status',
        value: st,
        remove: () => this.removeStatusFilter(st)
      });
    });

    // Multi-selected plan owners
    if (f.planOwnerEmails && f.planOwnerEmails.length > 0) {
      f.planOwnerEmails.forEach(email => {
        badges.push({
          id: `owner-${email}`,
          label: 'Plan Owner',
          value: this.getOwnerDisplayName(email),
          remove: () => this.removeOwnerEmailFilter(email)
        });
      });
    } else if (f.planOwnerEmail) {
      badges.push({
        id: 'owner',
        label: 'Plan Owner',
        value: this.getOwnerDisplayName(f.planOwnerEmail),
        remove: () => this.removeOwnerFilter()
      });
    }

    f.durationType.forEach(dt => {
      badges.push({
        id: `duration-${dt}`,
        label: 'Duration',
        value: dt,
        remove: () => this.removeDurationFilter(dt)
      });
    });

    f.enrollmentType.forEach(et => {
      badges.push({
        id: `enrollment-${et}`,
        label: 'Enrollment',
        value: et,
        remove: () => this.removeEnrollmentFilter(et)
      });
    });

    if (f.startDate) {
      badges.push({
        id: 'startDate',
        label: 'Start Date',
        value: f.startDate,
        remove: () => this.removeStartDateFilter()
      });
    }

    if (f.endDate) {
      badges.push({
        id: 'endDate',
        label: 'End Date',
        value: f.endDate,
        remove: () => this.removeEndDateFilter()
      });
    }

    if (f.createdDateFrom) {
      badges.push({
        id: 'createdDateFrom',
        label: 'Created From',
        value: f.createdDateFrom,
        remove: () => this.removeCreatedDateFromFilter()
      });
    }

    if (f.createdDateTo) {
      badges.push({
        id: 'createdDateTo',
        label: 'Created To',
        value: f.createdDateTo,
        remove: () => this.removeCreatedDateToFilter()
      });
    }

    return badges;
  });

  ngOnInit() {}

  // Three-dot Action Menu Handlers (True Floating Popover)
  toggleActionMenu(plan: Plan, event: MouseEvent) {
    event.stopPropagation();
    if (this.activeMenuPlan()?.id === plan.id) {
      this.closeActionMenu();
      return;
    }

    const button = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
    const rect = button.getBoundingClientRect();
    const menuHeight = 270;
    const menuWidth = 224; // w-56 is 224px

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = placeAbove ? Math.max(10, rect.top - menuHeight - 4) : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 4);
    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    this.menuPosition.set({ top, left });
    this.activeMenuPlan.set(plan);
  }

  closeActionMenu() {
    this.activeMenuPlan.set(null);
  }

  isActionMenuOpen(planId: string): boolean {
    return this.activeMenuPlan()?.id === planId;
  }

  @HostListener('document:click')
  @HostListener('window:scroll')
  @HostListener('window:resize')
  onDocumentInteraction() {
    if (this.activeMenuPlan()) {
      this.closeActionMenu();
    }
  }

  // Navigation handlers
  showPhaseGrid(plan: Plan) {
    this.closeActionMenu();
    this.router.navigate(['/plans/phases'], { queryParams: { planId: plan.id } });
  }

  navigateToCreatePhase(plan: Plan) {
    this.closeActionMenu();
    this.router.navigate(['/plans', plan.id, 'phases', 'create']);
  }

  viewPlanDetails(plan: Plan) {
    this.closeActionMenu();
    this.router.navigate(['/plans/details', plan.id]);
  }

  navigateToCreate() {
    this.closeActionMenu();
    this.router.navigate(['/plans/create']);
  }

  navigateToDashboard() {
    this.closeActionMenu();
    this.router.navigate(['/plans/dashboard']);
  }

  openEditModal(plan: Plan) {
    this.closeActionMenu();
    this.router.navigate(['/plans/edit', plan.id]);
  }

  resumeDraft(draft: any) {
    this.closeActionMenu();
    this.router.navigate(['/plans/edit', draft.id]);
  }

  openAssignModal(plan: Plan) {
    this.closeActionMenu();
    this.selectedPlanForAssign.set(plan);
  }

  onOwnerAssigned() {
    this.selectedPlanForAssign.set(null);
  }

  onPlanUpdated() {
    this.selectedPlanForEdit.set(null);
  }

  // Activation Dialog Handlers
  openActivateDialog(plan: Plan) {
    this.closeActionMenu();
    this.activatingPlan.set(plan);
  }

  confirmActivatePlan() {
    const plan = this.activatingPlan();
    if (!plan) return;

    this.isActivatingInProgress.set(true);
    setTimeout(() => {
      this.lmsData.activatePlan(plan.id);
      this.isActivatingInProgress.set(false);
      this.activatingPlan.set(null);
    }, 400);
  }

  // Search & Filter Handlers
  onSearchChange(val: string) {
    this.searchQuery.set(val);
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

  toggleStatusDraft(status: PlanStatus) {
    this.draftFilters.update(f => {
      const exists = f.status.includes(status);
      const next = exists ? f.status.filter(s => s !== status) : [...f.status, status];
      return { ...f, status: next };
    });
  }

  toggleDurationDraft(dt: DurationType) {
    this.draftFilters.update(f => {
      const exists = f.durationType.includes(dt);
      const next = exists ? f.durationType.filter(d => d !== dt) : [...f.durationType, dt];
      return { ...f, durationType: next };
    });
  }

  toggleEnrollmentDraft(et: EnrollmentType) {
    this.draftFilters.update(f => {
      const exists = f.enrollmentType.includes(et);
      const next = exists ? f.enrollmentType.filter(e => e !== et) : [...f.enrollmentType, et];
      return { ...f, enrollmentType: next };
    });
  }

  setOwnerDraft(email: string | null) {
    this.draftFilters.update(f => ({ ...f, planOwnerEmail: email }));
  }

  onDraftOwnersChange(emails: string[]) {
    this.draftFilters.update(f => ({ ...f, planOwnerEmails: emails || [] }));
  }

  setDateFromDraft(dateStr: string) {
    this.draftFilters.update(f => ({ ...f, startDate: dateStr || null }));
  }

  setDateToDraft(dateStr: string) {
    this.draftFilters.update(f => ({ ...f, endDate: dateStr || null }));
  }

  setCreatedDateFromDraft(dateStr: string) {
    this.draftFilters.update(f => ({ ...f, createdDateFrom: dateStr || null }));
  }

  setCreatedDateToDraft(dateStr: string) {
    this.draftFilters.update(f => ({ ...f, createdDateTo: dateStr || null }));
  }

  applyFilterPanel() {
    this.appliedFilters.set(JSON.parse(JSON.stringify(this.draftFilters())));
    this.isFilterPanelOpen.set(false);
    this.lmsData.showToast(`Applied ${this.activeFilterCount()} filter criteria`, 'info');
  }

  clearFilterPanelDraft() {
    this.draftFilters.set({
      search: '',
      status: [],
      planOwnerEmail: null,
      planOwnerEmails: [],
      durationType: [],
      enrollmentType: [],
      startDate: null,
      endDate: null,
      createdDateFrom: null,
      createdDateTo: null
    });
  }

  // Active filter removals
  removeStatusFilter(status: PlanStatus) {
    this.appliedFilters.update(f => ({ ...f, status: f.status.filter(s => s !== status) }));
    this.draftFilters.update(f => ({ ...f, status: f.status.filter(s => s !== status) }));
  }

  removeDurationFilter(dt: DurationType) {
    this.appliedFilters.update(f => ({ ...f, durationType: f.durationType.filter(d => d !== dt) }));
    this.draftFilters.update(f => ({ ...f, durationType: f.durationType.filter(d => d !== dt) }));
  }

  removeEnrollmentFilter(et: EnrollmentType) {
    this.appliedFilters.update(f => ({ ...f, enrollmentType: f.enrollmentType.filter(e => e !== et) }));
    this.draftFilters.update(f => ({ ...f, enrollmentType: f.enrollmentType.filter(e => e !== et) }));
  }

  removeOwnerFilter() {
    this.appliedFilters.update(f => ({ ...f, planOwnerEmail: null, planOwnerEmails: [] }));
    this.draftFilters.update(f => ({ ...f, planOwnerEmail: null, planOwnerEmails: [] }));
  }

  removeOwnerEmailFilter(email: string) {
    this.appliedFilters.update(f => ({
      ...f,
      planOwnerEmails: (f.planOwnerEmails || []).filter(e => e !== email)
    }));
    this.draftFilters.update(f => ({
      ...f,
      planOwnerEmails: (f.planOwnerEmails || []).filter(e => e !== email)
    }));
  }

  removeStartDateFilter() {
    this.appliedFilters.update(f => ({ ...f, startDate: null }));
    this.draftFilters.update(f => ({ ...f, startDate: null }));
  }

  removeEndDateFilter() {
    this.appliedFilters.update(f => ({ ...f, endDate: null }));
    this.draftFilters.update(f => ({ ...f, endDate: null }));
  }

  removeCreatedDateFromFilter() {
    this.appliedFilters.update(f => ({ ...f, createdDateFrom: null }));
    this.draftFilters.update(f => ({ ...f, createdDateFrom: null }));
  }

  removeCreatedDateToFilter() {
    this.appliedFilters.update(f => ({ ...f, createdDateTo: null }));
    this.draftFilters.update(f => ({ ...f, createdDateTo: null }));
  }

  clearAllFilters() {
    this.resetGrid();
  }

  resetGrid() {
    this.searchQuery.set('');
    this.appliedFilters.set({
      search: '',
      status: [],
      planOwnerEmail: null,
      planOwnerEmails: [],
      durationType: [],
      enrollmentType: [],
      startDate: null,
      endDate: null,
      createdDateFrom: null,
      createdDateTo: null
    });
    this.draftFilters.set({
      search: '',
      status: [],
      planOwnerEmail: null,
      planOwnerEmails: [],
      durationType: [],
      enrollmentType: [],
      startDate: null,
      endDate: null,
      createdDateFrom: null,
      createdDateTo: null
    });
    this.lmsData.showToast('Reset grid to default view', 'info');
  }

  getOwnerDisplayName(email: string | null): string {
    if (!email) return '';
    const opt = this.ownerOptions().find(o => o.value === email || (o as any).email === email);
    return opt ? opt.label : email;
  }

  toggleSort(field: 'createdDate' | 'name' | 'startDate') {
    if (this.sortField() === field) {
      this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('desc');
    }
  }

  loadMore() {
    this.displayedCount.update(c => c + this.pageSizeIncrement);
  }

  // Capacity & Metric Helpers
  getLearnersCount(plan: Plan): number {
    return plan.enrolledLearnersCount || 120;
  }

  getCapacityLimit(plan: Plan): number {
    return plan.capacityLimit || 300;
  }

  getCapacityPercent(plan: Plan): number {
    const limit = this.getCapacityLimit(plan);
    const count = this.getLearnersCount(plan);
    return limit ? Math.min(100, Math.round((count / limit) * 100)) : 40;
  }

  // Badge Styling
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-[#E8FAF4] text-[#059669] border-[#34D399] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700';
      case 'Under Processing':
      case 'In-Progress':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FBBF24] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600';
      case 'Draft':
      case 'Drafted':
        return 'bg-[#F1F5F9] text-[#475569] border-[#94A3B8] dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-600';
      case 'Trial':
        return 'bg-[#FDF2F8] text-[#DB2777] border-[#F472B6] dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-700';
      case 'Published':
        return 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700';
      case 'Completed':
        return 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700';
      case 'Archived':
      case 'Deactivated':
      case 'Suspended':
        return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
    }
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-[#10B981]';
      case 'Under Processing':
      case 'In-Progress':
        return 'bg-[#F59E0B]';
      case 'Draft':
      case 'Drafted':
        return 'bg-[#64748B]';
      case 'Trial':
        return 'bg-[#EC4899]';
      case 'Published':
        return 'bg-sky-500';
      case 'Completed':
        return 'bg-purple-500';
      case 'Archived':
      case 'Deactivated':
      case 'Suspended':
        return 'bg-[#EF4444]';
      default:
        return 'bg-slate-400';
    }
  }

  private parseDate(str: string): Date | null {
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
