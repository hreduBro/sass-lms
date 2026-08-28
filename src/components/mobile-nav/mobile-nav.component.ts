import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { ThemeService } from '../../services/theme.service';
import { NavItem, NavChildItem, APP_NAV_ITEMS, isNavigationItemActive, isNavChildActive } from '../../models/navigation.model';

@Component({
  selector: 'app-mobile-nav',
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Bottom Navigation Bar (Visible only on mobile & tablet < md) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-100/95 backdrop-blur-lg border-t border-base-300 px-2 py-1.5 shadow-lg safe-area-bottom">
      <div class="flex items-center justify-around gap-1">
        
        <!-- 1. Dashboard -->
        <a 
          routerLink="/dashboard"
          [routerLinkActive]="'bg-tenant-500/15 dark:bg-tenant-500/25 text-tenant-700 dark:text-tenant-200 font-bold'"
          [routerLinkActiveOptions]="{ exact: true }"
          #homeRla="routerLinkActive"
          class="flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] min-h-[44px] rounded-xl transition-all active:scale-95 flex-1 relative focus:outline-none focus:ring-0 outline-none"
          [class]="homeRla.isActive ? '' : 'text-text-secondary hover:text-text-primary hover:bg-base-200/50 font-medium'">
          
          <div class="relative flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">space_dashboard</span>
            @if (homeRla.isActive) {
              <span class="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-tenant-500"></span>
            }
          </div>
          <span class="text-[10px] tracking-tight mt-0.5">Dashboard</span>
        </a>

        <!-- 2. Courses -->
        <a 
          routerLink="/courses"
          [routerLinkActive]="'bg-tenant-500/15 dark:bg-tenant-500/25 text-tenant-700 dark:text-tenant-200 font-bold'"
          #coursesRla="routerLinkActive"
          class="flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] min-h-[44px] rounded-xl transition-all active:scale-95 flex-1 relative focus:outline-none focus:ring-0 outline-none"
          [class]="coursesRla.isActive ? '' : 'text-text-secondary hover:text-text-primary hover:bg-base-200/50 font-medium'">
          
          <div class="relative flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">school</span>
            @if (coursesRla.isActive) {
              <span class="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-tenant-500"></span>
            }
          </div>
          <span class="text-[10px] tracking-tight mt-0.5">Courses</span>
        </a>

        <!-- 3. Live Classrooms -->
        <a 
          routerLink="/webinars"
          [routerLinkActive]="'bg-tenant-500/15 dark:bg-tenant-500/25 text-tenant-700 dark:text-tenant-200 font-bold'"
          #webinarsRla="routerLinkActive"
          class="flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] min-h-[44px] rounded-xl transition-all active:scale-95 flex-1 relative focus:outline-none focus:ring-0 outline-none"
          [class]="webinarsRla.isActive ? '' : 'text-text-secondary hover:text-text-primary hover:bg-base-200/50 font-medium'">
          
          <div class="relative flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">videocam</span>
            @if (lms.webinars().length > 0 && !webinarsRla.isActive) {
              <span class="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            }
            @if (webinarsRla.isActive) {
              <span class="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-tenant-500"></span>
            }
          </div>
          <span class="text-[10px] tracking-tight mt-0.5">Live Class</span>
        </a>

        <!-- 4. Analytics or Certificates based on role -->
        @if (lms.activeRole() === 'system_admin' || lms.activeRole() === 'lms_admin' || lms.activeRole() === 'super_admin' || lms.activeRole() === 'tenant_admin') {
          <a 
            routerLink="/analytics"
            [routerLinkActive]="'bg-tenant-500/15 dark:bg-tenant-500/25 text-tenant-700 dark:text-tenant-200 font-bold'"
            #analyticsRla="routerLinkActive"
            class="flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] min-h-[44px] rounded-xl transition-all active:scale-95 flex-1 relative focus:outline-none focus:ring-0 outline-none"
            [class]="analyticsRla.isActive ? '' : 'text-text-secondary hover:text-text-primary hover:bg-base-200/50 font-medium'">
            
            <div class="relative flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">analytics</span>
              @if (analyticsRla.isActive) {
                <span class="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-tenant-500"></span>
              }
            </div>
            <span class="text-[10px] tracking-tight mt-0.5">Analytics</span>
          </a>
        } @else {
          <a 
            routerLink="/certificates"
            [routerLinkActive]="'bg-tenant-500/15 dark:bg-tenant-500/25 text-tenant-700 dark:text-tenant-200 font-bold'"
            #certsRla="routerLinkActive"
            class="flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] min-h-[44px] rounded-xl transition-all active:scale-95 flex-1 relative focus:outline-none focus:ring-0 outline-none"
            [class]="certsRla.isActive ? '' : 'text-text-secondary hover:text-text-primary hover:bg-base-200/50 font-medium'">
            
            <div class="relative flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">verified</span>
              @if (certsRla.isActive) {
                <span class="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-tenant-500"></span>
              }
            </div>
            <span class="text-[10px] tracking-tight mt-0.5">Certificates</span>
          </a>
        }

        <!-- 5. More Menu Drawer Trigger -->
        <button 
          (click)="showMoreDrawer.set(true)"
          class="flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] min-h-[44px] rounded-xl text-text-secondary hover:text-text-primary hover:bg-base-200/50 transition-colors active:scale-95 flex-1 cursor-pointer focus:outline-none focus:ring-0 outline-none">
          <span class="material-symbols-outlined text-2xl">menu</span>
          <span class="text-[10px] tracking-tight mt-0.5 font-medium">More</span>
        </button>

      </div>
    </nav>

    <!-- Mobile "More" Bottom Sheet Drawer -->
    @if (showMoreDrawer()) {
      <div 
        class="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-modal-backdrop"
        (click)="showMoreDrawer.set(false)">
        
        <!-- Sheet Container -->
        <div 
          class="bg-base-100 rounded-t-3xl border-t border-base-300 p-5 space-y-4 max-h-[88vh] overflow-y-auto animate-slide-up-drawer shadow-2xl"
          (click)="$event.stopPropagation()">
          
          <!-- Drag Handle & Header -->
          <div class="flex items-center justify-between pb-3 border-b border-base-300">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-2xl bg-tenant-500 text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
                {{ lms.activeTenant().name.substring(0, 1) }}
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-sm text-text-primary truncate">{{ lms.activeTenant().name }}</h3>
                <span class="text-[11px] text-text-secondary truncate block">{{ lms.activeUser().name }} ({{ lms.activeRole() === 'system_admin' ? 'System Admin' : lms.activeRole() === 'lms_admin' ? 'LMS Admin' : lms.activeRole().replace('_', ' ') }})</span>
              </div>
            </div>
            <button 
              (click)="showMoreDrawer.set(false)" 
              class="w-9 h-9 rounded-xl bg-base-200 hover:bg-base-300 flex items-center justify-center text-text-secondary flex-shrink-0 cursor-pointer focus:outline-none focus:ring-0 outline-none">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <!-- Section: Grouped Items with Children (Organizations, LMS Instances, Courses & Catalog) -->
          @for (group of groupedNavItems(); track group.label) {
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-xs">{{ group.icon }}</span>
                  {{ group.label }}
                </span>
                @if (group.badge) {
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#EC008C] text-white">
                    {{ group.badge }}
                  </span>
                }
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                @for (child of group.children; track child.route) {
                  @if (!child.roles || isAllowed(child.roles)) {
                    <a 
                      [routerLink]="child.route" 
                      (click)="showMoreDrawer.set(false)"
                      class="p-3 rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer focus:outline-none focus:ring-0 outline-none border"
                      [class]="isChildActive(child) 
                        ? 'bg-[#EC008C] border-transparent text-white font-semibold shadow-xs' 
                        : 'bg-base-200/70 hover:bg-base-300/70 border-transparent text-slate-700 dark:text-slate-300'">
                      
                      <span class="material-symbols-outlined text-xl flex-shrink-0"
                            [class]="isChildActive(child) ? 'text-white' : 'text-[#EC008C]'">{{ child.icon }}</span>
                      <div class="text-left min-w-0 flex-1">
                        <div class="flex items-center gap-1">
                          <span class="font-bold text-xs truncate block" [class.text-white]="isChildActive(child)">{{ child.label }}</span>
                          @if (child.badge) {
                            <span class="text-[8px] px-1 py-0.2 rounded font-bold uppercase"
                                  [class]="isChildActive(child) ? 'bg-white/20 text-white' : (child.badge === 'Wizard' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')">
                              {{ child.badge }}
                            </span>
                          }
                        </div>
                        @if (child.description) {
                          <span class="text-[10px] block truncate" [class]="isChildActive(child) ? 'text-white/80' : 'text-slate-400'">{{ child.description }}</span>
                        }
                      </div>
                      @if (isChildActive(child)) {
                        <span class="material-symbols-outlined text-xs text-white flex-shrink-0 font-bold">check</span>
                      }
                    </a>
                  }
                }
              </div>
            </div>
          }

          <!-- Section: Single Nav Items -->
          <div class="space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Workspace Modules</span>
            <div class="grid grid-cols-2 gap-2.5">
              @for (item of directNavItems(); track item.label) {
                <a 
                  [routerLink]="item.route" 
                  (click)="showMoreDrawer.set(false)"
                  class="p-3 rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer focus:outline-none focus:ring-0 outline-none border"
                  [class]="isItemActive(item) 
                    ? 'bg-[#FDF2F8] dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/30 text-[#EC008C] dark:text-[#F472B6] font-bold' 
                    : 'bg-base-200/70 hover:bg-base-300/70 border-transparent text-slate-700 dark:text-slate-300'">
                  
                  <span class="material-symbols-outlined text-xl flex-shrink-0" [class.text-[#EC008C]]="isItemActive(item)" [class.text-slate-500]="!isItemActive(item)">{{ item.icon }}</span>
                  <div class="text-left min-w-0 flex-1">
                    <div class="flex items-center gap-1">
                      <span class="font-bold text-xs block truncate">{{ item.label }}</span>
                      @if (item.badge) {
                        <span class="text-[8px] px-1.5 py-0.2 rounded font-bold uppercase"
                              [class]="isItemActive(item) ? 'bg-[#EC008C] text-white' : 'bg-tenant-100 text-tenant-700 dark:bg-tenant-950/80 dark:text-tenant-200'">
                          {{ item.badge }}
                        </span>
                      }
                    </div>
                    @if (item.description) {
                      <span class="text-[10px] block truncate" [class]="isItemActive(item) ? 'text-[#EC008C]/80 dark:text-[#F472B6]/80' : 'text-slate-400'">{{ item.description }}</span>
                    }
                  </div>
                  @if (isItemActive(item)) {
                    <span class="material-symbols-outlined text-xs text-[#EC008C] dark:text-[#F472B6] flex-shrink-0">check_circle</span>
                  }
                </a>
              }
            </div>
          </div>

          <!-- Quick Theme & Role Actions -->
          <div class="p-3.5 rounded-2xl bg-base-200/70 border border-base-300 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">palette</span> Appearance
              </span>
              <div class="flex items-center gap-1 bg-base-100 p-1 rounded-xl border border-base-300">
                <button 
                  (click)="themeService.setThemeMode('light')"
                  class="px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-0 outline-none"
                  [class]="themeService.themeMode() === 'light' ? 'bg-tenant-500 text-white font-bold shadow-xs' : 'text-text-secondary'">
                  Light
                </button>
                <button 
                  (click)="themeService.setThemeMode('dark')"
                  class="px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-0 outline-none"
                  [class]="themeService.themeMode() === 'dark' ? 'bg-tenant-500 text-white font-bold shadow-xs' : 'text-text-secondary'">
                  Dark
                </button>
                <button 
                  (click)="themeService.setThemeMode('system')"
                  class="px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-0 outline-none"
                  [class]="themeService.themeMode() === 'system' ? 'bg-tenant-500 text-white font-bold shadow-xs' : 'text-text-secondary'">
                  Auto
                </button>
              </div>
            </div>

            <!-- Role Simulator -->
            <div class="flex items-center justify-between pt-2 border-t border-base-300">
              <span class="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">badge</span> Switch Role
              </span>
              <select 
                [ngModel]="lms.activeRole()"
                (ngModelChange)="lms.switchRole($event)"
                class="px-2.5 py-1.5 rounded-xl bg-base-100 border border-base-300 text-xs font-semibold text-text-primary focus:outline-none">
                <option value="system_admin">System Admin</option>
                <option value="tenant_admin">Org Admin</option>
                <option value="lms_admin">LMS Admin</option>
                <option value="instructor">Instructor</option>
                <option value="learner">Learner</option>
              </select>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="pt-2">
            <button 
              type="button" 
              (click)="showMoreDrawer.set(false)"
              class="w-full py-3 rounded-2xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-bold transition-colors cursor-pointer focus:outline-none focus:ring-0 outline-none">
              Close Menu
            </button>
          </div>

        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileNavComponent {
  lms = inject(LmsDataService);
  themeService = inject(ThemeService);
  router = inject(Router);
  showMoreDrawer = signal<boolean>(false);

  navItems: NavItem[] = APP_NAV_ITEMS;

  isAllowed(roles: string[]): boolean {
    const activeRole = this.lms.activeRole();
    return roles.includes(activeRole) ||
      (activeRole === 'super_admin' && roles.includes('system_admin')) ||
      (activeRole === 'system_admin' && roles.includes('super_admin'));
  }

  groupedNavItems() {
    return this.navItems.filter(item => item.children && item.children.length > 0 && this.isAllowed(item.roles));
  }

  directNavItems() {
    return this.navItems.filter(item => (!item.children || item.children.length === 0) && this.isAllowed(item.roles));
  }

  isItemActive(item: NavItem): boolean {
    return isNavigationItemActive(this.router.url, item);
  }

  isChildActive(child: NavChildItem | string): boolean {
    return isNavChildActive(this.router.url, child);
  }
}
