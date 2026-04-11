import type { GoalTrackerData } from '../types/goal.ts';
import { getGoalCompletion, getGroupedGoals } from './data.ts';
import { getTimeRemaining, getTasksLabel, getTrackerStats } from './stats.ts';

export function exportMarkdown(data: GoalTrackerData) {
  const stats = getTrackerStats(data);
  const grouped = getGroupedGoals(
    data.goals.filter(g => !g.archived),
    data.lifeAreas,
  );

  let md = `# My Goals\n\n`;
  md += `> ${stats.activeCount} active | ${stats.completedCount} completed | ${stats.avgCompletion}% avg completion\n\n`;

  for (const { lifeArea, goals } of grouped) {
    md += `## ${lifeArea?.name || 'Ungrouped'}\n\n`;
    md += `| Goal | Status | Progress | Time Left | Tasks |\n`;
    md += `|------|--------|----------|-----------|-------|\n`;

    for (const goal of goals) {
      const prefix = goal.parentGoalId ? '  - ' : '';
      const completion = getGoalCompletion(goal);
      const timeLeft = goal.targetDate ? getTimeRemaining(goal) : null;
      md += `| ${prefix}${goal.name} | ${goal.status} | ${completion}% | ${timeLeft?.label || '-'} | ${getTasksLabel(goal)} |\n`;
    }
    md += '\n';
  }

  md += `---\n*Exported from Goal Tracker on ${new Date().toLocaleDateString()}*\n`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `goals-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
