import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomSelectComponent, SelectOption } from '../custom-select/custom-select.component';
import { TranscriptRecord, TranscriptTemplate, TranscriptCanvasElement } from '../../models/transcript.model';
import { LmsDataService } from '../../services/lms-data.service';

@Component({
  selector: 'app-transcript-sheet',
  imports: [CommonModule, CustomSelectComponent],
  template: `
    <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop print:p-0 print:bg-white print:static print:inset-auto">
      <div class="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-4xl w-full my-auto overflow-hidden flex flex-col animate-modal-card print:shadow-none print:border-none print:max-w-none print:my-0">
        
        <!-- Header Toolbar (Light Theme with Primary Accent) -->
        <div class="px-6 py-4 bg-white text-slate-800 flex items-center justify-between border-b border-slate-200/80 rounded-t-3xl shrink-0 print:hidden flex-wrap gap-3">
          <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-2xl bg-tenant-50 border border-tenant-200 flex items-center justify-center text-tenant-600 shrink-0 shadow-2xs">
              <span class="material-symbols-outlined text-xl">description</span>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-slate-900">
                  Academic Transcript Record
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

          <!-- Actions & Template Switcher -->
          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <!-- View Mode Switch (Standard Sheet vs Drag-and-Drop Designed Template) -->
            <div class="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                (click)="viewMode.set('standard')"
                [class]="viewMode() === 'standard' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'"
                class="px-2.5 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Structured Document Layout"
              >
                <span class="material-symbols-outlined text-xs">article</span>
                <span class="hidden md:inline">Document</span>
              </button>
              <button
                type="button"
                (click)="viewMode.set('designed')"
                [class]="viewMode() === 'designed' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'"
                class="px-2.5 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Drag-and-Drop Visual Template"
              >
                <span class="material-symbols-outlined text-xs">dashboard_customize</span>
                <span class="hidden md:inline">Designed Template</span>
              </button>
            </div>

            <!-- Template Selector when in Designed Mode -->
            @if (viewMode() === 'designed') {
              <div class="w-48 sm:w-56">
                <app-custom-select
                  [options]="templateOptions()"
                  [value]="selectedTemplateId()"
                  (valueChange)="selectedTemplateId.set($event)"
                  [clearable]="false"
                  [searchable]="false"
                  size="sm"
                  placeholder="Select Template..."
                />
              </div>
            }

            <!-- Copy Serial Button -->
            <button
              type="button"
              (click)="copySerialNumber()"
              class="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 border border-slate-200 shadow-2xs cursor-pointer"
              [title]="isCopied() ? 'Copied to clipboard!' : 'Copy Serial Number'"
            >
              <span class="material-symbols-outlined text-xs text-slate-500">
                {{ isCopied() ? 'check' : 'content_copy' }}
              </span>
              <span class="hidden lg:inline">{{ isCopied() ? 'Copied' : 'Copy' }}</span>
            </button>

            <!-- Print Button -->
            <button
              type="button"
              (click)="printTranscript()"
              class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-slate-200 shadow-2xs cursor-pointer"
              title="Print Official Document"
            >
              <span class="material-symbols-outlined text-xs text-slate-600">print</span>
              <span>Print</span>
            </button>

            <!-- Download PDF / CSV Button (Primary Color) -->
            @if (transcript().downloadEnabled || isAdmin()) {
              <button
                type="button"
                (click)="exportIndividual()"
                class="px-3.5 py-1.5 bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span class="material-symbols-outlined text-xs">download</span>
                <span>PDF</span>
              </button>
            } @else {
              <span class="px-2.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1" title="PDF download is restricted in plan settings">
                <span class="material-symbols-outlined text-xs text-amber-500">lock</span>
                <span>View-Only</span>
              </span>
            }

            <!-- Close Modal Button -->
            <button
              type="button"
              (click)="close.emit()"
              class="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors ml-0.5 cursor-pointer"
              aria-label="Close"
            >
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        <!-- VIEW MODE 1: Standard Structured Document Body -->
        @if (viewMode() === 'standard') {
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

              <!-- Curriculum Details (Renamed to Academic Scope & Curriculum) -->
              <div class="space-y-2.5 sm:border-l sm:border-slate-200/80 sm:pl-5">
                <div class="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-slate-500">school</span>
                  Academic Scope & Curriculum
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
        } @else {
          <!-- VIEW MODE 2: Drag-and-Drop Designed Template Live Canvas -->
          <div class="p-6 bg-slate-900/10 flex items-center justify-center overflow-auto max-h-[80vh] print:max-h-none print:p-0">
            <div
              id="printable-transcript-canvas"
              class="relative bg-white shadow-xl overflow-hidden print:shadow-none mx-auto border border-slate-300"
              [style.width.px]="canvasWidthPx"
              [style.height.px]="canvasHeightPx"
            >
              <!-- Background Image Layer -->
              @if (currentTemplate()?.backgroundUrl) {
                <img
                  [src]="currentTemplate()!.backgroundUrl"
                  alt="Transcript Background"
                  class="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-90"
                  referrerpolicy="no-referrer"
                />
              }

              <!-- Visual Canvas Elements Rendered with dynamic live transcript values -->
              @for (el of currentTemplate()?.elements || []; track el.id) {
                <div
                  class="absolute pointer-events-none select-none"
                  [style.left.%]="el.x"
                  [style.top.%]="el.y"
                  [style.width.%]="el.w"
                  [style.height.%]="el.h"
                  [style.zIndex]="el.z"
                  [style.fontFamily]="el.style.fontFamily"
                  [style.fontSize.pt]="el.style.fontSizePt"
                  [style.fontWeight]="el.style.bold ? 'bold' : 'normal'"
                  [style.fontStyle]="el.style.italic ? 'italic' : 'normal'"
                  [style.textDecoration]="el.style.underline ? 'underline' : 'none'"
                  [style.color]="el.style.color"
                  [style.textAlign]="el.style.align"
                  [style.backgroundColor]="el.style.backgroundColor || 'transparent'"
                  [style.borderColor]="el.style.borderColor || 'transparent'"
                  [style.borderWidth.px]="el.style.borderWidthPx || 0"
                  [style.borderRadius.px]="el.style.borderRadiusPx || 0"
                >
                  <!-- Static text -->
                  @if (el.kind === 'static-text') {
                    <div class="w-full h-full flex items-center" [class]="getAlignFlexClass(el.style.align)">
                      {{ el.text }}
                    </div>
                  }

                  <!-- Divider -->
                  @if (el.kind === 'divider') {
                    <div class="w-full h-[1px] bg-slate-300 my-auto"></div>
                  }

                  <!-- QR Code -->
                  @if (el.kind === 'qr' || el.token === '{{verification_qr}}') {
                    <div class="w-full h-full p-1 bg-white border border-slate-300 rounded flex flex-col items-center justify-center shadow-xs">
                      <span class="material-symbols-outlined text-3xl text-slate-900">qr_code_2</span>
                      <span class="text-[8px] font-mono font-bold text-slate-700 tracking-tighter">VERIFIED</span>
                    </div>
                  }

                  <!-- Performance Breakdown Table Element -->
                  @if (el.kind === 'performance-table') {
                    <div class="w-full h-full overflow-hidden border border-slate-300/80 rounded-lg bg-white/95 shadow-2xs flex flex-col">
                      <table class="w-full text-left text-[9px] border-collapse">
                        <thead>
                          <tr class="bg-slate-900 text-white font-bold text-[8.5px] uppercase">
                            <th class="py-1.5 px-2">Code</th>
                            <th class="py-1.5 px-2">Curriculum Item</th>
                            <th class="py-1.5 px-1.5 text-center">Credits</th>
                            <th class="py-1.5 px-1.5 text-right">Score</th>
                            <th class="py-1.5 px-1.5 text-center">Grade</th>
                            <th class="py-1.5 px-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                          @for (item of transcript().content.itemsBreakdown; track item.itemCode) {
                            <tr>
                              <td class="py-1 px-2 font-mono font-bold text-slate-600">{{ item.itemCode }}</td>
                              <td class="py-1 px-2 font-semibold text-slate-900 truncate max-w-[180px]">{{ item.itemName }}</td>
                              <td class="py-1 px-1.5 text-center font-mono">{{ item.creditHours }}</td>
                              <td class="py-1 px-1.5 text-right font-mono font-bold">{{ item.scoreEarned }}/{{ item.maxScore }}</td>
                              <td class="py-1 px-1.5 text-center font-mono font-extrabold">{{ item.grade }}</td>
                              <td class="py-1 px-2 text-center font-bold" [class.text-emerald-600]="item.status === 'pass'" [class.text-rose-600]="item.status === 'fail'">
                                {{ item.status | uppercase }}
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  <!-- Placeholder Token Evaluated Value -->
                  @if (el.kind === 'placeholder' && el.token !== '{{verification_qr}}') {
                    <div class="w-full h-full flex items-center" [class]="getAlignFlexClass(el.style.align)">
                      {{ evaluateToken(el.token || '') }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscriptSheetComponent {
  private dataService = inject(LmsDataService);

  transcript = input.required<TranscriptRecord>();
  isAdmin = input<boolean>(false);
  close = output<void>();
  download = output<TranscriptRecord>();

  viewMode = signal<'standard' | 'designed'>('standard');
  isCopied = signal<boolean>(false);

  availableTemplates = computed(() => this.dataService.transcriptTemplates());
  selectedTemplateId = signal<string>('tpl-transcript-default');

  templateOptions = computed<SelectOption[]>(() => {
    return this.availableTemplates().map(tpl => ({
      value: tpl.id,
      label: tpl.name,
      badge: tpl.isDefault ? 'Default' : undefined,
      badgeClass: tpl.isDefault ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : undefined
    }));
  });

  currentTemplate = computed(() => {
    const list = this.availableTemplates();
    const id = this.selectedTemplateId();
    return list.find(t => t.id === id) || list[0];
  });

  // Dimensions for A4 portrait reference canvas
  canvasWidthPx = 794;
  canvasHeightPx = 1123;

  evaluateToken(token: string): string {
    const t = this.transcript();
    switch (token) {
      case '{{trainee_name}}':
        return t.traineeName || t.content.traineeName;
      case '{{trainee_id}}':
        return t.content.traineeId;
      case '{{trainee_email}}':
        return t.traineeEmail || t.content.traineeEmail;
      case '{{department}}':
        return t.content.department || 'Operations';
      case '{{designation}}':
        return t.content.designation || 'Staff Member';
      case '{{scope_name}}':
        return t.scopeName;
      case '{{plan_name}}':
        return t.planName;
      case '{{level}}':
        return `${t.level.toUpperCase()} LEVEL`;
      case '{{total_credits}}':
        return `${t.content.totalCredits} Credit Hours`;
      case '{{grading_type}}':
        return t.content.gradingType;
      case '{{score}}':
        return `${t.content.score}`;
      case '{{cgpa}}':
        return t.content.cgpa ? `${t.content.cgpa} / 4.00` : 'N/A';
      case '{{result}}':
        return t.content.result;
      case '{{status}}':
        return t.content.status.toUpperCase();
      case '{{issued_date}}':
        return t.content.issuedDate;
      case '{{completion_date}}':
        return t.content.completionDate;
      case '{{serial_number}}':
        return t.content.serialNumber;
      case '{{verification_code}}':
        return t.content.verificationCode;
      case '{{org_name}}':
        return t.orgName;
      case '{{lms_name}}':
        return t.lmsName;
      case '{{signatory_name}}':
        return 'Farhana Ahmed';
      case '{{signatory_designation}}':
        return 'Dean of Academic Affairs & Certification';
      case '{{academic_remarks}}':
        return t.content.remarks || 'Standard verified academic record.';
      default:
        return token;
    }
  }

  getAlignFlexClass(align?: string): string {
    switch (align) {
      case 'center':
        return 'justify-center text-center';
      case 'right':
        return 'justify-end text-right';
      default:
        return 'justify-start text-left';
    }
  }

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
