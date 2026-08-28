import { Component, ChangeDetectionStrategy, inject, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { NavigationLayoutMode, HeaderDensity, ContentWidthMode } from '../../models/lms.model';

@Component({
  selector: 'app-layout-switcher-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div (click)="onBackdropClick($event)" class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
      <div (click)="$event.stopPropagation()" class="bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-xl p-6 animate-modal-card max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-base-300 mb-5">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-tenant-50 dark:bg-tenant-500/20 flex items-center justify-center text-tenant-600 dark:text-tenant-300">
              <span class="material-symbols-outlined text-xl">dashboard_customize</span>
            </div>
            <div>
              <h3 class="font-bold text-base text-text-primary">Admin Layout & Appearance</h3>
              <p class="text-xs text-text-secondary">Configure workspace menu topology, theme and viewport layout</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-text-secondary hover:text-text-primary p-1 rounded-lg">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div class="space-y-5">
          <!-- 1. Navigation Mode Selection -->
          <div>
            <label class="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5">
              1. Navigation Structure & Menu Style
            </label>
            <div class="grid grid-cols-3 gap-3">
              <!-- Classic Sidebar -->
              <button
                type="button"
                (click)="setNavigationMode('sidebar')"
                class="p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between h-28 focus:outline-none focus:ring-0 outline-none"
                [class]="prefs().navigationMode === 'sidebar' 
                  ? 'border-2 border-tenant-500 bg-tenant-50/60 dark:bg-tenant-500/20 shadow-xs' 
                  : 'border-base-300 bg-base-200/50 hover:bg-base-200'">
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="material-symbols-outlined text-lg" [class]="prefs().navigationMode === 'sidebar' ? 'text-tenant-600 dark:text-tenant-300' : 'text-text-secondary'">dock_to_left</span>
                    @if (prefs().navigationMode === 'sidebar') {
                      <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-300">check_circle</span>
                    }
                  </div>
                  <div class="font-bold text-xs text-text-primary">Classic Sidebar</div>
                  <div class="text-[10px] text-text-secondary leading-tight mt-0.5">Vertical expandable left navigation drawer</div>
                </div>
              </button>

              <!-- Top Menu Bar -->
              <button
                type="button"
                (click)="setNavigationMode('top_menu')"
                class="p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between h-28 focus:outline-none focus:ring-0 outline-none"
                [class]="prefs().navigationMode === 'top_menu' 
                  ? 'border-2 border-tenant-500 bg-tenant-50/60 dark:bg-tenant-500/20 shadow-xs' 
                  : 'border-base-300 bg-base-200/50 hover:bg-base-200'">
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="material-symbols-outlined text-lg" [class]="prefs().navigationMode === 'top_menu' ? 'text-tenant-600 dark:text-tenant-300' : 'text-text-secondary'">horizontal_split</span>
                    @if (prefs().navigationMode === 'top_menu') {
                      <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-300">check_circle</span>
                    }
                  </div>
                  <div class="font-bold text-xs text-text-primary">Top Navigation</div>
                  <div class="text-[10px] text-text-secondary leading-tight mt-0.5">Horizontal menu with maximized canvas space</div>
                </div>
              </button>

              <!-- Compact Rail -->
              <button
                type="button"
                (click)="setNavigationMode('compact_rail')"
                class="p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between h-28 focus:outline-none focus:ring-0 outline-none"
                [class]="prefs().navigationMode === 'compact_rail' 
                  ? 'border-2 border-tenant-500 bg-tenant-50/60 dark:bg-tenant-500/20 shadow-xs' 
                  : 'border-base-300 bg-base-200/50 hover:bg-base-200'">
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="material-symbols-outlined text-lg" [class]="prefs().navigationMode === 'compact_rail' ? 'text-tenant-600 dark:text-tenant-300' : 'text-text-secondary'">view_compact</span>
                    @if (prefs().navigationMode === 'compact_rail') {
                      <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-300">check_circle</span>
                    }
                  </div>
                  <div class="font-bold text-xs text-text-primary">Compact Rail</div>
                  <div class="text-[10px] text-text-secondary leading-tight mt-0.5">Slim icon sidebar with hover tooltips</div>
                </div>
              </button>
            </div>
          </div>

          <!-- 2. Dark Mode & System Theme Preference -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-bold text-text-primary uppercase tracking-wider">
                2. Theme & Dark Mode Preference
              </label>
              <span class="text-[10px] text-text-secondary">
                Auto-syncs on OS changes
              </span>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <button
                type="button"
                (click)="setThemeMode('system')"
                class="p-2.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-0 outline-none"
                [class]="themeService.themeMode() === 'system' ? 'border-2 border-tenant-500 bg-tenant-50/60 dark:bg-tenant-500/20 shadow-xs' : 'border-base-300 bg-base-200/50 hover:bg-base-200'">
                <div class="flex items-center justify-between mb-1">
                  <span class="material-symbols-outlined text-base" [class]="themeService.themeMode() === 'system' ? 'text-tenant-600 dark:text-tenant-300' : 'text-text-secondary'">devices</span>
                  @if (themeService.themeMode() === 'system') {
                    <span class="material-symbols-outlined text-xs text-tenant-600 dark:text-tenant-300">check_circle</span>
                  }
                </div>
                <div class="font-bold text-xs text-text-primary">System Auto</div>
                <div class="text-[10px] text-text-secondary mt-0.5">Matches OS scheme</div>
              </button>

              <button
                type="button"
                (click)="setThemeMode('light')"
                class="p-2.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-0 outline-none"
                [class]="themeService.themeMode() === 'light' ? 'border-2 border-tenant-500 bg-tenant-50/60 dark:bg-tenant-500/20 shadow-xs' : 'border-base-300 bg-base-200/50 hover:bg-base-200'">
                <div class="flex items-center justify-between mb-1">
                  <span class="material-symbols-outlined text-base text-amber-500">light_mode</span>
                  @if (themeService.themeMode() === 'light') {
                    <span class="material-symbols-outlined text-xs text-tenant-600 dark:text-tenant-300">check_circle</span>
                  }
                </div>
                <div class="font-bold text-xs text-text-primary">Light Mode</div>
                <div class="text-[10px] text-text-secondary mt-0.5">Forced light theme</div>
              </button>

              <button
                type="button"
                (click)="setThemeMode('dark')"
                class="p-2.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-0 outline-none"
                [class]="themeService.themeMode() === 'dark' ? 'border-2 border-tenant-500 bg-tenant-50/60 dark:bg-tenant-500/20 shadow-xs' : 'border-base-300 bg-base-200/50 hover:bg-base-200'">
                <div class="flex items-center justify-between mb-1">
                  <span class="material-symbols-outlined text-base text-indigo-400">dark_mode</span>
                  @if (themeService.themeMode() === 'dark') {
                    <span class="material-symbols-outlined text-xs text-tenant-600 dark:text-tenant-300">check_circle</span>
                  }
                </div>
                <div class="font-bold text-xs text-text-primary">Dark Mode</div>
                <div class="text-[10px] text-text-secondary mt-0.5">Forced dark theme</div>
              </button>
            </div>
          </div>

          <!-- 3. Viewport Density & Container Width -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                3. Header Density
              </label>
              <div class="flex items-center gap-2 bg-base-200 p-1 rounded-xl border border-base-300">
                <button
                  type="button"
                  (click)="setHeaderDensity('comfortable')"
                  class="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all"
                  [class]="prefs().headerDensity === 'comfortable' ? 'bg-tenant-500 text-white shadow-sm font-semibold' : 'text-text-secondary hover:text-text-primary'">
                  Comfortable (64px)
                </button>
                <button
                  type="button"
                  (click)="setHeaderDensity('compact')"
                  class="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all"
                  [class]="prefs().headerDensity === 'compact' ? 'bg-tenant-500 text-white shadow-sm font-semibold' : 'text-text-secondary hover:text-text-primary'">
                  Compact (48px)
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                4. Container Width
              </label>
              <div class="flex items-center gap-2 bg-base-200 p-1 rounded-xl border border-base-300">
                <button
                  type="button"
                  (click)="setContentWidth('fluid')"
                  class="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all"
                  [class]="prefs().contentWidth === 'fluid' ? 'bg-tenant-500 text-white shadow-sm font-semibold' : 'text-text-secondary hover:text-text-primary'">
                  Fluid (Full 100%)
                </button>
                <button
                  type="button"
                  (click)="setContentWidth('constrained')"
                  class="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all"
                  [class]="prefs().contentWidth === 'constrained' ? 'bg-tenant-500 text-white shadow-sm font-semibold' : 'text-text-secondary hover:text-text-primary'">
                  Standard (max-w-7xl)
                </button>
              </div>
            </div>
          </div>

          <!-- 4. Toggles: Sticky Header & Breadcrumbs -->
          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-base-300">
            <label class="flex items-center justify-between p-2.5 rounded-xl bg-base-200/60 border border-base-300 cursor-pointer">
              <span class="text-xs font-medium text-text-primary flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-text-secondary">pin</span> Sticky Top Bar
              </span>
              <input 
                type="checkbox" 
                [checked]="prefs().stickyHeader"
                (change)="toggleStickyHeader()"
                class="rounded border-base-300 text-tenant-600 focus:ring-0 w-4 h-4" />
            </label>

            <label class="flex items-center justify-between p-2.5 rounded-xl bg-base-200/60 border border-base-300 cursor-pointer">
              <span class="text-xs font-medium text-text-primary flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-text-secondary">linear_scale</span> Breadcrumbs Trail
              </span>
              <input 
                type="checkbox" 
                [checked]="prefs().showBreadcrumbs"
                (change)="toggleBreadcrumbs()"
                class="rounded border-base-300 text-tenant-600 focus:ring-0 w-4 h-4" />
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-5 border-t border-base-300 mt-5">
          <span class="text-[11px] text-text-secondary flex items-center gap-1">
            <span class="material-symbols-outlined text-sm text-tenant-600">verified_user</span>
            Mapped & applied to active LMS: <strong class="text-text-primary">{{ lms.activeLms()?.basicInfo?.lmsName }}</strong>
          </span>
          <button 
            type="button" 
            (click)="close.emit()"
            class="px-5 py-2 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold shadow-sm transition-colors">
            Apply Layout & Theme
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutSwitcherModalComponent {
  lms = inject(LmsDataService);
  themeService = inject(ThemeService);
  close = output<void>();

  prefs = this.lms.adminLayoutPreferences;

  setNavigationMode(mode: NavigationLayoutMode) {
    this.lms.updateLayoutPreferences({ navigationMode: mode });
  }

  setThemeMode(mode: ThemeMode) {
    this.themeService.setThemeMode(mode);
  }

  setHeaderDensity(density: HeaderDensity) {
    this.lms.updateLayoutPreferences({ headerDensity: density });
  }

  setContentWidth(width: ContentWidthMode) {
    this.lms.updateLayoutPreferences({ contentWidth: width });
  }

  toggleStickyHeader() {
    this.lms.updateLayoutPreferences({ stickyHeader: !this.prefs().stickyHeader });
  }

  toggleBreadcrumbs() {
    this.lms.updateLayoutPreferences({ showBreadcrumbs: !this.prefs().showBreadcrumbs });
  }

  onBackdropClick(event: MouseEvent) {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.close.emit();
  }
}

