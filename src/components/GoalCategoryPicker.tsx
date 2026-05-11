import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GoalCategory } from "@/types/goal";

const NONE = "__none__";

type GoalCategoryPickerProps = {
  categories: GoalCategory[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
  onCreateCategory: (name: string) => Promise<string | null>;
  /** Field id for label association */
  fieldId?: string;
};

export function GoalCategoryPicker({
  categories,
  value,
  onChange,
  onCreateCategory,
  fieldId = "goal-category",
}: GoalCategoryPickerProps) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const t = newName.trim();
    if (!t || creating) return;
    setCreating(true);
    const id = await onCreateCategory(t);
    setCreating(false);
    if (id) {
      onChange(id);
      setNewName("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={fieldId} className="ui-section-label">
          Category
        </Label>
        <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
          <SelectTrigger id={fieldId} className="rounded-xl app-surface-input w-full">
            <SelectValue placeholder="No category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No category</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="New category…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="rounded-lg app-surface-input flex-1 min-w-0"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreate();
            }
          }}
          aria-label="New category name"
        />
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          disabled={!newName.trim() || creating}
          onClick={() => void handleCreate()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
