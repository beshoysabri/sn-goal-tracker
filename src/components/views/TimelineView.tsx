import { useMemo, useRef } from 'react';
import type { GoalTrackerData, Goal, StatusTab, TimeScale } from '../../types/goal.ts';
import { GoalIcon } from '../../lib/icons.tsx';
import { getGoalCompletion } from '../../lib/data.ts';
import { fromDateStr, toDateStr, getShortMonthName, formatDateShort, getDaysInMonth } from '../../lib/calendar.ts';
import { hexToRgba } from '../../lib/colors.ts';
import { isOverdue, getTimeRemaining } from '../../lib/stats.ts';

interface TimelineViewProps {
  data: GoalTrackerData;
  statusTab: StatusTab;
  searchQuery: string;
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  onSelectGoal: (id: string) => void;
}

interface GoalRow { goal: Goal; isGroupHeader?: false; }
interface GroupHeaderRow { isGroupHeader: true; areaName: string; areaColor?: string; areaIcon?: string; }
type Row = GoalRow | GroupHeaderRow;

// Each header cell
interface HCell { label: string; width: number; isToday?: boolean; }

function buildHeaders(months: Date[], scale: TimeScale): { top: HCell[]; bottom: HCell[] } {
  const top: HCell[] = [];
  const bottom: HCell[] = [];

  if (scale === '5Y') {
    // Top = years, Bottom = quarters (Q1-Q4)
    let curYear = -1;
    let yearWidth = 0;
    for (const m of months) {
      const y = m.getFullYear();
      const q = Math.floor(m.getMonth() / 3);
      if (y !== curYear) {
        if (curYear >= 0) top.push({ label: String(curYear), width: yearWidth });
        curYear = y;
        yearWidth = 0;
      }
      // Each month is one unit; 3 months = 1 quarter
      const w = 40;
      yearWidth += w;
      // Add quarter label on first month of quarter
      if (m.getMonth() % 3 === 0) {
        bottom.push({ label: `Q${q + 1}`, width: w * 3 });
      }
    }
    if (curYear >= 0) top.push({ label: String(curYear), width: yearWidth });
    // Fix last quarter width if incomplete
    const totalBottomW = bottom.reduce((s, c) => s + c.width, 0);
    const totalTopW = top.reduce((s, c) => s + c.width, 0);
    if (totalBottomW > totalTopW && bottom.length > 0) {
      bottom[bottom.length - 1].width -= (totalBottomW - totalTopW);
    }
  } else if (scale === 'Y') {
    // Top = years, Bottom = months
    let curYear = -1;
    let yearWidth = 0;
    for (const m of months) {
      const y = m.getFullYear();
      if (y !== curYear) {
        if (curYear >= 0) top.push({ label: String(curYear), width: yearWidth });
        curYear = y;
        yearWidth = 0;
      }
      const w = 80;
      yearWidth += w;
      bottom.push({ label: getShortMonthName(m.getMonth()), width: w });
    }
    if (curYear >= 0) top.push({ label: String(curYear), width: yearWidth });
  } else if (scale === 'Q') {
    // Top = months, Bottom = weeks (W1-W4/W5)
    for (const m of months) {
      const daysInM = getDaysInMonth(m.getFullYear(), m.getMonth());
      const weeks = Math.ceil(daysInM / 7);
      const monthW = weeks * 100;
      const label = `${getShortMonthName(m.getMonth())}${m.getFullYear() !== new Date().getFullYear() ? ` '${String(m.getFullYear()).slice(2)}` : ''}`;
      top.push({ label, width: monthW });
      for (let w = 0; w < weeks; w++) {
        bottom.push({ label: `W${w + 1}`, width: 100 });
      }
    }
  } else {
    // M: Top = month name, Bottom = days (1-28/31)
    for (const m of months) {
      const daysInM = getDaysInMonth(m.getFullYear(), m.getMonth());
      const dayW = 120 / daysInM; // fit days within month column width
      const monthW = daysInM * Math.max(dayW, 4); // min 4px per day
      const label = `${getShortMonthName(m.getMonth())}${m.getFullYear() !== new Date().getFullYear() ? ` '${String(m.getFullYear()).slice(2)}` : ''}`;
      top.push({ label, width: monthW });
      for (let d = 1; d <= daysInM; d++) {
        const today = new Date();
        const isToday = m.getFullYear() === today.getFullYear() && m.getMonth() === today.getMonth() && d === today.getDate();
        bottom.push({ label: d % 5 === 1 || d === 1 ? String(d) : '', width: Math.max(dayW, 4), isToday });
      }
    }
  }

  return { top, bottom };
}

function getColWidth(scale: TimeScale): number {
  // pixels per month
  switch (scale) {
    case '5Y': return 40;
    case 'Y': return 80;
    case 'Q': return 100 * 4.3; // ~4.3 weeks per month
    case 'M': return 120;
  }
}

export function TimelineView({ data, statusTab, searchQuery, timeScale, onTimeScaleChange, onSelectGoal }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colW = getColWidth(timeScale);

  const filteredGoals = useMemo(() =>
    data.goals.filter(g => {
      if (g.archived) return false;
      if (statusTab === 'active' && (g.status === 'completed' || g.status === 'abandoned')) return false;
      if (statusTab === 'completed' && g.status !== 'completed') return false;
      if (!g.startDate && !g.targetDate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
      }
      return true;
    }), [data.goals, statusTab, searchQuery]);

  const { startMonth, months } = useMemo(() => {
    const now = new Date();
    let minDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    let maxDate = new Date(now.getFullYear(), now.getMonth() + 6, 1);
    for (const g of filteredGoals) {
      if (g.startDate) { const d = fromDateStr(g.startDate); if (d < minDate) minDate = new Date(d.getFullYear(), d.getMonth(), 1); }
      if (g.targetDate) { const d = fromDateStr(g.targetDate); if (d > maxDate) maxDate = new Date(d.getFullYear(), d.getMonth() + 1, 1); }
    }
    const sm = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const em = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    const total = (em.getFullYear() - sm.getFullYear()) * 12 + (em.getMonth() - sm.getMonth()) + 1;
    const ms: Date[] = [];
    for (let i = 0; i < total; i++) ms.push(new Date(sm.getFullYear(), sm.getMonth() + i, 1));
    return { startMonth: sm, months: ms };
  }, [filteredGoals]);

  const { top: topHeaders, bottom: bottomHeaders } = useMemo(() => buildHeaders(months, timeScale), [months, timeScale]);
  const totalWidth = bottomHeaders.reduce((s, c) => s + c.width, 0);

  const dateToX = (dateStr: string): number => {
    const d = fromDateStr(dateStr);
    const monthDiff = (d.getFullYear() - startMonth.getFullYear()) * 12 + (d.getMonth() - startMonth.getMonth());
    const dayFraction = (d.getDate() - 1) / 30;
    return (monthDiff + dayFraction) * colW;
  };

  const todayX = dateToX(toDateStr(new Date()));

  const rows: Row[] = useMemo(() => {
    const result: Row[] = [];
    const sortedAreas = [...data.lifeAreas].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const area of sortedAreas) {
      const areaGoals = filteredGoals.filter(g => g.lifeAreaId === area.id).sort((a, b) => a.sortOrder - b.sortOrder);
      if (areaGoals.length === 0) continue;
      result.push({ isGroupHeader: true, areaName: area.name, areaColor: area.color, areaIcon: area.icon });
      for (const g of areaGoals) result.push({ goal: g });
    }
    const ungrouped = filteredGoals.filter(g => !g.lifeAreaId).sort((a, b) => a.sortOrder - b.sortOrder);
    if (ungrouped.length > 0) {
      result.push({ isGroupHeader: true, areaName: 'Ungrouped' });
      for (const g of ungrouped) result.push({ goal: g });
    }
    return result;
  }, [filteredGoals, data.lifeAreas]);

  // Mobile card
  const renderMobileCard = (goal: Goal) => {
    const completion = getGoalCompletion(goal);
    const timeLeft = goal.targetDate ? getTimeRemaining(goal) : null;
    const goalOverdue = isOverdue(goal);
    const startLabel = goal.startDate ? formatDateShort(goal.startDate) : '?';
    const endLabel = goal.targetDate ? formatDateShort(goal.targetDate) : 'No deadline';
    return (
      <div key={goal.id} className="gt-vtl-card" onClick={() => onSelectGoal(goal.id)}>
        <div className="gt-vtl-card-top">
          <span className="gt-vtl-card-icon" style={{ color: goal.color }}><GoalIcon name={goal.icon} size={16} /></span>
          <span className="gt-vtl-card-name">{goal.name}</span>
          <span className="gt-vtl-card-pct" style={{ color: goal.color }}>{completion}%</span>
        </div>
        <div className="gt-vtl-card-bar">
          <div className="gt-vtl-card-bar-track"><div className="gt-vtl-card-bar-fill" style={{ width: `${completion}%`, background: goal.color }} /></div>
        </div>
        <div className="gt-vtl-card-bottom">
          <span className="gt-vtl-card-dates">{startLabel} &rarr; {endLabel}</span>
          {timeLeft && <span className={`gt-vtl-card-time ${goalOverdue ? 'overdue' : ''}`}>{timeLeft.label}</span>}
        </div>
      </div>
    );
  };

  if (filteredGoals.length === 0) {
    return (
      <div className="gt-list-empty">
        <GoalIcon name="calendar" size={48} />
        <p>No goals with dates to show on timeline.</p>
      </div>
    );
  }

  return (
    <div className="gt-timeline-view">
      <div className="gt-timeline-header">
        <div className="gt-timeline-scale-btns">
          {(['M', 'Q', 'Y', '5Y'] as TimeScale[]).map(scale => (
            <button key={scale} className={`gt-timeline-scale-btn ${timeScale === scale ? 'active' : ''}`} onClick={() => onTimeScaleChange(scale)}>
              {scale}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Gantt */}
      <div className="gt-timeline-container gt-timeline-desktop" ref={scrollRef}>
        <div className="gt-timeline-labels">
          <div className="gt-timeline-label-header-double">Goals</div>
          {rows.map((row, i) => {
            if (row.isGroupHeader) {
              return (
                <div key={`gh-${i}`} className="gt-timeline-label-header" style={{ color: row.areaColor }}>
                  {row.areaColor && <span className="gt-timeline-label-dot" style={{ background: row.areaColor }} />}
                  {row.areaName}
                </div>
              );
            }
            return (
              <div key={row.goal.id} className="gt-timeline-label" onClick={() => onSelectGoal(row.goal.id)}>
                <span className="gt-timeline-label-dot" style={{ background: row.goal.color }} />
                <span className="gt-timeline-label-name">{row.goal.name}</span>
              </div>
            );
          })}
        </div>

        <div className="gt-timeline-grid" style={{ minWidth: totalWidth }}>
          {/* Two-row hierarchical header */}
          <div className="gt-timeline-header-rows">
            <div className="gt-timeline-header-top">
              {topHeaders.map((h, i) => (
                <div key={i} className="gt-timeline-hcell-top" style={{ width: h.width }}>{h.label}</div>
              ))}
            </div>
            <div className="gt-timeline-header-bottom">
              {bottomHeaders.map((h, i) => (
                <div key={i} className={`gt-timeline-hcell-bottom ${h.isToday ? 'today' : ''}`} style={{ width: h.width }}>{h.label}</div>
              ))}
            </div>
          </div>

          {/* Goal rows */}
          <div className="gt-timeline-rows">
            {rows.map((row, i) => {
              if (row.isGroupHeader) return <div key={`gh-${i}`} className="gt-timeline-label-header" />;
              const goal = row.goal;
              const start = goal.startDate || goal.createdAt.slice(0, 10);
              const end = goal.targetDate || toDateStr(new Date(new Date().getFullYear(), 11, 31));
              const x = dateToX(start);
              const endX = dateToX(end);
              const width = Math.max(endX - x, 20);
              const completion = getGoalCompletion(goal);
              const goalOverdue = isOverdue(goal);

              return (
                <div key={goal.id} className="gt-timeline-row" onClick={() => onSelectGoal(goal.id)}>
                  <div className={`gt-timeline-bar ${goalOverdue ? 'overdue' : ''}`} style={{ left: x, width, background: hexToRgba(goal.color, 0.25) }}>
                    <div className="gt-timeline-bar-progress" style={{ width: `${completion}%`, background: goal.color }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>{completion}%</span>
                  </div>
                </div>
              );
            })}
            <div className="gt-timeline-today" style={{ left: todayX }} />
          </div>
        </div>
      </div>

      {/* Mobile vertical */}
      <div className="gt-vtl gt-timeline-mobile">
        {rows.map((row, i) => {
          if (row.isGroupHeader) {
            return (
              <div key={`mgh-${i}`} className="gt-vtl-group">
                {row.areaColor && <span className="gt-vtl-group-dot" style={{ background: row.areaColor }} />}
                <span className="gt-vtl-group-name">{row.areaName}</span>
              </div>
            );
          }
          return renderMobileCard(row.goal);
        })}
      </div>
    </div>
  );
}
