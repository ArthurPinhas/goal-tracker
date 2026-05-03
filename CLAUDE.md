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

## Feature List — V1 Scope

### Auth
- Register with email + password
- Login / Logout
- Each user sees only their own goals (PocketBase rules handle this)

### Goals
- Create a goal (name + description)
- Edit a goal
- Delete a goal (also deletes its subtasks)
- Progress bar — auto-calculated from subtasks, updates live

### Subtasks
- Add a subtask to a goal
- Mark a subtask complete / incomplete (toggle)
- Delete a subtask
- Optional effort points (1–5) — hidden by default, user can expand/toggle per subtask

### Celebration UI (this is a core feature, not a nice-to-have)
- Subtask completed → small confetti burst on that row + checkmark animates in smoothly
- Progress bar fills with smooth animation, color shifts as progress increases (e.g. blue → green → gold near 100%)
- Reaching 50% → toast notification with a random motivational message (e.g. "Halfway there, keep going!")
- Reaching 100% → full screen confetti explosion + goal card enters a special "completed" visual state (glow, trophy icon, distinct color)

### Celebration UI — preferred libraries
- `canvas-confetti` — for confetti effects
- `framer-motion` — for smooth animations
- `react-hot-toast` — for toast notifications

---

## Key Design Decisions (Don't Change Without Discussing)

1. **Flat structure for V1** — Goals → Subtasks only. No parent "category" or "project" layer above goals. That's V2.
2. **Effort points are optional** — Default experience has zero friction. Equal weight auto-calculated. Effort is a power-user toggle.
3. **Celebration UI is core** — The rewarding feel is the whole point of the app. Don't skip or simplify it.
4. **PocketBase handles everything backend** — No separate Node/Express/Fastify server. PocketBase IS the backend.
5. **No Redux or heavy state management** — React state + PocketBase SDK is enough for this scale.

---

## Current Project State

- Scaffolded by Lovable (barebones UI, TypeScript + React + Vite + Tailwind + Shadcn)
- Code is on GitHub and available locally
- `src/data/mockMilestones.ts` exists — this is fake placeholder data from Lovable, will be replaced by real PocketBase data
- PocketBase binary is inside the project folder (`pocketbase_0.37.4_...`)
- **PocketBase is NOT yet configured** — no collections created yet, no auth set up
- **Frontend is NOT yet connected to PocketBase** — still using mock data
- App name in Lovable was "Milestone Mapper" — we are renaming concept to "Goal Tracker"

---

## Folder Structure (Current — from Lovable)

```
src/
  components/   — UI building blocks
  data/         — mockMilestones.ts (placeholder, to be removed)
  hooks/        — reusable logic hooks
  lib/          — utility helpers
  pages/        — screen-level components
  types/        — TypeScript type definitions
  App.tsx
  main.tsx
```

---

## What To Build Next (Prioritised)

1. **Start PocketBase locally** — run the binary, open admin UI at http://127.0.0.1:8090/_/
2. **Create PocketBase collections** — Goals and Subtasks with the schema above
3. **Set up PocketBase auth rules** — users can only read/write their own goals and subtasks
4. **Install PocketBase JS SDK** — `npm install pocketbase`
5. **Create a PocketBase client file** — `src/lib/pocketbase.ts` — single instance, points to local URL via env variable
6. **Replace mock data with real PocketBase calls** — fetch goals for logged-in user
7. **Build auth screens** — Login and Register pages
8. **Wire up goal CRUD** — create, edit, delete
9. **Wire up subtask CRUD** — add, toggle, delete
10. **Add celebration UI** — confetti, animations, toasts

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

---

## Out of Scope for V1 (Do Not Build Yet)

- Goal categories or parent folders above goals
- Due dates or deadlines on goals
- Sharing goals with other users
- Mobile app
- Push notifications
- Analytics or dashboards
- Docker / Synology deployment
