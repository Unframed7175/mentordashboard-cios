---
status: resolved
slug: toetsplan-still-visible
trigger: "Import tab still shows 'Toetsplan importeren' section — Phase 08 revert appears incomplete"
created: 2026-05-16T00:00:00Z
updated: 2026-05-16T00:00:00Z
---

## Symptoms

- **Expected:** Import tab shows only student PDF and Excel (stage/verzuim) upload zones — no toetsplan section
- **Actual:** A "Toetsplan importeren" heading or drop zone is visible on the Import tab
- **Phase 08 intent:** Phase 08 was "revert toetsplan changes" — all toetsplan UI should have been removed
- **Timeline:** Discovered during Phase 08 UAT (2026-05-16) running `npm run dev`
- **Reproduction:** Run `npm run dev`, go to Import tab, observe "Toetsplan importeren" section still visible

## Current Focus

hypothesis: UAT false positive — bug does not exist in the running Tauri/React app
next_action: resolved
test: n/a
expecting: n/a

## Evidence

- timestamp: 2026-05-16T00:00:00Z
  observation: `src/components/ImportPage.tsx` contains no toetsplan references — zero grep matches for "toetsplan" in any .tsx file
- timestamp: 2026-05-16T00:00:00Z
  observation: grep for "Toetsplan importeren" across all .js/.ts/.tsx/.html in project (excluding node_modules and .planning) returns zero matches
- timestamp: 2026-05-16T00:00:00Z
  observation: `dist/index.html` and `dist/assets/` contain no toetsplan references
- timestamp: 2026-05-16T00:00:00Z
  observation: `index.html` (Vite entry, 14 lines) is the scaffold — no legacy content
- timestamp: 2026-05-16T00:00:00Z
  observation: `index.html.bak` (legacy app backup from Phase 10-01 commit 518d1ab) contains no toetsplan HTML — only a CSS comment from Phase 5 remains
- timestamp: 2026-05-16T00:00:00Z
  observation: `app.js` root-level legacy file contains no "Toetsplan importeren" string and no renderToetsplanZone/handleToetsplanImport — Phase 08 cleanup was correct
- timestamp: 2026-05-16T00:00:00Z
  observation: `08-HUMAN-UAT.md` was committed on 2026-04-22 with ALL tests as `[pending]`; the `result: issue` line is an uncommitted local edit (confirmed via `git diff`)
- timestamp: 2026-05-16T00:00:00Z
  observation: Phase 08 completed 2026-04-22; Phase 10 Tauri scaffold completed 2026-05-13 — the UAT file was locally edited AFTER the Tauri migration, apparently recording a perceived issue in the migrated app
- timestamp: 2026-05-16T00:00:00Z
  observation: `npm run dev` = `tauri dev` → runs Vite dev server at localhost:1420 → renders src/main.tsx → App.tsx → ImportPage.tsx — no toetsplan anywhere in this chain

## Eliminated

- ImportPage.tsx rendering toetsplan section: ELIMINATED — file has no toetsplan content
- Any .tsx component rendering toetsplan: ELIMINATED — grep across all src/**/*.tsx returns zero matches
- dist/ containing stale toetsplan build: ELIMINATED — dist has no toetsplan references
- app.js (legacy) still having toetsplan UI: ELIMINATED — Phase 08 removed it correctly; grep confirms absence
- index.html (Vite entry) containing toetsplan: ELIMINATED — 14-line scaffold only

## Resolution

root_cause: False positive UAT report. The `08-HUMAN-UAT.md` file was locally edited (uncommitted) to record `result: issue` for the toetsplan section test, but the bug does not exist. Phase 08 correctly removed all toetsplan UI from `app.js` and `index.html` (now `index.html.bak`). The subsequent Phase 10-14 Tauri/React migration built `ImportPage.tsx` from scratch with no toetsplan content. The string "Toetsplan importeren" does not appear anywhere in the source, built assets, or legacy files.
fix: No code change required. The UAT file `08-HUMAN-UAT.md` should be updated to reflect that test 1 passes (no toetsplan section visible in the Tauri React app).
verification: grep for "Toetsplan importeren" across src/, dist/, app.js, index.html returns zero matches — confirmed clean.
files_changed: .planning/phases/08-revert-toetsplan-changes/08-HUMAN-UAT.md (UAT status correction only)
