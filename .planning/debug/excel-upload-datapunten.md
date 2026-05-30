---
status: resolved
slug: excel-upload-datapunten
trigger: "Excel file upload shows error / datapunten incomplete (half rows missing from 2 imported periods)"
created: 2026-05-16T00:00:00Z
updated: 2026-05-16T00:00:00Z
---

## Symptoms

- **Expected (Excel):** Stage Excel file can be dropped or selected on Import tab; verzuim data merges into student records
- **Actual (Excel):** App shows an error message when uploading Excel
- **Expected (datapunten):** Student detail view shows all assessment rows from both imported PDF periods
- **Actual (datapunten):** ~half rows missing — 2 PDF periods imported but only roughly one period's rows appear
- **Timeline:** Discovered during Phase 08 UAT (2026-05-16) running `npm run dev`
- **Reproduction:** 1) Import tab → drop/select stage Excel → error shown; 2) Import 2 PDF periods → open student detail → only ~half datapunten rows visible

## Current Focus

hypothesis: both root causes identified and fixed
next_action: done
test: n/a
expecting: n/a

## Evidence

- timestamp: 2026-05-16T00:00:00Z
  file: parsers/excel.ts line 9
  note: >
    `cpexcel.full.mjs` exports `cptable` (numeric-keyed codepage dict) and `utils` as
    separate named exports. `XLSX.set_cptable` stores its argument as `$cptable` and
    then calls `$cptable.utils.decode(...)`. Passing `cpexcel.cptable` alone omits the
    `utils` property → TypeError at runtime when any Excel file is parsed.

- timestamp: 2026-05-16T00:00:00Z
  file: src/components/DeelgebiedenMatrix.tsx line 66
  note: >
    `const datapunten = student.datapunten || []` only reads the most-recent record's
    datapunten. When 2 PDF periods are imported, each StudentRecord has its own datapunten
    array. The older period's rows are never read → ~half the rows are invisible in the matrix.

## Eliminated

- cpexcel import path: `xlsx/dist/cpexcel.full.mjs` IS a valid export per package.json — import resolves fine
- Vite optimizeDeps: not the cause; the error is a runtime TypeError inside the parser, not a build error
- addStudent() deduplication logic: correctly preserves both records (different periode keys)

## Resolution

root_cause: >
  Bug A: `XLSX.set_cptable` receives `cpexcel.cptable` which lacks the `utils` property
  (it is a separate named export). Any Excel parse call then throws TypeError on
  `$cptable.utils.decode(...)` before reading a single row.
  Bug B: `DeelgebiedenMatrix` reads datapunten only from `student` (the most-recent record).
  When 2 PDF periods exist each record holds its own datapunten, so the older period's rows
  are never rendered.

fix: >
  Bug A (parsers/excel.ts): replaced `XLSX.set_cptable((cpexcel as any).cptable)` with
  `Object.assign({}, cpexcel.cptable, { utils: cpexcel.utils })` so the argument has both
  the numeric codepage keys and the required `utils` property.
  Bug B (src/components/DeelgebiedenMatrix.tsx): replaced `student.datapunten || []` with
  `allRecords.flatMap(r => r.datapunten || [])` to collect rows from all imported periods.

verification: manual UAT — import an Excel file (should succeed without error), import 2 PDF
  periods for the same student (all datapunten rows from both periods should appear in matrix)

files_changed:
  - parsers/excel.ts
  - src/components/DeelgebiedenMatrix.tsx
