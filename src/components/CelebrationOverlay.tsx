import Lottie from "lottie-react";
import { motion } from "framer-motion";
import celebrationData from "@/assets/celebration.json";

interface CelebrationOverlayProps {
  onComplete: () => void;
}

const CelebrationOverlay = ({ onComplete }: CelebrationOverlayProps) => {
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Lottie
        animationData={celebrationData}
        loop={false}
        onComplete={onComplete}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      />
    </motion.div>
  );
};

export default CelebrationOverlay;
