// tests/pdf.columnAssignment.test.ts
// Cross-platform X-offset regression tests for assignScoreToColumn + buildColumnMap.
//
// WHY: WebView2 (Windows) renders PDF text items at slightly different X positions
// than WKWebView (macOS). This caused score cells to miss their column and dropped
// deelgebieden from the prognose count (observed: 15 vs 17 out of 19 ≥V).
// Fix: increased COLUMN_X_TOLERANCE from 12 → 20 (phase-36).
//
// Column spacing reality: Cumlaude "Overzicht Deelgebieden" tables often span
// multiple pages with 8-10 columns per page. With 10 columns over ~450pt of
// usable width, column spacing is ~45pt — safely above the 20pt tolerance.
// Windows WebView2 drift is observed to be 13-15pt for affected cells.
//
// Key constraint: for nearest-column to assign correctly, drift must be
// strictly less than (column_spacing / 2). These tests use 40pt spacing to
// simulate the realistic multi-page sub-table layout.

import { describe, it, expect } from 'vitest';
import {
  assignScoreToColumn,
  buildColumnMap,
  isHeaderRow,
  parseDeelgebiedTable,
  COLUMN_X_TOLERANCE,
  MIN_COLUMN_WARN_THRESHOLD,
} from '../parsers/pdf';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function item(str: string, x: number, fontSize = 10) {
  return { str, x, fontSize };
}

// Synthetic header with realistic 40px column spacing (multi-page table layout).
// Real Cumlaude PDFs: ~10 columns per page × 40pt ≈ 400pt of column area.
function buildRealisticHeader(): { line: any[]; columnMap: Record<string, number> } {
  const labels = [
    'V&A', 'M&M', 'INS', 'O&DW', 'C&B', '1E&B',
    'P&O', 'S&O', 'ORG', 'I&B', '2E&B',
    'PrCo', 'VSK', 'LOB', 'INFO', 'DESK', 'BS', 'TOW', 'BH',
  ];
  const line = labels.map((label, i) => item(label, 100 + i * 40));
  const { map: columnMap } = buildColumnMap(line);
  return { line, columnMap };
}

// Tight spacing (25px) — used for tests that should still pass within 12px drift.
function buildTightHeader(): { line: any[]; columnMap: Record<string, number> } {
  const labels = ['V&A', 'M&M', 'INS', 'O&DW', 'C&B', '1E&B'];
  const line = labels.map((label, i) => item(label, 100 + i * 25));
  const { map: columnMap } = buildColumnMap(line);
  return { line, columnMap };
}

// ---------------------------------------------------------------------------
// Constants guard
// ---------------------------------------------------------------------------

describe('COLUMN_X_TOLERANCE constant', () => {
  it('is at least 20 — required for Windows WebView2 rendering drift', () => {
    expect(COLUMN_X_TOLERANCE).toBeGreaterThanOrEqual(20);
  });
});

// ---------------------------------------------------------------------------
// assignScoreToColumn — baseline (exact match)
// ---------------------------------------------------------------------------

describe('assignScoreToColumn — exact match (macOS baseline)', () => {
  it('matches score cell at exact column X position', () => {
    const { columnMap } = buildRealisticHeader();
    const result = assignScoreToColumn(item('V', 100), columnMap);
    expect(result).toBe('V&A');
  });

  it('matches all 19 columns at their exact X positions', () => {
    const { columnMap } = buildRealisticHeader();
    const labels = Object.keys(columnMap);
    for (const label of labels) {
      const x = columnMap[label];
      const result = assignScoreToColumn(item('V', x), columnMap);
      expect(result).toBe(label);
    }
  });
});

// ---------------------------------------------------------------------------
// assignScoreToColumn — Windows offset simulation (40px spacing)
// ---------------------------------------------------------------------------
// With 40px column spacing, drift up to 19px stays closer to the correct
// column than to any neighbour (19 < 20 = half-spacing). These tests verify
// the fix captures the real Windows 13-15px drift that old tolerance=12 missed.

describe('assignScoreToColumn — Windows drift +8px (40px spacing)', () => {
  it('still matches score cell shifted +8px right (within old tolerance=12)', () => {
    const { columnMap } = buildRealisticHeader();
    const result = assignScoreToColumn(item('V', 108), columnMap);
    expect(result).toBe('V&A');
  });

  it('still matches all 19 columns at +8px offset', () => {
    const { columnMap } = buildRealisticHeader();
    const labels = Object.keys(columnMap);
    for (const label of labels) {
      const result = assignScoreToColumn(item('V', columnMap[label] + 8), columnMap);
      expect(result).toBe(label);
    }
  });
});

describe('assignScoreToColumn — Windows drift +13px: KEY REGRESSION (40px spacing)', () => {
  // This is the critical range: old COLUMN_X_TOLERANCE=12 MISSED these.
  // New COLUMN_X_TOLERANCE=20 must catch them.

  it('matches at +13px — was missed by old tolerance=12, fixed in phase-36', () => {
    const { columnMap } = buildRealisticHeader();
    const result = assignScoreToColumn(item('V', 100 + 13), columnMap);
    expect(result).toBe('V&A');
  });

  it('matches all 19 columns at +13px offset', () => {
    const { columnMap } = buildRealisticHeader();
    const labels = Object.keys(columnMap);
    for (const label of labels) {
      const result = assignScoreToColumn(item('V', columnMap[label] + 13), columnMap);
      expect(result).toBe(label);
    }
  });

  it('matches at +15px (observed Windows drift for failing deelgebieden)', () => {
    const { columnMap } = buildRealisticHeader();
    const result = assignScoreToColumn(item('V', 100 + 15), columnMap);
    expect(result).toBe('V&A');
  });

  it('matches all 19 columns at +15px offset', () => {
    const { columnMap } = buildRealisticHeader();
    const labels = Object.keys(columnMap);
    for (const label of labels) {
      const result = assignScoreToColumn(item('V', columnMap[label] + 15), columnMap);
      expect(result).toBe(label);
    }
  });
});

describe('assignScoreToColumn — edge of tolerance at +19px (40px spacing)', () => {
  it('matches at +19px = COLUMN_X_TOLERANCE - 1', () => {
    const { columnMap } = buildRealisticHeader();
    const result = assignScoreToColumn(item('V', 100 + COLUMN_X_TOLERANCE - 1), columnMap);
    expect(result).toBe('V&A');
  });

  it('matches at exactly +COLUMN_X_TOLERANCE (boundary inclusive)', () => {
    const { columnMap } = buildRealisticHeader();
    const result = assignScoreToColumn(item('V', 100 + COLUMN_X_TOLERANCE), columnMap);
    expect(result).toBe('V&A');
  });
});

// ---------------------------------------------------------------------------
// Tight spacing (25px) — verify old-tolerance range still works
// ---------------------------------------------------------------------------

describe('assignScoreToColumn — tight spacing (25px), drift within ±12px', () => {
  it('tight: matches at +0px', () => {
    const { columnMap } = buildTightHeader();
    const result = assignScoreToColumn(item('V', 100), columnMap);
    expect(result).toBe('V&A');
  });

  it('tight: matches at +8px (safely below column midpoint at 12.5px)', () => {
    const { columnMap } = buildTightHeader();
    const result = assignScoreToColumn(item('V', 108), columnMap);
    expect(result).toBe('V&A');
  });

  it('tight: matches at +12px (exactly at old tolerance boundary)', () => {
    const { columnMap } = buildTightHeader();
    const result = assignScoreToColumn(item('V', 112), columnMap);
    expect(result).toBe('V&A');
  });
});

// ---------------------------------------------------------------------------
// assignScoreToColumn — beyond tolerance (should not match)
// ---------------------------------------------------------------------------

describe('assignScoreToColumn — beyond tolerance', () => {
  it('returns null when item is far from every column (wide gap)', () => {
    // Two columns with 100pt gap between them; item at midpoint
    const columnMap: Record<string, number> = { 'V&A': 100, 'M&M': 200 };
    // x=170: dist from V&A=70, dist from M&M=30 — both > COLUMN_X_TOLERANCE=20
    const result = assignScoreToColumn(item('V', 170), columnMap);
    expect(result).toBeNull();
  });

  it('returns null when single column is > COLUMN_X_TOLERANCE away', () => {
    const columnMap: Record<string, number> = { 'V&A': 100 };
    const result = assignScoreToColumn(item('V', 100 + COLUMN_X_TOLERANCE + 1), columnMap);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Nearest-column selection — no wrong-column assignment
// ---------------------------------------------------------------------------

describe('assignScoreToColumn — nearest-column correctness', () => {
  it('assigns to closest column when multiple are within tolerance (tight spacing)', () => {
    // Spacing=25px. Score at x=118 — between V&A(100) and M&M(125):
    // dist V&A=18, dist M&M=7 → M&M wins (it's closer)
    const columnMap: Record<string, number> = { 'V&A': 100, 'M&M': 125 };
    const result = assignScoreToColumn(item('V', 118), columnMap);
    expect(result).toBe('M&M');
  });

  it('assigns to V&A when score is closer to it', () => {
    const columnMap: Record<string, number> = { 'V&A': 100, 'M&M': 125 };
    // x=108: dist V&A=8, dist M&M=17 → V&A wins
    const result = assignScoreToColumn(item('V', 108), columnMap);
    expect(result).toBe('V&A');
  });

  it('with realistic 40px spacing, +13px drift never cross-assigns to adjacent column', () => {
    // At +13px from correct column: dist=13 from own, dist=27 from neighbour.
    // Own column wins — proving no wrong-column assignment at observed Windows drift.
    const { columnMap } = buildRealisticHeader();
    const labels = Object.keys(columnMap);
    for (const label of labels) {
      const result = assignScoreToColumn(item('V', columnMap[label] + 13), columnMap);
      expect(result).toBe(label);
    }
  });

  it('with realistic 40px spacing, +15px drift never cross-assigns to adjacent column', () => {
    const { columnMap } = buildRealisticHeader();
    const labels = Object.keys(columnMap);
    for (const label of labels) {
      const result = assignScoreToColumn(item('V', columnMap[label] + 15), columnMap);
      expect(result).toBe(label);
    }
  });
});

// ---------------------------------------------------------------------------
// buildColumnMap — header detection
// ---------------------------------------------------------------------------

describe('buildColumnMap — header detection', () => {
  it('maps all 19 deelgebied labels from synthetic header', () => {
    const { columnMap } = buildRealisticHeader();
    expect(Object.keys(columnMap)).toHaveLength(19);
  });

  it('captures unknown column labels in unknownLabels (T2)', () => {
    const line = [
      item('Naam', 10),
      item('V&A', 100),
      item('Onbekend', 130),
      item('INS', 150),
    ];
    const { map, unknownLabels } = buildColumnMap(line);
    expect(Object.keys(map)).toHaveLength(2);
    expect(map['V&A']).toBe(100);
    expect(map['INS']).toBe(150);
    expect(unknownLabels).toContain('Onbekend');
    expect(unknownLabels).not.toContain('V&A');
  });

  it('handles lowercase label text (case-insensitive match)', () => {
    const line = [item('v&a', 100), item('ins', 150)];
    const { map } = buildColumnMap(line);
    expect(map['V&A']).toBe(100);
  });

  it('records X position from header, not adjusted by offset', () => {
    // Column map X values must be the raw header item positions —
    // the tolerance in assignScoreToColumn handles the drift, not the map.
    const line = [item('V&A', 87.3), item('INS', 134.7)];
    const { map } = buildColumnMap(line);
    expect(map['V&A']).toBeCloseTo(87.3);
    expect(map['INS']).toBeCloseTo(134.7);
  });

  it('maps all 19 deelgebied labels from synthetic header (map key)', () => {
    const { columnMap } = buildRealisticHeader();
    expect(Object.keys(columnMap)).toHaveLength(19);
  });

  it('unknownLabels is empty when all items are known deelgebied labels', () => {
    const { line } = buildRealisticHeader();
    const { unknownLabels } = buildColumnMap(line);
    expect(unknownLabels).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// isHeaderRow — positional spread heuristic (T1)
// ---------------------------------------------------------------------------

describe('isHeaderRow — positional spread heuristic (T1)', () => {
  it('MIN_COLUMN_WARN_THRESHOLD is 5', () => {
    expect(MIN_COLUMN_WARN_THRESHOLD).toBe(5);
  });

  it('returns true when ≥5 items span ≥50% of pageWidth (unknown labels)', () => {
    const line = [0, 80, 160, 240, 320, 400].map(x => item('ONBEKEND', x));
    // span=400, 400/595≈67% ≥ 50%, count=6 ≥ 5
    expect(isHeaderRow(line, 595)).toBe(true);
  });

  it('returns false when fewer than MIN_COLUMN_WARN_THRESHOLD items', () => {
    const line = [item('V&A', 50), item('M&M', 300)];
    // count=2 < 5
    expect(isHeaderRow(line, 595)).toBe(false);
  });

  it('returns false when items are clustered (span < 50% of pageWidth)', () => {
    const line = [0, 10, 20, 30, 40, 50].map(x => item('X', x));
    // span=50, 50/595≈8% < 50%
    expect(isHeaderRow(line, 595)).toBe(false);
  });

  it('returns true for realistic 19-column header across 595pt page', () => {
    const { line } = buildRealisticHeader(); // x: 100…100+18*40=820, span=720
    // 720/595≈121% ≥ 50%
    expect(isHeaderRow(line, 595)).toBe(true);
  });

  it('returns false when pageWidth not provided and items are unknown labels', () => {
    // Without pageWidth: falls back to label-based — unknown labels → false
    const line = [0, 80, 160, 240, 320, 400].map(x => item('ONBEKEND', x));
    expect(isHeaderRow(line)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseDeelgebiedTable — font-size heading detection (T3)
// ---------------------------------------------------------------------------

describe('parseDeelgebiedTable — font-size heading detection (T3)', () => {
  function makeItem(str: string, x: number, fontSize = 10) {
    return { str, x, fontSize, y: 500, width: 30, height: 10, page: 1 };
  }

  it('treats high-fontSize row as vak heading even when not in old VAK_HEADINGS', () => {
    // Median fontSize = 10 → threshold = 12. 'Samenwerken' at 16 ≥ 12 → heading.
    const headerLine = ['V&A', 'M&M', 'INS'].map((l, i) => makeItem(l, 100 + i * 40, 10));
    const vakLine    = [makeItem('Samenwerken', 10, 16)];
    const datapuntLine = [makeItem('- Taak A', 10, 10), makeItem('V', 100, 10)];
    const lines = [headerLine, vakLine, datapuntLine];

    const { datapunten } = parseDeelgebiedTable(lines, 0);
    // 'Samenwerken' was treated as heading → datapunt's vak is 'Samenwerken'
    expect(datapunten[0]?.vak).toBe('Samenwerken');
    expect(datapunten.find(d => d.datapunt === 'Samenwerken')).toBeUndefined();
  });

  it('does not treat small-fontSize row as vak heading', () => {
    // 'Samenwerken' at fontSize=10 = median → NOT a heading → becomes non-datapunt row (skipped)
    const headerLine = ['V&A', 'M&M', 'INS'].map((l, i) => makeItem(l, 100 + i * 40, 10));
    const normalLine = [makeItem('Samenwerken', 10, 10)]; // small font, no dash → skipped as non-datapunt
    const datapuntLine = [makeItem('- Taak B', 10, 10), makeItem('O', 100, 10)];
    const lines = [headerLine, normalLine, datapuntLine];

    const { datapunten } = parseDeelgebiedTable(lines, 0);
    // 'Samenwerken' is not a heading → skipped (no dash prefix) → vak stays ''
    expect(datapunten[0]?.vak).toBe('');
  });
});

// ---------------------------------------------------------------------------
// parseDeelgebiedTable — trailing opdracht-table boundary (BJ1 "Praktijkbeoordelingen
// Sportvakken" regression)
// ---------------------------------------------------------------------------
//
// WHY: BJ1 voortgangsrapporten bevatten een tweede, ongerelateerde vak/opdracht-tabel
// ("Praktijkbeoordelingen Sportvakken" → "Betekenisvol Bewegen (Praktijk)") die NA de
// "Overzicht Deelgebieden"-tabel in het document staat. Zonder boundary-detectie loopt
// parseDeelgebiedTable door tot het einde van het document en interpreteert losse
// cijferletters (E/G/V/O) uit de Status-kolom van die tabel als deelgebied-scores,
// toegewezen aan de dichtstbijzijnde kolom (meestal V&A) — wat een echte deelgebiedscore
// overschrijft. Bevestigd met 2 echte BJ1-PDF's (Fase 1 en Fase 2, zelfde leerling).
//
// Onderscheid met de 'Samenwerken' heading-test hierboven: een legitieme mid-table
// vak-heading wordt NIET gevolgd door een "Status … Feed Forward"-rij — een nieuwe
// opdracht-tabel (zoals bovenaan elke PDF-pagina) altijd wel.

describe('parseDeelgebiedTable — stops before a trailing opdracht-table (Feed Forward marker)', () => {
  function makeItem(str: string, x: number, fontSize = 10) {
    return { str, x, fontSize, y: 500, width: 30, height: 10, page: 1 };
  }

  it('does not let a "Feed Forward" sub-table heading absorb scores into the deelgebied table', () => {
    const headerLine = ['V&A', 'M&M', 'INS'].map((l, i) => makeItem(l, 100 + i * 40, 10));
    // Real deelgebied datapunt: Videoanalyse scores 'goed' on V&A.
    const videoanalyse = [makeItem('‐ Videoanalyse', 10, 10), makeItem('G', 100, 10)];
    // Trailing section heading (large font, like "Praktijkbeoordelingen Sportvakken").
    const sectionHeading = [makeItem('Praktijkbeoordelingen Sportvakken', 10, 16)];
    // Opdracht-table sub-header (like "Betekenisvol Bewegen (Praktijk) Status Feed Forward").
    const subHeader = [
      makeItem('Betekenisvol Bewegen (Praktijk)', 10, 10),
      makeItem('Status', 200, 10),
      makeItem('Feed Forward', 300, 10),
    ];
    // Sportvak row whose grade letter ('E') sits at the V&A x-position — would
    // corrupt deelgebiedScores.V&A if treated as a deelgebied datapunt row.
    const hockeyRow = [makeItem('‐ P&O Hockey', 10, 10), makeItem('E', 100, 10)];

    const lines = [headerLine, videoanalyse, sectionHeading, subHeader, hockeyRow];

    const result = parseDeelgebiedTable(lines, 0);

    expect(result.datapunten.some(d => d.datapunt.includes('P&O Hockey'))).toBe(false);
    expect(result.deelgebiedScores['V&A']).toBe('goed');
    expect(result.endIndex).toBe(2); // stops at the section-heading line, before consuming it
  });

  it('still treats a mid-table heading as a new vak when NOT followed by a Feed Forward row', () => {
    const headerLine = ['V&A', 'M&M', 'INS'].map((l, i) => makeItem(l, 100 + i * 40, 10));
    const vakLine = [makeItem('Samenwerken', 10, 16)];
    const datapuntLine = [makeItem('- Taak A', 10, 10), makeItem('V', 100, 10)];
    const lines = [headerLine, vakLine, datapuntLine];

    const result = parseDeelgebiedTable(lines, 0);
    expect(result.datapunten[0]?.vak).toBe('Samenwerken');
    expect(result.endIndex).toBe(lines.length);
  });
});

// ---------------------------------------------------------------------------
// Regression: a widely-scored datapunt row must never be mistaken for a
// repeated header row (real BJ2-PDF bug, 2026-06-18).
//
// isHeaderRow() flags any line with ≥ MIN_COLUMN_WARN_THRESHOLD items spanning
// ≥ 50% of the page width — a positional heuristic with no awareness of the
// dash-prefixed datapunt marker. A single opdracht scored across 5+ widely
// spread deelgebieden satisfies that same shape, so parseDeelgebiedTable's
// loop (which checks isHeaderRow() before the datapunt-prefix check) silently
// discarded it as a "repeated header row" — losing every score in that row.
// Confirmed against two real BJ2 voortgangsrapporten where an entire vak
// ("Organisatiekunde") disappeared this way.
// ---------------------------------------------------------------------------
describe('parseDeelgebiedTable — a dash-prefixed datapunt row is never a header row', () => {
  function makeItem(str: string, x: number, fontSize = 10) {
    return { str, x, fontSize, y: 500, width: 30, height: 10, page: 1, pageWidth: 595 };
  }

  it('keeps a datapunt row scored across 5 widely-spread columns instead of discarding it as a repeated header', () => {
    const headerLine = ['V&A', 'M&M', 'C&B', 'S&O', 'DESK'].map((l, i) => makeItem(l, 150 + i * 80, 10));
    // Mirrors the real "Try-out semester 1" row: 1 label + 5 scores spanning
    // > 50% of the page width — the exact shape isHeaderRow() also matches.
    const wideRow = [
      makeItem('‐ Try-out semester 1', 10, 10),
      makeItem('V', 150, 10),
      makeItem('G', 230, 10),
      makeItem('G', 310, 10),
      makeItem('G', 390, 10),
      makeItem('V', 470, 10),
    ];
    const lines = [headerLine, wideRow];

    const result = parseDeelgebiedTable(lines, 0);

    expect(result.datapunten).toHaveLength(1);
    expect(result.datapunten[0]?.datapunt).toContain('Try-out semester 1');
    expect(result.deelgebiedScores['V&A']).toBe('voldoende');
    expect(result.deelgebiedScores['DESK']).toBe('voldoende');
  });
});

// ---------------------------------------------------------------------------
// BJ2 "Fase 2 DD"-layout: the vak name shares a line with the repeated column
// header (e.g. "Pedagogiek V&A M&M INS...") instead of standing alone on its
// own large-font line. parseDeelgebiedTable previously discarded that whole
// line as a repeated header without ever reading its leftmost cell, so every
// datapunt's `vak` field stayed "" for this layout (real-PDF confirmed,
// 2026-06-18). Currently unused by the UI, but should be captured correctly
// regardless.
// ---------------------------------------------------------------------------
describe('parseDeelgebiedTable — captures vak name embedded in a repeated header row', () => {
  function makeItem(str: string, x: number, fontSize = 10) {
    return { str, x, fontSize, y: 500, width: 30, height: 10, page: 1, pageWidth: 595 };
  }

  it('reads the vak name from the leftmost cell of the very first header row', () => {
    const headerLine = ['Pedagogiek', 'V&A', 'M&M', 'INS', 'O&DW', 'C&B']
      .map((l, i) => makeItem(l, 10 + i * 100, 10));
    const datapuntLine = [makeItem('‐ Reflectieopdracht', 10, 10), makeItem('G', 10, 10)];
    const lines = [headerLine, datapuntLine];

    const result = parseDeelgebiedTable(lines, 0);
    expect(result.datapunten[0]?.vak).toBe('Pedagogiek');
  });

  it('updates the vak name on every subsequent repeated header row, not just the first', () => {
    const cols = ['V&A', 'M&M', 'INS', 'O&DW', 'C&B'];
    const headerLine = ['Pedagogiek', ...cols].map((l, i) => makeItem(l, 10 + i * 100, 10));
    const datapunt1 = [makeItem('‐ Reflectieopdracht', 10, 10), makeItem('G', 10, 10)];
    const headerLine2 = ['Wiskunde', ...cols].map((l, i) => makeItem(l, 10 + i * 100, 10));
    const datapunt2 = [makeItem('‐ Toets domein 4', 10, 10), makeItem('V', 10, 10)];
    const lines = [headerLine, datapunt1, headerLine2, datapunt2];

    const result = parseDeelgebiedTable(lines, 0);
    expect(result.datapunten[0]?.vak).toBe('Pedagogiek');
    expect(result.datapunten[1]?.vak).toBe('Wiskunde');
  });

  it('still captures a vak named after one of its own deelgebied columns (real "LOB" collision)', () => {
    // "LOB" is both a real vak name AND one of the 19 fixed deelgebied column
    // abbreviations — a text-only "is this a known label" check can't tell
    // the leftmost "LOB" (vak name, far left) apart from the "LOB" column
    // header elsewhere in the same row (real-PDF confirmed, 2026-06-18).
    const cols = ['V&A', 'M&M', 'INS', 'O&DW', 'LOB'];
    const headerLine = ['Pedagogiek', ...cols].map((l, i) => makeItem(l, 10 + i * 100, 10));
    const datapunt1 = [makeItem('‐ Reflectieopdracht', 10, 10), makeItem('G', 10, 10)];
    const headerLine2 = ['LOB', ...cols].map((l, i) => makeItem(l, 10 + i * 100, 10));
    const datapunt2 = [makeItem('‐ Startgesprek BJ2', 10, 10), makeItem('V', 10, 10)];
    const lines = [headerLine, datapunt1, headerLine2, datapunt2];

    const result = parseDeelgebiedTable(lines, 0);
    expect(result.datapunten[0]?.vak).toBe('Pedagogiek');
    expect(result.datapunten[1]?.vak).toBe('LOB');
  });
});
