import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanComponent, PlanComponentClassSession } from '../../../models/plan.model';
import { TraineePlanService } from '../../../services/trainee-plan.service';

interface CourseModuleItem {
  id: string;
  title: string;
  duration: string;
  isComplete: boolean;
  type: 'video' | 'quiz' | 'reading' | 'class';
}

@Component({
  selector: 'app-course-player-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/80 backdrop-blur-md z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-modal-card m-auto">

        <!-- Top Bar -->
        <div class="p-4 sm:p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/40">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">school</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {{ component().deliveryMode || 'Blended Delivery' }}
                </span>
                <span class="text-xs text-text-secondary">Interactive Course Player</span>
              </div>
              <h2 class="text-base font-bold text-text-primary mt-0.5">{{ component().name }}</h2>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="text-right hidden sm:block">
              <div class="text-[11px] text-text-secondary">Progress</div>
              <div class="text-xs font-bold text-tenant-600 dark:text-tenant-400">{{ courseProgressPct() }}% Done</div>
            </div>
            <button 
              type="button" 
              (click)="close.emit()"
              class="w-9 h-9 rounded-full hover:bg-base-300 dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <!-- Main Body: 2-Column Split -->
        <div class="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
          
          <!-- Left Main Area: Active Lesson Content & Video -->
          <div class="lg:col-span-2 p-5 sm:p-6 overflow-y-auto space-y-6 border-b lg:border-b-0 lg:border-r border-base-300 dark:border-slate-800">
            
            <div class="rounded-2xl overflow-hidden bg-slate-950 aspect-video relative flex items-center justify-center text-white shadow-md">
              <div class="text-center p-6 space-y-3">
                <div class="w-14 h-14 rounded-full bg-tenant-600/90 text-white flex items-center justify-center mx-auto shadow-lg">
                  <span class="material-symbols-outlined text-3xl">play_arrow</span>
                </div>
                <div>
                  <h4 class="font-bold text-sm text-slate-100">{{ activeModule().title }}</h4>
                  <p class="text-xs text-slate-400 mt-1">Instructor: Dr. Rafiqul Islam • BRAC Institute of Governance</p>
                </div>
              </div>
            </div>

            <!-- Lesson Information -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-text-primary">{{ activeModule().title }}</h3>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-base-200 text-text-secondary">
                  Estimated: {{ activeModule().duration }}
                </span>
              </div>
              <p class="text-xs text-text-secondary leading-relaxed">
                This unit covers foundational microfinance credit risk evaluation, community loan guarantor verification, and field visit checklists. Please study the lesson notes before attending the scheduled in-person practical lab session.
              </p>
            </div>

            <!-- In-Person Class Sessions attached to this Course -->
            @if (component().includedClasses && component().includedClasses!.length > 0) {
              <div class="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base">co_present</span>
                    <h4 class="text-xs font-bold text-amber-900 dark:text-amber-200">Required In-Person Classroom Sessions</h4>
                  </div>
                  <span class="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Mandatory Attendance</span>
                </div>

                <div class="space-y-2">
                  @for (ses of component().includedClasses; track ses.id) {
                    <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div class="font-bold text-text-primary">{{ ses.name }}</div>
                        <div class="text-[11px] text-text-secondary mt-0.5 flex items-center gap-3 flex-wrap">
                          <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-amber-600">calendar_month</span>
                            {{ ses.date }} ({{ ses.time }})
                          </span>
                          <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-slate-500">pin_drop</span>
                            {{ ses.venue }}
                          </span>
                          <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-slate-500">person</span>
                            {{ ses.instructor }}
                          </span>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <button 
                          type="button" 
                          (click)="toggleAttendance(ses.id)"
                          [class.bg-emerald-600]="isSessionAttended(ses.id)"
                          [class.text-white]="isSessionAttended(ses.id)"
                          [class.bg-base-200]="!isSessionAttended(ses.id)"
                          [class.text-text-secondary]="!isSessionAttended(ses.id)"
                          class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                          <span class="material-symbols-outlined text-sm">
                            {{ isSessionAttended(ses.id) ? 'check_circle' : 'schedule' }}
                          </span>
                          <span>{{ isSessionAttended(ses.id) ? 'Attended' : 'Mark Attendance' }}</span>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

          </div>

          <!-- Right Sidebar: Curriculum Syllabus Stepper -->
          <div class="p-5 sm:p-6 bg-base-200/30 overflow-y-auto space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-text-secondary">Course Syllabus Modules</h4>
            
            <div class="space-y-2">
              @for (mod of modules(); track mod.id; let i = $index) {
                <div 
                  (click)="selectModule(mod)"
                  [class.border-tenant-500]="activeModule().id === mod.id"
                  [class.bg-tenant-50/40]="activeModule().id === mod.id"
                  [class.dark:bg-tenant-950/20]="activeModule().id === mod.id"
                  [class.border-base-300]="activeModule().id !== mod.id"
                  class="p-3 rounded-xl border bg-base-100 dark:bg-base-200 hover:border-tenant-400 transition-all cursor-pointer flex items-center justify-between text-xs">
                  
                  <div class="flex items-center gap-2.5">
                    <span 
                      class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                      [class.bg-emerald-500]="mod.isComplete"
                      [class.text-white]="mod.isComplete"
                      [class.bg-base-200]="!mod.isComplete"
                      [class.text-text-secondary]="!mod.isComplete">
                      @if (mod.isComplete) {
                        <span class="material-symbols-outlined text-xs">check</span>
                      } @else {
                        {{ i + 1 }}
                      }
                    </span>
                    <div>
                      <div class="font-bold text-text-primary line-clamp-1">{{ mod.title }}</div>
                      <div class="text-[10px] text-text-secondary">{{ mod.duration }}</div>
                    </div>
                  </div>

                  <span class="material-symbols-outlined text-sm text-text-secondary">
                    {{ mod.type === 'video' ? 'play_circle' : (mod.type === 'class' ? 'co_present' : 'description') }}
                  </span>
                </div>
              }
            </div>

            <!-- Earnable Badge Box -->
            @if (component().courseBadges && component().courseBadges!.length > 0) {
              <div class="p-4 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 space-y-2 mt-4">
                <span class="text-[10px] uppercase font-bold text-text-secondary">Completion Reward</span>
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <span class="material-symbols-outlined text-base">military_tech</span>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-text-primary">{{ component().courseBadges![0] }}</div>
                    <div class="text-[10px] text-emerald-600 font-semibold">Awarded upon 100% completion</div>
                  </div>
                </div>
              </div>
            }

          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 sm:p-5 border-t border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/40">
          <button 
            type="button" 
            (click)="close.emit()"
            class="px-4 py-2.5 rounded-xl border border-base-300 dark:border-slate-700 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer">
            Exit Player
          </button>

          <div class="flex items-center gap-2">
            <button 
              type="button" 
              (click)="completeCurrentLesson()"
              class="px-4 py-2.5 rounded-xl border border-tenant-300 dark:border-tenant-800 text-tenant-600 dark:text-tenant-400 hover:bg-tenant-50 dark:hover:bg-tenant-950/30 text-xs font-bold cursor-pointer transition-colors">
              Mark Lesson Finished
            </button>
            <button 
              type="button" 
              (click)="finishCourse()"
              class="px-5 py-2.5 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-base">verified</span>
              <span>Complete Course & Claim Badge</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class CoursePlayerModalComponent {
  component = input.required<PlanComponent>();
  close = output<void>();
  completed = output<void>();

  private traineeService = inject(TraineePlanService);

  modules = signal<CourseModuleItem[]>([
    { id: 'm1', title: '1. Fundamentals of Responsible Lending', duration: '20 mins', isComplete: true, type: 'video' },
    { id: 'm2', title: '2. Client Protection & Financial Literacy', duration: '35 mins', isComplete: false, type: 'reading' },
    { id: 'm3', title: '3. Field Collection & Digital Receipt Audits', duration: '40 mins', isComplete: false, type: 'video' },
    { id: 'm4', title: '4. Practical Group Discussion Workshop', duration: '3 hours', isComplete: false, type: 'class' }
  ]);

  activeModule = signal<CourseModuleItem>(this.modules()[1]);

  courseProgressPct = signal(40);

  selectModule(mod: CourseModuleItem) {
    this.activeModule.set(mod);
  }

  isSessionAttended(sessionId: string): boolean {
    return this.traineeService.sessionAttendance()[sessionId] === 'Attended';
  }

  toggleAttendance(sessionId: string) {
    this.traineeService.toggleSessionAttendanceState(sessionId);
  }

  completeCurrentLesson() {
    this.modules.update(list => list.map(m => m.id === this.activeModule().id ? { ...m, isComplete: true } : m));
    const completedCount = this.modules().filter(m => m.isComplete).length;
    const pct = Math.round((completedCount / this.modules().length) * 100);
    this.courseProgressPct.set(pct);
  }

  finishCourse() {
    this.modules.update(list => list.map(m => ({ ...m, isComplete: true })));
    this.courseProgressPct.set(100);
    this.traineeService.updateContentConsumption(this.component().id, 100, true);
    this.completed.emit();
    this.close.emit();
  }
}
