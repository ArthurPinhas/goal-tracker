import { describe, it, expect } from 'vitest';
import { parseLinkSegments } from '@/lib/linkSegments';

describe('parseLinkSegments', () => {
  it('returns plain text as one segment', () => {
    expect(parseLinkSegments('hello')).toEqual([{ type: 'text', text: 'hello' }]);
  });

  it('extracts a single https URL', () => {
    expect(parseLinkSegments('see https://example.com path')).toEqual([
      { type: 'text', text: 'see ' },
      { type: 'link', href: 'https://example.com', label: 'https://example.com' },
      { type: 'text', text: ' path' },
    ]);
  });

  it('leaves trailing punctuation outside the link href', () => {
    expect(parseLinkSegments('Visit https://a.com.')).toEqual([
      { type: 'text', text: 'Visit ' },
      { type: 'link', href: 'https://a.com', label: 'https://a.com' },
      { type: 'text', text: '.' },
    ]);
  });

  it('normalizes www. to https', () => {
    expect(parseLinkSegments('open www.example.org now')).toEqual([
      { type: 'text', text: 'open ' },
      { type: 'link', href: 'https://www.example.org', label: 'www.example.org' },
      { type: 'text', text: ' now' },
    ]);
  });

  it('handles multiple URLs', () => {
    expect(parseLinkSegments('a http://x.com b https://y.com c')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'link', href: 'http://x.com', label: 'http://x.com' },
      { type: 'text', text: ' b ' },
      { type: 'link', href: 'https://y.com', label: 'https://y.com' },
      { type: 'text', text: ' c' },
    ]);
  });

  it('preserves newlines in text', () => {
    expect(parseLinkSegments('line1\nhttps://z.io\nline3')).toEqual([
      { type: 'text', text: 'line1\n' },
      { type: 'link', href: 'https://z.io', label: 'https://z.io' },
      { type: 'text', text: '\nline3' },
    ]);
  });
});
