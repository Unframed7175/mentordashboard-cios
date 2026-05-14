---
phase: 11-typescript-migratie
plan: "06"
subsystem: test-infrastructure
tags: [typescript, tests, esm-migration, wave-3]
dependency_graph:
  requires:
    - 11-04 (aggregation.ts, backup.ts, spider.ts)
    - 11-05 (parsers/pdf.ts, parsers/excel.ts)
  provides:
    - tests/actiepunten.test.js ESM-compliant
    - All test stubs finalized
    - npm run test exit 0 (31 passing, 5 skipped)
  affects:
    - All tests/ (test suite now fully ESM)
key_files:
  modified:
    - tests/actiepunten.test.js (require() + global.window → ESM import)
    - tests/parseStage.test.ts (added parseSinglePDF type check inside fixture guard)
decisions:
  - "actiepunten.test.js: replaced require('../utils/actiepunten.js') + global.window.* with import { actiepuntenStore, normalizeOnderwerp, isHerhaling } from '../utils/actiepunten'"
  - "parseStage.test.ts: parseSinglePDF type check placed inside fixture guard to avoid DOMMatrix crash from pdfjs at import time"
  - "Fixture tests (parseStage, excel integration): skipped via describe.skipIf — MIG-01/MIG-02 to be verified with real fixtures in Phase 13"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tasks_total: 2
  test_results:
    total: 36
    passing: 31
    skipped: 5
    failed: 0
---

# Phase 11 Plan 06: Wave 3 Tests Finalisatie Summary

Wave 3 klaar: alle tests zijn nu ESM-compatibel. npm run test geeft 31/31 groen (5 skipped door ontbrekende fixtures). De TypeScript migratie test suite is volledig.

## What Was Built

### Taak 1: actiepunten.test.js ESM migratie (commit e4bc664)

`tests/actiepunten.test.js` bijgewerkt van het oude script-stijl patroon (require + global.window) naar ESM import syntax:

**Verwijderd:**
```js
global.window = global;
const mod = require('../utils/actiepunten.js');
// ... window.actiepuntenStore, window.normalizeOnderwerp, etc.
```

**Vervangen door:**
```js
import { actiepuntenStore, normalizeOnderwerp, isHerhaling } from '../utils/actiepunten';
import { appState } from '../utils/datamodel';
```

Alle 9 tests in actiepunten.test.js zijn nu groen.

### Taak 2: parseStage.test.ts verbetering (commit 25eeadf)

`tests/parseStage.test.ts` bijgewerkt met een extra type-check test binnen de fixture guard:
- `parseSinglePDF is een functie` — verifieert dat de export beschikbaar is zodra een fixture aanwezig is
- Dynamische import (`await import('../parsers/pdf')`) behouden om DOMMatrix crash te vermijden in jsdom omgeving

## Test Resultaten na Wave 3

```
Test Files  7 passed | 1 skipped (8)
     Tests  31 passed | 5 skipped (36)
  Duration  1.40s
```

| Test File | Tests | Status |
|-----------|-------|--------|
| actiepunten.test.js | 9 | ✓ Groen (ESM fix) |
| prognosis.test.ts | 5 | ✓ Groen (MIG-03) |
| aggregation.test.ts | 5 | ✓ Groen |
| backup.test.ts | 4 | ✓ Groen |
| spider.test.ts | 4 | ✓ Groen |
| feedback.test.ts | 4 | ✓ Groen |
| parseStage.test.ts | 2 | Overgeslagen (geen fixture) |
| excel.test.ts | 3 | Overgeslagen (geen fixture) |

## Openstaande Verificaties (fixture-afhankelijk)

| Requirement | Test | Status | Actie |
|-------------|------|--------|-------|
| MIG-01 | parseStage integration test | Overgeslagen — geen sample-voortgang.pdf | Verifieer in Phase 13 met echte fixture |
| MIG-02 | excel Müller-test | Overgeslagen — geen sample-verzuim.xls | Verifieer in Phase 13 met echte fixture |

## Self-Check: PASSED

- actiepunten.test.js gebruikt ESM import syntax ✓
- npm run test exit 0 (31 passing, 5 skipped) ✓
- Geen require() of global.window.* in test bestanden ✓
- Fixture-afhankelijke tests slaan correct over via describe.skipIf ✓
