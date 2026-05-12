import { describe, it, expect } from 'vitest';
import { reconcileFetchedGoals } from '@/lib/reconcileFetchedGoals';
import type { Goal } from '@/types/goal';

function goal(partial: Partial<Goal> & Pick<Goal, 'id'>): Goal {
  return {
    user_id: 'u1',
    title: 't',
    description: '',
    due_date: null,
    emoji: null,
    notes: '',
    showcase_url: null,
    showcase_caption: null,
    showcase_image: null,
    is_completed: false,
    category: null,
    subtasks: [],
    ...partial,
  };
}

describe('reconcileFetchedGoals', () => {
  it('passes through when prev is empty', () => {
    const mapped = [
      goal({ id: 'a', subtasks: [{ id: 's1', goal_id: 'a', title: 'x', is_completed: false, effort: null, notes: '' }] }),
    ];
    expect(reconcileFetchedGoals([], mapped)).toEqual(mapped);
  });

  it('merges prior subtasks when fetch row drops expand but goal is not standalone-complete', () => {
    const sub = { id: 's1', goal_id: 'g1', title: 'x', is_completed: true, effort: null as number | null, notes: '' };
    const prev = [goal({ id: 'g1', subtasks: [sub] })];
    const mapped = [goal({ id: 'g1', subtasks: [], is_completed: false })];
    const out = reconcileFetchedGoals(prev, mapped);
    expect(out[0].subtasks).toEqual([sub]);
  });

  it('does not merge when mapped already has subtasks', () => {
    const subOld = { id: 's1', goal_id: 'g1', title: 'old', is_completed: true, effort: null as number | null, notes: '' };
    const subNew = { id: 's2', goal_id: 'g1', title: 'new', is_completed: false, effort: null as number | null, notes: '' };
    const prev = [goal({ id: 'g1', subtasks: [subOld] })];
    const mapped = [goal({ id: 'g1', subtasks: [subNew] })];
    expect(reconcileFetchedGoals(prev, mapped)[0].subtasks).toEqual([subNew]);
  });

  it('repairs multiple goals in one fetch', () => {
    const subA = { id: 'sa', goal_id: 'a', title: '', is_completed: true, effort: null as number | null, notes: '' };
    const subB = { id: 'sb', goal_id: 'b', title: '', is_completed: true, effort: null as number | null, notes: '' };
    const prev = [goal({ id: 'a', subtasks: [subA] }), goal({ id: 'b', subtasks: [subB] })];
    const mapped = [goal({ id: 'a', subtasks: [], is_completed: false }), goal({ id: 'b', subtasks: [], is_completed: false })];
    const out = reconcileFetchedGoals(prev, mapped);
    expect(out[0].subtasks).toEqual([subA]);
    expect(out[1].subtasks).toEqual([subB]);
  });
});
