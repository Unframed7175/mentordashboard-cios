// utils/aggregation.ts — Modus-berekening over datapunten per deelgebied
// TypeScript (Phase 11, Plan 04) — directe TypeScript versie, geen .js tussenversie

import { SCORE_LEVELS, DEELGEBIEDEN } from './schema';

// Build a set of all valid deelgebied labels once at module load.
// Unknown or misspelled labels (e.g., 'V & A' vs 'V&A') are silently skipped
// during aggregation to prevent phantom keys in the returned aggregationDetail.
const KNOWN_LABELS = new Set(DEELGEBIEDEN.map((d: any) => d.label));

/**
 * Bereken de modus-score per deelgebied over alle datapunten.
 * Tie-break: hogere score (later in SCORE_LEVELS) wint bij gelijke frequentie.
 * Null scores tellen niet mee als stemmen.
 *
 * @param datapunten - Array van datapunt-objecten met een scores property
 * @returns { aggregationDetail: Record<string, string | null> }
 */
export function aggregateDeelgebiedScores(
  datapunten: any[]
): { aggregationDetail: Record<string, string | null> } {
  // frequentie-map: { [deelgebiedLabel]: { [score]: count } }
  const freqMap: Record<string, Record<string, number>> = {};

  for (const datapunt of datapunten) {
    const scores: Record<string, string | null> = datapunt.scores || {};
    for (const label of Object.keys(scores)) {
      if (!KNOWN_LABELS.has(label)) continue; // skip unknown/misspelled deelgebied labels
      const score = scores[label];
      if (score === null || score === undefined) continue;
      if (!freqMap[label]) {
        freqMap[label] = {};
      }
      freqMap[label][score] = (freqMap[label][score] || 0) + 1;
    }
  }

  const aggregationDetail: Record<string, string | null> = {};

  for (const label of Object.keys(freqMap)) {
    const counts = freqMap[label];
    let bestScore: string | null = null;
    let bestCount = 0;

    // Itereer over SCORE_LEVELS zodat hogere scores bij gelijkspel winnen
    for (const level of SCORE_LEVELS) {
      const count = counts[level] || 0;
      if (count > 0 && count >= bestCount) {
        // >= zodat bij gelijkspel de hogere score (later in SCORE_LEVELS) wint
        bestScore = level;
        bestCount = count;
      }
    }

    aggregationDetail[label] = bestScore;
  }

  return { aggregationDetail };
}
