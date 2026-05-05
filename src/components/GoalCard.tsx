import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { playGoalDone } from "@/lib/sounds";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Goal } from "@/types/goal";
import { calcProgress, getProgressColor } from "@/lib/goalUtils";
import GoalProgress from "./GoalProgress";
import SubtaskItem from "./SubtaskItem";
import AddSubtaskDialog from "./AddSubtaskDialog";
import EditGoalDialog from "./EditGoalDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, Trash2, Trophy, GripVertical, ChevronDown, Archive, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { smoothOut } from "@/lib/motion";
import { formatDueChip, getDueUrgency, isIncompleteForDueDate } from "@/lib/dueDateUtils";

interface GoalCardProps {
  goal: Goal;
  pendingSubtasks: Set<string>;
  isCelebrating?: boolean;
  onToggleSubtask: (goalId: string, subtaskId: string) => void;
  onAddSubtask: (goalId: string, title: string, notes?: string) => void;
  onDelete: (goalId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onEdit: (
    goalId: string,
    name: string,
    description: string,
    dueDate: string | null,
    emoji: string | null,
    notes: string
  ) => void;
  onSetEffort: (subtaskId: string, effort: number | null) => void;
  onUpdateSubtaskNotes: (subtaskId: string, notes: string) => void;
  onArchive?: () => void;
  showDragHandle?: boolean;
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

const ACCENT_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#fb7185', '#fbbf24', '#f472b6', '#22d3ee', '#fb923c'];
const getAccentColor = (id: string) => ACCENT_COLORS[id.charCodeAt(id.length - 1) % ACCENT_COLORS.length];


const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  left: `${6 + i * 9}%`,
  yOffset: -60 - (i % 4) * 20,
  delay: i * 0.06,
  size: i % 3 === 0 ? 8 : 5,
  color: ['#f59e0b', '#a78bfa', '#34d399', '#fb7185', '#60a5fa'][i % 5],
}));

const GoalCard = ({ goal, pendingSubtasks, isCelebrating = false, onToggleSubtask, onAddSubtask, onDelete, onDeleteSubtask, onEdit, onSetEffort, onUpdateSubtaskNotes, onArchive, showDragHandle = true }: GoalCardProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showGoalNotes, setShowGoalNotes] = useState(false);
  const [goalNoteDraft, setGoalNoteDraft] = useState(goal.notes);
  const percentage = calcProgress(goal);
  const isComplete = percentage >= 100 && goal.subtasks.length > 0;
  const isInProgress = percentage > 0 && !isComplete;
  const incompleteForDue = isIncompleteForDueDate(goal);
  const dueUrgency = getDueUrgency(goal.due_date, incompleteForDue && !isComplete);
  const accentColor = getAccentColor(goal.id);
  const doneCount = goal.subtasks.filter((s) => s.is_completed).length;
  const controls = useAnimation();

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
      playGoalDone();
      toast.success(COMPLETE_MESSAGES[Math.floor(Math.random() * COMPLETE_MESSAGES.length)], { icon: "🏆", duration: 5000 });
      controls.start({
        scale: [1, 1.05, 1.02, 1.04, 1],
        transition: { duration: 0.6, times: [0, 0.25, 0.5, 0.75, 1] },
      });
    } else if (prev < 50 && percentage >= 50) {
      toast(HALFWAY_MESSAGES[Math.floor(Math.random() * HALFWAY_MESSAGES.length)], { icon: "🔥" });
    }
    prevPercentage.current = percentage;
  }, [percentage, goal.subtasks.length, controls]);

  useEffect(() => {
    setGoalNoteDraft(goal.notes);
  }, [goal.notes]);

  const flushGoalNotes = () => {
    const t = goalNoteDraft.trim();
    if (t !== (goal.notes || "").trim()) {
      onEdit(goal.id, goal.title, goal.description, goal.due_date, goal.emoji, t);
    }
  };

  // Force expand during celebration
  useEffect(() => {
    if (isCelebrating) setCollapsed(false);
  }, [isCelebrating]);

  return (
    <motion.div
      animate={controls}
      whileHover={!isCelebrating ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={cn(
        "rounded-2xl border shadow-sm relative bg-card transition-[transform,box-shadow] duration-300 ease-out",
        "dark:border-border/50 dark:shadow-lg dark:shadow-black/45",
        "dark:hover:border-border/80 dark:hover:shadow-2xl dark:hover:shadow-black/55",
        isCelebrating && "celebration-card ring-2 ring-amber-400/80",
        !isCelebrating && isComplete && "ring-2 ring-amber-400",
        !isCelebrating && !isComplete && dueUrgency === "overdue" && "ring-2 ring-red-500/45",
        !isCelebrating && !isComplete && dueUrgency === "soon" && "ring-2 ring-amber-500/40",
        !isCelebrating && isInProgress && "goal-pulse-ring"
      )}
      style={{
        borderLeft: `3px solid ${isCelebrating ? '#f59e0b' : accentColor}`,
        background: isCelebrating
          ? 'linear-gradient(135deg, hsl(220,18%,13%) 0%, hsl(40,28%,14%) 55%, hsl(220,18%,13%) 100%)'
          : undefined,
      }}
    >
      {/* Inner container — clips sweep to rounded corners */}
      <div className="rounded-2xl overflow-hidden relative before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/[0.14] before:to-transparent dark:before:via-white/[0.08]">
        {/* Sweep — framer-motion so it respects rounded corners */}
        <AnimatePresence>
          {isCelebrating && (
            <motion.div
              key="sweep"
              className="absolute inset-y-0 pointer-events-none"
              style={{ zIndex: 1, width: '55%', background: 'linear-gradient(90deg, transparent, rgba(255,220,120,0.22), transparent)' }}
              initial={{ x: '-100%', skewX: -15 }}
              animate={{ x: '280%', skewX: -15 }}
              transition={{ duration: 1.0, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.8 }}
            />
          )}
        </AnimatePresence>

        {/* Floating particles */}
        <AnimatePresence>
          {isCelebrating && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
              {PARTICLES.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{ left: p.left, bottom: '20%', width: p.size, height: p.size, backgroundColor: p.color }}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: p.yOffset, opacity: 0, scale: 0.3 }}
                  transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.6 }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3.5" style={{ position: 'relative', zIndex: 3 }}>
          {showDragHandle ? (
            <span className="shrink-0 touch-none cursor-grab active:cursor-grabbing" title="Drag to reorder" aria-label="Drag to reorder goal">
              <GripVertical className="h-4 w-4 text-muted-foreground/25" aria-hidden />
            </span>
          ) : (
            <div className="w-4 shrink-0" aria-hidden />
          )}

          <button
            className="flex-1 flex items-start gap-2 min-w-0 text-left"
            onClick={() => setCollapsed((v) => !v)}
          >
            <AnimatePresence>
              {goal.emoji && (
                <motion.span
                  key="goal-emoji"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="shrink-0 text-lg leading-none mt-0.5 select-none"
                  aria-hidden
                >
                  {goal.emoji}
                </motion.span>
              )}
              {isComplete && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="shrink-0 mt-0.5"
                >
                  <Trophy className={`h-4 w-4 ${isCelebrating ? 'text-amber-300' : 'text-amber-400'}`} />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="min-w-0 flex-1">
              <div className={cn('flex items-center gap-2 min-w-0', collapsed && 'w-full justify-between')}>
                <span className={`text-base font-semibold tracking-tight truncate min-w-0 ${collapsed ? 'flex-1' : ''} ${isComplete ? 'text-amber-400' : 'text-card-foreground'}`}>
                  {goal.title}
                </span>
                {collapsed && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: getProgressColor(percentage) }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{doneCount}/{goal.subtasks.length}</span>
                  </div>
                )}
              </div>
              {goal.due_date && (
                <div
                  className={cn(
                    'flex items-center gap-1 mt-1 text-xs',
                    dueUrgency === 'overdue' && 'text-red-400 font-medium',
                    dueUrgency === 'soon' && 'text-amber-400/90',
                    dueUrgency === 'none' && 'text-muted-foreground'
                  )}
                >
                  <CalendarDays className="h-3 w-3 shrink-0 opacity-80" />
                  <span>{formatDueChip(goal.due_date)}</span>
                  {dueUrgency === 'overdue' && <span className="text-red-400/90">· Overdue</span>}
                  {dueUrgency === 'soon' && <span className="text-amber-400/80">· Due soon</span>}
                </div>
              )}
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <EditGoalDialog goal={goal} onEdit={onEdit} />
            {isComplete && !isCelebrating && onArchive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-amber-400"
                onClick={onArchive}
                title="Archive goal"
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{goal.title}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {goal.subtasks.length > 0
                      ? `Permanently deletes the goal and all ${goal.subtasks.length} subtask${goal.subtasks.length === 1 ? '' : 's'}.`
                      : 'Permanently deletes the goal.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(goal.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
            </motion.div>
          </div>
        </div>

        {/* Collapsible body */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: smoothOut }}
              style={{ overflow: 'hidden', position: 'relative', zIndex: 3 }}
            >
              <div className="px-4 pb-5 space-y-5 border-t border-border/60 pt-4 min-w-0">
                {goal.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{goal.description}</p>
                )}
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                      Notes
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground",
                        (showGoalNotes || goal.notes?.trim()) && "text-amber-500/90"
                      )}
                      title={showGoalNotes ? "Hide notes" : "Notes"}
                      aria-pressed={showGoalNotes}
                      onClick={() => setShowGoalNotes((v) => !v)}
                    >
                      <StickyNote className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {!showGoalNotes && !!goal.notes?.trim() && (
                    <button
                      type="button"
                      className="text-left text-sm text-card-foreground rounded-xl border border-border/55 bg-muted/15 px-3 py-2.5 w-full min-w-0 max-w-full whitespace-pre-wrap break-words line-clamp-4 hover:bg-muted/30 hover:border-border dark:bg-card/30 dark:hover:bg-card/45 transition-all duration-300"
                      onClick={() => setShowGoalNotes(true)}
                    >
                      {goal.notes}
                    </button>
                  )}
                  {showGoalNotes && (
                    <Textarea
                      value={goalNoteDraft}
                      onChange={(e) => setGoalNoteDraft(e.target.value)}
                      onBlur={flushGoalNotes}
                      placeholder="Private notes, links, reminders…"
                      rows={3}
                      className="text-sm min-h-[72px] max-h-36 resize-none overflow-y-auto w-full min-w-0 max-w-full box-border rounded-xl app-surface-input transition-shadow duration-300"
                      aria-label="Goal notes"
                    />
                  )}
                </div>
                <GoalProgress percentage={percentage} />
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                      Subtasks · {doneCount}/{goal.subtasks.length}
                    </span>
                    <AddSubtaskDialog onAdd={(t, n) => onAddSubtask(goal.id, t, n)} />
                  </div>
                  <AnimatePresence initial={false}>
                    {goal.subtasks.map((subtask) => (
                      <motion.div
                        key={subtask.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: smoothOut }}
                      >
                        <SubtaskItem
                          subtask={subtask}
                          isPending={pendingSubtasks.has(subtask.id)}
                          onToggle={(subtaskId) => onToggleSubtask(goal.id, subtaskId)}
                          onDelete={onDeleteSubtask}
                          onSetEffort={onSetEffort}
                          onUpdateNotes={onUpdateSubtaskNotes}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {goal.subtasks.length === 0 && (
                    <p className="text-sm text-muted-foreground italic py-1.5">No subtasks yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default GoalCard;
