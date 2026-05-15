import React from 'react';
import { klassenState } from '../../utils/klassen';

interface KlasTabStripProps {
  activeKlasId: string | null;
  onSwitch: (klasId: string) => void;
  onCreateKlas: () => void;
}

export default function KlasTabStrip({ activeKlasId, onSwitch, onCreateKlas }: KlasTabStripProps) {
  const klassen = Object.values(klassenState.klassen) as Array<{ id: string; naam: string }>;

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
