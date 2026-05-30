---
phase: 33-klas-verwijderen-bevestiging
fixed_at: 2026-05-30T08:32:00Z
review_path: .planning/phases/33-klas-verwijderen-bevestiging/33-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 33: Code Review Fix Report

**Fixed at:** 2026-05-30T08:32:00Z
**Source review:** .planning/phases/33-klas-verwijderen-bevestiging/33-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (CR-01, WR-01, WR-02, WR-03)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: `onKeyDown` on non-focusable overlay div — Escape key never fires

**Files modified:** `src/components/KlasVerwijderenModal.tsx`
**Commit:** 3f37baa
**Applied fix:** Removed the dead `handleOverlayKeyDown` function and its `onKeyDown` prop from the overlay div. Added a `useEffect` that attaches a `keydown` listener to `window` and removes it on cleanup. The handler calls `onCancel()` when `e.key === 'Escape'`. Import updated from `{ useState }` to `{ useEffect, useState }`.

### WR-01: `canDelete` prop declared but never read — delete button always rendered

**Files modified:** `src/components/KlasTabStrip.tsx`, `src/App.tsx`
**Commit:** 9b9f986
**Applied fix:** Removed `canDelete?: boolean` from the `KlasTabStripProps` interface klassen array type. Removed `canDelete: true` from the `klassen.map()` call in App.tsx. The delete button remains unconditional (always shown), matching the phase-33 intent of D-01.

### WR-02: No view transition after deleting the active class

**Files modified:** `src/App.tsx`
**Commit:** 9b9f986
**Applied fix:** In `handleConfirmDeleteKlas`, captured `wasActive = klasId === klassenState.activeKlasId` BEFORE calling `deleteKlas`. After deletion, added an `else if` branch: when `wasActive` is true and `view` is `'klas'` or `'detail'`, calls `setView('klas')`. The existing `setView('import')` path for zero-remaining-classes is preserved.

### WR-03: `onBlur` on rename input commits on focus-loss — may trigger unwanted rename

**Files modified:** `src/components/KlasTabStrip.tsx`
**Commit:** 9b9f986
**Applied fix:** Changed the rename input's `onBlur` from `() => commitRename(klas.id)` to `() => { setEditingKlasId(null); isCommittingRef.current = false; }`. Enter remains the only commit path. The `isCommittingRef` guard on `onKeyDown` (for Enter) is intact and unaffected.

## Verification

- TypeScript: `npx tsc --noEmit` — pre-existing errors only (App.tsx:36, SettingsPage.tsx, spider files), none introduced by these fixes.
- Tests: `npm test` — 218 passed, 5 skipped (223 total). All tests green.

---

_Fixed: 2026-05-30T08:32:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
