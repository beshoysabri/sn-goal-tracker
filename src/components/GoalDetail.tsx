import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Goal, GoalTrackerData, GoalStatus, GoalTask } from '../types/goal.ts';
import { GoalIcon } from '../lib/icons.tsx';
import { getGoalCompletion } from '../lib/data.ts';
import { getTimeRemaining, getDaysActive } from '../lib/stats.ts';
import { todayStr, formatDateShort } from '../lib/calendar.ts';
import { ProgressCircle } from './shared/ProgressCircle.tsx';
import { PriorityBadge } from './shared/PriorityBadge.tsx';
import { hexToRgba } from '../lib/colors.ts';

interface GoalDetailProps {
  goal: Goal;
  data: GoalTrackerData;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUpdateGoal: (updated: Goal) => void;
}

const STATUS_OPTIONS: { value: GoalStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'var(--gt-success)' },
  { value: 'paused', label: 'Paused', color: 'var(--gt-warning)' },
  { value: 'completed', label: 'Completed', color: 'var(--gt-accent)' },
  { value: 'abandoned', label: 'Abandoned', color: 'var(--gt-muted)' },
];

export function GoalDetail({ goal, data, onBack, onEdit, onDelete, onArchive, onUpdateGoal }: GoalDetailProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [progressInput, setProgressInput] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(goal.notes || '');

  const completion = getGoalCompletion(goal);
  const timeLeft = goal.targetDate ? getTimeRemaining(goal) : null;
  const daysActive = getDaysActive(goal);
  const lifeArea = data.lifeAreas.find(a => a.id === goal.lifeAreaId);
  const parentGoal = goal.parentGoalId ? data.goals.find(g => g.id === goal.parentGoalId) : null;
  const subGoals = data.goals.filter(g => g.parentGoalId === goal.id && !g.archived);
  const doneTasks = goal.tasks.filter(t => t.completed).length;

  const handleStatusChange = (status: GoalStatus) => {
    const updated = { ...goal, status, updatedAt: new Date().toISOString() };
    if (status === 'completed') updated.completedDate = todayStr();
    else updated.completedDate = undefined;
    onUpdateGoal(updated);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: GoalTask = { id: uuid(), title: newTaskTitle.trim(), completed: false, sortOrder: Date.now() };
    onUpdateGoal({ ...goal, tasks: [...goal.tasks, task], updatedAt: new Date().toISOString() });
    setNewTaskTitle('');
  };

  const handleToggleTask = (taskId: string) => {
    onUpdateGoal({
      ...goal,
      tasks: goal.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateGoal({ ...goal, tasks: goal.tasks.filter(t => t.id !== taskId), updatedAt: new Date().toISOString() });
  };

  const handleSaveNotes = () => {
    onUpdateGoal({ ...goal, notes: notesValue, updatedAt: new Date().toISOString() });
    setEditingNotes(false);
  };

  const handleAddProgress = () => {
    const value = Number(progressInput);
    if (isNaN(value)) return;
    if (goal.trackingType === 'numeric') {
      onUpdateGoal({
        ...goal, currentValue: value,
        progressEntries: [...goal.progressEntries, { date: todayStr(), value, note: progressNote || undefined }],
        updatedAt: new Date().toISOString(),
      });
    } else if (goal.trackingType === 'percentage') {
      onUpdateGoal({
        ...goal,
        progressEntries: [...goal.progressEntries, { date: todayStr(), value: Math.min(100, Math.max(0, value)), note: progressNote || undefined }],
        updatedAt: new Date().toISOString(),
      });
    }
    setProgressInput('');
    setProgressNote('');
  };

  return (
    <div className="gt-detail">
      {/* Top bar with back + actions */}
      <div className="gt-detail-topbar">
        <button className="gt-detail-back" onClick={onBack} title="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          <span>Back</span>
        </button>
        <div className="gt-detail-topbar-actions">
          <button className="gt-detail-action-btn" onClick={onEdit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
            Edit
          </button>
          <button className="gt-detail-action-btn" onClick={onArchive}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /></svg>
            {goal.archived ? 'Restore' : 'Archive'}
          </button>
          <button className="gt-detail-action-btn danger" onClick={onDelete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            Delete
          </button>
        </div>
      </div>

      {/* Hero header */}
      <div className="gt-detail-hero" style={{ borderColor: hexToRgba(goal.color, 0.3) }}>
        <div className="gt-detail-hero-left">
          <div className="gt-detail-hero-icon" style={{ background: hexToRgba(goal.color, 0.12), color: goal.color }}>
            <GoalIcon name={goal.icon} size={28} />
          </div>
          <div className="gt-detail-hero-info">
            <h1 className="gt-detail-hero-name">{goal.name}</h1>
            <div className="gt-detail-hero-meta">
              {lifeArea && (
                <span className="gt-detail-tag" style={{ background: hexToRgba(lifeArea.color, 0.12), color: lifeArea.color }}>
                  <GoalIcon name={lifeArea.icon} size={11} /> {lifeArea.name}
                </span>
              )}
              <PriorityBadge priority={goal.priority} />
              <span className={`gt-detail-status-pill ${goal.status}`}>
                {STATUS_OPTIONS.find(s => s.value === goal.status)?.label}
              </span>
              {parentGoal && <span className="gt-detail-tag muted">Sub-goal of {parentGoal.name}</span>}
            </div>
            {goal.description && <p className="gt-detail-hero-desc">{goal.description}</p>}
          </div>
        </div>
        <div className="gt-detail-hero-right">
          <ProgressCircle value={completion} size={80} strokeWidth={5} color={goal.color} />
        </div>
      </div>

      {/* Quick stats row */}
      <div className="gt-detail-quick-stats">
        <div className="gt-detail-stat">
          <span className="gt-detail-stat-value" style={{ color: goal.color }}>{completion}%</span>
          <span className="gt-detail-stat-label">Complete</span>
        </div>
        <div className="gt-detail-stat-divider" />
        <div className="gt-detail-stat">
          <span className={`gt-detail-stat-value ${timeLeft?.overdue ? 'overdue' : ''}`}>
            {timeLeft?.label || '-'}
          </span>
          <span className="gt-detail-stat-label">Time left</span>
        </div>
        <div className="gt-detail-stat-divider" />
        <div className="gt-detail-stat">
          <span className="gt-detail-stat-value">{daysActive}</span>
          <span className="gt-detail-stat-label">Days active</span>
        </div>
        <div className="gt-detail-stat-divider" />
        <div className="gt-detail-stat">
          <span className="gt-detail-stat-value">{doneTasks}/{goal.tasks.length}</span>
          <span className="gt-detail-stat-label">Tasks</span>
        </div>
        {goal.startDate && (
          <>
            <div className="gt-detail-stat-divider" />
            <div className="gt-detail-stat">
              <span className="gt-detail-stat-value">{formatDateShort(goal.startDate)}</span>
              <span className="gt-detail-stat-label">Started</span>
            </div>
          </>
        )}
        {goal.targetDate && (
          <>
            <div className="gt-detail-stat-divider" />
            <div className="gt-detail-stat">
              <span className={`gt-detail-stat-value ${timeLeft?.overdue ? 'overdue' : ''}`}>
                {formatDateShort(goal.targetDate)}
              </span>
              <span className="gt-detail-stat-label">Deadline</span>
            </div>
          </>
        )}
      </div>

      {/* Status change */}
      <div className="gt-detail-status-row">
        <span className="gt-detail-status-label">Status</span>
        <div className="gt-detail-status-options">
          {STATUS_OPTIONS.map(o => (
            <button
              key={o.value}
              className={`gt-detail-status-btn ${goal.status === o.value ? 'active' : ''}`}
              style={goal.status === o.value ? { background: hexToRgba(o.color, 0.15), color: o.color, borderColor: o.color } : undefined}
              onClick={() => handleStatusChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout for tasks + notes */}
      <div className="gt-detail-columns">
        {/* Left column: Progress + Tasks */}
        <div className="gt-detail-col">
          {/* Progress section */}
          <div className="gt-detail-section">
            <div className="gt-detail-section-header">
              <h3>Progress</h3>
              {goal.trackingType === 'numeric' && (
                <span className="gt-detail-section-badge">{goal.currentValue ?? 0} / {goal.targetValue} {goal.unit}</span>
              )}
            </div>
            <div className="gt-detail-progress-track">
              <div className="gt-detail-progress-fill" style={{ width: `${completion}%`, background: goal.color }} />
            </div>

            {(goal.trackingType === 'numeric' || goal.trackingType === 'percentage') && (
              <div className="gt-detail-progress-update">
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
                <button className="btn-primary btn-sm" onClick={handleAddProgress}>Update</button>
              </div>
            )}
          </div>

          {/* Tasks section */}
          <div className="gt-detail-section">
            <div className="gt-detail-section-header">
              <h3>Tasks</h3>
              <span className="gt-detail-section-badge">{doneTasks}/{goal.tasks.length}</span>
            </div>
            <div className="gt-detail-task-list">
              {goal.tasks.sort((a, b) => a.sortOrder - b.sortOrder).map(task => (
                <label key={task.id} className={`gt-detail-task ${task.completed ? 'done' : ''}`}>
                  <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} />
                  <span className="gt-detail-task-text">{task.title}</span>
                  <button className="gt-detail-task-x" onClick={(e) => { e.preventDefault(); handleDeleteTask(task.id); }} title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </label>
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
              <button className="btn-secondary btn-sm" onClick={handleAddTask}>Add</button>
            </div>
          </div>

          {/* Sub-goals */}
          {subGoals.length > 0 && (
            <div className="gt-detail-section">
              <div className="gt-detail-section-header"><h3>Sub-goals</h3></div>
              {subGoals.map(sg => (
                <div key={sg.id} className="gt-detail-subgoal">
                  <span style={{ color: sg.color }}><GoalIcon name={sg.icon} size={14} /></span>
                  <span className="gt-detail-subgoal-name">{sg.name}</span>
                  <div className="gt-detail-subgoal-bar">
                    <div style={{ width: `${getGoalCompletion(sg)}%`, background: sg.color }} />
                  </div>
                  <span className="gt-detail-subgoal-pct">{getGoalCompletion(sg)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Notes + History */}
        <div className="gt-detail-col">
          {/* Notes / Content */}
          <div className="gt-detail-section">
            <div className="gt-detail-section-header">
              <h3>Notes</h3>
              {!editingNotes && (
                <button className="gt-detail-section-action" onClick={() => { setNotesValue(goal.notes || ''); setEditingNotes(true); }}>
                  {goal.notes ? 'Edit' : 'Add notes'}
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="gt-detail-notes-editor">
                <textarea
                  className="gt-detail-notes-textarea"
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  placeholder="Write your thoughts, plans, milestones, reflections..."
                  rows={8}
                  autoFocus
                />
                <div className="gt-detail-notes-actions">
                  <button className="btn-secondary btn-sm" onClick={() => setEditingNotes(false)}>Cancel</button>
                  <button className="btn-primary btn-sm" onClick={handleSaveNotes}>Save</button>
                </div>
              </div>
            ) : (
              <div className="gt-detail-notes-content" onClick={() => { setNotesValue(goal.notes || ''); setEditingNotes(true); }}>
                {goal.notes ? (
                  goal.notes.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)
                ) : (
                  <p className="gt-detail-notes-placeholder">Click to add notes, plans, or reflections...</p>
                )}
              </div>
            )}
          </div>

          {/* Progress History */}
          {goal.progressEntries.length > 0 && (
            <div className="gt-detail-section">
              <div className="gt-detail-section-header"><h3>History</h3></div>
              <div className="gt-detail-history">
                {[...goal.progressEntries].reverse().slice(0, 15).map((entry, i) => (
                  <div key={i} className="gt-detail-history-row">
                    <span className="gt-detail-history-date">{formatDateShort(entry.date)}</span>
                    <span className="gt-detail-history-val">
                      {goal.trackingType === 'percentage' ? `${entry.value}%` : `${entry.value} ${goal.unit || ''}`}
                    </span>
                    {entry.note && <span className="gt-detail-history-note">{entry.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
