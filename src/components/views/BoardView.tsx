import { useState, useRef } from 'react';
import type { GoalTrackerData, Goal, GoalStatus, StatusTab } from '../../types/goal.ts';
import { GoalIcon } from '../../lib/icons.tsx';
import { getGoalCompletion } from '../../lib/data.ts';
import { getTimeRemaining, getTasksLabel } from '../../lib/stats.ts';
import { ProgressBar } from '../shared/ProgressBar.tsx';
import { PriorityBadge } from '../shared/PriorityBadge.tsx';

interface BoardViewProps {
  data: GoalTrackerData;
  statusTab: StatusTab;
  searchQuery: string;
  onSelectGoal: (id: string) => void;
  onUpdateStatus: (goalId: string, status: GoalStatus) => void;
}

const COLUMNS: { status: GoalStatus; label: string; color: string }[] = [
  { status: 'active', label: 'Active', color: 'var(--gt-success)' },
  { status: 'paused', label: 'Paused', color: 'var(--gt-warning)' },
  { status: 'completed', label: 'Completed', color: 'var(--gt-accent)' },
  { status: 'abandoned', label: 'Abandoned', color: 'var(--gt-muted)' },
];

export function BoardView({ data, statusTab, searchQuery, onSelectGoal, onUpdateStatus }: BoardViewProps) {
  const [dragGoalId, setDragGoalId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<GoalStatus | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  const filteredGoals = data.goals.filter(g => {
    if (g.archived) return false;
    if (g.parentGoalId) return false; // Only top-level in board
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    }
    return true;
  });

  const getColumnGoals = (status: GoalStatus): Goal[] =>
    filteredGoals
      .filter(g => g.status === status)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  // Drag handlers
  const handleDragStart = (goalId: string) => {
    setDragGoalId(goalId);
  };

  const handleDragEnd = () => {
    setDragGoalId(null);
    setDragOverColumn(null);
    dragCounterRef.current = {};
  };

  const handleDragEnter = (status: GoalStatus) => {
    if (!dragCounterRef.current[status]) dragCounterRef.current[status] = 0;
    dragCounterRef.current[status]++;
    setDragOverColumn(status);
  };

  const handleDragLeave = (status: GoalStatus) => {
    dragCounterRef.current[status]--;
    if (dragCounterRef.current[status] <= 0) {
      dragCounterRef.current[status] = 0;
      if (dragOverColumn === status) setDragOverColumn(null);
    }
  };

  const handleDrop = (status: GoalStatus) => {
    if (dragGoalId) {
      const goal = data.goals.find(g => g.id === dragGoalId);
      if (goal && goal.status !== status) {
        onUpdateStatus(dragGoalId, status);
      }
    }
    handleDragEnd();
  };

  // Filter columns based on status tab
  const visibleColumns = statusTab === 'all'
    ? COLUMNS
    : statusTab === 'active'
      ? COLUMNS.filter(c => c.status === 'active' || c.status === 'paused')
      : COLUMNS.filter(c => c.status === 'completed' || c.status === 'abandoned');

  const renderCard = (goal: Goal) => {
    const completion = getGoalCompletion(goal);
    const timeLeft = goal.targetDate ? getTimeRemaining(goal) : null;
    const tasks = getTasksLabel(goal);
    const lifeArea = data.lifeAreas.find(a => a.id === goal.lifeAreaId);

    return (
      <div
        key={goal.id}
        className={`gt-board-card ${dragGoalId === goal.id ? 'dragging' : ''}`}
        draggable
        onDragStart={() => handleDragStart(goal.id)}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectGoal(goal.id)}
      >
        <div className="gt-board-card-header">
          <span className="gt-board-card-icon" style={{ color: goal.color }}>
            <GoalIcon name={goal.icon} size={16} />
          </span>
          <span className="gt-board-card-name">{goal.name}</span>
        </div>
        <div className="gt-board-card-meta">
          {lifeArea && (
            <span className="gt-board-card-area" style={{ color: lifeArea.color }}>
              {lifeArea.name}
            </span>
          )}
          <PriorityBadge priority={goal.priority} />
        </div>
        <ProgressBar value={completion} color={goal.color} height={4} />
        <div className="gt-board-card-footer">
          <span className="gt-board-card-pct">{completion}%</span>
          <span className="gt-board-card-tasks">{tasks} tasks</span>
          {timeLeft && (
            <span className={`gt-board-card-time ${timeLeft.overdue ? 'overdue' : ''}`}>
              {timeLeft.label}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="gt-board-view">
      {visibleColumns.map(col => {
        const goals = getColumnGoals(col.status);
        return (
          <div
            key={col.status}
            className={`gt-board-column ${dragOverColumn === col.status ? 'drag-over' : ''}`}
            onDragOver={e => e.preventDefault()}
            onDragEnter={() => handleDragEnter(col.status)}
            onDragLeave={() => handleDragLeave(col.status)}
            onDrop={() => handleDrop(col.status)}
          >
            <div className="gt-board-column-header">
              <span className="gt-board-column-dot" style={{ background: col.color }} />
              <span className="gt-board-column-title">{col.label}</span>
              <span className="gt-board-column-count">{goals.length}</span>
            </div>
            <div className="gt-board-cards">
              {goals.map(g => renderCard(g))}
              {goals.length === 0 && (
                <div className="gt-board-empty">
                  {dragGoalId ? 'Drop here' : 'No goals'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
