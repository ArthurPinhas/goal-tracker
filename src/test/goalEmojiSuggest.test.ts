import { describe, it, expect } from 'vitest';
import {
  getSuggestionForTitle,
  normalizeTitleForMatch,
  EMOJI_FUN_FALLBACK,
  EMOJI_RULE_COUNT,
  EMOJI_KEYWORD_PATTERN_COUNT,
  EMOJI_SHUFFLE_POOL,
} from '@/lib/goalEmojiSuggest';

describe('goalEmojiSuggest', () => {
  it('matches guitar / song style titles', () => {
    const a = getSuggestionForTitle('Learn guitar song');
    expect(a.primary).toBe('🎸');
    expect(a.pool).toContain('🎸');
    expect(a.pool).toContain('🎵');
  });

  it('returns empty when title is blank', () => {
    expect(getSuggestionForTitle('   ')).toEqual({ primary: null, pool: [] });
  });

  it('normalizeTitleForMatch strips noise', () => {
    expect(normalizeTitleForMatch('Hello, WORLD!!!')).toBe('hello world');
  });

  it('exposes a shuffle fallback pool', () => {
    expect(EMOJI_FUN_FALLBACK.length).toBeGreaterThan(0);
  });

  it('exports stable rule / pattern counts for the dictionary', () => {
    expect(EMOJI_RULE_COUNT).toBeGreaterThan(0);
    expect(EMOJI_KEYWORD_PATTERN_COUNT).toBeGreaterThanOrEqual(EMOJI_RULE_COUNT);
  });

  it('uses a large shuffle pool so picks can vary away from the current emoji', () => {
    expect(EMOJI_SHUFFLE_POOL.length).toBeGreaterThanOrEqual(40);
  });
});
