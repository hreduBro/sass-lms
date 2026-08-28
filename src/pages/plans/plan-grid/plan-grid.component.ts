import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { AssignOwnerModalComponent } from '../assign-owner-modal/assign-owner-modal.component';
import { EditPlanModalComponent } from '../edit-plan-modal/edit-plan-modal.component';

@Component({
  selector: 'app-plan-grid',
  imports: [
    CommonModule, 
    FormsModule, 
    CustomSelectComponent, 
    AssignOwnerModalComponent,
    EditPlanModalComponent
  ],
  template: `
    <div class="space-y-6 pb-12 animate-fade-in">
      
      <!-- ================================================================= -->
      <!-- HEADER & LMS WORKSPACE CONTEXT (§6.1)                             -->
      <!-- ================================================================= -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs text-text-secondary">
            <span>{{ activeTenant().name }}</span>
            <span>/</span>
            <span class="text-text-primary font-medium">Plan Management</span>
          </div>
          <h1 class="text-2xl font-bold text-text-primary mt-1 flex items-center gap-3">
            Plan Management
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
              {{ filteredPlans().length }} {{ filteredPlans().length === 1 ? 'Plan' : 'Plans' }}
            </span>
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">
            Manage learning plans, phase roadmaps, and administrative ownership within this LMS.
          </p>
        </div>

        <!-- Fixed LMS Workspace Indicator & Actions -->
        <div class="flex items-center flex-wrap gap-2.5">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 text-xs shadow-sm">
            <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-400">layers</span>
            <span class="text-text-secondary">Fixed LMS Workspace:</span>
            <span class="font-bold text-text-primary">{{ activeLms().basicInfo.lmsName }}</span>
            <span class="font-mono text-[11px] text-text-secondary bg-base-200 dark:bg-base-300 px-1.5 py-0.5 rounded">
              {{ activeLms().id }}
            </span>
          </div>

          <button 
            id="create-plan-nav-btn"
            type="button"
            (click)="navigateToCreate()"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-tenant-600 hover:bg-tenant-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">add_task</span>
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SEARCH, FILTER BAR & DRAWER (§6.2 & §6.3)                         -->
      <!-- ================================================================= -->
      <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-3">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <!-- Search Field (Live debounced, matches Plan Name OR Plan Code) -->
          <div class="relative flex-1 max-w-md">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">
              search
            </span>
            <input 
              id="plan-search-input"
              type="text" 
              [ngModel]="filters().search"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search plan name or plan code (e.g. PLN-1972-001)..." 
              class="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60" />
            @if (filters().search) {
              <button 
                type="button" 
                (click)="onSearchChange('')" 
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                <span class="material-symbols-outlined text-sm">cancel</span>
              </button>
            }
          </div>

          <!-- Filter & View Controls -->
          <div class="flex items-center gap-2 self-end sm:self-auto">
            
            <!-- Filter Drawer Toggle Button -->
            <button 
              id="toggle-filter-panel-btn"
              type="button"
              (click)="toggleFilterPanel()"
              class="px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm"
              [ngClass]="isFilterPanelOpen() || activeFilterCount() > 0 
                ? 'bg-tenant-500/10 border-tenant-500/40 text-tenant-700 dark:text-tenant-300' 
                : 'bg-base-200 border-base-300 dark:border-slate-700 text-text-primary hover:bg-base-300'">
              <span class="material-symbols-outlined text-sm">filter_list</span>
              <span>Filters</span>
              @if (activeFilterCount() > 0) {
                <span class="w-5 h-5 rounded-full bg-tenant-600 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {{ activeFilterCount() }}
                </span>
              }
            </button>

            <!-- Clear All Quick Action (shown when filters applied) -->
            @if (activeFilterCount() > 0 || filters().search) {
              <button 
                id="clear-all-filters-quick-btn"
                type="button" 
                (click)="clearAllFilters()"
                class="px-3 py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                Clear All
              </button>
            }
          </div>
        </div>

        <!-- Filter Panel (§6.3) -->
        @if (isFilterPanelOpen()) {
          <div id="plan-filter-drawer" class="pt-4 border-t border-base-300 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in text-xs">
            
            <!-- 1. Status Multi-select Chips -->
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Status
              </label>
              <div class="flex flex-wrap gap-1.5">
                @for (st of availableStatuses; track st) {
                  <button 
                    type="button"
                    (click)="toggleStatusFilter(st)"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                    [ngClass]="isStatusSelected(st) 
                      ? 'bg-tenant-600 text-white border-tenant-600 shadow-xs' 
                      : 'bg-base-200 border-base-300 dark:border-slate-700 text-text-secondary hover:text-text-primary hover:bg-base-300'">
                    {{ st }}
                  </button>
                }
              </div>
            </div>

            <!-- 2. Plan Owner Filter -->
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Plan Owner
              </label>
              <app-custom-select
                [options]="ownerFilterOptions()"
                [placeholder]="'All Plan Owners'"
                [size]="'sm'"
                [ngModel]="filters().planOwnerEmail"
                (valueChange)="onOwnerFilterChange($event)">
              </app-custom-select>
            </div>

            <!-- 3. Duration Type -->
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Duration Type
              </label>
              <div class="flex flex-wrap gap-1.5">
                @for (dt of availableDurations; track dt) {
                  <button 
                    type="button"
                    (click)="toggleDurationFilter(dt)"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                    [ngClass]="isDurationSelected(dt) 
                      ? 'bg-tenant-600 text-white border-tenant-600 shadow-xs' 
                      : 'bg-base-200 border-base-300 dark:border-slate-700 text-text-secondary hover:text-text-primary hover:bg-base-300'">
                    {{ dt }}
                  </button>
                }
              </div>
            </div>

            <!-- 4. Enrollment Type & Date Range -->
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Enrollment Type
              </label>
              <div class="flex flex-wrap gap-1.5">
                @for (et of availableEnrollments; track et) {
                  <button 
                    type="button"
                    (click)="toggleEnrollmentFilter(et)"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                    [ngClass]="isEnrollmentSelected(et) 
                      ? 'bg-tenant-600 text-white border-tenant-600 shadow-xs' 
                      : 'bg-base-200 border-base-300 dark:border-slate-700 text-text-secondary hover:text-text-primary hover:bg-base-300'">
                    {{ et }}
                  </button>
                }
              </div>
            </div>

          </div>
        }

        <!-- Active Filter Badges Bar (§6.3.7) -->
        @if (activeFilterBadges().length > 0) {
          <div class="pt-3 border-t border-base-300 dark:border-slate-800 flex items-center flex-wrap gap-2 text-xs">
            <span class="text-[11px] font-medium text-text-secondary">Active Filters:</span>
            @for (badge of activeFilterBadges(); track badge.id) {
              <span class="px-2.5 py-1 rounded-md bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-300 border border-tenant-200 dark:border-tenant-900/60 inline-flex items-center gap-1.5 text-xs">
                <span>{{ badge.label }}: <strong>{{ badge.value }}</strong></span>
                <button 
                  type="button" 
                  (click)="badge.remove()" 
                  class="hover:text-rose-500 focus:outline-none">
                  <span class="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            }
            <button 
              type="button"
              (click)="clearAllFilters()"
              class="text-[11px] text-text-secondary hover:text-rose-500 hover:underline ml-1">
              Reset
            </button>
          </div>
        }

      </div>

      <!-- ================================================================= -->
      <!-- PLAN GRID TABLE (All 11 Fields §6.4)                              -->
      <!-- ================================================================= -->
      <div id="plan-grid-card" class="rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 overflow-hidden shadow-sm">
        
        @if (filteredPlans().length === 0) {
          <!-- Empty State -->
          <div class="p-12 text-center text-xs space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-base-200 dark:bg-base-300 text-text-secondary flex items-center justify-center mx-auto">
              <span class="material-symbols-outlined text-3xl">event_busy</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-text-primary">
                {{ activeFilterCount() > 0 || filters().search ? 'No Plan found matching the selected filters.' : 'No Plan information is available to display.' }}
              </h3>
              <p class="text-text-secondary mt-1 max-w-sm mx-auto">
                {{ activeFilterCount() > 0 || filters().search ? 'Try clearing or modifying your filter parameters to view other learning plans.' : 'No plans have been structured inside this LMS workspace yet.' }}
              </p>
            </div>
            @if (activeFilterCount() > 0 || filters().search) {
              <button 
                type="button"
                (click)="clearAllFilters()"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-tenant-600 text-white hover:bg-tenant-700 transition-colors">
                Clear Filters
              </button>
            }
          </div>
        } @else {
          
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-base-300 dark:border-slate-800 bg-base-200/50 dark:bg-base-300/40 text-[11px] font-bold text-text-secondary uppercase tracking-wider select-none">
                  
                  <!-- 1. Plan Name -->
                  <th class="py-3 px-4 min-w-[220px]">Plan Name</th>
                  
                  <!-- 2. Plan Code -->
                  <th class="py-3 px-4">Plan Code</th>
                  
                  <!-- 3. Plan Owner -->
                  <th class="py-3 px-4 min-w-[180px]">Plan Owner</th>
                  
                  <!-- 4. Duration Type -->
                  <th class="py-3 px-4">Duration</th>
                  
                  <!-- 5. Start Date -->
                  <th class="py-3 px-4">Start Date</th>
                  
                  <!-- 6. End Date -->
                  <th class="py-3 px-4">End Date</th>
                  
                  <!-- 7. Number of Phases -->
                  <th class="py-3 px-4 text-center">Phases</th>
                  
                  <!-- 8. Enrollment Type -->
                  <th class="py-3 px-4">Enrollment</th>
                  
                  <!-- 9. Status -->
                  <th class="py-3 px-4">Status</th>
                  
                  <!-- 10. Created Date -->
                  <th class="py-3 px-4 cursor-pointer hover:text-text-primary" (click)="toggleSort('createdDate')">
                    <div class="flex items-center gap-1">
                      <span>Created</span>
                      <span class="material-symbols-outlined text-xs">{{ sortField() === 'createdDate' && sortOrder() === 'desc' ? 'arrow_downward' : 'arrow_upward' }}</span>
                    </div>
                  </th>

                  <!-- Actions -->
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-base-300 dark:divide-slate-800/80">
                @for (plan of filteredPlans(); track plan.id) {
                  <tr 
                    class="hover:bg-base-200/50 dark:hover:bg-base-300/30 transition-colors group cursor-pointer"
                    (click)="viewPlanDetails(plan)">
                    
                    <!-- 1. Plan Name & Description -->
                    <td class="py-3.5 px-4 font-semibold text-text-primary">
                      <div class="flex items-start gap-2">
                        <div class="w-7 h-7 rounded-lg bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 flex items-center justify-center shrink-0 mt-0.5">
                          <span class="material-symbols-outlined text-sm">event_note</span>
                        </div>
                        <div class="min-w-0">
                          <span class="group-hover:text-tenant-600 dark:group-hover:text-tenant-400 transition-colors">{{ plan.name }}</span>
                          @if (plan.description) {
                            <div class="text-[11px] font-normal text-text-secondary line-clamp-1 mt-0.5">
                              {{ plan.description }}
                            </div>
                          }
                        </div>
                      </div>
                    </td>

                    <!-- 2. Plan Code -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-300 border border-tenant-200 dark:border-tenant-900/60">
                        {{ plan.planCode }}
                      </span>
                    </td>

                    <!-- 3. Plan Owner (Name / Avatar / Email) -->
                    <td class="py-3.5 px-4">
                      @if (plan.owner?.name) {
                        <div class="flex items-center gap-2">
                          <div class="w-6 h-6 rounded-full bg-tenant-500/20 text-tenant-700 dark:text-tenant-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {{ plan.owner.name.charAt(0) }}
                          </div>
                          <div class="min-w-0">
                            <div class="font-medium text-text-primary truncate">{{ plan.owner.name }}</div>
                            <div class="text-[10px] text-text-secondary truncate">{{ plan.owner.email }}</div>
                          </div>
                        </div>
                      } @else {
                        <button 
                          type="button"
                          (click)="$event.stopPropagation(); openAssignModal(plan)"
                          class="px-2 py-1 rounded text-[11px] font-semibold text-tenant-600 dark:text-tenant-400 bg-tenant-50 dark:bg-tenant-950/30 border border-tenant-200 dark:border-tenant-900/50 hover:bg-tenant-100 flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">person_add</span>
                          <span>Assign Owner</span>
                        </button>
                      }
                    </td>

                    <!-- 4. Duration Type -->
                    <td class="py-3.5 px-4 whitespace-nowrap text-text-secondary font-medium">
                      {{ plan.durationType }}
                    </td>

                    <!-- 5. Start Date -->
                    <td class="py-3.5 px-4 whitespace-nowrap text-text-primary">
                      {{ plan.startDate }}
                    </td>

                    <!-- 6. End Date -->
                    <td class="py-3.5 px-4 whitespace-nowrap text-text-primary">
                      {{ plan.endDate }}
                    </td>

                    <!-- 7. Number of Phases -->
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] bg-base-200 dark:bg-base-300 text-text-primary">
                        <span class="material-symbols-outlined text-xs text-tenant-500">timeline</span>
                        {{ plan.phases?.length || plan.phaseCount }}
                      </span>
                    </td>

                    <!-- 8. Enrollment Type -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <span 
                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        [ngClass]="plan.enrollmentType === 'Open' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'">
                        {{ plan.enrollmentType }}
                      </span>
                    </td>

                    <!-- 9. Status Badge -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <span 
                        class="px-2.5 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider"
                        [ngClass]="getStatusBadgeClass(plan.status)">
                        {{ plan.status }}
                      </span>
                    </td>

                    <!-- 10. Created Date -->
                    <td class="py-3.5 px-4 whitespace-nowrap text-text-secondary">
                      {{ plan.createdDate }}
                    </td>

                    <!-- 11. Row Actions -->
                    <td class="py-3.5 px-4 text-right whitespace-nowrap" (click)="$event.stopPropagation()">
                      <div class="flex items-center justify-end gap-1.5">
                        
                        <!-- Assign Owner Button -->
                        @if (plan.status !== 'Archived') {
                          <button 
                            type="button"
                            title="Assign Plan Owner"
                            (click)="openAssignModal(plan)"
                            class="p-1.5 rounded-lg text-text-secondary hover:text-tenant-600 hover:bg-base-200 dark:hover:bg-base-300 transition-colors">
                            <span class="material-symbols-outlined text-base">person_add</span>
                          </button>
                        }

                        <!-- View Details Button -->
                        <button 
                          type="button"
                          title="View Plan Details"
                          (click)="viewPlanDetails(plan)"
                          class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-base-200 hover:bg-tenant-600 hover:text-white border border-base-300 dark:border-slate-700 text-text-primary transition-all flex items-center gap-1">
                          <span>Details</span>
                          <span class="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>

        }

      </div>

    </div>

    <!-- ===================================================================== -->
    <!-- MODALS                                                                -->
    <!-- ===================================================================== -->

    <!-- Assign Plan Owner Modal (§7) -->
    @if (selectedPlanForAssign()) {
      <app-assign-owner-modal
        [plan]="selectedPlanForAssign()!"
        (close)="selectedPlanForAssign.set(null)"
        (assigned)="onOwnerAssigned()">
      </app-assign-owner-modal>
    }

    <!-- Edit Plan Modal (§10) -->
    @if (selectedPlanForEdit()) {
      <app-edit-plan-modal
        [plan]="selectedPlanForEdit()!"
        (close)="selectedPlanForEdit.set(null)"
        (updated)="onPlanUpdated()">
      </app-edit-plan-modal>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class PlanGridComponent implements OnInit {
  private router = inject(Router);
  private lmsData = inject(LmsDataService);

  activeTenant = this.lmsData.activeTenant;
  activeLms = this.lmsData.activeLms;
  plans = this.lmsData.activeLmsPlans;

  isFilterPanelOpen = signal(false);

  availableStatuses: PlanStatus[] = ['Draft', 'Published', 'Active', 'Completed', 'Archived'];
  availableDurations: DurationType[] = ['Yearly', 'Half-Yearly', 'Quarterly'];
  availableEnrollments: EnrollmentType[] = ['Open', 'Closed'];

  filters = signal<PlanGridFilter>({
    search: '',
    status: [],
    planOwnerEmail: null,
    durationType: [],
    enrollmentType: [],
    startDate: null,
    endDate: null
  });

  sortField = signal<'createdDate' | 'name' | 'startDate'>('createdDate');
  sortOrder = signal<'asc' | 'desc'>('desc');

  selectedPlanForAssign = signal<Plan | null>(null);
  selectedPlanForEdit = signal<Plan | null>(null);

  ownerFilterOptions = computed<SelectOption[]>(() => {
    const list = this.plans();
    const ownersMap = new Map<string, string>();
    list.forEach(p => {
      if (p.owner?.email && p.owner?.name) {
        ownersMap.set(p.owner.email, p.owner.name);
      }
    });

    const opts: SelectOption[] = [
      { value: null, label: 'All Plan Owners' }
    ];

    ownersMap.forEach((name, email) => {
      opts.push({
        value: email,
        label: name,
        sublabel: email,
        icon: 'person'
      });
    });

    return opts;
  });

  activeFilterCount = computed<number>(() => {
    const f = this.filters();
    let count = 0;
    if (f.status.length > 0) count++;
    if (f.planOwnerEmail) count++;
    if (f.durationType.length > 0) count++;
    if (f.enrollmentType.length > 0) count++;
    if (f.startDate || f.endDate) count++;
    return count;
  });

  activeFilterBadges = computed<{ id: string; label: string; value: string; remove: () => void }[]>(() => {
    const f = this.filters();
    const badges: { id: string; label: string; value: string; remove: () => void }[] = [];

    f.status.forEach(st => {
      badges.push({
        id: `st-${st}`,
        label: 'Status',
        value: st,
        remove: () => this.toggleStatusFilter(st)
      });
    });

    if (f.planOwnerEmail) {
      const opt = this.ownerFilterOptions().find(o => o.value === f.planOwnerEmail);
      badges.push({
        id: 'owner',
        label: 'Owner',
        value: opt ? opt.label : f.planOwnerEmail,
        remove: () => this.onOwnerFilterChange(null)
      });
    }

    f.durationType.forEach(dt => {
      badges.push({
        id: `dt-${dt}`,
        label: 'Duration',
        value: dt,
        remove: () => this.toggleDurationFilter(dt)
      });
    });

    f.enrollmentType.forEach(et => {
      badges.push({
        id: `et-${et}`,
        label: 'Enrollment',
        value: et,
        remove: () => this.toggleEnrollmentFilter(et)
      });
    });

    return badges;
  });

  filteredPlans = computed<Plan[]>(() => {
    const all = this.plans();
    const f = this.filters();
    const search = f.search.trim().toLowerCase();

    return all.filter(p => {
      // Archived filter rule (§6.3.8): Archived plans hidden by default unless 'Archived' is in status filter
      if (p.status === 'Archived' && !f.status.includes('Archived')) {
        return false;
      }

      // Search match: Name OR Code
      if (search) {
        const matchesName = p.name.toLowerCase().includes(search);
        const matchesCode = p.planCode.toLowerCase().includes(search);
        const matchesOwner = p.owner?.name?.toLowerCase().includes(search) || p.owner?.email?.toLowerCase().includes(search);
        if (!matchesName && !matchesCode && !matchesOwner) {
          return false;
        }
      }

      // Status filter
      if (f.status.length > 0 && !f.status.includes(p.status)) {
        return false;
      }

      // Owner filter
      if (f.planOwnerEmail && p.owner?.email !== f.planOwnerEmail) {
        return false;
      }

      // Duration type filter
      if (f.durationType.length > 0 && !f.durationType.includes(p.durationType)) {
        return false;
      }

      // Enrollment type filter
      if (f.enrollmentType.length > 0 && !f.enrollmentType.includes(p.enrollmentType)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Latest created first by default
      const field = this.sortField();
      const order = this.sortOrder() === 'asc' ? 1 : -1;
      if (field === 'createdDate') {
        return compareDDMMYYYY(b.createdDate, a.createdDate) * (this.sortOrder() === 'desc' ? 1 : -1);
      }
      return a.name.localeCompare(b.name) * order;
    });
  });

  ngOnInit() {}

  toggleFilterPanel() {
    this.isFilterPanelOpen.update(v => !v);
  }

  onSearchChange(val: string) {
    this.filters.update(f => ({ ...f, search: val }));
  }

  toggleStatusFilter(status: PlanStatus) {
    this.filters.update(f => {
      const exists = f.status.includes(status);
      return {
        ...f,
        status: exists ? f.status.filter(s => s !== status) : [...f.status, status]
      };
    });
  }

  isStatusSelected(status: PlanStatus): boolean {
    return this.filters().status.includes(status);
  }

  onOwnerFilterChange(email: string | null) {
    this.filters.update(f => ({ ...f, planOwnerEmail: email }));
  }

  toggleDurationFilter(dt: DurationType) {
    this.filters.update(f => {
      const exists = f.durationType.includes(dt);
      return {
        ...f,
        durationType: exists ? f.durationType.filter(d => d !== dt) : [...f.durationType, dt]
      };
    });
  }

  isDurationSelected(dt: DurationType): boolean {
    return this.filters().durationType.includes(dt);
  }

  toggleEnrollmentFilter(et: EnrollmentType) {
    this.filters.update(f => {
      const exists = f.enrollmentType.includes(et);
      return {
        ...f,
        enrollmentType: exists ? f.enrollmentType.filter(e => e !== et) : [...f.enrollmentType, et]
      };
    });
  }

  isEnrollmentSelected(et: EnrollmentType): boolean {
    return this.filters().enrollmentType.includes(et);
  }

  clearAllFilters() {
    this.filters.set({
      search: '',
      status: [],
      planOwnerEmail: null,
      durationType: [],
      enrollmentType: [],
      startDate: null,
      endDate: null
    });
  }

  toggleSort(field: 'createdDate' | 'name' | 'startDate') {
    if (this.sortField() === field) {
      this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('desc');
    }
  }

  viewPlanDetails(plan: Plan) {
    this.router.navigate(['/plans/details', plan.id]);
  }

  navigateToCreate() {
    this.router.navigate(['/plans/create']);
  }

  openAssignModal(plan: Plan) {
    this.selectedPlanForAssign.set(plan);
  }

  onOwnerAssigned() {
    this.selectedPlanForAssign.set(null);
  }

  openEditModal(plan: Plan) {
    this.selectedPlanForEdit.set(plan);
  }

  onPlanUpdated() {
    this.selectedPlanForEdit.set(null);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
      case 'Published':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
      case 'Completed':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
      case 'Archived':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'Draft':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900';
    }
  }
}
