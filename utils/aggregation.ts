// utils/aggregation.ts — Eindoordeel-berekening per deelgebied (S/C-formule MBO 3-4)
// TypeScript (Phase 11, Plan 04) — directe TypeScript versie, geen .js tussenversie

import { DEELGEBIEDEN } from './schema';
import { getFase } from './scoreAggregation';

// Build a set of all valid deelgebied labels once at module load.
// Unknown or misspelled labels (e.g., 'V & A' vs 'V&A') are silently skipped
// during aggregation to prevent phantom keys in the returned aggregationDetail.
const KNOWN_LABELS = new Set(DEELGEBIEDEN.map((d: any) => d.label));

const SCORE_VALUE: Record<string, number> = {
  excellent:   3,
  goed:        2,
  voldoende:   0,
  onvoldoende: -2,
};

/**
 * Bereken het eindoordeel per deelgebied via de S/C-compensatieformule (MBO 3-4).
 *
 * S (saldo) = (nE*3) + (nG*2) + (nV*0) + (nO*-2)
 * C (compensatiebehoefte) = nO - nE - floor(nG / 2)
 *
 * Beslisregels:
 *   C >= 3 of S < -0.5  → onvoldoende
 *   -0.5 <= S <= 0.5    → voldoende
 *   0.5  < S <= 2.0     → goed
 *   S > 2.0             → excellent
 *
 * @param datapunten - Array van datapunt-objecten met een scores property
 * @returns { aggregationDetail: Record<string, string | null> }
 */
export function aggregateDeelgebiedScores(
  datapunten: any[]
): { aggregationDetail: Record<string, string | null> } {
  // tel-map: { [deelgebiedLabel]: { nE, nG, nV, nO } }
  const countMap: Record<string, { nE: number; nG: number; nV: number; nO: number }> = {};

  for (const datapunt of datapunten) {
    const scores: Record<string, string | null> = datapunt.scores || {};
    for (const label of Object.keys(scores)) {
      if (!KNOWN_LABELS.has(label)) continue;
      const score = scores[label];
      // Alleen de 4 genormaliseerde niveaus tellen; een onbekende waarde (bv. uit
      // een oude of bewerkte backup) wordt genegeerd zoals een lege cel, anders
      // zou een label met alleen nullen stil als 'voldoende' uitkomen (M43 /review F3).
      if (score === null || score === undefined || !Object.prototype.hasOwnProperty.call(SCORE_VALUE, score)) continue;
      if (!countMap[label]) countMap[label] = { nE: 0, nG: 0, nV: 0, nO: 0 };
      if (score === 'excellent')   countMap[label].nE++;
      else if (score === 'goed')   countMap[label].nG++;
      else if (score === 'voldoende') countMap[label].nV++;
      else if (score === 'onvoldoende') countMap[label].nO++;
    }
  }

  const aggregationDetail: Record<string, string | null> = {};

  for (const label of Object.keys(countMap)) {
    const { nE, nG, nV: _nV, nO } = countMap[label];
    const S = (nE * 3) + (nG * 2) + (nO * -2);
    const C = nO - nE - Math.floor(nG / 2);

    let oordeel: string;
    if (C >= 3 || S < -0.5) {
      oordeel = 'onvoldoende';
    } else if (S <= 0.5) {
      oordeel = 'voldoende';
    } else if (S <= 2.0) {
      oordeel = (nE > 0 || nG > 0) ? 'goed' : 'voldoende';
    } else {
      // S > 2.0
      if (nE > 0)      oordeel = 'excellent';
      else if (nG > 0) oordeel = 'goed';
      else             oordeel = 'voldoende';
    }

    aggregationDetail[label] = oordeel;
  }

  return { aggregationDetail };
}

/**
 * M43 — de enige bron voor het eindoordeel per deelgebied (ADR-18/18a).
 * Prognose (BJ1/BJ2), spider chart en matrix rekenen allemaal via deze functie
 * op de datapunten van één record (= meest recente upload van die periode).
 *
 *   record.datapunten ──► berekenEindoordelen(datapunten, { fase? })
 *                          ├─ fasefilter: getFase(dp) === fase || null
 *                          ├─ S/C-formule + E-plafond (aggregateDeelgebiedScores)
 *                          └─ elk DEELGEBIEDEN-label, null zonder beoordeling
 *                                   │
 *        BJ1/BJ2-engines ◄──────────┼──────────► spider chart / matrix
 *
 *   record.deelgebiedScores (latest-wins, parsers/pdf.ts) is alleen nog een
 *   compatibiliteitsveld voor opslag/backups — NIET lezen voor eindoordelen.
 *
 * @param datapunten - datapunten van één record (undefined → alles null)
 * @param opties.fase - alleen datapunten van deze fase + datapunten zonder fase-tag
 * @returns { [deelgebiedLabel]: 'excellent'|'goed'|'voldoende'|'onvoldoende'|null }
 */
export function berekenEindoordelen(
  datapunten: Array<{ scores?: Record<string, string | null>; fase?: number | null }> | undefined,
  opties: { fase?: number } = {},
): Record<string, string | null> {
  const bron = datapunten ?? [];
  const gefilterd = opties.fase === undefined
    ? bron
    : bron.filter(dp => {
        const dpFase = getFase(dp);
        return dpFase === opties.fase || dpFase === null;
      });
  const { aggregationDetail } = aggregateDeelgebiedScores(gefilterd);
  const resultaat: Record<string, string | null> = {};
  for (const dg of DEELGEBIEDEN) {
    resultaat[dg.label] = aggregationDetail[dg.label] ?? null;
  }
  return resultaat;
}
