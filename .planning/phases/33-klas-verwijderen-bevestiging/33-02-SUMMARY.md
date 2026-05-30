---
phase: 33-klas-verwijderen-bevestiging
plan: "02"
title: "GREEN implementatie — KlasVerwijderenModal + KlasTabStrip + App.tsx wiring"
type: tdd
completed: "2026-05-30T08:20:00Z"
duration_minutes: 15
tasks_completed: 4
tasks_total: 4

subsystem: ui
tags: [tdd, green-phase, modal, klas-beheer, react]

dependency_graph:
  requires:
    - phase: 33-klas-verwijderen-bevestiging
      plan: "01"
      provides: "RED gate: KlasVerwijderenModal 5 failing tests + TAB-01 update"
  provides:
    - "KlasVerwijderenModal component: modal overlay met checkbox-bevestiging (KLS-05, KLS-06)"
    - "KlasTabStrip: × knop altijd zichtbaar voor ALLE klassen (KLS-04, D-01)"
    - "App.tsx: modal state, handleDeleteKlas opent modal, KLS-07 navigatie naar import"
  affects:
    - src/components/KlasVerwijderenModal.tsx
    - src/components/KlasTabStrip.tsx
    - src/App.tsx

tech_stack:
  added: []
  patterns:
    - "TDD GREEN phase — implementatie maakt failing tests groen"
    - "Modal overlay patroon (inline styles, identiek aan KlasModal)"
    - "Controlled checkbox state voor disabled confirm-knop"
    - "showDeleteModal: { klasId, naam, count } | null state voor modal wiring"

key_files:
  created:
    - src/components/KlasVerwijderenModal.tsx
  modified:
    - src/components/KlasTabStrip.tsx
    - src/App.tsx

key_decisions:
  - "canDelete? optioneel gemaakt in KlasTabStrip interface — bestaande call sites intact, prop genegeerd in render"
  - "handleConfirmDeleteKlas controleert Object.keys(klassenState.klassen).length === 0 NA deleteKlas voor KLS-07"
  - "Pre-existing TypeScript fouten (settings.ts Theme type vs. 'system' vergelijking) zijn buiten scope — niet veroorzaakt door dit plan"

patterns_established:
  - "Modal-open-via-state: setShowDeleteModal({ klasId, naam, count }) in handleDeleteKlas, reset in onCancel/onConfirm"
  - "KLS-07 navigatiepatroon: na async deleteKlas() controleer lege klassenState, dan setView('import')"

requirements_completed: [KLS-04, KLS-05, KLS-06, KLS-07]

duration: 15m
completed_date: "2026-05-30"
files_changed: 3
commits: 3
---

# Phase 33 Plan 02: GREEN implementatie — KlasVerwijderenModal + KlasTabStrip + App.tsx wiring — Summary

**KlasVerwijderenModal component aangemaakt met checkbox-bevestiging (KLS-06), × knop unlocked voor alle klassen via canDelete guard verwijdering (KLS-04), App.tsx gewired met modal state en KLS-07 navigatie naar importscherm na laatste klas verwijdering.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-30T08:05:00Z
- **Completed:** 2026-05-30T08:20:00Z
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments
- KlasVerwijderenModal aangemaakt: centered overlay, klasnaam + leerlingaantal body, checkbox, disabled confirm (KLS-05, KLS-06)
- canDelete guard verwijderd uit KlasTabStrip — × knop altijd zichtbaar voor alle klassen (D-01, KLS-04)
- App.tsx volledig gewired: showDeleteModal state, handleDeleteKlas opent modal, handleConfirmDeleteKlas verwijdert + navigeert (KLS-07)
- Alle 218 tests groen (inclusief 6 nieuwe RED tests uit Plan 01)

## Task Commits

Elke task atomisch gecommit:

1. **Task 1: KlasVerwijderenModal aanmaken (GREEN)** - `127c89d` (feat)
2. **Task 2: canDelete guard verwijderen KlasTabStrip (GREEN)** - `4a510be` (feat)
3. **Task 3: App.tsx wiring + KLS-07 navigatie (GREEN)** - `e345d51` (feat)
4. **Task 4: Volledige verificatie** - (geen aparte commit — verificatie gedaan vóór SUMMARY)

## Files Created/Modified
- `src/components/KlasVerwijderenModal.tsx` (nieuw) — Modal component: klasnaam + leerlingaantal, checkbox-bevestiging, disabled confirm-knop, Escape/overlay-click sluiten
- `src/components/KlasTabStrip.tsx` — canDelete guard verwijderd; canDelete prop optioneel gemaakt (?: boolean)
- `src/App.tsx` — KlasVerwijderenModal geimporteerd, showDeleteModal state, handleDeleteKlas → opent modal, handleConfirmDeleteKlas + KLS-07, canDelete: true

## Decisions Made
- canDelete optioneel gemaakt in KlasTabStrip interface om bestaande call sites intact te houden; prop genegeerd in render logica (D-01 volledig geimplementeerd)
- handleConfirmDeleteKlas controleert lege klassen NADAT deleteKlas() aangeroepen is (deleteKlas muteert klassenState synchroon) — correcte volgorde voor KLS-07
- Pre-existing TypeScript fouten in App.tsx (settings Theme type vs. 'system') zijn buiten scope van dit plan en al aanwezig op master branch

## Deviations from Plan

### Afwijking 1: Master merge nodig voor testbestanden

- **Found during:** Task 1 verificatie
- **Issue:** De worktree branch was aangemaakt vóór Plan 01 commits naar master werden gemerged. De tests/KlasVerwijderenModal.test.tsx en bijgewerkte tests/KlasTabStrip.test.tsx ontbraken in de worktree.
- **Fix:** git merge master uitgevoerd — fast-forward, geen conflicten.
- **Categorie:** Rule 3 (blocking issue) — zonder testbestanden kon verificatie niet plaatsvinden.
- **Commit:** N/A (merge commit automatisch aangemaakt door git)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking: missing test files from wave 0)
**Impact on plan:** Noodzakelijk voor correcte TDD verificatie. Geen scope creep.

## Issues Encountered
- Worktree werd aangemaakt voor de Plan 01 commits op master stonden — opgelost via `git merge master` (fast-forward, geen conflicten, geen dataverlies)

## TDD Gate Compliance

GREEN phase voltooid correct:
- Alle 5 KlasVerwijderenModal tests: GROEN (was: module-not-found RED)
- TAB-01 test: GROEN (was: 1 button gevonden, verwacht 2)
- `feat(33-02)` commits aanwezig: `127c89d`, `4a510be`, `e345d51`
- Testsuite resultaat: 218 passed | 5 skipped (was: 1 failed | 212 passed | 5 skipped)

## Known Stubs

None — alle functionality volledig geimplementeerd en gewired.

## Threat Flags

None — geen nieuwe vertrouwensgrenzen; modal gebruikt bestaande deleteKlas() functie die al input-validatie uitvoert.

## Next Phase Readiness
- KLS-04 t/m KLS-07 volledig geleverd
- 218 tests groen, nul regressies
- TypeScript clean voor nieuwe bestanden (pre-existing fouten in settings.ts/App.tsx buiten scope)
- Klaar voor human UAT / verificatie

## Self-Check: PASSED

- [x] `src/components/KlasVerwijderenModal.tsx` bestaat (93 regels)
- [x] `src/components/KlasTabStrip.tsx` gewijzigd (canDelete guard verwijderd, canDelete?: boolean)
- [x] `src/App.tsx` gewijzigd (KlasVerwijderenModal import, showDeleteModal state, handleConfirmDeleteKlas, canDelete: true)
- [x] Commit `127c89d` bestaat (KlasVerwijderenModal)
- [x] Commit `4a510be` bestaat (KlasTabStrip)
- [x] Commit `e345d51` bestaat (App.tsx)
- [x] 218 tests groen, 0 failures
- [x] window.confirm afwezig in App.tsx (0 matches)
- [x] canDelete: true aanwezig in App.tsx (1 match)
- [x] canDelete && afwezig in KlasTabStrip.tsx (0 matches)

---
*Phase: 33-klas-verwijderen-bevestiging*
*Completed: 2026-05-30*
