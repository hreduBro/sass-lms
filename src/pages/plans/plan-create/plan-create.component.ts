import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  Plan, 
  Phase, 
  PlanOwner, 
  DurationType, 
  EnrollmentType, 
  formatDateDDMMYYYY, 
  validatePlanAndPhases 
} from '../../../models/plan.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-plan-create',
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent],
  template: `
    <div class="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      
      <!-- Top Navigation & LMS Scope Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button 
            id="back-to-grid-from-create-btn"
            type="button" 
            (click)="goBack()"
            class="w-9 h-9 rounded-xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 hover:bg-base-200 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors shadow-sm">
            <span class="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <div class="flex items-center gap-2 text-xs text-text-secondary">
              <span class="hover:underline cursor-pointer" (click)="goBack()">Plan Management</span>
              <span>/</span>
              <span class="text-text-primary font-medium">Create Plan</span>
            </div>
            <h1 class="text-xl font-bold text-text-primary mt-0.5 flex items-center gap-2.5">
              Design Learning Plan
              <span class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                {{ generatedPlanCode() }}
              </span>
            </h1>
          </div>
        </div>

        <!-- Fixed LMS Workspace Context Indicator -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-base-200 dark:bg-base-300/50 border border-base-300 dark:border-slate-800 text-xs text-text-secondary">
          <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-400">layers</span>
          <span>Target LMS:</span>
          <span class="font-semibold text-text-primary">{{ activeLms().basicInfo.lmsName }}</span>
        </div>
      </div>

      <!-- Main Form Container -->
      <form [formGroup]="planForm" (ngSubmit)="onSubmit('Published')" class="space-y-6 text-xs">
        
        <!-- Step 1: Basic Plan Information -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-base-300 dark:border-slate-800">
            <span class="w-6 h-6 rounded-lg bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 font-bold flex items-center justify-center text-xs">
              1
            </span>
            <h2 class="text-sm font-bold text-text-primary">Plan Metadata & Schedule</h2>
          </div>

          <!-- Plan Name -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">
              Plan Name <span class="text-rose-500">*</span>
            </label>
            <input 
              id="create-plan-name-input"
              type="text" 
              formControlName="name"
              placeholder="e.g. 2026 Core Engineering & Leadership Transformation Track" 
              class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"
              [class.border-rose-500]="isFieldInvalid('name')" />
            @if (isFieldInvalid('name')) {
              <p class="text-[11px] text-rose-500 mt-1">Plan Name is mandatory (min 3 characters).</p>
            }
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">
              Description & Objectives
            </label>
            <textarea 
              id="create-plan-desc-input"
              formControlName="description"
              rows="3"
              placeholder="Outline the learning path, audience scope, and certification objectives..." 
              class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"></textarea>
          </div>

          <!-- Duration Type & Enrollment Type -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <app-custom-select
                [label]="'Duration Type'"
                [required]="true"
                [options]="durationOptions"
                formControlName="durationType">
              </app-custom-select>
            </div>

            <div>
              <app-custom-select
                [label]="'Enrollment Model'"
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
                  id="create-plan-start-date"
                  type="text" 
                  formControlName="startDate"
                  placeholder="01/01/2026" 
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"
                  [class.border-rose-500]="isFieldInvalid('startDate')" />
              </div>
              @if (isFieldInvalid('startDate')) {
                <p class="text-[11px] text-rose-500 mt-1">Please enter a valid DD/MM/YYYY date.</p>
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
                  id="create-plan-end-date"
                  type="text" 
                  formControlName="endDate"
                  placeholder="31/12/2026" 
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"
                  [class.border-rose-500]="isFieldInvalid('endDate')" />
              </div>
              @if (isFieldInvalid('endDate')) {
                <p class="text-[11px] text-rose-500 mt-1">Please enter a valid DD/MM/YYYY date.</p>
              }
            </div>
          </div>
        </div>

        <!-- Step 2: Plan Owner Section (§7) -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4" formGroupName="owner">
          <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-lg bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 font-bold flex items-center justify-center text-xs">
                2
              </span>
              <h2 class="text-sm font-bold text-text-primary">Plan Owner Assignment</h2>
            </div>
            <span class="text-[11px] text-text-secondary">Appoint exactly 1 administrator for this plan</span>
          </div>

          <!-- Quick Select from Existing Team Members -->
          @if (userOptions().length > 0) {
            <div>
              <app-custom-select
                [label]="'Select from Team Members'"
                [hint]="'Autofill credentials from LMS member roster'"
                [options]="userOptions()"
                [placeholder]="'-- Choose team member or enter custom details below --'"
                (valueChange)="onSelectExistingUser($event)">
              </app-custom-select>
            </div>
            <div class="relative flex py-1 items-center">
              <div class="flex-grow border-t border-base-300 dark:border-slate-800"></div>
              <span class="flex-shrink mx-3 text-[11px] font-medium text-text-secondary uppercase tracking-wider">or specify custom details</span>
              <div class="flex-grow border-t border-base-300 dark:border-slate-800"></div>
            </div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Owner Name -->
            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1">
                Owner Name <span class="text-rose-500">*</span>
              </label>
              <input 
                id="create-owner-name-input"
                type="text" 
                formControlName="name"
                placeholder="e.g. Tanvir Hossain" 
                class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"
                [class.border-rose-500]="isOwnerFieldInvalid('name')" />
              @if (isOwnerFieldInvalid('name')) {
                <p class="text-[11px] text-rose-500 mt-1">Owner name is mandatory.</p>
              }
            </div>

            <!-- Email -->
            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1">
                Email Address <span class="text-rose-500">*</span>
              </label>
              <input 
                id="create-owner-email-input"
                type="email" 
                formControlName="email"
                placeholder="e.g. tanvir.hossain@brac.net" 
                class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"
                [class.border-rose-500]="isOwnerFieldInvalid('email')" />
              @if (isOwnerFieldInvalid('email')) {
                <p class="text-[11px] text-rose-500 mt-1">Valid email is required.</p>
              }
            </div>

            <!-- Contact Number -->
            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1">
                Contact Number
                <span class="text-[10px] text-text-secondary font-normal ml-1">(Optional, 11 digits)</span>
              </label>
              <input 
                id="create-owner-phone-input"
                type="tel" 
                formControlName="contactNumber"
                placeholder="01713001122" 
                maxlength="11"
                class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-tenant-500/20 focus:border-tenant-500 transition-all placeholder:text-text-secondary/60"
                [class.border-rose-500]="isOwnerFieldInvalid('contactNumber')" />
              @if (isOwnerFieldInvalid('contactNumber')) {
                <p class="text-[11px] text-rose-500 mt-1">11 digits starting 013-019.</p>
              }
            </div>
          </div>
        </div>

        <!-- Step 3: Phase Structure Builder (§9) -->
        <div class="p-6 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-lg bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 font-bold flex items-center justify-center text-xs">
                3
              </span>
              <div>
                <h2 class="text-sm font-bold text-text-primary">Phase Structure & Sequential Milestones</h2>
                <p class="text-[11px] text-text-secondary">Phases must be non-overlapping and fall within Plan start and end dates.</p>
              </div>
            </div>
            <button 
              id="add-phase-btn"
              type="button" 
              (click)="addPhase()"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-base-200 hover:bg-tenant-50 hover:text-tenant-700 hover:border-tenant-300 dark:hover:bg-tenant-950/40 dark:hover:text-tenant-300 border border-base-300 dark:border-slate-700 transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">add</span>
              <span>Add Phase</span>
            </button>
          </div>

          <!-- Phases List Array -->
          <div formArrayName="phases" class="space-y-4">
            @for (phaseControl of phasesArray.controls; track $index; let i = $index) {
              <div 
                [formGroupName]="i" 
                class="p-4 rounded-xl border border-base-300 dark:border-slate-800 bg-base-200/40 dark:bg-base-300/20 space-y-3">
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                      #{{ i + 1 }}
                    </span>
                    <span class="font-bold text-text-primary">Phase {{ i + 1 }} Milestone</span>
                  </div>
                  @if (phasesArray.length > 1) {
                    <button 
                      type="button" 
                      (click)="removePhase(i)"
                      class="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-sm">delete</span>
                      <span>Remove</span>
                    </button>
                  }
                </div>

                <!-- Phase Form Fields -->
                <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  
                  <!-- Phase Name -->
                  <div class="sm:col-span-2">
                    <label class="block text-[11px] font-semibold text-text-primary mb-1">
                      Phase Name <span class="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      formControlName="name"
                      placeholder="e.g. Phase 1: Foundation & Core Principles" 
                      class="w-full px-3 py-2 rounded-lg text-xs bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-1 focus:ring-tenant-500" />
                  </div>

                  <!-- Start Date -->
                  <div>
                    <label class="block text-[11px] font-semibold text-text-primary mb-1">
                      Start Date <span class="text-rose-500">*</span> (DD/MM/YYYY)
                    </label>
                    <input 
                      type="text" 
                      formControlName="startDate"
                      placeholder="01/01/2026" 
                      class="w-full px-3 py-2 rounded-lg text-xs bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-1 focus:ring-tenant-500" />
                  </div>

                  <!-- End Date -->
                  <div>
                    <label class="block text-[11px] font-semibold text-text-primary mb-1">
                      End Date <span class="text-rose-500">*</span> (DD/MM/YYYY)
                    </label>
                    <input 
                      type="text" 
                      formControlName="endDate"
                      placeholder="31/03/2026" 
                      class="w-full px-3 py-2 rounded-lg text-xs bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary focus:outline-none focus:ring-1 focus:ring-tenant-500" />
                  </div>

                  <!-- Course Count -->
                  <div>
                    <label class="block text-[11px] font-semibold text-text-primary mb-1">Course Count</label>
                    <input 
                      type="number" 
                      formControlName="courseCount"
                      min="0"
                      class="w-full px-3 py-2 rounded-lg text-xs bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary" />
                  </div>

                  <!-- Task Count -->
                  <div>
                    <label class="block text-[11px] font-semibold text-text-primary mb-1">Task Count</label>
                    <input 
                      type="number" 
                      formControlName="taskCount"
                      min="0"
                      class="w-full px-3 py-2 rounded-lg text-xs bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary" />
                  </div>

                  <!-- Delivery Class Count -->
                  <div>
                    <label class="block text-[11px] font-semibold text-text-primary mb-1">Delivery Classes</label>
                    <input 
                      type="number" 
                      formControlName="deliveryClassCount"
                      min="0"
                      class="w-full px-3 py-2 rounded-lg text-xs bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary" />
                  </div>

                  <!-- Prerequisites -->
                  <div>
                    <label class="block text-[11px] font-semibold text-text-primary mb-1">Prerequisites</label>
                    <select 
                      formControlName="prerequisiteStatus"
                      class="w-full px-3 py-2 rounded-lg text-xs bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary">
                      <option value="None">None</option>
                      <option value="Met">Met</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

              </div>
            }
          </div>
        </div>

        <!-- Validation Error Callout -->
        @if (validationErrors().length > 0) {
          <div class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-400 space-y-1.5">
            <div class="font-bold flex items-center gap-1.5 text-rose-800 dark:text-rose-300 text-sm">
              <span class="material-symbols-outlined text-base">error</span>
              Validation Issues Detected:
            </div>
            <ul class="list-disc list-inside space-y-0.5 text-xs pl-1">
              @for (err of validationErrors(); track err) {
                <li>{{ err }}</li>
              }
            </ul>
          </div>
        }

        <!-- Footer Action Toolbar -->
        <div class="p-4 rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 flex items-center justify-between">
          <button 
            type="button" 
            (click)="goBack()"
            class="px-4 py-2.5 rounded-xl font-semibold text-text-secondary hover:text-text-primary hover:bg-base-200 border border-base-300 dark:border-slate-700 transition-colors">
            Cancel
          </button>

          <div class="flex items-center gap-3">
            <button 
              id="save-draft-plan-btn"
              type="button"
              (click)="onSubmit('Draft')"
              [disabled]="isSubmitting()"
              class="px-4 py-2.5 rounded-xl font-semibold bg-base-200 hover:bg-base-300 border border-base-300 dark:border-slate-700 text-text-primary transition-colors disabled:opacity-50">
              Save as Draft
            </button>

            <button 
              id="publish-create-plan-btn"
              type="button"
              (click)="onSubmit('Published')"
              [disabled]="isSubmitting()"
              class="px-6 py-2.5 rounded-xl font-semibold bg-tenant-600 hover:bg-tenant-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50">
              @if (isSubmitting()) {
                <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Saving...</span>
              } @else {
                <span class="material-symbols-outlined text-sm">publish</span>
                <span>Publish Plan</span>
              }
            </button>
          </div>
        </div>

      </form>

    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class PlanCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private lmsData = inject(LmsDataService);

  activeTenant = this.lmsData.activeTenant;
  activeLms = this.lmsData.activeLms;

  isSubmitting = signal(false);
  validationErrors = signal<string[]>([]);

  durationOptions: SelectOption[] = [
    { value: 'Yearly', label: 'Yearly (12 Months)', sublabel: 'Full annual learning track', icon: 'event' },
    { value: 'Half-Yearly', label: 'Half-Yearly (6 Months)', sublabel: 'Semester curriculum', icon: 'date_range' },
    { value: 'Quarterly', label: 'Quarterly (3 Months)', sublabel: 'Accelerated quarterly sprint', icon: 'calendar_view_month' }
  ];

  enrollmentOptions: SelectOption[] = [
    { value: 'Open', label: 'Open Enrollment', sublabel: 'Self-enrollment enabled for eligible learners', icon: 'lock_open' },
    { value: 'Closed', label: 'Closed / Assigned Only', sublabel: 'Admin or cohort assignment only', icon: 'lock' }
  ];

  generatedPlanCode = computed<string>(() => {
    const lmsNumeric = this.activeTenant().numericId || '1972';
    const randomSeq = String(Math.floor(100 + Math.random() * 900));
    return `PLN-${lmsNumeric}-${randomSeq}`;
  });

  userOptions = computed<SelectOption[]>(() => {
    const users = this.lmsData.tenantUsers();
    return users.map(u => ({
      value: u.id,
      label: u.name,
      sublabel: `${u.role.replace('_', ' ')} • ${u.email}`,
      icon: 'account_circle'
    }));
  });

  planForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    durationType: ['Yearly', [Validators.required]],
    enrollmentType: ['Open', [Validators.required]],
    startDate: ['01/01/2026', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
    endDate: ['31/12/2026', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
    owner: this.fb.group({
      userId: [null],
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/)]],
      contactNumber: ['', [Validators.pattern(/^01[3-9]\d{8}$/)]]
    }),
    phases: this.fb.array([])
  });

  get phasesArray(): FormArray {
    return this.planForm.get('phases') as FormArray;
  }

  ngOnInit() {
    // Initialize with 2 default phases
    this.addPhase('Phase 1: Foundations & Core Curriculum', '01/01/2026', '30/06/2026', 3, 6, 2);
    this.addPhase('Phase 2: Advanced Application & Capstone', '01/07/2026', '31/12/2026', 2, 4, 2);
  }

  addPhase(
    name = '', 
    startDate = '', 
    endDate = '', 
    courseCount = 2, 
    taskCount = 4, 
    deliveryClassCount = 1
  ) {
    const nextSeq = this.phasesArray.length + 1;
    const phaseGroup = this.fb.group({
      id: [`phase-gen-${Date.now()}-${nextSeq}`],
      name: [name || `Phase ${nextSeq}: Milestone`, [Validators.required]],
      sequence: [nextSeq],
      startDate: [startDate || '01/01/2026', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
      endDate: [endDate || '31/03/2026', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
      status: ['Ready'],
      courseCount: [courseCount],
      taskCount: [taskCount],
      deliveryClassCount: [deliveryClassCount],
      prerequisiteStatus: [nextSeq === 1 ? 'None' : 'Pending'],
      certificateBadgeStatus: ['Configured']
    });
    this.phasesArray.push(phaseGroup);
  }

  removePhase(index: number) {
    if (this.phasesArray.length > 1) {
      this.phasesArray.removeAt(index);
      // Re-sequence remaining
      this.phasesArray.controls.forEach((ctrl, idx) => {
        ctrl.patchValue({ sequence: idx + 1 });
      });
    }
  }

  isFieldInvalid(name: string): boolean {
    const f = this.planForm.get(name);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  isOwnerFieldInvalid(name: string): boolean {
    const f = this.planForm.get(`owner.${name}`);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  onSelectExistingUser(userId: string | null) {
    if (!userId) return;
    const user = this.lmsData.tenantUsers().find(u => u.id === userId);
    if (user) {
      this.planForm.get('owner')?.patchValue({
        userId: user.id,
        name: user.name,
        email: user.email,
        contactNumber: '0171300' + Math.floor(1000 + Math.random() * 9000)
      });
      this.planForm.get('owner')?.markAsDirty();
    }
  }

  goBack() {
    this.router.navigate(['/plans']);
  }

  onSubmit(targetStatus: 'Draft' | 'Published') {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      this.validationErrors.set(['Please correct the highlighted form fields before proceeding.']);
      return;
    }

    this.isSubmitting.set(true);
    this.validationErrors.set([]);

    const val = this.planForm.value;
    const todayStr = formatDateDDMMYYYY(new Date());

    const phases: Phase[] = val.phases.map((p: any, idx: number) => ({
      id: p.id || `phase-new-${idx + 1}`,
      planId: `plan-${Date.now()}`,
      name: p.name.trim(),
      sequence: idx + 1,
      startDate: p.startDate.trim(),
      endDate: p.endDate.trim(),
      status: targetStatus === 'Draft' ? 'Draft' : 'Ready',
      courseCount: Number(p.courseCount) || 0,
      taskCount: Number(p.taskCount) || 0,
      deliveryClassCount: Number(p.deliveryClassCount) || 0,
      prerequisiteStatus: p.prerequisiteStatus || 'None',
      certificateBadgeStatus: p.certificateBadgeStatus || 'Configured'
    }));

    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      planCode: this.generatedPlanCode(),
      lmsId: this.activeLms().id,
      organizationId: this.activeTenant().id,
      name: val.name.trim(),
      description: val.description?.trim() || '',
      owner: {
        userId: val.owner.userId || null,
        name: val.owner.name.trim(),
        email: val.owner.email.trim(),
        contactNumber: val.owner.contactNumber ? val.owner.contactNumber.trim() : undefined,
        assignedAt: todayStr,
        assignedBy: this.lmsData.activeUser().name || 'LMS Admin',
        invitationStatus: 'accepted'
      },
      durationType: val.durationType as DurationType,
      startDate: val.startDate.trim(),
      endDate: val.endDate.trim(),
      enrollmentType: val.enrollmentType as EnrollmentType,
      status: targetStatus,
      phaseCount: phases.length,
      createdDate: todayStr,
      createdBy: this.lmsData.activeUser().name || 'LMS Admin',
      updatedDate: todayStr,
      phases,
      capabilities: {
        canEdit: true,
        canAssignOwner: true,
        canActivate: targetStatus === 'Published',
        canArchive: true,
        protectedFields: []
      }
    };

    // Validate Plan and Phases date bounds & non-overlapping sequence
    const validation = validatePlanAndPhases(newPlan, phases);
    if (!validation.isValid) {
      this.validationErrors.set(validation.errors);
      this.isSubmitting.set(false);
      return;
    }

    // Add to service
    this.lmsData.plans.update(list => [newPlan, ...list]);
    this.lmsData.logAction(
      'Plan Created',
      `Created new learning plan "${newPlan.name}" (${newPlan.planCode}) in status ${targetStatus}`,
      'success'
    );
    this.lmsData.showToast(
      `Plan "${newPlan.name}" has been ${targetStatus === 'Published' ? 'published' : 'saved as draft'} successfully.`,
      'success',
      4500,
      targetStatus === 'Published' ? 'Plan Published' : 'Draft Saved'
    );

    this.router.navigate(['/plans/details', newPlan.id]);
  }
}
