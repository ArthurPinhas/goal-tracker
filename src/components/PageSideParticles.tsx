import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#34d399", "#a78bfa", "#60a5fa", "#f472b6", "#fbbf24", "#22d3ee"];

type Particle = {
  id: string;
  size: number;
  topPct: number;
  insetPct: number;
  delay: number;
  duration: number;
  color: string;
  blur: number;
};

/** Original side-particle recipe (small dots, livelier motion) — not the oversized ambient PAGE_ORBS */
function makeParticles(side: "left" | "right", count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${side}-${i}`,
    size: 5 + (i * 7) % 10,
    topPct: ((i * 37) % 88) + 4,
    insetPct: 8 + (i * 13) % 55,
    delay: (i * 0.31) % 5,
    duration: count <= 8 ? 20 + (i % 5) * 2 : 16 + (i % 9) * 2,
    color: COLORS[i % COLORS.length],
    blur: i % 3 === 0 ? 1.2 : 0,
  }));
}

type PageSideParticlesProps = {
  /** Fewer particles, no glow, gentler motion — phones / coarse pointer */
  lite?: boolean;
};

/** Edge sparkles — full-height gutters; hero has no extra bottom wash (that layer caused the “wall”). */
export function PageSideParticles({ lite = false }: PageSideParticlesProps) {
  const reduceMotion = useReducedMotion();
  const count = lite ? 7 : 18;
  const left = useMemo(() => makeParticles("left", count), [count]);
  const right = useMemo(() => makeParticles("right", count), [count]);

  return (
    <>
      <div
        className="fixed inset-y-0 left-0 z-[5] hidden min-[480px]:block w-[min(16vw,200px)] pointer-events-none overflow-hidden"
        aria-hidden
      >
        {left.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              top: `${p.topPct}%`,
              left: `${p.insetPct}%`,
              backgroundColor: p.color,
              opacity: lite ? 0.22 : 0.28,
              filter: p.blur ? `blur(${p.blur}px)` : undefined,
              boxShadow: lite ? undefined : `0 0 ${p.size * 2}px ${p.color}40`,
            }}
            animate={
              reduceMotion
                ? { opacity: lite ? 0.18 : 0.22 }
                : lite
                  ? {
                      y: [0, -22, 14, -12, 0],
                      x: [0, 10, -8, 0],
                      opacity: [0.14, 0.32, 0.2, 0.28, 0.14],
                    }
                  : {
                      y: [0, -45, 25, -35, 15, 0],
                      x: [0, 18, -12, 14, -8, 0],
                      opacity: [0.15, 0.42, 0.22, 0.38, 0.2, 0.15],
                      scale: [1, 1.15, 0.9, 1.08, 1],
                    }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: p.duration,
                    delay: p.delay,
                    repeat: lite ? 2 : Infinity,
                    repeatType: lite ? "mirror" : "loop",
                    ease: "easeInOut",
                  }
            }
          />
        ))}
      </div>
      <div
        className="fixed inset-y-0 right-0 z-[5] hidden min-[480px]:block w-[min(16vw,200px)] pointer-events-none overflow-hidden"
        aria-hidden
      >
        {right.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              top: `${p.topPct}%`,
              right: `${p.insetPct}%`,
              backgroundColor: p.color,
              opacity: lite ? 0.22 : 0.28,
              filter: p.blur ? `blur(${p.blur}px)` : undefined,
              boxShadow: lite ? undefined : `0 0 ${p.size * 2}px ${p.color}40`,
            }}
            animate={
              reduceMotion
                ? { opacity: lite ? 0.18 : 0.22 }
                : lite
                  ? {
                      y: [0, 20, -16, 10, 0],
                      x: [0, -8, 8, 0],
                      opacity: [0.14, 0.3, 0.22, 0.26, 0.14],
                    }
                  : {
                      y: [0, 35, -28, 22, -18, 0],
                      x: [0, -16, 12, -10, 8, 0],
                      opacity: [0.15, 0.4, 0.24, 0.36, 0.18, 0.15],
                      scale: [1, 1.12, 0.92, 1.06, 1],
                    }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: p.duration,
                    delay: p.delay + 0.5,
                    repeat: lite ? 2 : Infinity,
                    repeatType: lite ? "mirror" : "loop",
                    ease: "easeInOut",
                  }
            }
          />
        ))}
      </div>
    </>
  );
}
