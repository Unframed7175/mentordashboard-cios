// parsers/pdf.ts — PDF voortgang parser
// PDF.js loaded as ESM from vendor/

// @ts-ignore — vendor bundle heeft geen TypeScript declaraties; pdfjs-dist npm types gelden hier niet
import * as pdfjsLib from '../vendor/pdf.min.mjs';
// @ts-ignore — Vite ?url suffix: emits file as static asset and returns its URL string
import pdfWorkerUrl from '../vendor/pdf.worker.min.mjs?url';
import { DEELGEBIEDEN, normalizeScore } from '../utils/schema';

// WKWebView polyfill: ReadableStream.prototype[Symbol.asyncIterator] was added in Safari 17.4.
// PDF.js 5.x uses `for await...of` on ReadableStream internally (getTextContent/streamTextContent).
// If Symbol.asyncIterator is missing, JSCore throws "undefined is not a function" instead of
// "is not iterable" (V8 style). This polyfill makes ReadableStream async-iterable on all WebViews.
if (typeof ReadableStream !== 'undefined' && !(Symbol.asyncIterator in ReadableStream.prototype)) {
  (ReadableStream.prototype as any)[Symbol.asyncIterator] = async function* () {
    const reader = (this as ReadableStream).getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
  console.log('[pdf.ts] ReadableStream asyncIterator polyfill toegepast');
}

// pdfjs-dist 5.x internally does: new Worker(workerSrc, {type:'module'})
// ?url import guarantees Vite emits the worker to dist/assets/ and resolves it correctly
// on both Windows (WebView2) and macOS (WKWebView). new URL(…, import.meta.url) can
// produce a wrong path on macOS in production builds when the parser is outside src/.
// Do NOT use workerPort — that code path (#gr) resolves the worker promise immediately
// before the module worker has finished bootstrapping, causing silent message loss.
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

console.log('[pdf.ts] PDF.js initialized, version:', (pdfjsLib as any).version);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Increased from 3 → 4 (999.3), 4 → 6 (phase-36): WebView2 on Windows reports
// baseline Y positions with more variation than WKWebView on macOS.
/** Tolerance in PDF points for grouping text items into the same visual line. */
const Y_TOLERANCE = 6;

/**
 * Known status strings (per D-11).
 * Matched case-insensitively with whitespace tolerance.
 */
import { STATUS_STRINGS } from './pdf-status';
import {
  matchStatus,
  enrichDatapuntenStatus,
  enrichByProximity as _enrichByProximity,
} from './pdf-enrich';

/**
 * Minimum number of column items required in a line for it to be
 * considered the "Overzicht Deelgebieden" header row or to trigger
 * a schema-drift warning in buildColumnMap.
 */
const MIN_COLUMN_WARN_THRESHOLD = 5;

// Increased from 8 → 12 (999.3), 12 → 20 (phase-36): WebView2 renders text at
// slightly different X positions than WKWebView, causing scores to fall outside
// the window. Nearest-neighbour selection keeps wrong-column assignments safe.
/**
 * X-tolerance (in PDF points) for assigning a score cell to the nearest
 * column header.
 */
const COLUMN_X_TOLERANCE = 20;

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

    const viewport = page.getViewport({ scale: 1 });
    const pageWidth = viewport.width;
    const rawItems: any[] = Array.isArray(content?.items) ? content.items : [];
    for (const item of rawItems) {
      if (item == null || item.type !== undefined) continue; // skip TextMarkedContent (no str)
      if (!item.str || typeof item.str !== 'string' || item.str.trim() === '') continue;
      allItems.push({
        str:       item.str,
        x:         item.transform[4],
        y:         item.transform[5],
        width:     item.width,
        height:    item.height,
        fontSize:  Math.abs(item.transform[0]), // abs to handle mirrored transforms
        page:      pageNum,
        pageWidth,
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
 * Returns true when a line looks like the "Overzicht Deelgebieden" column-header row.
 *
 * Primary (with pageWidth): positional spread heuristic — line has ≥ MIN_COLUMN_WARN_THRESHOLD
 * items that collectively span ≥ 50% of the page width.  This works regardless of whether
 * the column labels are known (open-world).
 *
 * Fallback (no pageWidth): label-based matching against DEELGEBIEDEN — used in tests or when
 * pageWidth is unavailable.
 *
 * @param line - Array of text items (one visual row)
 * @param pageWidth - Page width in PDF points; if provided, use spread heuristic
 * @returns {boolean}
 */
function isHeaderRow(line: any[], pageWidth?: number): boolean {
  if (line.length < MIN_COLUMN_WARN_THRESHOLD) return false;

  if (pageWidth && pageWidth > 0) {
    const xs = line.map((it: any) => it.x as number);
    const span = Math.max(...xs) - Math.min(...xs);
    return span >= pageWidth * 0.5;
  }

  // Fallback: label-based matching
  const knownLabels = new Set(DEELGEBIEDEN.map((d: any) => d.label.toUpperCase()));
  let matches = 0;
  for (const it of line) {
    if (knownLabels.has(it.str.trim().toUpperCase())) {
      matches++;
      if (matches >= MIN_COLUMN_WARN_THRESHOLD) return true;
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
  for (let i = 0; i < lines.length; i++) {
    const text = lineToText(lines[i]);
    const pw = lines[i][0]?.pageWidth ?? 595;

    // Strategy 1: section title on previous line → next spread line is the header
    if (/overzicht\s*deelgebied/i.test(text)) {
      if (isHeaderRow(lines[i], pw)) return i;
      continue;
    }

    // Strategy 2: direct positional detection (works even if title is missing)
    if (isHeaderRow(lines[i], pw)) return i;
  }

  return -1;
}

/**
 * Build a column map from the detected header row (open-world).
 *
 * Known deelgebied labels → recorded in `map` with their X position.
 * Unrecognised non-empty labels → collected in `unknownLabels` (schema drift).
 * Logs a warning when fewer than MIN_COLUMN_WARN_THRESHOLD known columns are found.
 *
 * @param headerLine - Array of text items from the header row
 * @returns {{ map: Record<string, number>, unknownLabels: string[] }}
 */
function buildColumnMap(headerLine: any[]): { map: Record<string, number>; unknownLabels: string[] } {
  const knownLabels = new Set(DEELGEBIEDEN.map((d: any) => d.label.toUpperCase()));
  const map: Record<string, number> = {};
  const unknownSet = new Set<string>();

  for (const it of headerLine) {
    const trimmed = it.str.trim();
    if (!trimmed) continue;
    const upper = trimmed.toUpperCase();

    if (knownLabels.has(upper)) {
      const dg = DEELGEBIEDEN.find((d: any) => d.label.toUpperCase() === upper);
      if (dg) map[dg.label] = it.x;
    } else {
      unknownSet.add(trimmed);
    }
  }

  const count = Object.keys(map).length;
  const unknownLabels = [...unknownSet];

  if (count < MIN_COLUMN_WARN_THRESHOLD) {
    console.warn(`[pdf.ts] buildColumnMap: only ${count} deelgebied columns detected — table may be malformed`);
  } else {
    console.log(`[pdf.ts] buildColumnMap: detected ${count}/19 columns`, map);
  }
  if (unknownLabels.length > 0) {
    console.warn(`[pdf.ts] buildColumnMap: ${unknownLabels.length} unknown column(s):`, unknownLabels);
  }

  return { map, unknownLabels };
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
function parseDeelgebiedTable(lines: any[][], startIndex: number): { datapunten: any[]; deelgebiedScores: Record<string, string | null>; unknownLabels: string[] } {
  const { map: columnMap, unknownLabels } = buildColumnMap(lines[startIndex]);
  const headingThreshold = detectHeadingThreshold(lines);

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
    if (isHeaderRow(line, line[0]?.pageWidth ?? 595)) {
      console.log(`[pdf.ts] Skipping repeated deelgebied header row at line ${i}`);
      continue;
    }

    // Sort line items by x (left to right) — PDF.js does not guarantee order
    const sorted = line.slice().sort((a: any, b: any) => a.x - b.x);

    // The leftmost item is the row label (vak name or opdracht/datapunt name)
    const labelItem = sorted[0];
    const labelText = labelItem ? labelItem.str.trim() : '';

    // Vak group heading: font size exceeds the document heading threshold (T3)
    if (labelText && labelItem && labelItem.fontSize >= headingThreshold) {
      currentVak = labelText;
      console.log(`[pdf.ts] Deelgebied table: vak heading (font-size) → "${currentVak}"`);
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

  return { datapunten, deelgebiedScores, unknownLabels };
}

// ---------------------------------------------------------------------------
// Parse-time enrichment: attach inleverstatus to each datapunt (R-02)
// (enrichDatapuntenStatus and enrichByProximity are imported from ./pdf-enrich)
// ---------------------------------------------------------------------------


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
  const deelgebiedStart = findDeelgebiedSection(lines);
  let deelgebiedScores: Record<string, string | null> = {};
  let datapunten: any[] = [];
  let unknownLabels: string[] = [];

  if (deelgebiedStart >= 0) {
    const result = parseDeelgebiedTable(lines, deelgebiedStart);
    deelgebiedScores = result.deelgebiedScores;
    datapunten       = result.datapunten;
    unknownLabels    = result.unknownLabels;
  } else {
    throw new Error('Overzicht Deelgebieden tabel niet gevonden');
  }

  let naam = header.naam;
  if (!naam) {
    const m = file.name.replace(/\.pdf$/i, '').match(/DD-(.+)$/i);
    naam = m ? m[1].trim() : file.name.replace(/\.pdf$/i, '');
  }

  if (!vakken || vakken.length === 0) {
    console.warn(`[pdf.ts] Geen vakken gevonden in ${file.name}`);
  } else {
    enrichDatapuntenStatus(vakken, datapunten);
  }

  const unenriched = datapunten.filter((dp: any) => !dp.status).length;
  if (unenriched > 0) {
    const texts = lines.map(l => lineToText(l));
    _enrichByProximity(texts, datapunten);
  }

  return {
    naam,
    leerlingId:    header.leerlingId || '',
    periode:       header.periode    || '',
    leerjaar:      header.leerjaar   || '',
    filename:      file.name,
    vakken,
    deelgebiedScores,
    datapunten,
    unknownLabels,
  };
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
  MIN_COLUMN_WARN_THRESHOLD,
  COLUMN_X_TOLERANCE,
};
