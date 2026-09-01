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
import { KpiCardComponent } from '../../../components/kpi-card/kpi-card.component';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';
import { Kpi } from '../../../models/dashboard.model';

@Component({
  selector: 'app-course-template-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    KpiCardComponent,
    CustomAvatarComponent
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

  // KPI Data Computed for app-kpi-card components
  kpiBlueprints = computed<Kpi>(() => ({
    title: 'Active Blueprints',
    value: String(this.stats().activeTemplates),
    change: `+${this.stats().totalTemplates} total`,
    icon: 'layers',
    color: 'indigo'
  }));

  kpiAdoptions = computed<Kpi>(() => ({
    title: 'Course Adoptions',
    value: String(this.stats().totalCoursesSpawned),
    change: '+14% adoption',
    icon: 'school',
    color: 'emerald'
  }));

  kpiAvgDuration = computed<Kpi>(() => ({
    title: 'Avg Curriculum Time',
    value: `${this.averageMetrics().avgDuration}m`,
    change: `${this.averageMetrics().avgSlots} slots avg`,
    icon: 'activity',
    color: 'sky'
  }));

  kpiDrafts = computed<Kpi>(() => ({
    title: 'Drafts Pipeline',
    value: String(this.stats().draftTemplates + this.stats().inactiveTemplates),
    change: `${this.stats().draftTemplates} in authoring`,
    icon: 'pending',
    color: 'amber'
  }));

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
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
      .slice(0, 6);
  });

  // Slot types distribution computed
  slotTypeDistribution = computed<{ type: string; label: string; count: number; percentage: number; color: string; icon: string }[]>(() => {
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
      { type: 'video', label: 'Video Lectures', count: counts['video'], percentage: Math.round((counts['video'] / total) * 100), color: 'bg-sky-500', icon: 'videocam' },
      { type: 'article', label: 'Reading Articles & Guides', count: counts['article'], percentage: Math.round((counts['article'] / total) * 100), color: 'bg-blue-500', icon: 'article' },
      { type: 'quiz', label: 'Formative Quizzes & Exams', count: counts['quiz'], percentage: Math.round((counts['quiz'] / total) * 100), color: 'bg-amber-500', icon: 'quiz' },
      { type: 'interactive_lab', label: 'Interactive Hands-on Labs', count: counts['interactive_lab'], percentage: Math.round((counts['interactive_lab'] / total) * 100), color: 'bg-purple-500', icon: 'science' },
      { type: 'simulation', label: 'Simulations & Scenarios', count: counts['simulation'], percentage: Math.round((counts['simulation'] / total) * 100), color: 'bg-rose-500', icon: 'smart_toy' }
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
    if (tpls.length === 0) return { avgModules: '0.0', avgSlots: '0.0', avgDuration: 0, avgPassingScore: 70 };

    let totalModules = 0;
    let totalSlots = 0;
    let totalDuration = 0;
    let totalPassingScore = 0;

    tpls.forEach(t => {
      totalModules += t.structure.modules.length;
      totalSlots += countTemplateSlots(t.structure);
      totalDuration += calculateTemplateDuration(t.structure);
      totalPassingScore += t.structure.structuralDefaults?.passingScorePercent || 70;
    });

    return {
      avgModules: (totalModules / tpls.length).toFixed(1),
      avgSlots: (totalSlots / tpls.length).toFixed(1),
      avgDuration: Math.round(totalDuration / tpls.length),
      avgPassingScore: Math.round(totalPassingScore / tpls.length)
    };
  });
}
