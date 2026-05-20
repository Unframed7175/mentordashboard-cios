---
phase: 23-rekenen-nederlands
plan: "02"
subsystem: detail-view
tags: [rekenen, nederlands, norm-badge, tdd]
dependency_graph:
  requires: [23-01]
  provides: [RNL-01, RNL-02, RNL-03]
  affects: [src/components/DetailWeergave.tsx]
tech_stack:
  added: []
  patterns: [AanvullendSection mutation pattern, normalizeRekenScore from schema]
key_files:
  created:
    - src/components/RekenenNederlandsSection.tsx
    - tests/RekenenNederlandsSection.test.tsx
  modified:
    - src/components/DetailWeergave.tsx
decisions:
  - "Reused AanvullendSection's rec[field] = value || null mutation pattern for consistency"
  - "Norm badge rendered inline with label (not below) using normalizeRekenScore from utils/schema"
  - "Tests placed in tests/ directory (not src/) per vitest.config.ts include pattern"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-20"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 23 Plan 02: Rekenen & Nederlands Section Summary

**One-liner:** Rekenen & Nederlands section with 3F/2F/1F dropdowns and inline norm badges using normalizeRekenScore, mounted between AanvullendSection and StageSection.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create RekenenNederlandsSection.tsx (TDD) | 6946d84 | src/components/RekenenNederlandsSection.tsx, tests/RekenenNederlandsSection.test.tsx |
| 2 | Mount in DetailWeergave.tsx and commit | 6946d84 | src/components/DetailWeergave.tsx |

## Test Results

- **132 passed**, 5 skipped (0 failed)
- 22 new tests added covering: rendering, normBadge output, hint state transitions, handleChange mutation, saveKlassen integration
- All 110 pre-existing tests continue to pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jsdom color normalization in badge tests**
- **Found during:** Task 1 GREEN phase (first test run)
- **Issue:** Test assertions compared `style.color` against `'#10b981'` but jsdom normalizes hex colors to `rgb(16, 185, 129)` at runtime
- **Fix:** Updated 3 test assertions to use `'rgb(16, 185, 129)'` instead of `'#10b981'`; also removed a superfluous check on `hint.style.color` (the "Opgeslagen" text node has no style — the parent `<p>` carries the color)
- **Files modified:** tests/RekenenNederlandsSection.test.tsx
- **Commit:** 6946d84 (included in same commit)

## TDD Gate Compliance

- RED gate: test suite failed with "Failed to resolve import" (component did not exist) — confirmed RED
- GREEN gate: all 22 new tests passed after component creation — confirmed GREEN
- No REFACTOR step needed — component matched spec exactly

## Known Stubs

None — dropdowns are fully wired to `saveKlassen()` via the AanvullendSection pattern. Norm badges render from `normalizeRekenScore()`.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Component reads only `rekenResultaat`, `nederlandsResultaat`, and `leerlingId` from the student prop — surface already covered by T-23-03..T-23-06 in the plan's threat model.

## Self-Check: PASSED

- src/components/RekenenNederlandsSection.tsx — EXISTS
- tests/RekenenNederlandsSection.test.tsx — EXISTS
- src/components/DetailWeergave.tsx modified — import on line 13, JSX mount on line 141 — EXISTS
- Commit 6946d84 — EXISTS (git log confirmed)
- 132 tests pass, 0 fail — CONFIRMED
