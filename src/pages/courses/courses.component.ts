import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { CourseEntity, summarizeCourseMetrics, validateCourseEntity } from '../../models/course.model';
import { CourseStructureDrawerComponent } from './course-structure-drawer/course-structure-drawer.component';
import { CourseVersionModalComponent } from './course-version-modal/course-version-modal.component';

@Component({
  selector: 'app-courses',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    CourseStructureDrawerComponent, 
    CourseVersionModalComponent
  ],
  templateUrl: './courses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent {
  lms = inject(LmsDataService);
  router = inject(Router);

  // Search & Filter state
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('All'); // All, published, draft, inactive, superseded
  selectedCategory = signal<string>('All');
  selectedLayerCount = signal<string>('All'); // All, 1, 2, 3
  selectedFamily = signal<string>('All'); // All, learning, assessment
  selectedGradingMode = signal<string>('All'); // All, manual, auto
  selectedOwnerId = signal<string>('All');

  // Filter Drawer toggle
  showFilterDrawer = signal<boolean>(false);

  // View Mode: 'grid' | 'table'
  viewMode = signal<'grid' | 'table'>('grid');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(8);

  // Active Interactive Drawers & Modals
  activeStructureCourse = signal<CourseEntity | null>(null);
  activeVersionCourse = signal<CourseEntity | null>(null);

  // Save as Template Modal State
  showSaveTemplateModal = signal<boolean>(false);
  targetCourseForTemplate = signal<CourseEntity | null>(null);
  templateForm = signal<{ name: string; code: string; description: string; scope: 'lms' | 'organization' }>({
    name: '',
    code: '',
    description: '',
    scope: 'lms'
  });

  // Action Confirmation Modal
  confirmModal = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'primary' | 'warning';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    variant: 'primary',
    action: () => {}
  });

  // Filter options
  categories = [
    'All',
    'Compliance & Security',
    'Enterprise Leadership',
    'Healthcare & Safety',
    'Financial Inclusion & Microfinance',
    'Climate & Humanitarian Action',
    'Digital Transformation',
    'Operations & Field Management',
    'Customer Experience'
  ];

  // Base list of courses
  allCourses = computed<CourseEntity[]>(() => {
    return this.lms.activeLmsCourseEntities();
  });

  // Filtered courses
  filteredCourses = computed<CourseEntity[]>(() => {
    const list = this.allCourses();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus().toLowerCase();
    const cat = this.selectedCategory();
    const layers = this.selectedLayerCount();
    const fam = this.selectedFamily();
    const grading = this.selectedGradingMode();
    const owner = this.selectedOwnerId();

    return list.filter(c => {
      // Search
      const matchQuery = !q || (
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.ownerName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );

      // Status
      const matchStatus = status === 'all' || c.status.toLowerCase() === status;

      // Category
      const matchCat = cat === 'All' || c.category === cat;

      // Layers Count
      const matchLayers = layers === 'All' || c.structureConfig.layerCount.toString() === layers;

      // Metrics for Family & Grading
      const metrics = summarizeCourseMetrics(c);
      const matchFamily = fam === 'All' || 
        (fam === 'learning' && metrics.learningCount > 0) || 
        (fam === 'assessment' && metrics.assessmentCount > 0);

      const matchGrading = grading === 'All' || 
        (grading === 'manual' && metrics.manualGradingCount > 0) || 
        (grading === 'auto' && metrics.manualGradingCount === 0 && metrics.assessmentCount > 0);

      const matchOwner = owner === 'All' || c.ownerId === owner;

      return matchQuery && matchStatus && matchCat && matchLayers && matchFamily && matchGrading && matchOwner;
    });
  });

  // Active filter count for badge
  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() !== 'All') count++;
    if (this.selectedCategory() !== 'All') count++;
    if (this.selectedLayerCount() !== 'All') count++;
    if (this.selectedFamily() !== 'All') count++;
    if (this.selectedGradingMode() !== 'All') count++;
    if (this.selectedOwnerId() !== 'All') count++;
    return count;
  });

  // Empty state type determination
  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredCourses().length > 0) return 'none';
    if (this.allCourses().length === 0) return 'true_empty';
    if (this.searchQuery().trim().length > 0) return 'search_miss';
    return 'filter_miss';
  });

  // Pagination
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

  resetAllFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('All');
    this.selectedCategory.set('All');
    this.selectedLayerCount.set('All');
    this.selectedFamily.set('All');
    this.selectedGradingMode.set('All');
    this.selectedOwnerId.set('All');
    this.currentPage.set(1);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  // Quick Action Handlers
  openStructureDrawer(course: CourseEntity) {
    this.activeStructureCourse.set(course);
  }

  openVersionModal(course: CourseEntity) {
    this.activeVersionCourse.set(course);
  }

  editCourse(course: CourseEntity) {
    this.router.navigate(['/courses/edit', course.courseId]);
  }

  publishCourse(course: CourseEntity) {
    const val = validateCourseEntity(course);
    if (!val.publishable) {
      const err = val.warnings[0] || val.missingMandatoryFields[0] || 'Course failed publish validation gates.';
      this.lms.showToast(err, 'error', 5000, 'Publish Gate Blocked');
      return;
    }
    this.lms.publishCourseEntity(course.courseId);
  }

  duplicateCourse(course: CourseEntity) {
    this.lms.duplicateCourseEntity(course.courseId);
  }

  triggerNewVersion(course: CourseEntity) {
    this.lms.createNewCourseVersion(course.courseId);
    this.activeVersionCourse.set(null);
  }

  confirmDeactivate(course: CourseEntity) {
    this.confirmModal.set({
      isOpen: true,
      title: `Deactivate Course "${course.title}"?`,
      message: `Deactivating this course will hide it from new plan catalogs. Running plan phases (${course.usedInPhasesCount || 0} active phases) pinned to this snapshot will continue without disruption.`,
      confirmLabel: 'Deactivate Course',
      variant: 'warning',
      action: () => {
        this.lms.deactivateCourseEntity(course.courseId);
        this.closeConfirmModal();
      }
    });
  }

  confirmReactivate(course: CourseEntity) {
    this.lms.reactivateCourseEntity(course.courseId);
  }

  closeConfirmModal() {
    this.confirmModal.update(m => ({ ...m, isOpen: false }));
  }

  // Save as Template Modal
  openSaveAsTemplate(course: CourseEntity) {
    this.targetCourseForTemplate.set(course);
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.templateForm.set({
      name: `${course.title} Blueprint`,
      code: `TMP-${course.category.substring(0, 3).toUpperCase()}-${rand}`,
      description: `Instructional blueprint extracted from course "${course.title}".`,
      scope: 'lms'
    });
    this.showSaveTemplateModal.set(true);
  }

  confirmSaveAsTemplate() {
    const course = this.targetCourseForTemplate();
    if (!course) return;

    const form = this.templateForm();
    if (!form.name.trim()) {
      this.lms.showToast('Please provide a template name.', 'error', 3500, 'Name Required');
      return;
    }

    this.lms.saveCourseStructureAsTemplate(course.courseId, {
      name: form.name.trim(),
      code: form.code.trim() || `TMP-${Date.now()}`,
      description: form.description.trim(),
      scope: form.scope
    });

    this.showSaveTemplateModal.set(false);
    this.targetCourseForTemplate.set(null);
  }

  copyCourseCode(code: string, event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(code);
    this.lms.showToast(`Copied code "${code}" to clipboard.`, 'info', 2000, 'Copied');
  }

  getMetrics(course: CourseEntity) {
    return summarizeCourseMetrics(course);
  }
}
