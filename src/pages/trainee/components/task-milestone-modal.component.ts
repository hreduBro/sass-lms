import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanComponent } from '../../../models/plan.model';
import { TraineePlanService } from '../../../services/trainee-plan.service';

@Component({
  selector: 'app-task-milestone-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/75 backdrop-blur-md z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-modal-card m-auto">

        <!-- Header -->
        <div class="p-4 sm:p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/40">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">assignment_turned_in</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {{ component().taskType || 'Milestone Task' }}
                </span>
                <span class="text-xs text-text-secondary">Due: {{ component().endDate }}</span>
              </div>
              <h2 class="text-base font-bold text-text-primary mt-0.5">{{ component().name }}</h2>
            </div>
          </div>

          <button 
            type="button" 
            (click)="close.emit()"
            class="w-9 h-9 rounded-full hover:bg-base-300 dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          <div class="p-4 rounded-2xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 space-y-2">
            <span class="text-[10px] uppercase font-bold text-text-secondary">Task Brief & Objective</span>
            <p class="text-text-primary leading-relaxed">
              {{ component().description || 'Execute setup milestones, branch supervisor verification, and portal profile validations.' }}
            </p>
          </div>

          <!-- Checklist -->
          @if (component().checklist && component().checklist!.length > 0) {
            <div class="space-y-3">
              <h4 class="font-bold text-text-primary uppercase tracking-wider text-[10px]">Verification Checklist</h4>
              <div class="space-y-2">
                @for (item of component().checklist; track item.id; let idx = $index) {
                  <label 
                    (click)="toggleChecklist(idx)"
                    class="p-3.5 rounded-xl border border-base-300 dark:border-slate-700 bg-base-100 dark:bg-base-200 flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-all">
                    <input 
                      type="checkbox" 
                      [checked]="checkedItems()[idx]"
                      class="rounded text-amber-600 focus:ring-amber-500" />
                    <span 
                      class="text-xs"
                      [class.line-through]="checkedItems()[idx]"
                      [class.text-text-secondary]="checkedItems()[idx]"
                      [class.text-text-primary]="!checkedItems()[idx]">
                      {{ item.text }}
                    </span>
                  </label>
                }
              </div>
            </div>
          }

          <!-- Completion Notes / Mentor Submission -->
          <div class="space-y-2">
            <label class="font-bold text-text-primary block">Submission Summary & Field Notes</label>
            <textarea 
              rows="3"
              #notesBox
              placeholder="State key outcomes, supervisor sign-off confirmation, or any operational variances..."
              class="w-full p-3 rounded-xl border border-base-300 dark:border-slate-700 bg-base-100 dark:bg-base-200 text-text-primary text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"></textarea>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 sm:p-5 border-t border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/40">
          <button 
            type="button" 
            (click)="close.emit()"
            class="px-4 py-2.5 rounded-xl border border-base-300 dark:border-slate-700 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer">
            Cancel
          </button>

          <button 
            type="button" 
            (click)="submitTask(notesBox.value)"
            class="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-base">check</span>
            <span>Submit Task Milestone</span>
          </button>
        </div>

      </div>
    </div>
  `
})
export class TaskMilestoneModalComponent {
  component = input.required<PlanComponent>();
  close = output<void>();
  completed = output<void>();

  private traineeService = inject(TraineePlanService);

  checkedItems = signal<Record<number, boolean>>({});

  toggleChecklist(idx: number) {
    this.checkedItems.update(map => ({
      ...map,
      [idx]: !map[idx]
    }));
  }

  submitTask(notes: string) {
    this.traineeService.submitTaskMilestone(this.component().id, notes);
    this.completed.emit();
    this.close.emit();
  }
}
