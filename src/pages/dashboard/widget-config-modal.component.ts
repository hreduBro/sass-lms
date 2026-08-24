import { Component, ChangeDetectionStrategy, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardWidget, UserRole } from '../../models/lms.model';

@Component({
  selector: 'app-widget-config-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-modal-backdrop">
      <div class="bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-lg p-6 animate-modal-card">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-base-300 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-tenant-50 dark:bg-tenant-500/20 flex items-center justify-center text-tenant-600 dark:text-tenant-300">
              <span class="material-symbols-outlined text-lg">tune</span>
            </div>
            <div>
              <h3 class="font-bold text-base text-text-primary">Configure Widget Properties</h3>
              <p class="text-xs text-text-secondary">Type: <span class="font-mono">{{ widget().type }}</span></p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-text-secondary hover:text-text-primary p-1 rounded-lg">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form (submit)="saveChanges()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">Widget Display Title *</label>
            <input 
              type="text" 
              [(ngModel)]="formTitle" 
              name="formTitle"
              required
              class="w-full px-3 py-2 rounded-xl bg-base-200 border border-base-300 text-xs focus:outline-none focus:border-tenant-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">Subtitle / Descriptive Tagline</label>
            <input 
              type="text" 
              [(ngModel)]="formSubtitle" 
              name="formSubtitle"
              placeholder="e.g. Real-time aggregated organizational telemetry"
              class="w-full px-3 py-2 rounded-xl bg-base-200 border border-base-300 text-xs focus:outline-none" />
          </div>

          <!-- ColSpan & RowSpan Grid Dimensions -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm text-tenant-600">view_column</span>
                <span>Canvas Width (Columns)</span>
              </label>
              <div class="grid grid-cols-4 gap-1.5">
                @for (span of [1, 2, 3, 4]; track span) {
                  <button
                    type="button"
                    (click)="formColSpan = span"
                    class="py-1.5 px-1 rounded-xl border text-center text-xs font-bold transition-all"
                    [class]="formColSpan === span ? 'border-tenant-500 bg-tenant-500 text-white shadow-xs' : 'border-base-300 bg-base-200 text-text-secondary hover:text-text-primary'">
                    {{ span * 25 }}%
                  </button>
                }
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm text-tenant-600">height</span>
                <span>Canvas Height (Rows)</span>
              </label>
              <div class="grid grid-cols-4 gap-1.5">
                @for (row of [1, 2, 3, 4]; track row) {
                  <button
                    type="button"
                    (click)="formRowSpan = row"
                    class="py-1.5 px-1 rounded-xl border text-center text-xs font-bold transition-all"
                    [class]="formRowSpan === row ? 'border-tenant-500 bg-tenant-500 text-white shadow-xs' : 'border-base-300 bg-base-200 text-text-secondary hover:text-text-primary'">
                    {{ row }}x
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Role Visibility -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1.5">Target Audience Role Visibility</label>
            <div class="grid grid-cols-2 gap-2">
              @for (r of allRoles; track r.role) {
                <label class="flex items-center gap-2 p-2 rounded-xl bg-base-200 border border-base-300 cursor-pointer text-xs">
                  <input 
                    type="checkbox" 
                    [checked]="formRoles.includes(r.role)"
                    (change)="toggleRole(r.role)"
                    class="rounded border-base-300 text-tenant-600 focus:ring-0 w-4 h-4" />
                  <span class="font-medium text-text-primary">{{ r.label }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Specific Banner Text Config if announcement_banner -->
          @if (widget().type === 'announcement_banner') {
            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1">Announcement Message Body</label>
              <textarea 
                [(ngModel)]="formBannerText" 
                name="formBannerText"
                rows="3"
                class="w-full px-3 py-2 rounded-xl bg-base-200 border border-base-300 text-xs focus:outline-none"></textarea>
            </div>
          }

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-base-300">
            <button 
              type="button" 
              (click)="close.emit()"
              class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-xs font-semibold text-text-secondary">
              Cancel
            </button>
            <button 
              type="submit"
              class="px-4 py-2 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold shadow-sm transition-colors">
              Save Widget
            </button>
          </div>
        </form>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetConfigModalComponent implements OnInit {
  widget = input<DashboardWidget>({
    id: 'w-temp',
    type: 'kpi_grid',
    title: 'KPI Metrics',
    colSpan: 4,
    visibleForRoles: ['super_admin', 'tenant_admin', 'instructor', 'learner']
  });
  close = output<void>();
  save = output<DashboardWidget>();

  formTitle = '';
  formSubtitle = '';
  formColSpan: any = 2;
  formRowSpan: any = 2;
  formRoles: UserRole[] = [];
  formBannerText = '';

  allRoles: { role: UserRole; label: string }[] = [
    { role: 'super_admin', label: 'Super Admin' },
    { role: 'tenant_admin', label: 'Tenant Admin' },
    { role: 'instructor', label: 'Instructor' },
    { role: 'learner', label: 'Learner' },
  ];

  ngOnInit() {
    const w = this.widget();
    this.formTitle = w.title;
    this.formSubtitle = w.subtitle || '';
    this.formColSpan = w.colSpan || 2;
    this.formRowSpan = w.rowSpan || 2;
    this.formRoles = [...w.visibleForRoles];
    this.formBannerText = w.config?.bannerText || '';
  }

  toggleRole(role: UserRole) {
    if (this.formRoles.includes(role)) {
      this.formRoles = this.formRoles.filter(r => r !== role);
    } else {
      this.formRoles = [...this.formRoles, role];
    }
  }

  saveChanges() {
    const updated: DashboardWidget = {
      ...this.widget(),
      title: this.formTitle,
      subtitle: this.formSubtitle,
      colSpan: this.formColSpan,
      rowSpan: this.formRowSpan,
      visibleForRoles: this.formRoles.length > 0 ? this.formRoles : ['tenant_admin'],
      config: {
        ...this.widget().config,
        bannerText: this.formBannerText
      }
    };
    this.save.emit(updated);
  }
}
