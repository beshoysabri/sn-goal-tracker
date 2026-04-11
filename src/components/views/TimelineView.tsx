import { useMemo, useRef } from 'react';
import type { GoalTrackerData, Goal, StatusTab, TimeScale } from '../../types/goal.ts';
import { GoalIcon } from '../../lib/icons.tsx';
import { getGoalCompletion } from '../../lib/data.ts';
import { fromDateStr, toDateStr, getShortMonthName, formatDateShort } from '../../lib/calendar.ts';
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

const SCALE_CONFIGS: Record<TimeScale, { colWidthPx: number }> = {
  'M': { colWidthPx: 120 },
  'Q': { colWidthPx: 100 },
  'Y': { colWidthPx: 80 },
  '5Y': { colWidthPx: 40 },
};

interface GoalRow {
  goal: Goal;
  isGroupHeader?: false;
}
interface GroupHeaderRow {
  isGroupHeader: true;
  areaName: string;
  areaColor?: string;
  areaIcon?: string;
}
type Row = GoalRow | GroupHeaderRow;

export function TimelineView({ data, statusTab, searchQuery, timeScale, onTimeScaleChange, onSelectGoal }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const config = SCALE_CONFIGS[timeScale];

  // Filter goals (must have at least one date)
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

  // Timeline range & months
  const { startMonth, totalMonths, months } = useMemo(() => {
    const now = new Date();
    let minDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    let maxDate = new Date(now.getFullYear(), now.getMonth() + 6, 1);

    for (const g of filteredGoals) {
      if (g.startDate) {
        const d = fromDateStr(g.startDate);
        if (d < minDate) minDate = new Date(d.getFullYear(), d.getMonth(), 1);
      }
      if (g.targetDate) {
        const d = fromDateStr(g.targetDate);
        if (d > maxDate) maxDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
    }

    const sm = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const em = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    const total = (em.getFullYear() - sm.getFullYear()) * 12 + (em.getMonth() - sm.getMonth()) + 1;

    const ms: Date[] = [];
    for (let i = 0; i < total; i++) {
      ms.push(new Date(sm.getFullYear(), sm.getMonth() + i, 1));
    }
    return { startMonth: sm, totalMonths: total, months: ms };
  }, [filteredGoals]);

  const totalWidth = totalMonths * config.colWidthPx;

  const dateToX = (dateStr: string): number => {
    const d = fromDateStr(dateStr);
    const monthDiff = (d.getFullYear() - startMonth.getFullYear()) * 12 + (d.getMonth() - startMonth.getMonth());
    const dayFraction = (d.getDate() - 1) / 30;
    return (monthDiff + dayFraction) * config.colWidthPx;
  };

  const todayX = dateToX(toDateStr(new Date()));

  // Build flat row list: group headers + goals
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

  if (filteredGoals.length === 0) {
    return (
      <div className="gt-list-empty">
        <GoalIcon name="calendar" size={48} />
        <p>No goals with dates to show on timeline.</p>
      </div>
    );
  }

  // --- Mobile vertical card for a goal ---
  const renderMobileCard = (goal: Goal) => {
    const completion = getGoalCompletion(goal);
    const timeLeft = goal.targetDate ? getTimeRemaining(goal) : null;
    const goalOverdue = isOverdue(goal);
    const startLabel = goal.startDate ? formatDateShort(goal.startDate) : '?';
    const endLabel = goal.targetDate ? formatDateShort(goal.targetDate) : 'No deadline';

    return (
      <div
        key={goal.id}
        className="gt-vtl-card"
        onClick={() => onSelectGoal(goal.id)}
      >
        <div className="gt-vtl-card-top">
          <span className="gt-vtl-card-icon" style={{ color: goal.color }}>
            <GoalIcon name={goal.icon} size={16} />
          </span>
          <span className="gt-vtl-card-name">{goal.name}</span>
          <span className="gt-vtl-card-pct" style={{ color: goal.color }}>{completion}%</span>
        </div>
        <div className="gt-vtl-card-bar">
          <div className="gt-vtl-card-bar-track">
            <div className="gt-vtl-card-bar-fill" style={{ width: `${completion}%`, background: goal.color }} />
          </div>
        </div>
        <div className="gt-vtl-card-bottom">
          <span className="gt-vtl-card-dates">{startLabel} &rarr; {endLabel}</span>
          {timeLeft && (
            <span className={`gt-vtl-card-time ${goalOverdue ? 'overdue' : ''}`}>
              {timeLeft.label}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="gt-timeline-view">
      <div className="gt-timeline-header">
        <div className="gt-timeline-scale-btns">
          {(Object.keys(SCALE_CONFIGS) as TimeScale[]).map(scale => (
            <button
              key={scale}
              className={`gt-timeline-scale-btn ${timeScale === scale ? 'active' : ''}`}
              onClick={() => onTimeScaleChange(scale)}
            >
              {scale}
            </button>
          ))}
        </div>
      </div>

      {/* === Desktop horizontal Gantt === */}
      <div className="gt-timeline-container gt-timeline-desktop" ref={scrollRef}>
        <div className="gt-timeline-labels">
          <div className="gt-timeline-label-header">Goals</div>
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
          <div className="gt-timeline-months-row">
            {months.map((m, i) => (
              <div key={i} className="gt-timeline-month-header" style={{ width: config.colWidthPx }}>
                {getShortMonthName(m.getMonth())}
                {m.getFullYear() !== new Date().getFullYear() ? ` '${String(m.getFullYear()).slice(2)}` : ''}
              </div>
            ))}
          </div>

          <div className="gt-timeline-rows">
            {rows.map((row, i) => {
              if (row.isGroupHeader) {
                return <div key={`gh-${i}`} className="gt-timeline-label-header" />;
              }
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
                  <div
                    className={`gt-timeline-bar ${goalOverdue ? 'overdue' : ''}`}
                    style={{ left: x, width, background: hexToRgba(goal.color, 0.25) }}
                  >
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

      {/* === Mobile vertical timeline === */}
      <div className="gt-vtl gt-timeline-mobile">
        {rows.map((row, i) => {
          if (row.isGroupHeader) {
            return (
              <div key={`mgh-${i}`} className="gt-vtl-group">
                {row.areaColor && <span className="gt-vtl-group-dot" style={{ background: row.areaColor }} />}
                {row.areaIcon && (
                  <span className="gt-vtl-group-icon" style={{ color: row.areaColor }}>
                    <GoalIcon name={row.areaIcon} size={14} />
                  </span>
                )}
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
