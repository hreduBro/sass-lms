import { Component, ChangeDetectionStrategy, input, output, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { EMAIL_TEMPLATES } from '../../models/instructor.model';

export interface EmailRecipientInfo {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

@Component({
  selector: 'app-compose-email-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
        <div class="w-full max-w-xl rounded-3xl bg-base-100 border border-base-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-card">
          
          <!-- Header -->
          <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-tenant-50 dark:bg-tenant-950/60 text-tenant-600 dark:text-tenant-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">mail</span>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Compose In-System Message</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Direct organizational correspondence to faculty &amp; creators</p>
              </div>
            </div>
            <button
              type="button"
              (click)="onClose()"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4 overflow-y-auto flex-1">
            
            <!-- Recipient & Sender Card -->
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400 font-medium">To (Recipient):</span>
                <div class="flex items-center gap-2">
                  @if (recipient()?.avatar) {
                    <img [src]="recipient()!.avatar" [alt]="recipient()!.name" class="w-5 h-5 rounded-full object-cover" referrerpolicy="no-referrer" />
                  }
                  <span class="font-bold text-slate-900 dark:text-white">{{ recipient()?.name }}</span>
                  <span class="text-slate-500 font-mono text-[11px]">&lt;{{ recipient()?.email }}&gt;</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50">
                <span class="text-slate-500 dark:text-slate-400 font-medium">From (Sender):</span>
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-slate-700 dark:text-slate-300">LMS Administrator</span>
                  <span class="text-slate-500 font-mono text-[11px]">&lt;admin&#64;brac.net&gt;</span>
                </div>
              </div>
            </div>

            <!-- Template Quick Select -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Load Formatting Template
              </label>
              <select
                (change)="applyTemplate($any($event.target).value)"
                class="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tenant-500 cursor-pointer"
              >
                <option value="">-- Choose a standard notification template or write custom --</option>
                @for (tpl of templates; track tpl.key) {
                  <option [value]="tpl.key">{{ tpl.name }}</option>
                }
              </select>
            </div>

            <!-- Subject -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
              <input
                type="text"
                [(ngModel)]="subject"
                placeholder="e.g. Schedule Update for Term 1 Course Delivery"
                class="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tenant-500"
              />
            </div>

            <!-- Message Body -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">Message Content *</label>
                <span class="text-[11px] text-slate-400">{{ body.length }} characters</span>
              </div>
              <textarea
                rows="6"
                [(ngModel)]="body"
                placeholder="Compose message body here..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tenant-500 resize-none"
              ></textarea>
            </div>

            <!-- Delivery Note -->
            <div class="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <span class="material-symbols-outlined text-sm mt-0.5 text-blue-500">info</span>
              <span>This email is dispatched directly to the recipient's institutional inbox and logged in the organizational audit registry.</span>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="onClose()"
              class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="sendEmail()"
              [disabled]="isSending() || !subject.trim() || !body.trim()"
              [class.opacity-50]="isSending() || !subject.trim() || !body.trim()"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              @if (isSending()) {
                <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Sending...</span>
              } @else {
                <span class="material-symbols-outlined text-sm">send</span>
                <span>Send Message</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComposeEmailModalComponent {
  lms = inject(LmsDataService);

  recipient = input<EmailRecipientInfo | null>(null);
  isOpen = input<boolean>(false);

  close = output<void>();
  sent = output<{ subject: string; recipient: EmailRecipientInfo }>();

  subject = '';
  body = '';
  isSending = signal<boolean>(false);
  templates = EMAIL_TEMPLATES;

  constructor() {
    effect(() => {
      const rec = this.recipient();
      if (rec && this.isOpen()) {
        this.subject = `OneLMS Notice: Course Delivery & Curriculum Updates`;
        this.body = `Dear ${rec.name},\n\nWe are writing from the LMS Academic Administration office regarding your instructional and authoring activities on the platform.\n\nPlease check your assigned courses in the portal.\n\nBest regards,\nLMS Administrator`;
      }
    });
  }

  applyTemplate(templateKey: string) {
    if (!templateKey) return;
    const tpl = this.templates.find(t => t.key === templateKey);
    if (!tpl) return;

    const recName = this.recipient()?.name || 'Faculty Colleague';
    this.subject = tpl.subject;
    this.body = tpl.body.replace(/\{\{name\}\}/g, recName);
  }

  onClose() {
    this.close.emit();
  }

  sendEmail() {
    const rec = this.recipient();
    if (!rec || !this.subject.trim() || !this.body.trim()) return;

    this.isSending.set(true);

    setTimeout(() => {
      this.isSending.set(false);
      this.lms.showToast(`Email dispatched to ${rec.name} (${rec.email})`, 'success', 3500, 'Message Delivered');
      this.lms.logAction(
        'Email Dispatched',
        `Sent email to ${rec.name} (${rec.email}): "${this.subject}"`,
        'info'
      );
      this.sent.emit({ subject: this.subject, recipient: rec });
      this.onClose();
    }, 600);
  }
}
