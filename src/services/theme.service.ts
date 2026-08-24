
import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'lms_theme_mode';

  // Explicit user preference: 'system' (default), 'light', or 'dark'
  themeMode = signal<ThemeMode>('system');

  // OS / Browser system color scheme preference
  systemPrefersDark = signal<boolean>(false);

  // Resolved effective dark mode state (boolean)
  isDarkMode = computed<boolean>(() => {
    const mode = this.themeMode();
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    // 'system' mode: follow OS / system preference
    return this.systemPrefersDark();
  });

  constructor() {
    // 1. Initial System Theme Detection
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(mediaQuery.matches);

      // Listen for system changes on the fly
      const handler = (e: MediaQueryListEvent) => {
        this.systemPrefersDark.set(e.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handler);
      }
    }

    // 2. Load stored preference if exists (otherwise defaults to 'system')
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          this.themeMode.set(stored);
        } else {
          this.themeMode.set('system');
        }
      } catch (e) {
        this.themeMode.set('system');
      }
    }

    // 3. Reactively update the DOM class on <html>
    effect(() => {
      const isDark = this.isDarkMode();
      if (typeof document !== 'undefined') {
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  /**
   * Quick toggle: switches between dark and light, saving user override
   */
  toggleDarkMode() {
    const currentEffectiveDark = this.isDarkMode();
    const nextMode: ThemeMode = currentEffectiveDark ? 'light' : 'dark';
    this.setThemeMode(nextMode);
  }

  /**
   * Set specific theme mode ('system', 'light', or 'dark') and persist
   */
  setThemeMode(mode: ThemeMode) {
    this.themeMode.set(mode);
    if (typeof localStorage !== 'undefined') {
      try {
        if (mode === 'system') {
          localStorage.removeItem(this.STORAGE_KEY);
        } else {
          localStorage.setItem(this.STORAGE_KEY, mode);
        }
      } catch (e) {
        // ignore storage errors
      }
    }
  }

  /**
   * Cycle through: System Auto -> Dark -> Light
   */
  cycleThemeMode() {
    const current = this.themeMode();
    if (current === 'system') {
      this.setThemeMode('dark');
    } else if (current === 'dark') {
      this.setThemeMode('light');
    } else {
      this.setThemeMode('system');
    }
  }

  getBranding() {
    return {
      logoUrl: './assets/logo.svg',
      appName: 'OmniLearn LMS'
    };
  }
}

