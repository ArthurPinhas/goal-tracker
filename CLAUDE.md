# Goal Tracker — Project Bible for Claude Code

## What This App Is

A personal goal tracking app. The core problem it solves: most task tools (TickTick, Todoist) treat everything as a flat checklist with no sense of progress. This app lets users break goals into weighted subtasks, visualize progress with a live progress bar, and feel rewarded as they move forward.

The experience should feel **tactile and fun** — every action should have a visible reaction.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| Long lists | **@tanstack/react-virtual** — window-scroll virtualization when a tab shows many rows (**manual drag-reorder** on active goals still renders the full list) |
| Themes | **next-themes** — **dark default**, optional light (class on `<html>`, persisted `goal-tracker-theme`) |
| Backend + DB + Auth | PocketBase (self-contained binary, SQLite under the hood) |
| Dev environment | Local (editor-agnostic) |
| Frontend hosting | Cloudflare Pages (future) |
| Backend hosting | Synology NAS via Docker (future) |

---

## Data Model

### Users

Handled entirely by PocketBase built-in auth. No custom user collection needed.

Auth UI collects **username + password**; the client maps signup/login to PocketBase users using a synthetic email: `{username}@goaltracker.local` (see `useAuth`). Pick usernames accordingly.

### Categories (PocketBase collection)

| Field | Type | Notes |
|---|---|---|
| id | auto | PocketBase generates |
| user | relation | links to auth user |
| name | text | required |

Goals may optionally set **`category`** (single relation → **categories**).

### Goals (PocketBase collection)

| Field | Type | Notes |
|---|---|---|
| id | auto | PocketBase generates |
| user | relation | links to auth user |
| name | text | required |
| description | text | optional |
| **due_date** | **date** | **optional** — calendar deadline; app uses canonical `YYYY-MM-DD` semantics |
| **emoji** | text | optional — display emoji in title row (suggest/pick in dialogs) |
| **notes** | text | optional — plain-text private notes (search + export) |
| **showcase_url** | text | optional — `http`/`https` link; **Edit goal** when complete; highlighted on card |
| **showcase_caption** | text | optional — short line above showcase link |
| **showcase_image** | file | optional — single image; screenshot-upload showcase (client max ~5 MB); **Edit goal** / quick showcase when complete |
| **category** | relation | optional — single **categories** row (folder / project label) |
| archived | bool | default false |
| sort_order | number | drag-and-drop order; **new goals** created with **`sort_order: -Date.now()`** so ascending sort surfaces them above legacy `0…n−1`; client merge keeps “new IDs” first in `orderedGoals` |
| created | auto | PocketBase generates |

### Subtasks (PocketBase collection)

| Field | Type | Notes |
|---|---|---|
| id | auto | PocketBase generates |
| goal | relation | links to parent Goal |
| name | text | required |
| completed | bool | default false |
| effort | number | optional, 1–5, default null |
| **notes** | text | optional — plain-text notes (search + export) |

- Default: all subtasks have equal weight → progress = (completed subtasks / total subtasks) × 100
- If effort points are set on ANY subtask in a goal: weight = subtask effort / sum of all subtask efforts
- Effort is optional and per-subtask — users can ignore it entirely

### Due-date urgency (frontend-only)

Normalized with `normalizeDueDate` (`src/lib/dueDateUtils.ts`). Urgency compares **local calendar days** via `startOfDay` + `differenceInCalendarDays` (not string sorting), with ISO / `Date` inputs normalized to `YYYY-MM-DD`.

- **Overdue:** `due_date` before today AND goal not “done” for due purposes (same completion rule as card)
- **Due soon:** from today through +7 calendar days (inclusive)
- **Completed goals** (100% with ≥1 subtask): no overdue/soon styling on rings

Filters in **Index**: deadline pills **Any / Has date / Overdue / ≤7 days**; sort **Manual (drag)** vs **Due date · soonest first**. Drag reorder only when **Deadline: Any** and **Sort: Manual** (otherwise lists are filtered/sorted and must not reorder a subset incorrectly).

### Due reminders — browser “option A” (`Notification` API)

- **User control:** bell toggle in the main and sticky headers (`DueNotificationToggle`); preference stored in **`localStorage`** (`goal-tracker-due-notifications-enabled`).
- **When it fires:** incomplete goals whose due date is **today** or **before today** (overdue). Deduped **once per goal per local calendar day** (`localStorage` map `goal-tracker-due-notify-sent-v1`).
- **Cadence:** `useDueNotifications` uses **`DUE_NOTIFICATION_INTERVAL_MS`** (1 minute) plus **`visibilitychange`** and **`window` `focus`**. The effect depends on **`goals`** from `useGoals` (not filtered UI lists). **`runDueNotificationCheck`** only calls **`markGoalsNotifiedForDay`** after **`new Notification(...)` succeeds**. Notifications use **`requireInteraction: true`** where supported (OS behavior still varies). **`Index`** passes **`onDelivered`** to **`showDueReminderInAppToast`** (`src/lib/showDueReminderInAppToast.tsx`), which mounts **`DueReminderInAppToastPanel`** via **react-hot-toast** (`id: goal-due-reminder`, ~45s) so reminders are visible inside the active browser tab.
- **Limitations:** requires **permission**; only meaningful while the app tab (or installed PWA) is **open** — **no** background push, email, or SMS.

### Notes (goals & subtasks)

- **Plain text only** — store user-entered copy; rendered in dialogs/cards and searchable from **Index** (goal + subtask notes included in search).
- **Persistence:** optional PocketBase fields **`goals.notes`** and **`subtasks.notes`** (text). Included in **JSON / CSV / PDF** export.

---

## Current Project State (as of 2026-05)

V1 is **fully shipped and functional**. PocketBase is connected, all CRUD works, auth works. **Goal due dates**, **deadline UX**, **theme toggle**, **plain-text notes**, **browser due reminders**, export, PWA, tests, and **several UI polish passes** are in tree (dark-first tokens, shared motion, elevated inputs, upgraded shadcn shells — see *UI / UX* and README *UI polish*).

### Phases (internal delivery batches)

| Phase | Scope | Status |
| --- | --- | --- |
| A | UI polish (spacing, empty states, filters, design system, primitives, motion) | **Shipped** (ongoing small tweaks) |
| B | Due-date **browser** notifications (option A — tab/PWA active) | Shipped |
| C | Plain-text **notes** on goals + subtasks | Shipped |
| D | Sidebar stats / analytics expansion | **Shipped** — collapsible Insights panel (completion rate, distribution, category breakdown); AnimatedCounter spring numbers; GoalsAchievedRing; command palette; templates |
| E | Ops & trust “must-haves” (production security, backups, safe exposure, recovery story) | **Not started** — checklist in *Phase E — production readiness* below |

Per product direction: **export remains client-side only**; **sidebar layout** was not expanded in Phase D.

### What's built and live

**Auth**

- Register / login / logout (`useAuth`)
- Each user sees only their own goals (PocketBase API rules)

**Goals**

- Create, edit, delete (including **optional due date** in create/edit — `GoalDueDatePicker`; optional **notes** textarea; optional **`category`** via `GoalCategoryPicker`); **`duplicateGoal`** — copies goal fields + subtasks as a new active goal (fresh checklist; showcase image file not duplicated)
- **Categories** — PocketBase **`categories`** collection; **`ManageCategoriesDialog`** for rename/delete; **Index** **Categories** popover — filter **all** / **only selected** (multi-select) / **hide selected** (multi-select); category color dots via **`getCategoryAccent`** (`src/lib/categoryColor.ts`) — stable hash of PB ID → 8-variant accent palette; colored pills on cards, pickers, and manage dialog
- Archive / restore / permanently delete archived goals
- Drag-and-drop reorder (**Framer Motion `Reorder`**), persisted to **`sort_order`**
- **New goals appear at top** after fetch (PB sort + **`Index` orderedGoals merge**)
- Progress bar — weighted by effort if set, equal weight otherwise
- Search across goal title, description, **goal notes**, subtask titles, **subtask notes**, and **category** names
- Filter tabs: **All / Active / Done / On display / Archived** — **segmented control** with Framer Motion `layoutId` sliding indicator; **deadline refinement** + **due-date sort**; **Expand all** / **Collapse all** cards (**Index** toolbar); **duplicate** control on **`GoalCard`** (+ archived rows)
- **Bulk select** — delete / archive many goals from the **current tab view**; drag reorder is off while bulk mode is on
- **Large libraries** — **`VirtualWindowGoalList`** (TanStack Virtual) + **`useDeferredValue`** on search + memoized rows; **`reconcileFetchedGoals`** merges fetch results with **`orderedGoals`** safely
- **Showcase (complete goals)** — optional **`showcase_url`**, **`showcase_caption`**, and/or **`showcase_image`** (single image file on **`goals`**); **Edit goal** + quick showcase dialog support upload, replace, and remove; **`GoalShowcaseBlock`** on **`GoalCard`**; hero **`HeroShowcaseStrip`** and **On display** filter on **`Index`**; public file URL via **`getGoalShowcaseImageUrl`** (`src/lib/goalShowcaseAsset.ts`), client validation in **`showcaseImageUpload.ts`**
- **Goal templates** — save/apply/delete via **`src/lib/goalTemplates.ts`** (`localStorage` key `goal-tracker-templates`); **`TemplatesDialog`** lists saved templates; **"Save as template"** in **`EditGoalDialog`** footer; **"From template"** in **`AddGoalDialog`** footer; no PB schema change
- **Cmd+K command palette** — **`CommandPalette`** component (cmdk-based via shadcn `Command`); Cmd/Ctrl+K toggles; commands: new goal, export, toggle theme, switch filter, jump to goal (top 12 shown)
- **`GoalCard` collapsed state** — 3 px full-width bottom progress strip using `getProgressColor`; removes old 80 px mini-bar

**Subtasks**

- Add, toggle complete/incomplete, delete; **rename title** inline (`renameSubtask` / pencil + check on **`SubtaskItem`**)
- **`SubtaskSproutGlyph`** (`micro/MicroGlyphs.tsx`) — brief line-art sprout **to the right of the title** on complete; auto **fades out** after a couple of seconds (`smoothOut`)
- Optional effort points (1–5) — power-user toggle per subtask
- Optional **plain-text notes** per subtask (inline expand on card)
- Optimistic UI for toggle (instant feedback, revert on error)

**Celebration UI**

- Full-screen overlay on goal completion (`CelebrationOverlay` — CSS orbit / sparkles + Framer motion; **`celebrationQuality`** tiers; **`aria-hidden`** on wrapper; **no Lottie playback** in the live overlay)
- Canvas confetti on subtask complete
- Framer Motion animations throughout (card enter/exit, progress bar, sidebar ring)
- react-hot-toast notifications with motivational quotes
- Sound effects (`src/lib/sounds.ts`) — toggleable, persisted to localStorage

**Due-date reminders (browser)**

- `DueNotificationToggle` — bell in main + sticky header (same React node via `dueNotificationsSlot` on `StickyHeader`)
- `useDueNotifications` + `runDueNotificationCheck` (`src/lib/dueNotifications.ts`) — permission, localStorage prefs, per-day dedupe

**UI / UX**

- **Light / dark theme** — **`ThemeToggle`** (`next-themes`, default **dark**, key `goal-tracker-theme`; inline script in `index.html` limits flash); tokens in **`src/index.css`** (`:root` light / `.dark` dark). **`app-surface-input`** (dark elevated fields), **`ui-section-label`** (uppercase micro-labels), softer dot grid in dark.
- **Micro-line UI accents** — **`src/components/micro/MicroGlyphs.tsx`**: subtask sprout, **`FilterLeafFanGlyph`** (three-leaf fan on active filter + **click pulse**), export / archive / bell / link ribbons, etc.; tuned with **`useReducedMotion`** where relevant.
- **Motion** — shared tuning in **`src/lib/motion.ts`** (`springContent`, **`appleSpring`**, **`appleSpringGentle`**, **`smoothOut`**, **`tactileHover`** / **`tactileTap`**) for springs and easing (Index, cards, dialogs, auth, celebration, archive). Tailwind config has **`ease-smooth-out`** token (`cubic-bezier(0.22,1,0.36,1)`).
- `Sonner` and **react-hot-toast** use resolved theme / card-style chrome (`src/components/ui/sonner.tsx`, `App.tsx`).
- Sticky header (`StickyHeader`) — theme + **due reminders** + add goal + sound + logout
- Sidebar (`GoalSidebar`) — **momentum ring** (completed/total with animated `strokeDashoffset`; **`AnimatedCounter`** spring numbers); **At a glance** stats (**Active**, **Achieved**, **Subtasks**, **Overdue**, **Due ≤7d**) with animated counters and per-row `whileHover`; **Insights panel** (collapsible — completion rate %, progress distribution buckets, category breakdown); **Daily mantra** card
- Skeleton loading cards (`SkeletonGoalCard`), **IndexRouteFallback** (lazy route shell)
- Save status indicator (Saving… / Saved / Error) bottom-right
- Cmd/Ctrl+N opens new goal dialog; **Cmd/Ctrl+K** opens **`CommandPalette`**
- Ambient treatment: **Index** uses **`PageSideAmbience`** for side gutter ambience; **Login** / **Register** use the shared **`gradient-header`** treatment (no separate auth-only particle layer).
- Index **hero** is a clipped gradient block; subtle **`whileHover`** on **username** + hero stat trio (**Goals**, **Completed**, **Subtasks done**) when motion is allowed; transition to the list is a **narrow seam** — avoid reintroducing stacked full-bleed gradient washes over gutters/particles.
- Motivational quote in header — rotates on refresh
- Dialogs / alerts / tooltips / dropdowns / select / calendar / radix toasts aligned to the same **rounded-xl / dark depth** language where applicable
- **Edit affordance** — shared sky-tinted ghost icon styling via **`src/lib/editAffordance.ts`** (goal edit, subtask rename, category rename in **`ManageCategoriesDialog`**)
- **`EmptyState`** — optional `illustrationSlot` prop for custom SVGs; **`GoalTrackerIllustration`** export (animated target rings + sparkles) used on the primary "no goals yet" state

**Export**

- JSON, CSV, PDF — **`due_date`**, **notes** (goal + subtask), and showcase fields (**`showcase_url`**, **`showcase_caption`**, **`showcase_image`** filename) included where present (exports do not bundle binary file contents)
- `ExportDialog` in sidebar

**Infrastructure**

- PWA icons + **Vite PWA** plugin (`vite.config.ts` — dev server **`3000`** by default)
- **`import.meta.env.VITE_POCKETBASE_URL`** only — never committed real secrets (use **`.gitignore`'d `.env`**, ship **`.env.example`** template)
- **`.gitignore`**: PocketBase dirs, `**/pb_data/`, SQLite, `.env.*` (allow `.env.example`)
- PocketBase client singleton `src/lib/pocketbase.ts`
- `goalUtils.ts` — `calcProgress`, `getProgressColor`
- `dueDateUtils.ts` — urgency, normalization, formatting
- **`src/types/goal.ts`** — `Goal` / `Subtask` include `due_date`, `emoji`, **`notes`**, **`showcase_url`**, **`showcase_caption`**, **`showcase_image`**

**Testing**

- **Vitest** + Testing Library (`npm run test`) — **`dueDateUtils`**, **`goalEmojiSuggest`**, **`goalUtils`**, **`reconcileFetchedGoals`**, **`linkSegments`** / **`linkifyText`**, **`useGoals`**, **`useResponsiveUI`**, **`AddGoalDialog`**, **`ThemeToggle`**, **`src/test/setup.ts`** in-memory **localStorage** mock

**Docs**

- Root **`README.md`** — onboarding, PocketBase schema notes, security contributor notes (**push target**: `git remote -v`, not README)

---

## Folder Structure

```
src/
  components/
    ui/                 — Shadcn UI primitives
    AddGoalDialog       — Create goal modal (+ due picker + emoji title)
    AddSubtaskDialog    — Add subtask modal
    PageSideAmbience    — Side gutter ambience on Index
    micro/              — MicroGlyphs + related line-art motion (filters, subtask sprout, etc.)
    ManageCategoriesDialog — Rename/delete categories; surfaced from Index when categories exist
    NewGoalHoverBloom   — Optional bloom on “new goal” affordances
    CelebrationOverlay — Full-screen celebration (CSS-first; legacy Lottie asset optional)
    EmptyState          — Shared empty / no-results illustration
    EditGoalDialog      — Edit goal modal (+ due picker + emoji title); optional duplicate action
    DueNotificationToggle — Bell: browser due reminders (option A)
    DueReminderInAppToastPanel — Large in-tab mirror UI (mounted via `showDueReminderInAppToast` in lib)
    CommandPalette      — Cmd+K palette (cmdk): new goal, export, theme toggle, filter switch, jump to goal
    ExportDialog        — Export modal (JSON/CSV/PDF); accepts optional controlled `open`/`onOpenChange` props
    LinkifiedText       — Plain-text URLs → links in notes/showcase copy (parsing in `lib/linkSegments`)
    TemplatesDialog     — List/apply/delete saved goal templates (localStorage)
    VirtualWindowGoalList — Window-scroll virtualization for long goal/archive lists
    ShowcaseQuickDialog — Quick edit showcase URL / caption / screenshot when complete
    GoalCard            — Goal card + subtasks + due urgency chrome + showcase when complete; duplicate; list fold signal from Index; 3 px collapsed progress strip
    GoalCategoryPicker  — Optional goal folder (categories relation); colored dot per category
    GoalShowcaseBlock   — Completed-goal showcase: uploaded image + link previews
    HeroShowcaseStrip   — Hero row of goals “on display” (URL and/or uploaded image)
    GoalDueDatePicker   — Popover + calendar due date (+ clear)
    GoalEmojiTitleSection — Title + optional emoji suggest / shuffle / picker
    GoalProgress        — Progress bar (fills to 100%; **no** separate end-cap check glyph)
    GoalSidebar         — Desktop stats sidebar (momentum ring, at-a-glance, insights panel, mantra, export)
    IndexRouteFallback  — Loading shell for lazy `Index` route
    SkeletonGoalCard    — Loading placeholder
    StickyHeader        — Scroll-activated header
    SubtaskItem         — Individual subtask row
    ThemeToggle         — Light/dark control
  hooks/
    useAuth             — Auth state (PocketBase)
    useGoalEmojiSuggest — Debounced emoji suggestion for title
    useGoals            — All goal + subtask CRUD + categories (`duplicateGoal`, `renameSubtask`, …)
    useDueNotifications — Interval + visibility hooks for due `Notification` checks
    useResponsiveUI     — Breakpoints, lite motion tier, celebration quality
  lib/
    categoryColor        — `getCategoryAccent(id)` → stable 8-variant color tokens (dot/pill/text/border)
    editAffordance       — Shared sky ghost-button classes for edit pencils (goal / subtask / categories)
    dueNotifications     — `runDueNotificationCheck`, localStorage prefs & dedupe keys
    dueDateUtils         — Due normalization + urgency helpers
    goalTemplates        — `listTemplates`, `saveTemplate`, `deleteTemplate`, `renameTemplate`; localStorage key `goal-tracker-templates`
    linkSegments           — `parseLinkSegments` for LinkifiedText / tests
    reconcileFetchedGoals — Merge PocketBase fetch with client `orderedGoals` / overlap guard
    showDueReminderInAppToast — react-hot-toast wrapper for due reminder panel
    exportGoals          — JSON/CSV/PDF export
    goalShowcaseAsset    — `getGoalShowcaseImageUrl`, `goalHasShowcaseMedia`
    showcaseImageUpload  — Max size / MIME validation for showcase screenshots
    goalEmojiSuggest     — Match title → emoji + shuffle pools (imports `goalEmojiSuggestRules`)
    goalEmojiSuggestRules — Large keyword → emoji table (data only)
    goalUtils            — calcProgress, getProgressColor
    motion               — springContent, appleSpring, appleSpringGentle, smoothOut, tactile tuning
    pocketbase           — PocketBase client singleton
    sounds               — Sound effect helpers
    utils                — Tailwind cn() helper
  pages/
    Index                — Main goals page (lazy route chunk)
    Login                — Login page
    Register             — Register page
    NotFound             — 404 (`EmptyState`)
  providers/
    ThemeProvider        — wraps next-themes
  types/
    goal                 — Goal, Subtask interfaces
  test/                  — Vitest specs + setup
  assets/
    celebration.json    — Legacy Lottie file (unused by current CSS-first overlay; optional cleanup)
```

---

## Phase E — production readiness (must-haves)

**Goal:** Run the app on the **public internet** (or a trusted network) without turning PocketBase or user data into an easy target — and be able to **recover** when something breaks.

### Safe exposure pattern

1. **HTTPS everywhere** — Terminate TLS for the **static frontend** and for **PocketBase**. Do not ship production auth over `http://`.
2. **Reverse proxy** — Put PocketBase behind **Caddy, nginx, Traefik, or Cloudflare Tunnel**. Typical pattern: `https://app.example.com` → static files; `https://pb.example.com` (or same host `/api` path if you configure it) → PocketBase. **Do not** leave PocketBase’s default port **world-open** unless you fully accept the risk.
3. **Admin UI (`/_/`)** — Treat as **root on your database**. Use a **strong unique password**, enable **2FA** in PocketBase if you use a version that supports it, prefer **VPN / SSH tunnel / IP allowlist** for admin, or bind admin to localhost and access via tunnel. Never use default credentials on a public IP.
4. **CORS** — In PocketBase settings, allow only your **real frontend origin(s)** in production (not `*`).
5. **Collection API rules** — Verify every **`goals`** / **`subtasks`** rule: create/update/delete/list only where `user` / `goal.user` matches `@request.auth.id`. Re-test after schema changes.

### Secrets and client bundle

- **`VITE_POCKETBASE_URL`** is embedded in the JS bundle — **public**. That is OK; security is **rules + TLS + admin lockdown**, not hiding the URL.
- Never put **service-role** or SMTP passwords in `VITE_*` or client code.

### Backups and restore (account & data)

- **Automated backups** of **`pb_data`** (and hooks/migrations if you add them) on a schedule; store **encrypted** copies **off the same machine**.
- **Test restore** to a scratch instance quarterly — a backup you have never restored is a gamble.
- **Restore account / password recovery:** The app registers users with **`{username}@goaltracker.local`**. PocketBase “email reset” only works if users have a **deliverable email**. For production with real users you should either: (a) collect a **real email** at registration and enable PB **email verification / password reset**, (b) document **manual admin reset** for self-hosters, or (c) add **OAuth** — pick one explicitly; “forgot password” will confuse users otherwise.

### Abuse and observability

- Add **rate limiting** at the proxy or via PocketBase hooks for `auth` endpoints if the API is public.
- Monitor disk, failed auth spikes, and process health; alert on backup job failure.

### Headers (if you control the static host)

- **HSTS** on the app origin; tighten **Content-Security-Policy** over time; restrict **frame-embedding** if you do not need it.

Phase E is **documentation + process + deployment choices** first; some items require **no code**, others (real email for recovery) need **product + schema** agreement.

For a **literal step-by-step** aimed at beginners self-hosting on **Synology** (especially without opening PocketBase ports on the router), see **`docs/BEGINNER_SYNOLOGY_DEPLOY.md`** (recommended: **Cloudflare Tunnel** + HTTPS + tight CORS + backups).

---

## Prioritized product suggestions (impact)

Not committed roadmap — for planning only (aligned with **V2**):

1. **Categories / tags / folders** — **optional folders shipped** (`categories` + goal `category`); colored dots via `getCategoryAccent`; richer tagging / nesting still V2+.  
2. **Goal templates** — **shipped**: save/apply/delete in localStorage via `goalTemplates.ts`; "Save as template" in EditGoalDialog; "From template" in AddGoalDialog.  
3. **Cmd+K command palette** — **shipped**: `CommandPalette` — new goal, export, theme, filter, jump.  
4. **Light analytics** — **shipped**: collapsible Insights panel in sidebar (completion rate, distribution, category breakdown).  
5. **Recurring goals / habits** — retention / daily use; **deferred** — needs background scheduler / PB hooks.  
3. **Read-only share links** — high value vs effort if rules + token are done carefully.  
4. **Goal templates** — strong effort-to-impact ratio.  
5. **Light analytics** (streaks, weekly completions) — optional sidebar/Page without full “dashboard.”  
6. **PWA offline + sync** — high effort.  
7. **Archive UX** — archived goals use the **inline** section on `Index` only (single implementation).  
8. **Email digest** — SMTP/Resend; complements browser-only reminders.  
9. **Docker / Synology deploy** — ops story for self-hosters.

---

## V2 Roadmap (Not Yet Built)

Planned beyond current V1+ — **discuss before building**.

**Already shipped (do not duplicate as roadmap work): goal due dates, light/dark theme, plain-text notes on goals/subtasks, browser due reminders (option A), goal templates (localStorage), Cmd+K command palette, light insights panel in sidebar.**

| Feature | Notes |
|---|---|
| Goal categories / folders | **Shipped (V1+):** optional `categories` + per-goal **`category`** — multi-level nesting / tags beyond one folder = future |
| Goal templates | **Shipped (V1+):** localStorage-based save/apply/delete (`src/lib/goalTemplates.ts`); no PB schema change |
| Cmd+K command palette | **Shipped (V1+):** `CommandPalette` — new goal, export, theme toggle, filter switch, jump to goal |
| Light analytics (sidebar) | **Shipped (V1+):** collapsible Insights panel — completion rate %, progress distribution, category breakdown |
| Email export / scheduled email digest | Send goals summary (SMTP or Resend) |
| Sub-subtasks (task nesting) | 3-level hierarchy: Category → Goal → Subtask → Task |
| Full analytics dashboard | Streaks, completion over time, historical charts |
| Sharing goals | Read-only links |
| PWA offline mode | Full offline + sync |
| Mobile app | RN or Capacitor |
| Docker / Synology deploy | Self-host PocketBase + frontend |
| Recurring goals | Scheduled reset / habits (deferred — needs PB hooks + background scheduler) |

---

## Key Design Decisions (Don't Change Without Discussing)

1. **Goal hierarchy** — Goals → Subtasks (unchanged). **Optional single `category` per goal** (folder label) is supported; no category tree, sub-categories, or tags beyond that without a product pass.
2. **Effort points are optional** — Default experience has zero friction; effort is power-user toggle.
3. **Celebration UI is core** — Don't skip or simplify the rewarding feedback.
4. **PocketBase handles everything backend** — No separate app server for V1 scope.
5. **No Redux** — React + PocketBase SDK is enough here.
6. **Export is client-side only** — JSON/CSV/PDF in-browser.
7. **Due dates optional** — No forced deadlines; urgency styling only when incomplete.
8. **`VITE_*` is public at build time** — Never put PocketBase secrets in env exposed to browser; PocketBase rules are the real ACL.

---

## Rules For This Project

- Always use TypeScript — no plain `.js` files in `src/`
- Always use Tailwind for styling — no inline styles, no separate CSS files unless absolutely necessary
- Use Shadcn UI where it fits
- **`VITE_POCKETBASE_URL`** from env — never hardcode deployed URLs into source for production
- PocketBase singleton in `src/lib/pocketbase.ts`
- Components small and focused — one responsibility per component
- When in doubt: do less, do it well, ship it
- Never commit **`pb_data/`**, **`*.db`**, or real **`.env`** — see README + `.gitignore`

---

## Running The App Locally

Every dev session needs both processes:

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend (path to binary as you keep it locally)
./pocketbase serve
```

- **Frontend:** URL printed by Vite (this repo configures **port `3000`** in `vite.config.ts` by default).
- **PocketBase admin:** http://127.0.0.1:8090/_/  
- Before first goal with metadata: in PocketBase Admin add optional **`due_date`** (type **date**), **`notes`**, optional **`showcase_image`** (type **file**, single), **`showcase_url`**, and **`showcase_caption`** (type **text**) on **`goals`**, and optional **`notes`** (type **text**) on **`subtasks`**.

---

## Environment Variables

- Copy **`.env.example` → `.env`** (repo root — `.git` ignores `.env` / `.env.*` except `.env.example`).
- **Required for dev:**

```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

Use your deployed PocketBase **HTTPS URL** only when that endpoint is intentionally public-facing and rules are tightened for production.

