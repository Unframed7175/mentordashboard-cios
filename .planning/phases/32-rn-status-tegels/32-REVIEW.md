---
phase: 32-rn-status-tegels
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/components/LeerlingTegel.tsx
  - tests/LeerlingTegel.test.tsx
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 32: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed the Phase 32 R&N status row addition to `LeerlingTegel.tsx` and its accompanying test file. The feature logic is straightforward and the implementation is correct for the happy path. Two quality defects were found: an unused import (`RAG_BORDER`) that has been dead since at least Phase 31, and the `rnRow` `<div>` reusing the `score-telling` CSS class which causes a semantic collision. One test-coverage gap is noted at info level.

---

## Warnings

### WR-01: Dead import — `RAG_BORDER` imported but never referenced

**File:** `src/components/LeerlingTegel.tsx:8`
**Issue:** `RAG_BORDER` is imported from `../utils/status` but is not used anywhere in the component. The component derives its border colour at line 101 via a CSS custom property (`var(--rag-${status.kleur}, var(--rag-grijs))`), making `RAG_BORDER` entirely redundant. Dead imports increase bundle size in non-tree-shakeable bundler configurations and mislead future readers into believing the constant is actively consumed.
**Fix:** Remove `RAG_BORDER` from the import statement:
```tsx
import { StatusResult } from '../utils/status';
```

---

### WR-02: `rnRow` reuses `score-telling` CSS class — unintended style coupling

**File:** `src/components/LeerlingTegel.tsx:91`
**Issue:** The R&N status row is rendered as `<div className="score-telling">`. The `score-telling` class is already used by the *score-telling block* (line 71) which carries `aria-label`, trend arrows, and intentional typography tied to the deelgebied score. Sharing the class couples two semantically distinct elements to the same style rules. If `score-telling` is ever restyled (e.g., font-weight, margin, colour) to adjust the prognosis row, the R&N row will silently change appearance too — and vice versa. There is no `aria-label` on the rnRow div, which also means screen readers get no contextual label for this row.

**Fix:** Give the R&N row its own class and add an accessible label:
```tsx
const rnRow: React.ReactNode = rnParts.length > 0
  ? (
    <div
      className="rn-status-row"
      aria-label={`Resultaten: ${rnParts.join(', ')}`}
    >
      {rnParts.join(' · ')}
    </div>
  )
  : null;
```
Add `.rn-status-row` to the stylesheet with whatever inherited or explicit styling is appropriate, keeping it decoupled from `.score-telling`.

---

## Info

### IN-01: Test for TEGEL-04 uses a regex that would miss some edge cases

**File:** `tests/LeerlingTegel.test.tsx:55`
**Issue:** The "verbergt de rij volledig" test asserts `screen.queryByText(/^R |^N |· N/)` returns null. This regex tests that no text *starting with* `R ` or `N ` or containing `· N` appears. However, it would not catch a rendering bug where the rnRow div were rendered with an empty string or a lone separator `·`. The test is sufficient for the implemented code path but is not exhaustive against regression variants where `rnParts.join(' · ')` is called on an empty array (which yields `""`) — the current guard `rnParts.length > 0` prevents that, but the test would not catch it if that guard were accidentally removed.
**Fix:** Add an assertion that no element with class `rn-status-row` (once WR-02 is fixed) or class `score-telling` containing `R` or `N` exists, or simply query by role/class to ensure the row is absent:
```tsx
expect(document.querySelector('.rn-status-row')).toBeNull();
```

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
