import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { TraineePlanService, TraineePlanSummary } from '../../../services/trainee-plan.service';
import { Plan, Phase, PlanComponent } from '../../../models/plan.model';
import { TraineeCredential, TraineeScheduleItem } from '../../../models/trainee-plan.model';

import { ContentViewerModalComponent } from '../components/content-viewer-modal.component';
import { CoursePlayerModalComponent } from '../components/course-player-modal.component';
import { ExamFlowModalComponent } from '../components/exam-flow-modal.component';
import { SurveyModalComponent } from '../components/survey-modal.component';
import { TaskMilestoneModalComponent } from '../components/task-milestone-modal.component';
import { CertificatePreviewModalComponent } from '../components/certificate-preview-modal.component';

@Component({
  selector: 'app-plan-overview',
  imports: [
    CommonModule,
    RouterModule,
    ContentViewerModalComponent,
    CoursePlayerModalComponent,
    ExamFlowModalComponent,
    SurveyModalComponent,
    TaskMilestoneModalComponent,
    CertificatePreviewModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 pb-16">
      
      @if (!planSummary()) {
        <div class="p-12 text-center rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200">
          <span class="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
          <h2 class="text-base font-bold text-text-primary">Plan Not Found</h2>
          <p class="text-xs text-text-secondary mt-1">This plan does not exist or you are not enrolled.</p>
          <a routerLink="/my-plans" class="mt-4 inline-block px-4 py-2 rounded-xl text-xs font-bold bg-tenant-600 text-white">
            Return to My Plans
          </a>
        </div>
      } @else {
        
        <!-- Breadcrumbs Navigation -->
        <nav class="flex items-center gap-2 text-xs text-text-secondary">
          <a routerLink="/my-plans" class="hover:text-tenant-600 transition-colors flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">assignment_turned_in</span>
            My Plans
          </a>
          <span>/</span>
          <span class="font-bold text-text-primary truncate">{{ planSummary()!.plan.name }}</span>
        </nav>

        <!-- ZONE B.1: PLAN HEADER -->
        <div class="p-6 sm:p-8 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm relative overflow-hidden">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            
            <!-- Left Info -->
            <div class="space-y-3 max-w-2xl">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span class="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-base-200 dark:bg-base-300 text-text-secondary">
                  {{ planSummary()!.plan.planCode }}
                </span>
                <span 
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  [class.bg-emerald-100]="planSummary()!.status === 'Completed'"
                  [class.text-emerald-800]="planSummary()!.status === 'Completed'"
                  [class.bg-indigo-100]="planSummary()!.status === 'In progress'"
                  [class.text-indigo-800]="planSummary()!.status === 'In progress'"
                  [class.bg-slate-100]="planSummary()!.status === 'Not started'"
                  [class.text-slate-700]="planSummary()!.status === 'Not started'">
                  {{ planSummary()!.status }}
                </span>

                @if (planSummary()!.isScopeConstrained) {
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">filter_center_focus</span>
                    Specialist Phase Enrolled
                  </span>
                }
              </div>

              <h1 class="text-2xl sm:text-3xl font-black text-text-primary leading-tight">
                {{ planSummary()!.plan.name }}
              </h1>
              <p class="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {{ planSummary()!.plan.description }}
              </p>

              <!-- Meta pills -->
              <div class="flex items-center gap-4 text-xs text-text-secondary pt-2 flex-wrap">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-slate-500">calendar_today</span>
                  Duration: {{ planSummary()!.plan.startDate }} - {{ planSummary()!.plan.endDate }}
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-slate-500">timeline</span>
                  {{ planSummary()!.scopedPhases.length }} Enrolled Phases
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-slate-500">account_circle</span>
                  Mentor: {{ planSummary()!.plan.owner?.name || 'Academic Dean' }}
                </span>
              </div>
            </div>

            <!-- Right: Circular Progress Meter & Credential preview chip -->
            <div class="flex flex-col sm:flex-row items-center gap-6 bg-base-200/50 dark:bg-base-300/30 p-5 rounded-2xl border border-base-300 dark:border-slate-800">
              
              <!-- Circular Progress Gauge -->
              <div class="text-center space-y-1">
                <div class="relative w-24 h-24 flex items-center justify-center">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      class="text-base-300 dark:text-slate-700"
                      stroke-width="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      class="text-tenant-600 transition-all duration-1000 stroke-current"
                      stroke-dasharray="100, 100"
                      [attr.stroke-dashoffset]="100 - planSummary()!.overallProgressPct"
                      stroke-linecap="round"
                      stroke-width="3.8"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div class="absolute flex flex-col items-center">
                    <span class="text-xl font-black text-text-primary">{{ planSummary()!.overallProgressPct }}%</span>
                  </div>
                </div>
                <div class="text-[11px] font-bold text-text-secondary">Overall Mastery</div>
              </div>

              <!-- Metrics -->
              <div class="space-y-2 text-xs border-t sm:border-t-0 sm:border-l border-base-300 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                <div>
                  <div class="text-[10px] uppercase font-bold text-text-secondary">Components Completed</div>
                  <div class="font-bold text-text-primary mt-0.5">
                    {{ planSummary()!.completedComponentsCount }} of {{ planSummary()!.totalComponentsCount }} done
                  </div>
                </div>
                <div>
                  <div class="text-[10px] uppercase font-bold text-text-secondary">Target Completion</div>
                  <div class="font-bold text-tenant-600 dark:text-tenant-400 mt-0.5">
                    {{ planSummary()!.plan.endDate }}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- ZONE B.2: "UP NEXT" HERO ACTION CARD -->
        @if (planSummary()!.nextActionComponent) {
          <div 
            class="p-6 sm:p-7 rounded-3xl border relative overflow-hidden transition-all shadow-sm"
            [class.bg-gradient-to-r]="!planSummary()!.isNextActionLocked"
            [class.from-tenant-50]="!planSummary()!.isNextActionLocked"
            [class.via-base-100]="!planSummary()!.isNextActionLocked"
            [class.to-base-100]="!planSummary()!.isNextActionLocked"
            [class.dark:from-tenant-950/20]="!planSummary()!.isNextActionLocked"
            [class.dark:via-base-200]="!planSummary()!.isNextActionLocked"
            [class.dark:to-base-200]="!planSummary()!.isNextActionLocked"
            [class.border-tenant-200]="!planSummary()!.isNextActionLocked"
            [class.dark:border-tenant-900/40]="!planSummary()!.isNextActionLocked"
            [class.bg-base-100]="planSummary()!.isNextActionLocked"
            [class.border-amber-300]="planSummary()!.isNextActionLocked"
            [class.dark:border-amber-900/50]="planSummary()!.isNextActionLocked">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              
              <div class="flex items-start gap-4">
                <div 
                  class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
                  [class.bg-tenant-600]="!planSummary()!.isNextActionLocked"
                  [class.text-white]="!planSummary()!.isNextActionLocked"
                  [class.bg-amber-100]="planSummary()!.isNextActionLocked"
                  [class.text-amber-800]="planSummary()!.isNextActionLocked">
                  <span class="material-symbols-outlined text-2xl">
                    {{ planSummary()!.isNextActionLocked ? 'lock' : 'play_circle' }}
                  </span>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] font-black uppercase tracking-wider text-tenant-600 dark:text-tenant-400">
                      Up Next on your journey
                    </span>
                    <span class="px-2 py-0.2 rounded text-[10px] font-bold bg-base-200 dark:bg-base-300 text-text-secondary">
                      {{ planSummary()!.nextActionComponent!.type }}
                    </span>
                  </div>

                  <h2 class="text-lg sm:text-xl font-bold text-text-primary">
                    {{ planSummary()!.nextActionComponent!.name }}
                  </h2>

                  <p class="text-xs text-text-secondary leading-relaxed max-w-xl">
                    {{ planSummary()!.nextActionReason }}
                  </p>
                </div>
              </div>

              <!-- Action CTA -->
              <div class="shrink-0 flex items-center gap-3">
                @if (!planSummary()!.isNextActionLocked) {
                  <button 
                    type="button" 
                    (click)="launchComponent(planSummary()!.nextActionComponent!)"
                    class="px-6 py-3 rounded-2xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:scale-102 transition-all cursor-pointer">
                    <span class="material-symbols-outlined text-lg">play_arrow</span>
                    <span>Launch Module</span>
                  </button>
                } @else {
                  <button 
                    type="button" 
                    (click)="launchComponent(planSummary()!.nextActionComponent!)"
                    class="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer">
                    <span class="material-symbols-outlined text-lg">info</span>
                    <span>View Requirements</span>
                  </button>
                }
              </div>

            </div>
          </div>
        }

        <!-- ZONE B.3: TIMELINE & SCHEDULE STRIP -->
        <div class="p-6 sm:p-7 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-xl text-amber-500">calendar_month</span>
              <div>
                <h3 class="text-base font-bold text-text-primary">Upcoming Schedule & Milestone Events</h3>
                <p class="text-xs text-text-secondary">In-person classes, diagnostic exams, and phase boundaries.</p>
              </div>
            </div>

            <a routerLink="/my-schedule" class="text-xs font-bold text-tenant-600 hover:underline flex items-center gap-1">
              <span>View Full Schedule</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>

          <!-- Horizontal Schedule Strip -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            @for (item of planScheduleItems(); track item.id) {
              <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-200/50 dark:bg-base-300/30 hover:border-tenant-400 transition-all space-y-2">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]"
                    [class.bg-amber-100]="item.type === 'class_session'"
                    [class.text-amber-800]="item.type === 'class_session'"
                    [class.bg-rose-100]="item.type === 'exam'"
                    [class.text-rose-800]="item.type === 'exam'"
                    [class.bg-indigo-100]="item.type === 'phase_window'"
                    [class.text-indigo-800]="item.type === 'phase_window'">
                    {{ item.type === 'class_session' ? 'In-Person Class' : (item.type === 'exam' ? 'Evaluation' : 'Phase Window') }}
                  </span>
                  <span class="font-bold text-text-primary">{{ item.date }}</span>
                </div>

                <div class="font-bold text-xs text-text-primary line-clamp-1">{{ item.title }}</div>
                
                @if (item.time) {
                  <div class="text-[11px] text-text-secondary flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-xs text-slate-500">schedule</span>
                    <span>{{ item.time }}</span>
                    @if (item.venue) {
                      <span>• {{ item.venue }}</span>
                    }
                  </div>
                }

                @if (item.type === 'class_session') {
                  <div class="pt-1 flex items-center justify-between">
                    <span 
                      class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      [class.bg-emerald-100]="item.status === 'Attended'"
                      [class.text-emerald-800]="item.status === 'Attended'"
                      [class.bg-base-200]="item.status !== 'Attended'">
                      {{ item.status }}
                    </span>
                    <button 
                      type="button" 
                      (click)="toggleAttendance(item.id)"
                      class="text-[10px] font-bold text-tenant-600 hover:underline cursor-pointer">
                      Toggle Attendance
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- ZONE B.4: PHASE JOURNEY SPINE -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-xl text-tenant-600">timeline</span>
                Structured Journey Phases
              </h3>
              <p class="text-xs text-text-secondary">Chronological stages of your qualification pathway.</p>
            </div>
            <span class="text-xs font-semibold text-text-secondary">
              {{ planSummary()!.scopedPhases.length }} Phase(s) Enrolled
            </span>
          </div>

          <div class="space-y-4">
            @for (ph of planSummary()!.scopedPhases; track ph.id; let idx = $index) {
              <div class="p-6 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm hover:border-tenant-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div class="flex items-start gap-4">
                  <!-- Phase Number Indicator -->
                  <div class="w-12 h-12 rounded-2xl bg-base-200 dark:bg-base-300 text-text-primary font-black flex items-center justify-center text-lg shrink-0">
                    {{ idx + 1 }}
                  </div>

                  <div class="space-y-1.5">
                    <div class="flex items-center gap-2.5 flex-wrap">
                      <span class="font-bold text-sm text-text-primary">{{ ph.name }}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-base-200 text-text-secondary">
                        Window: {{ ph.startDate }} - {{ ph.endDate }}
                      </span>
                    </div>
                    <p class="text-xs text-text-secondary leading-relaxed">
                      {{ ph.description || 'Core instructional modules, practical assignments, and competency certifications.' }}
                    </p>
                    <div class="text-[11px] text-text-secondary flex items-center gap-3">
                      <span>{{ getPhaseComponents(ph.id).length }} Learning Components</span>
                      <span>• Progression: Sequential Spine</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <a 
                    [routerLink]="['/my-plans', planSummary()!.plan.id, 'phase', ph.id]"
                    class="px-5 py-2.5 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs">
                    <span>View Phase Curriculum</span>
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                </div>

              </div>
            }
          </div>
        </div>

        <!-- ZONE B.5: CREDENTIAL SHELF -->
        <div class="p-6 sm:p-7 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-xl text-indigo-500">military_tech</span>
              <div>
                <h3 class="text-base font-bold text-text-primary">Plan Credential Shelf</h3>
                <p class="text-xs text-text-secondary">Diplomas and milestone badges unlockable in this journey.</p>
              </div>
            </div>

            <a routerLink="/my-achievements" class="text-xs font-bold text-tenant-600 hover:underline">
              View All My Credentials
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (cred of planCredentials(); track cred.id) {
              <div 
                (click)="openCredential(cred)"
                class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-200/40 dark:bg-base-300/20 hover:border-amber-400 transition-all cursor-pointer space-y-3">
                <div class="flex items-start justify-between">
                  <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <span class="material-symbols-outlined text-2xl">
                      {{ cred.type === 'badge' ? 'military_tech' : 'workspace_premium' }}
                    </span>
                  </div>
                  <span 
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [class.bg-emerald-100]="cred.status === 'Earned'"
                    [class.text-emerald-800]="cred.status === 'Earned'"
                    [class.bg-base-200]="cred.status !== 'Earned'"
                    [class.text-text-secondary]="cred.status !== 'Earned'">
                    {{ cred.status }}
                  </span>
                </div>

                <div>
                  <div class="font-bold text-xs text-text-primary">{{ cred.title }}</div>
                  <div class="text-[11px] text-text-secondary mt-0.5">{{ cred.subtitle }}</div>
                </div>

                <div class="pt-1 text-[10px] font-bold text-tenant-600 flex items-center gap-1">
                  <span>{{ cred.status === 'Earned' ? 'View Official Certificate' : 'Preview Credential' }}</span>
                  <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </div>
              </div>
            }
          </div>
        </div>

      }

      <!-- Interactive Component Modals -->
      @if (activeContentComponent()) {
        <app-content-viewer-modal
          [component]="activeContentComponent()!"
          (close)="activeContentComponent.set(null)"
          (completed)="refreshPlan()">
        </app-content-viewer-modal>
      }

      @if (activeCourseComponent()) {
        <app-course-player-modal
          [component]="activeCourseComponent()!"
          (close)="activeCourseComponent.set(null)"
          (completed)="refreshPlan()">
        </app-course-player-modal>
      }

      @if (activeExamComponent()) {
        <app-exam-flow-modal
          [component]="activeExamComponent()!"
          (close)="activeExamComponent.set(null)"
          (completed)="refreshPlan()">
        </app-exam-flow-modal>
      }

      @if (activeSurveyComponent()) {
        <app-survey-modal
          [component]="activeSurveyComponent()!"
          (close)="activeSurveyComponent.set(null)"
          (completed)="refreshPlan()">
        </app-survey-modal>
      }

      @if (activeTaskComponent()) {
        <app-task-milestone-modal
          [component]="activeTaskComponent()!"
          (close)="activeTaskComponent.set(null)"
          (completed)="refreshPlan()">
        </app-task-milestone-modal>
      }

      @if (previewCredential()) {
        <app-certificate-preview-modal
          [credential]="previewCredential()!"
          (close)="previewCredential.set(null)">
        </app-certificate-preview-modal>
      }

    </div>
  `
})
export class TraineePlanOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private traineeService = inject(TraineePlanService);

  planId = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.planId.set(params.get('planId'));
    });
  }

  planSummary = computed<TraineePlanSummary | undefined>(() => {
    const id = this.planId();
    if (!id) return undefined;
    return this.traineeService.getPlanSummary(id);
  });

  planCredentials = computed<TraineeCredential[]>(() => {
    const p = this.planSummary();
    if (!p) return [];
    return this.traineeService.getPlanCredentials(p.plan);
  });

  planScheduleItems = computed<TraineeScheduleItem[]>(() => {
    const p = this.planSummary();
    if (!p) return [];
    return this.traineeService.getScheduleItems().filter(i => i.planId === p.plan.id).slice(0, 3);
  });

  getPhaseComponents(phaseId: string): PlanComponent[] {
    const p = this.planSummary();
    if (!p) return [];
    return p.scopedComponents.filter(c => c.phaseId === phaseId);
  }

  toggleAttendance(sessionId: string) {
    this.traineeService.toggleSessionAttendanceState(sessionId);
  }

  // Active Interactive Modals
  activeContentComponent = signal<PlanComponent | null>(null);
  activeCourseComponent = signal<PlanComponent | null>(null);
  activeExamComponent = signal<PlanComponent | null>(null);
  activeSurveyComponent = signal<PlanComponent | null>(null);
  activeTaskComponent = signal<PlanComponent | null>(null);
  previewCredential = signal<TraineeCredential | null>(null);

  launchComponent(comp: PlanComponent) {
    if (comp.type === 'Content') {
      this.activeContentComponent.set(comp);
    } else if (comp.type === 'Course') {
      this.activeCourseComponent.set(comp);
    } else if (comp.type === 'Pre-Test' || comp.type === 'Post-Test') {
      this.activeExamComponent.set(comp);
    } else if (comp.type === 'Survey') {
      this.activeSurveyComponent.set(comp);
    } else {
      this.activeTaskComponent.set(comp);
    }
  }

  openCredential(cred: TraineeCredential) {
    this.previewCredential.set(cred);
  }

  refreshPlan() {
    // Triggers reactivity
  }
}
