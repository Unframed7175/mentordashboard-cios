// parsers/pdf.ts — PDF voortgang parser
// PDF.js loaded as ESM from vendor/

// @ts-ignore — vendor bundle heeft geen TypeScript declaraties; pdfjs-dist npm types gelden hier niet
import * as pdfjsLib from '../vendor/pdf.min.mjs';
import { DEELGEBIEDEN, normalizeScore } from '../utils/schema';

// pdfjs-dist 5.x internally does: new Worker(workerSrc, {type:'module'})
// so setting workerSrc to our .mjs file is all that's needed.
// Do NOT use workerPort — that code path (#gr) resolves the worker promise immediately
// before the module worker has finished bootstrapping, causing silent message loss.
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href;

console.log('[pdf.ts] PDF.js initialized, version:', (pdfjsLib as any).version);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Tolerance in PDF points for grouping text items into the same visual line. */
const Y_TOLERANCE = 3;

/**
 * Known status strings (per D-11).
 * Matched case-insensitively with whitespace tolerance.
 */
import { STATUS_STRINGS } from './pdf-status';

/**
 * Known vak group heading strings as they appear in SomToday PDFs.
 * Only rows whose label exactly matches one of these (case-insensitive) are
 * treated as group separators in the Overzicht Deelgebieden table.
 * All other no-score rows are datapunten with blank scores (not yet graded).
 */
const VAK_HEADINGS = new Set(['lesgeven', 'organiseren', 'prof. handelen', 'professioneel handelen']);

/**
 * Minimum number of deelgebied label matches in a line for it to be
 * considered the "Overzicht Deelgebieden" header row.
 */
const MIN_HEADER_MATCHES = 5;

/**
 * X-tolerance (in PDF points) for assigning a score cell to the nearest
 * column header.  Start at 8; tune empirically against real CIOS PDFs.
 */
const COLUMN_X_TOLERANCE = 8;

// ---------------------------------------------------------------------------
// Task 01-02-01: Text extraction and line-grouping utilities
// ---------------------------------------------------------------------------

/**
 * Extract all text items from every page of a PDF File.
 *
 * Each item: { str, x, y, width, height, fontSize, page }
 * - x = transform[4], y = transform[5] (PDF coord: Y=0 at bottom, higher = higher on page)
 * - fontSize = transform[0] (scale factor = font size in points for upright text)
 * - Items are filtered (empty/whitespace removed), then sorted:
 *     page ASC → y DESC (top-to-bottom) → x ASC (left-to-right)
 *
 * @param file
 * @returns {Promise<Array<{str:string, x:number, y:number, width:number, height:number, fontSize:number, page:number}>>}
 */
async function extractAllTextItems(file: File): Promise<any[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;

  const allItems: any[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!item.str || item.str.trim() === '') continue;
      allItems.push({
        str:      item.str,
        x:        item.transform[4],
        y:        item.transform[5],
        width:    item.width,
        height:   item.height,
        fontSize: Math.abs(item.transform[0]), // abs to handle mirrored transforms
        page:     pageNum,
      });
    }

    await page.cleanup(); // free canvas/worker resources after each page
  }

  await pdf.destroy(); // release memory

  // Sort: page ASC, within page: y DESC (top first), then x ASC (left first)
  allItems.sort((a: any, b: any) => {
    if (a.page !== b.page) return a.page - b.page;
    if (Math.abs(a.y - b.y) > Y_TOLERANCE) return b.y - a.y; // higher y = higher on page
    return a.x - b.x; // same line → left to right
  });

  return allItems;
}

/**
 * Group a sorted array of text items into visual lines using Y-proximity.
 *
 * Items within `tolerance` points of the current line's weighted-average Y
 * belong to the same line.  Items on different pages are NEVER merged into
 * the same line (page boundary always breaks the line).
 *
 * Each line is an array of text items sorted by x ascending (left to right).
 * Lines are returned in top-to-bottom order (page 1 first, then page 2, …).
 *
 * @param items - Sorted text items from extractAllTextItems()
 * @param tolerance
 * @returns Array of lines, each line is an array of items
 */
function groupIntoLines(items: any[], tolerance: number = Y_TOLERANCE): any[][] {
  const lines: any[][] = [];
  let currentLine: any[] = [];
  let currentY: number | null = null;
  let currentPage: number | null = null;

  for (const item of items) {
    const samePage = item.page === currentPage;
    const closeEnough = currentY !== null && Math.abs(item.y - currentY) <= tolerance;

    if (samePage && closeEnough) {
      currentLine.push(item);
      // Weighted average Y to handle sub-pixel baseline shifts within a line
      currentY = (currentY! * (currentLine.length - 1) + item.y) / currentLine.length;
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine.slice().sort((a: any, b: any) => a.x - b.x));
      }
      currentLine = [item];
      currentY = item.y;
      currentPage = item.page;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.slice().sort((a: any, b: any) => a.x - b.x));
  }

  return lines;
}

/**
 * Join all text items in a line into a single space-separated string.
 *
 * @param line
 * @returns {string}
 */
function lineToText(line: any[]): string {
  return line.map((item: any) => item.str).join(' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Task 01-02-02: Header + vak/opdracht/feedforward parsing
// ---------------------------------------------------------------------------

/**
 * Match a raw text string against the known status values.
 * Returns the canonical status string or '' if none matches.
 *
 * @param text
 * @returns {string}
 */
function matchStatus(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
  return STATUS_STRINGS.find(s => normalized.includes(s.toLowerCase())) || '';
}

/**
 * Extract header fields from the grouped lines of a PDF.
 *
 * Scans the first 30 lines for key-value patterns:
 *   Naam:        → naam
 *   Leerling ID: / Leerling-ID: → leerlingId
 *   Periode:     → periode
 *   Leerjaar N   → leerjaar
 *
 * Handles variable spacing around colons (per D-09).
 * Returns empty strings for fields not found.
 *
 * @param lines
 * @returns {{ naam: string, leerlingId: string, periode: string, leerjaar: string }}
 */
function extractHeader(lines: any[][]): { naam: string; leerlingId: string; periode: string; leerjaar: string } {
  const result = { naam: '', leerlingId: '', periode: '', leerjaar: '' };
  const scanLines = lines.slice(0, 30);

  for (const line of scanLines) {
    const text = lineToText(line);

    if (!result.naam) {
      // Naam and Periode appear on the SAME line in the header table:
      // "Naam: Blansjaar, M.J.J. (Mick) Periode: BJ2 Fase 2 DD"
      // Capture up to "Periode:" to avoid swallowing the Periode value.
      const m = text.match(/Naam\s*:\s*(.+?)(?=\s+Periode\s*:|$)/i);
      if (m) result.naam = m[1].trim();
    }

    if (!result.leerlingId) {
      // "Leerling ID: 248109 Leerjaar 1" — capture up to "Leerjaar"
      const m = text.match(/Leerling[\s\-]*ID\s*:\s*(.+?)(?=\s+Leerjaar\b|$)/i);
      if (m) result.leerlingId = m[1].trim();
    }

    if (!result.periode) {
      // No ^ anchor — Periode follows Naam on the same line
      const m = text.match(/Periode\s*:\s*(.+?)(?=\s{2,}|\s+Leerjaar\b|\s+Naam\s*:|$)/i);
      if (m) result.periode = m[1].trim();
    }

    if (!result.leerjaar) {
      const m = text.match(/Leerjaar\s+(\d+)/i);
      if (m) result.leerjaar = m[1];
    }
  }

  // SomToday exporteert altijd "Leerjaar 1" in de header, ook voor BJ2-leerlingen
  // (het getal geeft het jaar binnen het huidige traject aan, niet het totale studiejaar).
  // Leid leerjaar daarom af uit periode wanneer die het traject expliciet benoemt.
  if (result.periode) {
    const p = result.periode.toLowerCase();
    const isBJ2 = ['bj2', '2e jaar', 'jaar 2', 'leerjaar 2', 'bj 2', 'klas 2'].some(pat => p.includes(pat));
    const isBJ1 = ['bj1', '1e jaar', 'jaar 1', 'leerjaar 1', 'bj 1', 'klas 1'].some(pat => p.includes(pat));
    if (isBJ2) result.leerjaar = '2';
    else if (isBJ1) result.leerjaar = '1';
  }

  return result;
}

/**
 * Determine a reasonable "heading font size" threshold from the items in lines.
 *
 * Strategy: collect all unique font sizes, compute the median body-text size
 * (most common), then define a heading as anything noticeably larger.
 * Falls back to 14pt if detection is inconclusive.
 *
 * @param lines
 * @returns {number} minimum fontSize that counts as a section heading
 */
function detectHeadingThreshold(lines: any[][]): number {
  const sizes: number[] = [];
  for (const line of lines) {
    for (const item of line) {
      if (item.fontSize > 0) sizes.push(item.fontSize);
    }
  }
  if (sizes.length === 0) return 14;

  sizes.sort((a: number, b: number) => a - b);
  const median = sizes[Math.floor(sizes.length / 2)];
  // A heading is at least 20% larger than the median body font
  return median * 1.2;
}

/**
 * Heuristic: does this line text look like an opdracht header?
 *
 * Matches lines that:
 * - start with a number (possibly followed by a period/colon)
 * - start with "Opdracht"
 * - start with a dash or bullet followed by text (excluding known structural markers)
 *
 * Does NOT match: pure status strings, "Feed Forward", "Overzicht Deelgebieden",
 * short/empty lines, pure score lines.
 *
 * @param text
 * @returns {boolean}
 */
function looksLikeOpdracht(text: string): boolean {
  if (!text || text.length < 3) return false;
  // Exclude known structural markers
  if (/^(feed\s*forward|overzicht\s*deelgebied|leerjaar|naam\s*:|leerling|periode)/i.test(text)) return false;
  if (matchStatus(text)) return false;

  // Matches numbered items: "1.", "1:", "1 ", or "Opdracht …"
  if (/^\d+[\.\:\s]/.test(text)) return true;
  if (/^opdracht\b/i.test(text)) return true;
  // Dash-prefixed items that aren't just a score letter
  if (/^[-–•]\s*\w{3,}/.test(text)) return true;

  return false;
}

/**
 * Parse vak sections and their opdrachten from the grouped lines.
 *
 * Strategy:
 *  1. Compute heading font size threshold from document.
 *  2. Walk lines; a line whose max fontSize >= threshold AND whose text is not
 *     a known non-heading marker → new vak section starts.
 *  3. Fallback for PDFs where font-size detection fails: treat a line that is
 *     ALL_CAPS or Title Case without structural keywords as a vak heading, when
 *     it follows an empty/separator line (common in these PDFs).
 *  4. Within a vak, detect opdrachten by looksLikeOpdracht().
 *  5. Per opdracht, capture status and feed-forward text.
 *  6. Stop collecting vakken when "Overzicht Deelgebieden" is encountered.
 *
 * @param lines
 * @returns {Array<{ naam: string, opdrachten: Array<{ naam: string, status: string, feedForward: string }> }>}
 */
function parseVakSections(lines: any[][]): Array<{ naam: string; opdrachten: Array<{ naam: string; status: string; feedForward: string }> }> {
  const headingThreshold = detectHeadingThreshold(lines);

  const vakken: Array<{ naam: string; opdrachten: Array<{ naam: string; status: string; feedForward: string }> }> = [];
  let currentVak: { naam: string; opdrachten: Array<{ naam: string; status: string; feedForward: string }> } | null = null;
  let currentOpdracht: { naam: string; status: string; feedForward: string } | null = null;
  let capturingFeedForward = false;

  /**
   * Flush a completed opdracht into the current vak.
   */
  function flushOpdracht(): void {
    if (currentOpdracht && currentVak) {
      // Clean up feedForward: trim + collapse spaces
      currentOpdracht.feedForward = currentOpdracht.feedForward.replace(/\s+/g, ' ').trim();
      currentVak.opdrachten.push(currentOpdracht);
    }
    currentOpdracht = null;
    capturingFeedForward = false;
  }

  /**
   * Flush the current vak into vakken (includes flushing current opdracht).
   */
  function flushVak(): void {
    flushOpdracht();
    if (currentVak && (currentVak.opdrachten.length > 0 || currentVak.naam)) {
      vakken.push(currentVak);
    }
    currentVak = null;
  }

  for (const line of lines) {
    const text = lineToText(line);
    if (!text) continue;

    // Stop at the deelgebied overview table — that is Plan 01-03 territory
    if (/overzicht\s*deelgebied/i.test(text)) {
      break;
    }

    // --- Check if this line is a VAK HEADING ---
    const maxFontSize = Math.max(...line.map((i: any) => i.fontSize));
    const isLargeFont = maxFontSize >= headingThreshold;

    // Exclude known non-heading lines from being treated as vak headings
    const isKnownNonHeading =
      /^(feed\s*forward|leerling|naam\s*:|periode|leerjaar|overzicht)/i.test(text) ||
      matchStatus(text) ||
      looksLikeOpdracht(text);

    if (isLargeFont && !isKnownNonHeading && text.length > 2) {
      flushVak();
      currentVak = { naam: text, opdrachten: [] };
      capturingFeedForward = false;
      continue;
    }

    // No vak started yet — skip header area lines
    if (!currentVak) continue;

    // --- Feed Forward label ---
    if (/feed\s*forward/i.test(text)) {
      // Any inline text after "Feed Forward:" label
      const afterLabel = text.replace(/feed\s*forward\s*:?\s*/i, '').trim();
      if (currentOpdracht) {
        capturingFeedForward = true;
        if (afterLabel) {
          currentOpdracht.feedForward += (currentOpdracht.feedForward ? ' ' : '') + afterLabel;
        }
      }
      continue;
    }

    // --- Continuing feed forward text ---
    if (capturingFeedForward && currentOpdracht) {
      // Stop feed-forward capture on next structural marker
      const isStructural =
        isLargeFont ||
        looksLikeOpdracht(text) ||
        matchStatus(text) !== '' ||
        /^(leerling|naam|periode|leerjaar)/i.test(text);

      if (isStructural) {
        // Do NOT consume this line as feed-forward; fall through to handle it
        capturingFeedForward = false;
        // (fall through to handle as opdracht or status below)
      } else {
        currentOpdracht.feedForward += (currentOpdracht.feedForward ? ' ' : '') + text;
        continue;
      }
    }

    // --- Status line ---
    const status = matchStatus(text);
    if (status && currentOpdracht) {
      currentOpdracht.status = status;
      continue;
    }

    // --- Opdracht header ---
    if (looksLikeOpdracht(text)) {
      flushOpdracht();
      currentOpdracht = { naam: text, status: '', feedForward: '' };
      capturingFeedForward = false;
      continue;
    }

    // Other lines within an opdracht that aren't structural markers:
    // Could be description text — ignore for now (not required by spec)
  }

  // Flush whatever is still open
  flushVak();

  return vakken;
}

// ---------------------------------------------------------------------------
// Task 01-03-01: Deelgebied table header detection and column map construction
// ---------------------------------------------------------------------------

/**
 * Returns true when a line contains >= MIN_HEADER_MATCHES text items whose
 * trimmed, upper-cased value matches one of the 19 deelgebied labels.
 *
 * Used both to FIND the header row initially and to SKIP repeated header rows
 * on subsequent pages of a multi-page table.
 *
 * @param line - Array of text items (one visual row)
 * @returns {boolean}
 */
function isHeaderRow(line: any[]): boolean {
  const labels = DEELGEBIEDEN.map((d: any) => d.label.toUpperCase());
  let matches = 0;
  for (const item of line) {
    if (labels.includes(item.str.trim().toUpperCase())) {
      matches++;
      if (matches >= MIN_HEADER_MATCHES) return true;
    }
  }
  return false;
}

/**
 * Scan all grouped lines for the "Overzicht Deelgebieden" table header row.
 *
 * Two detection strategies (either is sufficient):
 *  1. A line whose text contains "Overzicht Deelgebieden" (case-insensitive) →
 *     the NEXT line that passes isHeaderRow() is the column header.
 *  2. A line that directly passes isHeaderRow() (>= 5 deelgebied abbreviations).
 *
 * Returns the index (in `lines`) of the first header row found, or -1 if not found.
 *
 * @param lines
 * @returns {number} index into lines, or -1
 */
function findDeelgebiedSection(lines: any[][]): number {
  let afterSectionHeading = false;

  for (let i = 0; i < lines.length; i++) {
    const text = lineToText(lines[i]);

    // Strategy 1: encountered the section title — look ahead for column row
    if (/overzicht\s*deelgebied/i.test(text)) {
      afterSectionHeading = true;
      // The title line itself might contain column headers on the same line
      // (unlikely but check anyway)
      if (isHeaderRow(lines[i])) return i;
      continue;
    }

    // Strategy 2: direct header row detection (works even if title is missing)
    if (isHeaderRow(lines[i])) return i;

    // If we saw the section title and have now passed a blank line without
    // finding a header row, keep looking for up to 10 more lines
    if (afterSectionHeading && i > 0) {
      // Limit look-ahead to avoid false positives deep in the document
      // (findDeelgebiedSection already iterates the full list — this flag
      //  just helps with strategy 1 semantics; no extra limit needed here)
    }
  }

  return -1;
}

/**
 * Build a map of { deelgebiedLabel → xPosition } from the detected header row.
 *
 * Only items whose trimmed upper-case text exactly matches a known deelgebied
 * label are recorded.  Logs a warning when fewer than 5 columns are detected
 * (table may be malformed or partially outside the viewport).
 *
 * @param headerLine - Array of text items from the header row
 * @returns {Object} e.g. { 'V&A': 45.2, 'M&M': 72.8, 'INS': 98.1, … }
 */
function buildColumnMap(headerLine: any[]): Record<string, number> {
  const labels = DEELGEBIEDEN.map((d: any) => d.label.toUpperCase());
  const map: Record<string, number> = {};

  for (const item of headerLine) {
    const upper = item.str.trim().toUpperCase();
    // Find the canonical label (preserves original casing from DEELGEBIEDEN)
    const dgIdx = labels.indexOf(upper);
    if (dgIdx !== -1) {
      map[DEELGEBIEDEN[dgIdx].label] = item.x;
    }
  }

  const count = Object.keys(map).length;
  if (count < MIN_HEADER_MATCHES) {
    console.warn(`[pdf.ts] buildColumnMap: only ${count} deelgebied columns detected — table may be malformed`);
  } else {
    console.log(`[pdf.ts] buildColumnMap: detected ${count}/19 columns`, map);
  }

  return map;
}

// ---------------------------------------------------------------------------
// Task 01-03-02: Score row parsing and integration into parseSinglePDF
// ---------------------------------------------------------------------------

/**
 * Assign a single text item to its nearest deelgebied column.
 *
 * Finds the column header whose X position is closest to `item.x`, within
 * COLUMN_X_TOLERANCE points.  Returns the deelgebied label string or null
 * if no column is close enough.
 *
 * @param item
 * @param columnMap - { label: xPosition }
 * @returns {string|null} deelgebied label or null
 */
function assignScoreToColumn(item: { str: string; x: number }, columnMap: Record<string, number>): string | null {
  let best: string | null = null;
  let bestDist = Infinity;

  for (const [label, colX] of Object.entries(columnMap)) {
    const dist = Math.abs(item.x - colX);
    if (dist < bestDist && dist <= COLUMN_X_TOLERANCE) {
      bestDist = dist;
      best = label;
    }
  }

  return best;
}

/**
 * Parse the "Overzicht Deelgebieden" table starting from `startIndex`.
 *
 * Algorithm:
 *  1. Build columnMap from the header row at startIndex.
 *  2. Walk subsequent lines:
 *     - Skip blank lines.
 *     - Skip repeated header rows (isHeaderRow() — multi-page tables).
 *     - For each data row:
 *       · The leftmost item (smallest x) is the row label (opdracht/vak name).
 *       · All other items are candidate score cells.
 *       · Each score cell is assigned to a column via assignScoreToColumn(),
 *         then normalised with normalizeScore().
 *     - Vak grouping: rows whose label exactly matches a known VAK_HEADINGS
 *       string are treated as group separators.  All other no-score rows are
 *       datapunten with blank scores (not yet graded).
 *  3. "Latest non-null wins" aggregation for deelgebiedScores.
 *
 * Returns:
 *   {
 *     datapunten: Array<{ vak, datapunt, scores: { label: level|null } }>,
 *     deelgebiedScores: { label: level|null }   // all 19 keys, aggregated
 *   }
 *
 * @param lines
 * @param startIndex - index of the header row in lines
 * @returns {{ datapunten: Array, deelgebiedScores: Object }}
 */
function parseDeelgebiedTable(lines: any[][], startIndex: number): { datapunten: any[]; deelgebiedScores: Record<string, string | null> } {
  const columnMap = buildColumnMap(lines[startIndex]);

  const datapunten: any[] = [];

  // Track the current vak name (rows in this table are grouped by vak)
  let currentVak = '';

  // Walk lines after the header row
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const text = lineToText(line);

    // Skip blank lines
    if (!text) continue;

    // Repeated column-header row (multi-page table) — skip
    if (isHeaderRow(line)) {
      console.log(`[pdf.ts] Skipping repeated deelgebied header row at line ${i}`);
      continue;
    }

    // Sort line items by x (left to right) — PDF.js does not guarantee order
    const sorted = line.slice().sort((a: any, b: any) => a.x - b.x);

    // The leftmost item is the row label (vak name or opdracht/datapunt name)
    const labelItem = sorted[0];
    const labelText = labelItem ? labelItem.str.trim() : '';

    // Known vak group heading — update currentVak, skip adding as datapunt
    if (labelText && VAK_HEADINGS.has(labelText.toLowerCase())) {
      currentVak = labelText;
      console.log(`[pdf.ts] Deelgebied table: vak heading → "${currentVak}"`);
      continue;
    }

    // Datapunten always start with a dash-like character (PDF uses U+2010 HYPHEN,
    // not ASCII U+002D hyphen-minus). Skip anything that doesn't start with a dash.
    const DATAPUNT_PREFIX = /^[-‐‑‒–—―−]/;
    if (!DATAPUNT_PREFIX.test(labelText)) {
      console.log(`[pdf.ts] Deelgebied table: skipping non-datapunt row → "${labelText}"`);
      continue;
    }

    // The remaining items are either score cells or label-continuation text.
    // Items that normalise to a score value AND are close to a column → score.
    // Items not near any column → part of the datapunt label (multi-item names).
    const remainingItems = sorted.slice(1);
    const labelContinuation: string[] = [];
    const scores: Record<string, string | null> = {};

    for (const item of remainingItems) {
      const level = normalizeScore(item.str);
      if (level !== null) {
        const col = assignScoreToColumn(item, columnMap);
        if (col !== null) {
          scores[col] = level;
        } else {
          console.warn(`[pdf.ts] Score "${item.str}" at x=${item.x.toFixed(1)} did not match any column`);
        }
      } else {
        // Not a recognised score — label continuation if not near any score column
        if (assignScoreToColumn(item, columnMap) === null) {
          labelContinuation.push(item.str.trim());
        }
      }
    }

    const fullLabel = labelContinuation.length > 0
      ? [labelText, ...labelContinuation].filter(Boolean).join(' ')
      : labelText;

    datapunten.push({ vak: currentVak, datapunt: fullLabel, scores });
  }

  // -----------------------------------------------------------------------
  // Aggregate deelgebiedScores: initialize all 19 as null, then apply
  // "latest non-null wins" across datapunten (document order = latest last).
  // -----------------------------------------------------------------------
  const deelgebiedScores: Record<string, string | null> = {};
  for (const dg of DEELGEBIEDEN) {
    deelgebiedScores[dg.label] = null;
  }

  for (const dp of datapunten) {
    for (const [label, level] of Object.entries(dp.scores)) {
      if (level !== null) {
        deelgebiedScores[label] = level as string;
      }
    }
  }

  console.log(
    `[pdf.ts] parseDeelgebiedTable: ${datapunten.length} datapunten,`,
    `${Object.values(deelgebiedScores).filter(v => v !== null).length}/19 deelgebieden scored`
  );

  return { datapunten, deelgebiedScores };
}

// ---------------------------------------------------------------------------
// Parse-time enrichment: attach inleverstatus to each datapunt (R-02)
// ---------------------------------------------------------------------------

/**
 * Aggressive normaliser for status matching.
 * Strips dash prefix, "Opdracht N:" prefix and leading "N." prefix so that
 * "1. Lesontwerp", "- 1. Lesontwerp" and "Opdracht 1: Lesontwerp" all
 * normalise to the same key.
 */
function _normForStatusMatch(s: string): string {
  return s
    .replace(/^[-‐‑‒–—―−]\s*/, '')          // strip dash prefix
    .replace(/^opdracht\s*\d+[.:]\s*/i, '')   // strip "Opdracht N:" / "Opdracht N."
    .replace(/^\d+[.:]\s*/, '')               // strip "1." / "1:"
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Enrich each datapunt with the inleverstatus from the matching vakken
 * opdracht.  Runs at parse-time inside parseSinglePDF when both structures
 * are available.
 *
 * Matching strategy (in order):
 *   1. Exact match on aggressively normalised name.
 *   2. Substring containment (one normalised key contains the other) —
 *      handles code-prefixed labels like "LO01 Sportles" vs "Sportles".
 *
 * Modifies datapunten in-place by setting dp.status.
 */
function enrichDatapuntenStatus(
  vakken: Array<{ naam: string; opdrachten: Array<{ naam: string; status: string }> }>,
  datapunten: any[]
): void {
  const entries: Array<{ key: string; status: string }> = [];
  for (const vak of vakken) {
    for (const op of (vak.opdrachten || [])) {
      if (op.naam && op.status) {
        entries.push({ key: _normForStatusMatch(op.naam), status: op.status });
      }
    }
  }
  if (entries.length === 0) return;

  for (const dp of datapunten) {
    const dpKey = _normForStatusMatch(dp.datapunt);
    // 1. Exact match
    let found = entries.find(e => e.key === dpKey);
    // 2. Substring fallback (min 4 chars to avoid false positives)
    if (!found && dpKey.length >= 4) {
      found = entries.find(e => e.key.length >= 4 && (e.key.includes(dpKey) || dpKey.includes(e.key)));
    }
    if (found) dp.status = found.status;
  }
}

/**
 * Main entry point: parse a single voortgang PDF File into a complete StudentRecord.
 *
 * Produces:
 *   { naam, leerlingId, periode, leerjaar, filename, vakken,
 *     deelgebiedScores, datapunten }
 *
 * Throws if the "Overzicht Deelgebieden" table is not found (PDF-08).
 *
 * @param file
 * @returns {Promise<import('../utils/datamodel').StudentRecord>}
 */
async function parseSinglePDF(file: File): Promise<any> {
  const items = await extractAllTextItems(file);
  const lines = groupIntoLines(items);

  const header = extractHeader(lines);
  const vakken = parseVakSections(lines);

  // --- Plan 01-03: parse Overzicht Deelgebieden table FIRST ---
  // (deelgebied data is structurally independent of vakken; parsing it before
  //  the vakken guard ensures a PDF with a valid deelgebied table but no
  //  parseable vak lines still returns a useful record instead of throwing.)
  const deelgebiedStart = findDeelgebiedSection(lines);
  let deelgebiedScores: Record<string, string | null> = {};
  let datapunten: any[] = [];

  if (deelgebiedStart >= 0) {
    const result = parseDeelgebiedTable(lines, deelgebiedStart);
    deelgebiedScores = result.deelgebiedScores;
    datapunten       = result.datapunten;
  } else {
    // Per PDF-08: throw specific error so the batch importer can report it
    throw new Error('Overzicht Deelgebieden tabel niet gevonden');
  }

  // Filename fallback for naam (per plan spec)
  // Must run after deelgebied parse (so deelgebied data is available regardless of naam)
  // and before the vakken guard so the fallback naam appears in any error messages.
  let naam = header.naam;
  if (!naam) {
    const m = file.name.replace(/\.pdf$/i, '').match(/DD-(.+)$/i);
    naam = m ? m[1].trim() : file.name.replace(/\.pdf$/i, '');
  }

  if (!vakken || vakken.length === 0) {
    // Warn rather than throw: deelgebied data was already parsed successfully above.
    // A PDF with a valid deelgebied table but no parseable vak lines is unusual
    // but should not discard the scores that were already collected.
    console.warn(`[pdf.ts] Geen vakken gevonden in ${file.name}`);
  } else {
    // R-02: attach inleverstatus to each datapunt at parse time
    enrichDatapuntenStatus(vakken, datapunten);
  }

  const record = {
    naam,
    leerlingId:  header.leerlingId || '',
    periode:     header.periode    || '',
    leerjaar:    header.leerjaar   || '',
    filename:    file.name,
    vakken,
    deelgebiedScores,
    datapunten,
  };

  return record;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  // Public API
  parseSinglePDF,

  // Lower-level utilities (exported for debugging / future plans)
  extractAllTextItems,
  groupIntoLines,
  lineToText,
  extractHeader,
  parseVakSections,

  // Deelgebied table utilities (Plan 01-03)
  isHeaderRow,
  findDeelgebiedSection,
  buildColumnMap,
  assignScoreToColumn,
  parseDeelgebiedTable,

  // Constants
  Y_TOLERANCE,
  STATUS_STRINGS,   // re-exported from ./pdf-status
  VAK_HEADINGS,
  MIN_HEADER_MATCHES,
  COLUMN_X_TOLERANCE,
};
