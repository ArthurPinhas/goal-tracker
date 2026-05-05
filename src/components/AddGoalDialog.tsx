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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import GoalDueDatePicker from "@/components/GoalDueDatePicker";
import GoalEmojiTitleSection from "@/components/GoalEmojiTitleSection";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddGoalDialogProps {
  onAdd: (
    title: string,
    description: string,
    dueDate: string | null,
    emoji: string | null,
    notes: string
  ) => void;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddGoalDialog = ({ onAdd, triggerClassName, open: controlledOpen, onOpenChange: controlledOnOpenChange }: AddGoalDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    playPop();
    onAdd(title.trim(), description.trim(), dueDate, emoji, notes.trim());
    setTitle("");
    setDescription("");
    setDueDate(null);
    setEmoji(null);
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "gap-2 min-h-10 shadow-md shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 dark:shadow-primary/20",
            triggerClassName
          )}
        >
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">Create Goal</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Set a title and optional description, due date, and private notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <GoalEmojiTitleSection
            open={open}
            mode="create"
            title={title}
            onTitleChange={setTitle}
            initialEmoji={null}
            onEmojiChange={setEmoji}
            titleInputId="goal-title"
            titleLabel="Title"
            placeholder="e.g. Learn this guitar song"
          />
          <div className="space-y-2">
            <Label htmlFor="goal-desc" className="ui-section-label">
              Description
            </Label>
            <Textarea
              id="goal-desc"
              placeholder="Brief description of this goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-xl app-surface-input resize-y min-h-[80px] transition-shadow duration-300"
            />
          </div>
          <GoalDueDatePicker id="goal-due" value={dueDate} onChange={setDueDate} />
          <div className="space-y-2">
            <Label htmlFor="goal-notes" className="ui-section-label">
              Notes
            </Label>
            <Textarea
              id="goal-notes"
              placeholder="Private notes, links, reminders…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-y min-h-[72px] rounded-xl app-surface-input transition-shadow duration-300"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={!title.trim()} className="min-h-10 shadow-md shadow-primary/20">
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGoalDialog;
