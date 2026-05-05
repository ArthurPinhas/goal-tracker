import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { smoothOut } from "@/lib/motion";

interface GoalProgressProps {
  percentage: number;
}

const getProgressColor = (pct: number): string => {
  if (pct >= 100) return '#f59e0b';
  if (pct >= 50) return '#22c55e';
  return '#34d399';
};

const GoalProgress = ({ percentage }: GoalProgressProps) => {
  const motionPct = useMotionValue(0);
  const spring = useSpring(motionPct, { stiffness: 120, damping: 22, mass: 0.9 });
  const displayPct = useTransform(spring, (v) => `${Math.round(v)}%`);

  useEffect(() => {
    motionPct.set(percentage);
  }, [percentage, motionPct]);

  const color = getProgressColor(percentage);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
          Progress
        </span>
        <motion.span
          className="text-sm font-semibold tabular-nums tracking-tight"
          style={{ color }}
        >
          {displayPct}
        </motion.span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-secondary/90 overflow-hidden ring-1 ring-inset ring-black/[0.06] dark:bg-secondary dark:ring-white/[0.08] shadow-inner dark:shadow-black/40">
        <motion.div
          className={`h-full rounded-full relative ${percentage > 0 && percentage < 100 ? "shimmer-bar" : ""}`}
          style={{
            backgroundColor: color,
            boxShadow: `0 0 16px -2px ${color}88`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.65, ease: smoothOut }}
        />
      </div>
    </div>
  );
};

export default GoalProgress;
