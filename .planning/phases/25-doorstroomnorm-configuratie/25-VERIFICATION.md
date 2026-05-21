---
phase: 25-doorstroomnorm-configuratie
verified: 2026-05-21T19:50:00Z
status: human_needed
score: 11/11 must-haves verified
overrides_applied: 0
gaps: []
human_verification:
  - test: "End-to-end persistence round-trip (NORM-06)"
    expected: "Edit SBL=10, SBC=12 in Settings Section 5, close app entirely, reopen, open Settings — values still show 10 and 12"
    why_human: "Requires running Tauri app with real plugin-store; cannot verify store.json persistence in CI without a Tauri runtime"
  - test: "KlasOverzicht RAG colour recomputes after threshold change (NORM-01..05)"
    expected: "Change SBL from 13 to 8 in Settings, return to KlasOverzicht — student tiles that previously showed 'neutraal' now show 'sbl'; colours change without app restart"
    why_human: "Requires running app with real student data; cannot automate the visual RAG colour change verification"
  - test: "Herstel standaard restores and recomputes (NORM-07)"
    expected: "After changing thresholds, click 'Herstel standaard' → confirm → all 8 inputs revert to 13/15/6/2/13/4/3/5 and KlasOverzicht updates"
    why_human: "Requires interactive Tauri UI; reset persistence path needs real LazyStore"
  - test: "DoortstroomPrognoseSection explanatory text reflects configured norms"
    expected: "After setting SBL=10 in Settings, open student detail view — explanatory text shows 'norm >=10' instead of 'norm >=13'"
    why_human: "Requires running app with student data and navigating to detail view"
---

# Phase 25: Doorstroomnorm Configuratie Verification Report

**Phase Goal:** Mentors can configure the 7 doorstroomnorm thresholds (sbl, sbc, negatiefTotaal, negatiefPerLeerlijn, bj1Positief, versneldLesgeven/organiseren/profHandelen) via Settings, values persist across restarts, and the prognosis engine + UI immediately reflect the custom norms.
**Verified:** 2026-05-21T19:50:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | utils/normen.ts exists with LazyStore-backed Normen persistence (load, save, reset, sync accessor) | VERIFIED | File at `utils/normen.ts` exports `loadNormen`, `saveNormen`, `resetNormen`, `getNormenSync`, `DEFAULT_NORMEN`, `Normen`; uses `LazyStore('store.json', ...)` with STORE_KEY `'doorstroom_normen'` |
| 2 | loadNormen() uses Number.isFinite() + per-field range enforcement | VERIFIED | 11 occurrences of `Number.isFinite` in normen.ts; per-field ranges (sbl 1–19, negatiefPerLeerlijn 1–6, etc.) enforced line 68–107 |
| 3 | saveNormen() logs console.error when store write fails | VERIFIED | Line 133: `console.error('[normen.ts] saveNormen failed — settings not persisted')` |
| 4 | berekenPrognose() accepts optional 4th normen parameter and falls back to getNormenSync() | VERIFIED | Signature at line 106: `berekenPrognose(student, traject?, activeDeelgebiedenIds?, normen?: Normen)`; line 107: `const n = normen ?? getNormenSync();` |
| 5 | All 8 hardcoded threshold constants in utils/prognosis.ts replaced with normen.* reads in main conditionals AND gaps object | VERIFIED | 22 occurrences of `n.sbl/n.sbc/n.negatiefTotaal/n.negatiefPerLeerlijn/n.bj1Positief/n.versneldLesgeven/n.versneldOrganiseren/n.versneldProfHandelen`; VERSNELD_BJ1 grep count = 0 |
| 6 | All 12 RED tests from Plan 01 pass GREEN | VERIFIED | `npx vitest run tests/normen.test.ts tests/prognosis.normen.test.ts` — 12/12 PASS |
| 7 | main.tsx pre-warms loadNormen() inside the existing Promise.all block before React mounts | VERIFIED | Line 51 of main.tsx: `loadNormen(), // Phase 25 — pre-warm doorstroom normen sync cache` inside Promise.all |
| 8 | App.tsx exposes handleNormenChanged which calls setRefreshKey(k => k + 1) and passes it to SettingsPage | VERIFIED | Lines 67–69 of App.tsx: `function handleNormenChanged() { setRefreshKey(k => k + 1); }`; line 156: `onNormenChanged={handleNormenChanged}` |
| 9 | SettingsPage renders Section 5 'Doorstroomdrempels' with 8 number inputs, SBC<SBL warning, two-step reset, persistence-failure logging | VERIFIED | 22 matching patterns in SettingsPage.tsx including `Doorstroomdrempels` (h2), `BJ2-drempels`, `BJ1-drempels`, `handleNormenBlur` (1 declaration + 8 `onBlur` call sites), `sbcWaarschuwing`, `confirmingResetNormen`, `console.error('[SettingsPage] saveNormen returned false...')`, `Alles terugzetten naar CIOS-standaard?`; 8 `htmlFor="norm-*"` labels |
| 10 | DoortstroomPrognoseSection.tsx reads current normen via getNormenSync() for all explanatory label strings | VERIFIED | 4 calls to `getNormenSync()` (one per helper: computeAlgemeneItems, computeSBLItems, computeSBCItems, computeBJ1Items); 8 `n.*` usages; grep for `≥13|≥15|max\. 6|max\. 2` returns 0 lines |
| 11 | tests/SettingsPage.test.tsx extended with Section 5 coverage; all existing tests still pass | VERIFIED | `describe('Section 5: Doorstroomdrempels', ...)` block with 6 tests (S5-01..S5-06); 32/32 tests pass in the file |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `utils/normen.ts` | LazyStore-backed Normen persistence + sync cache + DEFAULT_NORMEN + Number.isFinite validation | VERIFIED | File exists, substantive (149 lines), all exports present, STORE_KEY = 'doorstroom_normen', 11x Number.isFinite, store.set()+store.save() pairing, instant-apply cache before await |
| `utils/prognosis.ts` | berekenPrognose with optional normen parameter; VERSNELD_BJ1 removed | VERIFIED | Import from './normen' present; 4-param signature; `const n = normen ?? getNormenSync()`; VERSNELD_BJ1 count = 0; 22 n.* usages |
| `src/main.tsx` | loadNormen() added to Promise.all pre-warm | VERIFIED | Import at line 11; call at line 51 in Promise.all |
| `src/App.tsx` | handleNormenChanged + onNormenChanged prop on SettingsPage | VERIFIED | Function at line 67–69; prop at line 156 |
| `src/components/SettingsPage.tsx` | Section 5 with 8 inputs + reset + SBC<SBL warning + onNormenChanged callback + persistence-failure logging | VERIFIED | All elements present and wired |
| `src/index.css` | .settings-sub-heading + .norm-warning CSS rules | VERIFIED | Lines 1403 and 1410 |
| `tests/SettingsPage.test.tsx` | Section 5 automated coverage: render, blur-save, Enter-blur, warning, reset flow, callback | VERIFIED | 6 new tests S5-01..S5-06; 32/32 pass |
| `tests/normen.test.ts` | 5 unit tests for utils/normen.ts | VERIFIED | File exists; 5 tests; all GREEN |
| `tests/prognosis.normen.test.ts` | 7 integration tests for berekenPrognose normen parameter | VERIFIED | File exists; 7 tests; all GREEN |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `utils/prognosis.ts` | `utils/normen.ts` | `import { getNormenSync, type Normen } from './normen'` | WIRED | Line 17 of prognosis.ts confirms import |
| `utils/normen.ts` | `@tauri-apps/plugin-store` | `new LazyStore('store.json', { defaults: {}, autoSave: false })` | WIRED | Line 14 of normen.ts |
| `utils/normen.ts` | `store.save()` | `store.set(STORE_KEY, normen)` + `store.save()` pairing | WIRED | Lines 129–130 of normen.ts confirm both awaited |
| `src/main.tsx` | `utils/normen.ts loadNormen` | `Promise.all([..., loadNormen()])` | WIRED | Line 51 confirms call inside Promise.all |
| `src/App.tsx handleNormenChanged` | `setRefreshKey` | `setRefreshKey(k => k + 1)` | WIRED | Line 68 of App.tsx |
| `src/App.tsx <SettingsPage>` | `SettingsPage onNormenChanged prop` | `onNormenChanged={handleNormenChanged}` | WIRED | Line 156 of App.tsx |
| `SettingsPage blur handler` | `utils/normen.ts saveNormen` | `const ok = await saveNormen(updated); if (!ok) { console.error(...) }` | WIRED | Lines 215–216 of SettingsPage.tsx |
| `src/components/DoortstroomPrognoseSection.tsx` | `utils/normen.ts getNormenSync` | `import { getNormenSync } from '../utils/normen'; const n = getNormenSync();` | WIRED | Line 3 import; 4 call sites |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `utils/normen.ts` | `_cache` (Normen) | `store.get('doorstroom_normen')` via LazyStore → Tauri plugin-store → store.json | Real store read with full validation guard | FLOWING |
| `utils/prognosis.ts berekenPrognose` | `n` (Normen) | `normen ?? getNormenSync()` → `_cache ?? DEFAULT_NORMEN` | Real normen from cache or defaults | FLOWING |
| `src/components/SettingsPage.tsx` | `normen` state | `useEffect(() => { loadNormen().then(setNormen) }, [])` | Real async load from store | FLOWING |
| `src/components/DoortstroomPrognoseSection.tsx` | `n` (in each helper) | `getNormenSync()` → `_cache ?? DEFAULT_NORMEN` (cache pre-warmed by main.tsx) | Real normen from pre-warmed cache | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| normen unit tests pass | `npx vitest run tests/normen.test.ts` | 5/5 PASS | PASS |
| prognosis normen integration tests pass | `npx vitest run tests/prognosis.normen.test.ts` | 7/7 PASS | PASS |
| SettingsPage Section 5 tests pass | `npx vitest run tests/SettingsPage.test.tsx` | 32/32 PASS | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| NORM-01 | 25-01, 25-02, 25-03, 25-04 | Mentor kan SBL-drempel aanpassen in instellingen | SATISFIED | SettingsPage Section 5 sbl input; prognosis.ts uses `n.sbl`; DoortstroomPrognoseSection uses `n.sbl`; Test A in prognosis.normen.test.ts verifies label changes with custom sbl |
| NORM-02 | 25-01, 25-02, 25-03, 25-04 | Mentor kan SBC-drempel aanpassen in instellingen | SATISFIED | SettingsPage Section 5 sbc input; prognosis.ts uses `n.sbc`; DoortstroomPrognoseSection uses `n.sbc`; Test B verifies label changes with custom sbc |
| NORM-03 | 25-01, 25-02, 25-03 | Mentor kan negatief-drempel (totaal) aanpassen | SATISFIED | SettingsPage negatiefTotaal input; prognosis.ts uses `n.negatiefTotaal` in both conditional and gaps; Test C verifies isNegatief=false with custom negatiefTotaal |
| NORM-04 | 25-01, 25-02, 25-03 | Mentor kan per-leerlijn negatief-drempel aanpassen | SATISFIED | SettingsPage negatiefPerLeerlijn input; prognosis.ts uses `n.negatiefPerLeerlijn`; Test D verifies isNegatief=false with custom negatiefPerLeerlijn |
| NORM-05 | 25-01, 25-02, 25-03, 25-04 | Mentor kan BJ1 versneld-SBC drempels aanpassen | SATISFIED | SettingsPage bj1Positief + versneldLesgeven/Organiseren/ProfHandelen inputs; prognosis.ts uses `n.versneld*` and `n.bj1Positief`; Tests E and F verify correct label assignment |
| NORM-06 | 25-01, 25-02, 25-03 | Ingestelde drempels worden opgeslagen en bewaard tussen sessies | SATISFIED (needs human for full round-trip) | store.set() + store.save() pairing verified in normen.ts; saveNormen round-trip Test 2 passes in unit tests; loadNormen on cold cache returns saved values; requires Tauri runtime for actual restart test |
| NORM-07 | 25-01, 25-02, 25-03 | "Herstel standaard" knop zet drempels terug | SATISFIED (needs human for UI confirmation) | resetNormen() function in normen.ts; SettingsPage two-step confirm flow; Test S5-05 verifies resetNormen called after confirm; requires Tauri runtime to confirm actual reset persistence |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `utils/prognosis.ts` | 261, 267, 268 | Hardcoded `>= 13` and `>= 15` in `debugPrognose()` console output strings | INFO | Debug utility only — not user-visible output, not in production path. `debugPrognose` is a developer console helper, not called from UI or prognosis engine. Shows stale thresholds in console debug output only. No user impact. |
| `utils/prognosis.ts` | 286 | Hardcoded `> 2` in `debugPrognose()` table output emoji | INFO | Same as above — debug helper only |

No TBD/FIXME/XXX markers found in any phase-modified file.

### Human Verification Required

#### 1. Persistence Round-Trip (NORM-06)

**Test:** Run `npm run dev` in Tauri. Open Settings → Section 5. Set SBL=10, SBC=12. Close the Tauri app entirely. Reopen. Open Settings → Section 5.
**Expected:** SBL shows 10, SBC shows 12 (values survived app restart).
**Why human:** Requires a live Tauri runtime with real plugin-store IPC. The unit test mocks LazyStore with a Map — actual persistence to store.json on disk can only be verified with the real Tauri environment.

#### 2. KlasOverzicht RAG Colour Recompute (NORM-01..05)

**Test:** With at least one class containing students, open Settings → Section 5. Note current tile colours. Change SBL from 13 to 8. Navigate back to KlasOverzicht without restarting.
**Expected:** Student tile colours update immediately — students previously showing 'neutraal' (10–12 voldoende) now show 'sbl' green colour. No app restart required.
**Why human:** Requires visual inspection of RAG colour changes with real student data. The refreshKey mechanism is wired and verified structurally (handleNormenChanged → setRefreshKey), but the actual colour change requires a running app with data.

#### 3. Herstel Standaard Restores and Recomputes (NORM-07)

**Test:** After changing thresholds (e.g., SBL=8), click "Herstel standaard". A confirm row with "Alles terugzetten naar CIOS-standaard?" appears. Click "Ja, herstel". Confirm all 8 inputs revert to 13/15/6/2/13/4/3/5. Navigate to KlasOverzicht.
**Expected:** Inputs show defaults; KlasOverzicht RAG colours reflect default thresholds.
**Why human:** Interactive two-step UI flow requiring real app; also confirms onNormenChanged callback fires post-reset causing KlasOverzicht recompute.

#### 4. DoortstroomPrognoseSection Text Reflects Configured Norms

**Test:** Set SBL=10 in Settings (blur). Open a student's detail view (any BJ2 student). Find the "Doorstroomprognose" section.
**Expected:** The explanatory label reads "norm >=10" (or equivalent with configured value) instead of the old hardcoded "norm >=13".
**Why human:** Requires running app with real student data and navigating to detail view; visual string verification.

### Gaps Summary

No automated gaps found. All 11 must-haves are verified in the codebase. Four human verification items remain for persistence, visual RAG recompute, and reset flow — these cannot be confirmed without a running Tauri runtime.

**Note on debugPrognose stale values:** Lines 261, 267, 268, 286 in `utils/prognosis.ts` contain hardcoded values in a developer debug utility function (`debugPrognose`). These are INFO-only — not user-facing, not in the prognosis engine, not affecting NORM requirements. They represent a minor developer-experience gap (console debug output won't reflect custom norms) but do not block the phase goal. If desired, this can be addressed as a follow-up without replanning this phase.

---

_Verified: 2026-05-21T19:50:00Z_
_Verifier: Claude (gsd-verifier)_
