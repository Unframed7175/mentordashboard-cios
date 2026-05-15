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
}

export default function LeerlingTegel({ student, status, onClick }: LeerlingTegelProps) {
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // prevent page scroll on Space
      onClick();
    }
  }

  return (
    <div
      className="klas-tile"
      style={{ borderLeft: `4px solid ${RAG_BORDER[status.kleur] || RAG_BORDER.grijs}` }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      <span className="klas-tile-naam">{student.naam}</span>
      <span className={`status-badge status-${status.kleur}`}>{status.label}</span>
      {miniBar}
    </div>
  );
}
