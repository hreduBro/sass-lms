import { Component, inject, computed, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Plan, Phase, PlanOwner, PlanStatus, DurationType, EnrollmentType } from '../../../models/plan.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { AssignOwnerModalComponent } from '../assign-owner-modal/assign-owner-modal.component';
import { EditPlanModalComponent } from '../edit-plan-modal/edit-plan-modal.component';
import { PhaseDetailsModalComponent } from '../phase-details-modal/phase-details-modal.component';

export interface LearnerProgressRecord {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  enrolledPhaseId: string;
  enrolledPhaseName: string;
  coursesCompleted: number;
  totalCourses: number;
  tasksCompleted: number;
  totalTasks: number;
  deliveryClassesAttended: number;
  totalDeliveryClasses: number;
  progressPct: number;
  assessmentScore: number;
  status: 'Active' | 'Completed' | 'At-Risk';
  lastActive: string;
}

@Component({
  selector: 'app-plan-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    CustomSelectComponent,
    AssignOwnerModalComponent,
    EditPlanModalComponent,
    PhaseDetailsModalComponent
  ],
  template: `
    <div class="space-y-6 pb-12 animate-fade-in">
      
      <!-- ================================================================= -->
      <!-- TOP NAVIGATION & LMS WORKSPACE SCOPE BAR (LMS Dashboard Pattern)   -->
      <!-- ================================================================= -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tenant-50 dark:bg-tenant-500/20 text-tenant-700 dark:text-tenant-200 border border-tenant-500/30 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">business</span>
              LMS Scope
            </span>
            <span class="text-xs text-text-secondary flex items-center gap-1">
              <span>Parent Org:</span> 
              <strong class="text-text-primary capitalize bg-base-200 px-2 py-0.2 rounded-md font-semibold">{{ activeTenant().name }}</strong>
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-base-200 border border-base-300 font-mono text-text-secondary hidden sm:inline">
              {{ plans().length }} Plans &bull; {{ activePlansCount() }} Active
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
            <span class="material-symbols-outlined text-tenant-600 text-3xl">space_dashboard</span>
            @if (selectedPlan()) {
              <span>{{ selectedPlan()?.name }}</span>
              <span class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                {{ selectedPlan()?.planCode }}
              </span>
            } @else {
              <span>Plan Telemetry & Analytics</span>
            }
          </h1>

          <p class="text-xs sm:text-sm text-text-secondary mt-0.5">
            @if (selectedPlan()) {
              Deep-dive metrics, phase progression pipelines, and individual learner milestone tracks.
            } @else {
              Portfolio-wide telemetry for learning plan lifecycles, phase completion rates, and administrator allocations.
            }
          </p>
        </div>

        <!-- Global Action Buttons -->
        <div class="flex items-center flex-wrap gap-2.5 self-start md:self-auto">
          @if (selectedPlan()) {
            <button 
              id="back-to-portfolio-btn"
              type="button"
              (click)="clearSelectedPlan()"
              class="px-3.5 py-2.5 rounded-xl bg-base-200 hover:bg-base-300 active:scale-95 text-text-primary text-xs font-semibold border border-base-300 transition-all flex items-center gap-2 cursor-pointer">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              <span>Portfolio Overview</span>
            </button>
          } @else {
            <button 
              id="plan-dashboard-grid-btn"
              type="button"
              (click)="goToGrid()"
              class="px-3.5 py-2.5 rounded-xl bg-base-200 hover:bg-base-300 active:scale-95 text-text-primary text-xs font-semibold border border-base-300 transition-all flex items-center gap-2 cursor-pointer">
              <span class="material-symbols-outlined text-tenant-600 dark:text-tenant-400 text-lg">table_rows</span>
              <span>Plan Grid</span>
            </button>
          }

          <button 
            id="plan-dashboard-create-btn"
            type="button"
            (click)="goToCreate()"
            class="px-4 py-2.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-tenant-500/20 transition-all flex items-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-lg">add_circle</span>
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- VIEW LEVEL 1: PART A — LMS PLAN OVERVIEW DASHBOARD (PORTFOLIO)    -->
      <!-- ================================================================= -->
      @if (!selectedPlan()) {
        
        <!-- 6 High-Impact Portfolio KPI Metric Tiles -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          <!-- Total Active Plans -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Active Plans</span>
              <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">play_circle</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ portfolioMetrics().activePlans }}</div>
            <div class="text-[10px] text-text-secondary flex items-center gap-1">
              <span class="text-blue-600 font-semibold">{{ portfolioMetrics().publishedPlans }} Published</span>
              <span>•</span>
              <span>{{ portfolioMetrics().draftPlans }} Draft</span>
            </div>
          </div>

          <!-- Total Enrolled Learners -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Learners Enrolled</span>
              <div class="w-7 h-7 rounded-lg bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">group</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ portfolioMetrics().totalLearnersEnrolled }}</div>
            <div class="text-[10px] text-text-secondary">
              <span class="text-emerald-600 font-semibold">{{ portfolioMetrics().activeLearnersCount }} active</span> in tracks
            </div>
          </div>

          <!-- Phase Completion Rate -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Phase Completion</span>
              <div class="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">task_alt</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ portfolioMetrics().phaseCompletionRatePct }}%</div>
            <div class="text-[10px] text-text-secondary">
              {{ portfolioMetrics().completedPhasesCount }} of {{ portfolioMetrics().totalPhases }} phases completed
            </div>
          </div>

          <!-- Learner Avg Progress Rate -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Avg. Progress</span>
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">trending_up</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ portfolioMetrics().avgLearnerProgressPct }}%</div>
            <div class="text-[10px] text-text-secondary">
              <span class="text-emerald-600 font-semibold">{{ portfolioMetrics().onTrackPct }}%</span> on-track
            </div>
          </div>

          <!-- Plan Owner Coverage -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Owner Coverage</span>
              <div class="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">engineering</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ portfolioMetrics().ownershipCoveragePct }}%</div>
            <div class="text-[10px] text-text-secondary">
              {{ portfolioMetrics().assignedOwners }} assigned administrators
            </div>
          </div>

          <!-- Total Delivery Classes -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Delivery Classes</span>
              <div class="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">co_present</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ portfolioMetrics().totalDeliveryClasses }}</div>
            <div class="text-[10px] text-text-secondary">
              Scheduled live sessions
            </div>
          </div>

        </div>

        <!-- Visual Analytics & Lifecycle Breakdown Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Plan Status Lifecycle (Donut / Progress Breakdown) -->
          <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
              <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-tenant-600">pie_chart</span>
                Plan Status Breakdown
              </h3>
              <span class="text-[11px] text-text-secondary font-mono">{{ filteredPlans().length }} Shown</span>
            </div>

            <!-- Visual Donut & Bars -->
            <div class="space-y-3 text-xs">
              <!-- Active -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-text-secondary font-mono">{{ getStatusPct('Active') }}%</span>
                    <span class="font-bold text-text-primary">{{ getStatusCount('Active') }}</span>
                  </div>
                </div>
                <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full transition-all duration-500" [style.width.%]="getStatusPct('Active')"></div>
                </div>
              </div>

              <!-- Published -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span> Published
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-text-secondary font-mono">{{ getStatusPct('Published') }}%</span>
                    <span class="font-bold text-text-primary">{{ getStatusCount('Published') }}</span>
                  </div>
                </div>
                <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                  <div class="bg-blue-500 h-full rounded-full transition-all duration-500" [style.width.%]="getStatusPct('Published')"></div>
                </div>
              </div>

              <!-- Draft -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span> Draft
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-text-secondary font-mono">{{ getStatusPct('Draft') }}%</span>
                    <span class="font-bold text-text-primary">{{ getStatusCount('Draft') }}</span>
                  </div>
                </div>
                <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                  <div class="bg-amber-500 h-full rounded-full transition-all duration-500" [style.width.%]="getStatusPct('Draft')"></div>
                </div>
              </div>

              <!-- Completed -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-purple-500"></span> Completed
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-text-secondary font-mono">{{ getStatusPct('Completed') }}%</span>
                    <span class="font-bold text-text-primary">{{ getStatusCount('Completed') }}</span>
                  </div>
                </div>
                <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                  <div class="bg-purple-500 h-full rounded-full transition-all duration-500" [style.width.%]="getStatusPct('Completed')"></div>
                </div>
              </div>

              <!-- Archived -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold text-slate-500 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-slate-400"></span> Archived
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-text-secondary font-mono">{{ getStatusPct('Archived') }}%</span>
                    <span class="font-bold text-text-primary">{{ getStatusCount('Archived') }}</span>
                  </div>
                </div>
                <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                  <div class="bg-slate-400 h-full rounded-full transition-all duration-500" [style.width.%]="getStatusPct('Archived')"></div>
                </div>
              </div>
            </div>

            <!-- Duration & Enrollment Distribution Pills -->
            <div class="pt-3 border-t border-base-300 dark:border-slate-800 space-y-2">
              <div class="text-[11px] font-bold text-text-secondary uppercase">Plan Duration Mix</div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-1 rounded-lg bg-base-200 text-text-primary text-[11px] font-medium">
                  Yearly: <strong>{{ getDurationCount('Yearly') }}</strong>
                </span>
                <span class="px-2 py-1 rounded-lg bg-base-200 text-text-primary text-[11px] font-medium">
                  Half-Yearly: <strong>{{ getDurationCount('Half-Yearly') }}</strong>
                </span>
                <span class="px-2 py-1 rounded-lg bg-base-200 text-text-primary text-[11px] font-medium">
                  Quarterly: <strong>{{ getDurationCount('Quarterly') }}</strong>
                </span>
              </div>
            </div>
          </div>

          <!-- Top Performing Learning Plans -->
          <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4 lg:col-span-2">
            <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
              <div>
                <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span class="material-symbols-outlined text-base text-tenant-600">leaderboard</span>
                  Top Learning Tracks by Learner Engagement
                </h3>
                <p class="text-[11px] text-text-secondary">Active learning roadmaps ranked by progress and learner volume</p>
              </div>
              <button 
                type="button" 
                (click)="goToGrid()"
                class="text-xs font-semibold text-tenant-600 dark:text-tenant-400 hover:underline">
                View All Plans →
              </button>
            </div>

            <div class="space-y-3 text-xs">
              @for (plan of topPerformingPlans(); track plan.id) {
                <div class="p-3.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 hover:border-tenant-400 dark:hover:border-tenant-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                        {{ plan.planCode }}
                      </span>
                      <span class="font-bold text-text-primary truncate">{{ plan.name }}</span>
                    </div>
                    <div class="text-[11px] text-text-secondary mt-1 flex items-center gap-2">
                      <span>Owner: <strong>{{ plan.owner?.name || 'Unassigned' }}</strong></span>
                      <span>•</span>
                      <span>{{ plan.phases?.length || plan.phaseCount }} Phases</span>
                      <span>•</span>
                      <span>{{ getPlanLearnerCount(plan.id) }} Enrolled</span>
                    </div>
                  </div>

                  <!-- Progress Bar & Deep-Dive Button -->
                  <div class="flex items-center gap-3 shrink-0">
                    <div class="w-32 space-y-1">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-text-secondary font-medium">Completion</span>
                        <span class="font-bold text-text-primary">{{ getPlanProgressPct(plan.id) }}%</span>
                      </div>
                      <div class="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
                        <div 
                          class="bg-tenant-600 h-full rounded-full transition-all" 
                          [style.width.%]="getPlanProgressPct(plan.id)">
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      (click)="selectPlan(plan.id)"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-tenant-600 hover:bg-tenant-700 text-white shadow-sm transition-all flex items-center gap-1">
                      <span>Deep Dive</span>
                      <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- ================================================================= -->
        <!-- PLAN PORTFOLIO COMPARISON TABLE (ALL PLANS)                       -->
        <!-- ================================================================= -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-base-300 dark:border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-tenant-600">table_chart</span>
                Plan Portfolio Comparison Matrix
              </h3>
              <p class="text-[11px] text-text-secondary">Click any plan to open its dedicated deep-dive dashboard</p>
            </div>
            <div class="text-xs text-text-secondary font-medium">
              Showing {{ filteredPlans().length }} of {{ plans().length }} Plans
            </div>
          </div>

          <!-- Responsive Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-base-300 dark:border-slate-800 text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                  <th class="py-3 px-3">Plan Code & Title</th>
                  <th class="py-3 px-3">Assigned Owner</th>
                  <th class="py-3 px-3">Duration & Dates</th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3">Enrolled</th>
                  <th class="py-3 px-3">Milestone Progress</th>
                  <th class="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-base-300/60 dark:divide-slate-800/60">
                @for (plan of filteredPlans(); track plan.id) {
                  <tr class="hover:bg-base-200/50 dark:hover:bg-base-300/30 transition-colors group cursor-pointer" (click)="selectPlan(plan.id)">
                    
                    <!-- Code & Title -->
                    <td class="py-3 px-3 max-w-xs">
                      <div class="font-bold text-text-primary group-hover:text-tenant-600 dark:group-hover:text-tenant-400 transition-colors">
                        {{ plan.name }}
                      </div>
                      <div class="text-[10px] text-text-secondary font-mono mt-0.5">
                        {{ plan.planCode }} • {{ plan.enrollmentType }} Enrollment
                      </div>
                    </td>

                    <!-- Owner -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      @if (plan.owner?.name) {
                        <div class="flex items-center gap-2">
                          <div class="w-6 h-6 rounded-full bg-tenant-500/20 text-tenant-700 dark:text-tenant-300 font-bold flex items-center justify-center text-[10px]">
                            {{ plan.owner.name.charAt(0) }}
                          </div>
                          <div class="min-w-0">
                            <div class="font-semibold text-text-primary text-[11px]">{{ plan.owner.name }}</div>
                            <div class="text-[10px] text-text-secondary truncate">{{ plan.owner.email }}</div>
                          </div>
                        </div>
                      } @else {
                        <span class="text-rose-500 text-[11px] font-semibold flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">warning</span>
                          Unassigned
                        </span>
                      }
                    </td>

                    <!-- Duration & Dates -->
                    <td class="py-3 px-3 whitespace-nowrap text-text-secondary">
                      <div class="font-medium text-text-primary">{{ plan.durationType }}</div>
                      <div class="text-[10px]">{{ plan.startDate }} → {{ plan.endDate }}</div>
                    </td>

                    <!-- Status -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span 
                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
                        [ngClass]="getStatusBadgeClass(plan.status)">
                        {{ plan.status }}
                      </span>
                    </td>

                    <!-- Enrolled Learners -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <div class="font-bold text-text-primary">{{ getPlanLearnerCount(plan.id) }}</div>
                      <div class="text-[10px] text-text-secondary">{{ plan.phases?.length || plan.phaseCount }} phases</div>
                    </td>

                    <!-- Milestone Progress -->
                    <td class="py-3 px-3 w-40">
                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-[10px]">
                          <span class="text-text-secondary">Phase Health</span>
                          <span class="font-bold text-text-primary">{{ getPlanProgressPct(plan.id) }}%</span>
                        </div>
                        <div class="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
                          <div 
                            class="bg-tenant-600 h-full rounded-full transition-all" 
                            [style.width.%]="getPlanProgressPct(plan.id)">
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="py-3 px-3 text-right whitespace-nowrap" (click)="$event.stopPropagation()">
                      <div class="flex items-center justify-end gap-1.5">
                        <button 
                          type="button" 
                          (click)="selectPlan(plan.id)"
                          title="Open Deep-Dive Dashboard"
                          class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-300 hover:bg-tenant-600 hover:text-white transition-colors flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">analytics</span>
                          <span>Dashboard</span>
                        </button>

                        <button 
                          type="button" 
                          (click)="viewPlanDetails(plan.id)"
                          title="Manage Plan Details"
                          class="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-base-200 transition-colors">
                          <span class="material-symbols-outlined text-sm">settings</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Appointed Administrators Roster -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-tenant-600">manage_accounts</span>
                Appointed Plan Administrators Roster
              </h3>
              <p class="text-[11px] text-text-secondary">Designated personnel assigned as Plan Owners across this LMS workspace</p>
            </div>
            <button 
              type="button" 
              (click)="goToGrid()"
              class="text-xs font-semibold text-tenant-600 dark:text-tenant-400 hover:underline">
              View in Grid →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            @for (owner of ownerRoster(); track owner.email) {
              <div class="p-3.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-tenant-500/20 text-tenant-700 dark:text-tenant-300 font-bold flex items-center justify-center shrink-0 text-sm">
                  {{ owner.name.charAt(0) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-text-primary truncate">{{ owner.name }}</div>
                  <div class="text-[11px] text-text-secondary truncate">{{ owner.email }}</div>
                  <div class="mt-2 flex items-center gap-2 text-[10px]">
                    <span class="px-1.5 py-0.5 rounded bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300 font-semibold font-mono">
                      {{ owner.assignedPlanCount }} {{ owner.assignedPlanCount === 1 ? 'Plan' : 'Plans' }}
                    </span>
                    @if (owner.contactNumber) {
                      <span class="text-text-secondary truncate">{{ owner.contactNumber }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

      } @else {

        <!-- ================================================================= -->
        <!-- VIEW LEVEL 2: PART B — SELECTED PLAN DEEP-DIVE DASHBOARD          -->
        <!-- ================================================================= -->
        
        <!-- Plan Deep-Dive Header Card & Quick Switcher -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-base-300 dark:border-slate-800">
            <div>
              <div class="flex items-center flex-wrap gap-2.5">
                <span 
                  class="px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider"
                  [ngClass]="getStatusBadgeClass(selectedPlan()!.status)">
                  {{ selectedPlan()!.status }}
                </span>
                <span class="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-base-200 border border-base-300 text-text-primary">
                  {{ selectedPlan()!.durationType }} Track
                </span>
                <span class="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-base-200 border border-base-300 text-text-primary">
                  {{ selectedPlan()!.enrollmentType }} Enrollment
                </span>
                <span class="text-xs text-text-secondary">
                  Active Schedule: <strong>{{ selectedPlan()!.startDate }}</strong> → <strong>{{ selectedPlan()!.endDate }}</strong>
                </span>
              </div>

              <h2 class="text-xl font-bold text-text-primary mt-2 flex items-center gap-2.5">
                {{ selectedPlan()!.name }}
              </h2>
              <p class="text-xs text-text-secondary mt-1 max-w-3xl leading-relaxed">
                {{ selectedPlan()!.description }}
              </p>
            </div>

            <!-- Quick Plan Switcher Dropdown & Actions -->
            <div class="flex items-center flex-wrap gap-2.5 shrink-0">
              <div class="w-56">
                <app-custom-select
                  [label]="'Switch Plan'"
                  [options]="planSwitcherOptions()"
                  [ngModel]="selectedPlan()!.id"
                  (ngModelChange)="selectPlan($event)"
                  size="sm">
                </app-custom-select>
              </div>

              <button 
                type="button" 
                (click)="openAssignOwnerModal()"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-base-200 hover:bg-base-300 border border-base-300 dark:border-slate-700 text-text-primary transition-colors flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">person_add</span>
                <span>Assign Owner</span>
              </button>

              <button 
                type="button" 
                (click)="viewPlanDetails(selectedPlan()!.id)"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-tenant-600 hover:bg-tenant-700 text-white shadow-sm transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">settings</span>
                <span>Manage Plan</span>
              </button>
            </div>
          </div>

          <!-- Plan Owner & Capability Context Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-3">
              @if (selectedPlan()!.owner?.name) {
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800">
                  <div class="w-6 h-6 rounded-full bg-tenant-500/20 text-tenant-700 dark:text-tenant-300 font-bold flex items-center justify-center text-[10px]">
                    {{ selectedPlan()!.owner.name.charAt(0) }}
                  </div>
                  <div>
                    <span class="text-text-secondary text-[10px]">Plan Owner:</span>
                    <strong class="text-text-primary ml-1">{{ selectedPlan()!.owner.name }}</strong>
                    <span class="text-text-secondary text-[10px] ml-1">({{ selectedPlan()!.owner.email }})</span>
                  </div>
                </div>
              } @else {
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold">
                  <span class="material-symbols-outlined text-sm">warning</span>
                  No Plan Owner Assigned
                </div>
              }
            </div>

            <div class="flex items-center gap-2 text-text-secondary text-[11px]">
              <span>Created on {{ selectedPlan()!.createdDate }}</span>
              <span>•</span>
              <span>Last updated {{ selectedPlan()!.updatedDate }}</span>
            </div>
          </div>
        </div>

        <!-- 6 Plan-Specific Telemetry Metrics -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          <!-- Enrolled Learners -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Enrolled</span>
              <div class="w-7 h-7 rounded-lg bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">school</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ selectedPlanLearners().length }}</div>
            <div class="text-[10px] text-text-secondary">
              <span class="text-emerald-600 font-semibold">{{ activeLearnersInSelectedPlan() }} active</span> learners
            </div>
          </div>

          <!-- Average Plan Progress -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Plan Progress</span>
              <div class="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">insights</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ selectedPlanAvgProgress() }}%</div>
            <div class="text-[10px] text-text-secondary">
              Average across all phases
            </div>
          </div>

          <!-- Phase Milestone Progress -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Phases Health</span>
              <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">checklist</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ completedPhasesInSelectedPlan() }}/{{ (selectedPlan()!.phases?.length || selectedPlan()!.phaseCount) }}</div>
            <div class="text-[10px] text-text-secondary">
              Phases fully completed
            </div>
          </div>

          <!-- Assessment Pass Rate -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Pass Rate</span>
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">military_tech</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ selectedPlanPassRate() }}%</div>
            <div class="text-[10px] text-text-secondary">
              Avg score on phase tasks
            </div>
          </div>

          <!-- At-Risk Learners -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">At-Risk Learners</span>
              <div class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">priority_high</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-rose-600 dark:text-rose-400">{{ atRiskLearnersInSelectedPlan() }}</div>
            <div class="text-[10px] text-text-secondary">
              Needing academic support
            </div>
          </div>

          <!-- Certifications Issued -->
          <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Certifications</span>
              <div class="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">verified</span>
              </div>
            </div>
            <div class="text-2xl font-bold text-text-primary">{{ completedLearnersInSelectedPlan() }}</div>
            <div class="text-[10px] text-text-secondary">
              Completed all milestones
            </div>
          </div>

        </div>

        <!-- ================================================================= -->
        <!-- INTERACTIVE SEQUENTIAL PHASE ROADMAP & MILESTONES PIPELINE        -->
        <!-- ================================================================= -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-tenant-600">conversion_path</span>
                Phase Progression Roadmap & Sequential Milestones
              </h3>
              <p class="text-[11px] text-text-secondary">Non-overlapping phase sequence. Click any phase to inspect milestones and deliverables.</p>
            </div>
            <span class="text-xs font-mono font-bold text-tenant-600 dark:text-tenant-400">
              {{ (selectedPlan()!.phases?.length || selectedPlan()!.phaseCount) }} Sequential Phases
            </span>
          </div>

          <!-- Phase Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (phase of selectedPlan()!.phases; track phase.id; let idx = $index) {
              <div 
                (click)="openPhaseModal(phase)"
                class="p-4 rounded-xl border border-base-300 dark:border-slate-800 bg-base-200/40 dark:bg-base-300/20 hover:border-tenant-500 hover:bg-base-200 dark:hover:bg-base-300/40 transition-all cursor-pointer space-y-3 relative group">
                
                <!-- Phase Header Strip -->
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-md bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 font-bold text-xs flex items-center justify-center">
                      #{{ phase.sequence }}
                    </span>
                    <span 
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
                      [ngClass]="getPhaseStatusBadgeClass(phase.status)">
                      {{ phase.status }}
                    </span>
                  </div>

                  <span class="material-symbols-outlined text-sm text-text-secondary group-hover:text-tenant-500 transition-colors">
                    open_in_new
                  </span>
                </div>

                <!-- Phase Title & Description -->
                <div>
                  <h4 class="font-bold text-text-primary text-xs line-clamp-2">{{ phase.name }}</h4>
                  <p class="text-[11px] text-text-secondary mt-1 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">date_range</span>
                    <span>{{ phase.startDate }} → {{ phase.endDate }}</span>
                  </p>
                </div>

                <!-- Milestone Deliverables Counters -->
                <div class="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-base-100 dark:bg-base-200 text-center text-[10px]">
                  <div>
                    <div class="font-bold text-text-primary text-xs">{{ phase.courseCount }}</div>
                    <div class="text-text-secondary">Courses</div>
                  </div>
                  <div>
                    <div class="font-bold text-text-primary text-xs">{{ phase.taskCount }}</div>
                    <div class="text-text-secondary">Tasks</div>
                  </div>
                  <div>
                    <div class="font-bold text-text-primary text-xs">{{ phase.deliveryClassCount }}</div>
                    <div class="text-text-secondary">Classes</div>
                  </div>
                </div>

                <!-- Prerequisites and Certificate Badges -->
                <div class="flex items-center justify-between text-[10px] text-text-secondary pt-1 border-t border-base-300/50">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs" [class.text-emerald-500]="phase.prerequisiteStatus === 'Met' || phase.prerequisiteStatus === 'None'">
                      {{ phase.prerequisiteStatus === 'None' ? 'check_circle' : (phase.prerequisiteStatus === 'Met' ? 'task_alt' : 'hourglass_empty') }}
                    </span>
                    <span>Prereq: {{ phase.prerequisiteStatus }}</span>
                  </span>

                  <span class="font-semibold text-tenant-600 dark:text-tenant-400">
                    {{ phase.certificateBadgeStatus }} Badge
                  </span>
                </div>

              </div>
            }
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- PLAN LEARNER PERFORMANCE ROSTER MATRIX                            -->
        <!-- ================================================================= -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-base-300 dark:border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-tenant-600">people</span>
                Learner Roster & Milestone Progress for {{ selectedPlan()!.name }}
              </h3>
              <p class="text-[11px] text-text-secondary">Detailed progress status and task submissions by enrolled learner</p>
            </div>

            <!-- Learner Filter Controls -->
            <div class="flex items-center gap-2.5">
              <div class="relative w-48">
                <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary text-xs pointer-events-none">
                  search
                </span>
                <input 
                  type="text" 
                  [(ngModel)]="learnerSearchQuery" 
                  placeholder="Search learner..." 
                  class="w-full pl-8 pr-2.5 py-1 rounded-lg text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none" />
              </div>

              <div class="w-36">
                <app-custom-select
                  [options]="learnerPhaseFilterOptions()"
                  [(ngModel)]="selectedLearnerPhaseFilter"
                  size="sm"
                  placeholder="Phase: All">
                </app-custom-select>
              </div>

              <div class="w-32">
                <app-custom-select
                  [options]="learnerStatusFilterOptions"
                  [(ngModel)]="selectedLearnerStatusFilter"
                  size="sm"
                  placeholder="Status: All">
                </app-custom-select>
              </div>
            </div>
          </div>

          <!-- Learner Roster Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-base-300 dark:border-slate-800 text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                  <th class="py-3 px-3">Learner Profile</th>
                  <th class="py-3 px-3">Current Enrolled Phase</th>
                  <th class="py-3 px-3">Courses Completed</th>
                  <th class="py-3 px-3">Tasks Finished</th>
                  <th class="py-3 px-3">Progress & Score</th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-base-300/60 dark:divide-slate-800/60">
                @for (learner of filteredPlanLearners(); track learner.id) {
                  <tr class="hover:bg-base-200/50 dark:hover:bg-base-300/30 transition-colors">
                    
                    <!-- Profile -->
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full bg-tenant-500/20 text-tenant-700 dark:text-tenant-300 font-bold flex items-center justify-center text-xs">
                          {{ learner.name.charAt(0) }}
                        </div>
                        <div>
                          <div class="font-bold text-text-primary">{{ learner.name }}</div>
                          <div class="text-[10px] text-text-secondary">{{ learner.email }} • {{ learner.department }}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Enrolled Phase -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span class="font-semibold text-text-primary text-[11px]">{{ learner.enrolledPhaseName }}</span>
                    </td>

                    <!-- Courses -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span class="font-bold text-text-primary">{{ learner.coursesCompleted }}/{{ learner.totalCourses }}</span>
                      <span class="text-text-secondary text-[10px] ml-1">courses</span>
                    </td>

                    <!-- Tasks -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span class="font-bold text-text-primary">{{ learner.tasksCompleted }}/{{ learner.totalTasks }}</span>
                      <span class="text-text-secondary text-[10px] ml-1">tasks</span>
                    </td>

                    <!-- Progress & Score -->
                    <td class="py-3 px-3 w-40">
                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-[10px]">
                          <span class="font-bold text-text-primary">{{ learner.progressPct }}%</span>
                          <span class="text-emerald-600 font-semibold font-mono">{{ learner.assessmentScore }}% Score</span>
                        </div>
                        <div class="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
                          <div 
                            class="h-full rounded-full transition-all"
                            [class.bg-emerald-500]="learner.status === 'Completed'"
                            [class.bg-tenant-600]="learner.status === 'Active'"
                            [class.bg-rose-500]="learner.status === 'At-Risk'"
                            [style.width.%]="learner.progressPct">
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Status -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span 
                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
                        [ngClass]="{
                          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300': learner.status === 'Completed',
                          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300': learner.status === 'Active',
                          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300': learner.status === 'At-Risk'
                        }">
                        {{ learner.status }}
                      </span>
                    </td>

                    <!-- Last Active -->
                    <td class="py-3 px-3 text-right whitespace-nowrap text-text-secondary text-[11px]">
                      {{ learner.lastActive }}
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      }

    </div>

    <!-- Modals -->
    @if (modalPlanForAssign()) {
      <app-assign-owner-modal
        [plan]="modalPlanForAssign()!"
        (close)="closeAssignOwnerModal()"
        (saved)="onOwnerAssigned()">
      </app-assign-owner-modal>
    }

    @if (modalPlanForEdit()) {
      <app-edit-plan-modal
        [plan]="modalPlanForEdit()!"
        (close)="closeEditModal()"
        (saved)="onPlanSaved()">
      </app-edit-plan-modal>
    }

    @if (activeModalPhase() && selectedPlan()) {
      <app-phase-details-modal
        [phase]="activeModalPhase()!"
        [plan]="selectedPlan()!"
        [totalPhases]="selectedPlan()!.phases?.length || selectedPlan()!.phaseCount"
        (close)="closePhaseModal()">
      </app-phase-details-modal>
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
export class PlanDashboardComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private lmsData = inject(LmsDataService);

  activeTenant = this.lmsData.activeTenant;
  activeLms = this.lmsData.activeLms;
  plans = this.lmsData.activeLmsPlans;
  activePlansCount = computed(() => this.plans().filter(p => p.status === 'Active' || p.status === 'Published').length);

  // Selected Plan Signal for Level 2 (Part B)
  selectedPlanId = signal<string | null>(null);

  // Portfolio Filters (Part A)
  searchQuery = '';
  selectedStatusFilter = 'ALL';
  selectedDurationFilter = 'ALL';
  selectedEnrollmentFilter = 'ALL';

  // Learner Filters (Part B)
  learnerSearchQuery = '';
  selectedLearnerPhaseFilter = 'ALL';
  selectedLearnerStatusFilter = 'ALL';

  // Modals state
  modalPlanForAssign = signal<Plan | null>(null);
  modalPlanForEdit = signal<Plan | null>(null);
  activeModalPhase = signal<Phase | null>(null);

  statusFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Statuses', icon: 'filter_list' },
    { value: 'Active', label: 'Active', icon: 'play_circle' },
    { value: 'Published', label: 'Published', icon: 'publish' },
    { value: 'Draft', label: 'Draft', icon: 'edit_note' },
    { value: 'Completed', label: 'Completed', icon: 'task_alt' },
    { value: 'Archived', label: 'Archived', icon: 'archive' }
  ];

  durationFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Durations', icon: 'calendar_month' },
    { value: 'Yearly', label: 'Yearly (12M)', icon: 'event' },
    { value: 'Half-Yearly', label: 'Half-Yearly (6M)', icon: 'date_range' },
    { value: 'Quarterly', label: 'Quarterly (3M)', icon: 'calendar_view_month' }
  ];

  enrollmentFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Models', icon: 'people' },
    { value: 'Open', label: 'Open Enrollment', icon: 'lock_open' },
    { value: 'Closed', label: 'Closed / Cohort', icon: 'lock' }
  ];

  learnerStatusFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Learners', icon: 'group' },
    { value: 'Active', label: 'Active', icon: 'play_circle' },
    { value: 'Completed', label: 'Completed', icon: 'check_circle' },
    { value: 'At-Risk', label: 'At-Risk', icon: 'warning' }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['planId']) {
        this.selectedPlanId.set(params['planId']);
      }
    });
  }

  selectedPlan = computed<Plan | null>(() => {
    const id = this.selectedPlanId();
    if (!id) return null;
    return this.plans().find(p => p.id === id) || null;
  });

  planSwitcherOptions = computed<SelectOption[]>(() => {
    return this.plans().map(p => ({
      value: p.id,
      label: p.name,
      sublabel: `${p.planCode} • ${p.status} (${p.durationType})`,
      icon: 'event_note'
    }));
  });

  learnerPhaseFilterOptions = computed<SelectOption[]>(() => {
    const plan = this.selectedPlan();
    if (!plan || !plan.phases) return [{ value: 'ALL', label: 'All Phases', icon: 'timeline' }];
    
    return [
      { value: 'ALL', label: 'All Phases', icon: 'timeline' },
      ...plan.phases.map(ph => ({
        value: ph.id,
        label: `Phase ${ph.sequence}: ${ph.name}`,
        icon: 'check_circle'
      }))
    ];
  });

  filteredPlans = computed<Plan[]>(() => {
    let list = this.plans();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.planCode.toLowerCase().includes(q) ||
        (p.owner?.name && p.owner.name.toLowerCase().includes(q)) ||
        (p.owner?.email && p.owner.email.toLowerCase().includes(q))
      );
    }

    if (this.selectedStatusFilter !== 'ALL') {
      list = list.filter(p => p.status === this.selectedStatusFilter);
    }

    if (this.selectedDurationFilter !== 'ALL') {
      list = list.filter(p => p.durationType === this.selectedDurationFilter);
    }

    if (this.selectedEnrollmentFilter !== 'ALL') {
      list = list.filter(p => p.enrollmentType === this.selectedEnrollmentFilter);
    }

    return list;
  });

  portfolioMetrics = computed(() => {
    const list = this.plans();
    const totalPlans = list.length;
    const activePlans = list.filter(p => p.status === 'Active').length;
    const publishedPlans = list.filter(p => p.status === 'Published').length;
    const draftPlans = list.filter(p => p.status === 'Draft').length;
    const completedPlans = list.filter(p => p.status === 'Completed').length;
    const archivedPlans = list.filter(p => p.status === 'Archived').length;

    let totalPhases = 0;
    let completedPhasesCount = 0;
    let totalDeliveryClasses = 0;

    list.forEach(p => {
      const phases = p.phases || [];
      totalPhases += (phases.length || p.phaseCount || 0);
      completedPhasesCount += phases.filter(ph => ph.status === 'Completed').length;
      phases.forEach(ph => {
        totalDeliveryClasses += (ph.deliveryClassCount || 0);
      });
    });

    const phaseCompletionRatePct = totalPhases > 0 ? Math.round((completedPhasesCount / totalPhases) * 100) : 0;
    const totalLearnersEnrolled = list.reduce((sum, p) => sum + this.getPlanLearnerCount(p.id), 0);
    const activeLearnersCount = Math.round(totalLearnersEnrolled * 0.82);
    const avgLearnerProgressPct = totalPlans > 0 ? 68 : 0;
    const onTrackPct = 89;

    const assignedOwners = list.filter(p => !!p.owner?.email).length;
    const ownershipCoveragePct = totalPlans > 0 ? Math.round((assignedOwners / totalPlans) * 100) : 0;

    return {
      totalPlans,
      activePlans,
      publishedPlans,
      draftPlans,
      completedPlans,
      archivedPlans,
      totalPhases,
      completedPhasesCount,
      phaseCompletionRatePct,
      totalLearnersEnrolled,
      activeLearnersCount,
      avgLearnerProgressPct,
      onTrackPct,
      totalDeliveryClasses,
      assignedOwners,
      ownershipCoveragePct
    };
  });

  topPerformingPlans = computed<Plan[]>(() => {
    return [...this.plans()].sort((a, b) => {
      return this.getPlanLearnerCount(b.id) - this.getPlanLearnerCount(a.id);
    }).slice(0, 5);
  });

  ownerRoster = computed(() => {
    const list = this.plans();
    const map = new Map<string, { name: string; email: string; contactNumber?: string; assignedPlanCount: number }>();
    
    list.forEach(p => {
      if (p.owner?.email && p.owner?.name) {
        const existing = map.get(p.owner.email);
        if (existing) {
          existing.assignedPlanCount++;
        } else {
          map.set(p.owner.email, {
            name: p.owner.name,
            email: p.owner.email,
            contactNumber: p.owner.contactNumber,
            assignedPlanCount: 1
          });
        }
      }
    });

    return Array.from(map.values());
  });

  // Part B: Learner Roster Generation for Selected Plan
  selectedPlanLearners = computed<LearnerProgressRecord[]>(() => {
    const plan = this.selectedPlan();
    if (!plan) return [];

    const tenantUsers = this.lmsData.tenantUsers();
    const phases = plan.phases || [];

    return tenantUsers.slice(0, 8).map((user, idx) => {
      const currentPhase = phases[idx % (phases.length || 1)] || phases[0];
      const totalCourses = currentPhase?.courseCount || 3;
      const totalTasks = currentPhase?.taskCount || 6;
      const totalClasses = currentPhase?.deliveryClassCount || 2;

      const isCompleted = idx === 0 || idx === 1;
      const isAtRisk = idx === 5;
      const coursesCompleted = isCompleted ? totalCourses : (isAtRisk ? 1 : Math.max(1, totalCourses - 1));
      const tasksCompleted = isCompleted ? totalTasks : (isAtRisk ? 2 : Math.max(2, totalTasks - 2));
      const progressPct = isCompleted ? 100 : (isAtRisk ? 34 : Math.min(95, Math.round(((coursesCompleted + tasksCompleted) / (totalCourses + totalTasks)) * 100)));
      const status = isCompleted ? 'Completed' : (isAtRisk ? 'At-Risk' : 'Active');
      const assessmentScore = isCompleted ? 96 : (isAtRisk ? 58 : 82 + (idx * 2));

      return {
        id: `lrn-${user.id}-${plan.id}`,
        name: user.name,
        email: user.email,
        department: user.department || 'Operations',
        enrolledPhaseId: currentPhase?.id || 'phase-1',
        enrolledPhaseName: currentPhase?.name || 'Phase 1: Foundation',
        coursesCompleted,
        totalCourses,
        tasksCompleted,
        totalTasks,
        deliveryClassesAttended: Math.max(1, totalClasses),
        totalDeliveryClasses: totalClasses,
        progressPct,
        assessmentScore,
        status: status as any,
        lastActive: idx % 2 === 0 ? 'Today, 10:45 AM' : 'Yesterday, 03:15 PM'
      };
    });
  });

  filteredPlanLearners = computed<LearnerProgressRecord[]>(() => {
    let list = this.selectedPlanLearners();

    if (this.learnerSearchQuery.trim()) {
      const q = this.learnerSearchQuery.toLowerCase();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.email.toLowerCase().includes(q) ||
        l.department.toLowerCase().includes(q)
      );
    }

    if (this.selectedLearnerPhaseFilter !== 'ALL') {
      list = list.filter(l => l.enrolledPhaseId === this.selectedLearnerPhaseFilter);
    }

    if (this.selectedLearnerStatusFilter !== 'ALL') {
      list = list.filter(l => l.status === this.selectedLearnerStatusFilter);
    }

    return list;
  });

  activeLearnersInSelectedPlan = computed<number>(() => {
    return this.selectedPlanLearners().filter(l => l.status === 'Active').length;
  });

  completedLearnersInSelectedPlan = computed<number>(() => {
    return this.selectedPlanLearners().filter(l => l.status === 'Completed').length;
  });

  atRiskLearnersInSelectedPlan = computed<number>(() => {
    return this.selectedPlanLearners().filter(l => l.status === 'At-Risk').length;
  });

  selectedPlanAvgProgress = computed<number>(() => {
    const list = this.selectedPlanLearners();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, l) => acc + l.progressPct, 0);
    return Math.round(sum / list.length);
  });

  selectedPlanPassRate = computed<number>(() => {
    const list = this.selectedPlanLearners();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, l) => acc + l.assessmentScore, 0);
    return Math.round(sum / list.length);
  });

  completedPhasesInSelectedPlan = computed<number>(() => {
    const plan = this.selectedPlan();
    if (!plan || !plan.phases) return 0;
    return plan.phases.filter(p => p.status === 'Completed').length;
  });

  // Helpers
  getPlanLearnerCount(planId: string): number {
    const hash = planId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return 48 + (hash % 180);
  }

  getPlanProgressPct(planId: string): number {
    const hash = planId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return 40 + (hash % 56);
  }

  getStatusCount(status: PlanStatus): number {
    return this.plans().filter(p => p.status === status).length;
  }

  getStatusPct(status: PlanStatus): number {
    const total = this.plans().length;
    if (total === 0) return 0;
    return Math.round((this.getStatusCount(status) / total) * 100);
  }

  getDurationCount(type: DurationType): number {
    return this.plans().filter(p => p.durationType === type).length;
  }

  hasActivePortfolioFilters(): boolean {
    return this.searchQuery !== '' || 
      this.selectedStatusFilter !== 'ALL' || 
      this.selectedDurationFilter !== 'ALL' || 
      this.selectedEnrollmentFilter !== 'ALL';
  }

  resetPortfolioFilters() {
    this.searchQuery = '';
    this.selectedStatusFilter = 'ALL';
    this.selectedDurationFilter = 'ALL';
    this.selectedEnrollmentFilter = 'ALL';
  }

  selectPlan(planId: string) {
    this.selectedPlanId.set(planId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { planId },
      queryParamsHandling: 'merge'
    });
  }

  clearSelectedPlan() {
    this.selectedPlanId.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { planId: null },
      queryParamsHandling: 'merge'
    });
  }

  goToGrid() {
    this.router.navigate(['/plans']);
  }

  goToCreate() {
    this.router.navigate(['/plans/create']);
  }

  viewPlanDetails(id: string) {
    this.router.navigate(['/plans/details', id]);
  }

  openAssignOwnerModal() {
    if (this.selectedPlan()) {
      this.modalPlanForAssign.set(this.selectedPlan());
    }
  }

  closeAssignOwnerModal() {
    this.modalPlanForAssign.set(null);
  }

  onOwnerAssigned() {
    this.closeAssignOwnerModal();
  }

  openEditModal() {
    if (this.selectedPlan()) {
      this.router.navigate(['/plans/edit', this.selectedPlan()!.id]);
    }
  }

  closeEditModal() {
    this.modalPlanForEdit.set(null);
  }

  onPlanSaved() {
    this.closeEditModal();
  }

  openPhaseModal(phase: Phase) {
    this.activeModalPhase.set(phase);
  }

  closePhaseModal() {
    this.activeModalPhase.set(null);
  }

  getStatusBadgeClass(status: PlanStatus): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'Published':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800';
      case 'Draft':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800';
      case 'Completed':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800';
      case 'Archived':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      default:
        return 'bg-base-200 text-text-secondary border-base-300';
    }
  }

  getPhaseStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300';
      case 'In-Progress':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300';
      case 'Ready':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300';
      case 'Upcoming':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-base-200 text-text-secondary border-base-300';
    }
  }
}
