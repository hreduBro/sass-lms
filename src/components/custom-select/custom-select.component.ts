import { Component, input, output, signal, computed, ElementRef, HostListener, inject, forwardRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  sublabel?: string;
  icon?: string;
  badge?: string;
  badgeClass?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-custom-select',
  imports: [CommonModule, FormsModule],
  host: {
    class: 'block w-full relative',
    '[class.z-[100]]': 'isOpen()',
    '[class.z-10]': '!isOpen()'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative w-full text-left custom-select-root" [class.z-[100]]="isOpen()" [class.opacity-60]="disabled()">
      @if (label()) {
        <label class="block text-xs font-semibold text-text-primary mb-1">
          {{ label() }}
          @if (required()) {
            <span class="text-rose-500">*</span>
          }
          @if (hint()) {
            <span class="text-[10px] text-text-secondary font-normal ml-1">{{ hint() }}</span>
          }
        </label>
      }

      <!-- Select Trigger Button (matches standard input sizing, border and bg) -->
      <button
        #triggerBtn
        type="button"
        (click)="toggleOpen()"
        (keydown)="onKeydown($event)"
        [disabled]="disabled()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'listbox'"
        class="w-full flex items-center justify-between gap-2 rounded-xl text-xs transition-all duration-200 cursor-pointer select-none text-left box-border font-medium overflow-hidden"
        [ngClass]="[
          isOpen() 
            ? 'border-tenant-500 ring-2 ring-tenant-500/20 bg-base-100 dark:bg-base-200 shadow-sm' 
            : 'bg-base-200 hover:bg-base-100 hover:border-slate-400 dark:hover:border-slate-600',
          error() ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' : 'border border-base-300',
          sizeClass(),
          customTriggerClass()
        ]">
        
        <div class="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          @if (leadingIcon()) {
            <span class="material-symbols-outlined text-[16px] leading-none text-text-secondary shrink-0 w-4 h-4 flex items-center justify-center">
              {{ leadingIcon() }}
            </span>
          } @else if (!multiple() && selectedOption()?.icon) {
            <span class="material-symbols-outlined text-[16px] leading-none text-text-secondary shrink-0 w-4 h-4 flex items-center justify-center">
              {{ selectedOption()?.icon }}
            </span>
          }

          <div class="truncate flex-1 leading-4">
            @if (multiple()) {
              @if (selectedOptions().length > 0) {
                <div class="flex items-center gap-1 flex-wrap overflow-hidden py-0.5">
                  @for (opt of selectedOptions(); track opt.value; let idx = $index) {
                    @if (idx < maxDisplayTags()) {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-tenant-50 dark:bg-tenant-950/60 text-tenant-700 dark:text-tenant-300 border border-tenant-200 dark:border-tenant-800/60 shrink-0">
                        <span class="truncate max-w-[120px]">{{ opt.label }}</span>
                        <span
                          role="button"
                          tabindex="0"
                          (click)="removeOption(opt, $event)"
                          title="Remove"
                          class="hover:text-rose-500 rounded-xs flex items-center justify-center cursor-pointer">
                          <span class="material-symbols-outlined text-[12px] leading-none">close</span>
                        </span>
                      </span>
                    }
                  }
                  @if (selectedOptions().length > maxDisplayTags()) {
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                      +{{ selectedOptions().length - maxDisplayTags() }} more
                    </span>
                  }
                </div>
              } @else {
                <span class="text-text-secondary text-xs leading-4 truncate">{{ placeholder() }}</span>
              }
            } @else {
              @if (selectedOption()) {
                <div class="flex items-center gap-1.5 truncate">
                  <span class="font-medium text-text-primary truncate text-xs leading-4">{{ selectedOption()?.label }}</span>
                  @if (selectedOption()?.badge) {
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold font-mono shrink-0" [ngClass]="selectedOption()?.badgeClass || 'bg-tenant-500/10 text-tenant-600 dark:text-tenant-400'">
                      {{ selectedOption()?.badge }}
                    </span>
                  }
                </div>
              } @else {
                <span class="text-text-secondary text-xs leading-4 truncate">{{ placeholder() }}</span>
              }
            }
          </div>
        </div>

        <!-- Action Icons (Clear / Cross button & Expand Chevron) -->
        <div class="flex items-center gap-1 shrink-0">
          @if (clearable() && hasSelectedValue() && !disabled()) {
            <span
              role="button"
              tabindex="0"
              (click)="clearValue($event)"
              (keydown.enter)="clearValue($event)"
              (keydown.space)="clearValue($event)"
              title="Clear selection"
              aria-label="Clear selection"
              class="w-5 h-5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-text-secondary hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center justify-center cursor-pointer">
              <span class="material-symbols-outlined text-[15px] leading-none">close</span>
            </span>
          }

          <!-- Chevron Icon -->
          <span 
            class="material-symbols-outlined text-[18px] leading-none text-text-secondary transition-transform duration-200 w-4 h-4 flex items-center justify-center pointer-events-none"
            [class.rotate-180]="isOpen()"
            [class.text-tenant-500]="isOpen()">
            expand_more
          </span>
        </div>
      </button>

      <!-- Dropdown Popover Menu -->
      @if (isOpen()) {
        <div 
          class="absolute z-[999] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-dropdown flex flex-col backdrop-blur-xl"
          [ngClass]="[
            actualPlacement() === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            dropdownAlign() === 'right' ? 'right-0' : 'left-0',
            'w-full min-w-[240px] max-w-[calc(100vw-2rem)]',
            customDropdownClass()
          ]"
          role="listbox">
          
          <!-- Search Bar & Multi Actions -->
          @if (shouldShowSearch() || multiple()) {
            <div class="p-2.5 border-b border-base-300 bg-base-200/50 dark:bg-slate-800/50 space-y-2">
              @if (shouldShowSearch()) {
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-2.5 top-2 text-text-secondary text-sm">search</span>
                  <input 
                    #searchInput
                    type="text"
                    [ngModel]="searchQuery()"
                    (ngModelChange)="searchQuery.set($event)"
                    placeholder="Search..."
                    (click)="$event.stopPropagation()"
                    (keydown)="onSearchKeydown($event)"
                    class="w-full pl-8 pr-7 py-1.5 rounded-lg bg-base-100 dark:bg-slate-800 border border-base-300 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:border-tenant-500 focus:ring-1 focus:ring-tenant-500/20" />
                  @if (searchQuery()) {
                    <button 
                      type="button" 
                      (click)="searchQuery.set(''); $event.stopPropagation()"
                      class="absolute right-2.5 top-2 text-text-secondary hover:text-text-primary text-xs cursor-pointer">
                      ✕
                    </button>
                  }
                </div>
              }

              @if (multiple()) {
                <div class="flex items-center justify-between text-[11px] px-1 font-semibold">
                  <span class="text-text-secondary">
                    {{ selectedOptions().length }} of {{ normalizedOptions().length }} selected
                  </span>
                  <div class="flex items-center gap-3">
                    <button 
                      type="button"
                      (click)="selectAllOptions($event)"
                      class="text-tenant-600 dark:text-tenant-400 hover:underline cursor-pointer">
                      Select All
                    </button>
                    <button 
                      type="button"
                      (click)="clearValue($event)"
                      class="text-text-secondary hover:text-rose-500 cursor-pointer">
                      Clear
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Options List with Custom Smooth Scrollbar -->
          <div class="overflow-y-auto p-1.5 space-y-1 max-h-52 flex-1 custom-select-scrollbar">
            @if (normalizedFilteredOptions().length === 0) {
              <div class="px-3 py-4 text-center text-xs text-text-secondary">
                No matching options found
              </div>
            } @else {
              @for (opt of normalizedFilteredOptions(); track opt.value; let idx = $index) {
                <button
                  type="button"
                  (click)="selectOption(opt)"
                  [disabled]="opt.disabled"
                  role="option"
                  [attr.aria-selected]="isSelected(opt)"
                  class="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer group"
                  [ngClass]="[
                    isSelected(opt) 
                      ? 'bg-tenant-50 dark:bg-tenant-500/20 text-tenant-600 dark:text-tenant-300 font-semibold' 
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
                    highlightedIndex() === idx ? 'ring-1 ring-tenant-500/30' : '',
                    opt.disabled ? 'opacity-40 cursor-not-allowed' : ''
                  ]">
                  
                  <div class="flex items-center gap-2.5 truncate flex-1 mr-2">
                    @if (multiple()) {
                      <div 
                        class="w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0"
                        [ngClass]="isSelected(opt) ? 'bg-tenant-500 border-tenant-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'">
                        @if (isSelected(opt)) {
                          <span class="material-symbols-outlined text-[13px] font-black leading-none text-white">check</span>
                        }
                      </div>
                    } @else if (opt.icon) {
                      <span class="material-symbols-outlined text-sm shrink-0" [class.text-tenant-500]="isSelected(opt)">
                        {{ opt.icon }}
                      </span>
                    }
                    
                    <div class="truncate">
                      <div class="truncate">{{ opt.label }}</div>
                      @if (opt.sublabel) {
                        <div class="text-[10px] text-text-secondary truncate">{{ opt.sublabel }}</div>
                      }
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    @if (opt.badge) {
                      <span class="text-[10px] px-2 py-0.5 rounded font-semibold font-mono" [ngClass]="opt.badgeClass || 'bg-base-300 text-text-secondary'">
                        {{ opt.badge }}
                      </span>
                    }
                    @if (!multiple() && isSelected(opt)) {
                      <span class="material-symbols-outlined text-base text-tenant-500 font-bold">check</span>
                    }
                  </div>
                </button>
              }
            }
          </div>
        </div>
      }

      @if (error()) {
        <p class="text-[11px] text-rose-500 mt-1">{{ error() }}</p>
      }
    </div>
  `,
  styles: [`
    .custom-select-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-select-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-select-scrollbar::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 9999px;
    }
    :host-context(.dark) .custom-select-scrollbar::-webkit-scrollbar-thumb {
      background-color: #475569;
    }
    .custom-select-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #94a3b8;
    }
    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .animate-dropdown {
      animation: dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class CustomSelectComponent implements ControlValueAccessor {
  private elementRef = inject(ElementRef);

  @ViewChild('triggerBtn') triggerBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  // Inputs
  label = input<string>('');
  hint = input<string>('');
  placeholder = input<string>('Select an option...');
  options = input<any[]>([]); // Supports string[], SelectOption[], { display, stored }[], { label, value }[]
  searchable = input<boolean | null>(null);
  clearable = input<boolean>(true);
  multiple = input<boolean>(false);
  maxDisplayTags = input<number>(3);
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  leadingIcon = input<string>('');
  error = input<string>('');
  size = input<'sm' | 'md' | 'lg'>('md');
  dropdownAlign = input<'left' | 'right' | 'auto'>('auto');
  dropdownPosition = input<'auto' | 'top' | 'bottom'>('auto');
  customTriggerClass = input<string>('');
  customDropdownClass = input<string>('');

  // Outputs
  valueChange = output<any>();
  selectionChange = output<SelectOption | null>();

  // State
  isOpen = signal<boolean>(false);
  actualPlacement = signal<'top' | 'bottom'>('bottom');
  selectedValue = signal<any>(null);
  searchQuery = signal<string>('');
  highlightedIndex = signal<number>(-1);

  // Normalized options
  normalizedOptions = computed<SelectOption[]>(() => {
    const raw = this.options() || [];
    return raw.map(item => {
      if (typeof item === 'string' || typeof item === 'number') {
        return { value: item, label: String(item) };
      }
      if (item && typeof item === 'object') {
        if ('stored' in item && 'display' in item) {
          return { value: item.stored, label: item.display };
        }
        if ('value' in item && 'display' in item) {
          return { value: item.value, label: item.display };
        }
        if ('value' in item && 'label' in item) {
          return {
            value: item.value,
            label: item.label,
            sublabel: item.sublabel,
            icon: item.icon,
            badge: item.badge,
            badgeClass: item.badgeClass,
            disabled: item.disabled
          };
        }
        if ('id' in item && 'name' in item) {
          return { value: item.id, label: item.name };
        }
        if ('value' in item && 'name' in item) {
          return { value: item.value, label: item.name };
        }
        if ('key' in item && 'label' in item) {
          return { value: item.key, label: item.label };
        }
      }
      return { value: item, label: String(item) };
    });
  });

  shouldShowSearch = computed(() => {
    if (this.searchable() !== null) {
      return !!this.searchable();
    }
    return this.normalizedOptions().length > 7;
  });

  sizeClass = computed(() => {
    if (this.multiple() && this.selectedOptions().length > 0) {
      return 'min-h-[38px] py-1.5 px-3 text-xs leading-4';
    }
    switch (this.size()) {
      case 'sm': return 'h-[34px] min-h-[34px] max-h-[34px] py-1.5 px-3 text-xs leading-4';
      case 'lg': return 'h-[44px] min-h-[44px] max-h-[44px] py-3 px-4 text-sm leading-5';
      default: return 'h-[38px] min-h-[38px] max-h-[38px] py-2.5 px-3.5 text-xs leading-4';
    }
  });

  selectedOption = computed(() => {
    const val = this.selectedValue();
    if (val === null || val === undefined || val === '') return null;
    if (this.multiple()) {
      if (Array.isArray(val) && val.length > 0) {
        return this.normalizedOptions().find(o => o.value === val[0]) || null;
      }
      return null;
    }
    return this.normalizedOptions().find(o => o.value === val) || null;
  });

  selectedOptions = computed<SelectOption[]>(() => {
    const val = this.selectedValue();
    const opts = this.normalizedOptions();
    if (this.multiple()) {
      if (!Array.isArray(val)) return [];
      return opts.filter(o => val.includes(o.value));
    }
    if (val === null || val === undefined || val === '') return [];
    const found = opts.find(o => o.value === val);
    return found ? [found] : [];
  });

  hasSelectedValue = computed(() => {
    const val = this.selectedValue();
    if (this.multiple()) {
      return Array.isArray(val) && val.length > 0;
    }
    return val !== null && val !== undefined && val !== '';
  });

  normalizedFilteredOptions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const opts = this.normalizedOptions();
    if (!q) return opts;
    return opts.filter(o => 
      (o.label && o.label.toLowerCase().includes(q)) || 
      (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  });

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.triggerBtn?.nativeElement.focus();
    }
  }

  toggleOpen() {
    if (this.disabled()) return;
    const willOpen = !this.isOpen();
    
    if (willOpen) {
      if (this.dropdownPosition() === 'top') {
        this.actualPlacement.set('top');
      } else if (this.dropdownPosition() === 'bottom') {
        this.actualPlacement.set('bottom');
      } else {
        // 'auto' positioning based on viewport space
        try {
          const rect = this.elementRef.nativeElement.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          // If less than 240px space below and more space above, flip to top
          if (spaceBelow < 240 && spaceAbove > spaceBelow) {
            this.actualPlacement.set('top');
          } else {
            this.actualPlacement.set('bottom');
          }
        } catch (e) {
          this.actualPlacement.set('bottom');
        }
      }
      
      this.searchQuery.set('');
      this.highlightedIndex.set(-1);
      this.isOpen.set(true);
      setTimeout(() => {
        if (this.shouldShowSearch()) {
          this.searchInput?.nativeElement.focus();
        }
      }, 50);
    } else {
      this.isOpen.set(false);
      this.onTouched();
    }
  }

  selectOption(option: SelectOption) {
    if (option.disabled) return;
    if (this.multiple()) {
      const current = Array.isArray(this.selectedValue()) ? [...this.selectedValue()] : [];
      const index = current.indexOf(option.value);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(option.value);
      }
      this.selectedValue.set(current);
      this.onChange(current);
      this.valueChange.emit(current);
      this.selectionChange.emit(option);
      this.onTouched();
    } else {
      this.selectedValue.set(option.value);
      this.onChange(option.value);
      this.valueChange.emit(option.value);
      this.selectionChange.emit(option);
      this.isOpen.set(false);
      this.onTouched();
      this.triggerBtn?.nativeElement.focus();
    }
  }

  removeOption(option: SelectOption, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.disabled()) return;
    const current = Array.isArray(this.selectedValue()) ? [...this.selectedValue()] : [];
    const index = current.indexOf(option.value);
    if (index > -1) {
      current.splice(index, 1);
      this.selectedValue.set(current);
      this.onChange(current);
      this.valueChange.emit(current);
      this.onTouched();
    }
  }

  selectAllOptions(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.disabled()) return;
    const allVals = this.normalizedOptions().filter(o => !o.disabled).map(o => o.value);
    this.selectedValue.set(allVals);
    this.onChange(allVals);
    this.valueChange.emit(allVals);
    this.onTouched();
  }

  clearValue(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.disabled()) return;
    const nextVal = this.multiple() ? [] : null;
    this.selectedValue.set(nextVal);
    this.onChange(nextVal);
    this.valueChange.emit(nextVal);
    this.selectionChange.emit(null);
    this.onTouched();
  }

  isSelected(option: SelectOption): boolean {
    const val = this.selectedValue();
    if (this.multiple()) {
      return Array.isArray(val) && val.includes(option.value);
    }
    return val === option.value;
  }

  onKeydown(event: KeyboardEvent) {
    if (this.disabled()) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      if (!this.isOpen()) {
        event.preventDefault();
        this.toggleOpen();
      }
    }
  }

  onSearchKeydown(event: KeyboardEvent) {
    const list = this.normalizedFilteredOptions();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex.update(i => (i + 1) % list.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.update(i => (i - 1 + list.length) % list.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.highlightedIndex();
      if (idx >= 0 && idx < list.length) {
        this.selectOption(list[idx]);
      }
    }
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    if (this.multiple()) {
      this.selectedValue.set(Array.isArray(value) ? value : value ? [value] : []);
    } else {
      this.selectedValue.set(value);
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Handled via input or signal
  }
}
