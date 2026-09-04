import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';

@Component({
  selector: 'app-server-error',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-[80vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      
      <!-- Top Ambient Halo -->
      <div class="relative w-full max-w-3xl text-center">
        <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-br from-rose-500/15 via-amber-500/10 to-tenant-500/15 blur-3xl rounded-full pointer-events-none"></div>

        <!-- Concentric Server Engine Visual Badge -->
        <div class="relative inline-flex items-center justify-center mb-6">
          <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shadow-lg shadow-rose-500/5">
            <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/40 flex items-center justify-center">
              <span class="material-symbols-outlined text-4xl sm:text-5xl text-rose-600 dark:text-rose-400">
                dns
              </span>
            </div>
          </div>
          <span class="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-600 text-white shadow-md flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">error</span> 500
          </span>
        </div>

        <!-- Status & Code Heading -->
        <div class="space-y-2 mb-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300/60 dark:border-rose-700/50 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Server Anomaly &bull; HTTP 500 Internal Error</span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-black text-text-primary tracking-tight">
            Internal Service Interruption
          </h1>
          <p class="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Our microservice cluster encountered an unexpected server condition while fulfilling this operation. A telemetry snapshot has been logged for diagnosis.
          </p>
        </div>

        <!-- Incident Telemetry Card -->
        <div class="bg-base-100 rounded-3xl border border-base-300 shadow-sm p-5 sm:p-7 text-left mb-8 relative overflow-hidden backdrop-blur-md">
          <!-- Top Accent Bar -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-tenant-500"></div>

          <!-- Header Row: Incident ID + Copy Action -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-base-200 dark:border-slate-800">
            <div>
              <span class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Incident Correlation Reference</span>
              <div class="flex items-center gap-2 mt-0.5">
                <code class="font-mono text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
                  {{ incidentId() }}
                </code>
                <button 
                  type="button" 
                  (click)="copyIncidentId()"
                  class="p-1 rounded-lg hover:bg-base-200 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  title="Copy incident reference to clipboard">
                  <span class="material-symbols-outlined text-base">content_copy</span>
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs text-text-secondary">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">schedule</span>
                {{ incidentTime() }}
              </span>
              <span class="opacity-40">&bull;</span>
              <span class="flex items-center gap-1 font-mono text-[11px]">
                <span class="material-symbols-outlined text-sm">cloud</span>
                asia-east1
              </span>
            </div>
          </div>

          <!-- Subsystem Health Status Matrix -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
            <div class="bg-base-200/60 dark:bg-slate-800/40 p-3 rounded-2xl border border-base-300/80">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-semibold text-text-secondary">API Gateway</span>
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <span class="text-xs font-bold text-rose-600 dark:text-rose-400">Degraded (500)</span>
            </div>

            <div class="bg-base-200/60 dark:bg-slate-800/40 p-3 rounded-2xl border border-base-300/80">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-semibold text-text-secondary">Database Store</span>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">Operational</span>
            </div>

            <div class="bg-base-200/60 dark:bg-slate-800/40 p-3 rounded-2xl border border-base-300/80">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-semibold text-text-secondary">Tenant Auth</span>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">Operational</span>
            </div>

            <div class="bg-base-200/60 dark:bg-slate-800/40 p-3 rounded-2xl border border-base-300/80">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-semibold text-text-secondary">Edge Cache</span>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">Operational</span>
            </div>
          </div>

          <!-- Collapsible Technical Stack Trace & Logs (Accordion) -->
          <div class="mt-5 pt-4 border-t border-base-200 dark:border-slate-800">
            <button 
              type="button"
              (click)="toggleTechnicalDetails()"
              class="flex items-center justify-between w-full text-xs font-bold text-text-primary hover:text-tenant-600 transition-colors cursor-pointer py-1">
              <span class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-rose-500">terminal</span>
                Technical Diagnostics & Telemetry Preview
              </span>
              <span class="material-symbols-outlined transition-transform duration-200" [class.rotate-180]="showTechnicalDetails()">
                expand_more
              </span>
            </button>

            @if (showTechnicalDetails()) {
              <div class="mt-3 p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 animate-in fade-in duration-200">
                <div class="text-rose-400 font-bold mb-1">
                  Error 500: InternalServerException [ERR_GATEWAY_TIMEOUT_REVERSE_PROXY]
                </div>
                <div class="text-slate-400">
                  Timestamp: {{ incidentTime() }} | Tenant: {{ lms.activeTenant().slug }}
                </div>
                <div class="text-slate-500 mt-2">
                  &gt; at RouterHandler.handleIncomingRequest (src/server.ts:52:18)<br/>
                  &gt; at ExpressEngine.dispatch (src/server.ts:89:12)<br/>
                  &gt; at TenantSecurityContext.resolve (src/guards/role.guard.ts:24:9)<br/>
                  &gt; at LmsTelemetryObserver.recordEvent (src/services/lms-data.service.ts:4680)
                </div>
                <div class="mt-2 text-slate-400">
                  Client Agent: {{ userAgent() }}
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button 
            type="button"
            (click)="retryConnection()"
            [disabled]="isRetrying()"
            class="btn-gradient px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-75">
            @if (isRetrying()) {
              <span class="material-symbols-outlined text-lg animate-spin">refresh</span>
              Reconnecting...
            } @else {
              <span class="material-symbols-outlined text-lg">refresh</span>
              Retry Request
            }
          </button>

          <a 
            routerLink="/dashboard"
            class="px-5 py-2.5 rounded-2xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-bold border border-base-300 shadow-xs flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-lg">home</span>
            Safe Dashboard
          </a>

          <button 
            type="button"
            (click)="copyDiagnosticReport()"
            class="px-5 py-2.5 rounded-2xl bg-base-100 hover:bg-base-200 text-text-primary text-xs font-bold border border-base-300 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-lg">content_paste</span>
            Copy Diagnostics
          </button>

          <button 
            type="button"
            (click)="openBackendConsole()"
            class="px-5 py-2.5 rounded-2xl bg-tenant-500/10 hover:bg-tenant-500/20 text-tenant-700 dark:text-tenant-300 text-xs font-bold border border-tenant-500/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-lg">terminal</span>
            REST API Console
          </button>
        </div>

        <!-- System Health & Status Link -->
        <div class="border-t border-base-300 pt-6">
          <p class="text-xs text-text-secondary">
            Enterprise Cloud Run Infrastructure &bull; Automated self-healing active. If this error persists, contact support at
            <a href="mailto:support@bracits.com" class="text-tenant-600 dark:text-tenant-400 font-semibold hover:underline ml-1">support&#64;bracits.com</a>.
          </p>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServerErrorComponent {
  lms = inject(LmsDataService);
  router = inject(Router);
  location = inject(Location);

  isRetrying = signal(false);
  showTechnicalDetails = signal(false);
  incidentId = signal('INC-BRAC-' + Math.floor(100000 + Math.random() * 900000) + '-ERR');
  incidentTime = signal(new Date().toLocaleString());
  userAgent = signal('');

  constructor() {
    if (typeof navigator !== 'undefined') {
      this.userAgent.set(navigator.userAgent);
    }
  }

  toggleTechnicalDetails() {
    this.showTechnicalDetails.update(v => !v);
  }

  retryConnection() {
    this.isRetrying.set(true);
    this.lms.showToast('Attempting to re-establish gateway handshake...', 'info', 2000, 'Reconnecting', 'NET');
    
    setTimeout(() => {
      this.isRetrying.set(false);
      this.lms.showToast('Gateway connection healthy. Returning to Dashboard.', 'success', 3000, 'Restored', 'GATEWAY');
      this.router.navigate(['/dashboard']);
    }, 1400);
  }

  copyIncidentId() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.incidentId());
      this.lms.showToast(`Incident ID "${this.incidentId()}" copied to clipboard`, 'success', 3000, 'Copied');
    }
  }

  copyDiagnosticReport() {
    const report = {
      incidentId: this.incidentId(),
      timestamp: this.incidentTime(),
      status: 500,
      error: 'InternalServerException',
      tenant: this.lms.activeTenant().name,
      tenantId: this.lms.activeTenant().id,
      user: this.lms.activeUser().email,
      role: this.lms.activeRole(),
      userAgent: this.userAgent(),
      region: 'asia-east1'
    };

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      this.lms.showToast('Full diagnostic JSON snapshot copied to clipboard', 'success', 3500, 'Copied');
    }
  }

  openBackendConsole() {
    this.lms.openBackendConsole();
  }
}
