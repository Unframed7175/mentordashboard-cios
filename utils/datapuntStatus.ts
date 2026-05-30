// utils/datapuntStatus.ts — Status lookup for datapunten in DeelgebiedenMatrix (R-02)

/**
 * Strip the leading dash prefix (SomToday uses Unicode hyphens in the
 * Overzicht Deelgebieden table) and normalize for case-insensitive matching.
 * The same character set as DATAPUNT_PREFIX in parsers/pdf.ts.
 */
export function normalizeDpNaam(naam: string): string {
  return naam.replace(/^[-‐‑‒–—―−]\s*/, '').toLowerCase().trim();
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
