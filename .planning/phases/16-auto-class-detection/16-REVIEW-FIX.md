---
phase: 16-auto-class-detection
fixed_at: 2026-05-17T10:32:00Z
review_path: .planning/phases/16-auto-class-detection/16-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 16: Code Review Fix Report

**Fixed at:** 2026-05-17T10:32:00Z
**Source review:** .planning/phases/16-auto-class-detection/16-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (CR-01, WR-01, WR-02, WR-03, WR-04)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01 + WR-01: `autoDetectKlas` error handling hardened

**Files modified:** `src/components/ImportPage.tsx`
**Commit:** 80d81f5
**Applied fix:**
- Updated `autoDetectKlas` return type from `Promise<{ naam: string } | null>` to `Promise<{ naam: string; reused: boolean } | null>` (in preparation for WR-02 toast discrimination).
- After the `duplicate` branch: added an explicit `return { naam, reused: true }` inside the `if (existingKlas)` guard, and added a `throw new Error(...)` for the case where `existingKlas` is `undefined` after a duplicate signal (WR-01 fix). This prevents silent fallthrough to the original `return { naam }` that did not call `switchActiveKlas`.
- After the duplicate branch: added `if (!createResult || createResult.error) { throw new Error(...) }` to guard against any `error: 'invalid'` return from `createKlas` (CR-01 fix). The throw causes `handlePDFs`'s existing catch block to set `status: 'error'` with a user-visible message.
- Changed the happy-path return to `{ naam: createResult.naam, reused: false }`.

### WR-02: Toast shows correct message for duplicate-reuse vs new class creation

**Files modified:** `src/components/ImportPage.tsx`
**Commit:** 1e62be1
**Applied fix:**
- In `handlePDFs`, added `let klasReused = false` alongside `let detectedNaam`.
- Populated `klasReused = detected.reused` when `detected` is non-null.
- Replaced the unconditional `setToastMessage('Klas aangemaakt: ' + detectedNaam)` with a ternary: `klasReused ? 'Klas gevonden: ' + detectedNaam : 'Klas aangemaakt: ' + detectedNaam`. Mentors who import PDFs for an already-existing class now see "Klas gevonden: ..." instead of the misleading "Klas aangemaakt: ...".

### WR-03: Excel `handleExcel` no longer wipes PDF batch result messages

**Files modified:** `src/components/ImportPage.tsx`
**Commit:** d90791f
**Applied fix:**
- Changed `setImportState(prev => ({ ...prev, status: 'processing', messages: [], errors: [] }))` in `handleExcel` to `setImportState(prev => ({ ...prev, status: 'processing' }))`. This preserves any messages and errors accumulated by a preceding `handlePDFs` call (mixed PDF+Excel drop scenario), so the user can see the PDF batch result summary alongside the Excel result.

### WR-04: `parseSinglePDF` and `addStudent` errors reported with correct labels

**Files modified:** `src/components/ImportPage.tsx`
**Commit:** f55639d
**Applied fix:**
- Split the combined `try { parseSinglePDF; addStudent }` block into two separate try/catch blocks.
- The first block catches parse failures and reports `${file.name}: parseerfout` (unchanged label), then calls `continue` to skip the `addStudent` call entirely.
- The second block catches `addStudent` failures and reports `${file.name}: verwerking mislukt` — correctly distinguishing a storage/state error from a parse error.
- Progress counter increment moved into both branches (parse failure branch uses `continue` so the counter is incremented before `continue`; addStudent success/failure both fall through to the bottom increment).

---

## Test Results

`npm test` run after all fixes merged to master:
- Test Files: 9 passed, 1 skipped (10 total)
- Tests: 43 passed, 5 skipped (48 total)
- No regressions introduced.

---

_Fixed: 2026-05-17T10:32:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
