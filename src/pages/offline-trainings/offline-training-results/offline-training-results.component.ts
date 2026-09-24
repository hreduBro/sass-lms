import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineTraineeResult } from '../../../models/offline-training.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { ModalOverlayComponent } from '../../../components/modal-overlay/modal-overlay.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';
import { DateRangeFilterComponent } from '../../../components/data-grid/date-range-filter.component';

export interface GradebookFilters {
  status: string[]; // 'passed' | 'failed' | 'distinction' | 'merit' | 'critical'
  attendanceTier: string; // 'all' | '100' | '80plus' | '50plus' | 'under50'
  scoreTier: string; // 'all' | 'distinction' | 'proficient' | 'passing' | 'failing' | 'unmarked'
  dateFrom: string | null;
  dateTo: string | null;
  sortBy: string; // 'name-asc' | 'name-desc' | 'score-desc' | 'score-asc' | 'attendance-desc'
}

@Component({
  selector: 'app-offline-training-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomSelectComponent,
    ModalOverlayComponent,
    FilterSectionComponent,
    DateRangeFilterComponent
  ],
  templateUrl: './offline-training-results.component.html'
})
export class OfflineTrainingResultsComponent implements OnInit {
  lmsData = inject(LmsDataService);

  trainings = computed(() => this.lmsData.offlineTrainings());
  selectedTrainingId = signal<string>('');

  selectedTraining = computed<OfflineTraining | undefined>(() => {
    return this.trainings().find(t => t.trainingId === this.selectedTrainingId());
  });

  // Embeddings / Cohorts for selected training
  cohorts = computed(() => {
    const id = this.selectedTrainingId();
    if (!id) return [];
    return this.lmsData.offlineTrainingEmbeddings().filter(e => e.offlineTrainingId === id);
  });
  selectedEmbeddingId = signal<string>('all');
  searchQuery = signal<string>('');

  // Expandable Filter Panel state
  isFilterOpen = signal<boolean>(false);

  // Filter State (Draft vs Applied)
  appliedFilters = signal<GradebookFilters>({
    status: [],
    attendanceTier: 'all',
    scoreTier: 'all',
    dateFrom: null,
    dateTo: null,
    sortBy: 'name-asc'
  });

  draftFilters = signal<GradebookFilters>({
    status: [],
    attendanceTier: 'all',
    scoreTier: 'all',
    dateFrom: null,
    dateTo: null,
    sortBy: 'name-asc'
  });

  // Select Options for Workshop & Cohorts
  trainingOptions = computed<SelectOption[]>(() => {
    return this.trainings().map(t => ({
      label: `${t.title} (${t.code})`,
      value: t.trainingId || t.id,
      sublabel: `${t.category || 'Workshop'} • ${t.durationHours || 0} hrs`
    }));
  });

  cohortOptions = computed<SelectOption[]>(() => {
    return [
      { label: 'All Cohorts & Embeddings', value: 'all' },
      ...this.cohorts().map(c => ({
        label: `${c.hostEntityTitle || c.hostTitle} (${c.hostType.toUpperCase()})`,
        value: c.embeddingId,
        sublabel: `Trainer: ${c.effectiveTrainerName || 'Lead Trainer'}`
      }))
    ];
  });

  readonly attendanceTierOptions: SelectOption[] = [
    { label: 'All Attendance Rates', value: 'all' },
    { label: 'Full Attendance (100%)', value: '100' },
    { label: 'High Attendance (≥ 80%)', value: '80plus' },
    { label: 'Compliant Attendance (≥ 50%)', value: '50plus' },
    { label: 'Critical Attendance (< 50%)', value: 'under50' }
  ];

  readonly scoreTierOptions: SelectOption[] = [
    { label: 'All Practical Scores', value: 'all' },
    { label: 'Distinction (≥ 85 / 100)', value: 'distinction' },
    { label: 'Proficient (70 - 84 / 100)', value: 'proficient' },
    { label: 'Passing (50 - 69 / 100)', value: 'passing' },
    { label: 'Failing (< 50 / 100)', value: 'failing' },
    { label: 'Unmarked / Blank (0 / 100)', value: 'unmarked' }
  ];

  readonly sortByOptions: SelectOption[] = [
    { label: 'Trainee Name (A - Z)', value: 'name-asc' },
    { label: 'Trainee Name (Z - A)', value: 'name-desc' },
    { label: 'Overall Score (Highest First)', value: 'score-desc' },
    { label: 'Overall Score (Lowest First)', value: 'score-asc' },
    { label: 'Attendance (Highest First)', value: 'attendance-desc' }
  ];

  readonly statusOptionList = [
    {
      key: 'passed',
      label: 'Passed',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dotClass: 'bg-emerald-500'
    },
    {
      key: 'failed',
      label: 'Failed',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dotClass: 'bg-rose-500'
    },
    {
      key: 'distinction',
      label: 'Distinction (≥85%)',
      badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      dotClass: 'bg-indigo-500'
    },
    {
      key: 'merit',
      label: 'Merit (70–84%)',
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      dotClass: 'bg-blue-500'
    },
    {
      key: 'critical',
      label: 'Needs Review (<50%)',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dotClass: 'bg-amber-500'
    }
  ];

  getStatusCount(key: string): number {
    const tId = this.selectedTrainingId();
    if (!tId) return 0;
    let list = this.lmsData.offlineTraineeResults().filter(r => r.offlineTrainingId === tId);
    if (this.selectedEmbeddingId() !== 'all') {
      list = list.filter(r => r.embeddingId === this.selectedEmbeddingId());
    }

    return list.filter(r => {
      const liveStatus = this.getLiveStatus(r);
      const overall = this.getLiveOverallScore(r);
      if (key === 'passed') return liveStatus === 'passed';
      if (key === 'failed') return liveStatus === 'failed';
      if (key === 'distinction') return overall >= 85;
      if (key === 'merit') return overall >= 70 && overall < 85;
      if (key === 'critical') return overall < 50;
      return false;
    }).length;
  }

  // Batch Actions Draft State
  draftBatchAttn100 = signal<boolean>(false);
  draftBatchFillPass = signal<boolean>(false);

  toggleBatchAttendance(checked: boolean): void {
    this.draftBatchAttn100.set(checked);
  }

  toggleBatchPassMarks(checked: boolean): void {
    this.draftBatchFillPass.set(checked);
  }

  // Local editable rows
  editableMarks = signal<Record<string, { marks: number; attendance: number; remarks: string; isDirty?: boolean }>>({});
  saveSuccessAlert = signal<string | null>(null);

  // Modal State
  selectedTraineeForModal = signal<OfflineTraineeResult | null>(null);
  showDetailModal = signal(false);

  // Active filter count computation
  activeFilterCount = computed(() => {
    const f = this.appliedFilters();
    let count = 0;
    if (f.status.length > 0) count += f.status.length;
    if (f.attendanceTier !== 'all') count++;
    if (f.scoreTier !== 'all') count++;
    if (f.dateFrom || f.dateTo) count++;
    if (f.sortBy !== 'name-asc') count++;
    return count;
  });

  hasActiveFilters = computed(() => this.activeFilterCount() > 0 || !!this.searchQuery().trim());

  // Trainee results with active filters, search, and sorting
  results = computed<OfflineTraineeResult[]>(() => {
    const tId = this.selectedTrainingId();
    if (!tId) return this.lmsData.offlineTraineeResults();
    let list = this.lmsData.offlineTraineeResults().filter(r => r.offlineTrainingId === tId);
    
    // Cohort / Batch filter
    if (this.selectedEmbeddingId() !== 'all') {
      list = list.filter(r => r.embeddingId === this.selectedEmbeddingId());
    }

    // Search query filter
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(r =>
        r.traineeName.toLowerCase().includes(q) ||
        r.traineeEmail.toLowerCase().includes(q) ||
        r.traineeId.toLowerCase().includes(q)
      );
    }

    const filters = this.appliedFilters();

    // 1. Status Multi-select Filter
    if (filters.status.length > 0) {
      list = list.filter(r => {
        const liveStatus = this.getLiveStatus(r);
        const overall = this.getLiveOverallScore(r);

        return filters.status.some(st => {
          if (st === 'passed') return liveStatus === 'passed';
          if (st === 'failed') return liveStatus === 'failed';
          if (st === 'distinction') return overall >= 85;
          if (st === 'merit') return overall >= 70 && overall < 85;
          if (st === 'critical') return overall < 50;
          return false;
        });
      });
    }

    // 2. Attendance Tier Filter
    if (filters.attendanceTier !== 'all') {
      list = list.filter(r => {
        const att = this.getLiveAttendance(r);
        if (filters.attendanceTier === '100') return att === 100;
        if (filters.attendanceTier === '80plus') return att >= 80;
        if (filters.attendanceTier === '50plus') return att >= 50;
        if (filters.attendanceTier === 'under50') return att < 50;
        return true;
      });
    }

    // 3. Practical Score Tier Filter
    if (filters.scoreTier !== 'all') {
      list = list.filter(r => {
        const score = this.getLiveMarks(r);
        if (filters.scoreTier === 'distinction') return score >= 85;
        if (filters.scoreTier === 'proficient') return score >= 70 && score < 85;
        if (filters.scoreTier === 'passing') return score >= 50 && score < 70;
        if (filters.scoreTier === 'failing') return score > 0 && score < 50;
        if (filters.scoreTier === 'unmarked') return score === 0;
        return true;
      });
    }

    // 4. Date Range Filter
    if (filters.dateFrom) {
      const from = this.parseDate(filters.dateFrom);
      if (from) {
        list = list.filter(r => {
          const rawDate = r.updatedAt || r.attendance?.markedAt || r.manualMarks?.[0]?.enteredAt;
          const itemDate = rawDate ? new Date(rawDate).getTime() : 0;
          return itemDate >= from.getTime();
        });
      }
    }
    if (filters.dateTo) {
      const to = this.parseDate(filters.dateTo);
      if (to) {
        to.setHours(23, 59, 59, 999);
        list = list.filter(r => {
          const rawDate = r.updatedAt || r.attendance?.markedAt || r.manualMarks?.[0]?.enteredAt;
          const itemDate = rawDate ? new Date(rawDate).getTime() : 0;
          return itemDate <= to.getTime();
        });
      }
    }

    // 5. Sorting Order
    const sorted = [...list];
    switch (filters.sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.traineeName.localeCompare(b.traineeName));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.traineeName.localeCompare(a.traineeName));
        break;
      case 'score-desc':
        sorted.sort((a, b) => this.getLiveOverallScore(b) - this.getLiveOverallScore(a));
        break;
      case 'score-asc':
        sorted.sort((a, b) => this.getLiveOverallScore(a) - this.getLiveOverallScore(b));
        break;
      case 'attendance-desc':
        sorted.sort((a, b) => this.getLiveAttendance(b) - this.getLiveAttendance(a));
        break;
    }

    return sorted;
  });

  ngOnInit(): void {
    if (this.trainings().length > 0) {
      this.selectedTrainingId.set(this.trainings()[0].trainingId);
      this.syncEditableState();
    }
  }

  // --- Filter Drawer Controls ---
  toggleFilter(): void {
    const nextState = !this.isFilterOpen();
    this.isFilterOpen.set(nextState);
    if (nextState) {
      // Sync draft with currently applied
      this.draftFilters.set({ ...this.appliedFilters() });
      this.draftBatchAttn100.set(false);
      this.draftBatchFillPass.set(false);
    }
  }

  closeFilter(): void {
    this.isFilterOpen.set(false);
    this.draftFilters.set({ ...this.appliedFilters() });
    this.draftBatchAttn100.set(false);
    this.draftBatchFillPass.set(false);
  }

  applyFilter(): void {
    this.appliedFilters.set({ ...this.draftFilters() });

    // Execute pending batch actions on apply
    if (this.draftBatchAttn100()) {
      this.markAllAttendance(100);
    }
    if (this.draftBatchFillPass()) {
      this.markAllPassingMarks(75);
    }

    this.draftBatchAttn100.set(false);
    this.draftBatchFillPass.set(false);
    this.isFilterOpen.set(false);
  }

  clearFilterDraft(): void {
    this.draftFilters.set({
      status: [],
      attendanceTier: 'all',
      scoreTier: 'all',
      dateFrom: null,
      dateTo: null,
      sortBy: 'name-asc'
    });
    this.draftBatchAttn100.set(false);
    this.draftBatchFillPass.set(false);
  }

  resetAllFilters(): void {
    this.searchQuery.set('');
    this.appliedFilters.set({
      status: [],
      attendanceTier: 'all',
      scoreTier: 'all',
      dateFrom: null,
      dateTo: null,
      sortBy: 'name-asc'
    });
    this.draftFilters.set({
      status: [],
      attendanceTier: 'all',
      scoreTier: 'all',
      dateFrom: null,
      dateTo: null,
      sortBy: 'name-asc'
    });
    this.draftBatchAttn100.set(false);
    this.draftBatchFillPass.set(false);
    this.selectedEmbeddingId.set('all');
  }

  toggleDraftStatus(key: string): void {
    this.draftFilters.update(f => {
      const has = f.status.includes(key);
      const next = has ? f.status.filter(s => s !== key) : [...f.status, key];
      return { ...f, status: next };
    });
  }

  removeStatusFilter(key: string): void {
    this.appliedFilters.update(f => ({
      ...f,
      status: f.status.filter(s => s !== key)
    }));
    this.draftFilters.update(f => ({
      ...f,
      status: f.status.filter(s => s !== key)
    }));
  }

  removeAttendanceFilter(): void {
    this.appliedFilters.update(f => ({ ...f, attendanceTier: 'all' }));
    this.draftFilters.update(f => ({ ...f, attendanceTier: 'all' }));
  }

  removeScoreFilter(): void {
    this.appliedFilters.update(f => ({ ...f, scoreTier: 'all' }));
    this.draftFilters.update(f => ({ ...f, scoreTier: 'all' }));
  }

  removeDateFilter(): void {
    this.appliedFilters.update(f => ({ ...f, dateFrom: null, dateTo: null }));
    this.draftFilters.update(f => ({ ...f, dateFrom: null, dateTo: null }));
  }

  removeSortFilter(): void {
    this.appliedFilters.update(f => ({ ...f, sortBy: 'name-asc' }));
    this.draftFilters.update(f => ({ ...f, sortBy: 'name-asc' }));
  }

  onTrainingChange(id: string): void {
    this.selectedTrainingId.set(id);
    this.selectedEmbeddingId.set('all');
    this.syncEditableState();
  }

  onCohortChange(id: string): void {
    this.selectedEmbeddingId.set(id);
    this.syncEditableState();
  }

  syncEditableState(): void {
    const map: Record<string, { marks: number; attendance: number; remarks: string; isDirty?: boolean }> = {};
    this.results().forEach(r => {
      map[r.resultId] = {
        marks: r.manualMarkScore ?? 0,
        attendance: r.attendancePercentage ?? 0,
        remarks: r.instructorRemarks || '',
        isDirty: false
      };
    });
    this.editableMarks.set(map);
  }

  getLiveMarks(r: OfflineTraineeResult): number {
    const edit = this.editableMarks()[r.resultId];
    if (edit && edit.marks !== undefined) return edit.marks;
    return r.manualMarkScore ?? 0;
  }

  getLiveAttendance(r: OfflineTraineeResult): number {
    const edit = this.editableMarks()[r.resultId];
    if (edit && edit.attendance !== undefined) return edit.attendance;
    return r.attendancePercentage ?? 0;
  }

  getLiveRemarks(r: OfflineTraineeResult): string {
    const edit = this.editableMarks()[r.resultId];
    if (edit && edit.remarks !== undefined) return edit.remarks;
    return r.instructorRemarks || '';
  }

  getLiveOverallScore(r: OfflineTraineeResult): number {
    const marks = this.getLiveMarks(r);
    const attendance = this.getLiveAttendance(r);
    // Weighted scoring: 80% practical assessment + 20% attendance
    const overall = Math.round((marks * 0.8) + (attendance * 0.2));
    return isNaN(overall) ? 0 : Math.min(100, Math.max(0, overall));
  }

  getLiveStatus(r: OfflineTraineeResult): 'passed' | 'failed' {
    const marks = this.getLiveMarks(r);
    const attendance = this.getLiveAttendance(r);
    const isPass = marks >= 50 && attendance >= 50;
    return isPass ? 'passed' : 'failed';
  }

  getGradeLetter(score: number): { grade: string; badgeClass: string } {
    if (score >= 90) return { grade: 'A+', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    if (score >= 80) return { grade: 'A', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    if (score >= 70) return { grade: 'B', badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    if (score >= 60) return { grade: 'C', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    if (score >= 50) return { grade: 'D', badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800' };
    return { grade: 'F', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
  }

  isRowDirty(r: OfflineTraineeResult): boolean {
    return !!this.editableMarks()[r.resultId]?.isDirty;
  }

  updateMark(resultId: string, val: number): void {
    const clamped = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
    this.editableMarks.update(curr => ({
      ...curr,
      [resultId]: {
        ...curr[resultId],
        marks: clamped,
        isDirty: true
      }
    }));
  }

  updateAttendance(resultId: string, val: number): void {
    const clamped = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
    this.editableMarks.update(curr => ({
      ...curr,
      [resultId]: {
        ...curr[resultId],
        attendance: clamped,
        isDirty: true
      }
    }));
  }

  updateRemarks(resultId: string, val: string): void {
    this.editableMarks.update(curr => ({
      ...curr,
      [resultId]: {
        ...curr[resultId],
        remarks: val,
        isDirty: true
      }
    }));
  }

  applyQuickRemark(resultId: string, remark: string): void {
    this.updateRemarks(resultId, remark);
  }

  // Bulk Actions
  markAllAttendance(val: number): void {
    this.editableMarks.update(curr => {
      const updated = { ...curr };
      this.results().forEach(r => {
        updated[r.resultId] = {
          ...updated[r.resultId],
          attendance: val,
          isDirty: true
        };
      });
      return updated;
    });
    this.saveSuccessAlert.set(`Set attendance to ${val}% for all ${this.results().length} trainees.`);
    setTimeout(() => this.saveSuccessAlert.set(null), 3000);
  }

  markAllPassingMarks(defaultScore: number = 75): void {
    this.editableMarks.update(curr => {
      const updated = { ...curr };
      this.results().forEach(r => {
        const current = updated[r.resultId]?.marks ?? 0;
        if (current === 0) {
          updated[r.resultId] = {
            ...updated[r.resultId],
            marks: defaultScore,
            isDirty: true
          };
        }
      });
      return updated;
    });
    this.saveSuccessAlert.set(`Filled zero scores with ${defaultScore} marks for evaluation.`);
    setTimeout(() => this.saveSuccessAlert.set(null), 3000);
  }

  saveRow(result: OfflineTraineeResult): void {
    const edit = this.editableMarks()[result.resultId || `${result.traineeId}-${result.embeddingId}`];
    if (!edit) return;

    this.lmsData.saveOfflineManualMarks(result.embeddingId, result.traineeId, 'manual:Practical Exam', edit.marks, 100, edit.remarks);
    this.lmsData.saveOfflineAttendance(result.embeddingId, result.traineeId, edit.attendance >= 50 ? 'present' : 'absent', edit.remarks);

    this.editableMarks.update(curr => ({
      ...curr,
      [result.resultId]: {
        ...curr[result.resultId],
        isDirty: false
      }
    }));

    this.saveSuccessAlert.set(`Saved grades and feedback for ${result.traineeName}`);
    setTimeout(() => this.saveSuccessAlert.set(null), 3000);
  }

  saveAll(): void {
    this.results().forEach(r => {
      const edit = this.editableMarks()[r.resultId || `${r.traineeId}-${r.embeddingId}`];
      if (edit) {
        this.lmsData.saveOfflineManualMarks(r.embeddingId, r.traineeId, 'manual:Practical Exam', edit.marks, 100, edit.remarks);
        this.lmsData.saveOfflineAttendance(r.embeddingId, r.traineeId, edit.attendance >= 50 ? 'present' : 'absent', edit.remarks);
      }
    });

    this.editableMarks.update(curr => {
      const reset = { ...curr };
      Object.keys(reset).forEach(k => {
        reset[k] = { ...reset[k], isDirty: false };
      });
      return reset;
    });

    this.saveSuccessAlert.set(`All ${this.results().length} trainee grade records saved successfully.`);
    setTimeout(() => this.saveSuccessAlert.set(null), 3500);
  }

  exportGradebookCsv(): void {
    const headers = ['Trainee Name', 'Email', 'Trainee ID', 'Attendance %', 'Practical Marks (0-100)', 'Overall Score %', 'Status', 'Remarks'];
    const rows = this.results().map(r => [
      `"${r.traineeName}"`,
      `"${r.traineeEmail}"`,
      `"${r.traineeId}"`,
      this.getLiveAttendance(r),
      this.getLiveMarks(r),
      this.getLiveOverallScore(r),
      this.getLiveStatus(r).toUpperCase(),
      `"${(this.getLiveRemarks(r) || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gradebook-${this.selectedTraining()?.code || 'offline'}-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openTraineeModal(r: OfflineTraineeResult): void {
    this.selectedTraineeForModal.set(r);
    this.showDetailModal.set(true);
  }

  closeTraineeModal(): void {
    this.showDetailModal.set(false);
    this.selectedTraineeForModal.set(null);
  }

  // Summary Metrics (Computed Live from active edits)
  avgScore = computed(() => {
    const list = this.results();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, r) => acc + this.getLiveOverallScore(r), 0);
    return Math.round(sum / list.length);
  });

  passCount = computed(() => this.results().filter(r => this.getLiveStatus(r) === 'passed').length);

  failCount = computed(() => this.results().filter(r => this.getLiveStatus(r) === 'failed').length);

  passRate = computed(() => {
    const list = this.results();
    if (list.length === 0) return 0;
    return Math.round((this.passCount() / list.length) * 100);
  });

  unsavedChangesCount = computed(() => {
    const edits = this.editableMarks();
    return Object.values(edits).filter(e => e.isDirty).length;
  });

  getAvatarColors(name: string): { bg: string; text: string; border: string } {
    const colors = [
      { bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
      { bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
      { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
      { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
      { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
      { bg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  getLabelForStatusKey(key: string): string {
    const found = this.statusOptionList.find(s => s.key === key);
    return found ? found.label : key;
  }

  getLabelForAttendanceKey(key: string): string {
    const found = this.attendanceTierOptions.find(o => o.value === key);
    return found ? found.label : key;
  }

  getLabelForScoreKey(key: string): string {
    const found = this.scoreTierOptions.find(o => o.value === key);
    return found ? found.label : key;
  }

  getLabelForSortKey(key: string): string {
    const found = this.sortByOptions.find(o => o.value === key);
    return found ? found.label : key;
  }

  private parseDate(str: string): Date | null {
    if (!str) return null;
    const parts = str.trim().split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d);
      }
    }
    const dt = new Date(str);
    return isNaN(dt.getTime()) ? null : dt;
  }
}
