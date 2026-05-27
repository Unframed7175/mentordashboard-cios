---
phase: 28-bug-feedback-rapportage
plan: "01"
subsystem: feedback
tags: [tdd, feedback, tauri, ring-buffer, mailto]
dependency_graph:
  requires: []
  provides: [utils/feedback.ts, tests/feedbackUtils.test.ts, main.tsx-patched]
  affects: [src/main.tsx, utils/feedback.ts, tests/feedbackUtils.test.ts]
tech_stack:
  added: ["@tauri-apps/plugin-os", "@tauri-apps/plugin-opener", "tauri-plugin-os = 2"]
  patterns: [ring-buffer, module-level-state, TDD-RED-GREEN, HMR-guard]
key_files:
  created:
    - utils/feedback.ts
    - tests/feedbackUtils.test.ts
  modified:
    - package.json
    - package-lock.json
    - src-tauri/Cargo.toml
    - src-tauri/capabilities/default.json
    - src/main.tsx
decisions:
  - "Ring buffer eviction uses shift() — FIFO, O(1) prepend via push/shift"
  - "Timestamp uses toLocaleTimeString('nl-NL') for Dutch HH:MM:SS format"
  - "Body budget: first try full buffer, then 5 entries x 100 chars, then hard truncate at 1497 + marker"
  - "HMR guard uses __gsd_patched flag on console.error to prevent double-wrap in dev mode"
  - "window.addEventListener('error') preferred over window.onerror to avoid clobbering existing handlers"
  - "window.addEventListener('unhandledrejection') captures async failures that window.onerror misses"
  - "Test fix: zero-padded entry names (entry-01..12) prevent substring collision in ring buffer cap test"
metrics:
  duration_minutes: 8
  completed_date: "2026-05-27"
  tasks_completed: 4
  files_created: 2
  files_modified: 5
  tests_added: 17
  tests_total: 175
---

# Phase 28 Plan 01: Feedback Utils Foundation Summary

**One-liner:** Ring buffer error capture + mailto: URL builder with TDD (17 tests), Tauri plugin deps installed, main.tsx patched with HMR-guarded console.error + unhandledrejection listeners before React mounts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 | Install missing Tauri dependencies | 552f78f | package.json, package-lock.json, src-tauri/Cargo.toml, src-tauri/capabilities/default.json |
| 1 | RED: Write failing tests | 4530f98 | tests/feedbackUtils.test.ts |
| 2 | GREEN: Implement utils/feedback.ts | beaaecf | utils/feedback.ts, tests/feedbackUtils.test.ts (fix) |
| 3 | Patch console.error + listeners in main.tsx | 9e5aa93 | src/main.tsx |

## TDD Gate Compliance

- RED gate: `test(28-01)` commit `4530f98` — 17 tests failing with "Cannot find module '../utils/feedback'"
- GREEN gate: `feat(28-01)` commit `beaaecf` — 17/17 tests passing
- REFACTOR: not needed — implementation is clean

## What Was Built

**utils/feedback.ts** — Pure TypeScript module (no React):
- `pushConsoleError(args: unknown[])` — serializes multi-arg calls (Error.stack, JSON.stringify objects, string join), truncates to 200 chars, prepends HH:MM:SS timestamp, pushes to ring buffer (max 10, FIFO eviction)
- `setLastImport(info)` — stores last import with ISO timestamp
- `getSystemInfo()` — fetches platform, osVersion, appVersion from Tauri APIs
- `initSystemInfo()` — pre-caches system info at startup
- `buildMailtoUrl(description)` — assembles mailto: with encodeURIComponent on both subject and body; enforces 1500-char body budget with `[ingekort wegens e-mail limiet]` truncation marker
- `resetFeedbackState()` — clears all state (tests only)
- `DEVELOPER_EMAIL = 'ralvarezstam@cioszuidwest.nl'`

**tests/feedbackUtils.test.ts** — 17 tests covering all behaviors:
- mailto: URL structure (recipient, subject encoding, body sections)
- Ring buffer cap at 10, timestamp prefix, per-entry 200-char truncation
- Multi-arg serialization (Error.stack, JSON objects, joined args)
- Body truncation at 1500 chars with marker
- setLastImport integration, empty buffer/import fallbacks

**src/main.tsx** — Patched with:
- `import { pushConsoleError, initSystemInfo } from '../utils/feedback'`
- HMR-guarded `console.error` patch (`__gsd_patched` flag)
- `window.addEventListener('error', ...)` for uncaught exceptions
- `window.addEventListener('unhandledrejection', ...)` for async failures
- `await initSystemInfo().catch(...)` as first statement in async IIFE

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ring buffer test — zero-padded entry names**
- **Found during:** Task 2 (GREEN) — first test run
- **Issue:** `entry-1` is a substring of `entry-10`, `entry-11`, `entry-12`. Test `expect(body).not.toContain('entry-1')` was failing because the body legitimately contained `entry-10`..`entry-12`.
- **Fix:** Changed push loop to zero-pad: `entry-${String(i).padStart(2, '0')}` so `entry-01` and `entry-02` are unique substrings not shared with any higher-numbered entries.
- **Files modified:** tests/feedbackUtils.test.ts
- **Commit:** beaaecf

## Known Stubs

None — all exported functions are fully implemented and tested. No hardcoded empty values flow to UI rendering (Plan 28-02 FeedbackModal is a separate plan).

## Threat Flags

No new threat surface beyond what the plan's threat model covers:
- T-28-01 (Tampering via body injection): mitigated — encodeURIComponent applied to both subject and body
- T-28-02 (Information disclosure via ring buffer): accepted — process-local, never written to disk
- T-28-03 (DoS via mailto: length): mitigated — 1500-char body budget enforced and tested

## Self-Check: PASSED

- utils/feedback.ts: EXISTS
- tests/feedbackUtils.test.ts: EXISTS
- src/main.tsx: EXISTS and patched
- Commits 552f78f, 4530f98, beaaecf, 9e5aa93: all present in git log
- npx vitest run: 175 passed, 5 skipped (0 failures)
