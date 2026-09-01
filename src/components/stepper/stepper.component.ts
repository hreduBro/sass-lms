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
    @if (orientation() === 'vertical') {
      <!-- ================================================================= -->
      <!-- VERTICAL ORIENTATION STEPPER (Unified Bold Typography Design)     -->
      <!-- ================================================================= -->
      <div 
        class="w-full flex flex-col"
        [ngClass]="containerClass()">
        
        @for (step of steps(); track step.id; let i = $index; let isLast = $last) {
          <div 
            [id]="'app-step-item-v-' + step.id"
            (click)="onStepClicked(step)"
            [class]="isClickable(step.id) ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'"
            class="group relative flex items-start gap-3.5 select-none"
            [attr.aria-current]="currentStep() === step.id ? 'step' : null">
            
            <!-- Left Column: Step Circle Indicator & Vertical Connector Line -->
            <div class="relative flex flex-col items-center shrink-0 self-stretch">
              
              <!-- Circular Step Badge -->
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all duration-300 select-none shrink-0"
                [ngClass]="{
                  'bg-tenant-500 text-white shadow-md shadow-tenant-500/30': getStepState(step.id) === 'current',
                  'bg-emerald-500 text-white shadow-xs': getStepState(step.id) === 'done',
                  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 group-hover:border-slate-300': getStepState(step.id) === 'disabled'
                }">
                @if (getStepState(step.id) === 'done') {
                  <span class="material-symbols-outlined text-lg text-white font-bold">check</span>
                } @else {
                  <span [class]="getStepState(step.id) === 'current' ? 'text-white font-bold' : 'text-slate-400 dark:text-slate-500 font-bold'">
                    {{ step.id }}
                  </span>
                }
              </div>

              <!-- Vertical Connecting Line to Next Step -->
              @if (!isLast) {
                <div 
                  class="w-[2.5px] my-2 flex-1 min-h-[28px] rounded-full transition-colors duration-300 pointer-events-none"
                  [ngClass]="isStepDone(step.id) ? 'bg-emerald-500/80' : 'bg-slate-200 dark:bg-slate-700'">
                </div>
              }
            </div>

            <!-- Right Column: Step Title & Subtitle / Deferrable Indicator -->
            <div class="flex-1 min-w-0 pt-1.5 pb-2">
              <div class="flex items-center justify-between gap-1.5 flex-wrap">
                <div 
                  class="text-sm tracking-tight truncate transition-colors leading-tight"
                  [ngClass]="{
                    'text-tenant-500 dark:text-tenant-400 font-extrabold': getStepState(step.id) === 'current',
                    'text-emerald-600 dark:text-emerald-400 font-bold': getStepState(step.id) === 'done',
                    'text-slate-700 dark:text-slate-200 font-bold group-hover:text-text-primary': getStepState(step.id) === 'disabled'
                  }">
                  {{ step.shortTitle || step.title }}
                </div>

                @if (step.isDeferrable) {
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                    Optional
                  </span>
                }
              </div>

              @if (step.sublabel) {
                <div 
                  class="text-xs font-medium truncate mt-0.5 leading-normal transition-colors"
                  [ngClass]="{
                    'text-slate-500 dark:text-slate-400': getStepState(step.id) === 'current' || getStepState(step.id) === 'done',
                    'text-slate-400 dark:text-slate-500': getStepState(step.id) === 'disabled'
                  }">
                  {{ step.sublabel }}
                </div>
              }
            </div>

          </div>
        }
      </div>

    } @else {
      <!-- ================================================================= -->
      <!-- HORIZONTAL ORIENTATION STEPPER (Reference Pill Capsule Design)    -->
      <!-- ================================================================= -->
      <div class="relative group/stepper w-full">
        <!-- Left Gradient Edge Fade & Scroll Button -->
        @if (canScrollLeft()) {
          <div class="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-base-100 via-base-100/90 dark:from-slate-900 dark:via-slate-900/90 to-transparent rounded-l-full pointer-events-none z-10 transition-opacity duration-200"></div>
          <button 
            type="button"
            (click)="scrollStepper('left')" 
            aria-label="Scroll steps left"
            class="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-base-100/95 dark:bg-slate-800/95 border border-base-300 dark:border-slate-700 shadow-md hover:shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-base">chevron_left</span>
          </button>
        }

        <!-- Right Gradient Edge Fade & Scroll Button -->
        @if (canScrollRight()) {
          <div class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-base-100 via-base-100/90 dark:from-slate-900 dark:via-slate-900/90 to-transparent rounded-r-full pointer-events-none z-10 transition-opacity duration-200"></div>
          <button 
            type="button"
            (click)="scrollStepper('right')" 
            aria-label="Scroll steps right"
            class="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-base-100/95 dark:bg-slate-800/95 border border-base-300 dark:border-slate-700 shadow-md hover:shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-base">chevron_right</span>
          </button>
        }

        <!-- Stepper Main Horizontal Pill Track -->
        <div 
          #scrollContainer
          (scroll)="updateScrollState()"
          (wheel)="onWheel($event)"
          class="py-3.5 sm:py-4 px-5 sm:px-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto scroll-smooth no-scrollbar"
          [ngClass]="containerClass()">
          
          <div 
            class="flex items-center min-w-max px-1 sm:px-2 gap-3 sm:gap-4"
            [ngClass]="steps().length <= 4 ? 'justify-between sm:justify-around w-full' : 'justify-between'">
            
            @for (step of steps(); track step.id; let i = $index) {
              <!-- Step Item -->
              <div 
                [id]="'app-step-item-' + step.id"
                (click)="onStepClicked(step)"
                [class]="isClickable(step.id) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'"
                class="flex items-center gap-3 group shrink-0 transition-all duration-200 select-none"
                [attr.aria-current]="currentStep() === step.id ? 'step' : null">
                
                <!-- Circular Step Badge (Matching User Reference Image) -->
                <div 
                  class="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-300 select-none shrink-0"
                  [ngClass]="{
                    'bg-tenant-500 text-white shadow-md shadow-tenant-500/30 ring-0': getStepState(step.id) === 'current',
                    'bg-emerald-500 text-white shadow-xs': getStepState(step.id) === 'done',
                    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 group-hover:border-slate-300 dark:group-hover:border-slate-600': getStepState(step.id) === 'disabled'
                  }">
                  @if (getStepState(step.id) === 'done') {
                    <span class="material-symbols-outlined text-base sm:text-lg text-white font-bold">check</span>
                  } @else {
                    <span [class]="getStepState(step.id) === 'current' ? 'text-white font-bold' : 'text-slate-400 dark:text-slate-500 font-bold'">
                      {{ step.id }}
                    </span>
                  }
                </div>

                <!-- Step Labels (Title & Subtitle matching User Reference Image) -->
                <div class="flex flex-col justify-center">
                  <div 
                    class="text-xs sm:text-sm whitespace-nowrap transition-colors leading-tight" 
                    [ngClass]="{
                      'text-tenant-500 dark:text-tenant-400 font-extrabold': getStepState(step.id) === 'current',
                      'text-emerald-600 dark:text-emerald-400 font-bold': getStepState(step.id) === 'done',
                      'text-slate-600 dark:text-slate-300 font-bold group-hover:text-text-primary': getStepState(step.id) === 'disabled'
                    }">
                    {{ step.shortTitle || step.title }}
                  </div>
                  @if (step.sublabel) {
                    <div class="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-normal whitespace-nowrap leading-tight mt-0.5">
                      {{ step.sublabel }}
                    </div>
                  }
                </div>
              </div>

              <!-- Inter-Step Connector (Horizontal Rounded Pill Bar) -->
              @if (i < steps().length - 1) {
                <div 
                  class="rounded-full shrink-0 transition-colors duration-300"
                  [ngClass]="[
                    steps().length <= 4 ? 'flex-1 min-w-[32px] sm:min-w-[56px] max-w-[140px] h-2' : 'w-6 sm:w-10 h-1.5',
                    isStepDone(step.id) ? 'bg-emerald-500/80' : 'bg-slate-100 dark:bg-slate-800'
                  ]">
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `
})
export class StepperComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainerRef?: ElementRef<HTMLDivElement>;

  // Inputs
  orientation = input<'horizontal' | 'vertical'>('horizontal');
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
      // Horizontal mode scroll
      const container = this.scrollContainerRef?.nativeElement;
      const stepElH = document.getElementById('app-step-item-' + stepId);
      if (container && stepElH) {
        const containerRect = container.getBoundingClientRect();
        const stepRect = stepElH.getBoundingClientRect();
        const targetScroll = container.scrollLeft + (stepRect.left - containerRect.left) - (containerRect.width / 2) + (stepRect.width / 2);
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
      this.updateScrollState();

      // Vertical mode smooth auto-scroll into view if inside a scrollable container
      const stepElV = document.getElementById('app-step-item-v-' + stepId);
      if (stepElV) {
        stepElV.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
  }
}
