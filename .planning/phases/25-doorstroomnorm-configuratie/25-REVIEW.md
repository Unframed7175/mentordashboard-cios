---
phase: 25-doorstroomnorm-configuratie
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/App.tsx
  - src/components/DoortstroomPrognoseSection.tsx
  - src/components/SettingsPage.tsx
  - src/index.css
  - src/main.tsx
  - tests/SettingsPage.test.tsx
  - tests/normen.test.ts
  - tests/prognosis.normen.test.ts
  - utils/normen.ts
  - utils/prognosis.ts
findings:
  critical: 1
  warning: 5
  info: 3
  total: 9
status: issues_found
---

# Phase 25: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Phase 25 wires up a configurable `Normen` object (8 fields) for the doorstroomnorm engine, adds `utils/normen.ts` for persistence via plugin-store, and threads the settings UI through `SettingsPage.tsx`. The architecture is sound and follows established Phase 12/18 patterns. However, a stale closure bug in the blur handler will cause the wrong value to be saved in common user interaction sequences, and several lower-severity issues degrade correctness or maintainability.

---

## Critical Issues

### CR-01: Stale closure in `handleNormenBlur` — wrong value is saved on blur

**File:** `src/components/SettingsPage.tsx:437` (and lines 453, 474, 490, 513, 529, 545, 561)

**Issue:** Every norm input uses an `onBlur` arrow function that closes over `normen.<field>` at render time:

```tsx
onChange={e => setNormen(n => ({ ...n, sbl: Number(e.target.value) }))}
onBlur={() => handleNormenBlur('sbl', normen.sbl, 1, 19)}
```

`onChange` triggers `setNormen`, which schedules a React state update. But `onBlur` fires immediately after — before the new render cycle — so `normen.sbl` in the closure still holds the **previous** render's value. The `handleNormenBlur` call then clamps and saves the old value, not what the user typed. This means:

- User opens settings, sees SBL = 13
- User types 10
- User presses Tab (or clicks elsewhere) — `onBlur` fires with `normen.sbl === 13`, not 10
- `saveNormen` is called with `sbl: 13`; the user's edit is silently discarded

The `onChange` already updates local state via a functional updater (`n => ({ ...n, sbl: ... })`), so it is safe. The fix is to read the DOM value inside `handleNormenBlur` rather than passing the closed-over state snapshot.

**Fix:** Change `handleNormenBlur` to accept the raw DOM value via the event, or read it from the input ref. The simplest fix: pass the value from `onChange` state and read it from the input element in the blur handler via the event object.

```tsx
// Replace all 8 onBlur closures with the event-based pattern:
onBlur={e => handleNormenBlur('sbl', Number(e.target.value), 1, 19)}
```

This reads from the DOM at the moment blur fires, bypassing the stale-closure problem. No other changes needed; `handleNormenBlur` already receives `rawValue: number` as its second parameter.

---

## Warnings

### WR-01: `loadNormen` resets ALL fields when ANY single field is invalid

**File:** `utils/normen.ts:68-109`

**Issue:** Validation is a sequence of early returns — the first invalid field causes `_cache = { ...DEFAULT_NORMEN }` and returns immediately. If seven fields are valid and one is out of range, the user loses all seven valid customisations. This is particularly bad for users who customise many norms and then corrupt the store externally (e.g. manual edit, migration).

```ts
if (!Number.isFinite(raw.sbl) || raw.sbl < 1 || raw.sbl > 19) {
  _cache = { ...DEFAULT_NORMEN };   // <-- discards ALL valid fields
  return _cache;
}
```

**Fix:** Validate and clamp per-field, keeping valid values intact. Emit a warn for each clamped field rather than dropping everything:

```ts
const validated: Normen = {
  sbl:                 isValidField(raw.sbl, 1, 19)                 ? raw.sbl                 : DEFAULT_NORMEN.sbl,
  sbc:                 isValidField(raw.sbc, 1, 19)                 ? raw.sbc                 : DEFAULT_NORMEN.sbc,
  negatiefTotaal:      isValidField(raw.negatiefTotaal, 1, 19)      ? raw.negatiefTotaal      : DEFAULT_NORMEN.negatiefTotaal,
  negatiefPerLeerlijn: isValidField(raw.negatiefPerLeerlijn, 1, 6)  ? raw.negatiefPerLeerlijn : DEFAULT_NORMEN.negatiefPerLeerlijn,
  bj1Positief:         isValidField(raw.bj1Positief, 1, 19)         ? raw.bj1Positief         : DEFAULT_NORMEN.bj1Positief,
  versneldLesgeven:    isValidField(raw.versneldLesgeven, 1, 6)      ? raw.versneldLesgeven    : DEFAULT_NORMEN.versneldLesgeven,
  versneldOrganiseren: isValidField(raw.versneldOrganiseren, 1, 6)  ? raw.versneldOrganiseren : DEFAULT_NORMEN.versneldOrganiseren,
  versneldProfHandelen:isValidField(raw.versneldProfHandelen, 1, 6) ? raw.versneldProfHandelen: DEFAULT_NORMEN.versneldProfHandelen,
};
_cache = validated;
return _cache;
```

---

### WR-02: `debugPrognose` uses hardcoded thresholds — misleads when custom normen are active

**File:** `utils/prognosis.ts:261-268`

**Issue:** The `debugPrognose` function displays threshold labels using hardcoded magic numbers (`13`, `15`, `4`, `3`, `5`), not the active normen values from `getNormenSync()`. When a user has customised norms and calls `debugPrognose('Bosker')`, the output labels will show the defaults, not the actual thresholds that produced the label.

```ts
// BJ2-norm  (≥13 ≥V): ...  ← always shows 13, even if sbl was changed to 10
console.log('BJ2-norm  (≥13 ≥V): ' + (p.totaalVoldoendeOfHoger >= 13 ? '✅' : '❌ ...'));
// SBL-norm  (≥13 ≥V): ...
console.log('SBL-norm  (≥13 ≥V): ' + (p.totaalVoldoendeOfHoger >= 13 ? '✅' : '❌ ...'));
// SBC-norm  (≥15 ≥V): ...
console.log('SBC-norm  (≥15 ≥V): ' + (p.totaalVoldoendeOfHoger >= 15 ? '✅' : '❌ ...'));
```

The `berekenPrognose` call on line 252 does read from `getNormenSync()`, so `p.label` and `p.gaps` are correct — only the display strings are wrong.

**Fix:** Call `getNormenSync()` at the top of `debugPrognose` and use `n.sbl`, `n.sbc`, etc. in the formatted strings:

```ts
export function debugPrognose(query: string, traject?: string): void {
  const n = getNormenSync();     // add this line
  // ...
  console.log(`BJ2-norm  (≥${n.bj1Positief} ≥V): ` + (p.totaalVoldoendeOfHoger >= n.bj1Positief ? '✅' : '❌ nog ' + p.gaps.nodigBJ2 + ' nodig'));
  console.log(`SBL-norm  (≥${n.sbl} ≥V): `          + (p.totaalVoldoendeOfHoger >= n.sbl         ? '✅' : '❌ nog ' + p.gaps.nodigSBL + ' nodig'));
  console.log(`SBC-norm  (≥${n.sbc} ≥V): `          + (p.totaalVoldoendeOfHoger >= n.sbc         ? '✅' : '❌ nog ' + p.gaps.nodigSBC_deelgebieden + ' nodig'));
```

---

### WR-03: `computeAlgemeneItems` warning threshold `ruimte <= 1` is a hardcoded sentinel

**File:** `src/components/DoortstroomPrognoseSection.tsx:34`

**Issue:** The warning fires when `onvoldoendeRuimte <= 1`. This is equivalent to "only 1 slot left before negatief trigger". With the default `negatiefTotaal=6`, this means the warning fires at 5 or 6 onvoldoende. But if a user sets `negatiefTotaal=2`, the threshold of <=1 is too tight (leaves no useful warning zone), and at `negatiefTotaal=19`, a student at 18 onvoldoende gets the exact same warning text as one at 5/6. The threshold should be expressed as a fraction of `negatiefTotaal`, not as a fixed `1`.

```ts
const ruimte = p.gaps.onvoldoendeRuimte;
if (ruimte <= 1) {  // hardcoded — does not scale with custom negatiefTotaal
```

**Fix:** Express the warning threshold proportionally, e.g. warn when fewer than `Math.max(1, Math.ceil(n.negatiefTotaal * 0.25))` slots remain, so the warning zone scales with the configured limit. At minimum, update the threshold to be configurable or document the intentional design decision.

---

### WR-04: `loadNormen` does not check for missing fields — trusts partial store objects

**File:** `utils/normen.ts:65-108`

**Issue:** The validation only checks that each field passes `Number.isFinite()` and range guards. It does not verify that the field **exists** on `raw` at all. If the store contains a partial object (e.g. from an older schema version with 5 fields instead of 8), accessing `raw.versneldLesgeven` returns `undefined`. `Number.isFinite(undefined)` is `false`, which does trigger the fallback — but only for the missing field, and with the current all-or-nothing logic (WR-01), the entire object is thrown away. After WR-01 is fixed with per-field clamping, the undefined case is handled implicitly, but the missing-field path should be explicit:

```ts
// Current check (line 93):
if (!Number.isFinite(raw.versneldLesgeven) || raw.versneldLesgeven < 1 || raw.versneldLesgeven > 6) {
// raw.versneldLesgeven could be undefined (missing field in older store) — Number.isFinite(undefined) === false, so it falls through correctly
// but this is implicit; add a comment or an explicit `raw.versneldLesgeven !== undefined` guard to make it self-documenting
```

**Fix (comment-level):** Add a comment noting that `Number.isFinite(undefined) === false` handles missing fields, so schema evolution is safe. Or use an explicit property-existence check before range validation for each field. This prevents silent breakage if `Number.isFinite` semantics change.

---

### WR-05: `handleNormenChanged` in App.tsx only increments `refreshKey` — does not re-warm sync cache

**File:** `src/App.tsx:67-69`

**Issue:** When normen are saved in SettingsPage, `onNormenChanged()` calls `handleNormenChanged()`, which increments `refreshKey`. This triggers a re-render of `KlasOverzicht` and other key-dependent components. However, `berekenStatus` → `berekenPrognose` reads normen via `getNormenSync()`, which reads from the module-level `_cache` in `utils/normen.ts`. The `saveNormen` call in `handleNormenBlur` **does** update `_cache` synchronously (pitfall 5 pattern), so the sync cache is actually correct after save.

The issue is that `DoortstroomPrognoseSection` calls `getNormenSync()` directly in the `computeAlgemeneItems`, `computeSBLItems`, `computeSBCItems`, and `computeBJ1Items` functions — outside of any React state/effect, at render time. These calls will pick up the new cache value on the next render (triggered by `refreshKey`), so they are eventually correct. **However**, if `saveNormen` returns `false` (store write failure), the cache is already updated (instant-apply pattern), but `onNormenChanged` still fires and the user sees updated UI as if the save succeeded, with no visible error beyond `console.error`. The error state is invisible to the user.

```ts
const ok = await saveNormen(updated);
if (!ok) { console.error('[SettingsPage] saveNormen returned false — doorstroom norm niet opgeslagen'); }
onNormenChanged();  // fires regardless of ok — UI updates as if save succeeded
```

**Fix:** When `ok === false`, show an inline error message to the user (e.g. set a `saveError` state) and do not call `onNormenChanged()`, so the rest of the UI does not re-render with an unsaved value it believes is persisted.

---

## Info

### IN-01: Top-level `console.log` statements fire at module import time

**File:** `utils/normen.ts:149`, `utils/prognosis.ts:306`

**Issue:** Both utility modules execute `console.log` at module load time (top-level scope, outside any function). These will appear in production builds and in every test run that imports these modules.

```ts
// normen.ts line 149
console.log('[normen.ts] Doorstroomnorm drempelwaarden persistence geladen');
// prognosis.ts line 306
console.log('[prognosis.ts] Doorstroomnorm engine geladen (BJ1 + BJ2)');
```

**Fix:** Remove these lines, or guard them behind a development-only check:
```ts
if (import.meta.env.DEV) console.log('[normen.ts] loaded');
```

---

### IN-02: `var KERN_SBC` at module scope is mutable

**File:** `utils/prognosis.ts:25`

**Issue:** `KERN_SBC` is declared with `var`, making it reassignable and function-scoped rather than block-scoped. As a module-level constant it should be `const`.

```ts
var KERN_SBC = ['V&A', 'P&O', 'C&B', '1E&B'];  // should be const
```

**Fix:**
```ts
const KERN_SBC = ['V&A', 'P&O', 'C&B', '1E&B'] as const;
```

---

### IN-03: `berekenAllePrognoses` mutates student objects directly in `appState`

**File:** `utils/prognosis.ts:231`

**Issue:** `students[i].prognose = prognose;` writes directly to the shared `appState.students` array elements. This is a side-effectful mutation on shared state rather than a pure computation. It is not new to Phase 25, but Phase 25 expands the normen integration and this pattern will cause subtle bugs if multiple consumers call `berekenAllePrognoses` with different normen or trajecten — later calls will overwrite prognose results from earlier calls.

**Fix:** Return results from the function without mutating the source objects. If the mutation is required by callers, document it explicitly with a `@sideEffects` note in the JSDoc.

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
