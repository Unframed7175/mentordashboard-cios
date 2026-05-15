import React, { useState, useRef, useEffect } from 'react';
import { saveKlassen, klassenState } from '../../utils/klassen';

interface AanvullendSectionProps {
  student: any;
}

export default function AanvullendSection({ student }: AanvullendSectionProps) {
  const [hint, setHint] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CR-07: Clear the hint timer when the component unmounts to avoid calling
  // setHint('idle') on an unmounted component (resource leak in React 18 strict mode).
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleChange(field: 'taalniveau' | 'rekenniveau', value: string) {
    // CR-06: Mutate the source record in klassenState directly, not the local prop copy.
    // When DetailWeergave passes student as records[idx] (the real array reference), this
    // is equivalent. The explicit lookup below also handles the edge case where student
    // is a different reference (e.g., a merged copy from an older code path) by finding
    // the canonical record by leerlingId.
    const klas = klassenState.klassen[klassenState.activeKlasId!];
    const rec = klas?.students?.find((s: any) => s.leerlingId === student.leerlingId);
    if (!rec) return;
    rec[field] = value;
    const saved = await saveKlassen();
    if (saved === false) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setHint('saved');
    timerRef.current = setTimeout(() => setHint('idle'), 1500);
  }

  return (
    <div className="detail-section">
      <p className="detail-section-title">Aanvullende gegevens</p>
      <div className="aanvullend-grid">
        <div className="aanvullend-veld">
          <label htmlFor="aanv-taal">Taalniveau</label>
          <select
            id="aanv-taal"
            value={student.taalniveau || ''}
            onChange={e => handleChange('taalniveau', e.target.value)}
          >
            <option value="">— niet ingevuld —</option>
            <option value="2F">2F</option>
            <option value="3F">3F</option>
          </select>
        </div>
        <div className="aanvullend-veld">
          <label htmlFor="aanv-rekenen">Rekenniveau</label>
          <select
            id="aanv-rekenen"
            value={student.rekenniveau || ''}
            onChange={e => handleChange('rekenniveau', e.target.value)}
          >
            <option value="">— niet ingevuld —</option>
            <option value="MBO 3">MBO 3</option>
            <option value="MBO 4">MBO 4</option>
          </select>
        </div>
      </div>
      <p
        className="aanvullend-hint"
        style={{ color: hint === 'saved' ? '#10b981' : undefined }}
      >
        {hint === 'saved' ? 'Opgeslagen' : ''}
      </p>
    </div>
  );
}
