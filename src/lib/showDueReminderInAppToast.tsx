import toast from "react-hot-toast";
import { DueReminderInAppToastPanel } from "@/components/DueReminderInAppToastPanel";

/** In-page mirror of the system due reminder — large, readable; dismiss uses `toast.remove` (no slow exit animation). */
export function showDueReminderInAppToast(title: string, body: string) {
  toast.custom((t) => <DueReminderInAppToastPanel t={t} title={title} body={body} />, {
    id: "goal-due-reminder",
    duration: 45_000,
    position: "top-center",
  });
}
