import { Component, signal, computed, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Signatory, SignatoryChangeLog } from '../../../models/signatory.model';

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  category: string;
  visible: boolean;
  width: '25%' | '50%' | '75%' | '100%';
  order: number;
}

@Component({
  selector: 'app-signatory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './signatory-dashboard.component.html'
})
export class SignatoryDashboardComponent {
  lmsData = inject(LmsDataService);
  protected Math = Math;

  // Studio Mode Toggle
  isStudioMode = signal<boolean>(false);

  // Default Dashboard Widgets Layout Config
  widgets = signal<DashboardWidgetConfig[]>([
    { id: 'kpi_summary', title: 'Repository KPI Summary', category: 'Metrics', visible: true, width: '100%', order: 1 },
    { id: 'status_breakdown', title: 'Signatory Status Breakdown', category: 'Analytics', visible: true, width: '50%', order: 2 },
    { id: 'most_linked', title: 'Most-Linked Signatories (Top Reuse)', category: 'Usage', visible: true, width: '50%', order: 3 },
    { id: 'department_distribution', title: 'Signatories by Department / Unit', category: 'Analytics', visible: true, width: '50%', order: 4 },
    { id: 'propagation_logs', title: 'Centralized Propagation Logs', category: 'Governance', visible: true, width: '50%', order: 5 },
    { id: 'recent_activity', title: 'Recent Signatory Activity Feed', category: 'Activity', visible: true, width: '50%', order: 6 },
    { id: 'unlinked_attention', title: 'Unlinked Signatories (Cleanup List)', category: 'Action List', visible: true, width: '50%', order: 7 }
  ]);

  // Draft layout for Studio Mode
  draftWidgets = signal<DashboardWidgetConfig[]>([]);

  // Computed metrics
  totalCount = computed(() => this.lmsData.signatories().length);
  activeCount = computed(() => this.lmsData.signatories().filter(s => s.status === 'active').length);
  inactiveCount = computed(() => this.lmsData.signatories().filter(s => s.status === 'inactive').length);
  unlinkedCount = computed(() => this.lmsData.signatories().filter(s => s.linkedTemplateCount === 0).length);

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

  // Studio Mode Controls
  enterStudioMode() {
    this.draftWidgets.set(JSON.parse(JSON.stringify(this.widgets())));
    this.isStudioMode.set(true);
  }

  toggleWidgetVisibility(widgetId: string) {
    this.draftWidgets.update(list => list.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ));
  }

  setWidgetWidth(widgetId: string, width: '25%' | '50%' | '75%' | '100%') {
    this.draftWidgets.update(list => list.map(w => 
      w.id === widgetId ? { ...w, width } : w
    ));
  }

  publishLive() {
    this.widgets.set(JSON.parse(JSON.stringify(this.draftWidgets())));
    this.isStudioMode.set(false);
    this.lmsData.showToast('Dashboard Studio layout published successfully!', 'success', 3500, 'Studio Published');
  }

  discardStudioChanges() {
    this.isStudioMode.set(false);
  }

  resetDefaultLayout() {
    this.widgets.update(list => list.map(w => ({ ...w, visible: true, width: w.id === 'kpi_summary' ? '100%' : '50%' })));
    this.draftWidgets.set(JSON.parse(JSON.stringify(this.widgets())));
    this.lmsData.showToast('Dashboard reset to default layout.', 'info', 3000, 'Layout Reset');
  }

  isWidgetVisible(widgetId: string): boolean {
    const w = this.widgets().find(x => x.id === widgetId);
    return w ? w.visible : true;
  }

  getWidgetWidthClass(widgetId: string): string {
    const list = this.isStudioMode() ? this.draftWidgets() : this.widgets();
    const w = list.find(x => x.id === widgetId);
    const width = w ? w.width : '50%';

    switch (width) {
      case '25%': return 'lg:col-span-3';
      case '50%': return 'lg:col-span-6';
      case '75%': return 'lg:col-span-9';
      case '100%': return 'lg:col-span-12';
      default: return 'lg:col-span-6';
    }
  }
}
