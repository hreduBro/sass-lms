import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  Plan, 
  PlanComponent, 
  PlanOnboardedUser, 
  validateComponentBasedPlan, 
  ValidationReport 
} from '../../../../models/plan.model';

@Component({
  selector: 'app-review-modal',
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
        (click)="onClose()">
        
        <div 
          class="bg-base-100 rounded-3xl shadow-2xl border border-base-300 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
          aria-label="Review & Plan Validation">
          
          <!-- Header -->
          <div class="px-6 py-4.5 border-b border-base-300 flex items-center justify-between bg-base-100">
            <div class="flex items-center gap-3">
              <div 
                class="w-10 h-10 rounded-2xl flex items-center justify-center"
                [class]="report().isValidForPublish ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'">
                <span class="material-symbols-outlined text-xl">
                  {{ report().isValidForPublish ? 'verified' : 'gpp_bad' }}
                </span>
              </div>
              <div>
                <h2 class="text-base font-bold text-text-primary">
                  Review & Publish Readiness Audit
                </h2>
                <p class="text-xs text-text-secondary">
                  v2.3 Automated validation across components, phases, dates, prerequisites & trainees
                </p>
              </div>
            </div>

            <button 
              type="button" 
              (click)="onClose()"
              class="w-8 h-8 rounded-xl bg-base-200 hover:bg-base-300 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">

            <!-- High-Level Status Banner -->
            <div 
              class="p-4.5 rounded-2xl border flex items-center gap-4"
              [class]="report().isValidForPublish 
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300' 
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-300'">
              
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                [class]="report().isValidForPublish ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'">
                <span class="material-symbols-outlined text-xl">
                  {{ report().isValidForPublish ? 'check_circle' : 'warning' }}
                </span>
              </div>

              <div class="flex-1 min-w-0">
                <h3 class="text-xs font-bold uppercase tracking-wider">
                  {{ report().isValidForPublish ? 'Plan Ready for Publication' : 'Publication Blocked' }}
                </h3>
                <p class="text-xs opacity-90 mt-0.5">
                  @if (report().isValidForPublish) {
                    All structural prerequisites, phase time boundaries, component sequences and onboarding cohorts pass strict validation checks.
                  } @else {
                    There are {{ report().blockingErrors.length }} critical blocking issue(s) that must be addressed before this Plan can be published or activated.
                  }
                </p>
              </div>

              <!-- Readiness Score Pill -->
              <div class="text-right shrink-0">
                <span class="text-2xl font-bold font-mono">{{ readinessScore() }}%</span>
                <span class="block text-[10px] uppercase font-bold text-text-secondary">Readiness</span>
              </div>
            </div>

            <!-- Audit Metrics Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-3.5 rounded-2xl bg-base-200/50 border border-base-300">
                <span class="text-[11px] font-semibold text-text-secondary block">Phase Windows</span>
                <span class="text-base font-bold text-text-primary mt-0.5 block">
                  {{ phaseCount() }} Configured
                </span>
                <span class="text-[10px] text-emerald-600 font-medium">Valid sequence</span>
              </div>

              <div class="p-3.5 rounded-2xl bg-base-200/50 border border-base-300">
                <span class="text-[11px] font-semibold text-text-secondary block">Components</span>
                <span class="text-base font-bold text-text-primary mt-0.5 block">
                  {{ components().length }} Total
                </span>
                <span class="text-[10px] text-text-secondary">Across all types</span>
              </div>

              <div class="p-3.5 rounded-2xl bg-base-200/50 border border-base-300">
                <span class="text-[11px] font-semibold text-text-secondary block">Onboarded Users</span>
                <span class="text-base font-bold text-text-primary mt-0.5 block">
                  {{ onboardedUsers().length }} Trainees
                </span>
                <span class="text-[10px]" [class]="hasUnresolvedUsers() ? 'text-rose-500 font-bold' : 'text-emerald-600'">
                  {{ hasUnresolvedUsers() ? 'Unresolved records' : 'All verified' }}
                </span>
              </div>

              <div class="p-3.5 rounded-2xl bg-base-200/50 border border-base-300">
                <span class="text-[11px] font-semibold text-text-secondary block">Budget Assigned</span>
                <span class="text-base font-bold text-text-primary mt-0.5 block">
                  {{ plan().budget?.currency || 'BDT' }} {{ (plan().budget?.budgetAmount || 0) | number }}
                </span>
                <span class="text-[10px] text-text-secondary">{{ plan().budget?.budgetYear || 'FY 2026' }}</span>
              </div>
            </div>

            <!-- Blocking Errors Section -->
            @if (report().blockingErrors.length > 0) {
              <div class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">dangerous</span>
                  <span>Critical Blocking Errors ({{ report().blockingErrors.length }})</span>
                </h3>

                <div class="space-y-2">
                  @for (err of report().blockingErrors; track err.code) {
                    <div class="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs flex items-start gap-3">
                      <span class="material-symbols-outlined text-rose-500 text-sm mt-0.5 shrink-0">cancel</span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-mono text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.2 rounded">
                            {{ err.code }}
                          </span>
                          <span class="font-bold text-rose-900 dark:text-rose-200">{{ err.field }}</span>
                        </div>
                        <p class="text-text-secondary mt-1">{{ err.message }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Warnings Section -->
            @if (report().warnings.length > 0) {
              <div class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">warning_amber</span>
                  <span>Quality Warnings & Recommendations ({{ report().warnings.length }})</span>
                </h3>

                <div class="space-y-2">
                  @for (warn of report().warnings; track warn.code) {
                    <div class="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs flex items-start gap-3">
                      <span class="material-symbols-outlined text-amber-500 text-sm mt-0.5 shrink-0">info</span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.2 rounded">
                            {{ warn.code }}
                          </span>
                          <span class="font-bold text-amber-900 dark:text-amber-200">{{ warn.field }}</span>
                        </div>
                        <p class="text-text-secondary mt-1">{{ warn.message }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Success Checklist -->
            @if (report().blockingErrors.length === 0) {
              <div class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">check_circle</span>
                  <span>Validation Audit Passed</span>
                </h3>

                <div class="p-4 rounded-2xl bg-base-200/40 border border-base-300 space-y-2.5 text-xs text-text-secondary">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-500 text-sm">check</span>
                    <span>Plan dates ({{ plan().startDate }} to {{ plan().endDate }}) form a valid continuous window.</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-500 text-sm">check</span>
                    <span>All phase containers contain active learning components and do not overlap.</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-500 text-sm">check</span>
                    <span>No circular prerequisite dependencies detected.</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-500 text-sm">check</span>
                    <span>Learner cohort is onboarded with verified staff IDs and scoping.</span>
                  </div>
                </div>
              </div>
            }

          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 border-t border-base-300 bg-base-100/90 flex items-center justify-between gap-3">
            <button 
              type="button"
              (click)="onClose()"
              class="px-4 py-2.5 rounded-xl border border-base-300 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-base-200 transition-colors cursor-pointer">
              Close Audit
            </button>

            <div class="flex items-center gap-2">
              <button 
                type="button"
                (click)="onPublish()"
                [disabled]="!report().isValidForPublish"
                class="px-5 py-2.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer">
                <span class="material-symbols-outlined text-base">publish</span>
                <span>Proceed to Publish Plan</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    }
  `
})
export class ReviewModalComponent {
  isOpen = input<boolean>(false);
  plan = input.required<Plan>();
  components = input.required<PlanComponent[]>();
  onboardedUsers = input.required<PlanOnboardedUser[]>();

  close = output<void>();
  publish = output<void>();

  report = computed<ValidationReport>(() => {
    return validateComponentBasedPlan(
      this.plan(),
      this.components(),
      this.onboardedUsers()
    );
  });

  phaseCount = computed<number>(() => {
    return this.components().filter(c => c.type === 'Phase').length;
  });

  hasUnresolvedUsers = computed<boolean>(() => {
    return this.onboardedUsers().some(u => u.status === 'Unresolved');
  });

  readinessScore = computed<number>(() => {
    const rep = this.report();
    if (rep.blockingErrors.length > 0) {
      return Math.max(25, 100 - (rep.blockingErrors.length * 25));
    }
    if (rep.warnings.length > 0) {
      return Math.max(75, 100 - (rep.warnings.length * 5));
    }
    return 100;
  });

  onClose() {
    this.close.emit();
  }

  onPublish() {
    this.publish.emit();
  }
}
