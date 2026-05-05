/** Shared motion tuning — keep enter/hover/spring language consistent app-wide */
export const springContent = {
  type: "spring" as const,
  stiffness: 380,
  damping: 34,
  mass: 0.85,
};

export const smoothOut = [0.22, 1, 0.36, 1] as const;
