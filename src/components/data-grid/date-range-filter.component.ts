import { Component, ChangeDetectionStrategy, model, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '../date-picker/date-picker.component';

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerComponent],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <app-date-picker
          [label]="fromLabel()"
          [ngModel]="fromDate()"
          (ngModelChange)="onFromChange($event)"
          align="left"
          placeholder="DD/MM/YYYY">
        </app-date-picker>
      </div>
      <div>
        <app-date-picker
          [label]="toLabel()"
          [ngModel]="toDate()"
          (ngModelChange)="onToChange($event)"
          [minDate]="fromDate() || ''"
          align="right"
          placeholder="DD/MM/YYYY">
        </app-date-picker>
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

  onFromChange(val: string) {
    this.fromDate.set(val || null);
  }

  onToChange(val: string) {
    this.toDate.set(val || null);
  }
}
