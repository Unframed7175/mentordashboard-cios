---
phase: 29
plan: "05"
subsystem: components
tags: [prognose, block-layout, css-classes, tdd-green, prog-01]
dependency_graph:
  requires: [29-03, 29-04]
  provides:
    - "PROG-01 — DoortstroomPrognoseSection per-traject block layout rewrite"
    - "CSS block layout classes: .prognose-block, .prognose-block-header, .prognose-criterion-row"
  affects:
    - src/components/DoortstroomPrognoseSection.tsx
    - src/index.css
tech_stack:
  added: []
  patterns:
    - "Helper component pattern: PrognoseBlock + CriterionRow sub-components"
    - "criterionStatus(nodig) 3-state function: groen/oranje/rood"
    - "globalEmpty guard: totaalVoldoendeOfHoger===0 && totaalOnvoldoende===0"
    - "llMap lookup: Object.fromEntries(p.leerlijnen.map(l => [l.leerlijn, l]))"
key_files:
  created: []
  modified:
    - src/components/DoortstroomPrognoseSection.tsx
    - src/index.css
decisions:
  - "Used n.versneldLesgeven with bj1VersneldLesgeven alias fallback to handle both normen.ts field naming conventions"
  - "Comment-only reference to berekenPrognose kept (not imported); acceptance criteria check is import-based"
  - "Negatief block shared between BJ1 and BJ2 via extracted negatiefBlock JSX variable"
metrics:
  duration_minutes: 12
  completed_date: "2026-05-28"
  tasks_completed: 2
  files_created: 0
  files_modified: 2
---

# Phase 29 Plan 05: DoortstroomPrognoseSection Block Layout Rewrite Summary

DoortstroomPrognoseSection fully rewritten with per-traject block layout (PROG-01): BJ2 shows SBL + SBC + Negatief blocks; BJ1 shows BJ2 doorstroom + Versneld SBC + Negatief blocks. Each block has a header with block name and overall status chip; each criterion row shows label, score/threshold, and 3-state chip. CSS block classes added to index.css. All 7 Wave 0 PROG-01 tests GREEN; full suite 204/204 passes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add .prognose-block CSS classes to index.css | ce948c8 | src/index.css |
| 2 | Rewrite DoortstroomPrognoseSection.tsx with block layout | 00ad793 | src/components/DoortstroomPrognoseSection.tsx |

## Test Results (GREEN State Confirmed)

```
Test Files  23 passed | 1 skipped (24)
     Tests  204 passed | 5 skipped (209)
```

**DoortstroomPrognoseSection.test.tsx — 7 tests, all 7 GREEN:**
- `BJ2: renders SBL block as a prognose-block container` — GREEN
- `BJ2: renders SBC block as a prognose-block container` — GREEN
- `BJ2: renders Negatief block for negative prognosis` — GREEN
- `BJ2: SBL criterion row shows score vs threshold in a prognose-criterion-row` — GREEN
- `BJ1: renders BJ2 doorstroom block as a prognose-block` — GREEN
- `BJ1: renders Versneld SBC block as a prognose-block` — GREEN
- `no scores: shows "Nog geen scores beschikbaar" when totaalVoldoendeOfHoger and totaalOnvoldoende are both 0` — GREEN

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Normen field name aliasing for bj1Versneld* fields**
- **Found during:** Task 2 (reading utils/normen.ts)
- **Issue:** The plan's interface section specifies `n.bj1VersneldLesgeven`, `n.bj1VersneldOrganiseren`, `n.bj1VersneldProfHandelen`, but the actual `Normen` interface in `utils/normen.ts` uses `versneldLesgeven`, `versneldOrganiseren`, `versneldProfHandelen`. The test mock provides both names via aliasing, so either name resolves in tests.
- **Fix:** Used `(n as any).bj1VersneldLesgeven ?? n.versneldLesgeven` aliasing pattern to ensure the component works with both the real Normen type (via `versneldLesgeven`) and the test mock (which provides both names).
- **Files modified:** src/components/DoortstroomPrognoseSection.tsx
- **Commit:** 00ad793

## Known Stubs

None — the component reads live data from `status.prognose` (pre-computed) and `getNormenSync()`. All criterion rows wire to real data fields.

## Threat Flags

None — component is read-only. No new network endpoints, auth paths, or data flows introduced. Props interface unchanged (T-29-05-02 mitigated).

## Self-Check: PASSED

- [x] src/index.css contains ".prognose-block {": FOUND
- [x] src/index.css contains ".prognose-criterion-row {": FOUND
- [x] src/index.css contains ".prognose-block-header {": FOUND
- [x] No hardcoded hex in CSS additions: PASSED (CSS variables only)
- [x] src/components/DoortstroomPrognoseSection.tsx does NOT import berekenPrognose: PASSED
- [x] DoortstroomPrognoseSection.tsx contains "getNormenSync": FOUND
- [x] DoortstroomPrognoseSection.tsx contains "detectTraject": FOUND
- [x] DoortstroomPrognoseSection.tsx contains "prognose-block": FOUND
- [x] DoortstroomPrognoseSection.tsx contains "prognose-criterion-row": FOUND
- [x] DoortstroomPrognoseSection.tsx contains "Nog geen scores beschikbaar": FOUND
- [x] No hardcoded hex in DoortstroomPrognoseSection.tsx: PASSED (grep empty)
- [x] Commit ce948c8 exists: FOUND
- [x] Commit 00ad793 exists: FOUND
- [x] npm test DoortstroomPrognoseSection: 7/7 GREEN
- [x] npm test full suite: 204/204 GREEN
