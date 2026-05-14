---
phase: 12-versleutelde-opslag
plan: 02
subsystem: infra
tags: [typescript, tauri, plugin-store, aes-gcm, invoke, async, localStorage, migration, deleteStudent]

# Dependency graph
requires:
  - phase: 12-versleutelde-opslag (plan 01)
    provides: "AES-256-GCM encrypt_klassen/decrypt_klassen Tauri commands via src-tauri/src/crypto.rs"
  - phase: 11-typescript-migratie
    provides: "utils/klassen.ts TypeScript module as async-ification target"
provides:
  - "saveKlassen(): Promise<boolean> — encrypts klassenState via invoke('encrypt_klassen') and persists via plugin-store"
  - "loadKlassen(): Promise<boolean> — decrypts from plugin-store, falls back to localStorage migration"
  - "_migrateLocalStorageToStore(): auto-migrates v2/v1 localStorage to plugin-store (deletes only after confirmed write)"
  - "deleteStudent(klasId, leerlingId): Promise<boolean> — hard delete per AVG Art. 17 + re-encrypt"
  - "switchActiveKlas/createKlas/deleteKlas all async, await saveKlassen()"
  - "showStorageError() helper for Dutch keychain-fault UI messages"
affects:
  - "12-04 (storage.test.ts tests against this async API)"
  - "12-03 (datamodel.ts saveState/loadState deprecated — already committed)"
  - "Phase 14 (React UI uses deleteStudent signature)"
  - "src/main.tsx (must await loadKlassen() at app startup)"

# Tech tracking
tech-stack:
  added:
    - "@tauri-apps/plugin-store LazyStore (TypeScript binding for plugin-store)"
    - "@tauri-apps/api/core invoke (Tauri command IPC)"
  patterns:
    - "LazyStore('store.json', { defaults: {}, autoSave: false }) — defaults:{} required by StoreOptions type"
    - "store.set() always followed by store.save() — set() is in-memory only"
    - "return saveKlassen() in deleteStudent — promise chain, not fire-and-forget"
    - "Migration: write-then-delete pattern — localStorage removed only after confirmed store.save()"

key-files:
  created: []
  modified:
    - "utils/klassen.ts — full async rewrite: localStorage -> plugin-store + invoke; deleteStudent added; callers async-ified"
    - "utils/datamodel.ts — saveState/loadState deprecated as no-op per D-12-07 (committed in same PR)"

key-decisions:
  - "LazyStore requires defaults:{} in StoreOptions — { autoSave: false } alone fails TypeScript type check (StoreOptions.defaults is required)"
  - "Both Task 1 and Task 2 changes committed in one atomic commit (same file, inseparable atomic write)"

patterns-established:
  - "Pattern: LazyStore initialization requires { defaults: {}, autoSave: false } — not just { autoSave: false }"
  - "Pattern: _restoreBridge() extracted helper — re-establishes appState.students bridge after any klassenState restore"
  - "Pattern: All saveKlassen callers use await — no fire-and-forget (T-12-06 mitigated)"

requirements-completed: [STO-01, STO-03, STO-04]

# Metrics
duration: 15min
completed: 2026-05-14
---

# Phase 12 Plan 02: Versleutelde Opslag — TypeScript Async Storage Rewrite Summary

**utils/klassen.ts volledig herschreven: localStorage vervangen door async plugin-store + invoke('encrypt_klassen'/'decrypt_klassen'); auto-migratie en deleteStudent() geimplementeerd; npm run typecheck groen**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-14T12:47:34Z
- **Completed:** 2026-05-14T12:50:30Z
- **Tasks:** 2 (combined in 1 commit — same file)
- **Files modified:** 2

## Accomplishments

- Rewrote `saveKlassen()` as `Promise<boolean>`: encrypt via `invoke('encrypt_klassen')`, persist via `store.set('klassen', ciphertext)` + `store.save()`
- Rewrote `loadKlassen()` as `Promise<boolean>`: decrypt from plugin-store, bridge restoration via `_restoreBridge()`, fallback to `_migrateLocalStorageToStore()`
- Implemented `_migrateLocalStorageToStore()`: detects v2 (`mentordashboard_klassen_v1`) and v1 (`mentordashboard_v1`) localStorage keys, writes to plugin-store, removes localStorage entries ONLY after confirmed write (D-12-15, T-12-05)
- Added `deleteStudent(klasId, leerlingId): Promise<boolean>` — hard delete + `saveKlassen()` re-encrypt (D-12-12, T-12-08)
- All caller functions (`switchActiveKlas`, `createKlas`, `deleteKlas`) converted to `async`/`Promise` with `await saveKlassen()`
- `showStorageError()` helper displays Dutch error message for keychain failures (D-12-16, T-12-07)
- `datamodel.ts` `saveState`/`loadState` deprecated as no-op per D-12-07

## Task Commits

Both tasks committed atomically (same file, written together):

1. **Task 1+2: saveKlassen/loadKlassen/callers/deleteStudent** - `c06a6f7` (feat)

## Files Created/Modified

- `utils/klassen.ts` — async storage rewrite; no localStorage.setItem remaining; all exports per plan spec
- `utils/datamodel.ts` — saveState deprecated as no-op, loadState deprecated (D-12-07)

## Decisions Made

- `LazyStore` constructor requires `{ defaults: {}, autoSave: false }` not just `{ autoSave: false }` — the `StoreOptions` TypeScript type marks `defaults` as required; passing only `autoSave` causes TS2345 type error. Fixed by adding `defaults: {}`.
- Tasks 1 and 2 written together in single file pass since the full file was rewritten atomically; committed in one commit with both task descriptions in the message.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] LazyStore StoreOptions.defaults is required**
- **Found during:** Task 1 (typecheck after implementing saveKlassen/loadKlassen)
- **Issue:** Plan and PATTERNS.md show `new LazyStore('store.json', { autoSave: false })`. The installed `@tauri-apps/plugin-store` type definition marks `defaults: { [key: string]: unknown }` as required in `StoreOptions`, causing TS2345 type error.
- **Fix:** Changed to `new LazyStore('store.json', { defaults: {}, autoSave: false })`
- **Files modified:** utils/klassen.ts
- **Verification:** `npm run typecheck` exits 0 after fix
- **Committed in:** c06a6f7 (Task 1+2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — type error from incorrect API assumption in PATTERNS.md)
**Impact on plan:** Single necessary fix for TypeScript compilation. No scope creep.

## Issues Encountered

- `StoreOptions` type requires `defaults` field — pattern in PATTERNS.md was incomplete. Caught immediately by typecheck, fixed with empty `defaults: {}`.

## User Setup Required

None — plugin-store and OS keychain (Windows Credential Manager) are already registered from Plan 01. No additional configuration required.

## Known Stubs

None — all storage functions are fully wired to invoke() calls and LazyStore. No placeholder/mock data in production code paths.

## Threat Flags

No new threat surface beyond what was planned. Threat model mitigations from plan confirmed implemented:
- T-12-05: localStorage removed ONLY after `await saveKlassen()` returns true — implemented in `_migrateLocalStorageToStore()`
- T-12-06: Every `saveKlassen()` call is awaited in all callers — no fire-and-forget
- T-12-07: Keychain error caught, Dutch error message displayed, app starts with empty state
- T-12-08: `deleteStudent()` filters array + calls `saveKlassen()` to re-encrypt entire blob

## Self-Check

Files exist:
- `utils/klassen.ts` — FOUND (committed c06a6f7)
- `utils/datamodel.ts` — FOUND (committed b841f8c)

Commits exist:
- `c06a6f7` feat(12-02): async saveKlassen/loadKlassen — FOUND

## Next Phase Readiness

- Wave 1 TypeScript layer complete: `saveKlassen`/`loadKlassen`/`deleteStudent` ready for Plan 12-04 (storage.test.ts)
- `deleteStudent` has stable signature `(klasId: string, leerlingId: string): Promise<boolean>` for Phase 14 UI wiring
- Plan 12-03 (leerlijnen.ts migration) was already executed and committed before this plan ran — no blocker
- `src/main.tsx` will need `await loadKlassen()` at app startup (Phase 14 or later)

---
*Phase: 12-versleutelde-opslag*
*Completed: 2026-05-14*
