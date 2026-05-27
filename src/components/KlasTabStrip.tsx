import React from 'react';
import logoLight from '../assets/logo-light.png';
import logoDark from '../assets/logo-dark.png';

interface KlasTabStripProps {
  klassen: Array<{ id: string; naam: string; canDelete: boolean }>;
  activeKlasId: string | null;
  onSwitch: (klasId: string) => void;
  onCreateKlas: () => void;
  onSettings: () => void;
  onFeedback: () => void;
  onDeleteKlas: (klasId: string) => void;
  onRenameKlas: (klasId: string, newNaam: string) => void;
  isSettingsActive: boolean;
  isDark: boolean;
}

// WR-01: klassen passed as explicit prop from App.tsx (derived from klassenState.klassen at
// the point where refreshKey is consumed) instead of read from the singleton inside the component.
// This removes the implicit coupling and ensures the tab strip always reflects the current state.
export default function KlasTabStrip({
  klassen,
  activeKlasId,
  onSwitch,
  onCreateKlas,
  onSettings,
  onFeedback,
  onDeleteKlas,
  onRenameKlas,
  isSettingsActive,
  isDark,
}: KlasTabStripProps) {
  const [editingKlasId, setEditingKlasId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const isCommittingRef = React.useRef<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Pre-select input text when entering edit mode
  React.useEffect(() => {
    if (editingKlasId !== null && inputRef.current) {
      inputRef.current.select();
    }
  }, [editingKlasId]);

  function commitRename(klasId: string): void {
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;
    try {
      if (editValue.trim().length === 0) { setEditingKlasId(null); return; }
      onRenameKlas(klasId, editValue.trim());
      setEditingKlasId(null);
    } finally {
      // WR-01: reset after synchronous state updates are queued so that a
      // browser-fired onBlur (after Enter unmounts the input) cannot re-enter
      Promise.resolve().then(() => { isCommittingRef.current = false; });
    }
  }

  return (
    <nav id="main-nav">
      <img src={isDark ? logoDark : logoLight} alt="CIOS Zuidwest logo" style={{ height: '36px', width: 'auto', marginRight: '16px' }} />
      {klassen.map(klas => (
        <div
          key={klas.id}
          role="tab"
          tabIndex={0}
          className={`nav-tab${klas.id === activeKlasId ? ' active' : ''}`}
          onClick={() => { if (editingKlasId !== klas.id) onSwitch(klas.id); }}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && editingKlasId !== klas.id) {
              e.preventDefault(); // WR-05: prevent Space from scrolling the page
              onSwitch(klas.id);
            }
          }}
        >
          {editingKlasId === klas.id ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              autoFocus
              className="tab-rename-input"
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename(klas.id);
                if (e.key === 'Escape') {
                  setEditingKlasId(null);
                  isCommittingRef.current = false;
                }
              }}
              onBlur={() => commitRename(klas.id)}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              onDoubleClick={e => {
                e.stopPropagation();
                setEditingKlasId(klas.id);
                setEditValue(klas.naam);
                isCommittingRef.current = false;
              }}
            >
              {klas.naam}
            </span>
          )}
          {klas.canDelete && (
            <button
              className="delete-tab-btn"
              title="Klas verwijderen"
              aria-label={`Klas ${klas.naam} verwijderen`}
              onClick={e => { e.stopPropagation(); onDeleteKlas(klas.id); }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        className="nav-tab"
        style={{ color: 'var(--accent)' }}
        title="Nieuwe klas aanmaken"
        onClick={onCreateKlas}
      >
        +
      </button>
      <button
        className="nav-tab"
        style={{ fontSize: '18px' }}
        title="Fout melden"
        aria-label="Fout melden"
        onClick={onFeedback}
      >
        🐛
      </button>
      <button
        className={`nav-tab${isSettingsActive ? ' active' : ''}`}
        style={{ marginLeft: 'auto', fontSize: '18px' }}
        title="Instellingen"
        aria-label="Instellingen openen"
        onClick={onSettings}
      >
        ⚙
      </button>
    </nav>
  );
}
