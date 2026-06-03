import React, { useState, useRef, useEffect } from 'react';
import { saveKlassen, klassenState } from '../../utils/klassen';
import { normalizeRekenScore, berekenNederlandsEindcijfer } from '../../utils/schema';

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

  function showSaved() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHint('saved');
    timerRef.current = setTimeout(() => setHint('idle'), 1500);
  }

  async function handleChange(field: 'rekenResultaat', value: string) {
    if (!klassenState.activeKlasId) return;
    const klas = klassenState.klassen[klassenState.activeKlasId];
    // Update ALL records for this student — R&N is student-level, not period-level.
    const matching = klas?.students?.filter((s: any) => s.leerlingId === student.leerlingId) ?? [];
    if (matching.length === 0) return;
    for (const rec of matching) rec[field] = value || null;
    const saved = await saveKlassen();
    if (saved === false) return;
    showSaved();
    onSaved?.();
  }

  async function handleNlOnderdeel(
    field: 'nlLezen' | 'nlSpreken' | 'nlGesprekvoeren' | 'nlSchrijven',
    value: string
  ) {
    if (!klassenState.activeKlasId) return;
    const klas = klassenState.klassen[klassenState.activeKlasId];
    const matching = klas?.students?.filter((s: any) => s.leerlingId === student.leerlingId) ?? [];
    if (matching.length === 0) return;
    for (const rec of matching) {
      rec[field] = value || null;
      const eindcijfer = berekenNederlandsEindcijfer(rec.nlLezen, rec.nlSpreken, rec.nlGesprekvoeren, rec.nlSchrijven);
      rec.nederlandsResultaat = eindcijfer !== null ? eindcijfer.toFixed(1) : null;
    }
    const saved = await saveKlassen();
    if (saved === false) return;
    showSaved();
    onSaved?.();
  }

  const rekenStatus = normalizeRekenScore(student.rekenResultaat ?? null);
  const nederlandsStatus = normalizeRekenScore(student.nederlandsResultaat ?? null);

  function normBadge(status: ReturnType<typeof normalizeRekenScore>, rawValue?: string | null) {
    if (status === null) return null;
    const kleur = status === 'onvoldoende' ? 'var(--status-rood-text)' : 'var(--status-groen-text)';
    const raw = String(rawValue ?? '').trim().toUpperCase();
    let label: string;
    if (raw === '3F') label = '3F — goed';
    else if (raw === '2F') label = '2F — voldoende (norm)';
    else if (raw === '1F') label = 'Onder norm';
    else label = status === 'onvoldoende' ? 'Onvoldoende' : 'Voldoende';
    return <span style={{ fontSize: '0.75rem', fontWeight: 600, color: kleur, marginLeft: '0.5rem' }}>{label}</span>;
  }

  const nederlandsEindcijfer = berekenNederlandsEindcijfer(
    student.nlLezen, student.nlSpreken, student.nlGesprekvoeren, student.nlSchrijven
  );

  const inputStyle: React.CSSProperties = {
    padding: '0.4375rem 0.75rem',
    border: '1.5px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    boxShadow: 'var(--shadow-xs)',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  const subLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    letterSpacing: '0.02em',
    marginBottom: '0.3rem',
    display: 'block',
  };

  return (
    <div className="detail-section">
      <p className="detail-section-title">Rekenen &amp; Nederlands</p>
      <div className="aanvullend-grid">

        {/* 999.9: Rekenen — numeric grade input */}
        <div className="aanvullend-veld">
          <label htmlFor="rnl-rekenen">
            Rekenen
            {normBadge(rekenStatus, student.rekenResultaat)}
          </label>
          <input
            type="number"
            id="rnl-rekenen"
            min="1"
            max="10"
            step="0.1"
            placeholder="bijv. 6.5"
            value={student.rekenResultaat ?? ''}
            style={inputStyle}
            onChange={e => handleChange('rekenResultaat', e.target.value)}
          />
        </div>

        {/* 999.10: Nederlands — 4 onderdelen + auto-computed eindcijfer */}
        <div className="aanvullend-veld" style={{ gridColumn: '1 / -1' }}>
          <label>
            Nederlands
            {normBadge(nederlandsStatus, student.nederlandsResultaat)}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
            <div>
              <span style={subLabelStyle}>Lezen / Luisteren</span>
              <input
                type="number"
                id="rnl-nl-lezen"
                min="0"
                max="10"
                step="0.1"
                placeholder="bijv. 3.5"
                value={student.nlLezen ?? ''}
                style={inputStyle}
                onChange={e => handleNlOnderdeel('nlLezen', e.target.value)}
              />
            </div>
            <div>
              <span style={subLabelStyle}>Spreken</span>
              <input
                type="number"
                id="rnl-nl-spreken"
                min="0"
                max="10"
                step="0.1"
                placeholder="bijv. 3.5"
                value={student.nlSpreken ?? ''}
                style={inputStyle}
                onChange={e => handleNlOnderdeel('nlSpreken', e.target.value)}
              />
            </div>
            <div>
              <span style={subLabelStyle}>Gesprekvoeren</span>
              <input
                type="number"
                id="rnl-nl-gesprekvoeren"
                min="0"
                max="10"
                step="0.1"
                placeholder="bijv. 3.5"
                value={student.nlGesprekvoeren ?? ''}
                style={inputStyle}
                onChange={e => handleNlOnderdeel('nlGesprekvoeren', e.target.value)}
              />
            </div>
            <div>
              <span style={subLabelStyle}>Schrijven</span>
              <input
                type="number"
                id="rnl-nl-schrijven"
                min="0"
                max="10"
                step="0.1"
                placeholder="bijv. 3.5"
                value={student.nlSchrijven ?? ''}
                style={inputStyle}
                onChange={e => handleNlOnderdeel('nlSchrijven', e.target.value)}
              />
            </div>
          </div>
          {nederlandsEindcijfer !== null && (
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>
              <span style={{ fontWeight: 600 }}>Eindcijfer: {nederlandsEindcijfer.toFixed(1)}</span>
              {normBadge(nederlandsStatus, student.nederlandsResultaat)}
            </p>
          )}
        </div>

      </div>
      <p
        className="aanvullend-hint"
        style={{ color: hint === 'saved' ? 'var(--status-groen-text)' : undefined }}
      >
        {hint === 'saved' ? 'Opgeslagen' : (
          rekenStatus === null && nederlandsStatus === null
            ? <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Norm: Rekenen ≥5.5 · Nederlands eindcijfer ≥5.5 (som / 2)</span>
            : null
        )}
      </p>
    </div>
  );
}
