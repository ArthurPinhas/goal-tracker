export interface Subtask {
  id: string;
  milestone_id: string;
  title: string;
  is_completed: boolean;
}

export interface Milestone {
  id: string;
  user_id: string;
  title: string;
  description: string;
  subtasks: Subtask[];
}
