import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  CssSelectorGuide,
  getHeroPanelDefaultHtml,
  getHeroPanelDefaultCss
} from '../../../models/login-branding.model';
import { SsoLogoComponent } from '../../../components/sso-logo/sso-logo.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

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

export interface ChildClassSuggestion {
  name: string;
  type: string;
  desc: string;
  snippet?: string;
}

export interface ScopedCssElement {
  id: string;
  name: string;
  selector: string;
  description?: string;
  isOpen: boolean;
  enabled: boolean;
  removeOriginalStyles: boolean;
  code: string;
  childClasses: ChildClassSuggestion[];
  quickSnippets?: { label: string; snippet: string }[];
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
  imports: [CommonModule, RouterModule, FormsModule, SsoLogoComponent, CustomSelectComponent],
  templateUrl: './login-branding-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscapeKey()'
  }
})
export class LoginBrandingEditComponent {
  lms = inject(LmsDataService);
  router = inject(Router);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  sanitizer = inject(DomSanitizer);

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
  selectedPage = signal<PreviewPageId>('sign_in');
  isPageDropdownOpen = signal<boolean>(false);

  pageSelectOptions: SelectOption[] = [
    { value: 'sign_in', label: 'Sign-in', icon: 'login' },
    { value: 'sign_up', label: 'Sign-up', icon: 'person_add' },
    { value: 'accept_invitation', label: 'Accept invitation', icon: 'mail' },
    { value: 'organization_selection', label: 'Organization selection', icon: 'domain' },
    { value: 'password_reset', label: 'Password reset', icon: 'lock_reset' },
    { value: 'mfa_setup', label: 'MFA Setup', icon: 'shield' },
    { value: 'sso_consent', label: 'SSO Consent', icon: 'verified_user' },
    { value: 'radar_block', label: 'Radar block', icon: 'block' }
  ];

  // Selected Language & Theme in Preview
  selectedLanguage = signal<string>('English (US)');
  languageSelectOptions: SelectOption[] = [
    { value: 'English (US)', label: 'English (US)' },
    { value: 'Bengali (বাংলা)', label: 'Bengali (বাংলা)' },
    { value: 'Spanish (Español)', label: 'Spanish (Español)' },
    { value: 'French (Français)', label: 'French (Français)' }
  ];
  previewTheme = signal<'dark' | 'light'>('dark');
  viewportMode = signal<'fullscreen' | 'desktop' | 'tablet' | 'mobile'>('fullscreen');
  isMobileViewport = computed(() => this.viewportMode() === 'mobile');
  isTabletViewport = computed(() => this.viewportMode() === 'tablet');
  isDesktopOrFull = computed(() => this.viewportMode() === 'desktop' || this.viewportMode() === 'fullscreen');
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
  sanitizedCustomCss = computed<SafeHtml>(() => {
    const css = this.formData().customCss || '';
    return this.sanitizer.bypassSecurityTrustHtml(`<style id="authkit-live-custom-css">\n${css}\n</style>`);
  });
  sanitizedCustomHtml = computed<SafeHtml>(() => {
    const html = this.formData().customHtml || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });
  newBulletText = signal<string>('');
  newBulletIcon = signal<string>('verified');

  // Additional Page Settings Controls
  showFirstLastName = signal<boolean>(true);
  hideContentPanelOnMobile = signal<boolean>(false);

  // Scoped Guided CSS State
  scopedCssElements = signal<ScopedCssElement[]>([
    { 
      id: 'background', 
      name: 'Background', 
      selector: '.ak-Background',
      description: 'Outer page canvas background wrapper and responsive viewport container',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-Branding', type: 'CSS class', desc: 'Brand logo and title container', snippet: '  .ak-Branding {\n    \n  }' },
        { name: '.ak-Content', type: 'CSS class', desc: 'Inner content panel layout', snippet: '  .ak-Content {\n    \n  }' },
        { name: '.ak-Canvas', type: 'CSS class', desc: 'Full viewport canvas surface', snippet: '  .ak-Canvas {\n    \n  }' },
        { name: '.ak-Illustration', type: 'CSS class', desc: 'Background artwork & illustration', snippet: '  .ak-Illustration {\n    \n  }' },
        { name: '.ak-Footer', type: 'CSS class', desc: 'Legal and footer links container', snippet: '  .ak-Footer {\n    \n  }' },
        { name: '&:hover', type: 'Pseudo-class', desc: 'Hover interactive state', snippet: '  &:hover {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Soft Lavender', snippet: '  background-color: #f5f3ff;' },
        { label: 'Deep Slate', snippet: '  background-color: #0f172a;' },
        { label: 'Frosted Gradient', snippet: '  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);' }
      ]
    },
    { 
      id: 'header', 
      name: 'Header', 
      selector: '.ak-Header', 
      description: 'Brand identity, workspace logo, title headline, and subheadline wrapper',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-Logo', type: 'CSS class', desc: 'Brand logo image', snippet: '  .ak-Logo {\n    \n  }' },
        { name: '.ak-Title', type: 'CSS class', desc: 'Page headline title', snippet: '  .ak-Title {\n    \n  }' },
        { name: '.ak-Subtitle', type: 'CSS class', desc: 'Subheadline description text', snippet: '  .ak-Subtitle {\n    \n  }' },
        { name: '.ak-HeaderDivider', type: 'CSS class', desc: 'Divider line below header', snippet: '  .ak-HeaderDivider {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Centered Tracking', snippet: '  text-align: center;\n  letter-spacing: -0.025em;' },
        { label: 'Accent Border', snippet: '  border-bottom: 2px solid #6366f1;\n  padding-bottom: 0.5rem;' }
      ]
    },
    { 
      id: 'card', 
      name: 'Card', 
      selector: '.ak-Card', 
      description: 'Authentication card surface enclosing the login form and credentials input',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-CardHeader', type: 'CSS class', desc: 'Card top title & logo area', snippet: '  .ak-CardHeader {\n    \n  }' },
        { name: '.ak-CardBody', type: 'CSS class', desc: 'Card form controls surface', snippet: '  .ak-CardBody {\n    \n  }' },
        { name: '.ak-CardFooter', type: 'CSS class', desc: 'Card bottom links & copyright', snippet: '  .ak-CardFooter {\n    \n  }' },
        { name: '.ak-Divider', type: 'CSS class', desc: 'Horizontal rule separator', snippet: '  .ak-Divider {\n    \n  }' },
        { name: '.ak-DividerText', type: 'CSS class', desc: '"OR" badge text on divider', snippet: '  .ak-DividerText {\n    \n  }' },
        { name: '.ak-Badge', type: 'CSS class', desc: 'Status pill badge (e.g. Last used)', snippet: '  .ak-Badge {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Elevated Shadow', snippet: '  border-radius: 16px;\n  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08);\n  border: 1px solid #e2e8f0;' },
        { label: 'Dark Glass', snippet: '  background: rgba(15, 23, 42, 0.85) !important;\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.15);' },
        { label: 'Flat Minimal', snippet: '  border-radius: 12px;\n  border: 1px solid #cbd5e1;\n  box-shadow: none;' }
      ]
    },
    { 
      id: 'primary-button', 
      name: 'Primary button', 
      selector: '.ak-PrimaryButton', 
      description: 'Main action submission button for signing in or continuing authorization',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-ButtonText', type: 'CSS class', desc: 'Button label typography', snippet: '  .ak-ButtonText {\n    \n  }' },
        { name: '.ak-ButtonIcon', type: 'CSS class', desc: 'Arrow / action icon element', snippet: '  .ak-ButtonIcon {\n    \n  }' },
        { name: '.ak-Spinner', type: 'CSS class', desc: 'Loading progress spinner', snippet: '  .ak-Spinner {\n    \n  }' },
        { name: '&:hover', type: 'Pseudo-class', desc: 'Button hover state', snippet: '  &:hover {\n    \n  }' },
        { name: '&:active', type: 'Pseudo-class', desc: 'Button active click state', snippet: '  &:active {\n    \n  }' },
        { name: '&:disabled', type: 'Pseudo-class', desc: 'Button disabled state', snippet: '  &:disabled {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'AuthKit Purple Pill', snippet: '  background-color: #9333ea !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4);' },
        { label: 'Emerald Glow', snippet: '  background-color: #059669 !important;\n  border-radius: 12px;\n  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);' },
        { label: 'Sleek Dark', snippet: '  background-color: #09090b !important;\n  color: #ffffff;\n  border-radius: 10px;' }
      ]
    },
    { 
      id: 'secondary-button', 
      name: 'Secondary button', 
      selector: '.ak-SecondaryButton', 
      description: 'Enterprise SSO federation buttons (Google, Microsoft, Okta, SAML)',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-SSOIcon', type: 'CSS class', desc: 'SSO provider logo icon', snippet: '  .ak-SSOIcon {\n    \n  }' },
        { name: '.ak-SSOText', type: 'CSS class', desc: 'Provider label text', snippet: '  .ak-SSOText {\n    \n  }' },
        { name: '&:hover', type: 'Pseudo-class', desc: 'Button hover state', snippet: '  &:hover {\n    \n  }' },
        { name: '&:active', type: 'Pseudo-class', desc: 'Button active state', snippet: '  &:active {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Subtle Ghost', snippet: '  background: transparent;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;' },
        { label: 'Pill Outline', snippet: '  border-radius: 9999px;\n  border: 1.5px solid #cbd5e1;' }
      ]
    },
    { 
      id: 'text-field', 
      name: 'Text field', 
      selector: '.ak-TextField', 
      description: 'Email, username, password input controls, bounding borders, and icons',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: 'input', type: 'Element', desc: 'Native input element inside container', snippet: '  input {\n    \n  }' },
        { name: '.ak-InputIcon', type: 'CSS class', desc: 'Leading email/password icon', snippet: '  .ak-InputIcon {\n    \n  }' },
        { name: '.ak-InputTrailing', type: 'CSS class', desc: 'Password visibility button', snippet: '  .ak-InputTrailing {\n    \n  }' },
        { name: '&:focus-within', type: 'Pseudo-class', desc: 'Input focus state container', snippet: '  &:focus-within {\n    \n  }' },
        { name: '&.ak-Error', type: 'CSS class', desc: 'Validation error state', snippet: '  &.ak-Error {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Pill Input', snippet: '  border-radius: 9999px !important;\n  padding-left: 1.25rem !important;\n  border-color: #e2e8f0;' },
        { label: 'Clean Focus', snippet: '  border-radius: 10px;\n  border: 1.5px solid #94a3b8;\n  background: #ffffff;' }
      ]
    },
    { 
      id: 'label', 
      name: 'Label', 
      selector: '.ak-Label', 
      description: 'Form field descriptions, password recovery trigger links, and indicators',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-RequiredMark', type: 'CSS class', desc: 'Required asterisk mark', snippet: '  .ak-RequiredMark {\n    \n  }' },
        { name: '.ak-LabelHelp', type: 'CSS class', desc: 'Helper description text', snippet: '  .ak-LabelHelp {\n    \n  }' },
        { name: '.ak-LabelAction', type: 'CSS class', desc: 'Forgot password link action', snippet: '  .ak-LabelAction {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Caps Tracker', snippet: '  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  font-size: 0.65rem;\n  font-weight: 700;' },
        { label: 'Subtle Indigo', snippet: '  color: #4f46e5;\n  font-weight: 600;' }
      ]
    },
    { 
      id: 'callout', 
      name: 'Callout', 
      selector: '.ak-Callout', 
      description: 'System announcement ribbons, security maintenance banners, and alerts',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-CalloutIcon', type: 'CSS class', desc: 'Status notification icon', snippet: '  .ak-CalloutIcon {\n    \n  }' },
        { name: '.ak-CalloutText', type: 'CSS class', desc: 'Notification message copy', snippet: '  .ak-CalloutText {\n    \n  }' },
        { name: '.ak-CalloutAction', type: 'CSS class', desc: 'Action button / link', snippet: '  .ak-CalloutAction {\n    \n  }' },
        { name: '.ak-CalloutClose', type: 'CSS class', desc: 'Dismiss close button', snippet: '  .ak-CalloutClose {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Modern Banner', snippet: '  border-radius: 14px;\n  backdrop-filter: blur(12px);\n  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);' }
      ]
    },
    { 
      id: 'org-selection', 
      name: 'Organization selection', 
      selector: '.ak-OrganizationSelection', 
      description: 'Multi-tenant organization switcher tile cards and selector list items',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-OrgItem', type: 'CSS class', desc: 'Organization row button', snippet: '  .ak-OrgItem {\n    \n  }' },
        { name: '.ak-OrgLogo', type: 'CSS class', desc: 'Organization brand avatar', snippet: '  .ak-OrgLogo {\n    \n  }' },
        { name: '.ak-OrgName', type: 'CSS class', desc: 'Workspace organization name', snippet: '  .ak-OrgName {\n    \n  }' },
        { name: '.ak-OrgRole', type: 'CSS class', desc: 'User role pill badge', snippet: '  .ak-OrgRole {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Grid Card', snippet: '  border-radius: 14px;\n  border: 1px solid #e2e8f0;' }
      ]
    },
    { 
      id: 'sso-trigger', 
      name: 'SSO profile trigger', 
      selector: '.ak-SSOProfileTrigger', 
      description: 'Floating or embedded SSO profile avatar badge and current user pill',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-Avatar', type: 'CSS class', desc: 'User profile avatar circle', snippet: '  .ak-Avatar {\n    \n  }' },
        { name: '.ak-ProfileEmail', type: 'CSS class', desc: 'User email typography', snippet: '  .ak-ProfileEmail {\n    \n  }' },
        { name: '.ak-TriggerChevron', type: 'CSS class', desc: 'Dropdown expand arrow', snippet: '  .ak-TriggerChevron {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Pill Trigger', snippet: '  border-radius: 9999px;\n  border: 1px solid #e2e8f0;' }
      ]
    },
    { 
      id: 'sso-menu', 
      name: 'SSO profile menu', 
      selector: '.ak-SSOProfileMenu', 
      description: 'SSO user context menu dropdown with logout and account switcher actions',
      isOpen: false, 
      enabled: true, 
      removeOriginalStyles: false,
      code: '',
      childClasses: [
        { name: '.ak-MenuItem', type: 'CSS class', desc: 'Menu action item row', snippet: '  .ak-MenuItem {\n    \n  }' },
        { name: '.ak-MenuDivider', type: 'CSS class', desc: 'Menu section separator', snippet: '  .ak-MenuDivider {\n    \n  }' },
        { name: '.ak-SignOutItem', type: 'CSS class', desc: 'Logout button action', snippet: '  .ak-SignOutItem {\n    \n  }' }
      ],
      quickSnippets: [
        { label: 'Elevated Dropdown', snippet: '  border-radius: 16px;\n  box-shadow: 0 20px 30px rgba(0, 0, 0, 0.15);' }
      ]
    }
  ]);

  // Active element inspected on preview canvas
  activeInspectedElement = signal<string>('Background');
  isOverridesMenuOpen = signal<boolean>(false);
  activeBlockMenuId = signal<string | null>(null);
  removeOriginalStyles = signal<boolean>(false);
  cssEditorMode = signal<'guided' | 'raw'>('guided');
  expandedScopedElement = signal<ScopedCssElement | null>(null);
  activeExpandedElement = computed(() => {
    const current = this.expandedScopedElement();
    if (!current) return null;
    return this.scopedCssElements().find(el => el.id === current.id) || current;
  });
  showAutocomplete = signal<boolean>(false);
  activeAutocompleteElementId = signal<string | null>(null);
  autocompleteFilter = signal<string>('');
  autocompleteSearch = signal<string>('');
  autocompleteCursorLine = signal<number>(1);
  autocompleteSelectedIndex = signal<number>(0);

  autocompleteClasses = [
    { name: 'ak-Branding', type: 'CSS class', desc: 'Brand logo and title container' },
    { name: 'ak-Content', type: 'CSS class', desc: 'Inner content panel layout' },
    { name: 'ak-Logo', type: 'CSS class', desc: 'Header branding logo image' },
    { name: 'ak-Title', type: 'CSS class', desc: 'Page primary headline title' },
    { name: 'ak-Subtitle', type: 'CSS class', desc: 'Page subheadline description' },
    { name: 'ak-Card', type: 'CSS class', desc: 'Card container surface' },
    { name: 'ak-PrimaryButton', type: 'CSS class', desc: 'Primary call-to-action button' },
    { name: 'ak-SecondaryButton', type: 'CSS class', desc: 'Secondary / SSO action buttons' },
    { name: 'ak-TextField', type: 'CSS class', desc: 'Input text input control' },
    { name: 'ak-Label', type: 'CSS class', desc: 'Form field description label' },
    { name: 'ak-Callout', type: 'CSS class', desc: 'Announcement and alert banner' },
    { name: 'ak-Badge', type: 'CSS class', desc: 'Badge pill indicator' },
    { name: 'ak-Divider', type: 'CSS class', desc: 'Section line divider' },
  ];

  autocompleteProperties = [
    { name: 'background-color: ', type: 'property', desc: 'Element background color' },
    { name: 'color: ', type: 'property', desc: 'Foreground text color' },
    { name: 'border-radius: ', type: 'property', desc: 'Corner rounding radius' },
    { name: 'box-shadow: ', type: 'property', desc: 'Elevation box shadow' },
    { name: 'border: ', type: 'property', desc: 'Border stroke line' },
    { name: 'padding: ', type: 'property', desc: 'Inner whitespace padding' },
    { name: 'font-weight: ', type: 'property', desc: 'Typography font weight' },
    { name: 'font-size: ', type: 'property', desc: 'Typography size' },
    { name: 'opacity: ', type: 'property', desc: 'Visual opacity' },
    { name: 'transition: ', type: 'property', desc: 'CSS animation transition' },
    { name: 'backdrop-filter: ', type: 'property', desc: 'Frosted glass blur effect' },
  ];

  // Active element dependable child classes suggestions
  activeElementSuggestions = computed<ChildClassSuggestion[]>(() => {
    const activeId = this.activeAutocompleteElementId();
    const elem = activeId ? this.scopedCssElements().find(e => e.id === activeId) : null;
    const localClasses = elem?.childClasses ? [...elem.childClasses] : [];

    // Also include global AuthKit classes for broader guidance
    for (const g of this.autocompleteClasses) {
      if (!localClasses.some(c => c.name === '.' + g.name || c.name === g.name)) {
        localClasses.push({
          name: '.' + g.name,
          type: g.type,
          desc: g.desc,
          snippet: `  .${g.name} {\n    \n  }`
        });
      }
    }

    const raw = (this.autocompleteSearch() || '').toLowerCase().trim();
    const search = raw.startsWith('.') ? raw.substring(1) : raw;

    if (!search) {
      return localClasses;
    }

    return localClasses.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.desc.toLowerCase().includes(search)
    );
  });

  // Active property suggestions when typing property names
  activePropertySuggestions = computed(() => {
    const raw = (this.autocompleteSearch() || '').toLowerCase().trim();
    if (raw.startsWith('.') || raw.startsWith(':')) {
      return [];
    }
    if (!raw) {
      return this.autocompleteProperties.slice(0, 5);
    }
    return this.autocompleteProperties.filter(p =>
      p.name.toLowerCase().includes(raw) || p.desc.toLowerCase().includes(raw)
    );
  });

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
  formData = signal<LoginBrandingConfig>(this.initFormData());

  private initFormData(): LoginBrandingConfig {
    const cfg = { ...this.lms.loginBranding() };
    if (cfg.copyrightText) {
      cfg.copyrightText = cfg.copyrightText.replace(/\s*&\s*BRAC\s*IT\s*Services/gi, '').replace(/\s*&\s*Brac\s*IT\s*Services/gi, '').trim();
    }
    return cfg;
  }

  // Compute number of lines in custom CSS for code editor display
  cssLineNumbers = computed<number[]>(() => {
    const css = this.formData().customCss || '';
    const count = Math.max(css.split('\n').length, 12);
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  // Content Panel Modal State (HTML/CSS Custom Editor)
  isContentPanelModalOpen = signal<boolean>(false);
  modalEditorTab = signal<'html' | 'css'>('html');
  modalHtmlCode = signal<string>('');
  modalCssCode = signal<string>('');

  modalHtmlLineNumbers = computed<number[]>(() => {
    const code = this.modalHtmlCode() || '';
    const count = Math.max(code.split('\n').length, 12);
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  modalCssLineNumbers = computed<number[]>(() => {
    const code = this.modalCssCode() || '';
    const count = Math.max(code.split('\n').length, 12);
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  isHeroPanelEmpty = computed<boolean>(() => {
    const config = this.formData();
    if (config.useCustomContentPanel) {
      return !config.customHtml || config.customHtml.trim().length === 0;
    }
    return false;
  });

  // Current page object
  currentPageObj = computed(() => {
    return this.pagesMenu.find(p => p.id === this.selectedPage()) || this.pagesMenu[0];
  });

  constructor() {
    effect(() => {
      const live = this.lms.loginBranding();
      const currentCss = live.customCss;
      const updatedCss = (!currentCss || !currentCss.includes('DARK MODE STYLING')) 
        ? getHeroPanelDefaultCss() 
        : currentCss;
      const currentHtml = live.customHtml;
      const updatedHtml = (!currentHtml || !currentHtml.includes('hero-content-panel'))
        ? getHeroPanelDefaultHtml(live)
        : currentHtml;
      this.formData.set({ 
        ...live,
        customCss: updatedCss,
        customHtml: updatedHtml
      });
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

  onPageSelectChange(pageId: any) {
    if (pageId) {
      this.selectedPage.set(pageId as PreviewPageId);
    }
  }

  onLanguageChange(lang: any) {
    if (lang) {
      this.selectedLanguage.set(lang);
    }
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
    if (selectorId === 'callout' && this.selectedPage() !== 'sign_in') {
      this.selectedPage.set('sign_in');
    }
  }

  getHighlightBadgeName(selectorId: string): string {
    const map: Record<string, string> = {
      'background': 'Background',
      'header': 'Header',
      'card': 'Card',
      'primary-button': 'Primary button',
      'secondary-button': 'Secondary button',
      'text-field': 'Text field',
      'label': 'Label',
      'callout': 'Callout',
      'org-selection': 'Organization selection',
      'sso-trigger': 'SSO profile trigger',
      'sso-menu': 'SSO profile menu'
    };
    return map[selectorId] || selectorId;
  }

  // Scoped Guided CSS Actions
  toggleScopedAccordion(id: string) {
    this.scopedCssElements.update(elements =>
      elements.map(el => {
        if (el.id === id) {
          const nextOpen = !el.isOpen;
          if (nextOpen) {
            this.activeInspectedElement.set(el.name);
          }
          return { ...el, isOpen: nextOpen };
        }
        return el;
      })
    );
  }

  toggleScopedEnabled(id: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.scopedCssElements.update(elements =>
      elements.map(el => el.id === id ? { ...el, enabled: !el.enabled } : el)
    );
    this.syncCombinedCss();
    const elem = this.scopedCssElements().find(el => el.id === id);
    if (elem) {
      this.lms.showToast(
        elem.enabled ? `Enabled styles for ${elem.name}` : `Disabled styles for ${elem.name}`,
        'info',
        1600,
        'Style Override'
      );
    }
  }

  toggleBlockMenu(elemId: string, event: Event) {
    event.stopPropagation();
    this.activeBlockMenuId.update(current => current === elemId ? null : elemId);
  }

  setBlockStyleMode(elemId: string, removeOriginal: boolean, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.scopedCssElements.update(elements =>
      elements.map(el => el.id === elemId ? { ...el, removeOriginalStyles: removeOriginal } : el)
    );
    this.activeBlockMenuId.set(null);
    this.syncCombinedCss();
    const elem = this.scopedCssElements().find(el => el.id === elemId);
    this.lms.showToast(
      removeOriginal ? `Removed original styles for ${elem?.name || 'block'}` : `Extending with current CSS for ${elem?.name || 'block'}`,
      'info',
      1800,
      'Style Mode'
    );
  }

  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // If click is outside the autocomplete dropdown
    if (this.showAutocomplete() && !target.closest('.ak-autocomplete-dropdown') && !target.closest('textarea')) {
      this.showAutocomplete.set(false);
      this.activeAutocompleteElementId.set(null);
    }

    // If click is outside the active block menu
    if (this.activeBlockMenuId() && !target.closest('.ak-block-menu-container') && !target.closest('button[title*="Options for"]')) {
      this.activeBlockMenuId.set(null);
    }

    // If click is outside the overrides menu
    if (this.isOverridesMenuOpen() && !target.closest('.ak-overrides-menu-container') && !target.closest('button[title="Style options"]')) {
      this.isOverridesMenuOpen.set(false);
    }

    // If click is outside page dropdown
    if (this.isPageDropdownOpen() && !target.closest('.ak-page-dropdown-container')) {
      this.isPageDropdownOpen.set(false);
    }
  }

  onEscapeKey() {
    this.showAutocomplete.set(false);
    this.activeAutocompleteElementId.set(null);
    this.activeBlockMenuId.set(null);
    this.isOverridesMenuOpen.set(false);
    this.isPageDropdownOpen.set(false);
    if (this.expandedScopedElement()) {
      this.closeScopedFullscreen();
    }
  }

  closeAutocomplete(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showAutocomplete.set(false);
    this.activeAutocompleteElementId.set(null);
  }

  clearElementCss(elemId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.scopedCssElements.update(elements =>
      elements.map(el => el.id === elemId ? { ...el, code: '', removeOriginalStyles: false } : el)
    );
    this.showAutocomplete.set(false);
    this.activeAutocompleteElementId.set(null);
    this.syncCombinedCss();
    const elem = this.scopedCssElements().find(el => el.id === elemId);
    this.lms.showToast(`Cleared custom CSS classes for ${elem?.name || 'element'}`, 'info', 1800, 'Cleared');
  }

  insertBaseSelector(elemId: string, selector: string) {
    this.scopedCssElements.update(elements =>
      elements.map(el => {
        if (el.id === elemId) {
          return { ...el, code: `${selector} {\n  \n}` };
        }
        return el;
      })
    );
    this.syncCombinedCss();
    this.lms.showToast(`Restored base class wrapper ${selector}`, 'info', 1600, 'Class Added');
  }

  setLayoutMode(mode: 'split_modern_canvas' | 'split_right' | 'centered_card') {
    this.formData.update(f => ({
      ...f,
      layout: mode
    }));
    const names = {
      'split_modern_canvas': 'Modern Split',
      'split_right': 'Split Hero',
      'centered_card': 'Single Card'
    };
    this.lms.showToast(`Layout set to ${names[mode]}`, 'info', 1800, 'Layout Mode');
  }

  openScopedFullscreen(elem: ScopedCssElement, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (elem.id === 'callout' && this.selectedPage() !== 'sign_in') {
      this.selectedPage.set('sign_in');
    }
    this.expandedScopedElement.set(elem);
  }

  closeScopedFullscreen() {
    this.expandedScopedElement.set(null);
  }

  onScopedCodeInput(id: string, textarea: HTMLTextAreaElement, event?: Event) {
    const newCode = textarea.value;
    this.scopedCssElements.update(elements =>
      elements.map(el => el.id === id ? { ...el, code: newCode } : el)
    );
    this.syncCombinedCss();
  }

  onScopedCodeChange(id: string, newCode: string) {
    this.scopedCssElements.update(elements =>
      elements.map(el => el.id === id ? { ...el, code: newCode } : el)
    );
    this.syncCombinedCss();
  }

  onScopedTextareaKeydown(id: string, textarea: HTMLTextAreaElement, event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const updated = val.substring(0, start) + '  ' + val.substring(end);
      textarea.value = updated;
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      this.onScopedCodeInput(id, textarea);
    } else if (event.key === 'Enter') {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const currentLine = textBeforeCursor.split('\n').pop() || '';
      const matchIndent = currentLine.match(/^(\s+)/);
      if (matchIndent) {
        event.preventDefault();
        const indent = matchIndent[1];
        const val = textarea.value;
        const end = textarea.selectionEnd;
        const updated = val.substring(0, cursorPos) + '\n' + indent + val.substring(end);
        textarea.value = updated;
        textarea.selectionStart = textarea.selectionEnd = cursorPos + 1 + indent.length;
        this.onScopedCodeInput(id, textarea);
      }
    }
  }

  insertChildClass(elemId: string, suggestion: ChildClassSuggestion, textarea?: HTMLTextAreaElement) {
    const snippetToInsert = `  ${suggestion.name} {\n    \n  }`;
    this.scopedCssElements.update(elements =>
      elements.map(el => {
        if (el.id === elemId) {
          const current = (el.code || '').trimEnd();
          const newCode = current ? `${current}\n\n${snippetToInsert}` : snippetToInsert;
          return { ...el, code: newCode };
        }
        return el;
      })
    );
    this.syncCombinedCss();
    this.lms.showToast(`Inserted ${suggestion.name}`, 'info', 1600, 'Selector Added');
  }

  getElementLineNumbers(code: string): number[] {
    const count = (code || '').split('\n').length;
    const total = Math.max(count, 3);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  getElementTextareaRows(code: string): number {
    const lineCount = (code || '').split('\n').length;
    return Math.min(Math.max(lineCount + 1, 4), 16);
  }

  toggleElementRemoveOriginal(elemId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.scopedCssElements.update(elements =>
      elements.map(el => el.id === elemId ? { ...el, removeOriginalStyles: !el.removeOriginalStyles } : el)
    );
    this.syncCombinedCss();
    const elem = this.scopedCssElements().find(el => el.id === elemId);
    this.lms.showToast(
      elem?.removeOriginalStyles ? `Removed original base styles for ${elem.name}` : `Restored original styles for ${elem?.name}`,
      'info',
      2000,
      'Base Styles'
    );
  }

  insertSnippet(elemId: string, snippet: string) {
    this.scopedCssElements.update(elements =>
      elements.map(el => {
        if (el.id === elemId) {
          const current = (el.code || '').trimEnd();
          const newCode = current ? `${current}\n${snippet}` : snippet;
          return { ...el, code: newCode };
        }
        return el;
      })
    );
    this.syncCombinedCss();
    this.lms.showToast('Snippet applied to preview', 'info', 1600, 'Snippet Applied');
  }

  syncCombinedCss() {
    let combined = '';
    
    if (this.removeOriginalStyles()) {
      combined += `/* Remove original AuthKit base element styles (Global) */\n.ak-Card, .auth-card.ak-Card { background: transparent !important; background-color: transparent !important; box-shadow: none !important; border: 1px dashed rgba(148, 163, 184, 0.4) !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }\n.ak-PrimaryButton, button.ak-PrimaryButton { background: transparent !important; background-color: transparent !important; border: 1px dashed rgba(148, 163, 184, 0.5) !important; color: inherit !important; box-shadow: none !important; }\n.ak-TextField, input.ak-TextField { background: transparent !important; background-color: transparent !important; border: 1px solid rgba(148, 163, 184, 0.3) !important; color: inherit !important; }\n.ak-Background { background: none !important; background-color: transparent !important; }\n.ak-Background > div[style*="background-image"], .ak-Background > .bg-cover { opacity: 0 !important; display: none !important; }\n\n`;
    }

    for (const elem of this.scopedCssElements()) {
      if (elem.enabled) {
        if (elem.removeOriginalStyles) {
          const resetRules = this.getBlockResetRules(elem.id);
          if (resetRules) {
            combined += `/* Reset original styles for ${elem.name} */\n${resetRules}\n\n`;
          }
        }
        if (elem.code && elem.code.trim()) {
          const trimmed = elem.code.trim();
          if (trimmed.startsWith(elem.selector)) {
            combined += `/* Custom CSS for ${elem.name} */\n${trimmed}\n\n`;
          } else {
            combined += `/* Custom CSS for ${elem.name} */\n${elem.selector} {\n${elem.code}\n}\n\n`;
          }
        }
      }
    }

    this.formData.update(f => ({
      ...f,
      customCss: combined
    }));
  }

  getBlockResetRules(elemId: string): string {
    switch (elemId) {
      case 'background':
        return `.ak-Background { background: none !important; background-color: transparent !important; }\n.ak-Background > div[style*="background-image"], .ak-Background > .bg-cover, .ak-Background > .absolute.inset-0 { opacity: 0 !important; display: none !important; }`;
      case 'header':
        return `.ak-Header, .ak-Title, .ak-Subtitle { color: inherit !important; font-family: inherit !important; margin: 0 !important; font-size: inherit !important; font-weight: normal !important; text-transform: none !important; letter-spacing: normal !important; }`;
      case 'card':
        return `.ak-Card, .auth-card.ak-Card { background: transparent !important; background-color: transparent !important; background-image: none !important; box-shadow: none !important; border: 1px dashed rgba(148, 163, 184, 0.4) !important; border-radius: 0 !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`;
      case 'primary-button':
        return `.ak-PrimaryButton, button.ak-PrimaryButton { background: transparent !important; background-color: transparent !important; background-image: none !important; box-shadow: none !important; border: 1px dashed rgba(148, 163, 184, 0.5) !important; color: inherit !important; border-radius: 4px !important; }`;
      case 'secondary-button':
        return `.ak-SecondaryButton, button.ak-SecondaryButton { background: transparent !important; background-color: transparent !important; box-shadow: none !important; border: 1px dashed rgba(148, 163, 184, 0.4) !important; color: inherit !important; border-radius: 4px !important; }`;
      case 'text-field': {
        const primary = this.formData().primaryColor || '#EC008C';
        return `.ak-TextField, input.ak-TextField { background: transparent !important; background-color: transparent !important; border: 1px solid rgba(148, 163, 184, 0.3) !important; box-shadow: none !important; color: inherit !important; border-radius: 4px !important; }\n.ak-TextField:focus, input.ak-TextField:focus { border-color: ${primary} !important; box-shadow: 0 0 0 3px ${primary}33 !important; }`;
      }
      case 'label':
        return `.ak-Label, label.ak-Label { color: inherit !important; font-weight: normal !important; text-transform: none !important; letter-spacing: normal !important; }`;
      case 'callout':
        return `.ak-Callout, div.ak-Callout { background: transparent !important; background-color: transparent !important; border: 1px dashed rgba(148, 163, 184, 0.4) !important; box-shadow: none !important; color: inherit !important; }`;
      case 'org-selection':
        return `.ak-OrganizationSelection, .ak-OrgItem { background: transparent !important; border: 1px dashed rgba(148, 163, 184, 0.4) !important; box-shadow: none !important; }`;
      case 'sso-trigger':
        return `.ak-SSOProfileTrigger { background: transparent !important; border: 1px dashed rgba(148, 163, 184, 0.4) !important; box-shadow: none !important; }`;
      case 'sso-menu':
        return `.ak-SSOProfileMenu { background: transparent !important; box-shadow: none !important; border: 1px dashed rgba(148, 163, 184, 0.4) !important; }`;
      default:
        return '';
    }
  }

  copyAllCss() {
    const css = this.formData().customCss || '';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(css).then(() => {
        this.lms.showToast('All custom CSS copied to clipboard', 'info', 1800, 'Copied');
      });
    }
  }

  resetAllOverrides() {
    if (confirm('Clear all element CSS classes and reset to empty state?')) {
      this.scopedCssElements.update(elements =>
        elements.map(el => ({ ...el, code: '', removeOriginalStyles: false }))
      );
      this.removeOriginalStyles.set(false);
      this.syncCombinedCss();
      this.lms.showToast('All element CSS classes cleared', 'info', 2000, 'Reset Done');
    }
  }

  toggleRemoveOriginalStyles() {
    this.removeOriginalStyles.update(v => !v);
    this.syncCombinedCss();
    this.lms.showToast(
      this.removeOriginalStyles() ? 'Removed original styles' : 'Restored original styles',
      'info',
      1800,
      'Base Styles'
    );
  }

  formatCustomCss() {
    this.scopedCssElements.update(elements =>
      elements.map(el => {
        const lines = el.code.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => `  ${l}`);
        return { ...el, code: lines.join('\n') || '  ' };
      })
    );
    this.syncCombinedCss();
    this.lms.showToast('Formatted custom CSS rules', 'info', 1800, 'CSS Formatted');
  }

  getCleanClassName(name: string): string {
    return name.startsWith('.') ? name.substring(1) : name;
  }

  inspectElement(name: string, elemId?: string) {
    this.activeInspectedElement.set(name);
    if (elemId) {
      this.scopedCssElements.update(elements =>
        elements.map(el => el.id === elemId ? { ...el, isOpen: true } : el)
      );
    }
  }

  extractSelectorBody(css: string, selector: string): string {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'i');
    const match = css.match(regex);
    if (match && match[1]) {
      return match[1].replace(/^\n+|\n+$/g, '');
    }
    return '';
  }

  toggleOverridesMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isOverridesMenuOpen.update(v => !v);
  }

  setCssEditorMode(mode: 'guided' | 'raw') {
    this.cssEditorMode.set(mode);
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
      this.formData.set(this.initFormData());
      this.lms.showToast('Reverted all changes to original saved settings.', 'info', 2500, 'Reverted');
    }
  }

  async onPublish() {
    this.isSaving.set(true);
    const data = this.formData();
    try {
      await fetch('/api/login-branding/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch {
      // fallback to local service state
    }
    this.isSaving.set(false);
    this.lms.publishLoginBranding(data);
    this.lms.showToast('Login branding changes successfully saved and published!', 'success', 3500, 'Changes Saved');
    this.router.navigate(['/login-branding']);
  }

  async onSaveDraft() {
    const draftData = {
      ...this.formData(),
      status: 'Draft' as const
    };
    try {
      await fetch('/api/login-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      });
    } catch {
      // fallback to local service state
    }
    this.lms.updateLoginBranding(draftData);
    this.lms.showToast('Login branding draft saved successfully.', 'info', 3000, 'Draft Saved');
  }

  onDiscard() {
    if (confirm('Discard all unsaved changes and return to the preview page?')) {
      this.formData.set(this.initFormData());
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
          dismissible: current?.dismissible ?? true
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

  // Content Panel Modal Actions
  openContentPanelModal() {
    const currentHtml = this.formData().customHtml;
    const initialHtml = (currentHtml !== undefined && currentHtml !== null && currentHtml.includes('hero-content-panel')) 
      ? currentHtml 
      : getHeroPanelDefaultHtml(this.formData());
    
    const currentCss = this.formData().customCss;
    const initialCss = (currentCss !== undefined && currentCss !== null && currentCss.includes('DARK MODE STYLING'))
      ? currentCss
      : getHeroPanelDefaultCss();

    this.modalHtmlCode.set(initialHtml);
    this.modalCssCode.set(initialCss);
    this.modalEditorTab.set('html');
    this.isContentPanelModalOpen.set(true);
  }

  closeContentPanelModal() {
    this.isContentPanelModalOpen.set(false);
  }

  setModalEditorTab(tab: 'html' | 'css') {
    this.modalEditorTab.set(tab);
  }

  saveContentPanelModal() {
    this.formData.update(f => ({
      ...f,
      customHtml: this.modalHtmlCode(),
      customCss: this.modalCssCode(),
      useCustomContentPanel: true
    }));
    this.isContentPanelModalOpen.set(false);
    this.lms.showToast('Content panel updated with custom HTML & CSS', 'success', 2500, 'Changes Saved');
  }

  clearContentPanel() {
    this.formData.update(f => ({
      ...f,
      customHtml: '',
      useCustomContentPanel: true
    }));
    this.lms.showToast('Content panel cleared — displaying empty placeholder', 'info', 2000, 'Cleared');
  }

  resetToDefaultHero() {
    const defaultHtml = getHeroPanelDefaultHtml(this.formData());
    const defaultCss = getHeroPanelDefaultCss();
    this.formData.update(f => ({
      ...f,
      customHtml: defaultHtml,
      customCss: defaultCss,
      useCustomContentPanel: true
    }));
    this.lms.showToast('Restored default hero panel HTML and CSS', 'info', 2000, 'Reset to Default');
  }

  copyModalCode() {
    const textToCopy = this.modalEditorTab() === 'html' ? this.modalHtmlCode() : this.modalCssCode();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy || '').then(() => {
        this.lms.showToast(`${this.modalEditorTab().toUpperCase()} code copied to clipboard`, 'info', 1800, 'Copied');
      });
    }
  }
}
