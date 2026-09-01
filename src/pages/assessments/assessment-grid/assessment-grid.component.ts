import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  Assessment,
  AssessmentType,
  AssessmentScoringMode,
  AssessmentStatus,
  AssessmentVersion
} from '../../../models/assessment.model';

@Component({
  selector: 'app-assessment-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assessment-grid.component.html',
  styleUrls: ['./assessment-grid.component.css']
})
export class AssessmentGridComponent {
  lmsService = inject(LmsDataService);
  router = inject(Router);

  // Search & Filter state
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedType = signal<string>('all');
  selectedScoringMode = signal<string>('all');
  selectedCategory = signal<string>('all');
  filterHasManualGrading = signal<string>('all'); // 'all', 'yes', 'no'
  filterHasPassMark = signal<string>('all'); // 'all', 'yes', 'no'
  sortBy = signal<'latest' | 'title' | 'attempts' | 'code'>('latest');
  viewMode = signal<'grid' | 'table'>('grid');

  // Modal states
  showPreviewModal = signal<boolean>(false);
  previewAssessment = signal<Assessment | null>(null);

  showVersionHistoryModal = signal<boolean>(false);
  historyAssessment = signal<Assessment | null>(null);

  showDeleteConfirmModal = signal<boolean>(false);
  deleteTargetAssessment = signal<Assessment | null>(null);

  // Available categories derived from data
  categories = computed<string[]>(() => {
    const set = new Set<string>();
    this.lmsService.assessments().forEach(a => {
      a.categoryTags.forEach(cat => set.add(cat));
    });
    return Array.from(set);
  });

  // KPI Metrics
  kpis = computed(() => {
    const list = this.lmsService.assessments();
    const attempts = this.lmsService.assessmentAttempts();

    const total = list.length;
    const published = list.filter(a => a.status === 'published').length;
    const draft = list.filter(a => a.status === 'draft').length;
    const manualGradedCount = list.filter(a => {
      const ver = a.versions.find(v => v.versionId === a.currentVersionId) || a.versions[0];
      return ver?.questions.some(q => q.manualGraded);
    }).length;

    const totalPassed = attempts.filter(att => att.passed).length;
    const passRate = attempts.length > 0 ? Math.round((totalPassed / attempts.length) * 100) : 0;

    return {
      total,
      published,
      draft,
      manualGradedCount,
      totalAttempts: attempts.length,
      passRate
    };
  });

  // Filtered Assessments List
  filteredAssessments = computed<Assessment[]>(() => {
    let list = [...this.lmsService.assessments()];
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();
    const type = this.selectedType();
    const mode = this.selectedScoringMode();
    const category = this.selectedCategory();
    const manualFilter = this.filterHasManualGrading();
    const passMarkFilter = this.filterHasPassMark();

    // Text search
    if (q) {
      list = list.filter(
        a =>
          a.title.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.categoryTags.some(tag => tag.toLowerCase().includes(q)) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    // Type filter
    if (type !== 'all') {
      list = list.filter(a => a.type === type);
    }

    // Scoring Mode
    if (mode !== 'all') {
      list = list.filter(a => a.scoringMode === mode);
    }

    // Category filter
    if (category !== 'all') {
      list = list.filter(a => a.categoryTags.includes(category));
    }

    // Manual grading filter
    if (manualFilter !== 'all') {
      list = list.filter(a => {
        const ver = a.versions.find(v => v.versionId === a.currentVersionId) || a.versions[0];
        const hasManual = ver?.questions.some(q => q.manualGraded);
        return manualFilter === 'yes' ? hasManual : !hasManual;
      });
    }

    // Pass mark filter
    if (passMarkFilter !== 'all') {
      list = list.filter(a => {
        const ver = a.versions.find(v => v.versionId === a.currentVersionId) || a.versions[0];
        const hasPassMark = ver?.scoringPolicy.passMarkPercent && ver.scoringPolicy.passMarkPercent > 0;
        return passMarkFilter === 'yes' ? hasPassMark : !hasPassMark;
      });
    }

    // Sort
    const sort = this.sortBy();
    list.sort((a, b) => {
      if (sort === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sort === 'code') {
        return a.code.localeCompare(b.code);
      } else if (sort === 'attempts') {
        const attA = this.lmsService.assessmentAttempts().filter(att => att.assessmentId === a.assessmentId).length;
        const attB = this.lmsService.assessmentAttempts().filter(att => att.assessmentId === b.assessmentId).length;
        return attB - attA;
      } else {
        // latest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  });

  // Check if filters active
  isFiltered = computed<boolean>(() => {
    return (
      this.searchQuery().trim() !== '' ||
      this.selectedStatus() !== 'all' ||
      this.selectedType() !== 'all' ||
      this.selectedScoringMode() !== 'all' ||
      this.selectedCategory() !== 'all' ||
      this.filterHasManualGrading() !== 'all' ||
      this.filterHasPassMark() !== 'all'
    );
  });

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedType.set('all');
    this.selectedScoringMode.set('all');
    this.selectedCategory.set('all');
    this.filterHasManualGrading.set('all');
    this.filterHasPassMark.set('all');
    this.sortBy.set('latest');
  }

  // Helpers
  getCurrentVersion(asm: Assessment): AssessmentVersion | undefined {
    return asm.versions.find(v => v.versionId === asm.currentVersionId) || asm.versions[0];
  }

  getQuestionCount(asm: Assessment): number {
    return this.getCurrentVersion(asm)?.questions.length || 0;
  }

  hasManualGrading(asm: Assessment): boolean {
    return this.getCurrentVersion(asm)?.questions.some(q => q.manualGraded) || false;
  }

  getPassMark(asm: Assessment): number {
    return this.getCurrentVersion(asm)?.scoringPolicy.passMarkPercent || 0;
  }

  getAttemptCount(asmId: string): number {
    return this.lmsService.assessmentAttempts().filter(att => att.assessmentId === asmId).length;
  }

  // Actions
  onPreview(asm: Assessment): void {
    this.previewAssessment.set(asm);
    this.showPreviewModal.set(true);
  }

  onTakeExam(asm: Assessment): void {
    this.router.navigate(['/assessments/take', asm.assessmentId]);
  }

  onCreateNew(): void {
    this.router.navigate(['/assessments/create']);
  }

  onEdit(asm: Assessment): void {
    this.router.navigate(['/assessments/edit', asm.assessmentId]);
  }

  onPublish(asm: Assessment): void {
    this.lmsService.publishAssessment(asm.assessmentId);
  }

  onForkVersion(asm: Assessment): void {
    const updated = this.lmsService.forkAssessmentVersion(asm.assessmentId);
    this.router.navigate(['/assessments/edit', updated.assessmentId]);
  }

  onDuplicate(asm: Assessment): void {
    this.lmsService.duplicateAssessment(asm.assessmentId);
  }

  onDeactivate(asm: Assessment): void {
    this.lmsService.deactivateAssessment(asm.assessmentId);
  }

  onReactivate(asm: Assessment): void {
    this.lmsService.reactivateAssessment(asm.assessmentId);
  }

  onConfirmDelete(asm: Assessment): void {
    this.deleteTargetAssessment.set(asm);
    this.showDeleteConfirmModal.set(true);
  }

  executeDelete(): void {
    const asm = this.deleteTargetAssessment();
    if (asm) {
      this.lmsService.deleteAssessment(asm.assessmentId);
      this.showDeleteConfirmModal.set(false);
      this.deleteTargetAssessment.set(null);
    }
  }

  onViewHistory(asm: Assessment): void {
    this.historyAssessment.set(asm);
    this.showVersionHistoryModal.set(true);
  }
}
