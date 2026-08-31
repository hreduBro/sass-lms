import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  CourseTemplate,
  CourseSlotType,
  calculateTemplateDuration,
  countTemplateSlots
} from '../../../models/course-template.model';

@Component({
  selector: 'app-course-template-dashboard',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './course-template-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseTemplateDashboardComponent {
  protected readonly Math = Math;
  lms = inject(LmsDataService);
  private router = inject(Router);

  // Active context
  activeTenant = this.lms.activeTenant;
  activeLms = this.lms.activeLms;
  permissions = this.lms.courseTemplatePermissions;
  stats = this.lms.courseTemplateStats;
  templates = this.lms.scopedCourseTemplates;

  // Most adopted templates leaderboard
  topAdoptedTemplates = computed<CourseTemplate[]>(() => {
    const list = [...this.templates()];
    return list
      .sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0))
      .slice(0, 5);
  });

  // Recent activity logs / updated templates
  recentlyUpdatedTemplates = computed<CourseTemplate[]>(() => {
    const list = [...this.templates()];
    return list
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, 6);
  });

  // Slot types distribution computed
  slotTypeDistribution = computed<{ type: string; label: string; count: number; percentage: number; color: string }[]>(() => {
    const counts: Record<string, number> = {
      video: 0,
      article: 0,
      quiz: 0,
      interactive_lab: 0,
      simulation: 0,
      scorm: 0
    };

    let total = 0;
    this.templates().forEach(t => {
      t.structure.modules.forEach(m => {
        (m.contentSlots || []).forEach(s => {
          counts[s.type] = (counts[s.type] || 0) + 1;
          total++;
        });
      });
    });

    if (total === 0) total = 1;

    return [
      { type: 'video', label: 'Video Lectures', count: counts['video'], percentage: Math.round((counts['video'] / total) * 100), color: 'bg-sky-500' },
      { type: 'article', label: 'Reading Articles', count: counts['article'], percentage: Math.round((counts['article'] / total) * 100), color: 'bg-blue-500' },
      { type: 'quiz', label: 'Knowledge Quizzes', count: counts['quiz'], percentage: Math.round((counts['quiz'] / total) * 100), color: 'bg-amber-500' },
      { type: 'interactive_lab', label: 'Interactive Labs', count: counts['interactive_lab'], percentage: Math.round((counts['interactive_lab'] / total) * 100), color: 'bg-purple-500' },
      { type: 'simulation', label: 'Simulations', count: counts['simulation'], percentage: Math.round((counts['simulation'] / total) * 100), color: 'bg-rose-500' }
    ];
  });

  // Scope breakdown
  scopeBreakdown = computed(() => {
    let lmsCount = 0;
    let orgCount = 0;
    this.templates().forEach(t => {
      if (t.scope === 'organization') orgCount++;
      else lmsCount++;
    });
    return { lmsCount, orgCount, total: this.templates().length };
  });

  // Average modules and slots
  averageMetrics = computed(() => {
    const tpls = this.templates();
    if (tpls.length === 0) return { avgModules: 0, avgSlots: 0, avgDuration: 0 };

    let totalModules = 0;
    let totalSlots = 0;
    let totalDuration = 0;

    tpls.forEach(t => {
      totalModules += t.structure.modules.length;
      totalSlots += countTemplateSlots(t.structure);
      totalDuration += calculateTemplateDuration(t.structure);
    });

    return {
      avgModules: (totalModules / tpls.length).toFixed(1),
      avgSlots: (totalSlots / tpls.length).toFixed(1),
      avgDuration: Math.round(totalDuration / tpls.length)
    };
  });
}
