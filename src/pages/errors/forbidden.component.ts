import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { CustomAvatarComponent } from '../../components/custom-avatar/custom-avatar.component';
import { UserRole } from '../../models/lms.model';

@Component({
  selector: 'app-forbidden',
  imports: [CommonModule, RouterModule, CustomAvatarComponent],
  template: `
    <div class="min-h-[80vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      
      <!-- Top Ambient Halo -->
      <div class="relative w-full max-w-3xl text-center">
        <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-tenant-500/15 blur-3xl rounded-full pointer-events-none"></div>

        <!-- Concentric Cyber-Shield Visual Badge -->
        <div class="relative inline-flex items-center justify-center mb-6">
          <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/40 flex items-center justify-center">
              <span class="material-symbols-outlined text-4xl sm:text-5xl text-amber-600 dark:text-amber-400">
                gpp_maybe
              </span>
            </div>
          </div>
          <span class="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500 text-white shadow-md flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">lock</span> 403
          </span>
        </div>

        <!-- Status & Code Heading -->
        <div class="space-y-2 mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>Security Boundary &bull; Access Forbidden</span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-black text-text-primary tracking-tight">
            Clearance Required
          </h1>
          <p class="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Your current account credentials do not hold the required security clearance or role permissions to access this LMS resource.
          </p>
        </div>

        <!-- Security & Identity Context Card -->
        <div class="bg-base-100 rounded-3xl border border-base-300 shadow-sm p-5 sm:p-7 text-left mb-8 relative overflow-hidden backdrop-blur-md">
          <!-- Top Accent Bar -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-tenant-500"></div>

          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-base-200 dark:border-slate-800">
            <!-- Active Identity Row -->
            <div class="flex items-center gap-3.5">
              <app-custom-avatar 
                [imageUrl]="lms.activeUser().avatar" 
                [name]="lms.activeUser().name" 
                size="md" 
                shape="squircle"
                status="online">
              </app-custom-avatar>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-text-primary">{{ lms.activeUser().name }}</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tenant-100 text-tenant-700 dark:bg-tenant-950/80 dark:text-tenant-200 border border-tenant-500/30">
                    {{ activeRoleLabel() }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary">{{ lms.activeUser().email }}</p>
              </div>
            </div>

            <!-- Active Organization Badge -->
            <div class="flex items-center gap-2 bg-base-200 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-base-300 text-xs">
              <span class="material-symbols-outlined text-base text-text-secondary">domain</span>
              <span class="font-medium text-text-primary">{{ lms.activeTenant().name }}</span>
            </div>
          </div>

          <!-- Forbidden Target Details Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
            <div class="bg-base-200/60 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-base-300/80">
              <div class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-amber-500">link_off</span>
                Restricted Target
              </div>
              <p class="font-mono text-xs font-semibold text-text-primary truncate" [title]="attemptedPath()">
                {{ attemptedPath() }}
              </p>
            </div>

            <div class="bg-base-200/60 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-base-300/80">
              <div class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-amber-500">shield</span>
                Required Clearance
              </div>
              <p class="text-xs font-semibold text-text-primary truncate">
                {{ formatRequiredRoles() }}
              </p>
            </div>
          </div>

          <!-- Quick Role Switcher for Preview / Management Testing -->
          <div class="mt-5 pt-4 border-t border-base-200 dark:border-slate-800">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span class="text-xs font-semibold text-text-primary">Role Switcher Simulation</span>
                <p class="text-[11px] text-text-secondary">Switch your view mode to test permissions across roles:</p>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                @for (role of availableRoles; track role.id) {
                  <button 
                    type="button"
                    (click)="changeRole(role.id)"
                    [class]="lms.activeRole() === role.id ? 'px-2.5 py-1 rounded-xl text-xs font-bold bg-tenant-500 text-white shadow-xs' : 'px-2.5 py-1 rounded-xl text-xs font-medium bg-base-200 hover:bg-base-300 text-text-secondary hover:text-text-primary transition-colors cursor-pointer border border-base-300'">
                    {{ role.label }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button 
            type="button"
            (click)="goBack()"
            class="px-5 py-2.5 rounded-2xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-bold border border-base-300 shadow-xs flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-lg">arrow_back</span>
            Previous Page
          </button>

          <a 
            routerLink="/dashboard"
            class="btn-gradient px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-lg">dashboard</span>
            Return to Dashboard
          </a>

          <button 
            type="button"
            (click)="requestAccessElevation()"
            class="px-5 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-lg">vpn_key</span>
            Request Elevation
          </button>
        </div>

        <!-- Permitted Areas Navigation Shortcuts -->
        <div class="border-t border-base-300 pt-6">
          <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Authorized Workspaces For Your Profile
          </p>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <a routerLink="/courses" class="px-3 py-1.5 rounded-xl bg-base-100 hover:bg-base-200 text-xs font-medium text-text-primary border border-base-300 flex items-center gap-1.5 transition-colors">
              <span class="material-symbols-outlined text-sm text-tenant-500">school</span>
              Course Catalog
            </a>
            <a routerLink="/my-transcripts" class="px-3 py-1.5 rounded-xl bg-base-100 hover:bg-base-200 text-xs font-medium text-text-primary border border-base-300 flex items-center gap-1.5 transition-colors">
              <span class="material-symbols-outlined text-sm text-indigo-500">description</span>
              My Transcripts
            </a>
            <a routerLink="/webinars" class="px-3 py-1.5 rounded-xl bg-base-100 hover:bg-base-200 text-xs font-medium text-text-primary border border-base-300 flex items-center gap-1.5 transition-colors">
              <span class="material-symbols-outlined text-sm text-emerald-500">videocam</span>
              Live Webinars
            </a>
            <a routerLink="/profile" class="px-3 py-1.5 rounded-xl bg-base-100 hover:bg-base-200 text-xs font-medium text-text-primary border border-base-300 flex items-center gap-1.5 transition-colors">
              <span class="material-symbols-outlined text-sm text-amber-500">person</span>
              User Profile
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForbiddenComponent {
  lms = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  location = inject(Location);

  attemptedPath = signal<string>('/tenants');
  requiredRolesParam = signal<string>('system_admin,tenant_admin');

  availableRoles: { id: UserRole; label: string }[] = [
    { id: 'system_admin', label: 'System Admin' },
    { id: 'tenant_admin', label: 'Org Admin' },
    { id: 'lms_admin', label: 'LMS Admin' },
    { id: 'instructor', label: 'Instructor' },
    { id: 'learner', label: 'Learner' }
  ];

  constructor() {
    const qp = this.route.snapshot.queryParams;
    if (qp['path']) {
      this.attemptedPath.set(qp['path'].startsWith('/') ? qp['path'] : '/' + qp['path']);
    } else if (qp['from']) {
      this.attemptedPath.set(qp['from']);
    }

    if (qp['requiredRoles']) {
      this.requiredRolesParam.set(qp['requiredRoles']);
    }
  }

  activeRoleLabel = computed(() => {
    const role = this.lms.activeRole();
    const map: Record<string, string> = {
      system_admin: 'System Admin',
      super_admin: 'System Admin',
      tenant_admin: 'Org Admin',
      lms_admin: 'LMS Admin',
      instructor: 'Instructor',
      learner: 'Learner'
    };
    return map[role] || role;
  });

  formatRequiredRoles(): string {
    const raw = this.requiredRolesParam();
    if (!raw) return 'Administrative Privileges Required';
    const parts = raw.split(',').map(r => {
      const trimmed = r.trim();
      const labels: Record<string, string> = {
        system_admin: 'System Admin',
        super_admin: 'System Admin',
        tenant_admin: 'Org Admin',
        lms_admin: 'LMS Admin',
        instructor: 'Instructor',
        learner: 'Learner'
      };
      return labels[trimmed] || trimmed;
    });
    return parts.join(' or ');
  }

  changeRole(role: UserRole) {
    this.lms.switchRole(role);
    this.lms.showToast(`Switched active role to ${role}. Check if you now have clearance.`, 'info', 3000, 'Role Updated');
  }

  requestAccessElevation() {
    this.lms.showToast(
      `Permission elevation request for "${this.attemptedPath()}" was sent to ${this.lms.activeTenant().name} administrators.`,
      'info',
      4000,
      'Request Sent',
      'ACCESS'
    );
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
