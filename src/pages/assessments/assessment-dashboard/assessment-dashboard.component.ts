import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  AssessmentDashboardLayout,
  AssessmentDashboardWidget
} from '../../../models/assessment.model';

@Component({
  selector: 'app-assessment-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assessment-dashboard.component.html',
  styleUrls: ['./assessment-dashboard.component.css']
})
export class AssessmentDashboardComponent {
  lmsService = inject(LmsDataService);

  showStudioDrawer = signal<boolean>(false);

  layout = computed(() => {
    return this.lmsService.assessmentDashboardLayout();
  });

  visibleWidgets = computed(() => {
    return this.layout().widgets.filter(w => w.visible);
  });

  // KPI Calculations
  assessments = computed(() => this.lmsService.assessments());
  attempts = computed(() => this.lmsService.assessmentAttempts());

  totalAssessments = computed(() => this.assessments().length);
  publishedCount = computed(() => this.assessments().filter(a => a.status === 'published').length);
  draftCount = computed(() => this.assessments().filter(a => a.status === 'draft').length);

  manualGradedCount = computed(() => {
    return this.assessments().filter(a => {
      const ver = a.versions.find(v => v.versionId === a.currentVersionId) || a.versions[0];
      return ver?.questions.some(q => q.manualGraded);
    }).length;
  });

  passRate = computed(() => {
    const list = this.attempts();
    if (list.length === 0) return 0;
    const passed = list.filter(a => a.passed).length;
    return Math.round((passed / list.length) * 100);
  });

  // Blockers: Manual questions without instructor assigned
  publishBlockers = computed(() => {
    return this.assessments().filter(a => {
      const ver = a.versions.find(v => v.versionId === a.currentVersionId) || a.versions[0];
      const hasManual = ver?.questions.some(q => q.manualGraded);
      const missingInstructor = !a.responsibleInstructorId || !a.responsibleInstructorName;
      return hasManual && missingInstructor;
    });
  });

  // Studio actions
  toggleWidgetVisibility(widgetId: string): void {
    const current = this.layout();
    const updatedWidgets = current.widgets.map(w => (w.id === widgetId ? { ...w, visible: !w.visible } : w));
    this.lmsService.updateAssessmentDashboardLayout({ ...current, widgets: updatedWidgets });
  }

  updateWidgetSpan(widgetId: string, colSpan: 1 | 2 | 3 | 4): void {
    const current = this.layout();
    const updatedWidgets = current.widgets.map(w => (w.id === widgetId ? { ...w, colSpan } : w));
    this.lmsService.updateAssessmentDashboardLayout({ ...current, widgets: updatedWidgets });
  }

  resetDefaultLayout(): void {
    const current = this.layout();
    const resetWidgets = current.widgets.map(w => ({ ...w, visible: true, colSpan: w.id === 'w-asm-kpi-1' ? (4 as const) : (2 as const) }));
    this.lmsService.updateAssessmentDashboardLayout({ ...current, widgets: resetWidgets });
  }
}
