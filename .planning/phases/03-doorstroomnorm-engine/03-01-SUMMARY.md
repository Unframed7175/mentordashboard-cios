---
phase: 03-doorstroomnorm-engine
plan: "01"
subsystem: prognosis-engine
tags: [prognosis, doorstroomnorm, CIOS, BJ2, calculation, gap-analysis]
dependency_graph:
  requires: [window.DEELGEBIEDEN, window.appState]
  provides: [window.berekenPrognose, window.berekenAllePrognoses, window.debugPrognose]
  affects: [utils/prognosis.js, index.html]
tech_stack:
  added: []
  patterns: [IIFE, window.* globals, functional calculation, pure functions]
key_files:
  created:
    - utils/prognosis.js
  modified:
    - index.html
decisions:
  - "IIFE wrapping — prevents local helper functions (isVoldoendeOfHoger etc.) from polluting global scope"
  - "null scores do NOT count as onvoldoende — not-yet-assessed ≠ failed"
  - "Negatief checked first in label priority — safety signal overrides positive signals"
  - "student.prognose attached in berekenAllePrognoses() — enables Phase 4 klasoverzicht to read prognose without recalculating"
metrics:
  duration: "5 min"
  completed: "2026-03-24"
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 01: Doorstroomnorm Engine Summary

**One-liner:** Pure-function prognosis engine implementing all CIOS BJ2→BJ2/SBL/SBC norms with per-leerlijn tallying, gap analysis, and console debug helper.

## What Was Built

### utils/prognosis.js (new)

Three IIFE-scoped helper functions (not exported):
- `isVoldoendeOfHoger(score)` — true for V, G, E
- `isGoedOfHoger(score)` — true for G, E
- `isOnvoldoende(score)` — true only for explicit 'onvoldoende' (null = not assessed, NOT onvoldoende)

Three window.* exports:

**`window.berekenPrognose(student)`** — core calculation:
1. Tallies per leerlijn: totaal, voldoendeOfHoger, goedOfHoger, onvoldoende, onbeoordeeld
2. Sums across all 19 deelgebieden
3. Applies norms in priority order: negatief → versneld → positief → neutraal
4. Computes gap analysis: nodigPositief, nodigVersneld_lesgeven/organiseren/profHandelen
5. Returns full PrognosisResult with label, booleans, leerlijnen array, gaps

**`window.berekenAllePrognoses()`** — batch calculator:
- Iterates all students in appState
- Attaches `student.prognose` to each record for Phase 4 use
- Returns summary array

**`window.debugPrognose(nameOrId)`** — console helper:
- console.table per-leerlijn breakdown
- Gap analysis with current/needed counts
- Label + boolean flags

### index.html (modified)

Added `<script src="utils/prognosis.js"></script>` between excel.js and pdf.js (module).

## Norms Implemented

| Norm | Condition | Label |
|------|-----------|-------|
| NORM-03 | ≥13 deelgebieden ≥V totaal | positief |
| NORM-04 | lesgeven ≥4 G/E AND organiseren ≥3 G/E AND prof_handelen ≥5 G/E | versneld |
| NORM-05 | >6 onvoldoende totaal OR >2 onvoldoende in één leerlijn | negatief |
| NORM-06 | gap-analyse per norm | in gaps object |

Leerlijn breakdown (from schema.js):
- lesgeven (6): V&A, M&M, INS, O&DW, C&B, 1E&B
- organiseren (5): P&O, S&O, ORG, I&B, 2E&B
- prof_handelen (8): PrCo, VSK, LOB, INFO, DESK, BS, TOW, BH

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create utils/prognosis.js doorstroomnorm engine | cef586b | utils/prognosis.js (created), index.html |

## Self-Check: PASSED
