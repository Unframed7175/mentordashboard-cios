---
phase: 18-settings-panel-advanced
verified: 2026-05-18T21:43:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open SettingsPage section 3 and rename a deelgebied, change its leerlijn dropdown, and toggle Actief off; reload the app and confirm all changes are persisted"
    expected: "Renamed deelgebied, reassigned leerlijn, and inactive status survive app restart"
    why_human: "Plugin-store persistence requires a running Tauri app; cannot verify disk persistence programmatically in CI"
  - test: "Open SettingsPage section 4, change Geoorloofd threshold to 5 hours and Ongeoorloofd to 2 hours; navigate to a student with 3u ongeoorloofd verzuim and verify their status tile shows oranje/Verzuim"
    expected: "Student with 3u ongeoorloofd (>2u threshold) now shows Verzuim status; previously they did not"
    why_human: "Requires live Tauri app with real data; end-to-end threshold→status flow spans plugin-store persistence + sync cache + berekenStatus"
  - test: "Toggle a deelgebied inactive in SettingsPage section 3 and navigate to KlasOverzicht / DetailWeergave; verify the deelgebied is absent from the DeelgebiedenMatrix and SpiderChartCard"
    expected: "Inactive deelgebied is hidden in both matrix and spider; re-activating it restores it; scores for that deelgebied remain in store"
    why_human: "Visual rendering and store-read consistency require a running Tauri app"
  - test: "Click 'BPV-uren importeren' in SettingsPage section 4 and attempt to import a non-Excel file"
    expected: "Error message 'Onbekend BPV-bestandsformaat. Probeer een ander bestand.' is displayed"
    why_human: "File import error path requires runtime file system access; parseBpvExcel D-13 stub never throws in tests"
---

# Phase 18: Settings Panel Advanced — Verification Report

**Phase Goal:** Mentor kan deelgebieden hernoemen/deactiveren, leerlijn-toewijzing aanpassen, verzuim-drempelwaarden en BPV-uren configureren
**Verified:** 2026-05-18T21:43:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Requirements Coverage

All four phase requirements confirmed in REQUIREMENTS.md:

| REQ-ID | Description | Status |
|--------|-------------|--------|
| SET-03 | Mentor kan deelgebieden hernoemen of individueel inactief zetten | SATISFIED — `utils/deelgebieden.ts` + `SettingsPage.tsx` section 3 + `DeelgebiedenMatrix.tsx` + `SpiderChartCard.tsx` filtering |
| SET-04 | Mentor kan leerlijn-toewijzing aanpassen | SATISFIED — Leerlijn dropdown in SettingsPage section 3; `DeelgebiedenMatrix.tsx` uses `mapping[dg.id] \|\| dg.group` |
| SET-05 | Mentor kan aparte drempelwaarden instellen voor verzuim-signalering | SATISFIED — `utils/verzuimDrempels.ts` + `berekenStatus` dual-threshold + `VerzuimSection.tsx` runtime read |
| SET-06 | Mentor kan verwachte BPV-uren configureren | SATISFIED — `utils/bpv.ts` + `SettingsPage.tsx` section 4 + `BpvProgressSection.tsx` |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Failing tests exist for each new utility module before implementation (Wave 0 RED scaffold) | VERIFIED | `tests/deelgebieden.test.ts` (5 it), `tests/verzuimDrempels.test.ts` (4 it), `tests/bpv.test.ts` (8 it), `tests/leerlijnen.test.ts` (3 it) all present |
| 2 | All 23 Wave 0 RED tests turn GREEN after Wave 1 implementation | VERIFIED | Full suite: 89/89 pass (5 pre-existing skips). All utility test files pass |
| 3 | utils/deelgebieden.ts exposes the locked contract (getDeelgebiedenConfig, getDeelgebiedenConfigSync, saveDeelgebiedenConfig, resetDeelgebiedenConfig, getActiveDGIds) | VERIFIED | File exists, 130 lines, all exports confirmed by direct read; `STORE_KEY = 'deelgebieden_config'` present; `store.set + store.save` both awaited |
| 4 | utils/verzuimDrempels.ts exposes loadVerzuimDrempels, getVerzuimDrempelsSync, saveVerzuimDrempels with DEFAULT {geoorloofd:900, ongeoorloofd:600} | VERIFIED | File exists, 84 lines, all exports confirmed; DEFAULT values confirmed at source; `store.set + store.save` paired |
| 5 | utils/bpv.ts exposes full BPV contract; parseBpvExcel is the D-13 stub returning {} | VERIFIED | File exists, 162 lines; all exports confirmed; `D-13` comment present; stub returns `{}` |
| 6 | getLeerlijnenMappingSync exists in utils/leerlijnen.ts and returns a Record (never a Promise) | VERIFIED | Function at line 111; body `if (_cachedMapping !== null) return _cachedMapping; return buildDefault();` |
| 7 | src/main.tsx pre-warms all four async caches before ReactDOM.createRoot() | VERIFIED | `Promise.all([getDeelgebiedenConfig(), loadVerzuimDrempels(), getBpvConfig(), getBpvData(), getLeerlijnenMapping()])` present with `Phase 18` comment; placed before `ReactDOM.createRoot()` |
| 8 | berekenPrognose accepts optional activeDeelgebiedenIds parameter and filters all three norms | VERIFIED | Signature `berekenPrognose(student, traject?, activeDeelgebiedenIds?)` confirmed; `telLeerlijnen` accepts the parameter and applies `DEELGEBIEDEN.filter(dg => activeDeelgebiedenIds.includes(dg.id))`; getLeerlijnenMappingSync is the only mapping accessor |
| 9 | berekenStatus accepts optional thresholds parameter; when omitted reads getVerzuimDrempelsSync(); fires on EITHER ongeoorloofd OR geoorloofd exceeding threshold | VERIFIED | `thresholds?: { geoorloofd: number; ongeoorloofd: number }` in signature; `resolvedThresholds = thresholds ?? getVerzuimDrempelsSync()`; dual `\|\|` condition; `VERZUIM_DREMPEL_MIN` constant absent |
| 10 | VerzuimSection.tsx reads runtime ongeoorloofd threshold (no hardcoded > 600) | VERIFIED | `getVerzuimDrempelsSync().ongeoorloofd` at line 44; `> 600` literal absent from file |
| 11 | SettingsPage section 3 is a working 19-row deelgebieden table (not a placeholder) with Naam, Leerlijn, Actief columns; Herstel standaard with inline confirmation | VERIFIED | Full JSX verified: `dg-settings-table-wrap`, `dg-settings-table`, `dg-naam-input`, `dg-leerlijn-select`, `dg-toggle` present; all Dutch copy strings confirmed; `Komt in een volgende versie` absent; `confirmingReset` state present |
| 12 | SettingsPage section 4 has threshold inputs (hours×60 storage) + BPV expected uren + import button; BpvProgressSection mounted between VerzuimSection and VakkenSection | VERIFIED | Section 4 JSX confirmed with `settings-threshold-group`, `settings-number-input`, `* 60` conversion appears twice; `BpvProgressSection` imported and mounted at line 168, after line 165 (`VerzuimSection`) and before line 171 (`VakkenSection`) |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `utils/deelgebieden.ts` | LazyStore persistence for deelgebieden config | VERIFIED | 130 lines; all exports present; STORE_KEY, store.set+save pattern |
| `utils/verzuimDrempels.ts` | LazyStore persistence for verzuim drempels | VERIFIED | 84 lines; STORE_KEY='verzuim_drempels'; defaults 900/600 |
| `utils/bpv.ts` | LazyStore for bpv_config + bpv_data + berekenBpvPct + parseBpvExcel stub | VERIFIED | 162 lines; CONFIG_KEY + DATA_KEY; D-13 stub comment |
| `utils/leerlijnen.ts` | getLeerlijnenMappingSync export added | VERIFIED | Export at line 111 |
| `src/main.tsx` | Promise.all pre-warm for all four caches | VERIFIED | All five functions in Promise.all; Phase 18 comment |
| `utils/prognosis.ts` | activeDeelgebiedenIds filtering; getLeerlijnenMappingSync sync fix | VERIFIED | Signature changed; filter applied in telLeerlijnen; sync import only |
| `src/utils/status.ts` | berekenStatus with optional thresholds + dual check | VERIFIED | Signature + resolvedThresholds + dual OR condition |
| `src/components/VerzuimSection.tsx` | Runtime ongeoorloofd threshold, no hardcoded > 600 | VERIFIED | `getVerzuimDrempelsSync().ongeoorloofd` at line 44 |
| `src/components/SettingsPage.tsx` | Section 3 (deelgebieden table) + Section 4 (thresholds + BPV) | VERIFIED | Both sections implemented; all required strings present |
| `src/components/BpvProgressSection.tsx` | New component: empty state + progress bar + stats | VERIFIED | File exists; empty state, bpv-bar-track, bpv-bar-fill, #22C55E overshoot |
| `src/components/DeelgebiedenMatrix.tsx` | Active filter + runtime leerlijn-mapping; score-key invariant | VERIFIED | getDeelgebiedenConfigSync, getLeerlijnenMappingSync, activeIds, `mapping[dg.id] \|\| dg.group` |
| `src/components/SpiderChartCard.tsx` | Active filter; axis.key = schema dg.label (Pitfall 3) | VERIFIED | getDeelgebiedenConfigSync, activeIds, `key: dg.label` literal confirmed |
| `src/components/DetailWeergave.tsx` | BpvProgressSection between VerzuimSection and VakkenSection | VERIFIED | Import at line 9; mount at line 168 between lines 165 and 171 |
| `src/index.css` | CSS section 25 with dg-* classes (18-04) + threshold/BPV classes (18-05) | VERIFIED | Section 25 header at line 1078; dg-settings-table-wrap, settings-threshold-group, bpv-bar-fill all present; exactly 1 section 25 header |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `utils/deelgebieden.ts` | `@tauri-apps/plugin-store` | `new LazyStore('store.json', ...)` | WIRED | Direct read confirmed |
| `src/main.tsx` | `utils/deelgebieden, verzuimDrempels, bpv, leerlijnen` | `Promise.all([getDeelgebiedenConfig(), loadVerzuimDrempels(), getBpvConfig(), getBpvData(), getLeerlijnenMapping()])` | WIRED | Confirmed in file |
| `utils/prognosis.ts` | `utils/leerlijnen.ts` | `import { getLeerlijnenMappingSync } from './leerlijnen'` | WIRED | Confirmed; no async getLeerlijnenMapping() call in prognosis.ts |
| `src/utils/status.ts` | `utils/verzuimDrempels.ts` | `import { getVerzuimDrempelsSync } from '../../utils/verzuimDrempels'` | WIRED | Confirmed at line 9 |
| `src/components/VerzuimSection.tsx` | `utils/verzuimDrempels.ts` | `import { getVerzuimDrempelsSync }` | WIRED | Confirmed at line 2 |
| `src/components/SettingsPage.tsx` | `utils/deelgebieden.ts` | `import { getDeelgebiedenConfig, saveDeelgebiedenConfig, resetDeelgebiedenConfig }` | WIRED | Confirmed at lines 11-16 |
| `src/components/SettingsPage.tsx` | `utils/leerlijnen.ts` | `import { getLeerlijnenMapping, saveLeerlijnenMapping, resetLeerlijnenMapping }` | WIRED | Confirmed at lines 17-21 |
| `src/components/SettingsPage.tsx` | `utils/bpv.ts` | `import { getBpvConfig, saveBpvConfig, parseBpvExcel, saveBpvData, getBpvData }` | WIRED | Confirmed at line 23 |
| `src/components/SettingsPage.tsx` | `utils/verzuimDrempels.ts` | `import { loadVerzuimDrempels, saveVerzuimDrempels }` | WIRED | Confirmed at line 22 |
| `src/components/DeelgebiedenMatrix.tsx` | `utils/deelgebieden.ts` | `getDeelgebiedenConfigSync() + getLeerlijnenMappingSync()` | WIRED | Both imports confirmed; called in render body |
| `src/components/SpiderChartCard.tsx` | `utils/deelgebieden.ts` | `getDeelgebiedenConfigSync()` filter | WIRED | Confirmed at lines 4, 17-18 |
| `src/components/DetailWeergave.tsx` | `src/components/BpvProgressSection.tsx` | `<BpvProgressSection leerlingId={leerlingId} />` | WIRED | Import at line 9; mount at line 168 |
| `src/components/BpvProgressSection.tsx` | `utils/bpv.ts` | `getBpvConfig() + getBpvData() + berekenBpvPct()` | WIRED | Confirmed at lines 7-11; used in useEffect and render |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `SettingsPage.tsx` section 3 | `dgConfig` | `getDeelgebiedenConfig()` in useEffect | LazyStore read with schema fallback — real data flows | FLOWING |
| `SettingsPage.tsx` section 4 | `geoorloofdHours`, `ongeoorloofdHours`, `bpvUren` | `loadVerzuimDrempels()`, `getBpvConfig()` in useEffect | LazyStore read with defaults — real data flows | FLOWING |
| `BpvProgressSection.tsx` | `bpvConfig`, `record` | `getBpvConfig()` + `getBpvData()` in useEffect | LazyStore read; `record` will be null until user imports BPV Excel (D-13 stub) — empty state is intentional | FLOWING (empty state intentional) |
| `DeelgebiedenMatrix.tsx` | `dgConfig`, `mapping` | `getDeelgebiedenConfigSync()`, `getLeerlijnenMappingSync()` | Sync cache accessors backed by pre-warmed LazyStore | FLOWING |
| `SpiderChartCard.tsx` | `axes` | `getDeelgebiedenConfigSync()` | Sync cache accessor; `key: dg.label` preserves score-key invariant | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite (all 89 tests) pass | `npm test -- --run` | 89 passed, 5 skipped, 0 failed | PASS |
| berekenStatus dual-threshold check | Covered by tests/status.test.ts "berekenStatus thresholds (Phase 18)" 4/4 | Tests pass | PASS |
| berekenPrognose activeDeelgebiedenIds filter | Covered by tests/prognosis.test.ts "berekenPrognose activeDeelgebiedenIds filter (Phase 18)" 4/4 | Tests pass | PASS |
| BPV utility functions (berekenBpvPct, parseBpvExcel stub) | Covered by tests/bpv.test.ts 8/8 | Tests pass | PASS |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/utils/status.ts` | 103 | JSDoc comment still says `ongeoorloofd > 600 min` (old hardcoded value) | INFO | Comment is stale — does not affect behavior. Dual threshold correctly implemented in code at line 124 |
| `tests/prognosis.test.ts` | runtime | Vitest warning: `vi.mock` / `vi.unmock` nested inside `it()` body is hoisted | WARNING | Vitest emits a deprecation warning but tests still pass; will become an error in a future Vitest version |

No unreferenced TBD/FIXME/XXX markers found. The `D-13` stub in `utils/bpv.ts` (`parseBpvExcel`) is the intentional documented stub per plan specification — it contains the required comment and does not block the phase goal.

### Human Verification Required

#### 1. Deelgebied Persistence Across Restart

**Test:** Open SettingsPage, rename "V&A" to "Veilig & Actief", change its leerlijn to "Organiseren", and toggle it inactive. Close and restart the app.
**Expected:** All three changes (renamed label, leerlijn reassignment, inactive state) are restored from plugin-store on restart. KlasOverzicht and DetailWeergave show the deelgebied as inactive.
**Why human:** Plugin-store write/read persistence (`store.set + store.save` and subsequent `store.get`) requires a running Tauri desktop process; cannot simulate from a test harness.

#### 2. Runtime Threshold → VerzuimStatus End-to-End

**Test:** Open SettingsPage section 4. Change "Ongeoorloofd verzuim waarschuwing" from 10 to 2 hours. Navigate to a student who has 3 hours ongeoorloofd verzuim (previously not flagged).
**Expected:** The student's RAG tile and detail view now show oranje/Verzuim status. Changing the threshold back to 10 hours restores green/blue status for that student.
**Why human:** Requires live app with real imported data; the round-trip touches saveVerzuimDrempels (plugin-store) → getVerzuimDrempelsSync() (sync cache read at render) → berekenStatus (threshold compare) → tile color — E2E cannot be unit-tested.

#### 3. Active Filter Visible in Matrix and Spider

**Test:** Toggle one deelgebied inactive in SettingsPage section 3. Open a student's DetailWeergave and inspect the DeelgebiedenMatrix and SpiderChartCard.
**Expected:** The inactive deelgebied column/axis is absent from both visualizations. Re-activating it causes it to reappear. Student scores for that deelgebied remain in the data (no deletion).
**Why human:** Visual rendering and sync-cache read-at-render-time require a live Tauri UI.

#### 4. BPV Import Error Copy

**Test:** Click "BPV-uren importeren" and select a text file (.txt) instead of an Excel.
**Expected:** The error message "Onbekend BPV-bestandsformaat. Probeer een ander bestand." appears below the button.
**Why human:** File import requires a running Tauri app; `parseBpvExcel` D-13 stub never throws in current state, so this tests the exception path which only fires with a real malformed file or when the real parser is wired.

### Gaps Summary

No gaps found. All 12 must-have truths are verified with code-level evidence. The `parseBpvExcel` D-13 stub is an explicitly documented design decision (not a gap) and does not block the phase goal.

The Vitest deprecation warning (`vi.mock` inside `it()` in `tests/prognosis.test.ts`) is a pre-existing pattern introduced in Plan 18-01 and carried through. Tests pass today; this should be refactored before the next Vitest major version upgrade.

---

_Verified: 2026-05-18T21:43:00Z_
_Verifier: Claude (gsd-verifier)_
