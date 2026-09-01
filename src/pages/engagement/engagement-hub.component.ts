import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { RatingsViewComponent } from './ratings-view/ratings-view.component';
import { FeedbackStudioComponent } from './feedback-studio/feedback-studio.component';
import { ForumWorkspaceComponent } from './forum-workspace/forum-workspace.component';
import { CustomSelectComponent } from '../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-engagement-hub',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    RatingsViewComponent, 
    FeedbackStudioComponent, 
    ForumWorkspaceComponent,
    CustomSelectComponent
  ],
  template: `
    <div class="space-y-6 pb-16">
      
      <!-- ========================================================================= -->
      <!-- 1. PREMIUM HEADER & WORKSPACE BANNER                                      -->
      <!-- ========================================================================= -->
      <div class="p-6 rounded-3xl bg-base-100 border border-base-300 shadow-sm relative overflow-hidden group">
        <!-- Subtle modern background accent -->
        <div class="absolute top-0 right-0 w-80 h-80 bg-tenant-500/5 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
        
        <div class="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <!-- Breadcrumb & Badge -->
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-tenant-50 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300 border border-tenant-500/20 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span class="material-symbols-outlined text-[13px] animate-pulse">insights</span>
                Telemetry Engine
              </span>
              <span class="text-xs text-text-secondary font-medium">
                Active Organization Context Workspace
              </span>
            </div>

            <!-- Primary Heading -->
            <h1 class="text-2xl font-black text-text-primary tracking-tight">Engagement Hub & Telemetry</h1>
            <p class="text-xs text-text-secondary mt-1.5 max-w-2xl leading-relaxed">
              Analyze satisfaction metrics, collect feedback questionnaires, and host collaborative forums across organizations, LMS nodes, and training scopes.
            </p>
          </div>

          <!-- Shortcuts -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <a
              routerLink="/plans"
              class="px-4 py-2.5 rounded-2xl text-xs font-bold bg-base-100 hover:bg-base-200 text-text-primary border border-base-300 flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              title="Return to Training Plan Registry">
              <span class="material-symbols-outlined text-sm text-text-secondary">grid_view</span>
              <span>All Plans</span>
            </a>

            <a
              routerLink="/transcripts"
              class="px-4 py-2.5 rounded-2xl text-xs font-bold bg-tenant-500 hover:bg-tenant-600 text-white flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              title="Open Academic Transcripts Registry">
              <span class="material-symbols-outlined text-sm">school</span>
              <span>Academic Transcripts</span>
            </a>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. WORKSPACE CONTEXT SEARCH & COLLAPSIBLE FILTERS                         -->
      <!-- ========================================================================= -->
      <div class="space-y-3 relative z-30">
        <!-- Search Toolbar Card matching Unified SaaS Style (Image 2) -->
        <div class="bg-white dark:bg-base-100 rounded-3xl border border-slate-200/80 dark:border-base-300 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <!-- Left: Search Field + Filters Button + Reset -->
          <div class="flex items-center gap-3 flex-1 max-w-2xl">
            <!-- Search Input -->
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg pointer-events-none">search</span>
              <input 
                type="text" 
                [ngModel]="organizationSearchQuery()"
                (ngModelChange)="onSearchQueryChange($event)"
                placeholder="Search by Organization Name..." 
                class="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-base-200/50 border border-slate-200/80 dark:border-base-300 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-base-300 transition-all shadow-2xs" />
              @if (organizationSearchQuery()) {
                <button 
                  type="button"
                  (click)="clearSearchQuery()"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-md cursor-pointer border-0 bg-transparent">
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              }
            </div>

            <!-- Filters Button beside Search -->
            <button 
              type="button"
              (click)="toggleFilters()"
              class="px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
              [class]="showFilterDrawer() 
                ? 'bg-tenant-500 text-white border-tenant-500' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-base-300 dark:bg-base-200/70'"
              title="Filters">
              <span class="material-symbols-outlined text-base" [class.text-white]="showFilterDrawer()">filter_list</span>
              <span>Filters</span>
            </button>

            @if (organizationSearchQuery()) {
              <button 
                type="button"
                (click)="clearSearchQuery()"
                class="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap animate-in fade-in shrink-0"
                title="Reset Search">
                <span class="material-symbols-outlined text-sm">restart_alt</span>
                <span>Reset</span>
              </button>
            }
          </div>

          <!-- Right: Active Scope Context Badge -->
          <div class="flex items-center gap-2 text-xs text-text-secondary self-end sm:self-auto flex-shrink-0">
            <span class="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-base-200 border border-slate-200/80 dark:border-base-300 font-semibold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm text-tenant-500">domain</span>
              <span class="truncate max-w-[200px]">{{ lmsData.activeTenant().name }}</span>
            </span>
          </div>

        </div>

        <!-- Collapsible Filter Drawer matching Image 2 -->
        @if (showFilterDrawer()) {
          <div class="bg-white dark:bg-base-100 rounded-2xl border border-slate-200/80 dark:border-base-300 p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 space-y-4 relative z-30">
            <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-base-300">
              <h3 class="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-tenant-500 text-base">tune</span>
                FILTER WORKSPACE SCOPE
              </h3>
              <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Staging Environment
              </span>
            </div>

            <!-- Dropdowns Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1 relative z-30">
              <!-- 1. Organization selector -->
              <div class="space-y-2.5 relative z-40">
                <div class="flex items-center justify-between text-xs font-bold text-text-primary">
                  <span>1. Organization (Tenant)</span>
                  @if (!lmsData.isSystemAdmin()) {
                    <span class="text-[9px] bg-base-200 text-text-secondary px-1.5 py-0.5 rounded-md font-mono">Read-Only</span>
                  }
                </div>
                
                @if (lmsData.isSystemAdmin()) {
                  <app-custom-select
                    [options]="pendingTenantOptions()"
                    [clearable]="false"
                    [searchable]="true"
                    [leadingIcon]="'domain'"
                    placeholder="Select Organization..."
                    [ngModel]="pendingTenantId()"
                    (ngModelChange)="onPendingTenantSelected($event)">
                  </app-custom-select>
                } @else {
                  <div class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-base-200/50 dark:border-base-300 text-xs text-text-primary font-bold">
                    <span class="material-symbols-outlined text-base text-tenant-500">domain</span>
                    <span class="truncate">{{ lmsData.activeTenant().name }}</span>
                  </div>
                }
              </div>

              <!-- 2. LMS Portal Selector -->
              <div class="space-y-2.5 relative z-30">
                <label class="text-xs font-bold text-text-primary block">2. LMS Portal</label>
                <app-custom-select
                  [options]="pendingLmsOptions()"
                  [clearable]="false"
                  [searchable]="true"
                  [leadingIcon]="'hub'"
                  placeholder="Select LMS Portal..."
                  [ngModel]="pendingLmsId()"
                  (ngModelChange)="onPendingLmsSelected($event)">
                </app-custom-select>
              </div>

              <!-- 3. Active Training Plan Selector -->
              <div class="space-y-2.5 relative z-20">
                <label class="text-xs font-bold text-text-primary block">3. Training Plan</label>
                <app-custom-select
                  [options]="pendingPlanOptions()"
                  [clearable]="false"
                  [searchable]="true"
                  [leadingIcon]="'auto_stories'"
                  placeholder="Select Training Plan..."
                  [ngModel]="pendingPlanId()"
                  (ngModelChange)="onPendingPlanSelected($event)">
                </app-custom-select>
              </div>
            </div>

            <!-- Drawer Footer Actions -->
            <div class="pt-3 border-t border-slate-100 dark:border-base-300 flex items-center justify-between">
              <!-- Clear All Selections on Left -->
              <button 
                type="button"
                (click)="clearAllSelections()"
                class="px-3.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-base-200 text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors cursor-pointer border-0 bg-transparent"
              >
                Clear All Selections
              </button>

              <!-- Cancel and Apply Filter on Right -->
              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  (click)="cancelFilters()" 
                  class="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-base-200 hover:bg-slate-200 dark:hover:bg-base-300 text-text-primary text-xs font-semibold transition-colors cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  (click)="applyFilters()" 
                  class="px-4 py-1.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer border-0"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- ========================================================================= -->
      <!-- 3. KPI SUMMARY TELEMETRY CARDS                                            -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-0">
        
        <!-- Ratings Metric -->
        <div class="bg-base-100 border border-base-300 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-base-400 transition-all duration-200 flex items-center justify-between relative overflow-hidden group">
          <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Avg Satisfaction</p>
            <div class="flex items-baseline gap-1.5 mt-2">
              <h3 class="text-3xl font-black text-amber-500 font-mono tracking-tight">{{ ratingSummary().averageValue || '0.0' }}</h3>
              <span class="text-xs font-semibold text-text-secondary">/ 5.0</span>
            </div>
            <span class="text-[11px] text-text-secondary font-medium mt-1 block">{{ totalRatingsCount() }} verified reviews</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <span class="material-symbols-outlined text-xl">star</span>
          </div>
        </div>

        <!-- Feedback Responses Metric -->
        <div class="bg-base-100 border border-base-300 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-base-400 transition-all duration-200 flex items-center justify-between relative overflow-hidden group">
          <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Feedback Forms</p>
            <div class="flex items-baseline gap-1.5 mt-2">
              <h3 class="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">{{ totalFeedbackCount() }}</h3>
              <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-md uppercase">Recorded</span>
            </div>
            <span class="text-[11px] text-text-secondary font-medium mt-1 block">Active version: {{ activeFormVersion() }}</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <span class="material-symbols-outlined text-xl">rate_review</span>
          </div>
        </div>

        <!-- Forum Topics Metric -->
        <div class="bg-base-100 border border-base-300 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-base-400 transition-all duration-200 flex items-center justify-between relative overflow-hidden group">
          <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Discussion Topics</p>
            <div class="flex items-baseline gap-1.5 mt-2">
              <h3 class="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">{{ forumTopicsCount() }}</h3>
              <span class="text-xs font-semibold text-text-secondary">Threads</span>
            </div>
            <span class="text-[11px] text-text-secondary font-medium mt-1 block">{{ forumPostsCount() }} messages exchanged</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <span class="material-symbols-outlined text-xl">forum</span>
          </div>
        </div>

        <!-- Content Repo Media Metric -->
        <div class="bg-base-100 border border-base-300 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-base-400 transition-all duration-200 flex items-center justify-between relative overflow-hidden group">
          <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Content Repository</p>
            <div class="flex items-baseline gap-1.5 mt-2">
              <h3 class="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">{{ lmsData.contentRepoAssets().length }}</h3>
              <span class="text-xs font-semibold text-text-secondary">Assets</span>
            </div>
            <span class="text-[11px] text-text-secondary font-medium mt-1 block">Multimedia & guide sheets</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <span class="material-symbols-outlined text-xl">perm_media</span>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 4. MAIN HUB TAB SWITCHER                                                  -->
      <!-- ========================================================================= -->
      <div class="flex items-center gap-2 p-1.5 bg-base-200 rounded-2xl border border-base-300 overflow-x-auto shadow-2xs">
        <button 
          type="button"
          (click)="activeTab.set('ratings')"
          [class.bg-base-100]="activeTab() === 'ratings'"
          [class.shadow-xs]="activeTab() === 'ratings'"
          [class.text-tenant-600]="activeTab() === 'ratings'"
          [class.dark:text-tenant-400]="activeTab() === 'ratings'"
          [class.text-text-secondary]="activeTab() !== 'ratings'"
          class="px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer">
          <span class="material-symbols-outlined text-base text-amber-500">star</span>
          <span>Ratings & Dimension Scores</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold">
            {{ totalRatingsCount() }}
          </span>
        </button>

        <button 
          type="button"
          (click)="activeTab.set('feedback')"
          [class.bg-base-100]="activeTab() === 'feedback'"
          [class.shadow-xs]="activeTab() === 'feedback'"
          [class.text-tenant-600]="activeTab() === 'feedback'"
          [class.dark:text-tenant-400]="activeTab() === 'feedback'"
          [class.text-text-secondary]="activeTab() !== 'feedback'"
          class="px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer">
          <span class="material-symbols-outlined text-base text-indigo-500">rate_review</span>
          <span>Feedback Studio & Questionnaires</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold">
            {{ totalFeedbackCount() }}
          </span>
        </button>

        <button 
          type="button"
          (click)="activeTab.set('forum')"
          [class.bg-base-100]="activeTab() === 'forum'"
          [class.shadow-xs]="activeTab() === 'forum'"
          [class.text-tenant-600]="activeTab() === 'forum'"
          [class.dark:text-tenant-400]="activeTab() === 'forum'"
          [class.text-text-secondary]="activeTab() !== 'forum'"
          class="px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer">
          <span class="material-symbols-outlined text-base text-emerald-500">forum</span>
          <span>Cohort Discussion Forum</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold">
            {{ forumTopicsCount() }}
          </span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- 5. ACTIVE SUBMODULE VIEWPORT                                              -->
      <!-- ========================================================================= -->
      @if (activePlanId()) {
        @if (activeTab() === 'ratings') {
          <div class="animate-in fade-in">
            <app-ratings-view [planId]="activePlanId()"></app-ratings-view>
          </div>
        } @else if (activeTab() === 'feedback') {
          <div class="animate-in fade-in">
            <app-feedback-studio [planId]="activePlanId()"></app-feedback-studio>
          </div>
        } @else if (activeTab() === 'forum') {
          <div class="animate-in fade-in">
            <app-forum-workspace [planId]="activePlanId()"></app-forum-workspace>
          </div>
        }
      } @else {
        <!-- Fallback Empty State if no training plans exist under scope -->
        <div class="p-12 text-center rounded-3xl bg-base-100 border border-base-300 shadow-sm animate-in fade-in">
          <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-base-200 flex items-center justify-center mx-auto text-slate-400">
            <span class="material-symbols-outlined text-3xl">auto_stories</span>
          </div>
          <h4 class="text-sm font-extrabold text-text-primary mt-4">No Active Training Plans Found</h4>
          <p class="text-xs text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
            There are no active training programs or study plans configured under the selected LMS portal. Try choosing a different organization or LMS node.
          </p>
        </div>
      }

    </div>
  `,
  styles: []
})
export class EngagementHubComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public lmsData = inject(LmsDataService);

  activeTab = signal<'ratings' | 'feedback' | 'forum'>('ratings');
  selectedPlanId = signal<string>('plan-001');

  // Filter Drawer visibility signal
  showFilterDrawer = signal<boolean>(false);
  // Search query signal
  organizationSearchQuery = signal<string>('');

  // Pending selection signals to hold changes before clicking "Apply Filter"
  pendingTenantId = signal<string>('');
  pendingLmsId = signal<string>('');
  pendingPlanId = signal<string>('');

  // Filtered/searched organization options for pending select
  pendingTenantOptions = computed(() => {
    const query = this.organizationSearchQuery().toLowerCase().trim();
    return this.lmsData.tenants()
      .filter(t => t.status === 'Active' && (!query || t.name.toLowerCase().includes(query)))
      .map(t => ({
        value: t.id,
        label: t.name
      }));
  });

  // Filtered LMS options for pending select
  pendingLmsOptions = computed(() => {
    const tenantId = this.pendingTenantId();
    if (!tenantId) return [];
    return this.lmsData.lmsInstances()
      .filter(l => l.organizationId === tenantId)
      .map(l => ({
        value: l.id,
        label: l.basicInfo?.lmsName || l.id
      }));
  });

  // Filtered Plan options for pending select
  pendingPlanOptions = computed(() => {
    const lmsId = this.pendingLmsId();
    if (!lmsId) return [];
    const plans = this.lmsData.plans().filter(p => p.lmsId === lmsId);
    return plans.map(p => ({
      value: p.id,
      label: `${p.name} (${p.planCode})`
    }));
  });

  // Organizations options listing
  tenantOptions = computed(() => {
    return this.lmsData.tenants()
      .filter(t => t.status === 'Active')
      .map(t => ({
        value: t.id,
        label: t.name
      }));
  });

  // LMS instance options listing (filtered by the currently active organization)
  lmsOptions = computed(() => {
    const activeId = this.lmsData.activeTenantId();
    return this.lmsData.lmsInstances()
      .filter(l => l.organizationId === activeId)
      .map(l => ({
        value: l.id,
        label: l.basicInfo?.lmsName || l.id
      }));
  });

  // Training plan options listing (scoped dynamically to active LMS portal)
  planOptions = computed(() => {
    return this.lmsData.activeLmsPlans().map(p => ({
      value: p.id,
      label: `${p.name} (${p.planCode})`
    }));
  });

  // Computes the active plan ID with a robust reactive fallback hierarchy
  activePlanId = computed(() => {
    const plans = this.lmsData.activeLmsPlans();
    const current = this.selectedPlanId();
    if (plans.length === 0) return '';
    if (plans.some(p => p.id === current)) return current;
    return plans[0].id;
  });

  ratingSummary = computed(() => {
    const planId = this.activePlanId();
    return this.lmsData.getRatingSummary(planId || 'plan-001');
  });

  totalRatingsCount = computed(() => {
    const planId = this.activePlanId();
    if (!planId) return 0;
    return this.lmsData.getRatingsForPlan(planId).length;
  });

  totalFeedbackCount = computed(() => {
    const planId = this.activePlanId();
    if (!planId) return 0;
    return this.lmsData.getFeedbackResponsesForPlan(planId).length;
  });

  activeFormVersion = computed(() => {
    const planId = this.activePlanId();
    if (!planId) return 'v1';
    const form = this.lmsData.getFeedbackFormForPlan(planId);
    return form?.versions.slice(-1)[0]?.versionLabel || 'v1';
  });

  forumTopicsCount = computed(() => {
    const planId = this.activePlanId();
    if (!planId) return 0;
    return this.lmsData.getForumForPlan(planId).topics.length;
  });

  forumPostsCount = computed(() => {
    const planId = this.activePlanId();
    if (!planId) return 0;
    const forum = this.lmsData.getForumForPlan(planId);
    return forum.topics.reduce((acc, t) => acc + t.posts.length, 0);
  });

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const pid = params.get('planId');
      if (pid) {
        this.selectedPlanId.set(pid);
      } else {
        const plans = this.lmsData.activeLmsPlans();
        if (plans.length > 0) {
          this.selectedPlanId.set(plans[0].id);
        }
      }

      const tab = params.get('tab');
      if (tab === 'ratings' || tab === 'feedback' || tab === 'forum') {
        this.activeTab.set(tab);
      }

      // Pre-initialize our pending selection states
      this.pendingTenantId.set(this.lmsData.activeTenantId());
      this.pendingLmsId.set(this.lmsData.activeLmsId());
      this.pendingPlanId.set(this.activePlanId());
    });
  }

  // Pending select event handlers
  onPendingTenantSelected(tenantId: string) {
    this.pendingTenantId.set(tenantId);
    const orgLms = this.lmsData.lmsInstances().filter(l => l.organizationId === tenantId);
    if (orgLms.length > 0) {
      this.pendingLmsId.set(orgLms[0].id);
      const plansList = this.lmsData.plans().filter(p => p.lmsId === orgLms[0].id);
      if (plansList.length > 0) {
        this.pendingPlanId.set(plansList[0].id);
      } else {
        this.pendingPlanId.set('');
      }
    } else {
      this.pendingLmsId.set('');
      this.pendingPlanId.set('');
    }
  }

  onPendingLmsSelected(lmsId: string) {
    this.pendingLmsId.set(lmsId);
    const plansList = this.lmsData.plans().filter(p => p.lmsId === lmsId);
    if (plansList.length > 0) {
      this.pendingPlanId.set(plansList[0].id);
    } else {
      this.pendingPlanId.set('');
    }
  }

  onPendingPlanSelected(planId: string) {
    this.pendingPlanId.set(planId);
  }

  onSearchQueryChange(query: string) {
    this.organizationSearchQuery.set(query);
    if (query && !this.showFilterDrawer()) {
      this.openFilters();
    }
  }

  clearSearchQuery() {
    this.organizationSearchQuery.set('');
  }

  // Drawer control methods
  openFilters() {
    this.pendingTenantId.set(this.lmsData.activeTenantId());
    this.pendingLmsId.set(this.lmsData.activeLmsId());
    this.pendingPlanId.set(this.activePlanId());
    this.showFilterDrawer.set(true);
  }

  toggleFilters() {
    if (this.showFilterDrawer()) {
      this.cancelFilters();
    } else {
      this.openFilters();
    }
  }

  cancelFilters() {
    this.showFilterDrawer.set(false);
  }

  applyFilters() {
    const tenantId = this.pendingTenantId();
    const lmsId = this.pendingLmsId();
    const planId = this.pendingPlanId();

    if (tenantId) {
      this.lmsData.switchTenant(tenantId);
    }
    if (lmsId) {
      this.lmsData.switchLms(lmsId);
    }
    if (planId) {
      this.selectedPlanId.set(planId);
    }
    this.showFilterDrawer.set(false);
  }

  clearAllSelections() {
    const activeTenantId = this.lmsData.isSystemAdmin() ? this.lmsData.tenants()[0]?.id : this.lmsData.activeTenantId();
    if (activeTenantId) {
      this.pendingTenantId.set(activeTenantId);
      const lmsList = this.lmsData.lmsInstances().filter(l => l.organizationId === activeTenantId);
      if (lmsList.length > 0) {
        const firstLmsId = lmsList[0].id;
        this.pendingLmsId.set(firstLmsId);
        
        const plansList = this.lmsData.plans().filter(p => p.lmsId === firstLmsId);
        if (plansList.length > 0) {
          this.pendingPlanId.set(plansList[0].id);
        } else {
          this.pendingPlanId.set('');
        }
      } else {
        this.pendingLmsId.set('');
        this.pendingPlanId.set('');
      }
    }
    this.organizationSearchQuery.set('');
  }

  // Handle switching active organization (Tenant)
  onTenantSelected(tenantId: string) {
    this.lmsData.switchTenant(tenantId);
  }

  // Handle switching active LMS instance portal
  onLmsSelected(lmsId: string) {
    this.lmsData.switchLms(lmsId);
  }

  // Handle switching selected Training Plan
  onPlanSelected(planId: string) {
    this.selectedPlanId.set(planId);
  }

  goBackToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
