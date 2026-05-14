---
phase: 11-typescript-migratie
plan: "02"
subsystem: utils / domain-layer
tags: [typescript, migration, wave-1, schema, datamodel, leerlijnen, window-globals]
dependency_graph:
  requires:
    - 11-01 (tsconfig.migrated.json, typecheck-migrated script, fflate)
  provides:
    - utils/schema.ts (named ES module exports: DEELGEBIEDEN, SCORE_LEVELS, detectColumnMapping, normalizeScore)
    - utils/datamodel.ts (named ES module exports: appState, addStudent, saveState, loadState, clearState, normalizeNaam, mergeVerzuim, getVerzuim)
    - utils/leerlijnen.ts (named ES module exports: getLeerlijnenMapping, saveLeerlijnenMapping, resetLeerlijnenMapping; imports DEELGEBIEDEN from ./schema)
  affects:
    - Plan 03 (klassen.ts, actiepunten.ts, prognosis.ts — all import from datamodel/schema/leerlijnen)
    - Plan 04 (parsers/pdf.ts imports DEELGEBIEDEN, normalizeScore from schema)
    - actiepunten.test.js (update in Plan 05 — will import appState from datamodel)
tech_stack:
  added: []
  patterns:
    - "Pattern B: window.* removal without IIFE (schema.ts, datamodel.ts)"
    - "Pattern A: IIFE removal + window.* removal (leerlijnen.ts)"
    - "Pattern 4: explicit : any for all parameters (noImplicitAny compliance)"
    - "Deelgebied interface + ScoreLevel type alias added to schema.ts"
key_files:
  created:
    - utils/schema.ts
    - utils/datamodel.ts
    - utils/leerlijnen.ts
  modified: []
  deleted:
    - utils/schema.js
    - utils/datamodel.js
    - utils/leerlijnen.js
    - utils/placeholder.ts
decisions:
  - "schema.ts: added Deelgebied interface + ScoreLevel type alias (not just bare exports) — enables proper typing in Plan 03+"
  - "datamodel.ts: debugVerzuimKoppeling and getStudentScores (window.*) omitted — debug helper and unused function not in plan exports contract"
  - "leerlijnen.ts: saveLeerlijnenMapping typed as (mapping: any): boolean per plan spec — keeps flexibility for Plan 03 callers"
  - "utils/placeholder.ts deleted in same commit as schema.ts (no longer needed)"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-14"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 0
  files_deleted: 4
---

# Phase 11 Plan 02: Wave 1 Bodem-laag Migratie Summary

Drie bodem-laag utils gemigreerd van JavaScript naar TypeScript: schema.ts, datamodel.ts en leerlijnen.ts — alle drie zonder window.* globals, met named ES module exports, TypeScript-compileerbaar met noImplicitAny:true.

## What Was Built

### Taak 1: utils/schema.js → utils/schema.ts (commit 56ab23b)

**Gemigreerde bestanden:** `utils/schema.js` → `utils/schema.ts`

**Verwijderde window.* regels (4):**
- `window.SCORE_LEVELS = SCORE_LEVELS`
- `window.DEELGEBIEDEN = DEELGEBIEDEN`
- `window.detectColumnMapping = detectColumnMapping`
- `window.normalizeScore = normalizeScore`

**TypeScript toevoegingen:**
- `export interface Deelgebied { id: string; label: string; group: 'lesgeven' | 'organiseren' | 'prof_handelen' }`
- `export type ScoreLevel = typeof SCORE_LEVELS[number]`
- `export const SCORE_LEVELS = [...] as const`
- `export const DEELGEBIEDEN: Deelgebied[] = [...]`
- `export function detectColumnMapping(headers: string[]): Record<string, { mappedTo: string | null; confidence: string }>`
- `export function normalizeScore(raw: unknown): string | null`

**utils/placeholder.ts** verwijderd in dezelfde commit (Wave 0 stub niet meer nodig).

**Resultaat:** typecheck-migrated exit 0.

---

### Taak 2: utils/datamodel.js → utils/datamodel.ts (commit 9f55419)

**Gemigreerde bestanden:** `utils/datamodel.js` → `utils/datamodel.ts`

**Verwijderde window.* regels (10):**
- `window.appState = {...}` → `export const appState = {...}`
- `window.addStudent = function` → `export function addStudent(student: any): void`
- `window.saveState = function` → `export function saveState(): boolean`
- `window.loadState = function` → `export function loadState(): boolean`
- `window.clearState = function` → `export function clearState(): void`
- `window.normalizeNaam = function` → `export function normalizeNaam(naam: string): string`
- `window.mergeVerzuim = function` → `export function mergeVerzuim(verzuimRecords: any[]): { matched: number; unmatched: string[] }`
- `window.getVerzuim = function` → `export function getVerzuim(leerlingId: string): any`
- `window.debugVerzuimKoppeling` — debug helper, niet geëxporteerd (omitted)
- `window.getStudentScores` — niet in exports contract, niet geëxporteerd (omitted)

**Interne window.appState self-referenties (8 locaties):** vervangen door `appState` (lokale export).
**Interne window.normalizeNaam calls (3 locaties):** vervangen door `normalizeNaam` (lokale functie).

**appState:** mutable export (niet frozen) — `{ students: [] as any[], lastImportErrors: [] as any[], importing: false }` — tests kunnen `appState.students = [...]` schrijven.

**Resultaat:** typecheck-migrated exit 0; actiepunten tests 9/9 groen.

---

### Taak 3: utils/leerlijnen.js → utils/leerlijnen.ts (commit 44d566b)

**Gemigreerde bestanden:** `utils/leerlijnen.js` → `utils/leerlijnen.ts`

**Verwijderde window.* regels (5):**
- `(function() {` — IIFE opening verwijderd
- `})();` — IIFE sluiting verwijderd
- `window.DEELGEBIEDEN` (×2 in buildDefault + isValid) → `DEELGEBIEDEN` (geïmporteerd)
- `window.getLeerlijnenMapping = function()` → `export function getLeerlijnenMapping(): Record<string, string>`
- `window.saveLeerlijnenMapping = function(mapping)` → `export function saveLeerlijnenMapping(mapping: any): boolean`
- `window.resetLeerlijnenMapping = function()` → `export function resetLeerlijnenMapping(): void`

**Toegevoegde import (eerste regel):**
```typescript
import { DEELGEBIEDEN } from './schema';
```

**var → let/const conversies:**
- `var STORAGE_KEY` → `const STORAGE_KEY`
- `var _cachedMapping = null` → `let _cachedMapping: Record<string, string> | null = null`

**Expliciete types:**
- `buildDefault(): Record<string, string>`
- `isValid(mapping: any): boolean`
- `reduce callback: (m: Record<string, string>, dg: any) => Record<string, string>`

**Resultaat:** typecheck-migrated exit 0; actiepunten tests 9/9 groen.

## Test Resultaten

| Test Run | Passing | Failing | Skipped | Notes |
|----------|---------|---------|---------|-------|
| Na Taak 1 | 9 | 9 | 4 | Stubs falen (prognosis/aggregation/etc. niet beschikbaar) — pre-existing |
| Na Taak 2 | 9 | 9 | 4 | Zelfde — geen nieuwe failures |
| Na Taak 3 | 9 | 9 | 4 | Zelfde — geen nieuwe failures |

De 9 failing tests zijn stub-bestanden van Plan 01 die modules verwachten die pas in Plans 03–05 worden aangemaakt (aggregation.ts, backup.ts, spider.ts, prognosis.ts). De 9 passing tests zijn `actiepunten.test.js` — ongewijzigd.

## TypeScript Errors gevonden en opgelost

Geen TypeScript compile-errors tijdens migratie — alle drie bestanden compileren direct clean met noImplicitAny:true doordat alle parameters expliciete types kregen bij het schrijven van de .ts bestanden.

## window.* verwijderd per bestand

| Bestand | window.* regels verwijderd |
|---------|---------------------------|
| schema.ts | 4 (SCORE_LEVELS, DEELGEBIEDEN, detectColumnMapping, normalizeScore) |
| datamodel.ts | 10 (appState + 7 functies + debugVerzuimKoppeling + getStudentScores) |
| leerlijnen.ts | 5 (IIFE + 2x DEELGEBIEDEN + 3 functies) |
| **Totaal** | **19** |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Overige opmerkingen

- `window.debugVerzuimKoppeling` en `window.getStudentScores` uit datamodel.js zijn niet gemigreerd naar datamodel.ts: beide zijn niet in het exports contract van Plan 02 en zijn respectievelijk een debug-only helper en een ongebruikte functie. Als app.js deze later nodig heeft worden ze toegevoegd in een later plan.
- `utils/placeholder.ts` verwijderd als onderdeel van Taak 1 (niet als aparte taak) — dit is correct want placeholder was alleen nodig zolang utils/ geen .ts bestanden had.

## Known Stubs

None — alle drie bestanden zijn volledig gemigreerd. Geen placeholder implementaties.

## Threat Flags

None — geen nieuwe security-relevante surfaces. De twee geaccepteerde threats uit het plan (T-11-02-01: appState tampering in-memory; T-11-02-02: leerlijnen localStorage) zijn correct gedocumenteerd en accepted.

## Self-Check

**Files exist:**
- utils/schema.ts ✓
- utils/datamodel.ts ✓
- utils/leerlijnen.ts ✓
- utils/schema.js — verwijderd ✓
- utils/datamodel.js — verwijderd ✓
- utils/leerlijnen.js — verwijderd ✓
- utils/placeholder.ts — verwijderd ✓

**Commits exist:**
- 56ab23b (Taak 1: schema.js → schema.ts + delete placeholder.ts) ✓
- 9f55419 (Taak 2: datamodel.js → datamodel.ts) ✓
- 44d566b (Taak 3: leerlijnen.js → leerlijnen.ts) ✓

**npm run typecheck-migrated:** exit 0 ✓
**npm run test actiepunten:** 9/9 ✓
**window.* in migrated files:** 0 ✓

## Self-Check: PASSED
