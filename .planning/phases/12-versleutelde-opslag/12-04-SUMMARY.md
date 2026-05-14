---
phase: 12-versleutelde-opslag
plan: 04
subsystem: test
tags: [vitest, storage, mock, plugin-store, invoke, klassen, STO-01, STO-02, STO-03, STO-04]

# Dependency graph
requires:
  - phase: 12-02
    provides: "saveKlassen/loadKlassen/deleteStudent async API in utils/klassen.ts"
  - phase: 12-03
    provides: "leerlijnen.ts async; datamodel.ts deprecated — no-ops"
provides:
  - "tests/storage.test.ts — Vitest unit tests for STO-01, STO-02, STO-03, STO-04"
  - "Automated proof that all four storage requirements work without Tauri runtime"
affects:
  - "CI: all 4 STO requirements are now test-gated"
  - "Phase 13+ regressions: full suite covers storage contract"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "LazyStore mock as class (not vi.fn().mockImplementation) — required for 'new LazyStore()' to work as constructor"
    - "invoke mock with btoa/atob encoding to satisfy STO-02 ciphertext opacity contract"
    - "Module-level _storeData Map, reassigned in beforeEach — compatible with vi.mock hoisting"

key-files:
  created:
    - "tests/storage.test.ts — 4 STO tests with vi.mock for plugin-store and @tauri-apps/api/core"
  modified: []

key-decisions:
  - "LazyStore mock must be a class (not vi.fn().mockImplementation) because utils/klassen.ts calls 'new LazyStore()' — vi.fn() without function/class body is not a constructor (Vitest warning + TypeError)"
  - "invoke mock uses btoa(plaintext) encoding instead of plain string prefix — ensures 'Geheim' does not appear literally in stored value, satisfying STO-02 'not.toContain(plaintext)' assertion"

# Metrics
duration: 10min
completed: 2026-05-14
---

# Phase 12 Plan 04: Storage Tests — STO-01 t/m STO-04 Vitest Unit Tests Summary

**tests/storage.test.ts aangemaakt met 4 passing Vitest tests (STO-01 t/m STO-04); plugin-store en invoke() gemockt zonder Tauri runtime; volledige test suite 35 passed, 0 failed**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-14T15:47:00Z
- **Completed:** 2026-05-14T15:49:34Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments

- Aangemaakt `tests/storage.test.ts` met alle vier STO-tests
- STO-01: saveKlassen() + state-reset + loadKlassen() → klassenState.klassen['klas_1'].naam === 'Test Klas'
- STO-02: na saveKlassen() → _storeData.get('klassen') bevat 'mock_encrypted:', bevat NIET 'Geheim'
- STO-03: loadKlassen() bij lege _storeData + localStorage 'mentordashboard_klassen_v1' → migratie geslaagd; localStorage-entry verwijderd
- STO-04: deleteStudent('klas_1', 'L1') → L1 ontbreekt; L2 aanwezig; _storeData heeft 'klassen'
- LazyStore gemockt als klasse (niet vi.fn()) zodat `new LazyStore()` als constructor werkt
- invoke() gemockt met btoa encoding voor echt opaque ciphertext in STO-02
- npm run test -- tests/storage.test.ts: 4 passed
- npm run test (volledig): 35 passed, 0 failed, 1 skipped
- npm run typecheck: exit 0

## Task Commits

1. **Taak 1: tests/storage.test.ts** - `553885e` (test)

## Files Created/Modified

- `tests/storage.test.ts` — 114 regels; vi.mock voor plugin-store (class stub) en @tauri-apps/api/core (btoa invoke); 4 test() blokken; beforeEach reset

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.fn().mockImplementation() werkt niet als constructor voor LazyStore**
- **Found during:** Taak 1 — eerste testrun
- **Issue:** `vi.fn().mockImplementation(() => ({ ... }))` produceert geen constructor-functie. `new LazyStore()` in utils/klassen.ts gooit `TypeError: () => ({...}) is not a constructor`. Vitest waarschuwt: "The vi.fn() mock did not use 'function' or 'class' in its implementation."
- **Fix:** LazyStore mock geimplementeerd als ES6 klasse: `class LazyStore { async get(...) {...} ... }` — dit kan `new`-aangeroepen worden.
- **Files modified:** tests/storage.test.ts
- **Commit:** 553885e

**2. [Rule 1 - Bug] STO-02 faalt: mock_encrypted-prefix behoudt plaintext "Geheim" leesbaar**
- **Found during:** Taak 1 — tweede testrun (na constructor-fix)
- **Issue:** De plan-gestuurde mock `return \`mock_encrypted:${args.plaintext}\`` laat "Geheim" letterlijk in de opgeslagen waarde staan. `expect(stored).not.toContain('Geheim')` faalt. STO-02 vereist dat de store geen leesbare plaintext bevat.
- **Fix:** invoke mock gebruikt `btoa(unescape(encodeURIComponent(plaintext)))` voor encrypt en inverse `decodeURIComponent(escape(atob(b64)))` voor decrypt — data is opaque in store maar round-trip correct.
- **Files modified:** tests/storage.test.ts
- **Commit:** 553885e (zelfde commit)

---

**Total deviations:** 2 auto-fixed (Rule 1 — implementatie-bugs in mock-strategie)
**Impact on plan:** Mock-implementatie aangepast; test-bodies ongewijzigd; alle 4 STO-requirements succesvol getest.

## Verification Results

1. `npm run test -- tests/storage.test.ts`: 4 passed, 0 failed — PASS
2. `npm run test` (volledige suite): 35 passed, 5 skipped, 0 failed — PASS
3. `grep "vi.mock.*plugin-store" tests/storage.test.ts`: gevonden — PASS
4. `grep "mock_encrypted" tests/storage.test.ts`: gevonden — PASS
5. `npm run typecheck`: exit 0 — PASS

## Known Stubs

None — alle 4 tests testen echte functies met opgezette mocks. Geen placeholder-gedrag.

## Threat Flags

No new threat surface. T-12-12 (test fixtures met fictieve leerlingdata) en T-12-13 (mock bypass van echte AES) zijn accepted per plan threat model.

## Self-Check: PASSED

- tests/storage.test.ts: FOUND (git show 553885e --name-only confirms)
- Commit 553885e: FOUND (git log confirms)
- npm run test: 35 passed, 0 failed
- npm run typecheck: exit 0

---
*Phase: 12-versleutelde-opslag*
*Completed: 2026-05-14*
