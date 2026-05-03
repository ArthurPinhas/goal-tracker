export interface Subtask {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  effort: number | null;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  subtasks: Subtask[];
}
