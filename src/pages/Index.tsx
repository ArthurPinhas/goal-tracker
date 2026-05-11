import { useState, useEffect, useRef, useMemo, useCallback, type ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";
import { useResponsiveUI } from "@/hooks/useResponsiveUI";
import { useDueNotifications } from "@/hooks/useDueNotifications";
import { Goal } from "@/types/goal";
import { calcProgress, isGoalComplete } from "@/lib/goalUtils";
import { goalHasShowcaseMedia } from "@/lib/goalShowcaseAsset";
import pb from "@/lib/pocketbase";
import GoalCard from "@/components/GoalCard";
import AddGoalDialog from "@/components/AddGoalDialog";
import SkeletonGoalCard from "@/components/SkeletonGoalCard";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import StickyHeader from "@/components/StickyHeader";
import GoalSidebar from "@/components/GoalSidebar";
import { LinkifiedText } from "@/components/LinkifiedText";
import ThemeToggle from "@/components/ThemeToggle";
import { DueNotificationToggle } from "@/components/DueNotificationToggle";
import { showDueReminderInAppToast } from "@/components/DueReminderInAppToast";
import { PageSideParticles } from "@/components/PageSideParticles";
import { UserHeroAvatar } from "@/components/UserHeroAvatar";
import { HeroShowcaseStrip } from "@/components/HeroShowcaseStrip";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Target, LogOut, Search, Volume2, VolumeX, Check, Loader2, AlertCircle, Archive, RotateCcw, CheckSquare, Trash2, CalendarDays, SearchX, Sparkles, Trophy, FolderTree } from "lucide-react";
import { isSoundEnabled, toggleSound } from "@/lib/sounds";
import { formatDueChip, getDueUrgency, isIncompleteForDueDate } from "@/lib/dueDateUtils";
import { appleEase, appleSpring, appleSpringGentle, smoothOut } from "@/lib/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pickRandom, HERO_HEADER_QUOTES } from "@/lib/motivationalCopy";

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

type Filter = 'all' | 'active' | 'done' | 'showcase' | 'archived';
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

type SharedGoalCardProps = Pick<
  ComponentProps<typeof GoalCard>,
  | "pendingSubtasks"
  | "pendingGoalComplete"
  | "celebrationQuality"
  | "onToggleSubtask"
  | "onAddSubtask"
  | "onDelete"
  | "onDeleteSubtask"
  | "onEdit"
  | "onSetEffort"
  | "onUpdateSubtaskNotes"
  | "onToggleGoalStandaloneComplete"
  | "categories"
  | "onCreateCategory"
>;

function ActiveReorderGoalItem({
  goal,
  index,
  celebratingGoals,
  shared,
  onArchive,
  dragFromHandleOnly,
  liteMotion,
}: {
  goal: Goal;
  index: number;
  celebratingGoals: Set<string>;
  shared: SharedGoalCardProps;
  onArchive: () => void;
  dragFromHandleOnly: boolean;
  liteMotion: boolean;
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={goal}
      as="div"
      dragListener={!dragFromHandleOnly}
      dragControls={dragFromHandleOnly ? dragControls : undefined}
      whileDrag={{ scale: 1, zIndex: 40, cursor: "grabbing" }}
      initial={liteMotion ? false : { opacity: 0, y: 16 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: liteMotion ? { duration: 0 } : { delay: index * 0.05, ...appleSpringGentle },
      }}
      exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.28, ease: smoothOut } }}
    >
      <GoalCard
        goal={goal}
        showDragHandle
        isCelebrating={celebratingGoals.has(goal.id)}
        onArchive={onArchive}
        reorderHandlePointerDown={dragFromHandleOnly ? (e) => dragControls.start(e) : undefined}
        {...shared}
      />
    </Reorder.Item>
  );
}

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ui = useResponsiveUI();
  const liteAmbience = ui.isNarrowViewport || ui.isCoarsePointer;
  const { goals, categories, loading, pendingSubtasks, pendingGoalComplete, saveStatus, archivedGoals, archivedLoading, createGoal, createCategory, editGoal, deleteGoal, archiveGoal, restoreGoal, deleteArchivedGoal, fetchArchivedGoals, addSubtask, toggleSubtask, toggleGoalStandaloneComplete, deleteSubtask, updateSubtaskEffort, updateSubtaskNotes, reorderGoals } = useGoals();
  const heroLine = useMemo(() => pickRandom(HERO_HEADER_QUOTES), []);
  const [orderedGoals, setOrderedGoals] = useState<Goal[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilterId, setCategoryFilterId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [goalSortMode, setGoalSortMode] = useState<GoalSortMode>('manual');
  const [celebratingGoals, setCelebratingGoals] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const prevProgresses = useRef<Record<string, number>>({});
  const prevGoalComplete = useRef<Record<string, boolean>>({});
  const headerRef = useRef<HTMLDivElement>(null);
  const mainGoalListRef = useRef<HTMLDivElement>(null);
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
    const ids = new Set(orderedGoals.map((g) => g.id));
    for (const id of Object.keys(prevProgresses.current)) {
      if (!ids.has(id)) {
        delete prevProgresses.current[id];
        delete prevGoalComplete.current[id];
      }
    }

    orderedGoals.forEach((goal) => {
      const pct = calcProgress(goal);
      const complete = isGoalComplete(goal);
      const prevPct = prevProgresses.current[goal.id];
      const prevDone = prevGoalComplete.current[goal.id];

      if (prevPct !== undefined && prevDone !== undefined) {
        if (
          !prevDone &&
          complete &&
          (goal.subtasks.length > 0 || goal.is_completed)
        ) {
          setCelebratingGoals((s) => new Set([...s, goal.id]));
          if (ui.celebrationQuality === "full") {
            setShowCelebration(true);
          }
          setTimeout(() => {
            setCelebratingGoals((s) => {
              const n = new Set(s);
              n.delete(goal.id);
              return n;
            });
          }, ui.celebrationGoalMs);
        }
      }

      prevProgresses.current[goal.id] = pct;
      prevGoalComplete.current[goal.id] = complete;
    });
  }, [orderedGoals, ui.celebrationGoalMs, ui.celebrationQuality]);

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
  const matchesCategory = (g: Goal) => !categoryFilterId || g.category?.id === categoryFilterId;
  const matchesSearch = (g: Goal) => {
    if (!searchLower) return true;
    return (
      g.title.toLowerCase().includes(searchLower) ||
      g.description?.toLowerCase().includes(searchLower) ||
      (g.notes && g.notes.toLowerCase().includes(searchLower)) ||
      (g.category && g.category.name.toLowerCase().includes(searchLower)) ||
      (g.showcase_url && g.showcase_url.toLowerCase().includes(searchLower)) ||
      (g.showcase_caption && g.showcase_caption.toLowerCase().includes(searchLower)) ||
      g.subtasks.some(
        (s) =>
          s.title.toLowerCase().includes(searchLower) ||
          (s.notes && s.notes.toLowerCase().includes(searchLower))
      )
    );
  };

  const activeGoalsBase = orderedGoals.filter((g) => (!isGoalComplete(g) || celebratingGoals.has(g.id)) && matchesSearch(g) && matchesCategory(g));
  const completedGoalsBase = orderedGoals.filter((g) => isGoalComplete(g) && !celebratingGoals.has(g.id) && matchesSearch(g) && matchesCategory(g));

  const showcaseCount = useMemo(
    () => orderedGoals.filter((g) => isGoalComplete(g) && goalHasShowcaseMedia(g)).length,
    [orderedGoals]
  );
  const showcaseSpotlightGoals = useMemo(
    () => orderedGoals.filter((g) => isGoalComplete(g) && goalHasShowcaseMedia(g)).slice(0, 8),
    [orderedGoals]
  );
  const showShowcaseHeroNudge = useMemo(
    () =>
      orderedGoals.length > 0 &&
      showcaseCount === 0 &&
      orderedGoals.some((g) => isGoalComplete(g)),
    [orderedGoals, showcaseCount]
  );

  const jumpToShowcaseGoal = useCallback((goalId: string) => {
    setFilter("all");
    requestAnimationFrame(() => {
      document.getElementById(`goal-card-${goalId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const seeAllShowcases = useCallback(() => {
    setFilter("showcase");
    requestAnimationFrame(() => {
      mainGoalListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const activeGoalsFiltered = activeGoalsBase.filter((g) => matchesDueFilter(g, dueFilter));
  const completedGoalsAfterDue = completedGoalsBase.filter((g) => matchesDueFilter(g, dueFilter));
  const completedGoalsFiltered =
    filter === "showcase" ? completedGoalsAfterDue.filter((g) => goalHasShowcaseMedia(g)) : completedGoalsAfterDue;

  const activeGoals = goalSortMode === 'due_asc' ? sortGoalsByDueAsc(activeGoalsFiltered) : activeGoalsFiltered;
  const completedGoals = completedGoalsFiltered;

  const canDragReorder = dueFilter === 'all' && goalSortMode === 'manual';

  const overdueCount = orderedGoals.filter(
    (g) => getDueUrgency(g.due_date, isIncompleteForDueDate(g)) === 'overdue'
  ).length;
  const dueSoonCount = orderedGoals.filter(
    (g) => getDueUrgency(g.due_date, isIncompleteForDueDate(g)) === 'soon'
  ).length;

  const showActive = filter !== 'done' && filter !== 'archived' && filter !== 'showcase';
  const showCompleted = filter !== 'active' && filter !== 'archived';

  const totalSubtasksDone = orderedGoals.reduce((sum, g) => sum + g.subtasks.filter((s) => s.is_completed).length, 0);
  const totalSubtasks = orderedGoals.reduce((sum, g) => sum + g.subtasks.length, 0);
  const username = (user as { name?: string })?.name ?? 'there';
  const userAvatarUrl = useMemo(() => {
    const r = user as { id?: string; avatar?: string } | null | undefined;
    if (!r?.id || !r.avatar || typeof r.avatar !== "string") return null;
    try {
      return pb.files.getUrl(r, r.avatar);
    } catch {
      return null;
    }
  }, [user]);

  const sharedCardProps = {
    pendingSubtasks,
    pendingGoalComplete,
    celebrationQuality: ui.celebrationQuality,
    onToggleSubtask: toggleSubtask,
    onAddSubtask: addSubtask,
    onDelete: deleteGoal,
    onDeleteSubtask: deleteSubtask,
    onEdit: editGoal,
    onSetEffort: updateSubtaskEffort,
    onUpdateSubtaskNotes: updateSubtaskNotes,
    onToggleGoalStandaloneComplete: toggleGoalStandaloneComplete,
    categories,
    onCreateCategory: createCategory,
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
    <div className="min-h-[100dvh] min-h-screen overflow-x-clip bg-background relative">
      {/* Page-wide ambient orbs — fixed, edge-positioned */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {PAGE_ORBS.map((orb, i) =>
          liteAmbience ? (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: orb.w,
                height: orb.h,
                left: orb.left,
                top: orb.top,
                ...(("right" in orb && orb.right ? { right: orb.right } : {})),
                ...(("bottom" in orb && orb.bottom ? { bottom: orb.bottom } : {})),
                backgroundColor: orb.color,
                opacity: orb.opacity * 0.92,
                filter: "blur(92px)",
              }}
            />
          ) : (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: orb.w,
                height: orb.h,
                left: orb.left,
                top: orb.top,
                ...(("right" in orb && orb.right ? { right: orb.right } : {})),
                ...(("bottom" in orb && orb.bottom ? { bottom: orb.bottom } : {})),
                backgroundColor: orb.color,
                opacity: orb.opacity,
                filter: "blur(92px)",
              }}
              animate={{ y: [0, -24, 8, -16, 0], x: [0, 12, -8, 14, 0] }}
              transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          )
        )}
      </div>

      <PageSideParticles lite={liteAmbience} />

      {/* Goal win overlay — CSS rings; Lottie removed for performance */}
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay quality={ui.celebrationQuality} onComplete={() => setShowCelebration(false)} />
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
            categories={categories}
            onCreateCategory={createCategory}
            addGoalOpen={addGoalOpen}
            onAddGoalOpenChange={setAddGoalOpen}
            dueNotificationsSlot={dueReminderToggle}
          />
        )}
      </AnimatePresence>

      {/* Goals hero: gradient + orbs clipped in the layer below — no extra bottom wash */}
      <div ref={headerRef} className="index-hero relative z-10 overflow-visible px-4 sm:px-6 pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+1.25rem))] md:pt-10 pb-11">
        <div
          className="absolute inset-0 -z-10 overflow-hidden rounded-b-[1.75rem] md:rounded-b-[2rem] pointer-events-none shadow-[0_28px_64px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]"
          aria-hidden
        >
          <div className="absolute inset-0 gradient-header-bg" />
          {HEADER_ORBS.map((orb, i) =>
            liteAmbience ? (
              <div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: orb.w,
                  height: orb.h,
                  left: orb.left,
                  top: orb.top,
                  backgroundColor: orb.color,
                  opacity: orb.opacity * 0.95,
                  filter: "blur(38px)",
                  zIndex: 1,
                }}
              />
            ) : (
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
            )
          )}
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-4 min-w-0">
            <div className="min-w-0 w-full md:flex-1">
              {userAvatarUrl ? (
                <div className="flex items-start gap-4 sm:gap-5">
                  <UserHeroAvatar src={userAvatarUrl} displayName={username} />
                  <div className="space-y-2 min-w-0 flex-1 relative">
                    <div className="header-hero-aura -translate-x-1 sm:translate-x-0" aria-hidden />
                    <div className="flex items-center gap-2 relative z-[1]">
                      <Target className="h-4 w-4 text-white/55" />
                      <span className="text-white/45 text-[11px] font-semibold tracking-[0.18em] uppercase">
                        Goal Tracker
                      </span>
                    </div>
                    <motion.h1
                      initial={ui.liteMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        ui.liteMotion ? { duration: 0 } : { duration: 0.52, ease: appleEase, delay: 0.05 }
                      }
                      className="relative z-[1] text-3xl sm:text-[2.5rem] font-semibold font-heading text-white tracking-tight text-balance break-words [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]"
                    >
                      Hey, {username}
                    </motion.h1>
                    <motion.p
                      initial={ui.liteMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        ui.liteMotion ? { duration: 0 } : { duration: 0.52, ease: appleEase, delay: 0.12 }
                      }
                      className="text-white/45 text-sm sm:text-[0.9375rem] italic leading-relaxed max-w-xl"
                    >
                      &ldquo;{heroLine}&rdquo;
                    </motion.p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 relative">
                  <div className="header-hero-aura left-[42%] sm:left-1/2" aria-hidden />
                  <div className="flex items-center gap-2 relative z-[1]">
                    <Target className="h-4 w-4 text-white/55" />
                    <span className="text-white/45 text-[11px] font-semibold tracking-[0.18em] uppercase">
                      Goal Tracker
                    </span>
                  </div>
                  <motion.h1
                    initial={ui.liteMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      ui.liteMotion ? { duration: 0 } : { duration: 0.52, ease: appleEase, delay: 0.05 }
                    }
                    className="relative z-[1] text-3xl sm:text-[2.5rem] font-semibold font-heading text-white tracking-tight text-balance break-words [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]"
                  >
                    Hey, {username}
                  </motion.h1>
                  <motion.p
                    initial={ui.liteMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      ui.liteMotion ? { duration: 0 } : { duration: 0.52, ease: appleEase, delay: 0.12 }
                    }
                    className="text-white/45 text-sm sm:text-[0.9375rem] italic leading-relaxed max-w-xl"
                  >
                    &ldquo;{heroLine}&rdquo;
                  </motion.p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 max-md:min-h-11 md:pt-1 w-full md:w-auto shrink-0 justify-start md:justify-end">
              <AddGoalDialog
                onAdd={createGoal}
                categories={categories}
                onCreateCategory={createCategory}
                open={addGoalOpen}
                onOpenChange={setAddGoalOpen}
              />
              {dueReminderToggle}
              <ThemeToggle variant="header" className="h-11 w-11 touch-manipulation md:h-9 md:w-9" />
              <Button variant="ghost" size="icon" onClick={handleToggleSound} title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
                className="text-white/50 hover:text-white hover:bg-white/10 h-11 w-11 md:h-9 md:w-9 min-h-11 min-w-11 md:min-h-9 md:min-w-9 touch-manipulation">
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out"
                className="text-white/50 hover:text-white hover:bg-white/10 h-11 w-11 md:h-9 md:w-9 min-h-11 min-w-11 md:min-h-9 md:min-w-9 touch-manipulation">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!loading && orderedGoals.length > 0 && (showcaseSpotlightGoals.length > 0 || showShowcaseHeroNudge) && (
            <HeroShowcaseStrip
              spotlightGoals={showcaseSpotlightGoals}
              showcaseCount={showcaseCount}
              onJumpToGoal={jumpToShowcaseGoal}
              onSeeAll={seeAllShowcases}
              showGentleNudge={showShowcaseHeroNudge}
              onViewDone={() => setFilter("done")}
            />
          )}

          {!loading && orderedGoals.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: ui.liteMotion
                    ? { staggerChildren: 0, delayChildren: 0 }
                    : { staggerChildren: 0.06, delayChildren: 0.18 },
                },
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
                    hidden: ui.liteMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: ui.liteMotion ? { duration: 0 } : appleSpringGentle,
                    },
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] pt-8 sm:pt-10 relative z-10 -mt-3 sm:-mt-4">
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
                <AddGoalDialog onAdd={createGoal} categories={categories} onCreateCategory={createCategory} triggerClassName="cta-glow" />
              </EmptyState>
            ) : (
              <motion.div
                initial={ui.liteMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={ui.liteMotion ? { duration: 0 } : { duration: 0.5, ease: appleEase }}
                className="space-y-6"
                ref={mainGoalListRef}
              >
                {/* Search + filter */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="relative group flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary/80" />
                    <Input
                      placeholder="Search goals, subtasks, categories…"
                      className="pl-9 max-md:min-h-11 h-11 md:h-10 rounded-lg transition-all duration-300 ease-out focus-visible:ring-offset-background app-surface-input dark:focus-visible:shadow-md dark:focus-visible:shadow-primary/5"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select
                    value={categoryFilterId ?? '__all__'}
                    onValueChange={(v) => setCategoryFilterId(v === '__all__' ? null : v)}
                  >
                    <SelectTrigger
                      aria-label="Filter by category"
                      className="w-full sm:w-[min(100%,220px)] shrink-0 max-md:min-h-11 min-h-11 md:min-h-10 h-11 md:h-10 rounded-lg transition-all duration-300 app-surface-input"
                    >
                      <FolderTree className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" aria-hidden />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All categories</SelectItem>
                      {categories.map((c) => {
                        const n = orderedGoals.filter((g) => g.category?.id === c.id).length;
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            {`${c.name} (${n})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { f: 'all', label: `All (${orderedGoals.length})` },
                      { f: 'active', label: `Active (${activeGoalsBase.length})` },
                      { f: 'done', label: `Done (${completedGoalsBase.length})` },
                      { f: 'showcase', label: `On display (${showcaseCount})` },
                      { f: 'archived', label: `Archived${archivedGoals.length > 0 ? ` (${archivedGoals.length})` : ''}` },
                    ] as { f: Filter; label: string }[]).map(({ f, label }) => (
                      <motion.button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        whileTap={ui.liteMotion ? undefined : { scale: 0.97 }}
                        transition={appleSpring}
                        className={cn(
                          "max-md:min-h-11 min-h-10 touch-manipulation px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all duration-300 ease-out",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          filter === f
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02] ring-2 ring-primary/25"
                            : "bg-secondary/80 dark:bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 hover:border-border hover:scale-[1.02] active:scale-[0.98]",
                        )}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                  {filter !== 'archived' && filter !== 'showcase' && (
                    <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-end md:justify-between pt-3 mt-1 border-t border-border/50">
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
                            <motion.button
                              key={df}
                              type="button"
                              onClick={() => setDueFilter(df)}
                              whileTap={ui.liteMotion ? undefined : { scale: 0.97 }}
                              transition={appleSpring}
                              className={cn(
                                "max-md:min-h-11 min-h-10 touch-manipulation px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ease-out",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                dueFilter === df
                                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02] ring-2 ring-primary/25"
                                  : "bg-secondary/80 dark:bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 hover:border-border hover:scale-[1.02] active:scale-[0.98]",
                              )}
                            >
                              {label}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 md:items-end">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                          Sort
                        </span>
                        <Select value={goalSortMode} onValueChange={(v) => setGoalSortMode(v as GoalSortMode)}>
                          <SelectTrigger className="max-md:min-h-11 min-h-10 h-auto w-full max-w-full md:max-w-[220px] text-xs rounded-lg transition-all duration-300 app-surface-input">
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
                          const completedIds = new Set(prev.filter((g) => isGoalComplete(g) && !celebratingGoals.has(g.id)).map((g) => g.id));
                          const completed = prev.filter((g) => completedIds.has(g.id));
                          next = [...reordered, ...completed];
                          localStorage.setItem('goal-order', JSON.stringify(next.map((g) => g.id)));
                          return next;
                        });
                        if (reorderTimer.current) clearTimeout(reorderTimer.current);
                        reorderTimer.current = setTimeout(() => reorderGoals(next), 600);
                      }}
                      as="div"
                      className="space-y-4 max-md:touch-pan-y overflow-visible"
                    >
                      <AnimatePresence initial={false}>
                        {activeGoals.map((goal, i) => (
                          <ActiveReorderGoalItem
                            key={goal.id}
                            goal={goal}
                            index={i}
                            celebratingGoals={celebratingGoals}
                            shared={sharedCardProps}
                            onArchive={() => archiveGoal(goal.id)}
                            dragFromHandleOnly={!ui.reorderDragWholeCard}
                            liteMotion={ui.liteMotion}
                          />
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                      {activeGoals.map((goal, i) => (
                        <motion.div
                          layout
                          key={goal.id}
                          initial={ui.liteMotion ? false : { opacity: 0, y: 16 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              transition: ui.liteMotion ? { duration: 0 } : { delay: i * 0.05, ...appleSpringGentle },
                            }}
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
                  <div className="space-y-3" id={filter === "showcase" ? "showcase-gallery" : undefined}>
                    {showActive && activeGoals.length > 0 && (
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                          {filter === "showcase" ? "Wins on display" : "Completed"}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent" />
                      </div>
                    )}
                    <AnimatePresence initial={false}>
                      {completedGoals.map((goal, i) => (
                        <motion.div
                          layout
                          key={goal.id}
                          initial={ui.liteMotion ? false : { opacity: 0, y: 16 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: ui.liteMotion
                              ? { duration: 0 }
                              : { delay: 0.28 + i * 0.05, ...appleSpringGentle },
                          }}
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
                    ) : (() => {
                      const archivedFiltered = archivedGoals.filter((g) => matchesSearch(g) && matchesCategory(g));
                      if (archivedFiltered.length === 0) {
                        return (
                          <EmptyState
                            compact
                            icon={SearchX}
                            title="No archived goals match"
                            description="Try clearing the search box or setting the category filter to “All categories”."
                          />
                        );
                      }
                      return archivedFiltered.map((goal) => {
                      const pct = calcProgress(goal);
                      const done = goal.subtasks.filter((s) => s.is_completed).length;
                      const subtaskSummary =
                        goal.subtasks.length > 0
                          ? `${done}/${goal.subtasks.length} subtasks`
                          : goal.is_completed
                            ? 'Standalone · complete'
                            : 'No subtasks';
                      return (
                        <div key={goal.id} className="group rounded-2xl border border-border/55 bg-card/60 backdrop-blur-sm px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-start opacity-90 hover:opacity-100 transition-all duration-300 hover:border-border/80 hover:shadow-xl hover:shadow-black/25 dark:bg-card/55 dark:hover:shadow-black/40">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <Archive className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm flex items-center gap-1.5 min-w-0">
                                {goal.emoji && <span className="shrink-0 text-base leading-none">{goal.emoji}</span>}
                                <span className="truncate min-w-0">{goal.title}</span>
                              </p>
                              {goal.description && (
                                <div className="text-xs text-muted-foreground truncate mt-0.5 min-w-0">
                                  <LinkifiedText text={goal.description} as="span" />
                                </div>
                              )}
                              {goal.due_date && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <CalendarDays className="h-3 w-3 shrink-0 opacity-80" />
                                  <span>Due {formatDueChip(goal.due_date)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <CheckSquare className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground tabular-nums">{subtaskSummary} · {pct}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-1 shrink-0 sm:pt-0.5 max-md:min-h-10">
                            <Button variant="ghost" size="icon" className="h-10 w-10 md:h-7 md:w-7 text-muted-foreground hover:text-mint hover:bg-mint/12 touch-manipulation" onClick={() => restoreGoal(goal.id)} title="Restore to active">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 md:h-7 md:w-7 text-muted-foreground hover:text-destructive touch-manipulation">
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
                                  <AlertDialogAction variant="destructive" onClick={() => deleteArchivedGoal(goal.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                      });
                    })()}
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
                    ) : categoryFilterId ? (
                      <EmptyState
                        compact
                        icon={FolderTree}
                        title="Nothing in this category"
                        description="Choose “All categories” in the filter, or pick a different category."
                      />
                    ) : dueFilter !== 'all' ? (
                      <EmptyState
                        compact
                        icon={CalendarDays}
                        title="Nothing matches this deadline"
                        description="Switch deadline filter to “Any” or choose another option."
                      />
                    ) : filter === 'showcase' ? (
                      <EmptyState
                        compact
                        icon={Sparkles}
                        title="Nothing on display yet"
                        description="Complete a goal, then tap Link your win on the card or add a link in Edit goal. YouTube, image URLs, and regular https links all work."
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
            className={`fixed z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-xs font-medium backdrop-blur-xl shadow-2xl border bottom-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] right-[max(1.5rem,calc(env(safe-area-inset-right,0px)+0.5rem))] ${
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
