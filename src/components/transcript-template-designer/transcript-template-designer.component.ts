import { Component, ChangeDetectionStrategy, inject, signal, computed, output, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomSelectComponent, SelectOption } from '../custom-select/custom-select.component';
import { LmsDataService } from '../../services/lms-data.service';
import {
  TranscriptTemplate,
  TranscriptCanvasElement,
  TranscriptPlaceholderToken,
  TRANSCRIPT_PLACEHOLDER_TOKENS,
  INITIAL_TRANSCRIPT_TEMPLATES
} from '../../models/transcript.model';

export const SAMPLE_TRANSCRIPT_BACKGROUNDS = [
  {
    name: 'Executive Classic Academic',
    url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1600&q=80',
    description: 'Formal double border with subtle parchment texture'
  },
  {
    name: 'Modern Navy & Slate Enterprise',
    url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=1600&q=80',
    description: 'Clean crisp geometric border for corporate certifications'
  },
  {
    name: 'Clean Academic Minimalist',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    description: 'Pure white canvas with subtle watermark'
  },
  {
    name: 'Silver Tech Directorate',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
    description: 'Technical grid watermark with security guilloche border'
  }
];

export const MOCK_SAMPLE_EVALUATION: Record<string, string> = {
  '{{trainee_name}}': 'Farhana Yeasmin',
  '{{trainee_id}}': 'BRAC-EMP-9021',
  '{{trainee_email}}': 'farhana.yeasmin@brac.net',
  '{{department}}': 'Program Quality & Microfinance Ops',
  '{{designation}}': 'Senior Field Operations Officer',
  '{{scope_name}}': 'Branch Operations Leadership & Financial Compliance',
  '{{plan_name}}': '2026 Microfinance Branch Transformation & Ethics Plan',
  '{{level}}': 'PLAN LEVEL',
  '{{total_credits}}': '18.0 Credit Hours',
  '{{grading_type}}': 'LETTER GRADE (GPA)',
  '{{score}}': '94.5',
  '{{cgpa}}': '3.92 / 4.00',
  '{{result}}': 'DISTINCTION (HIGH HONORS)',
  '{{status}}': 'PASS',
  '{{issued_date}}': '15/02/2026',
  '{{completion_date}}': '12/02/2026',
  '{{serial_number}}': 'TR-2026-BRAC-001',
  '{{verification_code}}': 'SEC-BRAC-99218',
  '{{org_name}}': 'BRAC Global Microfinance',
  '{{lms_name}}': 'OneLMS Academic Directorate',
  '{{signatory_name}}': 'Dr. Tariqul Islam',
  '{{signatory_designation}}': 'Dean of Academic Affairs & Accreditation',
  '{{academic_remarks}}': 'Candidate demonstrated exceptional mastery across credit risk assessment, field governance, and branch operational integrity.'
};

@Component({
  selector: 'app-transcript-template-designer',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CustomSelectComponent],
  template: `
    <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-modal-backdrop">
      <div class="relative bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[1550px] h-[94vh] flex flex-col overflow-hidden animate-modal-card m-auto">
        
        <!-- Top Navigation & Actions Bar -->
        <div class="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 flex-wrap">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-tenant-50 border border-tenant-200 flex items-center justify-center text-tenant-600 shrink-0">
              <span class="material-symbols-outlined text-xl">dashboard_customize</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-black text-slate-900 tracking-tight">
                  Drag & Drop Transcript Template Designer
                </h2>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tenant-100 text-tenant-800 border border-tenant-200">
                  STUDIO v2.0
                </span>
              </div>
              <p class="text-xs text-slate-500">
                Drag placeholders & layout components directly onto the academic canvas to customize transcripts.
              </p>
            </div>
          </div>

          <!-- Template Selector & Fast Actions -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <!-- Custom Template Select -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-600">Template:</span>
              <div class="w-60 sm:w-72">
                <app-custom-select
                  [options]="templateOptions()"
                  [value]="activeTemplate().id"
                  (valueChange)="loadTemplate($event)"
                  [clearable]="false"
                  [searchable]="false"
                  size="sm"
                  placeholder="Select Template..."
                />
              </div>
            </div>

            <!-- New Blank / Duplicate -->
            <button
              type="button"
              (click)="createNewTemplate()"
              class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-2xs"
            >
              <span class="material-symbols-outlined text-sm">add_circle</span>
              <span class="hidden sm:inline">New Draft</span>
            </button>

            <!-- Sample Data Preview Toggle -->
            <button
              type="button"
              (click)="previewSampleData.set(!previewSampleData())"
              class="px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer shadow-2xs"
              [class]="previewSampleData() ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'"
            >
              <span class="material-symbols-outlined text-sm text-amber-600">visibility</span>
              <span>{{ previewSampleData() ? 'Showing Live Sample' : 'Token Placeholders' }}</span>
            </button>

            <!-- Set as Default -->
            <button
              type="button"
              (click)="setDefault()"
              [disabled]="activeTemplate().isDefault"
              class="px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer shadow-2xs"
              [class]="activeTemplate().isDefault ? 'bg-emerald-50 text-emerald-700 border-emerald-200 opacity-80 cursor-default' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'"
            >
              <span class="material-symbols-outlined text-sm" [class.text-emerald-600]="activeTemplate().isDefault">star</span>
              <span>{{ activeTemplate().isDefault ? 'Default' : 'Set Default' }}</span>
            </button>

            <!-- Save Template -->
            <button
              type="button"
              (click)="saveCurrentTemplate()"
              class="px-4 py-2 bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <span class="material-symbols-outlined text-sm">save</span>
              <span>Save Template</span>
            </button>

            <!-- Close Modal -->
            <button
              type="button"
              (click)="close.emit()"
              class="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <!-- Main Workspace (3-Column Layout: Placeholders Palette | Visual Canvas | Inspector) -->
        <div class="flex-1 flex overflow-hidden">
          
          <!-- LEFT COLUMN: Placeholders & Layout Components Palette -->
          <div class="w-80 bg-slate-50/90 border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
            
            <!-- Palette Tabs -->
            <div class="p-3 border-b border-slate-200 flex items-center gap-1">
              <button
                type="button"
                (click)="paletteTab.set('tokens')"
                class="flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all cursor-pointer"
                [class]="paletteTab() === 'tokens' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'"
              >
                Placeholders
              </button>
              <button
                type="button"
                (click)="paletteTab.set('components')"
                class="flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all cursor-pointer"
                [class]="paletteTab() === 'components' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'"
              >
                Components
              </button>
              <button
                type="button"
                (click)="paletteTab.set('backgrounds')"
                class="flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all cursor-pointer"
                [class]="paletteTab() === 'backgrounds' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'"
              >
                Themes
              </button>
            </div>

            <!-- Palette Content Area -->
            <div class="flex-1 overflow-y-auto p-3.5 space-y-4">
              
              <!-- 1. Tokens List -->
              @if (paletteTab() === 'tokens') {
                <div class="space-y-4">
                  <!-- Token Category Filter / Search -->
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-sm">search</span>
                    <input
                      type="text"
                      [ngModel]="tokenSearch()"
                      (ngModelChange)="tokenSearch.set($event)"
                      placeholder="Search tokens (name, score, code)..."
                      class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tenant-500"
                    />
                  </div>

                  <!-- Grouped Tokens -->
                  @for (category of tokenCategories; track category.id) {
                    @if (filteredTokensByCategory(category.id).length > 0) {
                      <div class="space-y-1.5">
                        <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-xs">{{ category.icon }}</span>
                          <span>{{ category.name }}</span>
                        </div>

                        <div class="grid grid-cols-1 gap-1.5">
                          @for (token of filteredTokensByCategory(category.id); track token.token) {
                            <div
                              draggable="true"
                              (dragstart)="onTokenDragStart($event, token)"
                              (click)="addPlaceholderElement(token)"
                              class="p-2 bg-white hover:bg-tenant-50/60 border border-slate-200 hover:border-tenant-300 rounded-xl transition-all cursor-grab active:cursor-grabbing flex items-center justify-between group shadow-2xs"
                              title="Click or drag onto canvas"
                            >
                              <div class="space-y-0.5 min-w-0 pr-2">
                                <div class="text-xs font-bold text-slate-800 truncate group-hover:text-tenant-700">
                                  {{ token.label }}
                                </div>
                                <div class="text-[10px] font-mono text-slate-400 truncate">
                                  {{ token.token }}
                                </div>
                              </div>
                              <span class="material-symbols-outlined text-slate-300 group-hover:text-tenant-600 text-base shrink-0">
                                add_circle
                              </span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  }
                </div>
              }

              <!-- 2. Components List -->
              @if (paletteTab() === 'components') {
                <div class="space-y-3">
                  <p class="text-xs text-slate-500 leading-relaxed">
                    Add standard academic structures, evaluation matrices, signature blocks, and decorative borders.
                  </p>

                  <!-- Performance Breakdown Table -->
                  <div
                    (click)="addPerformanceTableElement()"
                    class="p-3 bg-white hover:bg-tenant-50/60 border border-slate-200 hover:border-tenant-300 rounded-2xl transition-all cursor-pointer group shadow-2xs space-y-1.5"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-slate-800 font-bold text-xs group-hover:text-tenant-700">
                        <span class="material-symbols-outlined text-tenant-600 text-lg">table_chart</span>
                        <span>Performance Breakdown Table</span>
                      </div>
                      <span class="material-symbols-outlined text-slate-300 group-hover:text-tenant-600 text-base">add_circle</span>
                    </div>
                    <p class="text-[11px] text-slate-400">
                      Renders all courses/modules, credits, scores, letter grades, and pass/fail statuses dynamically.
                    </p>
                  </div>

                  <!-- Custom Static Text Box -->
                  <div
                    (click)="addStaticTextElement()"
                    class="p-3 bg-white hover:bg-tenant-50/60 border border-slate-200 hover:border-tenant-300 rounded-2xl transition-all cursor-pointer group shadow-2xs space-y-1.5"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-slate-800 font-bold text-xs group-hover:text-tenant-700">
                        <span class="material-symbols-outlined text-blue-600 text-lg">title</span>
                        <span>Custom Static Text Label</span>
                      </div>
                      <span class="material-symbols-outlined text-slate-300 group-hover:text-tenant-600 text-base">add_circle</span>
                    </div>
                    <p class="text-[11px] text-slate-400">
                      Add institution titles, department disclaimers, headings, or custom static copy.
                    </p>
                  </div>

                  <!-- QR Verification Badge -->
                  <div
                    (click)="addQrElement()"
                    class="p-3 bg-white hover:bg-tenant-50/60 border border-slate-200 hover:border-tenant-300 rounded-2xl transition-all cursor-pointer group shadow-2xs space-y-1.5"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-slate-800 font-bold text-xs group-hover:text-tenant-700">
                        <span class="material-symbols-outlined text-purple-600 text-lg">qr_code_2</span>
                        <span>Security QR Code Block</span>
                      </div>
                      <span class="material-symbols-outlined text-slate-300 group-hover:text-tenant-600 text-base">add_circle</span>
                    </div>
                    <p class="text-[11px] text-slate-400">
                      Digital authenticity scanner code linking to secure verification portal.
                    </p>
                  </div>

                  <!-- Divider Horizontal Line -->
                  <div
                    (click)="addDividerElement()"
                    class="p-3 bg-white hover:bg-tenant-50/60 border border-slate-200 hover:border-tenant-300 rounded-2xl transition-all cursor-pointer group shadow-2xs space-y-1.5"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-slate-800 font-bold text-xs group-hover:text-tenant-700">
                        <span class="material-symbols-outlined text-slate-600 text-lg">horizontal_rule</span>
                        <span>Horizontal Divider Rule</span>
                      </div>
                      <span class="material-symbols-outlined text-slate-300 group-hover:text-tenant-600 text-base">add_circle</span>
                    </div>
                    <p class="text-[11px] text-slate-400">
                      Subtle decorative accent line for section separation.
                    </p>
                  </div>
                </div>
              }

              <!-- 3. Themes & Backgrounds List -->
              @if (paletteTab() === 'backgrounds') {
                <div class="space-y-3">
                  <p class="text-xs text-slate-500">
                    Select a high-resolution background texture with formal academic borders.
                  </p>

                  <div class="space-y-2.5">
                    @for (bg of backgroundPresets; track bg.url) {
                      <div
                        (click)="setBackground(bg.url)"
                        class="p-2 bg-white rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-2xs hover:border-tenant-500"
                        [class]="activeTemplate().backgroundUrl === bg.url ? 'border-tenant-500 ring-2 ring-tenant-500/20' : 'border-slate-200'"
                      >
                        <div class="h-24 w-full rounded-xl overflow-hidden bg-slate-100 relative">
                          <img [src]="bg.url" alt="Preset" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                          @if (activeTemplate().backgroundUrl === bg.url) {
                            <div class="absolute inset-0 bg-tenant-900/30 flex items-center justify-center text-white">
                              <span class="material-symbols-outlined text-2xl drop-shadow">check_circle</span>
                            </div>
                          }
                        </div>
                        <div class="text-xs font-bold text-slate-900">{{ bg.name }}</div>
                        <div class="text-[10px] text-slate-500">{{ bg.description }}</div>
                      </div>
                    }
                  </div>
                </div>
              }

            </div>
          </div>

          <!-- MIDDLE COLUMN: Visual Interactive Canvas (Drag & Drop + Element Manipulation) -->
          <div class="flex-1 bg-slate-100 flex flex-col overflow-hidden relative">
            
            <!-- Canvas Toolbar (Zoom, Grid, Coordinates) -->
            <div class="px-4 py-2 bg-white/80 backdrop-blur-xs border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <div class="flex items-center gap-3">
                <span class="font-bold text-slate-800">{{ activeTemplate().name }}</span>
                <span class="text-slate-300">|</span>
                <span class="font-mono text-[11px] text-slate-500">A4 Portrait ({{ canvasWidthPx }} × {{ canvasHeightPx }}px)</span>
              </div>

              <div class="flex items-center gap-2">
                <!-- Delete Selected Element -->
                @if (selectedElementId()) {
                  <button
                    type="button"
                    (click)="deleteSelectedElement()"
                    class="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 border border-rose-200 transition-all cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-sm">delete</span>
                    <span>Remove Selected</span>
                  </button>
                }

                <!-- Clear Canvas -->
                <button
                  type="button"
                  (click)="resetTemplateToDefault()"
                  class="px-2 py-1 text-slate-500 hover:text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Reset Layout
                </button>
              </div>
            </div>

            <!-- Canvas Viewport with Pan & Scroll -->
            <div
              class="flex-1 overflow-auto p-6 flex items-center justify-center"
              (dragover)="onCanvasDragOver($event)"
              (drop)="onCanvasDrop($event)"
              (click)="deselectElement($event)"
            >
              <div
                id="designer-canvas-board"
                class="relative bg-white shadow-2xl overflow-hidden border border-slate-300 transition-all select-none"
                [style.width.px]="canvasWidthPx"
                [style.height.px]="canvasHeightPx"
                (mousemove)="onCanvasMouseMove($event)"
                (mouseup)="onCanvasMouseUp()"
              >
                <!-- Background Image Layer -->
                @if (activeTemplate().backgroundUrl) {
                  <img
                    [src]="activeTemplate().backgroundUrl"
                    alt="Background"
                    class="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
                    referrerpolicy="no-referrer"
                  />
                }

                <!-- Watermark Center Shield -->
                <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <span class="material-symbols-outlined text-[320px] text-slate-900">verified</span>
                </div>

                <!-- Canvas Elements Render Loop -->
                @for (el of activeTemplate().elements; track el.id) {
                  <div
                    [id]="'el-' + el.id"
                    (mousedown)="onElementMouseDown($event, el)"
                    (click)="$event.stopPropagation(); selectElement(el.id)"
                    class="absolute cursor-move transition-shadow"
                    [class.ring-2]="selectedElementId() === el.id"
                    [class.ring-tenant-500]="selectedElementId() === el.id"
                    [class.ring-offset-1]="selectedElementId() === el.id"
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
                    <!-- Content Renderer by Element Kind -->
                    
                    <!-- 1. Static Text -->
                    @if (el.kind === 'static-text') {
                      <div class="w-full h-full flex items-center" [class]="getAlignFlexClass(el.style.align)">
                        {{ el.text }}
                      </div>
                    }

                    <!-- 2. Divider Rule -->
                    @if (el.kind === 'divider') {
                      <div class="w-full h-[1.5px] bg-slate-300 my-auto"></div>
                    }

                    <!-- 3. QR Code -->
                    @if (el.kind === 'qr' || el.token === '{{verification_qr}}') {
                      <div class="w-full h-full p-1 bg-white border border-slate-300 rounded flex flex-col items-center justify-center shadow-xs">
                        <span class="material-symbols-outlined text-3xl text-slate-900">qr_code_2</span>
                        <span class="text-[8px] font-mono font-bold text-slate-700 tracking-tighter">VERIFIED</span>
                      </div>
                    }

                    <!-- 4. Performance Table Structure -->
                    @if (el.kind === 'performance-table') {
                      <div class="w-full h-full overflow-hidden border border-slate-300/80 rounded-lg bg-white/95 shadow-2xs flex flex-col text-left">
                        <table class="w-full text-[9px] border-collapse">
                          <thead>
                            <tr class="bg-slate-900 text-white font-bold text-[8.5px] uppercase">
                              <th class="py-1.5 px-2">Code</th>
                              <th class="py-1.5 px-2">Curriculum Component</th>
                              <th class="py-1.5 px-1 text-center">Credits</th>
                              <th class="py-1.5 px-1 text-right">Score</th>
                              <th class="py-1.5 px-1 text-center">Grade</th>
                              <th class="py-1.5 px-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-200">
                            <tr>
                              <td class="py-1 px-2 font-mono font-bold text-slate-600">MF-101</td>
                              <td class="py-1 px-2 font-semibold text-slate-900 truncate max-w-[160px]">Credit Risk Assessment</td>
                              <td class="py-1 px-1 text-center font-mono">3.0</td>
                              <td class="py-1 px-1 text-right font-mono font-bold">95/100</td>
                              <td class="py-1 px-1 text-center font-mono font-extrabold text-slate-900">A+</td>
                              <td class="py-1 px-2 text-center font-bold text-emerald-600">PASS</td>
                            </tr>
                            <tr>
                              <td class="py-1 px-2 font-mono font-bold text-slate-600">MF-202</td>
                              <td class="py-1 px-2 font-semibold text-slate-900 truncate max-w-[160px]">Micro-Enterprise Governance</td>
                              <td class="py-1 px-1 text-center font-mono">4.0</td>
                              <td class="py-1 px-1 text-right font-mono font-bold">92/100</td>
                              <td class="py-1 px-1 text-center font-mono font-extrabold text-slate-900">A</td>
                              <td class="py-1 px-2 text-center font-bold text-emerald-600">PASS</td>
                            </tr>
                            <tr>
                              <td class="py-1 px-2 font-mono font-bold text-slate-600">ETH-301</td>
                              <td class="py-1 px-2 font-semibold text-slate-900 truncate max-w-[160px]">Financial Compliance & Ethics</td>
                              <td class="py-1 px-1 text-center font-mono">3.0</td>
                              <td class="py-1 px-1 text-right font-mono font-bold">97/100</td>
                              <td class="py-1 px-1 text-center font-mono font-extrabold text-slate-900">A+</td>
                              <td class="py-1 px-2 text-center font-bold text-emerald-600">PASS</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    }

                    <!-- 5. Dynamic Placeholder Token -->
                    @if (el.kind === 'placeholder' && el.token !== '{{verification_qr}}') {
                      <div class="w-full h-full flex items-center" [class]="getAlignFlexClass(el.style.align)">
                        @if (previewSampleData()) {
                          <span class="truncate">{{ evaluateToken(el.token || '') }}</span>
                        } @else {
                          <span class="bg-tenant-50/70 border border-tenant-200/80 px-1 py-0.5 rounded text-[10px] font-mono text-tenant-800 font-bold truncate">
                            {{ el.token }}
                          </span>
                        }
                      </div>
                    }

                    <!-- Resize Handle on Active Selection -->
                    @if (selectedElementId() === el.id) {
                      <div
                        (mousedown)="onResizeMouseDown($event, el)"
                        class="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-tenant-600 border-2 border-white rounded-full cursor-se-resize shadow-md"
                        title="Drag to resize element width & height"
                      ></div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Element Inspector & Typography Toolbar -->
          <div class="w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto p-4 space-y-5 shrink-0">
            
            <div class="border-b border-slate-200 pb-3">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-900">
                Element Inspector & Styling
              </h3>
              <p class="text-[11px] text-slate-500">
                Customize typography, layout geometry, colors, and coordinates.
              </p>
            </div>

            @if (selectedElement(); as sel) {
              <div class="space-y-4 text-xs">
                
                <!-- Element Type Header -->
                <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span class="font-extrabold uppercase text-[10px] tracking-wider text-slate-500">Selected</span>
                  <span class="font-bold text-slate-900 capitalize">{{ sel.kind }}</span>
                </div>

                <!-- Static Text Input if Kind === static-text -->
                @if (sel.kind === 'static-text') {
                  <div class="space-y-1">
                    <label class="font-bold text-slate-700">Text Content</label>
                    <textarea
                      [ngModel]="sel.text"
                      (ngModelChange)="updateSelectedProperty('text', $event)"
                      rows="2"
                      class="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-tenant-500"
                    ></textarea>
                  </div>
                }

                <!-- Token Display if Kind === placeholder -->
                @if (sel.kind === 'placeholder') {
                  <div class="space-y-1">
                    <label class="font-bold text-slate-700">Associated Placeholder Token</label>
                    <input
                      type="text"
                      [value]="sel.token"
                      readonly
                      class="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-tenant-800 font-bold"
                    />
                  </div>
                }

                <!-- Font Family -->
                <div class="space-y-1">
                  <label class="font-bold text-slate-700">Typography Font</label>
                  <app-custom-select
                    [options]="fontOptions"
                    [value]="sel.style.fontFamily"
                    (valueChange)="updateSelectedStyle('fontFamily', $event)"
                    [clearable]="false"
                    [searchable]="false"
                    size="sm"
                    placeholder="Select Font..."
                  />
                </div>

                <!-- Font Size & Formatting Row -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="font-bold text-slate-700">Size (pt)</label>
                    <input
                      type="number"
                      [ngModel]="sel.style.fontSizePt"
                      (ngModelChange)="updateSelectedStyle('fontSizePt', +$event)"
                      min="6"
                      max="72"
                      class="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div class="space-y-1">
                    <label class="font-bold text-slate-700">Text Color</label>
                    <div class="flex items-center gap-1.5">
                      <input
                        type="color"
                        [ngModel]="sel.style.color"
                        (ngModelChange)="updateSelectedStyle('color', $event)"
                        class="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        [ngModel]="sel.style.color"
                        (ngModelChange)="updateSelectedStyle('color', $event)"
                        class="w-full p-1.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                <!-- Style Toggles (Bold, Italic, Underline, Alignment) -->
                <div class="space-y-1">
                  <label class="font-bold text-slate-700">Style & Alignment</label>
                  <div class="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      (click)="updateSelectedStyle('bold', !sel.style.bold)"
                      [class]="sel.style.bold ? 'bg-white text-slate-900 font-black shadow-xs' : 'text-slate-500'"
                      class="p-1.5 rounded-lg flex-1 text-center font-serif text-sm transition-all"
                      title="Toggle Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      (click)="updateSelectedStyle('italic', !sel.style.italic)"
                      [class]="sel.style.italic ? 'bg-white text-slate-900 font-black shadow-xs' : 'text-slate-500'"
                      class="p-1.5 rounded-lg flex-1 text-center italic font-serif text-sm transition-all"
                      title="Toggle Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      (click)="updateSelectedStyle('underline', !sel.style.underline)"
                      [class]="sel.style.underline ? 'bg-white text-slate-900 font-black shadow-xs' : 'text-slate-500'"
                      class="p-1.5 rounded-lg flex-1 text-center underline font-serif text-sm transition-all"
                      title="Toggle Underline"
                    >
                      U
                    </button>
                    <div class="w-px h-4 bg-slate-300 mx-0.5"></div>
                    <button
                      type="button"
                      (click)="updateSelectedStyle('align', 'left')"
                      [class]="sel.style.align === 'left' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'"
                      class="p-1.5 rounded-lg flex-1 text-center transition-all"
                      title="Align Left"
                    >
                      <span class="material-symbols-outlined text-sm">format_align_left</span>
                    </button>
                    <button
                      type="button"
                      (click)="updateSelectedStyle('align', 'center')"
                      [class]="sel.style.align === 'center' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'"
                      class="p-1.5 rounded-lg flex-1 text-center transition-all"
                      title="Align Center"
                    >
                      <span class="material-symbols-outlined text-sm">format_align_center</span>
                    </button>
                    <button
                      type="button"
                      (click)="updateSelectedStyle('align', 'right')"
                      [class]="sel.style.align === 'right' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'"
                      class="p-1.5 rounded-lg flex-1 text-center transition-all"
                      title="Align Right"
                    >
                      <span class="material-symbols-outlined text-sm">format_align_right</span>
                    </button>
                  </div>
                </div>

                <!-- Position Coordinates (X, Y, W, H in %) -->
                <div class="space-y-1 pt-2 border-t border-slate-200">
                  <label class="font-bold text-slate-700">Coordinates & Dimensions (%)</label>
                  <div class="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div>
                      <span class="text-slate-400 text-[10px]">X (Left %):</span>
                      <input
                        type="number"
                        [ngModel]="round(sel.x)"
                        (ngModelChange)="updateSelectedProperty('x', +$event)"
                        step="1"
                        min="0"
                        max="95"
                        class="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <span class="text-slate-400 text-[10px]">Y (Top %):</span>
                      <input
                        type="number"
                        [ngModel]="round(sel.y)"
                        (ngModelChange)="updateSelectedProperty('y', +$event)"
                        step="1"
                        min="0"
                        max="95"
                        class="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <span class="text-slate-400 text-[10px]">Width %:</span>
                      <input
                        type="number"
                        [ngModel]="round(sel.w)"
                        (ngModelChange)="updateSelectedProperty('w', +$event)"
                        step="1"
                        min="5"
                        max="98"
                        class="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <span class="text-slate-400 text-[10px]">Height %:</span>
                      <input
                        type="number"
                        [ngModel]="round(sel.h)"
                        (ngModelChange)="updateSelectedProperty('h', +$event)"
                        step="1"
                        min="2"
                        max="80"
                        class="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                  </div>
                </div>

                <!-- Z-Index Layering -->
                <div class="space-y-1 pt-2 border-t border-slate-200">
                  <label class="font-bold text-slate-700">Layer Order (Z-Index)</label>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="updateSelectedProperty('z', sel.z - 1)"
                      class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700"
                    >
                      Send Down
                    </button>
                    <span class="font-mono font-bold text-slate-800 px-2">{{ sel.z }}</span>
                    <button
                      type="button"
                      (click)="updateSelectedProperty('z', sel.z + 1)"
                      class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700"
                    >
                      Bring Up
                    </button>
                  </div>
                </div>

              </div>
            } @else {
              <div class="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                <span class="material-symbols-outlined text-4xl text-slate-300">touch_app</span>
                <p class="text-xs font-semibold">
                  Click on any element in the canvas or drag a placeholder token to view styling properties.
                </p>
              </div>
            }

          </div>

        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscriptTemplateDesignerComponent implements OnInit {
  lms = inject(LmsDataService);

  initialTemplateId = input<string | undefined>();
  close = output<void>();
  templateSaved = output<TranscriptTemplate>();

  tokenList: TranscriptPlaceholderToken[] = TRANSCRIPT_PLACEHOLDER_TOKENS.map(t => ({
    ...t,
    token: t.token || t.key
  }));
  backgroundPresets = SAMPLE_TRANSCRIPT_BACKGROUNDS;
  
  paletteTab = signal<'tokens' | 'components' | 'backgrounds'>('tokens');
  tokenSearch = signal<string>('');
  previewSampleData = signal<boolean>(true);

  // Active Template State
  activeTemplate = signal<TranscriptTemplate>(INITIAL_TRANSCRIPT_TEMPLATES[0]);
  selectedElementId = signal<string | null>(null);

  // Canvas Reference Dimensions (A4 Portrait)
  canvasWidthPx = 794;
  canvasHeightPx = 1123;

  // Dragging State for canvas elements
  private isDraggingElement = false;
  private isResizingElement = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialElX = 0;
  private initialElY = 0;
  private initialElW = 0;
  private initialElH = 0;

  tokenCategories = [
    { id: 'trainee', name: 'Trainee Identity', icon: 'person' },
    { id: 'scope', name: 'Curriculum & Scope', icon: 'school' },
    { id: 'performance', name: 'Grades & Assessment', icon: 'assessment' },
    { id: 'verification', name: 'Security & Verification', icon: 'verified' },
    { id: 'signatory', name: 'Signatories & Remarks', icon: 'history_edu' }
  ];

  fontOptions: SelectOption[] = [
    { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display (Serif)' },
    { value: "'Cinzel', serif", label: 'Cinzel (Formal Trajan)' },
    { value: "'Plus Jakarta Sans', sans-serif", label: 'Plus Jakarta Sans' },
    { value: "'Montserrat', sans-serif", label: 'Montserrat' },
    { value: "'Inter', sans-serif", label: 'Inter (Modern Sans)' },
    { value: "'Courier Prime', monospace", label: 'Courier Prime (Monospace)' }
  ];

  templateList = computed(() => this.lms.transcriptTemplates());

  templateOptions = computed<SelectOption[]>(() => {
    return this.templateList().map(tpl => ({
      value: tpl.id,
      label: tpl.name,
      badge: tpl.isDefault ? 'Default' : undefined,
      badgeClass: tpl.isDefault ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : undefined
    }));
  });

  selectedElement = computed<TranscriptCanvasElement | null>(() => {
    const id = this.selectedElementId();
    if (!id) return null;
    return this.activeTemplate().elements.find(e => e.id === id) || null;
  });

  ngOnInit(): void {
    const targetId = this.initialTemplateId() || this.lms.activeTranscriptTemplateId();
    this.loadTemplate(targetId);
  }

  loadTemplate(id: string): void {
    const t = this.lms.transcriptTemplates().find(item => item.id === id);
    if (t) {
      this.activeTemplate.set(JSON.parse(JSON.stringify(t)));
      this.selectedElementId.set(null);
    }
  }

  filteredTokensByCategory(category: string): TranscriptPlaceholderToken[] {
    const search = this.tokenSearch().toLowerCase().trim();
    return this.tokenList.filter(t => {
      const matchCat = t.category === category;
      if (!matchCat) return false;
      if (!search) return true;
      return t.label.toLowerCase().includes(search) || t.token.toLowerCase().includes(search);
    });
  }

  evaluateToken(token: string): string {
    return MOCK_SAMPLE_EVALUATION[token] || token;
  }

  round(num: number): number {
    return Math.round(num);
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

  // Element Selection
  selectElement(id: string): void {
    this.selectedElementId.set(id);
  }

  deselectElement(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.id === 'designer-canvas-board') {
      this.selectedElementId.set(null);
    }
  }

  // Adding Placeholders & Components to Canvas
  onTokenDragStart(event: DragEvent, token: TranscriptPlaceholderToken): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(token));
    }
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text/plain');
    if (!data) return;

    try {
      const token: TranscriptPlaceholderToken = JSON.parse(data);
      const canvasEl = document.getElementById('designer-canvas-board');
      if (!canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      const dropX = Math.max(2, Math.min(90, ((event.clientX - rect.left) / rect.width) * 100));
      const dropY = Math.max(2, Math.min(90, ((event.clientY - rect.top) / rect.height) * 100));

      this.addPlaceholderElement(token, dropX, dropY);
    } catch {
      // Fallback
    }
  }

  addPlaceholderElement(token: TranscriptPlaceholderToken, x = 20, y = 30): void {
    const newEl: TranscriptCanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kind: 'placeholder',
      token: token.token,
      x: x,
      y: y,
      w: 40,
      h: 4,
      z: (this.activeTemplate().elements.length || 0) + 1,
      style: {
        fontSizePt: 12,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: '#0f172a',
        bold: true,
        align: 'left'
      }
    };

    this.activeTemplate.update(t => ({
      ...t,
      elements: [...t.elements, newEl]
    }));
    this.selectedElementId.set(newEl.id);
  }

  addStaticTextElement(): void {
    const newEl: TranscriptCanvasElement = {
      id: `el-text-${Date.now()}`,
      kind: 'static-text',
      text: 'Academic Statement of Record',
      x: 15,
      y: 20,
      w: 70,
      h: 4,
      z: (this.activeTemplate().elements.length || 0) + 1,
      style: {
        fontSizePt: 16,
        fontFamily: "'Playfair Display', Georgia, serif",
        color: '#0f172a',
        bold: true,
        align: 'center'
      }
    };

    this.activeTemplate.update(t => ({
      ...t,
      elements: [...t.elements, newEl]
    }));
    this.selectedElementId.set(newEl.id);
  }

  addPerformanceTableElement(): void {
    const newEl: TranscriptCanvasElement = {
      id: `el-table-${Date.now()}`,
      kind: 'performance-table',
      x: 8,
      y: 40,
      w: 84,
      h: 26,
      z: (this.activeTemplate().elements.length || 0) + 1,
      style: {
        fontSizePt: 10,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: '#0f172a',
        align: 'left'
      }
    };

    this.activeTemplate.update(t => ({
      ...t,
      elements: [...t.elements, newEl]
    }));
    this.selectedElementId.set(newEl.id);
  }

  addQrElement(): void {
    const newEl: TranscriptCanvasElement = {
      id: `el-qr-${Date.now()}`,
      kind: 'qr',
      token: '{{verification_qr}}',
      x: 8,
      y: 84,
      w: 12,
      h: 8.5,
      z: (this.activeTemplate().elements.length || 0) + 1,
      style: {
        fontSizePt: 8,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: '#0f172a',
        align: 'center'
      }
    };

    this.activeTemplate.update(t => ({
      ...t,
      elements: [...t.elements, newEl]
    }));
    this.selectedElementId.set(newEl.id);
  }

  addDividerElement(): void {
    const newEl: TranscriptCanvasElement = {
      id: `el-div-${Date.now()}`,
      kind: 'divider',
      x: 8,
      y: 28,
      w: 84,
      h: 1,
      z: (this.activeTemplate().elements.length || 0) + 1,
      style: {
        fontSizePt: 10,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: '#cbd5e1',
        align: 'center'
      }
    };

    this.activeTemplate.update(t => ({
      ...t,
      elements: [...t.elements, newEl]
    }));
    this.selectedElementId.set(newEl.id);
  }

  setBackground(url: string): void {
    this.activeTemplate.update(t => ({
      ...t,
      backgroundUrl: url
    }));
  }

  // Interactive Mouse Dragging of Canvas Elements
  onElementMouseDown(event: MouseEvent, el: TranscriptCanvasElement): void {
    if ((event.target as HTMLElement).classList.contains('cursor-se-resize')) {
      return; // Handled by onResizeMouseDown
    }
    event.stopPropagation();
    this.isDraggingElement = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialElX = el.x;
    this.initialElY = el.y;
    this.selectedElementId.set(el.id);
  }

  onResizeMouseDown(event: MouseEvent, el: TranscriptCanvasElement): void {
    event.stopPropagation();
    this.isResizingElement = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialElW = el.w;
    this.initialElH = el.h;
    this.selectedElementId.set(el.id);
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.selectedElementId()) return;

    if (this.isDraggingElement) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;
      const deltaXPct = (deltaX / this.canvasWidthPx) * 100;
      const deltaYPct = (deltaY / this.canvasHeightPx) * 100;

      const newX = Math.max(0, Math.min(95, this.initialElX + deltaXPct));
      const newY = Math.max(0, Math.min(95, this.initialElY + deltaYPct));

      this.updateSelectedProperty('x', newX);
      this.updateSelectedProperty('y', newY);
    } else if (this.isResizingElement) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;
      const deltaWPct = (deltaX / this.canvasWidthPx) * 100;
      const deltaHPct = (deltaY / this.canvasHeightPx) * 100;

      const newW = Math.max(4, Math.min(98, this.initialElW + deltaWPct));
      const newH = Math.max(2, Math.min(90, this.initialElH + deltaHPct));

      this.updateSelectedProperty('w', newW);
      this.updateSelectedProperty('h', newH);
    }
  }

  onCanvasMouseUp(): void {
    this.isDraggingElement = false;
    this.isResizingElement = false;
  }

  updateSelectedProperty(prop: string, value: any): void {
    const id = this.selectedElementId();
    if (!id) return;

    this.activeTemplate.update(t => ({
      ...t,
      elements: t.elements.map(el => {
        if (el.id === id) {
          return { ...el, [prop]: value };
        }
        return el;
      })
    }));
  }

  updateSelectedStyle(prop: string, value: any): void {
    const id = this.selectedElementId();
    if (!id) return;

    this.activeTemplate.update(t => ({
      ...t,
      elements: t.elements.map(el => {
        if (el.id === id) {
          return {
            ...el,
            style: { ...el.style, [prop]: value }
          };
        }
        return el;
      })
    }));
  }

  deleteSelectedElement(): void {
    const id = this.selectedElementId();
    if (!id) return;

    this.activeTemplate.update(t => ({
      ...t,
      elements: t.elements.filter(el => el.id !== id)
    }));
    this.selectedElementId.set(null);
  }

  resetTemplateToDefault(): void {
    const initial = INITIAL_TRANSCRIPT_TEMPLATES[0];
    this.activeTemplate.set(JSON.parse(JSON.stringify(initial)));
    this.selectedElementId.set(null);
  }

  createNewTemplate(): void {
    const newDraft: TranscriptTemplate = {
      id: `tpl-transcript-${Date.now()}`,
      name: `Custom Academic Transcript Template #${this.templateList().length + 1}`,
      description: 'Customized drag-and-drop transcript template layout',
      orientation: 'portrait',
      paperSize: 'A4',
      isDefault: false,
      status: 'draft',
      createdBy: this.lms.currentUser().name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      backgroundUrl: SAMPLE_TRANSCRIPT_BACKGROUNDS[0].url,
      elements: [
        {
          id: 'el-head-org',
          kind: 'placeholder',
          token: '{{org_name}}',
          x: 8,
          y: 7,
          w: 84,
          h: 4.5,
          z: 1,
          style: {
            fontSizePt: 20,
            fontFamily: "'Playfair Display', Georgia, serif",
            color: '#0f172a',
            bold: true,
            align: 'center'
          }
        },
        {
          id: 'el-head-title',
          kind: 'static-text',
          text: 'ACADEMIC TRANSCRIPT RECORD',
          x: 8,
          y: 12,
          w: 84,
          h: 3,
          z: 2,
          style: {
            fontSizePt: 12,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#047857',
            bold: true,
            align: 'center'
          }
        },
        {
          id: 'el-div-1',
          kind: 'divider',
          x: 8,
          y: 16,
          w: 84,
          h: 1,
          z: 3,
          style: { fontSizePt: 10, color: '#0f172a', align: 'center' }
        },
        {
          id: 'el-trainee-name',
          kind: 'placeholder',
          token: '{{trainee_name}}',
          x: 8,
          y: 20,
          w: 84,
          h: 4,
          z: 4,
          style: {
            fontSizePt: 16,
            fontFamily: "'Playfair Display', Georgia, serif",
            color: '#0f172a',
            bold: true,
            align: 'center'
          }
        },
        {
          id: 'el-scope-name',
          kind: 'placeholder',
          token: '{{scope_name}}',
          x: 8,
          y: 25,
          w: 84,
          h: 3.5,
          z: 5,
          style: {
            fontSizePt: 12,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#334155',
            bold: true,
            align: 'center'
          }
        },
        {
          id: 'el-table',
          kind: 'performance-table',
          x: 8,
          y: 33,
          w: 84,
          h: 30,
          z: 6,
          style: { fontSizePt: 10, align: 'left' }
        },
        {
          id: 'el-res-box',
          kind: 'placeholder',
          token: '{{result}}',
          x: 8,
          y: 67,
          w: 40,
          h: 6,
          z: 7,
          style: {
            fontSizePt: 14,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#047857',
            bold: true,
            align: 'center',
            backgroundColor: '#f0fdf4',
            borderColor: '#bbf7d0',
            borderWidthPx: 1,
            borderRadiusPx: 8
          }
        },
        {
          id: 'el-score-box',
          kind: 'placeholder',
          token: '{{score}}',
          x: 52,
          y: 67,
          w: 40,
          h: 6,
          z: 8,
          style: {
            fontSizePt: 14,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#0f172a',
            bold: true,
            align: 'center',
            backgroundColor: '#f8fafc',
            borderColor: '#e2e8f0',
            borderWidthPx: 1,
            borderRadiusPx: 8
          }
        },
        {
          id: 'el-qr',
          kind: 'qr',
          token: '{{verification_qr}}',
          x: 8,
          y: 84,
          w: 12,
          h: 9,
          z: 9,
          style: { fontSizePt: 8, align: 'center' }
        },
        {
          id: 'el-signatory',
          kind: 'placeholder',
          token: '{{signatory_name}}',
          x: 55,
          y: 87,
          w: 37,
          h: 3,
          z: 10,
          style: {
            fontSizePt: 11,
            fontFamily: "'Playfair Display', Georgia, serif",
            color: '#0f172a',
            bold: true,
            align: 'center'
          }
        },
        {
          id: 'el-signatory-desig',
          kind: 'placeholder',
          token: '{{signatory_designation}}',
          x: 55,
          y: 90.5,
          w: 37,
          h: 2.5,
          z: 11,
          style: {
            fontSizePt: 9,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#64748b',
            align: 'center'
          }
        }
      ]
    };

    this.activeTemplate.set(newDraft);
    this.selectedElementId.set(null);
  }

  setDefault(): void {
    const t = this.activeTemplate();
    this.lms.setDefaultTranscriptTemplate(t.id);
    this.activeTemplate.update(curr => ({ ...curr, isDefault: true }));
  }

  saveCurrentTemplate(): void {
    const updated = this.lms.saveTranscriptTemplate(this.activeTemplate());
    this.activeTemplate.set(updated);
    this.templateSaved.emit(updated);
  }
}
