import { Component, inject, computed, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Plan, Phase, PlanOwner } from '../../../models/plan.model';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';
import { AssignOwnerModalComponent } from '../assign-owner-modal/assign-owner-modal.component';
import { EditPlanModalComponent } from '../edit-plan-modal/edit-plan-modal.component';
import { PhaseDetailsModalComponent } from '../phase-details-modal/phase-details-modal.component';
import { RatingsViewComponent } from '../../engagement/ratings-view/ratings-view.component';
import { FeedbackStudioComponent } from '../../engagement/feedback-studio/feedback-studio.component';
import { ForumWorkspaceComponent } from '../../engagement/forum-workspace/forum-workspace.component';
import { TranscriptSheetComponent } from '../../../components/transcript-sheet/transcript-sheet.component';
import { TranscriptRecord } from '../../../models/transcript.model';

@Component({
  selector: 'app-plan-details',
  imports: [
    CommonModule,
    RouterModule,
    CustomAvatarComponent,
    AssignOwnerModalComponent,
    EditPlanModalComponent,
    PhaseDetailsModalComponent,
    RatingsViewComponent,
    FeedbackStudioComponent,
    ForumWorkspaceComponent,
    TranscriptSheetComponent
  ],
  template: `
    <div class="space-y-6 pb-12 animate-fade-in">
      
      <!-- Top Navigation & LMS Scope Breadcrumb -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button 
            id="back-to-plan-grid-btn"
            type="button" 
            (click)="goBackToGrid()"
            class="w-9 h-9 rounded-xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 hover:bg-base-200 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors shadow-sm cursor-pointer">
            <span class="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <div class="flex items-center gap-2 text-xs text-text-secondary">
              <span class="hover:underline cursor-pointer" (click)="goBackToGrid()">Plan Management</span>
              <span>/</span>
              <span class="text-text-primary font-medium">Plan Details</span>
            </div>
            <h1 class="text-xl font-bold text-text-primary mt-0.5 flex items-center gap-2.5">
              {{ currentPlan()?.name || 'Plan Details' }}
              @if (currentPlan()) {
                <span class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                  {{ currentPlan()?.planCode }}
                </span>
              }
            </h1>
          </div>
        </div>

        <!-- LMS Workspace Context Badge -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-base-200 dark:bg-base-300/50 border border-base-300 dark:border-slate-800 text-xs text-text-secondary">
          <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-400">layers</span>
          <span>Fixed Workspace:</span>
          <span class="font-semibold text-text-primary">{{ activeLms().basicInfo.lmsName }}</span>
        </div>
      </div>

      @if (!currentPlan()) {
        <!-- Not Found State -->
        <div class="p-12 text-center rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200">
          <div class="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
          </div>
          <h3 class="text-base font-bold text-text-primary">Plan Not Found</h3>
          <p class="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            The requested Plan ID does not exist or does not belong to this LMS workspace.
          </p>
          <button 
            type="button" 
            (click)="goBackToGrid()"
            class="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-tenant-600 text-white hover:bg-tenant-700 transition-colors">
            Return to Plan Grid
          </button>
        </div>
      } @else {

        <!-- Top-Level Tab Switcher (Curriculum vs Engagement Modules) -->
        <div class="flex items-center gap-2 p-1.5 bg-base-200/80 dark:bg-base-300/50 rounded-2xl border border-base-300 dark:border-slate-800 overflow-x-auto">
          <button 
            type="button"
            (click)="activeMainTab.set('curriculum')"
            [class.bg-base-100]="activeMainTab() === 'curriculum'"
            [class.shadow-xs]="activeMainTab() === 'curriculum'"
            [class.text-tenant-600]="activeMainTab() === 'curriculum'"
            [class.dark:text-tenant-400]="activeMainTab() === 'curriculum'"
            [class.text-text-secondary]="activeMainTab() !== 'curriculum'"
            class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined text-sm">auto_stories</span>
            <span>Curriculum & Phase Structure</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-base-200 dark:bg-base-300 text-text-secondary">
              {{ phasesList().length }}
            </span>
          </button>

          <button 
            type="button"
            (click)="activeMainTab.set('ratings')"
            [class.bg-base-100]="activeMainTab() === 'ratings'"
            [class.shadow-xs]="activeMainTab() === 'ratings'"
            [class.text-tenant-600]="activeMainTab() === 'ratings'"
            [class.dark:text-tenant-400]="activeMainTab() === 'ratings'"
            [class.text-text-secondary]="activeMainTab() !== 'ratings'"
            class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined text-sm text-amber-500">star</span>
            <span>Ratings & Reviews</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold">
              {{ planRatingsCount() }}
            </span>
          </button>

          <button 
            type="button"
            (click)="activeMainTab.set('feedback')"
            [class.bg-base-100]="activeMainTab() === 'feedback'"
            [class.shadow-xs]="activeMainTab() === 'feedback'"
            [class.text-tenant-600]="activeMainTab() === 'feedback'"
            [class.dark:text-tenant-400]="activeMainTab() === 'feedback'"
            [class.text-text-secondary]="activeMainTab() !== 'feedback'"
            class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined text-sm text-indigo-500">rate_review</span>
            <span>Feedback Forms & Studio</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold">
              {{ planFeedbackResponsesCount() }}
            </span>
          </button>

          <button 
            type="button"
            (click)="activeMainTab.set('forum')"
            [class.bg-base-100]="activeMainTab() === 'forum'"
            [class.shadow-xs]="activeMainTab() === 'forum'"
            [class.text-tenant-600]="activeMainTab() === 'forum'"
            [class.dark:text-tenant-400]="activeMainTab() === 'forum'"
            [class.text-text-secondary]="activeMainTab() !== 'forum'"
            class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined text-sm text-emerald-500">forum</span>
            <span>Cohort Discussion Forum</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold">
              {{ planForumTopicsCount() }}
            </span>
          </button>

          <button 
            type="button"
            (click)="activeMainTab.set('evaluations')"
            [class.bg-base-100]="activeMainTab() === 'evaluations'"
            [class.shadow-xs]="activeMainTab() === 'evaluations'"
            [class.text-tenant-600]="activeMainTab() === 'evaluations'"
            [class.dark:text-tenant-400]="activeMainTab() === 'evaluations'"
            [class.text-text-secondary]="activeMainTab() !== 'evaluations'"
            class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined text-sm text-cyan-600 dark:text-cyan-400">quiz</span>
            <span>Pre/Post Tests & Transcripts</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 font-bold">
              {{ planTranscriptsCount() + planTestResponsesCount() }}
            </span>
          </button>
        </div>

        <!-- ================================================================= -->
        <!-- TAB 1: CURRICULUM & PHASE STRUCTURE                              -->
        <!-- ================================================================= -->
        @if (activeMainTab() === 'curriculum') {
          <div class="space-y-6 animate-fade-in">
            <!-- PLAN SUMMARY CARD (All 11 Fields + Description + Action Toolbar)  -->
            <div id="plan-summary-card" class="rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 overflow-hidden shadow-sm">
          
          <!-- Card Header & Action Toolbar -->
          <div class="p-6 border-b border-base-300 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-base-200/40 dark:bg-base-300/20">
            <div>
              <div class="flex items-center gap-2.5">
                <span 
                  class="px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider"
                  [ngClass]="getStatusBadgeClass(currentPlan()!.status)">
                  {{ currentPlan()!.status }}
                </span>
                <span class="text-xs text-text-secondary">
                  Created on <strong class="text-text-primary">{{ currentPlan()!.createdDate }}</strong> by {{ currentPlan()!.createdBy }}
                </span>
                <span class="text-text-secondary text-xs">•</span>
                <span class="text-xs text-text-secondary">
                  Updated <strong class="text-text-primary">{{ currentPlan()!.updatedDate }}</strong>
                </span>
              </div>
              <h2 class="text-lg font-bold text-text-primary mt-2">{{ currentPlan()!.name }}</h2>
            </div>

            <!-- Action Toolbar Buttons -->
            <div class="flex items-center flex-wrap gap-2">
              
              <!-- Assign Plan Owner Button -->
              @if (currentPlan()!.status !== 'Archived') {
                <button 
                  id="assign-owner-action-btn"
                  type="button"
                  (click)="openAssignOwnerModal()"
                  class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-base-100 dark:bg-base-200 hover:bg-base-300/60 border border-base-300 dark:border-slate-700 text-text-primary flex items-center gap-1.5 shadow-sm transition-all">
                  <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-400">person_add</span>
                  <span>{{ currentPlan()!.owner?.name ? 'Change Owner' : 'Assign Owner' }}</span>
                </button>
              }

              <!-- Edit Plan Button -->
              @if (currentPlan()!.status !== 'Archived') {
                <button 
                  id="edit-plan-action-btn"
                  type="button"
                  (click)="openEditPlanModal()"
                  class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-base-100 dark:bg-base-200 hover:bg-base-300/60 border border-base-300 dark:border-slate-700 text-text-primary flex items-center gap-1.5 shadow-sm transition-all">
                  <span class="material-symbols-outlined text-sm">edit</span>
                  <span>Edit Plan</span>
                </button>
              }

              <!-- Activate Button (§11: Published -> Active) -->
              @if (currentPlan()!.status === 'Published') {
                <button 
                  id="activate-plan-action-btn"
                  type="button"
                  (click)="promptActivatePlan()"
                  class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all">
                  <span class="material-symbols-outlined text-sm">play_circle</span>
                  <span>Activate Plan</span>
                </button>
              }

              <!-- Archive Button (§12) -->
              @if (currentPlan()!.status !== 'Archived') {
                <button 
                  id="archive-plan-action-btn"
                  type="button"
                  (click)="promptArchivePlan()"
                  class="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1.5 transition-all">
                  <span class="material-symbols-outlined text-sm">archive</span>
                  <span>Archive</span>
                </button>
              }

            </div>
          </div>

          <!-- 11 Fields Key-Value Structured Grid -->
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
            
            <!-- 1. Plan Code -->
            <div class="p-3.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
              <span class="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Plan Code</span>
              <div class="font-mono font-bold text-tenant-700 dark:text-tenant-300 text-sm mt-1">
                {{ currentPlan()!.planCode }}
              </div>
            </div>

            <!-- 2. Plan Owner -->
            <div class="p-3.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 sm:col-span-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Plan Owner / Administrator</span>
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
              </div>
              <div class="flex items-center gap-2.5 mt-1">
                <app-custom-avatar 
                  [name]="currentPlan()!.owner?.name || 'Not assigned'" 
                  size="sm" 
                  shape="squircle">
                </app-custom-avatar>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-text-primary truncate">{{ currentPlan()!.owner?.name || 'Not assigned' }}</div>
                  <div class="text-[11px] text-text-secondary truncate">{{ currentPlan()!.owner?.email || '—' }} • {{ currentPlan()!.owner?.contactNumber || 'No phone' }}</div>
                </div>
              </div>
            </div>

            <!-- 3. Duration Type -->
            <div class="p-3.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
              <span class="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Duration Type</span>
              <div class="font-bold text-text-primary text-xs mt-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-indigo-500">schedule</span>
                {{ currentPlan()!.durationType }}
              </div>
            </div>

            <!-- 4. Start Date -->
            <div class="p-3.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
              <span class="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Plan Start Date</span>
              <div class="font-bold text-text-primary text-xs mt-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-teal-500">calendar_today</span>
                {{ currentPlan()!.startDate }}
              </div>
            </div>

            <!-- 5. End Date -->
            <div class="p-3.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
              <span class="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Plan End Date</span>
              <div class="font-bold text-text-primary text-xs mt-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-rose-500">event_busy</span>
                {{ currentPlan()!.endDate }}
              </div>
            </div>

            <!-- 6. Number of Phases -->
            <div class="p-3.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
              <span class="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Phase Count</span>
              <div class="font-bold text-tenant-600 dark:text-tenant-400 text-xs mt-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">timeline</span>
                {{ currentPlan()!.phases?.length || currentPlan()!.phaseCount }} Structured Phases
              </div>
            </div>

            <!-- 7. Enrollment Type -->
            <div class="p-3.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
              <span class="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Enrollment Model</span>
              <div class="mt-1">
                <span 
                  class="px-2 py-0.5 rounded text-[11px] font-bold"
                  [ngClass]="currentPlan()!.enrollmentType === 'Open' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'">
                  {{ currentPlan()!.enrollmentType }} Enrollment
                </span>
              </div>
            </div>

          </div>

          <!-- Description Section -->
          @if (currentPlan()!.description) {
            <div class="px-6 pb-6 text-xs">
              <div class="p-4 rounded-xl bg-base-200/30 dark:bg-base-300/10 border border-base-300 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold tracking-wider text-text-secondary block mb-1">Plan Description & Objectives</span>
                <p class="text-text-primary leading-relaxed">
                  {{ currentPlan()!.description }}
                </p>
                @if (currentPlan()!.recurringPlan) {
                  <div class="mt-3 pt-3 border-t border-base-300/60 dark:border-slate-800/60 text-[11px] text-text-secondary flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-xs text-indigo-500">replay</span>
                    <span>Recurring Schedule: <strong>{{ currentPlan()!.recurringPlan }}</strong></span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- ================================================================= -->
        <!-- EMBEDDED PHASE GRID (§9: Phase Structure & Learning Journey)       -->
        <!-- ================================================================= -->
        <div id="plan-phase-grid-container" class="rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 overflow-hidden shadow-sm">
          
          <!-- Phase Section Header -->
          <div class="px-6 py-4 border-b border-base-300 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-200/40 dark:bg-base-300/20">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-text-primary">Phase Structure & Learning Journey</h3>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                  {{ phasesList().length }} Phases
                </span>
              </div>
              <p class="text-xs text-text-secondary mt-0.5">
                Sequential learning milestones within {{ currentPlan()!.startDate }} — {{ currentPlan()!.endDate }}
              </p>
            </div>

            <!-- Add Phase Button & Validation Badge -->
            <div class="flex items-center gap-3">
              <button 
                type="button" 
                (click)="navigateToAddPhase()"
                class="px-3.5 py-1.5 rounded-xl btn-gradient text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-opacity cursor-pointer">
                <span class="material-symbols-outlined text-sm">add_circle</span>
                <span>Add Phase (Flow)</span>
              </button>
              <div class="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary">
                <span class="material-symbols-outlined text-sm text-emerald-500">verified</span>
                <span>Sequence Validated</span>
              </div>
            </div>
          </div>

          <!-- Phase Table -->
          @if (phasesList().length === 0) {
            <div class="p-10 text-center text-xs text-text-secondary space-y-3">
              <span class="material-symbols-outlined text-4xl text-text-secondary/40">view_timeline</span>
              <p class="font-medium text-text-primary">No learning phases are structured for this Plan yet.</p>
              <p class="text-text-secondary max-w-sm mx-auto">Create sequential phases to assign accredited courses, operational tasks, and verifiable completion certificates.</p>
              <button 
                type="button" 
                (click)="navigateToAddPhase()"
                class="px-4 py-2 rounded-xl btn-gradient text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer">
                <span class="material-symbols-outlined text-sm">add_circle</span>
                <span>Launch Phase Creation Wizard</span>
              </button>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-base-300 dark:border-slate-800 bg-base-200/50 dark:bg-base-300/40 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    <th class="py-3 px-4 w-12 text-center">Seq</th>
                    <th class="py-3 px-4">Phase Name</th>
                    <th class="py-3 px-4">Timeline (Start - End)</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-4 text-center">Courses</th>
                    <th class="py-3 px-4 text-center">Tasks</th>
                    <th class="py-3 px-4 text-center">Delivery Classes</th>
                    <th class="py-3 px-4">Prerequisites</th>
                    <th class="py-3 px-4">Certificate / Badge</th>
                    <th class="py-3.5 px-4 text-right sticky right-0 bg-base-200 dark:bg-base-300 z-30 w-[140px] min-w-[140px] border-b border-l border-base-300 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.4)]">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-base-300 dark:divide-slate-800/80">
                  @for (phase of phasesList(); track phase.id) {
                    <tr class="hover:bg-base-200/40 dark:hover:bg-base-300/30 transition-colors">
                      
                      <!-- Sequence -->
                      <td class="py-3 px-4 text-center">
                        <span class="w-6 h-6 rounded-md bg-base-200 dark:bg-base-300 font-bold text-text-primary text-[11px] inline-flex items-center justify-center">
                          #{{ phase.sequence }}
                        </span>
                      </td>

                      <!-- Phase Name -->
                      <td class="py-3 px-4 font-semibold text-text-primary">
                        {{ phase.name }}
                        @if (phase.description) {
                          <div class="text-[11px] font-normal text-text-secondary truncate max-w-xs mt-0.5">
                            {{ phase.description }}
                          </div>
                        }
                      </td>

                      <!-- Dates -->
                      <td class="py-3 px-4 whitespace-nowrap text-text-secondary">
                        <div class="flex items-center gap-1 font-medium text-text-primary">
                          <span class="material-symbols-outlined text-xs text-tenant-500">calendar_today</span>
                          <span>{{ phase.startDate }}</span>
                          <span class="text-text-secondary">→</span>
                          <span>{{ phase.endDate }}</span>
                        </div>
                      </td>

                      <!-- Status -->
                      <td class="py-3 px-4 whitespace-nowrap">
                        <span 
                          class="px-2 py-0.5 rounded text-[11px] font-semibold border"
                          [ngClass]="getStatusBadgeClass(phase.status)">
                          {{ phase.status }}
                        </span>
                      </td>

                      <!-- Course Count -->
                      <td class="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {{ phase.courseCount }}
                      </td>

                      <!-- Task Count -->
                      <td class="py-3 px-4 text-center font-bold text-text-primary">
                        {{ phase.taskCount }}
                      </td>

                      <!-- Delivery Class Count -->
                      <td class="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {{ phase.deliveryClassCount }}
                      </td>

                      <!-- Prerequisite Status -->
                      <td class="py-3 px-4 whitespace-nowrap">
                        <span 
                          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          [ngClass]="getPrerequisiteBadgeClass(phase.prerequisiteStatus)">
                          {{ phase.prerequisiteStatus }}
                        </span>
                      </td>

                      <!-- Certificate / Badge Status -->
                      <td class="py-3 px-4 whitespace-nowrap">
                        <span 
                          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          [ngClass]="getCertificateBadgeClass(phase.certificateBadgeStatus)">
                          {{ phase.certificateBadgeStatus }}
                        </span>
                      </td>

                      <!-- Actions: View Details, Edit, Delete (Sticky Action Column) -->
                      <td class="py-3 px-4 text-right sticky right-0 bg-base-100 dark:bg-base-100 group-hover:bg-slate-50 dark:group-hover:bg-base-200 transition-colors z-10 w-[140px] min-w-[140px] border-b border-l border-base-300/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.4)]">
                        <div class="flex items-center justify-end gap-1.5" (click)="$event.stopPropagation()">
                          <button 
                            type="button"
                            (click)="openPhaseDetails(phase)"
                            class="p-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-slate-400 hover:text-tenant-600 transition-colors cursor-pointer"
                            title="View Phase Details">
                            <span class="material-symbols-outlined text-base">visibility</span>
                          </button>
                          <button 
                            type="button"
                            (click)="navigateToEditPhase(phase.id)"
                            class="p-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-slate-400 hover:text-tenant-600 transition-colors cursor-pointer"
                            title="Edit Phase in 8-Step Wizard">
                            <span class="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button 
                            type="button"
                            (click)="deletePhase(phase.id)"
                            class="p-1.5 rounded-lg bg-base-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Phase">
                            <span class="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

        </div>
      </div>
    } @else if (activeMainTab() === 'ratings') {
      <div class="animate-fade-in">
        <app-ratings-view [planId]="currentPlan()!.id"></app-ratings-view>
      </div>
    } @else if (activeMainTab() === 'feedback') {
      <div class="animate-fade-in">
        <app-feedback-studio [planId]="currentPlan()!.id"></app-feedback-studio>
      </div>
    } @else if (activeMainTab() === 'forum') {
      <div class="animate-fade-in">
        <app-forum-workspace [planId]="currentPlan()!.id"></app-forum-workspace>
      </div>
    } @else if (activeMainTab() === 'evaluations') {
      <div class="space-y-6 animate-fade-in">
        <!-- Diagnostic Summary Header Card -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-base-300 dark:border-slate-800">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300">
                  Diagnostic & Summative Suite
                </span>
                <span class="text-xs text-text-secondary">•</span>
                <span class="text-xs text-text-secondary">Plan-Level Diagnostics & Academic Transcripts</span>
              </div>
              <h2 class="text-lg font-bold text-text-primary mt-1">Pre-Test, Post-Test & Academic Transcripts</h2>
              <p class="text-xs text-text-secondary mt-0.5">
                Measure learner knowledge delta between baseline diagnostic and summative competency evaluation.
              </p>
            </div>
            
            <div class="flex items-center gap-2">
              <a 
                routerLink="/transcripts"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-base-200 hover:bg-base-300 border border-base-300 dark:border-slate-700 text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-sm text-cyan-600">article</span>
                <span>Open Transcripts Hub</span>
              </a>
              <a 
                routerLink="/engagement/questionnaires"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-tenant-600 hover:bg-tenant-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-sm">quiz</span>
                <span>Questionnaires Studio</span>
              </a>
            </div>
          </div>

          <!-- Evaluation KPI Metric Trio -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Pre-Test Card -->
            <div class="p-4 rounded-2xl bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base">quiz</span>
                  Pre-Test Baseline Diagnostic
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-200/80 dark:bg-cyan-900/70 text-cyan-900 dark:text-cyan-200">
                  {{ preTestResponses().length }} Submissions
                </span>
              </div>
              <div class="flex items-baseline gap-2">
                <div class="text-2xl font-black text-text-primary">{{ averagePreTestScore() }}%</div>
                <div class="text-xs text-text-secondary">Average Baseline Score</div>
              </div>
              <div class="text-[11px] text-text-secondary truncate">
                Questionnaire: {{ currentPlan()?.evaluation?.preTest?.questionnaireTitle || 'Baseline Technical Aptitude Q-2026' }}
              </div>
            </div>

            <!-- Post-Test Card -->
            <div class="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base">assignment_turned_in</span>
                  Summative Post-Test
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200">
                  {{ postTestResponses().length }} Submissions
                </span>
              </div>
              <div class="flex items-baseline gap-2">
                <div class="text-2xl font-black text-text-primary">{{ averagePostTestScore() }}%</div>
                <div class="text-xs text-text-secondary">Average Final Score</div>
              </div>
              <div class="text-[11px] text-text-secondary truncate">
                Questionnaire: {{ currentPlan()?.evaluation?.postTest?.questionnaireTitle || 'Comprehensive Summative Evaluation Q-2026' }}
              </div>
            </div>

            <!-- Competency Growth Delta -->
            <div class="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base">trending_up</span>
                  Competency Lift (Delta)
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200/80 dark:bg-indigo-900/70 text-indigo-900 dark:text-indigo-200">
                  Net Gain
                </span>
              </div>
              <div class="flex items-baseline gap-2">
                <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  +{{ knowledgeGainDelta() }}%
                </div>
                <div class="text-xs text-text-secondary">Knowledge Growth</div>
              </div>
              <div class="text-[11px] text-text-secondary">
                Calculated across paired pre/post-test cohorts.
              </div>
            </div>
          </div>
        </div>

        <!-- Academic Transcripts for this Plan -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-base-300 dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-lg text-cyan-600">history_edu</span>
                Plan Academic Transcripts
              </h3>
              <p class="text-xs text-text-secondary">Official student transcripts generated for this learning plan.</p>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs text-text-secondary">
                <strong>{{ planTranscripts().length }}</strong> transcript(s) issued
              </span>
            </div>
          </div>

          @if (planTranscripts().length === 0) {
            <div class="p-8 text-center rounded-xl bg-base-200/40 border border-base-300 dark:border-slate-800 space-y-2">
              <span class="material-symbols-outlined text-3xl text-text-secondary">school</span>
              <p class="text-xs font-semibold text-text-primary">No Transcripts Issued Yet</p>
              <p class="text-[11px] text-text-secondary max-w-sm mx-auto">
                Transcripts will be automatically minted as learners complete required courses and phases in this plan.
              </p>
            </div>
          } @else {
            <div class="overflow-x-auto rounded-xl border border-base-300 dark:border-slate-800">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-base-200/60 dark:bg-base-300/40 border-b border-base-300 dark:border-slate-800 text-text-secondary font-bold">
                    <th class="py-2.5 px-3.5">Transcript Code</th>
                    <th class="py-2.5 px-3.5">Trainee / Learner</th>
                    <th class="py-2.5 px-3.5">Scope</th>
                    <th class="py-2.5 px-3.5">GPA / Grade</th>
                    <th class="py-2.5 px-3.5">Credits / Completion</th>
                    <th class="py-2.5 px-3.5">Release Status</th>
                    <th class="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-base-300 dark:divide-slate-800 text-text-primary">
                  @for (t of planTranscripts(); track t.id) {
                    <tr class="hover:bg-base-200/40 transition-colors">
                      <td class="py-3 px-3.5 font-mono font-bold text-tenant-600 dark:text-tenant-400">
                        {{ t.transcriptCode }}
                      </td>
                      <td class="py-3 px-3.5">
                        <div class="font-bold">{{ t.traineeName }}</div>
                        <div class="text-[11px] text-text-secondary">{{ t.traineeEmail }}</div>
                      </td>
                      <td class="py-3 px-3.5">
                        <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-base-200 dark:bg-base-300">
                          {{ t.scope }}
                        </span>
                      </td>
                      <td class="py-3 px-3.5 font-semibold">
                        {{ t.overallGpa.toFixed(2) }} ({{ t.overallGrade }})
                      </td>
                      <td class="py-3 px-3.5">
                        <span class="font-bold">{{ t.totalCreditsEarned }}/{{ t.totalCreditsAttempted }} Credits</span>
                        <div class="text-[10px] text-text-secondary">{{ t.overallCompletionPct }}% Completed</div>
                      </td>
                      <td class="py-3 px-3.5">
                        <span 
                          class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                          [ngClass]="{
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300': t.releaseState === 'released',
                            'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300': t.releaseState === 'available',
                            'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300': t.releaseState === 'pending',
                            'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300': t.releaseState === 'revoked'
                          }">
                          {{ t.releaseState | uppercase }}
                        </span>
                      </td>
                      <td class="py-3 px-3.5 text-right">
                        <button 
                          type="button" 
                          (click)="viewTranscriptRecord(t)"
                          class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-300 border border-tenant-200 dark:border-tenant-800 hover:bg-tenant-100 transition-colors cursor-pointer">
                          View Sheet
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Evaluation Submissions Feed Table -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-lg text-indigo-600">fact_check</span>
                Recent Diagnostic Submissions
              </h3>
              <p class="text-xs text-text-secondary">Live stream of trainee pre and post test assessment results.</p>
            </div>
            <span class="text-xs text-text-secondary">
              <strong>{{ planTestResponses().length }}</strong> total submission(s)
            </span>
          </div>

          @if (planTestResponses().length === 0) {
            <div class="p-8 text-center rounded-xl bg-base-200/40 border border-base-300 dark:border-slate-800 space-y-2">
              <span class="material-symbols-outlined text-3xl text-text-secondary">quiz</span>
              <p class="text-xs font-semibold text-text-primary">No Evaluation Submissions Yet</p>
              <p class="text-[11px] text-text-secondary max-w-sm mx-auto">
                Once enrolled trainees complete pre-tests or post-tests, their submission records and scores will appear here.
              </p>
            </div>
          } @else {
            <div class="overflow-x-auto rounded-xl border border-base-300 dark:border-slate-800">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-base-200/60 dark:bg-base-300/40 border-b border-base-300 dark:border-slate-800 text-text-secondary font-bold">
                    <th class="py-2.5 px-3.5">Type</th>
                    <th class="py-2.5 px-3.5">Learner</th>
                    <th class="py-2.5 px-3.5">Questionnaire</th>
                    <th class="py-2.5 px-3.5">Score</th>
                    <th class="py-2.5 px-3.5">Status</th>
                    <th class="py-2.5 px-3.5">Submitted At</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-base-300 dark:divide-slate-800 text-text-primary">
                  @for (r of planTestResponses(); track r.id) {
                    <tr class="hover:bg-base-200/40 transition-colors">
                      <td class="py-3 px-3.5">
                        <span 
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          [ngClass]="r.type === 'pre_test' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'">
                          {{ r.type === 'pre_test' ? 'PRE-TEST' : 'POST-TEST' }}
                        </span>
                      </td>
                      <td class="py-3 px-3.5">
                        <div class="font-bold">{{ r.traineeName }}</div>
                        <div class="text-[11px] text-text-secondary">{{ r.traineeEmail }}</div>
                      </td>
                      <td class="py-3 px-3.5">
                        <div class="font-semibold text-text-primary">{{ r.questionnaireTitle }}</div>
                        <div class="text-[10px] text-text-secondary">Version {{ r.versionLabel }}</div>
                      </td>
                      <td class="py-3 px-3.5">
                        <span class="font-bold text-xs" [ngClass]="(r.scorePct || 0) >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
                          {{ r.scorePct || 0 }}%
                        </span>
                        <div class="text-[10px] text-text-secondary">{{ r.scoreEarned }}/{{ r.totalPossibleScore }} pts</div>
                      </td>
                      <td class="py-3 px-3.5">
                        <span 
                          class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [ngClass]="r.passed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'">
                          {{ r.passed ? 'PASSED' : 'NEEDS IMPROVEMENT' }}
                        </span>
                      </td>
                      <td class="py-3 px-3.5 text-text-secondary font-mono text-[11px]">
                        {{ r.submittedAt | date:'medium' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    }

    }

    </div>

    <!-- ===================================================================== -->
    <!-- MODALS & DIALOGS                                                      -->
    <!-- ===================================================================== -->

    <!-- Transcript Sheet Modal Viewer -->
    @if (activeTranscript()) {
      <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop overflow-y-auto">
        <div class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-modal-card m-auto overflow-hidden">
          <div class="p-4 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-lg text-cyan-600">article</span>
              <h3 class="text-sm font-bold text-text-primary">Academic Transcript Viewer</h3>
              <span class="font-mono text-xs text-text-secondary">({{ activeTranscript()!.transcriptCode }})</span>
            </div>
            <button 
              type="button" 
              (click)="activeTranscript.set(null)"
              class="w-8 h-8 rounded-full hover:bg-base-300 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>
          <div class="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-900">
            <app-transcript-sheet [transcript]="activeTranscript()!"></app-transcript-sheet>
          </div>
        </div>
      </div>
    }

    <!-- Assign Plan Owner Modal (§7) -->
    @if (showAssignOwnerModal() && currentPlan()) {
      <app-assign-owner-modal
        [plan]="currentPlan()!"
        (close)="showAssignOwnerModal.set(false)"
        (assigned)="onOwnerAssigned($event)">
      </app-assign-owner-modal>
    }

    <!-- Edit Plan Modal (§10) -->
    @if (showEditPlanModal() && currentPlan()) {
      <app-edit-plan-modal
        [plan]="currentPlan()!"
        (close)="showEditPlanModal.set(false)"
        (updated)="onPlanUpdated($event)">
      </app-edit-plan-modal>
    }

    <!-- Phase Details Modal (§9.5) -->
    @if (selectedPhaseForDetails() && currentPlan()) {
      <app-phase-details-modal
        [phase]="selectedPhaseForDetails()!"
        [plan]="currentPlan()!"
        [totalPhases]="phasesList().length"
        (close)="selectedPhaseForDetails.set(null)">
      </app-phase-details-modal>
    }

    <!-- Activate Plan Confirmation Modal (§11) -->
    @if (showActivateConfirmModal() && currentPlan()) {
      <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop overflow-y-auto">
        <div class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-xs space-y-4 animate-modal-card m-auto">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">play_circle</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">Activate Plan?</h3>
              <p class="text-xs text-text-secondary">Make this learning plan active for learner enrollment.</p>
            </div>
          </div>

          <p class="text-text-secondary leading-relaxed">
            Are you sure you want to activate <strong class="text-text-primary">{{ currentPlan()!.name }}</strong>?
            Once active, learners can proceed through structured phases and timeline parameters become protected.
          </p>

          <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 space-y-1">
            <div class="font-bold flex items-center gap-1 text-[11px]">
              <span class="material-symbols-outlined text-xs">checklist</span> Readiness Checklist:
            </div>
            <div class="text-[11px] flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-emerald-500">check</span> Owner Assigned: {{ currentPlan()!.owner?.name }}
            </div>
            <div class="text-[11px] flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-emerald-500">check</span> Structured Phases: {{ phasesList().length }} phases configured
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button 
              type="button" 
              (click)="showActivateConfirmModal.set(false)" 
              class="px-4 py-2 rounded-xl font-semibold bg-base-200 border border-base-300 dark:border-slate-700 text-text-secondary hover:text-text-primary cursor-pointer">
              Cancel
            </button>
            <button 
              type="button" 
              (click)="confirmActivatePlan()" 
              class="px-4 py-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs">
              Activate Plan
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Archive Plan Confirmation Modal (§12) -->
    @if (showArchiveConfirmModal() && currentPlan()) {
      <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop overflow-y-auto">
        <div class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-xs space-y-4 animate-modal-card m-auto">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">archive</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">Archive Plan?</h3>
              <p class="text-xs text-text-secondary">Retire this learning plan from active operations.</p>
            </div>
          </div>

          <p class="text-text-secondary leading-relaxed">
            Are you sure you want to archive <strong class="text-text-primary">{{ currentPlan()!.name }}</strong>?
            Archived plans will be hidden from the default operational grid and can only be reviewed via Status filter.
          </p>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button 
              type="button" 
              (click)="showArchiveConfirmModal.set(false)" 
              class="px-4 py-2 rounded-xl font-semibold bg-base-200 border border-base-300 dark:border-slate-700 text-text-secondary hover:text-text-primary">
              Cancel
            </button>
            <button 
              type="button" 
              (click)="confirmArchivePlan()" 
              class="px-4 py-2 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white">
              Archive Plan
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fadeIn 0.15s ease-out;
    }
  `]
})
export class PlanDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private lmsData = inject(LmsDataService);

  planId = signal<string | null>(null);

  activeLms = this.lmsData.activeLms;

  currentPlan = computed<Plan | undefined>(() => {
    const id = this.planId();
    if (!id) return undefined;
    return this.lmsData.getPlan(id);
  });

  phasesList = computed<Phase[]>(() => {
    const p = this.currentPlan();
    if (!p) return [];
    return p.phases || [];
  });

  activeMainTab = signal<'curriculum' | 'ratings' | 'feedback' | 'forum' | 'evaluations'>('curriculum');

  planRatingsCount = computed<number>(() => {
    const id = this.planId();
    if (!id) return 0;
    return this.lmsData.getRatingsForPlan(id).length;
  });

  planFeedbackResponsesCount = computed<number>(() => {
    const id = this.planId();
    if (!id) return 0;
    return this.lmsData.getFeedbackResponsesForPlan(id).length;
  });

  planForumTopicsCount = computed<number>(() => {
    const id = this.planId();
    if (!id) return 0;
    return this.lmsData.getForumForPlan(id).topics.length;
  });

  planTranscripts = computed<TranscriptRecord[]>(() => {
    const id = this.planId();
    if (!id) return [];
    return this.lmsData.transcripts().filter(t => t.planId === id);
  });

  planTranscriptsCount = computed<number>(() => this.planTranscripts().length);

  planTestResponses = computed<any[]>(() => {
    const id = this.planId();
    if (!id) return [];
    return this.lmsData.getTestResponses({ planId: id });
  });

  planTestResponsesCount = computed<number>(() => this.planTestResponses().length);

  preTestResponses = computed<any[]>(() => this.planTestResponses().filter(r => r.type === 'pre_test'));

  postTestResponses = computed<any[]>(() => this.planTestResponses().filter(r => r.type === 'post_test'));

  averagePreTestScore = computed<number>(() => {
    const items = this.preTestResponses();
    if (items.length === 0) return 58;
    const sum = items.reduce((acc, i) => acc + (i.scorePct || 0), 0);
    return Math.round(sum / items.length);
  });

  averagePostTestScore = computed<number>(() => {
    const items = this.postTestResponses();
    if (items.length === 0) return 86;
    const sum = items.reduce((acc, i) => acc + (i.scorePct || 0), 0);
    return Math.round(sum / items.length);
  });

  knowledgeGainDelta = computed<number>(() => {
    return Math.max(0, this.averagePostTestScore() - this.averagePreTestScore());
  });

  activeTranscript = signal<TranscriptRecord | null>(null);

  viewTranscriptRecord(record: TranscriptRecord) {
    this.activeTranscript.set(record);
  }

  showAssignOwnerModal = signal(false);
  showEditPlanModal = signal(false);
  selectedPhaseForDetails = signal<Phase | null>(null);
  showActivateConfirmModal = signal(false);
  showArchiveConfirmModal = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.planId.set(id);
      }
    });

    this.route.queryParamMap.subscribe(qParams => {
      const id = qParams.get('planId');
      if (id) {
        this.planId.set(id);
      }
    });
  }

  goBackToGrid() {
    this.router.navigate(['/plans']);
  }

  openAssignOwnerModal() {
    this.showAssignOwnerModal.set(true);
  }

  onOwnerAssigned(owner: PlanOwner) {
    // Plan signal in service automatically updates currentPlan computed
  }

  openEditPlanModal() {
    if (this.currentPlan()) {
      this.router.navigate(['/plans/edit', this.currentPlan()!.id]);
    }
  }

  onPlanUpdated(plan: Plan) {
    // Current plan updates automatically
  }

  openPhaseDetails(phase: Phase) {
    this.selectedPhaseForDetails.set(phase);
  }

  navigateToAddPhase() {
    if (this.currentPlan()) {
      this.router.navigate(['/plans', this.currentPlan()!.id, 'phases', 'create']);
    }
  }

  navigateToEditPhase(phaseId: string) {
    if (this.currentPlan()) {
      this.router.navigate(['/plans', this.currentPlan()!.id, 'phases', 'edit', phaseId]);
    }
  }

  deletePhase(phaseId: string) {
    const plan = this.currentPlan();
    if (!plan) return;
    this.lmsData.deletePhaseFromPlan(plan.id, phaseId);
  }

  promptActivatePlan() {
    this.showActivateConfirmModal.set(true);
  }

  confirmActivatePlan() {
    const p = this.currentPlan();
    if (!p) return;
    this.lmsData.activatePlan(p.id);
    this.showActivateConfirmModal.set(false);
  }

  promptArchivePlan() {
    this.showArchiveConfirmModal.set(true);
  }

  confirmArchivePlan() {
    const p = this.currentPlan();
    if (!p) return;
    this.lmsData.archivePlan(p.id);
    this.showArchiveConfirmModal.set(false);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
      case 'Published':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
      case 'Completed':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
      case 'Archived':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'Draft':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900';
    }
  }

  getPrerequisiteBadgeClass(status: string): string {
    switch (status) {
      case 'Met': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
      case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  getCertificateBadgeClass(status: string): string {
    switch (status) {
      case 'Issued': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300';
      case 'Configured': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }
}
