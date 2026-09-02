import { Component, inject, input, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  DiscussionForum, 
  ForumTopic, 
  ForumPost, 
  ForumAttachment,
  ContentRepoAsset,
  TopicPostPermission,
  AttachmentType 
} from '../../../models/engagement.model';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';
import { CustomSelectComponent } from '../../../components/custom-select/custom-select.component';

export interface ForumFilters {
  categories: string[];
  statuses: string[];
}

export const DEFAULT_FORUM_FILTERS: ForumFilters = {
  categories: [],
  statuses: []
};

@Component({
  selector: 'app-forum-workspace',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CustomAvatarComponent, CustomSelectComponent],
  template: `
    <div class="space-y-6">
      
      <!-- Forum Header & Permissions Banner -->
      <div class="p-6 rounded-3xl bg-base-100 border border-base-300 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div class="flex items-center flex-wrap gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-tenant-50 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300 border border-tenant-500/20">
              Plan Discussion Forum
            </span>
            <span class="text-xs text-text-secondary">• Topics: <strong>{{ currentForum().topics.length }}</strong></span>
            <span class="text-xs text-text-secondary">• Scope: <strong>{{ currentForum().visibilityScope }}</strong></span>
          </div>
          <h2 class="text-lg font-bold text-text-primary mt-1">Cohort Discussions & Learning Community</h2>
          <p class="text-xs text-text-secondary mt-0.5 max-w-2xl">
            Collaborative academic workspace for syllabus queries, operational field debriefs, and multimedia resource exchange.
          </p>
        </div>

        <!-- Permissions Chips & Create Topic Button -->
        <div class="flex items-center flex-wrap gap-3">
          <div class="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-base-200 border border-base-300 text-[11px] text-text-secondary shadow-2xs">
            <span class="material-symbols-outlined text-xs text-indigo-500">lock_person</span>
            <span>Creation: <strong>{{ currentForum().topicCreationPermission === 'instructorsOnly' ? 'Instructors Only' : 'Instructors & Trainees' }}</strong></span>
          </div>

          <button 
            type="button" 
            (click)="openCreateTopicModal()"
            class="px-4 py-2.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
            <span class="material-symbols-outlined text-sm">add_comment</span>
            <span>Start New Topic</span>
          </button>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- VIEW 1: TOPIC LIST & SEARCH HUB                                   -->
      <!-- ================================================================= -->
      @if (!activeTopic()) {
        <div class="space-y-4 animate-fade-in">
          
          <!-- Modern Search & Filter Panel Matching Unified SaaS Layout -->
          <div class="space-y-3 relative z-30">
            
            <div class="bg-white dark:bg-base-100 rounded-3xl border border-slate-200/80 dark:border-base-300 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              <!-- Search Bar with Integrated Action Buttons -->
              <div class="flex items-center gap-3 flex-1 max-w-2xl">
                <div class="relative flex-1">
                  <span class="material-symbols-outlined text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-lg select-none pointer-events-none">
                    search
                  </span>
                  <input 
                    type="text" 
                    [ngModel]="searchQuery()"
                    (ngModelChange)="onSearchChange($event)"
                    placeholder="Search topics by title or post keywords..."
                    class="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-base-200/50 border border-slate-200/80 dark:border-base-300 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all shadow-2xs" />
                  
                  @if (searchQuery()) {
                    <button 
                      type="button" 
                      (click)="onSearchChange('')"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer border-0 bg-transparent">
                      ✕
                    </button>
                  }
                </div>

                <!-- Filters Button -->
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

                <!-- Reset Button -->
                @if (hasActiveFilters() || searchQuery()) {
                  <button 
                    type="button" 
                    (click)="resetAllFilters()"
                    class="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                    title="Reset All">
                    <span class="material-symbols-outlined text-sm">restart_alt</span>
                    <span>Reset</span>
                  </button>
                }
              </div>

              <!-- Right: New Topic Trigger -->
              <div class="flex items-center gap-3 justify-end shrink-0">
                <button 
                  type="button" 
                  (click)="openCreateTopicModal()"
                  class="px-4 py-2.5 rounded-2xl bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs border-0 shrink-0">
                  <span class="material-symbols-outlined text-base">add_comment</span>
                  <span>New Topic</span>
                </button>
              </div>

            </div>

            <!-- Collapsible Filter Drawer Card -->
            @if (isFilterPanelOpen()) {
              <div class="bg-white dark:bg-base-100 rounded-2xl border border-slate-200/80 dark:border-base-300 p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                
                <!-- Header -->
                <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-base-300">
                  <h3 class="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-tenant-500 text-base">tune</span>
                    FILTER DISCUSSION TOPICS
                  </h3>
                  <span class="text-[11px] text-text-secondary font-medium">
                    Combine criteria with AND &bull; Multiple values in same category with OR
                  </span>
                </div>

                <!-- Filter Body Grid: 3-column layout -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-1">
                  
                  <!-- 1. Topic Category -->
                  <div class="space-y-2.5">
                    <label class="text-xs font-bold text-text-primary block">
                      1. Topic Category
                    </label>
                    <div class="space-y-1.5">
                      @for (cat of categoryFilterOptions; track cat.value) {
                        <label class="flex items-center gap-2 text-xs text-text-primary cursor-pointer group select-none p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-base-200 transition-colors">
                          <input 
                            type="checkbox" 
                            [checked]="draftFilters().categories.includes(cat.value)"
                            (change)="toggleCategoryDraft(cat.value)"
                            class="rounded border-slate-300 dark:border-base-300 text-tenant-500 focus:ring-tenant-500 w-4 h-4 cursor-pointer" />
                          <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 shadow-2xs truncate" [class]="cat.badgeClass">
                            <span class="w-1.5 h-1.5 rounded-full shrink-0" [class]="cat.dotClass"></span>
                            <span class="truncate">{{ cat.label }}</span>
                          </span>
                        </label>
                      }
                    </div>
                  </div>

                  <!-- 2. Topic Status -->
                  <div class="space-y-2.5">
                    <label class="text-xs font-bold text-text-primary block">
                      2. Topic Status
                    </label>
                    <div class="space-y-1.5">
                      @for (stat of statusFilterOptions; track stat.value) {
                        <label class="flex items-center gap-2 text-xs text-text-primary cursor-pointer group select-none p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-base-200 transition-colors">
                          <input 
                            type="checkbox" 
                            [checked]="draftFilters().statuses.includes(stat.value)"
                            (change)="toggleStatusDraft(stat.value)"
                            class="rounded border-slate-300 dark:border-base-300 text-tenant-500 focus:ring-tenant-500 w-4 h-4 cursor-pointer" />
                          <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 shadow-2xs truncate" [class]="stat.badgeClass">
                            <span class="w-1.5 h-1.5 rounded-full shrink-0" [class]="stat.dotClass"></span>
                            <span class="truncate">{{ stat.label }}</span>
                          </span>
                        </label>
                      }
                    </div>
                  </div>

                  <!-- 3. Sort by Dropdown -->
                  <div class="space-y-2.5">
                    <label class="text-xs font-bold text-text-primary block">
                      3. Sort by
                    </label>
                    <div class="space-y-2">
                      <app-custom-select
                        [options]="sortOptions"
                        [clearable]="false"
                        [searchable]="false"
                        placeholder="Select sort order..."
                        [ngModel]="draftSort()"
                        (ngModelChange)="draftSort.set($event)">
                      </app-custom-select>
                      <p class="text-[11px] text-text-secondary leading-normal">
                        Order topics by latest activity, total responses, or oldest threads first.
                      </p>
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

                @for (cat of appliedFilters().categories; track cat) {
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-base-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-base-300 text-xs rounded-xl font-medium">
                    <span>Category: {{ cat }}</span>
                    <button type="button" (click)="removeCategoryFilter(cat)" class="hover:text-rose-500 font-bold ml-1 cursor-pointer border-0 bg-transparent">✕</button>
                  </span>
                }

                @for (stat of appliedFilters().statuses; track stat) {
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-base-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-base-300 text-xs rounded-xl font-medium">
                    <span>Status: {{ getStatusLabel(stat) }}</span>
                    <button type="button" (click)="removeStatusFilter(stat)" class="hover:text-rose-500 font-bold ml-1 cursor-pointer border-0 bg-transparent">✕</button>
                  </span>
                }

                @if (selectedSort() !== 'latest') {
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-base-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-base-300 text-xs rounded-xl font-medium">
                    <span>Sort: {{ getSortLabel(selectedSort()) }}</span>
                    <button type="button" (click)="selectedSort.set('latest'); draftSort.set('latest')" class="hover:text-rose-500 font-bold ml-1 cursor-pointer border-0 bg-transparent">✕</button>
                  </span>
                }
              </div>
            }

          </div>

          <!-- Topics List -->
          <div class="space-y-3">
            @for (topic of filteredTopics(); track topic.topicId) {
              <div 
                (click)="selectTopic(topic)"
                [class.border-tenant-500]="topic.pinned"
                [class.bg-tenant-50/20]="topic.pinned"
                [class.dark:bg-tenant-950/20]="topic.pinned"
                class="p-5 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm hover:border-tenant-500 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div class="flex items-start gap-4">
                  <!-- Author Avatar -->
                  <app-custom-avatar [name]="topic.createdBy" [url]="topic.createdByAvatar" size="md" shape="squircle"></app-custom-avatar>

                  <div>
                    <div class="flex items-center flex-wrap gap-2">
                      @if (topic.pinned) {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-0.5">
                          <span class="material-symbols-outlined text-xs">push_pin</span>
                          <span>Pinned</span>
                        </span>
                      }
                      @if (topic.locked) {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-0.5">
                          <span class="material-symbols-outlined text-xs">lock</span>
                          <span>Locked</span>
                        </span>
                      }
                      <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-base-200 dark:bg-base-300 text-text-secondary">
                        {{ topic.categoryTag }}
                      </span>
                      @if (topic.postPermission === 'instructorsOnly') {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          Instructor Only Posting
                        </span>
                      }
                    </div>

                    <h3 class="text-sm font-bold text-text-primary group-hover:text-tenant-600 dark:group-hover:text-tenant-400 transition-colors mt-1.5">
                      {{ topic.title }}
                    </h3>

                    <p class="text-xs text-text-secondary line-clamp-1 mt-0.5">
                      {{ topic.description || topic.posts[0]?.text }}
                    </p>

                    <div class="flex items-center gap-3 text-[11px] text-text-secondary mt-2">
                      <span>Started by <strong>{{ topic.createdBy }}</strong> ({{ topic.createdByRole }})</span>
                      <span>•</span>
                      <span>Last activity: {{ topic.lastActivityAt }}</span>
                    </div>
                  </div>
                </div>

                <!-- Stats & Actions -->
                <div class="flex items-center gap-4 self-end md:self-auto" (click)="$event.stopPropagation()">
                  <div class="text-right">
                    <div class="flex items-center gap-1 text-xs font-bold text-text-primary justify-end">
                      <span class="material-symbols-outlined text-sm text-text-secondary">chat_bubble</span>
                      <span>{{ topic.postCount }} posts</span>
                    </div>
                    <span class="text-[10px] text-text-secondary block mt-0.5">
                      {{ getTopicAttachmentCount(topic) }} attachments
                    </span>
                  </div>

                  <!-- Quick Moderation Menu -->
                  @if (canModerate()) {
                    <div class="flex items-center gap-1 border-l border-base-300 dark:border-slate-800 pl-3">
                      <button 
                        type="button" 
                        (click)="togglePin(topic.topicId)"
                        [title]="topic.pinned ? 'Unpin topic' : 'Pin topic'"
                        class="p-1.5 rounded-lg hover:bg-base-300 text-slate-400 hover:text-amber-600 transition-colors">
                        <span class="material-symbols-outlined text-base">{{ topic.pinned ? 'keep_off' : 'push_pin' }}</span>
                      </button>
                      <button 
                        type="button" 
                        (click)="toggleLock(topic.topicId)"
                        [title]="topic.locked ? 'Unlock topic' : 'Lock topic'"
                        class="p-1.5 rounded-lg hover:bg-base-300 text-slate-400 hover:text-rose-600 transition-colors">
                        <span class="material-symbols-outlined text-base">{{ topic.locked ? 'lock_open' : 'lock' }}</span>
                      </button>
                    </div>
                  }
                </div>

              </div>
            } @empty {
              <div class="p-12 text-center rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800">
                <span class="material-symbols-outlined text-4xl text-text-secondary/40">forum</span>
                <p class="text-xs font-bold text-text-primary mt-2">No discussion topics found.</p>
                <p class="text-[11px] text-text-secondary mt-1">Start a new conversation thread to engage with trainees and instructors.</p>
                <button 
                  type="button" 
                  (click)="openCreateTopicModal()"
                  class="mt-4 px-4 py-2 rounded-xl text-xs font-bold btn-gradient text-white shadow-sm cursor-pointer">
                  Start New Topic
                </button>
              </div>
            }
          </div>

        </div>
      }

      <!-- ================================================================= -->
      <!-- VIEW 2: INTERACTIVE TOPIC THREAD VIEW                             -->
      <!-- ================================================================= -->
      @if (activeTopic()) {
        <div class="space-y-6 animate-fade-in">
          
          <!-- Thread Navigation & Header Bar -->
          <div class="p-5 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <button 
                type="button" 
                (click)="activeTopic.set(null)"
                class="w-8 h-8 rounded-xl border border-base-300 dark:border-slate-700 bg-base-200 hover:bg-base-300 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-base">arrow_back</span>
              </button>

              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-base-200 dark:bg-base-300 text-text-secondary">
                    {{ activeTopic()!.categoryTag }}
                  </span>
                  @if (activeTopic()!.pinned) {
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      📌 Pinned
                    </span>
                  }
                  @if (activeTopic()!.locked) {
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                      🔒 Locked Topic
                    </span>
                  }
                </div>
                <h2 class="text-base font-bold text-text-primary mt-1">{{ activeTopic()!.title }}</h2>
              </div>
            </div>

            <!-- Moderation Toolbar -->
            @if (canModerate()) {
              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  (click)="togglePin(activeTopic()!.topicId)"
                  class="px-3 py-1.5 rounded-xl border border-base-300 dark:border-slate-700 bg-base-100 dark:bg-base-200 hover:bg-base-300 text-xs font-semibold text-text-primary flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">{{ activeTopic()!.pinned ? 'keep_off' : 'push_pin' }}</span>
                  <span>{{ activeTopic()!.pinned ? 'Unpin' : 'Pin Topic' }}</span>
                </button>
                <button 
                  type="button" 
                  (click)="toggleLock(activeTopic()!.topicId)"
                  class="px-3 py-1.5 rounded-xl border border-base-300 dark:border-slate-700 bg-base-100 dark:bg-base-200 hover:bg-base-300 text-xs font-semibold text-text-primary flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">{{ activeTopic()!.locked ? 'lock_open' : 'lock' }}</span>
                  <span>{{ activeTopic()!.locked ? 'Unlock' : 'Lock Topic' }}</span>
                </button>
              </div>
            }
          </div>

          <!-- Thread Posts Stream -->
          <div class="space-y-4">
            @for (post of activeTopic()!.posts; track post.postId; let pIdx = $index) {
              <div 
                [class.ml-6]="!!post.parentPostId"
                [class.border-l-4]="!!post.parentPostId"
                [class.border-tenant-500]="!!post.parentPostId"
                [class.opacity-50]="post.hidden"
                class="p-6 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm space-y-4">
                
                <!-- Post Author Header -->
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <app-custom-avatar [name]="post.authorName" [imageUrl]="post.authorAvatar" size="md" shape="squircle"></app-custom-avatar>
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="text-xs font-bold text-text-primary">{{ post.authorName }}</h4>
                        <span 
                          [ngClass]="post.authorRole === 'instructor' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' : (post.authorRole === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300')"
                          class="px-2 py-0.2 rounded text-[10px] font-bold uppercase">
                          {{ post.authorRole }}
                        </span>
                        @if (pIdx === 0) {
                          <span class="px-2 py-0.2 rounded text-[10px] font-bold bg-tenant-100 text-tenant-700 dark:bg-tenant-900/40 dark:text-tenant-300">
                            Original Poster
                          </span>
                        }
                      </div>
                      <p class="text-[10px] text-text-secondary mt-0.5">{{ post.createdAt }}</p>
                    </div>
                  </div>

                  <!-- Post Menu & Moderation -->
                  <div class="flex items-center gap-1">
                    @if (canModerate()) {
                      <button 
                        type="button" 
                        (click)="confirmDeletePost(post.postId)"
                        class="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Post">
                        <span class="material-symbols-outlined text-base">delete</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Post Content Text -->
                <div class="text-xs text-text-primary leading-relaxed whitespace-pre-line">
                  {{ post.text }}
                </div>

                <!-- Rich Attachments (Video, Audio, PDF) -->
                @if (post.attachments && post.attachments.length > 0) {
                  <div class="pt-3 border-t border-base-300/60 dark:border-slate-800/60 space-y-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                      Attached Media & Documents ({{ post.attachments.length }}):
                    </span>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      @for (att of post.attachments; track att.attachmentId) {
                        
                        <!-- Video Card -->
                        @if (att.type === 'video') {
                          <div class="p-3 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800 flex items-center gap-3">
                            <div class="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                              <span class="material-symbols-outlined text-2xl">play_circle</span>
                            </div>
                            <div class="min-w-0 flex-1">
                              <h5 class="text-xs font-bold text-text-primary truncate">{{ att.name }}</h5>
                              <span class="text-[10px] text-text-secondary block mt-0.5">Video • {{ (att.sizeBytes / 1000000).toFixed(1) }} MB</span>
                              <a [href]="att.ref" target="_blank" class="text-[11px] font-bold text-tenant-600 dark:text-tenant-400 hover:underline mt-1 inline-flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">open_in_new</span>
                                <span>Watch Video</span>
                              </a>
                            </div>
                          </div>
                        }

                        <!-- Audio Card -->
                        @if (att.type === 'audio') {
                          <div class="p-3 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800 flex items-center gap-3">
                            <div class="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                              <span class="material-symbols-outlined text-2xl">volume_up</span>
                            </div>
                            <div class="min-w-0 flex-1">
                              <h5 class="text-xs font-bold text-text-primary truncate">{{ att.name }}</h5>
                              <audio controls class="w-full h-7 mt-1">
                                <source [src]="att.ref" type="audio/mpeg">
                              </audio>
                            </div>
                          </div>
                        }

                        <!-- Document File Card -->
                        @if (att.type === 'file') {
                          <div class="p-3 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800 flex items-center gap-3">
                            <div class="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                              <span class="material-symbols-outlined text-2xl">description</span>
                            </div>
                            <div class="min-w-0 flex-1">
                              <h5 class="text-xs font-bold text-text-primary truncate">{{ att.name }}</h5>
                              <span class="text-[10px] text-text-secondary block mt-0.5">Document • {{ (att.sizeBytes / 1000000).toFixed(1) }} MB</span>
                              <a [href]="att.ref" target="_blank" download class="text-[11px] font-bold text-tenant-600 dark:text-tenant-400 hover:underline mt-1 inline-flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">download</span>
                                <span>Download PDF</span>
                              </a>
                            </div>
                          </div>
                        }

                      }
                    </div>
                  </div>
                }

                <!-- Post Footer Actions (Like, Reply) -->
                <div class="pt-2 border-t border-base-300/40 flex items-center justify-between text-xs text-text-secondary">
                  <button 
                    type="button" 
                    (click)="toggleLike(post.postId)"
                    [class.text-tenant-600]="post.likedByCurrentUser"
                    [class.font-bold]="post.likedByCurrentUser"
                    class="flex items-center gap-1 hover:text-tenant-600 transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-base">{{ post.likedByCurrentUser ? 'thumb_up' : 'thumb_up_off_alt' }}</span>
                    <span>{{ post.likesCount || 0 }} Likes</span>
                  </button>

                  <button 
                    type="button" 
                    (click)="prepareReply(post.postId)"
                    class="flex items-center gap-1 font-semibold hover:text-text-primary transition-colors">
                    <span class="material-symbols-outlined text-base">reply</span>
                    <span>Reply to this post</span>
                  </button>
                </div>

              </div>
            }
          </div>

          <!-- ============================================================= -->
          <!-- REPLY COMPOSER & ATTACHMENT PICKER                            -->
          <!-- ============================================================= -->
          @if (activeTopic()!.locked) {
            <!-- Locked Notice -->
            <div class="p-6 text-center rounded-2xl bg-base-200/70 border border-base-300 dark:border-slate-800 text-xs">
              <span class="material-symbols-outlined text-3xl text-rose-500">lock</span>
              <p class="font-bold text-text-primary mt-1">This topic has been locked by a moderator.</p>
              <p class="text-text-secondary">Further replies and attachments are disabled for archiving.</p>
            </div>
          } @else if (isPostingRestricted()) {
            <!-- Instructor Only Notice -->
            <div class="p-6 text-center rounded-2xl bg-base-200/70 border border-base-300 dark:border-slate-800 text-xs">
              <span class="material-symbols-outlined text-3xl text-indigo-500">lock_person</span>
              <p class="font-bold text-text-primary mt-1">Posting is restricted to instructors in this announcement topic.</p>
              <p class="text-text-secondary">Please use general Q&A topics to ask questions or post observations.</p>
            </div>
          } @else {
            <div class="p-6 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm space-y-4">
              
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-tenant-600">rate_review</span>
                  <span>{{ replyingToPostId() ? 'Write Threaded Reply' : 'Post Message to Topic' }}</span>
                </h4>
                @if (replyingToPostId()) {
                  <button 
                    type="button" 
                    (click)="replyingToPostId.set(null)"
                    class="text-[11px] text-rose-500 font-bold hover:underline">
                    Cancel Reply Context
                  </button>
                }
              </div>

              <!-- Message Textarea -->
              <textarea 
                [ngModel]="replyText()"
                (ngModelChange)="replyText.set($event)"
                rows="3"
                placeholder="Type your response, thoughts, or procedural questions..."
                class="w-full px-3 py-2.5 rounded-xl bg-base-200/70 border border-base-300 dark:border-slate-700 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-tenant-600">
              </textarea>

              <!-- Staged Attachments Badges -->
              @if (stagedAttachments().length > 0) {
                <div class="space-y-1.5">
                  <span class="text-[10px] uppercase font-bold text-text-secondary block">Pending Attachments:</span>
                  <div class="flex items-center flex-wrap gap-2">
                    @for (att of stagedAttachments(); track att.name; let attIdx = $index) {
                      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-200 dark:bg-base-300 text-[11px] font-semibold text-text-primary border border-base-300/80">
                        <span class="material-symbols-outlined text-xs text-tenant-600">
                          {{ att.type === 'video' ? 'movie' : (att.type === 'audio' ? 'audiotrack' : 'description') }}
                        </span>
                        <span class="truncate max-w-[180px]">{{ att.name }}</span>
                        <button type="button" (click)="removeStagedAttachment(attIdx)" class="text-slate-400 hover:text-rose-500 ml-1">
                          <span class="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Attachment Action Toolbar & Post Trigger -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-base-300 dark:border-slate-800">
                <div class="flex items-center gap-2">
                  
                  <!-- Repo Picker Trigger -->
                  <button 
                    type="button" 
                    (click)="openRepoPickerFor('reply')"
                    class="px-3 py-1.5 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm text-indigo-500">folder_open</span>
                    <span>Attach from Content Repo</span>
                  </button>

                  <!-- Direct Upload Trigger -->
                  <label class="px-3 py-1.5 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm text-emerald-500">upload_file</span>
                    <span>Direct Upload</span>
                    <input type="file" (change)="handleDirectUpload($event)" class="hidden" />
                  </label>

                </div>

                <button 
                  type="button" 
                  (click)="submitPostReply()"
                  class="px-5 py-2 rounded-xl btn-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity cursor-pointer self-end sm:self-auto">
                  Post Message
                </button>
              </div>

            </div>
          }

        </div>
      }

      <!-- ===================================================================== -->
      <!-- MODAL: CREATE TOPIC                                                   -->
      <!-- ===================================================================== -->
      @if (showCreateTopicModal()) {
        <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div class="w-full max-w-xl rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-2xl overflow-visible my-auto">
            
            <div class="p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30 rounded-t-2xl">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-tenant-600 text-white flex items-center justify-center shadow-xs">
                  <span class="material-symbols-outlined text-xl">forum</span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-text-primary">Create Discussion Topic</h3>
                  <p class="text-[11px] text-text-secondary">Start a new thread in this plan's learning cohort forum</p>
                </div>
              </div>
              <button 
                type="button" 
                (click)="showCreateTopicModal.set(false)"
                class="w-8 h-8 rounded-lg hover:bg-base-300 flex items-center justify-center text-text-secondary transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form [formGroup]="topicForm" (ngSubmit)="saveNewTopic()" class="p-6 space-y-4 text-xs">
              
              <!-- Topic Title -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-bold text-text-primary">Topic Title <span class="text-rose-500">*</span></label>
                  <span class="text-[10px] text-text-secondary">Clear and descriptive headline</span>
                </div>
                <input 
                  type="text" 
                  formControlName="title"
                  placeholder="e.g. Phase 2 Field Tablet Synchronization Troubleshooting"
                  [class.border-rose-500]="(topicForm.get('title')?.invalid && (topicForm.get('title')?.touched || topicFormSubmitted()))"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-base-200/70 border border-base-300 dark:border-slate-700 text-text-primary font-semibold focus:outline-none focus:border-tenant-600 focus:ring-1 focus:ring-tenant-600/30 transition-all text-xs" />
                @if (topicForm.get('title')?.invalid && (topicForm.get('title')?.touched || topicFormSubmitted())) {
                  <p class="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">error</span>
                    Topic title is required (minimum 3 characters).
                  </p>
                }
              </div>

              <!-- Category & Posting Permissions -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="font-bold text-text-primary block mb-1">Category Tag <span class="text-rose-500">*</span></label>
                  <app-custom-select
                    [options]="categoryFormOptions"
                    [clearable]="false"
                    [searchable]="false"
                    formControlName="categoryTag">
                  </app-custom-select>
                </div>

                <div>
                  <label class="font-bold text-text-primary block mb-1">Posting Permissions <span class="text-rose-500">*</span></label>
                  <app-custom-select
                    [options]="permissionOptions"
                    [clearable]="false"
                    [searchable]="false"
                    formControlName="postPermission">
                  </app-custom-select>
                </div>
              </div>

              <!-- Initial Post Text -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-bold text-text-primary">Initial Opening Post <span class="text-rose-500">*</span></label>
                  <span class="text-[10px] text-text-secondary">Context, instructions or inquiry</span>
                </div>
                <textarea 
                  formControlName="initialPost"
                  rows="4"
                  placeholder="Provide context, operational guidelines, instructions, or initial questions to spark cohort engagement..."
                  [class.border-rose-500]="(topicForm.get('initialPost')?.invalid && (topicForm.get('initialPost')?.touched || topicFormSubmitted()))"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-base-200/70 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:border-tenant-600 focus:ring-1 focus:ring-tenant-600/30 transition-all text-xs">
                </textarea>
                @if (topicForm.get('initialPost')?.invalid && (topicForm.get('initialPost')?.touched || topicFormSubmitted())) {
                  <p class="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">error</span>
                    Initial opening message is required (minimum 5 characters).
                  </p>
                }
              </div>

              <!-- Attachments Section for Topic -->
              <div class="p-3.5 rounded-xl bg-base-200/50 border border-base-300 dark:border-slate-800 space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-tenant-600">attachment</span>
                    Attach Multimedia & Learning Assets
                  </span>
                  <div class="flex items-center gap-2">
                    <button 
                      type="button" 
                      (click)="openRepoPickerFor('modal')"
                      class="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-semibold text-[11px] flex items-center gap-1 hover:bg-indigo-100 cursor-pointer">
                      <span class="material-symbols-outlined text-xs">folder_special</span>
                      <span>From Repo</span>
                    </button>
                    <label class="px-2.5 py-1 rounded-lg bg-base-100 hover:bg-base-200 border border-base-300 text-text-secondary font-semibold text-[11px] flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-xs">upload_file</span>
                      <span>Direct Upload</span>
                      <input type="file" (change)="handleTopicDirectUpload($event)" class="hidden" />
                    </label>
                  </div>
                </div>

                @if (stagedTopicAttachments().length > 0) {
                  <div class="flex flex-wrap gap-2 pt-1">
                    @for (att of stagedTopicAttachments(); track att.attachmentId; let idx = $index) {
                      <div class="px-2.5 py-1 rounded-lg bg-base-100 dark:bg-base-300 border border-base-300 dark:border-slate-700 flex items-center gap-2 text-[11px] shadow-2xs">
                        <span class="material-symbols-outlined text-xs text-tenant-600">
                          {{ att.type === 'video' ? 'movie' : (att.type === 'audio' ? 'audiotrack' : 'description') }}
                        </span>
                        <span class="font-medium text-text-primary max-w-[180px] truncate">{{ att.name }}</span>
                        <button type="button" (click)="removeStagedTopicAttachment(idx)" class="text-text-secondary hover:text-rose-500 flex items-center cursor-pointer">
                          <span class="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Admin & Moderator Options -->
              @if (canModerate()) {
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4">
                  <span class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Moderator Options:</span>
                  <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" formControlName="pinned" class="rounded text-tenant-600 focus:ring-tenant-500" />
                    <span class="text-xs font-semibold text-text-primary flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs text-amber-500">push_pin</span>
                      Pin as Announcement
                    </span>
                  </label>
                  <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" formControlName="locked" class="rounded text-tenant-600 focus:ring-tenant-500" />
                    <span class="text-xs font-semibold text-text-primary flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs text-slate-500">lock</span>
                      Lock Topic (Read-Only)
                    </span>
                  </label>
                </div>
              }

              <!-- Actions -->
              <div class="pt-4 border-t border-base-300 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button 
                  type="button" 
                  (click)="showCreateTopicModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary font-semibold transition-colors cursor-pointer">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="px-5 py-2 rounded-xl btn-gradient text-white font-bold shadow-xs hover:shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">publish</span>
                  <span>Publish Topic</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      }

      <!-- ===================================================================== -->
      <!-- MODAL: CONTENT REPOSITORY ATTACHMENT BROWSER                          -->
      <!-- ===================================================================== -->
      @if (showRepoPicker()) {
        <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div class="w-full max-w-xl rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            
            <div class="p-4 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-500">folder_special</span>
                <h3 class="text-xs font-bold text-text-primary">Content Repository Asset Picker</h3>
              </div>
              <button 
                type="button" 
                (click)="showRepoPicker.set(false)"
                class="w-6 h-6 rounded-md hover:bg-base-300 flex items-center justify-center text-text-secondary">
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div class="p-4 overflow-y-auto space-y-2.5 text-xs flex-1">
              @for (asset of repoAssets(); track asset.id) {
                <div 
                  (click)="attachRepoAsset(asset)"
                  class="p-3 rounded-xl bg-base-200/50 hover:bg-tenant-50 dark:hover:bg-tenant-950/30 border border-base-300 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center text-tenant-600 shrink-0">
                      <span class="material-symbols-outlined text-xl">
                        {{ asset.type === 'video' ? 'movie' : (asset.type === 'audio' ? 'audiotrack' : 'description') }}
                      </span>
                    </div>
                    <div>
                      <h4 class="font-bold text-text-primary line-clamp-1">{{ asset.title }}</h4>
                      <span class="text-[10px] text-text-secondary">{{ asset.category }} • {{ asset.sizeFormatted }} • Uploaded by {{ asset.uploadedBy }}</span>
                    </div>
                  </div>
                  <button type="button" class="px-2.5 py-1 rounded-lg btn-gradient text-white text-[11px] font-bold">
                    Select
                  </button>
                </div>
              }
            </div>

            <div class="p-3 border-t border-base-300 dark:border-slate-800 text-right bg-base-200/30">
              <button 
                type="button" 
                (click)="showRepoPicker.set(false)"
                class="px-4 py-1.5 rounded-xl bg-base-200 hover:bg-base-300 text-xs font-semibold text-text-primary">
                Close
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class ForumWorkspaceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private lmsData = inject(LmsDataService);

  planId = input.required<string>();

  categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Announcements', label: '📢 Announcements' },
    { value: 'Field Q&A', label: '💬 Field Q&A' },
    { value: 'Disaster Relief', label: '🛡️ Disaster Relief' },
    { value: 'General Discussion', label: '💡 General Discussion' }
  ];

  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pinned', label: '📌 Pinned Only' },
    { value: 'locked', label: '🔒 Locked Topics' },
    { value: 'active', label: '⚡ Active / Open' }
  ];

  sortOptions = [
    { value: 'latest', label: 'Latest Activity' },
    { value: 'replies', label: 'Most Replies' },
    { value: 'oldest', label: 'Oldest First' }
  ];

  categoryFormOptions = [
    { value: 'General Discussion', label: '💡 General Discussion' },
    { value: 'Announcements', label: '📢 Announcements' },
    { value: 'Field Q&A', label: '💬 Field Q&A' },
    { value: 'Disaster Relief', label: '🛡️ Disaster Relief' },
    { value: 'Technical Setup', label: '⚙️ Technical Setup' }
  ];

  permissionOptions = [
    { value: 'instructorsAndTrainees', label: '👥 Instructors & Trainees' },
    { value: 'instructorsOnly', label: '🔒 Instructors Only (Announcements)' }
  ];

  searchQuery = signal<string>('');
  selectedSort = signal<string>('latest');
  draftSort = signal<string>('latest');
  isFilterPanelOpen = signal<boolean>(false);
  appliedFilters = signal<ForumFilters>({ ...DEFAULT_FORUM_FILTERS });
  draftFilters = signal<ForumFilters>({ ...DEFAULT_FORUM_FILTERS });

  activeTopic = signal<ForumTopic | null>(null);
  showCreateTopicModal = signal<boolean>(false);
  showRepoPicker = signal<boolean>(false);
  topicPickerTarget = signal<'modal' | 'reply'>('reply');
  topicFormSubmitted = signal<boolean>(false);

  replyText = signal<string>('');
  replyingToPostId = signal<string | null>(null);
  stagedAttachments = signal<ForumAttachment[]>([]);
  stagedTopicAttachments = signal<ForumAttachment[]>([]);

  categoryFilterOptions = [
    { 
      value: 'Announcements', 
      label: '📢 Announcements', 
      dotClass: 'bg-amber-500', 
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40' 
    },
    { 
      value: 'Field Q&A', 
      label: '💬 Field Q&A', 
      dotClass: 'bg-emerald-500', 
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40' 
    },
    { 
      value: 'Disaster Relief', 
      label: '🛡️ Disaster Relief', 
      dotClass: 'bg-rose-500', 
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40' 
    },
    { 
      value: 'General Discussion', 
      label: '💡 General Discussion', 
      dotClass: 'bg-indigo-500', 
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/40' 
    }
  ];

  statusFilterOptions = [
    { 
      value: 'pinned', 
      label: '📌 Pinned Only', 
      dotClass: 'bg-amber-500', 
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40' 
    },
    { 
      value: 'active', 
      label: '⚡ Active / Open', 
      dotClass: 'bg-emerald-500', 
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40' 
    },
    { 
      value: 'locked', 
      label: '🔒 Locked Topics', 
      dotClass: 'bg-rose-500', 
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40' 
    }
  ];

  currentForum = computed<DiscussionForum>(() => {
    return this.lmsData.getForumForPlan(this.planId());
  });

  repoAssets = computed<ContentRepoAsset[]>(() => {
    return this.lmsData.contentRepoAssets();
  });

  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return f.categories.length > 0 || f.statuses.length > 0 || this.selectedSort() !== 'latest';
  });

  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    const sortCount = this.selectedSort() !== 'latest' ? 1 : 0;
    return f.categories.length + f.statuses.length + sortCount;
  });

  filteredTopics = computed<ForumTopic[]>(() => {
    const forum = this.currentForum();
    let list = [...forum.topics];
    const q = this.searchQuery().toLowerCase().trim();
    const filters = this.appliedFilters();

    if (filters.categories.length > 0) {
      list = list.filter(t => filters.categories.includes(t.categoryTag));
    }
    if (filters.statuses.length > 0) {
      list = list.filter(t => {
        if (filters.statuses.includes('pinned') && t.pinned) return true;
        if (filters.statuses.includes('locked') && t.locked) return true;
        if (filters.statuses.includes('active') && !t.locked) return true;
        return false;
      });
    }
    if (q) {
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.posts.some(p => p.text.toLowerCase().includes(q))
      );
    }

    // Sort
    const sort = this.selectedSort();
    if (sort === 'replies') {
      list.sort((a, b) => b.postCount - a.postCount);
    } else if (sort === 'oldest') {
      list.reverse();
    } else {
      // Default: Pinned first, then latest
      list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    }

    return list;
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
  }

  getSortLabel(val: string): string {
    const opt = this.sortOptions.find(o => o.value === val);
    return opt ? opt.label : val;
  }

  toggleFilterPanel() {
    if (!this.isFilterPanelOpen()) {
      this.draftFilters.set(JSON.parse(JSON.stringify(this.appliedFilters())));
      this.draftSort.set(this.selectedSort());
    }
    this.isFilterPanelOpen.update(v => !v);
  }

  closeFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  toggleCategoryDraft(cat: string) {
    this.draftFilters.update(f => {
      const exists = f.categories.includes(cat);
      const next = exists ? f.categories.filter(c => c !== cat) : [...f.categories, cat];
      return { ...f, categories: next };
    });
  }

  toggleStatusDraft(stat: string) {
    this.draftFilters.update(f => {
      const exists = f.statuses.includes(stat);
      const next = exists ? f.statuses.filter(s => s !== stat) : [...f.statuses, stat];
      return { ...f, statuses: next };
    });
  }

  applyFilterPanel() {
    this.appliedFilters.set(JSON.parse(JSON.stringify(this.draftFilters())));
    this.selectedSort.set(this.draftSort());
    this.isFilterPanelOpen.set(false);
  }

  clearFilterPanelDraft() {
    this.draftFilters.set({
      categories: [],
      statuses: []
    });
    this.draftSort.set('latest');
  }

  resetAllFilters() {
    this.appliedFilters.set({
      categories: [],
      statuses: []
    });
    this.draftFilters.set({
      categories: [],
      statuses: []
    });
    this.selectedSort.set('latest');
    this.draftSort.set('latest');
    this.searchQuery.set('');
  }

  removeCategoryFilter(cat: string) {
    this.appliedFilters.update(f => ({
      ...f,
      categories: f.categories.filter(c => c !== cat)
    }));
    this.draftFilters.set(JSON.parse(JSON.stringify(this.appliedFilters())));
  }

  removeStatusFilter(stat: string) {
    this.appliedFilters.update(f => ({
      ...f,
      statuses: f.statuses.filter(s => s !== stat)
    }));
    this.draftFilters.set(JSON.parse(JSON.stringify(this.appliedFilters())));
  }

  getStatusLabel(stat: string): string {
    if (stat === 'pinned') return 'Pinned Only';
    if (stat === 'active') return 'Active / Open';
    if (stat === 'locked') return 'Locked Topics';
    return stat;
  }

  topicForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    categoryTag: ['General Discussion', [Validators.required]],
    postPermission: ['instructorsAndTrainees' as TopicPostPermission, [Validators.required]],
    initialPost: ['', [Validators.required, Validators.minLength(5)]],
    pinned: [false],
    locked: [false]
  });

  ngOnInit() {
    // Check if topic is active
  }

  getTopicAttachmentCount(topic: ForumTopic): number {
    return topic.posts.reduce((acc, p) => acc + (p.attachments?.length || 0), 0);
  }

  canModerate(): boolean {
    const role = this.lmsData.activeUser().role;
    return role.includes('admin') || role === 'instructor';
  }

  isPostingRestricted(): boolean {
    const top = this.activeTopic();
    if (!top) return false;
    if (top.postPermission === 'instructorsOnly') {
      const role = this.lmsData.activeUser().role;
      return !role.includes('admin') && role !== 'instructor';
    }
    return false;
  }

  selectTopic(topic: ForumTopic) {
    this.activeTopic.set(topic);
    this.replyText.set('');
    this.replyingToPostId.set(null);
    this.stagedAttachments.set([]);
  }

  openCreateTopicModal() {
    const role = this.lmsData.activeUser().role;
    const forum = this.currentForum();
    if (forum.topicCreationPermission === 'instructorsOnly' && !role.includes('admin') && role !== 'instructor') {
      this.lmsData.showToast("You don't have permission to create a topic here.", 'warning', 3500, 'Creation Restricted');
      return;
    }

    this.topicForm.reset({
      title: '',
      categoryTag: 'General Discussion',
      postPermission: 'instructorsAndTrainees',
      initialPost: '',
      pinned: false,
      locked: false
    });
    this.stagedTopicAttachments.set([]);
    this.topicFormSubmitted.set(false);
    this.showCreateTopicModal.set(true);
  }

  openRepoPickerFor(target: 'modal' | 'reply') {
    this.topicPickerTarget.set(target);
    this.showRepoPicker.set(true);
  }

  handleTopicDirectUpload(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      this.lmsData.showToast('Attachment exceeds the maximum allowed size of 50MB.', 'warning', 4000, 'Upload Exceeded');
      return;
    }

    let type: AttachmentType = 'file';
    if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    const att: ForumAttachment = {
      attachmentId: `att-dir-${Date.now()}`,
      source: 'directUpload',
      type,
      ref: URL.createObjectURL(file),
      name: file.name,
      sizeBytes: file.size,
      mime: file.type
    };

    this.stagedTopicAttachments.update(list => [...list, att]);
    this.lmsData.showToast(`File "${file.name}" attached to new topic draft.`, 'info', 2500, 'File Attached');
  }

  removeStagedTopicAttachment(idx: number) {
    this.stagedTopicAttachments.update(list => list.filter((_, i) => i !== idx));
  }

  saveNewTopic() {
    this.topicFormSubmitted.set(true);
    if (this.topicForm.invalid) {
      this.topicForm.markAllAsTouched();
      this.lmsData.showToast('Please provide a title and opening message for the topic.', 'warning', 3000, 'Form Incomplete');
      return;
    }

    const val = this.topicForm.value;
    const newTop = this.lmsData.createForumTopic(
      this.planId(),
      {
        title: val.title || 'Discussion Topic',
        categoryTag: val.categoryTag || 'General',
        postPermission: val.postPermission as TopicPostPermission,
        pinned: val.pinned ?? false,
        locked: val.locked ?? false
      },
      val.initialPost || '',
      this.stagedTopicAttachments()
    );

    this.showCreateTopicModal.set(false);
    this.stagedTopicAttachments.set([]);
    this.topicFormSubmitted.set(false);
    this.selectTopic(newTop);
  }

  togglePin(topicId: string) {
    this.lmsData.toggleTopicPin(topicId);
    if (this.activeTopic()?.topicId === topicId) {
      const t = this.currentForum().topics.find(x => x.topicId === topicId);
      if (t) this.activeTopic.set(t);
    }
  }

  toggleLock(topicId: string) {
    this.lmsData.toggleTopicLock(topicId);
    if (this.activeTopic()?.topicId === topicId) {
      const t = this.currentForum().topics.find(x => x.topicId === topicId);
      if (t) this.activeTopic.set(t);
    }
  }

  confirmDeletePost(postId: string) {
    if (confirm('Are you sure to delete this post?')) {
      this.lmsData.deleteOrHidePost(postId, true);
      const top = this.activeTopic();
      if (top) {
        const updated = this.currentForum().topics.find(t => t.topicId === top.topicId);
        if (updated) this.activeTopic.set(updated);
      }
    }
  }

  toggleLike(postId: string) {
    this.lmsData.togglePostLike(postId);
    const top = this.activeTopic();
    if (top) {
      const updated = this.currentForum().topics.find(t => t.topicId === top.topicId);
      if (updated) this.activeTopic.set(updated);
    }
  }

  prepareReply(postId: string) {
    this.replyingToPostId.set(postId);
  }

  attachRepoAsset(asset: ContentRepoAsset) {
    const att: ForumAttachment = {
      attachmentId: `att-repo-${Date.now()}`,
      source: 'contentRepository',
      type: asset.type,
      ref: asset.url,
      name: `${asset.title} (${asset.type.toUpperCase()})`,
      sizeBytes: asset.sizeBytes,
      mime: asset.type === 'video' ? 'video/mp4' : (asset.type === 'audio' ? 'audio/mpeg' : 'application/pdf'),
      thumbnailUrl: asset.thumbnailUrl
    };

    if (this.topicPickerTarget() === 'modal') {
      this.stagedTopicAttachments.update(list => [...list, att]);
      this.lmsData.showToast(`Asset "${asset.title}" added to topic attachments.`, 'info', 2500, 'Asset Attached');
    } else {
      this.stagedAttachments.update(list => [...list, att]);
    }
    this.showRepoPicker.set(false);
  }

  handleDirectUpload(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      this.lmsData.showToast('Attachment exceeds the maximum allowed size of 50MB.', 'warning', 4000, 'Upload Exceeded');
      return;
    }

    let type: AttachmentType = 'file';
    if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    const att: ForumAttachment = {
      attachmentId: `att-dir-${Date.now()}`,
      source: 'directUpload',
      type,
      ref: URL.createObjectURL(file),
      name: file.name,
      sizeBytes: file.size,
      mime: file.type
    };

    this.stagedAttachments.update(list => [...list, att]);
    this.lmsData.showToast(`File "${file.name}" staged for posting.`, 'info', 2500, 'File Staged');
  }

  removeStagedAttachment(idx: number) {
    this.stagedAttachments.update(list => list.filter((_, i) => i !== idx));
  }

  submitPostReply() {
    const top = this.activeTopic();
    if (!top) return;
    const txt = this.replyText().trim();

    if (!txt && this.stagedAttachments().length === 0) {
      this.lmsData.showToast('Please type a message or select an attachment.', 'warning', 3000, 'Empty Message');
      return;
    }

    this.lmsData.createForumPost(
      top.topicId,
      txt || 'Attached resources for review:',
      this.stagedAttachments(),
      this.replyingToPostId()
    );

    // Refresh active topic
    const updated = this.currentForum().topics.find(t => t.topicId === top.topicId);
    if (updated) this.activeTopic.set(updated);

    this.replyText.set('');
    this.replyingToPostId.set(null);
    this.stagedAttachments.set([]);
  }
}
