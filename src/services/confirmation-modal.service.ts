import { Injectable, signal } from '@angular/core';

export type ConfirmationModalType = 'discard' | 'confirm' | 'danger' | 'info' | 'success';

export interface DiscardModalOptions {
  title?: string;
  message?: string;
  draftText?: string;
  discardText?: string;
  cancelText?: string;
  showDraftOption?: boolean;
  dismissible?: boolean;
  showCloseButton?: boolean;
  onDraft?: () => void;
  onDiscard?: () => void;
  onCancel?: () => void;
}

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  iconType?: 'warning' | 'danger' | 'info' | 'success' | 'tenant';
  confirmButtonClass?: string;
  dismissible?: boolean;
  showCloseButton?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ActiveModalState {
  type: ConfirmationModalType;
  title: string;
  message: string;
  icon: string;
  iconType: 'warning' | 'danger' | 'info' | 'success' | 'tenant';
  showDraftOption: boolean;
  draftText: string;
  discardText: string;
  cancelText: string;
  confirmText: string;
  confirmButtonClass?: string;
  dismissible?: boolean;
  showCloseButton?: boolean;
  resolve?: (result: any) => void;
  onDraft?: () => void;
  onDiscard?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationModalService {
  isOpen = signal<boolean>(false);
  state = signal<ActiveModalState | null>(null);

  /**
   * Opens a 3-button Discard Modal (matching the wizard discard design):
   * 1. Save as Draft & Exit
   * 2. Discard & Exit
   * 3. Continue Editing
   * 
   * Can be used with Promise (await) or callbacks.
   */
  confirmDiscard(options: DiscardModalOptions = {}): Promise<'draft' | 'discard' | 'cancel'> {
    return new Promise<'draft' | 'discard' | 'cancel'>((resolve) => {
      const modalState: ActiveModalState = {
        type: 'discard',
        title: options.title || 'Discard Changes?',
        message: options.message || 'You have unsaved changes in this wizard. You can save your progress as a draft to resume later.',
        icon: 'warning',
        iconType: 'warning',
        showDraftOption: options.showDraftOption !== false,
        draftText: options.draftText || 'Save as Draft & Exit',
        discardText: options.discardText || 'Discard & Exit',
        cancelText: options.cancelText || 'Continue Editing',
        confirmText: options.discardText || 'Discard & Exit',
        dismissible: options.dismissible,
        showCloseButton: options.showCloseButton,
        resolve,
        onDraft: () => {
          if (options.onDraft) options.onDraft();
          resolve('draft');
          this.closeModal();
        },
        onDiscard: () => {
          if (options.onDiscard) options.onDiscard();
          resolve('discard');
          this.closeModal();
        },
        onCancel: () => {
          if (options.onCancel) options.onCancel();
          resolve('cancel');
          this.closeModal();
        }
      };

      this.state.set(modalState);
      this.isOpen.set(true);
    });
  }

  /**
   * Opens a standard Confirmation Modal (e.g. Delete, Publish, Activate, Sign Out, Reset).
   */
  confirm(options: ConfirmModalOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const modalState: ActiveModalState = {
        type: (options.iconType === 'danger' ? 'danger' : 'confirm') as ConfirmationModalType,
        title: options.title,
        message: options.message,
        icon: options.icon || (options.iconType === 'danger' ? 'delete' : options.iconType === 'success' ? 'check_circle' : 'warning'),
        iconType: options.iconType || 'warning',
        showDraftOption: false,
        draftText: '',
        discardText: '',
        cancelText: options.cancelText || 'Cancel',
        confirmText: options.confirmText || 'Confirm',
        confirmButtonClass: options.confirmButtonClass,
        dismissible: options.dismissible,
        showCloseButton: options.showCloseButton,
        resolve,
        onConfirm: () => {
          if (options.onConfirm) options.onConfirm();
          resolve(true);
          this.closeModal();
        },
        onCancel: () => {
          if (options.onCancel) options.onCancel();
          resolve(false);
          this.closeModal();
        }
      };

      this.state.set(modalState);
      this.isOpen.set(true);
    });
  }

  triggerDraft() {
    const current = this.state();
    if (current?.onDraft) {
      current.onDraft();
    } else {
      if (current?.resolve) current.resolve('draft');
      this.closeModal();
    }
  }

  triggerDiscard() {
    const current = this.state();
    if (current?.onDiscard) {
      current.onDiscard();
    } else {
      if (current?.resolve) current.resolve('discard');
      this.closeModal();
    }
  }

  triggerConfirm() {
    const current = this.state();
    if (current?.onConfirm) {
      current.onConfirm();
    } else {
      if (current?.resolve) current.resolve(true);
      this.closeModal();
    }
  }

  triggerCancel() {
    const current = this.state();
    if (current?.onCancel) {
      current.onCancel();
    } else {
      if (current?.resolve) current.resolve(current.type === 'discard' ? 'cancel' : false);
      this.closeModal();
    }
  }

  closeModal() {
    this.isOpen.set(false);
    this.state.set(null);
  }
}
