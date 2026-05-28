---
phase: 30-documentatie-help-ci
plan: "01"
subsystem: tests
tags: [tdd, red-tests, helppage, klastabstrip]
dependency_graph:
  requires: []
  provides: [RED test gate HelpPage, RED test gate KlasTabStrip help button]
  affects: [tests/HelpPage.test.tsx, tests/KlasTabStrip.test.tsx]
tech_stack:
  added: []
  patterns: [vitest describe/it, @testing-library/react, vi.fn() callbacks, toBeTruthy assertions]
key_files:
  created:
    - tests/HelpPage.test.tsx
  modified:
    - tests/KlasTabStrip.test.tsx
decisions:
  - toBeTruthy() assertions gebruiken (niet toBeInTheDocument()) — spiegel KlasTabStrip stijl, vermijdt @testing-library/jest-dom setup
  - makeProps factory uitgebreid met onHelp/isHelpActive vóór Wave 1 — voorkomt TypeScript-fouten na interface-uitbreiding
metrics:
  duration: "8 minutes"
  completed: "2026-05-28"
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 30 Plan 01: RED Test Gate — HelpPage + KlasTabStrip Help Button Summary

**One-liner:** 4 RED tests voor HelpPage component (module-not-found) + 2 RED tests voor KlasTabStrip ? knop (button niet aanwezig), 204 bestaande tests blijven groen.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create tests/HelpPage.test.tsx — 4 RED tests | eb454f6 | tests/HelpPage.test.tsx |
| 2 | Extend KlasTabStrip.test.tsx — makeProps + 2 RED tests | e0bebe5 | tests/KlasTabStrip.test.tsx |

## What Was Built

### Task 1 — tests/HelpPage.test.tsx
Nieuw testbestand met 4 failing tests (RED gate voor Wave 1):
- `renders help heading` — verwacht `<h1>` of heading met /help/i
- `calls onBack when Terug is clicked` — vi.fn() callback, fireEvent.click op /terug/i knop
- `renders importeren section` — getByText(/importeren/i)
- `renders fout melden section` — getByText(/fout melden/i)

Import van `../src/components/HelpPage` faalt met "Cannot find module" — dat is de verwachte RED staat. Vitest rapporteert dit als collection error voor alleen dit bestand.

### Task 2 — tests/KlasTabStrip.test.tsx
Twee aanpassingen:

**makeProps factory uitgebreid** met `onHelp: vi.fn()` en `isHelpActive: false` als defaults — zorgt dat alle bestaande Phase 27/28 tests blijven werken zodra Wave 1 de interface uitbreidt.

**Phase 30 describe block** toegevoegd na Phase 28 feedback button block:
- `renders a button with aria-label "Help openen"` — FAIL (knop bestaat niet)
- `calls onHelp when ? button is clicked` — FAIL (knop bestaat niet)

## Test Results

```
Test Files  2 failed | 22 passed | 1 skipped (25)
     Tests  2 failed | 204 passed | 5 skipped (211)
```

- HelpPage.test.tsx: FAIL op collection (module-not-found) — verwacht
- KlasTabStrip.test.tsx: 2 FAIL (help button niet aanwezig) | 11 passed — verwacht
- Alle 204 eerder passerende tests: nog steeds groen

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — dit is een test-only plan; geen broncomponenten aangemaakt.

## Threat Flags

None — geen nieuwe network endpoints, auth paths, of schema wijzigingen.

## Self-Check: PASSED

- tests/HelpPage.test.tsx exists: FOUND
- tests/KlasTabStrip.test.tsx modified: FOUND
- Commit eb454f6 (Task 1): FOUND
- Commit e0bebe5 (Task 2): FOUND
- RED state confirmed: 2 test files failing as expected, 204 passing tests unaffected
