import { motion } from "framer-motion";
import SkeletonGoalCard from "@/components/SkeletonGoalCard";

const FALLBACK_ORBS = [
  { w: 120, h: 90, left: "8%", top: "-20%", color: "#34d399", opacity: 0.11 },
  { w: 160, h: 120, left: "52%", top: "-28%", color: "#a78bfa", opacity: 0.09 },
  { w: 100, h: 80, left: "78%", top: "10%", color: "#60a5fa", opacity: 0.08 },
];

/** Shown while the main goals route chunk loads — matches the real header + card layout. */
const IndexRouteFallback = () => (
  <div className="min-h-screen bg-background relative">
    <div className="gradient-header px-4 pt-10 pb-8 relative overflow-hidden border-b border-white/10">
      {FALLBACK_ORBS.map((orb, i) => (
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
            filter: "blur(42px)",
          }}
          animate={{ y: [0, -14, 6, -10, 0], x: [0, 8, -5, 9, 0] }}
          transition={{ duration: 9 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="max-w-5xl mx-auto relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-white/25 animate-pulse" />
          <div className="h-3 w-24 rounded-md bg-white/20 animate-pulse" />
        </div>
        <div className="h-9 w-52 max-w-[75%] rounded-lg bg-white/[0.28] animate-pulse" />
        <div className="h-3.5 w-full max-w-lg rounded-md bg-white/15 animate-pulse" />
      </div>
    </div>
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="space-y-3 max-w-2xl">
        <SkeletonGoalCard />
        <SkeletonGoalCard />
      </div>
    </div>
  </div>
);

export default IndexRouteFallback;
