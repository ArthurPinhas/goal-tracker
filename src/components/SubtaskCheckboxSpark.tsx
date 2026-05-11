import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SubtaskCheckboxSparkProps {
  /** Increment to play a new burst */
  burstKey: number;
  /** Hex or CSS color for geometric particles */
  accentColor: string;
  disabled?: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * High-impact localized burst for completing a subtask — multi-ring geometric
 * shards + central flash (visually distinct from the full goal “triumph” moment).
 */
export function SubtaskCheckboxSpark({ burstKey, accentColor, disabled }: SubtaskCheckboxSparkProps) {
  const shards = useMemo(() => {
    const n = 26;
    return Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * Math.PI * 2 + (i % 3) * 0.11;
      const band = i % 3;
      const dist = 34 + band * 16 + (i % 5) * 4;
      const long = i % 2 === 0;
      return {
        angle,
        dist,
        long,
        delay: i * 0.012,
        rot: ((i * 37) % 180) - 90,
        wide: i % 4 === 0,
      };
    });
  }, []);

  const sparks = useMemo(() => {
    const n = 14;
    return Array.from({ length: n }, (_, i) => ({
      angle: (i / n) * Math.PI * 2 + 0.2,
      dist: 52 + (i % 4) * 14,
      delay: 0.05 + i * 0.02,
    }));
  }, []);

  if (disabled || burstKey <= 0) return null;

  return (
    <span
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-0 w-0 -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      <AnimatePresence>
        <motion.span key={burstKey} className="relative block h-0 w-0">
          {/* Core flash */}
          <motion.span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 10,
              height: 10,
              background: `radial-gradient(circle, white 0%, ${accentColor} 45%, transparent 70%)`,
              boxShadow: `0 0 24px 8px ${accentColor}, 0 0 48px 12px rgba(255,255,255,0.35)`,
            }}
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: 14, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          />

          {/* Inner shard ring */}
          {shards.map((p, i) => (
            <motion.span
              key={`s-${i}`}
              className="absolute left-0 top-0 will-change-transform"
              style={{
                width: p.long ? 5 : 3,
                height: p.long ? 12 : 9,
                marginLeft: p.long ? -2.5 : -1.5,
                marginTop: p.long ? -6 : -4.5,
                backgroundColor: i % 3 === 0 ? "#fafafa" : accentColor,
                borderRadius: p.wide ? "3px" : "1px",
                boxShadow: `0 0 12px ${accentColor}`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: p.rot }}
              animate={{
                x: Math.cos(p.angle) * p.dist,
                y: Math.sin(p.angle) * p.dist,
                opacity: 0,
                scale: 0.2,
                rotate: p.rot + (i % 2 === 0 ? 120 : -120),
              }}
              transition={{
                duration: 0.52,
                ease: EASE,
                delay: p.delay,
              }}
            />
          ))}

          {/* Delayed outer sparks */}
          {sparks.map((p, i) => (
            <motion.span
              key={`o-${i}`}
              className="absolute left-0 top-0 h-2 w-2 rounded-full will-change-transform"
              style={{
                background: `linear-gradient(135deg, white, ${accentColor})`,
                boxShadow: `0 0 10px ${accentColor}`,
              }}
              initial={{ x: 0, y: 0, opacity: 0.95, scale: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.dist,
                y: Math.sin(p.angle) * p.dist,
                opacity: 0,
                scale: 0.15,
              }}
              transition={{
                duration: 0.58,
                ease: EASE,
                delay: p.delay,
              }}
            />
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
