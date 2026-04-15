import { Checkbox } from "@/components/ui/checkbox";
import { Subtask } from "@/types/milestone";

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (subtaskId: string) => void;
}

const SubtaskItem = ({ subtask, onToggle }: SubtaskItemProps) => {
  return (
    <label className="flex items-center gap-3 py-2 px-1 rounded-md cursor-pointer hover:bg-secondary/50 transition-colors group">
      <Checkbox
        checked={subtask.is_completed}
        onCheckedChange={() => onToggle(subtask.id)}
        className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span
        className={`text-sm transition-all duration-300 ${
          subtask.is_completed
            ? "line-through text-muted-foreground"
            : "text-card-foreground"
        }`}
      >
        {subtask.title}
      </span>
    </label>
  );
};

export default SubtaskItem;
