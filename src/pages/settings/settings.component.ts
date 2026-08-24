import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { LmsApiService } from '../../services/lms-api.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { Tenant, NavigationLayoutMode, HeaderDensity, ContentWidthMode } from '../../models/lms.model';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  lms = inject(LmsDataService);
  api = inject(LmsApiService);
  themeService = inject(ThemeService);

  savedNotification = signal<boolean>(false);
  layoutPrefs = this.lms.adminLayoutPreferences;

  // Editable settings copy
  settingsForm = {
    name: '',
    domain: '',
    tagline: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#4f46e5',
    accentColor: '#06b6d4',
    themePreset: 'solid' as 'solid' | 'glassmorphism' | 'neumorphic',
    ssoProvider: 'Okta' as 'Okta' | 'SAML 2.0' | 'Azure AD' | 'Google Workspace' | 'None',
    enforceMfa: true,
    scormEnabled: true,
    certAutoIssue: true,
    sessionTimeoutMins: 60,
    escalationDays: 7
  };

  constructor() {
    effect(() => {
      const t = this.lms.activeTenant();
      this.settingsForm = {
        name: t.name,
        domain: t.domain,
        tagline: t.branding.tagline,
        logoUrl: t.branding.logoUrl,
        faviconUrl: t.branding.faviconUrl || '',
        primaryColor: t.branding.primaryColor,
        accentColor: t.branding.accentColor,
        themePreset: t.branding.themePreset || 'solid',
        ssoProvider: t.branding.ssoProvider,
        enforceMfa: true,
        scormEnabled: true,
        certAutoIssue: true,
        sessionTimeoutMins: 60,
        escalationDays: 7
      };
    });
  }

  setNavMode(mode: NavigationLayoutMode) {
    this.lms.updateLayoutPreferences({ navigationMode: mode });
  }

  setHeaderDensity(density: HeaderDensity) {
    this.lms.updateLayoutPreferences({ headerDensity: density });
  }

  setContentWidth(width: ContentWidthMode) {
    this.lms.updateLayoutPreferences({ contentWidth: width });
  }

  setThemeMode(mode: ThemeMode) {
    this.themeService.setThemeMode(mode);
  }

  onLiveColorChange() {
    if (this.settingsForm.primaryColor) {
      this.lms.applyTenantTheme(
        this.settingsForm.primaryColor,
        this.settingsForm.accentColor,
        this.settingsForm.faviconUrl,
        this.settingsForm.name,
        this.settingsForm.themePreset
      );
    }
  }

  saveSettings() {
    const current = this.lms.activeTenant();
    const updated: Tenant = {
      ...current,
      name: this.settingsForm.name,
      domain: this.settingsForm.domain,
      branding: {
        ...current.branding,
        tagline: this.settingsForm.tagline,
        logoUrl: this.settingsForm.logoUrl,
        faviconUrl: this.settingsForm.faviconUrl,
        primaryColor: this.settingsForm.primaryColor,
        accentColor: this.settingsForm.accentColor,
        themePreset: this.settingsForm.themePreset,
        ssoProvider: this.settingsForm.ssoProvider
      }
    };

    this.lms.updateTenant(updated);
    this.lms.showToast('Settings and live CSS brand theme have been successfully updated!', 'success', 3500, 'Settings Saved');
    this.savedNotification.set(true);
    setTimeout(() => this.savedNotification.set(false), 3500);
  }
}

