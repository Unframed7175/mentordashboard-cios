---
phase: 17
plan: "03"
subsystem: settings-routing
tags: [settings, routing, dark-mode, startup-hydration, navigation]
dependency_graph:
  requires: [17-01, 17-02]
  provides: [end-to-end settings flow, startup theme hydration, gear icon nav, prevView routing]
  affects: [src/App.tsx, src/main.tsx, src/components/KlasTabStrip.tsx]
tech_stack:
  added: []
  patterns: [prevView state tracking, defensive try/catch startup, startup hydration before ReactDOM.render]
key_files:
  created:
    - tests/KlasTabStrip.test.tsx
  modified:
    - src/components/KlasTabStrip.tsx
    - src/App.tsx
    - src/main.tsx
decisions:
  - "prevView only set inside handleOpenSettings (unreachable from settings view) — Pitfall 3 prevention"
  - "handleNavigateToImportFromSettings only flips view — does NOT touch klassenState (SET-02 contract via Phase 16 auto-detect-skip)"
  - "Startup hydration try/catch mirrors existing loadKlassen() defensive pattern per Codex MEDIUM finding"
  - "handleImportOpen removed entirely — import now reached exclusively via Settings → Bestanden toevoegen (D-09)"
metrics:
  duration: "~15 min"
  completed: "2026-05-17"
  tasks_completed: 3
  files_changed: 4
---

# Phase 17 Plan 03: Settings Wiring Summary

**One-liner:** Gear icon wired into KlasTabStrip, settings view added to App.tsx as 4th route with prevView backtrack, and startup theme hydration added to main.tsx before first paint.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Gear icon + KlasTabStrip tests | 717d0b5 | src/components/KlasTabStrip.tsx, tests/KlasTabStrip.test.tsx |
| 2 | Wire settings view + prevView in App.tsx | 71077ce | src/App.tsx |
| 3 | Startup theme hydration in main.tsx | e80507f | src/main.tsx |

## What Was Built

**KlasTabStrip (Task 1):**
- Removed `onImport` prop and `↑ Importeer` button (Research Open Question #1 resolution — import reached via Settings)
- Added `onSettings: () => void` and `isSettingsActive: boolean` props
- Added ⚙ gear button (U+2699) with `aria-label="Instellingen openen"`, `marginLeft: 'auto'` (pins right), and conditional `.active` class
- No hardcoded color — themed via `.nav-tab` / `.nav-tab.active` CSS rules from Plan 01

**KlasTabStrip tests (Task 1):**
- `tests/KlasTabStrip.test.tsx` with 4 tests: gear present, onSettings callback, active class when isSettingsActive=true, regression guard for legacy button
- Placed in `tests/` (not `src/`) per BLOCKER 1 resolution so Vitest include pattern discovers it

**App.tsx (Task 2):**
- Extended view state: `'import' | 'klas' | 'detail' | 'settings'`
- Added `prevView` state (initial `'klas'`) for back-navigation
- Added `handleOpenSettings` (pins prevView, sets view to settings)
- Added `handleBackFromSettings` (restores prevView)
- Added `handleNavigateToImportFromSettings` (only flips view — SET-02 contract)
- Removed `handleImportOpen` entirely (dead code after removing legacy import button)
- Imported and mounted `SettingsPage` as 4th conditional render block
- Updated `KlasTabStrip` JSX: `onSettings`/`isSettingsActive` props, removed `onImport`

**main.tsx (Task 3):**
- Added `import { loadSettings, applyTheme } from '../utils/settings'`
- Added hydration block BEFORE `ReactDOM.createRoot`: loads persisted theme or falls back to OS preference
- Wrapped in `try/catch` mirroring `loadKlassen()` pattern — plugin-store failure cannot block app boot
- Catch branch applies OS preference fallback (nested try/catch swallows exotic matchMedia failure)
- `saveSettings` is NOT called from main.tsx (D-06 — OS preference not persisted on startup)

## Verification Results

- `npx vitest run`: 53 tests passed, 5 skipped (11 files passed, 1 skipped) — all green
- `npx tsc --noEmit`: 0 errors
- KlasTabStrip tests (4/4): gear present, callback, active class, regression guard — all pass

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary changes. All changes are local UI routing and startup initialization.

## Self-Check

**Files exist:**
- tests/KlasTabStrip.test.tsx: FOUND
- src/components/KlasTabStrip.tsx: FOUND (modified)
- src/App.tsx: FOUND (modified)
- src/main.tsx: FOUND (modified)

**Commits exist:**
- 717d0b5: FOUND (Task 1 — KlasTabStrip + tests)
- 71077ce: FOUND (Task 2 — App.tsx)
- e80507f: FOUND (Task 3 — main.tsx)

## Self-Check: PASSED
