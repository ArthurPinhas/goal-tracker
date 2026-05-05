import { addDays } from 'date-fns';
import type { Goal } from '@/types/goal';
import { calcProgress } from '@/lib/goalUtils';

export type DueUrgency = 'none' | 'soon' | 'overdue';

export function normalizeDueDate(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  const s = String(raw);
  const d = s.length >= 10 ? s.slice(0, 10) : s;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return d;
}

export function parseLocalDay(isoDay: string): Date {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toLocalDayString(d: Date): string {
  const y = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${month}-${day}`;
}

/** Goals with no subtasks or progress &lt; 100% — due urgency applies. */
export function isIncompleteForDueDate(goal: Goal): boolean {
  if (goal.subtasks.length === 0) return true;
  return calcProgress(goal) < 100;
}

export function getDueUrgency(dueDate: string | null, incomplete: boolean): DueUrgency {
  if (!dueDate || !incomplete) return 'none';
  const todayStr = toLocalDayString(new Date());
  /** Lexical order matches calendar order for canonical `YYYY-MM-DD` strings — avoids TZ edge cases vs `differenceInCalendarDays`. */
  if (dueDate < todayStr) return 'overdue';
  const weekOutStr = toLocalDayString(addDays(parseLocalDay(todayStr), 7));
  if (dueDate <= weekOutStr) return 'soon';
  return 'none';
}

export function formatDueChip(isoDay: string): string {
  const due = parseLocalDay(isoDay);
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
