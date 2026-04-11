interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressCircle({ value, size = 40, strokeWidth = 3, color }: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const displayColor = color || (value >= 100 ? 'var(--gt-success)' : value >= 50 ? 'var(--gt-accent)' : value >= 25 ? 'var(--gt-warning)' : 'var(--gt-danger)');

  return (
    <div className="progress-circle" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="progress-circle-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--gt-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-circle-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={displayColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="progress-circle-text" style={{ fontSize: size * 0.26 }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}
