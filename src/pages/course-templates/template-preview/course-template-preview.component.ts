import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import {
  CourseTemplate,
  CourseTemplateStatus,
  CourseSlotType,
  calculateTemplateDuration,
  countTemplateSlots
} from '../../../models/course-template.model';
import { CourseCategory, CourseLevel } from '../../../models/lms.model';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-course-template-preview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CustomAvatarComponent,
    CustomSelectComponent
  ],
  templateUrl: './course-template-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseTemplatePreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lms = inject(LmsDataService);
  private confirmModal = inject(ConfirmationModalService);

  templateId = signal<string | null>(null);

  // Active Template derived from repository
  template = computed<CourseTemplate | null>(() => {
    const id = this.templateId();
    if (!id) return null;
    const all = this.lms.scopedCourseTemplates();
    return all.find(t => t.id === id) || null;
  });

  // Active module tab / accordion expansion
  selectedModuleIndex = signal<number>(0);
  activeSlotFilter = signal<string>('all');

  // Spawn Course Modal State
  spawnModalOpen = signal<boolean>(false);
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

  spawnCategoryOptions: SelectOption[] = [
    { value: 'Compliance & Security', label: 'Compliance & Security', icon: 'verified_user' },
    { value: 'Credit Operations', label: 'Credit Operations', icon: 'account_balance' },
    { value: 'Social Development', label: 'Social Development', icon: 'diversity_3' },
    { value: 'Digital Banking Systems', label: 'Digital Banking Systems', icon: 'devices' },
    { value: 'Leadership & Risk', label: 'Leadership & Risk', icon: 'military_tech' },
    { value: 'Core Field Operations', label: 'Core Field Operations', icon: 'terrain' }
  ];

  spawnLevelOptions: SelectOption[] = [
    { value: 'Foundational', label: 'Foundational / Beginner', icon: 'grade' },
    { value: 'Intermediate', label: 'Intermediate Practitioner', icon: 'workspace_premium' },
    { value: 'Advanced', label: 'Advanced Masterclass', icon: 'military_tech' }
  ];

  activeUser = computed(() => this.lms.activeUser());
  activeTenant = computed(() => this.lms.activeTenant());
  activeLms = computed(() => this.lms.activeLms());
  permissions = computed(() => this.lms.courseTemplatePermissions());

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.templateId.set(id);
      }
    });
  }

  getDuration(template: CourseTemplate): number {
    return calculateTemplateDuration(template.structure);
  }

  getSlotCount(template: CourseTemplate): number {
    return countTemplateSlots(template.structure);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    return dateStr;
  }

  getStatusBadgeClass(status?: CourseTemplateStatus): string {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'draft':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'inactive':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }

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

  getSlotTypeBadgeClass(type: CourseSlotType): string {
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

  // Spawn Course Modal Actions
  openSpawnModal(template: CourseTemplate) {
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
  }

  closeSpawnModal() {
    this.spawnModalOpen.set(false);
  }

  submitSpawnCourse() {
    const tpl = this.template();
    if (!tpl) return;

    const form = this.spawnForm();
    if (!form.title.trim()) {
      this.lms.showToast('Please provide a course title.', 'error', 3500, 'Title Required');
      return;
    }

    const result = this.lms.createCourseFromTemplate(tpl.id, {
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

  duplicateTemplate(tpl: CourseTemplate) {
    const copy = this.lms.duplicateCourseTemplate(tpl.id);
    if (copy) {
      this.router.navigate(['/courses/templates/preview', copy.id]);
    }
  }

  toggleStatus(tpl: CourseTemplate) {
    if (tpl.status === 'active') {
      this.confirmModal.confirm({
        title: 'Deactivate Course Template?',
        message: `Are you sure you want to deactivate "${tpl.name}"? New courses will not be able to select this template.`,
        confirmText: 'Deactivate Template',
        iconType: 'warning',
        onConfirm: () => {
          this.lms.deactivateCourseTemplate(tpl.id);
        }
      });
    } else {
      this.lms.reactivateCourseTemplate(tpl.id);
    }
  }

  deleteTemplate(tpl: CourseTemplate) {
    this.confirmModal.confirm({
      title: 'Delete Course Template?',
      message: `Are you sure you want to delete template "${tpl.name}"? This action removes the blueprint permanently from the template library.`,
      confirmText: 'Delete Permanently',
      iconType: 'danger',
      onConfirm: () => {
        this.lms.deleteCourseTemplate(tpl.id);
        this.router.navigate(['/courses/templates']);
      }
    });
  }
}
