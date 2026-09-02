import { Component, inject, signal, computed, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import {
  BadgeTemplate,
  BadgeTemplateStatus,
  BadgeSharingLevel,
  BadgeCategory,
  BadgeLevel,
  BadgeBaseShape,
  BADGE_PLACEHOLDER_TOKENS
} from '../../../models/badge-template.model';

export interface BadgeFilterState {
  statuses: BadgeTemplateStatus[];
  category: BadgeCategory | 'ALL' | null;
  sharing: BadgeSharingLevel | 'ALL' | null;
  level: BadgeLevel | 'ALL' | null;
  skills: string[];
}

@Component({
  selector: 'app-badge-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './badge-grid.component.html',
  styleUrls: ['./badge-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeGridComponent {
  dataService = inject(LmsDataService);
  router = inject(Router);

  // Search & Filter Panel State
  searchQuery = signal<string>('');
  isFilterPanelOpen = signal<boolean>(false);

  appliedFilters = signal<BadgeFilterState>({
    statuses: [],
    category: null,
    sharing: null,
    level: null,
    skills: []
  });

  draftFilters = signal<BadgeFilterState>({
    statuses: [],
    category: null,
    sharing: null,
    level: null,
    skills: []
  });

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
    return {
      total: badges.length,
      published: badges.filter(b => b.status === 'published').length,
      draft: badges.filter(b => b.status === 'draft').length,
      archived: badges.filter(b => b.status === 'archived').length
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
      f.skills.length > 0
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
    return count;
  });

  // Filtered Badges computed
  filteredBadges = computed<BadgeTemplate[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const f = this.appliedFilters();

    return this.allBadges().filter(badge => {
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

      // Skills Filter (must match at least one of the selected skills if selected)
      if (f.skills.length > 0) {
        const badgeTags = badge.earning?.skillTags || [];
        const hasMatchingSkill = f.skills.some(sk => badgeTags.includes(sk));
        if (!hasMatchingSkill) {
          return false;
        }
      }

      return true;
    });
  });

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

    return list;
  });

  // Filter Drawer toggles and actions
  toggleFilterPanel() {
    if (!this.isFilterPanelOpen()) {
      // Sync draft with currently applied filters
      this.draftFilters.set({
        statuses: [...this.appliedFilters().statuses],
        category: this.appliedFilters().category,
        sharing: this.appliedFilters().sharing,
        level: this.appliedFilters().level,
        skills: [...this.appliedFilters().skills]
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
      skills: [...this.draftFilters().skills]
    });
    this.isFilterPanelOpen.set(false);
  }

  clearFilterPanelDraft() {
    this.draftFilters.set({
      statuses: [],
      category: null,
      sharing: null,
      level: null,
      skills: []
    });
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.appliedFilters.set({
      statuses: [],
      category: null,
      sharing: null,
      level: null,
      skills: []
    });
    this.draftFilters.set({
      statuses: [],
      category: null,
      sharing: null,
      level: null,
      skills: []
    });
  }

  resetGrid() {
    this.clearAllFilters();
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
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

  // Applied Filter Removers
  removeStatusFilter(status: BadgeTemplateStatus) {
    this.appliedFilters.update(curr => ({
      ...curr,
      statuses: curr.statuses.filter(s => s !== status)
    }));
  }

  removeCategoryFilter() {
    this.appliedFilters.update(curr => ({ ...curr, category: null }));
  }

  removeSharingFilter() {
    this.appliedFilters.update(curr => ({ ...curr, sharing: null }));
  }

  removeLevelFilter() {
    this.appliedFilters.update(curr => ({ ...curr, level: null }));
  }

  removeSkillFilter(skill: string) {
    this.appliedFilters.update(curr => ({
      ...curr,
      skills: curr.skills.filter(s => s !== skill)
    }));
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
    if (badge.status === 'published') {
      if (!confirm(`Are you sure you want to edit published badge "${badge.name}"? Changes will update the template version.`)) {
        return;
      }
    }
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
}
