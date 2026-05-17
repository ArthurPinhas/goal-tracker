import { useState } from "react";
import { BookTemplate, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { GoalTemplate, listTemplates, deleteTemplate } from "@/lib/goalTemplates";

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (template: GoalTemplate) => void;
}

export function TemplatesDialog({ open, onOpenChange, onApply }: TemplatesDialogProps) {
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);

  const refresh = () => setTemplates(listTemplates());

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) refresh();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">Goal templates</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Apply a saved template to pre-fill the goal form.
          </DialogDescription>
        </DialogHeader>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <BookTemplate className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.2} />
            <p className="text-sm text-muted-foreground">No templates saved yet.</p>
            <p className="text-xs text-muted-foreground/70">
              Save a template from the Edit Goal dialog.
            </p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-[360px] overflow-y-auto py-1 pr-1">
            {templates.map((t) => (
              <li
                key={t.id}
                className="group flex items-start gap-2 rounded-xl border border-border/50 bg-card/60 px-3.5 py-3 hover:border-border/80 hover:bg-card/90 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {t.emoji && (
                      <span className="text-base leading-none shrink-0">{t.emoji}</span>
                    )}
                    <span className="font-medium text-sm truncate">{t.name}</span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>
                  )}
                  {t.subtasks.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {t.subtasks.length} subtask{t.subtasks.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      onApply(t);
                      onOpenChange(false);
                    }}
                  >
                    Apply
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/40 hover:text-destructive transition-colors md:opacity-0 md:group-hover:opacity-100 md:transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete template?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{t.name}&rdquo; will be permanently removed from your saved templates.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => handleDelete(t.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
