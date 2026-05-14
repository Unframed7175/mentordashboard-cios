---
phase: 13
reviewers: [gemini, codex]
reviewed_at: 2026-05-14T00:00:00.000Z
plans_reviewed: [13-01-PLAN.md, 13-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 13: Bestandstoegang

## Gemini Review

### 1. Summary
The plan is architecturally sound and demonstrates a high degree of "Tauri-awareness," particularly regarding the decision to use the HTML5 File API over the Tauri dialog plugin to simplify the flow and the use of global drop guards to prevent WebView navigation. The transition to an async boot sequence in `main.tsx` is a critical and correct move to ensure the encrypted store is initialized before the UI attempts to consume state. The sequential processing of PDFs (Wave 1, Task 2) is a sophisticated choice that avoids known concurrency issues with `pdfjs-dist` workers in resource-constrained environments.

### 2. Strengths
- **Worker Safety:** The use of `for...of` instead of `Promise.all` for PDF parsing is excellent; it prevents race conditions and memory spikes in the PDF.js worker.
- **Global Drop Guard:** Implementing `preventDefault` on `document` within `App.tsx` is vital for Tauri apps on Windows to prevent the "miss-drop" behavior where the WebView attempts to navigate to the file path.
- **Async Boot:** The rewrite of `main.tsx` ensures that `loadKlassen()` completes before the React tree mounts, preventing "flash of empty state" or null-reference errors in components.
- **Functional State Updates:** Using `prev => ...` in the async loop ensures the progress counter remains accurate even if multiple state updates are queued in rapid succession.
- **Atomic Saves:** Calling `saveKlassen()` once after the entire batch of PDFs is processed significantly reduces I/O overhead and encryption cycles.

### 3. Concerns
- **HIGH — Student Duplication:** The plan for `handlePDFs` does not include a deduplication strategy. If a mentor drops the same PDF twice, or drops a folder containing already-imported students, the current logic may append duplicate student records to the `students` array.
- **MEDIUM — Cold Start UX:** The guard `if activeKlasId is null` returns an error. For a new user with an empty database, `activeKlasId` will likely be null. If they drop a PDF to create their first class, the app will block them. The logic should allow PDF imports to create a new class if none is active.
- **MEDIUM — Excel Matching Fragility:** Matching by `leerlingnummer` is correct, but Excel files often treat these numbers as integers (dropping leading zeros) or strings. If the PDF parser stores them as strings with leading zeros and the Excel parser returns them as numbers, the merge will fail silently.
- **LOW — File Extension Casing:** The routing logic should use `.toLowerCase()` since some scanners produce `.PDF` (uppercase).

### 4. Suggestions
1. In `handlePDFs`, before adding a parsed student, check if a student with the same `leerlingnummer` already exists in the current class. If they do, update the existing record instead of pushing a new one.
2. If `activeKlasId` is null during PDF import, the logic should check if the parsed PDF data contains a class name/ID and automatically create/set that class.
3. Explicitly cast `leerlingnummer` to a trimmed string in both the Excel parser output and the comparison logic.
4. Include the filename in error objects to help mentors identify which PDF was corrupted in a large batch.

### 5. Risk Assessment: LOW
The technical decisions (sequential processing, global guards, async main) mitigate the most common pitfalls in Tauri file handling. The concerns regarding duplication and cold start are logic-level issues addressable during implementation without changing the underlying architecture.

---

## Codex Review

### 1. Summary
The plan is directionally sound on file-entry UX and the locked batch-processing decisions, but it currently diverges from the app's existing state/update contracts. The biggest risk is that it reimplements PDF and Excel mutations at the `klassenState` array level instead of reusing the canonical helpers already present in `utils/datamodel.ts` (`addStudent()` and `mergeVerzuim()`), which introduces duplicate-record and matching regressions.

### 2. Strengths
- Uses hidden `input[type=file]` plus drag-drop, which matches the locked architecture.
- Sequential `for...of` for PDF import is the right choice for `pdfjs` worker stability.
- Per-file `try/catch` with end-of-batch summary is good failure isolation.
- Single `saveKlassen()` after the PDF batch is the right persistence boundary.
- Backup restore uses a clear fixed mode (`"overschrijven"`), keeping scope contained.

### 3. Concerns (Plan 13-02)
- **HIGH — PDF handler bypasses addStudent():** The plan implies direct writes into `klassenState.klassen[activeKlasId].students[]`. That bypasses the existing dedupe/replace behavior in `addStudent()` at `utils/datamodel.ts:75`. Re-importing the same leerling/periode creates duplicates instead of replacing the previous record.
- **HIGH — Excel bypasses mergeVerzuim():** The plan uses hand-rolled matching by `leerlingnummer`, while the existing supported merge path uses `mergeVerzuim()` at `utils/datamodel.ts:126`. This is a behavioral regression for files where `leerlingnummer` is missing, dirty, or inconsistent.
- **HIGH — activeKlasId guard blocks backup restore:** A blanket `activeKlasId === null` guard is wrong for backup restore. `applyBackupRestore()` should still work when there is no active class yet — blocking restore in that state defeats the recovery path.
- **HIGH — Post-restore in-memory state:** `applyBackupRestore()` in overwrite mode may not fully update in-memory state. The legacy `app.js` forced a page reload after restore. This plan omits both a reload and a bridge refresh, so post-restore state can become inconsistent.
- **MEDIUM — saveKlassen() return value ignored:** A failed save can surface as "done". The plan should treat `saveKlassen() === false` as an error state.
- **MEDIUM — Mixed file drop underspecified:** If the user drops `pdf + xlsx + zip` together, the plan does not define whether routing is grouped, ordered, or partially rejected.
- **MEDIUM — Multiple non-PDF files:** `handleExcel` and `handleBackup` are single-file handlers, but the input accepts `multiple`. Behavior for multiple .xls or multiple .zip files is not defined.
- **MEDIUM — Pre-Phase 12 backup compatibility not verified:** No verification step confirms that a pre-Phase 12 backup can be restored correctly.
- **LOW — Security:** Path traversal via the HTML File API is not the main concern. The real risks are malformed or oversized PDF/ZIP/XLS causing memory/CPU pressure and parser crashes.

### 4. Concerns (Plan 13-01)
- **HIGH — Import syntax bug:** The plan says `import loadKlassen from "../utils/klassen"` but `loadKlassen` is a named export, not a default export (`utils/klassen.ts:146`). As written, the plan will not typecheck.
- **MEDIUM — loadKlassen() swallows errors:** `loadKlassen()` internally catches and returns `false` on failure. A `try/catch` around it will not surface all meaningful failures, making the plan's logging expectation weaker than it appears.
- **MEDIUM — Missing #storage-error-banner:** `showStorageError()` in `utils/klassen.ts:19` writes into `#storage-error-banner`, but the plan for `App.tsx` does not include that DOM element.
- **LOW — Wave numbering confusing:** Plan 13-02 executes before 13-01 (wave 1 vs wave 2), which is correct but the reversed numbering is easy to misread.

### 5. Suggestions
- Route PDF imports through `addStudent()` from `utils/datamodel.ts` instead of pushing to `.students[]` directly.
- Route Excel imports through `mergeVerzuim()` from `utils/datamodel.ts` and surface unmatched records in the UI.
- Scope the `activeKlasId` guard to PDF and Excel only; do not require an active class for backup restore.
- After overwrite restore, force a state refresh or reload to ensure in-memory state matches the restored data.
- Treat `saveKlassen() === false` as an error state for all three handlers.
- Define mixed-file drop behavior: group by extension, process in fixed order (PDFs first, then Excel, then zip), or reject mixed drops.
- Fix the import in plan 13-01: `import { loadKlassen }` not `import loadKlassen`.
- Add `<div id="storage-error-banner" style={{display: "none"}} />` in App.tsx root.

### 6. Risk Assessment
- Plan 13-02: **MEDIUM-HIGH** — UI mechanics are straightforward but mutation plan diverges from existing data-model helpers.
- Plan 13-01: **LOW-MEDIUM** — Architecture correct; the remaining issues are a compile-time import mistake and a small UI omission.

---

## Consensus Summary

Two independent AI reviewers (Gemini, Codex) evaluated the plans.

### Agreed Strengths
- Sequential `for...of` instead of `Promise.all` for batch PDF — correct for pdfjs-dist worker safety
- Document-level drop guard in `App.tsx` — correct location and scope for Tauri WebView protection
- Async IIFE in `main.tsx` loading `loadKlassen()` before mount — correct startup hydration pattern
- Functional updater `prev => ...` for progress state inside async loop — safe and correct
- Single `saveKlassen()` call after full PDF batch — correct I/O minimization

### Agreed Concerns (shared by both reviewers)

1. **Student duplication on re-import (HIGH)** — Both reviewers independently identified that writing parsed PDF data directly to `.students[]` without deduplication causes duplicate student records when the same PDF is imported twice. Fix: route through `addStudent()` from `utils/datamodel.ts` which has find-or-replace semantics.

2. **Excel matching fragility (MEDIUM-HIGH)** — Both reviewers flagged the hand-rolled `leerlingnummer` matching. Codex identified the existing `mergeVerzuim()` helper in `utils/datamodel.ts`. Fix: use the canonical helper.

3. **activeKlasId null guard needs nuance (HIGH)** — Both agree the blanket guard blocks backup restore incorrectly. The guard should apply to PDF/Excel only; backup restore must work regardless of active class.

### Divergent Views

| Issue | Gemini | Codex |
|-------|--------|-------|
| activeKlasId null for PDF/Excel | Should auto-create a class (cold start UX) | Error message is correct; do NOT auto-create |
| Post-restore state refresh | Not flagged specifically | Force reload or bridge refresh after overwrite restore |
| saveKlassen() return value | Not flagged | MEDIUM — treat false as error state |

### Critical Bugs to Fix Before Execution

The following items are high-priority changes that should be incorporated into the plans via `/gsd-plan-phase 13 --reviews`:

1. **BLOCKER (13-01):** Fix import syntax: `import { loadKlassen } from "../utils/klassen"` (named export, not default)
2. **HIGH (13-02):** Route PDF results through `addStudent()` from `utils/datamodel.ts` for dedup semantics
3. **HIGH (13-02):** Route Excel results through `mergeVerzuim()` from `utils/datamodel.ts`
4. **HIGH (13-02):** Remove `activeKlasId` null guard from backup restore handler
5. **MEDIUM (13-02):** Handle `saveKlassen()` `false` return as error state
6. **MEDIUM (13-02):** Define mixed-file drop behavior
7. **MEDIUM (13-01):** Add `<div id="storage-error-banner">` to App.tsx for Phase 12 compat
