import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { AuthorProfile, AuthorshipRecord, DeactivationBlockResolution } from '../../../models/author.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-author-details',
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './author-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorDetailsComponent implements OnInit {
  lms = inject(LmsDataService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  authorId = signal<string>('');

  // Active Author profile
  author = computed<AuthorProfile | undefined>(() => {
    const id = this.authorId();
    if (!id) return undefined;
    return this.lms.getAuthorById(id);
  });

  // Authorship records for this author
  history = computed<AuthorshipRecord[]>(() => {
    const id = this.authorId();
    if (!id) return [];
    return this.lms.getAuthorshipHistory(id);
  });

  // History filtering
  contentTypeFilter = signal<string>('All');
  courseStatusFilter = signal<string>('All');

  contentTypeOptions: SelectOption[] = [
    { value: 'All', label: 'All Content Types', icon: 'category' },
    { value: 'video', label: 'Video Lessons', icon: 'smart_display' },
    { value: 'document', label: 'Documents & SOPs', icon: 'description' },
    { value: 'quiz', label: 'Quizzes & Exams', icon: 'quiz' },
    { value: 'interactive', label: 'Simulations & Labs', icon: 'extension' }
  ];

  courseStatusOptions: SelectOption[] = [
    { value: 'All', label: 'All Course Statuses', icon: 'view_agenda' },
    { value: 'published', label: 'Published (Active)', icon: 'check_circle' },
    { value: 'draft', label: 'Drafts', icon: 'edit_document' }
  ];

  filteredHistory = computed(() => {
    const records = this.history();
    const cType = this.contentTypeFilter();
    const cStat = this.courseStatusFilter();

    return records.filter(r => {
      const matchType = cType === 'All' || r.contentType.toLowerCase() === cType.toLowerCase();
      const matchStat = cStat === 'All' || r.courseStatus.toLowerCase() === cStat.toLowerCase();
      return matchType && matchStat;
    });
  });

  // Metrics
  totalItems = computed(() => this.history().length);
  videoCount = computed(() => this.history().filter(r => r.contentType === 'video').length);
  docCount = computed(() => this.history().filter(r => r.contentType === 'document' || r.contentType === 'reading').length);
  quizCount = computed(() => this.history().filter(r => r.contentType === 'quiz' || r.contentType === 'interactive').length);
  activeCoursesCount = computed(() => {
    const uniqueCourses = new Set(this.history().filter(r => r.courseStatus.toLowerCase() === 'published').map(r => r.courseId));
    return uniqueCourses.size;
  });

  // Blocked Deactivation Modal State
  showBlockedModal = signal<boolean>(false);
  blockedActiveRecords = signal<AuthorshipRecord[]>([]);
  reassignmentSelections = signal<Record<string, string>>({});

  replacementAuthors = computed(() => {
    const current = this.author();
    if (!current) return this.lms.activeAuthors();
    return this.lms.activeAuthors().filter(a => a.id !== current.id);
  });

  replacementAuthorOptions = computed<SelectOption[]>(() => {
    return this.replacementAuthors().map(cand => ({
      value: cand.id,
      label: cand.name,
      sublabel: cand.specialization,
      avatar: cand.avatar
    }));
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.authorId.set(id);
      }
    });
  }

  handleToggleStatus(): void {
    const current = this.author();
    if (!current) return;

    if (current.status === 'Inactive') {
      this.lms.activateAuthor(current.id);
      return;
    }

    // Attempting to deactivate - check blocked rule
    const check = this.lms.checkAuthorDeactivationBlocked(current.id);
    if (check.isBlocked) {
      this.blockedActiveRecords.set(check.activeRecords);
      const initialReplacements: Record<string, string> = {};
      const firstAvailable = this.lms.activeAuthors().find(a => a.id !== current.id);
      if (firstAvailable) {
        check.activeRecords.forEach(r => {
          initialReplacements[r.contentItemId + '_' + r.courseId] = firstAvailable.id;
        });
      }
      this.reassignmentSelections.set(initialReplacements);
      this.showBlockedModal.set(true);
    } else {
      this.lms.deactivateAuthor(current.id);
    }
  }

  closeBlockedModal(): void {
    this.showBlockedModal.set(false);
    this.blockedActiveRecords.set([]);
  }

  setReplacementSelection(key: string, replacementAuthorId: string): void {
    this.reassignmentSelections.update(map => ({ ...map, [key]: replacementAuthorId }));
  }

  resolveItemReassign(record: AuthorshipRecord): void {
    const key = record.contentItemId + '_' + record.courseId;
    const replacementId = this.reassignmentSelections()[key];
    if (!replacementId) {
      this.lms.showToast('Please select a replacement author first.', 'error', 3000, 'Selection Required');
      return;
    }

    const resolution: DeactivationBlockResolution = {
      contentItemId: record.contentItemId,
      courseId: record.courseId,
      action: 'reassign',
      replacementAuthorId: replacementId
    };

    this.lms.resolveAuthorCredit(resolution);
    this.blockedActiveRecords.update(list => list.filter(r => !(r.contentItemId === record.contentItemId && r.courseId === record.courseId)));
  }

  resolveItemRemove(record: AuthorshipRecord): void {
    const resolution: DeactivationBlockResolution = {
      contentItemId: record.contentItemId,
      courseId: record.courseId,
      action: 'remove'
    };

    this.lms.resolveAuthorCredit(resolution);
    this.blockedActiveRecords.update(list => list.filter(r => !(r.contentItemId === record.contentItemId && r.courseId === record.courseId)));
  }

  finalizeDeactivationAfterResolutions(): void {
    const current = this.author();
    if (!current) return;

    if (this.blockedActiveRecords().length > 0) {
      this.lms.showToast(`Please reassign or remove all ${this.blockedActiveRecords().length} remaining active course credits before finalizing deactivation.`, 'error', 4000, 'Credits Unresolved');
      return;
    }

    this.lms.deactivateAuthor(current.id, true);
    this.closeBlockedModal();
  }

  getContentTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'video': return 'smart_display';
      case 'document':
      case 'reading': return 'description';
      case 'quiz': return 'quiz';
      case 'interactive':
      case 'lab': return 'extension';
      default: return 'article';
    }
  }

  getContentTypeBadgeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'video': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60';
      case 'document':
      case 'reading': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60';
      case 'quiz': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60';
      case 'interactive':
      case 'lab': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }
}
