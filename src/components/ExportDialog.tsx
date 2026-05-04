import { useState } from "react";
import { Download, FileJson, FileText, File } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Goal } from "@/types/goal";
import { exportJSON, exportCSV, exportPDF } from "@/lib/exportGoals";
import toast from "react-hot-toast";

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
        <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
          <Download className="h-3.5 w-3.5" />
          Export goals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Export goals</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-1">
          {FORMATS.map(({ id, label, desc, Icon }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                selected === id
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div>
                <div className="text-sm font-medium leading-none">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </button>
          ))}
        </div>
        <Button onClick={handleExport} className="w-full gap-2">
          <Download className="h-4 w-4" />
          Download {selected.toUpperCase()}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
