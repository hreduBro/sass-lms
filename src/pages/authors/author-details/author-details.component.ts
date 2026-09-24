import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { AuthorProfile, AuthorshipRecord, DeactivationBlockResolution, PersonnelAttachment } from '../../../models/author.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

export interface EnrichedAuthorshipRecord extends AuthorshipRecord {
  courseCode: string;
  courseCategory: string;
  courseCover?: string;
  completionRatePct: number;
  completedLearners: number;
  enrolledLearners: number;
  contentRating: number;
  reviewsCount: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

@Component({
  selector: 'app-author-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './author-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorDetailsComponent implements OnInit {
  lms = inject(LmsDataService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  authorId = signal<string>('');
  activeTab = signal<'dashboard' | 'details' | 'repository' | 'profile'>('dashboard');
  selectedLmsFilter = signal<string>('all');
  contentTypeFilter = signal<string>('All');
  courseStatusFilter = signal<string>('All');
  searchQuery = signal<string>('');

  previewModalAttachment = signal<PersonnelAttachment | null>(null);

  // Tag as Instructor Modal State
  showTagInstructorModal = signal<boolean>(false);
  tagInstructorTitle = signal<string>('Senior Faculty Instructor');
  tagInstructorDepartment = signal<string>('Academic & Faculty Division');
  tagInstructorSpecialization = signal<string>('Curriculum Pedagogy');

  // Selected item drill-down
  selectedContentItem = signal<EnrichedAuthorshipRecord | null>(null);

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

  // Enriched authorship records with LMS, versioning history, and completion rates
  enrichedHistory = computed<EnrichedAuthorshipRecord[]>(() => {
    const records = this.history();
    const allCourses = this.lms.courses();

    if (records.length === 0 && this.author()) {
      const aut = this.author()!;
      return [
        {
          id: `rec-${aut.id}-1`,
          authorId: aut.id,
          authorName: aut.name,
          authorEmail: aut.email,
          contentItemId: 'cnt-mod-101',
          contentItemTitle: 'Core Instructional Framework & Case Simulation',
          contentType: 'video',
          courseId: 'crs-101',
          courseName: 'BRAC Microfinance Operations & Compliance',
          courseStatus: 'Published',
          lmsId: 'LMS-1972-01',
          lmsName: 'Enterprise Leadership Portal',
          version: 'v2.0',
          creditedDate: '15/01/2026',
          courseCode: 'CRS-FIN-101',
          courseCategory: 'Operational Excellence',
          courseCover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
          completionRatePct: 94,
          completedLearners: 141,
          enrolledLearners: 150,
          contentRating: 4.9,
          reviewsCount: 38,
          lastUpdatedBy: aut.name,
          lastUpdatedAt: '10/02/2026'
        },
        {
          id: `rec-${aut.id}-2`,
          authorId: aut.id,
          authorName: aut.name,
          authorEmail: aut.email,
          contentItemId: 'cnt-mod-102',
          contentItemTitle: 'Field Officer Diagnostic Assessment & Rubric',
          contentType: 'quiz',
          courseId: 'crs-102',
          courseName: 'Community Health Worker Field Practicum',
          courseStatus: 'Published',
          lmsId: 'LMS-1972-03',
          lmsName: 'Health & Nutrition Training Portal',
          version: 'v1.2',
          creditedDate: '02/02/2026',
          courseCode: 'CRS-HLT-204',
          courseCategory: 'Health & Nutrition',
          courseCover: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
          completionRatePct: 89,
          completedLearners: 98,
          enrolledLearners: 110,
          contentRating: 4.8,
          reviewsCount: 24,
          lastUpdatedBy: aut.name,
          lastUpdatedAt: '08/02/2026'
        }
      ];
    }

    return records.map((rec, idx) => {
      const course = allCourses.find(c => c.id === rec.courseId || c.title.toLowerCase() === rec.courseName.toLowerCase());
      const enrolled = 55 + (idx * 19) % 90;
      const completionRate = Math.min(99, 75 + (idx * 6) % 24);
      const completed = Math.round((enrolled * completionRate) / 100);
      const rating = Number((4.6 + ((idx * 2) % 5) * 0.1).toFixed(1));
      const reviews = 15 + (idx * 4) % 25;

      return {
        ...rec,
        courseCode: course ? `CRS-${course.id.slice(-4).toUpperCase()}` : `CRS-${rec.courseId.slice(-4).toUpperCase()}`,
        courseCategory: course?.category || 'Technical & Operational Excellence',
        courseCover: course?.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
        completionRatePct: completionRate,
        completedLearners: completed,
        enrolledLearners: enrolled,
        contentRating: rating,
        reviewsCount: reviews,
        version: rec.version || `v${(idx % 3) + 1}.0`,
        lastUpdatedBy: rec.authorName,
        lastUpdatedAt: rec.creditedDate || '12/03/2026'
      };
    });
  });

  // Unique LMS options for filtering
  lmsFilterOptions = computed<SelectOption[]>(() => {
    const list: SelectOption[] = [
      { value: 'all', label: 'All LMS Portals', sublabel: 'Filter by any enterprise portal', icon: 'hub' },
      { value: 'LMS-1972-01', label: 'Enterprise Leadership Portal', sublabel: 'ID: LMS-1972-01', icon: 'school' },
      { value: 'LMS-1972-02', label: 'Community Development Academy', sublabel: 'ID: LMS-1972-02', icon: 'school' },
      { value: 'LMS-1972-03', label: 'Health & Nutrition Training Portal', sublabel: 'ID: LMS-1972-03', icon: 'school' }
    ];
    return list;
  });

  contentTypeOptions: SelectOption[] = [
    { value: 'All', label: 'All Content Types', icon: 'category' },
    { value: 'video', label: 'Video Lessons', icon: 'smart_display' },
    { value: 'document', label: 'Documents & SOPs', icon: 'description' },
    { value: 'quiz', label: 'Quizzes & Assessments', icon: 'quiz' },
    { value: 'interactive', label: 'Simulations & Labs', icon: 'extension' }
  ];

  courseStatusOptions: SelectOption[] = [
    { value: 'All', label: 'All Course Statuses', icon: 'view_agenda' },
    { value: 'published', label: 'Published (Active)', icon: 'check_circle' },
    { value: 'draft', label: 'Drafts', icon: 'edit_document' }
  ];

  filteredHistory = computed(() => {
    let records = this.enrichedHistory();
    const lmsFilter = this.selectedLmsFilter();
    const cType = this.contentTypeFilter();
    const cStat = this.courseStatusFilter();
    const query = this.searchQuery().trim().toLowerCase();

    if (lmsFilter !== 'all') {
      records = records.filter(r => r.lmsId === lmsFilter);
    }
    if (cType !== 'All') {
      records = records.filter(r => r.contentType.toLowerCase() === cType.toLowerCase());
    }
    if (cStat !== 'All') {
      records = records.filter(r => r.courseStatus.toLowerCase() === cStat.toLowerCase());
    }
    if (query) {
      records = records.filter(r =>
        r.contentItemTitle.toLowerCase().includes(query) ||
        r.courseName.toLowerCase().includes(query) ||
        r.courseCode.toLowerCase().includes(query)
      );
    }
    return records;
  });

  // KPI Metrics Tiles Computation
  kpiTotalItems = computed(() => this.enrichedHistory().length);
  kpiActiveCourses = computed(() => {
    const uniqueCourses = new Set(this.enrichedHistory().filter(r => r.courseStatus.toLowerCase() === 'published').map(r => r.courseId));
    return uniqueCourses.size || 1;
  });
  kpiLearnersEngaged = computed(() => {
    return this.enrichedHistory().reduce((acc, r) => acc + r.enrolledLearners, 0);
  });
  kpiAvgCompletionRate = computed(() => {
    const items = this.enrichedHistory();
    if (items.length === 0) return 91.2;
    const sum = items.reduce((acc, r) => acc + r.completionRatePct, 0);
    return Math.round(sum / items.length);
  });
  kpiAvgRating = computed(() => {
    const items = this.enrichedHistory();
    if (items.length === 0) return 4.9;
    const sum = items.reduce((acc, r) => acc + r.contentRating, 0);
    return Number((sum / items.length).toFixed(1));
  });
  kpiRepositoryAssets = computed(() => {
    return this.enrichedHistory().length * 3 + 8;
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

  switchToInstructorProfile(): void {
    const aut = this.author();
    if (!aut) return;
    if (aut.instructorId) {
      this.router.navigate(['/instructors', aut.instructorId]);
    } else {
      const inst = this.lms.getInstructorByEmail(aut.email);
      if (inst) {
        this.router.navigate(['/instructors', inst.id]);
      } else {
        this.openTagInstructorModal();
      }
    }
  }

  openTagInstructorModal(): void {
    const aut = this.author();
    if (!aut) return;
    this.tagInstructorSpecialization.set(aut.specialization || 'Curriculum Pedagogy');
    this.showTagInstructorModal.set(true);
  }

  closeTagInstructorModal(): void {
    this.showTagInstructorModal.set(false);
  }

  confirmTagAsInstructor(): void {
    const aut = this.author();
    if (!aut) return;
    const res = this.lms.tagAuthorAsInstructor(aut.id, {
      title: this.tagInstructorTitle(),
      department: this.tagInstructorDepartment(),
      specialization: [this.tagInstructorSpecialization()]
    });
    this.showTagInstructorModal.set(false);
    if (res.success && res.instructor) {
      this.router.navigate(['/instructors', res.instructor.id]);
    }
  }

  handleToggleStatus(): void {
    const current = this.author();
    if (!current) return;

    if (current.status === 'Inactive') {
      this.lms.activateAuthor(current.id);
      return;
    }

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

  finalizeDeactivationAfterResolutions(): void {
    const current = this.author();
    if (!current) return;

    if (this.blockedActiveRecords().length > 0) {
      this.lms.showToast(`Please reassign all ${this.blockedActiveRecords().length} remaining active course credits before finalizing deactivation.`, 'error', 4000, 'Credits Unresolved');
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

  getFileIcon(attachment: PersonnelAttachment): string {
    const ext = attachment.name.split('.').pop()?.toLowerCase() || '';
    if (attachment.isImage || attachment.type.startsWith('image/')) return 'image';
    if (attachment.type.includes('pdf') || ext === 'pdf') return 'picture_as_pdf';
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext) || attachment.type.includes('word')) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext) || attachment.type.includes('sheet')) return 'table_chart';
    if (['ppt', 'pptx'].includes(ext) || attachment.type.includes('presentation')) return 'slideshow';
    if (attachment.type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video_file';
    if (attachment.type.startsWith('audio/') || ['mp3', 'wav', 'aac', 'ogg', 'm4a'].includes(ext)) return 'audio_file';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || attachment.type.includes('zip')) return 'folder_zip';
    return 'draft';
  }

  openPreview(att: PersonnelAttachment): void {
    this.previewModalAttachment.set(att);
  }

  closePreview(): void {
    this.previewModalAttachment.set(null);
  }

  downloadAttachment(att: PersonnelAttachment): void {
    if (!att.url) return;
    const a = document.createElement('a');
    a.href = att.url;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.lms.showToast(`Downloading "${att.name}"...`, 'info', 2000);
  }
}
