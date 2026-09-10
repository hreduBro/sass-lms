import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  LoginBrandingConfig, 
  PRESET_BACKGROUND_IMAGES, 
  PRESET_COLOR_PALETTES,
  PRESET_SOLID_COLORS,
  PRESET_TEXTURE_BACKGROUNDS,
  SolidColorPreset,
  TexturePreset,
  CSS_SELECTOR_GUIDES,
  CSS_TEMPLATES,
  CssSelectorGuide
} from '../../../models/login-branding.model';

export type BrandingPortalTab = 'authkit' | 'admin_portal' | 'emails';
export type RightPanelTab = 'global_styles' | 'page_settings' | 'custom_css';
export type BackgroundSelectionTab = 'photo' | 'solid' | 'texture';
export type PreviewPageId = 
  | 'sign_in' 
  | 'sign_up' 
  | 'accept_invitation' 
  | 'organization_selection' 
  | 'password_reset' 
  | 'mfa_setup' 
  | 'sso_consent' 
  | 'radar_block';

export interface PageMenuItem {
  id: PreviewPageId;
  name: string;
  category: 'Pages';
  icon: string;
}

export interface ElementMenuItem {
  id: string;
  name: string;
  category: 'Elements';
  selector: string;
  icon: string;
}

@Component({
  selector: 'app-login-branding-edit',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login-branding-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginBrandingEditComponent {
  lms = inject(LmsDataService);
  router = inject(Router);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  // Top Section: Portal Mode & Environment
  portalTab = signal<BrandingPortalTab>('authkit');
  environment = signal<'staging' | 'production'>('staging');

  // Right Panel Active Tab & Background Category Tab
  rightPanelTab = signal<RightPanelTab>('global_styles');
  backgroundCategory = signal<BackgroundSelectionTab>('photo');

  // Solid & Texture Presets
  solidColors = PRESET_SOLID_COLORS;
  texturePresets = PRESET_TEXTURE_BACKGROUNDS;
  presetBgs = PRESET_BACKGROUND_IMAGES;
  colorPalettes = PRESET_COLOR_PALETTES;
  cssSelectorGuides = CSS_SELECTOR_GUIDES;
  cssTemplates = CSS_TEMPLATES;

  // Preview Page Dropdown State
  selectedPage = signal<PreviewPageId>('accept_invitation');
  isPageDropdownOpen = signal<boolean>(false);

  // Selected Language & Theme in Preview
  selectedLanguage = signal<string>('English (US)');
  previewTheme = signal<'dark' | 'light'>('dark');
  viewportMode = signal<'fullscreen' | 'desktop' | 'tablet' | 'mobile'>('fullscreen');
  inspectorMode = signal<boolean>(false);
  highlightedElement = signal<string | null>(null);

  // Interactive Live Preview Mock Fields
  testEmail = signal<string>('shovon.sen@brac.net');
  testPassword = signal<string>('BRAC-Learn$2026');
  showPassword = signal<boolean>(false);
  rememberMe = signal<boolean>(true);

  // Sign up form mock fields
  signUpFirstName = signal<string>('Shovon');
  signUpLastName = signal<string>('Sen');
  signUpWorkEmail = signal<string>('shovon.sen@brac.net');
  signUpPassword = signal<string>('BRAC-Learn$2026');
  signUpConfirmPassword = signal<string>('BRAC-Learn$2026');
  showSignUpPassword = signal<boolean>(false);
  showSignUpConfirmPassword = signal<boolean>(false);
  showPasswordPolicy = signal<boolean>(true);

  // Password policy check indicators
  hasMinLength = computed(() => (this.signUpPassword() || '').length >= 8);
  hasUppercase = computed(() => /[A-Z]/.test(this.signUpPassword() || ''));
  hasNumber = computed(() => /[0-9]/.test(this.signUpPassword() || ''));
  hasSpecialChar = computed(() => /[^A-Za-z0-9]/.test(this.signUpPassword() || ''));
  passwordsMatch = computed(() => {
    const p1 = this.signUpPassword() || '';
    const p2 = this.signUpConfirmPassword() || '';
    return p1.length > 0 && p1 === p2;
  });

  mfaCode = signal<string[]>(['4', '9', '2', '8', '1', '7']);
  passwordResetEmail = signal<string>('shovon.sen@brac.net');
  passwordResetSent = signal<boolean>(false);
  orgSearchTerm = signal<string>('');
  ssoConsentGranted = signal<boolean>(false);
  bannerDismissed = signal<boolean>(false);
  newBulletText = signal<string>('');
  newBulletIcon = signal<string>('verified');

  // Additional Page Settings Controls
  showFirstLastName = signal<boolean>(true);
  hideContentPanelOnMobile = signal<boolean>(false);

  // CSS Selectors Accordion state
  openCssAccordions = signal<{ [key: string]: boolean }>({
    'background': true,
    'header': false,
    'card': false,
    'primary-button': false
  });

  // Custom CSS per selector fragment map
  selectorCssOverrides = signal<{ [key: string]: string }>({
    'background': `.ak-Background {\n  \n}`,
    'header': `.ak-Header {\n  \n}`,
    'card': `.ak-Card {\n  \n}`,
    'primary-button': `.ak-PrimaryButton {\n  \n}`,
    'secondary-button': `.ak-SecondaryButton {\n  \n}`,
    'text-field': `.ak-TextField {\n  \n}`,
    'label': `.ak-Label {\n  \n}`,
    'callout': `.ak-Callout {\n  \n}`,
    'org-selection': `.ak-OrganizationSelection {\n  \n}`,
    'sso-trigger': `.ak-SSOProfileTrigger {\n  \n}`,
    'sso-menu': `.ak-SSOProfileMenu {\n  \n}`,
  });

  // Pages Menu Definition
  pagesMenu: PageMenuItem[] = [
    { id: 'sign_in', name: 'Sign-in', category: 'Pages', icon: 'login' },
    { id: 'sign_up', name: 'Sign-up', category: 'Pages', icon: 'person_add' },
    { id: 'accept_invitation', name: 'Accept invitation', category: 'Pages', icon: 'mail' },
    { id: 'organization_selection', name: 'Organization selection', category: 'Pages', icon: 'apartment' },
    { id: 'password_reset', name: 'Password reset', category: 'Pages', icon: 'lock_reset' },
    { id: 'mfa_setup', name: 'MFA Setup', category: 'Pages', icon: 'shield' },
    { id: 'sso_consent', name: 'SSO Consent', category: 'Pages', icon: 'verified_user' },
    { id: 'radar_block', name: 'Radar block', category: 'Pages', icon: 'block' },
  ];

  // Elements Menu Definition
  elementsMenu: ElementMenuItem[] = [
    { id: 'card', name: 'Card', category: 'Elements', selector: '.ak-Card', icon: 'rectangle' },
    { id: 'sso-profile', name: 'SSO profile', category: 'Elements', selector: '.ak-SSOProfile', icon: 'badge' },
    { id: 'header', name: 'Header', category: 'Elements', selector: '.ak-Header', icon: 'view_headline' },
    { id: 'primary-button', name: 'Primary button', category: 'Elements', selector: '.ak-PrimaryButton', icon: 'smart_button' },
    { id: 'secondary-button', name: 'Secondary button', category: 'Elements', selector: '.ak-SecondaryButton', icon: 'crop_16_9' },
    { id: 'text-field', name: 'Text field', category: 'Elements', selector: '.ak-TextField', icon: 'input' },
    { id: 'label', name: 'Label', category: 'Elements', selector: '.ak-Label', icon: 'title' },
    { id: 'callout', name: 'Callout', category: 'Elements', selector: '.ak-Callout', icon: 'announcement' },
  ];

  isSaving = signal<boolean>(false);

  // Local mutable editing state initialized from active lms.loginBranding()
  formData = signal<LoginBrandingConfig>({ ...this.lms.loginBranding() });

  // Compute number of lines in custom CSS for code editor display
  cssLineNumbers = computed<number[]>(() => {
    const css = this.formData().customCss || '';
    const count = Math.max(css.split('\n').length, 12);
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  // Current page object
  currentPageObj = computed(() => {
    return this.pagesMenu.find(p => p.id === this.selectedPage()) || this.pagesMenu[0];
  });

  constructor() {
    effect(() => {
      const live = this.lms.loginBranding();
      this.formData.set({ ...live });
    });

    // Reactive effect for custom CSS injection
    effect(() => {
      const css = this.formData().customCss;
      if (typeof this.document !== 'undefined' && this.document.head) {
        let styleEl = this.document.getElementById('dynamic-login-branding-studio-css') as HTMLStyleElement | null;
        if (!styleEl) {
          styleEl = this.document.createElement('style');
          styleEl.id = 'dynamic-login-branding-studio-css';
          this.document.head.appendChild(styleEl);
        }
        styleEl.textContent = css || '';
      }
    });

    // Clean up dynamic style element on component destroy
    this.destroyRef.onDestroy(() => {
      if (typeof this.document !== 'undefined' && this.document.head) {
        const styleEl = this.document.getElementById('dynamic-login-branding-studio-css');
        if (styleEl) {
          styleEl.remove();
        }
      }
    });
  }

  selectPage(pageId: PreviewPageId) {
    this.selectedPage.set(pageId);
    this.isPageDropdownOpen.set(false);
  }

  togglePageDropdown() {
    this.isPageDropdownOpen.update(v => !v);
  }

  toggleCssAccordion(key: string) {
    this.openCssAccordions.update(acc => ({
      ...acc,
      [key]: !acc[key]
    }));
  }

  setRightPanelTab(tab: RightPanelTab) {
    this.rightPanelTab.set(tab);
  }

  togglePreviewTheme() {
    this.previewTheme.update(t => t === 'light' ? 'dark' : 'light');
  }

  toggleInspectorMode() {
    this.inspectorMode.update(v => !v);
    if (this.inspectorMode()) {
      this.lms.showToast('Inspector mode active — hover over canvas elements to inspect selectors', 'info', 2500, 'Inspector Mode');
    }
  }

  highlightElement(selectorId: string | null) {
    this.highlightedElement.set(selectorId);
  }

  updateSelectorCss(selectorKey: string, newCss: string) {
    this.selectorCssOverrides.update(map => ({
      ...map,
      [selectorKey]: newCss
    }));
    const combined = Object.values(this.selectorCssOverrides()).join('\n\n');
    this.formData.update(f => ({
      ...f,
      customCss: combined
    }));
  }

  applyCssTemplate(template: typeof CSS_TEMPLATES[0]) {
    this.formData.update(f => ({
      ...f,
      customCss: template.css
    }));
    this.lms.showToast(`Applied preset: ${template.name}`, 'success', 3000, 'Preset Applied');
  }

  undoAllChanges() {
    if (confirm('Undo all changes and reset to original saved branding?')) {
      this.formData.set({ ...this.lms.loginBranding() });
      this.lms.showToast('Reverted all changes to original saved settings.', 'info', 2500, 'Reverted');
    }
  }

  onPublish() {
    this.isSaving.set(true);
    setTimeout(() => {
      this.isSaving.set(false);
      this.lms.publishLoginBranding(this.formData());
      this.lms.showToast('Login branding changes successfully saved and published!', 'success', 3500, 'Changes Saved');
      this.router.navigate(['/login-branding']);
    }, 600);
  }

  onSaveDraft() {
    this.lms.updateLoginBranding({
      ...this.formData(),
      status: 'Draft'
    });
    this.lms.showToast('Login branding draft saved successfully.', 'info', 3000, 'Draft Saved');
  }

  onDiscard() {
    if (confirm('Discard all unsaved changes and return to the preview page?')) {
      this.formData.set({ ...this.lms.loginBranding() });
      this.router.navigate(['/login-branding']);
    }
  }

  selectColorPalette(palette: typeof PRESET_COLOR_PALETTES[0]) {
    this.formData.update(f => ({
      ...f,
      primaryColor: palette.primary,
      accentColor: palette.accent
    }));
  }

  selectPresetBackground(bgOrUrl: string | typeof PRESET_BACKGROUND_IMAGES[0]) {
    const url = typeof bgOrUrl === 'string' ? bgOrUrl : bgOrUrl.url;
    const name = typeof bgOrUrl === 'object' ? bgOrUrl.name : (this.presetBgs.find(b => b.url === url)?.name || 'Campus Photography');
    this.formData.update(f => ({
      ...f,
      backgroundType: 'image',
      backgroundImageUrl: url
    }));
    this.lms.showToast(`Photography background applied: ${name}`, 'info', 2000, 'Photo Applied');
  }

  selectSolidBackground(color: string) {
    this.formData.update(f => ({
      ...f,
      backgroundType: 'solid',
      primaryColor: f.primaryColor,
      backgroundOverlayColor: color,
      backgroundGradient: ''
    }));
    this.lms.showToast(`Solid background color applied (${color})`, 'info', 2000, 'Solid Color Applied');
  }

  selectTextureBackground(preset: TexturePreset) {
    this.formData.update(f => ({
      ...f,
      backgroundType: 'gradient',
      backgroundGradient: preset.cssBackground
    }));
    this.lms.showToast(`Texture background applied: ${preset.name}`, 'info', 2000, 'Texture Applied');
  }

  applyModernSplitVariant() {
    this.formData.update(f => ({
      ...f,
      layout: 'split_modern_canvas',
      backgroundType: 'gradient',
      backgroundGradient: 'radial-gradient(at 10% 15%, #3b82f6 0px, transparent 55%), radial-gradient(at 90% 10%, #f472b6 0px, transparent 50%), radial-gradient(at 85% 85%, #6366f1 0px, transparent 60%), radial-gradient(at 15% 85%, #1d4ed8 0px, transparent 65%), linear-gradient(135deg, #1e40af 0%, #1e1b4b 50%, #0f172a 100%)',
      primaryColor: '#2563eb',
      accentColor: '#4f46e5',
      buttonStyle: 'pill',
      buttonGradientEnabled: true,
      cardStyle: 'solid_white',
      enableSsoGoogle: true
    }));
    this.lms.showToast('Applied Modern Half Split Canvas variant layout & Fluid Silk Aurora theme', 'success', 3000, 'Variant Applied');
  }

  onLogoUploadSimulated(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formData.update(f => ({
          ...f,
          logoUrlLight: e.target.result,
          logoUrlDark: e.target.result
        }));
        this.lms.showToast('Logo image uploaded and applied to preview', 'success', 2500, 'Logo Updated');
      };
      reader.readAsDataURL(file);
    }
  }

  onBgUploadSimulated(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formData.update(f => ({
          ...f,
          backgroundType: 'image',
          backgroundImageUrl: e.target.result
        }));
        this.lms.showToast('Background image uploaded and applied to preview', 'success', 2500, 'Background Updated');
      };
      reader.readAsDataURL(file);
    }
  }

  // Side Panel Content & Bullet Methods
  addSidePanelBullet() {
    const text = this.newBulletText().trim();
    if (!text) return;
    const icon = this.newBulletIcon() || 'check_circle';
    const newBullet = {
      id: 'bullet-' + Date.now(),
      icon,
      title: text,
      description: ''
    };

    this.formData.update(f => {
      const existingBullets = f.sidePanel?.bullets || [];
      return {
        ...f,
        sidePanel: {
          badgeText: f.sidePanel?.badgeText || 'ENTERPRISE PORTAL',
          badgeIcon: f.sidePanel?.badgeIcon || 'verified_user',
          theme: f.sidePanel?.theme || 'glass',
          showSecurityShield: f.sidePanel?.showSecurityShield ?? true,
          showStatsRow: f.sidePanel?.showStatsRow ?? true,
          stat1Value: f.sidePanel?.stat1Value || '24,500+',
          stat1Label: f.sidePanel?.stat1Label || 'Active Learners',
          stat2Value: f.sidePanel?.stat2Value || '99.99%',
          stat2Label: f.sidePanel?.stat2Label || 'SSO Uptime',
          bullets: [...existingBullets, newBullet]
        }
      };
    });

    this.newBulletText.set('');
    this.lms.showToast('Feature highlight added to side panel', 'success', 2000, 'Bullet Added');
  }

  removeSidePanelBullet(id: string) {
    this.formData.update(f => {
      if (!f.sidePanel) return f;
      return {
        ...f,
        sidePanel: {
          ...f.sidePanel,
          bullets: f.sidePanel.bullets.filter(b => b.id !== id)
        }
      };
    });
  }

  setSplitPosition(position: 'left' | 'right') {
    this.formData.update(f => ({
      ...f,
      splitPosition: position,
      ...(f.layout === 'split_left' || f.layout === 'split_right'
        ? { layout: position === 'left' ? 'split_left' : 'split_right' }
        : {})
    }));
    this.lms.showToast(`Panel position set to ${position}`, 'info', 2000, 'Position Updated');
  }

  updateSidePanelTheme(theme: 'glass' | 'dark' | 'light' | 'gradient') {
    this.formData.update(f => ({
      ...f,
      sidePanel: {
        badgeText: f.sidePanel?.badgeText || 'ENTERPRISE PORTAL',
        badgeIcon: f.sidePanel?.badgeIcon || 'verified_user',
        theme,
        bullets: f.sidePanel?.bullets || [],
        showSecurityShield: f.sidePanel?.showSecurityShield ?? true,
        showStatsRow: f.sidePanel?.showStatsRow ?? true,
        stat1Value: f.sidePanel?.stat1Value || '24,500+',
        stat1Label: f.sidePanel?.stat1Label || 'Active Learners',
        stat2Value: f.sidePanel?.stat2Value || '99.99%',
        stat2Label: f.sidePanel?.stat2Label || 'SSO Uptime'
      }
    }));
  }

  // Announcement Banner Configuration Methods
  toggleAnnouncementBanner(enabled?: boolean) {
    this.formData.update(f => {
      const current = f.announcementBanner;
      const isEnabled = enabled !== undefined ? enabled : !current?.enabled;
      return {
        ...f,
        announcementBanner: {
          enabled: isEnabled,
          text: current?.text || 'Scheduled system maintenance on Sunday at 02:00 UTC. SSO logins will remain uninterrupted.',
          type: current?.type || 'info',
          style: current?.style || 'floating_pill',
          dismissible: current?.dismissible ?? true,
          actionText: current?.actionText || 'System Status'
        }
      };
    });
    this.bannerDismissed.set(false);
  }

  setAnnouncementType(type: 'info' | 'warning' | 'alert' | 'success' | 'security') {
    this.formData.update(f => ({
      ...f,
      announcementBanner: {
        enabled: f.announcementBanner?.enabled ?? true,
        text: f.announcementBanner?.text || 'Scheduled system maintenance on Sunday at 02:00 UTC.',
        type,
        style: f.announcementBanner?.style || 'floating_pill',
        dismissible: f.announcementBanner?.dismissible ?? true,
        actionText: f.announcementBanner?.actionText || 'Details'
      }
    }));
  }

  setAnnouncementStyle(style: 'floating_pill' | 'top_bar' | 'card_embedded') {
    this.formData.update(f => ({
      ...f,
      announcementBanner: {
        enabled: f.announcementBanner?.enabled ?? true,
        text: f.announcementBanner?.text || 'Scheduled system maintenance on Sunday at 02:00 UTC.',
        type: f.announcementBanner?.type || 'info',
        style,
        dismissible: f.announcementBanner?.dismissible ?? true,
        actionText: f.announcementBanner?.actionText || 'Details'
      }
    }));
  }

  // Quick fill demo credentials in preview
  fillDemoUser(email: string, roleName: string) {
    this.testEmail.set(email);
    this.lms.showToast(`Populated credentials for ${roleName}`, 'info', 1800, 'Demo Autofill');
  }

  setViewportMode(mode: 'fullscreen' | 'desktop' | 'tablet' | 'mobile') {
    this.viewportMode.set(mode);
  }

  toggleShowPassword() {
    this.showPassword.update(v => !v);
  }

  toggleShowSignUpPassword() {
    this.showSignUpPassword.update(v => !v);
  }

  toggleShowSignUpConfirmPassword() {
    this.showSignUpConfirmPassword.update(v => !v);
  }

  toggleShowPasswordPolicy() {
    this.showPasswordPolicy.update(v => !v);
  }

  onSignUpPasswordInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.signUpPassword.set(target.value);
  }

  onSignUpConfirmPasswordInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.signUpConfirmPassword.set(target.value);
  }
}
