# Goal Tracker

A personal goal-tracking app: break goals into weighted subtasks, see **live progress**, and get small **celebrations** as you finish work. Built for a tactile, rewarding feel—not a flat checklist.

---

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 18 · Vite · TypeScript |
| UI | Tailwind CSS · [shadcn/ui](https://ui.shadcn.com/) |
| Backend | [PocketBase](https://pocketbase.io/) (auth · SQLite · realtime-ready) |

---

## Features

- **Auth** — register, login, logout; each user only sees their own data (PocketBase rules).
- **Goals** — create, edit, delete, archive / restore, drag-and-drop order.
- **Optional due dates** — per-goal deadline, overdue / due-soon emphasis, filters & sort-by-due sidebar stats.
- **Subtasks** — add, toggle (optimistic), delete; optional effort (1–5) for weighted progress.
- **Progress** — equal weight by default; effort-weighted when any subtask has effort set.
- **Search & tabs** — search titles, descriptions, and subtasks; filters (All · Active · Done · Archived).
- **Celebrations** — Lottie milestone overlay, confetti, optional sounds (`localStorage`).
- **Export** — JSON, CSV, and PDF (client-side only).
- **Theme** — **dark default**, optional light mode (persisted locally).
- **PWA** — icons and service worker via Vite PWA plugin.

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** (or compatible client)
- **PocketBase** binary for your OS — [downloads](https://pocketbase.io/docs/)

---

## Quick start

### 1. Clone & install

```bash
git clone https://github.com/<YOUR_USERNAME>/goal-tracker.git
cd goal-tracker
npm install
```

The **publish URL** Cursor/Claude (or anyone) uses for `git push` is whatever you configured locally: run `git remote -v`. It is stored in `.git/config`—not in the README—so simplifying the README clone line does **not** change where pushes go.


### 2. Environment

Copy the example file and edit if needed (`VITE_*` is bundled at build time — do not put secrets you would not ship to browsers):

```bash
cp .env.example .env
```

Default:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

Use your deployed PocketBase HTTPS URL for production builds only if that URL is intended to be public.

### 3. PocketBase collections & fields

Configure in the PocketBase Admin UI (`/_/`):

- **`goals`** — `user` (relation → users), `name`, `description`, `archived` (bool), `sort_order` (number), plus optional **`due_date`** (type **date**, not required — used by this app).

- **`subtasks`** — `goal` (relation → goals), `name`, `completed` (bool), `effort` (number, optional).

Match **Collection API identifiers** (`name`, `description`, …) so the frontend records map correctly.

### 4. Run locally

Terminal 1 — PocketBase:

```bash
./pocketbase serve
```

Terminal 2 — dev server:

```bash
npm run dev
```

- App: URL printed in the terminal (this repo’s Vite config uses port **8080** by default)
- PocketBase Admin: [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/)

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Production build (+ PWA artifacts) |
| `npm run preview` | Preview the production build |
| `npm run test` | Vitest (unit tests) |
| `npm run lint` | ESLint (**note**: full-repo lint may include non-app paths; lint `src` for UI-only checks) |

---

## Project layout (abbrev.)

```
src/
  components/     # GoalCard, dialogs, sidebar, theme toggle, …
  hooks/          # useAuth, useGoals
  lib/            # pocketbase client, goalUtils, dueDateUtils, export, sounds
  pages/          # Index, Login, Register, NotFound
  providers/      # ThemeProvider (next-themes)
  types/          # Goal, Subtask
```

Internal product notes and roadmap live in **`CLAUDE.md`** (for contributors / AI context).

---

## Deploying (overview)

- **Frontend** — static host (e.g. Cloudflare Pages); set `VITE_POCKETBASE_URL` to your live PocketBase HTTPS URL at build time.
- **PocketBase** — self-host (Docker, NAS, VPS); use TLS in production and lock down admin.

---

---

## Security notes for contributors

- **Never commit** `.env`, PocketBase **`pb_data`**, SQLite files, or a downloaded **`pocketbase_*`** folder with live data—they can contain passwords and email addresses.
- This app only exposes **`VITE_POCKETBASE_URL`** to the client. Treat PocketBase API rules as your real access control; the URL itself is visible in the shipped bundle.

---

## License

If you add a license, place it in `LICENSE` and reference it here. Until then, all rights reserved unless you state otherwise.

---

## Acknowledgements

UI primitives from [shadcn/ui](https://ui.shadcn.com/) · Backend by [PocketBase](https://pocketbase.io/).
