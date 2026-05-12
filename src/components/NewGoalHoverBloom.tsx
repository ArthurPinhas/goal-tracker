import { memo, useMemo, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { appleEase } from "@/lib/motion";

const CX = 32;
const CY = 26;

/** Single petal outline (stroke grows); tip points upward before rotation */
const PETAL_D =
  "M32 9 C26 11 23.5 16 25.5 21.5 C27 24.5 30.5 26.5 32 27 C33.5 26.5 37 24.5 38.5 21.5 C40.5 16 38 11 32 9 Z";

type Props = {
  active: boolean;
  className?: string;
  /** Icon-only / tight triggers — keeps the glyph inside small buttons */
  compact?: boolean;
};

/**
 * Decorative “new growth” glyph for the New Goal trigger — Framer Motion (A3).
 * Stem draws; petals bloom in staggered springs (reduced-motion: static mid-bloom).
 */
function NewGoalHoverBloomInner({ active, className, compact }: Props) {
  const reduceMotion = useReducedMotion();
  const state = reduceMotion || active ? "hover" : "rest";
  const uid = useId().replace(/:/g, "");
  const gid = `ngb-${uid}`;

  const ease = useMemo(() => [...appleEase] as [number, number, number, number], []);

  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 64 72"
      className={cn(
        "pointer-events-none shrink-0 overflow-visible",
        compact ? "h-7 w-7 max-h-[1.75rem] max-w-[1.75rem]" : "h-10 w-10 max-h-10 max-w-10",
        className
      )}
      initial={false}
      variants={{ rest: {}, hover: {} }}
      animate={state}
    >
      <defs>
        <linearGradient id={`${gid}-stroke`} x1="0" y1="1" x2="0.4" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.45} />
          <stop offset="55%" stopColor="currentColor" stopOpacity={0.95} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.75} />
        </linearGradient>
        <filter id={`${gid}-soft`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={0.8} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`${gid}-petal-fill`} cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
          <stop offset="70%" stopColor="currentColor" stopOpacity={0.06} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Stem */}
      <motion.path
        d="M32 62 C31 52 29 44 30 38 C30.5 34 31 31 31.5 28.5"
        fill="none"
        stroke={`url(#${gid}-stroke)`}
        strokeWidth={1.75}
        strokeLinecap="round"
        filter={`url(#${gid}-soft)`}
        initial={false}
        variants={{
          rest: { pathLength: 0.42, opacity: 0.65 },
          hover: {
            pathLength: 1,
            opacity: 1,
            transition: { pathLength: { duration: 0.52, ease }, opacity: { duration: 0.28 } },
          },
        }}
      />

      {/* Small leaf */}
      <motion.path
        d="M31.5 40 Q26 36 24.5 41.5 Q27 42.5 31.5 40"
        fill={`url(#${gid}-petal-fill)`}
        stroke="currentColor"
        strokeWidth={0.9}
        strokeOpacity={0.35}
        initial={false}
        variants={{
          rest: { opacity: 0, scale: 0.86 },
          hover: {
            opacity: 1,
            scale: 1,
            transition: { delay: 0.12, type: "spring", stiffness: 420, damping: 26 },
          },
        }}
        style={{ transformOrigin: `${24.5}px ${39}px` }}
      />

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`rotate(${i * 60} ${CX} ${CY})`}>
          <motion.path
            d={PETAL_D}
            fill={`url(#${gid}-petal-fill)`}
            stroke="currentColor"
            strokeWidth={1.05}
            strokeOpacity={0.85}
            initial={false}
            variants={{
              rest: {
                scale: 0.52,
                opacity: 0.35,
                filter: "blur(0px)",
              },
              hover: {
                scale: 1,
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 400 + i * 12,
                  damping: 23,
                  delay: i * 0.042,
                },
              },
            }}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          />
        </g>
      ))}

      <motion.circle
        cx={CX}
        cy={CY}
        r={3.2}
        fill="currentColor"
        fillOpacity={0.45}
        initial={false}
        variants={{
          rest: { scale: 0.75, opacity: 0.45 },
          hover: {
            scale: 1,
            opacity: 0.78,
            transition: { delay: 0.18, type: "spring", stiffness: 500, damping: 28 },
          },
        }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      />
    </motion.svg>
  );
}

export const NewGoalHoverBloom = memo(NewGoalHoverBloomInner);
