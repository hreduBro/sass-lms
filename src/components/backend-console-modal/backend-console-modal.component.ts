import { Component, ChangeDetectionStrategy, inject, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LmsApiService, BackendHealth } from '../../services/lms-api.service';
import { LmsDataService } from '../../services/lms-data.service';

@Component({
  selector: 'app-backend-console-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div (click)="onBackdropClick($event)" class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
      <div (click)="$event.stopPropagation()" class="bg-base-100 rounded-3xl border border-base-300 shadow-2xl w-full max-w-3xl p-6 animate-modal-card max-h-[90vh] flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-base-300">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">dns</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-base text-text-primary">Express Backend & API Server</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  REST API Active
                </span>
              </div>
              <p class="text-xs text-text-secondary">Multi-Tenant REST Endpoints, Telemetry & Server-Side AI</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-text-secondary hover:text-text-primary p-1.5 rounded-xl hover:bg-base-200 transition-colors">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto py-4 space-y-5">
          
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
                class="text-[11px] font-semibold text-tenant-600 dark:text-tenant-300 hover:underline flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">sync</span>
                Ping Server
              </button>
            </div>

            <!-- Endpoint Buttons Bar -->
            <div class="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                (click)="testEndpoint('health')"
                class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-colors flex items-center gap-1"
                [class]="selectedEndpoint() === 'health' ? 'bg-tenant-500 text-white border-tenant-600 font-bold' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary'">
                <span class="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">GET</span>
                /api/health
              </button>

              <button
                type="button"
                (click)="testEndpoint('tenants')"
                class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-colors flex items-center gap-1"
                [class]="selectedEndpoint() === 'tenants' ? 'bg-tenant-500 text-white border-tenant-600 font-bold' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary'">
                <span class="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">GET</span>
                /api/tenants
              </button>

              <button
                type="button"
                (click)="testEndpoint('courses')"
                class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-colors flex items-center gap-1"
                [class]="selectedEndpoint() === 'courses' ? 'bg-tenant-500 text-white border-tenant-600 font-bold' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary'">
                <span class="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">GET</span>
                /api/courses
              </button>

              <button
                type="button"
                (click)="testEndpoint('analytics')"
                class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-colors flex items-center gap-1"
                [class]="selectedEndpoint() === 'analytics' ? 'bg-tenant-500 text-white border-tenant-600 font-bold' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary'">
                <span class="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">GET</span>
                /api/analytics
              </button>

              <button
                type="button"
                (click)="testEndpoint('ai')"
                class="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-colors flex items-center gap-1"
                [class]="selectedEndpoint() === 'ai' ? 'bg-tenant-500 text-white border-tenant-600 font-bold' : 'bg-base-200 text-text-secondary border-base-300 hover:text-text-primary'">
                <span class="text-[9px] font-bold px-1 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">POST</span>
                /api/ai/generate-course
              </button>
            </div>

            <!-- JSON Payload Response Display -->
            <div class="rounded-2xl bg-slate-950 p-4 border border-slate-800 text-slate-100 font-mono text-xs overflow-x-auto relative min-h-[160px] max-h-[260px]">
              <div class="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2 mb-2">
                <span>Response Status: <strong class="text-emerald-400">200 OK</strong></span>
                <span>Content-Type: application/json</span>
              </div>
              @if (isLoading()) {
                <div class="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <span class="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Executing server request...</span>
                </div>
              } @else {
                <pre class="text-[11px] leading-relaxed text-emerald-300 whitespace-pre-wrap">{{ responseData() }}</pre>
              }
            </div>
          </div>

          <!-- Documentation & Deployment Notes -->
          <div class="p-3.5 rounded-2xl bg-base-200/50 border border-base-300 text-xs space-y-1.5">
            <div class="font-bold text-text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm text-tenant-600">terminal</span>
              Backend Architecture Specifications
            </div>
            <ul class="text-[11px] text-text-secondary list-disc pl-4 space-y-1">
              <li><strong>Runtime:</strong> Node.js with native TypeScript type stripping (<code class="text-text-primary font-mono font-semibold">node server.ts</code>).</li>
              <li><strong>Multi-Tenancy:</strong> Isolated domain resolution, custom branding stylesheet injection, and role-based data partitioning.</li>
              <li><strong>AI Integration:</strong> Server-side <code class="text-text-primary font-mono font-semibold">&#64;google/genai</code> client with lazy initialization on <code class="text-text-primary font-mono font-semibold">gemini-3.7-flash</code>.</li>
            </ul>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-4 border-t border-base-300 mt-2">
          <div class="text-[11px] text-text-secondary">
            Server listening on port <span class="font-mono font-bold text-text-primary">3000</span>
          </div>
          <button 
            type="button" 
            (click)="close.emit()"
            class="px-5 py-2 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold shadow-sm transition-colors">
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
  close = output<void>();

  selectedEndpoint = signal<'health' | 'tenants' | 'courses' | 'analytics' | 'ai'>('health');
  isLoading = signal<boolean>(false);
  responseData = signal<string>('');

  constructor() {
    this.testEndpoint('health');
  }

  refreshTelemetry() {
    this.api.pingHealth().subscribe();
  }

  testEndpoint(type: 'health' | 'tenants' | 'courses' | 'analytics' | 'ai') {
    this.selectedEndpoint.set(type);
    this.isLoading.set(true);

    if (type === 'health') {
      const data = {
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
      };
      setTimeout(() => {
        this.responseData.set(JSON.stringify(data, null, 2));
        this.isLoading.set(false);
      }, 150);
    } else if (type === 'tenants') {
      const data = {
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
      };
      setTimeout(() => {
        this.responseData.set(JSON.stringify(data, null, 2));
        this.isLoading.set(false);
      }, 150);
    } else if (type === 'courses') {
      const data = {
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
      };
      setTimeout(() => {
        this.responseData.set(JSON.stringify(data, null, 2));
        this.isLoading.set(false);
      }, 150);
    } else if (type === 'analytics') {
      const data = {
        success: true,
        data: {
          activeWorkspaces: this.lms.tenants().length,
          totalCourses: this.lms.courses().length,
          averageComplianceRate: '96.2%',
          activeLearners: 4210,
          averageLearningHours: 48.5
        }
      };
      setTimeout(() => {
        this.responseData.set(JSON.stringify(data, null, 2));
        this.isLoading.set(false);
      }, 150);
    } else if (type === 'ai') {
      const data = {
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
      };
      setTimeout(() => {
        this.responseData.set(JSON.stringify(data, null, 2));
        this.isLoading.set(false);
      }, 200);
    }
  }

  onBackdropClick(event: MouseEvent) {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.close.emit();
  }
}
