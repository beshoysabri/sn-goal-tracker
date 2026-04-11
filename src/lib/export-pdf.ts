import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { GoalTrackerData } from '../types/goal.ts';
import { getGoalCompletion } from './data.ts';
import { getTimeRemaining, getTasksLabel, getTrackerStats } from './stats.ts';

export function exportPdf(data: GoalTrackerData) {
  const doc = new jsPDF();
  const stats = getTrackerStats(data);

  doc.setFontSize(20);
  doc.text('My Goals', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `${stats.activeCount} active | ${stats.completedCount} completed | ${stats.avgCompletion}% avg`,
    14, 28,
  );

  const goals = data.goals.filter(g => !g.archived);
  const tableData = goals.map(g => {
    const area = data.lifeAreas.find(a => a.id === g.lifeAreaId);
    const timeLeft = g.targetDate ? getTimeRemaining(g) : null;
    return [
      g.name,
      area?.name || '',
      g.status,
      `${getGoalCompletion(g)}%`,
      timeLeft?.label || '-',
      getTasksLabel(g),
    ];
  });

  (doc as any).autoTable({
    startY: 35,
    head: [['Goal', 'Life Area', 'Status', 'Progress', 'Time Left', 'Tasks']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
  });

  doc.save(`goals-${new Date().toISOString().slice(0, 10)}.pdf`);
}
