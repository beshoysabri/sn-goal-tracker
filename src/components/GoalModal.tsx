import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from './shared/Modal.tsx';
import { ColorPicker } from './shared/ColorPicker.tsx';
import { IconPicker } from './shared/IconPicker.tsx';
import { DEFAULT_GOAL_COLOR } from '../lib/colors.ts';
import { DEFAULT_ICON } from '../lib/icons.tsx';
import { todayStr } from '../lib/calendar.ts';
import type { Goal, LifeArea, TrackingType, GoalPriority } from '../types/goal.ts';

interface GoalModalProps {
  goal?: Goal;
  lifeAreas: LifeArea[];
  goals: Goal[];
  defaultParentGoalId?: string;
  defaultLifeAreaId?: string;
  onSave: (goal: Goal) => void;
  onClose: () => void;
}

export function GoalModal({ goal, lifeAreas, goals, defaultParentGoalId, defaultLifeAreaId, onSave, onClose }: GoalModalProps) {
  const isEdit = !!goal;

  const [name, setName] = useState(goal?.name || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [icon, setIcon] = useState(goal?.icon || DEFAULT_ICON);
  const [lifeAreaId, setLifeAreaId] = useState(goal?.lifeAreaId || defaultLifeAreaId || '');
  const [parentGoalId, setParentGoalId] = useState(goal?.parentGoalId || defaultParentGoalId || '');
  const [trackingType, setTrackingType] = useState<TrackingType>(goal?.trackingType || 'checklist');
  const [targetValue, setTargetValue] = useState(goal?.targetValue ?? 100);
  const [unit, setUnit] = useState(goal?.unit || '');
  const [priority, setPriority] = useState<GoalPriority>(goal?.priority || 'medium');
  const [startDate, setStartDate] = useState(goal?.startDate || todayStr());
  const [targetDate, setTargetDate] = useState(goal?.targetDate || '');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [colorManuallySet, setColorManuallySet] = useState(false);

  // Compute inherited color from parent goal or life area
  const getInheritedColor = (pId: string, aId: string): string => {
    if (pId) {
      const parent = goals.find(g => g.id === pId);
      if (parent?.color) return parent.color;
    }
    if (aId) {
      const area = lifeAreas.find(a => a.id === aId);
      if (area?.color) return area.color;
    }
    return DEFAULT_GOAL_COLOR;
  };

  // Initial color: for edits use goal's color, for new goals inherit
  const [color, setColor] = useState(() => {
    if (goal?.color) return goal.color;
    return getInheritedColor(defaultParentGoalId || '', defaultLifeAreaId || '');
  });

  // Auto-update color when life area or parent changes (only for new goals, only if user hasn't manually picked)
  useEffect(() => {
    if (isEdit || colorManuallySet) return;
    const inherited = getInheritedColor(parentGoalId, lifeAreaId);
    setColor(inherited);
  }, [lifeAreaId, parentGoalId, isEdit, colorManuallySet]);

  const canSave = name.trim().length > 0;

  const parentCandidates = goals.filter(g =>
    !g.archived &&
    !g.parentGoalId &&
    g.id !== goal?.id &&
    (!lifeAreaId || g.lifeAreaId === lifeAreaId)
  );

  const handleSave = () => {
    if (!canSave) return;

    const now = new Date().toISOString();
    const saved: Goal = {
      id: goal?.id || uuid(),
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      lifeAreaId: lifeAreaId || undefined,
      parentGoalId: parentGoalId || undefined,
      status: goal?.status || 'active',
      priority,
      trackingType,
      targetValue: trackingType === 'numeric' ? targetValue : undefined,
      currentValue: goal?.currentValue ?? (trackingType === 'numeric' ? 0 : undefined),
      unit: trackingType === 'numeric' ? unit : undefined,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
      completedDate: goal?.completedDate,
      notes: goal?.notes || '',
      tasks: goal?.tasks || [],
      progressEntries: goal?.progressEntries || [],
      sortOrder: goal?.sortOrder || Date.now(),
      archived: goal?.archived || false,
      createdAt: goal?.createdAt || now,
      updatedAt: now,
    };

    onSave(saved);
  };

  return (
    <Modal
      title={isEdit ? 'Edit Goal' : parentGoalId ? 'New Sub-goal' : 'New Goal'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {isEdit ? 'Save' : 'Create'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label>Name</label>
        <input
          className="form-input"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={parentGoalId ? 'e.g. Complete Phase 1' : 'e.g. Learn Spanish'}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          className="form-textarea"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What does achieving this look like?"
          rows={2}
        />
      </div>

      <div className="form-row">
        <div className="form-group form-group-half">
          <label>Icon</label>
          <button
            type="button"
            className="form-icon-btn"
            onClick={() => setShowIconPicker(!showIconPicker)}
          >
            <span style={{ color }}><GoalIconInline name={icon} /></span>
            <span className="form-icon-label">Change</span>
          </button>
          {showIconPicker && (
            <div className="form-icon-picker-dropdown">
              <IconPicker value={icon} onChange={(v) => { setIcon(v); setShowIconPicker(false); }} />
            </div>
          )}
        </div>
        <div className="form-group form-group-half">
          <label>Color {!isEdit && !colorManuallySet && <span style={{ fontSize: 10, color: 'var(--gt-muted)' }}>(auto)</span>}</label>
          <ColorPicker value={color} onChange={(c) => { setColor(c); setColorManuallySet(true); }} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group form-group-half">
          <label>Life Area</label>
          <select className="form-select" value={lifeAreaId} onChange={e => {
            setLifeAreaId(e.target.value);
            setParentGoalId('');
          }}>
            <option value="">None</option>
            {lifeAreas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group form-group-half">
          <label>Parent Goal</label>
          <select className="form-select" value={parentGoalId} onChange={e => setParentGoalId(e.target.value)}>
            <option value="">None (top-level)</option>
            {parentCandidates.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group form-group-half">
          <label>Tracking Type</label>
          <select className="form-select" value={trackingType} onChange={e => setTrackingType(e.target.value as TrackingType)}>
            <option value="checklist">Checklist (tasks)</option>
            <option value="percentage">Percentage (0-100%)</option>
            <option value="numeric">Numeric (current / target)</option>
            <option value="boolean">Boolean (done / not done)</option>
          </select>
        </div>
        <div className="form-group form-group-half">
          <label>Priority</label>
          <select className="form-select" value={priority} onChange={e => setPriority(e.target.value as GoalPriority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {trackingType === 'numeric' && (
        <div className="form-row">
          <div className="form-group form-group-half">
            <label>Target Value</label>
            <input
              className="form-input"
              type="number"
              value={targetValue}
              onChange={e => setTargetValue(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className="form-group form-group-half">
            <label>Unit</label>
            <input
              className="form-input"
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="e.g. km, books, hours"
            />
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group form-group-half">
          <label>Start Date</label>
          <input
            className="form-input form-date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="form-group form-group-half">
          <label>Target Date</label>
          <input
            className="form-input form-date"
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

import { GoalIcon as GoalIconComponent } from '../lib/icons.tsx';
function GoalIconInline({ name }: { name: string }) {
  return <GoalIconComponent name={name} size={20} />;
}
