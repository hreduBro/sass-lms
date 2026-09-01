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
import { StepperComponent, StepperStep, StepItem } from '../../../components/stepper/stepper.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

export interface TemplateValidationIssue {
  step: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  field?: string;
}

@Component({
  selector: 'app-course-template-create',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StepperComponent,
    CustomSelectComponent
  ],
  templateUrl: './course-template-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
})
export class CourseTemplateCreateComponent implements OnInit {
  lms = inject(LmsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private modalService = inject(ConfirmationModalService);

  // Edit mode vs Create mode
  isEditMode = signal<boolean>(false);
  templateId = signal<string | null>(null);
  editingTemplate = signal<CourseTemplate | null>(null);

  // Current Active Step (1: Basic Info, 2: Modular Blueprint, 3: Governance & Defaults, 4: Review)
  currentStep = signal<number>(1);
  completedSteps = signal<Set<number>>(new Set());

  // Field-level validation errors (matching Create LMS pattern)
  errors = signal<Record<string, string>>({});

  // Form error and success alerts
  formErrorAlert = signal<string | null>(null);
  formSuccessAlert = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  showPublishModal = signal<boolean>(false);

  wizardSteps: StepItem[] = [
    { id: 1, key: 'blueprint', shortTitle: 'Blueprint Info', title: 'Blueprint Information & Scope', sublabel: 'Identity & Bounds', icon: 'info' },
    { id: 2, key: 'structure', shortTitle: 'Modular Structure', title: 'Modular Structure & Content Slots', sublabel: 'Modules & Slots', icon: 'account_tree' },
    { id: 3, key: 'governance', shortTitle: 'Governance Defaults', title: 'Governance Policy & Delivery Defaults', sublabel: 'Pass Mark & Retakes', icon: 'verified' },
    { id: 4, key: 'review', shortTitle: 'Review & Publish', title: 'Review & Publish Blueprint', sublabel: 'Validate & Launch', icon: 'rate_review' }
  ];

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

  // CustomSelect Options
  scopeOptions: SelectOption[] = [
    { value: 'lms', label: 'LMS Workspace (Default)', sublabel: 'Available within this LMS instance only', icon: 'domain' },
    { value: 'organization', label: 'Organization-Wide', sublabel: 'Shared across all LMS instances under this Organization', icon: 'corporate_fare' }
  ];

  visibilityOptions: SelectOption[] = [
    { value: 'all_lms_instructors', label: 'All LMS Instructors', sublabel: 'Any instructor can use this blueprint to spawn courses', icon: 'groups' },
    { value: 'restricted', label: 'Restricted to Creator & Admins', sublabel: 'Only template author and appointed LMS managers', icon: 'lock' },
    { value: 'org_wide', label: 'Organization-Wide Public', sublabel: 'Visible to instructors across all affiliated LMS instances', icon: 'public' }
  ];

  completionTrackingOptions: SelectOption[] = [
    { value: 'all_mandatory_slots', label: 'All Mandatory Slots (Recommended)', sublabel: 'Learner must complete all slots marked as required', icon: 'check_box' },
    { value: 'all_slots', label: '100% of All Content Slots', sublabel: 'Learner must complete every single content slot', icon: 'done_all' },
    { value: 'final_assessment_only', label: 'Final Assessment Score Only', sublabel: 'Completion determined purely by passing score', icon: 'quiz' }
  ];

  paceOptions: SelectOption[] = [
    { value: 'cohort_scheduled', label: 'Cohort-Scheduled', sublabel: 'Structured pacing with module milestones', icon: 'date_range' },
    { value: 'self_paced', label: 'Self-Paced (Asynchronous)', sublabel: 'Learner progresses freely at their own speed', icon: 'speed' },
    { value: 'instructor_led', label: 'Instructor-Led', sublabel: 'Live sessions and scheduled instructor unlock', icon: 'person_play' }
  ];

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

  // Validation Audit Issues
  validationIssues = computed<TemplateValidationIssue[]>(() => {
    const issues: TemplateValidationIssue[] = [];

    // Step 1 check
    if (!this.name().trim()) {
      issues.push({ step: 1, severity: 'critical', message: 'Template name is mandatory (minimum 3 characters).', field: 'name' });
    } else if (this.name().trim().length < 3) {
      issues.push({ step: 1, severity: 'critical', message: 'Template name must be at least 3 characters long.', field: 'name' });
    }

    if (this.categoryTags().length === 0) {
      issues.push({ step: 1, severity: 'warning', message: 'Adding at least one category tag is recommended for catalog discovery.', field: 'categoryTags' });
    }

    // Step 2 check
    const mods = this.modules();
    if (mods.length === 0) {
      issues.push({ step: 2, severity: 'critical', message: 'The curriculum template requires at least 1 module.', field: 'modules' });
    } else {
      mods.forEach((m, idx) => {
        if (!m.title.trim()) {
          issues.push({ step: 2, severity: 'critical', message: `Module ${idx + 1} has an empty title.`, field: `module-${idx}` });
        }
        if (!m.contentSlots || m.contentSlots.length === 0) {
          issues.push({ step: 2, severity: 'critical', message: `Module "${m.title || (idx + 1)}" must contain at least 1 content slot.`, field: `module-${idx}-slots` });
        }
      });
    }

    // Step 3 check
    if (this.passingScorePercent() < 50 || this.passingScorePercent() > 100) {
      issues.push({ step: 3, severity: 'critical', message: 'Passing score must be between 50% and 100%.', field: 'passingScore' });
    }

    return issues;
  });

  criticalErrors = computed(() => {
    return this.validationIssues().filter(i => i.severity === 'critical');
  });

  warningIssues = computed(() => {
    return this.validationIssues().filter(i => i.severity === 'warning' || i.severity === 'info');
  });

  isStepValid = computed(() => {
    const step = this.currentStep();
    const errors = this.criticalErrors().filter(e => e.step === step);
    return errors.length === 0;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.templateId.set(id);
      const existing = this.lms.getCourseTemplateById(id);
      if (existing) {
        this.editingTemplate.set(existing);
        this.loadExistingTemplate(existing);
      } else {
        this.lms.showToast('Template not found.', 'error', 3500, 'Error');
        this.router.navigate(['/courses/templates']);
      }
    } else {
      // Auto-generate a random code for new template
      const rand = Math.floor(1000 + Math.random() * 9000);
      this.code.set(`TMP-MOD-${rand}`);
      this.showStepAlert(1, 'entered');
    }
  }

  /**
   * Dispatches a prominent step alert mentioning the exact step number and description
   */
  private showStepAlert(step: number, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<number, string> = {
      1: 'Step 1 of 4: Blueprint Information & Scope',
      2: 'Step 2 of 4: Modular Structure & Content Slots',
      3: 'Step 3 of 4: Governance Policy & Delivery Defaults',
      4: 'Step 4 of 4: Review & Publish Blueprint'
    };

    const stepDescriptions: Record<number, string> = {
      1: 'Step 1 of 4 — Blueprint Info: Define template title, taxonomy, sharing scope, and instructor access permissions.',
      2: 'Step 2 of 4 — Modular Structure: Configure curriculum modules, learning sequence, and pedagogical delivery slots.',
      3: 'Step 3 of 4 — Governance: Set passing standards, completion tracking rules, retake allowances, and pacing.',
      4: 'Step 4 of 4 — Review & Publish: Audit curriculum architecture parameters and publish blueprint to catalog.'
    };

    let title = stepTitles[step] || `Step ${step} of 4`;
    let badge = `STEP ${step} / 4`;
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    let msg = stepDescriptions[step] || `Active: Step ${step} of 4`;
    if (action === 'completed') {
      const prev = step - 1;
      const prevTitle = stepTitles[prev]?.split(': ')[1] || `Step ${prev}`;
      const nextTitle = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      title = `Step ${prev} Completed Successfully`;
      badge = `STEP ${prev} COMPLETED`;
      msg = `Step ${prev} (${prevTitle}) saved & verified. Now proceeding to Step ${step} of 4: ${nextTitle}.`;
      type = 'success';
    } else if (action === 'back') {
      const stepName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      msg = `Navigated back to Step ${step} of 4 (${stepName}).`;
      type = 'info';
    } else if (action === 'jump') {
      const stepName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      msg = `Active: Step ${step} of 4 (${stepName}).`;
      type = 'info';
    }

    this.lms.showToast(msg, type, 4000, title, badge);
  }

  getCurrentStepTitle(): string {
    const step = this.wizardSteps.find(s => s.id === this.currentStep());
    return step ? step.title : 'Author Course Template';
  }

  getCurrentStepSubtitle(): string {
    switch (this.currentStep()) {
      case 1:
        return 'Define core blueprint identification, discovery taxonomy, and visibility governance.';
      case 2:
        return 'Organize curriculum modules and configure pedagogical delivery slots and durations.';
      case 3:
        return 'Configure automated completion policies, passing thresholds, and cohort pacing standards.';
      case 4:
        return 'Validate the complete curriculum configuration before publishing to the LMS catalog.';
      default:
        return 'Configure course template blueprint parameters.';
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

    this.completedSteps.set(new Set([1, 2, 3, 4]));
    this.lms.showToast(
      `Editing course template: "${t.name}". Navigate between steps to update any parameter.`,
      'info',
      4500,
      'Edit Mode Active',
      'STEPPER WIZARD'
    );
  }

  // Navigation Steps
  goToStep(step: number) {
    if (step === this.currentStep()) return;

    if (step > this.currentStep()) {
      if (this.currentStep() === 1 && !this.validateStep1()) {
        this.formErrorAlert.set('Please enter a valid template blueprint name (minimum 3 characters) before proceeding.');
        this.lms.showToast('Please complete and fix mandatory Basic Information before proceeding.', 'error', 4000, 'Validation Required');
        return;
      }
      if (this.currentStep() === 2 && !this.validateStep2()) {
        this.formErrorAlert.set('All modules must have valid titles and at least one content delivery slot before proceeding.');
        this.lms.showToast('Please complete module configuration before proceeding.', 'error', 4000, 'Validation Required');
        return;
      }
    }

    this.formErrorAlert.set(null);
    this.currentStep.set(step);
    this.showStepAlert(step, 'jump');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onNameChange(val: string) {
    this.name.set(val);
    const trimmed = val.trim();
    this.errors.update(errs => {
      const next = { ...errs };
      if (!trimmed) {
        next['name'] = 'Blueprint Title / Template Name is mandatory.';
      } else if (trimmed.length < 3) {
        next['name'] = 'Template Name must be at least 3 characters long.';
      } else {
        delete next['name'];
      }
      return next;
    });
    if (this.formErrorAlert()) {
      this.formErrorAlert.set(null);
    }
  }

  onModuleTitleChange(mIdx: number, val: string) {
    this.modules.update(mods => {
      const copy = [...mods];
      if (copy[mIdx]) {
        copy[mIdx] = { ...copy[mIdx], title: val };
      }
      return copy;
    });
    const trimmed = val.trim();
    this.errors.update(errs => {
      const next = { ...errs };
      if (!trimmed) {
        next[`module_${mIdx}`] = `Module ${mIdx + 1} title is mandatory.`;
      } else {
        delete next[`module_${mIdx}`];
      }
      return next;
    });
  }

  onSlotTitleChange(mIdx: number, sIdx: number, val: string) {
    this.modules.update(mods => {
      const copy = [...mods];
      if (copy[mIdx] && copy[mIdx].contentSlots && copy[mIdx].contentSlots[sIdx]) {
        const slots = [...copy[mIdx].contentSlots];
        slots[sIdx] = { ...slots[sIdx], title: val };
        copy[mIdx] = { ...copy[mIdx], contentSlots: slots };
      }
      return copy;
    });
    const trimmed = val.trim();
    this.errors.update(errs => {
      const next = { ...errs };
      if (!trimmed) {
        next[`slot_${mIdx}_${sIdx}`] = `Slot ${sIdx + 1} title is mandatory.`;
      } else {
        delete next[`slot_${mIdx}_${sIdx}`];
      }
      return next;
    });
  }

  validateStep1(): boolean {
    const newErrors: Record<string, string> = {};
    const trimmed = this.name().trim();
    if (!trimmed) {
      newErrors['name'] = 'Blueprint Title / Template Name is mandatory.';
    } else if (trimmed.length < 3) {
      newErrors['name'] = 'Template Name must be at least 3 characters long.';
    }
    this.errors.update(e => ({ ...e, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }

  validateStep2(): boolean {
    const newErrors: Record<string, string> = {};
    const mods = this.modules();
    if (mods.length === 0) {
      newErrors['modules'] = 'The curriculum template requires at least 1 module.';
    } else {
      mods.forEach((m, mIdx) => {
        if (!m.title.trim()) {
          newErrors[`module_${mIdx}`] = `Module ${mIdx + 1} title is mandatory.`;
        }
        if (!m.contentSlots || m.contentSlots.length === 0) {
          newErrors[`module_${mIdx}_slots`] = `Module "${m.title || mIdx + 1}" must contain at least 1 content slot.`;
        } else {
          m.contentSlots.forEach((s, sIdx) => {
            if (!s.title.trim()) {
              newErrors[`slot_${mIdx}_${sIdx}`] = `Slot ${sIdx + 1} title is mandatory.`;
            }
          });
        }
      });
    }
    this.errors.update(e => ({ ...e, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }

  validateStep3(): boolean {
    const newErrors: Record<string, string> = {};
    if (this.passingScorePercent() < 50 || this.passingScorePercent() > 100) {
      newErrors['passingScore'] = 'Passing score must be configured between 50% and 100%.';
    }
    this.errors.update(e => ({ ...e, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }

  nextStep() {
    this.formErrorAlert.set(null);
    const curr = this.currentStep();

    if (curr === 1) {
      if (!this.validateStep1()) {
        this.formErrorAlert.set('Blueprint Title / Template Name is mandatory and must be at least 3 characters long.');
        this.lms.showToast('All mandatory fields in Basic Information must be filled up with valid values.', 'error', 4000, 'Basic Information Incomplete');
        return;
      }
      this.completedSteps.update(set => new Set(set).add(1));
    } else if (curr === 2) {
      if (!this.validateStep2()) {
        const step2Errors = this.criticalErrors().filter(e => e.step === 2);
        const msg = step2Errors.length > 0 ? step2Errors[0].message : 'All modules and slots must have valid titles.';
        this.formErrorAlert.set(msg);
        this.lms.showToast(msg, 'error', 4000, 'Modular Structure Incomplete');
        return;
      }
      this.completedSteps.update(set => new Set(set).add(2));
    } else if (curr === 3) {
      if (!this.validateStep3()) {
        this.formErrorAlert.set('Passing score must be configured between 50% and 100%.');
        this.lms.showToast('Please enter a valid passing score standard.', 'error', 4000, 'Invalid Passing Score');
        return;
      }
      this.completedSteps.update(set => new Set(set).add(3));
    }

    if (curr < 4) {
      const next = curr + 1;
      this.currentStep.set(next);
      this.showStepAlert(next, 'completed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    const curr = this.currentStep();
    if (curr > 1) {
      const prev = curr - 1;
      this.currentStep.set(prev);
      this.showStepAlert(prev, 'back');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  resetCurrentStep() {
    const step = this.currentStep();
    if (step === 1) {
      this.name.set('');
      this.description.set('');
      this.categoryTags.set(['Compliance & Security']);
      this.scope.set('lms');
      this.visibilityMode.set('all_lms_instructors');
      this.formErrorAlert.set(null);
    } else if (step === 2) {
      this.modules.set([
        {
          moduleId: `m-${Date.now()}-1`,
          order: 1,
          title: 'Module 1: Foundational Framework & Core Principles',
          description: 'Introductory domain context and baseline knowledge.',
          contentSlots: [
            { slotId: `s-${Date.now()}-1`, order: 1, title: 'Orientation & Overview Video', type: 'video', required: true, estimatedMinutes: 15, description: 'High-level conceptual walkthrough' },
            { slotId: `s-${Date.now()}-2`, order: 2, title: 'Foundational Knowledge Reading', type: 'article', required: true, estimatedMinutes: 10, description: 'Core principles and standard operating guidelines' }
          ]
        }
      ]);
      this.activeModuleIndex.set(0);
    } else if (step === 3) {
      this.passingScorePercent.set(80);
      this.completionTracking.set('all_mandatory_slots');
      this.sequentialUnlock.set(true);
      this.certificateEnabled.set(true);
      this.allowRetakes.set(true);
      this.maxRetakeAttempts.set(3);
      this.pace.set('cohort_scheduled');
    }
    this.lms.showToast('Current step form fields have been reset.', 'info', 3000, 'Step Reset');
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
    this.lms.showToast(`Added Module ${nextOrder}.`, 'info', 2500, 'Module Added');
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
    this.lms.showToast('Module removed.', 'info', 2500, 'Module Removed');
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
    this.lms.showToast(`Added ${typeDef.label} slot to ${mod.title}.`, 'info', 2500, 'Slot Added');
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

  copyTemplateCode() {
    navigator.clipboard?.writeText(this.code());
    this.lms.showToast(`Template Code ${this.code()} copied to clipboard.`, 'success', 3000, 'Code Copied');
  }

  // Save Draft in Place
  saveDraftInPlace() {
    this.isSubmitting.set(true);
    const draft = this.buildTemplateObject(true);

    if (this.isEditMode() && this.templateId()) {
      this.lms.updateCourseTemplate(this.templateId()!, draft);
    } else {
      const created = this.lms.createCourseTemplate(draft);
      this.templateId.set(created.id);
      this.isEditMode.set(true);
    }

    this.isSubmitting.set(false);
    this.formSuccessAlert.set('Template saved as Draft successfully. You can continue editing or publish when ready.');
    this.lms.showToast('Template saved as Draft.', 'success', 4000, 'Draft Saved');
  }

  onPublishClick() {
    if (this.criticalErrors().length > 0) {
      this.formErrorAlert.set('Cannot publish Template. Please resolve all critical validation errors first.');
      this.lms.showToast('Cannot publish Template. Please fix critical validation errors first.', 'error', 4000, 'Validation Failed');
      this.currentStep.set(4);
      return;
    }

    if (this.isEditMode()) {
      this.confirmPublish();
    } else {
      this.showPublishModal.set(true);
    }
  }

  confirmPublish() {
    this.isSubmitting.set(true);
    this.showPublishModal.set(false);

    const templateObj = this.buildTemplateObject(false);

    if (this.isEditMode() && this.templateId()) {
      this.lms.updateCourseTemplate(this.templateId()!, templateObj);
      this.lms.logAction('Course Template Updated', `Updated template blueprint "${templateObj.name}" (${templateObj.code})`, 'success');
      this.lms.showToast(`Template "${templateObj.name}" updated successfully.`, 'success', 4500, 'Template Updated');
    } else {
      const created = this.lms.createCourseTemplate(templateObj);
      this.lms.logAction('Course Template Created', `Published new course template blueprint "${created.name}" (${created.code})`, 'success');
      this.lms.showToast('Template published successfully.', 'success', 4500, 'Template Published');
    }

    this.isSubmitting.set(false);
    this.router.navigate(['/courses/templates']);
  }

  private buildTemplateObject(asDraft: boolean): any {
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

    return {
      name: (this.name() || 'Untitled Template').trim(),
      code: this.code().trim(),
      description: (this.description() || '').trim(),
      categoryTags: this.categoryTags(),
      scope: this.scope(),
      visibility: { mode: this.visibilityMode() },
      status: targetStatus,
      structure: structure
    };
  }

  // Cancel with Confirmation (like Create Plan)
  discardChanges() {
    this.modalService.confirmDiscard({
      title: 'Discard Template Wizard?',
      message: 'You have active changes in this course template builder. Would you like to save your progress as a draft to resume later?',
      draftText: 'Save as Draft & Exit',
      discardText: 'Discard & Exit',
      cancelText: 'Continue Editing',
      onDraft: () => {
        this.saveDraftInPlace();
        this.router.navigate(['/courses/templates']);
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

