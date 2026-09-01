import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { RatingsViewComponent } from './ratings-view/ratings-view.component';
import { FeedbackStudioComponent } from './feedback-studio/feedback-studio.component';
import { ForumWorkspaceComponent } from './forum-workspace/forum-workspace.component';

@Component({
  selector: 'app-engagement-hub',
  imports: [
    CommonModule, 
    FormsModule, 
    RatingsViewComponent, 
    FeedbackStudioComponent, 
    ForumWorkspaceComponent
  ],
  template: `
    <div class="space-y-6 pb-12 animate-fade-in">
      
      <!-- Top Title & Plan Selector Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs text-text-secondary">
            <span class="hover:underline cursor-pointer" (click)="goBackToDashboard()">Dashboard</span>
            <span>/</span>
            <span class="text-text-primary font-medium">Learner Engagement & Community</span>
          </div>
          <h1 class="text-xl font-bold text-text-primary mt-0.5 flex items-center gap-2.5">
            Engagement Hub & Telemetry
            <span class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
              Multi-Dimensional
            </span>
          </h1>
        </div>

        <!-- Plan Dropdown Context Switcher -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm">
            <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-400">auto_stories</span>
            <span class="text-xs font-semibold text-text-secondary">Active Plan:</span>
            <select 
              [ngModel]="selectedPlanId()"
              (ngModelChange)="onPlanSelected($event)"
              class="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer">
              @for (plan of availablePlans(); track plan.id) {
                <option [value]="plan.id">{{ plan.name }} ({{ plan.planCode }})</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards for Active Plan -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Ratings Metric -->
        <div class="p-5 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Avg Satisfaction</span>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-2xl font-black text-amber-500">{{ ratingSummary().averageValue || '0.0' }}</span>
              <span class="text-xs text-text-secondary">/ 5.0</span>
            </div>
            <span class="text-[10px] text-text-secondary mt-0.5 block">{{ totalRatingsCount() }} total reviews</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">star</span>
          </div>
        </div>

        <!-- Feedback Responses Metric -->
        <div class="p-5 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Form Submissions</span>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-2xl font-black text-indigo-600 dark:text-indigo-400">{{ totalFeedbackCount() }}</span>
              <span class="text-xs text-emerald-600 font-bold">Recorded</span>
            </div>
            <span class="text-[10px] text-text-secondary mt-0.5 block">Version: {{ activeFormVersion() }}</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">rate_review</span>
          </div>
        </div>

        <!-- Forum Topics Metric -->
        <div class="p-5 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Discussion Topics</span>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">{{ forumTopicsCount() }}</span>
              <span class="text-xs text-text-secondary">Active Threads</span>
            </div>
            <span class="text-[10px] text-text-secondary mt-0.5 block">{{ forumPostsCount() }} messages exchanged</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">forum</span>
          </div>
        </div>

        <!-- Content Repo Media Metric -->
        <div class="p-5 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Content Assets</span>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-2xl font-black text-purple-600 dark:text-purple-400">{{ lmsData.contentRepoAssets().length }}</span>
              <span class="text-xs text-text-secondary">Repo Items</span>
            </div>
            <span class="text-[10px] text-text-secondary mt-0.5 block">Video, Audio & PDF Guides</span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">perm_media</span>
          </div>
        </div>

      </div>

      <!-- Main Hub Tab Switcher -->
      <div class="flex items-center gap-2 p-1.5 bg-base-200/80 dark:bg-base-300/50 rounded-2xl border border-base-300 dark:border-slate-800 overflow-x-auto">
        <button 
          type="button"
          (click)="activeTab.set('ratings')"
          [class.bg-base-100]="activeTab() === 'ratings'"
          [class.shadow-xs]="activeTab() === 'ratings'"
          [class.text-tenant-600]="activeTab() === 'ratings'"
          [class.dark:text-tenant-400]="activeTab() === 'ratings'"
          [class.text-text-secondary]="activeTab() !== 'ratings'"
          class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer">
          <span class="material-symbols-outlined text-sm text-amber-500">star</span>
          <span>Ratings & Dimension Scores</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold">
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
          class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer">
          <span class="material-symbols-outlined text-sm text-indigo-500">rate_review</span>
          <span>Feedback Studio & Versioned Questionnaires</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold">
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
          class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer">
          <span class="material-symbols-outlined text-sm text-emerald-500">forum</span>
          <span>Cohort Discussion Forum</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold">
            {{ forumTopicsCount() }}
          </span>
        </button>
      </div>

      <!-- Tab Content Area -->
      @if (selectedPlanId()) {
        @if (activeTab() === 'ratings') {
          <div class="animate-fade-in">
            <app-ratings-view [planId]="selectedPlanId()"></app-ratings-view>
          </div>
        } @else if (activeTab() === 'feedback') {
          <div class="animate-fade-in">
            <app-feedback-studio [planId]="selectedPlanId()"></app-feedback-studio>
          </div>
        } @else if (activeTab() === 'forum') {
          <div class="animate-fade-in">
            <app-forum-workspace [planId]="selectedPlanId()"></app-forum-workspace>
          </div>
        }
      }

    </div>
  `
})
export class EngagementHubComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public lmsData = inject(LmsDataService);

  activeTab = signal<'ratings' | 'feedback' | 'forum'>('ratings');
  selectedPlanId = signal<string>('plan-001');

  availablePlans = computed(() => {
    return this.lmsData.plans();
  });

  ratingSummary = computed(() => {
    return this.lmsData.getRatingSummary(this.selectedPlanId());
  });

  totalRatingsCount = computed(() => {
    return this.lmsData.getRatingsForPlan(this.selectedPlanId()).length;
  });

  totalFeedbackCount = computed(() => {
    return this.lmsData.getFeedbackResponsesForPlan(this.selectedPlanId()).length;
  });

  activeFormVersion = computed(() => {
    const form = this.lmsData.getFeedbackFormForPlan(this.selectedPlanId());
    return form?.versions.slice(-1)[0]?.versionLabel || 'v1';
  });

  forumTopicsCount = computed(() => {
    return this.lmsData.getForumForPlan(this.selectedPlanId()).topics.length;
  });

  forumPostsCount = computed(() => {
    const forum = this.lmsData.getForumForPlan(this.selectedPlanId());
    return forum.topics.reduce((acc, t) => acc + t.posts.length, 0);
  });

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const pid = params.get('planId');
      if (pid) {
        this.selectedPlanId.set(pid);
      } else {
        const plans = this.availablePlans();
        if (plans.length > 0) {
          this.selectedPlanId.set(plans[0].id);
        }
      }

      const tab = params.get('tab');
      if (tab === 'ratings' || tab === 'feedback' || tab === 'forum') {
        this.activeTab.set(tab);
      }
    });
  }

  onPlanSelected(planId: string) {
    this.selectedPlanId.set(planId);
  }

  goBackToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
