---
phase: 18-settings-panel-advanced
reviewed: 2026-05-18T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/components/BpvProgressSection.tsx
  - src/components/DeelgebiedenMatrix.tsx
  - src/components/DetailWeergave.tsx
  - src/components/SettingsPage.tsx
  - src/components/SpiderChartCard.tsx
  - src/components/VerzuimSection.tsx
  - src/main.tsx
  - src/utils/status.ts
  - utils/bpv.ts
  - utils/deelgebieden.ts
  - utils/leerlijnen.ts
  - utils/prognosis.ts
  - utils/verzuimDrempels.ts
findings:
  critical: 3
  warning: 6
  info: 3
  total: 12
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-05-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 18 delivers the advanced settings panel (SET-03 through SET-06): deelgebieden rename/toggle, leerlijn reassignment, configurable verzuim thresholds, and BPV hours tracking with Excel import. The implementation follows established LazyStore patterns consistently and the sync/async cache model is sound. However, three critical defects were found: a key mismatch between the leerlijn option values stored in the settings dropdown and the values expected by the prognosis engine (renders every reassigned deelgebied invisible to prognosis), a fully-stubbed BPV Excel parser that silently returns empty data on every import attempt, and a `saveLeerlijnenMapping` cache invalidation strategy that breaks the sync accessor immediately after a save. Six additional warnings cover score lookup by mutable display label, stale-cache risk for DeelgebiedenMatrix/SpiderChartCard, missing success feedback on BPV import, an incorrect sign convention in the "Verschil" display, and unguarded negative-percentage math in VerzuimSection.

---

## Critical Issues

### CR-01: Leerlijn option value `profHandelen` does not match engine key `prof_handelen`

**File:** `src/components/SettingsPage.tsx:292`

**Issue:** The leerlijn dropdown for the "Prof. handelen" group emits the value `"profHandelen"` on change:

```tsx
<option value="profHandelen">Prof. handelen</option>
```

`handleLeerlijnChange` stores this string verbatim into the mapping via `saveLeerlijnenMapping`. The prognosis engine (`utils/prognosis.ts:57,113`) and the DeelgebiedenMatrix group-filter (`src/components/DeelgebiedenMatrix.tsx:73–75`) both exclusively match against the key `"prof_handelen"` (underscore, not camelCase). The SpiderChartCard filter also uses the `dg.group` values `'lesgeven' | 'organiseren' | 'prof_handelen'` (schema literals).

Consequence: any deelgebied a teacher reassigns to "Prof. handelen" via the settings UI will be stored as `"profHandelen"` in the persistence layer. From that point forward it is invisible to `telLeerlijnen()` — none of the three recognised leerlijn keys (`lesgeven`, `organiseren`, `prof_handelen`) match — so the deelgebied is silently dropped from every prognosis calculation, spider chart, and matrix column. This is a silent data-loss bug affecting the core academic output of the application.

**Fix:** Change the option value to match the engine's canonical key:

```tsx
<option value="prof_handelen">Prof. handelen</option>
```

No migration needed — saved `"profHandelen"` values will simply remain broken until the user re-selects the option after the fix, but no data is permanently lost because the underlying PDF scores are unaffected.

---

### CR-02: `parseBpvExcel` is a stub that always returns `{}` — BPV import silently does nothing

**File:** `utils/bpv.ts:155-159`

**Issue:** The BPV Excel import handler in SettingsPage calls `parseBpvExcel(buffer)` and merges its result into the existing store. The function body is a stub:

```ts
export function parseBpvExcel(buffer: ArrayBuffer): BpvData {
  // D-13: BPV Excel parser stubbed — replace when user supplies sample BPV Excel file
  void buffer;
  return {};
}
```

The return type is `BpvData` (not `BpvData | null`), so the caller's null-check `if (records === null || typeof records !== 'object')` always passes (an empty object is a non-null object). The merge `{ ...existing, ...records }` then writes the unchanged existing data back to the store, clears the error message, and silently succeeds. Users see no error and no indication that nothing was imported.

This is shipped as a visible user-facing feature (a button labelled "BPV-uren importeren" appears in the settings panel). Any teacher who presses it and selects a file will believe the import succeeded.

**Fix (short-term):** Make the stub communicate its incompleteness to the caller so the user sees an actionable error:

```ts
export function parseBpvExcel(_buffer: ArrayBuffer): BpvData | null {
  // D-13: parser not yet implemented — return null to surface error in UI
  return null;
}
```

And in `SettingsPage.tsx` line 209–211, the existing null-check already handles this correctly — it will display the "Onbekend BPV-bestandsformaat" error. The only additional change needed is the return type annotation from `BpvData` to `BpvData | null`.

**Fix (long-term):** Implement the parser using a library such as `xlsx` (SheetJS), mapping student IDs to `{ gerealiseerdeUren: number }` records.

---

### CR-03: `saveLeerlijnenMapping` clears `_cachedMapping` instead of updating it — sync accessor returns stale schema defaults after every settings save

**File:** `utils/leerlijnen.ts:81-83`

**Issue:** After a successful write, `saveLeerlijnenMapping` sets `_cachedMapping = null`:

```ts
export async function saveLeerlijnenMapping(mapping: any): Promise<boolean> {
  try {
    await store.set(LEERLIJNEN_STORE_KEY, JSON.stringify(mapping));
    await store.save();
    _cachedMapping = null;   // <-- cache cleared, not updated
    return true;
  } catch ...
}
```

All other persistence modules in this codebase (`bpv.ts`, `deelgebieden.ts`, `verzuimDrempels.ts`) follow the documented "instant-apply" pattern: they update the cache with the new value *before* the async write. `leerlijnen.ts` intentionally clears the cache after the write. This means:

1. `getLeerlijnenMappingSync()` — called in `telLeerlijnen()` on every prognosis calculation and in `DeelgebiedenMatrix` on every render — will return `buildDefault()` (the schema defaults, not the user's saved mapping) immediately after any save triggered from SettingsPage.
2. The user's custom leerlijn assignments are invisible to all sync consumers until the next full page load or until `getLeerlijnenMapping()` (async) is called again.

In practice, navigating from SettingsPage back to the student detail view triggers a re-render before the async re-fetch completes, so the prognosis and matrix will use stale schema defaults for that render cycle.

**Fix:** Apply the same instant-apply pattern used by the other modules:

```ts
export async function saveLeerlijnenMapping(mapping: Record<string, string>): Promise<boolean> {
  _cachedMapping = mapping; // instant-apply — sync accessor immediately reflects new value
  try {
    await store.set(LEERLIJNEN_STORE_KEY, JSON.stringify(mapping));
    await store.save();
    return true;
  } catch (e: any) {
    console.warn('[leerlijnen.ts] plugin-store write error:', e);
    return false;
  }
}
```

---

## Warnings

### WR-01: Score lookup in DeelgebiedenMatrix and prognosis uses mutable display label as key — renames break score correlation

**File:** `src/components/DeelgebiedenMatrix.tsx:145,160,169,187`; `utils/prognosis.ts:76`

**Issue:** Scores in `student.deelgebiedScores` and `datapunten[].scores` are keyed by the *original schema label* (e.g. `"V&A"`, `"MM"`). The matrix cell lookup uses:

```tsx
<DmChip score={dp.scores ? (dp.scores[dg.label] || null) : null} />
```

where `dg.label` is the *schema default label* (correct). However, the footer rows look up scores from `deelgebiedScores` using:

```tsx
<DmChip score={scores1[dg.label] || null} />
```

and `dg.label` here is the raw schema label because `allDG` is drawn from `DEELGEBIEDEN` (filtered). This is correct for unmodified labels, but the `labelById` map (built from the custom config) is only used for the column header `{labelById.get(dg.id) ?? dg.label}`. The actual score lookups bypass it and use `dg.label` directly, which happens to be the schema label — consistent with storage. However, this means the codebase has two different label concepts (`dg.label` = schema key, `labelById.get(dg.id)` = display label) that could diverge in confusing ways. If the score-storage convention ever changes to use custom labels, this will silently break.

More concretely: `aggregationDetail` from `aggregateDeelgebiedScores` is also keyed by the schema label, and the footer `Eindoordeel` row correctly reads `aggregationDetail[dg.label]`. The invariant comment in SpiderChartCard (line 22–23) documents this correctly. The risk is that a future developer uses `labelById.get(dg.id)` for a score lookup.

**Fix:** Add an explicit comment at each score-lookup site to make the key invariant unmissable, and consider a type alias:

```tsx
// INVARIANT: score keys are always schema labels (dg.label), never custom display labels
<DmChip score={scores1[dg.label] || null} />
```

---

### WR-02: `VerzuimSection` percentage sum can exceed 100% — stacked bar overflows container

**File:** `src/components/VerzuimSection.tsx:40-42`

**Issue:** The three percentages are computed independently with `Math.round`:

```ts
const pA = pct(v.aanwezigheid || 0);  // Math.round((deel / totaal) * 100)
const pG = pct(v.geoorloofd || 0);
const pO = pct(v.ongeoorloofd || 0);
```

`Math.round` applied to each part independently can produce a sum of 101% (classic rounding error). The three `width` percentages are then applied directly to flex children with `overflow: hidden` on the container, so the rightmost segment gets clipped rather than shown. This is a silent visual defect.

**Fix:** Compute the first two percentages normally, then derive the third as the remainder:

```ts
const pA = pct(v.aanwezigheid || 0);
const pG = pct(v.geoorloofd || 0);
const pO = Math.max(0, 100 - pA - pG); // remainder avoids rounding overflow
```

---

### WR-03: BPV import provides no success feedback to the user

**File:** `src/components/SettingsPage.tsx:201-219`

**Issue:** When `handleBpvImportFile` succeeds it clears `bpvImportError` and does nothing else. The user receives no confirmation that the import worked (no toast, no count of imported records, no updated display). Given that `parseBpvExcel` is currently a stub returning `{}`, this is compounded by CR-02 — the user will always see silent "success" with 0 records imported.

**Fix:** After `saveBpvData(merged)`, count the keys and show a success message:

```tsx
const importedCount = Object.keys(records).length;
setBpvImportError(null);
setBpvImportSuccess(`${importedCount} leerlingen geïmporteerd.`);
```

Add a `bpvImportSuccess` state string and render it in green below the button, similar to the error rendering. Clear it on the next import attempt.

---

### WR-04: BPV "Verschil" display uses wrong sign convention — positive verschil displayed as surplus when it is actually a deficit

**File:** `src/components/BpvProgressSection.tsx:46-47`

**Issue:**

```ts
const verschil = verwacht - gerealiseerd;
const verschilPrefix = verschil >= 0 ? '+' : '−';
```

When `gerealiseerd < verwacht` (student is behind), `verschil` is positive and gets a `+` prefix. The UI then shows e.g. `+40u` for a student who is 40 hours short. This is semantically backwards: a positive verschil means a deficit (hours still to go), not a surplus. The `overshoot` variable confirms the intent: `overshoot = gerealiseerd >= verwacht`. When `overshoot` is false (deficit), displaying `+40u` is misleading.

**Fix:** Flip the sign convention so that surplus is positive and deficit is negative:

```ts
const verschil = gerealiseerd - verwacht; // positive = surplus, negative = deficit
const verschilPrefix = verschil >= 0 ? '+' : ''; // minus sign comes from the number itself
// Display: {verschil >= 0 ? `+${verschil}u` : `${verschil}u`}
```

Or alternatively relabel the field as "Te gaan" and always show `Math.abs(verschil)u` when in deficit and `${verschil}u te veel` when in overshoot.

---

### WR-05: `DeelgebiedenMatrix` and `SpiderChartCard` use sync cache accessors at render time — React StrictMode double-invoke exposes cache-cold renders

**File:** `src/components/DeelgebiedenMatrix.tsx:63-66`; `src/components/SpiderChartCard.tsx:17-19`

**Issue:** Both components call `getDeelgebiedenConfigSync()` and `getLeerlijnenMappingSync()` directly during the render function body (not inside a `useEffect` or `useMemo`). In React StrictMode (`main.tsx:57`), components are rendered twice. The design comment says "pre-warm in main.tsx guarantees populated cache at render time." This is true in production, but:

1. If the pre-warm `Promise.all` in `main.tsx` partially fails (the `catch` is coarse-grained — a single failure in any of the five pre-warmed modules aborts all remaining ones), the caches for the failed modules will remain `null`, and the sync accessors will silently return schema defaults instead of throwing or showing an error.
2. Since `_cache` is a module-level singleton, any component that modifies settings (via `saveDeelgebiedenConfig`) immediately updates the singleton, but React's state-driven re-render will not automatically re-run the sync accessor — the component will show stale values until a parent re-renders it. In the current codebase, `DeelgebiedenMatrix` and `SpiderChartCard` are children of `DetailWeergave` which does not subscribe to deelgebied config changes.

**Fix (pre-warm robustness):** In `main.tsx`, wrap each pre-warm call individually so that one failure does not abort the rest:

```ts
await Promise.allSettled([
  getDeelgebiedenConfig(),
  loadVerzuimDrempels(),
  getBpvConfig(),
  getBpvData(),
  getLeerlijnenMapping(),
]);
```

**Fix (stale cache):** Both components should derive their config from a prop or context rather than a module singleton, or subscribe to a shared React state. As a minimal fix, pass `dgConfig` and `mapping` as props from `DetailWeergave` (which already has the data available to its SettingsPage sibling via shared state).

---

### WR-06: `handleReset` in SettingsPage does not reset `leerlijnenMapping` React state on failure — confirm button stays disabled-looking but mapping is inconsistent

**File:** `src/components/SettingsPage.tsx:173-179`

**Issue:**

```ts
async function handleReset() {
  await Promise.all([resetDeelgebiedenConfig(), resetLeerlijnenMapping()]);
  const [cfg, mapping] = await Promise.all([getDeelgebiedenConfig(), getLeerlijnenMapping()]);
  setDgConfig(cfg);
  setLeerlijnenMapping(mapping);
  setConfirmingReset(false);
}
```

If `resetDeelgebiedenConfig()` or `resetLeerlijnenMapping()` throws (plugin-store error), the `Promise.all` rejects and the subsequent `setDgConfig`/`setLeerlijnenMapping` calls are never reached. `setConfirmingReset(false)` is also never called, leaving the "Alles terugzetten?" confirmation UI stuck on screen. The React state (`dgConfig`, `leerlijnenMapping`) remains showing whatever was there before the reset attempt, but the partially-reset store now contains only one of the two stores in default state. There is no error message shown to the user.

**Fix:** Add a `try/catch` around the reset body and always call `setConfirmingReset(false)` in a `finally` block:

```ts
async function handleReset() {
  try {
    await Promise.all([resetDeelgebiedenConfig(), resetLeerlijnenMapping()]);
    const [cfg, mapping] = await Promise.all([getDeelgebiedenConfig(), getLeerlijnenMapping()]);
    setDgConfig(cfg);
    setLeerlijnenMapping(mapping);
  } catch (err) {
    console.warn('[SettingsPage] reset mislukt:', err);
    // Optionally show user-facing error here
  } finally {
    setConfirmingReset(false);
  }
}
```

---

## Info

### IN-01: `parseBpvExcel` type signature advertises `BpvData` but caller checks for `null` — type mismatch already in codebase

**File:** `src/components/SettingsPage.tsx:208-211`; `utils/bpv.ts:155`

**Issue:** The caller checks `if (records === null || typeof records !== 'object')`, implying the function might return `null`. The declared return type is `BpvData` (never null). The null check is dead code as written. This type mismatch suggests the stub was expected to use `BpvData | null` from the start (see CR-02). The dead null-check also means TypeScript will not warn on the caller when it is eventually updated to return `null`.

**Fix:** Align types as described in CR-02 fix.

---

### IN-02: Multiple utility modules emit `console.log` at module load time in production

**Files:** `utils/bpv.ts:161`; `utils/deelgebieden.ts:129`; `utils/leerlijnen.ts:117`; `utils/prognosis.ts:309`; `utils/verzuimDrempels.ts:83`

**Issue:** Each module emits a top-level `console.log` when imported:

```ts
console.log('[bpv.ts] BPV config + data persistence geladen');
```

These are present in all five utility files introduced or touched by Phase 18. They appear in the production bundle and pollute the browser console for every app launch. The `debugPrognose` function also has extensive intentional `console.log` calls, but those are only triggered on explicit invocation.

**Fix:** Remove the module-load log lines, or gate them behind a `DEV` or `DEBUG` flag:

```ts
if (import.meta.env.DEV) {
  console.log('[bpv.ts] BPV config + data persistence geladen');
}
```

---

### IN-03: `student` and `leerlingId` props of `DeelgebiedenMatrix` are typed `any` — no structural safety

**File:** `src/components/DeelgebiedenMatrix.tsx:9`

**Issue:**

```ts
interface DeelgebiedenMatrixProps {
  student: any;
  leerlingId: string;
}
```

`student` is typed `any`, bypassing all type checking on access to `student.datapunten`, `student.deelgebiedScores`, `student.periode`, etc. A typo in a field name would be silently `undefined` at runtime. The same pattern exists on `VerzuimSection` (`student: any`).

**Fix:** Define or import a `StudentRecord` interface from `utils/schema` or `utils/klassen` and use it in the props:

```ts
interface DeelgebiedenMatrixProps {
  student: StudentRecord;
  leerlingId: string;
}
```

---

_Reviewed: 2026-05-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
