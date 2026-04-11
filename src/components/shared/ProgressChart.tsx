import { useMemo, useState } from 'react';
import type { Goal } from '../../types/goal.ts';
import { fromDateStr, todayStr, getShortMonthName } from '../../lib/calendar.ts';
import { hexToRgba } from '../../lib/colors.ts';

interface ProgressChartProps {
  goal: Goal;
  height?: number;
}

const PADDING = { top: 20, right: 16, bottom: 28, left: 40 };

export function ProgressChart({ goal, height = 180 }: ProgressChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const entries = [...goal.progressEntries].sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length === 0) return null;

    // Determine axis ranges
    const startDate = goal.startDate || entries[0].date;
    const endDate = goal.targetDate || todayStr();
    const startMs = fromDateStr(startDate).getTime();
    const endMs = Math.max(fromDateStr(endDate).getTime(), fromDateStr(todayStr()).getTime());
    const timeSpan = Math.max(endMs - startMs, 86400000); // min 1 day

    const maxVal = goal.trackingType === 'percentage' ? 100
      : goal.targetValue ? Math.max(goal.targetValue, ...entries.map(e => e.value))
      : Math.max(...entries.map(e => e.value), 1);

    const minVal = 0;
    const valRange = maxVal - minVal || 1;

    // Chart inner dimensions
    const width = 100; // SVG viewBox percentage-based
    const innerW = width - PADDING.left - PADDING.right;
    const innerH = height - PADDING.top - PADDING.bottom;

    // Map entries to SVG coordinates
    const points = entries.map(e => {
      const ms = fromDateStr(e.date).getTime();
      const x = PADDING.left + ((ms - startMs) / timeSpan) * innerW;
      const y = PADDING.top + innerH - ((e.value - minVal) / valRange) * innerH;
      return { x, y, date: e.date, value: e.value, note: e.note };
    });

    // Target line (diagonal from start=0 to end=target)
    const targetY0 = PADDING.top + innerH; // bottom (0)
    const targetY1 = PADDING.top; // top (target)

    // Today marker
    const todayMs = new Date().getTime();
    const todayX = PADDING.left + ((todayMs - startMs) / timeSpan) * innerW;

    // Grid lines (4 horizontal)
    const gridLines = [0.25, 0.5, 0.75, 1].map(frac => ({
      y: PADDING.top + innerH - frac * innerH,
      label: goal.trackingType === 'percentage'
        ? `${Math.round(frac * 100)}%`
        : String(Math.round(minVal + frac * valRange)),
    }));

    // X-axis labels (month ticks)
    const xLabels: { x: number; label: string }[] = [];
    const sd = fromDateStr(startDate);
    const ed = new Date(endMs);
    const monthSpan = (ed.getFullYear() - sd.getFullYear()) * 12 + (ed.getMonth() - sd.getMonth());
    const step = monthSpan <= 6 ? 1 : monthSpan <= 18 ? 3 : 6;
    for (let m = sd.getMonth(); ; m += step) {
      const d = new Date(sd.getFullYear(), m, 1);
      if (d.getTime() > endMs + 86400000 * 30) break;
      const mx = PADDING.left + ((d.getTime() - startMs) / timeSpan) * innerW;
      if (mx >= PADDING.left - 5 && mx <= width - PADDING.right + 5) {
        xLabels.push({ x: mx, label: getShortMonthName(d.getMonth()) });
      }
      if (xLabels.length > 12) break;
    }

    // Build path strings
    const linePath = points.length > 0
      ? 'M ' + points.map(p => `${p.x},${p.y}`).join(' L ')
      : '';

    const areaPath = points.length > 0
      ? linePath + ` L ${points[points.length - 1].x},${PADDING.top + innerH} L ${points[0].x},${PADDING.top + innerH} Z`
      : '';

    return {
      points, linePath, areaPath, gridLines, xLabels,
      targetY0, targetY1, todayX, width, innerH,
      startX: PADDING.left, endX: PADDING.left + innerW,
      maxVal,
    };
  }, [goal, height]);

  if (!chartData || chartData.points.length === 0) {
    return (
      <div className="gt-chart-empty">
        <span>Add progress entries to see the chart</span>
      </div>
    );
  }

  const { points, linePath, areaPath, gridLines, xLabels, targetY0, targetY1, todayX, width, startX, endX } = chartData;
  const color = goal.color || '#32769B';

  return (
    <div className="gt-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="gt-chart-svg"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={startX} y1={g.y} x2={endX} y2={g.y} stroke="var(--gt-border)" strokeWidth="0.3" />
            <text x={startX - 4} y={g.y + 1} textAnchor="end" className="gt-chart-label-y">{g.label}</text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={height - 6} textAnchor="middle" className="gt-chart-label-x">{l.label}</text>
        ))}

        {/* Target line (diagonal) */}
        {goal.targetValue && goal.targetValue > 0 && (
          <line x1={startX} y1={targetY0} x2={endX} y2={targetY1}
            stroke="var(--gt-muted)" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
        )}

        {/* Filled area under line */}
        <path d={areaPath} fill={hexToRgba(color, 0.15)} />

        {/* Progress line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Today marker */}
        {todayX > startX && todayX < endX && (
          <line x1={todayX} y1={PADDING.top - 4} x2={todayX} y2={PADDING.top + chartData.innerH}
            stroke="var(--gt-danger)" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.6" />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={hoveredIdx === i ? 2.5 : 1.5}
            fill={color}
            stroke={hoveredIdx === i ? '#fff' : 'none'}
            strokeWidth="0.5"
            className="gt-chart-point"
            onMouseEnter={() => setHoveredIdx(i)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div className="gt-chart-tooltip" style={{
          left: `${(points[hoveredIdx].x / width) * 100}%`,
          top: `${(points[hoveredIdx].y / height) * 100 - 8}%`,
        }}>
          <strong>{points[hoveredIdx].value}{goal.trackingType === 'percentage' ? '%' : ` ${goal.unit || ''}`}</strong>
          <span>{points[hoveredIdx].date}</span>
          {points[hoveredIdx].note && <em>{points[hoveredIdx].note}</em>}
        </div>
      )}
    </div>
  );
}
