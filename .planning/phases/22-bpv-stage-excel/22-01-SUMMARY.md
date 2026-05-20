---
phase: 22-bpv-stage-excel
plan: "01"
subsystem: bpv-parser
tags: [xlsx, bpv, parser, utils]
dependency_graph:
  requires: []
  provides: [parseBpvExcel-real, debugBpvExcel]
  affects: [utils/bpv.ts]
tech_stack:
  added: []
  patterns: [cpexcel-registration, sheet-scorer, header-row-detection]
key_files:
  created: []
  modified:
    - utils/bpv.ts
decisions:
  - "BPV sheet scorer uses bpv+4, stage+3, uren+2, praktijk+2 weights (distinct from verzuim scorer)"
  - "Header row detection scans first 20 rows, scores against BPV_HEADER_KEYS"
  - "parseBpvExcel accumulates gerealiseerdeUren across multiple rows per student (one row per organisation)"
  - "leerlingId falls back to naam when no valid numeric studentnummer found"
  - "cpexcel registration pattern replicated from parsers/excel.ts (identical 3-line block)"
metrics:
  duration: "~4 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 22 Plan 01: BPV Excel Parser — Real Implementation Summary

Replace `parseBpvExcel` stub in `utils/bpv.ts` with a real XLSX parser using BPV-specific sheet scoring, header detection, and student accumulation logic; add `debugBpvExcel` diagnostic export.

## Tasks Completed

| Task | Name | Status | Files |
|------|------|--------|-------|
| 1 | Add XLSX import to utils/bpv.ts | Done | utils/bpv.ts |
| 2 | Replace parseBpvExcel stub + add debugBpvExcel | Done | utils/bpv.ts |

## Test Results

```
Test Files  15 passed | 1 skipped (16)
      Tests  93 passed | 5 skipped (98)
```

All existing bpv.test.ts assertions pass:
- `parseBpvExcel STUB returns empty object for valid XLSX magic bytes` — passes (XLSX.read throws on fake 8-byte buffer, catch returns `{}`)
- `parseBpvExcel throws for non-Excel files (magic-byte guard)` — passes (magic-byte guard unchanged, throws before XLSX.read)

## Implementation Notes

### Task 1: XLSX Import
Inserted 4 lines before `import { LazyStore }` at the top of `utils/bpv.ts`:
- `import * as XLSX from 'xlsx'`
- `import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs'`
- cpexcel registration (same pattern as `parsers/excel.ts` — merges `cptable` + `utils`)
- `XLSX.set_cptable(_cptableWithUtils)`

Typecheck passes with zero errors on bpv.ts.

### Task 2: Real parseBpvExcel + debugBpvExcel
Replaced the stub with:

1. `_bpvKolom()` private helper — fuzzy column finder using lowercase includes matching
2. Real `parseBpvExcel()` with:
   - Magic-byte guard (identical to stub)
   - `XLSX.read()` wrapped in try/catch — malformed buffers return `{}`
   - BPV-specific sheet scorer: `bpv+4, stage+3, uren+2, praktijk+2`
   - Header row detection scanning first 20 rows against `BPV_HEADER_KEYS`
   - Student extraction via `Student / Naam / Leerlingnaam / ...` candidates
   - Student ID extraction via `Studentnummer / Leerlingnummer / ...` candidates with integer regex
   - Hours extraction prioritizing `Stage-uren goedgekeurd` (confirmed real file column)
   - Accumulation across multiple rows per student
3. `debugBpvExcel()` export — logs sheets + first 5 rows per sheet, wrapped in try/catch

Real file context applied: "Logboek voortgang" sheet, "Student" column, "Studentnummer" column, "Stage-uren goedgekeurd" column.

## Deviations from Plan

None — plan executed exactly as written.

## Commit Status

Not committed per plan instructions — Wave 2 (plan 22-02) will commit everything together.

## Self-Check

- [x] `utils/bpv.ts` modified with XLSX imports and real implementation
- [x] `import * as XLSX from 'xlsx'` present at top of file
- [x] `export function debugBpvExcel` present in utils/bpv.ts
- [x] parseBpvExcel uses BPV-specific sheet scorer
- [x] parseBpvExcel returns `{}` on malformed buffer (no throw)
- [x] All 93 tests pass, 5 skipped
- [x] `npm test` exits 0
