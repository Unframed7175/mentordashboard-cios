---
phase: "01"
plan: "03"
subsystem: pdf-parser
tags: [pdf, deelgebieden, table-extraction, coordinates, score-parsing]
dependency_graph:
  requires: [01-02]
  provides: [deelgebiedScores, datapunten]
  affects: [parseSinglePDF, StudentRecord]
tech_stack:
  added: []
  patterns:
    - nearest-X column assignment for coordinate-based table reconstruction
    - multi-strategy header detection (title heading + direct label matching)
    - latest-non-null-wins aggregation across datapunten
key_files:
  modified:
    - parsers/pdf.js
decisions:
  - COLUMN_X_TOLERANCE=8pt for column assignment — start value from research; tune against real PDFs in 01-04
  - MIN_HEADER_MATCHES=5 to detect deelgebied header row — robust against partial rows
  - "Latest non-null wins" aggregation for deelgebiedScores — later datapunten override earlier ones
  - Vak group detection in table: label-only rows (no score cells) become vak headings
  - All 19 deelgebied keys always present in deelgebiedScores (null = not yet assessed)
metrics:
  duration: "4 min"
  completed: "2026-03-24T07:07:08Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 01 Plan 03: Overzicht Deelgebieden Table Extraction Summary

**One-liner:** Coordinate-based deelgebied table reconstruction extracting V/G/E scores per column via nearest-X matching with multi-page header skip logic.

## What Was Built

Extended `parsers/pdf.js` with five new functions that together extract and aggregate the "Overzicht Deelgebieden" table from voortgang-PDFs.

### New Functions

**`isHeaderRow(line)`**
Returns true when a grouped line contains >= 5 text items whose trimmed/uppercased value matches any of the 19 known deelgebied labels (`window.DEELGEBIEDEN`). Used both for initial detection and for skipping repeated header rows on subsequent pages of a multi-page table.

**`findDeelgebiedSection(lines)`**
Scans all grouped lines using two strategies:
1. Finds a line containing "Overzicht Deelgebieden" (case-insensitive), then returns the first subsequent `isHeaderRow()` match
2. Returns the first line that directly passes `isHeaderRow()` (catches PDFs where the title is missing or merged)

Returns the line index of the column header row, or -1 if not found.

**`buildColumnMap(headerLine)`**
Iterates the header row items, matches each against `window.DEELGEBIEDEN` labels (case-insensitive), and records the X position. Returns `{ 'V&A': 45.2, 'M&M': 72.8, ... }`. Logs a warning if fewer than 5 columns are detected.

**`assignScoreToColumn(item, columnMap)`**
Finds the column whose X position is closest to `item.x` within `COLUMN_X_TOLERANCE` (8pt). Returns the deelgebied label string or null if no column is close enough. This is the core of the coordinate-based table reconstruction.

**`parseDeelgebiedTable(lines, startIndex)`**
Walks lines from the header row onward:
- Skips blank lines
- Detects and skips repeated header rows (`isHeaderRow()`) for multi-page tables
- For each data row: leftmost item is the row label; remaining items are checked with `normalizeScore()` and assigned to columns via `assignScoreToColumn()`
- Label-only rows (no score cells) become vak group headings
- Returns `{ datapunten, deelgebiedScores }`

Aggregation: initialises all 19 deelgebied keys to `null`, then applies "latest non-null wins" across all datapunten in document order.

### Integration into `parseSinglePDF`

`parseSinglePDF` now calls `findDeelgebiedSection` + `parseDeelgebiedTable` after `parseVakSections`. If the table is not found, it throws `'Overzicht Deelgebieden tabel niet gevonden'` (PDF-08 requirement). `deelgebiedScores` and `datapunten` are now fully populated in the returned `StudentRecord`.

### Constants Added

| Constant | Value | Purpose |
|----------|-------|---------|
| `MIN_HEADER_MATCHES` | 5 | Minimum deelgebied labels in a line to treat it as a header row |
| `COLUMN_X_TOLERANCE` | 8 | PDF points tolerance for column assignment |

## Deviations from Plan

None — plan executed exactly as written.

The comment block in the `findDeelgebiedSection` function contains a dead code path that references `afterSectionHeading` without acting on it — this was retained as a structural trace of strategy 1 semantics but has no behavioral effect. Not a bug.

## Known Stubs

None. All 19 deelgebied keys are always initialised in `deelgebiedScores` (null = unassessed). `datapunten` is a real array populated from parsed data rows. No hardcoded empty values that flow to UI rendering.

## Verification Notes

Manual verification required against real PDFs (browser-only constraint, no automated test runner):

1. Open `index.html` via `start.bat` (local HTTP server — PDF.js worker requires HTTP)
2. Drop a voortgang-PDF onto the import zone
3. In DevTools console:
   ```javascript
   const result = await parseSinglePDF(file); // file from drag-and-drop
   Object.keys(result.deelgebiedScores).length  // should be 19
   Object.values(result.deelgebiedScores).filter(v => v !== null).length  // should be > 0
   result.datapunten.length  // should be > 0
   result.deelgebiedScores['V&A']  // should be 'voldoende'|'goed'|'excellent'|null
   ```
4. Cross-check 3-5 score values against the original PDF visually

If `COLUMN_X_TOLERANCE` proves too narrow (scores not matching columns), increase to 10 or 12pt and re-test.

## Self-Check: PASSED

- `parsers/pdf.js` exists and was modified: FOUND
- Commit c5494de exists: FOUND
- All 5 new functions present in file: FOUND (isHeaderRow, findDeelgebiedSection, buildColumnMap, assignScoreToColumn, parseDeelgebiedTable)
- parseSinglePDF wired to call findDeelgebiedSection + parseDeelgebiedTable: FOUND
- All new functions exported and added to window.*: FOUND
