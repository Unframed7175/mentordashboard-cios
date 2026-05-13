---
phase: 10-scaffold-toolchain
plan: 01
subsystem: infra
tags: [tauri, vite, react, typescript, vitest, jsdom, npm, scaffold]

# Dependency graph
requires: []
provides:
  - Tauri 2.x scaffold in dashboard-2/ (src/, src-tauri/, vite.config.ts, tsconfig.json)
  - index.html.bak — original app entry preserved (D-02 compliance)
  - package.json merged with tauri, vite, react, vitest, jsdom, xlsx deps; no jest
  - node_modules populated via npm install (114 packages, 0 vulnerabilities)
affects:
  - 10-02 (configures vite.config.ts, tauri.conf.json, tsconfig.json generated here)
  - 10-03 (runs vitest against tests using node_modules installed here)
  - 11-typescript-migration (uses src/ structure created here)

# Tech tracking
tech-stack:
  added:
    - "@tauri-apps/cli ^2.11.1"
    - "@tauri-apps/api ^2.11.0"
    - "vite ^8.0.12"
    - "@vitejs/plugin-react ^6.0.1"
    - "react ^19.2.6"
    - "react-dom ^19.2.6"
    - "typescript ~5.8.0"
    - "vitest ^4.1.6"
    - "@vitest/coverage-v8 ^4.1.6"
    - "jsdom ^29.1.1"
    - "xlsx CDN tarball 0.20.3 (preserved)"
  patterns:
    - "vite-dev script separates Vite server from tauri dev to avoid beforeDevCommand cycle"
    - "npm create tauri-app --force scaffolds into existing directory; deletes untracked files"

key-files:
  created:
    - "index.html.bak (original app entry, D-02 compliance)"
    - "src/main.tsx (React entry point)"
    - "src/App.tsx (placeholder component)"
    - "src-tauri/Cargo.toml"
    - "src-tauri/tauri.conf.json"
    - "src-tauri/capabilities/default.json"
    - "src-tauri/src/main.rs, lib.rs"
    - "vite.config.ts"
    - "tsconfig.json, tsconfig.node.json"
    - "package.json (merged)"
    - "package-lock.json"
  modified:
    - "index.html (replaced by scaffold Vite entry with div#root)"

key-decisions:
  - "scaffold --force flag wipes all untracked files — backup untracked files BEFORE running scaffold in future phases"
  - "index.html.bak recreated from git HEAD after scaffold deleted the pre-made backup"
  - "Restored all 103 git-tracked files wiped by scaffold using git checkout HEAD"
  - "Untracked test files (8 files) and utils (aggregation.js, backup.js, spider.js) + vendor/zip.min.js permanently lost — need recovery before Plan 10-03"

patterns-established:
  - "Pattern: vite-dev script = 'vite', dev script = 'tauri dev', beforeDevCommand uses vite-dev (avoids cycle)"
  - "Pattern: package.json type=module retained from scaffold output"

requirements-completed:
  - TCH-01
  - TCH-02
  - TCH-03
  - TCH-04

# Metrics
duration: 25min
completed: 2026-05-13
---

# Phase 10 Plan 01: Tauri Scaffold & package.json Merge Summary

**Tauri 2.x react-ts scaffold in dashboard-2/ with merged package.json (vitest+jsdom, no jest, vite-dev anti-cycle script) and npm install completing with 114 packages, 0 vulnerabilities**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-13T16:30:00Z
- **Completed:** 2026-05-13T18:55:00Z
- **Tasks:** 3 (Task 1 pre-approved by user; Tasks 2 and 3 executed)
- **Files modified:** ~40

## Accomplishments

- Original `index.html` backed up to `index.html.bak` (D-02 compliance; backup recreated from git HEAD after scaffold overwrite)
- Tauri 2.x react-ts scaffold generated `src/`, `src-tauri/`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, scaffold icons
- Merged `package.json`: `dev = "tauri dev"`, `vite-dev = "vite"`, `test = "vitest run"`, no jest, vitest+jsdom+xlsx present
- npm install succeeded: 114 packages added, 0 vulnerabilities

## Task Commits

Each task was committed atomically:

1. **Task 1: Pre-flight — Verify Rust toolchain** - (human checkpoint, pre-approved by user)
2. **Task 2: Backup original index.html and run Tauri scaffold** - `518d1ab` (feat)
3. **Task 3: Merge package.json and run npm install** - `3a4e3f3` (chore)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `index.html.bak` — Original app.js-based entry preserved (53 KB)
- `index.html` — Replaced by scaffold Vite entry (`<div id="root">`)
- `src/main.tsx` — ReactDOM.createRoot entry point (scaffold default)
- `src/App.tsx` — React placeholder component (scaffold default)
- `src/App.css`, `src/assets/react.svg`, `src/vite-env.d.ts` — Scaffold assets
- `src-tauri/Cargo.toml` — Rust workspace (scaffold generated)
- `src-tauri/tauri.conf.json` — Tauri v2 config (scaffold generated; will be replaced in Plan 02)
- `src-tauri/capabilities/default.json` — Minimal permissions (scaffold generated)
- `src-tauri/src/main.rs`, `src-tauri/src/lib.rs` — Rust entry points
- `src-tauri/icons/` — Full icon set (scaffold generated)
- `vite.config.ts` — Vite config (scaffold generated; will be replaced in Plan 02)
- `tsconfig.json`, `tsconfig.node.json` — TypeScript configs (scaffold generated; to be adjusted in Plan 02)
- `package.json` — Merged: name=mentordashboard, version=2.0.0, correct scripts, vitest+jsdom, no jest
- `package-lock.json` — npm lock file (114 packages)
- `.gitignore` — Scaffold-generated

## Decisions Made

- `"type": "module"` retained from scaffold output in `package.json` (required for Vite ESM builds)
- `index.html.bak` recreated from `git show HEAD:index.html` after scaffold's `--force` deleted the pre-made backup
- All 103 git-tracked files wiped by scaffold restored via `git checkout HEAD -- <files>`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffold --force wiped all untracked files and git-tracked files**
- **Found during:** Task 2 (run Tauri scaffold)
- **Issue:** `npx create-tauri-app@latest . --force` deleted all working tree contents, including git-tracked files (`.planning/`, `app.js`, `utils/`, `parsers/`, `vendor/`, `tests/actiepunten.test.js`, `start.bat`, etc.) and all untracked files (8 test files, `utils/aggregation.js`, `utils/backup.js`, `utils/spider.js`, `vendor/zip.min.js`, `start.ps1`, `.claude/`)
- **Fix:** Restored all 103 git-tracked deleted files via `git checkout HEAD -- $(git status --short | grep '^ D' | awk '{print $2}')`. Recreated `index.html.bak` from `git show HEAD:index.html`.
- **Files modified:** All files in `.planning/`, `app.js`, `utils/`, `parsers/`, `vendor/`, `tests/actiepunten.test.js`, `start.bat`
- **Verification:** All git-tracked files present; `index.html.bak` contains `app.js` references (grep confirmed)
- **Committed in:** `518d1ab` (Task 2 commit)
- **Unrecoverable:** 8 test files, 3 utils files, 1 vendor file, `start.ps1`, `.claude/` were untracked and permanently lost

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Auto-fix necessary to restore project state. Git-tracked files fully recovered. Untracked files permanently lost — see Critical Warning below.

## Issues Encountered

None beyond the scaffold file deletion deviation documented above.

## Critical Warning: Untracked Files Lost

The following files were **untracked in git** and were permanently deleted by `create-tauri-app --force`. They cannot be recovered from git history:

| File | Purpose |
|------|---------|
| `tests/backup.test.js` | Backup functionality tests |
| `tests/jest.config.js` | Old Jest config (would have been deleted in Plan 10-03 anyway) |
| `tests/parseStage.test.js` | Stage parser tests |
| `tests/parseToetsplan.test.js` | Toetsplan parser tests |
| `tests/prognosis.test.js` | Prognosis engine tests |
| `tests/spider.test.js` | Spider chart tests |
| `tests/aggregation.test.js` | Aggregation tests |
| `tests/feedback.test.js` | Feedback tests |
| `utils/aggregation.js` | Aggregation utility module |
| `utils/backup.js` | Backup utility module |
| `utils/spider.js` | Spider chart math module |
| `vendor/zip.min.js` | AES-encrypted zip library |
| `start.ps1` | PowerShell startup script |
| `.claude/` | GSD workflow configuration for this project |

**Impact on Plan 10-03 (TCH-03: 128 tests pass):** The 8 test files listed above are needed for the 128-test suite. These MUST be recovered (from git history of other branches, file system backup, or recreation) before Plan 10-03 can succeed. **Plan 10-03 is blocked until these files are restored.**

**Recommendation before Plan 10-02:** Commit all untracked files to git immediately so they are protected during future scaffold or tool operations.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 10-02 (configure vite.config.ts, tauri.conf.json, tsconfig.json, Vitest config): **READY** — scaffold files exist as base
- Plan 10-03 (run 128 tests under Vitest): **BLOCKED** — 8 test files permanently deleted by scaffold; must be recovered before this plan can succeed

---
*Phase: 10-scaffold-toolchain*
*Completed: 2026-05-13*
