import { Fragment } from "react";

export type LinkSegment = { type: "text"; text: string } | { type: "link"; href: string; label: string };

const URL_RE = /\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+/gi;

function stripTrailingPunct(raw: string): { core: string; tail: string } {
  let core = raw;
  while (core.length > 0 && /[.,;:!?]$/.test(core.slice(-1))) {
    core = core.slice(0, -1);
  }
  return { core, tail: raw.slice(core.length) };
}

/** Split plain text into text / link segments. Only http(s) hrefs (www. → https). */
export function parseLinkSegments(text: string): LinkSegment[] {
  if (!text) return [];
  const out: LinkSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ type: "text", text: text.slice(last, m.index) });
    }
    const full = m[0];
    const { core, tail } = stripTrailingPunct(full);
    const lower = core.toLowerCase();
    const isWww = lower.startsWith("www.");
    const isHttp = lower.startsWith("http://") || lower.startsWith("https://");
    if ((isHttp || isWww) && core.length >= (isWww ? 5 : 8)) {
      const href = isWww ? `https://${core}` : core;
      out.push({ type: "link", href, label: core });
    } else {
      out.push({ type: "text", text: full });
    }
    if (tail) out.push({ type: "text", text: tail });
    last = m.index + full.length;
  }
  if (last < text.length) {
    out.push({ type: "text", text: text.slice(last) });
  }
  return mergeAdjacentText(out);
}

function mergeAdjacentText(segments: LinkSegment[]): LinkSegment[] {
  const merged: LinkSegment[] = [];
  for (const seg of segments) {
    if (seg.type === "text" && seg.text === "") continue;
    const prev = merged[merged.length - 1];
    if (prev?.type === "text" && seg.type === "text") {
      prev.text += seg.text;
    } else {
      merged.push(seg.type === "text" ? { type: "text", text: seg.text } : { ...seg });
    }
  }
  return merged;
}

const linkClass =
  "text-primary underline underline-offset-2 hover:text-primary/90 break-all [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm";

type LinkifiedTextProps = {
  text: string;
  className?: string;
  /** Use span to nest inside buttons / truncated rows */
  as?: "span" | "p" | "div";
};

export function LinkifiedText({ text, className, as: Tag = "span" }: LinkifiedTextProps) {
  const segments = parseLinkSegments(text);
  return (
    <Tag className={className}>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <Fragment key={i}>{seg.text}</Fragment>
        ) : (
          <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {seg.label}
          </a>
        )
      )}
    </Tag>
  );
}
