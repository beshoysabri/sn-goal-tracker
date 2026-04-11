import { useState } from 'react';
import { DEFAULT_LIFE_AREAS, createLifeArea } from '../lib/data.ts';
import { GoalIcon } from '../lib/icons.tsx';
import type { LifeArea } from '../types/goal.ts';

interface SetupProps {
  onConfirm: (lifeAreas: LifeArea[]) => void;
}

export function Setup({ onConfirm }: SetupProps) {
  const [selected, setSelected] = useState<boolean[]>(
    DEFAULT_LIFE_AREAS.map(() => true)
  );

  const toggle = (idx: number) => {
    setSelected(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleStart = () => {
    const areas = DEFAULT_LIFE_AREAS
      .filter((_, i) => selected[i])
      .map(a => createLifeArea(a));
    onConfirm(areas);
  };

  const anySelected = selected.some(Boolean);

  return (
    <div className="gt-setup">
      <div className="gt-setup-card">
        <div className="gt-setup-icon">
          <GoalIcon name="target" size={48} />
        </div>
        <h1 className="gt-setup-title">Goal Tracker</h1>
        <p className="gt-setup-desc">
          Track your goals across different areas of life. Select which life areas you'd like to start with.
        </p>
        <div className="gt-setup-areas">
          {DEFAULT_LIFE_AREAS.map((area, i) => (
            <label key={area.name} className="gt-setup-area-item" onClick={() => toggle(i)}>
              <input
                type="checkbox"
                checked={selected[i]}
                onChange={() => toggle(i)}
              />
              <span
                className="gt-setup-area-dot"
                style={{ background: area.color }}
              />
              <span className="gt-setup-area-name">{area.name}</span>
            </label>
          ))}
        </div>
        <button
          className="btn-primary gt-setup-btn"
          onClick={handleStart}
          disabled={!anySelected}
        >
          Start Tracking
        </button>
      </div>
    </div>
  );
}
