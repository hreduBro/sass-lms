import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  TranscriptRecord,
  TranscriptLevel,
  TranscriptStatus,
  TranscriptReleaseState
} from '../../../models/transcript.model';
import { TranscriptSheetComponent } from '../../../components/transcript-sheet/transcript-sheet.component';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';
import { CustomSelectComponent } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-transcript-grid',
  imports: [CommonModule, FormsModule, RouterModule, TranscriptSheetComponent, CustomAvatarComponent, CustomSelectComponent],
  template: `
    <div class="space-y-6 pb-16">
      
      <!-- ========================================================================= -->
      <!-- 1. HEADER & WORKSPACE SCOPE BANNER                                        -->
      <!-- ========================================================================= -->
      <div class="p-6 rounded-3xl bg-base-100 border border-base-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tenant-50 dark:bg-tenant-500/20 text-tenant-700 dark:text-tenant-200 border border-tenant-500/30 flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">school</span>
              Academic Records & Certification
            </span>
            <span class="text-xs text-text-secondary">
              Parent Org: <strong class="font-bold text-text-primary">{{ lms.activeTenant()?.name || 'Active Tenant' }}</strong>
              (LMS: <strong class="font-mono text-text-primary">{{ lms.activeLmsId() }}</strong>)
            </span>
          </div>
          
          <!-- Primary Heading -->
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-text-primary tracking-tight">Academic Transcripts & Registry</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-base-200 text-text-secondary border border-base-300">
              {{ filteredTranscripts().length }} Records
            </span>
          </div>
          
          <!-- Subtitle -->
          <p class="text-xs text-text-secondary mt-0.5">
            Audit trail, verified completion records, and multi-format transcript export engine across courses, phases, and certified plans.
          </p>
        </div>

        <!-- Top-Right Action Buttons -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <a 
            routerLink="/plans/dashboard"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-base-100 hover:bg-base-200 text-text-primary border border-base-300 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
            <span class="material-symbols-outlined text-base text-tenant-500">space_dashboard</span>
            <span>Plan Dashboard</span>
          </a>

          <a 
            routerLink="/my-transcripts"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-base-100 hover:bg-base-200 text-text-primary border border-base-300 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Preview Learner Transcripts View">
            <span class="material-symbols-outlined text-base text-sky-500">badge</span>
            <span>Learner Portal</span>
          </a>

          <button 
            type="button"
            (click)="openBulkExportModal()"
            class="px-4 py-2 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer">
            <span class="material-symbols-outlined text-base">file_download</span>
            <span>Bulk Export</span>
            @if (selectedIds().size > 0) {
              <span class="px-1.5 py-0.2 bg-white text-tenant-600 rounded-full font-bold text-[10px]">
                {{ selectedIds().size }}
              </span>
            }
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 3. KPI METRICS SUMMARY ROW                                                -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Generated -->
        <div class="bg-base-100 border border-base-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-text-secondary">Total Generated</p>
            <h3 class="text-2xl font-bold text-text-primary mt-1 font-mono">{{ totalGeneratedCount() }}</h3>
            <span class="text-[11px] text-text-secondary">Official certified records</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <span class="material-symbols-outlined">receipt_long</span>
          </div>
        </div>

        <!-- Released / Learner Visible -->
        <div class="bg-base-100 border border-base-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Released (Trainee Visible)</p>
            <h3 class="text-2xl font-bold text-text-primary mt-1 font-mono">{{ releasedCount() }}</h3>
            <span class="text-[11px] text-text-secondary">Verified & downloadable in portal</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <span class="material-symbols-outlined">verified</span>
          </div>
        </div>

        <!-- Available (Unreleased) -->
        <div class="bg-base-100 border border-base-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Available (Unreleased)</p>
            <h3 class="text-2xl font-bold text-text-primary mt-1 font-mono">{{ availableCount() }}</h3>
            <span class="text-[11px] text-text-secondary">Awaiting release authorization</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <span class="material-symbols-outlined">pending_actions</span>
          </div>
        </div>

        <!-- Pending Plan Closure -->
        <div class="bg-base-100 border border-base-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-amber-600 dark:text-amber-400">Pending Plan Closure</p>
            <h3 class="text-2xl font-bold text-text-primary mt-1 font-mono">{{ pendingClosureCount() }}</h3>
            <span class="text-[11px] text-text-secondary">Gated until formal plan completion</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <span class="material-symbols-outlined">lock_clock</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 4. SEARCH & FILTER CONTROLS (ORGANIZATIONS DESIGN)                       -->
      <!-- ========================================================================= -->
      <div class="bg-base-100 border border-base-300 rounded-3xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-30">
        
        <!-- Left: Search Field + Filters Button -->
        <div class="flex items-center gap-3 flex-1 max-w-2xl">
          
          <!-- Search Field -->
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg pointer-events-none">search</span>
            <input
              type="text"
              id="transcript-search-input"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event); currentPage.set(1)"
              placeholder="Search by Trainee Name, ID, Course/Phase Scope, Serial Number..."
              class="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-base-100 dark:bg-base-200/50 border border-base-300 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-tenant-500 transition-all shadow-2xs" />
            @if (searchTerm()) {
              <button 
                type="button" 
                (click)="searchTerm.set(''); currentPage.set(1)"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5 rounded-md cursor-pointer">
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            }
          </div>

          <!-- Filter Button beside Search -->
          <button 
            type="button"
            id="btn-toggle-filter-panel"
            (click)="toggleFilterPanel()"
            class="px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
            [class]="isFilterPanelOpen() || hasActiveFilters()
              ? 'bg-tenant-500 text-white border-tenant-500'
              : 'bg-base-100 hover:bg-base-200 text-text-primary border-base-300'"
            title="Filters">
            <span class="material-symbols-outlined text-base" [class.text-text-primary]="!isFilterPanelOpen() && !hasActiveFilters()" [class.text-white]="isFilterPanelOpen() || hasActiveFilters()">filter_list</span>
            <span>Filters</span>
            @if (activeFilterCount() > 0) {
              <span class="w-4 h-4 rounded-full bg-white text-tenant-600 text-[10px] font-bold flex items-center justify-center">
                {{ activeFilterCount() }}
              </span>
            }
          </button>

          <!-- Reset Button -->
          @if (hasActiveFilters() || searchTerm()) {
            <button 
              type="button"
              id="btn-grid-reset"
              (click)="clearAllFilters(); searchTerm.set(''); currentPage.set(1)"
              class="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all animate-in fade-in"
              title="Reset Filters">
              <span class="material-symbols-outlined text-sm">restart_alt</span>
              <span>Reset</span>
            </button>
          }

        </div>

        <!-- Right: View Mode Toggle (Grid / Table) + Total Count -->
        <div class="flex items-center justify-end gap-2 self-end sm:self-auto flex-shrink-0">
          <div class="flex items-center bg-base-200 p-1 rounded-2xl border border-base-300">
            <button
              type="button"
              (click)="viewMode.set('grid')"
              class="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              [class]="viewMode() === 'grid' ? 'bg-base-100 text-text-primary shadow-2xs border border-base-300/40 font-bold' : 'text-text-secondary hover:text-text-primary'"
              title="Grid View">
              <span class="material-symbols-outlined text-base leading-none">grid_view</span>
            </button>
            <button
              type="button"
              (click)="viewMode.set('table')"
              class="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              [class]="viewMode() === 'table' ? 'bg-base-100 text-text-primary shadow-2xs border border-base-300/40 font-bold' : 'text-text-secondary hover:text-text-primary'"
              title="Table View">
              <span class="material-symbols-outlined text-base leading-none">format_list_bulleted</span>
            </button>
          </div>

          <span class="px-3.5 py-2.5 rounded-2xl bg-base-200 border border-base-300 text-xs text-text-secondary font-medium whitespace-nowrap">
            Showing <strong class="text-text-primary">{{ filteredTranscripts().length }}</strong> of {{ allTranscripts().length }}
          </span>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 4.1 FILTER PANEL DROPDOWN / CARD (ORGANIZATIONS DESIGN)                   -->
      <!-- ========================================================================= -->
      @if (isFilterPanelOpen()) {
        <div class="bg-base-100 rounded-3xl border border-base-300 p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 space-y-4 relative z-20">

          <!-- Header -->
          <div class="flex items-center justify-between pb-2.5 border-b border-base-300">
            <h3 class="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-tenant-500 text-base">tune</span>
              FILTER TRANSCRIPTS
            </h3>
            <span class="text-[11px] text-text-secondary font-medium">
              Combine criteria with AND &bull; Multiple values in same category with OR
            </span>
          </div>

          <!-- Filter Body Grid -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 pt-1">

            <!-- 1. Curriculum Level -->
            <div class="space-y-2.5">
              <label class="text-xs font-bold text-text-primary block">
                1. Curriculum Level
              </label>
              <div class="flex flex-col gap-2">
                @for (lvl of ['plan', 'phase', 'course']; track lvl) {
                  <label class="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer group select-none p-1 rounded-lg hover:bg-base-200 transition-colors">
                    <input
                      type="checkbox"
                      [checked]="hasLevelDraft(lvl)"
                      (change)="toggleLevelDraft(lvl)"
                      class="rounded border-base-300 text-tenant-500 focus:ring-tenant-500 w-4 h-4 cursor-pointer" />
                    <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-base-200 border-base-300 capitalize text-text-primary">
                      {{ lvl }} Level
                    </span>
                  </label>
                }
              </div>
            </div>

            <!-- 2. Outcome Status -->
            <div class="space-y-2.5">
              <label class="text-xs font-bold text-text-primary block">
                2. Outcome Status
              </label>
              <div class="flex flex-col gap-2">
                @for (st of ['pass', 'fail', 'completed']; track st) {
                  <label class="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer group select-none p-1 rounded-lg hover:bg-base-200 transition-colors">
                    <input
                      type="checkbox"
                      [checked]="hasStatusDraft(st)"
                      (change)="toggleStatusDraft(st)"
                      class="rounded border-base-300 text-tenant-500 focus:ring-tenant-500 w-4 h-4 cursor-pointer" />
                    <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 shadow-2xs" 
                          [class]="st === 'pass' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40' : 
                                   st === 'fail' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40' : 
                                   'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40'">
                      @if (st === 'pass') {
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      } @else if (st === 'fail') {
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      } @else {
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      }
                      {{ st | uppercase }}
                    </span>
                  </label>
                }
              </div>
            </div>

            <!-- 3. Release State -->
            <div class="space-y-2.5">
              <label class="text-xs font-bold text-text-primary block">
                3. Release State
              </label>
              <div class="flex flex-col gap-2">
                @for (rel of ['released', 'available', 'pending', 'revoked']; track rel) {
                  <label class="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer group select-none p-1 rounded-lg hover:bg-base-200 transition-colors">
                    <input
                      type="checkbox"
                      [checked]="hasReleaseStateDraft(rel)"
                      (change)="toggleReleaseStateDraft(rel)"
                      class="rounded border-base-300 text-tenant-500 focus:ring-tenant-500 w-4 h-4 cursor-pointer" />
                    <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 shadow-2xs"
                          [class]="rel === 'released' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40' : 
                                   rel === 'available' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40' : 
                                   rel === 'pending' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40' : 
                                   'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'">
                      {{ rel | uppercase }}
                    </span>
                  </label>
                }
              </div>
            </div>

            <!-- 4. Training Plan Dropdown -->
            <div class="space-y-2.5">
              <label class="text-xs font-bold text-text-primary block">
                4. Parent Training Plan
              </label>
              <div class="pt-1">
                <app-custom-select
                  [options]="planOptions()"
                  [clearable]="true"
                  [searchable]="true"
                  placeholder="All Training Plans"
                  [ngModel]="draftPlanId()"
                  (ngModelChange)="draftPlanId.set($event)">
                </app-custom-select>
              </div>
            </div>

          </div>

          <!-- Filter Panel Footer Actions -->
          <div class="pt-3 border-t border-base-300 flex items-center justify-between">
            <button
              type="button"
              (click)="clearDrafts()"
              class="px-3.5 py-1.5 rounded-xl hover:bg-base-200 text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors cursor-pointer">
              Clear All Selections
            </button>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="cancelFilters()"
                class="px-3.5 py-1.5 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-semibold transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                (click)="applyFilters()"
                class="px-4 py-1.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer">
                Apply Filter
              </button>
            </div>
          </div>

        </div>
      }

      <!-- ========================================================================= -->
      <!-- 4.2 ACTIVE FILTER CHIPS ROW (ORGANIZATIONS DESIGN)                        -->
      <!-- ========================================================================= -->
      @if (hasActiveFilters()) {
        <div class="bg-base-100 rounded-2xl border border-base-300 px-4 py-2.5 flex items-center gap-2 flex-wrap text-xs shadow-2xs animate-in fade-in">
          <span class="text-[11px] font-bold text-text-secondary uppercase tracking-wider mr-1">
            Active Filters:
          </span>

          <!-- Level Chips -->
          @for (lvl of selectedLevels(); track lvl) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary capitalize">
              <span>Level: <strong>{{ lvl }}</strong></span>
              <button type="button" (click)="removeLevelFilter(lvl)" class="hover:text-rose-600 cursor-pointer flex items-center">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          }

          <!-- Status Chips -->
          @for (st of selectedStatuses(); track st) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary uppercase">
              <span>Status: <strong>{{ st }}</strong></span>
              <button type="button" (click)="removeStatusFilter(st)" class="hover:text-rose-600 cursor-pointer flex items-center">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          }

          <!-- Release State Chips -->
          @for (rel of selectedReleaseStates(); track rel) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary uppercase">
              <span>Release: <strong>{{ rel }}</strong></span>
              <button type="button" (click)="removeReleaseStateFilter(rel)" class="hover:text-rose-600 cursor-pointer flex items-center">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          }

          <!-- Plan Chip -->
          @if (selectedPlanId()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary">
              <span>Plan: <strong>{{ getPlanName(selectedPlanId()) }}</strong></span>
              <button type="button" (click)="selectedPlanId.set(''); draftPlanId.set(''); currentPage.set(1)" class="hover:text-rose-600 cursor-pointer flex items-center">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          }

          <button (click)="clearAllFilters()" class="text-rose-500 hover:underline text-[11px] font-semibold ml-2 cursor-pointer">
            Clear All
          </button>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 5. BULK SELECTION ACTION BAR (WHEN ROWS CHECKED)                          -->
      <!-- ========================================================================= -->
      @if (selectedIds().size > 0) {
        <div class="px-6 py-3 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          <div class="flex items-center space-x-2.5">
            <span class="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
            <span class="font-medium"><strong>{{ selectedIds().size }}</strong> transcript record(s) selected for bulk action</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button
              (click)="selectAllRows()"
              class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              Select All ({{ filteredTranscripts().length }})
            </button>
            <button
              (click)="clearRowSelection()"
              class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              Deselect
            </button>
            <button
              (click)="bulkReleaseSelected()"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-sm">verified</span>
              <span>Release Selected</span>
            </button>
            <button
              (click)="openBulkExportModal()"
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-sm">download</span>
              <span>Export Package</span>
            </button>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 6. DATA PRESENTATION: TABLE VIEW OR GRID CARDS VIEW                       -->
      <!-- ========================================================================= -->
      @if (viewMode() === 'table') {
        <div class="bg-base-100 border border-base-300 rounded-2xl shadow-sm overflow-hidden">
          
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-base-200/70 border-b border-base-300 text-text-secondary font-semibold">
                  <th class="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      [checked]="isAllSelected()"
                      (change)="toggleSelectAll()"
                      class="rounded border-base-300 text-tenant-600 focus:ring-0 cursor-pointer" />
                  </th>
                  <th class="py-3 px-4">Trainee Identity</th>
                  <th class="py-3 px-3">Level</th>
                  <th class="py-3 px-4">Curriculum Scope & Serial</th>
                  <th class="py-3 px-4">Parent Plan</th>
                  <th class="py-3 px-3 text-center">Score / Result</th>
                  <th class="py-3 px-3 text-center">Status</th>
                  <th class="py-3 px-3 text-center">Release State</th>
                  <th class="py-3 px-3 text-center">Completion</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-base-300/80">
                @for (t of paginatedTranscripts(); track t.transcriptId) {
                  <tr 
                    class="hover:bg-base-200/50 transition-colors" 
                    [class.bg-tenant-50/20]="selectedIds().has(t.transcriptId)">
                    
                    <!-- Checkbox -->
                    <td class="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        [checked]="selectedIds().has(t.transcriptId)"
                        (change)="toggleRowSelection(t.transcriptId)"
                        class="rounded border-base-300 text-tenant-600 focus:ring-0 cursor-pointer" />
                    </td>

                    <!-- Trainee Identity -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center space-x-2.5">
                        <app-custom-avatar [name]="t.traineeName" [url]="t.traineeAvatar" size="sm" shape="circle"></app-custom-avatar>
                        <div>
                          <div class="font-bold text-text-primary">{{ t.traineeName }}</div>
                          <div class="text-[11px] text-text-secondary font-mono">{{ t.content.traineeId }}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Level Badge -->
                    <td class="py-3.5 px-3">
                      <span [class]="getLevelBadgeClass(t.level)">
                        {{ t.level | uppercase }}
                      </span>
                    </td>

                    <!-- Scope & Serial -->
                    <td class="py-3.5 px-4 max-w-xs">
                      <div class="font-semibold text-text-primary truncate" [title]="t.scopeName">
                        {{ t.scopeName }}
                      </div>
                      <div class="text-[10px] text-text-secondary font-mono flex items-center gap-1 mt-0.5">
                        <span class="material-symbols-outlined text-[12px] text-tenant-500">pin</span>
                        {{ t.content.serialNumber }}
                      </div>
                    </td>

                    <!-- Parent Plan -->
                    <td class="py-3.5 px-4 max-w-xs">
                      <div class="text-text-secondary truncate text-[11px]" [title]="t.planName">
                        {{ t.planName }}
                      </div>
                    </td>

                    <!-- Score / Result -->
                    <td class="py-3.5 px-3 text-center">
                      <div class="font-mono font-bold text-text-primary">{{ t.content.result }}</div>
                      <div class="text-[10px] text-text-secondary font-mono">{{ t.content.gradingType }}</div>
                    </td>

                    <!-- Status -->
                    <td class="py-3.5 px-3 text-center">
                      <span [class]="getStatusBadgeClass(t.content.status)">
                        {{ t.content.status | uppercase }}
                      </span>
                    </td>

                    <!-- Release State -->
                    <td class="py-3.5 px-3 text-center">
                      <span [class]="getReleaseStateBadgeClass(t.releaseState)">
                        {{ t.releaseState }}
                      </span>
                      @if (t.level === 'plan' && !t.planClosed) {
                        <span class="block text-[9px] text-amber-600 dark:text-amber-400 font-medium mt-0.5" title="Plan not administratively closed">
                          Plan Open
                        </span>
                      }
                    </td>

                    <!-- Completion Date -->
                    <td class="py-3.5 px-3 text-center font-mono text-text-secondary text-[11px]">
                      {{ t.content.completionDate }}
                    </td>

                    <!-- Actions -->
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          (click)="viewTranscript(t)"
                          class="p-1.5 text-text-secondary hover:text-text-primary hover:bg-base-200 rounded-lg transition-colors cursor-pointer"
                          title="View Official Transcript Document">
                          <span class="material-symbols-outlined text-base">visibility</span>
                        </button>

                        <button
                          type="button"
                          (click)="exportIndividual(t)"
                          class="p-1.5 text-text-secondary hover:text-tenant-600 hover:bg-base-200 rounded-lg transition-colors cursor-pointer"
                          title="Export Transcript CSV">
                          <span class="material-symbols-outlined text-base">download</span>
                        </button>

                        @if (t.releaseState === 'available' || t.releaseState === 'pending') {
                          <button
                            type="button"
                            (click)="releaseTranscript(t.transcriptId)"
                            class="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Release Transcript to Trainee">
                            <span class="material-symbols-outlined text-base">verified</span>
                          </button>
                        } @else if (t.releaseState === 'released') {
                          <button
                            type="button"
                            (click)="promptRevokeTranscript(t)"
                            class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Revoke Transcript">
                            <span class="material-symbols-outlined text-base">block</span>
                          </button>
                        }
                      </div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          @if (filteredTranscripts().length === 0) {
            <div class="py-16 px-6 text-center space-y-3">
              @if (allTranscripts().length === 0) {
                <span class="material-symbols-outlined text-4xl text-text-secondary/40">inventory_2</span>
                <h3 class="text-sm font-bold text-text-primary">No transcript information is available to display.</h3>
                <p class="text-xs text-text-secondary max-w-sm mx-auto">
                  Transcripts will be automatically generated upon trainees completing courses, phases, or closed plans.
                </p>
              } @else if (searchTerm() && !hasActiveFilters()) {
                <span class="material-symbols-outlined text-4xl text-text-secondary/40">search_off</span>
                <h3 class="text-sm font-bold text-text-primary">No transcript found</h3>
                <p class="text-xs text-text-secondary max-w-sm mx-auto">
                  No records matching "<span class="font-semibold text-text-primary">{{ searchTerm() }}</span>". Try revising your search query.
                </p>
                <button
                  type="button"
                  (click)="searchTerm.set(''); currentPage.set(1)"
                  class="px-3 py-1.5 bg-base-200 hover:bg-base-300 text-text-primary rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  Clear Search
                </button>
              } @else {
                <span class="material-symbols-outlined text-4xl text-text-secondary/40">filter_alt_off</span>
                <h3 class="text-sm font-bold text-text-primary">No transcript found matching the selected filters.</h3>
                <p class="text-xs text-text-secondary max-w-sm mx-auto">
                  Try clearing or loosening your filter criteria to view more records.
                </p>
                <button
                  type="button"
                  (click)="clearAllFilters()"
                  class="px-3.5 py-1.5 bg-tenant-500 hover:bg-tenant-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  Clear Selected Filters
                </button>
              }
            </div>
          }

          <!-- Pagination Bar -->
          @if (filteredTranscripts().length > 0) {
            <div class="px-6 py-4 border-t border-base-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div class="flex items-center gap-2 text-text-secondary">
                <span>Page Size:</span>
                <app-custom-select
                  [options]="[
                    { value: 10, label: '10 records' },
                    { value: 25, label: '25 records' },
                    { value: 50, label: '50 records' }
                  ]"
                  [clearable]="false"
                  [searchable]="false"
                  dropdownPosition="top"
                  placeholder="Page Size"
                  [ngModel]="pageSize()"
                  (ngModelChange)="pageSize.set($event); currentPage.set(1)"
                  class="w-32 inline-block">
                </app-custom-select>
                <span>• Showing {{ paginationRange() }} of {{ filteredTranscripts().length }} records</span>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  [disabled]="currentPage() === 1"
                  (click)="currentPage.set(currentPage() - 1)"
                  class="p-1.5 rounded-lg border border-base-300 text-text-primary hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <span class="material-symbols-outlined text-base">chevron_left</span>
                </button>

                <span class="px-3 py-1 font-semibold text-text-primary">
                  Page {{ currentPage() }} of {{ totalPages() }}
                </span>

                <button
                  type="button"
                  [disabled]="currentPage() >= totalPages()"
                  (click)="currentPage.set(currentPage() + 1)"
                  class="p-1.5 rounded-lg border border-base-300 text-text-primary hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <span class="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
          }

        </div>
      } @else {
        <!-- Grid / Card View -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (t of paginatedTranscripts(); track t.transcriptId) {
            <div 
              class="bg-base-100 border border-base-300 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
              [class.ring-2]="selectedIds().has(t.transcriptId)"
              [class.ring-tenant-500]="selectedIds().has(t.transcriptId)">
              
              <div class="space-y-3">
                <!-- Top Badge & Selection Checkbox -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      [checked]="selectedIds().has(t.transcriptId)"
                      (change)="toggleRowSelection(t.transcriptId)"
                      class="rounded border-base-300 text-tenant-600 focus:ring-0 cursor-pointer" />
                    <span [class]="getLevelBadgeClass(t.level)">
                      {{ t.level | uppercase }}
                    </span>
                  </div>
                  <span class="text-[11px] font-mono text-text-secondary font-medium">
                    {{ t.content.serialNumber }}
                  </span>
                </div>

                <!-- Trainee Info -->
                <div class="flex items-center gap-3 pt-1">
                  <app-custom-avatar [name]="t.traineeName" [url]="t.traineeAvatar" size="md" shape="squircle"></app-custom-avatar>
                  <div>
                    <h4 class="font-bold text-sm text-text-primary">{{ t.traineeName }}</h4>
                    <p class="text-[11px] text-text-secondary font-mono">{{ t.content.traineeId }}</p>
                  </div>
                </div>

                <!-- Curriculum Scope -->
                <div class="p-3 bg-base-200/60 rounded-2xl border border-base-300/60 space-y-1">
                  <div class="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Curriculum Scope</div>
                  <h5 class="text-xs font-bold text-text-primary truncate" [title]="t.scopeName">{{ t.scopeName }}</h5>
                  <p class="text-[11px] text-text-secondary truncate">Plan: {{ t.planName }}</p>
                </div>

                <!-- Performance Metrics -->
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                  <div class="p-2 rounded-xl bg-base-200 border border-base-300">
                    <span class="text-[10px] text-text-secondary block">Score</span>
                    <span class="font-mono font-bold text-text-primary">{{ t.content.result }}</span>
                  </div>
                  <div class="p-2 rounded-xl bg-base-200 border border-base-300">
                    <span class="text-[10px] text-text-secondary block">Status</span>
                    <span [class]="getStatusBadgeClass(t.content.status)" class="text-[10px] py-0.5">
                      {{ t.content.status | uppercase }}
                    </span>
                  </div>
                  <div class="p-2 rounded-xl bg-base-200 border border-base-300">
                    <span class="text-[10px] text-text-secondary block">Release</span>
                    <span [class]="getReleaseStateBadgeClass(t.releaseState)" class="text-[10px] py-0.5">
                      {{ t.releaseState }}
                    </span>
                  </div>
                </div>

                <!-- Completion Timestamp -->
                <div class="flex items-center justify-between text-[11px] text-text-secondary pt-1">
                  <span>Completed: <strong class="text-text-primary font-mono">{{ t.content.completionDate }}</strong></span>
                  <span>Credits: <strong class="text-text-primary">{{ t.content.totalCredits }} hrs</strong></span>
                </div>
              </div>

              <!-- Card Actions Footer -->
              <div class="pt-3 border-t border-base-300 flex items-center justify-between gap-2">
                <button
                  type="button"
                  (click)="viewTranscript(t)"
                  class="flex-1 py-2 bg-base-200 hover:bg-base-300 text-text-primary rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <span class="material-symbols-outlined text-sm">visibility</span>
                  <span>View Document</span>
                </button>

                <button
                  type="button"
                  (click)="exportIndividual(t)"
                  class="p-2 bg-base-200 hover:bg-base-300 text-text-primary rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  title="Export CSV">
                  <span class="material-symbols-outlined text-base">download</span>
                </button>

                @if (t.releaseState === 'available' || t.releaseState === 'pending') {
                  <button
                    type="button"
                    (click)="releaseTranscript(t.transcriptId)"
                    class="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs transition-colors cursor-pointer"
                    title="Release to Trainee">
                    <span class="material-symbols-outlined text-base">verified</span>
                  </button>
                }
              </div>

            </div>
          }
        </div>

        <!-- Empty State in Grid Mode -->
        @if (filteredTranscripts().length === 0) {
          <div class="py-16 px-6 text-center space-y-3 bg-base-100 border border-base-300 rounded-3xl">
            <span class="material-symbols-outlined text-4xl text-text-secondary/40">search_off</span>
            <h3 class="text-sm font-bold text-text-primary">No transcript records found</h3>
            <p class="text-xs text-text-secondary max-w-sm mx-auto">
              Try revising your search query or clearing active filters.
            </p>
            <button
              type="button"
              (click)="clearAllFilters()"
              class="px-3.5 py-1.5 bg-tenant-500 hover:bg-tenant-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              Clear All Filters
            </button>
          </div>
        }
      }

      <!-- ========================================================================= -->
      <!-- 7. BULK EXPORT MODAL DIALOG                                               -->
      <!-- ========================================================================= -->
      @if (isBulkExportModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div class="bg-base-100 rounded-3xl shadow-2xl border border-base-300 max-w-md w-full p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-base-300 pb-3">
              <div class="flex items-center space-x-2.5">
                <span class="p-2 bg-tenant-500 text-white rounded-xl flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">file_download</span>
                </span>
                <div>
                  <h3 class="text-base font-bold text-text-primary">Bulk Export Transcripts</h3>
                  <p class="text-xs text-text-secondary">
                    Exporting {{ exportTargetCount() }} transcript record(s)
                  </p>
                </div>
              </div>
              <button (click)="isBulkExportModalOpen.set(false)" class="text-text-secondary hover:text-text-primary cursor-pointer">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <!-- Export Options -->
            <div class="space-y-3.5 text-xs">
              <div>
                <label class="block font-semibold text-text-primary mb-1.5">Export Package Format</label>
                <div class="grid grid-cols-3 gap-2">
                  <label class="border rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                         [class]="exportFormat() === 'pdfZip' ? 'border-tenant-500 bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-200 font-semibold' : 'border-base-300 text-text-secondary hover:bg-base-200'">
                    <input type="radio" name="exportFormat" value="pdfZip" [ngModel]="exportFormat()" (ngModelChange)="exportFormat.set($event)" class="sr-only" />
                    <span class="material-symbols-outlined text-xl mb-1 text-tenant-500">folder_zip</span>
                    <span>PDF Archive</span>
                  </label>

                  <label class="border rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                         [class]="exportFormat() === 'csv' ? 'border-tenant-500 bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-200 font-semibold' : 'border-base-300 text-text-secondary hover:bg-base-200'">
                    <input type="radio" name="exportFormat" value="csv" [ngModel]="exportFormat()" (ngModelChange)="exportFormat.set($event)" class="sr-only" />
                    <span class="material-symbols-outlined text-xl mb-1 text-tenant-500">table_chart</span>
                    <span>CSV Sheet</span>
                  </label>

                  <label class="border rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                         [class]="exportFormat() === 'both' ? 'border-tenant-500 bg-tenant-50 dark:bg-tenant-950/40 text-tenant-700 dark:text-tenant-200 font-semibold' : 'border-base-300 text-text-secondary hover:bg-base-200'">
                    <input type="radio" name="exportFormat" value="both" [ngModel]="exportFormat()" (ngModelChange)="exportFormat.set($event)" class="sr-only" />
                    <span class="material-symbols-outlined text-xl mb-1 text-tenant-500">all_inbox</span>
                    <span>Both Packages</span>
                  </label>
                </div>
              </div>

              <!-- Unreleased Toggle -->
              <div class="p-3 bg-base-200 rounded-2xl border border-base-300 flex items-center justify-between">
                <div>
                  <div class="font-semibold text-text-primary">Include Unreleased / Drafts</div>
                  <div class="text-[11px] text-text-secondary">Exports will be stamped with a "Draft / Unreleased" watermark</div>
                </div>
                <input
                  type="checkbox"
                  [ngModel]="includeUnreleased()"
                  (ngModelChange)="includeUnreleased.set($event)"
                  class="rounded border-base-300 text-tenant-600 focus:ring-0 cursor-pointer" />
              </div>

              <!-- Scope Info Note -->
              <div class="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl text-sky-900 dark:text-sky-200 flex items-start space-x-2">
                <span class="material-symbols-outlined text-sky-600 dark:text-sky-400 text-sm mt-0.5">info</span>
                <div class="text-[11px]">
                  {{ selectedIds().size > 0 ? 'Exporting manually selected ' + selectedIds().size + ' transcripts.' : 'Exporting all ' + filteredTranscripts().length + ' transcripts matching active search & filter parameters.' }}
                </div>
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <div class="flex items-center justify-end space-x-2.5 pt-2 border-t border-base-300">
              <button
                type="button"
                (click)="isBulkExportModalOpen.set(false)"
                class="px-4 py-2 bg-base-200 hover:bg-base-300 text-text-primary rounded-xl font-semibold text-xs transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                (click)="executeBulkExport()"
                class="px-4 py-2 bg-tenant-500 hover:bg-tenant-600 text-white rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer">
                <span class="material-symbols-outlined text-sm">download</span>
                <span>Export Now</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 8. REVOKE CONFIRMATION MODAL                                              -->
      <!-- ========================================================================= -->
      @if (transcriptToRevoke()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div class="bg-base-100 rounded-3xl shadow-2xl border border-base-300 max-w-sm w-full p-6 space-y-4">
            <div class="flex items-center space-x-3 text-rose-500">
              <span class="material-symbols-outlined text-2xl">warning</span>
              <h3 class="text-base font-bold text-text-primary">Revoke Transcript?</h3>
            </div>
            
            <p class="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to revoke transcript <strong class="text-text-primary font-mono">{{ transcriptToRevoke()?.content?.serialNumber }}</strong> for <strong class="text-text-primary">{{ transcriptToRevoke()?.traineeName }}</strong>? This will immediately hide the transcript from the trainee's portal.
            </p>

            <div class="flex items-center justify-end space-x-2 pt-2 border-t border-base-300">
              <button
                type="button"
                (click)="transcriptToRevoke.set(null)"
                class="px-4 py-2 bg-base-200 hover:bg-base-300 text-text-primary rounded-xl font-semibold text-xs transition-colors cursor-pointer">
                No, Keep Active
              </button>
              <button
                type="button"
                (click)="confirmRevoke()"
                class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer">
                Yes, Revoke Record
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Official Academic Transcript Sheet Modal -->
      @if (activeTranscript()) {
        <app-transcript-sheet
          [transcript]="activeTranscript()!"
          [isAdmin]="true"
          (close)="activeTranscript.set(null)"
          (download)="exportIndividual($event)"
        />
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscriptGridComponent {
  lms = inject(LmsDataService);
  private router = inject(Router);

  // Search & Filter State Signals
  searchTerm = signal<string>('');
  isFilterPanelOpen = signal<boolean>(false);

  // Applied State Signals
  selectedLevels = signal<TranscriptLevel[]>([]);
  selectedStatuses = signal<TranscriptStatus[]>([]);
  selectedReleaseStates = signal<TranscriptReleaseState[]>([]);
  selectedPlanId = signal<string>('');

  // Draft State Signals
  draftLevels = signal<TranscriptLevel[]>([]);
  draftStatuses = signal<TranscriptStatus[]>([]);
  draftReleaseStates = signal<TranscriptReleaseState[]>([]);
  draftPlanId = signal<string>('');

  viewMode = signal<'table' | 'grid'>('table');

  // Pagination State
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Row selection for bulk export
  selectedIds = signal<Set<string>>(new Set());

  // Modal states
  isBulkExportModalOpen = signal<boolean>(false);
  exportFormat = signal<'pdfZip' | 'csv' | 'both'>('both');
  includeUnreleased = signal<boolean>(false);
  activeTranscript = signal<TranscriptRecord | null>(null);
  transcriptToRevoke = signal<TranscriptRecord | null>(null);

  // All transcripts from service
  allTranscripts = computed(() => this.lms.transcripts());

  planOptions = computed(() => {
    return this.lms.plans().map(p => ({
      value: p.id,
      label: `${p.name} (${p.planCode})`
    }));
  });

  // Filtered Transcripts based on criteria
  filteredTranscripts = computed(() => {
    return this.lms.getTranscripts({
      level: this.selectedLevels().length > 0 ? this.selectedLevels() : undefined,
      status: this.selectedStatuses().length > 0 ? this.selectedStatuses() : undefined,
      releaseState: this.selectedReleaseStates().length > 0 ? this.selectedReleaseStates() : undefined,
      planId: this.selectedPlanId() || undefined,
      searchTerm: this.searchTerm()
    });
  });

  // Paginated Transcripts
  paginatedTranscripts = computed(() => {
    const list = this.filteredTranscripts();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredTranscripts().length / this.pageSize()) || 1;
  });

  paginationRange = computed(() => {
    const total = this.filteredTranscripts().length;
    if (total === 0) return '0';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), total);
    return `${start}-${end}`;
  });

  // Telemetry KPIs
  totalGeneratedCount = computed(() => this.allTranscripts().length);
  releasedCount = computed(() => this.allTranscripts().filter(t => t.releaseState === 'released').length);
  availableCount = computed(() => this.allTranscripts().filter(t => t.releaseState === 'available').length);
  pendingClosureCount = computed(() => this.allTranscripts().filter(t => t.level === 'plan' && !t.planClosed).length);

  hasActiveFilters = computed(() => {
    return this.selectedLevels().length > 0 ||
      this.selectedStatuses().length > 0 ||
      this.selectedReleaseStates().length > 0 ||
      !!this.selectedPlanId();
  });

  activeFilterCount = computed(() => {
    let count = 0;
    count += this.selectedLevels().length;
    count += this.selectedStatuses().length;
    count += this.selectedReleaseStates().length;
    if (this.selectedPlanId()) count++;
    return count;
  });

  exportTargetCount = computed(() => {
    if (this.selectedIds().size > 0) return this.selectedIds().size;
    return this.filteredTranscripts().length;
  });

  isAllSelected = computed(() => {
    const list = this.filteredTranscripts();
    return list.length > 0 && list.every(t => this.selectedIds().has(t.transcriptId));
  });

  countByLevel(lvl: string): number {
    return this.allTranscripts().filter(t => t.level === lvl).length;
  }

  hasLevelDraft(lvl: string): boolean {
    return this.draftLevels().includes(lvl as any);
  }

  hasStatusDraft(st: string): boolean {
    return this.draftStatuses().includes(st as any);
  }

  hasReleaseStateDraft(rel: string): boolean {
    return this.draftReleaseStates().includes(rel as any);
  }

  // Filter interaction handlers
  toggleLevelDraft(lvl: string): void {
    const val = lvl as TranscriptLevel;
    this.draftLevels.update(current => 
      current.includes(val) ? current.filter(l => l !== val) : [...current, val]
    );
  }

  toggleStatusDraft(st: string): void {
    const val = st as TranscriptStatus;
    this.draftStatuses.update(current => 
      current.includes(val) ? current.filter(s => s !== val) : [...current, val]
    );
  }

  toggleReleaseStateDraft(rel: string): void {
    const val = rel as TranscriptReleaseState;
    this.draftReleaseStates.update(current => 
      current.includes(val) ? current.filter(s => s !== val) : [...current, val]
    );
  }

  removeLevelFilter(lvl: string): void {
    const val = lvl as TranscriptLevel;
    this.selectedLevels.update(current => current.filter(l => l !== val));
    this.draftLevels.update(current => current.filter(l => l !== val));
    this.currentPage.set(1);
  }

  removeStatusFilter(st: string): void {
    const val = st as TranscriptStatus;
    this.selectedStatuses.update(current => current.filter(s => s !== val));
    this.draftStatuses.update(current => current.filter(s => s !== val));
    this.currentPage.set(1);
  }

  removeReleaseStateFilter(rel: string): void {
    const val = rel as TranscriptReleaseState;
    this.selectedReleaseStates.update(current => current.filter(s => s !== val));
    this.draftReleaseStates.update(current => current.filter(s => s !== val));
    this.currentPage.set(1);
  }

  toggleFilterPanel(): void {
    this.isFilterPanelOpen.update(v => {
      const next = !v;
      if (next) {
        this.draftLevels.set([...this.selectedLevels()]);
        this.draftStatuses.set([...this.selectedStatuses()]);
        this.draftReleaseStates.set([...this.selectedReleaseStates()]);
        this.draftPlanId.set(this.selectedPlanId());
      }
      return next;
    });
  }

  applyFilters(): void {
    this.selectedLevels.set([...this.draftLevels()]);
    this.selectedStatuses.set([...this.draftStatuses()]);
    this.selectedReleaseStates.set([...this.draftReleaseStates()]);
    this.selectedPlanId.set(this.draftPlanId());
    this.isFilterPanelOpen.set(false);
    this.currentPage.set(1);
  }

  cancelFilters(): void {
    this.draftLevels.set([...this.selectedLevels()]);
    this.draftStatuses.set([...this.selectedStatuses()]);
    this.draftReleaseStates.set([...this.selectedReleaseStates()]);
    this.draftPlanId.set(this.selectedPlanId());
    this.isFilterPanelOpen.set(false);
  }

  clearDrafts(): void {
    this.draftLevels.set([]);
    this.draftStatuses.set([]);
    this.draftReleaseStates.set([]);
    this.draftPlanId.set('');
  }

  clearAllFilters(): void {
    this.selectedLevels.set([]);
    this.selectedStatuses.set([]);
    this.selectedReleaseStates.set([]);
    this.selectedPlanId.set('');

    this.draftLevels.set([]);
    this.draftStatuses.set([]);
    this.draftReleaseStates.set([]);
    this.draftPlanId.set('');

    this.currentPage.set(1);
  }

  resetGrid(): void {
    this.searchTerm.set('');
    this.clearAllFilters();
    this.clearRowSelection();
    this.currentPage.set(1);
  }

  // Row selection logic
  toggleRowSelection(id: string): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.clearRowSelection();
    } else {
      this.selectAllRows();
    }
  }

  selectAllRows(): void {
    const all = new Set(this.filteredTranscripts().map(t => t.transcriptId));
    this.selectedIds.set(all);
  }

  clearRowSelection(): void {
    this.selectedIds.set(new Set());
  }

  // View transcript
  viewTranscript(t: TranscriptRecord): void {
    this.activeTranscript.set(t);
  }

  // Export individual
  exportIndividual(t: TranscriptRecord): void {
    const csv = this.lms.generateTranscriptCsv([t]);
    this.lms.downloadCsv(csv, `Transcript_${t.content.serialNumber}_${t.traineeName.replace(/ /g, '_')}.csv`);
  }

  // Manual Release
  releaseTranscript(id: string): void {
    this.lms.releaseTranscript(id);
  }

  bulkReleaseSelected(): void {
    for (const id of this.selectedIds()) {
      this.lms.releaseTranscript(id);
    }
    this.clearRowSelection();
  }

  // Revoke Transcript
  promptRevokeTranscript(t: TranscriptRecord): void {
    this.transcriptToRevoke.set(t);
  }

  confirmRevoke(): void {
    const target = this.transcriptToRevoke();
    if (target) {
      this.lms.revokeTranscript(target.transcriptId, 'Administrative revocation by LMS Administrator');
      this.transcriptToRevoke.set(null);
    }
  }

  // Bulk Export Execution
  openBulkExportModal(): void {
    this.isBulkExportModalOpen.set(true);
  }

  executeBulkExport(): void {
    const selectedList = Array.from(this.selectedIds());
    this.lms.createBulkExportJob(
      {
        level: this.selectedLevels(),
        status: this.selectedStatuses(),
        releaseState: this.selectedReleaseStates(),
        planId: this.selectedPlanId()
      },
      selectedList,
      this.exportFormat(),
      this.includeUnreleased()
    );
    this.isBulkExportModalOpen.set(false);
  }

  // Helpers
  getPlanName(planId: string): string {
    const p = this.lms.plans().find(item => item.id === planId);
    return p ? p.name : planId;
  }

  getLevelBadgeClass(level: TranscriptLevel): string {
    switch (level) {
      case 'plan':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'phase':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'course':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      default:
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-base-200 text-text-secondary border border-base-300';
    }
  }

  getStatusBadgeClass(status: TranscriptStatus): string {
    switch (status) {
      case 'pass':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'fail':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
      case 'completed':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      default:
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-base-200 text-text-secondary border border-base-300';
    }
  }

  getReleaseStateBadgeClass(state: TranscriptReleaseState): string {
    switch (state) {
      case 'released':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 capitalize';
      case 'available':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 capitalize';
      case 'pending':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 capitalize';
      case 'revoked':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 capitalize';
      default:
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-base-200 text-text-secondary border border-base-300';
    }
  }
}

