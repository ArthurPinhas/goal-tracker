import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGoals } from '@/hooks/useGoals';

/** In-memory store mimicking goals + subtasks collections used by `useGoals`. */
const { pb: mockPb, resetPocketBaseMock } = vi.hoisted(() => {
  type GoalRow = {
    id: string;
    user: string;
    name: string;
    description: string;
    due_date: string | null;
    emoji: string | null;
    notes: string | null;
    showcase_url: string | null;
    showcase_caption: string | null;
    showcase_image: string | null;
    archived: boolean;
    sort_order: number;
    completed: boolean;
    category: string | null;
  };
  type SubRow = {
    id: string;
    goal: string;
    name: string;
    completed: boolean;
    effort: number | null;
    notes: string;
  };
  type CatRow = { id: string; user: string; name: string };

  const S = {
    goals: [] as GoalRow[],
    subs: [] as SubRow[],
    cats: [] as CatRow[],
    gid: 1,
    sid: 1,
    cid: 1,
  };

  function reset() {
    S.goals = [];
    S.subs = [];
    S.cats = [];
    S.gid = 1;
    S.sid = 1;
    S.cid = 1;
  }

  function rowForGetFullList(g: GoalRow, expand?: string) {
    if (!expand) return { ...g };
    const parts = expand.split(',').map((p) => p.trim());
    const out: Record<string, unknown> = { ...g };
    const exp: Record<string, unknown> = {};
    if (parts.includes('subtasks_via_goal')) {
      exp.subtasks_via_goal = S.subs
        .filter((s) => s.goal === g.id)
        .map((s) => ({
          id: s.id,
          goal: s.goal,
          name: s.name,
          completed: s.completed,
          effort: s.effort,
          notes: s.notes,
        }));
    }
    if (parts.includes('category') && g.category) {
      const c = S.cats.find((x) => x.id === g.category);
      if (c) exp.category = { id: c.id, name: c.name };
    }
    if (Object.keys(exp).length > 0) out.expand = exp;
    return out;
  }

  const pb = {
    authStore: { record: { id: 'user-1' } },
    collection(name: string) {
      if (name === 'goals') {
        return {
          getFullList: async (opts: { expand?: string }) => S.goals.map((g) => rowForGetFullList(g, opts.expand)),
          create: async (data: {
            name: string;
            description: string;
            due_date: string | null;
            emoji: string | null;
            notes?: string | null;
            user: string;
            sort_order: number;
            completed?: boolean;
            category?: string | null;
          }) => {
            const id = `g${S.gid++}`;
            S.goals.push({
              id,
              archived: false,
              name: data.name,
              description: data.description,
              due_date: data.due_date,
              emoji: data.emoji ?? null,
              notes: data.notes ?? null,
              showcase_url: null,
              showcase_caption: null,
              showcase_image: null,
              user: data.user,
              sort_order: data.sort_order,
              completed: data.completed ?? false,
              category: data.category ?? null,
            });
            return { id };
          },
          update: async (id: string, patch: Partial<GoalRow>) => {
            const g = S.goals.find((x) => x.id === id);
            if (g) Object.assign(g, patch);
            const row = S.goals.find((x) => x.id === id);
            return row ? { ...row } : {};
          },
          delete: async (id: string) => {
            S.goals = S.goals.filter((x) => x.id !== id);
            S.subs = S.subs.filter((s) => s.goal !== id);
          },
        };
      }
      if (name === 'categories') {
        return {
          getFullList: async () => [...S.cats].sort((a, b) => a.name.localeCompare(b.name)),
          create: async (data: { name: string; user: string }) => {
            const id = `c${S.cid++}`;
            S.cats.push({ id, user: data.user, name: data.name });
            return { id };
          },
        };
      }
      if (name === 'subtasks') {
        return {
          create: async (data: { name: string; goal: string; completed: boolean; notes?: string | null }) => {
            const id = `s${S.sid++}`;
            S.subs.push({
              id,
              goal: data.goal,
              name: data.name,
              completed: data.completed,
              effort: null,
              notes: (data.notes ?? '') || '',
            });
            return { id };
          },
          update: async (id: string, patch: Partial<Pick<SubRow, 'completed' | 'effort' | 'notes'>>) => {
            const s = S.subs.find((x) => x.id === id);
            if (s) Object.assign(s, patch);
          },
          delete: async (id: string) => {
            S.subs = S.subs.filter((x) => x.id !== id);
          },
        };
      }
      throw new Error(`unknown collection: ${name}`);
    },
  };

  return { pb, resetPocketBaseMock: reset };
});

vi.mock('@/lib/pocketbase', () => ({ default: mockPb }));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function hook() {
  return renderHook(() => useGoals());
}

describe('useGoals (CRUD sanity)', () => {
  beforeEach(() => {
    resetPocketBaseMock();
    vi.clearAllMocks();
  });

  it('persists emoji on create', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('Emoji goal', '', null, '🎯');
    });

    await waitFor(() => {
      expect(result.current.goals[0].emoji).toBe('🎯');
    });
  });

  it('loads then creates a goal and refetches', async () => {
    const { result } = hook();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goals).toEqual([]);

    await act(async () => {
      await result.current.createGoal('Alpha', 'First goal', null);
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].title).toBe('Alpha');
      expect(result.current.goals[0].description).toBe('First goal');
      expect(result.current.saveStatus).toBe('saved');
    });
  });

  it('updates a goal (edit)', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('Old', '', null);
    });
    const id = result.current.goals[0].id;

    await act(async () => {
      await result.current.editGoal(id, 'New title', 'New desc', null);
    });

    await waitFor(() => {
      expect(result.current.goals[0].title).toBe('New title');
      expect(result.current.goals[0].description).toBe('New desc');
    });
  });

  it('persists showcase link and caption on edit', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('Done goal', '', null);
    });
    const id = result.current.goals[0].id;

    await act(async () => {
      await result.current.editGoal(
        id,
        'Done goal',
        '',
        null,
        null,
        '',
        null,
        'https://example.com/win',
        'Live demo'
      );
    });

    await waitFor(() => {
      expect(result.current.goals[0].showcase_url).toBe('https://example.com/win');
      expect(result.current.goals[0].showcase_caption).toBe('Live demo');
    });
  });

  it('deletes a goal', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('To delete', '', null);
    });
    const id = result.current.goals[0].id;

    await act(async () => {
      await result.current.deleteGoal(id);
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(0);
    });
  });

  it('adds a subtask and completes it (toggle)', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('With steps', '', null);
    });
    const goalId = result.current.goals[0].id;

    await act(async () => {
      await result.current.addSubtask(goalId, 'Step one');
    });

    await waitFor(() => {
      expect(result.current.goals[0].subtasks).toHaveLength(1);
      expect(result.current.goals[0].subtasks[0].title).toBe('Step one');
    });

    const subId = result.current.goals[0].subtasks[0].id;
    expect(result.current.goals[0].subtasks[0].is_completed).toBe(false);

    await act(async () => {
      await result.current.toggleSubtask(goalId, subId);
    });

    await waitFor(() => {
      expect(result.current.goals[0].subtasks[0].is_completed).toBe(true);
    });
  });

  it('removes a subtask', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('G', '', null);
    });
    await waitFor(() => expect(result.current.goals).toHaveLength(1));
    const goalId = result.current.goals[0].id;

    await act(async () => {
      await result.current.addSubtask(goalId, 'Only step');
    });
    await waitFor(() => expect(result.current.goals[0].subtasks).toHaveLength(1));

    const subId = result.current.goals[0].subtasks[0].id;

    await act(async () => {
      await result.current.deleteSubtask(subId);
    });

    await waitFor(() => {
      expect(result.current.goals[0].subtasks).toHaveLength(0);
    });
  });

  it('updates subtask notes', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('G', '', null);
    });
    const goalId = result.current.goals[0].id;

    await act(async () => {
      await result.current.addSubtask(goalId, 'Task', 'alpha');
    });

    const subId = result.current.goals[0].subtasks[0].id;
    expect(result.current.goals[0].subtasks[0].notes).toBe('alpha');

    await act(async () => {
      await result.current.updateSubtaskNotes(subId, 'beta');
    });

    await waitFor(() => {
      expect(result.current.goals[0].subtasks[0].notes).toBe('beta');
    });
  });

  it('archives and restores a goal', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('Archivable', '', null);
    });
    const id = result.current.goals[0].id;

    await act(async () => {
      await result.current.archiveGoal(id);
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(0);
      expect(result.current.archivedGoals).toHaveLength(1);
      expect(result.current.archivedGoals[0].title).toBe('Archivable');
    });

    await act(async () => {
      await result.current.restoreGoal(id);
    });

    await waitFor(() => {
      expect(result.current.archivedGoals).toHaveLength(0);
      expect(result.current.goals.some((g) => g.id === id)).toBe(true);
    });
  });

  it('toggles standalone goal complete (no subtasks)', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('Solo', '', null);
    });
    const id = result.current.goals[0].id;
    expect(result.current.goals[0].is_completed).toBe(false);

    await act(async () => {
      await result.current.toggleGoalStandaloneComplete(id);
    });
    await waitFor(() => {
      expect(result.current.goals[0].is_completed).toBe(true);
    });

    await act(async () => {
      await result.current.toggleGoalStandaloneComplete(id);
    });
    await waitFor(() => {
      expect(result.current.goals[0].is_completed).toBe(false);
    });
  });

  it('clears goal completed flag when adding a subtask after standalone complete', async () => {
    const { result } = hook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal('Both', '', null);
    });
    const goalId = result.current.goals[0].id;

    await act(async () => {
      await result.current.toggleGoalStandaloneComplete(goalId);
    });
    await waitFor(() => expect(result.current.goals[0].is_completed).toBe(true));

    await act(async () => {
      await result.current.addSubtask(goalId, 'Step');
    });
    await waitFor(() => {
      expect(result.current.goals[0].subtasks).toHaveLength(1);
      expect(result.current.goals[0].is_completed).toBe(false);
    });
  });
});
