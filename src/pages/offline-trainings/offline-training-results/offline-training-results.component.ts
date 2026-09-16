import { Component, signal, computed, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineTraineeResult } from '../../../models/offline-training.model';
import { ModalOverlayComponent } from '../../../components/modal-overlay/modal-overlay.component';

export interface DropdownItem {
  label: string;
  value: string;
  sublabel?: string;
  icon?: string;
}

@Component({
  selector: 'app-offline-training-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalOverlayComponent],
  templateUrl: './offline-training-results.component.html'
})
export class OfflineTrainingResultsComponent implements OnInit {
  lmsData = inject(LmsDataService);

  trainings = computed(() => this.lmsData.offlineTrainings());
  selectedTrainingId = signal<string>('');

  selectedTraining = computed<OfflineTraining | undefined>(() => {
    return this.trainings().find(t => t.trainingId === this.selectedTrainingId() || t.id === this.selectedTrainingId());
  });

  // Filter Drawer and Dropdown open states
  isFilterExpanded = signal(false);
  openFilterDropdown = signal<string | null>(null);

  // Applied filter state
  selectedEmbeddingId = signal<string>('all');
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');

  // Draft filter state inside drawer
  draftTrainingId = signal<string>('');
  draftEmbeddingId = signal<string>('all');
  draftStatus = signal<string>('all');

  // Embeddings / Cohorts for selected training
  cohorts = computed(() => {
    const id = this.selectedTrainingId();
    if (!id || id === 'all') return this.lmsData.offlineTrainingEmbeddings();
    return this.lmsData.offlineTrainingEmbeddings().filter(e => e.offlineTrainingId === id);
  });

  // Draft Cohorts for drawer
  draftCohorts = computed(() => {
    const id = this.draftTrainingId();
    if (!id || id === 'all') return this.lmsData.offlineTrainingEmbeddings();
    return this.lmsData.offlineTrainingEmbeddings().filter(e => e.offlineTrainingId === id);
  });

  // Select Options
  trainingOptions = computed<DropdownItem[]>(() => {
    const allOption: DropdownItem = {
      label: 'All Offline Workshops',
      value: 'all',
      sublabel: 'View trainees across all workshops',
      icon: 'school'
    };
    const items: DropdownItem[] = this.trainings().map(t => ({
      label: `${t.title} (${t.code})`,
      value: t.trainingId || t.id,
      sublabel: `${t.category || 'Workshop'} • ${t.venueName || 'Venue TBD'}`,
      icon: 'apartment'
    }));
    return [allOption, ...items];
  });

  cohortOptions = computed<DropdownItem[]>(() => {
    return [
      { label: 'All Cohorts & Embeddings', value: 'all', sublabel: 'All batches included', icon: 'hub' },
      ...this.cohorts().map(c => ({
        label: `${c.hostEntityTitle || c.hostTitle} (${c.hostType.toUpperCase()})`,
        value: c.embeddingId,
        sublabel: `Trainer: ${c.effectiveTrainerName || 'Lead Trainer'}`,
        icon: 'groups'
      }))
    ];
  });

  draftCohortOptions = computed<DropdownItem[]>(() => {
    return [
      { label: 'All Cohorts & Embeddings', value: 'all', sublabel: 'All batches included', icon: 'hub' },
      ...this.draftCohorts().map(c => ({
        label: `${c.hostEntityTitle || c.hostTitle} (${c.hostType.toUpperCase()})`,
        value: c.embeddingId,
        sublabel: `Trainer: ${c.effectiveTrainerName || 'Lead Trainer'}`,
        icon: 'groups'
      }))
    ];
  });

  statusFilterOptions: DropdownItem[] = [
    { label: 'All Statuses', value: 'all', sublabel: 'Passed and failed trainees', icon: 'fact_check' },
    { label: 'Passed Only', value: 'passed', sublabel: 'Met attendance & score thresholds', icon: 'verified' },
    { label: 'Failed Only', value: 'failed', sublabel: 'Under attendance or scoring mark', icon: 'cancel' }
  ];

  // Display Labels
  currentTrainingLabel = computed(() => {
    const id = this.selectedTrainingId();
    if (!id || id === 'all') return 'All Offline Workshops';
    const found = this.trainings().find(t => t.trainingId === id || t.id === id);
    return found ? `${found.title} (${found.code})` : 'All Offline Workshops';
  });

  draftTrainingLabel = computed(() => {
    const id = this.draftTrainingId();
    if (!id || id === 'all') return 'All Offline Workshops';
    const found = this.trainings().find(t => t.trainingId === id || t.id === id);
    return found ? `${found.title} (${found.code})` : 'All Offline Workshops';
  });

  currentCohortLabel = computed(() => {
    const id = this.selectedEmbeddingId();
    if (id === 'all') return 'All Cohorts & Embeddings';
    const found = this.lmsData.offlineTrainingEmbeddings().find(e => e.embeddingId === id);
    return found ? `${found.hostEntityTitle || found.hostTitle} (${found.hostType.toUpperCase()})` : 'Selected Cohort';
  });

  draftCohortLabel = computed(() => {
    const id = this.draftEmbeddingId();
    if (id === 'all') return 'All Cohorts & Embeddings';
    const found = this.lmsData.offlineTrainingEmbeddings().find(e => e.embeddingId === id);
    return found ? `${found.hostEntityTitle || found.hostTitle} (${found.hostType.toUpperCase()})` : 'Selected Cohort';
  });

  currentStatusLabel = computed(() => {
    const s = this.statusFilter();
    if (s === 'passed') return 'Passed Only';
    if (s === 'failed') return 'Failed Only';
    return 'All Statuses';
  });

  draftStatusLabel = computed(() => {
    const s = this.draftStatus();
    if (s === 'passed') return 'Passed Only';
    if (s === 'failed') return 'Failed Only';
    return 'All Statuses';
  });

  // Active filter indicators
  hasActiveFilters = computed(() => {
    const defaultTrainingId = this.trainings().length > 0 ? this.trainings()[0].trainingId : 'all';
    const trainingActive = this.selectedTrainingId() !== 'all' && this.selectedTrainingId() !== defaultTrainingId;
    return trainingActive || this.selectedEmbeddingId() !== 'all' || this.statusFilter() !== 'all';
  });

  activeFilterCount = computed(() => {
    let count = 0;
    const defaultTrainingId = this.trainings().length > 0 ? this.trainings()[0].trainingId : 'all';
    if (this.selectedTrainingId() !== 'all' && this.selectedTrainingId() !== defaultTrainingId) count++;
    if (this.selectedEmbeddingId() !== 'all') count++;
    if (this.statusFilter() !== 'all') count++;
    return count;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.openFilterDropdown.set(null);
  }

  toggleFilterDrawer(): void {
    if (!this.isFilterExpanded()) {
      this.draftTrainingId.set(this.selectedTrainingId());
      this.draftEmbeddingId.set(this.selectedEmbeddingId());
      this.draftStatus.set(this.statusFilter());
    }
    this.isFilterExpanded.update(v => !v);
    this.openFilterDropdown.set(null);
  }

  toggleFilterDropdown(type: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.openFilterDropdown.update(curr => (curr === type ? null : type));
  }

  selectFilterValue(type: 'training' | 'cohort' | 'status', value: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.isFilterExpanded()) {
      if (type === 'training') {
        this.draftTrainingId.set(value);
        this.draftEmbeddingId.set('all');
      } else if (type === 'cohort') {
        this.draftEmbeddingId.set(value);
      } else if (type === 'status') {
        this.draftStatus.set(value);
      }
    } else {
      if (type === 'training') {
        this.selectedTrainingId.set(value);
        this.draftTrainingId.set(value);
        this.selectedEmbeddingId.set('all');
        this.draftEmbeddingId.set('all');
        this.syncEditableState();
      } else if (type === 'cohort') {
        this.selectedEmbeddingId.set(value);
        this.draftEmbeddingId.set(value);
        this.syncEditableState();
      } else if (type === 'status') {
        this.statusFilter.set(value);
        this.draftStatus.set(value);
      }
    }
    this.openFilterDropdown.set(null);
  }

  resetFilter(type: 'training' | 'cohort' | 'status', event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.isFilterExpanded()) {
      if (type === 'training') {
        const defaultT = this.trainings().length > 0 ? this.trainings()[0].trainingId : 'all';
        this.draftTrainingId.set(defaultT);
        this.draftEmbeddingId.set('all');
      } else if (type === 'cohort') {
        this.draftEmbeddingId.set('all');
      } else if (type === 'status') {
        this.draftStatus.set('all');
      }
    } else {
      if (type === 'training') {
        const defaultT = this.trainings().length > 0 ? this.trainings()[0].trainingId : 'all';
        this.selectedTrainingId.set(defaultT);
        this.draftTrainingId.set(defaultT);
        this.selectedEmbeddingId.set('all');
        this.draftEmbeddingId.set('all');
        this.syncEditableState();
      } else if (type === 'cohort') {
        this.selectedEmbeddingId.set('all');
        this.draftEmbeddingId.set('all');
        this.syncEditableState();
      } else if (type === 'status') {
        this.statusFilter.set('all');
        this.draftStatus.set('all');
      }
    }
  }

  applyDrawerFilter(): void {
    this.selectedTrainingId.set(this.draftTrainingId());
    this.selectedEmbeddingId.set(this.draftEmbeddingId());
    this.statusFilter.set(this.draftStatus());
    this.syncEditableState();
    this.isFilterExpanded.set(false);
    this.openFilterDropdown.set(null);
  }

  cancelDrawer(): void {
    this.isFilterExpanded.set(false);
    this.openFilterDropdown.set(null);
  }

  clearDrawerSelections(): void {
    const defaultT = this.trainings().length > 0 ? this.trainings()[0].trainingId : 'all';
    this.draftTrainingId.set(defaultT);
    this.draftEmbeddingId.set('all');
    this.draftStatus.set('all');
  }

  resetAllFilters(): void {
    const defaultT = this.trainings().length > 0 ? this.trainings()[0].trainingId : 'all';
    this.selectedTrainingId.set(defaultT);
    this.draftTrainingId.set(defaultT);
    this.selectedEmbeddingId.set('all');
    this.draftEmbeddingId.set('all');
    this.statusFilter.set('all');
    this.draftStatus.set('all');
    this.searchQuery.set('');
    this.syncEditableState();
    this.openFilterDropdown.set(null);
  }

  // Trainee results
  results = computed<OfflineTraineeResult[]>(() => {
    const tId = this.selectedTrainingId();
    let list = this.lmsData.offlineTraineeResults();
    if (tId && tId !== 'all') {
      list = list.filter(r => r.offlineTrainingId === tId);
    }
    if (this.selectedEmbeddingId() !== 'all') {
      list = list.filter(r => r.embeddingId === this.selectedEmbeddingId());
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(r => {
        const training = this.trainings().find(t => t.trainingId === r.offlineTrainingId || t.id === r.offlineTrainingId);
        const trainingTitle = training?.title?.toLowerCase() || '';
        const trainingCode = training?.code?.toLowerCase() || '';
        const venue = training?.venueName?.toLowerCase() || '';
        return (
          r.traineeName.toLowerCase().includes(q) ||
          r.traineeEmail.toLowerCase().includes(q) ||
          trainingTitle.includes(q) ||
          trainingCode.includes(q) ||
          venue.includes(q)
        );
      });
    }
    const status = this.statusFilter();
    if (status !== 'all') {
      list = list.filter(r => r.passStatus === status);
    }
    return list;
  });

  // Local editable rows
  editableMarks = signal<Record<string, { marks: number; attendance: number; remarks: string }>>({});
  saveSuccessAlert = signal<string | null>(null);

  // Modal State
  selectedTraineeForModal = signal<OfflineTraineeResult | null>(null);
  showDetailModal = signal(false);

  ngOnInit(): void {
    if (this.trainings().length > 0) {
      this.selectedTrainingId.set(this.trainings()[0].trainingId);
      this.syncEditableState();
    }
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
    const map: Record<string, { marks: number; attendance: number; remarks: string }> = {};
    this.results().forEach(r => {
      map[r.resultId] = {
        marks: r.manualMarkScore ?? 0,
        attendance: r.attendancePercentage,
        remarks: r.instructorRemarks || ''
      };
    });
    this.editableMarks.set(map);
  }

  updateMark(resultId: string, val: number): void {
    this.editableMarks.update(curr => ({
      ...curr,
      [resultId]: {
        ...curr[resultId],
        marks: isNaN(val) ? 0 : Math.min(100, Math.max(0, val))
      }
    }));
  }

  updateAttendance(resultId: string, val: number): void {
    this.editableMarks.update(curr => ({
      ...curr,
      [resultId]: {
        ...curr[resultId],
        attendance: isNaN(val) ? 0 : Math.min(100, Math.max(0, val))
      }
    }));
  }

  updateRemarks(resultId: string, val: string): void {
    this.editableMarks.update(curr => ({
      ...curr,
      [resultId]: {
        ...curr[resultId],
        remarks: val
      }
    }));
  }

  saveRow(result: OfflineTraineeResult): void {
    const edit = this.editableMarks()[result.resultId || `${result.traineeId}-${result.embeddingId}`];
    if (!edit) return;

    this.lmsData.saveOfflineManualMarks(result.embeddingId, result.traineeId, 'manual:Practical Exam', edit.marks, 100, edit.remarks);
    this.lmsData.saveOfflineAttendance(result.embeddingId, result.traineeId, edit.attendance >= 50 ? 'present' : 'absent', edit.remarks);

    this.saveSuccessAlert.set(`Updated grades for ${result.traineeName}`);
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

    this.saveSuccessAlert.set(`All ${this.results().length} trainee grade records saved successfully.`);
    setTimeout(() => this.saveSuccessAlert.set(null), 3500);
  }

  openTraineeModal(r: OfflineTraineeResult): void {
    this.selectedTraineeForModal.set(r);
    this.showDetailModal.set(true);
  }

  closeTraineeModal(): void {
    this.showDetailModal.set(false);
    this.selectedTraineeForModal.set(null);
  }

  // Summary Metrics
  avgScore = computed(() => {
    const list = this.results();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, r) => acc + (r.finalOverallScore || 0), 0);
    return Math.round(sum / list.length);
  });

  passCount = computed(() => this.results().filter(r => r.passStatus === 'passed').length);

  failCount = computed(() => this.results().filter(r => r.passStatus === 'failed').length);

  passRate = computed(() => {
    const list = this.results();
    if (list.length === 0) return 0;
    return Math.round((this.passCount() / list.length) * 100);
  });
}

