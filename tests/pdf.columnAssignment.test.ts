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
  COLUMN_X_TOLERANCE,
} from '../parsers/pdf';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function item(str: string, x: number) {
  return { str, x };
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
  const columnMap = buildColumnMap(line);
  return { line, columnMap };
}

// Tight spacing (25px) — used for tests that should still pass within 12px drift.
function buildTightHeader(): { line: any[]; columnMap: Record<string, number> } {
  const labels = ['V&A', 'M&M', 'INS', 'O&DW', 'C&B', '1E&B'];
  const line = labels.map((label, i) => item(label, 100 + i * 25));
  const columnMap = buildColumnMap(line);
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

  it('ignores non-deelgebied text in the header line', () => {
    const line = [
      item('Naam', 10),
      item('V&A', 100),
      item('Onbekend', 130),
      item('INS', 150),
    ];
    const columnMap = buildColumnMap(line);
    expect(Object.keys(columnMap)).toHaveLength(2);
    expect(columnMap['V&A']).toBe(100);
    expect(columnMap['INS']).toBe(150);
  });

  it('handles lowercase label text (case-insensitive match)', () => {
    const line = [item('v&a', 100), item('ins', 150)];
    const columnMap = buildColumnMap(line);
    expect(columnMap['V&A']).toBe(100);
  });

  it('records X position from header, not adjusted by offset', () => {
    // Column map X values must be the raw header item positions —
    // the tolerance in assignScoreToColumn handles the drift, not the map.
    const line = [item('V&A', 87.3), item('INS', 134.7)];
    const columnMap = buildColumnMap(line);
    expect(columnMap['V&A']).toBeCloseTo(87.3);
    expect(columnMap['INS']).toBeCloseTo(134.7);
  });
});
