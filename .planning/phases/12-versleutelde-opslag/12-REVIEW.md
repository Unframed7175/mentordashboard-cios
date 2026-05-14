---
phase: 12-versleutelde-opslag
reviewed: 2026-05-14T10:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src-tauri/src/crypto.rs
  - utils/leerlijnen.ts
  - src-tauri/capabilities/default.json
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 12: Code Review Report (Gap-Closure Re-Review — Plan 12-05)

**Reviewed:** 2026-05-14T10:00:00Z
**Depth:** standard
**Files Reviewed:** 3 (gap-closure scope: crypto.rs, leerlijnen.ts, default.json)
**Status:** issues_found

## Summary

This re-review covers the three files patched under plan 12-05. Four prior findings were targeted: CR-01, CR-03, CR-04, and WR-02.

**CR-01 — RESOLVED.** Both `get_or_init_key()` (line 42–44) and `get_key()` (line 87–89) now contain `decoded.len() != 32` guards that return `Err` before `from_slice` is called. No panic path remains.

**CR-03 — RESOLVED.** `"secure-storage:default"` is now present in `capabilities/default.json` (line 9).

**CR-04 — RESOLVED.** The minimum-length guard in `decrypt_klassen` now correctly requires 28 bytes (line 132) with an accurate error message citing both nonce and tag contributions.

**WR-02 — RESOLVED.** `saveLeerlijnenMapping()` return value is now captured (`saved`) and `localStorage.removeItem` is only called when `saved === true` (lines 57–62).

One prior critical finding (CR-02) remains open — it was not in scope for plan 12-05. Three prior warnings (WR-01, WR-03, WR-04) and three info items (IN-01, IN-02, IN-03) remain open; they are retained below unchanged because the files that contain them (`utils/klassen.ts`, `utils/datamodel.ts`, `tests/storage.test.ts`, `src-tauri/Cargo.toml`) were not patched in this plan.

One new warning (WR-05) was introduced by the WR-02 patch itself: when `saveLeerlijnenMapping` fails, the migration fall-through returns schema defaults to the caller rather than the valid legacy data that was just parsed.

---

## Critical Issues

### CR-02: Two independent `LazyStore` instances on the same file — data-loss race condition

**File:** `utils/klassen.ts:11` and `utils/leerlijnen.ts:14`

**Issue:** Both modules construct `new LazyStore('store.json', { autoSave: false })` independently. With `autoSave: false`, each instance keeps its own in-memory write buffer and only flushes on explicit `.save()`. When `saveKlassen()` and `saveLeerlijnenMapping()` are called in close succession (e.g., on app startup or a user action that triggers both), whichever instance calls `.save()` second will overwrite the file with its own in-memory state — which does not include the other instance's pending writes. The result is silent data loss: either `klassen` or `leerlijnen` data is truncated from the persisted file.

**Fix:** Export and share a single `LazyStore` instance from a dedicated module (e.g., `utils/store.ts`):
```typescript
// utils/store.ts
import { LazyStore } from '@tauri-apps/plugin-store';
export const sharedStore = new LazyStore('store.json', { defaults: {}, autoSave: false });
```
Then import `sharedStore` in both `klassen.ts` and `leerlijnen.ts` in place of their local `store` constants.

---

## Warnings

### WR-01: `loadKlassen()` returns `false` for a valid but empty class list — triggers unintended localStorage migration

**File:** `utils/klassen.ts:156`

**Issue:** After a successful decryption and deserialization, `loadKlassen()` returns `Object.keys(klassenState.klassen).length > 0`. If the user has deleted all classes (a valid state), this returns `false`. The caller then falls through to `_migrateLocalStorageToStore()`. If stale localStorage data is present, the migration will overwrite the fresh (intentionally empty) encrypted store with old data. The return value conflates "no data" with "empty data".

**Fix:**
```typescript
// In loadKlassen(), replace the length-based return:
_restoreBridge();
return true;  // decryption succeeded; empty klassen is a valid loaded state
```

---

### WR-02: RESOLVED — see summary above.

---

### WR-03: `saveKlassen()` failure is silently swallowed in `deleteStudent()`

**File:** `utils/klassen.ts:123`

**Issue:** `deleteStudent()` mutates `klas.students` in memory before calling `saveKlassen()`. If the save fails, the student is gone from memory but still present on disk. On next app restart `loadKlassen()` will restore the deleted student — a silent inconsistency that the user cannot detect or recover from. The function returns `false` on both "student not found" and "save failed", making the failure reason opaque to callers.

**Fix:**
```typescript
export async function deleteStudent(klasId: string, leerlingId: string): Promise<boolean> {
  const klas = klassenState.klassen[klasId];
  if (!klas) return false;
  const original = klas.students.slice();
  klas.students = klas.students.filter((s: any) => s.leerlingId !== leerlingId);
  const saved = await saveKlassen();
  if (!saved) {
    klas.students = original;  // rollback in-memory mutation
    showStorageError('Verwijderen mislukt — probeer opnieuw');
    return false;
  }
  return true;
}
```

---

### WR-04: Class ID relies solely on timestamp — collision possible under rapid creation

**File:** `utils/klassen.ts:71`

**Issue:** `'klas_' + Date.now().toString(36)` uses only the current millisecond as the unique identifier. If `createKlas()` is called twice within the same millisecond (automated tests, batch import), both calls produce the same ID and the second call silently overwrites the first class in `klassenState.klassen`. The duplicate-name guard (lines 63–68) does not prevent this because the names can differ.

**Fix:**
```typescript
// Replace line 71:
const id = 'klas_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
```

---

### WR-05: WR-02 patch fall-through serves schema defaults instead of valid legacy data when save fails

**File:** `utils/leerlijnen.ts:56–68` (introduced by plan 12-05)

**Issue:** The WR-02 fix correctly guards `localStorage.removeItem` behind `saved === true`. However, when `saveLeerlijnenMapping` returns `false`, execution falls through the entire `try` block to line 68 (`_cachedMapping = buildDefault()`). The caller then receives schema defaults even though a valid legacy mapping was successfully parsed. The legacy data remains in localStorage (correctly preserved for the next attempt), but the in-session experience is wrong: the UI shows factory defaults instead of the user's actual leerlijn assignments. This will self-correct only after a successful save + reload, which may not happen without a user-visible error to prompt a retry.

**Fix:** Return the parsed legacy value as the cache when save fails, so the current session uses the correct data even if persistence failed:
```typescript
if (isValid(parsed)) {
  const saved = await saveLeerlijnenMapping(parsed);
  if (saved) {
    localStorage.removeItem(LEERLIJNEN_LEGACY_KEY);
  }
  // Use parsed data for this session regardless of save success;
  // legacy key is preserved on disk until a successful migration.
  _cachedMapping = parsed;
  return _cachedMapping!;
}
```

---

## Info

### IN-01: Module-level `console.log` calls in production modules

**File:** `utils/datamodel.ts:86`, `utils/klassen.ts:254`, `utils/leerlijnen.ts:105`

**Issue:** Three production utility modules emit `console.log` on every import. In a production Tauri app these appear in the browser console on every page load and convey no actionable information to the end user.

**Fix:** Remove all three `console.log('[module] ... geladen')` lines, or gate them behind a `DEBUG` flag.

---

### IN-02: `atob`/`unescape`/`encodeURIComponent` chain in test mock uses deprecated APIs

**File:** `tests/storage.test.ts:27-30`

**Issue:** The encrypt mock uses `btoa(unescape(encodeURIComponent(...)))` and the decrypt mock reverses with `decodeURIComponent(escape(atob(...)))`. Both `unescape` and `escape` are deprecated Web API functions and will emit deprecation warnings in future runtimes.

**Fix:** Replace with `TextEncoder`/`TextDecoder`:
```typescript
// encode:
return `mock_encrypted:${btoa(String.fromCharCode(...new TextEncoder().encode(args.plaintext)))}`;
// decode:
const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
return new TextDecoder().decode(bytes);
```

---

### IN-03: `tauri-plugin-secure-storage` version pinned at `"1"` while `tauri-plugin-store` uses `"2"`

**File:** `src-tauri/Cargo.toml:24-25`

**Issue:** The version discrepancy between the two plugins is intentional (the `1.5.0` API surface was explicitly verified). However, pinning to the semver range `"1"` allows any `1.x` upgrade. A new `1.x` release that renames `GetItemResponse.data` or changes `OptionsRequest` fields would cause a silent compile-time or runtime failure. Additionally, if `tauri-plugin-secure-storage = "2"` is eventually released, Cargo will never automatically pull it, but the diverging major versions may confuse future maintainers.

**Fix:** Pin to the exact verified version and add a comment:
```toml
# Pinned to 1.5.0 — API surface (GetItemResponse.data field) verified against
# 1.5.0 source. Any upgrade requires re-verification in crypto.rs.
tauri-plugin-secure-storage = "=1.5.0"
```

---

_Reviewed: 2026-05-14T10:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
