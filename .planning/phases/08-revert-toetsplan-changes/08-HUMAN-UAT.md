---
status: resolved
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
result: pass
verified: 2026-05-20
note: Was failing due to PDF parser including page-header rows and wrapped vak-name continuation lines as datapunten. Fixed in parsers/pdf.ts — only rows whose label starts with a dash character (U+2010 HYPHEN or similar Unicode dash, not ASCII U+002D) are accepted as datapunten; all other rows are skipped.

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
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
