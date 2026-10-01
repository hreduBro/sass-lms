import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanComponent } from '../../../models/plan.model';
import { TraineePlanService } from '../../../services/trainee-plan.service';

@Component({
  selector: 'app-survey-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/75 backdrop-blur-md z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-modal-card m-auto">

        <!-- Header -->
        <div class="p-4 sm:p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/40">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">rate_review</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                  Feedback Survey
                </span>
                <span class="text-xs text-text-secondary">Confidential Questionnaire</span>
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
        <div class="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          
          <p class="text-text-secondary leading-relaxed">
            Your anonymous evaluation helps our faculty and instructional designers refine curricula, classroom pacing, and branch field exercises.
          </p>

          <!-- Question 1: Likert 1-5 -->
          <div class="space-y-3 p-4 rounded-2xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
            <label class="font-bold text-text-primary block">
              1. The course materials and classroom workshops adequately prepared me for field microfinance operations.
            </label>
            <div class="flex items-center justify-between gap-2 pt-1">
              @for (val of [1, 2, 3, 4, 5]; track val) {
                <button 
                  type="button"
                  (click)="rating1.set(val)"
                  [class.bg-teal-600]="rating1() === val"
                  [class.text-white]="rating1() === val"
                  [class.bg-base-100]="rating1() !== val"
                  [class.border-teal-500]="rating1() === val"
                  class="flex-1 py-2.5 rounded-xl border border-base-300 dark:border-slate-700 font-bold transition-all text-xs cursor-pointer">
                  {{ val }}
                </button>
              }
            </div>
            <div class="flex justify-between text-[10px] text-text-secondary px-1">
              <span>Strongly Disagree</span>
              <span>Neutral</span>
              <span>Strongly Agree</span>
            </div>
          </div>

          <!-- Question 2: Instructor Quality -->
          <div class="space-y-3 p-4 rounded-2xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
            <label class="font-bold text-text-primary block">
              2. How would you rate the instructor's responsiveness and practical field demonstration?
            </label>
            <div class="grid grid-cols-3 gap-2">
              @for (opt of ['Needs Improvement', 'Good', 'Exceptional']; track opt) {
                <button 
                  type="button" 
                  (click)="instructorRating.set(opt)"
                  [class.bg-teal-600]="instructorRating() === opt"
                  [class.text-white]="instructorRating() === opt"
                  [class.bg-base-100]="instructorRating() !== opt"
                  class="py-2.5 px-3 rounded-xl border border-base-300 dark:border-slate-700 font-bold transition-all text-xs cursor-pointer">
                  {{ opt }}
                </button>
              }
            </div>
          </div>

          <!-- Question 3: Qualitative Comment -->
          <div class="space-y-2 p-4 rounded-2xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
            <label class="font-bold text-text-primary block">
              3. Suggestions for future cohorts (Optional):
            </label>
            <textarea 
              rows="3"
              placeholder="Share your thoughts on pacing, case studies, or village organization simulators..."
              class="w-full p-3 rounded-xl border border-base-300 dark:border-slate-700 bg-base-100 dark:bg-base-200 text-text-primary text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"></textarea>
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
            (click)="submitSurvey()"
            class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-base">send</span>
            <span>Submit Survey</span>
          </button>
        </div>

      </div>
    </div>
  `
})
export class SurveyModalComponent {
  component = input.required<PlanComponent>();
  close = output<void>();
  completed = output<void>();

  private traineeService = inject(TraineePlanService);

  rating1 = signal<number>(5);
  instructorRating = signal<string>('Exceptional');

  submitSurvey() {
    this.traineeService.submitSurveyResponse(this.component().id);
    this.completed.emit();
    this.close.emit();
  }
}
