---
phase: 11-typescript-migratie
verified: 2026-05-14T12:30:00Z
status: human_needed
score: 10/13 must-haves verified
overrides_applied: 0
gaps:
  - truth: "npm run typecheck exit 0"
    status: failed
    reason: "tsc --noEmit exits 2 with 86 errors in tests/*.ts files (TS2582/TS2304: 'test', 'expect', 'describe' not found). Root cause: Phase 11-01 added tests/ to tsconfig.json include but tsconfig has no 'types: [\"vitest/globals\"]' or /// <reference types=\"vitest/globals\" />. The errors are exclusively in tests/ — not in utils/ or parsers/. typecheck-migrated exits 0 (it excludes tests/). This is a known issue documented in code review WR-05."
    artifacts:
      - path: "tsconfig.json"
        issue: "Missing 'types: [\"vitest/globals\"]' in compilerOptions — vitest globals (test, expect, describe) not recognized by tsc when tests/ is in include"
    missing:
      - "Add '\"types\": [\"vitest/globals\"]' to tsconfig.json compilerOptions so tsc recognizes vitest globals in tests/*.ts files"
      - "OR exclude tests/ from typecheck scope and rely only on typecheck-migrated for utils/parsers verification"
human_verification:
  - test: "MIG-01: PDF parser identieke output verificatie"
    expected: "parseSinglePDF verwerkt een echte CIOS voortgang-PDF en geeft een record terug met naam, datapunten en deelgebiedScores identiek aan de JavaScript versie"
    why_human: "tests/parseStage.test.ts slaat over via describe.skipIf (geen fixture aanwezig). OPTIE B gekozen. Fixture-afhankelijke parser output kan niet programmatisch worden geverifieerd zonder een echte PDF. Verifieer in Phase 13 met echte fixture."
  - test: "MIG-02: Excel parser identieke output + Nederlandse tekens verificatie"
    expected: "parseExcelFile leest een .xls bestand met Nederlandse tekens (bijv. Müller) en geeft correct gedecodeerde rijen terug — cpexcel registratie zorgt voor cp1252 correctheid"
    why_human: "tests/excel.test.ts Müller-test slaat over via describe.skipIf (geen fixture aanwezig). OPTIE B gekozen. Verifieer in Phase 13 met tests/fixtures/sample-verzuim.xls."
  - test: "MIG-03 prognosis: Identieke berekeningen t.o.v. JavaScript origineel"
    expected: "berekenPrognose geeft voor dezelfde student input exact hetzelfde label (negatief/neutraal/sbl/sbc/versneld_sbc) als het JavaScript origineel prognosis.js gaf"
    why_human: "5/5 prognosis unit tests slagen maar testen intern-consistente TypeScript logica, niet een directe vergelijking met het JavaScript origineel. Vereist een side-by-side run van de JS en TS implementaties met identieke student data."
---

# Phase 11: TypeScript Migratie Verification Report

**Phase Goal:** Alle utils en parsers zijn geporteerd naar TypeScript met identieke output; nul regressies in de test suite
**Verified:** 2026-05-14T12:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Alle .ts bestanden bestaan; alle .js originelen verwijderd | ✓ VERIFIED | 11 .ts files exist; 11 .js files gone (verified via filesystem) |
| 2 | Geen window.* in utils/*.ts en parsers/*.ts | ✓ VERIFIED | `grep -n "window\." utils/*.ts parsers/*.ts` — zero matches |
| 3 | npm run typecheck-migrated exit 0 (noImplicitAny:true voor utils/**, parsers/**) | ✓ VERIFIED | tsc --noEmit --project tsconfig.migrated.json exits 0; all 11 migrated modules pass noImplicitAny |
| 4 | npm run typecheck exit 0 | ✗ FAILED | exits 2; 86 errors in tests/*.ts (TS2582/TS2304 — vitest globals not in tsconfig types); no errors in utils/ or parsers/ |
| 5 | npm run test exit 0 — nul failures | ✓ VERIFIED | Test Files: 7 passed, 1 skipped (8); Tests: 31 passed, 5 skipped (36); exit 0 |
| 6 | parsers/pdf.ts exporteert parseSinglePDF; importeert DEELGEBIEDEN+normalizeScore van utils/schema | ✓ VERIFIED | export block at line 723 includes parseSinglePDF; line 6: `import { DEELGEBIEDEN, normalizeScore } from '../utils/schema'` |
| 7 | parsers/excel.ts importeert XLSX van xlsx npm; registreert cpexcel bij module load | ✓ VERIFIED | line 5: `import * as XLSX from 'xlsx'`; line 9: `XLSX.set_cptable((cpexcel as any).cptable)` — module-level |
| 8 | utils/prognosis.ts exporteert berekenPrognose en berekenAllePrognoses | ✓ VERIFIED | line 110: `export function berekenPrognose`; line 229: `export function berekenAllePrognoses` |
| 9 | tests/prognosis.test.ts slaagt (>=5 tests) — MIG-03 | ✓ VERIFIED | 5/5 prognosis tests groen: negatief/neutraal/sbl/leeg object/berekenAllePrognoses met lege array |
| 10 | tests/actiepunten.test.js gebruikt ESM imports; geen require(), geen global.window | ✓ VERIFIED | line 6-7: ESM imports; grep voor global.window en require() — zero matches; 9/9 tests groen |
| 11 | MIG-01: parsers/pdf.ts geeft identieke output voor echte PDF fixtures | ? UNCERTAIN | tests/parseStage.test.ts slaat over (OPTIE B — geen fixture); functie-type test wel groen; echte output niet geverifieerd |
| 12 | MIG-02: parsers/excel.ts leest .xls met correcte Nederlandse tekens | ? UNCERTAIN | parseExcelFile-is-een-functie test groen; Müller-test slaat over (geen fixture); cpexcel registratie code-level aanwezig |
| 13 | MIG-03: berekenPrognose identieke output t.o.v. JavaScript origineel | ? UNCERTAIN | Unit tests slagen intern; geen side-by-side vergelijking met JS origineel uitgevoerd |

**Score:** 10/13 truths verified (3 uncertain — human verification needed)

### Deferred Items

None — all items are in-scope for Phase 11.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tsconfig.json` | include: ["src","utils","parsers","tests"] | ✓ VERIFIED | Confirmed via node JSON parse |
| `tsconfig.migrated.json` | extends ./tsconfig.json, noImplicitAny:true, include utils/**/*.ts parsers/**/*.ts | ✓ VERIFIED | All three properties confirmed |
| `node_modules/fflate` | fflate@0.8.2 npm package | ✓ VERIFIED | statSync confirms; package.json dep: ^0.8.2 |
| `utils/schema.ts` | exports DEELGEBIEDEN, SCORE_LEVELS, detectColumnMapping, normalizeScore | ✓ VERIFIED | All 4 exports present; no window.* |
| `utils/datamodel.ts` | exports appState (mutable), addStudent, saveState, loadState, clearState, normalizeNaam, mergeVerzuim, getVerzuim | ✓ VERIFIED | All exports confirmed; schema.js deleted |
| `utils/leerlijnen.ts` | imports DEELGEBIEDEN from ./schema; exports getLeerlijnenMapping, saveLeerlijnenMapping, resetLeerlijnenMapping | ✓ VERIFIED | import confirmed; 3 exports confirmed |
| `utils/klassen.ts` | imports appState+saveState from ./datamodel; exports klassenState + klas-functies | ✓ VERIFIED | imports + exports confirmed; klassen.js deleted |
| `utils/actiepunten.ts` | imports appState+saveState from ./datamodel; exports actiepuntenStore, normalizeOnderwerp, isHerhaling | ✓ VERIFIED | all confirmed |
| `utils/prognosis.ts` | imports DEELGEBIEDEN+getLeerlijnenMapping; exports berekenPrognose, berekenAllePrognoses | ✓ VERIFIED | all confirmed |
| `utils/aggregation.ts` | exports aggregateDeelgebiedScores | ✓ VERIFIED | export function at line 14; 5/5 tests groen |
| `utils/backup.ts` | exports buildBackupPayload (Uint8Array), applyBackupRestore; imports from fflate + klassen | ✓ VERIFIED | fflate import line 7; klassen import line 8; 4/4 tests groen |
| `utils/spider.ts` | exports SpiderChart with buildSpiderSVG | ✓ VERIFIED | export const SpiderChart at line 23; 4/4 tests groen |
| `parsers/pdf.ts` | imports DEELGEBIEDEN+normalizeScore from utils/schema; exports parseSinglePDF; no window.* | ✓ VERIFIED | imports line 6; export block line 723; zero window.* |
| `parsers/excel.ts` | imports XLSX from xlsx; cpexcel at module load; exports parseExcelFile, parseVerzuimTime | ✓ VERIFIED | all confirmed; zero window.* |
| `tests/prognosis.test.ts` | >=5 tests groen for berekenPrognose | ✓ VERIFIED | 5/5 tests groen |
| `tests/aggregation.test.ts` | 5 tests groen | ✓ VERIFIED | 5/5 tests groen |
| `tests/backup.test.ts` | 4 tests groen | ✓ VERIFIED | 4/4 tests groen |
| `tests/spider.test.ts` | 4 tests groen | ✓ VERIFIED | 4/4 tests groen |
| `tests/feedback.test.ts` | >=3 tests groen | ✓ VERIFIED | 3/3 tests groen (4 in practice) |
| `tests/parseStage.test.ts` | fixture guard; parseSinglePDF type test inside skipIf | ⚠️ PARTIAL | All 3 tests inside skipIf (fixture absent); no unconditional function-type test present |
| `tests/excel.test.ts` | parseExcelFile-is-een-functie always groen; Müller-test skipIf | ✓ VERIFIED | unconditional test groen; 2 skipIf tests correctly skipped |
| `tests/fixtures/` | directory exists | ✓ VERIFIED | existsSync confirms |
| `tests/actiepunten.test.js` | ESM imports; no require(); no global.window; 9/9 groen | ✓ VERIFIED | all confirmed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| parsers/pdf.ts | utils/schema.ts | `import { DEELGEBIEDEN, normalizeScore }` | ✓ WIRED | line 6 of pdf.ts |
| parsers/excel.ts | xlsx npm package | `import * as XLSX from 'xlsx'` | ✓ WIRED | line 5 of excel.ts |
| parsers/excel.ts | xlsx/dist/cpexcel.full.mjs | `XLSX.set_cptable` at module load | ✓ WIRED | lines 6-9 of excel.ts; module-level (before any XLSX.read) |
| utils/prognosis.ts | utils/schema.ts | `import { DEELGEBIEDEN }` | ✓ WIRED | grep confirmed |
| utils/prognosis.ts | utils/leerlijnen.ts | `import { getLeerlijnenMapping }` | ✓ WIRED | grep confirmed |
| utils/backup.ts | fflate | `import { zipSync, unzipSync, strToU8, strFromU8 }` | ✓ WIRED | line 7 |
| utils/backup.ts | utils/klassen.ts | `import { klassenState }` | ✓ WIRED | line 8 |
| tests/actiepunten.test.js | utils/actiepunten.ts | `import { actiepuntenStore, normalizeOnderwerp, isHerhaling }` | ✓ WIRED | lines 6-7; 9 tests groen |
| tests/prognosis.test.ts | utils/prognosis.ts | `import { berekenPrognose }` | ✓ WIRED | 5/5 tests groen |
| tsconfig.json | utils/, parsers/, tests/ | include array | ✓ WIRED | ["src","utils","parsers","tests"] confirmed |
| tsconfig.migrated.json | utils/**/*.ts, parsers/**/*.ts | noImplicitAny:true | ✓ WIRED | exits 0; all 11 modules pass |

### Data-Flow Trace (Level 4)

Not applicable — this phase is a TypeScript migration of utility modules (no React components or UI rendering). The migrated modules are logic/data layers, not UI renderers. Data-flow verification (whether output is identical to JS originals) falls under human verification for MIG-01, MIG-02, MIG-03.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Test suite passes | `npm run test` | 31 passed, 5 skipped, 0 failed | ✓ PASS |
| typecheck-migrated exits 0 | `npm run typecheck-migrated` | exit 0 | ✓ PASS |
| typecheck exits 0 | `npm run typecheck` | exit 2 (86 errors in tests/*.ts — vitest globals TS2582/TS2304) | ✗ FAIL |
| prognosis tests green | `npm run test -- tests/prognosis.test.ts` | 5/5 passed | ✓ PASS |
| backup round-trip | `npm run test -- tests/backup.test.ts` | 4/4 passed | ✓ PASS |
| aggregation modus | `npm run test -- tests/aggregation.test.ts` | 5/5 passed | ✓ PASS |

### Probe Execution

No probe scripts declared or found for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MIG-01 | 11-01, 11-05, 11-06 | PDF-parser geeft identieke resultaten na TypeScript-migratie | ? NEEDS HUMAN | parsers/pdf.ts exists with parseSinglePDF export and schema imports; fixture tests skipped (OPTIE B); no programmatic output comparison possible |
| MIG-02 | 11-01, 11-05, 11-06 | Excel-parser .xls inclusief Nederlandse tekens | ? NEEDS HUMAN | parsers/excel.ts exists with cpexcel module-level registration; Müller test skipped; no fixture |
| MIG-03 | 11-02, 11-03, 11-04, 11-06 | Doorstroomnorm engine identieke berekeningen | ? NEEDS HUMAN | utils/prognosis.ts exports berekenPrognose+berekenAllePrognoses; 5/5 unit tests pass; no side-by-side comparison with JS original documented |

**Note on MIG-03:** REQUIREMENTS.md says "Alle 128 test-cases" but only 5 prognosis tests exist. The original 128-test claim comes from Phase 10 (TCH-03) which referred to 128 pre-existing tests. Phase 11 adds new tests bringing the total to 36 (31 passing + 5 skipped). The 5 prognosis tests exercise the key scenarios (negatief/neutraal/sbl/empty/allePrognoses) but do not constitute full coverage of all edge cases.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `parsers/excel.ts` | ~33-56 | `console.log` inside `debugExcelBestand` AND multiple `console.log` calls inside `parseExcelFile` (documented in code review CR-05) | ⚠️ Warning | Dumps first 10 raw student data rows to browser console — privacy/data-leakage during normal file import |
| `utils/backup.ts` | ~50 | `applyBackupRestore` merge mode does not update `activeKlasId` (documented in code review CR-01) | ⚠️ Warning | After merge-restore, active class pointer is stale; UI may show wrong class |
| `utils/spider.ts` | ~24 | `fillVar` and `strokeVar` embedded verbatim in SVG output (documented in code review CR-02) | ⚠️ Warning | Injection vector if caller-supplied CSS variables contain untrusted input |
| `tsconfig.json` | compilerOptions | Missing `"types": ["vitest/globals"]` — vitest globals not recognized by tsc | 🛑 Blocker | `npm run typecheck` exits 2; PLAN must-have "npm run typecheck exit 0" FAILS |

**No TBD/FIXME/XXX debt markers found** in any utils/*.ts or parsers/*.ts file.

### Human Verification Required

#### 1. MIG-01: PDF Parser Output Verification

**Test:** Provide `tests/fixtures/sample-voortgang.pdf` (anonymized CIOS voortgang PDF). Run: `npm run test -- tests/parseStage.test.ts`. Verify the test passes and output matches expected record structure.
**Expected:** parseSinglePDF returns an object with `naam` (string), `datapunten` (array), `deelgebiedScores` (Record). Compare with output of original `parsers/pdf.js` on the same file.
**Why human:** fixture absent (OPTIE B chosen in Phase 11-01); DOMMatrix dependency in pdfjs prevents automated import-level testing in jsdom.

#### 2. MIG-02: Excel Parser Dutch Characters Verification

**Test:** Provide `tests/fixtures/sample-verzuim.xls` (minimal XLS with Dutch characters including "Müller"). Run: `npm run test -- tests/excel.test.ts`. Verify Müller-test passes.
**Expected:** parseExcelFile returns array where at least one row has Naam containing "Müller" (not "MÃ¼ller" or similar cp1252 corruption).
**Why human:** fixture absent; cpexcel registration is code-level present but cannot be verified without an actual .xls file with non-ASCII characters.

#### 3. MIG-03: Prognosis Engine Identical Output vs JavaScript Original

**Test:** Take 5+ representative student records from the old app. Run both the old `prognosis.js` (via the HTML app) and `berekenPrognose` from `utils/prognosis.ts` with the same input. Compare the returned `label` values.
**Expected:** All labels match between JS and TS implementations.
**Why human:** The 5 unit tests verify internal TypeScript logic consistency, but no automated comparison against the original prognosis.js exists. The ROADMAP success criterion explicitly requires "identieke prognose-berekeningen."

#### 4. npm run typecheck — Blocker Fix Required

**Issue:** `npm run typecheck` exits 2 with 86 TypeScript errors in `tests/*.ts` files. The errors are `TS2582` (cannot find 'test'/'describe') and `TS2304` (cannot find 'expect') — vitest globals not recognized by tsc.
**Fix required:** Add `"types": ["vitest/globals"]` to `tsconfig.json` compilerOptions. This is a one-line fix that will make tsc aware of vitest's global test API. Alternatively, add `/// <reference types="vitest/globals" />` to each test .ts file, or exclude tests/ from `tsconfig.json` include.
**Why human decision:** The fix is straightforward but it is a change to a build artifact that must be verified to not break other typecheck behavior.

### Gaps Summary

**One BLOCKER gap:**

`npm run typecheck exit 0` — FAILED. The PLAN across all 6 sub-plans states this as a must-have. The actual exit code is 2. The 86 errors are confined to `tests/*.ts` files and are caused by `tsconfig.json` including `tests/` in its scope (added in Plan 11-01) without configuring vitest global types. The errors do NOT affect `utils/` or `parsers/` — `npm run typecheck-migrated` (which covers only utils/ and parsers/) exits 0 correctly.

This is a structural gap: the tsconfig.json include was extended but the necessary type configuration for vitest globals was omitted. The code review (WR-05) identified this issue post-execution.

**Three UNCERTAIN items (human_needed):**

MIG-01, MIG-02, MIG-03 cannot be fully verified without fixture files or a side-by-side comparison with the original JavaScript implementations. These were accepted as deferred per OPTIE B decision in Plan 11-01.

---

_Verified: 2026-05-14T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
