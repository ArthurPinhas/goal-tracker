import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

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
  const spring = useSpring(motionPct, { stiffness: 80, damping: 20 });
  const displayPct = useTransform(spring, (v) => `${Math.round(v)}%`);

  useEffect(() => {
    motionPct.set(percentage);
  }, [percentage, motionPct]);

  const color = getProgressColor(percentage);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium tracking-wide uppercase">Progress</span>
        <motion.span
          className="font-mono font-semibold tabular-nums"
          style={{ color }}
        >
          {displayPct}
        </motion.span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <motion.div
          className={`h-full rounded-full relative ${percentage > 0 && percentage < 100 ? 'shimmer-bar' : ''}`}
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default GoalProgress;
