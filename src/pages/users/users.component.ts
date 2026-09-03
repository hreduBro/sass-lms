import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { User, UserRole } from '../../models/lms.model';
import { CustomSelectComponent } from '../../components/custom-select/custom-select.component';
import { CustomAvatarComponent } from '../../components/custom-avatar/custom-avatar.component';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, CustomSelectComponent, CustomAvatarComponent],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  lms = inject(LmsDataService);

  searchQuery = signal<string>('');
  selectedDepartment = signal<string>('All');
  selectedRole = signal<string>('All');
  selectedCompliance = signal<string>('All');

  roleOptions = [
    { value: 'learner', label: 'Learner', sublabel: 'Standard student role' },
    { value: 'instructor', label: 'Instructor', sublabel: 'Curriculum & course manager' },
    { value: 'lms_admin', label: 'LMS Admin', sublabel: 'Manage LMS unit and learners' },
    { value: 'system_admin', label: 'System Admin', sublabel: 'Full system authorization' }
  ];

  filterRoleOptions = [
    { value: 'All', label: 'All Roles' },
    { value: 'system_admin', label: 'System Admin' },
    { value: 'lms_admin', label: 'LMS Admin' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'learner', label: 'Learner' }
  ];

  filterComplianceOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Compliant', label: 'Compliant' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Overdue', label: 'Overdue' }
  ];

  departmentFilterOptions = computed(() => {
    const depts = this.lms.activeTenant().departments.map(d => ({ value: d, label: d }));
    return [{ value: 'All', label: 'All Departments' }, ...depts];
  });

  departmentOptions = computed(() => {
    return this.lms.activeTenant().departments.map(d => ({ value: d, label: d }));
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
  pageSize = signal<number>(5);
  pageSizeOptions = [
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' }
  ];

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

  // Filtered users
  filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const dept = this.selectedDepartment();
    const role = this.selectedRole();
    const comp = this.selectedCompliance();
    const users = this.lms.tenantUsers();

    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchDept = dept === 'All' || u.department === dept;
      const matchRole = role === 'All' || u.role === role;
      const matchComp = comp === 'All' || u.complianceStatus === comp;
      return matchSearch && matchDept && matchRole && matchComp;
    });
  });

  // Total pages
  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize()));
  });

  // Paginated slice
  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  // Pages array for button rendering
  pagesList = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onFilterChange() {
    this.currentPage.set(1);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
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
