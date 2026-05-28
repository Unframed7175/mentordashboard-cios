---
phase: 29
plan: "04"
subsystem: components
tags: [ui-polish, dark-mode, css-variables, detail-view, section-cleanup]
dependency_graph:
  requires: [29-02]
  provides: [detail-view-section-cleanup, hex-to-css-var-pass]
  affects: [DetailWeergave.tsx, DeelgebiedenMatrix.tsx, FeedbackActiepuntenSection.tsx, AanvullendSection.tsx, RekenenNederlandsSection.tsx, VerzuimSection.tsx, SettingsPage.tsx]
tech_stack:
  added: []
  patterns: [css-design-tokens, inline-style-css-variables]
key_files:
  created: []
  modified:
    - src/components/DetailWeergave.tsx
    - src/components/DeelgebiedenMatrix.tsx
    - src/components/FeedbackActiepuntenSection.tsx
    - src/components/AanvullendSection.tsx
    - src/components/RekenenNederlandsSection.tsx
    - src/components/VerzuimSection.tsx
    - src/components/SettingsPage.tsx
    - tests/RekenenNederlandsSection.test.tsx
decisions:
  - "Spider container has no fixed width — no change needed (D-DETAIL-04 already satisfied)"
  - "VerzuimSection #fff white-text on colored bar segments intentionally kept — not in UI-03 audit, correct contrast"
  - "RekenenNederlandsSection test assertions updated from rgb() to var() — jsdom does not resolve CSS variables to computed RGB values"
metrics:
  duration: "12m"
  completed: "2026-05-28"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 29 Plan 04: DetailWeergave Cleanup + Hex-fix Pass Summary

DetailWeergave.tsx: removed 3 section imports and JSX (LeerlijnenSection, VakkenSection, NotitiesTextarea), added view-fade-in class to outermost wrapper, fixed #475569 print header hex. 6 component files: 16 hardcoded hex inline-style values replaced with CSS design tokens for dark mode correctness.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | DetailWeergave cleanup — section removal, full-width spider, fade-in, hex fix | e06c6e5 | src/components/DetailWeergave.tsx |
| 2 | Hex-fix pass — 6 component files (UI-03) | eb70cc4 | src/components/DeelgebiedenMatrix.tsx, FeedbackActiepuntenSection.tsx, AanvullendSection.tsx, RekenenNederlandsSection.tsx, VerzuimSection.tsx, SettingsPage.tsx, tests/RekenenNederlandsSection.test.tsx |

## Verification Results

- `grep "import.*LeerlijnenSection|import.*VakkenSection|import.*NotitiesTextarea" src/components/DetailWeergave.tsx` — empty (PASS)
- `grep "<LeerlijnenSection|<VakkenSection|<NotitiesTextarea" src/components/DetailWeergave.tsx` — empty (PASS)
- `grep "view-fade-in" src/components/DetailWeergave.tsx` — 1 match on outermost div (PASS)
- `grep "#475569" src/components/DetailWeergave.tsx` — empty (PASS)
- `grep "var(--rag-groen)" src/components/VerzuimSection.tsx` — 2 matches (bar + legend dot) (PASS)
- `grep "var(--status-groen-text)" src/components/DeelgebiedenMatrix.tsx` — 1 match (PASS)
- npm test: 132 passed, 5 skipped (PASS)
- Section order in DetailWeergave: Header → DoortstroomPrognoseSection → RekenenNederlandsSection → FeedbackActiepuntenSection → SpiderChartCard row → DeelgebiedenMatrix → VerzuimSection → BpvProgressSection (PASS)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertions updated to match CSS variable values**
- **Found during:** Task 2 — after replacing `#10b981` with `var(--status-groen-text)` in RekenenNederlandsSection.tsx
- **Issue:** 3 tests in `tests/RekenenNederlandsSection.test.tsx` asserted `rgb(16, 185, 129)` (jsdom's normalization of `#10b981`). After the hex replacement, jsdom returns the CSS variable string directly — `var(--status-groen-text)` — because it cannot resolve CSS custom properties to computed values.
- **Fix:** Updated 3 test assertions to expect `'var(--status-groen-text)'` instead of `'rgb(16, 185, 129)'`
- **Files modified:** tests/RekenenNederlandsSection.test.tsx (3 assertions updated)
- **Commit:** eb70cc4

### Notes

- Spider container on `spider-charts-row` already had no fixed `width:` or `maxWidth:` — no change was needed (D-DETAIL-04 already satisfied before this plan).
- SettingsPage.tsx had only 1 occurrence of `#EF4444` (not 2 as the plan estimated from RESEARCH.md lines 422 and 430). Line 422 may have been refactored in a prior phase. The single occurrence was replaced correctly.
- `#fff` values in VerzuimSection.tsx (lines 63, 77, 91) are white text labels inside the colored verzuim bar segments — intentionally retained as they were not in the UI-03 audit list and provide correct contrast on the colored backgrounds.

## Known Stubs

None — this plan makes presentational changes only; no data-binding concerns.

## Threat Flags

None — section removal is JSX-only (data remains in store per T-29-04-01). No new network endpoints, auth paths, or file access patterns introduced.

## Self-Check: PASSED

- src/components/DetailWeergave.tsx modified: FOUND
- src/components/VerzuimSection.tsx modified: FOUND
- src/components/DeelgebiedenMatrix.tsx modified: FOUND
- Commit e06c6e5 exists: FOUND
- Commit eb70cc4 exists: FOUND
- No LeerlijnenSection/VakkenSection/NotitiesTextarea imports or JSX in DetailWeergave: PASS
- view-fade-in class present on outermost wrapper: PASS
- #475569 absent from DetailWeergave: PASS
- var(--rag-groen) present in VerzuimSection: PASS
- var(--status-groen-text) present in DeelgebiedenMatrix: PASS
- npm test 132/132: PASS
