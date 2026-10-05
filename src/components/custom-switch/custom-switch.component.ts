import { Component, input, output, forwardRef, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-switch, custom-switch',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSwitchComponent),
      multi: true
    }
  ],
  template: `
    <div 
      class="inline-flex items-center gap-2.5 select-none"
      [class.opacity-50]="disabled()"
      [class.cursor-not-allowed]="disabled()">
      
      <!-- Toggle Button (Track & Thumb) -->
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="isChecked()"
        [attr.aria-label]="label() || ariaLabel() || 'Toggle switch'"
        [disabled]="disabled()"
        (click)="toggle()"
        [class]="trackClasses()"
        class="relative inline-flex items-center shrink-0 rounded-full transition-all duration-200 ease-in-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-tenant-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed shadow-2xs">
        
        <!-- Thumb / Knob -->
        <span 
          [class]="thumbClasses()"
          class="inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out pointer-events-none">
        </span>
      </button>

      <!-- Status Label (Optional) -->
      @if (showStatusLabel()) {
        <span class="text-xs font-bold font-mono tracking-tight whitespace-nowrap"
          [ngClass]="isChecked() ? (variant() === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-tenant-600 dark:text-tenant-400') : 'text-text-secondary'">
          {{ isChecked() ? (onLabel() || 'Enabled') : (offLabel() || 'Disabled') }}
        </span>
      }
    </div>
  `
})
export class CustomSwitchComponent implements ControlValueAccessor {
  // Inputs
  checked = input<boolean>(false);
  disabled = input<boolean>(false);
  label = input<string>('');
  ariaLabel = input<string>('');
  onLabel = input<string>('Enabled');
  offLabel = input<string>('Disabled');
  showStatusLabel = input<boolean>(true);
  size = input<'sm' | 'md' | 'lg'>('md');
  variant = input<'tenant' | 'emerald'>('emerald');

  // Outputs
  checkedChange = output<boolean>();

  // Internal state
  private internalChecked = signal<boolean>(false);
  private isControlledByForm = signal<boolean>(false);

  // Effective checked value
  isChecked = computed(() => {
    if (this.isControlledByForm()) {
      return this.internalChecked();
    }
    return this.checked();
  });

  // Track styling
  trackClasses = computed(() => {
    const checked = this.isChecked();
    const size = this.size();
    const variant = this.variant();

    let sizeClasses = 'w-11 h-6 p-0.5'; // md default
    if (size === 'sm') sizeClasses = 'w-8 h-4.5 p-0.5';
    if (size === 'lg') sizeClasses = 'w-14 h-7.5 p-1';

    let colorClasses = '';
    if (checked) {
      if (variant === 'tenant') {
        colorClasses = 'bg-tenant-500 dark:bg-tenant-500 shadow-tenant-500/20';
      } else {
        colorClasses = 'bg-emerald-500 dark:bg-emerald-500 shadow-emerald-500/20';
      }
    } else {
      colorClasses = 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400/80 dark:hover:bg-slate-600';
    }

    return `${sizeClasses} ${colorClasses}`;
  });

  // Thumb styling
  thumbClasses = computed(() => {
    const checked = this.isChecked();
    const size = this.size();

    if (size === 'sm') {
      return checked ? 'w-3.5 h-3.5 translate-x-3.5' : 'w-3.5 h-3.5 translate-x-0';
    }
    if (size === 'lg') {
      return checked ? 'w-5.5 h-5.5 translate-x-6.5' : 'w-5.5 h-5.5 translate-x-0';
    }
    // md default
    return checked ? 'w-5 h-5 translate-x-5' : 'w-5 h-5 translate-x-0';
  });

  // Form Control callbacks
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle() {
    if (this.disabled()) return;
    const newVal = !this.isChecked();
    this.internalChecked.set(newVal);
    this.onChange(newVal);
    this.onTouched();
    this.checkedChange.emit(newVal);
  }

  // CVA Implementation
  writeValue(value: any): void {
    this.isControlledByForm.set(true);
    this.internalChecked.set(Boolean(value));
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Disabled is handled via input or forms
  }
}
