---
phase: 29
plan: 01
subsystem: testing
tags: [tdd, red-tests, bpv, prognose, wave-gate]
dependency_graph:
  requires: []
  provides:
    - "FIX-02 gate — BpvProgressSection loading/empty/data state tests"
    - "PROG-01 gate — DoortstroomPrognoseSection block layout tests"
  affects:
    - tests/BpvProgressSection.test.tsx
    - tests/DoortstroomPrognoseSection.test.tsx
tech_stack:
  added: []
  patterns:
    - "renderToStaticMarkup for synchronous JSX assertion (same pattern as spider.test.ts)"
    - "vi.mock hoisted before component import for utility mocking"
key_files:
  created:
    - tests/BpvProgressSection.test.tsx
    - tests/DoortstroomPrognoseSection.test.tsx
  modified: []
decisions:
  - "Used renderToStaticMarkup (not @testing-library/react render) — same as spider.test.ts pattern"
  - "BpvProgressSection Test 3 asserts old empty text NOT present (RED because initial render shows old text)"
  - "DoortstroomPrognoseSection tests assert prognose-block CSS class (not text presence) for reliable RED state"
  - "BJ1 student stub uses period/leerjaar fields (not jaarlaag) — detectTraject reads student.periode"
metrics:
  duration_minutes: 15
  completed_date: "2026-05-28"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 29 Plan 01: TDD RED Test Scaffolds Summary

Two RED test files created to gate Wave 2 (FIX-02 BPV loading state) and Wave 3 (PROG-01 prognose block layout) implementations. All 10 new tests fail against the current components as expected; 194 pre-existing tests remain green.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | BpvProgressSection RED test scaffold | 210b5ed | tests/BpvProgressSection.test.tsx |
| 2 | DoortstroomPrognoseSection RED test scaffold | 77a3dda | tests/DoortstroomPrognoseSection.test.tsx |

## Test Results (RED State Confirmed)

```
Test Files  2 failed | 21 passed | 1 skipped (24)
     Tests  10 failed | 194 passed | 5 skipped (209)
```

**BpvProgressSection.test.tsx — 3 tests, all 3 RED:**
- `loading state: shows BPV-data laden while data is fetching` — RED (no loading state in current component)
- `empty state: shows correct empty-state message when no BPV data is available` — RED (current shows old text "Nog geen stage-data — importeer de stage Excel...")
- `data state: loading state is shown on initial render (not the empty-state message)` — RED (current shows old empty text on initial render)

**DoortstroomPrognoseSection.test.tsx — 7 tests, all 7 RED:**
- `BJ2: renders SBL block as a prognose-block container` — RED (no prognose-block class in current component)
- `BJ2: renders SBC block as a prognose-block container` — RED (no block structure; only toggle buttons)
- `BJ2: renders Negatief block for negative prognosis` — RED (Negatief is gap-item text, not block heading)
- `BJ2: SBL criterion row shows score vs threshold in a prognose-criterion-row` — RED (no prognose-criterion-row class)
- `BJ1: renders BJ2 doorstroom block as a prognose-block` — RED (no prognose-block structure for BJ1)
- `BJ1: renders Versneld SBC block as a prognose-block` — RED (no block structure for BJ1)
- `no scores: shows "Nog geen scores beschikbaar" when both score counts are 0` — RED (no empty state in current component)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed BJ1 student stub field name**
- **Found during:** Task 2 initial test run
- **Issue:** BJ1 stub used `{ jaarlaag: 'BJ1' }` but `detectTraject()` reads `student.periode` (primary) and `student.leerjaar` (fallback), not `student.jaarlaag`. BJ1 stub was falling back to 'bj2' traject.
- **Fix:** Changed stubs to `{ periode: 'BJ1 fase 1', leerjaar: '1' }` and `{ periode: 'BJ2 fase 2', leerjaar: '2' }` matching the actual `detectTraject()` logic.
- **Files modified:** tests/DoortstroomPrognoseSection.test.tsx
- **Commit:** 77a3dda (included in task 2 commit)

## Known Stubs

None — this plan creates test files only. No production code modified.

## Threat Flags

None — test files only; no new network endpoints or auth paths introduced.

## Self-Check: PASSED

- [x] tests/BpvProgressSection.test.tsx exists
- [x] tests/DoortstroomPrognoseSection.test.tsx exists
- [x] 210b5ed commit exists (BpvProgressSection test)
- [x] 77a3dda commit exists (DoortstroomPrognoseSection test)
- [x] 3 BpvProgressSection tests RED
- [x] 7 DoortstroomPrognoseSection tests RED
- [x] 194 pre-existing tests still green
- [x] No src/ files modified
