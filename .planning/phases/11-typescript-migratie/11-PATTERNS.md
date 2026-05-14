# Phase 11: TypeScript Migratie - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 18 (8 migrations, 3 recreations, 7 new tests)
**Analogs found:** 14 / 18

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `utils/schema.ts` | utility | transform | `utils/schema.js` (self) | exact (rename only) |
| `utils/prognosis.ts` | utility | transform | `utils/prognosis.js` (self) | exact (IIFE removal) |
| `utils/datamodel.ts` | utility | CRUD | `utils/datamodel.js` (self) | exact (window.* removal) |
| `utils/klassen.ts` | utility | CRUD | `utils/klassen.js` (self) | exact (window.* removal) |
| `utils/leerlijnen.ts` | utility | CRUD | `utils/leerlijnen.js` (self) | exact (IIFE removal) |
| `utils/actiepunten.ts` | utility | CRUD | `utils/actiepunten.js` (self) | exact (IIFE removal) |
| `parsers/pdf.ts` | parser | file-I/O | `parsers/pdf.js` (self) | exact (window.* removal) |
| `parsers/excel.ts` | parser | file-I/O | `parsers/excel.js` (self) | exact (global → import) |
| `utils/aggregation.ts` | utility | transform | `utils/prognosis.js` | role-match (pure transform) |
| `utils/backup.ts` | utility | file-I/O | `utils/klassen.js` | partial (state serialization) |
| `utils/spider.ts` | utility | transform | `utils/schema.js` | partial (pure computation) |
| `tests/actiepunten.test.js` (update) | test | request-response | `tests/actiepunten.test.js` (self) | exact (ESM update) |
| `tests/prognosis.test.ts` | test | request-response | `tests/actiepunten.test.js` | role-match |
| `tests/aggregation.test.ts` | test | request-response | `tests/actiepunten.test.js` | role-match |
| `tests/backup.test.ts` | test | request-response | `tests/actiepunten.test.js` | role-match |
| `tests/spider.test.ts` | test | request-response | `tests/actiepunten.test.js` | role-match |
| `tests/feedback.test.ts` | test | request-response | `tests/actiepunten.test.js` | role-match |
| `tests/parseStage.test.ts` | test | file-I/O | `tests/actiepunten.test.js` | partial-match |

---

## Pattern Assignments

### `utils/schema.ts` (utility, transform)
**Analog:** `utils/schema.js` (self — rename + add exports)
**Migration type:** Pattern B — Direct window assignment without IIFE

**Before (schema.js lines 1-4, 56-59):**
```javascript
const SCORE_LEVELS = ['onvoldoende', 'voldoende', 'goed', 'excellent'];
const DEELGEBIEDEN = [ ... ];
// ...
window.SCORE_LEVELS        = SCORE_LEVELS;
window.DEELGEBIEDEN        = DEELGEBIEDEN;
window.detectColumnMapping = detectColumnMapping;
window.normalizeScore      = normalizeScore;
```

**After (schema.ts):**
```typescript
export const SCORE_LEVELS = ['onvoldoende', 'voldoende', 'goed', 'excellent'] as const;
export type ScoreLevel = typeof SCORE_LEVELS[number];

export interface Deelgebied {
  id: string;
  label: string;
  group: 'lesgeven' | 'organiseren' | 'prof_handelen';
}

export const DEELGEBIEDEN: Deelgebied[] = [
  { id: 'va', label: 'V&A', group: 'lesgeven' },
  // ... all 19 items unchanged
];

export function detectColumnMapping(headers: string[]): Record<string, { mappedTo: string | null; confidence: string }> { ... }
export function normalizeScore(raw: unknown): string | null { ... }
// Remove all window.* = ... lines at the bottom
```

**Key rule:** `schema.ts` has zero imports — it is the bottom of the dependency graph. Any import into schema.ts risks a circular dependency.

---

### `utils/prognosis.ts` (utility, transform)
**Analog:** `utils/prognosis.js` (self — IIFE removal + imports)
**Migration type:** Pattern A + C — IIFE wrapper + window.* function assignments

**Before (prognosis.js lines 17, 57-58, 63, 111):**
```javascript
(function() {
  // ...
  function telLeerlijnen(scores) {
    var deelgebieden = window.DEELGEBIEDEN;   // line 57
    var mapping = window.getLeerlijnenMapping ? window.getLeerlijnenMapping() : {};  // line 63
    // ...
  }
  window.berekenPrognose = function(student, traject) { ... };  // line 111
  window.berekenAllePrognoses = function(traject) { ... };      // line 229
  window.debugPrognose = function(query, traject) { ... };      // line 246
})();
```

**After (prognosis.ts):**
```typescript
import { DEELGEBIEDEN } from './schema';
import { getLeerlijnenMapping } from './leerlijnen';

// Remove: (function() { ... })();
// Remove: window.* assignments at lines 111, 229, 246

function telLeerlijnen(scores: any): Record<string, any> {
  const deelgebieden = DEELGEBIEDEN;             // was: window.DEELGEBIEDEN
  const mapping = getLeerlijnenMapping();         // was: window.getLeerlijnenMapping ? window.getLeerlijnenMapping() : {}
  // rest of function body unchanged
}

export function berekenPrognose(student: any, traject?: string): any {
  // body unchanged — var → let/const optional, not required
}

export function berekenAllePrognoses(traject?: string): any[] {
  // NOTE: berekenAllePrognoses previously used window.appState.students
  // After migration this becomes a parameter or imports from datamodel
  // Use: import { appState } from './datamodel'
}

// debugPrognose: optional — keep as export or omit (development helper)
```

**Critical window.* replacement in telLeerlijnen:**
- Line 57: `window.DEELGEBIEDEN` → `DEELGEBIEDEN` (from import)
- Line 63: `window.getLeerlijnenMapping ? window.getLeerlijnenMapping() : {}` → `getLeerlijnenMapping()` (always available via import)

---

### `utils/datamodel.ts` (utility, CRUD)
**Analog:** `utils/datamodel.js` (self — window.* removal)
**Migration type:** Pattern B — Direct window assignments, no IIFE

**Before (datamodel.js lines 61-68, 75-84):**
```javascript
window.appState = {
  students: [],
  lastImportErrors: [],
  importing: false,
};

window.addStudent = function(student) {
  var idx = window.appState.students.findIndex(function(s) {
    return s.leerlingId === student.leerlingId && s.periode === student.periode;
  });
  // ...
};
window.saveState = function() { ... };
window.loadState = function() { ... };
window.clearState = function() { ... };
window.normalizeNaam = function(naam) { ... };
window.mergeVerzuim = function(verzuimRecords) { ... };
window.getVerzuim = function(leerlingId) { ... };
```

**After (datamodel.ts):**
```typescript
// Keep JSDoc @typedef comments — they become TypeScript interfaces or stay as JSDoc
// The Actiepunt, Datapunt, StudentRecord etc. typedefs → keep as JSDoc or convert to interfaces

export const appState = {
  students: [] as any[],           // TODO: type as StudentRecord[]
  lastImportErrors: [] as any[],
  importing: false,
};

export function addStudent(student: any): void {
  const idx = appState.students.findIndex((s: any) =>   // was: window.appState
    s.leerlingId === student.leerlingId && s.periode === student.periode
  );
  // ...
}
export function saveState(): boolean { ... }
export function loadState(): boolean { ... }
export function clearState(): void { ... }
export function normalizeNaam(naam: string): string { ... }
export function mergeVerzuim(verzuimRecords: any[]): { matched: number; unmatched: string[] } { ... }
export function getVerzuim(leerlingId: string): any { ... }
```

**Internal self-references:** Every `window.appState` inside datamodel.js becomes `appState` (the local exported const).

---

### `utils/klassen.ts` (utility, CRUD)
**Analog:** `utils/klassen.js` (self — window.* removal)
**Migration type:** Pattern B — Direct window assignments

**Before (klassen.js lines 6-12, 43-52):**
```javascript
var KLASSEN_KEY = 'mentordashboard_klassen_v1';
window.klassenState = { klassen: {}, activeKlasId: null };

window.switchActiveKlas = function(klasId) {
  if (!window.klassenState.klassen[klasId]) return false;
  window.klassenState.activeKlasId = klasId;
  window.appState.students = window.klassenState.klassen[klasId].students;  // bridge
  window.saveKlassen();
  return true;
};
```

**After (klassen.ts):**
```typescript
import { appState, saveState } from './datamodel';

const KLASSEN_KEY = 'mentordashboard_klassen_v1';

export const klassenState: { klassen: Record<string, any>; activeKlasId: string | null } = {
  klassen: {},
  activeKlasId: null,
};

export function switchActiveKlas(klasId: string): boolean {
  if (!klassenState.klassen[klasId]) return false;
  klassenState.activeKlasId = klasId;
  appState.students = klassenState.klassen[klasId].students;  // bridge — was: window.appState
  saveKlassen();
  return true;
}
export function createKlas(naam: string): any { ... }
export function deleteKlas(klasId: string): boolean { ... }
export function saveKlassen(): boolean { ... }
export function loadKlassen(): boolean { ... }
export function getActiveStudents(): any[] { ... }
export function getAllRecordsForStudent(leerlingId: string): any[] { ... }
export function _migrateV1ToKlassen(): boolean { ... }
```

**window.* dependency replacements:**
- `window.appState` → `appState` (imported from `./datamodel`)
- `window.saveState` → `saveState` (imported from `./datamodel`)
- `window.klassenState` (self-reference) → `klassenState` (local export)
- `window.saveKlassen`, `window.switchActiveKlas`, etc. → local function calls (no `window.` prefix)

---

### `utils/leerlijnen.ts` (utility, CRUD)
**Analog:** `utils/leerlijnen.js` (self — IIFE removal)
**Migration type:** Pattern A — Standard IIFE wrapper

**Before (leerlijnen.js lines 10, 17, 27, 40-58):**
```javascript
(function() {
  var STORAGE_KEY = 'mentordashboard_leerlijnen_v1';
  var _cachedMapping = null;

  function buildDefault() {
    var deelgebieden = window.DEELGEBIEDEN;  // line 17
    // ...
  }
  function isValid(mapping) {
    var deelgebieden = window.DEELGEBIEDEN;  // line 27
    // ...
  }
  window.getLeerlijnenMapping = function() { ... };
  window.saveLeerlijnenMapping = function(mapping) { ... };
  window.resetLeerlijnenMapping = function() { ... };
})();
```

**After (leerlijnen.ts):**
```typescript
import { DEELGEBIEDEN } from './schema';

const STORAGE_KEY = 'mentordashboard_leerlijnen_v1';
let _cachedMapping: Record<string, string> | null = null;  // was: var inside IIFE

function buildDefault(): Record<string, string> {
  const deelgebieden = DEELGEBIEDEN;  // was: window.DEELGEBIEDEN
  return deelgebieden.reduce((m: any, dg: any) => { m[dg.id] = dg.group; return m; }, {});
}

function isValid(mapping: any): boolean {
  if (!mapping || typeof mapping !== 'object') return false;
  const deelgebieden = DEELGEBIEDEN;  // was: window.DEELGEBIEDEN
  for (let i = 0; i < deelgebieden.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(mapping, deelgebieden[i].id)) return false;
  }
  return true;
}

export function getLeerlijnenMapping(): Record<string, string> { ... }
export function saveLeerlijnenMapping(mapping: Record<string, string>): boolean { ... }
export function resetLeerlijnenMapping(): void { ... }
// Remove: })(); at the end
```

---

### `utils/actiepunten.ts` (utility, CRUD)
**Analog:** `utils/actiepunten.js` (self — IIFE removal)
**Migration type:** Pattern A — Standard IIFE wrapper

**Before (actiepunten.js lines 10, 18-20, 101-103, 151-154):**
```javascript
(function() {
  function getStudent(leerlingId) {
    var students = window.appState && window.appState.students;  // line 19
    // ...
  }
  // ... store methods ...
  store.add = function(...) {
    // ...
    window.saveState();  // line 102
    return item;
  };
  window.normalizeOnderwerp = normalizeOnderwerp;
  window.isHerhaling = isHerhaling;
  window.actiepuntenStore = store;
})();
```

**After (actiepunten.ts):**
```typescript
import { appState, saveState } from './datamodel';

// Remove IIFE wrapper: (function() { ... })();

function getStudent(leerlingId: string): any | null {
  const students = appState.students;  // was: window.appState && window.appState.students
  // ...
}

const store = {
  list(leerlingId: string): any[] { ... },
  add(leerlingId: string, patch: { onderwerp: string; datum: string; status: string }): any | null {
    // ...
    saveState();  // was: window.saveState()
    return item;
  },
  update(leerlingId: string, id: string, patch: any): any | null { ... },
  remove(leerlingId: string, id: string): boolean { ... },
};

export function normalizeOnderwerp(s: string): string { ... }
export function isHerhaling(listOrStudent: any, nieuwOnderwerp: string, excludeId?: string): boolean { ... }
export const actiepuntenStore = store;
```

**Test state reset pattern** (critical for actiepunten.test.js update):
After migration, `window.appState` is gone. Tests must reset state via the exported object:
```typescript
import { appState } from '../utils/datamodel';
// In beforeEach:
appState.students = [{ leerlingId: 'L1', actiepunten: [] }];
```

---

### `parsers/pdf.ts` (parser, file-I/O)
**Analog:** `parsers/pdf.js` (self — minimal changes, already mostly ESM)
**Migration type:** Minimal — already uses ESM imports; remove window.* globals at bottom

**Before (pdf.js lines 1-10, 427, 492, 500, 608, 642, 751-761):**
```javascript
import * as pdfjsLib from '../vendor/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = ...;

// line 427:
const labels = window.DEELGEBIEDEN.map(d => d.label.toUpperCase());
// line 492:
const labels = window.DEELGEBIEDEN.map(d => d.label.toUpperCase());
// line 500:
map[window.DEELGEBIEDEN[dgIdx].label] = item.x;
// line 608:
const level = window.normalizeScore(item.str);
// line 642:
for (const dg of window.DEELGEBIEDEN) {

// lines 751-761:
window.parseSinglePDF = parseSinglePDF;
window.extractAllTextItems = extractAllTextItems;
// ... etc.
```

**After (pdf.ts):**
```typescript
// @ts-ignore — vendor bundle has no TypeScript declarations
import * as pdfjsLib from '../vendor/pdf.min.mjs';
import { DEELGEBIEDEN, normalizeScore } from '../utils/schema';

// Worker setup unchanged:
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href;

// Replace all occurrences:
// window.DEELGEBIEDEN  → DEELGEBIEDEN
// window.normalizeScore → normalizeScore

// Remove lines 751-761 entirely (window.* = ... assignments)
// The export block at lines 725-748 stays as-is (already present)
```

**Exact replacements (5 occurrences):**
| Line | Before | After |
|------|--------|-------|
| 427 | `window.DEELGEBIEDEN.map(...)` | `DEELGEBIEDEN.map(...)` |
| 492 | `window.DEELGEBIEDEN.map(...)` | `DEELGEBIEDEN.map(...)` |
| 500 | `window.DEELGEBIEDEN[dgIdx].label` | `DEELGEBIEDEN[dgIdx].label` |
| 608 | `window.normalizeScore(item.str)` | `normalizeScore(item.str)` |
| 642 | `for (const dg of window.DEELGEBIEDEN)` | `for (const dg of DEELGEBIEDEN)` |

---

### `parsers/excel.ts` (parser, file-I/O)
**Analog:** `parsers/excel.js` (self — window.XLSX global → ESM import)
**Migration type:** Pattern B — global XLSX replaced by import

**Before (excel.js lines 1-4, 29, 59-61, 72-73):**
```javascript
// NOT an ES module — uses window.* globals
window.parseVerzuimTime = function(str) { ... };

window.parseExcelFile = async function(file) {
  if (typeof XLSX === 'undefined') {          // line 60 — guard no longer needed
    throw new Error('SheetJS (XLSX) is niet geladen.');
  }
  // Uses FileReader pattern (lines 64-70) — replace with file.arrayBuffer()
  const arrayBuffer = await new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload  = function(e) { resolve(e.target.result); };
    reader.readAsArrayBuffer(file);
  });
  workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });  // line 73
```

**After (excel.ts):**
```typescript
import * as XLSX from 'xlsx';
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';

// Register cpexcel ONCE at module load (for Dutch characters — replaces CDN registration)
XLSX.set_cptable((cpexcel as any).cptable);

export function parseVerzuimTime(str: unknown): number { ... }

export async function parseExcelFile(file: File): Promise<any[]> {
  // Remove: if (typeof XLSX === 'undefined') guard — XLSX always available via import
  const arrayBuffer = await file.arrayBuffer();  // modern API, replaces FileReader
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  } catch (err: any) {
    throw new Error('Excel-bestand kon niet worden verwerkt: ' + (err.message || String(err)));
  }
  // Rest of function body unchanged
}

export async function debugExcelBestand(file: File): Promise<void> { ... }
// Remove: window.parseVerzuimTime = ..., window.parseExcelFile = ..., window.debugExcelBestand = ...
```

---

### `utils/aggregation.ts` (utility, transform) — RECREATE
**Analog:** `utils/prognosis.js` (same role: pure transform over student data)
**Source:** API contract extracted from `app.js` lines 1674-1676

**API contract from app.js:**
```typescript
// app.js: window.aggregateDeelgebiedScores(student.datapunten || [])
// Returns: { aggregationDetail: {} }
```

**Pattern to follow (from prognosis.ts shape):**
```typescript
import { SCORE_LEVELS } from './schema';

/**
 * Aggregate deelgebied scores across all datapunten for a student.
 * Uses mode (most frequent score) per deelgebied.
 *
 * @param datapunten - Array of { scores: Record<string, string|null> }
 * @returns { aggregationDetail: Record<string, string | null> }
 */
export function aggregateDeelgebiedScores(
  datapunten: any[]
): { aggregationDetail: Record<string, string | null> } {
  // Build frequency map per deelgebied label across all datapunten
  // SCORE_LEVELS used as ordering: ['onvoldoende','voldoende','goed','excellent']
  // Mode: most frequent non-null score wins; tie-break: higher score wins
  const aggregationDetail: Record<string, string | null> = {};
  // ... implementation
  return { aggregationDetail };
}
```

---

### `utils/backup.ts` (utility, file-I/O) — RECREATE
**Analog:** `utils/klassen.js` (serializes klassenState — same data being backed up)
**Source:** API contract from app.js lines 841, 945; fflate sync API

**Pattern to follow:**
```typescript
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { klassenState } from './klassen';

const BACKUP_FILENAME = 'mentordashboard-backup.json';

export function buildBackupPayload(): Uint8Array {
  const json = JSON.stringify({
    version: 1,
    klassen: klassenState.klassen,
    activeKlasId: klassenState.activeKlasId,
    exportedAt: new Date().toISOString(),
  });
  return zipSync({ [BACKUP_FILENAME]: strToU8(json) });
}

export function applyBackupRestore(
  zipData: Uint8Array,
  mode: 'overschrijven' | 'samenvoegen'
): { success: boolean; message: string } {
  try {
    const extracted = unzipSync(zipData);
    const jsonStr = strFromU8(extracted[BACKUP_FILENAME]);
    const payload = JSON.parse(jsonStr);
    // mode 'overschrijven': replace klassenState.klassen entirely
    // mode 'samenvoegen': merge klassen by id (new ids added, existing ids updated)
    return { success: true, message: 'Backup hersteld' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Onbekende fout' };
  }
}
```

---

### `utils/spider.ts` (utility, transform) — RECREATE
**Analog:** `utils/schema.js` (same role: pure computation, zero I/O)
**Source:** API contract from app.js lines 1534, 1553

**Pattern to follow:**
```typescript
// Pure SVG polygon calculation — no imports needed (math only)

export const SpiderChart = {
  /**
   * Build an SVG spider chart polygon for a student's deelgebied scores.
   * @param axes - Array of { key: string; label: string } (the 19 deelgebieden)
   * @param scores - { [key: string]: string | null } — score per deelgebied key
   * @param fillVar - CSS variable name for polygon fill (e.g., '--color-spider-fill')
   * @param strokeVar - CSS variable name for polygon stroke
   * @returns SVG markup string (the full <svg>...</svg> element)
   */
  buildSpiderSVG(
    axes: Array<{ key: string; label: string }>,
    scores: Record<string, string | null>,
    fillVar: string,
    strokeVar: string
  ): string {
    // Map score levels to radii: null=0, onvoldoende=0.25, voldoende=0.5, goed=0.75, excellent=1.0
    // Build polygon points using polar coordinates
    // Return complete SVG string
  }
};
```

---

### `tests/actiepunten.test.js` (update — ESM migration)
**Analog:** `tests/actiepunten.test.js` (self — targeted update)

**Before (lines 1-27):**
```javascript
'use strict';
global.window = global;

function resetAppState(students) {
  window.appState = { students: students || [] };
  window.saveState = jest.fn();
}

beforeEach(function() {
  resetAppState([makeStudent('L1')]);
  jest.resetModules();
  require('../utils/actiepunten.js');
});
```

**After:**
```javascript
// Remove: 'use strict' (implicit in ESM)
// Remove: global.window = global
import { actiepuntenStore, normalizeOnderwerp, isHerhaling } from '../utils/actiepunten';
import { appState } from '../utils/datamodel';
import { vi } from 'vitest';

function makeStudent(leerlingId) {
  return { leerlingId: leerlingId, actiepunten: [] };
}

function resetAppState(students) {
  appState.students = students || [];   // was: window.appState = { students: ... }
  // saveState is now imported by actiepunten.ts from datamodel.ts
  // spy on it via vi.spyOn if needed, or mock at module level
}

beforeEach(function() {
  resetAppState([makeStudent('L1')]);
  // Remove: jest.resetModules() + require() — not needed with static imports
});
// All test bodies unchanged — only window.actiepuntenStore → actiepuntenStore, etc.
```

**saveState mock strategy:** Replace `window.saveState = jest.fn()` with `vi.spyOn` on the datamodel module's `saveState` export, or accept that saveState calls localStorage in jsdom (which is available in the test environment).

---

### `tests/prognosis.test.ts` (NEW)
**Analog:** `tests/actiepunten.test.js` (test structure and assertion style)

**Pattern to copy:**
```typescript
import { berekenPrognose, berekenAllePrognoses } from '../utils/prognosis';
import { DEELGEBIEDEN } from '../utils/schema';

// Helper: build a student with specific scores
function makeStudent(scores: Record<string, string | null> = {}): any {
  return { leerlingId: 'L1', naam: 'Test Student', deelgebiedScores: scores };
}

// Helper: make all scores a given level
function allScores(level: string): Record<string, string | null> {
  return Object.fromEntries(DEELGEBIEDEN.map(dg => [dg.label, level]));
}

test('negatief: >6 onvoldoende -> label negatief', () => {
  const scores = allScores('voldoende');
  // set 7 to onvoldoende
  const result = berekenPrognose(makeStudent(scores), 'bj2');
  expect(result.label).toBe('negatief');
});

test('sbl: >=13 voldoende but <15 -> label sbl', () => { ... });
test('sbc: >=15 voldoende + kern ok -> label sbc', () => { ... });
test('neutraal: <13 voldoende, not negatief -> label neutraal', () => { ... });
test('bj1 versneld_sbc: 4 goed lesgeven + 3 goed org + 5 goed prof -> versneld_sbc', () => { ... });
test('gaps.nodigSBL correct when 11 voldoende', () => { ... });
```

---

### `tests/aggregation.test.ts` (NEW)
**Analog:** `tests/actiepunten.test.js` (structure)

**Pattern to copy:**
```typescript
import { aggregateDeelgebiedScores } from '../utils/aggregation';

test('empty datapunten returns empty aggregationDetail', () => {
  const result = aggregateDeelgebiedScores([]);
  expect(result.aggregationDetail).toEqual({});
});

test('single datapunt: scores passed through directly', () => {
  const datapunten = [{ scores: { 'V&A': 'goed', 'M&M': 'voldoende' } }];
  const result = aggregateDeelgebiedScores(datapunten);
  expect(result.aggregationDetail['V&A']).toBe('goed');
});

test('two datapunten: mode wins (2x goed > 1x voldoende)', () => { ... });
test('tie-break: higher score wins', () => { ... });
test('null scores treated as unassessed (not counted)', () => { ... });
```

---

### `tests/backup.test.ts` (NEW)
**Analog:** `tests/actiepunten.test.js` (structure + vi mock for module state)

**Pattern to copy:**
```typescript
import { buildBackupPayload, applyBackupRestore } from '../utils/backup';
import { klassenState } from '../utils/klassen';

beforeEach(() => {
  // Reset klassenState to known fixture
  klassenState.klassen = {};
  klassenState.activeKlasId = null;
});

test('buildBackupPayload returns Uint8Array', () => {
  const result = buildBackupPayload();
  expect(result).toBeInstanceOf(Uint8Array);
  expect(result.length).toBeGreaterThan(0);
});

test('round-trip: build then restore overschrijven', () => {
  klassenState.klassen = { 'klas_1': { id: 'klas_1', naam: 'Test Klas', students: [] } };
  const zip = buildBackupPayload();
  klassenState.klassen = {};  // wipe
  const result = applyBackupRestore(zip, 'overschrijven');
  expect(result.success).toBe(true);
  expect(klassenState.klassen['klas_1']).toBeDefined();
});

test('applyBackupRestore samenvoegen keeps existing klassen', () => { ... });
test('applyBackupRestore with invalid data returns success:false', () => { ... });
```

---

### `tests/spider.test.ts` (NEW)
**Analog:** `tests/actiepunten.test.js` (structure — pure unit test)

**Pattern to copy:**
```typescript
import { SpiderChart } from '../utils/spider';
import { DEELGEBIEDEN } from '../utils/schema';

const axes = DEELGEBIEDEN.map(dg => ({ key: dg.id, label: dg.label }));

test('buildSpiderSVG returns a non-empty string', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--fill', '--stroke');
  expect(typeof svg).toBe('string');
  expect(svg.length).toBeGreaterThan(0);
});

test('buildSpiderSVG output contains <svg', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--fill', '--stroke');
  expect(svg).toContain('<svg');
});

test('all excellent scores produces max polygon', () => {
  const scores = Object.fromEntries(DEELGEBIEDEN.map(dg => [dg.id, 'excellent']));
  const svg = SpiderChart.buildSpiderSVG(axes, scores, '--fill', '--stroke');
  expect(svg).toContain('polygon');
});
```

---

### `tests/feedback.test.ts` (NEW)
**Analog:** `tests/actiepunten.test.js` (structure — feedback logic likely in actiepunten.ts)
**Note:** Research open question: feedback module may be part of `actiepunten.ts`. If no separate `utils/feedback.ts` exists, this test file covers feedback-related exports from `actiepunten.ts`.

**Pattern to copy:**
```typescript
// If feedback is in actiepunten.ts:
import { actiepuntenStore } from '../utils/actiepunten';
import { appState } from '../utils/datamodel';

// If a separate utils/feedback.ts is needed, create it with exports
// discovered from app.js feedback logic

beforeEach(() => {
  appState.students = [{ leerlingId: 'L1', actiepunten: [] }];
});

// Tests covering feedback display logic or feed-forward storage
// Exact tests depend on what app.js reveals about feedback behavior
```

---

### `tests/parseStage.test.ts` (NEW)
**Analog:** `tests/actiepunten.test.js` (structure) + fixture file pattern
**Note:** Research open question: `parseStageFile` may be part of `parsers/pdf.ts` or a separate `parsers/parseStage.ts`. Check `index.html.bak` for `<script src="parsers/parseStage.js">`.

**Pattern to copy (fixture-based test):**
```typescript
import { readFileSync, existsSync } from 'fs';
import { describe, test, expect } from 'vitest';

const FIXTURE_PATH = new URL('./fixtures/sample-voortgang.pdf', import.meta.url).pathname;
const FIXTURE_EXISTS = existsSync(FIXTURE_PATH);

describe.skipIf(!FIXTURE_EXISTS)('parseStageFile integration', () => {
  test('parses fixture PDF and returns student records', async () => {
    // Import the parser (parseSinglePDF from pdf.ts OR parseStageFile from parseStage.ts)
    // const { parseSinglePDF } = await import('../parsers/pdf');
    const pdfBytes = readFileSync(FIXTURE_PATH);
    const file = new File([pdfBytes], 'sample-voortgang.pdf', { type: 'application/pdf' });
    // const result = await parseSinglePDF(file);
    // expect(result).toBeDefined();
    // expect(result.naam).toBeTruthy();
  });
});
```

---

## Shared Patterns

### Pattern 1: IIFE Removal (Pattern A)
**Applies to:** `prognosis.ts`, `leerlijnen.ts`, `actiepunten.ts`
**Source:** `utils/prognosis.js` lines 17 and 311

```javascript
// REMOVE this outer wrapper:
(function() {
  // ... all content ...
})();

// RESULT: all var declarations become module-scoped let/const
// All internal functions stay as function declarations (no change needed)
// All window.X = Y lines at the end become: export const X = Y or export function X
```

### Pattern 2: Window Global Removal (Pattern B)
**Applies to:** `schema.ts`, `datamodel.ts`, `klassen.ts`, `parsers/excel.ts`, `parsers/pdf.ts`
**Source:** `utils/schema.js` lines 56-59

```javascript
// REMOVE these lines (bottom of file):
window.SCORE_LEVELS        = SCORE_LEVELS;
window.DEELGEBIEDEN        = DEELGEBIEDEN;
window.detectColumnMapping = detectColumnMapping;
window.normalizeScore      = normalizeScore;

// REPLACE with export keyword on the original declarations:
export const SCORE_LEVELS = ...;
export const DEELGEBIEDEN = ...;
export function detectColumnMapping(...) { ... }
export function normalizeScore(...) { ... }
```

### Pattern 3: Cross-File Window Dependency Replacement
**Applies to:** `prognosis.ts`, `leerlijnen.ts`, `klassen.ts`, `actiepunten.ts`, `parsers/pdf.ts`
**Complete replacement table:**

| In File | `window.X` call | Replace with | Import from |
|---------|----------------|--------------|-------------|
| prognosis.ts | `window.DEELGEBIEDEN` | `DEELGEBIEDEN` | `./schema` |
| prognosis.ts | `window.getLeerlijnenMapping()` | `getLeerlijnenMapping()` | `./leerlijnen` |
| prognosis.ts | `window.appState.students` | `appState.students` | `./datamodel` |
| leerlijnen.ts | `window.DEELGEBIEDEN` (×2) | `DEELGEBIEDEN` | `./schema` |
| klassen.ts | `window.appState` | `appState` | `./datamodel` |
| klassen.ts | `window.saveState()` | `saveState()` | `./datamodel` |
| actiepunten.ts | `window.appState` | `appState` | `./datamodel` |
| actiepunten.ts | `window.saveState()` | `saveState()` | `./datamodel` |
| parsers/pdf.ts | `window.DEELGEBIEDEN` (×3) | `DEELGEBIEDEN` | `../utils/schema` |
| parsers/pdf.ts | `window.normalizeScore` | `normalizeScore` | `../utils/schema` |

### Pattern 4: TypeScript Error Handling — `as any` + TODO
**Applies to:** All migrated files where types are incomplete
**Source:** D-11-21 decision

```typescript
// Use this pattern uniformly for all untyped parameters and return values:
export function someFunction(student: any, traject?: string): any {
  const scores = (student as any).deelgebiedScores || {};  // TODO: type as StudentRecord
  return result as any;  // TODO: type as PrognosisResult
}
```

### Pattern 5: Vendor Import with @ts-ignore
**Applies to:** `parsers/pdf.ts` only
**Source:** Research finding — vendor/pdf.min.mjs has no .d.ts

```typescript
// @ts-ignore — vendor bundle has no TypeScript declarations; pdfjs-dist npm types do not apply
import * as pdfjsLib from '../vendor/pdf.min.mjs';

// All pdfjsLib API calls require cast:
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = ...;
const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
```

### Pattern 6: ESM Test File Structure
**Applies to:** All new `.test.ts` files and the updated `actiepunten.test.js`
**Source:** `tests/vitest-setup.js` + `tests/actiepunten.test.js`

```typescript
// File header: no 'use strict', no global.window = global
// Imports at top:
import { describe, test, expect, beforeEach, vi } from 'vitest';
// OR rely on globals: true in vitest.config.ts (test/expect/beforeEach available without import)

// jest.fn() is available via vitest-setup.js shim:
// globalThis.jest = { fn: vi.fn.bind(vi), spyOn: vi.spyOn.bind(vi), ... }
// So jest.fn() and jest.spyOn() work without additional import

// Test structure:
beforeEach(() => {
  // Reset mutable module state directly on exported objects
});

test('description', () => {
  expect(actual).toBe(expected);
});
```

### Pattern 7: tsconfig.json Include Extension
**Applies to:** `tsconfig.json` (Wave 0 prerequisite)
**Source:** Research pitfall #1

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noImplicitAny": false
  },
  "include": ["src", "utils", "parsers", "tests"]
}
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `tests/fixtures/sample-voortgang.pdf` | fixture | — | Binary file, not code — must be generated/committed separately |
| `tests/fixtures/sample-verzuim.xls` | fixture | — | Binary file, not code — must be generated/committed separately |

---

## Dependency Graph (Migration Order per D-11-19)

```
Wave 0 (prerequisite):
  tsconfig.json (extend include)
  npm install fflate

Wave 1 (bottom of graph — no local imports):
  utils/schema.ts  ← no imports

Wave 2 (import from schema only):
  utils/leerlijnen.ts  ← schema
  utils/datamodel.ts   ← no local imports

Wave 3 (import from wave 1+2):
  utils/klassen.ts     ← datamodel
  utils/actiepunten.ts ← datamodel
  utils/prognosis.ts   ← schema, leerlijnen
  utils/aggregation.ts ← schema
  utils/backup.ts      ← klassen
  utils/spider.ts      ← (no local imports — pure math)

Wave 4 (parsers — import from utils):
  parsers/pdf.ts       ← utils/schema
  parsers/excel.ts     ← xlsx (npm, no local imports)

Wave 5 (tests):
  tests/actiepunten.test.js (update)
  tests/prognosis.test.ts
  tests/aggregation.test.ts
  tests/backup.test.ts
  tests/spider.test.ts
  tests/feedback.test.ts
  tests/parseStage.test.ts
```

---

## Metadata

**Analog search scope:** `utils/`, `parsers/`, `tests/`, `src/`
**Files scanned:** 11 source files read in full
**Pattern extraction date:** 2026-05-13
