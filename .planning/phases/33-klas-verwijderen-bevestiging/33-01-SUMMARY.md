---
phase: 33-klas-verwijderen-bevestiging
plan: "01"
title: "RED test scaffolds — KlasVerwijderenModal + TAB-01 update"
type: tdd
completed: "2026-05-30T06:11:56Z"
duration_minutes: 8
tasks_completed: 2
tasks_total: 2

subsystem: tests
tags: [tdd, red-phase, modal, klas-beheer]

dependency_graph:
  requires: []
  provides:
    - "RED gate: KlasVerwijderenModal 5 failing tests"
    - "RED gate: TAB-01 updated — expects × for ALL klassen"
  affects:
    - tests/KlasVerwijderenModal.test.tsx
    - tests/KlasTabStrip.test.tsx

tech_stack:
  added: []
  patterns:
    - TDD RED phase — module-not-found as valid RED signal
    - makeProps helper factory pattern (consistent with FeedbackModal.test.tsx)

key_files:
  created:
    - tests/KlasVerwijderenModal.test.tsx
  modified:
    - tests/KlasTabStrip.test.tsx

decisions:
  - "TAB-01 describe block herschreven van Phase 27 naar Phase 33 — 2 oude tests (canDelete true/false) vervangen door 1 test (toHaveLength 2)"
  - "makeProps retourneert k1 (canDelete: true) en k2 (canDelete: false) ongewijzigd — test controleert gedrag, niet prop-waarde"

metrics:
  duration: 8m
  completed_date: "2026-05-30"
  files_changed: 2
  commits: 2
---

# Phase 33 Plan 01: RED test scaffolds — KlasVerwijderenModal + TAB-01 update — Summary

**One-liner:** 5 RED tests voor KlasVerwijderenModal modal (checkbox-bevestiging, disabled confirm) + TAB-01 herschreven om × voor alle klassen te verwachten.

## Tasks

| # | Naam | Commit | Status |
|---|------|--------|--------|
| 1 | RED: KlasVerwijderenModal.test.tsx aanmaken | 36c377b | DONE (RED) |
| 2 | RED: TAB-01 update in KlasTabStrip.test.tsx | ef93a43 | DONE (RED) |

## Verification Results

```
Test Files  2 failed | 23 passed | 1 skipped (26)
     Tests  1 failed | 208 passed | 5 skipped (214)
```

- `tests/KlasVerwijderenModal.test.tsx` — 5 tests RED (Cannot find module `../src/components/KlasVerwijderenModal`)
- `tests/KlasTabStrip.test.tsx TAB-01` — 1 test RED (getAllByRole geeft 1 button, verwacht 2)
- 208 overige tests GROEN — geen regressies

## TDD Gate Compliance

RED phase completed correctly:
- `test(33-01)` commit voor KlasVerwijderenModal: `36c377b`
- `test(33-01)` commit voor TAB-01 update: `ef93a43`
- GREEN gate volgt in Plan 02 (`feat(33-02)` commits)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — dit plan schrijft uitsluitend testcode; geen UI stubs geintroduceerd.

## Threat Flags

None — geen nieuwe vertrouwensgrenzen; uitsluitend testcode.

## Self-Check: PASSED

- [x] `tests/KlasVerwijderenModal.test.tsx` bestaat (48 regels, 5 it()-blokken)
- [x] `tests/KlasTabStrip.test.tsx` TAB-01 describe block herschreven (Phase 33, toHaveLength(2))
- [x] Commit `36c377b` bestaat
- [x] Commit `ef93a43` bestaat
- [x] 208 tests groen, 0 regressies
