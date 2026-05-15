---
phase: 14-react-ui
plan: "02"
subsystem: app-routing-navigation
tags: [react, typescript, routing, KlasTabStrip, KlasModal, wave-1]
dependency_graph:
  requires:
    - utils/klassen.ts (klassenState, createKlas, switchActiveKlas, getActiveStudents, saveKlassen)
    - src/components/ImportPage.tsx (onImportComplete prop wiring)
  provides:
    - src/App.tsx: view routing state (view, refreshKey, activeStudentId, detailStudentList), KlasTabStrip + KlasModal mount
    - src/components/KlasTabStrip.tsx: tab strip rendering klassenState.klassen, switching active klas
    - src/components/KlasModal.tsx: modal form for new klas creation with validation and error display
    - src/components/ImportPage.tsx: onImportComplete prop called after each successful import
  affects:
    - Wave 2: src/components/KlasOverzicht.tsx (slots into view==='klas' placeholder in App.tsx)
    - Wave 2: src/components/DetailWeergave.tsx (slots into view==='detail' placeholder in App.tsx)
tech_stack:
  added: []
  patterns:
    - React useState for view routing (import|klas|detail)
    - refreshKey increment pattern to trigger re-renders after data mutations
    - Singleton read on render (klassenState.klassen read directly in KlasTabStrip)
    - Controlled form pattern with async handler (KlasModal)
    - Optional prop callback pattern (onImportComplete?.())
key_files:
  created:
    - src/components/KlasTabStrip.tsx
    - src/components/KlasModal.tsx
  modified:
    - src/App.tsx
    - src/components/ImportPage.tsx
decisions:
  - KlasTabStrip renders directly into <nav id="main-nav"> without wrapping div (preserves flex layout per 14-UI-SPEC.md)
  - KlasTabStrip returns null when klassenState.klassen is empty (no tabs = no nav rendered)
  - KlasModal validates naam.trim() before calling createKlas() to show Dutch error before async call
  - App.tsx guards KlasTabStrip render with Object.keys(klassenState.klassen).length > 0 check
  - createKlas() internally calls switchActiveKlas() + saveKlassen() — KlasModal does not double-call saveKlassen
metrics:
  duration: "1m 35s"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 14 Plan 02: App Routing + KlasTabStrip + KlasModal Summary

**One-liner:** App.tsx view routing (import|klas|detail) with refreshKey pattern, ImportPage onImportComplete prop wiring at all 3 success paths, KlasTabStrip rendering klassenState tabs, and KlasModal controlled form with Dutch validation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite App.tsx with view routing + mount KlasTabStrip + KlasModal placeholder | b2fce4c | src/App.tsx (modified), src/components/KlasTabStrip.tsx (created), src/components/KlasModal.tsx (created) |
| 2 | Add onImportComplete prop to ImportPage | 8fa1744 | src/components/ImportPage.tsx (modified) |

## What Was Built

### src/App.tsx

Rewrote App.tsx to manage navigation state:

- **State:** `view` ('import'|'klas'|'detail'), `refreshKey` (number), `activeStudentId` (string|null), `detailStudentList` (string[]), `showModal` (boolean)
- **handleImportComplete():** sets `refreshKey(k+1)` and `view('klas')`
- **handleKlasSwitch(id):** awaits `switchActiveKlas(id)`, increments refreshKey, routes to 'klas' or 'import' based on `getActiveStudents().length > 0`
- **handleStudentSelect(id, orderedList):** sets activeStudentId, detailStudentList, view('detail')
- **handleBack():** sets view('klas'), clears activeStudentId
- **handleKlasCreated(klasId):** awaits `switchActiveKlas(klasId)`, increments refreshKey, sets view('klas'), closes modal
- Drop-guard useEffect preserved verbatim (dragover + drop preventDefault)
- storage-error-banner div preserved verbatim
- Conditional KlasTabStrip render (only when klassenState.klassen has entries)
- Wave 2 placeholder divs for 'klas' and 'detail' views

### src/components/KlasTabStrip.tsx

New component rendering klas tabs from `klassenState` singleton:

- Reads `Object.values(klassenState.klassen)` directly on render (no useState/useEffect for data)
- Returns `null` when klassen is empty
- Renders each klas as `.nav-tab` button (`.nav-tab.active` for activeKlasId match)
- Renders "+" button with `className="nav-tab"`, `color:#3b82f6`, `title="Nieuwe klas aanmaken"`
- Props: `activeKlasId`, `onSwitch`, `onCreateKlas`

### src/components/KlasModal.tsx

New controlled form component for klas creation:

- Controlled state: `naam`, `schooljaar`, `error` (string|null), `loading` (boolean)
- Client-side validation: checks `naam.trim()` before async call, shows "Voer een klasnaam in."
- Duplicate error: calls `createKlas()`, maps `result.error === 'duplicate'` → "Er bestaat al een klas met de naam '{naam}'."
- Overlay: `position:fixed; inset:0; z-index:1000; rgba(0,0,0,0.5)`
- Keyboard: Escape key closes modal; Enter in form submits
- Click outside overlay closes modal
- Action row: "Annuleren" (.btn.btn-ghost) + "Klas aanmaken" (.btn.btn-primary), right-aligned
- Does NOT double-call saveKlassen() — createKlas() handles this internally via switchActiveKlas()

### src/components/ImportPage.tsx

Added optional prop and 3 call sites:

- `interface ImportPageProps { onImportComplete?: () => void }`
- Function signature updated: `export default function ImportPage({ onImportComplete }: ImportPageProps)`
- `onImportComplete?.()` called after:
  1. handlePDFs success path (after `status: 'done'` setImportState)
  2. handleExcel success path (after `status: 'done'` setImportState)
  3. handleBackup success path (after `status: 'done'` setImportState inside result.success block)
- No other changes to ImportPage.tsx

## Verification Results

- `npm test`: **43 passing**, 5 skipped, 0 failures
- `grep -c "onImportComplete?.()" src/components/ImportPage.tsx`: **3** (exactly one per success path)
- `interface ImportPageProps` with `onImportComplete?: () => void` — present
- App.tsx state variables: view, refreshKey, activeStudentId, detailStudentList — all declared
- KlasTabStrip returns null when empty — confirmed by conditional render in App.tsx guard + component implementation
- KlasModal Dutch errors: "Voer een klasnaam in." and "Er bestaat al een klas met de naam '{naam}'." — confirmed

## Deviations from Plan

None — plan executed exactly as written. Both tasks completed without requiring Rule 1/2/3 fixes.

## Known Stubs

The following intentional Wave 2 stubs exist in src/App.tsx:

| File | Location | Stub | Reason |
|------|----------|------|--------|
| src/App.tsx | view==='klas' branch | `<div>{/* KlasOverzicht goes here — Wave 2 */}</div>` | Wave 2 (plans 14-03/14-04) will replace with KlasOverzicht |
| src/App.tsx | view==='detail' branch | `<div>{/* DetailWeergave goes here — Wave 2 */}</div>` | Wave 2 (plan 14-05) will replace with DetailWeergave |

These stubs do not prevent the plan's goal (navigation skeleton). They are the explicit output of Wave 1 per 14-02-PLAN.md objective.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| Mitigated: T-14-02-01 | src/components/KlasModal.tsx | klasnaam user input rendered as controlled React value (not innerHTML) — JSX auto-escapes; duplicate detection via createKlas() |

No new unplanned network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- [x] `src/App.tsx` exists and contains all 4 state variables + all handler functions
- [x] `src/components/KlasTabStrip.tsx` exists and exports default function KlasTabStrip
- [x] `src/components/KlasModal.tsx` exists and exports default function KlasModal
- [x] `src/components/ImportPage.tsx` contains ImportPageProps interface and 3 onImportComplete?.() calls
- [x] Commit `b2fce4c` exists (Task 1)
- [x] Commit `8fa1744` exists (Task 2)
- [x] npm test: 43 passing, 0 failures
