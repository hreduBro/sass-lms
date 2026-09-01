import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LmsDataService } from '../../services/lms-data.service';

@Component({
  selector: 'app-analytics',
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent {
  lms = inject(LmsDataService);
  reminderStatus = signal<string | null>(null);

  // Overdue and at-risk personnel
  atRiskUsers = computed(() => {
    return this.lms.tenantUsers().filter(u => u.complianceStatus === 'Overdue' || u.complianceStatus === 'At Risk');
  });

  // Overall tenant compliance rate
  overallCompliance = computed(() => {
    const users = this.lms.tenantUsers();
    if (users.length === 0) return 100;
    const compliant = users.filter(u => u.complianceStatus === 'Compliant').length;
    return Math.round((compliant / users.length) * 100);
  });

  dispatchReminders() {
    const count = this.lms.sendComplianceReminders();
    this.reminderStatus.set(`Dispatched automated escalation notices to ${count} personnel.`);
    setTimeout(() => this.reminderStatus.set(null), 4000);
  }

  exportAuditReport() {
    const data = {
      tenant: this.lms.activeTenant().name,
      exportDate: new Date().toISOString(),
      complianceRate: this.overallCompliance(),
      departmentMetrics: this.lms.departmentMetrics(),
      personnelRoster: this.lms.tenantUsers().map(u => ({
        name: u.name,
        email: u.email,
        department: u.department,
        status: u.complianceStatus,
        completedCourses: u.completedCourses.length
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-audit-${this.lms.activeTenant().slug}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
