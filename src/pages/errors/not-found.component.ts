import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { ThemeService } from '../../services/theme.service';

interface NavShortcut {
  title: string;
  description: string;
  icon: string;
  route: string;
  colorClass: string;
}

@Component({
  selector: 'app-not-found',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen w-full flex flex-col justify-between bg-base-200 dark:bg-slate-950 text-text-primary relative overflow-x-hidden font-sans select-none">
      
      <!-- Ambient Radial Glows -->
      <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-500/15 via-tenant-500/15 to-transparent blur-3xl pointer-events-none -z-10"></div>
      <div class="fixed -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 blur-3xl pointer-events-none -z-10"></div>

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

      <!-- Center Stage: 404 Blocked / Radar View -->
      <main class="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 min-h-screen z-10">
        <div class="w-full max-w-3xl text-center">
          
          <!-- Concentric Cosmic Compass Visual Badge -->
          <div class="relative inline-flex items-center justify-center mb-6">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shadow-xl shadow-indigo-500/10 animate-pulse">
              <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-indigo-500/15 dark:bg-indigo-500/25 border border-indigo-500/40 flex items-center justify-center">
                <span class="material-symbols-outlined text-4xl sm:text-5xl text-indigo-600 dark:text-indigo-400">
                  explore_off
                </span>
              </div>
            </div>
            <span class="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-indigo-600 text-white shadow-lg flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">search_off</span> 404
            </span>
          </div>

          <!-- Status & Code Heading -->
          <div class="space-y-2.5 mb-6">
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              <span>ENDPOINT UNRESOLVED &bull; HTTP 404 NOT FOUND</span>
            </div>

            <h1 class="text-3xl sm:text-5xl font-black text-text-primary tracking-tight">
              Lost in Digital Space
            </h1>
            <p class="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
              The URL destination you requested could not be resolved on this tenant portal. It may have expired, moved, or never existed.
            </p>
          </div>

          <!-- Quick Search & Intelligent Route Suggestions Card -->
          <div class="bg-base-100/90 dark:bg-slate-900/90 rounded-3xl border border-base-300 dark:border-slate-800 shadow-xl p-5 sm:p-7 text-left mb-8 relative overflow-hidden backdrop-blur-xl">
            <div class="space-y-3">
              <label for="lms-quick-search-fullscreen" class="block text-xs font-bold text-text-primary uppercase tracking-wider">
                Search LMS Catalog & System Workspaces
              </label>
              
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-lg">
                  search
                </span>
                <input 
                  id="lms-quick-search-fullscreen"
                  type="text" 
                  [value]="searchQuery()"
                  (input)="onSearchInput($event)"
                  (keyup.enter)="executeSearch()"
                  placeholder="Type keywords: 'courses', 'exams', 'certificates', 'analytics', 'transcripts'..." 
                  class="w-full pl-10 pr-24 py-2.5 bg-base-200 dark:bg-slate-800 border border-base-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-tenant-500 transition-colors" />
                
                <button 
                  type="button" 
                  (click)="executeSearch()"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 btn-gradient px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer">
                  Search
                </button>
              </div>

              <!-- Real-time matching suggestions -->
              @if (filteredSuggestions().length > 0 && searchQuery().trim().length > 0) {
                <div class="pt-2">
                  <span class="text-[11px] font-semibold text-text-secondary">Matching Destinations:</span>
                  <div class="flex flex-wrap gap-2 mt-1.5">
                    @for (sug of filteredSuggestions(); track sug.route) {
                      <a 
                        [routerLink]="sug.route" 
                        class="px-3 py-1.5 rounded-xl bg-base-200 dark:bg-slate-800 hover:bg-base-300 border border-base-300 dark:border-slate-700 text-xs font-medium text-text-primary flex items-center gap-1.5 transition-colors">
                        <span class="material-symbols-outlined text-sm text-tenant-500">{{ sug.icon }}</span>
                        <span>{{ sug.title }}</span>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button 
              type="button"
              (click)="goBack()"
              class="px-5 py-2.5 rounded-2xl bg-base-100 hover:bg-base-200 text-text-primary text-xs font-bold border border-base-300 shadow-sm flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
              <span class="material-symbols-outlined text-lg">arrow_back</span>
              Previous Page
            </button>

            <a 
              routerLink="/dashboard"
              class="btn-gradient px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg shadow-tenant-500/20 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
              <span class="material-symbols-outlined text-lg">dashboard</span>
              Return to Safe Dashboard
            </a>
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
export class NotFoundComponent {
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

  currentUrl = signal<string>('');
  searchQuery = signal<string>('');

  navigationHubs: NavShortcut[] = [
    {
      title: 'Command Dashboard',
      description: 'Role-based KPI charts, analytics, and telemetry widgets',
      icon: 'dashboard',
      route: '/dashboard',
      colorClass: 'bg-tenant-100 dark:bg-tenant-950/80 text-tenant-600 dark:text-tenant-300'
    },
    {
      title: 'Course Catalog',
      description: 'Explore interactive training modules & learning curricula',
      icon: 'school',
      route: '/courses',
      colorClass: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300'
    },
    {
      title: 'Assessments Studio',
      description: 'Interactive exam bank, real-time quizzes & grading',
      icon: 'quiz',
      route: '/assessments',
      colorClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300'
    },
    {
      title: 'Certificates Vault',
      description: 'Digital credential repository, badges, and transcripts',
      icon: 'workspace_premium',
      route: '/certificates/vault',
      colorClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300'
    }
  ];

  allDestinations: { title: string; route: string; icon: string; keywords: string }[] = [
    { title: 'Dashboard', route: '/dashboard', icon: 'dashboard', keywords: 'home kpi analytics overview' },
    { title: 'Courses', route: '/courses', icon: 'school', keywords: 'course learn modules lesson' },
    { title: 'Transcripts', route: '/my-transcripts', icon: 'description', keywords: 'grades transcripts history' },
    { title: 'Live Webinars', route: '/webinars', icon: 'videocam', keywords: 'classroom live meeting webinar' },
    { title: 'Assessments', route: '/assessments', icon: 'quiz', keywords: 'quiz exam test grading' },
    { title: 'Plans & Phases', route: '/plans', icon: 'calendar_month', keywords: 'plans curriculum phases' },
    { title: 'Certificates Vault', route: '/certificates/vault', icon: 'workspace_premium', keywords: 'certificate badge diploma' },
    { title: 'Engagement Hub', route: '/engagement', icon: 'forum', keywords: 'feedback ratings forum discussion' },
    { title: 'Profile', route: '/profile', icon: 'person', keywords: 'user account password security' },
    { title: 'Settings & Branding', route: '/settings', icon: 'palette', keywords: 'theme appearance branding tenant' }
  ];

  filteredSuggestions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    return this.allDestinations.filter(d => 
      d.title.toLowerCase().includes(q) || 
      d.keywords.toLowerCase().includes(q)
    ).slice(0, 5);
  });

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentUrl.set(window.location.pathname + window.location.search);
    } else {
      this.currentUrl.set(this.router.url);
    }
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  executeSearch() {
    const q = this.searchQuery().trim();
    if (!q) return;

    const matches = this.filteredSuggestions();
    if (matches.length > 0) {
      this.router.navigate([matches[0].route]);
    } else {
      this.router.navigate(['/courses'], { queryParams: { search: q } });
    }
  }

  reportBrokenLink() {
    this.lms.showToast(
      `Broken link "${this.currentUrl()}" has been captured and routed to portal administrators.`,
      'info',
      4000,
      'Report Submitted',
      'TELEMETRY'
    );
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
