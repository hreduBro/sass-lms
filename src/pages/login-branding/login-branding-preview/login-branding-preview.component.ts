import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { LoginBrandingConfig } from '../../../models/login-branding.model';

type ViewportMode = 'desktop' | 'laptop' | 'tablet' | 'mobile';

@Component({
  selector: 'app-login-branding-preview',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login-branding-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginBrandingPreviewComponent {
  lms = inject(LmsDataService);
  router = inject(Router);

  // Viewport simulation state
  viewport = signal<ViewportMode>('desktop');
  showDeviceFrame = signal<boolean>(false);
  previewTheme = signal<'light' | 'dark'>('light');
  zoomLevel = signal<number>(100);

  // Form simulation state
  simEmail = signal<string>('farhana.ahmed@brac.net');
  simPassword = signal<string>('••••••••••••');
  simRememberMe = signal<boolean>(true);
  showPassword = signal<boolean>(false);
  simSelectedLang = signal<string>('English');
  isSubmitting = signal<boolean>(false);

  branding = computed<LoginBrandingConfig>(() => this.lms.loginBranding());

  // Available tenants for quick-previewing
  tenants = computed(() => this.lms.tenants());
  activeTenantId = computed(() => this.lms.activeTenant().id);

  setViewport(mode: ViewportMode) {
    this.viewport.set(mode);
    if (mode === 'mobile' || mode === 'tablet') {
      this.showDeviceFrame.set(true);
    } else {
      this.showDeviceFrame.set(false);
    }
  }

  toggleTheme() {
    this.previewTheme.update(t => t === 'light' ? 'dark' : 'light');
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onSimulateLogin() {
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.lms.showToast('Login simulation successful! In production, this authenticates the user.', 'success', 3000, 'SSO Verified');
    }, 1200);
  }

  onResetDefaults() {
    if (confirm('Are you sure you want to reset login branding to organization standard defaults?')) {
      this.lms.resetLoginBrandingToDefault();
    }
  }

  onTenantChange(tenantId: string) {
    this.lms.switchTenant(tenantId);
    const tenant = this.lms.tenants().find(t => t.id === tenantId);
    if (tenant) {
      this.lms.updateLoginBranding({
        tenantId: tenant.id,
        headline: `Welcome to ${tenant.name} Learning Portal`,
        tagline: tenant.branding.tagline || this.branding().tagline,
        primaryColor: tenant.branding.primaryColor || this.branding().primaryColor,
        accentColor: tenant.branding.accentColor || this.branding().accentColor,
        logoUrlLight: tenant.branding.logoUrl || this.branding().logoUrlLight,
        logoUrlDark: tenant.branding.logoUrl || this.branding().logoUrlDark
      });
      this.lms.showToast(`Previewing login branding for ${tenant.name}`, 'info', 2500, 'Tenant Switched');
    }
  }

  getViewportWidth(): string {
    switch (this.viewport()) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'laptop': return '1024px';
      case 'desktop':
      default: return '100%';
    }
  }

  getViewportHeight(): string {
    switch (this.viewport()) {
      case 'mobile': return '760px';
      case 'tablet': return '840px';
      case 'laptop': return '680px';
      case 'desktop':
      default: return '780px';
    }
  }
}
