import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import GoalDueDatePicker from "@/components/GoalDueDatePicker";
import GoalEmojiTitleSection from "@/components/GoalEmojiTitleSection";
import { Pencil } from "lucide-react";
import { Goal } from "@/types/goal";

interface EditGoalDialogProps {
  goal: Goal;
  onEdit: (
    goalId: string,
    name: string,
    description: string,
    dueDate: string | null,
    emoji: string | null,
    notes: string
  ) => void;
}

const EditGoalDialog = ({ goal, onEdit }: EditGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [dueDate, setDueDate] = useState<string | null>(goal.due_date);
  const [emoji, setEmoji] = useState<string | null>(goal.emoji ?? null);
  const [notes, setNotes] = useState(goal.notes);

  const handleOpen = (val: boolean) => {
    if (val) {
      setTitle(goal.title);
      setDescription(goal.description);
      setDueDate(goal.due_date);
      setEmoji(goal.emoji ?? null);
      setNotes(goal.notes);
    }
    setOpen(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onEdit(goal.id, title.trim(), description.trim(), dueDate, emoji, notes.trim());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 dark:hover:bg-muted/40 dark:text-muted-foreground/90"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">Edit Goal</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Update title, dates, and notes. Changes save to your account only.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <GoalEmojiTitleSection
            open={open}
            mode="edit"
            title={title}
            onTitleChange={setTitle}
            initialEmoji={goal.emoji ?? null}
            onEmojiChange={setEmoji}
            titleInputId="edit-title"
            titleLabel="Title"
          />
          <div className="space-y-2">
            <Label htmlFor="edit-desc" className="ui-section-label">
              Description
            </Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-xl app-surface-input resize-y min-h-[80px] transition-shadow duration-300"
            />
          </div>
          <GoalDueDatePicker id="edit-due" value={dueDate} onChange={setDueDate} />
          <div className="space-y-2">
            <Label htmlFor="edit-notes" className="ui-section-label">
              Notes
            </Label>
            <Textarea
              id="edit-notes"
              placeholder="Private notes for this goal…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-y min-h-[72px] rounded-xl app-surface-input transition-shadow duration-300"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={!title.trim()} className="min-h-10 shadow-md shadow-primary/20">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGoalDialog;
