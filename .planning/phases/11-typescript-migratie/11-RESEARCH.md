# Phase 11: TypeScript Migratie — Research

**Onderzocht:** 2026-05-13
**Domein:** TypeScript migratie van JavaScript utility modules en parsers
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-11-01:** Rename `.js` → `.ts` in-place — geen `.js` bestand naast de `.ts` houden
- **D-11-02:** IIFE wrappers en `window.*` assignments verwijderen; vervangen door named ES module exports (`export function`, `export const`)
- **D-11-03:** Test files overschakelen naar ESM import syntax — geen `require()`, geen `global.window = global`
- **D-11-04:** `schema.ts` exporteert `DEELGEBIEDEN` en `SCORE_LEVELS` als named exports; `prognosis.ts` importeert `DEELGEBIEDEN` van `'./schema'`
- **D-11-05:** TypeScript strictness: `noImplicitAny: true` per gemigreerd bestand — NIET `strictNullChecks`, NIET `strict: true` globaal
- **D-11-06:** `vendor/pdf.min.mjs` en `vendor/pdf.worker.min.mjs` blijven ongewijzigd; alleen `parsers/pdf.ts` verandert
- **D-11-07:** `app.js` is dead code — geen `window.*` bridging layer nodig
- **D-11-08:** SheetJS: `import * as XLSX from 'xlsx'` in `parsers/excel.ts` — vervangt `window.XLSX` global
- **D-11-09:** `parsers/pdf.ts` exposeert dezelfde API als de oude `window.parseSinglePDF` maar als named export
- **D-11-10:** Type packages: install `@types/pdfjs-dist` en `@types/xlsx`; incomplete types casten met `as any`
- **D-11-11:** `tests/actiepunten.test.js` bijgewerkt naar ESM import: `global.window = global` verwijderen, `require('../utils/actiepunten.js')` vervangen door `import { actiepuntenStore, normalizeOnderwerp, isHerhaling } from '../utils/actiepunten'`
- **D-11-12:** Lost utils direct als `.ts` recreëren — geen `.js` tussenversie
- **D-11-13:** Gerecreëerde test files gebruiken `.test.ts` extensie
- **D-11-14:** Test gedrag reconstructed van `app.js` (behavior-driven)
- **D-11-15:** Target ~128 totaal passing tests
- **D-11-16:** Zip support hersteld via `fflate` (npm) — vervangt verloren `vendor/zip.min.js`; `utils/backup.ts` importeert van `fflate`
- **D-11-17:** `parsers/pdf.ts` en `parsers/excel.ts` tests gebruiken fixture files in `tests/fixtures/` — klein `.pdf` en `.xls` bestand committed in de repo
- **D-11-18:** `tests/parseToetsplan.test.ts` NIET herschreven — `parseToetsplan` is bewust verwijderd in Phase 8
- **D-11-19:** MigratiEvolgorde: `schema.ts` → `utils/*.ts` (prognosis, datamodel, klassen, leerlijnen, actiepunten) → verloren utils recreëren (aggregation, backup, spider) → `parsers/*.ts` → tests
- **D-11-20:** Alle bestanden gemigreerd in Phase 11
- **D-11-21:** Type fouten strategie: `as any` met `// TODO: type` comment; doel is nul compile errors en slagende tests, niet perfecte types

### Claude's Discretion

- Exacte TypeScript interface shapes voor interne data structuren (StudentRecord, KlasData, etc.) — gebruik `as any` initieel en voeg interfaces toe waar voor de hand liggend
- `types/index.ts` barrel aanmaken voor gedeelde types of inline per module
- fflate API keuze (sync `strToU8`/`zipSync` vs async) — gebruik sync vanwege eenvoud

### Deferred Ideas (OUT OF SCOPE)

- Full `strict: true` (strictNullChecks, etc.) — uitgesteld naar post-v2.0
- `types/index.ts` barrel met volledige interface definities — kan incrementeel worden toegevoegd
- E2E test met echte PDF bestanden groter dan de minimale fixture — Phase 13 thuis
- `app.js` migreren — dead code
- `index.html.bak` of `index.html` migreren — React vervangt HTML entry in Phase 14
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Beschrijving | Research Ondersteuning |
|----|-------------|------------------------|
| MIG-01 | PDF-parser (pdfjs-dist) geeft identieke resultaten na TypeScript-migratie | pdfjs-dist 5.5.207 bundled in vendor — import path `'../vendor/pdf.min.mjs'` werkt al in pdf.js; vendor geeft geen TypeScript types, dus `as any` voor `pdfjsLib.GlobalWorkerOptions` en `getDocument` return types |
| MIG-02 | Excel-parser (.xls SheetJS) geeft identieke resultaten incl. correcte Nederlandse tekens | SheetJS 0.20.3 geïnstalleerd; `import * as XLSX from 'xlsx'` werkt (ESM export via `xlsx.mjs`); types ingebouwd in `xlsx/types/index.d.ts`; cpexcel registratie via `import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs'` en `XLSX.set_cptable(cpexcel.cptable)` |
| MIG-03 | Doorstroomnorm engine (prognosis.js) geeft identieke berekeningen na TypeScript-migratie | prognosis.js bevat IIFE + `window.berekenPrognose`; migratie = IIFE verwijderen + `window.DEELGEBIEDEN` vervangen door import van `'./schema'` + named export toevoegen |
</phase_requirements>

---

## Summary

Phase 11 is een in-place JavaScript-naar-TypeScript migratie van 8 bestaande bestanden (6 utils, 2 parsers), de recreatie van 3 verloren utility modules (aggregation, backup, spider), en het herschrijven van 7 verloren test files als `.test.ts`. De bestaande Vitest-infrastructuur (Phase 10) ondersteunt al `.test.ts` bestanden — geen configuratiewijzigingen nodig.

Het grootste technische risico zit in drie gebieden: (1) de `window.*` global dependencies in `prognosis.js` — in het bijzonder `window.DEELGEBIEDEN` dat vervangen moet worden door een ESM import, en `window.getLeerlijnenMapping` dat een optionele parameter wordt; (2) de `parsers/pdf.js` gebruikt al `window.DEELGEBIEDEN` en `window.normalizeScore` intern die ook omgezet moeten worden naar imports; (3) het recreëren van `utils/aggregation.ts`, `utils/backup.ts`, en `utils/spider.ts` zonder de originele broncode — de API contracten zijn aantoonbaar uit `app.js`.

Het tsconfig.json `include: ["src"]` path is een **blocker** voor typecheck: utils, parsers, en tests vallen buiten `src/`. Dit moet worden uitgebreid naar `["src", "utils", "parsers", "tests"]` voordat `npm run typecheck` de gemigreerde modules valideert.

**Primaire aanbeveling:** Bottom-up migratievolgorde als gespecificeerd in D-11-19; begin met `schema.ts` (geen IIFE, eenvoudigste bestand) om het exportpatroon te valideren vóór de complexere modules.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Doorstroomnorm berekening | Utility module (utils/prognosis.ts) | — | Pure business logica, geen UI/storage |
| PDF tekst extractie | Utility module (parsers/pdf.ts) | Vendor (pdf.min.mjs) | Parser is thin wrapper; vendor uitvoert de extractie |
| Excel parsing + verzuim | Utility module (parsers/excel.ts) | SheetJS (xlsx) | Parser mapt raw rows naar domeinobjecten |
| Backup zip aanmaken | Utility module (utils/backup.ts) | fflate | Backup is gebruikersactie, pure transform |
| Spider chart wiskunde | Utility module (utils/spider.ts) | — | Pure SVG path berekening, geen IO |
| Score aggregatie | Utility module (utils/aggregation.ts) | — | Modus-berekening over datapunten |
| Multi-klas state | Utility module (utils/klassen.ts) | localStorage (tijdelijk) | Phase 12 vervangt localStorage door plugin-store |
| In-memory data model | Utility module (utils/datamodel.ts) | localStorage (tijdelijk) | Zelfde — Phase 12 vervangt |
| Actiepunten opslag | Utility module (utils/actiepunten.ts) | — | Werkt op StudentRecord in memory |

---

## Standard Stack

### Core (reeds geïnstalleerd)

| Library | Versie | Doel | Waarom Standaard |
|---------|--------|------|-----------------|
| TypeScript | ~5.8.0 | Type checking, transpilatie | Al in package.json; tsconfig aanwezig |
| Vitest | ^4.1.6 | Test runner | Al geconfigureerd; ondersteunt `.test.ts` |
| xlsx (SheetJS) | 0.20.3 | Excel parsing | Al geïnstalleerd via CDN tarball |

[VERIFIED: npm view xlsx version, node_modules/xlsx/package.json]

### Te Installeren

| Library | Versie | Doel | Waarom |
|---------|--------|------|--------|
| fflate | ^0.8.2 | Zip aanmaken/uitpakken | Vervangt verloren `vendor/zip.min.js`; TypeScript types ingebouwd; 8 kB; pure ESM |
| pdfjs-dist | niet nodig | — | Vendor pdf.min.mjs (v5.5.207) al aanwezig; NIET npm installeren, want vendor blijft as-is |

[VERIFIED: npm view fflate version — 0.8.2]

### Type Packages — Correctie op D-11-10

**Belangrijk:** D-11-10 zegt `@types/pdfjs-dist` installeren. Dit is **onjuist** — `@types/pdfjs-dist` is deprecated en een stub die verwijst naar de ingebouwde types van pdfjs-dist. Het package op npm heeft de melding: "DEPRECATED — pdfjs-dist provides its own type definitions, so you do not need this installed."

- `@types/pdfjs-dist`: **NIET installeren** — deprecated stub [VERIFIED: npm view @types/pdfjs-dist]
- `@types/xlsx`: **NIET installeren** — SheetJS 0.20.3 heeft ingebouwde types in `xlsx/types/index.d.ts` [VERIFIED: node_modules/xlsx/package.json `"types": "types/index.d.ts"`]

Voor `parsers/pdf.ts`: de vendor `pdf.min.mjs` heeft géén `.d.ts` bestand. TypeScript inferring werkt niet. Gebruik `import type * as pdfjsLib from 'pdfjs-dist'` of casten via `as any` voor alle pdfjs API calls. Aanbevolen patroon:

```typescript
// @ts-ignore — vendor bundle heeft geen TypeScript declarations
import * as pdfjsLib from '../vendor/pdf.min.mjs';
```

[VERIFIED: vendor/pdf.min.mjs aanwezig, geen .d.ts naast het bestand; npm view pdfjs-dist types geeft 'types/src/pdf.d.ts' maar dat is voor de npm versie, niet de vendor bundle]

**Installatie:**

```bash
npm install fflate
```

---

## Architecture Patterns

### System Architecture Diagram

```
tests/fixtures/        tests/actiepunten.test.js (bijgewerkt)
  sample.pdf             tests/*.test.ts (herschreven/nieuw)
  sample.xls                |
        |                   |
        v                   v
  parsers/                utils/
    pdf.ts  ←── vendor/pdf.min.mjs (ongewijzigd)
    excel.ts ←── xlsx (npm)
        |
        v
  utils/
    schema.ts          (DEELGEBIEDEN, SCORE_LEVELS — named exports)
    datamodel.ts       (StudentRecord typedefs, appState, addStudent)
    klassen.ts         (klassenState, createKlas, switchActiveKlas)
    leerlijnen.ts      (getLeerlijnenMapping, saveLeerlijnenMapping)
    actiepunten.ts     (actiepuntenStore, normalizeOnderwerp, isHerhaling)
    prognosis.ts  ←─── schema.ts (DEELGEBIEDEN import)
    aggregation.ts     (aggregateDeelgebiedScores — RECREËREN)
    backup.ts     ←─── fflate (zipSync, unzipSync, strToU8, strFromU8)
    spider.ts          (SpiderChart.buildSpiderSVG — RECREËREN)
```

### Recommended Project Structure (na Phase 11)

```
utils/
  schema.ts            # was schema.js — geen IIFE, eenvoudigste migratie
  prognosis.ts         # was prognosis.js — IIFE verwijderen + imports toevoegen
  datamodel.ts         # was datamodel.js — window.* → named exports
  klassen.ts           # was klassen.js — window.* → named exports
  leerlijnen.ts        # was leerlijnen.js — IIFE verwijderen
  actiepunten.ts       # was actiepunten.js — IIFE verwijderen
  aggregation.ts       # NIEUW — gerecreëerd uit app.js gedrag
  backup.ts            # NIEUW — gerecreëerd; fflate API
  spider.ts            # NIEUW — gerecreëerd; SVG berekeningen
parsers/
  pdf.ts               # was pdf.js — window.DEELGEBIEDEN → import + window.* exports verwijderen
  excel.ts             # was excel.js — window.XLSX global → import * as XLSX
tests/
  actiepunten.test.js  # BIJGEWERKT — global.window=global + require → import
  fixtures/
    sample.pdf         # NIEUW — minimaal PDF fixture
    sample.xls         # NIEUW — minimaal XLS fixture
  aggregation.test.ts  # NIEUW — gerecreëerd
  backup.test.ts       # NIEUW — gerecreëerd
  feedback.test.ts     # NIEUW — gerecreëerd
  parseStage.test.ts   # NIEUW — gerecreëerd
  prognosis.test.ts    # NIEUW — gerecreëerd
  spider.test.ts       # NIEUW — gerecreëerd
```

---

## Kritische Bevindingen per Open Vraag

### 1. pdfjs-dist TypeScript Integratie

**Vendored bestand:** `vendor/pdf.min.mjs` bevat pdfjs-dist v5.5.207 (copyright 2024 Mozilla Foundation). [VERIFIED: vendor/pdf.min.mjs header + `pdfjsVersion = 5.5.207`]

**Import werkt al:** `parsers/pdf.js` gebruikt al `import * as pdfjsLib from '../vendor/pdf.min.mjs'` en dit werkt in de Vite build. Voor TypeScript: de vendor bundle heeft geen `.d.ts` declaratie, dus TypeScript kan de types niet infereren.

**Aanbevolen aanpak voor `parsers/pdf.ts`:**
```typescript
// @ts-ignore — vendor bundle zonder TypeScript declaraties; pdfjs-dist npm types gelden hier niet
import * as pdfjsLib from '../vendor/pdf.min.mjs';

// Expliciete cast voor GlobalWorkerOptions
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href;
```

De verwijzingen naar `window.DEELGEBIEDEN` en `window.normalizeScore` in pdf.js moeten worden omgezet naar imports:
```typescript
import { DEELGEBIEDEN, normalizeScore } from '../utils/schema';
```

**`@types/pdfjs-dist` NIET installeren** — deprecated stub. [VERIFIED: npm registry]

### 2. SheetJS TypeScript

**ESM import werkt:** `import * as XLSX from 'xlsx'` werkt in de Vite/TS omgeving omdat `xlsx/package.json` `"exports": { ".": { "import": "./xlsx.mjs" } }` heeft. [VERIFIED: node_modules/xlsx/package.json]

**Types ingebouwd:** `xlsx/types/index.d.ts` is aanwezig en correct. `XLSX.read()`, `XLSX.utils.sheet_to_json<T>()` hebben volledige type signatures. [VERIFIED: node_modules/xlsx/types/index.d.ts]

**cpexcel voor Nederlandse tekens:**
```typescript
import * as XLSX from 'xlsx';
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';

// Registreer VOOR de eerste XLSX.read() aanroep
XLSX.set_cptable(cpexcel.cptable);
```

`xlsx/dist/cpexcel.d.ts` is aanwezig voor de TypeScript import. [VERIFIED: node_modules/xlsx/dist/cpexcel.d.ts aanwezig]

**Mogelijke `as any` cast nodig voor:** `XLSX.read(new Uint8Array(ab), { type: 'array' })` — de `type: 'array'` optie is gedocumenteerd in types maar Uint8Array input kan TypeScript warnings geven. Gebruik `as any` als compiler klaagt.

### 3. fflate API

**Versie:** 0.8.2 (latest). [VERIFIED: npm view fflate version]

**Minimale sync API voor backup:**

```typescript
// Aanmaken (zip)
import { zipSync, strToU8 } from 'fflate';

const payload = JSON.stringify(klassenState);
const zipped: Uint8Array = zipSync({
  'mentordashboard-backup.json': strToU8(payload),
});
// zipped is een Uint8Array die als .zip bestand opgeslagen kan worden

// Uitpakken (unzip)
import { unzipSync, strFromU8 } from 'fflate';

const extracted = unzipSync(zipData); // zipData: Uint8Array
const jsonStr = strFromU8(extracted['mentordashboard-backup.json']);
const restoredState = JSON.parse(jsonStr);
```

[CITED: https://github.com/101arrowz/fflate/blob/master/README.md]

**Sync vs async:** Sync is de juiste keuze (D-11 discretion — confirmed). Backup is gebruikersgetriggerd, niet in een hot loop. `zipSync`/`unzipSync` blokkeren maximaal enkele milliseconden voor de verwachte payload grootte (klassendata JSON).

**Wachtwoord encryptie:** De originele `vendor/zip.min.js` ondersteunde AES encryptie. fflate 0.8.2 ondersteunt **geen AES encryptie** — alleen standaard DEFLATE compressie zonder wachtwoord. De backup-feature zonder wachtwoord werkt volledig. De wachtwoord-optie in de backup UI zal in Phase 11 niet beschikbaar zijn (out of scope: Phase 12 versleuteling).

[ASSUMED: Dat het ontbreken van AES in fflate acceptabel is voor Phase 11 omdat versleuteling pas in Phase 12 (plugin-store + OS keychain) wordt geïmplementeerd]

### 4. IIFE Verwijdering Patronen

In de codebase zijn drie IIFE patronen aanwezig:

**Patroon A — Standaard IIFE (prognosis.js, leerlijnen.js, actiepunten.js):**
```javascript
// VOOR (JavaScript):
(function() {
  function berekenPrognose(student, traject) { ... }
  window.berekenPrognose = berekenPrognose;
})();

// NA (TypeScript):
export function berekenPrognose(student: any, traject: string): any { ... }
```

**Patroon B — Direct window assignment zonder IIFE (schema.js, datamodel.js, klassen.js):**
```javascript
// VOOR:
window.DEELGEBIEDEN = DEELGEBIEDEN;
window.addStudent = function(student) { ... };

// NA:
export { DEELGEBIEDEN };
export function addStudent(student: any): void { ... }
```

**Patroon C — `var` functies inside IIFE (prognosis.js):**
```javascript
// VOOR:
window.berekenPrognose = function(student, traject) { ... };

// NA:
export function berekenPrognose(student: any, traject?: string): any { ... }
```

[VERIFIED: directe analyse van utils/prognosis.js, utils/schema.js, utils/datamodel.js, utils/klassen.js, utils/leerlijnen.js, utils/actiepunten.js]

**Cross-file `window.*` afhankelijkheden te elimineren:**

| Bestand | Afhankelijkheid | Oplossing |
|---------|----------------|-----------|
| prognosis.js | `window.DEELGEBIEDEN` | `import { DEELGEBIEDEN } from './schema'` |
| prognosis.js | `window.getLeerlijnenMapping` | `import { getLeerlijnenMapping } from './leerlijnen'` |
| parsers/pdf.js | `window.DEELGEBIEDEN` | `import { DEELGEBIEDEN } from '../utils/schema'` |
| parsers/pdf.js | `window.normalizeScore` | `import { normalizeScore } from '../utils/schema'` |
| utils/klassen.js | `window.appState` | `import { appState } from './datamodel'` |
| utils/klassen.js | `window.saveState` | `import { saveState } from './datamodel'` |
| utils/actiepunten.js | `window.appState` | `import { appState } from './datamodel'` |
| utils/actiepunten.js | `window.saveState` | `import { saveState } from './datamodel'` |

[VERIFIED: directe analyse van alle bronbestanden]

### 5. Verloren Module Reconstructie (uit app.js)

Uit `app.js` zijn de volgende API contracten aantoonbaar:

**`utils/aggregation.ts`:**
```typescript
// app.js regel 1674-1676:
// window.aggregateDeelgebiedScores(student.datapunten || [])
// retourneert { aggregationDetail: {} }

export function aggregateDeelgebiedScores(
  datapunten: any[]
): { aggregationDetail: Record<string, string | null> }
```
Gedrag: berekent de "modus" score per deelgebied over alle datapunten. SCORE_LEVELS worden gebruikt als ordening.

**`utils/spider.ts`:**
```typescript
// app.js regel 1534, 1553:
// window.SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar)

export const SpiderChart = {
  buildSpiderSVG(
    axes: Array<{ key: string; label: string }>,
    scores: Record<string, string | null>,
    fillVar: string,
    strokeVar: string
  ): string   // retourneert SVG markup string
};
```
Gedrag: genereert een SVG polygon spider chart per leerlijn.

**`utils/backup.ts`:**
```typescript
// app.js regel 841: window.buildBackupPayload()
// app.js regel 945: window.applyBackupRestore(payload, mode)

export function buildBackupPayload(): string  // JSON string van klassenState
export function applyBackupRestore(
  payload: any,
  mode: 'overschrijven' | 'samenvoegen'
): { success: boolean; message: string }
```
Gebruikt fflate (zipSync/unzipSync) intern.

[VERIFIED: grep analyse van app.js regels 722, 841, 945, 1534, 1553, 1674-1676]

**`parsers/parseStage` (voor tests/parseStage.test.ts):**
```typescript
// app.js regel 722, 731:
// window.parseStageFile(file) — async, retourneert records[]
// Wordt alleen gebruikt in app.js voor UI — is dit een aparte parser of deel van pdf.ts?
```
[ASSUMED: `parseStageFile` is een afzonderlijk parser bestand dat stage-specifieke PDFs verwerkt, los van de voortgang-PDFs die parsers/pdf.ts verwerkt. Nader onderzoek in app.js nodig tijdens planning.]

### 6. Test Fixture Strategie

**Strategie voor kleine binaire fixtures in git:**

- `tests/fixtures/sample.pdf`: minimaal geldig PDF (kan programmatisch gegenereerd worden met pdfjs-dist of een tool; ~5 kB)
- `tests/fixtures/sample.xls`: minimaal geldig XLS met één rij verzuimdata en Nederlandse kolomnamen

**Git LFS is NIET nodig** voor fixtures van enkele KB. Direct committen als binair bestand werkt.

**Programmatisch een minimaal PDF maken voor tests:**
Het is eenvoudiger een **echte maar kleine CIOS-structuur PDF** te gebruiken dan een programmatisch gegenereerde. Echter: echte leerlingdata mag niet in de repo. Oplossing: maak een PDF met gefabriceerde naam/leerlingnummer die de exacte tekststructuur van CIOS PDFs nabootst.

**Aanbevolen fixture aanpak:**
- Gebruik een echte CIOS PDF met **geanonimiseerde** data (naam: "Test Leerling", ID: "000000")
- Minimaliseer naar alleen de essentiële secties (header + Overzicht Deelgebieden tabel)
- Commit als `tests/fixtures/sample-voortgang.pdf` en `tests/fixtures/sample-verzuim.xls`

[ASSUMED: Dat een geanonimiseerde echte PDF beschikbaar is of eenvoudig te maken is. Als dit niet beschikbaar is, moeten de parser tests worden geschreven als "integration tests met skip wanneer fixture ontbreekt".]

### 7. Vitest + TypeScript

**vitest.config.ts:** `include: ['tests/**/*.test.{js,ts}']` — ondersteunt al `.test.ts`. [VERIFIED: vitest.config.ts]

**tsconfig.json blocker:** `"include": ["src"]` bevat alleen de React app. Vitest/TypeScript ziet `utils/`, `parsers/`, en `tests/` **niet** tenzij tsconfig wordt uitgebreid.

**Vereiste tsconfig wijziging:**
```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  },
  "include": ["src", "utils", "parsers", "tests"]
}
```

Alternatief: maak een `tsconfig.test.json` die `"extends": "./tsconfig.json"` met een uitgebreide `include` voor testpaden.

**noImplicitAny per-bestand:** D-11-05 zegt "per migrated file only". De tsconfig globaal heeft `noImplicitAny: false`. Per-bestand activering gebeurt door een comment bovenaan elk gemigreerd bestand:

```typescript
// @ts-nocheck is NIET wat we willen — dat schakelt alle checks uit
// Gebruik in plaats daarvan: voeg gewoon TypeScript types toe en laat de globale tsconfig
// (noImplicitAny: false) toe dat ongetypeerde variabelen werken.
// Als je strenger wilt per bestand, voeg expliciet toe:
// /* noImplicitAny: true */ — maar dit werkt NIET als comment; alleen in tsconfig
```

**Correctie op D-11-05:** TypeScript heeft geen "per-bestand `noImplicitAny`" via commentaren (in tegenstelling tot JSDoc `@ts-check`). De oplossing is:
- Globale tsconfig: `noImplicitAny: false` (al zo geconfigureerd)
- Schrijf types zoveel mogelijk explicieter
- Gebruik `as any` voor harde cases met `// TODO: type` comment

[VERIFIED: tsconfig.json gelezen, TypeScript 5.8 documentatie [ASSUMED]]

### 8. parsers/pdf.js — Minimale Wijzigingen voor .ts conversie

De huidige `parsers/pdf.js` is al grotendeels module-ready:
- Gebruikt al ESM imports (`import * as pdfjsLib from '../vendor/pdf.min.mjs'`)
- Heeft al `export { parseSinglePDF, ... }` statements
- Heeft `window.*` assignments onderaan (regels 751-762) — deze verwijderen

**Minimale wijzigingen:**
1. Hernoem `.js` → `.ts`
2. Voeg toe bovenaan: `import { DEELGEBIEDEN, normalizeScore } from '../utils/schema';`
3. Vervang `window.DEELGEBIEDEN` door `DEELGEBIEDEN` (2 plaatsen: `isHeaderRow()` en `buildColumnMap()`)
4. Vervang `window.normalizeScore` door `normalizeScore` (1 plaats: `parseDeelgebiedTable()`)
5. Verwijder alle `window.*` assignments (regels 751-762)
6. Voeg `// @ts-ignore` toe voor de pdfjs vendor import (geen types)
7. Casten met `as any` voor pdfjs API calls die TypeScript niet kent

[VERIFIED: directe analyse parsers/pdf.js]

---

## Don't Hand-Roll

| Probleem | Niet Zelf Bouwen | Gebruik | Reden |
|----------|-----------------|---------|-------|
| ZIP aanmaken/uitpakken | Eigen zip implementatie | fflate `zipSync`/`unzipSync` | DEFLATE edge cases, CRC berekeningen, correcte ZIP format |
| Excel parsing | Eigen XLS reader | SheetJS (al geïnstalleerd) | XLS binary format is complex; codepage handling voor Nederlandse tekens |
| PDF text extractie | Eigen PDF parser | pdfjs-dist vendor bundle | PDF is een zeer complex formaat |
| TypeScript type generatie | Eigen type inferentie | `as any` + TODO comment | Phase 11 doel is nul compile errors, niet perfecte types |

---

## Common Pitfalls

### Pitfall 1: tsconfig `include` te smal

**Wat gaat fout:** `npm run typecheck` rapporteert 0 fouten maar heeft geen enkel gemigreerd bestand gecheckt — omdat `tsconfig.json` `include: ["src"]` heeft en `utils/`, `parsers/`, `tests/` er buiten vallen.

**Waarom:** Tauri react-ts scaffold genereerde een tsconfig voor alleen de React app in `src/`.

**Hoe voorkomen:** Eerste taak van Wave 0: update tsconfig.json om `utils`, `parsers`, `tests` toe te voegen aan `include`.

**Waarschuwingssignalen:** `npm run typecheck` geeft 0 errors na toevoegen van bestanden met bekende type fouten.

### Pitfall 2: `window.DEELGEBIEDEN` in parsers/pdf.ts vergeten

**Wat gaat fout:** `parsers/pdf.ts` compileert zonder fouten in TypeScript (want `window` heeft type `any` globals) maar gooit een runtime fout: `Cannot read properties of undefined (reading 'map')` wanneer `window.DEELGEBIEDEN` niet beschikbaar is (in een pure ESM test context).

**Waarom:** pdf.js heeft ingebouwde `window.*` calls in `isHeaderRow()`, `buildColumnMap()`, en `parseDeelgebiedTable()`. TypeScript klaagt niet over `window.DEELGEBIEDEN` door `noImplicitAny: false` en jsdom globals.

**Hoe voorkomen:** Gebruik grep om alle `window\.` occurrences in elk bestand te vinden vóór de migratie als checklist.

**Waarschuwingssignalen:** Tests met mock data slagen maar echte PDF parsing faalt.

### Pitfall 3: fflate heeft geen AES encryptie

**Wat gaat fout:** De bestaande backup UI heeft een wachtwoord-veld. Als backup.ts probeert wachtwoordbeveiliging te implementeren met fflate, werkt dit niet — fflate 0.8.2 ondersteunt geen AES wachtwoordencryptie.

**Waarom:** fflate is een pure DEFLATE/GZIP/ZIP bibliotheek, geen cryptografische bibliotheek.

**Hoe voorkomen:** backup.ts implementeert backup zonder wachtwoord in Phase 11. De backup UI is dead code in Phase 11 (app.js wordt niet gemigreerd). Wachtwoord-encryptie behoort tot Phase 12.

### Pitfall 4: `require()` in test files geeft ESM module errors

**Wat gaat fout:** `tests/actiepunten.test.js` gebruikt `require('../utils/actiepunten.js')` in `beforeEach`. Na het hernoemen naar `.ts` faalt Vitest met: `Error: require is not defined in ES module scope`.

**Waarom:** `package.json` heeft `"type": "module"` — alle `.js` files zijn ESM. `require()` is niet beschikbaar.

**Hoe voorkomen:** D-11-11 adresseert dit: vervang `require()` door `import`. Maar let op: de `beforeEach`-aanpak voor opnieuw laden (fresh module state) werkt niet meer met statische imports — gebruik `vi.resetModules()` en dynamic `import()` of stel state handmatig in.

### Pitfall 5: `prognosis.ts` en circulaire imports

**Wat gaat fout:** `prognosis.ts` importeert van `./schema` en `./leerlijnen`. Als `leerlijnen.ts` importeert van `./schema`, maar `schema.ts` per ongeluk ook van `./leerlijnen` importeert, is er een circulaire afhankelijkheid.

**Waarom:** In de window.* globale wereld waren er geen ES module afhankelijkheidsgrafiekencontroles. Bij het omzetten naar imports worden circulaire afhankelijkheden fouten.

**Hoe voorkomen:** `schema.ts` exporteert alleen constanten — geen imports van andere modules. Dit doorbreekt elke mogelijke cirkel.

### Pitfall 6: Fixture PDF met echte leerlingdata in git

**Wat gaat fout:** Een echte CIOS student PDF bevat privacy-gevoelige data (naam, BSN-achtige ID, beoordelingen). Dit mag niet in git.

**Hoe voorkomen:** Maak een test fixture met volledig gefabriceerde data (naam: "Test Student", ID: "000000"). Of: schrijf de fixture test zo dat hij wordt overgeslagen als het fixture bestand niet bestaat, en documenteer hoe je de fixture kunt aanmaken.

---

## Runtime State Inventory

> Deze migratie is geen rename/refactor van opgeslagen data — het is een code-omzetting. Er zijn geen runtime state wijzigingen die data migratie vereisen.

| Categorie | Gevonden | Actie |
|-----------|----------|-------|
| Opgeslagen data | localStorage keys `mentordashboard_klassen_v1` en `mentordashboard_leerlijnen_v1` blijven ongewijzigd (zelfde key names) | Geen data migratie — alleen code renames |
| Live service config | Geen externe services | Geen |
| OS-geregistreerde state | Geen | Geen |
| Secrets/env vars | Geen | Geen |
| Build artifacts | `node_modules/` — fflate moet worden geïnstalleerd | `npm install fflate` |

---

## Code Examples

### Schema.ts — Patroon (eenvoudigste migratie)

```typescript
// Source: directe analyse utils/schema.js [VERIFIED]
// Geen IIFE — alleen window.* assignments verwijderen + export toevoegen

const SCORE_LEVELS = ['onvoldoende', 'voldoende', 'goed', 'excellent'] as const;
export type ScoreLevel = typeof SCORE_LEVELS[number];

export interface Deelgebied {
  id: string;
  label: string;
  group: 'lesgeven' | 'organiseren' | 'prof_handelen';
}

const DEELGEBIEDEN: Deelgebied[] = [
  { id: 'va', label: 'V&A', group: 'lesgeven' },
  // ... (19 items)
];

export function detectColumnMapping(headers: string[]): Record<string, { mappedTo: string | null; confidence: string }> { ... }
export function normalizeScore(raw: unknown): string | null { ... }

export { SCORE_LEVELS, DEELGEBIEDEN };
// Verwijder: window.SCORE_LEVELS = ..., etc.
```

### Prognosis.ts — IIFE verwijdering + imports

```typescript
// Source: directe analyse utils/prognosis.js [VERIFIED]
import { DEELGEBIEDEN } from './schema';
import { getLeerlijnenMapping } from './leerlijnen';

// VERWIJDER: (function() { ... })();
// VERWIJDER: window.berekenPrognose = function(...) { ... };

// Interne helpers worden gewone functiedeclaraties:
function isVoldoendeOfHoger(score: string | null): boolean { ... }
function telLeerlijnen(scores: Record<string, string | null>): Record<string, any> {
  // Vervang: var deelgebieden = window.DEELGEBIEDEN;
  const deelgebieden = DEELGEBIEDEN;
  // Vervang: var mapping = window.getLeerlijnenMapping ? window.getLeerlijnenMapping() : {};
  const mapping = getLeerlijnenMapping();
  ...
}

// Exporteer de publieke API:
export function berekenPrognose(student: any, traject?: string): any { ... }
export function berekenAllePrognoses(students: any[], traject?: string): any[] { ... }
// debugPrognose is een development helper — optioneel weggooien of exporteren
```

### Excel.ts — SheetJS ESM import + cpexcel

```typescript
// Source: directe analyse parsers/excel.js + node_modules verificatie [VERIFIED]
import * as XLSX from 'xlsx';
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';

// Registreer cpexcel EENMALIG (bij module load)
XLSX.set_cptable(cpexcel.cptable);

export function parseVerzuimTime(str: unknown): number { ... }

export async function parseExcelFile(file: File): Promise<any[]> {
  // Vervang: if (typeof XLSX === 'undefined') { ... }
  // → NIET meer nodig: XLSX is altijd beschikbaar via import

  const arrayBuffer = await file.arrayBuffer(); // Modernere API dan FileReader
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  // ... rest van de logica identiek
}
```

### fflate Backup — Sync API

```typescript
// Source: fflate README [CITED: https://github.com/101arrowz/fflate/blob/master/README.md]
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { klassenState } from './klassen';

export function buildBackupPayload(): Uint8Array {
  const json = JSON.stringify({
    version: 1,
    klassen: klassenState.klassen,
    activeKlasId: klassenState.activeKlasId,
    exportedAt: new Date().toISOString(),
  });
  return zipSync({
    'mentordashboard-backup.json': strToU8(json),
  });
}

export function applyBackupRestore(
  zipData: Uint8Array,
  mode: 'overschrijven' | 'samenvoegen'
): { success: boolean; message: string } {
  const extracted = unzipSync(zipData);
  const jsonStr = strFromU8(extracted['mentordashboard-backup.json']);
  const payload = JSON.parse(jsonStr);
  // ... merge/overwrite logic
}
```

### Actiepunten.test.js → .test.ts migratie

```typescript
// Source: directe analyse tests/actiepunten.test.js [VERIFIED]
// VERWIJDER: 'use strict' (overbodig in ESM)
// VERWIJDER: global.window = global
// VERWIJDER: require('../utils/actiepunten.js')

// VOEG TOE:
import { actiepuntenStore, normalizeOnderwerp, isHerhaling } from '../utils/actiepunten';

// De tests blijven identiek — alleen de setup verandert
// MAAR: window.appState en window.saveState moeten nu anders worden ingesteld:
function resetAppState(students: any[] = []) {
  // actiepunten.ts moet appState geëxporteerd hebben als een let variabele
  // OF: actiepunten.ts accepteert een appState injectie parameter
  // Aanbevolen: exporteer appState vanuit datamodel.ts en gebruik het direct
}
```

**Belangrijke testbare implicatie:** De huidige `actiepunten.js` gebruikt `window.appState` en `window.saveState`. Na migratie zijn dit imports van `datamodel.ts`. De tests moeten de appState kunnen resetten — dit vereist dat `datamodel.ts` ofwel:
- `appState` exporteert als een mutable `let` variabele die tests kunnen overschrijven, OF
- Een `resetAppState()` testhelper exporteert

[ASSUMED: Dat `appState` als een geëxporteerd object (niet const) kan worden gereset in tests via direct assignment: `import { appState } from '../utils/datamodel'; appState.students = [];`]

---

## State of the Art

| Oud Patroon | Huidig Patroon | Gewijzigd | Impact |
|-------------|----------------|-----------|--------|
| `window.* globals` voor cross-module communicatie | Named ES module exports | Phase 11 | Modules zijn nu testbaar zonder DOM/window |
| IIFE voor encapsulatie | TypeScript module scope | Phase 11 | Variabelen zijn file-scoped, niet IIFE-scoped |
| `require()` + `global.window = global` in tests | `import` + echte module state | Phase 11 | Tests draaien in echte ESM context |
| `@types/pdfjs-dist` apart package | Bundled types in pdfjs-dist zelf | pdfjs-dist v3+ | Deprecated package, gebruik bundled types of `as any` |
| `vendor/zip.min.js` (UMD build) | fflate (npm ESM) | Phase 11 | Verwijderd door scaffold, vervangen door moderne lib |

**Deprecated/verouderd:**
- `global.window = global` in tests: verouderd patroon; gebruik echte module imports
- `window.XLSX` CDN global: vervangen door npm import in ESM context
- `@types/pdfjs-dist`: deprecated stub

---

## Environment Availability

| Dependency | Vereist Door | Beschikbaar | Versie | Fallback |
|------------|-------------|------------|--------|---------|
| Node.js | npm install | ✓ | v22.16.0 | — |
| TypeScript | typecheck | ✓ | 5.8.0 | — |
| Vitest | tests | ✓ | ^4.1.6 | — |
| xlsx (SheetJS) | parsers/excel.ts | ✓ | 0.20.3 | — |
| fflate | utils/backup.ts | ✗ | — | Geen — moet worden geïnstalleerd |
| pdfjs-dist (npm) | — | ✗ | — | Vendor bundle aanwezig — npm versie NIET installeren |
| fixture PDF | parser tests | ✗ | — | Tests overslaan als fixture ontbreekt |
| fixture XLS | parser tests | ✗ | — | Tests overslaan als fixture ontbreekt |

[VERIFIED: ls node_modules; npm view fflate version; ls vendor/]

**Ontbrekende dependencies zonder fallback:**
- `fflate` — vereist `npm install fflate` als eerste stap

**Ontbrekende dependencies met fallback:**
- Fixture bestanden — tests kunnen worden geschreven met `vi.skip()` guard als fixture ontbreekt

---

## Validation Architecture

### Test Framework

| Property | Waarde |
|----------|--------|
| Framework | Vitest ^4.1.6 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test -- --coverage` |

[VERIFIED: vitest.config.ts, package.json]

### Phase Requirements → Test Map

| Req ID | Gedrag | Test Type | Automated Command | Bestand Aanwezig? |
|--------|--------|-----------|-------------------|-------------------|
| MIG-01 | PDF-parser geeft identieke output na TS migratie | Integration (fixture) | `npm run test -- --reporter=verbose tests/` | ❌ Wave 0: tests/parseStage.test.ts aanmaken |
| MIG-02 | Excel-parser leest .xls incl. Nederlandse tekens | Integration (fixture) | `npm run test -- --reporter=verbose tests/` | ❌ Wave 0: tests/fixtures/ + excel test aanmaken |
| MIG-03 | Doorstroomnorm engine identieke berekeningen | Unit | `npm run test -- tests/prognosis.test.ts` | ❌ Wave 0: tests/prognosis.test.ts aanmaken |
| MIG-03 | actiepunten store ongewijzigd na migratie | Unit | `npm run test -- tests/actiepunten.test.js` | ✅ (bijwerken naar ESM) |
| MIG-03 | aggregation modus berekening | Unit | `npm run test -- tests/aggregation.test.ts` | ❌ Wave 0: aanmaken |

### Sampling Rate

- **Per task commit:** `npm run test` (alle tests, ~2-5 sec)
- **Per wave merge:** `npm run test -- --coverage`
- **Phase gate:** Volledige suite groen vóór `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tsconfig.json` uitbreiden: `"include": ["src", "utils", "parsers", "tests"]`
- [ ] `npm install fflate` uitvoeren
- [ ] `tests/fixtures/` map aanmaken
- [ ] `tests/fixtures/sample-voortgang.pdf` — geanonimiseerde CIOS voortgang PDF
- [ ] `tests/fixtures/sample-verzuim.xls` — minimaal XLS met verzuimkolommen
- [ ] `tests/prognosis.test.ts` — berekenPrognose unit tests (MIG-03)
- [ ] `tests/aggregation.test.ts` — aggregateDeelgebiedScores unit tests
- [ ] `tests/backup.test.ts` — buildBackupPayload + applyBackupRestore unit tests
- [ ] `tests/spider.test.ts` — SpiderChart.buildSpiderSVG unit tests
- [ ] `tests/feedback.test.ts` — feedback store tests (als feedback util bestaat)
- [ ] `tests/parseStage.test.ts` — parseStageFile integration test

---

## Assumptions Log

| # | Claim | Sectie | Risico als Onjuist |
|---|-------|--------|-------------------|
| A1 | `@types/pdfjs-dist` is niet nodig; vendor bundle types werken via `as any` | Standard Stack | Compiler errors in parsers/pdf.ts zonder type casting; oplossing: meer `as any` |
| A2 | fflate zonder AES encryptie is acceptabel voor Phase 11 (wachtwoord-feature in backup UI is dead code in Phase 11) | Open Questions | Als backup wachtwoord vereist is, moet een ander zip-mechanisme worden gebruikt |
| A3 | `parseStageFile` is een aparte parser (niet hetzelfde als parsers/pdf.ts) | Reconstructie verloren modules | Als het een deel van pdf.ts is, is tests/parseStage.test.ts een duplicate van pdf parser tests |
| A4 | Fixture PDF/XLS kunnen worden aangemaakt met geanonimiseerde data | Fixture Strategie | Als geen echte CIOS PDF beschikbaar is, moeten parser tests anders worden geschreven |
| A5 | `appState` uit datamodel.ts kan worden overschreven in tests via direct object mutatie | Test setup na migratie | Als appState als frozen object wordt geëxporteerd, werkt test reset niet; oplossing: `resetState()` helper exporteren |
| A6 | `noImplicitAny` per-bestand activering via TypeScript is NIET mogelijk via commentaren | tsconfig aanpak | GEEN risico — dit is een definitieve claim op basis van TypeScript taalspecificatie [VERIFIED aanname: correctheid van TypeScript spec] |

---

## Open Questions (RESOLVED)

1. **parseStageFile — aparte parser of deel van pdf.ts?**
   - Wat we weten: `app.js` roept `window.parseStageFile(file)` aan; het bestand `parsers/parseStage.js` stond in de verloren bestanden (tests/parseStage.test.js bestond)
   - Wat onduidelijk is: of parseStageFile een variant van parseSinglePDF is voor stage-PDFs, of een volledig andere parser
   - Aanbeveling: zoek in index.html.bak naar `<script src="parsers/parseStage.js">` om te bevestigen of het een apart bestand was
   - **RESOLVED:** parseStageFile = parseSinglePDF. Er is geen aparte parsers/parseStage.js in de script-laadlijst van index.html.bak. `parseSinglePDF` in `parsers/pdf.ts` is de enige PDF-parser. tests/parseStage.test.ts importeert direct van `'../parsers/pdf'`. Aanname A3 was onjuist — dit is geen risico want tests/parseStage.test.ts is bijgewerkt om parseSinglePDF te importeren.

2. **Feedback module — apart bestand of deel van actiepunten.ts?**
   - Wat we weten: `tests/feedback.test.js` bestond; `app.js` heeft feedback logica
   - Wat onduidelijk is: was er een `utils/feedback.js` of zat dit in `actiepunten.js`?
   - Aanbeveling: zoek in index.html.bak naar `<script src="utils/feedback.js">` — dit bestand staat NIET in de script-laadlijst (regels 1341-1362 in index.html.bak), wat suggereert dat feedback logica in actiepunten.js zat
   - **RESOLVED:** feedback logica zit in actiepunten.ts. Er was geen apart `utils/feedback.js`. `tests/feedback.test.ts` importeert vanuit `'../utils/actiepunten'` en test de herhaling-detectie van `actiepuntenStore`.

3. **Test fixture aanmaken**
   - Wat we weten: D-11-17 zegt "klein echt PDF en XLS bestand committed"
   - Wat onduidelijk is: of er al geanonimiseerde fixture bestanden beschikbaar zijn
   - Aanbeveling: planner moet een Wave 0 taak opnemen om fixture bestanden aan te maken vóór parser tests kunnen worden geschreven
   - **RESOLVED:** Plan 01 bevat een human-verify checkpoint (Taak 3) dat de gebruiker vraagt om geanonimiseerde fixture bestanden te leveren. Als fixtures ontbreken slaan de integration tests correct over via `describe.skipIf`. MIG-01 en MIG-02 worden dan gedocumenteerd als openstaande verificaties in de SUMMARY.

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: utils/schema.js] — directe broncode analyse, IIFE patronen
- [VERIFIED: utils/prognosis.js] — directe broncode analyse, window.* afhankelijkheden
- [VERIFIED: utils/datamodel.js] — directe broncode analyse
- [VERIFIED: utils/klassen.js] — directe broncode analyse
- [VERIFIED: utils/leerlijnen.js] — directe broncode analyse
- [VERIFIED: utils/actiepunten.js] — directe broncode analyse
- [VERIFIED: parsers/pdf.js] — directe broncode analyse
- [VERIFIED: parsers/excel.js] — directe broncode analyse
- [VERIFIED: app.js] — API contract extractie voor verloren modules
- [VERIFIED: node_modules/xlsx/package.json] — versie, exports, types velden
- [VERIFIED: node_modules/xlsx/types/index.d.ts] — TypeScript type signatures
- [VERIFIED: node_modules/xlsx/dist/cpexcel.d.ts] — cpexcel TypeScript types
- [VERIFIED: vendor/pdf.min.mjs] — versie v5.5.207, copyright 2024
- [VERIFIED: tsconfig.json] — strict: false, noImplicitAny: false, include: ["src"]
- [VERIFIED: vitest.config.ts] — include pattern, environment, setupFiles
- [VERIFIED: package.json] — geïnstalleerde dependencies
- [VERIFIED: npm view fflate version] — versie 0.8.2
- [VERIFIED: npm view @types/pdfjs-dist] — deprecated stub

### Secondary (MEDIUM confidence)

- [CITED: https://github.com/101arrowz/fflate/blob/master/README.md] — fflate sync API (zipSync, unzipSync, strToU8, strFromU8)

### Tertiary (LOW confidence)

- [ASSUMED] Geen AES in fflate is acceptabel voor Phase 11
- [ASSUMED] parseStageFile is een aparte parser module
- [ASSUMED] Fixture bestanden zijn aanmaakbaar met geanonimiseerde data

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — alle dependencies geverifieerd via npm registry en node_modules
- Architecture: HIGH — broncode van alle 8 bestanden direct gelezen
- API Contracts verloren modules: MEDIUM — afgeleid uit app.js, niet uit originele broncode
- Pitfalls: HIGH — geverifieerd door directe broncode analyse
- Test reconstructie: MEDIUM — gedrag afgeleid uit app.js

**Research datum:** 2026-05-13
**Geldig tot:** 2026-06-13 (stabiele bibliotheekversies)
