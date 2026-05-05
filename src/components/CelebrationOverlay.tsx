import Lottie from "lottie-react";
import { motion } from "framer-motion";
import celebrationData from "@/assets/celebration.json";
import { smoothOut, springContent } from "@/lib/motion";

interface CelebrationOverlayProps {
  onComplete: () => void;
}

const CelebrationOverlay = ({ onComplete }: CelebrationOverlayProps) => {
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: smoothOut }}
    >
      <motion.div
        className="relative h-full w-full max-h-[min(85vh,580px)] max-w-[min(100vw-2rem,720px)]"
        initial={{ scale: 0.9, opacity: 0.85 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springContent}
      >
        <Lottie
          animationData={celebrationData}
          loop={false}
          onComplete={onComplete}
          className="absolute inset-0 size-full"
          style={{ width: "100%", height: "100%" }}
        />
      </motion.div>
    </motion.div>
  );
};

export default CelebrationOverlay;
