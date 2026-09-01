import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-skill-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './skill-grid.component.html'
})
export class SkillGridComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Active Tab: 'skills' | 'clusters' | 'mappings'
  activeTab = signal<'skills' | 'clusters' | 'mappings'>('skills');

  // Actions Menu State (Positioned outside scroll boundaries)
  activeMenuSkill = signal<Skill | null>(null);
  activeMenuMapping = signal<SkillMapping | null>(null);
  menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Search & Filter State for Skills
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedCategory = signal<string>('all');
  selectedCluster = signal<string>('all');
  selectedMappedFilter = signal<string>('all'); // 'all' | 'mapped' | 'unmapped'
  selectedTargetType = signal<string>('all');   // 'all' | 'content' | 'course' | 'phase' | 'plan'
  isFilterPanelOpen = signal<boolean>(false);

  // Cluster Search State
  clusterSearchQuery = signal<string>('');

  // Modals state
  isSkillModalOpen = signal<boolean>(false);
  editingSkill = signal<Skill | null>(null);
  skillForm!: FormGroup;
  formSubmitted = signal<boolean>(false);
  formError = signal<string | null>(null);

  isClusterModalOpen = signal<boolean>(false);
  editingCluster = signal<SkillCluster | null>(null);
  clusterForm!: FormGroup;

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
    actionType: 'deactivate' | 'reactivate' | 'deleteSkill' | 'deleteCluster' | 'unmap';
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

  mappingTargetItemOptions = computed<SelectOption[]>(() => {
    const type = this.mappingTargetType();
    if (type === 'course') {
      return this.availableCourses().map(c => ({
        value: c.id,
        label: c.title,
        icon: 'school'
      }));
    } else if (type === 'plan') {
      return this.availablePlans().map(p => ({
        value: p.id,
        label: p.name,
        icon: 'assignment'
      }));
    } else if (type === 'phase') {
      return this.availablePhases().map(ph => ({
        value: ph.id,
        label: `${ph.title} (${ph.planName})`,
        icon: 'step'
      }));
    } else if (type === 'content') {
      return this.availableContentAssets().map(cnt => ({
        value: cnt.id,
        label: cnt.title,
        icon: 'article'
      }));
    }
    return [];
  });

  toggleSkillActionMenu(skill: Skill, event: MouseEvent, button: HTMLElement) {
    event.stopPropagation();
    this.activeMenuMapping.set(null); // Close mapping menu if open
    if (this.activeMenuSkill()?.skillId === skill.skillId) {
      this.closeActionMenu();
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuHeight = 260;
    const menuWidth = 240; // w-60 is 240px

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = placeAbove ? Math.max(10, rect.top - menuHeight - 4) : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 4);
    let left = rect.right - menuWidth; // Align perfectly flush with the right edge of the button
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    this.menuPosition.set({ top, left });
    this.activeMenuSkill.set(skill);
  }

  toggleMappingActionMenu(mapping: SkillMapping, event: MouseEvent, button: HTMLElement) {
    event.stopPropagation();
    this.activeMenuSkill.set(null); // Close skill menu if open
    if (this.activeMenuMapping()?.skillId === mapping.skillId && this.activeMenuMapping()?.targetId === mapping.targetId) {
      this.closeActionMenu();
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuHeight = 150;
    const menuWidth = 240; // w-60 is 240px

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = placeAbove ? Math.max(10, rect.top - menuHeight - 4) : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 4);
    let left = rect.right - menuWidth; // Align perfectly flush with the right edge of the button
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    this.menuPosition.set({ top, left });
    this.activeMenuMapping.set(mapping);
  }

  closeActionMenu() {
    this.activeMenuSkill.set(null);
    this.activeMenuMapping.set(null);
  }

  ngOnInit() {
    const updateTabFromRoute = (params: any) => {
      const url = this.router.url;
      if (params['tab'] === 'clusters' || url.includes('/skills/clusters')) {
        this.activeTab.set('clusters');
      } else if (params['tab'] === 'mappings' || url.includes('/skills/mappings')) {
        this.activeTab.set('mappings');
      } else if (params['tab'] === 'skills') {
        this.activeTab.set('skills');
      } else {
        if (!url.includes('/skills/clusters') && !url.includes('/skills/mappings')) {
          this.activeTab.set('skills');
        }
      }
    };

    updateTabFromRoute(this.route.snapshot.queryParams);

    this.route.queryParams.subscribe(params => {
      updateTabFromRoute(params);
    });

    this.initForms();
  }

  private initForms() {
    this.skillForm = this.fb.group({
      skillId: [''],
      skillCode: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      category: ['Technical', Validators.required],
      clusterId: [''],
      status: ['active', Validators.required],
      levelBeginner: [true],
      levelIntermediate: [true],
      levelAdvanced: [true],
      levelExpert: [true]
    });

    this.clusterForm = this.fb.group({
      clusterId: [''],
      clusterCode: [''],
      name: ['', Validators.required],
      description: [''],
      status: ['active', Validators.required]
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

    // Mapped / Unmapped Filter
    if (mapped === 'mapped') {
      list = list.filter(s => s.mappedElementCount > 0);
    } else if (mapped === 'unmapped') {
      list = list.filter(s => s.mappedElementCount === 0);
    }

    // Target Type Mapped Filter
    if (target !== 'all') {
      const mappings = this.lmsData.skillMappings();
      const skillIdsWithTarget = new Set(mappings.filter(m => m.targetType === target).map(m => m.skillId));
      list = list.filter(s => skillIdsWithTarget.has(s.skillId));
    }

    return list;
  });

  // Empty State Type: 'none' | 'true_empty' | 'search_miss' | 'filter_miss'
  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredSkills().length > 0) return 'none';

    if (this.lmsData.skills().length === 0) {
      return 'true_empty';
    }

    if (this.searchQuery().trim().length > 0 && !this.hasActiveFiltersExceptSearch()) {
      return 'search_miss';
    }

    return 'filter_miss';
  });

  private hasActiveFiltersExceptSearch(): boolean {
    return (
      this.selectedStatus() !== 'all' ||
      this.selectedCategory() !== 'all' ||
      this.selectedCluster() !== 'all' ||
      this.selectedMappedFilter() !== 'all' ||
      this.selectedTargetType() !== 'all'
    );
  }

  // Active filter count
  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedCategory() !== 'all') count++;
    if (this.selectedCluster() !== 'all') count++;
    if (this.selectedMappedFilter() !== 'all') count++;
    if (this.selectedTargetType() !== 'all') count++;
    return count;
  });

  // Filtered Clusters
  filteredClusters = computed<SkillCluster[]>(() => {
    let list = this.lmsData.skillClusters();
    const q = this.clusterSearchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.clusterCode.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return list;
  });

  // All Mappings
  allMappings = computed<SkillMapping[]>(() => {
    return this.lmsData.skillMappings();
  });

  // Telemetry Computed Helpers for Template
  activeSkillsCount = computed(() => this.lmsData.skills().filter(s => s.status === 'active').length);
  acquiredLearnersCount = computed(() => this.lmsData.learnerSkillProgress().filter(p => p.acquired).length);

  // Helper options for target selection
  availablePlans = computed(() => this.lmsData.plans());
  availableCourses = computed(() => this.lmsData.courses());
  availablePhases = computed(() => {
    const allPlans = this.lmsData.plans();
    const phasesList: { id: string; title: string; planName: string }[] = [];
    allPlans.forEach(p => {
      (p.phases || []).forEach(ph => {
        phasesList.push({
          id: ph.id,
          title: (ph as any).name || (ph as any).title || ph.id,
          planName: (p as any).name || (p as any).title || p.id
        });
      });
    });
    return phasesList;
  });
  availableContentAssets = computed(() => this.lmsData.contentRepoAssets());

  closeConfirmDialog() {
    this.confirmDialog.update(d => ({ ...d, isOpen: false }));
  }

  // Set active tab
  setTab(tab: 'skills' | 'clusters' | 'mappings') {
    this.activeTab.set(tab);
    this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  // Reset Grid Filters
  resetFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedCategory.set('all');
    this.selectedCluster.set('all');
    this.selectedMappedFilter.set('all');
    this.selectedTargetType.set('all');
  }

  // Clear Filter Panel
  clearFilterPanel() {
    this.selectedStatus.set('all');
    this.selectedCategory.set('all');
    this.selectedCluster.set('all');
    this.selectedMappedFilter.set('all');
    this.selectedTargetType.set('all');
  }

  // Open Create Skill Modal
  openCreateSkillModal() {
    this.editingSkill.set(null);
    this.formSubmitted.set(false);
    this.formError.set(null);
    const codeIdx = String(this.lmsData.skills().length + 1).padStart(4, '0');
    
    this.skillForm.reset({
      skillId: '',
      skillCode: `SKL-${codeIdx}`,
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
    this.isSkillModalOpen.set(true);
  }

  // Open Edit Skill Modal
  openEditSkillModal(skill: Skill) {
    this.editingSkill.set(skill);
    this.formSubmitted.set(false);
    this.formError.set(null);

    const levels = skill.levels || ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    
    this.skillForm.patchValue({
      skillId: skill.skillId,
      skillCode: skill.skillCode,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      clusterId: skill.clusterId || '',
      status: skill.status,
      levelBeginner: levels.includes('Beginner'),
      levelIntermediate: levels.includes('Intermediate'),
      levelAdvanced: levels.includes('Advanced'),
      levelExpert: levels.includes('Expert')
    });
    this.isSkillModalOpen.set(true);
  }

  // Save Skill
  onSaveSkill() {
    this.formSubmitted.set(true);
    this.formError.set(null);

    if (this.skillForm.invalid) {
      this.formError.set('All mandatory fields are not filled up.');
      return;
    }

    const val = this.skillForm.value;
    const selectedLevels: string[] = [];
    if (val.levelBeginner) selectedLevels.push('Beginner');
    if (val.levelIntermediate) selectedLevels.push('Intermediate');
    if (val.levelAdvanced) selectedLevels.push('Advanced');
    if (val.levelExpert) selectedLevels.push('Expert');

    // If editing and skill is mapped, inform user of propagation (§6.5)
    if (this.editingSkill() && this.editingSkill()!.mappedElementCount > 0) {
      const mapCount = this.editingSkill()!.mappedElementCount;
      // Perform save
      this.lmsData.saveSkill({
        skillId: val.skillId,
        skillCode: val.skillCode,
        name: val.name.trim(),
        description: val.description.trim(),
        category: val.category,
        clusterId: val.clusterId || undefined,
        status: val.status,
        levels: selectedLevels
      });
      this.isSkillModalOpen.set(false);
    } else {
      this.lmsData.saveSkill({
        skillId: val.skillId,
        skillCode: val.skillCode,
        name: val.name.trim(),
        description: val.description.trim(),
        category: val.category,
        clusterId: val.clusterId || undefined,
        status: val.status,
        levels: selectedLevels
      });
      this.isSkillModalOpen.set(false);
    }
  }

  // Open View Details Modal
  openViewDetailsModal(skill: Skill) {
    this.selectedSkillDetails.set(skill);
    this.isDetailsModalOpen.set(true);
  }

  // Open Manage Mappings Modal
  openManageMappingsModal(skill: Skill) {
    this.mappingSkill.set(skill);
    this.mappingTargetType.set('course');
    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
    this.mappingAchievementRule.set(`Complete course assessment with passing grade`);
    this.isMappingModalOpen.set(true);
  }

  // Submit Mapping
  onAddMapping() {
    const skill = this.mappingSkill();
    if (!skill) return;

    const targetType = this.mappingTargetType();
    const targetId = this.mappingTargetId();
    if (!targetId) {
      this.lmsData.showToast(`Please select a ${targetType} to map.`, 'warning', 3000, 'Target Required');
      return;
    }

    let targetName = this.mappingTargetName();
    if (!targetName) {
      if (targetType === 'plan') {
        const p = this.availablePlans().find(x => x.id === targetId);
        targetName = (p as any)?.name || (p as any)?.title || targetId;
      } else if (targetType === 'course') {
        const c = this.availableCourses().find(x => x.id === targetId);
        targetName = c?.title || targetId;
      } else if (targetType === 'phase') {
        const ph = this.availablePhases().find(x => x.id === targetId);
        targetName = ph?.title || targetId;
      } else if (targetType === 'content') {
        const cnt = this.availableContentAssets().find(x => x.id === targetId);
        targetName = cnt?.title || targetId;
      }
    }

    this.lmsData.mapSkillToElement(
      skill.skillId,
      targetType,
      targetId,
      targetName,
      this.mappingAchievementRule()
    );

    // Refresh modal target selection
    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
  }

  // Unmap skill from target
  unmapSkill(skillId: string, targetType: SkillTargetType, targetId: string) {
    this.lmsData.unmapSkillFromElement(skillId, targetType, targetId);
  }

  // Actions confirmation handlers
  confirmDeactivate(skill: Skill) {
    this.confirmDialog.set({
      isOpen: true,
      title: 'Deactivate Skill',
      message: `Are you sure to deactivate the skill "${skill.name}"? It will remain on existing mapped elements but cannot be newly mapped.`,
      confirmText: 'Deactivate',
      isDestructive: true,
      actionType: 'deactivate',
      targetId: skill.skillId
    });
  }

  confirmReactivate(skill: Skill) {
    this.confirmDialog.set({
      isOpen: true,
      title: 'Reactivate Skill',
      message: `Are you sure to reactivate the skill "${skill.name}"? It will become available for mapping to learning elements again.`,
      confirmText: 'Reactivate',
      isDestructive: false,
      actionType: 'reactivate',
      targetId: skill.skillId
    });
  }

  confirmDeleteSkill(skill: Skill) {
    if (skill.mappedElementCount > 0) {
      // Block deletion dialog (§9.2)
      this.confirmDialog.set({
        isOpen: true,
        title: 'Deletion Blocked',
        message: `This skill is mapped to ${skill.mappedElementCount} element(s) and cannot be deleted. Unmap or deactivate it first.`,
        confirmText: 'Understand',
        isDestructive: false,
        actionType: 'deleteSkill',
        targetId: skill.skillId,
        extraData: { blocked: true }
      });
      return;
    }

    this.confirmDialog.set({
      isOpen: true,
      title: 'Delete Skill',
      message: `Are you sure to delete the skill "${skill.name}"? This action cannot be undone.`,
      confirmText: 'Delete Skill',
      isDestructive: true,
      actionType: 'deleteSkill',
      targetId: skill.skillId
    });
  }

  // Cluster Modal & Delete
  openCreateClusterModal() {
    this.editingCluster.set(null);
    const codeIdx = String(this.lmsData.skillClusters().length + 1).padStart(2, '0');
    this.clusterForm.reset({
      clusterId: '',
      clusterCode: `CLS-COMP-${codeIdx}`,
      name: '',
      description: '',
      status: 'active'
    });
    this.isClusterModalOpen.set(true);
  }

  openEditClusterModal(cluster: SkillCluster) {
    this.editingCluster.set(cluster);
    this.clusterForm.patchValue({
      clusterId: cluster.clusterId,
      clusterCode: cluster.clusterCode,
      name: cluster.name,
      description: cluster.description || '',
      status: cluster.status
    });
    this.isClusterModalOpen.set(true);
  }

  onSaveCluster() {
    if (this.clusterForm.invalid) {
      this.lmsData.showToast('All mandatory cluster fields are required.', 'error', 3000, 'Validation Error');
      return;
    }
    const val = this.clusterForm.value;
    this.lmsData.saveCluster({
      clusterId: val.clusterId,
      clusterCode: val.clusterCode,
      name: val.name.trim(),
      description: val.description?.trim(),
      status: val.status
    });
    this.isClusterModalOpen.set(false);
  }

  confirmDeleteCluster(cluster: SkillCluster) {
    const skillsInCluster = this.lmsData.skills().filter(s => s.clusterId === cluster.clusterId);
    let msg = `Are you sure to delete the cluster "${cluster.name}"?`;
    if (skillsInCluster.length > 0) {
      msg = `This cluster contains ${skillsInCluster.length} skill(s). Deleting it will leave them uncategorized. Are you sure you want to proceed?`;
    }

    this.confirmDialog.set({
      isOpen: true,
      title: 'Delete Cluster',
      message: msg,
      confirmText: 'Delete Cluster',
      isDestructive: true,
      actionType: 'deleteCluster',
      targetId: cluster.clusterId
    });
  }

  // Handle confirmation dialog execution
  onExecuteConfirm() {
    const dialog = this.confirmDialog();
    this.confirmDialog.update(d => ({ ...d, isOpen: false }));

    if (dialog.extraData?.blocked) {
      return;
    }

    if (dialog.actionType === 'deactivate') {
      this.lmsData.deactivateSkill(dialog.targetId);
    } else if (dialog.actionType === 'reactivate') {
      this.lmsData.reactivateSkill(dialog.targetId);
    } else if (dialog.actionType === 'deleteSkill') {
      this.lmsData.deleteSkill(dialog.targetId);
    } else if (dialog.actionType === 'deleteCluster') {
      this.lmsData.deleteCluster(dialog.targetId);
    }
  }

  // Get Mapped elements for a skill helper
  getMappingsForSkill(skillId: string): SkillMapping[] {
    return this.lmsData.getElementsMappedToSkill(skillId);
  }

  // Target Type Badge Color
  getTargetTypeColor(type: SkillTargetType): string {
    switch (type) {
      case 'plan': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'phase': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'course': case 'class': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'content': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }
}
