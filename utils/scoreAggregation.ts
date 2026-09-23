// utils/scoreAggregation.ts — Shared score/fase helpers (M42 Lane B final-review fix #1/#2)
//
// Deliberately dependency-free: this module imports nothing from parsers/pdf.ts
// or utils/prognosis.ts, so both can import FROM it without inverting the
// parse-layer/aggregation-layer boundary documented in utils/prognosis.ts —
// parsers/pdf.ts is the "open-world parse" layer, utils/prognosis.ts is the
// "closed-world aggregation" layer, and neither should depend on the other.

/**
 * Aggregate a per-deelgebied score map from an ordered list of datapunten,
 * using "latest non-null wins": every deelgebied label starts at null, then
 * each datapunt's scores are applied in array order, so a later datapunt's
 * non-null score overwrites an earlier one for the same label.
 *
 * Used only by parsers/pdf.ts's parseDeelgebiedTable to fill the stored
 * deelgebiedScores compatibility field. Eindoordelen (prognose, spider chart,
 * matrix) use berekenEindoordelen in utils/aggregation.ts instead (M43).
 */
export function aggregateLatestScores(
  datapunten: { scores: Record<string, string | null> }[],
  deelgebieden: { label: string }[],
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const dg of deelgebieden) {
    result[dg.label] = null;
  }
  for (const dp of datapunten) {
    for (const [label, score] of Object.entries(dp.scores || {})) {
      if (score !== null) {
        result[label] = score;
      }
    }
  }
  return result;
}

/**
 * Normalize a datapunt's `fase` field for comparison/filtering.
 *
 * Newly-parsed datapunten (via parsers/pdf.ts's extractFase()) always carry
 * an explicit `fase: number | null` property. Datapunten imported before
 * that field existed have no `fase` property at all (`undefined`), not
 * `null`. A fase-filter that only checks `d.fase === null` would silently
 * exclude every pre-existing datapunt instead of including it — per the
 * "missing/unrecognized fase counts toward every fase filter" rule, both
 * cases must normalize to the same `null` value.
 *
 * @param dp - any object with an optional `fase` property
 * @returns the fase number, or null when absent/unrecognized
 */
export function getFase(dp: { fase?: number | null }): number | null {
  return dp.fase ?? null;
}
