# OneLMS — Public Landing Page & Configuration Panel

**Frontend Instruction · Version 1.0**
**Actors:** Public visitor (anonymous) · LMS Admin
**Scope:** Part A — the public landing page as a visitor sees it. Part B — the admin panel that configures it.

**Out of scope, documented separately:** sign-up, log-in, BRAC PIN registration, enrolment requests, and everything behind the authentication gate. The header carries **Log In** and **Sign Up** entry points; this document specifies only **where they sit**, never what they do.

**Reference standard:** the layout follows the conventions of a mature public course platform — sticky header with search, hero, trust strip, category browse, card grids, value propositions, credential showcase, testimonials, FAQ, closing call to action, multi-column footer. Visitors arrive with those conventions already learned; the page should not teach them new ones.

---

## 0. Governing Principles

**1. Every section is configurable, enabled and ordered by the admin.** The frontend renders whatever the published configuration says, in the order it says. Nothing is hard-coded except the header and footer.

**2. The page is anonymous and cacheable.** It renders without a session. Two things change independently of the cache — **enrolment availability** and **live figures** — and both are fetched separately and hydrated client-side.

**3. Tenant-scoped.** Everything on the page belongs to one LMS, resolved from the domain. There is no cross-tenant content anywhere on this surface.

**4. Degrade quietly.** A section with no content does not render. A disabled section leaves no gap. A missing image falls back to a themed placeholder, never a broken icon.

---

# PART A — THE PUBLIC LANDING PAGE

## 1. Page Structure

```
┌────────────────────────────────────────────────┐
│  HEADER (fixed)                                │  always present
├────────────────────────────────────────────────┤
│  HERO                                          │  ┐
│  TRUST STRIP                                   │  │
│  BROWSE BY CATEGORY                            │  │
│  FEATURED PROGRAMMES                           │  │  configurable:
│  FEATURED COURSES                              │  │  enable / disable
│  WHY THIS LMS                                  │  │  and reorder
│  HOW IT WORKS                                  │  │
│  CREDENTIALS YOU EARN                          │  │
│  IMPACT FIGURES                                │  │
│  TESTIMONIALS                                  │  │
│  FACILITATORS                                  │  │
│  ANNOUNCEMENTS                                 │  │
│  FAQ                                           │  │
│  CLOSING CALL TO ACTION                        │  │
│  CONTACT                                       │  ┘
├────────────────────────────────────────────────┤
│  FOOTER (fixed)                                │  always present
└────────────────────────────────────────────────┘
```

---

## 2. Header — fixed, always present

| Element | Behaviour |
|---|---|
| **Logo** | From theme config. Links to the landing page root. Height-constrained, aspect preserved |
| **Explore** | Dropdown of categories, built from the published category list. Hidden when Browse by Category is disabled |
| **Search** | Searches public programmes and courses within this LMS. Expands to full width on mobile |
| **Language switcher** | Shown only when more than one language is published |
| **Log In · Sign Up** | Right-aligned. Placement only — behaviour is specified elsewhere |

**Behaviour**

- Sticky on scroll. Transparent over a full-bleed hero, acquiring a solid background and shadow after ~80px of scroll.
- Mobile: logo, search icon and hamburger. Nav and auth entry points move into a slide-in drawer.
- Search opens a results overlay; it does not navigate away from the page until a result is chosen.
- Nav anchors are **derived from the enabled section list**. Never hard-code an anchor to a section the admin may have disabled.

---

## 3. Section Specifications

Each section below lists what the frontend renders. Fields marked ⚠️ are the ones most likely to break layout if unconstrained.

### 3.1 Hero

| Field | Type | Notes |
|---|---|---|
| Headline | Text | ⚠️ Cap at ~70 characters. Longer headlines must wrap, never truncate |
| Sub-headline | Text | ⚠️ Cap at ~160 characters |
| Background | Image or video | 16:9 minimum 1920×1080. Video muted, looping, with a static poster fallback |
| Overlay | Opacity value | Needed for text contrast over a photograph |
| Primary CTA | Label + target | Target is a plan, a category, or an anchor |
| Secondary CTA | Label + target | Optional |

- Full viewport width; height between 60vh and 80vh on desktop, auto on mobile.
- Text left-aligned on desktop, centred on mobile.
- **Contrast is a hard requirement.** An admin-supplied photograph can make white text unreadable — enforce the overlay and verify computed contrast at render.
- Video must not autoplay on a metered connection. Respect `prefers-reduced-motion` and fall back to the poster.

### 3.2 Trust Strip

| Field | Type |
|---|---|
| Section label | Text, e.g. *In partnership with* |
| Logos | Image list, each with name and optional link |

- A single horizontal row, greyscale by default, colour on hover.
- 6 logos desktop, 3 tablet, 2 mobile — scrolling horizontally beyond that.
- Uniform height, variable width, vertically centred. Logos arrive at wildly different aspect ratios.

### 3.3 Browse by Category

| Field | Type |
|---|---|
| Heading, intro | Text |
| Categories | Name, icon or image, short description, target |

- Grid: 4 columns desktop, 2 tablet, 1 mobile.
- Each tile shows a count of public items in that category; omit the count where it is zero rather than showing "0".

### 3.4 Featured Programmes

The most important commercial section on the page. Renders **Plan cards**.

**Plan card anatomy**

```
┌──────────────────────────────┐
│  [ cover image 16:9 ]        │
│  ┌──────────────┐            │
│  │ Enrolling    │ ← status   │
│  └──────────────┘            │
├──────────────────────────────┤
│  PROGRAMME · 12 months       │
│  Field Officer Development   │
│  Programme 2026              │
│  Build core field skills…    │
│                              │
│  Starts 01/01/2026           │
│  Certificate on completion   │
└──────────────────────────────┘
```

| Field | Source |
|---|---|
| Cover image | Plan public image; themed placeholder when absent |
| Type label | Static — *Programme* |
| Name | Plan name |
| Short description | ⚠️ Clamp to 2 lines. Cards must stay equal height |
| Duration | Derived from the plan timeline |
| Start date | `DD/MM/YYYY` |
| Credential | Shown where the plan awards one |
| **Availability badge** | **Fetched separately — see §4** |

- Grid: 3 columns desktop, 2 tablet, 1 mobile. Or a horizontal carousel where more than 6 are featured.
- Entire card is clickable. Equal heights per row regardless of description length.
- Admin chooses order; render exactly that order, never re-sort.

### 3.5 Featured Courses

Same grid mechanics, a lighter card: cover image, title, short description, duration or module count, category tag. No availability badge — courses are not capacity-constrained.

### 3.6 Why This LMS

| Field | Type |
|---|---|
| Heading, intro | Text |
| Value propositions | Icon, title, description — 3 to 6 items |

Grid: 3 columns desktop, 2 tablet, 1 mobile. Icons from a fixed platform set, not uploaded, so they stay visually consistent.

### 3.7 How It Works

| Field | Type |
|---|---|
| Heading | Text |
| Steps | Number, title, description, optional icon — 3 to 5 |

- Horizontal with connecting line on desktop; vertical stepper on mobile.
- Numbering is explicit here because the content genuinely is a sequence.

### 3.8 Credentials You Earn

| Field | Type |
|---|---|
| Heading, description | Text |
| Credential samples | Type (Badge / Certificate), sample artwork, title, description |

- **Sample artwork only.** Never render an issued credential bearing a real person's name.
- Certificates render as a bordered preview; badges as circular artwork.

### 3.9 Impact Figures

| Field | Type |
|---|---|
| Heading | Text |
| Figures | Label, value, optional prefix/suffix — up to 4 |

- Large numerals, equal columns, tabular figures so they align.
- Count-up animation on scroll into view, suppressed under `prefers-reduced-motion`.
- ⚠️ Where figures are configured as **live**, they are fetched separately (§4) and render as skeletons until resolved.

### 3.10 Testimonials

| Field | Type |
|---|---|
| Heading | Text |
| Testimonials | Quote, name, role, organisation, photo, optional programme |

- Carousel on mobile, 2–3 across on desktop.
- Photo optional — fall back to initials in a themed circle, never a generic avatar silhouette.
- ⚠️ Clamp quotes to ~280 characters.

### 3.11 Facilitators

| Field | Type |
|---|---|
| Heading, intro | Text |
| People | Name, photo, title, short bio, optional link |

- Grid: 4 columns desktop, 2 mobile. Square or 4:5 portrait images, uniformly cropped.
- Bio clamped to 3 lines with an expand control.

### 3.12 Announcements

| Field | Type |
|---|---|
| Heading | Text |
| Items | Title, summary, date, optional image, optional link |

- Latest first, limited to the configured count.
- Date in `DD/MM/YYYY`.
- The frontend must **not render expired items**, even if present in the payload.

### 3.13 FAQ

| Field | Type |
|---|---|
| Heading | Text |
| Items | Question, answer, optional group |

- Accordion, single-expand by default. First item may be expanded on load.
- Full keyboard support; `aria-expanded` maintained.
- Answers support basic formatting — paragraphs, lists, links. No raw HTML.

### 3.14 Closing Call to Action

| Field | Type |
|---|---|
| Headline, sub-headline | Text |
| Primary CTA | Label + target |
| Background | Colour from theme, or image |

Full-width band. The last thing a visitor reads before the footer.

### 3.15 Contact

| Field | Type |
|---|---|
| Heading | Text |
| Address, email, phone, office hours | Text |
| Map | Coordinates or embed toggle |

- Two columns desktop (details / map), stacked on mobile.
- Email and phone render as `mailto:` and `tel:` links.
- A map embed is a third-party request — it must be allowed by the tenant CSP, and should lazy-load behind a click-to-load placeholder.

### 3.16 Footer — fixed, always present

| Element | Content |
|---|---|
| Logo, short description | From theme and config |
| Link columns | Up to 4, each with heading and links |
| Social links | Platform icons |
| Legal | Privacy policy, terms, cookie preferences |
| Copyright | Auto year, LMS name |

---

## 4. Data That Bypasses the Cache

The page is cached at the edge, keyed by host. Two things must **not** be baked into that cache.

| Data | Why | How |
|---|---|---|
| **Plan availability badge** | Changes as enrolments land. A cached "12 seats left" is wrong within minutes | Single batched request for all visible plan IDs after first paint. Render a neutral skeleton until it resolves |
| **Live impact figures** | Change continuously where configured as live | Same batched call. Skeleton until resolved |

**Availability badge states**

| State | Label | Treatment |
|---|---|---|
| Open | `Enrolling now` | Positive |
| Closing soon | `Closing soon` | Attention |
| Full | `Fully booked` | Muted |
| Closed | `Enrolment closed` | Muted |
| Not started | `Opens DD/MM/YYYY` | Neutral |

- Never render the raw capacity number unless the admin has published it.
- **If the call fails, render no badge** — an omitted badge is harmless; a wrong one is not.

---

## 5. Cross-Cutting Frontend Requirements

### 5.1 Responsive

| Breakpoint | Width | Grid |
|---|---|---|
| Mobile | < 640px | 1 column, 16px gutters |
| Tablet | 640–1024px | 2 columns, 24px gutters |
| Desktop | 1024–1440px | 3–4 columns, 32px gutters |
| Wide | > 1440px | Content capped at 1280px, centred |

Mobile-first. Assume a mid-range Android on mobile data — that is the realistic visitor.

### 5.2 Theming

- Colours, typography, button style and corner radius come from the published theme as **CSS custom properties**, applied at the document root.
- No hard-coded colours anywhere in section components.
- The theme must support both light surfaces and the dark bands used by the hero and closing CTA.

### 5.3 Performance

- Hero image preloaded; everything below the fold lazy-loaded.
- Responsive `srcset` for every image slot; modern formats with fallbacks.
- Carousels and the map loaded only when needed.
- Fonts preloaded with `font-display: swap`.
- Target: Largest Contentful Paint under 2.5s on a 4G connection.

### 5.4 Accessibility

- Landmark regions, one `h1` (the hero headline), heading order preserved as sections reorder.
- Skip-to-content link.
- All interactive elements keyboard reachable with visible focus.
- Carousels: arrow-key navigation, pause control, never auto-advancing without one.
- Alt text per image slot, authored by the admin; a decorative-image toggle for backgrounds.
- Target WCAG 2.1 AA.

### 5.5 Loading and Error States

| Situation | Render |
|---|---|
| Initial load | Skeletons matching final layout, to avoid shift |
| Availability call fails | No badge, card still shown |
| Live figures fail | Section hidden, not zeroes |
| Image fails | Themed placeholder |
| Section has no items | Section omitted entirely |
| Entire config fails | Minimal fallback — logo, LMS name, contact, auth entry points |

### 5.6 Localisation

- Content keyed by locale; sections render in the active language.
- Switching language preserves scroll position.
- Numerals and dates follow the locale; dates remain `DD/MM/YYYY`.
- Mixed Bangla and English within a page must not break line-height or font fallback.

---

# PART B — ADMIN CONFIGURATION PANEL

## 6. Panel Layout

```
┌──────────────┬───────────────────────────┬──────────────┐
│ SECTION LIST │   SECTION EDITOR          │   PREVIEW    │
│              │                           │              │
│ ☰ Hero    ●  │  Headline                 │ [live        │
│ ☰ Trust   ●  │  [________________]       │  rendering   │
│ ☰ Browse  ○  │                           │  of the      │
│ ☰ Plans   ●  │  Sub-headline             │  draft]      │
│ ☰ Courses ●  │  [________________]       │              │
│ ☰ Why     ○  │                           │  ▣ desktop   │
│ ☰ How     ●  │  Background image         │  ▢ tablet    │
│   …          │  [ upload ]               │  ▢ mobile    │
│              │                           │              │
│ + Add        │  Primary CTA              │              │
├──────────────┴───────────────────────────┴──────────────┤
│ Draft · last saved 14:32 · 2 issues   [Preview][Publish] │
└──────────────────────────────────────────────────────────┘
```

Three panes plus a persistent publish bar. On narrower screens the preview collapses behind a toggle.

---

## 7. Section List

| Element | Behaviour |
|---|---|
| **Drag handle** | Reorders sections. Header and footer are pinned and cannot move |
| **Enable toggle** | Disabling hides the section from the public page but **retains its content** |
| **Status dot** | ● complete · ◐ incomplete · ○ disabled · ▲ has a validation issue |
| **Section name** | Selects it into the editor |
| **Item count** | For list sections — *4 categories*, *6 plans* |
| **Add section** | Lists section types not yet in use. A type can be used once |

- Reorder is a single write of the ordered array, not N updates.
- Reordering must update the preview immediately.
- Disabling a section that other content references — a nav anchor, a hero CTA target — must warn rather than silently break the link.

---

## 8. Section Editor

The editor is generated from the section's field schema. Field types:

| Type | Control | Validation |
|---|---|---|
| Short text | Single line with live character counter | Max length enforced, with a warning before the cap |
| Long text | Block editor — paragraphs, lists, links, bold, italic. **No raw HTML** | Max length |
| Image | Upload with crop to the slot's aspect ratio | Type, size, minimum dimensions |
| Icon | Picker from the fixed platform set | — |
| Colour | Swatch picker constrained to the theme palette | Contrast checked |
| Date | Date picker, `DD/MM/YYYY` | Valid date |
| Link target | Selector — plan, course, category, section anchor, or external URL | Internal targets validated as live |
| Item list | Repeatable sub-form, drag-reorderable, with add and remove | Min and max item count per section |
| Entity picker | Searchable selector of live plans or courses, with chosen order | Only publicly-listed items selectable |

**Editor behaviour**

- Autosave to draft on blur, with the last-saved time in the publish bar.
- Unsaved-change guard on navigation away.
- Per-field inline validation, not only on publish.
- An **alt text** field accompanies every image slot, with a *decorative* checkbox for backgrounds.
- Where multiple languages are published, a language tab sits at the top of the editor, and the status dot reflects completeness **per language**.

---

## 9. Media Handling

| Requirement | Detail |
|---|---|
| Accepted types | JPEG, PNG, WebP, SVG (logos only) |
| Size cap | Per slot, surfaced before upload begins |
| Crop | Enforced to the slot's aspect ratio in the upload dialogue |
| Processing | Server-side re-encode, responsive variants generated, **EXIF stripped** |
| Preview | Shown at the true rendered aspect ratio, not a generic thumbnail |
| Replace / remove | Both available; removing reverts to the themed placeholder |

An admin uploading a 6MB phone photograph into a hero slot is the normal case, not the exception. Guidance must appear **before** upload, and processing must happen server-side regardless.

---

## 10. Preview

| Control | Behaviour |
|---|---|
| Viewport | Desktop · Tablet · Mobile |
| Language | Where multiple are published |
| Scroll sync | Selecting a section in the list scrolls the preview to it |
| Live update | Reflects the draft as it is edited, within a second |
| Open in new tab | Authenticated, signed, expiring URL. Must emit `noindex` |

The preview renders the **draft**. The live site is never edited in place.

---

## 11. Publish

**Publish bar**

| Element | Behaviour |
|---|---|
| State | `Draft — unpublished changes` · `Published` · `Publishing…` |
| Last saved | Draft autosave time |
| Last published | Timestamp and who published |
| Issue count | Click to open the validation list |
| **Preview** | Opens the preview |
| **Publish** | Opens a confirmation summarising what changed |
| **Discard draft** | Reverts to the published version, with confirmation |
| **Version history** | Previous versions with rollback |

**Validation before publish**

| Severity | Rule |
|---|---|
| **Blocking** | An enabled section has empty required fields |
| **Blocking** | A required image is missing from an enabled section |
| **Blocking** | A link target points at a deleted, archived or unpublished item |
| **Blocking** | A list section is below its minimum item count |
| **Blocking** | Theme colours fail contrast against their surface |
| **Blocking** | An image slot has no alt text and is not marked decorative |
| **Warning** | A section is enabled but empty in one published language |
| **Warning** | A featured plan has closed enrolment |
| **Warning** | An announcement has already expired |
| **Warning** | No sections enabled beyond hero and contact |

Each issue names the section and field and links straight to it.

**On publish**

- The version increments and becomes immutable.
- The public cache for this tenant is purged.
- The result is live within seconds; confirm with the live URL, not just a success toast.
- **Rollback** restores a previous version as a new version — history is never rewritten.

---

## 12. Presets

A new LMS starts from a **preset**, not an empty page.

| Preset | Sections enabled |
|---|---|
| **Standard** | Hero · Browse by Category · Featured Programmes · How It Works · Credentials · FAQ · Contact |
| **Programme-led** | Hero · Featured Programmes · Why This LMS · Credentials · Testimonials · Closing CTA · Contact |
| **Minimal** | Hero · Featured Programmes · Contact |

Each preset ships with placeholder copy and themed placeholder imagery, so the page is coherent on day one and the admin edits rather than composes. An admin facing fifteen empty switches will produce a worse page than one adjusting a sensible default.

---

## 13. Open Points

1. **Search scope** — does header search cover programmes and courses only, or also categories and announcements? Does it search descriptions or titles alone?
2. **Impact figures** — admin-typed or live from data? Determines whether §4 fetches them.
3. **Category source** — a managed taxonomy, or free tags from courses and plans?
4. **Capacity visibility** — may an admin publish the raw remaining-seats number, or only the badge state?
5. **Section reuse** — may a type appear twice, for example two Featured Programmes blocks with different selections? Current assumption: once only.
6. **Announcement expiry** — does an expired item disappear automatically, or stay until removed?
7. **Custom section** — should a free-form block (heading, text, image, CTA) exist for content no preset section covers?
8. **Preview sharing** — may an admin share a preview link with a colleague who lacks an admin account?
9. **Facilitator and testimonial consent** — where is consent recorded before a name and photo are published?
10. **Draft collaboration** — what happens when two admins edit the same draft simultaneously? Last-write-wins, locking, or a merge warning?

---

*End of instruction. Part A specifies the anonymous public surface; Part B specifies the panel that configures it. Authentication, sign-up and enrolment flows are documented separately — this document specifies only the placement of their entry points in the header.*
