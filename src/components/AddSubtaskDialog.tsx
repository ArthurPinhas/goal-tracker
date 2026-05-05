import { useState } from "react";
import { playPop } from "@/lib/sounds";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface AddSubtaskDialogProps {
  onAdd: (title: string, notes: string) => void;
}

const AddSubtaskDialog = ({ onAdd }: AddSubtaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    playPop();
    onAdd(title.trim(), notes.trim());
    setTitle("");
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-9 min-h-9 px-3 text-xs font-semibold rounded-full text-muted-foreground border border-border/40 bg-secondary/40 hover:bg-secondary hover:text-card-foreground hover:border-border/70 dark:bg-card/40 dark:hover:bg-card/60 transition-all duration-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">Add Subtask</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Add a step and optional notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <div className="space-y-2">
            <Label htmlFor="subtask-title" className="ui-section-label">
              Title
            </Label>
            <Input
              id="subtask-title"
              placeholder="e.g. Write unit tests"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="app-surface-input rounded-lg h-11 transition-shadow duration-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtask-notes" className="ui-section-label">
              Notes (optional)
            </Label>
            <Textarea
              id="subtask-notes"
              placeholder="Details, links, checklist…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-sm resize-y min-h-[64px] rounded-xl app-surface-input transition-shadow duration-300"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={!title.trim()} className="min-h-10 shadow-md shadow-primary/20">
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubtaskDialog;
