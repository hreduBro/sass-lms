import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranscriptRecord } from '../../models/transcript.model';

@Component({
  selector: 'app-transcript-sheet',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print:inset-auto">
      <div class="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col print:shadow-none print:border-none print:max-w-none print:my-0">
        
        <!-- Header Toolbar (Hidden in Print) -->
        <div class="px-6 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 print:hidden">
          <div class="flex items-center space-x-3">
            <span class="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 flex items-center justify-center">
              <span class="material-icons-outlined text-xl">description</span>
            </span>
            <div>
              <h2 class="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                Official Academic Transcript
                <span class="text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                  {{ transcript().content.serialNumber }}
                </span>
                <span [class]="getReleaseBadgeClass(transcript().releaseState)">
                  {{ transcript().releaseState | uppercase }}
                </span>
              </h2>
              <p class="text-xs text-stone-400">
                Verified System Record · Level: <span class="capitalize text-stone-200 font-medium">{{ transcript().level }}</span> · Version: v{{ transcript().version }}
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button
              (click)="printTranscript()"
              class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5 border border-stone-700"
              title="Print Official Document"
            >
              <span class="material-icons-outlined text-sm">print</span>
              <span>Print / PDF</span>
            </button>

            @if (transcript().downloadEnabled || isAdmin()) {
              <button
                (click)="exportIndividual()"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span class="material-icons-outlined text-sm">download</span>
                <span>Download PDF</span>
              </button>
            } @else {
              <span class="px-2.5 py-1 text-xs text-stone-400 bg-stone-800 rounded border border-stone-700 flex items-center gap-1" title="PDF download is disabled in plan settings">
                <span class="material-icons-outlined text-xs text-amber-400">lock</span>
                View-Only
              </span>
            }

            <button
              (click)="close.emit()"
              class="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors ml-2"
              aria-label="Close"
            >
              <span class="material-icons-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <!-- Official Printable Document Body -->
        <div id="printable-transcript" class="p-8 sm:p-12 text-stone-800 bg-white relative font-sans leading-relaxed overflow-y-auto max-h-[80vh] print:max-h-none print:p-8">
          
          <!-- Subtle Official Watermark Background -->
          <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <span class="material-icons-outlined text-[360px] text-stone-900">verified</span>
          </div>

          <!-- Document Header -->
          <div class="border-b-2 border-stone-900 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-2xl tracking-tighter border-2 border-stone-800 shadow-sm shrink-0">
                LMS
              </div>
              <div>
                <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                  {{ transcript().orgName }}
                </h1>
                <p class="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  {{ transcript().lmsName }} · Academic Directorate
                </p>
                <p class="text-xs text-stone-500 mt-0.5">
                  Official Academic Performance & Competency Record
                </p>
              </div>
            </div>

            <div class="text-left sm:text-right text-xs text-stone-600 space-y-1">
              <div class="font-mono font-bold text-stone-900 text-sm">
                {{ transcript().content.serialNumber }}
              </div>
              <div>Issue Date: <span class="font-semibold text-stone-800">{{ transcript().content.issuedDate }}</span></div>
              <div>Completion Date: <span class="font-semibold text-stone-800">{{ transcript().content.completionDate }}</span></div>
              <div class="text-[11px] text-stone-500">Security Verification: <span class="font-mono text-emerald-800 font-semibold">{{ transcript().content.verificationCode }}</span></div>
            </div>
          </div>

          <!-- Trainee & Program Metadata Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-stone-50/80 rounded-xl p-5 border border-stone-200/80 mb-8 text-xs">
            <div class="space-y-2">
              <div class="text-stone-500 font-medium uppercase tracking-wider text-[10px]">Trainee Information</div>
              <div class="text-sm font-bold text-stone-900">{{ transcript().traineeName }}</div>
              <div class="grid grid-cols-3 gap-1 text-stone-600">
                <span class="text-stone-500">Trainee ID:</span>
                <span class="col-span-2 font-mono font-semibold text-stone-800">{{ transcript().content.traineeId }}</span>
                <span class="text-stone-500">Email:</span>
                <span class="col-span-2 text-stone-800">{{ transcript().traineeEmail }}</span>
                @if (transcript().content.department) {
                  <span class="text-stone-500">Department:</span>
                  <span class="col-span-2 text-stone-800">{{ transcript().content.department }}</span>
                }
                @if (transcript().content.designation) {
                  <span class="text-stone-500">Designation:</span>
                  <span class="col-span-2 text-stone-800">{{ transcript().content.designation }}</span>
                }
              </div>
            </div>

            <div class="space-y-2">
              <div class="text-stone-500 font-medium uppercase tracking-wider text-[10px]">Curriculum Scope</div>
              <div class="text-sm font-bold text-stone-900 leading-snug">{{ transcript().scopeName }}</div>
              <div class="grid grid-cols-3 gap-1 text-stone-600">
                <span class="text-stone-500">Parent Plan:</span>
                <span class="col-span-2 font-medium text-stone-800">{{ transcript().planName }}</span>
                <span class="text-stone-500">Scope Level:</span>
                <span class="col-span-2 capitalize font-semibold text-stone-800">{{ transcript().level }} Record</span>
                <span class="text-stone-500">Total Credits:</span>
                <span class="col-span-2 font-semibold text-stone-800">{{ transcript().content.totalCredits }} Credit Hours</span>
                <span class="text-stone-500">Grading Scale:</span>
                <span class="col-span-2 uppercase font-mono text-stone-800">{{ transcript().content.gradingType }}</span>
              </div>
            </div>
          </div>

          <!-- Course / Module Performance Breakdown Matrix -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <span class="material-icons-outlined text-sm text-stone-600">assessment</span>
                Performance Breakdown & Evaluation Matrix
              </h3>
              <span class="text-[11px] text-stone-500 font-mono">
                Passing Standard: >= 60.0%
              </span>
            </div>

            <div class="border border-stone-200 rounded-lg overflow-hidden shadow-xs">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-stone-100/90 text-stone-700 font-semibold border-b border-stone-200">
                    <th class="py-2.5 px-3">Code</th>
                    <th class="py-2.5 px-3">Curriculum Component / Item Title</th>
                    <th class="py-2.5 px-2 text-center">Type</th>
                    <th class="py-2.5 px-2 text-center">Credits</th>
                    <th class="py-2.5 px-2 text-right">Max</th>
                    <th class="py-2.5 px-2 text-right">Score</th>
                    <th class="py-2.5 px-2 text-center">Grade</th>
                    <th class="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-200/70 font-sans">
                  @for (item of transcript().content.itemsBreakdown; track item.itemCode) {
                    <tr class="hover:bg-stone-50/50 transition-colors">
                      <td class="py-2.5 px-3 font-mono font-medium text-stone-600 text-[11px]">{{ item.itemCode }}</td>
                      <td class="py-2.5 px-3 font-medium text-stone-900">
                        {{ item.itemName }}
                        @if (item.instructorName) {
                          <span class="block text-[10px] text-stone-500 font-normal">Instructor: {{ item.instructorName }}</span>
                        }
                      </td>
                      <td class="py-2.5 px-2 text-center">
                        <span class="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600 uppercase font-medium">
                          {{ item.type }}
                        </span>
                      </td>
                      <td class="py-2.5 px-2 text-center font-mono text-stone-600">{{ item.creditHours }}</td>
                      <td class="py-2.5 px-2 text-right font-mono text-stone-500">{{ item.maxScore }}</td>
                      <td class="py-2.5 px-2 text-right font-mono font-bold text-stone-900">{{ item.scoreEarned }}</td>
                      <td class="py-2.5 px-2 text-center font-mono font-bold text-stone-800">{{ item.grade }}</td>
                      <td class="py-2.5 px-3 text-center">
                        <span [class]="getItemStatusClass(item.status)">
                          {{ item.status | uppercase }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Overall Performance Summary & CGPA / Score Box -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div class="p-4 rounded-xl border border-stone-200 bg-stone-50 text-center">
              <div class="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1">Cumulative Score / Result</div>
              <div class="text-xl font-extrabold text-stone-900 font-mono">{{ transcript().content.result }}</div>
              <div class="text-[11px] text-stone-500 mt-0.5 font-mono">Total Points: {{ transcript().content.score }} / {{ transcript().content.maxScore || 100 }}</div>
            </div>

            <div class="p-4 rounded-xl border border-stone-200 bg-stone-50 text-center">
              <div class="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1">Final Status Outcome</div>
              <div class="text-lg font-bold uppercase tracking-tight flex items-center justify-center gap-1.5"
                   [class.text-emerald-700]="transcript().content.status === 'pass'"
                   [class.text-rose-700]="transcript().content.status === 'fail'"
                   [class.text-blue-700]="transcript().content.status === 'completed'">
                <span class="material-icons-outlined text-lg">
                  {{ transcript().content.status === 'pass' ? 'check_circle' : transcript().content.status === 'fail' ? 'cancel' : 'task_alt' }}
                </span>
                {{ transcript().content.status }}
              </div>
              <div class="text-[11px] text-stone-500 mt-0.5">Academic Standing: Regular</div>
            </div>

            <div class="p-4 rounded-xl border border-stone-200 bg-stone-50 text-center">
              <div class="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1">Official Release Status</div>
              <div class="text-sm font-bold text-stone-800 capitalize flex items-center justify-center gap-1">
                <span class="w-2 h-2 rounded-full" [class.bg-emerald-500]="transcript().releaseState === 'released'" [class.bg-amber-500]="transcript().releaseState !== 'released'"></span>
                {{ transcript().releaseState }}
              </div>
              <div class="text-[11px] text-stone-500 mt-0.5">
                {{ transcript().releasedAt ? ('Released: ' + transcript().releasedAt) : 'Pending Administrative Release' }}
              </div>
            </div>
          </div>

          <!-- Academic Remarks -->
          @if (transcript().content.remarks) {
            <div class="mb-8 p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex items-start space-x-2.5">
              <span class="material-icons-outlined text-emerald-700 text-sm mt-0.5">verified_user</span>
              <div>
                <span class="font-bold">Academic Assessment Board Remarks: </span>
                {{ transcript().content.remarks }}
              </div>
            </div>
          }

          <!-- Verification Footer & Signatory Seal -->
          <div class="border-t border-stone-300 pt-6 mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end text-xs text-stone-500">
            <div>
              <div class="text-[10px] uppercase font-bold tracking-wider text-stone-600 mb-1">Digital Authenticity & Audit Trail</div>
              <div class="font-mono text-[10px] text-stone-500 break-all bg-stone-100 p-2 rounded border border-stone-200/80 mb-1">
                {{ transcript().content.securityHash }}
              </div>
              <p class="text-[10px] text-stone-400 leading-tight">
                This document is a digitally verifiable academic record generated by OneLMS Cloud Engine. Scan code or query serial at {{ transcript().orgName.toLowerCase().replace(' ', '') }}.verify.onelms.net
              </p>
            </div>

            <div class="flex items-center justify-end space-x-6 text-center">
              <div>
                <div class="w-32 border-b border-stone-800 mb-1"></div>
                <div class="font-bold text-stone-800 text-[11px]">Academic Registrar</div>
                <div class="text-[10px] text-stone-500">OneLMS Directorate</div>
              </div>
              <div class="w-16 h-16 rounded-full border-2 border-dashed border-emerald-600/60 flex flex-col items-center justify-center text-[9px] font-bold text-emerald-800 uppercase tracking-tighter rotate-12 p-1">
                <span>OFFICIAL</span>
                <span>SEAL</span>
                <span class="text-[7px]">VERIFIED</span>
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

  getReleaseBadgeClass(state: string): string {
    switch (state) {
      case 'released':
        return 'text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      case 'available':
        return 'text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40';
      case 'pending':
        return 'text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40';
      case 'revoked':
        return 'text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40';
      default:
        return 'text-xs font-semibold px-2 py-0.5 rounded bg-stone-700 text-stone-300';
    }
  }

  getItemStatusClass(status: string): string {
    switch (status) {
      case 'pass':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'fail':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200';
      case 'completed':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200';
      default:
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700';
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
