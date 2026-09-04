import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';

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
    <div class="min-h-[80vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      
      <!-- Top Ambient Halo -->
      <div class="relative w-full max-w-3xl text-center">
        <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-br from-indigo-500/15 via-tenant-500/15 to-cyan-500/15 blur-3xl rounded-full pointer-events-none"></div>

        <!-- Concentric Cosmic Compass Visual Badge -->
        <div class="relative inline-flex items-center justify-center mb-6">
          <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shadow-lg shadow-indigo-500/5">
            <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-indigo-500/15 dark:bg-indigo-500/25 border border-indigo-500/40 flex items-center justify-center">
              <span class="material-symbols-outlined text-4xl sm:text-5xl text-indigo-600 dark:text-indigo-400 animate-pulse">
                explore_off
              </span>
            </div>
          </div>
          <span class="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-600 text-white shadow-md flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">search_off</span> 404
          </span>
        </div>

        <!-- Status & Code Heading -->
        <div class="space-y-2 mb-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300/60 dark:border-indigo-700/50 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span>Route Lost &bull; Page Not Found</span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-black text-text-primary tracking-tight">
            Lost in Digital Space
          </h1>
          <p class="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            The page or resource you are looking for has either been relocated, archived, or does not exist on this tenant portal.
          </p>
        </div>

        <!-- Attempted URL Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-base-100 dark:bg-slate-900 border border-base-300 shadow-2xs text-xs mb-8 max-w-full">
          <span class="text-text-secondary">Requested Route:</span>
          <code class="font-mono font-semibold text-tenant-600 dark:text-tenant-400 truncate max-w-xs sm:max-w-md">
            {{ currentUrl() }}
          </code>
        </div>

        <!-- Quick Search & Intelligent Route Suggestions -->
        <div class="bg-base-100 rounded-3xl border border-base-300 shadow-sm p-5 sm:p-7 text-left mb-8 relative overflow-hidden backdrop-blur-md">
          <div class="space-y-3">
            <label for="lms-quick-search" class="block text-xs font-bold text-text-primary uppercase tracking-wider">
              Search Portal Resources & Modules
            </label>
            
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-lg">
                search
              </span>
              <input 
                id="lms-quick-search"
                type="text" 
                [value]="searchQuery()"
                (input)="onSearchInput($event)"
                (keyup.enter)="executeSearch()"
                placeholder="Type keywords like 'courses', 'exams', 'certificates', 'analytics'..." 
                class="w-full pl-10 pr-24 py-2.5 bg-base-200 border border-base-300 rounded-2xl text-xs sm:text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-tenant-500 transition-colors" />
              
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
                      class="px-3 py-1.5 rounded-xl bg-base-200 hover:bg-base-300 border border-base-300 text-xs font-medium text-text-primary flex items-center gap-1.5 transition-colors">
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
            class="px-5 py-2.5 rounded-2xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-bold border border-base-300 shadow-xs flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-lg">arrow_back</span>
            Previous Page
          </button>

          <a 
            routerLink="/dashboard"
            class="btn-gradient px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-lg">dashboard</span>
            Return to Dashboard
          </a>

          <button 
            type="button"
            (click)="reportBrokenLink()"
            class="px-5 py-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-500/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-lg">bug_report</span>
            Report Broken Link
          </button>
        </div>

        <!-- Quick Navigation Matrix Grid -->
        <div class="border-t border-base-300 pt-6 text-left">
          <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4 text-center">
            Popular Navigation Hubs
          </p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            @for (hub of navigationHubs; track hub.route) {
              <a 
                [routerLink]="hub.route"
                class="group p-4 rounded-2xl bg-base-100 hover:bg-base-200/80 border border-base-300 hover:border-tenant-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div class="flex items-start justify-between mb-2">
                  <div [class]="'w-9 h-9 rounded-xl flex items-center justify-center ' + hub.colorClass">
                    <span class="material-symbols-outlined text-xl">{{ hub.icon }}</span>
                  </div>
                  <span class="material-symbols-outlined text-text-secondary group-hover:text-tenant-500 group-hover:translate-x-0.5 transition-all text-sm">
                    arrow_forward
                  </span>
                </div>
                <div>
                  <h3 class="text-xs font-bold text-text-primary group-hover:text-tenant-600 dark:group-hover:text-tenant-400 transition-colors">
                    {{ hub.title }}
                  </h3>
                  <p class="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    {{ hub.description }}
                  </p>
                </div>
              </a>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {
  lms = inject(LmsDataService);
  router = inject(Router);
  location = inject(Location);

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
