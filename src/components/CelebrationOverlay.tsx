import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { CelebrationQuality } from "@/hooks/useResponsiveUI";
import { cn } from "@/lib/utils";
import { premiumSpring, smoothOut, springContent } from "@/lib/motion";
import { CELEBRATION_SUBLINES, pickRandom } from "@/lib/motivationalCopy";

const CELEBRATION_HEADLINE = "Goal reached!";

interface CelebrationOverlayProps {
  quality: CelebrationQuality;
  onComplete: () => void;
}

function OrbitingSparkles({
  radiusPx,
  count,
  durationSec,
  reverse,
  className,
}: {
  radiusPx: number;
  count: number;
  durationSec: number;
  reverse?: boolean;
  className?: string;
}) {
  const angles = useMemo(() => Array.from({ length: count }, (_, i) => (360 / count) * i), [count]);

  return (
    <div
      aria-hidden
      className={cn(
        "celebration-orbit-css pointer-events-none absolute left-1/2 top-1/2 z-[1] flex h-0 w-0 items-center justify-center will-change-transform",
        className,
      )}
      style={{
        animation: `celebration-orbit-spin ${durationSec}s linear infinite`,
        animationDirection: reverse ? "reverse" : "normal",
      }}
    >
      {angles.map((deg, i) => (
        <span
          key={deg}
          className={cn(
            "absolute left-1/2 top-1/2 rounded-full",
            i % 3 === 0 && "h-2 w-2 bg-gold shadow-[0_0_12px_hsl(var(--gold)/0.75)]",
            i % 3 === 1 && "h-1.5 w-1.5 bg-mint shadow-[0_0_10px_hsl(var(--mint)/0.65)]",
            i % 3 === 2 && "h-1.5 w-1.5 bg-white/85 shadow-[0_0_8px_rgba(255,255,255,0.45)]",
          )}
          style={{
            transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-${radiusPx}px) rotate(${-deg}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function AuroraDiscs({ intense }: { intense: boolean }) {
  const slow = intense ? 24 : 32;
  const fast = intense ? 32 : 42;

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "celebration-orbit-css pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-full",
          intense ? "h-[min(68vw,300px)] w-[min(68vw,300px)] opacity-[0.26] blur-[26px]" : "h-[min(54vw,220px)] w-[min(54vw,220px)] opacity-[0.2] blur-[20px]",
        )}
        style={{
          background:
            "conic-gradient(from 0deg, hsl(var(--mint) / 0.65), hsl(var(--gold) / 0.55), hsl(var(--coral) / 0.45), hsl(var(--mint) / 0.65))",
          animation: `celebration-orbit-spin ${slow}s linear infinite`,
        }}
      />
      <div
        aria-hidden
        className={cn(
          "celebration-orbit-css pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-full",
          intense ? "h-[min(56vw,240px)] w-[min(56vw,240px)] opacity-[0.18] blur-[22px]" : "h-[min(44vw,180px)] w-[min(44vw,180px)] opacity-[0.14] blur-[18px]",
        )}
        style={{
          background:
            "conic-gradient(from 180deg, hsl(var(--gold) / 0.5), hsl(var(--mint) / 0.35), hsl(265 65% 62% / 0.22), hsl(var(--gold) / 0.5))",
          animation: `celebration-orbit-spin ${fast}s linear infinite reverse`,
        }}
      />
    </>
  );
}

/** Compact win moment — trophy only, for reduced-motion users */
function MinimalCelebration({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onComplete, 1900);
    return () => window.clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: smoothOut }}
    >
      <motion.div
        className="relative flex flex-col items-center justify-center rounded-[2rem] border border-mint/40 bg-card/90 px-12 py-10 shadow-neo-card backdrop-blur-md"
        layout={false}
        initial={{ scale: 0.88, opacity: 0.92 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springContent}
      >
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-mint/15 via-transparent to-gold/12 pointer-events-none" />
        <Trophy className="relative h-16 w-16 text-mint drop-shadow-[0_0_20px_hsl(var(--mint)/0.45)]" strokeWidth={1.2} />
      </motion.div>
    </motion.div>
  );
}

/** Lighter motion tier — orbit + soft aurora when motion is allowed */
function ReducedWinOverlay({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const subline = useMemo(() => pickRandom(CELEBRATION_SUBLINES), []);

  useEffect(() => {
    const t = window.setTimeout(onComplete, reduceMotion ? 1900 : 2100);
    return () => window.clearTimeout(t);
  }, [onComplete, reduceMotion]);

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: smoothOut }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex h-36 w-36 items-center justify-center overflow-visible">
          {!reduceMotion && <AuroraDiscs intense={false} />}
          <span className="celebration-win-ring absolute inset-0 rounded-full border-2 border-mint/50" style={{ animationDelay: "0ms" }} />
          <span className="celebration-win-ring absolute inset-0 rounded-full border-2 border-gold/35" style={{ animationDelay: "140ms" }} />
          {!reduceMotion && (
            <>
              <OrbitingSparkles radiusPx={52} count={6} durationSec={16} />
              <OrbitingSparkles radiusPx={38} count={5} durationSec={13} reverse className="opacity-90" />
            </>
          )}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={
              reduceMotion ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, y: [0, -3, 0] }
            }
            transition={
              reduceMotion
                ? springContent
                : {
                    scale: springContent,
                    opacity: springContent,
                    y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                  }
            }
          >
            <Trophy className="h-[4.5rem] w-[4.5rem] text-gold drop-shadow-[0_0_28px_hsl(var(--gold)/0.55)]" strokeWidth={1.15} />
          </motion.div>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center px-2">
          <p className="text-sm font-medium text-mint tracking-tight drop-shadow-md">{CELEBRATION_HEADLINE}</p>
          {!reduceMotion && (
            <p className="max-w-[16rem] text-xs font-medium leading-snug text-white/55">{subline}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Desktop “full” celebration — aurora + dual orbit fields + rings + trophy.
 * Transform/opacity only on animated layers (no canvas).
 */
function FullWinOverlay({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const subline = useMemo(() => pickRandom(CELEBRATION_SUBLINES), []);

  useEffect(() => {
    const t = window.setTimeout(onComplete, reduceMotion ? 2400 : 3200);
    return () => window.clearTimeout(t);
  }, [onComplete, reduceMotion]);

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: smoothOut }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-emerald-950/35" />
      <motion.div
        className="relative flex flex-col items-center gap-7"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springContent}
      >
        <div className="relative flex h-[min(42vw,220px)] w-[min(42vw,220px)] items-center justify-center overflow-visible">
          {!reduceMotion && <AuroraDiscs intense />}
          <span className="celebration-win-ring absolute inset-0 rounded-full border-[3px] border-mint/45" style={{ animationDelay: "0ms" }} />
          <span className="celebration-win-ring celebration-win-ring-slow absolute inset-0 rounded-full border-2 border-gold/35" style={{ animationDelay: "100ms" }} />
          <span className="celebration-win-ring absolute inset-0 rounded-full border border-white/25" style={{ animationDelay: "200ms" }} />
          <div className="absolute inset-[18%] rounded-full bg-gradient-to-b from-mint/25 to-transparent blur-xl" />

          {!reduceMotion && (
            <>
              <OrbitingSparkles radiusPx={88} count={11} durationSec={24} />
              <OrbitingSparkles radiusPx={64} count={8} durationSec={18} reverse className="opacity-95" />
            </>
          )}

          <motion.div
            className="relative z-10"
            initial={{ scale: 0.82, opacity: 0, rotate: -8 }}
            animate={
              reduceMotion
                ? { scale: 1, opacity: 1, rotate: 0 }
                : {
                    scale: 1,
                    opacity: 1,
                    rotate: 0,
                    y: [0, -5, 0],
                  }
            }
            transition={
              reduceMotion
                ? springContent
                : {
                    scale: springContent,
                    opacity: springContent,
                    rotate: { ...premiumSpring, delay: 0.06 },
                    y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.35 },
                  }
            }
          >
            <Trophy
              className="h-[min(22vw,7.5rem)] w-[min(22vw,7.5rem)] text-gold drop-shadow-[0_0_36px_hsl(var(--mint)/0.65)]"
              strokeWidth={1.1}
            />
          </motion.div>
        </div>
          <div className="flex flex-col items-center gap-2 text-center px-3">
            <motion.p
              className="max-w-sm text-base font-semibold tracking-tight text-white/95 [text-shadow:0_2px_24px_rgba(0,0,0,0.5)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15, ease: smoothOut }}
            >
              {CELEBRATION_HEADLINE}
            </motion.p>
            {!reduceMotion && (
              <motion.p
                className="max-w-md text-sm font-medium leading-relaxed text-white/60 [text-shadow:0_1px_16px_rgba(0,0,0,0.45)]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28, ease: smoothOut }}
              >
                {subline}
              </motion.p>
            )}
          </div>
      </motion.div>
    </motion.div>
  );
}

const CelebrationOverlay = ({ quality, onComplete }: CelebrationOverlayProps) => {
  if (quality === "minimal") {
    return <MinimalCelebration onComplete={onComplete} />;
  }
  if (quality === "reduced") {
    return <ReducedWinOverlay onComplete={onComplete} />;
  }
  return <FullWinOverlay onComplete={onComplete} />;
};

export default CelebrationOverlay;
