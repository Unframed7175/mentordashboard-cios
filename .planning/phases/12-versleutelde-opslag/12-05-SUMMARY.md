---
plan: 12-05
phase: 12-versleutelde-opslag
status: complete
completed: 2026-05-14
commits:
  - 02683f1
  - 3a487aa
  - de313e2
key-files:
  modified:
    - src-tauri/src/crypto.rs
    - utils/leerlijnen.ts
    - src-tauri/capabilities/default.json
deviations: []
self_check: PASSED
---

# Plan 12-05 Summary — Gap Closure (CR-01, CR-03, CR-04, WR-02)

## What Was Built

Three targeted fixes closing the gaps identified in 12-VERIFICATION.md and 12-REVIEW.md.
No existing functionality was rewritten — only the three specific defects were patched.

### Task 1: crypto.rs — key-length guards + decrypt minimum (CR-01, CR-04)

**commit 02683f1**

- `get_or_init_key()`: added `decoded.len() != 32` check after Base64 decode. Returns `Err("Sleutellengte ongeldig: N bytes (verwacht 32)")` instead of panicking when the keychain entry is not exactly 32 bytes.
- `get_key()`: same two-step decode + length-check pattern in the `Some(key_b64)` match arm.
- `decrypt_klassen()`: guard updated from `< 12` to `< 28` bytes with Dutch format message `"Ciphertext te kort: N bytes (minimum 28: 12 nonce + 16 auth tag)"`.

All changes are surgical — test code, encrypt path, and nonce generation are untouched.

### Task 2: leerlijnen.ts — write-confirm guard before localStorage removal (WR-02)

**commit 3a487aa**

`getLeerlijnenMapping()` legacy migration block updated:
- `saveLeerlijnenMapping(parsed)` return value now captured as `const saved`.
- `localStorage.removeItem(LEERLIJNEN_LEGACY_KEY)` and cache assignment are inside `if (saved)`.
- On write failure (`saved === false`), falls through to `buildDefault()` without removing the legacy key.

This aligns leerlijnen.ts with the pattern already used in klassen.ts `_migrateLocalStorageToStore()`.

### Task 3: capabilities/default.json — add secure-storage:default (CR-03)

**commit de313e2**

`"secure-storage:default"` added as a third entry in the permissions array.
Permissions are now: `["core:default", "store:default", "secure-storage:default"]`.
All other fields unchanged. File parses as valid JSON.

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| cargo check | `cargo check --manifest-path src-tauri/Cargo.toml` | exit 0 |
| npm run typecheck | `tsc --noEmit` | exit 0 |
| capabilities JSON | `node -e "... .includes('secure-storage:default')"` | OK |
| key-length guards | `grep -n "decoded.len() != 32" crypto.rs` | 2 matches (lines 42, 87) |
| decrypt minimum | `grep -n "decoded.len() < 28" crypto.rs` | 1 match (line 132) |
| write-confirm guard | `grep -n "const saved = await saveLeerlijnenMapping"` | 1 match (line 57) |
| if (saved) gate | `grep -n "if (saved)" leerlijnen.ts` | 1 match (line 58) |

## Self-Check: PASSED

All 7 verification checks passed. All 3 gaps from 12-VERIFICATION.md are closed:
- **CR-01**: get_or_init_key() has 32-byte length check — no panic possible on malformed keychain values.
- **CR-04**: get_key() has same guard; decrypt_klassen() minimum is 28 bytes.
- **WR-02**: getLeerlijnenMapping() legacy migration only removes localStorage after confirmed store write.
- **CR-03**: capabilities/default.json includes secure-storage:default.
