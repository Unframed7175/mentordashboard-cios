---
phase: 03-doorstroomnorm-engine
plan: "02"
subsystem: ui
tags: [localStorage, mapping, leerlijn, deelgebieden, prognosis]

# Dependency graph
requires:
  - phase: 03-01
    provides: doorstroomnorm engine (berekenPrognose, telLeerlijnen) and klasoverzicht rendering
  - phase: 01-01
    provides: schema.js with 19 DEELGEBIEDEN (id, label, group fields)
provides:
  - Leerlijn-toewijzing persistence via utils/leerlijnen.js (getLeerlijnenMapping, saveLeerlijnenMapping, resetLeerlijnenMapping)
  - Dynamic mapping in prognosis.js telLeerlijnen() — reads from localStorage or falls back to schema.js defaults
  - Leerlijn-toewijzing UI panel in import-view: 19 dropdown rows, highlight on change, status feedback
  - Reset button restoring B02-definitief defaults
affects: [04-detailview, any phase using berekenPrognose]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - IIFE classic script with module-level cache (_cachedMapping) invalidated on write
    - localStorage override pattern with isValid() guard checking all 19 keys
    - Dynamic mapping fallback: mapping[dg.id] || dg.group

key-files:
  created:
    - utils/leerlijnen.js
  modified:
    - utils/prognosis.js
    - index.html
    - app.js

key-decisions:
  - "leerlijnen.js uses IIFE classic script (no ES module) — consistent with schema.js/prognosis.js pattern, avoids module scope issues"
  - "Cache invalidated on save/reset — getLeerlijnenMapping never reads stale data after a change"
  - "telLeerlijnen fallback: mapping[dg.id] || dg.group — backward compatible if leerlijnen.js is not loaded"
  - "ltSection shown on autoSave (after PDF import) and loadState startup — not on page load (no students yet)"

patterns-established:
  - "localStorage override with isValid() guard: check all 19 deelgebied IDs before trusting stored data"
  - "UI re-render on mapping change: onLeerlijnenChange calls renderKlasoverzicht() when students are loaded"

requirements-completed: [NORM-01]

# Metrics
duration: 7min
completed: 2026-03-25
---

# Phase 03 Plan 02: Leerlijn-toewijzing UI Summary

**Leerlijn-toewijzing configuration panel with localStorage persistence — mentor can view and adjust all 19 deelgebied-to-leerlijn assignments, changes persist across refresh, and the prognosis engine uses the dynamic mapping instead of hardcoded schema.js defaults**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-25T06:45:30Z
- **Completed:** 2026-03-25T06:52:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created utils/leerlijnen.js with three window globals: getLeerlijnenMapping (cached localStorage read with schema.js fallback), saveLeerlijnenMapping (write + cache invalidate), resetLeerlijnenMapping (remove key + invalidate)
- Updated telLeerlijnen() in prognosis.js to use dynamic mapping[dg.id] || dg.group, making all prognosis calculations respect mentor-configured overrides
- Added leerlijn-toewijzing UI panel (19 rows with dropdowns, yellow highlight on changed rows, "Opgeslagen" status, "Herstel standaard" button) visible in import-view after students are loaded
- Wired event handlers in app.js: onLeerlijnenChange saves mapping and re-renders klasoverzicht; reset button restores defaults; section shown/hidden on import/loadState/wisData

## Task Commits

Each task was committed atomically:

1. **Task 1: Create utils/leerlijnen.js mapping persistence + update prognosis.js** - `836e46a` (feat)
2. **Task 2: Add leerlijn-toewijzing UI to index.html and wire events in app.js** - `8fa992b` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `utils/leerlijnen.js` - Mapping persistence: getLeerlijnenMapping/saveLeerlijnenMapping/resetLeerlijnenMapping globals with localStorage key mentordashboard_leerlijnen_v1 and in-memory cache
- `utils/prognosis.js` - telLeerlijnen() now reads dynamic mapping from getLeerlijnenMapping() instead of hardcoded dg.group
- `index.html` - Added leerlijnen.js script tag, CSS for .lt-table/.lt-changed/.lt-footer, and #leerlijn-toewijzing HTML section with lt-tbody and lt-reset-btn
- `app.js` - Added ltSection/ltTbody/ltResetBtn/ltStatus DOM refs, renderLeerlijntoewijzing(), onLeerlijnenChange(), reset handler, show/hide on autoSave/loadState/wisData

## Decisions Made

- **IIFE classic script pattern**: leerlijnen.js uses IIFE (no ES module) — consistent with schema.js/prognosis.js globals pattern, avoids module scope issues in file:// context
- **Module-level cache**: `_cachedMapping` avoids repeated localStorage reads per telLeerlijnen() call; invalidated on every save/reset
- **Backward-compatible fallback**: `mapping[dg.id] || dg.group` in prognosis.js — if leerlijnen.js fails to load, prognosis behaves identically to before (uses schema.js defaults)
- **Show-on-demand**: leerlijn-toewijzing section starts hidden and is only shown after students are loaded (import or loadState) — prevents confusing empty table on first page load

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None - all 19 deelgebieden are dynamically rendered from window.DEELGEBIEDEN; mapping is live from localStorage or schema.js defaults.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- NORM-01 gap closed: mentor can see and adjust deelgebied-to-leerlijn mapping via UI
- Prognosis engine fully dynamic — any phase that calls berekenPrognose() or telLeerlijnen() will use the active mapping automatically
- Ready for Phase 04 (detail view) and any future phases that depend on leerlijn data

---
*Phase: 03-doorstroomnorm-engine*
*Completed: 2026-03-25*
