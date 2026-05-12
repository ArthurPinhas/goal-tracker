import toast from "react-hot-toast";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToastHandle = { id: string };

export function DueReminderInAppToastPanel({
  t,
  title,
  body,
}: {
  t: ToastHandle;
  title: string;
  body: string;
}) {
  const dismiss = () => toast.remove(t.id);

  return (
    <div className="pointer-events-auto w-[min(94vw,32rem)] rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-card via-card to-amber-950/25 px-5 py-5 shadow-[0_20px_56px_-16px_rgba(0,0,0,0.7),0_0_0_1px_rgba(251,191,36,0.2)] ring-2 ring-amber-400/30 backdrop-blur-md">
      <div className="flex gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/35">
          <Bell className="h-7 w-7" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-lg font-semibold leading-snug tracking-tight text-foreground">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{body}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-transform"
          aria-label="Dismiss reminder"
          onClick={dismiss}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="mt-5 h-11 w-full text-sm font-medium sm:w-auto sm:min-w-[10rem]"
        onClick={dismiss}
      >
        Dismiss
      </Button>
    </div>
  );
}
