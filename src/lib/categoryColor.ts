/** Stable per-category accent colors derived from category ID — consistent across renders */

export type CategoryColorKey =
  | "sky"
  | "violet"
  | "amber"
  | "rose"
  | "emerald"
  | "orange"
  | "indigo"
  | "teal";

interface CategoryAccent {
  key: CategoryColorKey;
  dot: string;
  pill: string;
  pillDark: string;
  text: string;
  border: string;
}

const ACCENTS: Record<CategoryColorKey, CategoryAccent> = {
  sky: {
    key: "sky",
    dot: "bg-sky-400",
    pill: "bg-sky-400/12 border-sky-400/30",
    pillDark: "dark:bg-sky-400/10 dark:border-sky-400/25",
    text: "text-sky-600 dark:text-sky-300",
    border: "border-sky-400/35",
  },
  violet: {
    key: "violet",
    dot: "bg-violet-400",
    pill: "bg-violet-400/12 border-violet-400/30",
    pillDark: "dark:bg-violet-400/10 dark:border-violet-400/25",
    text: "text-violet-600 dark:text-violet-300",
    border: "border-violet-400/35",
  },
  amber: {
    key: "amber",
    dot: "bg-amber-400",
    pill: "bg-amber-400/12 border-amber-400/30",
    pillDark: "dark:bg-amber-400/10 dark:border-amber-400/25",
    text: "text-amber-600 dark:text-amber-300",
    border: "border-amber-400/35",
  },
  rose: {
    key: "rose",
    dot: "bg-rose-400",
    pill: "bg-rose-400/12 border-rose-400/30",
    pillDark: "dark:bg-rose-400/10 dark:border-rose-400/25",
    text: "text-rose-600 dark:text-rose-300",
    border: "border-rose-400/35",
  },
  emerald: {
    key: "emerald",
    dot: "bg-emerald-400",
    pill: "bg-emerald-400/12 border-emerald-400/30",
    pillDark: "dark:bg-emerald-400/10 dark:border-emerald-400/25",
    text: "text-emerald-600 dark:text-emerald-300",
    border: "border-emerald-400/35",
  },
  orange: {
    key: "orange",
    dot: "bg-orange-400",
    pill: "bg-orange-400/12 border-orange-400/30",
    pillDark: "dark:bg-orange-400/10 dark:border-orange-400/25",
    text: "text-orange-600 dark:text-orange-300",
    border: "border-orange-400/35",
  },
  indigo: {
    key: "indigo",
    dot: "bg-indigo-400",
    pill: "bg-indigo-400/12 border-indigo-400/30",
    pillDark: "dark:bg-indigo-400/10 dark:border-indigo-400/25",
    text: "text-indigo-600 dark:text-indigo-300",
    border: "border-indigo-400/35",
  },
  teal: {
    key: "teal",
    dot: "bg-teal-400",
    pill: "bg-teal-400/12 border-teal-400/30",
    pillDark: "dark:bg-teal-400/10 dark:border-teal-400/25",
    text: "text-teal-600 dark:text-teal-300",
    border: "border-teal-400/35",
  },
};

const KEYS = Object.keys(ACCENTS) as CategoryColorKey[];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getCategoryAccent(categoryId: string): CategoryAccent {
  const key = KEYS[hashId(categoryId) % KEYS.length];
  return ACCENTS[key];
}
