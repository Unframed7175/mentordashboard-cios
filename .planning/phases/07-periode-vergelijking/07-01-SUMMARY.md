---
phase: 07-periode-vergelijking
plan: 01
subsystem: data-layer
tags: [multi-period, deduplication, klasoverzicht, detail-view]
dependency_graph:
  requires: []
  provides: [multi-period-storage, most-recent-dedup, verzuim-inheritance, getAllRecordsForStudent]
  affects: [klasoverzicht-grid, detail-view, prognose-calculation, prev-next-nav]
tech_stack:
  added: []
  patterns: [compound-dedup-key, most-recent-period-dedup, verzuim-inheritance]
key_files:
  created: []
  modified:
    - utils/datamodel.js
    - utils/klassen.js
    - app.js
decisions:
  - "Compound dedup key (leerlingId + periode) in addStudent — Fase 2 PDFs coexist with Fase 1 records"
  - "getActiveStudents deduplicates to most-recent record per leerlingId via alphabetical periode sort"
  - "Verzuim inheritance in showDetail — most-recent record inherits verzuim from older period if it lacks one"
  - "getAllRecordsForStudent added to klassen.js for Plan 02 multi-period comparison UI"
metrics:
  duration: "68 seconds"
  completed_date: "2026-03-27"
  tasks: 2
  files: 3
---

# Phase 07 Plan 01: Multi-Period Data Layer Summary

**One-liner:** Compound dedup key (leerlingId + periode) in addStudent, plus most-recent-record deduplication in getActiveStudents, so Fase 2 PDFs coexist with Fase 1 and klasoverzicht shows one tile per student.

## What Was Built

Changed the data layer to support multiple periods per student:

1. **datamodel.js — addStudent**: Changed dedup key from `leerlingId`-only to `leerlingId + periode`. Importing Fase 2 PDFs now adds new records alongside Fase 1 records. Re-importing the same Fase 1 PDF overwrites only that period's record.

2. **klassen.js — getActiveStudents**: Now returns one record per leerlingId (most-recent by alphabetical `periode` sort) instead of the raw multi-record array. Added `getAllRecordsForStudent(leerlingId)` helper (oldest-first sort) for Plan 02 to use in the comparison UI.

3. **app.js — renderKlasGrid**: Changed from `window.appState.students` to `window.getActiveStudents()` so the grid shows exactly N tiles for N unique students, not 2N when two periods are loaded.

4. **app.js — showDetail**: Changed from `.find` (returns first match) to `filter + sort` to always open the most-recent-period record. Added Pitfall 4 mitigation: if the most-recent record lacks `verzuim`, it inherits it from any older record that has it. Fallback `detailStudentList` uses `getActiveStudents()` (deduplicated) to prevent duplicate leerlingIds in prev/next navigation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update addStudent dedup key to leerlingId + periode | 0a0f0b5 | utils/datamodel.js |
| 2 | Add most-recent dedup to getActiveStudents and fix all app.js consumers | 96c4e43 | utils/klassen.js, app.js |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows wired to real student records from imported PDFs.

## Self-Check: PASSED

- utils/datamodel.js — compound key present, old single-key pattern absent
- utils/klassen.js — getActiveStudents with seen-dedup + localeCompare, getAllRecordsForStudent present
- app.js — renderKlasGrid uses getActiveStudents(), showDetail uses filter+sort+verzuim-inheritance
- Commits 0a0f0b5 and 96c4e43 verified in git log
