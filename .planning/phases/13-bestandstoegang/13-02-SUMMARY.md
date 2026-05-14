---
phase: 13-bestandstoegang
plan: 02
subsystem: ui
tags: [react, tauri, file-api, pdfjs, sheetjs, drag-drop]

requires:
  - phase: 12-versleutelde-opslag
    provides: saveKlassen/loadKlassen/switchActiveKlas with AES-256-GCM encryption
  - phase: 11-typescript-migratie
    provides: parsers/pdf.ts (parseSinglePDF), parsers/excel.ts (parseExcelFile), utils/backup.ts (applyBackupRestore), utils/datamodel.ts (addStudent, mergeVerzuim)
provides:
  - src/components/ImportPage.tsx — universal dropzone for PDF/Excel/backup file import
affects: [14-import-ui, 15-deployment]

tech-stack:
  added: []
  patterns:
    - sequential for...of for batch PDF import (pdfjs-dist worker safety)
    - addStudent() for dedup writes (not direct .push to students array)
    - mergeVerzuim() for Excel matching (4-strategy, not hand-rolled)
    - switchActiveKlas() after backup restore to re-establish appState.students bridge
    - saveKlassen() false return treated as error state

key-files:
  created: [src/components/ImportPage.tsx]
  modified: []

key-decisions:
  - "Sequential for...of (not Promise.all) for PDF batch — pdfjs worker safety"
  - "addStudent() routes PDF results — provides leerlingId+periode dedup semantics"
  - "mergeVerzuim() routes Excel results — 4-strategy matching (leerlingnummer + name fallbacks)"
  - "handleBackup has no activeKlasId null guard — restore must work without active class"
  - "switchActiveKlas() called after successful overwrite restore — re-establishes appState.students bridge"
  - "Fixed mixed-drop order: PDFs → Excel → backup"

patterns-established:
  - "File routing by extension: file.name.toLowerCase() for .PDF uppercase scanner compat"
  - "setImportState functional updater (prev => ...) inside async loops — avoids stale closure"
  - "saveKlassen() === false check in all three handlers"

requirements-completed: [IMP-01, IMP-02, IMP-03]

duration: 15min
completed: 2026-05-14
---

# Phase 13: Bestandstoegang — Plan 02 Summary

**Universal ImportPage dropzone connecting PDF/Excel/backup parsers to encrypted storage via addStudent, mergeVerzuim, and switchActiveKlas bridge re-establishment**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-14T20:15:00Z
- **Completed:** 2026-05-14T20:30:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Created `src/components/ImportPage.tsx` with universal file dropzone (drag-drop + hidden input button)
- Implemented sequential batch PDF handler via `addStudent()` with per-file try/catch and progress counter
- Implemented Excel handler via `mergeVerzuim()` with Dutch summary message (matched/unmatched counts)
- Implemented backup restore via `applyBackupRestore('overschrijven')` + `switchActiveKlas()` bridge re-establishment
- Fixed mixed-drop dispatch order (PDFs → Excel → zip), warnings for multiple .xls/.zip drops

## Task Commits

1. **Task 1+2: ImportPage skeleton + handlers** — `1019ddd` (feat)

## Files Created/Modified

- `src/components/ImportPage.tsx` — Universal dropzone React component with all three handlers

## Decisions Made

- Combined Task 1 (skeleton) and Task 2 (handlers) into single commit — skeleton without handlers is not independently testable
- Used `isDragging` as separate `useState` boolean to avoid coupling dragover visual state to `ImportState`

## Deviations from Plan

None — plan executed exactly as written. All 7 cross-AI review fixes are in place per revised plan.

## Issues Encountered

None — TypeScript compiled clean on first pass, all 35 existing tests unaffected.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 2 (Plan 13-01) can now execute: `src/components/ImportPage.tsx` exists and is the default export
- `src/App.tsx` needs to import ImportPage and register document-level drop guard
- `src/main.tsx` needs async IIFE with `loadKlassen()` await before render

---
*Phase: 13-bestandstoegang*
*Completed: 2026-05-14*
