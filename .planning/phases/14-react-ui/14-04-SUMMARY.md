---
phase: 14-react-ui
plan: "04"
subsystem: detail-weergave
tags: [react, typescript, DetailWeergave, DoortstroomPrognoseSection, VerzuimSection, VakkenSection, wave-2]
dependency_graph:
  requires:
    - src/utils/status.ts (berekenStatus, detectTraject, StatusResult — Wave 0)
    - utils/klassen.ts (getAllRecordsForStudent — Wave 0)
    - utils/prognosis.ts (berekenPrognose return shape for gap item computation)
    - src/App.tsx (view routing state, handleBack, setActiveStudentId — Wave 1)
  provides:
    - src/components/DetailWeergave.tsx: wrapper; reads most-recent student record; header nav + 10 sections
    - src/components/DoortstroomPrognoseSection.tsx: status badge, traject tag, score summary, gap items list
    - src/components/VerzuimSection.tsx: 44px stacked bar with legend; empty state
    - src/components/VakkenSection.tsx: per-vak accordion with open/closed toggle
    - src/App.tsx: DetailWeergave wired in view==='detail' slot
  affects:
    - Wave 2 Plan 05: FeedbackActiepuntenSection, SpiderChartCard, DeelgebiedenMatrix, NotitiesTextarea slot into stubs in DetailWeergave
tech_stack:
  added: []
  patterns:
    - Singleton read on render (getAllRecordsForStudent — no useEffect for data)
    - Verzuim inheritance pattern (Object.assign spread from other record when most-recent lacks verzuim)
    - Gap item computation from prognose.gaps (mirrors app.js buildDetailPrognose logic)
    - useState Set<string> for per-vak accordion toggle
    - prevId/nextId computed inline from detailStudentList.indexOf
key_files:
  created:
    - src/components/DetailWeergave.tsx
    - src/components/DoortstroomPrognoseSection.tsx
    - src/components/VerzuimSection.tsx
    - src/components/VakkenSection.tsx
  modified:
    - src/App.tsx
decisions:
  - DoortstroomPrognoseSection computes gap items inline from p.gaps (berekenPrognose has no gapItems field — gap logic is in app.js buildDetailPrognose)
  - VerzuimSection: minNaarUren() helper implemented inline (0h/0m/Xh Ym format)
  - VakkenSection: uses useState(Set<string>) for independent per-vak open state
  - DetailWeergave: sections 2/3/5 stub with "Komt in Plan 05"; sections 4/6/7/10 stub with "Beschikbaar na Plan 05"
  - App.tsx prevId/nextId: detailStudentList[-1] returns undefined which ?? null coerces to null correctly
metrics:
  duration: "2m 32s"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 14 Plan 04: DetailWeergave + Section Components Summary

**One-liner:** DetailWeergave wrapper with header navigation (prev/next/back), DoortstroomPrognoseSection (gap items computed from p.gaps), VerzuimSection (44px stacked bar + legend), and VakkenSection (per-vak accordion), all wired into App.tsx at view==='detail'.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create DoortstroomPrognoseSection, VerzuimSection, VakkenSection | 6627ace | src/components/DoortstroomPrognoseSection.tsx (created), src/components/VerzuimSection.tsx (created), src/components/VakkenSection.tsx (created) |
| 2 | Create DetailWeergave.tsx and wire into App.tsx | cfff1a8 | src/components/DetailWeergave.tsx (created), src/App.tsx (modified) |

## What Was Built

### src/components/DoortstroomPrognoseSection.tsx

Pure presentational component receiving `{ student: any, status: StatusResult }`:

- Uses `status.prognose` (pre-computed) — does NOT call `berekenPrognose` again
- Calls `detectTraject(student)` to determine BJ1/BJ2 traject label
- `computeGapItems(p)` mirrors `buildDetailPrognose` in app.js (lines 1598-1645)
- Gap items derive from `p.isNegatief`, `p.gaps.onvoldoendeRuimte`, `p.gaps.onvoldoendeRuimtePerLeerlijn`, and traject-specific gaps
- Each gap item has `className={gap-item gap-${item.type}}` (danger/warn/ok/info)

### src/components/VerzuimSection.tsx

Pure presentational component with `{ student: any }`:

- Empty state copy when `!student.verzuim` — exact Dutch copy from 14-UI-SPEC
- Stacked bar: `height:44px`, three divs with background colors `#22c55e` / `#f97316` / `#ef4444`
- Segment text label (N%) rendered only when `N >= 8`
- `minNaarUren(min)` helper: format `Xh Ym` (or `Xh` / `Ym` when either is 0)
- Legend: colored dot + label + time in minNaarUren format + percentage
- Ongeoorloofd time: `color:#991b1b; fontWeight:700` when `v.ongeoorloofd > 600`

### src/components/VakkenSection.tsx

Stateful component with `{ student: any }`:

- `useState<Set<string>>(new Set())` for per-vak open state
- Empty state when `!student.vakken || student.vakken.length === 0`
- Each vak: `div.vak-card` (+ class `open` when in openVakken Set)
- `div.vak-header`: click toggles vak in Set; `span.vak-chevron` rotates 180deg via inline style when open
- When open: renders `div.vak-body` with opdrachten list (naam + status + feedForward)

### src/components/DetailWeergave.tsx

Wrapper component with `{ leerlingId, prevId, nextId, onNavigate, onBack }`:

- `getAllRecordsForStudent(leerlingId)` — oldest-first; uses `records[records.length - 1]` as most-recent
- Verzuim inheritance: iterates from `records.length - 2` downward to find any record with verzuim (app.js lines 1517-1521 pattern)
- `berekenStatus(student)` called once; passed to DoortstroomPrognoseSection
- Header: "← Terug" (onClick=onBack), student naam, periode·leerjaar meta, "‹ Vorige" / "Volgende ›"
- Prev/Next disabled when null; opacity 0.38 (disabled state per UI-SPEC)
- 10 sections in render order per 14-UI-SPEC §Sections — Render Order; stubs hold positions for Plan 05

### src/App.tsx

Replaced Wave 1 placeholder:

- Added `import DetailWeergave from './components/DetailWeergave'`
- Replaced `{view === 'detail' && <div>{/* ... */}</div>}` with full `DetailWeergave` render
- `prevId`: `detailStudentList[detailStudentList.indexOf(activeStudentId) - 1] ?? null`
- `nextId`: `detailStudentList[detailStudentList.indexOf(activeStudentId) + 1] ?? null`

## Verification Results

- `npm test`: **43 passing**, 5 skipped, 0 failures
- `npx tsc --noEmit`: **0 errors**
- DetailWeergave wired at view==='detail' with correct prevId/nextId logic
- DoortstroomPrognoseSection does NOT import or call berekenPrognose

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] berekenPrognose has no gapItems field — computed inline from p.gaps**
- **Found during:** Task 1 (reading utils/prognosis.ts return shape)
- **Issue:** Plan's interface block described `gapItems?: Array<{...}>` on the berekenPrognose return, but the actual return only has `label, isNegatief, totaalVoldoendeOfHoger, totaalOnvoldoende, leerlijnen, gaps, traject`. Gap items are computed in app.js `buildDetailPrognose()` from the `gaps` object.
- **Fix:** Created `computeGapItems(p)` function in DoortstroomPrognoseSection.tsx that mirrors app.js lines 1598-1645 logic directly from `p.gaps` and `p.traject`
- **Files modified:** src/components/DoortstroomPrognoseSection.tsx
- **Commit:** 6627ace (fixed within same commit)

## Known Stubs

The following intentional stubs exist in src/components/DetailWeergave.tsx:

| File | Section | Stub text | Reason |
|------|---------|-----------|--------|
| src/components/DetailWeergave.tsx | Section 2 — Aanvullende gegevens | "Komt in Plan 05" | Out of Plan 04 scope per plan objective |
| src/components/DetailWeergave.tsx | Section 3 — Stage | "Komt in Plan 05" | Out of Plan 04 scope per plan objective |
| src/components/DetailWeergave.tsx | Section 4 — Feedback & actiepunten | "Beschikbaar na Plan 05" | Plan 05 scope (FeedbackActiepuntenSection) |
| src/components/DetailWeergave.tsx | Section 5 — Per leerlijn | "Komt in Plan 05" | Out of Plan 04 scope per plan objective |
| src/components/DetailWeergave.tsx | Section 6 — Spiderweb overzicht | "Beschikbaar na Plan 05" | Plan 05 scope (SpiderChartCard) |
| src/components/DetailWeergave.tsx | Section 7 — Beoordelingen per datapunt × deelgebied | "Beschikbaar na Plan 05" | Plan 05 scope (DeelgebiedenMatrix) |
| src/components/DetailWeergave.tsx | Section 10 — Notities mentorgesprek | "Beschikbaar na Plan 05" | Plan 05 scope (NotitiesTextarea) |

These stubs are intentional per the plan objective: "DetailWeergave renders stub placeholders for sections covered in Plan 05." They do not prevent the plan goal (DET-V2-01 — mentor sees prognosis, absence, and vak progress in detail view).

## Threat Surface Scan

All threats in the plan's threat register have `accept` disposition:

| Threat ID | Mitigation confirmed |
|-----------|---------------------|
| T-14-04-01 | student.naam rendered as JSX string child — React auto-escapes; no innerHTML |
| T-14-04-02 | gap.label strings come from computeGapItems() which concatenates template literals from prognose numbers — no external user input reflected |
| T-14-04-03 | Numeric minutes values rendered via minNaarUren() helper — Number coercion in arithmetic, no injection surface |

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- [x] `src/components/DetailWeergave.tsx` exists and exports default function DetailWeergave
- [x] `src/components/DoortstroomPrognoseSection.tsx` exists and exports default function DoortstroomPrognoseSection
- [x] `src/components/VerzuimSection.tsx` exists and exports default function VerzuimSection
- [x] `src/components/VakkenSection.tsx` exists and exports default function VakkenSection
- [x] `src/App.tsx` imports DetailWeergave and renders it at view==='detail'
- [x] Commit `6627ace` exists (Task 1 — three section components)
- [x] Commit `cfff1a8` exists (Task 2 — DetailWeergave + App.tsx)
- [x] npm test: 43 passing, 0 failures
- [x] TypeScript: 0 compile errors
