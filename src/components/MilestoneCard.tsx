import { Milestone } from "@/types/milestone";
import MilestoneProgress from "./MilestoneProgress";
import SubtaskItem from "./SubtaskItem";
import AddSubtaskDialog from "./AddSubtaskDialog";
import EditGoalDialog from "./EditGoalDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface MilestoneCardProps {
  milestone: Milestone;
  onToggleSubtask: (milestoneId: string, subtaskId: string) => void;
  onAddSubtask: (milestoneId: string, title: string) => void;
  onDelete: (milestoneId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onEdit: (goalId: string, name: string, description: string) => void;
  onSetEffort: (subtaskId: string, effort: number | null) => void;
}

const MilestoneCard = ({ milestone, onToggleSubtask, onAddSubtask, onDelete, onDeleteSubtask, onEdit, onSetEffort }: MilestoneCardProps) => {
  const hasEffort = milestone.subtasks.some((s) => s.effort != null && s.effort > 0);
  const completed = hasEffort
    ? milestone.subtasks.filter((s) => s.is_completed).reduce((sum, s) => sum + (s.effort || 1), 0)
    : milestone.subtasks.filter((s) => s.is_completed).length;
  const total = hasEffort
    ? milestone.subtasks.reduce((sum, s) => sum + (s.effort || 1), 0)
    : milestone.subtasks.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <h3 className="text-lg font-semibold text-card-foreground tracking-tight">{milestone.title}</h3>
          <p className="text-sm text-muted-foreground">{milestone.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <EditGoalDialog milestone={milestone} onEdit={onEdit} />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(milestone.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <MilestoneProgress percentage={percentage} />

      <div className="space-y-0.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Subtasks · {milestone.subtasks.filter((s) => s.is_completed).length}/{milestone.subtasks.length}
          </span>
          <AddSubtaskDialog onAdd={(title) => onAddSubtask(milestone.id, title)} />
        </div>
        {milestone.subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            onToggle={(subtaskId) => onToggleSubtask(milestone.id, subtaskId)}
            onDelete={onDeleteSubtask}
            onSetEffort={onSetEffort}
          />
        ))}
        {milestone.subtasks.length === 0 && (
          <p className="text-sm text-muted-foreground italic py-2">No subtasks yet.</p>
        )}
      </div>
    </div>
  );
};

export default MilestoneCard;
