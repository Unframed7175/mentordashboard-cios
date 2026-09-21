import React, { useState, useEffect } from 'react';
import { StatusResult, detectTraject } from '../utils/status';
import { normalizeRekenScore } from '../../utils/schema';
import { getVerzuimDrempelsSync } from '../../utils/verzuimDrempels';
import { getBpvConfig, getBpvData } from '../../utils/bpv';
import type { Vestiging } from '../../utils/klassen';
import { normalizeRoosendaalTraject } from '../../utils/trajectNormalisatie';

interface DoortstroomPrognoseSectionProps {
  student: any;
  status: StatusResult;
  vestiging: Vestiging | null;
}

// M42 T12 — component-local mirrors of the engine's actual runtime gaps shapes
// (utils/prognosis.ts's exported Bj1Uitkomst/Bj2Uitkomst/Bj2RoosendaalSblKeuzeUitkomst
// interfaces type `gaps` as `any` — these give us real compile-time checking for
// this component's own field access without touching the (read-only) engine file).
type Niveau = 'goed' | 'voldoende' | 'onvoldoende' | null;

interface Bj1Gaps {
  aantalOnvoldoendeDeelgebieden: number;
  onvoldoendeDeelgebiedenRuimte: number;
  aantalOnbeoordeeldFase2: number;
  onbeoordeeldRuimte: number;
  nodigNaarBj2Deelgebieden: number;
  nodigNaarBj2ProfHoudingBvb: number;
  nodigNaarBj2RekenDomeinen: number;
  nodigVersneldSbc_lesgevenOrganiseren: number;
  nodigVersneldSbc_profHandelen: number;
  nodigVersneldSbc_profHoudingBvb: number;
  nodigVersneldSbc_rekenDomeinen: number;
  wvoTraject: boolean | null;
  nederlandsNiveau: Niveau;
  rekenNiveau: Niveau;
  levelsAfgerond: number;
}

interface Bj2Gaps {
  aantalVoldoendeOfHoger: number;
  nodigSBC_deelgebieden: number;
  nodigSBL_deelgebieden: number;
  nodigSBC_rekenDomeinen: number;
  nodigSBL_rekenDomeinen: number;
  nlSchrijvenNiveau: Niveau;
  nlGesprekvoerenNiveau: Niveau;
  nederlandsNiveau: Niveau;
  rekenNiveau: Niveau;
  kdStatus: string | null;
  wvoTraject: boolean | null;
}

interface Bj2RoosendaalSblKeuzeGaps {
  fase3DeelgebiedenVoldoende: number;
  nodigDeelgebiedenFase3: number;
  nodigRekenDomeinen: number;
  nederlandsNiveau: Niveau;
  rekenNiveau: Niveau;
  kdStatus: string | null;
}

// Maps prognose label to readable uitkomst text shown in the badge
const UITKOMST_LABEL: Record<string, string> = {
  sbl:           'SBL',
  sbc:           'SBC',
  naar_bj2:      'Naar BJ2',
  versneld_sbc:  'Versneld SBC',
  neutraal:      'Twijfelgeval',
  bespreekgeval: 'Bespreekgeval', // BJ2's own fallback label (D17/ADR-17d) — NOT the same as BJ1's 'neutraal'/Twijfelgeval
  negatief:      'Risico',
};

function criterionStatus(nodig: number): 'groen' | 'oranje' | 'rood' {
  if (nodig === 0) return 'groen';
  if (nodig <= 2) return 'oranje';
  return 'rood';
}

// 'behaald'/'haalbaar' → 0 (groen, both satisfy every KD gate in the new engine —
// see berekenBj2GeneriekPad/berekenBj2RoosendaalSblKeuze's shared kdVoldoet check),
// null/missing → 1 (oranje, not yet known), 'niet_behaald' → 3 (rood).
function kdNodig(status: string | null | undefined): number {
  if (status === 'behaald' || status === 'haalbaar') return 0;
  if (status === 'niet_behaald') return 3;
  return 1;
}

function behaaldDisplay(status: string | null | undefined): string {
  if (!status) return '—';
  if (status === 'behaald') return 'Behaald';
  if (status === 'niet_behaald') return 'Niet behaald';
  if (status === 'haalbaar') return 'Haalbaar';
  return status;
}

// BPV/POK-uren fallback display — unrelated to Lane C (student.pokUren is a manual
// legacy field), kept exactly as before.
function behaaldNodig(status: string | null | undefined): number {
  if (!status) return 1;
  if (status === 'niet_behaald') return 3;
  return 0;
}

// Generic "shortfall count" display for every `nodig*` gaps field — the new engine
// only exposes HOW MUCH is still missing (a delta), not the raw achieved-count/
// threshold pair the old getNormenSync()-based UI used to show alongside it.
function nodigDisplay(nodig: number): string {
  return nodig === 0 ? 'Voldaan' : `Nog ${nodig} nodig`;
}

// Tiered pass/fail for the niveau gaps fields (nederlandsNiveau/rekenNiveau/
// nlSchrijvenNiveau/nlGesprekvoerenNiveau) — the required tier differs per
// criterion exactly as berekenBj1Uitkomst/berekenBj2GeneriekPad/
// berekenBj2RoosendaalSblKeuze enforce it. Do NOT collapse to a uniform
// "any non-null value passes" rule.
function niveauNodig(niveau: Niveau, minTier: 'voldoende' | 'goed'): number {
  if (niveau === null) return 1;
  if (minTier === 'goed') {
    if (niveau === 'goed') return 0;
    if (niveau === 'voldoende') return 1; // close, but this criterion requires exactly 'goed'
    return 3;
  }
  // minTier === 'voldoende': 'voldoende' or 'goed' both pass
  if (niveau === 'voldoende' || niveau === 'goed') return 0;
  return 3;
}

// Raw student-record value for human-readable display — the pass/fail itself comes
// from the gaps-derived niveau via niveauNodig above, per task-T12-brief.md.
function niveauScoreDisplay(raw: unknown): string {
  return raw !== null && raw !== undefined && raw !== '' ? String(raw) : '—';
}

function wvoDisplay(wvo: boolean | null): string {
  if (wvo === true) return 'Ja';
  if (wvo === false) return 'Nee, vereist';
  return 'Nog niet ingevuld';
}

function wvoNodig(wvo: boolean | null): number {
  if (wvo === true) return 0;
  if (wvo === false) return 3;
  return 1;
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

export default function DoortstroomPrognoseSection({ student, status, vestiging }: DoortstroomPrognoseSectionProps) {
  // Use pre-computed prognose from status — do NOT call berekenPrognose again
  const p = status.prognose;
  const traject = detectTraject(student);

  // Nieuw schooljaar 2026/2027: deelgebieden-schema is bijgewerkt, maar de
  // doorstroomnormen (kern-vakken, drempelwaarden) zijn nog niet bekend. Toon dat
  // expliciet i.p.v. een cijfer te berekenen met de oude (niet meer kloppende) normen.
  if (p.label === 'normen_onbekend') {
    return (
      <div className="detail-section">
        <p className="detail-section-title">Doorstroomprognose</p>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Doorstroomnormen nog niet ingesteld voor het huidige deelgebieden-schema. Zodra de
          nieuwe CIOS-doorstroomcriteria bekend zijn, worden ze hier verwerkt.
        </p>
      </div>
    );
  }

  const globalEmpty = p.totaalVoldoendeOfHoger === 0 && p.totaalOnvoldoende === 0;

  // M42 T12 — disambiguating which of the 3 possible gaps shapes `p.gaps` actually
  // is. See task-T12-brief.md "The 3 possible result shapes you're rendering":
  // berekenPrognose's own routing decides this the SAME way (vestiging +
  // student.roosendaalTraject) — the label alone is NOT enough, since both
  // berekenBj2GeneriekPad and berekenBj2RoosendaalSblKeuze can produce
  // label: 'sbl' with completely different gaps field names.
  const isRoosendaalSblKeuze =
    vestiging === 'roosendaal' && normalizeRoosendaalTraject(student.roosendaalTraject) === 'sbl';

  // BJ1 → Versneld SBC: alle datapunten op tijd — UNRELATED to Lane C (reads
  // student.datapunten directly, no engine field changed here), kept as-is.
  const aantalNietIngeleverd = (student.datapunten || []).filter((dp: any) =>
    ((dp.status || '') as string).toLowerCase() === 'niet ingeleverd'
  ).length;
  const aantalTeLaat = (student.datapunten || []).filter((dp: any) =>
    ((dp.status || '') as string).toLowerCase().includes('te laat')
  ).length;
  const aantalNietOpTijd = aantalNietIngeleverd + aantalTeLaat;
  const datapuntenOpTijdNodig = aantalNietOpTijd > 0 ? 3 : 0;

  // BPV-uren — async; valt terug op handmatig student.pokUren. UNRELATED to Lane C,
  // kept as-is.
  const [bpvGerealiseerd, setBpvGerealiseerd] = useState<number | null>(null);
  const [bpvVerwacht, setBpvVerwacht] = useState<number>(200);
  useEffect(() => {
    Promise.all([getBpvConfig(), getBpvData()])
      .then(([cfg, data]) => {
        setBpvVerwacht(cfg?.verwachteUren ?? 200);
        const rec = data[student.leerlingId];
        if (rec) setBpvGerealiseerd(rec.gerealiseerdeUren);
      })
      .catch(() => {});
  }, [student.leerlingId]);

  const pokNodig = bpvGerealiseerd !== null
    ? (bpvGerealiseerd >= bpvVerwacht ? 0 : 3)
    : behaaldNodig(student.pokUren);
  const pokDisplay = bpvGerealiseerd !== null
    ? `${bpvGerealiseerd} / ${bpvVerwacht}u`
    : behaaldDisplay(student.pokUren);

  // Stage-uren (BJ1 Versneld SBC) — zelfde BPV-bron als POK-uren, unrelated to Lane C.
  const stageNodig = pokNodig;
  const stageDisplay = pokDisplay;

  const uitkomstLabel = UITKOMST_LABEL[p.label] ?? p.label;

  // T05: verzuim signaal — not a formal doorstroom criterion, shown as attention
  // block. Unrelated to Lane C (reads student.verzuim directly), kept as-is.
  const verzuimDrempels = getVerzuimDrempelsSync();
  const vz = student.verzuim;
  const ongeoorloofdOver = !!(vz && vz.ongeoorloofd > verzuimDrempels.ongeoorloofd);
  const geoorloofdOver   = !!(vz && vz.geoorloofd   > verzuimDrempels.geoorloofd);

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

  // BPV/POK-uren — its own standalone block for BJ2 (previously duplicated as a row
  // inside both the SBL and SBC blocks; the new engine's gaps shapes don't carry a
  // POK-uren field at all — this criterion is genuinely unrelated to Lane C, only
  // its RENDER LOCATION changes here to avoid duplicating it in every BJ2 block).
  const pokBlock = (
    <PrognoseBlock name="BPV / POK-uren" overallNodig={pokNodig} isEmpty={globalEmpty}>
      <CriterionRow label="POK-uren behaald" scoreDisplay={pokDisplay} nodig={pokNodig} />
    </PrognoseBlock>
  );

  let bj1Ordered: React.ReactNode = null;
  if (traject === 'bj1') {
    const gaps = p.gaps as Bj1Gaps;
    const toonRoosendaalLevels = vestiging === 'roosendaal';

    // ── Negatief (M42 T12: rebuilt against the new gaps fields) ────────────────
    // The new engine has exactly 2 negatief-triggers (berekenBj1Uitkomst) — no
    // more per-leerlijn onvoldoende breakdown. onvoldoendeDeelgebiedenRuimte is
    // Math.max(0, ...)-clamped so it cannot go negative — a value of 0 means
    // "at or past the edge" (ambiguous between "exactly at the last safe count"
    // and "already over"), so we lean on the overall p.label to disambiguate that
    // specific row's color when it's at 0. onbeoordeeldRuimte is NOT clamped and
    // goes negative once the trigger actually fires, so that one is unambiguous.
    const onvoldoendeDeelgebiedenNodig = gaps.onvoldoendeDeelgebiedenRuimte === 0
      ? (p.label === 'negatief' ? 3 : 1)
      : 0;
    const onbeoordeeldFase2Nodig = gaps.onbeoordeeldRuimte < 0
      ? 3
      : gaps.onbeoordeeldRuimte === 0 ? 1 : 0;

    const negatiefBlock = (
      <PrognoseBlock
        name="Negatief"
        overallNodig={Math.max(onvoldoendeDeelgebiedenNodig, onbeoordeeldFase2Nodig)}
        isEmpty={globalEmpty}
      >
        <CriterionRow
          label="Deelgebieden onvoldoende"
          scoreDisplay={`${gaps.aantalOnvoldoendeDeelgebieden} (ruimte: ${gaps.onvoldoendeDeelgebiedenRuimte})`}
          nodig={onvoldoendeDeelgebiedenNodig}
        />
        <CriterionRow
          label="Onbeoordeeld/niet ingeleverd (fase 2)"
          scoreDisplay={`${gaps.aantalOnbeoordeeldFase2} (ruimte: ${gaps.onbeoordeeldRuimte})`}
          nodig={onbeoordeeldFase2Nodig}
        />
      </PrognoseBlock>
    );

    // ── BJ2 doorstroom ("naar_bj2") ─────────────────────────────────────────────
    const naarBj2Block = (
      <PrognoseBlock
        name="BJ2 doorstroom"
        overallNodig={Math.max(
          gaps.nodigNaarBj2Deelgebieden,
          gaps.nodigNaarBj2ProfHoudingBvb,
          gaps.nodigNaarBj2RekenDomeinen,
          niveauNodig(gaps.nederlandsNiveau, 'voldoende'),
          niveauNodig(gaps.rekenNiveau, 'voldoende'),
        )}
        isEmpty={globalEmpty}
      >
        <CriterionRow
          label="Deelgebieden fase 2 ≥V"
          scoreDisplay={nodigDisplay(gaps.nodigNaarBj2Deelgebieden)}
          nodig={gaps.nodigNaarBj2Deelgebieden}
        />
        <CriterionRow
          label="Betekenisvol Bewegen (professionele houding)"
          scoreDisplay={nodigDisplay(gaps.nodigNaarBj2ProfHoudingBvb)}
          nodig={gaps.nodigNaarBj2ProfHoudingBvb}
        />
        <CriterionRow
          label="Nederlands ≥2F"
          scoreDisplay={niveauScoreDisplay(student.nederlandsResultaat)}
          nodig={niveauNodig(gaps.nederlandsNiveau, 'voldoende')}
        />
        <CriterionRow
          label="Rekenen ≥3 domeinen (MBO3)"
          scoreDisplay={niveauScoreDisplay(student.rekenResultaat)}
          nodig={niveauNodig(gaps.rekenNiveau, 'voldoende')}
        />
        {toonRoosendaalLevels && (
          // ADR-17e: for Goes/Dordrecht this criterion is trivially satisfied
          // (norm 0) — showing it there would be confusing noise, so it's gated
          // on vestiging. The engine exposes the achieved count (levelsAfgerond)
          // but no separate "nodig" delta for it, so this row is informational
          // (neutral/oranje) rather than a definitive pass/fail claim — see
          // task-T12-report.md for the full reasoning.
          <CriterionRow
            label="Roosendaal levels afgerond"
            scoreDisplay={`${gaps.levelsAfgerond}`}
            nodig={1}
          />
        )}
      </PrognoseBlock>
    );

    // ── Versneld SBC ─────────────────────────────────────────────────────────
    const versneldSBCBlock = (
      <PrognoseBlock
        name="Versneld SBC"
        overallNodig={Math.max(
          gaps.nodigVersneldSbc_lesgevenOrganiseren,
          gaps.nodigVersneldSbc_profHandelen,
          gaps.nodigVersneldSbc_profHoudingBvb,
          gaps.nodigVersneldSbc_rekenDomeinen,
          niveauNodig(gaps.nederlandsNiveau, 'goed'),
          niveauNodig(gaps.rekenNiveau, 'goed'),
          wvoNodig(gaps.wvoTraject),
          datapuntenOpTijdNodig,
          stageNodig,
        )}
        isEmpty={globalEmpty}
      >
        <CriterionRow
          label="Lesgeven & organiseren ≥G"
          scoreDisplay={nodigDisplay(gaps.nodigVersneldSbc_lesgevenOrganiseren)}
          nodig={gaps.nodigVersneldSbc_lesgevenOrganiseren}
        />
        <CriterionRow
          label="Professioneel handelen ≥G"
          scoreDisplay={nodigDisplay(gaps.nodigVersneldSbc_profHandelen)}
          nodig={gaps.nodigVersneldSbc_profHandelen}
        />
        <CriterionRow
          label="Betekenisvol Bewegen (professionele houding) ≥G"
          scoreDisplay={nodigDisplay(gaps.nodigVersneldSbc_profHoudingBvb)}
          nodig={gaps.nodigVersneldSbc_profHoudingBvb}
        />
        <CriterionRow
          label="Nederlands ≥3F"
          scoreDisplay={niveauScoreDisplay(student.nederlandsResultaat)}
          nodig={niveauNodig(gaps.nederlandsNiveau, 'goed')}
        />
        <CriterionRow
          label="Rekenen ≥3 domeinen (MBO4)"
          scoreDisplay={niveauScoreDisplay(student.rekenResultaat)}
          nodig={niveauNodig(gaps.rekenNiveau, 'goed')}
        />
        <CriterionRow
          label="WVO-traject"
          scoreDisplay={wvoDisplay(gaps.wvoTraject)}
          nodig={wvoNodig(gaps.wvoTraject)}
        />
        {toonRoosendaalLevels && (
          <CriterionRow
            label="Roosendaal levels afgerond"
            scoreDisplay={`${gaps.levelsAfgerond}`}
            nodig={1}
          />
        )}
        <CriterionRow
          label="Alle datapunten op tijd"
          scoreDisplay={aantalNietOpTijd === 0 ? 'Op tijd' : `${aantalNietOpTijd} niet op tijd`}
          nodig={datapuntenOpTijdNodig}
        />
        <CriterionRow
          label="Stage-uren behaald"
          scoreDisplay={stageDisplay}
          nodig={stageNodig}
        />
      </PrognoseBlock>
    );

    if (p.label === 'versneld_sbc') {
      bj1Ordered = <>{versneldSBCBlock}{naarBj2Block}{negatiefBlock}</>;
    } else if (p.label === 'negatief') {
      bj1Ordered = <>{negatiefBlock}{naarBj2Block}{versneldSBCBlock}</>;
    } else {
      // naar_bj2 or neutraal: BJ2 doorstroom first (closest/most relevant positive outcome)
      bj1Ordered = <>{naarBj2Block}{versneldSBCBlock}{negatiefBlock}</>;
    }
  }

  let bj2Ordered: React.ReactNode = null;
  if (traject === 'bj2') {
    if (isRoosendaalSblKeuze) {
      // ── Roosendaal SBL-keuze pad (berekenBj2RoosendaalSblKeuze) ───────────────
      // Smaller, Roosendaal-exclusive criteria set. Never produces label 'sbc' —
      // only 'sbl' | 'bespreekgeval' — so there is no SBC block to render here.
      const gaps = p.gaps as Bj2RoosendaalSblKeuzeGaps;
      const sblBlock = (
        <PrognoseBlock
          name="SBL"
          overallNodig={Math.max(
            gaps.nodigDeelgebiedenFase3,
            niveauNodig(gaps.nederlandsNiveau, 'voldoende'),
            gaps.nodigRekenDomeinen,
            niveauNodig(gaps.rekenNiveau, 'voldoende'),
            kdNodig(gaps.kdStatus),
          )}
          isEmpty={globalEmpty}
        >
          <CriterionRow
            label="Deelgebieden fase 3 ≥V"
            scoreDisplay={nodigDisplay(gaps.nodigDeelgebiedenFase3)}
            nodig={gaps.nodigDeelgebiedenFase3}
          />
          <CriterionRow
            label="Nederlands ≥2F"
            scoreDisplay={niveauScoreDisplay(student.nederlandsResultaat)}
            nodig={niveauNodig(gaps.nederlandsNiveau, 'voldoende')}
          />
          <CriterionRow
            label="Rekenen — domeinen"
            scoreDisplay={nodigDisplay(gaps.nodigRekenDomeinen)}
            nodig={gaps.nodigRekenDomeinen}
          />
          <CriterionRow
            label="Rekenen ≥2F"
            scoreDisplay={niveauScoreDisplay(student.rekenResultaat)}
            nodig={niveauNodig(gaps.rekenNiveau, 'voldoende')}
          />
          <CriterionRow
            label="KD behaald of voor 1 december haalbaar"
            scoreDisplay={behaaldDisplay(gaps.kdStatus)}
            nodig={kdNodig(gaps.kdStatus)}
          />
        </PrognoseBlock>
      );
      bj2Ordered = <>{sblBlock}{pokBlock}</>;
    } else {
      // ── Generic pad (berekenBj2GeneriekPad) — also used for Roosendaal
      // students who did NOT choose 'sbl' in the mid-year keuzeproces. ─────────
      const gaps = p.gaps as Bj2Gaps;
      const sblBlock = (
        <PrognoseBlock
          name="SBL"
          overallNodig={Math.max(
            gaps.nodigSBL_deelgebieden,
            niveauNodig(gaps.nederlandsNiveau, 'voldoende'),
            gaps.nodigSBL_rekenDomeinen,
            niveauNodig(gaps.rekenNiveau, 'voldoende'),
            kdNodig(gaps.kdStatus),
          )}
          isEmpty={globalEmpty}
        >
          <CriterionRow
            label="Deelgebieden ≥V"
            scoreDisplay={nodigDisplay(gaps.nodigSBL_deelgebieden)}
            nodig={gaps.nodigSBL_deelgebieden}
          />
          <CriterionRow
            label="Nederlands ≥2F"
            scoreDisplay={niveauScoreDisplay(student.nederlandsResultaat)}
            nodig={niveauNodig(gaps.nederlandsNiveau, 'voldoende')}
          />
          <CriterionRow
            label="Rekenen — domeinen"
            scoreDisplay={nodigDisplay(gaps.nodigSBL_rekenDomeinen)}
            nodig={gaps.nodigSBL_rekenDomeinen}
          />
          <CriterionRow
            label="Rekenen ≥2F"
            scoreDisplay={niveauScoreDisplay(student.rekenResultaat)}
            nodig={niveauNodig(gaps.rekenNiveau, 'voldoende')}
          />
          <CriterionRow
            label="KD behaald of voor 1 december haalbaar"
            scoreDisplay={behaaldDisplay(gaps.kdStatus)}
            nodig={kdNodig(gaps.kdStatus)}
          />
        </PrognoseBlock>
      );

      const sbcBlock = (
        <PrognoseBlock
          name="SBC"
          overallNodig={Math.max(
            gaps.nodigSBC_deelgebieden,
            niveauNodig(gaps.nlSchrijvenNiveau, 'voldoende'),
            niveauNodig(gaps.nlGesprekvoerenNiveau, 'goed'),
            gaps.nodigSBC_rekenDomeinen,
            niveauNodig(gaps.rekenNiveau, 'goed'),
            kdNodig(gaps.kdStatus),
            wvoNodig(gaps.wvoTraject),
          )}
          isEmpty={globalEmpty}
        >
          <CriterionRow
            label="Deelgebieden ≥V"
            scoreDisplay={nodigDisplay(gaps.nodigSBC_deelgebieden)}
            nodig={gaps.nodigSBC_deelgebieden}
          />
          <CriterionRow
            label="Nederlands schrijven ≥2F"
            scoreDisplay={niveauScoreDisplay(student.nlSchrijven)}
            nodig={niveauNodig(gaps.nlSchrijvenNiveau, 'voldoende')}
          />
          <CriterionRow
            label="Nederlands gesprekken ≥3F"
            scoreDisplay={niveauScoreDisplay(student.nlGesprekvoeren)}
            nodig={niveauNodig(gaps.nlGesprekvoerenNiveau, 'goed')}
          />
          <CriterionRow
            label="Rekenen — domeinen"
            scoreDisplay={nodigDisplay(gaps.nodigSBC_rekenDomeinen)}
            nodig={gaps.nodigSBC_rekenDomeinen}
          />
          <CriterionRow
            label="Rekenen ≥3F"
            scoreDisplay={niveauScoreDisplay(student.rekenResultaat)}
            nodig={niveauNodig(gaps.rekenNiveau, 'goed')}
          />
          <CriterionRow
            label="KD behaald of voor 1 december haalbaar"
            scoreDisplay={behaaldDisplay(gaps.kdStatus)}
            nodig={kdNodig(gaps.kdStatus)}
          />
          <CriterionRow
            label="WVO-traject"
            scoreDisplay={wvoDisplay(gaps.wvoTraject)}
            nodig={wvoNodig(gaps.wvoTraject)}
          />
        </PrognoseBlock>
      );

      // Actual outcome block first, then the other positive route. D17: BJ2 has
      // no negatief-tier anymore — 'bespreekgeval' (like 'sbl') orders SBL first.
      bj2Ordered = p.label === 'sbc' ? <>{sbcBlock}{sblBlock}{pokBlock}</> : <>{sblBlock}{sbcBlock}{pokBlock}</>;
    }
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
      {(aantalNietIngeleverd > 0 || aantalTeLaat > 0) && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          {aantalNietIngeleverd > 0 && (
            <span style={{ color: 'var(--rag-rood)', fontWeight: 500 }}>
              ✗ {aantalNietIngeleverd} niet ingeleverd
            </span>
          )}
          {aantalTeLaat > 0 && (
            <span style={{ color: 'var(--rag-oranje)', fontWeight: 500 }}>
              △ {aantalTeLaat} te laat
            </span>
          )}
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
