import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { appleSpring } from "@/lib/motion";
import { getProgressColor } from "@/lib/goalUtils";

interface GoalProgressProps {
  percentage: number;
}

const GoalProgress = ({ percentage }: GoalProgressProps) => {
  const motionPct = useMotionValue(0);
  const spring = useSpring(motionPct, { stiffness: 200, damping: 28, mass: 0.88 });
  const displayPct = useTransform(spring, (v) => `${Math.round(v)}%`);

  useEffect(() => {
    motionPct.set(percentage);
  }, [percentage, motionPct]);

  const color = getProgressColor(percentage);

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-semibold font-te uppercase tracking-[0.14em] text-muted-foreground">
          Progress
        </span>
        <motion.span
          className="text-sm font-semibold tabular-nums tracking-tight font-te"
          style={{ color }}
        >
          {displayPct}
        </motion.span>
      </div>
      <div className="relative w-full">
        <div className="relative h-[11px] w-full rounded-full overflow-hidden shadow-te-inset-well ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.1] te-segment-track">
          {/* Scale tick marks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-[1]" aria-hidden>
            {[25, 50, 75].map((t) => (
              <div
                key={t}
                className="absolute top-0 bottom-0 w-px bg-black/[0.07] dark:bg-white/[0.08]"
                style={{ left: `${t}%`, transform: "translateX(-50%)" }}
              />
            ))}
          </div>
          <motion.div
            className="relative z-[2] h-full rounded-full overflow-hidden progress-fill-sheen"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 18px -2px ${color}99, inset 0 1px 0 rgba(255,255,255,0.22)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={appleSpring}
          />
        </div>
      </div>
    </div>
  );
};

export default GoalProgress;
