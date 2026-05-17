import { useState, useEffect } from "react";
import toast from "react-hot-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import GoalDueDatePicker from "@/components/GoalDueDatePicker";
import GoalEmojiTitleSection from "@/components/GoalEmojiTitleSection";
import { GoalCategoryPicker } from "@/components/GoalCategoryPicker";
import { BookTemplate, Copy, Pencil } from "lucide-react";
import { saveTemplate } from "@/lib/goalTemplates";
import type { Goal, GoalCategory, GoalShowcaseFileOptions } from "@/types/goal";
import { isGoalComplete } from "@/lib/goalUtils";
import { normalizeShowcaseUrl } from "@/lib/showcaseUrl";
import { getGoalShowcaseImageUrl } from "@/lib/goalShowcaseAsset";
import {
  SHOWCASE_IMAGE_ACCEPT,
  validateShowcaseImageFile,
} from "@/lib/showcaseImageUpload";
import { cn } from "@/lib/utils";
import { editPenGhostButtonClass } from "@/lib/editAffordance";

interface EditGoalDialogProps {
  goal: Goal;
  categories: GoalCategory[];
  onCreateCategory: (name: string) => Promise<string | null>;
  /** When set, creating a new category from this dialog also saves it on this goal immediately. */
  onPatchGoalCategory?: (goalId: string, categoryId: string) => Promise<void>;
  onDuplicate?: (goalId: string) => void | Promise<void>;
  onEdit: (
    goalId: string,
    name: string,
    description: string,
    dueDate: string | null,
    emoji: string | null,
    notes: string,
    categoryId: string | null,
    showcaseUrl: string | null,
    showcaseCaption: string | null,
    showcaseFile?: GoalShowcaseFileOptions
  ) => void;
}

const EditGoalDialog = ({ goal, categories, onCreateCategory, onPatchGoalCategory, onDuplicate, onEdit }: EditGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [dueDate, setDueDate] = useState<string | null>(goal.due_date);
  const [emoji, setEmoji] = useState<string | null>(goal.emoji ?? null);
  const [notes, setNotes] = useState(goal.notes);
  const [categoryId, setCategoryId] = useState<string | null>(goal.category?.id ?? null);
  const [showcaseUrlDraft, setShowcaseUrlDraft] = useState(goal.showcase_url ?? "");
  const [showcaseCaptionDraft, setShowcaseCaptionDraft] = useState(goal.showcase_caption ?? "");
  const [showcaseImageFile, setShowcaseImageFile] = useState<File | null>(null);
  const [removeShowcaseImage, setRemoveShowcaseImage] = useState(false);
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!showcaseImageFile) {
      setImageObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(showcaseImageFile);
    setImageObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [showcaseImageFile]);

  const handleOpen = (val: boolean) => {
    if (val) {
      setTitle(goal.title);
      setDescription(goal.description);
      setDueDate(goal.due_date);
      setEmoji(goal.emoji ?? null);
      setNotes(goal.notes);
      setCategoryId(goal.category?.id ?? null);
      setShowcaseUrlDraft(goal.showcase_url ?? "");
      setShowcaseCaptionDraft(goal.showcase_caption ?? "");
      setShowcaseImageFile(null);
      setRemoveShowcaseImage(false);
    }
    setOpen(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const complete = isGoalComplete(goal);
    let showcaseUrl: string | null;
    let showcaseCaption: string | null;
    if (complete) {
      const trimmedUrl = showcaseUrlDraft.trim();
      if (trimmedUrl) {
        const normalized = normalizeShowcaseUrl(trimmedUrl);
        if (!normalized) {
          toast.error("Use a valid http or https link for your showcase.");
          return;
        }
        showcaseUrl = normalized;
      } else {
        showcaseUrl = null;
      }
      showcaseCaption = showcaseCaptionDraft.trim() || null;
    } else {
      showcaseUrl = goal.showcase_url;
      showcaseCaption = goal.showcase_caption;
    }
    const showcaseFile: GoalShowcaseFileOptions | undefined =
      isGoalComplete(goal) && (showcaseImageFile || removeShowcaseImage)
        ? {
            showcaseImageFile: showcaseImageFile ?? undefined,
            removeShowcaseImage,
          }
        : undefined;
    onEdit(
      goal.id,
      title.trim(),
      description.trim(),
      dueDate,
      emoji,
      notes.trim(),
      categoryId,
      showcaseUrl,
      showcaseCaption,
      showcaseFile
    );
    setOpen(false);
  };

  const existingImageUrl =
    isGoalComplete(goal) && goal.showcase_image && !removeShowcaseImage
      ? getGoalShowcaseImageUrl(goal)
      : null;
  const imagePreviewUrl = imageObjectUrl || existingImageUrl;

  const handleCreateCategory = async (name: string) => {
    const id = await onCreateCategory(name);
    if (id && onPatchGoalCategory) {
      await onPatchGoalCategory(goal.id, id);
    }
    return id;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 md:h-8 md:w-8 shrink-0 touch-manipulation",
            editPenGhostButtonClass,
          )}
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
          <GoalCategoryPicker
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            onCreateCategory={handleCreateCategory}
            fieldId="goal-category-edit"
          />
          {isGoalComplete(goal) && (
            <div
              className="space-y-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card/90 to-violet-500/8 px-3.5 py-3.5 dark:from-amber-500/8 dark:via-card/70"
            >
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700/90 dark:text-amber-400/85">
                  Your win, out there
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Optional — upload a screenshot, add a link (video, demo, site), or both.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-showcase-caption" className="sr-only">
                  Showcase label
                </Label>
                <Input
                  id="edit-showcase-caption"
                  placeholder="Short label (e.g. Open mic clip)"
                  value={showcaseCaptionDraft}
                  onChange={(e) => setShowcaseCaptionDraft(e.target.value)}
                  maxLength={120}
                  className="rounded-xl app-surface-input h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="ui-section-label">Screenshot</Label>
                <Input
                  id="edit-showcase-image"
                  type="file"
                  accept={SHOWCASE_IMAGE_ACCEPT}
                  className="cursor-pointer rounded-xl app-surface-input text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-xs file:font-medium"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    const err = validateShowcaseImageFile(f);
                    if (err) {
                      toast.error(err);
                      return;
                    }
                    setShowcaseImageFile(f);
                    setRemoveShowcaseImage(false);
                  }}
                />
                <p className="text-[10px] text-muted-foreground">JPEG, PNG, WebP, GIF, or AVIF · max 5 MB</p>
                {imagePreviewUrl ? (
                  <div className="relative rounded-xl overflow-hidden ring-1 ring-border/50 max-w-full max-h-36 bg-muted/20">
                    <img src={imagePreviewUrl} alt="" className="max-h-36 w-full object-contain object-center" />
                  </div>
                ) : null}
                {(goal.showcase_image || showcaseImageFile) && !removeShowcaseImage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setShowcaseImageFile(null);
                      setRemoveShowcaseImage(true);
                    }}
                  >
                    Remove photo
                  </Button>
                ) : null}
                {removeShowcaseImage && !showcaseImageFile ? (
                  <p className="text-[11px] text-amber-600/90 dark:text-amber-400/80">
                    Photo will be removed when you save.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-showcase-url" className="ui-section-label">
                  Link
                </Label>
                <Input
                  id="edit-showcase-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={showcaseUrlDraft}
                  onChange={(e) => setShowcaseUrlDraft(e.target.value)}
                  className="rounded-xl app-surface-input h-10 text-sm"
                />
              </div>
            </div>
          )}
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
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground min-h-11 md:min-h-9"
                onClick={() => {
                  saveTemplate({
                    name: title.trim() || goal.title,
                    description: description.trim(),
                    emoji: emoji,
                    notes: notes.trim(),
                    subtasks: goal.subtasks.map((s) => ({
                      title: s.title,
                      effort: s.effort ?? null,
                    })),
                  });
                  toast.success("Template saved");
                }}
              >
                <BookTemplate className="h-3.5 w-3.5" />
                Save as template
              </Button>
              {onDuplicate ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 touch-manipulation rounded-xl md:min-h-10 gap-2 border-border/70"
                  onClick={() => {
                    void onDuplicate(goal.id);
                    setOpen(false);
                  }}
                >
                  <Copy className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  Duplicate goal
                </Button>
              ) : null}
            </div>
            <Button type="submit" disabled={!title.trim()} className="min-h-11 touch-manipulation px-6 md:min-h-10 shadow-md shadow-primary/20">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGoalDialog;
