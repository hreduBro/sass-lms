import { Component, input, output, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  Plan, 
  PlanComponent, 
  PlanComponentType, 
  PlanComponentClassSession,
  getDurationDays,
  parseDateDDMMYYYY
} from '../../../../models/plan.model';
import { LmsDataService } from '../../../../services/lms-data.service';
import { CustomSelectComponent, SelectOption } from '../../../../components/custom-select/custom-select.component';
import { DatePickerComponent } from '../../../../components/date-picker/date-picker.component';

@Component({
  selector: 'app-component-drawer',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomSelectComponent,
    DatePickerComponent
  ],
  styles: [`
    :host {
      display: contents;
    }
    .drawer-backdrop {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999998 !important;
      margin: 0 !important;
    }
    .drawer-aside {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      height: 100vh !important;
      max-height: 100vh !important;
      z-index: 999999 !important;
      margin: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }
    .drawer-header {
      padding: 1.25rem 1.5rem !important;
      flex-shrink: 0 !important;
      z-index: 30 !important;
    }
    .drawer-form {
      display: flex !important;
      flex-direction: column !important;
      flex: 1 1 0% !important;
      min-height: 0 !important;
      height: 100% !important;
      max-height: 100% !important;
      overflow: hidden !important;
    }
    .drawer-body {
      flex: 1 1 0% !important;
      min-height: 0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }
    .drawer-body::-webkit-scrollbar {
      width: 6px;
    }
    .drawer-body::-webkit-scrollbar-track {
      background: transparent;
    }
    .drawer-body::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.4);
      border-radius: 9999px;
    }
    .drawer-body::-webkit-scrollbar-thumb:hover {
      background: rgba(156, 163, 175, 0.7);
    }
    .drawer-footer {
      padding: 1rem 1.5rem !important;
      flex-shrink: 0 !important;
      margin-top: auto !important;
      z-index: 30 !important;
    }
  `],
  template: `
    <!-- Slide-over Drawer Container -->
    @if (isOpen()) {
      <!-- Full Backdrop Overlay -->
      <div 
        class="drawer-backdrop fixed inset-0 bg-black/60 backdrop-blur-xs z-[999998] transition-opacity cursor-pointer" 
        (click)="onClose()"
        aria-hidden="true">
      </div>

      <!-- Slide-over Drawer Panel: Attached strictly to top-0 right-0 bottom-0 -->
      <aside 
        class="drawer-aside fixed top-0 right-0 bottom-0 z-[999999] w-full max-w-2xl bg-base-100 dark:bg-slate-900 text-text-primary shadow-2xl border-l border-base-300 dark:border-slate-800 flex flex-col h-screen max-h-screen animate-in slide-in-from-right duration-200 overflow-hidden"
        (click)="$event.stopPropagation()"
        role="dialog" 
        aria-modal="true"
        [attr.aria-label]="isEditing() ? 'Configure Component Parameters' : 'Add New Curriculum Component'">
          
          <!-- Fixed Drawer Header -->
          <div 
            class="drawer-header px-6 py-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between gap-4 bg-base-100 dark:bg-slate-900 shrink-0 z-20">
            <div class="flex items-center gap-3.5 min-w-0">
              <div 
                class="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                [class]="getTypeBadgeColor(selectedType())">
                <span class="material-symbols-outlined text-2xl">{{ getTypeIcon(selectedType()) }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-2xs"
                    [class]="getTypePillClass(selectedType())">
                    {{ selectedType() }}
                  </span>
                  @if (targetPhaseId()) {
                    <span class="text-xs font-semibold text-text-secondary truncate">
                      in Phase: <strong class="text-text-primary font-bold">{{ getPhaseName(targetPhaseId()) }}</strong>
                    </span>
                  } @else {
                    <span class="text-xs font-semibold text-text-secondary">
                      Plan Level
                    </span>
                  }
                </div>
                <h2 class="text-base sm:text-lg font-bold text-text-primary leading-tight truncate">
                  {{ isEditing() ? 'Configure Component Parameters' : 'Add New Curriculum Component' }}
                </h2>
              </div>
            </div>

            <button 
              type="button" 
              (click)="onClose()"
              class="w-9 h-9 rounded-xl bg-base-200 hover:bg-base-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close Drawer"
              title="Close Drawer">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <!-- Drawer Form Wrapper (flex-1 flex flex-col min-h-0 overflow-hidden) -->
          <form 
            [formGroup]="form" 
            (ngSubmit)="onSubmit()" 
            class="drawer-form flex-1 flex flex-col min-h-0 overflow-hidden">
            
            <!-- Scrollable Content Body (ONLY this scrolls) -->
            <div class="drawer-body flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-base-100 dark:bg-slate-900">
          
          <!-- Component Type Selector Pills (Disabled when editing) -->
          @if (!isEditing()) {
            <div class="space-y-2">
              <label class="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Select Component Type (§2.1)
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                @for (type of componentTypes; track type) {
                  <button 
                    type="button"
                    (click)="changeType(type)"
                    class="p-2.5 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer"
                    [class]="selectedType() === type 
                      ? 'border-tenant-500 bg-tenant-50 dark:bg-tenant-900/30 text-tenant-700 dark:text-tenant-300 ring-2 ring-tenant-500/20' 
                      : 'border-base-300 hover:border-base-400 bg-base-100 text-text-primary'">
                    <span class="material-symbols-outlined text-base" [class]="getTypeBadgeColor(type) + ' text-white p-1 rounded-lg'">
                      {{ getTypeIcon(type) }}
                    </span>
                    <span class="text-xs font-bold mt-1">{{ type }}</span>
                  </button>
                }
              </div>
            </div>
          }

          <!-- General Properties -->
          <div class="space-y-4">
            <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm text-tenant-500">tune</span>
              <span>General Configuration</span>
            </h3>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-text-primary mb-1">
                  Component Title <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  formControlName="name"
                  placeholder="e.g. Field Training Fundamentals"
                  class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-base-100 border border-base-300 focus:outline-none focus:ring-2 focus:ring-tenant-500" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-text-primary mb-1">
                  Description / Instructions
                </label>
                <textarea 
                  rows="2"
                  formControlName="description"
                  placeholder="Brief curriculum guidance for the learner..."
                  class="w-full px-3.5 py-2 rounded-xl text-xs bg-base-100 border border-base-300 focus:outline-none focus:ring-2 focus:ring-tenant-500"></textarea>
              </div>

              <!-- Phase Assignment (if not Phase itself) -->
              @if (selectedType() !== 'Phase') {
                <div>
                  <app-custom-select
                    label="Assign into Phase Container (Optional)"
                    hint="Group inside a phase or leave as standalone at plan level"
                    [options]="phaseSelectOptions()"
                    formControlName="phaseId"
                    placeholder="Select phase or keep at plan level...">
                  </app-custom-select>
                </div>
              }
            </div>

            <!-- 2. Time Window & Progression Condition -->
            <div class="space-y-4 p-4 rounded-2xl bg-base-200/50 border border-base-300">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-tenant-500">calendar_month</span>
                  <span>Timeline & Dates</span>
                </h3>
                <span 
                  class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border transition-colors"
                  [class.text-tenant-600]="!dateOrderError()"
                  [class.bg-base-100]="!dateOrderError()"
                  [class.border-base-300]="!dateOrderError()"
                  [class.text-rose-600]="dateOrderError()"
                  [class.bg-rose-50]="dateOrderError()"
                  [class.border-rose-300]="dateOrderError()">
                  @if (dateOrderError()) {
                    Invalid Date Range
                  } @else {
                    {{ computedDuration() }} Days Window
                  }
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <app-date-picker
                  label="Start Date"
                  [required]="true"
                  hint="DD/MM/YYYY"
                  placeholder="01/01/2026"
                  formControlName="startDate"
                  (valueChange)="updateDates()">
                </app-date-picker>

                <app-date-picker
                  label="End Date"
                  [required]="true"
                  hint="DD/MM/YYYY"
                  placeholder="31/03/2026"
                  [minDate]="form.get('startDate')?.value || ''"
                  [isInvalidOrder]="!!dateOrderError()"
                  [orderErrorMessage]="dateOrderError() || ''"
                  formControlName="endDate"
                  (valueChange)="updateDates()">
                </app-date-picker>
              </div>

              @if (dateOrderError()) {
                <div class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm shrink-0 text-rose-600">error</span>
                  <span class="font-medium">{{ dateOrderError() }}</span>
                </div>
              }

              @if (phaseBoundsError()) {
                <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm shrink-0">warning</span>
                  <span>{{ phaseBoundsError() }}</span>
                </div>
              }

              <!-- Progression Condition Settings (Unlock / Completion rule) -->
              @if (selectedType() !== 'Phase') {
                <div class="pt-2 border-t border-base-300 space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-xs font-semibold text-text-primary">Mandatory Component</label>
                      <p class="text-[10px] text-text-secondary">Required for Phase qualification and Plan completion</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" formControlName="isMandatory" class="sr-only peer">
                      <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tenant-500"></div>
                    </label>
                  </div>

                  <div>
                    <app-custom-select
                      label="Completion Condition Rule"
                      [required]="true"
                      [options]="availableProgressionRules()"
                      formControlName="progressionRule"
                      placeholder="Select progression condition...">
                    </app-custom-select>
                  </div>

                  @if (requiresScoreThreshold()) {
                    <div>
                      <label class="block text-xs font-semibold text-text-primary mb-1">
                        Minimum Passing Threshold
                      </label>
                      <div class="flex items-center gap-2">
                        <input 
                          type="number" 
                          formControlName="progressionThreshold" 
                          min="0" 
                          max="100"
                          class="w-24 px-3.5 py-2 rounded-xl text-xs bg-base-100 border border-base-300 focus:outline-none focus:ring-2 focus:ring-tenant-500 font-mono" />
                        <span class="text-xs font-semibold text-text-secondary">% required to advance</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- 3. Prerequisites Config (§2.3) -->
            @if (selectedType() !== 'Phase') {
              <div class="space-y-3 p-4 rounded-2xl bg-base-200/50 border border-base-300">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-tenant-500">link</span>
                    <span>Component Prerequisites</span>
                  </h3>
                  <span class="text-[10px] text-text-secondary">
                    {{ selectedPrerequisites().length }} Selected
                  </span>
                </div>

                @if (availablePrerequisiteOptions().length === 0) {
                  <p class="text-xs text-text-secondary italic">
                    No other valid components available as prerequisites.
                  </p>
                } @else {
                  <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    @for (comp of availablePrerequisiteOptions(); track comp.id) {
                      <label class="flex items-center justify-between p-2 rounded-xl bg-base-100 border border-base-300 hover:border-tenant-500/50 cursor-pointer text-xs transition-colors">
                        <div class="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            [checked]="isPrerequisiteSelected(comp.id)"
                            (change)="togglePrerequisite(comp.id)"
                            class="rounded text-tenant-500 focus:ring-tenant-500" />
                          <span class="font-medium text-text-primary">{{ comp.name }}</span>
                        </div>
                        <span class="text-[10px] font-mono text-text-secondary">{{ comp.type }}</span>
                      </label>
                    }
                  </div>
                }
              </div>
            }

            <!-- 4. Type-Specific Config Sections (§2.2) -->
            <!-- A: Task Specific -->
            @if (selectedType() === 'Task') {
              <div class="space-y-4 p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50">
                <h3 class="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">task_alt</span>
                  <span>Task Operational Parameters</span>
                </h3>

                <div>
                  <app-custom-select
                    label="Assigned Evaluator Role"
                    [required]="true"
                    [options]="taskRoleOptions"
                    formControlName="taskRole"
                    placeholder="Select role...">
                  </app-custom-select>
                </div>

                <div class="space-y-2">
                  <label class="block text-xs font-semibold text-text-primary">Task Checklist Steps</label>
                  <div class="space-y-1.5">
                    <input type="text" formControlName="taskChecklist1" placeholder="Step 1: Rural Household survey completion" class="w-full px-3 py-2 rounded-xl text-xs bg-base-100 border border-base-300">
                    <input type="text" formControlName="taskChecklist2" placeholder="Step 2: Microfinance ledger reconciliation" class="w-full px-3 py-2 rounded-xl text-xs bg-base-100 border border-base-300">
                  </div>
                </div>
              </div>
            }

            <!-- B: Content Specific -->
            @if (selectedType() === 'Content') {
              <div class="space-y-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50">
                <h3 class="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">play_lesson</span>
                  <span>Learning Content Asset</span>
                </h3>

                <div>
                  <app-custom-select
                    label="Pick from Content Repository"
                    [searchable]="true"
                    [clearable]="true"
                    [options]="contentAssetOptions()"
                    (valueChange)="onContentAssetSelected($event)"
                    placeholder="Search or choose asset...">
                  </app-custom-select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <app-custom-select
                      label="Content Format"
                      [required]="true"
                      [options]="contentTypeOptions"
                      formControlName="contentType"
                      placeholder="Select format...">
                    </app-custom-select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-text-primary mb-1">Estimated Duration</label>
                    <input type="text" formControlName="contentLength" placeholder="e.g. 45 mins" class="w-full px-3 py-2 rounded-xl text-xs bg-base-100 border border-base-300">
                  </div>
                </div>
              </div>
            }

            <!-- C: Course Specific (Includes Delivery Classes View §2.2) -->
            @if (selectedType() === 'Course') {
              <div class="space-y-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">school</span>
                    <span>Course Curriculum Linking</span>
                  </h3>
                  <span class="text-[10px] text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded font-bold">
                    Read-only Classes
                  </span>
                </div>

                <div>
                  <app-custom-select
                    label="Select Catalog Course"
                    [searchable]="true"
                    [clearable]="true"
                    [options]="courseSelectOptions()"
                    (valueChange)="onCourseSelected($event)"
                    placeholder="Search or select course from LMS...">
                  </app-custom-select>
                </div>

                <!-- Included Classes (Read-only list with dates, venue, instructor) -->
                @if (selectedCourseClasses().length > 0) {
                  <div class="space-y-2 pt-2 border-t border-emerald-200 dark:border-emerald-900/50">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Included Classroom Sessions ({{ selectedCourseClasses().length }})
                      </span>
                      <span class="text-[10px] text-text-secondary">Synced from course schedule</span>
                    </div>

                    <div class="space-y-1.5">
                      @for (cls of selectedCourseClasses(); track cls.id) {
                        <div class="p-2.5 rounded-xl bg-base-100 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1">
                          <div class="flex items-center justify-between font-semibold text-text-primary">
                            <span>{{ cls.name }}</span>
                            <span class="font-mono text-[11px] text-emerald-600">{{ cls.date }}</span>
                          </div>
                          <div class="flex flex-wrap items-center gap-x-3 text-[11px] text-text-secondary">
                            <span><strong class="text-text-primary">Time:</strong> {{ cls.time }}</span>
                            <span><strong class="text-text-primary">Venue:</strong> {{ cls.venue }}</span>
                            <span><strong class="text-text-primary">Lead:</strong> {{ cls.instructor }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <!-- D: Pre-Test & Post-Test Specific -->
            @if (selectedType() === 'Pre-Test' || selectedType() === 'Post-Test') {
              <div class="space-y-4 p-4 rounded-2xl border"
                [class]="selectedType() === 'Pre-Test' 
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' 
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'">
                
                <h3 class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  [class]="selectedType() === 'Pre-Test' ? 'text-amber-800 dark:text-amber-300' : 'text-rose-800 dark:text-rose-300'">
                  <span class="material-symbols-outlined text-sm">quiz</span>
                  <span>{{ selectedType() }} Questionnaire Mapping</span>
                </h3>

                <div>
                  <app-custom-select
                    label="Pick Questionnaire Bank"
                    [searchable]="true"
                    [clearable]="true"
                    [options]="questionnaireSelectOptions()"
                    (valueChange)="onQuestionnaireSelected($event)"
                    placeholder="Search assessment bank...">
                  </app-custom-select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <app-custom-select
                      label="Evaluation Mode"
                      [required]="true"
                      [options]="evaluationTypeOptions"
                      formControlName="evaluationType"
                      placeholder="Select evaluation type...">
                    </app-custom-select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-text-primary mb-1">Passing Mark %</label>
                    <input type="number" formControlName="passMark" placeholder="70" class="w-full px-3 py-2 rounded-xl text-xs bg-base-100 border border-base-300 font-mono">
                  </div>
                </div>
              </div>
            }

            <!-- E: Survey Specific -->
            @if (selectedType() === 'Survey') {
              <div class="space-y-4 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50">
                <h3 class="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">reviews</span>
                  <span>Survey & Feedback Configuration</span>
                </h3>

                <div>
                  <app-custom-select
                    label="Select Feedback Survey Form"
                    [searchable]="true"
                    [clearable]="true"
                    [options]="surveyFormOptions()"
                    (valueChange)="onSurveyFormSelected($event)"
                    placeholder="Search feedback surveys...">
                  </app-custom-select>
                </div>

                <div>
                  <app-custom-select
                    label="Response Mode"
                    [required]="true"
                    [options]="surveyModeOptions"
                    formControlName="surveyMode"
                    placeholder="Select anonymity mode...">
                  </app-custom-select>
                </div>
              </div>
            }

            @if (selectedType() === 'Phase') {
              <div class="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs">
                  <span class="material-symbols-outlined text-base text-slate-600 dark:text-slate-400">timeline</span>
                  <span>Curriculum Phase Milestones & Track Boundaries</span>
                </div>
                <p class="text-xs text-text-secondary leading-relaxed">
                  A Phase is a primary structural milestone container in this curriculum track. All nested courses, field tasks, and diagnostic tests contained inside this phase must conform to its scheduled start and completion window.
                </p>
                <div class="p-3 rounded-xl bg-base-100 border border-base-300 flex items-center justify-between text-xs">
                  <span class="text-text-secondary">Enforced Completion:</span>
                  <span class="font-bold text-tenant-600">Mandatory Milestone Stage</span>
                </div>
              </div>
            }

          </div>
          </div>

          <!-- Drawer Footer with Save & Cancel: Fixed at the bottom, outside scroll area -->
          <div 
            class="drawer-footer px-6 py-4 bg-base-100 dark:bg-slate-900 border-t border-base-300 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 shadow-lg z-20">
            <button 
              type="button" 
              (click)="onClose()"
              class="px-4 py-2.5 rounded-xl border border-base-300 dark:border-slate-700 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-base-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              Cancel
            </button>
            <button 
              type="submit" 
              [disabled]="form.invalid || !!dateOrderError() || !!phaseBoundsError()"
              class="px-5 py-2.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-sm">check</span>
              <span>{{ isEditing() ? 'Save Changes' : 'Add to Plan' }}</span>
            </button>
          </div>

        </form>

      </aside>
    }
  `
})
export class ComponentDrawerComponent {
  private fb = inject(FormBuilder);
  private lmsData = inject(LmsDataService);

  isOpen = input<boolean>(false);
  isEditing = input<boolean>(false);
  componentToEdit = input<PlanComponent | null>(null);
  initialType = input<PlanComponentType>('Task');
  targetPhaseId = input<string | null>(null);
  plan = input<Plan | null>(null);
  allComponents = input<PlanComponent[]>([]);

  close = output<void>();
  save = output<PlanComponent>();

  componentTypes: PlanComponentType[] = [
    'Task',
    'Content',
    'Course',
    'Pre-Test',
    'Post-Test',
    'Survey',
    'Phase'
  ];

  selectedType = signal<PlanComponentType>('Task');
  selectedPrerequisites = signal<string[]>([]);
  selectedCourseClasses = signal<PlanComponentClassSession[]>([]);
  formDates = signal<{ start: string; end: string }>({ start: '01/01/2026', end: '31/03/2026' });

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    startDate: ['01/01/2026', [Validators.required]],
    endDate: ['31/03/2026', [Validators.required]],
    phaseId: [null],
    isMandatory: [true],
    progressionRule: ['mark_done', [Validators.required]],
    progressionThreshold: [75],
    // Task
    taskRole: ['Instructor'],
    taskChecklist1: [''],
    taskChecklist2: [''],
    // Content
    contentType: ['PDF / Document'],
    contentLength: ['45 mins'],
    // Test
    evaluationType: ['Online'],
    passMark: [70],
    // Survey
    surveyMode: ['Anonymous']
  });

  dateOrderError = computed<string | null>(() => {
    const dates = this.formDates();
    const ds = parseDateDDMMYYYY(dates.start);
    const de = parseDateDDMMYYYY(dates.end);
    if (ds && de && de.getTime() < ds.getTime()) {
      return 'End date cannot be earlier than start date.';
    }
    return null;
  });

  computedDuration = computed<number>(() => {
    const dates = this.formDates();
    const ds = parseDateDDMMYYYY(dates.start);
    const de = parseDateDDMMYYYY(dates.end);
    if (ds && de && de.getTime() < ds.getTime()) {
      return 0;
    }
    return getDurationDays(dates.start, dates.end);
  });

  updateDates() {
    this.formDates.set({
      start: this.form.get('startDate')?.value || '01/01/2026',
      end: this.form.get('endDate')?.value || '31/03/2026'
    });
  }

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const comp = this.componentToEdit();
        if (comp) {
          this.selectedType.set(comp.type);
          this.selectedPrerequisites.set(comp.prerequisiteIds || []);
          this.selectedCourseClasses.set(comp.includedClasses || []);
          this.formDates.set({ start: comp.startDate, end: comp.endDate });

          this.form.patchValue({
            name: comp.name,
            description: comp.description || '',
            startDate: comp.startDate,
            endDate: comp.endDate,
            phaseId: comp.phaseId || null,
            isMandatory: comp.isMandatory,
            progressionRule: comp.progressionCondition?.rule || 'mark_done',
            progressionThreshold: comp.progressionCondition?.threshold || 75
          });
        } else {
          this.selectedType.set(this.initialType());
          this.selectedPrerequisites.set([]);
          this.selectedCourseClasses.set([]);

          const pStart = this.plan()?.startDate || '01/01/2026';
          const pEnd = this.plan()?.endDate || '31/12/2026';
          this.formDates.set({ start: pStart, end: pEnd });

          const isPhase = this.initialType() === 'Phase';
          const nextPhaseNum = this.availablePhases().length + 1;
          const defaultName = isPhase 
            ? `Phase 0${nextPhaseNum}: Field Specialization` 
            : '';
          const defaultDesc = isPhase 
            ? `Structured curriculum stage 0${nextPhaseNum} for targeted qualification.` 
            : '';

          this.form.patchValue({
            name: defaultName,
            description: defaultDesc,
            startDate: pStart,
            endDate: pEnd,
            phaseId: this.targetPhaseId() || null,
            isMandatory: true,
            progressionRule: 'mark_done',
            progressionThreshold: 75
          });
        }
      }
    }, { allowSignalWrites: true });
  }

  setType(type: PlanComponentType) {
    this.changeType(type);
  }

  changeType(type: PlanComponentType) {
    this.selectedType.set(type);
    if (type === 'Course') {
      this.form.patchValue({ progressionRule: 'course_passed' });
    } else if (type === 'Pre-Test' || type === 'Post-Test') {
      this.form.patchValue({ progressionRule: 'score_threshold' });
    } else if (type === 'Survey') {
      this.form.patchValue({ progressionRule: 'submit_response' });
    } else if (type === 'Content') {
      this.form.patchValue({ progressionRule: 'content_viewed' });
    } else {
      this.form.patchValue({ progressionRule: 'mark_done' });
    }
  }

  // Available progression rules based on component type
  availableProgressionRules = computed<SelectOption[]>(() => {
    const t = this.selectedType();
    switch (t) {
      case 'Task':
        return [
          { value: 'mark_done', label: 'Mark Done (Facilitator or Trainee Check)' },
          { value: 'submission_approved', label: 'Facilitator Submission Approval' }
        ];
      case 'Content':
        return [
          { value: 'content_viewed', label: '100% Asset Viewed / Read' },
          { value: 'mark_done', label: 'Manual Completion Confirmation' }
        ];
      case 'Course':
        return [
          { value: 'course_passed', label: 'Course Final Passing Grade' },
          { value: 'attendance_verified', label: 'Live Session Attendance Verified' }
        ];
      case 'Pre-Test':
      case 'Post-Test':
        return [
          { value: 'score_threshold', label: 'Attain Minimum Score Threshold' },
          { value: 'submit_response', label: 'Complete Attempt (Diagnostic)' }
        ];
      case 'Survey':
        return [
          { value: 'submit_response', label: 'Survey Form Submitted' }
        ];
      case 'Phase':
        return [
          { value: 'mark_done', label: 'Phase Milestones Complete' }
        ];
    }
  });

  requiresScoreThreshold(): boolean {
    return this.form.get('progressionRule')?.value === 'score_threshold';
  }

  // Phases available
  availablePhases = computed<PlanComponent[]>(() => {
    return this.allComponents().filter(c => c.type === 'Phase');
  });

  phaseSelectOptions = computed<SelectOption[]>(() => {
    const list: SelectOption[] = [
      { value: null, label: 'None (Standalone Component at Plan Level)' }
    ];
    for (const ph of this.availablePhases()) {
      list.push({
        value: ph.id,
        label: `Phase: ${ph.name}`,
        sublabel: `${ph.startDate} – ${ph.endDate}`
      });
    }
    return list;
  });

  taskRoleOptions: SelectOption[] = [
    { value: 'Instructor', label: 'Instructor / Mentor', sublabel: 'Directly verified by assigned instructor' },
    { value: 'Planner', label: 'Plan Owner / Admin', sublabel: 'Sign-off by curriculum manager' },
    { value: 'Trainee', label: 'Trainee Self-Attestation', sublabel: 'Honor system trainee check' }
  ];

  contentTypeOptions: SelectOption[] = [
    { value: 'PDF / Document', label: 'PDF / Document' },
    { value: 'Video', label: 'Video Stream' },
    { value: 'Audio', label: 'Audio Masterclass' },
    { value: 'Interactive Lab', label: 'SCORM / Interactive Lab' }
  ];

  evaluationTypeOptions: SelectOption[] = [
    { value: 'Online', label: 'Online Adaptive MCQ' },
    { value: 'Offline Practical', label: 'Offline Practical Examination' }
  ];

  surveyModeOptions: SelectOption[] = [
    { value: 'Anonymous', label: 'Anonymous Trainee Submissions' },
    { value: 'Attributed', label: 'Attributed by Staff PIN / ID' }
  ];

  getPhaseName(phaseId: string | null): string {
    if (!phaseId) return '';
    return this.allComponents().find(c => c.id === phaseId)?.name || 'Phase';
  }

  // Prerequisites logic
  availablePrerequisiteOptions = computed<PlanComponent[]>(() => {
    const editingId = this.componentToEdit()?.id;
    return this.allComponents().filter(c => c.type !== 'Phase' && c.id !== editingId);
  });

  isPrerequisiteSelected(id: string): boolean {
    return this.selectedPrerequisites().includes(id);
  }

  togglePrerequisite(id: string) {
    const current = this.selectedPrerequisites();
    if (current.includes(id)) {
      this.selectedPrerequisites.set(current.filter(x => x !== id));
    } else {
      this.selectedPrerequisites.set([...current, id]);
    }
  }

  // Course Options from LMS
  courseOptions = computed<any[]>(() => {
    return this.lmsData.courses().map((c: any) => ({
      id: c.courseId || c.id,
      name: c.title || c.name || 'Untitled Course',
      code: c.code || c.courseId || c.id || 'CRS-100'
    }));
  });

  courseSelectOptions = computed<SelectOption[]>(() => {
    return this.courseOptions().map(c => ({
      value: c.id,
      label: c.name,
      sublabel: `Course Code: ${c.code}`
    }));
  });

  // Content Repo Assets
  contentAssets = computed<any[]>(() => {
    return [
      { id: 'ast-01', title: 'Rural Microfinance Operations Handbook 2026', type: 'PDF / Document', duration: '45 mins' },
      { id: 'ast-02', title: 'Digital Credit Assessment Video Lecture', type: 'Video', duration: '32 mins' },
      { id: 'ast-03', title: 'Community Engagement Audio Masterclass', type: 'Audio', duration: '25 mins' },
      { id: 'ast-04', title: 'Regulatory Compliance Standard Operating Procedure', type: 'PDF / Document', duration: '60 mins' }
    ];
  });

  contentAssetOptions = computed<SelectOption[]>(() => {
    return this.contentAssets().map(a => ({
      value: a.id,
      label: a.title,
      sublabel: `${a.type} · ${a.duration}`
    }));
  });

  // Questionnaires from Assessments
  questionnaireOptions = computed<any[]>(() => {
    return this.lmsData.assessments().map((a: any) => ({
      id: a.assessmentId || a.id,
      title: a.title,
      version: a.versions?.[0]?.versionLabel || 'v1.0'
    }));
  });

  questionnaireSelectOptions = computed<SelectOption[]>(() => {
    return this.questionnaireOptions().map(q => ({
      value: q.id,
      label: q.title,
      sublabel: `Assessment Bank · ${q.version}`
    }));
  });

  // Survey Forms
  surveyOptions = computed<any[]>(() => {
    return this.lmsData.feedbackForms().map((f: any) => ({
      id: f.feedbackFormId || f.id,
      title: f.title
    }));
  });

  surveyFormOptions = computed<SelectOption[]>(() => {
    return this.surveyOptions().map(s => ({
      value: s.id,
      label: s.title
    }));
  });

  // Phase Date Window Error Check
  phaseBoundsError = computed<string | null>(() => {
    const phId = this.form.get('phaseId')?.value;
    if (!phId) return null;
    const parent = this.allComponents().find(c => c.id === phId);
    if (!parent) return null;

    const cStart = parseDateDDMMYYYY(this.form.get('startDate')?.value);
    const cEnd = parseDateDDMMYYYY(this.form.get('endDate')?.value);
    const pStart = parseDateDDMMYYYY(parent.startDate);
    const pEnd = parseDateDDMMYYYY(parent.endDate);

    if (cStart && pStart && cStart.getTime() < pStart.getTime()) {
      return `Component start date precedes parent Phase window (${parent.startDate} – ${parent.endDate}).`;
    }
    if (cEnd && pEnd && cEnd.getTime() > pEnd.getTime()) {
      return `Component end date exceeds parent Phase window (${parent.startDate} – ${parent.endDate}).`;
    }
    return null;
  });

  getTypeBadgeColor(type: PlanComponentType): string {
    switch (type) {
      case 'Task': return 'bg-sky-500';
      case 'Content': return 'bg-indigo-500';
      case 'Course': return 'bg-emerald-600';
      case 'Pre-Test': return 'bg-amber-500';
      case 'Post-Test': return 'bg-rose-500';
      case 'Survey': return 'bg-purple-600';
      case 'Phase': return 'bg-slate-700';
    }
  }

  getTypePillClass(type: PlanComponentType): string {
    switch (type) {
      case 'Task': return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
      case 'Content': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
      case 'Course': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Pre-Test': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'Post-Test': return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      case 'Survey': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
      case 'Phase': return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  }

  getTypeIcon(type: PlanComponentType): string {
    switch (type) {
      case 'Task': return 'task_alt';
      case 'Content': return 'play_lesson';
      case 'Course': return 'school';
      case 'Pre-Test': return 'quiz';
      case 'Post-Test': return 'assignment_turned_in';
      case 'Survey': return 'reviews';
      case 'Phase': return 'timeline';
    }
  }

  onCourseSelected(courseId: any) {
    if (!courseId) return;
    const course: any = this.lmsData.courses().find((c: any) => (c.courseId || c.id) === courseId);
    if (course) {
      this.form.patchValue({
        name: course.title || course.name || 'Untitled Course',
        description: course.description || ''
      });

      this.selectedCourseClasses.set([
        {
          id: `cls-${course.courseId || course.id}-1`,
          name: `${course.title || course.name || 'Course'} - Practical Session`,
          date: this.form.get('startDate')?.value || '10/05/2026',
          time: '09:00 - 16:00',
          duration: '7 hours',
          venue: 'BRAC Centre, Room 402',
          instructor: course.instructorName || course.ownerName || 'Dr. Rafiqul Islam'
        }
      ]);
    }
  }

  onContentAssetSelected(assetId: any) {
    if (!assetId) return;
    const asset = this.contentAssets().find(a => a.id === assetId);
    if (asset) {
      this.form.patchValue({
        name: asset.title,
        contentType: asset.type,
        contentLength: asset.duration
      });
    }
  }

  onQuestionnaireSelected(qId: any) {
    if (!qId) return;
    const q: any = this.lmsData.assessments().find((x: any) => (x.assessmentId || x.id) === qId);
    if (q) {
      this.form.patchValue({
        name: q.title,
        description: q.description || ''
      });
    }
  }

  onSurveyFormSelected(sId: any) {
    if (!sId) return;
    const s: any = this.lmsData.feedbackForms().find((x: any) => (x.feedbackFormId || x.id) === sId);
    if (s) {
      this.form.patchValue({
        name: s.title,
        description: s.description || ''
      });
    }
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const currentComp = this.componentToEdit();
    const type = this.selectedType();
    const duration = getDurationDays(val.startDate, val.endDate);

    const component: PlanComponent = {
      id: currentComp?.id || (type === 'Phase' ? `comp-ph-${Date.now()}` : `comp-${Date.now()}`),
      planId: this.plan()?.id || 'plan-fodp-2026',
      phaseId: type === 'Phase' ? null : (val.phaseId || null),
      sequence: currentComp?.sequence || this.allComponents().length + 1,
      name: val.name,
      type: type,
      description: val.description,
      startDate: val.startDate,
      endDate: val.endDate,
      durationDays: duration,
      isMandatory: type === 'Phase' ? true : val.isMandatory,
      prerequisiteIds: type === 'Phase' ? [] : this.selectedPrerequisites(),
      progressionCondition: type === 'Phase' ? undefined : {
        rule: val.progressionRule,
        threshold: val.progressionThreshold,
        label: this.availableProgressionRules().find(r => r.value === val.progressionRule)?.label || val.progressionRule
      },
      includedClasses: type === 'Course' ? this.selectedCourseClasses() : undefined,
      source: currentComp?.source || {
        sourceType: type === 'Course' ? 'Course Catalog' : type === 'Content' ? 'Content Repository' : type === 'Pre-Test' || type === 'Post-Test' || type === 'Survey' ? 'Questionnaire Library' : 'Task Template',
        itemName: val.name
      },
      isComplete: currentComp?.isComplete || false
    };

    this.save.emit(component);
  }
}
