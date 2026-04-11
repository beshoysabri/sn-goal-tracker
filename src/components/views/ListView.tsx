import { useState } from 'react';
import type { GoalTrackerData, Goal, LifeArea, StatusTab } from '../../types/goal.ts';
import { GoalIcon } from '../../lib/icons.tsx';
import { getGoalCompletion } from '../../lib/data.ts';
import { formatDateShort } from '../../lib/calendar.ts';
import { getTimeRemaining, getTasksLabel, getLifeAreaStats } from '../../lib/stats.ts';
import { PriorityBadge } from '../shared/PriorityBadge.tsx';
import { hexToRgba } from '../../lib/colors.ts';

interface ListViewProps {
  data: GoalTrackerData;
  statusTab: StatusTab;
  searchQuery: string;
  onSelectGoal: (id: string) => void;
}

export function ListView({ data, statusTab, searchQuery, onSelectGoal }: ListViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter goals
  const filteredGoals = data.goals.filter(g => {
    if (g.archived) return false;
    if (statusTab === 'active' && (g.status === 'completed' || g.status === 'abandoned')) return false;
    if (statusTab === 'completed' && g.status !== 'completed') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    }
    return true;
  });

  const sortedAreas = [...data.lifeAreas].sort((a, b) => a.sortOrder - b.sortOrder);

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

    const topLevel = goals.filter(g => !g.parentGoalId);
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
          {searchQuery ? 'No goals match your search.' : 'No goals yet'}
        </p>
        <p className="gt-list-empty-desc">
          {!searchQuery && 'Click "+ Goal" to create your first goal.'}
        </p>
      </div>
    );
  }

  return (
    <div className="gt-list-view">
      <div className="gt-list-header-row">
        <div className="gt-list-name">Name</div>
        <div className="gt-list-date">Start</div>
        <div className="gt-list-time-left">Time Left</div>
        <div className="gt-list-progress">Progress</div>
        <div className="gt-list-tasks">Tasks</div>
      </div>

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
    </div>
  );
}
