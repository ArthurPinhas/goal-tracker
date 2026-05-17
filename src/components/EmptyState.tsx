import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { springContent, appleSpringGentle } from "@/lib/motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  compact?: boolean;
  children?: React.ReactNode;
  /** Optional custom SVG illustration — replaces the icon when provided */
  illustrationSlot?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, compact = false, children, illustrationSlot }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springContent}
      className={`flex flex-col items-center justify-center px-4 text-center ${compact ? "py-12" : "py-16"}`}
    >
      <div className={`relative ${compact ? "mb-5" : "mb-7"}`}>
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/35 via-violet-500/25 to-fuchsia-500/15 blur-3xl scale-[1.75]"
          aria-hidden
        />
        <div
          className={`relative rounded-2xl border border-border/60 bg-gradient-to-br from-card/95 to-card/55 backdrop-blur-md shadow-xl ring-1 ring-border/30 dark:shadow-2xl dark:shadow-black/40 ${
            compact ? "p-4" : "p-6"
          }`}
        >
          {illustrationSlot ?? (
            <Icon className={compact ? "h-10 w-10 text-primary/85" : "h-14 w-14 text-primary/85"} strokeWidth={1.15} />
          )}
        </div>
      </div>
      <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
        {title}
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm mt-2.5 leading-relaxed">{description}</p>
      {children ? <div className="mt-7 w-full flex justify-center [&_a]:inline-flex [&_a]:items-center">{children}</div> : null}
    </motion.div>
  );
}

/** Animated target SVG for the primary "no goals yet" empty state */
export function GoalTrackerIllustration() {
  return (
    <motion.svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={appleSpringGentle}
    >
      {/* Outer ring */}
      <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" strokeDasharray="4 3" />
      {/* Middle ring */}
      <circle cx="28" cy="28" r="16" stroke="currentColor" strokeWidth="1.75" className="text-primary/65" />
      {/* Inner ring */}
      <circle cx="28" cy="28" r="8" stroke="currentColor" strokeWidth="2" className="text-primary/85" />
      {/* Bullseye dot */}
      <circle cx="28" cy="28" r="3" fill="currentColor" className="text-primary" />
      {/* Arrow shaft */}
      <line x1="36" y1="20" x2="30.5" y2="25.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary" />
      {/* Arrow head */}
      <polyline points="33,20 36,20 36,23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
      {/* Sparkle top-left */}
      <motion.g
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        style={{ originX: "10px", originY: "10px" }}
      >
        <path d="M10 10 L10.7 8 L11.4 10 L13.4 10.7 L11.4 11.4 L10.7 13.4 L10 11.4 L8 10.7 Z" fill="currentColor" className="text-primary/70" />
      </motion.g>
      {/* Sparkle bottom-right */}
      <motion.g
        animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.85, 1.05, 0.85] }}
        transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
        style={{ originX: "46px", originY: "46px" }}
      >
        <path d="M46 46 L46.5 44.5 L47 46 L48.5 46.5 L47 47 L46.5 48.5 L46 47 L44.5 46.5 Z" fill="currentColor" className="text-violet-400/60" />
      </motion.g>
    </motion.svg>
  );
}
