import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { DashboardWidget, UserRole, CustomTenantDashboard } from '../../models/lms.model';
import { DashboardWidgetRendererComponent } from './dashboard-widget-renderer.component';
import { WidgetConfigModalComponent } from './widget-config-modal.component';
import { AddWidgetModalComponent } from './add-widget-modal.component';

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge?: string;
  widgetIds: string[];
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    DashboardWidgetRendererComponent, 
    WidgetConfigModalComponent, 
    AddWidgetModalComponent
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  lms = inject(LmsDataService);

  // Builder Mode State
  isBuilderMode = signal<boolean>(false);
  editingWidget = signal<DashboardWidget | null>(null);
  showAddWidgetModal = signal<boolean>(false);
  previewRole = signal<UserRole | null>(null);

  // Layout density mode: 'comfortable' | 'compact' | 'bento'
  canvasDensity = signal<'comfortable' | 'compact' | 'bento'>('comfortable');

  // Working copy of widgets when inside builder mode
  draftWidgets = signal<DashboardWidget[]>([]);

  // Drag and Drop internal tracking
  draggedIndex = signal<number | null>(null);
  dragOverIndex = signal<number | null>(null);

  // Active tenant dashboard from data service
  activeDashboard = this.lms.activeTenantDashboard;

  // Active role
  activeRole = this.lms.activeRole;
  activeTenant = this.lms.activeTenant;

  isAdmin = computed(() => {
    return this.lms.isSystemAdmin() || this.lms.isLmsAdmin();
  });

  private isWidgetVisibleForRole(widget: DashboardWidget, role: UserRole): boolean {
    if (!widget.visibleForRoles || widget.visibleForRoles.length === 0) return true;
    if (role === 'SYS_ADMIN' || this.lms.isSystemAdmin()) return true;
    return widget.visibleForRoles.includes(role);
  }

  // Effective displayed widgets
  displayedWidgets = computed<DashboardWidget[]>(() => {
    if (this.isBuilderMode()) {
      const pRole = this.previewRole();
      if (pRole) {
        return this.draftWidgets().filter(w => this.isWidgetVisibleForRole(w, pRole));
      }
      return this.draftWidgets();
    }
    const currentRole = this.activeRole();
    return this.activeDashboard().widgets.filter(w => this.isWidgetVisibleForRole(w, currentRole));
  });

  // Visible widgets count for the active/preview role
  visibleCount = computed(() => {
    const role = this.previewRole() || this.activeRole();
    return this.displayedWidgets().filter(w => this.isWidgetVisibleForRole(w, role)).length;
  });

  // Available Presets
  presets = [
    {
      id: 'executive',
      name: 'Executive Cockpit',
      description: 'KPI Matrix, Department Compliance & Enrollment Velocity',
      icon: 'insights',
      badge: 'Popular',
    },
    {
      id: 'learner',
      name: 'Learner Progression',
      description: 'Active Courseware, XP Leaderboard & Learning Heatmap',
      icon: 'school',
      badge: 'Learner',
    },
    {
      id: 'compliance',
      name: 'Compliance & Audit',
      description: 'Risk Gauge, Escalation Queue & Live Tamper-Proof Audit Feed',
      icon: 'verified_user',
      badge: 'Security',
    },
    {
      id: 'all_in_one',
      name: 'Full Enterprise Matrix',
      description: 'Comprehensive 10-widget modular operations canvas',
      icon: 'dashboard',
      badge: 'Complete',
    }
  ];

  // Show Toast via unified LMS service
  showToast(msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    this.lms.showToast(msg, type);
  }

  // Enter Builder Mode
  enterBuilderMode() {
    this.draftWidgets.set(JSON.parse(JSON.stringify(this.activeDashboard().widgets)));
    this.previewRole.set(null);
    this.isBuilderMode.set(true);
    this.lms.showToast('Entered Dashboard Builder studio', 'info');
  }

  // Cancel / Exit Builder Mode without saving
  exitBuilderMode() {
    this.isBuilderMode.set(false);
    this.previewRole.set(null);
    this.draftWidgets.set([]);
    this.lms.showToast('Exited Builder mode', 'info');
  }

  // Apply Layout Preset
  applyPreset(presetId: string) {
    const allWidgets = JSON.parse(JSON.stringify(this.lms.activeTenantDashboard().widgets)) as DashboardWidget[];
    
    if (presetId === 'executive') {
      const order = ['kpi_grid', 'chart_department_matrix', 'chart_enrollment_trends', 'escalation_queue', 'live_audit_feed', 'quick_actions'];
      const filtered: DashboardWidget[] = [];
      order.forEach((type, idx) => {
        const found = allWidgets.find(w => w.type === type);
        if (found) {
          filtered.push({
            ...found,
            id: `w-${type}-${idx}`,
            colSpan: (type === 'kpi_grid' ? 4 : 2) as any,
            rowSpan: (type === 'kpi_grid' ? 1 : 2) as any
          });
        }
      });
      this.draftWidgets.set(filtered);
      this.showToast('Applied "Executive Cockpit" layout preset');
    } else if (presetId === 'learner') {
      const order = ['announcement_banner', 'learner_in_progress', 'gamification_leaderboard', 'chart_activity_heatmap', 'upcoming_webinars'];
      const filtered: DashboardWidget[] = [];
      order.forEach((type, idx) => {
        const found = allWidgets.find(w => w.type === type);
        if (found) {
          filtered.push({
            ...found,
            id: `w-${type}-${idx}`,
            colSpan: (type === 'announcement_banner' ? 4 : type === 'learner_in_progress' ? 3 : type === 'gamification_leaderboard' ? 1 : 2) as any,
            rowSpan: (type === 'announcement_banner' ? 1 : type === 'learner_in_progress' ? 3 : 2) as any
          });
        }
      });
      this.draftWidgets.set(filtered);
      this.showToast('Applied "Learner Progression" layout preset');
    } else if (presetId === 'compliance') {
      const order = ['announcement_banner', 'chart_compliance_gauge', 'chart_department_matrix', 'escalation_queue', 'live_audit_feed'];
      const filtered: DashboardWidget[] = [];
      order.forEach((type, idx) => {
        const found = allWidgets.find(w => w.type === type);
        if (found) {
          filtered.push({
            ...found,
            id: `w-${type}-${idx}`,
            colSpan: (type === 'announcement_banner' ? 4 : 2) as any,
            rowSpan: (type === 'announcement_banner' ? 1 : 2) as any
          });
        }
      });
      this.draftWidgets.set(filtered);
      this.showToast('Applied "Compliance & Audit" layout preset');
    } else {
      // Full enterprise layout
      this.resetLayout(false);
      this.showToast('Applied "Full Enterprise Matrix" layout preset');
    }
  }

  // Smart Auto-Arrange: packs columns & rows cleanly
  autoArrangeLayout() {
    this.draftWidgets.update(widgets => {
      const copy = [...widgets];
      return copy.map(w => {
        let span = w.colSpan;
        let rSpan = w.rowSpan || 2;
        if (w.type === 'announcement_banner' || w.type === 'kpi_grid') {
          span = 4;
          rSpan = 1;
        } else if (w.type === 'learner_in_progress') {
          span = 3;
          rSpan = 2;
        } else if (w.type === 'gamification_leaderboard') {
          span = 1;
          rSpan = 2;
        } else if (span > 2) {
          span = 2;
        }
        return { ...w, colSpan: span as any, rowSpan: rSpan as any };
      });
    });
    this.showToast('✨ Canvas widgets smartly balanced & arranged');
  }

  // Publish Dashboard for Active Tenant
  publishDashboard() {
    const tenant = this.activeTenant();
    const user = this.lms.activeUser();
    this.lms.publishTenantDashboard(tenant.id, this.draftWidgets(), user.name);
    
    this.isBuilderMode.set(false);
    this.previewRole.set(null);
  }

  // Reset to Factory Default LMS Layout
  resetLayout(prompt = true) {
    if (!prompt || confirm('Reset this tenant dashboard to default factory LMS layout?')) {
      const tenant = this.activeTenant();
      this.lms.resetTenantDashboard(tenant.id);
      this.draftWidgets.set(JSON.parse(JSON.stringify(this.lms.activeTenantDashboard().widgets)));
    }
  }

  // Add new widget from catalog
  onAddWidget(widget: DashboardWidget) {
    this.draftWidgets.update(list => [...list, widget]);
    this.showAddWidgetModal.set(false);
    this.showToast(`Added "${widget.title}" to canvas`);
  }

  // Remove widget
  onRemoveWidget(id: string) {
    const item = this.draftWidgets().find(w => w.id === id);
    this.draftWidgets.update(list => list.filter(w => w.id !== id));
    this.showToast(`Removed "${item?.title || 'Widget'}"`);
  }

  // Duplicate widget
  onDuplicateWidget(widget: DashboardWidget) {
    const copy: DashboardWidget = {
      ...JSON.parse(JSON.stringify(widget)),
      id: `w-${widget.type}-${Date.now().toString().slice(-4)}`,
      title: `${widget.title} (Copy)`
    };
    this.draftWidgets.update(list => {
      const index = list.findIndex(w => w.id === widget.id);
      const copyList = [...list];
      copyList.splice(index + 1, 0, copy);
      return copyList;
    });
    this.showToast(`Duplicated "${widget.title}"`);
  }

  // Move Up / Left
  onMoveUp(id: string) {
    this.draftWidgets.update(list => {
      const index = list.findIndex(w => w.id === id);
      if (index <= 0) return list;
      const copy = [...list];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  }

  // Move Down / Right
  onMoveDown(id: string) {
    this.draftWidgets.update(list => {
      const index = list.findIndex(w => w.id === id);
      if (index < 0 || index >= list.length - 1) return list;
      const copy = [...list];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  }

  // Change ColSpan Width
  onChangeColSpan(event: { id: string; colSpan: 1 | 2 | 3 | 4 }) {
    this.draftWidgets.update(list => 
      list.map(w => w.id === event.id ? { ...w, colSpan: event.colSpan } : w)
    );
  }

  // Change RowSpan Height
  onChangeRowSpan(event: { id: string; rowSpan: 1 | 2 | 3 | 4 }) {
    this.draftWidgets.update(list => 
      list.map(w => w.id === event.id ? { ...w, rowSpan: event.rowSpan } : w)
    );
  }

  // Change Dimensions (Both ColSpan & RowSpan)
  onChangeDimensions(event: { id: string; colSpan: 1 | 2 | 3 | 4; rowSpan: 1 | 2 | 3 | 4 }) {
    this.draftWidgets.update(list => 
      list.map(w => w.id === event.id ? { ...w, colSpan: event.colSpan, rowSpan: event.rowSpan } : w)
    );
  }

  // Save Widget Config Edit
  onSaveWidgetConfig(updated: DashboardWidget) {
    this.draftWidgets.update(list => 
      list.map(w => w.id === updated.id ? updated : w)
    );
    this.editingWidget.set(null);
    this.showToast(`Updated "${updated.title}" settings`);
  }

  // Drag and Drop Handlers (Sleek Ghost Image without ugly square block snapshot)
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());

      // Create an elegant, compact drag ghost badge
      const widget = this.draftWidgets()[index];
      const ghost = document.createElement('div');
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.padding = '8px 16px';
      ghost.style.borderRadius = '14px';
      ghost.style.background = '#1e1b4b';
      ghost.style.color = '#ffffff';
      ghost.style.fontSize = '12px';
      ghost.style.fontWeight = '600';
      ghost.style.display = 'flex';
      ghost.style.alignItems = 'center';
      ghost.style.gap = '8px';
      ghost.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4)';
      ghost.style.border = '1px solid rgba(99, 102, 241, 0.5)';
      ghost.style.zIndex = '9999';
      ghost.innerHTML = `<span>✋ Moving: ${widget?.title || 'Widget'} (${(widget?.colSpan || 2) * 25}% &times; ${widget?.rowSpan || 2}x)</span>`;
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(ghost, 20, 20);
      setTimeout(() => {
        if (document.body.contains(ghost)) {
          document.body.removeChild(ghost);
        }
      }, 0);
    }
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverIndex.set(index);
  }

  onDragLeave(index: number) {
    if (this.dragOverIndex() === index) {
      this.dragOverIndex.set(null);
    }
  }

  onDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    const sourceIndex = this.draggedIndex();
    
    if (sourceIndex !== null && sourceIndex !== targetIndex) {
      this.draftWidgets.update(list => {
        const copy = [...list];
        const [movedItem] = copy.splice(sourceIndex, 1);
        copy.splice(targetIndex, 0, movedItem);
        return copy;
      });
      this.showToast('Reordered widget position');
    }

    this.draggedIndex.set(null);
    this.dragOverIndex.set(null);
  }

  onDragEnd() {
    this.draggedIndex.set(null);
    this.dragOverIndex.set(null);
  }

  // Utility to determine colSpan class for 12-column CSS grid with optimal symmetry
  getColSpanClass(span: 1 | 2 | 3 | 4): string {
    switch (span) {
      case 1:
        return 'col-span-1 sm:col-span-6 lg:col-span-3'; // 1/4 (25%) - 3 cols
      case 2:
        return 'col-span-1 sm:col-span-6 lg:col-span-6'; // 1/2 (50%) - 6 cols
      case 3:
        return 'col-span-1 sm:col-span-12 lg:col-span-9'; // 3/4 (75%) - 9 cols
      case 4:
      default:
        return 'col-span-1 sm:col-span-12 lg:col-span-12'; // 100% - 12 cols
    }
  }

  // Utility to determine rowSpan & height class for symmetric alignment
  getRowSpanClass(rowSpan?: 1 | 2 | 3 | 4): string {
    const span = rowSpan || 2;
    switch (span) {
      case 1:
        return 'min-h-[160px] lg:row-span-1';
      case 3:
        return 'min-h-[500px] lg:row-span-3';
      case 4:
        return 'min-h-[640px] lg:row-span-4';
      case 2:
      default:
        return 'min-h-[360px] lg:row-span-2';
    }
  }
}

