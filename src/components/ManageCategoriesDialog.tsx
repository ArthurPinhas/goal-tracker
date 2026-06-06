import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { editPenGhostButtonClass } from "@/lib/editAffordance";
import { FolderCog, Pencil, Trash2 } from "lucide-react";
import type { GoalCategory } from "@/types/goal";
import { getCategoryAccent } from "@/lib/categoryColor";

type ManageCategoriesDialogProps = {
  categories: GoalCategory[];
  goalCountForCategory: (categoryId: string) => number;
  onRename: (categoryId: string, name: string) => Promise<void>;
  onDelete: (categoryId: string) => Promise<void>;
  onCreate: (name: string) => Promise<string | null>;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ManageCategoriesDialog({
  categories,
  goalCountForCategory,
  onRename,
  onDelete,
  onCreate,
  disabled = false,
  open,
  onOpenChange,
}: ManageCategoriesDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const deleteTarget = deleteId ? categories.find((c) => c.id === deleteId) : null;
  const deleteCount = deleteId ? goalCountForCategory(deleteId) : 0;

  const startEdit = (c: GoalCategory) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const submitRename = async () => {
    if (!editingId) return;
    const t = editName.trim();
    if (!t) return;
    setSavingId(editingId);
    try {
      await onRename(editingId, t);
      cancelEdit();
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const submitCreate = async () => {
    const t = newName.trim();
    if (!t || creating) return;
    setCreating(true);
    try {
      await onCreate(t);
      setNewName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold tracking-tight">Categories</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Rename a category or delete it. Deleting removes the label from your goals; the goals stay in your list.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 pt-1 max-h-[min(60vh,360px)] overflow-y-auto">
            {categories.map((c) => {
              const n = goalCountForCategory(c.id);
              const editing = editingId === c.id;
              return (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  {editing ? (
                    <div className="flex flex-1 gap-2 min-w-0">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded-lg app-surface-input flex-1 min-w-0"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void submitRename();
                          }
                          if (e.key === "Escape") cancelEdit();
                        }}
                        aria-label="Category name"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0"
                        disabled={!editName.trim() || savingId === c.id}
                        onClick={() => void submitRename()}
                      >
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="shrink-0" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", getCategoryAccent(c.id).dot)} aria-hidden />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {n === 0 ? "No goals" : `${n} goal${n === 1 ? "" : "s"}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn("h-9 w-9", editPenGhostButtonClass)}
                          title="Rename"
                          onClick={() => startEdit(c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          title="Delete category"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="pt-2 border-t border-border/50 flex gap-2">
            <Input
              placeholder="New category…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-lg app-surface-input flex-1 min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitCreate();
                }
              }}
              aria-label="New category name"
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={!newName.trim() || creating}
              onClick={() => void submitCreate()}
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {deleteCount > 0 ? (
                <span>
                  This category is used by {deleteCount} goal{deleteCount === 1 ? "" : "s"}. Those goals will have no
                  category after you delete it.
                </span>
              ) : (
                <span>No goals use this category. It will be removed from the list.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
