import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { Course, CourseCategory, CourseLevel } from '../../models/lms.model';

@Component({
  selector: 'app-courses',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './courses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent {
  lms = inject(LmsDataService);
  router = inject(Router);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedLevel = signal<string>('All');
  mandatoryOnly = signal<boolean>(false);
  showCreateModal = signal<boolean>(false);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  categories: string[] = ['All', 'Compliance & Security', 'Engineering', 'Healthcare', 'Finance', 'AI & Data', 'Leadership'];
  levels: string[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // New Course Builder form
  newCourse = {
    title: '',
    subtitle: '',
    description: '',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    category: 'Compliance & Security' as CourseCategory,
    level: 'Intermediate' as CourseLevel,
    durationMinutes: 60,
    isMandatory: false,
    complianceDeadlineDays: 14,
    instructorName: '',
    instructorTitle: 'Subject Matter Expert',
    certificateEnabled: true,
    initialLessonTitle: '1.1 Foundations & Regulatory Framework',
    initialLessonType: 'video' as const
  };

  // Filtered courses
  filteredCourses = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    const lvl = this.selectedLevel();
    const mandatory = this.mandatoryOnly();
    const courses = this.lms.tenantCourses();

    return courses.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.instructorName.toLowerCase().includes(q);
      const matchCat = cat === 'All' || c.category === cat;
      const matchLvl = lvl === 'All' || c.level === lvl;
      const matchMandatory = !mandatory || c.isMandatory;
      return matchSearch && matchCat && matchLvl && matchMandatory;
    });
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredCourses().length / this.pageSize()));
  });

  paginatedCourses = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCourses().slice(start, start + this.pageSize());
  });

  pagesList = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onFilterChange() {
    this.currentPage.set(1);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  // Get user's enrollment for a course
  getEnrollment(courseId: string) {
    const user = this.lms.activeUser();
    return this.lms.enrollments().find(e => e.courseId === courseId && e.userId === user.id);
  }

  // Quick enroll & launch
  enrollAndLaunch(courseId: string) {
    const user = this.lms.activeUser();
    this.lms.enrollInCourse(courseId, user.id);
    this.router.navigate(['/courses', courseId, 'learn']);
  }

  openCreateModal() {
    this.newCourse = {
      title: '',
      subtitle: '',
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      category: 'Compliance & Security',
      level: 'Intermediate',
      durationMinutes: 60,
      isMandatory: false,
      complianceDeadlineDays: 14,
      instructorName: this.lms.activeUser().name,
      instructorTitle: 'Senior Instructor',
      certificateEnabled: true,
      initialLessonTitle: '1.1 Core Principles & Architecture',
      initialLessonType: 'video'
    };
    this.showCreateModal.set(true);
  }

  saveCourse() {
    if (!this.newCourse.title.trim()) return;

    this.lms.addCourse({
      title: this.newCourse.title,
      subtitle: this.newCourse.subtitle || 'Essential mastery module',
      description: this.newCourse.description || 'Structured course curriculum designed for organizational skill progression.',
      coverImage: this.newCourse.coverImage,
      category: this.newCourse.category,
      level: this.newCourse.level,
      durationMinutes: Number(this.newCourse.durationMinutes) || 60,
      isMandatory: this.newCourse.isMandatory,
      complianceDeadlineDays: this.newCourse.isMandatory ? this.newCourse.complianceDeadlineDays : undefined,
      instructorName: this.newCourse.instructorName || this.lms.activeUser().name,
      instructorTitle: this.newCourse.instructorTitle,
      certificateEnabled: this.newCourse.certificateEnabled,
      modules: [
        {
          id: `mod-${Date.now()}-1`,
          title: 'Module 1: Foundations & Core Concepts',
          durationMinutes: Math.round((Number(this.newCourse.durationMinutes) || 60) / 2),
          lessons: [
            {
              id: `les-${Date.now()}-1`,
              title: this.newCourse.initialLessonTitle,
              type: this.newCourse.initialLessonType,
              durationMinutes: 20,
              summary: 'Overview and essential fundamentals.',
              videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
              contentHtml: '<p class="text-text-secondary">Welcome to this comprehensive course module. Study the material and complete the knowledge assessments to earn your official certificate.</p>'
            }
          ]
        },
        {
          id: `mod-${Date.now()}-2`,
          title: 'Module 2: Verification Assessment & Certification',
          durationMinutes: Math.round((Number(this.newCourse.durationMinutes) || 60) / 2),
          lessons: [
            {
              id: `les-${Date.now()}-2`,
              title: '2.1 Comprehensive Knowledge Assessment',
              type: 'quiz',
              durationMinutes: 15,
              summary: 'Official knowledge verification quiz.',
              passingScorePercent: 75,
              quizQuestions: [
                {
                  id: 'cq1',
                  question: `What is the primary objective of this ${this.newCourse.title} framework?`,
                  options: [
                    'Adhere to organizational standards and best practices',
                    'Bypass regular compliance reviews',
                    'Eliminate all structured documentation',
                    'Rely strictly on legacy procedures'
                  ],
                  correctAnswerIndex: 0,
                  explanation: 'Adherence to organizational compliance and proven industry standards is paramount.',
                  points: 50
                },
                {
                  id: 'cq2',
                  question: 'How frequently should regulatory verification audits be reviewed?',
                  options: [
                    'Continuously and upon every major system or regulatory shift',
                    'Once every 10 years only',
                    'Never after initial onboarding',
                    'Only when severe penalties occur'
                  ],
                  correctAnswerIndex: 0,
                  explanation: 'Continuous auditing and real-time posture assessment ensure seamless compliance.',
                  points: 50
                }
              ]
            }
          ]
        }
      ]
    });

    this.showCreateModal.set(false);
  }
}
