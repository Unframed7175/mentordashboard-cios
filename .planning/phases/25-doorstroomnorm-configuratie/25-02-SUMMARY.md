---
phase: 25-doorstroomnorm-configuratie
plan: 02
subsystem: utils
tags: [persistence, prognosis, normen, refactor, lazystore, tdd]
dependency_graph:
  requires: [25-01]
  provides:
    - utils/normen.ts (LazyStore-backed Normen persistence + sync cache + validation)
    - utils/prognosis.ts (berekenPrognose with optional normen parameter; all 8 thresholds parametrised)
  affects:
    - src/main.tsx (Plan 03/04 will add loadNormen() to pre-warm Promise.all)
    - src/components/SettingsPage.tsx (Plan 03 will wire UI inputs to saveNormen)
tech_stack:
  added: []
  patterns:
    - LazyStore-backed persistence with sync cache (utils/verzuimDrempels.ts pattern)
    - Number.isFinite() + per-field range enforcement for store.json deserialization
    - instant-apply cache before async write (pitfall 5)
    - store.set() + store.save() paired await (Phase 12 VERPLICHT)
    - optional 4th function parameter with ?? fallback to sync cache
key_files:
  created:
    - utils/normen.ts
  modified:
    - utils/prognosis.ts
decisions:
  - "Full-object fallback strategy for validation: any single invalid field causes entire object to fall back to DEFAULT_NORMEN (simpler than per-field patching, consistent with plan spec)"
  - "console.warn for field-level read failures (matches verzuimDrempels.ts read-error posture); console.error for saveNormen failures (signals persistence loss — stronger signal)"
  - "VERSNELD_BJ1 constant removed entirely; replaced by comment noting Phase 25 parametrisation"
metrics:
  duration: "~8m"
  completed: "2026-05-21T16:38:00Z"
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 25 Plan 02: Implementation — normen.ts + prognosis.ts Refactor Summary

**One-liner:** LazyStore-backed Normen persistence module created + berekenPrognose parametrised via optional normen arg, turning all 12 Plan 01 RED tests GREEN with no regression.

## What Was Built

### Task 1: utils/normen.ts (NEW)

Created `utils/normen.ts` modelled byte-for-byte on `utils/verzuimDrempels.ts` with these adaptations:

| Aspect | verzuimDrempels.ts | normen.ts |
|--------|-------------------|-----------|
| STORE_KEY | `'verzuim_drempels'` | `'doorstroom_normen'` |
| Interface | `VerzuimDrempels` (2 fields) | `Normen` (8 fields) |
| Defaults | geoorloofd=900, ongeoorloofd=600 | sbl=13, sbc=15, negatiefTotaal=6, negatiefPerLeerlijn=2, bj1Positief=13, versneldLesgeven=4, versneldOrganiseren=3, versneldProfHandelen=5 |
| Validation | `typeof === 'number'` (2 fields) | `Number.isFinite()` + range enforcement (8 fields) |
| On invalid field | full fallback | field-level console.warn + full fallback |
| saveNormen catch | console.warn | console.error (T-25-07) |
| resetNormen | absent | added: saveNormen(DEFAULT_NORMEN) → return DEFAULT_NORMEN |

**Exports (5):** `Normen` (interface), `DEFAULT_NORMEN`, `getNormenSync`, `loadNormen`, `saveNormen`, `resetNormen`

**Validation strategy:** Number.isFinite() + per-field min/max range. On ANY field failing either check: logs `[normen.ts] invalid field 'FIELDNAME': value` then falls back to `{ ...DEFAULT_NORMEN }` for the entire object.

**Per-field ranges enforced:**
- sbl, sbc, negatiefTotaal, bj1Positief: min=1, max=19
- negatiefPerLeerlijn, versneldLesgeven, versneldOrganiseren, versneldProfHandelen: min=1, max=6

**Commit:** `9d44bc9`

### Task 2: utils/prognosis.ts (MODIFIED)

**All 8 hardcoded threshold sites replaced** (main conditionals AND gaps sub-object):

| Line (after refactor) | Was | Now |
|----------------------|-----|-----|
| isNegatief check | `totaalOnvoldoende > 6` | `totaalOnvoldoende > n.negatiefTotaal` |
| isNegatief per-leerlijn | `telling[ll].onvoldoende > 2` | `telling[ll].onvoldoende > n.negatiefPerLeerlijn` |
| BJ1 isVersneldSBC | `>= VERSNELD_BJ1.lesgeven/organiseren/prof_handelen` | `>= n.versneldLesgeven/Organiseren/ProfHandelen` |
| BJ1 isBJ2 | `>= 13` | `>= n.bj1Positief` |
| BJ1 gaps.nodigBJ2 | `Math.max(0, 13 - ...)` | `Math.max(0, n.bj1Positief - ...)` |
| BJ1 gaps.nodigVersneld_* | `VERSNELD_BJ1.*` | `n.versneld*` |
| BJ1 gaps.onvoldoendeRuimte | `6 - totaalOnvoldoende` | `n.negatiefTotaal - totaalOnvoldoende` |
| BJ1 gaps.onvoldoendeRuimtePerLeerlijn.* | `2 - telling[ll].onvoldoende` | `n.negatiefPerLeerlijn - telling[ll].onvoldoende` |
| BJ2 isSBC | `>= 15` | `>= n.sbc` |
| BJ2 isSBL | `>= 13` | `>= n.sbl` |
| BJ2 gaps.nodigSBL | `Math.max(0, 13 - ...)` | `Math.max(0, n.sbl - ...)` |
| BJ2 gaps.nodigSBC_deelgebieden | `Math.max(0, 15 - ...)` | `Math.max(0, n.sbc - ...)` |
| BJ2 gaps.onvoldoendeRuimte | `6 - totaalOnvoldoende` | `n.negatiefTotaal - totaalOnvoldoende` |
| BJ2 gaps.onvoldoendeRuimtePerLeerlijn.* | `2 - telling[ll].onvoldoende` | `n.negatiefPerLeerlijn - telling[ll].onvoldoende` |

**VERSNELD_BJ1 removed:** The module-level constant (`var VERSNELD_BJ1: Record<string, number> = {...}`) is fully removed. Replaced with a comment noting Phase 25 parametrisation.

**New import:** `import { getNormenSync, type Normen } from './normen';`

**New signature:** `berekenPrognose(student, traject?, activeDeelgebiedenIds?, normen?: Normen)`

**Fallback:** `const n = normen ?? getNormenSync();` — first statement in function body. When no normen arg is passed, getNormenSync() returns DEFAULT_NORMEN (cold cache case), preserving exact numerical equivalence to pre-refactor behavior.

**KERN_SBC not touched:** It is a fixed label list, not a configurable threshold (per RESEARCH.md).

**Commit:** `23aa374`

## Test Results

| Suite | Count | Status |
|-------|-------|--------|
| tests/normen.test.ts | 5/5 | GREEN |
| tests/prognosis.normen.test.ts | 7/7 | GREEN |
| tests/prognosis.test.ts | 9/9 | GREEN (no regression) |
| Full suite | 144/149 | 19/20 files passed, 1 skipped (unchanged from pre-Plan 02 baseline) |

**Total Plan 01 RED tests turned GREEN:** 12/12

## Deviations from Plan

None — plan executed exactly as written. The validation strategy (full-object fallback) was pre-specified in the plan action step 5 ("full fallback strategy — simpler than per-field patching"). All acceptance criteria verified.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The `doorstroom_normen` key in store.json was pre-identified in the plan threat model (T-25-03 through T-25-08). Mitigations implemented as designed:

- T-25-03/T-25-08: Number.isFinite() + range guard in loadNormen
- T-25-06: store.set() + store.save() pairing verified
- T-25-07: console.error in saveNormen catch block

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| utils/normen.ts exists | FOUND |
| utils/prognosis.ts exists | FOUND |
| 25-02-SUMMARY.md exists | FOUND |
| Commit 9d44bc9 exists | FOUND |
| Commit 23aa374 exists | FOUND |
| normen.ts: 5/5 unit tests GREEN | PASSED |
| prognosis.normen.test.ts: 7/7 tests GREEN | PASSED |
| prognosis.test.ts: all existing tests GREEN | PASSED |
| Full suite: 144 passed / 5 skipped | PASSED |
| VERSNELD_BJ1 removed from prognosis.ts | CONFIRMED (grep count = 0) |
| Number.isFinite count >= 8 in normen.ts | CONFIRMED (count = 11) |
| console.error saveNormen failed | CONFIRMED (count = 1) |
| invalid field logging | CONFIRMED (count = 8, one per field) |
