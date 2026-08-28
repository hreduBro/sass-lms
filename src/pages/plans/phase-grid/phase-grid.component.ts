import { Component, inject, computed, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { Plan, Phase, PhaseStatus } from '../../../models/plan.model';
import { PhaseDetailsModalComponent } from '../phase-details-modal/phase-details-modal.component';

export interface PhaseWithPlanContext extends Phase {
  parentPlanName: string;
  parentPlanCode: string;
}

export interface PhaseGridFilters {
  status: string[];
  prerequisites: string[];
  planId: string | null;
  startDate: string | null;
}

@Component({
  selector: 'app-phase-grid',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    PhaseDetailsModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './phase-grid.component.html',
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-step-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
})
export class PhaseGridComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  lms = inject(LmsDataService);

  activeLms = this.lms.activeLms;
  activeTenant = this.lms.activeTenant;

  // Search & Filter Panel State
  searchQuery = signal<string>('');
  isFilterPanelOpen = signal<boolean>(false);

  // Available filter options matching Plan design
  availableStatuses: PhaseStatus[] = ['Ready', 'In-Progress', 'Completed', 'Draft'];
  availablePrerequisites = ['Previous Phase Completion', 'Specific Course Completion', 'Minimum Score Threshold', 'None'];

  // Applied & Draft Filters
  appliedFilters = signal<PhaseGridFilters>({
    status: [],
    prerequisites: [],
    planId: null,
    startDate: null
  });

  draftFilters = signal<PhaseGridFilters>({
    status: [],
    prerequisites: [],
    planId: null,
    startDate: null
  });

  // Sorting
  sortField = signal<string>('sequence');
  sortOrder = signal<'asc' | 'desc'>('asc');

  // Modal signals
  selectedPhaseForDetails = signal<Phase | null>(null);
  selectedPlanForDetails = signal<Plan | null>(null);
  phaseToDelete = signal<{ planId: string; phaseId: string; phaseName: string } | null>(null);

  // Plan Selection for Phase Creation
  showSelectPlanModal = signal<boolean>(false);
  selectedPlanIdForCreate = signal<string | null>(null);
  modalPlanSearchQuery = signal<string>('');

  // All plans in active LMS
  plansList = computed<Plan[]>(() => this.lms.activeLmsPlans());

  // Filtered plans inside selection modal
  filteredModalPlans = computed<Plan[]>(() => {
    const query = this.modalPlanSearchQuery().trim().toLowerCase();
    const plans = this.plansList();
    if (!query) return plans;
    return plans.filter(p => p.name.toLowerCase().includes(query) || p.planCode.toLowerCase().includes(query));
  });

  // Aggregate all phases across plans in active LMS
  allPhasesWithContext = computed<PhaseWithPlanContext[]>(() => {
    const plans = this.plansList();
    const result: PhaseWithPlanContext[] = [];

    plans.forEach(plan => {
      if (plan.phases && plan.phases.length > 0) {
        plan.phases.forEach(ph => {
          result.push({
            ...ph,
            parentPlanName: plan.name,
            parentPlanCode: plan.planCode
          });
        });
      }
    });

    return result;
  });

  // Filter Active Count
  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    let count = 0;
    if (f.status.length > 0) count += f.status.length;
    if (f.prerequisites.length > 0) count += f.prerequisites.length;
    if (f.planId) count += 1;
    if (f.startDate) count += 1;
    return count;
  });

  hasActiveFilters = computed<boolean>(() => this.activeFilterCount() > 0);
  isResetVisible = computed<boolean>(() => this.hasActiveFilters() || this.searchQuery().trim().length > 0);

  // Filtered & Sorted Phases
  filteredPhases = computed<PhaseWithPlanContext[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const f = this.appliedFilters();
    let list = this.allPhasesWithContext();

    // Plan Filter
    if (f.planId) {
      list = list.filter(ph => ph.planId === f.planId);
    }

    // Status Filter
    if (f.status.length > 0) {
      list = list.filter(ph => f.status.includes(ph.status));
    }

    // Prerequisites Filter
    if (f.prerequisites.length > 0) {
      list = list.filter(ph => f.prerequisites.includes(ph.prerequisiteStatus));
    }

    // Search query (Searches Phase Name, Phase ID, Parent Plan Name, Parent Plan Code, Description)
    if (query) {
      list = list.filter(ph => 
        ph.name.toLowerCase().includes(query) || 
        ph.id.toLowerCase().includes(query) ||
        ph.parentPlanName.toLowerCase().includes(query) || 
        ph.parentPlanCode.toLowerCase().includes(query) ||
        (ph.description && ph.description.toLowerCase().includes(query))
      );
    }

    // Sorting
    return list.sort((a, b) => {
      const order = this.sortOrder() === 'asc' ? 1 : -1;
      if (this.sortField() === 'sequence') {
        return (a.sequence - b.sequence) * order;
      }
      if (this.sortField() === 'name') {
        return a.name.localeCompare(b.name) * order;
      }
      return 0;
    });
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['planId']) {
        this.appliedFilters.update(f => ({ ...f, planId: params['planId'] }));
        this.draftFilters.update(f => ({ ...f, planId: params['planId'] }));
      }
    });
  }

  // KPI Metrics
  totalPhasesCount = computed(() => this.allPhasesWithContext().length);
  readyPhasesCount = computed(() => this.allPhasesWithContext().filter(p => p.status === 'Ready' || p.status === 'In-Progress').length);
  completedPhasesCount = computed(() => this.allPhasesWithContext().filter(p => p.status === 'Completed').length);
  draftPhasesCount = computed(() => this.allPhasesWithContext().filter(p => p.status === 'Draft').length);
  totalCoursesCount = computed(() => this.allPhasesWithContext().reduce((sum, p) => sum + (p.courseCount || 0), 0));

  // Filter Panel Toggle & Handlers
  toggleFilterPanel() {
    if (!this.isFilterPanelOpen()) {
      this.draftFilters.set({ ...this.appliedFilters() });
    }
    this.isFilterPanelOpen.update(v => !v);
  }

  closeFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  applyFilterPanel() {
    this.appliedFilters.set({ ...this.draftFilters() });
    this.isFilterPanelOpen.set(false);
  }

  clearFilterPanelDraft() {
    this.draftFilters.set({
      status: [],
      prerequisites: [],
      planId: null,
      startDate: null
    });
  }

  resetGrid() {
    this.searchQuery.set('');
    this.appliedFilters.set({
      status: [],
      prerequisites: [],
      planId: null,
      startDate: null
    });
    this.draftFilters.set({
      status: [],
      prerequisites: [],
      planId: null,
      startDate: null
    });
  }

  toggleStatusDraft(st: PhaseStatus) {
    this.draftFilters.update(curr => {
      const exists = curr.status.includes(st);
      return {
        ...curr,
        status: exists ? curr.status.filter(s => s !== st) : [...curr.status, st]
      };
    });
  }

  togglePrerequisiteDraft(pr: string) {
    this.draftFilters.update(curr => {
      const exists = curr.prerequisites.includes(pr);
      return {
        ...curr,
        prerequisites: exists ? curr.prerequisites.filter(p => p !== pr) : [...curr.prerequisites, pr]
      };
    });
  }

  setPlanDraft(planId: string | null) {
    this.draftFilters.update(curr => ({ ...curr, planId: planId || null }));
  }

  removeStatusFilter(st: string) {
    this.appliedFilters.update(curr => ({
      ...curr,
      status: curr.status.filter(s => s !== st)
    }));
  }

  removePrerequisiteFilter(pr: string) {
    this.appliedFilters.update(curr => ({
      ...curr,
      prerequisites: curr.prerequisites.filter(p => p !== pr)
    }));
  }

  removePlanFilter() {
    this.appliedFilters.update(curr => ({
      ...curr,
      planId: null
    }));
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
  }

  setSorting(field: string) {
    if (this.sortField() === field) {
      this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
  }

  // Plan Selection Modal Handlers for Phase Creation
  openCreatePhaseModal() {
    const plans = this.plansList();
    this.selectedPlanIdForCreate.set(plans.length > 0 ? plans[0].id : null);
    this.modalPlanSearchQuery.set('');
    this.showSelectPlanModal.set(true);
  }

  closeCreatePhaseModal() {
    this.showSelectPlanModal.set(false);
  }

  confirmPlanAndCreatePhase() {
    const planId = this.selectedPlanIdForCreate();
    if (!planId) return;
    this.closeCreatePhaseModal();
    this.router.navigate(['/plans', planId, 'phases', 'create']);
  }

  navigateToCreatePhase() {
    this.openCreatePhaseModal();
  }

  navigateToEditPhase(planId: string, phaseId: string) {
    this.router.navigate(['/plans', planId, 'phases', 'edit', phaseId]);
  }

  viewPhaseDetails(phase: PhaseWithPlanContext) {
    const parent = this.lms.getPlan(phase.planId) || null;
    this.selectedPlanForDetails.set(parent);
    this.selectedPhaseForDetails.set(phase);
  }

  promptDeletePhase(planId: string, phaseId: string, phaseName: string) {
    this.phaseToDelete.set({ planId, phaseId, phaseName });
  }

  confirmDeletePhase() {
    const target = this.phaseToDelete();
    if (!target) return;
    this.lms.deletePhaseFromPlan(target.planId, target.phaseId);
    this.phaseToDelete.set(null);
  }

  // Badge Helpers matching Plan Grid
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
      case 'In-Progress':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
      case 'Ready':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
      case 'Completed':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
      case 'Draft':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900';
    }
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'Active':
      case 'In-Progress':
        return 'bg-emerald-500';
      case 'Ready':
        return 'bg-blue-500';
      case 'Completed':
        return 'bg-purple-500';
      case 'Draft':
      default:
        return 'bg-amber-500';
    }
  }

  getPrerequisiteBadgeClass(status: string): string {
    switch (status) {
      case 'Met': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
      case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  getCertificateBadgeClass(status: string): string {
    switch (status) {
      case 'Issued': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300';
      case 'Configured': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }
}
