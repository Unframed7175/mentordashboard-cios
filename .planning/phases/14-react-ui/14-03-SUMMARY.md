---
phase: 14-react-ui
plan: "03"
subsystem: klas-overzicht
tags: [react, typescript, KlasOverzicht, LeerlingTegel, klas-grid, search, sort, kpi-strip, wave-2]
dependency_graph:
  requires:
    - src/utils/status.ts (berekenStatus, STATUS_VOLGORDE, RAG_BORDER, StatusResult — Wave 0)
    - utils/klassen.ts (getActiveStudents, klassenState, deleteKlas)
    - src/components/KlasTabStrip.tsx (navigation strip — Wave 1)
    - src/App.tsx (view routing state, handleStudentSelect, handleBack — Wave 1)
  provides:
    - src/components/LeerlingTegel.tsx: pure tile — naam, RAG border, status badge, mini verzuim bar
    - src/components/KlasOverzicht.tsx: grid view with search/sort/KPI strip/delete klas
    - src/App.tsx: KlasOverzicht wired in view==='klas' slot
  affects:
    - Wave 2 detail view: onSelectStudent delivers (leerlingId, orderedList) to App.tsx for DetailWeergave
tech_stack:
  added: []
  patterns:
    - Singleton read on every render (getActiveStudents() — no useEffect for data)
    - refreshKey prop triggers re-render when data changes (App.tsx pattern)
    - Stateful search/sort with direct filter+sort inline (no useEffect)
    - Pure presentational tile component (LeerlingTegel — no state, no async)
    - window.confirm native dialog for destructive action (delete klas)
key_files:
  created:
    - src/components/LeerlingTegel.tsx
    - src/components/KlasOverzicht.tsx
  modified:
    - src/App.tsx
decisions:
  - KlasOverzicht KPI computed over allStudents (ALL active), not filtered subset — matches plan spec
  - KPI spec follows plan interface block (opSchema=groen|blauw, risico=rood, verzuim=oranje+Verzuim label) rather than app.js Phase 08 KPI strip which uses different metrics (gem. verzuim hours, gem. dp)
  - Sort 'verzuim' default direction is descending (sortAsc=false) so worst first; sort 'naam' default is ascending
  - LeerlingTegel import path: ../utils/status (src/components/ → src/utils/)
  - KlasOverzicht import path: ../../utils/klassen (src/components/ → root utils/)
  - KlasOverzicht import path: ../utils/status (src/components/ → src/utils/)
  - Delete confirmation uses template literal with klasNaam from klassenState.klassen; falls back to 'deze klas'
metrics:
  duration: "1m 49s"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 14 Plan 03: KlasOverzicht + LeerlingTegel Summary

**One-liner:** KlasOverzicht tile grid with search/sort/KPI strip (3 KPIs) and delete klas, LeerlingTegel pure tile with RAG left-border/status badge/mini verzuim bar, wired into App.tsx replacing the Wave 1 placeholder.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create LeerlingTegel.tsx — pure tile component | d2e7572 | src/components/LeerlingTegel.tsx (created) |
| 2 | Create KlasOverzicht.tsx + wire into App.tsx | 6c1856d | src/components/KlasOverzicht.tsx (created), src/App.tsx (modified) |

## What Was Built

### src/components/LeerlingTegel.tsx

Pure presentational tile component:

- **Props:** `student: any`, `status: StatusResult`, `onClick: () => void`
- **RAG border:** `style={{ borderLeft: '4px solid ' + RAG_BORDER[status.kleur] }}` — inline style, not className
- **Content order (top to bottom):** span.klas-tile-naam (student.naam) → span.status-badge.status-{kleur} (status.label) → mini verzuim bar section
- **Mini verzuim bar:** computes pA/pG/pO from student.verzuim per app.js lines 1256-1269 spec; renders null when verzuim missing or totaal=0; shows "N% aanwezig" text below
- **Keyboard:** tabIndex=0, role="button", onKeyDown handler calls onClick on Enter key

### src/components/KlasOverzicht.tsx

Full grid view component:

- **Reads:** `getActiveStudents()` directly on every render (refreshKey causes re-render, no useEffect)
- **State:** `zoekTerm` (string), `sortKey` ('naam'|'status'|'verzuim'), `sortAsc` (boolean, default true)
- **KPI strip:** Computed over ALL active students (not filtered): opSchema (groen+blauw), risico (rood), verzuim (oranje+Verzuim label); pctOpSchema = round(opSchema/total*100) or 0
- **Search:** `naam.toLowerCase().includes(zoekTerm.toLowerCase())` — immediate, no debounce
- **Sort:** naam→localeCompare NL; status→STATUS_VOLGORDE diff; verzuim→ongeoorloofd desc. Same key toggles sortAsc; new key resets to default direction (naam=asc, others=desc)
- **Tile grid:** Maps sorted filtered students to LeerlingTegel; onClick passes (leerlingId, orderedList)
- **Empty states:** "Nog geen leerlingen geïmporteerd." (no students, no zoekTerm) and "Geen leerlingen gevonden voor '{zoekTerm}'." (search no match)
- **Delete klas:** window.confirm with exact Dutch copy → deleteKlas(activeKlasId) → onKlasDeleted()

### src/App.tsx

Replaced Wave 1 placeholder:

- Added `import KlasOverzicht from './components/KlasOverzicht'`
- Replaced `{view === 'klas' && <div>{/* KlasOverzicht goes here — Wave 2 */}</div>}` with `<KlasOverzicht refreshKey={refreshKey} onSelectStudent={handleStudentSelect} onKlasDeleted={handleBack} />`

## Verification Results

- `npm test`: **43 passing**, 5 skipped, 0 failures
- `npx tsc --noEmit`: **0 errors** (main tsconfig)
- KlasOverzicht wired correctly at view==='klas' slot in App.tsx
- LeerlingTegel renders with correct import paths (src/utils/status)
- KlasOverzicht import paths correct (../../utils/klassen, ../utils/status)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Import path correction for KlasOverzicht**
- **Found during:** Task 2 (TypeScript compile check)
- **Issue:** Initial implementation used `../utils/klassen` in KlasOverzicht.tsx (src/components/ level). This resolves to `src/utils/klassen` which does not exist — klassen.ts lives at project root `utils/klassen.ts`.
- **Fix:** Changed to `../../utils/klassen` (src/components/ → root utils/)
- **Files modified:** src/components/KlasOverzicht.tsx
- **Commit:** 6c1856d (fixed within same commit)

## Known Stubs

None — all exports are fully implemented with real logic. The `{/* DetailWeergave goes here — Wave 2 */}` placeholder in App.tsx is unchanged (plan 14-05 scope, not this plan).

## Threat Surface Scan

All threats in the plan's threat register have `accept` disposition:

| Threat ID | Mitigation confirmed |
|-----------|---------------------|
| T-14-03-01 | student.naam rendered as JSX string child — React auto-escapes, no innerHTML |
| T-14-03-02 | zoekTerm used only in .includes() string comparison — never injected as HTML |
| T-14-03-03 | window.confirm copy is hardcoded app message — no user input reflected |
| T-14-03-04 | getActiveStudents() bounded by class size — no regex, no complex sort |

No new network endpoints, auth paths, or file access patterns introduced.

## Self-Check: PASSED

- [x] `src/components/LeerlingTegel.tsx` exists and exports default function LeerlingTegel
- [x] `src/components/KlasOverzicht.tsx` exists and exports default function KlasOverzicht
- [x] `src/App.tsx` imports KlasOverzicht and renders it at view==='klas'
- [x] Commit `d2e7572` exists (Task 1 — LeerlingTegel)
- [x] Commit `6c1856d` exists (Task 2 — KlasOverzicht + App.tsx)
- [x] npm test: 43 passing, 0 failures
- [x] TypeScript: 0 compile errors
