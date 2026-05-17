import { useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Target, Archive, Plus, Sun, Moon, Download, Filter, Trophy, ListChecks } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Goal } from "@/types/goal";
import { isGoalComplete } from "@/lib/goalUtils";

type Filter = "all" | "active" | "done" | "showcase" | "archived";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  setFilter: (f: Filter) => void;
  setAddGoalOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  onJumpToGoal?: (goalId: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  goals,
  setFilter,
  setAddGoalOpen,
  setExportOpen,
  onJumpToGoal,
}: CommandPaletteProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const run = useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      requestAnimationFrame(fn);
    },
    [onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search goals or run a command…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => setAddGoalOpen(true))}>
            <Plus className="mr-2 h-4 w-4" />
            New goal
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setExportOpen(true))}>
            <Download className="mr-2 h-4 w-4" />
            Export goals
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
            }
          >
            {resolvedTheme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle theme
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Filter shortcuts */}
        <CommandGroup heading="Filter view">
          <CommandItem onSelect={() => run(() => setFilter("all"))}>
            <ListChecks className="mr-2 h-4 w-4" />
            Show all goals
          </CommandItem>
          <CommandItem onSelect={() => run(() => setFilter("active"))}>
            <Target className="mr-2 h-4 w-4" />
            Show active goals
          </CommandItem>
          <CommandItem onSelect={() => run(() => setFilter("done"))}>
            <Trophy className="mr-2 h-4 w-4" />
            Show completed goals
          </CommandItem>
          <CommandItem onSelect={() => run(() => setFilter("archived"))}>
            <Archive className="mr-2 h-4 w-4" />
            Show archived goals
          </CommandItem>
          <CommandItem onSelect={() => run(() => setFilter("showcase"))}>
            <Filter className="mr-2 h-4 w-4" />
            Show on-display goals
          </CommandItem>
        </CommandGroup>

        {/* Goal search */}
        {goals.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Jump to goal">
              {goals.slice(0, 12).map((g) => {
                const done = isGoalComplete(g);
                return (
                  <CommandItem
                    key={g.id}
                    value={`${g.title} ${g.description ?? ""}`}
                    onSelect={() =>
                      run(() => {
                        if (!done) setFilter("all");
                        else setFilter("done");
                        requestAnimationFrame(() => {
                          document
                            .getElementById(`goal-card-${g.id}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "center" });
                        });
                        onJumpToGoal?.(g.id);
                      })
                    }
                  >
                    <span className="mr-2 shrink-0 text-base leading-none">
                      {g.emoji ?? (done ? "✅" : "🎯")}
                    </span>
                    <span className="truncate">{g.title}</span>
                    {done && (
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">done</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
