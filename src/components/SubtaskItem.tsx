import { useEffect, useRef, useState, memo } from "react";
import { motion, useReducedMotion, useAnimation } from "framer-motion";
import { useResponsiveUI } from "@/hooks/useResponsiveUI";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Loader2, StickyNote } from "lucide-react";
import { Subtask } from "@/types/goal";
import { LinkifiedText } from "@/components/LinkifiedText";
import { SubtaskCheckboxSpark } from "@/components/SubtaskCheckboxSpark";
import { playSubtaskDone, playRemove } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { mechanicalSnap, premiumSpring, smoothOut, tactileHover, tactileTap } from "@/lib/motion";

interface SubtaskItemProps {
  subtask: Subtask;
  isPending: boolean;
  /** Energy accent for localized completion spark */
  particleAccent?: string;
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

const SubtaskItem = memo(function SubtaskItem({
  subtask,
  isPending,
  particleAccent = "#22d3ee",
  onToggle,
  onDelete,
  onSetEffort,
  onUpdateNotes,
}: SubtaskItemProps) {
  const { liteMotion } = useResponsiveUI();
  const reduceMotion = useReducedMotion();
  const bumpRow = useAnimation();
  const prevCompleted = useRef(subtask.is_completed);
  const prevSubtaskId = useRef(subtask.id);
  const [showEffort, setShowEffort] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState(subtask.notes);
  const [sparkBurst, setSparkBurst] = useState(0);

  useEffect(() => {
    setNoteDraft(subtask.notes);
  }, [subtask.notes]);

  useEffect(() => {
    if (prevSubtaskId.current !== subtask.id) {
      prevSubtaskId.current = subtask.id;
      prevCompleted.current = subtask.is_completed;
      return;
    }
    const was = prevCompleted.current;
    prevCompleted.current = subtask.is_completed;
    if (!was && subtask.is_completed && !liteMotion && !reduceMotion) {
      bumpRow.start({
        x: [0, 2, -1, 0],
        transition: { duration: 0.32, times: [0, 0.25, 0.55, 1], ease: smoothOut },
      });
    }
  }, [subtask.id, subtask.is_completed, liteMotion, reduceMotion, bumpRow]);

  const handleToggle = () => {
    if (!subtask.is_completed) {
      playSubtaskDone();
      if (!liteMotion) setSparkBurst((n) => n + 1);
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
    <motion.div
      layout={false}
      whileHover={reduceMotion ? undefined : tactileHover}
      whileTap={reduceMotion || isPending ? undefined : tactileTap}
      transition={premiumSpring}
      className="flex flex-col gap-1 rounded-xl border border-transparent px-2 py-1.5 -mx-2 transition-colors duration-300 ease-out group/sub hover:bg-secondary/30 dark:hover:border-border/45 dark:hover:bg-card/40 dark:hover:shadow-neo-card overflow-visible"
    >
      <motion.div animate={bumpRow} className="flex flex-wrap items-center gap-x-1 gap-y-2 min-w-0">
        <label className="flex items-center gap-3 min-w-0 flex-1 basis-[min(100%,14rem)] cursor-pointer md:basis-0">
          {isPending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <span className="relative inline-flex shrink-0">
              <SubtaskCheckboxSpark
                burstKey={sparkBurst}
                accentColor={particleAccent}
                disabled={liteMotion}
              />
              <Checkbox
                checked={subtask.is_completed}
                onCheckedChange={handleToggle}
                className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                aria-labelledby={`subtask-label-${subtask.id}`}
              />
            </span>
          )}
          <motion.span
            id={`subtask-label-${subtask.id}`}
            animate={{
              opacity: subtask.is_completed ? 0.5 : 1,
            }}
            transition={premiumSpring}
            className={`text-sm min-w-0 truncate ${subtask.is_completed ? "line-through text-muted-foreground" : "text-card-foreground"}`}
          >
            {subtask.title}
          </motion.span>
        </label>

        <div className="flex items-center gap-1 shrink-0 max-md:ml-auto max-md:min-h-10">
          {showEffort && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex max-w-full flex-wrap items-center justify-end gap-0.5"
            >
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  onClick={() => handleSetEffort(n)}
                  whileHover={reduceMotion ? undefined : tactileHover}
                  whileTap={reduceMotion ? undefined : tactileTap}
                  transition={mechanicalSnap}
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-2 md:py-1 rounded-full min-h-10 md:min-h-0 touch-manipulation",
                    subtask.effort === n
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-secondary/90 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40 dark:border-border/50",
                  )}
                >
                  {EFFORT_LABELS[n]}
                </motion.button>
              ))}
            </motion.div>
          )}
          <motion.button
            type="button"
            onClick={() => setShowEffort((v) => !v)}
            whileHover={reduceMotion ? undefined : tactileHover}
            whileTap={reduceMotion ? undefined : tactileTap}
            transition={premiumSpring}
            className={cn(
              "text-[11px] font-medium px-2 py-2 md:py-1 rounded-full min-h-10 md:min-h-8 touch-manipulation",
              "opacity-100 md:opacity-0 md:group-hover/sub:opacity-100 focus-visible:opacity-100",
              subtask.effort
                ? "opacity-100 bg-primary/15 text-primary ring-1 ring-primary/25"
                : "bg-secondary/80 text-muted-foreground hover:bg-secondary border border-border/40 dark:border-border/50",
            )}
          >
            {subtask.effort ? EFFORT_LABELS[subtask.effort] : "Effort"}
          </motion.button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 md:h-7 md:w-7 opacity-100 md:opacity-0 md:group-hover/sub:opacity-100 focus-visible:opacity-100 touch-manipulation text-muted-foreground hover:text-gold hover:bg-gold/12",
              (showNotes || subtask.notes?.trim()) && "opacity-100 text-gold",
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
            className="h-10 w-10 md:h-6 opacity-100 md:opacity-0 md:group-hover/sub:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-destructive touch-manipulation"
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
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) return;
            setShowNotes(true);
          }}
        >
          <LinkifiedText text={subtask.notes} as="span" className="whitespace-pre-wrap" />
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
    </motion.div>
  );
});

SubtaskItem.displayName = "SubtaskItem";

export default SubtaskItem;
