---
phase: 06-multi-class-ui
plan: 01
subsystem: ui
tags: [multi-class, localStorage, state-management, migration, html, css]

# Dependency graph
requires:
  - phase: utils/datamodel.js
    provides: window.appState, saveState(), loadState() — integrated as bridge target
  - phase: utils/leerlijnen.js
    provides: shared leerlijn mapping (not namespaced per class)
provides:
  - window.klassenState — multi-class state object (klassen map + activeKlasId)
  - window.createKlas() — create class with duplicate name guard
  - window.switchActiveKlas() — switch active class, bridge appState.students
  - window.deleteKlas() — remove class, auto-switch or clear if none remain
  - window.saveKlassen() / loadKlassen() — persist/restore all class data
  - window._migrateV1ToKlassen() — auto-migrate v1.0 users to Klas 1
  - window.getActiveStudents() — convenience getter for active class students
  - index.html structural HTML: #klas-tabs, #nieuwe-klas-modal, #klas-grid, #klassen-leeg
  - CSS: .klas-tile, .klas-tile-naam, #klassen-leeg styles
affects: [06-02-PLAN.md, 06-03-PLAN.md, app.js, parsers/excel.js]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bridge pattern: window.appState.students = active class students array (same reference)"
    - "Classic script globals: window.* for all utility functions, no ES module"
    - "Dual-write: saveKlassen() also calls saveState() for backward compatibility"

key-files:
  created:
    - utils/klassen.js
  modified:
    - index.html

key-decisions:
  - "Bridge pattern (D-07): window.appState.students = active class array reference — addStudent/mergeVerzuim mutate correct array without changes to those functions"
  - "Single storage key mentordashboard_klassen_v1 with nested structure for all classes — simpler than per-class keys"
  - "Soft duplicate name guard (case-insensitive) returns {error:'duplicate'} instead of throwing — per research recommendation"
  - "Auto-migration: v1.0 users get Klas 1 created from mentordashboard_v1 data on first load — transparent to user"
  - "klas-tabel replaced by klas-grid: tile grid layout (auto-fill minmax 200px) replaces table entirely per D-10/D-11"

patterns-established:
  - "Pattern 1: Multi-class bridge — klassenState.klassen[id].students === window.appState.students for active class"
  - "Pattern 2: Load order — loadKlassen() falls through to _migrateV1ToKlassen() if no klassen key found"

requirements-completed: [KLS-01, KLS-04, KLS-05, KLS-06]

# Metrics
duration: 2min
completed: 2026-03-26
---

# Phase 06 Plan 01: Multi-class Data Layer Summary

**Multi-class state management layer created: CRUD, persistence, v1.0 migration, and HTML structure ready for Phase 6 UI wiring in Plans 02 and 03.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-26T18:19:09Z
- **Completed:** 2026-03-26T18:21:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

### Task 1: utils/klassen.js — Multi-class state management

Created `utils/klassen.js` as a classic script exposing 7 `window.*` globals:

- `window.klassenState` — state object with `klassen` map and `activeKlasId`
- `window.createKlas(naam)` — generates ID, adds class, activates via switchActiveKlas, duplicate name guard (case-insensitive)
- `window.switchActiveKlas(klasId)` — establishes the critical bridge: `window.appState.students = klassenState.klassen[klasId].students` so all existing import/merge code targets the right array without modification
- `window.deleteKlas(klasId)` — removes class from registry, auto-switches to first remaining class or clears if none remain
- `window.saveKlassen()` — persists to `mentordashboard_klassen_v1`, also calls `window.saveState()` for backward compat
- `window.loadKlassen()` — restores all classes and re-establishes bridge; falls through to migration if no data found
- `window._migrateV1ToKlassen()` — migrates v1.0 `mentordashboard_v1` data to "Klas 1", removes old key, logs to console
- `window.getActiveStudents()` — convenience getter returns active class students or empty array

### Task 2: index.html — Phase 6 structural HTML and CSS

Updated `index.html` with all structural changes for Phase 6:

1. Script tag for `utils/klassen.js` (after leerlijnen.js, before excel.js)
2. `#klas-tabs` strip container between `</header>` and `<div id="app">` — populated dynamically in Plan 02
3. `#nieuwe-klas-modal` — modal with text input, error paragraph, Annuleren/Aanmaken buttons — wired in Plan 02
4. Replaced `.klas-table-wrap` / `#klas-tabel` with `#klas-grid` tile grid container + `#klas-leeg`
5. `#wis-data-btn` text changed to "Klas verwijderen" — click handler rewired in Plan 02
6. `.klas-tile`, `.klas-tile-naam`, `#klassen-leeg` CSS added to `<style>` block
7. `#klassen-leeg` empty-state container added inside `#app` (hidden by default) — shown/hidden in Plan 02

## Commits

| Task | Hash | Description |
|------|------|-------------|
| 1 | dfa3cd5 | feat(06-01): create utils/klassen.js multi-class state management |
| 2 | 527b2d0 | feat(06-01): update index.html with Phase 6 structural HTML and CSS |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan creates data layer and HTML structure only. No data flows to UI rendering yet. Plans 02 and 03 wire the rendering logic.

## Self-Check: PASSED

- `D:\Downloads\dashboard-2\utils\klassen.js` — FOUND
- `D:\Downloads\dashboard-2\index.html` — FOUND (modified)
- Commit `dfa3cd5` — FOUND
- Commit `527b2d0` — FOUND
- `#klas-tabs`, `#nieuwe-klas-modal`, `#klas-grid`, `#klassen-leeg` — all present in index.html
- klassen.js script tag in index.html — FOUND at line 838
