---
phase: 26-tegel-score-telling-fase-vergelijking
plan: 01
subsystem: ui
tags: [react, css, leerlingtegel, score-telling, trend-pijl]

# Dependency graph
requires:
  - phase: 14-react-ui
    provides: LeerlingTegel.tsx base component with miniBar null-node pattern
  - phase: 19-ui-polish
    provides: CSS custom property tokens (--rag-groen, --rag-rood, --text-muted)
provides:
  - LeerlingTegel.tsx with trend prop and score-telling row rendering
  - CSS classes .score-telling, .trend-pijl, .trend-op, .trend-neer in src/index.css
affects: [26-02, KlasOverzicht, LeerlingTegel consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Null-node variable pattern: let x: React.ReactNode = null; if (guard) { x = <JSX />; } — mirrors miniBar"
    - "CSS border-trick triangles: width:0, height:0, border-* solid transparent + one colored border"
    - "aria-label on wrapper div + aria-hidden on decorative arrow spans"

key-files:
  created: []
  modified:
    - src/components/LeerlingTegel.tsx
    - src/index.css

key-decisions:
  - "Null-node variable style (not IIFE) chosen for scoreTelling to match existing miniBar pattern"
  - "CSS border-trick chosen for trend arrows per CONTEXT.md D-04 — no SVG or Unicode arrow"
  - "Pre-existing TypeScript errors in App.tsx/SettingsPage.tsx/spider.tsx are out of scope (not caused by this plan)"

patterns-established:
  - "score-telling row: flex display, 12px/400 weight, var(--text-muted) color, padding-left 0.375rem to align with tile name"
  - "trend arrow: 8x5px CSS border triangle — 4px sides, 5px height matches 12px Industry text visual weight"

requirements-completed: [TEGEL-01, TEGEL-02]

# Metrics
duration: 10min
completed: 2026-05-23
---

# Phase 26 Plan 01: Score-telling & Trend-pijl CSS + LeerlingTegel Prop Extension Summary

**LeerlingTegel extended with score-telling row ('{v}/{total} >=V · {o} O') below the status badge, hidden when grijs, plus four new CSS classes for the trend arrow border-trick**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-23T14:40:31Z
- **Completed:** 2026-05-23T14:42:20Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added four CSS classes to src/index.css: `.score-telling` (flex wrapper row), `.trend-pijl` (base CSS border-trick), `.trend-op` (green upward triangle), `.trend-neer` (red downward triangle)
- Extended `LeerlingTegelProps` with `trend?: 'op' | 'neer' | null` optional prop
- Implemented scoreTelling null-node block mirroring the existing miniBar pattern — only renders when `status.kleur !== 'grijs'`
- Score text format exact: `{v}/{total} >=V · {o} O` using U+2265 and U+00B7 interpunct, uppercase O
- Dynamic aria-label adapts to trend op/neer/none state; arrow spans are `aria-hidden="true"`
- All 150 tests pass (5 pre-existing skips unchanged)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CSS classes for score-telling row and trend arrows** - `14d9aae` (feat)
2. **Task 2: Extend LeerlingTegel with trend prop and score-telling render** - `c09ea20` (feat)

## Files Created/Modified

- `src/index.css` - Added 32 lines: .score-telling, .trend-pijl, .trend-op, .trend-neer CSS classes after .mvb-* block
- `src/components/LeerlingTegel.tsx` - Added trend prop to interface + destructuring; added scoreTelling null-node render block; inserted {scoreTelling} between badge and {miniBar} in JSX

## Decisions Made

- Used null-node variable style (`let scoreTelling: React.ReactNode = null`) instead of IIFE pattern, per plan requirement to match existing miniBar code style
- CSS custom properties (`var(--rag-groen)`, `var(--rag-rood)`, `var(--text-muted)`) used for all color references — no hardcoded hex values
- `padding-left: 0.375rem` on `.score-telling` inherited from pre-existing `.klas-tile-naam` value (not a new design contract value)

## Deviations from Plan

None — plan executed exactly as written.

Pre-existing TypeScript errors in `src/App.tsx`, `src/components/SettingsPage.tsx`, `tests/spider.test.ts`, and `utils/spider.tsx` were observed during `npx tsc --noEmit` but are out of scope (not caused by this plan). No errors in the files modified by this plan.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 01 complete: LeerlingTegel now accepts `trend` prop and renders score-telling row
- Plan 02 (KlasOverzicht trendMap) can now wire `trendMap.get(s.leerlingId) ?? null` to each `LeerlingTegel` render
- `getAllRecordsForStudent` and `STATUS_VOLGORDE` are ready in their utilities — no changes needed there
- Visual verification in browser recommended to confirm CSS border-trick triangle aligns correctly with 12px Industry text

---
*Phase: 26-tegel-score-telling-fase-vergelijking*
*Completed: 2026-05-23*
