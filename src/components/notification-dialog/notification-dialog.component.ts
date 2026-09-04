import { Component, ChangeDetectionStrategy, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { LmsDataService } from '../../services/lms-data.service';
import { StatusIllustrationComponent } from '../status-illustration/status-illustration.component';

@Component({
  selector: 'app-notification-dialog',
  imports: [CommonModule, StatusIllustrationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (notify.isOpen() && notify.activeDialog(); as d) {
      <div 
        id="notification-dialog-backdrop"
        class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/65 backdrop-blur-md z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
        (click)="onBackdropClick($event)">
        
        <div 
          id="notification-dialog-card"
          class="relative bg-base-100 dark:bg-slate-900 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-[440px] p-6 sm:p-7 text-center space-y-4 animate-modal-card m-auto select-none"
          [class.animate-shake]="isShaking()"
          (click)="$event.stopPropagation()">

          <!-- Top-Right Cross Button (Configurable) -->
          @if (showCrossButton(d)) {
            <button 
              id="btn-dialog-close-cross"
              type="button" 
              (click)="onCrossCloseClick()"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-base-200/80 hover:bg-base-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-secondary hover:text-text-primary flex items-center justify-center transition-all cursor-pointer z-20 active:scale-90"
              title="Close dialog"
              aria-label="Close dialog">
              <span class="material-symbols-outlined text-base font-bold">close</span>
            </button>
          }
          
          <!-- Optional Status Illustration or Variant Icon -->
          @if (d.options.illustration) {
            <div class="w-full max-w-[240px] mx-auto py-1">
              <app-status-illustration [type]="d.options.illustration"></app-status-illustration>
            </div>
            @if (getStatusCode(d); as code) {
              <div id="notification-dialog-status-code" class="text-3xl sm:text-4xl font-black tracking-tight mt-1" style="color: var(--tenant-primary);">
                {{ code }}
              </div>
            }
          } @else {
            <!-- Variant Icon Container with Pulse Glow Badge -->
            <div class="flex flex-col items-center justify-center pt-1">
              @if (d.variant === 'error') {
                <div class="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-md shadow-rose-500/10">
                  <span class="material-symbols-outlined text-3xl font-bold">{{ d.options.icon || 'error' }}</span>
                </div>
              } @else if (d.variant === 'warning') {
                <div class="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-md shadow-amber-500/10">
                  <span class="material-symbols-outlined text-3xl font-bold">{{ d.options.icon || 'warning' }}</span>
                </div>
              } @else if (d.variant === 'success') {
                <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <span class="material-symbols-outlined text-3xl font-bold">{{ d.options.icon || 'check_circle' }}</span>
                </div>
              } @else if (d.variant === 'info') {
                <div class="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-md shadow-sky-500/10">
                  <span class="material-symbols-outlined text-3xl font-bold">{{ d.options.icon || 'info' }}</span>
                </div>
              } @else {
                <div class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-md shadow-indigo-500/10">
                  <span class="material-symbols-outlined text-3xl font-bold">{{ d.options.icon || 'help' }}</span>
                </div>
              }
              @if (getStatusCode(d); as code) {
                <div id="notification-dialog-status-code-badge" class="mt-2.5 text-2xl sm:text-3xl font-black tracking-tight" style="color: var(--tenant-primary);">
                  {{ code }}
                </div>
              }
            </div>
          }

          <!-- Dialog Title & Message -->
          <div class="space-y-2 px-1">
            <h3 
              id="notification-dialog-title"
              class="text-base sm:text-lg font-bold text-text-primary tracking-tight"
              [class.text-rose-600]="d.variant === 'error'"
              [class.dark:text-rose-400]="d.variant === 'error'">
              {{ d.title }}
            </h3>
            
            <p 
              id="notification-dialog-message"
              class="text-xs sm:text-sm text-text-secondary leading-relaxed break-words">
              {{ d.message }}
            </p>

            @if (d.options.details) {
              <div class="mt-2.5 p-2.5 rounded-xl bg-base-200/80 dark:bg-slate-800/80 border border-base-300 dark:border-slate-700/60 text-[11px] font-mono text-left text-text-secondary overflow-x-auto">
                {{ d.options.details }}
              </div>
            }
          </div>

          <!-- Action Buttons -->
          <div class="pt-2">
            @if (is401Dialog(d)) {
              <!-- Special 401 Unauthorized Action Buttons: Try Sign In Again + Go to Dashboard -->
              <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full">
                <button 
                  id="btn-dialog-try-signin"
                  type="button" 
                  (click)="onTrySignInAgain(d)"
                  style="background-color: var(--tenant-primary);"
                  class="w-full sm:flex-1 py-3 px-4 rounded-full text-xs font-bold text-white shadow-md shadow-tenant-500/25 hover:shadow-tenant-500/40 hover:brightness-105 active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer">
                  <span class="material-symbols-outlined text-base">login</span>
                  <span class="whitespace-nowrap">{{ d.options.signInText || 'Try Sign In Again' }}</span>
                </button>

                <button 
                  id="btn-dialog-dashboard"
                  type="button" 
                  (click)="onGoToDashboard(d)"
                  class="w-full sm:flex-1 py-3 px-4 rounded-full text-xs font-semibold text-text-primary bg-base-200 hover:bg-base-300 border border-base-300 active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer">
                  <span class="material-symbols-outlined text-base">dashboard</span>
                  <span class="whitespace-nowrap">{{ d.options.confirmText || 'Go to Dashboard' }}</span>
                </button>
              </div>
            } @else if (d.options.showCancelButton) {
              <div class="flex items-center gap-3">
                <button 
                  id="btn-dialog-cancel"
                  type="button" 
                  (click)="notify.cancel()"
                  class="flex-1 py-2.5 px-4 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-semibold transition-colors cursor-pointer">
                  {{ d.options.cancelText || 'Cancel' }}
                </button>

                <button 
                  id="btn-dialog-confirm"
                  type="button" 
                  (click)="notify.confirm()"
                  [class]="getConfirmButtonClass(d.variant, d.options)"
                  [style.background-color]="isPrimaryButton(d.options) ? 'var(--tenant-primary)' : null"
                  [class.rounded-full]="isPrimaryButton(d.options)"
                  [class.rounded-xl]="!isPrimaryButton(d.options)"
                  class="flex-1 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all cursor-pointer">
                  {{ d.options.confirmText || 'Confirm' }}
                </button>
              </div>
            } @else {
              <button 
                id="btn-dialog-action"
                type="button" 
                (click)="notify.confirm()"
                [class]="getConfirmButtonClass(d.variant, d.options)"
                [style.background-color]="isPrimaryButton(d.options) ? 'var(--tenant-primary)' : null"
                [class.rounded-full]="isPrimaryButton(d.options)"
                [class.rounded-xl]="!isPrimaryButton(d.options)"
                class="w-full py-3 px-6 text-sm font-bold text-white shadow-md transition-all cursor-pointer active:scale-95">
                {{ d.options.confirmText || 'Okay' }}
              </button>
            }
          </div>

        </div>
      </div>
    }
  `
})
export class NotificationDialogComponent {
  notify = inject(NotificationService);
  lms = inject(LmsDataService);
  router = inject(Router);

  is401Dialog(d: any): boolean {
    if (!d) return false;
    const code = this.getStatusCode(d);
    return code === '401' || d.options?.illustration === '401';
  }

  onTrySignInAgain(d: any) {
    if (d.options?.onSignInAgain) {
      d.options.onSignInAgain();
    } else {
      this.lms.showToast('Redirecting to organization SSO login portal...', 'info');
    }
    this.notify.cancel();
  }

  onGoToDashboard(d: any) {
    this.notify.confirm();
    this.router.navigate(['/dashboard']);
  }

  getStatusCode(d: any): string | null {
    if (d.options?.statusCode) {
      return String(d.options.statusCode);
    }
    switch (d.options?.illustration) {
      case '404': return '404';
      case '401': return '401';
      case '500': return '500';
      case '403': return '403';
      case 'maintenance': return d.options?.statusCode ? String(d.options.statusCode) : null;
      default: return null;
    }
  }

  isPrimaryButton(options: any): boolean {
    if (!options) return false;
    return !!(options.illustration || options.primary || options.confirmText === 'Go to Dashboard');
  }

  isDismissible(d: any): boolean {
    if (!d) return true;
    if (d.options?.dismissible !== undefined) {
      return !!d.options.dismissible;
    }
    if (d.options?.backdropDismiss !== undefined) {
      return !!d.options.backdropDismiss;
    }
    return this.notify.defaultDismissible();
  }

  showCrossButton(d: any): boolean {
    if (!d) return true;
    if (d.options?.showCloseButton !== undefined) {
      return !!d.options.showCloseButton;
    }
    return this.notify.defaultShowCloseButton();
  }

  // Attention shake animation signal when clicking outside a non-dismissible dialog
  isShaking = signal<boolean>(false);

  triggerAttentionShake() {
    this.isShaking.set(false);
    setTimeout(() => {
      this.isShaking.set(true);
      setTimeout(() => this.isShaking.set(false), 450);
    }, 10);
  }

  onCrossCloseClick() {
    this.notify.cancel();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.notify.isOpen()) {
      const current = this.notify.activeDialog();
      if (current && this.isDismissible(current)) {
        this.notify.cancel();
      } else {
        this.triggerAttentionShake();
      }
    }
  }

  onBackdropClick(event: MouseEvent) {
    const current = this.notify.activeDialog();
    if (current && this.isDismissible(current)) {
      this.notify.cancel();
    } else {
      this.triggerAttentionShake();
    }
  }

  getConfirmButtonClass(variant: string, options: any): string {
    if (this.isPrimaryButton(options)) {
      return 'text-white shadow-md shadow-tenant-500/25 hover:shadow-tenant-500/40 active:scale-95';
    }
    if (options.danger) {
      return 'bg-rose-600 hover:bg-rose-700 text-white';
    }
    switch (variant) {
      case 'error':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'info':
        return 'bg-sky-600 hover:bg-sky-700 text-white';
      case 'confirm':
      default:
        return 'btn-gradient text-white';
    }
  }
}
