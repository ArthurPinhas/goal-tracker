export interface Subtask {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  effort: number | null;
  /** Plain-text notes for this subtask */
  notes: string;
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
  subtasks: Subtask[];
}
