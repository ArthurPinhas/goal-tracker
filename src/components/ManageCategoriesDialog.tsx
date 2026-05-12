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
import { FolderCog, Pencil, Trash2 } from "lucide-react";
import type { GoalCategory } from "@/types/goal";

type ManageCategoriesDialogProps = {
  categories: GoalCategory[];
  goalCountForCategory: (categoryId: string) => number;
  onRename: (categoryId: string, name: string) => Promise<void>;
  onDelete: (categoryId: string) => Promise<void>;
  disabled?: boolean;
};

export function ManageCategoriesDialog({
  categories,
  goalCountForCategory,
  onRename,
  onDelete,
  disabled = false,
}: ManageCategoriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || categories.length === 0}
            className="shrink-0 max-md:min-h-11 h-11 md:h-9 rounded-lg gap-1.5 border-border/60"
            title="Rename or remove categories"
          >
            <FolderCog className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Manage</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold tracking-tight">Categories</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Rename a folder or delete it. Deleting removes the folder from your goals; goals stay in your list.
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
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {n === 0 ? "No goals" : `${n} goal${n === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground"
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {deleteCount > 0 ? (
                <span>
                  This folder is used by {deleteCount} goal{deleteCount === 1 ? "" : "s"}. Those goals will have no
                  category after you delete it.
                </span>
              ) : (
                <span>No goals use this folder. It will be removed from the list.</span>
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
