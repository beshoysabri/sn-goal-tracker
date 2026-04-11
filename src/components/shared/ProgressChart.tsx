import { useMemo, useState } from 'react';
import type { Goal } from '../../types/goal.ts';
import { fromDateStr, todayStr, getShortMonthName } from '../../lib/calendar.ts';
import { hexToRgba } from '../../lib/colors.ts';

interface ProgressChartProps {
  goal: Goal;
}

// Fixed viewBox — SVG scales uniformly to fit container
const VW = 800;
const VH = 220;
const PAD = { top: 20, right: 20, bottom: 36, left: 56 };
const IW = VW - PAD.left - PAD.right;
const IH = VH - PAD.top - PAD.bottom;

export function ProgressChart({ goal }: ProgressChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const color = goal.color || '#32769B';

  const chart = useMemo(() => {
    const entries = [...goal.progressEntries].sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length === 0) return null;

    // Time range
    const sd = goal.startDate || entries[0].date;
    const ed = goal.targetDate || todayStr();
    const t0 = fromDateStr(sd).getTime();
    const t1 = Math.max(fromDateStr(ed).getTime(), Date.now());
    const tSpan = Math.max(t1 - t0, 86400000);

    // Value range — auto-fit data
    const vals = entries.map(e => e.value);
    const tv = goal.trackingType === 'percentage' ? 100 : (goal.targetValue || 0);
    const lo = Math.min(...vals, tv > 0 ? tv : Infinity);
    const hi = Math.max(...vals, tv > 0 ? tv : 0);
    const pad = Math.max((hi - lo) * 0.12, 2);
    const vMin = goal.trackingType === 'percentage' ? 0 : Math.max(0, Math.floor(lo - pad));
    const vMax = goal.trackingType === 'percentage' ? 100 : Math.ceil(hi + pad);
    const vSpan = vMax - vMin || 1;

    const x = (ms: number) => PAD.left + ((ms - t0) / tSpan) * IW;
    const y = (v: number) => PAD.top + IH - ((v - vMin) / vSpan) * IH;

    // Points
    const pts = entries.map(e => ({
      x: x(fromDateStr(e.date).getTime()), y: y(e.value),
      date: e.date, value: e.value, note: e.note,
    }));

    // Line + area paths
    let line = '';
    let area = '';
    if (pts.length >= 2) {
      line = 'M' + pts.map(p => `${p.x} ${p.y}`).join('L');
      area = line + `L${pts[pts.length - 1].x} ${PAD.top + IH}L${pts[0].x} ${PAD.top + IH}Z`;
    }

    // Target line
    const hasTarget = tv > 0;
    const tgtY0 = y(entries[0].value);
    const tgtY1 = hasTarget ? y(tv) : tgtY0;

    // Today
    const todayX = x(Date.now());

    // Y grid (5 lines)
    const yGrid = Array.from({ length: 5 }, (_, i) => {
      const frac = i / 4;
      const v = vMin + frac * vSpan;
      return { y: y(v), label: goal.trackingType === 'percentage' ? `${Math.round(v)}%` : String(Math.round(v)) };
    });

    // X labels (months)
    const startD = fromDateStr(sd);
    const months = Math.max(1, Math.round(tSpan / (30.44 * 86400000)));
    const step = months <= 4 ? 1 : months <= 12 ? 2 : months <= 24 ? 3 : 6;
    const xLabels: { x: number; label: string }[] = [];
    for (let m = 0; m <= months + step; m += step) {
      const d = new Date(startD.getFullYear(), startD.getMonth() + m, 1);
      if (d.getTime() > t1 + 86400000 * 45) break;
      const px = x(d.getTime());
      if (px >= PAD.left && px <= VW - PAD.right) {
        const yr = d.getFullYear() !== new Date().getFullYear() ? ` '${String(d.getFullYear()).slice(2)}` : '';
        xLabels.push({ x: px, label: getShortMonthName(d.getMonth()) + yr });
      }
    }

    return { pts, line, area, yGrid, xLabels, tgtY0, tgtY1, todayX, hasTarget };
  }, [goal]);

  if (!chart) {
    return <div className="gt-chart-empty"><span>Add progress entries to see the chart</span></div>;
  }

  const { pts, line, area, yGrid, xLabels, tgtY0, tgtY1, todayX, hasTarget } = chart;

  return (
    <div className="gt-chart">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="gt-chart-svg">
        {/* Grid */}
        {yGrid.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={g.y} x2={VW - PAD.right} y2={g.y} stroke="#ffffff" strokeWidth="1" opacity="0.06" />
            <text x={PAD.left - 8} y={g.y + 4} textAnchor="end" fill="#888" fontSize="12" fontFamily="sans-serif">{g.label}</text>
          </g>
        ))}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={VH - 10} textAnchor="middle" fill="#888" fontSize="12" fontFamily="sans-serif">{l.label}</text>
        ))}

        {/* Target line */}
        {hasTarget && (
          <line x1={PAD.left} y1={tgtY0} x2={VW - PAD.right} y2={tgtY1}
            stroke="#888" strokeWidth="1.5" strokeDasharray="8,6" opacity="0.3" />
        )}

        {/* Area + line */}
        {area && <path d={area} fill={hexToRgba(color, 0.1)} />}
        {line && <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {/* Today */}
        {todayX > PAD.left && todayX < VW - PAD.right && (
          <line x1={todayX} y1={PAD.top} x2={todayX} y2={PAD.top + IH}
            stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
        )}

        {/* Points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hovered === i ? 7 : 5}
            fill={hovered === i ? '#fff' : color} stroke={color} strokeWidth="2.5"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
        ))}

        {/* Tooltip */}
        {hovered !== null && pts[hovered] && (
          <g>
            <rect x={pts[hovered].x - 50} y={pts[hovered].y - 38} width="100" height="28" rx="6"
              fill="#1a1a1f" stroke="#333" strokeWidth="1" />
            <text x={pts[hovered].x} y={pts[hovered].y - 20} textAnchor="middle"
              fill="#fff" fontSize="13" fontWeight="600" fontFamily="sans-serif">
              {pts[hovered].value}{goal.trackingType === 'percentage' ? '%' : ` ${goal.unit || ''}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
