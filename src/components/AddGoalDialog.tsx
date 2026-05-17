import { useState, useEffect, useRef } from "react";
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
import { BookTemplate } from "lucide-react";
import GoalDueDatePicker from "@/components/GoalDueDatePicker";
import GoalEmojiTitleSection from "@/components/GoalEmojiTitleSection";
import { GoalCategoryPicker } from "@/components/GoalCategoryPicker";
import { NewGoalHoverBloom } from "@/components/NewGoalHoverBloom";
import { TemplatesDialog } from "@/components/TemplatesDialog";
import { cn } from "@/lib/utils";
import type { GoalCategory } from "@/types/goal";
import type { GoalTemplate } from "@/lib/goalTemplates";

interface AddGoalDialogProps {
  onAdd: (
    title: string,
    description: string,
    dueDate: string | null,
    emoji: string | null,
    notes: string,
    categoryId: string | null
  ) => void;
  categories: GoalCategory[];
  onCreateCategory: (name: string) => Promise<string | null>;
  triggerClassName?: string;
  /** In sticky / tight toolbars: show icon only below `md` to avoid overflow */
  compactTriggerBelowMd?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Pre-select this category when the dialog opens (e.g. match the category filter). */
  initialCategoryId?: string | null;
}

const AddGoalDialog = ({
  onAdd,
  categories,
  onCreateCategory,
  triggerClassName,
  compactTriggerBelowMd,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialCategoryId = null,
}: AddGoalDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const prevOpen = useRef(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [triggerBloom, setTriggerBloom] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setCategoryId(initialCategoryId ?? null);
    }
    prevOpen.current = open;
  }, [open, initialCategoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    playPop();
    onAdd(title.trim(), description.trim(), dueDate, emoji, notes.trim(), categoryId);
    setTitle("");
    setDescription("");
    setDueDate(null);
    setEmoji(null);
    setNotes("");
    setCategoryId(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          title="New goal"
          onMouseEnter={() => setTriggerBloom(true)}
          onMouseLeave={() => setTriggerBloom(false)}
          onFocus={() => setTriggerBloom(true)}
          onBlur={() => setTriggerBloom(false)}
          className={cn(
            "gap-2 min-h-11 touch-manipulation px-4 md:min-h-10 shadow-md shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 dark:shadow-primary/20 overflow-hidden rounded-md",
            compactTriggerBelowMd && "max-md:px-3 max-md:min-w-11",
            triggerClassName
          )}
        >
          <NewGoalHoverBloom active={triggerBloom} compact={!!compactTriggerBelowMd} className="text-current opacity-95" />
          <span className={cn(compactTriggerBelowMd && "max-md:sr-only")}>New Goal</span>
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
          <GoalCategoryPicker
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            onCreateCategory={onCreateCategory}
            fieldId="goal-category-new"
          />
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
          <div className="flex items-center justify-between pt-1 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setTemplatesOpen(true)}
            >
              <BookTemplate className="h-3.5 w-3.5" />
              From template
            </Button>
            <Button type="submit" disabled={!title.trim()} className="min-h-11 touch-manipulation px-6 md:min-h-10 shadow-md shadow-primary/20">
              Create
            </Button>
          </div>
        </form>
        <TemplatesDialog
          open={templatesOpen}
          onOpenChange={setTemplatesOpen}
          onApply={(t: GoalTemplate) => {
            setTitle(t.name);
            setDescription(t.description);
            setEmoji(t.emoji);
            setNotes(t.notes);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddGoalDialog;
