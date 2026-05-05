import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDueUrgency, normalizeDueDate, parseLocalDay, toLocalDayString, isIncompleteForDueDate, isDueDateToday } from '@/lib/dueDateUtils';
import type { Goal } from '@/types/goal';

const baseGoal = (overrides: Partial<Goal> & Pick<Goal, 'id'>): Goal => ({
  id: overrides.id,
  user_id: 'u',
  title: 'T',
  description: '',
  due_date: null,
  emoji: null,
  notes: '',
  subtasks: [],
  ...overrides,
});

describe('normalizeDueDate', () => {
  it('accepts PocketBase-like strings and trims to calendar day', () => {
    expect(normalizeDueDate('2027-05-13T00:00:00.000Z')).toBe('2027-05-13');
    expect(normalizeDueDate('2027-05-13')).toBe('2027-05-13');
  });
  it('accepts Date objects (e.g. SDK-deserialized)', () => {
    expect(normalizeDueDate(new Date(2027, 4, 13, 15, 30, 0))).toBe('2027-05-13');
  });
  it('returns null for empty and invalid shapes', () => {
    expect(normalizeDueDate(null)).toBeNull();
    expect(normalizeDueDate('')).toBeNull();
    expect(normalizeDueDate('not-a-date')).toBeNull();
    expect(normalizeDueDate('27-05-13')).toBeNull();
  });
});

describe('parseLocalDay / toLocalDayString', () => {
  it('round-trips stable local calendar encoding', () => {
    expect(toLocalDayString(parseLocalDay('2026-02-09'))).toBe('2026-02-09');
  });
});

describe('getDueUrgency', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const freeze = (localIso: string) => {
    vi.useFakeTimers();
    /** Local midday avoids DST edge quirks for "today" string */
    vi.setSystemTime(new Date(`${localIso}T12:00:00`));
  };

  it('returns none when incomplete is false', () => {
    freeze('2026-06-01');
    expect(getDueUrgency('2026-05-31', false)).toBe('none');
  });
  it('returns none when dueDate is null', () => {
    freeze('2026-06-01');
    expect(getDueUrgency(null, true)).toBe('none');
  });
  it('flags overdue when due date is strictly before today', () => {
    freeze('2026-06-01');
    expect(getDueUrgency('2026-05-31', true)).toBe('overdue');
  });
  it('flags soon for today through +7 calendar days inclusive', () => {
    freeze('2026-06-01');
    expect(getDueUrgency('2026-06-01', true)).toBe('soon');
    expect(getDueUrgency('2026-06-08', true)).toBe('soon');
  });
  it('returns none for far future (e.g. same month next year)', () => {
    freeze('2026-06-01');
    expect(getDueUrgency('2027-05-13', true)).toBe('none');
  });
  it('does not mark a future due date in the same year as overdue (May 21 vs May 5)', () => {
    freeze('2026-05-05');
    expect(getDueUrgency('2026-05-21', true)).toBe('none');
  });
});

describe('isIncompleteForDueDate', () => {
  it('treats empty subtasks as incomplete', () => {
    const g = baseGoal({ id: '1', subtasks: [] });
    expect(isIncompleteForDueDate(g)).toBe(true);
  });
  it('treats 100% progress as complete for due urgency', () => {
    const g = baseGoal({
      id: '1',
      subtasks: [
        { id: 's1', goal_id: '1', title: 'a', is_completed: true, effort: null, notes: '' },
      ],
    });
    expect(isIncompleteForDueDate(g)).toBe(false);
  });
});

describe('isDueDateToday', () => {
  it('is true only when the due string is local today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00'));
    expect(isDueDateToday('2026-05-15')).toBe(true);
    expect(isDueDateToday('2026-05-16')).toBe(false);
    vi.useRealTimers();
  });
});
