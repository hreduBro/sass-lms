
import { Component, ChangeDetectionStrategy, inject, effect, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, Scroll } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { TopMenuComponent } from './components/top-menu/top-menu.component';
import { MobileNavComponent } from './components/mobile-nav/mobile-nav.component';
import { LayoutSwitcherModalComponent } from './components/layout-switcher-modal/layout-switcher-modal.component';
import { BackendConsoleModalComponent } from './components/backend-console-modal/backend-console-modal.component';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
import { FooterComponent } from './components/footer/footer.component';
import { ThemeService } from './services/theme.service';
import { LmsDataService } from './services/lms-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    RouterOutlet, 
    SidebarComponent, 
    HeaderComponent, 
    TopMenuComponent, 
    MobileNavComponent,
    LayoutSwitcherModalComponent,
    BackendConsoleModalComponent,
    ConfirmationModalComponent,
    FooterComponent
  ]
})
export class AppComponent implements OnInit {
  @ViewChild('mainContent') mainContent?: ElementRef<HTMLElement>;

  themeService = inject(ThemeService);
  lms = inject(LmsDataService);
  router = inject(Router);
  isSidebarOpen = signal(false);
  isFullScreenError = signal(false);

  constructor() {
    // Default open on desktop (>= 1024px), closed on mobile
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      this.isSidebarOpen.set(true);
    }

    effect(() => {
      if (this.themeService.isDarkMode()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  ngOnInit() {
    // Reset scroll position and track full screen error views
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof Scroll)
    ).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const path = (event.urlAfterRedirects || event.url || '').split('?')[0];
        const isKnownError = 
          path === '/403' || path === '/forbidden' ||
          path === '/404' || path === '/not-found' ||
          path === '/500' || path === '/server-error';
        if (isKnownError) {
          this.isFullScreenError.set(true);
        }
      }
      this.resetScrollPosition();
    });
  }

  onRouteActivated(component?: any) {
    const isError = Boolean(
      component?.isErrorPage ||
      component?.constructor?.name === 'ForbiddenComponent' ||
      component?.constructor?.name === 'NotFoundComponent' ||
      component?.constructor?.name === 'ServerErrorComponent'
    );
    this.isFullScreenError.set(isError);
    this.resetScrollPosition();
  }

  private resetScrollPosition() {
    // 1. Reset main content container scroll
    if (this.mainContent?.nativeElement) {
      this.mainContent.nativeElement.scrollTop = 0;
      this.mainContent.nativeElement.scrollLeft = 0;
    }

    // 2. Reset window and document scroll
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    }

    // 3. Fallback requestAnimationFrame to handle async component renders
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        if (this.mainContent?.nativeElement) {
          this.mainContent.nativeElement.scrollTop = 0;
        }
      });
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update(open => !open);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  confirmGlobalSignOut() {
    this.lms.logout();
    this.lms.closeSignOutModal();
    this.lms.showToast('You have been signed out of your session', 'info', 3500, 'Signed Out');
    this.router.navigate(['/dashboard']);
  }
}
