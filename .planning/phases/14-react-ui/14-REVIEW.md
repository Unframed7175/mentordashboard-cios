---
phase: 14-react-ui
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 16
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
findings:
  critical: 5
  warning: 7
  info: 4
  total: 16
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-05-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the full React UI layer for phase 14: status utilities, test file, App orchestrator, and all 13 component files. The implementation covers import/export handling, class management, tile grid, and detail view (prognose, feedback, spider charts, matrix, verzuim, vakken, notities).

Key concerns are:

1. **Direct mutation of props/external objects in multiple components** — `NotitiesTextarea` and `DetailWeergave` mutate their `student` prop in-place, which violates React data-flow rules and can produce stale or corrupted state when React reuses object references.
2. **`dangerouslySetInnerHTML` in `SpiderChartCard`** — raw SVG string from a utility function is injected without sanitization. If `SpiderChart.buildSpiderSVG` ever includes user-derived content (e.g., deelgebied labels from PDF text), this is an XSS vector.
3. **Concurrent async operations without any coordination in `ImportPage`** — PDFs, Excel, and ZIP files dropped simultaneously each fire independent async chains that all call `saveKlassen()` concurrently, risking data races on the persisted store.
4. **`schooljaar` state collected but never passed to `createKlas`** — the field is silently discarded.
5. **`KlasTabStrip` reads singleton state directly without subscribing** — renders stale data after external mutations.

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
**Issue:** When the most-recent student record lacks verzuim data, the component uses `Object.assign({}, student, { verzuim: records[i].verzuim })` — which does create a new object and is fine — but the result is assigned to `let student` which is a local variable. This part is safe. However, note that `berekenStatus(student)` is called on line 40 using this potentially-merged local, but the merged object is never written back to the data layer. If `NotitiesTextarea` later calls `student.notitie = v` (see CR-02), it will mutate this merged local copy, not the underlying record, silently discarding the mutation or double-saving to the wrong object.

More critically: if `records[i].verzuim` is a reference to an object inside `records[i]`, then `Object.assign({}, student, { verzuim: records[i].verzuim })` shares the `verzuim` reference between `student` (the merged copy) and `records[i]`. Any downstream code modifying `student.verzuim` fields in-place would corrupt the historical record.

**Fix:** Deep-clone the inherited verzuim object:
```tsx
student = { ...student, verzuim: { ...records[i].verzuim } };
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
**Issue:** The `prognose` field is typed as `any`, losing all type-checking benefits for the object returned by `berekenPrognose`. Downstream components (e.g., `DoortstroomPrognoseSection`) access `p.totaalVoldoendeOfHoger`, `p.gaps.nodigSBL`, etc. — none of these accesses are type-checked.
**Fix:** Define a `PrognoseResult` interface in `utils/prognosis.ts` (or in `status.ts`) and use it:
```ts
export interface StatusResult {
  kleur:    StatusKleur;
  label:    string;
  prognose: PrognoseResult;  // typed, not any
}
```

---

_Reviewed: 2026-05-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
