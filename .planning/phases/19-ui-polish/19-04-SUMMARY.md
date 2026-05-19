---
phase: 19
plan: 04
subsystem: ui
tags: [animation, nav, logo, dark-mode-lift, responsive]
dependency_graph:
  requires: [19-02, 19-03]
  provides: [isDark-prop-contract, settings-slide-in, nav-logo, nav-diagonal-stripe, aanvullend-grid-fix]
  affects: [App.tsx, SettingsPage.tsx, KlasTabStrip.tsx, index.css]
tech_stack:
  added: [logo-light.png, logo-dark.png]
  patterns: [controlled-component-dark-mode, key-remount-animation, css-pseudo-element-diagonal]
key_files:
  created: []
  modified:
    - src/App.tsx
    - src/components/SettingsPage.tsx
    - src/components/KlasTabStrip.tsx
    - src/index.css
    - tests/SettingsPage.test.tsx
    - tests/KlasTabStrip.test.tsx
decisions:
  - "isDark lifted to App.tsx; SettingsPage is now a controlled child — receives isDark as prop and calls onToggleDark to notify parent"
  - "settingsOpenCount key-remount pattern used to replay slide-in animation on every open"
  - "Logo files provided as PNG (not SVG) — imports use .png extensions"
  - "aanvullend-grid is in AanvullendSection.tsx (already has className) — no DetailWeergave.tsx change needed"
  - "SettingsPage tests rewritten: dark-mode tests now test controlled component via isDark prop instead of internal useState"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 6
---

# Phase 19 Plan 04: Dark Mode Lift + Nav Logo + Slide-In Animation Summary

**One-liner:** Lifted isDark to App.tsx with key-remount animation, added CIOS logo + blue diagonal stripe to nav, and fixed aanvullend-grid responsive overflow.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 2 | Lift isDark to App.tsx, settingsOpenCount, slide-in wrapper | ac3c578 | App.tsx, SettingsPage.tsx, tests |
| 3 | KlasTabStrip logo + CSS (animation, nav stripe, responsive) | 72436a7 | KlasTabStrip.tsx, index.css, logo assets |

(Task 1 was a human-action checkpoint — cleared before execution. Task 4 is a human-verify checkpoint — handled by orchestrator.)

## What Was Built

### Task 2 — Dark mode lift + settings animation wiring

**App.tsx:**
- Added `loadSettings` + `applyTheme` imports from `../utils/settings`
- Added `settingsOpenCount: number` state (useState(0)) and `isDark: boolean` state (useState(false))
- Mount useEffect: calls loadSettings, resolves dark (handles 'system' via matchMedia), calls setIsDark + applyTheme
- `handleOpenSettings`: calls `setSettingsOpenCount(c => c + 1)` before `setView('settings')`
- `handleToggleDark(next: boolean)`: mirrors isDark in App.tsx when SettingsPage toggles
- KlasTabStrip receives `isDark={isDark}` prop
- SettingsPage wrapped in `<div className="view-slide-in-right" style={{ overflow: 'hidden' }}>` with `key={settingsOpenCount}`

**SettingsPage.tsx:**
- Extended `SettingsPageProps`: added `isDark: boolean` and `onToggleDark: (isDark: boolean) => void`
- Removed internal `useState<boolean>` that owned dark mode (lazy initializer reading body.dark)
- Removed the mount useEffect that called `loadSettings` / `applyTheme` / `setIsDark` internally
- `handleToggle`: still calls `applyTheme` + `saveSettings`; now calls `onToggleDark(nextIsDark)` to notify parent
- Removed `loadSettings` from imports (unused after lift)
- All Phase 17/18 logic (deelgebieden, leerlijnen, thresholds, BPV) preserved unchanged

**Tests:**
- `tests/SettingsPage.test.tsx`: All render calls updated to pass `isDark={false} onToggleDark={vi.fn()}`; Tests 2-4 rewritten to test controlled component behavior (prop-driven, not internal state)
- `tests/KlasTabStrip.test.tsx`: All render calls updated to pass `isDark={false}`

### Task 3 — Logo, CSS additions, responsive fix

**KlasTabStrip.tsx:**
- Added `isDark: boolean` to `KlasTabStripProps` interface
- Imports: `import logoLight from '../assets/logo-light.png'` and `import logoDark from '../assets/logo-dark.png'`
- First child in `<nav id="main-nav">`: `<img src={isDark ? logoDark : logoLight} alt="CIOS Zuidwest logo" style={{ height: '36px', width: 'auto', marginRight: '16px' }} />`

**src/index.css additions:**
- `#main-nav`: added `overflow: hidden` (position was already sticky/relative)
- `#main-nav::after`: new rule — `content: ''; position: absolute; top: 0; right: 0; width: 120px; height: 52px; background: linear-gradient(to bottom-left, #009FE3 0%, transparent 65%); pointer-events: none; z-index: 0`
- `.nav-tab`: added `position: relative; z-index: 1` (tabs render above diagonal stripe)
- `.aanvullend-grid > *`: new rule `min-width: 0` (POL-03 responsive fix, placed adjacent to .aanvullend-grid rule)
- Section 27 added: `.view-slide-in-right` + `@keyframes slideInFromRight` (from translateX(100%) opacity 0.7 → translateX(0) opacity 1)

**DetailWeergave.tsx:** Not modified — `.aanvullend-grid` className already exists in `AanvullendSection.tsx`.

## Deviations from Plan

### Auto-adjustments (not deviations)

**1. SettingsPage test rewrite (Tests 2-4)**
- **Found during:** Task 2
- **Issue:** Tests 2 (restore saved dark), 3 (OS fallback), 4 (flicker-free initializer) all tested internal dark-mode state behavior that no longer exists in the controlled component
- **Fix:** Rewrote to test prop-driven behavior: Test 2 → `isDark=true` prop → checkbox checked; Test 3 → `isDark=false` → unchecked; Test 4 → toggle calls `onToggleDark(true)` + persists + applies body.dark
- **Files modified:** tests/SettingsPage.test.tsx
- **Commit:** ac3c578

## Verification

- `npm test`: 93 tests pass, 5 skipped (no regressions)
- `npm run build`: succeeds; `logo-dark-zSTXhKXo.png` (91.51 kB) + `logo-light-C0VZPlyE.png` (94.26 kB) bundled
- KlasTabStrip.tsx contains `logoLight`, `isDark` prop
- index.css contains `@keyframes slideInFromRight`, `#main-nav::after`, `aanvullend-grid > *`

## Known Stubs

None. All functionality is wired end-to-end.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. The logo PNG assets are static brand files (T-19-06 accepted). T-19-07 (TypeScript interface enforcement) is in place — build fails if isDark prop is missing on KlasTabStrip or SettingsPage. T-19-08 (reduced-motion) is covered by the existing `@media (prefers-reduced-motion: reduce)` rule at index.css line 189 which zeros all animations globally.

## Self-Check

- [x] `src/App.tsx` — modified, committed ac3c578
- [x] `src/components/SettingsPage.tsx` — modified, committed ac3c578
- [x] `src/components/KlasTabStrip.tsx` — modified, committed 72436a7
- [x] `src/index.css` — modified, committed 72436a7
- [x] `src/assets/logo-light.png` — committed 72436a7
- [x] `src/assets/logo-dark.png` — committed 72436a7
- [x] `tests/SettingsPage.test.tsx` — modified, committed ac3c578
- [x] `tests/KlasTabStrip.test.tsx` — modified, committed 72436a7

## Self-Check: PASSED
