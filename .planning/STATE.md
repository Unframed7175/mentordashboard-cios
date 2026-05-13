---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Stack Modernisering
status: in-progress
last_updated: "2026-05-13T22:10:00.000Z"
last_activity: 2026-05-13 — Phase 10 complete (all 3 plans done; TCH-01/02/04 ✓, TCH-03 partial)
progress:
  total_phases: 10
  completed_phases: 5
  total_plans: 14
  completed_plans: 12
  percent: 86
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-12)

**Core value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.
**Current focus:** v2.0 — Stack Modernisering (TypeScript + React + Tauri + AVG)

## Current Position

Phase: 10 — Scaffold & Toolchain ✅ COMPLETE
Plan: 3/3 complete
Status: Phase 10 done — advancing to Phase 11 (TypeScript Migratie)
Last activity: 2026-05-13 — Plans 10-02 and 10-03 complete. Tauri window verified (TCH-01), installer built (TCH-02), Vitest running 9 tests (TCH-03 partial), typecheck passes (TCH-04)

Progress: [████████░░] 82%

## Performance Metrics

v1.0 phases completed: 5/5
v1.1 phases completed: 3/3
v1.2 phases completed: 1/1
v2.0 phases completed: 0/6

## Accumulated Context

### Decisions

- [research] Encryption: OS keychain via tauri-plugin-secure-storage (not Stronghold — deprecated)
- [research] Backup format: zip.js kept as read-only import for backward-compatible restore
- [research] TypeScript strategy: noImplicitAny per-module incrementally — not full strict on all files simultaneously
- [research] Pre-flight blocker: Rust NOT installed — Phase 10 must start with `winget install Rustlang.Rustup` + VS2022 C++ build tools
- [research] pdfjs worker: copy to public/, set absolute workerSrc path (not workerPort)
- [research] SheetJS: register cpexcel.full.mjs before any XLSX.read() call for correct Dutch characters
- [research] localStorage unreliable in Tauri prod — plugin-store replaces it (useHttpsScheme or migrate before deploy)
- [research] window.* globals (window.XLSX, window.parseSinglePDF, etc.) must become named ES module exports before React
- [10-01] scaffold: npm create tauri-app --force wipes ALL untracked files — commit all untracked work before running scaffold in future
- [10-01] vite-dev script = 'vite', dev script = 'tauri dev', beforeDevCommand references vite-dev to avoid infinite cycle
- [10-01] package.json type=module required for Vite ESM output

### Pending Todos

- Verify SheetJS CDN tarball (0.20.3) license compliance for school distribution (before Phase 15)
- Confirm SomToday export format is still .xls (not .xlsx) against a real file in Phase 11

### Blockers/Concerns

- [RESOLVED] Rust toolchain not installed — Rust 1.95.0 confirmed installed (D-09 superseded)
- [KNOWN GAP → Phase 11] 7 test files + utils/aggregation.js + utils/backup.js + utils/spider.js lost in scaffold --force (Plan 10-01). No backup available. Vitest infrastructure complete (9 tests pass). Test files to be recreated as TypeScript in Phase 11 alongside the TS migration of those utility modules.

## Session Log

- 2026-04-23: v1.2 Dashboard Redesign milestone started — aanwezigheidspercentage in tegels + CIOS huisstijl redesign
- 2026-04-24: v1.2 roadmap created — Phase 9 defined (VRZ-01, VRZ-02, DES-01, DES-02, DES-03, DES-04)
- 2026-04-24: Phase 9 executed — CIOS huisstijl tokens, bold typografie, aanwezigheidspercentage in tegels. Verification 9/9. v1.2 milestone complete.
- 2026-05-12: v2.0 Stack Modernisering milestone gestart — TypeScript + React + Tauri + AVG-compliance. Seed geactiveerd.
- 2026-05-12: Roadmap v2.0 created — Phases 10–15 defined, all 20 requirements mapped.
- 2026-05-13: Phase 10 Plan 01 executed — Tauri react-ts scaffold (src/, src-tauri/), index.html.bak, package.json merged (vitest ^4.1.6, jsdom ^29.1.1, no jest), npm install 114 packages. 7 test files + 3 util files lost due to scaffold --force; no backup available.
- 2026-05-13: Phase 10 Plans 02 + 03 executed — vite.config.ts (base: './'), tsconfig strict:false, tauri.conf.json (useHttpsScheme:true, beforeDevCommand:vite-dev), capabilities core:default, App.tsx placeholder, Tauri window verified (TCH-01), installer built (TCH-02), Vitest 9 tests pass (TCH-03 partial), typecheck 0 errors (TCH-04). Phase 10 complete.
