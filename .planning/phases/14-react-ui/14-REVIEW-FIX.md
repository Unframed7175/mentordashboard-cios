---
phase: 14-react-ui
fixed_at: 2026-05-15T14:16:00Z
review_path: .planning/phases/14-react-ui/14-REVIEW.md
iteration: 2
findings_in_scope: 16
fixed: 16
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-05-15T14:16:00Z
**Source review:** .planning/phases/14-react-ui/14-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 16 (7 critical + 9 warning)
- Fixed: 16
- Skipped: 0

Note: Iteration 1 fixed CR-01 through CR-05 and WR-01 through WR-07. Iteration 2 fixed CR-06, CR-07, WR-08, WR-09, and strengthened CR-03 (changed from spread-merged copy to true in-place mutation).

## Fixed Issues

### CR-01: `dangerouslySetInnerHTML` with unsanitized SVG string

**Files modified:** `src/components/SpiderChartCard.tsx`
**Commit:** f4aa6b5
**Applied fix:** Renamed `svg` to `rawSvg`, then applied a lightweight inline script-tag strip (`rawSvg.replace(/<script[\s\S]*?<\/script>/gi, '')`) before passing to `dangerouslySetInnerHTML`. Added a comment documenting that `buildSpiderSVG` only embeds math-computed coordinates and sanitized CSS variable names (axis labels are NOT embedded in the SVG string), so the current risk is minimal — the strip is defence-in-depth for future utility changes. DOMPurify was NOT added as a dependency per project instructions.

---

### CR-02: Direct prop mutation in `NotitiesTextarea`

**Files modified:** `src/components/NotitiesTextarea.tsx`
**Commit:** 68a0904
**Applied fix:** Removed both direct `student.notitie = ...` mutations. The `useState` initializer was simplified to only read `student.notitie` (no side effects). The legacy localStorage migration was moved into a dedicated `useEffect` (keyed on `leerlingId`) that updates records via `getAllRecordsForStudent()` (which returns live references into `klas.students`, not copies) so the persisted data model is updated without mutating the prop object. The `onChange` debounce handler now similarly updates via `getAllRecordsForStudent()` rather than the prop.

---

### CR-03: Direct prop mutation in `DetailWeergave` (verzuim inheritance)

**Files modified:** `src/components/DetailWeergave.tsx`
**Commit:** 2fd454d (iteration 2 — strengthened fix)
**Applied fix:** Replaced spread-merged copy (`{ ...student, verzuim: ... }`) with in-place mutation of `records[idx].verzuim` on the original array element. `const student = records[idx]` now always holds the canonical reference that `saveKlassen()` serializes. The earlier iteration 1 fix (`{ ...records[i].verzuim }`) still created a disconnected merged object; this iteration 2 fix resolves the root cause.

---

### CR-04: Concurrent `saveKlassen()` calls with no mutex in `ImportPage`

**Files modified:** `src/components/ImportPage.tsx`
**Commit:** 1987aa9
**Applied fix:** Made `handleFiles` an `async` function that serializes the three handlers: backup is exclusive (awaited and returns early), then PDFs, then Excel — each awaited in sequence. Added an early return guard at the top of `handleFiles` that rejects new drops when `importState.status === 'processing'`. Also fixed WR-03 and WR-06 in the same commit (same file).

---

### CR-05: `schooljaar` field collected but silently discarded

**Files modified:** `src/components/KlasModal.tsx`
**Commit:** e8ec031
**Applied fix:** Confirmed `createKlas()` in `utils/klassen.ts` only accepts `naam: string` and has no `schooljaar` parameter. Removed the `schooljaar` state variable, its setter, and the entire "Schooljaar (optioneel)" input field from the UI. Added a comment in the JSX noting it should be re-added when the data model supports it.

---

### WR-01: `KlasTabStrip` reads singleton state directly, rendering stale tabs

**Files modified:** `src/components/KlasTabStrip.tsx`, `src/App.tsx`
**Commit:** 6a918c2
**Applied fix:** Updated `KlasTabStrip` to accept an explicit `klassen` prop (`Array<{ id: string; naam: string }>`) and removed the internal `Object.values(klassenState.klassen)` singleton read. Updated `App.tsx` to pass `klassen={Object.values(klassenState.klassen) as Array<{ id: string; naam: string }>}` at the call site, so the tab list is derived from singleton state at the point where `refreshKey` triggers the parent re-render — making the coupling explicit.

---

### WR-02: Keyboard accessibility missing Space key handler in `LeerlingTegel`

**Files modified:** `src/components/LeerlingTegel.tsx`
**Commit:** f13a749
**Applied fix:** Extended the `handleKeyDown` condition from `e.key === 'Enter'` to `e.key === 'Enter' || e.key === ' '`, and added `e.preventDefault()` to prevent the default page-scroll behaviour on Space. Satisfies WCAG 2.1 SC 2.1.1 for `role="button"` elements.

---

### WR-03: Duplicate error list rendering in `ImportPage`

**Files modified:** `src/components/ImportPage.tsx`
**Commit:** 1987aa9 (combined with CR-04, WR-06)
**Applied fix:** Collapsed the two conditional `<ul>` blocks (one guarded by `errors.length > 0 && status !== 'error'`, one by `status === 'error'`) into a single `{errors.length > 0 && (...)}` block that renders whenever the errors array is non-empty, regardless of status.

---

### WR-04: `berekenStatus` called once per render in a non-memoized loop in `KlasOverzicht`

**Files modified:** `src/components/KlasOverzicht.tsx`
**Commit:** 0b170b5
**Applied fix:** Updated the React import to include `useMemo`. Wrapped the `for` loop that builds `statusMap` in `useMemo(() => { ... }, [allStudents])` so the map is only recomputed when the student array reference changes — not on every `setZoekTerm` keystroke.

---

### WR-05: `GrowthBadge` comparison — asymmetric null guards

**Files modified:** `src/components/DeelgebiedenMatrix.tsx`
**Commit:** 2175ff9
**Applied fix:** Unified the guard: moved both `scoreRank()` calls before any early return, then used a single `if (r1 < 0 || r2 < 0) return null` to suppress the badge when either score is unknown. This is symmetrical and eliminates the inconsistency between the `score1 === null || score1 === undefined` check and the `r2 < 0` check.

---

### WR-06: `onImportComplete` called even when zero PDFs succeeded

**Files modified:** `src/components/ImportPage.tsx`
**Commit:** 1987aa9 (combined with CR-04, WR-03)
**Applied fix:** Wrapped the `onImportComplete?.()` call in `handlePDFs` with `if (succeeded > 0)`, so the view only switches to `'klas'` when at least one PDF was successfully parsed and saved.

---

### WR-07: `FeedbackActiepuntenSection` does not re-sync on `leerlingId` change

**Files modified:** `src/components/FeedbackActiepuntenSection.tsx`
**Commit:** 1cc9954
**Applied fix:** Added `useEffect` to the import (`useState, useEffect`). Added a `useEffect` block keyed on `[leerlingId]` that calls `setActiepunten(actiepuntenStore.list(leerlingId))`, `setEditingId(null)`, and `setFormState(EMPTY_FORM)` — placed after all `useState` declarations so `setFormState` is in scope. This ensures the component shows the correct student's action points when the parent navigates to a different student without unmounting.

---

### CR-06: `AanvullendSection` mutates prop object — data lost on merged copy

**Files modified:** `src/components/AanvullendSection.tsx`
**Commit:** 81135e3
**Applied fix:** `handleChange` now looks up the canonical record by `leerlingId` in `klassenState.klassen[activeKlasId].students` and mutates that record, not the `student` prop. Ensures changes persist even when the parent passes a non-identity reference (merged copy).

---

### CR-07: `AanvullendSection` timer not cleared on unmount

**Files modified:** `src/components/AanvullendSection.tsx`
**Commit:** 81135e3
**Applied fix:** Added `useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, [])` to clear the hint timer on unmount, preventing `setHint('idle')` from firing on an unmounted component.

---

### WR-08: `StageSection` reads singleton without subscribing

**Files modified:** `src/components/StageSection.tsx`, `src/components/DetailWeergave.tsx`
**Commit:** 2fd454d
**Applied fix:** `stageData` lookup (`klas?.stageData?.[leerlingId] ?? null`) moved into `DetailWeergave` which already imports `klassenState`. `StageSection` now accepts `stageData: any | null` as an explicit prop and no longer imports or reads `klassenState` directly.

---

### WR-09: `LeerlijnenSection` renders `undefined` text

**Files modified:** `src/components/LeerlijnenSection.tsx`
**Commit:** 80f1175
**Applied fix:** Applied `?? 0` nullish coalescing to `voldoendeOfHoger`, `onvoldoende`, `onbeoordeeld`, and `totaal` via local variables before use in JSX and the percentage calculation. Prevents `undefined` appearing in the DOM when `berekenPrognose` returns incomplete leerlijn objects.

---

## Verification

- TypeScript: `npx tsc --noEmit` — PASSED (0 errors)
- Tests: `npm test` — PASSED (43 passed, 5 skipped, 9/10 test files)

## Skipped Issues

None — all 16 in-scope findings were successfully fixed.

---

_Fixed: 2026-05-15T14:16:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
