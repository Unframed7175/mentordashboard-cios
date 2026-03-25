---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to plan
last_updated: "2026-03-25T07:13:04.418Z"
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 10
  completed_plans: 10
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-24)

**Core value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.
**Current focus:** Phase 03 — doorstroomnorm-engine

## Current Position

Phase: 04
Plan: Not started

## Performance Metrics

Phases completed: 1/5
Plans completed: 4/4

| Phase | Plan  | Duration | Tasks | Files |
|-------|-------|----------|-------|-------|
| 01    | 01-01 | 8 min    | 3     | 7     |
| 01    | 01-02 | 15 min   | 2     | 1     |
| 01    | 01-03 | 4 min    | 2     | 1     |
| 01    | 01-04 | 3 min    | 2     | 2     |
| Phase 02-excel-import P02-01 | 5 min | 2 tasks | 2 files |
| Phase 02-excel-import P02-03 | 2 | 1 tasks | 1 files |
| Phase 03 P03-02 | 7 | 2 tasks | 4 files |

## Decisions

- [01-01] PDF.js vendored as ESM (pdf.min.mjs + pdf.worker.min.mjs) — required for browser-only no-npm constraint
- [01-01] schema.js copied verbatim from sister project — 19 DEELGEBIEDEN IDs must not change for Phase 3 compatibility
- [01-01] datamodel.js uses window.* globals (not ES module exports) — consistent with schema.js pattern, avoids module scope issues
- [Phase 01]: Y_TOLERANCE=3 for PDF line grouping — calibrate against real CIOS PDFs in Plan 01-04
- [Phase 01]: Font-size heading threshold = median body font * 1.2 — adaptive detection, no hardcoded point values
- [Phase 01]: parseSinglePDF returns partial StudentRecord with deelgebiedScores={} + datapunten=[] — Plan 01-03 fills these from Overzicht table
- [Phase 01-03]: COLUMN_X_TOLERANCE=8pt for column assignment — start value from research; tune against real PDFs in 01-04
- [Phase 01-03]: Latest-non-null-wins aggregation for deelgebiedScores — later datapunten override earlier ones (document order)
- [Phase 01-03]: All 19 deelgebied keys always present in deelgebiedScores (null = not yet assessed) — Phase 3 can iterate safely
- [01-04]: app.js loaded as type=module — ensures execution after parsers/pdf.js in module script order
- [01-04]: DOMContentLoaded guard retained in module script — harmless; provides documentation value
- [Phase 02-excel-import]: excel.js uses window.* globals (not ES module) — consistent with schema.js/datamodel.js, avoids module scope issues
- [Phase 02-excel-import]: mergeVerzuim matches by leerlingnummer first, normalized naam as fallback — ID match preferred, name match handles XLS exports without matching IDs
- [Phase 02-03]: Guard placed at initialization time (not click time) — button state is correct immediately on page load when XLSX CDN fails
- [Phase 03]: leerlijnen.js uses IIFE classic script (no ES module) — consistent with schema.js/prognosis.js pattern
- [Phase 03]: telLeerlijnen fallback: mapping[dg.id] || dg.group — backward compatible if leerlijnen.js is not loaded

## Session Log

- 2026-03-24: Project geïnitialiseerd via `/gsd:new-project`
- 2026-03-24: Completed 01-01-PLAN.md — project scaffold, PDF.js vendor, schema, data model
- 2026-03-24: Completed 01-04-PLAN.md — import UI with drag-and-drop, live counter, batch processing
