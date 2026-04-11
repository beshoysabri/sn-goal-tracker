import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from './shared/Modal.tsx';
import { ColorPicker } from './shared/ColorPicker.tsx';
import { IconPicker } from './shared/IconPicker.tsx';
import { DEFAULT_GOAL_COLOR } from '../lib/colors.ts';
import type { LifeArea } from '../types/goal.ts';

interface LifeAreaModalProps {
  lifeArea?: LifeArea;
  onSave: (area: LifeArea) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function LifeAreaModal({ lifeArea, onSave, onDelete, onClose }: LifeAreaModalProps) {
  const isEdit = !!lifeArea;

  const [name, setName] = useState(lifeArea?.name || '');
  const [icon, setIcon] = useState(lifeArea?.icon || 'target');
  const [color, setColor] = useState(lifeArea?.color || DEFAULT_GOAL_COLOR);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: lifeArea?.id || uuid(),
      name: name.trim(),
      icon,
      color,
      sortOrder: lifeArea?.sortOrder ?? Date.now(),
    });
  };

  return (
    <Modal
      title={isEdit ? 'Edit Life Area' : 'New Life Area'}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div>
            {isEdit && onDelete && (
              <button className="btn-danger" onClick={onDelete}>Delete</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      }
    >
      <div className="form-group">
        <label>Name</label>
        <input
          className="form-input"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Work & Career"
          autoFocus
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
          <label>Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
    </Modal>
  );
}

import { GoalIcon as GoalIconComponent } from '../lib/icons.tsx';
function GoalIconInline({ name }: { name: string }) {
  return <GoalIconComponent name={name} size={20} />;
}
