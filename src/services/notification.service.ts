import { Injectable, signal, computed, inject } from '@angular/core';

export type DialogVariant = 'error' | 'warning' | 'success' | 'info' | 'confirm';

export interface DialogOptions {
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  icon?: string;
  iconType?: DialogVariant;
  backdropDismiss?: boolean;
  dismissible?: boolean;
  showCloseButton?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  badge?: string;
  details?: string;
  danger?: boolean;
  illustration?: '404' | 'maintenance' | '401' | '500' | '403';
  statusCode?: string | number;
  primary?: boolean;
  signInText?: string;
  onSignInAgain?: () => void;
}

export interface NotificationDialogState {
  id: string;
  variant: DialogVariant;
  title: string;
  message: string;
  options: DialogOptions;
  resolve: (value: boolean) => void;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  activeDialog = signal<NotificationDialogState | null>(null);
  isOpen = computed(() => this.activeDialog() !== null);

  // Global default controls for dialog behavior
  defaultDismissible = signal<boolean>(true);
  defaultShowCloseButton = signal<boolean>(true);

  // Optional toast notifications list managed directly by NotificationService
  toasts = signal<ToastNotification[]>([]);

  /**
   * Shows an Error Dialog.
   * Returns a Promise that resolves to `true` when confirmed/acknowledged, or `false` if dismissed/canceled.
   * 
   * Example:
   * notify.errorDialog('Session Error!', 'Session expired, please login again')
   *   .then(() => window.location.reload());
   */
  errorDialog(title: string, message: string, options: DialogOptions = {}): Promise<boolean> {
    return this.openDialog({
      variant: 'error',
      title,
      message,
      options: {
        confirmText: options.confirmText || 'Okay',
        cancelText: options.cancelText || 'Dismiss',
        showCancelButton: options.showCancelButton ?? false,
        icon: options.icon || 'error',
        ...options
      }
    });
  }

  /**
   * Shows a Warning Dialog variant.
   */
  warningDialog(title: string, message: string, options: DialogOptions = {}): Promise<boolean> {
    return this.openDialog({
      variant: 'warning',
      title,
      message,
      options: {
        confirmText: options.confirmText || 'Understand',
        cancelText: options.cancelText || 'Cancel',
        showCancelButton: options.showCancelButton ?? false,
        icon: options.icon || 'warning',
        ...options
      }
    });
  }

  /**
   * Shows a Success Dialog variant.
   */
  successDialog(title: string, message: string, options: DialogOptions = {}): Promise<boolean> {
    return this.openDialog({
      variant: 'success',
      title,
      message,
      options: {
        confirmText: options.confirmText || 'Great',
        cancelText: options.cancelText || 'Close',
        showCancelButton: options.showCancelButton ?? false,
        icon: options.icon || 'check_circle',
        ...options
      }
    });
  }

  /**
   * Shows an Info Dialog variant.
   */
  infoDialog(title: string, message: string, options: DialogOptions = {}): Promise<boolean> {
    return this.openDialog({
      variant: 'info',
      title,
      message,
      options: {
        confirmText: options.confirmText || 'Got It',
        cancelText: options.cancelText || 'Close',
        showCancelButton: options.showCancelButton ?? false,
        icon: options.icon || 'info',
        ...options
      }
    });
  }

  /**
   * Shows a Confirmation Dialog variant with Cancel and Confirm action buttons.
   */
  confirmDialog(title: string, message: string, options: DialogOptions = {}): Promise<boolean> {
    return this.openDialog({
      variant: 'confirm',
      title,
      message,
      options: {
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        showCancelButton: options.showCancelButton ?? true,
        icon: options.icon || 'help',
        ...options
      }
    });
  }

  /**
   * Generic dialog opener for full customization.
   */
  openDialog(config: {
    variant: DialogVariant;
    title: string;
    message: string;
    options?: DialogOptions;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const opts = config.options || {};
      const dismissible = opts.dismissible !== undefined
        ? opts.dismissible
        : (opts.backdropDismiss !== undefined ? opts.backdropDismiss : this.defaultDismissible());
      const showCloseButton = opts.showCloseButton !== undefined
        ? opts.showCloseButton
        : this.defaultShowCloseButton();

      const mergedOptions: DialogOptions = {
        ...opts,
        dismissible,
        backdropDismiss: dismissible,
        showCloseButton
      };

      const state: NotificationDialogState = {
        id: `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        variant: config.variant,
        title: config.title,
        message: config.message,
        options: mergedOptions,
        resolve
      };

      this.activeDialog.set(state);
    });
  }

  /**
   * Trigger the confirmation action on current active dialog
   */
  confirm() {
    const current = this.activeDialog();
    if (current) {
      if (current.options.onConfirm) {
        current.options.onConfirm();
      }
      current.resolve(true);
      this.activeDialog.set(null);
    }
  }

  /**
   * Trigger the cancel/dismiss action on current active dialog
   */
  cancel() {
    const current = this.activeDialog();
    if (current) {
      if (current.options.onCancel) {
        current.options.onCancel();
      }
      current.resolve(false);
      this.activeDialog.set(null);
    }
  }

  /**
   * Dismiss dialog
   */
  closeDialog(result = false) {
    const current = this.activeDialog();
    if (current) {
      current.resolve(result);
      this.activeDialog.set(null);
    }
  }

  // ----------------------------------------------------
  // Toast Notification Conveniences
  // ----------------------------------------------------
  showToast(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', durationMs = 4000, title?: string) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newToast: ToastNotification = { id, message, type, title, durationMs };
    this.toasts.update(t => [...t, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, durationMs);
    }
  }

  removeToast(id: string) {
    this.toasts.update(t => t.filter(item => item.id !== id));
  }

  success(message: string, title?: string) {
    this.showToast(message, 'success', 3500, title || 'Success');
  }

  error(message: string, title?: string) {
    this.showToast(message, 'error', 5000, title || 'Error');
  }

  warning(message: string, title?: string) {
    this.showToast(message, 'warning', 4000, title || 'Warning');
  }

  info(message: string, title?: string) {
    this.showToast(message, 'info', 3500, title || 'Notice');
  }
}
