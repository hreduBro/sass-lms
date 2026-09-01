import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  Assessment,
  AssessmentVersion,
  AssessmentQuestion,
  AssessmentAttempt,
  LearnerQuestionAnswer
} from '../../../models/assessment.model';

@Component({
  selector: 'app-assessment-runtime',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assessment-runtime.component.html',
  styleUrls: ['./assessment-runtime.component.css']
})
export class AssessmentRuntimeComponent implements OnInit, OnDestroy {
  lmsService = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  assessment = signal<Assessment | null>(null);
  currentVersion = signal<AssessmentVersion | null>(null);

  // Runtime Taker State
  currentQuestionIndex = signal<number>(0);
  userAnswers = signal<Record<string, any>>({}); // questionId -> answer value
  flaggedQuestions = signal<Set<string>>(new Set<string>());

  // File upload simulation per question
  uploadedFiles = signal<Record<string, { fileName: string; fileSize: string; fileUrl: string }>>({});

  // Timer state
  remainingSeconds = signal<number | null>(null);
  timerInterval: any = null;

  // View state
  isSubmitted = signal<boolean>(false);
  submissionAttempt = signal<AssessmentAttempt | null>(null);
  showConfirmSubmitModal = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const asm = this.lmsService.assessments().find(a => a.assessmentId === id);
      if (asm) {
        this.assessment.set(asm);
        const ver = asm.versions.find(v => v.versionId === asm.currentVersionId) || asm.versions[0];
        this.currentVersion.set(ver);

        // Start timer if time limit exists
        if (ver?.scoringPolicy?.timeLimitMinutes) {
          this.remainingSeconds.set(ver.scoringPolicy.timeLimitMinutes * 60);
          this.startTimer();
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      const current = this.remainingSeconds();
      if (current !== null && current > 0) {
        this.remainingSeconds.set(current - 1);
      } else if (current === 0) {
        clearInterval(this.timerInterval);
        this.forceSubmitTimerExpired();
      }
    }, 1000);
  }

  formatTime(seconds: number | null): string {
    if (seconds === null) return 'Untimed';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Answer Setters
  setSingleSelectAnswer(questionId: string, optionId: string): void {
    this.userAnswers.update(answers => ({ ...answers, [questionId]: optionId }));
  }

  toggleMultiSelectAnswer(questionId: string, optionId: string): void {
    const current = (this.userAnswers()[questionId] as string[]) || [];
    const updated = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    this.userAnswers.update(answers => ({ ...answers, [questionId]: updated }));
  }

  isOptionSelected(questionId: string, optionId: string): boolean {
    const ans = this.userAnswers()[questionId];
    if (Array.isArray(ans)) {
      return ans.includes(optionId);
    }
    return ans === optionId;
  }

  setTextAnswer(questionId: string, value: string): void {
    this.userAnswers.update(answers => ({ ...answers, [questionId]: value }));
  }

  setMatchingAnswer(questionId: string, pairId: string, matchValue: string): void {
    const current = (this.userAnswers()[questionId] as Record<string, string>) || {};
    const updated = { ...current, [pairId]: matchValue };
    this.userAnswers.update(answers => ({ ...answers, [questionId]: updated }));
  }

  // Flag for review
  toggleFlag(questionId: string): void {
    const set = new Set(this.flaggedQuestions());
    if (set.has(questionId)) {
      set.delete(questionId);
    } else {
      set.add(questionId);
    }
    this.flaggedQuestions.set(set);
  }

  isFlagged(questionId: string): boolean {
    return this.flaggedQuestions().has(questionId);
  }

  // File Upload simulation
  simulateFileUpload(event: any, questionId: string): void {
    const file = event.target?.files?.[0];
    if (file) {
      const mockFile = {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        fileUrl: '#'
      };
      this.uploadedFiles.update(prev => ({ ...prev, [questionId]: mockFile }));
      this.userAnswers.update(answers => ({ ...answers, [questionId]: mockFile.fileName }));
    }
  }

  // Progress Calculation
  currentQuestion = computed<AssessmentQuestion | undefined>(() => {
    return this.currentVersion()?.questions[this.currentQuestionIndex()];
  });

  totalQuestions = computed<number>(() => {
    return this.currentVersion()?.questions.length || 0;
  });

  answeredCount = computed<number>(() => {
    const answers = this.userAnswers();
    return Object.keys(answers).filter(k => {
      const val = answers[k];
      return val !== undefined && val !== '' && (Array.isArray(val) ? val.length > 0 : true);
    }).length;
  });

  progressPercent = computed<number>(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round((this.answeredCount() / total) * 100);
  });

  // Question Navigation
  nextQuestion(): void {
    if (this.currentQuestionIndex() < this.totalQuestions() - 1) {
      this.currentQuestionIndex.update(i => i + 1);
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(i => i - 1);
    }
  }

  jumpToQuestion(index: number): void {
    this.currentQuestionIndex.set(index);
  }

  // Submission Logic
  onSubmitClick(): void {
    this.showConfirmSubmitModal.set(true);
  }

  forceSubmitTimerExpired(): void {
    this.executeSubmission();
  }

  executeSubmission(): void {
    this.showConfirmSubmitModal.set(false);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const asm = this.assessment();
    const ver = this.currentVersion();
    if (!asm || !ver) return;

    // Convert userAnswers map into LearnerQuestionAnswer[]
    const answersList: LearnerQuestionAnswer[] = ver.questions.map(q => {
      const rawVal = this.userAnswers()[q.questionId];
      let selectedOptionIds: string[] | undefined;
      let selectedOptionId: string | undefined;
      let textResponse: string | undefined;
      let numericResponse: number | undefined;
      let matchingSelections: Record<string, string> | undefined;

      if (q.type === 'singleSelect' || q.type === 'trueFalse') {
        selectedOptionId = rawVal;
      } else if (q.type === 'multiSelect') {
        selectedOptionIds = Array.isArray(rawVal) ? rawVal : [];
      } else if (q.type === 'numeric') {
        numericResponse = rawVal !== undefined && rawVal !== '' ? Number(rawVal) : undefined;
      } else if (q.type === 'matching') {
        matchingSelections = rawVal || {};
      } else if (q.type === 'essay' || q.type === 'fileUpload' || q.type === 'fillBlank' || q.type === 'ordering' || q.type === 'text') {
        textResponse = typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal);
      }

      return {
        questionId: q.questionId,
        selectedOptionId,
        selectedOptionIds,
        textResponse,
        numericResponse,
        matchingSelections,
        earnedPoints: 0 // Will be calculated by submission service
      };
    });

    const attempt = this.lmsService.submitAssessmentAttempt({
      assessmentId: asm.assessmentId,
      assessmentVersionId: ver.versionId,
      traineeId: 'usr-brac-1',
      traineeName: 'Farhana Ahmed',
      traineeEmail: 'farhana.ahmed@brac.net',
      attemptNumber: 1,
      answers: answersList,
      timeTakenSeconds: ver.scoringPolicy?.timeLimitMinutes ? ver.scoringPolicy.timeLimitMinutes * 60 - (this.remainingSeconds() || 0) : 180
    });

    this.submissionAttempt.set(attempt);
    this.isSubmitted.set(true);
  }
}
