/**
 * Subtle line-art micro-motion glyphs — same language as NewGoalHoverBloom
 * (pathLength, springs, currentColor, prefers-reduced-motion aware).
 */
import { memo, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimation, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { appleEase, premiumSpring, smoothOut } from "@/lib/motion";

function useDefPrefix(base: string) {
  const raw = useId().replace(/:/g, "");
  return `${base}-${raw}`;
}

const ease = [...appleEase] as [number, number, number, number];

/** Tiny sprout beside subtask row — plays once when a step is completed */
export const SubtaskSproutGlyph = memo(function SubtaskSproutGlyph({ playKey }: { playKey: number }) {
  const reduce = useReducedMotion();
  const p = useDefPrefix("sprout");
  const [show, setShow] = useState(false);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduce || playKey <= 0) {
      setShow(false);
      return;
    }
    setShow(true);
    if (dismissRef.current) clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => setShow(false), 2600);
    return () => {
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [playKey, reduce]);

  if (reduce || playKey <= 0) return null;

  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-visible pointer-events-none" aria-hidden>
      <AnimatePresence mode="wait">
        {show && (
          <motion.svg
            key={playKey}
            width={16}
            height={20}
            viewBox="0 0 32 40"
            className="text-primary/75 dark:text-mint/80"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 0.92,
              transition: { duration: 0.48, ease: smoothOut },
            }}
            transition={{
              opacity: { duration: 0.22, ease: appleEase },
              scale: { duration: 0.26, ...premiumSpring },
            }}
          >
          <defs>
            <linearGradient id={`${p}-g`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <motion.path
            d="M16 36 C16 36 15 28 16 22"
            fill="none"
            stroke={`url(#${p}-g)`}
            strokeWidth={1.4}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.38, ease }}
          />
          <motion.path
            d="M16 26 Q10 24 9 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.1}
            strokeLinecap="round"
            strokeOpacity={0.65}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.28, ease }}
          />
          <motion.path
            d="M16 24 Q22 23 24 19"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.1}
            strokeLinecap="round"
            strokeOpacity={0.65}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.26, duration: 0.28, ease }}
          />
        </motion.svg>
        )}
      </AnimatePresence>
    </span>
  );
});

/** Bookmark ribbon — "Link your win" hover */
export const LinkWinRibbonGlyph = memo(function LinkWinRibbonGlyph({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const p = useDefPrefix("ribbon");
  const state = reduce || active ? "on" : "off";

  return (
    <motion.svg
      width={18}
      height={20}
      viewBox="0 0 36 40"
      className="pointer-events-none shrink-0 text-gold/85 dark:text-gold/80"
      aria-hidden
      initial={false}
      variants={{ off: {}, on: {} }}
      animate={state}
    >
      <defs>
        <linearGradient id={`${p}-s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.5} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <motion.path
        d="M8 6 h20 a4 4 0 0 1 4 4 v22 l-14 -8 -14 8 V10 a4 4 0 0 1 4 -4z"
        fill="none"
        stroke={`url(#${p}-s)`}
        strokeWidth={1.35}
        strokeLinejoin="round"
        variants={{
          off: { pathLength: 0.28, opacity: 0.45 },
          on: {
            pathLength: 1,
            opacity: 1,
            transition: { pathLength: { duration: 0.45, ease }, opacity: { duration: 0.2 } },
          },
        }}
      />
      <motion.path
        d="M18 14 v12"
        stroke="currentColor"
        strokeWidth={1}
        strokeOpacity={0.35}
        strokeLinecap="round"
        variants={{
          off: { pathLength: 0 },
          on: { pathLength: 1, transition: { delay: 0.2, duration: 0.25, ease } },
        }}
      />
    </motion.svg>
  );
});

/** Three leaves — fan when filter is active; brief pulse when `pulseKey` bumps (click) */
export const FilterLeafFanGlyph = memo(function FilterLeafFanGlyph({
  active,
  pulseKey = 0,
}: {
  active: boolean;
  /** Increment on click so the fan replays a short burst */
  pulseKey?: number;
}) {
  const reduce = useReducedMotion();
  const on = reduce || active;
  const burst = useAnimation();
  const paths = [
    { path: "M14 17 Q8 10 7 5", rot: -16 },
    { path: "M14 17 Q14 7 14 3", rot: 0 },
    { path: "M14 17 Q20 10 21 5", rot: 16 },
  ];

  useEffect(() => {
    if (pulseKey <= 0 || reduce) return;
    void burst.start({
      scale: [1, 1.12, 1],
      rotate: [0, -5, 0],
      transition: { duration: 0.42, ease: smoothOut },
    });
  }, [pulseKey, reduce, burst]);

  return (
    <motion.span
      className={cn(
        "pointer-events-none inline-flex shrink-0 items-center justify-center overflow-visible transition-opacity duration-300",
        active ? "text-primary-foreground/95" : "text-muted-foreground/60",
      )}
      initial={false}
      animate={burst}
      aria-hidden
    >
      <svg width={14} height={12} viewBox="0 0 28 22">
        {paths.map((L, i) => (
          <motion.g
            key={i}
            style={{ transformOrigin: "14px 17px" }}
            initial={false}
            animate={{
              rotate: on ? L.rot : L.rot * 0.35,
              scale: on ? 1 : 0.78,
              opacity: on ? 0.88 - i * 0.05 : 0.42,
            }}
            transition={{ ...premiumSpring, delay: active && !reduce ? i * 0.045 : 0 }}
          >
            <path
              d={L.path}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.1}
              strokeLinecap="round"
            />
          </motion.g>
        ))}
      </svg>
    </motion.span>
  );
});

/** Folded sheet outline — export trigger hover */
export const ExportSheetGlyph = memo(function ExportSheetGlyph({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const state = reduce || active ? "on" : "off";

  return (
    <motion.svg
      width={16}
      height={18}
      viewBox="0 0 32 36"
      className="pointer-events-none shrink-0 text-current opacity-90"
      aria-hidden
      initial={false}
      variants={{ off: {}, on: {} }}
      animate={state}
    >
      <motion.path
        d="M6 5 h14 l6 6 v18 a2 2 0 0 1 -2 2 H8 a2 2 0 0 1 -2 -2 V7 a2 2 0 0 1 2 -2z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
        variants={{
          off: { pathLength: 0.25, opacity: 0.45 },
          on: { pathLength: 1, opacity: 0.92, transition: { duration: 0.48, ease } },
        }}
      />
      <motion.path
        d="M20 5 v6 h6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.15}
        strokeOpacity={0.85}
        strokeLinejoin="round"
        variants={{
          off: { pathLength: 0, opacity: 0 },
          on: { pathLength: 1, opacity: 1, transition: { delay: 0.12, duration: 0.32, ease } },
        }}
      />
    </motion.svg>
  );
});

/** Tray slot — archive icon hover */
export const ArchiveTrayGlyph = memo(function ArchiveTrayGlyph({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const state = reduce || active ? "on" : "off";

  return (
    <motion.svg
      width={14}
      height={12}
      viewBox="0 0 28 24"
      className="pointer-events-none text-gold/70 dark:text-gold/65"
      aria-hidden
      initial={false}
      variants={{ off: {}, on: {} }}
      animate={state}
    >
      <motion.path
        d="M4 8 h20 v2 H4z M6 10 v8 a2 2 0 0 0 2 2 h12 a2 2 0 0 0 2 -2 V10"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
        variants={{
          off: { pathLength: 0.35, opacity: 0.4 },
          on: { pathLength: 1, opacity: 1, transition: { duration: 0.42, ease } },
        }}
      />
      <motion.path
        d="M10 8 V6 a2 2 0 0 1 2 -2 h4 a2 2 0 0 1 2 2 v2"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.1}
        strokeLinecap="round"
        variants={{
          off: { pathLength: 0 },
          on: { pathLength: 1, transition: { delay: 0.15, duration: 0.32, ease } },
        }}
      />
    </motion.svg>
  );
});

/** Soft rings when reminders turn on */
export const BellRippleGlyph = memo(function BellRippleGlyph({ pulseKey }: { pulseKey: number }) {
  const reduce = useReducedMotion();

  if (reduce || pulseKey <= 0) return null;

  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <AnimatePresence>
        <motion.span
          key={pulseKey}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
        >
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border border-primary/45 dark:border-mint/50"
              style={{ width: 28, height: 28, marginLeft: -14, marginTop: -14 }}
              initial={{ scale: 0.65, opacity: 0.55 }}
              animate={{ scale: 2.1 + i * 0.35, opacity: 0 }}
              transition={{
                duration: 0.75,
                delay: i * 0.12,
                ease,
              }}
            />
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
});
