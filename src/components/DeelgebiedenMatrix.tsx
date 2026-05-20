import React from 'react';
import { aggregateDeelgebiedScores } from '../../utils/aggregation';
import { getAllRecordsForStudent } from '../../utils/klassen';
import { DEELGEBIEDEN, SCORE_LEVELS, normalizeScore } from '../../utils/schema';
import { getDeelgebiedenConfigSync, type DeelgebiedConfig } from '../../utils/deelgebieden';
import { getLeerlijnenMappingSync } from '../../utils/leerlijnen';

interface DeelgebiedenMatrixProps {
  student: any;
  leerlingId: string;
}

const GROEPEN = [
  { key: 'lesgeven' as const,    label: 'Lesgeven',      className: 'dm-header-lesgeven'    },
  { key: 'organiseren' as const, label: 'Organiseren',   className: 'dm-header-organiseren' },
  { key: 'prof_handelen' as const, label: 'Prof. handelen', className: 'dm-header-profhandelen' },
];

const SCORE_CHIP_MAP: Record<string, { css: string; kort: string }> = {
  onvoldoende: { css: 'score-o', kort: 'O' },
  voldoende:   { css: 'score-v', kort: 'V' },
  goed:        { css: 'score-g', kort: 'G' },
  excellent:   { css: 'score-e', kort: 'E' },
};

function DmChip({ score }: { score: string | null | undefined }) {
  if (!score) {
    return <span className="dm-chip score-none">—</span>;
  }
  const c = SCORE_CHIP_MAP[score];
  return c
    ? <span className={`dm-chip ${c.css}`} style={{ display: 'inline-block', width: '1.5rem', lineHeight: '1.6rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>{c.kort}</span>
    : <span className="dm-chip score-none">?</span>;
}

function scoreRank(score: string | null | undefined): number {
  if (!score) return -1;
  return SCORE_LEVELS.indexOf(score as any);
}

function GrowthBadge({ score1, score2 }: { score1: string | null | undefined; score2: string | null | undefined }) {
  // WR-05: unified guard — no badge if either score is unknown (avoids asymmetric null checks)
  const r1 = scoreRank(score1);
  const r2 = scoreRank(score2);
  if (r1 < 0 || r2 < 0) return null;
  if (r2 > r1) return <span className="growth-up" aria-label="gestegen" style={{ color: '#16a34a' }}>↑</span>;
  if (r2 < r1) return <span className="growth-down" aria-label="gedaald" style={{ color: '#dc2626' }}>↓</span>;
  return <span className="growth-same" aria-label="gelijk" style={{ color: '#9ca3af' }}>=</span>;
}

export default function DeelgebiedenMatrix({ student, leerlingId }: DeelgebiedenMatrixProps) {
  const allRecords = getAllRecordsForStudent(leerlingId); // oldest-first
  const hasTwoPeriods = allRecords.length >= 2
    && allRecords[0].periode !== allRecords[allRecords.length - 1].periode;

  // Bug B fix: collect datapunten from ALL periods (oldest-first), not just the
  // most-recent record. Previously `student.datapunten` only contained the newest
  // period's rows, so ~half the rows were invisible when 2 PDFs were imported.
  const datapunten: any[] = allRecords.flatMap((r: any) => r.datapunten || []);

  // Active-deelgebied filter + runtime leerlijn-mapping group assignment (Phase 18 SET-03/SET-04)
  // Uses sync accessors — pre-warm in main.tsx guarantees populated caches at render time.
  const dgConfig = getDeelgebiedenConfigSync();
  const mapping = getLeerlijnenMappingSync();
  const activeIds = new Set(dgConfig.filter((c: DeelgebiedConfig) => c.active).map((c: DeelgebiedConfig) => c.id));
  const labelById = new Map(dgConfig.map((c: DeelgebiedConfig) => [c.id, c.label])); // display labels only

  // Group deelgebieden per leerlijn — filter inactive and respect runtime leerlijn-mapping
  const groepDG: Record<string, typeof DEELGEBIEDEN> = {};
  for (const g of GROEPEN) {
    groepDG[g.key] = DEELGEBIEDEN.filter(dg => {
      if (!activeIds.has(dg.id)) return false;
      const dgLeerlijn = mapping[dg.id] || dg.group;
      return dgLeerlijn === g.key;
    });
  }

  const allDG = GROEPEN.flatMap(g => groepDG[g.key]);

  // Single-period: aggregate scores for modus footer
  const { aggregationDetail } = aggregateDeelgebiedScores(datapunten);

  // Two-period: oldest/newest records
  const oldest = hasTwoPeriods ? allRecords[0] : null;
  const newest = hasTwoPeriods ? allRecords[allRecords.length - 1] : null;
  const scores1: Record<string, string | null> = oldest ? (oldest.deelgebiedScores || {}) : {};
  const scores2: Record<string, string | null> = newest ? (newest.deelgebiedScores || {}) : {};

  if (!datapunten || datapunten.length === 0) {
    return (
      <div className="detail-section">
        <p className="detail-section-title">Beoordelingen per datapunt × deelgebied</p>
        <div className="dg-matrix-wrap" style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
          <table className="dg-matrix" style={{ borderCollapse: 'collapse', fontSize: '0.77rem', width: '100%', minWidth: '1100px' }}>
            <tbody>
              <tr>
                <td colSpan={allDG.length + 1} style={{ color: '#9ca3af', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                  Geen datapunten gevonden
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-section">
      <p className="detail-section-title">Beoordelingen per datapunt × deelgebied</p>
      <div className="dg-matrix-wrap" style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
        <table className="dg-matrix" style={{ borderCollapse: 'collapse', fontSize: '0.77rem', width: '100%', minWidth: '1100px' }}>
          <thead>
            <tr>
              <th className="col-naam" rowSpan={2} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>
                Datapunt
              </th>
              {GROEPEN.map(g => (
                <th
                  key={g.key}
                  colSpan={groepDG[g.key].length}
                  className={g.className}
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr>
              {allDG.map(dg => (
                <th key={dg.id} style={{ padding: '0.3rem 0.4rem', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {labelById.get(dg.id) ?? dg.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datapunten.map((dp: any, i: number) => (
              <tr key={i}>
                <td className="cell-naam" style={{ padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}>
                  <span className="cell-dp">{dp.datapunt}</span>
                </td>
                {allDG.map(dg => (
                  <td key={dg.id} style={{ padding: '0.3rem 0.4rem', textAlign: 'center' }}>
                    <DmChip score={dp.scores ? (dp.scores[dg.label] || null) : null} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {hasTwoPeriods ? (
              <>
                <tr>
                  <td className="cell-naam" style={{ padding: '0.4rem 0.75rem', fontWeight: 700 }}>
                    <strong>{oldest?.periode || 'Periode 1'}</strong>
                  </td>
                  {allDG.map(dg => (
                    <td key={dg.id} style={{ padding: '0.3rem 0.4rem', textAlign: 'center' }}>
                      <DmChip score={scores1[dg.label] || null} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="cell-naam" style={{ padding: '0.4rem 0.75rem', fontWeight: 700 }}>
                    <strong>{newest?.periode || 'Periode 2'}</strong>
                  </td>
                  {allDG.map(dg => {
                    const s1 = scores1[dg.label] || null;
                    const s2 = scores2[dg.label] || null;
                    return (
                      <td key={dg.id} style={{ padding: '0.3rem 0.4rem', textAlign: 'center' }}>
                        <DmChip score={s2} />
                        <GrowthBadge score1={s1} score2={s2} />
                      </td>
                    );
                  })}
                </tr>
              </>
            ) : (
              <tr>
                <td className="cell-naam" style={{ padding: '0.4rem 0.75rem', fontWeight: 700 }}>
                  <strong>Eindoordeel</strong>
                </td>
                {allDG.map(dg => (
                  <td key={dg.id} className="vote-count-cell" style={{ padding: '0.3rem 0.4rem', textAlign: 'center' }}>
                    <DmChip score={aggregationDetail[dg.label] || null} />
                  </td>
                ))}
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
}
