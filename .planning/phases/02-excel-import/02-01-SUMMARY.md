---
phase: 02-excel-import
plan: "01"
subsystem: excel-parser
tags: [excel, verzuim, sheetjs, datamodel, parsing]
dependency_graph:
  requires: []
  provides: [window.parseVerzuimTime, window.parseExcelFile, window.normalizeNaam, window.mergeVerzuim, window.getVerzuim]
  affects: [utils/datamodel.js, parsers/excel.js]
tech_stack:
  added: [SheetJS/XLSX (CDN global)]
  patterns: [window.* globals, FileReader ArrayBuffer, async/await, Dutch time format parsing]
key_files:
  created:
    - parsers/excel.js
  modified:
    - utils/datamodel.js
decisions:
  - "excel.js uses window.* globals (not ES module) — consistent with schema.js/datamodel.js, avoids module scope issues in browser"
  - "mergeVerzuim matches by leerlingnummer first, then normalized naam — ID match preferred for correctness, name match as fallback for XLS exports without matching IDs"
  - "parseVerzuimTime returns 0 for all invalid/empty input — safe default, avoids NaN in downstream calculations"
metrics:
  duration: "5 min"
  completed: "2026-03-24"
  tasks_completed: 2
  files_modified: 2
---

# Phase 02 Plan 01: Excel Verzuim Parser Summary

**One-liner:** SheetJS-based Excel parser with Dutch time format ("107u24m") conversion and leerlingId/name-fallback student matching.

## What Was Built

Two files form the core Excel import pipeline for Phase 2:

### parsers/excel.js (new)

- `window.parseVerzuimTime(str)` — converts Dutch time strings like "107u24m" to integer minutes (107*60+24 = 6444). Returns 0 for null/empty/malformed input.
- `window.parseExcelFile(file)` — async function that reads a File object as ArrayBuffer via FileReader, parses with `XLSX.read()`, converts the first sheet to JSON rows, and returns structured verzuim records. Each record has: naam, leerlingnummer, aanwezigheid, geoorloofd, ongeoorloofd, totaal, laatsteMelding. All column name lookups have Dutch fallbacks (e.g., "Geoorloofd" / "Geoorloofd verzuim").

### utils/datamodel.js (extended — no existing code changed)

- `@typedef Verzuim` — JSDoc type with aanwezigheid, geoorloofd, ongeoorloofd, totaal, laatsteMelding fields
- `window.normalizeNaam(naam)` — lowercase + collapse whitespace + trim for case-insensitive Dutch name matching
- `window.mergeVerzuim(verzuimRecords)` — links parsed verzuim records to students in `window.appState.students`. Matches by leerlingnummer first, falls back to normalized name. Sets `student.verzuim` on each match. Returns `{ matched: number, unmatched: string[] }`.
- `window.getVerzuim(leerlingId)` — convenience accessor returning `student.verzuim` or null.

## Decisions Made

1. **window.* globals for excel.js** — pdf.js uses ESM (required for PDF.js worker URL resolution), but excel.js has no such requirement. Using window.* keeps it consistent with schema.js and datamodel.js.
2. **mergeVerzuim matching order** — leerlingnummer match first (exact, reliable when present), normalized name as fallback (handles XLS exports where student numbers don't align with PDF leerlingId).
3. **parseVerzuimTime returns 0 on failure** — NaN values in verzuim fields would break downstream prognosis calculations; 0 is a safe sentinel.

## Deviations from Plan

None — plan executed exactly as written.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create parsers/excel.js — Excel verzuim parser | 73e940e | parsers/excel.js (created) |
| 2 | Extend datamodel.js — verzuim fields, normalizeNaam, mergeVerzuim | ad48b49 | utils/datamodel.js (modified) |

## Known Stubs

None — all functions are fully implemented. `mergeVerzuim` and `getVerzuim` rely on `window.appState.students` being populated by the PDF import pipeline (Plan 01). The UI integration (file input, trigger, display) is handled in Plan 02-02.

## Self-Check: PASSED
