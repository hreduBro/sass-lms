import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  Assessment,
  AssessmentAttempt,
  AssessmentAttemptAnswer,
  AssessmentQuestion
} from '../../../models/assessment.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';

export type AssessmentSortField = 'date' | 'score' | 'percentage' | 'trainee' | 'assessment';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-assessment-results',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CustomSelectComponent,
    CustomAvatarComponent
  ],
  templateUrl: './assessment-results.component.html',
  styleUrls: ['./assessment-results.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssessmentResultsComponent implements OnInit {
  private dataService = inject(LmsDataService);
  private router = inject(Router);

  // Global Context Signals
  activeTenant = this.dataService.activeTenant;
  activeLms = this.dataService.activeLms;
  assessments = this.dataService.assessments;
  rawAttempts = this.dataService.assessmentAttempts;

  // View Layout Mode ('grid' | 'table')
  viewMode = signal<'grid' | 'table'>('grid');

  // Search & Basic Query
  searchQuery = signal<string>('');

  // Primary Sorting
  sortBy = signal<AssessmentSortField>('date');
  sortDirection = signal<SortDirection>('desc');

  // Filter Drawer Open State
  showFilterDrawer = signal<boolean>(false);

  // Filter Criteria State
  selectedAssessmentId = signal<string>('all');
  selectedPassStatuses = signal<string[]>(['passed', 'failed']);
  selectedGradingStatuses = signal<string[]>(['pending', 'graded', 'notRequired']);
  selectedScoreBracket = signal<string>('all'); // 'all', '90+', '75-89', '60-74', 'below60'
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');

  // Privacy / FERPA Anonymization Mode
  isAnonymized = signal<boolean>(false);

  // Pagination / Load More
  pageSize = signal<number>(12);
  displayLimit = signal<number>(12);

  // Floating Action Menu State
  showActionMenu = signal<boolean>(false);
  activeActionAttempt = signal<AssessmentAttempt | null>(null);
  actionMenuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Inspection / Detail Modal State
  inspectAttempt = signal<AssessmentAttempt | null>(null);

  // Manual Grading Modal State
  gradingAttempt = signal<AssessmentAttempt | null>(null);
  gradingQuestions = signal<{ question: AssessmentQuestion; answer?: AssessmentAttemptAnswer; awardedPoints: number; feedback: string }[]>([]);

  // Retake / Reset Modal State
  resetModalAttempt = signal<AssessmentAttempt | null>(null);

  // Sort Options for Custom Select
  sortOptions: SelectOption[] = [
    { value: 'date_desc', label: 'Submission Date: Newest First' },
    { value: 'date_asc', label: 'Submission Date: Oldest First' },
    { value: 'score_desc', label: 'Score: Highest First' },
    { value: 'score_asc', label: 'Score: Lowest First' },
    { value: 'trainee_asc', label: 'Trainee Name: A to Z' },
    { value: 'trainee_desc', label: 'Trainee Name: Z to A' },
    { value: 'assessment_asc', label: 'Assessment Instrument: A to Z' }
  ];

  selectedSortValue = signal<string>('date_desc');

  // Assessment Instrument Options
  assessmentOptions = computed<SelectOption[]>(() => {
    const list = this.assessments();
    const options: SelectOption[] = [{ value: 'all', label: 'All Assessment Instruments' }];
    list.forEach(a => {
      options.push({
        value: a.assessmentId,
        label: `${a.title} (${a.code})`
      });
    });
    return options;
  });

  // Score Bracket Options
  scoreBracketOptions: SelectOption[] = [
    { value: 'all', label: 'All Score Ranges (0% – 100%)' },
    { value: '90+', label: 'Mastery: 90% – 100%' },
    { value: '75-89', label: 'Proficient: 75% – 89%' },
    { value: '60-74', label: 'Passing / Baseline: 60% – 74%' },
    { value: 'below60', label: 'Needs Remediation: Below 60%' }
  ];

  // Quick KPI Metric Computations
  kpiStats = computed(() => {
    const attempts = this.rawAttempts();
    const total = attempts.length;

    if (total === 0) {
      return {
        totalAttempts: 0,
        uniqueTrainees: 0,
        passRate: 0,
        passedCount: 0,
        failedCount: 0,
        avgPercentage: 0,
        pendingGradingCount: 0,
        gradedCount: 0,
        autoScoredCount: 0
      };
    }

    const passedAttempts = attempts.filter(a => a.passed);
    const failedAttempts = attempts.filter(a => !a.passed);
    const passedCount = passedAttempts.length;
    const failedCount = failedAttempts.length;
    const passRate = Math.round((passedCount / total) * 100);

    const totalPercentageSum = attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const avgPercentage = Math.round(totalPercentageSum / total);

    const pendingGradingCount = attempts.filter(a => a.manualGradingStatus === 'pending').length;
    const gradedCount = attempts.filter(a => a.manualGradingStatus === 'graded').length;
    const autoScoredCount = attempts.filter(a => a.manualGradingStatus === 'notRequired').length;

    const uniqueTraineesSet = new Set(attempts.map(a => a.traineeId || a.traineeEmail));
    const uniqueTrainees = uniqueTraineesSet.size;

    return {
      totalAttempts: total,
      uniqueTrainees,
      passRate,
      passedCount,
      failedCount,
      avgPercentage,
      pendingGradingCount,
      gradedCount,
      autoScoredCount
    };
  });

  // Active Filter Count Badge
  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.selectedAssessmentId() !== 'all') count++;
    if (this.selectedPassStatuses().length < 2) count++;
    if (this.selectedGradingStatuses().length < 3) count++;
    if (this.selectedScoreBracket() !== 'all') count++;
    if (this.filterDateFrom()) count++;
    if (this.filterDateTo()) count++;
    if (this.searchQuery().trim()) count++;
    return count;
  });

  // Primary Filtered & Sorted Attempts Collection
  filteredAttempts = computed(() => {
    let list = [...this.rawAttempts()];
    const query = this.searchQuery().toLowerCase().trim();
    const assessmentFilter = this.selectedAssessmentId();
    const passStatuses = this.selectedPassStatuses();
    const gradingStatuses = this.selectedGradingStatuses();
    const scoreBracket = this.selectedScoreBracket();
    const dateFrom = this.filterDateFrom();
    const dateTo = this.filterDateTo();

    // 1. Text Search Filter (trainee name, email, assessment title, code, attempt ID)
    if (query) {
      list = list.filter(att => {
        const assessment = this.getAssessmentForAttempt(att);
        const nameMatch = att.traineeName?.toLowerCase().includes(query) || false;
        const emailMatch = att.traineeEmail?.toLowerCase().includes(query) || false;
        const attemptIdMatch = att.attemptId?.toLowerCase().includes(query) || false;
        const traineeIdMatch = att.traineeId?.toLowerCase().includes(query) || false;
        const assessmentTitleMatch = assessment?.title?.toLowerCase().includes(query) || false;
        const assessmentCodeMatch = assessment?.code?.toLowerCase().includes(query) || false;

        return nameMatch || emailMatch || attemptIdMatch || traineeIdMatch || assessmentTitleMatch || assessmentCodeMatch;
      });
    }

    // 2. Assessment Instrument Filter
    if (assessmentFilter !== 'all') {
      list = list.filter(att => att.assessmentId === assessmentFilter);
    }

    // 3. Pass/Fail Status Filter
    if (passStatuses.length > 0 && passStatuses.length < 2) {
      if (passStatuses.includes('passed')) {
        list = list.filter(att => att.passed);
      } else if (passStatuses.includes('failed')) {
        list = list.filter(att => !att.passed);
      }
    } else if (passStatuses.length === 0) {
      return [];
    }

    // 4. Manual Grading Status Filter
    if (gradingStatuses.length < 3) {
      list = list.filter(att => {
        const status = att.manualGradingStatus || 'notRequired';
        return gradingStatuses.includes(status);
      });
    }

    // 5. Score Bracket Filter
    if (scoreBracket !== 'all') {
      list = list.filter(att => {
        const pct = att.percentage || 0;
        switch (scoreBracket) {
          case '90+':
            return pct >= 90;
          case '75-89':
            return pct >= 75 && pct < 90;
          case '60-74':
            return pct >= 60 && pct < 75;
          case 'below60':
            return pct < 60;
          default:
            return true;
        }
      });
    }

    // 6. Date Range Filter (submittedAt format DD/MM/YYYY or similar)
    if (dateFrom || dateTo) {
      list = list.filter(att => {
        if (!att.submittedAt) return true;
        const attemptDate = this.parseDateString(att.submittedAt);
        if (!attemptDate) return true;

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (attemptDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (attemptDate > to) return false;
        }
        return true;
      });
    }

    // 7. Sort
    const sortVal = this.selectedSortValue();
    const [field, dir] = sortVal.split('_') as [AssessmentSortField, SortDirection];

    list.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'date': {
          const dateA = this.parseDateString(a.submittedAt)?.getTime() || 0;
          const dateB = this.parseDateString(b.submittedAt)?.getTime() || 0;
          comparison = dateA - dateB;
          break;
        }
        case 'score':
        case 'percentage': {
          comparison = (a.percentage || 0) - (b.percentage || 0);
          break;
        }
        case 'trainee': {
          const nameA = (a.traineeName || '').toLowerCase();
          const nameB = (b.traineeName || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'assessment': {
          const asmA = this.getAssessmentForAttempt(a)?.title || '';
          const asmB = this.getAssessmentForAttempt(b)?.title || '';
          comparison = asmA.localeCompare(asmB);
          break;
        }
      }

      return dir === 'desc' ? -comparison : comparison;
    });

    return list;
  });

  // Displayed / Paginated Attempts
  paginatedAttempts = computed(() => {
    return this.filteredAttempts().slice(0, this.displayLimit());
  });

  // Remaining count for load more
  remainingAttemptsCount = computed(() => {
    return Math.max(0, this.filteredAttempts().length - this.displayLimit());
  });

  ngOnInit(): void {}

  // Parse custom date strings DD/MM/YYYY or DD:MM:YYYY
  parseDateString(dateStr: string): Date | null {
    if (!dateStr) return null;
    const cleanStr = dateStr.split(' ')[0];
    const parts = cleanStr.split(/[\/\-\:]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  // Get associated Assessment for an attempt
  getAssessmentForAttempt(attempt: AssessmentAttempt): Assessment | undefined {
    return this.assessments().find(a => a.assessmentId === attempt.assessmentId);
  }

  // Format Duration
  formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return 'Untimed / Instant';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  }

  // Display Name respecting privacy mode
  getDisplayName(attempt: AssessmentAttempt): string {
    if (this.isAnonymized()) {
      const hash = Math.abs(this.hashCode(attempt.traineeId || attempt.traineeName || 'trainee'));
      return `Trainee #${hash.toString().padStart(4, '0').slice(-4)}`;
    }
    return attempt.traineeName || 'Unnamed Trainee';
  }

  // Display Email respecting privacy mode
  getDisplayEmail(attempt: AssessmentAttempt): string {
    if (this.isAnonymized()) {
      const hash = Math.abs(this.hashCode(attempt.traineeId || attempt.traineeName || 'trainee'));
      return `trainee.${hash.toString().slice(-4)}@protected.internal`;
    }
    return attempt.traineeEmail || 'No Email';
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  // View Mode Toggling
  setViewMode(mode: 'grid' | 'table') {
    this.viewMode.set(mode);
  }

  // Privacy Mode Toggling
  togglePrivacyMode() {
    const nextState = !this.isAnonymized();
    this.isAnonymized.set(nextState);
    this.dataService.showToast(
      nextState
        ? 'FERPA / HIPAA Privacy Anonymization enabled: Trainee PII is masked.'
        : 'Privacy Anonymization disabled: Full trainee identities restored.',
      'info',
      3000,
      nextState ? 'Privacy Mode Active' : 'Identities Visible'
    );
  }

  // Sort Change Handler
  onSortChange(value: string | number) {
    this.selectedSortValue.set(String(value));
  }

  // Filter Drawer Toggle
  toggleFilterDrawer() {
    this.showFilterDrawer.update(v => !v);
  }

  // Toggle Pass Status Selection in Filter Drawer
  togglePassStatus(status: 'passed' | 'failed') {
    this.selectedPassStatuses.update(current => {
      if (current.includes(status)) {
        return current.filter(s => s !== status);
      } else {
        return [...current, status];
      }
    });
  }

  // Toggle Grading Status Selection in Filter Drawer
  toggleGradingStatus(status: 'pending' | 'graded' | 'notRequired') {
    this.selectedGradingStatuses.update(current => {
      if (current.includes(status)) {
        return current.filter(s => s !== status);
      } else {
        return [...current, status];
      }
    });
  }

  // Reset All Filters
  resetAllFilters() {
    this.searchQuery.set('');
    this.selectedAssessmentId.set('all');
    this.selectedPassStatuses.set(['passed', 'failed']);
    this.selectedGradingStatuses.set(['pending', 'graded', 'notRequired']);
    this.selectedScoreBracket.set('all');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.displayLimit.set(12);
    this.dataService.showToast('All filter criteria have been reset.', 'info', 2500, 'Filters Cleared');
  }

  // Remove individual filter chip
  removeFilterChip(chipType: string) {
    switch (chipType) {
      case 'search':
        this.searchQuery.set('');
        break;
      case 'assessment':
        this.selectedAssessmentId.set('all');
        break;
      case 'pass':
        this.selectedPassStatuses.set(['passed', 'failed']);
        break;
      case 'grading':
        this.selectedGradingStatuses.set(['pending', 'graded', 'notRequired']);
        break;
      case 'score':
        this.selectedScoreBracket.set('all');
        break;
      case 'date':
        this.filterDateFrom.set('');
        this.filterDateTo.set('');
        break;
    }
  }

  // Load More Handler
  loadMoreAttempts() {
    this.displayLimit.update(curr => curr + this.pageSize());
  }

  // Floating Action Menu Controls
  openActionMenu(event: MouseEvent, attempt: AssessmentAttempt) {
    event.stopPropagation();
    event.preventDefault();

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const menuWidth = 240;
    const menuHeight = 260;

    let left = rect.left - menuWidth + rect.width;
    let top = rect.bottom + 6;

    if (left < 10) left = 10;
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 6;
    }

    this.actionMenuPosition.set({ top, left });
    this.activeActionAttempt.set(attempt);
    this.showActionMenu.set(true);
  }

  closeActionMenu() {
    this.showActionMenu.set(false);
    this.activeActionAttempt.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showActionMenu()) {
      this.closeActionMenu();
    }
  }

  // Quick Action Handlers
  openInspectionModal(attempt: AssessmentAttempt) {
    this.closeActionMenu();
    this.inspectAttempt.set(attempt);
  }

  closeInspectionModal() {
    this.inspectAttempt.set(null);
  }

  openGradingModal(attempt: AssessmentAttempt) {
    this.closeActionMenu();
    const assessment = this.getAssessmentForAttempt(attempt);
    const version = assessment?.versions.find(v => v.versionId === attempt.assessmentVersionId) || assessment?.versions[0];

    if (!version) {
      this.dataService.showToast('Assessment blueprint version could not be loaded.', 'error', 3500, 'Error Loading');
      return;
    }

    // Map questions with answers
    const gradingItems = version.questions.map(q => {
      const answer = attempt.answers?.find(a => a.questionId === q.questionId);
      const awardedPoints = answer?.earnedPoints !== undefined ? answer.earnedPoints : (q.type === 'essay' || q.type === 'text' ? 0 : (answer?.isCorrect ? q.points : 0));
      const feedback = answer?.instructorFeedback || '';
      return {
        question: q,
        answer,
        awardedPoints,
        feedback
      };
    });

    this.gradingQuestions.set(gradingItems);
    this.gradingAttempt.set(attempt);
  }

  closeGradingModal() {
    this.gradingAttempt.set(null);
    this.gradingQuestions.set([]);
  }

  // Live scoring calculations inside grading modal
  get modalLiveTotalScore(): number {
    return this.gradingQuestions().reduce((sum, item) => sum + (Number(item.awardedPoints) || 0), 0);
  }

  get modalLiveMaxScore(): number {
    return this.gradingQuestions().reduce((sum, item) => sum + (item.question.points || 0), 0);
  }

  get modalLivePercentage(): number {
    const max = this.modalLiveMaxScore;
    if (max <= 0) return 0;
    return Math.round((this.modalLiveTotalScore / max) * 100);
  }

  get modalLivePassed(): boolean {
    const asm = this.gradingAttempt() ? this.getAssessmentForAttempt(this.gradingAttempt()!) : undefined;
    const version = asm?.versions.find(v => v.versionId === this.gradingAttempt()?.assessmentVersionId) || asm?.versions[0];
    const passingPct = version?.scoringPolicy?.passMarkPercent ?? 70;
    return this.modalLivePercentage >= passingPct;
  }

  updateQuestionScore(index: number, points: number) {
    const items = [...this.gradingQuestions()];
    if (items[index]) {
      const maxPts = items[index].question.points;
      const clampedPoints = Math.max(0, Math.min(maxPts, Number(points) || 0));
      items[index].awardedPoints = clampedPoints;
      this.gradingQuestions.set(items);
    }
  }

  updateQuestionFeedback(index: number, feedback: string) {
    const items = [...this.gradingQuestions()];
    if (items[index]) {
      items[index].feedback = feedback;
      this.gradingQuestions.set(items);
    }
  }

  // Save manual grades
  submitManualGrades() {
    const attempt = this.gradingAttempt();
    if (!attempt) return;

    const currentUser = this.dataService.activeUser();
    const scores = this.gradingQuestions().map(item => ({
      questionId: item.question.questionId,
      earnedPoints: item.awardedPoints,
      feedback: item.feedback
    }));

    this.dataService.gradeManualAssessmentAttempt(
      attempt.attemptId,
      scores,
      currentUser.name || 'Instructor'
    );

    this.dataService.showToast(
      `Manual grades finalized for ${this.getDisplayName(attempt)}. Final score: ${this.modalLiveTotalScore}/${this.modalLiveMaxScore} (${this.modalLivePercentage}% - ${this.modalLivePassed ? 'PASSED' : 'FAILED'}).`,
      'success',
      4500,
      'Grading Complete',
      'GRADED'
    );

    this.closeGradingModal();
  }

  // Retake / Reset Dialog
  openResetModal(attempt: AssessmentAttempt) {
    this.closeActionMenu();
    this.resetModalAttempt.set(attempt);
  }

  closeResetModal() {
    this.resetModalAttempt.set(null);
  }

  confirmResetAttempt() {
    const attempt = this.resetModalAttempt();
    if (!attempt) return;

    // Reset attempt: remove from assessmentAttempts or flag for retake
    this.dataService.assessmentAttempts.update(list => list.filter(a => a.attemptId !== attempt.attemptId));
    this.dataService.showToast(
      `Attempt #${attempt.attemptNumber} for ${this.getDisplayName(attempt)} has been reset. Learner may re-take the instrument.`,
      'info',
      4000,
      'Attempt Reset',
      'RE-TAKE ALLOWED'
    );

    this.closeResetModal();
  }

  // Download Attempt Report / Certificate
  downloadAttemptReport(attempt: AssessmentAttempt) {
    this.closeActionMenu();
    const assessment = this.getAssessmentForAttempt(attempt);
    const lmsName = this.activeLms().basicInfo?.lmsName || this.activeLms().id;
    const reportText = `
================================================================================
                    LMS ASSESSMENT ATTEMPT TELEMETRY REPORT
================================================================================
Assessment Instrument: ${assessment?.title || 'Unknown'} (${assessment?.code || 'N/A'})
Attempt ID:           ${attempt.attemptId}
Attempt Number:       ${attempt.attemptNumber}
Trainee Name:         ${this.getDisplayName(attempt)}
Trainee Email:        ${this.getDisplayEmail(attempt)}
Trainee ID:           ${attempt.traineeId || 'N/A'}
Organization:         ${this.activeTenant().name} (ID: ${this.activeTenant().numericId || this.activeTenant().id})
LMS Instance:         ${lmsName}
Submitted At:         ${attempt.submittedAt}
Time Elapsed:         ${this.formatDuration(attempt.timeTakenSeconds)}
--------------------------------------------------------------------------------
EVALUATION RESULTS:
Total Score:          ${attempt.totalScore} / ${attempt.maxScore} points
Percentage:           ${attempt.percentage}%
Outcome:              ${attempt.passed ? 'PASSED (QUALIFIED)' : 'FAILED (REMEDIATION REQUIRED)'}
Grading Type:         ${attempt.manualGradingStatus === 'graded' ? 'Instructor Graded' : attempt.manualGradingStatus === 'pending' ? 'Pending Review' : 'Auto-Evaluated'}
${attempt.gradedBy ? `Graded By:            ${attempt.gradedBy}` : ''}
${attempt.gradedAt ? `Graded At:            ${attempt.gradedAt}` : ''}
--------------------------------------------------------------------------------
SUMMARY BREAKDOWN:
Auto-Scored Points:   ${attempt.autoScore} pts
Manual Points:        ${attempt.manualScore} pts
Total Evaluated:      ${attempt.answers?.length || 0} Questions
================================================================================
Generated on ${new Date().toLocaleString()} by OneLMS Assessment Engine.
`;

    if (typeof window !== 'undefined') {
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Assessment_Report_${attempt.attemptId}_${attempt.traineeName.replace(/\s+/g, '_')}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    this.dataService.showToast(
      `Downloaded telemetry report for ${this.getDisplayName(attempt)}.`,
      'success',
      3000,
      'Report Exported'
    );
  }

  // Export Results to CSV
  exportResultsCsv() {
    const attempts = this.filteredAttempts();
    if (attempts.length === 0) {
      this.dataService.showToast('No assessment records match the current criteria to export.', 'warning', 3000, 'Export Empty');
      return;
    }

    const headers = [
      'Attempt ID',
      'Assessment Code',
      'Assessment Title',
      'Assessment Version',
      'Attempt #',
      'Trainee Name',
      'Trainee Email',
      'Trainee ID',
      'Organization Name',
      'Auto Score',
      'Manual Score',
      'Total Score',
      'Max Score',
      'Percentage',
      'Passed (Outcome)',
      'Grading Status',
      'Graded By',
      'Graded At',
      'Time Spent (Sec)',
      'Submission Timestamp'
    ];

    const rows = attempts.map(att => {
      const asm = this.getAssessmentForAttempt(att);
      return [
        `"${att.attemptId}"`,
        `"${asm?.code || ''}"`,
        `"${(asm?.title || '').replace(/"/g, '""')}"`,
        `"${att.versionLabel || 'v1'}"`,
        `"${att.attemptNumber}"`,
        `"${this.getDisplayName(att).replace(/"/g, '""')}"`,
        `"${this.getDisplayEmail(att).replace(/"/g, '""')}"`,
        `"${att.traineeId || ''}"`,
        `"${this.activeTenant().name.replace(/"/g, '""')}"`,
        `"${att.autoScore ?? 0}"`,
        `"${att.manualScore ?? 0}"`,
        `"${att.totalScore ?? 0}"`,
        `"${att.maxScore ?? 0}"`,
        `"${att.percentage ?? 0}%"`,
        `"${att.passed ? 'PASSED' : 'FAILED'}"`,
        `"${att.manualGradingStatus || 'notRequired'}"`,
        `"${(att.gradedBy || '').replace(/"/g, '""')}"`,
        `"${att.gradedAt || ''}"`,
        `"${att.timeTakenSeconds || 0}"`,
        `"${att.submittedAt || ''}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.dataService.downloadCsv(csvContent, `Assessment_Results_${this.activeTenant().name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    this.dataService.showToast(
      `Exported ${attempts.length} assessment attempt records to CSV.`,
      'success',
      3500,
      'CSV Export Complete'
    );
  }

  // Quick navigation to Create Assessment
  navigateToCreateAssessment() {
    this.router.navigate(['/assessments/create']);
  }
}
