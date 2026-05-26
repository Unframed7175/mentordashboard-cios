---
phase: 27-klasbeheer
plan: 01
subsystem: database
tags: [typescript, tauri, plugin-store, klassen, tdd]

# Dependency graph
requires:
  - phase: 12-storage
    provides: klassenState singleton, saveKlassen/loadKlassen, deleteKlas pattern
provides:
  - renameKlas(klasId, newNaam) exported from utils/klassen.ts (KLS-02, KLS-03)
  - RNM-01 and RNM-02 unit tests in tests/storage.test.ts
affects:
  - 27-02 KlasTabStrip inline rename UI (calls renameKlas)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct field mutation on klassenState.klassen[id].naam followed by saveKlassen() — same pattern as deleteKlas"
    - "No validation in utility function — caller owns trim/non-empty checks (D-06)"

key-files:
  created: []
  modified:
    - utils/klassen.ts
    - tests/storage.test.ts

key-decisions:
  - "renameKlas does not trim or validate newNaam — non-empty trim validation is the caller's responsibility (D-06)"
  - "Direct field assignment klassenState.klassen[klasId].naam = newNaam — no object spread needed"

patterns-established:
  - "renameKlas pattern: guard on klasId existence → direct field mutation → saveKlassen() → return true/false"

requirements-completed:
  - KLS-02
  - KLS-03

# Metrics
duration: 2min
completed: 2026-05-26
---

# Phase 27 Plan 01: Klasbeheer — renameKlas utility Summary

**renameKlas(klasId, newNaam) added to utils/klassen.ts with 2 TDD unit tests (RNM-01 data integrity, RNM-02 unknown id guard)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-26T17:02:04Z
- **Completed:** 2026-05-26T17:03:36Z
- **Tasks:** 1 (TDD: RED commit + GREEN commit)
- **Files modified:** 2

## Accomplishments
- Exported `renameKlas(klasId, newNaam): Promise<boolean>` from utils/klassen.ts
- RNM-01: full save + reset + reload cycle with naam assertion AND students data integrity assertion
- RNM-02: unknown klasId returns false without modifying state or calling saveKlassen
- Full test suite: 152 passing, 0 failures (was 150)

## Task Commits

TDD task split into two atomic commits:

1. **RED — failing tests** - `8ec5c86` (test) — add RNM-01 and RNM-02 to tests/storage.test.ts
2. **GREEN — implementation** - `2717003` (feat) — add renameKlas() to utils/klassen.ts

## Files Created/Modified
- `utils/klassen.ts` - Added `renameKlas(klasId, newNaam): Promise<boolean>` after deleteKlas, with header comment
- `tests/storage.test.ts` - Added renameKlas to import, added RNM-01 and RNM-02 tests

## Decisions Made
- Followed D-06: no trim/uniqueness guard inside renameKlas — KlasTabStrip (Plan 02) owns validation
- Direct field mutation `klassenState.klassen[klasId].naam = newNaam` — consistent with deleteKlas pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Minor: the verify command in the plan used the main dashboard path (`/d/Downloads/get-shit-done-main/dashboard-2`) but tests must run from the worktree root. Resolved by running `npx vitest run` from the worktree working directory.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `renameKlas` is exported and tested; Plan 02 (KlasTabStrip UI) can import it immediately
- No blockers

---
*Phase: 27-klasbeheer*
*Completed: 2026-05-26*
