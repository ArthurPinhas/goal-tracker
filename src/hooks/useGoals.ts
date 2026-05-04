import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import pb from '@/lib/pocketbase';
import { Goal, Subtask } from '@/types/goal';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const isNetworkError = (err: unknown): boolean =>
  err instanceof Error && (err.message === 'Failed to fetch' || err.message.includes('NetworkError'));

const mapGoalRecord = (r: { id: string; user: string; name: string; description: string; expand?: Record<string, Subtask[]> }): Goal => ({
  id: r.id,
  user_id: r.user,
  title: r.name,
  description: r.description,
  subtasks: (r.expand?.['subtasks_via_goal'] ?? []).map((s) => ({
    id: s.id,
    goal_id: (s as unknown as { goal: string }).goal,
    title: (s as unknown as { name: string }).name,
    is_completed: (s as unknown as { completed: boolean }).completed,
    effort: (s as unknown as { effort: number | null }).effort || null,
  })),
});

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedGoals, setArchivedGoals] = useState<Goal[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addPending = (id: string) =>
    setPendingSubtasks((prev) => new Set([...prev, id]));
  const removePending = (id: string) =>
    setPendingSubtasks((prev) => { const next = new Set(prev); next.delete(id); return next; });

  const markSaving = () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaveStatus('saving');
  };
  const markSaved = () => {
    setSaveStatus('saved');
    savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
  };
  const markError = () => setSaveStatus('error');

  const fetchGoals = async () => {
    const records = await pb.collection('goals').getFullList({
      expand: 'subtasks_via_goal',
      sort: 'sort_order,created',
    });
    setGoals(records.filter((r) => !r.archived).map(mapGoalRecord));
  };

  useEffect(() => {
    setLoading(true);
    fetchGoals()
      .catch((err) => {
        toast.error(isNetworkError(err) ? 'Cannot reach server. Is PocketBase running?' : 'Failed to load goals.');
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchArchivedGoals = async () => {
    setArchivedLoading(true);
    try {
      const records = await pb.collection('goals').getFullList({
        expand: 'subtasks_via_goal',
        sort: '-created',
      });
      setArchivedGoals(records.filter((r) => r.archived).map(mapGoalRecord));
    } catch (err) {
      toast.error(isNetworkError(err) ? 'No connection.' : 'Failed to load archive.');
    } finally {
      setArchivedLoading(false);
    }
  };

  const createGoal = async (name: string, description: string) => {
    try {
      markSaving();
      await pb.collection('goals').create({ name, description, user: pb.authStore.record?.id, sort_order: goals.length });
      await fetchGoals();
      markSaved();
    } catch (err) {
      markError();
      toast.error(isNetworkError(err) ? 'No connection. Goal not saved.' : 'Failed to create goal.');
    }
  };

  const editGoal = async (goalId: string, name: string, description: string) => {
    try {
      markSaving();
      await pb.collection('goals').update(goalId, { name, description });
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, title: name, description } : g)));
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

  const addSubtask = async (goalId: string, name: string) => {
    try {
      markSaving();
      await pb.collection('subtasks').create({ name, goal: goalId, completed: false });
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

    setGoals((prev) => prev.map((g) =>
      g.id === goalId
        ? { ...g, subtasks: g.subtasks.map((s) => s.id === subtaskId ? { ...s, is_completed: newValue } : s) }
        : g
    ));
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

  const deleteSubtask = async (subtaskId: string) => {
    try {
      markSaving();
      await pb.collection('subtasks').delete(subtaskId);
      setGoals((prev) => prev.map((g) => ({ ...g, subtasks: g.subtasks.filter((s) => s.id !== subtaskId) })));
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
    goals, loading, pendingSubtasks, saveStatus,
    archivedGoals, archivedLoading,
    createGoal, editGoal, deleteGoal, archiveGoal,
    restoreGoal, deleteArchivedGoal, fetchArchivedGoals,
    addSubtask, toggleSubtask, deleteSubtask, updateSubtaskEffort,
    reorderGoals,
  };
}
