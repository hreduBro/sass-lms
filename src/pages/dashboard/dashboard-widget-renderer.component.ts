import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { DashboardWidget, UserRole, CourseEnrollment, User } from '../../models/lms.model';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { CustomAvatarComponent } from '../../components/custom-avatar/custom-avatar.component';
import { Kpi } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-widget-renderer',
  imports: [CommonModule, RouterModule, FormsModule, KpiCardComponent, CustomAvatarComponent],
  templateUrl: './dashboard-widget-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWidgetRendererComponent {
  widget = input<DashboardWidget>({
    id: 'w-default',
    type: 'kpi_grid',
    title: 'KPI Metrics',
    colSpan: 4,
    visibleForRoles: ['super_admin', 'tenant_admin', 'instructor', 'learner']
  });
  isBuilderMode = input<boolean>(false);
  previewRole = input<UserRole | null>(null);

  // Widget builder events
  editWidget = output<DashboardWidget>();
  removeWidget = output<string>();
  duplicateWidget = output<DashboardWidget>();
  moveUp = output<string>();
  moveDown = output<string>();
  changeColSpan = output<{ id: string; colSpan: 1 | 2 | 3 | 4 }>();
  changeRowSpan = output<{ id: string; rowSpan: 1 | 2 | 3 | 4 }>();
  changeDimensions = output<{ id: string; colSpan: 1 | 2 | 3 | 4; rowSpan: 1 | 2 | 3 | 4 }>();

  // Interactive corner resize state
  isResizing = signal<boolean>(false);
  previewColSpan = signal<1 | 2 | 3 | 4>(2);
  previewRowSpan = signal<1 | 2 | 3 | 4>(2);

  lms = inject(LmsDataService);
  
  // Interactive UI State for widgets
  reminderSentMessage = signal<string | null>(null);
  kpiPeriod = signal<'30d' | 'quarter' | 'ytd'>('30d');
  deptSearchQuery = signal<string>('');
  deptSortMode = signal<'compliance' | 'learners'>('compliance');
  trendsPeriod = signal<'6m' | '12m' | 'all'>('6m');
  complianceFilter = signal<'all' | 'compliant' | 'at_risk' | 'overdue'>('all');
  selectedHeatmapDay = signal<number>(2); // Wednesday default
  leaderboardMetric = signal<'xp' | 'badges'>('xp');
  auditFilter = signal<'all' | 'security' | 'compliance' | 'cert'>('all');
  courseFilter = signal<'all' | 'in_progress' | 'completed'>('all');

  // Trigger brief widget toast via unified LMS alert service
  showWidgetToast(msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    this.lms.showToast(msg, type);
  }

  // Interactive Bottom-Right Corner Resize Handler (Gridstack-like)
  startCornerResize(event: MouseEvent, cardEl: HTMLElement) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const initialColSpan = this.widget().colSpan || 2;
    const initialRowSpan = this.widget().rowSpan || 2;
    const rect = cardEl.getBoundingClientRect();
    const colStep = rect.width / initialColSpan; // Estimated width per column span
    const rowStep = 150; // Pixels per vertical rowSpan step

    this.isResizing.set(true);
    this.previewColSpan.set(initialColSpan);
    this.previewRowSpan.set(initialRowSpan);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Calculate horizontal colSpan (1 to 4)
      const colDiff = Math.round(deltaX / Math.max(colStep * 0.7, 100));
      let newColSpan = Math.max(1, Math.min(4, initialColSpan + colDiff)) as 1 | 2 | 3 | 4;

      // Calculate vertical rowSpan (1 to 4)
      const rowDiff = Math.round(deltaY / rowStep);
      let newRowSpan = Math.max(1, Math.min(4, initialRowSpan + rowDiff)) as 1 | 2 | 3 | 4;

      this.previewColSpan.set(newColSpan);
      this.previewRowSpan.set(newRowSpan);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const finalCol = this.previewColSpan();
      const finalRow = this.previewRowSpan();
      this.isResizing.set(false);

      if (finalCol !== this.widget().colSpan || finalRow !== (this.widget().rowSpan || 2)) {
        this.changeDimensions.emit({
          id: this.widget().id,
          colSpan: finalCol,
          rowSpan: finalRow
        });
        this.showWidgetToast(`Resized to ${finalCol * 25}% width × ${finalRow}x height`);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Determine if this widget is visible for current role (or preview role)
  effectiveRole = computed<UserRole>(() => {
    return this.previewRole() || this.lms.activeRole();
  });

  isVisible = computed<boolean>(() => {
    if (this.isBuilderMode()) return true;
    const role = this.effectiveRole();
    return this.widget().visibleForRoles.includes(role);
  });

  // Dynamic KPIs for kpi_grid
  kpiItems = computed<Kpi[]>(() => {
    const tenant = this.lms.activeTenant();
    const role = this.effectiveRole();
    const courses = this.lms.tenantCourses();
    const users = this.lms.tenantUsers();
    const certs = this.lms.tenantCertificates();
    const period = this.kpiPeriod();

    const periodMultiplier = period === '30d' ? 1 : period === 'quarter' ? 1.4 : 2.1;

    if (role === 'system_admin' || (role as any) === 'super_admin') {
      const allTenants = this.lms.tenants();
      const totalLearners = allTenants.reduce((acc, t) => acc + t.stats.totalLearners, 0);
      const totalSeats = allTenants.reduce((acc, t) => acc + t.stats.seatLimit, 0);
      const avgCompliance = Math.round(allTenants.reduce((acc, t) => acc + t.stats.complianceRate, 0) / allTenants.length);

      return [
        { title: 'Total Active Tenants', value: allTenants.length.toString(), change: '+2 this month', icon: 'building', color: 'indigo', subtext: 'Multi-Tenant platform' },
        { title: 'Global Enrolled Learners', value: Math.round(totalLearners * (period === '30d' ? 1 : 1.1)).toLocaleString(), change: '+14.2%', icon: 'users', color: 'sky', subtext: `${Math.round((totalLearners/totalSeats)*100)}% capacity` },
        { title: 'Global Compliance Health', value: `${avgCompliance}%`, change: '+3.1%', icon: 'shield', color: 'emerald', subtext: 'Target: >95%' },
        { title: 'Certificates Awarded', value: Math.round(certs.length * periodMultiplier).toString(), change: '+28%', icon: 'badge', color: 'amber', subtext: 'Verified tamper-proof' }
      ];
    }

    if (role === 'learner') {
      const user = this.lms.activeUser();
      const enrolled = this.lms.enrollments().filter(e => e.userId === user.id);
      const completed = enrolled.filter(e => e.status === 'completed');
      const allSkills = this.lms.learnerSkillProgress();
      const acquiredCount = allSkills.filter(s => s.acquired).length;
      const proficientCount = allSkills.filter(s => s.level === 'Advanced' || s.level === 'Expert' || s.level === 'Proficient').length;
      const developingCount = allSkills.length - proficientCount;

      return [
        { title: 'My Enrolled Courses', value: enrolled.length.toString(), change: 'Active', icon: 'school', color: 'indigo', subtext: 'In your learning path' },
        { title: 'Completed Courses', value: completed.length.toString(), change: '+100%', icon: 'check', color: 'emerald', subtext: 'Great progress!' },
        { title: 'Earned Certificates', value: user.earnedCertificates.length.toString(), change: 'Verified', icon: 'badge', color: 'amber', subtext: 'Available for download' },
        { title: 'My Skills', value: `${acquiredCount} Acquired`, change: `${proficientCount} Proficient`, icon: 'psychology', color: 'violet', subtext: `${proficientCount} Proficient • ${developingCount} In-Progress` }
      ];
    }

    // Tenant Admin / Instructor
    return [
      { title: 'Active Learners', value: users.length.toString(), change: '+8.4%', icon: 'users', color: 'indigo', subtext: `${tenant.stats.seatsUsed} / ${tenant.stats.seatLimit} seats` },
      { title: 'Mandatory Compliance', value: `${tenant.stats.complianceRate}%`, change: '+2.1%', icon: 'shield', color: 'emerald', subtext: 'SOC2 / HIPAA / ISO' },
      { title: 'Course Catalog', value: courses.length.toString(), change: 'Published', icon: 'school', color: 'sky', subtext: 'Curriculum units' },
      { title: 'Certificates Issued', value: Math.round(certs.length * periodMultiplier).toString(), change: '+18.5%', icon: 'badge', color: 'amber', subtext: 'Verified credentials' }
    ];
  });

  // Filtered & Sorted Department Metrics
  filteredDepartments = computed(() => {
    let list = [...this.lms.departmentMetrics()];
    const query = this.deptSearchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(d => d.department.toLowerCase().includes(query));
    }
    if (this.deptSortMode() === 'compliance') {
      list.sort((a, b) => a.complianceRate - b.complianceRate); // Lowest first for attention
    } else {
      list.sort((a, b) => b.learnersCount - a.learnersCount);
    }
    return list;
  });

  // Learner's active enrollments with course details
  myEnrollments = computed(() => {
    const user = this.lms.activeUser();
    const enrollments = this.lms.enrollments().filter(e => e.userId === user.id);
    const courses = this.lms.courses();
    const filter = this.courseFilter();

    let mapped = enrollments.map(enr => {
      const course = courses.find(c => c.id === enr.courseId);
      return {
        enrollment: enr,
        course
      };
    }).filter(item => !!item.course);

    if (filter === 'in_progress') {
      mapped = mapped.filter(item => item.enrollment.status === 'in_progress');
    } else if (filter === 'completed') {
      mapped = mapped.filter(item => item.enrollment.status === 'completed');
    }

    return mapped;
  });

  // Guarantee row of three or four course cards for Continue Active Learning
  displayedCourseCards = computed(() => {
    let list = [...this.myEnrollments()];
    const targetCount = this.widget().colSpan === 4 ? 4 : 3;

    if (list.length < targetCount) {
      const existingCourseIds = new Set(list.map(e => e.course?.id));
      const availableCourses = this.lms.courses().filter(c => !existingCourseIds.has(c.id));
      const mockPercentages = [65, 40, 85, 20];
      let mockIdx = 0;
      for (const course of availableCourses) {
        if (list.length >= targetCount) break;
        list.push({
          enrollment: {
            id: `auto-enr-${course.id}`,
            tenantId: this.lms.activeTenantId(),
            userId: this.lms.activeUser().id,
            courseId: course.id,
            progressPercent: mockPercentages[mockIdx % mockPercentages.length],
            completedLessonIds: [],
            quizScores: {},
            status: 'in_progress',
            startedAt: new Date().toISOString()
          },
          course
        });
        mockIdx++;
      }
    }

    return list.slice(0, targetCount);
  });

  // Displayed webinars for Upcoming Live Classrooms
  displayedWebinars = computed(() => {
    const activeTenantId = this.lms.activeTenantId();
    const list = this.lms.webinars();
    const matched = list.filter(w => w.tenantId === activeTenantId || w.tenantId === 'global');
    const pool = matched.length > 0 ? matched : list;
    return pool.slice(0, 2);
  });

  // Leaderboard ranking
  topLearners = computed(() => {
    const users = [...this.lms.tenantUsers()];
    if (this.leaderboardMetric() === 'xp') {
      return users.sort((a, b) => b.points - a.points).slice(0, 5);
    } else {
      return users.sort((a, b) => (b.badges?.length || 0) - (a.badges?.length || 0)).slice(0, 5);
    }
  });

  // Filtered Overdue users
  filteredOverduePersonnel = computed(() => {
    const list = this.lms.tenantUsers();
    const filter = this.complianceFilter();
    if (filter === 'overdue') {
      return list.filter(u => u.complianceStatus === 'Overdue');
    } else if (filter === 'at_risk') {
      return list.filter(u => u.complianceStatus === 'At Risk');
    } else if (filter === 'compliant') {
      return list.filter(u => u.complianceStatus === 'Compliant');
    }
    return list.filter(u => u.complianceStatus === 'Overdue' || u.complianceStatus === 'At Risk');
  });

  // Filtered Audit logs
  filteredAuditLogs = computed(() => {
    const logs = this.lms.auditLogs();
    const filter = this.auditFilter();
    if (filter === 'security') {
      return logs.filter(l => l.severity === 'warning' || l.action.toLowerCase().includes('quota') || l.action.toLowerCase().includes('security'));
    }
    if (filter === 'compliance') {
      return logs.filter(l => l.action.toLowerCase().includes('compliance') || l.action.toLowerCase().includes('assignment'));
    }
    if (filter === 'cert') {
      return logs.filter(l => l.action.toLowerCase().includes('certificate') || l.severity === 'success');
    }
    return logs;
  });

  // Dispatch Reminders
  dispatchReminders() {
    const count = this.lms.sendComplianceReminders();
    this.reminderSentMessage.set(`Reminders dispatched to ${count} personnel at risk.`);
    setTimeout(() => this.reminderSentMessage.set(null), 3500);
    this.showWidgetToast(`Sent compliance alerts to ${count} users`);
  }

  // Send single escalation
  escalateIndividual(user: User) {
    this.lms.logAction('Compliance Escalation Notice', `Escalated compliance notice for ${user.name} (${user.email}) to Department Manager`, 'warning');
    this.showWidgetToast(`Escalation dispatched to ${user.department} manager for ${user.name}`);
  }

  // Register Webinar
  registerWebinar(title: string) {
    this.lms.logAction('Webinar Registered', `Registered for ${title}`, 'info');
    this.showWidgetToast(`Successfully registered & added "${title}" to calendar!`);
  }

  // =========================================================================
  // MY SKILLS WIDGET STATE & HELPERS (BRD §4.10, §5.6)
  // =========================================================================
  skillsFilter = signal<'all' | 'acquired' | 'in_progress'>('all');

  filteredLearnerSkills = computed(() => {
    let list = this.lms.learnerSkillProgress();
    const filter = this.skillsFilter();

    if (filter === 'acquired') {
      list = list.filter(s => s.acquired);
    } else if (filter === 'in_progress') {
      list = list.filter(s => !s.acquired || s.progressPercent < 100);
    }

    return list;
  });

  getSkillLevelBadgeClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'expert':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'advanced':
      case 'proficient':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'intermediate':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'beginner':
      case 'foundational':
      default:
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800';
    }
  }
}

