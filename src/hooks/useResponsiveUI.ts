import { useEffect, useState } from "react";

/** Tailwind `md` — reorder + full celebration above this width with fine pointer */
export const VIEWPORT_MD_PX = 768;

export type CelebrationQuality = "full" | "reduced" | "minimal";

type ResponsiveUI = {
  /** True below `md` */
  isNarrowViewport: boolean;
  /** Touch-first devices (phones, most tablets) */
  isCoarsePointer: boolean;
  /** OS / browser reduced-motion preference */
  prefersReducedMotion: boolean;
  /**
   * Skip heavy list motion, confetti, and `height: auto` subtree animations.
   * True when narrow, coarse pointer, or user prefers reduced motion.
   */
  liteMotion: boolean;
  /**
   * When true, goal reorder may start from anywhere on the card (mouse desktop).
   * When false, reorder only starts from the grip (better for touch / scroll).
   */
  reorderDragWholeCard: boolean;
  celebrationQuality: CelebrationQuality;
  /** How long the goal card stays in “celebrating” chrome */
  celebrationGoalMs: number;
};

function readResponsiveUI(): ResponsiveUI {
  const isNarrowViewport = window.matchMedia(`(max-width: ${VIEWPORT_MD_PX - 1}px)`).matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const liteMotion = isNarrowViewport || isCoarsePointer || prefersReducedMotion;

  const reorderDragWholeCard =
    window.matchMedia(`(min-width: ${VIEWPORT_MD_PX}px)`).matches &&
    window.matchMedia("(pointer: fine)").matches;

  let celebrationQuality: CelebrationQuality = "full";
  if (prefersReducedMotion) celebrationQuality = "minimal";
  else if (isNarrowViewport || isCoarsePointer) celebrationQuality = "reduced";

  const celebrationGoalMs =
    celebrationQuality === "minimal" ? 1800 : celebrationQuality === "reduced" ? 2100 : 3200;

  return {
    isNarrowViewport,
    isCoarsePointer,
    prefersReducedMotion,
    liteMotion,
    reorderDragWholeCard,
    celebrationQuality,
    celebrationGoalMs,
  };
}

/** Viewport + pointer signals for mobile-friendly interaction and lighter motion. */
export function useResponsiveUI(): ResponsiveUI {
  const [ui, setUi] = useState<ResponsiveUI>(() => readResponsiveUI());

  useEffect(() => {
    const mqs = [
      window.matchMedia(`(max-width: ${VIEWPORT_MD_PX - 1}px)`),
      window.matchMedia("(pointer: coarse)"),
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia(`(min-width: ${VIEWPORT_MD_PX}px)`),
      window.matchMedia("(pointer: fine)"),
    ];
    const onChange = () => setUi(readResponsiveUI());
    mqs.forEach((mq) => mq.addEventListener("change", onChange));
    return () => mqs.forEach((mq) => mq.removeEventListener("change", onChange));
  }, []);

  return ui;
}
