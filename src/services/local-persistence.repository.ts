import { LoginBrandingConfig, DEFAULT_LOGIN_BRANDING } from '../models/login-branding.model';
import { LandingPageConfig, createDefaultLandingPage } from '../models/landing-page.model';

const STORAGE_KEYS = {
  PUBLISHED_LOGIN_BRANDING: 'onelms_published_login_branding',
  DRAFT_LOGIN_BRANDING: 'onelms_draft_login_branding',
  PUBLISHED_LANDING_PAGES: 'onelms_published_landing_pages',
  DRAFT_LANDING_PAGES: 'onelms_draft_landing_pages',
  HISTORY_LANDING_PAGES: 'onelms_history_landing_pages',
  AUTH_SESSION: 'onelms_auth_session',
  ADMIN_PORTAL_SESSION: 'onelms_admin_portal_session'
};

export interface AuthSession {
  username: string;
  name: string;
  role: string;
  authenticated: boolean;
  loginTime: string;
  portalScope?: 'admin' | 'standard';
  allowedRoles?: string[];
}

export class LocalPersistenceRepository {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  // --- Auth Session ---
  static getAuthSession(): AuthSession | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static setAuthSession(session: AuthSession | null): void {
    if (!this.isBrowser()) return;
    try {
      if (session) {
        window.sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      } else {
        window.sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
    } catch (e) {
      console.warn('Could not store auth session', e);
    }
  }

  // --- Admin Scoped Portal Session (System Admin & Org Admin Gate) ---
  static isAdminPortalSession(): boolean {
    if (!this.isBrowser()) return false;
    try {
      return window.sessionStorage.getItem(STORAGE_KEYS.ADMIN_PORTAL_SESSION) === 'true';
    } catch {
      return false;
    }
  }

  static setAdminPortalSession(enabled: boolean): void {
    if (!this.isBrowser()) return;
    try {
      if (enabled) {
        window.sessionStorage.setItem(STORAGE_KEYS.ADMIN_PORTAL_SESSION, 'true');
      } else {
        window.sessionStorage.removeItem(STORAGE_KEYS.ADMIN_PORTAL_SESSION);
      }
    } catch (e) {
      console.warn('Could not store admin portal session', e);
    }
  }

  // --- Login Branding ---
  static getPublishedLoginBranding(): LoginBrandingConfig {
    if (!this.isBrowser()) return { ...DEFAULT_LOGIN_BRANDING, status: 'Published' };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.PUBLISHED_LOGIN_BRANDING);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_LOGIN_BRANDING, ...parsed, status: 'Published' };
      }
    } catch (e) {
      console.warn('Failed to parse published login branding from localStorage', e);
    }
    const fallback: LoginBrandingConfig = { ...DEFAULT_LOGIN_BRANDING, status: 'Published' };
    this.savePublishedLoginBranding(fallback);
    return fallback;
  }

  static savePublishedLoginBranding(config: LoginBrandingConfig): void {
    if (!this.isBrowser()) return;
    try {
      const toSave = { ...config, status: 'Published' };
      window.localStorage.setItem(STORAGE_KEYS.PUBLISHED_LOGIN_BRANDING, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save published login branding', e);
    }
  }

  static getDraftLoginBranding(): LoginBrandingConfig {
    if (!this.isBrowser()) return { ...DEFAULT_LOGIN_BRANDING, status: 'Draft' };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.DRAFT_LOGIN_BRANDING);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load draft login branding', e);
    }
    // Default draft is cloned from published
    return { ...this.getPublishedLoginBranding(), status: 'Draft' };
  }

  static saveDraftLoginBranding(config: LoginBrandingConfig): void {
    if (!this.isBrowser()) return;
    try {
      const toSave = { ...config, status: 'Draft' };
      window.localStorage.setItem(STORAGE_KEYS.DRAFT_LOGIN_BRANDING, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save draft login branding', e);
    }
  }

  // --- Landing Page ---
  static getPublishedLandingPage(lmsId: string): LandingPageConfig | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.PUBLISHED_LANDING_PAGES);
      if (raw) {
        const map = JSON.parse(raw);
        if (map[lmsId]) {
          const loaded = map[lmsId];
          // Always sanitize names, titles, and hero headlines
          loaded.lmsName = 'BLD LMS';
          if (loaded.navbar) {
            loaded.navbar.siteTitle = 'BLD LMS';
          }
          if (loaded.footer) {
            loaded.footer.copyrightText = '© 2026 BRAC — BLD LMS Portal. All Rights Reserved.';
          }
          if (Array.isArray(loaded.sections)) {
            const hero = loaded.sections.find((s: any) => s.type === 'hero_banner');
            if (hero && hero.content) {
              hero.content.headline = 'Learn Today. Lead Tomorrow.';
              hero.content.subheadline = 'Build practical skills, master modern leadership, and achieve certified milestones with interactive courses built for BRAC.';
              hero.content.badgeText = '';
              hero.content.badgeIcon = '';
              hero.content.cardBadgeText = 'BRAC ACADEMY CERTIFIED';
              hero.content.cardTitle = 'Practical Skill Pathways';
              hero.content.cardDescription = 'Structured courses and assessments designed for career growth across BRAC.';
            }

            const whySec = loaded.sections.find((s: any) => s.type === 'why_lms');
            if (whySec) {
              whySec.title = 'Why BLD LMS by BRAC';
              if (whySec.content) {
                whySec.content.heading = 'Why Learn with BLD LMS by BRAC';
              }
            }

            const impact = loaded.sections.find((s: any) => s.type === 'impact_figures');
            if (impact) {
              impact.background = { type: 'neutral' };
              if (impact.content) {
                impact.content.heading = 'BRAC Learning Impact';
                impact.content.subheading = 'Practical milestones tracking active engagement and skills developed across BRAC communities and Bangladesh.';
              }
            }

            // Ensure courses_grid section is present
            const hasCourses = loaded.sections.some((s: any) => s.type === 'courses_grid');
            if (!hasCourses) {
              const progIdx = loaded.sections.findIndex((s: any) => s.type === 'featured_programmes');
              const coursesSec: any = {
                id: 'courses',
                type: 'courses_grid',
                title: 'Explore Certified Courses',
                subtitle: 'Practical, high-impact modules crafted with field-tested curriculum, interactive assignments, and verifiable certifications.',
                badge: 'Course Catalog',
                enabled: true,
                order: 4,
                layout: 'standard',
                background: { type: 'neutral' },
                padding: 'spacious',
                content: {
                  sectionTagline: 'Learn practical, field-tested skills with flexible video lessons, interactive quizzes, and verifiable certificates.',
                  filterCategories: ['All Categories', 'Microfinance & Compliance', 'Artificial Intelligence', 'Cybersecurity', 'Healthcare', 'Strategic Leadership'],
                  displayCount: 6,
                  columns: 3,
                  showPrice: false,
                  showRating: true,
                  showEnrollButton: true,
                  enrollButtonText: 'Enroll Now',
                  enrollButtonAction: 'modal',
                  showLevelBadge: true,
                  showInstructor: true
                }
              };
              if (progIdx !== -1) {
                loaded.sections.splice(progIdx + 1, 0, coursesSec);
              } else {
                loaded.sections.push(coursesSec);
              }
            }

            // Ensure navbar has courses link
            if (loaded.navbar && Array.isArray(loaded.navbar.links)) {
              if (!loaded.navbar.links.some((l: any) => l.target === '#courses')) {
                const progLinkIdx = loaded.navbar.links.findIndex((l: any) => l.target === '#programmes');
                const courseLink = { id: 'nav-courses', label: 'Courses', type: 'scroll', target: '#courses' };
                if (progLinkIdx !== -1) {
                  loaded.navbar.links.splice(progLinkIdx + 1, 0, courseLink);
                } else {
                  loaded.navbar.links.push(courseLink);
                }
              }
            }
          }
          return { ...loaded, status: 'Published' };
        }
      }
    } catch (e) {
      console.warn('Failed to load published landing page', e);
    }
    return null;
  }

  static savePublishedLandingPage(config: LandingPageConfig): void {
    if (!this.isBrowser() || !config || !config.lmsId) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.PUBLISHED_LANDING_PAGES);
      const map = raw ? JSON.parse(raw) : {};
      const toSave: LandingPageConfig = { ...config, status: 'Published' };
      map[config.lmsId] = toSave;
      window.localStorage.setItem(STORAGE_KEYS.PUBLISHED_LANDING_PAGES, JSON.stringify(map));

      // Also record into history
      this.appendLandingPageHistory(config.lmsId, toSave);
    } catch (e) {
      console.warn('Failed to save published landing page', e);
    }
  }

  static getDraftLandingPage(lmsId: string): LandingPageConfig | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.DRAFT_LANDING_PAGES);
      if (raw) {
        const map = JSON.parse(raw);
        if (map[lmsId]) {
          return map[lmsId];
        }
      }
    } catch (e) {
      console.warn('Failed to load draft landing page', e);
    }
    return null;
  }

  static saveDraftLandingPage(config: LandingPageConfig): void {
    if (!this.isBrowser() || !config || !config.lmsId) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.DRAFT_LANDING_PAGES);
      const map = raw ? JSON.parse(raw) : {};
      map[config.lmsId] = { ...config, status: 'Draft' };
      window.localStorage.setItem(STORAGE_KEYS.DRAFT_LANDING_PAGES, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save draft landing page', e);
    }
  }

  private static appendLandingPageHistory(lmsId: string, page: LandingPageConfig): void {
    if (!this.isBrowser()) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.HISTORY_LANDING_PAGES);
      const map: Record<string, LandingPageConfig[]> = raw ? JSON.parse(raw) : {};
      const list = map[lmsId] || [];
      list.unshift({ ...page });
      // Keep up to 10 versions
      map[lmsId] = list.slice(0, 10);
      window.localStorage.setItem(STORAGE_KEYS.HISTORY_LANDING_PAGES, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save history for landing page', e);
    }
  }

  static getLandingPageHistory(lmsId: string): LandingPageConfig[] {
    if (!this.isBrowser()) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.HISTORY_LANDING_PAGES);
      if (raw) {
        const map = JSON.parse(raw);
        return map[lmsId] || [];
      }
    } catch {
      return [];
    }
    return [];
  }
}
