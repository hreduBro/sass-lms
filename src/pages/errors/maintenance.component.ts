import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { ThemeService } from '../../services/theme.service';
import { StatusIllustrationComponent } from '../../components/status-illustration/status-illustration.component';

@Component({
  selector: 'app-maintenance',
  imports: [CommonModule, RouterModule, StatusIllustrationComponent],
  template: `
    <div class="min-h-screen w-full flex flex-col justify-between bg-base-200 text-text-primary relative overflow-x-hidden font-sans select-none">
      
      <!-- Ambient Radial Glow using tenant-primary variable -->
      <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] blur-3xl pointer-events-none -z-10"
           style="background: radial-gradient(circle, var(--tenant-50, rgba(59, 130, 246, 0.08)) 0%, transparent 70%);">
      </div>

      <!-- Top Fixed Organization Header -->
      <header class="fixed top-0 left-0 right-0 h-16 px-4 sm:px-8 border-b border-base-300/80 bg-base-100/90 backdrop-blur-md flex items-center justify-between z-30 shadow-2xs">
        <div class="flex items-center gap-3 min-w-0">
          <!-- Org Logo -->
          <div class="w-9 h-9 rounded-xl bg-base-100 p-1 shadow-2xs border border-base-300 flex items-center justify-center overflow-hidden shrink-0">
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
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 border"
                    [class]="lms.activeTenant().plan === 'Enterprise' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200 border-indigo-500/30' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-500/30'">
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

      <!-- Center Stage: Maintenance View (Design Inspired by Reference Image Top-Right) -->
      <main class="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-20 z-10">

        <div class="w-full max-w-lg text-center">
          
          <!-- SVG Illustration: Barrier with Chevrons, Cone, and Warning Signpost -->
          <app-status-illustration type="maintenance"></app-status-illustration>

          <!-- Headline & Subtitle matching the reference image -->
          <div class="space-y-2 mt-4 mb-7">
            <h1 class="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              System is down for Maintenance
            </h1>
            <p class="text-sm sm:text-base text-text-secondary max-w-md mx-auto leading-relaxed">
              We promise, we'll be right back!
            </p>
          </div>

          <!-- Live Window Details Card -->
          <div class="mt-8 bg-base-100/90 rounded-2xl border border-base-300 shadow-sm p-4 text-xs text-text-secondary text-left flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl text-tenant-500 shrink-0">engineering</span>
              <div class="truncate">
                <span class="font-semibold text-text-primary block truncate">Scheduled Cloud Upgrade v4.18</span>
                <span class="text-[11px] block truncate text-text-secondary">Expected window: 15–30 mins &bull; Zero database data loss</span>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tenant-50 text-tenant-600 border border-tenant-500/20 shrink-0">
              Active
            </span>
          </div>

        </div>
      </main>

      <!-- Bottom Platform Footer -->
      <footer class="h-12 px-4 sm:px-8 border-t border-base-300/80 bg-base-100/90 backdrop-blur-md flex items-center justify-center z-30 select-none">
        <div class="flex items-center gap-2 text-xs text-text-secondary">
          <span class="text-[11px]">OmniLearn LMS &bull; Multi-Tenant Enterprise Platform</span>
        </div>
      </footer>

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceComponent {
  lms = inject(LmsDataService);
  theme = inject(ThemeService);
  router = inject(Router);

  isChecking = signal<boolean>(false);

  onTenantChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val) {
      this.lms.switchTenant(val);
    }
  }

  checkStatus() {
    this.isChecking.set(true);
    setTimeout(() => {
      this.isChecking.set(false);
      this.lms.showToast('System operational check complete: Upgrade is 78% completed.', 'info');
    }, 1200);
  }
}
