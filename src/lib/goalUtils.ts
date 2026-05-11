import { Goal } from '@/types/goal';

export const calcProgress = (goal: Goal): number => {
  if (goal.subtasks.length === 0) return goal.is_completed ? 100 : 0;
  const hasEffort = goal.subtasks.some((s) => s.effort != null && s.effort > 0);
  const completed = hasEffort
    ? goal.subtasks.filter((s) => s.is_completed).reduce((sum, s) => sum + (s.effort || 1), 0)
    : goal.subtasks.filter((s) => s.is_completed).length;
  const total = hasEffort
    ? goal.subtasks.reduce((sum, s) => sum + (s.effort || 1), 0)
    : goal.subtasks.length;
  return total > 0 ? (completed / total) * 100 : 0;
};

/** Done: all subtasks complete, or no subtasks and marked complete on the goal. */
export function isGoalComplete(goal: Goal): boolean {
  if (goal.subtasks.length === 0) return goal.is_completed;
  return calcProgress(goal) >= 100;
}

export const getProgressColor = (pct: number): string => {
  if (pct >= 100) return '#f59e0b';
  if (pct >= 50) return '#22c55e';
  return '#34d399';
};
