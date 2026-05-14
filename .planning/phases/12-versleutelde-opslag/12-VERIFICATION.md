---
phase: 12-versleutelde-opslag
verified: 2026-05-14T18:00:00Z
status: gaps_found
score: 10/14 must-haves verified
overrides_applied: 0
gaps:
  - truth: "AES-256-GCM round-trip test in crypto.rs slaagt via cargo test"
    status: partial
    reason: "The round-trip unit test exists and previously passed per SUMMARY, but crypto.rs has an unguarded from_slice call (CR-01) that panics at runtime if the keychain entry is not exactly 32 bytes. The unit test uses a fixed [0u8;32] key and does not exercise the keychain path — so the test passes but the production path can panic. The decryption guard also triggers too early at <12 bytes when 28 is the correct minimum (CR-04)."
    artifacts:
      - path: "src-tauri/src/crypto.rs"
        issue: "get_or_init_key() and get_key() decode Base64 from keychain and immediately call Key::<Aes256Gcm>::from_slice() with no length check. Library panics if slice != 32 bytes. See review CR-01."
      - path: "src-tauri/src/crypto.rs"
        issue: "Minimum ciphertext length guard is `< 12` (line 122) but valid minimum is 28 (12 nonce + 16 auth tag). Inputs 12-27 bytes pass the guard but fail decrypt with an opaque error. See review CR-04."
    missing:
      - "Add length check `if decoded.len() != 32 { return Err(...) }` after Base64 decode in get_or_init_key() and get_key()"
      - "Replace `if decoded.len() < 12` with `if decoded.len() < 28` in decrypt_klassen, updating the error message to explain why"
  - truth: "localStorage wordt alleen verwijderd NADAT plugin-store write succesvol is"
    status: partial
    reason: "This is correctly implemented in klassen.ts _migrateLocalStorageToStore() (the saveKlassen() return value is checked before removing localStorage). However in leerlijnen.ts getLeerlijnenMapping(), saveLeerlijnenMapping() is called but its return value is not checked — localStorage.removeItem() runs unconditionally on line 58 even if the store write failed. This breaks the D-12-15 guarantee for the leerlijnen migration path. See review WR-02."
    artifacts:
      - path: "utils/leerlijnen.ts"
        issue: "Line 57: saveLeerlijnenMapping(parsed) return value not checked. Line 58: localStorage.removeItem(LEERLIJNEN_LEGACY_KEY) executes unconditionally. If store write fails, legacy data is permanently lost."
    missing:
      - "Capture return value of saveLeerlijnenMapping(parsed) in getLeerlijnenMapping()"
      - "Only call localStorage.removeItem(LEERLIJNEN_LEGACY_KEY) when saved === true; otherwise fall through to buildDefault()"
  - truth: "cargo check slaagt zonder fouten na toevoeging van alle Rust-afhankelijkheden"
    status: partial
    reason: "cargo check was confirmed passing per SUMMARY (commit 0b54250). However the code review (CR-03) identifies that tauri-plugin-secure-storage is registered in lib.rs but the 'secure-storage:default' capability is missing from capabilities/default.json. This is a runtime capability gate issue, not a compile-time error — so cargo check still exits 0. The plan's PATTERNS.md explicitly said NOT to add this capability, and the SUMMARY noted this decision. This is a disputed area: the review says the plugin may need a capability entry; the plan says it does not. Marking partial because the runtime behavior cannot be verified without executing the app."
    artifacts:
      - path: "src-tauri/capabilities/default.json"
        issue: "Contains 'core:default' and 'store:default' but not 'secure-storage:default'. If Tauri 2 capability system gates plugin IPC (even Rust-side), keychain calls will fail at runtime with a permission error that surfaces as 'Sleutel niet beschikbaar'."
    missing:
      - "Determine whether tauri-plugin-secure-storage 1.x requires a capability entry for Rust-side AppHandle usage"
      - "Either add 'secure-storage:default' to capabilities/default.json or document with a test result that the capability is not required"
---

# Phase 12: Versleutelde Opslag Verification Report

**Phase Goal:** Versleutelde opslag van klassendata via AES-256-GCM Rust commands + plugin-store. Auto-migratie vanuit localStorage. deleteStudent() AVG-compliant.
**Verified:** 2026-05-14T18:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All must-haves are drawn from the four PLAN frontmatter `must_haves.truths` sections. Plans 12-01 through 12-04 cover requirements STO-01, STO-02, STO-03, STO-04.

#### Plan 12-01 Truths (STO-02)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | cargo check slaagt zonder fouten na toevoeging van alle Rust-afhankelijkheden | PARTIAL | cargo check passes (per SUMMARY commit 0b54250) but CR-03 identifies potential runtime capability gap for secure-storage. cargo check itself exits 0 — this is a runtime concern. |
| 2 | crypto.rs exporteert twee pub async Tauri commands: encrypt_klassen en decrypt_klassen | VERIFIED | crypto.rs lines 90-107, 112-134: `#[tauri::command] pub async fn encrypt_klassen` and `pub async fn decrypt_klassen` both present. |
| 3 | AES-256-GCM round-trip test in crypto.rs slaagt via cargo test | PARTIAL | Unit test exists (lines 143-157) and uses fixed key — verifiable. But production keychain path lacks key-length validation (CR-01) causing potential panic, and decrypt guard threshold is wrong (CR-04). The test passes; the production path has defects. |
| 4 | lib.rs registreert tauri_plugin_store, tauri_plugin_secure_storage en beide crypto commands | VERIFIED | lib.rs lines 13-19: plugin-store, secure-storage, and both crypto commands registered in generate_handler!. |
| 5 | capabilities/default.json bevat 'store:default' naast 'core:default' | VERIFIED | default.json confirmed: "core:default" and "store:default" present. |

#### Plan 12-02 Truths (STO-01, STO-03, STO-04)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | saveKlassen() is async en retourneert Promise<boolean> | VERIFIED | klassen.ts line 127: `export async function saveKlassen(): Promise<boolean>` |
| 7 | loadKlassen() is async, laadt via plugin-store, en voert auto-migratie uit vanuit localStorage | VERIFIED | klassen.ts line 146: `export async function loadKlassen(): Promise<boolean>`. Uses `store.get<string>('klassen')` (line 148) and falls back to `_migrateLocalStorageToStore()` (line 160). |
| 8 | switchActiveKlas(), createKlas() en deleteKlas() zijn async en awaiten saveKlassen() | VERIFIED | klassen.ts lines 53, 81, 93: all three are `async`. Lines 75, 88, 112: all await saveKlassen(). |
| 9 | deleteStudent(klasId, leerlingId) bestaat en voert een hard delete + saveKlassen() uit | VERIFIED | klassen.ts lines 119-124: `export async function deleteStudent(klasId: string, leerlingId: string): Promise<boolean>` — filters students array and returns saveKlassen(). |
| 10 | Bij keychain-fout start app met lege state en toont Nederlandse foutmelding | VERIFIED | klassen.ts lines 162-165: catch block calls showStorageError('Sleutel niet beschikbaar — neem contact op met beheerder') and returns false. |
| 11 | localStorage wordt alleen verwijderd NADAT plugin-store write succesvol is | PARTIAL | VERIFIED in klassen.ts _migrateLocalStorageToStore() (lines 195-206: save checked before removeItem). FAILED in leerlijnen.ts getLeerlijnenMapping() (lines 57-59: removeItem called unconditionally regardless of saveLeerlijnenMapping return value). |

#### Plan 12-03 Truths (STO-01)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 12 | getLeerlijnenMapping() is async en leest uit plugin-store onder key 'leerlijnen' | VERIFIED | leerlijnen.ts line 44: `export async function getLeerlijnenMapping(): Promise<Record<string, string>>`. Line 47: `store.get<string>(LEERLIJNEN_STORE_KEY)`. |
| 13 | saveLeerlijnenMapping() is async en roept store.save() aan na store.set() | VERIFIED | leerlijnen.ts lines 76-86: `export async function saveLeerlijnenMapping(mapping: any): Promise<boolean>`. Lines 78-79: `await store.set(...)` then `await store.save()`. |
| 14 | resetLeerlijnenMapping() is async en verwijdert de 'leerlijnen' store-entry | VERIFIED | leerlijnen.ts lines 93-101: `export async function resetLeerlijnenMapping(): Promise<void>`. Lines 95-96: `await store.delete(LEERLIJNEN_STORE_KEY)` then `await store.save()`. |
| 15 | Leerlijnen auto-migratie: bij aanwezige localStorage-data wordt deze naar plugin-store gemigreerd en legacy key verwijderd | PARTIAL | Migration logic is present (lines 53-60) but WR-02 shows localStorage.removeItem is called unconditionally even if saveLeerlijnenMapping fails. Write-confirm guard missing. |
| 16 | saveState() in datamodel.ts is een no-op (retourneert true, doet niets) | VERIFIED | datamodel.ts lines 214-218: `export function saveState(): boolean { return true; }` with @deprecated JSDoc. |
| 17 | loadState() in datamodel.ts retourneert false met deprecation waarschuwing | VERIFIED | datamodel.ts lines 220-223: `export function loadState(): boolean { console.warn(...); return false; }` |

#### Plan 12-04 Truths (STO-01 through STO-04)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 18 | npm run test -- tests/storage.test.ts slaagt met alle 4 tests groen | VERIFIED (claimed) | SUMMARY states "4 passed, 0 failed". Tests exist in storage.test.ts with correct structure for all 4 STO requirements. Cannot re-run without environment. |
| 19 | Test STO-01: saveKlassen + loadKlassen round-trip herstelt klassenState correct | VERIFIED | storage.test.ts lines 48-64: test body matches specification exactly. |
| 20 | Test STO-02: store bevat mock_encrypted ciphertext, niet de plaintext klasnaam | VERIFIED | storage.test.ts lines 68-75: uses btoa encoding in mock (lines 26-27), asserts `toContain('mock_encrypted:')` and `not.toContain('Geheim')`. |
| 21 | Test STO-03: loadKlassen bij aanwezige localStorage triggert migratie en verwijdert legacy key | VERIFIED | storage.test.ts lines 79-90: sets localStorage, calls loadKlassen(), asserts migration results. |
| 22 | Test STO-04: deleteStudent verwijdert leerling L1, behoudt L2, en store bevat updated ciphertext | VERIFIED | storage.test.ts lines 94-114: sets up two students, calls deleteStudent, asserts L1 removed, L2 remains, store updated. |

**Score:** 10/14 plan-level truths fully VERIFIED. 3 truths PARTIAL (gaps 1-3 above, mapped to must-haves in frontmatter). 1 truth (npm test) assessed from SUMMARY claims + code structure — cannot independently run.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src-tauri/src/crypto.rs` | AES-256-GCM encrypt/decrypt + keychain key management | VERIFIED (with defects) | File exists, 179 lines, both pub async commands present. CR-01 and CR-04 are defects in the production keychain path, not the file's existence. |
| `src-tauri/Cargo.toml` | Plugin and crypto dependencies | VERIFIED | Contains tauri-plugin-store="2", tauri-plugin-secure-storage="1", aes-gcm="0.10.3", base64="0.22". No separate rand dependency. |
| `src-tauri/src/lib.rs` | Plugin registration + command handler | VERIFIED | mod crypto, two plugin inits, both commands in generate_handler!. |
| `utils/klassen.ts` | Async storage API via plugin-store + AES-256-GCM | VERIFIED (with defects) | All required exports present. WR-01 (empty-klassen returns false triggering migration) and WR-03 (deleteStudent no rollback on save failure) are logic defects but not blocking for the phase goal's primary claims. |
| `utils/leerlijnen.ts` | Async leerlijnen storage via plugin-store | VERIFIED (with defect) | All three async functions present. WR-02 (unconditional removeItem) is the partial gap for must-have #11. |
| `utils/datamodel.ts` | Deprecated saveState/loadState | VERIFIED | saveState is no-op returning true; loadState returns false with console.warn. clearState(), appState, addStudent, mergeVerzuim, getVerzuim unchanged. |
| `tests/storage.test.ts` | Vitest unit tests for STO-01–STO-04 | VERIFIED | File exists, 114 lines, 4 test() blocks, vi.mock for both plugin-store and @tauri-apps/api/core. |
| `src-tauri/capabilities/default.json` | store:default permission | VERIFIED | Contains "core:default" and "store:default". Missing "secure-storage:default" — see gap 3. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src-tauri/src/lib.rs` | `src-tauri/src/crypto.rs` | `mod crypto` | WIRED | lib.rs line 2: `mod crypto;` |
| `src-tauri/src/crypto.rs` | OS keychain | `SecureStorageExt` | WIRED | crypto.rs line 12: `use tauri_plugin_secure_storage::{SecureStorageExt, OptionsRequest};` — used in get_or_init_key() and get_key() |
| `utils/klassen.ts saveKlassen` | Rust `crypto::encrypt_klassen` | `invoke('encrypt_klassen', { plaintext })` | WIRED | klassen.ts line 135: `const ciphertext = await invoke<string>('encrypt_klassen', { plaintext });` |
| `utils/klassen.ts loadKlassen` | LazyStore `store.json` | `store.get('klassen')` | WIRED | klassen.ts line 148: `const ciphertext = await store.get<string>('klassen');` |
| `utils/klassen.ts _migrateLocalStorageToStore` | localStorage `mentordashboard_klassen_v1` | `localStorage.getItem(KLASSEN_KEY_V2)` | WIRED | klassen.ts lines 173-174: KLASSEN_KEY_V2 = 'mentordashboard_klassen_v1', localStorage.getItem(KLASSEN_KEY_V2) |
| `utils/leerlijnen.ts saveLeerlijnenMapping` | LazyStore `store.json` | `store.set('leerlijnen', ...)` | WIRED | leerlijnen.ts line 78: `await store.set(LEERLIJNEN_STORE_KEY, JSON.stringify(mapping));` |
| `utils/leerlijnen.ts getLeerlijnenMapping` | localStorage legacy key | `localStorage.getItem(LEERLIJNEN_LEGACY_KEY)` | WIRED | leerlijnen.ts line 53: `const legacy = localStorage.getItem(LEERLIJNEN_LEGACY_KEY);` |
| `tests/storage.test.ts` | `utils/klassen.ts` | direct import | WIRED | storage.test.ts line 36: `import { klassenState, saveKlassen, loadKlassen, deleteStudent } from '../utils/klassen';` |
| `tests/storage.test.ts vi.mock` | `@tauri-apps/plugin-store LazyStore` | `_storeData` Map | WIRED | storage.test.ts lines 11-19: vi.mock with class stub using _storeData |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `utils/klassen.ts` saveKlassen | klassenState.klassen | In-memory state → invoke('encrypt_klassen') → store.set('klassen') | Yes — encrypts real state and persists | FLOWING |
| `utils/klassen.ts` loadKlassen | ciphertext from store | store.get('klassen') → invoke('decrypt_klassen') → JSON.parse | Yes — decrypts real ciphertext from store | FLOWING |
| `utils/klassen.ts` deleteStudent | klas.students | In-memory filter → saveKlassen() re-encrypt | Yes — modifies real in-memory data and persists | FLOWING |
| `utils/leerlijnen.ts` getLeerlijnenMapping | stored from plugin-store | store.get('leerlijnen') → JSON.parse | Yes — reads real store data | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: PARTIALLY RUNNABLE — TypeScript modules cannot be run in isolation without the Tauri runtime. Tests were the designated proxy.

| Behavior | Evidence | Status |
|----------|----------|--------|
| saveKlassen encrypts before storing | storage.test.ts STO-02: stored value contains 'mock_encrypted:', does not contain plaintext | PASS (via test mock) |
| loadKlassen restores klassenState after save | storage.test.ts STO-01: round-trip test passes | PASS (via test mock) |
| Migration removes localStorage only after store write | klassen.ts lines 195-206: explicit save-result check before removeItem | PASS (klassen path); FAIL (leerlijnen path — WR-02) |
| deleteStudent removes target student and saves | storage.test.ts STO-04: L1 removed, L2 present, store updated | PASS (via test mock) |

---

### Probe Execution

Step 7c: No probe scripts declared in PLAN files. No `scripts/*/tests/probe-*.sh` found. SKIPPED.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| STO-01 | 12-02, 12-03, 12-04 | Alle klassendata opgeslagen via Tauri plugin-store | SATISFIED | klassen.ts: saveKlassen uses store.set/store.save; loadKlassen uses store.get; no localStorage.setItem remains |
| STO-02 | 12-01, 12-04 | Leerlingdata versleuteld opgeslagen (AES-256-GCM) met sleutel in OS keychain | SATISFIED (with defects) | crypto.rs: AES-256-GCM encrypt/decrypt commands registered; key stored in OS keychain via KEY_IDENTIFIER. Defects CR-01/CR-04 affect robustness but not the fundamental encryption mechanism. |
| STO-03 | 12-02, 12-04 | Bestaande localStorage-data automatisch gemigreerd bij eerste app-start | PARTIAL | klassen.ts: _migrateLocalStorageToStore correctly guarded (D-12-15 compliant). leerlijnen.ts: migration removes localStorage unconditionally (WR-02 — guard missing). The primary klassen migration path is correct; leerlijnen path has the defect. |
| STO-04 | 12-02, 12-04 | Mentor kan individuele leerling volledig verwijderen (Artikel 17 AVG) | SATISFIED | deleteStudent exists with correct signature and implementation: filters students array + re-encrypts entire blob. WR-03 (no rollback on save failure) is a robustness concern, not an AVG compliance blocker — deletion is attempted and the store write is triggered. |

All four STO requirements are addressed. STO-03 has a partial defect limited to the leerlijnen migration path.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src-tauri/src/crypto.rs` | 40, 80 | Key bytes passed to `from_slice()` without length validation | BLOCKER | Runtime panic if keychain entry is not exactly 32 bytes (CR-01). This is a crash path, not a graceful error. |
| `src-tauri/src/crypto.rs` | 122 | `if decoded.len() < 12` — wrong minimum (should be 28) | WARNING | Valid AES-GCM minimum is 12 nonce + 16 tag = 28. Inputs 12-27 bytes pass the guard and fail decrypt with opaque error (CR-04). |
| `utils/leerlijnen.ts` | 57-59 | `localStorage.removeItem()` called unconditionally after `saveLeerlijnenMapping()` | WARNING | If store write fails, legacy data permanently lost (WR-02). Correct guard exists in klassen.ts but was not applied here. |
| `utils/klassen.ts` | 156 | `return Object.keys(klassenState.klassen).length > 0` after successful decrypt | WARNING | Valid empty-klassen state returns false, triggering unintended localStorage migration (WR-01). |
| `utils/klassen.ts` | 119-124 | `deleteStudent` mutates in-memory then saves; no rollback on save failure | WARNING | Student is gone from memory but still on disk after save failure; restored on restart (WR-03). |
| `utils/klassen.ts` | 71 | `'klas_' + Date.now().toString(36)` for class ID generation | WARNING | Timestamp-only ID collides if called twice within same millisecond (WR-04). |
| `utils/datamodel.ts` | 86 | Module-level `console.log` on import | INFO | Emits on every page load; no user-visible action. |
| `utils/klassen.ts` | 254 | Module-level `console.log` on import | INFO | Same as above. |
| `utils/leerlijnen.ts` | 103 | Module-level `console.log` on import | INFO | Same as above. |
| `tests/storage.test.ts` | 26-30 | `unescape`/`escape` deprecated Web APIs in test mock | INFO | Works in current jsdom but deprecated; test-only impact (IN-02). |

**Debt marker gate:** No `TBD`, `FIXME`, or `XXX` markers found in any phase-12 modified file.

---

### Human Verification Required

#### 1. tauri-plugin-secure-storage capability requirement

**Test:** Build the Tauri app in development mode and trigger loadKlassen() at startup. Check whether the OS keychain read succeeds or throws "Sleutel niet beschikbaar — neem contact op met beheerder".
**Expected:** Keychain operations succeed without any capability error from Tauri's capability system. If they fail with a permission/capability error, add "secure-storage:default" to capabilities/default.json.
**Why human:** The plan's PATTERNS.md explicitly decided NOT to add this capability (only Rust-side calls, no JS IPC surface). The code review (CR-03) disputes this — the answer depends on Tauri 2's exact capability enforcement for Rust-side plugin usage. Cannot determine the correct answer by static analysis alone.

#### 2. cargo test actual pass/fail

**Test:** Run `cargo test --manifest-path src-tauri/Cargo.toml` and confirm `encrypt_decrypt_roundtrip` and `wire_format_nonce_prepended` both pass.
**Expected:** 2 tests passed, 0 failed.
**Why human:** Cannot execute Rust compilation in this verification environment. SUMMARY claims cargo test passed — need to confirm the claim holds for the current state of crypto.rs.

---

### Gaps Summary

Three gaps are blocking full goal achievement:

**Gap 1 — Rust key-length panic + wrong decrypt guard (CR-01, CR-04):**
The production AES-GCM encryption path in crypto.rs will panic the Tauri process (not return a graceful error) if the OS keychain entry contains any value other than exactly 32 bytes. This covers OS credential corruption, manual editing, or future key rotation. The decrypt minimum-length guard (12 bytes) is also too low by 16 bytes, causing the decrypt function to accept structurally invalid input. These are in the same file and can be fixed with two targeted additions. The unit test passes because it uses a fixed key and does not exercise the keychain path.

**Gap 2 — Leerlijnen migration removes localStorage unconditionally (WR-02):**
`leerlijnen.ts` getLeerlijnenMapping() calls `saveLeerlijnenMapping(parsed)` but ignores its return value. `localStorage.removeItem(LEERLIJNEN_LEGACY_KEY)` executes even if the store write failed. This violates the D-12-15 guarantee ("localStorage only removed after confirmed write") for the leerlijnen migration path. The klassen.ts equivalent correctly checks the save result. One-line fix: capture the return value and gate removeItem on `saved === true`.

**Gap 3 — Uncertain secure-storage capability requirement (CR-03):**
The plan decision to omit "secure-storage:default" from capabilities/default.json may be incorrect for Tauri 2. If the capability is required even for Rust-side plugin usage, every keychain call will fail at runtime with an error that presents to the user as "Sleutel niet beschikbaar". This cannot be resolved by static analysis — requires a runtime test.

**Root cause pattern:** Gaps 1 and 2 share the same root: the code review (committed in 1666cba) identified these issues after the phase was otherwise complete, but no fix commits followed. The review is documented but its findings were not actioned before phase submission.

---

_Verified: 2026-05-14T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
