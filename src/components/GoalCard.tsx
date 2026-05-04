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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Trophy, GripVertical, ChevronDown, Archive } from "lucide-react";

interface GoalCardProps {
  goal: Goal;
  pendingSubtasks: Set<string>;
  isCelebrating?: boolean;
  onToggleSubtask: (goalId: string, subtaskId: string) => void;
  onAddSubtask: (goalId: string, title: string) => void;
  onDelete: (goalId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onEdit: (goalId: string, name: string, description: string) => void;
  onSetEffort: (subtaskId: string, effort: number | null) => void;
  onArchive?: () => void;
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

const GoalCard = ({ goal, pendingSubtasks, isCelebrating = false, onToggleSubtask, onAddSubtask, onDelete, onDeleteSubtask, onEdit, onSetEffort, onArchive }: GoalCardProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const percentage = calcProgress(goal);
  const isComplete = percentage >= 100 && goal.subtasks.length > 0;
  const isInProgress = percentage > 0 && !isComplete;
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
  }, [percentage, goal.subtasks.length]);

  // Force expand during celebration
  useEffect(() => {
    if (isCelebrating) setCollapsed(false);
  }, [isCelebrating]);

  return (
    <motion.div
      animate={controls}
      whileHover={!isCelebrating ? { y: -2, boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${accentColor}25` } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`rounded-xl border shadow-sm relative
        ${isCelebrating ? 'celebration-card ring-2 ring-amber-400/80' : 'bg-card'}
        ${!isCelebrating && isComplete ? 'ring-2 ring-amber-400' : ''}
        ${!isCelebrating && isInProgress ? 'goal-pulse-ring' : ''}
      `}
      style={{
        borderLeft: `3px solid ${isCelebrating ? '#f59e0b' : accentColor}`,
        background: isCelebrating
          ? 'linear-gradient(135deg, hsl(220,18%,13%) 0%, hsl(40,28%,14%) 55%, hsl(220,18%,13%) 100%)'
          : undefined,
      }}
    >
      {/* Inner container — clips sweep to rounded corners */}
      <div className="rounded-xl overflow-hidden relative">
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
        <div className="flex items-center gap-2 px-4 py-3" style={{ position: 'relative', zIndex: 3 }}>
          <GripVertical className="h-4 w-4 text-muted-foreground/25 shrink-0 cursor-grab active:cursor-grabbing" />

          <button
            className="flex-1 flex items-center gap-2 min-w-0 text-left"
            onClick={() => setCollapsed((v) => !v)}
          >
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Trophy className={`h-4 w-4 shrink-0 ${isCelebrating ? 'text-amber-300' : 'text-amber-400'}`} />
                </motion.div>
              )}
            </AnimatePresence>
            <span className={`font-semibold tracking-tight truncate ${isComplete ? 'text-amber-400' : 'text-card-foreground'}`}>
              {goal.title}
            </span>
            {collapsed && (
              <div className="flex items-center gap-2 ml-auto shrink-0">
                <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: getProgressColor(percentage) }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{doneCount}/{goal.subtasks.length}</span>
              </div>
            )}
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
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden', position: 'relative', zIndex: 3 }}
            >
              <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-3">
                {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                <GoalProgress percentage={percentage} />
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Subtasks · {doneCount}/{goal.subtasks.length}
                    </span>
                    <AddSubtaskDialog onAdd={(title) => onAddSubtask(goal.id, title)} />
                  </div>
                  <AnimatePresence initial={false}>
                    {goal.subtasks.map((subtask) => (
                      <motion.div
                        key={subtask.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <SubtaskItem
                          subtask={subtask}
                          isPending={pendingSubtasks.has(subtask.id)}
                          onToggle={(subtaskId) => onToggleSubtask(goal.id, subtaskId)}
                          onDelete={onDeleteSubtask}
                          onSetEffort={onSetEffort}
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
