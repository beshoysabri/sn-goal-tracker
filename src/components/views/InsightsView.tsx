import { useMemo } from 'react';
import type { GoalTrackerData } from '../../types/goal.ts';
import { GoalIcon } from '../../lib/icons.tsx';
import { getGoalCompletion } from '../../lib/data.ts';
import { isOverdue, getProgressVelocity } from '../../lib/stats.ts';
import { ProgressBar } from '../shared/ProgressBar.tsx';

interface InsightsViewProps {
  data: GoalTrackerData;
  onSelectGoal: (id: string) => void;
}

export function InsightsView({ data, onSelectGoal }: InsightsViewProps) {
  const insights = useMemo(() => {
    const allGoals = data.goals.filter(g => !g.archived);
    const active = allGoals.filter(g => g.status === 'active');
    const completed = allGoals.filter(g => g.status === 'completed');
    const paused = allGoals.filter(g => g.status === 'paused');
    const overdue = active.filter(g => isOverdue(g));

    // Overall completion
    const avgCompletion = active.length > 0
      ? Math.round(active.reduce((s, g) => s + getGoalCompletion(g), 0) / active.length)
      : 0;

    // Per life area stats
    const areaStats = data.lifeAreas.map(area => {
      const areaGoals = allGoals.filter(g => g.lifeAreaId === area.id);
      const areaActive = areaGoals.filter(g => g.status === 'active');
      const areaCompleted = areaGoals.filter(g => g.status === 'completed');
      const avg = areaActive.length > 0
        ? Math.round(areaActive.reduce((s, g) => s + getGoalCompletion(g), 0) / areaActive.length)
        : areaCompleted.length > 0 ? 100 : 0;
      return {
        area,
        total: areaGoals.length,
        active: areaActive.length,
        completed: areaCompleted.length,
        overdue: areaActive.filter(g => isOverdue(g)).length,
        avgCompletion: avg,
      };
    }).filter(a => a.total > 0).sort((a, b) => b.avgCompletion - a.avgCompletion);

    // Top performing goals (highest completion among active)
    const topGoals = [...active]
      .map(g => ({ goal: g, completion: getGoalCompletion(g) }))
      .sort((a, b) => b.completion - a.completion)
      .slice(0, 5);

    // At risk (overdue or low progress with upcoming deadline)
    const atRisk = overdue.slice(0, 5);

    // Recently completed
    const recentCompleted = [...completed]
      .filter(g => g.completedDate)
      .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''))
      .slice(0, 5);

    // Goals with most progress entries (most tracked)
    const mostTracked = [...active]
      .filter(g => g.progressEntries.length > 0)
      .sort((a, b) => b.progressEntries.length - a.progressEntries.length)
      .slice(0, 5);

    // Total stats
    const totalTasks = allGoals.reduce((s, g) => s + g.tasks.length, 0);
    const completedTasks = allGoals.reduce((s, g) => s + g.tasks.filter(t => t.completed).length, 0);
    const totalSubGoals = allGoals.filter(g => g.parentGoalId).length;

    return {
      active: active.length,
      completed: completed.length,
      paused: paused.length,
      overdue: overdue.length,
      avgCompletion,
      areaStats,
      topGoals,
      atRisk,
      recentCompleted,
      mostTracked,
      totalTasks,
      completedTasks,
      totalSubGoals,
      totalGoals: allGoals.length,
    };
  }, [data]);

  return (
    <div className="gt-insights-view">
      {/* Summary cards */}
      <div className="gt-insights-summary">
        <div className="gt-insights-card accent">
          <div className="gt-insights-card-value">{insights.avgCompletion}%</div>
          <div className="gt-insights-card-label">Avg Completion</div>
        </div>
        <div className="gt-insights-card">
          <div className="gt-insights-card-value">{insights.active}</div>
          <div className="gt-insights-card-label">Active Goals</div>
        </div>
        <div className="gt-insights-card">
          <div className="gt-insights-card-value">{insights.completed}</div>
          <div className="gt-insights-card-label">Completed</div>
        </div>
        <div className="gt-insights-card">
          <div className="gt-insights-card-value">{insights.paused}</div>
          <div className="gt-insights-card-label">Paused</div>
        </div>
        {insights.overdue > 0 && (
          <div className="gt-insights-card danger">
            <div className="gt-insights-card-value">{insights.overdue}</div>
            <div className="gt-insights-card-label">Overdue</div>
          </div>
        )}
        <div className="gt-insights-card">
          <div className="gt-insights-card-value">{insights.completedTasks}/{insights.totalTasks}</div>
          <div className="gt-insights-card-label">Tasks Done</div>
        </div>
      </div>

      <div className="gt-insights-grid">
        {/* Life Area Breakdown */}
        <div className="gt-insights-panel">
          <h3 className="gt-insights-panel-title">Life Areas</h3>
          {insights.areaStats.length > 0 ? (
            <div className="gt-insights-area-list">
              {insights.areaStats.map(a => (
                <div key={a.area.id} className="gt-insights-area-row">
                  <span className="gt-insights-area-dot" style={{ background: a.area.color }} />
                  <span className="gt-insights-area-name">{a.area.name}</span>
                  <span className="gt-insights-area-count">{a.active} active</span>
                  <div className="gt-insights-area-bar">
                    <ProgressBar value={a.avgCompletion} color={a.area.color} height={6} />
                  </div>
                  <span className="gt-insights-area-pct">{a.avgCompletion}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="gt-insights-empty">No life areas with goals</p>
          )}
        </div>

        {/* Top Performing Goals */}
        <div className="gt-insights-panel">
          <h3 className="gt-insights-panel-title">Top Progress</h3>
          {insights.topGoals.length > 0 ? (
            <div className="gt-insights-goal-list">
              {insights.topGoals.map(({ goal, completion }) => (
                <div key={goal.id} className="gt-insights-goal-row" onClick={() => onSelectGoal(goal.id)}>
                  <span className="gt-insights-goal-icon" style={{ color: goal.color }}>
                    <GoalIcon name={goal.icon} size={14} />
                  </span>
                  <span className="gt-insights-goal-name">{goal.name}</span>
                  <div className="gt-insights-goal-bar">
                    <ProgressBar value={completion} color={goal.color} height={4} />
                  </div>
                  <span className="gt-insights-goal-pct">{completion}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="gt-insights-empty">No active goals</p>
          )}
        </div>

        {/* At Risk */}
        {insights.atRisk.length > 0 && (
          <div className="gt-insights-panel">
            <h3 className="gt-insights-panel-title danger">Overdue</h3>
            <div className="gt-insights-goal-list">
              {insights.atRisk.map(goal => (
                <div key={goal.id} className="gt-insights-goal-row" onClick={() => onSelectGoal(goal.id)}>
                  <span className="gt-insights-goal-icon" style={{ color: goal.color }}>
                    <GoalIcon name={goal.icon} size={14} />
                  </span>
                  <span className="gt-insights-goal-name">{goal.name}</span>
                  <span className="gt-insights-goal-pct overdue">{getGoalCompletion(goal)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Completed */}
        {insights.recentCompleted.length > 0 && (
          <div className="gt-insights-panel">
            <h3 className="gt-insights-panel-title">Recently Completed</h3>
            <div className="gt-insights-goal-list">
              {insights.recentCompleted.map(goal => (
                <div key={goal.id} className="gt-insights-goal-row" onClick={() => onSelectGoal(goal.id)}>
                  <span className="gt-insights-goal-icon" style={{ color: goal.color }}>
                    <GoalIcon name={goal.icon} size={14} />
                  </span>
                  <span className="gt-insights-goal-name completed">{goal.name}</span>
                  <span className="gt-insights-goal-date">{goal.completedDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Tracked */}
        {insights.mostTracked.length > 0 && (
          <div className="gt-insights-panel">
            <h3 className="gt-insights-panel-title">Most Tracked</h3>
            <div className="gt-insights-goal-list">
              {insights.mostTracked.map(goal => {
                const vel = getProgressVelocity(goal);
                return (
                  <div key={goal.id} className="gt-insights-goal-row" onClick={() => onSelectGoal(goal.id)}>
                    <span className="gt-insights-goal-icon" style={{ color: goal.color }}>
                      <GoalIcon name={goal.icon} size={14} />
                    </span>
                    <span className="gt-insights-goal-name">{goal.name}</span>
                    <span className="gt-insights-goal-meta">
                      {goal.progressEntries.length} entries
                      {vel && <> &middot; {vel.label}</>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
