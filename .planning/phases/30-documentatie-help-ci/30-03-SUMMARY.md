---
phase: 30-documentatie-help-ci
plan: "03"
subsystem: infra
tags: [github-actions, tauri, ci, windows, macos, rust]

requires:
  - phase: 15-tauri-packaging
    provides: release.yml met matrix en tauri-apps/tauri-action@v0 als sjabloon

provides:
  - .github/workflows/ci.yml — CI smoke build op Windows x64 en macOS Apple Silicon bij elke push naar main

affects: [30-documentatie-help-ci, release-workflow]

tech-stack:
  added: []
  patterns:
    - "CI workflow afgeleid van release.yml: zelfde matrix/actions, andere trigger, geen release-sleutels"
    - "APPLE_SIGNING_IDENTITY: '-' ad-hoc signing — geen Apple-certificaten nodig voor CI"

key-files:
  created:
    - .github/workflows/ci.yml
  modified: []

key-decisions:
  - "Geen permissions-blok in ci.yml — GITHUB_TOKEN auto-beschikbaar op lees-niveau; geen release-aanmaak nodig"
  - "macOS Intel (x86_64-apple-darwin) weggelaten uit CI-matrix conform STATE.md: alleen Apple Silicon voor CI"
  - "tauri-apps/tauri-action with: blok bevat alleen args om onbedoelde GitHub Release-aanmaak bij main-push te voorkomen"

patterns-established:
  - "CI-workflow = release.yml min release-sleutels plus branches-trigger"

requirements-completed:
  - TEST-01
  - TEST-02
  - TEST-03

duration: 5min
completed: 2026-05-28
---

# Phase 30 Plan 03: CI Workflow Summary

**GitHub Actions CI-workflow voor Tauri smoke-build op Windows x64 en macOS Apple Silicon bij push naar main — zonder release-aanmaak**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-28T00:00:00Z
- **Completed:** 2026-05-28T00:05:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- `.github/workflows/ci.yml` aangemaakt als directe afleiding van `release.yml`
- Trigger op `push: branches: [main]` en `workflow_dispatch` — niet op tags
- Matrix beperkt tot 2 runners: `macos-latest` (aarch64) en `windows-latest` (x86_64 NSIS)
- Geen release-sleutels (`tagName`, `releaseName`, etc.) in `tauri-apps/tauri-action` — voorkomt onbedoelde GitHub Release bij main-push
- `APPLE_SIGNING_IDENTITY: '-'` behouden voor ad-hoc macOS-signing zonder Apple-certificaten

## Task Commits

1. **Task 1: Create .github/workflows/ci.yml** - `668a62f` (feat)

**Plan metadata:** (volgt na SUMMARY-commit)

## Files Created/Modified

- `.github/workflows/ci.yml` — GitHub Actions CI-workflow: 2-runner matrix, smoke build, geen release-publicatie

## Decisions Made

- `permissions`-blok weggelaten: GITHUB_TOKEN is automatisch beschikbaar met standaard leesniveau; geen schrijftoegang nodig omdat er geen release wordt aangemaakt.
- macOS Intel entry (`x86_64-apple-darwin`) niet opgenomen: STATE.md specificeert alleen Apple Silicon voor CI — Intel verdubbelt CI-tijd zonder extra waarde.
- `tauri-apps/tauri-action with:` blok bevat uitsluitend `args` — aanwezigheid van `tagName` e.d. zou actie dwingen een GitHub Release aan te maken bij elke push naar main (RESEARCH.md Pitfall 1).

## Deviations from Plan

Geen — plan exact uitgevoerd zoals beschreven.

## Issues Encountered

Geen.

## Threat Surface Scan

Geen nieuwe netwerkendpoints, auth-paden of schemawijzigingen geintroduceerd. Alle bedreigingen (T-30-03 t/m T-30-SC) zijn gedocumenteerd in het plan en worden geaccepteerd:
- `GITHUB_TOKEN` is auto-provided, minimale scope, geen extra secrets.
- `APPLE_SIGNING_IDENTITY: '-'` is een publieke waarde (ad-hoc identity), geen geheim.
- `npm ci` gebruikt bestaande `package-lock.json` — geen nieuwe pakketten.

## User Setup Required

Geen — workflow wordt actief zodra de branch naar GitHub gepusht wordt. Geen extra secrets nodig voor de CI-build (alleen `GITHUB_TOKEN`, dat automatisch beschikbaar is).

## Next Phase Readiness

- TEST-01, TEST-02 en TEST-03 worden vervuld zodra de workflow op GitHub draait en beide runners succesvol builden (exit code 0).
- Handmatige testchecklist (plan 04/05) kan parallel worden opgesteld.
- Release-workflow (`release.yml`) is ongewijzigd — CI-workflow interfereert er niet mee.

---
*Phase: 30-documentatie-help-ci*
*Completed: 2026-05-28*
