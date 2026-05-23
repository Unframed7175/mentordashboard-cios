---
phase: 26-tegel-score-telling-fase-vergelijking
plan: 02
subsystem: ui
tags: [react, usememo, klasoverzicht, trend, fase-vergelijking]

# Dependency graph
requires:
  - phase: 26-01
    provides: LeerlingTegel.tsx with trend prop and score-telling render (CSS + JSX)
provides:
  - KlasOverzicht.tsx with trendMap useMemo computation and trend prop wiring to every LeerlingTegel
affects: [LeerlingTegel, KlasOverzicht, TREND-01, TREND-02, TREND-03, TREND-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "trendMap useMemo keyed on [refreshKey, allStudents.length] — same invariant as statusMap"
    - "Named computeTrend helper inside useMemo for readability and future extraction"
    - "Distinct-period guard: records[0].periode === records[last].periode → null (prevents false two-fase on duplicate import)"
    - "Grijs guard (D-09): berekenStatus.kleur === 'grijs' on either record → null before rank comparison"

key-files:
  created: []
  modified:
    - src/components/KlasOverzicht.tsx

key-decisions:
  - "Named computeTrend helper extracted inside useMemo body per plan spec — readable, extractable in future"
  - "trendMap dependency array [refreshKey, allStudents.length] identical to statusMap — safe because every import increments refreshKey"
  - "?? null fallback on trendMap.get() is defensive — useMemo always sets an entry for every active student"

patterns-established:
  - "trendMap pattern: Map<string, 'op' | 'neer' | null> computed alongside statusMap with identical dependency array"

requirements-completed: [TREND-01, TREND-02, TREND-03, TREND-04]

# Metrics
duration: 8min
completed: 2026-05-23
---

# Phase 26 Plan 02: KlasOverzicht trendMap Wiring Summary

**trendMap useMemo added to KlasOverzicht.tsx with full phase-comparison algorithm (length guard, distinct-period guard, grijs guard, rank comparison), wired to every LeerlingTegel via trend prop**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-23T14:46:00Z
- **Completed:** 2026-05-23T14:49:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `getAllRecordsForStudent` to the existing `utils/klassen` import in KlasOverzicht.tsx
- Added `trendMap` useMemo directly after `statusMap` useMemo with identical `[refreshKey, allStudents.length]` dependency array
- Implemented `computeTrend` named helper inside useMemo with four-step algorithm:
  - Step A (length guard): records.length < 2 → null
  - Step B (distinct-period guard): records[0].periode === records[last].periode → null (prevents false two-fase comparison from duplicate imports)
  - Step C (grijs guard per D-09): either fase's kleur === 'grijs' → null
  - Step D (rank comparison): STATUS_VOLGORDE rank2 > rank1 → 'op', rank2 < rank1 → 'neer', equal → null
- Wired `trend={trendMap.get(s.leerlingId) ?? null}` to every LeerlingTegel in the tile grid sorted.map
- Trend prop placed between status and onClick props for readability
- All 150 tests pass (5 pre-existing skips unchanged)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getAllRecordsForStudent import and trendMap useMemo** - `67673e0` (feat)
2. **Task 2: Wire trend prop to every LeerlingTegel** - `3ecbbc2` (feat)

## Files Created/Modified

- `src/components/KlasOverzicht.tsx` — added `getAllRecordsForStudent` to import, added `trendMap` useMemo block (42 lines), added `trend` prop to every LeerlingTegel in sorted.map

## Decisions Made

- Used named `computeTrend` helper inside useMemo body per plan spec — makes the algorithm readable as a candidate for future extraction to a standalone pure function
- Dependency array `[refreshKey, allStudents.length]` matches statusMap exactly — documented via comment above the return statement that `refreshKey` increments on every import
- `?? null` fallback on `trendMap.get(s.leerlingId)` is defensive — the useMemo loop always sets an entry for every student returned by `getActiveStudents()`

## Deviations from Plan

None — plan executed exactly as written.

Pre-existing TypeScript errors in `src/App.tsx`, `src/components/SettingsPage.tsx`, `tests/spider.test.ts`, and `utils/spider.tsx` remain unchanged and are out of scope (not caused by this plan).

## Phase 26 Complete

Both plans delivered:
- Plan 01: LeerlingTegel extended with `trend` prop, score-telling row, and four CSS classes
- Plan 02: KlasOverzicht computes `trendMap` via useMemo and passes trend to every LeerlingTegel

TREND-01 through TREND-04 and TEGEL-01, TEGEL-02 requirements fulfilled.

## Verification Checks

- `npx tsc --noEmit` — pre-existing 4 errors unchanged; 0 errors in modified files
- `npx vitest run` — 150 passed, 5 skipped (unchanged)
- `grep -c "getAllRecordsForStudent" src/components/KlasOverzicht.tsx` = 2 (import + useMemo call)
- `grep -c "trendMap" src/components/KlasOverzicht.tsx` = 3 (declaration, loop set, prop usage)
- `grep "trend=" src/components/KlasOverzicht.tsx` = `trend={trendMap.get(s.leerlingId) ?? null}`

## Self-Check: PASSED

- [x] `src/components/KlasOverzicht.tsx` modified and committed
- [x] Commit `67673e0` exists (Task 1)
- [x] Commit `3ecbbc2` exists (Task 2)
- [x] 150 tests pass
- [x] trendMap useMemo present with correct algorithm
- [x] trend prop wired to every LeerlingTegel

---
*Phase: 26-tegel-score-telling-fase-vergelijking*
*Completed: 2026-05-23*
