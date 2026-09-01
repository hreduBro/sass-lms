import { Component, ChangeDetectionStrategy, inject, signal, computed, HostListener } from '@angular/core';
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
  calculateTemplateDuration,
  countTemplateSlots
} from '../../../models/course-template.model';
import { CourseCategory, CourseLevel } from '../../../models/lms.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';

export interface TemplateGridFilters {
  status: CourseTemplateStatus[];
  scope: CourseTemplateScope[];
  category: string[];
  createdDateFrom: string;
  createdDateTo: string;
  sortBy: 'updated_desc' | 'updated_asc' | 'name_asc' | 'used_desc';
}

@Component({
  selector: 'app-course-template-grid',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CustomSelectComponent,
    CustomAvatarComponent
  ],
  templateUrl: './course-template-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseTemplateGridComponent {
  lms = inject(LmsDataService);
  private router = inject(Router);
  private confirmModal = inject(ConfirmationModalService);

  // View Mode: 'grid' | 'table'
  viewMode = signal<'grid' | 'table'>('table');

  // Search & Filter State
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedCategory = signal<string>('all');
  selectedScope = signal<string>('all');
  sortBy = signal<'updated_desc' | 'updated_asc' | 'name_asc' | 'used_desc'>('updated_desc');
  selectedCategoryQuick = signal<string>('All');

  // Filter Panel Drawer State
  isFilterPanelOpen = signal<boolean>(false);

  // Custom Select Options for Filter Drawer
  statusSelectOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses', icon: 'all_inclusive' },
    { value: 'active', label: 'Active', icon: 'check_circle', badge: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    { value: 'draft', label: 'Draft', icon: 'draft', badge: 'Draft', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    { value: 'inactive', label: 'Inactive', icon: 'pause_circle', badge: 'Inactive', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
  ];

  scopeSelectOptions: SelectOption[] = [
    { value: 'all', label: 'All Scopes', icon: 'public' },
    { value: 'lms', label: 'LMS Workspace Only', icon: 'domain', sublabel: 'Available within this LMS instance' },
    { value: 'organization', label: 'Organization-wide', icon: 'corporate_fare', sublabel: 'Shared across all LMS workspaces' }
  ];

  categorySelectOptions = computed<SelectOption[]>(() => {
    return [
      { value: 'all', label: 'All Categories', icon: 'category' },
      ...this.categories.map(c => ({
        value: c,
        label: c,
        icon: 'auto_stories'
      }))
    ];
  });

  sortSelectOptions: SelectOption[] = [
    { value: 'updated_desc', label: 'Recently Updated', icon: 'schedule' },
    { value: 'updated_asc', label: 'Oldest Updated', icon: 'history' },
    { value: 'name_asc', label: 'Name (A-Z)', icon: 'sort_by_alpha' },
    { value: 'used_desc', label: 'Most Adopted', icon: 'trending_up' }
  ];

  draftFilters = signal<TemplateGridFilters>({
    status: [],
    scope: [],
    category: [],
    createdDateFrom: '',
    createdDateTo: '',
    sortBy: 'updated_desc'
  });

  appliedFilters = signal<TemplateGridFilters>({
    status: [],
    scope: [],
    category: [],
    createdDateFrom: '',
    createdDateTo: '',
    sortBy: 'updated_desc'
  });

  // Action Menu Dropdown State (Floating Fixed Menu like Plan Grid)
  activeMenuTemplate = signal<CourseTemplate | null>(null);
  menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Pagination / Load More
  displayedCount = signal<number>(12);
  pageSizeIncrement = 12;

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

  // Context & permissions
  permissions = this.lms.courseTemplatePermissions;
  activeTenant = this.lms.activeTenant;
  activeLms = this.lms.activeLms;
  activeUser = this.lms.activeUser;
  stats = this.lms.courseTemplateStats;

  // Categories list
  categories: string[] = [
    'Compliance & Security',
    'AI & Data',
    'Clinical Healthcare',
    'Finance',
    'Microfinance & Social Development',
    'Engineering',
    'Leadership & Soft Skills',
    'General'
  ];

  statusOptions: { value: CourseTemplateStatus; label: string; badgeClass: string }[] = [
    { value: 'active', label: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { value: 'draft', label: 'Draft', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { value: 'inactive', label: 'Inactive', badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' }
  ];

  scopeOptions: { value: CourseTemplateScope; label: string; description: string }[] = [
    { value: 'lms', label: 'LMS Workspace', description: 'Available within this LMS instance only' },
    { value: 'organization', label: 'Organization-wide', description: 'Shared across all LMS instances under this Organization' }
  ];

  sortOptions: SelectOption[] = [
    { value: 'updated_desc', label: 'Recently Updated' },
    { value: 'updated_asc', label: 'Oldest Updated' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'used_desc', label: 'Most Adopted' }
  ];

  spawnCategoryOptions: SelectOption[] = [
    { value: 'Compliance & Security', label: 'Compliance & Security', icon: 'verified_user' },
    { value: 'AI & Data', label: 'AI & Data', icon: 'psychology' },
    { value: 'Clinical Healthcare', label: 'Clinical Healthcare', icon: 'medical_services' },
    { value: 'Finance', label: 'Finance', icon: 'payments' },
    { value: 'Microfinance & Social Development', label: 'Microfinance & Social Dev', icon: 'hub' },
    { value: 'Engineering', label: 'Engineering', icon: 'code' },
    { value: 'Leadership & Soft Skills', label: 'Leadership & Soft Skills', icon: 'groups' },
    { value: 'General', label: 'General', icon: 'school' }
  ];

  spawnLevelOptions: SelectOption[] = [
    { value: 'Beginner', label: 'Beginner', sublabel: 'Foundational concepts' },
    { value: 'Intermediate', label: 'Intermediate', sublabel: 'Practical application' },
    { value: 'Advanced', label: 'Advanced', sublabel: 'Specialized deep dive' }
  ];

  visibilityOptions: SelectOption[] = [
    { value: 'all_lms_instructors', label: 'All LMS Instructors', sublabel: 'Any course creator in this LMS can use this blueprint' },
    { value: 'restricted', label: 'Restricted (Admins & Author)', sublabel: 'Only template creator and appointed administrators' },
    { value: 'org_wide', label: 'Organization-wide Public', sublabel: 'Available to instructors across all LMS instances' }
  ];

  // Active filter checks
  hasActiveFilters = computed<boolean>(() => {
    return (
      this.selectedStatus() !== 'all' ||
      this.selectedScope() !== 'all' ||
      this.selectedCategory() !== 'all' ||
      this.sortBy() !== 'updated_desc' ||
      this.searchQuery().trim().length > 0
    );
  });

  isResetVisible = computed<boolean>(() => {
    return this.hasActiveFilters();
  });

  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedScope() !== 'all') count++;
    if (this.selectedCategory() !== 'all') count++;
    if (this.sortBy() !== 'updated_desc') count++;
    return count;
  });

  // Filtered and Sorted list
  parseDateTimestamp(dateStr: string | undefined | null): number {
    if (!dateStr) return 0;
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
      const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
      const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
      return new Date(year, month, day, hour, min, sec).getTime();
    }
    const parsed = new Date(dateStr).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }

  formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '—';
    const ts = this.parseDateTimestamp(dateStr);
    if (ts > 0) {
      const date = new Date(ts);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr.split(' ')[0] || dateStr;
  }

  filteredTemplates = computed<CourseTemplate[]>(() => {
    let list = this.lms.scopedCourseTemplates();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();
    const category = this.selectedCategory();
    const scope = this.selectedScope();
    const sort = this.sortBy();

    // 1. Search Query
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
        const bTime = this.parseDateTimestamp(b.updatedAt || b.createdAt);
        const aTime = this.parseDateTimestamp(a.updatedAt || a.createdAt);
        if (bTime && aTime) return bTime - aTime;
        return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
      } else if (sort === 'updated_asc') {
        const bTime = this.parseDateTimestamp(b.updatedAt || b.createdAt);
        const aTime = this.parseDateTimestamp(a.updatedAt || a.createdAt);
        if (bTime && aTime) return aTime - bTime;
        return (a.updatedAt || a.createdAt || '').localeCompare(b.updatedAt || b.createdAt || '');
      } else if (sort === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sort === 'used_desc') {
        return (b.usedCount || 0) - (a.usedCount || 0);
      }
      return 0;
    });
  });

  // Displayed slice for lazy pagination
  displayedTemplates = computed<CourseTemplate[]>(() => {
    return this.filteredTemplates().slice(0, this.displayedCount());
  });

  hasMoreTemplates = computed<boolean>(() => {
    return this.displayedCount() < this.filteredTemplates().length;
  });

  // Empty state type resolution
  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredTemplates().length > 0) return 'none';
    if (this.lms.scopedCourseTemplates().length === 0) return 'true_empty';
    if (this.searchQuery().trim().length > 0) return 'search_miss';
    return 'filter_miss';
  });

  // Floating Action Popover Menu (Plan Grid Pattern)
  toggleActionMenu(template: CourseTemplate, event: MouseEvent) {
    event.stopPropagation();
    if (this.activeMenuTemplate()?.id === template.id) {
      this.closeActionMenu();
      return;
    }

    const button = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
    const rect = button.getBoundingClientRect();
    const menuHeight = 280;
    const menuWidth = 230;

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = placeAbove ? Math.max(10, rect.top - menuHeight - 4) : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 4);
    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    this.menuPosition.set({ top, left });
    this.activeMenuTemplate.set(template);
  }

  closeActionMenu() {
    this.activeMenuTemplate.set(null);
  }

  isActionMenuOpen(templateId: string): boolean {
    return this.activeMenuTemplate()?.id === templateId;
  }

  @HostListener('document:click')
  @HostListener('window:scroll')
  @HostListener('window:resize')
  onDocumentInteraction() {
    if (this.activeMenuTemplate()) {
      this.closeActionMenu();
    }
  }

  // Load more
  loadMore() {
    this.displayedCount.update(c => c + this.pageSizeIncrement);
  }

  // Search handler
  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.displayedCount.set(10);
  }

  // Filter Drawer Actions
  toggleFilterPanel() {
    if (!this.isFilterPanelOpen()) {
      this.draftFilters.set({ ...this.appliedFilters() });
    }
    this.isFilterPanelOpen.update(v => !v);
  }

  closeFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  resetGrid() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedCategory.set('all');
    this.selectedScope.set('all');
    this.sortBy.set('updated_desc');
    this.selectedCategoryQuick.set('All');
    this.displayedCount.set(12);
  }

  // Duration & Slot helpers
  getDuration(template: CourseTemplate): number {
    return calculateTemplateDuration(template.structure);
  }

  getSlotCount(template: CourseTemplate): number {
    return countTemplateSlots(template.structure);
  }

  // Status badge styling
  getStatusBadgeClass(status: CourseTemplateStatus): string {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'draft':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'inactive':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
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

  // Inspection Modal
  openInspect(template: CourseTemplate) {
    this.closeActionMenu();
    this.inspectTemplate.set(template);
  }

  closeInspect() {
    this.inspectTemplate.set(null);
  }

  // Spawn Course Modal
  openSpawnModal(template: CourseTemplate) {
    this.closeActionMenu();
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

  // Template Actions
  duplicate(template: CourseTemplate) {
    this.closeActionMenu();
    this.lms.duplicateCourseTemplate(template.id);
  }

  toggleStatus(template: CourseTemplate) {
    this.closeActionMenu();
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

  deleteTemplate(template: CourseTemplate) {
    this.closeActionMenu();
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

  openVisibilityModal(template: CourseTemplate) {
    this.closeActionMenu();
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
}
