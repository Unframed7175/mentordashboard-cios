---
phase: 27-klasbeheer
plan: 02
subsystem: ui
tags: [react, typescript, klasbeheer, delete, rename, css, tdd]

# Dependency graph
requires:
  - phase: 27-klasbeheer
    plan: 01
    provides: renameKlas(klasId, newNaam) from utils/klassen.ts
  - phase: 17
    provides: KlasTabStrip gear icon tests baseline
provides:
  - KlasTabStrip with hover × delete (KLS-01) and double-click inline rename (KLS-02/KLS-03)
  - CSS for .delete-tab-btn (hover + :focus-within visibility) and .tab-rename-input
  - TAB-01, TAB-02, TAB-03 component tests in tests/KlasTabStrip.test.tsx
affects:
  - App.tsx (handleDeleteKlas, handleRenameKlas, updated KlasTabStrip props)
  - KlasOverzicht.tsx (legacy delete removed — D-07)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tab wrapper as <div role='tab'> (not <button>) so inner × <button> is valid HTML — no nested interactive elements"
    - "isCommittingRef guard on commitRename prevents Enter-then-blur double-submit"
    - "canDelete: boolean prop on tab items — KlasTabStrip never receives students[] directly"
    - "CSS :focus-within on .nav-tab reveals .delete-tab-btn for keyboard accessibility"
    - "min-width/max-width only on .tab-rename-input — no hard width to avoid layout shift"

key-files:
  created: []
  modified:
    - src/components/KlasTabStrip.tsx
    - src/App.tsx
    - src/components/KlasOverzicht.tsx
    - src/index.css
    - tests/KlasTabStrip.test.tsx

key-decisions:
  - "Outer tab element is <div role='tab'> not <button> — avoids nested interactive element HTML invalidity"
  - "isCommittingRef prevents double-submit when Enter fires then blur fires on the same commit"
  - "canDelete computed in App.tsx as students.length === 0 — KlasTabStrip is purely presentational"
  - "TAB-03 Escape sets editingKlasId to null and resets isCommittingRef without calling onRenameKlas"

patterns-established:
  - "React.useRef<boolean>(false) as commit guard — same pattern applicable to any inline edit component"

requirements-completed:
  - KLS-01
  - KLS-02
  - KLS-03

# Metrics
duration: 10min
completed: 2026-05-26
---

# Phase 27 Plan 02: Klasbeheer — Tab delete/rename UI, CSS, and component tests Summary

**KlasTabStrip rewritten with hover × delete (canDelete tabs) and double-click inline rename; KlasOverzicht legacy delete removed; CSS for hover/:focus-within visibility and inline input; TAB-01/02/03 component tests passing**

## Performance

- **Duration:** 10 min
- **Completed:** 2026-05-26
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- `src/components/KlasTabStrip.tsx`: Tab wrappers changed from `<button>` to `<div role="tab">` (valid HTML). Added `onDeleteKlas`, `onRenameKlas`, `canDelete` props. Added `editingKlasId` state and `isCommittingRef` guard for inline rename. Delete button rendered only when `canDelete === true`.
- `src/App.tsx`: Added `handleDeleteKlas` (window.confirm + deleteKlas + setRefreshKey) and `handleRenameKlas` (renameKlas + setRefreshKey). Updated KlasTabStrip render site to pass `canDelete: boolean` (computed from `students.length === 0`).
- `src/components/KlasOverzicht.tsx`: Removed `handleDelete` function, "Klas verwijderen" footer JSX, `onKlasDeleted` prop, and `deleteKlas` import (D-07).
- `src/index.css`: Added `.delete-tab-btn` (base opacity:0, `:hover` opacity:1, `:focus-within` opacity:1) and `.tab-rename-input` (min-width/max-width only, no hard width).
- `tests/KlasTabStrip.test.tsx`: Added TAB-01 (× button visibility), TAB-02 (double-click input), TAB-03 Enter and Escape tests. Updated Phase 17 gear tests with new required props. 9 tests total in file.

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `609ef70` | feat(27-02): extend KlasTabStrip with delete/rename and wire App.tsx callbacks |
| 2 | `237c3d5` | feat(27-02): remove legacy delete from KlasOverzicht and add delete/rename CSS |
| 3 | `ea0e411` | feat(27-02): add TAB-01, TAB-02, TAB-03 component tests for KlasTabStrip |

## Files Created/Modified

- `src/components/KlasTabStrip.tsx` — full rewrite: `<div role="tab">` wrapper, canDelete/onDeleteKlas/onRenameKlas props, editingKlasId + isCommittingRef, commitRename helper
- `src/App.tsx` — added handleDeleteKlas, handleRenameKlas; updated KlasTabStrip klassen prop with canDelete; removed onKlasDeleted from KlasOverzicht render
- `src/components/KlasOverzicht.tsx` — removed handleDelete function, footer JSX, onKlasDeleted prop, deleteKlas import
- `src/index.css` — added .delete-tab-btn (3 rules) and .tab-rename-input CSS
- `tests/KlasTabStrip.test.tsx` — TAB-01/02/03 tests + Phase 17 tests updated with new required props

## Decisions Made

- Tab wrapper uses `<div role="tab">` not `<button>` — the pre-review plan had nested interactive elements which is invalid HTML. The `<div role="tab">` approach is the fix applied per plan frontmatter.
- `isCommittingRef` pattern: `useRef<boolean>(false)` guards `commitRename` so Enter keystroke followed by input blur does not double-call `onRenameKlas`.
- `canDelete` computed in App.tsx from `students?.length === 0`. KlasTabStrip receives only the boolean — no student data flows into the UI component.
- Phase 17 gear icon tests updated with new required props (`onDeleteKlas`, `onRenameKlas`) to fix TypeScript interface compliance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing prop wiring] Phase 17 tests missing new required props**
- **Found during:** Task 3
- **Issue:** The existing KlasTabStrip test file (from Phase 17) was missing `onDeleteKlas` and `onRenameKlas` props that are now required in the updated interface. While tests passed at runtime (JavaScript doesn't enforce required props), TypeScript would flag them and they would fail if the callbacks were invoked.
- **Fix:** Updated all 4 Phase 17 gear tests to include `onDeleteKlas={vi.fn()}` and `onRenameKlas={vi.fn()}` in the props.
- **Files modified:** tests/KlasTabStrip.test.tsx
- **Commit:** ea0e411

**2. [Plan note — acceptance criteria mismatch] `grep -c "<button" returns 3, not 1**
- **Found during:** Task 1 acceptance verification
- **Issue:** The acceptance criteria states "grep -c "<button" src/components/KlasTabStrip.tsx returns exactly 1 (the inner × button only)". However, the + create button and ⚙ settings button are also `<button>` elements, making the count 3. The plan author was only counting buttons that are tab wrappers vs. the inner × button. The actual requirement (no `<button>` as outer tab wrapper) IS met — the outer tabs use `<div role="tab">` and the only `<button>` elements are the + button, ⚙ button, and the delete × button.
- **Fix:** No code change needed — the implementation is correct. The acceptance criteria check count is inaccurate but the underlying requirement is satisfied.
- **Files modified:** none

## Test Results

- `npx vitest run tests/KlasTabStrip.test.tsx`: 9 tests passing (4 Phase 17 + TAB-01 × 2 + TAB-02 + TAB-03 × 2)
- `npx vitest run` (full suite): 157 passing, 5 skipped, 0 failures

## Known Stubs

None - all implemented behaviors are wired end-to-end.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are UI-layer only. Threat mitigations from plan are implemented:
- T-27-02 (commitRename empty-trim guard): implemented in commitRename(), reverts silently on empty input
- T-27-03 (window.confirm before deleteKlas): implemented in handleDeleteKlas in App.tsx
- T-27-04 (aria-label on delete button): `aria-label={Klas ${klas.naam} verwijderen}` on each delete button

## Self-Check: PASSED

- `src/components/KlasTabStrip.tsx` — FOUND
- `src/App.tsx` — FOUND (modified)
- `src/components/KlasOverzicht.tsx` — FOUND (modified)
- `src/index.css` — FOUND (modified)
- `tests/KlasTabStrip.test.tsx` — FOUND
- Commit `609ef70` — FOUND (feat(27-02): extend KlasTabStrip)
- Commit `237c3d5` — FOUND (feat(27-02): remove legacy delete)
- Commit `ea0e411` — FOUND (feat(27-02): add TAB-01/02/03 tests)

---
*Phase: 27-klasbeheer*
*Completed: 2026-05-26*
