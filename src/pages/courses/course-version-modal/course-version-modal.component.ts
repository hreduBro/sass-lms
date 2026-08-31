import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseEntity } from '../../../models/course.model';

@Component({
  selector: 'app-course-version-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (course(); as crs) {
      <div class="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
        <div class="w-full max-w-2xl bg-base-100 rounded-3xl shadow-2xl border border-base-300 flex flex-col overflow-hidden animate-scale-up max-h-[90vh]">
          <!-- Modal Header -->
          <div class="p-6 border-b border-base-300 bg-base-200/50 flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20">
                <span class="material-symbols-outlined text-2xl">history_edu</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 font-mono">
                    {{ crs.code }}
                  </span>
                  <span class="text-xs font-semibold text-text-secondary">Version Management</span>
                </div>
                <h2 class="text-base font-bold text-text-primary mt-0.5">{{ crs.title }}</h2>
              </div>
            </div>
            <button 
              (click)="close.emit()" 
              class="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-base-300 transition-colors">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <!-- Current Active Version Card -->
          <div class="p-6 border-b border-base-300 bg-base-100">
            <div class="p-4 rounded-2xl bg-base-200/60 border border-base-300 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="px-2.5 py-1 rounded-lg bg-tenant-500 text-white font-bold text-xs font-mono">
                    {{ crs.version.label }}
                  </span>
                  <div>
                    <span class="text-xs font-bold text-text-primary">
                      {{ crs.version.state === 'published-current' ? 'Live Current Version' : (crs.version.state === 'draft' ? 'Draft In-Progress' : 'Historical Snapshot') }}
                    </span>
                    @if (crs.version.publishedAt) {
                      <p class="text-[11px] text-text-secondary">Published {{ crs.version.publishedAt }} by {{ crs.version.publishedBy }}</p>
                    }
                  </div>
                </div>

                <div class="text-right">
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20">
                    {{ crs.version.lockedInPhasesCount || crs.usedInPhasesCount || 0 }} Phases Locked
                  </span>
                </div>
              </div>

              <!-- Explanation of Independent Snapshot Model (§4.4 / BRD §Rule 4) -->
              <div class="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-text-secondary flex items-start gap-2.5">
                <span class="material-symbols-outlined text-indigo-500 text-base mt-0.5">verified_user</span>
                <div>
                  <strong class="text-indigo-600 block mb-0.5">Independent Snapshot Protection</strong>
                  Running curriculum phases pin to the exact version snapshot at assignment time. Creating or publishing a new version will never mutate or disrupt in-progress learners.
                </div>
              </div>
            </div>
          </div>

          <!-- Version History Timeline -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-text-primary uppercase tracking-wider">Publication History & Snapshots</h3>
              <span class="text-xs text-text-secondary font-mono">{{ (crs.versionHistory?.length || 0) + 1 }} total iterations</span>
            </div>

            <div class="space-y-3">
              <!-- Current item -->
              <div class="p-3.5 rounded-2xl border border-tenant-500/30 bg-tenant-500/5 flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-xl bg-tenant-500 text-white font-bold text-xs flex items-center justify-center font-mono">
                    {{ crs.version.versionNumber }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-text-primary">{{ crs.version.label }}</span>
                      <span class="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {{ crs.status === 'published' ? 'Active Live' : 'Current Draft' }}
                      </span>
                    </div>
                    <p class="text-xs text-text-secondary mt-1">
                      {{ crs.version.changeSummary || 'Active course configuration.' }}
                    </p>
                    @if (crs.version.lockedPhaseNames && crs.version.lockedPhaseNames.length > 0) {
                      <div class="mt-2 flex flex-wrap gap-1">
                        @for (phase of crs.version.lockedPhaseNames; track phase) {
                          <span class="text-[10px] px-2 py-0.5 rounded bg-base-200 text-text-secondary border border-base-300 font-mono">
                            📌 {{ phase }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Historical snapshots -->
              @for (snap of crs.versionHistory || []; track snap.versionNumber) {
                <div class="p-3.5 rounded-2xl border border-base-300 bg-base-200/30 flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-xl bg-base-300 text-text-secondary font-bold text-xs flex items-center justify-center font-mono">
                      {{ snap.versionNumber }}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-text-primary">{{ snap.label }}</span>
                        <span class="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-500/10 text-slate-600">
                          Archived Snapshot
                        </span>
                        <span class="text-[11px] text-text-secondary">{{ snap.publishedAt }}</span>
                      </div>
                      <p class="text-xs text-text-secondary mt-1">
                        {{ snap.changeSummary }}
                      </p>
                      @if (snap.lockedInPhases && snap.lockedInPhases.length > 0) {
                        <div class="mt-2 flex flex-wrap gap-1">
                          @for (phase of snap.lockedInPhases; track phase) {
                            <span class="text-[10px] px-2 py-0.5 rounded bg-base-200 text-text-secondary border border-base-300 font-mono">
                              📌 {{ phase }}
                            </span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Modal Footer with New Version Trigger -->
          <div class="p-6 border-t border-base-300 bg-base-200/50 flex items-center justify-between">
            <button 
              (click)="close.emit()" 
              class="px-4 py-2.5 rounded-xl border border-base-300 hover:bg-base-200 text-text-secondary font-semibold text-xs transition-colors">
              Close
            </button>

            @if (crs.status === 'published') {
              <button 
                (click)="triggerNewVersion.emit()" 
                class="px-4 py-2.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all">
                <span class="material-symbols-outlined text-sm">add_circle</span>
                <span>Create New Version (v{{ (crs.version.versionNumber || 1) + 1 }}.0 Draft)</span>
              </button>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class CourseVersionModalComponent {
  course = input<CourseEntity | null>(null);
  close = output<void>();
  triggerNewVersion = output<void>();
}
