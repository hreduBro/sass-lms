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

@Component({
  selector: 'app-forum-workspace',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CustomAvatarComponent],
  template: `
    <div class="space-y-6">
      
      <!-- Forum Header & Permissions Banner -->
      <div class="p-6 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div class="flex items-center flex-wrap gap-2">
            <span class="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
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
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800 text-[11px] text-text-secondary">
            <span class="material-symbols-outlined text-xs text-indigo-500">lock_person</span>
            <span>Creation: <strong>{{ currentForum().topicCreationPermission === 'instructorsOnly' ? 'Instructors Only' : 'Instructors & Trainees' }}</strong></span>
          </div>

          <button 
            type="button" 
            (click)="openCreateTopicModal()"
            class="px-4 py-2.5 rounded-xl btn-gradient text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity cursor-pointer">
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
          
          <!-- Search & Filter Controls -->
          <div class="p-4 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div class="flex items-center flex-wrap gap-3 flex-1">
              
              <!-- Search Keyword -->
              <div class="relative min-w-[240px] flex-1 max-w-md">
                <span class="material-symbols-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
                <input 
                  type="text" 
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  placeholder="Search topics by title or post keywords..."
                  class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-base-200/60 border border-base-300 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:border-tenant-600" />
              </div>

              <!-- Category Filter -->
              <select 
                [ngModel]="selectedCategory()"
                (ngModelChange)="selectedCategory.set($event)"
                class="px-3 py-1.5 rounded-xl bg-base-200/60 border border-base-300 dark:border-slate-700 text-xs font-medium text-text-primary focus:outline-none">
                <option value="all">All Categories</option>
                <option value="Announcements">📢 Announcements</option>
                <option value="Field Q&A">💬 Field Q&A</option>
                <option value="Disaster Relief">🛡️ Disaster Relief</option>
                <option value="General Discussion">💡 General Discussion</option>
              </select>

              <!-- Status Filter -->
              <select 
                [ngModel]="selectedStatusFilter()"
                (ngModelChange)="selectedStatusFilter.set($event)"
                class="px-3 py-1.5 rounded-xl bg-base-200/60 border border-base-300 dark:border-slate-700 text-xs font-medium text-text-primary focus:outline-none">
                <option value="all">All Statuses</option>
                <option value="pinned">📌 Pinned Only</option>
                <option value="locked">🔒 Locked Topics</option>
                <option value="active">⚡ Active / Open</option>
              </select>

            </div>

            <!-- Sort -->
            <div class="flex items-center gap-2 text-xs text-text-secondary">
              <span>Sort by:</span>
              <select 
                [ngModel]="selectedSort()"
                (ngModelChange)="selectedSort.set($event)"
                class="px-2.5 py-1.5 rounded-xl bg-base-200/60 border border-base-300 dark:border-slate-700 text-xs font-semibold text-text-primary focus:outline-none">
                <option value="latest">Latest Activity</option>
                <option value="replies">Most Replies</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

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
                    (click)="showRepoPicker.set(true)"
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
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div class="w-full max-w-lg rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-2xl overflow-hidden">
            
            <div class="p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-tenant-600 text-white flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">forum</span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-text-primary">Create Discussion Topic</h3>
                  <p class="text-[11px] text-text-secondary">Start a new thread in this plan's forum</p>
                </div>
              </div>
              <button 
                type="button" 
                (click)="showCreateTopicModal.set(false)"
                class="w-7 h-7 rounded-lg hover:bg-base-300 flex items-center justify-center text-text-secondary">
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form [formGroup]="topicForm" (ngSubmit)="saveNewTopic()" class="p-6 space-y-4 text-xs">
              
              <!-- Topic Title -->
              <div>
                <label class="font-bold text-text-primary block mb-1">Topic Title</label>
                <input 
                  type="text" 
                  formControlName="title"
                  placeholder="e.g. Phase 2 Field Tablet Synchronization Troubleshooting"
                  class="w-full px-3 py-2 rounded-xl bg-base-200/70 border border-base-300 dark:border-slate-700 text-text-primary font-semibold focus:outline-none focus:border-tenant-600" />
              </div>

              <!-- Category & Posting Permissions -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-text-primary block mb-1">Category Tag</label>
                  <select formControlName="categoryTag" class="w-full px-3 py-2 rounded-xl bg-base-200/70 border border-base-300 dark:border-slate-700 text-text-primary">
                    <option value="General Discussion">General Discussion</option>
                    <option value="Announcements">Announcements</option>
                    <option value="Field Q&A">Field Q&A</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Technical Setup">Technical Setup</option>
                  </select>
                </div>

                <div>
                  <label class="font-bold text-text-primary block mb-1">Posting Permissions</label>
                  <select formControlName="postPermission" class="w-full px-3 py-2 rounded-xl bg-base-200/70 border border-base-300 dark:border-slate-700 text-text-primary">
                    <option value="instructorsAndTrainees">Instructors & Trainees</option>
                    <option value="instructorsOnly">Instructors Only</option>
                  </select>
                </div>
              </div>

              <!-- Initial Post Text -->
              <div>
                <label class="font-bold text-text-primary block mb-1">Initial Opening Post</label>
                <textarea 
                  formControlName="initialPost"
                  rows="4"
                  placeholder="Provide context, instructions, or initial questions..."
                  class="w-full px-3 py-2 rounded-xl bg-base-200/70 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:border-tenant-600">
                </textarea>
              </div>

              <!-- Actions -->
              <div class="pt-3 border-t border-base-300 dark:border-slate-800 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  (click)="showCreateTopicModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary font-semibold">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="px-5 py-2 rounded-xl btn-gradient text-white font-bold shadow-sm cursor-pointer">
                  Publish Topic
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
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
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

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  selectedStatusFilter = signal<string>('all');
  selectedSort = signal<string>('latest');

  activeTopic = signal<ForumTopic | null>(null);
  showCreateTopicModal = signal<boolean>(false);
  showRepoPicker = signal<boolean>(false);

  replyText = signal<string>('');
  replyingToPostId = signal<string | null>(null);
  stagedAttachments = signal<ForumAttachment[]>([]);

  currentForum = computed<DiscussionForum>(() => {
    return this.lmsData.getForumForPlan(this.planId());
  });

  repoAssets = computed<ContentRepoAsset[]>(() => {
    return this.lmsData.contentRepoAssets();
  });

  filteredTopics = computed<ForumTopic[]>(() => {
    const forum = this.currentForum();
    let list = [...forum.topics];
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const stat = this.selectedStatusFilter();

    if (cat !== 'all') {
      list = list.filter(t => t.categoryTag === cat);
    }
    if (stat === 'pinned') {
      list = list.filter(t => t.pinned);
    } else if (stat === 'locked') {
      list = list.filter(t => t.locked);
    } else if (stat === 'active') {
      list = list.filter(t => !t.locked);
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

  topicForm = this.fb.group({
    title: ['', [Validators.required]],
    categoryTag: ['General Discussion', [Validators.required]],
    postPermission: ['instructorsAndTrainees' as TopicPostPermission, [Validators.required]],
    initialPost: ['', [Validators.required]]
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
      initialPost: ''
    });
    this.showCreateTopicModal.set(true);
  }

  saveNewTopic() {
    if (this.topicForm.invalid) return;

    const val = this.topicForm.value;
    const newTop = this.lmsData.createForumTopic(
      this.planId(),
      {
        title: val.title || 'Discussion Topic',
        categoryTag: val.categoryTag || 'General',
        postPermission: val.postPermission as TopicPostPermission
      },
      val.initialPost || '',
      []
    );

    this.showCreateTopicModal.set(false);
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

    this.stagedAttachments.update(list => [...list, att]);
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
