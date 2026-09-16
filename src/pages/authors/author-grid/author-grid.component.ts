import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { AuthorProfile, AuthorshipRecord, DeactivationBlockResolution } from '../../../models/author.model';
import { ComposeEmailModalComponent, EmailRecipientInfo } from '../../../components/compose-email-modal/compose-email-modal.component';
import { BulkAssignModalComponent, BulkAssignItem } from '../../../components/bulk-assign-modal/bulk-assign-modal.component';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { GridViewMode, GridEmptyStateType, GridActiveChip } from '../../../components/data-grid/data-grid.types';

export interface AuthorGridFilters {
  status: string[];
  roles: string[];
  specializations: string[];
}

@Component({
  selector: 'app-author-grid',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ComposeEmailModalComponent,
    BulkAssignModalComponent,
    DataGridComponent,
    FilterSectionComponent,
    CustomSelectComponent
  ],
  templateUrl: './author-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorGridComponent {
  lms = inject(LmsDataService);
  router = inject(Router);

  searchQuery = signal<string>('');
  viewMode = signal<GridViewMode>('table');
  isFilterPanelOpen = signal<boolean>(false);

  // Status Filter Options
  statusOptions = ['Active', 'Inactive'];

  // Role Options for Filter Drawer
  roleOptions = [
    { value: 'dual_role', label: 'Dual-Role (Instructor)', sublabel: 'Also Master Instructor' },
    { value: 'author_only', label: 'Author Only', sublabel: 'Solely content creator' }
  ];

  draftFilters = signal<AuthorGridFilters>({
    status: [],
    roles: [],
    specializations: []
  });

  appliedFilters = signal<AuthorGridFilters>({
    status: [],
    roles: [],
    specializations: []
  });

  sortBy = signal<'date' | 'name' | 'items'>('date');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeOptions = [6, 10, 20, 50];

  // Multi-selection for Bulk Assign
  selectedAuthorIds = signal<Set<string>>(new Set());

  // Email Modal State
  showEmailModal = signal<boolean>(false);
  emailRecipient = signal<EmailRecipientInfo | null>(null);

  // Bulk Assign Modal State
  showBulkAssignModal = signal<boolean>(false);

  // Deactivation Block Modal State
  showBlockedModal = signal<boolean>(false);
  targetAuthorForDeactivation = signal<AuthorProfile | null>(null);
  blockedActiveRecords = signal<AuthorshipRecord[]>([]);
  reassignmentSelections = signal<Record<string, string>>({}); // key: contentItemId+courseId -> replacement authorId

  // Metrics
  totalAuthorsCount = computed(() => this.lms.authors().length);
  activeAuthorsCount = computed(() => this.lms.authors().filter(a => a.status === 'Active').length);
  dualRoleCount = computed(() => this.lms.authors().filter(a => a.isInstructor).length);
  totalContentItemsAuthored = computed(() => this.lms.authorshipRecords().length);

  // Specialization dropdown options extracted dynamically from authors
  specializationOptions = computed<SelectOption[]>(() => {
    const specs = new Set<string>();
    for (const a of this.lms.authors()) {
      if (a.specialization) {
        a.specialization.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed) specs.add(trimmed);
        });
      }
    }
    return Array.from(specs).sort().map(s => ({
      value: s,
      label: s,
      icon: 'psychology'
    }));
  });

  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return f.status.length > 0 || f.roles.length > 0 || f.specializations.length > 0;
  });

  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    return f.status.length + f.roles.length + f.specializations.length;
  });

  isResetVisible = computed<boolean>(() => {
    return !!this.searchQuery().trim() || this.hasActiveFilters();
  });

  activeChips = computed<GridActiveChip[]>(() => {
    const chips: GridActiveChip[] = [];
    const f = this.appliedFilters();

    for (const st of f.status) {
      chips.push({ id: `status-${st}`, label: 'Status', value: st, data: { type: 'status', val: st } });
    }
    for (const r of f.roles) {
      const label = r === 'dual_role' ? 'Dual-Role (Instructor)' : 'Author Only';
      chips.push({ id: `role-${r}`, label: 'Role', value: label, data: { type: 'role', val: r } });
    }
    for (const sp of f.specializations) {
      chips.push({ id: `spec-${sp}`, label: 'Specialization', value: sp, data: { type: 'specialization', val: sp } });
    }

    return chips;
  });

  // Filtered & Sorted Authors
  filteredAuthors = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const f = this.appliedFilters();
    const authors = this.lms.authors();

    return authors.filter(auth => {
      const matchQuery = !q || 
        auth.name.toLowerCase().includes(q) || 
        auth.email.toLowerCase().includes(q) || 
        auth.specialization.toLowerCase().includes(q) ||
        (auth.bio && auth.bio.toLowerCase().includes(q));

      const matchStatus = f.status.length === 0 || f.status.includes(auth.status);

      let matchRole = true;
      if (f.roles.length > 0) {
        const isDual = auth.isInstructor;
        const wantsDual = f.roles.includes('dual_role');
        const wantsOnly = f.roles.includes('author_only');
        if (wantsDual && wantsOnly) {
          matchRole = true;
        } else if (wantsDual) {
          matchRole = isDual;
        } else if (wantsOnly) {
          matchRole = !isDual;
        }
      }

      let matchSpec = true;
      if (f.specializations.length > 0) {
        matchSpec = f.specializations.some(s => auth.specialization.toLowerCase().includes(s.toLowerCase()));
      }

      return matchQuery && matchStatus && matchRole && matchSpec;
    }).sort((a, b) => {
      const dir = this.sortDirection() === 'asc' ? 1 : -1;
      if (this.sortBy() === 'name') {
        return dir * a.name.localeCompare(b.name);
      }
      if (this.sortBy() === 'items') {
        const countA = this.getAuthoredCount(a);
        const countB = this.getAuthoredCount(b);
        return dir * (countA - countB);
      }
      // default 'date'
      return dir * (b.createdAt.localeCompare(a.createdAt));
    });
  });

  paginatedAuthors = computed(() => {
    const all = this.filteredAuthors();
    const start = (this.currentPage() - 1) * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  emptyStateType = computed<GridEmptyStateType>(() => {
    if (this.filteredAuthors().length > 0) return 'none';
    if (this.searchQuery().trim()) return 'search_miss';
    if (this.hasActiveFilters()) return 'filter_miss';
    return 'true_empty';
  });

  // Selected Personnel items mapped for Bulk Assign modal
  selectedPersonnelItems = computed<BulkAssignItem[]>(() => {
    const ids = this.selectedAuthorIds();
    return this.lms.authors()
      .filter(a => ids.has(a.id) && a.status === 'Active')
      .map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        avatar: a.avatar,
        role: 'author' as const,
        status: a.status
      }));
  });

  // Candidate replacement authors for blocked deactivation modal
  replacementAuthors = computed(() => {
    const target = this.targetAuthorForDeactivation();
    if (!target) return this.lms.activeAuthors();
    return this.lms.activeAuthors().filter(a => a.id !== target.id);
  });

  replacementAuthorOptions = computed<SelectOption[]>(() => {
    return this.replacementAuthors().map(cand => ({
      value: cand.id,
      label: cand.name,
      sublabel: cand.specialization,
      avatar: cand.avatar
    }));
  });

  getAuthoredCount(author: AuthorProfile): number {
    return this.lms.authorshipRecords().filter(r => 
      r.authorId === author.id || r.authorEmail.toLowerCase() === author.email.toLowerCase()
    ).length;
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  // Drawer filter actions
  toggleStatusDraft(st: string): void {
    this.draftFilters.update(f => {
      const exists = f.status.includes(st);
      return {
        ...f,
        status: exists ? f.status.filter(s => s !== st) : [...f.status, st]
      };
    });
  }

  toggleRoleDraft(roleVal: string): void {
    this.draftFilters.update(f => {
      const exists = f.roles.includes(roleVal);
      return {
        ...f,
        roles: exists ? f.roles.filter(r => r !== roleVal) : [...f.roles, roleVal]
      };
    });
  }

  onSpecializationDraftChange(val: string | string[] | null): void {
    const list = Array.isArray(val) ? val : (val ? [val] : []);
    this.draftFilters.update(f => ({ ...f, specializations: list }));
  }

  applyFilterPanel(): void {
    this.appliedFilters.set({ ...this.draftFilters() });
    this.isFilterPanelOpen.set(false);
    this.currentPage.set(1);
  }

  closeFilterPanel(): void {
    this.draftFilters.set({ ...this.appliedFilters() });
    this.isFilterPanelOpen.set(false);
  }

  clearFilterPanelDraft(): void {
    this.draftFilters.set({
      status: [],
      roles: [],
      specializations: []
    });
  }

  resetGrid(): void {
    this.searchQuery.set('');
    this.draftFilters.set({ status: [], roles: [], specializations: [] });
    this.appliedFilters.set({ status: [], roles: [], specializations: [] });
    this.currentPage.set(1);
  }

  removeChip(chip: GridActiveChip): void {
    const d = chip.data;
    if (!d) return;
    this.appliedFilters.update(f => {
      if (d.type === 'status') {
        return { ...f, status: f.status.filter(s => s !== d.val) };
      }
      if (d.type === 'role') {
        return { ...f, roles: f.roles.filter(r => r !== d.val) };
      }
      if (d.type === 'specialization') {
        return { ...f, specializations: f.specializations.filter(sp => sp !== d.val) };
      }
      return f;
    });
    this.draftFilters.set({ ...this.appliedFilters() });
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  toggleSort(field: 'date' | 'name' | 'items'): void {
    if (this.sortBy() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDirection.set(field === 'name' ? 'asc' : 'desc');
    }
  }

  viewAuthorDetails(authorId: string): void {
    this.router.navigate(['/authors', authorId]);
  }

  // Selection Logic
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const activeIds = new Set(this.filteredAuthors().filter(a => a.status === 'Active').map(a => a.id));
      this.selectedAuthorIds.set(activeIds);
    } else {
      this.selectedAuthorIds.set(new Set());
    }
  }

  toggleSelectAuthor(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    const current = new Set(this.selectedAuthorIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedAuthorIds.set(current);
  }

  isAuthorSelected(id: string): boolean {
    return this.selectedAuthorIds().has(id);
  }

  isAllSelected(): boolean {
    const active = this.filteredAuthors().filter(a => a.status === 'Active');
    return active.length > 0 && active.every(a => this.selectedAuthorIds().has(a.id));
  }

  // Bulk Assign
  openBulkAssignModal(): void {
    if (this.selectedPersonnelItems().length === 0) {
      this.lms.showToast('Please select at least one active author to assign.', 'error', 3000, 'Selection Required');
      return;
    }
    this.showBulkAssignModal.set(true);
  }

  onBulkAssignCompleted(): void {
    this.selectedAuthorIds.set(new Set());
    this.showBulkAssignModal.set(false);
  }

  // Email modal
  openEmailModal(author: AuthorProfile, event?: Event): void {
    if (event) event.stopPropagation();
    this.emailRecipient.set({
      id: author.id,
      name: author.name,
      email: author.email,
      avatar: author.avatar,
      role: 'Author'
    });
    this.showEmailModal.set(true);
  }

  openEditModal(author: AuthorProfile, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/authors/edit', author.id]);
  }

  handleToggleStatus(author: AuthorProfile, event?: Event): void {
    if (event) event.stopPropagation();

    if (author.status === 'Inactive') {
      this.lms.activateAuthor(author.id);
      return;
    }

    // Attempting to deactivate - check blocked rule
    const check = this.lms.checkAuthorDeactivationBlocked(author.id);
    if (check.isBlocked) {
      this.targetAuthorForDeactivation.set(author);
      this.blockedActiveRecords.set(check.activeRecords);
      // Pre-select first available replacement for convenience
      const initialReplacements: Record<string, string> = {};
      const firstAvailable = this.lms.activeAuthors().find(a => a.id !== author.id);
      if (firstAvailable) {
        check.activeRecords.forEach(r => {
          initialReplacements[r.contentItemId + '_' + r.courseId] = firstAvailable.id;
        });
      }
      this.reassignmentSelections.set(initialReplacements);
      this.showBlockedModal.set(true);
    } else {
      this.lms.deactivateAuthor(author.id);
    }
  }

  closeBlockedModal(): void {
    this.showBlockedModal.set(false);
    this.targetAuthorForDeactivation.set(null);
    this.blockedActiveRecords.set([]);
  }

  setReplacementSelection(key: string, replacementAuthorId: string): void {
    this.reassignmentSelections.update(map => ({ ...map, [key]: replacementAuthorId }));
  }

  resolveItemReassign(record: AuthorshipRecord): void {
    const key = record.contentItemId + '_' + record.courseId;
    const replacementId = this.reassignmentSelections()[key];
    if (!replacementId) {
      this.lms.showToast('Please select a replacement author first.', 'error', 3000, 'Selection Required');
      return;
    }

    const resolution: DeactivationBlockResolution = {
      contentItemId: record.contentItemId,
      courseId: record.courseId,
      action: 'reassign',
      replacementAuthorId: replacementId
    };

    this.lms.resolveAuthorCredit(resolution);

    // Remove from local blocked list
    this.blockedActiveRecords.update(list => list.filter(r => !(r.contentItemId === record.contentItemId && r.courseId === record.courseId)));
  }

  resolveItemRemove(record: AuthorshipRecord): void {
    const resolution: DeactivationBlockResolution = {
      contentItemId: record.contentItemId,
      courseId: record.courseId,
      action: 'remove'
    };

    this.lms.resolveAuthorCredit(resolution);

    // Remove from local blocked list
    this.blockedActiveRecords.update(list => list.filter(r => !(r.contentItemId === record.contentItemId && r.courseId === record.courseId)));
  }

  finalizeDeactivationAfterResolutions(): void {
    const target = this.targetAuthorForDeactivation();
    if (!target) return;

    if (this.blockedActiveRecords().length > 0) {
      this.lms.showToast(`Please reassign or remove all ${this.blockedActiveRecords().length} remaining active course credits before finalizing deactivation.`, 'error', 4000, 'Credits Unresolved');
      return;
    }

    this.lms.deactivateAuthor(target.id, true);
    this.closeBlockedModal();
  }

  getContentTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'video': return 'smart_display';
      case 'document':
      case 'reading': return 'description';
      case 'quiz': return 'quiz';
      case 'interactive':
      case 'lab': return 'extension';
      default: return 'article';
    }
  }
}
