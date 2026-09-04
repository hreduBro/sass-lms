import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterModule],
  host: { class: 'block' },
  template: `
    <!-- Fixed Bottom Footer Bar with Immersive Top Shadow & Theme Styling -->
    <footer class="relative z-20 border-t border-base-300 dark:border-slate-800/80 bg-base-100/95 dark:bg-base-100/95 backdrop-blur-md transition-all duration-200 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.06),0_-1px_3px_0_rgba(0,0,0,0.04)] dark:shadow-[0_-6px_24px_-2px_rgba(0,0,0,0.45),0_-2px_6px_0_rgba(0,0,0,0.3)] select-none">
      <div [class]="lms.adminLayoutPreferences().contentWidth === 'fluid' ? 'w-full px-4 sm:px-6 lg:px-8 py-3' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3'">
        
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
          
          <!-- Left: Brand Logo & Copyright Notice -->
          <div class="flex items-center gap-3 sm:gap-3.5 flex-wrap justify-center sm:justify-start">
            <div class="text-[11px] sm:text-xs text-text-secondary font-normal tracking-tight text-center sm:text-left">
              <span>&copy; {{ currentYear }} &nbsp;<strong class="font-medium text-text-primary"> BRAC</strong>.&nbsp;All rights reserved.</span>
            </div>

            <div class="h-3 w-px bg-base-300 dark:bg-slate-700/60 hidden sm:block"></div>

            <!-- Error Pages Diagnostics -->
            <div class="flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span class="opacity-60 hidden md:inline">Error Views:</span>
              <a routerLink="/403" class="px-1.5 py-0.5 rounded-md hover:bg-base-200 hover:text-tenant-600 font-mono text-[10px] font-semibold transition-colors" title="Preview 403 Forbidden">403</a>
              <span class="opacity-30">&bull;</span>
              <a routerLink="/404" class="px-1.5 py-0.5 rounded-md hover:bg-base-200 hover:text-tenant-600 font-mono text-[10px] font-semibold transition-colors" title="Preview 404 Not Found">404</a>
              <span class="opacity-30">&bull;</span>
              <a routerLink="/500" class="px-1.5 py-0.5 rounded-md hover:bg-base-200 hover:text-tenant-600 font-mono text-[10px] font-semibold transition-colors" title="Preview 500 Server Error">500</a>
            </div>
          </div>

          <!-- Right: Official Attribution & Enterprise Status Pill -->
          <div class="flex items-center gap-2.5 sm:gap-2.5 flex-wrap justify-center sm:justify-end">
            <div class="text-[11px] sm:text-xs text-text-secondary">
              <span>A product of </span>
            </div>

            <div class="h-3.5 w-px bg-base-300 dark:bg-slate-700/60 hidden sm:block"></div>

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
                  class="h-5 sm:h-5.5 w-auto object-contain dark:hidden" />
              <!-- Dark Mode BRAC IT Logo -->
              <img
                  [src]="darkLogo"
                  (error)="onLogoError('dark')"
                  alt="BRAC IT"
                  class="h-5 sm:h-5.5 w-auto object-contain hidden dark:block" />
            </a>
          </div>

        </div>

      </div>
    </footer>

    <!-- Bottom-Right Floating "Go to Top" Action Button (FAB) -->
    @if (showScrollTop()) {
      <button 
        id="btn-scroll-to-top"
        type="button" 
        (click)="scrollToTop()" 
        class="fixed right-5 sm:right-6 bottom-18 sm:bottom-20 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-tenant-500 hover:bg-tenant-600 active:scale-95 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 group cursor-pointer border border-white/20"
        title="Go to Top"
        aria-label="Scroll to Top">
        <span class="material-symbols-outlined text-xl group-hover:-translate-y-0.5 transition-transform duration-200">arrow_upward</span>
      </button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit, OnDestroy {
  lms = inject(LmsDataService);

  readonly currentYear = new Date().getFullYear();

  // Base64 Fallback Data URIs to guarantee the logo ALWAYS displays with exact dimensions
  private readonly fallbackLight = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAAApCAYAAAC7m4JHAAADbUlEQVR4nO2d243kIBBF+Z1cJgiHMRppcnFmzmkS6NVK7RVL87j1uLRlqiT+MFwXB8yj6E4fn19HI20pLGy2fXx+PRppf7e2MMx+f77335/vo5J2Zb5anhlpCyBvYM/GfFTSocxXyzMj7QHkDSyADLuUBZBhl7IAMuxStjSQf7eDnmkvEmWb6FnXuRVVaoTrzDSX21tU/RUNtS02k4blgMwc2cr733MeoytYZ7cBhbopX4YZGryBfKsNwNI409ywgjqbQD71a3S7gWnwnUjDKkB6JVHDChuxCqQDCCYojR1ZrCGAJDWsohG34vmNoF3UWO/QQJhD6k5ZPMqYBOQQSuUntgSSpR2CkgTjUMNFFjXl8aP7ooaRenO+YYNkK/ytAqN1zmjqUMl3qiDSsDqQJRi7AIZqLweeH62m0fpftlayd7B2KKSMg6FhVSCHny3QqS+93GFkMmsH9TfL0Y5uQg0xQkqcmcAVZiU/sxNIV/ni0XqChm586mpAirc+gMn9Bua1ztu02za9Ml86ibf/Mg1QoPRSQGqcmcajxgHmM32uDdq7HUqbl2Uz9yEdgOy3KaN3I2VnedRAWmEelN0bJfMRnqYBtWWAlLvmpexmo2Z5rgpkb+RDgZxyLymABA0ZZVhAOmiH5rZIp2PbKkCazzeRUcYIJBUGI5DTzocDSNCQz9lVgYwRslkXHUhmow4/qcQ5pGn+hupCFz9MWwZIh0ZtlesFpGkPc1A2CmQsapyBpKxU0RMYIpCmKUevM1Wi6SkaULsbkPCpisTQExSHjXHGSY3oKFCSV6jhchHjdCCT4qgMKA8+DyYDKe5QmgCRCRq6frgjkG7BAYrRxQokEhTrEWnTe4cZGprP3w7IhAeXNgsT3CNxBRIo419ZnTs40jswtRA66N0dNNDjIXs2E0hJ+P0ZaNq6Ly1pSJdFlUDDI9PtdqNScX2hvJutqjfdFcjEvwagiRaXxmGytEO62NcoWu9+WyCZTlXW5x1cSwWSrGFagG7PpgNJcGr3Zb33QSdBybhB2fTfaJV+eyCTn1ORVbL7xrzT59u0v+nkPwiUJYA8TelY+DfKyTGNJu0eutj+S6sBedp5cjBwovgXvGZEXA+0Hy3tnrpA/6n+bGBJIEurXda3llVLHuW36ny3Lq9yAsiwS1kAGRZGsj937xzbxWCzYgAAAABJRU5ErkJggg==';
  private readonly fallbackDark = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAAApCAYAAAC7m4JHAAADbElEQVR4nO2d623EIBCEKc11REov7sw9pQFHke4ihNll9sVZZkfyPw7GywfmmZTzPA/i2UoqNVsnrf3T3lKYfr6/9p/vr6Pz7Mp0vTQzni2BfIBelXl2nkOZrpdmxrMnkA9QApm6lRLI1K2UQKZupaWB/FsOej1784QsE73Kei9FtYLLrDy3y1uh/jseektsJg/LAVkFEtHu0buCZbIVKPR9eW8PzfDgDeRHxQVFGUxzxQrKJIF8+bfIo1FpYyfysAqQXhJVrLASu0A6gKDyXpVvachiDwlkQFCLDqSt+f0W4F1UWZ/wEDCG1O2yeOQREDxKLJTKT2wLZJQgKINgHHq4yaSm3X50n9REiBvzjXRUM/ytA6N1zDjSsJd3/EyLPKwOZAvGLoCh28qB349m02j5l6WV6h0QWSdRR4SHVYEcfrbAoF5auTS98PeQd9A/mY/mvRUesoeUBLOAM8xOekoejUA6yxf31hM8sOdTVwNSvPQBDO43MK113KZdtuHyvDQS7/hVHqCD0ksBqQlmGfcaB5jO9Lk2eGcblDZtlGauQzoAydcpF0zrbgVSURYgrTAP8uZ6ybqHD/OAahkg5aG55E1WapXmrkByPR8K5JR7SQkkKKSXiQLSwTs0tkUaXbRWAdK8v4n0MkYgQ2FAfDEepu0PJ5CgkM/ZXYHMHpIsKxzIyEodflIDx5Cm8RvqC538RGoZIB0qlVSVxgKkaQ1zkDcKZE5qnIEMmamiOzCBQJqGHEy+ZwNkmAdUTwMS3lWRCN1BcVgYj9ipEW0FStIKPdzuxHg4kEWxVQbkB+8HBwN5ShuU5oDIBA9sHJ4IpNvhAEXvYgUSORTrcdKGe4cZHsjfPw7Igh8uJTMT3CNxBRLI4z8v5g6O9A5M7wgd9O4OHsLPQ3KaCaTk+P37oCl1X5qskE65LpMqgYez8u12o1JxfaG9m60qtzwVyBJ/DUBzWlx6DnOWqD+iEHqNgnr3xwIZGVRled6Ha73EDV2iPEw7oMtpOpABQWVf1nsddBKUETcoKQ0P6T4eyOIXVGSW7L4w7/T5Nq1vOsUPAmUJIN9SBhb+G+XBZxpN3j18RcevrAbkW++dg0EQxX/Ba8aJ64H3g/Lu6QuMn+qfDSwJZKveZX1rXr3HI3+qzE/78songUzdSglkKhWkX6TNK2gLjOAsAAAAAElFTkSuQmCC';

  // BRAC IT Light Mode Logo
  lightLogo = 'assets/bracit-logo-light.png';

  // BRAC IT Dark Mode Logo
  darkLogo = 'assets/bracit-logo-dark.png';

  onLogoError(theme: 'light' | 'dark') {
    if (theme === 'light') {
      this.lightLogo = this.fallbackLight;
    } else {
      this.darkLogo = this.fallbackDark;
    }
  }

  // Visibility state for the bottom-right floating scroll button
  showScrollTop = signal(false);

  private scrollListener: (() => void) | null = null;
  private mainElement: HTMLElement | null = null;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.scrollListener = () => {
        const scrollTop = this.mainElement ? this.mainElement.scrollTop : window.scrollY;
        this.showScrollTop.set(scrollTop > 100);
      };

      // Defer attachment to ensure DOM element is ready
      setTimeout(() => {
        this.mainElement = document.querySelector('main');
        if (this.mainElement && this.scrollListener) {
          this.mainElement.addEventListener('scroll', this.scrollListener, { passive: true });
        }
        if (this.scrollListener) {
          window.addEventListener('scroll', this.scrollListener, { passive: true });
        }
      }, 150);
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined' && this.scrollListener) {
      if (this.mainElement) {
        this.mainElement.removeEventListener('scroll', this.scrollListener);
      }
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  scrollToTop() {
    if (typeof window !== 'undefined') {
      const mainEl = this.mainElement || document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }
}
