import { jsPDF } from 'jspdf';
import { Goal } from '@/types/goal';
import { calcProgress } from '@/lib/goalUtils';
import { formatDueChip } from '@/lib/dueDateUtils';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const timestamp = () => new Date().toISOString().slice(0, 10);

export const exportJSON = (goals: Goal[]) => {
  const data = goals.map((g) => ({
    title: g.title,
    category: g.category?.name ?? null,
    emoji: g.emoji,
    description: g.description,
    notes: g.notes,
    showcase_url: g.showcase_url,
    showcase_caption: g.showcase_caption,
    showcase_image: g.showcase_image,
    due_date: g.due_date,
    progress: Math.round(calcProgress(g)),
    subtasks: g.subtasks.map((s) => ({
      title: s.title,
      notes: s.notes,
      completed: s.is_completed,
      effort: s.effort,
    })),
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `goals-${timestamp()}.json`);
};

export const exportCSV = (goals: Goal[]) => {
  const rows: string[] = [
    'Category,Goal,Emoji,Description,Goal notes,Showcase caption,Showcase URL,Showcase image file,Due date,Progress,Subtask,Subtask notes,Completed,Effort',
  ];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  for (const g of goals) {
    const progress = `${Math.round(calcProgress(g))}%`;
    const due = g.due_date ?? '';
    const em = g.emoji ?? '';
    const gn = g.notes ?? '';
    const showCap = g.showcase_caption ?? '';
    const showUrl = g.showcase_url ?? '';
    const showImg = g.showcase_image ?? '';
    const cat = g.category?.name ?? '';
    if (g.subtasks.length === 0) {
      rows.push(
        [cat, g.title, em, g.description, gn, showCap, showUrl, showImg, due, progress, '', '', '', ''].map(esc).join(',')
      );
    } else {
      for (const s of g.subtasks) {
        rows.push(
          [
            cat,
            g.title,
            em,
            g.description,
            gn,
            showCap,
            showUrl,
            showImg,
            due,
            progress,
            s.title,
            s.notes ?? '',
            s.is_completed ? 'Yes' : 'No',
            s.effort?.toString() ?? '',
          ]
            .map(esc)
            .join(',')
        );
      }
    }
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  downloadBlob(blob, `goals-${timestamp()}.csv`);
};

export const exportPDF = (goals: Goal[]) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const checkPage = (needed = 8) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFillColor(30, 30, 40);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Goal Tracker — Export', margin, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 17, { align: 'right' });
  y = 38;

  for (const goal of goals) {
    const pct = Math.round(calcProgress(goal));
    const doneSubs = goal.subtasks.filter((s) => s.is_completed).length;
    checkPage(20);

    // Goal title bar
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 30);
    const titleLine = `${goal.emoji ? `${goal.emoji} ` : ''}${goal.title}`;
    doc.text(titleLine, margin + 3, y + 7);

    // Progress badge
    const badgeColor = pct >= 100 ? [245, 158, 11] : pct >= 50 ? [34, 197, 94] : [52, 211, 153];
    doc.setFillColor(...(badgeColor as [number, number, number]));
    doc.roundedRect(pageW - margin - 22, y + 1.5, 22, 7, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${pct}%`, pageW - margin - 11, y + 6.5, { align: 'center' });
    y += 13;

    if (goal.category?.name) {
      checkPage(5);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 115);
      doc.text(`Category: ${goal.category.name}`, margin + 3, y);
      y += 5;
    }

    if (goal.due_date) {
      checkPage(6);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 115);
      doc.text(`Due ${formatDueChip(goal.due_date)}`, margin + 3, y);
      y += 5;
    }

    // Description
    if (goal.description) {
      checkPage(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 110);
      const descLines = doc.splitTextToSize(goal.description, contentW - 4);
      doc.text(descLines, margin + 3, y);
      y += descLines.length * 4.5 + 2;
    }

    if (goal.notes?.trim()) {
      checkPage(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 100);
      doc.text('Notes:', margin + 3, y);
      y += 4;
      const noteLines = doc.splitTextToSize(goal.notes.trim(), contentW - 4);
      doc.text(noteLines, margin + 3, y);
      y += noteLines.length * 4.5 + 2;
    }

    if (goal.showcase_url?.trim() || goal.showcase_image?.trim()) {
      checkPage(10);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 130, 40);
      doc.text('Showcase:', margin + 3, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 100);
      if (goal.showcase_caption?.trim()) {
        const capLines = doc.splitTextToSize(goal.showcase_caption.trim(), contentW - 4);
        doc.text(capLines, margin + 3, y);
        y += capLines.length * 4.5 + 1;
      }
      if (goal.showcase_image?.trim()) {
        doc.text(`Screenshot (file): ${goal.showcase_image.trim()}`, margin + 3, y);
        y += 5;
      }
      if (goal.showcase_url?.trim()) {
        doc.setTextColor(40, 80, 160);
        const urlLines = doc.splitTextToSize(goal.showcase_url.trim(), contentW - 4);
        doc.text(urlLines, margin + 3, y);
        y += urlLines.length * 4.5 + 2;
      } else {
        y += 2;
      }
    }

    // Subtask count line
    if (goal.subtasks.length > 0) {
      checkPage(6);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 130);
      doc.text(`${doneSubs} / ${goal.subtasks.length} subtasks completed`, margin + 3, y);
      y += 5;

      // Progress bar
      checkPage(6);
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(margin + 3, y, contentW - 6, 3, 1, 1, 'F');
      if (pct > 0) {
        doc.setFillColor(...(badgeColor as [number, number, number]));
        doc.roundedRect(margin + 3, y, ((contentW - 6) * pct) / 100, 3, 1, 1, 'F');
      }
      y += 7;

      // Subtasks
      for (const s of goal.subtasks) {
        checkPage(6);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(s.is_completed ? 140 : 40, s.is_completed ? 140 : 40, s.is_completed ? 150 : 50);

        const mark = s.is_completed ? '✓' : '○';
        const effortTag = s.effort ? ` [${s.effort}]` : '';
        const label = `${mark}  ${s.title}${effortTag}`;
        const lines = doc.splitTextToSize(label, contentW - 10);
        doc.text(lines, margin + 6, y);
        y += lines.length * 5;
        if (s.notes?.trim()) {
          checkPage(5);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(110, 110, 120);
          const nLines = doc.splitTextToSize(s.notes.trim(), contentW - 14);
          doc.text(nLines, margin + 8, y);
          y += nLines.length * 4 + 1;
        }
      }
    } else {
      checkPage(6);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 130);
      doc.text(
        goal.is_completed ? 'Standalone goal · marked complete' : 'No subtasks yet.',
        margin + 3,
        y
      );
      y += 5;

      checkPage(6);
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(margin + 3, y, contentW - 6, 3, 1, 1, 'F');
      if (pct > 0) {
        doc.setFillColor(...(badgeColor as [number, number, number]));
        doc.roundedRect(margin + 3, y, ((contentW - 6) * pct) / 100, 3, 1, 1, 'F');
      }
      y += 7;
    }

    y += 6;
  }

  // Footer on last page
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text('Exported from Goal Tracker', margin, pageH - 8);
  doc.text(`${goals.length} goal${goals.length !== 1 ? 's' : ''}`, pageW - margin, pageH - 8, { align: 'right' });

  doc.save(`goals-${timestamp()}.pdf`);
};
