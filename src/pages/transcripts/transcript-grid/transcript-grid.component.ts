import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  TranscriptRecord,
  TranscriptLevel,
  TranscriptStatus,
  TranscriptReleaseState
} from '../../../models/transcript.model';
import { TranscriptSheetComponent } from '../../../components/transcript-sheet/transcript-sheet.component';

@Component({
  selector: 'app-transcript-grid',
  imports: [CommonModule, FormsModule, RouterModule, TranscriptSheetComponent],
  template: `
    <div class="min-h-screen bg-stone-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      
      <!-- Page Header & Global Actions -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div class="flex items-center space-x-2 text-xs text-stone-500 mb-1">
            <span>Academic Records</span>
            <span>/</span>
            <span class="text-stone-900 font-medium">Credentials & Output</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            Transcripts
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold border border-stone-200">
              {{ filteredTranscripts().length }} records
            </span>
          </h1>
          <p class="text-sm text-stone-600 mt-0.5">
            View and export trainee transcripts across courses, phases and plans.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          @if (hasActiveFilters() || searchTerm()) {
            <button
              (click)="resetGrid()"
              class="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center space-x-1.5 border border-stone-300/80"
              title="Reset all filters and search"
            >
              <span class="material-icons-outlined text-sm">restart_alt</span>
              <span>Reset</span>
            </button>
          }

          <button
            (click)="toggleFilterPanel()"
            class="px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center space-x-1.5"
            [class]="isFilterPanelOpen() ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'"
          >
            <span class="material-icons-outlined text-sm">filter_list</span>
            <span>Filters</span>
            @if (activeFilterCount() > 0) {
              <span class="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                {{ activeFilterCount() }}
              </span>
            }
          </button>

          <button
            (click)="openBulkExportModal()"
            class="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <span class="material-icons-outlined text-sm">file_download</span>
            <span>Bulk Export</span>
            @if (selectedIds().size > 0) {
              <span class="px-1.5 py-0.2 bg-emerald-500 text-stone-900 rounded font-bold text-[10px]">
                {{ selectedIds().size }}
              </span>
            }
          </button>
        </div>
      </div>

      <!-- Telemetry KPI Light Strip -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
            <span class="material-icons-outlined">receipt_long</span>
          </div>
          <div>
            <div class="text-xs font-medium text-stone-500">Total Generated</div>
            <div class="text-lg font-bold text-stone-900 font-mono">{{ totalGeneratedCount() }}</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <span class="material-icons-outlined">verified</span>
          </div>
          <div>
            <div class="text-xs font-medium text-stone-500">Released (Trainee Visible)</div>
            <div class="text-lg font-bold text-emerald-700 font-mono">{{ releasedCount() }}</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <span class="material-icons-outlined">pending_actions</span>
          </div>
          <div>
            <div class="text-xs font-medium text-stone-500">Available (Unreleased)</div>
            <div class="text-lg font-bold text-blue-700 font-mono">{{ availableCount() }}</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <span class="material-icons-outlined">lock_clock</span>
          </div>
          <div>
            <div class="text-xs font-medium text-stone-500">Pending Plan Closure</div>
            <div class="text-lg font-bold text-amber-700 font-mono">{{ pendingClosureCount() }}</div>
          </div>
        </div>
      </div>

      <!-- Search Bar & Applied Filters Bar -->
      <div class="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div class="relative">
          <span class="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-lg">search</span>
          <input
            type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Search by trainee name, trainee ID, course/phase scope, or serial number..."
            class="w-full pl-10 pr-4 py-2.5 bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-xs text-stone-800 rounded-xl border border-stone-200 focus:border-emerald-500 focus:outline-none transition-all"
          />
          @if (searchTerm()) {
            <button
              (click)="searchTerm.set('')"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <span class="material-icons-outlined text-sm">close</span>
            </button>
          }
        </div>

        <!-- Filter Panel Drawer (When Opened) -->
        @if (isFilterPanelOpen()) {
          <div class="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4 text-xs animate-fade-in">
            <div class="flex items-center justify-between border-b border-stone-200 pb-2">
              <span class="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span class="material-icons-outlined text-sm">tune</span>
                Filter Criteria
              </span>
              <button (click)="clearAllFilters()" class="text-emerald-700 hover:underline font-semibold">
                Clear All
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Level Multi-Select -->
              <div>
                <label class="block font-semibold text-stone-700 mb-1.5">Availability Level</label>
                <div class="flex flex-wrap gap-1.5">
                  @for (lvl of ['course', 'phase', 'plan']; track lvl) {
                    <button
                      (click)="toggleLevelFilter(lvl)"
                      class="px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors capitalize"
                      [class]="isLevelSelected(lvl) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'"
                    >
                      {{ lvl }}
                    </button>
                  }
                </div>
              </div>

              <!-- Status Multi-Select -->
              <div>
                <label class="block font-semibold text-stone-700 mb-1.5">Outcome Status</label>
                <div class="flex flex-wrap gap-1.5">
                  @for (st of ['pass', 'fail', 'completed']; track st) {
                    <button
                      (click)="toggleStatusFilter(st)"
                      class="px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors uppercase"
                      [class]="isStatusSelected(st) ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'"
                    >
                      {{ st }}
                    </button>
                  }
                </div>
              </div>

              <!-- Release State Multi-Select -->
              <div>
                <label class="block font-semibold text-stone-700 mb-1.5">Release State</label>
                <div class="flex flex-wrap gap-1.5">
                  @for (rel of ['released', 'available', 'pending', 'revoked']; track rel) {
                    <button
                      (click)="toggleReleaseStateFilter(rel)"
                      class="px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors capitalize"
                      [class]="isReleaseStateSelected(rel) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'"
                    >
                      {{ rel }}
                    </button>
                  }
                </div>
              </div>

              <!-- Parent Plan Select -->
              <div>
                <label class="block font-semibold text-stone-700 mb-1.5">Parent Training Plan</label>
                <select
                  [ngModel]="selectedPlanId()"
                  (ngModelChange)="selectedPlanId.set($event)"
                  class="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">All Training Plans</option>
                  @for (p of lms.plans(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
        }

        <!-- Active Filter Chips Bar -->
        @if (hasActiveFilters()) {
          <div class="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span class="text-stone-500 text-[11px] font-medium">Active Filters:</span>
            
            @for (lvl of selectedLevels(); track lvl) {
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium flex items-center gap-1 border border-emerald-200">
                Level: {{ lvl }}
                <button (click)="toggleLevelFilter(lvl)" class="hover:text-emerald-950">
                  <span class="material-icons-outlined text-xs">close</span>
                </button>
              </span>
            }

            @for (st of selectedStatuses(); track st) {
              <span class="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-800 text-[11px] font-medium flex items-center gap-1 border border-stone-300">
                Status: {{ st | uppercase }}
                <button (click)="toggleStatusFilter(st)" class="hover:text-stone-950">
                  <span class="material-icons-outlined text-xs">close</span>
                </button>
              </span>
            }

            @for (rel of selectedReleaseStates(); track rel) {
              <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-medium flex items-center gap-1 border border-blue-200">
                Release: {{ rel }}
                <button (click)="toggleReleaseStateFilter(rel)" class="hover:text-blue-950">
                  <span class="material-icons-outlined text-xs">close</span>
                </button>
              </span>
            }

            @if (selectedPlanId()) {
              <span class="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-medium flex items-center gap-1 border border-purple-200">
                Plan: {{ getPlanName(selectedPlanId()) }}
                <button (click)="selectedPlanId.set('')" class="hover:text-purple-950">
                  <span class="material-icons-outlined text-xs">close</span>
                </button>
              </span>
            }

            <button (click)="clearAllFilters()" class="text-rose-600 hover:underline text-[11px] font-medium ml-2">
              Clear All Filters
            </button>
          </div>
        }
      </div>

      <!-- Transcript Records Grid Table -->
      <div class="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        
        <!-- Selection Info Bar (When Rows Selected) -->
        @if (selectedIds().size > 0) {
          <div class="px-6 py-2.5 bg-stone-900 text-white flex items-center justify-between text-xs animate-fade-in">
            <div class="flex items-center space-x-2">
              <span class="material-icons-outlined text-emerald-400 text-base">check_circle</span>
              <span class="font-medium">{{ selectedIds().size }} transcript(s) selected for bulk export</span>
            </div>
            <div class="flex items-center space-x-2">
              <button
                (click)="selectAllRows()"
                class="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px]"
              >
                Select All ({{ filteredTranscripts().length }})
              </button>
              <button
                (click)="clearRowSelection()"
                class="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px]"
              >
                Deselect
              </button>
              <button
                (click)="openBulkExportModal()"
                class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs flex items-center gap-1"
              >
                <span class="material-icons-outlined text-xs">download</span>
                Export Selected
              </button>
            </div>
          </div>
        }

        <!-- Table Container -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <th class="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    [checked]="isAllSelected()"
                    (change)="toggleSelectAll()"
                    class="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th class="py-3 px-4">Trainee Identity</th>
                <th class="py-3 px-3">Level</th>
                <th class="py-3 px-4">Curriculum Scope</th>
                <th class="py-3 px-4">Parent Plan</th>
                <th class="py-3 px-3 text-center">Score / Result</th>
                <th class="py-3 px-3 text-center">Status</th>
                <th class="py-3 px-3 text-center">Release State</th>
                <th class="py-3 px-3 text-center">Completion</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200/80">
              @for (t of filteredTranscripts(); track t.transcriptId) {
                <tr class="hover:bg-stone-50/70 transition-colors" [class.bg-emerald-50/20]="selectedIds().has(t.transcriptId)">
                  
                  <!-- Checkbox -->
                  <td class="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      [checked]="selectedIds().has(t.transcriptId)"
                      (change)="toggleRowSelection(t.transcriptId)"
                      class="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>

                  <!-- Trainee -->
                  <td class="py-3.5 px-4">
                    <div class="flex items-center space-x-2.5">
                      <img
                        [src]="t.traineeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'"
                        [alt]="t.traineeName"
                        referrerpolicy="no-referrer"
                        class="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                      <div>
                        <div class="font-bold text-stone-900">{{ t.traineeName }}</div>
                        <div class="text-[11px] text-stone-500 font-mono">{{ t.content.traineeId }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Level Badge -->
                  <td class="py-3.5 px-3">
                    <span [class]="getLevelBadgeClass(t.level)">
                      {{ t.level | uppercase }}
                    </span>
                  </td>

                  <!-- Scope Name -->
                  <td class="py-3.5 px-4 max-w-xs">
                    <div class="font-semibold text-stone-800 truncate" [title]="t.scopeName">
                      {{ t.scopeName }}
                    </div>
                    <div class="text-[10px] text-stone-500 font-mono">{{ t.content.serialNumber }}</div>
                  </td>

                  <!-- Parent Plan -->
                  <td class="py-3.5 px-4 max-w-xs">
                    <div class="text-stone-600 truncate text-[11px]" [title]="t.planName">
                      {{ t.planName }}
                    </div>
                  </td>

                  <!-- Score / Result -->
                  <td class="py-3.5 px-3 text-center">
                    <div class="font-mono font-bold text-stone-900">{{ t.content.result }}</div>
                    <div class="text-[10px] text-stone-400 font-mono">{{ t.content.gradingType }}</div>
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
                      <span class="block text-[9px] text-amber-600 font-medium mt-0.5" title="Plan not closed yet">
                        Plan Open
                      </span>
                    }
                  </td>

                  <!-- Completion Date -->
                  <td class="py-3.5 px-3 text-center font-mono text-stone-600 text-[11px]">
                    {{ t.content.completionDate }}
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-4 text-right">
                    <div class="flex items-center justify-end space-x-1.5">
                      <button
                        (click)="viewTranscript(t)"
                        class="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title="View Official Transcript Document"
                      >
                        <span class="material-icons-outlined text-base">visibility</span>
                      </button>

                      <button
                        (click)="exportIndividual(t)"
                        class="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Export Transcript PDF / CSV"
                      >
                        <span class="material-icons-outlined text-base">download</span>
                      </button>

                      <!-- Release / Revoke Action -->
                      @if (t.releaseState === 'available' || t.releaseState === 'pending') {
                        <button
                          (click)="releaseTranscript(t.transcriptId)"
                          class="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Release Transcript to Trainee"
                        >
                          <span class="material-icons-outlined text-base">verified</span>
                        </button>
                      } @else if (t.releaseState === 'released') {
                        <button
                          (click)="promptRevokeTranscript(t)"
                          class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Revoke Transcript"
                        >
                          <span class="material-icons-outlined text-base">block</span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- 3 Distinct Empty States -->
        @if (filteredTranscripts().length === 0) {
          <div class="py-16 px-6 text-center space-y-3">
            @if (allTranscripts().length === 0) {
              <!-- Case 1: True Empty -->
              <span class="material-icons-outlined text-4xl text-stone-400">inventory_2</span>
              <h3 class="text-sm font-bold text-stone-800">No transcript information is available to display.</h3>
              <p class="text-xs text-stone-500 max-w-sm mx-auto">
                Transcripts will be automatically generated upon trainees completing courses, phases, or closed plans.
              </p>
            } @else if (searchTerm() && !hasActiveFilters()) {
              <!-- Case 2: Search Miss -->
              <span class="material-icons-outlined text-4xl text-stone-400">search_off</span>
              <h3 class="text-sm font-bold text-stone-800">No transcript found</h3>
              <p class="text-xs text-stone-500 max-w-sm mx-auto">
                No records matching "<span class="font-semibold text-stone-700">{{ searchTerm() }}</span>". Try revising your search query.
              </p>
              <button
                (click)="searchTerm.set('')"
                class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
              >
                Clear Search
              </button>
            } @else {
              <!-- Case 3: Filter Miss -->
              <span class="material-icons-outlined text-4xl text-stone-400">filter_alt_off</span>
              <h3 class="text-sm font-bold text-stone-800">No transcript found matching the selected filters.</h3>
              <p class="text-xs text-stone-500 max-w-sm mx-auto">
                Try clearing or loosening your filter criteria to view more records.
              </p>
              <button
                (click)="clearAllFilters()"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Clear Selected Filters
              </button>
            }
          </div>
        }
      </div>

      <!-- Bulk Export Modal Dialog -->
      @if (isBulkExportModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-stone-100 pb-3">
              <div class="flex items-center space-x-2.5">
                <span class="p-2 bg-stone-900 text-white rounded-lg flex items-center justify-center">
                  <span class="material-icons-outlined text-lg">file_download</span>
                </span>
                <div>
                  <h3 class="text-base font-bold text-stone-900">Bulk Export Transcripts</h3>
                  <p class="text-xs text-stone-500">
                    Exporting {{ exportTargetCount() }} transcript record(s)
                  </p>
                </div>
              </div>
              <button (click)="isBulkExportModalOpen.set(false)" class="text-stone-400 hover:text-stone-600">
                <span class="material-icons-outlined text-lg">close</span>
              </button>
            </div>

            <!-- Export Options -->
            <div class="space-y-3.5 text-xs">
              <div>
                <label class="block font-semibold text-stone-700 mb-1.5">Export Package Format</label>
                <div class="grid grid-cols-3 gap-2">
                  <label class="border rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                         [class]="exportFormat() === 'pdfZip' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold' : 'border-stone-200 text-stone-600 hover:bg-stone-50'">
                    <input type="radio" name="exportFormat" value="pdfZip" [ngModel]="exportFormat()" (ngModelChange)="exportFormat.set($event)" class="sr-only" />
                    <span class="material-icons-outlined text-lg mb-1 text-emerald-700">folder_zip</span>
                    <span>PDF Archive (ZIP)</span>
                  </label>

                  <label class="border rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                         [class]="exportFormat() === 'csv' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold' : 'border-stone-200 text-stone-600 hover:bg-stone-50'">
                    <input type="radio" name="exportFormat" value="csv" [ngModel]="exportFormat()" (ngModelChange)="exportFormat.set($event)" class="sr-only" />
                    <span class="material-icons-outlined text-lg mb-1 text-emerald-700">table_chart</span>
                    <span>Summary Sheet (CSV)</span>
                  </label>

                  <label class="border rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                         [class]="exportFormat() === 'both' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold' : 'border-stone-200 text-stone-600 hover:bg-stone-50'">
                    <input type="radio" name="exportFormat" value="both" [ngModel]="exportFormat()" (ngModelChange)="exportFormat.set($event)" class="sr-only" />
                    <span class="material-icons-outlined text-lg mb-1 text-emerald-700">all_inbox</span>
                    <span>Both (ZIP + CSV)</span>
                  </label>
                </div>
              </div>

              <!-- Unreleased Toggle -->
              <div class="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div class="font-semibold text-stone-800">Include Unreleased / Drafts</div>
                  <div class="text-[11px] text-stone-500">Exports will be stamped with a "Draft / Unreleased" watermark</div>
                </div>
                <input
                  type="checkbox"
                  [ngModel]="includeUnreleased()"
                  (ngModelChange)="includeUnreleased.set($event)"
                  class="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <!-- Scope Info Note -->
              <div class="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 flex items-start space-x-2">
                <span class="material-icons-outlined text-emerald-700 text-sm mt-0.5">info</span>
                <div class="text-[11px]">
                  {{ selectedIds().size > 0 ? 'Exporting manually selected ' + selectedIds().size + ' transcripts.' : 'Exporting all ' + filteredTranscripts().length + ' transcripts matching active search & filter parameters.' }}
                </div>
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <div class="flex items-center justify-end space-x-2.5 pt-2 border-t border-stone-100">
              <button
                (click)="isBulkExportModalOpen.set(false)"
                class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                (click)="executeBulkExport()"
                class="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span class="material-icons-outlined text-sm">download</span>
                <span>Export Now</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Revoke Confirmation Dialog -->
      @if (transcriptToRevoke()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 space-y-4">
            <div class="flex items-center space-x-3 text-rose-600">
              <span class="material-icons-outlined text-2xl">warning</span>
              <h3 class="text-base font-bold text-stone-900">Revoke Transcript?</h3>
            </div>
            
            <p class="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to revoke transcript <strong class="text-stone-900 font-mono">{{ transcriptToRevoke()?.content?.serialNumber }}</strong> for <strong class="text-stone-900">{{ transcriptToRevoke()?.traineeName }}</strong>? This will immediately hide the transcript from the trainee's portal.
            </p>

            <div class="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                (click)="transcriptToRevoke.set(null)"
                class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold text-xs transition-colors"
              >
                No, Keep Active
              </button>
              <button
                (click)="confirmRevoke()"
                class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
              >
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

  // Search & Filter State Signals
  searchTerm = signal<string>('');
  isFilterPanelOpen = signal<boolean>(false);
  selectedLevels = signal<TranscriptLevel[]>([]);
  selectedStatuses = signal<TranscriptStatus[]>([]);
  selectedReleaseStates = signal<TranscriptReleaseState[]>([]);
  selectedPlanId = signal<string>('');

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

  // Level selection toggle
  toggleLevelFilter(lvl: string): void {
    const level = lvl as TranscriptLevel;
    this.selectedLevels.update(current => {
      if (current.includes(level)) {
        return current.filter(l => l !== level);
      } else {
        return [...current, level];
      }
    });
  }

  isLevelSelected(lvl: string): boolean {
    return this.selectedLevels().includes(lvl as TranscriptLevel);
  }

  // Status selection toggle
  toggleStatusFilter(st: string): void {
    const status = st as TranscriptStatus;
    this.selectedStatuses.update(current => {
      if (current.includes(status)) {
        return current.filter(s => s !== status);
      } else {
        return [...current, status];
      }
    });
  }

  isStatusSelected(st: string): boolean {
    return this.selectedStatuses().includes(st as TranscriptStatus);
  }

  // Release state selection toggle
  toggleReleaseStateFilter(rel: string): void {
    const state = rel as TranscriptReleaseState;
    this.selectedReleaseStates.update(current => {
      if (current.includes(state)) {
        return current.filter(s => s !== state);
      } else {
        return [...current, state];
      }
    });
  }

  isReleaseStateSelected(rel: string): boolean {
    return this.selectedReleaseStates().includes(rel as TranscriptReleaseState);
  }

  toggleFilterPanel(): void {
    this.isFilterPanelOpen.update(v => !v);
  }

  clearAllFilters(): void {
    this.selectedLevels.set([]);
    this.selectedStatuses.set([]);
    this.selectedReleaseStates.set([]);
    this.selectedPlanId.set('');
  }

  resetGrid(): void {
    this.searchTerm.set('');
    this.clearAllFilters();
    this.clearRowSelection();
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
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200';
      case 'phase':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200';
      case 'course':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
      default:
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700';
    }
  }

  getStatusBadgeClass(status: TranscriptStatus): string {
    switch (status) {
      case 'pass':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'fail':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200';
      case 'completed':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200';
      default:
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700';
    }
  }

  getReleaseStateBadgeClass(state: TranscriptReleaseState): string {
    switch (state) {
      case 'released':
        return 'px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize';
      case 'available':
        return 'px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize';
      case 'pending':
        return 'px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 capitalize';
      case 'revoked':
        return 'px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 capitalize';
      default:
        return 'px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600';
    }
  }
}
