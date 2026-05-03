import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import { Goal } from "@/types/goal";
import GoalProgress from "./GoalProgress";
import SubtaskItem from "./SubtaskItem";
import AddSubtaskDialog from "./AddSubtaskDialog";
import EditGoalDialog from "./EditGoalDialog";
import { Button } from "@/components/ui/button";
import { Trash2, Trophy } from "lucide-react";

interface GoalCardProps {
  goal: Goal;
  pendingSubtasks: Set<string>;
  onToggleSubtask: (goalId: string, subtaskId: string) => void;
  onAddSubtask: (goalId: string, title: string) => void;
  onDelete: (goalId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onEdit: (goalId: string, name: string, description: string) => void;
  onSetEffort: (subtaskId: string, effort: number | null) => void;
}

const HALFWAY_MESSAGES = [
  "Halfway there, keep going!",
  "You're on fire — 50% done!",
  "Half the battle won. Push through!",
  "Great progress, don't stop now!",
];

const COMPLETE_MESSAGES = [
  "Goal complete! Outstanding work!",
  "You crushed it! On to the next one.",
  "100%! That took real effort.",
  "Goal achieved. Well done!",
];

const fireFullConfetti = () => {
  confetti({ particleCount: 120, spread: 160, origin: { y: 0.55 } });
  setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { x: 0.1, y: 0.45 } }), 150);
  setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { x: 0.9, y: 0.45 } }), 300);
};

const GoalCard = ({ goal, pendingSubtasks, onToggleSubtask, onAddSubtask, onDelete, onDeleteSubtask, onEdit, onSetEffort }: GoalCardProps) => {
  const hasEffort = goal.subtasks.some((s) => s.effort != null && s.effort > 0);
  const completedWeight = hasEffort
    ? goal.subtasks.filter((s) => s.is_completed).reduce((sum, s) => sum + (s.effort || 1), 0)
    : goal.subtasks.filter((s) => s.is_completed).length;
  const totalWeight = hasEffort
    ? goal.subtasks.reduce((sum, s) => sum + (s.effort || 1), 0)
    : goal.subtasks.length;
  const percentage = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  const isComplete = percentage >= 100 && goal.subtasks.length > 0;

  const prevPercentage = useRef<number | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevPercentage.current = percentage;
      return;
    }

    const prev = prevPercentage.current ?? 0;

    if (prev < 100 && percentage >= 100 && goal.subtasks.length > 0) {
      fireFullConfetti();
      toast.success(COMPLETE_MESSAGES[Math.floor(Math.random() * COMPLETE_MESSAGES.length)], {
        icon: "🏆",
        duration: 5000,
      });
    } else if (prev < 50 && percentage >= 50) {
      toast(HALFWAY_MESSAGES[Math.floor(Math.random() * HALFWAY_MESSAGES.length)], {
        icon: "🔥",
      });
    }

    prevPercentage.current = percentage;
  }, [percentage, goal.subtasks.length]);

  return (
    <motion.div
      layout
      className={`rounded-xl border bg-card p-6 space-y-5 shadow-sm transition-all duration-500 ${
        isComplete ? "ring-2 ring-amber-400 shadow-amber-100 dark:shadow-amber-900/20" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex items-start gap-2">
          {isComplete && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Trophy className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            </motion.div>
          )}
          <div>
            <h3 className={`text-lg font-semibold tracking-tight ${isComplete ? "text-amber-500" : "text-card-foreground"}`}>
              {goal.title}
            </h3>
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <EditGoalDialog goal={goal} onEdit={onEdit} />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <GoalProgress percentage={percentage} />

      <div className="space-y-0.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Subtasks · {goal.subtasks.filter((s) => s.is_completed).length}/{goal.subtasks.length}
          </span>
          <AddSubtaskDialog onAdd={(title) => onAddSubtask(goal.id, title)} />
        </div>
        {goal.subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            isPending={pendingSubtasks.has(subtask.id)}
            onToggle={(subtaskId) => onToggleSubtask(goal.id, subtaskId)}
            onDelete={onDeleteSubtask}
            onSetEffort={onSetEffort}
          />
        ))}
        {goal.subtasks.length === 0 && (
          <p className="text-sm text-muted-foreground italic py-2">No subtasks yet.</p>
        )}
      </div>
    </motion.div>
  );
};

export default GoalCard;
