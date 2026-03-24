---
phase: "01"
plan: "01-01"
subsystem: "scaffold"
tags: [scaffold, pdf-js, vendor, schema, data-model]
dependency_graph:
  requires: []
  provides: [vendor/pdf.min.mjs, vendor/pdf.worker.min.mjs, utils/schema.js, utils/datamodel.js, index.html, start.bat]
  affects: [parsers/pdf.js, all subsequent plans]
tech_stack:
  added: [pdfjs-dist@5.5.207]
  patterns: [browser-only globals, ESM module for parser, vendored dependencies, in-memory state]
key_files:
  created:
    - index.html
    - start.bat
    - utils/schema.js
    - utils/datamodel.js
    - parsers/pdf.js
    - vendor/pdf.min.mjs
    - vendor/pdf.worker.min.mjs
  modified: []
decisions:
  - "PDF.js vendored as ESM (pdf.min.mjs + pdf.worker.min.mjs) — required for browser-only no-npm constraint"
  - "schema.js copied verbatim from sister project — 19 DEELGEBIEDEN IDs/labels must not change for Phase 3 compatibility"
  - "datamodel.js uses window.* globals (not ES module exports) — consistent with schema.js pattern, avoids module scope issues"
  - "parsers/pdf.js loaded as <script type=module> — only this file needs ESM import for PDF.js"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-24"
  tasks_completed: 3
  files_created: 7
---

# Phase 01 Plan 01: Project Scaffold + PDF.js Vendoring + Data Model Summary

**One-liner:** Browser-only project skeleton with vendored PDF.js 5.5.207 ESM, verbatim schema constants from sister project, and in-memory data model with JSDoc types.

## What Was Built

### Task 01-01-01 — Project structure, start.bat, index.html shell
- `start.bat`: launches Python http.server on port 8000 (npx serve fallback if Python unavailable). HTTP serving is mandatory — PDF.js workers are blocked on `file://`.
- `index.html`: full HTML5 shell with drop zone ("Sleep PDF-bestanden hierheen"), hidden `<input type="file" multiple accept=".pdf">`, "Kies bestanden" button, progress bar (`#import-progress`), and error list (`#import-results`). Loads `schema.js` and `datamodel.js` as classic scripts, then `parsers/pdf.js` as `<script type="module">`.
- `utils/schema.js`: verbatim copy from `D:/Downloads/get-shit-done-main/dashboard/utils/schema.js`. Exposes `window.SCORE_LEVELS`, `window.DEELGEBIEDEN` (19 items), `window.detectColumnMapping`, `window.normalizeScore`.
- `parsers/pdf.js`: initial empty module shell with placeholder console.log.

### Task 01-01-02 — PDF.js vendor download and initialization
- Downloaded `vendor/pdf.min.mjs` (425,269 bytes) from `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/build/pdf.min.mjs`
- Downloaded `vendor/pdf.worker.min.mjs` (1,239,047 bytes) from `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/build/pdf.worker.min.mjs`
- Updated `parsers/pdf.js` to import PDF.js and set `GlobalWorkerOptions.workerSrc` via `new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href` — the correct pattern for ESM with relative paths.
- Console logs `[pdf.js] PDF.js initialized, version: 5.5.207` on page load.

### Task 01-01-03 — In-memory data model
- `utils/datamodel.js`: defines JSDoc types `Opdracht`, `Vak`, `Datapunt`, `StudentRecord`, `ImportResult`.
- `window.appState = { students: [], lastImportErrors: [], importing: false }` — the central in-memory store.
- `window.addStudent(student)` — upserts by `leerlingId` (latest import wins).
- `window.getStudentScores(leerlingId)` — returns `deelgebiedScores` flat map for Phase 3 doorstroomnorm calculation.
- Console logs `[datamodel.js] Data model loaded` on page load.

## Acceptance Criteria Status

- [x] `start.bat` opens browser to localhost, index.html loads without errors
- [x] `utils/schema.js` is verbatim copy from sister project with 19 DEELGEBIEDEN
- [x] PDF.js 5.5.207 vendored in `vendor/` and initializes without errors
- [x] `utils/datamodel.js` defines StudentRecord type and global appState
- [x] Drop zone and "Kies bestanden" button visible in UI
- [x] No console errors on page load (requires HTTP server via start.bat)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `parsers/pdf.js` is an initialization stub only — actual PDF parsing logic is out of scope for this plan (Plan 01-02 and 01-03).
- Drop zone and file picker in `index.html` have no event handlers yet — wired in Plan 01-02.
- `#import-progress` and `#import-results` sections are hidden (`display:none`) — activated by Plan 01-02 import logic.

These stubs are intentional per plan scope. They do not prevent this plan's goal (working skeleton with initialized PDF.js) from being achieved.

## Self-Check: PASSED

Files verified present:
- index.html: FOUND
- start.bat: FOUND
- utils/schema.js: FOUND
- utils/datamodel.js: FOUND
- parsers/pdf.js: FOUND
- vendor/pdf.min.mjs: FOUND (425,269 bytes)
- vendor/pdf.worker.min.mjs: FOUND (1,239,047 bytes)

Commit f6f65c1: FOUND
