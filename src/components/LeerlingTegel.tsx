// ---------------------------------------------------------------------------
// src/components/LeerlingTegel.tsx — pure presentational tile component
// Renders student naam, status badge with RAG border, and mini verzuim bar.
// Keyboard accessible: tabIndex=0 + Enter key handler.
// ---------------------------------------------------------------------------

import React from 'react';
import { RAG_BORDER, StatusResult } from '../utils/status';

interface LeerlingTegelProps {
  student: any;
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
  let scoreTelling: React.ReactNode = null;
  if (status.kleur !== 'grijs') {
    const totaalDeelgebieden =
      status.prognose.totaalVoldoendeOfHoger + status.prognose.totaalOnvoldoende;
    const v = status.prognose.totaalVoldoendeOfHoger;
    const o = status.prognose.totaalOnvoldoende;
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // prevent page scroll on Space
      onClick();
    }
  }

  const ragVar = `var(--rag-${status.kleur}, var(--rag-grijs))`;

  return (
    <div
      className="klas-tile"
      style={{ '--tile-accent': ragVar } as React.CSSProperties}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      <span className="klas-tile-naam">{student.naam}</span>
      <span className={`status-badge status-${status.kleur}`}>{status.label}</span>
      {scoreTelling}
      {miniBar}
    </div>
  );
}
