import type { GoalPriority } from '../../types/goal.ts';

interface PriorityBadgeProps {
  priority: GoalPriority;
}

const PRIORITY_CONFIG: Record<GoalPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'priority-low' },
  medium: { label: 'Med', className: 'priority-medium' },
  high: { label: 'High', className: 'priority-high' },
  critical: { label: 'Crit', className: 'priority-critical' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={`priority-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
