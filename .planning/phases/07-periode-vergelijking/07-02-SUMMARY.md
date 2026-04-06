---
phase: 07-periode-vergelijking
plan: 02
subsystem: ui
tags: [multi-period, growth-badges, detail-view, tfoot, comparison]
dependency_graph:
  requires:
    - phase: 07-01
      provides: getAllRecordsForStudent, multi-period-storage
  provides: [two-row-tfoot, growth-badges, period-comparison-ui]
  affects: [detail-view, klasoverzicht]
tech_stack:
  added: []
  patterns: [growth-badge-helper, multi-period-tfoot, scoreRank-ordinal-comparison]
key_files:
  created: []
  modified:
    - index.html
    - app.js
decisions:
  - "growthBadge and scoreRank defined inside buildDetailDeelgebieden alongside dmChip — scoped helpers, no global pollution"
  - "hasTwoPeriods check compares oldest and newest periode strings — distinct period labels required for two-row rendering"
  - "Single-period fallback retains 'Eindoordeel' label for backward compatibility (D-12)"
  - "tfoot border-top split per-row: 2px solid on first row, 1px solid on second — visual separation without duplication"
requirements_completed:
  - CMP-02
  - CMP-03
metrics:
  duration: "~10 min"
  completed_date: "2026-04-06"
  tasks: 2
  files: 2
---

# Phase 07 Plan 02: Two-Period Comparison UI Summary

**Growth badge comparison UI in the detail view: two labeled tfoot rows (Fase 1 / Fase 2) with green ↑, red ↓, gray = badges per deelgebied when two periods exist; backward-compatible single "Eindoordeel" row otherwise.**

## What Was Built

Extended the detail view to show period comparison when a student has records from two distinct periods:

1. **index.html — Growth CSS classes**: Added `.growth-up` (green #16a34a), `.growth-down` (red #dc2626), `.growth-same` (gray #9ca3af) badge classes. Split `.dg-matrix tfoot td` border-top into per-row rules (first row 2px, second row 1px).

2. **app.js — scoreRank + growthBadge helpers**: `scoreRank` maps a score string to its ordinal index via `SCORE_LEVELS.indexOf`. `growthBadge(score1, score2)` returns an arrow span or empty string: up-arrow if score improved, down-arrow if declined, equals if unchanged, empty if Fase 1 was null.

3. **app.js — buildDetailDeelgebieden multi-period tfoot**: Calls `getAllRecordsForStudent(student.leerlingId)` to get all records sorted oldest-first. If two distinct periods exist, renders two labeled tfoot rows — oldest period label + scores, newest period label + scores + growth badges. Falls back to single "Eindoordeel" row for single-period students.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add growth CSS classes and two-row tfoot with growth badges | 2925b80 | index.html, app.js |
| 2 | Human verify — browser UAT approved | — | — |

## Deviations from Plan

None — plan executed exactly as written. buildDetailHeader already showed most-recent period via Plan 01's showDetail fix (D-08 satisfied without code change in this plan).

## User Verification

All 13 UAT steps approved:
- ✓ Klasoverzicht: one tile per student, Fase 2 prognose
- ✓ Detail view (one period): single "Eindoordeel" row
- ✓ Detail view (two periods): two labeled tfoot rows with Fase 1 / Fase 2
- ✓ Growth badges: ↑ green improved, ↓ red declined, = gray unchanged, no badge for null Fase 1
- ✓ Detail header meta shows most-recent period
- ✓ Prev/next navigation: no duplicate students
- ✓ Excel verzuim data intact after Fase 2 import

## Next Phase Readiness

Phase 07 complete. All CMP requirements satisfied:
- CMP-01: Two periods stored without overwriting (Plan 01)
- CMP-02: Two tfoot rows in detail view (this plan)
- CMP-03: Growth badges with directional arrows and colors (this plan)
- CMP-04: Prognose on most-recent period (Plan 01)

Ready for Phase 08 — Print-to-PDF Export.

---
*Phase: 07-periode-vergelijking*
*Completed: 2026-04-06*
