# Phase 12: Versleutelde Opslag - Research

**Researched:** 2026-05-14
**Domain:** Tauri plugin-store, AES-256-GCM (Rust), OS keychain (tauri-plugin-secure-storage), async storage migration
**Confidence:** MEDIUM-HIGH — core APIs verified via official docs and npm/cargo registries; SecureStorage method signatures partially inferred from source structure (LOW on exact signatures)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-12-01:** Alleen klas-/leerlingdata (`klassen.ts`) wordt versleuteld met AES-256-GCM. Leerlijnen-mapping (`leerlijnen.ts`) is niet persoonsgebonden — blijft onversleuteld in plugin-store.
- **D-12-02:** Één app-level AES-256 sleutel voor alle klassendata; opgeslagen in OS keychain onder identifier `nl.cios.mentordashboard.key`.
- **D-12-03:** Rust-zijde genereert de AES-sleutel met `rand::rngs::OsRng` en slaat hem op via `tauri-plugin-secure-storage`. De key verlaat nooit de Rust-zijde — TypeScript krijgt nooit de raw key bytes.
- **D-12-04:** Ciphertext-formaat: Base64-encoded string van 12-byte nonce + AES-256-GCM ciphertext. plugin-store slaat dit als plain string op onder de `'klassen'` key.
- **D-12-05:** Één `'klassen'` store-entry — encrypted Base64 blob van het volledige `{ klassen, activeKlasId }` object. Één atomaire write per save.
- **D-12-06:** Aparte `'leerlijnen'` store-entry — plain JSON string (onversleuteld, geen persoonsdata).
- **D-12-07:** `saveState()` en `loadState()` in `utils/datamodel.ts` worden deprecated: `saveState()` wordt een no-op, `loadState()` wordt verwijderd. `klassen.ts` is de enige bron van waarheid voor persistentie.
- **D-12-08:** Async-first API: `saveKlassen(): Promise<boolean>`, `loadKlassen(): Promise<boolean>`. Alle callers awaiten. Geen fire-and-forget.
- **D-12-09:** TypeScript gebruikt `@tauri-apps/plugin-store` binding direct voor Store.get/set/save. Encrypt/decrypt loopt via twee Rust Tauri commands: `encrypt_klassen(plaintext: String) -> String` en `decrypt_klassen(ciphertext: String) -> String`.
- **D-12-10:** Standaard Tauri app data directory voor plugin-store bestand — geen handmatig pad.
- **D-12-11:** Phase 12 levert uitsluitend de TypeScript-functie `deleteStudent(klasId: string, leerlingId: string): Promise<boolean>` in `utils/klassen.ts`. Geen UI-wiring in Phase 12.
- **D-12-12:** Hard delete: leerling verwijderd uit `klassenState.klassen[klasId].students[]`, gevolgd door `saveKlassen()`. AVG Art. 17 compliant.
- **D-12-13:** Vitest unit test in `tests/storage.test.ts` met gemockte plugin-store (in-memory map als stub).
- **D-12-14:** Auto-migratie bij app-start: `loadKlassen()` detecteert leeg plugin-store + aanwezige localStorage → migreer automatisch → verwijder localStorage-entries na succesvolle write.
- **D-12-15:** Bij mislukte migratie: rollback — localStorage-entries NIET verwijderd, app start met lege klassenlijst, `console.error` + zichtbare foutmelding in UI.
- **D-12-16:** Bij keychain-fout tijdens `loadKlassen()`: app start met lege state, duidelijke Nederlandse foutmelding ("Sleutel niet beschikbaar — neem contact op met beheerder"), encrypted blob op schijf blijft onaangeroerd.

### Claude's Discretion

- Exacte Rust crate-keuze voor AES-256-GCM (bijv. `aes-gcm` crate)
- Tauri command namen (bijv. `encrypt_klassen` / `decrypt_klassen`)
- Exacte error types in Rust commands (`tauri::Error` of `String`)
- Plugin-store bestandsnaam (bijv. `store.json`)

### Deferred Ideas (OUT OF SCOPE)

- UI voor deleteStudent() — Phase 14
- Verwijder-functie voor hele klassen — Phase 14
- Key rotation strategie — post-v2.0
- Audit log van verwijderingen — post-v2.0
- Cross-platform keychain testen op macOS — Phase 15
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STO-01 | Alle klassendata overleeft een app-herstart — opgeslagen via plugin-store, niet localStorage | plugin-store LazyStore/Store API; async get/set/save pattern verified |
| STO-02 | Opgeslagen leerlingdata is versleuteld op schijf (AES-256-GCM); encryptiesleutel uitsluitend in OS keychain | aes-gcm 0.10.3 crate + tauri-plugin-secure-storage 1.5.0 Rust-side set_item/get_item |
| STO-03 | Bij eerste start worden bestaande localStorage-gegevens automatisch gemigreerd zonder dataverlies | Migration pattern: detect empty store + localStorage keys, write to store, remove localStorage |
| STO-04 | Mentor kan individuele leerling verwijderen — data volledig gewist (Art. 17 AVG) | deleteStudent() function pattern; saveKlassen() re-encrypts and persists |
</phase_requirements>

---

## Summary

Phase 12 introduces three distinct technical layers that must work together: (1) Tauri `plugin-store` for durable key-value persistence via JSON file in the OS app data directory, (2) AES-256-GCM encryption in Rust using the `aes-gcm` crate, with the key stored exclusively in the OS keychain via `tauri-plugin-secure-storage`, and (3) an async TypeScript API that replaces all synchronous `localStorage` calls with `await invoke()` calls for crypto operations and `await store.get()/set()/save()` for storage.

The most important architectural constraint is that the AES key never leaves the Rust layer. TypeScript sends plaintext JSON to a Rust Tauri command which encrypts it and returns Base64 ciphertext; on load, TypeScript sends ciphertext to Rust which decrypts and returns plaintext JSON. This means `saveKlassen()` and `loadKlassen()` each require two async steps: one `invoke()` round-trip for crypto, one `store.set()/get()` round-trip for storage.

Migration logic sits inside `loadKlassen()`: if plugin-store has no `'klassen'` key but `localStorage.getItem('mentordashboard_klassen_v1')` or `mentordashboard_v1` exist, the migration path triggers — encrypt the old data, write to plugin-store, and only then remove the localStorage entries. On failure, localStorage is preserved (no data loss).

**Primary recommendation:** Use `aes-gcm = "0.10.3"` (stable; `0.11.0` is RC), `tauri-plugin-secure-storage = "1.5.0"`, `tauri-plugin-store = "2"`, `@tauri-apps/plugin-store = "2.4.3"`. Use `LazyStore` in TypeScript for deferred initialization. Use `Result<String, String>` as Tauri command return types.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Encrypt/decrypt klassendata | API / Rust backend (Tauri command) | — | Key never leaves Rust; D-12-03 |
| AES key lifecycle (generate/retrieve) | API / Rust backend | OS keychain | Key is generated in Rust, stored in system keychain |
| Persist ciphertext to disk | Frontend Server (plugin-store) | — | plugin-store writes to app_data_dir |
| Load/save leerlijnen (plain) | Frontend Server (plugin-store) | — | Unencrypted plain JSON; D-12-06 |
| Async storage API surface | Browser / Client (TypeScript) | Rust commands | saveKlassen/loadKlassen called from TS; crypto via invoke |
| Auto-migration detection | Browser / Client (TypeScript) | — | loadKlassen detects empty store + localStorage presence |
| deleteStudent() | Browser / Client (TypeScript) | Rust (via saveKlassen) | Filter students array then saveKlassen; D-12-12 |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tauri-plugin-store | 2.4.3 (Cargo: `"2"`) | Durable key-value store (JSON file in app_data_dir) | Official Tauri plugin; replaces localStorage |
| @tauri-apps/plugin-store | 2.4.3 | TypeScript bindings for plugin-store | Matches Rust plugin; provides LazyStore/Store classes |
| tauri-plugin-secure-storage | 1.5.0 | OS keychain read/write (Windows Credential Manager / macOS Keychain) | Community standard for Tauri keychain; uses `keyring ^3` crate underneath |
| aes-gcm | 0.10.3 | AES-256-GCM authenticated encryption in Rust | RustCrypto standard; NCC Group security audit; pure Rust |
| base64 | 0.22.1 | Base64 encode/decode for ciphertext transport | Used for nonce+ciphertext wire format |
| rand | 0.10.1 | `OsRng` for cryptographically secure nonce generation | OsRng is the correct source for crypto randomness |

**Version verification:**
- `@tauri-apps/plugin-store`: verified `2.4.3` (npm registry, 2026-05-02) [VERIFIED: npm registry]
- `tauri-plugin-secure-storage`: verified `1.5.0` (cargo search, 2026-05-14) [VERIFIED: cargo search]
- `aes-gcm`: latest stable `0.10.3` (`0.11.0-rc.3` is pre-release — do not use) [VERIFIED: cargo search]
- `base64`: verified `0.22.1` [VERIFIED: cargo search]
- `rand`: verified `0.10.1` [VERIFIED: cargo search]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| serde / serde_json | 1 (already in Cargo.toml) | Serialize klassenState to JSON string before encryption | Always — already present |
| tauri-plugin-opener | 2 (already in Cargo.toml) | Existing plugin — leave untouched | Already registered |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tauri-plugin-secure-storage | keyring crate directly | secure-storage is a Tauri plugin wrapper; easier integration; adds JS binding we don't need but Rust side is same |
| aes-gcm 0.10.3 | aes-gcm 0.11.0-rc.3 | 0.11 is pre-release (edition 2024); avoid for production |
| base64 crate | base64::engine in aes-gcm | base64 0.22 has explicit engine API — cleaner than inline encoding |

**Installation (Cargo.toml additions):**
```toml
tauri-plugin-store = "2"
tauri-plugin-secure-storage = "1"
aes-gcm = "0.10.3"
base64 = "0.22"
rand = { version = "0.8", features = ["getrandom"] }
```

> **Note on rand version:** `rand` 0.10.1 is the latest, but `aes-gcm` 0.10.3 uses `rand_core` under its `aead` dependency. For `OsRng` in a Tauri command, import from `rand::rngs::OsRng` with `rand = "0.8"` (which is what `aes-gcm` 0.10's dependency chain expects) OR use `aes_gcm::aead::OsRng` directly from the `aes-gcm` re-export. [ASSUMED — verify the exact rand version compatible with aes-gcm 0.10.3 by checking Cargo.lock after initial add]

**npm installation:**
```bash
npm install @tauri-apps/plugin-store
```

---

## Architecture Patterns

### System Architecture Diagram

```
TypeScript (klassen.ts)
  │
  ├─ saveKlassen()
  │     │
  │     ├─ JSON.stringify(klassenState) ──► invoke('encrypt_klassen', {plaintext})
  │     │                                         │
  │     │                                   Rust: encrypt_klassen()
  │     │                                         ├─ get key from keychain (set_item if first run)
  │     │                                         ├─ AES-256-GCM encrypt with OsRng nonce
  │     │                                         └─ return Base64(nonce || ciphertext)
  │     │
  │     └─ store.set('klassen', base64Blob) → store.save()
  │
  ├─ loadKlassen()
  │     │
  │     ├─ store.get('klassen') → base64Blob?
  │     │     ├─ [found] invoke('decrypt_klassen', {ciphertext}) → plaintext JSON
  │     │     │           └─ parse → klassenState (return true)
  │     │     │
  │     │     └─ [not found] check localStorage → migration path
  │     │           ├─ [has data] encrypt → store.set → store.save → localStorage.removeItem
  │     │           └─ [no data] return false (empty state)
  │     │
  │     └─ keychain error → lege state + NL foutmelding → return false
  │
  └─ deleteStudent(klasId, leerlingId)
        ├─ filter klassenState.klassen[klasId].students
        └─ saveKlassen() → re-encrypt + persist

OS Keychain (Windows Credential Manager / macOS Keychain)
  └─ key: 'nl.cios.mentordashboard.key' → 32 random bytes (AES-256 key)

plugin-store file: app_data_dir/store.json
  └─ { 'klassen': '<base64>', 'leerlijnen': '<json>' }
```

### Recommended Project Structure

```
src-tauri/
├── src/
│   ├── lib.rs              # Plugin registration + command registration
│   └── crypto.rs           # encrypt_klassen, decrypt_klassen, init_key commands
utils/
├── klassen.ts              # MODIFIED: async saveKlassen/loadKlassen + deleteStudent
├── datamodel.ts            # MODIFIED: saveState() → no-op, loadState() removed
└── leerlijnen.ts           # MODIFIED: localStorage → plugin-store (plain JSON)
tests/
└── storage.test.ts         # NEW: deleteStudent + saveKlassen mock tests (STO-04, STO-01)
```

### Pattern 1: Rust Tauri Command with AppHandle for Plugin Access

```rust
// Source: https://v2.tauri.app/develop/calling-rust/ [CITED]
use tauri::AppHandle;
use tauri_plugin_secure_storage::SecureStorageExt;
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key,
};
use base64::{engine::general_purpose::STANDARD, Engine};

#[tauri::command]
async fn encrypt_klassen(app: AppHandle, plaintext: String) -> Result<String, String> {
    // 1. Get or generate AES key from keychain
    let key_bytes = get_or_init_key(&app)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // 2. Generate fresh nonce (12 bytes, cryptographically random)
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    // 3. Encrypt
    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encrypt failed: {e}"))?;

    // 4. Encode: Base64(nonce || ciphertext)
    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(STANDARD.encode(&combined))
}

#[tauri::command]
async fn decrypt_klassen(app: AppHandle, ciphertext: String) -> Result<String, String> {
    let key_bytes = get_key(&app)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let decoded = STANDARD.decode(&ciphertext).map_err(|e| format!("Base64 decode: {e}"))?;
    if decoded.len() < 12 {
        return Err("Ciphertext too short".into());
    }
    let (nonce_bytes, ct) = decoded.split_at(12);
    let nonce = aes_gcm::Nonce::from_slice(nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ct)
        .map_err(|_| "Decrypt failed — data corrupt or wrong key".to_string())?;
    String::from_utf8(plaintext).map_err(|e| format!("UTF-8 decode: {e}"))
}
```

### Pattern 2: Key Initialization via SecureStorageExt

```rust
// Source: docs.rs/tauri-plugin-secure-storage [CITED: trait name SecureStorageExt, methods get_item/set_item inferred from source structure]
use tauri_plugin_secure_storage::SecureStorageExt;

const KEY_IDENTIFIER: &str = "nl.cios.mentordashboard.key";

fn get_or_init_key(app: &AppHandle) -> Result<Vec<u8>, String> {
    let storage = app.secure_storage();

    // Try to retrieve existing key
    match storage.get_item(KEY_IDENTIFIER) {
        Ok(response) => {
            // GetItemResponse contains the stored value
            // Decode from Base64 string storage
            STANDARD.decode(response.value)
                .map_err(|e| format!("Key decode error: {e}"))
        }
        Err(_) => {
            // Key doesn't exist — generate and store
            let key = Aes256Gcm::generate_key(OsRng);
            let key_b64 = STANDARD.encode(&key);
            storage
                .set_item(KEY_IDENTIFIER, &key_b64)
                .map_err(|e| format!("Keychain write failed: {e}"))?;
            Ok(key.to_vec())
        }
    }
}

fn get_key(app: &AppHandle) -> Result<Vec<u8>, String> {
    let storage = app.secure_storage();
    let response = storage
        .get_item(KEY_IDENTIFIER)
        .map_err(|_| "Sleutel niet beschikbaar — neem contact op met beheerder".to_string())?;
    STANDARD.decode(response.value)
        .map_err(|e| format!("Key decode error: {e}"))
}
```

> **IMPORTANT — API name uncertainty:** The `SecureStorage` struct has methods named `get_item`, `set_item`, and `remove_item` as confirmed by the source structure at `docs.rs/crate/tauri-plugin-secure-storage/1.5.0/source/src/lib.rs`. The exact signature of `GetItemResponse` and its fields is `[ASSUMED]` — verify the actual field name (likely `.value` or `.password`) when implementing. [LOW confidence on exact field name]

### Pattern 3: lib.rs Plugin + Command Registration

```rust
// Source: https://v2.tauri.app/develop/calling-rust/ [CITED]
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_secure_storage::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            encrypt_klassen,
            decrypt_klassen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Pattern 4: TypeScript async saveKlassen / loadKlassen

```typescript
// Source: https://v2.tauri.app/reference/javascript/store/ [CITED]
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json');

export async function saveKlassen(): Promise<boolean> {
  try {
    const payload = {
      klassen: klassenState.klassen,
      activeKlasId: klassenState.activeKlasId,
      savedAt: new Date().toISOString(),
    };
    const plaintext = JSON.stringify(payload);
    const ciphertext = await invoke<string>('encrypt_klassen', { plaintext });
    await store.set('klassen', ciphertext);
    await store.save();
    return true;
  } catch (e) {
    console.error('[klassen.ts] saveKlassen mislukt:', e);
    return false;
  }
}

export async function loadKlassen(): Promise<boolean> {
  try {
    const ciphertext = await store.get<string>('klassen');
    if (ciphertext) {
      const plaintext = await invoke<string>('decrypt_klassen', { ciphertext });
      const data = JSON.parse(plaintext);
      // restore klassenState...
      return true;
    }
    // No plugin-store data — attempt migration
    return _migrateLocalStorageToStore();
  } catch (e) {
    console.error('[klassen.ts] loadKlassen mislukt:', e);
    // D-12-16: keychain error — show NL error, start with empty state
    showErrorMessage('Sleutel niet beschikbaar — neem contact op met beheerder');
    return false;
  }
}
```

### Pattern 5: Vitest Mock for plugin-store

```typescript
// Source: https://vitest.dev/guide/mocking/modules [CITED]
// tests/storage.test.ts

import { vi, describe, it, expect, beforeEach } from 'vitest';

// In-memory store stub
const _storeData = new Map<string, unknown>();

vi.mock('@tauri-apps/plugin-store', () => ({
  LazyStore: vi.fn().mockImplementation(() => ({
    get: vi.fn(async (key: string) => _storeData.get(key)),
    set: vi.fn(async (key: string, value: unknown) => { _storeData.set(key, value); }),
    save: vi.fn(async () => {}),
  })),
}));

// Mock invoke for crypto commands
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args: any) => {
    if (cmd === 'encrypt_klassen') return `encrypted:${args.plaintext}`;
    if (cmd === 'decrypt_klassen') return args.ciphertext.replace('encrypted:', '');
    return null;
  }),
}));

beforeEach(() => {
  _storeData.clear();
});
```

### Anti-Patterns to Avoid

- **Synchronous saveKlassen callers:** Every call site that previously called `saveKlassen()` synchronously must be converted to `await saveKlassen()`. Missing an `await` on a `Promise<boolean>` silently discards errors.
- **Calling generate_key on every encrypt:** The AES key must be stable across app sessions. It is generated once (stored in keychain) and retrieved on each call. Never generate a fresh key inside `encrypt_klassen` without keychain persistence.
- **Non-unique nonces:** Never reuse a nonce with the same key. The `Aes256Gcm::generate_nonce(&mut OsRng)` call inside encrypt_klassen must run on every encryption call, not be cached.
- **Storing raw key bytes in plugin-store:** The key must live in the OS keychain, not in `store.json`. Storing it alongside the ciphertext would defeat encryption.
- **Fire-and-forget saves:** `store.save()` must be awaited. Without `save()`, changes are in-memory only and lost on restart.
- **Removing localStorage before confirming plugin-store write:** In migration, only call `localStorage.removeItem()` after `store.save()` resolves successfully.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AES-256-GCM encryption | Custom XOR/cipher | `aes-gcm` 0.10.3 | NCC Group audited; handles nonce, tag, AEAD correctly |
| Key storage | Encrypted file, config.json | `tauri-plugin-secure-storage` (OS keychain) | OS-level protection; survives app uninstall differently than files |
| Nonce generation | Counter, timestamp, random bytes from `rand::random()` | `Aes256Gcm::generate_nonce(&mut OsRng)` | OsRng uses OS CSPRNG; 96-bit nonce correct size for GCM |
| Base64 encoding | Manual bit manipulation | `base64 = "0.22"` `Engine::encode/decode` | Correct padding, URL-safe variants available |
| Key-value persistence | File I/O + serde | `tauri-plugin-store` | Handles file creation, atomic writes, cross-platform paths |
| Async Tauri invoke | Custom fetch/IPC | `@tauri-apps/api/core` `invoke()` | Official Tauri IPC; handles serialization, error propagation |

**Key insight:** AES-GCM authentication tags (16 bytes appended) prevent silent corruption — if data is tampered or decrypted with wrong key, `decrypt()` returns `Err`, not corrupted plaintext. Do not strip the tag.

---

## Common Pitfalls

### Pitfall 1: Windows Credential Manager Password Size Limit (1280 bytes)
**What goes wrong:** Storing AES-256 key bytes (32 bytes raw = ~44 bytes Base64) well under the 1280-byte limit. However, if the `service` name (app identifier) or `username` (key identifier) together are too long, `CredWrite` returns "stub received bad data". [CITED: github.com/jaraco/keyring/issues/355]
**Why it happens:** Windows Credential Manager limits the password blob to 1280 bytes and has constraints on target name length.
**How to avoid:** Identifier `nl.cios.mentordashboard.key` is short; 44-byte Base64 key is far under 1280-byte limit. No action needed, but note for future multi-key scenarios.
**Warning signs:** `CredWrite` error, `keyring::Error::PlatformFailure` from Rust side.

### Pitfall 2: macOS Keychain Prompts on First Write (Development)
**What goes wrong:** During development (`tauri dev`), macOS may show a Keychain access prompt the first time the app writes a key. In production builds (signed), this typically does not prompt. [ASSUMED — known macOS Keychain behavior for unsigned apps]
**Why it happens:** Unsigned apps in development mode are not trusted by Keychain without user confirmation.
**How to avoid:** In Phase 12, development is Windows-only (per STATE.md and Phase 15 scope). macOS testing deferred to Phase 15 (Packaging). Note this pitfall for Phase 15.
**Warning signs:** Keychain dialog appears; `get_item` returns `Err` before dialog is dismissed.

### Pitfall 3: Async Caller Conversion — Non-Exhaustive switchActiveKlas
**What goes wrong:** `switchActiveKlas()` calls `saveKlassen()` synchronously. In Phase 12, `saveKlassen()` becomes `async`. If `switchActiveKlas()` is not converted to `async` and callers don't `await` it, saves are fire-and-forget.
**Why it happens:** Async leaks upward — every function that calls an async function must itself be async (or use `.then()` carefully).
**How to avoid:** Audit all callers of `saveKlassen()`: `switchActiveKlas`, `createKlas`, `deleteKlas`, and any event handlers in `src/main.tsx`. Make all async and verify no synchronous call sites remain.
**Warning signs:** `saveKlassen()` resolves but data not on disk after app restart — store.save() was never awaited.

### Pitfall 4: plugin-store `save()` is Required
**What goes wrong:** `store.set()` updates the in-memory state but does NOT persist to disk. Without a subsequent `store.save()`, data is lost on app restart.
**Why it happens:** plugin-store separates `set` (in-memory) from `save` (disk flush). The `autoSave` option defaults to 100ms debounce — not reliable for critical data.
**How to avoid:** Always call `await store.save()` explicitly after `await store.set()`. Set `autoSave: false` in the LazyStore options to make the behavior explicit.
**Warning signs:** Data present during app session but gone after restart.

### Pitfall 5: First-Run Key Generation Race Condition
**What goes wrong:** If `loadKlassen()` and `saveKlassen()` are called concurrently at startup (e.g., migration reads while initial save writes), both may attempt key generation, and one overwrites the other's keychain entry.
**Why it happens:** Two concurrent calls to `encrypt_klassen` → two calls to `get_or_init_key` → both see missing key → both generate different keys → second one overwrites first → first's ciphertext is now undecryptable.
**How to avoid:** Ensure `loadKlassen()` completes (including migration) before any `saveKlassen()` is called. In `src/main.tsx`, `await loadKlassen()` in sequence before mounting UI that triggers saves.
**Warning signs:** Decrypt fails on first save after migration; `aes-gcm` returns `Err("Decrypt failed")`.

### Pitfall 6: localStorage Unavailable in Tauri with useHttpsScheme: true
**What goes wrong:** localStorage is unreliable in Tauri production with `useHttpsScheme: true` (already set in this project). The migration check may find empty localStorage even if data was stored in an older build.
**Why it happens:** `useHttpsScheme: true` changes the URL scheme; localStorage scope is origin-based, so old data may be inaccessible.
**How to avoid:** The migration path already accounts for this — if localStorage is empty, migration simply doesn't trigger and app starts fresh. Document this expected behavior: users who had localStorage data in the old scheme will experience a fresh start.
**Warning signs:** Migration not triggered even though user had data. Expected and acceptable per D-12-14.

### Pitfall 7: aes-gcm 0.11.0-rc.3 is Pre-Release
**What goes wrong:** `cargo add aes-gcm` without specifying version may install the RC which has API changes and may not compile with edition 2021.
**Why it happens:** cargo search shows `0.11.0-rc.3` as latest, but `0.10.3` is latest stable.
**How to avoid:** Explicitly specify `aes-gcm = "0.10.3"` in Cargo.toml, not `"0.11"` or `"*"`.

---

## Code Examples

### AES-256-GCM Complete Encrypt/Decrypt Pattern

```rust
// Source: https://docs.rs/aes-gcm/0.10.3/aes_gcm/ [CITED]
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use base64::{engine::general_purpose::STANDARD, Engine};

// Encrypt: returns Base64(12-byte-nonce || ciphertext)
fn aes_gcm_encrypt(key_bytes: &[u8; 32], plaintext: &[u8]) -> Result<String, String> {
    let key = Key::<Aes256Gcm>::from_slice(key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng); // 12 bytes

    let ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|e| format!("Encrypt error: {e}"))?;

    let mut combined = nonce.to_vec();       // 12 bytes
    combined.extend_from_slice(&ciphertext); // n + 16 bytes (tag appended by aes-gcm)
    Ok(STANDARD.encode(&combined))
}

// Decrypt: parses Base64, splits nonce, decrypts
fn aes_gcm_decrypt(key_bytes: &[u8; 32], b64: &str) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(key_bytes);
    let cipher = Aes256Gcm::new(key);

    let decoded = STANDARD.decode(b64).map_err(|e| format!("Base64: {e}"))?;
    if decoded.len() < 12 {
        return Err("Ciphertext too short".into());
    }
    let (nonce_bytes, ct) = decoded.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    cipher
        .decrypt(nonce, ct)
        .map_err(|_| "Decrypt failed".into())
}
```

### plugin-store TypeScript Initialization

```typescript
// Source: https://v2.tauri.app/reference/javascript/store/ [CITED]
import { LazyStore } from '@tauri-apps/plugin-store';

// Create once at module scope — LazyStore defers I/O until first access
const store = new LazyStore('store.json', { autoSave: false });
```

### capabilities/default.json (updated)

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Phase 12 — plugin-store + secure-storage permissions",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "store:default",
    "secure-storage:default"
  ]
}
```

> **Note on secure-storage permission:** `"secure-storage:default"` is the [ASSUMED] permission identifier for `tauri-plugin-secure-storage`. The plugin uses Rust-side only (no JS binding), so it may not require frontend capability permissions at all. Verify by checking if the plugin registers any IPC commands — if it's pure Rust with no JS exposure, no capability entry is needed. [LOW confidence — verify during Wave 0]

### Vitest mock for @tauri-apps/plugin-store

```typescript
// Source: https://vitest.dev/guide/mocking/modules [CITED]
// tests/storage.test.ts

const _store = new Map<string, unknown>();

vi.mock('@tauri-apps/plugin-store', () => ({
  LazyStore: vi.fn(() => ({
    get: vi.fn(async (k: string) => _store.get(k) ?? null),
    set: vi.fn(async (k: string, v: unknown) => { _store.set(k, v); }),
    save: vi.fn(async () => {}),
    delete: vi.fn(async (k: string) => { _store.delete(k); }),
  })),
}));
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage (synchronous) | plugin-store (async, file-based) | Tauri 2 + useHttpsScheme | All storage callers become async |
| No encryption | AES-256-GCM with OS keychain key | Phase 12 | AVG/GDPR compliance for student PII |
| saveState() dual-write in datamodel.ts | Deprecated: no-op / removed | Phase 12 | klassen.ts is single writer |
| Stronghold (deprecated) | tauri-plugin-secure-storage | Tauri 2 stable | Stronghold removed from official Tauri plugins |

**Deprecated/outdated:**
- `tauri-plugin-stronghold`: Removed from official Tauri v2 plugins workspace — do not use. [CITED: STATE.md accumulated context]
- `localStorage` for Tauri Tauri apps with `useHttpsScheme: true`: Unreliable — replace with plugin-store. [CITED: STATE.md accumulated context]
- Synchronous `saveKlassen()`: Replaced by `Promise<boolean>` returning async version.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `GetItemResponse` has a `.value` field containing the stored string | Pattern 2 (get_or_init_key) | Compile error; field may be named `.password`, `.data`, or similar — check docs.rs source before implementing |
| A2 | `tauri-plugin-secure-storage` does not require a frontend capability permission (it's Rust-only) | Code Examples (capabilities) | If wrong: app crashes with "permission denied" at runtime; add `"secure-storage:default"` if needed |
| A3 | macOS Keychain shows a prompt for unsigned dev builds | Pitfall 2 | Expected behavior; macOS testing deferred to Phase 15 so low immediate risk |
| A4 | rand 0.8.x OsRng is compatible with aes-gcm 0.10.3 dependency chain | Standard Stack | If wrong: Cargo version resolution conflict — use `aes_gcm::aead::OsRng` re-export instead |
| A5 | `store.json` is the default filename used by LazyStore | Architecture Patterns | If wrong: no crash (it's a valid path), but file location may differ from documented D-12-10 |

---

## Open Questions

1. **Exact `GetItemResponse` field name in tauri-plugin-secure-storage**
   - What we know: The struct exists and holds the stored value; method is `get_item(identifier) -> Result<GetItemResponse>`
   - What's unclear: Field name on `GetItemResponse` (`.value`, `.password`, or `.secret`)
   - Recommendation: Wave 0 task: add `tauri-plugin-secure-storage` to Cargo.toml, run `cargo doc --open`, inspect struct definition before writing crypto.rs

2. **Does tauri-plugin-secure-storage need a capabilities entry?**
   - What we know: It's a Tauri plugin; official plugins require capability entries; but secure-storage has no JS bindings
   - What's unclear: Whether plugins without JS commands still need capability entries
   - Recommendation: Start without entry; if runtime error mentions permission, add `"secure-storage:default"`

3. **rand crate version for OsRng**
   - What we know: aes-gcm 0.10.3 re-exports OsRng via its `aead` dependency
   - What's unclear: Whether `use aes_gcm::aead::OsRng` is the cleanest import or whether an explicit `rand` dependency is needed
   - Recommendation: Use `use aes_gcm::aead::OsRng` to avoid version conflict; only add explicit `rand` if a command needs other rand functionality

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Rust toolchain | Cargo.toml compilation | Confirmed | Rust 1.95.0 | — (resolved blocker, STATE.md) |
| Node.js / npm | @tauri-apps/plugin-store npm install | Confirmed | Present (Phase 10) | — |
| Windows Credential Manager | tauri-plugin-secure-storage on Windows | Confirmed | Built into Windows 11 | — |
| Tauri v2 | Plugin host | Confirmed | 2.x (Phase 10) | — |

**No missing dependencies.** All required runtimes confirmed present from Phase 10/11.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (from package.json devDependencies) |
| Config file | vite.config.ts (test section to be added in Wave 0 if not present) |
| Quick run command | `npm run test -- tests/storage.test.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STO-01 | saveKlassen() persists and loadKlassen() restores state | unit | `npm run test -- tests/storage.test.ts` | ❌ Wave 0 |
| STO-02 | Encrypted blob stored (not plaintext) | unit (mock crypto) | `npm run test -- tests/storage.test.ts` | ❌ Wave 0 |
| STO-03 | Migration: localStorage data appears in plugin-store after loadKlassen() | unit | `npm run test -- tests/storage.test.ts` | ❌ Wave 0 |
| STO-04 | deleteStudent() removes student + saveKlassen() called | unit | `npm run test -- tests/storage.test.ts` | ❌ Wave 0 |

> **Note:** STO-02 (actual AES encryption) cannot be fully unit-tested in Vitest because `encrypt_klassen` is a Rust Tauri command. The Vitest test mocks `invoke()` and verifies the contract (blob stored ≠ plaintext input). Full encryption correctness is validated by the Rust unit test inside `crypto.rs` (using `#[cfg(test)]`).

### Sampling Rate

- **Per task commit:** `npm run test -- tests/storage.test.ts`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green + `npm run typecheck` exit 0 before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/storage.test.ts` — covers STO-01, STO-02, STO-03, STO-04
- [ ] `src-tauri/src/crypto.rs` — Rust unit tests for `aes_gcm_encrypt`/`aes_gcm_decrypt` round-trip
- [ ] `vite.config.ts` — verify test.environment is 'jsdom' (required for localStorage access in migration tests)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes (partial) | deleteStudent() = hard delete; no partial erasure |
| V5 Input Validation | yes | Rust commands validate ciphertext length (≥12 bytes) before decrypt |
| V6 Cryptography | yes | aes-gcm (NCC audited); OsRng nonce; key in OS keychain; key never in TypeScript |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Key extracted from store.json | Information Disclosure | Key lives in OS keychain only; store.json contains ciphertext |
| Nonce reuse (same nonce + key) | Tampering | `Aes256Gcm::generate_nonce(&mut OsRng)` on every encrypt call |
| Ciphertext tampering | Tampering | AES-GCM authentication tag — decrypt returns Err on any bit flip |
| Old localStorage data leakage | Information Disclosure | Migration removes localStorage after successful plugin-store write |
| Race condition on first key gen | Elevation of Privilege | Enforce sequential startup: await loadKlassen() before any saveKlassen() |
| AVG Art. 17 non-compliance | — | Hard delete from students array + saveKlassen() re-encrypts entire blob |

---

## Sources

### Primary (HIGH confidence)
- `https://v2.tauri.app/reference/javascript/store/` — LazyStore/Store API, all TypeScript methods, autoSave, app_data_dir location [CITED]
- `https://v2.tauri.app/develop/calling-rust/` — Tauri command pattern, AppHandle access, generate_handler!, invoke() TypeScript [CITED]
- `https://v2.tauri.app/plugin/store/` — Cargo.toml snippet, lib.rs plugin initialization [CITED]
- `https://docs.rs/aes-gcm/0.10.3/aes_gcm/` — Complete AES-256-GCM API, nonce size, encrypt/decrypt example [CITED]
- npm registry — @tauri-apps/plugin-store version 2.4.3, published 2026-05-02 [VERIFIED: npm registry]
- cargo search — aes-gcm 0.10.3 (stable), aes-gcm 0.11.0-rc.3 (pre-release), tauri-plugin-secure-storage 1.5.0, base64 0.22.1 [VERIFIED: cargo search]

### Secondary (MEDIUM confidence)
- `https://docs.rs/tauri-plugin-secure-storage/latest/tauri_plugin_secure_storage/trait.SecureStorageExt.html` — Confirmed trait name `SecureStorageExt`, method `secure_storage()` returning `&SecureStorage<R>`, command names `get_item`/`set_item`/`remove_item` from source structure [CITED]
- `https://docs.rs/crate/tauri-plugin-secure-storage/1.5.0/source/src/lib.rs` — Confirmed method names via source file structure [CITED]
- `https://vitest.dev/guide/mocking/modules` — vi.mock factory pattern for npm modules [CITED]
- `https://github.com/jaraco/keyring/issues/355` — Windows Credential Manager 1280-byte password limit [CITED]

### Tertiary (LOW confidence)
- macOS Keychain prompts for unsigned dev builds — general knowledge; not verified against tauri-plugin-secure-storage docs specifically [ASSUMED]
- `GetItemResponse.value` field name — inferred from struct name; not confirmed from source [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via cargo search and npm registry
- Architecture: HIGH — based on official Tauri docs and locked decisions from CONTEXT.md
- Plugin-store API: HIGH — verified via official Tauri reference docs
- SecureStorage API (method names): MEDIUM — confirmed command names from source structure; field names ASSUMED
- AES-256-GCM Rust pattern: HIGH — official docs.rs example
- Pitfalls: MEDIUM — most verified; macOS keychain prompt is ASSUMED
- Test mock pattern: HIGH — verified via vitest.dev docs

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (30 days — stable libraries; tauri-plugin-secure-storage is community-maintained, check for API changes before Phase 15)
