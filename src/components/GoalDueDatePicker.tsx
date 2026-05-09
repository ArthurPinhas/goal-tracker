import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseLocalDay, toLocalDayString } from "@/lib/dueDateUtils";

interface GoalDueDatePickerProps {
  id?: string;
  value: string | null;
  onChange: (next: string | null) => void;
}

const GoalDueDatePicker = ({ id, value, onChange }: GoalDueDatePickerProps) => {
  const [open, setOpen] = useState(false);
  const selected = value ? parseLocalDay(value) : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="ui-section-label">
          Due date
        </Label>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="min-h-9 touch-manipulation px-2 text-xs text-muted-foreground md:h-7" onClick={() => onChange(null)}>
            Clear
          </Button>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full h-11 justify-start text-left font-normal rounded-lg transition-all duration-300 app-surface-input border-border/70 hover:bg-card/80",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
            {value ? format(parseLocalDay(value), "PPP") : "No deadline"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="p-0 w-[min(100vw-2rem,21rem)] overflow-hidden dark:border-border/55 dark:bg-popover dark:shadow-xl dark:shadow-black/40 sm:rounded-xl"
          collisionPadding={12}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Fixed height: 4- vs 6-week months no longer shrink/grow the popover */}
          <div className="h-[23rem] min-h-[23rem] w-full max-w-full box-border p-3 flex flex-col items-stretch justify-start overflow-hidden shrink-0">
            <Calendar
              mode="single"
              className="w-full max-w-full p-0 m-0 [&_.rdp]:w-full"
              classNames={{
                month: "w-full space-y-4 flex flex-col min-h-0",
                table:
                  "w-full max-w-full border-collapse space-y-1 min-h-[220px] [&_tbody]:align-top",
              }}
              selected={selected}
              onSelect={(d) => {
                onChange(d ? toLocalDayString(d) : null);
                setOpen(false);
              }}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GoalDueDatePicker;
