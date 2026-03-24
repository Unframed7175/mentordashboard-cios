---
phase: 01-pdf-parser
plan: "02"
subsystem: pdf-parser
tags: [pdfjs, text-extraction, line-grouping, header-parsing, vak-opdracht, feedforward, browser-only]

requires:
  - phase: 01-01
    provides: PDF.js vendored ESM, schema.js (DEELGEBIEDEN + normalizeScore), datamodel.js (StudentRecord typedef)

provides:
  - extractAllTextItems(file): raw positioned text items from all PDF pages, sorted page/y-desc/x-asc
  - groupIntoLines(items, tolerance): Y-proximity line clustering, page-aware, X-sorted within line
  - lineToText(line): join line items to string
  - extractHeader(lines): Naam / LeerlingID / Periode / Leerjaar from first 30 lines
  - parseVakSections(lines): font-size-based vak detection, opdrachten, status, feedforward capture
  - parseSinglePDF(file): main entry — returns partial StudentRecord (deelgebiedScores/datapunten empty)
  - window.parseSinglePDF + debug globals for browser console

affects:
  - 01-03 (extends parseSinglePDF with deelgebiedScores + datapunten from Overzicht table)
  - 01-04 (import UI calls parseSinglePDF in batch loop)

tech-stack:
  added: []
  patterns:
    - "Y-proximity line grouping: items within Y_TOLERANCE=3pt of weighted-average Y belong to same line; page boundaries never crossed"
    - "Font-size heading detection: median body-text size computed from all items; heading threshold = median * 1.2"
    - "Feed-forward capture: set capturingFeedForward flag on 'Feed Forward:' line; concatenate following lines until structural marker"
    - "Status matching: case-insensitive includes() against STATUS_STRINGS array with whitespace normalization"
    - "Filename fallback for naam: DD-(.+).pdf pattern when header extraction returns empty"

key-files:
  created: []
  modified:
    - parsers/pdf.js

key-decisions:
  - "Y_TOLERANCE=3 chosen per research recommendation — calibrate against real PDFs in 01-04 verification"
  - "Font-size threshold = median * 1.2 — robust against varying body sizes across PDFs without hardcoding point values"
  - "parseVakSections stops at 'Overzicht Deelgebieden' — clean boundary with Plan 01-03 scope"
  - "All lower-level functions exported (not just parseSinglePDF) — Plan 01-03 needs extractAllTextItems + groupIntoLines to add deelgebied table parsing"
  - "flushOpdracht/flushVak inner functions used for state management — avoids duplicated push logic"

patterns-established:
  - "parseSinglePDF(file) is the public API; all lower-level utilities are also exported for Plan 01-03 extension"
  - "Window globals for every exported function — enables browser console debugging without module imports"
  - "Partial StudentRecord pattern: deelgebiedScores={} and datapunten=[] intentionally empty until Plan 01-03"

requirements-completed: [PDF-02, PDF-03, PDF-04, PDF-07]

duration: 15min
completed: 2026-03-24
---

# Phase 01 Plan 02: PDF Parser Core Summary

**PDF.js coordinate-aware text extraction with Y-proximity line grouping, regex header parsing, font-size vak-heading detection, and per-opdracht status + multi-line feedforward capture — producing a partial StudentRecord**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-24T08:00:00Z
- **Completed:** 2026-03-24T08:15:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Implemented complete text extraction pipeline: PDF.js getTextContent() → positioned items → Y-proximity line groups → logical lines sorted top-to-bottom/left-to-right
- Built header extractor using regex patterns tolerant of spacing variations around colons (Naam, Leerling ID, Periode, Leerjaar)
- Built vak section parser: font-size-based heading detection (median * 1.2 threshold), opdracht detection via numbered/Opdracht/dash patterns, status matching against D-11 strings, multi-line feedforward concatenation
- Exported parseSinglePDF() as main entry point and all utilities as named exports for Plan 01-03 extension

## Task Commits

1. **Tasks 01-02-01 + 01-02-02: PDF text extraction, line grouping, header + vak/opdracht/feedforward parsing** — `27fa146` (feat)

**Plan metadata:** (pending — created with this summary)

## Files Created/Modified

- `parsers/pdf.js` — Extended from 13-line stub to full 461-line parser: extractAllTextItems, groupIntoLines, lineToText, extractHeader, detectHeadingThreshold, looksLikeOpdracht, parseVakSections, parseSinglePDF + exports

## Decisions Made

- **Y_TOLERANCE = 3:** Research-recommended starting value; to be empirically validated against real CIOS PDFs during Plan 01-04 manual testing.
- **Heading threshold = median body font × 1.2:** Adaptive rather than hardcoded; survives variation across PDF versions. Trade-off: extremely short documents with few items fall back to 14pt constant.
- **parseVakSections breaks on "Overzicht Deelgebieden":** Clean scope boundary — this plan handles the vak/opdracht section; Plan 01-03 handles the deelgebied table.
- **All utilities exported:** Plan 01-03 needs `extractAllTextItems` and `groupIntoLines` to add deelgebied table parsing on top of the same item/line infrastructure.

## Deviations from Plan

None — plan executed exactly as written. The `detectHeadingThreshold` helper is an addition to support the font-size heading detection strategy, but it is a utility used by `parseVakSections` (listed in the plan spec), not a new requirement.

## Issues Encountered

None — implementation proceeded directly from the research patterns documented in 01-RESEARCH.md. The line-grouping algorithm matches Pattern 5 verbatim; header extraction matches Pattern 4.

## Known Stubs

- `deelgebiedScores: {}` — intentionally empty; Plan 01-03 will fill this from the "Overzicht Deelgebieden" table
- `datapunten: []` — intentionally empty; Plan 01-03 will fill this from the same table

These stubs are by design (documented in plan spec) and do not block the plan's goal. The plan goal is header + vak/opdracht parsing, which is fully implemented.

## User Setup Required

None — no external services required. Parser operates entirely in-browser with vendored PDF.js (set up in Plan 01-01).

## Next Phase Readiness

- Plan 01-03 can directly import `extractAllTextItems`, `groupIntoLines`, and `lineToText` from `parsers/pdf.js` to build the deelgebied table parser
- `parseSinglePDF` is the integration point: 01-03 should extend it (or wrap it) to fill in `deelgebiedScores` and `datapunten`
- Manual verification against real PDFs should happen in Plan 01-04 after the complete parser is assembled

---
*Phase: 01-pdf-parser*
*Completed: 2026-03-24*
