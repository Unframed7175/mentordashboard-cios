import React, { useState, useRef, useEffect } from 'react';
import { saveKlassen, klassenState, getEffectieveVestiging, getMatchingRecords } from '../../utils/klassen';
import { detectTraject } from '../utils/status';

interface RoosendaalTrajectSectionProps {
  student: any;
  onSaved?: () => void;
}

// M42 T3b — roosendaalTraject: 'sbl' | 'sbc' | null.
// Deliberately NOT folded into TrajectVeldenSection's TRAJECT_VELDEN array (see
// controller ruling in task brief): that array's rendering/persistence is hardcoded
// for boolean|null tri-state fields, while this is a 3-value string enum with the
// OPPOSITE visibility gate (BJ2-only, and only at the Roosendaal vestiging). Reuses
// the same underlying persistence PATTERN (getMatchingRecords → mutate → saveKlassen),
// not the same component. getMatchingRecords itself is imported from utils/klassen.ts
// (a thin alias for getAllRecordsForStudent) — there is one implementation shared by
// this component, TrajectVeldenSection and KeuzedeelSection.

/** undefined (never set) is treated identically to null ("nog niet gekozen"). */
function normalizeRoosendaalTraject(raw: any): 'sbl' | 'sbc' | null {
  return raw === 'sbl' || raw === 'sbc' ? raw : null;
}

export default function RoosendaalTrajectSection({ student, onSaved }: RoosendaalTrajectSectionProps) {
  const [hint, setHint] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function flashSaved() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHint('saved');
    timerRef.current = setTimeout(() => setHint('idle'), 1500);
  }

  async function handleChange(value: 'sbl' | 'sbc' | null) {
    const records = getMatchingRecords(student.leerlingId);
    if (records.length === 0) return;
    for (const rec of records) rec.roosendaalTraject = value;
    const saved = await saveKlassen();
    if (saved !== false) flashSaved();
    onSaved?.();
  }

  if (detectTraject(student) !== 'bj2') return null;

  const klas = klassenState.activeKlasId ? klassenState.klassen[klassenState.activeKlasId] : null;
  if (!klas || getEffectieveVestiging(klas) !== 'roosendaal') return null;

  const value = normalizeRoosendaalTraject(student.roosendaalTraject);

  return (
    <div className="detail-section">
      <p className="detail-section-title">Roosendaal-traject</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <span style={{ flex: 1, minWidth: 0, fontWeight: 500, fontSize: '0.9rem' }}>Roosendaal-traject</span>
        <select
          aria-label="Roosendaal-traject"
          value={value === null ? '' : value}
          onChange={e => {
            const v = e.target.value;
            handleChange(v === '' ? null : (v as 'sbl' | 'sbc'));
          }}
          style={{ fontSize: '0.85rem', padding: '4px 6px' }}
        >
          <option value="">Nog niet gekozen</option>
          <option value="sbl">SBL</option>
          <option value="sbc">SBC</option>
        </select>
      </div>

      <p
        className="aanvullend-hint"
        style={{ color: hint === 'saved' ? 'var(--status-groen-text)' : undefined }}
      >
        {hint === 'saved' ? 'Opgeslagen' : ''}
      </p>
    </div>
  );
}
