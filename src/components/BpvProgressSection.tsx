// src/components/BpvProgressSection.tsx — Per-student BPV progress section (Phase 18, SET-06)
// Rendered in DetailWeergave between VerzuimSection and VakkenSection (D-12).
// Shows empty state when no BPV data is imported; shows progress bar + stats when data exists.

import { useEffect, useState } from 'react';
import {
  getBpvConfig,
  getBpvData,
  berekenBpvPct,
  type BpvConfig,
  type BpvStudentRecord,
  type BpvPlaatsing,
} from '../../utils/bpv';

interface BpvProgressSectionProps {
  leerlingId: string;
}

export default function BpvProgressSection({ leerlingId }: BpvProgressSectionProps) {
  const [bpvConfig, setBpvConfig] = useState<BpvConfig | null>(null);
  const [record, setRecord] = useState<BpvStudentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([getBpvConfig(), getBpvData()])
      .then(([cfg, data]) => {
        setBpvConfig(cfg);
        setRecord(data[leerlingId] ?? null);
      })
      .catch(err => console.warn('[BpvProgressSection] load failed:', err))
      .finally(() => setLoading(false));
  }, [leerlingId]);

  if (loading) {
    return (
      <div className="detail-section">
        <p className="detail-section-title">BPV-uren</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>BPV-data laden…</p>
      </div>
    );
  }

  if (bpvConfig === null || record === null) {
    return (
      <div className="detail-section">
        <p className="detail-section-title">BPV-uren</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Geen stage-data — importeer de BPV Excel via het importscherm.
        </p>
      </div>
    );
  }

  /* Populated state — overall bar + per-placement breakdown */
  const gerealiseerd = record.gerealiseerdeUren;
  const verwacht = bpvConfig.verwachteUren;
  const pct = berekenBpvPct(gerealiseerd, verwacht);
  const verschil = verwacht - gerealiseerd;
  const verschilPrefix = verschil >= 0 ? '+' : '−';
  const overshoot = gerealiseerd >= verwacht;
  const plaatsen: BpvPlaatsing[] = record.plaatsen ?? [];

  return (
    <div className="detail-section">
      <p className="detail-section-title">BPV-uren</p>
      <div className="bpv-progress-wrap">
        {/* Overall progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="bpv-bar-track">
            <div
              className="bpv-bar-fill"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: overshoot ? 'var(--rag-groen)' : undefined,
              }}
            />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {pct}%
          </span>
        </div>

        {/* Overall stats row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.07em' }}>
              Goedgekeurd
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {gerealiseerd}u
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.07em' }}>
              Verwacht
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {verwacht}u
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.07em' }}>
              Resterend
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {verschilPrefix}{Math.abs(verschil)}u
            </div>
          </div>
        </div>

        {/* Per-placement breakdown */}
        {plaatsen.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                {(['Locatie', 'Ingeleverd', 'Goedgekeurd', 'In behandeling'] as const).map(h => (
                  <th key={h} style={{
                    textAlign: h === 'Locatie' ? 'left' : 'right',
                    fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                    color: 'var(--text-muted)', letterSpacing: '0.07em',
                    paddingBottom: 4, borderBottom: '1px solid var(--border-color)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plaatsen.map((p, i) => {
                const inBehandeling = Math.max(0, p.ingeleverdUren - p.goedgekeurdeUren);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '5px 0', color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.locatie}
                    </td>
                    <td style={{ padding: '5px 0 5px 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {p.ingeleverdUren}u
                    </td>
                    <td style={{ padding: '5px 0 5px 8px', textAlign: 'right', color: p.goedgekeurdeUren > 0 ? 'var(--rag-groen)' : 'var(--text-secondary)', fontWeight: p.goedgekeurdeUren > 0 ? 700 : 400 }}>
                      {p.goedgekeurdeUren}u
                    </td>
                    <td style={{ padding: '5px 0 5px 8px', textAlign: 'right', color: inBehandeling > 0 ? 'var(--rag-oranje)' : 'var(--text-muted)' }}>
                      {inBehandeling}u
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
