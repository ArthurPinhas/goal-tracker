import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";
import { Goal } from "@/types/goal";
import { calcProgress } from "@/lib/goalUtils";
import GoalCard from "@/components/GoalCard";
import AddGoalDialog from "@/components/AddGoalDialog";
import SkeletonGoalCard from "@/components/SkeletonGoalCard";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import StickyHeader from "@/components/StickyHeader";
import GoalSidebar from "@/components/GoalSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Target, LogOut, Search, Volume2, VolumeX, Check, Loader2, AlertCircle, Archive, RotateCcw, CheckSquare, Trash2 } from "lucide-react";
import { isSoundEnabled, toggleSound } from "@/lib/sounds";

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
  { w: 160, h: 110, left: '6%',  top: '-30%', color: '#34d399', opacity: 0.13, duration: 9,  delay: 0 },
  { w: 200, h: 150, left: '42%', top: '-40%', color: '#a78bfa', opacity: 0.10, duration: 13, delay: 2 },
  { w: 110, h: 90,  left: '74%', top: '0%',   color: '#60a5fa', opacity: 0.12, duration: 10, delay: 1 },
  { w: 240, h: 130, left: '-6%', top: '20%',  color: '#8b5cf6', opacity: 0.07, duration: 12, delay: 3 },
  { w: 90,  h: 90,  left: '90%', top: '-20%', color: '#34d399', opacity: 0.09, duration: 11, delay: 1.5 },
];

// Subtle ambient orbs for the full page — low opacity, large blur, edge-positioned
const PAGE_ORBS = [
  { w: 420, h: 360, left: '-90px', top: '20%',   color: '#34d399', opacity: 0.04, duration: 20, delay: 0 },
  { w: 380, h: 320, left: 'auto',  top: '32%',   right: '-70px', color: '#a78bfa', opacity: 0.04, duration: 25, delay: 3 },
  { w: 340, h: 290, left: '2%',    top: 'auto',  bottom: '18%',  color: '#60a5fa', opacity: 0.03, duration: 22, delay: 6 },
  { w: 360, h: 300, left: 'auto',  top: 'auto',  right: '1%', bottom: '12%', color: '#8b5cf6', opacity: 0.035, duration: 18, delay: 9 },
];

type Filter = 'all' | 'active' | 'done' | 'archived';

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { goals, loading, pendingSubtasks, saveStatus, archivedGoals, archivedLoading, createGoal, editGoal, deleteGoal, archiveGoal, restoreGoal, deleteArchivedGoal, fetchArchivedGoals, addSubtask, toggleSubtask, deleteSubtask, updateSubtaskEffort, reorderGoals } = useGoals();
  const [orderedGoals, setOrderedGoals] = useState<Goal[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [celebratingGoals, setCelebratingGoals] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const prevProgresses = useRef<Record<string, number>>({});
  const headerRef = useRef<HTMLDivElement>(null);
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sticky header: show when main header scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

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
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });
      }
      const existingIds = new Set(prev.map((g) => g.id));
      const newGoals = goals.filter((g) => !existingIds.has(g.id));
      const filtered = prev
        .filter((g) => goals.some((ng) => ng.id === g.id))
        .map((g) => goals.find((ng) => ng.id === g.id)!);
      return [...filtered, ...newGoals];
    });
  }, [goals]);

  // Fetch archived goals lazily when tab first opened
  const archivedFetched = useRef(false);
  useEffect(() => {
    if (filter === 'archived' && !archivedFetched.current) {
      archivedFetched.current = true;
      fetchArchivedGoals();
    }
  }, [filter]);

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
      g.subtasks.some((s) => s.title.toLowerCase().includes(searchLower))
    );
  };

  const activeGoals = orderedGoals.filter((g) => (calcProgress(g) < 100 || celebratingGoals.has(g.id)) && matchesSearch(g));
  const completedGoals = orderedGoals.filter((g) => calcProgress(g) >= 100 && g.subtasks.length > 0 && !celebratingGoals.has(g.id) && matchesSearch(g));

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
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Page-wide ambient orbs — fixed, edge-positioned, very subtle */}
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
              filter: 'blur(80px)',
            }}
            animate={{ y: [0, -24, 8, -16, 0], x: [0, 12, -8, 14, 0] }}
            transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

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
          />
        )}
      </AnimatePresence>

      {/* Main gradient header */}
      <div ref={headerRef} className="gradient-header px-4 pt-10 pb-8 relative overflow-hidden z-10">
        {HEADER_ORBS.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{ width: orb.w, height: orb.h, left: orb.left, top: orb.top, backgroundColor: orb.color, opacity: orb.opacity, filter: 'blur(45px)' }}
            animate={{ y: [0, -18, 6, -12, 0], x: [0, 9, -6, 11, 0], scale: [1, 1.06, 0.96, 1.04, 1] }}
            transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-white/50" />
                <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Goal Tracker</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Hey, {username}</h1>
              <p className="text-white/40 text-sm italic">"{quote}"</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <AddGoalDialog onAdd={createGoal} open={addGoalOpen} onOpenChange={setAddGoalOpen} />
              <Button variant="ghost" size="icon" onClick={handleToggleSound} title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
                className="text-white/50 hover:text-white hover:bg-white/10">
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out"
                className="text-white/50 hover:text-white hover:bg-white/10">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!loading && orderedGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-6 mt-5 pt-4 border-t border-white/10"
            >
              {[
                { label: 'Goals', value: orderedGoals.length },
                { label: 'Completed', value: completedGoals.length },
                { label: 'Subtasks done', value: totalSubtasksDone },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
                  <div className="text-xs text-white/40 uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Content + Sidebar */}
      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        <div className="lg:flex gap-8 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:max-w-none lg:mx-0">
            {loading ? (
              <div className="space-y-3">
                <SkeletonGoalCard />
                <SkeletonGoalCard />
              </div>
            ) : orderedGoals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-5"
              >
                <div className="goal-float">
                  <Target className="h-16 w-16 text-primary/40" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                    Set your first goal
                  </h2>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Break it into steps. Track your progress. Celebrate every win.
                  </p>
                </div>
                <AddGoalDialog onAdd={createGoal} triggerClassName="cta-glow" />
              </motion.div>
            ) : (
              <div className="space-y-5">
                {/* Search + filter */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search goals and subtasks…"
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { f: 'all', label: `All (${orderedGoals.length})` },
                      { f: 'active', label: `Active (${activeGoals.length})` },
                      { f: 'done', label: `Done (${completedGoals.length})` },
                      { f: 'archived', label: `Archived${archivedGoals.length > 0 ? ` (${archivedGoals.length})` : ''}` },
                    ] as { f: Filter; label: string }[]).map(({ f, label }) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                          filter === f
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active goals — draggable */}
                {showActive && activeGoals.length > 0 && (
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
                    className="space-y-3"
                  >
                    <AnimatePresence initial={false}>
                      {activeGoals.map((goal, i) => (
                        <Reorder.Item
                          key={goal.id}
                          value={goal}
                          as="div"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05, type: 'spring', stiffness: 300, damping: 26 } }}
                          exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.3, ease: 'easeIn' } }}
                        >
                          <GoalCard goal={goal} isCelebrating={celebratingGoals.has(goal.id)} onArchive={() => archiveGoal(goal.id)} {...sharedCardProps} />
                        </Reorder.Item>
                      ))}
                    </AnimatePresence>
                  </Reorder.Group>
                )}

                {/* Completed goals section */}
                {showCompleted && completedGoals.length > 0 && (
                  <div className="space-y-3">
                    {showActive && activeGoals.length > 0 && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">Completed</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <AnimatePresence initial={false}>
                      {completedGoals.map((goal, i) => (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: 0.28 + i * 0.05, duration: 0.35, ease: 'easeOut' } }}
                          exit={{ opacity: 0, scale: 0.96 }}
                        >
                          <GoalCard goal={goal} isCelebrating={celebratingGoals.has(goal.id)} onArchive={() => archiveGoal(goal.id)} {...sharedCardProps} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Archived goals */}
                {filter === 'archived' && (
                  <div className="space-y-2">
                    {archivedLoading ? (
                      <p className="text-center text-muted-foreground text-sm py-12">Loading archive…</p>
                    ) : archivedGoals.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-12 italic">Archive is empty.</p>
                    ) : archivedGoals.map((goal) => {
                      const pct = calcProgress(goal);
                      const done = goal.subtasks.filter((s) => s.is_completed).length;
                      return (
                        <div key={goal.id} className="rounded-xl border bg-card/50 px-4 py-3 flex items-start gap-3 opacity-70 hover:opacity-100 transition-opacity">
                          <Archive className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{goal.title}</p>
                            {goal.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{goal.description}</p>}
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
                  <p className="text-center text-muted-foreground text-sm py-12">
                    {searchLower
                      ? `No goals match "${search}"`
                      : filter === 'active'
                      ? 'No active goals — all done!'
                      : 'No completed goals yet'}
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Sticky sidebar — lg screens only */}
          <div className="sticky top-20">
            <GoalSidebar
              goals={orderedGoals}
              completedCount={completedGoals.length}
              totalSubtasksDone={totalSubtasksDone}
              totalSubtasks={totalSubtasks}
              quote={quote}
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
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg border ${
              saveStatus === 'error'
                ? 'bg-destructive text-destructive-foreground border-destructive'
                : 'bg-card text-foreground border-border'
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
