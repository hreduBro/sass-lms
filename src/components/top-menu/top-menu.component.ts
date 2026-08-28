import { 
  Component, 
  ChangeDetectionStrategy, 
  inject, 
  signal, 
  HostListener, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnDestroy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { LmsDataService } from '../../services/lms-data.service';
import { NavItem, NavChildItem, APP_NAV_ITEMS, isNavigationItemActive } from '../../models/navigation.model';

@Component({
  selector: 'app-top-menu',
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-base-100 border-b border-base-300 shadow-xs relative select-none w-full">
      <div class="relative group/topmenu w-full">
        
        <!-- Left Gradient Edge Fade & Scroll Chevron Button -->
        @if (canScrollLeft()) {
          <div class="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-base-100 via-base-100/90 to-transparent pointer-events-none z-20 transition-opacity duration-200"></div>
          <button 
            type="button"
            (click)="scrollMenu('left')" 
            aria-label="Scroll top menu left"
            class="absolute left-1 top-1/2 -translate-y-1/2 z-30 w-6 h-6 rounded-full bg-base-100/90 dark:bg-slate-800/90 border border-base-300/80 dark:border-slate-700/80 shadow-xs hover:shadow-sm flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-sm">chevron_left</span>
          </button>
        }

        <!-- Right Gradient Edge Fade & Scroll Chevron Button -->
        @if (canScrollRight()) {
          <div class="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-base-100 via-base-100/90 to-transparent pointer-events-none z-20 transition-opacity duration-200"></div>
          <button 
            type="button"
            (click)="scrollMenu('right')" 
            aria-label="Scroll top menu right"
            class="absolute right-1 top-1/2 -translate-y-1/2 z-30 w-6 h-6 rounded-full bg-base-100/90 dark:bg-slate-800/90 border border-base-300/80 dark:border-slate-700/80 shadow-xs hover:shadow-sm flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-base-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        }

        <!-- Main Horizontal Scroll Track with Ultra-Thin Slick Scrollbar -->
        <div 
          #scrollContainer
          (scroll)="onTrackScroll()"
          (wheel)="onWheel($event)"
          class="top-menu-scroll-track px-3 sm:px-6 py-1.5 overflow-x-auto scroll-smooth">
          
          <div class="flex items-center gap-1 sm:gap-1.5 min-w-max">
            @for (item of navItems; track item.label) {
              @if (isAllowed(item.roles)) {
                @if (item.children && item.children.length > 0) {
                  <!-- Nested Dropdown Menu Trigger Item -->
                  <div 
                    [id]="'top-menu-item-' + getItemId(item.label)"
                    class="relative flex-shrink-0" 
                    (mouseenter)="onMouseEnter(item.label, $event)" 
                    (mouseleave)="onMouseLeave()">
                    <button 
                      type="button"
                      [id]="'top-menu-btn-' + getItemId(item.label)"
                      (click)="toggleDropdown(item.label, $event)"
                      [class]="isParentActive(item) 
                        ? 'bg-[#FDF2F8] dark:bg-pink-950/30 text-[#EC008C] dark:text-[#F472B6] font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all select-none group cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-0 outline-none">
                      
                      <!-- Active Indicator Dot -->
                      @if (isParentActive(item)) {
                        <span class="w-1.5 h-1.5 rounded-full bg-[#EC008C] flex-shrink-0"></span>
                      }
                      
                      <span class="material-symbols-outlined text-base flex-shrink-0 group-hover:scale-105 transition-transform" 
                            [class.text-[#EC008C]]="isParentActive(item)" 
                            [class.text-slate-500]="!isParentActive(item)">
                        {{ item.icon }}
                      </span>
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
                  </div>
                } @else {
                  <!-- Standard Direct Link Navigation Item -->
                  <div [id]="'top-menu-item-' + getItemId(item.label)" class="flex-shrink-0">
                    <a 
                      [routerLink]="item.route"
                      (click)="closeDropdown()"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all flex-shrink-0 active:scale-[0.98] select-none cursor-pointer focus:outline-none focus:ring-0 outline-none"
                      [class]="isParentActive(item) ? 'bg-[#FDF2F8] dark:bg-pink-950/30 text-[#EC008C] dark:text-[#F472B6] font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'">
                      
                      <!-- Active Indicator Dot -->
                      @if (isParentActive(item)) {
                        <span class="w-1.5 h-1.5 rounded-full bg-[#EC008C] flex-shrink-0"></span>
                      }

                      <span class="material-symbols-outlined text-base flex-shrink-0" 
                            [class.text-[#EC008C]]="isParentActive(item)" 
                            [class.text-slate-500]="!isParentActive(item)">
                        {{ item.icon }}
                      </span>
                      <span class="whitespace-nowrap">{{ item.label }}</span>
                      
                      @if (item.badge) {
                        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                              [class]="isParentActive(item) ? 'bg-[#EC008C] text-white shadow-2xs' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200'">
                          {{ item.badge }}
                        </span>
                      }
                    </a>
                  </div>
                }
              }
            }
          </div>
        </div>

      </div>
    </nav>

    <!-- Global Fixed Submenu Popover (Rendered in fixed coordinates to prevent clipping by overflow-x container) -->
    @for (item of navItems; track item.label) {
      @if (item.children && item.children.length > 0 && isDropdownOpen(item.label) && activeDropdownPos()) {
        <div 
          class="fixed z-50 animate-dropdown"
          [style.top.px]="activeDropdownPos()!.top"
          [style.left.px]="activeDropdownPos()!.left"
          (mouseenter)="keepDropdownOpen()"
          (mouseleave)="onMouseLeave()"
          (click)="$event.stopPropagation()">
          
          <div class="bg-base-100 rounded-2xl border border-base-300 shadow-2xl p-2.5 space-y-1 w-76 max-w-[90vw]">
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
    }
  `,
  styles: [`
    .top-menu-scroll-track {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .top-menu-scroll-track::-webkit-scrollbar {
      height: 1.5px;
    }
    .top-menu-scroll-track::-webkit-scrollbar-track {
      background: transparent;
    }
    .top-menu-scroll-track::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 9999px;
      transition: background 0.3s ease;
    }
    .top-menu-scroll-track:hover::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.22);
    }
    .top-menu-scroll-track::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.45);
    }
    :host-context(.dark) .top-menu-scroll-track:hover::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.18);
    }
    :host-context(.dark) .top-menu-scroll-track::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.4);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopMenuComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainerRef?: ElementRef<HTMLDivElement>;

  lms = inject(LmsDataService);
  router = inject(Router);
  elementRef = inject(ElementRef);
  
  canScrollLeft = signal<boolean>(false);
  canScrollRight = signal<boolean>(false);
  activeDropdownPos = signal<{ top: number; left: number } | null>(null);

  private hoverTimeout: any = null;
  private resizeObserver?: ResizeObserver;
  private routeSubscription?: Subscription;

  navItems: NavItem[] = APP_NAV_ITEMS;

  constructor() {
    // Auto-close dropdown and auto-scroll to active item when route changes
    this.routeSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeDropdown();
      this.scrollToActiveItem();
    });
  }

  ngAfterViewInit() {
    this.updateScrollState();
    this.scrollToActiveItem();

    // Listen for container resize
    if (this.scrollContainerRef?.nativeElement && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateScrollState();
      });
      this.resizeObserver.observe(this.scrollContainerRef.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  getItemId(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  isDropdownOpen(label: string): boolean {
    return this.lms.isNavDropdownOpen('topmenu-' + label);
  }

  toggleDropdown(label: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    
    const wasOpen = this.isDropdownOpen(label);
    if (wasOpen) {
      this.closeDropdown();
    } else {
      this.calculateDropdownPosition(label, event.currentTarget as HTMLElement);
      this.lms.toggleNavDropdown('topmenu-' + label);
    }
  }

  onMouseEnter(label: string, event: MouseEvent) {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    // Only switch on hover if a top menu dropdown is ALREADY open
    if (this.lms.activeNavDropdown()?.startsWith('topmenu-')) {
      const trigger = document.getElementById('top-menu-btn-' + this.getItemId(label));
      if (trigger) {
        this.calculateDropdownPosition(label, trigger);
      }
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
        this.closeDropdown();
      }
    }, 300);
  }

  closeDropdown() {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    if (this.lms.activeNavDropdown()?.startsWith('topmenu-')) {
      this.lms.closeNavDropdown();
    }
    this.activeDropdownPos.set(null);
  }

  private calculateDropdownPosition(label: string, triggerEl: HTMLElement) {
    const rect = triggerEl.getBoundingClientRect();
    const dropdownWidth = 304; // 76 * 4 px
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - dropdownWidth - 16);
    }
    this.activeDropdownPos.set({
      top: rect.bottom + 4,
      left: Math.max(12, left)
    });
  }

  onTrackScroll() {
    this.updateScrollState();
    // If a dropdown is currently open, update or close it to maintain alignment
    const activeKey = this.lms.activeNavDropdown();
    if (activeKey?.startsWith('topmenu-')) {
      const label = activeKey.replace('topmenu-', '');
      const trigger = document.getElementById('top-menu-btn-' + this.getItemId(label));
      if (trigger) {
        this.calculateDropdownPosition(label, trigger);
      }
    }
  }

  updateScrollState() {
    const el = this.scrollContainerRef?.nativeElement;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    this.canScrollLeft.set(scrollLeft > 6);
    this.canScrollRight.set(scrollLeft + clientWidth < scrollWidth - 6);
  }

  scrollMenu(direction: 'left' | 'right', amount = 220) {
    const el = this.scrollContainerRef?.nativeElement;
    if (!el) return;
    const delta = direction === 'left' ? -amount : amount;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(() => this.updateScrollState(), 200);
  }

  onWheel(event: WheelEvent) {
    const el = this.scrollContainerRef?.nativeElement;
    if (!el) return;
    if (event.deltaY !== 0 && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      if (el.scrollWidth > el.clientWidth) {
        event.preventDefault();
        el.scrollLeft += event.deltaY * 0.85;
        this.onTrackScroll();
      }
    }
  }

  scrollToActiveItem() {
    setTimeout(() => {
      const container = this.scrollContainerRef?.nativeElement;
      if (!container) return;

      const activeItem = this.navItems.find(item => isNavigationItemActive(this.router.url, item));
      if (!activeItem) return;

      const itemEl = document.getElementById('top-menu-item-' + this.getItemId(activeItem.label));
      if (container && itemEl) {
        const containerRect = container.getBoundingClientRect();
        const itemRect = itemEl.getBoundingClientRect();
        const targetScroll = container.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width / 2) + (itemRect.width / 2);
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
      this.updateScrollState();
    }, 80);
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

  @HostListener('window:resize')
  onWindowResize() {
    this.updateScrollState();
  }

  isParentActive(item: NavItem): boolean {
    return isNavigationItemActive(this.router.url, item);
  }

  isChildActive(childRoute: string): boolean {
    const currentUrl = this.router.url;
    if (childRoute === '/tenants' || childRoute === '/courses' || childRoute === '/lms' || childRoute === '/plans') {
      return currentUrl === childRoute;
    }
    return currentUrl === childRoute || currentUrl.startsWith(childRoute);
  }

  isAllowed(roles: string[]): boolean {
    const activeRole = this.lms.activeRole();
    return roles.includes(activeRole);
  }
}
