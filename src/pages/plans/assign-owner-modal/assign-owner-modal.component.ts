import { Component, input, output, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { Plan, PlanOwner } from '../../../models/plan.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-assign-owner-modal',
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent],
  template: `
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      (click)="onBackdropClick($event)">
      
      <div 
        id="assign-owner-modal-card"
        class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-all transform animate-scale-up"
        (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-tenant-500/10 dark:bg-tenant-400/20 text-tenant-600 dark:text-tenant-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">person_add</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">Assign Plan Owner</h3>
              <p class="text-xs text-text-secondary">Appoint a primary administrator for this learning plan.</p>
            </div>
          </div>
          <button 
            id="close-assign-modal-btn"
            type="button" 
            (click)="close.emit()" 
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-300/50 transition-colors">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Target Plan Context (Read-Only) -->
        <div class="px-6 py-3.5 bg-tenant-50/50 dark:bg-tenant-950/20 border-b border-tenant-200/50 dark:border-tenant-900/30 flex items-center justify-between">
          <div class="min-w-0 flex-1">
            <span class="text-[11px] font-semibold tracking-wider text-tenant-700 dark:text-tenant-400 uppercase">Target Learning Plan</span>
            <div class="text-sm font-semibold text-text-primary truncate mt-0.5">{{ plan().name }}</div>
          </div>
          <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300 shrink-0 ml-3">
            {{ plan().planCode }}
          </span>
        </div>

        <!-- Body Form -->
        <form [formGroup]="ownerForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4 overflow-y-auto flex-1">
          
          <!-- Current Owner Notice if already assigned -->
          @if (plan().owner?.name && plan().owner?.email) {
            <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
              <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg shrink-0 mt-0.5">info</span>
              <div class="text-xs text-amber-900 dark:text-amber-300 min-w-0">
                <span class="font-semibold">Current Owner:</span> {{ plan().owner.name }} ({{ plan().owner.email }})
                <p class="text-[11px] text-amber-700 dark:text-amber-400/80 mt-0.5">
                  Assigning a new Plan Owner will replace the current administrator for this plan.
                </p>
              </div>
            </div>
          }

          <!-- Quick Select From Existing Members (Optional Shortcut) -->
          @if (userOptions().length > 0) {
            <div>
              <app-custom-select
                [label]="'Select from Existing Team Members'"
                [hint]="'Pick an instructor or admin to autofill'"
                [options]="userOptions()"
                [placeholder]="'-- Choose user or enter custom details below --'"
                (valueChange)="onSelectExistingUser($event)">
              </app-custom-select>
            </div>
            <div class="relative flex py-1 items-center">
              <div class="flex-grow border-t border-base-300 dark:border-slate-800"></div>
              <span class="flex-shrink mx-3 text-[11px] font-medium text-text-secondary uppercase tracking-wider">or specify details</span>
              <div class="flex-grow border-t border-base-300 dark:border-slate-800"></div>
            </div>
          }

          <!-- Owner Name (Mandatory) -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">
              Plan Owner / Planner Name <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">
                person
              </span>
              <input 
                id="plan-owner-name-input"
                type="text" 
                formControlName="name"
                placeholder="e.g. Tanvir Hossain" 
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"
                [class.border-rose-500]="isFieldInvalid('name')"
                [class.bg-rose-50/20]="isFieldInvalid('name')" />
            </div>
            @if (isFieldInvalid('name')) {
              <p class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">error</span>
                Plan Owner name is mandatory.
              </p>
            }
          </div>

          <!-- Owner Email (Mandatory) -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">
              Email Address <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">
                mail
              </span>
              <input 
                id="plan-owner-email-input"
                type="email" 
                formControlName="email"
                placeholder="e.g. tanvir.hossain@brac.net" 
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"
                [class.border-rose-500]="isFieldInvalid('email')"
                [class.bg-rose-50/20]="isFieldInvalid('email')" />
            </div>
            @if (isFieldInvalid('email')) {
              <p class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">error</span>
                Please enter a valid email address.
              </p>
            }
          </div>

          <!-- Contact Number (Optional, 11 digits format) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-semibold text-text-primary">
                Contact Number
              </label>
              <span class="text-[10px] text-text-secondary">Optional (11 digits e.g. 017xxxxxxxx)</span>
            </div>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">
                call
              </span>
              <input 
                id="plan-owner-phone-input"
                type="tel" 
                formControlName="contactNumber"
                placeholder="01713001122" 
                maxlength="11"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"
                [class.border-rose-500]="isFieldInvalid('contactNumber')"
                [class.bg-rose-50/20]="isFieldInvalid('contactNumber')" />
            </div>
            @if (isFieldInvalid('contactNumber')) {
              <p class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">error</span>
                Contact number must be 11 digits starting with 013-019.
              </p>
            }
          </div>

          <!-- Error Alert if any general validation issue -->
          @if (errorMessage()) {
            <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">warning</span>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-base-300 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button 
              id="cancel-assign-owner-btn"
              type="button" 
              (click)="close.emit()" 
              class="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-base-200 border border-base-300 dark:border-slate-700 transition-colors">
              Cancel
            </button>
            <button 
              id="submit-assign-owner-btn"
              type="submit" 
              [disabled]="isSubmitting()"
              class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-tenant-600 hover:bg-tenant-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isSubmitting()) {
                <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Assigning...</span>
              } @else {
                <span class="material-symbols-outlined text-sm">how_to_reg</span>
                <span>Assign Plan Owner</span>
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
export class AssignOwnerModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private lmsData = inject(LmsDataService);

  plan = input.required<Plan>();
  close = output<void>();
  assigned = output<PlanOwner>();

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  ownerForm: FormGroup = this.fb.group({
    userId: [null],
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/)]],
    contactNumber: ['', [Validators.pattern(/^01[3-9]\d{8}$/)]]
  });

  // Team members from active tenant/LMS for quick selection
  userOptions = computed<SelectOption[]>(() => {
    const users = this.lmsData.tenantUsers();
    return users.map(u => ({
      value: u.id,
      label: u.name,
      sublabel: `${u.role.replace('_', ' ')} • ${u.email}`,
      icon: 'account_circle'
    }));
  });

  ngOnInit() {
    const current = this.plan().owner;
    if (current) {
      this.ownerForm.patchValue({
        userId: current.userId || null,
        name: current.name || '',
        email: current.email || '',
        contactNumber: current.contactNumber || ''
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.ownerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSelectExistingUser(userId: string | null) {
    if (!userId) return;
    const user = this.lmsData.tenantUsers().find(u => u.id === userId);
    if (user) {
      this.ownerForm.patchValue({
        userId: user.id,
        name: user.name,
        email: user.email,
        contactNumber: '0171300' + Math.floor(1000 + Math.random() * 9000)
      });
      this.ownerForm.markAsDirty();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onSubmit() {
    if (this.ownerForm.invalid) {
      this.ownerForm.markAllAsTouched();
      this.errorMessage.set('All mandatory fields are not filled up correctly.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValues = this.ownerForm.value;
    const ownerData: PlanOwner = {
      userId: formValues.userId || null,
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      contactNumber: formValues.contactNumber ? formValues.contactNumber.trim() : undefined
    };

    const res = this.lmsData.assignPlanOwner(this.plan().id, ownerData);

    if (res.success) {
      this.assigned.emit(ownerData);
      this.close.emit();
    } else {
      this.errorMessage.set(res.error || 'Failed to assign Plan Owner.');
      this.isSubmitting.set(false);
    }
  }
}
