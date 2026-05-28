---
phase: 25
fixed_at: 2026-05-22T08:07:50Z
review_path: .planning/phases/25-doorstroomnorm-configuratie/25-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 25: Code Review Fix Report

**Fixed at:** 2026-05-22T08:07:50Z
**Source review:** .planning/phases/25-doorstroomnorm-configuratie/25-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: Stale closure in handleNormenBlur

**Files modified:** `src/components/SettingsPage.tsx`
**Commit:** f388001
**Applied fix:** All 8 norm input `onBlur` handlers changed from `() => handleNormenBlur('field', normen.field, min, max)` to `e => handleNormenBlur('field', Number((e.target as HTMLInputElement).value), min, max)`. This reads the live DOM value at blur time instead of the React state snapshot, eliminating the stale closure bug.

---

### WR-01: loadNormen resets ALL fields when ANY single field is invalid

**Files modified:** `utils/normen.ts`
**Commit:** 66ac1a4
**Applied fix:** Replaced the all-or-nothing early-return validation with per-field clamping using a local `isValid(v, min, max)` helper. Each field now falls back to its `DEFAULT_NORMEN` value individually. The object is built as a single `validated` constant and assigned to `_cache` once.

---

### WR-02: debugPrognose uses hardcoded thresholds

**Files modified:** `utils/prognosis.ts`
**Commit:** 33140fe
**Applied fix:** Added `const n = getNormenSync();` at the top of `debugPrognose` and replaced all hardcoded threshold literals (13, 15, 4, 3, 5) in the console output strings with `n.bj1Positief`, `n.sbl`, `n.sbc`, `n.versneldLesgeven`, `n.versneldOrganiseren`, `n.versneldProfHandelen`. `getNormenSync` was already imported at the module level.

---

### WR-03: ruimte <= 1 hardcoded sentinel in DoortstroomPrognoseSection

**Files modified:** `src/components/DoortstroomPrognoseSection.tsx`
**Commit:** dcc6b73
**Applied fix:** Changed `ruimte <= 1` to `ruimte <= Math.max(1, Math.ceil(n.negatiefTotaal * 0.25))`. The function already called `getNormenSync()` so `n` was available. With the default `negatiefTotaal=6` the threshold becomes `Math.ceil(6 * 0.25) = 2`, giving a warning when 2 or fewer O remain.

---

### WR-04: loadNormen missing field handling

**Files modified:** `utils/normen.ts`
**Commit:** 66ac1a4
**Applied fix:** Each field in the `validated` object now has an inline comment: `// Number.isFinite(undefined) === false — safe for missing fields from older schemas`. Also added a block comment above `isValid` explaining the schema-evolution safety property. Committed atomically with WR-01 since both changes are in the same function.

---

### WR-05: onNormenChanged fires even when saveNormen returns false

**Files modified:** `src/components/SettingsPage.tsx`
**Commit:** f388001
**Applied fix:** `handleNormenBlur` now returns early (before calling `onNormenChanged`) when `ok === false`, and calls `setSaveError('Opslaan mislukt. Probeer het opnieuw.')`. A `saveError: string | null` state was added. An `<p role="alert">` element renders the error below the "Doorstroomdrempels" section heading and clears on next successful save or on `handleResetNormen`. Committed atomically with CR-01 since both changes are in the same file and same handler.

---

_Fixed: 2026-05-22T08:07:50Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
