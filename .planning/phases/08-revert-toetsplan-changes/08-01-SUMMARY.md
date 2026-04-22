---
phase: 08-revert-toetsplan-changes
plan: 01
subsystem: ui
tags: [javascript, html, css, cleanup, revert]

# Dependency graph
requires:
  - phase: 07-periode-vergelijking
    provides: Two-row tfoot with growthBadge that must remain intact after revert
provides:
  - app.js with all 12 Phase 11 toetsplan commits removed (clean post-Phase-7 state)
  - index.html with toetsplan import section and CSS deleted
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - app.js
    - index.html

key-decisions:
  - "D-01/D-02: All 12 Phase 11 commits reverted manually (git revert unsafe due to interleaved Phase 10-13 commits)"
  - "D-03: toetsplan import UI fully removed — no toetsplan-zone, no handleToetsplanImport, no renderToetsplanZone"
  - "D-04: D2 table datapunten now render in original PDF order (no deadline sorting)"
  - "D-05: Deadline column removed from D2 table header and all tfoot rows"

patterns-established: []

requirements-completed: [D-01, D-02, D-03, D-04, D-05]

# Metrics
duration: 30min
completed: 2026-04-22
---

# Phase 08 Plan 01: Revert Toetsplan Changes Summary

**Surgical deletion of all 12 Phase 11 toetsplan commits from app.js and index.html, restoring the post-Phase-7 clean state with PDF-order D2 rendering and no deadline column**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-22T08:50:00Z
- **Completed:** 2026-04-22T09:20:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Removed 714 lines of Phase 11 toetsplan code from app.js (merge logic, deadline sorting, debug helpers, import wiring)
- Removed toetsplan import section from index.html (13 lines HTML + 17 lines CSS)
- D2 table now renders datapunten in original PDF order with no Deadline column
- Phase 7 two-row tfoot with growthBadge fully intact
- Phase 13 mentor actiepunten CRUD panel intact (toetsplan-driven "Feedback per deelgebied" sub-section removed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove all Phase 11 code from app.js** - `079c27d` (feat)
2. **Task 2: Remove toetsplan import UI from index.html and clean up CSS** - `9c39e37` (feat)

## Files Created/Modified
- `app.js` - Removed renderToetsplanZone, handleToetsplanImport, normDatapunt, findPDFScoresForDatapunt, debugMerge, getActiveToetsplan, detectJaarPrefix, filterFasesForStudent, buildDetailTijdlijn, buildDetailDeelgebiedenTijdlijn, tokenSet, tokenSubsetMatch, findStudentDp; replaced Phase 11 D2 merge block with PDF-order rendering; removed Deadline column; simplified buildDetailFeedback to actiepunten-only
- `index.html` - Removed #toetsplan-import-section div; removed .toetsplan-badge, .toetsplan-status, .toetsplan-status-success, .toetsplan-status-error CSS rules

## Decisions Made
- Manual surgical deletion chosen over `git revert` — interleaved Phase 10-13 commits made cherry-picked reverts unsafe
- `getActiveKlas()` preserved — it is used by stage import and other non-toetsplan code
- `klas.toetsplan` property may still exist in localStorage objects; code simply ignores it (graceful fallback)
- "Feedback per deelgebied" sub-section removed from buildDetailFeedback since it required toetsplan data; "Mentor actiepunten" sub-section retained intact

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Known Stubs

None — no stub patterns introduced. All removed code had no data flowing to UI rendering after deletion.

## Threat Flags

None — deletion phase only; no new network endpoints, auth paths, or trust boundary changes introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- app.js and index.html are in the clean post-Phase-7 state
- All automated grep checks pass: zero Phase 11 functions remain
- Phase 7 two-row tfoot with growth badges verified present
- Phase 13 actiepunten CRUD verified present
- Ready for browser verification (Import tab has no toetsplan section; D2 table has no Deadline column)

## Self-Check: PASSED

- app.js: FOUND, all Phase 11 items removed, Phase 7+13 items intact
- index.html: FOUND, all toetsplan items removed, stage/backup sections intact
- Commit 079c27d: FOUND
- Commit 9c39e37: FOUND

---
*Phase: 08-revert-toetsplan-changes*
*Completed: 2026-04-22*
