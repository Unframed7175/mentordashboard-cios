---
phase: 25-doorstroomnorm-configuratie
plan: 04
subsystem: components
tags: [ui, prognosis, react, parameterization, normen]
dependency_graph:
  requires: [25-02, 25-03]
  provides:
    - src/components/DoortstroomPrognoseSection.tsx (all threshold strings read from getNormenSync())
  affects:
    - Student detail view explanatory text (reflects live configured normen)
tech_stack:
  added: []
  patterns:
    - getNormenSync() sync cache read in render helper functions (pre-warmed cache pattern)
    - No async logic in render path — O(1) cache read
key_files:
  created: []
  modified:
    - src/components/DoortstroomPrognoseSection.tsx
decisions:
  - "getNormenSync() called once per helper function (4 calls total) rather than at component level — preserves locality of reference and makes each helper self-contained"
  - "computeSBCItems label changed from plain string to template literal to interpolate n.sbc (minor type-narrowing: 'ok' type annotation still explicit)"
metrics:
  duration: "~5m"
  completed: "2026-05-21T16:43:00Z"
  tasks_completed: 1
  files_created: 0
  files_modified: 1
---

# Phase 25 Plan 04: DoortstroomPrognoseSection Parameterization Summary

**One-liner:** All 8 hardcoded threshold string sites in DoortstroomPrognoseSection.tsx replaced with getNormenSync() reads — student detail view now reflects live configured normen end-to-end.

## What Was Built

### Task 1: Parameterize DoortstroomPrognoseSection.tsx norm text using getNormenSync()

**File modified:** `src/components/DoortstroomPrognoseSection.tsx`

**Import added:**
```typescript
import { getNormenSync } from '../utils/normen';
```

**4 helper functions each received `const n = getNormenSync();` at their top:**
1. `computeAlgemeneItems(p)` — handles negatief advies + onvoldoende ruimte per leerlijn
2. `computeSBLItems(p)` — handles SBL norm display for BJ2 students
3. `computeSBCItems(p)` — handles SBC norm display for BJ2 students
4. `computeBJ1Items(p)` — handles BJ1 doorstroom + versneld SBC display

### 8 Hardcoded Sites Replaced (Before → After)

| Location | Function | Before | After |
|----------|----------|--------|-------|
| Line 27 (negatiefTotaal) | computeAlgemeneItems | `max. 6 totaal, max. 2 per leerlijn` | `max. ${n.negatiefTotaal} totaal, max. ${n.negatiefPerLeerlijn} per leerlijn` |
| Line 34 (negatiefTotaal) | computeAlgemeneItems | `${p.totaalOnvoldoende}/6 O)` | `${p.totaalOnvoldoende}/${n.negatiefTotaal} O)` |
| Line 40 (negatiefPerLeerlijn) | computeAlgemeneItems | `max. 2 O per leerlijn bereikt` | `max. ${n.negatiefPerLeerlijn} O per leerlijn bereikt` |
| Line 53 (sbl — gehaald) | computeSBLItems | `norm ≥13)` | `norm ≥${n.sbl})` |
| Line 54 (sbl — nodig) | computeSBLItems | `norm ≥13)` | `norm ≥${n.sbl})` |
| Line 64 (sbc — gehaald) | computeSBCItems | `≥15 ≥V + alle kerndeelgebieden)` | `≥${n.sbc} ≥V + alle kerndeelgebieden)` |
| Line 68 (sbc — nodig) | computeSBCItems | `norm ≥15)` | `norm ≥${n.sbc})` |
| Line 85 (bj1Positief) | computeBJ1Items | `norm ≥13)` | `norm ≥${n.bj1Positief})` |

## Async Logic

No async logic was added. The component uses `getNormenSync()` — an O(1) cache read returning `_cache ?? DEFAULT_NORMEN`. The cache is pre-warmed at startup by `main.tsx` (Plan 03, Task 1). This is the same sync pattern used by `berekenPrognose()` in `utils/prognosis.ts`.

## Test Results

| Suite | Count | Status |
|-------|-------|--------|
| Full suite | 144 passed / 5 skipped | GREEN — no regressions |

All 144 tests pass with 5 skipped (unchanged from pre-Plan 04 baseline). No new test file was needed for this plan — the unit tests for `getNormenSync()` are covered in `tests/normen.test.ts` (Plan 01/02 scope), and the component changes are string-only label replacements.

## Manual Spot-Check

Manual spot-check was not performed as part of this automated execution wave. Per the plan specification, the manual verification (change SBL to 10 in Settings, confirm detail view shows "norm ≥10") can be combined with the Plan 03 checkpoint. The automated acceptance criteria fully verify all 8 replacement sites via grep counts.

## Success Criteria Verification

| Criterion | Result |
|-----------|--------|
| NORM-01: SBL norm text uses n.sbl | PASS (grep count = 2) |
| NORM-02: SBC norm text uses n.sbc | PASS (grep count = 2) |
| NORM-03: negatiefTotaal used | PASS (grep count = 2) |
| NORM-04: negatiefPerLeerlijn used | PASS (grep count = 2) |
| NORM-05: BJ1 doorstroom uses n.bj1Positief | PASS (grep count = 1) |
| No async logic added | PASS |
| Full test suite green | PASS (144/149) |
| Component props interface unchanged | PASS |

## Acceptance Criteria Verification

| Criteria | Expected | Actual | Status |
|----------|----------|--------|--------|
| Import count (from '../utils/normen') | 1 | 1 | PASS |
| getNormenSync() call count | 4 | 4 | PASS |
| No 'max. 6' in label strings | 0 lines | 0 lines | PASS |
| No 'max. 2' in label strings | 0 lines | 0 lines | PASS |
| No '≥13' in label strings | 0 lines | 0 lines | PASS |
| No '≥15' in label strings | 0 lines | 0 lines | PASS |
| n.negatiefTotaal usages | ≥ 2 | 2 | PASS |
| n.negatiefPerLeerlijn usages | ≥ 2 | 2 | PASS |
| n.sbl usages | ≥ 2 | 2 | PASS |
| n.sbc usages | ≥ 2 | 2 | PASS |
| n.bj1Positief usages | ≥ 1 | 1 | PASS |

## Deviations from Plan

None — plan executed exactly as written. All 8 hardcoded sites were at the exact lines specified. The import path `'../utils/normen'` was verified correct (component in `src/components/`, normen.ts in `utils/`). No deviations or rule applications required.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. Changes are purely string template parameterization within JSX helper functions. Both threat register entries (T-25-14, T-25-15) remain accurately classified as `accept` — the getNormenSync() reads return only integer thresholds from the pre-validated LazyStore cache with no PII.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/components/DoortstroomPrognoseSection.tsx exists | FOUND |
| Import from '../utils/normen' present | FOUND (count=1) |
| getNormenSync() calls = 4 | CONFIRMED |
| No hardcoded 6/2/13/15 in label strings | CONFIRMED |
| Commit c3b43f9 exists | FOUND |
| Full suite: 144/149 GREEN | PASSED |
| Props interface unchanged | CONFIRMED |
| No async logic added | CONFIRMED |
