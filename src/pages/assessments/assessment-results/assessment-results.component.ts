import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  AssessmentAttempt,
  Assessment,
  AssessmentVersion
} from '../../../models/assessment.model';

@Component({
  selector: 'app-assessment-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assessment-results.component.html',
  styleUrls: ['./assessment-results.component.css']
})
export class AssessmentResultsComponent implements OnInit {
  lmsService = inject(LmsDataService);
  route = inject(ActivatedRoute);

  searchQuery = signal<string>('');
  selectedAssessmentFilter = signal<string>('all');
  selectedPassFilter = signal<string>('all'); // 'all', 'passed', 'failed'
  selectedGradingFilter = signal<string>('all'); // 'all', 'pending', 'graded', 'notRequired'
  isAnonymized = signal<boolean>(false);

  // Manual Grading Drawer / Modal State
  selectedAttemptForGrading = signal<AssessmentAttempt | null>(null);
  showGradingModal = signal<boolean>(false);

  // Manual grading draft scores: questionId -> { points: number, feedback: string }
  manualGradeDrafts = signal<Record<string, { points: number; feedback: string }>>({});

  ngOnInit(): void {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (attemptId) {
      const att = this.lmsService.assessmentAttempts().find(a => a.attemptId === attemptId);
      if (att) {
        this.openGradingModal(att);
      }
    }
  }

  // Assessments dropdown options
  assessments = computed(() => {
    return this.lmsService.assessments();
  });

  // Filtered Attempts List
  filteredAttempts = computed<AssessmentAttempt[]>(() => {
    let list = [...this.lmsService.assessmentAttempts()];
    const q = this.searchQuery().trim().toLowerCase();
    const asmId = this.selectedAssessmentFilter();
    const passFilter = this.selectedPassFilter();
    const gradeFilter = this.selectedGradingFilter();

    if (q) {
      list = list.filter(att => {
        const asm = this.assessments().find(a => a.assessmentId === att.assessmentId);
        return (
          att.traineeName.toLowerCase().includes(q) ||
          att.traineeEmail.toLowerCase().includes(q) ||
          (asm && asm.title.toLowerCase().includes(q)) ||
          (asm && asm.code.toLowerCase().includes(q))
        );
      });
    }

    if (asmId !== 'all') {
      list = list.filter(att => att.assessmentId === asmId);
    }

    if (passFilter !== 'all') {
      list = list.filter(att => (passFilter === 'passed' ? att.passed : !att.passed));
    }

    if (gradeFilter !== 'all') {
      list = list.filter(att => att.manualGradingStatus === gradeFilter);
    }

    // Sort: latest submission first
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  });

  // KPI Metrics
  kpis = computed(() => {
    const list = this.lmsService.assessmentAttempts();
    const total = list.length;
    const passed = list.filter(a => a.passed).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const pendingGrading = list.filter(a => a.manualGradingStatus === 'pending').length;
    const avgScore =
      total > 0
        ? Math.round(list.reduce((sum, a) => sum + a.percentage, 0) / total)
        : 0;

    return {
      total,
      passed,
      passRate,
      pendingGrading,
      avgScore
    };
  });

  // Helpers
  getAssessmentTitle(asmId: string): string {
    const asm = this.assessments().find(a => a.assessmentId === asmId);
    return asm ? asm.title : 'Assessment';
  }

  getAssessmentCode(asmId: string): string {
    const asm = this.assessments().find(a => a.assessmentId === asmId);
    return asm ? asm.code : 'ASM';
  }

  getTraineeDisplayName(att: AssessmentAttempt): string {
    if (this.isAnonymized()) {
      return `Learner #${att.traineeId.replace(/[^0-9]/g, '').slice(-4) || '102'}`;
    }
    return att.traineeName;
  }

  getTraineeDisplayEmail(att: AssessmentAttempt): string {
    if (this.isAnonymized()) {
      return 'anonymized@privacy.local';
    }
    return att.traineeEmail;
  }

  getAnswerForQuestion(att: AssessmentAttempt, questionId: string) {
    return att.answers.find(a => a.questionId === questionId);
  }

  // Open Grading Drawer
  openGradingModal(att: AssessmentAttempt): void {
    this.selectedAttemptForGrading.set(att);
    const drafts: Record<string, { points: number; feedback: string }> = {};

    att.answers.forEach(ans => {
      drafts[ans.questionId] = {
        points: ans.earnedPoints || 0,
        feedback: ans.instructorFeedback || ''
      };
    });

    this.manualGradeDrafts.set(drafts);
    this.showGradingModal.set(true);
  }

  closeGradingModal(): void {
    this.showGradingModal.set(false);
    this.selectedAttemptForGrading.set(null);
  }

  getAttemptQuestions(att: AssessmentAttempt) {
    const asm = this.assessments().find(a => a.assessmentId === att.assessmentId);
    const ver = asm?.versions.find(v => v.versionId === att.assessmentVersionId);
    return ver?.questions || [];
  }

  updateDraftPoint(questionId: string, points: number): void {
    this.manualGradeDrafts.update(drafts => ({
      ...drafts,
      [questionId]: {
        ...drafts[questionId],
        points
      }
    }));
  }

  updateDraftFeedback(questionId: string, feedback: string): void {
    this.manualGradeDrafts.update(drafts => ({
      ...drafts,
      [questionId]: {
        ...drafts[questionId],
        feedback
      }
    }));
  }

  saveManualGrades(): void {
    const att = this.selectedAttemptForGrading();
    if (!att) return;

    const drafts = this.manualGradeDrafts();
    const scores = Object.keys(drafts).map(qId => ({
      questionId: qId,
      earnedPoints: drafts[qId].points,
      feedback: drafts[qId].feedback
    }));

    this.lmsService.gradeManualAssessmentAttempt(att.attemptId, scores, 'Farhana Ahmed');
    this.closeGradingModal();
  }

  exportResultsCsv(): void {
    const list = this.filteredAttempts();
    const headers = ['Attempt ID', 'Trainee Name', 'Trainee Email', 'Assessment Code', 'Score', 'Max Score', 'Percentage', 'Passed', 'Grading Status', 'Submitted At'];
    const rows = list.map(a => [
      a.attemptId,
      this.getTraineeDisplayName(a),
      this.getTraineeDisplayEmail(a),
      this.getAssessmentCode(a.assessmentId),
      a.totalScore,
      a.maxScore,
      `${a.percentage}%`,
      a.passed ? 'PASSED' : 'FAILED',
      a.manualGradingStatus,
      a.submittedAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assessment-results-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
