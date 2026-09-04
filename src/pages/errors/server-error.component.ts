import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-server-error',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen w-full flex flex-col justify-between bg-base-200 dark:bg-slate-950 text-text-primary relative overflow-x-hidden font-sans select-none">
      
      <!-- Ambient Radial Glows -->
      <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-rose-500/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none -z-10"></div>
      <div class="fixed -bottom-24 -right-24 w-96 h-96 bg-rose-500/10 blur-3xl pointer-events-none -z-10"></div>

      <!-- Top Fixed Organization Header -->
      <header class="fixed top-0 left-0 right-0 h-16 px-4 sm:px-8 border-b border-base-300/80 dark:border-slate-800/80 bg-base-100/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-30 shadow-xs">
        <div class="flex items-center gap-3 min-w-0">
          <!-- Org Logo -->
          <div class="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 p-1 shadow-2xs border border-base-300/80 flex items-center justify-center overflow-hidden shrink-0">
            @if (lms.activeTenant().branding.logoUrl) {
              <img 
                [src]="lms.activeTenant().branding.logoUrl" 
                [alt]="lms.activeTenant().name"
                class="w-full h-full object-contain"
                referrerpolicy="no-referrer" />
            } @else {
              <span class="material-symbols-outlined text-base text-tenant-500">domain</span>
            }
          </div>
          
          <!-- Org Info -->
          <div class="flex flex-col text-left min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-text-primary tracking-tight truncate max-w-[150px] sm:max-w-[260px]">
                {{ lms.activeTenant().name }}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                    [class]="lms.activeTenant().plan === 'Enterprise' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200 border border-indigo-500/30' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-500/30'">
                {{ lms.activeTenant().plan }}
              </span>
            </div>
            <span class="text-[11px] text-text-secondary font-mono leading-tight truncate">
              {{ lms.activeTenant().domain }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- Theme Toggle Button -->
          <button 
            type="button" 
            (click)="theme.toggleDarkMode()"
            class="p-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-secondary hover:text-text-primary border border-base-300 transition-colors cursor-pointer"
            [title]="theme.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <span class="material-symbols-outlined text-lg">
              {{ theme.isDarkMode() ? 'light_mode' : 'dark_mode' }}
            </span>
          </button>
        </div>
      </header>

      <!-- Center Stage: 500 Blocked / Diagnostics View -->
      <main class="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 min-h-screen z-10">
        <div class="w-full max-w-3xl text-center">
          
          <!-- Concentric Server Engine Visual Badge -->
          <div class="relative inline-flex items-center justify-center mb-6">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shadow-xl shadow-rose-500/10 animate-pulse">
              <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/40 flex items-center justify-center">
                <span class="material-symbols-outlined text-4xl sm:text-5xl text-rose-600 dark:text-rose-400">
                  dns
                </span>
              </div>
            </div>
            <span class="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-rose-600 text-white shadow-lg flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">error</span> 500
            </span>
          </div>

          <!-- Status & Code Heading -->
          <div class="space-y-2.5 mb-6">
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>CORE INTERRUPT &bull; HTTP 500 SERVER ERROR</span>
            </div>

            <h1 class="text-3xl sm:text-5xl font-black text-text-primary tracking-tight">
              Internal Service Interruption
            </h1>
            <p class="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
              Our microservice cluster encountered an unexpected condition while fulfilling this operation. A telemetry trace has been dispatched to reliability engineers.
            </p>
          </div>

          <!-- Incident Telemetry Card -->
          <div class="bg-base-100/90 dark:bg-slate-900/90 rounded-3xl border border-base-300 dark:border-slate-800 shadow-xl p-5 sm:p-7 text-left mb-8 relative overflow-hidden backdrop-blur-xl">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-tenant-500"></div>

            <!-- Header Row: Incident ID + Copy Action -->
            <div class="flex items-center justify-between gap-3">
              <div>
                <span class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Incident Correlation Reference</span>
                <div class="flex items-center gap-2 mt-1">
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
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center justify-center gap-3 mb-10">
            <a 
              routerLink="/dashboard"
              class="btn-gradient px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg shadow-tenant-500/20 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
              <span class="material-symbols-outlined text-lg">home</span>
              Return to Safe Dashboard
            </a>

            <button 
              type="button"
              (click)="copyDiagnosticReport()"
              class="px-5 py-2.5 rounded-2xl bg-base-100 hover:bg-base-200 text-text-primary text-xs font-bold border border-base-300 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
              <span class="material-symbols-outlined text-lg">content_paste</span>
              Copy Diagnostics
            </button>
          </div>

          <!-- Support Note -->
          <div class="border-t border-base-300/80 dark:border-slate-800 pt-6">
            <p class="text-xs text-text-secondary">
              If this error persists, contact support at
              <a href="mailto:support@bracits.com" class="text-tenant-600 dark:text-tenant-400 font-semibold hover:underline ml-1">support&#64;bracits.com</a>.
            </p>
          </div>

        </div>
      </main>

      <!-- Bottom Fixed Platform Bar -->
      <footer class="fixed bottom-0 left-0 right-0 h-12 px-4 sm:px-8 border-t border-base-300/80 dark:border-slate-800/80 bg-base-100/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-30 select-none">
        <div class="flex items-center gap-2 sm:gap-2.5 text-xs text-text-secondary">
          <span class="text-[11px] sm:text-xs">A product of</span>
          <a
            href="https://www.bracits.com"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center shrink-0 transition-opacity hover:opacity-90 active:scale-98"
            title="BRAC IT Services">
            <!-- Light Mode BRAC IT Logo -->
            <img
              [src]="lightLogo"
              (error)="onLogoError('light')"
              alt="BRAC IT"
              class="h-4.5 sm:h-5 w-auto object-contain dark:hidden"
              referrerpolicy="no-referrer" />
            <!-- Dark Mode BRAC IT Logo -->
            <img
              [src]="darkLogo"
              (error)="onLogoError('dark')"
              alt="BRAC IT"
              class="h-4.5 sm:h-5 w-auto object-contain hidden dark:block"
              referrerpolicy="no-referrer" />
          </a>
        </div>
      </footer>

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServerErrorComponent {
  readonly isErrorPage = true;

  lms = inject(LmsDataService);
  theme = inject(ThemeService);
  router = inject(Router);
  location = inject(Location);

  private readonly fallbackLight = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAAApCAYAAAC7m4JHAAADbUlEQVR4nO2d243kIBBF+Z1cJgiHMRppcnFmzmkS6NVK7RVL87j1uLRlqiT+MFwXB8yj6E4fn19HI20pLGy2fXx+PRppf7e2MMx+f77335/vo5J2Zb5anhlpCyBvYM/GfFTSocxXyzMj7QHkDSyADLuUBZBhl7IAMuxStjSQf7eDnmkvEmWb6FnXuRVVaoTrzDSX21tU/RUNtS02k4blgMwc2cr733MeoytYZ7cBhbopX4YZGryBfKsNwNI409ywgjqbQD71a3S7gWnwnUjDKkB6JVHDChuxCqQDCCYojR1ZrCGAJDWsohG34vmNoF3UWO/QQJhD6k5ZPMqYBOQQSuUntgSSpR2CkgTjUMNFFjXl8aP7ooaRenO+YYNkK/ytAqN1zmjqUMl3qiDSsDqQJRi7AIZqLweeH62m0fpftlayd7B2KKSMg6FhVSCHny3QqS+93GFkMmsH9TfL0Y5uQg0xQkqcmcAVZiU/sxNIV/ni0XqChm586mpAirc+gMn9Bua1ztu02za9Ml86ibf/Mg1QoPRSQGqcmcajxgHmM32uDdq7HUqbl2Uz9yEdgOy3KaN3I2VnedRAWmEelN0bJfMRnqYBtWWAlLvmpexmo2Z5rgpkb+RDgZxyLymABA0ZZVhAOmiH5rZIp2PbKkCazzeRUcYIJBUGI5DTzocDSNCQz9lVgYwRslkXHUhmow4/qcQ5pGin+hupCFz9MWwZIh0ZtlesFpGkPc1A2CmQsapyBpKxU0RMYIpCmKUevM1Wi6SkaULsbkPCpisTQExSHjXHGSY3oKFCSV6jhchHjdCCT4qgMKA8+DyYDKe5QmgCRCRq6frgjkG7BAYrRxQokEhTrEWnTe4cZGprP3w7IhAeXNgsT3CNxBRIo419ZnTs40jswtRA66N0dNNDjIXs2E0hJ+P0ZaNq6Ly1pSJdFlUDDI9PtdqNScX2hvJutqjfdFcjEvwagiRaXxmGytEO62NcoWu9+WyCZTlXW5x1cSwWSrGFagG7PpgNJcGr3Zb33QSdBybhB2fTfaJV+eyCTn1ORVbL7xrzT59u0v+nkPwiUJYA8TelY+DfKyTGNJu0eutj+S6sBedp5cjBwovgXvGZEXA+0Hy3tnrpA/6n+bGBJIEurXda3llVLHuW36ny3Lq9yAsiwS1kAGRZGsj937xzbxWCzYgAAAABJRU5ErkJggg==';
  private readonly fallbackDark = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAAApCAYAAAC7m4JHAAADbElEQVR4nO2d623EIBCEKc11REov7sw9pQFHke4ihNll9sVZZkfyPw7GywfmmZTzPA/i2UoqNVsnrf3T3lKYfr6/9p/vr6Pz7Mp0vTQzni2BfIBelXl2nkOZrpdmxrMnkA9QApm6lRLI1K2UQKZupaWB/FsOej1784QsE73Kei9FtYLLrDy3y1uh/jseektsJg/LAVkFEtHu0buCZbIVKPR9eW8PzfDgDeRHxQVFGUxzxQrKJIF8+bfIo1FpYyfysAqQXhJVrLASu0A6gKDyXpVvachiDwlkQFCLDqSt+f0W4F1UWZ/wEDCG1O2yeOQREDxKLJTKT2wLZJQgKINgHHq4yaSm3X50n9REiBvzjXRUM/ytA6N1zDjSsJd3/EyLPKwOZAvGLoCh28qB349m02j5l6WV6h0QWSdRR4SHVYEcfrbAoF5auTS98PeQd9A/mY/mvRUesoeUBLOAM8xOekoejUA6yxf31hM8sOdTVwNSvPQBDO43MK113KZdtuHyvDQS7/hVHqCD0ksBqQlmGfcaB5jO9Lk2eGcblDZtlGauQzoAydcpF0zrbgVSURYgrTAP8uZ6ybqHD/OAahkg5aG55E1WapXmrkByPR8K5JR7SQkkKKSXiQLSwTs0tkUaXbRWAdK8v4n0MkYgQ2FAfDEepu0PJ5CgkM/ZXYHMHpIsKxzIyEodflIDx5Cm8RvqC538RGoZIB0qlVSVxgKkaQ1zkDcKZE5qnIEMmamiOzCBQJqGHEy+ZwNkmAdUTwMS3lWRCN1BcVgYj9ipEW0FStIKPdzuxHg4kEWxVQbkB+8HBwN5ShuU5oDIBA9sHJ4IpNvhAEXvYgUSORTrcdKGe4cZHsjfPw7Igh8uJTMT3CNxBRLI4z8v5g6O9A5M7wgd9O4OHsLPQ3KaCaTk+P37oCl1X5qskE65LMqgYez8u12o1JxfaG9m60qtzwVyBJ/DUBzWlx6DnOWqD+iEHqNgnr3xwIZGVRled6Ha73EDV2iPEw7oMtpOpABQWVf1nsddBKUETcoKQ0P6T4eyOIXVGSW7L4w7/T5Nq1vOsUPAmUJIN9SBhb+G+XBZxpN3j18RcevrAbkW++dg0EQxX/Ba8aJ64H3g/Lu6QuMn+qfDSwJZKveZX1rXr3HI3+qzE/78songUzdSglkKhWkX6TNK2gLjOAsAAAAAElFTkSuQmCC';

  lightLogo = 'assets/bracit-logo-light.png';
  darkLogo = 'assets/bracit-logo-dark.png';

  onLogoError(theme: 'light' | 'dark') {
    if (theme === 'light') {
      this.lightLogo = this.fallbackLight;
    } else {
      this.darkLogo = this.fallbackDark;
    }
  }

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
