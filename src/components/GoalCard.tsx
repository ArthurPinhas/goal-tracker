import { useEffect, useRef, useState, useCallback, memo, type PointerEvent } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence, useAnimation, useReducedMotion } from "framer-motion";
import type { Goal, GoalCategory, GoalShowcaseFileOptions } from "@/types/goal";
import { calcProgress, getProgressColor, isGoalComplete } from "@/lib/goalUtils";
import { goalHasShowcaseMedia, getGoalShowcaseImageUrl } from "@/lib/goalShowcaseAsset";
import GoalProgress from "./GoalProgress";
import SubtaskItem from "./SubtaskItem";
import AddSubtaskDialog from "./AddSubtaskDialog";
import EditGoalDialog from "./EditGoalDialog";
import { GoalShowcaseBlock } from "./GoalShowcaseBlock";
import { ShowcaseQuickDialog } from "./ShowcaseQuickDialog";
import { LinkifiedText } from "@/components/LinkifiedText";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, Trash2, Trophy, GripVertical, ChevronDown, Archive, StickyNote, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { getEnergyAccent } from "@/lib/energyAccent";
import { premiumSpring, smoothOut, tactileHover, tactileTap } from "@/lib/motion";
import type { CelebrationQuality } from "@/hooks/useResponsiveUI";
import { formatDueChip, getDueUrgency, isIncompleteForDueDate } from "@/lib/dueDateUtils";
import { HALFWAY_TOASTS, pickRandom } from "@/lib/motivationalCopy";

interface GoalCardProps {
  goal: Goal;
  pendingSubtasks: Set<string>;
  /** Dials celebration weight for touch / small screens / reduced motion */
  celebrationQuality?: CelebrationQuality;
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
    notes: string,
    categoryId: string | null,
    showcaseUrl: string | null,
    showcaseCaption: string | null,
    showcaseFile?: GoalShowcaseFileOptions
  ) => void;
  categories: GoalCategory[];
  onCreateCategory: (name: string) => Promise<string | null>;
  onSetEffort: (subtaskId: string, effort: number | null) => void;
  onUpdateSubtaskNotes: (subtaskId: string, notes: string) => void;
  /** No-subtask goals: toggle PocketBase `completed` on the goal */
  onToggleGoalStandaloneComplete: (goalId: string) => void;
  pendingGoalComplete: Set<string>;
  /** Bulk selection (Index toolbar) */
  bulkSelectionMode?: boolean;
  bulkSelected?: boolean;
  onBulkToggle?: (goalId: string, selected: boolean) => void;
  onArchive?: (goalId: string) => void;
  showDragHandle?: boolean;
  /** When set (touch / narrow layouts), drag-to-reorder only starts from the grip — avoids scroll fighting. */
  reorderHandlePointerDown?: (event: PointerEvent<HTMLSpanElement>) => void;
}

const GoalCard = memo(({ goal, pendingSubtasks, celebrationQuality = 'full', isCelebrating = false, onToggleSubtask, onAddSubtask, onDelete, onDeleteSubtask, onEdit, categories, onCreateCategory, onSetEffort, onUpdateSubtaskNotes, onToggleGoalStandaloneComplete, pendingGoalComplete, bulkSelectionMode = false, bulkSelected = false, onBulkToggle, onArchive, showDragHandle = true, reorderHandlePointerDown }: GoalCardProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showGoalNotes, setShowGoalNotes] = useState(false);
  const [quickShowcaseOpen, setQuickShowcaseOpen] = useState(false);
  const [goalNoteDraft, setGoalNoteDraft] = useState(goal.notes);
  const percentage = calcProgress(goal);
  const isComplete = isGoalComplete(goal);
  const standalonePending = pendingGoalComplete.has(goal.id);
  const isInProgress = percentage > 0 && !isComplete;
  const incompleteForDue = isIncompleteForDueDate(goal);
  const dueUrgency = getDueUrgency(goal.due_date, incompleteForDue && !isComplete);
  const energy = getEnergyAccent(goal.id, goal.category?.id);
  const doneCount = goal.subtasks.filter((s) => s.is_completed).length;
  const controls = useAnimation();
  const reduceMotion = useReducedMotion();
  /** Desktop-only: sweep, particles, infinite glow, scale bounce — too heavy on touch devices */
  const heavyCelebration = celebrationQuality === "full";
  /** Skip `height: auto` animations on subtasks / expand — mobile + reduced celebration tier */
  const liteSubtreeMotion = celebrationQuality !== "full";

  const prevPercentage = useRef<number | null>(null);
  /** Tracks real completion transitions — avoids spurious toasts when % flickers */
  const prevCompleteRef = useRef<boolean | null>(null);
  const prevSubtaskLenRef = useRef<number | null>(null);

  useEffect(() => {
    const complete = isGoalComplete(goal);
    const n = goal.subtasks.length;

    if (prevCompleteRef.current === null) {
      prevCompleteRef.current = complete;
      prevPercentage.current = percentage;
      prevSubtaskLenRef.current = n;
      return;
    }

    const prevPct = prevPercentage.current ?? 0;
    prevCompleteRef.current = complete;

    if (
      prevPct < 50 &&
      percentage >= 50 &&
      percentage < 100 &&
      goal.subtasks.length > 0 &&
      !complete
    ) {
      toast(pickRandom(HALFWAY_TOASTS), {
        id: `goal-half-${goal.id}`,
        icon: "🔥",
      });
    }

    prevPercentage.current = percentage;
    prevSubtaskLenRef.current = n;
  }, [percentage, goal]);

  useEffect(() => {
    setGoalNoteDraft(goal.notes);
  }, [goal.notes]);

  const handleToggleSubtask = useCallback(
    (subtaskId: string) => onToggleSubtask(goal.id, subtaskId),
    [goal.id, onToggleSubtask]
  );

  const flushGoalNotes = () => {
    const t = goalNoteDraft.trim();
    if (t !== (goal.notes || "").trim()) {
      onEdit(
        goal.id,
        goal.title,
        goal.description,
        goal.due_date,
        goal.emoji,
        t,
        goal.category?.id ?? null,
        goal.showcase_url,
        goal.showcase_caption
      );
    }
  };

  // Force expand during celebration
  useEffect(() => {
    if (isCelebrating) setCollapsed(false);
  }, [isCelebrating]);

  return (
    <motion.div
      id={`goal-card-${goal.id}`}
      animate={controls}
      whileHover={
        !isCelebrating && !reduceMotion ? tactileHover : undefined
      }
      transition={premiumSpring}
      className={cn(
        "relative isolate z-[1] overflow-visible rounded-2xl border transition-[transform,box-shadow] duration-300 ease-out",
        "surface-grain backdrop-blur-sm border-border/45 bg-card shadow-neo-card",
        "dark:border-white/[0.09]",
        isComplete && !isCelebrating && "scale-[1.01] origin-center will-change-transform motion-reduce:scale-100",
        isCelebrating && heavyCelebration && "celebration-card ring-2 ring-mint/75 ring-offset-2 ring-offset-background dark:ring-offset-background",
        isCelebrating && !heavyCelebration && "celebration-card-minimal ring-2 ring-gold/70 ring-offset-2 ring-offset-background dark:ring-offset-background",
        !isCelebrating && isComplete && "ring-2 ring-mint/80 goal-card-hero-shell",
        !isCelebrating && !isComplete && dueUrgency === "overdue" && "ring-2 ring-red-500/45",
        !isCelebrating && !isComplete && dueUrgency === "soon" && "ring-2 ring-gold/45",
        !isCelebrating && isInProgress && "goal-pulse-ring",
      )}
      style={{
        borderLeft: `2px solid ${isCelebrating ? "rgba(52, 211, 153, 0.65)" : `rgba(${energy.ringRgb}, 0.3)`}`,
        background:
          isCelebrating && heavyCelebration
            ? "linear-gradient(135deg, hsl(239,32%,12%) 0%, hsl(258,28%,15%) 38%, hsl(158,22%,14%) 52%, hsl(239,32%,12%) 100%)"
            : undefined,
      }}
    >
        {/* Energy halo — inside same motion node as surface so it stays aligned during reorder drag */}
        {!isCelebrating && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[-1px] z-0 rounded-2xl"
            style={{
              boxShadow: isComplete
                ? `
                  0 0 0 1px rgba(${energy.ringRgb}, 0.07),
                  0 6px 32px -14px rgba(${energy.ringRgb}, 0.14),
                  0 0 40px -16px rgba(${energy.ringRgb}, 0.09)
                `
                : `
                  0 0 0 1px rgba(${energy.ringRgb}, 0.11),
                  0 7px 36px -12px rgba(${energy.ringRgb}, 0.22),
                  0 0 44px -14px rgba(${energy.ringRgb}, 0.14)
                `,
            }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent dark:via-white/[0.08]"
          aria-hidden
        />
        {isComplete && !isCelebrating && (
          <>
            <div className="goal-card-hero-gold" aria-hidden />
            <div
              className="pointer-events-none absolute inset-0 z-[2] rounded-2xl opacity-25 mix-blend-screen"
              style={{
                background: `radial-gradient(circle at 50% 0%, rgba(${energy.ringRgb},0.16), transparent 55%)`,
              }}
              aria-hidden
            />
          </>
        )}
        {/* Rare-card hologram — foil sweep (subtask sparks stay separate; no goal-level particle burst) */}
        <AnimatePresence>
          {isCelebrating && heavyCelebration && (
            <motion.div
              key="goal-holo-flash"
              className="pointer-events-none absolute inset-0 z-[6] rounded-2xl bg-gradient-to-b from-mint/35 via-gold/18 to-transparent dark:from-mint/30 dark:via-gold/14"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.88, times: [0, 0.14, 1], ease: "easeOut" }}
            />
          )}
          {isCelebrating && !heavyCelebration && (
            <motion.div
              key="goal-holo-flash-lite"
              className="pointer-events-none absolute inset-0 z-[6] rounded-2xl bg-gradient-to-b from-mint/40 via-transparent to-gold/15"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.58, 0] }}
              transition={{ duration: 0.62, times: [0, 0.18, 1] }}
            />
          )}
        </AnimatePresence>
        {isCelebrating && !reduceMotion && (
          <div className="pointer-events-none absolute inset-0 z-[7] overflow-hidden rounded-2xl" aria-hidden>
            <div className="goal-hologram-foil-band" />
          </div>
        )}

        {/* Header — grid so title + actions don’t collide on narrow widths */}
        <div
          className={cn(
            "grid gap-x-2 gap-y-2 px-4 py-3.5 items-start",
            bulkSelectionMode
              ? "grid-cols-[auto_auto_minmax(0,1fr)] md:grid-cols-[auto_auto_minmax(0,1fr)_auto] md:items-center"
              : "grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center",
          )}
          style={{ position: 'relative', zIndex: 3 }}
        >
          {bulkSelectionMode && onBulkToggle && (
            <div className="col-start-1 row-start-1 flex h-11 shrink-0 items-center">
              <Checkbox
                checked={bulkSelected}
                onCheckedChange={(v) => onBulkToggle(goal.id, v === true)}
                aria-label={`Select ${goal.title}`}
                className="border-muted-foreground/50 data-[state=checked]:bg-primary"
              />
            </div>
          )}
          {showDragHandle ? (
            reorderHandlePointerDown ? (
              <motion.button
                type="button"
                whileHover={reduceMotion ? undefined : tactileHover}
                whileTap={reduceMotion ? undefined : tactileTap}
                transition={premiumSpring}
                className={cn(
                  bulkSelectionMode ? "col-start-2 row-start-1" : "col-start-1 row-start-1",
                  "-ml-1.5 flex h-11 min-w-11 shrink-0 items-center justify-center touch-manipulation rounded-xl",
                  "cursor-grab active:cursor-grabbing touch-none select-none",
                  "text-muted-foreground hover:bg-secondary/55 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
                title="Drag to reorder"
                aria-label="Drag to reorder goal"
                onPointerDown={(e) => {
                  if (e.pointerType === "touch") e.preventDefault();
                  reorderHandlePointerDown(e);
                }}
              >
                <GripVertical className="h-5 w-5 pointer-events-none" aria-hidden />
              </motion.button>
            ) : (
              <div
                className={cn(
                  bulkSelectionMode ? "col-start-2 row-start-1" : "col-start-1 row-start-1",
                  "-ml-1.5 flex h-11 min-w-11 shrink-0 items-center justify-center text-muted-foreground/35 pointer-events-none",
                )}
                aria-hidden
              >
                <GripVertical className="h-5 w-5" />
              </div>
            )
          ) : (
            <div
              className={cn(
                bulkSelectionMode ? "col-start-2 row-start-1" : "col-start-1 row-start-1",
                "w-11 shrink-0",
              )}
              aria-hidden
            />
          )}

          <motion.button
            type="button"
            whileHover={reduceMotion ? undefined : tactileHover}
            whileTap={reduceMotion ? undefined : tactileTap}
            transition={premiumSpring}
            className={cn(
              bulkSelectionMode ? "col-start-3 row-start-1" : "col-start-2 row-start-1",
              "flex min-w-0 items-start gap-2 text-left md:col-span-1 rounded-xl transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.97]",
            )}
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
                  <Trophy className={`h-4 w-4 ${isCelebrating ? "text-gold" : "text-mint"}`} />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="min-w-0 flex-1">
              <div className={cn('flex items-center gap-2 min-w-0', collapsed && 'w-full justify-between')}>
                <span
                  className={`text-base font-semibold tracking-tight min-w-0 break-words line-clamp-2 md:line-clamp-none md:truncate ${collapsed ? 'flex-1' : ''} ${isComplete ? 'text-mint' : 'text-card-foreground'}`}
                >
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
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {goal.subtasks.length > 0
                        ? `${doneCount}/${goal.subtasks.length}`
                        : goal.is_completed
                          ? 'Done'
                          : '—'}
                    </span>
                  </div>
                )}
              </div>
              {goal.category && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex max-w-full min-w-0 items-center truncate rounded-md border border-border/60 bg-secondary/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:bg-secondary/30">
                    {goal.category.name}
                  </span>
                </div>
              )}
              {goal.due_date && (
                <div
                  className={cn(
                    'flex items-center gap-1 mt-1 text-xs',
                    dueUrgency === 'overdue' && 'text-red-400 font-medium',
                    dueUrgency === 'soon' && 'text-gold/95',
                    dueUrgency === 'none' && 'text-muted-foreground'
                  )}
                >
                  <CalendarDays className="h-3 w-3 shrink-0 opacity-80" />
                  <span>{formatDueChip(goal.due_date)}</span>
                  {dueUrgency === 'overdue' && <span className="text-red-400/90">· Overdue</span>}
                  {dueUrgency === 'soon' && <span className="text-gold/85">· Due soon</span>}
                </div>
              )}
            </div>
          </motion.button>

          <div
            className={cn(
              "flex items-center justify-end gap-0.5 max-md:min-h-11 md:gap-1",
              bulkSelectionMode
                ? "col-span-3 col-start-1 row-start-2 md:col-span-1 md:col-start-4 md:row-start-1"
                : "col-span-2 col-start-1 md:col-span-1 md:col-start-3 md:row-start-1",
            )}
          >
            <EditGoalDialog goal={goal} categories={categories} onCreateCategory={onCreateCategory} onEdit={onEdit} />
            {isComplete && !isCelebrating && onArchive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 touch-manipulation md:h-7 md:w-7 text-muted-foreground hover:text-gold hover:bg-gold/12"
                onClick={() => onArchive(goal.id)}
                title="Archive goal"
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 touch-manipulation md:h-7 md:w-7 text-muted-foreground hover:text-destructive">
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
                  <AlertDialogAction variant="destructive" onClick={() => onDelete(goal.id)}>
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
              initial={liteSubtreeMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={liteSubtreeMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={liteSubtreeMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={
                liteSubtreeMotion ? { duration: 0.18, ease: smoothOut } : { duration: 0.28, ease: smoothOut }
              }
              style={{
                overflow: liteSubtreeMotion ? "visible" : "hidden",
                position: "relative",
                zIndex: 3,
              }}
            >
              <div className="px-4 pb-5 space-y-5 border-t border-border/60 pt-4 min-w-0">
                {goal.description && (
                  <LinkifiedText
                    text={goal.description}
                    as="p"
                    className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words"
                  />
                )}
                {isComplete && !goalHasShowcaseMedia(goal) && (
                  <div className="rounded-2xl border border-dashed border-mint/45 bg-mint/[0.06] px-3.5 py-3 dark:bg-mint/[0.05]">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                      Want to save a clip, screenshot, or link to this win? Optional — upload an image or paste a URL.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-gold/45 text-gold hover:bg-gold/10 dark:text-gold dark:hover:bg-gold/10"
                      onClick={() => setQuickShowcaseOpen(true)}
                    >
                      Link your win
                    </Button>
                  </div>
                )}
                {isComplete && goalHasShowcaseMedia(goal) && (
                  <GoalShowcaseBlock
                    url={goal.showcase_url}
                    uploadedImageUrl={getGoalShowcaseImageUrl(goal)}
                    caption={goal.showcase_caption}
                    onEditShowcase={() => setQuickShowcaseOpen(true)}
                  />
                )}
                <ShowcaseQuickDialog
                  goal={goal}
                  open={quickShowcaseOpen}
                  onOpenChange={setQuickShowcaseOpen}
                  onSave={(url, cap, fileOpts) => {
                    onEdit(
                      goal.id,
                      goal.title,
                      goal.description,
                      goal.due_date,
                      goal.emoji,
                      goal.notes,
                      goal.category?.id ?? null,
                      url,
                      cap,
                      fileOpts
                    );
                  }}
                />
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
                        "h-10 w-10 shrink-0 touch-manipulation text-muted-foreground hover:text-gold hover:bg-gold/12 md:h-8 md:w-8",
                        (showGoalNotes || goal.notes?.trim()) && "text-gold"
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
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("a")) return;
                        setShowGoalNotes(true);
                      }}
                    >
                      <LinkifiedText text={goal.notes} as="span" />
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
                      Subtasks ·{' '}
                      {goal.subtasks.length > 0
                        ? `${doneCount}/${goal.subtasks.length}`
                        : goal.is_completed
                          ? 'done'
                          : '—'}
                    </span>
                    <AddSubtaskDialog onAdd={(t, n) => onAddSubtask(goal.id, t, n)} />
                  </div>
                  <AnimatePresence initial={false}>
                    {goal.subtasks.length === 0 && (
                      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-secondary/25 px-3 py-2.5 dark:bg-secondary/20">
                        {standalonePending && (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                        )}
                        <Checkbox
                          id={`goal-standalone-${goal.id}`}
                          checked={goal.is_completed}
                          onCheckedChange={() => onToggleGoalStandaloneComplete(goal.id)}
                          className="shrink-0"
                          disabled={standalonePending}
                        />
                        <label
                          htmlFor={`goal-standalone-${goal.id}`}
                          className={cn(
                            "text-sm cursor-pointer select-none flex-1 min-w-0 leading-snug",
                            goal.is_completed ? "text-mint font-medium" : "text-card-foreground"
                          )}
                        >
                          {goal.is_completed ? "Marked complete" : "Mark goal complete (no subtasks)"}
                        </label>
                      </div>
                    )}
                    {goal.subtasks.map((subtask) =>
                      liteSubtreeMotion ? (
                        <div key={subtask.id} className="min-w-0">
                          <SubtaskItem
                            subtask={subtask}
                            isPending={pendingSubtasks.has(subtask.id)}
                            particleAccent={energy.particle}
                            onToggle={handleToggleSubtask}
                            onDelete={onDeleteSubtask}
                            onSetEffort={onSetEffort}
                            onUpdateNotes={onUpdateSubtaskNotes}
                          />
                        </div>
                      ) : (
                        <motion.div
                          key={subtask.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: smoothOut }}
                          className="min-w-0"
                        >
                          <SubtaskItem
                            subtask={subtask}
                            isPending={pendingSubtasks.has(subtask.id)}
                            particleAccent={energy.particle}
                            onToggle={handleToggleSubtask}
                            onDelete={onDeleteSubtask}
                            onSetEffort={onSetEffort}
                            onUpdateNotes={onUpdateSubtaskNotes}
                          />
                        </motion.div>
                      ),
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
  );
});

GoalCard.displayName = "GoalCard";

export default GoalCard;
