import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { User, UserRole } from '../../models/lms.model';
import { EarnedBadge } from '../../models/badge-template.model';
import { CustomSelectComponent, SelectOption } from '../../components/custom-select/custom-select.component';
import { CustomAvatarComponent } from '../../components/custom-avatar/custom-avatar.component';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../components/data-grid/filter-section.component';
import { DateRangeFilterComponent } from '../../components/data-grid/date-range-filter.component';
import { GridViewMode, GridEmptyStateType, GridActiveChip } from '../../components/data-grid/data-grid.types';

export interface UserGridFilters {
  status: string[];
  role: string[];
  department: string[];
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomSelectComponent,
    CustomAvatarComponent,
    DataGridComponent,
    FilterSectionComponent
  ],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  lms = inject(LmsDataService);

  // Search & View Mode
  searchQuery = signal<string>('');
  viewMode = signal<GridViewMode>('table');

  // Filter Drawer State
  isFilterPanelOpen = signal<boolean>(false);

  // Status Filter Options (matching UI image 2 preset)
  statusOptions = ['Active', 'Under Processing', 'Drafted', 'Trial'];

  // Role Options for Filter & Invite Form
  roleFilterOptions = [
    { value: 'system_admin', label: 'System Admin' },
    { value: 'lms_admin', label: 'LMS Admin' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'learner', label: 'Learner' }
  ];

  roleOptions = [
    { value: 'learner', label: 'Learner', sublabel: 'Standard student role' },
    { value: 'instructor', label: 'Instructor', sublabel: 'Curriculum & course manager' },
    { value: 'lms_admin', label: 'LMS Admin', sublabel: 'Manage LMS unit and learners' },
    { value: 'system_admin', label: 'System Admin', sublabel: 'Full system authorization' }
  ];

  draftFilters = signal<UserGridFilters>({
    status: [],
    role: [],
    department: [],
  });

  appliedFilters = signal<UserGridFilters>({
    status: [],
    role: [],
    department: [],
  });

  // Tenant Departments for custom select
  departmentOptions = computed(() => {
    return this.lms.activeTenant().departments.map(d => ({
      value: d,
      label: d,
      icon: 'corporate_fare'
    }));
  });

  courseOptions = computed(() => {
    const courses = this.lms.tenantCourses().map(c => ({
      value: c.id,
      label: c.title,
      sublabel: c.isMandatory ? 'Mandatory' : 'Elective'
    }));
    return [{ value: '', label: 'None (Browse later)' }, ...courses];
  });

  // Pagination signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);
  pageSizeOptions = [6, 10, 20, 50];

  showAddModal = signal<boolean>(false);
  selectedUser = signal<User | null>(null);

  // Invite user form
  newUser = {
    name: '',
    email: '',
    role: 'learner' as UserRole,
    department: '',
    assignCourseId: ''
  };

  // Has active filters
  hasActiveFilters = computed<boolean>(() => {
    const f = this.appliedFilters();
    return f.status.length > 0 || f.role.length > 0 || f.department.length > 0;
  });

  // Active filter count badge
  activeFilterCount = computed<number>(() => {
    const f = this.appliedFilters();
    return f.status.length + f.role.length + f.department.length;
  });

  // Is Reset button visible
  isResetVisible = computed<boolean>(() => {
    return !!this.searchQuery().trim() || this.hasActiveFilters();
  });

  // Active filter chips
  activeChips = computed<GridActiveChip[]>(() => {
    const chips: GridActiveChip[] = [];
    const f = this.appliedFilters();

    for (const st of f.status) {
      chips.push({ id: `status-${st}`, label: 'Status', value: st, data: { type: 'status', val: st } });
    }
    for (const r of f.role) {
      const label = this.getRoleLabel(r);
      chips.push({ id: `role-${r}`, label: 'Role', value: label, data: { type: 'role', val: r } });
    }
    for (const dept of f.department) {
      chips.push({ id: `dept-${dept}`, label: 'Department', value: dept, data: { type: 'department', val: dept } });
    }

    return chips;
  });

  // Filtered users
  filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filters = this.appliedFilters();
    const users = this.lms.tenantUsers();

    return users.filter(u => {
      // 1. Search Query
      if (q) {
        const matchSearch =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      // 2. Status Multi-select Filter
      if (filters.status.length > 0) {
        const matchesStatus = filters.status.some(st => {
          if (st === 'Active') {
            return u.status === 'Active' || u.complianceStatus === 'Compliant';
          }
          if (st === 'Under Processing') {
            return u.status === 'Invited' || u.complianceStatus === 'At Risk';
          }
          if (st === 'Drafted') {
            return u.status === 'Suspended';
          }
          if (st === 'Trial') {
            return u.complianceStatus === 'Overdue';
          }
          return false;
        });
        if (!matchesStatus) return false;
      }

      // 3. Role Multi-select Filter
      if (filters.role.length > 0) {
        const matchRole = filters.role.some(r => {
          if (r === 'system_admin') return u.role === 'system_admin' || u.role === 'super_admin';
          if (r === 'lms_admin') return u.role === 'lms_admin' || u.role === 'tenant_admin';
          return u.role === r;
        });
        if (!matchRole) return false;
      }

      // 4. Department Filter
      if (filters.department.length > 0) {
        if (!filters.department.includes(u.department)) return false;
      }

      return true;
    });
  });

  // Empty state type
  emptyStateType = computed<GridEmptyStateType>(() => {
    if (this.filteredUsers().length > 0) return 'none';
    if (this.lms.tenantUsers().length === 0) return 'true_empty';
    if (this.searchQuery().trim().length > 0) return 'search_miss';
    if (this.hasActiveFilters()) return 'filter_miss';
    return 'none';
  });

  // Paginated users
  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  // Search handler
  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  // Filter Drawer Draft Handlers
  toggleStatusDraft(st: string) {
    this.draftFilters.update(f => {
      const exists = f.status.includes(st);
      const next = exists ? f.status.filter(x => x !== st) : [...f.status, st];
      return { ...f, status: next };
    });
  }

  toggleRoleDraft(r: string) {
    this.draftFilters.update(f => {
      const exists = f.role.includes(r);
      const next = exists ? f.role.filter(x => x !== r) : [...f.role, r];
      return { ...f, role: next };
    });
  }

  onDepartmentDraftChange(val: string | string[] | null) {
    let depts: string[] = [];
    if (Array.isArray(val)) {
      depts = val;
    } else if (val) {
      depts = [val];
    }
    this.draftFilters.update(f => ({ ...f, department: depts }));
  }

  applyFilterPanel() {
    this.appliedFilters.set({ ...this.draftFilters() });
    this.isFilterPanelOpen.set(false);
    this.currentPage.set(1);
  }

  closeFilterPanel() {
    this.draftFilters.set({ ...this.appliedFilters() });
    this.isFilterPanelOpen.set(false);
  }

  clearFilterPanelDraft() {
    this.draftFilters.set({
      status: [],
      role: [],
      department: [],
    });
  }

  resetGrid() {
    this.searchQuery.set('');
    this.draftFilters.set({
      status: [],
      role: [],
      department: [],
    });
    this.appliedFilters.set({
      status: [],
      role: [],
      department: [],
    });
    this.currentPage.set(1);
  }

  removeChip(chip: GridActiveChip) {
    if (!chip.data) return;
    const type = chip.data.type;
    const val = chip.data.val;

    this.appliedFilters.update(f => {
      if (type === 'status') {
        return { ...f, status: f.status.filter(s => s !== val) };
      }
      if (type === 'role') {
        return { ...f, role: f.role.filter(r => r !== val) };
      }
      if (type === 'department') {
        return { ...f, department: f.department.filter(d => d !== val) };
      }
      return f;
    });

    this.draftFilters.set({ ...this.appliedFilters() });
    this.currentPage.set(1);
  }

  clearAllChips() {
    this.resetGrid();
  }

  goToPage(p: number) {
    this.currentPage.set(p);
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  openAddModal() {
    this.newUser = {
      name: '',
      email: '',
      role: 'learner',
      department: this.lms.activeTenant().departments[0] || 'General',
      assignCourseId: ''
    };
    this.showAddModal.set(true);
  }

  inviteUser() {
    if (!this.newUser.name.trim() || !this.newUser.email.trim()) return;

    const user = this.lms.addUser({
      name: this.newUser.name,
      email: this.newUser.email,
      role: this.newUser.role,
      department: this.newUser.department,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random()*1000)}?auto=format&fit=crop&w=150&q=80`
    });

    if (this.newUser.assignCourseId) {
      this.lms.enrollInCourse(this.newUser.assignCourseId, user.id);
    }

    this.showAddModal.set(false);
  }

  viewUser(user: User) {
    this.selectedUser.set(user);
  }

  sendSingleReminder(user: User, event: Event) {
    event.stopPropagation();
    this.lms.sendComplianceReminders(user.department);
  }

  getRoleLabel(role: string): string {
    if (role === 'system_admin' || role === 'super_admin') return 'System Admin';
    if (role === 'lms_admin' || role === 'tenant_admin') return 'LMS Admin';
    if (role === 'instructor') return 'Instructor';
    return 'Learner';
  }

  getUserEarnedBadges(userId: string): EarnedBadge[] {
    return this.lms.getTraineeBadgesForUser(userId);
  }

  getStatusBadgeClass(st: string): string {
    switch (st) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60';
      case 'Under Processing':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-200 border-amber-200 dark:border-amber-800/60';
      case 'Drafted':
        return 'bg-slate-100 text-slate-700 dark:bg-base-200 dark:text-slate-300 border-slate-200 dark:border-base-300';
      case 'Trial':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-200 border-rose-200 dark:border-rose-800/60';
      default:
        return 'bg-base-200 text-text-primary border-base-300';
    }
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'system_admin' || role === 'super_admin') {
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-200 dark:border dark:border-purple-800/60';
    }
    if (role === 'lms_admin' || role === 'tenant_admin') {
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border dark:border-indigo-800/60';
    }
    if (role === 'instructor') {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-200 dark:border dark:border-amber-800/60';
    }
    return 'bg-base-200 text-text-secondary';
  }
}
