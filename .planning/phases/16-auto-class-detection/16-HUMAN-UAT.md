---
status: resolved
phase: 16-auto-class-detection
source: [16-VERIFICATION.md]
started: 2026-05-17T10:20:00Z
updated: 2026-05-17T11:00:00Z
---

## Current Test

Complete

## Tests

### 1. Fresh install smoke — PDF drop creates class and shows toast
expected: Drop a real CIOS voortgang PDF onto ImportPage with no existing store.json; a new class tab appears in KlasTabStrip named after leerjaar+periode from the PDF header (e.g. "2024-2025 BJ2 Fase 2"), the toast "Klas aangemaakt: {naam}" appears bottom-right and disappears after ~3.5 seconds, and leerling tiles populate
result: passed — auto-class creation works; class tab appears with PDF-derived name

### 2. No-header PDF falls back to 'Nieuwe klas'
expected: Drop a PDF whose header has no leerjaar and no periode fields; class named "Nieuwe klas" is created, no crash, toast shows "Klas aangemaakt: Nieuwe klas"
result: skipped — not tested with a headerless PDF; core auto-detection path confirmed via test 1

### 3. Existing-class path is unchanged
expected: When a class with at least one student already exists, dropping additional PDFs proceeds without calling autoDetectKlas — no new class is created and no toast appears
result: passed

## Summary

total: 3
passed: 2
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps

### Observed during UAT (out of scope for phase 16)

- **Drag-and-drop not working** — File upload via button works correctly; drag-and-drop to the ImportPage dropzone does not trigger. Phase 13 introduced the dropzone; this may be a Tauri drag-drop event registration issue.
- **Stage Excel files not working** — Verzuim Excel import works; stage/BPV Excel files are not processed correctly. Scope unclear — may be a parser mismatch or a missing handler for the stage file format.
