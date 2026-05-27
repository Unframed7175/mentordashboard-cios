---
phase: 28-bug-feedback-rapportage
plan: "02"
subsystem: feedback-ui
tags: [feedback, modal, tauri, plugin-opener, tdd, import-instrumentation]
dependency_graph:
  requires: [utils/feedback.ts, "@tauri-apps/plugin-opener", "@tauri-apps/plugin-os"]
  provides: [src/components/FeedbackModal.tsx, KlasTabStrip-feedback-button, App-feedbackOpen-state, ImportPage-setLastImport]
  affects:
    - src/components/FeedbackModal.tsx
    - src/components/KlasTabStrip.tsx
    - src/App.tsx
    - src/components/ImportPage.tsx
    - src/index.css
    - tests/FeedbackModal.test.tsx
    - tests/KlasTabStrip.test.tsx
tech_stack:
  added: []
  patterns: [modal-overlay-pattern, async-error-boundary, TDD-RED-GREEN]
key_files:
  created:
    - src/components/FeedbackModal.tsx
    - tests/FeedbackModal.test.tsx
  modified:
    - src/components/KlasTabStrip.tsx
    - src/App.tsx
    - src/components/ImportPage.tsx
    - src/index.css
    - tests/KlasTabStrip.test.tsx
decisions:
  - "openUrl() used instead of open() — actual @tauri-apps/plugin-opener export name (Rule 1 auto-fix)"
  - "vi.hoisted() pattern required for TDZ-safe mock declarations in vitest"
  - "onFeedback prop added as required (not optional) to KlasTabStrip for type safety"
metrics:
  duration_minutes: 22
  completed_date: "2026-05-27"
  tasks_completed: 2
  files_created: 2
  files_modified: 5
  tests_added: 19
  tests_total: 194
---

# Phase 28 Plan 02: Feedback Modal UI Summary

**One-liner:** FeedbackModal with textarea, Verstuur (openUrl from plugin-opener), inline error on failure, 🐛 button in KlasTabStrip wired through App.tsx, setLastImport() in three ImportPage success paths.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| RED | Failing tests for FeedbackModal | 34fa0ee | tests/FeedbackModal.test.tsx |
| GREEN | Implement FeedbackModal.tsx | 53f2bc7 | src/components/FeedbackModal.tsx, tests/FeedbackModal.test.tsx (mock fix) |
| 2 | Wire button, state, imports | bbea56d | KlasTabStrip.tsx, App.tsx, ImportPage.tsx, index.css, KlasTabStrip.test.tsx, FeedbackModal.test.tsx |

## TDD Gate Compliance

- RED gate: commit `34fa0ee` — 17 failing tests, "Cannot find module ../src/components/FeedbackModal"
- GREEN gate: commit `53f2bc7` — 17/17 tests passing
- REFACTOR: not needed — implementation clean and tests stable

## What Was Built

**src/components/FeedbackModal.tsx** — New modal component:
- Props: `{ onClose: () => void }`
- Fixed overlay (same pattern as KlasModal: position fixed, inset 0, rgba(0,0,0,0.5), flex center, z-index 1000)
- Dialog: bg var(--bg-surface), borderRadius 12px, padding 1.5rem, maxWidth 400px
- State: `description` (string), `loading` (boolean), `errorMsg` (string)
- `handleVerstuur`: guard on loading → setLoading(true) → buildMailtoUrl(description.trim()) → openUrl(url) → onClose(); on catch: setLoading(false), setErrorMsg('E-mail kon niet worden geopend.'), modal stays open
- Escape key and outside-click both call onClose (handleOverlayKeyDown, handleOverlayClick)
- Verstuur button has `disabled={loading}` — prevents double-submit
- Textarea uses `className="feedback-modal-textarea"`

**src/components/KlasTabStrip.tsx** — Added:
- `onFeedback: () => void` to `KlasTabStripProps` interface and destructured props
- 🐛 button immediately left of ⚙ button: `className="nav-tab"`, `style={{ fontSize: '18px' }}`, `title="Fout melden"`, `aria-label="Fout melden"`, `onClick={onFeedback}`
- ⚙ button retains `marginLeft: 'auto'` for layout correctness

**src/App.tsx** — Added:
- `import FeedbackModal from './components/FeedbackModal'`
- `const [feedbackOpen, setFeedbackOpen] = useState(false)`
- `function handleFeedback() { setFeedbackOpen(true); }`
- `onFeedback={handleFeedback}` on KlasTabStrip
- `{feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}`

**src/components/ImportPage.tsx** — Added `setLastImport()` calls:
- PDF: `setLastImport({ filename: files[0].name, type: 'PDF' })` before `onImportComplete?.()` in `succeeded > 0` block
- Excel: `setLastImport({ filename: file.name, type: 'Excel' })` before `onImportComplete?.()` in mergeVerzuim success block
- Zip: `setLastImport({ filename: file.name, type: 'zip' })` before `onImportComplete?.()` in `result.success` block

**src/index.css** — Added `.feedback-modal-textarea` rule (section 22):
- `width: 100%; box-sizing: border-box; min-height: 80px; resize: vertical; padding: 0.5rem; border: 1px solid var(--border-color, #ccc); border-radius: 6px; font-size: 0.875rem; font-family: inherit`

**tests/FeedbackModal.test.tsx** — 17 tests (TDD):
- Render checks: heading, textarea, buttons, no initial error, Verstuur not disabled initially
- Annuleren calls onClose immediately
- Escape key and outside-click call onClose
- Verstuur success: buildMailtoUrl called with trimmed text, openUrl called, onClose called
- Verstuur disabled while loading
- Failure paths: inline error shown, onClose NOT called, textarea preserved, button re-enabled, buildMailtoUrl throw handled

**tests/KlasTabStrip.test.tsx** — Updated + 2 new tests:
- All existing renders updated with `onFeedback={vi.fn()}`
- `makeProps` factory updated with `onFeedback: vi.fn()`
- New: "renders a button with aria-label 'Fout melden'"
- New: "calls onFeedback when 🐛 button is clicked"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] openUrl() instead of open() — plugin-opener actual export**
- **Found during:** Task 1 (GREEN) — TypeScript compilation
- **Issue:** Plan specifies `import { open } from '@tauri-apps/plugin-opener'`, but the package exports `openUrl()` (and `openPath()`, `revealItemInDir()`). Using `open` would fail at runtime with "has no exported member 'open'".
- **Fix:** Changed import to `import { openUrl } from '@tauri-apps/plugin-opener'` and updated call site `await openUrl(url)`. Updated test mock to `{ openUrl: mockOpen }`.
- **Files modified:** src/components/FeedbackModal.tsx, tests/FeedbackModal.test.tsx
- **Commit:** bbea56d

**2. [Rule 2 - Missing critical] vi.hoisted() for TDZ-safe mock declaration**
- **Found during:** Task 1 (GREEN) — first test run after implementing FeedbackModal
- **Issue:** `const mockBuildMailtoUrl = vi.fn()` was declared after `vi.mock()` factory that referenced it. Vitest hoists `vi.mock()` calls to the top, causing "Cannot access 'mockBuildMailtoUrl' before initialization" TDZ error.
- **Fix:** Wrapped both mocks in `vi.hoisted()` call before `vi.mock()` factories.
- **Files modified:** tests/FeedbackModal.test.tsx
- **Commit:** 53f2bc7

**3. [Rule 2 - Missing critical] Updated KlasTabStrip.test.tsx for new required prop**
- **Found during:** Task 2 — TypeScript check after adding `onFeedback` to KlasTabStripProps
- **Issue:** All existing KlasTabStrip renders in tests were missing the new required `onFeedback` prop, causing TypeScript errors.
- **Fix:** Added `onFeedback={vi.fn()}` to all existing renders and updated `makeProps` factory.
- **Files modified:** tests/KlasTabStrip.test.tsx
- **Commit:** bbea56d

## Known Stubs

None — all data flows are fully wired. FeedbackModal calls the real `buildMailtoUrl` from Plan 28-01 which assembles a complete mailto: URL with system info, error buffer, and last import context.

## Threat Flags

No new threat surface beyond the plan's threat model:
- T-28-04: buildMailtoUrl applies encodeURIComponent to user-typed description — mitigated in Plan 28-01
- T-28-05: file.name in setLastImport — accepted (user controls what they send via OS email client)
- T-28-06: openUrl() sandboxed to mailto: protocol via capabilities/default.json — accepted

## Self-Check: PASSED

- src/components/FeedbackModal.tsx: EXISTS
- tests/FeedbackModal.test.tsx: EXISTS
- src/components/KlasTabStrip.tsx: onFeedback prop present
- src/App.tsx: feedbackOpen + FeedbackModal rendered
- src/components/ImportPage.tsx: setLastImport in 3 success paths
- src/index.css: .feedback-modal-textarea present
- Commits 34fa0ee, 53f2bc7, bbea56d: all present
- npx vitest run: 194 passed, 5 skipped (0 failures)
- npm run build: succeeds (full Tauri + Vite build, MSI + NSIS bundles generated)
