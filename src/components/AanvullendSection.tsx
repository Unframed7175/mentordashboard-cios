import React, { useState, useRef } from 'react';
import { saveKlassen } from '../../utils/klassen';

interface AanvullendSectionProps {
  student: any;
}

export default function AanvullendSection({ student }: AanvullendSectionProps) {
  const [hint, setHint] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleChange(field: 'taalniveau' | 'rekenniveau', value: string) {
    student[field] = value;
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
