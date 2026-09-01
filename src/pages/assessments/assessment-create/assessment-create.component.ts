import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-assessment-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assessment-create.component.html',
  styleUrls: ['./assessment-create.component.css']
})
export class AssessmentCreateComponent implements OnInit {
  lmsService = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  currentStep = signal<number>(1); // 1: Details, 2: Questions, 3: Scoring, 4: Review
  isEditMode = signal<boolean>(false);
  editingAssessmentId = signal<string | null>(null);

  // Form Model State
  code = signal<string>(`ASM-${Math.floor(1000 + Math.random() * 9000)}`);
  title = signal<string>('');
  description = signal<string>('');
  type = signal<AssessmentType>('exam');
  scoringMode = signal<AssessmentScoringMode>('scored');
  categoryTagInput = signal<string>('');
  categoryTags = signal<string[]>(['General', 'Compliance']);
  sharingLevel = signal<'private' | 'lms' | 'org'>('lms');

  responsibleInstructorId = signal<string | undefined>(undefined);
  responsibleInstructorName = signal<string | undefined>(undefined);

  questions = signal<AssessmentQuestion[]>([]);

  // Scoring Policy State
  passMarkPercent = signal<number>(60);
  negativeMarkingEnabled = signal<boolean>(false);
  negativePenalty = signal<number>(0.25);
  allowedAttempts = signal<number>(1);
  keepScoreRule = signal<'highest' | 'latest' | 'average' | 'first'>('highest');
  timeLimitMinutes = signal<number | null>(30);
  showScorePolicy = signal<'afterSubmit' | 'afterGrading' | 'afterWindowClose' | 'never'>('afterSubmit');
  showCorrectAnswers = signal<boolean>(true);
  showFeedback = signal<boolean>(true);

  // Currently Editing Question Modal or Drawer State
  activeQuestionIndex = signal<number | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editingAssessmentId.set(id);
      this.loadAssessmentData(id);
    } else {
      // Add a default sample question
      this.addSampleQuestion();
    }
  }

  loadAssessmentData(id: string): void {
    const asm = this.lmsService.assessments().find(a => a.assessmentId === id);
    if (!asm) return;

    this.code.set(asm.code);
    this.title.set(asm.title);
    this.description.set(asm.description || '');
    this.type.set(asm.type);
    this.scoringMode.set(asm.scoringMode);
    this.categoryTags.set(asm.categoryTags || []);
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

  // Instructors list for responsible instructor assignment
  instructors = computed(() => {
    return this.lmsService.instructorsRepo();
  });

  onSelectInstructor(instId: string): void {
    const inst = this.instructors().find(i => i.id === instId);
    if (inst) {
      this.responsibleInstructorId.set(inst.id);
      this.responsibleInstructorName.set(inst.name);
    } else {
      this.responsibleInstructorId.set(undefined);
      this.responsibleInstructorName.set(undefined);
    }
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

  // Computed Totals
  totalMarks = computed<number>(() => {
    return this.questions().reduce((sum, q) => sum + (q.points || 0), 0);
  });

  hasManualQuestions = computed<boolean>(() => {
    return this.questions().some(q => q.manualGraded);
  });

  // Pre-publish Validation Checklist (§6.4 & §8)
  validationChecklist = computed(() => {
    const titleOk = this.title().trim().length > 0;
    const questionsOk = this.questions().length > 0;
    const pointsOk = this.totalMarks() > 0;
    const manualGraded = this.hasManualQuestions();

    // Mandatory Instructor Rule (§8): If manual questions exist, responsible instructor MUST be specified!
    const instructorOk = !manualGraded || (!!this.responsibleInstructorId() && !!this.responsibleInstructorName());

    const isValid = titleOk && questionsOk && pointsOk && instructorOk;

    return {
      titleOk,
      questionsOk,
      pointsOk,
      instructorOk,
      manualGraded,
      isValid
    };
  });

  // Question Management Methods
  addQuestion(
    type:
      | 'singleSelect'
      | 'multiSelect'
      | 'trueFalse'
      | 'numeric'
      | 'matching'
      | 'ordering'
      | 'fillBlank'
      | 'fileUpload'
      | 'essay'
      | 'text'
  ): void {
    const newId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const isManual = type === 'essay' || type === 'fileUpload' || type === 'text';

    const newQ: AssessmentQuestion = {
      questionId: newId,
      type,
      text: `New ${type} question prompt...`,
      prompt: `New ${type} question prompt...`,
      order: this.questions().length + 1,
      points: isManual ? 5 : 2,
      required: true,
      manualGraded: isManual,
      explanation: '',
      options:
        type === 'singleSelect' || type === 'multiSelect'
          ? [
              { optionId: `opt-${newId}-1`, text: 'Option A', correct: true, isCorrect: true },
              { optionId: `opt-${newId}-2`, text: 'Option B', correct: false, isCorrect: false },
              { optionId: `opt-${newId}-3`, text: 'Option C', correct: false, isCorrect: false }
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
              { leftId: 'l1', leftText: 'Premise A', rightId: 'r1', rightText: 'Target 1', pairId: `mp-1`, leftItem: 'Premise A', rightItem: 'Target 1' },
              { leftId: 'l2', leftText: 'Premise B', rightId: 'r2', rightText: 'Target 2', pairId: `mp-2`, leftItem: 'Premise B', rightItem: 'Target 2' }
            ]
          : undefined,
      orderingItems: type === 'ordering' ? ['Step 1: Initiation', 'Step 2: Execution', 'Step 3: Verification'] : undefined,
      acceptableBlanks: type === 'fillBlank' ? ['compliance'] : undefined
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
      this.activeQuestionIndex.set(null);
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

  // Question Option Helpers
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

  // Matching pairs helpers
  addMatchingPair(qIndex: number): void {
    const pairId = `mp-${Date.now()}`;
    const newPair = { leftId: pairId, leftText: 'Item', rightId: pairId, rightText: 'Match', pairId, leftItem: 'Item', rightItem: 'Match' };
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

  // Navigation Wizards
  nextStep(): void {
    if (this.currentStep() < 4) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  goToStep(step: number): void {
    this.currentStep.set(step);
  }

  // Save / Publish Actions
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
            assessmentId: asmId,
            versionLabel: 'v1',
            state: 'draft',
            responseCount: 0,
            questions: this.questions(),
            scoringPolicy
          }
        ]
      });
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
    }

    this.router.navigate(['/assessments']);
  }

  publishNow(): void {
    if (!this.validationChecklist().isValid) {
      return;
    }

    // Save state first then publish
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

    const res = this.lmsService.publishAssessment(targetId, 'Initial publication via wizard');
    if (res.success) {
      this.router.navigate(['/assessments']);
    }
  }
}
