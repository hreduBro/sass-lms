import { Component, ChangeDetectionStrategy, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CATALOG_WIDGET_TEMPLATES } from '../../services/lms-data.service';
import { DashboardWidget, DashboardWidgetType } from '../../models/lms.model';

@Component({
  selector: 'app-add-widget-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-modal-backdrop">
      <div class="bg-base-100 rounded-3xl border border-base-300 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-modal-card">
        
        <!-- Header -->
        <div class="p-6 border-b border-base-300 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-tenant-50 dark:bg-tenant-500/20 flex items-center justify-center text-tenant-600 dark:text-tenant-300">
              <span class="material-symbols-outlined text-2xl">widgets</span>
            </div>
            <div>
              <h3 class="font-bold text-lg text-text-primary">LMS Modular Widget Catalog</h3>
              <p class="text-xs text-text-secondary">Select an interactive component to add to your custom tenant canvas</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-text-secondary hover:text-text-primary p-1.5 rounded-xl hover:bg-base-200">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Filter & Search Bar -->
        <div class="px-6 py-3 border-b border-base-300 bg-base-200/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="relative w-full sm:w-72">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-text-secondary text-sm">search</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search widgets, charts, KPIs..." 
              class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-base-100 border border-base-300 text-xs focus:outline-none focus:border-tenant-500" />
          </div>

          <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            @for (cat of categories(); track cat) {
              <button
                type="button"
                (click)="selectedCategory.set(cat)"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                [class]="selectedCategory() === cat ? 'bg-tenant-500 text-white shadow-xs' : 'bg-base-100 text-text-secondary hover:text-text-primary border border-base-300'">
                {{ cat }}
              </button>
            }
          </div>
        </div>

        <!-- Catalog Grid -->
        <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (item of filteredWidgets(); track item.type) {
            <div class="p-4 rounded-2xl bg-base-200/50 border border-base-300 hover:border-tenant-500/60 hover:bg-base-200 transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-base-100 flex items-center justify-center text-tenant-600 shadow-xs border border-base-300">
                      <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
                    </div>
                    <div>
                      <h4 class="font-bold text-xs text-text-primary">{{ item.name }}</h4>
                      <span class="text-[10px] text-text-secondary font-medium">{{ item.category }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] px-2 py-0.5 rounded-md bg-base-100 text-text-secondary font-mono border border-base-300">
                      W: {{ item.defaultColSpan * 25 }}%
                    </span>
                    <span class="text-[10px] px-2 py-0.5 rounded-md bg-base-100 text-text-secondary font-mono border border-base-300">
                      H: {{ item.defaultRowSpan }}x
                    </span>
                  </div>
                </div>

                <p class="text-xs text-text-secondary leading-relaxed mt-1">
                  {{ item.description }}
                </p>
              </div>

              <div class="pt-3 mt-3 border-t border-base-300/60 flex items-center justify-end">
                <button 
                  type="button"
                  (click)="addWidget(item)"
                  class="px-3.5 py-1.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs">
                  <span class="material-symbols-outlined text-sm">add</span>
                  <span>Add to Canvas</span>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-base-300 bg-base-100 flex items-center justify-between text-xs text-text-secondary">
          <span>{{ filteredWidgets().length }} widgets available in catalog</span>
          <button (click)="close.emit()" class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 font-semibold text-text-primary">
            Close Catalog
          </button>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddWidgetModalComponent {
  close = output<void>();
  add = output<DashboardWidget>();

  searchQuery = '';
  selectedCategory = signal<string>('All');

  allCatalog = CATALOG_WIDGET_TEMPLATES;

  categories = computed(() => {
    const set = new Set<string>(['All']);
    this.allCatalog.forEach(w => set.add(w.category));
    return Array.from(set);
  });

  filteredWidgets = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.allCatalog.filter(w => {
      const matchQuery = !q || w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q);
      const matchCat = cat === 'All' || w.category === cat;
      return matchQuery && matchCat;
    });
  });

  addWidget(template: typeof CATALOG_WIDGET_TEMPLATES[0]) {
    const newWidget: DashboardWidget = {
      id: `w-${template.type}-${Date.now().toString().slice(-4)}`,
      type: template.type,
      title: template.name,
      colSpan: template.defaultColSpan,
      rowSpan: template.defaultRowSpan || 2,
      visibleForRoles: ['super_admin', 'tenant_admin', 'instructor', 'learner'],
      config: {
        bannerText: 'Tenant announcement directive for all active personnel.',
        bannerType: 'indigo'
      }
    };
    this.add.emit(newWidget);
  }
}
