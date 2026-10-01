import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { InstructorProfile, InstructorAssignmentRecord, InstructorDeactivationResolution } from '../../../models/instructor.model';
import { PersonnelAttachment } from '../../../models/author.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { ComposeEmailModalComponent } from '../../../components/compose-email-modal/compose-email-modal.component';

export interface FeedbackSnippet {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface EnrichedInstructorAssignment extends InstructorAssignmentRecord {
  courseCode: string;
  courseTitle: string;
  courseCategory: string;
  courseCover?: string;
  deliveryMode: string;
  completionRatePct: number;
  completedLearners: number;
  enrolledLearners: number;
  instructorRating: number;
  reviewsCount: number;
  version: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  feedbackSnippets: FeedbackSnippet[];
}

@Component({
  selector: 'app-instructor-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent, ComposeEmailModalComponent],
  templateUrl: './instructor-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorDetailsComponent implements OnInit {
  lms = inject(LmsDataService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  instructorId = signal<string>('');
  activeTab = signal<'dashboard' | 'details' | 'feedback' | 'bio' | 'profile'>('dashboard');
  selectedDeliveryModeFilter = signal<string>('all');
  selectedLayerFilter = signal<string>('all');
  searchQuery = signal<string>('');

  previewModalAttachment = signal<PersonnelAttachment | null>(null);

  // Email modal state
  showEmailModal = signal<boolean>(false);
  emailRecipient = computed(() => {
    const inst = this.instructor();
    if (!inst) return null;
    return { name: inst.name, email: inst.email };
  });

  // Selected feedback drilldown
  selectedCourseFeedback = signal<EnrichedInstructorAssignment | null>(null);

  // Tag as Author Modal State
  showTagAuthorModal = signal<boolean>(false);
  tagAuthorSpecialization = signal<string>('Instructional Curriculum Design');
  tagAuthorBio = signal<string>('');

  // Active Instructor profile
  instructor = computed<InstructorProfile | undefined>(() => {
    const id = this.instructorId();
    if (!id) return undefined;
    return this.lms.getInstructorById(id);
  });

  // Raw assignments for this instructor
  assignments = computed<InstructorAssignmentRecord[]>(() => {
    const id = this.instructorId();
    if (!id) return [];
    return this.lms.getInstructorAssignments(id);
  });

  // Sample feedback repository
  private feedbackBank: FeedbackSnippet[][] = [
    [
      { author: 'Tanvir Hossain', rating: 5, comment: 'Dr. Amina explains microfinance field credit cycles with exceptional clarity and real-world branch examples.', date: '14 Feb 2026' },
      { author: 'Nusrat Jahan', rating: 5, comment: 'The interactive case studies and live Q&A session made complex compliance regulations easy to understand.', date: '02 Feb 2026' }
    ],
    [
      { author: 'Sajjad Karim', rating: 5, comment: 'Practical, engaging, and directly applicable to our daily branch disbursement operations.', date: '28 Jan 2026' },
      { author: 'Meherun Nisa', rating: 4, comment: 'Great pacing and structured slides. Highly recommend this module for new field officers.', date: '18 Jan 2026' }
    ],
    [
      { author: 'Anisur Rahman', rating: 5, comment: 'Superb pedagogical structure and very supportive instructor throughout the training cohort.', date: '10 Jan 2026' }
    ]
  ];

  // Enriched assignment records
  enrichedAssignments = computed<EnrichedInstructorAssignment[]>(() => {
    const records = this.assignments();
    const allCourses = this.lms.courses();
    const modes = ['Online Interactive', 'In-Person Workshop', 'Blended Classroom', 'Live Virtual Lab'];

    if (records.length === 0 && this.instructor()) {
      // Fallback default sample assignments if newly seeded
      const inst = this.instructor()!;
      return [
        {
          id: `asg-${inst.id}-1`,
          instructorId: inst.id,
          instructorName: inst.name,
          instructorEmail: inst.email,
          courseId: 'crs-101',
          courseName: 'BRAC Microfinance Credit Operations & Risk Compliance',
          courseTitle: 'BRAC Microfinance Credit Operations & Risk Compliance',
          courseCode: 'CRS-FIN-101',
          courseCategory: 'Microfinance & Branch Banking',
          courseCover: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80',
          deliveryMode: 'Blended Classroom',
          layer: 'Chapter 1: Field Credit Risk Assessment',
          layerType: 'module',
          lmsId: 'LMS-1972-01',
          lmsName: 'Enterprise Leadership Portal',
          courseStatus: 'Published',
          assignedDate: '15/01/2026',
          completionRatePct: 92,
          completedLearners: 138,
          enrolledLearners: 150,
          instructorRating: 4.9,
          reviewsCount: 42,
          version: 'v2.1',
          lastUpdatedBy: inst.name,
          lastUpdatedAt: '12/02/2026',
          feedbackSnippets: this.feedbackBank[0]
        },
        {
          id: `asg-${inst.id}-2`,
          instructorId: inst.id,
          instructorName: inst.name,
          instructorEmail: inst.email,
          courseId: 'crs-102',
          courseName: 'Community Health Worker Field Practicum',
          courseTitle: 'Community Health Worker Field Practicum',
          courseCode: 'CRS-HLT-204',
          courseCategory: 'Health & Community Development',
          courseCover: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
          deliveryMode: 'In-Person Workshop',
          layer: 'Topic 2.1: Maternal & Newborn Nutrition Protocol',
          layerType: 'lesson',
          lmsId: 'LMS-1972-03',
          lmsName: 'Health & Nutrition Training Portal',
          courseStatus: 'Published',
          assignedDate: '01/02/2026',
          completionRatePct: 88,
          completedLearners: 97,
          enrolledLearners: 110,
          instructorRating: 4.8,
          reviewsCount: 28,
          version: 'v1.4',
          lastUpdatedBy: inst.name,
          lastUpdatedAt: '10/02/2026',
          feedbackSnippets: this.feedbackBank[1]
        }
      ];
    }

    return records.map((asg, idx) => {
      const course = allCourses.find(c => c.id === asg.courseId || c.title.toLowerCase() === asg.courseName.toLowerCase());
      const enrolled = 75 + (idx * 23) % 95;
      const completionRate = Math.min(99, 82 + (idx * 4) % 17);
      const completed = Math.round((enrolled * completionRate) / 100);
      const rating = Number((4.7 + ((idx * 3) % 4) * 0.1).toFixed(1));
      const reviews = 18 + (idx * 5) % 30;
      const mode = modes[idx % modes.length];
      const snippets = this.feedbackBank[idx % this.feedbackBank.length];

      return {
        ...asg,
        courseTitle: asg.courseName || course?.title || 'Core Training Curriculum',
        courseCode: course ? `CRS-${course.id.slice(-4).toUpperCase()}` : `CRS-${asg.courseId.slice(-4).toUpperCase()}`,
        courseCategory: course?.category || 'Professional & Technical Skills',
        courseCover: course?.coverImage || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80',
        deliveryMode: mode,
        completionRatePct: completionRate,
        completedLearners: completed,
        enrolledLearners: enrolled,
        instructorRating: rating,
        reviewsCount: reviews,
        version: `v${(idx % 2) + 1}.0`,
        lastUpdatedBy: asg.instructorName,
        lastUpdatedAt: asg.assignedDate || '15/02/2026',
        feedbackSnippets: snippets
      };
    });
  });

  // KPI Metrics Computed
  kpiTotalCourses = computed(() => {
    const list = this.enrichedAssignments();
    const unique = new Set(list.map(r => r.courseId));
    return unique.size || list.length || 2;
  });

  kpiActiveLearners = computed(() => {
    const total = this.enrichedAssignments().reduce((acc, r) => acc + r.enrolledLearners, 0);
    return total || 260;
  });

  kpiAvgCompletionRate = computed(() => {
    const list = this.enrichedAssignments();
    if (list.length === 0) return 91;
    const sum = list.reduce((acc, r) => acc + r.completionRatePct, 0);
    return Math.round(sum / list.length);
  });

  kpiAvgRating = computed(() => {
    const list = this.enrichedAssignments();
    if (list.length === 0) return 4.9;
    const sum = list.reduce((acc, r) => acc + r.instructorRating, 0);
    return Number((sum / list.length).toFixed(1));
  });

  kpiTotalReviews = computed(() => {
    const sum = this.enrichedAssignments().reduce((acc, r) => acc + r.reviewsCount, 0);
    return sum || 70;
  });

  kpiTotalHours = computed(() => {
    return this.enrichedAssignments().length * 24 + 48;
  });

  kpiAssociatedLmsCount = computed(() => {
    const portals = new Set(this.enrichedAssignments().map(r => r.lmsId));
    return portals.size || 2;
  });

  // Delivery Mode options for custom select filter
  deliveryModeOptions: SelectOption[] = [
    { value: 'all', label: 'All Delivery Modes', sublabel: 'Filter across all modes', icon: 'hub' },
    { value: 'Online Interactive', label: 'Online Interactive', sublabel: 'Self-paced / e-Learning', icon: 'devices' },
    { value: 'In-Person Workshop', label: 'In-Person Workshop', sublabel: 'Physical classroom & lab', icon: 'groups' },
    { value: 'Blended Classroom', label: 'Blended Classroom', sublabel: 'Hybrid delivery', icon: 'layers' },
    { value: 'Live Virtual Lab', label: 'Live Virtual Lab', sublabel: 'Synchronous online cohort', icon: 'video_camera_front' }
  ];

  filteredAssignments = computed(() => {
    let records = this.enrichedAssignments();
    const modeFilter = this.selectedDeliveryModeFilter();
    const layerFilter = this.selectedLayerFilter();
    const query = this.searchQuery().trim().toLowerCase();

    if (modeFilter !== 'all') {
      records = records.filter(r => r.deliveryMode.toLowerCase().includes(modeFilter.toLowerCase()));
    }
    if (layerFilter !== 'all') {
      records = records.filter(r => r.layerType.toLowerCase().includes(layerFilter.toLowerCase()));
    }
    if (query) {
      records = records.filter(r =>
        r.courseTitle.toLowerCase().includes(query) ||
        r.courseCode.toLowerCase().includes(query) ||
        r.layer.toLowerCase().includes(query)
      );
    }
    return records;
  });

  // Blocked Deactivation Modal State
  showBlockedModal = signal<boolean>(false);
  blockedActiveRecords = signal<InstructorAssignmentRecord[]>([]);
  reassignmentSelections = signal<Record<string, string>>({});

  resolutionOptions = computed<SelectOption[]>(() => {
    const current = this.instructor();
    const active = this.lms.activeInstructors().filter(i => !current || i.id !== current.id);
    return active.map(cand => ({
      value: cand.id,
      label: cand.name,
      sublabel: Array.isArray(cand.specialization) ? cand.specialization.join(', ') : cand.specialization,
      avatar: cand.avatar,
      icon: 'person'
    }));
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.instructorId.set(id);
      }
    });
  }

  switchToAuthorProfile(): void {
    const inst = this.instructor();
    if (!inst) return;
    if (inst.authorId) {
      this.router.navigate(['/authors', inst.authorId]);
    } else {
      const aut = this.lms.getAuthorByEmail(inst.email);
      if (aut) {
        this.router.navigate(['/authors', aut.id]);
      } else {
        this.openTagAuthorModal();
      }
    }
  }

  openTagAuthorModal(): void {
    const inst = this.instructor();
    if (!inst) return;
    this.tagAuthorBio.set(inst.bio || '');
    this.showTagAuthorModal.set(true);
  }

  closeTagAuthorModal(): void {
    this.showTagAuthorModal.set(false);
  }

  confirmTagAsAuthor(): void {
    const inst = this.instructor();
    if (!inst) return;
    const res = this.lms.tagInstructorAsAuthor(inst.id, {
      specialization: this.tagAuthorSpecialization(),
      bio: this.tagAuthorBio()
    });
    this.showTagAuthorModal.set(false);
    if (res.success && res.author) {
      this.router.navigate(['/authors', res.author.id]);
    }
  }

  openEmailModal(): void {
    this.showEmailModal.set(true);
  }

  openEditModal(): void {
    const inst = this.instructor();
    if (inst) {
      this.router.navigate(['/instructors/edit', inst.id]);
    }
  }

  toggleStatus(): void {
    const current = this.instructor();
    if (!current) return;

    if (current.status === 'Inactive') {
      this.lms.activateInstructor(current.id);
      return;
    }

    const check = this.lms.checkInstructorDeactivationBlocked(current.id);
    if (check.isBlocked) {
      this.blockedActiveRecords.set(check.activeRecords);
      const initialReplacements: Record<string, string> = {};
      const firstAvailable = this.lms.activeInstructors().find(i => i.id !== current.id);
      if (firstAvailable) {
        check.activeRecords.forEach(asg => {
          initialReplacements[asg.id] = firstAvailable.id;
        });
      }
      this.reassignmentSelections.set(initialReplacements);
      this.showBlockedModal.set(true);
    } else {
      this.lms.deactivateInstructor(current.id);
    }
  }

  setResolutionAction(assignmentId: string, replacementInstructorId: string): void {
    this.reassignmentSelections.update(map => ({ ...map, [assignmentId]: replacementInstructorId }));
  }

  resolveAndDeactivate(): void {
    const current = this.instructor();
    if (!current) return;

    for (const rec of this.blockedActiveRecords()) {
      const repId = this.reassignmentSelections()[rec.id];
      if (repId) {
        const resolution: InstructorDeactivationResolution = {
          assignmentId: rec.id,
          courseId: rec.courseId,
          layer: rec.layer,
          action: 'reassign',
          replacementInstructorId: repId
        };
        this.lms.resolveInstructorAssignment(resolution);
      }
    }

    this.lms.deactivateInstructor(current.id, true);
    this.showBlockedModal.set(false);
  }

  viewCourseFeedback(item: EnrichedInstructorAssignment): void {
    this.selectedCourseFeedback.set(item);
  }

  closeFeedbackModal(): void {
    this.selectedCourseFeedback.set(null);
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
