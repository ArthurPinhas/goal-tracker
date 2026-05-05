import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Loader2, StickyNote } from "lucide-react";
import { Subtask } from "@/types/goal";
import { playSubtaskDone, playRemove } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { springContent } from "@/lib/motion";

interface SubtaskItemProps {
  subtask: Subtask;
  isPending: boolean;
  onToggle: (subtaskId: string) => void;
  onDelete: (subtaskId: string) => void;
  onSetEffort: (subtaskId: string, effort: number | null) => void;
  onUpdateNotes: (subtaskId: string, notes: string) => void;
}

const EFFORT_LABELS: Record<number, string> = {
  1: "Quick",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Major",
};

const SubtaskItem = ({ subtask, isPending, onToggle, onDelete, onSetEffort, onUpdateNotes }: SubtaskItemProps) => {
  const [showEffort, setShowEffort] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState(subtask.notes);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNoteDraft(subtask.notes);
  }, [subtask.notes]);

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

  const flushNotes = () => {
    const t = noteDraft.trim();
    if (t !== (subtask.notes || "").trim()) onUpdateNotes(subtask.id, t);
  };

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-transparent px-2 py-1.5 -mx-2 transition-all duration-300 ease-out [contain:layout] group/sub hover:bg-secondary/30 dark:hover:border-border/45 dark:hover:bg-card/40 dark:hover:shadow-md dark:hover:shadow-black/25">
      <motion.div
        ref={rowRef}
        whileTap={{ scale: 0.985 }}
        transition={springContent}
        className="flex items-center gap-1"
      >
        <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
          {isPending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Checkbox
              checked={subtask.is_completed}
              onCheckedChange={handleToggle}
              className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
              aria-labelledby={`subtask-label-${subtask.id}`}
            />
          )}
          <motion.span
            id={`subtask-label-${subtask.id}`}
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
                  type="button"
                  key={n}
                  onClick={() => handleSetEffort(n)}
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-200",
                    subtask.effort === n
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-secondary/90 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40 dark:border-border/50",
                  )}
                >
                  {EFFORT_LABELS[n]}
                </button>
              ))}
            </motion.div>
          )}
          <button
            type="button"
            onClick={() => setShowEffort((v) => !v)}
            className={cn(
              "text-[11px] font-medium px-2 py-1 rounded-full transition-all duration-200 min-h-8",
              "opacity-0 group-hover/sub:opacity-100 focus-visible:opacity-100",
              subtask.effort
                ? "opacity-100 bg-primary/15 text-primary ring-1 ring-primary/25"
                : "bg-secondary/80 text-muted-foreground hover:bg-secondary border border-border/40 dark:border-border/50",
            )}
          >
            {subtask.effort ? EFFORT_LABELS[subtask.effort] : "Effort"}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 sm:h-7 sm:w-7 opacity-0 group-hover/sub:opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 focus-visible:opacity-100",
              (showNotes || subtask.notes?.trim()) && "opacity-100 text-amber-500/90",
            )}
            title={showNotes ? "Hide notes" : "Notes"}
            aria-pressed={showNotes}
            onClick={() => setShowNotes((v) => !v)}
          >
            <StickyNote className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-7 sm:w-6 opacity-0 group-hover/sub:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-destructive"
            onClick={() => {
              playRemove();
              onDelete(subtask.id);
            }}
            aria-label={`Delete subtask ${subtask.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>

      {!showNotes && !!subtask.notes?.trim() && (
        <button
          type="button"
          className="text-left text-xs text-muted-foreground ml-7 line-clamp-3 rounded-lg px-2 py-1.5 hover:bg-secondary/50 dark:hover:bg-card/50 w-[calc(100%-1.75rem)] max-w-full min-w-0 break-words box-border border border-transparent hover:border-border/40 transition-colors duration-200"
          onClick={() => setShowNotes(true)}
        >
          {subtask.notes}
        </button>
      )}

      {showNotes && (
        <div className="ml-7 min-w-0 w-[calc(100%-1.75rem)] max-w-full pr-0.5 box-border">
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={flushNotes}
            placeholder="Notes for this subtask…"
            rows={2}
            className="text-xs resize-none min-h-[52px] max-h-32 overflow-y-auto w-full min-w-0 max-w-full box-border rounded-lg app-surface-input transition-shadow duration-200"
            aria-label={`Notes for ${subtask.title}`}
          />
        </div>
      )}
    </div>
  );
};

export default SubtaskItem;
