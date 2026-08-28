import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Plan, PlanStatus } from '../../../models/plan.model';

@Component({
  selector: 'app-plan-dashboard',
  imports: [CommonModule],
  template: `
    <div class="space-y-6 pb-12 animate-fade-in">
      
      <!-- ================================================================= -->
      <!-- TOP HEADER & LMS WORKSPACE CONTEXT                                -->
      <!-- ================================================================= -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs text-text-secondary">
            <span>{{ activeTenant().name }}</span>
            <span>/</span>
            <span class="hover:underline cursor-pointer" (click)="goToGrid()">Plan Management</span>
            <span>/</span>
            <span class="text-text-primary font-medium">Telemetry & Dashboard</span>
          </div>
          <h1 class="text-2xl font-bold text-text-primary mt-1 flex items-center gap-3">
            Plan Telemetry & Roadmaps
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
              {{ plans().length }} Total Plans
            </span>
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">
            Operational overview of learning plan lifecycles, phase completion rates, and administrator allocations.
          </p>
        </div>

        <!-- Fixed LMS Workspace Badge & Action Buttons -->
        <div class="flex items-center flex-wrap gap-2.5">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 text-xs shadow-sm">
            <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-400">layers</span>
            <span class="text-text-secondary">Fixed LMS:</span>
            <span class="font-bold text-text-primary">{{ activeLms().basicInfo.lmsName }}</span>
          </div>

          <button 
            id="plan-dashboard-grid-btn"
            type="button"
            (click)="goToGrid()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-base-100 dark:bg-base-200 hover:bg-base-300/60 border border-base-300 dark:border-slate-700 text-text-primary flex items-center gap-1.5 shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">table_view</span>
            <span>Plan Grid</span>
          </button>

          <button 
            id="plan-dashboard-create-btn"
            type="button"
            (click)="goToCreate()"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-tenant-600 hover:bg-tenant-700 text-white shadow-sm transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">add_task</span>
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- KPI METRIC CARDS                                                  -->
      <!-- ================================================================= -->
      <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <!-- Total Plans -->
        <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">Total Plans</span>
            <div class="w-8 h-8 rounded-xl bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-base">event_note</span>
            </div>
          </div>
          <div class="text-2xl font-bold text-text-primary">{{ metrics().totalPlans }}</div>
          <div class="text-[11px] text-text-secondary flex items-center gap-1">
            <span class="text-emerald-600 font-semibold">{{ metrics().activePlans }} Active</span>
            <span>•</span>
            <span class="text-blue-600 font-semibold">{{ metrics().publishedPlans }} Published</span>
          </div>
        </div>

        <!-- Total Phases -->
        <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">Structured Phases</span>
            <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-base">timeline</span>
            </div>
          </div>
          <div class="text-2xl font-bold text-text-primary">{{ metrics().totalPhases }}</div>
          <div class="text-[11px] text-text-secondary">
            Avg. {{ metrics().avgPhasesPerPlan }} phases per learning track
          </div>
        </div>

        <!-- Assigned Owners -->
        <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">Assigned Planners</span>
            <div class="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-base">engineering</span>
            </div>
          </div>
          <div class="text-2xl font-bold text-text-primary">{{ metrics().assignedOwners }}</div>
          <div class="text-[11px] text-text-secondary">
            {{ metrics().ownershipCoveragePct }}% plan leadership coverage
          </div>
        </div>

        <!-- Open Enrollment Ratio -->
        <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">Open Enrollment</span>
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-base">lock_open</span>
            </div>
          </div>
          <div class="text-2xl font-bold text-text-primary">{{ metrics().openEnrollmentPlans }}</div>
          <div class="text-[11px] text-text-secondary">
            {{ metrics().closedEnrollmentPlans }} closed / cohort-assigned
          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- STATUS DISTRIBUTION & OWNER ROSTER SECTION                        -->
      <!-- ================================================================= -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Status Breakdown Card -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
            <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-tenant-600">pie_chart</span>
              Plan Status Lifecycle
            </h3>
            <span class="text-[11px] text-text-secondary font-mono">{{ plans().length }} Total</span>
          </div>

          <div class="space-y-3 text-xs">
            
            <!-- Active -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                </span>
                <span class="font-bold text-text-primary">{{ metrics().activePlans }}</span>
              </div>
              <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full transition-all" [style.width.%]="getStatusPct('Active')"></div>
              </div>
            </div>

            <!-- Published -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span> Published
                </span>
                <span class="font-bold text-text-primary">{{ metrics().publishedPlans }}</span>
              </div>
              <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-full rounded-full transition-all" [style.width.%]="getStatusPct('Published')"></div>
              </div>
            </div>

            <!-- Draft -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span> Draft
                </span>
                <span class="font-bold text-text-primary">{{ metrics().draftPlans }}</span>
              </div>
              <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full transition-all" [style.width.%]="getStatusPct('Draft')"></div>
              </div>
            </div>

            <!-- Completed -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-purple-500"></span> Completed
                </span>
                <span class="font-bold text-text-primary">{{ metrics().completedPlans }}</span>
              </div>
              <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                <div class="bg-purple-500 h-full rounded-full transition-all" [style.width.%]="getStatusPct('Completed')"></div>
              </div>
            </div>

            <!-- Archived -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-slate-500 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-slate-400"></span> Archived
                </span>
                <span class="font-bold text-text-primary">{{ metrics().archivedPlans }}</span>
              </div>
              <div class="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                <div class="bg-slate-400 h-full rounded-full transition-all" [style.width.%]="getStatusPct('Archived')"></div>
              </div>
            </div>

          </div>
        </div>

        <!-- Plan Owners & Administrators Roster -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4 lg:col-span-2">
          <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-tenant-600">manage_accounts</span>
                Appointed Plan Administrators
              </h3>
              <p class="text-[11px] text-text-secondary">Designated personnel assigned as Plan Owners in this LMS</p>
            </div>
            <button 
              type="button" 
              (click)="goToGrid()"
              class="text-xs font-semibold text-tenant-600 dark:text-tenant-400 hover:underline">
              View All in Grid →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            @for (owner of ownerRoster(); track owner.email) {
              <div class="p-3 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 flex items-start gap-3">
                <div class="w-9 h-9 rounded-full bg-tenant-500/20 text-tenant-700 dark:text-tenant-300 font-bold flex items-center justify-center shrink-0 text-sm">
                  {{ owner.name.charAt(0) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-text-primary truncate">{{ owner.name }}</div>
                  <div class="text-[11px] text-text-secondary truncate">{{ owner.email }}</div>
                  <div class="mt-1.5 flex items-center gap-2 text-[10px]">
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

      </div>

      <!-- ================================================================= -->
      <!-- ACTIVE LEARNING TRACKS ROADMAP                                    -->
      <!-- ================================================================= -->
      <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-tenant-600">view_timeline</span>
              Active Learning Track Progression & Milestones
            </h3>
            <p class="text-[11px] text-text-secondary">Non-overlapping phase breakdowns and delivery workloads</p>
          </div>
          <button 
            type="button" 
            (click)="goToCreate()"
            class="text-xs font-semibold text-tenant-600 dark:text-tenant-400 hover:underline">
            + Design New Track
          </button>
        </div>

        <div class="space-y-4">
          @for (plan of activePlansList(); track plan.id) {
            <div class="p-4 rounded-xl bg-base-200/40 dark:bg-base-300/20 border border-base-300 dark:border-slate-800 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                    {{ plan.planCode }}
                  </span>
                  <span class="font-bold text-text-primary text-xs sm:text-sm hover:underline cursor-pointer" (click)="viewPlanDetails(plan.id)">
                    {{ plan.name }}
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                    {{ plan.status }}
                  </span>
                </div>

                <div class="text-xs text-text-secondary flex items-center gap-2">
                  <span>{{ plan.startDate }} → {{ plan.endDate }}</span>
                  <button 
                    type="button"
                    (click)="viewPlanDetails(plan.id)"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-100 dark:bg-base-200 border border-base-300 hover:bg-tenant-600 hover:text-white transition-colors">
                    Manage
                  </button>
                </div>
              </div>

              <!-- Phase Milestones Track (Horizontal sequence pills) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                @for (phase of plan.phases; track phase.id) {
                  <div class="p-2.5 rounded-lg bg-base-100 dark:bg-base-200 border border-base-300/80 dark:border-slate-700/80 space-y-1">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-bold text-tenant-600 dark:text-tenant-400">#{{ phase.sequence }} {{ phase.name }}</span>
                      <span class="text-[10px] font-semibold px-1.5 rounded bg-base-200 text-text-secondary">{{ phase.status }}</span>
                    </div>
                    <div class="text-[10px] text-text-secondary flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">date_range</span>
                      <span>{{ phase.startDate }} - {{ phase.endDate }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-[10px] text-text-secondary pt-1 border-t border-base-300/50">
                      <span>{{ phase.courseCount }} Courses</span>
                      <span>•</span>
                      <span>{{ phase.taskCount }} Tasks</span>
                      <span>•</span>
                      <span>{{ phase.deliveryClassCount }} Classes</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>

    </div>
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
export class PlanDashboardComponent {
  private router = inject(Router);
  private lmsData = inject(LmsDataService);

  activeTenant = this.lmsData.activeTenant;
  activeLms = this.lmsData.activeLms;
  plans = this.lmsData.activeLmsPlans;

  metrics = computed(() => {
    const list = this.plans();
    const totalPlans = list.length;
    const activePlans = list.filter(p => p.status === 'Active').length;
    const publishedPlans = list.filter(p => p.status === 'Published').length;
    const draftPlans = list.filter(p => p.status === 'Draft').length;
    const completedPlans = list.filter(p => p.status === 'Completed').length;
    const archivedPlans = list.filter(p => p.status === 'Archived').length;

    let totalPhases = 0;
    list.forEach(p => {
      totalPhases += (p.phases?.length || p.phaseCount || 0);
    });

    const avgPhasesPerPlan = totalPlans > 0 ? (totalPhases / totalPlans).toFixed(1) : '0';

    const assignedOwners = list.filter(p => !!p.owner?.email).length;
    const ownershipCoveragePct = totalPlans > 0 ? Math.round((assignedOwners / totalPlans) * 100) : 0;

    const openEnrollmentPlans = list.filter(p => p.enrollmentType === 'Open').length;
    const closedEnrollmentPlans = list.filter(p => p.enrollmentType === 'Closed').length;

    return {
      totalPlans,
      activePlans,
      publishedPlans,
      draftPlans,
      completedPlans,
      archivedPlans,
      totalPhases,
      avgPhasesPerPlan,
      assignedOwners,
      ownershipCoveragePct,
      openEnrollmentPlans,
      closedEnrollmentPlans
    };
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

  activePlansList = computed<Plan[]>(() => {
    return this.plans().filter(p => p.status === 'Active' || p.status === 'Published');
  });

  getStatusPct(status: PlanStatus): number {
    const total = this.plans().length;
    if (total === 0) return 0;
    const count = this.plans().filter(p => p.status === status).length;
    return Math.round((count / total) * 100);
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
}
