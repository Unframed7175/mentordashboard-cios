---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Stack Modernisering
status: planning
last_updated: "2026-05-12T00:00:00.000Z"
last_activity: 2026-05-12 — Roadmap created, Phase 10 is next
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-12)

**Core value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.
**Current focus:** v2.0 — Stack Modernisering (TypeScript + React + Tauri + AVG)

## Current Position

Phase: 10 — Scaffold & Toolchain
Plan: —
Status: Not started (roadmap defined, awaiting first plan)
Last activity: 2026-05-12 — Roadmap v2.0 created (Phases 10–15, 20 requirements mapped)

Progress: [░░░░░░░░░░] 0%

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

### Pending Todos

- Verify SheetJS CDN tarball (0.20.3) license compliance for school distribution (before Phase 15)
- Confirm SomToday export format is still .xls (not .xlsx) against a real file in Phase 11

### Blockers/Concerns

- Rust toolchain not installed — first task of Phase 10 must install it

## Session Log

- 2026-04-23: v1.2 Dashboard Redesign milestone started — aanwezigheidspercentage in tegels + CIOS huisstijl redesign
- 2026-04-24: v1.2 roadmap created — Phase 9 defined (VRZ-01, VRZ-02, DES-01, DES-02, DES-03, DES-04)
- 2026-04-24: Phase 9 executed — CIOS huisstijl tokens, bold typografie, aanwezigheidspercentage in tegels. Verification 9/9. v1.2 milestone complete.
- 2026-05-12: v2.0 Stack Modernisering milestone gestart — TypeScript + React + Tauri + AVG-compliance. Seed geactiveerd.
- 2026-05-12: Roadmap v2.0 created — Phases 10–15 defined, all 20 requirements mapped.
