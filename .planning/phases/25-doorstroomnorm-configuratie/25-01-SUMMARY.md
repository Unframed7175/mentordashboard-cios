---
phase: 25-doorstroomnorm-configuratie
plan: 01
subsystem: tests
tags: [tdd, red-tests, normen, prognosis, settings, persistence]
dependency_graph:
  requires: []
  provides:
    - tests/normen.test.ts (5 RED unit tests — gates Plan 02 utils/normen.ts implementation)
    - tests/prognosis.normen.test.ts (7 RED integration tests — gates Plan 02 berekenPrognose refactor)
  affects:
    - utils/normen.ts (contract pinned — does not exist yet)
    - utils/prognosis.ts (berekenPrognose 4th parameter contract pinned)
tech_stack:
  added: []
  patterns:
    - vi.hoisted + ES6 class LazyStore mock (STATE.md line 64 mandate)
    - dynamic import inside it() blocks for module cache isolation
    - top-level static import to cause module-load-time RED failure
key_files:
  created:
    - tests/normen.test.ts
    - tests/prognosis.normen.test.ts
  modified: []
decisions:
  - "Test C uses negatiefTotaal=10 AND negatiefPerLeerlijn=5 (not just negatiefTotaal=10) because 7 onvoldoende across 3 leerlijnen geometrically requires >=3 in one leerlijn, which would trigger the per-leerlijn check at default negatiefPerLeerlijn=2"
  - "prognosis.normen.test.ts uses static top-level import of utils/normen to ensure all 7 tests fail at module-load time before Plan 02 lands"
  - "normen.test.ts uses dynamic await import() inside each it() block (matching verzuimDrempels.test.ts pattern) for module cache isolation via vi.resetModules()"
metrics:
  duration: "~6m"
  completed: "2026-05-21T14:30:17Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 25 Plan 01: RED Test Scaffold Summary

**One-liner:** 5+7=12 RED test cases pinning the utils/normen.ts API contract and berekenPrognose normen parameter before any implementation begins.

## What Was Built

Two new test files created as the failing-test foundation for Phase 25:

### tests/normen.test.ts (Task 1 — 5 RED tests)

Unit tests for the future `utils/normen.ts` module. All 5 tests fail at module-load time (Vite transform error: `utils/normen.ts` does not exist).

| # | Test Name | Coverage |
|---|-----------|----------|
| 1 | loadNormen returns DEFAULT_NORMEN on cold cache | NORM-06 default branch; asserts all 8 fields individually |
| 2 | saveNormen persists round-trip (NORM-06) | save → resetModules → reload → compare sbl=10, sbc=12 |
| 3 | getNormenSync returns DEFAULT_NORMEN when cache cold | Sync accessor fallback branch |
| 4 | saveNormen updates the sync cache instantly (pitfall 5) | Instant-apply: cache updated before async write completes |
| 5 | resetNormen restores DEFAULT_NORMEN (NORM-07) | Reset: all 8 fields restored after custom save |

**Mock pattern:** `vi.hoisted` + ES6 class `LazyStore` with Map-backed `get/set/save/delete` (STATE.md line 64 mandate). `beforeEach` resets map and calls `vi.resetModules()` for cache isolation.

### tests/prognosis.normen.test.ts (Task 2 — 7 RED integration tests)

Integration tests for `berekenPrognose` with optional 4th `normen` parameter. All 7 tests fail at module-load time (import of `../utils/normen` at file top).

| Test | Covers | Fixture | Assertion |
|------|--------|---------|-----------|
| A — SBL custom | NORM-01 | 10 voldoende, no onvoldoende, sbl=10 | label==='sbl', nodigSBL===0 |
| B — SBC custom | NORM-02 | 10 voldoende, all KERN_SBC met, sbc=10 | label==='sbc', nodigSBC_deelgebieden===0 |
| C — negatiefTotaal | NORM-03 | 7 onvoldoende (2+2+3 across leerlijnen), negatiefTotaal=10, negatiefPerLeerlijn=5 | isNegatief===false, onvoldoendeRuimte===3 |
| D — negatiefPerLeerlijn | NORM-04 | 3 onvoldoende all in lesgeven, negatiefPerLeerlijn=5 | isNegatief===false, onvoldoendeRuimtePerLeerlijn.lesgeven===2 |
| E — versneld trio | NORM-05 | bj1, lesgeven=3G/org=2G/ph=4G, custom (3/2/4) | label==='versneld_sbc' |
| F — bj1Positief | NORM-05 | bj1, 11 voldoende (no goed), bj1Positief=10 | label==='naar_bj2', nodigBJ2===0 |
| G — fallback | all | call without 4th arg | does not throw, result.label is string |

## API Contract Pinned for Plan 02

### utils/normen.ts interface (must be created)

```typescript
export interface Normen {
  sbl: number;                  // default 13
  sbc: number;                  // default 15
  negatiefTotaal: number;       // default 6
  negatiefPerLeerlijn: number;  // default 2
  bj1Positief: number;          // default 13
  versneldLesgeven: number;     // default 4
  versneldOrganiseren: number;  // default 3
  versneldProfHandelen: number; // default 5
}

export const DEFAULT_NORMEN: Normen;
export function getNormenSync(): Normen;
export async function loadNormen(): Promise<Normen>;
export async function saveNormen(normen: Normen): Promise<boolean>;
export async function resetNormen(): Promise<Normen>;
```

Store key: `'doorstroom_normen'` in `store.json` (LazyStore).

### berekenPrognose signature (must be extended)

```typescript
export function berekenPrognose(
  student: any,
  traject?: string,
  activeDeelgebiedenIds?: string[],
  normen?: Normen   // NEW 4th parameter — falls back to getNormenSync()
): any;
```

## Existing Tests Not Modified

- `tests/prognosis.test.ts`: NOT touched. All 9 existing tests still pass.
- No other test files were modified.

## Test Suite Health Before Plan 02

| State | Count | Files |
|-------|-------|-------|
| RED (new — expected) | 2 files, 12 tests | tests/normen.test.ts, tests/prognosis.normen.test.ts |
| GREEN (unchanged) | 17 files, 132 tests | all other test files |
| Skipped | 5 tests | unchanged |

Full suite: `2 failed | 17 passed | 1 skipped (20 files)`. Only the 2 new files are red.

## Deviations from Plan

### Auto-fixed Issue

**[Rule 1 - Bug] Test C fixture design corrected — 7 onvoldoende requires raised negatiefPerLeerlijn**

- **Found during:** Task 2 fixture design
- **Issue:** The plan specifies `{ ...DEFAULT_NORMEN, negatiefTotaal: 10 }` for Test C with "exactly 7 onvoldoende". However, 7 onvoldoende distributed across 3 leerlijnen (lesgeven=6, organiseren=5, prof_handelen=8 DGs) geometrically requires at least one leerlijn to have ≥3 onvoldoende (ceil(7/3)=3), which triggers the per-leerlijn check at default `negatiefPerLeerlijn=2`. The test would fail even after correct implementation.
- **Fix:** Used `{ ...DEFAULT_NORMEN, negatiefTotaal: 10, negatiefPerLeerlijn: 5 }` — both thresholds raised so neither the total check (7>10? No) nor the per-leerlijn check (3>5? No) triggers. The test still correctly validates NORM-03 (negatiefTotaal threshold controls isNegatief outcome).
- **Files modified:** tests/prognosis.normen.test.ts
- **Impact:** None to the RED state. Test still covers NORM-03 accurately.

## Threat Flags

None. This plan creates test scaffolds only — no production code paths altered. All fixtures use synthetic data with no PII.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| tests/normen.test.ts exists | FOUND |
| tests/prognosis.normen.test.ts exists | FOUND |
| 25-01-SUMMARY.md exists | FOUND |
| Commit 5273549 exists | FOUND |
| Commit 673ce3d exists | FOUND |
| git diff tests/prognosis.test.ts | 0 bytes (not modified) |
