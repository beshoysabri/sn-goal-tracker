import { useState, type ReactNode } from 'react';
import type { ViewType, StatusTab, GoalTrackerData } from '../types/goal.ts';
import { ExportMenu } from './shared/ExportMenu.tsx';

interface HeaderProps {
  view: ViewType;
  statusTab: StatusTab;
  data: GoalTrackerData;
  onViewChange: (view: ViewType) => void;
  onStatusTabChange: (tab: StatusTab) => void;
  onAddGoal: () => void;
  onToggleSidebar: () => void;
  onShowShortcuts: () => void;
  onUpdateTitle: (title: string, subtitle: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showDetail?: boolean;
}

const VIEW_ICONS: { key: ViewType; label: string; icon: ReactNode }[] = [
  {
    key: 'list',
    label: 'List',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    key: 'timeline',
    label: 'Timeline',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="1" y="4" width="8" height="4" rx="1" /><rect x="5" y="10" width="12" height="4" rx="1" /><rect x="3" y="16" width="16" height="4" rx="1" />
      </svg>
    ),
  },
  {
    key: 'board',
    label: 'Board',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" />
      </svg>
    ),
  },
];

export function Header({
  view,
  statusTab,
  data,
  onViewChange,
  onStatusTabChange,
  onAddGoal,
  onToggleSidebar,
  onShowShortcuts,
  onUpdateTitle,
  searchQuery,
  onSearchChange,
  showDetail,
}: HeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data.title || '');
  const [subtitleDraft, setSubtitleDraft] = useState(data.subtitle || '');

  const handleSaveTitle = () => {
    onUpdateTitle(titleDraft.trim(), subtitleDraft.trim());
    setEditingTitle(false);
  };

  const displayTitle = data.title || 'My Goals';

  return (
    <div className="gt-header">
      <div className="gt-header-left">
        <button className="gt-icon-btn gt-hamburger" onClick={onToggleSidebar} title="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {editingTitle ? (
          <div className="gt-title-edit">
            <input
              className="gt-title-input"
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              placeholder="Page title"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            />
            <input
              className="gt-subtitle-input"
              value={subtitleDraft}
              onChange={e => setSubtitleDraft(e.target.value)}
              placeholder="Subtitle (optional)"
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            />
            <button className="btn-primary btn-sm" onClick={handleSaveTitle}>Save</button>
          </div>
        ) : (
          <div className="gt-title-display" onDoubleClick={() => { setTitleDraft(data.title || ''); setSubtitleDraft(data.subtitle || ''); setEditingTitle(true); }}>
            <span className="gt-title-text">{displayTitle}</span>
            {data.subtitle && <span className="gt-subtitle-text">{data.subtitle}</span>}
          </div>
        )}
        {!showDetail && !editingTitle && (
          <div className="gt-view-toggle">
            {VIEW_ICONS.map(v => (
              <button
                key={v.key}
                className={`gt-view-btn ${view === v.key ? 'active' : ''}`}
                onClick={() => onViewChange(v.key)}
                title={v.label}
              >
                {v.icon}
                <span className="gt-view-btn-label">{v.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!showDetail && (
        <div className="gt-header-center">
          <div className="gt-status-tabs">
            <button
              className={`gt-status-tab ${statusTab === 'active' ? 'active' : ''}`}
              onClick={() => onStatusTabChange('active')}
            >
              Active
            </button>
            <button
              className={`gt-status-tab ${statusTab === 'completed' ? 'active' : ''}`}
              onClick={() => onStatusTabChange('completed')}
            >
              Completed
            </button>
            <button
              className={`gt-status-tab ${statusTab === 'all' ? 'active' : ''}`}
              onClick={() => onStatusTabChange('all')}
            >
              All
            </button>
          </div>
        </div>
      )}

      <div className="gt-header-right">
        {!showDetail && (
          <div className="gt-search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="gt-search-input"
            />
          </div>
        )}
        <ExportMenu data={data} />
        <button className="gt-icon-btn" onClick={onShowShortcuts} title="Keyboard shortcuts (?)">
          <span style={{ fontSize: 14, fontWeight: 700 }}>?</span>
        </button>
        <button className="btn-primary gt-add-btn" onClick={onAddGoal}>
          + Goal
        </button>
      </div>
    </div>
  );
}
