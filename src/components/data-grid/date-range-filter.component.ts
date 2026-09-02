import { Component, ChangeDetectionStrategy, model, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <span class="text-[11px] text-text-secondary block mb-1 font-medium">{{ fromLabel() }}</span>
        <input
          type="date"
          [ngModel]="fromDate()"
          (ngModelChange)="fromDate.set($event)"
          class="w-full px-3 py-2 rounded-xl bg-slate-50/70 dark:bg-base-200 border border-slate-200/90 dark:border-base-300 text-xs text-text-primary focus:outline-none focus:border-tenant-500 transition-colors shadow-2xs" />
      </div>
      <div>
        <span class="text-[11px] text-text-secondary block mb-1 font-medium">{{ toLabel() }}</span>
        <input
          type="date"
          [ngModel]="toDate()"
          (ngModelChange)="toDate.set($event)"
          class="w-full px-3 py-2 rounded-xl bg-slate-50/70 dark:bg-base-200 border border-slate-200/90 dark:border-base-300 text-xs text-text-primary focus:outline-none focus:border-tenant-500 transition-colors shadow-2xs" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeFilterComponent {
  fromDate = model<string | null>('');
  toDate = model<string | null>('');
  fromLabel = input<string>('From Date:');
  toLabel = input<string>('To Date:');
}
