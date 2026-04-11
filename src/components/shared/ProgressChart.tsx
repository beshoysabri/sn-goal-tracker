import { useMemo, useState } from 'react';
import type { Goal } from '../../types/goal.ts';
import { fromDateStr, todayStr, getShortMonthName } from '../../lib/calendar.ts';
import { hexToRgba } from '../../lib/colors.ts';

interface ProgressChartProps {
  goal: Goal;
  height?: number;
}

const PAD = { top: 20, right: 16, bottom: 28, left: 44 };

export function ProgressChart({ goal, height = 180 }: ProgressChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const entries = [...goal.progressEntries].sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length === 0) return null;

    // Time range
    const startDate = goal.startDate || entries[0].date;
    const endDate = goal.targetDate || todayStr();
    const startMs = fromDateStr(startDate).getTime();
    const endMs = Math.max(fromDateStr(endDate).getTime(), fromDateStr(todayStr()).getTime());
    const timeSpan = Math.max(endMs - startMs, 86400000);

    // Value range — fit to actual data
    const allVals = entries.map(e => e.value);
    const targetVal = goal.trackingType === 'percentage' ? 100 : (goal.targetValue || 0);
    const dataMin = Math.min(...allVals, targetVal > 0 ? targetVal : Infinity);
    const dataMax = Math.max(...allVals, targetVal > 0 ? targetVal : 0);

    // Add 10% padding to value range
    const rangePad = Math.max((dataMax - dataMin) * 0.1, 1);
    const minVal = goal.trackingType === 'percentage' ? 0 : Math.max(0, Math.floor(dataMin - rangePad));
    const maxVal = goal.trackingType === 'percentage' ? 100 : Math.ceil(dataMax + rangePad);
    const valRange = maxVal - minVal || 1;

    // SVG dimensions
    const W = 100;
    const innerW = W - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;

    // Map value to Y coordinate (higher value = higher on chart)
    const valToY = (v: number) => PAD.top + innerH - ((v - minVal) / valRange) * innerH;
    const timeToX = (ms: number) => PAD.left + ((ms - startMs) / timeSpan) * innerW;

    // Data points
    const points = entries.map(e => ({
      x: timeToX(fromDateStr(e.date).getTime()),
      y: valToY(e.value),
      date: e.date,
      value: e.value,
      note: e.note,
    }));

    // Target line: from first entry value at start date → target value at end date
    const firstVal = entries[0].value;
    const hasTarget = targetVal > 0;
    const targetStartY = valToY(firstVal);
    const targetEndY = hasTarget ? valToY(targetVal) : targetStartY;

    // Today marker
    const todayX = timeToX(new Date().getTime());

    // Grid lines (4 horizontal, evenly spaced)
    const gridLines = [0.25, 0.5, 0.75, 1].map(frac => {
      const v = minVal + frac * valRange;
      return {
        y: valToY(v),
        label: goal.trackingType === 'percentage' ? `${Math.round(v)}%` : String(Math.round(v)),
      };
    });
    // Add bottom grid line
    gridLines.unshift({ y: valToY(minVal), label: goal.trackingType === 'percentage' ? `${minVal}%` : String(minVal) });

    // X-axis month labels
    const xLabels: { x: number; label: string }[] = [];
    const sd = fromDateStr(startDate);
    const monthSpan = Math.round(timeSpan / (30 * 86400000));
    const step = monthSpan <= 6 ? 1 : monthSpan <= 18 ? 3 : 6;
    for (let m = 0; m <= monthSpan + step; m += step) {
      const d = new Date(sd.getFullYear(), sd.getMonth() + m, 1);
      if (d.getTime() > endMs + 86400000 * 45) break;
      const mx = timeToX(d.getTime());
      if (mx >= PAD.left - 2 && mx <= W - PAD.right + 2) {
        xLabels.push({ x: mx, label: getShortMonthName(d.getMonth()) });
      }
    }

    // Build SVG paths
    const linePath = 'M ' + points.map(p => `${p.x},${p.y}`).join(' L ');
    const areaPath = linePath +
      ` L ${points[points.length - 1].x},${PAD.top + innerH}` +
      ` L ${points[0].x},${PAD.top + innerH} Z`;

    return {
      points, linePath, areaPath, gridLines, xLabels,
      targetStartY, targetEndY, todayX, W, innerH,
      startX: PAD.left, endX: PAD.left + innerW,
      hasTarget,
    };
  }, [goal, height]);

  if (!chartData || chartData.points.length === 0) {
    return (
      <div className="gt-chart-empty">
        <span>Add progress entries to see the chart</span>
      </div>
    );
  }

  const { points, linePath, areaPath, gridLines, xLabels, targetStartY, targetEndY, todayX, W, startX, endX, hasTarget } = chartData;
  const color = goal.color || '#32769B';

  return (
    <div className="gt-chart">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="gt-chart-svg"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={startX} y1={g.y} x2={endX} y2={g.y} stroke="var(--gt-border)" strokeWidth="0.3" />
            <text x={startX - 4} y={g.y + 1.2} textAnchor="end" className="gt-chart-label-y">{g.label}</text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={height - 6} textAnchor="middle" className="gt-chart-label-x">{l.label}</text>
        ))}

        {/* Target line (start value → target value) */}
        {hasTarget && (
          <line x1={startX} y1={targetStartY} x2={endX} y2={targetEndY}
            stroke="var(--gt-muted)" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.6" />
        )}

        {/* Filled area */}
        <path d={areaPath} fill={hexToRgba(color, 0.12)} />

        {/* Progress line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Today marker */}
        {todayX > startX && todayX < endX && (
          <line x1={todayX} y1={PAD.top - 4} x2={todayX} y2={PAD.top + chartData.innerH}
            stroke="var(--gt-danger)" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={hoveredIdx === i ? 2.5 : 1.5}
            fill={hoveredIdx === i ? '#fff' : color}
            stroke={color} strokeWidth="0.5"
            className="gt-chart-point"
            onMouseEnter={() => setHoveredIdx(i)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div className="gt-chart-tooltip" style={{
          left: `${(points[hoveredIdx].x / W) * 100}%`,
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
