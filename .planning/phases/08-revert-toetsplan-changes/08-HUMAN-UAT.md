---
status: diagnosed
phase: 08-revert-toetsplan-changes
source: [08-VERIFICATION.md]
started: 2026-04-22T00:00:00.000Z
updated: 2026-05-20T00:00:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Import tab has no toetsplan section
expected: Navigate to Import tab — no "Toetsplan importeren" heading or drop zone is visible
result: pass
verified: 2026-05-16
note: Confirmed via code analysis — "Toetsplan importeren" string is absent from all source files, built assets, and legacy files. ImportPage.tsx (Tauri/React app) has no toetsplan content. Previously recorded as "issue" was a false positive; the UAT edit was uncommitted and not reproducible.

### 2. Klas tab shows no toetsplan badge
expected: Create or select a klas — the tab button shows no "Toetsplan: N fases" badge
result: pass
verified: 2026-05-20

### 3. D2 table shows PDF order, no Deadline column
expected: Import a PDF, open student detail — column headers show Datapunt + deelgebied groups only (no Deadline column), rows appear in PDF order
result: issue
reported: "column headers correct, no Deadline column, but there are rows in between that don't belong — student names and (partial) subject names appearing as data rows"
severity: major
verified: 2026-05-20

### 4. Two-row tfoot with growth badges
expected: Import two periods of PDFs for a student, open detail — two footer rows appear with growth arrows (V/G/E badges comparing oldest vs newest periode)
result: pass
verified: 2026-05-20

### 5. Feedback panel has only Mentor actiepunten
expected: Open student detail — Feedback & actiepunten panel shows only the "Mentor actiepunten" sub-section; no "Feedback per deelgebied" sub-section
result: pass
verified: 2026-05-20

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "D2 table rows contain only data rows — no header/label rows from the PDF (no student names or subject names as row content)"
  status: failed
  reason: "User reported: student names and (partial) subject names appearing as rows in the D2 table between expected data rows"
  severity: major
  test: 3
  root_cause: "PDF parser is not skipping header/label rows within the score table — rows containing student names or deelgebied labels are being parsed as data records instead of being filtered out"
  artifacts:
    - parsers/pdf.ts
  missing:
    - Filter logic in PDF parser to skip rows where the first cell matches a student name or deelgebied header pattern
