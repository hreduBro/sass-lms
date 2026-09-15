import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  InstructorProfile,
  InstructorAssignmentRecord,
  InstructorDeactivationResolution
} from '../../../models/instructor.model';
import { ComposeEmailModalComponent, EmailRecipientInfo } from '../../../components/compose-email-modal/compose-email-modal.component';
import { BulkAssignModalComponent, BulkAssignItem } from '../../../components/bulk-assign-modal/bulk-assign-modal.component';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { GridViewMode, GridEmptyStateType, GridActiveChip } from '../../../components/data-grid/data-grid.types';

export interface InstructorGridFilters {
  status: string[];
  roles: string[];
  specializations: string[];
  departments: string[];
}

@Component({
  selector: 'app-instructor-grid',
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
  templateUrl: './instructor-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorGridComponent {
  lms = inject(LmsDataService);
  router = inject(Router);

  searchQuery = signal<string>('');
  viewMode = signal<GridViewMode>('table');
  isFilterPanelOpen = signal<boolean>(false);

  // Status Filter Options
  statusOptions = ['Active', 'Inactive'];

  // Role Options for Filter Drawer
  roleOptions = [
    { value: 'dual_role', label: 'Dual-Role (Author)', sublabel: 'Also Content Author' },
    { value: 'instructor_only', label: 'Instructor Only', sublabel: 'Solely teaching faculty' }
  ];

  draftFilters = signal<InstructorGridFilters>({
    status: [],
    roles: [],
    specializations: [],
    departments: []
  });

  appliedFilters = signal<InstructorGridFilters>({
    status: [],
    roles: [],
    specializations: [],
    departments: []
  });

  sortBy = signal<'date' | 'name' | 'assignments'>('date');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeOptions = [6, 10, 20, 50];

  // Multi-selection for Bulk Assign
  selectedInstructorIds = signal<Set<string>>(new Set());

  // Email Modal State
  showEmailModal = signal<boolean>(false);
  emailRecipient = signal<EmailRecipientInfo | null>(null);

  // Bulk Assign Modal State
  showBulkAssignModal = signal<boolean>(false);

  // Deactivation Block Modal State (§3.4)
  showBlockedModal = signal<boolean>(false);
  targetInstructorForDeactivation = signal<InstructorProfile | null>(null);
  blockedActiveRecords = signal<InstructorAssignmentRecord[]>([]);
  reassignmentSelections = signal<Record<string, string>>({}); // key: assignmentId -> replacement instructorId

  // Quick Edit Modal State
  showEditModal = signal<boolean>(false);
  editingInstructor = signal<InstructorProfile | null>(null);
  editForm = {
    name: '',
    email: '',
    contactNumber: '',
    title: '',
    department: '',
    specialization: '',
    bio: '',
    status: 'Active' as 'Active' | 'Inactive'
  };

  // Metrics (§1)
  totalInstructorsCount = computed(() => this.lms.instructors().length);
  activeInstructorsCount = computed(() => this.lms.instructors().filter(i => i.status === 'Active').length);
  dualRoleCount = computed(() => this.lms.instructors().filter(i => i.isAuthor).length);
  totalAssignmentsCount = computed(() => this.lms.instructorAssignments().length);

  // Dynamic Specialization Options extracted from instructors
  specializationOptions = computed<SelectOption[]>(() => {
    const specs = new Set<string>();
    for (const inst of this.lms.instructors()) {
      if (inst.specialization && Array.isArray(inst.specialization)) {
        inst.specialization.forEach(s => {
          const trimmed = s.trim();
          if (trimmed) specs.add(trimmed);
        });
      }
    }
    return Array.from(specs).sort().map(s => ({
      value: s,
      label: s,
      icon: 'school'
    }));
  });

  // Dynamic Department Options extracted from instructors
  departmentOptions = computed<SelectOption[]>(() => {
    const deps = new Set<string>();
    for (const inst of this.lms.instructors()) {
      if (inst.department && inst.department.trim()) {
        deps.add(inst.department.trim());
      }
    }
    return Array.from(deps).sort().map(d => ({
      value: d,
      label: d,
      icon: 'domain'
    }));
  });

  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return f.status.length > 0 || f.roles.length > 0 || f.specializations.length > 0 || f.departments.length > 0;
  });

  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    return f.status.length + f.roles.length + f.specializations.length + f.departments.length;
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
      const label = r === 'dual_role' ? 'Dual-Role (Author)' : 'Instructor Only';
      chips.push({ id: `role-${r}`, label: 'Role', value: label, data: { type: 'role', val: r } });
    }
    for (const sp of f.specializations) {
      chips.push({ id: `spec-${sp}`, label: 'Specialization', value: sp, data: { type: 'specialization', val: sp } });
    }
    for (const dept of f.departments) {
      chips.push({ id: `dept-${dept}`, label: 'Department', value: dept, data: { type: 'department', val: dept } });
    }

    return chips;
  });

  // Filtered & Sorted Instructors
  filteredInstructors = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const f = this.appliedFilters();
    const instructors = this.lms.instructors();

    return instructors.filter(inst => {
      const matchQuery = !q ||
        inst.name.toLowerCase().includes(q) ||
        inst.email.toLowerCase().includes(q) ||
        (inst.title && inst.title.toLowerCase().includes(q)) ||
        (inst.department && inst.department.toLowerCase().includes(q)) ||
        inst.specialization.some(s => s.toLowerCase().includes(q)) ||
        (inst.bio && inst.bio.toLowerCase().includes(q));

      const matchStatus = f.status.length === 0 || f.status.includes(inst.status);

      let matchRole = true;
      if (f.roles.length > 0) {
        const isDual = inst.isAuthor;
        const wantsDual = f.roles.includes('dual_role');
        const wantsOnly = f.roles.includes('instructor_only');
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
        matchSpec = inst.specialization.some(s =>
          f.specializations.some(fs => fs.toLowerCase() === s.toLowerCase())
        );
      }

      let matchDept = true;
      if (f.departments.length > 0) {
        matchDept = inst.department ? f.departments.includes(inst.department) : false;
      }

      return matchQuery && matchStatus && matchRole && matchSpec && matchDept;
    }).sort((a, b) => {
      const dir = this.sortDirection() === 'asc' ? 1 : -1;
      if (this.sortBy() === 'name') {
        return dir * a.name.localeCompare(b.name);
      }
      if (this.sortBy() === 'assignments') {
        const countA = this.getAssignmentCount(a);
        const countB = this.getAssignmentCount(b);
        return dir * (countA - countB);
      }
      return dir * (b.createdAt.localeCompare(a.createdAt));
    });
  });

  paginatedInstructors = computed(() => {
    const all = this.filteredInstructors();
    const start = (this.currentPage() - 1) * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  emptyStateType = computed<GridEmptyStateType>(() => {
    if (this.filteredInstructors().length > 0) return 'none';
    if (this.searchQuery().trim()) return 'search_miss';
    if (this.hasActiveFilters()) return 'filter_miss';
    return 'true_empty';
  });

  // Selected Personnel items mapped for Bulk Assign modal
  selectedPersonnelItems = computed<BulkAssignItem[]>(() => {
    const ids = this.selectedInstructorIds();
    return this.lms.instructors()
      .filter(i => ids.has(i.id) && i.status === 'Active')
      .map(i => ({
        id: i.id,
        name: i.name,
        email: i.email,
        avatar: i.avatar,
        role: 'instructor' as const,
        status: i.status
      }));
  });

  // Candidate replacement instructors for deactivation block modal
  replacementInstructors = computed(() => {
    const target = this.targetInstructorForDeactivation();
    if (!target) return this.lms.activeInstructors();
    return this.lms.activeInstructors().filter(i => i.id !== target.id);
  });

  editStatusOptions: SelectOption[] = [
    { value: 'Active', label: 'Active (Available for Assignment)', icon: 'check_circle' },
    { value: 'Inactive', label: 'Inactive (Deactivated)', icon: 'cancel' }
  ];

  resolutionOptions = computed<SelectOption[]>(() => {
    const options: SelectOption[] = [
      { value: 'remove', label: 'Remove Tag from this Layer', icon: 'delete' }
    ];
    for (const rep of this.replacementInstructors()) {
      options.push({
        value: rep.id,
        label: `Reassign to: ${rep.name}`,
        sublabel: `${rep.email} • ${rep.specialization.join(', ')}`,
        avatar: rep.avatar
      });
    }
    return options;
  });

  getAssignmentCount(inst: InstructorProfile): number {
    return this.lms.instructorAssignments().filter(r =>
      r.instructorId === inst.id || r.instructorEmail.toLowerCase() === inst.email.toLowerCase()
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

  onDepartmentDraftChange(val: string | string[] | null): void {
    const list = Array.isArray(val) ? val : (val ? [val] : []);
    this.draftFilters.update(f => ({ ...f, departments: list }));
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
      specializations: [],
      departments: []
    });
  }

  resetGrid(): void {
    this.searchQuery.set('');
    this.draftFilters.set({ status: [], roles: [], specializations: [], departments: [] });
    this.appliedFilters.set({ status: [], roles: [], specializations: [], departments: [] });
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
      if (d.type === 'department') {
        return { ...f, departments: f.departments.filter(dept => dept !== d.val) };
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

  setSort(by: 'date' | 'name' | 'assignments'): void {
    if (this.sortBy() === by) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(by);
      this.sortDirection.set('desc');
    }
  }

  // Selection Logic
  clearSelection(): void {
    this.selectedInstructorIds.set(new Set());
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const activeIds = new Set(this.filteredInstructors().filter(i => i.status === 'Active').map(i => i.id));
      this.selectedInstructorIds.set(activeIds);
    } else {
      this.selectedInstructorIds.set(new Set());
    }
  }

  toggleSelectInstructor(id: string): void {
    const current = new Set(this.selectedInstructorIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedInstructorIds.set(current);
  }

  isInstructorSelected(id: string): boolean {
    return this.selectedInstructorIds().has(id);
  }

  isAllSelected(): boolean {
    const active = this.filteredInstructors().filter(i => i.status === 'Active');
    return active.length > 0 && active.every(i => this.selectedInstructorIds().has(i.id));
  }

  // Bulk Actions
  openBulkAssignModal(): void {
    if (this.selectedPersonnelItems().length === 0) {
      this.lms.showToast('Please select at least one active instructor to assign.', 'error', 3000, 'Selection Required');
      return;
    }
    this.showBulkAssignModal.set(true);
  }

  onBulkAssignCompleted(): void {
    this.selectedInstructorIds.set(new Set());
    this.showBulkAssignModal.set(false);
  }

  // Email Action (§5)
  openEmailModal(inst: InstructorProfile): void {
    this.emailRecipient.set({
      id: inst.id,
      name: inst.name,
      email: inst.email,
      avatar: inst.avatar,
      role: 'Instructor'
    });
    this.showEmailModal.set(true);
  }

  // Quick Edit
  openEditModal(inst: InstructorProfile): void {
    this.editingInstructor.set(inst);
    this.editForm = {
      name: inst.name,
      email: inst.email,
      contactNumber: inst.contactNumber || '',
      title: inst.title || '',
      department: inst.department || '',
      specialization: inst.specialization.join(', '),
      bio: inst.bio || '',
      status: inst.status
    };
    this.showEditModal.set(true);
  }

  saveEdit(): void {
    const inst = this.editingInstructor();
    if (!inst) return;

    const specs = this.editForm.specialization
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    this.lms.updateInstructor(inst.id, {
      name: this.editForm.name.trim(),
      email: this.editForm.email.trim(),
      contactNumber: this.editForm.contactNumber.trim() || undefined,
      title: this.editForm.title.trim() || undefined,
      department: this.editForm.department.trim() || undefined,
      specialization: specs.length > 0 ? specs : inst.specialization,
      bio: this.editForm.bio.trim() || undefined,
      status: this.editForm.status
    });

    this.showEditModal.set(false);
    this.editingInstructor.set(null);
  }

  // Status Management & Blocked Deactivation Guard (§3.4)
  toggleStatus(inst: InstructorProfile): void {
    if (inst.status === 'Inactive') {
      this.lms.activateInstructor(inst.id);
    } else {
      const blockCheck = this.lms.checkInstructorDeactivationBlocked(inst.id);
      if (blockCheck.isBlocked) {
        this.targetInstructorForDeactivation.set(inst);
        this.blockedActiveRecords.set(blockCheck.activeRecords);
        this.reassignmentSelections.set({});
        this.showBlockedModal.set(true);
      } else {
        this.lms.deactivateInstructor(inst.id);
      }
    }
  }

  resolveAndDeactivate(): void {
    const target = this.targetInstructorForDeactivation();
    if (!target) return;

    const records = this.blockedActiveRecords();
    const selections = this.reassignmentSelections();

    let allResolved = true;
    for (const rec of records) {
      const selected = selections[rec.id];
      if (selected === 'remove') {
        this.lms.resolveInstructorAssignment({
          assignmentId: rec.id,
          courseId: rec.courseId,
          layer: rec.layer,
          action: 'remove'
        });
      } else if (selected && selected !== '') {
        this.lms.resolveInstructorAssignment({
          assignmentId: rec.id,
          courseId: rec.courseId,
          layer: rec.layer,
          action: 'reassign',
          replacementInstructorId: selected
        });
      } else {
        allResolved = false;
      }
    }

    if (!allResolved) {
      this.lms.showToast('Please specify an action (reassign or remove) for every active course assignment before deactivating.', 'error', 4000, 'Action Required');
      return;
    }

    this.lms.deactivateInstructor(target.id, true);
    this.showBlockedModal.set(false);
    this.targetInstructorForDeactivation.set(null);
  }

  setResolutionAction(assignmentId: string, actionOrId: string): void {
    this.reassignmentSelections.update(map => ({
      ...map,
      [assignmentId]: actionOrId
    }));
  }
}
