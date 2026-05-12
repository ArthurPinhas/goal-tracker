import { useEffect, useState, useRef } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BellRippleGlyph } from "@/components/micro/MicroGlyphs";
import { getBrowserNotificationSupport } from "@/lib/dueNotifications";

interface DueNotificationToggleProps {
  /** Controlled: enabled state from parent hook */
  enabled: boolean;
  onEnable: () => Promise<"ok" | "denied" | "unsupported">;
  onDisable: () => void;
  className?: string;
  /** light header buttons vs default */
  variant?: "default" | "header";
}

export function DueNotificationToggle({
  enabled,
  onEnable,
  onDisable,
  className = "",
  variant = "default",
}: DueNotificationToggleProps) {
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState(() => getBrowserNotificationSupport());
  const [rippleKey, setRippleKey] = useState(0);
  const prevEnabledRef = useRef(enabled);

  useEffect(() => {
    if (!prevEnabledRef.current && enabled) {
      setRippleKey((n) => n + 1);
    }
    prevEnabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const sync = () => setPermission(getBrowserNotificationSupport());
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const ghost =
    variant === "header"
      ? "text-white/50 hover:text-white hover:bg-white/10"
      : "text-muted-foreground hover:text-foreground";

  const handleClick = async () => {
    if (enabled) {
      onDisable();
      return;
    }
    if (permission === "unsupported") return;
    setBusy(true);
    try {
      await onEnable();
    } finally {
      setBusy(false);
      setPermission(getBrowserNotificationSupport());
    }
  };

  const title = !enabled
    ? permission === "unsupported"
      ? "Reminders are not available in this browser"
      : permission === "denied"
        ? "Notifications are blocked — turn them on in your browser settings to use reminders"
        : "Turn on reminders for goals that are due today or overdue"
    : "Turn off due-date reminders";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={busy || permission === "unsupported"}
            onClick={handleClick}
            title={title}
            className={cn(
              "h-11 w-11 touch-manipulation md:h-9 md:w-9 shrink-0 rounded-lg transition-colors duration-200 active:scale-[0.97] relative overflow-visible",
              ghost,
              className,
            )}
            aria-pressed={enabled}
            aria-label={title}
          >
            <span className="relative inline-flex h-4 w-4 items-center justify-center">
              <BellRippleGlyph pulseKey={rippleKey} />
              {enabled ? (
                <Bell className="relative z-[2] h-4 w-4" />
              ) : (
                <BellOff className="relative z-[2] h-4 w-4" />
              )}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-snug dark:border-border/55 dark:bg-popover dark:shadow-xl dark:shadow-black/40 sm:rounded-lg">
          {permission === "unsupported" ? (
            <p className="text-muted-foreground">Try another browser or open the app over HTTPS.</p>
          ) : permission === "denied" ? (
            <p className="text-muted-foreground">
              Unblock notifications for this site in your browser, then reload.
            </p>
          ) : (
            <p className="text-muted-foreground">
              One reminder per unfinished goal per day (due today or overdue). Keep this tab open.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
