import { useState, useMemo } from 'react';
import type { GoalTrackerData, Goal, LifeArea, StatusTab } from '../../types/goal.ts';
import { GoalIcon } from '../../lib/icons.tsx';
import { getGoalCompletion } from '../../lib/data.ts';
import { formatDateShort, daysBetween, todayStr } from '../../lib/calendar.ts';
import { getTimeRemaining, getTasksLabel, getLifeAreaStats } from '../../lib/stats.ts';
import { PriorityBadge } from '../shared/PriorityBadge.tsx';
import { hexToRgba } from '../../lib/colors.ts';

interface ListViewProps {
  data: GoalTrackerData;
  statusTab: StatusTab;
  searchQuery: string;
  filterAreaId: string | null;
  onSelectGoal: (id: string) => void;
  onQuickComplete: (goalId: string) => void;
}

type SortKey = 'name' | 'start' | 'timeLeft' | 'progress' | 'tasks';
type SortDir = 'asc' | 'desc';

const SUGGESTED_GOALS = [
  { icon: 'book', name: 'Read 12 books this year' },
  { icon: 'running', name: 'Run a 5K' },
  { icon: 'graduation', name: 'Learn a new skill' },
  { icon: 'piggy-bank', name: 'Build an emergency fund' },
  { icon: 'heart', name: 'Improve daily habits' },
];

function getSortValue(goal: Goal, key: SortKey): number | string {
  switch (key) {
    case 'name': return goal.name.toLowerCase();
    case 'start': return goal.startDate || 'z';
    case 'timeLeft': return goal.targetDate ? daysBetween(todayStr(), goal.targetDate) : 99999;
    case 'progress': return getGoalCompletion(goal);
    case 'tasks': return goal.tasks.filter(t => t.completed).length;
  }
}

export function ListView({ data, statusTab, searchQuery, filterAreaId, onSelectGoal, onQuickComplete }: ListViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Filter goals
  const filteredGoals = useMemo(() => data.goals.filter(g => {
    if (g.archived) return false;
    if (statusTab === 'active' && (g.status === 'completed' || g.status === 'abandoned')) return false;
    if (statusTab === 'completed' && g.status !== 'completed') return false;
    if (filterAreaId && g.lifeAreaId !== filterAreaId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    }
    return true;
  }), [data.goals, statusTab, searchQuery, filterAreaId]);

  const sortedAreas = [...data.lifeAreas].sort((a, b) => a.sortOrder - b.sortOrder);

  const sortGoals = (goals: Goal[]): Goal[] => {
    if (!sortKey) return goals.sort((a, b) => a.sortOrder - b.sortOrder);
    return [...goals].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  };

  const SortHeader = ({ label, col }: { label: string; col: SortKey }) => (
    <div
      className={`gt-list-sort-header ${sortKey === col ? 'active' : ''}`}
      onClick={() => handleSort(col)}
    >
      {label}
      {sortKey === col && (
        <span className="gt-list-sort-arrow">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
      )}
    </div>
  );

  const renderGoalRow = (goal: Goal, isSubGoal = false) => {
    const completion = getGoalCompletion(goal);
    const timeLeft = goal.targetDate ? getTimeRemaining(goal) : null;
    const tasks = getTasksLabel(goal);

    return (
      <div
        key={goal.id}
        className={`gt-list-row ${isSubGoal ? 'subgoal' : ''} ${goal.status === 'completed' ? 'completed' : ''}`}
        onClick={() => onSelectGoal(goal.id)}
      >
        <div className="gt-list-name">
          <span className="gt-list-name-icon" style={{ color: goal.color }}>
            <GoalIcon name={goal.icon} size={16} />
          </span>
          <span className="gt-list-name-text">{goal.name}</span>
          {goal.priority !== 'medium' && <PriorityBadge priority={goal.priority} />}
          {goal.status === 'paused' && <span className="status-badge status-paused">Paused</span>}
          {goal.status === 'active' && completion < 100 && (
            <button
              className="gt-list-quick-complete"
              onClick={(e) => { e.stopPropagation(); onQuickComplete(goal.id); }}
              title="Mark as completed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            </button>
          )}
        </div>
        <div className="gt-list-date">
          {goal.startDate ? formatDateShort(goal.startDate) : '-'}
        </div>
        <div className={`gt-list-time-left ${timeLeft?.overdue ? 'overdue' : ''}`}>
          {timeLeft ? timeLeft.label : 'No date'}
        </div>
        <div className="gt-list-progress">
          <div className="gt-list-progress-track">
            <div className="gt-list-progress-bar" style={{ width: `${completion}%`, background: goal.color }} />
          </div>
          <span className="gt-list-progress-value">{completion}%</span>
        </div>
        <div className="gt-list-tasks">{tasks}</div>
      </div>
    );
  };

  const renderAreaGroup = (area: LifeArea | null, goals: Goal[], key: string) => {
    if (goals.length === 0) return null;
    const isCollapsed = collapsed[key];
    const areaStats = area ? getLifeAreaStats(data, area) : null;

    const topLevel = sortGoals(goals.filter(g => !g.parentGoalId));
    const getChildren = (parentId: string) => goals.filter(g => g.parentGoalId === parentId);

    return (
      <div key={key} className="gt-list-group">
        <div className="gt-list-group-header" onClick={() => toggleCollapse(key)}>
          {area && (
            <>
              <span className="gt-list-group-dot" style={{ background: area.color }} />
              <span className="gt-list-group-icon" style={{ color: area.color }}>
                <GoalIcon name={area.icon} size={16} />
              </span>
            </>
          )}
          <span className="gt-list-group-name">{area?.name || 'Ungrouped'}</span>
          {areaStats && (
            <span className="gt-list-group-stats"
              style={area ? { background: hexToRgba(area.color, 0.1), color: area.color } : undefined}
            >
              {areaStats.activeCount} goals &middot; {areaStats.avgCompletion}% avg
              {areaStats.overdueCount > 0 && <span className="gt-list-group-overdue"> &middot; {areaStats.overdueCount} overdue</span>}
            </span>
          )}
          <span className={`gt-list-group-arrow ${isCollapsed ? 'collapsed' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
        {!isCollapsed && (
          <div className="gt-list-rows">
            {topLevel.map(goal => (
              <div key={goal.id}>
                {renderGoalRow(goal)}
                {getChildren(goal.id).map(sub => renderGoalRow(sub, true))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (filteredGoals.length === 0) {
    return (
      <div className="gt-list-empty">
        <div className="gt-list-empty-icon">
          <GoalIcon name="target" size={48} />
        </div>
        <p className="gt-list-empty-title">
          {searchQuery ? 'No goals match your search.' : filterAreaId ? 'No goals in this area.' : 'No goals yet'}
        </p>
        {!searchQuery && !filterAreaId && (
          <>
            <p className="gt-list-empty-desc">Here are some ideas to get started:</p>
            <div className="gt-list-suggestions">
              {SUGGESTED_GOALS.map(s => (
                <div key={s.name} className="gt-list-suggestion">
                  <GoalIcon name={s.icon} size={14} />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="gt-list-view">
      <div className="gt-list-header-row">
        <SortHeader label="Name" col="name" />
        <SortHeader label="Start" col="start" />
        <SortHeader label="Time Left" col="timeLeft" />
        <SortHeader label="Progress" col="progress" />
        <SortHeader label="Tasks" col="tasks" />
      </div>

      {filterAreaId ? (
        // When filtering by area, don't group — show flat sorted list
        <div className="gt-list-rows">
          {sortGoals(filteredGoals.filter(g => !g.parentGoalId)).map(goal => (
            <div key={goal.id}>
              {renderGoalRow(goal)}
              {filteredGoals.filter(g => g.parentGoalId === goal.id).map(sub => renderGoalRow(sub, true))}
            </div>
          ))}
        </div>
      ) : (
        <>
          {sortedAreas.map(area => {
            const areaGoals = filteredGoals
              .filter(g => g.lifeAreaId === area.id)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            return renderAreaGroup(area, areaGoals, area.id);
          })}

          {renderAreaGroup(
            null,
            filteredGoals
              .filter(g => !g.lifeAreaId || !data.lifeAreas.some(a => a.id === g.lifeAreaId))
              .sort((a, b) => a.sortOrder - b.sortOrder),
            '__ungrouped'
          )}
        </>
      )}
    </div>
  );
}
