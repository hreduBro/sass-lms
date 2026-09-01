import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { KpiCardComponent } from '../../../components/kpi-card/kpi-card.component';
import {
  Assessment,
  AssessmentAttempt,
  AssessmentDashboardLayout,
  AssessmentDashboardWidget,
  DEFAULT_ASSESSMENT_DASHBOARD_LAYOUT
} from '../../../models/assessment.model';
import { Kpi } from '../../../models/dashboard.model';

@Component({
  selector: 'app-assessment-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, KpiCardComponent],
  templateUrl: './assessment-dashboard.component.html',
  styleUrls: ['./assessment-dashboard.component.css']
})
export class AssessmentDashboardComponent implements OnInit {
  lmsService = inject(LmsDataService);

  isStudioMode = signal<boolean>(false);
  showStudioDrawer = signal<boolean>(false);
  draftWidgets = signal<AssessmentDashboardWidget[]>([]);
  timeRange = signal<'all' | '30d' | '90d'>('all');

  activeTenant = computed(() => this.lmsService.activeTenant());
  activeLms = computed(() => this.lmsService.activeLms());

  layout = computed(() => {
    return this.lmsService.assessmentDashboardLayout() || DEFAULT_ASSESSMENT_DASHBOARD_LAYOUT;
  });

  visibleWidgets = computed(() => {
    const wList = this.layout().widgets || [];
    return [...wList].filter(w => w.visible).sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  // Base collections
  assessments = computed(() => this.lmsService.assessments());
  attempts = computed(() => this.lmsService.assessmentAttempts());

  // High-Level KPI Calculations
  totalAssessments = computed(() => this.assessments().length);
  publishedCount = computed(() => this.assessments().filter(a => a.status === 'published').length);
  draftCount = computed(() => this.assessments().filter(a => a.status === 'draft' || a.status === 'archived').length);

  manualGradedCount = computed(() => {
    return this.assessments().filter(a => {
      const ver = a.versions.find(v => v.versionId === a.currentVersionId) || a.versions[0];
      return ver?.questions.some(q => q.manualGraded);
    }).length;
  });

  totalQuestionsInBank = computed(() => {
    return this.assessments().reduce((sum, a) => {
      const ver = a.versions.find(v => v.versionId === a.currentVersionId) || a.versions[0];
      return sum + (ver?.questions.length || 0);
    }, 0);
  });

  passRate = computed(() => {
    const list = this.attempts();
    if (list.length === 0) return 78;
    const passed = list.filter(a => a.passed).length;
    return Math.round((passed / list.length) * 100);
  });

  avgScore = computed(() => {
    const list = this.attempts();
    if (list.length === 0) return 82;
    const total = list.reduce((sum, a) => sum + (a.percentage || 0), 0);
    return Math.round(total / list.length);
  });

  totalAttemptsCount = computed(() => this.attempts().length);

  // Structured KPI Data for app-kpi-card
  kpiTotalInstruments = computed<Kpi>(() => ({
    title: 'Total Instruments',
    value: this.totalAssessments().toString(),
    change: '+14% active scope',
    icon: 'school',
    color: 'indigo'
  }));

  kpiPublished = computed<Kpi>(() => ({
    title: 'Published & Live',
    value: this.publishedCount().toString(),
    change: `${this.publishedCount()}/${this.totalAssessments()} certified`,
    icon: 'check',
    color: 'emerald'
  }));

  kpiPassVelocity = computed<Kpi>(() => ({
    title: 'Average Pass Rate',
    value: `${this.passRate()}%`,
    change: '+3.5% vs cohort benchmark',
    icon: 'trending',
    color: 'sky'
  }));

  kpiManualGraded = computed<Kpi>(() => ({
    title: 'Manual Review Queue',
    value: this.manualGradedCount().toString(),
    change: `${this.manualGradedCount()} require instructor review`,
    icon: 'pending',
    color: 'violet'
  }));

  // Type Distribution breakdown
  typeDistribution = computed(() => {
    const all = this.assessments();
    const total = all.length || 1;
    const types: Record<string, { count: number; label: string; icon: string; color: string }> = {
      exam: { count: 0, label: 'Formal Exams', icon: 'military_tech', color: 'bg-tenant-500' },
      quiz: { count: 0, label: 'Quick Quizzes', icon: 'quiz', color: 'bg-sky-500' },
      assignment: { count: 0, label: 'Assignments', icon: 'assignment', color: 'bg-purple-500' },
      survey: { count: 0, label: 'Feedback Surveys', icon: 'rate_review', color: 'bg-emerald-500' },
      diagnostic: { count: 0, label: 'Diagnostics', icon: 'troubleshoot', color: 'bg-amber-500' }
    };

    all.forEach(a => {
      const t = a.type || 'exam';
      if (types[t]) {
        types[t].count++;
      } else {
        types.exam.count++;
      }
    });

    return Object.entries(types).map(([key, info]) => ({
      type: key,
      label: info.label,
      icon: info.icon,
      count: info.count,
      percent: Math.round((info.count / total) * 100),
      color: info.color
    }));
  });

  // Governance Blockers
  publishBlockers = computed(() => {
    return this.assessments().filter(a => {
      const ver = a.versions.find(v => v.versionId === a.currentVersionId) || a.versions[0];
      const hasManual = ver?.questions.some(q => q.manualGraded);
      const missingInstructor = !a.responsibleInstructorId || !a.responsibleInstructorName;
      const noQuestions = !ver || ver.questions.length === 0;
      return (hasManual && missingInstructor) || noQuestions;
    }).map(a => {
      const ver = a.versions.find(v => v.versionId === a.currentVersionId) || a.versions[0];
      const noQuestions = !ver || ver.questions.length === 0;
      return {
        ...a,
        reason: noQuestions
          ? 'Zero authored questions in active version'
          : 'Manual questions require an assigned responsible instructor for grading'
      };
    });
  });

  // Score distribution tiers
  scoreTiers = computed(() => {
    const list = this.attempts();
    const tiers = {
      excellent: 0, // >= 85
      good: 0,      // 70 - 84
      passing: 0,   // 60 - 69
      needsReview: 0 // < 60
    };

    if (list.length === 0) {
      return [
        { label: 'Exemplary (85–100%)', count: 18, pct: 45, color: 'bg-emerald-500' },
        { label: 'Proficient (70–84%)', count: 14, pct: 35, color: 'bg-tenant-500' },
        { label: 'Passing (60–69%)', count: 6, pct: 15, color: 'bg-amber-500' },
        { label: 'Remediation (<60%)', count: 2, pct: 5, color: 'bg-rose-500' }
      ];
    }

    list.forEach(a => {
      const pct = a.percentage || 0;
      if (pct >= 85) tiers.excellent++;
      else if (pct >= 70) tiers.good++;
      else if (pct >= 60) tiers.passing++;
      else tiers.needsReview++;
    });

    const total = list.length;
    return [
      { label: 'Exemplary (85–100%)', count: tiers.excellent, pct: Math.round((tiers.excellent / total) * 100), color: 'bg-emerald-500' },
      { label: 'Proficient (70–84%)', count: tiers.good, pct: Math.round((tiers.good / total) * 100), color: 'bg-tenant-500' },
      { label: 'Passing (60–69%)', count: tiers.passing, pct: Math.round((tiers.passing / total) * 100), color: 'bg-amber-500' },
      { label: 'Remediation (<60%)', count: tiers.needsReview, pct: Math.round((tiers.needsReview / total) * 100), color: 'bg-rose-500' }
    ];
  });

  // Top Attempted Assessments Leaderboard
  topAttemptedAssessments = computed(() => {
    const list = this.assessments();
    const attempts = this.attempts();

    return list.map(asm => {
      const asmAttempts = attempts.filter(att => att.assessmentId === asm.assessmentId);
      const count = asmAttempts.length;
      const avg = count > 0
        ? Math.round(asmAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / count)
        : 84;
      const passedCount = asmAttempts.filter(a => a.passed).length;
      const passRateVal = count > 0 ? Math.round((passedCount / count) * 100) : 90;
      const ver = asm.versions.find(v => v.versionId === asm.currentVersionId) || asm.versions[0];

      return {
        ...asm,
        attemptCount: count > 0 ? count : (asm.status === 'published' ? 24 : 0),
        avgScore: avg,
        passRate: passRateVal,
        questionCount: ver?.questions.length || 0,
        versionLabel: ver?.versionLabel || 'v1'
      };
    }).sort((a, b) => b.attemptCount - a.attemptCount);
  });

  // Recent Assessment Activity Stream
  recentActivities = computed(() => {
    const attempts = this.attempts();
    const list = this.assessments();

    const activities: {
      id: string;
      title: string;
      subtitle: string;
      timestamp: string;
      type: 'attempt' | 'author' | 'publish' | 'grade';
      badgeText: string;
      badgeClass: string;
      icon: string;
      link?: string;
    }[] = [];

    // Add attempts
    attempts.slice(0, 6).forEach(att => {
      const asm = list.find(a => a.assessmentId === att.assessmentId);
      activities.push({
        id: att.attemptId,
        title: `${att.traineeName} completed ${asm?.title || 'Exam'}`,
        subtitle: `Score: ${att.percentage}% (${att.totalScore}/${att.maxScore} pts) • Status: ${att.passed ? 'Passed' : 'Needs Review'}`,
        timestamp: att.submittedAt || 'Today',
        type: 'attempt',
        badgeText: att.passed ? 'PASSED' : 'RETAKE',
        badgeClass: att.passed
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
        icon: 'fact_check',
        link: `/assessments/results/${att.attemptId}`
      });
    });

    // Add recent authorings
    list.slice(0, 3).forEach(asm => {
      activities.push({
        id: `asm-${asm.assessmentId}`,
        title: `${asm.status === 'published' ? 'Published live' : 'Drafted version'}: ${asm.title}`,
        subtitle: `Code: ${asm.code} • Responsible: ${asm.responsibleInstructorName || 'Department Head'}`,
        timestamp: asm.updatedAt || 'Recent',
        type: asm.status === 'published' ? 'publish' : 'author',
        badgeText: asm.status.toUpperCase(),
        badgeClass: asm.status === 'published'
          ? 'bg-tenant-50 text-tenant-700 dark:bg-tenant-950/60 dark:text-tenant-300 border-tenant-200'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
        icon: 'quiz',
        link: `/assessments/edit/${asm.assessmentId}`
      });
    });

    return activities.slice(0, 8);
  });

  ngOnInit(): void {
    this.draftWidgets.set(JSON.parse(JSON.stringify(this.layout().widgets || DEFAULT_ASSESSMENT_DASHBOARD_LAYOUT.widgets)));
  }

  // Studio Mode Functions
  enterStudioMode(): void {
    this.draftWidgets.set(JSON.parse(JSON.stringify(this.layout().widgets || DEFAULT_ASSESSMENT_DASHBOARD_LAYOUT.widgets)));
    this.isStudioMode.set(true);
  }

  discardStudio(): void {
    this.draftWidgets.set(JSON.parse(JSON.stringify(this.layout().widgets || DEFAULT_ASSESSMENT_DASHBOARD_LAYOUT.widgets)));
    this.isStudioMode.set(false);
  }

  publishStudio(): void {
    const current = this.layout();
    const updatedLayout: AssessmentDashboardLayout = {
      ...current,
      widgets: this.draftWidgets(),
      updatedAt: new Date().toLocaleDateString()
    };
    this.lmsService.updateAssessmentDashboardLayout(updatedLayout);
    this.isStudioMode.set(false);
  }

  resetStudioDefault(): void {
    this.draftWidgets.set(JSON.parse(JSON.stringify(DEFAULT_ASSESSMENT_DASHBOARD_LAYOUT.widgets)));
  }

  toggleWidgetVisibility(widgetId: string): void {
    this.draftWidgets.update(list =>
      list.map(w => (w.id === widgetId ? { ...w, visible: !w.visible } : w))
    );
  }

  setWidgetWidth(widgetId: string, colSpan: 25 | 50 | 75 | 100): void {
    this.draftWidgets.update(list =>
      list.map(w => (w.id === widgetId ? { ...w, columnSpan: colSpan } : w))
    );
  }

  getWidgetColClass(colSpan?: number): string {
    switch (colSpan) {
      case 25:
        return 'col-span-1 md:col-span-1 lg:col-span-3';
      case 50:
        return 'col-span-1 md:col-span-2 lg:col-span-6';
      case 75:
        return 'col-span-1 md:col-span-3 lg:col-span-9';
      case 100:
      default:
        return 'col-span-1 md:col-span-2 lg:col-span-12';
    }
  }
}
