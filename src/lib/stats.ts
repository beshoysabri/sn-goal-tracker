import type { Goal, GoalTrackerData, LifeArea } from '../types/goal.ts';
import { getGoalCompletion } from './data.ts';
import { todayStr, daysBetween, formatTimeLeft, fromDateStr, formatDateShort, getShortMonthName } from './calendar.ts';

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

// ======= ANALYTICS FUNCTIONS =======

/** Average value change per week */
export function getProgressVelocity(goal: Goal): { value: number; label: string } | null {
  const entries = goal.progressEntries;
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = daysBetween(first.date, last.date);
  if (days <= 0) return null;
  const change = last.value - first.value;
  const perWeek = Math.round((change / days) * 7 * 10) / 10;
  const unit = goal.trackingType === 'percentage' ? '%' : (goal.unit || '');
  return { value: perWeek, label: `${perWeek >= 0 ? '+' : ''}${perWeek} ${unit}/week` };
}

/** Estimated completion date based on current velocity */
export function getProjectedCompletion(goal: Goal): string | null {
  if (goal.trackingType === 'boolean' || goal.trackingType === 'checklist') return null;
  const target = goal.trackingType === 'percentage' ? 100 : (goal.targetValue || 0);
  if (target <= 0) return null;
  const current = goal.trackingType === 'percentage'
    ? (goal.progressEntries.length > 0 ? goal.progressEntries[goal.progressEntries.length - 1].value : 0)
    : (goal.currentValue || 0);
  if (current >= target) return 'Achieved';
  const velocity = getProgressVelocity(goal);
  if (!velocity || velocity.value <= 0) return null;
  const remaining = target - current;
  const weeksLeft = remaining / velocity.value;
  const daysLeft = Math.round(weeksLeft * 7);
  const projected = new Date();
  projected.setDate(projected.getDate() + daysLeft);
  return formatDateShort(`${projected.getFullYear()}-${String(projected.getMonth() + 1).padStart(2, '0')}-${String(projected.getDate()).padStart(2, '0')}`);
}

/** Date with the highest single-entry increase */
export function getBestProgressDay(goal: Goal): { date: string; increase: number } | null {
  const entries = [...goal.progressEntries].sort((a, b) => a.date.localeCompare(b.date));
  if (entries.length < 2) return null;
  let best = { date: entries[1].date, increase: 0 };
  for (let i = 1; i < entries.length; i++) {
    const diff = entries[i].value - entries[i - 1].value;
    if (diff > best.increase) {
      best = { date: entries[i].date, increase: Math.round(diff * 10) / 10 };
    }
  }
  return best.increase > 0 ? best : null;
}

/** Count consecutive days with progress entries (from most recent) */
export function getProgressStreak(goal: Goal): number {
  if (goal.progressEntries.length === 0) return 0;
  const dates = new Set(goal.progressEntries.map(e => e.date));
  let streak = 0;
  const d = new Date();
  // Start from today and go backwards
  for (let i = 0; i < 365; i++) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (dates.has(ds)) {
      streak++;
    } else if (streak > 0) {
      break; // streak broken
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Get chart data points: sorted entries with normalized x/y for SVG */
export function getChartData(goal: Goal): { date: string; value: number; label: string }[] {
  if (goal.progressEntries.length === 0) return [];
  return [...goal.progressEntries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({
      date: e.date,
      value: e.value,
      label: `${formatDateShort(e.date)}: ${e.value}${goal.trackingType === 'percentage' ? '%' : (' ' + (goal.unit || ''))}`,
    }));
}

/** Monthly aggregated progress (last 12 months) */
export function getMonthlyProgress(goal: Goal): { month: string; value: number }[] {
  const now = new Date();
  const result: { month: string; value: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthEntries = goal.progressEntries.filter(e => {
      const ed = fromDateStr(e.date);
      return ed.getFullYear() === y && ed.getMonth() === m;
    });
    const avg = monthEntries.length > 0
      ? Math.round(monthEntries.reduce((s, e) => s + e.value, 0) / monthEntries.length)
      : 0;
    result.push({ month: getShortMonthName(m), value: avg });
  }
  return result;
}
