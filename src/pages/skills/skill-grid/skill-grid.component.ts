import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  Skill, 
  SkillCluster, 
  SkillMapping, 
  SkillCategory, 
  SkillStatus, 
  SkillTargetType 
} from '../../../models/skill-mapping.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';

@Component({
  selector: 'app-skill-grid',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule, 
    CustomSelectComponent,
    DataGridComponent,
    FilterSectionComponent
  ],
  templateUrl: './skill-grid.component.html'
})
export class SkillGridComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Actions Menu State (Positioned outside scroll boundaries)
  activeMenuSkill = signal<Skill | null>(null);
  menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Search & Filter State for Skills
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedCategory = signal<string>('all');
  selectedCluster = signal<string>('all');
  selectedMappedFilter = signal<string>('all'); // 'all' | 'mapped' | 'unmapped'
  selectedTargetType = signal<string>('all');   // 'all' | 'content' | 'course' | 'phase' | 'plan'
  isFilterPanelOpen = signal<boolean>(false);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);

  // Modals state
  isSkillModalOpen = signal<boolean>(false);
  editingSkill = signal<Skill | null>(null);
  skillForm!: FormGroup;
  formSubmitted = signal<boolean>(false);
  formError = signal<string | null>(null);

  isMappingModalOpen = signal<boolean>(false);
  mappingSkill = signal<Skill | null>(null);
  mappingTargetType = signal<SkillTargetType>('course');
  mappingTargetId = signal<string>('');
  mappingTargetName = signal<string>('');
  mappingAchievementRule = signal<string>('');

  isDetailsModalOpen = signal<boolean>(false);
  selectedSkillDetails = signal<Skill | null>(null);

  // Confirmation dialogs
  confirmDialog = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
    actionType: 'deactivate' | 'reactivate' | 'deleteSkill' | 'unmap';
    targetId: string;
    extraData?: any;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: false,
    actionType: 'deactivate',
    targetId: ''
  });

  // Category Options
  categories: SkillCategory[] = [
    'Technical', 
    'Behavioral', 
    'Leadership', 
    'Functional', 
    'Compliance', 
    'Operations', 
    'Domain Knowledge'
  ];

  // Custom Select Dropdown Options
  statusSelectOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses', icon: 'list' },
    { value: 'active', label: 'Active', icon: 'check_circle', badge: 'Active', badgeClass: 'bg-emerald-500/10 text-emerald-600' },
    { value: 'inactive', label: 'Inactive', icon: 'pause_circle', badge: 'Inactive', badgeClass: 'bg-rose-500/10 text-rose-600' },
    { value: 'draft', label: 'Draft', icon: 'draft', badge: 'Draft', badgeClass: 'bg-blue-500/10 text-blue-600' }
  ];

  categorySelectOptions = computed<SelectOption[]>(() => {
    return [
      { value: 'all', label: 'All Categories', icon: 'category' },
      ...this.categories.map(c => ({ value: c, label: c, icon: 'psychology' }))
    ];
  });

  clusterSelectOptions = computed<SelectOption[]>(() => {
    const list = this.lmsData.skillClusters();
    return [
      { value: 'all', label: 'All Clusters', icon: 'bubble_chart' },
      { value: 'uncategorized', label: 'Uncategorized', icon: 'layers_clear' },
      ...list.map(c => ({ value: c.clusterId, label: c.name, icon: 'bubble_chart', sublabel: c.clusterCode }))
    ];
  });

  mappedSelectOptions: SelectOption[] = [
    { value: 'all', label: 'All Skills', icon: 'list' },
    { value: 'mapped', label: 'Mapped (≥1 element)', icon: 'link' },
    { value: 'unmapped', label: 'Unmapped (0 elements)', icon: 'link_off' }
  ];

  targetTypeSelectOptions: SelectOption[] = [
    { value: 'all', label: 'All Targets', icon: 'account_tree' },
    { value: 'plan', label: 'Training Plan', icon: 'assignment' },
    { value: 'phase', label: 'Phase', icon: 'step' },
    { value: 'course', label: 'Course / Class', icon: 'school' },
    { value: 'content', label: 'Content Asset', icon: 'article' }
  ];

  mappingTargetTypeOptions: SelectOption[] = [
    { value: 'course', label: 'Course / Class', icon: 'school' },
    { value: 'plan', label: 'Training Plan', icon: 'assignment' },
    { value: 'phase', label: 'Phase', icon: 'step' },
    { value: 'content', label: 'Content Asset', icon: 'article' }
  ];

  formSkillCategoryOptions: SelectOption[] = this.categories.map(c => ({
    value: c,
    label: c,
    icon: 'psychology'
  }));

  formSkillClusterOptions = computed<SelectOption[]>(() => {
    return [
      { value: '', label: 'None (Uncategorized)', icon: 'layers_clear' },
      ...this.lmsData.skillClusters().map(cls => ({
        value: cls.clusterId,
        label: cls.name,
        icon: 'bubble_chart',
        sublabel: cls.clusterCode
      }))
    ];
  });

  formSkillStatusOptions: SelectOption[] = [
    { value: 'active', label: 'Active (Available for mapping)', icon: 'check_circle', badge: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700' },
    { value: 'inactive', label: 'Inactive (Cannot be newly mapped)', icon: 'pause_circle', badge: 'Inactive', badgeClass: 'bg-rose-50 text-rose-700' },
    { value: 'draft', label: 'Draft', icon: 'draft', badge: 'Draft', badgeClass: 'bg-blue-50 text-blue-700' }
  ];

  // Target item options
  mappingTargetItemOptions = computed<SelectOption[]>(() => {
    const type = this.mappingTargetType();
    if (type === 'course') {
      const templates = (this.lmsData.courseTemplates ? this.lmsData.courseTemplates() : []) as any[];
      return templates.map(c => ({
        value: c.id || c.templateId || 'course-1',
        label: `${c.name || c.title || 'Course'} (${c.code || c.id || 'CRS'})`,
        icon: 'school'
      }));
    } else if (type === 'plan') {
      const plans = (this.lmsData.plans ? this.lmsData.plans() : []) as any[];
      return plans.map(p => ({
        value: p.id,
        label: `${p.name || 'Training Plan'} (${p.id})`,
        icon: 'assignment'
      }));
    } else if (type === 'phase') {
      const plans = (this.lmsData.plans ? this.lmsData.plans() : []) as any[];
      const phases: SelectOption[] = [];
      plans.forEach(p => {
        (p.phases || []).forEach((ph: any) => {
          phases.push({
            value: ph.id,
            label: `${ph.name || 'Phase'} (${p.name || 'Plan'})`,
            icon: 'step'
          });
        });
      });
      return phases;
    } else if (type === 'content') {
      const assets = (this.lmsData.contentRepoAssets ? this.lmsData.contentRepoAssets() : []) as any[];
      return assets.map(cnt => ({
        value: cnt.id || cnt.assetId || 'cnt-1',
        label: `${cnt.title || cnt.name || 'Content Asset'} (${cnt.type || 'Resource'})`,
        icon: 'article'
      }));
    }
    return [];
  });

  toggleSkillActionMenu(skill: Skill, event: MouseEvent, buttonEl?: HTMLElement) {
    event.stopPropagation();
    if (this.activeMenuSkill()?.skillId === skill.skillId) {
      this.closeActionMenu();
      return;
    }

    const button = buttonEl || (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
    const rect = button.getBoundingClientRect();
    const menuHeight = 220;
    const menuWidth = 208; // w-52 is 208px

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = placeAbove ? Math.max(8, rect.top - menuHeight - 4) : (rect.bottom + 4);
    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    this.menuPosition.set({ top, left });
    this.activeMenuSkill.set({ ...skill });
  }

  closeActionMenu() {
    this.activeMenuSkill.set(null);
  }

  isSkillActionMenuOpen(skillId: string): boolean {
    return this.activeMenuSkill()?.skillId === skillId;
  }

  viewSkillDetails(skill?: Skill | null) {
    const s = skill || this.activeMenuSkill();
    if (s) {
      this.selectedSkillDetails.set({ ...s });
      this.isDetailsModalOpen.set(true);
    }
    this.closeActionMenu();
  }

  viewSkillDetailsFromMenu() {
    this.viewSkillDetails(this.activeMenuSkill());
  }

  getSkillStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300';
      case 'inactive':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300';
      case 'draft':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300';
    }
  }

  getSkillStatusDotClass(status?: string): string {
    switch (status) {
      case 'active':
        return 'bg-emerald-500';
      case 'inactive':
        return 'bg-rose-500';
      case 'draft':
        return 'bg-blue-500';
      default:
        return 'bg-emerald-500';
    }
  }

  editSkillFromMenu(skill?: Skill | null) {
    const s = skill || this.activeMenuSkill();
    if (s) {
      this.openEditSkillModal(s);
    }
    this.closeActionMenu();
  }

  manageMappingsFromMenu(skill?: Skill | null) {
    const s = skill || this.activeMenuSkill();
    if (s) {
      this.openManageMappingsModal(s);
    }
    this.closeActionMenu();
  }

  deactivateSkillFromMenu(skill?: Skill | null) {
    const s = skill || this.activeMenuSkill();
    if (s) {
      this.confirmDeactivate(s);
    }
    this.closeActionMenu();
  }

  reactivateSkillFromMenu(skill?: Skill | null) {
    const s = skill || this.activeMenuSkill();
    if (s) {
      this.confirmReactivate(s);
    }
    this.closeActionMenu();
  }

  deleteSkillFromMenu(skill?: Skill | null) {
    const s = skill || this.activeMenuSkill();
    if (s) {
      this.confirmDeleteSkill(s);
    }
    this.closeActionMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.skill-action-menu-dropdown') && !target.closest('.skill-action-menu-btn')) {
      this.closeActionMenu();
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange() {
    if (this.activeMenuSkill()) {
      this.closeActionMenu();
    }
  }

  ngOnInit() {
    this.initForms();
  }

  private initForms() {
    this.skillForm = this.fb.group({
      skillId: [''],
      skillCode: [''],
      name: ['', [Validators.required, Validators.maxLength(99)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      category: ['Technical', Validators.required],
      clusterId: [''],
      status: ['active', Validators.required],
      levelBeginner: [true],
      levelIntermediate: [true],
      levelAdvanced: [true],
      levelExpert: [true]
    });
  }

  // Computed Filtered Skills
  filteredSkills = computed<Skill[]>(() => {
    let list = this.lmsData.skills();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const cat = this.selectedCategory();
    const cluster = this.selectedCluster();
    const mapped = this.selectedMappedFilter();
    const target = this.selectedTargetType();

    // Text Search
    if (q) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.skillCode.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    }

    // Status Filter
    if (status !== 'all') {
      list = list.filter(s => s.status === status);
    }

    // Category Filter
    if (cat !== 'all') {
      list = list.filter(s => s.category === cat);
    }

    // Cluster Filter
    if (cluster !== 'all') {
      if (cluster === 'uncategorized') {
        list = list.filter(s => !s.clusterId);
      } else {
        list = list.filter(s => s.clusterId === cluster);
      }
    }

    // Mapping State Filter
    if (mapped === 'mapped') {
      list = list.filter(s => s.mappedElementCount > 0);
    } else if (mapped === 'unmapped') {
      list = list.filter(s => s.mappedElementCount === 0);
    }

    // Target Type Filter
    if (target !== 'all') {
      const mappings = this.lmsData.skillMappings();
      const matchingSkillIds = new Set(
        mappings.filter(m => m.targetType === target).map(m => m.skillId)
      );
      list = list.filter(s => matchingSkillIds.has(s.skillId));
    }

    return list;
  });

  // Active Filter Count
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedCategory() !== 'all') count++;
    if (this.selectedCluster() !== 'all') count++;
    if (this.selectedMappedFilter() !== 'all') count++;
    if (this.selectedTargetType() !== 'all') count++;
    return count;
  });

  // Paginated Skills
  paginatedSkills = computed(() => {
    const list = this.filteredSkills();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  emptyStateType = computed<'no-data' | 'no-results'>(() => {
    return this.lmsData.skills().length === 0 ? 'no-data' : 'no-results';
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedCategory.set('all');
    this.selectedCluster.set('all');
    this.selectedMappedFilter.set('all');
    this.selectedTargetType.set('all');
    this.currentPage.set(1);
  }

  // Modals Management
  openCreateSkillModal() {
    this.editingSkill.set(null);
    this.skillForm.reset({
      skillId: '',
      skillCode: '',
      name: '',
      description: '',
      category: 'Technical',
      clusterId: '',
      status: 'active',
      levelBeginner: true,
      levelIntermediate: true,
      levelAdvanced: true,
      levelExpert: true
    });
    this.formSubmitted.set(false);
    this.formError.set(null);
    this.isSkillModalOpen.set(true);
    this.closeActionMenu();
  }

  openEditSkillModal(skill: Skill) {
    this.editingSkill.set(skill);
    const levels = skill.levels || ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    this.skillForm.patchValue({
      skillId: skill.skillId,
      skillCode: skill.skillCode,
      name: skill.name,
      description: skill.description || '',
      category: skill.category || 'Technical',
      clusterId: skill.clusterId || '',
      status: skill.status || 'active',
      levelBeginner: levels.includes('Beginner'),
      levelIntermediate: levels.includes('Intermediate'),
      levelAdvanced: levels.includes('Advanced'),
      levelExpert: levels.includes('Expert')
    });
    this.formSubmitted.set(false);
    this.formError.set(null);
    this.isSkillModalOpen.set(true);
    this.closeActionMenu();
  }

  closeSkillModal() {
    this.isSkillModalOpen.set(false);
    this.editingSkill.set(null);
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeSkillModal();
    }
  }

  onDetailsBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeDetailsModal();
    }
  }

  onMappingBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeMappingModal();
    }
  }

  onConfirmBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeConfirmDialog();
    }
  }

  saveSkill() {
    this.formSubmitted.set(true);
    if (this.skillForm.invalid) {
      this.formError.set('Please fill in all mandatory fields with valid values.');
      return;
    }

    const val = this.skillForm.value;
    const levels: string[] = [];
    if (val.levelBeginner) levels.push('Beginner');
    if (val.levelIntermediate) levels.push('Intermediate');
    if (val.levelAdvanced) levels.push('Advanced');
    if (val.levelExpert) levels.push('Expert');

    if (levels.length === 0) {
      this.formError.set('Please select at least one proficiency level.');
      return;
    }

    const editing = this.editingSkill();

    this.lmsData.saveSkill({
      skillId: editing?.skillId,
      skillCode: editing?.skillCode,
      name: val.name.trim(),
      description: val.description.trim(),
      category: val.category,
      clusterId: val.clusterId || undefined,
      status: val.status,
      levels
    });

    this.closeSkillModal();
  }

  openViewDetailsModal(skill: Skill) {
    this.selectedSkillDetails.set({ ...skill });
    this.isDetailsModalOpen.set(true);
    this.closeActionMenu();
  }

  closeDetailsModal() {
    this.isDetailsModalOpen.set(false);
    this.selectedSkillDetails.set(null);
  }

  // Manage Polymorphic Mappings
  openManageMappingsModal(skill: Skill) {
    this.mappingSkill.set(skill);
    this.mappingTargetType.set('course');
    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
    this.mappingAchievementRule.set('pass_with_threshold');
    this.isMappingModalOpen.set(true);
    this.closeActionMenu();
  }

  closeMappingModal() {
    this.isMappingModalOpen.set(false);
    this.mappingSkill.set(null);
  }

  getMappingsForSkill(skillId: string): SkillMapping[] {
    return this.lmsData.skillMappings().filter(m => m.skillId === skillId);
  }

  addMapping() {
    const skill = this.mappingSkill();
    const type = this.mappingTargetType();
    const targetId = this.mappingTargetId();
    if (!skill || !targetId) return;

    let targetName = this.mappingTargetName();
    if (!targetName) {
      const opt = this.mappingTargetItemOptions().find(o => o.value === targetId);
      targetName = opt?.label || targetId;
    }

    this.lmsData.mapSkillToElement(
      skill.skillId,
      type,
      targetId,
      targetName,
      this.mappingAchievementRule() || 'pass_with_threshold'
    );

    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
  }

  unmapSkill(skillId: string, targetType: SkillTargetType, targetId: string) {
    this.lmsData.unmapSkillFromElement(skillId, targetType, targetId);
  }

  // Confirmation actions
  confirmDeactivate(skill: Skill) {
    this.confirmDialog.set({
      isOpen: true,
      title: 'Deactivate Skill',
      message: `Deactivating "${skill.name}" will make it unavailable for new learning mappings. Existing historical mappings remain active. Proceed?`,
      confirmText: 'Deactivate Skill',
      isDestructive: false,
      actionType: 'deactivate',
      targetId: skill.skillId
    });
  }

  confirmReactivate(skill: Skill) {
    this.confirmDialog.set({
      isOpen: true,
      title: 'Reactivate Skill',
      message: `Reactivating "${skill.name}" will immediately make it available for curriculum mapping across all courses and training plans. Proceed?`,
      confirmText: 'Reactivate Skill',
      isDestructive: false,
      actionType: 'reactivate',
      targetId: skill.skillId
    });
  }

  confirmDeleteSkill(skill: Skill) {
    this.confirmDialog.set({
      isOpen: true,
      title: 'Delete Skill',
      message: `Are you sure you want to permanently delete "${skill.name}" (${skill.skillCode})? Note: Skills with active element mappings cannot be deleted until unmapped.`,
      confirmText: 'Delete Skill',
      isDestructive: true,
      actionType: 'deleteSkill',
      targetId: skill.skillId
    });
  }

  closeConfirmDialog() {
    this.confirmDialog.update(d => ({ ...d, isOpen: false }));
  }

  executeConfirmAction() {
    const dialog = this.confirmDialog();
    if (dialog.actionType === 'deactivate') {
      this.lmsData.deactivateSkill(dialog.targetId);
    } else if (dialog.actionType === 'reactivate') {
      this.lmsData.reactivateSkill(dialog.targetId);
    } else if (dialog.actionType === 'deleteSkill') {
      this.lmsData.deleteSkill(dialog.targetId);
    }
    this.closeConfirmDialog();
  }

  getTargetTypeColor(type: SkillTargetType): string {
    switch (type) {
      case 'plan':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300';
      case 'phase':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300';
      case 'course':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300';
      case 'content':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }
}
