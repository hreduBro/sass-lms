
import { Component, ChangeDetectionStrategy, inject, effect, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { TopMenuComponent } from './components/top-menu/top-menu.component';
import { MobileNavComponent } from './components/mobile-nav/mobile-nav.component';
import { LayoutSwitcherModalComponent } from './components/layout-switcher-modal/layout-switcher-modal.component';
import { BackendConsoleModalComponent } from './components/backend-console-modal/backend-console-modal.component';
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
    FooterComponent
  ]
})
export class AppComponent {
  themeService = inject(ThemeService);
  lms = inject(LmsDataService);
  router = inject(Router);
  isSidebarOpen = signal(false);

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
