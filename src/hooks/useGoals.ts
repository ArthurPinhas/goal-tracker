import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import pb from '@/lib/pocketbase';
import { Goal, Subtask } from '@/types/goal';

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingSubtasks, setPendingSubtasks] = useState<Set<string>>(new Set());

  const addPending = (id: string) =>
    setPendingSubtasks((prev) => new Set([...prev, id]));
  const removePending = (id: string) =>
    setPendingSubtasks((prev) => { const next = new Set(prev); next.delete(id); return next; });

  const fetchGoals = async () => {
    const records = await pb.collection('goals').getFullList({
      expand: 'subtasks_via_goal',
      sort: '-created',
    });

    const mapped: Goal[] = records.map((r) => ({
      id: r.id,
      user_id: r.user,
      title: r.name,
      description: r.description,
      subtasks: ((r.expand as Record<string, Subtask[]>)?.['subtasks_via_goal'] ?? []).map((s) => ({
        id: s.id,
        goal_id: (s as unknown as { goal: string }).goal,
        title: (s as unknown as { name: string }).name,
        is_completed: (s as unknown as { completed: boolean }).completed,
        effort: (s as unknown as { effort: number | null }).effort || null,
      })),
    }));

    setGoals(mapped);
  };

  useEffect(() => {
    setLoading(true);
    fetchGoals()
      .catch(() => toast.error('Failed to load goals.'))
      .finally(() => setLoading(false));
  }, []);

  const createGoal = async (name: string, description: string) => {
    try {
      await pb.collection('goals').create({ name, description, user: pb.authStore.record?.id });
      await fetchGoals();
    } catch {
      toast.error('Failed to create goal.');
    }
  };

  const editGoal = async (goalId: string, name: string, description: string) => {
    try {
      await pb.collection('goals').update(goalId, { name, description });
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, title: name, description } : g))
      );
    } catch {
      toast.error('Failed to save changes.');
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        await Promise.all(goal.subtasks.map((s) => pb.collection('subtasks').delete(s.id)));
      }
      await pb.collection('goals').delete(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch {
      toast.error('Failed to delete goal.');
    }
  };

  const addSubtask = async (goalId: string, name: string) => {
    try {
      await pb.collection('subtasks').create({ name, goal: goalId, completed: false });
      await fetchGoals();
    } catch {
      toast.error('Failed to add subtask.');
    }
  };

  const toggleSubtask = async (goalId: string, subtaskId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    const subtask = goal?.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    const newValue = !subtask.is_completed;

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, subtasks: g.subtasks.map((s) => s.id === subtaskId ? { ...s, is_completed: newValue } : s) }
          : g
      )
    );
    addPending(subtaskId);

    try {
      await pb.collection('subtasks').update(subtaskId, { completed: newValue });
    } catch {
      // revert
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, subtasks: g.subtasks.map((s) => s.id === subtaskId ? { ...s, is_completed: !newValue } : s) }
            : g
        )
      );
      toast.error('Failed to save. Try again.');
    } finally {
      removePending(subtaskId);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      await pb.collection('subtasks').delete(subtaskId);
      setGoals((prev) =>
        prev.map((g) => ({ ...g, subtasks: g.subtasks.filter((s) => s.id !== subtaskId) }))
      );
    } catch {
      toast.error('Failed to delete subtask.');
    }
  };

  const updateSubtaskEffort = async (subtaskId: string, effort: number | null) => {
    try {
      await pb.collection('subtasks').update(subtaskId, { effort });
      setGoals((prev) =>
        prev.map((g) => ({
          ...g,
          subtasks: g.subtasks.map((s) => (s.id === subtaskId ? { ...s, effort } : s)),
        }))
      );
    } catch {
      toast.error('Failed to update effort.');
    }
  };

  return { goals, loading, pendingSubtasks, createGoal, editGoal, deleteGoal, addSubtask, toggleSubtask, deleteSubtask, updateSubtaskEffort };
}
