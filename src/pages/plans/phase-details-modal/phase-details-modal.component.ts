import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Phase, Plan } from '../../../models/plan.model';

@Component({
  selector: 'app-phase-details-modal',
  imports: [CommonModule],
  template: `
    <div 
      class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop overflow-y-auto"
      (click)="onBackdropClick($event)">
      
      <div 
        id="phase-details-modal-card"
        class="relative bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all transform animate-modal-card m-auto"
        (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              #{{ phase().sequence }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-text-primary">{{ phase().name }}</h3>
                <span 
                  class="px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                  [ngClass]="getStatusBadgeClass(phase().status)">
                  {{ phase().status }}
                </span>
              </div>
              <p class="text-xs text-text-secondary mt-0.5">
                Phase {{ phase().sequence }} of {{ totalPhases() }} • Learning Journey Step
              </p>
            </div>
          </div>
          <button 
            id="close-phase-modal-btn"
            type="button" 
            (click)="close.emit()" 
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-300/50 transition-colors">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Parent Plan Context Strip -->
        <div class="px-6 py-3 bg-tenant-50/50 dark:bg-tenant-950/20 border-b border-tenant-200/50 dark:border-tenant-900/30 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-text-secondary">
            <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-400">event_note</span>
            <span class="font-medium text-text-primary">{{ plan().name }}</span>
            <span class="font-mono text-[11px] px-1.5 py-0.5 rounded bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
              {{ plan().planCode }}
            </span>
          </div>
          <div class="text-[11px] text-text-secondary">
            Fixed LMS Workspace: <span class="font-semibold text-text-primary">{{ plan().lmsId }}</span>
          </div>
        </div>

        <!-- Modal Body Content -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          <!-- Key Metrics Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800">
              <div class="text-[10px] uppercase tracking-wider text-text-secondary font-medium">Start Date</div>
              <div class="text-xs font-bold text-text-primary mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-tenant-500">calendar_today</span>
                {{ phase().startDate }}
              </div>
            </div>

            <div class="p-3 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800">
              <div class="text-[10px] uppercase tracking-wider text-text-secondary font-medium">End Date</div>
              <div class="text-xs font-bold text-text-primary mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-rose-500">event_busy</span>
                {{ phase().endDate }}
              </div>
            </div>

            <div class="p-3 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800">
              <div class="text-[10px] uppercase tracking-wider text-text-secondary font-medium">Courses Included</div>
              <div class="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">school</span>
                {{ phase().courseCount }} Modules
              </div>
            </div>

            <div class="p-3 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800">
              <div class="text-[10px] uppercase tracking-wider text-text-secondary font-medium">Delivery Classes</div>
              <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">co_present</span>
                {{ phase().deliveryClassCount }} Live / ILT
              </div>
            </div>
          </div>

          <!-- Description -->
          @if (phase().description) {
            <div class="space-y-1.5">
              <h4 class="text-xs font-semibold text-text-primary uppercase tracking-wider">Phase Scope & Learning Objectives</h4>
              <p class="text-xs text-text-secondary leading-relaxed bg-base-200/40 dark:bg-base-300/20 p-3.5 rounded-xl border border-base-300 dark:border-slate-800">
                {{ phase().description }}
              </p>
            </div>
          }

          <!-- Prerequisite & Badge Governance -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Prerequisites -->
            <div class="p-4 rounded-xl border border-base-300 dark:border-slate-800 bg-base-200/40 dark:bg-base-300/20 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-amber-500 text-sm">lock_clock</span>
                  Prerequisite Status
                </span>
                <span 
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  [ngClass]="getPrerequisiteBadgeClass(phase().prerequisiteStatus)">
                  {{ phase().prerequisiteStatus }}
                </span>
              </div>
              <p class="text-[11px] text-text-secondary">
                @if (phase().prerequisiteStatus === 'Met') {
                  Learner prerequisites satisfied for proceeding into this phase.
                } @else if (phase().prerequisiteStatus === 'Pending') {
                  Previous phase deliverables or evaluations must be achieved prior to unlock.
                } @else {
                  No prerequisite gating required for Phase {{ phase().sequence }}.
                }
              </p>
            </div>

            <!-- Certificate & Badge -->
            <div class="p-4 rounded-xl border border-base-300 dark:border-slate-800 bg-base-200/40 dark:bg-base-300/20 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-purple-500 text-sm">military_tech</span>
                  Certificate / Badge
                </span>
                <span 
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  [ngClass]="getCertificateBadgeClass(phase().certificateBadgeStatus)">
                  {{ phase().certificateBadgeStatus }}
                </span>
              </div>
              <p class="text-[11px] text-text-secondary">
                @if (phase().certificateBadgeStatus === 'Issued') {
                  Completion credentials & verifiable badges active for enrolled graduates.
                } @else if (phase().certificateBadgeStatus === 'Configured') {
                  Automated issuance criteria mapped to final milestone completion.
                } @else {
                  No stage certificate mapped to this individual phase.
                }
              </p>
            </div>
          </div>

          <!-- Tasks & Activities -->
          <div class="p-4 rounded-xl border border-base-300 dark:border-slate-800 bg-base-200/40 dark:bg-base-300/20 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-base">checklist</span>
              </div>
              <div>
                <div class="font-semibold text-text-primary">Phase Tasks & Assignments</div>
                <div class="text-[11px] text-text-secondary">{{ phase().taskCount }} structured milestone assignments configured</div>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-base-200 dark:bg-base-300 text-text-primary border border-base-300 dark:border-slate-700">
              {{ phase().taskCount }} Tasks
            </span>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30">
          <div class="text-[11px] text-text-secondary flex items-center gap-1">
            <span class="material-symbols-outlined text-xs text-emerald-500">check_circle</span>
            Date integrity verified with Plan boundaries ({{ plan().startDate }} - {{ plan().endDate }})
          </div>
          <button 
            id="close-phase-details-footer-btn"
            type="button" 
            (click)="close.emit()" 
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-base-200 hover:bg-base-300 border border-base-300 dark:border-slate-700 text-text-primary transition-colors">
            Close
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-scale-up {
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class PhaseDetailsModalComponent {
  phase = input.required<Phase>();
  plan = input.required<Plan>();
  totalPhases = input<number>(1);
  close = output<void>();

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
      case 'In-Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
      case 'Ready':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900';
      case 'Upcoming':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
      case 'Draft':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  }

  getPrerequisiteBadgeClass(status: string): string {
    switch (status) {
      case 'Met':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  getCertificateBadgeClass(status: string): string {
    switch (status) {
      case 'Issued':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300';
      case 'Configured':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }
}
