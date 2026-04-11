import { Modal } from './Modal.tsx';

interface ShortcutsHelpProps {
  onClose: () => void;
}

const SHORTCUTS: { key: string; desc: string }[] = [
  { key: '1', desc: 'List view' },
  { key: '2', desc: 'Timeline view' },
  { key: '3', desc: 'Board view' },
  { key: 'N', desc: 'New goal' },
  { key: 'A', desc: 'Cycle status tabs' },
  { key: '/', desc: 'Focus search' },
  { key: 'Enter', desc: 'Open goal detail' },
  { key: 'Esc', desc: 'Close panel / modal' },
  { key: '\u2191 / \u2193', desc: 'Navigate goals' },
  { key: '?', desc: 'Show this help' },
];

export function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  return (
    <Modal title="Keyboard Shortcuts" onClose={onClose}>
      <div className="shortcuts-list">
        {SHORTCUTS.map(s => (
          <div key={s.key} className="shortcuts-row">
            <kbd className="shortcuts-key">{s.key}</kbd>
            <span className="shortcuts-desc">{s.desc}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
