---
gsd_state_version: 1.0
milestone: v2.3
milestone_name: Inzicht, Configuratie & Testers Onboarden
status: requirements_defined
last_updated: "2026-05-21T00:00:00.000Z"
last_activity: 2026-05-21 — Roadmap created. Phase 25 is next.
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.
**Current focus:** v2.3 — Phase 25: Doorstroomnorm Configuratie

## Current Position

Phase: 25 — Doorstroomnorm Configuratie
Plan: —
Status: Requirements defined — ready to plan
Last activity: 2026-05-21 — v2.3 roadmap created (Phases 25–30, 36 requirements mapped)

## Progress Bar

```
v2.3: [____________________] 0% (0/6 phases) — Phase 25 next
```

## Performance Metrics

v1.0 phases completed: 5/5
v1.1 phases completed: 3/3
v1.2 phases completed: 1/1
v2.0 phases completed: 6/6
v2.1 phases completed: 4/4
v2.2 phases completed: 5/5
v2.3 phases completed: 0/6

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

### v2.2 Design Notes

- [20-01] dragDropEnabled: false in tauri.conf.json — disables Tauri 2 native OS drag intercept, restores HTML5 DataTransfer.files for import dropzone (BUG-01)
- [20-01] Cargo.toml [package] version bumped to 2.2.0 to align with v2.2 milestone
- Phase 20 (BUG-01): Fix is one config line — `"dragDropEnabled": false` in `app.windows[0]` in `tauri.conf.json`. Document-level `preventDefault` listeners in `App.tsx` must be PRESERVED (they prevent browser navigation on accidental drops — unrelated to the bug).
- Phase 21 (EXP): `window.print()` works in Tauri 2 WebView2. Use `.print-target` wrapper + `@media print { body > * { display: none; } }`. `@page { size: A4; margin: 2cm; }` suppresses Chromium URL header/footer. `print-color-adjust: exact` preserves RAG badge colors.
- Phase 22 (BPV): Separate `parseBpvExcel()` in `utils/bpv.ts` — do NOT reuse `parseExcelFile`. Separate sheet-scorer keywords: `bpv` (+4), `stage` (+3), `uren` (+2). `debugBpvExcel()` helper must run on real file before writing column matchers. `XLSX.read({ cellDates: true })` for date columns. Graceful fallback: `gerealiseerdeUren = 0` if column not found.
- Phase 22 (BPV) PARTIAL BLOCK: Column matchers for BPV-01 require a real BPV Excel export file. Scaffold and routing proceed without it; `gerealiseerdeUren` shows 0 until sample file is provided.
- Phase 23 (RNL): New optional fields on `StudentRecord`: `rekenResultaat?: string | null`, `nederlandsResultaat?: string | null`. `normalizeRekenScore()` separate from `normalizeScore()` — score format may differ from V/G/E. `?? null` fallback required on all deserialized old records.
- Phase 23 (RNL) PARTIAL BLOCK: RNL-04 PDF extraction requires a real PDF with Rekenen/Nederlands section. Data model + UI proceeds without it; extraction is additive.
- Phase 24 (ONB): Add `'onboarding'` to `view` union in `App.tsx`. First-run detection: `Object.keys(klassenState.klassen).length === 0` in startup `useEffect`. All wizard state lifted to parent — step components are purely presentational. Do NOT mount full `<ImportPage />` inside wizard steps — use stripped-down inline dropzones. `onboardingComplete: true` persisted to store after final step.
- Phase 24 (ONB): Depends on Phase 20 (drag-drop). BPV wizard step (Step 4) improves with Phase 22 complete but is not a hard dependency.

### v2.3 Design Notes

- Phase 25 (NORM): Doorstroomnorm config extends existing settings pattern (Phase 18 pattern). Store via plugin-store same as deelgebieden/verzuimDrempels/bpv. `berekenPrognose()` must read thresholds from settings store synchronously (getLeerlijnenMappingSync pattern applies here too). Provide `getDefaultNormen()` as reset function.
- Phase 26 (TEGEL/TREND): Score-telling computed from same `berekenPrognose()` output — no separate calculation needed. Trend pijl requires comparing `prognoseFase1` vs `prognoseFase2` on the StudentRecord. Only render pijl when both phases present (`student.fase1Data != null && student.fase2Data != null`).
- Phase 28 (FEED): Use `tauri-plugin-os` for OS info (already available in Tauri 2). App version readable from `tauri.conf.json` via `import { getVersion } from '@tauri-apps/api/app'`. Console errors must be intercepted via `window.onerror` + `console.error` patch at app init and stored in a ring buffer (last 10 entries). mailto: URL must be built client-side — no server call.
- Phase 30 (TEST CI): GitHub Actions matrix should use `windows-latest` and `macos-latest` (Apple Silicon). Mirror Phase 15 CI pattern but trigger on push to main rather than on tag/release. Smoke test = exit code 0 from `npm run build` (no Rust test suite required for this phase).

### Pending Todos

- Verify SheetJS CDN tarball (0.20.3) license compliance for school distribution (before Phase 15)
- Confirm SomToday export format is still .xls (not .xlsx) against a real file in Phase 11
- Provide real BPV Excel export file to unblock Phase 22 column matchers (BPV-01)
- Provide real voortgang PDF with Rekenen/Nederlands section to unblock Phase 23 PDF extraction (RNL-04)

### Blockers/Concerns

- [RESOLVED] Rust toolchain not installed — Rust 1.95.0 confirmed installed (D-09 superseded)
- [RESOLVED → Phase 11] 7 test files + 3 util files lost in scaffold --force — recreated as .ts in Phase 11 plans
- [Phase 11] @types/pdfjs-dist deprecated — vendor bundle has no .d.ts; use @ts-ignore + as any for pdfjs API calls
- [Phase 11] tsconfig.migrated.json (noImplicitAny:true, includes utils/**, parsers/**) satisfies D-11-05 without touching global tsconfig
- [Phase 11] parseStageFile = parseSinglePDF (RESEARCH confirmed; no separate parser/parseStage.js exists)
- [Phase 11] SheetJS cpexcel: import cpexcel from 'xlsx/dist/cpexcel.full.mjs'; XLSX.set_cptable(cpexcel.cptable)
- [Phase 22 — OPEN] BPV column matchers blocked on real BPV Excel file. Scaffold proceeds; BPV-01 partially delivered until file provided.
- [Phase 23 — OPEN] RNL PDF extraction blocked on real PDF with R&N section. Data model + UI proceeds; RNL-04 partially delivered until file provided.

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
- 2026-05-19: Phase 19 Plan 01 executed — RED spider test scaffold. tests/spider.test.ts rewritten with 7 JSX-aware tests (React.isValidElement, renderToStaticMarkup, onHover callback contract). 5/7 tests RED until Plan 03 ships JSX refactor. 88 non-spider tests green. 0 deviations.
- 2026-05-19: Phase 19 Plans 02–04 executed — CIOS brand refresh (Industry font, #009FE3 accent, Material shadows), spider chart JSX refactor + tooltips, dark mode lift to App.tsx, settings slide-in animation, logo swap, responsive grid fix. 7/8 UAT items passed. 1 cosmetic open: nav ::after diagonal stripe not visible in Tauri WebView (background task logged). v2.1 SHIPPED.
- 2026-05-19: v2.2 milestone started. Roadmap created — Phases 20–24 defined, all 21 requirements mapped. Next: /gsd-plan-phase 20
- 2026-05-19: Phase 20 Plan 01 executed — BUG-01 fixed. dragDropEnabled: false in tauri.conf.json. Cargo.toml bumped to 2.2.0. 93/93 tests pass. commit dd6f1a7.
- 2026-05-20: Phase 23 Plan 02 executed — RekenenNederlandsSection.tsx created (TDD: 22 tests, RED→GREEN). Norm badge inline with label (3F/2F/1F). Mounted in DetailWeergave.tsx between AanvullendSection and StageSection. 132/132 tests pass. commit 6946d84.
- 2026-05-20: Phase 24 executed — OnboardingWizard.tsx (5-step wizard: klas aanmaken, PDFs, verzuim, BPV, completion). App.tsx wired with lazy view initializer + handleOnboardingComplete. ONB-01..08 fulfilled. 132/132 tests pass. commit 49135bc. v2.2 COMPLETE.
- 2026-05-20: Phase 24 gap closure (plan 24-03) executed — ONB-06 settings step (drempelwaarden), ghost-class lazy-init fix, klasId null-guard, Afbreken abort flow. 132/132 tests pass. commit 4767da1.
- 2026-05-21: v2.3 milestone started. Roadmap created — Phases 25–30 defined, 36 requirements mapped (NORM-01..07, TEGEL-01..02, TREND-01..04, KLS-01..03, FEED-01..05, HELP-01..04, TEST-01..05, UI-01..04, FIX-01..02). Next: /gsd-plan-phase 25
