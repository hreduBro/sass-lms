import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  Assessment,
  AssessmentType,
  AssessmentScoringMode,
  AssessmentQuestion,
  AssessmentQuestionOption,
  AssessmentScoringPolicy,
  MatchingPair
} from '../../../models/assessment.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';

export type AssessmentWizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-assessment-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CustomSelectComponent, StepperComponent],
  templateUrl: './assessment-create.component.html',
  styleUrls: ['./assessment-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssessmentCreateComponent implements OnInit {
  lmsService = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  // Stepper State
  currentStep = signal<AssessmentWizardStep>(1);
  completedSteps = signal<Set<number>>(new Set<number>());
  isEditMode = signal<boolean>(false);
  editingAssessmentId = signal<string | null>(null);

  // Reusable Stepper Configuration (Matching Organization Wizard)
  steps: StepperStep[] = [
    { id: 1, key: 'basic', title: 'Basic Information', shortTitle: 'Basic Info', sublabel: 'Identity & Instructor', icon: 'school' },
    { id: 2, key: 'questions', title: 'Question Studio', shortTitle: 'Question Studio', sublabel: 'Authored Items', icon: 'quiz' },
    { id: 3, key: 'scoring', title: 'Scoring & Rules', shortTitle: 'Scoring & Rules', sublabel: 'Pass Mark & Policies', icon: 'tune' },
    { id: 4, key: 'preview', title: 'Preview & Confirm', shortTitle: 'Preview', sublabel: 'Review & Publish', icon: 'preview' }
  ];

  // Alerts & Validation Messages
  formErrorAlert = signal<string | null>(null);
  successAlert = signal<string | null>(null);

  // Form Model State (Step 1)
  code = signal<string>(`ASM-${Math.floor(1000 + Math.random() * 9000)}`);
  title = signal<string>('');
  titleTouched = signal<boolean>(false);
  description = signal<string>('');
  type = signal<AssessmentType>('exam');
  scoringMode = signal<AssessmentScoringMode>('scored');
  categoryTagInput = signal<string>('');
  categoryTags = signal<string[]>(['General', 'Compliance']);
  sharingLevel = signal<'private' | 'lms' | 'org'>('lms');

  responsibleInstructorId = signal<string | undefined>(undefined);
  responsibleInstructorName = signal<string | undefined>(undefined);
  instructorTouched = signal<boolean>(false);

  // Questions State (Step 2)
  questions = signal<AssessmentQuestion[]>([]);
  activeQuestionIndex = signal<number | null>(0);
  questionsTouched = signal<boolean>(false);

  // Scoring Policy State (Step 3)
  passMarkPercent = signal<number>(60);
  negativeMarkingEnabled = signal<boolean>(false);
  negativePenalty = signal<number>(0.25);
  allowedAttempts = signal<number>(1);
  keepScoreRule = signal<'highest' | 'latest' | 'average' | 'first'>('highest');
  timeLimitMinutes = signal<number | null>(30);
  showScorePolicy = signal<'afterSubmit' | 'afterGrading' | 'afterWindowClose' | 'never'>('afterSubmit');
  showCorrectAnswers = signal<boolean>(true);
  showFeedback = signal<boolean>(true);

  // Dropdown Select Options
  typeOptions: SelectOption[] = [
    { value: 'exam', label: 'Formal Exam', sublabel: 'High-stakes examination with timed submission', icon: 'military_tech' },
    { value: 'quiz', label: 'Quick Quiz', sublabel: 'Knowledge verification check between phases', icon: 'quiz' },
    { value: 'assignment', label: 'Assignment / Task', sublabel: 'Practical project or file artifact evaluation', icon: 'assignment' },
    { value: 'survey', label: 'Feedback Survey', sublabel: 'Ungraded qualitative learner feedback questionnaire', icon: 'rate_review' },
    { value: 'diagnostic', label: 'Diagnostic Assessment', sublabel: 'Initial skill baseline evaluation test', icon: 'troubleshoot' }
  ];

  scoringModeOptions: SelectOption[] = [
    { value: 'scored', label: 'Point-Scored & Graded', sublabel: 'Calculate numeric marks with customizable pass percentage', icon: 'score' },
    { value: 'passFail', label: 'Pass / Fail Only', sublabel: 'Binary qualification outcome based on minimum benchmark', icon: 'rule' },
    { value: 'rubric', label: 'Rubric-Based Evaluation', sublabel: 'Multi-criteria qualitative rubric evaluation', icon: 'view_list' },
    { value: 'ungraded', label: 'Ungraded / Completion', sublabel: 'Participant completion tracking with no grade recorded', icon: 'check_circle' }
  ];

  sharingLevelOptions: SelectOption[] = [
    { value: 'lms', label: 'Active LMS Instance Only', sublabel: 'Visible only within the current workspace node', icon: 'lock' },
    { value: 'org', label: 'Organization-Wide Repository', sublabel: 'Shared across all LMS branches in this organization', icon: 'corporate_fare' },
    { value: 'private', label: 'Instructor Private Draft', sublabel: 'Restricted solely to authoring instructor', icon: 'person' }
  ];

  newQuestionTypeOptions: SelectOption[] = [
    { value: 'singleSelect', label: 'Single Choice (MCQ)', sublabel: 'One correct answer among choices', icon: 'radio_button_checked' },
    { value: 'multiSelect', label: 'Multiple Choice (Multi-Select)', sublabel: 'Multiple correct options with partial/full score', icon: 'check_box' },
    { value: 'trueFalse', label: 'True / False', sublabel: 'Binary conceptual verification statement', icon: 'toggle_on' },
    { value: 'matching', label: 'Matching Pairs', sublabel: 'Connect premises with corresponding definitions', icon: 'sync_alt' },
    { value: 'fillBlank', label: 'Fill in the Blank', sublabel: 'Keyword text matching in sentence blanks', icon: 'edit_note' },
    { value: 'ordering', label: 'Sequence Ordering', sublabel: 'Chronological or workflow step arrangement', icon: 'format_list_numbered' },
    { value: 'numeric', label: 'Numeric Target', sublabel: 'Numerical computation with optional tolerance range', icon: 'calculate' },
    { value: 'essay', label: 'Essay / Long Text (Manual)', sublabel: 'Free-form answer evaluated by responsible instructor', icon: 'article' },
    { value: 'fileUpload', label: 'File Upload / Artifact (Manual)', sublabel: 'Trainee uploads document or media artifact', icon: 'upload_file' }
  ];

  resultDisplayOptions: SelectOption[] = [
    { value: 'afterSubmit', label: 'Immediately After Submission', sublabel: 'Learners see their score and breakdown instantly', icon: 'speed' },
    { value: 'afterGrading', label: 'After Instructor Grading', sublabel: 'Results released once all manual essays are reviewed', icon: 'grading' },
    { value: 'afterWindowClose', label: 'After Assessment Window Closes', sublabel: 'Released to all examinees at the same time', icon: 'event_busy' },
    { value: 'never', label: 'Never Display to Learner', sublabel: 'Results retained only for administrator records', icon: 'visibility_off' }
  ];

  keepScoreOptions: SelectOption[] = [
    { value: 'highest', label: 'Keep Highest Score', sublabel: 'Best attempt across all tries is recorded', icon: 'star' },
    { value: 'latest', label: 'Keep Latest Attempt', sublabel: 'Most recent score replaces earlier scores', icon: 'history' },
    { value: 'average', label: 'Average Score', sublabel: 'Arithmetic mean of all completed attempts', icon: 'calculate' },
    { value: 'first', label: 'First Attempt Only', sublabel: 'Subsequent attempts are for practice only', icon: 'looks_one' }
  ];

  // Active Tenant & Instructors
  activeTenant = computed(() => this.lmsService.activeTenant());
  activeLms = computed(() => this.lmsService.activeLms());

  instructorOptions = computed<SelectOption[]>(() => {
    const list = this.lmsService.instructorsRepo();
    return list.map(inst => ({
      value: inst.id,
      label: inst.name,
      sublabel: `${inst.department || 'Academic'} • ${inst.email || 'Instructor'}`,
      icon: 'person'
    }));
  });

  totalMarks = computed<number>(() => {
    return this.questions().reduce((sum, q) => sum + (q.points || 0), 0);
  });

  hasManualQuestions = computed<boolean>(() => {
    return this.questions().some(q => q.manualGraded);
  });

  // Validation Checklist for Governance
  validationChecklist = computed(() => {
    const titleOk = this.title().trim().length >= 3;
    const questionsOk = this.questions().length > 0;
    const pointsOk = this.totalMarks() > 0;
    const manualGraded = this.hasManualQuestions();
    const instructorOk = !manualGraded || (!!this.responsibleInstructorId() && !!this.responsibleInstructorName());
    const passMarkOk = this.passMarkPercent() >= 0 && this.passMarkPercent() <= 100;

    const allQuestionsValid = this.questions().every((q, idx) => {
      const hasText = !!(q.text || q.prompt)?.trim();
      if (!hasText) return false;
      if (q.type === 'singleSelect' || q.type === 'multiSelect' || q.type === 'trueFalse') {
        const hasOptions = (q.options?.length || 0) >= 2;
        const hasCorrect = q.options?.some(o => o.correct || o.isCorrect);
        return hasOptions && hasCorrect;
      }
      return true;
    });

    const isValid = titleOk && questionsOk && pointsOk && instructorOk && passMarkOk && allQuestionsValid;

    return {
      titleOk,
      questionsOk,
      pointsOk,
      instructorOk,
      manualGraded,
      passMarkOk,
      allQuestionsValid,
      isValid
    };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editingAssessmentId.set(id);
      this.loadAssessmentData(id);
    } else {
      this.addSampleQuestion();
    }
    this.showStepAlert(1, 'entered');
  }

  loadAssessmentData(id: string): void {
    const asm = this.lmsService.assessments().find(a => a.assessmentId === id);
    if (!asm) return;

    this.code.set(asm.code);
    this.title.set(asm.title);
    this.description.set(asm.description || '');
    this.type.set(asm.type);
    this.scoringMode.set(asm.scoringMode);
    this.categoryTags.set(asm.categoryTags || ['General']);
    this.sharingLevel.set(asm.sharingLevel || 'lms');
    this.responsibleInstructorId.set(asm.responsibleInstructorId);
    this.responsibleInstructorName.set(asm.responsibleInstructorName);

    const version = asm.versions.find(v => v.versionId === asm.currentVersionId) || asm.versions[0];
    if (version) {
      this.questions.set(JSON.parse(JSON.stringify(version.questions)));
      const sp = version.scoringPolicy;
      if (sp) {
        this.passMarkPercent.set(sp.passMarkPercent);
        this.negativeMarkingEnabled.set(sp.negativeMarking.enabled);
        this.negativePenalty.set(sp.negativeMarking.penalty);
        this.allowedAttempts.set(sp.attempts.allowed);
        this.keepScoreRule.set(sp.attempts.keep);
        this.timeLimitMinutes.set(sp.timeLimitMinutes);
        this.showScorePolicy.set(sp.resultDisplay.showScore);
        this.showCorrectAnswers.set(sp.resultDisplay.showCorrect);
        this.showFeedback.set(sp.resultDisplay.showFeedback);
      }
    }
  }

  onInstructorChange(instId: string): void {
    const inst = this.lmsService.instructorsRepo().find(i => i.id === instId);
    if (inst) {
      this.responsibleInstructorId.set(inst.id);
      this.responsibleInstructorName.set(inst.name);
    } else {
      this.responsibleInstructorId.set(undefined);
      this.responsibleInstructorName.set(undefined);
    }
    this.instructorTouched.set(true);
  }

  // Category Tag handlers
  addCategoryTag(): void {
    const tag = this.categoryTagInput().trim();
    if (tag && !this.categoryTags().includes(tag)) {
      this.categoryTags.update(tags => [...tags, tag]);
      this.categoryTagInput.set('');
    }
  }

  removeCategoryTag(tag: string): void {
    this.categoryTags.update(tags => tags.filter(t => t !== tag));
  }

  // Question Management Methods
  addQuestion(type: any): void {
    const newId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const isManual = type === 'essay' || type === 'fileUpload' || type === 'text';

    const newQ: AssessmentQuestion = {
      questionId: newId,
      type,
      text: `Enter ${type} question instructions...`,
      prompt: `Enter ${type} question instructions...`,
      order: this.questions().length + 1,
      points: isManual ? 5 : 2,
      required: true,
      manualGraded: isManual,
      explanation: '',
      options:
        type === 'singleSelect' || type === 'multiSelect'
          ? [
              { optionId: `opt-${newId}-1`, text: 'Primary Option A', correct: true, isCorrect: true },
              { optionId: `opt-${newId}-2`, text: 'Alternative Option B', correct: false, isCorrect: false },
              { optionId: `opt-${newId}-3`, text: 'Alternative Option C', correct: false, isCorrect: false }
            ]
          : type === 'trueFalse'
          ? [
              { optionId: `opt-${newId}-t`, text: 'True', correct: true, isCorrect: true },
              { optionId: `opt-${newId}-f`, text: 'False', correct: false, isCorrect: false }
            ]
          : undefined,
      multiSelectScoring: type === 'multiSelect' ? 'allOrNothing' : undefined,
      numericTarget: type === 'numeric' ? 100 : undefined,
      numericTolerance: type === 'numeric' ? 0 : undefined,
      matchingPairs:
        type === 'matching'
          ? [
              { leftId: 'l1', leftText: 'Operational Concept A', rightId: 'r1', rightText: 'Protocol Definition 1', pairId: `mp-1`, leftItem: 'Operational Concept A', rightItem: 'Protocol Definition 1' },
              { leftId: 'l2', leftText: 'Operational Concept B', rightId: 'r2', rightText: 'Protocol Definition 2', pairId: `mp-2`, leftItem: 'Operational Concept B', rightItem: 'Protocol Definition 2' }
            ]
          : undefined,
      orderingItems: type === 'ordering' ? ['Phase 1: Discovery & Planning', 'Phase 2: Execution & Deployment', 'Phase 3: SOC-2 Audit Verification'] : undefined,
      acceptableBlanks: type === 'fillBlank' ? ['governance'] : undefined
    };

    this.questions.update(prev => [...prev, newQ]);
    this.activeQuestionIndex.set(this.questions().length - 1);
  }

  addSampleQuestion(): void {
    this.addQuestion('singleSelect');
  }

  deleteQuestion(index: number): void {
    this.questions.update(prev => prev.filter((_, i) => i !== index));
    if (this.activeQuestionIndex() === index) {
      this.activeQuestionIndex.set(Math.max(0, this.questions().length - 1));
    }
  }

  duplicateQuestion(index: number): void {
    const source = this.questions()[index];
    if (!source) return;

    const dup: AssessmentQuestion = JSON.parse(JSON.stringify(source));
    dup.questionId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    this.questions.update(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, dup);
      return copy;
    });
    this.activeQuestionIndex.set(index + 1);
  }

  moveQuestion(index: number, direction: 'up' | 'down'): void {
    const list = [...this.questions()];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    this.questions.set(list);
    this.activeQuestionIndex.set(targetIdx);
  }

  addOption(qIndex: number): void {
    const q = this.questions()[qIndex];
    if (!q || !q.options) return;

    const optId = `opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newOpt: AssessmentQuestionOption = {
      optionId: optId,
      text: `Option ${String.fromCharCode(65 + q.options.length)}`,
      correct: false,
      isCorrect: false
    };

    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          options: [...(item.options || []), newOpt]
        };
      })
    );
  }

  removeOption(qIndex: number, optIndex: number): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          options: (item.options || []).filter((_, oIdx) => oIdx !== optIndex)
        };
      })
    );
  }

  toggleSingleSelectCorrect(qIndex: number, selectedOptId: string): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          options: (item.options || []).map(opt => ({
            ...opt,
            correct: opt.optionId === selectedOptId,
            isCorrect: opt.optionId === selectedOptId
          }))
        };
      })
    );
  }

  toggleMultiSelectCorrect(qIndex: number, optId: string): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          options: (item.options || []).map(opt => {
            if (opt.optionId === optId) {
              const val = !opt.correct && !opt.isCorrect;
              return { ...opt, correct: val, isCorrect: val };
            }
            return opt;
          })
        };
      })
    );
  }

  addMatchingPair(qIndex: number): void {
    const pairId = `mp-${Date.now()}`;
    const newPair = { leftId: pairId, leftText: 'New Concept', rightId: pairId, rightText: 'Target Meaning', pairId, leftItem: 'New Concept', rightItem: 'Target Meaning' };
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          matchingPairs: [...(item.matchingPairs || []), newPair]
        };
      })
    );
  }

  removeMatchingPair(qIndex: number, pairIndex: number): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          matchingPairs: (item.matchingPairs || []).filter((_, pIdx) => pIdx !== pairIndex)
        };
      })
    );
  }

  updateQuestionPrompt(qIndex: number, text: string): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return { ...item, text, prompt: text };
      })
    );
  }

  updateQuestionPoints(qIndex: number, points: number): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return { ...item, points: Number(points) || 1 };
      })
    );
  }

  // Stepper & Wizard Navigation
  jumpToStep(step: number): void {
    if (step < 1 || step > 4) return;
    this.currentStep.set(step as AssessmentWizardStep);
    this.showStepAlert(step as AssessmentWizardStep, 'jump');
    this.scrollTop();
  }

  onNext(): void {
    this.formErrorAlert.set(null);
    const step = this.currentStep();

    if (step === 1) {
      this.titleTouched.set(true);
      this.instructorTouched.set(true);

      if (!this.title().trim()) {
        this.formErrorAlert.set('Assessment Title is required.');
        this.lmsService.showToast('Validation Error: Please specify an Assessment Title.', 'error', 4500, 'Step 1 Error', 'STEP 1 / 4');
        this.scrollToFirstError();
        return;
      }

      if (this.title().trim().length < 3) {
        this.formErrorAlert.set('Assessment Title must be at least 3 characters.');
        this.lmsService.showToast('Validation Error: Title is too short (min 3 chars).', 'error', 4500, 'Step 1 Error', 'STEP 1 / 4');
        this.scrollToFirstError();
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(1);
        return next;
      });

      this.currentStep.set(2);
      this.showStepAlert(2, 'completed');
      this.scrollTop();
    } else if (step === 2) {
      this.questionsTouched.set(true);

      if (this.questions().length === 0) {
        this.formErrorAlert.set('At least one question is required in the Question Studio.');
        this.lmsService.showToast('Validation Error: Please author at least 1 question.', 'error', 4500, 'Step 2 Error', 'STEP 2 / 4');
        this.scrollToFirstError();
        return;
      }

      // Check if any question has blank prompt
      const blankQ = this.questions().find(q => !q.text?.trim() && !q.prompt?.trim());
      if (blankQ) {
        this.formErrorAlert.set('All authored questions must include a question prompt/text.');
        this.lmsService.showToast('Validation Error: Question text cannot be empty.', 'error', 4500, 'Step 2 Error', 'STEP 2 / 4');
        this.scrollToFirstError();
        return;
      }

      // Check if multiple choice has correct answers
      const unkeyedMCQ = this.questions().find(q =>
        (q.type === 'singleSelect' || q.type === 'multiSelect' || q.type === 'trueFalse') &&
        !q.options?.some(o => o.correct || o.isCorrect)
      );
      if (unkeyedMCQ) {
        this.formErrorAlert.set('Multiple choice questions must have at least one correct answer selected.');
        this.lmsService.showToast('Validation Error: Select the correct answer for all choice questions.', 'error', 4500, 'Step 2 Error', 'STEP 2 / 4');
        this.scrollToFirstError();
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(2);
        return next;
      });

      this.currentStep.set(3);
      this.showStepAlert(3, 'completed');
      this.scrollTop();
    } else if (step === 3) {
      if (this.passMarkPercent() < 0 || this.passMarkPercent() > 100) {
        this.formErrorAlert.set('Pass mark must be between 0% and 100%.');
        this.lmsService.showToast('Validation Error: Invalid pass mark percentage.', 'error', 4500, 'Step 3 Error', 'STEP 3 / 4');
        this.scrollToFirstError();
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(3);
        return next;
      });

      this.currentStep.set(4);
      this.showStepAlert(4, 'completed');
      this.scrollTop();
    }
  }

  onPrev(): void {
    const step = this.currentStep();
    if (step > 1) {
      const prevStep = (step - 1) as AssessmentWizardStep;
      this.currentStep.set(prevStep);
      this.showStepAlert(prevStep, 'back');
      this.scrollTop();
    }
  }

  /**
   * Dispatches a prominent step alert mentioning the exact step number and description, matching Organization Create
   */
  private showStepAlert(step: AssessmentWizardStep, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<AssessmentWizardStep, string> = {
      1: 'Step 1 of 4: Basic Information',
      2: 'Step 2 of 4: Question Studio',
      3: 'Step 3 of 4: Scoring & Rules',
      4: 'Step 4 of 4: Preview & Governance'
    };

    const stepDescriptions: Record<AssessmentWizardStep, string> = {
      1: 'Step 1 of 4 — Basic Information: Enter title, code, category, assessment mode, and responsible instructor.',
      2: 'Step 2 of 4 — Question Studio: Author multiple choice, essay, programming, and true/false questions.',
      3: 'Step 3 of 4 — Scoring & Rules: Configure pass mark, negative marking, attempt limits, and result display.',
      4: 'Step 4 of 4 — Preview & Governance: Review quality gates, assessment parameters, and publish live.'
    };

    let title = stepTitles[step];
    let badge = `STEP ${step} / 4`;
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    let msg = stepDescriptions[step];
    if (action === 'completed') {
      const prev = (step - 1) as AssessmentWizardStep;
      const prevName = stepTitles[prev].split(': ')[1];
      const nextName = stepTitles[step].split(': ')[1];
      title = `Step ${prev} Completed Successfully`;
      badge = `STEP ${prev} COMPLETED`;
      msg = `Step ${prev} (${prevName}) saved. Now on Step ${step} of 4: ${nextName}.`;
      type = 'success';
    } else if (action === 'back') {
      msg = `Navigated back to Step ${step} of 4 (${stepTitles[step].split(': ')[1]}).`;
      type = 'info';
    } else if (action === 'jump') {
      msg = `Active: Step ${step} of 4 (${stepTitles[step].split(': ')[1]}).`;
      type = 'info';
    }

    this.lmsService.showToast(msg, type, 4000, title, badge);
  }

  onReset(step: number): void {
    if (step === 1) {
      this.title.set('');
      this.description.set('');
      this.type.set('exam');
      this.scoringMode.set('scored');
      this.responsibleInstructorId.set(undefined);
      this.responsibleInstructorName.set(undefined);
      this.categoryTags.set(['General']);
    } else if (step === 2) {
      this.questions.set([]);
      this.addSampleQuestion();
    } else if (step === 3) {
      this.passMarkPercent.set(60);
      this.negativeMarkingEnabled.set(false);
      this.negativePenalty.set(0.25);
      this.allowedAttempts.set(1);
      this.keepScoreRule.set('highest');
      this.timeLimitMinutes.set(30);
      this.showScorePolicy.set('afterSubmit');
    }
    this.lmsService.showToast(`Step ${step} parameters reset to default values.`, 'info', 3000, `Step ${step} Reset`);
  }

  onCancel(): void {
    this.router.navigate(['/assessments']);
  }

  onSaveAsDraft(): void {
    this.saveAsDraft();
  }

  saveAsDraft(): void {
    const scoringPolicy: AssessmentScoringPolicy = {
      totalMarks: this.totalMarks(),
      passMarkPercent: this.passMarkPercent(),
      negativeMarking: {
        enabled: this.negativeMarkingEnabled(),
        penalty: this.negativePenalty()
      },
      attempts: {
        allowed: this.allowedAttempts(),
        keep: this.keepScoreRule()
      },
      timeLimitMinutes: this.timeLimitMinutes(),
      availability: { opensAt: null, closesAt: null },
      resultDisplay: {
        showScore: this.showScorePolicy(),
        showCorrect: this.showCorrectAnswers(),
        showFeedback: this.showFeedback()
      }
    };

    if (this.isEditMode() && this.editingAssessmentId()) {
      const asmId = this.editingAssessmentId()!;
      this.lmsService.updateAssessment(asmId, {
        title: this.title() || 'Untitled Draft Assessment',
        description: this.description(),
        type: this.type(),
        scoringMode: this.scoringMode(),
        categoryTags: this.categoryTags(),
        sharingLevel: this.sharingLevel(),
        responsibleInstructorId: this.responsibleInstructorId(),
        responsibleInstructorName: this.responsibleInstructorName(),
        status: 'draft',
        versions: [
          {
            versionId: `asm-ver-${Date.now()}`,
            assessmentId: asmId,
            versionLabel: 'v1',
            state: 'draft',
            responseCount: 0,
            questions: this.questions(),
            scoringPolicy
          }
        ]
      });
      this.lmsService.showToast(`Assessment draft "${this.title() || this.code()}" saved successfully.`, 'success', 4500, 'Draft Saved', 'DRAFT');
    } else {
      this.lmsService.createAssessment({
        code: this.code(),
        title: this.title() || 'Untitled Draft Assessment',
        description: this.description(),
        type: this.type(),
        scoringMode: this.scoringMode(),
        categoryTags: this.categoryTags(),
        sharingLevel: this.sharingLevel(),
        responsibleInstructorId: this.responsibleInstructorId(),
        responsibleInstructorName: this.responsibleInstructorName(),
        status: 'draft',
        versions: [
          {
            versionId: `asm-ver-${Date.now()}`,
            assessmentId: '',
            versionLabel: 'v1',
            state: 'draft',
            responseCount: 0,
            questions: this.questions(),
            scoringPolicy
          }
        ]
      });
      this.lmsService.showToast(`New assessment draft created and saved to repository.`, 'success', 4500, 'Draft Saved', 'DRAFT');
    }

    this.router.navigate(['/assessments']);
  }

  publishNow(): void {
    if (!this.validationChecklist().isValid) {
      this.formErrorAlert.set('Cannot publish: Governance quality gates failed. Please review mandatory items.');
      this.lmsService.showToast('Publish Failed: Governance quality gates failed.', 'error', 5000, 'Publish Error');
      this.scrollToFirstError();
      return;
    }

    let targetId = this.editingAssessmentId();

    const scoringPolicy: AssessmentScoringPolicy = {
      totalMarks: this.totalMarks(),
      passMarkPercent: this.passMarkPercent(),
      negativeMarking: {
        enabled: this.negativeMarkingEnabled(),
        penalty: this.negativePenalty()
      },
      attempts: {
        allowed: this.allowedAttempts(),
        keep: this.keepScoreRule()
      },
      timeLimitMinutes: this.timeLimitMinutes(),
      availability: { opensAt: null, closesAt: null },
      resultDisplay: {
        showScore: this.showScorePolicy(),
        showCorrect: this.showCorrectAnswers(),
        showFeedback: this.showFeedback()
      }
    };

    if (this.isEditMode() && targetId) {
      this.lmsService.updateAssessment(targetId, {
        title: this.title(),
        description: this.description(),
        type: this.type(),
        scoringMode: this.scoringMode(),
        categoryTags: this.categoryTags(),
        sharingLevel: this.sharingLevel(),
        responsibleInstructorId: this.responsibleInstructorId(),
        responsibleInstructorName: this.responsibleInstructorName(),
        status: 'draft',
        versions: [
          {
            versionId: `asm-ver-${Date.now()}`,
            assessmentId: targetId,
            versionLabel: 'v1',
            state: 'draft',
            responseCount: 0,
            questions: this.questions(),
            scoringPolicy
          }
        ]
      });
    } else {
      const created = this.lmsService.createAssessment({
        code: this.code(),
        title: this.title(),
        description: this.description(),
        type: this.type(),
        scoringMode: this.scoringMode(),
        categoryTags: this.categoryTags(),
        sharingLevel: this.sharingLevel(),
        responsibleInstructorId: this.responsibleInstructorId(),
        responsibleInstructorName: this.responsibleInstructorName(),
        status: 'draft',
        versions: [
          {
            versionId: `asm-ver-${Date.now()}`,
            assessmentId: '',
            versionLabel: 'v1',
            state: 'draft',
            responseCount: 0,
            questions: this.questions(),
            scoringPolicy
          }
        ]
      });
      targetId = created.assessmentId;
    }

    const res = this.lmsService.publishAssessment(targetId, 'Published via Assessment Wizard');
    if (res.success) {
      this.lmsService.showToast(`Assessment "${this.title()}" is now published and live!`, 'success', 5000, 'Assessment Published', 'LIVE');
      this.router.navigate(['/assessments']);
    } else {
      this.formErrorAlert.set(res.message || 'Publish blocker encountered.');
      this.lmsService.showToast(res.message || 'Publish blocker encountered.', 'error', 5000, 'Publish Error');
    }
  }

  private scrollTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private scrollToFirstError(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const errorEl = document.querySelector(
        '#form-error-banner, input.ng-invalid, select.ng-invalid, textarea.ng-invalid, .border-rose-500, [data-error="true"], .text-rose-500:not(:empty)'
      );
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ((errorEl as HTMLElement).focus && typeof (errorEl as HTMLElement).focus === 'function') {
          (errorEl as HTMLElement).focus();
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  }
}
