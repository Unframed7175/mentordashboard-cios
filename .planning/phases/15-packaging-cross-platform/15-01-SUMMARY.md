---
phase: 15-packaging-cross-platform
plan: "01"
subsystem: tauri-bundle-config
tags: [tauri, packaging, cargo, entitlements, macos, windows, nsis]
dependency_graph:
  requires: []
  provides: [bundle-metadata, entitlements-plist, nsis-currentuser-config, macos-adhoc-signing-config]
  affects: [src-tauri/Cargo.toml, src-tauri/entitlements.plist, src-tauri/tauri.conf.json]
tech_stack:
  added: [entitlements.plist]
  patterns: [ad-hoc-signing, nsis-currentuser, jit-entitlements]
key_files:
  created: [src-tauri/entitlements.plist]
  modified: [src-tauri/Cargo.toml, src-tauri/tauri.conf.json]
decisions:
  - "bundle.targets stays 'all' (not ['nsis']) — NSIS-only exclusion enforced per-runner via CI args in Plan 02 (Codex review finding)"
  - "keychain-access-groups omitted from entitlements.plist — with ad-hoc signing, $(AppIdentifierPrefix) does not expand and causes errSecMissingEntitlement (-34018)"
  - "signingIdentity: '-' wired in tauri.conf.json for macOS ad-hoc code signing (Apple Silicon requirement)"
  - "installMode: 'currentUser' — no UAC admin prompt; installs to AppData\\Local"
metrics:
  duration_minutes: 110
  completed_date: "2026-05-16"
  tasks_completed: 3
  tasks_planned: 3
  files_created: 1
  files_modified: 2
---

# Phase 15 Plan 01: Local Tauri Bundle Configuration Summary

**One-liner:** Cargo.toml CIOS metadata + entitlements.plist (JIT only, no keychain-access-groups) + tauri.conf.json bundle with NSIS currentUser + macOS ad-hoc signing via signingIdentity "-".

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update Cargo.toml package metadata (D-09) | fdb3de0 | src-tauri/Cargo.toml |
| 2 | Create entitlements.plist and update tauri.conf.json bundle | 1bb5c7f | src-tauri/entitlements.plist, src-tauri/tauri.conf.json |
| 3 | Build preflight and regression guard | (no file changes) | — |

## Verification Results

1. `src-tauri/Cargo.toml` [package].description = "Mentordashboard CIOS — voortgang en verzuim in één oogopslag" — PASS
2. `src-tauri/Cargo.toml` [package].authors = ["CIOS Zuidwest"] — PASS
3. `src-tauri/Cargo.toml` [package].name = "tauri-app" (unchanged) — PASS
4. `src-tauri/entitlements.plist` exists — PASS
5. entitlements.plist contains com.apple.security.cs.allow-jit — PASS
6. entitlements.plist contains com.apple.security.cs.allow-unsigned-executable-memory — PASS
7. entitlements.plist does NOT contain keychain-access-groups — PASS
8. `tauri.conf.json` bundle.targets = "all" (unchanged) — PASS
9. `tauri.conf.json` bundle.windows.nsis.installMode = "currentUser" — PASS
10. `tauri.conf.json` bundle.macOS.entitlements = "./entitlements.plist" — PASS
11. `tauri.conf.json` bundle.macOS.signingIdentity = "-" — PASS
12. `tauri.conf.json` productName = "Mentordashboard CIOS" (unchanged per D-10) — PASS
13. `tauri.conf.json` identifier = "nl.cios.mentordashboard" (unchanged per D-10) — PASS
14. `tauri.conf.json` app.windows[0].useHttpsScheme: true (unchanged — required for plugin-store) — PASS
15. `npm run build` exits 0 — PASS (produced NSIS .exe + MSI on Windows runner)
16. `npm test` exits 0, 43 tests passed, 0 failed — PASS

## Decisions Made

- **bundle.targets stays "all":** The plan's context states this explicitly per Codex peer review (HIGH priority finding). Setting targets to ["nsis"] in tauri.conf.json would risk suppressing macOS DMG generation on the macOS CI runner. The Windows-only NSIS enforcement is delegated to Plan 02 via `args: --bundles nsis` on the Windows job matrix entry.
- **keychain-access-groups omitted:** Per D-04 and RESEARCH.md Q2/Pitfall 4 — ad-hoc signing with `signingIdentity: "-"` does not expand `$(AppIdentifierPrefix)` variable, causing `errSecMissingEntitlement (-34018)`. The plist contains only the two JIT entitlements required for Tauri WebKit rendering.
- **Task 3 no commit:** Task 3 (`npm run build` + `npm test`) produced no file modifications. The task's `<files></files>` element is empty by design — it is a pure verification gate. No commit was made for this task as there were no staged changes.

## Deviations from Plan

None — plan executed exactly as written. The review-driven change noted in the objective (bundle.targets stays "all" per Codex review) was already incorporated in the plan specification; no runtime correction was needed.

## Build Artifacts Produced

Running `npm run build` (which runs `tauri build`) on the local Windows machine produced:
- `src-tauri/target/release/bundle/nsis/Mentordashboard CIOS_2.0.0_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/Mentordashboard CIOS_2.0.0_x64_en-US.msi`

Both are expected with `targets: "all"` on Windows. In CI (Plan 02), the Windows runner uses `args: --bundles nsis` which will suppress the MSI artifact.

## Known Stubs

None — this plan modifies config files only; no UI or data stubs introduced.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. Changes are config-file-only. Threat model T-15-01 (keychain-access-groups absent) and T-15-03 (installMode: currentUser) are both verified by acceptance criteria. T-15-02 (ad-hoc signing accepted risk) documented in plan — no change.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src-tauri/entitlements.plist exists | FOUND |
| src-tauri/Cargo.toml exists | FOUND |
| src-tauri/tauri.conf.json exists | FOUND |
| Commit fdb3de0 (Task 1 — Cargo.toml) | FOUND |
| Commit 1bb5c7f (Task 2 — entitlements + tauri.conf.json) | FOUND |
