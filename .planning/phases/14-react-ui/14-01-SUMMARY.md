---
phase: 14-react-ui
plan: "01"
subsystem: status-utility
tags: [typescript, utility, rag-status, berekenStatus, detectTraject, wave-0]
dependency_graph:
  requires:
    - utils/prognosis.ts (berekenPrognose function)
    - utils/schema.ts (DEELGEBIEDEN constants used indirectly via prognosis)
    - utils/leerlijnen.ts (getLeerlijnenMapping used indirectly via prognosis)
  provides:
    - src/utils/status.ts: berekenStatus, detectTraject, STATUS_VOLGORDE, RAG_BORDER, StatusKleur, StatusResult
  affects:
    - Wave 1: src/components/KlasOverzicht.tsx (imports berekenStatus)
    - Wave 1: src/components/LeerlingTegel.tsx (imports STATUS_VOLGORDE, RAG_BORDER)
    - Wave 2: src/components/DetailWeergave.tsx (imports berekenStatus)
tech_stack:
  added: []
  patterns:
    - Pure TypeScript named-export utility module (no default exports)
    - Re-implementation of app.js IIFE private functions as typed ES module exports
    - Pattern matching via Array.some + indexOf (identical to app.js, no regex)
key_files:
  created:
    - src/utils/status.ts
    - tests/status.test.ts
  modified: []
decisions:
  - Import path uses '../../utils/prognosis' (correct relative path from src/utils/ to utils/prognosis.ts); plan described './prognosis' which would have caused a module-not-found error
metrics:
  duration: "3m 29s"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 14 Plan 01: Status Utility Summary

**One-liner:** Pure TypeScript berekenStatus/detectTraject utility extracted from app.js IIFE with all 5 RAG outcomes, STATUS_VOLGORDE/RAG_BORDER constants, and 8 passing unit tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/utils/status.ts with berekenStatus and detectTraject | 1c8cbbd | src/utils/status.ts (created) |
| 2 | Create tests/status.test.ts with 7 unit tests | 05d6a25 | tests/status.test.ts (created) |

## What Was Built

### src/utils/status.ts

Re-implemented the two private IIFE functions from `app.js` (lines 1193-1245) as typed, exported TypeScript:

- **`berekenStatus(student, traject?): StatusResult`** — Calculates RAG status using exact return-chain from app.js (lines 1228-1238): grijs/Onbekend → rood/Risico → oranje/Let op → oranje/Verzuim → blauw/Profieljaar SBC → groen/Op koers → blauw/Versneld SBC → groen/Op koers BJ2 → groen/Op koers fallback. VERZUIM_DREMPEL_MIN = 600 minutes verified from app.js line 1039.

- **`detectTraject(student): string`** — Pattern matching on `student.periode` using exact BJ1/BJ2 pattern arrays from app.js lines 1198-1207. Periode is leading; leerjaar is fallback; falls back to 'bj2' with console.warn.

- **`STATUS_VOLGORDE`** — Sort priority map: rood=0, oranje=1, groen=2, blauw=3, grijs=4
- **`RAG_BORDER`** — Hex colour map: groen=#22c55e, oranje=#f97316, rood=#ef4444, grijs=#d1d5db, blauw=#3b82f6
- **`StatusKleur`** — Type alias: 'groen' | 'oranje' | 'rood' | 'blauw' | 'grijs'
- **`StatusResult`** — Interface: `{ kleur: StatusKleur; label: string; prognose: any }`

### tests/status.test.ts

8 unit tests covering all specified outcomes:

| Test | Scenario | Expected |
|------|----------|----------|
| grijs | Empty deelgebiedScores (no scores) | kleur='grijs', label='Onbekend' |
| rood | 7 onvoldoende scores (negatief prognose) | kleur='rood', label='Risico' |
| oranje/Let op | 10 voldoende (neutraal prognose) | kleur='oranje', label='Let op' |
| oranje/Verzuim | 13 voldoende (sbl) + ongeoorloofd=601 | kleur='oranje', label='Verzuim' |
| groen | 13 voldoende (sbl), no verzuim | kleur='groen', label='Op koers' |
| detectTraject BJ1 | periode='bj1 fase 1' | 'bj1' |
| detectTraject BJ2 | periode='2e jaar' | 'bj2' |
| STATUS_VOLGORDE | Sort order smoke test | rood < oranje < groen < blauw < grijs |

## Verification Results

- `npm test` from worktree: **43 passing** (35 pre-existing + 8 new), 5 skipped, 0 failures
- `npx tsc --noEmit` (main tsconfig): **0 errors**
- All 5 berekenStatus outcomes tested (grijs, rood, oranje/Let op, oranje/Verzuim, groen)
- Both detectTraject patterns tested (bj1, bj2)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected import path for berekenPrognose**
- **Found during:** Task 1
- **Issue:** Plan specified `import berekenPrognose from './prognosis'` with the comment "Note: the import path must be './prognosis' (not '../../utils/prognosis') because status.ts is itself inside src/utils/." This is contradictory — `./prognosis` from `src/utils/status.ts` would look for `src/utils/prognosis.ts` which does not exist. The actual `berekenPrognose` is in `utils/prognosis.ts` (project root's utils/).
- **Fix:** Used `import { berekenPrognose } from '../../utils/prognosis'` (correct relative path from `src/utils/` to `utils/`)
- **Files modified:** src/utils/status.ts
- **Commit:** 1c8cbbd

**2. [Rule 2 - Enhancement] Added STATUS_VOLGORDE smoke test**
- **Found during:** Task 2
- **Issue:** Plan specified 7 tests; the behaviour block didn't include a STATUS_VOLGORDE test, but this is an exported constant consumed by KlasOverzicht and LeerlingTegel. A basic smoke test ensures the sort ordering is correct.
- **Fix:** Added 8th test verifying rood < oranje < groen < blauw < grijs sort order.
- **Files modified:** tests/status.test.ts
- **Commit:** 05d6a25

## Known Stubs

None — all exports are fully implemented with real logic.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. `src/utils/status.ts` is a pure utility function with no I/O, consuming only in-memory student data.

## Self-Check: PASSED

- [x] `src/utils/status.ts` exists and exports all required names
- [x] `tests/status.test.ts` exists with 8 passing tests
- [x] Commit `1c8cbbd` exists (feat: status.ts)
- [x] Commit `05d6a25` exists (test: status.test.ts)
- [x] npm test: 43 passing, 0 failures
- [x] TypeScript: 0 compile errors
