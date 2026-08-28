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
            <div class="px-6 py-4.5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30">
              <div class="flex items-center gap-3">
                @if (icon()) {
                  <div class="w-10 h-10 rounded-2xl bg-tenant-500/10 dark:bg-tenant-400/20 text-tenant-600 dark:text-tenant-400 flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">{{ icon() }}</span>
                  </div>
                }
                <div>
                  <h3 class="text-base font-bold text-text-primary">{{ title() }}</h3>
                  @if (subtitle()) {
                    <p class="text-xs text-text-secondary mt-0.5">{{ subtitle() }}</p>
                  }
                </div>
              </div>

              @if (showCloseButton()) {
                <button 
                  type="button" 
                  (click)="close.emit()" 
                  class="w-8 h-8 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-300/50 transition-colors cursor-pointer"
                  title="Close dialog">
                  <span class="material-symbols-outlined text-lg">close</span>
                </button>
              }
            </div>
          }

          <!-- Header slot for specialized headers -->
          <ng-content select="[modal-header]"></ng-content>

          <!-- Modal Body Content -->
          <div class="p-6 overflow-y-auto flex-1 sleek-scrollbar">
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
