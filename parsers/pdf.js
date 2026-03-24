// parsers/pdf.js — PDF voortgang parser
// PDF.js loaded as ESM from vendor/

import * as pdfjsLib from '../vendor/pdf.min.mjs';

// CRITICAL: workerSrc must be set before first getDocument() call
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  '../vendor/pdf.worker.min.mjs',
  import.meta.url
).href;

console.log('[pdf.js] PDF.js initialized, version:', pdfjsLib.version);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Tolerance in PDF points for grouping text items into the same visual line. */
const Y_TOLERANCE = 3;

/**
 * Known status strings (per D-11).
 * Matched case-insensitively with whitespace tolerance.
 */
const STATUS_STRINGS = [
  'Op tijd ingeleverd en wel beoordeeld',
  'Zelfevaluatie afgerond',
];

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
 * @param {File} file
 * @returns {Promise<Array<{str:string, x:number, y:number, width:number, height:number, fontSize:number, page:number}>>}
 */
async function extractAllTextItems(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allItems = [];

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

    page.cleanup(); // free canvas/worker resources after each page
  }

  await pdf.destroy(); // release memory

  // Sort: page ASC, within page: y DESC (top first), then x ASC (left first)
  allItems.sort((a, b) => {
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
 * @param {Array} items - Sorted text items from extractAllTextItems()
 * @param {number} [tolerance=Y_TOLERANCE]
 * @returns {Array<Array>} Array of lines, each line is an array of items
 */
function groupIntoLines(items, tolerance = Y_TOLERANCE) {
  const lines = [];
  let currentLine = [];
  let currentY = null;
  let currentPage = null;

  for (const item of items) {
    const samePage = item.page === currentPage;
    const closeEnough = currentY !== null && Math.abs(item.y - currentY) <= tolerance;

    if (samePage && closeEnough) {
      currentLine.push(item);
      // Weighted average Y to handle sub-pixel baseline shifts within a line
      currentY = (currentY * (currentLine.length - 1) + item.y) / currentLine.length;
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine.slice().sort((a, b) => a.x - b.x));
      }
      currentLine = [item];
      currentY = item.y;
      currentPage = item.page;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.slice().sort((a, b) => a.x - b.x));
  }

  return lines;
}

/**
 * Join all text items in a line into a single space-separated string.
 *
 * @param {Array} line
 * @returns {string}
 */
function lineToText(line) {
  return line.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Task 01-02-02: Header + vak/opdracht/feedforward parsing
// ---------------------------------------------------------------------------

/**
 * Match a raw text string against the known status values.
 * Returns the canonical status string or '' if none matches.
 *
 * @param {string} text
 * @returns {string}
 */
function matchStatus(text) {
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
 * @param {Array<Array>} lines
 * @returns {{ naam: string, leerlingId: string, periode: string, leerjaar: string }}
 */
function extractHeader(lines) {
  const result = { naam: '', leerlingId: '', periode: '', leerjaar: '' };
  const scanLines = lines.slice(0, 30);

  for (const line of scanLines) {
    const text = lineToText(line);

    if (!result.naam) {
      const m = text.match(/^Naam\s*:\s*(.+)/i);
      if (m) result.naam = m[1].trim();
    }

    if (!result.leerlingId) {
      const m = text.match(/^Leerling[\s\-]*ID\s*:\s*(.+)/i);
      if (m) result.leerlingId = m[1].trim();
    }

    if (!result.periode) {
      const m = text.match(/^Periode\s*:\s*(.+)/i);
      if (m) result.periode = m[1].trim();
    }

    if (!result.leerjaar) {
      const m = text.match(/^Leerjaar\s+(\d+)/i);
      if (m) result.leerjaar = m[1];
    }
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
 * @param {Array<Array>} lines
 * @returns {number} minimum fontSize that counts as a section heading
 */
function detectHeadingThreshold(lines) {
  const sizes = [];
  for (const line of lines) {
    for (const item of line) {
      if (item.fontSize > 0) sizes.push(item.fontSize);
    }
  }
  if (sizes.length === 0) return 14;

  sizes.sort((a, b) => a - b);
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
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeOpdracht(text) {
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
 * @param {Array<Array>} lines
 * @returns {Array<{ naam: string, opdrachten: Array<{ naam: string, status: string, feedForward: string }> }>}
 */
function parseVakSections(lines) {
  const headingThreshold = detectHeadingThreshold(lines);

  const vakken = [];
  let currentVak = null;
  let currentOpdracht = null;
  let capturingFeedForward = false;

  /**
   * Flush a completed opdracht into the current vak.
   */
  function flushOpdracht() {
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
  function flushVak() {
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
    const maxFontSize = Math.max(...line.map(i => i.fontSize));
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

/**
 * Main entry point: parse a single voortgang PDF File into a partial StudentRecord.
 *
 * Produces:
 *   { naam, leerlingId, periode, leerjaar, filename, vakken, deelgebiedScores: {}, datapunten: [] }
 *
 * deelgebiedScores and datapunten are left empty for Plan 01-03 to fill in.
 *
 * @param {File} file
 * @returns {Promise<import('../utils/datamodel.js').StudentRecord>}
 */
async function parseSinglePDF(file) {
  const items = await extractAllTextItems(file);
  const lines = groupIntoLines(items);

  const header = extractHeader(lines);
  const vakken = parseVakSections(lines);

  // Filename fallback for naam (per plan spec)
  let naam = header.naam;
  if (!naam) {
    const m = file.name.replace(/\.pdf$/i, '').match(/DD-(.+)$/i);
    naam = m ? m[1].trim() : file.name.replace(/\.pdf$/i, '');
  }

  if (!vakken || vakken.length === 0) {
    throw new Error(`Geen vakken gevonden in ${file.name}`);
  }

  /** @type {import('../utils/datamodel.js').StudentRecord} */
  const record = {
    naam,
    leerlingId:        header.leerlingId || '',
    periode:           header.periode    || '',
    leerjaar:          header.leerjaar   || '',
    filename:          file.name,
    vakken,
    deelgebiedScores:  {},  // Plan 01-03
    datapunten:        [],  // Plan 01-03
  };

  return record;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  // Public API
  parseSinglePDF,

  // Lower-level utilities (exported for Plan 01-03 + debugging)
  extractAllTextItems,
  groupIntoLines,
  lineToText,
  extractHeader,
  parseVakSections,

  // Constants
  Y_TOLERANCE,
  STATUS_STRINGS,
};

// Window globals for browser console debugging
window.parseSinglePDF       = parseSinglePDF;
window.extractAllTextItems  = extractAllTextItems;
window.groupIntoLines       = groupIntoLines;
window.lineToText           = lineToText;
window.extractHeader        = extractHeader;
window.parseVakSections     = parseVakSections;
