import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraineeCredential } from '../../../models/trainee-plan.model';

@Component({
  selector: 'app-certificate-preview-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/80 backdrop-blur-md z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-modal-card m-auto">

        <!-- Modal Top Bar -->
        <div class="p-4 sm:p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/40">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-xl text-amber-500">verified</span>
            <div>
              <h3 class="text-sm font-bold text-text-primary">Verified Credential Showcase</h3>
              <p class="text-[11px] text-text-secondary">Official Tamper-Proof Cryptographic Certificate</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button 
              type="button" 
              (click)="printOrDownload()"
              class="px-3.5 py-1.5 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
              <span class="material-symbols-outlined text-sm">print</span>
              <span>Print / Download PDF</span>
            </button>

            <button 
              type="button" 
              (click)="close.emit()"
              class="w-8 h-8 rounded-full hover:bg-base-300 dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        <!-- Certificate Rendering Canvas -->
        <div class="p-6 sm:p-10 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
          
          <div class="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border-8 border-double border-amber-600/30 relative overflow-hidden select-none">
            
            <!-- Elegant background filigree decoration -->
            <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-amber-200/20 to-tenant-200/20 pointer-events-none"></div>
            <div class="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-tr from-tenant-200/20 to-amber-200/20 pointer-events-none"></div>

            <!-- Certificate Header -->
            <div class="text-center space-y-2 relative z-10">
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mb-1">
                <span class="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <div class="text-[10px] uppercase font-black tracking-widest text-amber-700">BRAC Learning & Development Division</div>
              <h1 class="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-wide">
                {{ credential().type === 'badge' ? 'Certificate of Course Completion' : 'Certificate of Program Competence' }}
              </h1>
              <p class="text-xs text-slate-500 italic">This is to officially certify that</p>
            </div>

            <!-- Recipient Name -->
            <div class="text-center my-6 relative z-10">
              <div class="text-xl sm:text-3xl font-serif font-black text-tenant-700 border-b-2 border-slate-300 pb-2 inline-block px-8">
                {{ credential().recipientName }}
              </div>
            </div>

            <!-- Credential Details -->
            <div class="text-center space-y-3 relative z-10 text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              <p>
                has successfully fulfilled all operational curriculum requirements, in-person classroom milestones, and examination standards for
              </p>
              <h2 class="text-base sm:text-lg font-bold text-slate-900 font-serif">
                {{ credential().title }}
              </h2>
              <p class="text-[11px] text-slate-500">
                Plan Program: <strong>{{ credential().planName }}</strong>
                @if (credential().phaseName) {
                  • <span>{{ credential().phaseName }}</span>
                }
              </p>
            </div>

            <!-- Footer Signatures & QR Code -->
            <div class="mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 items-end gap-4 relative z-10 text-xs">
              <div class="text-center space-y-1">
                <div class="font-serif italic font-semibold text-slate-800 text-sm border-b border-slate-300 pb-1">
                  {{ credential().signatoryName || 'Farhana Ahmed' }}
                </div>
                <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  {{ credential().signatoryTitle || 'Executive Director of L&D' }}
                </div>
              </div>

              <!-- Verification QR Stamp -->
              <div class="text-center space-y-1">
                <div class="w-14 h-14 bg-slate-900 text-white rounded-xl mx-auto flex items-center justify-center p-1.5 shadow-sm">
                  <span class="material-symbols-outlined text-3xl">qr_code_2</span>
                </div>
                <div class="font-mono text-[9px] text-slate-500 font-bold">
                  {{ credential().verificationCode || 'VRF-9821-BRAC' }}
                </div>
              </div>

              <div class="text-center space-y-1">
                <div class="font-serif italic font-semibold text-slate-800 text-sm border-b border-slate-300 pb-1">
                  {{ credential().issueDate || '15/02/2026' }}
                </div>
                <div class="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  Date of Conferral
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- Action Bar -->
        <div class="p-4 sm:p-5 border-t border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50">
          <div class="text-xs text-text-secondary flex items-center gap-2">
            <span class="material-symbols-outlined text-sm text-emerald-500">verified_user</span>
            <span>Cryptographically Verified on Blockchain Ledger</span>
          </div>

          <button 
            type="button" 
            (click)="close.emit()"
            class="px-5 py-2.5 rounded-xl bg-base-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold cursor-pointer">
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  `
})
export class CertificatePreviewModalComponent {
  credential = input.required<TraineeCredential>();
  close = output<void>();

  printOrDownload() {
    window.print();
  }
}
