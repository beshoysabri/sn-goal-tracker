import type { Goal, GoalTrackerData, LifeArea } from '../types/goal.ts';
import { getGoalCompletion } from './data.ts';
import { todayStr, daysBetween, formatTimeLeft } from './calendar.ts';

/** Get time remaining info for a goal */
export function getTimeRemaining(goal: Goal): { label: string; overdue: boolean } | null {
  if (!goal.targetDate) return null;
  if (goal.status === 'completed') return { label: 'Done', overdue: false };
  return formatTimeLeft(goal.targetDate);
}

/** Check if a goal is overdue */
export function isOverdue(goal: Goal): boolean {
  if (!goal.targetDate) return false;
  if (goal.status === 'completed' || goal.status === 'abandoned') return false;
  return goal.targetDate < todayStr();
}

/** Get number of days a goal has been active */
export function getDaysActive(goal: Goal): number {
  const start = goal.startDate || goal.createdAt.slice(0, 10);
  const end = goal.completedDate || todayStr();
  return Math.max(0, daysBetween(start, end));
}

/** Get tasks completion string (e.g. "3/7") */
export function getTasksLabel(goal: Goal): string {
  if (goal.tasks.length === 0) return '0';
  const done = goal.tasks.filter(t => t.completed).length;
  return `${done}/${goal.tasks.length}`;
}

/** Get summary stats for the entire tracker */
export function getTrackerStats(data: GoalTrackerData) {
  const active = data.goals.filter(g => !g.archived && g.status === 'active');
  const completed = data.goals.filter(g => g.status === 'completed');
  const overdue = active.filter(g => isOverdue(g));

  const avgCompletion = active.length === 0
    ? 0
    : Math.round(active.reduce((sum, g) => sum + getGoalCompletion(g), 0) / active.length);

  return {
    activeCount: active.length,
    completedCount: completed.length,
    overdueCount: overdue.length,
    avgCompletion,
  };
}

/** Get stats per life area */
export function getLifeAreaStats(data: GoalTrackerData, area: LifeArea) {
  const areaGoals = data.goals.filter(g => g.lifeAreaId === area.id && !g.archived);
  const active = areaGoals.filter(g => g.status === 'active');
  const completed = areaGoals.filter(g => g.status === 'completed');
  const overdue = active.filter(g => isOverdue(g));

  const avgCompletion = active.length === 0
    ? 0
    : Math.round(active.reduce((sum, g) => sum + getGoalCompletion(g), 0) / active.length);

  return {
    total: areaGoals.length,
    activeCount: active.length,
    completedCount: completed.length,
    overdueCount: overdue.length,
    avgCompletion,
  };
}
