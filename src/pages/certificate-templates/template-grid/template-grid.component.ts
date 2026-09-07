import { Component, ChangeDetectionStrategy, inject, signal, computed, HostListener } from '@angular/core';
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
  CertificateMapping,
  CertificateTargetType,
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
  selectedTargetType = signal<string>('all');
  selectedMappingState = signal<string>('all');
  sortBy = signal<'updated_desc' | 'updated_asc' | 'name_asc' | 'usage_desc'>('updated_desc');
  isFilterPanelOpen = signal<boolean>(false);

  toggleFilterPanel() {
    this.isFilterPanelOpen.update(v => !v);
  }

  closeFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  // Polymorphic Certificate Mapping State
  isMappingModalOpen = signal<boolean>(false);
  mappingTemplate = signal<CertificateTemplate | null>(null);
  mappingTargetType = signal<CertificateTargetType>('course');
  mappingTargetId = signal<string>('');
  mappingTargetName = signal<string>('');

  // Floating Action Menu State
  activeMenuTemplate = signal<CertificateTemplate | null>(null);
  menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

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

  targetTypeFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Target Types', icon: 'account_tree' },
    { value: 'course', label: 'Courses / Classes', icon: 'school' },
    { value: 'plan', label: 'Training Plans', icon: 'assignment' },
    { value: 'phase', label: 'Phases', icon: 'step' },
    { value: 'content', label: 'Content Assets', icon: 'article' }
  ];

  mappingStateFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Templates (Mapped & Unmapped)' },
    { value: 'mapped', label: 'Mapped Templates Only (Active in Curriculum)' },
    { value: 'unmapped', label: 'Unmapped Templates Only (Available for Mapping)' }
  ];

  mappingTargetTypeOptions: SelectOption[] = [
    { value: 'course', label: 'Course / Class', icon: 'school', sublabel: 'Course curriculum' },
    { value: 'plan', label: 'Training Plan', icon: 'assignment', sublabel: 'Multi-phase plan' },
    { value: 'phase', label: 'Phase', icon: 'step', sublabel: 'Specific plan phase' },
    { value: 'content', label: 'Content Asset / Assessment', icon: 'article', sublabel: 'SCORM or Quiz asset' }
  ];

  mappingTargetItemOptions = computed<SelectOption[]>(() => {
    const type = this.mappingTargetType();
    if (type === 'course') {
      const templates = (this.lms.courseTemplates ? this.lms.courseTemplates() : []) as any[];
      return templates.map(c => ({
        value: c.id || c.templateId || 'crs-1',
        label: `${c.name || c.title || 'Course'} (${c.code || c.id || 'CRS'})`,
        icon: 'school'
      }));
    } else if (type === 'plan') {
      const plans = (this.lms.plans ? this.lms.plans() : []) as any[];
      return plans.map(p => ({
        value: p.id,
        label: `${p.name || 'Training Plan'} (${p.id})`,
        icon: 'assignment'
      }));
    } else if (type === 'phase') {
      const plans = (this.lms.plans ? this.lms.plans() : []) as any[];
      const phases: SelectOption[] = [];
      plans.forEach(p => {
        (p.phases || []).forEach((ph: any) => {
          phases.push({
            value: ph.id,
            label: `${ph.name || 'Phase'} (${p.name || 'Plan'})`,
            icon: 'step'
          });
        });
      });
      return phases;
    } else if (type === 'content') {
      return [
        { value: 'cnt-01', label: 'Financial Accounting Standards SCORM Module', icon: 'article' },
        { value: 'cnt-02', label: 'Field Ethics Interactive Video Scenario', icon: 'smart_display' },
        { value: 'cnt-03', label: 'POS Terminal Simulation Sandbox', icon: 'devices' },
        { value: 'cnt-04', label: 'Client Protection Field Assessment', icon: 'quiz' },
        { value: 'cnt-05', label: 'Microfinance Field Operational SOPs', icon: 'description' }
      ];
    }
    return [];
  });

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
    const targetType = this.selectedTargetType();
    const mappingState = this.selectedMappingState();
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

    // 5. Target Type Filter
    if (targetType !== 'all') {
      const templateIdsWithTarget = new Set(
        this.lms.certificateMappings()
          .filter(m => m.targetType === targetType)
          .map(m => m.templateId)
      );
      list = list.filter(t => templateIdsWithTarget.has(t.id));
    }

    // 6. Mapping State Filter
    if (mappingState === 'mapped') {
      const mappedIds = new Set(this.lms.certificateMappings().map(m => m.templateId));
      list = list.filter(t => mappedIds.has(t.id) || (t.usageCount && t.usageCount > 0));
    } else if (mappingState === 'unmapped') {
      const mappedIds = new Set(this.lms.certificateMappings().map(m => m.templateId));
      list = list.filter(t => !mappedIds.has(t.id) && (!t.usageCount || t.usageCount === 0));
    }

    // 7. Sorting
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
    if (this.selectedTargetType() !== 'all') count++;
    if (this.selectedMappingState() !== 'all') count++;
    return count;
  });

  // Reset all filters
  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedSharing.set('all');
    this.selectedType.set('all');
    this.selectedTargetType.set('all');
    this.selectedMappingState.set('all');
    this.sortBy.set('updated_desc');
    this.currentPage.set(1);
  }

  // Floating Action Menu Handlers
  toggleTemplateActionMenu(template: CertificateTemplate, event: MouseEvent, buttonEl?: HTMLElement) {
    event.stopPropagation();
    if (this.activeMenuTemplate()?.id === template.id) {
      this.closeActionMenu();
      return;
    }

    const button = buttonEl || (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
    const rect = button.getBoundingClientRect();
    const menuHeight = 240;
    const menuWidth = 208;

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = placeAbove ? Math.max(8, rect.top - menuHeight - 4) : (rect.bottom + 4);
    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    this.menuPosition.set({ top, left });
    this.activeMenuTemplate.set({ ...template });
  }

  closeActionMenu() {
    this.activeMenuTemplate.set(null);
  }

  isTemplateActionMenuOpen(id: string): boolean {
    return this.activeMenuTemplate()?.id === id;
  }

  previewTemplateFromMenu(template?: CertificateTemplate | null) {
    const t = template || this.activeMenuTemplate();
    if (t) {
      this.openPreview(t);
    }
    this.closeActionMenu();
  }

  editTemplateFromMenu(template?: CertificateTemplate | null) {
    const t = template || this.activeMenuTemplate();
    if (t) {
      this.openEditWizard(t);
    }
    this.closeActionMenu();
  }

  duplicateTemplateFromMenu(template?: CertificateTemplate | null) {
    const t = template || this.activeMenuTemplate();
    if (t) {
      this.duplicateTemplate(t);
    }
    this.closeActionMenu();
  }

  publishTemplateFromMenu(template?: CertificateTemplate | null) {
    const t = template || this.activeMenuTemplate();
    if (t) {
      this.publishTemplate(t);
    }
    this.closeActionMenu();
  }

  archiveTemplateFromMenu(template?: CertificateTemplate | null) {
    const t = template || this.activeMenuTemplate();
    if (t) {
      this.archiveTemplate(t);
    }
    this.closeActionMenu();
  }

  deleteTemplateFromMenu(template?: CertificateTemplate | null) {
    const t = template || this.activeMenuTemplate();
    if (t) {
      this.deleteDraftTemplate(t);
    }
    this.closeActionMenu();
  }

  manageMappingsFromMenu(template?: CertificateTemplate | null) {
    const t = template || this.activeMenuTemplate();
    if (t) {
      this.openManageMappingsModal(t);
    }
    this.closeActionMenu();
  }

  // Polymorphic Certificate Mapping Methods
  openManageMappingsModal(template: CertificateTemplate) {
    this.mappingTemplate.set(template);
    this.mappingTargetType.set('course');
    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
    this.isMappingModalOpen.set(true);
    this.closeActionMenu();
  }

  closeMappingModal() {
    this.isMappingModalOpen.set(false);
    this.mappingTemplate.set(null);
  }

  onMappingBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeMappingModal();
    }
  }

  getMappingsForTemplate(templateId: string): CertificateMapping[] {
    return this.lms.certificateMappings().filter(m => m.templateId === templateId);
  }

  onMappingTargetTypeChange(type: any) {
    this.mappingTargetType.set(type || 'course');
    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
  }

  onMappingTargetItemChange(targetId: any) {
    this.mappingTargetId.set(targetId || '');
    if (targetId) {
      const opt = this.mappingTargetItemOptions().find(o => o.value === targetId);
      this.mappingTargetName.set(opt?.label || targetId);
    } else {
      this.mappingTargetName.set('');
    }
  }

  addMapping() {
    const template = this.mappingTemplate();
    const type = this.mappingTargetType();
    const targetId = this.mappingTargetId();
    if (!template || !targetId) return;

    let targetName = this.mappingTargetName();
    if (!targetName) {
      const opt = this.mappingTargetItemOptions().find(o => o.value === targetId);
      targetName = opt?.label || targetId;
    }

    this.lms.mapCertificateToElement(
      template.id,
      type,
      targetId,
      targetName
    );

    this.mappingTargetId.set('');
    this.mappingTargetName.set('');
  }

  unmapCertificate(templateId: string, targetType: CertificateTargetType, targetId: string) {
    this.lms.unmapCertificateFromElement(templateId, targetType, targetId);
  }

  getTargetTypeColor(targetType: CertificateTargetType): string {
    switch (targetType) {
      case 'plan':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'course':
      case 'class':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'phase':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'content':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.template-action-menu-dropdown') && !target.closest('.template-action-menu-btn')) {
      this.closeActionMenu();
    }
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onWindowChange() {
    if (this.activeMenuTemplate()) {
      this.closeActionMenu();
    }
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
    const activeMappings = this.lms.certificateMappings().filter(m => m.templateId === template.id);
    if (activeMappings.length > 0) {
      this.confirmModal.confirm({
        title: 'Cannot Delete Mapped Template',
        message: `Template "${template.name}" is currently mapped to ${activeMappings.length} learning target(s) (${activeMappings.map(m => m.targetName).slice(0, 2).join(', ')}${activeMappings.length > 2 ? '...' : ''}). Please unmap all targets before deleting this template.`,
        iconType: 'danger',
        confirmText: 'Manage Mappings'
      }).then(ok => {
        if (ok) {
          this.openManageMappingsModal(template);
        }
      });
      return;
    }

    this.confirmModal.confirm({
      title: 'Delete Draft Template?',
      message: `Are you sure you want to permanently delete draft template "${template.name}"? This action cannot be undone.`,
      iconType: 'danger',
      confirmText: 'Delete Draft'
    }).then(ok => {
      if (ok) {
        try {
          this.lms.deleteCertificateTemplate(template.id);
        } catch (e: any) {
          this.confirmModal.confirm({
            title: 'Deletion Failed',
            message: e.message || 'Could not delete template.',
            iconType: 'danger',
            confirmText: 'OK'
          });
        }
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
