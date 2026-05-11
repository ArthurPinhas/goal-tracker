import { describe, it, expect } from 'vitest';
import {
  normalizeShowcaseUrl,
  showcaseHostLabel,
  parseYouTubeVideoId,
  parseVimeoId,
  isLikelyDirectImageUrl,
  showcaseFaviconSrc,
  truncateShowcaseUrl,
} from '@/lib/showcaseUrl';

describe('normalizeShowcaseUrl', () => {
  it('returns null for empty', () => {
    expect(normalizeShowcaseUrl('')).toBeNull();
    expect(normalizeShowcaseUrl('  ')).toBeNull();
  });
  it('keeps https URLs', () => {
    expect(normalizeShowcaseUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });
  it('prepends https when scheme missing', () => {
    expect(normalizeShowcaseUrl('example.com/x')).toBe('https://example.com/x');
  });
  it('accepts http', () => {
    expect(normalizeShowcaseUrl('http://local.test/')).toBe('http://local.test/');
  });
  it('rejects non-http schemes', () => {
    expect(normalizeShowcaseUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('showcaseHostLabel', () => {
  it('strips www', () => {
    expect(showcaseHostLabel('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube.com');
  });
});

describe('parseYouTubeVideoId', () => {
  it('parses watch, shorts, embed, youtu.be', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
});

describe('parseVimeoId', () => {
  it('parses standard and player URLs', () => {
    expect(parseVimeoId('https://vimeo.com/123456789')).toBe('123456789');
    expect(parseVimeoId('https://player.vimeo.com/video/123456789')).toBe('123456789');
  });
});

describe('isLikelyDirectImageUrl', () => {
  it('detects image paths and common hosts', () => {
    expect(isLikelyDirectImageUrl('https://cdn.example.com/shots/foo.png?w=800')).toBe(true);
    expect(isLikelyDirectImageUrl('https://i.imgur.com/abc123.jpg')).toBe(true);
    expect(isLikelyDirectImageUrl('https://example.com/page')).toBe(false);
  });
});

describe('showcaseFaviconSrc', () => {
  it('includes encoded host', () => {
    expect(showcaseFaviconSrc('https://github.com/user/repo')).toContain('github.com');
    expect(showcaseFaviconSrc('https://github.com/user/repo')).toContain('favicons');
  });
});

describe('truncateShowcaseUrl', () => {
  it('shortens long strings', () => {
    const long = 'a'.repeat(80);
    expect(truncateShowcaseUrl(long, 20).endsWith('…')).toBe(true);
    expect(truncateShowcaseUrl(long, 20).length).toBeLessThanOrEqual(20);
  });
});
