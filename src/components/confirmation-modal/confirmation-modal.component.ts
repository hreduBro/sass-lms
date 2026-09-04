import { Component, ChangeDetectionStrategy, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalService } from '../../services/confirmation-modal.service';

@Component({
  selector: 'app-confirmation-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (modalService.isOpen() && modalService.state(); as s) {
      <div 
        id="global-confirmation-modal-backdrop"
        class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 animate-modal-backdrop overflow-y-auto"
        (click)="onBackdropClick($event)">
        
        <div 
          id="global-confirmation-modal-card"
          class="relative bg-base-100 dark:bg-slate-900 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-[420px] p-6 sm:p-7 text-center space-y-4 animate-modal-card m-auto"
          [class.animate-shake]="isShaking()"
          (click)="$event.stopPropagation()">

          <!-- Optional Top-Right Cross Button -->
          @if (s.showCloseButton !== false) {
            <button 
              id="btn-confirmation-modal-close"
              type="button" 
              (click)="modalService.triggerCancel()"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-base-200/80 hover:bg-base-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-secondary hover:text-text-primary flex items-center justify-center transition-all cursor-pointer z-20 active:scale-90"
              title="Close modal"
              aria-label="Close modal">
              <span class="material-symbols-outlined text-base font-bold">close</span>
            </button>
          }
          
          <!-- Top Centered Icon with Themed Ring Container (Matches Design Inspiration) -->
          <div class="flex justify-center">
            @if (s.iconType === 'warning') {
              <div class="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 text-amber-500 flex items-center justify-center shadow-xs">
                <span class="material-symbols-outlined text-3xl">warning</span>
              </div>
            } @else if (s.iconType === 'danger') {
              <div class="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/40 text-rose-600 flex items-center justify-center shadow-xs">
                <span class="material-symbols-outlined text-3xl">{{ s.icon || 'delete' }}</span>
              </div>
            } @else if (s.iconType === 'success') {
              <div class="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 flex items-center justify-center shadow-xs">
                <span class="material-symbols-outlined text-3xl">{{ s.icon || 'check_circle' }}</span>
              </div>
            } @else if (s.iconType === 'tenant') {
              <div class="w-14 h-14 rounded-2xl bg-tenant-50 dark:bg-tenant-950/60 border border-tenant-200/60 dark:border-tenant-800/40 text-tenant-600 flex items-center justify-center shadow-xs">
                <span class="material-symbols-outlined text-3xl">{{ s.icon || 'layers' }}</span>
              </div>
            } @else {
              <div class="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/40 text-sky-600 flex items-center justify-center shadow-xs">
                <span class="material-symbols-outlined text-3xl">{{ s.icon || 'info' }}</span>
              </div>
            }
          </div>

          <!-- Title & Subtitle / Message -->
          <div class="space-y-1.5 px-1">
            <h3 class="text-base sm:text-lg font-bold text-text-primary">
              {{ s.title }}
            </h3>
            <p class="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {{ s.message }}
            </p>
          </div>

          <!-- Action Buttons Layout -->
          @if (s.type === 'discard') {
            <!-- Wizard 3-Option Discard Pattern (Matches Screenshot) -->
            <div class="space-y-2 pt-2">
              @if (s.showDraftOption) {
                <button 
                  id="btn-modal-save-draft"
                  type="button" 
                  (click)="modalService.triggerDraft()"
                  class="w-full py-3 px-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-lg">save</span>
                  <span>{{ s.draftText }}</span>
                </button>
              }

              <button 
                id="btn-modal-discard"
                type="button" 
                (click)="modalService.triggerDiscard()"
                class="w-full py-3 px-4 rounded-2xl bg-base-200/80 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold text-xs sm:text-sm transition-all border border-base-300 dark:border-slate-700/60 cursor-pointer flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-lg">delete_sweep</span>
                <span>{{ s.discardText }}</span>
              </button>

              <button 
                id="btn-modal-continue"
                type="button" 
                (click)="modalService.triggerCancel()"
                class="w-full py-2.5 px-4 text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-center">
                {{ s.cancelText }}
              </button>
            </div>
          } @else {
            <!-- Standard 2-Button Action Pattern -->
            <div class="flex items-center gap-3 pt-3">
              <button 
                id="btn-modal-cancel"
                type="button" 
                (click)="modalService.triggerCancel()"
                class="flex-1 py-2.5 px-4 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-semibold transition-colors cursor-pointer">
                {{ s.cancelText }}
              </button>
              <button 
                id="btn-modal-confirm"
                type="button" 
                (click)="modalService.triggerConfirm()"
                [class]="s.confirmButtonClass || (s.iconType === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white' : (s.iconType === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'btn-gradient text-white'))"
                class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer">
                {{ s.confirmText }}
              </button>
            </div>
          }

        </div>
      </div>
    }
  `
})
export class ConfirmationModalComponent {
  modalService = inject(ConfirmationModalService);

  isShaking = signal<boolean>(false);

  triggerAttentionShake() {
    this.isShaking.set(false);
    setTimeout(() => {
      this.isShaking.set(true);
      setTimeout(() => this.isShaking.set(false), 450);
    }, 10);
  }

  isDismissible(): boolean {
    const s = this.modalService.state();
    return s?.dismissible !== false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.modalService.isOpen()) {
      if (this.isDismissible()) {
        this.modalService.triggerCancel();
      } else {
        this.triggerAttentionShake();
      }
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (this.isDismissible()) {
      this.modalService.triggerCancel();
    } else {
      this.triggerAttentionShake();
    }
  }
}
