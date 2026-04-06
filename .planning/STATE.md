---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Klasbeheer & Export
status: Ready to plan
last_updated: "2026-04-06T00:00:00.000Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 5
  completed_plans: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.
**Current focus:** Phase 07 — periode-vergelijking

## Current Position

Phase: 08 (print-to-pdf-export) — NOT STARTED
Plan: Phase 07 complete (2/2 plans)

## Performance Metrics

v1.1 phases completed: 0/3
v1.1 plans completed: 0/?

### v1.0 Historical (for reference)

| Phase | Plan  | Duration | Tasks | Files |
|-------|-------|----------|-------|-------|
| 01    | 01-01 | 8 min    | 3     | 7     |
| 01    | 01-02 | 15 min   | 2     | 1     |
| 01    | 01-03 | 4 min    | 2     | 1     |
| 01    | 01-04 | 3 min    | 2     | 2     |
| Phase 02-excel-import P02-01 | 5 min | 2 tasks | 2 files |
| Phase 02-excel-import P02-03 | 2 | 1 tasks | 1 files |
| Phase 03 P03-02 | 7 | 2 tasks | 4 files |
| Phase 06 P06-01 | 2 | 2 tasks | 2 files |
| Phase 06 P06-02 | 3 | 2 tasks | 1 files |
| Phase 06-multi-class-ui P06-03 | 8 | 1 tasks | 1 files |
| Phase 07 P07-01 | 68 | 2 tasks | 3 files |

## Decisions

### v1.0 Decisions (archived)

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
- [Phase 06]: Bridge pattern (D-07): window.appState.students = active class array reference so existing import/merge functions work without modification
- [Phase 06]: Single storage key mentordashboard_klassen_v1 with nested structure for all classes (vs per-class keys)
- [Phase 06]: Auto-migration: v1.0 users get Klas 1 created from mentordashboard_v1 on first load — transparent, old key removed
- [Phase 06]: Temporary renderKlasoverzicht() stub — Plan 03 replaces with renderKlasGrid(); avoids null-ref errors on #klas-tbody removal
- [Phase 06]: Tab click does NOT re-render leerlijn content (D-08: mapping is shared across classes) — only toggles ltSection visibility
- [Phase 06-multi-class-ui]: renderKlasGrid() replaces renderKlasoverzicht() stub — RAG tile grid with colored left-border tiles, event delegation click/keydown to showDetail()
- [Phase 07]: Compound dedup key (leerlingId + periode) in addStudent — Fase 2 PDFs coexist with Fase 1 records
- [Phase 07]: getActiveStudents deduplicates to most-recent record per leerlingId via alphabetical periode sort
- [Phase 07]: Verzuim inheritance in showDetail — most-recent record inherits verzuim from older period if it lacks one

### v1.1 Decisions (accumulating)

*(none yet — begin with Phase 6 planning)*

## Blockers

*(none)*

## Session Log

- 2026-03-24: Project geïnitialiseerd via `/gsd:new-project`
- 2026-03-24: Completed 01-01-PLAN.md — project scaffold, PDF.js vendor, schema, data model
- 2026-03-24: Completed 01-04-PLAN.md — import UI with drag-and-drop, live counter, batch processing
- 2026-03-25: v1.0 shipped — all 5 phases complete
- 2026-03-25: v1.1 milestone started — requirements defined (KLS-01..06, CMP-01..04, EXP-01..04)
- 2026-03-25: v1.1 roadmap created — phases 6 (Multi-class UI), 7 (Periode Vergelijking), 8 (Print-to-PDF Export)
- 2026-03-26: Phase 6 complete — all KLS requirements verified by user; tile grid klasoverzicht, multi-class tabs, persistence all confirmed
- 2026-03-26: Phase 6 UAT complete — all 6 human-UAT items approved; 06-HUMAN-UAT.md and 06-VERIFICATION.md closed as complete
- 2026-03-27: 07-02 Task 1 complete (commit 2925b80) — growth CSS + two-row tfoot + growth badges in detail view; paused at Task 2 human-verify checkpoint
- 2026-04-06: Phase 07 complete — UAT approved; two-period comparison UI with growth badges verified in browser
