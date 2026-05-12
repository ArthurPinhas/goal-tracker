import { useEffect, useState } from "react";
import type { Goal } from "@/types/goal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appleEase } from "@/lib/motion";
import { getGoalShowcaseImageUrl } from "@/lib/goalShowcaseAsset";
import {
  isLikelyDirectImageUrl,
  parseYouTubeVideoId,
  showcaseFaviconSrc,
  youtubeShowcaseThumbnailSrc,
} from "@/lib/showcaseUrl";
import { ChevronDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const HERO_WINS_LS = "goal-tracker-hero-wins-expanded";

function HeroShowcaseTile({
  goal,
  onJump,
}: {
  goal: Goal;
  onJump: () => void;
}) {
  const uploaded = getGoalShowcaseImageUrl(goal);
  const url = goal.showcase_url?.trim() ?? "";
  const yt = !uploaded && url ? parseYouTubeVideoId(url) : null;
  const directImg = !uploaded && !yt && url && isLikelyDirectImageUrl(url);
  const fav = url ? showcaseFaviconSrc(url) : "";

  return (
    <button
      type="button"
      onClick={onJump}
      className={cn(
        "group shrink-0 w-[108px] sm:w-[118px] text-left rounded-lg overflow-hidden",
        "ring-1 ring-white/15 bg-white/10 backdrop-blur-sm transition hover:ring-amber-300/50 hover:bg-white/14",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      )}
    >
      <div className="h-[52px] sm:h-14 bg-black/35 relative">
        {uploaded ? (
          <img
            src={uploaded}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : yt ? (
          <img
            src={youtubeShowcaseThumbnailSrc(yt)}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : directImg ? (
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2">
            {fav ? (
              <img src={fav} alt="" className="h-8 w-8 rounded-md bg-white/10 ring-1 ring-white/10" loading="lazy" />
            ) : (
              <Sparkles className="h-6 w-6 text-amber-200/70" aria-hidden />
            )}
          </div>
        )}
      </div>
      <p className="px-2 py-1.5 text-[10px] font-medium leading-snug text-white/90 line-clamp-2 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
        {goal.emoji ? `${goal.emoji} ` : ""}
        {goal.title}
      </p>
    </button>
  );
}

export function HeroShowcaseStrip({
  spotlightGoals,
  showcaseCount,
  onJumpToGoal,
  onSeeAll,
  showGentleNudge,
  onViewDone,
}: {
  spotlightGoals: Goal[];
  showcaseCount: number;
  onJumpToGoal: (goalId: string) => void;
  onSeeAll: () => void;
  showGentleNudge: boolean;
  onViewDone: () => void;
}) {
  const [heroWinsOpen, setHeroWinsOpen] = useState(false);

  useEffect(() => {
    try {
      setHeroWinsOpen(localStorage.getItem(HERO_WINS_LS) === "1");
    } catch {
      setHeroWinsOpen(false);
    }
  }, []);

  const persistOpen = (next: boolean) => {
    setHeroWinsOpen(next);
    try {
      localStorage.setItem(HERO_WINS_LS, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  if (spotlightGoals.length === 0 && !showGentleNudge) return null;

  return (
    <div className="mt-4 pt-3 border-t border-white/[0.10]">
      {spotlightGoals.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="hero-wins-trigger"
              aria-expanded={heroWinsOpen}
              aria-controls="hero-wins-panel"
              onClick={() => persistOpen(!heroWinsOpen)}
              className={cn(
                "flex flex-1 min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-left",
                "text-white/70 hover:text-white/90 hover:bg-white/[0.06] transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              )}
            >
              <Sparkles className="h-4 w-4 text-amber-300/90 shrink-0" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] min-w-0 truncate">
                Wins on display
                <span className="text-white/45 font-medium normal-case tracking-normal ml-1.5">
                  · {showcaseCount} {showcaseCount === 1 ? "win" : "wins"}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-white/50 ml-auto transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  heroWinsOpen && "rotate-180"
                )}
                aria-hidden
              />
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-amber-200/95 hover:text-amber-100 hover:bg-white/10 shrink-0"
              onClick={onSeeAll}
            >
              See all
            </Button>
          </div>

          <div
            id="hero-wins-panel"
            role="region"
            aria-labelledby="hero-wins-trigger"
            className={cn(
              "grid min-h-0 transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              heroWinsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <motion.div
                initial={false}
                animate={
                  heroWinsOpen
                    ? { opacity: 1, y: 0, transition: { duration: 0.38, ease: appleEase } }
                    : { opacity: 0, y: -6, transition: { duration: 0.28, ease: appleEase } }
                }
                className="space-y-2 pt-0.5"
              >
                <motion.div
                  initial={false}
                  animate={heroWinsOpen ? "open" : "closed"}
                  variants={{
                    open: {
                      transition: { staggerChildren: 0.045, delayChildren: 0.05 },
                    },
                    closed: {
                      transition: { staggerChildren: 0.03, staggerDirection: -1 },
                    },
                  }}
                  className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scroll-pl-1 [scrollbar-width:thin]"
                >
                  {spotlightGoals.map((g) => (
                    <motion.div
                      key={g.id}
                      variants={{
                        open: { opacity: 1, y: 0, transition: { duration: 0.36, ease: appleEase } },
                        closed: { opacity: 0, y: 8, transition: { duration: 0.22 } },
                      }}
                      className="shrink-0"
                    >
                      <HeroShowcaseTile goal={g} onJump={() => onJumpToGoal(g.id)} />
                    </motion.div>
                  ))}
                </motion.div>
                <p className="text-[10px] text-white/38 leading-relaxed px-0.5">
                  Tiles jump to the goal card. Open the real link from the card.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 backdrop-blur-sm">
          <p className="text-sm text-white/65 leading-relaxed max-w-xl">
            Finished something big? Add an optional link (video, image, or site) so you can revisit the win. Use{" "}
            <span className="text-white/85 font-medium">Link your win</span> on any done goal — no full edit required.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 bg-white/15 text-white border-0 hover:bg-white/22"
            onClick={onViewDone}
          >
            View done goals
          </Button>
        </div>
      )}
    </div>
  );
}
