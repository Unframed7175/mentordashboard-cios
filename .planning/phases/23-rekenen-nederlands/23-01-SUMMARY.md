---
phase: 23-rekenen-nederlands
plan: "01"
subsystem: utils
tags: [schema, datamodel, rekenen, nederlands, normalization]
dependency_graph:
  requires: []
  provides: [normalizeRekenScore, StudentRecord.rekenResultaat, StudentRecord.nederlandsResultaat]
  affects: [src/components/RekenenNederlandsSection.tsx]
tech_stack:
  added: []
  patterns: [pure-function, tdd]
key_files:
  created:
    - tests/schema.test.ts
  modified:
    - utils/schema.ts
    - utils/datamodel.ts
decisions:
  - "normalizeRekenScore uses .toLowerCase() (vs normalizeScore's .toUpperCase()) to match 1f/2f/3f literals directly"
  - "JSDoc-only change to datamodel.ts — StudentRecord is any at runtime, no TS typedef needed"
metrics:
  duration: ~5 minutes
  completed: 2026-05-20
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 23 Plan 01: Add normalizeRekenScore + StudentRecord JSDoc Summary

One-liner: Added `normalizeRekenScore()` utility mapping 1F/2F/3F and Dutch word variants to canonical pass/fail status, plus JSDoc documentation of `rekenResultaat`/`nederlandsResultaat` on StudentRecord.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add normalizeRekenScore() to utils/schema.ts | d6387d7 | utils/schema.ts, tests/schema.test.ts |
| 2 | Add JSDoc fields to utils/datamodel.ts | 5ed7fd4 | utils/datamodel.ts |

## Test Results

- **110 tests pass**, 5 skipped (0 failures)
- Previous baseline: 93 passing tests
- New tests added: 17 (all normalizeRekenScore behavior cases)
- TDD cycle: RED (17 failures, import error — function not yet defined) → GREEN (all 17 pass after implementation)

## Implementation Details

### Task 1: normalizeRekenScore()

Appended after `normalizeScore()` in `utils/schema.ts`:

```typescript
export function normalizeRekenScore(raw: unknown): 'goed' | 'voldoende' | 'onvoldoende' | null
```

Covers all 17 behavior cases from the plan spec:
- null / undefined / '' → null
- '3F' / '3f' / 'goed' / 'G' → 'goed'
- '2F' / '2f' / 'voldoende' / 'V' → 'voldoende'
- '1F' / '1f' / 'onvoldoende' / 'O' / 'onv' → 'onvoldoende'
- unknown → null

### Task 2: StudentRecord JSDoc

Inserted after `@property {Actiepunt[]} [actiepunten]` in `utils/datamodel.ts`:

```
 * @property {string|null} [rekenResultaat]      - '2F' | '3F' | '' | null — Rekenen assessment result (RNL-01)
 * @property {string|null} [nederlandsResultaat] - '2F' | '3F' | '' | null — Nederlands assessment result (RNL-02)
```

## Deviations from Plan

None — plan executed exactly as written. Both tasks completed without requiring any deviation rules.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced. The `normalizeRekenScore` function is pure with null-guard; JSDoc change is compile-time only (T-23-01, T-23-02: accepted per threat register).

## Self-Check: PASSED

- utils/schema.ts: FOUND, exports normalizeRekenScore
- utils/datamodel.ts: FOUND, contains rekenResultaat and nederlandsResultaat @property lines
- tests/schema.test.ts: FOUND, 17 tests all passing
- Commit d6387d7: FOUND
- Commit 5ed7fd4: FOUND
- npm test: 110 passed, 0 failed
