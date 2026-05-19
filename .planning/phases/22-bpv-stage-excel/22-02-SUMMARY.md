---
phase: "22"
plan: "22-02"
subsystem: import / bpv
tags: [bpv, import, routing, excel, ui]
dependency_graph:
  requires: [22-01]
  provides: [BPV-03, BPV-04]
  affects: [ImportPage, BpvProgressSection]
tech_stack:
  added: []
  patterns: [filename-heuristic routing, merge-not-overwrite BPV data]
key_files:
  modified:
    - src/components/ImportPage.tsx
    - src/components/BpvProgressSection.tsx
decisions:
  - "BPV routing uses /bpv|stage|praktijk/i filename heuristic — non-BPV xlsx still routes to handleExcel"
  - "handleBpvExcel merges new data on top of existing getBpvData() to avoid overwrites"
metrics:
  duration: "~5 min"
  completed: "2026-05-19"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 22 Plan 02: BPV Routing + Empty State Fix Summary

BPV Excel filename routing added to ImportPage and BpvProgressSection empty state updated to "Nog geen stage-data".

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Add BPV imports + handleBpvExcel + routing to ImportPage.tsx | Done | 64119e3 |
| 2 | Update BpvProgressSection empty state message (BPV-04) | Done | 64119e3 |
| 3 | Run tests and commit | Done | 64119e3 |

## Changes Made

### src/components/ImportPage.tsx

Five surgical edits:

1. Added import: `import { parseBpvExcel, saveBpvData, getBpvData } from '../../utils/bpv';`
2. Inserted `handleBpvExcel(file: File)` function before `handleBackup` — guards activeKlasId, parses file, merges with existing BPV data, emits count message or error
3. Added `let bpv: File | null = null; let bpvCount = 0;` variable declarations in `handleFiles()`
4. Replaced Excel routing block with BPV filename heuristic: files matching `/bpv|stage|praktijk/i` route to `bpv`, non-matching files still route to `excel` (no regression)
5. Added `if (bpv) await handleBpvExcel(bpv);` at end of `handleFiles()` serialized processing block

### src/components/BpvProgressSection.tsx

- Changed empty state text from "Geen BPV-data — importeer de BPV Excel via Instellingen." to "Nog geen stage-data — importeer de stage Excel via het importscherm."
- No surrounding JSX or styles altered

## Test Results

```
Test Files  15 passed | 1 skipped (16)
Tests       93 passed | 5 skipped (98)
```

All existing tests pass. No regressions.

## Deviations from Plan

None — plan executed exactly as written. Commit message was adjusted slightly to include the plan scope and requirement IDs but content matches the plan's instruction.

## Self-Check: PASSED

- `src/components/ImportPage.tsx` — modified, committed at 64119e3
- `src/components/BpvProgressSection.tsx` — modified, committed at 64119e3
- `handleBpvExcel` present in ImportPage.tsx
- `/bpv|stage|praktijk/i` routing present in handleFiles()
- `if (bpv) await handleBpvExcel(bpv)` present at end of handleFiles()
- "Nog geen stage-data" present in BpvProgressSection.tsx
- npm test exits 0 — 93 passed, 5 skipped
