import type { Goal } from '@/types/goal';

/**
 * When PocketBase returns goals without expanded `subtasks_via_goal`, mapped rows look like an empty
 * checklist with `completed: false` even though those goals still have subtasks server-side. That
 * makes every checklist-complete goal briefly read as incomplete, then complete again on the next
 * consistent snapshot — mass celebration/toasts.
 *
 * If the fetch looks like that drop for one or more goals, reuse the client's prior subtasks for
 * those rows so completion/progress stay stable across refetches.
 */
export function reconcileFetchedGoals(prev: Goal[], mapped: Goal[]): Goal[] {
  const prevById = new Map(prev.map((g) => [g.id, g]));

  let suspicious = 0;
  for (const m of mapped) {
    const o = prevById.get(m.id);
    if (o && m.subtasks.length === 0 && o.subtasks.length > 0 && !m.is_completed) {
      suspicious++;
    }
  }

  if (suspicious === 0) return mapped;

  return mapped.map((m) => {
    const o = prevById.get(m.id);
    if (o && m.subtasks.length === 0 && o.subtasks.length > 0 && !m.is_completed) {
      return { ...m, subtasks: o.subtasks };
    }
    return m;
  });
}
