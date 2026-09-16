import { Component, ChangeDetectionStrategy, input, output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { InstructorProfile } from '../../models/instructor.model';
import { AuthorProfile } from '../../models/author.model';

export interface BulkAssignItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'instructor' | 'author';
  status: 'Active' | 'Inactive';
}

interface TargetLayerOption {
  courseId: string;
  courseName: string;
  lmsId: string;
  lmsName: string;
  layerTitle: string;
  layerType: string;
  selected: boolean;
}

@Component({
  selector: 'app-bulk-assign-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
        <div class="w-full max-w-2xl rounded-3xl bg-base-100 border border-base-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-modal-card">
          
          <!-- Modal Header -->
          <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-tenant-50 dark:bg-tenant-950/60 text-tenant-600 dark:text-tenant-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">group_add</span>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Bulk Assign {{ personnelType() === 'instructor' ? 'Instructors' : 'Authors' }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Batch assign {{ selectedPersonnel().length }} selected {{ personnelType() === 'instructor' ? 'instructor(s)' : 'author(s)' }} across course layers
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="onClose()"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <!-- Stepper Indicator -->
          <div class="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2" [class.font-bold]="currentStep() === 1" [class.text-tenant-600]="currentStep() === 1">
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[11px]" [class.bg-tenant-600]="currentStep() === 1" [class.text-white]="currentStep() === 1" [class.bg-slate-300]="currentStep() !== 1">1</span>
              <span>1. Selected People ({{ selectedPersonnel().length }})</span>
            </div>
            <span class="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            <div class="flex items-center gap-2" [class.font-bold]="currentStep() === 2" [class.text-tenant-600]="currentStep() === 2">
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[11px]" [class.bg-tenant-600]="currentStep() === 2" [class.text-white]="currentStep() === 2" [class.bg-slate-300]="currentStep() !== 2">2</span>
              <span>2. Target Course Layers</span>
            </div>
            <span class="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            <div class="flex items-center gap-2" [class.font-bold]="currentStep() === 3" [class.text-tenant-600]="currentStep() === 3">
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[11px]" [class.bg-tenant-600]="currentStep() === 3" [class.text-white]="currentStep() === 3" [class.bg-slate-300]="currentStep() !== 3">3</span>
              <span>3. Summary &amp; Confirm</span>
            </div>
          </div>

          <!-- Modal Body Content by Step -->
          <div class="p-6 space-y-4 overflow-y-auto flex-1">
            
            <!-- STEP 1: Selected Personnel Review -->
            @if (currentStep() === 1) {
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Selected {{ personnelType() === 'instructor' ? 'Instructors' : 'Authors' }} ({{ selectedPersonnel().length }})
                  </span>
                  <span class="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">verified</span>
                    All Active &amp; Validated
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  @for (person of selectedPersonnel(); track person.id) {
                    <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <img [src]="person.avatar" [alt]="person.name" class="w-9 h-9 rounded-full object-cover shrink-0" referrerpolicy="no-referrer" />
                      <div class="min-w-0 flex-1">
                        <div class="font-bold text-xs text-slate-900 dark:text-white truncate">{{ person.name }}</div>
                        <div class="text-[11px] text-slate-500 truncate font-mono">{{ person.email }}</div>
                      </div>
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                  }
                </div>

                <div class="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p class="font-semibold text-slate-800 dark:text-slate-200">Organization-Wide Pool Policy (§0.2 / §3.4):</p>
                  <p>Inactive personnel are excluded from bulk assignment. The selected personnel will be tagged across the target course layers selected in Step 2.</p>
                </div>
              </div>
            }

            <!-- STEP 2: Target Course & Layer Selector -->
            @if (currentStep() === 2) {
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Select Target Course Layers
                    </h4>
                    <p class="text-[11px] text-slate-500">Choose one or more courses and layers across active LMS instances</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="toggleAllLayers(true)"
                      class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      (click)="toggleAllLayers(false)"
                      class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                <!-- Course filter dropdown -->
                <div class="flex items-center gap-3">
                  <span class="text-xs text-slate-500 font-medium">Filter Course:</span>
                  <select
                    [(ngModel)]="selectedCourseFilter"
                    class="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-tenant-500"
                  >
                    <option value="all">All Available Courses ({{ courseOptions.length }})</option>
                    @for (crs of availableCourses; track crs.id) {
                      <option [value]="crs.id">{{ crs.title }}</option>
                    }
                  </select>
                </div>

                <!-- Layer checkboxes list -->
                <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                  @for (layer of filteredLayerOptions(); track layer.courseId + layer.layerTitle) {
                    <label class="p-3 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer"
                      [class.bg-tenant-50]="layer.selected"
                      [class.dark:bg-tenant-950/40]="layer.selected"
                      [class.border-tenant-500]="layer.selected"
                      [class.bg-slate-50]="!layer.selected"
                      [class.dark:bg-slate-800/40]="!layer.selected"
                      [class.border-slate-200]="!layer.selected"
                      [class.dark:border-slate-700]="!layer.selected"
                    >
                      <input
                        type="checkbox"
                        [(ngModel)]="layer.selected"
                        class="mt-1 w-4 h-4 rounded text-tenant-600 focus:ring-tenant-500 cursor-pointer"
                      />
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-xs text-slate-900 dark:text-white">{{ layer.layerTitle }}</span>
                          <span class="px-2 py-0.2 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                            {{ layer.layerType }}
                          </span>
                        </div>
                        <div class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Course: <strong class="text-slate-700 dark:text-slate-300">{{ layer.courseName }}</strong></span>
                          <span>•</span>
                          <span class="font-mono text-[10px]">{{ layer.lmsName }}</span>
                        </div>
                      </div>
                    </label>
                  }
                </div>

                <div class="text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Selected Target Layers: <strong class="text-tenant-600 dark:text-tenant-400">{{ selectedLayersCount() }}</strong>
                </div>
              </div>
            }

            <!-- STEP 3: Summary Confirmation -->
            @if (currentStep() === 3) {
              <div class="space-y-4">
                <div class="p-4 rounded-2xl bg-tenant-50 dark:bg-tenant-950/40 border border-tenant-200 dark:border-tenant-800 space-y-2">
                  <div class="flex items-center gap-2 text-tenant-700 dark:text-tenant-300 font-bold text-sm">
                    <span class="material-symbols-outlined text-lg">fact_check</span>
                    <span>Review Bulk Assignment Plan (§3.2 / §3.3)</span>
                  </div>
                  <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    This action will create <strong class="text-tenant-600 dark:text-tenant-400 font-bold">{{ calculatedTotalAssignments() }} new tagging assignments</strong> 
                    across <strong class="font-bold">{{ selectedLayersCount() }} course layer(s)</strong> for <strong class="font-bold">{{ selectedPersonnel().length }} {{ personnelType() === 'instructor' ? 'instructor(s)' : 'author(s)' }}</strong>.
                  </p>
                </div>

                <!-- Personnel Summary Pills -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Selected Personnel:</label>
                  <div class="flex flex-wrap gap-2">
                    @for (p of selectedPersonnel(); track p.id) {
                      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <img [src]="p.avatar" [alt]="p.name" class="w-4 h-4 rounded-full object-cover" referrerpolicy="no-referrer" />
                        <span class="font-semibold text-slate-800 dark:text-slate-200">{{ p.name }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Target Layers Summary -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Target Course Layers:</label>
                  <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    @for (layer of getSelectedLayers(); track layer.courseId + layer.layerTitle) {
                      <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <span class="font-bold text-slate-900 dark:text-white">{{ layer.layerTitle }}</span>
                          <span class="text-slate-500 text-[11px] ml-1.5 font-mono">({{ layer.courseName }})</span>
                        </div>
                        <span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase font-semibold">
                          {{ layer.layerType }}
                        </span>
                      </div>
                    }
                  </div>
                </div>

                <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm text-amber-600">info</span>
                  <span>{{ personnelType() === 'author' ? 'Authorship tagging adds credits to existing content items without overwriting other contributors.' : 'Instructors will be tagged directly to the structural layers.' }}</span>
                </div>
              </div>
            }

          </div>

          <!-- Modal Footer Controls -->
          <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <button
              type="button"
              (click)="onClose()"
              class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div class="flex items-center gap-2">
              @if (currentStep() > 1) {
                <button
                  type="button"
                  (click)="currentStep.set(currentStep() - 1)"
                  class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Back
                </button>
              }

              @if (currentStep() < 3) {
                <button
                  type="button"
                  (click)="goToNextStep()"
                  [disabled]="currentStep() === 2 && selectedLayersCount() === 0"
                  [class.opacity-50]="currentStep() === 2 && selectedLayersCount() === 0"
                  class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>Next Step</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              } @else {
                <button
                  type="button"
                  (click)="executeBulkAssign()"
                  [disabled]="isApplying()"
                  class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  @if (isApplying()) {
                    <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Applying Assignments...</span>
                  } @else {
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                    <span>Confirm &amp; Apply {{ calculatedTotalAssignments() }} Assignments</span>
                  }
                </button>
              }
            </div>
          </div>

        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BulkAssignModalComponent {
  lms = inject(LmsDataService);

  isOpen = input<boolean>(false);
  personnelType = input<'instructor' | 'author'>('instructor');
  selectedPersonnel = input<BulkAssignItem[]>([]);

  close = output<void>();
  completed = output<{ totalAssignments: number }>();

  currentStep = signal<number>(1);
  isApplying = signal<boolean>(false);
  selectedCourseFilter = 'all';

  availableCourses = [
    { id: 'crs-brac-101', title: 'BRAC Microfinance Operations & Client Protection Principles' },
    { id: 'crs-brac-102', title: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery' },
    { id: 'crs-brac-103', title: 'Community Disaster Preparedness & Flood Relief Logistics' },
    { id: 'crs-brac-104', title: 'Social Enterprises Financial Governance & Compliance' }
  ];

  courseOptions = [
    {
      courseId: 'crs-brac-101',
      courseName: 'BRAC Microfinance Operations & Client Protection Principles',
      lmsId: 'LMS-1972-01',
      lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
      layerTitle: 'Course Lead Faculty Assignment',
      layerType: 'course',
      selected: true
    },
    {
      courseId: 'crs-brac-101',
      courseName: 'BRAC Microfinance Operations & Client Protection Principles',
      lmsId: 'LMS-1972-01',
      lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
      layerTitle: 'Module 1: Village Organization (VO) Foundations & Governance',
      layerType: 'module',
      selected: false
    },
    {
      courseId: 'crs-brac-101',
      courseName: 'BRAC Microfinance Operations & Client Protection Principles',
      lmsId: 'LMS-1972-01',
      lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
      layerTitle: 'Lesson 1.1.1: VO Formation & Meeting Governance',
      layerType: 'lesson',
      selected: false
    },
    {
      courseId: 'crs-brac-102',
      courseName: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery',
      lmsId: 'LMS-1972-02',
      lmsName: 'Ultra-Poor Graduation & Social Development Institute',
      layerTitle: 'Course Lead Faculty Assignment',
      layerType: 'course',
      selected: false
    },
    {
      courseId: 'crs-brac-102',
      courseName: 'Ultra-Poor Graduation (UPG) Coaching & Asset Transfer Mastery',
      lmsId: 'LMS-1972-02',
      lmsName: 'Ultra-Poor Graduation & Social Development Institute',
      layerTitle: 'Module 2: Sustainable Livelihood Asset Transfer Protocols',
      layerType: 'module',
      selected: false
    },
    {
      courseId: 'crs-brac-103',
      courseName: 'Community Disaster Preparedness & Flood Relief Logistics',
      lmsId: 'LMS-1972-03',
      lmsName: 'Climate Resilience & Humanitarian Action Institute',
      layerTitle: 'Module 1: Rapid Cyclone Warning & Emergency Evacuation Logistics',
      layerType: 'module',
      selected: false
    },
    {
      courseId: 'crs-brac-104',
      courseName: 'Social Enterprises Financial Governance & Compliance',
      lmsId: 'LMS-1972-01',
      lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
      layerTitle: 'Module 1: Statutory Auditing & AML Compliance Standards',
      layerType: 'module',
      selected: false
    }
  ];

  filteredLayerOptions(): TargetLayerOption[] {
    if (this.selectedCourseFilter === 'all') {
      return this.courseOptions;
    }
    return this.courseOptions.filter(o => o.courseId === this.selectedCourseFilter);
  }

  toggleAllLayers(state: boolean) {
    this.filteredLayerOptions().forEach(layer => layer.selected = state);
  }

  selectedLayersCount(): number {
    return this.courseOptions.filter(o => o.selected).length;
  }

  getSelectedLayers(): TargetLayerOption[] {
    return this.courseOptions.filter(o => o.selected);
  }

  calculatedTotalAssignments(): number {
    return this.selectedPersonnel().length * this.selectedLayersCount();
  }

  goToNextStep() {
    if (this.currentStep() === 2 && this.selectedLayersCount() === 0) {
      this.lms.showToast('Please select at least one course layer target.', 'error', 3000, 'Target Required');
      return;
    }
    this.currentStep.set(this.currentStep() + 1);
  }

  onClose() {
    this.currentStep.set(1);
    this.close.emit();
  }

  executeBulkAssign() {
    const total = this.calculatedTotalAssignments();
    const selectedLayers = this.getSelectedLayers();
    const selectedPeople = this.selectedPersonnel();

    this.isApplying.set(true);

    setTimeout(() => {
      // If instructors, register into assignments state in LmsDataService
      if (this.personnelType() === 'instructor') {
        selectedPeople.forEach(inst => {
          selectedLayers.forEach(layer => {
            this.lms.addInstructorAssignment({
              instructorId: inst.id,
              instructorName: inst.name,
              instructorEmail: inst.email,
              courseId: layer.courseId,
              courseName: layer.courseName,
              layer: layer.layerTitle,
              layerType: layer.layerType,
              lmsId: layer.lmsId,
              lmsName: layer.lmsName,
              courseStatus: 'Published',
              assignedDate: new Date().toLocaleDateString()
            });
          });
        });
      } else {
        // Authors tagging into authorship records
        selectedPeople.forEach(auth => {
          selectedLayers.forEach(layer => {
            this.lms.addAuthorshipCredit({
              authorId: auth.id,
              authorName: auth.name,
              authorEmail: auth.email,
              contentItemId: `cnt-bulk-${Date.now()}-${Math.floor(Math.random()*1000)}`,
              contentItemTitle: `${layer.layerTitle} (Authored Unit)`,
              contentType: 'video',
              courseId: layer.courseId,
              courseName: layer.courseName,
              courseStatus: 'Published',
              lmsId: layer.lmsId,
              lmsName: layer.lmsName,
              version: 'v1.0',
              nodeTitle: layer.layerTitle,
              creditedDate: new Date().toLocaleDateString()
            });
          });
        });
      }

      this.isApplying.set(false);
      this.lms.showToast(
        `Successfully created ${total} tagging assignments across ${selectedLayers.length} course layer(s).`,
        'success',
        4000,
        'Bulk Assign Complete'
      );
      this.lms.logAction(
        'Bulk Assignment Applied',
        `Bulk assigned ${selectedPeople.length} ${this.personnelType()}(s) to ${selectedLayers.length} course layers (${total} assignments created)`,
        'success'
      );
      this.completed.emit({ totalAssignments: total });
      this.onClose();
    }, 800);
  }
}
