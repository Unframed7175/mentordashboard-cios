---
phase: 11-typescript-migratie
plan: "01"
subsystem: build-tooling / test-infrastructure
tags: [typescript, tsconfig, fflate, test-stubs, wave-0]
dependency_graph:
  requires: []
  provides:
    - tsconfig.json extended to utils/, parsers/, tests/
    - tsconfig.migrated.json (noImplicitAny:true for utils/**, parsers/**)
    - npm run typecheck-migrated script
    - fflate@0.8.2 in node_modules
    - 7 test stub files with skipIf guards
    - tests/fixtures/ directory
  affects:
    - All subsequent Wave 1–4 plans (depend on tsconfig scope + fflate)
    - tests/ directory (7 new stub files)
tech_stack:
  added:
    - fflate@0.8.2 (production dep — sync zip/unzip for utils/backup.ts)
  patterns:
    - tsconfig.migrated.json extends base tsconfig with noImplicitAny:true (D-11-05)
    - describe.skipIf(!FIXTURE_EXISTS) guard pattern for fixture-dependent tests
    - Wave 0 placeholder .ts file to keep tsconfig.migrated.json valid before migration
key_files:
  created:
    - tsconfig.migrated.json
    - tests/prognosis.test.ts
    - tests/aggregation.test.ts
    - tests/backup.test.ts
    - tests/spider.test.ts
    - tests/feedback.test.ts
    - tests/parseStage.test.ts
    - tests/excel.test.ts
    - tests/fixtures/.gitkeep
    - utils/placeholder.ts
  modified:
    - tsconfig.json (include array extended)
    - package.json (typecheck-migrated script added, fflate added)
    - package-lock.json
decisions:
  - "utils/placeholder.ts: Wave 0 stub to satisfy tsconfig.migrated.json (TS18003 fires on empty include); removed in Wave 1 when utils/schema.ts is created"
  - "parseStage.test.ts: unconditional pdf module import removed (DOMMatrix not in jsdom); both tests placed inside skipIf guard"
  - "excel.test.ts: parseExcelFile function check kept as unconditional test (expected to fail in Wave 0 — parsers/excel.js uses window.* globals, not named exports)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tasks_total: 3
  files_created: 10
  files_modified: 3
---

# Phase 11 Plan 01: Wave 0 Prerequisites Summary

Wave 0 toolchain voor TypeScript migratie is klaar: tsconfig uitgebreid, tsconfig.migrated.json aangemaakt met noImplicitAny:true voor utils/** en parsers/**, npm run typecheck-migrated script toegevoegd, fflate@0.8.2 geïnstalleerd, 7 test stubs aangemaakt met skipIf guards, tests/fixtures/ aangemaakt.

## What Was Built

### Taak 1: tsconfig + fflate (commit 7c207aa)

**tsconfig.json** — `"include"` uitgebreid van `["src"]` naar `["src", "utils", "parsers", "tests"]`. Alle bestaande `compilerOptions` ongewijzigd (`strict: false`, `noImplicitAny: false`).

**tsconfig.migrated.json** — Nieuw bestand dat `./tsconfig.json` erft en overschrijft met:
- `"include": ["utils/**/*.ts", "parsers/**/*.ts"]` — alleen gemigreerde modules
- `"compilerOptions": { "noImplicitAny": true, "noEmit": true }` — implementeert D-11-05

**package.json** — Script `"typecheck-migrated": "tsc --noEmit --project tsconfig.migrated.json"` toegevoegd.

**fflate@0.8.2** — Geïnstalleerd als productie dependency (niet devDependency) voor `utils/backup.ts` zip operaties.

**utils/placeholder.ts** — Wave 0 stub: lege `export {}` om `TS18003: No inputs found` te voorkomen wanneer utils/ nog geen `.ts` bestanden heeft. Wordt verwijderd in Wave 1 wanneer `utils/schema.ts` aangemaakt wordt.

Beide typecheck commands: exit 0.

### Taak 2: Test stubs (commit 27878fb)

**7 test stub-bestanden aangemaakt:**

| File | Tests | Status in Wave 0 |
|------|-------|-----------------|
| `tests/prognosis.test.ts` | 5 | Falen (utils/prognosis.ts niet beschikbaar) |
| `tests/aggregation.test.ts` | 5 | Falen (utils/aggregation.ts niet beschikbaar) |
| `tests/backup.test.ts` | 4 | Falen (utils/backup.ts niet beschikbaar) |
| `tests/spider.test.ts` | 4 | Falen (utils/spider.ts niet beschikbaar) |
| `tests/feedback.test.ts` | 3 | Falen (utils/actiepunten.ts niet beschikbaar) |
| `tests/parseStage.test.ts` | 2 (skipIf) | Overgeslagen (geen fixture) |
| `tests/excel.test.ts` | 3 (2 skipIf) | 1 faalt (geen named export), 2 overgeslagen |

**tests/fixtures/.gitkeep** — Lege map voor fixture bestanden.

**actiepunten.test.js** — 9/9 tests blijven slagen.

## Fixture Beslissing

**Status: Overgeslagen (OPTIE B).**

De tests/fixtures/ map bestaat maar is leeg (alleen .gitkeep). De parser integration tests (`parseStage.test.ts` en `excel.test.ts`) gebruiken `describe.skipIf(!FIXTURE_EXISTS)` en slaan correct over. MIG-01 en MIG-02 worden later geverifieerd via handmatige import na Phase 13.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TS18003: tsconfig.migrated.json faalt op lege include in Wave 0**
- **Found during:** Taak 1 verify (npm run typecheck-migrated)
- **Issue:** TypeScript geeft `TS18003: No inputs were found` wanneer de include paden (`utils/**/*.ts`, `parsers/**/*.ts`) geen bestanden matchen — utils/ en parsers/ bevatten alleen `.js` bestanden in Wave 0
- **Fix:** `utils/placeholder.ts` aangemaakt met `export {}` zodat TypeScript altijd minimaal 1 bestand vindt. Wordt verwijderd in Wave 1.
- **Files modified:** `utils/placeholder.ts` (nieuw)
- **Commit:** 7c207aa

**2. [Rule 1 - Bug] tsconfig.migrated.json include pattern `utils/**` ongeldig**
- **Found during:** Taak 1 verify
- **Issue:** TypeScript geeft `TS5010: File specification cannot end in a recursive directory wildcard ('**')` — bare `**` is niet geldig als eindpunt
- **Fix:** Include gewijzigd naar `["utils/**/*.ts", "parsers/**/*.ts"]` (expliciete `.ts` extensie)
- **Files modified:** `tsconfig.migrated.json`
- **Commit:** 7c207aa

**3. [Rule 1 - Bug] parseStage.test.ts unconditional pdf import veroorzaakte DOMMatrix error**
- **Found during:** Taak 2 verify (npm run test)
- **Issue:** De originele test had een onbeveiligd `describe('parsers/pdf module', ...)` blok dat `parsers/pdf.js` importeerde. Dit triggerde `DOMMatrix is not defined` omdat pdfjs deze browser API vereist — niet beschikbaar in jsdom
- **Fix:** Het unconditional describe blok verwijderd; beide tests verplaatst naar het skipIf blok. Dit past bij de plan intentie (fixture-only tests)
- **Files modified:** `tests/parseStage.test.ts`
- **Commit:** 27878fb

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `utils/placeholder.ts` — `export {}` | `utils/placeholder.ts` | Wave 0 workaround voor TS18003; removed in Wave 1 |

## Self-Check

**Files exist:**
- tsconfig.migrated.json ✓
- utils/placeholder.ts ✓
- tests/prognosis.test.ts ✓
- tests/aggregation.test.ts ✓
- tests/backup.test.ts ✓
- tests/spider.test.ts ✓
- tests/feedback.test.ts ✓
- tests/parseStage.test.ts ✓
- tests/excel.test.ts ✓
- tests/fixtures/.gitkeep ✓

**Commits exist:**
- 7c207aa (Taak 1: tsconfig + fflate) ✓
- 27878fb (Taak 2: test stubs) ✓

## Self-Check: PASSED
