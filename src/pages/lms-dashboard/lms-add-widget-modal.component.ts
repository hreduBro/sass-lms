import { Component, ChangeDetectionStrategy, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LmsWidgetCatalogItem, 
  LMS_WIDGET_CATALOG, 
  LmsDashboardWidget,
  LmsWidgetCategory 
} from '../../models/lms-dashboard.model';

@Component({
  selector: 'app-lms-add-widget-modal',
  imports: [CommonModule],
  template: `
    <div 
      class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
      (click)="close.emit()">
      <div 
        class="bg-base-100 border border-base-300 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-slide-up-modal flex flex-col max-h-[85vh]"
        (click)="$event.stopPropagation()">
        
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-base-300 bg-base-200/40 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-tenant-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <span class="material-symbols-outlined text-xl">widgets</span>
            </div>
            <div>
              <h2 class="text-base font-bold text-text-primary">LMS Widget Catalog</h2>
              <p class="text-xs text-text-secondary">Select an interactive component to add to your organization's LMS overview canvas</p>
            </div>
          </div>
          <button 
            type="button"
            (click)="close.emit()"
            class="w-9 h-9 rounded-xl bg-base-200 hover:bg-base-300 text-text-secondary flex items-center justify-center transition-colors cursor-pointer focus:outline-none">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Controls: Search & Category Filter Pills -->
        <div class="px-6 py-3.5 border-b border-base-300/80 bg-base-100 space-y-3 flex-shrink-0">
          
          <!-- Search Bar -->
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-lg pointer-events-none">search</span>
            <input 
              type="text"
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              placeholder="Search LMS widgets by keyword, metric, or purpose..."
              class="w-full pl-10 pr-9 py-2 text-xs rounded-2xl bg-base-200/80 border border-base-300 text-text-primary focus:outline-none focus:border-tenant-500 focus:bg-base-100 transition-all placeholder:text-text-secondary" />
            @if (searchQuery()) {
              <button 
                type="button"
                (click)="searchQuery.set('')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer">
                <span class="material-symbols-outlined text-sm">cancel</span>
              </button>
            }
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            @for (cat of categories; track cat.id) {
              <button 
                type="button"
                (click)="selectedCategory.set(cat.id)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5"
                [class]="selectedCategory() === cat.id 
                  ? 'bg-tenant-500 text-white border-transparent shadow-xs font-bold' 
                  : 'bg-base-200 text-text-secondary border-base-300 hover:bg-base-300/70 hover:text-text-primary'">
                <span class="material-symbols-outlined text-sm">{{ cat.icon }}</span>
                <span>{{ cat.label }}</span>
                <span class="text-[10px] opacity-70 px-1 py-0.2 rounded-full"
                      [class]="selectedCategory() === cat.id ? 'bg-white/20' : 'bg-base-300'">
                  {{ getCategoryCount(cat.id) }}
                </span>
              </button>
            }
          </div>

        </div>

        <!-- Catalog Grid Items List -->
        <div class="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          @if (filteredItems().length === 0) {
            <div class="py-12 text-center text-text-secondary space-y-2">
              <span class="material-symbols-outlined text-4xl text-text-secondary/60">search_off</span>
              <p class="text-xs font-semibold">No widgets match "{{ searchQuery() }}"</p>
              <p class="text-[11px]">Try searching with a different keyword or select "All Categories".</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              @for (item of filteredItems(); track item.id) {
                <div class="p-4 rounded-2xl border border-base-300 bg-base-100 hover:border-tenant-500/50 hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <!-- Top row: Icon, Name & Category Badge -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-tenant-500/10 text-tenant-600 dark:text-tenant-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <span class="material-symbols-outlined text-xl">{{ item.icon }}</span>
                        </div>
                        <div>
                          <h3 class="font-bold text-xs text-text-primary group-hover:text-tenant-600 dark:group-hover:text-tenant-300 transition-colors">{{ item.name }}</h3>
                          <span class="text-[10px] text-text-secondary font-medium">{{ item.categoryLabel }}</span>
                        </div>
                      </div>
                      
                      <!-- Default Size Pills -->
                      <div class="flex items-center gap-1">
                        <span class="text-[10px] px-2 py-0.5 rounded-md bg-base-200 border border-base-300 font-mono text-text-secondary font-semibold">
                          W: {{ item.defaultWidthPct }}%
                        </span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-base-200 border border-base-300 font-mono text-text-secondary font-semibold">
                          H: {{ item.defaultRowSpan }}x
                        </span>
                      </div>
                    </div>

                    <!-- Description -->
                    <p class="text-xs text-text-secondary leading-relaxed mb-4">
                      {{ item.description }}
                    </p>
                  </div>

                  <!-- Card Action: Add to Canvas -->
                  <div class="pt-3 border-t border-base-300/80 flex items-center justify-between">
                    <span class="text-[11px] text-text-secondary font-medium">Ready to place</span>
                    <button 
                      type="button"
                      (click)="addWidget(item)"
                      class="px-3.5 py-1.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-sm font-bold">add</span>
                      <span>+ Add to Canvas</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Modal Footer: Count & Close -->
        <div class="px-6 py-3.5 border-t border-base-300 bg-base-200/40 flex items-center justify-between flex-shrink-0">
          <span class="text-xs text-text-secondary font-medium">
            {{ filteredItems().length }} widgets available in catalog
          </span>
          <button 
            type="button"
            (click)="close.emit()"
            class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-semibold transition-colors cursor-pointer">
            Close Catalog
          </button>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LmsAddWidgetModalComponent {
  close = output<void>();
  selectWidget = output<LmsDashboardWidget>();

  catalog = LMS_WIDGET_CATALOG;

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  categories = [
    { id: 'all', label: 'All Categories', icon: 'apps' },
    { id: 'kpis-summary', label: 'KPIs & Summary', icon: 'insights' },
    { id: 'capacity', label: 'Capacity & Resources', icon: 'storage' },
    { id: 'drafts', label: 'Drafts & Creation', icon: 'edit_note' },
    { id: 'status-activity', label: 'Status & Metrics', icon: 'pie_chart' },
    { id: 'instances', label: 'Instances & Directory', icon: 'layers' },
    { id: 'operational', label: 'Operations', icon: 'bolt' }
  ];

  filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.catalog.filter(item => {
      const matchCat = cat === 'all' || item.category === cat;
      const matchSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  });

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input?.value || '');
  }

  getCategoryCount(catId: string): number {
    if (catId === 'all') return this.catalog.length;
    return this.catalog.filter(i => i.category === catId).length;
  }

  addWidget(item: LmsWidgetCatalogItem) {
    const newWidget: LmsDashboardWidget = {
      id: `w-${item.type}-${Date.now().toString().slice(-4)}`,
      type: item.type,
      title: item.name,
      subtitle: item.description,
      colSpan: item.defaultColSpan,
      rowSpan: item.defaultRowSpan,
      audience: ['org-admin'],
      config: {
        bannerType: 'indigo',
        chartType: 'cards',
        maxItems: 8
      }
    };
    this.selectWidget.emit(newWidget);
  }
}
