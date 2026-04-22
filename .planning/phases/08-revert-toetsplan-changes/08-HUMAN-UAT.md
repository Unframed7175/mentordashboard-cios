---
status: partial
phase: 08-revert-toetsplan-changes
source: [08-VERIFICATION.md]
started: 2026-04-22T00:00:00.000Z
updated: 2026-04-22T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Import tab has no toetsplan section
expected: Navigate to Import tab — no "Toetsplan importeren" heading or drop zone is visible
result: [pending]

### 2. Klas tab shows no toetsplan badge
expected: Create or select a klas — the tab button shows no "Toetsplan: N fases" badge
result: [pending]

### 3. D2 table shows PDF order, no Deadline column
expected: Import a PDF, open student detail — column headers show Datapunt + deelgebied groups only (no Deadline column), rows appear in PDF order
result: [pending]

### 4. Two-row tfoot with growth badges
expected: Import two periods of PDFs for a student, open detail — two footer rows appear with growth arrows (V/G/E badges comparing oldest vs newest periode)
result: [pending]

### 5. Feedback panel has only Mentor actiepunten
expected: Open student detail — Feedback & actiepunten panel shows only the "Mentor actiepunten" sub-section; no "Feedback per deelgebied" sub-section
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
