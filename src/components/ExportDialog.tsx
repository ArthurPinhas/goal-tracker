import { useState } from "react";
import { Download, FileJson, FileText, File } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Goal } from "@/types/goal";
import { exportJSON, exportCSV, exportPDF } from "@/lib/exportGoals";
import toast from "react-hot-toast";
import { ExportSheetGlyph } from "@/components/micro/MicroGlyphs";

interface ExportDialogProps {
  goals: Goal[];
}

type Format = 'json' | 'csv' | 'pdf';

const FORMATS: { id: Format; label: string; desc: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'json', label: 'JSON', desc: 'Machine-readable, import-friendly', Icon: FileJson },
  { id: 'csv', label: 'CSV', desc: 'Open in Excel or Google Sheets', Icon: FileText },
  { id: 'pdf', label: 'PDF', desc: 'Formatted report, print-ready', Icon: File },
];

const ExportDialog = ({ goals }: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Format>('pdf');
  const [triggerHover, setTriggerHover] = useState(false);

  const handleExport = () => {
    if (goals.length === 0) {
      toast.error('No goals to export.');
      return;
    }
    try {
      if (selected === 'json') exportJSON(goals);
      else if (selected === 'csv') exportCSV(goals);
      else exportPDF(goals);
      toast.success(`Exported as ${selected.toUpperCase()}`);
      setOpen(false);
    } catch {
      toast.error('Export failed. Try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs overflow-hidden rounded-lg"
          onMouseEnter={() => setTriggerHover(true)}
          onMouseLeave={() => setTriggerHover(false)}
          onFocus={() => setTriggerHover(true)}
          onBlur={() => setTriggerHover(false)}
        >
          <ExportSheetGlyph active={triggerHover} />
          Export goals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">Export goals</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Choose a format and download your goals. Export runs entirely in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5 py-1">
          {FORMATS.map(({ id, label, desc, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                selected === id
                  ? "border-primary bg-primary/8 text-foreground shadow-md shadow-primary/10 ring-2 ring-primary/25 dark:bg-primary/10 dark:ring-primary/30 dark:shadow-lg dark:shadow-black/30"
                  : "border-border/80 bg-card hover:bg-secondary/80 text-muted-foreground hover:text-foreground hover:border-border dark:border-border/60 dark:bg-card/80 dark:hover:bg-muted/25 dark:shadow-sm dark:shadow-black/20"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${selected === id ? "text-primary" : ""}`} />
              <div>
                <div className="text-sm font-medium leading-none">{label}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">{desc}</div>
              </div>
            </button>
          ))}
        </div>
        <Button onClick={handleExport} className="w-full gap-2 min-h-10 shadow-md shadow-primary/15 dark:shadow-primary/10">
          <Download className="h-4 w-4" />
          Download {selected.toUpperCase()}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
