---
phase: 11-typescript-migratie
plan: "05"
subsystem: parsers
tags: [typescript, migration, wave-2, pdf-parser, excel-parser, window-globals, sheetjs, pdfjs]
dependency_graph:
  requires:
    - 11-01 (tsconfig.migrated.json, typecheck-migrated script)
    - 11-02 (utils/schema.ts: DEELGEBIEDEN, normalizeScore exports)
    - 11-03 (utils/klassen.ts, actiepunten.ts, prognosis.ts)
  provides:
    - parsers/pdf.ts (named ESM export: parseSinglePDF + utilities)
    - parsers/excel.ts (named ESM exports: parseVerzuimTime, parseExcelFile, debugExcelBestand)
  affects:
    - Plan 06 (tests/parseStage.test.ts imports parseSinglePDF from parsers/pdf)
    - Plan 06 (tests use parseExcelFile, parseVerzuimTime from parsers/excel)
tech_stack:
  added: []
  patterns:
    - "Pattern B: window.* removal (pdf.ts — 5 occurrences, excel.ts — 3 function assignments)"
    - "Pattern 3: Cross-file window dependency replacement (window.DEELGEBIEDEN → import from schema)"
    - "Pattern 4: explicit : any for pdfjs vendor API calls (as any cast on pdfjsLib)"
    - "Pattern 5: Vendor import with @ts-ignore (pdf.min.mjs has no .d.ts)"
    - "cpexcel module-load registration for Dutch character encoding (MIG-02)"
    - "file.arrayBuffer() replaces FileReader pattern in parseExcelFile"
key_files:
  created:
    - parsers/pdf.ts
    - parsers/excel.ts
  modified: []
  deleted:
    - parsers/pdf.js
    - parsers/excel.js
decisions:
  - "pdf.ts: @ts-ignore on vendor import + (pdfjsLib as any) casts — pdfjs-dist vendor bundle has no .d.ts"
  - "excel.ts: cpexcel registered at module load (not inside function) — required for correct Dutch chars before any XLSX.read call"
  - "excel.ts: file.arrayBuffer() used instead of FileReader — modern API, cleaner async"
  - "excel.ts: typeof XLSX === 'undefined' guard removed — redundant with ESM import"
  - "Both parsers: all function parameters typed explicitly (noImplicitAny compliance via tsconfig.migrated.json)"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
  files_deleted: 2
---

# Phase 11 Plan 05: Parser Migratie Summary

Beide parsers gemigreerd van JavaScript naar TypeScript: pdf.ts importeert DEELGEBIEDEN en normalizeScore als named exports van utils/schema; excel.ts vervangt window.XLSX CDN-aanname door directe npm import met cpexcel registratie bij module load.

## What Was Built

### Taak 1: parsers/pdf.js → parsers/pdf.ts (commit 7f6b90b)

**Gemigreerde bestanden:** `parsers/pdf.js` → `parsers/pdf.ts`

**window.* vervangingen (5 occurrences):**

| Locatie | Voor | Na |
|---------|------|-----|
| isHeaderRow() | `window.DEELGEBIEDEN.map(...)` | `DEELGEBIEDEN.map(...)` |
| buildColumnMap() | `window.DEELGEBIEDEN.map(...)` | `DEELGEBIEDEN.map(...)` |
| buildColumnMap() | `window.DEELGEBIEDEN[dgIdx].label` | `DEELGEBIEDEN[dgIdx].label` |
| parseDeelgebiedTable() | `window.normalizeScore(item.str)` | `normalizeScore(item.str)` |
| parseDeelgebiedTable() | `for (const dg of window.DEELGEBIEDEN)` | `for (const dg of DEELGEBIEDEN)` |

**window.* assignments verwijderd (regels 751-761):**
- `window.parseSinglePDF = parseSinglePDF` (en 9 andere)
- De bestaande export block (regels 725-748) intact gelaten

**Toegevoegde imports (bovenaan):**
```typescript
// @ts-ignore — vendor bundle heeft geen TypeScript declaraties; pdfjs-dist npm types gelden hier niet
import * as pdfjsLib from '../vendor/pdf.min.mjs';
import { DEELGEBIEDEN, normalizeScore } from '../utils/schema';
```

**TypeScript as any casts voor pdfjs vendor API:**
- `(pdfjsLib as any).GlobalWorkerOptions.workerSrc = ...`
- `(pdfjsLib as any).getDocument({ data: arrayBuffer }).promise`
- `(pdfjsLib as any).version`

**Expliciete parameter types (noImplicitAny):**
- `extractAllTextItems(file: File): Promise<any[]>`
- `groupIntoLines(items: any[], tolerance: number = Y_TOLERANCE): any[][]`
- `lineToText(line: any[]): string`
- `matchStatus(text: string): string`
- `extractHeader(lines: any[][]): { naam: string; ... }`
- `detectHeadingThreshold(lines: any[][]): number`
- `looksLikeOpdracht(text: string): boolean`
- `parseVakSections(lines: any[][]): Array<...>`
- `isHeaderRow(line: any[]): boolean`
- `findDeelgebiedSection(lines: any[][]): number`
- `buildColumnMap(headerLine: any[]): Record<string, number>`
- `assignScoreToColumn(item: { str: string; x: number }, columnMap: Record<string, number>): string | null`
- `parseDeelgebiedTable(lines: any[][], startIndex: number): { datapunten: any[]; deelgebiedScores: Record<string, string | null> }`
- `parseSinglePDF(file: File): Promise<any>`

**Resultaat:** typecheck-migrated exit 0; typecheck exit 0 (voor parsers/).

---

### Taak 2: parsers/excel.js → parsers/excel.ts (commit 6088107)

**Gemigreerde bestanden:** `parsers/excel.js` → `parsers/excel.ts`

**window.* vervangingen (3 functie-assignments + 1 guard):**
- `window.parseVerzuimTime = function(str)` → `export function parseVerzuimTime(str: unknown): number`
- `window.parseExcelFile = async function(file)` → `export async function parseExcelFile(file: File): Promise<any[]>`
- `window.debugExcelBestand = async function(file)` → `export async function debugExcelBestand(file: File): Promise<void>`
- `if (typeof XLSX === 'undefined') { throw ... }` — verwijderd (niet nodig met ESM import)

**Toegevoegde imports (bovenaan):**
```typescript
import * as XLSX from 'xlsx';
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';

// Registreer cpexcel bij module load voor correcte Nederlandse tekens (cp1252)
XLSX.set_cptable((cpexcel as any).cptable);
```

**FileReader → file.arrayBuffer():**
- Verwijderd: `new Promise(function(resolve, reject) { const reader = new FileReader(); ... })`
- Vervangen door: `const arrayBuffer = await file.arrayBuffer();`

**TypeScript XLSX.read argument type:** `new Uint8Array(arrayBuffer)` — geen TypeScript-klacht ontvangen; SheetJS types accepteren `Uint8Array` in `{ type: 'array' }` modus.

**Expliciete parameter types (noImplicitAny):**
- `parseVerzuimTime(str: unknown): number`
- `debugExcelBestand(file: File): Promise<void>`
- `parseExcelFile(file: File): Promise<any[]>`
- `kolom(rowObj: Record<string, any>, kandidaten: string[]): any`
- Alle `forEach` callbacks: `(name: string)`, `(r: any, i: number)`, `(c: string)`, `(k: string)`, `(h: any)`, `(c: any)`

**Resultaat:** typecheck-migrated exit 0; typecheck exit 0 (voor parsers/).

## TypeScript Errors gevonden en opgelost

Geen TypeScript compile-errors tijdens migratie:
- pdf.ts compileerde clean met `@ts-ignore` + `as any` voor pdfjs vendor API calls
- excel.ts compileerde clean; SheetJS heeft ingebouwde types (`xlsx/types/index.d.ts`)
- `(cpexcel as any).cptable` — cpexcel heeft geen .d.ts maar `as any` voorkomt type error

## window.* verwijderd per bestand

| Bestand | window.* regels verwijderd |
|---------|---------------------------|
| pdf.ts | 5 (cross-file) + 11 (assignments blok 751-761) = 16 |
| excel.ts | 3 (functie-assignments) + 1 (typeof guard) = 4 |
| **Totaal** | **20** |

## npm run typecheck-migrated resultaat

Exit 0 na beide taken. `tsconfig.migrated.json` (noImplicitAny:true, includes utils/**, parsers/**) valideert beide parsers zonder errors.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Overige opmerkingen

- console.log calls bijgewerkt van `[pdf.js]` naar `[pdf.ts]` en `[excel.js]` naar `[excel.ts]` — dit is een cosmetische verbetering consistent met de bestandshernoeming, niet een functionele wijziging.
- `currentY!` non-null assertion in `groupIntoLines` — TypeScript inferreert `currentY` als `number | null` maar de logica garandeert niet-null op dat punt; `!` operator is correct hier.

## Known Stubs

None — beide bestanden zijn volledig gemigreerd. Geen placeholder implementaties of hardcoded lege waarden.

## Threat Flags

Geen nieuwe security-relevante surfaces gevonden buiten het plan:
- T-11-05-02 (XLSX.read try-catch) — aanwezig in parseExcelFile (regel: `try { workbook = XLSX.read(...) } catch (err: any) { throw new Error(...) }`) ✓
- T-11-05-01 en T-11-05-03 — accepted, geen mitigatie vereist ✓

## Self-Check

**Files exist:**
- parsers/pdf.ts ✓
- parsers/excel.ts ✓
- parsers/pdf.js — verwijderd ✓
- parsers/excel.js — verwijderd ✓

**Commits exist:**
- 7f6b90b (Taak 1: pdf.js → pdf.ts) ✓
- 6088107 (Taak 2: excel.js → excel.ts) ✓

**npm run typecheck:** exit 0 (geen errors in parsers/) ✓
**npm run typecheck-migrated:** exit 0 ✓
**window.* in parsers/pdf.ts:** 0 ✓
**window.* in parsers/excel.ts:** 0 ✓
**import { DEELGEBIEDEN, normalizeScore } from '../utils/schema':** aanwezig in pdf.ts ✓
**import * as XLSX from 'xlsx':** aanwezig in excel.ts ✓
**XLSX.set_cptable:** aanwezig in excel.ts (module-level) ✓

## Self-Check: PASSED
