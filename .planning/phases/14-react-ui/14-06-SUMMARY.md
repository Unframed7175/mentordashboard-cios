---
phase: 14-react-ui
plan: "06"
subsystem: detail-weergave-gap-closure
tags: [react, typescript, AanvullendSection, StageSection, LeerlijnenSection, DetailWeergave, wave-3, gap-closure, DET-V2-01]
dependency_graph:
  requires:
    - src/components/DetailWeergave.tsx (three stub divs — Wave 2, Plans 04/05)
    - utils/klassen.ts (klassenState, saveKlassen — Wave 0)
    - utils/prognosis.ts (berekenPrognose return shape — leerlijnen array)
  provides:
    - src/components/AanvullendSection.tsx: taalniveau/rekenniveau selects wired to student + saveKlassen()
    - src/components/StageSection.tsx: stage stat-cards from klassenState activeKlas stageData
    - src/components/LeerlijnenSection.tsx: per-leerlijn breakdown bars from prognose.leerlijnen
    - src/components/DetailWeergave.tsx: all 10 sections rendered, zero stub text
  affects:
    - DET-V2-01 gap SC-3 closed: all three "Komt in Plan 05" stubs eliminated
tech_stack:
  added: []
  patterns:
    - Controlled select with in-memory mutation + saveKlassen() + hint timer (AanvullendSection)
    - klassenState singleton read at render for stageData access (StageSection)
    - Prognose-as-prop: LeerlijnenSection receives already-computed prognose (does not call berekenPrognose)
    - formatDutchDate helper inline in StageSection (matches app.js lines 1924-1928 exactly)
key_files:
  created:
    - src/components/AanvullendSection.tsx
    - src/components/StageSection.tsx
    - src/components/LeerlijnenSection.tsx
  modified:
    - src/components/DetailWeergave.tsx
decisions:
  - LeerlijnenSection receives prognose as prop (not calling berekenPrognose itself) — mirrors DoortstroomPrognoseSection pattern; status.prognose already computed in DetailWeergave
  - AanvullendSection mutates student[field] in-memory before saveKlassen() — same pattern as NotitiesTextarea; no local state for select value (student object is the source of truth)
  - StageSection reads klassenState.klassen[activeKlasId].stageData directly — no prop drilling; singleton always current on render (Pattern A from PATTERNS.md)
metrics:
  duration: "3m"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 14 Plan 06: AanvullendSection + StageSection + LeerlijnenSection Gap Closure Summary

**One-liner:** Three new components replace the last three "Komt in Plan 05" stubs in DetailWeergave — taalniveau/rekenniveau selects with saveKlassen() persistence, stage stat-cards from active klas stageData, and per-leerlijn progress bars from the pre-computed prognose.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create AanvullendSection, StageSection, LeerlijnenSection | 1e7530f | src/components/AanvullendSection.tsx (created), src/components/StageSection.tsx (created), src/components/LeerlijnenSection.tsx (created) |
| 2 | Replace three stub divs in DetailWeergave.tsx | 787b5cb | src/components/DetailWeergave.tsx (modified) |

## What Was Built

### src/components/AanvullendSection.tsx

Stateful component with `{ student: any }`:

- Two controlled `<select>` elements bound to `student.taalniveau || ''` and `student.rekenniveau || ''`
- Taal options: `''/"— niet ingevuld —"`, `"2F"/"2F"`, `"3F"/"3F"`
- Rekenen options: `''/"— niet ingevuld —"`, `"MBO 3"/"MBO 3"`, `"MBO 4"/"MBO 4"`
- `handleChange(field, value)`: mutates `student[field] = value`, awaits `saveKlassen()`, shows `Opgeslagen` hint for 1500ms via `useRef` timer (same shape as NotitiesTextarea)
- `p.aanvullend-hint` with `color:#10b981` when hint==='saved'

### src/components/StageSection.tsx

Pure presentational component with `{ student: any }`:

- Reads `klassenState.activeKlasId` → `klassenState.klassen[activeKlasId]?.stageData?.[student.leerlingId]`
- Empty state when `!sd`: Dutch copy from app.js line 1936
- `formatDutchDate(iso)`: falsy → `'—'`; splits on `-`; 3-part ISO → `DD-MM-YYYY`; else returns iso as-is
- `div.stats-grid` (style `gridTemplateColumns: '1fr 1fr'`) with 3 stat-cards: Organisatie, Periode, Stage-uren (gridColumn `span 2`)
- Each card: `div.stat-label` above `div.stat-value` (fontSize 1rem)

### src/components/LeerlijnenSection.tsx

Pure presentational component with `{ prognose: any }`:

- `LEERLIJN_LABEL` map: `{ lesgeven, organiseren, prof_handelen }` → Dutch labels
- Maps `prognose.leerlijnen` to `div.leerlijn-row` elements
- Each row: `span.leerlijn-naam`, `span.leerlijn-stat` (voldoendeOfHoger/totaal &ge;V), `span.leerlijn-stat` (onvoldoende O — red+bold when > 2), `span.leerlijn-stat` (onbeoordeeld ? — text-faint), `div.leerlijn-bar-track > div.leerlijn-bar-fill` (width: pct%)
- `pct = totaal > 0 ? Math.round((voldoendeOfHoger / totaal) * 100) : 0`
- Empty state when `leerlijnen.length === 0`: renders empty `div.leerlijn-rows` (no error)

### src/components/DetailWeergave.tsx

Removed three stub divs:

- Added imports: `AanvullendSection`, `StageSection`, `LeerlijnenSection`
- Section 2: `<AanvullendSection student={student} />` (was: "Komt in Plan 05" stub)
- Section 3: `<StageSection student={student} />` (was: "Komt in Plan 05" stub)
- Section 5: `<LeerlijnenSection prognose={status.prognose} />` (was: "Komt in Plan 05" stub)
- All other sections unchanged

## Verification Results

- `grep -c "Komt in Plan 05" src/components/DetailWeergave.tsx`: **0** (all stubs removed)
- `npm test`: **43 passing**, 5 skipped, 0 failures
- `npx tsc --noEmit`: **0 errors**
- `grep -c "saveKlassen" src/components/AanvullendSection.tsx`: 1 (wired to save)
- `grep -c "klassenState" src/components/StageSection.tsx`: 1 (reads active klas)
- `grep -c "berekenPrognose" src/components/LeerlijnenSection.tsx`: 0 (receives prop, does not call)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all "Komt in Plan 05" stubs are eliminated. DetailWeergave now renders all 10 sections with real data.

## Threat Surface Scan

Per plan threat register — all four threats have `accept` disposition:

| Threat ID | Mitigation confirmed |
|-----------|---------------------|
| T-14-06-01 | AanvullendSection selects: React-controlled value prop; user can only pick predefined option values |
| T-14-06-02 | StageSection stat-card render: sd.* fields rendered as JSX string children — React auto-escapes |
| T-14-06-03 | LeerlijnenSection leerlijn-row: LEERLIJN_LABEL hardcoded; numeric fields via arithmetic; no external input as raw HTML |
| T-14-06-04 | AanvullendSection saveKlassen: options are hardcoded; select constraint bounds user input |

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- [x] `src/components/AanvullendSection.tsx` exists and exports default function AanvullendSection
- [x] `src/components/StageSection.tsx` exists and exports default function StageSection
- [x] `src/components/LeerlijnenSection.tsx` exists and exports default function LeerlijnenSection
- [x] `src/components/DetailWeergave.tsx` modified — imports all three new components, stubs replaced
- [x] Commit `1e7530f` exists (Task 1 — three new components)
- [x] Commit `787b5cb` exists (Task 2 — DetailWeergave stub replacement)
- [x] npm test: 43 passing, 0 failures
- [x] TypeScript: 0 compile errors
- [x] grep "Komt in Plan 05" DetailWeergave.tsx: 0 matches
