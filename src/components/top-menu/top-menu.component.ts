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
                    ? 'bg-[#FDF2F8] dark:bg-pink-950/30 text-[#EC008C] dark:text-[#F472B6] font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all select-none group cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-0 outline-none">
                  
                  <!-- Active Indicator Dot -->
                  @if (isParentActive(item)) {
                    <span class="w-1.5 h-1.5 rounded-full bg-[#EC008C] flex-shrink-0"></span>
                  }
                  
                  <span class="material-symbols-outlined text-base flex-shrink-0 group-hover:scale-105 transition-transform" [class.text-[#EC008C]]="isParentActive(item)" [class.text-slate-500]="!isParentActive(item)">{{ item.icon }}</span>
                  <span class="whitespace-nowrap">{{ item.label }}</span>
                  
                  @if (item.badge) {
                    <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          [class]="isParentActive(item) ? 'bg-[#EC008C] text-white shadow-2xs' : 'bg-tenant-100 dark:bg-tenant-950/80 text-tenant-700 dark:text-tenant-300'">
                      {{ item.badge }}
                    </span>
                  }
                  
                  <span class="material-symbols-outlined text-sm transition-transform duration-200"
                        [class.text-[#EC008C]]="isParentActive(item)"
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
                      <div class="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-base-300/80 mb-1 flex items-center justify-between">
                        <span>{{ item.label }}</span>
                        <span class="text-[9px] font-normal text-slate-400">Select view</span>
                      </div>

                      <div class="space-y-1">
                        @for (child of item.children; track child.route) {
                          <a 
                            [routerLink]="child.route"
                            (click)="closeDropdown()"
                            class="flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all group cursor-pointer focus:outline-none focus:ring-0 outline-none"
                            [class]="isChildActive(child.route) ? 'bg-[#EC008C] hover:bg-[#D8007E] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'">
                            
                            <div class="flex items-center gap-2.5 min-w-0">
                              <span class="material-symbols-outlined text-base flex-shrink-0"
                                    [class]="isChildActive(child.route) ? 'text-white' : 'text-slate-500 group-hover:scale-105 transition-transform'">
                                {{ child.icon }}
                              </span>
                              <div class="min-w-0">
                                <span class="truncate block font-medium" [class.font-bold]="isChildActive(child.route)">{{ child.label }}</span>
                                @if (child.description) {
                                  <span class="text-[10px] block truncate" [class]="isChildActive(child.route) ? 'text-white/80' : 'text-slate-400'">
                                    {{ child.description }}
                                  </span>
                                }
                              </div>
                            </div>

                            <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                              @if (child.badge) {
                                <span class="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold"
                                      [class]="isChildActive(child.route) 
                                        ? 'bg-white/20 text-white' 
                                        : (child.badge.toLowerCase() === 'wizard' 
                                          ? 'bg-[#FEF3C7] text-[#92400E] dark:bg-amber-950 dark:text-amber-200' 
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')">
                                  {{ child.badge }}
                                </span>
                              }
                              @if (isChildActive(child.route)) {
                                <span class="material-symbols-outlined text-sm text-white font-bold flex-shrink-0">check</span>
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
                [class]="isParentActive(item) ? 'bg-[#FDF2F8] dark:bg-pink-950/30 text-[#EC008C] dark:text-[#F472B6] font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'">
                
                <!-- Active Indicator Dot -->
                @if (isParentActive(item)) {
                  <span class="w-1.5 h-1.5 rounded-full bg-[#EC008C] flex-shrink-0"></span>
                }

                <span class="material-symbols-outlined text-base flex-shrink-0" [class.text-[#EC008C]]="isParentActive(item)" [class.text-slate-500]="!isParentActive(item)">{{ item.icon }}</span>
                <span class="whitespace-nowrap">{{ item.label }}</span>
                
                @if (item.badge) {
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                        [class]="isParentActive(item) ? 'bg-[#EC008C] text-white shadow-2xs' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200'">
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
