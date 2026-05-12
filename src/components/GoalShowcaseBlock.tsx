import { useState } from "react";
import { ExternalLink, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isLikelyDirectImageUrl,
  parseYouTubeVideoId,
  parseVimeoId,
  showcaseFaviconSrc,
  showcaseHostLabel,
  truncateShowcaseUrl,
  youtubeShowcaseThumbnailSrc,
} from "@/lib/showcaseUrl";

interface GoalShowcaseBlockProps {
  /** External showcase link (may be null if only an uploaded image is used). */
  url: string | null;
  /** Resolved PocketBase file URL for an uploaded screenshot. */
  uploadedImageUrl?: string | null;
  caption: string | null;
  className?: string;
  onEditShowcase?: () => void;
}

function ShowcaseChrome({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/12 via-card to-violet-500/10",
        "dark:from-amber-500/10 dark:via-card/80 dark:to-violet-500/8",
        "p-4 shadow-sm shadow-amber-500/5",
        className
      )}
    >
      {children}
    </div>
  );
}

function ShowcaseHeader({
  caption,
  onEditShowcase,
}: {
  caption: string | null;
  onEditShowcase?: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400"
        aria-hidden
      >
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700/90 dark:text-amber-400/85">
            Your win, out there
          </p>
          {caption?.trim() ? (
            <p className="text-sm font-medium text-card-foreground leading-snug">{caption.trim()}</p>
          ) : null}
        </div>
        {onEditShowcase ? (
          <button
            type="button"
            onClick={onEditShowcase}
            className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-amber-700/90 hover:text-amber-600 dark:text-amber-400/90 dark:hover:text-amber-300 underline-offset-2 hover:underline"
          >
            Edit
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Keeps previews from spanning the full card width / height on large layouts. */
const previewWrapClass =
  "mt-3 w-full min-w-0 max-w-md mx-auto overflow-hidden rounded-xl ring-1 ring-border/40";

function UploadedShowcaseImage({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <p className="mt-3 text-xs text-muted-foreground max-w-md mx-auto">
        Couldn&apos;t load the uploaded image. Try re-uploading from Edit.
      </p>
    );
  }
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        previewWrapClass,
        "block bg-muted/30 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <img
        src={src}
        alt=""
        className="max-h-36 sm:max-h-40 w-full object-contain object-center"
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
      <span className="sr-only">Open uploaded image in new tab</span>
    </a>
  );
}

function YoutubePreview({ url, videoId }: { url: string; videoId: string }) {
  const thumb = youtubeShowcaseThumbnailSrc(videoId);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        previewWrapClass,
        "group relative block bg-black/30 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background aspect-video max-h-[11rem] sm:max-h-[12.5rem]"
      )}
    >
      <img
        src={thumb}
        alt=""
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
        <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-[2px] transition group-hover:scale-105">
          <Play className="h-6 w-6 fill-current pl-0.5" aria-hidden />
        </div>
      </div>
      <span className="sr-only">Open YouTube video in new tab</span>
    </a>
  );
}

function VimeoPreview({ videoId, url }: { videoId: string; url: string }) {
  return (
    <div className="mt-3 w-full min-w-0 max-w-md mx-auto space-y-2">
      <div className="overflow-hidden rounded-xl ring-1 ring-border/40 bg-black/20 h-40 sm:h-44 max-h-[12.5rem]">
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          className="h-full w-full min-h-0 border-0"
          title="Vimeo showcase preview"
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
      >
        Open on Vimeo
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    </div>
  );
}

function DirectImagePreview({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return <GenericLinkPreview url={url} />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        previewWrapClass,
        "block bg-muted/30 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <img
        src={url}
        alt=""
        className="max-h-36 sm:max-h-40 w-full object-contain object-center"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
      <span className="sr-only">Open image in new tab</span>
    </a>
  );
}

function GenericLinkPreview({ url }: { url: string }) {
  const host = showcaseHostLabel(url);
  const favicon = showcaseFaviconSrc(url);
  const line = truncateShowcaseUrl(url, 64);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-3 w-full max-w-md mx-auto flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-2.5",
        "transition hover:border-amber-500/35 hover:bg-card/80",
        "outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "min-w-0"
      )}
    >
      {favicon ? (
        <img
          src={favicon}
          alt=""
          className="h-11 w-11 shrink-0 rounded-lg bg-muted/40 ring-1 ring-border/30 object-cover"
          width={44}
          height={44}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-semibold text-card-foreground">
          {host ? `Open on ${host}` : "Open link"}
        </p>
        <p className="text-xs text-muted-foreground break-all leading-snug mt-0.5">{line}</p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </a>
  );
}

/**
 * Highlight block for showcase: optional uploaded image + optional external link previews.
 */
export function GoalShowcaseBlock({
  url,
  uploadedImageUrl,
  caption,
  className,
  onEditShowcase,
}: GoalShowcaseBlockProps) {
  const safeUrl = url?.trim() ?? "";
  const yt = safeUrl ? parseYouTubeVideoId(safeUrl) : null;
  const vimeoId = safeUrl && !yt ? parseVimeoId(safeUrl) : null;
  const imageLikely = safeUrl && !yt && !vimeoId && isLikelyDirectImageUrl(safeUrl);

  return (
    <ShowcaseChrome className={className}>
      <ShowcaseHeader caption={caption} onEditShowcase={onEditShowcase} />
      {uploadedImageUrl ? <UploadedShowcaseImage src={uploadedImageUrl} /> : null}
      {safeUrl ? (
        <>
          {yt ? <YoutubePreview url={safeUrl} videoId={yt} /> : null}
          {!yt && vimeoId ? <VimeoPreview videoId={vimeoId} url={safeUrl} /> : null}
          {!yt && !vimeoId && imageLikely ? <DirectImagePreview url={safeUrl} /> : null}
          {!yt && !vimeoId && !imageLikely ? <GenericLinkPreview url={safeUrl} /> : null}
        </>
      ) : null}
    </ShowcaseChrome>
  );
}
