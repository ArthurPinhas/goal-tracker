/** Shared motion tuning — keep enter/hover/spring language consistent app-wide */
export const springContent = {
  type: "spring" as const,
  stiffness: 520,
  damping: 30,
  mass: 0.82,
};

/** Premium tactile interactions — buttons, cards, checkboxes */
export const premiumSpring = {
  type: "spring" as const,
  stiffness: 560,
  damping: 26,
};

/** Apple-like calm deceleration (approx. system ease) */
export const appleEase = [0.25, 0.1, 0.25, 1] as const;

/** Smooth layout / screen transitions — fluid, slightly weighted */
export const appleSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 34,
  mass: 0.92,
};

/** Gentle springs — hero stagger, large surfaces */
export const appleSpringGentle = {
  type: "spring" as const,
  stiffness: 320,
  damping: 36,
  mass: 1,
};

/** Short mechanical snap — Teenage Engineering–adjacent “tick” */
export const mechanicalSnap = {
  type: "spring" as const,
  stiffness: 680,
  damping: 42,
  mass: 0.78,
};

/** Cross-page fade/slide duration companion to appleEase */
export const pageTransition = {
  duration: 0.42,
  ease: appleEase,
};

export const tactileHover = { y: -2, scale: 1.01 };
export const tactileTap = { scale: 0.97 };

export const smoothOut = [0.22, 1, 0.36, 1] as const;
