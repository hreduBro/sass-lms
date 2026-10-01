import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { TraineePlanService, TraineePlanSummary } from '../../../services/trainee-plan.service';
import { Plan, Phase, PlanComponent } from '../../../models/plan.model';
import { TraineeCredential, TraineeComponentState } from '../../../models/trainee-plan.model';

import { ContentViewerModalComponent } from '../components/content-viewer-modal.component';
import { CoursePlayerModalComponent } from '../components/course-player-modal.component';
import { ExamFlowModalComponent } from '../components/exam-flow-modal.component';
import { SurveyModalComponent } from '../components/survey-modal.component';
import { TaskMilestoneModalComponent } from '../components/task-milestone-modal.component';
import { CertificatePreviewModalComponent } from '../components/certificate-preview-modal.component';

@Component({
  selector: 'app-phase-view',
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
      
      @if (!planSummary() || !currentPhase()) {
        <div class="p-12 text-center rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200">
          <span class="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
          <h2 class="text-base font-bold text-text-primary">Phase Curriculum Not Found</h2>
          <p class="text-xs text-text-secondary mt-1">This phase does not exist or you are not enrolled in it.</p>
          <a routerLink="/my-plans" class="mt-4 inline-block px-4 py-2 rounded-xl text-xs font-bold bg-tenant-600 text-white">
            Return to My Plans
          </a>
        </div>
      } @else {

        <!-- Breadcrumbs Navigation -->
        <nav class="flex items-center gap-2 text-xs text-text-secondary">
          <a routerLink="/my-plans" class="hover:text-tenant-600 transition-colors">My Plans</a>
          <span>/</span>
          <a [routerLink]="['/my-plans', planSummary()!.plan.id]" class="hover:text-tenant-600 transition-colors truncate max-w-xs">
            {{ planSummary()!.plan.name }}
          </a>
          <span>/</span>
          <span class="font-bold text-text-primary truncate">{{ currentPhase()!.name }}</span>
        </nav>

        <!-- Phase Header Card -->
        <div class="p-6 sm:p-8 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div class="space-y-1.5 max-w-2xl">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-tenant-100 text-tenant-800 dark:bg-tenant-900/40 dark:text-tenant-300">
                  Sequential Progression Spine
                </span>
                <span class="text-xs text-text-secondary">
                  Window: {{ currentPhase()!.startDate }} - {{ currentPhase()!.endDate }}
                </span>
              </div>
              <h1 class="text-2xl font-black text-text-primary">{{ currentPhase()!.name }}</h1>
              <p class="text-xs text-text-secondary leading-relaxed">
                {{ currentPhase()!.description || 'Complete all mandatory modules in sequence to unlock certification requirements.' }}
              </p>
            </div>

            <!-- Passing Criteria & Phase Progress -->
            <div class="p-4 rounded-2xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 text-xs space-y-2 shrink-0 min-w-56">
              <div class="flex items-center justify-between font-bold">
                <span class="text-text-secondary">Phase Completion</span>
                <span class="text-tenant-600 dark:text-tenant-400">{{ phaseProgressPct() }}%</span>
              </div>
              <div class="w-full h-2 rounded-full bg-base-200 dark:bg-base-300 overflow-hidden">
                <div class="h-full bg-tenant-600 rounded-full transition-all" [style.width.%]="phaseProgressPct()"></div>
              </div>
              <div class="text-[10px] text-text-secondary pt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-emerald-500">verified</span>
                <span>Requirement: Complete all mandatory items</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Ordered Components Curriculum List -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-lg text-tenant-600">view_list</span>
              Curriculum Modules ({{ phaseComponents().length }} Total)
            </h3>
            <span class="text-xs text-text-secondary font-medium">Spine sequence: Top to Bottom</span>
          </div>

          <div class="space-y-3">
            @for (comp of phaseComponents(); track comp.id; let idx = $index) {
              @let stateInfo = getComponentState(comp);
              
              <div 
                class="p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                [class.bg-base-100]="stateInfo.state !== 'Locked'"
                [class.dark:bg-base-200]="stateInfo.state !== 'Locked'"
                [class.border-base-300]="stateInfo.state !== 'Locked'"
                [class.dark:border-slate-800]="stateInfo.state !== 'Locked'"
                [class.bg-base-200/40]="stateInfo.state === 'Locked'"
                [class.dark:bg-base-300/10]="stateInfo.state === 'Locked'"
                [class.border-base-300/50]="stateInfo.state === 'Locked'"
                [class.opacity-85]="stateInfo.state === 'Locked'">
                
                <div class="flex items-start gap-4">
                  <!-- Sequence badge -->
                  <div 
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                    [class.bg-emerald-500]="stateInfo.state === 'Completed'"
                    [class.text-white]="stateInfo.state === 'Completed'"
                    [class.bg-tenant-600]="stateInfo.state === 'In progress'"
                    [class.text-white]="stateInfo.state === 'In progress'"
                    [class.bg-base-200]="stateInfo.state === 'Available' || stateInfo.state === 'Optional'"
                    [class.text-text-primary]="stateInfo.state === 'Available' || stateInfo.state === 'Optional'"
                    [class.bg-base-300/60]="stateInfo.state === 'Locked'"
                    [class.text-text-secondary]="stateInfo.state === 'Locked'">
                    @if (stateInfo.state === 'Completed') {
                      <span class="material-symbols-outlined text-base">check</span>
                    } @else if (stateInfo.state === 'Locked') {
                      <span class="material-symbols-outlined text-base">lock</span>
                    } @else {
                      {{ idx + 1 }}
                    }
                  </div>

                  <div class="space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2 py-0.2 rounded text-[10px] font-bold bg-base-200 text-text-secondary">
                        {{ comp.type }}
                      </span>

                      <!-- State Pill -->
                      <span 
                        class="px-2 py-0.2 rounded-full text-[10px] font-bold"
                        [class.bg-emerald-100]="stateInfo.state === 'Completed'"
                        [class.text-emerald-800]="stateInfo.state === 'Completed'"
                        [class.bg-indigo-100]="stateInfo.state === 'In progress'"
                        [class.text-indigo-800]="stateInfo.state === 'In progress'"
                        [class.bg-rose-100]="stateInfo.state === 'Not passed'"
                        [class.text-rose-800]="stateInfo.state === 'Not passed'"
                        [class.bg-amber-100]="stateInfo.state === 'Locked'"
                        [class.text-amber-800]="stateInfo.state === 'Locked'"
                        [class.bg-slate-100]="stateInfo.state === 'Available' || stateInfo.state === 'Optional'">
                        {{ stateInfo.state }}
                      </span>

                      @if (comp.isMandatory) {
                        <span class="text-[10px] text-rose-600 font-semibold">• Mandatory</span>
                      }
                    </div>

                    <h4 class="text-sm font-bold text-text-primary">{{ comp.name }}</h4>

                    @if (comp.description) {
                      <p class="text-xs text-text-secondary line-clamp-1 max-w-xl">{{ comp.description }}</p>
                    }

                    <!-- Locking Explanation if Locked -->
                    @if (stateInfo.state === 'Locked' && stateInfo.lockReason) {
                      <div class="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1 pt-0.5">
                        <span class="material-symbols-outlined text-xs">info</span>
                        <span>{{ stateInfo.lockReason }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Action Button -->
                <div class="shrink-0 flex items-center gap-2">
                  @if (stateInfo.state === 'Completed') {
                    <button 
                      type="button" 
                      (click)="launchComponent(comp)"
                      class="px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-sm">visibility</span>
                      <span>Review</span>
                    </button>
                  } @else if (stateInfo.state === 'Locked') {
                    <button 
                      type="button" 
                      (click)="launchComponent(comp)"
                      class="px-3.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-sm">lock</span>
                      <span>Requirements</span>
                    </button>
                  } @else {
                    <button 
                      type="button" 
                      (click)="launchComponent(comp)"
                      class="px-4 py-2 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
                      <span class="material-symbols-outlined text-sm">play_arrow</span>
                      <span>{{ stateInfo.state === 'In progress' ? 'Continue' : 'Start' }}</span>
                    </button>
                  }
                </div>

              </div>
            }
          </div>
        </div>

      }

      <!-- Interactive Modals -->
      @if (activeContentComponent()) {
        <app-content-viewer-modal
          [component]="activeContentComponent()!"
          (close)="activeContentComponent.set(null)"
          (completed)="refreshData()">
        </app-content-viewer-modal>
      }

      @if (activeCourseComponent()) {
        <app-course-player-modal
          [component]="activeCourseComponent()!"
          (close)="activeCourseComponent.set(null)"
          (completed)="refreshData()">
        </app-course-player-modal>
      }

      @if (activeExamComponent()) {
        <app-exam-flow-modal
          [component]="activeExamComponent()!"
          (close)="activeExamComponent.set(null)"
          (completed)="refreshData()">
        </app-exam-flow-modal>
      }

      @if (activeSurveyComponent()) {
        <app-survey-modal
          [component]="activeSurveyComponent()!"
          (close)="activeSurveyComponent.set(null)"
          (completed)="refreshData()">
        </app-survey-modal>
      }

      @if (activeTaskComponent()) {
        <app-task-milestone-modal
          [component]="activeTaskComponent()!"
          (close)="activeTaskComponent.set(null)"
          (completed)="refreshData()">
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
export class TraineePhaseViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private traineeService = inject(TraineePlanService);

  planId = signal<string | null>(null);
  phaseId = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.planId.set(params.get('planId'));
      this.phaseId.set(params.get('phaseId'));
    });
  }

  planSummary = computed<TraineePlanSummary | undefined>(() => {
    const id = this.planId();
    if (!id) return undefined;
    return this.traineeService.getPlanSummary(id);
  });

  currentPhase = computed<Phase | undefined>(() => {
    const p = this.planSummary();
    const phId = this.phaseId();
    if (!p || !phId) return undefined;
    return p.scopedPhases.find(ph => ph.id === phId);
  });

  phaseComponents = computed<PlanComponent[]>(() => {
    const p = this.planSummary();
    const phId = this.phaseId();
    if (!p || !phId) return [];
    return p.scopedComponents.filter(c => c.phaseId === phId);
  });

  phaseProgressPct = computed<number>(() => {
    const comps = this.phaseComponents();
    if (comps.length === 0) return 0;
    const completed = comps.filter(c => this.getComponentState(c).state === 'Completed').length;
    return Math.round((completed / comps.length) * 100);
  });

  getComponentState(comp: PlanComponent) {
    const p = this.planSummary();
    if (!p) return { state: 'Available' as TraineeComponentState, progressPct: 0 };
    return this.traineeService.getComponentState(comp, p.plan, p.scopedComponents);
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

  refreshData() {
    // Triggers reactivity
  }
}
