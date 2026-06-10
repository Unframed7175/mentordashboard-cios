import React from 'react';
import { StatusResult, detectTraject } from '../utils/status';
import { getNormenSync } from '../../utils/normen';
import { normalizeRekenScore } from '../../utils/schema';
import { aggregateKdStatus } from '../../utils/keuzedelen';
import { getVerzuimDrempelsSync } from '../../utils/verzuimDrempels';

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

// Maps prognose label to readable uitkomst text shown in the badge
const UITKOMST_LABEL: Record<string, string> = {
  sbl:          'SBL',
  sbc:          'SBC',
  naar_bj2:     'Naar BJ2',
  versneld_sbc: 'Versneld SBC',
  neutraal:     'Twijfelgeval',
  negatief:     'Risico',
};

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

  // keuzedelen array takes precedence; fall back to legacy kdStatus for existing data
  const keuzedelen = Array.isArray(student.keuzedelen) ? student.keuzedelen : [];
  const kdStatus = keuzedelen.length > 0 ? aggregateKdStatus(keuzedelen) : (student.kdStatus ?? null);
  // BJ2 doorstroom: behaald of haalbaar volstaat
  const kdNodigBJ2 = kdStatus === 'behaald' || kdStatus === 'haalbaar' ? 0 : kdStatus === 'niet_behaald' ? 3 : 1;
  // Versneld SBC / BJ2 SBC: alleen behaald volstaat
  const kdNodigSBC = kdStatus === 'behaald' ? 0 : kdStatus === 'niet_behaald' ? 3 : 1;

  // T04: uitkomst badge label
  const uitkomstLabel = UITKOMST_LABEL[p.label] ?? p.label;

  // T05: verzuim signaal — not a formal doorstroom criterion, shown as attention block
  const verzuimDrempels = getVerzuimDrempelsSync();
  const vz = student.verzuim;
  const ongeoorloofdOver = !!(vz && vz.ongeoorloofd > verzuimDrempels.ongeoorloofd);
  const geoorloofdOver   = !!(vz && vz.geoorloofd   > verzuimDrempels.geoorloofd);

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

  // T05: verzuim signaalblok — shown after all doorstroom blocks
  const verzuimBlok = vz ? (
    <PrognoseBlock
      name="Verzuim — signaal"
      overallNodig={ongeoorloofdOver || geoorloofdOver ? 1 : 0}
      isEmpty={false}
    >
      <CriterionRow
        label={`Ongeoorloofd ≤${verzuimDrempels.ongeoorloofd} min`}
        scoreDisplay={`${vz.ongeoorloofd} min`}
        nodig={ongeoorloofdOver ? 1 : 0}
      />
      <CriterionRow
        label={`Geoorloofd ≤${verzuimDrempels.geoorloofd} min`}
        scoreDisplay={`${vz.geoorloofd} min`}
        nodig={geoorloofdOver ? 1 : 0}
      />
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
        Geen formeel doorstroomcriterium — aandachtssignaal.
      </p>
    </PrognoseBlock>
  ) : null;

  // T04: BJ2 blocks — extracted for reordering
  const sblBlock = (
    <PrognoseBlock
      name="SBL"
      overallNodig={Math.max(p.gaps.nodigSBL, rekenNodig, nederlandsNodig)}
      isEmpty={globalEmpty}
    >
      <CriterionRow
        label={`≥${n.sbl} deelgebieden ≥V`}
        scoreDisplay={`${p.totaalVoldoendeOfHoger} / ${n.sbl}`}
        nodig={p.gaps.nodigSBL}
      />
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

  const sbcBlock = (
    <PrognoseBlock
      name="SBC"
      overallNodig={Math.max(
        p.gaps.nodigSBC_deelgebieden,
        (p.gaps.nodigSBC_kern ?? []).length,
        rekenNodig,
        nederlandsNodig,
        kdNodigSBC
      )}
      isEmpty={globalEmpty}
    >
      <CriterionRow
        label={`≥${n.sbc} deelgebieden ≥V`}
        scoreDisplay={`${p.totaalVoldoendeOfHoger} / ${n.sbc}`}
        nodig={p.gaps.nodigSBC_deelgebieden}
      />
      {KERN_NAMES.map((kern) => (
        <CriterionRow
          key={kern}
          label={`${kern} ≥V`}
          scoreDisplay={(p.gaps.nodigSBC_kern ?? []).includes(kern) ? '< V' : '≥ V'}
          nodig={(p.gaps.nodigSBC_kern ?? []).includes(kern) ? 3 : 0}
        />
      ))}
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
      <CriterionRow
        label="KD afgerond"
        scoreDisplay={kdStatus === 'behaald' ? 'Behaald' : kdStatus === 'haalbaar' ? 'Haalbaar' : kdStatus === 'niet_behaald' ? 'Niet behaald' : '—'}
        nodig={kdNodigSBC}
      />
    </PrognoseBlock>
  );

  // T04: BJ2 block order — actual outcome block first, then other positive routes, negatief last
  // Exception: when outcome is negatief, show negatief block first
  let bj2Ordered: React.ReactNode;
  if (p.label === 'sbc') {
    bj2Ordered = <>{sbcBlock}{sblBlock}{negatiefBlock}</>;
  } else if (p.label === 'negatief') {
    bj2Ordered = <>{negatiefBlock}{sblBlock}{sbcBlock}</>;
  } else {
    // sbl or neutraal: SBL first (closest/most relevant positive outcome)
    bj2Ordered = <>{sblBlock}{sbcBlock}{negatiefBlock}</>;
  }

  // T04: BJ1 blocks — extracted for reordering
  const bj2DoorstroomBlock = (
    <PrognoseBlock
      name="BJ2 doorstroom"
      overallNodig={Math.max(p.gaps.nodigBJ2, rekenNodig, nederlandsNodig, kdNodigBJ2)}
      isEmpty={globalEmpty}
    >
      <CriterionRow
        label={`≥${n.bj1Positief} deelgebieden ≥V`}
        scoreDisplay={`${p.totaalVoldoendeOfHoger} / ${n.bj1Positief}`}
        nodig={p.gaps.nodigBJ2}
      />
      <CriterionRow
        label="Nederlands op weg naar 2F"
        scoreDisplay={student.nederlandsResultaat ?? '—'}
        nodig={nederlandsNodig}
      />
      <CriterionRow
        label="Rekenen ≥3 domeinen MBO3"
        scoreDisplay={student.rekenResultaat ?? '—'}
        nodig={rekenNodig}
      />
      <CriterionRow
        label="KD behaald of haalbaar (vóór 1 dec.)"
        scoreDisplay={kdStatus === 'behaald' ? 'Behaald' : kdStatus === 'haalbaar' ? 'Haalbaar' : kdStatus === 'niet_behaald' ? 'Niet behaald' : '—'}
        nodig={kdNodigBJ2}
      />
    </PrognoseBlock>
  );

  const versneldSBCBlock = (
    <PrognoseBlock
      name="Versneld SBC"
      overallNodig={Math.max(
        p.gaps.nodigVersneld_lesgeven ?? 0,
        p.gaps.nodigVersneld_organiseren ?? 0,
        p.gaps.nodigVersneld_profHandelen ?? 0,
        rekenNodig,
        nederlandsNodig,
        kdNodigSBC
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
      <CriterionRow
        label="Nederlands op weg naar 3F"
        scoreDisplay={student.nederlandsResultaat ?? '—'}
        nodig={nederlandsNodig}
      />
      <CriterionRow
        label="Rekenen ≥3 domeinen MBO4"
        scoreDisplay={student.rekenResultaat ?? '—'}
        nodig={rekenNodig}
      />
      <CriterionRow
        label="KD afgerond"
        scoreDisplay={kdStatus === 'behaald' ? 'Behaald' : kdStatus === 'haalbaar' ? 'Haalbaar' : kdStatus === 'niet_behaald' ? 'Niet behaald' : '—'}
        nodig={kdNodigSBC}
      />
    </PrognoseBlock>
  );

  // T04: BJ1 block order
  let bj1Ordered: React.ReactNode;
  if (p.label === 'versneld_sbc') {
    bj1Ordered = <>{versneldSBCBlock}{bj2DoorstroomBlock}{negatiefBlock}</>;
  } else if (p.label === 'negatief') {
    bj1Ordered = <>{negatiefBlock}{bj2DoorstroomBlock}{versneldSBCBlock}</>;
  } else {
    // naar_bj2 or neutraal: BJ2 doorstroom first (closest/most relevant positive outcome)
    bj1Ordered = <>{bj2DoorstroomBlock}{versneldSBCBlock}{negatiefBlock}</>;
  }

  return (
    <div className="detail-section">
      <p className="detail-section-title">Doorstroomprognose</p>
      {/* T04: uitkomst-badge — shows the actual computed outcome prominently at the top */}
      {!globalEmpty && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Prognose uitkomst:</span>
          <span className={`status-badge status-${status.kleur}`}>{uitkomstLabel}</span>
        </div>
      )}
      <div className="prognose-blocks-container">
        {traject === 'bj1' ? bj1Ordered : bj2Ordered}
        {/* T05: verzuim signaalblok — after all doorstroom blocks */}
        {verzuimBlok}
      </div>
    </div>
  );
}
