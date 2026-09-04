import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { ThemeService } from '../../services/theme.service';
import { StatusIllustrationComponent } from '../../components/status-illustration/status-illustration.component';
import { StatusSwitcherComponent } from '../../components/status-switcher/status-switcher.component';

interface NavShortcut {
  title: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-not-found',
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

      <!-- Center Stage: 404 View (Design Inspired by Reference Image Top-Left) -->
      <main class="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-20 z-10">

        <div class="w-full max-w-lg text-center">
          
          <!-- SVG Illustration: Document + Magnifying Glass -->
          <app-status-illustration type="404"></app-status-illustration>

          <!-- Status Code: 404 in Theme Primary Color -->
          <div class="mt-2 text-3xl sm:text-4xl font-black tracking-tight" style="color: var(--tenant-primary);">
            404
          </div>

          <!-- Headline & Subtitle matching the reference image -->
          <div class="space-y-2 mt-2 mb-7">
            <h1 class="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Something went wrong
            </h1>
            <p class="text-sm sm:text-base text-text-secondary max-w-md mx-auto leading-relaxed">
              Sorry we were unable to find that page
            </p>
          </div>

          <!-- Primary Pill Action Button: "Go to Dashboard" -->
          <div class="flex items-center justify-center">
            <a 
              id="btn-error-dashboard"
              routerLink="/dashboard"
              style="background-color: var(--tenant-primary);"
              class="px-8 py-3 rounded-full text-sm font-bold text-white shadow-md shadow-tenant-500/25 hover:shadow-lg hover:shadow-tenant-500/35 hover:brightness-105 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer">
              <span class="material-symbols-outlined text-lg">dashboard</span>
              <span>Go to Dashboard</span>
            </a>
          </div>

          <!-- Collapsible Quick Search Box -->
          @if (showSearch()) {
            <div class="mt-6 bg-base-100/95 rounded-2xl border border-base-300 shadow-lg p-4 text-left">
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-base">search</span>
                <input 
                  type="text" 
                  [value]="searchQuery()"
                  (input)="onSearchInput($event)"
                  (keyup.enter)="executeSearch()"
                  placeholder="Find courses, exams, certificates, or settings..." 
                  class="w-full pl-9 pr-20 py-2 bg-base-200 border border-base-300 rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-tenant-500" />
                <button 
                  type="button" 
                  (click)="executeSearch()"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs font-bold text-white bg-slate-900 dark:bg-tenant-500 hover:opacity-90 cursor-pointer">
                  Find
                </button>
              </div>

              <!-- Quick Links -->
              @if (filteredSuggestions().length > 0) {
                <div class="flex flex-wrap gap-2 mt-3 pt-2 border-t border-base-300/60">
                  @for (sug of filteredSuggestions(); track sug.route) {
                    <a 
                      [routerLink]="sug.route" 
                      class="px-2.5 py-1 rounded-lg bg-base-200 hover:bg-base-300 border border-base-300 text-xs font-medium text-text-primary flex items-center gap-1.5 transition-colors">
                      <span class="material-symbols-outlined text-sm text-tenant-500">{{ sug.icon }}</span>
                      <span>{{ sug.title }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }

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
export class NotFoundComponent {
  lms = inject(LmsDataService);
  theme = inject(ThemeService);
  router = inject(Router);

  showSearch = signal<boolean>(false);
  searchQuery = signal<string>('');

  navigationHubs: NavShortcut[] = [
    { title: 'Dashboard', description: 'Command center', icon: 'dashboard', route: '/dashboard' },
    { title: 'Course Catalog', description: 'Browse curriculum', icon: 'auto_stories', route: '/courses' },
    { title: 'Assessments', description: 'Exams & quizzes', icon: 'quiz', route: '/assessments' },
    { title: 'Certificates', description: 'Digital credentials', icon: 'workspace_premium', route: '/certificates' },
    { title: 'Settings', description: 'Theming & configuration', icon: 'tune', route: '/settings' }
  ];

  filteredSuggestions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.navigationHubs;
    return this.navigationHubs.filter(h => 
      h.title.toLowerCase().includes(q) || h.description.toLowerCase().includes(q)
    );
  });

  onTenantChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val) {
      this.lms.switchTenant(val);
    }
  }

  toggleSearch() {
    this.showSearch.update(v => !v);
  }

  onSearchInput(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  executeSearch() {
    const matches = this.filteredSuggestions();
    if (matches.length > 0) {
      this.router.navigate([matches[0].route]);
    }
  }
}
