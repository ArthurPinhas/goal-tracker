import { useEffect, useRef } from "react";
import Lottie from "lottie-react";
import type { LottieRefCurrentProps } from "lottie-react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { CelebrationQuality } from "@/hooks/useResponsiveUI";
import celebrationData from "@/assets/celebration.json";
import { smoothOut, springContent } from "@/lib/motion";

interface CelebrationOverlayProps {
  quality: CelebrationQuality;
  onComplete: () => void;
}

/** System “reduce motion” — big win with zero Lottie / canvas cost */
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
        className="relative flex flex-col items-center justify-center rounded-[2rem] border border-amber-400/45 bg-card/90 px-12 py-10 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65)] backdrop-blur-md"
        layout={false}
        initial={{ scale: 0.88, opacity: 0.92 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springContent}
      >
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-amber-400/15 via-transparent to-violet-500/10 pointer-events-none" />
        <Trophy className="relative h-16 w-16 text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.45)]" strokeWidth={1.2} />
      </motion.div>
    </motion.div>
  );
}

const CelebrationOverlay = ({ quality, onComplete }: CelebrationOverlayProps) => {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const speed = 1.06;

  if (quality !== "full") {
    return <MinimalCelebration onComplete={onComplete} />;
  }

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4 [contain:strict] isolate"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.26, ease: smoothOut }}
    >
      <motion.div
        className="relative h-full w-full max-h-[min(85vh,580px)] max-w-[min(100vw-2rem,720px)] will-change-transform"
        layout={false}
        initial={{ scale: 0.92, opacity: 0.9 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springContent}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={celebrationData}
          loop={false}
          renderer="canvas"
          className="absolute inset-0 size-full"
          onComplete={onComplete}
          onDOMLoaded={() => {
            lottieRef.current?.setSpeed(speed);
          }}
          rendererSettings={{
            preserveAspectRatio: "xMidYMid meet",
            clearCanvas: true,
            progressiveLoad: false,
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default CelebrationOverlay;
