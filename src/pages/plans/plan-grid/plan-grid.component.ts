import { Component, inject, computed, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
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

@Component({
  selector: 'app-plan-grid',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    AssignOwnerModalComponent,
    EditPlanModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 pb-16">
      
      <!-- ========================================================================= -->
      <!-- 1. HEADER & WORKSPACE SCOPE BANNER                                        -->
      <!-- ========================================================================= -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-tenant-100 dark:bg-tenant-950/80 text-tenant-700 dark:text-tenant-300 border border-tenant-200 dark:border-tenant-800">
              Fixed LMS Workspace Scope
            </span>
            <span class="text-xs text-text-secondary">
              Parent LMS: <strong class="font-bold text-text-primary">{{ activeLms().basicInfo.lmsName }}</strong>
              (ID: <strong class="font-mono text-text-primary">{{ activeLms().id }}</strong>) &bull; Org: <strong class="text-text-primary">{{ activeTenant().name }}</strong>
            </span>
          </div>
          
          <!-- Primary Heading -->
          <h1 class="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
            <span class="material-symbols-outlined text-tenant-600 text-3xl">event_note</span>
            <span>Learning Plans</span>
          </h1>
          
          <!-- Subtitle -->
          <p class="text-xs sm:text-sm text-text-secondary mt-0.5">
            All learning plans, phase roadmaps, and administrative ownership under this LMS.
          </p>
        </div>

        <!-- Top-Right Action Buttons -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <a 
            id="btn-plan-dashboard-header"
            [routerLink]="['/plans/dashboard']"
            class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-base-200 hover:bg-base-300 active:scale-95 text-text-primary text-xs font-semibold border border-base-300 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-tenant-600 dark:text-tenant-400 text-lg">space_dashboard</span>
            <span>Plan Dashboard</span>
          </a>

          <button 
            type="button"
            id="btn-create-plan-header"
            (click)="navigateToCreate()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-tenant-500/20 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-lg">add_circle</span>
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. SEARCH & FILTER CONTROLS                                               -->
      <!-- ========================================================================= -->
      <div class="bg-white dark:bg-base-100 rounded-2xl border border-slate-100 dark:border-base-300 p-3 sm:p-4 shadow-2xs space-y-3">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <!-- Left: Search Field (Searches Plan Name or Plan Code) + Filter Button -->
          <div class="flex items-center gap-2.5 flex-1 max-w-2xl">
            
            <!-- Search Field -->
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">search</span>
              <input
                type="text"
                id="input-plan-name-search"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search by Plan Name or Plan Code..."
                class="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-base-200/50 border border-slate-200/80 dark:border-base-300 text-xs text-text-primary placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all shadow-2xs" />
              @if (searchQuery()) {
                <button 
                  type="button"
                  (click)="onSearchChange('')"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer">
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              }
            </div>

            <!-- Filter Button beside Search -->
            <button 
              type="button"
              id="btn-toggle-filter-panel"
              (click)="toggleFilterPanel()"
              class="px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
              [class]="isFilterPanelOpen() || hasActiveFilters()
                ? 'bg-[#ec008c] text-white border-[#ec008c]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-base-300'"
              title="Filters">
              <span class="material-symbols-outlined text-base" [class.text-slate-600]="!isFilterPanelOpen() && !hasActiveFilters()" [class.text-white]="isFilterPanelOpen() || hasActiveFilters()">filter_list</span>
              <span>Filters</span>
              @if (activeFilterCount() > 0) {
                <span class="w-4 h-4 rounded-full bg-white text-[#ec008c] text-[10px] font-bold flex items-center justify-center">
                  {{ activeFilterCount() }}
                </span>
              }
            </button>

            <!-- Grid-Level Reset Button -->
            @if (isResetVisible()) {
              <button 
                type="button"
                id="btn-grid-reset"
                (click)="resetGrid()"
                class="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all animate-in fade-in"
                title="Clear search and all active filters">
                <span class="material-symbols-outlined text-sm">restart_alt</span>
                <span>Reset</span>
              </button>
            }

          </div>

          <!-- Right: Total Count Indicator -->
          <div class="flex items-center justify-end text-xs text-text-secondary self-end sm:self-auto flex-shrink-0">
            <span class="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-base-200 border border-slate-200/80 dark:border-base-300 font-semibold">
              Showing <strong class="text-text-primary">{{ filteredPlans().length }}</strong> of {{ plans().length }} Plans
            </span>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 3.1 FILTER PANEL DROPDOWN / DRAWER                                        -->
        <!-- ========================================================================= -->
        @if (isFilterPanelOpen()) {
          <div class="pt-5 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200 space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              <!-- 1. Status Multi-select -->
              <div class="lg:col-span-4 space-y-3">
                <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  1. Status
                </h4>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  @for (st of availableStatuses; track st) {
                    <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        [checked]="draftFilters().status.includes(st)"
                        (change)="toggleStatusDraft(st)"
                        class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#FF007A] focus:ring-0 focus:outline-none cursor-pointer" />
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all" [class]="getStatusBadgeClass(st)">
                        <span class="w-1.5 h-1.5 rounded-full" [class]="getStatusDotClass(st)"></span>
                        {{ st }}
                      </span>
                    </label>
                  }
                </div>
              </div>

              <!-- 2. Duration Type -->
              <div class="lg:col-span-3 space-y-3">
                <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  2. Duration Type
                </h4>
                <div class="flex flex-col gap-2">
                  @for (dt of availableDurations; track dt) {
                    <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        [checked]="draftFilters().durationType.includes(dt)"
                        (change)="toggleDurationDraft(dt)"
                        class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#FF007A] focus:ring-0 focus:outline-none cursor-pointer" />
                      <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700">
                        {{ dt }}
                      </span>
                    </label>
                  }
                </div>
              </div>

              <!-- 3. Enrollment Type -->
              <div class="lg:col-span-2 space-y-3">
                <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  3. Enrollment
                </h4>
                <div class="flex flex-col gap-2">
                  @for (et of availableEnrollments; track et) {
                    <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        [checked]="draftFilters().enrollmentType.includes(et)"
                        (change)="toggleEnrollmentDraft(et)"
                        class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#FF007A] focus:ring-0 focus:outline-none cursor-pointer" />
                      <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border"
                            [class]="et === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'">
                        {{ et }}
                      </span>
                    </label>
                  }
                </div>
              </div>

              <!-- 4. Plan Owner & Date Range -->
              <div class="lg:col-span-3 space-y-3">
                <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  4. Plan Owner
                </h4>
                <div>
                  <select 
                    [ngModel]="draftFilters().planOwnerEmail"
                    (ngModelChange)="setOwnerDraft($event)"
                    class="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#FF007A] transition-colors shadow-2xs">
                    <option [ngValue]="null">All Plan Owners</option>
                    @for (owner of ownerOptions(); track owner.email) {
                      <option [value]="owner.email">{{ owner.name }} ({{ owner.email }})</option>
                    }
                  </select>
                </div>

                <div class="pt-2">
                  <span class="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-medium">Start Date:</span>
                  <input 
                    type="date"
                    [ngModel]="draftFilters().startDate"
                    (ngModelChange)="setStartDateDraft($event)"
                    class="w-full px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#FF007A] transition-colors shadow-2xs" />
                </div>
              </div>

            </div>

            <!-- Filter Panel Footer Actions -->
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <button 
                type="button"
                (click)="clearFilterPanelDraft()"
                class="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-0 p-0 focus:outline-none">
                Clear All Selections
              </button>

              <div class="flex items-center gap-3">
                <button 
                  type="button"
                  (click)="closeFilterPanel()"
                  class="px-5 py-2 rounded-xl sm:rounded-full bg-[#F1F5F9] hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer focus:outline-none">
                  Cancel
                </button>
                <button 
                  type="button"
                  id="btn-apply-filters"
                  (click)="applyFilterPanel()"
                  class="px-6 py-2 rounded-xl sm:rounded-full bg-[#FF007A] hover:bg-[#E0006C] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer focus:outline-none">
                  Apply Filter
                </button>
              </div>
            </div>

          </div>
        }

        <!-- ========================================================================= -->
        <!-- 3.2 ACTIVE FILTER CHIPS ROW                                               -->
        <!-- ========================================================================= -->
        @if (hasActiveFilters()) {
          <div class="pt-3 border-t border-base-300 flex items-center gap-2 flex-wrap text-xs">
            <span class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Active Filters:
            </span>

            <!-- Status Chips -->
            @for (st of appliedFilters().status; track st) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary">
                <span>Status: <strong>{{ st }}</strong></span>
                <button type="button" (click)="removeStatusFilter(st)" class="hover:text-rose-600 cursor-pointer">
                  <span class="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            }

            <!-- Duration Chips -->
            @for (dt of appliedFilters().durationType; track dt) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary">
                <span>Duration: <strong>{{ dt }}</strong></span>
                <button type="button" (click)="removeDurationFilter(dt)" class="hover:text-rose-600 cursor-pointer">
                  <span class="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            }

            <!-- Enrollment Chips -->
            @for (et of appliedFilters().enrollmentType; track et) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary">
                <span>Enrollment: <strong>{{ et }}</strong></span>
                <button type="button" (click)="removeEnrollmentFilter(et)" class="hover:text-rose-600 cursor-pointer">
                  <span class="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            }

            <!-- Owner Chip -->
            @if (appliedFilters().planOwnerEmail) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary">
                <span>Owner: <strong>{{ getOwnerDisplayName(appliedFilters().planOwnerEmail) }}</strong></span>
                <button type="button" (click)="removeOwnerFilter()" class="hover:text-rose-600 cursor-pointer">
                  <span class="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            }

            <!-- Date Chip -->
            @if (appliedFilters().startDate) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary">
                <span>Start Date: <strong>{{ appliedFilters().startDate }}</strong></span>
                <button type="button" (click)="removeStartDateFilter()" class="hover:text-rose-600 cursor-pointer">
                  <span class="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            }

            <!-- Clear all chips button -->
            <button 
              type="button" 
              (click)="resetGrid()" 
              class="text-xs text-tenant-600 dark:text-tenant-400 hover:underline font-semibold ml-auto cursor-pointer">
              Clear All Filters
            </button>
          </div>
        }

      </div>

      <!-- ========================================================================= -->
      <!-- 4. EMPTY STATES                                                           -->
      <!-- ========================================================================= -->
      
      <!-- Case 1: True Empty State -->
      @if (emptyStateType() === 'true_empty') {
        <div class="bg-base-100 rounded-3xl border border-base-300 p-12 text-center space-y-4 shadow-xs animate-in fade-in">
          <div class="w-16 h-16 rounded-2xl bg-tenant-50 dark:bg-tenant-950/60 text-tenant-600 border border-tenant-200 dark:border-tenant-800 flex items-center justify-center mx-auto">
            <span class="material-symbols-outlined text-3xl">event_busy</span>
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-text-primary">
              No Plan information is available to display.
            </h3>
            <p class="text-xs text-text-secondary max-w-md mx-auto">
              No learning plans have been configured yet under {{ activeLms().basicInfo.lmsName }}. Create your workspace's first learning plan to get started.
            </p>
          </div>
          <button 
            type="button"
            (click)="navigateToCreate()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-bold shadow-md shadow-tenant-500/20 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-base">add_circle</span>
            <span>Create Plan</span>
          </button>
        </div>
      }

      <!-- Case 2: Search Miss -->
      @else if (emptyStateType() === 'search_miss') {
        <div class="bg-base-100 rounded-3xl border border-base-300 p-12 text-center space-y-4 shadow-xs animate-in fade-in">
          <div class="w-16 h-16 rounded-2xl bg-base-200 text-text-secondary flex items-center justify-center mx-auto">
            <span class="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-text-primary">
              No Plan found
            </h3>
            <p class="text-xs text-text-secondary max-w-md mx-auto">
              No plan name or code matches "<strong class="text-text-primary">{{ searchQuery() }}</strong>". Check spelling or reset search query.
            </p>
          </div>
          <button 
            type="button"
            (click)="onSearchChange('')"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-semibold transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-sm">close</span>
            <span>Clear Search Text</span>
          </button>
        </div>
      }

      <!-- Case 3: Filter Miss -->
      @else if (emptyStateType() === 'filter_miss') {
        <div class="bg-base-100 rounded-3xl border border-base-300 p-12 text-center space-y-4 shadow-xs animate-in fade-in">
          <div class="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
            <span class="material-symbols-outlined text-3xl">filter_alt_off</span>
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-text-primary">
              No Plan found matching the selected filters.
            </h3>
            <p class="text-xs text-text-secondary max-w-md mx-auto">
              Try expanding your filter criteria, choosing different statuses, or clearing filters to view all learning plans.
            </p>
          </div>
          <button 
            type="button"
            (click)="resetGrid()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-sm">restart_alt</span>
            <span>Reset All Filters</span>
          </button>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 5. LEARNING PLANS DATA TABLE                                              -->
      <!-- ========================================================================= -->
      @else {
        <div class="bg-base-100 rounded-3xl border border-base-300 overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="min-w-[1200px] w-full text-left text-xs border-separate border-spacing-0">
              <thead class="bg-base-200/90 text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3.5 px-4 min-w-[260px] border-b border-base-300">Plan Details</th>
                  <th class="py-3.5 px-4 min-w-[120px] border-b border-base-300">Plan Code</th>
                  <th class="py-3.5 px-4 min-w-[180px] border-b border-base-300">Plan Owner</th>
                  <th class="py-3.5 px-4 min-w-[110px] border-b border-base-300">Duration</th>
                  <th class="py-3.5 px-4 min-w-[110px] border-b border-base-300">Start Date</th>
                  <th class="py-3.5 px-4 min-w-[110px] border-b border-base-300">End Date</th>
                  <th class="py-3.5 px-4 min-w-[80px] text-center border-b border-base-300">Phases</th>
                  <th class="py-3.5 px-4 min-w-[100px] border-b border-base-300">Enrollment</th>
                  <th class="py-3.5 px-4 min-w-[130px] border-b border-base-300">Status</th>
                  <th class="py-3.5 px-4 min-w-[110px] border-b border-base-300 cursor-pointer hover:text-text-primary select-none" (click)="toggleSort('createdDate')">
                    <div class="flex items-center gap-1">
                      <span>Created</span>
                      <span class="material-symbols-outlined text-xs">{{ sortField() === 'createdDate' && sortOrder() === 'desc' ? 'arrow_downward' : 'arrow_upward' }}</span>
                    </div>
                  </th>
                  <th class="py-3.5 px-4 text-right sticky right-0 bg-base-200 dark:bg-base-300 z-20 w-[140px] min-w-[140px] border-b border-l border-base-300 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.4)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (plan of filteredPlans(); track plan.id) {
                  <tr 
                    (click)="viewPlanDetails(plan)"
                    class="group hover:bg-base-200/50 transition-colors cursor-pointer">
                    
                    <!-- 1. Plan Details -->
                    <td class="py-3 px-4 border-b border-base-300/60">
                      <div class="flex items-center gap-3 min-w-[220px]">
                        <div class="w-9 h-9 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center flex-shrink-0 text-tenant-600 dark:text-tenant-400">
                          <span class="material-symbols-outlined text-base">event_note</span>
                        </div>
                        <div class="min-w-0">
                          <span class="font-bold text-text-primary group-hover:text-[#ec008c] transition-colors block line-clamp-1">{{ plan.name }}</span>
                          <span class="text-[10px] text-text-secondary line-clamp-1">{{ plan.description || 'Structured learning roadmap' }}</span>
                        </div>
                      </div>
                    </td>

                    <!-- 2. Plan Code -->
                    <td class="py-3 px-4 whitespace-nowrap border-b border-base-300/60">
                      <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-base-200 text-text-secondary border border-base-300">
                        {{ plan.planCode }}
                      </span>
                    </td>

                    <!-- 3. Plan Owner -->
                    <td class="py-3 px-4 border-b border-base-300/60">
                      @if (plan.owner?.name) {
                        <div class="flex items-center gap-2">
                          <div class="w-7 h-7 rounded-full bg-tenant-100 dark:bg-tenant-900/60 text-tenant-700 dark:text-tenant-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-tenant-200 dark:border-tenant-800">
                            {{ plan.owner.name.charAt(0) }}
                          </div>
                          <div class="min-w-0">
                            <span class="font-bold text-text-primary block truncate">{{ plan.owner.name }}</span>
                            <span class="text-[10px] text-text-secondary font-mono truncate block">{{ plan.owner.email }}</span>
                          </div>
                        </div>
                      } @else {
                        <button 
                          type="button"
                          (click)="$event.stopPropagation(); openAssignModal(plan)"
                          class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-tenant-600 dark:text-tenant-400 bg-tenant-50 dark:bg-tenant-950/40 border border-tenant-200 dark:border-tenant-800 hover:bg-tenant-100 transition-colors flex items-center gap-1 cursor-pointer">
                          <span class="material-symbols-outlined text-xs">person_add</span>
                          <span>Assign</span>
                        </button>
                      }
                    </td>

                    <!-- 4. Duration Type -->
                    <td class="py-3 px-4 whitespace-nowrap text-text-secondary font-medium border-b border-base-300/60">
                      {{ plan.durationType }}
                    </td>

                    <!-- 5. Start Date -->
                    <td class="py-3 px-4 whitespace-nowrap font-mono text-text-primary border-b border-base-300/60">
                      {{ plan.startDate }}
                    </td>

                    <!-- 6. End Date -->
                    <td class="py-3 px-4 whitespace-nowrap font-mono text-text-primary border-b border-base-300/60">
                      {{ plan.endDate }}
                    </td>

                    <!-- 7. Phases -->
                    <td class="py-3 px-4 text-center whitespace-nowrap border-b border-base-300/60">
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-base-200 text-text-secondary">
                        <span class="material-symbols-outlined text-xs text-tenant-500">timeline</span>
                        {{ plan.phases?.length || plan.phaseCount }}
                      </span>
                    </td>

                    <!-- 8. Enrollment Type -->
                    <td class="py-3 px-4 whitespace-nowrap border-b border-base-300/60">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                            [class]="plan.enrollmentType === 'Open' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'">
                        {{ plan.enrollmentType }}
                      </span>
                    </td>

                    <!-- 9. Status -->
                    <td class="py-3 px-4 min-w-[130px] whitespace-nowrap border-b border-base-300/60">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5"
                            [class]="getStatusBadgeClass(plan.status)">
                        <span class="w-1.5 h-1.5 rounded-full" [class]="getStatusDotClass(plan.status)"></span>
                        {{ plan.status }}
                      </span>
                    </td>

                    <!-- 10. Created Date -->
                    <td class="py-3 px-4 whitespace-nowrap font-mono text-text-secondary border-b border-base-300/60">
                      {{ plan.createdDate }}
                    </td>

                    <!-- 11. Actions -->
                    <td class="py-3 px-4 text-right sticky right-0 bg-base-100 dark:bg-base-100 group-hover:bg-slate-50 dark:group-hover:bg-base-200 transition-colors z-10 w-[140px] min-w-[140px] border-b border-l border-base-300/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.4)]">
                      <div class="flex items-center justify-end gap-1.5" (click)="$event.stopPropagation()">
                        
                        <!-- Assign Owner Button -->
                        @if (plan.status !== 'Archived') {
                          <button 
                            type="button"
                            [id]="'btn-assign-plan-' + plan.id"
                            (click)="openAssignModal(plan)"
                            class="p-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-slate-400 hover:text-[#ec008c] transition-colors cursor-pointer"
                            title="Assign Plan Owner">
                            <span class="material-symbols-outlined text-base">person_add</span>
                          </button>
                        }

                        <!-- Edit Plan Button -->
                        <button 
                          type="button"
                          [id]="'btn-edit-plan-' + plan.id"
                          (click)="openEditModal(plan)"
                          class="p-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-slate-400 hover:text-[#ec008c] transition-colors cursor-pointer"
                          title="Edit Learning Plan">
                          <span class="material-symbols-outlined text-base">edit</span>
                        </button>

                        <!-- View Details Button -->
                        <button 
                          type="button"
                          [id]="'btn-details-plan-' + plan.id"
                          (click)="viewPlanDetails(plan)"
                          class="p-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-text-secondary hover:text-[#ec008c] transition-colors cursor-pointer"
                          title="View Plan Details & Roadmaps">
                          <span class="material-symbols-outlined text-base">diamond</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>

    <!-- ========================================================================= -->
    <!-- MODALS                                                                    -->
    <!-- ========================================================================= -->

    <!-- Assign Plan Owner Modal -->
    @if (selectedPlanForAssign()) {
      <app-assign-owner-modal
        [plan]="selectedPlanForAssign()!"
        (close)="selectedPlanForAssign.set(null)"
        (assigned)="onOwnerAssigned()">
      </app-assign-owner-modal>
    }

    <!-- Edit Plan Modal -->
    @if (selectedPlanForEdit()) {
      <app-edit-plan-modal
        [plan]="selectedPlanForEdit()!"
        (close)="selectedPlanForEdit.set(null)"
        (updated)="onPlanUpdated()">
      </app-edit-plan-modal>
    }
  `
})
export class PlanGridComponent implements OnInit {
  private router = inject(Router);
  private lmsData = inject(LmsDataService);

  activeTenant = this.lmsData.activeTenant;
  activeLms = this.lmsData.activeLms;
  plans = this.lmsData.activeLmsPlans;

  // 1. Search Query
  searchQuery = signal<string>('');

  // 2. Filter Panel Drawer State
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
    durationType: [],
    enrollmentType: [],
    startDate: null,
    endDate: null
  });

  // Applied filters driving the grid data
  appliedFilters = signal<PlanGridFilter>({
    search: '',
    status: [],
    planOwnerEmail: null,
    durationType: [],
    enrollmentType: [],
    startDate: null,
    endDate: null
  });

  // Sorting
  sortField = signal<'createdDate' | 'name' | 'startDate'>('createdDate');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Modals
  selectedPlanForAssign = signal<Plan | null>(null);
  selectedPlanForEdit = signal<Plan | null>(null);

  // Operational Telemetry Statistics
  planStats = computed(() => {
    const list = this.plans();
    const activeCount = list.filter(p => p.status === 'Active').length;
    const publishedCount = list.filter(p => p.status === 'Published').length;
    const draftCount = list.filter(p => p.status === 'Draft').length;
    const totalPhases = list.reduce((acc, p) => acc + (p.phases?.length || p.phaseCount || 0), 0);
    return { activeCount, publishedCount, draftCount, totalPhases };
  });

  // Owner options derived from existing plans
  ownerOptions = computed<{ name: string; email: string }[]>(() => {
    const list = this.plans();
    const map = new Map<string, string>();
    list.forEach(p => {
      if (p.owner?.email && p.owner?.name) {
        map.set(p.owner.email, p.owner.name);
      }
    });
    const result: { name: string; email: string }[] = [];
    map.forEach((name, email) => {
      result.push({ name, email });
    });
    return result;
  });

  // Check if any filters are active
  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return f.status.length > 0 || 
           !!f.planOwnerEmail || 
           f.durationType.length > 0 || 
           f.enrollmentType.length > 0 || 
           !!f.startDate || 
           !!f.endDate;
  });

  // Check if grid has either active search or active filter (triggers Reset button)
  isResetVisible = computed<boolean>(() => {
    return !!this.searchQuery().trim() || this.hasActiveFilters();
  });

  // Total count of active filter criteria
  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    let count = f.status.length;
    if (f.planOwnerEmail) count++;
    count += f.durationType.length;
    count += f.enrollmentType.length;
    if (f.startDate || f.endDate) count++;
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
      if (f.status.length > 0 && !f.status.includes(p.status)) {
        return false;
      }

      // Plan Owner filter
      if (f.planOwnerEmail && p.owner?.email !== f.planOwnerEmail) {
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

  // Empty state determination
  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    const total = this.plans().length;
    if (total === 0) return 'true_empty';

    if (this.filteredPlans().length === 0) {
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

  ngOnInit() {}

  // Search handler
  onSearchChange(val: string) {
    this.searchQuery.set(val);
  }

  // Filter drawer handlers
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

  setStartDateDraft(dateStr: string) {
    this.draftFilters.update(f => ({ ...f, startDate: dateStr || null }));
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
      durationType: [],
      enrollmentType: [],
      startDate: null,
      endDate: null
    });
  }

  // Active chip removal
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
    this.appliedFilters.update(f => ({ ...f, planOwnerEmail: null }));
    this.draftFilters.update(f => ({ ...f, planOwnerEmail: null }));
  }

  removeStartDateFilter() {
    this.appliedFilters.update(f => ({ ...f, startDate: null }));
    this.draftFilters.update(f => ({ ...f, startDate: null }));
  }

  resetGrid() {
    this.searchQuery.set('');
    this.appliedFilters.set({
      search: '',
      status: [],
      planOwnerEmail: null,
      durationType: [],
      enrollmentType: [],
      startDate: null,
      endDate: null
    });
    this.draftFilters.set({
      search: '',
      status: [],
      planOwnerEmail: null,
      durationType: [],
      enrollmentType: [],
      startDate: null,
      endDate: null
    });
    this.lmsData.showToast('Reset grid to default view', 'info');
  }

  getOwnerDisplayName(email: string | null): string {
    if (!email) return '';
    const opt = this.ownerOptions().find(o => o.email === email);
    return opt ? opt.name : email;
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
    this.router.navigate(['/plans/edit', plan.id]);
  }

  resumeDraft(draft: any) {
    this.router.navigate(['/plans/edit', draft.id]);
  }

  onPlanUpdated() {
    this.selectedPlanForEdit.set(null);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-[#E8FAF4] text-[#059669] border-[#34D399] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700';
      case 'Published':
        return 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700';
      case 'Draft':
        return 'bg-[#F1F5F9] text-[#475569] border-[#94A3B8] dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-600';
      case 'Completed':
        return 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700';
      case 'Archived':
        return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-[#10B981]';
      case 'Published':
        return 'bg-sky-500';
      case 'Draft':
        return 'bg-[#64748B]';
      case 'Completed':
        return 'bg-purple-500';
      case 'Archived':
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
