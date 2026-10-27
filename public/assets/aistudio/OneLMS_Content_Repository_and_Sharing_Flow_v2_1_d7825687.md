# OneLMS — Content Repository & Sharing (Build Specification, v2)

> **Purpose:** This is the build-ready specification of the *Content Repository*: creating learning and assessment items, setting how each item is shared, browsing the Repository Grid, and managing an item's lifecycle. It is the single source for the Content Repository screens. Field tables, dropdown values, grid columns and status transitions below are meant to be lifted directly into the build.
>
> **What changed in v2:** assessments are now **authored inside the Content Repository** (the whole former *Create Assessment* wizard moves here). The separate Assessment Bank is removed. The Assessments & Exams module keeps **Results & Analytics only**. See Section 5 for how the Course and Plan screens use repository assessments, and Section 7 for the older documents this replaces.
>
> **Hierarchy context:** the Content Repository is a module inside a single LMS, at the same level as Plan Management and Course Management — not nested inside either. An item is created once, inside one LMS, and is then *referenced* (never copied) by Courses and Plans, in this LMS or, if shared, in other LMS under the same Organization. This flow runs inside one fixed LMS workspace; the LMS is never selectable here.

---

## 0. Quick Reference

- **Actor:** any user with repository permissions in this LMS (the exact role list is an open item — Section 8).
- **User story:** as a user with repository permissions, I create a learning or assessment item, decide how it is shared, and manage it through its lifecycle from the Repository Grid, which also shows content shared in from other LMS, clearly labelled as not mine.
- **Entry:** main menu → **Content Repository** → **Repository Grid**; **Create Repository** is the grid's top-right action.
- **One repository for everything:** learning materials, assessments and surveys are all repository items. There is no second bank or library.
- **Sharing is decided per item, once** — at creation or edit time, never re-decided at the Course or Plan level.
- **Sharing modes:** Private, Organization-wide, Custom Share (named LMS list).
- **Default grid sort:** Created On, latest first. **Date format:** `DD/MM/YYYY`.
- **Architecture note (no screen):** published content sits in one shared backend store, which is what lets another LMS's grid show it. Nothing in the UI should render a "Central Repository" section or menu item.

**Lifecycle — the same for learning and assessment items:**

| Status | Editable? | Learner availability | Actions available |
|---|---|---|---|
| **Draft** | Fully editable | No | View, Continue Editing, Edit Sharing |
| **Scheduled** | Editable | Not yet (publish date not reached) | View, Edit Sharing, Update Expiry Date |
| **Active** | Core content locked (see §4) | Yes | View, Edit Sharing, Update Expiry Date, Deactivate |
| **Inactive** | Core content locked | No | View, Activate, Edit Sharing |
| **Expired** | Locked | No | View only |

**Transitions:** Draft → Scheduled/Active (on Publish) · Scheduled → Active (automatic, at publish date) · Active → Expired (automatic, at expiry date) · Active ⇄ Inactive (manual).

---

## 1. Navigation

Main menu → **Content Repository**, independent of Plan Management and Course Management. Under it:

- **Repository Grid** — default landing view (Section 3).
- **Create Repository** — from the grid's top-right action (Section 2).

> Do not nest this module under any Plan or Course menu. Do not add a "Create Assessment" entry anywhere else — assessments are created from here (Create → Assessment).

---

## 2. Create Repository — Step by Step

The flow has five steps. Learning items and assessment items share Steps 1, 2, 4 and 5; Step 3 differs by family.

### 2.1 Step 1 — Item Details (all items)

| Field | Type | Required | Notes |
|---|---|---|---|
| Content Title (English) | Text, max 199 chars | Yes | For assessments this is the assessment title. |
| Content Title (Bangla) | Text, max 199 chars | Optional | |
| Author(s) | Multi-select from Instructor Management / Creator Management | Yes | Attribution only — see §2.6. |
| Publish Date | Date picker | Yes | Drives Draft → Scheduled/Active. |
| Expiry | Date picker **or** "No Expiry" toggle | Yes (one of the two) | Drives Active → Expired. |
| Description | Rich text | Optional | |
| Thumbnail / Cover Image | Image upload | Optional | |
| Alt Text | Text | Optional | Shown only if a thumbnail is set. |
| Tags | Free tags | Optional | Used for search and reuse. Associated skill may be added where applicable. |

### 2.2 Step 2 — Content Family & Type (all items)

| Family | Content Type | How it is added | What the repository stores |
|---|---|---|---|
| Learning | Video | Upload a file, or embed a URL (YouTube) | The file, or only the URL reference and metadata |
| Learning | Audio | Upload a file | The file and metadata |
| Learning | PDF / Document | Upload a file | The file and metadata |
| Learning | Slides / Presentation | Upload `.ppt`, `.pptx` or `.odp` | The file, slide count and metadata |
| Learning | Reading | Author in the rich-text editor | The formatted content and embedded images |
| Learning | Recorded Class | Upload a recorded session, or link from a recording platform | The file or URL reference, plus session metadata |
| Learning | Book / E-book | Upload a file (e.g. PDF, EPUB) | The file and metadata |
| Learning | External Link | Add a URL | Only the URL and metadata — no file stored |
| **Assessment** | **Quiz** | Built in the assessment builder (§2.3b) | The assessment and its questions |
| **Assessment** | **Exam** | Same builder | Same |
| **Assessment** | **Assignment** | Same builder | Same |
| **Assessment** | **Pre-Test** | Same builder | Same |
| **Assessment** | **Post-Test** | Same builder | Same |
| **Assessment** | **Survey** | Same builder (unscored) | The survey and its questions |

> The Assessment type list follows the current Create Assessment options and may be extended; the types above are the ones the Plan pickers depend on (§5.2).

### 2.3 Step 3 — Content Setup by Family

**3a. Learning types** — the type-specific upload / URL / editor screen per the table above. Per-type field validation is in the Content Repository solution doc.

**3b. Assessment types** — the former *Create Assessment* wizard, moved here unchanged in its four parts. Title, authors, publish and expiry dates, description and tags are already captured in Step 1 and are not asked again.

| Part | What it holds |
|---|---|
| **1. Basic Info** | Assessment Type (already chosen in Step 2), Scoring Mode (Point-Scored & Graded; a Survey is unscored), trainee instructions (rich text), category tags. **No "Responsible Instructor" field** — see §2.6. |
| **2. Scoring & Rules** | Pass mark (%), number of attempts allowed, and the other scoring and rule options already in the prototype. Not re-specified here; rule behaviour is confirmed with the backend team and written in the SRS. |
| **3. Question Studio** | Add questions one by one (fields below). |
| **4. Preview** | Read-only preview of the learner view, with the derived grading label (§2.4). |

**Question Studio — per-question fields**

| Field | Notes |
|---|---|
| Question type | Single choice, Multiple choice, Fill in the blank, Q&A, File upload |
| Question text | Rich text |
| Options / answer key | For choice and fill-in-the-blank types |
| Difficulty | Easy, Medium, Hard (levels to be confirmed in the SRS) |
| Points | Numeric. Surveys carry no points |
| Grading mode | Auto or Manual, set per question. Choice and fill-in-the-blank are normally Auto; Q&A and File upload are normally Manual |

A **Survey** has questions only: no points, no answer key, no pass mark, no grading.

### 2.4 Grading label (derived, assessments only)

Every assessment shows a label computed from its questions — nobody sets it by hand:

- **Auto** — every question is Auto-graded.
- **Needs manual grading** — at least one question is Manual.
- Surveys show no label.

The label appears on the assessment in the Repository Grid, in the Preview, and wherever the assessment is picked (Course builder, Plan pickers).

### 2.5 Step 4 — Sharing Mode (all items)

This is the **only** place a sharing decision is made for an item.

| Mode | Who can use the item | Extra field |
|---|---|---|
| **Private** | Only this LMS | None |
| **Organization-wide** | Every LMS under the same Organization that has its own sharing switch on (Section 7). Sharing never crosses Organizations. | None |
| **Custom Share** | This LMS plus a named list of other LMS | Multi-select of LMS under the same Organization; editable later from Edit Sharing |

> If a named LMS in a Custom Share list has its own Discover switch off, it still does **not** see the item — the receiving LMS's switch always wins. Do not imply guaranteed delivery; show a short note when the selected LMS has Discover off, if that is knowable at selection time.

### 2.6 Author vs instructor — keep these separate

- **Author(s)** is attribution: who created the item. It is chosen in Step 1 from Instructor Management or Creator Management (author only, instructor, or both, as in the course rules). It is shown as **"Author"** on the grid, on the item and on assessment cards.
- **Instructors are not tagged on content.** Responsibility for teaching and manual grading comes from the instructor tagged on a course layer above the content, or from the class instructor in the Plan. The assessment never decides who grades.

### 2.7 Step 5 — Save as Draft or Publish

- **Save as Draft** — stored, not visible elsewhere, editable later via **Continue Editing**.
- **Publish** — moves to Scheduled (publish date in the future) or Active (today or past).

---

## 3. Repository Grid

### 3.1 Columns

| Column | What it shows |
|---|---|
| Repository Name | The content title. Clicking opens the item's view page. |
| Content Family | Learning or Assessment. |
| Content Type | Any value from §2.2. |
| Grading | Assessments only: **Auto** or **Needs manual grading** (§2.4). Blank for learning items and surveys. |
| Source | "This LMS" for items created here; otherwise the originating LMS, for shared-in items. |
| Created On | Creation date. |
| Publish Date | Scheduled or actual availability date. |
| Expiry Date | Expiry date, or "No Expiry". |
| Status | Draft, Scheduled, Active, Inactive or Expired. |
| Action | Actions allowed for this user, status and ownership (§3.3). |

> Shared-in content appears in this same grid, distinguished by the Source column — not in a separate view.

### 3.2 Search, sort, filter and Question Bank view

| Feature | Behaviour |
|---|---|
| Search | By Repository Name. |
| Sort | By Repository Name, Created On, Publish Date or Expiry Date. |
| Filter | By Content Family, Content Type, Status, Source, Grading, Publish Date and Expiry Date. Filters combine with search. |
| **Question Bank view** | A quick filter (beside the Family filter) that shows only assessment items, so assessments and their questions can be browsed and reused. It is a view of the same list, not a separate store. Items can be narrowed by type and difficulty. |

### 3.3 Actions by status and ownership

| Action | Owner — Draft | Owner — Scheduled | Owner — Active | Owner — Inactive | Owner — Expired | Non-owner LMS (any status) |
|---|---|---|---|---|---|---|
| View | Yes | Yes | Yes | Yes | Yes | Yes |
| Continue Editing | Yes (Draft only) | — | — | — | — | — |
| Edit Sharing | — | Yes | Yes | Yes | — | — |
| Update Expiry Date | — | Yes | Yes | — | — | — |
| Activate / Deactivate | — | — | Deactivate | Activate | — | — |

> A non-owner LMS never sees Edit Sharing, Update Expiry Date or Activate/Deactivate, whatever the status.

---

## 4. Lifecycle, Editing and Un-sharing

**Statuses.** Only **Active** content is available to learners, in every LMS using it, including shared-in uses. A status change by the owning LMS applies instantly everywhere the item is used, because every LMS references the same record rather than a copy. There is no version pinning.

**Editing the actual material** (a video file, reading text, or an assessment's questions, points or answer key) — a **new repository item** is created; the existing one is never silently overwritten. Courses and Plans already using the old item keep using it until someone deliberately swaps in the new one. For assessments, results already recorded stay with the item they were taken on.

**Narrowing sharing, or removing one named LMS from Custom Share** — the affected LMS stops seeing the item for new use. Anything that already referenced it keeps working.

---

## 5. How Other Modules Use Repository Items

### 5.1 Course Management (Courses & Catalog)

- The course builder adds content only by attaching from the repository (the **Attach Content from Repository** pop-up), with two tabs: **Learning** and **Assessments**. There is no authoring of new content inside the course builder.
- Cards in the picker show the title, type, author and, for assessments, the Auto / Needs manual grading label.
- If an attached assessment needs manual grading, the course must have an instructor tagged on a layer above it, or publishing is blocked (the course rules own this behaviour; the label here is what feeds it).

### 5.2 Plan Management pickers

Plan components read from the repository, filtered by type. Only **Active** items appear.

| Plan picker | Shows |
|---|---|
| Pre-Test | Scored assessment types |
| Post-Test | Scored assessment types |
| Survey | Survey type |

Pre-Test, Post-Test and Survey keep their own pickers in the Plan; they do not have their own question store.

### 5.3 Assessments & Exams module

Keeps **Results & Analytics** only. It reads results for repository assessments. It has no create screen and no bank of its own.

---

## 6. Not Built in This Module

- **Results & Analytics screens**, manual-grading screens and the instructor grading view — documented separately (Assessments & Exams / instructor work).
- **Plan-level grading policy** (grading type, pass mark, weights) — Plan Management.
- **Rules and engine behaviour** (retake policy, attendance, who grades which course) — confirmed with the backend team and written in the SRS.

---

## 7. Related Settings and Older Documents

**Settings that affect the Repository Grid but live in other modules — do not build them here.**

| Setting | Lives in | What it does |
|---|---|---|
| Org Admin's sharing switch | Organization Dashboard / Settings | Master gate: if off, nothing crosses LMS boundaries in the Organization. |
| LMS Admin's sharing switch (+ optional Contribute / Discover split) | LMS Dashboard / Settings | Default single switch; "Customize what's shared" expands to separate Contribute (give) and Discover (take) switches. |
| Central Repository | Backend architecture only | The shared store that makes cross-LMS references possible. No screen, no menu entry. |

**Older documents this version replaces or overrides:**

- **Organization Creation Flow** — its "Data Sharing Across LMS Instances" dropdown is superseded by the Org Admin switch and by item-level Custom Share. Do not build it as specified there.
- **Plan Creation Flow** — drops the "Content Version" field and the "references the version current at attachment" wording (content is live-referenced); uses the Content Type list in §2.2; Pre-Test, Post-Test and Survey pickers read from the repository (§5.2), not from a Questionnaire Library or Survey Form Library.
- **Assessment / Exam document** — the Assessment Bank and the Create Assessment screen are superseded by §2.3b; only Results & Analytics remains in that module.
- **Pre-Test / Post-Test and Ratings document** — its separate questionnaire repository, builder and versioning are superseded by this module. Timing of pre/post tests and ratings stay with Plan Management.

---

## 8. Open Items

- **Who may configure sharing** — only users with repository permissions, or can a Course Owner set sharing on an item they own?
- **Storage and quota** — when a shared item is used across LMS, whose storage does it count against?
- **Approval workflow** — does publishing or sharing need sign-off? Deferred with Approval Management.
- **Repository tiers vs the BRD** — the BRD lists LMS, Organisation and Global tiers; this spec has Private, Organization-wide and Custom Share with no Global level. Confirm with the client.
- **Versioning vs the BRD** — the BRD says existing learners continue on their assigned version; this spec uses live reference with edit-creates-new-item. Confirm the two give the same protection.
- **Pre-Test and Post-Test picker types** — every scored type, or only Quiz and Exam?
- **Question-level reuse** — can a single question be reused across assessments, or only whole assessments (BRD asks for a question bank with difficulty and reuse control)?
- **Rating Scale question type** (from the older Pre/Post document) — keep, or leave to Plan ratings?
- **Editing an assessment that already has attempts** — confirm the new-item rule in §4 is enough.
