import { Component, input, output, signal, effect, forwardRef, ViewChild, ElementRef, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface CalendarDay {
  dayNumber: number;
  month: number; // 0 - 11
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  dateString: string; // DD/MM/YYYY
}

function parseDdMmYyyy(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      const dt = new Date(y, m, d);
      if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
        return dt;
      }
    }
  }
  // Try ISO YYYY-MM-DD
  if (dateStr.includes('-')) {
    const p = dateStr.trim().split('-');
    if (p.length === 3) {
      const y = parseInt(p[0], 10);
      const m = parseInt(p[1], 10) - 1;
      const d = parseInt(p[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        const dt = new Date(y, m, d);
        if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
          return dt;
        }
      }
    }
  }
  return null;
}

function formatDdMmYyyy(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-1 text-left w-full relative date-picker-root">
      @if (label()) {
        <label class="block text-xs font-semibold text-text-primary mb-1">
          {{ label() }}
          @if (required()) {
            <span class="text-rose-500">*</span>
          }
          @if (hint()) {
            <span class="text-[10px] text-text-secondary font-normal ml-1">({{ hint() }})</span>
          }
        </label>
      }

      <div class="relative flex items-center w-full">
        <!-- Display / Text Input (DD/MM/YYYY) -->
        <input
          #textInput
          type="text"
          [value]="displayValue()"
          (input)="onTextInput($event)"
          (blur)="onBlur()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-base-100 border text-xs font-mono text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-tenant-500"
          [class.border-rose-400]="hasError() || isInvalidOrder()"
          [class.bg-rose-50/20]="hasError() || isInvalidOrder()"
          [class.border-base-300]="!hasError() && !isInvalidOrder()"
          [class.opacity-60]="disabled()" />

        <!-- Interactive Calendar Popover Trigger Button -->
        <button
          type="button"
          (click)="toggleCalendar($event)"
          [disabled]="disabled()"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-base-200 text-text-secondary hover:text-tenant-600 flex items-center justify-center transition-colors cursor-pointer"
          [class.text-tenant-600]="isOpen()"
          [class.bg-tenant-500/10]="isOpen()"
          title="Open calendar date picker">
          <span class="material-symbols-outlined text-base">calendar_month</span>
        </button>
      </div>

      <!-- Inline Error message -->
      @if (errorMessage() || orderErrorMessage()) {
        <p class="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
          <span class="material-symbols-outlined text-xs">error</span>
          <span>{{ errorMessage() || orderErrorMessage() }}</span>
        </p>
      }

      <!-- Custom Interactive Calendar Dropdown Panel -->
      @if (isOpen()) {
        <div 
          class="absolute z-[99999] top-full mt-1.5 w-80 sm:w-84 max-w-[calc(100vw-2rem)] p-4 rounded-2xl bg-base-100 border border-base-300 shadow-2xl dark:shadow-black/60 text-text-primary animate-in fade-in zoom-in-95 duration-150 select-none"
          [class.left-0]="computedAlign() === 'left'"
          [class.right-0]="computedAlign() === 'right'">
          
          <!-- Month / Year Header with Custom Dropdown Trigger Pills & Nav Chevrons -->
          <div class="flex items-center justify-between gap-1.5 mb-3 pb-2.5 border-b border-base-200">
            
            <button
              type="button"
              (click)="onPrevNav($event)"
              class="w-7 h-7 rounded-lg hover:bg-base-200 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Previous">
              <span class="material-symbols-outlined text-base">chevron_left</span>
            </button>

            <div class="flex items-center gap-2 flex-1 justify-center min-w-0">
              <!-- Custom Month Dropdown Pill -->
              <button
                type="button"
                (click)="toggleView('months', $event)"
                class="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none"
                [ngClass]="activeView() === 'months' 
                  ? 'border-tenant-500 ring-2 ring-tenant-500/20 bg-tenant-50 dark:bg-tenant-950/40 text-tenant-600 dark:text-tenant-400' 
                  : 'bg-base-200 hover:bg-base-300 border-base-300 text-text-primary'">
                <span>{{ months[viewMonth()] }}</span>
                <span class="material-symbols-outlined text-xs transition-transform" [class.rotate-180]="activeView() === 'months'">
                  expand_more
                </span>
              </button>

              <!-- Custom Year Dropdown Pill -->
              <button
                type="button"
                (click)="toggleView('years', $event)"
                class="px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none"
                [ngClass]="activeView() === 'years' 
                  ? 'border-tenant-500 ring-2 ring-tenant-500/20 bg-tenant-50 dark:bg-tenant-950/40 text-tenant-600 dark:text-tenant-400' 
                  : 'bg-base-200 hover:bg-base-300 border-base-300 text-text-primary'">
                <span>{{ viewYear() }}</span>
                <span class="material-symbols-outlined text-xs transition-transform" [class.rotate-180]="activeView() === 'years'">
                  expand_more
                </span>
              </button>
            </div>

            <button
              type="button"
              (click)="onNextNav($event)"
              class="w-7 h-7 rounded-lg hover:bg-base-200 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Next">
              <span class="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          <!-- VIEW 1: MONTH SELECTOR (3x4 Grid) -->
          @if (activeView() === 'months') {
            <div class="grid grid-cols-3 gap-2 py-2">
              @for (monthName of months; track $index) {
                <button
                  type="button"
                  (click)="selectMonth($index, $event)"
                  class="py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
                  [class.bg-tenant-500]="viewMonth() === $index"
                  [class.text-white]="viewMonth() === $index"
                  [class.shadow-xs]="viewMonth() === $index"
                  [class.bg-base-200]="viewMonth() !== $index"
                  [class.hover:bg-base-300]="viewMonth() !== $index"
                  [class.text-text-primary]="viewMonth() !== $index">
                  {{ monthName }}
                </button>
              }
            </div>
          }

          <!-- VIEW 2: YEAR SELECTOR (3x4 Grid with decade pagination) -->
          @if (activeView() === 'years') {
            <div class="grid grid-cols-3 gap-2 py-2">
              @for (yr of visibleYears(); track yr) {
                <button
                  type="button"
                  (click)="selectYear(yr, $event)"
                  class="py-2.5 px-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer text-center"
                  [class.bg-tenant-500]="viewYear() === yr"
                  [class.text-white]="viewYear() === yr"
                  [class.shadow-xs]="viewYear() === yr"
                  [class.bg-base-200]="viewYear() !== yr"
                  [class.hover:bg-base-300]="viewYear() !== yr"
                  [class.text-text-primary]="viewYear() !== yr">
                  {{ yr }}
                </button>
              }
            </div>
          }

          <!-- VIEW 3: DAYS CALENDAR GRID -->
          @if (activeView() === 'days') {
            <!-- Day names header (Su, Mo, Tu, We, Th, Fr, Sa) -->
            <div class="grid grid-cols-7 gap-1 text-center mb-1.5">
              @for (dayName of weekDays; track dayName) {
                <div class="text-[11px] font-semibold text-text-secondary py-1">
                  {{ dayName }}
                </div>
              }
            </div>

            <!-- Days Grid (6 rows x 7 days) -->
            <div class="grid grid-cols-7 gap-1 text-center">
              @for (cell of calendarDays(); track cell.dateString + '_' + $index) {
                <button
                  type="button"
                  [disabled]="cell.isDisabled"
                  (click)="selectDate(cell, $event)"
                  class="h-8 rounded-xl text-xs font-mono flex items-center justify-center transition-all cursor-pointer relative"
                  [class.text-text-primary]="cell.isCurrentMonth && !cell.isSelected && !cell.isDisabled"
                  [class.text-text-secondary]="!cell.isCurrentMonth && !cell.isSelected && !cell.isDisabled"
                  [class.opacity-30]="!cell.isCurrentMonth || cell.isDisabled"
                  [class.bg-tenant-500]="cell.isSelected"
                  [class.text-white]="cell.isSelected"
                  [class.font-bold]="cell.isSelected || cell.isToday"
                  [class.shadow-xs]="cell.isSelected"
                  [class.hover:bg-base-200]="!cell.isSelected && !cell.isDisabled"
                  [class.cursor-not-allowed]="cell.isDisabled"
                  [class.ring-1]="cell.isToday && !cell.isSelected"
                  [class.ring-tenant-500]="cell.isToday && !cell.isSelected">
                  <span>{{ cell.dayNumber }}</span>
                  @if (cell.isToday && !cell.isSelected) {
                    <span class="absolute bottom-1 w-1 h-1 rounded-full bg-tenant-500"></span>
                  }
                </button>
              }
            </div>
          }

          <!-- Quick Shortcuts & Action Bar -->
          <div class="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-base-200 text-xs">
            <button
              type="button"
              (click)="selectToday($event)"
              class="px-2.5 py-1 rounded-lg bg-base-200 hover:bg-base-300 text-text-primary font-medium transition-colors cursor-pointer text-[11px]">
              Today
            </button>

            <div class="flex items-center gap-1">
              <button
                type="button"
                (click)="clearDate($event)"
                class="px-2 py-1 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-text-secondary transition-colors cursor-pointer text-[11px]">
                Clear
              </button>
              <button
                type="button"
                (click)="closeCalendar($event)"
                class="px-2.5 py-1 rounded-lg bg-tenant-500/10 hover:bg-tenant-500/20 text-tenant-600 font-semibold transition-colors cursor-pointer text-[11px]">
                Done
              </button>
            </div>
          </div>

        </div>
      }
    </div>
  `
})
export class DatePickerComponent implements ControlValueAccessor {
  @ViewChild('textInput') textInputRef?: ElementRef<HTMLInputElement>;

  label = input<string>('');
  required = input<boolean>(false);
  hint = input<string>('DD/MM/YYYY');
  placeholder = input<string>('DD/MM/YYYY');
  minDate = input<string>(''); // Can be DD/MM/YYYY or YYYY-MM-DD
  maxDate = input<string>(''); // Can be DD/MM/YYYY or YYYY-MM-DD
  hasError = input<boolean>(false);
  errorMessage = input<string>('');
  isInvalidOrder = input<boolean>(false);
  orderErrorMessage = input<string>('');
  align = input<'left' | 'right' | 'auto'>('auto');

  valueChange = output<string>();

  displayValue = signal<string>('');
  disabled = signal<boolean>(false);
  isOpen = signal<boolean>(false);
  dropdownAlign = signal<'left' | 'right'>('left');

  computedAlign = computed<'left' | 'right'>(() => {
    if (this.align() === 'left' || this.align() === 'right') {
      return this.align() as 'left' | 'right';
    }
    return this.dropdownAlign();
  });

  // Active view: 'days' | 'months' | 'years'
  activeView = signal<'days' | 'months' | 'years'>('days');

  // Active view month & year in the calendar
  viewYear = signal<number>(new Date().getFullYear());
  viewMonth = signal<number>(new Date().getMonth()); // 0-11
  yearPageOffset = signal<number>(0);

  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  readonly months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  visibleYears = computed<number[]>(() => {
    const baseYear = Math.floor(this.viewYear() / 12) * 12 + this.yearPageOffset();
    const list: number[] = [];
    for (let i = 0; i < 12; i++) {
      list.push(baseYear + i);
    }
    return list;
  });

  calendarDays = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const selectedDate = parseDdMmYyyy(this.displayValue());
    const minD = parseDdMmYyyy(this.minDate());
    const maxD = parseDdMmYyyy(this.maxDate());

    const today = new Date();
    const todayStr = formatDdMmYyyy(today);

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNumber = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNumber);
      const dateStr = formatDdMmYyyy(prevDate);
      days.push({
        dayNumber,
        month: month - 1,
        year,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: !!selectedDate && formatDdMmYyyy(selectedDate) === dateStr,
        isDisabled: this.checkIsDisabled(prevDate, minD, maxD),
        dateString: dateStr
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = formatDdMmYyyy(curDate);
      days.push({
        dayNumber: d,
        month,
        year,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: !!selectedDate && formatDdMmYyyy(selectedDate) === dateStr,
        isDisabled: this.checkIsDisabled(curDate, minD, maxD),
        dateString: dateStr
      });
    }

    // Next month padding to fill 42 cells (6 rows x 7 cols)
    const remaining = 42 - days.length;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(year, month + 1, n);
      const dateStr = formatDdMmYyyy(nextDate);
      days.push({
        dayNumber: n,
        month: month + 1,
        year,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: !!selectedDate && formatDdMmYyyy(selectedDate) === dateStr,
        isDisabled: this.checkIsDisabled(nextDate, minD, maxD),
        dateString: dateStr
      });
    }

    return days;
  });

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {
    effect(() => {
      // If display value is set, initialize view month and year
      const parsed = parseDdMmYyyy(this.displayValue());
      if (parsed) {
        this.viewYear.set(parsed.getFullYear());
        this.viewMonth.set(parsed.getMonth());
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const path = event.composedPath ? event.composedPath() : [];
    const isInside = path.includes(this.elementRef.nativeElement) || this.elementRef.nativeElement.contains(event.target as Node);
    if (!isInside) {
      this.isOpen.set(false);
      this.activeView.set('days');
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen()) {
      this.updateAlignment();
    }
  }

  private updateAlignment(): void {
    if (this.align() === 'left' || this.align() === 'right') {
      this.dropdownAlign.set(this.align() as 'left' | 'right');
      return;
    }
    if (typeof window !== 'undefined' && this.elementRef?.nativeElement) {
      const rect = this.elementRef.nativeElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1024;
      const spaceOnRight = viewportWidth - rect.left;
      const spaceOnLeft = rect.right;
      // Calendar is ~336px wide (w-84) + margin
      if (spaceOnRight < 350 && spaceOnLeft >= 320) {
        this.dropdownAlign.set('right');
      } else if (spaceOnRight < 340 && rect.left > viewportWidth / 2) {
        this.dropdownAlign.set('right');
      } else {
        this.dropdownAlign.set('left');
      }
    }
  }

  writeValue(val: any): void {
    const str = val ? String(val).trim() : '';
    this.displayValue.set(str);
    const parsed = parseDdMmYyyy(str);
    if (parsed) {
      this.viewYear.set(parsed.getFullYear());
      this.viewMonth.set(parsed.getMonth());
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) {
      this.isOpen.set(false);
      this.activeView.set('days');
    }
  }

  onTextInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    this.displayValue.set(val);
    this.onChange(val);
    this.valueChange.emit(val);

    const parsed = parseDdMmYyyy(val);
    if (parsed) {
      this.viewYear.set(parsed.getFullYear());
      this.viewMonth.set(parsed.getMonth());
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  toggleCalendar(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    const nextState = !this.isOpen();
    if (nextState) {
      this.updateAlignment();
      this.activeView.set('days');
      const parsed = parseDdMmYyyy(this.displayValue());
      if (parsed) {
        this.viewYear.set(parsed.getFullYear());
        this.viewMonth.set(parsed.getMonth());
      } else {
        const today = new Date();
        this.viewYear.set(today.getFullYear());
        this.viewMonth.set(today.getMonth());
      }
    }
    this.isOpen.set(nextState);
  }

  closeCalendar(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isOpen.set(false);
    this.activeView.set('days');
  }

  toggleView(view: 'months' | 'years', event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeView() === view) {
      this.activeView.set('days');
    } else {
      this.activeView.set(view);
      this.yearPageOffset.set(0);
    }
  }

  onPrevNav(event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeView() === 'years') {
      this.yearPageOffset.update(o => o - 12);
    } else if (this.activeView() === 'months') {
      this.viewYear.update(y => y - 1);
    } else {
      if (this.viewMonth() === 0) {
        this.viewMonth.set(11);
        this.viewYear.update(y => y - 1);
      } else {
        this.viewMonth.update(m => m - 1);
      }
    }
  }

  onNextNav(event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeView() === 'years') {
      this.yearPageOffset.update(o => o + 12);
    } else if (this.activeView() === 'months') {
      this.viewYear.update(y => y + 1);
    } else {
      if (this.viewMonth() === 11) {
        this.viewMonth.set(0);
        this.viewYear.update(y => y + 1);
      } else {
        this.viewMonth.update(m => m + 1);
      }
    }
  }

  selectMonth(monthIndex: number, event: MouseEvent): void {
    event.stopPropagation();
    this.viewMonth.set(monthIndex);
    this.activeView.set('days');
  }

  selectYear(year: number, event: MouseEvent): void {
    event.stopPropagation();
    this.viewYear.set(year);
    this.activeView.set('days');
  }

  selectDate(cell: CalendarDay, event: MouseEvent): void {
    event.stopPropagation();
    if (cell.isDisabled) return;

    this.displayValue.set(cell.dateString);
    this.onChange(cell.dateString);
    this.valueChange.emit(cell.dateString);
    this.isOpen.set(false);
    this.activeView.set('days');

    if (this.textInputRef?.nativeElement) {
      this.textInputRef.nativeElement.value = cell.dateString;
    }
  }

  selectToday(event: MouseEvent): void {
    event.stopPropagation();
    const today = new Date();
    const str = formatDdMmYyyy(today);
    const minD = parseDdMmYyyy(this.minDate());
    const maxD = parseDdMmYyyy(this.maxDate());

    if (this.checkIsDisabled(today, minD, maxD)) return;

    this.viewYear.set(today.getFullYear());
    this.viewMonth.set(today.getMonth());
    this.displayValue.set(str);
    this.onChange(str);
    this.valueChange.emit(str);
    this.isOpen.set(false);
    this.activeView.set('days');

    if (this.textInputRef?.nativeElement) {
      this.textInputRef.nativeElement.value = str;
    }
  }

  clearDate(event: MouseEvent): void {
    event.stopPropagation();
    this.displayValue.set('');
    this.onChange('');
    this.valueChange.emit('');
    this.isOpen.set(false);
    this.activeView.set('days');

    if (this.textInputRef?.nativeElement) {
      this.textInputRef.nativeElement.value = '';
    }
  }

  private checkIsDisabled(date: Date, minD: Date | null, maxD: Date | null): boolean {
    const t = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (minD) {
      const minT = new Date(minD.getFullYear(), minD.getMonth(), minD.getDate()).getTime();
      if (t < minT) return true;
    }
    if (maxD) {
      const maxT = new Date(maxD.getFullYear(), maxD.getMonth(), maxD.getDate()).getTime();
      if (t > maxT) return true;
    }
    return false;
  }
}
