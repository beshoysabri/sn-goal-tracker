import { useMemo, useState, useRef, useEffect } from 'react';
import type { Goal } from '../../types/goal.ts';
import { fromDateStr, todayStr, getShortMonthName } from '../../lib/calendar.ts';
import { hexToRgba } from '../../lib/colors.ts';

interface ProgressChartProps {
  goal: Goal;
  height?: number;
}

export function ProgressChart({ goal, height = 180 }: ProgressChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(600);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Measure actual container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) setContainerW(entry.contentRect.width);
    });
    obs.observe(el);
    setContainerW(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const PAD = { top: 16, right: 12, bottom: 30, left: 48 };
  const W = containerW;
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const chartData = useMemo(() => {
    const entries = [...goal.progressEntries].sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length === 0) return null;

    // Time range
    const startDate = goal.startDate || entries[0].date;
    const endDate = goal.targetDate || todayStr();
    const startMs = fromDateStr(startDate).getTime();
    const endMs = Math.max(fromDateStr(endDate).getTime(), fromDateStr(todayStr()).getTime());
    const timeSpan = Math.max(endMs - startMs, 86400000);

    // Value range
    const allVals = entries.map(e => e.value);
    const targetVal = goal.trackingType === 'percentage' ? 100 : (goal.targetValue || 0);
    const dataMin = Math.min(...allVals, targetVal > 0 ? targetVal : Infinity);
    const dataMax = Math.max(...allVals, targetVal > 0 ? targetVal : 0);
    const rangePad = Math.max((dataMax - dataMin) * 0.15, 2);
    const minVal = goal.trackingType === 'percentage' ? 0 : Math.max(0, Math.floor(dataMin - rangePad));
    const maxVal = goal.trackingType === 'percentage' ? 100 : Math.ceil(dataMax + rangePad);
    const valRange = maxVal - minVal || 1;

    const valToY = (v: number) => PAD.top + innerH - ((v - minVal) / valRange) * innerH;
    const timeToX = (ms: number) => PAD.left + ((ms - startMs) / timeSpan) * innerW;

    // Data points
    const points = entries.map(e => ({
      x: timeToX(fromDateStr(e.date).getTime()),
      y: valToY(e.value),
      date: e.date, value: e.value, note: e.note,
    }));

    // Target line
    const firstVal = entries[0].value;
    const hasTarget = targetVal > 0;
    const targetStartY = valToY(firstVal);
    const targetEndY = hasTarget ? valToY(targetVal) : targetStartY;

    // Today
    const todayX = timeToX(new Date().getTime());

    // Grid (5 lines)
    const gridCount = 4;
    const gridLines = [];
    for (let i = 0; i <= gridCount; i++) {
      const frac = i / gridCount;
      const v = minVal + frac * valRange;
      gridLines.push({
        y: valToY(v),
        label: goal.trackingType === 'percentage' ? `${Math.round(v)}%` : String(Math.round(v)),
      });
    }

    // X-axis month labels
    const xLabels: { x: number; label: string }[] = [];
    const sd = fromDateStr(startDate);
    const monthSpan = Math.max(1, Math.round(timeSpan / (30.44 * 86400000)));
    const step = monthSpan <= 4 ? 1 : monthSpan <= 12 ? 2 : monthSpan <= 24 ? 3 : 6;
    for (let m = 0; m <= monthSpan + step; m += step) {
      const d = new Date(sd.getFullYear(), sd.getMonth() + m, 1);
      if (d.getTime() > endMs + 86400000 * 45) break;
      const mx = timeToX(d.getTime());
      if (mx >= PAD.left && mx <= W - PAD.right) {
        const yr = d.getFullYear() !== new Date().getFullYear() ? ` '${String(d.getFullYear()).slice(2)}` : '';
        xLabels.push({ x: mx, label: getShortMonthName(d.getMonth()) + yr });
      }
    }

    // SVG paths
    let linePath = '';
    let areaPath = '';
    if (points.length >= 2) {
      linePath = 'M ' + points.map(p => `${p.x},${p.y}`).join(' L ');
      areaPath = linePath + ` L ${points[points.length - 1].x},${PAD.top + innerH} L ${points[0].x},${PAD.top + innerH} Z`;
    }

    return { points, linePath, areaPath, gridLines, xLabels, targetStartY, targetEndY, todayX, hasTarget };
  }, [goal, W, H, innerW, innerH]);

  if (!chartData || chartData.points.length === 0) {
    return (
      <div className="gt-chart-empty" ref={containerRef}>
        <span>Add progress entries to see the chart</span>
      </div>
    );
  }

  const { points, linePath, areaPath, gridLines, xLabels, targetStartY, targetEndY, todayX, hasTarget } = chartData;
  const color = goal.color || '#32769B';

  return (
    <div className="gt-chart" ref={containerRef}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y}
              stroke="var(--gt-border)" strokeWidth="1" opacity="0.4" />
            <text x={PAD.left - 6} y={g.y + 4} textAnchor="end"
              fill="var(--gt-muted)" fontSize="10" fontFamily="inherit">{g.label}</text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - 8} textAnchor="middle"
            fill="var(--gt-muted)" fontSize="10" fontFamily="inherit">{l.label}</text>
        ))}

        {/* Target line */}
        {hasTarget && (
          <line x1={PAD.left} y1={targetStartY} x2={W - PAD.right} y2={targetEndY}
            stroke="var(--gt-muted)" strokeWidth="1" strokeDasharray="6,4" opacity="0.4" />
        )}

        {/* Filled area */}
        {areaPath && <path d={areaPath} fill={hexToRgba(color, 0.1)} />}

        {/* Progress line */}
        {linePath && (
          <path d={linePath} fill="none" stroke={color} strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Today marker */}
        {todayX > PAD.left && todayX < W - PAD.right && (
          <line x1={todayX} y1={PAD.top} x2={todayX} y2={PAD.top + innerH}
            stroke="var(--gt-danger)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={hoveredIdx === i ? 6 : 4}
            fill={hoveredIdx === i ? '#fff' : color}
            stroke={color} strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'r 0.15s' }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div className="gt-chart-tooltip" style={{
          left: points[hoveredIdx].x,
          top: points[hoveredIdx].y - 10,
        }}>
          <strong>{points[hoveredIdx].value}{goal.trackingType === 'percentage' ? '%' : ` ${goal.unit || ''}`}</strong>
          <span>{points[hoveredIdx].date}</span>
          {points[hoveredIdx].note && <em>{points[hoveredIdx].note}</em>}
        </div>
      )}
    </div>
  );
}
