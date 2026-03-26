---
status: partial
phase: 06-multi-class-ui
source: [06-VERIFICATION.md]
started: 2026-03-26T00:00:00Z
updated: 2026-03-26T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Empty state on fresh start
expected: showEmptyKlassenState() hides all views and main nav, shows "Geen klassen aangemaakt" prompt
result: [pending]

### 2. Data isolation between classes
expected: Import PDFs into two classes; tab switching shows isolated student sets per class
result: [pending]

### 3. Tile grid visual appearance
expected: RAG left-border colors, prognose badge text, mini verzuim bar render correctly
result: [pending]

### 4. Refresh persistence
expected: Both class tabs and student data restored after F5
result: [pending]

### 5. Delete class confirm flow
expected: Class name shown in confirm() dialog; last-class deletion returns to empty state
result: [pending]

### 6. v1.0 migration
expected: Set mentordashboard_v1 in localStorage, reload → "Klas 1" auto-created, migration logged
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
