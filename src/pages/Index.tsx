import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useDeferredValue, lazy, Suspense, type ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Reorder, useDragControls, useReducedMotion } from "framer-motion";
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
import { VirtualWindowGoalList } from "@/components/VirtualWindowGoalList";
import AddGoalDialog from "@/components/AddGoalDialog";
import { ManageCategoriesDialog } from "@/components/ManageCategoriesDialog";
const ExportDialogControlled = lazy(() => import("@/components/ExportDialog"));
import SkeletonGoalCard from "@/components/SkeletonGoalCard";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import StickyHeader from "@/components/StickyHeader";
import GoalSidebar from "@/components/GoalSidebar";
import { LinkifiedText } from "@/components/LinkifiedText";
import ThemeToggle from "@/components/ThemeToggle";
import { DueNotificationToggle } from "@/components/DueNotificationToggle";
import { showDueReminderInAppToast } from "@/lib/showDueReminderInAppToast";
import { UserHeroAvatar } from "@/components/UserHeroAvatar";
import { HeroShowcaseStrip } from "@/components/HeroShowcaseStrip";
import { PageSideAmbience } from "@/components/PageSideAmbience";
import { EmptyState, GoalTrackerIllustration } from "@/components/EmptyState";
import { CommandPalette } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Target, LogOut, Search, Volume2, VolumeX, Check, Loader2, AlertCircle, Archive, RotateCcw, CheckSquare, Trash2, CalendarDays, SearchX, Sparkles, Trophy, FolderTree, ListChecks, Copy, ChevronsDown, ChevronsUp, Tags, ChevronDown } from "lucide-react";
import { isSoundEnabled, toggleSound } from "@/lib/sounds";
import { getCategoryAccent } from "@/lib/categoryColor";
import { formatDueChip, getDueUrgency, isIncompleteForDueDate } from "@/lib/dueDateUtils";
import { appleEase, appleSpring, appleSpringGentle, smoothOut } from "@/lib/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { pickRandom, HERO_HEADER_QUOTES, GOAL_COMPLETE_TOASTS } from "@/lib/motivationalCopy";

/** Window virtualizer: rows self-measure; estimate only seeds layout. */
const VIRTUAL_GOALS_THRESHOLD = 10;
const VIRTUAL_ROW_GOAL_ESTIMATE_PX = 280;
const VIRTUAL_ROW_ARCHIVED_ESTIMATE_PX = 168;

/** Stable keyframes/refs for hero greeting pulses — avoids Framer replaying scale on unrelated re-renders. */
const HERO_GREET_HEY_SCALES = [1, 1.2, 1] as const;
const HERO_GREET_NAME_SCALES = [1, 1.34, 1] as const;
const HERO_GREET_QUOTE_SCALES = [1, 1.07, 1] as const;
const HERO_GREET_TIMES_HEY = [0, 0.48, 1] as const;
const HERO_GREET_TIMES_NAME = [0, 0.44, 1] as const;
const HERO_GREET_TIMES_QUOTE = [0, 0.46, 1] as const;

type Filter = 'all' | 'active' | 'done' | 'showcase' | 'archived';
type DueFilter = 'all' | 'has_due' | 'overdue' | 'due_soon';
type GoalSortMode = 'manual' | 'due_asc';
type CategoryFilterMode = 'all' | 'include' | 'exclude';

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
  | "onPatchGoalCategory"
  | "onDuplicate"
  | "onRenameSubtask"
  | "listFoldTick"
>;

function ArchivedGoalRow({
  goal,
  bulkMode,
  isBulkSelected,
  onBulkToggle,
  onDuplicate,
  onRestore,
  onDelete,
}: {
  goal: Goal;
  bulkMode: boolean;
  isBulkSelected: boolean;
  onBulkToggle: (goalId: string, selected: boolean) => void;
  onDuplicate: (goalId: string) => void | Promise<void>;
  onRestore: (goalId: string) => void;
  onDelete: (goalId: string) => void;
}) {
  const pct = calcProgress(goal);
  const done = goal.subtasks.filter((s) => s.is_completed).length;
  const subtaskSummary =
    goal.subtasks.length > 0
      ? `${done}/${goal.subtasks.length} subtasks`
      : goal.is_completed
        ? 'Standalone · complete'
        : 'No subtasks';
  return (
    <div className="group rounded-2xl border border-border/55 bg-card/60 backdrop-blur-sm px-4 py-4 flex gap-3 sm:gap-4 flex-col sm:flex-row sm:items-start opacity-90 hover:opacity-100 transition-all duration-300 hover:border-border/80 hover:shadow-xl hover:shadow-black/25 dark:bg-card/55 dark:hover:shadow-black/40">
      {bulkMode && (
        <div className="flex shrink-0 items-start pt-1">
          <Checkbox
            checked={isBulkSelected}
            onCheckedChange={(v) => onBulkToggle(goal.id, v === true)}
            aria-label={`Select archived goal ${goal.title}`}
            className="border-muted-foreground/50 data-[state=checked]:bg-primary"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start min-w-0">
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
              <span className="text-xs text-muted-foreground tabular-nums">{subtaskSummary} · {Math.round(pct)}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 shrink-0 sm:pt-0.5 max-md:min-h-10">
          <Button variant="ghost" size="icon" className="h-10 w-10 md:h-7 md:w-7 text-muted-foreground hover:text-primary touch-manipulation" onClick={() => void onDuplicate(goal.id)} title="Duplicate as new active goal">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 md:h-7 md:w-7 text-muted-foreground hover:text-mint hover:bg-mint/12 touch-manipulation" onClick={() => onRestore(goal.id)} title="Restore to active">
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
                <AlertDialogTitle>Delete &ldquo;{goal.title}&rdquo;?</AlertDialogTitle>
                <AlertDialogDescription>Permanently deletes from archive. Cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => onDelete(goal.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function ActiveReorderGoalItem({
  goal,
  index,
  celebratingGoals,
  shared,
  onArchive,
  dragFromHandleOnly,
  liteMotion,
  bulkMode,
  bulkSelected,
  onBulkToggle,
}: {
  goal: Goal;
  index: number;
  celebratingGoals: Set<string>;
  shared: SharedGoalCardProps;
  onArchive: (goalId: string) => void;
  dragFromHandleOnly: boolean;
  liteMotion: boolean;
  bulkMode: boolean;
  bulkSelected: Set<string>;
  onBulkToggle: (goalId: string, selected: boolean) => void;
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
        bulkSelectionMode={bulkMode}
        bulkSelected={bulkSelected.has(goal.id)}
        onBulkToggle={onBulkToggle}
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
  const reduceMotion = useReducedMotion();
  const heroMicroHover = ui.liteMotion || reduceMotion ? undefined : { y: -1, scale: 1.02 };
  /** Greeting name: vertical hover only — `scale` on hover fought the pulse and felt like random zooms. */
  const heroGreetingNameHover = ui.liteMotion || reduceMotion ? undefined : { y: -3 };
  /** One-shot pulses; memoized so parent re-renders don’t restart animations. */
  const heroGreetMotion = useMemo(() => {
    if (reduceMotion === true) {
      return {
        heyAnimate: { scale: 1 as const },
        heyTransition: { duration: 0 },
        nameAnimate: { scale: 1 as const },
        nameTransition: { duration: 0 },
        quoteAnimate: { scale: 1 as const },
        quoteTransition: { duration: 0 },
      };
    }
    return {
      heyAnimate: { scale: HERO_GREET_HEY_SCALES },
      heyTransition: {
        duration: 1.38,
        ease: appleEase,
        times: HERO_GREET_TIMES_HEY,
        delay: 0.08,
      },
      nameAnimate: { scale: HERO_GREET_NAME_SCALES },
      nameTransition: {
        duration: 1.58,
        ease: appleEase,
        times: HERO_GREET_TIMES_NAME,
        delay: 1.58,
      },
      quoteAnimate: { scale: HERO_GREET_QUOTE_SCALES },
      quoteTransition: {
        duration: 1.08,
        ease: appleEase,
        times: HERO_GREET_TIMES_QUOTE,
        delay: 3.28,
      },
    };
  }, [reduceMotion]);

  const {
    heyAnimate: heroHeyAnimate,
    heyTransition: heroHeyTransition,
    nameAnimate: heroNameAnimate,
    nameTransition: heroNameTransition,
    quoteAnimate: heroQuoteAnimate,
    quoteTransition: heroQuoteTransition,
  } = heroGreetMotion;

  const { goals, categories, loading, pendingSubtasks, pendingGoalComplete, saveStatus, archivedGoals, archivedLoading, createGoal, createCategory, patchGoalCategory, renameCategory, deleteCategory, editGoal, deleteGoal, duplicateGoal, archiveGoal, restoreGoal, deleteArchivedGoal, fetchArchivedGoals, addSubtask, toggleSubtask, toggleGoalStandaloneComplete, deleteSubtask, updateSubtaskEffort, updateSubtaskNotes, renameSubtask, reorderGoals, flushCelebrationIntentGoalIds, bulkDeleteGoals, bulkArchiveGoals, bulkDeleteArchivedGoals } = useGoals();
  const heroLine = useMemo(() => pickRandom(HERO_HEADER_QUOTES), []);
  const [orderedGoals, setOrderedGoals] = useState<Goal[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilterMode, setCategoryFilterMode] = useState<CategoryFilterMode>('all');
  const [categoryFilterIds, setCategoryFilterIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [goalSortMode, setGoalSortMode] = useState<GoalSortMode>('manual');
  const [celebratingGoals, setCelebratingGoals] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const mainGoalListRef = useRef<HTMLDivElement>(null);
  const activeVirtualAnchorRef = useRef<HTMLDivElement>(null);
  const completedVirtualAnchorRef = useRef<HTMLDivElement>(null);
  const archivedVirtualAnchorRef = useRef<HTMLDivElement>(null);
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(() => new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [goalListFoldTick, setGoalListFoldTick] = useState(() => ({ id: 0, collapsed: false }));
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

  /** Same ordering as `orderedGoals`, but each row re-bound to `goals` so cards never render stale PocketBase rows while `goals` has already updated. */
  const displayGoals = useMemo(() => {
    if (goals.length === 0) return [];
    const m = new Map(goals.map((g) => [g.id, g]));
    if (orderedGoals.length === 0) return goals;
    return orderedGoals.map((g) => m.get(g.id) ?? g);
  }, [goals, orderedGoals]);

  /** Layout sync so the first painted frame never shows `orderedGoals` rows that disagree with `goals` (was useEffect + one stale paint). */
  useLayoutEffect(() => {
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
      const merged = [...newGoals, ...filtered];
      const seen = new Set<string>();
      return merged.filter((g) => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      });
    });
  }, [goals]);

  /** Overlay + 🏆 toast only when the user finishes a goal (toggle paths enqueue ids). Inferring from `goals` diffs caused mass false positives after refetches. */
  useLayoutEffect(() => {
    const ids = flushCelebrationIntentGoalIds();
    if (ids.length === 0) return;
    const heavy = ui.celebrationQuality === "full";
    for (const id of ids) {
      const g = goals.find((x) => x.id === id);
      if (!g || !isGoalComplete(g)) continue;
      setCelebratingGoals((s) => new Set([...s, id]));
      if (heavy) setShowCelebration(true);
      toast.success(pickRandom(GOAL_COMPLETE_TOASTS), {
        id: `goal-complete-${id}`,
        icon: "🏆",
        duration: heavy ? 5000 : 3200,
      });
      setTimeout(() => {
        setCelebratingGoals((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, ui.celebrationGoalMs);
    }
  }, [goals, flushCelebrationIntentGoalIds, ui.celebrationGoalMs, ui.celebrationQuality]);

  // Fetch archived goals lazily when tab first opened
  const archivedFetched = useRef(false);
  useEffect(() => {
    if (filter === 'archived' && !archivedFetched.current) {
      archivedFetched.current = true;
      fetchArchivedGoals();
    }
  }, [filter, fetchArchivedGoals]);

  // Cmd/Ctrl+N opens new goal dialog; Cmd/Ctrl+K opens command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setAddGoalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleToggleSound = () => setSoundOn(toggleSound());

  const handleBulkToggle = useCallback((goalId: string, selected: boolean) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (selected) next.add(goalId);
      else next.delete(goalId);
      return next;
    });
  }, []);

  const bumpGoalListFold = useCallback((collapsed: boolean) => {
    setGoalListFoldTick((p) => ({ id: p.id + 1, collapsed }));
  }, []);

  const deferredSearch = useDeferredValue(search);
  const searchLower = deferredSearch.toLowerCase().trim();

  const categoryFilterIdSet = useMemo(() => new Set(categoryFilterIds), [categoryFilterIds]);

  const matchesCategory = useCallback(
    (g: Goal) => {
      if (categoryFilterMode === 'all') return true;
      const cid = g.category?.id ?? null;
      if (categoryFilterMode === 'include') {
        if (categoryFilterIds.length === 0) return true;
        if (!cid) return false;
        return categoryFilterIdSet.has(cid);
      }
      if (categoryFilterIds.length === 0) return true;
      if (!cid) return true;
      return !categoryFilterIdSet.has(cid);
    },
    [categoryFilterMode, categoryFilterIds, categoryFilterIdSet],
  );

  const categoryFilterKey = useMemo(
    () => `${categoryFilterMode}:${[...categoryFilterIds].sort().join(',')}`,
    [categoryFilterMode, categoryFilterIds],
  );

  const initialCategoryIdForNewGoal = useMemo((): string | null => {
    if (categoryFilterMode === 'include' && categoryFilterIds.length === 1) return categoryFilterIds[0];
    return null;
  }, [categoryFilterMode, categoryFilterIds]);

  const categoryFilterRestrictsView = useMemo(() => {
    if (categoryFilterMode === 'all') return false;
    return categoryFilterIds.length > 0;
  }, [categoryFilterMode, categoryFilterIds]);

  useEffect(() => {
    setBulkSelected(new Set());
  }, [filter, categoryFilterKey, dueFilter, search]);

  const matchesSearch = useCallback(
    (g: Goal) => {
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
            (s.notes && s.notes.toLowerCase().includes(searchLower)),
        )
      );
    },
    [searchLower],
  );

  const activeGoalsBase = displayGoals.filter((g) => (!isGoalComplete(g) || celebratingGoals.has(g.id)) && matchesSearch(g) && matchesCategory(g));
  const completedGoalsBase = displayGoals.filter((g) => isGoalComplete(g) && !celebratingGoals.has(g.id) && matchesSearch(g) && matchesCategory(g));

  const showcaseCount = useMemo(
    () => displayGoals.filter((g) => isGoalComplete(g) && goalHasShowcaseMedia(g)).length,
    [displayGoals]
  );
  const showcaseSpotlightGoals = useMemo(
    () => displayGoals.filter((g) => isGoalComplete(g) && goalHasShowcaseMedia(g)).slice(0, 8),
    [displayGoals]
  );
  const showShowcaseHeroNudge = useMemo(
    () =>
      displayGoals.length > 0 &&
      showcaseCount === 0 &&
      displayGoals.some((g) => isGoalComplete(g)),
    [displayGoals, showcaseCount]
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

  const showActive = filter !== 'done' && filter !== 'archived' && filter !== 'showcase';
  const showCompleted = filter !== 'active' && filter !== 'archived';

  const showGoalCardFoldControls =
    filter !== 'archived' &&
    ((showActive && activeGoals.length > 0) || (showCompleted && completedGoals.length > 0));

  const selectableGoalsFlat = useMemo(() => {
    if (filter === 'archived') {
      return archivedGoals.filter((g) => matchesCategory(g) && matchesSearch(g));
    }
    const parts: Goal[] = [];
    if (showActive && activeGoals.length > 0) parts.push(...activeGoals);
    if (showCompleted && completedGoals.length > 0) parts.push(...completedGoals);
    const seen = new Set<string>();
    return parts.filter((g) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
  }, [filter, archivedGoals, activeGoals, completedGoals, showActive, showCompleted, matchesCategory, matchesSearch]);

  const bulkSelectedIds = useMemo(() => [...bulkSelected], [bulkSelected]);

  const archiveEligibleIds = useMemo(
    () =>
      bulkSelectedIds.filter((id) => {
        const g = goals.find((x) => x.id === id);
        return g != null && isGoalComplete(g);
      }),
    [bulkSelectedIds, goals],
  );

  const runBulkDelete = useCallback(async () => {
    if (bulkSelectedIds.length === 0) return;
    setBulkWorking(true);
    try {
      if (filter === 'archived') await bulkDeleteArchivedGoals(bulkSelectedIds);
      else await bulkDeleteGoals(bulkSelectedIds);
      setBulkSelected(new Set());
      setBulkMode(false);
    } finally {
      setBulkWorking(false);
    }
  }, [bulkSelectedIds, filter, bulkDeleteArchivedGoals, bulkDeleteGoals]);

  const runBulkArchive = useCallback(async () => {
    if (archiveEligibleIds.length === 0) return;
    setBulkWorking(true);
    try {
      await bulkArchiveGoals(archiveEligibleIds);
      setBulkSelected(new Set());
      setBulkMode(false);
    } finally {
      setBulkWorking(false);
    }
  }, [archiveEligibleIds, bulkArchiveGoals]);

  const canDragReorder = dueFilter === 'all' && goalSortMode === 'manual' && !bulkMode;

  const suppressCardLayout =
    ui.liteMotion || activeGoals.length + completedGoals.length > 24;

  const virtualizeActiveStatic =
    !canDragReorder && activeGoals.length >= VIRTUAL_GOALS_THRESHOLD;
  const virtualizeCompleted = completedGoals.length >= VIRTUAL_GOALS_THRESHOLD;
  const virtualizeArchived =
    filter === "archived" && selectableGoalsFlat.length >= VIRTUAL_GOALS_THRESHOLD;

  const listAnimDelay = (i: number) => Math.min(i * 0.05, 0.35);

  const overdueCount = displayGoals.filter(
    (g) => getDueUrgency(g.due_date, isIncompleteForDueDate(g)) === 'overdue'
  ).length;
  const dueSoonCount = displayGoals.filter(
    (g) => getDueUrgency(g.due_date, isIncompleteForDueDate(g)) === 'soon'
  ).length;

  const totalSubtasksDone = displayGoals.reduce((sum, g) => sum + g.subtasks.filter((s) => s.is_completed).length, 0);
  const totalSubtasks = displayGoals.reduce((sum, g) => sum + g.subtasks.length, 0);
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

  const goalCountForCategory = useCallback(
    (categoryId: string) =>
      goals.filter((g) => g.category?.id === categoryId).length +
      archivedGoals.filter((g) => g.category?.id === categoryId).length,
    [goals, archivedGoals],
  );

  const sharedCardProps = useMemo(
    () => ({
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
      onPatchGoalCategory: patchGoalCategory,
      onDuplicate: duplicateGoal,
      onRenameSubtask: renameSubtask,
      listFoldTick: goalListFoldTick,
    }),
    [
      pendingSubtasks,
      pendingGoalComplete,
      ui.celebrationQuality,
      toggleSubtask,
      addSubtask,
      deleteGoal,
      deleteSubtask,
      editGoal,
      updateSubtaskEffort,
      updateSubtaskNotes,
      toggleGoalStandaloneComplete,
      categories,
      createCategory,
      patchGoalCategory,
      duplicateGoal,
      renameSubtask,
      goalListFoldTick,
    ],
  );

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
    <div className="min-h-[100dvh] min-h-screen overflow-x-visible bg-background relative z-10 app-page-layer">
      <PageSideAmbience />
      <CommandPalette
        open={cmdPaletteOpen}
        onOpenChange={setCmdPaletteOpen}
        goals={displayGoals}
        setFilter={setFilter}
        setAddGoalOpen={setAddGoalOpen}
        setExportOpen={setExportOpen}
      />
      {/* Palette-triggered export — controlled dialog, shares the same lazy chunk as GoalSidebar's ExportDialog */}
      {exportOpen && (
        <Suspense fallback={null}>
          <ExportDialogControlled goals={displayGoals} open={exportOpen} onOpenChange={setExportOpen} />
        </Suspense>
      )}
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
            initialCategoryId={initialCategoryIdForNewGoal}
            dueNotificationsSlot={dueReminderToggle}
          />
        )}
      </AnimatePresence>

      {/* Goals hero: gradient — side LEDs removed (calmer, goal-focused) */}
      <div ref={headerRef} className="index-hero relative z-10 overflow-visible px-4 sm:px-6 pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))] md:pt-8 pb-7 md:pb-9">
        <div
          className="absolute inset-0 -z-10 overflow-hidden rounded-b-[1.75rem] md:rounded-b-[2rem] pointer-events-none shadow-[0_28px_64px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]"
          aria-hidden
        >
          <div className="absolute inset-0 gradient-header-bg" />
        </div>
        <div className="relative z-10 max-w-[min(100%,88rem)] mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-4 min-w-0">
            <div className="min-w-0 w-full md:flex-1">
              {userAvatarUrl ? (
                <div className="flex items-start gap-4 sm:gap-5">
                  <UserHeroAvatar src={userAvatarUrl} displayName={username} />
                  <div className="space-y-2 min-w-0 flex-1 relative">
                    <div className="header-hero-aura -translate-x-1 sm:translate-x-0" aria-hidden />
                    <div className="flex items-center gap-2 relative z-[1]">
                      <Target className="h-4 w-4 text-white/55" />
                      <span className="text-white/45 text-[11px] font-semibold font-te tracking-[0.2em] uppercase">
                        Goal Tracker
                      </span>
                    </div>
                    <h1 className="relative z-[1] text-2xl sm:text-3xl md:text-[2rem] font-semibold font-heading text-white tracking-tight text-balance break-words [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
                      <motion.span
                        className="inline-block origin-bottom-left will-change-transform"
                        initial={{ opacity: 1, scale: 1 }}
                        animate={heroHeyAnimate}
                        transition={heroHeyTransition}
                      >
                        Hey
                      </motion.span>
                      <span className="inline">,</span>
                      {' '}
                      <motion.span
                        className="inline-block origin-bottom-left cursor-default rounded-lg px-0.5 -mx-0.5 will-change-transform"
                        initial={{ opacity: 1, scale: 1 }}
                        animate={heroNameAnimate}
                        transition={heroNameTransition}
                        whileHover={heroGreetingNameHover}
                      >
                        {username}
                      </motion.span>
                    </h1>
                    <motion.p
                      initial={{ opacity: 1, scale: 1 }}
                      animate={heroQuoteAnimate}
                      transition={heroQuoteTransition}
                      className="block origin-left max-w-xl will-change-transform text-white/45 text-xs sm:text-sm italic leading-relaxed"
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
                    <span className="text-white/45 text-[11px] font-semibold font-te tracking-[0.2em] uppercase">
                      Goal Tracker
                    </span>
                  </div>
                  <h1 className="relative z-[1] text-2xl sm:text-3xl md:text-[2rem] font-semibold font-heading text-white tracking-tight text-balance break-words [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
                    <motion.span
                      className="inline-block origin-bottom-left will-change-transform"
                      initial={{ opacity: 1, scale: 1 }}
                      animate={heroHeyAnimate}
                      transition={heroHeyTransition}
                    >
                      Hey
                    </motion.span>
                    <span className="inline">,</span>
                    {' '}
                    <motion.span
                      className="inline-block origin-bottom-left cursor-default rounded-lg px-0.5 -mx-0.5 will-change-transform"
                      initial={{ opacity: 1, scale: 1 }}
                      animate={heroNameAnimate}
                      transition={heroNameTransition}
                      whileHover={heroGreetingNameHover}
                    >
                      {username}
                    </motion.span>
                  </h1>
                  <motion.p
                    initial={{ opacity: 1, scale: 1 }}
                    animate={heroQuoteAnimate}
                    transition={heroQuoteTransition}
                    className="block origin-left max-w-xl will-change-transform text-white/45 text-xs sm:text-sm italic leading-relaxed"
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
                initialCategoryId={initialCategoryIdForNewGoal}
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

          {!loading && displayGoals.length > 0 && (showcaseSpotlightGoals.length > 0 || showShowcaseHeroNudge) && (
            <HeroShowcaseStrip
              spotlightGoals={showcaseSpotlightGoals}
              showcaseCount={showcaseCount}
              onJumpToGoal={jumpToShowcaseGoal}
              onSeeAll={seeAllShowcases}
              showGentleNudge={showShowcaseHeroNudge}
              onViewDone={() => setFilter("done")}
            />
          )}

          {!loading && displayGoals.length > 0 && (
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
              className="flex flex-wrap items-end gap-x-8 gap-y-3 mt-4 pt-4 border-t border-white/[0.12]"
            >
              {[
                { label: 'Goals', value: displayGoals.length },
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
                  className="cursor-default rounded-xl px-2 py-1 -mx-2 -my-1"
                  whileHover={heroMicroHover}
                  transition={appleSpringGentle}
                >
                  <div className="text-xl sm:text-2xl font-semibold text-white tabular-nums tracking-tight [text-shadow:0_1px_16px_rgba(0,0,0,0.25)]">
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
      <div className="max-w-[min(100%,88rem)] mx-auto px-3 sm:px-5 lg:px-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] pt-6 sm:pt-8 relative z-10 -mt-3 sm:-mt-4">
        <div
          className="pointer-events-none absolute left-4 right-4 sm:left-6 sm:right-6 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent"
          aria-hidden
        />
        <div className="lg:flex gap-3 lg:gap-4 xl:gap-5 items-start pt-1">
          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:max-w-none lg:mx-0">
            {loading ? (
              <div className="space-y-3">
                <SkeletonGoalCard />
                <SkeletonGoalCard />
              </div>
            ) : displayGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                illustrationSlot={<GoalTrackerIllustration />}
                title="Set your first goal"
                description="Break it into steps. Track your progress. Celebrate every win."
              >
                <AddGoalDialog onAdd={createGoal} categories={categories} onCreateCategory={createCategory} triggerClassName="cta-glow" initialCategoryId={initialCategoryIdForNewGoal} />
              </EmptyState>
            ) : (
              <motion.div
                initial={ui.liteMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={ui.liteMotion ? { duration: 0 } : { duration: 0.5, ease: appleEase }}
                className="space-y-4"
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
                    <div className="flex flex-row items-center gap-2 w-full sm:w-auto shrink-0">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-11 md:h-10 w-full sm:w-44 shrink-0 justify-between gap-2 px-3 rounded-lg touch-manipulation font-medium text-sm",
                              "border-border/60 bg-background/80 backdrop-blur-sm shadow-sm",
                              "hover:bg-secondary/40 hover:border-border",
                              "focus-visible:ring-2 focus-visible:ring-sky-400/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            )}
                            aria-label="Category filter"
                            aria-haspopup="dialog"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <Tags className="h-4 w-4 shrink-0 text-sky-400/90" aria-hidden />
                              <span className="truncate">Categories</span>
                            </span>
                            <span className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-background transition-colors",
                                  categoryFilterRestrictsView
                                    ? "bg-sky-400 ring-sky-400/35"
                                    : "bg-muted-foreground/25 ring-transparent",
                                )}
                                title={
                                  categoryFilterRestrictsView ? "Category filter active" : "Showing all categories"
                                }
                                aria-hidden
                              />
                              <ChevronDown className="h-4 w-4 text-muted-foreground opacity-80" aria-hidden />
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[min(calc(100vw-1.5rem),20rem)] p-0 rounded-xl border-border/60 shadow-xl"
                          align="end"
                          sideOffset={6}
                        >
                          <div className="border-b border-border/50 px-3 py-2.5 bg-muted/30">
                            <p className="text-xs font-semibold text-foreground">Category filter</p>
                            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                              Include several categories, or hide ones you don&apos;t want in this view.
                            </p>
                          </div>
                          <div className="p-3 space-y-3">
                            <RadioGroup
                              value={categoryFilterMode}
                              onValueChange={(v) => {
                                const m = v as CategoryFilterMode;
                                setCategoryFilterMode(m);
                                if (m === "all") setCategoryFilterIds([]);
                              }}
                              className="gap-2"
                            >
                              <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-secondary/50">
                                <RadioGroupItem value="all" id="cf-all" />
                                <Label htmlFor="cf-all" className="cursor-pointer text-sm font-normal leading-snug flex-1">
                                  All categories
                                </Label>
                              </div>
                              <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-secondary/50">
                                <RadioGroupItem value="include" id="cf-include" disabled={categories.length === 0} />
                                <Label
                                  htmlFor="cf-include"
                                  className={cn(
                                    "cursor-pointer text-sm font-normal leading-snug flex-1",
                                    categories.length === 0 && "opacity-50 cursor-not-allowed",
                                  )}
                                >
                                  Only selected categories
                                </Label>
                              </div>
                              <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-secondary/50">
                                <RadioGroupItem value="exclude" id="cf-exclude" disabled={categories.length === 0} />
                                <Label
                                  htmlFor="cf-exclude"
                                  className={cn(
                                    "cursor-pointer text-sm font-normal leading-snug flex-1",
                                    categories.length === 0 && "opacity-50 cursor-not-allowed",
                                  )}
                                >
                                  Hide selected categories
                                </Label>
                              </div>
                            </RadioGroup>

                            {categories.length === 0 ? (
                              <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 px-2.5 py-2">
                                You don&apos;t have categories yet. Use{" "}
                                <span className="font-medium text-foreground">Manage</span> to add some, or assign them
                                when editing a goal.
                              </p>
                            ) : categoryFilterMode !== "all" ? (
                              <>
                                <div className="rounded-lg border border-border/50 bg-card/40 px-2 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    {categoryFilterMode === "include"
                                      ? "Show goals in these categories only"
                                      : "Hide goals in these categories"}
                                  </p>
                                  <div className="max-h-52 overflow-y-auto space-y-0.5 -mx-0.5 px-0.5">
                                    {categories.map((c) => {
                                      const checked = categoryFilterIds.includes(c.id);
                                      const n = displayGoals.filter((g) => g.category?.id === c.id).length;
                                      const ca = getCategoryAccent(c.id);
                                      return (
                                        <label
                                          key={c.id}
                                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/60 cursor-pointer touch-manipulation min-h-9"
                                        >
                                          <Checkbox
                                            checked={checked}
                                            onCheckedChange={(v) => {
                                              const on = v === true;
                                              setCategoryFilterIds((prev) => {
                                                if (on) return prev.includes(c.id) ? prev : [...prev, c.id];
                                                return prev.filter((id) => id !== c.id);
                                              });
                                            }}
                                            className="border-muted-foreground/50"
                                          />
                                          <span className={cn("h-2 w-2 shrink-0 rounded-full", ca.dot)} aria-hidden />
                                          <span className="flex-1 min-w-0 truncate text-sm">{c.name}</span>
                                          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{n}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 flex-1 text-xs font-semibold rounded-lg"
                                    onClick={() => setCategoryFilterIds(categories.map((c) => c.id))}
                                  >
                                    Select all
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 flex-1 text-xs font-semibold rounded-lg"
                                    onClick={() => setCategoryFilterIds([])}
                                  >
                                    Clear
                                  </Button>
                                </div>
                              </>
                            ) : null}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {categories.length > 0 ? (
                        <ManageCategoriesDialog
                          categories={categories}
                          goalCountForCategory={goalCountForCategory}
                          onRename={renameCategory}
                          onDelete={deleteCategory}
                        />
                      ) : null}
                    </div>
                  </div>
                  {/* Segmented filter control */}
                  <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/50 bg-secondary/30 p-1 dark:bg-secondary/20 dark:border-border/35 backdrop-blur-sm">
                    {([
                      { f: 'all', label: 'All', count: displayGoals.length },
                      { f: 'active', label: 'Active', count: activeGoalsBase.length },
                      { f: 'done', label: 'Done', count: completedGoalsBase.length },
                      { f: 'showcase', label: 'Display', count: showcaseCount },
                      { f: 'archived', label: 'Archived', count: archivedGoals.length > 0 ? archivedGoals.length : null },
                    ] as { f: Filter; label: string; count: number | null }[]).map(({ f, label, count }) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={cn(
                          "relative max-md:min-h-10 min-h-9 touch-manipulation px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 inline-flex items-center justify-center gap-1.5 flex-1 min-w-0",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                          filter === f
                            ? "bg-background text-foreground shadow-md shadow-black/12 dark:shadow-black/35 dark:bg-card/90"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                        )}
                      >
                        {filter === f && !ui.liteMotion && (
                          <motion.span
                            layoutId="filter-active-indicator"
                            className="absolute inset-0 rounded-lg bg-background shadow-md shadow-black/12 dark:shadow-black/35 dark:bg-card/90 -z-[1]"
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          />
                        )}
                        <span className="relative z-[1] truncate">{label}</span>
                        {count !== null && count > 0 && (
                          <span className={cn(
                            "relative z-[1] shrink-0 tabular-nums rounded-md px-1 text-[10px] font-bold",
                            filter === f ? "text-primary" : "text-muted-foreground/70"
                          )}>
                            {count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {!loading && (displayGoals.length > 0 || (filter === "archived" && archivedGoals.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-2 pt-3 mt-1 border-t border-border/50">
                      <Button
                        type="button"
                        variant={bulkMode ? "secondary" : "outline"}
                        size="sm"
                        className="h-9 rounded-lg touch-manipulation text-xs font-semibold shrink-0"
                        onClick={() => setBulkMode((m) => !m)}
                      >
                        {bulkMode ? (
                          "Done selecting"
                        ) : (
                          <>
                            <ListChecks className="h-3.5 w-3.5 mr-1.5 shrink-0 opacity-90" aria-hidden />
                            Select goals
                          </>
                        )}
                      </Button>
                      {showGoalCardFoldControls && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-lg touch-manipulation text-xs font-semibold shrink-0 gap-1.5"
                            onClick={() => bumpGoalListFold(false)}
                          >
                            <ChevronsDown className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                            Expand all
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-lg touch-manipulation text-xs font-semibold shrink-0 gap-1.5"
                            onClick={() => bumpGoalListFold(true)}
                          >
                            <ChevronsUp className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                            Collapse all
                          </Button>
                        </>
                      )}
                      {bulkMode && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-lg touch-manipulation text-xs font-semibold"
                            disabled={selectableGoalsFlat.length === 0 || bulkWorking}
                            onClick={() => setBulkSelected(new Set(selectableGoalsFlat.map((g) => g.id)))}
                          >
                            Select all in view
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-lg touch-manipulation text-xs font-semibold"
                            disabled={bulkWorking}
                            onClick={() => setBulkSelected(new Set())}
                          >
                            Clear
                          </Button>
                          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                            {bulkSelectedIds.length} selected
                          </span>
                          {filter !== "archived" && archiveEligibleIds.length > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-9 rounded-lg touch-manipulation text-xs font-semibold shrink-0"
                                  disabled={bulkWorking}
                                >
                                  Archive ({archiveEligibleIds.length})
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Archive {archiveEligibleIds.length} completed goal
                                    {archiveEligibleIds.length === 1 ? "" : "s"}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {archiveEligibleIds.length === bulkSelectedIds.length
                                      ? "Selected goals will move to your archive. You can restore them anytime."
                                      : `${archiveEligibleIds.length} of ${bulkSelectedIds.length} selected goals are complete and will be archived. Incomplete selections are skipped.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={bulkWorking}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => void runBulkArchive()} disabled={bulkWorking}>
                                    Archive
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-9 rounded-lg touch-manipulation text-xs font-semibold shrink-0"
                                disabled={bulkSelectedIds.length === 0 || bulkWorking}
                              >
                                Delete ({bulkSelectedIds.length})
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete {bulkSelectedIds.length} goal{bulkSelectedIds.length === 1 ? "" : "s"} permanently?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {filter === "archived"
                                    ? "This removes archived goals and their subtasks from the database. This cannot be undone."
                                    : "This removes the selected goals and all of their subtasks. This cannot be undone."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={bulkWorking}>Cancel</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={() => void runBulkDelete()} disabled={bulkWorking}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  )}
                  {filter !== 'archived' && filter !== 'showcase' && (
                    <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-end md:justify-between pt-3 mt-1 border-t border-border/50">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                          Deadline
                        </span>
                        <div className="flex gap-1 rounded-xl border border-border/50 bg-secondary/30 p-1 dark:bg-secondary/20 dark:border-border/35 backdrop-blur-sm">
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
                                "relative max-md:min-h-10 min-h-8 touch-manipulation px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 flex-1",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                                dueFilter === df
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                              )}
                            >
                              {dueFilter === df && !ui.liteMotion && (
                                <motion.span
                                  layoutId="due-filter-indicator"
                                  className="absolute inset-0 rounded-lg bg-background shadow-md shadow-black/12 dark:shadow-black/35 dark:bg-card/90 -z-[1]"
                                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                />
                              )}
                              {label}
                            </button>
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
                            onArchive={archiveGoal}
                            dragFromHandleOnly={!ui.reorderDragWholeCard}
                            liteMotion={ui.liteMotion}
                            bulkMode={bulkMode}
                            bulkSelected={bulkSelected}
                            onBulkToggle={handleBulkToggle}
                          />
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  ) : (
                    <div ref={activeVirtualAnchorRef}>
                      {virtualizeActiveStatic ? (
                        <VirtualWindowGoalList
                          items={activeGoals}
                          scrollAnchorRef={activeVirtualAnchorRef}
                          rowEstimatePx={VIRTUAL_ROW_GOAL_ESTIMATE_PX}
                          gap={16}
                          renderItem={(goal, i) => (
                            <motion.div
                              layout={!suppressCardLayout}
                              initial={ui.liteMotion ? false : { opacity: 0, y: 16 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: ui.liteMotion ? { duration: 0 } : { delay: listAnimDelay(i), ...appleSpringGentle },
                              }}
                              exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.28, ease: smoothOut } }}
                            >
                              <GoalCard
                                goal={goal}
                                showDragHandle={false}
                                bulkSelectionMode={bulkMode}
                                bulkSelected={bulkSelected.has(goal.id)}
                                onBulkToggle={handleBulkToggle}
                                isCelebrating={celebratingGoals.has(goal.id)}
                                onArchive={archiveGoal}
                                {...sharedCardProps}
                              />
                            </motion.div>
                          )}
                        />
                      ) : (
                        <div className="space-y-4">
                          <AnimatePresence initial={false}>
                            {activeGoals.map((goal, i) => (
                              <motion.div
                                layout={!suppressCardLayout}
                                key={goal.id}
                                initial={ui.liteMotion ? false : { opacity: 0, y: 16 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  transition: ui.liteMotion ? { duration: 0 } : { delay: listAnimDelay(i), ...appleSpringGentle },
                                }}
                                exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.28, ease: smoothOut } }}
                              >
                                <GoalCard
                                  goal={goal}
                                  showDragHandle={false}
                                  bulkSelectionMode={bulkMode}
                                  bulkSelected={bulkSelected.has(goal.id)}
                                  onBulkToggle={handleBulkToggle}
                                  isCelebrating={celebratingGoals.has(goal.id)}
                                  onArchive={archiveGoal}
                                  {...sharedCardProps}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* Completed goals section */}
                {showCompleted && completedGoals.length > 0 && (
                  <div className="space-y-3" id={filter === "showcase" ? "showcase-gallery" : undefined}>
                    {showActive && activeGoals.length > 0 && (
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                        <div className="flex items-center gap-2 shrink-0">
                          <Trophy className="h-3.5 w-3.5 text-mint/80" aria-hidden />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                            {filter === "showcase" ? "Wins on display" : "Completed"}
                          </span>
                          <span className="text-[10px] tabular-nums font-bold text-mint/70">
                            {filter === "showcase" ? showcaseCount : completedGoals.length}
                          </span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/80 to-transparent" />
                      </div>
                    )}
                    <div ref={completedVirtualAnchorRef}>
                      {virtualizeCompleted ? (
                        <VirtualWindowGoalList
                          items={completedGoals}
                          scrollAnchorRef={completedVirtualAnchorRef}
                          rowEstimatePx={VIRTUAL_ROW_GOAL_ESTIMATE_PX}
                          gap={16}
                          renderItem={(goal, i) => (
                            <motion.div
                              layout={!suppressCardLayout}
                              initial={ui.liteMotion ? false : { opacity: 0, y: 16 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: ui.liteMotion
                                  ? { duration: 0 }
                                  : { delay: 0.28 + listAnimDelay(i), ...appleSpringGentle },
                              }}
                              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25, ease: smoothOut } }}
                            >
                              <GoalCard
                                goal={goal}
                                showDragHandle={false}
                                bulkSelectionMode={bulkMode}
                                bulkSelected={bulkSelected.has(goal.id)}
                                onBulkToggle={handleBulkToggle}
                                isCelebrating={celebratingGoals.has(goal.id)}
                                onArchive={archiveGoal}
                                {...sharedCardProps}
                              />
                            </motion.div>
                          )}
                        />
                      ) : (
                        <div className="space-y-4">
                          <AnimatePresence initial={false}>
                            {completedGoals.map((goal, i) => (
                              <motion.div
                                layout={!suppressCardLayout}
                                key={goal.id}
                                initial={ui.liteMotion ? false : { opacity: 0, y: 16 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  transition: ui.liteMotion
                                    ? { duration: 0 }
                                    : { delay: 0.28 + listAnimDelay(i), ...appleSpringGentle },
                                }}
                                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25, ease: smoothOut } }}
                              >
                                <GoalCard
                                  goal={goal}
                                  showDragHandle={false}
                                  bulkSelectionMode={bulkMode}
                                  bulkSelected={bulkSelected.has(goal.id)}
                                  onBulkToggle={handleBulkToggle}
                                  isCelebrating={celebratingGoals.has(goal.id)}
                                  onArchive={archiveGoal}
                                  {...sharedCardProps}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
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
                    ) : selectableGoalsFlat.length === 0 ? (
                      <EmptyState
                        compact
                        icon={SearchX}
                        title="No archived goals match"
                        description="Try clearing the search box or setting the category filter to “All categories”."
                      />
                    ) : (
                      <div ref={archivedVirtualAnchorRef}>
                        {virtualizeArchived ? (
                          <VirtualWindowGoalList
                            items={selectableGoalsFlat}
                            scrollAnchorRef={archivedVirtualAnchorRef}
                            rowEstimatePx={VIRTUAL_ROW_ARCHIVED_ESTIMATE_PX}
                            gap={12}
                            renderItem={(goal) => (
                              <ArchivedGoalRow
                                key={goal.id}
                                goal={goal}
                                bulkMode={bulkMode}
                                isBulkSelected={bulkSelected.has(goal.id)}
                                onBulkToggle={handleBulkToggle}
                                onDuplicate={duplicateGoal}
                                onRestore={restoreGoal}
                                onDelete={deleteArchivedGoal}
                              />
                            )}
                          />
                        ) : (
                          selectableGoalsFlat.map((goal) => (
                            <ArchivedGoalRow
                              key={goal.id}
                              goal={goal}
                              bulkMode={bulkMode}
                              isBulkSelected={bulkSelected.has(goal.id)}
                              onBulkToggle={handleBulkToggle}
                              onDuplicate={duplicateGoal}
                              onRestore={restoreGoal}
                              onDelete={deleteArchivedGoal}
                            />
                          ))
                        )}
                      </div>
                    )}
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
                    ) : categoryFilterRestrictsView ? (
                      <EmptyState
                        compact
                        icon={FolderTree}
                        title="Nothing matches category filter"
                        description="Switch the category filter to “All categories”, or open Categories and adjust which categories are included or hidden."
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
              goals={displayGoals}
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
