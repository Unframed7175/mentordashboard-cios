---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Settings, Polish & Auto-class Detection
status: Ready for Phase 19
last_updated: "2026-05-18T20:32:18.454Z"
last_activity: 2026-05-18 -- Phase 18 complete (SET-03/04/05/06 shipped, Gap A fixed, Gap B D-13 pending sample file)
progress:
  total_phases: 14
  completed_phases: 13
  total_plans: 42
  completed_plans: 42
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.
**Current focus:** v2.1 — Settings, Polish & Auto-class Detection

## Current Position

Phase: 18 (complete)
Plan: 05 (complete)
Status: Ready for Phase 19
Last activity: 2026-05-18 -- Phase 18 complete (SET-03/04/05/06 shipped, Gap A fixed, Gap B D-13 pending sample file)

## Progress Bar

```
v2.1: [██████████░░░░░░░░░░] 50% (2/4 phases)
```

## Performance Metrics

v1.0 phases completed: 5/5
v1.1 phases completed: 3/3
v1.2 phases completed: 1/1
v2.0 phases completed: 5/6
v2.1 phases completed: 0/4

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
- [12-01] GetItemResponse.data field name verified from source — RESEARCH.md A1 assumption (.value) was wrong; actual field is .data: Option<String>
- [12-01] SecureStorage API takes OptionsRequest struct (not plain string) — get_item returns Ok(data:None) when key absent, not Err
- [12-01] No explicit rand crate needed — aes_gcm::aead::OsRng re-export works correctly (A4 confirmed)
- [12-04] LazyStore mock must be ES6 class (not vi.fn()) — required for new LazyStore() constructor call in utils/klassen.ts
- [12-04] invoke mock uses btoa encoding for STO-02 ciphertext opacity — plain prefix fails not.toContain assertion
- [15-01] bundle.targets stays "all" — NSIS-only enforced per-runner via CI args in Plan 02 (Codex peer review finding)
- [15-01] keychain-access-groups omitted from entitlements.plist — ad-hoc signing does not expand $(AppIdentifierPrefix), causes errSecMissingEntitlement (-34018)
- [15-01] macOS ad-hoc signing: signingIdentity "-" in tauri.conf.json — required for Apple Silicon compatibility without Developer cert

### Pending Todos

- Verify SheetJS CDN tarball (0.20.3) license compliance for school distribution (before Phase 15)
- Confirm SomToday export format is still .xls (not .xlsx) against a real file in Phase 11

### v2.1 Design Notes

- Phase 16 (ACD-01): PDF-header parsing logic is already in parsers/pdf.ts — auto-detect must extract klas-name from existing parsed fields, not re-parse the file
- Phase 17 (SET-01 + POL-01): Dark mode CSS must use the existing CSS custom property pattern (`:root` / `body.dark`) from Phase 9; extend, do not replace
- Phase 17 (SET-02): Import flow already exists in ImportPage.tsx — settings should reuse the same dropzone component or trigger the same Tauri dialog, scoped to the active klas
- Phase 18 (SET-03/04): Deelgebieden config lives in utils/leerlijnen.ts — edits must go through the async save path (plugin-store) established in Phase 12
- Phase 18 (SET-05/06): Thresholds and BPV-uren are new configurable fields — need schema extension in utils/schema.ts (or a separate settings store key)
- Phase 19 (POL-02): SpiderChartCard is in src/components/SpiderChartCard — tooltip layer must be SVG-native or an absolutely-positioned React element, not a browser tooltip
- ui-ux-pro-max skill available: use `python .claude/skills/ui-ux-pro-max/scripts/search.py` for animation, color, and UX guidance during UI phases

### Blockers/Concerns

- [RESOLVED] Rust toolchain not installed — Rust 1.95.0 confirmed installed (D-09 superseded)
- [RESOLVED → Phase 11] 7 test files + 3 util files lost in scaffold --force — recreated as .ts in Phase 11 plans
- [Phase 11] @types/pdfjs-dist deprecated — vendor bundle has no .d.ts; use @ts-ignore + as any for pdfjs API calls
- [Phase 11] tsconfig.migrated.json (noImplicitAny:true, includes utils/**, parsers/**) satisfies D-11-05 without touching global tsconfig
- [Phase 11] parseStageFile = parseSinglePDF (RESEARCH confirmed; no separate parser/parseStage.js exists)
- [Phase 11] SheetJS cpexcel: import cpexcel from 'xlsx/dist/cpexcel.full.mjs'; XLSX.set_cptable(cpexcel.cptable)

## Session Log

- 2026-04-23: v1.2 Dashboard Redesign milestone started — aanwezigheidspercentage in tegels + CIOS huisstijl redesign
- 2026-04-24: v1.2 roadmap created — Phase 9 defined (VRZ-01, VRZ-02, DES-01, DES-02, DES-03, DES-04)
- 2026-04-24: Phase 9 executed — CIOS huisstijl tokens, bold typografie, aanwezigheidspercentage in tegels. Verification 9/9. v1.2 milestone complete.
- 2026-05-12: v2.0 Stack Modernisering milestone gestart — TypeScript + React + Tauri + AVG-compliance. Seed geactiveerd.
- 2026-05-12: Roadmap v2.0 created — Phases 10–15 defined, all 20 requirements mapped.
- 2026-05-13: Phase 10 Plan 01 executed — Tauri react-ts scaffold (src/, src-tauri/), index.html.bak, package.json merged (vitest ^4.1.6, jsdom ^29.1.1, no jest), npm install 114 packages. 7 test files + 3 util files lost due to scaffold --force; no backup available.
- 2026-05-13: Phase 10 Plans 02 + 03 executed — vite.config.ts (base: './'), tsconfig strict:false, tauri.conf.json (useHttpsScheme:true, beforeDevCommand:vite-dev), capabilities core:default, App.tsx placeholder, Tauri window verified (TCH-01), installer built (TCH-02), Vitest 9 tests pass (TCH-03 partial), typecheck 0 errors (TCH-04). Phase 10 complete.
- 2026-05-14: Phase 11 discussed (21 decisions, 4 areas) and planned (6 plans, 4 waves). Research + pattern mapping complete. Verification passed 12/12 dimensions (iteration 2). Ready to execute.
- 2026-05-14: Phase 12 Plan 01 executed — Rust crypto layer. crypto.rs (AES-256-GCM encrypt_klassen/decrypt_klassen), tauri-plugin-store + tauri-plugin-secure-storage in lib.rs, store:default in capabilities. cargo check + cargo test (2 tests) passing. 3 deviations: GetItemResponse.data field, OptionsRequest struct API, non-ASCII byte string literal.
- 2026-05-14: Phase 12 Plan 04 executed — Vitest storage tests. tests/storage.test.ts aangemaakt met STO-01 t/m STO-04. LazyStore als class mock. invoke mock met btoa encoding. 4/4 tests passing. Volledige suite 35 passed. Phase 12 volledig afgerond.
- 2026-05-14: Phase 13 executed — Bestandstoegang. 2 plans: ImportPage.tsx (universal dropzone, sequential PDF batch via addStudent, Excel via mergeVerzuim, backup restore via applyBackupRestore+switchActiveKlas), async main.tsx IIFE startup, App.tsx document drop guard + storage-error-banner. 14/14 checks. 35 tests pass.
- 2026-05-15: Phase 14 executed — React UI. 6 plans (5 original + 1 gap closure): status.ts helper, App.tsx routing + KlasTabStrip + KlasModal, KlasOverzicht + LeerlingTegel, DetailWeergave (7 sections), FeedbackActiepuntenSection + SpiderChartCard + DeelgebiedenMatrix + NotitiesTextarea, AanvullendSection + StageSection + LeerlijnenSection. Verification passed 4/4 (SC-3 closed via gap closure plan 14-06). 43 tests, 0 failures.
- 2026-05-16: Phase 15 Plan 01 executed — Bundle config. Cargo.toml: description + authors updated (D-09). entitlements.plist created: JIT entitlements only (com.apple.security.cs.allow-jit + allow-unsigned-executable-memory; no keychain-access-groups). tauri.conf.json: targets stays "all", bundle.windows.nsis.installMode: "currentUser", bundle.macOS.entitlements + signingIdentity: "-". npm run build 0 (NSIS + MSI). npm test 43/43 passed. 0 deviations.
- 2026-05-17: v2.1 milestone started. Roadmap created — Phases 16–19 defined, all 11 requirements mapped. Next: /gsd-plan-phase 16
- 2026-05-17: Phase 16 planned — 1 plan (auto-detect klas from PDF header + toast notification). ACD-01 covered. Verification passed 12 dimensions.
- 2026-05-17: Phase 16 complete — autoDetectKlas() in ImportPage.tsx; ACD-01 shipped. UAT passed (2/3 tests; test 2 skipped). 2 out-of-scope bugs noted: drag-and-drop not working, stage Excel not parsing.
- 2026-05-18: Phase 18 Plan 01 executed — Wave 0 RED test scaffolds. 4 new test files (deelgebieden, verzuimDrempels, bpv, leerlijnen) + 2 extended (status, prognosis). 28 new RED tests gate Wave 1 GREEN. 3 tasks completed, 0 deviations.
- 2026-05-18: Phase 18 Plan 02 executed — Wave 1 utility implementations. 3 new files (deelgebieden.ts, verzuimDrempels.ts, bpv.ts) + getLeerlijnenMappingSync added + main.tsx pre-warm. 20/20 Wave 0 utility tests GREEN. 1 deviation: getLeerlijnenMapping async bug fixed early in prognosis.ts.
- 2026-05-18: Phase 18 Plan 05 executed — Wave 3 UI completion. SettingsPage section 4 (threshold inputs + BPV config + import button), BpvProgressSection (new), DeelgebiedenMatrix + SpiderChartCard active-DG filter (Invariant I1 preserved), DetailWeergave BPV mount (D-12), CSS section 25 completed. 89/89 tests pass. 0 deviations.
