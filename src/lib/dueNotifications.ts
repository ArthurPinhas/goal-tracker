import type { Goal } from '@/types/goal';
import { calcProgress } from '@/lib/goalUtils';
import {
  getDueUrgency,
  isIncompleteForDueDate,
  isDueDateToday,
  toLocalDayString,
} from '@/lib/dueDateUtils';

const LS_ENABLED = 'goal-tracker-due-notifications-enabled';
const LS_SENT = 'goal-tracker-due-notify-sent-v1';

/** How often we re-check goals for overdue / due-today while reminders are enabled. */
export const DUE_NOTIFICATION_INTERVAL_MS = 60 * 1000;

export function isDueNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(LS_ENABLED) === '1';
  } catch {
    return false;
  }
}

export function setDueNotificationsEnabled(on: boolean): void {
  try {
    localStorage.setItem(LS_ENABLED, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function getSentMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_SENT) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function markGoalsNotifiedForDay(goalIds: string[], day: string): void {
  const m = getSentMap();
  for (const id of goalIds) m[id] = day;
  try {
    localStorage.setItem(LS_SENT, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export function getBrowserNotificationSupport(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function requestDueNotificationPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  const r = await Notification.requestPermission();
  if (r === 'granted' || r === 'denied') return r;
  return 'denied';
}

export type DueReminderDeliveredPayload = { title: string; body: string };

/**
 * Browser-only reminders (tab open / PWA): overdue or due-today goals, at most once per goal per local day.
 * @param onDelivered — e.g. in-app toast in the active tab (OS banners are often brief and differ per browser).
 */
export function runDueNotificationCheck(
  goals: Goal[],
  onDelivered?: (p: DueReminderDeliveredPayload) => void
): void {
  if (typeof window === 'undefined') return;
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (!isDueNotificationsEnabled()) return;

  const todayStr = toLocalDayString(new Date());
  const sent = getSentMap();
  const pending: Goal[] = [];

  for (const g of goals) {
    if (!g.due_date) continue;
    const isComplete = calcProgress(g) >= 100 && g.subtasks.length > 0;
    if (isComplete) continue;
    if (!isIncompleteForDueDate(g)) continue;

    const overdue = getDueUrgency(g.due_date, true) === 'overdue';
    const today = isDueDateToday(g.due_date);
    if (!overdue && !today) continue;
    if (sent[g.id] === todayStr) continue;

    pending.push(g);
  }

  if (pending.length === 0) return;

  const title =
    pending.length === 1
      ? `${pending[0].emoji ? `${pending[0].emoji} ` : ''}${pending[0].title}`
      : `${pending.length} goals need attention`;

  const lines = pending.slice(0, 8).map((g) => {
    const tag = isDueDateToday(g.due_date) && getDueUrgency(g.due_date, true) !== 'overdue' ? 'Due today' : 'Overdue';
    return `${tag}: ${g.title}`;
  });
  const more = pending.length > 8 ? `\n… +${pending.length - 8} more` : '';
  const body = `${lines.join('\n')}${more}`;

  try {
    new Notification(title, {
      body,
      tag: 'goal-tracker-due',
      renotify: true,
      /** Ask the OS to keep the banner longer where supported (still brief on some systems). */
      requireInteraction: true,
    });
  } catch {
    /* Some browsers block the constructor (insecure context, etc.) — do not mark sent or the user never gets a retry. */
    return;
  }

  onDelivered?.({ title, body });

  markGoalsNotifiedForDay(
    pending.map((g) => g.id),
    todayStr
  );
}
