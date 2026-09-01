import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import {
  CertificateDashboardWidget,
  CertificateDashboardLayout,
  CertificateWidgetType,
  CertificateTemplate
} from '../../../models/certificate-template.model';

@Component({
  selector: 'app-certificate-template-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './template-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CertificateTemplateDashboardComponent {
  lms = inject(LmsDataService);
  private router = inject(Router);
  private confirmModal = inject(ConfirmationModalService);

  // Studio Mode State
  isStudioMode = signal<boolean>(false);
  draftWidgets = signal<CertificateDashboardWidget[]>([]);
  showAddWidgetModal = signal<boolean>(false);

  // Published Layout & Computeds
  publishedLayout = this.lms.certificateDashboardLayout;
  kpi = this.lms.certificateKpis;
  templates = this.lms.scopedCertificateTemplates;
  activities = this.lms.certificateActivities;
  drafts = this.lms.activeCertificateDrafts;

  // Active User / Permissions
  permissions = this.lms.certificateTemplatePermissions;
  activeTenant = this.lms.activeTenant;
  activeLms = this.lms.activeLms;

  // Displayed widgets (Studio vs Live)
  displayedWidgets = computed<CertificateDashboardWidget[]>(() => {
    if (this.isStudioMode()) {
      return this.draftWidgets();
    }
    return this.publishedLayout().widgets;
  });

  // Top ranked templates by Phase reference count
  mostUsedTemplates = computed<CertificateTemplate[]>(() => {
    return [...this.templates()]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);
  });

  // Widget Catalog available to add
  widgetCatalog: { type: CertificateWidgetType; title: string; subtitle: string; icon: string; defaultCol: 1 | 2 | 3 | 4 }[] = [
    { type: 'kpi_summary', title: 'Template KPI Summary', subtitle: 'Lifecycle counts and status distribution', icon: 'speed', defaultCol: 4 },
    { type: 'status_breakdown', title: 'Status Breakdown', subtitle: 'Ratio of Published, Draft, and Archived', icon: 'pie_chart', defaultCol: 2 },
    { type: 'sharing_breakdown', title: 'Sharing Policy Distribution', subtitle: 'Private vs LMS vs Org-shared assets', icon: 'share', defaultCol: 2 },
    { type: 'most_used_templates', title: 'Most-Used Templates (Top Ranked)', subtitle: 'Curriculum phase adoption ranking', icon: 'leaderboard', defaultCol: 2 },
    { type: 'active_drafts', title: 'Active Creation Drafts', subtitle: 'Resumable wizards with step tracking', icon: 'edit_document', defaultCol: 2 },
    { type: 'recent_activity', title: 'Recent Template Activity', subtitle: 'Audit feed of publishing & edits', icon: 'history', defaultCol: 2 },
    { type: 'templates_snapshot', title: 'Templates Snapshot', subtitle: 'Visual inspection cards of top templates', icon: 'dashboard', defaultCol: 2 }
  ];

  // Studio Mode Operations
  enterStudioMode() {
    this.draftWidgets.set(JSON.parse(JSON.stringify(this.publishedLayout().widgets)));
    this.isStudioMode.set(true);
    this.lms.showToast('Entered Certificate Dashboard Studio mode', 'info');
  }

  discardStudioChanges() {
    this.isStudioMode.set(false);
    this.draftWidgets.set([]);
    this.lms.showToast('Reverted studio changes', 'info');
  }

  saveAndPublishLayout() {
    const updatedLayout: CertificateDashboardLayout = {
      isPublished: true,
      publishedAt: new Date().toISOString(),
      publishedBy: this.lms.activeUser().name,
      version: this.publishedLayout().version + 1,
      widgets: JSON.parse(JSON.stringify(this.draftWidgets()))
    };

    this.lms.certificateDashboardLayout.set(updatedLayout);
    this.isStudioMode.set(false);
    this.lms.showToast('Certificate Dashboard layout published live!', 'success');
  }

  resetToDefault() {
    this.confirmModal.confirm({
      title: 'Reset Dashboard Studio to Factory Default?',
      message: 'This will reset all widgets and column spans to standard OneLMS factory defaults.',
      iconType: 'warning',
      confirmText: 'Reset Layout'
    }).then(confirmed => {
      if (confirmed) {
        const defaults = this.lms.resetCertificateDashboard();
        if (this.isStudioMode()) {
          this.draftWidgets.set(JSON.parse(JSON.stringify(defaults.widgets)));
        }
        this.lms.showToast('Reset dashboard to system defaults', 'info');
      }
    });
  }

  autoArrangeLayout() {
    this.draftWidgets.update(widgets => {
      return widgets.map(w => {
        let span = w.colSpan;
        if (w.type === 'kpi_summary') {
          span = 4;
        } else if (span > 2) {
          span = 2;
        }
        return { ...w, colSpan: span, rowSpan: w.rowSpan || 2 };
      });
    });
    this.lms.showToast('Auto-arranged widget layout', 'success');
  }

  // Widget manipulation in Studio
  updateWidgetColSpan(widgetId: string, span: 1 | 2 | 3 | 4) {
    this.draftWidgets.update(widgets =>
      widgets.map(w => w.id === widgetId ? { ...w, colSpan: span } : w)
    );
  }

  updateWidgetRowSpan(widgetId: string, rowSpan: 1 | 2 | 3 | 4) {
    this.draftWidgets.update(widgets =>
      widgets.map(w => w.id === widgetId ? { ...w, rowSpan } : w)
    );
  }

  removeWidget(widgetId: string) {
    this.draftWidgets.update(widgets => widgets.filter(w => w.id !== widgetId));
    this.lms.showToast('Widget removed from layout', 'info');
  }

  moveWidget(widgetIndex: number, direction: 'up' | 'down') {
    const list = [...this.draftWidgets()];
    const targetIndex = direction === 'up' ? widgetIndex - 1 : widgetIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[widgetIndex];
    list[widgetIndex] = list[targetIndex];
    list[targetIndex] = temp;
    this.draftWidgets.set(list);
  }

  addWidgetToDraft(item: typeof this.widgetCatalog[0]) {
    const newWidget: CertificateDashboardWidget = {
      id: `w-${item.type}-${Date.now().toString().slice(-4)}`,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      colSpan: item.defaultCol,
      rowSpan: 2
    };

    this.draftWidgets.update(widgets => [...widgets, newWidget]);
    this.showAddWidgetModal.set(false);
    this.lms.showToast(`Added "${item.title}" widget`, 'success');
  }

  // Quick Action Navigators
  resumeDraft(draft: CertificateTemplate) {
    this.router.navigate(['/certificates/templates/edit', draft.id]);
  }

  openCreateWizard() {
    this.router.navigate(['/certificates/templates/create']);
  }
}
