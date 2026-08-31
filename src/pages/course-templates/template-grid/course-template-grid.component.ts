import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import {
  CourseTemplate,
  CourseTemplateStatus,
  CourseTemplateScope,
  CourseSlotType,
  CourseTemplateModule,
  CourseTemplateSlot,
  calculateTemplateDuration,
  countTemplateSlots
} from '../../../models/course-template.model';
import { CourseCategory, CourseLevel } from '../../../models/lms.model';

@Component({
  selector: 'app-course-template-grid',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './course-template-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseTemplateGridComponent {
  lms = inject(LmsDataService);
  private router = inject(Router);
  private confirmModal = inject(ConfirmationModalService);

  // View Layout Mode
  viewMode = signal<'grid' | 'table'>('grid');

  // Search & Filter State
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedScope = signal<string>('all');
  selectedCategory = signal<string>('all');
  sortBy = signal<'updated_desc' | 'updated_asc' | 'name_asc' | 'used_desc'>('updated_desc');
  showFilterDrawer = signal<boolean>(false);

  // Blueprint Inspection Modal State
  inspectTemplate = signal<CourseTemplate | null>(null);

  // Spawn Course Modal State
  spawnModalOpen = signal<boolean>(false);
  spawnTemplate = signal<CourseTemplate | null>(null);
  spawnForm = signal<{
    title: string;
    subtitle: string;
    description: string;
    category: CourseCategory;
    level: CourseLevel;
    instructorName: string;
    isMandatory: boolean;
  }>({
    title: '',
    subtitle: '',
    description: '',
    category: 'Compliance & Security',
    level: 'Intermediate',
    instructorName: '',
    isMandatory: false
  });

  // Visibility Manager Modal State
  visibilityModalTemplate = signal<CourseTemplate | null>(null);
  visibilityMode = signal<'all_lms_instructors' | 'restricted' | 'org_wide'>('all_lms_instructors');

  // Role permissions
  permissions = this.lms.courseTemplatePermissions;

  // Active User / Tenant / LMS info
  activeTenant = this.lms.activeTenant;
  activeLms = this.lms.activeLms;
  activeUser = this.lms.activeUser;
  stats = this.lms.courseTemplateStats;

  // Categories list
  categories = signal<string[]>([
    'Compliance & Security',
    'AI & Data',
    'Clinical Healthcare',
    'Finance',
    'Microfinance & Social Development',
    'Engineering',
    'Leadership & Soft Skills',
    'General'
  ]);

  // Filtered & Sorted Templates
  filteredTemplates = computed<CourseTemplate[]>(() => {
    let list = this.lms.scopedCourseTemplates();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();
    const scope = this.selectedScope();
    const category = this.selectedCategory();
    const sort = this.sortBy();

    // 1. Search Query (Name, Code, CreatedBy, Description)
    if (query) {
      list = list.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.code.toLowerCase().includes(query) ||
        t.createdBy.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.categoryTags && t.categoryTags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // 2. Status Filter
    if (status !== 'all') {
      list = list.filter(t => t.status === status);
    }

    // 3. Scope Filter
    if (scope !== 'all') {
      list = list.filter(t => t.scope === scope);
    }

    // 4. Category Filter
    if (category !== 'all') {
      list = list.filter(t => t.categoryTags && t.categoryTags.includes(category));
    }

    // 5. Sorting
    return [...list].sort((a, b) => {
      if (sort === 'updated_desc') {
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      } else if (sort === 'updated_asc') {
        return (a.updatedAt || '').localeCompare(b.updatedAt || '');
      } else if (sort === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (sort === 'used_desc') {
        return (b.usedCount || 0) - (a.usedCount || 0);
      }
      return 0;
    });
  });

  // Calculate duration helper
  getDuration(template: CourseTemplate): number {
    return calculateTemplateDuration(template.structure);
  }

  // Count slots helper
  getSlotCount(template: CourseTemplate): number {
    return countTemplateSlots(template.structure);
  }

  // Open Blueprint Inspection Modal
  openInspect(template: CourseTemplate) {
    this.inspectTemplate.set(template);
  }

  closeInspect() {
    this.inspectTemplate.set(null);
  }

  // Open Spawn Course Modal
  openSpawnModal(template: CourseTemplate) {
    this.spawnTemplate.set(template);
    this.spawnForm.set({
      title: `${template.name} - Cohort ${new Date().getFullYear()}`,
      subtitle: template.description || 'Instructional curriculum created from standardized blueprint',
      description: template.description || '',
      category: (template.categoryTags?.[0] as CourseCategory) || 'Compliance & Security',
      level: 'Intermediate',
      instructorName: this.activeUser().name,
      isMandatory: false
    });
    this.spawnModalOpen.set(true);
    // Close inspect if open
    this.inspectTemplate.set(null);
  }

  closeSpawnModal() {
    this.spawnModalOpen.set(false);
    this.spawnTemplate.set(null);
  }

  submitSpawnCourse() {
    const template = this.spawnTemplate();
    if (!template) return;

    const form = this.spawnForm();
    if (!form.title.trim()) {
      this.lms.showToast('Please provide a course title.', 'error', 3500, 'Title Required');
      return;
    }

    const result = this.lms.createCourseFromTemplate(template.id, {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      category: form.category,
      level: form.level,
      instructorName: form.instructorName.trim(),
      isMandatory: form.isMandatory
    });

    if (result.success && result.course) {
      this.closeSpawnModal();
      this.router.navigate(['/courses']);
    }
  }

  // Duplicate
  duplicate(template: CourseTemplate) {
    this.lms.duplicateCourseTemplate(template.id);
  }

  // Toggle Deactivate / Reactivate
  toggleStatus(template: CourseTemplate) {
    if (template.status === 'active') {
      this.confirmModal.confirm({
        title: 'Deactivate Course Template?',
        message: `Are you sure you want to deactivate "${template.name}"? New courses will not be able to select this template. Any already created courses will continue to run normally without disruption.`,
        confirmText: 'Deactivate Template',
        iconType: 'warning',
        onConfirm: () => {
          this.lms.deactivateCourseTemplate(template.id);
        }
      });
    } else {
      this.lms.reactivateCourseTemplate(template.id);
    }
  }

  // Delete Template
  deleteTemplate(template: CourseTemplate) {
    this.confirmModal.confirm({
      title: 'Delete Course Template?',
      message: `Are you sure you want to delete template "${template.name}"? This action removes the blueprint permanently from the template library.`,
      confirmText: 'Delete Permanently',
      iconType: 'danger',
      onConfirm: () => {
        this.lms.deleteCourseTemplate(template.id);
      }
    });
  }

  // Open Visibility Settings
  openVisibilityModal(template: CourseTemplate) {
    this.visibilityModalTemplate.set(template);
    this.visibilityMode.set(template.visibility?.mode || 'all_lms_instructors');
  }

  closeVisibilityModal() {
    this.visibilityModalTemplate.set(null);
  }

  saveVisibility() {
    const template = this.visibilityModalTemplate();
    if (!template) return;

    this.lms.updateTemplateVisibility(template.id, {
      mode: this.visibilityMode()
    });
    this.closeVisibilityModal();
  }

  // Get Slot Type Icon
  getSlotTypeIcon(type: CourseSlotType): string {
    switch (type) {
      case 'video': return 'videocam';
      case 'article': return 'article';
      case 'quiz': return 'quiz';
      case 'interactive_lab': return 'science';
      case 'simulation': return 'smart_toy';
      case 'scorm': return 'extension';
      default: return 'menu_book';
    }
  }

  // Get Slot Type Color
  getSlotTypeColor(type: CourseSlotType): string {
    switch (type) {
      case 'video': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'article': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'quiz': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'interactive_lab': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'simulation': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'scorm': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  }
}
