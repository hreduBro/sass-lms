import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { CourseEntity, validateCourseEntity, summarizeCourseMetrics } from '../../../models/course.model';
import { KpiCardComponent } from '../../../components/kpi-card/kpi-card.component';
import { Kpi } from '../../../models/dashboard.model';

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  category: string;
  enabled: boolean;
  colSpan: 1 | 2 | 3;
}

@Component({
  selector: 'app-course-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, KpiCardComponent],
  templateUrl: './course-dashboard.component.html'
})
export class CourseDashboardComponent {
  lmsService = inject(LmsDataService);
  private router = inject(Router);

  // Studio Customizer state
  showStudioModal = signal<boolean>(false);

  // Dynamic widgets configuration
  widgets = signal<DashboardWidgetConfig[]>([
    { id: 'kpis', title: 'Telemetry Metrics & KPIs', category: 'Summary', enabled: true, colSpan: 3 },
    { id: 'governance', title: 'Actionable Publish Governance', category: 'Governance', enabled: true, colSpan: 3 },
    { id: 'composition', title: 'Content Family & Format Composition', category: 'Composition', enabled: true, colSpan: 2 },
    { id: 'status_dist', title: 'Lifecycle Status & Versioning', category: 'Distribution', enabled: true, colSpan: 1 },
    { id: 'drafts', title: 'Resumable Drafts in Progress', category: 'Activity', enabled: true, colSpan: 2 },
    { id: 'adoption', title: 'Curriculum Plan & Phase Adoption', category: 'Adoption', enabled: true, colSpan: 1 },
    { id: 'categories', title: 'Categories & Tag Distribution', category: 'Taxonomy', enabled: true, colSpan: 1 },
    { id: 'owners', title: 'Course Ownership & Governance', category: 'Governance', enabled: true, colSpan: 2 },
    { id: 'reviews', title: 'Learner Satisfaction & Review Telemetry', category: 'Feedback', enabled: true, colSpan: 3 }
  ]);

  // Reactive courses for active tenant/LMS
  courses = computed<CourseEntity[]>(() => {
    return this.lmsService.activeLmsCourseEntities();
  });

  // Computed KPIs
  stats = computed(() => {
    const list = this.courses();
    const total = list.length;
    const published = list.filter(c => c.status === 'published').length;
    const drafts = list.filter(c => c.status === 'draft').length;
    const inactive = list.filter(c => c.status === 'inactive').length;
    const multiVersion = list.filter(c => (c.version.versionNumber || 1) > 1 || (c.versionHistory && c.versionHistory.length > 0)).length;

    let totalLearning = 0;
    let totalAssessments = 0;
    let totalManualGrading = 0;
    let totalNodes = 0;

    for (const crs of list) {
      const m = summarizeCourseMetrics(crs);
      totalLearning += m.learningCount;
      totalAssessments += m.assessmentCount;
      totalManualGrading += m.manualGradingCount;
      totalNodes += m.totalNodes;
    }

    const totalPhasesLocked = list.reduce((sum, c) => sum + (c.usedInPhasesCount || 0), 0);

    return {
      total,
      published,
      drafts,
      inactive,
      multiVersion,
      totalLearning,
      totalAssessments,
      totalManualGrading,
      totalNodes,
      totalPhasesLocked
    };
  });

  // KPI Computations for standardized app-kpi-card design matching LMS Dashboard
  kpiTotalCourses = computed<Kpi>(() => ({
    title: 'Total Courses',
    value: String(this.stats().total),
    subtext: `${this.stats().totalNodes} structural nodes`,
    icon: 'school',
    color: 'rose'
  }));

  kpiPublished = computed<Kpi>(() => ({
    title: 'Published Live',
    value: String(this.stats().published),
    subtext: 'Active curriculum catalog',
    icon: 'check',
    color: 'emerald'
  }));

  kpiDrafts = computed<Kpi>(() => ({
    title: 'Drafts',
    value: String(this.stats().drafts),
    subtext: 'Under active composition',
    icon: 'draft',
    color: 'sky'
  }));

  kpiLearningUnits = computed<Kpi>(() => ({
    title: 'Learning Units',
    value: String(this.stats().totalLearning),
    subtext: 'Videos, slides & labs',
    icon: 'layers',
    color: 'teal'
  }));

  kpiAssessments = computed<Kpi>(() => ({
    title: 'Assessments',
    value: String(this.stats().totalAssessments),
    subtext: `${this.stats().totalManualGrading} manual graded`,
    icon: 'hub',
    color: 'violet'
  }));

  kpiPlanUsages = computed<Kpi>(() => ({
    title: 'Plan Usages',
    value: String(this.stats().totalPhasesLocked),
    subtext: 'Active phase snapshots',
    icon: 'pending',
    color: 'amber'
  }));

  // Blocked Draft Courses needing attention (Rule Engines 1, 2, 3 check)
  governanceBlockers = computed(() => {
    const drafts = this.courses().filter(c => c.status === 'draft');
    const blockers: { course: CourseEntity; validation: any }[] = [];

    for (const crs of drafts) {
      const val = validateCourseEntity(crs);
      if (!val.publishable) {
        blockers.push({ course: crs, validation: val });
      }
    }
    return blockers;
  });

  // Content format breakdowns
  contentBreakdown = computed(() => {
    const list = this.courses();
    let video = 0;
    let reading = 0;
    let interactive = 0;
    let document = 0;
    let audio = 0;
    let quiz = 0;
    let assignment = 0;

    for (const crs of list) {
      function traverse(node: any) {
        if (node.content) {
          for (const item of node.content) {
            if (item.family === 'learning') {
              if (item.learning?.subtype === 'video') video++;
              else if (item.learning?.subtype === 'interactive') interactive++;
              else if (item.learning?.subtype === 'document') document++;
              else if (item.learning?.subtype === 'audio') audio++;
              else reading++;
            } else {
              if (item.assessment?.subtype === 'quiz') quiz++;
              else if (item.assessment?.subtype === 'assignment') assignment++;
            }
          }
        }
        if (node.children) {
          for (const ch of node.children) traverse(ch);
        }
      }
      for (const root of crs.structure || []) {
        traverse(root);
      }
    }

    const total = video + reading + interactive + document + audio + quiz + assignment || 1;

    return {
      video,
      reading,
      interactive,
      document,
      audio,
      quiz,
      assignment,
      totalItems: total,
      videoPct: Math.round((video / total) * 100),
      readingPct: Math.round((reading / total) * 100),
      interactivePct: Math.round((interactive / total) * 100),
      quizPct: Math.round((quiz / total) * 100),
      assignmentPct: Math.round((assignment / total) * 100)
    };
  });

  // Category counts
  categoryBreakdown = computed(() => {
    const counts = new Map<string, number>();
    for (const c of this.courses()) {
      counts.set(c.category, (counts.get(c.category) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([cat, count]) => ({
      category: cat,
      count,
      pct: Math.round((count / (this.courses().length || 1)) * 100)
    })).sort((a, b) => b.count - a.count);
  });

  // Top adopted courses
  topAdoptedCourses = computed(() => {
    return [...this.courses()]
      .sort((a, b) => (b.usedInPhasesCount || 0) - (a.usedInPhasesCount || 0))
      .slice(0, 5);
  });

  // Resumable Drafts
  resumableDrafts = computed(() => {
    return this.courses().filter(c => c.status === 'draft').slice(0, 4);
  });

  // Ownership breakdown
  ownersBreakdown = computed(() => {
    const map = new Map<string, { name: string; avatar: string; email: string; count: number; published: number }>();
    for (const c of this.courses()) {
      const existing = map.get(c.ownerId) || {
        name: c.ownerName,
        avatar: c.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        email: c.ownerEmail,
        count: 0,
        published: 0
      };
      existing.count++;
      if (c.status === 'published') existing.published++;
      map.set(c.ownerId, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  });

  // Quick Action methods
  openBuilder(courseId?: string) {
    if (courseId) {
      this.router.navigate(['/courses/edit', courseId]);
    } else {
      this.router.navigate(['/courses/create']);
    }
  }

  isWidgetEnabled(id: string): boolean {
    return this.widgets().find(w => w.id === id)?.enabled ?? true;
  }

  toggleWidget(id: string) {
    this.widgets.update(list => list.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  }

  resetWidgets() {
    this.widgets.update(list => list.map(w => ({ ...w, enabled: true })));
    this.lmsService.showToast('Dashboard layout reset to default settings.', 'info', 2500, 'Layout Reset');
  }
}
