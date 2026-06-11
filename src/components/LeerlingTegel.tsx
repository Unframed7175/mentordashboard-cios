// ---------------------------------------------------------------------------
// src/components/LeerlingTegel.tsx — pure presentational tile component
// Renders student naam, status badge with RAG border, and mini verzuim bar.
// Keyboard accessible: tabIndex=0 + Enter key handler.
// ---------------------------------------------------------------------------

import React from 'react';
import { RAG_BORDER, StatusResult } from '../utils/status';
import { getVerzuimDrempelsSync } from '../../utils/verzuimDrempels';

// Minimal student shape used by this component — covers all fields accessed below.
// Intentionally kept inline (no full-refactor) per IN-01 review guidance.
interface StudentProps {
  naam: string;
  leerlingId: string;
  verzuim?: {
    aanwezigheid: number;
    geoorloofd: number;
    ongeoorloofd: number;
  };
  rekenResultaat?: string | null;
  nederlandsResultaat?: string | null;
}

interface LeerlingTegelProps {
  student: StudentProps;
  status: StatusResult;
  onClick: () => void;
  trend?: 'op' | 'neer' | null;
}

export default function LeerlingTegel({ student, status, onClick, trend }: LeerlingTegelProps) {
  // Mini verzuim bar calculation (per app.js lines 1256-1269)
  let miniBar: React.ReactNode = null;
  if (student.verzuim) {
    const v = student.verzuim;
    const totaal = (v.aanwezigheid || 0) + (v.geoorloofd || 0) + (v.ongeoorloofd || 0);
    if (totaal > 0) {
      const pA = Math.round(((v.aanwezigheid || 0) / totaal) * 100);
      const pG = Math.round(((v.geoorloofd || 0) / totaal) * 100);
      const pO = 100 - pA - pG;
      miniBar = (
        <>
          <div className="mini-verzuim-bar">
            <div className="mvb-seg mvb-aanwezig" style={{ width: `${pA}%` }} />
            <div className="mvb-seg mvb-geoorloofd" style={{ width: `${pG}%` }} />
            <div className="mvb-seg mvb-ongeoorloofd" style={{ width: `${pO}%` }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            {pA}% aanwezig
          </div>
        </>
      );
    }
  }

  // Score-telling calculation (Phase 26 — TEGEL-01/TEGEL-02)
  // Guard: prognose must be non-null and have at least one scored deelgebied (CR-01/WR-01)
  let scoreTelling: React.ReactNode = null;
  if (status.kleur !== 'grijs' && status.prognose != null) {
    const v = status.prognose.totaalVoldoendeOfHoger ?? 0;
    const o = status.prognose.totaalOnvoldoende ?? 0;
    const totaalDeelgebieden = v + o;
    if (totaalDeelgebieden > 0) {
      const ariaLabel =
        trend === 'op'
          ? `Trend omhoog: ${v} van ${totaalDeelgebieden} deelgebieden voldoende of hoger, ${o} onvoldoende`
          : trend === 'neer'
          ? `Trend omlaag: ${v} van ${totaalDeelgebieden} deelgebieden voldoende of hoger, ${o} onvoldoende`
          : `${v} van ${totaalDeelgebieden} deelgebieden voldoende of hoger, ${o} onvoldoende`;
      scoreTelling = (
        <div className="score-telling" aria-label={ariaLabel}>
          {trend === 'op' && (
            <span className="trend-pijl trend-op" aria-hidden="true" />
          )}
          {trend === 'neer' && (
            <span className="trend-pijl trend-neer" aria-hidden="true" />
          )}
          <span className="score-telling-tekst">
            {v}/{totaalDeelgebieden} {'≥'}V{' · '}{o} O
          </span>
        </div>
      );
    }
  }

  // R&N statusregel (Phase 32 — TEGEL-03/TEGEL-04)
  const rPart = student.rekenResultaat ? `R ${student.rekenResultaat}` : null;
  const nPart = student.nederlandsResultaat ? `N ${student.nederlandsResultaat}` : null;
  const rnParts = [rPart, nPart].filter(Boolean);
  const rnRow: React.ReactNode = rnParts.length > 0
    ? <div className="score-telling">{rnParts.join(' · ')}</div>
    : null;

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // prevent page scroll on Space
      onClick();
    }
  }

  const ragVar = `var(--rag-${status.kleur}, var(--rag-grijs))`;

  const verzuimDrempels = getVerzuimDrempelsSync();
  const hasVerzuimAlert = !!(
    student.verzuim &&
    (student.verzuim.ongeoorloofd > verzuimDrempels.ongeoorloofd ||
     student.verzuim.geoorloofd   > verzuimDrempels.geoorloofd)
  );

  return (
    <div
      className="klas-tile"
      style={{ '--tile-accent': ragVar } as React.CSSProperties}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      {hasVerzuimAlert && (
        <span className="klas-tile-verzuim-alert" role="img" aria-label="Verzuim boven drempel" title="Verzuim boven drempel">
          !
        </span>
      )}
      <span className="klas-tile-naam">{student.naam}</span>
      <span className={`status-badge status-${status.kleur}`}>{status.label}</span>
      {scoreTelling}
      {rnRow}
      {miniBar}
    </div>
  );
}
