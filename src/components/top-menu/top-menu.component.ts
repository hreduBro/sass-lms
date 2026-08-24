import { Component, ChangeDetectionStrategy, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { LmsDataService } from '../../services/lms-data.service';
import { NavItem, NavChildItem, APP_NAV_ITEMS, isNavigationItemActive } from '../../models/navigation.model';

@Component({
  selector: 'app-top-menu',
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-base-100 border-b border-base-300 px-3 sm:px-6 py-1.5 shadow-xs relative overflow-visible">
      <div class="flex items-center gap-1 sm:gap-1.5 overflow-visible py-0.5">
        @for (item of navItems; track item.label) {
          @if (isAllowed(item.roles)) {
            @if (item.children && item.children.length > 0) {
              <!-- Nested Dropdown Menu Trigger -->
              <div 
                class="relative flex-shrink-0" 
                (mouseenter)="onMouseEnter(item.label)" 
                (mouseleave)="onMouseLeave()">
                <button 
                  type="button"
                  [id]="'top-menu-btn-' + item.label.toLowerCase().replace(' ', '-')"
                  (click)="toggleDropdown(item.label, $event)"
                  [class]="isParentActive(item) 
                    ? 'bg-tenant-50 dark:bg-tenant-500/20 text-tenant-700 dark:text-tenant-200 font-bold' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-base-200/80 font-medium'"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all select-none group cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-0 outline-none">
                  
                  <!-- Active Indicator Dot -->
                  @if (isParentActive(item)) {
                    <span class="w-1.5 h-1.5 rounded-full bg-tenant-500 shadow-xs flex-shrink-0 animate-pulse"></span>
                  }
                  
                  <span class="material-symbols-outlined text-base flex-shrink-0 group-hover:scale-105 transition-transform">{{ item.icon }}</span>
                  <span class="whitespace-nowrap">{{ item.label }}</span>
                  
                  @if (item.badge) {
                    <span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider"
                          [class]="isParentActive(item) ? 'bg-tenant-500 text-white' : 'bg-tenant-100 dark:bg-tenant-950/80 text-tenant-700 dark:text-tenant-300'">
                      {{ item.badge }}
                    </span>
                  }
                  
                  <span class="material-symbols-outlined text-sm transition-transform duration-200"
                        [class.rotate-180]="isDropdownOpen(item.label)">
                    expand_more
                  </span>
                </button>

                <!-- Popover Submenu with continuous mouse hover bridge -->
                @if (isDropdownOpen(item.label)) {
                  <div 
                    class="absolute left-0 top-full pt-1 w-72 z-50 animate-dropdown"
                    (mouseenter)="keepDropdownOpen()"
                    (mouseleave)="onMouseLeave()"
                    (click)="$event.stopPropagation()">
                    
                    <div class="bg-base-100 rounded-2xl border border-base-300 shadow-2xl p-2.5 space-y-1">
                      <div class="px-2.5 py-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-base-300/80 mb-1 flex items-center justify-between">
                        <span>{{ item.label }}</span>
                        <span class="text-[9px] font-normal text-text-secondary">Select view</span>
                      </div>

                      <div class="space-y-1">
                        @for (child of item.children; track child.route) {
                          <a 
                            [routerLink]="child.route"
                            (click)="closeDropdown()"
                            class="flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all group cursor-pointer focus:outline-none focus:ring-0 outline-none"
                            [class]="isChildActive(child.route) ? 'bg-tenant-500 text-white font-semibold shadow-xs' : 'text-text-secondary hover:text-text-primary hover:bg-base-200'">
                            
                            <div class="flex items-center gap-2.5 min-w-0">
                              <span class="material-symbols-outlined text-base flex-shrink-0"
                                    [class]="isChildActive(child.route) ? 'text-white' : 'text-tenant-600 dark:text-tenant-400 group-hover:scale-105 transition-transform'">
                                {{ child.icon }}
                              </span>
                              <div class="min-w-0">
                                <span class="truncate block font-medium" [class.font-bold]="isChildActive(child.route)">{{ child.label }}</span>
                                @if (child.description) {
                                  <span class="text-[10px] block truncate" [class]="isChildActive(child.route) ? 'text-white/80' : 'text-text-secondary'">
                                    {{ child.description }}
                                  </span>
                                }
                              </div>
                            </div>

                            <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                              @if (child.badge) {
                                <span class="text-[8px] px-1.5 py-0.2 rounded font-bold uppercase"
                                      [class]="isChildActive(child.route) ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'">
                                  {{ child.badge }}
                                </span>
                              }
                              @if (isChildActive(child.route)) {
                                <span class="material-symbols-outlined text-sm text-white">check</span>
                              }
                            </div>
                          </a>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <!-- Standard Direct Link Navigation Item -->
              <a 
                [routerLink]="item.route"
                (click)="closeDropdown()"
                class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all flex-shrink-0 active:scale-[0.98] select-none cursor-pointer focus:outline-none focus:ring-0 outline-none"
                [class]="isParentActive(item) ? 'bg-tenant-50 dark:bg-tenant-500/20 text-tenant-700 dark:text-tenant-200 font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-base-200/80 font-medium'">
                
                <!-- Active Indicator Dot -->
                @if (isParentActive(item)) {
                  <span class="w-1.5 h-1.5 rounded-full bg-tenant-500 shadow-xs flex-shrink-0 animate-pulse"></span>
                }

                <span class="material-symbols-outlined text-base flex-shrink-0">{{ item.icon }}</span>
                <span class="whitespace-nowrap">{{ item.label }}</span>
                
                @if (item.badge) {
                  <span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider"
                        [class]="isParentActive(item) ? 'bg-tenant-500 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200'">
                    {{ item.badge }}
                  </span>
                }
              </a>
            }
          }
        }
      </div>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopMenuComponent {
  lms = inject(LmsDataService);
  router = inject(Router);
  elementRef = inject(ElementRef);
  
  private hoverTimeout: any = null;

  navItems: NavItem[] = APP_NAV_ITEMS;

  constructor() {
    // Auto-close dropdown when route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeDropdown();
    });
  }

  isDropdownOpen(label: string): boolean {
    return this.lms.isNavDropdownOpen('topmenu-' + label);
  }

  toggleDropdown(label: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    this.lms.toggleNavDropdown('topmenu-' + label);
  }

  onMouseEnter(label: string) {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    // Only switch on hover if a top menu dropdown is ALREADY open
    if (this.lms.activeNavDropdown()?.startsWith('topmenu-')) {
      this.lms.openNavDropdown('topmenu-' + label);
    }
  }

  keepDropdownOpen() {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
  }

  onMouseLeave() {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    this.hoverTimeout = setTimeout(() => {
      if (this.lms.activeNavDropdown()?.startsWith('topmenu-')) {
        this.lms.closeNavDropdown();
      }
    }, 300);
  }

  closeDropdown() {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    if (this.lms.activeNavDropdown()?.startsWith('topmenu-')) {
      this.lms.closeNavDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.lms.activeNavDropdown()?.startsWith('topmenu-')) {
        this.closeDropdown();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.closeDropdown();
  }

  isParentActive(item: NavItem): boolean {
    return isNavigationItemActive(this.router.url, item);
  }

  isChildActive(childRoute: string): boolean {
    const currentUrl = this.router.url;
    if (childRoute === '/tenants' || childRoute === '/courses' || childRoute === '/lms') {
      return currentUrl === childRoute;
    }
    return currentUrl === childRoute || currentUrl.startsWith(childRoute);
  }

  isAllowed(roles: string[]): boolean {
    const activeRole = this.lms.activeRole();
    return roles.includes(activeRole);
  }
}
