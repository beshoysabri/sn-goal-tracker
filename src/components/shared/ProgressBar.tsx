interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color, height = 6 }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const barColor = color || 'var(--gt-accent)';

  return (
    <div className="progress-bar" style={{ height }}>
      <div
        className="progress-bar-fill"
        style={{ width: `${pct}%`, background: barColor }}
      />
    </div>
  );
}
