import { lazy, Suspense, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Trophy, Target, CheckSquare, Clock, AlertCircle, Sparkles, type LucideIcon } from "lucide-react";
import { Goal } from "@/types/goal";
import { calcProgress } from "@/lib/goalUtils";
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

/** Large ring — avg % center (“overall momentum” like dashboard mockups) */
const OverallMomentumRing = ({ pct }: { pct: number }) => {
  const r = 58;
  const stroke = 7;
  const circ = 2 * Math.PI * r;
  const size = 154;
  const cx = size / 2;
  const pctWide = pct >= 100;

  return (
    <div className="relative flex items-center justify-center overflow-visible" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute -rotate-90 overflow-visible text-transparent [&_circle]:transition-colors"
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
          transition={{ duration: 0.88, ease: smoothOut }}
        />
      </svg>
      <div className="relative z-10 flex max-w-[min(92%,7rem)] flex-col items-center justify-center px-1 text-center">
        <span
          className={cn(
            "font-black tabular-nums leading-none tracking-tight text-foreground",
            pctWide ? "text-[1.5625rem] tracking-tighter sm:text-[1.6875rem]" : "text-[1.875rem] sm:text-[2rem]",
          )}
        >
          {pct}%
        </span>
        <span className="mt-1 text-[10px] font-bold font-te uppercase tracking-[0.16em] text-muted-foreground">overall</span>
      </div>
    </div>
  );
};

function StatPulse({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  accent: string;
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
      <span className="shrink-0 text-lg font-bold tabular-nums tracking-tight text-foreground">{value}</span>
    </motion.div>
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

  const avgProgress =
    goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + calcProgress(g), 0) / goals.length) : 0;
  const activeCount = goals.length - completedCount;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springContent, delay: 0.12 }}
      className="hidden w-[18rem] shrink-0 flex-col gap-0 lg:flex xl:w-[20rem]"
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-gradient-to-b from-card/95 to-card/75 p-4 shadow-te-chassis backdrop-blur-md dark:border-white/[0.08] dark:from-card/85 dark:to-card/60 surface-grain">
      <div className="rounded-xl border border-border/40 bg-card/50 p-5 shadow-neo-card dark:border-border/35 dark:bg-card/55">
        <div className="mb-2">
          <span className="text-[10px] font-semibold font-te uppercase tracking-[0.14em] text-muted-foreground">Momentum</span>
        </div>
        <motion.div
          className="flex flex-col items-center gap-3 pt-1"
          whileHover={ringHover}
          transition={appleSpringGentle}
        >
          <OverallMomentumRing pct={avgProgress} />
          <p className="text-center text-xs leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground">{completedCount}</span> of {goals.length} goals achieved
          </p>
        </motion.div>
      </div>

      <div className="space-y-2">
        <span className="block px-0.5 text-[10px] font-semibold font-te uppercase tracking-[0.14em] text-muted-foreground">At a glance</span>
        <div className="flex flex-col gap-2">
          <StatPulse label="Active" value={activeCount} Icon={Target} accent="text-mint [&>div>span:first-child]:bg-mint" />
          <StatPulse label="Achieved" value={completedCount} Icon={Trophy} accent="text-gold [&>div>span:first-child]:bg-gold" />
          <StatPulse
            label="Subtasks"
            value={`${totalSubtasksDone}/${totalSubtasks}`}
            Icon={CheckSquare}
            accent="text-sky-400 [&>div>span:first-child]:bg-sky-400"
          />
          <StatPulse label="Overdue" value={overdueCount} Icon={AlertCircle} accent="text-red-400 [&>div>span:first-child]:bg-red-400" />
          <StatPulse label="Due ≤7d" value={dueSoonCount} Icon={Clock} accent="text-gold [&>div>span:first-child]:bg-gold/90" />
        </div>
      </div>

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
