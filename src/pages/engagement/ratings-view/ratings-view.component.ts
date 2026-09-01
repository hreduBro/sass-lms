import { Component, inject, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  RatingSubmission, 
  RatingSummary, 
  RatingLevel, 
  RatingDimension, 
  RatingScale 
} from '../../../models/engagement.model';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';

@Component({
  selector: 'app-ratings-view',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CustomAvatarComponent],
  template: `
    <div class="space-y-6">
      
      <!-- Top Overview Banner -->
      <div class="p-6 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        <!-- Score & Average Stats -->
        <div class="flex items-center gap-6">
          <div class="w-24 h-24 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-amber-600 dark:text-amber-400">
            <span class="text-3xl font-black">{{ currentSummary().averageValue || '0.0' }}</span>
            <div class="flex items-center gap-0.5 text-xs text-amber-500 mt-0.5">
              @for (star of [1,2,3,4,5]; track star) {
                <span class="material-symbols-outlined text-sm">
                  {{ star <= Math.round(currentSummary().averageValue) ? 'star' : 'star_outline' }}
                </span>
              }
            </div>
            <span class="text-[10px] text-text-secondary mt-0.5 font-medium">{{ currentSummary().totalCount }} Reviews</span>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                Plan & Phase Ratings Telemetry
              </span>
              <span class="text-xs text-text-secondary">• Gated by Completion Policy</span>
            </div>
            <h3 class="text-lg font-bold text-text-primary mt-1">Learner Satisfaction & Experience Metrics</h3>
            <p class="text-xs text-text-secondary max-w-xl mt-0.5">
              Continuous multi-dimensional evaluation spanning overall curriculum value, instructional clarity, and pedagogical pacing.
            </p>
          </div>
        </div>

        <!-- Dimension Scores Breakdown & Submit Trigger -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="p-2.5 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300/60 dark:border-slate-800">
              <span class="text-[10px] text-text-secondary font-semibold uppercase block">Overall</span>
              <span class="font-bold text-text-primary text-sm flex items-center justify-center gap-1 mt-0.5">
                <span class="material-symbols-outlined text-amber-500 text-sm">star</span>
                {{ currentSummary().dimensionAverages.overall }}
              </span>
            </div>
            <div class="p-2.5 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300/60 dark:border-slate-800">
              <span class="text-[10px] text-text-secondary font-semibold uppercase block">Content</span>
              <span class="font-bold text-text-primary text-sm flex items-center justify-center gap-1 mt-0.5">
                <span class="material-symbols-outlined text-indigo-500 text-sm">menu_book</span>
                {{ currentSummary().dimensionAverages.content }}
              </span>
            </div>
            <div class="p-2.5 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300/60 dark:border-slate-800">
              <span class="text-[10px] text-text-secondary font-semibold uppercase block">Instructor</span>
              <span class="font-bold text-text-primary text-sm flex items-center justify-center gap-1 mt-0.5">
                <span class="material-symbols-outlined text-emerald-500 text-sm">record_voice_over</span>
                {{ currentSummary().dimensionAverages.instructor }}
              </span>
            </div>
          </div>

          <button 
            type="button" 
            (click)="openRatingModal()"
            class="px-4 py-2.5 rounded-xl btn-gradient text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity cursor-pointer">
            <span class="material-symbols-outlined text-sm">rate_review</span>
            <span>Submit Rating</span>
          </button>
        </div>

      </div>

      <!-- Filter Controls & Level Tabs -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-2 p-1 bg-base-200 dark:bg-base-300/50 rounded-xl border border-base-300 dark:border-slate-800">
          <button 
            type="button"
            (click)="selectedLevel.set('all')"
            [class.bg-base-100]="selectedLevel() === 'all'"
            [class.shadow-xs]="selectedLevel() === 'all'"
            [class.text-text-primary]="selectedLevel() === 'all'"
            [class.text-text-secondary]="selectedLevel() !== 'all'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
            All Reviews ({{ planRatings().length }})
          </button>
          <button 
            type="button"
            (click)="selectedLevel.set('plan')"
            [class.bg-base-100]="selectedLevel() === 'plan'"
            [class.shadow-xs]="selectedLevel() === 'plan'"
            [class.text-text-primary]="selectedLevel() === 'plan'"
            [class.text-text-secondary]="selectedLevel() !== 'plan'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
            Plan Level
          </button>
          <button 
            type="button"
            (click)="selectedLevel.set('phase')"
            [class.bg-base-100]="selectedLevel() === 'phase'"
            [class.shadow-xs]="selectedLevel() === 'phase'"
            [class.text-text-primary]="selectedLevel() === 'phase'"
            [class.text-text-secondary]="selectedLevel() !== 'phase'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
            Phase Level
          </button>
          <button 
            type="button"
            (click)="selectedLevel.set('course')"
            [class.bg-base-100]="selectedLevel() === 'course'"
            [class.shadow-xs]="selectedLevel() === 'course'"
            [class.text-text-primary]="selectedLevel() === 'course'"
            [class.text-text-secondary]="selectedLevel() !== 'course'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
            Course Level
          </button>
        </div>

        <div class="flex items-center gap-3">
          <select 
            [ngModel]="selectedDimensionFilter()" 
            (ngModelChange)="selectedDimensionFilter.set($event)"
            class="px-3 py-1.5 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-xs font-medium text-text-primary focus:outline-none">
            <option value="all">All Dimensions</option>
            <option value="overall">Overall Dimension</option>
            <option value="content">Content Dimension</option>
            <option value="instructor">Instructor Dimension</option>
          </select>
        </div>
      </div>

      <!-- Ratings List Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of filteredRatings(); track item.id) {
          <div class="p-5 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm hover:border-base-400 transition-all flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <app-custom-avatar [name]="item.userName" [url]="item.userAvatar" size="sm" shape="squircle"></app-custom-avatar>
                  <div>
                    <h4 class="text-xs font-bold text-text-primary">{{ item.userName }}</h4>
                    <p class="text-[10px] text-text-secondary">{{ item.submittedAt }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-lg text-amber-700 dark:text-amber-300 font-bold text-xs">
                  <span class="material-symbols-outlined text-xs">star</span>
                  <span>{{ item.value }}/5</span>
                </div>
              </div>

              <!-- Scope and Dimension Badges -->
              <div class="flex items-center flex-wrap gap-1.5 mt-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-base-200 dark:bg-base-300 text-text-secondary uppercase">
                  {{ item.level }} Scope
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-300">
                  {{ item.dimension | uppercase }}
                </span>
                @if (item.phaseName) {
                  <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-text-secondary truncate max-w-[200px]">
                    {{ item.phaseName }}
                  </span>
                }
                @if (item.courseTitle) {
                  <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-text-secondary truncate max-w-[200px]">
                    {{ item.courseTitle }}
                  </span>
                }
              </div>

              <!-- Comment -->
              <p class="text-xs text-text-primary mt-3 leading-relaxed">
                "{{ item.comment || 'No written comment provided.' }}"
              </p>
            </div>

            <div class="mt-4 pt-3 border-t border-base-300/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-text-secondary">
              <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span class="material-symbols-outlined text-xs">verified</span>
                Verified Trainee Completion
              </span>
              <span class="font-mono text-[10px]">#{{ item.id }}</span>
            </div>
          </div>
        } @empty {
          <div class="col-span-full p-12 text-center rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800">
            <span class="material-symbols-outlined text-4xl text-text-secondary/40">reviews</span>
            <p class="text-xs font-bold text-text-primary mt-2">No reviews match the selected filter criteria.</p>
            <p class="text-[11px] text-text-secondary mt-1">Switch level filters or submit a new review using the button above.</p>
          </div>
        }
      </div>

      <!-- Rating Submission Modal -->
      @if (showRatingModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div class="w-full max-w-lg rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-2xl overflow-hidden">
            
            <div class="p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">star</span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-text-primary">Submit Feedback & Rating</h3>
                  <p class="text-[11px] text-text-secondary">Rate your learning experience for this training plan</p>
                </div>
              </div>
              <button 
                type="button" 
                (click)="showRatingModal.set(false)"
                class="w-7 h-7 rounded-lg hover:bg-base-300 flex items-center justify-center text-text-secondary">
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form [formGroup]="ratingForm" (ngSubmit)="saveRating()" class="p-6 space-y-4 text-xs">
              
              <!-- Scope Selection -->
              <div>
                <label class="font-bold text-text-primary block mb-1">Rating Scope</label>
                <div class="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    (click)="setScope('plan')"
                    [class.border-tenant-600]="ratingForm.get('level')?.value === 'plan'"
                    [class.bg-tenant-50]="ratingForm.get('level')?.value === 'plan'"
                    [class.dark:bg-tenant-950/30]="ratingForm.get('level')?.value === 'plan'"
                    class="p-2.5 rounded-xl border border-base-300 dark:border-slate-700 text-center font-semibold text-text-primary">
                    Plan Level
                  </button>
                  <button 
                    type="button"
                    (click)="setScope('phase')"
                    [class.border-tenant-600]="ratingForm.get('level')?.value === 'phase'"
                    [class.bg-tenant-50]="ratingForm.get('level')?.value === 'phase'"
                    [class.dark:bg-tenant-950/30]="ratingForm.get('level')?.value === 'phase'"
                    class="p-2.5 rounded-xl border border-base-300 dark:border-slate-700 text-center font-semibold text-text-primary">
                    Phase Level
                  </button>
                  <button 
                    type="button"
                    (click)="setScope('course')"
                    [class.border-tenant-600]="ratingForm.get('level')?.value === 'course'"
                    [class.bg-tenant-50]="ratingForm.get('level')?.value === 'course'"
                    [class.dark:bg-tenant-950/30]="ratingForm.get('level')?.value === 'course'"
                    class="p-2.5 rounded-xl border border-base-300 dark:border-slate-700 text-center font-semibold text-text-primary">
                    Course Level
                  </button>
                </div>
              </div>

              <!-- Dimension Selection -->
              <div>
                <label class="font-bold text-text-primary block mb-1">Evaluation Dimension</label>
                <select formControlName="dimension" class="w-full px-3 py-2 rounded-xl bg-base-200/70 border border-base-300 dark:border-slate-700 text-text-primary">
                  <option value="overall">Overall Curriculum Quality & Pacing</option>
                  <option value="content">Content Clarity, Rigor & Field Utility</option>
                  <option value="instructor">Instructor Responsiveness & Pedagogical Support</option>
                </select>
              </div>

              <!-- Star Selector -->
              <div class="text-center py-3 bg-base-200/40 rounded-xl border border-base-300/60 dark:border-slate-800">
                <span class="text-[11px] font-semibold text-text-secondary block mb-1.5">Score (1 to 5 Stars)</span>
                <div class="flex items-center justify-center gap-2">
                  @for (s of [1,2,3,4,5]; track s) {
                    <button 
                      type="button" 
                      (click)="ratingForm.get('value')?.setValue(s)"
                      class="text-2xl text-amber-500 hover:scale-110 transition-transform cursor-pointer">
                      <span class="material-symbols-outlined text-3xl">
                        {{ s <= (ratingForm.get('value')?.value || 0) ? 'star' : 'star_outline' }}
                      </span>
                    </button>
                  }
                </div>
                <span class="text-xs font-bold text-text-primary mt-1 block">{{ ratingForm.get('value')?.value }} of 5 Stars</span>
              </div>

              <!-- Comment -->
              <div>
                <label class="font-bold text-text-primary block mb-1">Qualitative Feedback & Observations</label>
                <textarea 
                  formControlName="comment" 
                  rows="3" 
                  placeholder="Share what worked well or what can be improved in future batches..."
                  class="w-full px-3 py-2 rounded-xl bg-base-200/70 border border-base-300 dark:border-slate-700 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-tenant-600">
                </textarea>
              </div>

              <!-- Actions -->
              <div class="pt-3 border-t border-base-300 dark:border-slate-800 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  (click)="showRatingModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary font-semibold">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="px-4 py-2 rounded-xl btn-gradient text-white font-bold shadow-sm cursor-pointer">
                  Submit Review
                </button>
              </div>

            </form>

          </div>
        </div>
      }

    </div>
  `
})
export class RatingsViewComponent {
  readonly Math = Math;
  private fb = inject(FormBuilder);
  private lmsData = inject(LmsDataService);

  planId = input.required<string>();

  selectedLevel = signal<string>('all');
  selectedDimensionFilter = signal<string>('all');
  showRatingModal = signal<boolean>(false);

  planRatings = computed<RatingSubmission[]>(() => {
    return this.lmsData.getRatingsForPlan(this.planId());
  });

  currentSummary = computed<RatingSummary>(() => {
    return this.lmsData.getRatingSummary(this.planId());
  });

  filteredRatings = computed<RatingSubmission[]>(() => {
    let list = this.planRatings();
    const lvl = this.selectedLevel();
    if (lvl !== 'all') {
      list = list.filter(r => r.level === lvl);
    }
    const dim = this.selectedDimensionFilter();
    if (dim !== 'all') {
      list = list.filter(r => r.dimension === dim);
    }
    return list;
  });

  ratingForm = this.fb.group({
    level: ['plan' as RatingLevel, [Validators.required]],
    dimension: ['overall' as RatingDimension, [Validators.required]],
    value: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    scale: ['star5' as RatingScale],
    comment: ['']
  });

  setScope(level: RatingLevel) {
    this.ratingForm.get('level')?.setValue(level);
  }

  openRatingModal() {
    this.ratingForm.patchValue({
      level: 'plan',
      dimension: 'overall',
      value: 5,
      scale: 'star5',
      comment: ''
    });
    this.showRatingModal.set(true);
  }

  saveRating() {
    if (this.ratingForm.invalid) return;

    const user = this.lmsData.activeUser();
    const val = this.ratingForm.value;

    this.lmsData.submitRating({
      planId: this.planId(),
      level: val.level as RatingLevel,
      dimension: val.dimension as RatingDimension,
      value: Number(val.value) || 5,
      scale: 'star5',
      comment: val.comment || '',
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar
    });

    this.showRatingModal.set(false);
  }
}
