import { motion } from "framer-motion";

const ORBS = [
  { w: 280, h: 200, left: "-10%", top: "58%", color: "#34d399", opacity: 0.07, dur: 18, delay: 0 },
  { w: 240, h: 190, left: "78%", top: "10%", color: "#a78bfa", opacity: 0.055, dur: 22, delay: 2 },
  { w: 200, h: 160, left: "40%", top: "82%", color: "#60a5fa", opacity: 0.045, dur: 20, delay: 5 },
];

/** Shared soft orbs behind login / register for parity with the main goals page. */
export function AuthAmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.w,
            height: orb.h,
            left: orb.left,
            top: orb.top,
            backgroundColor: orb.color,
            opacity: orb.opacity,
            filter: "blur(72px)",
          }}
          animate={{ y: [0, -16, 10, -12, 0], x: [0, 10, -8, 12, 0] }}
          transition={{ duration: orb.dur, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
