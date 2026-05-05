import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";
import { useDueNotifications } from "@/hooks/useDueNotifications";
import { Goal } from "@/types/goal";
import { calcProgress } from "@/lib/goalUtils";
import GoalCard from "@/components/GoalCard";
import AddGoalDialog from "@/components/AddGoalDialog";
import SkeletonGoalCard from "@/components/SkeletonGoalCard";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import StickyHeader from "@/components/StickyHeader";
import GoalSidebar from "@/components/GoalSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { DueNotificationToggle } from "@/components/DueNotificationToggle";
import { showDueReminderInAppToast } from "@/components/DueReminderInAppToast";
import { PageSideParticles } from "@/components/PageSideParticles";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Target, LogOut, Search, Volume2, VolumeX, Check, Loader2, AlertCircle, Archive, RotateCcw, CheckSquare, Trash2, CalendarDays, SearchX, Sparkles, Trophy } from "lucide-react";
import { isSoundEnabled, toggleSound } from "@/lib/sounds";
import { formatDueChip, getDueUrgency, isIncompleteForDueDate } from "@/lib/dueDateUtils";
import { smoothOut, springContent } from "@/lib/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Progress is progress, no matter how small.",
  "Done is better than perfect.",
  "One goal at a time. One step at a time.",
  "What you do today shapes who you become tomorrow.",
  "Small wins build big momentum.",
  "Your future self will thank you.",
  "Every expert was once a beginner.",
];

const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

const HEADER_ORBS = [
  { w: 118, h: 82, left: '6%',  top: '-30%', color: '#34d399', opacity: 0.13, duration: 9,  delay: 0 },
  { w: 138, h: 102, left: '42%', top: '-40%', color: '#a78bfa', opacity: 0.11, duration: 13, delay: 2 },
  { w: 78, h: 62,  left: '74%', top: '0%',   color: '#60a5fa', opacity: 0.12, duration: 10, delay: 1 },
  { w: 148, h: 92, left: '-6%', top: '20%',  color: '#8b5cf6', opacity: 0.095, duration: 12, delay: 3 },
  { w: 74,  h: 74,  left: '90%', top: '-20%', color: '#34d399', opacity: 0.11, duration: 11, delay: 1.5 },
];

/* Fixed-page wash: smaller / softer than before — side *particles* carry the sparkle */
const PAGE_ORBS = [
  { w: 200, h: 168, left: '-56px', top: '22%', color: '#34d399', opacity: 0.038, duration: 24, delay: 0 },
  { w: 185, h: 158, left: 'auto',  top: '34%', right: '-52px', color: '#a78bfa', opacity: 0.034, duration: 30, delay: 4 },
  { w: 165, h: 138, left: '2%',    top: 'auto',  bottom: '16%',  color: '#60a5fa', opacity: 0.03, duration: 26, delay: 7 },
];

type Filter = 'all' | 'active' | 'done' | 'archived';
type DueFilter = 'all' | 'has_due' | 'overdue' | 'due_soon';
type GoalSortMode = 'manual' | 'due_asc';

function sortGoalsByDueAsc(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}

function matchesDueFilter(goal: Goal, df: DueFilter): boolean {
  if (df === 'all') return true;
  if (df === 'has_due') return !!goal.due_date;
  const incomplete = isIncompleteForDueDate(goal);
  const u = getDueUrgency(goal.due_date, incomplete);
  if (df === 'overdue') return u === 'overdue';
  if (df === 'due_soon') return u === 'soon';
  return true;
}

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { goals, loading, pendingSubtasks, saveStatus, archivedGoals, archivedLoading, createGoal, editGoal, deleteGoal, archiveGoal, restoreGoal, deleteArchivedGoal, fetchArchivedGoals, addSubtask, toggleSubtask, deleteSubtask, updateSubtaskEffort, updateSubtaskNotes, reorderGoals } = useGoals();
  const [orderedGoals, setOrderedGoals] = useState<Goal[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [goalSortMode, setGoalSortMode] = useState<GoalSortMode>('manual');
  const [celebratingGoals, setCelebratingGoals] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const prevProgresses = useRef<Record<string, number>>({});
  const headerRef = useRef<HTMLDivElement>(null);
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dueNotify = useDueNotifications(goals, {
    onDelivered: ({ title, body }) => {
      showDueReminderInAppToast(title, body);
    },
  });

  // Sticky header: show when main header scrolls out of view
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, orderedGoals.length]);

  useEffect(() => {
    orderedGoals.forEach((goal) => {
      const pct = calcProgress(goal);
      const prev = prevProgresses.current[goal.id];
      if (prev !== undefined && prev < 100 && pct >= 100 && goal.subtasks.length > 0) {
        setCelebratingGoals((s) => new Set([...s, goal.id]));
        setShowCelebration(true);
        setTimeout(() => {
          setCelebratingGoals((s) => { const n = new Set(s); n.delete(goal.id); return n; });
        }, 3500);
      }
      prevProgresses.current[goal.id] = pct;
    });
  }, [orderedGoals]);

  useEffect(() => {
    setOrderedGoals((prev) => {
      if (prev.length === 0 && goals.length > 0) {
        const saved: string[] = (() => { try { return JSON.parse(localStorage.getItem('goal-order') || '[]'); } catch { return []; } })();
        if (saved.length === 0) return goals;
        return [...goals].sort((a, b) => {
          const ai = saved.indexOf(a.id), bi = saved.indexOf(b.id);
          if (ai === -1 && bi === -1) return 0;
          /* Prefer goals not yet in saved order (new creations) at the top */
          if (ai === -1) return -1;
          if (bi === -1) return 1;
          return ai - bi;
        });
      }
      const existingIds = new Set(prev.map((g) => g.id));
      const newGoals = goals.filter((g) => !existingIds.has(g.id));
      const filtered = prev
        .filter((g) => goals.some((ng) => ng.id === g.id))
        .map((g) => goals.find((ng) => ng.id === g.id)!);
      /** New IDs from PocketBase (`sort_order: -Date.now()`) go at the top; keep prior manual order below */
      return [...newGoals, ...filtered];
    });
  }, [goals]);

  // Fetch archived goals lazily when tab first opened
  const archivedFetched = useRef(false);
  useEffect(() => {
    if (filter === 'archived' && !archivedFetched.current) {
      archivedFetched.current = true;
      fetchArchivedGoals();
    }
  }, [filter, fetchArchivedGoals]);

  // Cmd/Ctrl+N opens new goal dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setAddGoalOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleToggleSound = () => setSoundOn(toggleSound());

  const searchLower = search.toLowerCase().trim();
  const matchesSearch = (g: Goal) => {
    if (!searchLower) return true;
    return (
      g.title.toLowerCase().includes(searchLower) ||
      g.description?.toLowerCase().includes(searchLower) ||
      (g.notes && g.notes.toLowerCase().includes(searchLower)) ||
      g.subtasks.some(
        (s) =>
          s.title.toLowerCase().includes(searchLower) ||
          (s.notes && s.notes.toLowerCase().includes(searchLower))
      )
    );
  };

  const activeGoalsBase = orderedGoals.filter((g) => (calcProgress(g) < 100 || celebratingGoals.has(g.id)) && matchesSearch(g));
  const completedGoalsBase = orderedGoals.filter((g) => calcProgress(g) >= 100 && g.subtasks.length > 0 && !celebratingGoals.has(g.id) && matchesSearch(g));

  const activeGoalsFiltered = activeGoalsBase.filter((g) => matchesDueFilter(g, dueFilter));
  const completedGoalsFiltered = completedGoalsBase.filter((g) => matchesDueFilter(g, dueFilter));

  const activeGoals = goalSortMode === 'due_asc' ? sortGoalsByDueAsc(activeGoalsFiltered) : activeGoalsFiltered;
  const completedGoals = completedGoalsFiltered;

  const canDragReorder = dueFilter === 'all' && goalSortMode === 'manual';

  const overdueCount = orderedGoals.filter(
    (g) => getDueUrgency(g.due_date, isIncompleteForDueDate(g)) === 'overdue'
  ).length;
  const dueSoonCount = orderedGoals.filter(
    (g) => getDueUrgency(g.due_date, isIncompleteForDueDate(g)) === 'soon'
  ).length;

  const showActive = filter !== 'done' && filter !== 'archived';
  const showCompleted = filter !== 'active' && filter !== 'archived';

  const totalSubtasksDone = orderedGoals.reduce((sum, g) => sum + g.subtasks.filter((s) => s.is_completed).length, 0);
  const totalSubtasks = orderedGoals.reduce((sum, g) => sum + g.subtasks.length, 0);
  const username = (user as { name?: string })?.name ?? 'there';

  const sharedCardProps = {
    pendingSubtasks,
    onToggleSubtask: toggleSubtask,
    onAddSubtask: addSubtask,
    onDelete: deleteGoal,
    onDeleteSubtask: deleteSubtask,
    onEdit: editGoal,
    onSetEffort: updateSubtaskEffort,
    onUpdateSubtaskNotes: updateSubtaskNotes,
  };

  const dueReminderToggle = (
    <DueNotificationToggle
      variant="header"
      enabled={dueNotify.notificationsEnabled}
      onEnable={async () => {
        const r = await dueNotify.setDueNotificationsOn();
        if (r === "denied") toast.error("Allow notifications in your browser to get due-date reminders.");
        if (r === "unsupported") toast.error("Notifications are not available in this environment.");
        if (r === "ok") {
          toast.success("Reminders on—you’ll also see a message in this page when something is due.", { duration: 4000 });
        }
        return r;
      }}
      onDisable={dueNotify.setDueNotificationsOff}
    />
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Page-wide ambient orbs — fixed, edge-positioned */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {PAGE_ORBS.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: orb.w, height: orb.h,
              left: orb.left, top: orb.top,
              ...(('right' in orb && orb.right) ? { right: orb.right } : {}),
              ...(('bottom' in orb && orb.bottom) ? { bottom: orb.bottom } : {}),
              backgroundColor: orb.color,
              opacity: orb.opacity,
              filter: 'blur(92px)',
            }}
            animate={{ y: [0, -24, 8, -16, 0], x: [0, 12, -8, 14, 0] }}
            transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <PageSideParticles />

      {/* Lottie celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay onComplete={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>

      {/* Sticky header — slides in when main header scrolls away */}
      <AnimatePresence>
        {showStickyHeader && (
          <StickyHeader
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            onLogout={handleLogout}
            onAdd={createGoal}
            addGoalOpen={addGoalOpen}
            onAddGoalOpenChange={setAddGoalOpen}
            dueNotificationsSlot={dueReminderToggle}
          />
        )}
      </AnimatePresence>

      {/* Goals hero: gradient + orbs clipped in the layer below — no extra bottom wash */}
      <div ref={headerRef} className="index-hero relative z-10 overflow-visible px-4 sm:px-6 pt-10 pb-11">
        <div
          className="absolute inset-0 -z-10 overflow-hidden rounded-b-[1.75rem] md:rounded-b-[2rem] pointer-events-none shadow-[0_28px_64px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]"
          aria-hidden
        >
          <div className="absolute inset-0 gradient-header-bg" />
          {HEADER_ORBS.map((orb, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: orb.w,
                height: orb.h,
                left: orb.left,
                top: orb.top,
                backgroundColor: orb.color,
                opacity: orb.opacity,
                filter: "blur(38px)",
                zIndex: 1,
              }}
              animate={{
                y: [0, -18, 6, -12, 0],
                x: [0, 9, -6, 11, 0],
                scale: [1, 1.06, 0.96, 1.04, 1],
              }}
              transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-white/55" />
                <span className="text-white/45 text-[11px] font-semibold tracking-[0.18em] uppercase">
                  Goal Tracker
                </span>
              </div>
              <h1 className="text-4xl sm:text-[2.5rem] font-semibold text-white tracking-tight text-balance [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
                Hey, {username}
              </h1>
              <p className="text-white/45 text-sm sm:text-[0.9375rem] italic leading-relaxed max-w-xl">
                &ldquo;{quote}&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 pt-1 flex-wrap justify-end">
              <AddGoalDialog onAdd={createGoal} open={addGoalOpen} onOpenChange={setAddGoalOpen} />
              {dueReminderToggle}
              <ThemeToggle variant="header" />
              <Button variant="ghost" size="icon" onClick={handleToggleSound} title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
                className="text-white/50 hover:text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9">
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out"
                className="text-white/50 hover:text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!loading && orderedGoals.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } },
              }}
              className="flex flex-wrap items-end gap-x-10 gap-y-4 mt-6 pt-5 border-t border-white/[0.12]"
            >
              {[
                { label: 'Goals', value: orderedGoals.length },
                { label: 'Completed', value: completedGoalsBase.length },
                { label: 'Subtasks done', value: totalSubtasksDone },
              ].map(({ label, value }) => (
                <motion.div
                  key={label}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: springContent },
                  }}
                >
                  <div className="text-3xl font-semibold text-white tabular-nums tracking-tight [text-shadow:0_1px_16px_rgba(0,0,0,0.25)]">
                    {value}
                  </div>
                  <div className="text-[11px] text-white/45 font-medium uppercase tracking-[0.14em] mt-1.5">
                    {label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Content: tuck under hero with a hairline seam (no full-bleed color wash) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6 pt-8 sm:pt-10 relative z-10 -mt-3 sm:-mt-4">
        <div
          className="pointer-events-none absolute left-4 right-4 sm:left-6 sm:right-6 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent"
          aria-hidden
        />
        <div className="lg:flex gap-8 lg:gap-10 items-start pt-1">
          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:max-w-none lg:mx-0">
            {loading ? (
              <div className="space-y-3">
                <SkeletonGoalCard />
                <SkeletonGoalCard />
              </div>
            ) : orderedGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Set your first goal"
                description="Break it into steps. Track your progress. Celebrate every win."
              >
                <AddGoalDialog onAdd={createGoal} triggerClassName="cta-glow" />
              </EmptyState>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: smoothOut }}
                className="space-y-6"
              >
                {/* Search + filter */}
                <div className="space-y-3">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary/80" />
                    <Input
                      placeholder="Search goals and subtasks…"
                      className="pl-9 h-11 rounded-lg transition-all duration-300 ease-out focus-visible:ring-offset-background app-surface-input dark:focus-visible:shadow-md dark:focus-visible:shadow-primary/5"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { f: 'all', label: `All (${orderedGoals.length})` },
                      { f: 'active', label: `Active (${activeGoalsBase.length})` },
                      { f: 'done', label: `Done (${completedGoalsBase.length})` },
                      { f: 'archived', label: `Archived${archivedGoals.length > 0 ? ` (${archivedGoals.length})` : ''}` },
                    ] as { f: Filter; label: string }[]).map(({ f, label }) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={cn(
                          "min-h-10 px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all duration-300 ease-out",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          filter === f
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02] ring-2 ring-primary/25"
                            : "bg-secondary/80 dark:bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 hover:border-border hover:scale-[1.02] active:scale-[0.98]",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {filter !== 'archived' && (
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between pt-3 mt-1 border-t border-border/50">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                          Deadline
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {([
                            { df: 'all' as DueFilter, label: 'Any' },
                            { df: 'has_due', label: 'Has date' },
                            { df: 'overdue', label: 'Overdue' },
                            { df: 'due_soon', label: '≤7 days' },
                          ] as const).map(({ df, label }) => (
                            <button
                              key={df}
                              type="button"
                              onClick={() => setDueFilter(df)}
                              className={cn(
                                "min-h-10 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ease-out",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                dueFilter === df
                                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02] ring-2 ring-primary/25"
                                  : "bg-secondary/80 dark:bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 hover:border-border hover:scale-[1.02] active:scale-[0.98]",
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 sm:items-end">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                          Sort
                        </span>
                        <Select value={goalSortMode} onValueChange={(v) => setGoalSortMode(v as GoalSortMode)}>
                          <SelectTrigger className="min-h-10 h-10 w-full max-w-full sm:max-w-[220px] text-xs rounded-lg transition-all duration-300 app-surface-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual (drag to reorder)</SelectItem>
                            <SelectItem value="due_asc">Due date · soonest first</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active goals */}
                {showActive && activeGoals.length > 0 && (
                  canDragReorder ? (
                    <Reorder.Group
                      axis="y"
                      values={activeGoals}
                      onReorder={(reordered) => {
                        let next: Goal[] = [];
                        setOrderedGoals((prev) => {
                          const completedIds = new Set(prev.filter((g) => calcProgress(g) >= 100 && !celebratingGoals.has(g.id)).map((g) => g.id));
                          const completed = prev.filter((g) => completedIds.has(g.id));
                          next = [...reordered, ...completed];
                          localStorage.setItem('goal-order', JSON.stringify(next.map((g) => g.id)));
                          return next;
                        });
                        if (reorderTimer.current) clearTimeout(reorderTimer.current);
                        reorderTimer.current = setTimeout(() => reorderGoals(next), 600);
                      }}
                      as="div"
                      className="space-y-4"
                    >
                      <AnimatePresence initial={false}>
                        {activeGoals.map((goal, i) => (
                          <Reorder.Item
                            key={goal.id}
                            value={goal}
                            as="div"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05, ...springContent } }}
                            exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.28, ease: smoothOut } }}
                          >
                            <GoalCard goal={goal} showDragHandle isCelebrating={celebratingGoals.has(goal.id)} onArchive={() => archiveGoal(goal.id)} {...sharedCardProps} />
                          </Reorder.Item>
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {activeGoals.map((goal, i) => (
                          <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05, ...springContent } }}
                            exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.28, ease: smoothOut } }}
                          >
                            <GoalCard goal={goal} showDragHandle={false} isCelebrating={celebratingGoals.has(goal.id)} onArchive={() => archiveGoal(goal.id)} {...sharedCardProps} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )
                )}

                {/* Completed goals section */}
                {showCompleted && completedGoals.length > 0 && (
                  <div className="space-y-3">
                    {showActive && activeGoals.length > 0 && (
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">Completed</span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent" />
                      </div>
                    )}
                    <AnimatePresence initial={false}>
                      {completedGoals.map((goal, i) => (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: 0.28 + i * 0.05, ...springContent } }}
                          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25, ease: smoothOut } }}
                        >
                          <GoalCard goal={goal} showDragHandle={false} isCelebrating={celebratingGoals.has(goal.id)} onArchive={() => archiveGoal(goal.id)} {...sharedCardProps} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Archived goals */}
                {filter === 'archived' && (
                  <div className="space-y-3">
                    {archivedLoading ? (
                      <div className="space-y-3 py-1">
                        {[0, 1, 2].map((i) => (
                          <SkeletonGoalCard key={i} />
                        ))}
                      </div>
                    ) : archivedGoals.length === 0 ? (
                      <EmptyState
                        compact
                        icon={Archive}
                        title="Archive is empty"
                        description="When you archive a goal, it lands here. Restore it anytime or delete it permanently."
                      />
                    ) : archivedGoals.map((goal) => {
                      const pct = calcProgress(goal);
                      const done = goal.subtasks.filter((s) => s.is_completed).length;
                      return (
                        <div key={goal.id} className="group rounded-2xl border border-border/55 bg-card/60 backdrop-blur-sm px-4 py-4 flex items-start gap-3 opacity-90 hover:opacity-100 transition-all duration-300 hover:border-border/80 hover:shadow-xl hover:shadow-black/25 dark:bg-card/55 dark:hover:shadow-black/40">
                          <Archive className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm flex items-center gap-1.5 min-w-0">
                              {goal.emoji && <span className="shrink-0 text-base leading-none">{goal.emoji}</span>}
                              <span className="truncate min-w-0">{goal.title}</span>
                            </p>
                            {goal.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{goal.description}</p>}
                            {goal.due_date && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <CalendarDays className="h-3 w-3 shrink-0 opacity-80" />
                                <span>Due {formatDueChip(goal.due_date)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <CheckSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground tabular-nums">{done}/{goal.subtasks.length} subtasks · {pct}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => restoreGoal(goal.id)} title="Restore to active">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{goal.title}"?</AlertDialogTitle>
                                  <AlertDialogDescription>Permanently deletes from archive. Cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteArchivedGoal(goal.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No results */}
                {filter !== 'archived' && !(showActive && activeGoals.length > 0) && !(showCompleted && completedGoals.length > 0) && (
                  <>
                    {searchLower ? (
                      <EmptyState
                        compact
                        icon={SearchX}
                        title={`No matches for "${search}"`}
                        description="Try a shorter search or clear the box to see all goals."
                      />
                    ) : dueFilter !== 'all' ? (
                      <EmptyState
                        compact
                        icon={CalendarDays}
                        title="Nothing matches this deadline"
                        description="Switch deadline filter to “Any” or choose another option."
                      />
                    ) : filter === 'active' ? (
                      <EmptyState
                        compact
                        icon={Sparkles}
                        title="All caught up"
                        description="No active goals in this view — time to celebrate or plan the next win."
                      />
                    ) : (
                      <EmptyState
                        compact
                        icon={Trophy}
                        title="No completed goals yet"
                        description="Complete every subtask on a goal to see it listed here."
                      />
                    )}
                  </>
                )}
              </motion.div>
            )}

          </div>

          {/* Sticky sidebar — lg screens only */}
          <div className="sticky top-20">
            <GoalSidebar
              goals={orderedGoals}
              completedCount={completedGoalsBase.length}
              totalSubtasksDone={totalSubtasksDone}
              totalSubtasks={totalSubtasks}
              quote={quote}
              overdueCount={overdueCount}
              dueSoonCount={dueSoonCount}
            />
          </div>
        </div>
      </div>
      {/* Save indicator */}
      <AnimatePresence>
        {saveStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-xs font-medium backdrop-blur-xl shadow-2xl border ${
              saveStatus === 'error'
                ? 'bg-destructive/95 text-destructive-foreground border-destructive'
                : 'bg-card/90 text-foreground border-border/55'
            }`}
          >
            {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            {saveStatus === 'saved' && <Check className="h-3 w-3 text-primary" />}
            {saveStatus === 'error' && <AlertCircle className="h-3 w-3" />}
            <span>
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
