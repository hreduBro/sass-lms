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
  CertificateTemplate,
  CanvasElement,
  PLACEHOLDER_TOKENS
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

  // Preview Modal State
  previewModalTemplate = signal<CertificateTemplate | null>(null);
  previewSampleData = signal<boolean>(true);

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

  // Displayed widgets
  displayedWidgets = computed<CertificateDashboardWidget[]>(() => {
    return this.publishedLayout().widgets;
  });

  // Top ranked templates by Phase reference count
  mostUsedTemplates = computed<CertificateTemplate[]>(() => {
    return [...this.templates()]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);
  });

  // Widget Helpers for Dynamic Layout Classes
  getWidgetSpanClass(widget: CertificateDashboardWidget): string {
    switch (widget.colSpan) {
      case 1:
        return 'col-span-1';
      case 2:
        return 'col-span-1 md:col-span-2';
      case 3:
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      case 4:
        return 'col-span-1 md:col-span-2 lg:col-span-4';
      default:
        return 'col-span-1 md:col-span-2';
    }
  }

  // Quick Action Navigators & Preview
  resumeDraft(draft: CertificateTemplate) {
    this.router.navigate(['/certificates/templates/edit', draft.id]);
  }

  openCreateWizard() {
    this.router.navigate(['/certificates/templates/create']);
  }

  openPreview(template: CertificateTemplate) {
    this.previewModalTemplate.set(template);
    this.previewSampleData.set(true);
  }

  closePreview() {
    this.previewModalTemplate.set(null);
  }

  getSampleValue(element: CanvasElement): string {
    if (element.kind === 'static-text') {
      return element.text || '';
    }
    if (element.kind === 'placeholder' && element.token) {
      if (this.previewSampleData()) {
        const def = PLACEHOLDER_TOKENS.find(t => t.key === element.token);
        return def?.sampleValue || element.token;
      }
      return element.token;
    }
    return '';
  }

  publishTemplate(template: CertificateTemplate) {
    this.confirmModal.confirm({
      title: 'Publish Certificate Template?',
      message: `Publishing "${template.name}" will make it immediately selectable in Phase Outputs and active for student certifications.`,
      iconType: 'success',
      confirmText: 'Publish Template'
    }).then(ok => {
      if (ok) {
        this.lms.publishCertificateTemplate(template.id);
      }
    });
  }

  archiveTemplate(template: CertificateTemplate) {
    this.confirmModal.confirm({
      title: 'Archive Certificate Template?',
      message: `Are you sure you want to archive "${template.name}"? Archived templates remain verifiable for existing graduates but cannot be assigned to new curriculum phases.`,
      iconType: 'warning',
      confirmText: 'Archive Template'
    }).then(ok => {
      if (ok) {
        this.lms.archiveCertificateTemplate(template.id);
      }
    });
  }
}
