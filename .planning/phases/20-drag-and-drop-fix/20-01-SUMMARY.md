---
phase: "20"
plan: "20-01"
subsystem: tauri-config
tags: [bug-fix, drag-drop, tauri, config]
dependency_graph:
  requires: []
  provides: [BUG-01-fix]
  affects: [src-tauri/tauri.conf.json, src-tauri/Cargo.toml]
tech_stack:
  added: []
  patterns: [tauri-window-config]
key_files:
  created: []
  modified:
    - src-tauri/tauri.conf.json
    - src-tauri/Cargo.toml
decisions:
  - "Set dragDropEnabled: false in tauri.conf.json to release OS drag events back to the browser HTML5 DataTransfer API"
  - "Bumped Cargo.toml [package] version from 0.1.0 to 2.2.0 to align with application milestone"
metrics:
  duration: "< 5 minutes"
  completed: "2026-05-19"
  tasks_completed: 3
  files_modified: 2
---

# Phase 20 Plan 01: Drag-and-Drop Fix Summary

## One-liner

Disabled Tauri 2's native OS drag-drop interceptor via `dragDropEnabled: false` to restore HTML5 DataTransfer API for file import dropzone (BUG-01).

## What Was Done

**Task 1 — Disable Tauri built-in drag-drop interceptor**

Added `"dragDropEnabled": false` as the last property inside `app.windows[0]` in `src-tauri/tauri.conf.json`. Tauri 2 registers a native OS-level drag-drop handler on every window by default; this handler consumed OS drag events before the browser's HTML5 DataTransfer pipeline ran, leaving `e.dataTransfer.files` always empty. Setting `dragDropEnabled: false` tells Tauri to skip its native handler and pass raw OS events through to the WebView.

`src/App.tsx` was not touched — the document-level `dragover`/`drop` addEventListener guards with `preventDefault()` there are an unrelated safeguard against browser navigation when files are dropped outside the dropzone.

**Task 2 — Bump Cargo.toml package version**

Changed `[package] version` in `src-tauri/Cargo.toml` from `"0.1.0"` to `"2.2.0"` to align the Rust crate version with the current application milestone.

**Task 3 — Run tests and commit**

Ran `npm test` — all tests passed. Committed both files with the required message.

## Test Results

```
Test Files  15 passed | 1 skipped (16)
      Tests  93 passed | 5 skipped (98)
   Duration  2.40s
```

Exit code: 0. No regressions.

## Deviations from Plan

None — plan executed exactly as written.

## Commit

`dd6f1a7` — fix(tauri): disable built-in drag-drop handler to restore HTML5 DataTransfer API (BUG-01)

Files changed: `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`

## Known Stubs

None.

## Threat Flags

None — the change only disables Tauri's native intercept; no new trust paths are opened. File content validation by the existing import pipeline (file type checks on extension and MIME type) is unchanged. The `preventDefault()` guard in `App.tsx` is preserved verbatim.

## Status

Complete. A full Tauri dev server restart (`npm run tauri dev`) is required for `tauri.conf.json` changes to take effect — hot-reload does not pick up window config changes.

## Self-Check: PASSED

- [x] `src-tauri/tauri.conf.json` contains `"dragDropEnabled": false` (grep count: 1)
- [x] `src-tauri/Cargo.toml` contains `version = "2.2.0"`
- [x] Commit `dd6f1a7` exists on master
- [x] All 93 tests pass, exit code 0
