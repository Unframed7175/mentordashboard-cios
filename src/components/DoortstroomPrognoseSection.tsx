import React from 'react';
import { StatusResult, detectTraject } from '../utils/status';
import { getNormenSync } from '../../utils/normen';
import { normalizeRekenScore } from '../../utils/schema';

interface DoortstroomPrognoseSectionProps {
  student: any;
  status: StatusResult;
}

const LEERLIJN_LABEL: Record<string, string> = {
  lesgeven: 'Lesgeven',
  organiseren: 'Organiseren',
  prof_handelen: 'Professioneel handelen',
};

const KERN_NAMES = ['V&A', 'P&O', 'C&B', '1E&B'] as const;

function criterionStatus(nodig: number): 'groen' | 'oranje' | 'rood' {
  if (nodig === 0) return 'groen';
  if (nodig <= 2) return 'oranje';
  return 'rood';
}

function CriterionRow({ label, scoreDisplay, nodig }: { label: string; scoreDisplay: string; nodig: number }) {
  const state = criterionStatus(nodig);
  const chipLabel = state === 'groen' ? '✓' : state === 'oranje' ? '△' : '✗';
  return (
    <div className="prognose-criterion-row">
      <span className="prognose-criterion-label">{label}</span>
      <span className="prognose-criterion-score">{scoreDisplay}</span>
      <span className={`status-${state}`}>{chipLabel}</span>
    </div>
  );
}

function PrognoseBlock({
  name,
  overallNodig,
  children,
  isEmpty,
}: {
  name: string;
  overallNodig: number;
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  const state = criterionStatus(overallNodig);
  const accentColor =
    state === 'groen'
      ? 'var(--rag-groen)'
      : state === 'oranje'
      ? 'var(--rag-oranje)'
      : 'var(--rag-rood)';

  return (
    <div className="prognose-block" style={{ borderLeft: `3px solid ${accentColor}` }}>
      <div className="prognose-block-header">
        <span className="prognose-block-name">{name}</span>
        {!isEmpty && <span className={`status-${state}`}>{state === 'groen' ? '✓' : state === 'oranje' ? '△' : '✗'}</span>}
      </div>
      {isEmpty ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Nog geen scores beschikbaar</p>
      ) : (
        children
      )}
    </div>
  );
}

export default function DoortstroomPrognoseSection({ student, status }: DoortstroomPrognoseSectionProps) {
  // Use pre-computed prognose from status — do NOT call berekenPrognose again
  const p = status.prognose;
  const n = getNormenSync();
  const traject = detectTraject(student);

  const globalEmpty = p.totaalVoldoendeOfHoger === 0 && p.totaalOnvoldoende === 0;

  // Build per-leerlijn lookup map for score access
  const llMap: Record<string, any> = Object.fromEntries(
    (p.leerlijnen ?? []).map((l: any) => [l.leerlijn, l])
  );

  // Versneld SBC threshold field names (normen.ts: versneldLesgeven / versneldOrganiseren / versneldProfHandelen)
  const bj1VersneldLesgeven = n.versneldLesgeven;
  const bj1VersneldOrganiseren = n.versneldOrganiseren;
  const bj1VersneldProfHandelen = n.versneldProfHandelen;

  // Rekenen & Nederlands — read directly from student record (not from prognose)
  const rekenStatus = normalizeRekenScore(student.rekenResultaat ?? null);
  const nederlandsStatus = normalizeRekenScore(student.nederlandsResultaat ?? null);

  function rnlNodig(score: ReturnType<typeof normalizeRekenScore>): number {
    if (score === null) return 1;          // not entered → oranje
    if (score === 'onvoldoende') return 3; // rood
    return 0;                              // voldoende / goed → groen
  }

  const rekenNodig = rnlNodig(rekenStatus);
  const nederlandsNodig = rnlNodig(nederlandsStatus);

  const rnlBlock = (
    <PrognoseBlock
      name="Rekenen & Nederlands"
      overallNodig={Math.max(rekenNodig, nederlandsNodig)}
      isEmpty={false}
    >
      <CriterionRow
        label="Rekenen ≥2F"
        scoreDisplay={student.rekenResultaat ?? '—'}
        nodig={rekenNodig}
      />
      <CriterionRow
        label="Nederlands ≥2F"
        scoreDisplay={student.nederlandsResultaat ?? '—'}
        nodig={nederlandsNodig}
      />
    </PrognoseBlock>
  );

  // Negatief per-leerlijn rows (shared between BJ1 and BJ2)
  const negatiefPerLeerlijnen = (['lesgeven', 'organiseren', 'prof_handelen'] as const).map((l) => {
    const ruimte = p.gaps.onvoldoendeRuimtePerLeerlijn?.[l] ?? 0;
    const nodig = Math.max(0, -ruimte);
    return (
      <CriterionRow
        key={l}
        label={`≤${n.negatiefPerLeerlijn} O ${LEERLIJN_LABEL[l].toLowerCase()}`}
        scoreDisplay={`${llMap[l]?.onvoldoende ?? 0} / ${n.negatiefPerLeerlijn}`}
        nodig={nodig}
      />
    );
  });

  // Negatief totaal: how many onvoldoende over the threshold (0 = groen, >0 = direct rood — no oranje zone)
  const negatiefTotaalNodig = Math.max(0, p.totaalOnvoldoende - n.negatiefTotaal);
  const negatiefOverallNodig = negatiefTotaalNodig > 0 ? 3 : 0;

  const negatiefBlock = (
    <PrognoseBlock name="Negatief" overallNodig={negatiefOverallNodig} isEmpty={globalEmpty}>
      <CriterionRow
        label={`≤${n.negatiefTotaal} O totaal`}
        scoreDisplay={`${p.totaalOnvoldoende} / ${n.negatiefTotaal}`}
        nodig={negatiefTotaalNodig}
      />
      {negatiefPerLeerlijnen}
    </PrognoseBlock>
  );

  return (
    <div className="detail-section">
      <p className="detail-section-title">Doorstroomprognose</p>
      <div className="prognose-blocks-container">
        {traject === 'bj1' ? (
          <>
            <PrognoseBlock name="BJ2 doorstroom" overallNodig={p.gaps.nodigBJ2} isEmpty={globalEmpty}>
              <CriterionRow
                label={`≥${n.bj1Positief} deelgebieden ≥V`}
                scoreDisplay={`${p.totaalVoldoendeOfHoger} / ${n.bj1Positief}`}
                nodig={p.gaps.nodigBJ2}
              />
            </PrognoseBlock>
            <PrognoseBlock
              name="Versneld SBC"
              overallNodig={Math.max(
                p.gaps.nodigVersneld_lesgeven ?? 0,
                p.gaps.nodigVersneld_organiseren ?? 0,
                p.gaps.nodigVersneld_profHandelen ?? 0
              )}
              isEmpty={globalEmpty}
            >
              <CriterionRow
                label={`≥${bj1VersneldLesgeven} ≥G lesgeven`}
                scoreDisplay={`${llMap['lesgeven']?.goedOfHoger ?? 0} / ${bj1VersneldLesgeven}`}
                nodig={p.gaps.nodigVersneld_lesgeven ?? 0}
              />
              <CriterionRow
                label={`≥${bj1VersneldOrganiseren} ≥G organiseren`}
                scoreDisplay={`${llMap['organiseren']?.goedOfHoger ?? 0} / ${bj1VersneldOrganiseren}`}
                nodig={p.gaps.nodigVersneld_organiseren ?? 0}
              />
              <CriterionRow
                label={`≥${bj1VersneldProfHandelen} ≥G professioneel handelen`}
                scoreDisplay={`${llMap['prof_handelen']?.goedOfHoger ?? 0} / ${bj1VersneldProfHandelen}`}
                nodig={p.gaps.nodigVersneld_profHandelen ?? 0}
              />
            </PrognoseBlock>
            {negatiefBlock}
            {rnlBlock}
          </>
        ) : (
          <>
            <PrognoseBlock name="SBL" overallNodig={p.gaps.nodigSBL} isEmpty={globalEmpty}>
              <CriterionRow
                label={`≥${n.sbl} deelgebieden ≥V`}
                scoreDisplay={`${p.totaalVoldoendeOfHoger} / ${n.sbl}`}
                nodig={p.gaps.nodigSBL}
              />
            </PrognoseBlock>
            <PrognoseBlock
              name="SBC"
              overallNodig={Math.max(
                p.gaps.nodigSBC_deelgebieden,
                (p.gaps.nodigSBC_kern ?? []).length
              )}
              isEmpty={globalEmpty}
            >
              <CriterionRow
                label={`≥${n.sbc} deelgebieden ≥V`}
                scoreDisplay={`${p.totaalVoldoendeOfHoger} / ${n.sbc}`}
                nodig={p.gaps.nodigSBC_deelgebieden}
              />
              {KERN_NAMES.map((kd) => (
                <CriterionRow
                  key={kd}
                  label={`${kd} ≥V`}
                  scoreDisplay={(p.gaps.nodigSBC_kern ?? []).includes(kd) ? '< V' : '≥ V'}
                  nodig={(p.gaps.nodigSBC_kern ?? []).includes(kd) ? 3 : 0}
                />
              ))}
            </PrognoseBlock>
            {negatiefBlock}
            {rnlBlock}
          </>
        )}
      </div>
    </div>
  );
}
