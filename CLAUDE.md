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
| Backend + DB + Auth | PocketBase (self-contained binary, SQLite under the hood) |
| Dev environment | Cursor IDE |
| Frontend hosting | Cloudflare Pages (future) |
| Backend hosting | Synology NAS via Docker (future) |

---

## Data Model

### Users
Handled entirely by PocketBase built-in auth. No custom user collection needed.

### Goals (PocketBase collection)
| Field | Type | Notes |
|---|---|---|
| id | auto | PocketBase generates |
| user | relation | links to auth user |
| name | text | required |
| description | text | optional |
| archived | bool | default false |
| sort_order | number | for drag-and-drop ordering |
| created | auto | PocketBase generates |

### Subtasks (PocketBase collection)
| Field | Type | Notes |
|---|---|---|
| id | auto | PocketBase generates |
| goal | relation | links to parent Goal |
| name | text | required |
| completed | bool | default false |
| effort | number | optional, 1–5, default null |

### Progress Calculation Logic
- Default: all subtasks have equal weight → progress = (completed subtasks / total subtasks) × 100
- If effort points are set on ANY subtask in a goal: weight = subtask effort / sum of all subtask efforts
- Effort is optional and per-subtask — users can ignore it entirely

---

## Current Project State (as of 2026-05-04)

V1 is **fully shipped and functional**. PocketBase is connected, all CRUD works, auth works.

### What's built and live

**Auth**
- Register with email + password
- Login / Logout
- Each user sees only their own goals (PocketBase API rules)

**Goals**
- Create, edit, delete
- Archive / restore / permanently delete archived goals
- Drag-and-drop reorder (Framer Motion `Reorder`, persisted to PocketBase `sort_order`)
- Progress bar — weighted by effort if set, equal weight otherwise
- Search across goal title, description, and subtask names
- Filter tabs: All / Active / Done / Archived

**Subtasks**
- Add, toggle complete/incomplete, delete
- Optional effort points (1–5) — power-user toggle per subtask
- Optimistic UI for toggle (instant feedback, revert on error)

**Celebration UI**
- Lottie animation overlay on goal completion (`CelebrationOverlay`)
- Canvas confetti on subtask complete
- Framer Motion animations throughout (card enter/exit, progress bar, sidebar ring)
- react-hot-toast notifications with motivational quotes
- Sound effects (`src/lib/sounds.ts`) — toggleable, persisted to localStorage

**UI / UX**
- Sticky header slides in when main header scrolls out of view (`StickyHeader`)
- Sidebar with progress ring + stats (goals completed, avg progress, subtasks done) — desktop only (`GoalSidebar`)
- Skeleton loading cards (`SkeletonGoalCard`)
- Save status indicator (Saving… / Saved / Error) in bottom-right corner
- Cmd/Ctrl+N keyboard shortcut to open new goal dialog
- Ambient animated orbs in header and page background
- Motivational quote in header — rotates on refresh

**Export**
- Export all goals as JSON, CSV, or PDF
- PDF is formatted with progress bar, subtask list, colour-coded badges
- Accessible via Export button in the sidebar (`ExportDialog`)

**Infrastructure**
- PWA icons added (apple-touch-icon, 192, 512)
- Vite PWA plugin configured
- PocketBase client singleton at `src/lib/pocketbase.ts`
- `src/lib/goalUtils.ts` — `calcProgress` and `getProgressColor` utilities
- `src/types/goal.ts` — canonical type definitions (`Goal`, `Subtask`)

---

## Folder Structure

```
src/
  components/
    ui/               — Shadcn UI primitives
    AddGoalDialog     — Create goal modal
    AddSubtaskDialog  — Add subtask modal
    ArchiveSection    — Archived goals list
    CelebrationOverlay— Lottie full-screen celebration
    EditGoalDialog    — Edit goal modal
    ExportDialog      — Export modal (JSON/CSV/PDF)
    GoalCard          — Goal card with subtasks
    GoalProgress      — Progress bar component
    GoalSidebar       — Desktop stats sidebar
    MilestoneCard     — Legacy (Lovable) — unused
    SkeletonGoalCard  — Loading placeholder
    StickyHeader      — Scroll-activated header
    SubtaskItem       — Individual subtask row
  hooks/
    useAuth           — Auth state (PocketBase)
    useGoals          — All goal + subtask CRUD
  lib/
    exportGoals       — JSON/CSV/PDF export logic
    goalUtils         — calcProgress, getProgressColor
    pocketbase        — PocketBase client singleton
    sounds            — Sound effect helpers
    utils             — Tailwind cn() helper
  pages/
    Index             — Main goals page
    Login             — Login page
    Register          — Register page
    NotFound          — 404
  types/
    goal              — Goal, Subtask interfaces
    milestone         — Legacy (Lovable) — unused
  assets/
    celebration.json  — Lottie animation data
```

---

## V2 Roadmap (Not Yet Built)

These are planned for after V1 stabilises. Do not build until discussed.

| Feature | Notes |
|---|---|
| Goal categories / folders | Group goals into projects above the goal level |
| Due dates on goals | Optional deadline with overdue visual state |
| Email export / scheduled email digest | Send goals summary to user's email (needs SMTP or Resend) |
| Sub-subtasks (task nesting) | 3-level hierarchy: Category → Goal → Subtask → Task |
| Goal templates | Save a goal structure and reuse it |
| Analytics dashboard | Completion rate over time, streaks, most active days |
| Sharing goals | Share read-only link to a goal with others |
| Dark/light theme toggle | Currently dark-only |
| PWA offline mode | Full offline support with background sync |
| Mobile app | React Native or Capacitor wrapper |
| Docker / Synology deploy | Self-host PocketBase + frontend as Docker stack |
| Subtask comments / notes | Per-subtask notes field |
| Recurring goals | Reset on schedule (daily habits, weekly reviews) |

---

## Key Design Decisions (Don't Change Without Discussing)

1. **Flat structure for V1** — Goals → Subtasks only. No parent "category" or "project" layer above goals. That's V2.
2. **Effort points are optional** — Default experience has zero friction. Equal weight auto-calculated. Effort is a power-user toggle.
3. **Celebration UI is core** — The rewarding feel is the whole point of the app. Don't skip or simplify it.
4. **PocketBase handles everything backend** — No separate Node/Express/Fastify server. PocketBase IS the backend.
5. **No Redux or heavy state management** — React state + PocketBase SDK is enough for this scale.
6. **Export is client-side only** — No server involvement for export. JSON/CSV/PDF all generated in the browser.

---

## Rules For This Project

- Always use TypeScript — no plain `.js` files in `src/`
- Always use Tailwind for styling — no inline styles, no separate CSS files unless absolutely necessary
- Use Shadcn UI components where they fit — don't reinvent buttons, modals, inputs
- Keep PocketBase URL in an environment variable (`VITE_POCKETBASE_URL`) — never hardcode it
- Keep the PocketBase client as a singleton in `src/lib/pocketbase.ts`
- No heavy state management libraries — React useState/useContext is enough
- Components should be small and focused — one responsibility per component
- When in doubt about scope: do less, do it well, ship it

---

## Running The App Locally

Every dev session needs both of these running:

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
./pocketbase serve
```

Frontend: http://localhost:5173
PocketBase admin: http://127.0.0.1:8090/_/

---

## Environment Variables

Create a `.env` file in the project root (already in `.gitignore`):

```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```
