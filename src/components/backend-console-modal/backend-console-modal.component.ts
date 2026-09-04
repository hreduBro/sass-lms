import { Component, ChangeDetectionStrategy, inject, output, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LmsApiService, BackendHealth } from '../../services/lms-api.service';
import { LmsDataService } from '../../services/lms-data.service';
import { NotificationService } from '../../services/notification.service';
import { StatusIllustrationComponent } from '../status-illustration/status-illustration.component';

@Component({
  selector: 'app-backend-console-modal',
  imports: [CommonModule, FormsModule, RouterModule, StatusIllustrationComponent],
  template: `
    <div (click)="onBackdropClick($event)" class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
      <div (click)="$event.stopPropagation()" class="bg-base-100 rounded-3xl border border-base-300 shadow-2xl w-full max-w-4xl p-6 animate-modal-card max-h-[92vh] flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-base-300">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">dns</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-base text-text-primary">Express Backend & API Server</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  REST API Active
                </span>
              </div>
              <p class="text-xs text-text-secondary">Multi-Tenant REST Endpoints, HTTP Interceptor & Status Screen Theming</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-text-secondary hover:text-text-primary p-1.5 rounded-xl hover:bg-base-200 transition-colors">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-1.5 border-b border-base-300 pt-3 pb-2 overflow-x-auto">
          <button 
            type="button" 
            (click)="activeTab.set('endpoints')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
            [class]="activeTab() === 'endpoints' ? 'bg-tenant-500 text-white shadow-xs' : 'text-text-secondary hover:text-text-primary hover:bg-base-200'">
            <span class="material-symbols-outlined text-sm">api</span>
            REST Endpoints
          </button>
          
          <button 
            type="button" 
            (click)="activeTab.set('interceptor')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
            [class]="activeTab() === 'interceptor' ? 'bg-tenant-500 text-white shadow-xs' : 'text-text-secondary hover:text-text-primary hover:bg-base-200'">
            <span class="material-symbols-outlined text-sm">filter_alt</span>
            HTTP Interceptor & Retries
          </button>

          <button 
            type="button" 
            (click)="activeTab.set('dialogs')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
            [class]="activeTab() === 'dialogs' ? 'bg-tenant-500 text-white shadow-xs' : 'text-text-secondary hover:text-text-primary hover:bg-base-200'">
            <span class="material-symbols-outlined text-sm">chat</span>
            Dialog Variants
          </button>

          <button 
            type="button" 
            (click)="activeTab.set('status-screens')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
            [class]="activeTab() === 'status-screens' ? 'bg-tenant-500 text-white shadow-xs' : 'text-text-secondary hover:text-text-primary hover:bg-base-200'">
            <span class="material-symbols-outlined text-sm">palette</span>
            Status Screens (Design Inspiration)
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto py-4 space-y-5">
          
          @if (activeTab() === 'endpoints') {
            <!-- Server Telemetry Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-3 rounded-2xl bg-base-200/60 border border-base-300">
                <div class="text-[10px] uppercase font-bold text-text-secondary">Server Status</div>
                <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base">check_circle</span>
                  Healthy (200 OK)
                </div>
                <div class="text-[10px] text-text-secondary mt-0.5">Express 5.x / ESM</div>
              </div>

              <div class="p-3 rounded-2xl bg-base-200/60 border border-base-300">
                <div class="text-[10px] uppercase font-bold text-text-secondary">API Latency</div>
                <div class="text-sm font-mono font-bold text-text-primary mt-1">
                  {{ api.lastLatencyMs() > 0 ? api.lastLatencyMs() + ' ms' : '< 12 ms' }}
                </div>
                <div class="text-[10px] text-text-secondary mt-0.5">Localhost / Cloud Run</div>
              </div>

              <div class="p-3 rounded-2xl bg-base-200/60 border border-base-300">
                <div class="text-[10px] uppercase font-bold text-text-secondary">Active Tenants</div>
                <div class="text-sm font-mono font-bold text-tenant-600 dark:text-tenant-300 mt-1">
                  {{ lms.tenants().length }} Workspaces
                </div>
                <div class="text-[10px] text-text-secondary mt-0.5">Isolated Schemas</div>
              </div>

              <div class="p-3 rounded-2xl bg-base-200/60 border border-base-300">
                <div class="text-[10px] uppercase font-bold text-text-secondary">AI Service</div>
                <div class="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                  <span class="material-symbols-outlined text-base">auto_awesome</span>
                  Gemini 3.7 Flash
                </div>
                <div class="text-[10px] text-text-secondary mt-0.5">Server-Side SDK</div>
              </div>
            </div>

            <!-- Interactive API Explorer -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-tenant-600">code</span>
                  Live API Endpoints & Request Inspector
                </h4>
                <button 
                  type="button" 
                  (click)="refreshTelemetry()"
                  class="text-[11px] font-semibold text-tenant-600 dark:text-tenant-300 hover:underline flex items-center gap-1 cursor-pointer">
                  <span class="material-symbols-outlined text-xs" [class.animate-spin]="isRefreshing()">sync</span>
                  Ping Server
                </button>
              </div>

              <!-- Endpoint Buttons Bar -->
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  (click)="testEndpoint('health')"
                  class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer flex items-center gap-1 select-none"
                  [class]="selectedEndpoint() === 'health' ? 'bg-tenant-500 text-white border-tenant-600 font-bold shadow-xs' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary hover:bg-base-300/60'">
                  <span class="text-[9px] font-bold px-1 rounded" [class]="selectedEndpoint() === 'health' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'">GET</span>
                  /api/health
                </button>

                <button
                  type="button"
                  (click)="testEndpoint('tenants')"
                  class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer flex items-center gap-1 select-none"
                  [class]="selectedEndpoint() === 'tenants' ? 'bg-tenant-500 text-white border-tenant-600 font-bold shadow-xs' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary hover:bg-base-300/60'">
                  <span class="text-[9px] font-bold px-1 rounded" [class]="selectedEndpoint() === 'tenants' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'">GET</span>
                  /api/tenants
                </button>

                <button
                  type="button"
                  (click)="testEndpoint('courses')"
                  class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer flex items-center gap-1 select-none"
                  [class]="selectedEndpoint() === 'courses' ? 'bg-tenant-500 text-white border-tenant-600 font-bold shadow-xs' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary hover:bg-base-300/60'">
                  <span class="text-[9px] font-bold px-1 rounded" [class]="selectedEndpoint() === 'courses' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'">GET</span>
                  /api/courses
                </button>

                <button
                  type="button"
                  (click)="testEndpoint('analytics')"
                  class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer flex items-center gap-1 select-none"
                  [class]="selectedEndpoint() === 'analytics' ? 'bg-tenant-500 text-white border-tenant-600 font-bold shadow-xs' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary hover:bg-base-300/60'">
                  <span class="text-[9px] font-bold px-1 rounded" [class]="selectedEndpoint() === 'analytics' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'">GET</span>
                  /api/analytics
                </button>

                <button
                  type="button"
                  (click)="testEndpoint('ai')"
                  class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer flex items-center gap-1 select-none"
                  [class]="selectedEndpoint() === 'ai' ? 'bg-tenant-500 text-white border-tenant-600 font-bold shadow-xs' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary hover:bg-base-300/60'">
                  <span class="text-[9px] font-bold px-1 rounded" [class]="selectedEndpoint() === 'ai' ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'">POST</span>
                  /api/ai/generate-course
                </button>
              </div>

              <!-- JSON Payload Response Display -->
              <div class="rounded-2xl bg-slate-950 p-4 border border-slate-800 text-slate-100 font-mono text-xs overflow-x-auto relative min-h-[180px] max-h-[280px]">
                <div class="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2 mb-2">
                  <div class="flex items-center gap-2">
                    <span>Response Status: <strong class="text-emerald-400">200 OK</strong></span>
                    @if (isLoading()) {
                      <span class="flex items-center gap-1 text-slate-400">
                        <span class="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
                        <span>Syncing...</span>
                      </span>
                    }
                  </div>
                  <span>Content-Type: application/json</span>
                </div>
                <pre class="text-[11px] leading-relaxed text-emerald-300 whitespace-pre-wrap font-mono">{{ responseData() }}</pre>
              </div>
            </div>
          }

          @if (activeTab() === 'interceptor') {
            <!-- HTTP Interceptor & Error Handler Testing Suite -->
            <div class="space-y-4">
              <div class="p-3.5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-tenant-600">tune</span>
                    Active Interceptor Rules
                  </span>
                  <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">appInterceptor Registered</span>
                </div>
                <p class="text-xs text-text-secondary leading-relaxed">
                  The interceptor monitors all HTTP requests, showing the global <code class="text-tenant-600 font-mono font-bold">NgxSpinner</code> loader, cleaning custom headers, performing automated exponential retries for 503 errors on GET requests (up to 3 times), and displaying formatted error dialogs via <code class="text-tenant-600 font-mono font-bold">NotificationService</code>.
                </p>
              </div>

              <!-- Error Code Test Actions -->
              <div>
                <h5 class="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">Trigger Intercepted Error Responses</h5>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button 
                    type="button" 
                    (click)="triggerHttpTest(401)"
                    class="p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 text-left transition-all cursor-pointer group">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-rose-700 dark:text-rose-400">401 Unauthorized</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">Session Error</span>
                    </div>
                    <p class="text-[11px] text-text-secondary mt-1">Triggers Session Error Dialog with reload callback</p>
                  </button>

                  <button 
                    type="button" 
                    (click)="triggerHttpTest(400)"
                    class="p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 text-left transition-all cursor-pointer group">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-amber-700 dark:text-amber-400">400 Bad Request</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">JSON Payload</span>
                    </div>
                    <p class="text-[11px] text-text-secondary mt-1">Triggers Invalid Request Dialog with server message</p>
                  </button>

                  <button 
                    type="button" 
                    (click)="triggerBlobTest()"
                    class="p-3 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/60 text-left transition-all cursor-pointer group">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-sky-700 dark:text-sky-400">400 Blob Response</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-200/60 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">extractBlobErrorMessage</span>
                    </div>
                    <p class="text-[11px] text-text-secondary mt-1">Parses binary octet stream and extracts error dialog</p>
                  </button>

                  <button 
                    type="button" 
                    (click)="triggerHttpTest(500)"
                    class="p-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/60 text-left transition-all cursor-pointer group">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-red-700 dark:text-red-400">500 Server Error</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-200/60 dark:bg-red-900/60 text-red-800 dark:text-red-300">Oops! Dialog</span>
                    </div>
                    <p class="text-[11px] text-text-secondary mt-1">Triggers Oops! Server Error Dialog</p>
                  </button>
                </div>
              </div>

              <!-- Retries and Header Exclusions -->
              <div>
                <h5 class="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">Loader & Retry Behavior</h5>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button 
                    type="button" 
                    (click)="triggerHttpTest(503)"
                    class="p-3 rounded-2xl border border-base-300 bg-base-200/40 hover:bg-base-200 text-left transition-all cursor-pointer">
                    <div class="text-xs font-bold text-text-primary flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm text-indigo-500">replay</span>
                      503 Auto-Retry
                    </div>
                    <p class="text-[11px] text-text-secondary mt-1">Retries GET up to 3 times on 503</p>
                  </button>

                  <button 
                    type="button" 
                    (click)="triggerLoaderTest()"
                    class="p-3 rounded-2xl border border-base-300 bg-base-200/40 hover:bg-base-200 text-left transition-all cursor-pointer">
                    <div class="text-xs font-bold text-text-primary flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm text-tenant-500">hourglass_top</span>
                      Delayed GET
                    </div>
                    <p class="text-[11px] text-text-secondary mt-1">Triggers NgxSpinner for 1.5s</p>
                  </button>

                  <button 
                    type="button" 
                    (click)="triggerNoLoaderTest()"
                    class="p-3 rounded-2xl border border-base-300 bg-base-200/40 hover:bg-base-200 text-left transition-all cursor-pointer">
                    <div class="text-xs font-bold text-text-primary flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm text-slate-500">visibility_off</span>
                      'no-loader' Header
                    </div>
                    <p class="text-[11px] text-text-secondary mt-1">Suppresses spinner loading overlay</p>
                  </button>
                </div>
              </div>

              <!-- Live Interceptor Status Log -->
              <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px]">
                <div class="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                  <span>Last Test Execution:</span>
                  <span class="text-emerald-400">{{ testStatus() }}</span>
                </div>
                <div class="text-slate-300 break-words">{{ testLog() }}</div>
              </div>

            </div>
          }

          @if (activeTab() === 'dialogs') {
            <!-- Notification Dialog Variants & Controls -->
            <div class="space-y-4">
              
              <!-- Dialog Dismissibility & Cross Button Controls -->
              <div class="p-4 rounded-2xl bg-base-200/80 border border-base-300 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div class="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-base" style="color: var(--tenant-primary);">tune</span>
                      Dialog Behavior Controls (Dismissible & Cross Button)
                    </div>
                    <p class="text-[11px] text-text-secondary mt-0.5">
                      Configure whether dialogs can be dismissed (via backdrop click or Escape) and whether the top-right cross ("×") button appears.
                    </p>
                  </div>

                  <!-- Real-time Status Badges -->
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span 
                      class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-2xs transition-all"
                      [class]="dialogDismissible() ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'">
                      {{ dialogDismissible() ? 'Dismissible: ALLOWED' : 'Dismissible: LOCKED' }}
                    </span>
                    <span 
                      class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-2xs transition-all"
                      [class]="dialogShowCloseButton() ? 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800' : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'">
                      {{ dialogShowCloseButton() ? 'Cross (×): SHOWN' : 'Cross (×): HIDDEN' }}
                    </span>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <!-- Dismissible Toggle Button -->
                  <button 
                    id="btn-toggle-dismissible"
                    type="button" 
                    (click)="toggleDismissible()"
                    class="p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    [class]="dialogDismissible() ? 'bg-base-100 border-tenant-500/50 shadow-2xs' : 'bg-base-100 border-base-300 hover:border-base-400'">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div 
                        class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                        [class]="dialogDismissible() ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'">
                        <span class="material-symbols-outlined text-lg">{{ dialogDismissible() ? 'lock_open' : 'lock' }}</span>
                      </div>
                      <div class="min-w-0">
                        <div class="text-xs font-bold text-text-primary">
                          Dismissible (Backdrop & ESC)
                        </div>
                        <p class="text-[11px] text-text-secondary truncate">
                          {{ dialogDismissible() ? 'Clicking outside / ESC closes dialog' : 'Clicking outside triggers shake alert' }}
                        </p>
                      </div>
                    </div>
                    <!-- Toggle Switch Pill -->
                    <div 
                      class="w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center"
                      [class]="dialogDismissible() ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'">
                      <div class="w-4 h-4 rounded-full bg-white shadow-xs"></div>
                    </div>
                  </button>

                  <!-- Cross Button Toggle Button -->
                  <button 
                    id="btn-toggle-cross-button"
                    type="button" 
                    (click)="toggleShowCloseButton()"
                    class="p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    [class]="dialogShowCloseButton() ? 'bg-base-100 border-tenant-500/50 shadow-2xs' : 'bg-base-100 border-base-300 hover:border-base-400'">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div 
                        class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                        [class]="dialogShowCloseButton() ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'bg-slate-500/15 text-slate-500'">
                        <span class="material-symbols-outlined text-lg">{{ dialogShowCloseButton() ? 'close' : 'cancel' }}</span>
                      </div>
                      <div class="min-w-0">
                        <div class="text-xs font-bold text-text-primary">
                          Top-Right Cross Button
                        </div>
                        <p class="text-[11px] text-text-secondary truncate">
                          {{ dialogShowCloseButton() ? 'Render "×" close icon in corner' : 'No cross button displayed' }}
                        </p>
                      </div>
                    </div>
                    <!-- Toggle Switch Pill -->
                    <div 
                      class="w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center"
                      [class]="dialogShowCloseButton() ? 'bg-sky-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'">
                      <div class="w-4 h-4 rounded-full bg-white shadow-xs"></div>
                    </div>
                  </button>
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-base-200/50 border border-base-300 space-y-1">
                <span class="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-tenant-600">style</span>
                  NotificationService Dialog Variants
                </span>
                <p class="text-xs text-text-secondary leading-relaxed">
                  Call dialog methods like <code class="text-tenant-600 font-mono font-bold">errorDialog()</code>, <code class="text-tenant-600 font-mono font-bold">warningDialog()</code>, <code class="text-tenant-600 font-mono font-bold">successDialog()</code>, <code class="text-tenant-600 font-mono font-bold">infoDialog()</code>, and <code class="text-tenant-600 font-mono font-bold">confirmDialog()</code>. Each returns a Promise resolving upon user acknowledgement or dismissal.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  type="button" 
                  (click)="showErrorVariant()"
                  class="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100/60 text-left transition-all cursor-pointer flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-2xl">error</span>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-rose-700 dark:text-rose-400">Error Dialog Variant</div>
                    <div class="text-[11px] text-text-secondary">notify.errorDialog(title, message)</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  (click)="showWarningVariant()"
                  class="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 text-left transition-all cursor-pointer flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-2xl">warning</span>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-amber-700 dark:text-amber-400">Warning Dialog Variant</div>
                    <div class="text-[11px] text-text-secondary">notify.warningDialog(title, message)</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  (click)="showSuccessVariant()"
                  class="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/60 text-left transition-all cursor-pointer flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-2xl">check_circle</span>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-emerald-700 dark:text-emerald-400">Success Dialog Variant</div>
                    <div class="text-[11px] text-text-secondary">notify.successDialog(title, message)</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  (click)="showInfoVariant()"
                  class="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/20 hover:bg-sky-100/60 text-left transition-all cursor-pointer flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-2xl">info</span>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-sky-700 dark:text-sky-400">Info Dialog Variant</div>
                    <div class="text-[11px] text-text-secondary">notify.infoDialog(title, message)</div>
                  </div>
                </button>
              </div>

              <!-- Confirm Dialog Variant -->
              <div class="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">help</span>
                    Confirmation Dialog with Promise Resolution
                  </div>
                  <span class="text-[11px] text-text-secondary">Result: <strong class="font-mono text-text-primary">{{ lastConfirmResult() }}</strong></span>
                </div>
                <p class="text-[11px] text-text-secondary leading-relaxed mb-3">
                  Presents Cancel and Confirm buttons. Resolves promise to <code class="font-mono text-tenant-600">true</code> if confirmed, or <code class="font-mono text-text-primary">false</code> if cancelled or dismissed.
                </p>
                <button 
                  type="button" 
                  (click)="showConfirmVariant()"
                  class="px-4 py-2 rounded-xl btn-gradient text-white text-xs font-semibold shadow-xs cursor-pointer">
                  Test Confirm Dialog
                </button>
              </div>

            </div>
          }

          @if (activeTab() === 'status-screens') {
            <!-- Status Screen Theming Showcase (Quad inspired by reference design) -->
            <div class="space-y-4">
              
              <!-- Info & Real-Time Tenant Tester Bar -->
              <div class="p-4 rounded-2xl bg-base-200/70 border border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div class="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-tenant-500">palette</span>
                    Theme-Driven Design System (Strict Variable Binding)
                  </div>
                  <p class="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Every SVG illustration, status code, pill button, and ambient glow directly samples <code class="text-tenant-600 font-mono">var(--tenant-primary)</code> and <code class="text-text-primary font-mono">var(--base-*)</code>.
                  </p>
                </div>

                <!-- Live Switch Tenant -->
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[11px] font-semibold text-text-secondary">Active Tenant:</span>
                  <select 
                    [value]="lms.activeTenantId()" 
                    (change)="onTenantChange($event)"
                    class="text-xs py-1.5 px-2.5 rounded-xl bg-base-100 border border-base-300 text-text-primary font-semibold focus:outline-none focus:border-tenant-500 cursor-pointer">
                    @for (t of lms.tenants(); track t.id) {
                      <option [value]="t.id">{{ t.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- 2x2 Grid Matching the 4 Cards in Reference Image -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <!-- CARD 1: 404 NOT FOUND (Top-Left from Image) -->
                <div class="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-2xs hover:border-tenant-500/40 transition-all flex flex-col items-center text-center group">
                  <div class="w-full max-w-[200px] mb-2 transform group-hover:scale-105 transition-transform duration-300">
                    <app-status-illustration type="404"></app-status-illustration>
                  </div>
                  <div class="text-2xl font-black tracking-tight" style="color: var(--tenant-primary);">
                    404
                  </div>
                  <h4 class="font-bold text-sm text-text-primary mt-1">Something went wrong</h4>
                  <p class="text-xs text-text-secondary mt-0.5 mb-3 leading-tight max-w-[240px]">
                    Sorry we were unable to find that page
                  </p>
                  <div class="mt-auto w-full pt-2 border-t border-base-200 flex items-center justify-center gap-2">
                    <button 
                      type="button" 
                      (click)="navigateTo('/404')"
                      class="flex-1 py-1.5 px-3 rounded-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-tenant-500 dark:hover:bg-tenant-600 transition-all cursor-pointer">
                      Open Full Page
                    </button>
                    <button 
                      type="button" 
                      (click)="showIllustrated404Dialog()"
                      class="py-1.5 px-3 rounded-full text-xs font-medium text-text-primary bg-base-200 hover:bg-base-300 border border-base-300 transition-all cursor-pointer">
                      Dialog
                    </button>
                  </div>
                </div>

                <!-- CARD 2: MAINTENANCE (Top-Right from Image) -->
                <div class="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-2xs hover:border-tenant-500/40 transition-all flex flex-col items-center text-center group">
                  <div class="w-full max-w-[200px] mb-2 transform group-hover:scale-105 transition-transform duration-300">
                    <app-status-illustration type="maintenance"></app-status-illustration>
                  </div>
                  <h4 class="font-bold text-sm text-text-primary mt-3">System is down for Maintenance</h4>
                  <p class="text-xs text-text-secondary mt-0.5 mb-3 leading-tight max-w-[240px]">
                    We promise, we'll be right back!
                  </p>
                  <div class="mt-auto w-full pt-2 border-t border-base-200 flex items-center justify-center gap-2">
                    <button 
                      type="button" 
                      (click)="navigateTo('/maintenance')"
                      class="flex-1 py-1.5 px-3 rounded-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-tenant-500 dark:hover:bg-tenant-600 transition-all cursor-pointer">
                      Open Full Page
                    </button>
                    <button 
                      type="button" 
                      (click)="showIllustratedMaintenanceDialog()"
                      class="py-1.5 px-3 rounded-full text-xs font-medium text-text-primary bg-base-200 hover:bg-base-300 border border-base-300 transition-all cursor-pointer">
                      Dialog
                    </button>
                  </div>
                </div>

                <!-- CARD 3: 401 UNAUTHORIZED (Bottom-Left from Image) -->
                <div class="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-2xs hover:border-tenant-500/40 transition-all flex flex-col items-center text-center group">
                  <div class="w-full max-w-[200px] mb-2 transform group-hover:scale-105 transition-transform duration-300">
                    <app-status-illustration type="401"></app-status-illustration>
                  </div>
                  <div class="text-2xl font-black tracking-tight" style="color: var(--tenant-primary);">
                    401
                  </div>
                  <h4 class="font-bold text-sm text-text-primary mt-1">Unauthorized</h4>
                  <p class="text-xs text-text-secondary mt-0.5 mb-3 leading-tight max-w-[240px]">
                    Something has gone wrong on the web site's server
                  </p>
                  <div class="mt-auto w-full pt-2 border-t border-base-200 flex items-center justify-center gap-2">
                    <button 
                      type="button" 
                      (click)="navigateTo('/401')"
                      class="flex-1 py-1.5 px-3 rounded-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-tenant-500 dark:hover:bg-tenant-600 transition-all cursor-pointer">
                      Open Full Page
                    </button>
                    <button 
                      type="button" 
                      (click)="showIllustrated401Dialog()"
                      class="py-1.5 px-3 rounded-full text-xs font-medium text-text-primary bg-base-200 hover:bg-base-300 border border-base-300 transition-all cursor-pointer">
                      Dialog
                    </button>
                  </div>
                </div>

                <!-- CARD 4: 500 SERVER ERROR (Bottom-Right from Image) -->
                <div class="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-2xs hover:border-tenant-500/40 transition-all flex flex-col items-center text-center group">
                  <div class="w-full max-w-[200px] mb-2 transform group-hover:scale-105 transition-transform duration-300">
                    <app-status-illustration type="500"></app-status-illustration>
                  </div>
                  <div class="text-2xl font-black tracking-tight" style="color: var(--tenant-primary);">
                    500
                  </div>
                  <h4 class="font-bold text-sm text-text-primary mt-1">This page isn't working</h4>
                  <p class="text-xs text-text-secondary mt-0.5 mb-3 leading-tight max-w-[240px]">
                    We apologise and are fixing the problem. Please try again later.
                  </p>
                  <div class="mt-auto w-full pt-2 border-t border-base-200 flex items-center justify-center gap-2">
                    <button 
                      type="button" 
                      (click)="navigateTo('/500')"
                      class="flex-1 py-1.5 px-3 rounded-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-tenant-500 dark:hover:bg-tenant-600 transition-all cursor-pointer">
                      Open Full Page
                    </button>
                    <button 
                      type="button" 
                      (click)="showIllustrated500Dialog()"
                      class="py-1.5 px-3 rounded-full text-xs font-medium text-text-primary bg-base-200 hover:bg-base-300 border border-base-300 transition-all cursor-pointer">
                      Dialog
                    </button>
                  </div>
                </div>

              </div>
            </div>
          }

        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-4 border-t border-base-300 mt-2">
          <div class="text-[11px] text-text-secondary">
            Server listening on port <span class="font-mono font-bold text-text-primary">3000</span>
          </div>
          <button 
            type="button" 
            (click)="close.emit()"
            class="px-5 py-2 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer">
            Close Console
          </button>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackendConsoleModalComponent {
  api = inject(LmsApiService);
  lms = inject(LmsDataService);
  http = inject(HttpClient);
  notify = inject(NotificationService);
  router = inject(Router);
  close = output<void>();

  activeTab = signal<'endpoints' | 'interceptor' | 'dialogs' | 'status-screens'>('endpoints');
  selectedEndpoint = signal<'health' | 'tenants' | 'courses' | 'analytics' | 'ai'>('health');
  isLoading = signal<boolean>(false);
  isRefreshing = signal<boolean>(false);

  // Interceptor lab feedback signals
  testStatus = signal<string>('Ready');
  testLog = signal<string>('Click any trigger above to test the appInterceptor and NotificationService in action.');
  lastConfirmResult = signal<string>('No test run yet');

  // Dialog customization controls (Dismissibility and Cross button)
  dialogDismissible = signal<boolean>(this.notify.defaultDismissible());
  dialogShowCloseButton = signal<boolean>(this.notify.defaultShowCloseButton());

  toggleDismissible() {
    this.dialogDismissible.update(v => !v);
    this.notify.defaultDismissible.set(this.dialogDismissible());
    this.lms.showToast(
      `Dialogs are now ${this.dialogDismissible() ? 'dismissible (Backdrop & ESC active)' : 'locked (Backdrop & ESC disabled with shake alert)'}`,
      'info'
    );
  }

  toggleShowCloseButton() {
    this.dialogShowCloseButton.update(v => !v);
    this.notify.defaultShowCloseButton.set(this.dialogShowCloseButton());
    this.lms.showToast(
      `Top-right cross button is now ${this.dialogShowCloseButton() ? 'enabled' : 'hidden'}`,
      'info'
    );
  }

  // Cached endpoint response map for instant, zero-flicker transitions
  private endpointResponses = computed(() => ({
    health: JSON.stringify({
      status: 'healthy',
      environment: 'production',
      version: '2.4.0',
      uptimeSeconds: 1420,
      timestamp: new Date().toISOString(),
      database: {
        tenantsCount: this.lms.tenants().length,
        coursesCount: this.lms.courses().length,
        learnersCount: this.lms.users().length,
        auditLogsCount: this.lms.auditLogs().length
      },
      aiEnabled: true,
      aiModel: 'gemini-3.7-flash'
    }, null, 2),

    tenants: JSON.stringify({
      success: true,
      count: this.lms.tenants().length,
      data: this.lms.tenants().map(t => ({
        id: t.id,
        name: t.name,
        domain: t.domain,
        plan: t.plan,
        status: t.status,
        seatsUsed: t.stats.seatsUsed,
        seatLimit: t.stats.seatLimit
      }))
    }, null, 2),

    courses: JSON.stringify({
      success: true,
      count: this.lms.courses().length,
      data: this.lms.courses().slice(0, 3).map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        level: c.level,
        durationMinutes: c.durationMinutes,
        isMandatory: c.isMandatory
      }))
    }, null, 2),

    analytics: JSON.stringify({
      success: true,
      data: {
        activeWorkspaces: this.lms.tenants().length,
        totalCourses: this.lms.courses().length,
        averageComplianceRate: '96.2%',
        activeLearners: 4210,
        averageLearningHours: 48.5
      }
    }, null, 2),

    ai: JSON.stringify({
      success: true,
      source: 'gemini-3.7-flash',
      data: {
        title: 'Advanced Zero-Trust Cloud SecOps Masterclass',
        category: 'Compliance & Security',
        estimatedMinutes: 90,
        level: 'Advanced',
        learningObjectives: [
          'Architect Zero-Trust boundary policies across AWS, GCP, and Azure',
          'Enforce automated least-privilege role validation and MFA',
          'Pass SOC-2 Type II audit verifications'
        ],
        modulesCount: 4
      }
    }, null, 2)
  }));

  responseData = computed(() => {
    return this.endpointResponses()[this.selectedEndpoint()];
  });

  refreshTelemetry() {
    this.isRefreshing.set(true);
    this.api.pingHealth().subscribe({
      next: () => this.isRefreshing.set(false),
      error: () => this.isRefreshing.set(false)
    });
  }

  testEndpoint(type: 'health' | 'tenants' | 'courses' | 'analytics' | 'ai') {
    this.selectedEndpoint.set(type);
  }

  // Interceptor Testing Methods
  triggerHttpTest(code: number) {
    this.testStatus.set(`Calling /api/test/error/${code}...`);
    this.testLog.set(`Initiated GET /api/test/error/${code}. Interceptor will manage spinner and catch status ${code}.`);

    this.http.get(`/api/test/error/${code}`).subscribe({
      next: (res: any) => {
        this.testStatus.set('200 OK');
        this.testLog.set(`Success: ${JSON.stringify(res)}`);
      },
      error: (err) => {
        this.testStatus.set(`Handled (${err.status})`);
        this.testLog.set(`Interceptor caught status ${err.status}. Notification dialog triggered.`);
      }
    });
  }

  triggerBlobTest() {
    this.testStatus.set('Requesting Blob...');
    this.testLog.set('Calling /api/test/blob-error with responseType: blob. Interceptor extractBlobErrorMessage parsing stream.');

    this.http.get('/api/test/blob-error', { responseType: 'blob' }).subscribe({
      next: () => {
        this.testStatus.set('Blob Received');
      },
      error: (err) => {
        this.testStatus.set('Blob Handled');
        this.testLog.set('extractBlobErrorMessage parsed text from Blob and presented Invalid Request dialog.');
      }
    });
  }

  triggerLoaderTest() {
    this.testStatus.set('Spinner In Flight (1.5s)');
    this.testLog.set('Requesting /api/test/delay. Notice the global NgxSpinner with ball-clip-rotate animation.');

    this.http.get('/api/test/delay').subscribe({
      next: (res: any) => {
        this.testStatus.set('Complete (200 OK)');
        this.testLog.set(`Response arrived, loader hidden automatically: ${JSON.stringify(res)}`);
      },
      error: (err) => {
        this.testStatus.set('Error');
        this.testLog.set(err.message);
      }
    });
  }

  triggerNoLoaderTest() {
    this.testStatus.set('Calling with no-loader');
    this.testLog.set('Sending request with header no-loader: true. Interceptor strips custom header and suppresses NgxSpinner.');

    const headers = new HttpHeaders({ 'no-loader': 'true' });
    this.http.get('/api/test/delay', { headers }).subscribe({
      next: (res: any) => {
        this.testStatus.set('Complete (no-loader worked)');
        this.testLog.set('Completed without showing loader overlay.');
      },
      error: (err) => {
        this.testStatus.set('Error');
      }
    });
  }

  // Dialog Variants Showcase
  showErrorVariant() {
    this.notify.errorDialog(
      'Database Connection Failed',
      'The multi-tenant tenant shard could not be reached. Retrying connection pool in 5 seconds.',
      {
        dismissible: this.dialogDismissible(),
        showCloseButton: this.dialogShowCloseButton()
      }
    );
  }

  showWarningVariant() {
    this.notify.warningDialog(
      'Approaching Seat Limit',
      'Your workspace has utilized 96% of available learner seats. Upgrade your subscription tier to avoid interruption.',
      {
        dismissible: this.dialogDismissible(),
        showCloseButton: this.dialogShowCloseButton()
      }
    );
  }

  showSuccessVariant() {
    this.notify.successDialog(
      'SCORM Package Exported',
      'The SCORM 1.2 compliant course archive was successfully compiled and downloaded.',
      {
        dismissible: this.dialogDismissible(),
        showCloseButton: this.dialogShowCloseButton()
      }
    );
  }

  showInfoVariant() {
    this.notify.infoDialog(
      'Scheduled Maintenance',
      'OmniLearn cloud services will undergo maintenance on Saturday at 03:00 UTC for 15 minutes.',
      {
        dismissible: this.dialogDismissible(),
        showCloseButton: this.dialogShowCloseButton()
      }
    );
  }

  showConfirmVariant() {
    this.notify.confirmDialog(
      'Decommission Workspace?',
      'Are you sure you want to deactivate tenant "Apex Global"? All active learner access will be suspended.',
      {
        dismissible: this.dialogDismissible(),
        showCloseButton: this.dialogShowCloseButton()
      }
    ).then((confirmed) => {
      this.lastConfirmResult.set(confirmed ? 'User CONFIRMED (true)' : 'User CANCELLED / DISMISSED (false)');
      if (confirmed) {
        this.notify.success('Decommission confirmed');
      } else {
        this.notify.info('Action was cancelled');
      }
    });
  }

  onTenantChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val) {
      this.lms.switchTenant(val);
      this.lms.showToast(`Switched active tenant to ${this.lms.activeTenant().name}`, 'success');
    }
  }

  navigateTo(path: string) {
    this.close.emit();
    this.router.navigate([path]);
  }

  showIllustrated404Dialog() {
    this.notify.errorDialog(
      'Something went wrong',
      'Sorry we were unable to find that page. The requested course or route may have moved or been decommissioned.',
      { 
        illustration: '404', 
        confirmText: 'Go to Dashboard',
        dismissible: this.dialogDismissible(),
        showCloseButton: this.dialogShowCloseButton()
      }
    );
  }

  showIllustratedMaintenanceDialog() {
    this.notify.infoDialog(
      'System is down for Maintenance',
      'We promise, we\'ll be right back! Our cloud engineering team is deploying automated database scaling.',
      { 
        illustration: 'maintenance', 
        confirmText: 'Acknowledge',
        dismissible: this.dialogDismissible(),
        showCloseButton: this.dialogShowCloseButton()
      }
    );
  }

  showIllustrated401Dialog() {
    this.notify.errorDialog(
      'Unauthorized',
      'Something has gone wrong on the web site\'s server. Your session token has expired or lacks tenant credentials.',
      { 
        illustration: '401', 
        confirmText: 'Go to Dashboard',
        signInText: 'Try Sign In Again',
        dismissible: this.dialogDismissible(),
        showCloseButton: this.dialogShowCloseButton(),
        onSignInAgain: () => {
          this.lms.showToast('Redirecting to organization SSO login portal...', 'info');
        }
      }
    ).then((confirmed) => {
      if (confirmed) {
        this.close.emit();
        this.router.navigate(['/dashboard']);
      }
    });
  }

  showIllustrated500Dialog() {
    this.notify.errorDialog(
      'This page isn\'t working',
      'We apologise and are fixing the problem. Please try again later.',
      { 
        illustration: '500', 
        confirmText: 'Go to Dashboard',
        dismissible: this.dialogDismissible(),
        showCloseButton: this.dialogShowCloseButton()
      }
    );
  }

  onBackdropClick(event: MouseEvent) {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.close.emit();
  }
}
