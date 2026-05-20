import React, { useState, useRef, useEffect } from 'react';
import { saveKlassen, klassenState } from '../../utils/klassen';
import { normalizeRekenScore } from '../../utils/schema';

interface RekenenNederlandsSectionProps {
  student: any;
}

export default function RekenenNederlandsSection({ student }: RekenenNederlandsSectionProps) {
  const [hint, setHint] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleChange(field: 'rekenResultaat' | 'nederlandsResultaat', value: string) {
    const klas = klassenState.klassen[klassenState.activeKlasId!];
    const rec = klas?.students?.find((s: any) => s.leerlingId === student.leerlingId);
    if (!rec) return;
    rec[field] = value || null;
    const saved = await saveKlassen();
    if (saved === false) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setHint('saved');
    timerRef.current = setTimeout(() => setHint('idle'), 1500);
  }

  const rekenStatus = normalizeRekenScore(student.rekenResultaat ?? null);
  const nederlandsStatus = normalizeRekenScore(student.nederlandsResultaat ?? null);

  function normBadge(status: ReturnType<typeof normalizeRekenScore>) {
    if (status === null) return null;
    const kleur = status === 'onvoldoende' ? 'var(--status-rood-text)' : '#10b981';
    const label =
      status === 'goed' ? '3F — goed' :
      status === 'voldoende' ? '2F — voldoende (norm)' :
      'Onder norm';
    return <span style={{ fontSize: '0.75rem', fontWeight: 600, color: kleur, marginLeft: '0.5rem' }}>{label}</span>;
  }

  return (
    <div className="detail-section">
      <p className="detail-section-title">Rekenen &amp; Nederlands</p>
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
      </div>
      <p
        className="aanvullend-hint"
        style={{ color: hint === 'saved' ? '#10b981' : undefined }}
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
