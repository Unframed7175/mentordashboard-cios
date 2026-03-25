---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Klasbeheer & Export
status: Roadmap defined
last_updated: "2026-03-25T10:00:00Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.
**Current focus:** v1.1 — Klasbeheer & Export (Phase 6: Multi-class UI)

## Current Position

Phase: 6 — Multi-class UI
Plan: —
Status: Roadmap defined — ready to plan Phase 6
Last activity: 2026-03-25 — Roadmap v1.1 created (phases 6–8)

```
v1.1 progress: [░░░░░░░░░░] 0% (0/3 phases)
```

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
