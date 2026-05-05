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
    archived: boolean;
    sort_order: number;
  };
  type SubRow = {
    id: string;
    goal: string;
    name: string;
    completed: boolean;
    effort: number | null;
    notes: string;
  };

  const S = {
    goals: [] as GoalRow[],
    subs: [] as SubRow[],
    gid: 1,
    sid: 1,
  };

  function reset() {
    S.goals = [];
    S.subs = [];
    S.gid = 1;
    S.sid = 1;
  }

  function rowForGetFullList(g: GoalRow, expand?: string) {
    if (expand !== 'subtasks_via_goal') return { ...g };
    return {
      ...g,
      expand: {
        subtasks_via_goal: S.subs
          .filter((s) => s.goal === g.id)
          .map((s) => ({
            id: s.id,
            goal: s.goal,
            name: s.name,
            completed: s.completed,
            effort: s.effort,
            notes: s.notes,
          })),
      },
    };
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
              user: data.user,
              sort_order: data.sort_order,
            });
            return { id };
          },
          update: async (id: string, patch: Partial<GoalRow>) => {
            const g = S.goals.find((x) => x.id === id);
            if (g) Object.assign(g, patch);
          },
          delete: async (id: string) => {
            S.goals = S.goals.filter((x) => x.id !== id);
            S.subs = S.subs.filter((s) => s.goal !== id);
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
});
