import { Component, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  BadgeTemplate,
  BadgeTemplateStatus,
  BadgeSharingLevel,
  BadgeCategory,
  BadgeLevel,
  BadgeBaseShape,
  BADGE_PLACEHOLDER_TOKENS
} from '../../../models/badge-template.model';

@Component({
  selector: 'app-badge-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './badge-grid.component.html',
  styleUrls: ['./badge-grid.component.css']
})
export class BadgeGridComponent {
  dataService = inject(LmsDataService);
  router = inject(Router);

  // Search & Filter state
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('ALL');
  selectedSharing = signal<string>('ALL');
  selectedCategory = signal<string>('ALL');
  selectedLevel = signal<string>('ALL');
  selectedSkillTag = signal<string>('ALL');

  // Preview Modal state
  previewingBadge = signal<BadgeTemplate | null>(null);
  previewSampleData = signal<boolean>(true);

  // Confirmation Modal state
  confirmModalAction = signal<'archive' | 'delete' | null>(null);
  targetBadge = signal<BadgeTemplate | null>(null);

  // Permissions
  permissions = this.dataService.badgePermissions;

  // Categories & Levels options
  readonly categories: BadgeCategory[] = ['Skill', 'Achievement', 'Participation', 'Milestone', 'Certification'];
  readonly levels: BadgeLevel[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];

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

  // Filtered Badges
  filteredBadges = computed<BadgeTemplate[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const sharing = this.selectedSharing();
    const category = this.selectedCategory();
    const level = this.selectedLevel();
    const skillTag = this.selectedSkillTag();

    return this.allBadges().filter(badge => {
      // Search
      if (query) {
        const matchName = badge.name.toLowerCase().includes(query);
        const matchId = badge.templateId.toLowerCase().includes(query);
        const matchDesc = (badge.description || '').toLowerCase().includes(query);
        const matchCriteria = (badge.earning?.criteria || '').toLowerCase().includes(query);
        const matchTags = badge.earning?.skillTags?.some(t => t.toLowerCase().includes(query)) || false;
        if (!matchName && !matchId && !matchDesc && !matchCriteria && !matchTags) return false;
      }

      // Status Filter
      if (status !== 'ALL' && badge.status !== status.toLowerCase()) return false;

      // Sharing Filter
      if (sharing !== 'ALL' && badge.sharing.level !== sharing.toLowerCase()) return false;

      // Category Filter
      if (category !== 'ALL' && badge.category !== category) return false;

      // Level Filter
      if (level !== 'ALL' && badge.earning?.level !== level) return false;

      // Skill Tag Filter
      if (skillTag !== 'ALL' && !badge.earning?.skillTags?.includes(skillTag)) return false;

      return true;
    });
  });

  // Has active filters
  hasActiveFilters = computed<boolean>(() => {
    return (
      this.searchQuery().length > 0 ||
      this.selectedStatus() !== 'ALL' ||
      this.selectedSharing() !== 'ALL' ||
      this.selectedCategory() !== 'ALL' ||
      this.selectedLevel() !== 'ALL' ||
      this.selectedSkillTag() !== 'ALL'
    );
  });

  // Actions
  clearFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('ALL');
    this.selectedSharing.set('ALL');
    this.selectedCategory.set('ALL');
    this.selectedLevel.set('ALL');
    this.selectedSkillTag.set('ALL');
  }

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
