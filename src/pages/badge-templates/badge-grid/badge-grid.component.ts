import { Component, inject, signal, computed, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';
import {
  BadgeTemplate,
  BadgeTemplateStatus,
  BadgeSharingLevel,
  BadgeCategory,
  BadgeLevel,
  BadgeBaseShape,
  BadgeMapping,
  BadgeTargetType,
  BADGE_PLACEHOLDER_TOKENS
} from '../../../models/badge-template.model';

export interface BadgeFilterState {
  statuses: BadgeTemplateStatus[];
  category: BadgeCategory | 'ALL' | null;
  sharing: BadgeSharingLevel | 'ALL' | null;
  level: BadgeLevel | 'ALL' | null;
  skills: string[];
  targetType: BadgeTargetType | 'all';
  mappingState: 'all' | 'mapped' | 'unmapped';
}

@Component({
  selector: 'app-badge-grid',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    CustomSelectComponent,
    DataGridComponent,
    FilterSectionComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './badge-grid.component.html',
  styleUrls: ['./badge-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(window:scroll)': 'onWindowChange()',
    '(window:resize)': 'onWindowChange()'
  }
})
export class BadgeGridComponent {
  dataService = inject(LmsDataService);
  router = inject(Router);

  // Actions Menu State (Positioned outside scroll boundaries, matching skill repository grid)
  activeMenuBadge = signal<BadgeTemplate | null>(null);
  menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // View Mode: 'grid' | 'table'
  viewMode = signal<'grid' | 'table'>('grid');

  // Search & Filter Panel State
  searchQuery = signal<string>('');
  isFilterPanelOpen = signal<boolean>(false);

  // Sorting
  sortField = signal<'name' | 'createdDate' | 'usageCount' | 'category'>('createdDate');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(9);

  appliedFilters = signal<BadgeFilterState>({
    statuses: [],
    category: null,
    sharing: null,
    level: null,
    skills: [],
    targetType: 'all',
    mappingState: 'all'
  });

  draftFilters = signal<BadgeFilterState>({
    statuses: [],
    category: null,
    sharing: null,
    level: null,
    skills: [],
    targetType: 'all',
    mappingState: 'all'
  });

  // Polymorphic Badge Mapping State
  isMappingModalOpen = signal<boolean>(false);
  mappingBadge = signal<BadgeTemplate | null>(null);
  mappingTargetType = signal<BadgeTargetType>('course');
  mappingTargetId = signal<string>('');
  mappingTargetName = signal<string>('');

  // Preview Modal state
  previewingBadge = signal<BadgeTemplate | null>(null);
  previewSampleData = signal<boolean>(true);

  // Confirmation Modal state
  confirmModalAction = signal<'archive' | 'delete' | null>(null);
  targetBadge = signal<BadgeTemplate | null>(null);

  // Permissions
  permissions = this.dataService.badgePermissions;

  // Categories & Levels
  readonly categories: BadgeCategory[] = ['Skill', 'Achievement', 'Participation', 'Milestone', 'Certification'];
  readonly levels: BadgeLevel[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
  readonly availableStatuses: BadgeTemplateStatus[] = ['published', 'draft', 'archived'];

  // Mapping Options
  mappingTargetTypeOptions: SelectOption[] = [
    { value: 'course', label: 'Course / Class', icon: 'school', sublabel: 'Course curriculum' },
    { value: 'plan', label: 'Training Plan', icon: 'assignment', sublabel: 'Multi-phase plan' },
    { value: 'phase', label: 'Phase', icon: 'step', sublabel: 'Specific plan phase' },
    { value: 'content', label: 'Content Asset / Assessment', icon: 'article', sublabel: 'SCORM or Quiz asset' }
  ];

  targetTypeFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Target Types', icon: 'account_tree' },
    { value: 'course', label: 'Courses / Classes', icon: 'school' },
    { value: 'plan', label: 'Training Plans', icon: 'assignment' },
    { value: 'phase', label: 'Phases', icon: 'step' },
    { value: 'content', label: 'Content Assets', icon: 'article' }
  ];

  mappingStateFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Badges (Mapped & Unmapped)' },
    { value: 'mapped', label: 'Mapped Badges Only (Active in Curriculum)' },
    { value: 'unmapped', label: 'Unmapped Badges Only (Available for Mapping)' }
  ];

  mappingTargetItemOptions = computed<SelectOption[]>(() => {
    const type = this.mappingTargetType();
    if (type === 'course') {
      const templates = (this.dataService.courseTemplates ? this.dataService.courseTemplates() : []) as any[];
      return templates.map(c => ({
        value: c.id || c.templateId || 'crs-1',
        label: `${c.name || c.title || 'Course'} (${c.code || c.id || 'CRS'})`,
        icon: 'school'
      }));
    } else if (type === 'plan') {
      const plans = (this.dataService.plans ? this.dataService.plans() : []) as any[];
      return plans.map(p => ({
        value: p.id,
        label: `${p.name || 'Training Plan'} (${p.id})`,
        icon: 'assignment'
      }));
    } else if (type === 'phase') {
      const plans = (this.dataService.plans ? this.dataService.plans() : []) as any[];
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
      return [
        { value: 'cnt-01', label: 'Financial Accounting Standards SCORM Module', icon: 'article' },
        { value: 'cnt-02', label: 'Field Ethics Interactive Video Scenario', icon: 'smart_display' },
        { value: 'cnt-03', label: 'POS Terminal Simulation Sandbox', icon: 'devices' },
        { value: 'cnt-04', label: 'Client Protection Field Assessment', icon: 'quiz' },
        { value: 'cnt-05', label: 'Microfinance Field Operational SOPs', icon: 'description' }
      ];
    }
    return [];
  });

  // Custom Select Option Definitions
  categoryOptions = computed<SelectOption[]>(() => {
    return [
      { value: null, label: 'All Categories' },
      ...this.categories.map(cat => ({
        value: cat,
        label: cat,
        icon: 'category'
      }))
    ];
  });

  sharingOptions: SelectOption[] = [
    { value: null, label: 'All Sharing Scopes' },
    { value: 'organization', label: 'Organization-Shared', icon: 'share', sublabel: 'Org-wide template' },
    { value: 'lms', label: 'LMS-Shared', icon: 'hub', sublabel: 'Current LMS instance' },
    { value: 'private', label: 'Private Scope', icon: 'lock', sublabel: 'Creator & admin only' }
  ];

  levelOptions = computed<SelectOption[]>(() => {
    return [
      { value: null, label: 'All Levels / Tiers' },
      ...this.levels.map(lvl => ({
        value: lvl,
        label: lvl,
        icon: 'military_tech'
      }))
    ];
  });

  // All badges in scope
  allBadges = computed<BadgeTemplate[]>(() => this.dataService.badgeTemplates());

  // Distinct skill tags extracted from all badges
  allSkillTags = computed<string[]>(() => {
    const tagsSet = new Set<string>();
    this.allBadges().forEach(b => {
      b.earning?.skillTags?.forEach(t => tagsSet.add(t));
    });
    return Array.from(tagsSet).sort();
  });

  skillOptions = computed<SelectOption[]>(() => {
    return this.allSkillTags().map(tag => ({
      value: tag,
      label: `#${tag}`,
      icon: 'psychology'
    }));
  });

  // KPI Metrics
  kpiStats = computed(() => {
    const badges = this.allBadges();
    const mappings = this.dataService.badgeMappings();
    return {
      total: badges.length,
      published: badges.filter(b => b.status === 'published').length,
      draft: badges.filter(b => b.status === 'draft').length,
      archived: badges.filter(b => b.status === 'archived').length,
      totalMappings: mappings.length
    };
  });

  // Check if any filters are active
  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return (
      f.statuses.length > 0 ||
      (f.category !== null && f.category !== 'ALL') ||
      (f.sharing !== null && f.sharing !== 'ALL') ||
      (f.level !== null && f.level !== 'ALL') ||
      f.skills.length > 0 ||
      f.targetType !== 'all' ||
      f.mappingState !== 'all'
    );
  });

  // Check if reset button is visible in top bar
  isResetVisible = computed<boolean>(() => {
    return !!this.searchQuery().trim() || this.hasActiveFilters();
  });

  // Count of active filters
  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    let count = f.statuses.length;
    if (f.category && f.category !== 'ALL') count++;
    if (f.sharing && f.sharing !== 'ALL') count++;
    if (f.level && f.level !== 'ALL') count++;
    count += f.skills.length;
    if (f.targetType && f.targetType !== 'all') count++;
    if (f.mappingState && f.mappingState !== 'all') count++;
    return count;
  });

  // Filtered and Sorted Badges computed
  filteredBadges = computed<BadgeTemplate[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const f = this.appliedFilters();
    const mappings = this.dataService.badgeMappings();

    const filtered = this.allBadges().filter(badge => {
      // Search
      if (query) {
        const matchName = badge.name.toLowerCase().includes(query);
        const matchId = badge.templateId.toLowerCase().includes(query);
        const matchDesc = (badge.description || '').toLowerCase().includes(query);
        const matchCriteria = (badge.earning?.criteria || '').toLowerCase().includes(query);
        const matchTags = badge.earning?.skillTags?.some(t => t.toLowerCase().includes(query)) || false;
        const matchCat = badge.category.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchDesc && !matchCriteria && !matchTags && !matchCat) {
          return false;
        }
      }

      // Status Filter
      if (f.statuses.length > 0 && !f.statuses.includes(badge.status)) {
        return false;
      }

      // Category Filter
      if (f.category && f.category !== 'ALL' && badge.category !== f.category) {
        return false;
      }

      // Sharing Scope Filter
      if (f.sharing && f.sharing !== 'ALL' && badge.sharing.level !== f.sharing) {
        return false;
      }

      // Level Filter
      if (f.level && f.level !== 'ALL' && badge.earning?.level !== f.level) {
        return false;
      }

      // Skills Filter
      if (f.skills.length > 0) {
        const badgeTags = badge.earning?.skillTags || [];
        const hasMatchingSkill = f.skills.some(sk => badgeTags.includes(sk));
        if (!hasMatchingSkill) {
          return false;
        }
      }

      // Mapping State Filter (all | mapped | unmapped)
      if (f.mappingState === 'mapped') {
        const hasMapping = mappings.some(m => m.templateId === badge.templateId) || (badge.usageCount || 0) > 0;
        if (!hasMapping) return false;
      } else if (f.mappingState === 'unmapped') {
        const hasMapping = mappings.some(m => m.templateId === badge.templateId) || (badge.usageCount || 0) > 0;
        if (hasMapping) return false;
      }

      // Target Type Filter (all | course | plan | phase | content)
      if (f.targetType && f.targetType !== 'all') {
        const matchesTarget = mappings.some(m => m.templateId === badge.templateId && m.targetType === f.targetType);
        if (!matchesTarget) return false;
      }

      return true;
    });

    // Sorting
    const field = this.sortField();
    const order = this.sortOrder() === 'asc' ? 1 : -1;

    return filtered.sort((a, b) => {
      if (field === 'name') {
        return a.name.localeCompare(b.name) * order;
      }
      if (field === 'category') {
        return a.category.localeCompare(b.category) * order;
      }
      if (field === 'usageCount') {
        return ((a.usageCount || 0) - (b.usageCount || 0)) * order;
      }
      // Default: createdDate / id
      return (b.templateId.localeCompare(a.templateId)) * order;
    });
  });

  // Paginated Badges for display
  displayedBadges = computed<BadgeTemplate[]>(() => {
    const list = this.filteredBadges();
    const page = this.currentPage();
    const size = this.pageSize();
    return list.slice((page - 1) * size, page * size);
  });

  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredBadges().length > 0) return 'none';
    if (this.allBadges().length === 0) return 'true_empty';
    if (this.searchQuery().trim().length > 0) return 'search_miss';
    return 'filter_miss';
  });

  totalPages = computed<number>(() => {
    return Math.ceil(this.filteredBadges().length / this.pageSize()) || 1;
  });

  toggleSort(field: 'name' | 'createdDate' | 'usageCount' | 'category') {
    if (this.sortField() === field) {
      this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // Active filter badge items for top bar pills
  activeFilterBadges = computed<{ id: string; label: string; value: string; remove: () => void }[]>(() => {
    const f = this.appliedFilters();
    const list: { id: string; label: string; value: string; remove: () => void }[] = [];

    f.statuses.forEach(st => {
      list.push({
        id: `status-${st}`,
        label: 'Status',
        value: st.charAt(0).toUpperCase() + st.slice(1),
        remove: () => this.removeStatusFilter(st)
      });
    });

    if (f.category && f.category !== 'ALL') {
      list.push({
        id: 'category',
        label: 'Category',
        value: f.category,
        remove: () => this.removeCategoryFilter()
      });
    }

    if (f.sharing && f.sharing !== 'ALL') {
      const label = f.sharing === 'organization' ? 'Org-Shared' : f.sharing === 'lms' ? 'LMS-Shared' : 'Private';
      list.push({
        id: 'sharing',
        label: 'Scope',
        value: label,
        remove: () => this.removeSharingFilter()
      });
    }

    if (f.level && f.level !== 'ALL') {
      list.push({
        id: 'level',
        label: 'Level',
        value: f.level,
        remove: () => this.removeLevelFilter()
      });
    }

    f.skills.forEach(skill => {
      list.push({
        id: `skill-${skill}`,
        label: 'Skill',
        value: `#${skill}`,
        remove: () => this.removeSkillFilter(skill)
      });
    });

    if (f.targetType && f.targetType !== 'all') {
      const typeLabel = f.targetType === 'course' ? 'Courses' : f.targetType === 'plan' ? 'Plans' : f.targetType === 'phase' ? 'Phases' : 'Content Assets';
      list.push({
        id: 'targetType',
        label: 'Target',
        value: typeLabel,
        remove: () => this.removeTargetTypeFilter()
      });
    }

    if (f.mappingState && f.mappingState !== 'all') {
      const stateLabel = f.mappingState === 'mapped' ? 'Mapped Only' : 'Unmapped Only';
      list.push({
        id: 'mappingState',
        label: 'Mapping',
        value: stateLabel,
        remove: () => this.removeMappingStateFilter()
      });
    }

    return list;
  });

  // Filter Drawer toggles and actions
  toggleFilterPanel() {
    if (!this.isFilterPanelOpen()) {
      this.draftFilters.set({
        statuses: [...this.appliedFilters().statuses],
        category: this.appliedFilters().category,
        sharing: this.appliedFilters().sharing,
        level: this.appliedFilters().level,
        skills: [...this.appliedFilters().skills],
        targetType: this.appliedFilters().targetType,
        mappingState: this.appliedFilters().mappingState
      });
      this.isFilterPanelOpen.set(true);
    } else {
      this.closeFilterPanel();
    }
  }

  closeFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  applyFilterPanel() {
    this.appliedFilters.set({
      statuses: [...this.draftFilters().statuses],
      category: this.draftFilters().category,
      sharing: this.draftFilters().sharing,
      level: this.draftFilters().level,
      skills: [...this.draftFilters().skills],
      targetType: this.draftFilters().targetType,
      mappingState: this.draftFilters().mappingState
    });
    this.currentPage.set(1);
    this.isFilterPanelOpen.set(false);
  }

  clearFilterPanelDraft() {
    this.draftFilters.set({
      statuses: [],
      category: null,
      sharing: null,
      level: null,
      skills: [],
      targetType: 'all',
      mappingState: 'all'
    });
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.appliedFilters.set({
      statuses: [],
      category: null,
      sharing: null,
      level: null,
      skills: [],
      targetType: 'all',
      mappingState: 'all'
    });
    this.draftFilters.set({
      statuses: [],
      category: null,
      sharing: null,
      level: null,
      skills: [],
      targetType: 'all',
      mappingState: 'all'
    });
    this.currentPage.set(1);
  }

  resetGrid() {
    this.clearAllFilters();
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  // Draft Mutators
  toggleStatusDraft(status: BadgeTemplateStatus) {
    this.draftFilters.update(curr => {
      const statuses = [...curr.statuses];
      const index = statuses.indexOf(status);
      if (index >= 0) {
        statuses.splice(index, 1);
      } else {
        statuses.push(status);
      }
      return { ...curr, statuses };
    });
  }

  onDraftCategoryChange(cat: any) {
    this.draftFilters.update(curr => ({ ...curr, category: cat || null }));
  }

  onDraftSharingChange(sharing: any) {
    this.draftFilters.update(curr => ({ ...curr, sharing: sharing || null }));
  }

  onDraftLevelChange(lvl: any) {
    this.draftFilters.update(curr => ({ ...curr, level: lvl || null }));
  }

  onDraftSkillsChange(skills: any) {
    const skillList = Array.isArray(skills) ? skills : skills ? [skills] : [];
    this.draftFilters.update(curr => ({ ...curr, skills: skillList }));
  }

  onDraftTargetTypeChange(targetType: any) {
    this.draftFilters.update(curr => ({ ...curr, targetType: targetType || 'all' }));
  }

  onDraftMappingStateChange(mappingState: any) {
    this.draftFilters.update(curr => ({ ...curr, mappingState: mappingState || 'all' }));
  }

  // Applied Filter Removers
  removeStatusFilter(status: BadgeTemplateStatus) {
    this.appliedFilters.update(curr => ({
      ...curr,
      statuses: curr.statuses.filter(s => s !== status)
    }));
    this.currentPage.set(1);
  }

  removeCategoryFilter() {
    this.appliedFilters.update(curr => ({ ...curr, category: null }));
    this.currentPage.set(1);
  }

  removeSharingFilter() {
    this.appliedFilters.update(curr => ({ ...curr, sharing: null }));
    this.currentPage.set(1);
  }

  removeLevelFilter() {
    this.appliedFilters.update(curr => ({ ...curr, level: null }));
    this.currentPage.set(1);
  }

  removeSkillFilter(skill: string) {
    this.appliedFilters.update(curr => ({
      ...curr,
      skills: curr.skills.filter(s => s !== skill)
    }));
    this.currentPage.set(1);
  }

  removeTargetTypeFilter() {
    this.appliedFilters.update(curr => ({ ...curr, targetType: 'all' }));
    this.currentPage.set(1);
  }

  removeMappingStateFilter() {
    this.appliedFilters.update(curr => ({ ...curr, mappingState: 'all' }));
    this.currentPage.set(1);
  }

  // Status Styling Helpers
  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'draft':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      case 'archived':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-base-200 text-text-secondary border-base-300';
    }
  }

  getStatusDotClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-emerald-500';
      case 'draft':
        return 'bg-amber-500';
      case 'archived':
        return 'bg-slate-500';
      default:
        return 'bg-text-secondary';
    }
  }

  // Navigation & Action helpers
  createBadge() {
    this.router.navigate(['/certificates/badges/create']);
  }

  editBadge(badge: BadgeTemplate) {
    this.router.navigate(['/certificates/badges/create'], { queryParams: { edit: badge.templateId } });
  }

  duplicateBadge(badge: BadgeTemplate) {
    this.dataService.duplicateBadgeTemplate(badge.templateId);
  }

  publishBadge(badge: BadgeTemplate) {
    this.dataService.publishBadgeTemplate(badge.templateId);
  }

  openConfirmModal(badge: BadgeTemplate, action: 'archive' | 'delete') {
    this.targetBadge.set(badge);
    this.confirmModalAction.set(action);
  }

  closeConfirmModal() {
    this.confirmModalAction.set(null);
    this.targetBadge.set(null);
  }

  executeConfirmAction() {
    const badge = this.targetBadge();
    const action = this.confirmModalAction();
    if (!badge || !action) return;

    if (action === 'archive') {
      this.dataService.archiveBadgeTemplate(badge.templateId);
    } else if (action === 'delete') {
      this.dataService.deleteBadgeTemplate(badge.templateId);
    }
    this.closeConfirmModal();
  }

  openPreview(badge: BadgeTemplate) {
    this.previewingBadge.set(badge);
    this.previewSampleData.set(true);
  }

  closePreview() {
    this.previewingBadge.set(null);
  }

  // Token sample resolution helper for preview modal
  resolveTokenValue(tokenKey: string, badge: BadgeTemplate): string {
    if (!this.previewSampleData()) {
      return tokenKey;
    }
    const tokenDef = BADGE_PLACEHOLDER_TOKENS.find(t => t.key === tokenKey);
    if (tokenKey === '{{badge_name}}') return badge.name;
    if (tokenKey === '{{badge_level}}') return badge.earning?.level || 'LEVEL 1';
    if (tokenKey === '{{issuer_name}}') return badge.earning?.issuerName || 'BRAC Learning Institute';
    return tokenDef ? tokenDef.sampleValue : tokenKey;
  }

  // Action Menu Handlers (matching skill repository grid pattern)
  toggleBadgeActionMenu(badge: BadgeTemplate, event: MouseEvent, buttonEl?: HTMLElement) {
    event.stopPropagation();
    if (this.activeMenuBadge()?.templateId === badge.templateId) {
      this.closeActionMenu();
      return;
    }

    const button = buttonEl || (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
    const rect = button.getBoundingClientRect();
    const menuHeight = 240;
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
    this.activeMenuBadge.set({ ...badge });
  }

  closeActionMenu() {
    this.activeMenuBadge.set(null);
  }

  isBadgeActionMenuOpen(templateId: string): boolean {
    return this.activeMenuBadge()?.templateId === templateId;
  }

  previewBadgeFromMenu(badge?: BadgeTemplate | null) {
    const b = badge || this.activeMenuBadge();
    if (b) {
      this.openPreview(b);
    }
    this.closeActionMenu();
  }

  editBadgeFromMenu(badge?: BadgeTemplate | null) {
    const b = badge || this.activeMenuBadge();
    if (b) {
      this.editBadge(b);
    }
    this.closeActionMenu();
  }

  duplicateBadgeFromMenu(badge?: BadgeTemplate | null) {
    const b = badge || this.activeMenuBadge();
    if (b) {
      this.duplicateBadge(b);
    }
    this.closeActionMenu();
  }

  publishBadgeFromMenu(badge?: BadgeTemplate | null) {
    const b = badge || this.activeMenuBadge();
    if (b) {
      this.publishBadge(b);
    }
    this.closeActionMenu();
  }

  archiveBadgeFromMenu(badge?: BadgeTemplate | null) {
    const b = badge || this.activeMenuBadge();
    if (b) {
      this.openConfirmModal(b, 'archive');
    }
    this.closeActionMenu();
  }

  deleteBadgeFromMenu(badge?: BadgeTemplate | null) {
    const b = badge || this.activeMenuBadge();
    if (b) {
      this.openConfirmModal(b, 'delete');
    }
    this.closeActionMenu();
  }

  manageMappingsFromMenu(badge?: BadgeTemplate | null) {
    const b = badge || this.activeMenuBadge();
    if (b) {
      this.openManageMappingsModal(b);
    }
    this.closeActionMenu();
  }

  // Polymorphic Mapping Modal Actions
  openManageMappingsModal(badge: BadgeTemplate) {
    this.mappingBadge.set(badge);
    this.mappingTargetType.set('course');
    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
    this.isMappingModalOpen.set(true);
    this.closeActionMenu();
  }

  closeMappingModal() {
    this.isMappingModalOpen.set(false);
    this.mappingBadge.set(null);
  }

  onMappingBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeMappingModal();
    }
  }

  getMappingsForBadge(templateId: string): BadgeMapping[] {
    return this.dataService.badgeMappings().filter(m => m.templateId === templateId);
  }

  onMappingTargetTypeChange(type: any) {
    this.mappingTargetType.set(type || 'course');
    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
  }

  onMappingTargetItemChange(targetId: any) {
    this.mappingTargetId.set(targetId || '');
    if (targetId) {
      const opt = this.mappingTargetItemOptions().find(o => o.value === targetId);
      this.mappingTargetName.set(opt?.label || targetId);
    } else {
      this.mappingTargetName.set('');
    }
  }

  addMapping() {
    const badge = this.mappingBadge();
    const type = this.mappingTargetType();
    const targetId = this.mappingTargetId();
    if (!badge || !targetId) return;

    let targetName = this.mappingTargetName();
    if (!targetName) {
      const opt = this.mappingTargetItemOptions().find(o => o.value === targetId);
      targetName = opt?.label || targetId;
    }

    this.dataService.mapBadgeToElement(
      badge.templateId,
      type,
      targetId,
      targetName
    );

    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
  }

  unmapBadge(templateId: string, targetType: BadgeTargetType, targetId: string) {
    this.dataService.unmapBadgeFromElement(templateId, targetType, targetId);
  }

  getTargetTypeColor(targetType: BadgeTargetType): string {
    switch (targetType) {
      case 'plan':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'course':
      case 'class':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'phase':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'content':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  }

  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.badge-action-menu-dropdown') && !target.closest('.badge-action-menu-btn')) {
      this.closeActionMenu();
    }
  }

  onWindowChange() {
    if (this.activeMenuBadge()) {
      this.closeActionMenu();
    }
  }
}
