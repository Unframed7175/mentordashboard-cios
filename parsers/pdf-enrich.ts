// parsers/pdf-enrich.ts — Pure enrichment utilities (no PDF.js dependency)
// Extracted so tests can import without the vendor bundle.

import { STATUS_STRINGS } from './pdf-status';

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/**
 * Aggressive normaliser for assignment name matching.
 * Strips dash prefix, "Opdracht N:" prefix, and leading "N." number prefix
 * so that "1. Lesontwerp", "- 1. Lesontwerp", "Opdracht 1: Lesontwerp" and
 * "- Lesontwerp" all normalise to the same key ("lesontwerp").
 */
export function normForStatusMatch(s: string): string {
  return s
    .replace(/^[-‐‑‒–—―−]\s*/, '')          // strip dash prefix (SomToday table prefix)
    .replace(/^opdracht\s*\d+[.:]\s*/i, '')   // strip "Opdracht N:" / "Opdracht N."
    .replace(/^\d+[.:]\s*/, '')               // strip "1." / "1:"
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Status matching
// ---------------------------------------------------------------------------

/**
 * Match a raw text string against the known status values.
 * Returns the canonical status string or '' if none matches.
 */
export function matchStatus(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
  return STATUS_STRINGS.find(s => normalized.includes(s.toLowerCase())) || '';
}

// ---------------------------------------------------------------------------
// Vakken-based enrichment (primary path)
// ---------------------------------------------------------------------------

/**
 * Enrich each datapunt with the inleverstatus from the matching vakken opdracht.
 *
 * Matching strategy (in order):
 *   1. Exact match on aggressively normalised name.
 *   2. Substring containment — handles code-prefixed labels like "LO01 Sportles".
 *
 * Modifies datapunten in-place by setting dp.status.
 */
export function enrichDatapuntenStatus(
  vakken: Array<{ naam: string; opdrachten: Array<{ naam: string; status: string }> }>,
  datapunten: any[]
): void {
  const entries: Array<{ key: string; status: string }> = [];
  for (const vak of vakken) {
    for (const op of (vak.opdrachten || [])) {
      if (op.naam && op.status) {
        entries.push({ key: normForStatusMatch(op.naam), status: op.status });
      }
    }
  }
  if (entries.length === 0) return;

  for (const dp of datapunten) {
    const dpKey = normForStatusMatch(dp.datapunt);
    let found = entries.find(e => e.key === dpKey);
    if (!found && dpKey.length >= 4) {
      found = entries.find(e => e.key.length >= 4 && (e.key.includes(dpKey) || dpKey.includes(e.key)));
    }
    if (found) dp.status = found.status;
  }
}

// ---------------------------------------------------------------------------
// Proximity-based enrichment (fallback for BJ2 PDFs)
// ---------------------------------------------------------------------------

// Regex for lines that begin a new datapunt entry (dash-prefixed with content after).
const DATAPUNT_PREFIX_RE = /^[-‐‑‒–—―−]\s*\S/;

// Split-status patterns: "Op/Te laat ingeleverd en [feed-forward text] / wel beoordeeld [continued]"
// is a common BJ2 PDF layout where multi-column rendering splits a status phrase across two lines.
const SPLIT_STATUS_PATTERNS = [
  { first: 'op tijd ingeleverd en',     second: 'wel beoordeeld', full: 'Op tijd ingeleverd en wel beoordeeld' },
  { first: 'te laat ingeleverd en',     second: 'wel beoordeeld', full: 'Te laat ingeleverd en wel beoordeeld' },
  { first: 'te laat ingeleverd en niet', second: 'beoordeeld',    full: 'Te laat ingeleverd en niet beoordeeld' },
] as const;

/**
 * Proximity-based status enrichment: for each unenriched datapunt, scan all
 * PDF lines for the closest matching name, then extract the status using
 * four strategies that handle BJ2 PDF multi-column layouts:
 *
 *  1. Same-line: name and status on the same text line.
 *  2. Split-status (new): "Op/Te laat ingeleverd en" on the name line, then
 *     "wel beoordeeld" on a subsequent line within the bounded window — handles
 *     the common BJ2 layout where feed-forward text interrupts the status phrase.
 *  3. Next-line window: status on one of the window lines (single or pair concat).
 *  4. Zelfevaluatie cross-line split: "Zelfevaluatie" in the window followed by
 *     "afgerond" / "niet afgerond" on the immediately next line.
 *
 * All strategies respect a bounded window that stops at the NEXT different datapunt
 * line (dash-prefix + different name) to prevent stealing status from neighbouring
 * assignments.
 *
 * @param texts - Array of line text strings (lineToText applied to each line)
 * @param datapunten - Mutable array; enriched in-place by setting dp.status
 */
export function enrichByProximity(texts: string[], datapunten: any[]): void {
  const unenrichedBefore = datapunten.filter(dp => !dp.status).length;

  for (const dp of datapunten) {
    if (dp.status) continue;
    const dpKey = normForStatusMatch(dp.datapunt);
    if (dpKey.length < 4) continue;

    let nameFoundAt = -1;

    for (let i = 0; i < texts.length; i++) {
      const lineKey = normForStatusMatch(texts[i]);
      if (lineKey.length < 4) continue;
      if (lineKey !== dpKey) {
        // Substring containment: the shorter key must start at a word boundary inside the
        // longer one.  This prevents "vormen" from matching "bewegingsvormen ahv doelstelling"
        // (appears mid-word), while still allowing "sportles geven" to match
        // "lo01 sportles geven" (preceded by a space).
        const longer  = lineKey.length >= dpKey.length ? lineKey : dpKey;
        const shorter = lineKey.length <  dpKey.length ? lineKey : dpKey;
        const idx     = longer.indexOf(shorter);
        if (idx === -1) continue;
        const wordBoundary = idx === 0 || longer[idx - 1] === ' ';
        if (!wordBoundary) continue;
      }

      nameFoundAt = i;

      // Compute bounded window: stop before the next line belonging to a DIFFERENT datapunt.
      // This prevents cross-assignment status theft when a datapunt has no status of its own.
      let windowEnd = Math.min(i + 5, texts.length - 1);
      for (let k = i + 1; k <= windowEnd; k++) {
        if (DATAPUNT_PREFIX_RE.test(texts[k])) {
          const kKey = normForStatusMatch(texts[k]);
          if (kKey.length >= 4 && kKey !== dpKey && !kKey.includes(dpKey) && !dpKey.includes(kKey)) {
            windowEnd = k - 1;
            break;
          }
        }
      }

      const window = texts.slice(i + 1, windowEnd + 1);
      console.log(`[enrichByProximity] "${dpKey}" matched at line ${i}: "${texts[i]}"`);
      console.log(`[enrichByProximity]   window +1..+${windowEnd - i} (bounded):`, JSON.stringify(window));

      // Strategy 1: status on the same line as the name
      const sameLineStatus = matchStatus(texts[i]);
      if (sameLineStatus) {
        dp.status = sameLineStatus;
        console.log(`[enrichByProximity]   → strategy 1 (same-line): "${sameLineStatus}"`);
        break;
      }

      // Strategy 2: split status — "Op/Te laat ingeleverd en" on this line,
      // "wel beoordeeld" on a following line within the bounded window.
      if (!dp.status) {
        const currentLineLow = texts[i].toLowerCase();
        for (const pat of SPLIT_STATUS_PATTERNS) {
          if (!currentLineLow.includes(pat.first)) continue;
          for (let j = i + 1; j <= windowEnd; j++) {
            if (texts[j].toLowerCase().includes(pat.second)) {
              dp.status = pat.full;
              console.log(`[enrichByProximity]   → strategy 2 (split +${j - i}): "${pat.full}"`);
              break;
            }
          }
          if (dp.status) break;
        }
      }
      if (dp.status) break;

      // Strategy 3: single-line and consecutive-pair checks within bounded window
      for (let j = i + 1; j <= windowEnd; j++) {
        const s = matchStatus(texts[j]);
        if (s) { dp.status = s; console.log(`[enrichByProximity]   → strategy 3 (line+${j - i}): "${s}"`); break; }
        if (j + 1 <= windowEnd) {
          const sp = matchStatus(texts[j] + ' ' + texts[j + 1]);
          if (sp) { dp.status = sp; console.log(`[enrichByProximity]   → strategy 3 (pair+${j - i}): "${sp}"`); break; }
        }
      }

      // Strategy 4: Zelfevaluatie cross-line split within bounded window
      if (!dp.status) {
        for (let j = i; j <= windowEnd; j++) {
          if (!texts[j].toLowerCase().includes('zelfevaluatie')) continue;
          if (j + 1 > windowEnd) break;
          const nextLine = texts[j + 1].toLowerCase().trimStart();
          if (nextLine.startsWith('niet afgerond')) {
            dp.status = 'Zelfevaluatie, niet afgerond';
            console.log(`[enrichByProximity]   → strategy 4 (zelfevaluatie split): niet afgerond`);
            break;
          }
          if (nextLine.startsWith('afgerond')) {
            dp.status = 'Zelfevaluatie afgerond';
            console.log(`[enrichByProximity]   → strategy 4 (zelfevaluatie split): afgerond`);
            break;
          }
        }
      }

      if (dp.status) break;
    }

    if (!dp.status) {
      if (nameFoundAt >= 0) {
        console.log(`[enrichByProximity] NO STATUS found for "${dpKey}" (name found at line ${nameFoundAt}, window exhausted)`);
      } else {
        console.log(`[enrichByProximity] NO MATCH for "${dpKey}" (name not found in any PDF line)`);
      }
    }
  }

  const unenrichedAfter = datapunten.filter(dp => !dp.status).length;
  console.log(`[enrichByProximity] done: ${unenrichedBefore - unenrichedAfter} enriched, ${unenrichedAfter} still missing`);
}
