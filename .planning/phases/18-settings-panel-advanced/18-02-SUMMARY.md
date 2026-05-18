---
phase: 18-settings-panel-advanced
plan: "02"
subsystem: utilities
tags: [settings, deelgebieden, verzuim, bpv, lazystore, prewarm, wave-1]
dependency_graph:
  requires:
    - 18-01 (RED test contracts for all four utility modules)
  provides:
    - utils/deelgebieden.ts — LazyStore persistence for deelgebieden config (SET-03)
    - utils/verzuimDrempels.ts — LazyStore persistence for verzuim drempels (SET-05)
    - utils/bpv.ts — LazyStore persistence for bpv_config + bpv_data (SET-06)
    - getLeerlijnenMappingSync export in utils/leerlijnen.ts
    - src/main.tsx pre-warm of all four async caches before ReactDOM.createRoot()
  affects:
    - utils/leerlijnen.ts (new sync export)
    - utils/prognosis.ts (async bug fix — getLeerlijnenMappingSync replaces getLeerlijnenMapping())
    - src/main.tsx (new imports + Promise.all pre-warm)
tech_stack:
  added: []
  patterns:
    - LazyStore('store.json', { defaults: {}, autoSave: false }) — same store, different STORE_KEY
    - store.set(key, val) + store.save() pair (Phase 12 pitfall — both must be awaited)
    - Instant-apply cache update (_cache = value BEFORE async store.set) — pitfall 5
    - Sync cache accessor returning _cache ?? DEFAULT (for berekenStatus/berekenPrognose sync paths)
    - Promise.all pre-warm at app startup before ReactDOM.createRoot()
key_files:
  created:
    - utils/deelgebieden.ts
    - utils/verzuimDrempels.ts
    - utils/bpv.ts
  modified:
    - utils/leerlijnen.ts (getLeerlijnenMappingSync added)
    - utils/prognosis.ts (getLeerlijnenMapping → getLeerlijnenMappingSync, Rule 1 bug fix)
    - src/main.tsx (new imports + Promise.all pre-warm block)
decisions:
  - "Store.set + store.save always paired — set() is in-memory only, save() flushes to disk"
  - "Cache updated BEFORE await store.set (instant-apply pitfall 5) — sync accessor reflects new value immediately after save"
  - "BpvData stored as JSON string (may be large) — BpvConfig stored as plain object (settings.ts pattern)"
  - "getLeerlijnenMappingSync added to leerlijnen.ts — enables sync call sites without Promise chain"
  - "[Rule 1] prognosis.ts: getLeerlijnenMapping() called without await was a bug — replaced with getLeerlijnenMappingSync() to fix TS7053 type error and enable correct sync behavior"
metrics:
  duration: "540s"
  completed: "2026-05-18"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 3
---

# Phase 18 Plan 02: Wave 1 Utility Implementations Summary

**One-liner:** Three new LazyStore utility modules (deelgebieden, verzuimDrempels, bpv) + getLeerlijnenMappingSync + main.tsx pre-warm, turning all 20 Wave 0 RED utility tests GREEN.

## What Was Built

Wave 1 implements the foundation modules that Plan 18-03 (backend logic) and Plan 18-04 (Settings UI) depend on. All four utility modules follow the established LazyStore cache pattern from `utils/leerlijnen.ts`.

**File inventory:**

| File | Role | Lines | Key exports |
|------|------|-------|-------------|
| `utils/deelgebieden.ts` | NEW utility | 130 | DeelgebiedConfig, getDeelgebiedenConfig/Sync, saveDeelgebiedenConfig, resetDeelgebiedenConfig, getActiveDGIds, buildDefaultDeelgebiedenConfig |
| `utils/verzuimDrempels.ts` | NEW utility | 87 | VerzuimDrempels, DEFAULT_VERZUIM_DREMPELS, loadVerzuimDrempels, getVerzuimDrempelsSync, saveVerzuimDrempels |
| `utils/bpv.ts` | NEW utility | 148 | BpvConfig, BpvStudentRecord, BpvData, DEFAULT_BPV_CONFIG, getBpvConfig/Sync, saveBpvConfig, getBpvData, saveBpvData, berekenBpvPct, parseBpvExcel |
| `utils/leerlijnen.ts` | MODIFIED | +14 lines | getLeerlijnenMappingSync (new export) |
| `utils/prognosis.ts` | MODIFIED | 2 lines changed | getLeerlijnenMappingSync import (bug fix) |
| `src/main.tsx` | MODIFIED | +16 lines | Promise.all pre-warm for 5 async caches |

## Final Signatures (for 18-03 and 18-04 consumers)

### utils/deelgebieden.ts

```typescript
export interface DeelgebiedConfig { id: string; label: string; active: boolean }
export function buildDefaultDeelgebiedenConfig(): DeelgebiedConfig[]
export async function getDeelgebiedenConfig(): Promise<DeelgebiedConfig[]>
export function getDeelgebiedenConfigSync(): DeelgebiedConfig[]
export async function saveDeelgebiedenConfig(config: DeelgebiedConfig[]): Promise<boolean>
export async function resetDeelgebiedenConfig(): Promise<void>
export function getActiveDGIds(config: DeelgebiedConfig[]): string[]
// STORE_KEY = 'deelgebieden_config'
```

### utils/verzuimDrempels.ts

```typescript
export interface VerzuimDrempels { geoorloofd: number; ongeoorloofd: number }
export const DEFAULT_VERZUIM_DREMPELS: VerzuimDrempels = { geoorloofd: 900, ongeoorloofd: 600 }
export function getVerzuimDrempelsSync(): VerzuimDrempels
export async function loadVerzuimDrempels(): Promise<VerzuimDrempels>
export async function saveVerzuimDrempels(drempels: VerzuimDrempels): Promise<boolean>
// STORE_KEY = 'verzuim_drempels'
```

### utils/bpv.ts

```typescript
export interface BpvConfig { verwachteUren: number }
export interface BpvStudentRecord { gerealiseerdeUren: number }
export type BpvData = Record<string, BpvStudentRecord>
export const DEFAULT_BPV_CONFIG: BpvConfig = { verwachteUren: 200 }
export async function getBpvConfig(): Promise<BpvConfig>
export function getBpvConfigSync(): BpvConfig
export async function saveBpvConfig(c: BpvConfig): Promise<boolean>
export async function getBpvData(): Promise<BpvData>
export async function saveBpvData(d: BpvData): Promise<boolean>
export function berekenBpvPct(gerealiseerd: number, verwacht: number): number
export function parseBpvExcel(buffer: ArrayBuffer): BpvData  // D-13 STUB: returns {}
// CONFIG_KEY = 'bpv_config', DATA_KEY = 'bpv_data'
```

### utils/leerlijnen.ts (new export only)

```typescript
export function getLeerlijnenMappingSync(): Record<string, string>
// Returns _cachedMapping if non-null, otherwise buildDefault() (schema defaults)
```

## set + save Pair Confirmation

Every save function in this plan correctly pairs both await calls:

| Function | store.set | store.save |
|----------|-----------|------------|
| `saveDeelgebiedenConfig` | ✓ `await store.set(STORE_KEY, JSON.stringify(config))` | ✓ `await store.save()` |
| `saveVerzuimDrempels` | ✓ `await store.set(STORE_KEY, drempels)` | ✓ `await store.save()` |
| `saveBpvConfig` | ✓ `await store.set(CONFIG_KEY, c)` | ✓ `await store.save()` |
| `saveBpvData` | ✓ `await store.set(DATA_KEY, JSON.stringify(d))` | ✓ `await store.save()` |

## getLeerlijnenMappingSync Confirmation

- Exported from `utils/leerlijnen.ts` at line 105 (after `resetLeerlijnenMapping`)
- Signature: `export function getLeerlijnenMappingSync(): Record<string, string>`
- Body: `if (_cachedMapping !== null) return _cachedMapping; return buildDefault();`
- Never returns a Promise (confirmed by test 3)
- Pre-warmed via `getLeerlijnenMapping()` call in `main.tsx` Promise.all

## Test Counts

- Wave 0 utility tests (4 files): **20/20 GREEN**
  - tests/deelgebieden.test.ts: 5/5 ✓
  - tests/verzuimDrempels.test.ts: 4/4 ✓
  - tests/bpv.test.ts: 8/8 ✓
  - tests/leerlijnen.test.ts: 3/3 ✓
- Pre-existing tests: **77/77 pass** (unchanged)
- Still RED (18-03 scope): 4 tests in status.test.ts + prognosis.test.ts (berekenStatus thresholds + berekenPrognose activeDeelgebiedenIds filter)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed async getLeerlijnenMapping() called without await in utils/prognosis.ts**
- **Found during:** Task 3 verification (npm run typecheck-migrated)
- **Issue:** `prognosis.ts` line 59 called `getLeerlijnenMapping()` (returns `Promise<Record<string, string>>`) without `await`. TypeScript raised TS7053 because `mapping[dg.id]` cannot index a Promise. This was a pre-existing bug that became a type error once `tsconfig.migrated.json` covers `utils/prognosis.ts`.
- **Fix:** Changed import to `getLeerlijnenMappingSync` and updated the call site. This is the exact fix planned for 18-03, applied early because it blocked typecheck.
- **Files modified:** `utils/prognosis.ts` (2 lines)
- **Commit:** 719296b
- **Side effect:** 2 additional prognosis tests turned GREEN (tests not requiring `activeDeelgebiedenIds` filter — those remain RED for 18-03)

### Full Suite Status

The full test suite (`npm test -- --run`) shows 4 remaining failures in `status.test.ts` (berekenStatus thresholds) and `prognosis.test.ts` (berekenPrognose activeDeelgebiedenIds filter). These are **expected RED tests from Plan 18-01** that gate Plan 18-03. They are NOT regressions from this plan.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `parseBpvExcel` returns `{}` | `utils/bpv.ts` | D-13: no sample BPV Excel file available. Replace when mentor supplies file. Comment in code: `// D-13: BPV Excel parser stubbed — replace when user supplies sample BPV Excel file` |

## Self-Check: PASSED

- utils/deelgebieden.ts: EXISTS, contains `STORE_KEY = 'deelgebieden_config'`, contains `new LazyStore('store.json'`
- utils/verzuimDrempels.ts: EXISTS, contains `STORE_KEY = 'verzuim_drempels'`, contains `geoorloofd: 900`, contains `ongeoorloofd: 600`
- utils/bpv.ts: EXISTS, contains `CONFIG_KEY = 'bpv_config'`, contains `DATA_KEY = 'bpv_data'`, contains `verwachteUren: 200`
- utils/leerlijnen.ts: contains `export function getLeerlijnenMappingSync(`
- src/main.tsx: contains `getDeelgebiedenConfig`, `loadVerzuimDrempels`, `getBpvConfig`, `getBpvData`, `getLeerlijnenMapping`, `Promise.all`, `Phase 18`, `loadKlassen`, `loadSettings`
- Commits: e11ceb5 (deelgebieden + verzuimDrempels), fa39626 (bpv + leerlijnen sync), 719296b (main.tsx + prognosis fix)
- 20/20 Wave 0 utility tests GREEN
- typecheck-migrated: 0 errors
