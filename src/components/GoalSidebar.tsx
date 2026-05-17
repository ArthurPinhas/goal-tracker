import { lazy, Suspense, useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Trophy, Target, CheckSquare, Clock, AlertCircle, Sparkles, BarChart3, ChevronDown, type LucideIcon } from "lucide-react";
import { Goal } from "@/types/goal";
import { calcProgress, isGoalComplete } from "@/lib/goalUtils";
import { getCategoryAccent } from "@/lib/categoryColor";
import { pickRandom, DAILY_MANTRAS } from "@/lib/motivationalCopy";
import { appleSpringGentle, springContent, smoothOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ExportDialog = lazy(() => import("@/components/ExportDialog"));

interface GoalSidebarProps {
  goals: Goal[];
  completedCount: number;
  totalSubtasksDone: number;
  totalSubtasks: number;
  overdueCount: number;
  dueSoonCount: number;
}

function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const motionVal = useMotionValue(value);
  const spring = useSpring(motionVal, { stiffness: 160, damping: 22, mass: 0.95 });
  const display = useTransform(spring, (v) => String(Math.round(v)));

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span className={className}>{display}</motion.span>;
}

/** Completion ring — filled based on completed/total; shows count in center */
const GoalsAchievedRing = ({
  completedCount,
  totalCount,
}: {
  completedCount: number;
  totalCount: number;
}) => {
  const r = 58;
  const stroke = 7;
  const circ = 2 * Math.PI * r;
  const size = 154;
  const cx = size / 2;
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="relative flex items-center justify-center overflow-visible" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute -rotate-90 overflow-visible"
        aria-hidden
      >
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} className="opacity-55" />
        <motion.circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - Math.min(100, Math.max(0, pct)) / 100) }}
          initial={{ strokeDashoffset: circ }}
          transition={{ duration: 0.92, ease: smoothOut }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center text-center select-none">
        <AnimatedCounter
          value={completedCount}
          className="text-[2.25rem] font-black tabular-nums leading-none tracking-tight text-foreground"
        />
        <span className="mt-1 text-[10px] font-bold font-te uppercase tracking-[0.16em] text-muted-foreground">
          of {totalCount}
        </span>
        <span className="text-[9px] font-semibold font-te uppercase tracking-[0.14em] text-muted-foreground/70 mt-0.5">
          achieved
        </span>
      </div>
    </div>
  );
};

function StatPulse({
  label,
  value,
  Icon,
  accent,
  animate: animateNum = false,
}: {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  accent: string;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const hover = reduce ? undefined : { y: -1, scale: 1.012 };

  return (
    <motion.div
      whileHover={hover}
      transition={appleSpringGentle}
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-card/60 px-3 py-2.5 shadow-te-inset-well backdrop-blur-[2px] transition-[transform,box-shadow] hover:bg-card/85 dark:border-border/35 dark:bg-card/40 dark:hover:bg-card/50",
        accent,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0 rounded-full shadow-[0_0_10px_currentColor]" aria-hidden />
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-[11px] font-semibold font-te uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      </div>
      {animateNum && typeof value === "number" ? (
        <AnimatedCounter value={value} className="shrink-0 text-lg font-bold tabular-nums tracking-tight text-foreground" />
      ) : (
        <span className="shrink-0 text-lg font-bold tabular-nums tracking-tight text-foreground">{value}</span>
      )}
    </motion.div>
  );
}

function ProgressBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
      <motion.div
        className={cn("h-full rounded-full", colorClass)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        transition={{ duration: 0.55, ease: smoothOut }}
      />
    </div>
  );
}

function AnalyticsPanel({ goals, completedCount }: { goals: Goal[]; completedCount: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const { distribution, categoryRows } = useMemo(() => {
    const buckets = { done: 0, high: 0, mid: 0, none: 0 };
    for (const g of goals) {
      const p = calcProgress(g);
      if (isGoalComplete(g)) buckets.done++;
      else if (p >= 50) buckets.high++;
      else if (p > 0) buckets.mid++;
      else buckets.none++;
    }

    const catMap = new Map<string, { name: string; count: number; id: string }>();
    for (const g of goals) {
      if (g.category) {
        const e = catMap.get(g.category.id);
        if (e) e.count++;
        else catMap.set(g.category.id, { id: g.category.id, name: g.category.name, count: 1 });
      }
    }
    const categoryRows = [...catMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      distribution: [
        { label: "Done", count: buckets.done, color: "bg-primary" },
        { label: "≥50%", count: buckets.high, color: "bg-mint" },
        { label: "1–49%", count: buckets.mid, color: "bg-sky-400" },
        { label: "0%", count: buckets.none, color: "bg-muted-foreground/40" },
      ],
      categoryRows,
    };
  }, [goals]);

  const completionRate = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 shadow-te-inset-well dark:border-border/35 dark:bg-card/45">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3.5 py-3 text-left"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold font-te uppercase tracking-[0.14em] text-muted-foreground">
            Insights
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={appleSpringGentle}
          className="inline-flex"
        >
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="analytics-body"
            initial={reduce ? { height: 0, opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { height: 0, opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: smoothOut }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-3.5 pb-3.5 pt-1">
              {/* Completion rate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold font-te uppercase tracking-[0.12em] text-muted-foreground">
                    Completion rate
                  </span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    <AnimatedCounter value={completionRate} />%
                  </span>
                </div>
                <ProgressBar pct={completionRate} colorClass="bg-primary" />
              </div>

              {/* Progress distribution */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-semibold font-te uppercase tracking-[0.12em] text-muted-foreground">
                  Progress
                </span>
                <div className="space-y-1.5">
                  {distribution.map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-9 shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {label}
                      </span>
                      <ProgressBar
                        pct={goals.length > 0 ? (count / goals.length) * 100 : 0}
                        colorClass={color}
                      />
                      <span className="w-4 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category breakdown */}
              {categoryRows.length > 0 && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-semibold font-te uppercase tracking-[0.12em] text-muted-foreground">
                    By category
                  </span>
                  <div className="space-y-1">
                    {categoryRows.map(({ id, name, count }) => {
                      const ca = getCategoryAccent(id);
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ca.dot)} aria-hidden />
                          <span className="flex-1 truncate text-[11px] text-muted-foreground">
                            {name}
                          </span>
                          <span className="shrink-0 text-[10px] tabular-nums font-medium text-foreground">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const GoalSidebar = ({
  goals,
  completedCount,
  totalSubtasksDone,
  totalSubtasks,
  overdueCount,
  dueSoonCount,
}: GoalSidebarProps) => {
  const dailyMantra = useMemo(() => pickRandom(DAILY_MANTRAS), []);
  const reduce = useReducedMotion();
  const ringHover = reduce ? undefined : { scale: 1.015 };
  const cardHover = reduce ? undefined : { y: -1, scale: 1.008 };

  if (goals.length === 0) return null;

  const activeCount = goals.length - completedCount;
  const avgProgress = Math.round(
    goals.reduce((sum, g) => sum + calcProgress(g), 0) / goals.length,
  );

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springContent, delay: 0.12 }}
      className="hidden w-[18rem] shrink-0 flex-col gap-0 lg:flex xl:w-[20rem]"
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-gradient-to-b from-card/95 to-card/75 p-4 shadow-te-chassis backdrop-blur-md dark:border-white/[0.08] dark:from-card/85 dark:to-card/60 surface-grain">
        {/* Momentum ring */}
        <div className="rounded-xl border border-border/40 bg-card/50 p-5 shadow-neo-card dark:border-border/35 dark:bg-card/55">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold font-te uppercase tracking-[0.14em] text-muted-foreground">Momentum</span>
            <span className="text-[10px] font-semibold font-te tabular-nums text-muted-foreground/70">
              avg&nbsp;<AnimatedCounter value={avgProgress} />%
            </span>
          </div>
          <motion.div
            className="flex flex-col items-center gap-3 pt-1"
            whileHover={ringHover}
            transition={appleSpringGentle}
          >
            <GoalsAchievedRing completedCount={completedCount} totalCount={goals.length} />
          </motion.div>
        </div>

        {/* At a glance */}
        <div className="space-y-2">
          <span className="block px-0.5 text-[10px] font-semibold font-te uppercase tracking-[0.14em] text-muted-foreground">At a glance</span>
          <div className="flex flex-col gap-2">
            <StatPulse label="Active" value={activeCount} Icon={Target} accent="text-mint [&>div>span:first-child]:bg-mint" animate />
            <StatPulse label="Achieved" value={completedCount} Icon={Trophy} accent="text-gold [&>div>span:first-child]:bg-gold" animate />
            <StatPulse
              label="Subtasks"
              value={`${totalSubtasksDone}/${totalSubtasks}`}
              Icon={CheckSquare}
              accent="text-sky-400 [&>div>span:first-child]:bg-sky-400"
            />
            <StatPulse label="Overdue" value={overdueCount} Icon={AlertCircle} accent="text-red-400 [&>div>span:first-child]:bg-red-400" animate />
            <StatPulse label="Due ≤7d" value={dueSoonCount} Icon={Clock} accent="text-gold [&>div>span:first-child]:bg-gold/90" animate />
          </div>
        </div>

        {/* Insights */}
        <AnalyticsPanel goals={goals} completedCount={completedCount} />

        {/* Daily mantra */}
        <motion.div
          className="rounded-xl border border-mint/30 bg-gradient-to-br from-mint/[0.06] via-card/95 to-gold/[0.05] p-4 shadow-inner shadow-te-inset-well dark:from-mint/[0.08] dark:via-card/90 dark:to-gold/[0.04]"
          whileHover={cardHover}
          transition={appleSpringGentle}
        >
          <div className="mb-2.5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-gold drop-shadow-[0_0_12px_hsl(var(--gold)/0.5)]" aria-hidden />
            <span className="text-[10px] font-semibold font-te uppercase tracking-[0.14em] text-mint">Daily mantra</span>
          </div>
          <p className="text-sm font-medium italic leading-relaxed text-foreground/95">&ldquo;{dailyMantra}&rdquo;</p>
        </motion.div>

        {/* Export */}
        <Suspense
          fallback={
            <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-border/60 bg-card/80 p-4 animate-pulse shadow-neo-card dark:border-border/50 dark:bg-card/70 dark:shadow-black/30">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Export</span>
            </div>
          }
        >
          <ExportDialog goals={goals} />
        </Suspense>
      </div>
    </motion.aside>
  );
};

export default GoalSidebar;
