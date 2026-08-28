import { 
  Component, 
  input, 
  output, 
  signal, 
  computed, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnDestroy,
  effect 
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StepperStep {
  id: number;
  key?: string;
  title?: string;
  shortTitle: string;
  sublabel?: string;
  icon?: string;
  isDeferrable?: boolean;
  disabled?: boolean;
}

// Backwards compatibility alias
export type StepItem = StepperStep;

@Component({
  selector: 'app-stepper',
  imports: [CommonModule],
  host: {
    class: 'block w-full'
  },
  template: `
    <div class="relative group/stepper w-full">
      <!-- Left Gradient Edge Fade & Scroll Button -->
      @if (canScrollLeft()) {
        <div class="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-base-100 via-base-100/90 dark:from-slate-900 dark:via-slate-900/90 to-transparent rounded-l-2xl sm:rounded-l-full pointer-events-none z-10 transition-opacity duration-200"></div>
        <button 
          type="button"
          (click)="scrollStepper('left')" 
          aria-label="Scroll steps left"
          class="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-base-100/95 dark:bg-slate-800/95 border border-base-300 dark:border-slate-700 shadow-md hover:shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer">
          <span class="material-symbols-outlined text-base">chevron_left</span>
        </button>
      }

      <!-- Right Gradient Edge Fade & Scroll Button -->
      @if (canScrollRight()) {
        <div class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-base-100 via-base-100/90 dark:from-slate-900 dark:via-slate-900/90 to-transparent rounded-r-2xl sm:rounded-r-full pointer-events-none z-10 transition-opacity duration-200"></div>
        <button 
          type="button"
          (click)="scrollStepper('right')" 
          aria-label="Scroll steps right"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-base-100/95 dark:bg-slate-800/95 border border-base-300 dark:border-slate-700 shadow-md hover:shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer">
          <span class="material-symbols-outlined text-base">chevron_right</span>
        </button>
      }

      <!-- Stepper Main Horizontal Scroll Track -->
      <div 
        #scrollContainer
        (scroll)="updateScrollState()"
        (wheel)="onWheel($event)"
        class="py-3 px-4 sm:px-7 rounded-2xl sm:rounded-full bg-base-100/95 dark:bg-slate-900/95 backdrop-blur-md border border-base-300 dark:border-slate-800 shadow-sm overflow-x-auto scroll-smooth no-scrollbar"
        [ngClass]="containerClass()">
        
        <div 
          class="flex items-center min-w-max px-1 sm:px-3 gap-2 sm:gap-3.5"
          [ngClass]="steps().length <= 4 ? 'justify-between sm:justify-around w-full' : 'justify-between'">
          
          @for (step of steps(); track step.id; let i = $index) {
            <!-- Step Item -->
            <div 
              [id]="'app-step-item-' + step.id"
              (click)="onStepClicked(step)"
              [class]="isClickable(step.id) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'"
              class="flex items-center gap-2.5 group shrink-0 transition-transform duration-200 select-none"
              [class.scale-105]="currentStep() === step.id"
              [attr.aria-current]="currentStep() === step.id ? 'step' : null">
              
              <!-- Step Badge Indicator -->
              <div 
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-extrabold text-xs sm:text-sm transition-all duration-300 select-none"
                [ngClass]="{
                  'bg-tenant-500 text-white shadow-md shadow-tenant-500/30 ring-4 ring-tenant-500/20': getStepState(step.id) === 'current',
                  'bg-emerald-500 text-white shadow-xs': getStepState(step.id) === 'done',
                  'bg-base-200/80 dark:bg-slate-800/80 border border-base-300 dark:border-slate-700 text-text-secondary dark:text-slate-400 group-hover:border-base-400': getStepState(step.id) === 'disabled'
                }">
                @if (getStepState(step.id) === 'done') {
                  <span class="material-symbols-outlined text-base sm:text-lg text-white font-bold">check</span>
                } @else {
                  <span [class]="getStepState(step.id) === 'current' ? 'text-white font-black' : 'text-text-secondary dark:text-slate-400 font-bold'">
                    {{ step.id }}
                  </span>
                }
              </div>

              <!-- Step Labels -->
              <div>
                <div 
                  class="text-xs font-bold whitespace-nowrap transition-colors" 
                  [ngClass]="{
                    'text-tenant-600 dark:text-tenant-400 font-extrabold': getStepState(step.id) === 'current',
                    'text-emerald-600 dark:text-emerald-400': getStepState(step.id) === 'done',
                    'text-text-primary group-hover:text-text-primary': getStepState(step.id) === 'disabled'
                  }">
                  {{ step.shortTitle || step.title }}
                </div>
                @if (step.sublabel) {
                  <div class="text-[10px] text-text-secondary whitespace-nowrap">
                    {{ step.sublabel }}
                  </div>
                }
              </div>
            </div>

            <!-- Inter-Step Connector -->
            @if (i < steps().length - 1) {
              <div 
                class="rounded-full shrink-0 transition-colors duration-300"
                [ngClass]="[
                  steps().length <= 4 ? 'flex-1 min-w-[24px] sm:min-w-[48px] max-w-[120px] h-1 sm:h-1.5' : 'w-4 sm:w-6 h-1',
                  isStepDone(step.id) ? 'bg-emerald-500' : 'bg-base-300 dark:bg-slate-800'
                ]">
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class StepperComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainerRef?: ElementRef<HTMLDivElement>;

  // Inputs
  steps = input<StepperStep[]>([]);
  currentStep = input<number>(1);
  completedSteps = input<Set<number> | number[]>(new Set<number>());
  isStepClickable = input<((stepId: number) => boolean) | null>(null);
  allowDirectNavigation = input<boolean>(true);
  containerClass = input<string>('');

  // Outputs
  stepChange = output<number>();
  stepClick = output<StepperStep>();

  // State Signals
  canScrollLeft = signal<boolean>(false);
  canScrollRight = signal<boolean>(false);

  private resizeObserver?: ResizeObserver;

  // Normalized Completed Set computed signal
  completedSet = computed<Set<number>>(() => {
    const val = this.completedSteps();
    if (val instanceof Set) {
      return val;
    }
    if (Array.isArray(val)) {
      return new Set(val);
    }
    return new Set<number>();
  });

  constructor() {
    // Automatically center active step into view when currentStep changes
    effect(() => {
      const stepId = this.currentStep();
      if (stepId) {
        this.scrollToActiveStep(stepId);
      }
    });
  }

  ngAfterViewInit() {
    this.updateScrollState();
    
    // Listen for container resize
    if (this.scrollContainerRef?.nativeElement && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateScrollState();
      });
      this.resizeObserver.observe(this.scrollContainerRef.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  getStepState(stepId: number): 'current' | 'done' | 'disabled' {
    if (this.currentStep() === stepId) return 'current';
    if (this.isStepDone(stepId)) return 'done';
    return 'disabled';
  }

  isStepDone(stepId: number): boolean {
    return this.completedSet().has(stepId);
  }

  isClickable(stepId: number): boolean {
    if (!this.allowDirectNavigation()) return false;
    
    const customValidator = this.isStepClickable();
    if (customValidator) {
      return customValidator(stepId);
    }

    // Default fallback logic:
    // 1. Current step is clickable
    if (stepId === this.currentStep()) return true;
    // 2. Any completed step is clickable
    if (this.completedSet().has(stepId)) return true;
    // 3. Step 1 is always accessible
    if (stepId === 1) return true;
    // 4. If previous step is completed, this step is accessible
    if (this.completedSet().has(stepId - 1)) return true;

    return false;
  }

  onStepClicked(step: StepperStep) {
    if (this.isClickable(step.id)) {
      this.stepClick.emit(step);
      this.stepChange.emit(step.id);
    }
  }

  updateScrollState() {
    const el = this.scrollContainerRef?.nativeElement;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    this.canScrollLeft.set(scrollLeft > 6);
    this.canScrollRight.set(scrollLeft + clientWidth < scrollWidth - 6);
  }

  scrollStepper(direction: 'left' | 'right', amount = 260) {
    const el = this.scrollContainerRef?.nativeElement;
    if (!el) return;
    const delta = direction === 'left' ? -amount : amount;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(() => this.updateScrollState(), 200);
  }

  onWheel(event: WheelEvent) {
    const el = this.scrollContainerRef?.nativeElement;
    if (!el) return;
    if (event.deltaY !== 0 && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      if (el.scrollWidth > el.clientWidth) {
        event.preventDefault();
        el.scrollLeft += event.deltaY * 0.8;
        this.updateScrollState();
      }
    }
  }

  scrollToActiveStep(stepId: number) {
    setTimeout(() => {
      const container = this.scrollContainerRef?.nativeElement;
      const stepEl = document.getElementById('app-step-item-' + stepId);
      if (container && stepEl) {
        const containerRect = container.getBoundingClientRect();
        const stepRect = stepEl.getBoundingClientRect();
        const targetScroll = container.scrollLeft + (stepRect.left - containerRect.left) - (containerRect.width / 2) + (stepRect.width / 2);
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
      this.updateScrollState();
    }, 60);
  }
}
