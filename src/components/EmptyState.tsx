import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { springContent } from "@/lib/motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  compact?: boolean;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, compact = false, children }: EmptyStateProps) {
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
          <Icon className={compact ? "h-10 w-10 text-primary/85" : "h-14 w-14 text-primary/85"} strokeWidth={1.15} />
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
