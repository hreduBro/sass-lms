import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { OfflineTraining, OfflineTraineeResult } from '../../../models/offline-training.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { ModalOverlayComponent } from '../../../components/modal-overlay/modal-overlay.component';

@Component({
  selector: 'app-offline-training-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent, ModalOverlayComponent],
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
  statusFilter = signal<string>('all');

  // Select Options
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

  statusFilterOptions: SelectOption[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Passed Only', value: 'passed' },
    { label: 'Failed Only', value: 'failed' }
  ];

  // Trainee results
  results = computed<OfflineTraineeResult[]>(() => {
    const tId = this.selectedTrainingId();
    if (!tId) return this.lmsData.offlineTraineeResults();
    let list = this.lmsData.offlineTraineeResults().filter(r => r.offlineTrainingId === tId);
    if (this.selectedEmbeddingId() !== 'all') {
      list = list.filter(r => r.embeddingId === this.selectedEmbeddingId());
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(r =>
        r.traineeName.toLowerCase().includes(q) ||
        r.traineeEmail.toLowerCase().includes(q)
      );
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

