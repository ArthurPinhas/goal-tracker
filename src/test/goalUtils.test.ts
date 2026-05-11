import { describe, it, expect } from 'vitest';
import { calcProgress, getProgressColor, isGoalComplete } from '@/lib/goalUtils';
import type { Goal, Subtask } from '@/types/goal';

const goal = (subs: Subtask[], is_completed = false): Goal => ({
  id: 'g1',
  user_id: 'u',
  title: 'G',
  description: '',
  due_date: null,
  emoji: null,
  notes: '',
  showcase_url: null,
  showcase_caption: null,
  showcase_image: null,
  is_completed,
  category: null,
  subtasks: subs,
});

const st = (id: string, done: boolean, effort: number | null = null): Subtask => ({
  id,
  goal_id: 'g1',
  title: 't',
  is_completed: done,
  effort,
  notes: '',
});

describe('calcProgress', () => {
  it('returns 0 when there are no subtasks and goal is not marked complete', () => {
    expect(calcProgress(goal([]))).toBe(0);
  });

  it('returns 100 when there are no subtasks and goal is marked complete', () => {
    expect(calcProgress(goal([], true))).toBe(100);
  });

  it('uses equal weight when no effort is set', () => {
    expect(calcProgress(goal([st('a', true), st('b', false)]))).toBe(50);
    expect(calcProgress(goal([st('a', true), st('b', true)]))).toBe(100);
  });

  it('switches to effort weighting when any subtask has effort', () => {
    // 2+2 effort, one done → 2/4 = 50%
    expect(calcProgress(goal([st('a', true, 2), st('b', false, 2)]))).toBe(50);
  });
});

describe('isGoalComplete', () => {
  it('is true for standalone completed goals', () => {
    expect(isGoalComplete(goal([], true))).toBe(true);
    expect(isGoalComplete(goal([], false))).toBe(false);
  });
  it('is true when all subtasks are done', () => {
    expect(isGoalComplete(goal([st('a', true), st('b', true)]))).toBe(true);
    expect(isGoalComplete(goal([st('a', true), st('b', false)]))).toBe(false);
  });
});

describe('getProgressColor', () => {
  it('maps bands used by the progress UI', () => {
    expect(getProgressColor(0)).toBe('#34d399');
    expect(getProgressColor(50)).toBe('#22c55e');
    expect(getProgressColor(100)).toBe('#f59e0b');
  });
});
