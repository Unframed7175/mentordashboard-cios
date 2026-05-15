import React from 'react';

interface VerzuimSectionProps {
  student: any;
}

/**
 * Format minutes as "Xh Ym" — mirrors app.js minNaarUren pattern.
 */
function minNaarUren(min: number): string {
  const m = Math.round(min || 0);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}m`;
  if (rest === 0) return `${h}h`;
  return `${h}h ${rest}m`;
}

export default function VerzuimSection({ student }: VerzuimSectionProps) {
  if (!student.verzuim) {
    return (
      <div className="detail-section">
        <p className="detail-section-title">Verzuim</p>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Geen verzuimdata — importeer de Excel verzuimexport om dit te zien.
        </p>
      </div>
    );
  }

  const v = student.verzuim;
  const totaal = (v.aanwezigheid || 0) + (v.geoorloofd || 0) + (v.ongeoorloofd || 0);

  function pct(deel: number): number {
    if (!totaal) return 0;
    return Math.round((deel / totaal) * 100);
  }

  const pA = pct(v.aanwezigheid || 0);
  const pG = pct(v.geoorloofd || 0);
  const pO = pct(v.ongeoorloofd || 0);

  const ongeoorloofdhoogVerzuim = (v.ongeoorloofd || 0) > 600;

  return (
    <div className="detail-section">
      <p className="detail-section-title">Verzuim</p>

      {/* Stacked verzuim bar — 44px height per UI-SPEC */}
      <div
        className="verzuim-bar"
        style={{ display: 'flex', height: '44px', borderRadius: '8px', overflow: 'hidden', width: '100%' }}
      >
        <div
          style={{
            width: `${pA}%`,
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          {pA >= 8 ? `${pA}%` : ''}
        </div>
        <div
          style={{
            width: `${pG}%`,
            background: '#f97316',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          {pG >= 8 ? `${pG}%` : ''}
        </div>
        <div
          style={{
            width: `${pO}%`,
            background: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          {pO >= 8 ? `${pO}%` : ''}
        </div>
      </div>

      {/* Legend */}
      <div
        className="verzuim-legend"
        style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.9rem' }}
      >
        {/* Aanwezig */}
        <div className="vl-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
          <span
            className="vl-dot vl-dot-aanwezig"
            style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}
          />
          <span className="vl-titel">Aanwezig</span>
          <span className="vl-tijd">{minNaarUren(v.aanwezigheid || 0)}</span>
          <span className="vl-pct" style={{ color: 'var(--text-muted)' }}>{pA}%</span>
        </div>

        {/* Geoorloofd */}
        <div className="vl-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
          <span
            className="vl-dot vl-dot-geoorloofd"
            style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316', display: 'inline-block' }}
          />
          <span className="vl-titel">Geoorloofd afwezig</span>
          <span className="vl-tijd">{minNaarUren(v.geoorloofd || 0)}</span>
          <span className="vl-pct" style={{ color: 'var(--text-muted)' }}>{pG}%</span>
        </div>

        {/* Ongeoorloofd */}
        <div className="vl-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
          <span
            className="vl-dot vl-dot-ongeoorloofd"
            style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}
          />
          <span className="vl-titel">Ongeoorloofd afwezig</span>
          <span
            className="vl-tijd"
            style={ongeoorloofdhoogVerzuim ? { color: '#991b1b', fontWeight: 700 } : undefined}
          >
            {minNaarUren(v.ongeoorloofd || 0)}
          </span>
          <span className="vl-pct" style={{ color: 'var(--text-muted)' }}>{pO}%</span>
        </div>
      </div>

      {/* Laatste melding */}
      {v.laatsteMelding && (
        <p className="verzuim-melding" style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
          Laatste verzuimmelding: <strong>{v.laatsteMelding}</strong>
        </p>
      )}
    </div>
  );
}
