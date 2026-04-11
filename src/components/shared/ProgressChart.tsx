import { useMemo } from 'react';
import type { Goal } from '../../types/goal.ts';
import { fromDateStr, todayStr, getShortMonthName } from '../../lib/calendar.ts';
import { hexToRgba } from '../../lib/colors.ts';

interface ProgressChartProps {
  goal: Goal;
}

export function ProgressChart({ goal }: ProgressChartProps) {
  const color = goal.color || '#32769B';

  const chart = useMemo(() => {
    const entries = [...goal.progressEntries].sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length === 0) return null;

    // Value range
    const vals = entries.map(e => e.value);
    const tv = goal.trackingType === 'percentage' ? 100 : (goal.targetValue || 0);
    const lo = Math.min(...vals, tv > 0 ? tv : Infinity);
    const hi = Math.max(...vals, tv > 0 ? tv : 0);
    const pad = Math.max((hi - lo) * 0.12, 2);
    const vMin = goal.trackingType === 'percentage' ? 0 : Math.max(0, Math.floor(lo - pad));
    const vMax = goal.trackingType === 'percentage' ? 100 : Math.ceil(hi + pad);
    const vSpan = vMax - vMin || 1;

    const valToPct = (v: number) => ((v - vMin) / vSpan) * 100;

    // Time range
    const sd = goal.startDate || entries[0].date;
    const ed = goal.targetDate || todayStr();
    const t0 = fromDateStr(sd).getTime();
    const t1 = Math.max(fromDateStr(ed).getTime(), Date.now());
    const tSpan = Math.max(t1 - t0, 86400000);
    const timeToPct = (ms: number) => ((ms - t0) / tSpan) * 100;

    // Points as percentages
    const points = entries.map(e => ({
      xPct: timeToPct(fromDateStr(e.date).getTime()),
      yPct: valToPct(e.value),
      value: e.value,
      date: e.date,
    }));

    // Target line endpoints (as percentages)
    const hasTarget = tv > 0;
    const tgtStartPct = valToPct(entries[0].value);
    const tgtEndPct = hasTarget ? valToPct(tv) : tgtStartPct;

    // Today marker
    const todayPct = timeToPct(Date.now());

    // Y-axis labels (5)
    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const frac = i / 4;
      const v = vMin + frac * vSpan;
      return {
        pct: frac * 100,
        label: goal.trackingType === 'percentage' ? `${Math.round(v)}%` : String(Math.round(v)),
      };
    });

    // X-axis labels
    const startD = fromDateStr(sd);
    const months = Math.max(1, Math.round(tSpan / (30.44 * 86400000)));
    const step = months <= 4 ? 1 : months <= 12 ? 2 : months <= 24 ? 3 : 6;
    const xLabels: { pct: number; label: string }[] = [];
    for (let m = 0; m <= months + step; m += step) {
      const d = new Date(startD.getFullYear(), startD.getMonth() + m, 1);
      if (d.getTime() > t1 + 86400000 * 45) break;
      const pct = timeToPct(d.getTime());
      if (pct >= 0 && pct <= 100) {
        const yr = d.getFullYear() !== new Date().getFullYear() ? ` '${String(d.getFullYear()).slice(2)}` : '';
        xLabels.push({ pct, label: getShortMonthName(d.getMonth()) + yr });
      }
    }

    return { points, yLabels, xLabels, todayPct, hasTarget, tgtStartPct, tgtEndPct };
  }, [goal]);

  if (!chart) {
    return <div className="gt-chart-empty"><span>Add progress entries to see the chart</span></div>;
  }

  const { points, yLabels, xLabels, todayPct, hasTarget, tgtStartPct, tgtEndPct } = chart;

  // Build CSS line segments between consecutive points
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({
      x1: points[i].xPct, y1: points[i].yPct,
      x2: points[i + 1].xPct, y2: points[i + 1].yPct,
    });
  }

  return (
    <div className="gt-css-chart">
      {/* Y-axis labels */}
      <div className="gt-css-chart-yaxis">
        {yLabels.map((l, i) => (
          <span key={i} className="gt-css-chart-ylabel" style={{ bottom: `${l.pct}%` }}>{l.label}</span>
        ))}
      </div>

      {/* Chart area */}
      <div className="gt-css-chart-area">
        {/* Grid lines */}
        {yLabels.map((l, i) => (
          <div key={i} className="gt-css-chart-gridline" style={{ bottom: `${l.pct}%` }} />
        ))}

        {/* Target line */}
        {hasTarget && (
          <div className="gt-css-chart-target"
            style={{
              left: '0%', bottom: `${tgtStartPct}%`,
              width: '100%',
              '--tgt-start': `${100 - tgtStartPct}%`,
              '--tgt-end': `${100 - tgtEndPct}%`,
            } as React.CSSProperties}
          />
        )}

        {/* Line segments */}
        {segments.map((s, i) => {
          const dx = s.x2 - s.x1;
          const dy = s.y2 - s.y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
          return (
            <div key={i} className="gt-css-chart-line" style={{
              left: `${s.x1}%`, bottom: `${s.y1}%`,
              width: `${len}%`,
              transform: `rotate(${-angle}deg)`,
              transformOrigin: '0 0',
              background: color,
            }} />
          );
        })}

        {/* Area fill (simplified: vertical bars per point) */}
        {points.map((p, i) => {
          const nextX = i < points.length - 1 ? points[i + 1].xPct : p.xPct + 1;
          const w = nextX - p.xPct;
          return (
            <div key={`a${i}`} className="gt-css-chart-bar" style={{
              left: `${p.xPct}%`, width: `${Math.max(w, 0.5)}%`,
              height: `${p.yPct}%`,
              background: hexToRgba(color, 0.08),
            }} />
          );
        })}

        {/* Today marker */}
        {todayPct > 0 && todayPct < 100 && (
          <div className="gt-css-chart-today" style={{ left: `${todayPct}%` }} />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <div key={`p${i}`} className="gt-css-chart-point" style={{
            left: `${p.xPct}%`, bottom: `${p.yPct}%`,
            borderColor: color, background: color,
          }}>
            <div className="gt-css-chart-tip">
              {p.value}{goal.trackingType === 'percentage' ? '%' : ` ${goal.unit || ''}`}
              <small>{p.date}</small>
            </div>
          </div>
        ))}

        {/* X-axis labels */}
        <div className="gt-css-chart-xaxis">
          {xLabels.map((l, i) => (
            <span key={i} className="gt-css-chart-xlabel" style={{ left: `${l.pct}%` }}>{l.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
