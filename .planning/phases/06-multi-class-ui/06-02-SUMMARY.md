---
phase: 06-multi-class-ui
plan: 02
subsystem: ui
tags: [multi-class, class-tabs, modal, empty-state, app.js, localStorage]

# Dependency graph
requires:
  - phase: 06-01
    provides: "window.klassenState, createKlas(), switchActiveKlas(), deleteKlas(), saveKlassen(), loadKlassen(), #klas-tabs, #nieuwe-klas-modal, #klas-grid, #klassen-leeg in index.html"
provides:
  - "renderKlasTabStrip() — renders active-class-aware tab buttons with '+' for new class"
  - "openNieuweKlasModal() / closeNieuweKlasModal() / handleCreateKlas() — full modal flow"
  - "showEmptyKlassenState() / hideEmptyKlassenState() — D-05 empty state UX"
  - "Updated showView() — calls hideEmptyKlassenState() before rendering any view"
  - "Rewired startup: loadKlassen() replaces loadState() as primary restore"
  - "Rewired autoSave(): saveKlassen() is now authoritative save (saveState kept for compat)"
  - "Rewired wisDataBtn: deleteKlas() with confirmation dialog and per-class name"
  - "Temporary renderKlasoverzicht() stub — Plan 03 replaces with renderKlasGrid()"
affects: [06-03-PLAN.md, app.js]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Function hoisting: all Phase 6 functions declared as function declarations in DOMContentLoaded scope — hoisted, safe to call before definition"
    - "IIFE closure in renderKlasTabStrip: each tab button's click handler captures klas.id via (function(k){...})(klas) — avoids loop variable capture"
    - "Dual-save pattern: autoSave() calls saveKlassen() (authoritative) then saveState() (backward compat)"

key-files:
  created: []
  modified:
    - app.js

key-decisions:
  - "Temporary renderKlasoverzicht() stub added — returns placeholder text via klasGrid.innerHTML — Plan 03 replaces with full tile grid rendering"
  - "handleCreateKlas() always shows ltSection with renderLeerlijntoewijzing() per plan spec — even for empty new class; harmless since no students yet"
  - "klasTbody DOM reference and klasTbody.addEventListener removed — #klas-tbody replaced by #klas-grid in Plan 01; tile click wired in Plan 03"
  - "Tab click does NOT re-render leerlijn content (D-08: mapping is shared across classes) — only toggles visibility based on student count"

patterns-established:
  - "Pattern 3: Tab click side effects — switchActiveKlas → renderKlasTabStrip → updateNavCount → ltSection visibility → showView"
  - "Pattern 4: Empty state lifecycle — showEmptyKlassenState hides all views + main-nav; hideEmptyKlassenState restores main-nav; showView always calls hideEmptyKlassenState"

requirements-completed: [KLS-01, KLS-02, KLS-03, KLS-05, KLS-06]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 06 Plan 02: Multi-class UI Wiring Summary

**Class tab strip, new-class modal, empty-state UX, and startup/autoSave/wisDataBtn all wired into app.js with full multi-class data isolation.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-26T18:24:25Z
- **Completed:** 2026-03-26T18:27:25Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

### Task 1: Class tab strip rendering, modal logic, and empty-state handling

Added Phase 6 multi-class UI logic to `app.js`:

- **9 new DOM references** for Phase 6 elements (klasTabs, nieuweKlasModal, etc.)
- **`renderKlasTabStrip()`** — iterates `window.klassenState.klassen`, creates a button per class with `nav-tab active` for the current class, adds `+` button at end; hides strip if no classes
- **`openNieuweKlasModal()` / `closeNieuweKlasModal()`** — flex-show/none-hide modal, clears input+error
- **`handleCreateKlas()`** — validates name, calls `window.createKlas()`, handles `{error:'duplicate'}` response, calls `showView('import')` on success (D-06)
- **`showEmptyKlassenState()` / `hideEmptyKlassenState()`** — per D-05: hides all views + main-nav, shows `#klassen-leeg`
- **Modal event listeners**: Annuleren, Aanmaken, Enter/Escape key on input, backdrop click
- **`klassenLeegBtn` click** → opens modal
- **`showView()` updated** to call `hideEmptyKlassenState()` first — ensures main-nav always visible when a view is shown

### Task 2: Startup, autoSave, wisDataBtn, and class-switch side effects

Rewired existing app.js integrations:

- **Startup sequence** replaced: `loadKlassen()` → `renderKlasTabStrip()` → `showView('klas'|'import')`, with `showEmptyKlassenState()` else branch
- **`autoSave()`** rewired: `saveKlassen()` first (authoritative), then `saveState()` (backward compat)
- **`wisDataBtn` click** rewired: shows class name in confirm dialog, calls `deleteKlas()`, calls `renderKlasTabStrip()`, shows empty state if last class deleted
- **`aanvullend-veld` change handler**: `window.saveKlassen()` added after `window.saveState()`
- **`klasTbody` DOM reference** removed (replaced by `#klas-grid` in Plan 01)
- **`klasTbody.addEventListener`** removed — tile click handler wired in Plan 03
- **`renderKlasoverzicht()`** replaced with temporary stub using `klasGrid.innerHTML`

## Task Commits

Both tasks implemented together in one commit (same file, reviewed as integrated change):

1. **Task 1 + Task 2: Full multi-class UI wiring** - `f1e5629` (feat)

## Files Created/Modified

- `/d/Downloads/dashboard-2/app.js` — 156 lines added (Phase 6 multi-class UI logic), 80 lines removed (klasTbody references, old renderKlasoverzicht, old startup/autoSave/wisDataBtn)

## Decisions Made

- Tasks 1 and 2 committed together since all changes were in a single file and reviewed as an integrated unit; no scope difference
- Temporary `renderKlasoverzicht()` stub used — Plan 03 implements full tile grid; existing students can still be imported but klasoverzicht shows placeholder text
- `klasTbody` entirely removed rather than kept as dead code; Plan 03 adds `klasGrid` tile click handler

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed klasTbody DOM reference along with event listener**
- **Found during:** Task 2 (removing klasTbody.addEventListener)
- **Issue:** Plan specified removing only the `addEventListener` call, but keeping the DOM reference `const klasTbody = document.getElementById('klas-tbody')` would reference a non-existent element (removed in Plan 01) and could cause confusion. The reference was also used inside the old `renderKlasoverzicht()` which is being replaced anyway.
- **Fix:** Replaced the DOM reference line with a comment explaining the removal; the old renderKlasoverzicht (which used klasTbody) was replaced by the temporary stub.
- **Files modified:** app.js
- **Verification:** No remaining references to klasTbody in app.js (grep confirms)
- **Committed in:** f1e5629

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Minor cleanup improvement — no functional difference.

## Issues Encountered

None.

## Known Stubs

**`renderKlasoverzicht()` temporary stub** — `app.js` line ~853
```javascript
function renderKlasoverzicht() {
  updateNavCount();
  // Phase 6 Plan 03 replaces this with renderKlasGrid()
  if (klasGrid) {
    klasGrid.innerHTML = '<p ...>Klasoverzicht wordt geladen... (Plan 03)</p>';
  }
}
```
- Intentional placeholder per plan spec — klasoverzicht tile grid implemented in Plan 03
- Students can be imported and counted correctly (navCount works); only tile display is pending

## Next Phase Readiness

- Plan 03 (klasoverzicht tile grid) can now proceed — `renderKlasTabStrip()`, `klassensState`, and `klasGrid` element are all available
- Multi-class data isolation is complete: switching tabs calls `switchActiveKlas()` which bridges `window.appState.students`
- Refresh restore fully wired via `loadKlassen()` at startup
- Delete class UX complete with confirmation dialog showing class name

---
*Phase: 06-multi-class-ui*
*Completed: 2026-03-26*
