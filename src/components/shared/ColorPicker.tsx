import { useRef } from 'react';
import { GOAL_COLORS } from '../../lib/colors.ts';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPreset = GOAL_COLORS.some(c => c.hex.toLowerCase() === value?.toLowerCase());

  return (
    <div className="color-picker">
      {/* Current color preview */}
      <div className="color-preview" style={{ background: value || '#888' }} title={value || 'No color'} />
      {/* Preset swatches */}
      {GOAL_COLORS.map(c => (
        <button
          key={c.hex}
          type="button"
          className={`color-swatch ${value?.toLowerCase() === c.hex.toLowerCase() ? 'selected' : ''}`}
          style={{ background: c.hex }}
          onClick={() => onChange(c.hex)}
          title={c.name}
        />
      ))}
      {/* Custom color picker */}
      <button
        type="button"
        className={`color-swatch custom-color ${!isPreset && value ? 'selected' : ''}`}
        onClick={() => inputRef.current?.click()}
        title="Custom color"
        style={!isPreset && value ? { background: value } : undefined}
      >
        {(isPreset || !value) && <span style={{ fontSize: 11, color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>+</span>}
      </button>
      <input
        ref={inputRef}
        type="color"
        className="hidden-color-input"
        value={value || '#32769B'}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
