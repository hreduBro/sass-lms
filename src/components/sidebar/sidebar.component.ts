import { Component, ChangeDetectionStrategy, inject, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { LmsDataService } from '../../services/lms-data.service';
import { NavItem, NavChildItem, APP_NAV_ITEMS, isNavigationItemActive, isNavChildActive } from '../../models/navigation.model';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents'
  }
})
export class SidebarComponent {
  isOpen = input<boolean>(true);
  close = output<void>();
  lms = inject(LmsDataService);
  router = inject(Router);

  isCompact = computed(() => this.lms.adminLayoutPreferences().navigationMode === 'compact_rail');
  isTopMenu = computed(() => this.lms.adminLayoutPreferences().navigationMode === 'top_menu');

  // Expanded menus state map
  expandedMenus = signal<Record<string, boolean>>({});

  navItems: NavItem[] = APP_NAV_ITEMS;

  constructor() {
    // Initial sync on startup
    this.syncActiveMenuWithRoute();

    // Whenever a menu item / route is selected, close all other menus and leave only the selected menu open
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.syncActiveMenuWithRoute();
    });
  }

  private syncActiveMenuWithRoute() {
    const currentUrl = this.router.url;
    const activeParent = this.navItems.find(item => item.children && item.children.length > 0 && isNavigationItemActive(currentUrl, item));
    if (activeParent) {
      this.expandedMenus.set({ [activeParent.label]: true });
    } else {
      this.expandedMenus.set({});
    }
  }

  toggleMenu(menuLabel: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // Allow opening multiple menus when exploring/clicking headers
    this.expandedMenus.update(current => ({
      ...current,
      [menuLabel]: !current[menuLabel]
    }));
  }

  isMenuExpanded(menuLabel: string): boolean {
    return !!this.expandedMenus()[menuLabel];
  }

  isRouteActive(item: NavItem): boolean {
    return isNavigationItemActive(this.router.url, item);
  }

  isChildActive(child: NavChildItem | string): boolean {
    return isNavChildActive(this.router.url, child);
  }

  isAllowed(roles: string[]): boolean {
    const activeRole = this.lms.activeRole();
    return roles.includes(activeRole);
  }

  onNavItemClick() {
    // Only close drawer on mobile viewports (< 1024px); keep open on desktop
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.close.emit();
    }
  }
}
