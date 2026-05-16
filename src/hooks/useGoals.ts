import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import pb from '@/lib/pocketbase';
import { playGoalDone } from '@/lib/sounds';
import { isGoalComplete } from '@/lib/goalUtils';
import { reconcileFetchedGoals } from '@/lib/reconcileFetchedGoals';
import { Goal, GoalCategory, Subtask, GoalShowcaseFileOptions } from '@/types/goal';
import { normalizeDueDate } from '@/lib/dueDateUtils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const isNetworkError = (err: unknown): boolean =>
  err instanceof Error && (err.message === 'Failed to fetch' || err.message.includes('NetworkError'));

/** PocketBase returns 404 when the collection name does not exist on this server. */
function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status: number }).status === 404
  );
}

const normalizeEmoji = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t || null;
};

const normalizeNotes = (raw: unknown): string => (typeof raw === 'string' ? raw : '');

/** PocketBase `subtasks` rows returned via `expand: 'subtasks_via_goal'` */
type PocketBaseSubtaskRecord = {
  id: string;
  goal: string;
  name: string;
  completed: boolean;
  effort?: number | null;
  notes?: string | null;
};

const mapExpandedSubtask = (s: PocketBaseSubtaskRecord): Subtask => ({
  id: s.id,
  goal_id: s.goal,
  title: s.name,
  is_completed: s.completed,
  effort: s.effort ?? null,
  notes: normalizeNotes(s.notes),
});

const mapExpandedCategory = (raw: unknown): GoalCategory | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id === 'string' && typeof o.name === 'string') {
    return { id: o.id, name: o.name };
  }
  return null;
};

const normalizeShowcaseUrlField = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t || null;
};

const normalizeShowcaseCaption = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t || null;
};

const normalizeShowcaseImage = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t || null;
};

const mapGoalRecord = (r: {
  id: string;
  user: string;
  name: string;
  description: string;
  due_date?: string | null;
  emoji?: string | null;
  notes?: string | null;
  showcase_url?: string | null;
  showcase_caption?: string | null;
  showcase_image?: string | null;
  completed?: boolean;
  expand?: { subtasks_via_goal?: PocketBaseSubtaskRecord[]; category?: unknown };
}): Goal => ({
  id: r.id,
  user_id: r.user,
  title: r.name,
  description: r.description,
  due_date: normalizeDueDate(r.due_date),
  emoji: normalizeEmoji(r.emoji),
  notes: normalizeNotes(r.notes),
  showcase_url: normalizeShowcaseUrlField(r.showcase_url),
  showcase_caption: normalizeShowcaseCaption(r.showcase_caption),
  showcase_image: normalizeShowcaseImage(r.showcase_image),
  is_completed: Boolean(r.completed),
  category: mapExpandedCategory(r.expand?.category),
  subtasks: (r.expand?.subtasks_via_goal ?? []).map((s) => mapExpandedSubtask(s)),
});

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedGoals, setArchivedGoals] = useState<Goal[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<Set<string>>(new Set());
  const [pendingGoalComplete, setPendingGoalComplete] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchGoalsGen = useRef(0);
  /** User-driven completions only — Index drains this for overlay/toasts (never infer from fetch / ref diffs). */
  const celebrationIntentGoalIdsRef = useRef<string[]>([]);

  const flushCelebrationIntentGoalIds = useCallback(() => {
    const ids = [...new Set(celebrationIntentGoalIdsRef.current)];
    celebrationIntentGoalIdsRef.current = [];
    return ids;
  }, []);

  const addPending = (id: string) =>
    setPendingSubtasks((prev) => new Set([...prev, id]));
  const removePending = (id: string) =>
    setPendingSubtasks((prev) => { const next = new Set(prev); next.delete(id); return next; });
  const addPendingGoalComplete = (id: string) =>
    setPendingGoalComplete((prev) => new Set([...prev, id]));
  const removePendingGoalComplete = (id: string) =>
    setPendingGoalComplete((prev) => { const next = new Set(prev); next.delete(id); return next; });

  const markSaving = () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaveStatus('saving');
  };
  const markSaved = () => {
    setSaveStatus('saved');
    savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
  };
  const markError = () => setSaveStatus('error');

  /** Optional “folders” collection — older PB setups & users who skipped README may not have it; 404 must not block goals. */
  const fetchCategories = useCallback(async () => {
    try {
      const records = await pb.collection('categories').getFullList({ sort: 'name' });
      setCategories(records.map((r) => ({ id: r.id, name: String(r.name ?? '') })));
    } catch (err) {
      if (isNotFound(err)) {
        setCategories([]);
        if (import.meta.env.DEV) {
          console.warn(
            '[useGoals] No categories collection (404) — folder picker disabled until you add it in PocketBase (README). Goals still load.'
          );
        }
        return;
      }
      throw err;
    }
  }, []);

  const fetchGoals = async () => {
    const gen = ++fetchGoalsGen.current;
    const records = await pb.collection('goals').getFullList({
      expand: 'subtasks_via_goal,category',
      sort: 'sort_order,created',
    });
    if (gen !== fetchGoalsGen.current) return;
    setGoals((prev) =>
      reconcileFetchedGoals(
        prev,
        records.filter((r) => !r.archived).map(mapGoalRecord)
      )
    );
  };

  const createCategory = async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    try {
      markSaving();
      const rec = await pb.collection('categories').create({
        name: trimmed,
        user: pb.authStore.record?.id,
      });
      await fetchCategories();
      markSaved();
      return rec.id;
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Category not saved.' : 'Failed to create category.');
      return null;
    }
  };

  /** Update only the goal’s category relation — used right after creating a category from edit goal so assignment persists without a full Save. */
  const patchGoalCategory = async (goalId: string, categoryId: string | null) => {
    try {
      markSaving();
      await pb.collection('goals').update(goalId, { category: categoryId || null });
      await fetchGoals();
      markSaved();
    } catch (err) {
      markError();
      toast.error(
        isNetworkError(err) ? 'No connection. Category not applied.' : 'Failed to update category on goal.',
      );
    }
  };

  const renameCategory = async (categoryId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      markSaving();
      await pb.collection('categories').update(categoryId, { name: trimmed });
      await fetchCategories();
      setGoals((prev) =>
        prev.map((g) =>
          g.category?.id === categoryId ? { ...g, category: { id: categoryId, name: trimmed } } : g,
        ),
      );
      setArchivedGoals((prev) =>
        prev.map((g) =>
          g.category?.id === categoryId ? { ...g, category: { id: categoryId, name: trimmed } } : g,
        ),
      );
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Name not saved.' : 'Failed to rename category.');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      markSaving();
      const tied = await pb.collection('goals').getFullList({
        filter: `category = "${categoryId}"`,
      });
      await Promise.all(tied.map((r) => pb.collection('goals').update(r.id, { category: null })));
      await pb.collection('categories').delete(categoryId);
      await fetchCategories();
      setGoals((prev) =>
        prev.map((g) => (g.category?.id === categoryId ? { ...g, category: null } : g)),
      );
      setArchivedGoals((prev) =>
        prev.map((g) => (g.category?.id === categoryId ? { ...g, category: null } : g)),
      );
      markSaved();
      toast.success('Category removed.');
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Category not removed.' : 'Failed to delete category.');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCategories(), fetchGoals()])
      .catch((err) => {
        toast.error(isNetworkError(err) ? 'Cannot reach server. Is PocketBase running?' : 'Failed to load goals.');
      })
      .finally(() => setLoading(false));
  }, [fetchCategories]);

  const fetchArchivedGoals = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const records = await pb.collection('goals').getFullList({
        expand: 'subtasks_via_goal,category',
        sort: '-created',
      });
      setArchivedGoals(records.filter((r) => r.archived).map(mapGoalRecord));
    } catch (err) {
      toast.error(isNetworkError(err) ? 'No connection.' : 'Failed to load archive.');
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  const createGoal = async (
    name: string,
    description: string,
    due_date: string | null = null,
    emoji: string | null = null,
    notes: string = '',
    categoryId: string | null = null
  ) => {
    try {
      markSaving();
      await pb.collection('goals').create({
        name,
        description,
        due_date: due_date || null,
        emoji: emoji || null,
        notes: notes || null,
        completed: false,
        category: categoryId || null,
        user: pb.authStore.record?.id,
        /** Sort ascending; negatives order before reorder indices (0…n−1), so new goals appear at the top. */
        sort_order: -Date.now(),
      });
      await fetchGoals();
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Goal not saved.' : 'Failed to create goal.');
    }
  };

  /** Copies goal fields and subtasks into a new active goal. Progress and checklist completion reset; showcase image is not copied (file field). */
  const duplicateGoal = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId) ?? archivedGoals.find((g) => g.id === goalId);
    if (!goal) return;
    const uid = pb.authStore.record?.id;
    if (!uid) return;

    try {
      markSaving();
      const created = await pb.collection('goals').create({
        name: `${goal.title} (copy)`,
        description: goal.description,
        due_date: goal.due_date || null,
        emoji: goal.emoji || null,
        notes: goal.notes || null,
        completed: false,
        category: goal.category?.id ?? null,
        showcase_url: goal.showcase_url || null,
        showcase_caption: goal.showcase_caption?.trim() || null,
        user: uid,
        sort_order: -Date.now(),
        archived: false,
      });

      const newGoalId = created.id;

      for (const st of goal.subtasks) {
        await pb.collection('subtasks').create({
          name: st.title,
          goal: newGoalId,
          completed: false,
          notes: st.notes || null,
          effort: st.effort ?? null,
        });
      }

      await fetchGoals();
      markSaved();
      toast.success('Goal duplicated.');
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Duplicate not saved.' : 'Failed to duplicate goal.');
    }
  };

  const editGoal = async (
    goalId: string,
    name: string,
    description: string,
    due_date: string | null,
    emoji: string | null = null,
    notes: string = '',
    categoryId: string | null = null,
    showcase_url: string | null = null,
    showcase_caption: string | null = null,
    showcaseFile?: GoalShowcaseFileOptions
  ) => {
    try {
      markSaving();

      type PbGoalResponse = {
        name?: string;
        description?: string;
        due_date?: string | null;
        emoji?: string | null;
        notes?: string | null;
        showcase_url?: string | null;
        showcase_caption?: string | null;
        showcase_image?: string | null;
        completed?: boolean;
      };

      const body: Record<string, unknown> = {
        name,
        description,
        due_date: due_date || null,
        emoji: emoji || null,
        notes: notes || null,
        category: categoryId || null,
        showcase_url: showcase_url || null,
        showcase_caption: showcase_caption?.trim() || null,
      };

      const file = showcaseFile?.showcaseImageFile ?? null;
      const removeImg = showcaseFile?.removeShowcaseImage ?? false;
      if (file) {
        body.showcase_image = file;
      } else if (removeImg) {
        body.showcase_image = null;
      }

      const rec = (await pb.collection('goals').update(goalId, body)) as PbGoalResponse;

      if (file || removeImg) {
        await fetchGoals();
      } else {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  title: String(rec.name ?? name),
                  description: String(rec.description ?? description),
                  due_date: normalizeDueDate(rec.due_date ?? due_date),
                  emoji: normalizeEmoji(rec.emoji ?? emoji),
                  notes: normalizeNotes(rec.notes ?? notes),
                  showcase_url: normalizeShowcaseUrlField(rec.showcase_url ?? showcase_url),
                  showcase_caption: normalizeShowcaseCaption(rec.showcase_caption ?? showcase_caption),
                  showcase_image:
                    rec.showcase_image !== undefined
                      ? normalizeShowcaseImage(rec.showcase_image)
                      : g.showcase_image,
                  is_completed: Boolean(rec.completed ?? g.is_completed),
                  category: categoryId
                    ? categories.find((c) => c.id === categoryId) ??
                      (g.category?.id === categoryId ? g.category : { id: categoryId, name: '' })
                    : null,
                }
              : g
          )
        );
      }
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Changes not saved.' : 'Failed to save changes.');
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      markSaving();
      const goal = goals.find((g) => g.id === goalId);
      if (goal) await Promise.all(goal.subtasks.map((s) => pb.collection('subtasks').delete(s.id)));
      await pb.collection('goals').delete(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Goal not deleted.' : 'Failed to delete goal.');
    }
  };

  const archiveGoal = async (goalId: string) => {
    try {
      markSaving();
      await pb.collection('goals').update(goalId, { archived: true });
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      setArchivedGoals((prev) => {
        const goal = goals.find((g) => g.id === goalId);
        return goal ? [goal, ...prev] : prev;
      });
      markSaved();
      toast.success('Goal archived.');
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection.' : 'Failed to archive goal.');
    }
  };

  const restoreGoal = async (goalId: string) => {
    try {
      markSaving();
      await pb.collection('goals').update(goalId, { archived: false });
      setArchivedGoals((prev) => prev.filter((g) => g.id !== goalId));
      await fetchGoals();
      markSaved();
      toast.success('Goal restored.');
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection.' : 'Failed to restore goal.');
    }
  };

  const deleteArchivedGoal = async (goalId: string) => {
    try {
      markSaving();
      const goal = archivedGoals.find((g) => g.id === goalId);
      if (goal) await Promise.all(goal.subtasks.map((s) => pb.collection('subtasks').delete(s.id)));
      await pb.collection('goals').delete(goalId);
      setArchivedGoals((prev) => prev.filter((g) => g.id !== goalId));
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection.' : 'Failed to delete goal.');
    }
  };

  const bulkDeleteGoals = async (goalIds: string[]) => {
    const ids = [...new Set(goalIds)].filter(Boolean);
    if (ids.length === 0) return;
    try {
      markSaving();
      const idSet = new Set(ids);
      const snapshot = goals.filter((g) => idSet.has(g.id));
      await Promise.all(snapshot.flatMap((g) => g.subtasks.map((s) => pb.collection('subtasks').delete(s.id))));
      await Promise.all(ids.map((id) => pb.collection('goals').delete(id)));
      setGoals((prev) => prev.filter((g) => !idSet.has(g.id)));
      markSaved();
      toast.success(ids.length === 1 ? 'Goal deleted.' : `${ids.length} goals deleted.`);
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection.' : 'Some goals could not be deleted. Refresh and try again.');
      await fetchGoals().catch(() => {});
    }
  };

  const bulkArchiveGoals = async (goalIds: string[]) => {
    const ids = [...new Set(goalIds)].filter(Boolean);
    if (ids.length === 0) return;
    try {
      markSaving();
      await Promise.all(ids.map((id) => pb.collection('goals').update(id, { archived: true })));
      const idSet = new Set(ids);
      const moved = goals.filter((g) => idSet.has(g.id));
      setGoals((prev) => prev.filter((g) => !idSet.has(g.id)));
      setArchivedGoals((prev) => [...moved, ...prev]);
      markSaved();
      toast.success(ids.length === 1 ? 'Goal archived.' : `${ids.length} goals archived.`);
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection.' : 'Some goals could not be archived. Refresh and try again.');
      await fetchGoals().catch(() => {});
    }
  };

  const bulkDeleteArchivedGoals = async (goalIds: string[]) => {
    const ids = [...new Set(goalIds)].filter(Boolean);
    if (ids.length === 0) return;
    try {
      markSaving();
      const idSet = new Set(ids);
      const snapshot = archivedGoals.filter((g) => idSet.has(g.id));
      await Promise.all(snapshot.flatMap((g) => g.subtasks.map((s) => pb.collection('subtasks').delete(s.id))));
      await Promise.all(ids.map((id) => pb.collection('goals').delete(id)));
      setArchivedGoals((prev) => prev.filter((g) => !idSet.has(g.id)));
      markSaved();
      toast.success(ids.length === 1 ? 'Archived goal deleted.' : `${ids.length} archived goals deleted.`);
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection.' : 'Some goals could not be deleted. Refresh and try again.');
      await fetchArchivedGoals().catch(() => {});
    }
  };

  const addSubtask = async (goalId: string, name: string, notes: string = '') => {
    try {
      markSaving();
      await pb.collection('goals').update(goalId, { completed: false });
      await pb.collection('subtasks').create({
        name,
        goal: goalId,
        completed: false,
        notes: notes || null,
      });
      await fetchGoals();
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Subtask not saved.' : 'Failed to add subtask.');
    }
  };

  const toggleSubtask = async (goalId: string, subtaskId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    const subtask = goal?.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;
    const newValue = !subtask.is_completed;

    const wasComplete = isGoalComplete(goal);
    const nextSubs = goal.subtasks.map((s) => (s.id === subtaskId ? { ...s, is_completed: newValue } : s));
    const nextGoal = { ...goal, subtasks: nextSubs };
    const nowComplete = isGoalComplete(nextGoal);

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, subtasks: g.subtasks.map((s) => (s.id === subtaskId ? { ...s, is_completed: newValue } : s)) } : g,
      ),
    );

    if (newValue && nowComplete && !wasComplete && goal.subtasks.length > 0) {
      playGoalDone();
      celebrationIntentGoalIdsRef.current.push(goalId);
    }

    addPending(subtaskId);

    try {
      await pb.collection('subtasks').update(subtaskId, { completed: newValue });
    } catch (err) {
      setGoals((prev) => prev.map((g) =>
        g.id === goalId
          ? { ...g, subtasks: g.subtasks.map((s) => s.id === subtaskId ? { ...s, is_completed: !newValue } : s) }
          : g
      ));
      toast.error(isNetworkError(err) ? 'No connection. Change reverted.' : 'Failed to save. Try again.');
    } finally {
      removePending(subtaskId);
    }
  };

  const toggleGoalStandaloneComplete = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.subtasks.length > 0) return;
    const newValue = !goal.is_completed;

    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, is_completed: newValue } : g)));
    if (newValue && !goal.is_completed) {
      playGoalDone();
      celebrationIntentGoalIdsRef.current.push(goalId);
    }
    addPendingGoalComplete(goalId);

    try {
      await pb.collection('goals').update(goalId, { completed: newValue });
      markSaved();
    } catch (err) {
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, is_completed: !newValue } : g)));
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Change reverted.' : 'Failed to save. Try again.');
    } finally {
      removePendingGoalComplete(goalId);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      markSaving();
      const parent = goals.find((g) => g.subtasks.some((s) => s.id === subtaskId));
      await pb.collection('subtasks').delete(subtaskId);
      if (parent && parent.subtasks.length === 1) {
        await pb.collection('goals').update(parent.id, { completed: false });
      }
      setGoals((prev) =>
        prev.map((g) => {
          const nextSubs = g.subtasks.filter((s) => s.id !== subtaskId);
          const cleared = nextSubs.length === 0 ? { ...g, subtasks: nextSubs, is_completed: false } : { ...g, subtasks: nextSubs };
          return cleared;
        })
      );
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Subtask not deleted.' : 'Failed to delete subtask.');
    }
  };

  const updateSubtaskEffort = async (subtaskId: string, effort: number | null) => {
    try {
      markSaving();
      await pb.collection('subtasks').update(subtaskId, { effort });
      setGoals((prev) => prev.map((g) => ({
        ...g,
        subtasks: g.subtasks.map((s) => (s.id === subtaskId ? { ...s, effort } : s)),
      })));
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Effort not saved.' : 'Failed to update effort.');
    }
  };

  const updateSubtaskNotes = async (subtaskId: string, subNotes: string) => {
    try {
      markSaving();
      await pb.collection('subtasks').update(subtaskId, { notes: subNotes || null });
      setGoals((prev) => prev.map((g) => ({
        ...g,
        subtasks: g.subtasks.map((s) => (s.id === subtaskId ? { ...s, notes: subNotes } : s)),
      })));
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Notes not saved.' : 'Failed to save notes.');
    }
  };

  const renameSubtask = async (subtaskId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('Subtask name cannot be empty.');
      return;
    }
    try {
      markSaving();
      await pb.collection('subtasks').update(subtaskId, { name: trimmed });
      setGoals((prev) =>
        prev.map((g) => ({
          ...g,
          subtasks: g.subtasks.map((s) => (s.id === subtaskId ? { ...s, title: trimmed } : s)),
        })),
      );
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Name not saved.' : 'Failed to rename subtask.');
    }
  };

  const reorderGoals = async (ordered: Goal[]) => {
    try {
      markSaving();
      await Promise.all(ordered.map((goal, index) =>
        pb.collection('goals').update(goal.id, { sort_order: index })
      ));
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Order not saved.' : 'Failed to save order.');
    }
  };

  return {
    goals,
    categories,
    loading,
    pendingSubtasks,
    pendingGoalComplete,
    saveStatus,
    archivedGoals,
    archivedLoading,
    createGoal,
    createCategory,
    patchGoalCategory,
    renameCategory,
    deleteCategory,
    editGoal,
    deleteGoal,
    duplicateGoal,
    archiveGoal,
    restoreGoal,
    deleteArchivedGoal,
    bulkDeleteGoals,
    bulkArchiveGoals,
    bulkDeleteArchivedGoals,
    fetchArchivedGoals,
    addSubtask,
    toggleSubtask,
    toggleGoalStandaloneComplete,
    deleteSubtask,
    updateSubtaskEffort,
    updateSubtaskNotes,
    renameSubtask,
    reorderGoals,
    flushCelebrationIntentGoalIds,
  };
}
