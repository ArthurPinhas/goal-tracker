import { Milestone } from "@/types/milestone";
import MilestoneProgress from "./MilestoneProgress";
import SubtaskItem from "./SubtaskItem";
import AddSubtaskDialog from "./AddSubtaskDialog";

interface MilestoneCardProps {
  milestone: Milestone;
  onToggleSubtask: (milestoneId: string, subtaskId: string) => void;
  onAddSubtask: (milestoneId: string, title: string) => void;
}

const MilestoneCard = ({ milestone, onToggleSubtask, onAddSubtask }: MilestoneCardProps) => {
  const completed = milestone.subtasks.filter((s) => s.is_completed).length;
  const total = milestone.subtasks.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-card-foreground tracking-tight">{milestone.title}</h3>
        <p className="text-sm text-muted-foreground">{milestone.description}</p>
      </div>

      <MilestoneProgress percentage={percentage} />

      <div className="space-y-0.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Subtasks · {completed}/{total}
          </span>
          <AddSubtaskDialog onAdd={(title) => onAddSubtask(milestone.id, title)} />
        </div>
        {milestone.subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            onToggle={(subtaskId) => onToggleSubtask(milestone.id, subtaskId)}
          />
        ))}
        {total === 0 && (
          <p className="text-sm text-muted-foreground italic py-2">No subtasks yet.</p>
        )}
      </div>
    </div>
  );
};

export default MilestoneCard;
