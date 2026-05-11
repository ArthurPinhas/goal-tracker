/**
 * Normalize user-entered showcase URL for storage. Returns null if empty or invalid.
 * Prepends https:// when no scheme is present.
 */
export function normalizeShowcaseUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Host label for display chips (e.g. youtube.com). */
export function showcaseHostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Google favicon proxy — works for any http(s) page without extra backend. */
export function showcaseFaviconSrc(url: string): string {
  const host = showcaseHostLabel(url);
  if (!host) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

const YT_ID = /^[\w-]{11}$/;

/** YouTube watch / shorts / embed / youtu.be — returns 11-char video id or null. */
export function parseYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (h === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return YT_ID.test(id) ? id : null;
    }
    if (!h.endsWith('youtube.com')) return null;
    if (u.pathname.startsWith('/watch')) {
      const v = u.searchParams.get('v');
      return v && YT_ID.test(v) ? v : null;
    }
    if (u.pathname.startsWith('/embed/')) {
      const id = u.pathname.slice(7).split('/')[0];
      return YT_ID.test(id) ? id : null;
    }
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.slice(8).split('/')[0];
      return YT_ID.test(id) ? id : null;
    }
    if (u.pathname.startsWith('/live/')) {
      const id = u.pathname.slice(6).split('/')[0];
      return YT_ID.test(id) ? id : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function youtubeShowcaseThumbnailSrc(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Vimeo video id for embed / player URLs. */
export function parseVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, '');
    if (h === 'player.vimeo.com' && u.pathname.startsWith('/video/')) {
      const id = u.pathname.slice(7).split('/')[0];
      return /^\d+$/.test(id) ? id : null;
    }
    if (h === 'vimeo.com' || h === 'm.vimeo.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      for (let i = parts.length - 1; i >= 0; i--) {
        if (/^\d+$/.test(parts[i]!)) return parts[i]!;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

const IMAGE_PATH = /\.(png|jpe?g|gif|webp|avif|bmp)(\?|#|$)/i;

/**
 * Heuristic: URL probably points at a raster/static image (good enough for `<img src>`).
 * Screenshots hosted on object storage or Imgur often match.
 */
export function isLikelyDirectImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (IMAGE_PATH.test(u.pathname)) return true;
    const h = u.hostname.replace(/^www\./, '');
    if (h === 'i.imgur.com' || h === 'i.redd.it' || h === 'pbs.twimg.com') return true;
    return false;
  } catch {
    return false;
  }
}

/** Truncate for secondary line under favicon preview. */
export function truncateShowcaseUrl(url: string, max = 56): string {
  const t = url.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
