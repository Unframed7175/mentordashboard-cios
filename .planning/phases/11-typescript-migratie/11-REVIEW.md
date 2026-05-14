---
phase: 11-typescript-migratie
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - parsers/excel.ts
  - parsers/pdf.ts
  - utils/actiepunten.ts
  - utils/aggregation.ts
  - utils/backup.ts
  - utils/datamodel.ts
  - utils/klassen.ts
  - utils/leerlijnen.ts
  - utils/prognosis.ts
  - utils/schema.ts
  - utils/spider.ts
  - tests/actiepunten.test.js
  - tests/aggregation.test.ts
  - tests/backup.test.ts
  - tests/excel.test.ts
  - tests/feedback.test.ts
  - tests/parseStage.test.ts
  - tests/prognosis.test.ts
  - tests/spider.test.ts
  - tsconfig.json
  - tsconfig.migrated.json
  - package.json
findings:
  critical: 5
  warning: 9
  info: 5
  total: 19
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-05-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

This review covers the Phase 11 TypeScript migration. Eleven utility/parser source files were migrated from JavaScript, three were recreated from scratch, and eight test files were produced. The migration successfully removed IIFE wrappers and `window.*` globals — no residual `window.*` assignments were found. Named ES module exports are present in all reviewed files. The cpexcel registration in `excel.ts` fires at module load before any `XLSX.read()` call, which is correct.

The most serious bugs are: a logic error in `backup.ts` that silently discards `activeKlasId` on merge-restore; a XSS/injection vector in `spider.ts` where caller-supplied CSS variable strings are embedded verbatim in returned SVG; a schema key-vs-label mismatch in `spider.ts` that silently zeros every axis; an unreachable escape branch in `parsers/pdf.ts` (`parseSinglePDF` can never reach its filename-fallback for `naam`); and pervasive debug `console.log` calls inside `parseExcelFile` that dump the first 10 raw data rows of uploaded student files to the browser console — a privacy/data-leakage defect. Several warnings concern missing input validation, type-safety gaps, and test quality issues.

---

## Critical Issues

### CR-01: `applyBackupRestore` silently drops `activeKlasId` in merge mode

**File:** `utils/backup.ts:50`
**Issue:** In `samenvoegen` (merge) mode the restore function calls `Object.assign(klassenState.klassen, payload.klassen)` but never updates `klassenState.activeKlasId`. After a merge-restore, the active class pointer retains its pre-restore value. If the backup contained an `activeKlasId` pointing to a class that was just merged in, the UI will remain on the old (possibly unrelated) class. Worse, if the existing state had `activeKlasId = null` (no class loaded), the application ends up with klassen in the store but no active class, which breaks `addStudent`/`mergeVerzuim` because `appState.students` still points to the empty array set when `activeKlasId` was null.

**Fix:**
```typescript
} else {
  // samenvoegen: nieuwe klassen toevoegen, bestaande updaten
  Object.assign(klassenState.klassen, payload.klassen);
  // Also restore activeKlasId from the backup when the caller has no active class,
  // or unconditionally mirror the backup's active selection:
  if (payload.activeKlasId && klassenState.klassen[payload.activeKlasId]) {
    klassenState.activeKlasId = payload.activeKlasId;
    // Re-establish the appState bridge so addStudent writes to the right array
    const { appState } = await import('./datamodel');
    appState.students = klassenState.klassen[payload.activeKlasId].students;
  }
}
```
At minimum, add `klassenState.activeKlasId = payload.activeKlasId;` for the merge path (as already done for `overschrijven`).

---

### CR-02: SVG injection via unsanitized CSS variable names in `spider.ts`

**File:** `utils/spider.ts:68-70`
**Issue:** `buildSpiderSVG` receives `fillVar` and `strokeVar` as caller-supplied strings and embeds them verbatim inside an SVG string:
```
'fill="var(' + fillVar + ')" stroke="var(' + strokeVar + ')" ...'
```
If a caller passes a string containing `"` or `>` (e.g., via a compromised data source, URL parameter, or future UI binding), this breaks out of the attribute and injects arbitrary SVG/HTML. Because this SVG string is later inserted as `innerHTML` by the rendering layer, arbitrary script execution is possible. Even in the current codebase the caller is internal, but the function is a public export with no input validation — any future external caller or UI bug becomes a direct XSS vector.

**Fix:**
```typescript
function sanitizeCssVar(v: string): string {
  // CSS custom property names may only contain: letters, digits, -, _
  // Strip everything else to prevent injection.
  return v.replace(/[^a-zA-Z0-9\-_]/g, '');
}

// In buildSpiderSVG:
const safeFill   = sanitizeCssVar(fillVar);
const safeStroke = sanitizeCssVar(strokeVar);
// ...
'fill="var(' + safeFill + ')" stroke="var(' + safeStroke + ')" ...'
```

---

### CR-03: `spider.ts` scores keyed by `dg.id` but `buildSpiderSVG` looks up by `axis.key` — all scores resolve to zero when called with deelgebied labels

**File:** `utils/spider.ts:51-53` and `tests/spider.test.ts:27`
**Issue:** The spider chart test at line 27 builds axes with `key: dg.id` (e.g., `'va'`, `'mm'`) and scores with `key: dg.id` as well — that test passes. But `pdf.ts` stores `deelgebiedScores` keyed by `dg.label` (e.g., `'V&A'`, `'M&M'`). If the UI wires up the chart using `{ key: dg.label, label: dg.label }` axes (which is the natural thing to do when scores come from `student.deelgebiedScores`), then `scores[axis.key]` resolves to `undefined` → `null` → `scoreToRadius` returns `0` for every axis. The chart renders as a dot, silently, without any error. The test suite does not cover the label-keyed scenario.

This is a data-model mismatch baked into the API. The function's type signature (`scores: Record<string, string | null>`) gives no indication of which key convention (`id` vs `label`) is expected, and neither the function nor its JSDoc states the requirement.

**Fix:** Document the expected key convention explicitly and add a test using `dg.label`-keyed scores to catch the mismatch:
```typescript
/**
 * @param scores - Record keyed by deelgebied **id** (e.g. 'va', 'mm'), NOT label.
 *   Use: Object.fromEntries(DEELGEBIEDEN.map(dg => [dg.id, student.deelgebiedScores[dg.label]]))
 *   to convert label-keyed scores from parseSinglePDF/deelgebiedScores.
 */
```
Alternatively, normalize the key space in one canonical place to avoid the silent zero-chart bug in production.

---

### CR-04: `parseExcelFile` dumps raw student data rows to `console.log` on every call

**File:** `parsers/excel.ts:105-107`, `parsers/excel.ts:212-213`, `parsers/excel.ts:91`, `parsers/excel.ts:131-132`
**Issue:** Every call to `parseExcelFile` unconditionally logs the first 10 raw data rows of the uploaded file to the browser console (lines 105-107), including student names, IDs, and absence minutes. Line 218 also logs at module load time. In a production Tauri desktop app, the browser developer tools console is accessible to the operating system user. Student absence data is personal/sensitive information (GDPR-relevant in Dutch education). This is not a debug helper guarded by a flag — it runs unconditionally in all environments including production.

**Fix:** Remove or gate all `console.log`/`console.group` calls in `parseExcelFile` behind a debug flag:
```typescript
const DEBUG = false; // or: import.meta.env.DEV

// Replace unconditional logging blocks with:
if (DEBUG) {
  console.group('[excel.ts] RAW rijen: ' + sheetName);
  rawRows.slice(0, 10).forEach((r, i) => console.log('Rij ' + i + ':', r));
  console.groupEnd();
}
```
The same applies to `console.log('[excel.ts] Voorbeeld record:', records[0])` at line 213 which logs the first parsed student record (naam + leerlingnummer + all absence fields).

---

### CR-05: `parseSinglePDF` — filename fallback for `naam` is unreachable; `vakken` empty-check throws before deelgebied section is parsed

**File:** `parsers/pdf.ts:681-690`
**Issue:** Two logic problems in `parseSinglePDF`:

1. **Unreachable fallback (line 684):** The filename-fallback for `naam` (`if (!naam) { … }`) is placed before the `vakken` empty check and before the deelgebied parse. However, the function throws at line 688-689 when `vakken` is empty (`Geen vakken gevonden`), so for any PDF where `naam` is missing but `vakken` is also empty (e.g., malformed PDF), the filename fallback runs but the function throws before returning. Conversely, for a valid PDF where header parsing fails to extract `naam` but `vakken` is found, the fallback works. This is only a dead-code / misleading-logic issue when vakken is empty — but it means errors from those PDFs report "Geen vakken gevonden" without ever logging what filename would have been used as the fallback naam, making debugging harder.

2. **Throw before deelgebied parse when vakken is empty (lines 688-690):** If `vakken` is empty but the deelgebied table exists and is valid, the function throws "Geen vakken gevonden" without attempting to parse scores. The deelgebied table is structurally independent of the vakken section. A PDF could theoretically have a deelgebied table but no parseable vak/opdracht lines (e.g., first-year student with no feedback yet), and the function would throw instead of returning a partial record.

**Fix:** Reorder to attempt deelgebied parsing before the vakken guard, or relax the vakken guard to a warning:
```typescript
// Parse deelgebied FIRST (it's the primary data)
const deelgebiedStart = findDeelgebiedSection(lines);
if (deelgebiedStart < 0) {
  throw new Error('Overzicht Deelgebieden tabel niet gevonden');
}
const { deelgebiedScores, datapunten } = parseDeelgebiedTable(lines, deelgebiedStart);

// Vakken is secondary; warn but do not throw if absent
if (!vakken || vakken.length === 0) {
  console.warn(`[pdf.ts] Geen vakken gevonden in ${file.name}`);
}
```

---

## Warnings

### WR-01: `backup.ts` — no validation of restored payload structure before applying to state

**File:** `utils/backup.ts:42-51`
**Issue:** After `JSON.parse`, the code accesses `payload.klassen` and `payload.activeKlasId` with no type guard or structural check. If the ZIP contains a valid JSON file but with a different schema (e.g., a backup from a different application version or a manually edited file), `payload.klassen` could be `undefined`, an array, or a non-object. `Object.assign(klassenState.klassen, undefined)` is a no-op (silently does nothing), while assigning an array to `klassenState.klassen` would corrupt the state silently and cause crashes later in `Object.keys(klassenState.klassen)`.

**Fix:**
```typescript
if (!payload || typeof payload !== 'object' || typeof payload.klassen !== 'object' || Array.isArray(payload.klassen)) {
  return { success: false, message: 'Ongeldige backup structuur' };
}
```

---

### WR-02: `backup.ts` — missing file key check in `unzipSync` result

**File:** `utils/backup.ts:41`
**Issue:** `strFromU8(extracted[BACKUP_FILENAME])` will throw a `TypeError` (cannot convert undefined to string) if the ZIP does not contain an entry named `mentordashboard-backup.json` (e.g., user loads the wrong ZIP file). The outer `try/catch` will catch this and return `success: false`, but the error message will be a cryptic internal error rather than a user-meaningful one.

**Fix:**
```typescript
if (!extracted[BACKUP_FILENAME]) {
  return { success: false, message: `Backup bestand ontbreekt in ZIP: ${BACKUP_FILENAME}` };
}
```

---

### WR-03: `datamodel.ts` — variable shadowing: `normV3` and `normV4` shadow outer `normV`

**File:** `utils/datamodel.ts:154`, `utils/datamodel.ts:168`
**Issue:** `mergeVerzuim` declares `normV` in the Strategy 2 block (line 142), then declares `normV3` and `normV4` in subsequent `if (!student && v.naam)` blocks within the same `for` loop iteration — all under `var` scope (function-scoped, not block-scoped). This is a naming inconsistency left over from the JS migration and increases cognitive load when reading the function. More importantly, if a TypeScript migration later changes these to `const`/`let`, the repeated declarations within the same function scope would be a hard error. The use of `var` for these loop-local variables throughout `datamodel.ts` means none are block-scoped, which can cause subtle bugs if the loop body is ever refactored.

**Fix:** Use `let`/`const` instead of `var` for all variables in the `for` loop body, and use consistent naming:
```typescript
const normExcel = normalizeNaam(v.naam);
const excelAchternaam = normExcel.split(',')[0].trim();
```

---

### WR-04: `actiepunten.ts` — `VALID_STATUS` and `store` use `var` in an ES module; module-level `var` in TypeScript is unusual and error-prone

**File:** `utils/actiepunten.ts:10`, `utils/actiepunten.ts:70`
**Issue:** Both `VALID_STATUS` (an effectively immutable array) and `store` (the exported store object) are declared with `var`. In an ES module, `var` declarations are still function-scoped to the module's implicit function wrapper, but they are not hoisted to `globalThis` (correct behavior). However, `var` allows re-declaration in the same scope without error, and `VALID_STATUS` could be accidentally mutated (e.g., `.push()` adding an invalid status). The `tsconfig.migrated.json` with `noImplicitAny: true` was intended to enforce type safety — using `var` for module-level constants is inconsistent with that goal and bypasses any future `const`-enforcement linter rules.

**Fix:**
```typescript
const VALID_STATUS = ['open', 'opgepakt', 'herhaling'] as const;
```
This also gives `VALID_STATUS[number]` a union type usable in place of `string` for the `status` field.

---

### WR-05: `tsconfig.json` has `noImplicitAny: false` and `strict: false` — `tsconfig.migrated.json` is a separate opt-in that tests do NOT use

**File:** `tsconfig.json:14-15`, `tsconfig.migrated.json`
**Issue:** The main `tsconfig.json` disables strict mode and allows implicit `any`. The test files in `tests/` are included in `tsconfig.json`'s `include` array but NOT in `tsconfig.migrated.json`. This means running `tsc --noEmit` (the `typecheck` script) validates test files with `noImplicitAny: false`, and running `tsc --project tsconfig.migrated.json` skips test files entirely. A test file with an implicit `any` parameter (e.g., `actiepunten.test.js`) will never be type-checked at all. The `typecheck-migrated` script is not run by the `test` script, so CI runs tests without enforcing the stricter type rules on migrated source.

**Fix:** Either extend `tsconfig.migrated.json` to include `tests/` or add `typecheck-migrated` as a pre-test step:
```json
// package.json
"test": "tsc --noEmit --project tsconfig.migrated.json && vitest run"
```

---

### WR-06: `aggregation.ts` — labels not in DEELGEBIEDEN are silently passed through

**File:** `utils/aggregation.ts:34`
**Issue:** `aggregateDeelgebiedScores` builds `aggregationDetail` from whatever keys appear in `datapunt.scores`. If a datapunt contains a score for an unknown or misspelled label (e.g., `'V & A'` instead of `'V&A'`, or `'INS '` with a trailing space), it is aggregated as a new unknown deelgebied key rather than being ignored or triggering a warning. The returned `aggregationDetail` would then contain keys that don't match the 19 canonical labels, silently breaking any downstream lookup against `DEELGEBIEDEN`.

**Fix:** Filter score keys against `DEELGEBIEDEN` labels at aggregation time:
```typescript
import { SCORE_LEVELS, DEELGEBIEDEN } from './schema';
const KNOWN_LABELS = new Set(DEELGEBIEDEN.map(d => d.label));

// inside the loop:
for (const label of Object.keys(scores)) {
  if (!KNOWN_LABELS.has(label)) continue; // skip unknown labels
  // ... existing logic
}
```

---

### WR-07: `prognosis.ts` — `berekenPrognose` label `'bj2'` collides with traject name, causing confusion in `prognosis.test.ts`

**File:** `utils/prognosis.ts:150`, `tests/prognosis.test.ts:71`
**Issue:** When `traject === 'bj1'`, the function can return `label: 'bj2'` (meaning "the student advances to BJ2"). The test at line 71 checks `expect(['sbl', 'sbc', 'versneld_sbc']).toContain(result.label)` for a BJ2-traject scenario. No test covers the `traject === 'bj1'` paths at all, and the ambiguity between the traject parameter value `'bj2'` and the label output value `'bj2'` is a latent maintenance hazard — a future caller checking `result.label === 'bj2'` cannot tell whether it got a BJ1 result or a BJ2 input.

**Fix:** Rename the BJ1 advancement label to avoid collision:
```typescript
// In berekenPrognose, traject === 'bj1' branch:
label = 'naar_bj2'; // instead of 'bj2'
```
Update all consumers and tests accordingly.

---

### WR-08: `parsers/excel.ts` — sheet selection scoring ignores tie-breaking when multiple sheets score 0

**File:** `parsers/excel.ts:76-89`
**Issue:** When no sheet name matches any keyword, every sheet scores 0 and `bestScore` stays `-1`. The condition `score > bestScore` is `0 > -1 = true`, so the last sheet in `SheetNames` wins (because the array is iterated sequentially and every sheet scores 0, each overwrites the previous). The intention (per the comment "Fallback: het werkblad met de meeste rijen") is to fall back to the sheet with the most rows, but that fallback logic was never implemented — the code just picks the last zero-scoring sheet instead of the first (which was the pre-loop default). This means the intended "first sheet" fallback is broken: for multi-sheet Excel files where no sheet name matches, the parser picks the last sheet instead of the first.

**Fix:** Either implement the intended row-count fallback or change the condition to `score > bestScore` (strict greater-than, already the case) and initialize `sheetName = workbook.SheetNames[0]` before the loop but update it only when `score > bestScore` — which is the current code. The actual bug is the `>=` vs `>`: currently `score > bestScore` causes the last zero-scoring sheet to win (since `0 > -1` is true on every iteration). Change to only update when score strictly improves:
```typescript
// The initial bestScore should start at -1 and the first sheet should be the
// fallback, so only update sheetName when score is strictly better:
if (score > bestScore) {   // already correct — but sheetName must NOT be updated for score === 0
  // ... wait: score > -1 evaluates to true for score=0
  // Fix: initialize bestScore = 0 so zero-scoring sheets do NOT override the first sheet default
  bestScore = 0; // start here, not -1
```
Simplest correct fix:
```typescript
let sheetName = workbook.SheetNames[0]; // default: first sheet
let bestScore = 0; // 0 means "no keyword match" — only override if score > 0
workbook.SheetNames.forEach(function(name: string) {
  // ... scoring ...
  if (score > bestScore) { bestScore = score; sheetName = name; }
});
```

---

### WR-09: `parsers/pdf.ts` — `page.cleanup()` is called without `await`; return value ignored

**File:** `parsers/pdf.ts:85`
**Issue:** `page.cleanup()` in PDF.js 5.x returns a `Promise<void>`. Calling it without `await` means cleanup runs in the background while the next `getPage()` call may already be executing. For single-threaded JS this is usually harmless, but it can cause resource-use-after-free in worker implementations and produces an unhandled promise rejection if cleanup fails. The pattern is also inconsistent with the `await pdf.destroy()` on line 88.

**Fix:**
```typescript
await page.cleanup();
```

---

## Info

### IN-01: `actiepunten.test.js` is not migrated to TypeScript

**File:** `tests/actiepunten.test.js:1`
**Issue:** This is the only test file that remains as `.js`. It was described in Phase 11 notes as migrated to "ESM imports" (D-11-11), but ESM import syntax does not equal TypeScript. The file has no type annotations and imports TypeScript modules without type checking. The `tsconfig.migrated.json` excludes `tests/`, so this file is never type-checked.

**Fix:** Rename to `actiepunten.test.ts` and add minimal type annotations. The `makeStudent` and `resetAppState` helpers already have implicit parameter types that TypeScript would catch if `noImplicitAny` were applied.

---

### IN-02: Pervasive module-load `console.log` statements in production utilities

**File:** `utils/datamodel.ts:86`, `utils/klassen.ts:205`, `utils/leerlijnen.ts:91`, `utils/prognosis.ts:309`, `parsers/excel.ts:218`, `parsers/pdf.ts:14`
**Issue:** Six source files emit `console.log` at module load time (not inside functions). These fire on every page load in production. They are not gated by any debug flag. In a privacy-sensitive educational tool, unnecessary console output should be minimized.

**Fix:** Remove module-load log statements, or gate them:
```typescript
if (import.meta.env.DEV) console.log('[datamodel.ts] Data model loaded');
```

---

### IN-03: `spider.ts` — `scoreToRadius` is a module-private function not exported for testability

**File:** `utils/spider.ts:7`
**Issue:** `scoreToRadius` is the core scoring logic for the chart, but it is not exported. The test suite (`spider.test.ts`) only tests the full SVG output string. If `scoreToRadius` has a bug (e.g., wrong radius for a new score level), it cannot be unit-tested directly. Currently the function is correct, but the lack of direct test access is a maintainability issue.

**Fix:** Export `scoreToRadius` and add a direct unit test:
```typescript
export function scoreToRadius(score: string | null): number { ... }
```

---

### IN-04: `prognosis.ts` — `debugPrognose` is exported as part of the public API

**File:** `utils/prognosis.ts:246`
**Issue:** `debugPrognose` is a developer/console debug helper that calls `console.group`, `console.table`, etc. It is exported as a named export, making it part of the module's public API surface. This is fine for a debugging workflow, but it should at least be documented as a debug-only export so consumers don't accidentally depend on it.

**Fix:** Add a JSDoc comment marking it explicitly:
```typescript
/**
 * @internal Debug-only: dumps prognose breakdown to browser console.
 * Not intended for production UI use.
 */
export function debugPrognose(query: string, traject?: string): void {
```

---

### IN-05: `tests/prognosis.test.ts` — test at line 63 uses `scoresWithOverride('voldoende', 'onvoldoende', 0)` which overrides 0 items — effectively same as `allScores('voldoende')`

**File:** `tests/prognosis.test.ts:65`
**Issue:** The test creates `scoresWithOverride('voldoende', 'onvoldoende', 0)` (zero overrides applied), giving 19 × `voldoende`. It then manually sets indices 13–18 to `null`. The assertion checks for `sbl`, `sbc`, or `versneld_sbc`. With 13 `voldoende` scores and kern deelgebieden all as `voldoende`, the result should be `sbc` (≥15 would require all 19 to be voldoende — but only 13 are set). Actually 13 voldoende means SBL (≥13), and kern check: V&A, P&O, C&B, 1E&B are all `voldoende`, so `kernNietVoldaan.length === 0` and `isSBC = 15 <= 13` is false, so `label = 'sbl'`. The test assertion `toContain(result.label)` in `['sbl', 'sbc', 'versneld_sbc']` is overly permissive — it would pass even if the result were `'sbc'` when it should be `'sbl'`. A stronger assertion `expect(result.label).toBe('sbl')` would make this test meaningful.

**Fix:**
```typescript
expect(result.label).toBe('sbl'); // 13 voldoende meets SBL but not SBC (needs 15)
```

---

_Reviewed: 2026-05-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
