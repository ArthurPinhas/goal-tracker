import { differenceInCalendarDays, startOfDay } from 'date-fns';
import type { Goal } from '@/types/goal';
import { calcProgress } from '@/lib/goalUtils';

export type DueUrgency = 'none' | 'soon' | 'overdue';

export function normalizeDueDate(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object' && raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return toLocalDayString(raw);
  }
  const s = String(raw).trim();
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

/**
 * Compares due date to **local calendar today** using pure calendar-day math (not string sorting).
 * Prevents subtle TZ / formatting issues that could mis-flag a future due date as overdue.
 */
export function getDueUrgency(dueDate: string | null, incomplete: boolean): DueUrgency {
  if (!dueDate || !incomplete) return 'none';
  const due = startOfDay(parseLocalDay(dueDate));
  const today = startOfDay(new Date());
  if (Number.isNaN(due.getTime())) return 'none';
  const diff = differenceInCalendarDays(due, today);
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'soon';
  return 'none';
}

export function formatDueChip(isoDay: string): string {
  const due = parseLocalDay(isoDay);
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** True if the due date is today in the local calendar (not overdue “soon” window — literally today). */
export function isDueDateToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = startOfDay(parseLocalDay(dueDate));
  const today = startOfDay(new Date());
  if (Number.isNaN(due.getTime())) return false;
  return differenceInCalendarDays(due, today) === 0;
}
