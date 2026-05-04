import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, ChevronDown, RotateCcw, Trash2, CheckSquare } from 'lucide-react';
import { Goal } from '@/types/goal';
import { calcProgress } from '@/lib/goalUtils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ArchiveSectionProps {
  archivedGoals: Goal[];
  archivedLoading: boolean;
  onOpen: () => void;
  onRestore: (goalId: string) => void;
  onDelete: (goalId: string) => void;
}

const ArchiveSection = ({ archivedGoals, archivedLoading, onOpen, onRestore, onDelete }: ArchiveSectionProps) => {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleToggle = () => {
    if (!open && !loaded) {
      onOpen();
      setLoaded(true);
    }
    setOpen((v) => !v);
  };

  return (
    <div className="mt-8">
      <button
        onClick={handleToggle}
        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors w-full group"
      >
        <div className="h-px flex-1 bg-border group-hover:bg-border/80" />
        <div className="flex items-center gap-1.5 shrink-0">
          <Archive className="h-3.5 w-3.5" />
          <span>Archive</span>
          {loaded && archivedGoals.length > 0 && (
            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-full tabular-nums">{archivedGoals.length}</span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
        <div className="h-px flex-1 bg-border group-hover:bg-border/80" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-3 space-y-2">
              {archivedLoading && (
                <p className="text-center text-muted-foreground text-sm py-8">Loading archive…</p>
              )}
              {!archivedLoading && archivedGoals.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8 italic">Archive is empty.</p>
              )}
              {!archivedLoading && archivedGoals.map((goal) => {
                const pct = calcProgress(goal);
                const done = goal.subtasks.filter((s) => s.is_completed).length;
                return (
                  <div
                    key={goal.id}
                    className="rounded-xl border bg-card/50 px-4 py-3 flex items-start gap-3 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Archive className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{goal.title}</p>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <CheckSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {done}/{goal.subtasks.length} subtasks · {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => onRestore(goal.id)}
                        title="Restore to active"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{goal.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Permanently deletes from archive. Cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(goal.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArchiveSection;
