---
phase: 33-klas-verwijderen-bevestiging
reviewed: 2026-05-30T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/components/KlasVerwijderenModal.tsx
  - src/components/KlasTabStrip.tsx
  - src/App.tsx
  - tests/KlasVerwijderenModal.test.tsx
  - tests/KlasTabStrip.test.tsx
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 33: Code Review Report

**Reviewed:** 2026-05-30T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 33 introduces `KlasVerwijderenModal` — a confirmation modal that gates class deletion behind a checkbox acknowledgement — and wires it into `App.tsx` via `handleDeleteKlas` / `handleConfirmDeleteKlas`. `KlasTabStrip` gains an always-visible delete button for every tab.

The modal component itself is straightforward and mostly correct. The critical issue is that the overlay `<div>` relies on `onKeyDown` for Escape-key cancellation, but this div is not focusable (no `tabIndex`, no `role="dialog"`), so the key event will never fire in a real browser and the test suite never exercises this path. Beyond that: the `canDelete` prop is declared in the interface but is silently ignored in the render tree, the delete modal does not navigate away when the currently-active class is deleted, and the test file contains an incorrect assertion about delete-button count.

---

## Critical Issues

### CR-01: `onKeyDown` on non-focusable overlay div — Escape key never fires

**File:** `src/components/KlasVerwijderenModal.tsx:27-38`

**Issue:** `handleOverlayKeyDown` is attached via `onKeyDown` to the backdrop `<div>`. A plain `<div>` without `tabIndex` or `role="dialog"` cannot receive keyboard focus, so it will never be part of the browser focus chain. The handler is therefore permanently dead code in production. Users who attempt to dismiss the modal with Escape — a universal UX expectation — are silently ignored. The test suite does not cover this path, so the bug is undetected.

**Fix:** Either add `tabIndex={-1}` and auto-focus the modal panel, or attach the `keydown` listener to `window`/`document` via `useEffect`:

```tsx
// Option A — attach to window
React.useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onCancel();
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [onCancel]);
```

```tsx
// Option B — make modal panel focusable and auto-focus it
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  tabIndex={-1}
  ref={el => el?.focus()}
  onKeyDown={handleOverlayKeyDown}
  style={{ ... }}
>
```

---

## Warnings

### WR-01: `canDelete` prop declared but never read — delete button always rendered

**File:** `src/components/KlasTabStrip.tsx:6,110-117`

**Issue:** The `KlasTabStripProps` interface declares `canDelete?: boolean` on each klass object, and `App.tsx` sets `canDelete: true` for all classes. However, the render path at lines 110–117 never checks `klas.canDelete`; the delete button is unconditionally rendered for every tab. This means:
1. The prop is misleading — callers believe they can suppress the button by passing `canDelete: false`.
2. The test at line 118–126 in `KlasTabStrip.test.tsx` asserts "× button for ALL klassen regardless of `canDelete`", which is factually correct for the current code, but the comment `canDelete: false` in `makeProps` implies the intent was conditional rendering. If the intent is "always show", the prop should be removed from the interface to avoid confusion.

**Fix (if intent is always-show):** Remove `canDelete` from the interface and from `App.tsx`'s mapping call:

```tsx
// KlasTabStripProps — remove canDelete
klassen: Array<{ id: string; naam: string }>;

// App.tsx line 164-168 — drop canDelete
klassen={Object.values(klassenState.klassen).map((klas: any) => ({
  id: klas.id,
  naam: klas.naam,
}))}
```

**Fix (if intent is conditional):** Read the prop in the render:
```tsx
{klas.canDelete !== false && (
  <button className="delete-tab-btn" ... >×</button>
)}
```

### WR-02: No view transition after deleting the active class

**File:** `src/App.tsx:137-146`

**Issue:** `handleConfirmDeleteKlas` only switches `view` to `'import'` when `Object.keys(klassenState.klassen).length === 0` (no classes remain). When the user deletes the *active* class but other classes remain, `deleteKlas` in the utility layer automatically pivots `klassenState.activeKlasId` to the first remaining class (utils/klassen.ts:104), but `App.tsx` does not call `setView` to match the new active state. If the user was on `view === 'detail'` when they initiated deletion, they remain on the detail view for a student that belongs to the now-deleted class.

**Fix:** After `deleteKlas` resolves, check whether the deleted class was active and whether we were on a class-specific view, then navigate accordingly:

```tsx
async function handleConfirmDeleteKlas(): Promise<void> {
  if (!showDeleteModal) return;
  const { klasId } = showDeleteModal;
  const wasActive = klasId === klassenState.activeKlasId;
  await deleteKlas(klasId);
  setShowDeleteModal(null);
  setRefreshKey(k => k + 1);
  if (Object.keys(klassenState.klassen).length === 0) {
    setView('import');
  } else if (wasActive && (view === 'klas' || view === 'detail')) {
    setView('klas');
  }
}
```

### WR-03: `onBlur` on rename input commits on focus-loss to the delete button — may trigger unwanted rename

**File:** `src/components/KlasTabStrip.tsx:95`

**Issue:** The rename input fires `commitRename` on every `blur` event. If the user double-clicks to rename, then immediately clicks the delete button on the *same* tab (without pressing Enter or Escape), `commitRename` is called first (before the delete handler runs). If the input has been modified, an unintended rename is persisted before the deletion. The `isCommittingRef` guard only prevents double-commit from Enter+blur; it does not guard against this case.

**Fix:** Accept deletion as an implicit cancel: detect if focus moves to the delete button for the same tab and skip the commit:

```tsx
onBlur={(e) => {
  // If focus moves to the sibling delete button, treat as cancel
  if (
    e.relatedTarget instanceof HTMLElement &&
    e.relatedTarget.closest('[data-klas-id="' + klas.id + '"]') === e.currentTarget.closest('[data-klas-id="' + klas.id + '"]')
  ) {
    setEditingKlasId(null);
    return;
  }
  commitRename(klas.id);
}}
```

Or simply save/cancel via Enter/Escape only and convert `onBlur` to a discard:
```tsx
onBlur={() => { setEditingKlasId(null); isCommittingRef.current = false; }}
```

---

## Info

### IN-01: Test for Escape-key overlay dismissal is absent

**File:** `tests/KlasVerwijderenModal.test.tsx`

**Issue:** There is no test covering `handleOverlayKeyDown` (Escape to dismiss) or `handleOverlayClick` (backdrop click to dismiss). These are documented interaction paths in the component. Their absence allowed CR-01 to go undetected.

**Fix:** Add tests:
```tsx
it('KLS-04: pressing Escape calls onCancel', () => {
  const onCancel = vi.fn();
  render(<KlasVerwijderenModal {...makeProps({ onCancel })} />);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(1);
});

it('KLS-04: clicking backdrop calls onCancel', () => {
  const onCancel = vi.fn();
  const { container } = render(<KlasVerwijderenModal {...makeProps({ onCancel })} />);
  fireEvent.click(container.firstChild!); // the overlay div itself
  expect(onCancel).toHaveBeenCalledTimes(1);
});
```

### IN-02: `var` keyword used in `deleteKlas` utility (style inconsistency)

**File:** `utils/klassen.ts:100` (referenced from `App.tsx:140`)

**Issue:** `var remainingIds = Object.keys(klassenState.klassen)` uses `var` while the rest of the codebase uses `const`/`let`. This is a minor style inconsistency but can produce surprising hoisting behavior in future edits to the same function.

**Fix:**
```ts
const remainingIds = Object.keys(klassenState.klassen);
```

---

_Reviewed: 2026-05-30T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
