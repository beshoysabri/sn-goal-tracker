import { useState } from 'react';
import type { GoalTrackerData, Goal, LifeArea } from '../types/goal.ts';
import { GoalIcon } from '../lib/icons.tsx';
import { getGoalCompletion } from '../lib/data.ts';
import { hexToRgba } from '../lib/colors.ts';
import { getTrackerStats } from '../lib/stats.ts';

interface GoalSidebarProps {
  data: GoalTrackerData;
  selectedGoalId: string | null;
  onSelectGoal: (id: string | null) => void;
  onAddGoal: () => void;
  onAddLifeArea: () => void;
  onEditLifeArea: (area: LifeArea) => void;
}

export function GoalSidebar({
  data,
  selectedGoalId,
  onSelectGoal,
  onAddGoal,
  onAddLifeArea,
  onEditLifeArea,
}: GoalSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const stats = getTrackerStats(data);

  const sortedAreas = [...data.lifeAreas].sort((a, b) => a.sortOrder - b.sortOrder);

  const toggleCollapse = (areaId: string) => {
    setCollapsed(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  const getAreaGoals = (areaId: string) =>
    data.goals
      .filter(g => g.lifeAreaId === areaId && !g.archived && !g.parentGoalId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const getSubGoals = (parentId: string) =>
    data.goals
      .filter(g => g.parentGoalId === parentId && !g.archived)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const ungrouped = data.goals
    .filter(g => !g.lifeAreaId && !g.archived && !g.parentGoalId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const renderGoalItem = (goal: Goal, isSubGoal = false) => (
    <div
      key={goal.id}
      className={`gt-sidebar-item ${isSubGoal ? 'gt-sidebar-subgoal' : ''} ${selectedGoalId === goal.id ? 'selected' : ''} ${goal.status === 'completed' ? 'completed' : ''}`}
      onClick={() => onSelectGoal(goal.id)}
    >
      <span className="gt-sidebar-icon" style={{ color: goal.color }}>
        <GoalIcon name={goal.icon} size={14} />
      </span>
      <span className="gt-sidebar-name">{goal.name}</span>
      <span className="gt-sidebar-pct">{getGoalCompletion(goal)}%</span>
    </div>
  );

  return (
    <div className="gt-sidebar">
      <div className="gt-sidebar-header">
        <span className="gt-sidebar-title">My Goals</span>
        <span className="gt-sidebar-count">{stats.activeCount} active</span>
      </div>

      <div className="gt-sidebar-list">
        <div
          className={`gt-sidebar-item ${selectedGoalId === null ? 'selected' : ''}`}
          onClick={() => onSelectGoal(null)}
        >
          <span className="gt-sidebar-icon">
            <GoalIcon name="target" size={14} />
          </span>
          <span className="gt-sidebar-name">All Goals</span>
        </div>

        {sortedAreas.map(area => {
          const areaGoals = getAreaGoals(area.id);
          const isCollapsed = collapsed[area.id];

          return (
            <div key={area.id} className="gt-sidebar-section">
              <div
                className="gt-sidebar-section-header"
                onClick={() => toggleCollapse(area.id)}
                onContextMenu={(e) => { e.preventDefault(); onEditLifeArea(area); }}
              >
                <span className="gt-sidebar-section-dot" style={{ background: area.color }} />
                <span className="gt-sidebar-section-icon" style={{ color: area.color }}>
                  <GoalIcon name={area.icon} size={12} />
                </span>
                <span className="gt-sidebar-section-name">{area.name}</span>
                <span className="gt-sidebar-section-count"
                  style={{ background: hexToRgba(area.color, 0.15), color: area.color }}
                >
                  {areaGoals.length}
                </span>
                <span className={`gt-sidebar-section-arrow ${isCollapsed ? 'collapsed' : ''}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
              {!isCollapsed && areaGoals.map(goal => (
                <div key={goal.id}>
                  {renderGoalItem(goal)}
                  {getSubGoals(goal.id).map(sub => renderGoalItem(sub, true))}
                </div>
              ))}
            </div>
          );
        })}

        {ungrouped.length > 0 && (
          <div className="gt-sidebar-section">
            <div className="gt-sidebar-section-header" onClick={() => toggleCollapse('__ungrouped')}>
              <span className="gt-sidebar-section-name" style={{ opacity: 0.6 }}>Ungrouped</span>
              <span className="gt-sidebar-section-count">{ungrouped.length}</span>
              <span className={`gt-sidebar-section-arrow ${collapsed['__ungrouped'] ? 'collapsed' : ''}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
            {!collapsed['__ungrouped'] && ungrouped.map(goal => (
              <div key={goal.id}>
                {renderGoalItem(goal)}
                {getSubGoals(goal.id).map(sub => renderGoalItem(sub, true))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="gt-sidebar-footer">
        <button className="gt-sidebar-add-btn" onClick={onAddGoal}>+ Add Goal</button>
        <button className="gt-sidebar-add-btn" onClick={onAddLifeArea}>+ Life Area</button>
      </div>
    </div>
  );
}
