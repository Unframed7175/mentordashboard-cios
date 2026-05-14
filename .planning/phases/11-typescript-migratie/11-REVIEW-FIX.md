---
phase: 11-typescript-migratie
fixed_at: 2026-05-14T13:25:00Z
review_path: .planning/phases/11-typescript-migratie/11-REVIEW.md
iteration: 1
findings_in_scope: 14
fixed: 13
skipped: 1
status: partial
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-05-14T13:25:00Z
**Source review:** .planning/phases/11-typescript-migratie/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 14 (CR-01 through CR-05, WR-01 through WR-09)
- Fixed: 13
- Skipped: 1 (WR-05 — already fixed per review notes)

## Fixed Issues

### CR-01: `applyBackupRestore` silently drops `activeKlasId` in merge mode

**Files modified:** `utils/backup.ts`
**Commit:** 5db9242
**Applied fix:** Added `import { appState } from './datamodel'` at top level. In the `samenvoegen` branch, after `Object.assign(klassenState.klassen, payload.klassen)`, added a conditional block that restores `klassenState.activeKlasId` from the backup payload when `payload.activeKlasId` is set and that klas is present in the merged state. Re-establishes `appState.students` bridge to point at `klassenState.klassen[payload.activeKlasId].students`.

---

### WR-01: No validation of restored payload structure

**Files modified:** `utils/backup.ts`
**Commit:** 5db9242
**Applied fix:** Added structural guard before applying payload to state: `if (!payload || typeof payload !== 'object' || typeof payload.klassen !== 'object' || Array.isArray(payload.klassen))` returns `{ success: false, message: 'Ongeldige backup structuur' }`.

---

### WR-02: Missing file key check in `unzipSync` result

**Files modified:** `utils/backup.ts`
**Commit:** 5db9242
**Applied fix:** Added `if (!extracted[BACKUP_FILENAME])` check before calling `strFromU8()`, returning a user-meaningful error message when the expected JSON file is absent from the ZIP.

---

### CR-02: SVG injection via unsanitized CSS variable names in `spider.ts`

**Files modified:** `utils/spider.ts`
**Commit:** da82c71
**Applied fix:** Added `sanitizeCssVar(v: string): string` function that strips all characters not in `[a-zA-Z0-9\-_]`. Applied to both `fillVar` and `strokeVar` before embedding in SVG attribute values as `safeFill` and `safeStroke`.

---

### CR-03: `spider.ts` axis key convention undocumented — silent zero-chart when label-keyed scores used

**Files modified:** `utils/spider.ts`
**Commit:** e62dfe0
**Applied fix:** Extended the `buildSpiderSVG` JSDoc to explicitly document that `scores` must be keyed by `dg.id` (not `dg.label`), and provided the conversion pattern callers should use when scores come from `parseSinglePDF`'s `deelgebiedScores` (which are label-keyed).

---

### CR-04: `parseExcelFile` dumps raw student data to console on every call

**Files modified:** `parsers/excel.ts`
**Commit:** b66f869
**Applied fix:** Removed all four unconditional `console.log`/`console.group` calls inside `parseExcelFile` that logged raw row data, header structure, and parsed student records. Replaced with comments pointing to `debugExcelBestand()` for development use. The `console.log('[excel.ts] Excel parser loaded')` module-level call was left (addressed in IN-02, out of scope for this run).

---

### CR-05: `parseSinglePDF` — unreachable naam fallback and throw before deelgebied parse

**Files modified:** `parsers/pdf.ts`
**Commit:** 2436423
**Applied fix:** Reordered `parseSinglePDF` so deelgebied parsing runs first (it's the primary data). The `findDeelgebiedSection`/`parseDeelgebiedTable` block now executes before the naam fallback and the vakken check. The `vakken` empty check was changed from `throw new Error(...)` to `console.warn(...)` so PDFs with a valid deelgebied table but no parseable vak lines still return a record with their scores instead of discarding everything.

---

### WR-03: `var normV`, `var normV3`, `var normV4` in loop body of `mergeVerzuim`

**Files modified:** `utils/datamodel.ts`
**Commit:** 3c16d60
**Applied fix:** Changed `var normV`, `var normV3`, and `var normV4` to `const` in the three strategy blocks inside the `for` loop body. These variables are block-local by intent and should not be function-scoped.

---

### WR-04: `VALID_STATUS` declared as mutable `var` array

**Files modified:** `utils/actiepunten.ts`
**Commits:** 96f21ff, 6106813
**Applied fix:** Changed `var VALID_STATUS = [...]` to `const VALID_STATUS = [...] as const`. Added `type ValidStatus = typeof VALID_STATUS[number]` alias and `isValidStatus(s: string): s is ValidStatus` type guard to replace `.indexOf()` calls (which TypeScript rejected when the array became a readonly tuple). Both `add` and `update` methods now use the type guard for status validation.

---

### WR-06: Unknown deelgebied labels pass through silently in `aggregation.ts`

**Files modified:** `utils/aggregation.ts`
**Commit:** e520b0a
**Applied fix:** Added `import { DEELGEBIEDEN }` and `const KNOWN_LABELS = new Set(DEELGEBIEDEN.map(d => d.label))` at module level. Added `if (!KNOWN_LABELS.has(label)) continue;` as the first check in the inner score loop, so misspelled or unknown labels are skipped rather than creating phantom keys in `aggregationDetail`.

---

### WR-07: `berekenPrognose` label `'bj2'` collides with traject parameter name

**Files modified:** `utils/prognosis.ts`
**Commit:** d8e09c7
**Applied fix:** Renamed `label = 'bj2'` to `label = 'naar_bj2'` in the `traject === 'bj1'` branch. Updated the JSDoc comment listing valid labels per traject. No test covered this label value, so no test changes were needed.

---

### WR-08: Sheet selection `bestScore` initialization causes last-sheet-wins bug

**Files modified:** `parsers/excel.ts`
**Commit:** b11d726
**Applied fix:** Changed `let bestScore = -1` to `let bestScore = 0`. With `bestScore = -1`, zero-scoring sheets (no keyword match) all passed the `score > bestScore` condition (0 > -1), causing the last sheet to win. With `bestScore = 0`, zero-scoring sheets do not override the initial `sheetName = workbook.SheetNames[0]` fallback.

---

### WR-09: `page.cleanup()` called without `await`

**Files modified:** `parsers/pdf.ts`
**Commit:** c2a4ccb
**Applied fix:** Added `await` before `page.cleanup()` in `extractAllTextItems` to ensure cleanup completes before the next `getPage()` call, consistent with the existing `await pdf.destroy()` pattern.

---

## Skipped Issues

### WR-05: `tsconfig.json` strict settings

**File:** `tsconfig.json:14-15`
**Reason:** The REVIEW.md finding states "already partially fixed (vitest/globals + node types added). No further action needed for this finding — mark as resolved." No code change was required.

---

## Verification Results

**TypeScript typecheck (`npm run typecheck`):** PASSED — 0 errors
**Test suite (`npm run test`):** PASSED — 31 passed | 5 skipped (36 total), 7 test files passed | 1 skipped (8 total)

The `as const` change on `VALID_STATUS` (WR-04) initially caused a TypeScript error (TS2345) because `indexOf` on a `readonly` tuple requires the union literal type. This was resolved in a follow-up commit (6106813) by adding a type guard `isValidStatus()` — all other fixes applied cleanly on the first attempt.

---

_Fixed: 2026-05-14T13:25:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
