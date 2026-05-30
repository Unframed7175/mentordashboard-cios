// utils/datapuntStatus.ts — Status lookup for datapunten in DeelgebiedenMatrix (R-02)

/**
 * Normalize an opdracht/datapunt name for matching.
 * Strips leading dash, "Opdracht N:" prefix, and leading "N." number prefix
 * so that "1. Lesontwerp", "- 1. Lesontwerp" and "Opdracht 1: Lesontwerp"
 * all normalise to the same key ("lesontwerp").
 */
export function normalizeDpNaam(naam: string): string {
  return naam
    .replace(/^[-‐‑‒–—―−]\s*/, '')           // strip leading dash (table row prefix)
    .replace(/^opdracht\s*\d+[.:]\s*/i, '')    // strip "Opdracht N:" / "Opdracht N."
    .replace(/^\d+[.:]\s*/, '')                // strip "1." / "1:"
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a map of normalized opdracht name → delivery status from all
 * records' vakken.  Used by DeelgebiedenMatrix to show a status badge
 * per datapunt row.
 *
 * @param allRecords - StudentRecord[], any order
 * @returns Map<normalizedOpdrachtNaam, statusString>
 */
export function buildDpStatusMap(allRecords: any[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const record of allRecords) {
    for (const vak of (record.vakken || [])) {
      for (const opdracht of (vak.opdrachten || [])) {
        if (opdracht.naam && opdracht.status) {
          map.set(normalizeDpNaam(opdracht.naam), opdracht.status);
        }
      }
    }
  }
  return map;
}

/**
 * Look up the delivery status for a datapunt label.
 *
 * Strategy:
 *   1. Exact match on normalised key.
 *   2. Substring containment — one key contains the other (min 4 chars).
 *      Handles truncated datapunt labels from older imports and code-prefixed
 *      labels like "LO01 Sportles" matching "Sportles geven".
 */
export function lookupDpStatus(map: Map<string, string>, dpNaam: string): string | undefined {
  const key = normalizeDpNaam(dpNaam);
  const exact = map.get(key);
  if (exact) return exact;
  if (key.length >= 4) {
    for (const [mapKey, status] of map) {
      if (mapKey.length >= 4 && (key.includes(mapKey) || mapKey.includes(key))) {
        return status;
      }
    }
  }
  return undefined;
}
