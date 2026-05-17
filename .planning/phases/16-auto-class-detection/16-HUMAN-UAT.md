---
status: partial
phase: 16-auto-class-detection
source: [16-VERIFICATION.md]
started: 2026-05-17T10:20:00Z
updated: 2026-05-17T10:20:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Fresh install smoke — PDF drop creates class and shows toast
expected: Drop a real CIOS voortgang PDF onto ImportPage with no existing store.json; a new class tab appears in KlasTabStrip named after leerjaar+periode from the PDF header (e.g. "2024-2025 BJ2 Fase 2"), the toast "Klas aangemaakt: {naam}" appears bottom-right and disappears after ~3.5 seconds, and leerling tiles populate
result: [pending]

### 2. No-header PDF falls back to 'Nieuwe klas'
expected: Drop a PDF whose header has no leerjaar and no periode fields; class named "Nieuwe klas" is created, no crash, toast shows "Klas aangemaakt: Nieuwe klas"
result: [pending]

### 3. Existing-class path is unchanged
expected: When a class with at least one student already exists, dropping additional PDFs proceeds without calling autoDetectKlas — no new class is created and no toast appears
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
