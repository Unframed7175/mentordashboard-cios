import React from 'react';
import logoLight from '../assets/logo-light.png';
import logoDark from '../assets/logo-dark.png';

interface KlasTabStripProps {
  klassen: Array<{ id: string; naam: string }>;
  activeKlasId: string | null;
  onSwitch: (klasId: string) => void;
  onCreateKlas: () => void;
  onSettings: () => void;
  onFeedback: () => void;
  onDeleteKlas: (klasId: string) => void;
  onRenameKlas: (klasId: string, newNaam: string) => void;
  isSettingsActive: boolean;
  isDark: boolean;
  onHelp: () => void;
  isHelpActive: boolean;
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
  onHelp,
  isHelpActive,
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
      <img src={isDark ? logoDark : logoLight} alt="CIOS Zuidwest logo" style={{ height: '72px', width: 'auto', marginRight: '16px' }} />
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
              onBlur={() => { setEditingKlasId(null); isCommittingRef.current = false; }}
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
          <button
              className="delete-tab-btn"
              title="Klas verwijderen"
              aria-label={`Klas ${klas.naam} verwijderen`}
              onClick={e => { e.stopPropagation(); onDeleteKlas(klas.id); }}
            >
              ×
            </button>
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
        title="Fout melden"
        aria-label="Fout melden"
        onClick={onFeedback}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2l1.5 1.5"/>
          <path d="M16 2l-1.5 1.5"/>
          <circle cx="12" cy="11" r="5"/>
          <path d="M12 6V2"/>
          <path d="M5 8l-2-2"/>
          <path d="M19 8l2-2"/>
          <path d="M5 16l-2 2"/>
          <path d="M19 16l2 2"/>
          <path d="M9 10h6"/>
          <path d="M9 13h6"/>
        </svg>
      </button>
      <button
        className={`nav-tab${isHelpActive ? ' active' : ''}`}
        title="Help"
        aria-label="Help openen"
        onClick={onHelp}
      >
        ?
      </button>
      <button
        className={`nav-tab${isSettingsActive ? ' active' : ''}`}
        style={{ marginLeft: 'auto' }}
        title="Instellingen"
        aria-label="Instellingen openen"
        onClick={onSettings}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
      <div aria-hidden="true" className="nav-stripe" />
    </nav>
  );
}
