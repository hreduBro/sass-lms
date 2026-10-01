import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TraineePlanService, TraineePlanSummary } from '../../../services/trainee-plan.service';
import { TRAINEE_PERSONAS, TraineePersona } from '../../../models/trainee-plan.model';

@Component({
  selector: 'app-my-plans',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 pb-16">
      
      <!-- Top Trainee Persona Simulator Switcher -->
      <div class="p-5 sm:p-6 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 flex items-center justify-center font-bold shrink-0">
              <span class="material-symbols-outlined text-2xl">switch_account</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-text-primary uppercase tracking-wider">Trainee Persona Simulator</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tenant-100 text-tenant-800 dark:bg-tenant-900/40 dark:text-tenant-300">
                  Interactive Preview
                </span>
              </div>
              <p class="text-xs text-text-secondary mt-0.5">
                Simulate trainee journeys across onboarding stages, phase scoping, completion, and prerequisite locking.
              </p>
            </div>
          </div>

          <!-- Persona Selector Chips (4 Personas) -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            @for (p of personas; track p.id) {
              <button 
                type="button" 
                (click)="switchPersona(p.id)"
                [class.bg-tenant-600]="activePersona().id === p.id"
                [class.text-white]="activePersona().id === p.id"
                [class.shadow-md]="activePersona().id === p.id"
                [class.bg-base-200]="activePersona().id !== p.id"
                [class.text-text-secondary]="activePersona().id !== p.id"
                class="px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer hover:border-tenant-400 border border-transparent">
                <img [src]="p.avatar" [alt]="p.name" class="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
                <div class="text-left leading-tight">
                  <div class="font-bold text-[11px]">{{ p.name }}</div>
                  <div class="text-[9px] opacity-80">{{ p.tag }}</div>
                </div>
              </button>
            }
          </div>
        </div>

        <!-- Active Persona Detail Strip -->
        <div class="mt-4 pt-3.5 border-t border-base-300 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="material-symbols-outlined text-sm text-tenant-600">badge</span>
            <span class="text-text-secondary">Simulated Trainee:</span>
            <strong class="text-text-primary text-sm">{{ activePersona().name }}</strong>
            <span class="text-text-secondary">• {{ activePersona().roleTitle }}</span>
            <span class="text-text-secondary">({{ activePersona().department }})</span>
            <span 
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              [class.bg-emerald-100]="activePersona().id === 'persona-devin'"
              [class.text-emerald-800]="activePersona().id === 'persona-devin'"
              [class.bg-indigo-100]="activePersona().id === 'persona-maya'"
              [class.text-indigo-800]="activePersona().id === 'persona-maya'"
              [class.bg-amber-100]="activePersona().id === 'persona-samira'"
              [class.text-amber-800]="activePersona().id === 'persona-samira'"
              [class.bg-rose-100]="activePersona().id === 'persona-alex'"
              [class.text-rose-800]="activePersona().id === 'persona-alex'">
              {{ activePersona().tag }}
            </span>
          </div>
          <div class="text-text-secondary italic text-[11px]">
            {{ activePersona().description }}
          </div>
        </div>
      </div>

      <!-- Actionable "Up Next" Hero Banner -->
      @if (heroUpNext(); as hero) {
        <div class="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-tenant-500/10 via-base-100 to-indigo-500/10 dark:from-tenant-950/40 dark:via-base-200 dark:to-indigo-950/30 border border-tenant-200 dark:border-tenant-900/50 shadow-sm relative overflow-hidden">
          
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-2.5 max-w-2xl">
              
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-tenant-600 text-white flex items-center gap-1 shadow-xs">
                  <span class="material-symbols-outlined text-xs">bolt</span>
                  Actionable Next Step
                </span>
                
                <span class="text-xs font-bold text-text-secondary">
                  {{ hero.planName }}
                </span>

                @if (hero.isLocked) {
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">lock</span>
                    Locked Requirement
                  </span>
                } @else {
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">play_circle</span>
                    Ready to Engage
                  </span>
                }
              </div>

              <div>
                <h2 class="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  {{ hero.component.name }}
                </h2>
                <p class="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
                  {{ hero.reason }}
                </p>
              </div>

              <!-- Quick Info Metadata -->
              <div class="flex items-center gap-4 text-xs text-text-secondary flex-wrap pt-1 font-medium">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-tenant-600">category</span>
                  {{ hero.component.type }}
                </span>
                @if (hero.component.durationDays) {
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-slate-500">schedule</span>
                    {{ hero.component.durationDays }} Days window
                  </span>
                }
                @if (hero.component.source?.itemName) {
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-amber-500">verified</span>
                    {{ hero.component.source?.itemName }}
                  </span>
                }
              </div>
            </div>

            <!-- Action Button -->
            <div class="shrink-0 flex items-center gap-3">
              @if (!hero.isLocked) {
                <a 
                  [routerLink]="['/my-plans', hero.planId]"
                  class="px-5 py-3 rounded-2xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5">
                  <span class="material-symbols-outlined text-base">play_arrow</span>
                  <span>{{ hero.state === 'In progress' ? 'Resume Interactive Module' : 'Start Next Activity' }}</span>
                </a>
              } @else {
                <a 
                  [routerLink]="['/my-plans', hero.planId]"
                  class="px-5 py-3 rounded-2xl bg-base-200 hover:bg-base-300 text-text-primary border border-base-300 dark:border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer">
                  <span class="material-symbols-outlined text-base text-amber-500">info</span>
                  <span>View Prerequisite Guidance</span>
                </a>
              }
            </div>
          </div>
        </div>
      }

      <!-- Header & Trainee Quick Links -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 class="text-2xl font-black text-text-primary flex items-center gap-2.5">
            <span class="material-symbols-outlined text-2xl text-tenant-600">assignment_turned_in</span>
            Enrolled Learning Pathways
          </h1>
          <p class="text-xs text-text-secondary mt-1">
            Official learning plans assigned to {{ activePersona().name }} with curriculum meters and competency milestones.
          </p>
        </div>

        <!-- Shortcut Action Buttons -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <a 
            routerLink="/my-schedule"
            class="px-4 py-2.5 rounded-xl text-xs font-bold bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 text-text-primary hover:bg-base-200 flex items-center gap-2 transition-colors shadow-xs">
            <span class="material-symbols-outlined text-base text-amber-500">calendar_month</span>
            <span>Classroom Schedule</span>
          </a>

          <a 
            routerLink="/my-achievements"
            class="px-4 py-2.5 rounded-xl text-xs font-bold bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 text-text-primary hover:bg-base-200 flex items-center gap-2 transition-colors shadow-xs">
            <span class="material-symbols-outlined text-base text-indigo-500">military_tech</span>
            <span>My Credentials</span>
          </a>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 p-1.5 bg-base-200/60 dark:bg-base-300/40 rounded-2xl border border-base-300 dark:border-slate-800 overflow-x-auto">
        @for (tab of tabs; track tab.key) {
          <button 
            type="button" 
            (click)="selectedTab.set(tab.key)"
            [class.bg-base-100]="selectedTab() === tab.key"
            [class.dark:bg-base-200]="selectedTab() === tab.key"
            [class.text-tenant-600]="selectedTab() === tab.key"
            [class.dark:text-tenant-400]="selectedTab() === tab.key"
            [class.shadow-xs]="selectedTab() === tab.key"
            [class.text-text-secondary]="selectedTab() !== tab.key"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2">
            <span>{{ tab.label }}</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-base-200 dark:bg-base-300 font-bold text-text-primary">
              {{ getCountForTab(tab.key) }}
            </span>
          </button>
        }
      </div>

      <!-- Plan Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (summary of filteredPlans(); track summary.plan.id) {
          <div class="p-6 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
            
            <!-- Card Header -->
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono text-[11px] font-bold text-text-secondary px-2 py-0.5 rounded bg-base-200 dark:bg-base-300">
                    {{ summary.plan.planCode }}
                  </span>
                  
                  <!-- Status Pill -->
                  <span 
                    class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                    [class.bg-emerald-100]="summary.status === 'Completed'"
                    [class.text-emerald-800]="summary.status === 'Completed'"
                    [class.dark:bg-emerald-950/40]="summary.status === 'Completed'"
                    [class.dark:text-emerald-300]="summary.status === 'Completed'"
                    [class.bg-indigo-100]="summary.status === 'In progress'"
                    [class.text-indigo-800]="summary.status === 'In progress'"
                    [class.dark:bg-indigo-950/40]="summary.status === 'In progress'"
                    [class.dark:text-indigo-300]="summary.status === 'In progress'"
                    [class.bg-slate-100]="summary.status === 'Not started'"
                    [class.text-slate-700]="summary.status === 'Not started'">
                    {{ summary.status }}
                  </span>

                  <!-- Scope-Aware Badge -->
                  @if (summary.isScopeConstrained) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">filter_center_focus</span>
                      Phase-Scoped
                    </span>
                  }
                </div>

                <span class="text-xs text-text-secondary font-medium flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">schedule</span>
                  {{ summary.plan.durationType }}
                </span>
              </div>

              <!-- Title & Description -->
              <div>
                <h3 class="text-base font-bold text-text-primary line-clamp-1 hover:text-tenant-600 transition-colors">
                  <a [routerLink]="['/my-plans', summary.plan.id]">{{ summary.plan.name }}</a>
                </h3>
                <p class="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                  {{ summary.plan.description }}
                </p>
              </div>

              <!-- Scoped Phases Tag Strip -->
              <div class="flex items-center gap-1.5 flex-wrap pt-1">
                @for (ph of summary.scopedPhases; track ph.id) {
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-base-200/80 dark:bg-base-300/50 text-text-secondary">
                    {{ ph.name }}
                  </span>
                }
              </div>
            </div>

            <!-- Progress Metric & Up Next Teaser -->
            <div class="space-y-4 pt-4 border-t border-base-300 dark:border-slate-800">
              
              <!-- Curriculum Progress Bar -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-text-secondary font-medium">Curriculum Progress</span>
                  <span class="font-bold text-tenant-600 dark:text-tenant-400">
                    {{ summary.overallProgressPct }}% ({{ summary.completedComponentsCount }}/{{ summary.totalComponentsCount }} done)
                  </span>
                </div>
                <div class="w-full h-2.5 rounded-full bg-base-200 dark:bg-base-300 overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    [class.bg-emerald-500]="summary.status === 'Completed'"
                    [class.bg-tenant-600]="summary.status !== 'Completed'"
                    [style.width.%]="summary.overallProgressPct"></div>
                </div>
              </div>

              <!-- Up Next Teaser within Card -->
              @if (summary.nextActionComponent) {
                <div class="p-3 rounded-2xl bg-base-200/40 dark:bg-base-300/20 border border-base-300 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div class="flex items-center gap-2.5 overflow-hidden">
                    <span class="material-symbols-outlined text-base text-tenant-600 shrink-0">
                      {{ summary.isNextActionLocked ? 'lock' : 'play_circle' }}
                    </span>
                    <div class="truncate">
                      <span class="text-[10px] uppercase font-bold text-text-secondary block">Up Next:</span>
                      <span class="font-bold text-text-primary truncate block">{{ summary.nextActionComponent.name }}</span>
                    </div>
                  </div>
                  <span class="text-[10px] font-semibold text-text-secondary whitespace-nowrap">
                    {{ summary.nextActionComponent.type }}
                  </span>
                </div>
              }

              <!-- Bottom Actions -->
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center gap-2">
                  @if (summary.earnedCertificates.length > 0) {
                    <span class="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <span class="material-symbols-outlined text-sm">workspace_premium</span>
                      {{ summary.earnedCertificates.length }} Certificate(s)
                    </span>
                  }
                </div>

                <a 
                  [routerLink]="['/my-plans', summary.plan.id]"
                  class="px-4 py-2 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs">
                  <span>{{ summary.status === 'Completed' ? 'Review Plan' : (summary.status === 'Not started' ? 'Start Journey' : 'Continue Journey') }}</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

            </div>

          </div>
        }
      </div>

      @if (filteredPlans().length === 0) {
        <div class="p-12 text-center rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 space-y-3">
          <div class="w-16 h-16 rounded-2xl bg-base-200 text-text-secondary flex items-center justify-center mx-auto">
            <span class="material-symbols-outlined text-3xl">school</span>
          </div>
          <h3 class="text-base font-bold text-text-primary">No Learning Plans Found</h3>
          <p class="text-xs text-text-secondary max-w-sm mx-auto">
            No pathways match the selected status filter. Switch tabs to see in-progress or completed journeys.
          </p>
        </div>
      }

    </div>
  `
})
export class TraineePlanGridComponent {
  private traineeService = inject(TraineePlanService);

  personas = TRAINEE_PERSONAS;
  activePersona = this.traineeService.activePersona;

  selectedTab = signal<'all' | 'in_progress' | 'not_started' | 'completed'>('all');

  tabs = [
    { key: 'all' as const, label: 'All Enrolled Plans' },
    { key: 'in_progress' as const, label: 'In Progress' },
    { key: 'not_started' as const, label: 'Not Started' },
    { key: 'completed' as const, label: 'Completed' }
  ];

  plansList = computed<TraineePlanSummary[]>(() => {
    return this.traineeService.getTraineePlans(this.activePersona());
  });

  heroUpNext = computed(() => {
    const list = this.plansList();
    if (!list || list.length === 0) return null;
    
    // Pick first plan with an active nextActionComponent
    for (const p of list) {
      if (p.nextActionComponent) {
        return {
          planId: p.plan.id,
          planName: p.plan.name,
          component: p.nextActionComponent,
          reason: p.nextActionReason || 'Proceed with your next assigned module.',
          isLocked: p.isNextActionLocked || false,
          state: p.nextActionComponent.type === 'Course' ? 'In progress' : 'Available'
        };
      }
    }
    return null;
  });

  filteredPlans = computed<TraineePlanSummary[]>(() => {
    const list = this.plansList();
    const tab = this.selectedTab();
    if (tab === 'in_progress') return list.filter(p => p.status === 'In progress');
    if (tab === 'not_started') return list.filter(p => p.status === 'Not started');
    if (tab === 'completed') return list.filter(p => p.status === 'Completed');
    return list;
  });

  getCountForTab(key: 'all' | 'in_progress' | 'not_started' | 'completed'): number {
    const list = this.plansList();
    if (key === 'all') return list.length;
    if (key === 'in_progress') return list.filter(p => p.status === 'In progress').length;
    if (key === 'not_started') return list.filter(p => p.status === 'Not started').length;
    if (key === 'completed') return list.filter(p => p.status === 'Completed').length;
    return 0;
  }

  switchPersona(id: string) {
    this.traineeService.setPersona(id);
  }
}
