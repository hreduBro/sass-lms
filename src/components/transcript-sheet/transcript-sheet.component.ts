import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranscriptRecord } from '../../models/transcript.model';

@Component({
  selector: 'app-transcript-sheet',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[999999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150 print:p-0 print:bg-white print:static print:inset-auto">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-4xl w-full my-6 overflow-hidden flex flex-col print:shadow-none print:border-none print:max-w-none print:my-0">
        
        <!-- Header Toolbar (Light Theme with Primary Accent) -->
        <div class="px-6 py-4 bg-white text-slate-800 flex items-center justify-between border-b border-slate-200/80 rounded-t-3xl shrink-0 print:hidden">
          <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-2xl bg-tenant-50 border border-tenant-200 flex items-center justify-center text-tenant-600 shrink-0 shadow-2xs">
              <span class="material-symbols-outlined text-xl">description</span>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-slate-900">
                  Official Academic Transcript
                </h2>
                <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  {{ transcript().content.serialNumber }}
                </span>
                <span [class]="getReleaseBadgeClass(transcript().releaseState)">
                  {{ transcript().releaseState | uppercase }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Verified System Record</span>
                <span>·</span>
                <span>Level: <strong class="capitalize text-slate-700">{{ transcript().level }}</strong></span>
                <span>·</span>
                <span>Version: <strong class="text-slate-700">v{{ transcript().version }}</strong></span>
                <span>·</span>
                <span>Issued: <strong class="text-slate-700">{{ transcript().content.issuedDate }}</strong></span>
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Copy Serial Button -->
            <button
              type="button"
              (click)="copySerialNumber()"
              class="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
              [title]="isCopied() ? 'Copied to clipboard!' : 'Copy Serial Number'"
            >
              <span class="material-symbols-outlined text-sm text-slate-500">
                {{ isCopied() ? 'check' : 'content_copy' }}
              </span>
              <span class="hidden sm:inline">{{ isCopied() ? 'Copied' : 'Copy' }}</span>
            </button>

            <!-- Print Button -->
            <button
              type="button"
              (click)="printTranscript()"
              class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
              title="Print Official Document"
            >
              <span class="material-symbols-outlined text-sm text-slate-600">print</span>
              <span>Print / PDF</span>
            </button>

            <!-- Download PDF / CSV Button (Primary Color) -->
            @if (transcript().downloadEnabled || isAdmin()) {
              <button
                type="button"
                (click)="exportIndividual()"
                class="px-4 py-2 bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span class="material-symbols-outlined text-sm">download</span>
                <span>Download PDF</span>
              </button>
            } @else {
              <span class="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1" title="PDF download is restricted in plan settings">
                <span class="material-symbols-outlined text-xs text-amber-500">lock</span>
                <span>View-Only</span>
              </span>
            }

            <!-- Close Modal Button -->
            <button
              type="button"
              (click)="close.emit()"
              class="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
              aria-label="Close"
            >
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <!-- Official Printable Document Body (Certificate / Ledger Canvas) -->
        <div id="printable-transcript" class="p-6 sm:p-10 text-slate-800 bg-white relative font-sans leading-relaxed overflow-y-auto max-h-[80vh] print:max-h-none print:p-8 print:text-black space-y-6">
          
          <!-- Subtle Official Watermark Background -->
          <div class="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none select-none">
            <span class="material-symbols-outlined text-[340px] text-slate-900">verified</span>
          </div>

          <!-- 1. Document Header -->
          <div class="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl tracking-tight border-2 border-slate-800 shadow-sm shrink-0">
                LMS
              </div>
              <div class="space-y-0.5">
                <h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {{ transcript().orgName }}
                </h1>
                <p class="text-xs font-extrabold uppercase tracking-widest text-tenant-600">
                  {{ transcript().lmsName }} · Academic Directorate
                </p>
                <p class="text-xs text-slate-500 font-medium">
                  Official Academic Performance & Competency Record
                </p>
              </div>
            </div>

            <div class="text-left sm:text-right text-xs text-slate-600 space-y-1 bg-slate-50/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
              <div class="font-mono font-black text-slate-900 text-sm tracking-tight">
                {{ transcript().content.serialNumber }}
              </div>
              <div>Issue Date: <strong class="font-semibold text-slate-800">{{ transcript().content.issuedDate }}</strong></div>
              <div>Completion Date: <strong class="font-semibold text-slate-800">{{ transcript().content.completionDate }}</strong></div>
              <div class="text-[11px] text-slate-500">
                Security Verification: 
                <span class="font-mono text-tenant-700 font-bold px-2 py-0.5 rounded bg-tenant-50 border border-tenant-200/80">
                  {{ transcript().content.verificationCode }}
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Trainee & Program Metadata Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/90 rounded-2xl p-5 border border-slate-200/90 text-xs relative z-10 shadow-2xs">
            <!-- Trainee Details -->
            <div class="space-y-2.5">
              <div class="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-slate-500">person</span>
                Trainee Information
              </div>
              <div class="text-sm font-black text-slate-900">{{ transcript().traineeName }}</div>
              <div class="grid grid-cols-3 gap-1.5 text-slate-600">
                <span class="text-slate-400 font-medium">Trainee ID:</span>
                <span class="col-span-2 font-mono font-bold text-slate-800">{{ transcript().content.traineeId }}</span>
                
                <span class="text-slate-400 font-medium">Email:</span>
                <span class="col-span-2 text-slate-800 font-mono text-[11px]">{{ transcript().traineeEmail }}</span>
                
                @if (transcript().content.department) {
                  <span class="text-slate-400 font-medium">Department:</span>
                  <span class="col-span-2 text-slate-800 font-medium">{{ transcript().content.department }}</span>
                }
                
                @if (transcript().content.designation) {
                  <span class="text-slate-400 font-medium">Designation:</span>
                  <span class="col-span-2 text-slate-800 font-medium">{{ transcript().content.designation }}</span>
                }
              </div>
            </div>

            <!-- Curriculum Details -->
            <div class="space-y-2.5 sm:border-l sm:border-slate-200/80 sm:pl-5">
              <div class="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-slate-500">school</span>
                Curriculum Scope
              </div>
              <div class="text-sm font-black text-slate-900 leading-snug">{{ transcript().scopeName }}</div>
              <div class="grid grid-cols-3 gap-1.5 text-slate-600">
                <span class="text-slate-400 font-medium">Parent Plan:</span>
                <span class="col-span-2 font-semibold text-slate-800">{{ transcript().planName }}</span>
                
                <span class="text-slate-400 font-medium">Scope Level:</span>
                <span class="col-span-2 capitalize font-bold text-slate-800">{{ transcript().level }} Record</span>
                
                <span class="text-slate-400 font-medium">Total Credits:</span>
                <span class="col-span-2 font-bold text-slate-800">{{ transcript().content.totalCredits }} Credit Hours</span>
                
                <span class="text-slate-400 font-medium">Grading Scale:</span>
                <span class="col-span-2 uppercase font-mono font-bold text-slate-800">{{ transcript().content.gradingType }}</span>
              </div>
            </div>
          </div>

          <!-- 3. Course / Module Performance Breakdown Matrix -->
          <div class="space-y-3 relative z-10">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-tenant-600">assessment</span>
                Assessment Performance Breakdown & Evaluation Matrix
              </h3>
              <span class="text-[11px] text-slate-500 font-mono font-semibold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                Passing Standard: ≥ 60.0%
              </span>
            </div>

            <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th class="py-3 px-3.5">Code</th>
                    <th class="py-3 px-3.5">Curriculum Component / Item Title</th>
                    <th class="py-3 px-2.5 text-center">Type</th>
                    <th class="py-3 px-2.5 text-center">Credits</th>
                    <th class="py-3 px-2.5 text-right">Max</th>
                    <th class="py-3 px-2.5 text-right">Score</th>
                    <th class="py-3 px-2.5 text-center">Grade</th>
                    <th class="py-3 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/70 font-sans">
                  @for (item of transcript().content.itemsBreakdown; track item.itemCode) {
                    <tr class="hover:bg-slate-50/60 transition-colors">
                      <td class="py-3 px-3.5 font-mono font-bold text-slate-600 text-[11px]">{{ item.itemCode }}</td>
                      <td class="py-3 px-3.5 font-bold text-slate-900">
                        {{ item.itemName }}
                        @if (item.instructorName) {
                          <span class="block text-[10px] text-slate-500 font-normal mt-0.5">Instructor: {{ item.instructorName }}</span>
                        }
                      </td>
                      <td class="py-3 px-2.5 text-center">
                        <span class="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 uppercase font-bold border border-slate-200">
                          {{ item.type }}
                        </span>
                      </td>
                      <td class="py-3 px-2.5 text-center font-mono font-semibold text-slate-700">{{ item.creditHours }}</td>
                      <td class="py-3 px-2.5 text-right font-mono text-slate-500">{{ item.maxScore }}</td>
                      <td class="py-3 px-2.5 text-right font-mono font-black text-slate-900">{{ item.scoreEarned }}</td>
                      <td class="py-3 px-2.5 text-center font-mono font-extrabold text-slate-800">{{ item.grade }}</td>
                      <td class="py-3 px-3.5 text-center whitespace-nowrap">
                        <span [class]="getItemStatusClass(item.status)">
                          <span class="w-1.5 h-1.5 rounded-full shrink-0" [ngClass]="{
                            'bg-emerald-500': item.status === 'pass',
                            'bg-rose-500': item.status === 'fail',
                            'bg-blue-500': item.status === 'completed',
                            'bg-slate-400': item.status !== 'pass' && item.status !== 'fail' && item.status !== 'completed'
                          }"></span>
                          <span>{{ item.status | uppercase }}</span>
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- 4. Overall Performance Summary & Result Boxes -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <!-- Cumulative Result -->
            <div class="p-4.5 rounded-2xl border border-slate-200/90 bg-slate-50/80 text-center space-y-1 shadow-2xs">
              <div class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Cumulative Score / Result</div>
              <div class="text-xl font-black text-slate-900 font-mono tracking-tight">{{ transcript().content.result }}</div>
              <div class="text-[11px] text-slate-500 font-mono font-medium">Total Points: {{ transcript().content.score }} / {{ transcript().content.maxScore || 100 }}</div>
            </div>

            <!-- Final Outcome -->
            <div class="p-4.5 rounded-2xl border border-slate-200/90 bg-slate-50/80 text-center space-y-1 shadow-2xs">
              <div class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Final Status Outcome</div>
              <div class="text-base font-black uppercase tracking-tight flex items-center justify-center gap-1.5"
                   [class.text-emerald-700]="transcript().content.status === 'pass'"
                   [class.text-rose-700]="transcript().content.status === 'fail'"
                   [class.text-blue-700]="transcript().content.status === 'completed'">
                <span class="material-symbols-outlined text-lg">
                  {{ transcript().content.status === 'pass' ? 'check_circle' : transcript().content.status === 'fail' ? 'cancel' : 'task_alt' }}
                </span>
                <span>{{ transcript().content.status | uppercase }}</span>
              </div>
              <div class="text-[11px] text-slate-500 font-medium">Academic Standing: Regular</div>
            </div>

            <!-- Official Release Status -->
            <div class="p-4.5 rounded-2xl border border-slate-200/90 bg-slate-50/80 text-center space-y-1 shadow-2xs">
              <div class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Official Release Status</div>
              <div class="text-sm font-black text-slate-800 capitalize flex items-center justify-center gap-1.5">
                <span class="w-2 h-2 rounded-full" [class.bg-emerald-500]="transcript().releaseState === 'released'" [class.bg-amber-500]="transcript().releaseState !== 'released'"></span>
                <span>{{ transcript().releaseState | uppercase }}</span>
              </div>
              <div class="text-[11px] text-slate-500 font-medium truncate">
                {{ transcript().releasedAt ? ('Released: ' + transcript().releasedAt) : 'Pending Administrative Release' }}
              </div>
            </div>
          </div>

          <!-- 5. Academic Remarks (Subtle Theme Accent) -->
          @if (transcript().content.remarks) {
            <div class="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs text-slate-800 flex items-start gap-3 relative z-10 shadow-2xs">
              <div class="w-7 h-7 rounded-xl bg-tenant-50 text-tenant-600 border border-tenant-200/60 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-base">verified</span>
              </div>
              <div class="leading-relaxed">
                <strong class="font-black text-slate-900">Academic Assessment Board Remarks: </strong>
                {{ transcript().content.remarks }}
              </div>
            </div>
          }

          <!-- 6. Verification Footer & Signatory Seal -->
          <div class="border-t border-slate-200 pt-6 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end text-xs text-slate-500 relative z-10">
            <div class="space-y-1.5">
              <div class="text-[10px] uppercase font-extrabold tracking-wider text-slate-600 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-slate-400">lock</span>
                Digital Authenticity & Audit Trail
              </div>
              <div class="font-mono text-[10px] text-slate-600 break-all bg-slate-100 p-2.5 rounded-xl border border-slate-200/80 leading-normal">
                {{ transcript().content.securityHash }}
              </div>
              <p class="text-[10px] text-slate-400 leading-tight">
                This document is a digitally verifiable academic record generated by OneLMS Cloud Engine. Scan code or query serial at <strong class="text-slate-600">{{ transcript().orgName.toLowerCase().replace(' ', '') }}.verify.onelms.net</strong>
              </p>
            </div>

            <div class="flex flex-col items-end justify-end text-center">
              <div class="relative inline-flex flex-col items-center">
                <!-- Official Certified Seal (All Primary Color) -->
                <div class="w-16 h-16 rounded-full border-2 border-dashed border-tenant-500 flex flex-col items-center justify-center text-[9px] font-black text-tenant-600 uppercase tracking-tighter rotate-12 p-1 bg-tenant-50 shadow-inner mb-2 pointer-events-none select-none">
                  <span class="text-tenant-600 font-black">OFFICIAL</span>
                  <span class="text-tenant-600 font-black">SEAL</span>
                  <span class="text-[7.5px] font-black text-tenant-600 tracking-wider mt-0.5">VERIFIED</span>
                </div>

                <!-- Underline & Registrar Signatory -->
                <div class="w-44 border-b-2 border-slate-800 mb-1.5"></div>
                <div class="font-black text-slate-900 text-xs tracking-tight">Academic Registrar</div>
                <div class="text-[10px] text-slate-500 font-medium">OneLMS Directorate</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscriptSheetComponent {
  transcript = input.required<TranscriptRecord>();
  isAdmin = input<boolean>(false);
  close = output<void>();
  download = output<TranscriptRecord>();

  isCopied = signal<boolean>(false);

  copySerialNumber(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.transcript().content.serialNumber);
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    }
  }

  getReleaseBadgeClass(state: string): string {
    switch (state) {
      case 'released':
        return 'text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider';
      case 'available':
        return 'text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider';
      case 'pending':
        return 'text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider';
      case 'revoked':
        return 'text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider';
      default:
        return 'text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  getItemStatusClass(status: string): string {
    const base = 'inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ';
    switch (status) {
      case 'pass':
        return base + 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'fail':
        return base + 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'completed':
        return base + 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return base + 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  printTranscript(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  exportIndividual(): void {
    this.download.emit(this.transcript());
  }
}
