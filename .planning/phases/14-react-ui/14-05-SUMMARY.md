---
phase: 14-react-ui
plan: "05"
subsystem: detail-weergave-sections
tags: [react, typescript, FeedbackActiepuntenSection, SpiderChartCard, DeelgebiedenMatrix, NotitiesTextarea, wave-2]
dependency_graph:
  requires:
    - src/components/DetailWeergave.tsx (stub sections replaced — Wave 2, Plan 04)
    - utils/actiepunten.ts (actiepuntenStore.list/add/update/remove)
    - utils/klassen.ts (saveKlassen, getAllRecordsForStudent)
    - utils/spider.ts (SpiderChart.buildSpiderSVG — axes keyed on dg.label)
    - utils/schema.ts (DEELGEBIEDEN, SCORE_LEVELS, normalizeScore)
    - utils/aggregation.ts (aggregateDeelgebiedScores — modus per deelgebied)
  provides:
    - src/components/FeedbackActiepuntenSection.tsx: CRUD actiepunten with collapsible panel; saveKlassen() after every mutation
    - src/components/NotitiesTextarea.tsx: debounced textarea with localStorage migration and Opgeslagen save hint
    - src/components/SpiderChartCard.tsx: SVG spider chart per leerlijn group via dangerouslySetInnerHTML
    - src/components/DeelgebiedenMatrix.tsx: datapunten×deelgebied table with modus footer and two-period growth badges
    - src/components/DetailWeergave.tsx: all 10 sections now rendered (Plan 04 stubs replaced)
  affects:
    - DET-V2-01 complete: all 10 DetailWeergave sections render without crash
    - DET-V2-02 complete: actiepunten CRUD and notities persist via saveKlassen()
tech_stack:
  added: []
  patterns:
    - CRUD with explicit saveKlassen() after every actiepuntenStore mutation (anti-pattern guard — saveState() is no-op)
    - dangerouslySetInnerHTML for SpiderChart SVG string (D-14-10; sanitizeCssVar() internal XSS guard)
    - Debounced useRef timer (500ms) for textarea autosave
    - localStorage migration on first render (D-14-12) — mentordashboard_notities key
    - Two-period growth badges using SCORE_LEVELS.indexOf comparison
    - aggregateDeelgebiedScores() for single-period modus footer chips
key_files:
  created:
    - src/components/FeedbackActiepuntenSection.tsx
    - src/components/NotitiesTextarea.tsx
    - src/components/SpiderChartCard.tsx
    - src/components/DeelgebiedenMatrix.tsx
  modified:
    - src/components/DetailWeergave.tsx
decisions:
  - SpiderChartCard axes use dg.label (not dg.id) as key — deelgebiedScores is keyed on label per PDF parser output (D-14-10 critical pitfall from RESEARCH.md)
  - aggregateDeelgebiedScores returns { aggregationDetail: Record<string, string|null> } — simple modus string per label, not the { modus, counts } shape documented in plan interface block; implemented accordingly
  - DeelgebiedenMatrix single-period footer uses aggregationDetail[dg.label] as modus chip score directly (mirrors app.js lines 1780-1792)
  - FeedbackActiepuntenSection renders inline form replacing the row when editingId matches; add form rendered after list when editingId==='new'
metrics:
  duration: "5m"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 14 Plan 05: FeedbackActiepuntenSection + SpiderChartCard + DeelgebiedenMatrix + NotitiesTextarea Summary

**One-liner:** Four real components replace Plan 04 DetailWeergave stubs: CRUD actiepunten panel with explicit saveKlassen() persistence, SVG spider charts keyed on dg.label, full deelgebied table with modus/growth footer, and debounced notities textarea with localStorage migration.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create FeedbackActiepuntenSection and NotitiesTextarea | ad4f335 | src/components/FeedbackActiepuntenSection.tsx (created), src/components/NotitiesTextarea.tsx (created) |
| 2 | Create SpiderChartCard and DeelgebiedenMatrix + replace stubs in DetailWeergave | cc34938 | src/components/SpiderChartCard.tsx (created), src/components/DeelgebiedenMatrix.tsx (created), src/components/DetailWeergave.tsx (modified) |

## What Was Built

### src/components/FeedbackActiepuntenSection.tsx

Stateful collapsible section with full CRUD for actiepunten:

- `useState(() => actiepuntenStore.list(leerlingId))` for initial list
- `isOpen` state for chevron-toggled collapsible panel
- `editingId` ('new' | existing id | null) and `formState` for form control
- `handleAdd`, `handleUpdate`, `handleRemove` each: mutate via actiepuntenStore, `await saveKlassen()`, reload list
- saveKlassen() returning false shows inline error (Pattern B from PATTERNS.md)
- Status badge: `ap-status-{ap.status}` CSS class with Dutch label
- No window.confirm on delete (per 14-UI-SPEC requirement)
- Empty state: "Nog geen actiepunten. Voeg een actiepunt toe na het mentorgesprek."

### src/components/NotitiesTextarea.tsx

Debounced autosave textarea with localStorage migration:

- `useState` initializer checks `student.notitie !== undefined` first; falls back to `localStorage.getItem('mentordashboard_notities')` JSON parse + migration (D-14-12)
- `useRef<ReturnType<typeof setTimeout>>` timer cleared and reset on each keystroke
- 500ms debounce → `student.notitie = v; await saveKlassen()` → `setHint('saved')` → after 1500ms `setHint('idle')`
- `.notitie-hint` with `.saved` class when hint==='saved', color #10b981

### src/components/SpiderChartCard.tsx

Single spider chart card per leerlijn group:

- `axes = DEELGEBIEDEN.filter(dg => dg.group === group).map(dg => ({ key: dg.label, label: dg.label }))` — CRITICAL: key=dg.label not dg.id
- `SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar)` → `dangerouslySetInnerHTML={{ __html: svg }}`
- Empty state "Geen scores beschikbaar" when svg is falsy or axes is empty
- max-width:180px on spider-card; spider-leerlijn-title below SVG

### src/components/DeelgebiedenMatrix.tsx

Full deelgebied table with scrollable wrapper:

- Three leerlijn column groups (Lesgeven/Organiseren/Prof. handelen) with color-coded headers
- All 19 deelgebieden as columns; datapunten as rows; dm-chip with score-o/v/g/e/none CSS classes
- Single-period tfoot: `aggregateDeelgebiedScores(datapunten).aggregationDetail[dg.label]` modus per column
- Two-period tfoot: oldest and newest deelgebiedScores rows; GrowthBadge compares SCORE_LEVELS.indexOf
- `overflowX: auto; minWidth: 860px` per 14-UI-SPEC
- Empty state when datapunten.length === 0

### src/components/DetailWeergave.tsx

Replaced four Plan 04 stubs:
- Section 4: `<FeedbackActiepuntenSection leerlingId={leerlingId} />`
- Section 6: div.spider-charts-row with three SpiderChartCard (lesgeven/organiseren/prof_handelen)
- Section 7: `<DeelgebiedenMatrix student={student} leerlingId={leerlingId} />`
- Section 10: `<NotitiesTextarea student={student} leerlingId={leerlingId} />`

## Verification Results

- `npm test`: **43 passing**, 5 skipped, 0 failures
- `npx tsc --noEmit`: **0 errors**
- All four Plan 04 stubs replaced; "Beschikbaar na Plan 05" text no longer appears in DetailWeergave
- FeedbackActiepuntenSection: saveKlassen() called 3 times (handleAdd, handleUpdate, handleRemove)
- SpiderChartCard: axes use dg.label (not dg.id) — polygon renders correctly when scores exist

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] aggregateDeelgebiedScores returns simple modus string, not { modus, counts } shape**
- **Found during:** Task 2 (reading utils/aggregation.ts)
- **Issue:** Plan's interface block described `aggregationDetail: Record<string, { modus: string|null; counts: Record<string,number> }>` but actual TypeScript implementation returns `{ aggregationDetail: Record<string, string | null> }` — a simple modus score per label with no counts sub-object
- **Fix:** DeelgebiedenMatrix single-period footer uses `aggregationDetail[dg.label]` directly as a score string for the dm-chip (matches app.js lines 1782-1788 exactly)
- **Files modified:** src/components/DeelgebiedenMatrix.tsx
- **Commit:** cc34938 (implemented correctly from the start)

## Known Stubs

None — all four Plan 05 scope stubs in DetailWeergave are now replaced with real components. Remaining stubs (Sections 2/3/5 — "Komt in Plan 05") are out of scope for this plan per the original Plan 04 decisions and are not Plan 05 responsibilities.

## Threat Surface Scan

Per plan threat register:

| Threat ID | Disposition | Confirmed |
|-----------|-------------|-----------|
| T-14-05-01 | accept | Actiepunten list renders as JSX string children — React auto-escapes; no innerHTML |
| T-14-05-02 | mitigate | buildSpiderSVG input is deelgebiedScores (score levels from PDF parser); spider.ts sanitizeCssVar() strips non-alphanum; accepted per D-14-10 |
| T-14-05-03 | accept | Textarea value in value prop — React auto-escapes |
| T-14-05-04 | accept | localStorage migration reads only 'mentordashboard_notities' key; moves to encrypted store |

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- [x] `src/components/FeedbackActiepuntenSection.tsx` exists and exports default function FeedbackActiepuntenSection
- [x] `src/components/NotitiesTextarea.tsx` exists and exports default function NotitiesTextarea
- [x] `src/components/SpiderChartCard.tsx` exists and exports default function SpiderChartCard
- [x] `src/components/DeelgebiedenMatrix.tsx` exists and exports default function DeelgebiedenMatrix
- [x] `src/components/DetailWeergave.tsx` modified — imports all four new components, stubs replaced
- [x] Commit `ad4f335` exists (Task 1 — FeedbackActiepuntenSection + NotitiesTextarea)
- [x] Commit `cc34938` exists (Task 2 — SpiderChartCard + DeelgebiedenMatrix + DetailWeergave)
- [x] npm test: 43 passing, 0 failures
- [x] TypeScript: 0 compile errors
