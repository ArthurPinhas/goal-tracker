/** Stable random pick — client-only usage */
export function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error("pickRandom: empty list");
  }
  return items[Math.floor(Math.random() * items.length)] as T;
}

/** Hero / header — broad, practical encouragement (not sidebar mantras) */
export const HERO_HEADER_QUOTES = [
  "Your future self will thank you.",
  "The secret of getting ahead is getting started.",
  "Progress is progress, no matter how small.",
  "Done is better than perfect.",
  "One goal at a time. One step at a time.",
  "What you do today shapes who you become tomorrow.",
  "Every expert was once a beginner.",
  "Focus beats perfection.",
  "Keep the promise you made to yourself.",
  "Tiny actions beat giant intentions.",
  "Show up again tomorrow.",
  "Consistency is your unfair advantage.",
  "You don't need to feel ready to begin.",
] as const;

/** Sidebar “Daily mantra” — denser, reflective lines (own pool from hero) */
export const DAILY_MANTRAS = [
  "Small wins, compounded daily, are how mountains get moved.",
  "Discipline is remembering what you want.",
  "The gap between dreams and done is daily reps.",
  "You’re building proof, not vibes.",
  "Patience is momentum with its jacket on.",
  "Earn your calm through kept commitments.",
  "Let progress be boring sometimes — boring is durable.",
  "What you repeat becomes who you are.",
  "Finish strong, but start humane.",
  "Strength is doing the next obvious step.",
  "Honor the boring middle — that’s where trophies are forged.",
  "One honest hour beats ten distracted ones.",
  "Rest is part of the streak.",
  "Comparison fades when you have receipts.",
  "Your calendar tells the truth louder than your mood.",
  "Don’t negotiate with your past self — execute for your future one.",
  "Small promises kept beat big speeches.",
  "Momentum is a muscle; train it gently.",
  "Let today’s effort be a vote for who you’re becoming.",
  "Quiet consistency is its own flex.",
  "The best plan is the one you touch daily.",
  "Stay curious about your capacity.",
  "Celebrate forward motion, not only arrivals.",
  "Depth beats drama.",
  "Ship the slice. Polish comes later.",
  "Your standards rise when your habits do.",
  "Be kind to yourself and ruthless about the next step.",
  "Every checklist closed is a brick in the foundation.",
  "Trust the tally more than the rush.",
  "You’re allowed to be proud before it’s perfect.",
] as const;

/** Full-screen celebration overlay — second line under “Goal reached!” */
export const CELEBRATION_SUBLINES = [
  "That win counts — carry the energy forward.",
  "Proof that showing up moves the needle.",
  "Stack another brick on your future.",
  "Momentum loves honesty; you delivered.",
  "Let this one sink in. You earned it.",
  "Receipt secured — your effort wrote this ending.",
  "That’s not luck; that’s ledger.",
  "Breathe it in. Then aim again.",
  "The finish line moved — so can you.",
  "Today’s you just raised the bar.",
  "Credit where due: yours.",
  "Another promise kept to yourself.",
  "That’s what follow-through sounds like.",
  "Done beats dramatic every time.",
  "Your streak just got a highlight reel.",
  "Hard reset available — but celebrate first.",
  "Let this fuel the next climb.",
  "That’s compound interest on discipline.",
  "You turned intention into inventory.",
  "Victory lap optional — pride mandatory.",
] as const;

/** Toast when a goal crosses 100% */
export const GOAL_COMPLETE_TOASTS = [
  "Goal complete! Outstanding work!",
  "You crushed it! On to the next one.",
  "100%! That took real effort.",
  "Goal achieved. Well done!",
  "Finished — and it shows.",
  "That goal didn’t stand a chance.",
  "Logged, sealed, celebrated.",
  "Big finish. Well earned.",
  "You closed the loop — respect.",
  "Another milestone in the books.",
] as const;

/** Toast at ~50% on goals with subtasks */
export const HALFWAY_TOASTS = [
  "Halfway there, keep going!",
  "You're on fire — 50% done!",
  "Half the battle won. Push through!",
  "Great progress, don't stop now!",
  "Halfway — stay greedy for the finish.",
  "50% is proof the plan works.",
  "Middle miles matter — keep rolling.",
  "Halfway hero energy — don’t drop it.",
] as const;
