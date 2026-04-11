import { useState, useEffect, useRef } from 'react';
import type { GoalTrackerData } from '../../types/goal.ts';
import { exportCSV } from '../../lib/export-csv.ts';
import { exportMarkdown } from '../../lib/export-md.ts';
import { exportPdf } from '../../lib/export-pdf.ts';

interface ExportMenuProps {
  data: GoalTrackerData;
}

export function ExportMenu({ data }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="export-menu" ref={ref}>
      <button
        className="gt-icon-btn"
        onClick={() => setOpen(!open)}
        title="Export"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
      {open && (
        <div className="export-dropdown">
          <button onClick={() => { exportCSV(data); setOpen(false); }}>CSV</button>
          <button onClick={() => { exportMarkdown(data); setOpen(false); }}>Markdown</button>
          <button onClick={() => { exportPdf(data); setOpen(false); }}>PDF</button>
        </div>
      )}
    </div>
  );
}
