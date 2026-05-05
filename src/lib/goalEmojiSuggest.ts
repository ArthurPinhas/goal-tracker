import { RULES } from './goalEmojiSuggestRules';

/**
 * Normalize titles, match `RULES` from `goalEmojiSuggestRules.ts`, expose picker / stats exports.
 */

export type EmojiSuggestion = {
  /** First matching rule’s emoji */
  primary: string | null;
  /** Distinct emojis from every matching rule — primary first when present */
  pool: string[];
};

/** Extra emojis for shuffle / picker — not tied to keywords */
const EMOJI_SHUFFLE_EXTRAS: readonly string[] = [
  '🎪', '🎭', '🧩', '🪁', '🎨', '🧵', '🎬', '📽️', '🎧', '🎺', '🪕', '🪗',
  '⚡', '🌈', '☀️', '🌙', '🥏', '🎳', '🏆', '🥇', '🏅', '🎖️',
];

/** When title matches nothing — shuffle / random still feels fun */
export const EMOJI_FUN_FALLBACK: readonly string[] = [
  '✨', '🎯', '🚀', '💪', '🌟', '⭐', '📌', '🎉', '🔥', '💡',
];

const UNIQUE_RULE_EMOJI = [...new Set(RULES.map((r) => r.emoji))];

/** Large pool for shuffle: always pick something different when possible */
export const EMOJI_SHUFFLE_POOL: readonly string[] = [
  ...new Set<string>([...UNIQUE_RULE_EMOJI, ...EMOJI_FUN_FALLBACK, ...EMOJI_SHUFFLE_EXTRAS]),
];

/** Grid for the Pick popover (subset + extras) */
export const EMOJI_PICKER_GRID: readonly string[] = [
  ...new Set<string>([
    ...EMOJI_SHUFFLE_POOL,
    '😊', '🙌', '👏', '🫶', '🎁', '📌', '🧠', '🌿', '🍕', '🥑',
  ]),
];

/** Distinct keyword / phrase patterns across all rules */
export const EMOJI_KEYWORD_PATTERN_COUNT = RULES.reduce((n, r) => n + r.patterns.length, 0);

/** Number of emoji rules */
export const EMOJI_RULE_COUNT = RULES.length;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeTitleForMatch(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesPattern(normalized: string, pattern: string): boolean {
  const p = pattern.toLowerCase().trim();
  if (!p) return false;
  if (p.includes(' ')) return normalized.includes(p);
  const re = new RegExp(`\\b${escapeRe(p)}\\b`, 'iu');
  return re.test(normalized);
}

export function getSuggestionForTitle(raw: string): EmojiSuggestion {
  const normalized = normalizeTitleForMatch(raw);
  if (!normalized) return { primary: null, pool: [] };

  const seen = new Set<string>();
  const pool: string[] = [];
  let primary: string | null = null;

  for (const rule of RULES) {
    const hit = rule.patterns.some((pat) => matchesPattern(normalized, pat));
    if (!hit) continue;
    if (!primary) primary = rule.emoji;
    if (!seen.has(rule.emoji)) {
      seen.add(rule.emoji);
      pool.push(rule.emoji);
    }
  }

  return { primary, pool };
}
