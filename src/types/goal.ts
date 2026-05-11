export interface Subtask {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  effort: number | null;
  /** Plain-text notes for this subtask */
  notes: string;
}

/** User-defined bucket for organizing goals (PocketBase `categories`). */
export interface GoalCategory {
  id: string;
  name: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  /** Calendar date `YYYY-MM-DD`, or null if unset */
  due_date: string | null;
  /** Optional display emoji — keyword-suggested or user-picked in goal dialogs */
  emoji: string | null;
  /** Plain-text private notes (not the short description) */
  notes: string;
  /**
   * Optional external link celebrating the finished outcome (demo, video, article).
   * Only meaningful for completed goals; edited in the goal dialog when done.
   */
  showcase_url: string | null;
  /** Optional short line shown above the link (e.g. “Open mic recording”). */
  showcase_caption: string | null;
  /** Optional uploaded image filename (PocketBase `showcase_image` file field). */
  showcase_image: string | null;
  /** When there are no subtasks, marks the goal done without checklist items (PocketBase `completed`). */
  is_completed: boolean;
  /** Optional folder (PocketBase `category` → categories) */
  category: GoalCategory | null;
  subtasks: Subtask[];
}

/** Optional file/remove flags passed with `editGoal` when updating showcase. */
export type GoalShowcaseFileOptions = {
  showcaseImageFile?: File | null;
  removeShowcaseImage?: boolean;
};
