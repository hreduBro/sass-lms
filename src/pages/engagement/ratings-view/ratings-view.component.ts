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
import { CustomSelectComponent } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-ratings-view',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CustomAvatarComponent, CustomSelectComponent],
  template: `
    <div class="space-y-6">
      
      <!-- ========================================================================= -->
      <!-- 1. BENTO-STYLE ANALYTICAL OVERVIEW DASHBOARD                             -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- Column A: Core Average Score (Span 4) -->
        <div class="lg:col-span-4 p-6 rounded-3xl bg-base-100 border border-base-300 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
          
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-tenant-50 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300 border border-tenant-500/20 uppercase tracking-wider">
                Telemetry Engine
              </span>
              <span class="text-[11px] text-text-secondary font-medium">• Gated by Policy</span>
            </div>
            
            <h3 class="text-base font-extrabold text-text-primary mt-3">Trainee Satisfaction</h3>
            <p class="text-xs text-text-secondary mt-1 leading-relaxed">
              Real-time multi-dimensional course quality and instructor feedback scorecards.
            </p>
          </div>
          
          <div class="flex items-center gap-5 mt-6 pt-5 border-t border-base-200">
            <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center shrink-0">
              <span class="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 leading-none">
                {{ currentSummary().averageValue || '0.0' }}
              </span>
              <span class="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1">/ 5.0</span>
            </div>
            
            <div class="flex-1">
              <div class="flex items-center gap-0.5 text-amber-500">
                @for (star of [1,2,3,4,5]; track star) {
                  <span class="material-symbols-outlined text-base">
                    {{ star <= Math.round(currentSummary().averageValue) ? 'star' : 'star_outline' }}
                  </span>
                }
              </div>
              <p class="text-xs text-text-primary font-semibold mt-1">
                {{ currentSummary().totalCount }} Verified Reviews
              </p>
              <p class="text-[10px] text-text-secondary">From current active batches</p>
            </div>
          </div>
        </div>
        
        <!-- Column B: Multi-Dimensional Metrics Breakdown (Span 4) -->
        <div class="lg:col-span-4 p-6 rounded-3xl bg-base-100 border border-base-300 shadow-sm flex flex-col justify-between">
          <div>
            <h4 class="text-xs font-bold text-text-primary uppercase tracking-wider text-text-secondary mb-4">Dimension Performance</h4>
            
            <div class="space-y-4">
              <!-- Overall -->
              <div>
                <div class="flex items-center justify-between text-xs font-semibold mb-1">
                  <span class="flex items-center gap-1.5 text-text-primary">
                    <span class="material-symbols-outlined text-amber-500 text-sm">star</span>
                    Overall Curriculum
                  </span>
                  <span class="font-mono text-text-primary">{{ currentSummary().dimensionAverages.overall }}/5</span>
                </div>
                <div class="w-full h-1.5 bg-base-200 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full transition-all duration-500" [style.width.%]="currentSummary().dimensionAverages.overall * 20"></div>
                </div>
              </div>
              
              <!-- Content Clarity -->
              <div>
                <div class="flex items-center justify-between text-xs font-semibold mb-1">
                  <span class="flex items-center gap-1.5 text-text-primary">
                    <span class="material-symbols-outlined text-indigo-500 text-sm">menu_book</span>
                    Content Quality
                  </span>
                  <span class="font-mono text-text-primary">{{ currentSummary().dimensionAverages.content }}/5</span>
                </div>
                <div class="w-full h-1.5 bg-base-200 rounded-full overflow-hidden">
                  <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" [style.width.%]="currentSummary().dimensionAverages.content * 20"></div>
                </div>
              </div>
              
              <!-- Instructor support -->
              <div>
                <div class="flex items-center justify-between text-xs font-semibold mb-1">
                  <span class="flex items-center gap-1.5 text-text-primary">
                    <span class="material-symbols-outlined text-emerald-500 text-sm">record_voice_over</span>
                    Instructor Support
                  </span>
                  <span class="font-mono text-text-primary">{{ currentSummary().dimensionAverages.instructor }}/5</span>
                </div>
                <div class="w-full h-1.5 bg-base-200 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" [style.width.%]="currentSummary().dimensionAverages.instructor * 20"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="text-[10px] text-text-secondary mt-3">
            Averages based on specific dimension selections in sub-reviews.
          </div>
        </div>
        
        <!-- Column C: Rating Star Distribution Chart (Span 4) -->
        <div class="lg:col-span-4 p-6 rounded-3xl bg-base-100 border border-base-300 shadow-sm flex flex-col justify-between">
          <div>
            <h4 class="text-xs font-bold text-text-primary uppercase tracking-wider text-text-secondary mb-3">Rating Distribution</h4>
            
            <div class="space-y-1.5">
              @for (star of [5, 4, 3, 2, 1]; track star) {
                <div class="flex items-center gap-3 text-xs">
                  <span class="w-3 font-mono text-text-secondary text-right">{{ star }}</span>
                  <span class="material-symbols-outlined text-amber-500 text-xs shrink-0">star</span>
                  <div class="flex-1 h-2 bg-base-200 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-500 rounded-full transition-all duration-500" [style.width.%]="getStarPercentage(star)"></div>
                  </div>
                  <span class="w-8 text-right font-mono text-text-secondary text-[10px]">{{ getStarCount(star) }} reviews</span>
                </div>
              }
            </div>
          </div>
          
          <div class="flex items-center justify-between text-[11px] text-text-secondary mt-3 pt-2 border-t border-base-200">
            <span>Aggregated distribution</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">verified</span>
              100% Organic Reputations
            </span>
          </div>
        </div>
        
      </div>

      <!-- ========================================================================= -->
      <!-- 2. SEARCH & INTEGRATED FILTER TOOLBAR (Matches All Organizations Pattern) -->
      <!-- ========================================================================= -->
      <div class="space-y-4 relative z-30">
        
        <!-- Search Card matching Screenshot 1 exactly -->
        <div class="p-6 bg-white dark:bg-base-100 rounded-[24px] border border-[#E4E9F2] dark:border-base-300 flex items-center justify-between gap-3 shadow-sm">
          
          <!-- Left: Search Field with Pill shape and Search Icon -->
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-4.5 top-1/2 -translate-y-1/2 text-[#8F9BB3] text-lg pointer-events-none">search</span>
            <input 
              type="text" 
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search reviews by comments, trainee name, courses..." 
              class="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-base-200/50 border border-[#E4E9F2] dark:border-base-300 text-sm text-[#222B45] dark:text-slate-200 placeholder-[#8F9BB3] focus:outline-none focus:ring-2 focus:ring-[#EC008C]/15 focus:border-[#EC008C] transition-all" />

            @if (searchQuery()) {
              <button 
                type="button"
                (click)="searchQuery.set('')"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md cursor-pointer flex items-center justify-center border-0 bg-transparent">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            }
          </div>
          
          <!-- Right: Trigger Buttons (Filters & Submit Rating) in Pink Pill Style -->
          <div class="flex items-center gap-3 shrink-0">
            <!-- Filters button -->
            <button 
              type="button"
              (click)="showFilterDrawer.set(!showFilterDrawer())"
              class="px-6 py-3 rounded-2xl bg-[#EC008C] hover:bg-[#D0007A] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs border-0">
              <span class="material-symbols-outlined text-base">filter_list</span>
              <span>Filters</span>
              @if (activeFilterCount() > 0) {
                <span class="w-4.5 h-4.5 rounded-full bg-white text-[#EC008C] text-[10px] font-extrabold flex items-center justify-center">
                  {{ activeFilterCount() }}
                </span>
              }
            </button>

            <!-- Submit Rating button -->
            <button 
              type="button" 
              (click)="openRatingModal()"
              class="px-6 py-3 rounded-2xl bg-[#EC008C] hover:bg-[#D0007A] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs border-0">
              <span class="material-symbols-outlined text-base">rate_review</span>
              <span>Submit Rating</span>
            </button>
          </div>

        </div>

        <!-- Collapsible Filter Drawer matching Screenshot 2 exactly -->
        @if (showFilterDrawer()) {
          <div class="p-6.5 bg-white dark:bg-base-100 border border-[#E4E9F2] dark:border-base-300 rounded-[24px] shadow-md space-y-6 animate-in fade-in duration-200">
            
            <!-- Header matching the screenshot exactly -->
            <div class="flex items-center justify-between pb-3.5 border-b border-[#E4E9F2] dark:border-base-200">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-[#EC008C]">tune</span>
                <h3 class="text-xs font-extrabold text-[#222B45] dark:text-text-primary uppercase tracking-wider">FILTER RATINGS & TELEMETRY</h3>
              </div>
              <span class="text-[11px] text-[#8F9BB3] font-medium">
                Refine by evaluating scope level and category dimensions
              </span>
            </div>

            <!-- Two dropdown column selectors -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <!-- Level Selection -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold uppercase tracking-wider text-[#8F9BB3] block">SCOPE LEVEL</label>
                <app-custom-select
                  [options]="levelOptions()"
                  [clearable]="false"
                  [searchable]="false"
                  placeholder="All Levels"
                  [ngModel]="selectedLevel()"
                  (ngModelChange)="selectedLevel.set($event)">
                </app-custom-select>
              </div>

              <!-- Dimension Selection -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold uppercase tracking-wider text-[#8F9BB3] block">DIMENSION CATEGORY</label>
                <app-custom-select
                  [options]="dimensionOptions"
                  [clearable]="false"
                  [searchable]="false"
                  placeholder="All Dimensions"
                  [ngModel]="selectedDimensionFilter()"
                  (ngModelChange)="selectedDimensionFilter.set($event)">
                </app-custom-select>
              </div>
            </div>

            <!-- Footer matching Screenshot 2 exactly with Clear All Selections and Cancel/Apply Filter buttons -->
            <div class="pt-5 border-t border-[#E4E9F2] dark:border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <!-- Clear All Selections on Left -->
              <button 
                type="button"
                (click)="resetAllFilters()"
                class="text-xs text-[#5B6B8A] hover:text-[#EC008C] font-bold transition-colors cursor-pointer border-0 bg-transparent"
              >
                Clear All Selections
              </button>

              <!-- Cancel and Apply Filter on Right -->
              <div class="flex items-center gap-3">
                <button 
                  type="button" 
                  (click)="showFilterDrawer.set(false)" 
                  class="px-6 py-2.5 bg-[#F7F9FC] hover:bg-[#EDF1F7] dark:bg-base-200 dark:hover:bg-base-300 rounded-full text-xs font-bold text-[#222B45] dark:text-slate-300 transition-all cursor-pointer border border-[#E4E9F2] dark:border-base-300"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  (click)="showFilterDrawer.set(false)" 
                  class="px-6 py-2.5 bg-[#EC008C] hover:bg-[#D0007A] active:scale-95 text-white text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer border-0"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Active Filter Badge Chips Row -->
        @if (activeFilterCount() > 0 || searchQuery()) {
          <div class="flex items-center flex-wrap gap-2 pt-1 animate-in fade-in">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Filters:</span>
            
            @if (searchQuery()) {
              <span class="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-base-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-base-300 text-xs rounded-xl font-medium">
                <span>Query: "{{ searchQuery() }}"</span>
                <button type="button" (click)="searchQuery.set('')" class="hover:text-rose-500 font-bold ml-1 cursor-pointer">✕</button>
              </span>
            }

            @if (selectedLevel() !== 'all') {
              <span class="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-base-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-base-300 text-xs rounded-xl font-medium">
                <span>Scope: {{ getLevelLabel(selectedLevel()) }}</span>
                <button type="button" (click)="selectedLevel.set('all')" class="hover:text-rose-500 font-bold ml-1 cursor-pointer">✕</button>
              </span>
            }

            @if (selectedDimensionFilter() !== 'all') {
              <span class="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-base-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-base-300 text-xs rounded-xl font-medium">
                <span>Dimension: {{ getDimensionLabel(selectedDimensionFilter()) }}</span>
                <button type="button" (click)="selectedDimensionFilter.set('all')" class="hover:text-rose-500 font-bold ml-1 cursor-pointer">✕</button>
              </span>
            }
          </div>
        }

      </div>

      <!-- ========================================================================= -->
      <!-- 3. PREMIUM GRID OF RATING CARDS                                          -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        @for (item of filteredRatings(); track item.id) {
          <div class="p-5.5 rounded-3xl bg-base-100 border border-base-300 shadow-sm hover:border-base-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group">
            
            <div>
              <!-- Header Block: Reviewer info & Star score -->
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-3">
                  <app-custom-avatar [name]="item.userName" [url]="item.userAvatar" size="sm" shape="squircle"></app-custom-avatar>
                  <div>
                    <h4 class="text-xs font-extrabold text-text-primary">{{ item.userName }}</h4>
                    <p class="text-[10px] text-text-secondary font-semibold font-mono">{{ item.submittedAt }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl text-amber-700 dark:text-amber-400 font-extrabold text-xs font-mono shrink-0">
                  <span class="material-symbols-outlined text-[13px] leading-none text-amber-500">star</span>
                  <span>{{ item.value }}.0 / 5</span>
                </div>
              </div>

              <!-- Scope & Dimension Badges Row -->
              <div class="flex items-center flex-wrap gap-1.5 mt-4">
                <span class="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-base-200 text-text-secondary uppercase tracking-wider">
                  {{ item.level }} Scope
                </span>
                
                <span class="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-300 border border-tenant-500/15 uppercase tracking-wider">
                  {{ getDimensionLabel(item.dimension) }}
                </span>
                
                @if (item.phaseName) {
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-50 dark:bg-base-200 text-text-secondary border border-base-300 flex items-center gap-1 truncate max-w-[180px]" [title]="item.phaseName">
                    <span class="material-symbols-outlined text-[10px] leading-none text-slate-400">folder_open</span>
                    {{ item.phaseName }}
                  </span>
                }
                
                @if (item.courseTitle) {
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-50 dark:bg-base-200 text-text-secondary border border-base-300 flex items-center gap-1 truncate max-w-[180px]" [title]="item.courseTitle">
                    <span class="material-symbols-outlined text-[10px] leading-none text-slate-400">menu_book</span>
                    {{ item.courseTitle }}
                  </span>
                }
              </div>

              <!-- Comment Body with custom spacing -->
              <div class="mt-4 text-xs text-text-primary leading-relaxed bg-slate-50/50 dark:bg-base-200/20 p-3 rounded-2xl border border-base-300/40">
                <span class="text-slate-300 dark:text-slate-600 font-serif text-lg leading-none float-left mr-1">“</span>
                <p class="italic text-text-primary">
                  {{ item.comment || 'No written feedback was submitted for this rating index.' }}
                </p>
              </div>
            </div>

            <!-- Card Footer verification stamp -->
            <div class="mt-5 pt-3.5 border-t border-base-300 flex items-center justify-between text-[11px] text-text-secondary">
              <span class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span class="material-symbols-outlined text-xs leading-none">verified</span>
                Verified Trainee Reputational Index
              </span>
              <span class="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">#{{ item.id }}</span>
            </div>

          </div>
        } @empty {
          <!-- Empty State Matching BRAC Brand Style -->
          <div class="col-span-full p-12 text-center rounded-3xl bg-base-100 border border-base-300 shadow-xs animate-in fade-in">
            <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-base-200 flex items-center justify-center mx-auto text-slate-400">
              <span class="material-symbols-outlined text-3xl">reviews</span>
            </div>
            <h4 class="text-sm font-extrabold text-text-primary mt-4">No ratings matched your filters</h4>
            <p class="text-xs text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
              We couldn't find any reviews matching your current query or category selections. Try resetting your search or filter drawer criteria.
            </p>
            <button 
              type="button" 
              (click)="resetAllFilters()"
              class="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-base-200 dark:hover:bg-base-300 border border-base-300 text-xs font-bold text-text-primary transition-colors cursor-pointer">
              Clear All Filters
            </button>
          </div>
        }
      </div>

      <!-- ========================================================================= -->
      <!-- 4. RATING SUBMISSION MODAL                                               -->
      <!-- ========================================================================= -->
      @if (showRatingModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div class="w-full max-w-lg rounded-3xl bg-base-100 border border-base-300 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div class="p-5 border-b border-base-300 flex items-center justify-between bg-base-200">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">star</span>
                </div>
                <div>
                  <h3 class="text-sm font-extrabold text-text-primary">Submit Experience Rating</h3>
                  <p class="text-[11px] text-text-secondary font-medium">Contribute to multi-dimensional course performance indexes</p>
                </div>
              </div>
              <button 
                type="button" 
                (click)="showRatingModal.set(false)"
                class="w-8 h-8 rounded-xl hover:bg-base-300 flex items-center justify-center text-text-secondary transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form [formGroup]="ratingForm" (ngSubmit)="saveRating()" class="p-6 space-y-4 text-xs">
              
              <!-- Scope Selection Buttons -->
              <div>
                <label class="font-extrabold text-text-primary block mb-1.5 uppercase tracking-wider text-[10px] text-text-secondary">Evaluation Scope</label>
                <div class="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    (click)="setScope('plan')"
                    [class.border-tenant-600]="ratingForm.get('level')?.value === 'plan'"
                    [class.bg-tenant-50]="ratingForm.get('level')?.value === 'plan'"
                    [class.dark:bg-tenant-950/30]="ratingForm.get('level')?.value === 'plan'"
                    class="p-2.5 rounded-xl border border-base-300 text-center font-bold text-text-primary cursor-pointer transition-all">
                    Plan Level
                  </button>
                  <button 
                    type="button"
                    (click)="setScope('phase')"
                    [class.border-tenant-600]="ratingForm.get('level')?.value === 'phase'"
                    [class.bg-tenant-50]="ratingForm.get('level')?.value === 'phase'"
                    [class.dark:bg-tenant-950/30]="ratingForm.get('level')?.value === 'phase'"
                    class="p-2.5 rounded-xl border border-base-300 text-center font-bold text-text-primary cursor-pointer transition-all">
                    Phase Level
                  </button>
                  <button 
                    type="button"
                    (click)="setScope('course')"
                    [class.border-tenant-600]="ratingForm.get('level')?.value === 'course'"
                    [class.bg-tenant-50]="ratingForm.get('level')?.value === 'course'"
                    [class.dark:bg-tenant-950/30]="ratingForm.get('level')?.value === 'course'"
                    class="p-2.5 rounded-xl border border-base-300 text-center font-bold text-text-primary cursor-pointer transition-all">
                    Course Level
                  </button>
                </div>
              </div>

              <!-- Dimension Dropdown Selector -->
              <div>
                <label class="font-extrabold text-text-primary block mb-1.5 uppercase tracking-wider text-[10px] text-text-secondary">Evaluation Dimension</label>
                <app-custom-select
                  [options]="evaluationDimensionOptions"
                  [clearable]="false"
                  [searchable]="false"
                  formControlName="dimension">
                </app-custom-select>
              </div>

              <!-- Interactive Star Rating selector -->
              <div class="text-center py-4 bg-base-200 rounded-2xl border border-base-300">
                <span class="text-[10px] font-extrabold text-text-secondary block mb-2 uppercase tracking-wider">Reputation Index Score</span>
                <div class="flex items-center justify-center gap-2.5">
                  @for (s of [1,2,3,4,5]; track s) {
                    <button 
                      type="button" 
                      (click)="ratingForm.get('value')?.setValue(s)"
                      class="text-3xl text-amber-500 hover:scale-115 active:scale-95 transition-transform cursor-pointer">
                      <span class="material-symbols-outlined text-3xl">
                        {{ s <= (ratingForm.get('value')?.value || 0) ? 'star' : 'star_outline' }}
                      </span>
                    </button>
                  }
                </div>
                <span class="text-xs font-black text-text-primary mt-2 block">{{ ratingForm.get('value')?.value }} of 5.0 Stars</span>
              </div>

              <!-- Qualitative Feedbacks -->
              <div>
                <label class="font-extrabold text-text-primary block mb-1.5 uppercase tracking-wider text-[10px] text-text-secondary">Observations & Written Feedback</label>
                <textarea 
                  formControlName="comment" 
                  rows="3" 
                  placeholder="Share details on curriculum relevance, pacing, or areas for future course improvements..."
                  class="w-full px-3.5 py-2.5 rounded-2xl bg-base-200 border border-base-300 text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-slate-400 transition-all text-xs">
                </textarea>
              </div>

              <!-- Actions block -->
              <div class="pt-4 border-t border-base-300 flex items-center justify-end gap-2.5">
                <button 
                  type="button" 
                  (click)="showRatingModal.set(false)"
                  class="px-4.5 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary font-bold transition-colors cursor-pointer">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="px-4.5 py-2 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white font-bold shadow-2xs transition-all cursor-pointer">
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

  dimensionOptions = [
    { value: 'all', label: 'All Dimensions' },
    { value: 'overall', label: 'Overall Dimension' },
    { value: 'content', label: 'Content Dimension' },
    { value: 'instructor', label: 'Instructor Dimension' }
  ];

  levelOptions = computed(() => [
    { value: 'all', label: `All Reviews (${this.planRatings().length})` },
    { value: 'plan', label: 'Plan Level' },
    { value: 'phase', label: 'Phase Level' },
    { value: 'course', label: 'Course Level' }
  ]);

  evaluationDimensionOptions = [
    { value: 'overall', label: 'Overall Curriculum Quality & Pacing' },
    { value: 'content', label: 'Content Clarity, Rigor & Field Utility' },
    { value: 'instructor', label: 'Instructor Responsiveness & Pedagogical Support' }
  ];

  planId = input.required<string>();

  selectedLevel = signal<string>('all');
  selectedDimensionFilter = signal<string>('all');
  showRatingModal = signal<boolean>(false);
  showFilterDrawer = signal<boolean>(false);
  searchQuery = signal<string>('');

  planRatings = computed<RatingSubmission[]>(() => {
    return this.lmsData.getRatingsForPlan(this.planId());
  });

  currentSummary = computed<RatingSummary>(() => {
    return this.lmsData.getRatingSummary(this.planId());
  });

  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedLevel() !== 'all') count++;
    if (this.selectedDimensionFilter() !== 'all') count++;
    return count;
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
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(r => 
        r.userName.toLowerCase().includes(query) || 
        (r.comment && r.comment.toLowerCase().includes(query)) ||
        (r.phaseName && r.phaseName.toLowerCase().includes(query)) ||
        (r.courseTitle && r.courseTitle.toLowerCase().includes(query))
      );
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

  getLevelLabel(val: string): string {
    if (val === 'plan') return 'Plan Level';
    if (val === 'phase') return 'Phase Level';
    if (val === 'course') return 'Course Level';
    return 'All Levels';
  }

  getDimensionLabel(val: string): string {
    if (val === 'overall') return 'Overall Quality';
    if (val === 'content') return 'Content Clarity';
    if (val === 'instructor') return 'Instructor Support';
    return 'All Dimensions';
  }

  getStarPercentage(star: number): number {
    const summary = this.currentSummary();
    if (!summary || summary.totalCount === 0) return 0;
    const count = summary.distribution[star] || 0;
    return Math.round((count / summary.totalCount) * 100);
  }

  getStarCount(star: number): number {
    const summary = this.currentSummary();
    return summary?.distribution[star] || 0;
  }

  resetAllFilters() {
    this.selectedLevel.set('all');
    this.selectedDimensionFilter.set('all');
    this.searchQuery.set('');
  }

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
