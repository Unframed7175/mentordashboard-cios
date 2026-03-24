---
phase: 02-excel-import
plan: "02"
subsystem: excel-ui
tags: [excel, verzuim, sheetjs, ui, app.js, index.html]
dependency_graph:
  requires: [02-01]
  provides: [excel-file-input, importExcel UI flow]
  affects: [index.html, app.js]
tech_stack:
  added: []
  patterns: [DOM event handlers, async/await, file picker, CDN script loading]
key_files:
  modified:
    - index.html
    - app.js
decisions:
  - "SheetJS loaded before schema.js so XLSX global is available to all subsequent scripts"
  - "excel.js loaded as classic script (not module) — consistent with schema.js/datamodel.js"
  - "Guard: students must be imported before Excel import — prevents mergeVerzuim running on empty appState"
metrics:
  duration: "3 min"
  completed: "2026-03-24"
  tasks_completed: 2
  files_modified: 2
---

# Phase 02 Plan 02: Excel UI Wiring Summary

**One-liner:** SheetJS CDN added, Excel file picker section wired in index.html, import handler in app.js calls parseExcelFile + mergeVerzuim and shows matched/unmatched results.

## What Was Built

### index.html (modified)

- SheetJS CDN script tag (`cdn.sheetjs.com/xlsx-0.20.3`) added before classic scripts — loads `XLSX` global
- `parsers/excel.js` classic script tag added after `utils/datamodel.js`
- Excel import section added after PDF import results:
  - `#excel-import-section` with heading "Verzuim importeren" and descriptive copy
  - `#excel-file-input` hidden file input (`.xls,.xlsx`)
  - `#excel-choose-btn` primary button "Kies Excel-bestand"
  - `#excel-import-results` panel (initially hidden) with:
    - `#excel-result-text` — shows "N van M leerlingen gekoppeld"
    - `#excel-unmatched-list` — lists unmatched student names

### app.js (modified)

- DOM references: `excelFileInput`, `excelChooseBtn`, `excelResults`, `excelResultTxt`, `excelUnmatched`
- Click handler on `excelChooseBtn` triggers `excelFileInput.click()`
- `change` handler on `excelFileInput`:
  1. Guards: `parseExcelFile` must be available; students must be non-empty
  2. Disables button, sets "Bezig met importeren..." text
  3. Calls `window.parseExcelFile(file)` → `VerzuimRecord[]`
  4. Calls `window.mergeVerzuim(records)` → `{ matched, unmatched }`
  5. Displays matched count in `#excel-result-text`
  6. Populates `#excel-unmatched-list` with unmatched names
  7. Shows `#excel-import-results` panel
  8. Logs console group with file name, counts, and example verzuim data
  9. Catches errors with `showError()`; `finally` resets button state

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | SheetJS CDN + Excel import section in index.html | 6204670 | index.html |
| 2 | Wire Excel import handler in app.js | ebe59d3 | app.js |

## Known Stubs

None — all functions fully implemented. Verzuim data is merged into `window.appState.students[*].verzuim` for use by Phase 3 (doorstroomnorm engine) and Phase 4 (klasoverzicht display).

## Self-Check: PASSED
