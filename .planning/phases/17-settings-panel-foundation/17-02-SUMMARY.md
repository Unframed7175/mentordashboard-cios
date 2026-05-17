---
phase: 17
plan: 02
subsystem: frontend
tags: [settings, dark-mode, react, vitest, plugin-store]
dependency_graph:
  requires: []
  provides: [utils/settings.ts, src/components/SettingsPage.tsx, tests/SettingsPage.test.tsx]
  affects: [src/App.tsx (Plan 03 wires SettingsPage), src/main.tsx (Plan 03 startup hydration)]
tech_stack:
  added: ["@testing-library/react (devDependency — test infrastructure)"]
  patterns: ["LazyStore ES6 class mock with vi.hoisted()", "flicker-free lazy useState initializer", "OS preference read without persist (D-06)"]
key_files:
  created:
    - utils/settings.ts
    - src/components/SettingsPage.tsx
    - tests/SettingsPage.test.tsx
  modified:
    - tests/vitest-setup.js
    - vitest.config.ts
    - package.json
    - package-lock.json
decisions:
  - "LazyStore mock uses vi.hoisted() to expose shared Map — avoids TDZ error from vi.mock() hoisting"
  - "isDark lazy initializer reads document.body.classList.contains('dark') synchronously — eliminates flicker"
  - "@testing-library/react installed as devDependency (was missing; Rule 3 auto-fix)"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-17"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 4
---

# Phase 17 Plan 02: Settings Panel Foundation — SettingsPage Component Summary

**One-liner:** SettingsPage React component with dark mode toggle, plugin-store persistence via utils/settings.ts, and 6 Vitest tests covering SET-01 (toggle/persist/restore/OS-fallback/flicker-free) and SET-02 (import nav callback).

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create utils/settings.ts helper module | c857acd | utils/settings.ts |
| 2 | Create SettingsPage component with flicker-free toggle | 1071a4a | src/components/SettingsPage.tsx |
| 3 | Add matchMedia mock + extend vitest + create tests | 629b666 | tests/SettingsPage.test.tsx, tests/vitest-setup.js, vitest.config.ts |

---

## What Was Built

### utils/settings.ts
Settings store helper following the Phase 12 LazyStore pattern. Three exports:
- `type Theme = 'dark' | 'light'`
- `loadSettings(): Promise<{ theme: Theme } | null>` — reads `'settings'` key from `store.json`
- `saveSettings(settings)` — calls `store.set()` then `store.save()` (Pitfall 1 guard: disk flush required)
- `applyTheme(theme)` — `document.body.classList.toggle('dark', theme === 'dark')`

Uses same `store.json` file as klassen data (D-07/A3 — separate key per concern).

### src/components/SettingsPage.tsx
Four-section settings page per UI-SPEC Component Inventory:
1. **Weergave** — dark mode toggle with `<label className="toggle-switch">` / `.toggle-track` / `.toggle-thumb`
2. **Bestanden** — "Bestanden toevoegen" CTA button navigating to ImportPage
3. **Deelgebieden & Leerlijnen** — Phase 18 placeholder
4. **Drempelwaarden & BPV-uren** — Phase 18 placeholder

**Flicker-free initializer (Codex MEDIUM resolved):** `isDark` is initialized via `useState(() => document.body.classList.contains('dark'))` — reads the already-hydrated body.dark class set by Plan 17-03 startup code, so the toggle is visually correct on first paint without waiting for the async `loadSettings()`.

**Mount effect:** `loadSettings()` in try/catch; persisted theme → apply+sync; absent → OS matchMedia → apply, NOT persist (D-06/Pitfall 4).

**handleToggle:** `applyTheme` + `setIsDark` + `saveSettings` — all three in sync (Pitfall 6).

### tests/SettingsPage.test.tsx
6 Vitest tests at `tests/` (not `src/`) so the include pattern discovers them:
1. SET-01 persistence: toggle → body.dark added + store persists `{ theme: 'dark' }`
2. SET-01 restore: preloaded 'dark' theme restored on mount, checkbox checked
3. SET-01 OS fallback: dark matchMedia + empty store → body.dark added, store NOT written (D-06)
4. Flicker-free: body.dark pre-set → checkbox checked synchronously on first paint (no await)
5. SET-02: "Bestanden toevoegen" click → `onNavigateToImport` called once
6. Back button: "← Terug" click → `onBack` called once

### Test Infrastructure
- **vitest.config.ts:** include extended to `{js,ts,jsx,tsx}` (additive, no regression)
- **tests/vitest-setup.js:** `window.matchMedia` stub via `Object.defineProperty` — default `matches:false` (light mode); tests override via `mockImplementation`

---

## Verification

- `npx vitest run` exits 0: **49 tests passed, 5 skipped** (43 existing + 6 new — target ≥49 met)
- `utils/settings.ts` exists, exports `Theme`, `loadSettings`, `saveSettings`, `applyTheme`
- `src/components/SettingsPage.tsx` exists, uses `document.body.classList.contains('dark')` in lazy initializer
- `tests/SettingsPage.test.tsx` exists at `tests/` (not `src/`)
- `tests/vitest-setup.js` contains `matchMedia` mock and original `globalThis.jest` shim
- `vitest.config.ts` include literally reads `{js,ts,jsx,tsx}`

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @testing-library/react missing from devDependencies**
- **Found during:** Task 3 — first test run
- **Issue:** `import { render, screen, fireEvent, act } from '@testing-library/react'` failed with "Failed to resolve import"
- **Fix:** `npm install --save-dev @testing-library/react @testing-library/user-event`
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** 629b666

**2. [Rule 1 - Bug] vi.mock() hoisting causes TDZ error on module-level variable reference**
- **Found during:** Task 3 — second test run
- **Issue:** `Cannot access '_settingsStoreMap' before initialization` — vi.mock() factory is hoisted before `let _settingsStoreMap = new Map()`, so the constructor referencing the variable threw TDZ.
- **Fix:** Used `vi.hoisted()` to declare the shared map in a hoisted closure; LazyStore mock constructor accesses it via `getStoreMap()` getter rather than a direct variable reference.
- **Files modified:** `tests/SettingsPage.test.tsx`
- **Commit:** 629b666 (same task commit)

---

## Known Stubs

None. The SettingsPage component is fully functional for SET-01 and SET-02. The Phase 18 placeholder sections render with "Komt in een volgende versie." text as intended per D-11 — these are documented placeholders, not stubs that block the plan goal.

---

## Threat Flags

None. This plan introduces no new network endpoints, auth paths, file access patterns, or schema changes. The `'settings'` store key holds `{ theme: 'dark' | 'light' }` only — no PII.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| utils/settings.ts exists | FOUND |
| src/components/SettingsPage.tsx exists | FOUND |
| tests/SettingsPage.test.tsx exists | FOUND |
| 17-02-SUMMARY.md exists | FOUND |
| Commit c857acd (Task 1) | FOUND |
| Commit 1071a4a (Task 2) | FOUND |
| Commit 629b666 (Task 3) | FOUND |
| npx vitest run: 49 passed, 0 failed | PASS |
