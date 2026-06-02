# 🎯 Goal Tracker

A self-hosted, personal goal-tracking application built to give you a sense of forward momentum. 

Unlike traditional flat to-do lists, Goal Tracker is tactile and rewarding. Break massive goals into weighted subtasks, visualize your live progress with animated momentum rings, and get celebrated with full-screen particle effects and sound cues when you finish your work.

![Goal Tracker Preview](/public/placeholder.svg) *(Replace with a screenshot of your app!)*

## ✨ Features

- **Weighted Progress:** Assign effort points (1-5) to subtasks. Completing a massive subtask moves your progress bar significantly more than a tiny one.
- **Visual Celebrations:** Satisfying micro-animations, canvas confetti, and full-screen milestone overlays reward you when you crush a goal.
- **Goal Showcases:** Finished a project? Attach an external link and an uploaded screenshot to your completed goal to build a "wall of wins".
- **Due Date Intelligence:** Set optional deadlines. Overdue and soon-to-be-due goals automatically bubble up with visual urgency cues and browser-level tab reminders.
- **Rich Organization:** Group goals into custom colored Categories, drag-and-drop to reorder, or save recurring structures as reusable Goal Templates.
- **Built for Speed:** Navigate entirely via the `Cmd+K` command palette. Massive goal libraries render instantly thanks to window-scroll virtualization.
- **Total Data Ownership:** Export your data to JSON, CSV, or PDF instantly from the browser. 

## 🛠 Tech Stack

**Frontend (Client-Side Only)**
- **React 18** & **Vite** (TypeScript)
- **Tailwind CSS** & **shadcn/ui** for dark-first, premium aesthetics
- **Framer Motion** for spring physics and tactile micro-interactions

**Backend (Bring Your Own Database)**
- **PocketBase:** Goal Tracker connects to a self-hosted PocketBase instance—a single-file SQLite database that provides Auth and a REST API out of the box.

---

## 🚀 Getting Started

Goal Tracker is a purely client-side React application. It connects to a local PocketBase database that you host yourself, meaning your data never leaves your machine unless you want it to.

### 1. Set Up Your Database (PocketBase)

1. Download the PocketBase binary for your operating system from [pocketbase.io](https://pocketbase.io/docs/).
2. Extract the executable into a folder of your choosing.
3. Start your database:
   ```bash
   ./pocketbase serve
   ```
4. Open `http://127.0.0.1:8090/_/` in your browser to access the Admin UI. Create your first admin account.

### 2. Configure Database Collections

To make the app work, you must define the following collections in your PocketBase Admin UI. Make sure the API Rules restrict read/write access to `@request.auth.id` matching the `user` relation.

- **`categories`**: `user` (Relation → users), `name` (Text).
- **`goals`**: `user` (Relation → users), `name` (Text), `description` (Text), `archived` (Bool), `sort_order` (Number), `completed` (Bool), `category` (Relation → categories), `due_date` (Date), `emoji` (Text), `notes` (Text), `showcase_image` (File), `showcase_url` (Text), `showcase_caption` (Text).
- **`subtasks`**: `goal` (Relation → goals), `name` (Text), `completed` (Bool), `effort` (Number), `notes` (Text).

### 3. Spin Up the Frontend

1. Clone this repository and install dependencies:
   ```bash
   git clone https://github.com/YOUR_USERNAME/goal-tracker.git
   cd goal-tracker
   npm install
   ```

2. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `VITE_POCKETBASE_URL=http://127.0.0.1:8090` is set in this file to point to your local PocketBase instance).*

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` to start crushing your goals!

---

## 🔒 Security & Deployment

- **Public URLs:** The `VITE_POCKETBASE_URL` is intentionally bundled into the frontend application. Application security is managed entirely by your PocketBase API rules.
- **Never Commit Data:** The `.gitignore` is configured to ignore `.env` files and `pb_data` folders. Never force-commit these files to version control, as they contain your private user data.
