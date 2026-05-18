---
phase: 18-settings-panel-advanced
plan: "01"
subsystem: tests
tags: [settings, tdd, red-tests, deelgebieden, verzuim, bpv, prognose, wave-0]
dependency_graph:
  requires: []
  provides:
    - RED test contracts for utils/deelgebieden.ts (SET-03)
    - RED test contracts for utils/verzuimDrempels.ts (SET-05)
    - RED test contracts for utils/bpv.ts (SET-06)
    - RED test contracts for getLeerlijnenMappingSync (leerlijnen.ts extension)
    - RED threshold tests for berekenStatus thresholds parameter (status.ts, 18-03)
    - RED filter tests for berekenPrognose activeDeelgebiedenIds parameter (prognosis.ts, 18-03)
  affects:
    - tests/status.test.ts
    - tests/prognosis.test.ts
tech_stack:
  added: []
  patterns:
    - vi.hoisted + LazyStore ES6 class mock with async delete()
    - vi.resetModules() per-test cache invalidation
    - Dynamic import per-test to bypass module-level _cache
key_files:
  created:
    - tests/deelgebieden.test.ts
    - tests/verzuimDrempels.test.ts
    - tests/bpv.test.ts
    - tests/leerlijnen.test.ts
  modified:
    - tests/status.test.ts
    - tests/prognosis.test.ts
decisions:
  - "Used vi.resetModules() + dynamic import per test to reset module-level _cache — required because LazyStore utilities use module-level let _cache = null"
  - "Added async delete() to LazyStore mock — missing from SettingsPage.test.tsx mock, required for resetDeelgebiedenConfig() which calls store.delete()"
  - "berekenBpvPct(67, 200) === 34 verified: Math.round(33.5) = 34 in JavaScript (banker's rounding does not apply)"
metrics:
  duration: "210s"
  completed: "2026-05-18"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 2
---

# Phase 18 Plan 01: Wave 0 RED Test Scaffolds Summary

**One-liner:** Six test files (4 new + 2 extended) lock the Phase 18 utility interfaces as failing RED contracts that gate Wave 1 (18-02) GREEN.

## What Was Built

Wave 0 establishes the TDD RED baseline for every new module Phase 18 will introduce. All tests import from utilities that do not yet exist — they fail with module-not-found or missing-export errors until the corresponding implementation lands in Plan 18-02 (utilities) and 18-03 (logic changes).

**Test file inventory:**

| File | New/Extended | `it()` count | Failure mode |
|------|-------------|--------------|--------------|
| `tests/deelgebieden.test.ts` | NEW (161 lines) | 5 | Cannot find module '../utils/deelgebieden' |
| `tests/verzuimDrempels.test.ts` | NEW (94 lines) | 4 | Cannot find module '../utils/verzuimDrempels' |
| `tests/bpv.test.ts` | NEW (126 lines) | 8 | Cannot find module '../utils/bpv' |
| `tests/leerlijnen.test.ts` | NEW (87 lines) | 3 | getLeerlijnenMappingSync is not a function |
| `tests/status.test.ts` | EXTENDED | +4 (Phase 18 describe) | berekenStatus ignores thresholds arg + no geoorloofd check |
| `tests/prognosis.test.ts` | EXTENDED | +4 (Phase 18 describe) | berekenPrognose ignores activeDeelgebiedenIds arg |

**Total new tests: 5 + 4 + 8 + 3 + 4 + 4 = 28 (all RED until 18-02/18-03 lands)**

## it() Block Names Per File

### tests/deelgebieden.test.ts
1. `getDeelgebiedenConfig returns 19 entries on first call (cold cache)`
2. `getDeelgebiedenConfig persists round-trip via saveDeelgebiedenConfig`
3. `getActiveDGIds returns ids of active entries only`
4. `resetDeelgebiedenConfig wipes the stored key`
5. `getDeelgebiedenConfigSync returns schema defaults when cache cold`

### tests/verzuimDrempels.test.ts
1. `loadVerzuimDrempels returns DEFAULT_VERZUIM_DREMPELS on cold cache`
2. `saveVerzuimDrempels persists round-trip`
3. `getVerzuimDrempelsSync returns DEFAULT_VERZUIM_DREMPELS when cache cold`
4. `saveVerzuimDrempels updates the sync cache (instant-apply pitfall 5)`

### tests/bpv.test.ts
1. `getBpvConfig returns { verwachteUren: 200 } on cold cache`
2. `saveBpvConfig persists round-trip`
3. `getBpvData returns {} on cold cache`
4. `saveBpvData persists per-student record`
5. `berekenBpvPct returns 0 when verwacht is 0`
6. `berekenBpvPct caps at 100 when actual exceeds verwacht`
7. `berekenBpvPct rounds to nearest integer`
8. `parseBpvExcel STUB returns empty object`

### tests/leerlijnen.test.ts
1. `getLeerlijnenMappingSync returns schema defaults when cache cold`
2. `getLeerlijnenMappingSync returns cached value after getLeerlijnenMapping resolves`
3. `getLeerlijnenMappingSync never returns a Promise`

### tests/status.test.ts — describe('berekenStatus thresholds (Phase 18)')
1. `returns oranje/Verzuim when ongeoorloofd exceeds custom threshold`
2. `returns oranje/Verzuim when geoorloofd exceeds custom geoorloofd threshold`
3. `uses runtime thresholds via getVerzuimDrempelsSync when arg omitted`
4. `returns prognose-driven status when both verzuim values stay under thresholds`

### tests/prognosis.test.ts — describe('berekenPrognose activeDeelgebiedenIds filter (Phase 18)')
1. `without activeDeelgebiedenIds counts all 19 deelgebieden`
2. `with activeDeelgebiedenIds filters out inactive deelgebieden`
3. `with empty activeDeelgebiedenIds array yields zero counts`
4. `uses getLeerlijnenMappingSync (no Promise leak)`

## vi.hoisted LazyStore Mock Body

The following mock is shared across all 4 new test files. It extends the SettingsPage.test.tsx mock with an async `delete()` method, required by `resetDeelgebiedenConfig()` (and analogous reset functions) which call `store.delete(key)`.

```typescript
const { getStoreMap, setStoreMap } = vi.hoisted(() => {
  let _map = new Map<string, unknown>();
  return {
    getStoreMap: () => _map,
    setStoreMap: (m: Map<string, unknown>) => { _map = m; },
  };
});

vi.mock('@tauri-apps/plugin-store', () => {
  class LazyStore {
    async get<T>(key: string): Promise<T | null> {
      return (getStoreMap().get(key) as T) ?? null;
    }
    async set(key: string, value: unknown): Promise<void> {
      getStoreMap().set(key, value);
    }
    async save(): Promise<void> {}
    async delete(key: string): Promise<void> {
      getStoreMap().delete(key);
    }
  }
  return { LazyStore };
});
```

**Cache invalidation pattern** (applied in all 4 files):
```typescript
beforeEach(() => {
  setStoreMap(new Map<string, unknown>());
  vi.resetModules();
});
// Each test uses: const { fn } = await import('../utils/xyz'); to get a fresh module instance
```

## Status Assertion

All 28 new tests are RED and gate Wave 1 GREEN:
- `npm test -- --run tests/deelgebieden.test.ts tests/verzuimDrempels.test.ts tests/bpv.test.ts tests/leerlijnen.test.ts tests/status.test.ts tests/prognosis.test.ts` → exits non-zero (6 test files failed, 7 test assertions failed)
- `npm test -- --run tests/SettingsPage.test.tsx` → exits zero (6/6 pass) — Wave 0 does not break the existing suite

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- tests/deelgebieden.test.ts: EXISTS, 5 it() blocks, 161 lines
- tests/verzuimDrempels.test.ts: EXISTS, 4 it() blocks, 94 lines
- tests/bpv.test.ts: EXISTS, 8 it() blocks, 126 lines
- tests/leerlijnen.test.ts: EXISTS, 3 it() blocks, 87 lines
- tests/status.test.ts: EXTENDED, 4 new it() blocks in Phase 18 describe
- tests/prognosis.test.ts: EXTENDED, 4 new it() blocks in Phase 18 describe
- Commits: 71c44fe (deelgebieden), 48537a4 (verzuimDrempels+bpv+leerlijnen), f5c7079 (status+prognosis extensions)
