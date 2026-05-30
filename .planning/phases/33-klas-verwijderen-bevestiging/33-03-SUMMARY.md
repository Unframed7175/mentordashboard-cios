---
plan: 33-03
phase: 33-klas-verwijderen-bevestiging
status: complete
gap_closure: true
completed: "2026-05-30"
commits:
  - 7c6a1f4
  - 00991c2
  - 163baa0
---

# Plan 33-03 Summary — Gap Closure: countUniekeLeerlingen

## What Was Built

Fixed UAT issue #3 (severity: major): the delete confirmation modal double-counted students
who had 2 periodes/fases. A leerling with 2 period records showed as 2 students to be deleted.

**`countUniekeLeerlingen()` helper** added to `utils/klassen.ts`:
- Pure function, no side effects, no async
- Counts unique `leerlingId` values via `Set`
- Returns 0 for non-array input (null/undefined safe)
- Placed alongside `getActiveStudents` / `getAllRecordsForStudent`

**`handleDeleteKlas` in `src/App.tsx`** wired to use the helper:
- `countUniekeLeerlingen` added to the existing import from `../utils/klassen`
- `klas.students.length` replaced with `countUniekeLeerlingen(klas?.students)`

## TDD Sequence

RED commit (7c6a1f4): test file with 5 cases, all failing (`countUniekeLeerlingen is not a function`)
GREEN commit (7c6a1f4): helper implemented, 5/5 tests pass

## Self-Check: PASSED

key-files.created:
  - utils/klassen.ts — exports `countUniekeLeerlingen`
  - tests/klassen.uniekeLeerlingen.test.ts — 5 test cases
  - src/App.tsx — uses `countUniekeLeerlingen` in `handleDeleteKlas`

Automated checks:
  - `npx vitest run tests/klassen.uniekeLeerlingen.test.ts` — 6/6 passed (incl. null/missing leerlingId guard)
  - `npx vitest run` — 224/224 passed, 0 regressions
  - `npx tsc --noEmit -p tsconfig.migrated.json` — 0 errors

Requirements covered: KLS-05
Gap closed: UAT test 3 — modal shows correct unique student count
