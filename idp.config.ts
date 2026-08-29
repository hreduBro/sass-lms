import {Injectable} from '@angular/core';
import {KeycloakConfig} from "keycloak-js";
import {environment} from "@/environments/environment";

export interface AppConfig {
    primaryColor: string;
    accentColor: string;
    tagline: string;
    bannerUrl: string;
    logoUrl: string;
    faviconUrl: string;
    customCssEnabled: boolean;
    themePreset: 'solid' | 'glassmorphism' | 'neumorphic' | string;
    ssoProvider: string;
    realm: string;
    url: string;
    clientId: string;
}

@Injectable({
    providedIn: 'root',
})
export class IdpConfig {
    private static readonly STORAGE_KEY = 'app_idp_config';
    private static idpConfig: KeycloakConfig | null = null;
    private static appConfig: AppConfig | null = null;

    /**
     * Builds default application & branding configuration purely from environment (defaults to BRAC theme)
     */
    static getDefaultConfig(): AppConfig {
        const theme = (environment as any).theme || {};
        const idp = (environment as any).idpConfig || {};

        return {
            primaryColor: theme.primaryColor || '#EC008C',
            accentColor: theme.accentColor || '#C40072',
            tagline: theme.tagline || 'Creating Opportunities For People To Realise Potential',
            bannerUrl: theme.bannerUrl || '',
            logoUrl: theme.logoUrl || '',
            faviconUrl: theme.faviconUrl || '',
            customCssEnabled: theme.customCssEnabled !== false,
            themePreset: theme.themePreset || 'solid',
            ssoProvider: theme.ssoProvider || 'Google Workspace',
            realm: idp.realm || '',
            url: idp.url || '',
            clientId: idp.clientId || '',
        };
    }

    /**
     * Dynamically resolves the Keycloak realm and branding theme:
     * 1. Checks sessionStorage cache (persisted until sign out)
     * 2. If not in cache, calls GET /api/config (or /api/config?tenant=<slug> if slug is present)
     * 3. Realm comes from the API (fallback to environment.idpConfig.realm)
     * 4. Theme & IDP configuration fallback to environment
     * 5. Applies theme to DOM, caches config in sessionStorage, and returns KeycloakConfig
     */
    static async getIdpConfig(): Promise<KeycloakConfig> {
        if (this.idpConfig) {
            return this.idpConfig;
        }

        // 1. Try reading from sessionStorage cache (valid until signout)
        const cached = this.getCachedAppConfig();
        if (cached && cached.realm) {
            this.appConfig = cached;
            this.applyTheme(cached);
            this.idpConfig = {
                url: cached.url || this.getIdpUrl(),
                realm: cached.realm,
                clientId: cached.clientId || this.getIdpClient(),
            };
            return this.idpConfig;
        }

        // 2. Fetch fresh config from /api/config
        const slug = this.resolveTenantSlug();
        const baseEndpoint = (environment as any).apiUrl ? `${(environment as any).apiUrl}/config` : '/api/config';
        const endpoint = slug ? `${baseEndpoint}?tenant=${encodeURIComponent(slug)}` : baseEndpoint;
        const defaults = this.getDefaultConfig();

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                },
            });

            if (response.ok) {
                let data: any = null;
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = text;
                    }
                }

                // Extract realm from API response with fallback to environment
                let resolvedRealm = '';
                if (typeof data === 'string' && data.trim()) {
                    resolvedRealm = data.trim().replace(/^["']|["']$/g, '');
                } else if (data && typeof data === 'object') {
                    const inner = data.data || data.idpConfig || data.config || data;
                    if (typeof inner === 'string') {
                        resolvedRealm = inner.trim().replace(/^["']|["']$/g, '');
                    } else if (inner && typeof inner === 'object') {
                        resolvedRealm = (inner.realm || inner.realmName || inner['realm-name'] || inner.idpRealm || inner.name || '').toString().trim();
                    }
                }

                if (!resolvedRealm) {
                    resolvedRealm = this.getIdpRealm();
                }

                // url and clientId come from environment unless API explicitly provides them
                const url = (data?.url || this.getIdpUrl()).toString().trim();
                const clientId = (data?.clientId || data?.resource || this.getIdpClient()).toString().trim();

                const loadedConfig: AppConfig = {
                    primaryColor: data?.primaryColor || defaults.primaryColor,
                    accentColor: data?.accentColor || defaults.accentColor,
                    tagline: data?.tagline ?? defaults.tagline,
                    bannerUrl: data?.bannerUrl ?? defaults.bannerUrl,
                    logoUrl: data?.logoUrl ?? defaults.logoUrl,
                    faviconUrl: data?.faviconUrl ?? defaults.faviconUrl,
                    customCssEnabled: data?.customCssEnabled !== undefined ? Boolean(data.customCssEnabled) : defaults.customCssEnabled,
                    themePreset: data?.themePreset || defaults.themePreset,
                    ssoProvider: data?.ssoProvider || defaults.ssoProvider,
                    realm: resolvedRealm,
                    url: url,
                    clientId: clientId,
                };

                this.appConfig = loadedConfig;
                this.setCachedAppConfig(loadedConfig);
                this.applyTheme(loadedConfig);

                this.idpConfig = {
                    url: loadedConfig.url,
                    realm: loadedConfig.realm,
                    clientId: loadedConfig.clientId,
                };

                return this.idpConfig;
            }
        } catch (error) {
            // Fall back cleanly to environment defaults
        }

        // 3. Fallback resolution if API is unreachable
        const fallbackConfig: AppConfig = {
            ...defaults,
            realm: this.getIdpRealm(),
            url: this.getIdpUrl(),
            clientId: this.getIdpClient(),
        };

        this.appConfig = fallbackConfig;
        this.applyTheme(fallbackConfig);

        this.idpConfig = {
            url: fallbackConfig.url,
            realm: fallbackConfig.realm,
            clientId: fallbackConfig.clientId,
        };

        return this.idpConfig;
    }

    /**
     * Returns the currently active AppConfig (branding, colors, realm)
     */
    static getAppConfig(): AppConfig | null {
        if (!this.appConfig) {
            this.appConfig = this.getCachedAppConfig() || this.getDefaultConfig();
        }
        return this.appConfig;
    }

    /**
     * Clears all cached IDP and theme configuration, as well as any stored Keycloak session tokens.
     * Must be called upon user sign out so the next load performs a new /api/config call.
     */
    static clearConfig(): void {
        this.idpConfig = null;
        this.appConfig = null;
        if (typeof window !== 'undefined') {
            try {
                if (window.sessionStorage) {
                    sessionStorage.removeItem(this.STORAGE_KEY);
                    sessionStorage.removeItem('kc-token');
                    sessionStorage.removeItem('kc-refreshToken');
                    sessionStorage.removeItem('kc-idToken');
                    // Remove all keys related to OAuth state or Keycloak
                    for (let i = sessionStorage.length - 1; i >= 0; i--) {
                        const key = sessionStorage.key(i);
                        if (key && (key.startsWith('kc-') || key.startsWith('oauth-') || key === this.STORAGE_KEY)) {
                            sessionStorage.removeItem(key);
                        }
                    }
                }
                if (window.localStorage) {
                    localStorage.removeItem(this.STORAGE_KEY);
                }
            } catch (e) {
                // Silently handle storage clearance errors
            }
        }
    }

    /**
     * Applies theme CSS variables, gradients, theme preset classes, and favicon to document.
     */
    static applyTheme(config: Partial<AppConfig>): void {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const defaults = this.getDefaultConfig();

        const primary = (config.primaryColor && config.primaryColor.startsWith('#')) ? config.primaryColor : defaults.primaryColor;
        const accent = (config.accentColor && config.accentColor.startsWith('#')) ? config.accentColor : defaults.accentColor;

        root.style.setProperty('--tenant-primary', primary);
        root.style.setProperty('--brand-primary', primary);
        root.style.setProperty('--tenant-accent', accent);
        root.style.setProperty('--brand-secondary', accent);
        root.style.setProperty('--tenant-gradient', `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`);

        if (config.themePreset === 'glassmorphism') {
            root.classList.add('theme-glassmorphism');
        } else {
            root.classList.remove('theme-glassmorphism');
        }

        const favicon = config.faviconUrl || defaults.faviconUrl;
        if (favicon) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'shortcut icon';
                document.head.appendChild(link);
            }
            link.href = favicon;
        }
    }

    private static getCachedAppConfig(): AppConfig | null {
        if (typeof window === 'undefined' || !window.sessionStorage) return null;
        try {
            const raw = sessionStorage.getItem(this.STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.realm) {
                this.clearConfig();
                return null;
            }
            return parsed;
        } catch (e) {
            return null;
        }
    }

    private static setCachedAppConfig(config: AppConfig): void {
        if (typeof window === 'undefined' || !window.sessionStorage) return;
        try {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            // Silently ignore storage quota errors
        }
    }

    static resolveTenantSlug(): string {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        // 1. Standard search query parameter: ?tenant=tenant1
        const params = new URLSearchParams(window.location.search);
        const queryTenant = params.get('tenant');
        if (queryTenant) return queryTenant;

        // 2. Hash location query parameter: #/route?tenant=tenant1
        if (window.location.hash && window.location.hash.includes('?')) {
            const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
            const hashTenant = hashParams.get('tenant');
            if (hashTenant) return hashTenant;
        }

        // 3. Path prefix: /t/tenant1
        const match = pathname.match(/^\/t\/([^\/]+)/);
        if (match) return match[1];

        // 4. Subdomain: tenant1.example.com
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            const parts = hostname.split('.');
            if (parts.length >= 2 && parts[0] !== 'www') {
                return parts[0];
            }
        }

        return '';
    }

    static getIdpUrl(): string {
        const metaUrl = document.querySelector('meta[name=idp-url]')?.getAttribute('content');
        return metaUrl || environment.idpConfig.url || '';
    }

    static getIdpRealm(): string {
        if (this.appConfig?.realm) {
            return this.appConfig.realm;
        }
        if (this.idpConfig && 'realm' in this.idpConfig && typeof (this.idpConfig as any).realm === 'string') {
            return (this.idpConfig as any).realm;
        }
        const metaRealm = document.querySelector('meta[name=idp-realm]')?.getAttribute('content');
        return metaRealm || environment.idpConfig.realm || '';
    }

    static getIdpClient(): string {
        if (this.appConfig?.clientId) {
            return this.appConfig.clientId;
        }
        if (this.idpConfig && 'clientId' in this.idpConfig && typeof (this.idpConfig as any).clientId === 'string') {
            return (this.idpConfig as any).clientId;
        }
        const metaClient = document.querySelector('meta[name=idp-client]')?.getAttribute('content');
        return metaClient || environment.idpConfig.clientId || '';
    }
}
