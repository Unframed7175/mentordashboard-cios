---
phase: 27-klasbeheer
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - utils/klassen.ts
  - tests/storage.test.ts
  - src/components/KlasTabStrip.tsx
  - src/App.tsx
  - src/components/KlasOverzicht.tsx
  - src/index.css
  - tests/KlasTabStrip.test.tsx
findings:
  critical: 3
  warning: 6
  info: 3
  total: 12
status: issues_found
---

# Phase 27: Code Review Report

**Reviewed:** 2026-05-26
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This phase adds inline tab rename and per-class delete to `KlasTabStrip`, wires up `renameKlas`/`deleteKlas` handlers in `App.tsx`, and extends the storage layer with `renameKlas` in `utils/klassen.ts`. The storage round-trip tests are sound in intent. The most serious defects are: (1) `renameKlas` accepts and persists empty/whitespace names with no validation, corrupting stored data; (2) `handleOpenSettings` in `App.tsx` unsafely casts `view` state when the current view is `settings` or `onboarding`, writing those values as `prevView` and then restoring them — causing a broken back-navigation loop; (3) `deleteStudent` resets `klas.students` to a new filtered array but the `appState.students` bridge still points to the old array reference, breaking any subsequent mutation that uses the bridge. Several secondary issues are documented below.

---

## Critical Issues

### CR-01: `renameKlas` accepts empty/whitespace names — corrupts persisted data

**File:** `utils/klassen.ts:118-125`
**Issue:** `renameKlas` performs no trimming or emptiness check on `newNaam`. An empty string (produced by `commitRename` only when `editValue.trim().length > 0`, but callable directly from any future caller) is written straight to `klassenState.klassen[klasId].naam` and then persisted via `saveKlassen`. Even through the UI, if `editValue` is all whitespace the guard in `commitRename` fires, but the raw untrimmed value passed to `onRenameKlas` is `editValue.trim()` — however `renameKlas` should not rely on callers to sanitize: any direct API call or future code path can corrupt data.

```typescript
// Current — no validation
export async function renameKlas(klasId: string, newNaam: string): Promise<boolean> {
  if (!klassenState.klassen[klasId]) return false;
  klassenState.klassen[klasId].naam = newNaam;   // newNaam could be '' or '   '
  await saveKlassen();
  return true;
}

// Fix — mirror createKlas validation
export async function renameKlas(klasId: string, newNaam: string): Promise<boolean> {
  if (!klassenState.klassen[klasId]) return false;
  if (!newNaam || typeof newNaam !== 'string') return false;
  const trimmed = newNaam.trim();
  if (!trimmed) return false;
  klassenState.klassen[klasId].naam = trimmed;
  await saveKlassen();
  return true;
}
```

---

### CR-02: `handleOpenSettings` corrupts `prevView` when `view` is `'settings'` or `'onboarding'`

**File:** `src/App.tsx:58-60`
**Issue:** `handleOpenSettings` unconditionally casts `view as 'import' | 'klas' | 'detail'` and assigns it to `prevView`. If the user clicks the gear icon while already in `settings` or `onboarding` mode, `prevView` is set to the string value `"settings"` or `"onboarding"` with TypeScript's type system bypassed by the cast. When `handleBackFromSettings` later calls `setView(prevView)`, it transitions to an invalid/unexpected state — either re-entering settings (infinite loop) or restoring `onboarding` unexpectedly. Although the settings gear is theoretically unreachable in `onboarding` view, it is reachable while already in `settings` view because `isSettingsActive` only styles the button; it does not disable it.

```typescript
// Current
function handleOpenSettings() {
  setSettingsOpenCount(c => c + 1);
  setPrevView(view as 'import' | 'klas' | 'detail');   // unsafe cast
  setView('settings');
}

// Fix — guard against non-content views
function handleOpenSettings() {
  setSettingsOpenCount(c => c + 1);
  const safeView = (view === 'import' || view === 'klas' || view === 'detail')
    ? view
    : 'klas';
  setPrevView(safeView);
  setView('settings');
}
```

---

### CR-03: `deleteStudent` breaks `appState.students` bridge — stale reference after deletion

**File:** `utils/klassen.ts:130-135`
**Issue:** `deleteStudent` reassigns `klas.students` to a new filtered array (`klas.students = klas.students.filter(...)`). But `appState.students` was set in `switchActiveKlas`/`_restoreBridge` to point to the **old** array reference. After `deleteStudent`, `appState.students` still holds the pre-deletion array, while `klassenState.klassen[klasId].students` holds the new one. Any code that subsequently mutates through `appState.students` (e.g., `addStudent`, `mergeVerzuim`) will mutate the orphaned old array, silently diverging from the persisted state.

```typescript
// Current — creates new array, breaks bridge
klas.students = klas.students.filter((s: any) => s.leerlingId !== leerlingId);

// Fix — mutate in-place to preserve array reference shared with appState.students
const idx = klas.students.findIndex((s: any) => s.leerlingId === leerlingId);
if (idx !== -1) klas.students.splice(idx, 1);
// If appState.students is the same reference, no further update needed.
// If klasId is not the active klas, the bridge is irrelevant — this is safe.
```

If in-place mutation is not desired, update the bridge explicitly:

```typescript
klas.students = klas.students.filter((s: any) => s.leerlingId !== leerlingId);
// Re-sync bridge if this is the active class
if (klasId === klassenState.activeKlasId) {
  appState.students = klas.students;
}
return saveKlassen();
```

---

## Warnings

### WR-01: `onBlur` fires after `Enter` — `isCommittingRef` flag reset too early

**File:** `src/components/KlasTabStrip.tsx:43-56`
**Issue:** `commitRename` sets `isCommittingRef.current = false` at the end (line 55) before the browser has finished processing the `keyDown Enter` event. React's synthetic event system fires `onBlur` synchronously after the input is unmounted by `setEditingKlasId(null)`. Because `isCommittingRef.current` is already reset to `false` at line 55 before the blur fires, the guard on line 44 (`if (isCommittingRef.current) return`) does not protect the second call. In practice `setEditingKlasId(null)` causes the input to unmount, so blur may not fire — but this is implementation-dependent behavior and the guard is unreliable as written. The intent is correct; the mechanism is fragile.

**Fix:** Set `isCommittingRef.current = true` on commit entry and only reset it **outside** the component (i.e., rely on `editingKlasId === null` as the authoritative "not editing" gate), or move to a `useCallback` + `flushSync` pattern:

```typescript
function commitRename(klasId: string): void {
  if (isCommittingRef.current) return;
  isCommittingRef.current = true;
  try {
    if (editValue.trim().length === 0) { setEditingKlasId(null); return; }
    onRenameKlas(klasId, editValue.trim());
    setEditingKlasId(null);
  } finally {
    // Reset after all synchronous state updates are queued
    Promise.resolve().then(() => { isCommittingRef.current = false; });
  }
}
```

---

### WR-02: `KlasOverzicht` `statusMap` memo may serve stale data after rename

**File:** `src/components/KlasOverzicht.tsx:30-36`
**Issue:** `statusMap` is memoized on `[refreshKey, allStudents.length]`. A `renameKlas` call triggers `setRefreshKey(k => k + 1)` in `App.tsx` (line 115), so the map *does* rebuild after rename. However, the memo comment says "student count as stable cache key" and the dependency on `allStudents.length` means: if two rename operations happen and a student is added between them, only one cache bust occurs. This is not a bug for rename, but the memo dependency list is semantically wrong — `allStudents.length` is used as a cheap proxy for "data changed" but only detects count changes, not content changes. A student's `periode` or `verzuim` data changing without count change will not rebuild `statusMap`. This is a pre-existing pattern but is now more exposed with the rename path.

**Fix:** Include `refreshKey` only (it is already incremented on all mutating operations) and remove the fragile `allStudents.length` secondary key, or document clearly that `refreshKey` alone is the invalidation contract.

```typescript
}, [refreshKey]); // refreshKey alone is the correct invalidation signal
```

---

### WR-03: `_migrateLocalStorageToStore` does not preserve `onboardingCompleted`

**File:** `utils/klassen.ts:191-235`
**Issue:** During migration from `localStorage` (v2 format), the code restores `klassen` and `activeKlasId` but never reads or migrates the `onboardingCompleted` flag. If the v2 localStorage data happened to have stored `onboardingCompleted` somewhere, it is dropped. More critically: after a fresh `loadKlassen()` call that hits the migration path, `klassenState.onboardingCompleted` is set to the plugin-store value (which is `false` / absent at migration time) before migration runs, and is never updated. This could cause users who completed onboarding before Phase 12 to see the onboarding wizard again after migration.

**Fix:** After migration succeeds, call `saveOnboardingCompleted()` if the migrated data included evidence of prior onboarding (e.g., existing students), or at minimum persist the current flag so it survives the write path.

---

### WR-04: `App.tsx` `canDelete` uses `?? 1` — semantically misleading guard

**File:** `src/App.tsx:132`
**Issue:** `(klas.students?.length ?? 1) === 0`. The intent is: if `students` is missing/undefined, treat as non-empty (so `canDelete` is false). The `?? 1` achieves this, but `1` is a magic number whose meaning is not obvious. If `students` is `null` (not `undefined`), the optional chaining `?.length` returns `undefined` → `?? 1` kicks in correctly. But if `students` is an empty array `[]`, `?.length` returns `0` and `?? 1` does **not** apply, giving `canDelete: true` correctly. The logic is actually correct, but the magic `1` is not self-documenting and could be misread as "has one student".

**Fix:**
```typescript
canDelete: (klas.students?.length ?? 1) === 0,
// → more explicit:
canDelete: Array.isArray(klas.students) && klas.students.length === 0,
```

---

### WR-05: `KlasTabStrip` tab `onKeyDown` for Space key triggers browser scroll

**File:** `src/components/KlasTabStrip.tsx:68`
**Issue:** The keyboard handler `onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && editingKlasId !== klas.id) onSwitch(klas.id); }}` fires `onSwitch` for Space, but does not call `e.preventDefault()`. Pressing Space on a focused tab will both switch the class and scroll the page, creating a jarring UX. This is a correctness issue (the Space action is partially broken).

**Fix:**
```typescript
onKeyDown={e => {
  if ((e.key === 'Enter' || e.key === ' ') && editingKlasId !== klas.id) {
    e.preventDefault();
    onSwitch(klas.id);
  }
}}
```

---

### WR-06: `storage.test.ts` — `renameKlas` test (RNM-01) does not verify duplicate-name guard

**File:** `tests/storage.test.ts:92-117`
**Issue:** `renameKlas` in `utils/klassen.ts` has no duplicate-name guard (unlike `createKlas` which checks case-insensitively). The test suite does not cover the scenario where a class is renamed to an existing class name. This means the duplicate-name collision case is untested and the guard is absent. Two classes with the same name are a user-facing problem (tab strip shows identical names with no distinguisher).

**Fix — in `utils/klassen.ts`:** Add a duplicate guard to `renameKlas` (same pattern as `createKlas`):
```typescript
const lowerNew = trimmed.toLowerCase();
const hasDuplicate = Object.values(klassenState.klassen).some(
  (k: any) => k.id !== klasId && k.naam.toLowerCase() === lowerNew
);
if (hasDuplicate) return false;  // or return { error: 'duplicate' }
```

**Fix — in `tests/storage.test.ts`:** Add a test case:
```typescript
test('RNM-03: renameKlas() with existing name returns false', async () => {
  klassenState.klassen = {
    klas_1: { id: 'klas_1', naam: 'Klas A', students: [] },
    klas_2: { id: 'klas_2', naam: 'Klas B', students: [] },
  };
  const result = await renameKlas('klas_2', 'Klas A');
  expect(result).toBe(false);
  expect(klassenState.klassen['klas_2'].naam).toBe('Klas B');
});
```

---

## Info

### IN-01: `createKlas` uses `var` — inconsistent with rest of codebase

**File:** `utils/klassen.ts:58-73`
**Issue:** `createKlas` uses `var` for `trimmedNaam`, `lowerNaam`, `existing`, `id`, and `klas` while the rest of the file uses `const`/`let`. This is a code consistency issue and introduces unnecessary function-scoped hoisting.

**Fix:** Replace all `var` declarations inside `createKlas` with `const` (all are single-assignment).

---

### IN-02: `KlasTabStrip.test.tsx` — TAB-03 Enter test does not verify `onBlur`-then-Enter double-call protection

**File:** `tests/KlasTabStrip.test.tsx:130-144`
**Issue:** The test verifies `onRenameKlas` is called exactly once after `Enter`, but it does not simulate the subsequent `blur` event that would fire in a real browser after the input unmounts. Adding `fireEvent.blur(input)` after `fireEvent.keyDown(input, { key: 'Enter' })` would verify the double-commit guard actually works.

**Fix:** Extend the TAB-03 Enter test:
```typescript
fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
fireEvent.blur(input);  // simulate browser blur-after-enter
expect(onRenameKlas).toHaveBeenCalledTimes(1);  // still only once
```

---

### IN-03: `index.css` — `.spider-card` rule defined twice with different properties

**File:** `src/index.css:957-968` and `src/index.css:1328`
**Issue:** `.spider-card` is defined in section 18 (lines 957–968) with full layout rules and in section 26 (line 1328) with `width: 160px; position: relative;`. The second definition overwrites `width` but leaves the first block's other properties intact. This is fragile — a later maintainer adding to either block may be confused about which takes precedence. The cascade order means the section 26 rule wins for `width` and `position`, but not for `background`, `border-radius`, etc.

**Fix:** Merge the two `.spider-card` blocks into a single canonical rule.

---

_Reviewed: 2026-05-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
