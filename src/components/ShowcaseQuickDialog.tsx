import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Goal, GoalShowcaseFileOptions } from "@/types/goal";
import { normalizeShowcaseUrl } from "@/lib/showcaseUrl";
import { getGoalShowcaseImageUrl } from "@/lib/goalShowcaseAsset";
import { SHOWCASE_IMAGE_ACCEPT, validateShowcaseImageFile } from "@/lib/showcaseImageUpload";

interface ShowcaseQuickDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    showcaseUrl: string | null,
    showcaseCaption: string | null,
    showcaseFile?: GoalShowcaseFileOptions
  ) => void;
}

/**
 * Minimal dialog to add or edit showcase (link + optional screenshot) without full Edit Goal.
 */
export function ShowcaseQuickDialog({ goal, open, onOpenChange, onSave }: ShowcaseQuickDialogProps) {
  const [urlDraft, setUrlDraft] = useState(goal.showcase_url ?? "");
  const [captionDraft, setCaptionDraft] = useState(goal.showcase_caption ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrlDraft(goal.showcase_url ?? "");
      setCaptionDraft(goal.showcase_caption ?? "");
      setImageFile(null);
      setRemoveImage(false);
    }
  }, [open, goal.showcase_url, goal.showcase_caption]);

  useEffect(() => {
    if (!imageFile) {
      setImageObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(imageFile);
    setImageObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [imageFile]);

  const existingImageUrl = goal.showcase_image && !removeImage ? getGoalShowcaseImageUrl(goal) : null;
  const imagePreviewUrl = imageObjectUrl || existingImageUrl;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlDraft.trim();
    let url: string | null = null;
    if (trimmed) {
      const n = normalizeShowcaseUrl(trimmed);
      if (!n) {
        toast.error("Use a valid http or https link.");
        return;
      }
      url = n;
    }
    const cap = captionDraft.trim() || null;
    const showcaseFile: GoalShowcaseFileOptions | undefined =
      imageFile || removeImage
        ? { showcaseImageFile: imageFile ?? undefined, removeShowcaseImage: removeImage }
        : undefined;
    onSave(url, cap, showcaseFile);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">Link your win</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Optional — add a screenshot, a link (YouTube, site, image URL), or both.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="quick-showcase-caption">Short label</Label>
            <Input
              id="quick-showcase-caption"
              placeholder="e.g. Shipped v1"
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              maxLength={120}
              className="rounded-xl app-surface-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Screenshot
            </Label>
            <Input
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
                setImageFile(f);
                setRemoveImage(false);
              }}
            />
            <p className="text-[10px] text-muted-foreground">Max 5 MB · JPEG, PNG, WebP, GIF, AVIF</p>
            {imagePreviewUrl ? (
              <div className="rounded-xl overflow-hidden ring-1 ring-border/50 max-h-36 bg-muted/20">
                <img src={imagePreviewUrl} alt="" className="max-h-36 w-full object-contain object-center" />
              </div>
            ) : null}
            {(goal.showcase_image || imageFile) && !removeImage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground hover:text-destructive px-0"
                onClick={() => {
                  setImageFile(null);
                  setRemoveImage(true);
                }}
              >
                Remove photo
              </Button>
            ) : null}
            {removeImage && !imageFile ? (
              <p className="text-[11px] text-amber-600/90 dark:text-amber-400/80">Photo will be removed on save.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-showcase-url">Link</Label>
            <Input
              id="quick-showcase-url"
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              className="rounded-xl app-surface-input"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
