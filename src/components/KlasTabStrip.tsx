import React from 'react';
import logoLight from '../assets/logo-light.png';
import logoDark from '../assets/logo-dark.png';

interface KlasTabStripProps {
  klassen: Array<{ id: string; naam: string }>;
  activeKlasId: string | null;
  onSwitch: (klasId: string) => void;
  onCreateKlas: () => void;
  onSettings: () => void;
  isSettingsActive: boolean;
  isDark: boolean;
}

// WR-01: klassen passed as explicit prop from App.tsx (derived from klassenState.klassen at
// the point where refreshKey is consumed) instead of read from the singleton inside the component.
// This removes the implicit coupling and ensures the tab strip always reflects the current state.
export default function KlasTabStrip({ klassen, activeKlasId, onSwitch, onCreateKlas, onSettings, isSettingsActive, isDark }: KlasTabStripProps) {
  return (
    <nav id="main-nav">
      <img src={isDark ? logoDark : logoLight} alt="CIOS Zuidwest logo" style={{ height: '36px', width: 'auto', marginRight: '16px' }} />
      {klassen.map(klas => (
        <button
          key={klas.id}
          className={`nav-tab${klas.id === activeKlasId ? ' active' : ''}`}
          onClick={() => onSwitch(klas.id)}
        >
          {klas.naam}
        </button>
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
