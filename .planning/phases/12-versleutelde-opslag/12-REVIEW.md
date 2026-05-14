---
phase: 12-versleutelde-opslag
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src-tauri/Cargo.toml
  - src-tauri/capabilities/default.json
  - src-tauri/src/crypto.rs
  - src-tauri/src/lib.rs
  - tests/storage.test.ts
  - utils/datamodel.ts
  - utils/klassen.ts
  - utils/leerlijnen.ts
  - package.json
findings:
  critical: 4
  warning: 4
  info: 3
  total: 11
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-05-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 12 introduces AES-256-GCM encryption via a Rust Tauri command layer, OS keychain key management through `tauri-plugin-secure-storage`, and migration of persistence from `localStorage` to `tauri-plugin-store`. The cryptographic design is sound in principle (fresh nonce per call, key never leaves Rust, correct wire format). However, four critical defects were found: two will panic the Rust process on any key length mismatch; one silently causes data loss when two store instances race; and one missing capability declaration could make all keychain operations fail in production. Four additional warnings cover logic gaps and error-handling holes.

---

## Critical Issues

### CR-01: No key-length validation before `from_slice` — process panic guaranteed on corrupt keychain entry

**File:** `src-tauri/src/crypto.rs:93` and `src-tauri/src/crypto.rs:115`

**Issue:** `Key::<Aes256Gcm>::from_slice(&key_bytes)` requires exactly 32 bytes and panics (`unwrap` inside the aes-gcm library) if the slice length differs. The decoded bytes from the keychain are never length-checked before this call. If a keychain entry is truncated, manually edited, or the Base64 encodes anything other than 32 bytes (e.g., from a version change, OS credential corruption, or a future key-rotation attempt that stored a different size), both `encrypt_klassen` and `decrypt_klassen` will panic and crash the Tauri process rather than returning a graceful `Err`.

**Fix:**
```rust
// In get_or_init_key() after decoding from Base64 (line ~40):
let decoded = STANDARD
    .decode(&key_b64)
    .map_err(|e| format!("Key decode error: {e}"))?;
if decoded.len() != 32 {
    return Err(format!("Keychain key has wrong length: {} bytes (expected 32)", decoded.len()));
}
// return decoded instead of the raw decode result

// Same guard in get_key() after decoding (line ~80):
let decoded = STANDARD
    .decode(&key_b64)
    .map_err(|e| format!("Key decode error: {e}"))?;
if decoded.len() != 32 {
    return Err("Sleutel niet beschikbaar — neem contact op met beheerder".to_string());
}
```

---

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

### CR-03: Missing `secure-storage` capability in `capabilities/default.json`

**File:** `src-tauri/capabilities/default.json:6-9`

**Issue:** `tauri-plugin-secure-storage` is registered in `lib.rs` (line 14) and used extensively in `crypto.rs`. The `capabilities/default.json` file lists `"core:default"` and `"store:default"` but contains no `secure-storage:*` permission. Tauri 2's capability system gates plugin access by capability declarations. If the plugin requires a capability entry to allow its IPC surface (even when called from Rust via `AppHandle`), all keychain reads and writes will fail with a permission error at runtime. The error surface (keychain read error) would appear as "Sleutel niet beschikbaar" to the user — the real cause being a missing capability, not a corrupted keychain.

**Fix:** Add the appropriate permission identifier:
```json
{
  "permissions": [
    "core:default",
    "store:default",
    "secure-storage:default"
  ]
}
```
Verify the exact permission identifier against the plugin's `permissions/` directory or documentation. If the plugin is purely server-side (Rust-only, no IPC surface), document that explicitly so future maintainers do not add a frontend permission by mistake.

---

### CR-04: `ciphertext` minimum-length guard misses the auth tag — decrypt call always fails for 12–27 byte payloads

**File:** `src-tauri/src/crypto.rs:122-126`

**Issue:** The guard `if decoded.len() < 12` only ensures the nonce can be extracted. AES-256-GCM appends a 16-byte authentication tag to the ciphertext; therefore the minimum valid blob is 12 (nonce) + 0 (empty plaintext) + 16 (tag) = 28 bytes. Any decoded blob between 12 and 27 bytes inclusive passes the guard, is split into a valid 12-byte nonce and a 0–15 byte ciphertext slice, and is then handed to `cipher.decrypt()` which will fail because the tag is absent or truncated. The failure is caught and returned as an opaque error, but the real cause (invalid input length) is hidden. More importantly, the guard communicates incorrect intent — a 15-byte input is treated as structurally valid when it is not.

**Fix:**
```rust
// Replace line 122:
if decoded.len() < 28 {  // 12 nonce + 16 tag minimum (zero-length plaintext)
    return Err(format!(
        "Ciphertext too short: {} bytes (minimum 28: 12 nonce + 16 tag)",
        decoded.len()
    ));
}
```

---

## Warnings

### WR-01: `loadKlassen()` returns `false` for a valid but empty class list — triggers unintended localStorage migration

**File:** `utils/klassen.ts:156`

**Issue:** After a successful decryption and deserialization, `loadKlassen()` returns `Object.keys(klassenState.klassen).length > 0`. If the user has deleted all classes (a valid state), this returns `false`. The caller at line 160 then falls through to `_migrateLocalStorageToStore()`. If stale localStorage data is present, the migration will overwrite the fresh (intentionally empty) encrypted store with old data. This is an incorrect semantic: `false` should mean "no data available", not "data was loaded but happened to be empty".

**Fix:**
```typescript
// In loadKlassen(), replace line 156:
_restoreBridge();
return true;  // decryption succeeded; empty klassen is a valid loaded state
```

---

### WR-02: Legacy migration removes localStorage before confirming `saveLeerlijnenMapping` succeeded

**File:** `utils/leerlijnen.ts:57-59`

**Issue:** In `getLeerlijnenMapping()`, when valid legacy data is found, `saveLeerlijnenMapping(parsed)` is called (line 57). This function can fail and return `false`. However the return value is not checked — on the next line (58) `localStorage.removeItem(LEERLIJNEN_LEGACY_KEY)` is called unconditionally. If the plugin-store write fails (disk full, store locked), the legacy data is permanently deleted from localStorage with no backup. The equivalent guard exists correctly in `_migrateLocalStorageToStore()` (klassen.ts:195-202) but was not applied here.

**Fix:**
```typescript
// Replace lines 56-59 in getLeerlijnenMapping():
const saved = await saveLeerlijnenMapping(parsed);
if (saved) {
    localStorage.removeItem(LEERLIJNEN_LEGACY_KEY);
    _cachedMapping = parsed;
    return _cachedMapping!;
}
// If save failed, fall through to buildDefault() — legacy data preserved
```

---

### WR-03: `saveKlassen()` failure is silently swallowed in `deleteStudent()`

**File:** `utils/klassen.ts:123`

**Issue:** `deleteStudent()` calls `return saveKlassen()` which returns `false` on failure. The in-memory mutation (student removed from `klas.students`) has already occurred before the save. If `saveKlassen()` fails, the student is gone from memory but still present on disk. On next app restart `loadKlassen()` will restore the deleted student from the encrypted store — a silent inconsistency. The function returns `false` to signal the save failure, but the caller has no way to distinguish "student not found" (line 122) from "save failed" (line 123). The memory mutation should either be rolled back on save failure, or the distinction must be communicated.

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

**Issue:** `'klas_' + Date.now().toString(36)` uses only the current millisecond as the unique identifier for a new class. If `createKlas()` is called twice within the same millisecond (possible in automated tests or batch import scenarios), both calls produce the same ID. The second call silently overwrites the first class in `klassenState.klassen`. The duplicate-name guard (lines 63-68) runs before the ID is generated and guards only on name, not ID — it would not catch this because the names could differ.

**Fix:**
```typescript
// Replace line 71:
const id = 'klas_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
```

---

## Info

### IN-01: Module-level `console.log` calls in production modules

**File:** `utils/datamodel.ts:86`, `utils/klassen.ts:254`, `utils/leerlijnen.ts:103`

**Issue:** Three production utility modules emit `console.log` on every import. In a production Tauri app these will appear in the browser console on every page load. They convey no actionable information to the end user and indicate these were left from development.

**Fix:** Remove all three `console.log('[module] ... loaded')` lines, or guard them behind a `DEBUG` flag.

---

### IN-02: `atob`/`unescape`/`encodeURIComponent` chain in test mock uses deprecated APIs

**File:** `tests/storage.test.ts:27-30`

**Issue:** The encrypt mock uses `btoa(unescape(encodeURIComponent(...)))` and the decrypt mock reverses with `decodeURIComponent(escape(atob(...)))`. Both `unescape` and `escape` are deprecated Web API functions. In modern jsdom/Node environments they still work, but they will emit deprecation warnings in future runtimes and signal fragile code to readers.

**Fix:** Replace with `TextEncoder`/`TextDecoder` plus `btoa`/`atob` on the resulting binary string, or use a `Buffer`-based approach:
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

**Issue:** `tauri-plugin-store = "2"` and `tauri-plugin-secure-storage = "1"` are on different major versions. The code comment explicitly notes "1.5.0 source" was verified. This version discrepancy is intentional per the comment, but it creates a risk: if a `tauri-plugin-secure-storage = "2"` is released (or already exists) and a future developer bumps the version, the `OptionsRequest` struct fields and `GetItemResponse.data` field assumed in `crypto.rs` may differ, causing a silent compile-time failure or wrong-field read.

**Fix:** Pin to the exact verified version to prevent accidental upgrades:
```toml
tauri-plugin-secure-storage = "=1.5.0"
```
Add a comment documenting which API surface (specifically `GetItemResponse.data` field name) was verified and why an upgrade requires review of `crypto.rs`.

---

_Reviewed: 2026-05-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
