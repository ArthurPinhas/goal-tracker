import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Target, LogOut, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddGoalDialog from "./AddGoalDialog";
import ThemeToggle from "./ThemeToggle";

interface StickyHeaderProps {
  soundOn: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
  onAdd: (
    title: string,
    description: string,
    dueDate: string | null,
    emoji: string | null,
    notes: string
  ) => void;
  addGoalOpen?: boolean;
  onAddGoalOpenChange?: (open: boolean) => void;
  dueNotificationsSlot?: ReactNode;
}

const StickyHeader = ({
  soundOn,
  onToggleSound,
  onLogout,
  onAdd,
  addGoalOpen,
  onAddGoalOpenChange,
  dueNotificationsSlot,
}: StickyHeaderProps) => (
  <motion.div
    initial={{ y: -56, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: -56, opacity: 0 }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
    className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl dark:bg-background/72 dark:border-border/40 dark:shadow-lg dark:shadow-black/30"
  >
    <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold tracking-tight">Goal Tracker</span>
      </div>
      <div className="flex items-center gap-1">
        <AddGoalDialog onAdd={onAdd} open={addGoalOpen} onOpenChange={onAddGoalOpenChange} />
        {dueNotificationsSlot}
        <ThemeToggle className="h-8 w-8" />
        <Button variant="ghost" size="icon" onClick={onToggleSound} title={soundOn ? 'Mute' : 'Unmute'}
          className="h-8 w-8 text-muted-foreground hover:text-foreground">
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onLogout} title="Log out"
          className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </motion.div>
);

export default StickyHeader;
