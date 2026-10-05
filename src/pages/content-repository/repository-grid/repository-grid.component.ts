import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import { Kpi } from '../../../models/dashboard.model';
import { KpiCardComponent } from '../../../components/kpi-card/kpi-card.component';
import {
  RepositoryItem,
  ContentFamily,
  ContentType,
  SharingMode,
  ContentStatus,
  formatDateToDDMMYYYY,
  parseDateString
} from '../../../models/content-repository.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DatePickerComponent } from '../../../components/date-picker/date-picker.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';

@Component({
  selector: 'app-repository-grid',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DatePickerComponent,
    FilterSectionComponent
  ],
  templateUrl: './repository-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RepositoryGridComponent {
  lmsData = inject(LmsDataService);
  private modalService = inject(ConfirmationModalService);
  router = inject(Router);
  private fb = inject(FormBuilder);

  // View mode: 'table' | 'grid'
  viewMode = signal<'table' | 'grid'>('table');

  // Search
  searchQuery = signal<string>('');

  // Filter Drawer Open/Close State (Like LMS Grid)
  isFilterOpen = signal<boolean>(false);

  // Applied Filters State (active on table/grid)
  appliedFamily = signal<string>('All');
  appliedType = signal<string>('All');
  appliedStatus = signal<string>('All');
  appliedSource = signal<string>('All');
  appliedSortBy = signal<string>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Draft Filters State (inside Filter Drawer before Apply is clicked)
  draftFamily = signal<string>('All');
  draftType = signal<string>('All');
  draftStatus = signal<string>('All');
  draftSource = signal<string>('All');
  draftSortBy = signal<string>('createdAt');

  // Aliases for template bindings
  selectedFamily = this.appliedFamily;
  selectedType = this.appliedType;
  selectedStatus = this.appliedStatus;
  selectedSource = this.appliedSource;
  sortBy = this.appliedSortBy;

  toggleFilterPanel() {
    this.toggleFilter();
  }

  resetFilters() {
    this.resetGrid();
  }

  // Active filter count (Family, Content Type, Status, Source, Sort By, Query)
  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.appliedFamily() !== 'All') count++;
    if (this.appliedType() !== 'All') count++;
    if (this.appliedStatus() !== 'All') count++;
    if (this.appliedSource() !== 'All') count++;
    if (this.appliedSortBy() !== 'createdAt') count++;
    return count;
  });

  hasActiveFilters = computed<boolean>(() => {
    return this.activeFilterCount() > 0 || this.searchQuery().trim().length > 0;
  });

  // Active LMS Context
  activeLms = computed(() => this.lmsData.activeLms());
  activeLmsId = computed(() => this.lmsData.activeLms()?.id || this.lmsData.activeLmsId());
  activeOrg = computed(() => this.lmsData.activeTenant());

  // Available sister LMS instances for Custom Share dialog
  sisterLmsList = computed(() => {
    const currentId = this.activeLmsId();
    return this.lmsData.activeOrgLmsInstances().filter(l => l.id !== currentId);
  });

  // KPI Metrics Computed
  kpiMetrics = computed(() => {
    const items = this.lmsData.activeLmsRepositoryItems();
    const currentLmsId = this.activeLmsId();

    const total = items.length;
    const active = items.filter(i => i.status === 'Active').length;
    const scheduled = items.filter(i => i.status === 'Scheduled').length;
    const sharedOut = items.filter(i => i.owningLmsId === currentLmsId && (i.sharingMode === 'Organization-wide' || i.sharingMode === 'Custom Share')).length;
    const sharedIn = items.filter(i => i.owningLmsId !== currentLmsId).length;

    return { total, active, scheduled, sharedOut, sharedIn };
  });

  // KPI Cards array structured identically to LMS Dashboard / app-kpi-card
  kpiCards = computed<Kpi[]>(() => {
    const m = this.kpiMetrics();
    return [
      {
        title: 'Visible Repository Items',
        value: String(m.total),
        change: '+12%',
        icon: 'folder_open',
        color: 'rose',
        subtext: 'Central repository assets'
      },
      {
        title: 'Active (Learner Live)',
        value: String(m.active),
        change: '+8%',
        icon: 'check',
        color: 'emerald',
        subtext: 'Enrolled & accessible to learners'
      },
      {
        title: 'Scheduled (Pending)',
        value: String(m.scheduled),
        change: '',
        icon: 'pending',
        color: 'sky',
        subtext: 'Releasing on publish date'
      },
      {
        title: 'Shared to Sister LMS',
        value: String(m.sharedOut),
        change: '',
        icon: 'hub',
        color: 'violet',
        subtext: 'Available across organization'
      },
      {
        title: 'Shared-in (Received)',
        value: String(m.sharedIn),
        change: '',
        icon: 'layers',
        color: 'amber',
        subtext: 'Syndicated from sister LMS'
      }
    ];
  });

  // Select Options (Family, Content Type, Status, Source, Sort By)
  familyOptions: SelectOption[] = [
    { value: 'All', label: 'All Families' },
    { value: 'Learning', label: 'Learning Content' },
    { value: 'Assessment', label: 'Assessment Content' }
  ];

  typeOptions: SelectOption[] = [
    { value: 'All', label: 'All Content Types' },
    { value: 'Video', label: 'Video' },
    { value: 'Audio', label: 'Audio' },
    { value: 'PDF / Document', label: 'PDF / Document' },
    { value: 'Slides / Presentation', label: 'Slides / Presentation' },
    { value: 'Reading', label: 'Reading' },
    { value: 'Recorded Class', label: 'Recorded Class' },
    { value: 'Book / E-book', label: 'Book / E-book' },
    { value: 'External Link', label: 'External Link' },
    { value: 'Question Bank / Question Set', label: 'Question Bank / Question Set' }
  ];

  statusOptions: SelectOption[] = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Expired', label: 'Expired' }
  ];

  sourceOptions: SelectOption[] = [
    { value: 'All', label: 'All Sources' },
    { value: 'This LMS', label: 'This LMS (Created Here)' },
    { value: 'Shared-in', label: 'Shared-in from Sister LMS' }
  ];

  sortOptions: SelectOption[] = [
    { value: 'createdAt', label: 'Created On (Latest)' },
    { value: 'createdAt_asc', label: 'Created On (Oldest)' },
    { value: 'publishDate', label: 'Publish Date' },
    { value: 'expiryDate', label: 'Expiry Date' },
    { value: 'title', label: 'Repository Name (A-Z)' }
  ];

  // Filtered and Sorted Repository Items
  filteredItems = computed(() => {
    const all = this.lmsData.activeLmsRepositoryItems();
    const query = this.searchQuery().trim().toLowerCase();
    const fam = this.appliedFamily();
    const typ = this.appliedType();
    const st = this.appliedStatus();
    const src = this.appliedSource();
    const currentLmsId = this.activeLmsId();

    return all.filter(item => {
      // Search by title (English or Bangla) or author
      if (query) {
        const titleMatch = item.title.toLowerCase().includes(query);
        const banglaMatch = item.titleBangla ? item.titleBangla.toLowerCase().includes(query) : false;
        const authorMatch = item.authorNames.some(a => a.toLowerCase().includes(query));
        if (!titleMatch && !banglaMatch && !authorMatch) {
          return false;
        }
      }

      // Filter by Family
      if (fam !== 'All' && item.family !== fam) {
        return false;
      }

      // Filter by Type
      if (typ !== 'All' && item.type !== typ) {
        return false;
      }

      // Filter by Status
      if (st !== 'All' && item.status !== st) {
        return false;
      }

      // Filter by Source
      if (src === 'This LMS') {
        if (item.owningLmsId !== currentLmsId) return false;
      } else if (src === 'Shared-in') {
        if (item.owningLmsId === currentLmsId) return false;
      }

      return true;
    }).sort((a, b) => {
      const field = this.appliedSortBy();
      const dir = this.sortDirection() === 'asc' ? 1 : -1;

      if (field === 'title') {
        return dir * a.title.localeCompare(b.title);
      }

      if (field === 'createdAt_asc') {
        const da = parseDateString(a.createdAt)?.getTime() || 0;
        const db = parseDateString(b.createdAt)?.getTime() || 0;
        return da - db;
      }

      if (field === 'createdAt') {
        const da = parseDateString(a.createdAt)?.getTime() || 0;
        const db = parseDateString(b.createdAt)?.getTime() || 0;
        return dir * (da - db);
      }

      if (field === 'publishDate') {
        const da = parseDateString(a.publishDate)?.getTime() || 0;
        const db = parseDateString(b.publishDate)?.getTime() || 0;
        return dir * (da - db);
      }

      if (field === 'expiryDate') {
        const da = a.hasNoExpiry ? 9999999999999 : (parseDateString(a.expiryDate)?.getTime() || 0);
        const db = b.hasNoExpiry ? 9999999999999 : (parseDateString(b.expiryDate)?.getTime() || 0);
        return dir * (da - db);
      }

      return 0;
    });
  });

  // Modal states
  selectedItemForView = signal<RepositoryItem | null>(null);
  selectedItemForSharing = signal<RepositoryItem | null>(null);
  selectedItemForExpiry = signal<RepositoryItem | null>(null);
  selectedItemForStatusToggle = signal<{ item: RepositoryItem; targetStatus: 'Active' | 'Inactive' } | null>(null);

  // Sharing form
  sharingForm: FormGroup = this.fb.group({
    sharingMode: ['Private', Validators.required],
    selectedLmsIds: [[]]
  });

  // Expiry form
  expiryForm: FormGroup = this.fb.group({
    hasNoExpiry: [false],
    expiryDate: ['31/12/2026']
  });

  // =========================================================================
  // FILTER METHODS (LMS GRID PATTERN)
  // =========================================================================

  toggleFilter() {
    if (!this.isFilterOpen()) {
      // Sync applied filters to draft when opening
      this.draftFamily.set(this.appliedFamily());
      this.draftType.set(this.appliedType());
      this.draftStatus.set(this.appliedStatus());
      this.draftSource.set(this.appliedSource());
      this.draftSortBy.set(this.appliedSortBy());
      this.isFilterOpen.set(true);
    } else {
      this.isFilterOpen.set(false);
    }
  }

  applyFilterDraft() {
    this.appliedFamily.set(this.draftFamily());
    this.appliedType.set(this.draftType());
    this.appliedStatus.set(this.draftStatus());
    this.appliedSource.set(this.draftSource());
    this.appliedSortBy.set(this.draftSortBy());
    this.isFilterOpen.set(false);
  }

  clearFilterDraft() {
    this.draftFamily.set('All');
    this.draftType.set('All');
    this.draftStatus.set('All');
    this.draftSource.set('All');
    this.draftSortBy.set('createdAt');
  }

  resetGrid() {
    this.searchQuery.set('');
    this.appliedFamily.set('All');
    this.appliedType.set('All');
    this.appliedStatus.set('All');
    this.appliedSource.set('All');
    this.appliedSortBy.set('createdAt');
    this.sortDirection.set('desc');
    this.clearFilterDraft();
  }

  // Active Filter Chip Removers
  clearSearch() {
    this.searchQuery.set('');
  }

  removeFamilyFilter() {
    this.appliedFamily.set('All');
    this.draftFamily.set('All');
  }

  removeTypeFilter() {
    this.appliedType.set('All');
    this.draftType.set('All');
  }

  removeStatusFilter() {
    this.appliedStatus.set('All');
    this.draftStatus.set('All');
  }

  removeSourceFilter() {
    this.appliedSource.set('All');
    this.draftSource.set('All');
  }

  removeSortFilter() {
    this.appliedSortBy.set('createdAt');
    this.draftSortBy.set('createdAt');
    this.sortDirection.set('desc');
  }

  // Header column sorters
  toggleSort(field: 'title' | 'createdAt' | 'publishDate' | 'expiryDate') {
    if (this.appliedSortBy() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.appliedSortBy.set(field);
      this.draftSortBy.set(field);
      this.sortDirection.set('desc');
    }
  }

  // Check if current LMS owns item
  isOwner(item: RepositoryItem): boolean {
    return item.owningLmsId === this.activeLmsId();
  }

  // Badge stylings
  getTypeIcon(type: ContentType): string {
    switch (type) {
      case 'Video': return 'smart_display';
      case 'Audio': return 'volume_up';
      case 'PDF / Document': return 'description';
      case 'Slides / Presentation': return 'slideshow';
      case 'Reading': return 'article';
      case 'Recorded Class': return 'videocam';
      case 'Book / E-book': return 'menu_book';
      case 'External Link': return 'open_in_new';
      case 'Question Bank / Question Set': return 'quiz';
      default: return 'folder';
    }
  }

  getTypeColorClass(type: ContentType): string {
    switch (type) {
      case 'Video': return 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900';
      case 'Audio': return 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900';
      case 'PDF / Document': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900';
      case 'Slides / Presentation': return 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
      case 'Reading': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900';
      case 'Recorded Class': return 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900';
      case 'Book / E-book': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900';
      case 'External Link': return 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900';
      case 'Question Bank / Question Set': return 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  }

  getStatusBadgeClass(status: ContentStatus): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Draft':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'Inactive':
      case 'Expired':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
  }

  // =========================================================================
  // ITEM ACTIONS (VIEW, EDIT, CLONE, SHARING, EXPIRY, STATUS, DELETE)
  // =========================================================================
  openViewModal(item: RepositoryItem) {
    this.selectedItemForView.set(item);
  }

  closeViewModal() {
    this.selectedItemForView.set(null);
  }

  continueEditing(item: RepositoryItem) {
    this.router.navigate(['/content-repository/edit', item.id]);
  }

  openSharingModal(item: RepositoryItem) {
    this.selectedItemForSharing.set(item);
    this.sharingForm.patchValue({
      sharingMode: item.sharingMode,
      selectedLmsIds: item.sharedWithLmsIds || []
    });
  }

  closeSharingModal() {
    this.selectedItemForSharing.set(null);
  }

  saveSharing() {
    const item = this.selectedItemForSharing();
    if (!item) return;
    const mode = this.sharingForm.get('sharingMode')?.value as SharingMode;
    const selectedIds = this.sharingForm.get('selectedLmsIds')?.value as string[];
    this.lmsData.updateRepositoryItemSharing(item.id, mode, selectedIds);
    this.closeSharingModal();
  }

  toggleSisterLmsSelection(lmsId: string) {
    const current: string[] = this.sharingForm.get('selectedLmsIds')?.value || [];
    if (current.includes(lmsId)) {
      this.sharingForm.patchValue({ selectedLmsIds: current.filter(id => id !== lmsId) });
    } else {
      this.sharingForm.patchValue({ selectedLmsIds: [...current, lmsId] });
    }
  }

  isSisterLmsSelected(lmsId: string): boolean {
    const current: string[] = this.sharingForm.get('selectedLmsIds')?.value || [];
    return current.includes(lmsId);
  }

  openExpiryModal(item: RepositoryItem) {
    this.selectedItemForExpiry.set(item);
    this.expiryForm.patchValue({
      hasNoExpiry: item.hasNoExpiry,
      expiryDate: item.expiryDate || '31/12/2026'
    });
  }

  closeExpiryModal() {
    this.selectedItemForExpiry.set(null);
  }

  saveExpiry() {
    const item = this.selectedItemForExpiry();
    if (!item) return;
    const hasNoExpiry = !!this.expiryForm.get('hasNoExpiry')?.value;
    const expiryDate = hasNoExpiry ? null : this.expiryForm.get('expiryDate')?.value;
    
    if (!hasNoExpiry && expiryDate) {
      const exp = parseDateString(expiryDate);
      const pub = parseDateString(item.publishDate);
      if (exp && pub && exp.getTime() < pub.getTime()) {
        this.lmsData.showToast('Expiry date cannot precede Publish Date (' + item.publishDate + ')', 'error');
        return;
      }
    }

    this.lmsData.updateRepositoryItemExpiry(item.id, expiryDate, hasNoExpiry);
    this.closeExpiryModal();
  }

  openStatusToggleModal(item: RepositoryItem, targetStatus: 'Active' | 'Inactive') {
    this.selectedItemForStatusToggle.set({ item, targetStatus });
  }

  closeStatusToggleModal() {
    this.selectedItemForStatusToggle.set(null);
  }

  confirmStatusToggle() {
    const target = this.selectedItemForStatusToggle();
    if (!target) return;
    this.lmsData.toggleRepositoryItemStatus(target.item.id, target.targetStatus);
    this.closeStatusToggleModal();
  }

  cloneItem(item: RepositoryItem) {
    const cloned = this.lmsData.cloneRepositoryItem(item.id, ' (Revised)');
    this.router.navigate(['/content-repository/edit', cloned.id]);
  }

  async deleteItem(item: RepositoryItem) {
    const confirmed = await this.modalService.confirmDiscard({
      title: `Delete "${item.title}"?`,
      message: `Are you sure you want to permanently delete this repository asset? Any existing plans or courses referencing this item will lose access.`
    });
    if (confirmed === 'discard') {
      this.lmsData.deleteRepositoryItem(item.id);
    }
  }
}
