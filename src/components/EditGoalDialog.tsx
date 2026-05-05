import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import GoalDueDatePicker from "@/components/GoalDueDatePicker";
import { Pencil } from "lucide-react";
import { Goal } from "@/types/goal";

interface EditGoalDialogProps {
  goal: Goal;
  onEdit: (goalId: string, name: string, description: string, dueDate: string | null) => void;
}

const EditGoalDialog = ({ goal, onEdit }: EditGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [dueDate, setDueDate] = useState<string | null>(goal.due_date);

  const handleOpen = (val: boolean) => {
    if (val) {
      setTitle(goal.title);
      setDescription(goal.description);
      setDueDate(goal.due_date);
    }
    setOpen(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onEdit(goal.id, title.trim(), description.trim(), dueDate);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <GoalDueDatePicker id="edit-due" value={dueDate} onChange={setDueDate} />
          <div className="flex justify-end">
            <Button type="submit" disabled={!title.trim()}>Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGoalDialog;
