# Login Branding & Authentication Experience API Documentation

This document describes the REST API endpoints and data models for managing the **Login Branding & Authentication Experience** in the LMS platform.

---

## 1. Overview & Architecture

The Login Branding API provides programmatic access to configure the visual identity, authentication methods, layout presets, announcement callouts, legal links, and custom scoped CSS for the LMS login and authentication pages (Sign-In, MFA Verification, SSO Redirect, and Password Reset).

- **Base Path:** `/api/login-branding`
- **Content-Type:** `application/json; charset=utf-8`
- **Authentication:** Bearer token (`Authorization: Bearer <token>`) or LMS Admin Session Cookie.

---

## 2. Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/login-branding` | Retrieve current branding configuration (supports `?draft=true` query param). |
| `PUT` | `/api/login-branding` | Save draft or update branding configuration. |
| `POST` | `/api/login-branding/publish` | Publish the current draft configuration to production live state. |
| `POST` | `/api/login-branding/reset` | Reset configuration back to system default theme and layout. |
| `PATCH` | `/api/login-branding/announcement` | Fast-update or toggle the announcement callout banner. |

---

## 3. Endpoint Details

### 3.1 Get Branding Configuration
Retrieves the published or draft branding configuration.

- **URL:** `GET /api/login-branding`
- **Query Parameters:**
  - `draft` (boolean, optional, default: `false`): When `true`, returns the pending draft changes instead of the live published version.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "organizationName": "BRAC International",
    "primaryColor": "#1d4ed8",
    "tenantColor": "#1d4ed8",
    "logoUrl": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300&auto=format&fit=crop&q=80",
    "logoWidth": 140,
    "logoHeight": 44,
    "logoShape": "original",
    "faviconUrl": "",
    "layout": "split_left",
    "authCardPosition": "left",
    "authCardAlignment": "center",
    "authCardCornerRadius": 16,
    "authCardElevation": "medium",
    "authCardBackgroundOpacity": 100,
    "authCardBlur": 0,
    "primaryFont": "Plus Jakarta Sans",
    "headingFont": "Plus Jakarta Sans",
    "fontSizeScale": "normal",
    "announcementBanner": {
      "enabled": true,
      "text": "Scheduled system maintenance on Sunday at 02:00 UTC. SSO logins will remain uninterrupted.",
      "type": "info",
      "style": "floating_pill",
      "dismissible": true
    },
    "customCssOverrides": [
      {
        "elementId": "submit_button",
        "customCss": "box-shadow: 0 4px 14px 0 rgba(29, 78, 216, 0.39);"
      }
    ],
    "privacyPolicyUrl": "https://brac.net/privacy-policy",
    "termsOfServiceUrl": "https://brac.net/terms",
    "copyrightText": "© 2026 BRAC. All Rights Reserved.",
    "updatedAt": "2026-09-14T08:30:00.000Z"
  }
}
```

---

### 3.2 Save / Update Branding Configuration (Draft)
Updates the draft branding configuration.

- **URL:** `PUT /api/login-branding`
- **Headers:** `Content-Type: application/json`
- **Request Body:** Partial or complete `LoginBrandingConfig` object.
```json
{
  "organizationName": "BRAC University LMS",
  "primaryColor": "#0284c7",
  "layout": "split_right",
  "announcementBanner": {
    "enabled": true,
    "text": "Mid-term examination schedule has been posted.",
    "type": "info",
    "style": "floating_pill",
    "dismissible": true
  }
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login branding draft saved successfully.",
  "data": { ... }
}
```
- **Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed: primaryColor must be a valid 6-character hex color code."
}
```

---

### 3.3 Publish Draft Configuration
Promotes the saved draft configuration to become the live configuration displayed on user-facing login pages.

- **URL:** `POST /api/login-branding/publish`
- **Headers:** `Content-Type: application/json`
- **Request Body (Optional):** You may pass an updated configuration object directly in the body to save and publish in a single atomic operation:
```json
{
  "announcementBanner": {
    "enabled": true,
    "text": "Campus portal upgrade completed successfully.",
    "type": "success",
    "style": "floating_pill",
    "dismissible": true
  }
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login branding published successfully.",
  "data": { ... }
}
```

---

### 3.4 Reset to Default Branding
Resets both draft and live configurations to the system default template.

- **URL:** `POST /api/login-branding/reset`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Branding configuration reset to default.",
  "data": { ... }
}
```

---

### 3.5 Fast Update Announcement Callout
Allows operators or automated health check monitors to update the announcement banner without touching the rest of the branding configuration.

- **URL:** `PATCH /api/login-branding/announcement`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "enabled": true,
  "text": "Scheduled system maintenance on Sunday at 02:00 UTC.",
  "type": "warning",
  "style": "floating_pill",
  "dismissible": true
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Announcement banner updated.",
  "announcementBanner": {
    "enabled": true,
    "text": "Scheduled system maintenance on Sunday at 02:00 UTC.",
    "type": "warning",
    "style": "floating_pill",
    "dismissible": true
  }
}
```

---

## 4. TypeScript Data Models Reference

```typescript
export interface LoginBrandingConfig {
  // Organization Identity
  organizationName: string;
  tagline?: string;
  logoUrl: string;
  darkLogoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoShape?: 'original' | 'rounded' | 'circle' | 'square';
  faviconUrl?: string;

  // Visual Theme & Colors
  primaryColor: string;
  tenantColor: string;
  accentColor?: string;
  backgroundColor?: string;
  darkBackgroundColor?: string;

  // Typography
  primaryFont: string;
  headingFont?: string;
  fontSizeScale?: 'compact' | 'normal' | 'comfortable';

  // Layout & Form Card Placement
  layout: 'split_left' | 'split_right' | 'centered_card' | 'minimal_full' | 'modern_bento' | 'floating_dual';
  authCardPosition: 'left' | 'center' | 'right';
  authCardAlignment: 'center' | 'top' | 'bottom';
  authCardCornerRadius: number; // in pixels (e.g. 12, 16, 24)
  authCardElevation: 'none' | 'subtle' | 'medium' | 'high' | 'floating';
  authCardBackgroundOpacity: number; // 0 - 100
  authCardBlur: number; // backdrop-blur in pixels

  // Announcement Banner
  announcementBanner?: {
    enabled: boolean;
    text: string;
    type: 'info' | 'warning' | 'alert' | 'success' | 'security';
    style: 'floating_pill' | 'top_bar' | 'card_embedded';
    dismissible: boolean;
  };

  // Hero & Side Panel (for split layouts)
  sidePanel?: {
    badgeText?: string;
    badgeIcon?: string;
    theme?: 'glass' | 'dark' | 'light' | 'gradient';
    headline?: string;
    bullets?: Array<{
      id: string;
      icon: string;
      title: string;
      description: string;
    }>;
    showSecurityShield?: boolean;
  };

  // Scoped Custom CSS Overrides
  customCssOverrides?: Array<{
    elementId: string;
    customCss: string;
  }>;

  // Legal & Localization
  copyrightText?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  showLanguagePicker?: boolean;
  defaultLanguage?: string;

  // Metadata
  updatedAt?: string;
  publishedAt?: string;
}
```

---

## 5. Client Integration Example (TypeScript / Angular)

```typescript
// Example: Saving and Publishing Login Branding in an Angular Service
@Injectable({ providedIn: 'root' })
export class LoginBrandingApiService {
  private readonly baseUrl = '/api/login-branding';

  async getConfig(isDraft = false): Promise<LoginBrandingConfig> {
    const res = await fetch(`${this.baseUrl}?draft=${isDraft}`);
    const body = await res.json();
    return body.data;
  }

  async saveDraft(config: Partial<LoginBrandingConfig>): Promise<void> {
    const res = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to save draft');
  }

  async publish(config?: Partial<LoginBrandingConfig>): Promise<void> {
    const res = await fetch(`${this.baseUrl}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config || {})
    });
    if (!res.ok) throw new Error('Failed to publish');
  }

  async setAnnouncement(announcement: {
    enabled: boolean;
    text: string;
    type: string;
    style: string;
    dismissible: boolean;
  }): Promise<void> {
    const res = await fetch(`${this.baseUrl}/announcement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcement)
    });
    if (!res.ok) throw new Error('Failed to update announcement');
  }
}
```
