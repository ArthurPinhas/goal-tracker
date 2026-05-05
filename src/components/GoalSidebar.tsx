import { motion } from "framer-motion";
import { Trophy, Target, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { Goal } from "@/types/goal";
import { calcProgress } from "@/lib/goalUtils";
import ExportDialog from "@/components/ExportDialog";

interface GoalSidebarProps {
  goals: Goal[];
  completedCount: number;
  totalSubtasksDone: number;
  totalSubtasks: number;
  quote: string;
  overdueCount: number;
  dueSoonCount: number;
}

const ProgressRing = ({ completed, total }: { completed: number; total: number }) => {
  const pct = total > 0 ? completed / total : 0;
  const r = 34;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
      <svg width="88" height="88" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="7" />
        <motion.circle
          cx="44" cy="44" r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          initial={{ strokeDashoffset: circ }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center z-10 select-none">
        <div className="text-base font-bold tabular-nums leading-none">
          {completed}
          <span className="text-muted-foreground text-xs font-normal">/{total}</span>
        </div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">goals</div>
      </div>
    </div>
  );
};

const GoalSidebar = ({ goals, completedCount, totalSubtasksDone, totalSubtasks, quote, overdueCount, dueSoonCount }: GoalSidebarProps) => {
  if (goals.length === 0) return null;

  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + calcProgress(g), 0) / goals.length)
    : 0;

  const activeCount = goals.length - completedCount;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="hidden lg:flex flex-col gap-3 w-52 shrink-0"
    >
      {/* Progress ring */}
      <div className="rounded-xl border bg-card p-4 flex flex-col items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Progress</span>
        <ProgressRing completed={completedCount} total={goals.length} />
        <div className="text-xs text-muted-foreground text-center">
          <span className="font-semibold text-foreground">{avgProgress}%</span> avg across all goals
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-xl border bg-card p-4 space-y-2.5">
        {([
          { label: 'Active', value: activeCount, Icon: Target },
          { label: 'Completed', value: completedCount, Icon: Trophy },
          { label: 'Subtasks done', value: `${totalSubtasksDone}/${totalSubtasks}`, Icon: CheckSquare },
          { label: 'Overdue', value: overdueCount, Icon: AlertCircle },
          { label: 'Due ≤7 days', value: dueSoonCount, Icon: Clock },
        ] as const).map(({ label, value, Icon }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{label}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">{value}</span>
          </div>
        ))}
      </div>

      {/* Quote */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground italic leading-relaxed">"{quote}"</p>
      </div>

      {/* Export */}
      <ExportDialog goals={goals} />
    </motion.aside>
  );
};

export default GoalSidebar;
