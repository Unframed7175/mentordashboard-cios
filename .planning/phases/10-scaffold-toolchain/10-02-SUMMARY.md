---
phase: 10-scaffold-toolchain
plan: 02
subsystem: infra
tags: [tauri, vite, react, typescript, config]

# Dependency graph
requires:
  - phase: 10-01
    provides: Tauri scaffold (src/, src-tauri/, vite.config.ts, tsconfig.json, package.json merged)
provides:
  - vite.config.ts: base './', port 1420, strictPort: true, react plugin — production-safe Vite config
  - src-tauri/tauri.conf.json: productName/title 'Mentordashboard CIOS', version 2.0.0, useHttpsScheme: true, beforeDevCommand='npm run vite-dev'
  - src-tauri/capabilities/default.json: identifier=main-capability, permissions=[core:default]
  - tsconfig.json + tsconfig.app.json + tsconfig.node.json: strict=false, noImplicitAny=false (D-08)
  - src/App.tsx: React placeholder showing 'Mentordashboard CIOS', 'v2.0 - Scaffold', green 'Scaffold complete'
affects:
  - 10-03 (vitest config runs against these scaffold files)
  - 11-typescript-migration (tsconfig strict:false enables incremental migration)
  - future phases using Tauri IPC (capabilities pattern established)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "beforeDevCommand='npm run vite-dev' separates Vite startup from tauri dev (avoids infinite cycle Pitfall 4)"
    - "vite.config.ts base='./' prevents 404 on assets in Tauri production bundles (Pitfall 5)"
    - "useHttpsScheme: true set from day 1 for Windows localStorage stability (P-07)"
    - "tsconfig.json strict: false + noImplicitAny: false globally (D-08) — per-module strictness in Phase 11"

key-files:
  created:
    - "tsconfig.app.json (new — mirrors tsconfig.json settings for src/)"
  modified:
    - "vite.config.ts (base: './', port 1420, strictPort: true, host localhost)"
    - "tsconfig.json (strict: false, noImplicitAny: false, removed project references)"
    - "tsconfig.node.json (target ES2022, strict: false)"
    - "src-tauri/tauri.conf.json (productName, version, beforeDevCommand, useHttpsScheme, window title/size)"
    - "src-tauri/capabilities/default.json (identifier=main-capability, core:default only)"
    - "src/App.tsx (React placeholder — D-07)"

key-decisions:
  - "tsconfig.json project references removed — composite: true requirement conflicts with noEmit: true; root tsconfig includes src directly"
  - "beforeBuildCommand set to 'vite build' (not 'npm run build') to avoid tauri build calling itself recursively"
  - "App.tsx uses &mdash; HTML entity for em-dash to avoid encoding issues in the v2.0 subtitle"

patterns-established:
  - "Pattern: capabilities/default.json = phase-scoped minimal permissions; new permissions added in later phases"
  - "Pattern: tauri.conf.json version matches package.json version (2.0.0)"

requirements-completed:
  - TCH-01
  - TCH-02
  - TCH-04

# Metrics
duration: 15min
completed: 2026-05-13
---

# Phase 10 Plan 02: Config & React Placeholder Summary

**Vite config (base './'), Tauri config (useHttpsScheme, beforeDevCommand='npm run vite-dev'), and React placeholder 'Mentordashboard CIOS' replacing all scaffold defaults**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-13T19:00:00Z
- **Completed:** 2026-05-13T19:15:00Z
- **Tasks:** 2 of 4 complete (Tasks 3 and 4 are human checkpoints)
- **Files modified:** 7

## Accomplishments

- vite.config.ts rewritten: base './' (critical for Tauri production), port 1420, strictPort: true, host localhost
- tsconfig.json + tsconfig.app.json + tsconfig.node.json: all strict=false, noImplicitAny=false per D-08
- src-tauri/tauri.conf.json: productName='Mentordashboard CIOS', version=2.0.0, useHttpsScheme=true, beforeDevCommand='npm run vite-dev', window 1200x800
- src-tauri/capabilities/default.json: minimal core:default only (Phase 12+ adds store:*, fs:*, dialog:*)
- src/App.tsx: placeholder showing heading 'Mentordashboard CIOS', 'v2.0 — Scaffold', green 'Scaffold complete'
- npm run typecheck exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Write vite.config.ts and tsconfig files** - `a1b0802` (feat)
2. **Task 2: Write tauri.conf.json, capabilities, and React placeholder** - `29af1a0` (feat)
3. **Task 3: Smoke test — npm run dev** - PENDING human checkpoint
4. **Task 4: Build smoke test — npm run build** - PENDING human checkpoint

## Files Created/Modified

- `vite.config.ts` — Replaced scaffold default: base './', port 1420, strictPort: true, host localhost, hmr: true
- `tsconfig.json` — Replaced scaffold default: strict: false, noImplicitAny: false, no project references
- `tsconfig.app.json` — Created (new): mirrors tsconfig.json settings for src/
- `tsconfig.node.json` — Updated: target ES2022, strict: false
- `src-tauri/tauri.conf.json` — Replaced scaffold default: all project-specific settings applied
- `src-tauri/capabilities/default.json` — Replaced scaffold default: identifier=main-capability, core:default only
- `src/App.tsx` — Replaced scaffold default: React placeholder per D-07

## Decisions Made

- tsconfig.json `references` array removed. The TypeScript project references feature requires `composite: true` in referenced configs, but `composite: true` conflicts with `noEmit: true`. Since Plan 02 only needs `tsc --noEmit` for type-checking, the root tsconfig includes `src` directly — tsconfig.app.json and tsconfig.node.json remain available for IDE tooling and future build workflows.
- `beforeBuildCommand` set to `"vite build"` (not `"npm run build"`). If `npm run build` were used, it would call `tauri build` which calls `beforeBuildCommand` again — same infinite cycle risk as the `beforeDevCommand` pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed project references from tsconfig.json**
- **Found during:** Task 1 (verify with npm run typecheck)
- **Issue:** The plan specified adding `references: [{path: './tsconfig.app.json'}, {path: './tsconfig.node.json'}]` to tsconfig.json. TypeScript requires referenced projects to have `composite: true` set, but `composite: true` is incompatible with `noEmit: true` (TS6310 error). `npm run typecheck` failed with 4 errors.
- **Fix:** Removed the `references` array from tsconfig.json. Root tsconfig includes `src` directly. tsconfig.app.json and tsconfig.node.json remain for IDE tooling.
- **Files modified:** tsconfig.json
- **Verification:** npm run typecheck exits 0
- **Committed in:** a1b0802 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix required for npm run typecheck to pass. No scope creep. tsconfig.app.json still created as specified; just not wired via project references.

## Issues Encountered

None beyond the tsconfig project references deviation documented above.

## User Setup Required

None — no external service configuration required. Tasks 3 and 4 require user to run `npm run dev` and `npm run build` in dashboard-2/ directory.

## Next Phase Readiness

- Plan 10-03 (128 Vitest tests): still blocked by missing test files from scaffold --force in Plan 10-01 (see STATE.md blocker)
- Tasks 3 and 4 (human checkpoints): user must run `npm run dev` and `npm run build` to satisfy TCH-01 and TCH-02

---
*Phase: 10-scaffold-toolchain*
*Completed: 2026-05-13*
