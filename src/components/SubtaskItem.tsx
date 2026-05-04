import { useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { Subtask } from "@/types/goal";
import { playSubtaskDone, playRemove } from "@/lib/sounds";

interface SubtaskItemProps {
  subtask: Subtask;
  isPending: boolean;
  onToggle: (subtaskId: string) => void;
  onDelete: (subtaskId: string) => void;
  onSetEffort: (subtaskId: string, effort: number | null) => void;
}

const EFFORT_LABELS: Record<number, string> = {
  1: "Quick",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Major",
};

const SubtaskItem = ({ subtask, isPending, onToggle, onDelete, onSetEffort }: SubtaskItemProps) => {
  const [showEffort, setShowEffort] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!subtask.is_completed) playSubtaskDone();
    if (!subtask.is_completed && rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      confetti({
        particleCount: 25,
        spread: 55,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        startVelocity: 22,
        gravity: 1.4,
        ticks: 55,
        scalar: 0.8,
      });
    }
    onToggle(subtask.id);
  };

  const handleSetEffort = (n: number) => {
    onSetEffort(subtask.id, subtask.effort === n ? null : n);
    setShowEffort(false);
  };

  return (
    <motion.div
      ref={rowRef}
      whileTap={{ scale: 0.98 }}
      animate={subtask.is_completed ? { opacity: 1 } : { opacity: 1 }}
      className="flex items-center gap-1 py-1 px-1 rounded-md hover:bg-secondary/50 transition-colors group"
    >
      <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
        {isPending ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Checkbox
            checked={subtask.is_completed}
            onCheckedChange={handleToggle}
            className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
          />
        )}
        <motion.span
          animate={{
            opacity: subtask.is_completed ? 0.5 : 1,
          }}
          transition={{ duration: 0.25 }}
          className={`text-sm truncate ${subtask.is_completed ? "line-through text-muted-foreground" : "text-card-foreground"}`}
        >
          {subtask.title}
        </motion.span>
      </label>

      <div className="flex items-center gap-1 shrink-0">
        {showEffort && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-0.5"
          >
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                onClick={() => handleSetEffort(n)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  subtask.effort === n
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {EFFORT_LABELS[n]}
              </button>
            ))}
          </motion.div>
        )}
        <button
          onClick={() => setShowEffort((v) => !v)}
          className={`text-xs px-1.5 py-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 ${
            subtask.effort
              ? "opacity-100 bg-primary/10 text-primary"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          {subtask.effort ? EFFORT_LABELS[subtask.effort] : "Effort"}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          onClick={() => { playRemove(); onDelete(subtask.id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default SubtaskItem;
