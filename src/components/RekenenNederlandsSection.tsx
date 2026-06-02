import React, { useState, useRef, useEffect } from 'react';
import { saveKlassen, klassenState } from '../../utils/klassen';
import { normalizeRekenScore } from '../../utils/schema';

interface RekenenNederlandsSectionProps {
  student: any;
  onSaved?: () => void;
}

export default function RekenenNederlandsSection({ student, onSaved }: RekenenNederlandsSectionProps) {
  const [hint, setHint] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleChange(field: 'rekenResultaat' | 'nederlandsResultaat' | 'kdStatus', value: string) {
    if (!klassenState.activeKlasId) return;
    const klas = klassenState.klassen[klassenState.activeKlasId];
    // Update ALL records for this student — R&N is student-level, not period-level.
    // Using find() would only update the oldest record (first match); DetailWeergave
    // displays the most-recent one, so writes and reads would land on different objects
    // for students with two periods imported (e.g. a BJ2 student with fase 1 + fase 2).
    const matching = klas?.students?.filter((s: any) => s.leerlingId === student.leerlingId) ?? [];
    if (matching.length === 0) return;
    for (const rec of matching) rec[field] = value || null;
    const saved = await saveKlassen();
    if (saved === false) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setHint('saved');
    timerRef.current = setTimeout(() => setHint('idle'), 1500);
    onSaved?.();
  }

  const rekenStatus = normalizeRekenScore(student.rekenResultaat ?? null);
  const nederlandsStatus = normalizeRekenScore(student.nederlandsResultaat ?? null);

  function normBadge(status: ReturnType<typeof normalizeRekenScore>) {
    if (status === null) return null;
    const kleur = status === 'onvoldoende' ? 'var(--status-rood-text)' : 'var(--status-groen-text)';
    const label =
      status === 'goed' ? '3F — goed' :
      status === 'voldoende' ? '2F — voldoende (norm)' :
      'Onder norm';
    return <span style={{ fontSize: '0.75rem', fontWeight: 600, color: kleur, marginLeft: '0.5rem' }}>{label}</span>;
  }

  const kdStatus = student.kdStatus ?? '';
  const kdBadge = kdStatus === 'behaald'
    ? <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-groen-text)', marginLeft: '0.5rem' }}>behaald</span>
    : kdStatus === 'haalbaar'
    ? <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--rag-oranje)', marginLeft: '0.5rem' }}>haalbaar</span>
    : kdStatus === 'niet_behaald'
    ? <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-rood-text)', marginLeft: '0.5rem' }}>niet behaald</span>
    : null;

  return (
    <div className="detail-section">
      <p className="detail-section-title">Rekenen, Nederlands &amp; Keuzedeel</p>
      <div className="aanvullend-grid">
        <div className="aanvullend-veld">
          <label htmlFor="rnl-rekenen">
            Rekenen
            {normBadge(rekenStatus)}
          </label>
          <select
            id="rnl-rekenen"
            value={student.rekenResultaat ?? ''}
            onChange={e => handleChange('rekenResultaat', e.target.value)}
          >
            <option value="">— niet ingevuld —</option>
            <option value="3F">3F</option>
            <option value="2F">2F (norm)</option>
            <option value="1F">1F — onder norm</option>
          </select>
        </div>
        <div className="aanvullend-veld">
          <label htmlFor="rnl-nederlands">
            Nederlands
            {normBadge(nederlandsStatus)}
          </label>
          <select
            id="rnl-nederlands"
            value={student.nederlandsResultaat ?? ''}
            onChange={e => handleChange('nederlandsResultaat', e.target.value)}
          >
            <option value="">— niet ingevuld —</option>
            <option value="3F">3F</option>
            <option value="2F">2F (norm)</option>
            <option value="1F">1F — onder norm</option>
          </select>
        </div>
        <div className="aanvullend-veld">
          <label htmlFor="rnl-kd">
            Keuzedeel (KD)
            {kdBadge}
          </label>
          <select
            id="rnl-kd"
            value={kdStatus}
            onChange={e => handleChange('kdStatus', e.target.value)}
          >
            <option value="">— niet ingevuld —</option>
            <option value="behaald">Behaald</option>
            <option value="haalbaar">Haalbaar (vóór 1 dec.)</option>
            <option value="niet_behaald">Niet behaald / haalbaar</option>
          </select>
        </div>
      </div>
      <p
        className="aanvullend-hint"
        style={{ color: hint === 'saved' ? 'var(--status-groen-text)' : undefined }}
      >
        {hint === 'saved' ? 'Opgeslagen' : (
          rekenStatus === null && nederlandsStatus === null
            ? <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Norm: Rekenen 2F · Nederlands 2F (MBO-3 landelijk)</span>
            : null
        )}
      </p>
    </div>
  );
}
