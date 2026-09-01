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

export interface RatingFilters {
  levels: string[];
  dimensions: string[];
}

export const DEFAULT_RATING_FILTERS: RatingFilters = {
  levels: [],
  dimensions: []
};

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
      <!-- 2. SEARCH & INTEGRATED FILTER TOOLBAR (Unified SaaS Design)               -->
      <!-- ========================================================================= -->
      <div class="space-y-3 relative z-30">
        
        <!-- Search Toolbar Card matching Unified SaaS Style (Image 2) -->
        <div class="bg-white dark:bg-base-100 rounded-3xl border border-slate-200/80 dark:border-base-300 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <!-- Left: Search Field + Filters Button + Reset -->
          <div class="flex items-center gap-3 flex-1 max-w-2xl">
            
            <!-- Search Field -->
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg pointer-events-none">search</span>
              <input 
                type="text" 
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search reviews by comments, trainee name, courses..." 
                class="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-base-200/50 border border-slate-200/80 dark:border-base-300 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-base-300 transition-all shadow-2xs" />

              @if (searchQuery()) {
                <button 
                  type="button"
                  (click)="onSearchChange('')"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-md cursor-pointer border-0 bg-transparent"
                  title="Clear search">
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              }
            </div>
            
            <!-- Filter Button beside Search -->
            <button 
              type="button"
              (click)="toggleFilterPanel()"
              class="px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
              [class]="isFilterPanelOpen()
                ? 'bg-tenant-500 text-white border-tenant-500'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-base-300 dark:bg-base-200/70'"
              title="Filters">
              <span class="material-symbols-outlined text-base" [class.text-white]="isFilterPanelOpen()">filter_list</span>
              <span>Filters</span>
            </button>

            <!-- Reset Button beside Filters -->
            @if (hasActiveFilters() || searchQuery()) {
              <button 
                type="button"
                (click)="resetAllFilters()"
                class="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap animate-in fade-in"
                title="Reset Filters">
                <span class="material-symbols-outlined text-sm">restart_alt</span>
                <span>Reset</span>
              </button>
            }

          </div>

          <!-- Right: Submit Rating Button -->
          <div class="flex items-center gap-3 shrink-0">
            <button 
              type="button" 
              (click)="openRatingModal()"
              class="px-4 py-2.5 rounded-2xl bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs border-0">
              <span class="material-symbols-outlined text-base">rate_review</span>
              <span>Submit Rating</span>
            </button>
          </div>

        </div>

        <!-- Collapsible Filter Drawer Card matching Image 2 -->
        @if (isFilterPanelOpen()) {
          <div class="bg-white dark:bg-base-100 rounded-2xl border border-slate-200/80 dark:border-base-300 p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
            
            <!-- Header -->
            <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-base-300">
              <h3 class="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-tenant-500 text-base">tune</span>
                FILTER RATINGS & TELEMETRY
              </h3>
              <span class="text-[11px] text-text-secondary font-medium">
                Combine criteria with AND &bull; Multiple values in same category with OR
              </span>
            </div>

            <!-- Filter Body Grid: Clean 2-column layout with balanced spacing -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-1">
              
              <!-- 1. Scope Level -->
              <div class="space-y-2.5">
                <label class="text-xs font-bold text-text-primary block">
                  1. Scope Level
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  @for (lvl of scopeLevelOptions; track lvl.value) {
                    <label class="flex items-center gap-2 text-xs text-text-primary cursor-pointer group select-none p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-base-200 transition-colors">
                      <input 
                        type="checkbox" 
                        [checked]="draftFilters().levels.includes(lvl.value)"
                        (change)="toggleLevelDraft(lvl.value)"
                        class="rounded border-slate-300 dark:border-base-300 text-tenant-500 focus:ring-tenant-500 w-4 h-4 cursor-pointer" />
                      <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 shadow-2xs truncate" [class]="lvl.badgeClass">
                        <span class="w-1.5 h-1.5 rounded-full shrink-0" [class]="lvl.dotClass"></span>
                        <span class="truncate">{{ lvl.label }}</span>
                      </span>
                    </label>
                  }
                </div>
              </div>

              <!-- 2. Dimension Category -->
              <div class="space-y-2.5">
                <label class="text-xs font-bold text-text-primary block">
                  2. Dimension Category
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  @for (dim of dimensionFilterOptions; track dim.value) {
                    <label class="flex items-center gap-2 text-xs text-text-primary cursor-pointer group select-none p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-base-200 transition-colors">
                      <input 
                        type="checkbox" 
                        [checked]="draftFilters().dimensions.includes(dim.value)"
                        (change)="toggleDimensionDraft(dim.value)"
                        class="rounded border-slate-300 dark:border-base-300 text-tenant-500 focus:ring-tenant-500 w-4 h-4 cursor-pointer" />
                      <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 shadow-2xs truncate" [class]="dim.badgeClass">
                        <span class="w-1.5 h-1.5 rounded-full shrink-0" [class]="dim.dotClass"></span>
                        <span class="truncate">{{ dim.label }}</span>
                      </span>
                    </label>
                  }
                </div>
              </div>

            </div>

            <!-- Footer Actions -->
            <div class="pt-3 border-t border-slate-100 dark:border-base-300 flex items-center justify-between">
              <button 
                type="button" 
                (click)="clearFilterPanelDraft()"
                class="px-3.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-base-200 text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors cursor-pointer border-0 bg-transparent">
                Clear All Selections
              </button>

              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  (click)="closeFilterPanel()"
                  class="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-base-200 hover:bg-slate-200 dark:hover:bg-base-300 text-text-primary text-xs font-semibold transition-colors cursor-pointer border-0">
                  Cancel
                </button>
                <button 
                  type="button" 
                  (click)="applyFilterPanel()"
                  class="px-4 py-1.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer border-0">
                  Apply Filter
                </button>
              </div>
            </div>

          </div>
        }

        <!-- Active Filter Badge Chips Row -->
        @if (hasActiveFilters() || searchQuery()) {
          <div class="flex items-center flex-wrap gap-2 pt-1 animate-in fade-in">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Filters:</span>
            
            @if (searchQuery()) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-base-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-base-300 text-xs rounded-xl font-medium">
                <span>Query: "{{ searchQuery() }}"</span>
                <button type="button" (click)="onSearchChange('')" class="hover:text-rose-500 font-bold ml-1 cursor-pointer border-0 bg-transparent">✕</button>
              </span>
            }

            @for (lvl of appliedFilters().levels; track lvl) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-base-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-base-300 text-xs rounded-xl font-medium">
                <span>Scope: {{ getLevelLabel(lvl) }}</span>
                <button type="button" (click)="removeLevelFilter(lvl)" class="hover:text-rose-500 font-bold ml-1 cursor-pointer border-0 bg-transparent">✕</button>
              </span>
            }

            @for (dim of appliedFilters().dimensions; track dim) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-base-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-base-300 text-xs rounded-xl font-medium">
                <span>Dimension: {{ getDimensionLabel(dim) }}</span>
                <button type="button" (click)="removeDimensionFilter(dim)" class="hover:text-rose-500 font-bold ml-1 cursor-pointer border-0 bg-transparent">✕</button>
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
          <div class="p-5 sm:p-6 rounded-3xl bg-white dark:bg-base-100 border border-slate-200/80 dark:border-base-300 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-base-400 transition-all duration-200 flex flex-col justify-between relative group">
            
            <div>
              <!-- Header Block: Reviewer info & Star score -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <app-custom-avatar [name]="item.userName" [url]="item.userAvatar" size="sm" shape="squircle"></app-custom-avatar>
                  <div class="min-w-0">
                    <h4 class="text-xs font-bold text-text-primary truncate">{{ item.userName }}</h4>
                    <p class="text-[11px] text-text-secondary font-mono mt-0.5">{{ item.submittedAt }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl text-amber-700 dark:text-amber-400 font-bold text-xs font-mono shrink-0">
                  <span class="material-symbols-outlined text-[13px] leading-none text-amber-500">star</span>
                  <span>{{ item.value }}.0 / 5</span>
                </div>
              </div>

              <!-- Scope & Dimension Badges Row -->
              <div class="flex items-center flex-wrap gap-2 mt-3.5">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-base-200 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-base-300 uppercase tracking-wider">
                  {{ item.level }} Scope
                </span>
                
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-300 border border-tenant-500/20 uppercase tracking-wider">
                  {{ getDimensionLabel(item.dimension) }}
                </span>
                
                @if (item.phaseName) {
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-slate-50 dark:bg-base-200/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-base-300 flex items-center gap-1 truncate max-w-[220px]" [title]="item.phaseName">
                    <span class="material-symbols-outlined text-[11px] leading-none text-slate-400">folder_open</span>
                    {{ item.phaseName }}
                  </span>
                }
                
                @if (item.courseTitle) {
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-slate-50 dark:bg-base-200/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-base-300 flex items-center gap-1 truncate max-w-[220px]" [title]="item.courseTitle">
                    <span class="material-symbols-outlined text-[11px] leading-none text-slate-400">menu_book</span>
                    {{ item.courseTitle }}
                  </span>
                }
              </div>

              <!-- Comment Body with custom spacing -->
              <div class="mt-3.5 p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-base-200/40 border border-slate-200/70 dark:border-base-300/60 text-xs text-slate-700 dark:text-slate-200 leading-relaxed flex items-start gap-2.5">
                <span class="material-symbols-outlined text-base text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 select-none">format_quote</span>
                <p class="italic text-xs text-slate-700 dark:text-slate-200 leading-relaxed flex-1">
                  {{ item.comment || 'No written feedback was submitted for this rating index.' }}
                </p>
              </div>
            </div>

            <!-- Card Footer verification stamp -->
            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-base-200 flex items-center justify-between text-xs text-text-secondary">
              <span class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                <span class="material-symbols-outlined text-sm leading-none">verified</span>
                Verified Trainee Reputational Index
              </span>
              <span class="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">#{{ item.id }}</span>
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

  readonly scopeLevelOptions = [
    { 
      value: 'plan', 
      label: 'Plan Level', 
      dotClass: 'bg-emerald-500', 
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40' 
    },
    { 
      value: 'phase', 
      label: 'Phase Level', 
      dotClass: 'bg-amber-500', 
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40' 
    },
    { 
      value: 'course', 
      label: 'Course Level', 
      dotClass: 'bg-indigo-500', 
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/40' 
    }
  ];

  readonly dimensionFilterOptions = [
    { 
      value: 'overall', 
      label: 'Overall Curriculum', 
      dotClass: 'bg-amber-500', 
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40' 
    },
    { 
      value: 'content', 
      label: 'Content Quality', 
      dotClass: 'bg-indigo-500', 
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/40' 
    },
    { 
      value: 'instructor', 
      label: 'Instructor Support', 
      dotClass: 'bg-emerald-500', 
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40' 
    }
  ];

  evaluationDimensionOptions = [
    { value: 'overall', label: 'Overall Curriculum Quality & Pacing' },
    { value: 'content', label: 'Content Clarity, Rigor & Field Utility' },
    { value: 'instructor', label: 'Instructor Responsiveness & Pedagogical Support' }
  ];

  planId = input.required<string>();

  searchQuery = signal<string>('');
  showRatingModal = signal<boolean>(false);
  isFilterPanelOpen = signal<boolean>(false);

  appliedFilters = signal<RatingFilters>({ ...DEFAULT_RATING_FILTERS });
  draftFilters = signal<RatingFilters>({ ...DEFAULT_RATING_FILTERS });

  planRatings = computed<RatingSubmission[]>(() => {
    return this.lmsData.getRatingsForPlan(this.planId());
  });

  currentSummary = computed<RatingSummary>(() => {
    return this.lmsData.getRatingSummary(this.planId());
  });

  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return f.levels.length > 0 || f.dimensions.length > 0;
  });

  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    return f.levels.length + f.dimensions.length;
  });

  filteredRatings = computed<RatingSubmission[]>(() => {
    let list = this.planRatings();
    const filters = this.appliedFilters();

    // 1. Levels filter
    if (filters.levels.length > 0) {
      list = list.filter(r => filters.levels.includes(r.level));
    }

    // 2. Dimensions filter
    if (filters.dimensions.length > 0) {
      list = list.filter(r => filters.dimensions.includes(r.dimension));
    }

    // 3. Search query
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

  onSearchChange(val: string) {
    this.searchQuery.set(val);
  }

  toggleFilterPanel() {
    if (!this.isFilterPanelOpen()) {
      this.draftFilters.set(JSON.parse(JSON.stringify(this.appliedFilters())));
    }
    this.isFilterPanelOpen.update(v => !v);
  }

  closeFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  toggleLevelDraft(lvl: string) {
    this.draftFilters.update(f => {
      const exists = f.levels.includes(lvl);
      const next = exists ? f.levels.filter(l => l !== lvl) : [...f.levels, lvl];
      return { ...f, levels: next };
    });
  }

  toggleDimensionDraft(dim: string) {
    this.draftFilters.update(f => {
      const exists = f.dimensions.includes(dim);
      const next = exists ? f.dimensions.filter(d => d !== dim) : [...f.dimensions, dim];
      return { ...f, dimensions: next };
    });
  }

  applyFilterPanel() {
    this.appliedFilters.set(JSON.parse(JSON.stringify(this.draftFilters())));
    this.isFilterPanelOpen.set(false);
  }

  clearFilterPanelDraft() {
    this.draftFilters.set({
      levels: [],
      dimensions: []
    });
  }

  resetAllFilters() {
    this.appliedFilters.set({
      levels: [],
      dimensions: []
    });
    this.draftFilters.set({
      levels: [],
      dimensions: []
    });
    this.searchQuery.set('');
  }

  removeLevelFilter(lvl: string) {
    this.appliedFilters.update(f => ({
      ...f,
      levels: f.levels.filter(l => l !== lvl)
    }));
    this.draftFilters.set(JSON.parse(JSON.stringify(this.appliedFilters())));
  }

  removeDimensionFilter(dim: string) {
    this.appliedFilters.update(f => ({
      ...f,
      dimensions: f.dimensions.filter(d => d !== dim)
    }));
    this.draftFilters.set(JSON.parse(JSON.stringify(this.appliedFilters())));
  }

  getLevelLabel(val: string): string {
    if (val === 'plan') return 'Plan Level';
    if (val === 'phase') return 'Phase Level';
    if (val === 'course') return 'Course Level';
    return val;
  }

  getDimensionLabel(val: string): string {
    if (val === 'overall') return 'Overall Quality';
    if (val === 'content') return 'Content Clarity';
    if (val === 'instructor') return 'Instructor Support';
    return val;
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
