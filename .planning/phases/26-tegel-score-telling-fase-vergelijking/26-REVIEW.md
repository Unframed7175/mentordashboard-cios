---
phase: 26-tegel-score-telling-fase-vergelijking
reviewed: 2026-05-23T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/LeerlingTegel.tsx
  - src/index.css
  - src/components/KlasOverzicht.tsx
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 26: Code Review Report

**Reviewed:** 2026-05-23
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 26 adds a score-telling line and a trend arrow to each student tile in `LeerlingTegel.tsx`, and computes per-student trend direction in `KlasOverzicht.tsx` by comparing oldest vs newest period records. The CSS in `index.css` ships the matching `.score-telling` and `.trend-pijl` rules.

The core logic is mostly sound, but one critical crash path exists: `LeerlingTegel` unconditionally dereferences `status.prognose.totaalVoldoendeOfHoger` and `status.prognose.totaalOnvoldoende` without guarding against a `null` or `undefined` prognose object, and `StatusResult.prognose` is typed as `any` so the TypeScript compiler does not catch this. Several additional correctness and quality issues are documented below.

---

## Critical Issues

### CR-01: Unguarded `status.prognose` dereference crashes tile render

**File:** `src/components/LeerlingTegel.tsx:45-46`

**Issue:** Inside the `status.kleur !== 'grijs'` branch the component reads:
```ts
const totaalDeelgebieden =
  status.prognose.totaalVoldoendeOfHoger + status.prognose.totaalOnvoldoende;
```
`StatusResult.prognose` is typed `any` (see `src/utils/status.ts:48`). `berekenStatus` always returns a prognose object, but if a caller passes a synthetic or stale `StatusResult` where `prognose` is `null`, `undefined`, or an object that lacks those fields (e.g. a serialised snapshot from an older version without these keys), both reads will produce `NaN` or throw `TypeError: Cannot read properties of null`. Because the tile is rendered in a `sorted.map()` in `KlasOverzicht`, a single bad record crashes the entire grid, not just one tile.

**Fix:**
```tsx
// LeerlingTegel.tsx — score-telling block
if (status.kleur !== 'grijs' && status.prognose != null) {
  const v = status.prognose.totaalVoldoendeOfHoger ?? 0;
  const o = status.prognose.totaalOnvoldoende ?? 0;
  const totaalDeelgebieden = v + o;
  if (totaalDeelgebieden > 0) {
    // ... render scoreTelling as before
  }
}
```
Adding the `totaalDeelgebieden > 0` guard also prevents the degenerate display `"0/0 ≥V · 0 O"` for a student whose prognose is computed but has no active deelgebieden.

---

## Warnings

### WR-01: `totaalDeelgebieden` can be zero — renders nonsensical `"0/0 ≥V · 0 O"` string

**File:** `src/components/LeerlingTegel.tsx:46-64`

**Issue:** The guard `status.kleur !== 'grijs'` only excludes students without scores. A student could be non-grey (e.g. all deelgebieden disabled in Settings) while `totaalVoldoendeOfHoger + totaalOnvoldoende === 0`. In that case `totaalDeelgebieden` is `0` and the rendered text becomes `"0/0 ≥V · 0 O"` with a valid trend arrow, which is misleading. The `heeftScores` check in `berekenStatus` guards the `grijs` return based on the same sum, so this edge case is theoretically closed by the upstream status logic — but it is fragile and a defensive zero-check in the component is cheap insurance.

**Fix:** Add `&& totaalDeelgebieden > 0` to the condition that gates `scoreTelling` rendering (see CR-01 fix above).

---

### WR-02: Trend comparison uses alphabetical string sort for `periode` — brittle ordering

**File:** `src/components/KlasOverzicht.tsx:52`

**Issue:** `computeTrend` receives records pre-sorted by `getAllRecordsForStudent`, which sorts by `(a.periode || '').localeCompare(b.periode || '')`. The trend detection relies on `records[0]` being the oldest and `records[records.length - 1]` being the newest. The distinct-period guard at line 52 only checks that the first and last records have different `periode` values — it does not verify the sort is chronologically meaningful. Alphabetical sort of Dutch/school-year period strings (e.g. `"BJ1 P1"`, `"BJ1 P2"`, `"BJ2 P1"`) happens to work for common patterns, but strings such as `"P10"` would sort before `"P2"` (lexicographic), silently reversing the trend direction for students with ten or more periods.

**Fix:** Either enforce a numeric period suffix sort in `getAllRecordsForStudent`, or document the sort contract and add an explicit test. A minimal guard:
```ts
// In getAllRecordsForStudent or computeTrend:
// Replace .localeCompare with a natural-sort that parses the trailing number:
.sort((a, b) => {
  const num = (s: string) => parseInt(s.replace(/\D/g, '') || '0', 10);
  return num(a.periode || '') - num(b.periode || '');
})
```

---

### WR-03: Non-null assertion `statusMap.get(s.leerlingId)!` can crash the sort

**File:** `src/components/KlasOverzicht.tsx:105`

**Issue:** The sort comparator on line 105 uses:
```ts
const stA = statusMap.get(a.leerlingId)!;
const stB = statusMap.get(b.leerlingId)!;
```
`statusMap` is built from `getActiveStudents()` inside a `useMemo` that also calls `getActiveStudents()`. Both calls are independent. If the two calls return different student arrays (theoretically possible if `klassenState` mutates between calls due to a concurrent async save, or in future refactors), a `leerlingId` present in `allStudents` (the `filtered` source) may be absent from `statusMap`, making `.get()` return `undefined`. The `!` assertion suppresses the TypeScript error but the runtime dereference `STATUS_VOLGORDE[undefined!.kleur]` will throw. A fallback is cheap:
```ts
const stA = statusMap.get(a.leerlingId) ?? { kleur: 'grijs' as const, label: '', prognose: null };
```

---

### WR-04: `trendMap` dependency array uses `allStudents.length` — misses student record content changes within same class size

**File:** `src/components/KlasOverzicht.tsx:77-78`

**Issue:** Both `statusMap` and `trendMap` use `[refreshKey, allStudents.length]` as their `useMemo` dependencies. The comment on line 29-37 explains the rationale for avoiding the array reference. However, `allStudents.length` changes only when students are added or removed. If a student's scores are updated without changing the student count (e.g. an existing import for the same student is re-imported, updating scores in-place), `refreshKey` would increment — so for the normal import flow this is fine. But if any code path mutates `klassenState` student data without incrementing `refreshKey`, both memos will serve stale values silently. This is a fragility concern rather than a current bug, but `refreshKey` is not under `KlasOverzicht`'s control; it depends on callers always incrementing it. The dependency should be clearly documented, or the memos should accept an explicit `dataVersion` prop.

**Fix (minimal):** Add a comment asserting the invariant, or rename the prop to `dataVersion` to make the contract obvious to future callers.

---

## Info

### IN-01: `student` prop typed `any` — hides type errors in score-telling

**File:** `src/components/LeerlingTegel.tsx:11`

**Issue:** `interface LeerlingTegelProps` types `student` as `any`. All property accesses (`student.verzuim`, `student.naam`) are unchecked by the compiler. Given that Phase 26 adds new reads of `student.verzuim` paths and `status.prognose` paths, a proper type (or at minimum `{ naam: string; leerlingId: string; verzuim?: { aanwezigheid: number; geoorloofd: number; ongeoorloofd: number } }`) would have caught the CR-01 pattern at compile time.

**Fix:** Define and export a `StudentRecord` interface from `utils/klassen.ts` (which already has the shape in its data model) and use it here.

---

### IN-02: Duplicate `body.dark` block — dark-mode DeelgebiedenMatrix tokens split across two rules

**File:** `src/index.css:131` and `src/index.css:164`

**Issue:** There are two separate `body.dark { ... }` blocks. The first (lines 131-162) covers most dark-mode tokens; the second (lines 164-176) covers only `--dm-*` tokens. While CSS cascading makes this functionally correct (second block merges), it is a maintenance trap: developers adding new dark-mode tokens may place them in either block, creating inconsistency. No new Phase 26 tokens were added to dark mode — the `.score-telling` and `.trend-pijl` rules use `var(--text-muted)`, `var(--rag-groen)`, and `var(--rag-rood)`, which are already dark-mode-safe because `--rag-*` tokens are not overridden in dark mode (they remain vivid). This is an existing quality issue surfaced by the review, not introduced in Phase 26.

**Fix:** Merge the two `body.dark` blocks into one.

---

### IN-03: `console.log` left in production module

**File:** `utils/klassen.ts:265` (referenced from `KlasOverzicht.tsx` imports)

**Issue:** `console.log('[klassen.ts] Multi-class manager loaded')` fires on every module load. This is not inside the Phase 26 changed files but is reachable from every render that imports `klassen.ts`. Phase 26 adds `getAllRecordsForStudent` calls in `trendMap`, so this log fires on every app boot. It is a debug artifact that should be removed before production.

**Fix:** Remove the `console.log` on line 265 of `utils/klassen.ts`.

---

_Reviewed: 2026-05-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
