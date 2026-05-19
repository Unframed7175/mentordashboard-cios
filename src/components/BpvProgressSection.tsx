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
} from '../../utils/bpv';

interface BpvProgressSectionProps {
  leerlingId: string;
}

export default function BpvProgressSection({ leerlingId }: BpvProgressSectionProps) {
  const [bpvConfig, setBpvConfig] = useState<BpvConfig | null>(null);
  const [record, setRecord] = useState<BpvStudentRecord | null>(null);

  useEffect(() => {
    Promise.all([getBpvConfig(), getBpvData()])
      .then(([cfg, data]) => {
        setBpvConfig(cfg);
        setRecord(data[leerlingId] ?? null);
      })
      .catch(err => console.warn('[BpvProgressSection] load failed:', err));
  }, [leerlingId]);

  return (
    <div className="detail-section">
      <p className="detail-section-title">BPV-uren</p>

      {bpvConfig === null || record === null ? (
        /* Empty state — no BPV data imported yet */
        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          Nog geen stage-data — importeer de stage Excel via het importscherm.
        </p>
      ) : (
        /* Populated state — show progress bar + stats */
        (() => {
          const gerealiseerd = record.gerealiseerdeUren;
          const verwacht = bpvConfig.verwachteUren;
          const pct = berekenBpvPct(gerealiseerd, verwacht);
          const verschil = verwacht - gerealiseerd;
          const verschilPrefix = verschil >= 0 ? '+' : '−';
          const overshoot = gerealiseerd >= verwacht;

          return (
            <div className="bpv-progress-wrap">
              {/* Progress bar row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="bpv-bar-track">
                  <div
                    className="bpv-bar-fill"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      background: overshoot ? '#22C55E' : undefined,
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {pct}%
                </span>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.07em' }}>
                    Gerealiseerd
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
                    Verschil
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {verschilPrefix}{Math.abs(verschil)}u
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
