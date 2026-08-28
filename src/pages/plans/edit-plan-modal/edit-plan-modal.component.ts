import { Component, input, output, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { Plan, DurationType, EnrollmentType, parseDateDDMMYYYY } from '../../../models/plan.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-edit-plan-modal',
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent],
  template: `
    <div 
      class="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-backdrop overflow-y-auto"
      (click)="onBackdropClick($event)">
      
      <div 
        id="edit-plan-modal-card"
        class="relative bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all transform animate-modal-card m-auto"
        (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">edit_note</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">Edit Plan Details</h3>
              <p class="text-xs text-text-secondary">Update schedule, metadata and attributes for this learning plan.</p>
            </div>
          </div>
          <button 
            id="close-edit-plan-modal-btn"
            type="button" 
            (click)="close.emit()" 
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-300/50 transition-colors">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Read-Only Plan System Info Header -->
        <div class="px-6 py-3.5 bg-tenant-50/40 dark:bg-tenant-950/20 border-b border-tenant-200/50 dark:border-tenant-900/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span class="text-[10px] uppercase font-bold text-text-secondary">Plan Code</span>
            <div class="font-mono font-bold text-tenant-700 dark:text-tenant-300 text-xs mt-0.5">{{ plan().planCode }}</div>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-text-secondary">LMS Scope</span>
            <div class="font-semibold text-text-primary text-xs mt-0.5 truncate">{{ plan().lmsId }}</div>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-text-secondary">Current Status</span>
            <div class="font-semibold text-xs mt-0.5" [ngClass]="getStatusColor(plan().status)">{{ plan().status }}</div>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-text-secondary">Created Date</span>
            <div class="text-text-primary text-xs mt-0.5">{{ plan().createdDate }}</div>
          </div>
        </div>

        <!-- Protection Warning Banner for Active / Completed Plans -->
        @if (isActivePlan()) {
          <div class="px-6 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 flex items-center gap-3">
            <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg shrink-0">lock</span>
            <div class="text-xs text-amber-900 dark:text-amber-300">
              <span class="font-semibold">Active Plan Protection Active:</span> Timeline and duration are locked because learners and live phases are in progress.
            </div>
          </div>
        }

        <!-- Edit Form -->
        <form [formGroup]="editForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          <!-- Plan Name -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">
              Plan Name <span class="text-rose-500">*</span>
            </label>
            <input 
              id="edit-plan-name-input"
              type="text" 
              formControlName="name"
              placeholder="e.g. 2026 Microfinance Branch Transformation & Ethics Plan" 
              class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all"
              [class.border-rose-500]="isFieldInvalid('name')" />
            @if (isFieldInvalid('name')) {
              <p class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">error</span>
                Plan Name is mandatory.
              </p>
            }
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">
              Plan Description
            </label>
            <textarea 
              id="edit-plan-desc-input"
              formControlName="description"
              rows="3"
              placeholder="Provide a comprehensive summary of learning tracks, curriculum goals, and milestones..." 
              class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all"></textarea>
          </div>

          <!-- Duration Type & Enrollment Type -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <app-custom-select
                [label]="'Duration Type'"
                [required]="true"
                [disabled]="isActivePlan()"
                [hint]="isActivePlan() ? 'Locked for active plans' : 'Canonical duration framework'"
                [options]="durationOptions"
                formControlName="durationType">
              </app-custom-select>
            </div>

            <div>
              <app-custom-select
                [label]="'Enrollment Type'"
                [required]="true"
                [options]="enrollmentOptions"
                formControlName="enrollmentType">
              </app-custom-select>
            </div>
          </div>

          <!-- Dates: Start Date & End Date (DD/MM/YYYY) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1">
                Start Date <span class="text-rose-500">*</span>
                <span class="text-[10px] text-text-secondary font-normal ml-1">(DD/MM/YYYY)</span>
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">
                  calendar_today
                </span>
                <input 
                  id="edit-plan-start-date"
                  type="text" 
                  formControlName="startDate"
                  placeholder="01/01/2026" 
                  [readonly]="isActivePlan()"
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all disabled:opacity-60"
                  [class.opacity-60]="isActivePlan()"
                  [class.border-rose-500]="isFieldInvalid('startDate')" />
              </div>
              @if (isFieldInvalid('startDate')) {
                <p class="text-[11px] text-rose-500 mt-1">Please enter valid DD/MM/YYYY date.</p>
              }
            </div>

            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1">
                End Date <span class="text-rose-500">*</span>
                <span class="text-[10px] text-text-secondary font-normal ml-1">(DD/MM/YYYY)</span>
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">
                  event_busy
                </span>
                <input 
                  id="edit-plan-end-date"
                  type="text" 
                  formControlName="endDate"
                  placeholder="31/12/2026" 
                  [readonly]="isActivePlan()"
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all disabled:opacity-60"
                  [class.opacity-60]="isActivePlan()"
                  [class.border-rose-500]="isFieldInvalid('endDate')" />
              </div>
              @if (isFieldInvalid('endDate')) {
                <p class="text-[11px] text-rose-500 mt-1">Please enter valid DD/MM/YYYY date.</p>
              }
            </div>
          </div>

          <!-- Recurring Plan Option -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">
              Recurring Cycle Configuration
            </label>
            <input 
              id="edit-plan-recurring-input"
              type="text" 
              formControlName="recurringPlan"
              placeholder="e.g. Yes (Annual Cycle) or leave empty" 
              class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all" />
          </div>

          <!-- Error Alert List if Validation Fails -->
          @if (errorsList().length > 0) {
            <div class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-400 space-y-1">
              <div class="font-bold flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
                <span class="material-symbols-outlined text-sm">error</span>
                Cannot save Plan changes:
              </div>
              <ul class="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                @for (err of errorsList(); track err) {
                  <li>{{ err }}</li>
                }
              </ul>
            </div>
          }

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-base-300 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button 
              id="cancel-edit-plan-btn"
              type="button" 
              (click)="close.emit()" 
              class="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-base-200 border border-base-300 dark:border-slate-700 transition-colors">
              Cancel
            </button>
            <button 
              id="save-edit-plan-btn"
              type="submit" 
              [disabled]="isSaving()"
              class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-tenant-600 hover:bg-tenant-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isSaving()) {
                <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Saving Changes...</span>
              } @else {
                <span class="material-symbols-outlined text-sm">check</span>
                <span>Save Changes</span>
              }
            </button>
          </div>
        </form>
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
export class EditPlanModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private lmsData = inject(LmsDataService);

  plan = input.required<Plan>();
  close = output<void>();
  updated = output<Plan>();

  isSaving = signal(false);
  errorsList = signal<string[]>([]);

  durationOptions: SelectOption[] = [
    { value: 'Yearly', label: 'Yearly (12 Months)', sublabel: 'Full annual learning track', icon: 'event' },
    { value: 'Half-Yearly', label: 'Half-Yearly (6 Months)', sublabel: 'Semester curriculum', icon: 'date_range' },
    { value: 'Quarterly', label: 'Quarterly (3 Months)', sublabel: 'Accelerated quarterly sprint', icon: 'calendar_view_month' }
  ];

  enrollmentOptions: SelectOption[] = [
    { value: 'Open', label: 'Open Enrollment', sublabel: 'Self-enrollment enabled for eligible learners', icon: 'lock_open' },
    { value: 'Closed', label: 'Closed / Assigned Only', sublabel: 'Admin or cohort assignment only', icon: 'lock' }
  ];

  editForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    durationType: ['Yearly', [Validators.required]],
    enrollmentType: ['Open', [Validators.required]],
    startDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
    endDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
    recurringPlan: ['']
  });

  isActivePlan = computed(() => this.plan().status === 'Active');

  ngOnInit() {
    const p = this.plan();
    this.editForm.patchValue({
      name: p.name,
      description: p.description || '',
      durationType: p.durationType,
      enrollmentType: p.enrollmentType,
      startDate: p.startDate,
      endDate: p.endDate,
      recurringPlan: p.recurringPlan || ''
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active': return 'text-emerald-600 dark:text-emerald-400';
      case 'Published': return 'text-blue-600 dark:text-blue-400';
      case 'Completed': return 'text-purple-600 dark:text-purple-400';
      case 'Draft': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-slate-500';
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.errorsList.set(['Please fill up all required fields with valid values.']);
      return;
    }

    this.isSaving.set(true);
    this.errorsList.set([]);

    const formVal = this.editForm.value;
    const changes: Partial<Plan> = {
      name: formVal.name.trim(),
      description: formVal.description?.trim() || '',
      durationType: formVal.durationType as DurationType,
      enrollmentType: formVal.enrollmentType as EnrollmentType,
      startDate: formVal.startDate.trim(),
      endDate: formVal.endDate.trim(),
      recurringPlan: formVal.recurringPlan?.trim() || null
    };

    const res = this.lmsData.updatePlan(this.plan().id, changes);

    if (res.success) {
      const updatedPlan = this.lmsData.getPlan(this.plan().id)!;
      this.updated.emit(updatedPlan);
      this.close.emit();
    } else {
      this.errorsList.set(res.errors || ['Failed to update plan.']);
      this.isSaving.set(false);
    }
  }
}
