import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Goal, GoalTrackerData, GoalStatus, GoalTask } from '../types/goal.ts';
import { GoalIcon } from '../lib/icons.tsx';
import { getGoalCompletion } from '../lib/data.ts';
import { getTimeRemaining, getDaysActive, getTasksLabel } from '../lib/stats.ts';
import { todayStr, formatDateShort } from '../lib/calendar.ts';
import { ProgressCircle } from './shared/ProgressCircle.tsx';
import { ProgressBar } from './shared/ProgressBar.tsx';
import { PriorityBadge } from './shared/PriorityBadge.tsx';
import { StatsCard } from './shared/StatsCard.tsx';

interface GoalDetailProps {
  goal: Goal;
  data: GoalTrackerData;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUpdateGoal: (updated: Goal) => void;
}

const STATUS_OPTIONS: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
];

export function GoalDetail({ goal, data, onBack, onEdit, onDelete, onArchive, onUpdateGoal }: GoalDetailProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [progressInput, setProgressInput] = useState('');
  const [progressNote, setProgressNote] = useState('');

  const completion = getGoalCompletion(goal);
  const timeLeft = goal.targetDate ? getTimeRemaining(goal) : null;
  const daysActive = getDaysActive(goal);
  const tasksLabel = getTasksLabel(goal);
  const lifeArea = data.lifeAreas.find(a => a.id === goal.lifeAreaId);
  const parentGoal = goal.parentGoalId ? data.goals.find(g => g.id === goal.parentGoalId) : null;
  const subGoals = data.goals.filter(g => g.parentGoalId === goal.id && !g.archived);

  const handleStatusChange = (status: GoalStatus) => {
    const updated = { ...goal, status, updatedAt: new Date().toISOString() };
    if (status === 'completed') updated.completedDate = todayStr();
    else updated.completedDate = undefined;
    onUpdateGoal(updated);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: GoalTask = {
      id: uuid(),
      title: newTaskTitle.trim(),
      completed: false,
      sortOrder: Date.now(),
    };
    onUpdateGoal({
      ...goal,
      tasks: [...goal.tasks, task],
      updatedAt: new Date().toISOString(),
    });
    setNewTaskTitle('');
  };

  const handleToggleTask = (taskId: string) => {
    onUpdateGoal({
      ...goal,
      tasks: goal.tasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateGoal({
      ...goal,
      tasks: goal.tasks.filter(t => t.id !== taskId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddProgress = () => {
    const value = Number(progressInput);
    if (isNaN(value)) return;

    if (goal.trackingType === 'numeric') {
      onUpdateGoal({
        ...goal,
        currentValue: value,
        progressEntries: [...goal.progressEntries, {
          date: todayStr(),
          value,
          note: progressNote || undefined,
        }],
        updatedAt: new Date().toISOString(),
      });
    } else if (goal.trackingType === 'percentage') {
      onUpdateGoal({
        ...goal,
        progressEntries: [...goal.progressEntries, {
          date: todayStr(),
          value: Math.min(100, Math.max(0, value)),
          note: progressNote || undefined,
        }],
        updatedAt: new Date().toISOString(),
      });
    }
    setProgressInput('');
    setProgressNote('');
  };

  return (
    <div className="gt-detail">
      <div className="gt-detail-top">
        <button className="gt-icon-btn gt-detail-back" onClick={onBack} title="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className="gt-detail-header">
        <div className="gt-detail-icon" style={{ color: goal.color }}>
          <GoalIcon name={goal.icon} size={32} />
        </div>
        <div className="gt-detail-info">
          <h2 className="gt-detail-name">{goal.name}</h2>
          {goal.description && <p className="gt-detail-desc">{goal.description}</p>}
          <div className="gt-detail-meta">
            {lifeArea && (
              <span className="gt-detail-area" style={{ color: lifeArea.color }}>
                <GoalIcon name={lifeArea.icon} size={12} /> {lifeArea.name}
              </span>
            )}
            {parentGoal && (
              <span className="gt-detail-parent">
                Sub-goal of: {parentGoal.name}
              </span>
            )}
            <PriorityBadge priority={goal.priority} />
          </div>
        </div>
        <div className="gt-detail-completion">
          <ProgressCircle value={completion} size={64} strokeWidth={4} color={goal.color} />
        </div>
      </div>

      <div className="gt-detail-actions">
        <select
          className="form-select gt-detail-status-select"
          value={goal.status}
          onChange={e => handleStatusChange(e.target.value as GoalStatus)}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button className="btn-secondary" onClick={onEdit}>Edit</button>
        <button className="btn-secondary" onClick={onArchive}>
          {goal.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button className="btn-danger" onClick={onDelete}>Delete</button>
      </div>

      <div className="gt-detail-stats">
        <StatsCard label="Completion" value={`${completion}%`} />
        <StatsCard label="Time Left" value={timeLeft?.label || 'No deadline'} sub={timeLeft?.overdue ? 'Overdue!' : undefined} />
        <StatsCard label="Days Active" value={daysActive} />
        <StatsCard label="Tasks" value={tasksLabel} />
      </div>

      {/* Progress Bar */}
      <div className="gt-detail-progress-section">
        <h3>Progress</h3>
        <ProgressBar value={completion} color={goal.color} height={10} />
        {goal.trackingType === 'numeric' && (
          <div className="gt-detail-numeric">
            <span>{goal.currentValue ?? 0} / {goal.targetValue} {goal.unit}</span>
          </div>
        )}
      </div>

      {/* Update Progress (numeric/percentage only) */}
      {(goal.trackingType === 'numeric' || goal.trackingType === 'percentage') && (
        <div className="gt-detail-update-progress">
          <h3>Update Progress</h3>
          <div className="gt-detail-progress-form">
            <input
              className="form-input"
              type="number"
              value={progressInput}
              onChange={e => setProgressInput(e.target.value)}
              placeholder={goal.trackingType === 'numeric' ? `Current ${goal.unit || 'value'}` : '0-100%'}
            />
            <input
              className="form-input"
              type="text"
              value={progressNote}
              onChange={e => setProgressNote(e.target.value)}
              placeholder="Note (optional)"
            />
            <button className="btn-primary" onClick={handleAddProgress}>Update</button>
          </div>
        </div>
      )}

      {/* Tasks (checklist) */}
      <div className="gt-detail-tasks">
        <h3>Tasks ({goal.tasks.filter(t => t.completed).length}/{goal.tasks.length})</h3>
        <div className="gt-detail-task-list">
          {goal.tasks.sort((a, b) => a.sortOrder - b.sortOrder).map(task => (
            <div key={task.id} className={`gt-detail-task-item ${task.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleTask(task.id)}
              />
              <span className="gt-detail-task-title">{task.title}</span>
              <button
                className="gt-icon-btn gt-detail-task-delete"
                onClick={() => handleDeleteTask(task.id)}
                title="Delete task"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="gt-detail-task-add">
          <input
            className="form-input"
            type="text"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Add a task..."
            onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
          />
          <button className="btn-secondary" onClick={handleAddTask}>Add</button>
        </div>
      </div>

      {/* Sub-goals */}
      {subGoals.length > 0 && (
        <div className="gt-detail-subgoals">
          <h3>Sub-goals</h3>
          {subGoals.map(sg => (
            <div key={sg.id} className="gt-detail-subgoal-item">
              <span style={{ color: sg.color }}><GoalIcon name={sg.icon} size={14} /></span>
              <span>{sg.name}</span>
              <ProgressBar value={getGoalCompletion(sg)} color={sg.color} height={4} />
              <span className="gt-detail-subgoal-pct">{getGoalCompletion(sg)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Progress History */}
      {goal.progressEntries.length > 0 && (
        <div className="gt-detail-history">
          <h3>Progress History</h3>
          <div className="gt-detail-history-list">
            {[...goal.progressEntries].reverse().slice(0, 20).map((entry, i) => (
              <div key={i} className="gt-detail-history-item">
                <span className="gt-detail-history-date">{formatDateShort(entry.date)}</span>
                <span className="gt-detail-history-value">
                  {goal.trackingType === 'percentage' ? `${entry.value}%` : `${entry.value} ${goal.unit || ''}`}
                </span>
                {entry.note && <span className="gt-detail-history-note">{entry.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
