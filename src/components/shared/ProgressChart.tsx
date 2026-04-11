import { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import type { Goal } from '../../types/goal.ts';
import { fromDateStr, todayStr, getShortMonthName } from '../../lib/calendar.ts';
// colors not needed — recharts handles gradients

interface ProgressChartProps {
  goal: Goal;
}

export function ProgressChart({ goal }: ProgressChartProps) {
  const color = goal.color || '#32769B';

  const { data, domain, todayTs, targetLine } = useMemo(() => {
    const entries = [...goal.progressEntries].sort((a, b) => a.date.localeCompare(b.date));

    // Convert entries to chart data
    const data = entries.map(e => ({
      ts: fromDateStr(e.date).getTime(),
      value: e.value,
      date: e.date,
    }));

    // Value domain
    const tv = goal.trackingType === 'percentage' ? 100 : (goal.targetValue || 0);
    const vals = entries.map(e => e.value);
    const allVals = tv > 0 ? [...vals, tv] : vals;
    const lo = allVals.length > 0 ? Math.min(...allVals) : 0;
    const hi = allVals.length > 0 ? Math.max(...allVals) : 100;
    const pad = Math.max((hi - lo) * 0.1, 2);
    const domain: [number, number] = [
      goal.trackingType === 'percentage' ? 0 : Math.max(0, Math.floor(lo - pad)),
      goal.trackingType === 'percentage' ? 100 : Math.ceil(hi + pad),
    ];

    // Target line: from first value to target value
    let targetLine: { startTs: number; startVal: number; endTs: number; endVal: number } | null = null;
    if (tv > 0 && entries.length > 0) {
      const sd = goal.startDate || entries[0].date;
      const ed = goal.targetDate || todayStr();
      targetLine = {
        startTs: fromDateStr(sd).getTime(),
        startVal: entries[0].value,
        endTs: fromDateStr(ed).getTime(),
        endVal: tv,
      };

      // Add target line points to data for rendering
      const startPoint = { ts: targetLine.startTs, value: undefined as number | undefined, target: targetLine.startVal, date: sd };
      const endPoint = { ts: targetLine.endTs, value: undefined as number | undefined, target: targetLine.endVal, date: ed };

      // Merge target points into data
      const merged = [...data.map(d => ({ ...d, target: undefined as number | undefined }))];
      // Add start/end target points if not already in data
      if (!merged.some(d => d.ts === startPoint.ts)) merged.push(startPoint as any);
      if (!merged.some(d => d.ts === endPoint.ts)) merged.push(endPoint as any);
      merged.sort((a, b) => a.ts - b.ts);

      // Interpolate target values for all data points
      if (targetLine) {
        const { startTs, startVal, endTs, endVal } = targetLine;
        const tSpan = endTs - startTs || 1;
        for (const d of merged) {
          if (d.target === undefined) {
            const frac = Math.max(0, Math.min(1, (d.ts - startTs) / tSpan));
            d.target = Math.round((startVal + frac * (endVal - startVal)) * 10) / 10;
          }
        }
      }

      return { data: merged, domain, todayTs: Date.now(), targetLine };
    }

    return { data: data.map(d => ({ ...d, target: undefined })), domain, todayTs: Date.now(), targetLine: null };
  }, [goal]);

  if (data.length === 0) {
    return <div className="gt-chart-empty"><span>Add progress entries to see the chart</span></div>;
  }

  const unit = goal.trackingType === 'percentage' ? '%' : (goal.unit || '');

  const formatXTick = (ts: number) => {
    const d = new Date(ts);
    const yr = d.getFullYear() !== new Date().getFullYear() ? ` '${String(d.getFullYear()).slice(2)}` : '';
    return getShortMonthName(d.getMonth()) + yr;
  };

  return (
    <div className="gt-chart">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 20, right: 12, bottom: 4, left: -8 }}>
          <defs>
            <linearGradient id={`grad-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#333" strokeOpacity={0.5} />

          <XAxis
            dataKey="ts" type="number" scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatXTick}
            tick={{ fill: '#888', fontSize: 11 }}
            axisLine={{ stroke: '#444' }}
            tickLine={{ stroke: '#444' }}
          />

          <YAxis
            domain={domain}
            tick={{ fill: '#888', fontSize: 11 }}
            axisLine={{ stroke: '#444' }}
            tickLine={{ stroke: '#444' }}
            tickFormatter={(v: number) => `${v}${goal.trackingType === 'percentage' ? '%' : ''}`}
          />

          <Tooltip
            contentStyle={{
              background: '#1a1a1f',
              border: '1px solid #333',
              borderRadius: 8,
              fontSize: 12,
              color: '#e4e4e7',
            }}
            labelFormatter={(ts: any) => {
              const d = new Date(Number(ts));
              return `${d.getDate()} ${getShortMonthName(d.getMonth())} ${d.getFullYear()}`;
            }}
            formatter={(value: any, name: any) => [
              `${value} ${unit}`,
              name === 'value' ? 'Actual' : 'Target',
            ]}
          />

          {/* Target line (dashed) */}
          {targetLine && (
            <Area
              dataKey="target" type="monotone"
              stroke="#888" strokeWidth={1.5} strokeDasharray="6 4"
              fill="none" dot={false} connectNulls
            />
          )}

          {/* Actual progress (filled area + line) */}
          <Area
            dataKey="value" type="monotone"
            stroke={color} strokeWidth={2.5}
            fill={`url(#grad-${goal.id})`}
            dot={{ r: 4, fill: color, stroke: '#1a1a1f', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#fff', stroke: color, strokeWidth: 2 }}
            connectNulls
          />

          {/* Today marker */}
          <ReferenceLine
            x={todayTs} stroke="#ef4444"
            strokeWidth={1.5} strokeDasharray="4 4"
            label={{ value: 'Today', fill: '#ef4444', fontSize: 10, position: 'top' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
