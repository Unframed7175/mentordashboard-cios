---
phase: 33-klas-verwijderen-bevestiging
reviewed: 2026-05-30T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/components/KlasVerwijderenModal.tsx
  - src/components/KlasTabStrip.tsx
  - src/App.tsx
  - tests/KlasVerwijderenModal.test.tsx
  - tests/KlasTabStrip.test.tsx
  - utils/klassen.ts
  - tests/klassen.uniekeLeerlingen.test.ts
  - src/App.tsx
gap_closure_reviewed: 2026-05-30T00:00:00Z
gap_closure_files:
  - utils/klassen.ts
  - tests/klassen.uniekeLeerlingen.test.ts
  - src/App.tsx
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
prior_findings_status: fixed
---

# Phase 33: Code Review Report

**Reviewed:** 2026-05-30T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8 (5 original + 3 gap-closure)
**Status:** issues_found (1 new warning, 1 new info from gap closure; prior findings verified fixed)

## Summary

### Original review (plans 33-01 / 33-02)

Phase 33 introduced `KlasVerwijderenModal` — a confirmation modal that gates class deletion behind a checkbox acknowledgement — and wired it into `App.tsx` via `handleDeleteKlas` / `handleConfirmDeleteKlas`. `KlasTabStrip` gained an always-visible delete button for every tab.

The original review found 1 critical issue (Escape key dead on non-focusable div), 3 warnings (unused `canDelete` prop, missing view transition after active-class deletion, `onBlur` rename commit racing with delete click), and 2 info items. All 6 prior findings have been verified fixed by the commits recorded in the git log.

### Gap-closure review (plan 33-03)

The gap closure adds `countUniekeLeerlingen()` to `utils/klassen.ts` and switches `handleDeleteKlas` in `App.tsx` to use it, fixing double-counting of students who appear once per period. The implementation is functionally correct for the intended use case. One new warning is raised: students with a missing `leerlingId` field are silently coalesced into a single Set entry, causing undercounting in malformed data. One new info item is raised: the test suite does not cover that edge case or other non-array inputs.

---

## Prior Findings — Status

| ID    | Title                                                     | Status  |
|-------|-----------------------------------------------------------|---------|
| CR-01 | `onKeyDown` on non-focusable overlay div                 | Fixed   |
| WR-01 | `canDelete` prop declared but never read                  | Fixed   |
| WR-02 | No view transition after deleting the active class        | Fixed   |
| WR-03 | `onBlur` rename commit races with delete button click     | Open (not in gap-closure scope) |
| IN-01 | Escape-key overlay dismissal test absent                  | Open (not in gap-closure scope) |
| IN-02 | `var` keyword in `deleteKlas`                             | Open (not in gap-closure scope) |

Note: WR-03, IN-01, and IN-02 were not in scope for the gap-closure plan (33-03) and remain open from the original review.

---

## Critical Issues

No new critical issues from gap-closure review.

---

## Warnings

### WR-04: Students with missing `leerlingId` are silently undercounted

**File:** `utils/klassen.ts:262`

**Issue:** `countUniekeLeerlingen` maps each student record to `s.leerlingId`. If any record lacks a `leerlingId` field, `s.leerlingId` is `undefined`. All such records map to the same Set key (`undefined`), so they collapse into a single count of 1 instead of being counted individually or signalled as an error. In a class of 10 students where 3 have a corrupt/missing `leerlingId`, the modal would display 8 instead of 10 (or instead of surfacing the data problem).

The existing defensive `!Array.isArray` guard at line 261 handles the non-array case correctly, but there is no guard for records with missing `leerlingId`.

**Fix:** Filter out records with a falsy `leerlingId` before building the Set, and optionally log a warning in development builds:

```ts
export function countUniekeLeerlingen(students: any): number {
  if (!Array.isArray(students)) return 0;
  const validIds = students
    .map((s: any) => s.leerlingId)
    .filter((id): id is string => Boolean(id));
  return new Set(validIds).size;
}
```

This makes the count reflect students with a valid identity, which is the correct semantics for a delete confirmation ("you are about to delete N identifiable students").

---

## Info

### IN-03: Test suite does not cover missing or null `leerlingId`

**File:** `tests/klassen.uniekeLeerlingen.test.ts`

**Issue:** The 5 tests cover the happy path (deduplication by leerlingId) and the non-array guard (`undefined` input), but there is no test for:
- A record array where one or more entries lack the `leerlingId` field (e.g. `[{ naam: 'x' }]`)
- A record array where `leerlingId` is explicitly `null`
- Other falsy non-array inputs: `null`, `{}`, `0`, `"string"`

The missing-`leerlingId` case is precisely the scenario described in WR-04. Without a test for it, the behaviour (currently: silent undercounting) is invisible.

**Fix:** Add tests:

```ts
it('geeft 0 bij null input', () => {
  expect(countUniekeLeerlingen(null)).toBe(0);
});

it('telt records zonder leerlingId niet mee', () => {
  const students = [
    { leerlingId: 'a' },
    { naam: 'geen-id' },   // leerlingId absent
    { leerlingId: null },  // leerlingId null
  ];
  // After WR-04 fix: should be 1 (only 'a' is valid)
  expect(countUniekeLeerlingen(students)).toBe(1);
});
```

---

## Preserved original findings (for reference)

The full text of the original findings (CR-01 through IN-02) is retained below unchanged.

---

### CR-01: `onKeyDown` on non-focusable overlay div — Escape key never fires *(FIXED)*

**File:** `src/components/KlasVerwijderenModal.tsx:27-38`

**Issue:** `handleOverlayKeyDown` was attached via `onKeyDown` to the backdrop `<div>`. A plain `<div>` without `tabIndex` or `role="dialog"` cannot receive keyboard focus, so it would never be part of the browser focus chain. The handler was therefore permanently dead code in production.

**Fix applied:** Escape handler attached to `window` via `useEffect` (commit `3f37baa`).

---

### WR-01: `canDelete` prop declared but never read *(FIXED)*

**File:** `src/components/KlasTabStrip.tsx` / `src/App.tsx`

**Issue:** `canDelete` was declared in the interface but the render path never checked it; the delete button was unconditionally rendered.

**Fix applied:** `canDelete` removed from interface and `App.tsx` mapping (commit `9b9f986`).

---

### WR-02: No view transition after deleting the active class *(FIXED)*

**File:** `src/App.tsx:137-146`

**Issue:** `handleConfirmDeleteKlas` only switched view to `'import'` when no classes remained. Deleting the active class while on `detail` view left the user on a detail for a deleted student.

**Fix applied:** `wasActive` guard added; navigates to `'klas'` when active class is deleted and remaining classes exist (verified at `App.tsx:143-148`).

---

### WR-03: `onBlur` on rename input commits on focus-loss to delete button *(Open)*

**File:** `src/components/KlasTabStrip.tsx:95`

**Issue:** Rename `onBlur` fires `commitRename` before the delete handler when the user tabs from the rename input directly to the delete button on the same tab, producing an unintended rename before deletion.

**Fix:** Detect `relatedTarget` belonging to same tab and skip the commit, or convert `onBlur` to a discard. See original review for full code snippet.

---

### IN-01: Escape-key overlay dismissal test absent *(Open)*

**File:** `tests/KlasVerwijderenModal.test.tsx`

**Issue:** No test covers Escape-key dismissal or backdrop-click dismissal. See original review for test stubs.

---

### IN-02: `var` keyword in `deleteKlas` *(Open)*

**File:** `utils/klassen.ts:100`

**Issue:** `var remainingIds` uses `var` while the rest of the codebase uses `const`/`let`.

**Fix:** `const remainingIds = Object.keys(klassenState.klassen);`

---

_Reviewed: 2026-05-30T00:00:00Z_
_Gap-closure reviewed: 2026-05-30T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
