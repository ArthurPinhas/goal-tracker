import { cn } from "@/lib/utils";

/** Ghost icon button — edit pencil (sky accent), shared across goal/subtask/category editors. */
export const editPenGhostButtonClass =
  "rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-400/12 dark:text-muted-foreground/90 dark:hover:bg-sky-400/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Active state when the control switches to confirm (e.g. checkmark save). */
export const editPenActiveConfirmClass =
  "text-sky-400 hover:text-sky-300 hover:bg-sky-400/15 dark:hover:bg-sky-400/18 focus-visible:ring-sky-400/45";

export function editPenGhostButtonClasses(opts?: { active?: boolean }) {
  return cn(editPenGhostButtonClass, opts?.active && editPenActiveConfirmClass);
}
