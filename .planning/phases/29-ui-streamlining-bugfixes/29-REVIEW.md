---
phase: 29-ui-streamlining-bugfixes
reviewed: 2026-05-28T09:42:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/components/DetailWeergave.tsx
  - src/components/DoortstroomPrognoseSection.tsx
  - src/components/RekenenNederlandsSection.tsx
  - src/index.css
  - tests/BpvProgressSection.test.tsx
  - tests/DoortstroomPrognoseSection.test.tsx
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 29: Code Review Report

**Reviewed:** 2026-05-28T09:42:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six files were reviewed covering the phase-29 DoortstroomPrognoseSection prognosis-block rewrite,
DetailWeergave revision-counter pattern, RekenenNederlandsSection dropdowns, CSS additions, and
two TDD test scaffolds.

The implementation is structurally sound. Two runtime crash paths were found: both in
`DoortstroomPrognoseSection` where array methods are called on fields that are absent in the BJ1
gaps object and may be absent in legacy serialized BJ2 records. Four warnings cover variable
shadowing, stale test commentary, a hardcoded hex surviving in print CSS, and a non-null assertion
that masks a valid null path. Three informational items address unused imports, a duplicate CSS
section number, and a pervasive `any` typing surface introduced by this phase.

---

## Critical Issues

### CR-01: Crash on BJ2 render when `p.gaps.nodigSBC_kern` is undefined or null

**File:** `src/components/DoortstroomPrognoseSection.tsx:204,217,218`

**Issue:** Lines 204, 217, and 218 access `.length` and `.includes()` directly on
`p.gaps.nodigSBC_kern` with no null guard:

```tsx
// line 202-205
overallNodig={Math.max(
  p.gaps.nodigSBC_deelgebieden,
  p.gaps.nodigSBC_kern.length          // ← crashes if undefined
)}

// lines 217-218
scoreDisplay={p.gaps.nodigSBC_kern.includes(kd) ? '< V' : '≥ V'}
nodig={p.gaps.nodigSBC_kern.includes(kd) ? 3 : 0}
```

`nodigSBC_kern` is populated only in the BJ2 branch of `berekenPrognose()` (prognosis.ts line 198).
For a student record whose `prognose.gaps` was serialized before this field was added (e.g. an
import from an earlier app version, or a partially-written store), the field will be `undefined`.
Because `DoortstroomPrognoseSection` is rendered unconditionally inside `DetailWeergave`, any
such student record causes a `TypeError: Cannot read properties of undefined (reading 'length')`
that crashes the entire detail view — React renders a white screen and the user cannot navigate
away without restarting the app.

The BJ2 render path is the `else` block (line 191 onward) entered whenever `traject !== 'bj1'`,
including the `detectTraject` fallback `'bj2'` for uncertain students.

**Fix:**
```tsx
overallNodig={Math.max(
  p.gaps.nodigSBC_deelgebieden ?? 0,
  (p.gaps.nodigSBC_kern ?? []).length
)}

// and the two CriterionRow props:
scoreDisplay={(p.gaps.nodigSBC_kern ?? []).includes(kd) ? '< V' : '≥ V'}
nodig={(p.gaps.nodigSBC_kern ?? []).includes(kd) ? 3 : 0}
```

---

### CR-02: `Math.max(undefined, undefined, undefined)` on BJ1 Versneld SBC block produces `NaN` — silent wrong rendering

**File:** `src/components/DoortstroomPrognoseSection.tsx:165-186`

**Issue:** The Versneld SBC block inside the BJ1 branch (lines 163-187) passes three gap fields
as `overallNodig` and as `nodig` for individual `CriterionRow` components:

```tsx
overallNodig={Math.max(
  p.gaps.nodigVersneld_lesgeven,       // undefined if gaps was serialized for BJ2 traject
  p.gaps.nodigVersneld_organiseren,
  p.gaps.nodigVersneld_profHandelen
)}
```

These fields exist only in the BJ1 gaps object (prognosis.ts lines 157-159). If a student's
prognose was computed for BJ2 (and their record was later re-loaded into a BJ1 class, or the
traject was ambiguous and later corrected), these fields are `undefined`. `Math.max(undefined, ...)` 
returns `NaN`. Inside `criterionStatus(NaN)`:

```tsx
if (nodig === 0) return 'groen';   // NaN === 0 → false
if (nodig <= 2) return 'oranje';   // NaN <= 2  → false
return 'rood';                     // always reached
```

The Versneld SBC block renders with a red left-border and a red ✗ chip for every criterion,
incorrectly signaling "student is failing Versneld SBC" when no data is available at all. The
scoreDisplay rows also render as `"undefined / 4"` etc. because the individual CriterionRow `nodig`
props and the `scoreDisplay` format strings use the same undefined fields.

No crash occurs (the undefined propagation is silent), but the visual output is factually wrong
and will mislead a mentor into taking action on a false red signal.

**Fix:** Apply `?? 0` to all three gap fields:
```tsx
overallNodig={Math.max(
  p.gaps.nodigVersneld_lesgeven      ?? 0,
  p.gaps.nodigVersneld_organiseren   ?? 0,
  p.gaps.nodigVersneld_profHandelen  ?? 0
)}

// And in each CriterionRow inside this block:
nodig={p.gaps.nodigVersneld_lesgeven      ?? 0}
nodig={p.gaps.nodigVersneld_organiseren   ?? 0}
nodig={p.gaps.nodigVersneld_profHandelen  ?? 0}

// ScoreDisplay strings will also need guarding:
scoreDisplay={`${llMap['lesgeven']?.goedOfHoger ?? 0} / ${bj1VersneldLesgeven}`}
// (already uses optional chain — this part is safe)
```

---

## Warnings

### WR-01: Variable shadowing — `status` parameter in `rnlNodig` hides the `StatusResult` prop

**File:** `src/components/DoortstroomPrognoseSection.tsx:93`

**Issue:** The component receives `{ student, status }` where `status: StatusResult`. An inner
function declared in the same render scope reuses the same identifier:

```tsx
function rnlNodig(status: ReturnType<typeof normalizeRekenScore>): number {
```

Inside `rnlNodig`, `status` refers to the parameter (a `'goed' | 'voldoende' | 'onvoldoende' | null`
string), completely hiding the outer `StatusResult` object. The function body happens not to
reference the outer `status`, so there is no bug today. However, any future edit that references
`status.prognose` inside `rnlNodig` will silently read the wrong value — TypeScript will accept it
because the parameter type is `any`-inferred at the call sites and the outer type is different.
A confused type error from the compiler in this situation would be very difficult to diagnose.

**Fix:** Rename the parameter to avoid the shadow:
```tsx
function rnlNodig(score: ReturnType<typeof normalizeRekenScore>): number {
  if (score === null) return 1;
  if (score === 'onvoldoende') return 3;
  return 0;
}
const rekenNodig     = rnlNodig(rekenStatus);
const nederlandsNodig = rnlNodig(nederlandsStatus);
```

---

### WR-02: Stale "TDD RED scaffold" comments — tests are already GREEN

**File:** `tests/DoortstroomPrognoseSection.test.tsx:1-7`, `tests/BpvProgressSection.test.tsx:1-5`

**Issue:** Both test files open with prominent comments stating:

```
// TDD RED scaffold: tests written before the block-layout implementation exists.
// All 7 tests are RED against the current DoortstroomPrognoseSection
```

and

```
// Tests 1 and 2 are RED against the current BpvProgressSection
```

All 10 tests across both files pass against the current shipped implementation (verified: 7/7 and
3/3). Leaving "all tests RED" comments in passing test files creates a false signal: a developer
reading these files will believe the component is not yet implemented, may assume the tests are
expected-to-fail skeletons, and may disable or delete them during cleanup. The comments also
reference implementation plans as "not yet shipped" which is no longer accurate.

**Fix:** Update file-level comments to reflect the current GREEN state:
```ts
// tests/DoortstroomPrognoseSection.test.tsx — Phase 29 (PROG-01)
// Regression tests for the prognose-block layout.
// All tests pass against the current DoortstroomPrognoseSection implementation.
```

---

### WR-03: Hardcoded hex `#009FE3` in print CSS — bypasses `var(--accent)` design token

**File:** `src/index.css:1434`

**Issue:**
```css
@media print {
  .print-header {
    border-bottom: 1.5px solid #009FE3;   /* ← hardcoded */
  }
}
```

Every other use of the CIOS Blue accent color in the file references `var(--accent)` (the token is
defined on line 36 as `--accent: #009FE3`). If the brand color is updated in the future, this
hardcoded value will be missed by any global token update. The project explicitly flags hardcoded
hex colors as bug category "UI-03".

This is inside a `@media print` block, so the dark-mode custom properties in `body.dark` do not
apply. Using `var(--accent)` here is still correct because `@media print` overrides do not
re-enter the dark theme scope.

**Fix:**
```css
border-bottom: 1.5px solid var(--accent);
```

---

### WR-04: Non-null assertion `klassenState.activeKlasId!` masks a valid null path

**File:** `src/components/RekenenNederlandsSection.tsx:21`

**Issue:**
```tsx
const klas = klassenState.klassen[klassenState.activeKlasId!];
```

`klassenState.activeKlasId` is typed as `string | null`. The `!` assertion tells TypeScript
"this is never null here", but no invariant enforces that. The component can be rendered before
klassen have loaded (e.g. on first launch before `loadKlassen()` resolves). The downstream
`klas?.students?.filter(...)` optional chain on line 26 and the `?? []` guard absorb the null
case silently — so there is no crash — but the non-null assertion communicates incorrect intent.
It also suppresses a legitimate TypeScript error that would otherwise flag any code added between
line 21 and line 26 that forgot to guard `klas`.

**Fix:** Replace the assertion with an explicit null guard:
```tsx
const klas = klassenState.activeKlasId
  ? klassenState.klassen[klassenState.activeKlasId]
  : null;
```

---

## Info

### IN-01: Unused `describe` import in both test files

**File:** `tests/BpvProgressSection.test.tsx:7`, `tests/DoortstroomPrognoseSection.test.tsx:6`

**Issue:** Both files import `describe` from `vitest` but never call it — all tests are written
as top-level `test(...)` calls. `beforeEach` is also imported in `DoortstroomPrognoseSection.test.tsx`
(line 6) but not used there (it is used in `BpvProgressSection.test.tsx`). These unused imports
generate linter warnings in strict mode and add noise to the import statement.

**Fix:**
```ts
// BpvProgressSection.test.tsx — remove describe
import { vi, test, expect, beforeEach } from 'vitest';

// DoortstroomPrognoseSection.test.tsx — remove describe and beforeEach
import { vi, test, expect } from 'vitest';
```

---

### IN-02: Duplicate section number 22 in CSS

**File:** `src/index.css:1139` and `src/index.css:1544`

**Issue:** Two CSS sections share the same comment number "22":
- Line 1139: `22. ImportPage`
- Line 1544: `22. FeedbackModal textarea`

The second occurrence should be a higher number. This makes navigating the file by section number
ambiguous and will cause confusion when a developer jumps to "section 22" to find ImportPage
styles.

**Fix:** Renumber the FeedbackModal textarea section to the next available number (30 or higher).

---

### IN-03: `student: any` on new phase-29 field access sites reduces type safety

**File:** `src/components/DoortstroomPrognoseSection.tsx:7`, `src/components/RekenenNederlandsSection.tsx:6`

**Issue:** Both components accept `student: any`. Phase 29 introduces the first component-layer
reads of `student.rekenResultaat` and `student.nederlandsResultaat`. With `any`, TypeScript cannot
catch a misspelling (e.g. `rekenResultaaat`), a null-without-guard access, or a future schema
rename. This is a project-wide pattern, not a phase-29 regression, but these two components are
the right insertion point for a minimal typed interface covering the new fields.

**Fix (optional):** Introduce a narrow interface for the fields actually accessed:
```ts
interface StudentRecord {
  leerlingId?: string;
  naam?: string;
  periode?: string;
  leerjaar?: string;
  rekenResultaat?: string | null;
  nederlandsResultaat?: string | null;
  verzuim?: { geoorloofd: number; ongeoorloofd: number; aanwezig: number } | null;
  [key: string]: unknown; // permit other fields without exhaustive typing
}
```
Replace `student: any` with `student: StudentRecord` in both components and in the
`DetailWeergave` variable `const student = records[idx]`.

---

_Reviewed: 2026-05-28T09:42:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
