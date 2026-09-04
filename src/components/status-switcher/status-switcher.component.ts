import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-status-switcher',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="inline-flex items-center p-1 rounded-full bg-base-200/90 dark:bg-slate-900/90 border border-base-300 dark:border-slate-800 shadow-xs backdrop-blur-md max-w-full overflow-x-auto select-none">
      
      <a 
        routerLink="/404"
        [class]="activeType() === '404' 
          ? 'bg-base-100 text-tenant-600 dark:text-tenant-400 font-bold shadow-xs border border-base-300/80' 
          : 'text-text-secondary hover:text-text-primary'"
        class="px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
        <span class="w-1.5 h-1.5 rounded-full" [style.background-color]="activeType() === '404' ? 'var(--tenant-primary)' : 'currentColor'"></span>
        <span>404 Not Found</span>
      </a>

      <a 
        routerLink="/maintenance"
        [class]="activeType() === 'maintenance' 
          ? 'bg-base-100 text-tenant-600 dark:text-tenant-400 font-bold shadow-xs border border-base-300/80' 
          : 'text-text-secondary hover:text-text-primary'"
        class="px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
        <span class="w-1.5 h-1.5 rounded-full" [style.background-color]="activeType() === 'maintenance' ? 'var(--tenant-primary)' : 'currentColor'"></span>
        <span>Maintenance</span>
      </a>

      <a 
        routerLink="/401"
        [class]="activeType() === '401' 
          ? 'bg-base-100 text-tenant-600 dark:text-tenant-400 font-bold shadow-xs border border-base-300/80' 
          : 'text-text-secondary hover:text-text-primary'"
        class="px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
        <span class="w-1.5 h-1.5 rounded-full" [style.background-color]="activeType() === '401' ? 'var(--tenant-primary)' : 'currentColor'"></span>
        <span>401 Unauthorized</span>
      </a>

      <a 
        routerLink="/500"
        [class]="activeType() === '500' 
          ? 'bg-base-100 text-tenant-600 dark:text-tenant-400 font-bold shadow-xs border border-base-300/80' 
          : 'text-text-secondary hover:text-text-primary'"
        class="px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
        <span class="w-1.5 h-1.5 rounded-full" [style.background-color]="activeType() === '500' ? 'var(--tenant-primary)' : 'currentColor'"></span>
        <span>500 Server Error</span>
      </a>

      <a 
        routerLink="/403"
        [class]="activeType() === '403' 
          ? 'bg-base-100 text-tenant-600 dark:text-tenant-400 font-bold shadow-xs border border-base-300/80' 
          : 'text-text-secondary hover:text-text-primary'"
        class="px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
        <span class="w-1.5 h-1.5 rounded-full" [style.background-color]="activeType() === '403' ? 'var(--tenant-primary)' : 'currentColor'"></span>
        <span>403 Forbidden</span>
      </a>

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusSwitcherComponent {
  activeType = input.required<'404' | 'maintenance' | '401' | '500' | '403'>();
}
