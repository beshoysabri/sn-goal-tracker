import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import type { GoalTrackerData, Goal, LifeArea, ViewType, StatusTab, TimeScale, GoalStatus } from '../types/goal.ts';
import { todayStr } from '../lib/calendar.ts';
import { getTrackerStats } from '../lib/stats.ts';
import { Header } from './Header.tsx';
import { GoalSidebar } from './GoalSidebar.tsx';
import { GoalDetail } from './GoalDetail.tsx';
import { GoalModal } from './GoalModal.tsx';
import { LifeAreaModal } from './LifeAreaModal.tsx';
import { ConfirmDialog } from './shared/ConfirmDialog.tsx';
import { ShortcutsHelp } from './shared/ShortcutsHelp.tsx';
import { ListView } from './views/ListView.tsx';
import { TimelineView } from './views/TimelineView.tsx';
import { BoardView } from './views/BoardView.tsx';
import { InsightsView } from './views/InsightsView.tsx';

interface GoalTrackerProps {
  data: GoalTrackerData;
  onChange: (data: GoalTrackerData) => void;
}

export function GoalTracker({ data, onChange }: GoalTrackerProps) {
  // View state
  const [view, setView] = useState<ViewType>('list');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [timeScale, setTimeScale] = useState<TimeScale>('Y');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterAreaId, setFilterAreaId] = useState<string | null>(null);

  // Selection state
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [showLifeAreaModal, setShowLifeAreaModal] = useState(false);
  const [editingLifeArea, setEditingLifeArea] = useState<LifeArea | undefined>(undefined);

  // Help
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Sub-goal creation context
  const pendingParentRef = useRef<{ id: string; lifeAreaId?: string } | null>(null);

  // Confirm dialogs
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<string | null>(null);
  const [confirmDeleteArea, setConfirmDeleteArea] = useState<string | null>(null);

  // Derived state
  const selectedGoal = useMemo(
    () => selectedGoalId ? data.goals.find(g => g.id === selectedGoalId) : undefined,
    [data.goals, selectedGoalId]
  );

  const stats = useMemo(() => getTrackerStats(data), [data]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Goal CRUD
  const handleSaveGoal = useCallback((goal: Goal) => {
    const exists = data.goals.some(g => g.id === goal.id);
    const newGoals = exists
      ? data.goals.map(g => g.id === goal.id ? goal : g)
      : [...data.goals, goal];
    onChange({ ...data, goals: newGoals });
    setShowGoalModal(false);
    setEditingGoal(undefined);
  }, [data, onChange]);

  const handleDeleteGoal = useCallback((goalId: string) => {
    // Also delete sub-goals
    const idsToDelete = new Set<string>();
    const collectChildren = (parentId: string) => {
      idsToDelete.add(parentId);
      data.goals.filter(g => g.parentGoalId === parentId).forEach(g => collectChildren(g.id));
    };
    collectChildren(goalId);

    onChange({ ...data, goals: data.goals.filter(g => !idsToDelete.has(g.id)) });
    if (selectedGoalId && idsToDelete.has(selectedGoalId)) {
      setSelectedGoalId(null);
      setShowDetail(false);
    }
    setConfirmDeleteGoal(null);
  }, [data, onChange, selectedGoalId]);

  const handleArchiveGoal = useCallback((goalId: string) => {
    onChange({
      ...data,
      goals: data.goals.map(g =>
        g.id === goalId ? { ...g, archived: !g.archived, updatedAt: new Date().toISOString() } : g
      ),
    });
  }, [data, onChange]);

  const handleUpdateGoal = useCallback((updated: Goal) => {
    onChange({
      ...data,
      goals: data.goals.map(g => g.id === updated.id ? updated : g),
    });
  }, [data, onChange]);

  const handleUpdateStatus = useCallback((goalId: string, status: GoalStatus) => {
    onChange({
      ...data,
      goals: data.goals.map(g => {
        if (g.id !== goalId) return g;
        const updated = { ...g, status, updatedAt: new Date().toISOString() };
        if (status === 'completed') updated.completedDate = todayStr();
        else updated.completedDate = undefined;
        return updated;
      }),
    });
  }, [data, onChange]);

  const handleQuickComplete = useCallback((goalId: string) => {
    onChange({
      ...data,
      goals: data.goals.map(g => {
        if (g.id !== goalId) return g;
        return { ...g, status: 'completed' as GoalStatus, completedDate: todayStr(), updatedAt: new Date().toISOString() };
      }),
    });
    showToast('Goal completed!');
  }, [data, onChange, showToast]);

  const handleDuplicateGoal = useCallback(() => {
    if (!selectedGoal) return;
    const now = new Date().toISOString();
    const dupe: Goal = {
      ...selectedGoal,
      id: uuid(),
      name: `${selectedGoal.name} (copy)`,
      status: 'active',
      completedDate: undefined,
      currentValue: selectedGoal.trackingType === 'numeric' ? 0 : undefined,
      tasks: selectedGoal.tasks.map(t => ({ ...t, id: uuid(), completed: false })),
      progressEntries: [],
      notes: selectedGoal.notes,
      sortOrder: Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    onChange({ ...data, goals: [...data.goals, dupe] });
    setSelectedGoalId(dupe.id);
    showToast('Goal duplicated');
  }, [selectedGoal, data, onChange, showToast]);

  // Life Area CRUD
  const handleSaveLifeArea = useCallback((area: LifeArea) => {
    const exists = data.lifeAreas.some(a => a.id === area.id);
    const newAreas = exists
      ? data.lifeAreas.map(a => a.id === area.id ? area : a)
      : [...data.lifeAreas, area];
    onChange({ ...data, lifeAreas: newAreas });
    setShowLifeAreaModal(false);
    setEditingLifeArea(undefined);
  }, [data, onChange]);

  const handleUpdateTitle = useCallback((title: string, subtitle: string) => {
    onChange({ ...data, title: title || undefined, subtitle: subtitle || undefined });
  }, [data, onChange]);

  const handleReorderAreas = useCallback((areas: LifeArea[]) => {
    onChange({ ...data, lifeAreas: areas });
  }, [data, onChange]);

  const handleDeleteLifeArea = useCallback((areaId: string) => {
    onChange({
      ...data,
      lifeAreas: data.lifeAreas.filter(a => a.id !== areaId),
      // Unlink goals from deleted area
      goals: data.goals.map(g =>
        g.lifeAreaId === areaId ? { ...g, lifeAreaId: undefined } : g
      ),
    });
    setConfirmDeleteArea(null);
    setShowLifeAreaModal(false);
    setEditingLifeArea(undefined);
  }, [data, onChange]);

  // Navigation
  const handleSelectGoal = useCallback((goalId: string | null) => {
    setSelectedGoalId(goalId);
    setFilterAreaId(null);
    setShowDetail(false);
    setSidebarOpen(false);
  }, []);

  const handleFilterByArea = useCallback((areaId: string) => {
    setFilterAreaId(prev => prev === areaId ? null : areaId);
    setSelectedGoalId(null);
    setShowDetail(false);
  }, []);

  const handleOpenGoalDetail = useCallback((goalId: string) => {
    setSelectedGoalId(goalId);
    setShowDetail(true);
    setSidebarOpen(false);
  }, []);

  const handleOpenNewGoal = useCallback(() => {
    setEditingGoal(undefined);
    setShowGoalModal(true);
  }, []);

  const handleOpenEditGoal = useCallback(() => {
    if (selectedGoal) {
      setEditingGoal(selectedGoal);
      setShowGoalModal(true);
    }
  }, [selectedGoal]);

  const handleOpenNewLifeArea = useCallback(() => {
    setEditingLifeArea(undefined);
    setShowLifeAreaModal(true);
  }, []);

  const handleEditLifeArea = useCallback((area: LifeArea) => {
    setEditingLifeArea(area);
    setShowLifeAreaModal(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case '1': setView('list'); break;
        case '2': setView('timeline'); break;
        case '3': setView('board'); break;
        case '4': setView('insights'); break;
        case 'n': case 'N': handleOpenNewGoal(); break;
        case 'a': case 'A':
          setStatusTab(prev => prev === 'active' ? 'completed' : prev === 'completed' ? 'all' : 'active');
          break;
        case '/':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('.gt-search-input')?.focus();
          break;
        case '?': setShowShortcuts(s => !s); break;
        case 'Escape':
          if (showShortcuts) setShowShortcuts(false);
          else if (showGoalModal) { setShowGoalModal(false); setEditingGoal(undefined); }
          else if (showLifeAreaModal) { setShowLifeAreaModal(false); setEditingLifeArea(undefined); }
          else if (showDetail) setShowDetail(false);
          break;
        case 'Enter':
          if (selectedGoalId && !showDetail && !showGoalModal) {
            setShowDetail(true);
          }
          break;
        case 'ArrowUp': {
          const visibleGoals = data.goals.filter(g => !g.archived);
          if (visibleGoals.length === 0) break;
          const idx = visibleGoals.findIndex(g => g.id === selectedGoalId);
          const newIdx = idx <= 0 ? visibleGoals.length - 1 : idx - 1;
          setSelectedGoalId(visibleGoals[newIdx].id);
          break;
        }
        case 'ArrowDown': {
          const visibleGoals = data.goals.filter(g => !g.archived);
          if (visibleGoals.length === 0) break;
          const idx = visibleGoals.findIndex(g => g.id === selectedGoalId);
          const newIdx = idx < 0 || idx >= visibleGoals.length - 1 ? 0 : idx + 1;
          setSelectedGoalId(visibleGoals[newIdx].id);
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [data.goals, selectedGoalId, showDetail, showGoalModal, showLifeAreaModal, handleOpenNewGoal]);

  // Render view
  const renderView = () => {
    if (showDetail && selectedGoal) {
      return (
        <GoalDetail
          goal={selectedGoal}
          data={data}
          onBack={() => setShowDetail(false)}
          onEdit={handleOpenEditGoal}
          onDuplicate={handleDuplicateGoal}
          onDelete={() => setConfirmDeleteGoal(selectedGoal.id)}
          onArchive={() => handleArchiveGoal(selectedGoal.id)}
          onUpdateGoal={handleUpdateGoal}
          onNavigateGoal={handleOpenGoalDetail}
          onAddSubGoal={(parentId) => {
            const parent = data.goals.find(g => g.id === parentId);
            setEditingGoal(undefined);
            setShowGoalModal(true);
            // Store parent info for pre-fill — we'll use a ref
            pendingParentRef.current = { id: parentId, lifeAreaId: parent?.lifeAreaId };
          }}
        />
      );
    }

    switch (view) {
      case 'list':
        return (
          <ListView
            data={data}
            statusTab={statusTab}
            searchQuery={searchQuery}
            filterAreaId={filterAreaId}
            onSelectGoal={handleOpenGoalDetail}
            onQuickComplete={handleQuickComplete}
          />
        );
      case 'timeline':
        return (
          <TimelineView
            data={data}
            statusTab={statusTab}
            searchQuery={searchQuery}
            timeScale={timeScale}
            onTimeScaleChange={setTimeScale}
            onSelectGoal={handleOpenGoalDetail}
          />
        );
      case 'board':
        return (
          <BoardView
            data={data}
            statusTab={statusTab}
            searchQuery={searchQuery}
            onSelectGoal={handleOpenGoalDetail}
            onUpdateStatus={handleUpdateStatus}
          />
        );
      case 'insights':
        return (
          <InsightsView
            data={data}
            onSelectGoal={handleOpenGoalDetail}
          />
        );
    }
  };

  return (
    <>
      <Header
        view={view}
        statusTab={statusTab}
        data={data}
        onViewChange={setView}
        onStatusTabChange={setStatusTab}
        onAddGoal={handleOpenNewGoal}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onShowShortcuts={() => setShowShortcuts(true)}
        onUpdateTitle={handleUpdateTitle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showDetail={showDetail}
      />
      <div className={`gt-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {sidebarOpen && (
          <div className="gt-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        <GoalSidebar
          data={data}
          selectedGoalId={selectedGoalId}
          filterAreaId={filterAreaId}
          onSelectGoal={handleSelectGoal}
          onFilterByArea={handleFilterByArea}
          onAddGoal={handleOpenNewGoal}
          onAddLifeArea={handleOpenNewLifeArea}
          onEditLifeArea={handleEditLifeArea}
          onReorderAreas={handleReorderAreas}
        />

        <div className="gt-content">
          {renderView()}
        </div>
      </div>
      <div className="gt-statusbar">
        <span>{stats.activeCount} active</span>
        <span>{stats.completedCount} completed</span>
        {stats.overdueCount > 0 && (
          <span className="gt-statusbar-overdue">{stats.overdueCount} overdue</span>
        )}
        <span>{stats.avgCompletion}% avg completion</span>
      </div>

      {/* Modals */}
      {showGoalModal && (
        <GoalModal
          goal={editingGoal}
          lifeAreas={data.lifeAreas}
          goals={data.goals}
          defaultParentGoalId={pendingParentRef.current?.id}
          defaultLifeAreaId={pendingParentRef.current?.lifeAreaId}
          onSave={(g) => { handleSaveGoal(g); pendingParentRef.current = null; }}
          onClose={() => { setShowGoalModal(false); setEditingGoal(undefined); pendingParentRef.current = null; }}
        />
      )}

      {showLifeAreaModal && (
        <LifeAreaModal
          lifeArea={editingLifeArea}
          onSave={handleSaveLifeArea}
          onDelete={editingLifeArea ? () => setConfirmDeleteArea(editingLifeArea.id) : undefined}
          onClose={() => { setShowLifeAreaModal(false); setEditingLifeArea(undefined); }}
        />
      )}

      {confirmDeleteGoal && (
        <ConfirmDialog
          title="Delete Goal"
          message="Are you sure you want to delete this goal and all its sub-goals? This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteGoal(confirmDeleteGoal)}
          onCancel={() => setConfirmDeleteGoal(null)}
        />
      )}

      {confirmDeleteArea && (
        <ConfirmDialog
          title="Delete Life Area"
          message="Are you sure? Goals in this area will become ungrouped."
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteLifeArea(confirmDeleteArea)}
          onCancel={() => setConfirmDeleteArea(null)}
        />
      )}

      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}

      {toast && <div className="gt-toast">{toast}</div>}
    </>
  );
}
