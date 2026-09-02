import { Component, inject, signal, computed, ChangeDetectionStrategy, HostListener } from '@angular/core';
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
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';
import { DataGridComponent } from '../../../components/data-grid';

@Component({
  selector: 'app-assessment-grid',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    CustomSelectComponent,
    CustomAvatarComponent,
    DataGridComponent
  ],
  templateUrl: './assessment-grid.component.html',
  styleUrls: ['./assessment-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssessmentGridComponent {
  lmsService = inject(LmsDataService);
  router = inject(Router);

  // Active LMS Context
  activeLms = this.lmsService.activeLms;
  activeTenant = this.lmsService.activeTenant;

  // Search & Filter state
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedType = signal<string>('all');
  selectedScoringMode = signal<string>('all');
  selectedCategory = signal<string>('all');
  filterHasManualGrading = signal<string>('all'); // 'all', 'yes', 'no'
  filterHasPassMark = signal<string>('all'); // 'all', 'yes', 'no'
  sortBy = signal<string>('latest');
  viewMode = signal<'grid' | 'table'>('grid');

  // Pagination state
  currentPage = signal<number>(1);
  pageSize = signal<number>(9);

  // Filter Drawer toggle
  showFilterDrawer = signal<boolean>(false);

  // Action Menu Dropdown State (Floating Fixed Menu like plan grid)
  activeMenuAssessment = signal<Assessment | null>(null);
  menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Modal states
  showPreviewModal = signal<boolean>(false);
  previewAssessment = signal<Assessment | null>(null);

  showVersionHistoryModal = signal<boolean>(false);
  historyAssessment = signal<Assessment | null>(null);

  showDeleteConfirmModal = signal<boolean>(false);
  deleteTargetAssessment = signal<Assessment | null>(null);

  // Options for Custom Selects
  statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'published', label: 'Published (Live)', badge: 'Live', badgeClass: 'bg-emerald-500/10 text-emerald-600' },
    { value: 'draft', label: 'Drafts (In-Progress)', badge: 'Draft', badgeClass: 'bg-amber-500/10 text-amber-600' },
    { value: 'inactive', label: 'Archived / Inactive' }
  ];

  typeOptions: SelectOption[] = [
    { value: 'all', label: 'All Assessment Types' },
    { value: 'exam', label: 'Exam (Formal)', icon: 'school' },
    { value: 'quiz', label: 'Quiz (Formative)', icon: 'quiz' },
    { value: 'assignment', label: 'Assignment / Project', icon: 'assignment' },
    { value: 'survey', label: 'Survey / Questionnaire', icon: 'poll' },
    { value: 'diagnostic', label: 'Diagnostic Assessment', icon: 'health_and_safety' }
  ];

  scoringModeOptions: SelectOption[] = [
    { value: 'all', label: 'All Scoring Modes' },
    { value: 'scored', label: 'Scored (Point Graded)', icon: 'grade' },
    { value: 'unscored', label: 'Unscored (Participation/Survey)', icon: 'check_circle' }
  ];

  manualGradingOptions: SelectOption[] = [
    { value: 'all', label: 'All Grading Modes' },
    { value: 'yes', label: 'Requires Manual Grading', icon: 'assignment_ind' },
    { value: 'no', label: '100% Auto-Scored Only', icon: 'bolt' }
  ];

  passMarkOptions: SelectOption[] = [
    { value: 'all', label: 'All Pass Mark Policies' },
    { value: 'yes', label: 'Has Minimum Pass Mark', icon: 'military_tech' },
    { value: 'no', label: 'No Pass Mark Requirement', icon: 'do_not_disturb_on' }
  ];

  sortOptions: SelectOption[] = [
    { value: 'latest', label: 'Recently Created' },
    { value: 'title', label: 'Title (A-Z)' },
    { value: 'code', label: 'Assessment Code' },
    { value: 'attempts', label: 'Most Attempts' },
    { value: 'questions', label: 'Question Count' }
  ];

  // Available categories derived from data
  categories = computed<string[]>(() => {
    const set = new Set<string>();
    this.lmsService.assessments().forEach(a => {
      a.categoryTags.forEach(cat => set.add(cat));
    });
    return Array.from(set);
  });

  categoryOptions = computed<SelectOption[]>(() => {
    const list: SelectOption[] = [{ value: 'all', label: 'All Categories' }];
    this.categories().forEach(cat => {
      list.push({ value: cat, label: cat });
    });
    return list;
  });

  // Drafts needing attention
  draftAssessments = computed<Assessment[]>(() => {
    return this.lmsService.assessments().filter(a => a.status === 'draft');
  });

  // Active filter count
  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedType() !== 'all') count++;
    if (this.selectedScoringMode() !== 'all') count++;
    if (this.selectedCategory() !== 'all') count++;
    if (this.filterHasManualGrading() !== 'all') count++;
    if (this.filterHasPassMark() !== 'all') count++;
    return count;
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
      } else if (sort === 'questions') {
        const qA = this.getQuestionCount(a);
        const qB = this.getQuestionCount(b);
        return qB - qA;
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

  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredAssessments().length > 0) return 'none';
    if (this.lmsService.assessments().length === 0) return 'true_empty';
    if (this.searchQuery().trim().length > 0) return 'search_miss';
    if (this.isFiltered()) return 'filter_miss';
    return 'true_empty';
  });

  paginatedAssessments = computed<Assessment[]>(() => {
    const list = this.filteredAssessments();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  toggleFilterDrawer(): void {
    this.showFilterDrawer.update(v => !v);
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedType.set('all');
    this.selectedScoringMode.set('all');
    this.selectedCategory.set('all');
    this.filterHasManualGrading.set('all');
    this.filterHasPassMark.set('all');
    this.sortBy.set('latest');
    this.currentPage.set(1);
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
  // Floating Action Menu Handlers (Popover like plan grid)
  toggleActionMenu(asm: Assessment, event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeMenuAssessment()?.assessmentId === asm.assessmentId) {
      this.closeActionMenu();
      return;
    }

    const button = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
    const rect = button.getBoundingClientRect();
    const menuHeight = 320;
    const menuWidth = 224; // w-56 is 224px

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = placeAbove ? Math.max(10, rect.top - menuHeight - 4) : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 4);
    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    this.menuPosition.set({ top, left });
    this.activeMenuAssessment.set(asm);
  }

  closeActionMenu(): void {
    this.activeMenuAssessment.set(null);
  }

  isActionMenuOpen(asmId: string): boolean {
    return this.activeMenuAssessment()?.assessmentId === asmId;
  }

  @HostListener('document:click')
  @HostListener('window:scroll')
  @HostListener('window:resize')
  onDocumentInteraction(): void {
    if (this.activeMenuAssessment()) {
      this.closeActionMenu();
    }
  }

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
