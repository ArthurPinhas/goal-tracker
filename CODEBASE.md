# Milestone Mapper — Codebase Guide

> Written for a QA / automation engineer with C# background and no frontend experience.
> No line-by-line commentary — enough to understand what everything does, why it exists, and how the pieces connect.

---

## Table of Contents

1. [What This App Is](#1-what-this-app-is)
2. [The Two Processes](#2-the-two-processes)
3. [Stack Comparison — This App vs C# / .NET](#3-stack-comparison)
4. [TypeScript for C# Developers](#4-typescript-for-c-developers)
5. [How React Works](#5-how-react-works)
6. [File Structure](#6-file-structure)
7. [The Data Model](#7-the-data-model)
8. [How Data Flows](#8-how-data-flows)
9. [PocketBase — The Database](#9-pocketbase)
10. [Tailwind CSS — Styling](#10-tailwind-css)
11. [Component Architecture](#11-component-architecture)
12. [Hooks — Shared Logic](#12-hooks)
13. [Framer Motion — Animations](#13-framer-motion)
14. [Progress Calculation Logic](#14-progress-calculation)
15. [Key Files Reference](#15-key-files-reference)

---

## 1. What This App Is

A personal goal tracker. You break goals into weighted subtasks, see a live progress bar, and get visual + sound rewards as you make progress. The core idea: unlike flat todo lists, every goal has a sense of forward momentum.

```
┌──────────────────────────────────────────────────────┐
│                 Your Browser (localhost:3000)          │
│                                                        │
│  Login / Register → Main Page (Index)                 │
│  ├─ Goal cards with subtasks + progress bars           │
│  ├─ Sidebar with stats + analytics                     │
│  ├─ Filters: Active / Done / Archived / On Display     │
│  └─ Celebration overlay + sound on goal completion     │
└──────────────────────────┬───────────────────────────┘
                           │ direct SDK calls (no middle server)
                           ▼
┌──────────────────────────────────────────────────────┐
│            PocketBase (localhost:8090)                 │
│  SQLite database + REST API + auth + admin UI          │
│  Collections: users, goals, subtasks, categories       │
└──────────────────────────────────────────────────────┘
```

**Key difference from Platisfaction:** There is no server in between. The browser talks directly to PocketBase. In Platisfaction, SvelteKit had its own server that called PocketBase. Here, the React app calls PocketBase directly using the PocketBase JavaScript SDK.

---

## 2. The Two Processes

Every dev session needs both running:

```bash
# Terminal 1 — Frontend
npm run dev            # http://localhost:3000

# Terminal 2 — Backend (path to binary as you keep it locally)
./pocketbase serve     # http://127.0.0.1:8090
```

| Process | Port | What it does |
|---|---|---|
| **Vite (React)** | 3000 | Serves the UI in the browser |
| **PocketBase** | 8090 | Stores all data. Admin UI at `http://localhost:8090/_/` |

If PocketBase isn't running, the app loads but shows no data (or "Cannot reach server" toast).

---

## 3. Stack Comparison

| This App | C# / .NET Equivalent | Notes |
|---|---|---|
| **TypeScript** | C# | Same idea — typed language; compiles to JavaScript |
| **React** | Razor Pages / Blazor | UI framework — renders components into the browser DOM |
| **Vite** | MSBuild / dotnet build | Builds and bundles the frontend; also runs the dev server |
| **Tailwind CSS** | CSS utility classes | Inline class names instead of separate CSS files |
| **Shadcn UI** | DevExpress / Telerik | Pre-built accessible UI components (Button, Dialog, Calendar…) |
| **PocketBase** | SQLite + EF Core + Swagger | One binary: database + REST API + admin panel |
| **PocketBase JS SDK** | HttpClient + Newtonsoft | Calls PocketBase from browser code |
| **npm** | NuGet | Package manager |
| **`package.json`** | `.csproj` | Lists dependencies and scripts |
| **Framer Motion** | *(no equivalent)* | Animation library |
| **react-hot-toast** | *(no equivalent)* | In-app toast notifications |
| **`@tanstack/react-virtual`** | UI virtualization | Renders only visible rows in very long lists |

---

## 4. TypeScript for C# Developers

TypeScript is C# with different syntax. The logic maps almost directly.

### Variable Declaration

```typescript
// C#:
string name = "Arthur";
int count = 42;
bool isDone = false;

// TypeScript:
let name: string = "Arthur";   // type comes AFTER the variable
let count: number = 42;        // number = both int and float
let isDone: boolean = false;
```

### Types / Interfaces

```typescript
// C#:
public class Goal {
    public string Title { get; set; }
    public bool IsCompleted { get; set; }
    public List<Subtask> Subtasks { get; set; }
}

// TypeScript interface (read-only contract, no methods):
interface Goal {
    title: string;
    is_completed: boolean;
    subtasks: Subtask[];   // Subtask[] = List<Subtask>
}
```

### Nullable

```typescript
// C#:    string? dueDate
// TS:    string | null

let dueDate: string | null = null;
```

### Async / Await — IDENTICAL concept

```typescript
// C#:
public async Task SaveGoal(Goal goal) {
    await repository.SaveAsync(goal);
}

// TypeScript:
async function saveGoal(goal: Goal): Promise<void> {
    await pb.collection('goals').create(goal);
    // Promise<void> = Task in C#
}
```

### LINQ Equivalents

```typescript
// C# LINQ                          TypeScript array methods
// ─────────────────────────────────────────────────────────
// .Where(s => s.IsCompleted)    →  .filter(s => s.is_completed)
// .Select(s => s.Title)         →  .map(s => s.title)
// .OrderBy(g => g.SortOrder)    →  .sort((a, b) => a.sort_order - b.sort_order)
// .FirstOrDefault()             →  .find(g => condition)
// .Any(s => s.Effort != null)   →  .some(s => s.effort != null)
// .All(s => s.IsCompleted)      →  .every(s => s.is_completed)
// .Count()                      →  .length
// .Sum(s => s.Effort)           →  .reduce((sum, s) => sum + (s.effort ?? 0), 0)

const completedSubtasks = subtasks.filter(s => s.is_completed);
const totalEffort = subtasks.reduce((sum, s) => sum + (s.effort ?? 1), 0);
```

### Arrow Functions

```typescript
// C# lambda:
Func<Goal, bool> isActive = g => !g.IsCompleted;

// TypeScript arrow function:
const isActive = (g: Goal) => !g.is_completed;
```

---

## 5. How React Works

React is a UI library. You describe what the screen should look like based on data, and React updates the DOM whenever data changes.

### A Component Is a Function That Returns HTML

```typescript
// GoalProgress.tsx — simplified
function GoalProgress({ percent }: { percent: number }) {
    //                  ↑ this is the "prop" — like a parameter passed in from the parent

    return (
        <div className="h-2 bg-gray-700 rounded-full">
            <div
                className="h-2 bg-green-400 rounded-full"
                style={{ width: `${percent}%` }}
            />
        </div>
    );
}

// Usage in a parent component (like passing data to a partial in Razor):
<GoalProgress percent={75} />
```

### JSX — HTML Inside TypeScript

The `return (...)` section uses **JSX** — it looks like HTML but is TypeScript. Key rules:

```typescript
// String interpolation:
<span>{goal.title}</span>             // like @Model.Title in Razor

// Conditional rendering (if/else):
{goal.due_date && <span>Due: {goal.due_date}</span>}
// — only renders the span if due_date is not null

// Loops (rendering a list):
{goal.subtasks.map(subtask => (
    <SubtaskItem key={subtask.id} subtask={subtask} />
))}
// — like @foreach in Razor; key={} = unique ID React needs to track each item

// CSS class (NOT className in HTML — React uses className):
<div className="flex items-center gap-2">
```

### State — Data That Can Change

```typescript
// useState: declare a value that, when changed, re-renders the component
const [isOpen, setIsOpen] = useState(false);

// Read: isOpen
// Change: setIsOpen(true)  ← triggers re-render automatically

// Think of it as:
// C#: private bool _isOpen; public bool IsOpen { get => _isOpen; set { _isOpen = value; OnPropertyChanged(); } }
```

### useEffect — Run Code When Data Changes

```typescript
// Runs once on component mount (like a constructor):
useEffect(() => {
    fetchGoals();
}, []);  // ← empty array = "run once"

// Runs whenever `searchQuery` changes:
useEffect(() => {
    filterGoals(searchQuery);
}, [searchQuery]);  // ← like a property change listener
```

---

## 6. File Structure

```
milestone-mapper/
│
├── .env                    ← Your secrets (gitignored — NEVER commit)
├── .env.example            ← Template: copy to .env and fill in PocketBase URL
├── package.json            ← Like .csproj — dependencies and npm scripts
├── vite.config.ts          ← Build tool config (port 3000, PWA plugin)
├── tailwind.config.ts      ← Tailwind theme extensions
├── CLAUDE.md               ← AI assistant reference (rules, schema, decisions)
├── CODEBASE.md             ← This file
│
└── src/
    ├── main.tsx            ← App entry point (like Program.cs)
    ├── App.tsx             ← Root component: routing + toast providers
    ├── index.css           ← Global CSS tokens (dark/light theme variables)
    │
    ├── types/
    │   └── goal.ts         ← TypeScript interfaces: Goal, Subtask, GoalCategory
    │
    ├── lib/                ← Pure utility functions (no UI — like a Class Library)
    │   ├── pocketbase.ts       → PocketBase client singleton
    │   ├── goalUtils.ts        → calcProgress(), isGoalComplete(), getProgressColor()
    │   ├── dueDateUtils.ts     → due date parsing, urgency (overdue / soon / none)
    │   ├── categoryColor.ts    → stable color per category ID (8-variant palette)
    │   ├── motion.ts           → shared Framer Motion spring/easing presets
    │   ├── sounds.ts           → sound effect helpers (toggleable, localStorage)
    │   ├── exportGoals.ts      → JSON / CSV / PDF export (runs in browser only)
    │   ├── goalTemplates.ts    → save/apply/delete goal templates (localStorage)
    │   ├── dueNotifications.ts → browser Notification API: due reminders logic
    │   ├── motivationalCopy.ts → quotes and celebration toast messages
    │   ├── reconcileFetchedGoals.ts → merges server data with local order (drag-drop)
    │   └── linkSegments.ts     → parses plain text URLs into clickable links
    │
    ├── hooks/              ← Shared stateful logic (like services/repositories)
    │   ├── useAuth.ts          → login / register / logout state
    │   ├── useGoals.ts         → ALL goal + subtask CRUD; the main data layer
    │   ├── useDueNotifications.ts → interval check for browser due reminders
    │   ├── useGoalEmojiSuggest.ts → debounced emoji suggestion while typing title
    │   └── useResponsiveUI.ts  → screen size breakpoints, animation quality tier
    │
    ├── components/         ← UI building blocks
    │   ├── ui/                 → Shadcn primitives (Button, Dialog, Input, Calendar…)
    │   │                         These are pre-built — don't edit unless necessary
    │   │
    │   ├── GoalCard.tsx        → The main goal row: title, progress, subtasks, due date
    │   ├── SubtaskItem.tsx     → Individual subtask row with checkbox, rename, notes
    │   ├── GoalProgress.tsx    → The progress bar component
    │   ├── GoalSidebar.tsx     → Desktop sidebar: stats ring, analytics, export button
    │   ├── StickyHeader.tsx    → Scroll-activated top bar
    │   ├── AddGoalDialog.tsx   → "New goal" modal form
    │   ├── EditGoalDialog.tsx  → "Edit goal" modal form (same fields + showcase)
    │   ├── AddSubtaskDialog.tsx → "Add subtask" modal form
    │   ├── ManageCategoriesDialog.tsx → Rename/delete category folders
    │   ├── ExportDialog.tsx    → Export modal (JSON / CSV / PDF)
    │   ├── CommandPalette.tsx  → Cmd+K quick-action palette
    │   ├── TemplatesDialog.tsx → Save/apply/delete saved goal templates
    │   ├── CelebrationOverlay.tsx → Full-screen animation on goal completion
    │   ├── HeroShowcaseStrip.tsx  → "On display" row — completed goals with showcase
    │   ├── GoalShowcaseBlock.tsx  → Showcase section inside a completed goal card
    │   ├── ShowcaseQuickDialog.tsx → Quick edit showcase URL/image when goal is done
    │   ├── VirtualWindowGoalList.tsx → Virtualized list for 10+ goals (performance)
    │   ├── EmptyState.tsx      → "No goals yet" illustration + message
    │   ├── SkeletonGoalCard.tsx → Loading placeholder cards
    │   ├── ThemeToggle.tsx     → Light/dark mode button
    │   ├── DueNotificationToggle.tsx → Bell button: enable/disable browser reminders
    │   └── micro/MicroGlyphs.tsx   → Small decorative SVG animations (sprout, etc.)
    │
    ├── pages/              ← Full page components (one per route)
    │   ├── Index.tsx           → Main goals page (the whole app lives here)
    │   ├── Login.tsx           → Login form
    │   ├── Register.tsx        → Register form
    │   └── NotFound.tsx        → 404 page
    │
    ├── providers/
    │   └── ThemeProvider.tsx   → Wraps next-themes; gives dark/light to all children
    │
    └── test/               ← Vitest unit tests
        ├── dueDateUtils.test.ts
        ├── goalUtils.test.ts
        ├── useGoals.test.tsx
        └── ...
```

---

## 7. The Data Model

This is what gets stored in PocketBase. Think of each "collection" as a database table.

```
┌──────────────────────────────────────────────────────────────────────┐
│  users (PocketBase built-in auth)                                     │
│  id | email (format: username@goaltracker.local) | name               │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ 1 user → many goals
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  goals                                                                │
│  id | user | name | description | due_date | emoji | notes           │
│  showcase_url | showcase_caption | showcase_image                     │
│  completed | archived | sort_order | category (→ categories)          │
└────────────┬────────────────────────────────────────────────────────┘
             │ 1 goal → many subtasks          │ optional
             ▼                                 ▼
┌──────────────────────┐         ┌─────────────────────────┐
│  subtasks            │         │  categories              │
│  id | goal | name    │         │  id | user | name        │
│  completed | effort  │         │  (folder labels for goals)│
│  notes               │         └─────────────────────────┘
└──────────────────────┘
```

### What each field does

**Goal:**
| Field | Type | Purpose |
|---|---|---|
| `name` | text | The goal title |
| `description` | text | Short summary shown on the card |
| `due_date` | date | Optional deadline (`YYYY-MM-DD`) |
| `emoji` | text | Optional emoji shown next to the title |
| `notes` | text | Private plain-text notes (longer than description) |
| `completed` | bool | Used only for goals with NO subtasks — marks it done manually |
| `archived` | bool | Hides from active list; shows in Archive tab |
| `sort_order` | number | Drag-and-drop position. New goals get a large negative number so they appear first |
| `category` | relation | Optional link to a `categories` row (folder) |
| `showcase_url` | text | Link celebrating completion (e.g. a demo or video) |
| `showcase_caption` | text | Short label above the showcase link |
| `showcase_image` | file | Uploaded screenshot for a completed goal |

**Subtask:**
| Field | Purpose |
|---|---|
| `name` | The subtask title |
| `completed` | Checked or not |
| `effort` | Optional 1–5 weight. If any subtask has effort set, progress is effort-weighted |
| `notes` | Optional plain-text notes on this specific step |

---

## 8. How Data Flows

### On App Load

```
Browser opens localhost:3000
    │
    ▼
main.tsx — entry point, mounts <App />
    │
    ▼
App.tsx — sets up routing; detects auth state
    │
    ├─ Not logged in → /login page
    │
    └─ Logged in → Index.tsx (main page)
            │
            ▼
    useGoals() hook runs
            │  calls PocketBase: getFullList('goals') with subtasks + categories expanded
            ▼
    goals state populated → GoalCard components render
```

### Creating a Goal

```
User fills out AddGoalDialog and clicks Save
    │
    ▼
createGoal() in useGoals hook
    │  calls pb.collection('goals').create({ name, description, ... })
    ▼
PocketBase writes to SQLite
    │
    ▼
fetchGoals() called → updated list returned
    │
    ▼
React re-renders — new card appears at the top of the list
    │
    ▼
"Saved" status indicator flashes bottom-right
```

### Checking Off a Subtask (Optimistic UI)

This one is worth understanding because it's clever:

```
User clicks subtask checkbox
    │
    ▼
toggleSubtask() in useGoals:
    │
    ├─ 1. Immediately flips the checkbox in React state (instant feedback — no waiting)
    │
    ├─ 2. Checks: "did this complete the whole goal?"
    │      If yes → plays sound + queues celebration overlay
    │
    ├─ 3. Calls PocketBase in the background to persist the change
    │
    └─ If PocketBase call fails → reverts the checkbox back + shows error toast
                                   (this is "optimistic UI" — assume success, revert on failure)
```

### Drag-and-Drop Reorder

```
User drags a goal card to a new position
    │
    ▼
Framer Motion Reorder component updates the local array order immediately
    │
    ▼
reorderGoals() writes new sort_order (0, 1, 2...) to PocketBase for each card
    │
    ▼
Next time goals are fetched, PocketBase returns them in the new order
```

### Auth Flow

```
Register page:
    username entered → converted to username@goaltracker.local
    → pb.collection('users').create({ email, password, name })
    → auto-login
    → navigate to /

Login page:
    same email conversion
    → pb.collection('users').authWithPassword(email, password)
    → PocketBase returns a JWT token; SDK stores it in localStorage automatically
    → navigate to /

Logout:
    → pb.authStore.clear()  (removes the token from localStorage)
    → ProtectedRoute detects no user → redirects to /login
```

---

## 9. PocketBase

PocketBase is a single binary (`./pocketbase`) that gives you an entire backend:
- A SQLite database
- A REST API (auto-generated from your collections)
- An admin web UI at `http://localhost:8090/_/`
- Auth (users, JWT tokens, permissions)

### Admin UI

Visit `http://localhost:8090/_/` while PocketBase is running. You can browse all collections (like tables), view and edit individual records, change schema. Use this to verify data is actually being saved.

### How Queries Work

```typescript
import pb from '@/lib/pocketbase';

// SELECT * FROM goals WHERE archived = false, with subtasks + category joined
const records = await pb.collection('goals').getFullList({
    expand: 'subtasks_via_goal,category',  // "join" related data
    sort: 'sort_order,created',            // ORDER BY
    filter: 'archived = false',            // WHERE clause
});

// INSERT a new goal
await pb.collection('goals').create({
    name: 'Learn to cook',
    user: pb.authStore.record?.id,
    sort_order: -Date.now(),
});

// UPDATE
await pb.collection('goals').update(goalId, { completed: true });

// DELETE
await pb.collection('goals').delete(goalId);
```

### Why `expand: 'subtasks_via_goal'`?

PocketBase stores subtasks in a separate table. When you fetch goals, it doesn't automatically include the subtasks. The `expand` option tells PocketBase to JOIN and embed the related records in the same response — like using `.Include()` in Entity Framework.

`subtasks_via_goal` means: "look at the `subtasks` collection, find all rows where `goal` equals this goal's `id`."

### Security

PocketBase's "API rules" control who can read/write what. For this app, every collection has a rule that checks `@request.auth.id` — you can only see your own goals. No other user's data is ever returned.

---

## 10. Tailwind CSS

Tailwind is a CSS library where instead of writing CSS files, you add classes directly to your HTML elements. Each class does one small thing.

```typescript
// Plain CSS equivalent → Tailwind class
// display: flex        → flex
// gap: 8px             → gap-2
// background: #1f2937  → bg-gray-800
// padding: 12px 16px   → py-3 px-4
// border-radius: 8px   → rounded-lg
// font-weight: 600     → font-semibold
// color: #22c55e       → text-green-400

// Example — a button:
<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    Save Goal
</button>
// hover:bg-blue-700 = changes background on mouse hover (no separate CSS needed)
```

### Dark / Light Theme

The app supports both dark (default) and light themes. Theme tokens live in `src/index.css`:

```css
:root {
    --background: oklch(0.985 0.001 247);  /* light mode background */
}
.dark {
    --background: oklch(0.12 0.013 265);   /* dark mode background */
}
```

Tailwind classes like `bg-background` automatically pick the right value based on whether the `<html>` element has the `dark` class. `next-themes` (via `ThemeProvider`) manages switching that class.

---

## 11. Component Architecture

Components are built in layers — smallest to largest. Each component only knows about what's passed to it.

```
Index.tsx (the whole page)
    │
    ├── StickyHeader.tsx
    │       ├── ThemeToggle.tsx
    │       └── DueNotificationToggle.tsx
    │
    ├── GoalSidebar.tsx
    │       └── ExportDialog.tsx
    │
    ├── HeroShowcaseStrip.tsx   (only shows if goals have showcase)
    │
    ├── CommandPalette.tsx      (Cmd+K overlay)
    │
    ├── CelebrationOverlay.tsx  (full-screen, triggered on goal complete)
    │
    └── [list of GoalCard.tsx]  ← one per goal
            │
            ├── GoalProgress.tsx          (the progress bar)
            ├── SubtaskItem.tsx × N       (one per subtask)
            │       └── SubtaskCheckboxSpark.tsx
            ├── GoalShowcaseBlock.tsx     (only on completed goals)
            └── micro/MicroGlyphs.tsx     (decorative SVG animations)
```

### How a Component Gets Its Data

Components don't fetch data themselves. They receive it as **props** (parameters) from the parent. The parent is usually `Index.tsx`, which calls `useGoals()` and passes everything down:

```typescript
// Index.tsx — simplified
const { goals, toggleSubtask, deleteGoal } = useGoals();

return (
    <>
        {goals.map(goal => (
            <GoalCard
                key={goal.id}
                goal={goal}
                onToggleSubtask={toggleSubtask}   // passes the function down
                onDelete={deleteGoal}
            />
        ))}
    </>
);
```

```typescript
// GoalCard.tsx — receives props, never fetches directly
function GoalCard({ goal, onToggleSubtask, onDelete }) {
    return (
        <div>
            <h3>{goal.title}</h3>
            <button onClick={() => onDelete(goal.id)}>Delete</button>
            {goal.subtasks.map(s => (
                <SubtaskItem
                    subtask={s}
                    onToggle={() => onToggleSubtask(goal.id, s.id)}
                />
            ))}
        </div>
    );
}
```

---

## 12. Hooks

Hooks are functions that start with `use`. They hold logic and state that multiple components can share — like a service class in C# that components depend on.

### `useGoals` — The Main Data Layer

This is the most important file in the app (`src/hooks/useGoals.ts`). It owns all goal and subtask state, and exposes functions for every operation.

```typescript
// What useGoals returns:
const {
    goals,              // Goal[] — the list shown on screen
    categories,         // GoalCategory[] — folder labels
    loading,            // boolean — show skeleton cards?
    saveStatus,         // 'idle' | 'saving' | 'saved' | 'error' — bottom-right indicator
    archivedGoals,      // Goal[] — the archive tab

    // Create / edit / delete
    createGoal,         // (name, description, ...) => Promise<void>
    editGoal,           // (goalId, name, ...) => Promise<void>
    deleteGoal,         // (goalId) => Promise<void>
    duplicateGoal,      // (goalId) => Promise<void>
    archiveGoal,        // (goalId) => Promise<void>
    restoreGoal,        // (goalId) => Promise<void>

    // Subtasks
    addSubtask,         // (goalId, name) => Promise<void>
    toggleSubtask,      // (goalId, subtaskId) => Promise<void> ← optimistic
    deleteSubtask,      // (subtaskId) => Promise<void>
    renameSubtask,      // (subtaskId, title) => Promise<void>
    updateSubtaskEffort,// (subtaskId, effort) => Promise<void>

    // Other
    reorderGoals,       // (orderedGoals) => Promise<void> ← drag-drop persist
    flushCelebrationIntentGoalIds, // returns goal IDs that just completed (for overlay)
} = useGoals();
```

### `useAuth` — Login State

```typescript
const { user, login, register, logout } = useAuth();

// user is null when logged out, a PocketBase record when logged in
// login() / register() call PocketBase and store a JWT token automatically
```

### `useResponsiveUI` — Screen Size

```typescript
const { isMobile, celebrationQuality } = useResponsiveUI();
// celebrationQuality: 'full' | 'lite' | 'minimal'
// — reduces celebration effects on slow devices or when reduced motion is set
```

---

## 13. Framer Motion

Framer Motion is the animation library. It wraps standard HTML elements and adds animation props.

### Basic Concept

```typescript
import { motion } from 'framer-motion';

// A div that fades and slides in when it appears:
<motion.div
    initial={{ opacity: 0, y: 20 }}   // start state
    animate={{ opacity: 1, y: 0 }}    // end state
    exit={{ opacity: 0, y: -10 }}     // state when removed
    transition={{ duration: 0.3 }}
>
    Content here
</motion.div>
```

### Spring Animations

Instead of a fixed duration, springs simulate physics:

```typescript
// From src/lib/motion.ts — named spring presets used throughout the app:
const appleSpring = {
    type: "spring",
    stiffness: 400,  // higher = snappier
    damping: 34,     // higher = less bounce
    mass: 0.92,
};

<motion.div
    animate={{ x: 100 }}
    transition={appleSpring}
/>
```

### Drag-and-Drop Reorder

The goal list uses Framer Motion's `Reorder` component:

```typescript
<Reorder.Group values={goals} onReorder={setGoals}>
    {goals.map(goal => (
        <Reorder.Item key={goal.id} value={goal}>
            <GoalCard goal={goal} />
        </Reorder.Item>
    ))}
</Reorder.Group>
// Handles drag handles, touch, mouse — no extra code needed
// onReorder fires with the new sorted array whenever a drag completes
```

### AnimatePresence

Used when items are removed — lets exit animations play before the element is deleted from the DOM:

```typescript
<AnimatePresence>
    {goals.map(goal => (
        <motion.div key={goal.id} exit={{ opacity: 0 }}>
            <GoalCard goal={goal} />
        </motion.div>
    ))}
</AnimatePresence>
// When a goal is deleted, its exit animation plays, then it disappears
```

---

## 14. Progress Calculation

The progress bar logic lives in `src/lib/goalUtils.ts`:

```
Goal has NO subtasks:
    → progress = 0% unless manually marked complete → 100%

Goal has subtasks, NO effort set:
    → progress = (completed subtasks / total subtasks) × 100
    → Example: 3 of 5 done = 60%

Goal has subtasks, AT LEAST ONE has effort set:
    → progress = (sum of effort on completed subtasks / sum of all effort) × 100
    → Example: 3 subtasks with effort [1, 3, 1] — completing the effort-3 one = 3/5 = 60%
    → The "harder" subtask counts for more progress

Progress color:
    → 0–49%:  emerald green  (#34d399)
    → 50–99%: bright green   (#22c55e)
    → 100%:   amber/gold     (#f59e0b)  ← "done" state
```

---

## 15. Key Files Reference

### If Something Looks Broken

| Symptom | File(s) to check |
|---|---|
| Data doesn't load / blank goal list | `src/hooks/useGoals.ts` → `fetchGoals()` |
| "Cannot reach server" toast | PocketBase not running — `./pocketbase serve` |
| Login doesn't work | `src/hooks/useAuth.ts` → `login()` |
| Progress bar wrong | `src/lib/goalUtils.ts` → `calcProgress()` |
| Due date shows wrong urgency | `src/lib/dueDateUtils.ts` → `getDueUrgency()` |
| Celebration doesn't fire | `src/hooks/useGoals.ts` → `toggleSubtask()` + `celebrationIntentGoalIdsRef` |
| Category colors wrong | `src/lib/categoryColor.ts` → `getCategoryAccent()` |
| Export not working | `src/lib/exportGoals.ts` |
| Browser notifications not firing | `src/lib/dueNotifications.ts` + `src/hooks/useDueNotifications.ts` |
| Drag-and-drop reorder not saving | `src/hooks/useGoals.ts` → `reorderGoals()` |
| Animation feels wrong | `src/lib/motion.ts` → spring/easing presets |
| Style wrong (global / theme) | `src/index.css` |
| Style wrong (one component) | The `className` props in that component's `.tsx` file |

### If You Want to Understand a Feature

| Feature | Primary file |
|---|---|
| All goal CRUD + subtask operations | `src/hooks/useGoals.ts` |
| Main page layout + filters | `src/pages/Index.tsx` |
| Goal card (the main UI element) | `src/components/GoalCard.tsx` |
| Subtask row | `src/components/SubtaskItem.tsx` |
| Progress bar | `src/components/GoalProgress.tsx` |
| Sidebar stats + analytics | `src/components/GoalSidebar.tsx` |
| Cmd+K command palette | `src/components/CommandPalette.tsx` |
| Goal templates | `src/lib/goalTemplates.ts` |
| Celebration overlay | `src/components/CelebrationOverlay.tsx` |
| Dark/light theme | `src/providers/ThemeProvider.tsx` + `src/index.css` |
| Sound effects | `src/lib/sounds.ts` |
| Data types (Goal, Subtask) | `src/types/goal.ts` |
| PocketBase client | `src/lib/pocketbase.ts` |

### Useful npm Scripts

```bash
npm run dev      # Start the frontend dev server (port 3000)
npm run build    # Build for production (outputs to /dist)
npm run test     # Run unit tests (Vitest)
npm run lint     # TypeScript type-checking + ESLint
```
