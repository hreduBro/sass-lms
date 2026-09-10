export interface SidePanelBullet {
  id: string;
  icon: string;
  title: string;
  description?: string;
}

export interface SidePanelConfig {
  badgeText: string;
  badgeIcon: string;
  theme: 'glass' | 'dark' | 'light' | 'gradient';
  position?: 'left' | 'right';
  bullets: SidePanelBullet[];
  showSecurityShield: boolean;
  showStatsRow: boolean;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
}

export interface AnnouncementBannerConfig {
  enabled: boolean;
  text: string;
  type: 'info' | 'warning' | 'alert' | 'success' | 'security';
  style: 'floating_pill' | 'top_bar' | 'card_embedded';
  dismissible: boolean;
  actionText?: string;
}

export interface LoginBrandingConfig {
  id: string;
  tenantId?: string;
  lmsInstanceId?: string;
  pageTitle: string;
  headline: string;
  subheadline: string;
  tagline: string;
  logoUrlLight: string;
  logoUrlDark?: string;
  logoHeightPx: number;
  faviconUrl?: string;
  layout: 'split_modern_canvas' | 'split_left' | 'split_right' | 'centered_card' | 'full_bleed';
  splitPosition?: 'left' | 'right';
  backgroundType: 'image' | 'gradient' | 'mesh' | 'solid';
  backgroundImageUrl: string;
  backgroundGradient: string;
  backgroundOverlayColor: string;
  backgroundOverlayOpacity: number; // 0 to 100
  backgroundBlurPx: number; // 0 to 20
  cardStyle: 'solid_white' | 'glassmorphism' | 'neumorphic' | 'minimal_border';
  cardBlurAmount: number; // For glassmorphism
  cardBorderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  cardShadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  primaryColor: string;
  accentColor: string;
  textColor: string;
  buttonStyle: 'rounded' | 'pill' | 'square';
  buttonGradientEnabled: boolean;
  enableSsoGoogle: boolean;
  enableSsoMicrosoft: boolean;
  enableSsoOkta: boolean;
  enableSsoSaml: boolean;
  enablePasswordLogin: boolean;
  enableRememberMe: boolean;
  enableForgotPassword: boolean;
  enableSelfRegistration: boolean;
  supportContactEmail: string;
  supportContactPhone?: string;
  helpdeskUrl?: string;
  copyrightText: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  showLanguagePicker: boolean;
  defaultLanguage: string;
  announcementBanner?: AnnouncementBannerConfig;
  sidePanel?: SidePanelConfig;
  securityBadges: {
    showSslBadge: boolean;
    showSoc2Badge: boolean;
    showIsoBadge: boolean;
  };
  customHtml?: string;
  customCss?: string;
  useCustomContentPanel?: boolean;
  status: 'Published' | 'Draft';
  version: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface CssSelectorGuide {
  id: string;
  name: string;
  selector: string;
  description: string;
  sampleCss: string;
}

export const CSS_SELECTOR_GUIDES: CssSelectorGuide[] = [
  {
    id: 'background',
    name: 'Background',
    selector: '.auth-background',
    description: 'Target the outer full-screen viewport container and backdrop overlay',
    sampleCss: `.auth-background {\n  backdrop-filter: blur(8px);\n  transition: all 0.5s ease-in-out;\n}`
  },
  {
    id: 'header',
    name: 'Header',
    selector: '.auth-header',
    description: 'Top branding bar containing organizational logo, tenant title and language dropdown',
    sampleCss: `.auth-header {\n  border-bottom: 1px solid rgba(255, 255, 255, 0.12);\n  padding: 1.25rem 2.5rem;\n}`
  },
  {
    id: 'card',
    name: 'Card',
    selector: '.auth-card',
    description: 'Main login authentication card container and bounding box',
    sampleCss: `.auth-card {\n  border: 1px solid rgba(255, 255, 255, 0.25);\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);\n  border-radius: 1.25rem;\n  transition: transform 0.2s ease;\n}\n.auth-card:hover {\n  transform: translateY(-2px);\n}`
  },
  {
    id: 'primary-button',
    name: 'Primary button',
    selector: '.auth-primary-btn',
    description: 'Sign In CTA button and primary submission controls',
    sampleCss: `.auth-primary-btn {\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n  font-weight: 700;\n  box-shadow: 0 4px 14px 0 rgba(236, 0, 140, 0.39);\n  transition: all 0.2s ease;\n}\n.auth-primary-btn:hover {\n  filter: brightness(1.08);\n  box-shadow: 0 6px 20px rgba(236, 0, 140, 0.55);\n}`
  },
  {
    id: 'secondary-button',
    name: 'Secondary button / SSO',
    selector: '.auth-sso-btn',
    description: 'Federated identity provider buttons (Google, Microsoft, Okta, SAML)',
    sampleCss: `.auth-sso-btn {\n  border: 1px solid rgba(226, 232, 240, 0.8);\n  border-radius: 0.75rem;\n  transition: all 0.15s ease-in-out;\n}\n.auth-sso-btn:hover {\n  background-color: #f8fafc;\n  border-color: #cbd5e1;\n  transform: translateY(-1px);\n}`
  },
  {
    id: 'text-field',
    name: 'Text field',
    selector: '.auth-input',
    description: 'Work email and password input fields',
    sampleCss: `.auth-input {\n  border-radius: 0.75rem;\n  font-size: 0.875rem;\n  transition: border-color 0.2s, box-shadow 0.2s;\n}\n.auth-input:focus {\n  border-color: #ec008c;\n  box-shadow: 0 0 0 3px rgba(236, 0, 140, 0.2);\n}`
  },
  {
    id: 'label',
    name: 'Label',
    selector: '.auth-label',
    description: 'Input field labels, helper headings and field captions',
    sampleCss: `.auth-label {\n  font-weight: 700;\n  font-size: 0.75rem;\n  letter-spacing: 0.025em;\n  color: #334155;\n}`
  },
  {
    id: 'callout',
    name: 'Callout / Banner',
    selector: '.auth-announcement',
    description: 'System maintenance alerts and broadcast notification banner',
    sampleCss: `.auth-announcement {\n  border-bottom: 2px solid rgba(255, 255, 255, 0.2);\n  font-weight: 600;\n  animation: fadeInDown 0.3s ease-out;\n}`
  },
  {
    id: 'org-selection',
    name: 'Organization selection',
    selector: '.auth-tenant-selector',
    description: 'Multi-tenant domain switcher and demo role quick-fill chips',
    sampleCss: `.auth-tenant-selector {\n  backdrop-filter: blur(12px);\n  background: rgba(255, 255, 255, 0.1);\n  border: 1px solid rgba(255, 255, 255, 0.15);\n}`
  },
  {
    id: 'sso-trigger',
    name: 'SSO profile trigger',
    selector: '.auth-sso-trigger',
    description: 'IdP trigger badges and verified SSO authentication tokens',
    sampleCss: `.auth-sso-trigger {\n  border-radius: 9999px;\n  padding: 0.25rem 0.75rem;\n  font-size: 0.75rem;\n}`
  },
  {
    id: 'footer',
    name: 'Footer',
    selector: '.auth-footer',
    description: 'Bottom legal copyright, security certificates and privacy links',
    sampleCss: `.auth-footer {\n  border-top: 1px solid rgba(255, 255, 255, 0.1);\n  font-size: 0.75rem;\n}\n.auth-footer a:hover {\n  text-decoration: underline;\n  color: #ffffff;\n}`
  }
];

export const CSS_TEMPLATES = [
  {
    id: 'glassmorphism-glow',
    name: 'Glassmorphism Glow & Neon Aura',
    description: 'Frosted glass container with subtle pulsating border lighting and smooth hover lift',
    css: `/* Custom Login Page Overrides */
.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(236, 0, 140, 0.25);
  box-shadow: 0 20px 60px -15px rgba(236, 0, 140, 0.18), 0 0 1px 1px rgba(255, 255, 255, 0.8);
  border-radius: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-card:hover {
  box-shadow: 0 25px 70px -10px rgba(236, 0, 140, 0.28);
}

.auth-primary-btn {
  background: linear-gradient(135deg, #EC008C 0%, #B8006E 100%);
  box-shadow: 0 4px 15px rgba(236, 0, 140, 0.35);
  font-weight: 700;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
}

.auth-primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(236, 0, 140, 0.45);
}

.auth-sso-btn {
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.auth-sso-btn:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}`
  },
  {
    id: 'cyber-dark-minimal',
    name: 'Cyber Dark Minimalist',
    description: 'High-contrast dark theme with sharp focus rings and modern typography',
    css: `/* Cyber Dark Minimalist Theme */
.auth-card {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #f8fafc;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}

.auth-card h2, .auth-card p {
  color: #f8fafc !important;
}

.auth-input {
  background-color: #0f172a !important;
  border: 1px solid #334155 !important;
  color: #f8fafc !important;
}

.auth-input:focus {
  border-color: #38bdf8 !important;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important;
}

.auth-primary-btn {
  background: #38bdf8 !important;
  color: #0f172a !important;
  font-weight: 800;
}`
  },
  {
    id: 'soft-neumorphism',
    name: 'Soft Neumorphic Depth',
    description: 'Warm, soft shadow-relief aesthetic with rounded pill controls',
    css: `/* Soft Neumorphic Style */
.auth-card {
  border-radius: 1.5rem;
  box-shadow: 12px 12px 28px #cbd5e1, -12px -12px 28px #ffffff;
  border: 1px solid #f1f5f9;
}

.auth-primary-btn {
  border-radius: 9999px;
  box-shadow: 4px 4px 10px #e2e8f0, -4px -4px 10px #ffffff;
}

.auth-input {
  border-radius: 9999px;
  padding-left: 1.25rem !important;
  box-shadow: inset 2px 2px 5px #e2e8f0, inset -2px -2px 5px #ffffff;
}`
  }
];

export function getHeroPanelDefaultHtml(config?: Partial<LoginBrandingConfig>): string {
  const headline = config?.headline || 'Welcome to BRAC Learning Portal';
  const subheadline = config?.subheadline || 'Sign in to access your assigned curriculum, certifications, virtual classrooms and progress transcripts.';
  const logoUrl = config?.logoUrlLight || 'https://freelogopng.com/images/all_img/1679820004brac-icon.png';
  const brandTitle = 'BRAC LMS';

  if (config?.layout === 'split_left' || config?.layout === 'split_right') {
    return `<div class="space-y-4 max-w-md">
  <!-- Badge & Icon -->
  <div class="flex items-center gap-2">
    <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-pink-600/20 border border-pink-500/30">
      <span class="material-symbols-outlined text-pink-400 text-base">verified_user</span>
    </div>
    <span class="text-[11px] font-extrabold uppercase tracking-widest text-pink-400">ENTERPRISE PORTAL</span>
  </div>

  <!-- Main Headline -->
  <div>
    <h1 class="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white">
      ${headline}
    </h1>
  </div>

  <!-- Subheadline -->
  <p class="text-xs sm:text-sm leading-relaxed text-white/85">
    ${subheadline}
  </p>

  <!-- Feature Highlights List -->
  <div class="space-y-2.5 pt-1">
    <div class="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div class="w-5 h-5 rounded-md bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0 mt-0.5">
        <span class="material-symbols-outlined text-pink-400 text-xs">shield_lock</span>
      </div>
      <div class="text-xs min-w-0 text-white">
        <div class="font-bold truncate">Protected by Cloud Security Shield</div>
        <div class="text-[10px] text-white/70 mt-0.5">256-bit AES encryption & adaptive threat radar</div>
      </div>
    </div>
    <div class="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div class="w-5 h-5 rounded-md bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0 mt-0.5">
        <span class="material-symbols-outlined text-pink-400 text-xs">auto_awesome</span>
      </div>
      <div class="text-xs min-w-0 text-white">
        <div class="font-bold truncate">Adaptive AI Learning Path</div>
        <div class="text-[10px] text-white/70 mt-0.5">Real-time skill cluster mapping and smart recommendations</div>
      </div>
    </div>
    <div class="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div class="w-5 h-5 rounded-md bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0 mt-0.5">
        <span class="material-symbols-outlined text-pink-400 text-xs">sync_saved_locally</span>
      </div>
      <div class="text-xs min-w-0 text-white">
        <div class="font-bold truncate">Real-time Transcript Sync</div>
        <div class="text-[10px] text-white/70 mt-0.5">Instant credentials and verifiable digital certificates</div>
      </div>
    </div>
  </div>

  <!-- Stats Row -->
  <div class="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-white">
    <div>
      <div class="text-lg sm:text-xl font-black text-pink-400 tracking-tight">24,500+</div>
      <div class="text-[10px] text-white/70 uppercase font-semibold tracking-wider">Active Learners</div>
    </div>
    <div>
      <div class="text-lg sm:text-xl font-black text-emerald-400 tracking-tight">99.99%</div>
      <div class="text-[10px] text-white/70 uppercase font-semibold tracking-wider">SSO Uptime</div>
    </div>
  </div>
</div>`;
  }

  // Modern Split Canvas Default HTML (Exact Match with Canvas Template)
  return `<div class="h-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 text-white">
  <!-- Top Nav Row -->
  <div class="flex items-center justify-between">
    <div class="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
      <span>Canvas.</span>
    </div>
    <div class="flex items-center gap-5 text-xs text-white/70">
      <a href="javascript:void(0)" class="hover:text-white transition-colors">Features</a>
      <a href="javascript:void(0)" class="hover:text-white transition-colors">Docs</a>
      <a href="javascript:void(0)" class="hover:text-white transition-colors">Contact</a>
    </div>
  </div>

  <!-- Center Hero Content -->
  <div class="space-y-6 my-auto py-8">
    <div class="space-y-3 max-w-xl">
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
        Build faster with clean structure
      </h1>
      <p class="text-sm sm:text-base text-white/80 leading-relaxed max-w-lg">
        A barebones, modern responsive layout ready for customization without extra frameworks or dependencies.
      </p>
      <div class="pt-2">
        <a href="javascript:void(0)" class="inline-flex items-center gap-1 text-sm font-semibold text-white underline underline-offset-4 hover:text-white/80">
          Get Started &rarr;
        </a>
      </div>
    </div>

    <!-- 3 Feature Columns -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/10">
      <div class="space-y-1.5 p-3.5 rounded-xl bg-white/5 border border-white/10">
        <div class="font-bold text-xs text-white">Design System</div>
        <div class="text-[11px] text-white/70 leading-relaxed">Pre-configured CSS variables for colors, spacing, and hover states to keep styling consistent.</div>
      </div>
      <div class="space-y-1.5 p-3.5 rounded-xl bg-white/5 border border-white/10">
        <div class="font-bold text-xs text-white">CSS Grid Layout</div>
        <div class="text-[11px] text-white/70 leading-relaxed">Auto-wrapping card rows that fluidly fit mobile viewports up to ultrawide desktop monitors.</div>
      </div>
      <div class="space-y-1.5 p-3.5 rounded-xl bg-white/5 border border-white/10">
        <div class="font-bold text-xs text-white">Zero Dependencies</div>
        <div class="text-[11px] text-white/70 leading-relaxed">Self-contained HTML and CSS with zero external network requests or script execution.</div>
      </div>
    </div>
  </div>

  <!-- Footer Row -->
  <div class="pt-4 flex items-center justify-between text-[11px] text-white/50 border-t border-white/10">
    <div>&copy; 2026 Canvas Design Template. All rights reserved.</div>
  </div>
</div>`;
}

export function getHeroPanelDefaultCss(): string {
  return `/* Custom Hero Content Panel & Card CSS Overrides */
.auth-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-primary-btn {
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
}

.auth-primary-btn:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}`;
}

export const DEFAULT_LOGIN_BRANDING: LoginBrandingConfig = {
  id: 'branding-brac-default',
  tenantId: 'tenant-brac',
  pageTitle: 'BRAC Learning Portal | Single Sign-On',
  headline: 'Welcome to BRAC Learning Portal',
  subheadline: 'Sign in to access your assigned curriculum, certifications, virtual classrooms and progress transcripts.',
  tagline: 'Creating Opportunities For People To Realise Potential',
  logoUrlLight: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
  logoUrlDark: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
  logoHeightPx: 48,
  faviconUrl: 'https://freelogopng.com/images/all_img/1679820004brac-icon.png',
  layout: 'split_modern_canvas',
  splitPosition: 'right',
  backgroundType: 'image',
  backgroundImageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1920&q=85',
  backgroundGradient: 'linear-gradient(135deg, #EC008C 0%, #700042 100%)',
  backgroundOverlayColor: '#1e1b4b',
  backgroundOverlayOpacity: 45,
  backgroundBlurPx: 0,
  cardStyle: 'solid_white',
  cardBlurAmount: 16,
  cardBorderRadius: '2xl',
  cardShadow: '2xl',
  primaryColor: '#EC008C', // BRAC Magenta
  accentColor: '#C40072',
  textColor: '#0f172a',
  buttonStyle: 'rounded',
  buttonGradientEnabled: true,
  enableSsoGoogle: true,
  enableSsoMicrosoft: true,
  enableSsoOkta: true,
  enableSsoSaml: false,
  enablePasswordLogin: true,
  enableRememberMe: true,
  enableForgotPassword: true,
  enableSelfRegistration: true,
  supportContactEmail: 'learning.support@brac.net',
  supportContactPhone: '+880 2 2222 81265',
  helpdeskUrl: 'https://helpdesk.brac.net',
  copyrightText: '© 2026 BRAC & BRAC IT Services. All Rights Reserved.',
  privacyPolicyUrl: 'https://brac.net/privacy-policy',
  termsOfServiceUrl: 'https://brac.net/terms',
  showLanguagePicker: true,
  defaultLanguage: 'English',
  announcementBanner: {
    enabled: true,
    text: 'Scheduled system maintenance on Sunday at 02:00 UTC. SSO logins will remain uninterrupted.',
    type: 'info',
    style: 'floating_pill',
    dismissible: true,
    actionText: 'System Status'
  },
  sidePanel: {
    badgeText: 'ENTERPRISE PORTAL',
    badgeIcon: 'verified_user',
    theme: 'glass',
    bullets: [
      { id: 'b1', icon: 'shield_lock', title: 'Protected by Cloud Security Shield', description: '256-bit AES encryption & adaptive threat radar' },
      { id: 'b2', icon: 'auto_awesome', title: 'Adaptive AI Learning Path', description: 'Real-time skill cluster mapping and smart recommendations' },
      { id: 'b3', icon: 'sync_saved_locally', title: 'Real-time Transcript Sync', description: 'Instant credentials and verifiable digital certificates' }
    ],
    showSecurityShield: true,
    showStatsRow: true,
    stat1Value: '24,500+',
    stat1Label: 'Active Learners',
    stat2Value: '99.99%',
    stat2Label: 'SSO Uptime'
  },
  securityBadges: {
    showSslBadge: true,
    showSoc2Badge: true,
    showIsoBadge: true
  },
  customHtml: getHeroPanelDefaultHtml({ layout: 'split_modern_canvas' }),
  customCss: `/* AuthKit & Custom Login Portal CSS Overrides */
.ak-Background {
  transition: background-color 0.2s ease;
}

.ak-Card {
  transition: all 0.2s ease;
}

.ak-PrimaryButton {
  transition: all 0.2s ease;
}

.ak-PrimaryButton:hover {
  filter: brightness(1.05);
}`,
  useCustomContentPanel: true,
  status: 'Published',
  version: 2.4,
  lastUpdatedBy: 'Farhana Ahmed (System Admin)',
  lastUpdatedAt: '2026-03-09 14:30'
};

export interface TexturePreset {
  id: string;
  name: string;
  category: 'Geometric' | 'Grid' | 'Mesh' | 'Matrix' | 'Abstract';
  cssBackground: string;
  description: string;
}

export interface SolidColorPreset {
  id: string;
  name: string;
  color: string;
  isDark: boolean;
}

export const PRESET_SOLID_COLORS: SolidColorPreset[] = [
  { id: 'solid-slate', name: 'Deep Slate', color: '#0f172a', isDark: true },
  { id: 'solid-midnight', name: 'Midnight Navy', color: '#090d16', isDark: true },
  { id: 'solid-brand-tint', name: 'Brand Magenta Abyss', color: '#3b0024', isDark: true },
  { id: 'solid-indigo', name: 'Royal Indigo Void', color: '#1e1b4b', isDark: true },
  { id: 'solid-charcoal', name: 'Warm Charcoal', color: '#18181b', isDark: true },
  { id: 'solid-forest', name: 'Emerald Abyss', color: '#022c22', isDark: true },
  { id: 'solid-pearl', name: 'Soft Pearl White', color: '#f8fafc', isDark: false },
  { id: 'solid-pure-white', name: 'Crisp White', color: '#ffffff', isDark: false },
  { id: 'solid-cool-gray', name: 'Corporate Cool Gray', color: '#e2e8f0', isDark: false },
  { id: 'solid-subtle-pink', name: 'Subtle Rose Frost', color: '#fdf2f8', isDark: false },
];

export const PRESET_TEXTURE_BACKGROUNDS: TexturePreset[] = [
  {
    id: 'fluid-silk-aurora',
    name: 'Fluid Silk Aurora (Truet Flow)',
    category: 'Mesh',
    cssBackground: 'radial-gradient(at 10% 15%, #3b82f6 0px, transparent 55%), radial-gradient(at 90% 10%, #f472b6 0px, transparent 50%), radial-gradient(at 85% 85%, #6366f1 0px, transparent 60%), radial-gradient(at 15% 85%, #1d4ed8 0px, transparent 65%), linear-gradient(135deg, #1e40af 0%, #1e1b4b 50%, #0f172a 100%)',
    description: 'Vibrant fluid silk aura with sweeping blue, magenta and indigo waves'
  },
  {
    id: 'mesh-aurora',
    name: 'Aurora Multi-Mesh',
    category: 'Mesh',
    cssBackground: 'radial-gradient(at 0% 0%, #ec008c 0px, transparent 50%), radial-gradient(at 100% 0%, #4f46e5 0px, transparent 50%), radial-gradient(at 100% 100%, #06b6d4 0px, transparent 50%), radial-gradient(at 0% 100%, #0f172a 0px, transparent 50%) #0f172a',
    description: 'Dynamic multi-color mesh gradient with vivid lighting accents'
  },
  {
    id: 'blueprint-grid',
    name: 'Architect Blueprint Grid',
    category: 'Grid',
    cssBackground: 'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, #0f172a 1px)',
    description: 'Precision architectural grid lines over deep space canvas'
  },
  {
    id: 'neural-dot-matrix',
    name: 'Neural Dot Matrix',
    category: 'Geometric',
    cssBackground: 'radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px) 0 0 / 24px 24px, #090d16',
    description: 'High-density micro-dot lattice for modern tech and AI feel'
  },
  {
    id: 'diagonal-carbon-hatch',
    name: 'Diagonal Carbon Hatch',
    category: 'Matrix',
    cssBackground: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 12px), #0f172a',
    description: 'High-tech diagonally textured carbon-fiber pattern'
  },
  {
    id: 'magenta-glow-radial',
    name: 'Magenta Brand Radial Glow',
    category: 'Abstract',
    cssBackground: 'radial-gradient(circle at 50% 30%, rgba(236, 0, 140, 0.45) 0%, rgba(15, 23, 42, 0.95) 70%, #090d16 100%)',
    description: 'Soft luminous magenta atmospheric glow centered behind the login card'
  },
  {
    id: 'frost-light-dots',
    name: 'Frost Minimal Light Lattice',
    category: 'Grid',
    cssBackground: 'radial-gradient(circle, rgba(15, 23, 42, 0.12) 1.2px, transparent 1.2px) 0 0 / 20px 20px, #f8fafc',
    description: 'Clean light background with subtle precision slate dots'
  }
];

export const PRESET_BACKGROUND_IMAGES = [
  {
    id: 'bg-brac-campus',
    name: 'BRAC Learning Centre Campus',
    category: 'Campus',
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1920&q=85'
  },
  {
    id: 'bg-modern-workspace',
    name: 'Modern Collaborative Space',
    category: 'Corporate',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=85'
  },
  {
    id: 'bg-cyber-spatial',
    name: 'Lumina Spatial Neural Grid',
    category: 'Abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=85'
  },
  {
    id: 'bg-library-study',
    name: 'University Grand Library',
    category: 'Academic',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=85'
  },
  {
    id: 'bg-clinical-health',
    name: 'Apex Clinical & Medical Lab',
    category: 'Healthcare',
    url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1920&q=85'
  },
  {
    id: 'bg-finance-district',
    name: 'Global Financial Skyline',
    category: 'Corporate',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=85'
  }
];

export const PRESET_COLOR_PALETTES = [
  { name: 'BRAC Magenta (Official)', primary: '#EC008C', accent: '#C40072', previewBg: '#fdf2f8' },
  { name: 'Lumina Neon Cyan', primary: '#06b6d4', accent: '#8b5cf6', previewBg: '#ecfeff' },
  { name: 'Enterprise Royal Blue', primary: '#2563eb', accent: '#3b82f6', previewBg: '#eff6ff' },
  { name: 'Deep Indigo Modern', primary: '#4f46e5', accent: '#6366f1', previewBg: '#eef2ff' },
  { name: 'Apex Emerald Health', primary: '#059669', accent: '#10b981', previewBg: '#ecfdf5' },
  { name: 'Crimson Stanford Red', primary: '#b91c1c', accent: '#dc2626', previewBg: '#fef2f2' },
  { name: 'Dark Obsidian Sleek', primary: '#0f172a', accent: '#334155', previewBg: '#f8fafc' }
];
