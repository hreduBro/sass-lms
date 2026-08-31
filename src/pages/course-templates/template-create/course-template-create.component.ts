import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import {
  CourseTemplate,
  CourseTemplateModule,
  CourseTemplateSlot,
  CourseTemplateStructure,
  CourseTemplateStatus,
  CourseTemplateScope,
  CourseSlotType,
  DEFAULT_REQUIRED_COMPONENTS,
  deepCopyTemplateStructure,
  calculateTemplateDuration,
  countTemplateSlots
} from '../../../models/course-template.model';

@Component({
  selector: 'app-course-template-create',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './course-template-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseTemplateCreateComponent implements OnInit {
  lms = inject(LmsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmModal = inject(ConfirmationModalService);

  // Edit mode vs Create mode
  isEditMode = signal<boolean>(false);
  templateId = signal<string | null>(null);

  // Current Active Step (1: Basic Info, 2: Modular Blueprint, 3: Governance & Defaults, 4: Review)
  currentStep = signal<1 | 2 | 3 | 4>(1);

  // Form State: Step 1 Basic Info
  name = signal<string>('');
  code = signal<string>('');
  description = signal<string>('');
  categoryTags = signal<string[]>(['Compliance & Security']);
  newTagInput = signal<string>('');
  scope = signal<CourseTemplateScope>('lms');
  visibilityMode = signal<'all_lms_instructors' | 'restricted' | 'org_wide'>('all_lms_instructors');
  status = signal<CourseTemplateStatus>('active');

  // Form State: Step 2 Modular Structure
  modules = signal<CourseTemplateModule[]>([
    {
      moduleId: 'm-01',
      order: 1,
      title: 'Module 1: Foundational Framework & Core Principles',
      description: 'Introductory domain context and baseline knowledge.',
      contentSlots: [
        { slotId: 's-01-01', order: 1, title: 'Orientation & Overview Video', type: 'video', required: true, estimatedMinutes: 15, description: 'High-level conceptual walkthrough' },
        { slotId: 's-01-02', order: 2, title: 'Foundational Knowledge Reading', type: 'article', required: true, estimatedMinutes: 10, description: 'Core principles and standard operating guidelines' },
        { slotId: 's-01-03', order: 3, title: 'Knowledge Check Quiz', type: 'quiz', required: true, estimatedMinutes: 15, description: 'Self-assessment quiz covering module 1 concepts' }
      ]
    },
    {
      moduleId: 'm-02',
      order: 2,
      title: 'Module 2: Practical Application & Scenario Execution',
      description: 'Hands-on problem solving and case study analysis.',
      contentSlots: [
        { slotId: 's-02-01', order: 1, title: 'Case Study Demonstration Video', type: 'video', required: true, estimatedMinutes: 20, description: 'Real-world workplace walkthrough' },
        { slotId: 's-02-02', order: 2, title: 'Interactive Assessment / Simulation', type: 'interactive_lab', required: true, estimatedMinutes: 25, description: 'Interactive lab exercise' }
      ]
    }
  ]);

  // Selected Module Index for Step 2 slot editing
  activeModuleIndex = signal<number>(0);

  // Form State: Step 3 Governance & Defaults
  passingScorePercent = signal<number>(80);
  completionTracking = signal<'all_slots' | 'all_mandatory_slots' | 'required_slots_only' | 'final_assessment_only' | 'assessment_only'>('all_mandatory_slots');
  sequentialUnlock = signal<boolean>(true);
  certificateEnabled = signal<boolean>(true);
  allowRetakes = signal<boolean>(true);
  maxRetakeAttempts = signal<number>(3);
  pace = signal<'self_paced' | 'cohort_scheduled' | 'instructor_led'>('cohort_scheduled');

  // Active User / Tenant / LMS info
  activeTenant = this.lms.activeTenant;
  activeLms = this.lms.activeLms;
  permissions = this.lms.courseTemplatePermissions;

  // Available Slot Types
  slotTypeOptions: { type: CourseSlotType; label: string; icon: string; defaultMinutes: number }[] = [
    { type: 'video', label: 'Video Lecture', icon: 'videocam', defaultMinutes: 15 },
    { type: 'article', label: 'Reading Article', icon: 'article', defaultMinutes: 10 },
    { type: 'quiz', label: 'Assessment Quiz', icon: 'quiz', defaultMinutes: 15 },
    { type: 'interactive_lab', label: 'Interactive Lab', icon: 'science', defaultMinutes: 25 },
    { type: 'simulation', label: 'Scenario Simulation', icon: 'smart_toy', defaultMinutes: 30 },
    { type: 'scorm', label: 'SCORM Package', icon: 'extension', defaultMinutes: 20 }
  ];

  // Common category presets
  presetCategories: string[] = [
    'Compliance & Security',
    'AI & Data',
    'Clinical Healthcare',
    'Finance',
    'Microfinance & Social Development',
    'Engineering',
    'Leadership & Soft Skills',
    'General'
  ];

  // Total Modules Count computed
  totalModules = computed(() => this.modules().length);

  // Total Content Slots Count computed
  totalSlots = computed(() => {
    return this.modules().reduce((acc, m) => acc + (m.contentSlots ? m.contentSlots.length : 0), 0);
  });

  // Total Estimated Duration computed
  totalDuration = computed(() => {
    let sum = 0;
    this.modules().forEach(m => {
      (m.contentSlots || []).forEach(s => {
        sum += (s.estimatedMinutes || 15);
      });
    });
    return sum;
  });

  // Validation State for current step
  isStepValid = computed(() => {
    const step = this.currentStep();
    if (step === 1) {
      return this.name().trim().length >= 3;
    }
    if (step === 2) {
      const mods = this.modules();
      if (mods.length === 0) return false;
      return mods.every(m => m.title.trim().length > 0 && m.contentSlots.length > 0);
    }
    if (step === 3) {
      return this.passingScorePercent() >= 50 && this.passingScorePercent() <= 100;
    }
    return true;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.templateId.set(id);
      const existing = this.lms.getCourseTemplateById(id);
      if (existing) {
        this.loadExistingTemplate(existing);
      } else {
        this.lms.showToast('Template not found.', 'error', 3500, 'Error');
        this.router.navigate(['/courses/templates']);
      }
    } else {
      // Auto-generate a random code for new template
      const rand = Math.floor(1000 + Math.random() * 9000);
      this.code.set(`TMP-MOD-${rand}`);
    }
  }

  loadExistingTemplate(t: CourseTemplate) {
    this.name.set(t.name);
    this.code.set(t.code);
    this.description.set(t.description || '');
    this.categoryTags.set([...(t.categoryTags || ['General'])]);
    this.scope.set(t.scope || 'lms');
    this.visibilityMode.set(t.visibility?.mode || 'all_lms_instructors');
    this.status.set(t.status);

    if (t.structure && t.structure.modules) {
      this.modules.set(deepCopyTemplateStructure(t.structure).modules);
    }

    if (t.structure?.structuralDefaults) {
      const def = t.structure.structuralDefaults;
      this.passingScorePercent.set(def.passingScorePercent || 80);
      this.completionTracking.set(def.completionTracking || 'all_mandatory_slots');
      this.sequentialUnlock.set(def.sequentialUnlock ?? true);
      this.certificateEnabled.set(def.certificateEnabled ?? true);
      this.allowRetakes.set(def.allowRetakes ?? true);
      this.maxRetakeAttempts.set(def.maxRetakeAttempts || 3);
      this.pace.set(def.pace || 'cohort_scheduled');
    }
  }

  // Navigation Steps
  goToStep(step: 1 | 2 | 3 | 4) {
    if (step > this.currentStep() && !this.isStepValid()) {
      this.lms.showToast('Please complete the required fields in the current step.', 'warning', 3500, 'Incomplete Fields');
      return;
    }
    this.currentStep.set(step);
  }

  nextStep() {
    if (!this.isStepValid()) {
      this.lms.showToast('Please complete the required fields.', 'warning', 3500, 'Validation Warning');
      return;
    }
    const curr = this.currentStep();
    if (curr < 4) {
      this.currentStep.set((curr + 1) as any);
    }
  }

  prevStep() {
    const curr = this.currentStep();
    if (curr > 1) {
      this.currentStep.set((curr - 1) as any);
    }
  }

  // Category Tag Management
  addTag(tagToAdd?: string) {
    const tag = tagToAdd || this.newTagInput().trim();
    if (!tag) return;
    if (!this.categoryTags().includes(tag)) {
      this.categoryTags.update(tags => [...tags, tag]);
    }
    if (!tagToAdd) {
      this.newTagInput.set('');
    }
  }

  removeTag(tagToRemove: string) {
    this.categoryTags.update(tags => tags.filter(t => t !== tagToRemove));
  }

  // Step 2: Module Management
  addModule() {
    const currentMods = this.modules();
    const nextOrder = currentMods.length + 1;
    const newMod: CourseTemplateModule = {
      moduleId: `m-${Date.now()}`,
      order: nextOrder,
      title: `Module ${nextOrder}: New Curriculum Topic`,
      description: 'Define key learning objectives and instructional sequence.',
      contentSlots: [
        {
          slotId: `s-${Date.now()}-1`,
          order: 1,
          title: 'Topic Overview Video',
          type: 'video',
          required: true,
          estimatedMinutes: 15,
          description: 'Instructional video lecture placeholder'
        },
        {
          slotId: `s-${Date.now()}-2`,
          order: 2,
          title: 'Topic Knowledge Check Quiz',
          type: 'quiz',
          required: true,
          estimatedMinutes: 15,
          description: 'Standard evaluation quiz'
        }
      ]
    };

    this.modules.update(mods => [...mods, newMod]);
    this.activeModuleIndex.set(this.modules().length - 1);
  }

  removeModule(index: number) {
    if (this.modules().length <= 1) {
      this.lms.showToast('A template blueprint requires at least 1 module.', 'warning', 3500, 'Minimum Required');
      return;
    }
    this.modules.update(mods => mods.filter((_, i) => i !== index));
    if (this.activeModuleIndex() >= this.modules().length) {
      this.activeModuleIndex.set(Math.max(0, this.modules().length - 1));
    }
  }

  moveModuleUp(index: number) {
    if (index <= 0) return;
    this.modules.update(mods => {
      const copy = [...mods];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
    this.activeModuleIndex.set(index - 1);
  }

  moveModuleDown(index: number) {
    if (index >= this.modules().length - 1) return;
    this.modules.update(mods => {
      const copy = [...mods];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
    this.activeModuleIndex.set(index + 1);
  }

  // Step 2: Content Slot Management
  addSlot(moduleIndex: number, type: CourseSlotType = 'video') {
    const typeDef = this.slotTypeOptions.find(o => o.type === type) || this.slotTypeOptions[0];
    const mod = this.modules()[moduleIndex];
    if (!mod) return;

    const nextOrder = (mod.contentSlots || []).length + 1;
    const newSlot: CourseTemplateSlot = {
      slotId: `s-${Date.now()}-${nextOrder}`,
      order: nextOrder,
      title: `${typeDef.label} Slot ${nextOrder}`,
      type: type,
      required: true,
      estimatedMinutes: typeDef.defaultMinutes,
      description: `Placeholder content slot for ${typeDef.label}.`
    };

    this.modules.update(mods => mods.map((m, idx) => {
      if (idx === moduleIndex) {
        return {
          ...m,
          contentSlots: [...(m.contentSlots || []), newSlot]
        };
      }
      return m;
    }));
  }

  removeSlot(moduleIndex: number, slotIndex: number) {
    const mod = this.modules()[moduleIndex];
    if (!mod || mod.contentSlots.length <= 1) {
      this.lms.showToast('Each module requires at least 1 content slot.', 'warning', 3500, 'Slot Required');
      return;
    }

    this.modules.update(mods => mods.map((m, idx) => {
      if (idx === moduleIndex) {
        return {
          ...m,
          contentSlots: m.contentSlots.filter((_, sIdx) => sIdx !== slotIndex)
        };
      }
      return m;
    }));
  }

  // Save Blueprint Action
  saveTemplate(asDraft: boolean = false) {
    if (!this.name().trim()) {
      this.lms.showToast('Please enter a template name.', 'error', 3500, 'Name Required');
      this.currentStep.set(1);
      return;
    }

    const structure: CourseTemplateStructure = {
      modules: this.modules().map((m, mIdx) => ({
        ...m,
        order: mIdx + 1,
        contentSlots: (m.contentSlots || []).map((s, sIdx) => ({
          ...s,
          order: sIdx + 1
        }))
      })),
      requiredComponents: JSON.parse(JSON.stringify(DEFAULT_REQUIRED_COMPONENTS)),
      structuralDefaults: {
        passingScorePercent: this.passingScorePercent(),
        completionTracking: this.completionTracking(),
        sequentialUnlock: this.sequentialUnlock(),
        certificateEnabled: this.certificateEnabled(),
        allowRetakes: this.allowRetakes(),
        maxRetakeAttempts: this.maxRetakeAttempts(),
        pace: this.pace()
      }
    };

    const targetStatus: CourseTemplateStatus = asDraft ? 'draft' : 'active';

    if (this.isEditMode() && this.templateId()) {
      this.lms.updateCourseTemplate(this.templateId()!, {
        name: this.name().trim(),
        code: this.code().trim(),
        description: this.description().trim(),
        categoryTags: this.categoryTags(),
        scope: this.scope(),
        visibility: { mode: this.visibilityMode() },
        status: targetStatus,
        structure: structure
      });
    } else {
      this.lms.createCourseTemplate({
        name: this.name().trim(),
        code: this.code().trim(),
        description: this.description().trim(),
        categoryTags: this.categoryTags(),
        scope: this.scope(),
        visibility: { mode: this.visibilityMode() },
        status: targetStatus,
        structure: structure
      });
    }

    this.router.navigate(['/courses/templates']);
  }

  // Cancel with Confirmation
  cancel() {
    this.confirmModal.confirmDiscard({
      title: 'Discard Blueprint Changes?',
      message: 'You have unsaved changes in this template builder. Would you like to save as draft before leaving?',
      showDraftOption: true,
      draftText: 'Save as Draft',
      discardText: 'Discard Changes',
      cancelText: 'Continue Editing',
      onDraft: () => {
        this.saveTemplate(true);
      },
      onDiscard: () => {
        this.router.navigate(['/courses/templates']);
      }
    });
  }

  // Icon helper
  getSlotTypeIcon(type: CourseSlotType): string {
    const found = this.slotTypeOptions.find(o => o.type === type);
    return found ? found.icon : 'menu_book';
  }
}
