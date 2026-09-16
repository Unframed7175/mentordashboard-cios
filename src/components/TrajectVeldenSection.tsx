import React, { useState, useRef, useEffect } from 'react';
import { saveKlassen, klassenState } from '../../utils/klassen';
import { detectTraject } from '../utils/status';

interface TrajectVeldenSectionProps {
  student: any;
  onSaved?: () => void;
}

interface TrajectVeld {
  /** Field name on the student record, e.g. student.wvoTraject */
  key: string;
  /** Label shown next to the tri-state select */
  label: string;
}

// M42 T3 — wvoTraject. A follow-up task (T3b) adds a sibling field
// (roosendaalTraject) here — same boolean|null shape, same persistence path.
// Add new fields to this array; the rendering + persistence logic below is generic.
const TRAJECT_VELDEN: TrajectVeld[] = [
  { key: 'wvoTraject', label: 'WVO-traject' },
];

function getMatchingRecords(leerlingId: string): any[] {
  if (!klassenState.activeKlasId) return [];
  const klas = klassenState.klassen[klassenState.activeKlasId];
  return klas?.students?.filter((s: any) => s.leerlingId === leerlingId) ?? [];
}

/** undefined (never set) is treated identically to null ("nog niet ingevuld"). */
function normalizeTriState(raw: any): boolean | null {
  return raw === true || raw === false ? raw : null;
}

export default function TrajectVeldenSection({ student, onSaved }: TrajectVeldenSectionProps) {
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

  async function handleChange(key: string, value: boolean | null) {
    const records = getMatchingRecords(student.leerlingId);
    if (records.length === 0) return;
    for (const rec of records) rec[key] = value;
    const saved = await saveKlassen();
    if (saved !== false) flashSaved();
    onSaved?.();
  }

  if (detectTraject(student) !== 'bj1') return null;

  return (
    <div className="detail-section">
      <p className="detail-section-title">Traject-velden</p>

      {TRAJECT_VELDEN.map(veld => {
        const value = normalizeTriState(student[veld.key]);
        return (
          <div
            key={veld.key}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}
          >
            <span style={{ flex: 1, minWidth: 0, fontWeight: 500, fontSize: '0.9rem' }}>{veld.label}</span>
            <select
              aria-label={veld.label}
              value={value === null ? '' : value ? 'ja' : 'nee'}
              onChange={e => {
                const v = e.target.value;
                handleChange(veld.key, v === '' ? null : v === 'ja');
              }}
              style={{ fontSize: '0.85rem', padding: '4px 6px' }}
            >
              <option value="">Nog niet ingevuld</option>
              <option value="ja">Ja</option>
              <option value="nee">Nee</option>
            </select>
          </div>
        );
      })}

      <p
        className="aanvullend-hint"
        style={{ color: hint === 'saved' ? 'var(--status-groen-text)' : undefined }}
      >
        {hint === 'saved' ? 'Opgeslagen' : ''}
      </p>
    </div>
  );
}
