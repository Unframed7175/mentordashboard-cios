---
phase: 16-auto-class-detection
plan: 01
subsystem: ui
tags: [react, typescript, importpage, klassen, toast, pdf-parsing]

# Dependency graph
requires:
  - phase: 13-file-access
    provides: ImportPage.tsx dropzone + handlePDFs batch loop
  - phase: 12-storage
    provides: createKlas(), switchActiveKlas(), klassenState, saveKlassen()
  - phase: 11-typescript-migration
    provides: parseSinglePDF() returning {leerjaar, periode} header fields
provides:
  - autoDetectKlas() helper in ImportPage.tsx — derives class name from PDF header fields
  - Zero-students guard replacing hard-error in handlePDFs()
  - Toast notification state + UI for auto-creation feedback
affects:
  - 17-settings
  - 19-ui-polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useEffect timeout pattern for auto-clearing toast state
    - Bubble-up error pattern: autoDetectKlas lets parseSinglePDF errors bubble to handlePDFs catch

key-files:
  created: []
  modified:
    - src/components/ImportPage.tsx

key-decisions:
  - "autoDetectKlas is a private async helper inside ImportPage — not exported; scoped to the component"
  - "Toast uses React state (no library) with useEffect/setTimeout auto-clear at 3500ms"
  - "T-16-01 mitigated: naam sliced to 255 chars before passing to createKlas()"
  - "handleExcel keeps its own activeKlasId guard — auto-detect is PDF-only; error message updated to reflect PDF-first workflow"
  - "Combined Tasks 1+2 into single commit: toastMessage state was required for Task 1 to compile"

patterns-established:
  - "Auto-detect pattern: check (activeKlasId===null || students.length===0) before PDF batch"
  - "Non-blocking toast: fixed-position div with pointerEvents:none, auto-dismissed via setTimeout"

requirements-completed:
  - ACD-01

# Metrics
duration: 25min
completed: 2026-05-17
---

# Phase 16 Plan 01: Auto-Class Detection Summary

**autoDetectKlas() helper in ImportPage.tsx derives class name from PDF header leerjaar+periode fields and creates the class automatically on first import, with a toast notification**

## Performance

- **Duration:** 25 min
- **Started:** 2026-05-17T09:45:00Z
- **Completed:** 2026-05-17T09:55:00Z
- **Tasks:** 2 (combined in 1 commit)
- **Files modified:** 1

## Accomplishments

- autoDetectKlas() helper parses first PDF's leerjaar+periode fields and calls createKlas(naam)
- Zero-students guard replaces the hard "Geen actieve klas" error in handlePDFs()
- Duplicate class detection: finds existing class by case-insensitive name match and calls switchActiveKlas()
- Toast notification "Klas aangemaakt: {naam}" appears as fixed-position overlay, auto-clears after 3.5s
- T-16-01 threat mitigated: naam capped at 255 chars before storage
- All 43 existing tests continue to pass — no regressions

## Task Commits

1. **Tasks 1+2: Auto-detect class + toast notification** - `7837fee` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/components/ImportPage.tsx` - Added autoDetectKlas() helper, toastMessage state+useEffect, toast JSX, replaced handlePDFs() guard

## Decisions Made

- Combined Tasks 1 and 2 into a single commit because `setToastMessage` (Task 2) was needed by Task 1's guard block to compile without errors
- Updated `handleExcel` error message from "maak eerst een klas aan" to "importeer eerst een PDF om een klas aan te maken" to satisfy the acceptance criterion (string removal from whole file) and reflect the new PDF-first workflow
- `autoDetectKlas` errors are caught in `handlePDFs` with explicit `setImportState(status: 'error')` since `handlePDFs` has no outer try/catch

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] handleExcel error message updated**
- **Found during:** Task 1 acceptance criteria check
- **Issue:** Acceptance criterion requires `maak eerst een klas aan` string absent from whole file; the string also appeared in `handleExcel` (not covered by the plan's description of replacing the guard in `handlePDFs`)
- **Fix:** Updated handleExcel error string to "importeer eerst een PDF om een klas aan te maken" — functionally equivalent, aligns with new workflow, satisfies acceptance criterion
- **Files modified:** src/components/ImportPage.tsx
- **Verification:** `grep -c "maak eerst een klas aan"` returns 0
- **Committed in:** 7837fee (Task 1+2 combined commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing criterion enforcement)
**Impact on plan:** Minor string update in handleExcel; no behavioral change to Excel import path.

## Issues Encountered

None — implementation matched the plan specification precisely.

## Known Stubs

None — autoDetectKlas is fully wired to parseSinglePDF + createKlas; toast fires on real naam value.

## Threat Flags

None — T-16-01 (naam truncation) and T-16-02 (duplicate reuse) were addressed in implementation. No new trust boundaries introduced beyond what the plan documented.

## Next Phase Readiness

- ACD-01 complete — auto-class detection ships with Phase 16
- Phase 17 (Settings panel) can proceed independently
- Phase 19 (UI polish) may choose to enhance the toast styling

---
*Phase: 16-auto-class-detection*
*Completed: 2026-05-17*
