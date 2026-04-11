import type { GoalTrackerData } from '../types/goal.ts';
import { getGoalCompletion } from './data.ts';
import { getTimeRemaining, getTasksLabel } from './stats.ts';

export function exportCSV(data: GoalTrackerData) {
  const headers = ['Name', 'Life Area', 'Status', 'Priority', 'Tracking', 'Completion %', 'Start Date', 'Target Date', 'Time Left', 'Tasks'];
  const rows = data.goals
    .filter(g => !g.archived)
    .map(g => {
      const area = data.lifeAreas.find(a => a.id === g.lifeAreaId);
      const timeLeft = g.targetDate ? getTimeRemaining(g) : null;
      return [
        g.name,
        area?.name || '',
        g.status,
        g.priority,
        g.trackingType,
        String(getGoalCompletion(g)),
        g.startDate || '',
        g.targetDate || '',
        timeLeft?.label || '',
        getTasksLabel(g),
      ];
    });

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `goals-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
