import { ICON_LIST, GoalIcon } from '../../lib/icons.tsx';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const CATEGORIES = [...new Set(ICON_LIST.map(i => i.category))];

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="icon-picker">
      {CATEGORIES.map(cat => (
        <div key={cat} className="icon-picker-category">
          <div className="icon-picker-category-label">{cat}</div>
          <div className="icon-picker-grid">
            {ICON_LIST.filter(i => i.category === cat).map(icon => (
              <button
                key={icon.name}
                type="button"
                className={`icon-picker-btn ${value === icon.name ? 'selected' : ''}`}
                onClick={() => onChange(icon.name)}
                title={icon.label}
              >
                <GoalIcon name={icon.name} size={18} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
