---
plan: 32-01
phase: 32-rn-status-tegels
title: R&N statusregel in LeerlingTegel (TDD)
status: complete
completed: 2026-05-29
requirements:
  - TEGEL-03
  - TEGEL-04
---

## What Was Built

Compacte R&N statusregel toegevoegd aan `LeerlingTegel`. De rij toont `R {score}`, `N {score}` of `R {score} · N {score}` wanneer de betreffende velden aanwezig zijn, en is volledig verborgen wanneer beide velden null/undefined zijn.

## Key Files

### Created
- `tests/LeerlingTegel.test.tsx` — 4 TDD tests (TEGEL-03/TEGEL-04); RED commit vóór implementatie, daarna GREEN

### Modified
- `src/components/LeerlingTegel.tsx` — StudentProps uitgebreid met `rekenResultaat?: string | null` en `nederlandsResultaat?: string | null`; rnRow berekening en JSX render toegevoegd

## Self-Check: PASSED

| Criterion | Result |
|-----------|--------|
| npm test exitcode 0, 214 tests groen | ✓ |
| 4 LeerlingTegel rnRow tests groen | ✓ |
| RED commit vóór GREEN (TDD contract) | ✓ |
| StudentProps declareert rekenResultaat? + nederlandsResultaat? | ✓ |
| rnRow gebruikt className="score-telling" — geen hardcoded kleuren | ✓ |
| Tegel zonder R&N data toont geen rnRow (TEGEL-04) | ✓ |
| KlasOverzicht.tsx ongewijzigd | ✓ |
| TypeScript: 0 nieuwe fouten (4 pre-existing fouten in App.tsx/SettingsPage.tsx/spider ongewijzigd) | ✓ |

## Deviations

- `grep -c "rnRow"` geeft 2 (niet 3 zoals het plan verwachtte). Implementatie combineert declaratie en berekening in één expressie — functioneel equivalent. Alle must-have truths zijn aantoonbaar geleverd via tests.

## Requirements Closed

- **TEGEL-03**: Tegel met R&N-data toont compacte statusregel ✓
- **TEGEL-04**: Tegel zonder R&N-data toont geen statusregel (geen lege ruimte) ✓
