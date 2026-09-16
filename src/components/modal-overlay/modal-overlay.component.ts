import { Component, ChangeDetectionStrategy, input, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-overlay',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div 
        class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop overflow-y-auto"
        (click)="onBackdropClick($event)">
        
        <div 
          class="relative bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh] transition-all transform animate-modal-card m-auto"
          [class.max-w-sm]="maxWidth() === 'sm'"
          [class.max-w-md]="maxWidth() === 'md'"
          [class.max-w-lg]="maxWidth() === 'lg'"
          [class.max-w-xl]="maxWidth() === 'xl'"
          [class.max-w-2xl]="maxWidth() === '2xl'"
          [class.max-w-3xl]="maxWidth() === '3xl'"
          [class.max-w-4xl]="maxWidth() === '4xl'"
          (click)="$event.stopPropagation()">
          
          <!-- Modal Header (Default or Custom Slot) -->
          @if (title() || hasHeaderSlot) {
            <div class="px-6 sm:px-7 py-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-100 dark:bg-base-200 shrink-0">
              <div class="flex items-center gap-3.5 min-w-0 pr-2">
                @if (icon()) {
                  <div class="w-10 h-10 rounded-xl bg-tenant-50 dark:bg-tenant-950/60 text-tenant-600 dark:text-tenant-400 border border-tenant-200/60 dark:border-tenant-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                    <span class="material-symbols-outlined text-xl">{{ icon() }}</span>
                  </div>
                }
                <div class="min-w-0">
                  <h3 class="text-base sm:text-lg font-bold text-text-primary tracking-tight leading-snug truncate">{{ title() }}</h3>
                  @if (subtitle()) {
                    <p class="text-xs text-text-secondary mt-0.5 leading-normal truncate">{{ subtitle() }}</p>
                  }
                </div>
              </div>

              @if (showCloseButton()) {
                <button 
                  type="button" 
                  (click)="close.emit()" 
                  class="w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 -mr-1"
                  title="Close dialog"
                  aria-label="Close dialog">
                  <span class="material-symbols-outlined text-xl">close</span>
                </button>
              }
            </div>
          }

          <!-- Header slot for specialized headers -->
          <ng-content select="[modal-header]"></ng-content>

          <!-- Modal Body Content -->
          <div class="p-6 sm:p-7 overflow-y-auto flex-1 sleek-scrollbar">
            <ng-content></ng-content>
          </div>

          <!-- Modal Footer Slot (optional) -->
          <ng-content select="[modal-footer]"></ng-content>

        </div>
      </div>
    }
  `
})
export class ModalOverlayComponent {
  isOpen = input<boolean>(true);
  title = input<string>('');
  subtitle = input<string>('');
  icon = input<string>('');
  maxWidth = input<'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'>('lg');
  showCloseButton = input<boolean>(true);
  closeOnBackdropClick = input<boolean>(true);

  close = output<void>();

  hasHeaderSlot = false;

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (this.closeOnBackdropClick()) {
      this.close.emit();
    }
  }
}
