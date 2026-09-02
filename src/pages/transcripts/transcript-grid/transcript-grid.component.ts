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
import { KpiCardComponent } from '../../../components/kpi-card/kpi-card.component';
import { Kpi } from '../../../models/dashboard.model';
import { DataGridComponent, FilterSectionComponent } from '../../../components/data-grid';

@Component({
  selector: 'app-transcript-grid',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    TranscriptSheetComponent, 
    CustomAvatarComponent, 
    CustomSelectComponent,
    KpiCardComponent,
    DataGridComponent,
    FilterSectionComponent
  ],
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <app-kpi-card [kpi]="kpiTotalGenerated()"></app-kpi-card>
        <app-kpi-card [kpi]="kpiReleased()"></app-kpi-card>
        <app-kpi-card [kpi]="kpiAvailable()"></app-kpi-card>
        <app-kpi-card [kpi]="kpiPendingClosure()"></app-kpi-card>
      </div>

      <!-- ========================================================================= -->
      <!-- 4. BULK SELECTION ACTION BAR (WHEN ROWS CHECKED)                          -->
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
      <!-- 5. REUSABLE DATA GRID CONTAINER                                           -->
      <!-- ========================================================================= -->
      <app-data-grid
        [searchQuery]="searchTerm()"
        (searchChange)="searchTerm.set($event); currentPage.set(1)"
        searchPlaceholder="Search by Trainee Name, ID, Course/Phase Scope, Serial Number..."
        [isFilterOpen]="isFilterPanelOpen()"
        (filterToggle)="toggleFilterPanel()"
        [activeFilterCount]="activeFilterCount()"
        [hasActiveFilters]="hasActiveFilters()"
        [showReset]="hasActiveFilters() || searchTerm().trim().length > 0"
        (resetGrid)="resetGrid()"
        [viewMode]="viewMode()"
        (viewModeChange)="viewMode.set($event)"
        [showViewSwitcher]="true"
        [itemCountText]="'Showing ' + filteredTranscripts().length + ' of ' + allTranscripts().length"
        filterPanelTitle="FILTER TRANSCRIPTS"
        filterPanelSubtitle="Combine criteria with AND • Multiple values in same category with OR"
        [emptyStateType]="emptyStateType()"
        emptyTitle="No transcript information available"
        emptyMessage="Transcripts will be automatically generated upon trainees completing courses, phases, or closed plans."
        emptyIcon="inventory_2"
        (clearFilters)="clearDrafts()"
        (cancelFilters)="cancelFilters()"
        (applyFilters)="applyFilters()"
        [showPagination]="filteredTranscripts().length > 0"
        [totalItems]="filteredTranscripts().length"
        [currentPage]="currentPage()"
        (pageChange)="currentPage.set($event)"
        [pageSize]="pageSize()"
        (pageSizeChange)="pageSize.set($event); currentPage.set(1)"
        [pageSizeOptions]="[10, 25, 50]"
        itemLabel="records">

        <!-- Filter Panel Drawer -->
        <div filter-panel class="grid grid-cols-1 md:grid-cols-4 gap-6 pt-1">
          <!-- 1. Curriculum Level -->
          <app-filter-section title="1. Curriculum Level">
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
          </app-filter-section>

          <!-- 2. Outcome Status -->
          <app-filter-section title="2. Outcome Status">
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
          </app-filter-section>

          <!-- 3. Release State -->
          <app-filter-section title="3. Release State">
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
          </app-filter-section>

          <!-- 4. Training Plan Dropdown -->
          <app-filter-section title="4. Parent Training Plan">
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
          </app-filter-section>
        </div>

        <!-- Active Filter Chips -->
        <div filter-chips class="contents">
          @for (lvl of selectedLevels(); track lvl) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary capitalize">
              <span>Level: <strong>{{ lvl }}</strong></span>
              <button type="button" (click)="removeLevelFilter(lvl)" class="hover:text-rose-600 cursor-pointer flex items-center">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          }

          @for (st of selectedStatuses(); track st) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary uppercase">
              <span>Status: <strong>{{ st }}</strong></span>
              <button type="button" (click)="removeStatusFilter(st)" class="hover:text-rose-600 cursor-pointer flex items-center">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          }

          @for (rel of selectedReleaseStates(); track rel) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary uppercase">
              <span>Release: <strong>{{ rel }}</strong></span>
              <button type="button" (click)="removeReleaseStateFilter(rel)" class="hover:text-rose-600 cursor-pointer flex items-center">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          }

          @if (selectedPlanId()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-200 border border-base-300 text-text-primary">
              <span>Plan: <strong>{{ getPlanName(selectedPlanId()) }}</strong></span>
              <button type="button" (click)="selectedPlanId.set(''); draftPlanId.set(''); currentPage.set(1)" class="hover:text-rose-600 cursor-pointer flex items-center">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          }
        </div>

        <!-- Table View -->
        <div table-view class="bg-base-100 border border-base-300 rounded-2xl shadow-sm overflow-hidden">
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
                    
                    <td class="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        [checked]="selectedIds().has(t.transcriptId)"
                        (change)="toggleRowSelection(t.transcriptId)"
                        class="rounded border-base-300 text-tenant-600 focus:ring-0 cursor-pointer" />
                    </td>

                    <td class="py-3.5 px-4">
                      <div class="flex items-center space-x-2.5">
                        <app-custom-avatar [name]="t.traineeName" [url]="t.traineeAvatar" size="sm" shape="circle"></app-custom-avatar>
                        <div>
                          <div class="font-bold text-text-primary">{{ t.traineeName }}</div>
                          <div class="text-[11px] text-text-secondary font-mono">{{ t.content.traineeId }}</div>
                        </div>
                      </div>
                    </td>

                    <td class="py-3.5 px-3">
                      <span [class]="getLevelBadgeClass(t.level)">
                        {{ t.level | uppercase }}
                      </span>
                    </td>

                    <td class="py-3.5 px-4 max-w-xs">
                      <div class="font-semibold text-text-primary truncate" [title]="t.scopeName">
                        {{ t.scopeName }}
                      </div>
                      <div class="text-[10px] text-text-secondary font-mono flex items-center gap-1 mt-0.5">
                        <span class="material-symbols-outlined text-[12px] text-tenant-500">pin</span>
                        {{ t.content.serialNumber }}
                      </div>
                    </td>

                    <td class="py-3.5 px-4 max-w-xs">
                      <div class="text-text-secondary truncate text-[11px]" [title]="t.planName">
                        {{ t.planName }}
                      </div>
                    </td>

                    <td class="py-3.5 px-3 text-center">
                      <div class="font-mono font-bold text-text-primary">{{ t.content.result }}</div>
                      <div class="text-[10px] text-text-secondary font-mono">{{ t.content.gradingType }}</div>
                    </td>

                    <td class="py-3.5 px-3 text-center">
                      <span [class]="getStatusBadgeClass(t.content.status)">
                        {{ t.content.status | uppercase }}
                      </span>
                    </td>

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

                    <td class="py-3.5 px-3 text-center font-mono text-text-secondary text-[11px]">
                      {{ t.content.completionDate }}
                    </td>

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
        </div>

        <!-- Grid View -->
        <div grid-view class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (t of paginatedTranscripts(); track t.transcriptId) {
            <div 
              class="bg-base-100 border border-base-300 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
              [class.ring-2]="selectedIds().has(t.transcriptId)"
              [class.ring-tenant-500]="selectedIds().has(t.transcriptId)">
              
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      [checked]="selectedIds().has(t.transcriptId)"
                      (change)="toggleRowSelection(t.transcriptId)"
                      class="rounded border-base-300 text-tenant-600 focus:ring-0 cursor-pointer" />
                    <span [class]="getLevelBadgeClass(t.level)">{{ t.level | uppercase }}</span>
                  </div>
                  <span class="text-[11px] font-mono text-text-secondary font-medium">
                    {{ t.content.serialNumber }}
                  </span>
                </div>

                <div class="flex items-center gap-3 pt-1">
                  <app-custom-avatar [name]="t.traineeName" [url]="t.traineeAvatar" size="md" shape="squircle"></app-custom-avatar>
                  <div>
                    <h4 class="font-bold text-sm text-text-primary">{{ t.traineeName }}</h4>
                    <p class="text-[11px] text-text-secondary font-mono">{{ t.content.traineeId }}</p>
                  </div>
                </div>

                <div>
                  <h5 class="font-semibold text-xs text-text-primary line-clamp-1" [title]="t.scopeName">
                    {{ t.scopeName }}
                  </h5>
                  <p class="text-[11px] text-text-secondary truncate mt-0.5" [title]="t.planName">
                    {{ t.planName }}
                  </p>
                </div>

                <div class="bg-base-200/50 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span class="text-[10px] text-text-secondary block">Score</span>
                    <span class="font-mono font-bold text-text-primary">{{ t.content.result }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-text-secondary block">Status</span>
                    <span class="font-semibold text-[11px]" [class]="getStatusTextColor(t.content.status)">
                      {{ t.content.status | uppercase }}
                    </span>
                  </div>
                  <div>
                    <span class="text-[10px] text-text-secondary block">Release</span>
                    <span class="font-semibold text-[11px]" [class]="getReleaseStateTextColor(t.releaseState)">
                      {{ t.releaseState | uppercase }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-base-300 flex items-center justify-between">
                <span class="text-[11px] font-mono text-text-secondary">
                  {{ t.content.completionDate }}
                </span>

                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="viewTranscript(t)"
                    class="p-1.5 bg-base-200 hover:bg-base-300 text-text-primary rounded-xl transition-colors cursor-pointer"
                    title="View Transcript">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                  </button>

                  <button
                    type="button"
                    (click)="exportIndividual(t)"
                    class="p-1.5 bg-base-200 hover:bg-base-300 text-text-primary rounded-xl transition-colors cursor-pointer"
                    title="Export CSV">
                    <span class="material-symbols-outlined text-sm">download</span>
                  </button>

                  @if (t.releaseState === 'available' || t.releaseState === 'pending') {
                    <button
                      type="button"
                      (click)="releaseTranscript(t.transcriptId)"
                      class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-xs">verified</span>
                      <span>Release</span>
                    </button>
                  } @else if (t.releaseState === 'released') {
                    <button
                      type="button"
                      (click)="promptRevokeTranscript(t)"
                      class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                      title="Revoke Transcript">
                      <span class="material-symbols-outlined text-sm">block</span>
                    </button>
                  }
                </div>
              </div>

            </div>
          }
        </div>

      </app-data-grid>

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

  // Standardized app-kpi-card Computations
  kpiTotalGenerated = computed<Kpi>(() => ({
    title: 'Total Generated',
    value: String(this.totalGeneratedCount()),
    change: `+${this.totalGeneratedCount()} total`,
    icon: 'activity',
    color: 'sky',
    subtext: 'Official certified records'
  }));

  kpiReleased = computed<Kpi>(() => ({
    title: 'Released (Trainee Visible)',
    value: String(this.releasedCount()),
    change: `+${Math.round((this.releasedCount() / (this.totalGeneratedCount() || 1)) * 100)}% live`,
    icon: 'verified',
    color: 'emerald',
    subtext: 'Verified & downloadable in portal'
  }));

  kpiAvailable = computed<Kpi>(() => ({
    title: 'Available (Unreleased)',
    value: String(this.availableCount()),
    change: `${this.availableCount()} unreleased`,
    icon: 'pending',
    color: 'sky',
    subtext: 'Awaiting release authorization'
  }));

  kpiPendingClosure = computed<Kpi>(() => ({
    title: 'Pending Plan Closure',
    value: String(this.pendingClosureCount()),
    change: 'Gated plans',
    icon: 'pending',
    color: 'amber',
    subtext: 'Gated until plan completion'
  }));

  hasActiveFilters = computed(() => {
    return this.selectedLevels().length > 0 ||
      this.selectedStatuses().length > 0 ||
      this.selectedReleaseStates().length > 0 ||
      !!this.selectedPlanId();
  });

  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredTranscripts().length > 0) return 'none';
    if (this.allTranscripts().length === 0) return 'true_empty';
    if (this.searchTerm().trim().length > 0) return 'search_miss';
    if (this.hasActiveFilters()) return 'filter_miss';
    return 'true_empty';
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

  getStatusTextColor(status: TranscriptStatus): string {
    switch (status) {
      case 'pass':
        return 'text-emerald-600 dark:text-emerald-400 font-bold';
      case 'fail':
        return 'text-rose-600 dark:text-rose-400 font-bold';
      case 'completed':
        return 'text-blue-600 dark:text-blue-400 font-bold';
      default:
        return 'text-text-primary font-bold';
    }
  }

  getReleaseStateTextColor(state: TranscriptReleaseState): string {
    switch (state) {
      case 'released':
        return 'text-emerald-600 dark:text-emerald-400 font-bold';
      case 'available':
        return 'text-blue-600 dark:text-blue-400 font-bold';
      case 'pending':
        return 'text-amber-600 dark:text-amber-400 font-bold';
      case 'revoked':
        return 'text-rose-600 dark:text-rose-400 font-bold';
      default:
        return 'text-text-secondary font-bold';
    }
  }
}

