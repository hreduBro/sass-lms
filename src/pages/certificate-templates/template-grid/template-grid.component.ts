import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import {
  CertificateTemplate,
  CertificateTemplateStatus,
  CertificateSharingLevel,
  CertificateType,
  PLACEHOLDER_TOKENS,
  CanvasElement
} from '../../../models/certificate-template.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';

@Component({
  selector: 'app-certificate-template-grid',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CustomSelectComponent,
    DataGridComponent,
    FilterSectionComponent
  ],
  templateUrl: './template-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CertificateTemplateGridComponent {
  lms = inject(LmsDataService);
  private router = inject(Router);
  private confirmModal = inject(ConfirmationModalService);

  // View Layout Mode
  viewMode = signal<'grid' | 'table'>('grid');

  // Search & Filter State
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedSharing = signal<string>('all');
  selectedType = signal<string>('all');
  sortBy = signal<'updated_desc' | 'updated_asc' | 'name_asc' | 'usage_desc'>('updated_desc');
  isFilterPanelOpen = signal<boolean>(false);

  toggleFilterPanel() {
    this.isFilterPanelOpen.update(v => !v);
  }

  closeFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  // Custom Select Options for Filter Drawer
  statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses', icon: 'all_inclusive' },
    { value: 'published', label: 'Published & Active', icon: 'verified', badge: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    { value: 'draft', label: 'In Draft', icon: 'edit_note', badge: 'Draft', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    { value: 'archived', label: 'Archived', icon: 'archive', badge: 'Archived', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
  ];

  sharingOptions: SelectOption[] = [
    { value: 'all', label: 'All Scopes', icon: 'public' },
    { value: 'lms', label: 'LMS Workspace Only', icon: 'domain', sublabel: 'Available in this LMS instance' },
    { value: 'organization', label: 'Organization-Wide', icon: 'corporate_fare', sublabel: 'Shared across all tenant workspaces' },
    { value: 'private', label: 'Private Restricted', icon: 'lock', sublabel: 'Restricted access' }
  ];

  typeOptions: SelectOption[] = [
    { value: 'all', label: 'All Certificate Types', icon: 'category' },
    { value: 'Achievement', label: 'Achievement', icon: 'emoji_events' },
    { value: 'Completion', label: 'Completion', icon: 'task_alt' },
    { value: 'Professional', label: 'Professional', icon: 'verified_user' },
    { value: 'Merit', label: 'Merit', icon: 'military_tech' },
    { value: 'Participation', label: 'Participation', icon: 'group' },
    { value: 'Compliance', label: 'Compliance', icon: 'shield' }
  ];

  sortOptions: SelectOption[] = [
    { value: 'updated_desc', label: 'Recently Updated', icon: 'schedule' },
    { value: 'updated_asc', label: 'Oldest Updated', icon: 'history' },
    { value: 'name_asc', label: 'Name (A-Z)', icon: 'sort_by_alpha' },
    { value: 'usage_desc', label: 'Most Used', icon: 'trending_up' }
  ];

  // Preview Modal State
  previewModalTemplate = signal<CertificateTemplate | null>(null);
  previewSampleData = signal<boolean>(true);

  // Role permissions
  permissions = this.lms.certificateTemplatePermissions;

  // Active User / Tenant info
  activeTenant = this.lms.activeTenant;
  activeLms = this.lms.activeLms;

  // Filtered & Sorted Templates
  filteredTemplates = computed<CertificateTemplate[]>(() => {
    let list = this.lms.scopedCertificateTemplates();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();
    const sharing = this.selectedSharing();
    const type = this.selectedType();
    const sort = this.sortBy();

    // 1. Search Query (Name or ID or CreatedBy)
    if (query) {
      list = list.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.createdBy.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // 2. Status Filter
    if (status !== 'all') {
      list = list.filter(t => t.status === status);
    }

    // 3. Sharing Scope Filter
    if (sharing !== 'all') {
      list = list.filter(t => t.sharing.level === sharing);
    }

    // 4. Certificate Type Filter
    if (type !== 'all') {
      list = list.filter(t => t.type === type);
    }

    // 5. Sorting
    return [...list].sort((a, b) => {
      if (sort === 'updated_desc') {
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      } else if (sort === 'updated_asc') {
        return (a.updatedAt || '').localeCompare(b.updatedAt || '');
      } else if (sort === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (sort === 'usage_desc') {
        return (b.usageCount || 0) - (a.usageCount || 0);
      }
      return 0;
    });
  });

  // KPI counts
  kpi = this.lms.certificateKpis;

  // Pagination State
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);

  paginatedTemplates = computed<CertificateTemplate[]>(() => {
    const list = this.filteredTemplates();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredTemplates().length > 0) return 'none';
    if (this.lms.scopedCertificateTemplates().length === 0) return 'true_empty';
    if (this.searchQuery().trim().length > 0) return 'search_miss';
    return 'filter_miss';
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  // Active Filter Count
  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedSharing() !== 'all') count++;
    if (this.selectedType() !== 'all') count++;
    return count;
  });

  // Reset all filters
  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedSharing.set('all');
    this.selectedType.set('all');
    this.sortBy.set('updated_desc');
    this.currentPage.set(1);
  }

  // Action Handlers
  openCreateWizard() {
    this.router.navigate(['/certificates/templates/create']);
  }

  openEditWizard(template: CertificateTemplate) {
    if (template.status === 'published') {
      this.confirmModal.confirm({
        title: 'Edit Published Certificate Template?',
        message: `"${template.name}" is currently active and referenced by ${template.usageCount} curriculum phases. Any changes will immediately update future certificate issuances. Would you like to proceed?`,
        iconType: 'warning',
        confirmText: 'Proceed with Edit'
      }).then(confirmed => {
        if (confirmed) {
          this.router.navigate(['/certificates/templates/edit', template.id]);
        }
      });
    } else {
      this.router.navigate(['/certificates/templates/edit', template.id]);
    }
  }

  duplicateTemplate(template: CertificateTemplate) {
    const copy = this.lms.duplicateCertificateTemplate(template.id);
    this.router.navigate(['/certificates/templates/edit', copy.id]);
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

  deleteDraftTemplate(template: CertificateTemplate) {
    this.confirmModal.confirm({
      title: 'Delete Draft Template?',
      message: `Are you sure you want to permanently delete draft template "${template.name}"? This action cannot be undone.`,
      iconType: 'danger',
      confirmText: 'Delete Draft'
    }).then(ok => {
      if (ok) {
        this.lms.deleteCertificateTemplate(template.id);
      }
    });
  }

  // Preview Modal
  openPreview(template: CertificateTemplate) {
    this.previewModalTemplate.set(template);
    this.previewSampleData.set(true);
  }

  closePreview() {
    this.previewModalTemplate.set(null);
  }

  // Helper to render token or sample
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

  // Status Badge Class Helper
  getStatusBadgeClass(status: CertificateTemplateStatus): string {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40';
      case 'draft':
        return 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40';
      case 'archived':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }

  // Sharing Badge Class Helper
  getSharingBadgeClass(level: CertificateSharingLevel): string {
    switch (level) {
      case 'organization':
        return 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30';
      case 'lms':
        return 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30';
      case 'private':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }
}
