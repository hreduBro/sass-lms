import { Component, inject, signal, computed, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { BadgeTemplate } from '../../../models/badge-template.model';

export interface BadgeDashboardWidgetConfig {
  id: string;
  type: 'kpi_summary' | 'status_breakdown' | 'sharing_breakdown' | 'level_breakdown' | 'most_used' | 'active_drafts' | 'recent_activity' | 'top_skill_tags';
  title: string;
  visible: boolean;
  colSpanPct: number; // 25, 50, 75, 100
}

export const DEFAULT_BADGE_DASHBOARD_WIDGETS: BadgeDashboardWidgetConfig[] = [
  { id: 'w_kpi', type: 'kpi_summary', title: 'Badge Repository Telemetry', visible: true, colSpanPct: 100 },
  { id: 'w_status', type: 'status_breakdown', title: 'Status Distribution', visible: true, colSpanPct: 50 },
  { id: 'w_sharing', type: 'sharing_breakdown', title: 'Sharing Policy Scope', visible: true, colSpanPct: 50 },
  { id: 'w_level', type: 'level_breakdown', title: 'Badges by Level & Tier', visible: true, colSpanPct: 50 },
  { id: 'w_most_used', type: 'most_used', title: 'Most-Referenced Badges', visible: true, colSpanPct: 50 },
  { id: 'w_drafts', type: 'active_drafts', title: 'Active Creation Drafts', visible: true, colSpanPct: 50 },
  { id: 'w_activity', type: 'recent_activity', title: 'Recent Badge Activity Feed', visible: true, colSpanPct: 50 },
  { id: 'w_tags', type: 'top_skill_tags', title: 'Top Certified Skill Tags', visible: true, colSpanPct: 100 }
];

@Component({
  selector: 'app-badge-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './badge-dashboard.component.html',
  styleUrls: ['./badge-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeDashboardComponent {
  dataService = inject(LmsDataService);
  router = inject(Router);

  // Widget Configuration State
  widgetConfigs = signal<BadgeDashboardWidgetConfig[]>(JSON.parse(JSON.stringify(DEFAULT_BADGE_DASHBOARD_WIDGETS)));

  // Permissions
  permissions = this.dataService.badgePermissions;

  // Data signals
  allBadges = computed<BadgeTemplate[]>(() => this.dataService.badgeTemplates());

  // Metrics & Stats
  stats = computed(() => {
    const badges = this.allBadges();
    return {
      total: badges.length,
      published: badges.filter(b => b.status === 'published').length,
      draft: badges.filter(b => b.status === 'draft').length,
      archived: badges.filter(b => b.status === 'archived').length,

      // Sharing
      privateCount: badges.filter(b => b.sharing.level === 'private').length,
      lmsCount: badges.filter(b => b.sharing.level === 'lms').length,
      orgCount: badges.filter(b => b.sharing.level === 'organization').length
    };
  });

  // Level / Tier Breakdown
  levelBreakdown = computed(() => {
    const counts: Record<string, number> = {};
    this.allBadges().forEach(b => {
      const lvl = b.earning?.level || 'Standard / Unassigned';
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      level: key,
      count: counts[key],
      pct: Math.round((counts[key] / (this.allBadges().length || 1)) * 100)
    })).sort((a, b) => b.count - a.count);
  });

  // Top Most-Used Badges
  mostUsedBadges = computed(() => {
    return [...this.allBadges()]
      .filter(b => b.status === 'published')
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
  });

  // Active Creation Drafts
  creationDrafts = computed(() => {
    return this.allBadges().filter(b => b.status === 'draft');
  });

  // Top Skill Tags Ranking
  topSkillTags = computed(() => {
    const counts: Record<string, number> = {};
    this.allBadges().forEach(b => {
      b.earning?.skillTags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.keys(counts).map(tag => ({
      tag,
      count: counts[tag]
    })).sort((a, b) => b.count - a.count).slice(0, 8);
  });

  // Navigation
  createBadge() {
    this.router.navigate(['/certificates/badges/create']);
  }

  resumeDraft(badge: BadgeTemplate) {
    this.router.navigate(['/certificates/badges/create'], { queryParams: { edit: badge.templateId } });
  }

  deleteDraft(badge: BadgeTemplate) {
    if (confirm(`Are you sure you want to delete draft "${badge.name}"?`)) {
      this.dataService.deleteBadgeTemplate(badge.templateId);
    }
  }

  // Safe Date Formatter for Badge Templates
  formatBadgeDate(dateStr: string | null | undefined, format: 'short' | 'mediumDate' = 'mediumDate'): string {
    if (!dateStr) return '—';
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    let dateObj: Date | null = null;
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
      const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
      const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
      dateObj = new Date(year, month, day, hour, min, sec);
    } else {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }
    if (!dateObj || isNaN(dateObj.getTime())) return dateStr;
    if (format === 'short') {
      return dateObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) + ', ' +
             dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
