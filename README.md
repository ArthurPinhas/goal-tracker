# Goal Tracker

A personal goal-tracking app: break goals into weighted subtasks, see **live progress**, and get small **celebrations** as you finish work. Built for a tactile, rewarding feel—not a flat checklist.

---

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 18 · Vite · TypeScript |
| UI | Tailwind CSS · [shadcn/ui](https://ui.shadcn.com/) · [Framer Motion](https://www.framer.com/motion/) |
| Themes | [next-themes](https://github.com/pacocoursey/next-themes) — **dark default**, optional light |
| Backend | [PocketBase](https://pocketbase.io/) (auth · SQLite · realtime-ready) |

---

## Features

- **Auth** — register, login, logout; each user only sees their own data (PocketBase rules).
- **Goals** — create, edit, delete, archive / restore, drag-and-drop order.
- **Optional due dates** — per-goal deadline, overdue / due-soon emphasis, filters & sort-by-due sidebar stats.
- **Due reminders (browser)** — optional Notification API alerts when a goal is **due today** or **overdue** (incomplete). Works while the tab or installed PWA has focus; no server push or background delivery (see limitations below).
- **Notes** — plain-text notes on goals and subtasks; included in search and exports (JSON / CSV / PDF).
- **Subtasks** — add, toggle (optimistic), delete; optional effort (1–5) for weighted progress.
- **Progress** — equal weight by default; effort-weighted when any subtask has effort set.
- **Search & tabs** — search titles, descriptions, **notes**, and subtask titles; filters (All · Active · Done · Archived).
- **Celebrations** — Lottie milestone overlay, confetti, optional sounds (`localStorage`).
- **Export** — JSON, CSV, and PDF (client-side only).
- **Theme** — **dark default**, optional light mode (persisted locally).
- **PWA** — icons and service worker via Vite PWA plugin (dev may unregister SW for smoother local iteration; see `vite.config` / `main.tsx`).

### UI polish (recent)

The app is **dark-first** with a shared visual language: design tokens in `src/index.css` (card vs background, muted text, dot grid), **`app-surface-input`** for elevated fields in dark mode, **`ui-section-label`** for form section labels, shared motion tuning in `src/lib/motion.ts` (`springContent`, `smoothOut`), and upgraded primitives (dialogs, alerts, tooltips, dropdowns, select, calendar, toasts). Index uses a **clipped hero** and a **narrow seam** into list content — not stacked full-bleed gradient washes over page chrome. Auth, 404, dialogs, sidebar, archive rows, and celebration overlay follow the same system.

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

- **`goals`** — `user` (relation → users), `name`, `description`, `archived` (bool), `sort_order` (number), plus optional **`due_date`** (type **date**), optional **`emoji`** (type **text**), and optional **`notes`** (type **text** — plain text only).

- **`subtasks`** — `goal` (relation → goals), `name`, `completed` (bool), `effort` (number, optional), optional **`notes`** (type **text**).

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
  hooks/          # useAuth, useGoals, useDueNotifications
  lib/            # pocketbase client, goalUtils, dueDateUtils, due notifications, export, sounds
  pages/          # Index, Login, Register, NotFound
  providers/      # ThemeProvider (next-themes)
  types/          # Goal, Subtask
```

Internal product notes and roadmap live in **`CLAUDE.md`** (for contributors / AI context).

### Due reminders (limitations)

Browser notifications require **permission** and work best on **HTTPS** or **localhost**. When a reminder fires you also see a **message at the top of the page** in the tab you’re using (helps when the OS banner is brief, or you use Brave here but allowed Safari elsewhere). Alerts run for goals **due today** or **past due** that are **not finished** (progress under 100% if they have subtasks). Checks about **every minute** and when you refocus the tab. **At most one reminder per goal per day.**

If you turned reminders on **before your goals finished loading**, an older version could miss the first check until you came back to the tab—that bug is fixed, and failed system alerts no longer block retries the way they used to.

Still no alert? Confirm the bell is **on** (filled bell), the goal has a **due date** set on the goal, and it’s **not** already **100% complete**. If you already got a reminder for that goal **today**, you won’t see another until **tomorrow** (stored in the browser).

### Phase E — production readiness (ops & trust)

Phase E is the **must-have pass** before treating the stack as production-grade: expose the app and API **safely**, recover from failure, and avoid shipping foot-guns. Detailed checklist and rationale live in **`CLAUDE.md`** → *Phase E — production readiness*. Summary:

| Area | What to do |
| --- | --- |
| **TLS** | Serve the **static app** and **PocketBase** over **HTTPS** in production. No secrets or session cookies over plain HTTP. |
| **Expose API safely** | Put PocketBase **behind a reverse proxy** (Caddy, nginx, Traefik, Cloudflare Tunnel) with TLS. Prefer **not** publishing `8090` directly to the internet. Lock **Admin UI** (`/_/`): strong password, 2FA if available, **IP allowlist** or **VPN-only** admin, or admin on a non-public bind. |
| **CORS / origins** | In PocketBase, set allowed origins to your **real frontend origin(s)** only (not `*` in production). |
| **API rules** | Re-audit **`goals`** and **`subtasks`** rules so users can **only** read/write their own rows (`@request.auth.id` vs `user` / relation). Never rely on “security by obscurity.” |
| **Secrets** | Only **`VITE_POCKETBASE_URL`** (and other `VITE_*`) go in the frontend bundle — they are **public**. No service keys in the browser. |
| **Backups & restore** | Schedule **automated backups** of PocketBase **`pb_data`** (and config) to encrypted off-site storage; **test a restore** periodically. |
| **Account / password recovery** | Today, sign-up uses a **synthetic email** (`{username}@goaltracker.local`), so built-in **“forgot password” email flows do not work** unless you add a **real email** on users or a **manual/support** reset path. Plan explicitly before inviting non-technical users. |
| **Rate limiting & abuse** | Consider a proxy/WAF rules or PocketBase hooks for login/register throttling on a public deployment. |
| **Dependencies** | `npm audit`, pin majors where sensible, rebuild after security advisories. |
| **Headers** | HSTS, sensible **CSP** (tighten over time), `X-Frame-Options` / `frame-ancestors` if you host the app yourself. |

Exposing **only** the static frontend while the API sits on a separate **HTTPS** hostname with **strict rules** and **no public admin** is the usual safe pattern.

---

## Deploying (overview)

- **Frontend** — static host (e.g. Cloudflare Pages); set `VITE_POCKETBASE_URL` to your live PocketBase **HTTPS** API origin at **build** time (same hostname or API subdomain—your choice, as long as CORS matches).
- **PocketBase** — self-host (Docker, NAS, VPS) **behind TLS**; do **not** leave the admin dashboard wide open on the public internet.

---

## Security notes for contributors

- **Never commit** `.env`, PocketBase **`pb_data`**, SQLite files, or a downloaded **`pocketbase_*`** folder with live data—they can contain passwords and email addresses.
- This app only exposes **`VITE_POCKETBASE_URL`** to the client. Treat PocketBase API rules as your real access control; the URL itself is visible in the shipped bundle.

---

## Product direction (suggestions)

Prioritized **impact** ideas (not committed work)—see **`CLAUDE.md`** for the same list aligned with V2:

1. **Categories / tags / folders** — biggest organizational win as goal count grows.  
2. **Recurring goals / habits** — retention and daily use.  
3. **Read-only share links** — show progress to others; fits PocketBase rules + token pattern.  
4. **Goal templates** — fast reuse; good effort-to-impact ratio.  
5. **Light analytics** (streaks / weekly completions) — optional Phase D–style expansion.  
6. **PWA offline + sync** — high effort; only if mobile/offline is core.  
7. **Code hygiene** — `ArchiveSection` exists but is **not wired** on `Index` (inline archive UI is used); merge or remove to avoid drift.  
8. **Email digest** — needs SMTP/Resend; complements weak browser-only reminders.  
9. **Docker / Synology deploy docs** — ops credibility for self-hosters.

---

## License

If you add a license, place it in `LICENSE` and reference it here. Until then, all rights reserved unless you state otherwise.

---

## Acknowledgements

UI primitives from [shadcn/ui](https://ui.shadcn.com/) · Backend by [PocketBase](https://pocketbase.io/).
