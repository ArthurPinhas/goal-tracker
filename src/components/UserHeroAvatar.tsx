import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { springContent } from "@/lib/motion";

type UserHeroAvatarProps = {
  src: string;
  /** Used for image `alt` and fallback initial */
  displayName: string;
};

/** Gradient ring + soft glow — only rendered when PocketBase has an `avatar` file */
export function UserHeroAvatar({ src, displayName }: UserHeroAvatarProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ ...springContent, delay: 0.04 }}
      className="relative shrink-0"
    >
      <div
        className="pointer-events-none absolute -inset-1.5 rounded-full bg-[conic-gradient(from_140deg,theme(colors.emerald.400),theme(colors.amber.300),theme(colors.violet.400),theme(colors.sky.400),theme(colors.emerald.400))] opacity-90"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-br from-white/[0.2] to-transparent"
        aria-hidden
      />
      <Avatar className="relative h-[3.75rem] w-[3.75rem] sm:h-[4.5rem] sm:w-[4.5rem] ring-2 ring-white/40 shadow-[0_14px_44px_-10px_rgba(0,0,0,0.55)]">
        <AvatarImage src={src} alt={`${displayName} profile`} className="object-cover" />
        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-emerald-600 text-lg font-semibold text-white">
          {initial}
        </AvatarFallback>
      </Avatar>
    </motion.div>
  );
}
