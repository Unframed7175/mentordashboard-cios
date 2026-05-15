---
phase: 14-react-ui
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - src/utils/status.ts
  - tests/status.test.ts
  - src/App.tsx
  - src/components/ImportPage.tsx
  - src/components/KlasTabStrip.tsx
  - src/components/KlasModal.tsx
  - src/components/LeerlingTegel.tsx
  - src/components/KlasOverzicht.tsx
  - src/components/DetailWeergave.tsx
  - src/components/DoortstroomPrognoseSection.tsx
  - src/components/VerzuimSection.tsx
  - src/components/VakkenSection.tsx
  - src/components/FeedbackActiepuntenSection.tsx
  - src/components/NotitiesTextarea.tsx
  - src/components/SpiderChartCard.tsx
  - src/components/DeelgebiedenMatrix.tsx
  - src/components/AanvullendSection.tsx
  - src/components/StageSection.tsx
  - src/components/LeerlijnenSection.tsx
  - src/components/DetailWeergave.tsx
findings:
  critical: 7
  warning: 9
  info: 5
  total: 21
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-05-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Reviewed the full React UI layer for phase 14 (original 16 files) plus the three gap-closure components added in plan 06 (`AanvullendSection`, `StageSection`, `LeerlijnenSection`) and the updated `DetailWeergave` orchestrator.

Key concerns inherited from the original review remain (direct prop mutation, `dangerouslySetInnerHTML`, concurrent saves, stale singleton reads). The gap-closure files introduce two new critical issues:

1. **`AanvullendSection` mutates a merged copy that is disconnected from the persisted data array.** When `DetailWeergave` creates a spread-merged student object (verzuim inheritance path), `AanvullendSection` mutates that copy's fields and calls `saveKlassen()`. Because `klassenState.klassen` holds the original array reference — not the merged copy — the mutation is silently lost after the next load.
2. **`StageSection` reads `klassenState` singleton without subscribing**, showing data from the previously active class after a class switch if the component is not fully remounted.

---

## Critical Issues

### CR-01: `dangerouslySetInnerHTML` with unsanitized SVG string

**File:** `src/components/SpiderChartCard.tsx:31`
**Issue:** The SVG markup returned by `SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar)` is injected directly into the DOM via `dangerouslySetInnerHTML`. The `axes` array is built from `dg.label` values originating from parsed PDF text (via `DEELGEBIEDEN`). If a malicious PDF ever supplies a crafted label containing `</svg><script>…</script>`, or if `buildSpiderSVG` concatenates any score/label value without escaping, arbitrary HTML executes in the Tauri WebView context. Tauri's CSP mitigates this in production but does not eliminate the pattern, and local-file WebViews have historically had weaker CSP enforcement than remote origins.
**Fix:** Either (a) render the SVG using React SVG elements so React escapes all interpolated values, or (b) sanitize the string before injection:
```tsx
import DOMPurify from 'dompurify';
// …
const safe = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
return (
  <div className="spider-card" style={{ maxWidth: '180px' }}>
    <div dangerouslySetInnerHTML={{ __html: safe }} />
    …
  </div>
);
```

---

### CR-02: Direct prop mutation in `NotitiesTextarea`

**File:** `src/components/NotitiesTextarea.tsx:19-26` and `:43`
**Issue:** The component mutates `student.notitie` directly on the prop object (`student.notitie = parsed[leerlingId]` on line 19–26, and `student.notitie = v` on line 43). The `student` object is owned by the parent (`DetailWeergave`), which got it from `getAllRecordsForStudent()`. Mutating it in place means:
- React will not detect the change (no state update in the owner), so a re-render of `DetailWeergave` triggered by navigation will re-read a now-corrupted in-memory object.
- If `DetailWeergave` is re-rendered due to navigation (prev/next student) before the 500 ms debounce fires, the queued `saveKlassen()` will write whatever was last assigned to the closed-over `student` object, which may already refer to a different student's record.

In the lazy-init function (lines 14–29), writing `student.notitie = parsed[leerlingId]` is also a side effect inside a `useState` initializer, which React may call more than once in Strict Mode.
**Fix:** Remove all direct mutations; propagate changes through the data layer:
```tsx
// In onChange handler:
// Instead of: student.notitie = v;
// Call a dedicated setter that updates the record in the data model:
import { setStudentNotitie } from '../../utils/datamodel';
// …
timerRef.current = setTimeout(async () => {
  setStudentNotitie(student.leerlingId, v);
  await saveKlassen();
  setHint('saved');
  setTimeout(() => setHint('idle'), 1500);
}, 500);
```
The legacy migration code in the `useState` initializer should be moved into a one-time effect or a dedicated migration utility that does not mutate the prop.

---

### CR-03: Direct prop mutation in `DetailWeergave` (verzuim inheritance)

**File:** `src/components/DetailWeergave.tsx:34`
**Issue:** When the most-recent student record lacks verzuim data, the component uses `{ ...student, verzuim: { ...records[i].verzuim } }` — which creates a new object and is safe for the verzuim field itself. However, the resulting merged object is passed to `AanvullendSection` (and other child components). If `AanvullendSection` or `NotitiesTextarea` mutate this merged copy (both do — see CR-02 and CR-06), those mutations land on the merged local variable, not on the underlying record inside `klassenState.klassen[id].students`. When `saveKlassen()` is subsequently called, it serializes the original array, silently discarding the taalniveau/rekenniveau/notitie changes written to the merged copy.

This means: any student whose most-recent record lacks a `verzuim` block will silently lose `taalniveau`, `rekenniveau`, and notitie edits after a page reload.
**Fix:** Either (a) avoid creating a merged copy and instead fix the verzuim fallback to not break the reference chain, or (b) write mutations directly into the underlying array element rather than into the merged copy:
```tsx
// Option A: find the index and update the array element in-place instead of creating a new object
const idx = records.length - 1;
if (!records[idx].verzuim) {
  for (let i = idx - 1; i >= 0; i--) {
    if (records[i].verzuim) {
      records[idx].verzuim = { ...records[i].verzuim };
      break;
    }
  }
}
const student = records[idx]; // still the original array reference
```

---

### CR-04: Concurrent `saveKlassen()` calls with no mutex in `ImportPage`

**File:** `src/components/ImportPage.tsx:209-211`
**Issue:** `handleFiles` can invoke `handlePDFs`, `handleExcel`, and `handleBackup` all in the same synchronous call when the drop contains a mix of file types. Each function independently calls `saveKlassen()` at its conclusion, and `saveKlassen` writes to the Tauri plugin-store. Depending on the store's implementation, concurrent writes can interleave, with one write overwriting or corrupting the other. The backup restore path is especially dangerous: `applyBackupRestore` sets in-memory state on line 136 and then `saveKlassen()` is called on line 143, but if a concurrent PDF import was mid-flight and calls `addStudent` after the restore cleared the state, the store will contain a mixed state.
**Fix:** Serialize the three handlers. The simplest approach is to make `handleFiles` async and await each handler in sequence, or to disable multi-type drops:
```tsx
async function handleFiles(fileList: FileList) {
  // … categorize files …
  if (backup) { await handleBackup(backup); return; }  // backup is exclusive
  if (pdfs.length > 0) await handlePDFs(pdfs);
  if (excel) await handleExcel(excel);
}
```
Also add a guard: if `status === 'processing'`, reject new drops.

---

### CR-05: `schooljaar` field collected but silently discarded

**File:** `src/components/KlasModal.tsx:11` and `:23`
**Issue:** `schooljaar` state is bound to an input field (line 94–97) but `createKlas(naam.trim())` on line 23 receives only the class name — `schooljaar` is never passed. The user sees a "Schooljaar (optioneel)" input but whatever they enter has no effect on the created class record. This is a logic error: either the field should be passed to `createKlas`, or it should be removed from the UI to avoid misleading the user.
**Fix:** Pass `schooljaar` to `createKlas` if the function accepts it, or remove the field entirely:
```tsx
const result = await createKlas(naam.trim(), schooljaar.trim() || undefined);
```
If `createKlas` does not yet accept a `schooljaar` parameter, remove the input until the data model supports it.

---

### CR-06: `AanvullendSection` mutates prop object directly — data lost when student is a merged copy

**File:** `src/components/AanvullendSection.tsx:13`
**Issue:** `student[field] = value` mutates the `student` prop directly before calling `saveKlassen()`. This is intended to work because `student` is normally the same reference as the object inside `klassenState.klassen[id].students`, so the mutation reaches the array that `saveKlassen()` serializes.

However, when `DetailWeergave` creates a merged copy (`{ ...student, verzuim: ... }`) for the verzuim-inheritance path (lines 34–41 of `DetailWeergave`), the prop received by `AanvullendSection` is that copied object — not the original array element. Mutating `copied.taalniveau` does not update `klassenState.klassen[id].students[n].taalniveau`. When `saveKlassen()` runs it serializes the unchanged original, silently discarding the edit. On the next app reload the user's taalniveau/rekenniveau change is gone.

Even in the non-merge path, direct prop mutation is an anti-pattern: React's reconciler can call components with stale prop references, and concurrent rendering in React 18 can interleave renders.
**Fix:** Perform the mutation on the underlying array element, not on the prop reference, or use a dedicated setter:
```tsx
async function handleChange(field: 'taalniveau' | 'rekenniveau', value: string) {
  // Mutate the source record in the data store, not the local prop copy
  const klas = klassenState.klassen[klassenState.activeKlasId!];
  const rec = klas?.students?.find((s: any) => s.leerlingId === student.leerlingId);
  if (!rec) return;
  rec[field] = value;
  const saved = await saveKlassen();
  if (saved === false) return;
  if (timerRef.current) clearTimeout(timerRef.current);
  setHint('saved');
  timerRef.current = setTimeout(() => setHint('idle'), 1500);
}
```

---

### CR-07: `AanvullendSection` timeout not cleared on unmount — `setHint` called on unmounted component

**File:** `src/components/AanvullendSection.tsx:10-18`
**Issue:** `timerRef.current` is set via `setTimeout(() => setHint('idle'), 1500)` but there is no `useEffect` cleanup that cancels the timer when the component unmounts. If the user navigates to a different student (unmounting `DetailWeergave` and its children, or reusing the instance with a new student) within 1.5 seconds of saving, the timeout fires and calls `setHint('idle')` on a component that is either unmounted or now showing a different student. In React 18 strict mode, calling a state setter on an unmounted functional component produces a warning; in production it is a silent no-op but indicates a resource leak pattern.
**Fix:** Add a cleanup effect:
```tsx
useEffect(() => {
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, []);
```

---

## Warnings

### WR-01: `KlasTabStrip` reads singleton state directly, rendering stale tabs

**File:** `src/components/KlasTabStrip.tsx:11`
**Issue:** `klassenState.klassen` is read once per render from the imported singleton. The component has no subscription mechanism, so it will only reflect updates when React re-renders it via its parent. In `App.tsx`, `KlasTabStrip` receives `activeKlasId` as a prop but `klassenState.klassen` (the tab list) is read inside the component from the module-level singleton. If a class is added or deleted and React does not re-render `KlasTabStrip` for any reason (e.g., if `refreshKey` propagation is skipped), the tabs are stale. The `onCreated` callback in `App.tsx` calls `setRefreshKey` which does cause a parent re-render; however this is an implicit coupling. The same pattern in `KlasOverzicht` is at least documented.
**Fix:** Pass `klassen` as an explicit prop from `App.tsx`, derived from `klassenState.klassen` at the point where `refreshKey` is consumed:
```tsx
<KlasTabStrip
  klassen={Object.values(klassenState.klassen)}
  activeKlasId={klassenState.activeKlasId}
  onSwitch={handleKlasSwitch}
  onCreateKlas={() => setShowModal(true)}
/>
```

---

### WR-02: Keyboard accessibility missing Space key handler in `LeerlingTegel`

**File:** `src/components/LeerlingTegel.tsx:42-45`
**Issue:** The tile has `role="button"` and `tabIndex=0`, but the `handleKeyDown` handler only responds to `Enter`. WCAG 2.1 Success Criterion 2.1.1 requires that elements with `role="button"` respond to both `Enter` and `Space`. A keyboard user pressing Space on a tile will trigger a scroll event but not activate the tile.
**Fix:**
```tsx
function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); // prevent page scroll on Space
    onClick();
  }
}
```

---

### WR-03: Duplicate error list rendering in `ImportPage`

**File:** `src/components/ImportPage.tsx:280-293`
**Issue:** The JSX at lines 280–293 renders `errors` twice: once when `errors.length > 0 && status !== 'error'` and once when `status === 'error'`. When `status === 'error'` AND `errors.length > 0`, both conditions are true: `status !== 'error'` is false for the first block (correct), but consider the case where `status` transitions from `'processing'` to `'error'` after errors have already been added — the `errors` array carries over. More importantly, the two `<ul>` blocks are structurally identical. If the intent was to show the list only once regardless of status, one block is redundant and confusing. If the intent was to distinguish "partial errors during processing" from "fatal error", the UI gives no visual distinction and duplicates the elements.
**Fix:** Collapse into a single block that renders whenever `errors.length > 0`:
```tsx
{errors.length > 0 && (
  <ul>
    {errors.map((err, i) => (
      <li key={i} style={{ color: 'red' }}>{err}</li>
    ))}
  </ul>
)}
```

---

### WR-04: `berekenStatus` called once per render in a non-memoized loop in `KlasOverzicht`

**File:** `src/components/KlasOverzicht.tsx:28-30`
**Issue:** The `for` loop on lines 28–30 calls `berekenStatus(s)` for every student on every render. Because `KlasOverzicht` has no `useMemo`, every keystroke in the search field (which calls `setZoekTerm`) triggers a full recompute of statuses for all students. For a class of 30+ students, each `berekenStatus` call invokes `berekenPrognose` which performs non-trivial computation. This is currently both a correctness concern (the `statusMap` is rebuilt from scratch on every render even though the underlying data has not changed) and a potential source of rendering bugs if `berekenPrognose` has side effects.
**Fix:** Wrap the status computation in `useMemo` keyed on `allStudents`:
```tsx
const statusMap = useMemo(() => {
  const m = new Map<string, ReturnType<typeof berekenStatus>>();
  for (const s of allStudents) m.set(s.leerlingId, berekenStatus(s));
  return m;
}, [allStudents]);
```

---

### WR-05: `GrowthBadge` comparison direction is reversed

**File:** `src/components/DeelgebiedenMatrix.tsx:51-58`
**Issue:** `GrowthBadge` takes `score1` (oldest period) and `score2` (newest period). The growth arrow logic at line 56 shows `↑` when `r2 > r1`. `scoreRank` uses `SCORE_LEVELS.indexOf(score)`, so a higher index means a better score (`onvoldoende < voldoende < goed < excellent`). This means `↑` fires when the newest score is higher-ranked than the oldest, which is correct. **However**, line 52 reads: `if (score1 === null || score1 === undefined) return null;` — this suppresses the badge when the oldest score is unknown but shows it when only the newest is unknown (handled by `if (r2 < 0) return null` on line 55). The asymmetry means: a student who had no score in period 1 but now has a score in period 2 shows no growth badge, while a student who had a score in period 1 but has no score in period 2 (`r2 < 0`) also correctly shows nothing. The missing case is: when `score1` is null, the comparison is not meaningful, so the early return is correct. But the code on line 52 uses `=== null || === undefined` — it does **not** handle the case where `score1` is the string `'null'` or a falsy non-null value like `''`. Given that `scores1[dg.label] || null` (line 165) normalizes empty strings to `null` correctly, this is acceptable — but the `GrowthBadge` would display `=` if both `score1` and `score2` are some unexpected non-null falsy value, which is a fragile assumption.

More practically: `score1` is passed as `scores1[dg.label] || null` (line 165). If `dg.label` is missing from `scores1`, this evaluates to `null`, and `GrowthBadge` returns `null` (no badge). This is safe. No immediate bug, but the dual-null check at line 52 vs the single check at line 55 is inconsistent.

**Fix:** Unify the guard:
```tsx
function GrowthBadge({ score1, score2 }: { ... }) {
  const r1 = scoreRank(score1);
  const r2 = scoreRank(score2);
  if (r1 < 0 || r2 < 0) return null; // no badge if either is unknown
  if (r2 > r1) return <span …>↑</span>;
  if (r2 < r1) return <span …>↓</span>;
  return <span …>=</span>;
}
```

---

### WR-06: `onImportComplete` called even when partial errors occurred (PDF path)

**File:** `src/components/ImportPage.tsx:84`
**Issue:** In `handlePDFs`, `onImportComplete?.()` is called as long as `saveKlassen()` succeeds — even if `skipped > 0` and `succeeded === 0`. If every single PDF failed to parse (all throw), `succeeded === 0` and `skipped === files.length`, but the function still calls `onImportComplete()` and switches the view to `'klas'`, showing an empty class grid. This misleads the user into thinking the import worked.
**Fix:** Conditional call based on `succeeded > 0`:
```tsx
if (succeeded > 0) {
  onImportComplete?.();
} else {
  // Stay on import page; errors are already displayed
}
```

---

### WR-07: `FeedbackActiepuntenSection` initializes from `actiepuntenStore.list()` once and does not re-sync on `leerlingId` change

**File:** `src/components/FeedbackActiepuntenSection.tsx:20`
**Issue:** `useState(() => actiepuntenStore.list(leerlingId))` initializes the list lazily from the store for the given `leerlingId`. If `DetailWeergave` re-uses the same mounted `FeedbackActiepuntenSection` instance and the parent changes `leerlingId` (via prev/next navigation), the `useState` initializer does **not** re-run. The component will display the old student's action points for the new student until a `reloadList()` is triggered by a user action.

In `DetailWeergave`, navigation only changes `activeStudentId` in `App.tsx`, which causes `DetailWeergave` to re-render with a new `leerlingId`. Whether `FeedbackActiepuntenSection` re-mounts depends on React's reconciliation — because `DetailWeergave` renders `<FeedbackActiepuntenSection leerlingId={leerlingId} />` without a key, React may keep the same instance and only pass the new prop, leaving the `useState` stale.
**Fix:** Add a `useEffect` that syncs on `leerlingId` change:
```tsx
useEffect(() => {
  setActiepunten(actiepuntenStore.list(leerlingId));
  setEditingId(null);
  setFormState(EMPTY_FORM);
}, [leerlingId]);
```

---

### WR-08: `StageSection` reads `klassenState` singleton without subscribing — shows stale class data

**File:** `src/components/StageSection.tsx:16`
**Issue:** `klassenState.activeKlasId` and `klassenState.klassen[...]` are read directly from the module-level singleton on every render. There is no subscription or prop-driven re-render trigger. If the active class is switched (e.g., user clicks a different tab in `KlasTabStrip`), and React does not fully unmount/remount `DetailWeergave` and its children, `StageSection` will continue reading `stageData` from the previously active class. The student whose detail view is open may not even exist in the newly active class, but `stageData[student.leerlingId]` could coincidentally resolve to a different student's stage data if `leerlingId` values overlap across classes.
**Fix:** Pass `stageData` as an explicit prop from `DetailWeergave` (which already has `student` and can look up the active klas), eliminating the singleton dependency inside `StageSection`:
```tsx
// In DetailWeergave:
const klas = klassenState.activeKlasId ? klassenState.klassen[klassenState.activeKlasId] : null;
const stageData = klas?.stageData?.[leerlingId] ?? null;
// …
<StageSection student={student} stageData={stageData} />

// StageSection receives stageData as a prop, no singleton read needed
```

---

### WR-09: `LeerlijnenSection` renders `NaN` or `null` when leerlijn fields are undefined

**File:** `src/components/LeerlijnenSection.tsx:21-39`
**Issue:** `ll.voldoendeOfHoger`, `ll.onvoldoende`, `ll.onbeoordeeld`, and `ll.totaal` are read from `any`-typed objects without null/undefined guards. The `pct` calculation on line 21 uses `ll.totaal > 0` as a guard for the percentage, but the raw values `ll.voldoendeOfHoger`, `ll.onvoldoende`, and `ll.onbeoordeeld` are rendered directly in JSX (lines 33–39) without any fallback. If `berekenPrognose` ever returns a leerlijn object with a missing field (e.g., `onbeoordeeld` is `undefined` because the prognose path changed), the DOM will render the literal text `undefined`. The `{ll.voldoendeOfHoger}/{ll.totaal}` pattern will render `undefined/undefined` in the tile.
**Fix:** Apply nullish coalescing when rendering:
```tsx
<span className="leerlijn-stat">
  {ll.voldoendeOfHoger ?? 0}/{ll.totaal ?? 0} &ge;V
</span>
<span className="leerlijn-stat" style={onvoldoendeStyle}>
  {ll.onvoldoende ?? 0} O
</span>
<span className="leerlijn-stat" style={{ color: 'var(--text-faint)' }}>
  {ll.onbeoordeeld ?? 0} ?
</span>
```

---

## Info

### IN-01: `normalizeScore` imported but never used in `DeelgebiedenMatrix`

**File:** `src/components/DeelgebiedenMatrix.tsx:4`
**Issue:** `normalizeScore` is imported from `../../utils/schema` but not referenced anywhere in the file.
**Fix:** Remove it from the import:
```tsx
import { DEELGEBIEDEN, SCORE_LEVELS } from '../../utils/schema';
```

---

### IN-02: `schooljaar` / `setSchoolyear` naming mismatch in `KlasModal`

**File:** `src/components/KlasModal.tsx:11`
**Issue:** The state variable is named `schooljaar` (Dutch) but the setter is named `setSchoolyear` (English). This inconsistency suggests a copy-paste error and will confuse future maintainers.
**Fix:**
```tsx
const [schooljaar, setSchooljaar] = useState('');
```

---

### IN-03: `appState` imported but not used in `tests/status.test.ts`

**File:** `tests/status.test.ts:8` and `:49`
**Issue:** `appState` is imported from `../utils/datamodel` and referenced in `beforeEach` as `appState.students = []`. This reset may be a leftover from tests that directly inspect `appState`; `berekenStatus` and `detectTraject` do not read `appState.students` — they operate solely on the passed `student` argument. The `beforeEach` reset is therefore a no-op for the tests in this file.
**Fix:** Remove the import and the `beforeEach` block, or document why the reset is needed (e.g., if `addStudent` is called indirectly and the test wants to ensure isolation).

---

### IN-04: `prognose: any` type in `StatusResult` interface

**File:** `src/utils/status.ts:50`
**Issue:** The `prognose` field is typed as `any`, losing all type-checking benefits for the object returned by `berekenPrognose`. Downstream components (e.g., `DoortstroomPrognoseSection`, `LeerlijnenSection`) access `p.totaalVoldoendeOfHoger`, `p.gaps.nodigSBL`, `p.leerlijnen`, etc. — none of these accesses are type-checked. This is a contributing factor to the `LeerlijnenSection` undefined-field risk flagged in WR-09.
**Fix:** Define a `PrognoseResult` interface in `utils/prognosis.ts` (or in `status.ts`) and use it:
```ts
export interface StatusResult {
  kleur:    StatusKleur;
  label:    string;
  prognose: PrognoseResult;  // typed, not any
}
```

---

### IN-05: `AanvullendSection` and `StageSection` prop typed as `any`

**File:** `src/components/AanvullendSection.tsx:5`, `src/components/StageSection.tsx:4`
**Issue:** Both components declare `student: any` in their props interface, discarding all compile-time safety for student field access. `AanvullendSection` accesses `student.taalniveau`, `student.rekenniveau`, and `student.leerlingId`; `StageSection` accesses `student.leerlingId`. These fields should be typed via the shared `StudentRecord` interface (or equivalent) from the data model.
**Fix:** Import and use the shared student type:
```tsx
import type { StudentRecord } from '../../utils/schema';
interface AanvullendSectionProps {
  student: StudentRecord;
}
```

---

_Reviewed: 2026-05-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
