import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { LmsApiService } from '../../services/lms-api.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { Tenant, NavigationLayoutMode, HeaderDensity, ContentWidthMode, TenantBranding } from '../../models/lms.model';

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

  // Editable settings copy mapped to active LMS
  settingsForm = {
    name: '',
    domain: '',
    tagline: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#861F41',
    accentColor: '#d97706',
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
      const activeLms = this.lms.activeLms();
      const t = this.lms.activeTenant();
      
      const branding: TenantBranding = activeLms?.branding || t.branding;
      this.settingsForm = {
        name: activeLms ? activeLms.basicInfo.lmsName : t.name,
        domain: activeLms ? (activeLms.basicInfo.urlDomain || t.domain) : t.domain,
        tagline: branding.tagline || (activeLms ? activeLms.basicInfo.programmeDepartment : t.branding.tagline),
        logoUrl: branding.logoUrl || t.branding.logoUrl,
        faviconUrl: branding.faviconUrl || t.branding.faviconUrl || '',
        primaryColor: branding.primaryColor || '#861F41',
        accentColor: branding.accentColor || '#d97706',
        themePreset: branding.themePreset || 'solid',
        ssoProvider: branding.ssoProvider || 'Okta',
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
    const activeLms = this.lms.activeLms();
    const currentTenant = this.lms.activeTenant();

    const updatedBranding: TenantBranding = {
      tagline: this.settingsForm.tagline,
      logoUrl: this.settingsForm.logoUrl,
      bannerUrl: currentTenant.branding.bannerUrl || '',
      faviconUrl: this.settingsForm.faviconUrl,
      primaryColor: this.settingsForm.primaryColor,
      accentColor: this.settingsForm.accentColor,
      themePreset: this.settingsForm.themePreset,
      ssoProvider: this.settingsForm.ssoProvider,
      customCssEnabled: true
    };

    // Update active LMS branding & preferences (Theming mapped to LMS)
    if (activeLms) {
      this.lms.updateLmsBranding(activeLms.id, updatedBranding);
      this.lms.updateLmsLayoutPreferences(activeLms.id, this.lms.adminLayoutPreferences());
    }

    // Also update tenant branding for consistency
    const updatedTenant: Tenant = {
      ...currentTenant,
      branding: {
        ...currentTenant.branding,
        ...updatedBranding
      }
    };
    this.lms.updateTenant(updatedTenant);

    this.lms.applyTenantTheme(
      this.settingsForm.primaryColor,
      this.settingsForm.accentColor,
      this.settingsForm.faviconUrl,
      this.settingsForm.name,
      this.settingsForm.themePreset
    );

    this.lms.showToast(`Settings, branding and layout mapped to LMS [${activeLms ? activeLms.basicInfo.lmsName : currentTenant.name}] updated successfully!`, 'success', 3500, 'LMS Theme Saved');
    this.savedNotification.set(true);
    setTimeout(() => this.savedNotification.set(false), 3500);
  }
}

