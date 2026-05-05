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
        <Label htmlFor={id} className="text-muted-foreground">
          Due date
        </Label>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => onChange(null)}>
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
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
            {value ? format(parseLocalDay(value), "PPP") : "No deadline"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="p-0 w-[min(100vw-2rem,21rem)]"
          collisionPadding={12}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Fixed footprint so month nav doesn't resize the trigger hit-area / stray-click out of dialog */}
          <div className="p-3 min-h-[324px] w-full box-border">
            <Calendar
              mode="single"
              className="w-full"
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
