import { Component, signal, computed, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Signatory, SignatoryChangeLog } from '../../../models/signatory.model';
import { KpiCardComponent } from '../../../components/kpi-card/kpi-card.component';
import { Kpi } from '../../../models/dashboard.model';

@Component({
  selector: 'app-signatory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    KpiCardComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './signatory-dashboard.component.html'
})
export class SignatoryDashboardComponent {
  lmsData = inject(LmsDataService);
  protected Math = Math;

  // Computed metrics
  totalCount = computed(() => this.lmsData.signatories().length);
  activeCount = computed(() => this.lmsData.signatories().filter(s => s.status === 'active').length);
  inactiveCount = computed(() => this.lmsData.signatories().filter(s => s.status === 'inactive').length);
  unlinkedCount = computed(() => this.lmsData.signatories().filter(s => s.linkedTemplateCount === 0).length);

  // Standardized app-kpi-card Computations matching LMS Dashboard
  kpiTotalSignatories = computed<Kpi>(() => ({
    title: 'Total Signatories',
    value: String(this.totalCount()),
    change: `+${this.totalCount()} registered`,
    icon: 'badge',
    color: 'sky',
    subtext: 'In institutional registry'
  }));

  kpiActive = computed<Kpi>(() => ({
    title: 'Active & Authorized',
    value: String(this.activeCount()),
    change: `+${Math.round((this.activeCount() / (this.totalCount() || 1)) * 100)}% active`,
    icon: 'check',
    color: 'emerald',
    subtext: `${Math.round((this.activeCount() / (this.totalCount() || 1)) * 100)}% of total registry`
  }));

  kpiInactive = computed<Kpi>(() => ({
    title: 'Inactive / Suspended',
    value: String(this.inactiveCount()),
    change: `${Math.round((this.inactiveCount() / (this.totalCount() || 1)) * 100)}% frozen`,
    icon: 'pending',
    color: 'rose',
    subtext: 'Frozen from new bindings'
  }));

  kpiUnlinked = computed<Kpi>(() => ({
    title: 'Unlinked Signatories',
    value: String(this.unlinkedCount()),
    change: `${this.unlinkedCount()} pending`,
    icon: 'draft',
    color: 'amber',
    subtext: '0 template linkages'
  }));

  // Top Most Linked Signatories
  mostLinkedSignatories = computed(() => {
    return [...this.lmsData.signatories()]
      .sort((a, b) => b.linkedTemplateCount - a.linkedTemplateCount)
      .slice(0, 5);
  });

  // Department Distribution
  departmentStats = computed(() => {
    const map = new Map<string, number>();
    this.lmsData.signatories().forEach(s => {
      const dep = s.department || 'General Admin';
      map.set(dep, (map.get(dep) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (this.totalCount() || 1)) * 100)
    }));
  });

  // Unlinked Signatories
  unlinkedSignatories = computed(() => {
    return this.lmsData.signatories().filter(s => s.linkedTemplateCount === 0);
  });

  // Change Logs
  changeLogs = computed(() => this.lmsData.signatoryChangeLogs());
}
