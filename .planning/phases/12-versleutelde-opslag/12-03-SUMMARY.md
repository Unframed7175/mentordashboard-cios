---
phase: 12-versleutelde-opslag
plan: 03
subsystem: storage
tags: [typescript, plugin-store, leerlijnen, datamodel, deprecation, migration]

# Dependency graph
requires:
  - phase: 12-01
    provides: "tauri-plugin-store + tauri-plugin-secure-storage registered; store:default capability"
  - phase: 11-typescript-migratie
    provides: "utils/leerlijnen.ts (sync localStorage) and utils/datamodel.ts (saveState/loadState)"
provides:
  - "utils/leerlijnen.ts fully async via plugin-store (plain JSON, onversleuteld per D-12-06)"
  - "getLeerlijnenMapping(): Promise<Record<string,string>> with legacy localStorage auto-migration"
  - "saveLeerlijnenMapping(): Promise<boolean> with mandatory store.save()"
  - "resetLeerlijnenMapping(): Promise<void> with mandatory store.save()"
  - "utils/datamodel.ts saveState() as no-op (returns true, no localStorage write)"
  - "utils/datamodel.ts loadState() as deprecated stub (returns false, console.warn)"
affects:
  - "12-04 (storage.test.ts can now test leerlijnen plugin-store contract)"
  - "Future callers of getLeerlijnenMapping/saveLeerlijnenMapping (must await)"

# Tech tracking
tech-stack:
  added:
    - "@tauri-apps/plugin-store npm package (installed — was missing from package.json)"
  patterns:
    - "LazyStore('store.json', { defaults: {}, autoSave: false }) — defaults:{} required by StoreOptions type"
    - "store.save() always awaited after store.set() and store.delete() (anti-pattern: fire-and-forget)"
    - "Legacy localStorage migration: read-only during migration; removeItem only after confirmed store.save()"

key-files:
  created: []
  modified:
    - "utils/leerlijnen.ts — full async rewrite; localStorage replaced by LazyStore; legacy migration path added"
    - "utils/datamodel.ts — saveState no-op; loadState deprecated stub; all other exports unchanged"
    - "package.json — @tauri-apps/plugin-store added as dependency"
    - "package-lock.json — updated lock file"

key-decisions:
  - "StoreOptions.defaults is required (not optional) in installed version — { defaults: {}, autoSave: false } needed"
  - "Plain JSON storage (unencrypted) for leerlijnen per D-12-06 — no invoke('encrypt_klassen') call"
  - "Legacy key LEERLIJNEN_LEGACY_KEY kept as read-only migration source; never written after Phase 12"
  - "saveState no-op returns true (not void) to preserve boolean return type for existing callers"

# Metrics
duration: 8min
completed: 2026-05-14
---

# Phase 12 Plan 03: Leerlijnen async-ificeren + datamodel deprecation Summary

**utils/leerlijnen.ts volledig async via plugin-store met eenmalige localStorage-migratie; saveState/loadState in datamodel.ts gedepreceerd als no-op/stub; npm run typecheck exit 0**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-14T12:47:35Z
- **Completed:** 2026-05-14T12:55:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Gemigreerd utils/leerlijnen.ts van synchrone localStorage naar async LazyStore plugin-store
- getLeerlijnenMapping() is nu async en leest vanuit store.json onder key 'leerlijnen'
- saveLeerlijnenMapping() awaits store.set() + store.save() per D-12 anti-pattern vereiste
- resetLeerlijnenMapping() awaits store.delete() + store.save()
- Eenmalige legacy migratie: localStorage.getItem(LEERLIJNEN_LEGACY_KEY) → store → localStorage.removeItem
- saveState() in datamodel.ts is een gedocumenteerde no-op (retourneert true, doet niets)
- loadState() in datamodel.ts retourneert false met deprecation console.warn
- clearState(), appState, addStudent, mergeVerzuim, getVerzuim, normalizeNaam ongewijzigd
- npm run typecheck slaagt (exit 0) na beide wijzigingen

## Task Commits

1. **Task 1: utils/leerlijnen.ts async-ificeren** - `0ae5d17` (feat)
2. **Task 2: saveState/loadState depreceren in datamodel.ts** - `b841f8c` (feat)

## Files Created/Modified

- `utils/leerlijnen.ts` — Volledig herschreven: LazyStore in plaats van localStorage; alle 3 functies async
- `utils/datamodel.ts` — saveState no-op; loadState deprecated stub; regels 218–251 vervangen
- `package.json` — @tauri-apps/plugin-store toegevoegd aan dependencies
- `package-lock.json` — Lock file bijgewerkt

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @tauri-apps/plugin-store niet geinstalleerd**
- **Found during:** Task 1 — npm run typecheck na schrijven van leerlijnen.ts
- **Issue:** `Cannot find module '@tauri-apps/plugin-store'` — pakket ontbrak in package.json; Plan 02 (parallel uitgevoerd) installeert dit ook maar was nog niet uitgevoerd
- **Fix:** `npm install @tauri-apps/plugin-store` — pakket toegevoegd aan dependencies
- **Files modified:** package.json, package-lock.json
- **Commit:** 0ae5d17 (Task 1 commit)

**2. [Rule 1 - Bug] StoreOptions.defaults is verplicht in geinstalleerde plugin versie**
- **Found during:** Task 1 — typecheck na installatie van plugin-store
- **Issue:** `Property 'defaults' is missing in type '{ autoSave: false }' but required in type 'StoreOptions'` — PATTERNS.md toonde `{ autoSave: false }` maar de werkelijke TypeScript type vereist `defaults` als verplicht veld
- **Fix:** `{ defaults: {}, autoSave: false }` — leeg defaults-object toegevoegd
- **Files modified:** utils/leerlijnen.ts
- **Verification:** npm run typecheck exit 0
- **Commit:** 0ae5d17 (Task 1 commit)

Note: utils/klassen.ts (Plan 02) had dezelfde fix al toegepast (`{ defaults: {}, autoSave: false }`), bevestigt de correctheid van de oplossing.

## Verification Results

1. npm run typecheck: exit 0
2. `grep "async function getLeerlijnenMapping" utils/leerlijnen.ts`: gevonden
3. `grep "localStorage.setItem" utils/leerlijnen.ts`: niet gevonden (PASS)
4. `grep "localStorage.setItem" utils/datamodel.ts`: niet gevonden (PASS)
5. `grep "@deprecated" utils/datamodel.ts | wc -l`: 2 (PASS)

## Known Stubs

None — alle 3 leerlijnen-functies zijn volledig gewired naar plugin-store. saveState/loadState zijn bewust gedepreceerd (geen stubs — dat is de bedoeling).

## Threat Flags

No new threat surface. T-12-09 (plain JSON leerlijnen) is accepted per D-12-06 (geen persoonsdata). T-12-10 (store.save() mandatory) gemitigeerd — store.save() wordt altijd awaited na store.set() en store.delete().

## Self-Check: PASSED

- utils/leerlijnen.ts: EXISTS
- utils/datamodel.ts: EXISTS
- Commit 0ae5d17: EXISTS (git log confirms)
- Commit b841f8c: EXISTS (git log confirms)
- npm run typecheck: exit 0

---
*Phase: 12-versleutelde-opslag*
*Completed: 2026-05-14*
