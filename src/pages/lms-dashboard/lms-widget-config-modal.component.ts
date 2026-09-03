import { Component, ChangeDetectionStrategy, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LmsDashboardWidget } from '../../models/lms-dashboard.model';
import { CustomSelectComponent, SelectOption } from '../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-lms-widget-config-modal',
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  template: `
    <div 
      class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
      (click)="close.emit()">
      <div 
        class="bg-base-100 border border-base-300 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up-modal"
        (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-tenant-500/10 text-tenant-600 dark:text-tenant-300 flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">tune</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-text-primary">Widget Settings</h3>
              <p class="text-[11px] text-text-secondary">Configure appearance and options for this component</p>
            </div>
          </div>
          <button 
            type="button"
            (click)="close.emit()"
            class="w-8 h-8 rounded-xl bg-base-200 hover:bg-base-300 text-text-secondary flex items-center justify-center transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          <!-- Widget Title -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">Widget Title</label>
            <input 
              type="text" 
              [value]="title()"
              (input)="updateTitle($event)"
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-base-200 border border-base-300 text-text-primary focus:outline-none focus:border-tenant-500 transition-colors"
              placeholder="Enter widget title" />
          </div>

          <!-- Widget Subtitle -->
          <div>
            <label class="block text-xs font-semibold text-text-primary mb-1">Subtitle / Description</label>
            <input 
              type="text" 
              [value]="subtitle()"
              (input)="updateSubtitle($event)"
              class="w-full px-3.5 py-2 text-xs rounded-xl bg-base-200 border border-base-300 text-text-primary focus:outline-none focus:border-tenant-500 transition-colors"
              placeholder="Brief subtitle explanation" />
          </div>

          <!-- Width & Height Multipliers -->
          <div class="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1">Column Width</label>
              <div class="grid grid-cols-4 gap-1">
                @for (span of [1, 2, 3, 4]; track span) {
                  <button 
                    type="button"
                    (click)="colSpan.set(span)"
                    class="py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                    [class]="colSpan() === span ? 'bg-tenant-500 text-white border-transparent shadow-xs font-bold' : 'bg-base-200 text-text-secondary border-base-300 hover:bg-base-300'">
                    {{ span * 25 }}%
                  </button>
                }
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-text-primary mb-1">Height Scale</label>
              <div class="grid grid-cols-4 gap-1">
                @for (rSpan of [1, 2, 3, 4]; track rSpan) {
                  <button 
                    type="button"
                    (click)="rowSpan.set(rSpan)"
                    class="py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                    [class]="rowSpan() === rSpan ? 'bg-tenant-500 text-white border-transparent shadow-xs font-bold' : 'bg-base-200 text-text-secondary border-base-300 hover:bg-base-300'">
                    {{ rSpan }}x
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Specific Widget Configurations -->
          @if (widget().type === 'lms_broadcast_banner') {
            <div class="pt-2 border-t border-base-300 space-y-3">
              <label class="block text-xs font-semibold text-text-primary">Banner Announcement Text</label>
              <textarea 
                [value]="bannerText()"
                (input)="updateBannerText($event)"
                rows="3"
                class="w-full px-3.5 py-2 text-xs rounded-xl bg-base-200 border border-base-300 text-text-primary focus:outline-none focus:border-tenant-500 transition-colors"
                placeholder="Enter organization-wide LMS announcement..."></textarea>
              
              <div>
                <label class="block text-xs font-semibold text-text-primary mb-1">Banner Accent Style</label>
                <div class="grid grid-cols-4 gap-1.5">
                  @for (type of ['indigo', 'info', 'warning', 'success']; track type) {
                    <button 
                      type="button"
                      (click)="bannerType.set(type)"
                      class="py-1.5 px-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer text-center"
                      [class]="bannerType() === type ? 'bg-tenant-500 text-white border-transparent font-bold' : 'bg-base-200 text-text-secondary border-base-300'">
                      {{ type }}
                    </button>
                  }
                </div>
              </div>
            </div>
          }

          @if (widget().type === 'recent_lms_activity' || widget().type === 'lms_snapshot_cards') {
            <div class="pt-2 border-t border-base-300">
              <label class="block text-xs font-semibold text-text-primary mb-1">Max Items to Display</label>
              <app-custom-select
                [options]="maxItemsOptions"
                [clearable]="false"
                [searchable]="false"
                [ngModel]="maxItems()"
                (ngModelChange)="maxItems.set($event)">
              </app-custom-select>
            </div>
          }

        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 border-t border-base-300 flex items-center justify-end gap-2 bg-base-200/50">
          <button 
            type="button"
            (click)="close.emit()"
            class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-secondary text-xs font-semibold transition-colors cursor-pointer">
            Cancel
          </button>
          <button 
            type="button"
            (click)="saveChanges()"
            class="px-4 py-2 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">save</span>
            <span>Apply Changes</span>
          </button>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LmsWidgetConfigModalComponent implements OnInit {
  widget = input.required<LmsDashboardWidget>();
  close = output<void>();
  save = output<LmsDashboardWidget>();

  title = signal<string>('');
  subtitle = signal<string>('');
  colSpan = signal<1 | 2 | 3 | 4>(1);
  rowSpan = signal<1 | 2 | 3 | 4>(1);
  bannerText = signal<string>('');
  bannerType = signal<'indigo' | 'info' | 'warning' | 'success'>('indigo');
  maxItems = signal<number>(5);

  maxItemsOptions: SelectOption[] = [
    { value: 3, label: '3 items' },
    { value: 5, label: '5 items' },
    { value: 8, label: '8 items' },
    { value: 12, label: '12 items' }
  ];

  ngOnInit() {
    const w = this.widget();
    this.title.set(w.title || '');
    this.subtitle.set(w.subtitle || '');
    this.colSpan.set(w.colSpan || 1);
    this.rowSpan.set(w.rowSpan || 1);
    if (w.config) {
      if (w.config.bannerText !== undefined) this.bannerText.set(w.config.bannerText);
      if (w.config.bannerType !== undefined) this.bannerType.set(w.config.bannerType);
      if (w.config.maxItems !== undefined) this.maxItems.set(w.config.maxItems);
    }
  }

  updateTitle(event: Event) {
    this.title.set((event.target as HTMLInputElement).value);
  }

  updateSubtitle(event: Event) {
    this.subtitle.set((event.target as HTMLInputElement).value);
  }

  updateBannerText(event: Event) {
    this.bannerText.set((event.target as HTMLTextAreaElement).value);
  }

  updateMaxItems(event: Event) {
    this.maxItems.set(Number((event.target as HTMLSelectElement).value) || 5);
  }

  saveChanges() {
    const current = this.widget();
    const updated: LmsDashboardWidget = {
      ...current,
      title: this.title(),
      subtitle: this.subtitle(),
      colSpan: this.colSpan(),
      rowSpan: this.rowSpan(),
      config: {
        ...(current.config || {}),
        ...(current.type === 'lms_broadcast_banner' ? { bannerText: this.bannerText(), bannerType: this.bannerType() } : {}),
        ...(current.type === 'recent_lms_activity' || current.type === 'lms_snapshot_cards' ? { maxItems: this.maxItems() } : {})
      }
    };
    this.save.emit(updated);
  }
}
