import { LoginBrandingConfig, DEFAULT_LOGIN_BRANDING } from '../models/login-branding.model';
import { LandingPageConfig, createDefaultLandingPage } from '../models/landing-page.model';

const STORAGE_KEYS = {
  PUBLISHED_LOGIN_BRANDING: 'onelms_published_login_branding',
  DRAFT_LOGIN_BRANDING: 'onelms_draft_login_branding',
  PUBLISHED_LANDING_PAGES: 'onelms_published_landing_pages',
  DRAFT_LANDING_PAGES: 'onelms_draft_landing_pages',
  HISTORY_LANDING_PAGES: 'onelms_history_landing_pages',
  AUTH_SESSION: 'onelms_auth_session',
  ADMIN_PORTAL_SESSION: 'onelms_admin_portal_session',
  REPOSITORY_ITEMS: 'onelms_content_repository_items',
  ASSESSMENTS: 'onelms_assessments',
  ASSESSMENT_ATTEMPTS: 'onelms_assessment_attempts'
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
          loaded.lmsName = 'LLD LMS';
          if (loaded.navbar) {
            loaded.navbar.siteTitle = 'LLD LMS';
          }
          if (loaded.footer) {
            loaded.footer.copyrightText = '© 2026 BRAC — LLD LMS Portal. All Rights Reserved.';
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
              whySec.title = 'Why LLD LMS by BRAC';
              if (whySec.content) {
                whySec.content.heading = 'Why Learn with LLD LMS by BRAC';
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

  // --- Content Repository & Assessments Persistence (§0 - §7) ---
  static getRepositoryItems<T = any>(): T[] | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.REPOSITORY_ITEMS);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to parse repository items from localStorage', e);
      return null;
    }
  }

  static saveRepositoryItems<T = any>(items: T[]): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.REPOSITORY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save repository items to localStorage', e);
    }
  }

  static getAssessments<T = any>(): T[] | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to parse assessments from localStorage', e);
      return null;
    }
  }

  static saveAssessments<T = any>(assessments: T[]): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
    } catch (e) {
      console.warn('Failed to save assessments to localStorage', e);
    }
  }

  static getAssessmentAttempts<T = any>(): T[] | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.ASSESSMENT_ATTEMPTS);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to parse assessment attempts from localStorage', e);
      return null;
    }
  }

  static saveAssessmentAttempts<T = any>(attempts: T[]): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.ASSESSMENT_ATTEMPTS, JSON.stringify(attempts));
    } catch (e) {
      console.warn('Failed to save assessment attempts to localStorage', e);
    }
  }

  // --- IndexedDB Asset Storage for Question Author Attachments ---
  private static readonly DB_NAME = 'onelms_author_assets_db';
  private static readonly STORE_NAME = 'question_attachments';
  private static dbPromise: Promise<IDBDatabase | null> | null = null;

  private static getDB(): Promise<IDBDatabase | null> {
    if (!this.isBrowser() || typeof indexedDB === 'undefined') {
      return Promise.resolve(null);
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = indexedDB.open(this.DB_NAME, 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(this.STORE_NAME)) {
              db.createObjectStore(this.STORE_NAME, { keyPath: 'assetId' });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => {
            console.warn('Failed to open IndexedDB for author assets', req.error);
            resolve(null);
          };
        } catch (e) {
          console.warn('IndexedDB not supported or accessible', e);
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  static async saveQuestionAsset(assetId: string, blob: Blob, fileName: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        store.put({ assetId, blob, fileName, savedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => {
          console.warn('Failed to save asset to IndexedDB', tx.error);
          resolve(false);
        };
      });
    } catch (e) {
      console.warn('Error saving question asset', e);
      return false;
    }
  }

  static async getQuestionAsset(assetId: string): Promise<{ blob: Blob; fileName: string } | null> {
    try {
      const db = await this.getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(assetId);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve({ blob: req.result.blob, fileName: req.result.fileName || 'attachment' });
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('Error reading question asset', e);
      return null;
    }
  }

  static async deleteQuestionAsset(assetId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        store.delete(assetId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }
}
