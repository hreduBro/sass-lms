import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { 
  LmsDashboardWidget, 
  LmsDashboardLayout, 
  LmsDashboardPreset,
  LMS_DASHBOARD_PRESETS,
  DEFAULT_LMS_DASHBOARD_WIDGETS 
} from '../../models/lms-dashboard.model';
import { LmsInstance, LmsDraft } from '../../models/lms-instance.model';
import { LmsWidgetRendererComponent } from './lms-widget-renderer.component';
import { LmsWidgetConfigModalComponent } from './lms-widget-config-modal.component';
import { LmsAddWidgetModalComponent } from './lms-add-widget-modal.component';

@Component({
  selector: 'app-lms-dashboard',
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    LmsWidgetRendererComponent, 
    LmsWidgetConfigModalComponent, 
    LmsAddWidgetModalComponent
  ],
  templateUrl: './lms-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LmsDashboardComponent {
  lms = inject(LmsDataService);
  private router = inject(Router);

  // Studio Mode State
  isStudioMode = signal<boolean>(false);
  editingWidget = signal<LmsDashboardWidget | null>(null);
  showAddWidgetModal = signal<boolean>(false);

  // Selected LMS Detail Modal state
  selectedLms = signal<LmsInstance | null>(null);
  draftToDelete = signal<LmsDraft | null>(null);

  // Working copy of widgets when inside Studio mode
  draftWidgets = signal<LmsDashboardWidget[]>([]);

  // Drag and Drop tracking
  draggedIndex = signal<number | null>(null);
  dragOverIndex = signal<number | null>(null);

  // Published Layout from LmsDataService
  publishedLayout = this.lms.lmsDashboardLayout;

  // Active Organization
  activeTenant = this.lms.activeTenant;

  // Presets definition
  presets: LmsDashboardPreset[] = LMS_DASHBOARD_PRESETS;

  // Active / displayed widgets
  displayedWidgets = computed<LmsDashboardWidget[]>(() => {
    if (this.isStudioMode()) {
      return this.draftWidgets();
    }
    return this.publishedLayout().widgets;
  });

  // Show Toast via unified LMS service
  showToast(msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    this.lms.showToast(msg, type);
  }

  // Enter Studio Mode
  enterStudioMode() {
    this.draftWidgets.set(JSON.parse(JSON.stringify(this.publishedLayout().widgets)));
    this.isStudioMode.set(true);
    this.lms.showToast('Entered LMS Dashboard Studio mode', 'info');
  }

  // Discard changes & exit Studio Mode
  discardStudioChanges() {
    this.isStudioMode.set(false);
    this.draftWidgets.set([]);
    this.lms.showToast('Reverted unsaved studio changes', 'info');
  }

  // Apply a Layout Preset
  applyPreset(preset: LmsDashboardPreset) {
    const newWidgets: LmsDashboardWidget[] = [];
    const defaults = DEFAULT_LMS_DASHBOARD_WIDGETS;

    preset.widgetTemplates.forEach((template, idx) => {
      const existing = defaults.find(w => w.type === template.type);
      if (existing) {
        newWidgets.push({
          ...JSON.parse(JSON.stringify(existing)),
          id: `w-${template.type}-${idx}`,
          colSpan: template.colSpan,
          rowSpan: template.rowSpan
        });
      } else {
        newWidgets.push({
          id: `w-${template.type}-${idx}`,
          type: template.type,
          title: template.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          colSpan: template.colSpan,
          rowSpan: template.rowSpan,
          audience: ['org-admin']
        });
      }
    });

    this.draftWidgets.set(newWidgets);
    this.lms.showToast(`Applied "${preset.name}" preset`, 'success');
  }

  // Auto-Arrange widgets for symmetry and alignment
  autoArrangeLayout() {
    this.draftWidgets.update(widgets => {
      return widgets.map(w => {
        let span = w.colSpan;
        let rSpan = w.rowSpan || 2;
        if (w.type === 'org_capacity' || w.type === 'lms_broadcast_banner') {
          span = 4;
          rSpan = 1;
        } else if (span > 2) {
          span = 2;
        }
        return { ...w, colSpan: span, rowSpan: rSpan };
      });
    });
    this.lms.showToast('Auto-arranged canvas layout cleanly', 'success');
  }

  // Reset to Factory Default Layout
  resetLayout() {
    if (confirm('Reset LMS Dashboard canvas to system factory default layout?')) {
      const defaults = this.lms.resetLmsDashboard();
      this.draftWidgets.set(JSON.parse(JSON.stringify(defaults.widgets)));
    }
  }

  // Publish Studio layout as live View-mode layout
  publishDashboard() {
    const user = this.lms.activeUser();
    this.lms.publishLmsDashboard(this.draftWidgets(), user.name || 'Organization Admin');
    this.isStudioMode.set(false);
  }

  // Add widget from catalog
  onAddWidget(widget: LmsDashboardWidget) {
    this.draftWidgets.update(list => [...list, widget]);
    this.showAddWidgetModal.set(false);
    this.lms.showToast(`Added "${widget.title}" to canvas`, 'success');
  }

  // Remove widget
  onRemoveWidget(id: string) {
    const item = this.draftWidgets().find(w => w.id === id);
    this.draftWidgets.update(list => list.filter(w => w.id !== id));
    this.lms.showToast(`Removed "${item?.title || 'Widget'}"`, 'info');
  }

  // Duplicate widget
  onDuplicateWidget(widget: LmsDashboardWidget) {
    const copy: LmsDashboardWidget = {
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

  // Move Up
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

  // Move Down
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

  // Change ColSpan
  onChangeColSpan(event: { id: string; colSpan: 1 | 2 | 3 | 4 }) {
    this.draftWidgets.update(list => 
      list.map(w => w.id === event.id ? { ...w, colSpan: event.colSpan } : w)
    );
  }

  // Change RowSpan
  onChangeRowSpan(event: { id: string; rowSpan: 1 | 2 | 3 | 4 }) {
    this.draftWidgets.update(list => 
      list.map(w => w.id === event.id ? { ...w, rowSpan: event.rowSpan } : w)
    );
  }

  // Change Dimensions
  onChangeDimensions(event: { id: string; colSpan: 1 | 2 | 3 | 4; rowSpan: 1 | 2 | 3 | 4 }) {
    this.draftWidgets.update(list => 
      list.map(w => w.id === event.id ? { ...w, colSpan: event.colSpan, rowSpan: event.rowSpan } : w)
    );
  }

  // Save Widget Config Edit
  onSaveWidgetConfig(updated: LmsDashboardWidget) {
    this.draftWidgets.update(list => 
      list.map(w => w.id === updated.id ? updated : w)
    );
    this.editingWidget.set(null);
    this.showToast(`Updated "${updated.title}" settings`);
  }

  // Drag and Drop Handlers
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());

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

  // Delete Draft Confirmation
  confirmDeleteDraft(draft: LmsDraft) {
    this.draftToDelete.set(draft);
  }

  executeDeleteDraft() {
    const d = this.draftToDelete();
    if (d) {
      this.lms.deleteLmsDraft(d.id);
      this.draftToDelete.set(null);
      this.showToast(`Draft for "${d.basicInfo.lmsName || 'LMS'}" discarded`, 'info');
    }
  }

  // Utility to determine colSpan class for 12-column CSS grid with optimal symmetry
  getColSpanClass(span: 1 | 2 | 3 | 4): string {
    switch (span) {
      case 1:
        return 'col-span-1 sm:col-span-6 lg:col-span-3'; // 25% (3/12 cols)
      case 2:
        return 'col-span-1 sm:col-span-6 lg:col-span-6'; // 50% (6/12 cols)
      case 3:
        return 'col-span-1 sm:col-span-12 lg:col-span-9'; // 75% (9/12 cols)
      case 4:
      default:
        return 'col-span-1 sm:col-span-12 lg:col-span-12'; // 100% (12/12 cols)
    }
  }

  // Utility to determine rowSpan height class
  getRowSpanClass(rowSpan?: 1 | 2 | 3 | 4): string {
    const span = rowSpan || 2;
    switch (span) {
      case 1:
        return 'min-h-[160px] lg:row-span-1';
      case 3:
        return 'min-h-[480px] lg:row-span-3';
      case 4:
        return 'min-h-[640px] lg:row-span-4';
      case 2:
      default:
        return 'min-h-[340px] lg:row-span-2';
    }
  }
}
