---
phase: "01"
plan: "04"
subsystem: import-ui
tags: [drag-and-drop, batch-import, live-counter, error-display, console-debug]
dependency_graph:
  requires: [01-03]
  provides: [import-ui, window.debugStudent, window.validateImport]
  affects: [window.appState.students]
tech_stack:
  added: []
  patterns: [sequential-await-loop, module-globals-via-window]
key_files:
  created:
    - app.js
  modified:
    - index.html
decisions:
  - "app.js loaded as type=module — ensures it executes after parsers/pdf.js in module script order"
  - "DOMContentLoaded guard retained in module script — harmless; provides documentation value"
  - "Drop zone click delegates to fileInput.click() for non-button child elements"
  - "Non-PDF files dropped with PDFs: show warning but process the PDFs (D-05 spirit)"
  - "Student name tag list injected dynamically into results panel for quick visual verification"
metrics:
  duration: "~3 min"
  completed: "2026-03-24"
  tasks_completed: 2
  files_changed: 2
---

# Phase 01 Plan 04: Import UI Summary

**One-liner:** Browser import UI with sequential PDF batch processing, live "Verwerkt: X/Y" counter, per-file error reporting, and console debug helpers wired to window.parseSinglePDF.

## What Was Built

### app.js (new — 245 lines)

Full import flow implementation:

1. **Drag-and-drop handlers** — `dragover`, `dragleave`, `drop` events on `#import-zone`. Dragleave uses `relatedTarget` check to avoid flickering on child elements.

2. **File picker handler** — `chooseBtn` click triggers `fileInput.click()`; `fileInput.change` calls `importPDFs()`. Drop zone background also clickable.

3. **`importPDFs(files)`** — sequential `for` loop with `await window.parseSinglePDF(file)`:
   - Updates "Verwerkt: X/Y PDFs" counter after EACH file (success or failure)
   - On success: calls `window.addStudent(student)`
   - On failure: pushes `{ filename, reason }` to errors array
   - Continues past individual errors (D-05)
   - Shows results after all files processed

4. **`showImportProgress(processed, total)`** — reveals `#import-progress`, updates label and progress bar width percentage

5. **`showImportResults(results)`** — updates success/error badges, builds `<li>` items in `#error-list` with escaped filenames, appends student name tags for visual verification, adds "Importeer meer bestanden" button

6. **`showError(message)`** — injects dismissible red banner above drop zone, auto-removes after 6s

7. **`window.debugStudent(query)`** — searches by partial name or leerlingId, logs full breakdown with `console.table` for deelgebied scores

8. **`window.validateImport()`** — iterates all students, flags missing naam/leerlingId/periode/vakken/scores

### index.html (modified)

- Added `<script type="module" src="app.js"></script>` after `parsers/pdf.js`
- Added monospace font to `.error-list li strong` for filenames

## Verification Steps

To verify Plan 01-04 against the 19 CSD2A PDFs from `D:/Downloads/Voortgang-CSD2A fase 2/`:

1. Open `index.html` via `start.bat` (local HTTP server required for ES modules)
2. **Single file test:** Drop one voortgang-PDF. Counter shows "Verwerkt: 1/1 PDFs", student name appears in results.
3. **Batch test:** Drop all 19 PDFs at once. Counter increments 1→2→…→19/19. Results panel shows 19 successes.
4. **Error test:** Drop a non-voortgang PDF alongside real ones. Counter reaches N/N, 1 error entry with specific reason shown.
5. **Non-PDF test:** Drop a `.xlsx` file. Error banner: "Alleen PDF-bestanden worden geaccepteerd."
6. **File picker test:** Click "Kies bestanden", select multiple PDFs — same behavior as drag-and-drop.
7. **Console verification after batch:**
   ```
   > window.appState.students.length  // should be 19
   > validateImport()                  // should show "Alle leerlingen correct geparsed!"
   > debugStudent('Bosker')            // shows full breakdown
   ```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all import functionality is wired to the real parser. The results panel populates from actual parsed data.

## Self-Check: PASSED

- app.js: FOUND
- index.html: FOUND (modified)
- .planning/phases/01-pdf-parser/01-04-SUMMARY.md: FOUND
- Commit 92d6dfe: FOUND
