import type { GoalTrackerData, Goal, LifeArea } from '../types/goal.ts';
import { v4 as uuid } from 'uuid';

const HEADER_MARKER = '---GOAL-TRACKER-DATA---';

interface ParseResult {
  data: GoalTrackerData;
  isNew: boolean;
}

export function parseNoteText(text: string): ParseResult {
  if (!text.trim()) {
    return { data: createEmpty([]), isNew: true };
  }

  const markerIndex = text.indexOf(HEADER_MARKER);
  const jsonStr = markerIndex >= 0
    ? text.substring(markerIndex + HEADER_MARKER.length).trim()
    : text.trim();

  try {
    const data = JSON.parse(jsonStr) as GoalTrackerData;
    return { data: migrate(data), isNew: false };
  } catch {
    return { data: createEmpty([]), isNew: true };
  }
}

export function serializeToNoteText(data: GoalTrackerData): string {
  data.updatedAt = new Date().toISOString();

  const active = data.goals.filter(g => !g.archived && g.status === 'active');
  const goalSummary = active
    .slice(0, 5)
    .map(g => `${g.name}: ${getGoalCompletion(g)}%`)
    .join(' | ');

  const header = [
    `@type: goal-tracker`,
    `@goals: ${active.length}`,
    `@lifeAreas: ${data.lifeAreas.length}`,
    `@summary: ${goalSummary}`,
    '',
    HEADER_MARKER,
  ].join('\n');

  return header + '\n' + JSON.stringify(data);
}

export function generatePreview(data: GoalTrackerData): string {
  const active = data.goals.filter(g => !g.archived && g.status === 'active');
  if (active.length === 0) return 'Goal Tracker - No goals';
  const top3 = active.slice(0, 3).map(g =>
    `${g.name}: ${getGoalCompletion(g)}%`
  ).join(' | ');
  return `Goals - ${top3}`;
}

/** Calculate completion percentage for a single goal */
export function getGoalCompletion(goal: Goal): number {
  switch (goal.trackingType) {
    case 'boolean':
      return goal.status === 'completed' ? 100 : 0;
    case 'percentage': {
      if (goal.progressEntries.length === 0) return 0;
      const latest = goal.progressEntries[goal.progressEntries.length - 1];
      return Math.min(100, Math.max(0, Math.round(latest.value)));
    }
    case 'numeric': {
      if (!goal.targetValue || goal.targetValue <= 0) return 0;
      const current = goal.currentValue ?? 0;
      return Math.min(100, Math.round((current / goal.targetValue) * 100));
    }
    case 'checklist': {
      if (goal.tasks.length === 0) return 0;
      const done = goal.tasks.filter(t => t.completed).length;
      return Math.round((done / goal.tasks.length) * 100);
    }
    default:
      return 0;
  }
}

function migrate(data: GoalTrackerData): GoalTrackerData {
  if (!data.version) data.version = 1;

  // v1 -> v2: add notes field to goals
  if (data.version === 1) {
    for (const goal of data.goals) {
      if (goal.notes === undefined) (goal as any).notes = '';
    }
    data.version = 2;
  }

  // v2 -> v3: add title/subtitle fields
  if (data.version === 2) {
    if (!data.title) data.title = undefined;
    if (!data.subtitle) data.subtitle = undefined;
    data.version = 3;
  }

  return data;
}

export function createEmpty(lifeAreas: LifeArea[]): GoalTrackerData {
  return {
    version: 3,
    goals: [],
    lifeAreas,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const DEFAULT_LIFE_AREAS: Omit<LifeArea, 'id'>[] = [
  { name: 'Work & Career',          icon: 'briefcase',   color: '#3b82f6', sortOrder: 0 },
  { name: 'Health & Fitness',        icon: 'heart',       color: '#22c55e', sortOrder: 1 },
  { name: 'Personal Development',    icon: 'brain',       color: '#a855f7', sortOrder: 2 },
  { name: 'Education & Learning',    icon: 'graduation',  color: '#6366f1', sortOrder: 3 },
  { name: 'Finance',                 icon: 'trending-up', color: '#eab308', sortOrder: 4 },
  { name: 'Relationships',           icon: 'users',       color: '#ec4899', sortOrder: 5 },
  { name: 'Spirituality & Purpose',  icon: 'sun',         color: '#f97316', sortOrder: 6 },
];

export function createLifeArea(partial: Omit<LifeArea, 'id'>): LifeArea {
  return { ...partial, id: uuid() };
}

export function getGroupedGoals(
  goals: Goal[],
  lifeAreas: LifeArea[],
): { lifeArea: LifeArea | null; goals: Goal[] }[] {
  const sortedAreas = [...lifeAreas].sort((a, b) => a.sortOrder - b.sortOrder);
  const result: { lifeArea: LifeArea | null; goals: Goal[] }[] = [];

  for (const area of sortedAreas) {
    const areaGoals = goals
      .filter(g => g.lifeAreaId === area.id && !g.parentGoalId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (areaGoals.length > 0) {
      // Include sub-goals inline under their parents
      const expanded: Goal[] = [];
      for (const goal of areaGoals) {
        expanded.push(goal);
        const children = goals
          .filter(g => g.parentGoalId === goal.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        expanded.push(...children);
      }
      result.push({ lifeArea: area, goals: expanded });
    }
  }

  // Ungrouped goals (no lifeAreaId or orphaned)
  const ungrouped = goals
    .filter(g => !g.lifeAreaId || !lifeAreas.some(a => a.id === g.lifeAreaId))
    .filter(g => !g.parentGoalId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (ungrouped.length > 0) {
    const expanded: Goal[] = [];
    for (const goal of ungrouped) {
      expanded.push(goal);
      const children = goals
        .filter(g => g.parentGoalId === goal.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      expanded.push(...children);
    }
    result.push({ lifeArea: null, goals: expanded });
  }

  return result;
}
