# Phase 12: Versleutelde Opslag - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 8
**Analogs found:** 7 / 8 (crypto.rs has no analog — new Rust file, no Rust commands exist yet)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `utils/klassen.ts` | service | async CRUD + file-I/O | `utils/klassen.ts` itself (current sync version) | self — transform |
| `utils/datamodel.ts` | service | deprecation (no-op) | `utils/datamodel.ts` itself | self — trim |
| `utils/leerlijnen.ts` | service | async file-I/O | `utils/leerlijnen.ts` itself (current sync version) | self — transform |
| `src-tauri/src/lib.rs` | config | request-response | `src-tauri/src/lib.rs` itself (current scaffold) | self — extend |
| `src-tauri/src/crypto.rs` | service | request-response | none — new Rust module | no analog |
| `tests/storage.test.ts` | test | CRUD | `tests/backup.test.ts` | role-match |
| `src-tauri/Cargo.toml` | config | — | `src-tauri/Cargo.toml` itself | self — extend |
| `src-tauri/capabilities/default.json` | config | — | `src-tauri/capabilities/default.json` itself | self — extend |

---

## Pattern Assignments

### `utils/klassen.ts` (service, async CRUD + file-I/O)

**Analog:** `utils/klassen.ts` (current synchronous implementation — full file is the reference)

**Imports pattern** (lines 1–6 of current file — replace with):
```typescript
/* utils/klassen.ts — Multi-class state management (Phase 12)
 * Replaces localStorage with plugin-store + AES-256-GCM encryption via Rust commands.
 * Depends on: utils/datamodel.ts (appState only — saveState/loadState deprecated)
 */
import { appState } from './datamodel';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
```

**Store initialization** (module scope — add after imports):
```typescript
// LazyStore defers file I/O until first access; autoSave: false = explicit store.save() required
const store = new LazyStore('store.json', { autoSave: false });
```

**Legacy localStorage key** (line 8 of current file — keep for migration detection only):
```typescript
// Legacy keys — read-only during migration; never written after Phase 12
const KLASSEN_KEY_V2 = 'mentordashboard_klassen_v1';
const KLASSEN_KEY_V1 = 'mentordashboard_v1';
```

**Core saveKlassen pattern** (replaces lines 81–96 of current file):
The current synchronous pattern to replace:
```typescript
// CURRENT (sync) — lines 81-96 utils/klassen.ts
export function saveKlassen(): boolean {
  try {
    var payload = {
      klassen: klassenState.klassen,
      activeKlasId: klassenState.activeKlasId,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(KLASSEN_KEY, JSON.stringify(payload));
    saveState();        // ← deprecated dual-write
    return true;
  } catch (e) {
    console.error('[klassen.ts] saveKlassen mislukt:', e);
    return false;
  }
}
```
Replace with this async pattern (from RESEARCH.md Pattern 4):
```typescript
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
    await store.save();   // REQUIRED: set() is in-memory only; save() flushes to disk
    return true;
  } catch (e) {
    console.error('[klassen.ts] saveKlassen mislukt:', e);
    return false;
  }
}
```

**Core loadKlassen pattern** (replaces lines 99–132 of current file):
The current pattern to replace:
```typescript
// CURRENT (sync) — lines 99-132 utils/klassen.ts
export function loadKlassen(): boolean {
  try {
    var raw = localStorage.getItem(KLASSEN_KEY);
    if (raw) {
      var data = JSON.parse(raw);
      // ... restore klassenState ...
      return Object.keys(klassenState.klassen).length > 0;
    }
  } catch (e) {
    console.error('[klassen.ts] loadKlassen mislukt:', e);
  }
  return _migrateV1ToKlassen();
}
```
Replace with (from RESEARCH.md Pattern 4 + D-12-14 through D-12-16):
```typescript
export async function loadKlassen(): Promise<boolean> {
  try {
    const ciphertext = await store.get<string>('klassen');
    if (ciphertext) {
      const plaintext = await invoke<string>('decrypt_klassen', { ciphertext });
      const data = JSON.parse(plaintext);
      if (data && data.klassen) {
        klassenState.klassen = data.klassen;
        klassenState.activeKlasId = data.activeKlasId || null;
        _restoreBridge();
        return Object.keys(klassenState.klassen).length > 0;
      }
    }
    // No plugin-store data — attempt localStorage migration (D-12-14)
    return _migrateLocalStorageToStore();
  } catch (e) {
    console.error('[klassen.ts] loadKlassen mislukt:', e);
    // D-12-16: keychain error — start with empty state, show NL error
    showStorageError('Sleutel niet beschikbaar — neem contact op met beheerder');
    return false;
  }
}
```

**Bridge restoration helper** (extracted from current lines 109–121 into a named function):
```typescript
// Extracted from existing loadKlassen() lines 109-121 — same logic, named for reuse
function _restoreBridge(): void {
  if (klassenState.activeKlasId && klassenState.klassen[klassenState.activeKlasId]) {
    appState.students = klassenState.klassen[klassenState.activeKlasId].students;
  } else {
    const ids = Object.keys(klassenState.klassen);
    if (ids.length > 0) {
      klassenState.activeKlasId = ids[0];
      appState.students = klassenState.klassen[ids[0]].students;
    } else {
      klassenState.activeKlasId = null;
      appState.students = [];
    }
  }
}
```

**Migration pattern** (replaces _migrateV1ToKlassen, lines 135–165 of current file):
The existing migration function is the structural model — extend it:
```typescript
// CURRENT pattern (lines 135-165) to use as template:
// 1. Read old localStorage key
// 2. Parse and reconstruct state
// 3. Persist under new format
// 4. Remove old key (ONLY after successful write)
// 5. Return boolean

async function _migrateLocalStorageToStore(): Promise<boolean> {
  try {
    // Detect localStorage data (v2 multi-klas format or v1 single-klas)
    const rawV2 = localStorage.getItem(KLASSEN_KEY_V2);
    const rawV1 = localStorage.getItem(KLASSEN_KEY_V1);
    const raw = rawV2 || rawV1;
    if (!raw) return false;

    const oldData = JSON.parse(raw);
    // Reconstruct klassenState from old format
    if (rawV2 && oldData && oldData.klassen) {
      klassenState.klassen = oldData.klassen;
      klassenState.activeKlasId = oldData.activeKlasId || null;
    } else if (rawV1 && oldData && Array.isArray(oldData.students) && oldData.students.length > 0) {
      // v1 single-class migration (same as existing _migrateV1ToKlassen lines 142-155)
      const id = 'klas_' + Date.now().toString(36);
      klassenState.klassen[id] = { id, naam: 'Klas 1', students: oldData.students };
      klassenState.activeKlasId = id;
    } else {
      return false;
    }

    _restoreBridge();

    // Encrypt and persist to plugin-store FIRST (D-12-15: don't remove before confirming write)
    const saved = await saveKlassen();
    if (!saved) {
      // Rollback: keep klassenState empty, don't touch localStorage
      klassenState.klassen = {};
      klassenState.activeKlasId = null;
      appState.students = [];
      return false;
    }

    // Only remove localStorage entries AFTER confirmed write (D-12-14, D-12-15)
    if (rawV2) localStorage.removeItem(KLASSEN_KEY_V2);
    if (rawV1) localStorage.removeItem(KLASSEN_KEY_V1);

    console.log('[klassen.ts] Migratie localStorage → plugin-store geslaagd');
    return true;
  } catch (e) {
    console.error('[klassen.ts] _migrateLocalStorageToStore mislukt:', e);
    return false;
  }
}
```

**Async caller conversion** (switchActiveKlas, createKlas, deleteKlas — lines 17–78 of current file):
All three currently call `saveKlassen()` synchronously. Each must become async:
```typescript
// CURRENT (sync) — line 52:
//   saveKlassen();   ← was fire-and-forget

// REPLACE with awaited pattern in each caller:
export async function switchActiveKlas(klasId: string): Promise<boolean> {
  if (!klassenState.klassen[klasId]) return false;
  klassenState.activeKlasId = klasId;
  appState.students = klassenState.klassen[klasId].students;
  await saveKlassen();   // ← must await; async bubble upward
  return true;
}

// Same pattern for createKlas() and deleteKlas():
// - Add async keyword to function
// - Change return type to Promise<...>
// - await saveKlassen() / await switchActiveKlas()
```

**deleteStudent function** (new — lines after existing exports, before console.log):
```typescript
// D-12-11: Phase 12 function only — UI wiring in Phase 14
// D-12-12: Hard delete — filter students array then re-encrypt entire blob
export async function deleteStudent(klasId: string, leerlingId: string): Promise<boolean> {
  const klas = klassenState.klassen[klasId];
  if (!klas) return false;
  klas.students = klas.students.filter((s: any) => s.leerlingId !== leerlingId);
  return saveKlassen();
}
```

**Error display helper** (new — module-level, before exports):
```typescript
// Show error in UI for critical storage failures (D-12-15, D-12-16)
// Phase 12: console.error + DOM insertion as minimal viable error display
// Phase 14: replace with React toast/modal
function showStorageError(message: string): void {
  console.error('[klassen.ts] Opslag fout:', message);
  // Minimal UI notification — Phase 14 will replace with proper React component
  const el = document.getElementById('storage-error-banner');
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}
```

**Error handling pattern** (current lines 92–95 and 127–131 — preserve):
```typescript
// EXISTING pattern — keep identical for all catch blocks:
  } catch (e) {
    console.error('[klassen.ts] saveKlassen mislukt:', e);
    return false;
  }
```

---

### `utils/datamodel.ts` (service, deprecation — no-op)

**Analog:** `utils/datamodel.ts` itself (lines 218–261 are the target section)

**saveState deprecation** (lines 218–230 — replace body with no-op):
```typescript
// CURRENT (lines 218-230):
export function saveState(): boolean {
  try {
    var data = { students: appState.students, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e: any) {
    console.warn('[datamodel] saveState mislukt:', e.message);
    return false;
  }
}

// REPLACE with no-op per D-12-07:
/** @deprecated Phase 12: klassen.ts is the single writer. This is a no-op. */
export function saveState(): boolean {
  // Deprecated: replaced by saveKlassen() in utils/klassen.ts (D-12-07)
  return true;
}
```

**loadState deprecation** (lines 236–251 — remove or stub):
```typescript
// CURRENT (lines 236-251) — remove entirely per D-12-07.
// If callers exist that cannot be updated immediately, replace with:
/** @deprecated Phase 12: removed. Use loadKlassen() from utils/klassen.ts. */
export function loadState(): boolean {
  console.warn('[datamodel] loadState is deprecated — use loadKlassen() from klassen.ts');
  return false;
}
```

**STORAGE_KEY** (line 212 — keep for clearState reference, not for new writes):
```typescript
// Keep STORAGE_KEY for clearState() only — clearState() still removes the legacy key
var STORAGE_KEY = 'mentordashboard_v1';
```

**clearState** (lines 256–261 — keep unchanged): no modification needed; still valid for clearing in-memory state and legacy localStorage key.

---

### `utils/leerlijnen.ts` (service, async file-I/O — plain JSON, unencrypted)

**Analog:** `utils/leerlijnen.ts` itself (full file is the reference — same structure, replace localStorage calls)

**Imports pattern** (lines 1–12 — replace STORAGE_KEY with plugin-store):
```typescript
// ADD at top after existing import:
import { LazyStore } from '@tauri-apps/plugin-store';

// REMOVE:
// const STORAGE_KEY = 'mentordashboard_leerlijnen_v1';

// ADD module-level store (shared with klassen.ts store.json via same LazyStore instance):
const store = new LazyStore('store.json', { autoSave: false });
const LEERLIJNEN_STORE_KEY = 'leerlijnen';  // plugin-store key per D-12-06
const LEERLIJNEN_LEGACY_KEY = 'mentordashboard_leerlijnen_v1';  // read-only for migration
```

**getLeerlijnenMapping async conversion** (lines 40–58 — make async):
```typescript
// CURRENT (sync, lines 40-58):
export function getLeerlijnenMapping(): Record<string, string> {
  if (_cachedMapping !== null) return _cachedMapping;
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    // ...
  }
}

// REPLACE with:
export async function getLeerlijnenMapping(): Promise<Record<string, string>> {
  if (_cachedMapping !== null) return _cachedMapping;
  try {
    const stored = await store.get<string>(LEERLIJNEN_STORE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValid(parsed)) {
        _cachedMapping = parsed;
        return _cachedMapping!;
      }
    }
    // No plugin-store data — check legacy localStorage (migration path)
    const legacy = localStorage.getItem(LEERLIJNEN_LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (isValid(parsed)) {
        // Migrate silently: save to plugin-store, remove legacy key
        await saveLeerlijnenMapping(parsed);
        localStorage.removeItem(LEERLIJNEN_LEGACY_KEY);
        _cachedMapping = parsed;
        return _cachedMapping!;
      }
    }
  } catch (e: any) {
    console.warn('[leerlijnen.ts] read error:', e);
  }
  _cachedMapping = buildDefault();
  return _cachedMapping;
}
```

**saveLeerlijnenMapping async conversion** (lines 66–75 — make async):
```typescript
// CURRENT (sync, lines 66-75):
export function saveLeerlijnenMapping(mapping: any): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
    _cachedMapping = null;
    return true;
  } catch (e: any) {
    console.warn('[leerlijnen.ts] localStorage write error:', e);
    return false;
  }
}

// REPLACE with:
export async function saveLeerlijnenMapping(mapping: any): Promise<boolean> {
  try {
    await store.set(LEERLIJNEN_STORE_KEY, JSON.stringify(mapping));
    await store.save();   // REQUIRED: explicit flush (D-12 anti-pattern: fire-and-forget)
    _cachedMapping = null;
    return true;
  } catch (e: any) {
    console.warn('[leerlijnen.ts] plugin-store write error:', e);
    return false;
  }
}
```

**resetLeerlijnenMapping** (lines 83–89 — make async):
```typescript
export async function resetLeerlijnenMapping(): Promise<void> {
  try {
    await store.delete(LEERLIJNEN_STORE_KEY);
    await store.save();
  } catch (e: any) {
    console.warn('[leerlijnen.ts] plugin-store remove error:', e);
  }
  _cachedMapping = null;
}
```

---

### `src-tauri/src/lib.rs` (config, request-response — extend scaffold)

**Analog:** `src-tauri/src/lib.rs` itself (all 14 lines are the reference)

**Current pattern** (lines 1–14 — full file):
```rust
// CURRENT lib.rs — lines 1-14
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Target pattern** (from RESEARCH.md Pattern 3 + current file structure):
```rust
// ADD at top of lib.rs:
mod crypto;   // declares src-tauri/src/crypto.rs as a module

// REPLACE the run() body:
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())      // Phase 12: plugin-store
        .plugin(tauri_plugin_secure_storage::init())             // Phase 12: OS keychain
        .invoke_handler(tauri::generate_handler![
            greet,
            crypto::encrypt_klassen,   // Phase 12 crypto commands
            crypto::decrypt_klassen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**greet command** (lines 1–5 — keep unchanged): retain the existing `greet` command; only extend the builder and handler list.

---

### `src-tauri/src/crypto.rs` (service, request-response — new file, no analog)

**No codebase analog exists** — this is the first Rust command module beyond the greet stub.

**Full pattern from RESEARCH.md Patterns 1 and 2** (authoritative reference):

**Imports:**
```rust
use tauri::AppHandle;
use tauri_plugin_secure_storage::SecureStorageExt;
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use base64::{engine::general_purpose::STANDARD, Engine};
```

**Key identifier constant:**
```rust
const KEY_IDENTIFIER: &str = "nl.cios.mentordashboard.key";
```

**get_or_init_key helper** (internal, not a Tauri command):
```rust
fn get_or_init_key(app: &AppHandle) -> Result<Vec<u8>, String> {
    let storage = app.secure_storage();
    match storage.get_item(KEY_IDENTIFIER) {
        Ok(response) => {
            // VERIFY: field name may be .value, .password, or .secret
            // Run `cargo doc --open` for tauri-plugin-secure-storage before writing this line
            STANDARD.decode(response.value)
                .map_err(|e| format!("Key decode error: {e}"))
        }
        Err(_) => {
            let key = Aes256Gcm::generate_key(&mut OsRng);
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

**encrypt_klassen command:**
```rust
#[tauri::command]
pub async fn encrypt_klassen(app: AppHandle, plaintext: String) -> Result<String, String> {
    let key_bytes = get_or_init_key(&app)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // Fresh nonce on EVERY call — never reuse (D-12 anti-pattern)
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encrypt failed: {e}"))?;

    // Wire format: Base64(12-byte-nonce || ciphertext || 16-byte-tag)
    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(STANDARD.encode(&combined))
}
```

**decrypt_klassen command:**
```rust
#[tauri::command]
pub async fn decrypt_klassen(app: AppHandle, ciphertext: String) -> Result<String, String> {
    let key_bytes = get_key(&app)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let decoded = STANDARD.decode(&ciphertext)
        .map_err(|e| format!("Base64 decode: {e}"))?;
    if decoded.len() < 12 {
        return Err("Ciphertext too short".into());
    }
    let (nonce_bytes, ct) = decoded.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext_bytes = cipher
        .decrypt(nonce, ct)
        .map_err(|_| "Decrypt failed — data corrupt or wrong key".to_string())?;
    String::from_utf8(plaintext_bytes)
        .map_err(|e| format!("UTF-8 decode: {e}"))
}
```

**Rust unit tests block** (append to crypto.rs):
```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Note: get_or_init_key/get_key require AppHandle (Tauri runtime) so cannot be
    // unit-tested without full Tauri context. Test encrypt/decrypt round-trip directly
    // using raw key bytes to verify AES-GCM logic independently of keychain.
    #[test]
    fn encrypt_decrypt_roundtrip() {
        use aes_gcm::KeyInit;
        let key_bytes: [u8; 32] = [0u8; 32]; // test key
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

        let plaintext = b"test payload";
        let ct = cipher.encrypt(&nonce, plaintext.as_ref()).unwrap();
        let pt = cipher.decrypt(&nonce, ct.as_ref()).unwrap();
        assert_eq!(pt, plaintext);
    }
}
```

---

### `tests/storage.test.ts` (test, CRUD — new file)

**Analog:** `tests/backup.test.ts` (role-match: same test structure, same klassenState manipulation pattern) and `tests/actiepunten.test.js` (pattern-match: beforeEach reset, vi.mock usage)

**Test file structure** (from `tests/backup.test.ts` lines 1–14):
```typescript
// COPY structure from backup.test.ts:
// 1. File header comment with phase and plan reference
// 2. Imports at top
// 3. beforeEach reset of shared state
// 4. Grouped tests with descriptive names in Dutch/English mix
```

**Mock pattern** (from RESEARCH.md Pattern 5 — no codebase analog exists yet):
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// In-memory store stub (replaces plugin-store file I/O)
const _storeData = new Map<string, unknown>();

vi.mock('@tauri-apps/plugin-store', () => ({
  LazyStore: vi.fn().mockImplementation(() => ({
    get: vi.fn(async (key: string) => _storeData.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { _storeData.set(key, value); }),
    save: vi.fn(async () => {}),
    delete: vi.fn(async (key: string) => { _storeData.delete(key); }),
  })),
}));

// Mock invoke for crypto commands (passthrough — test storage contract, not actual AES)
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args: any) => {
    if (cmd === 'encrypt_klassen') return `mock_encrypted:${args.plaintext}`;
    if (cmd === 'decrypt_klassen') return args.ciphertext.replace('mock_encrypted:', '');
    return null;
  }),
}));
```

**beforeEach pattern** (from `tests/backup.test.ts` lines 10–14):
```typescript
// COPY from backup.test.ts — same klassenState reset pattern:
import { klassenState } from '../utils/klassen';

beforeEach(() => {
  // Reset klassenState to known empty fixture (same as backup.test.ts)
  klassenState.klassen = {};
  klassenState.activeKlasId = null;
  _storeData.clear();
  vi.clearAllMocks();
  // Reset localStorage
  localStorage.clear();
});
```

**Test body structure** (from `tests/backup.test.ts` lines 18–68 and RESEARCH.md STO-01–STO-04):
```typescript
// STO-01: saveKlassen persists; loadKlassen restores
test('saveKlassen() slaat op, loadKlassen() herstelt staat', async () => {
  klassenState.klassen = {
    klas_1: { id: 'klas_1', naam: 'Test Klas', students: [] },
  };
  klassenState.activeKlasId = 'klas_1';

  await saveKlassen();

  // Reset in-memory state (simulates app restart)
  klassenState.klassen = {};
  klassenState.activeKlasId = null;

  const result = await loadKlassen();
  expect(result).toBe(true);
  expect(klassenState.klassen['klas_1']).toBeDefined();
  expect(klassenState.klassen['klas_1'].naam).toBe('Test Klas');
});

// STO-02: encrypted blob ≠ plaintext (store contains ciphertext, not raw JSON)
test('store bevat ciphertext, niet plaintext klassendata', async () => {
  klassenState.klassen = { klas_1: { id: 'klas_1', naam: 'Geheim', students: [] } };
  await saveKlassen();

  const stored = _storeData.get('klassen') as string;
  expect(stored).toContain('mock_encrypted:');
  expect(stored).not.toContain('Geheim');
});

// STO-03: migration — localStorage data appears in plugin-store
test('migratie: localStorage-data wordt gemigreerd naar plugin-store', async () => {
  localStorage.setItem('mentordashboard_klassen_v1', JSON.stringify({
    klassen: { klas_old: { id: 'klas_old', naam: 'Oude Klas', students: [] } },
    activeKlasId: 'klas_old',
  }));

  const result = await loadKlassen();
  expect(result).toBe(true);
  expect(klassenState.klassen['klas_old']).toBeDefined();
  expect(_storeData.has('klassen')).toBe(true);
  expect(localStorage.getItem('mentordashboard_klassen_v1')).toBeNull();
});

// STO-04: deleteStudent removes student + saveKlassen called
test('deleteStudent() verwijdert leerling en slaat op', async () => {
  klassenState.klassen = {
    klas_1: {
      id: 'klas_1', naam: 'Klas 1',
      students: [
        { leerlingId: 'L1', naam: 'De Vries, A.' },
        { leerlingId: 'L2', naam: 'Jansen, B.' },
      ],
    },
  };
  klassenState.activeKlasId = 'klas_1';

  const result = await deleteStudent('klas_1', 'L1');
  expect(result).toBe(true);

  const remaining = klassenState.klassen['klas_1'].students;
  expect(remaining.find((s: any) => s.leerlingId === 'L1')).toBeUndefined();
  expect(remaining.find((s: any) => s.leerlingId === 'L2')).toBeDefined();
  // saveKlassen was triggered → store has updated ciphertext
  expect(_storeData.has('klassen')).toBe(true);
});
```

---

### `src-tauri/Cargo.toml` (config — extend dependency list)

**Analog:** `src-tauri/Cargo.toml` itself (all 25 lines are the reference)

**Current [dependencies] block** (lines 21–24):
```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

**Target [dependencies] block** (copy existing pattern, append new entries):
```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-store = "2"                    # Phase 12: durable key-value persistence
tauri-plugin-secure-storage = "1"          # Phase 12: OS keychain (Windows Credential Manager)
aes-gcm = "0.10.3"                         # Phase 12: AES-256-GCM (stable; NOT 0.11-rc)
base64 = "0.22"                            # Phase 12: nonce+ciphertext wire format encoding
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

**Note on rand:** Do NOT add `rand` as a direct dependency unless needed beyond crypto. Use `aes_gcm::aead::OsRng` re-export to avoid version conflicts with aes-gcm's dependency chain (RESEARCH.md Open Question 3, Assumption A4).

---

### `src-tauri/capabilities/default.json` (config — extend permissions)

**Analog:** `src-tauri/capabilities/default.json` itself (all 9 lines are the reference)

**Current permissions block** (lines 6–8):
```json
"permissions": [
  "core:default"
]
```

**Target permissions block** (from RESEARCH.md Code Examples — capabilities):
```json
"permissions": [
  "core:default",
  "store:default"
]
```

**Note on secure-storage:** Do NOT add `"secure-storage:default"` initially — the plugin has no JS bindings so it likely requires no capability entry (RESEARCH.md Assumption A2, Open Question 2). If runtime logs show "permission denied" for secure storage, add `"secure-storage:default"` as the fix.

**tauri.conf.json:** No changes required. The `useHttpsScheme: true` is already set (confirmed line 20 of tauri.conf.json). Plugin registration happens in lib.rs, not tauri.conf.json for Tauri v2.

---

## Shared Patterns

### try/catch with console.error/warn
**Source:** `utils/klassen.ts` lines 92–95 and `utils/leerlijnen.ts` lines 53–55  
**Apply to:** All async functions in klassen.ts, leerlijnen.ts  
```typescript
// All storage functions follow this pattern — preserve in Phase 12:
  } catch (e) {
    console.error('[klassen.ts] saveKlassen mislukt:', e);
    return false;
  }
// For non-critical (leerlijnen): use console.warn instead of console.error
  } catch (e: any) {
    console.warn('[leerlijnen.ts] plugin-store write error:', e);
    return false;
  }
```

### Plugin-store explicit save() pattern
**Source:** RESEARCH.md Anti-Patterns + Pitfall 4  
**Apply to:** Every `store.set()` call in klassen.ts and leerlijnen.ts  
```typescript
// ALWAYS pair store.set() with store.save() — set() is in-memory only:
await store.set('klassen', ciphertext);
await store.save();   // without this, data is lost on app restart
```

### Async Tauri invoke pattern
**Source:** RESEARCH.md Pattern 4  
**Apply to:** saveKlassen, loadKlassen in klassen.ts  
```typescript
import { invoke } from '@tauri-apps/api/core';

// invoke<ReturnType>(commandName, { argName: value })
const ciphertext = await invoke<string>('encrypt_klassen', { plaintext });
const plaintext  = await invoke<string>('decrypt_klassen', { ciphertext });
```

### LazyStore module-scope initialization
**Source:** RESEARCH.md Plugin-store TypeScript Initialization  
**Apply to:** klassen.ts and leerlijnen.ts (both use same store.json file)  
```typescript
// Create ONCE at module scope — LazyStore defers I/O until first access
// autoSave: false makes explicit store.save() the only flush mechanism
const store = new LazyStore('store.json', { autoSave: false });
```

### Rust command return type
**Source:** RESEARCH.md Pattern 1, D-12 Claude's Discretion  
**Apply to:** All commands in crypto.rs  
```rust
// All Tauri commands return Result<String, String>:
// Ok(value) → TypeScript receive as resolved promise
// Err(msg)  → TypeScript receive as rejected promise (invoke throws)
pub async fn encrypt_klassen(app: AppHandle, plaintext: String) -> Result<String, String>
```

### Vitest module mock placement
**Source:** `tests/actiepunten.test.js` pattern (vi.mock at top level) and RESEARCH.md Pattern 5  
**Apply to:** `tests/storage.test.ts`  
```typescript
// vi.mock() calls must be at module top level (hoisted by Vitest)
// NOT inside describe() or beforeEach()
vi.mock('@tauri-apps/plugin-store', () => ({ ... }));
vi.mock('@tauri-apps/api/core', () => ({ ... }));
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src-tauri/src/crypto.rs` | service | request-response | No Rust command modules exist beyond the 5-line greet stub. Pattern sourced entirely from RESEARCH.md Patterns 1 and 2 (official Tauri docs + aes-gcm docs). |

---

## Critical Implementation Warnings

1. **SecureStorageExt response field name is ASSUMED** — Before writing crypto.rs, run `cargo add tauri-plugin-secure-storage@1 && cargo doc --open` and inspect `GetItemResponse` struct fields. The field may be `.value`, `.password`, or `.secret`. This single assumption (RESEARCH.md A1) will cause a compile error if wrong.

2. **rand crate version** — Use `use aes_gcm::aead::OsRng` NOT a direct `rand` crate import to avoid version conflicts with aes-gcm 0.10.3's dependency chain (RESEARCH.md Open Question 3, A4).

3. **All saveKlassen() call sites must be awaited** — `switchActiveKlas()`, `createKlas()`, `deleteKlas()`, and any event handlers in `src/main.tsx` that call these. Missing `await` is silent (TypeScript will not error on an un-awaited Promise call site unless `--noFloatingPromises` ESLint rule is active).

4. **aes-gcm version must be pinned to 0.10.3** — `cargo add aes-gcm` without a version constraint may install `0.11.0-rc.3` which has API changes and edition 2024 requirements (RESEARCH.md Pitfall 7).

5. **store.save() is mandatory after every store.set()** — The LazyStore with `autoSave: false` (recommended) requires explicit `await store.save()`. Without it, the in-memory state survives the session but is lost on restart (RESEARCH.md Pitfall 4, Anti-Patterns).

---

## Metadata

**Analog search scope:** `utils/`, `tests/`, `src-tauri/src/`, `src-tauri/` (root config files)
**Files read:** 13 (klassen.ts, datamodel.ts, leerlijnen.ts, lib.rs, main.rs, Cargo.toml, tauri.conf.json, capabilities/default.json, vite.config.ts, backup.test.ts, actiepunten.test.js, aggregation.test.ts, vitest-setup.js)
**Pattern extraction date:** 2026-05-14
