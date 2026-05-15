import React from 'react';

interface KlasTabStripProps {
  klassen: Array<{ id: string; naam: string }>;
  activeKlasId: string | null;
  onSwitch: (klasId: string) => void;
  onCreateKlas: () => void;
}

// WR-01: klassen passed as explicit prop from App.tsx (derived from klassenState.klassen at
// the point where refreshKey is consumed) instead of read from the singleton inside the component.
// This removes the implicit coupling and ensures the tab strip always reflects the current state.
export default function KlasTabStrip({ klassen, activeKlasId, onSwitch, onCreateKlas }: KlasTabStripProps) {
  if (klassen.length === 0) {
    return null;
  }

  return (
    <nav id="main-nav">
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
        style={{ color: '#3b82f6' }}
        title="Nieuwe klas aanmaken"
        onClick={onCreateKlas}
      >
        +
      </button>
    </nav>
  );
}
