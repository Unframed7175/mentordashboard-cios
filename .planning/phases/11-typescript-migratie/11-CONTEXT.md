# Phase 11: TypeScript Migratie - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Alle utils en parsers zijn geporteerd naar TypeScript — pdfjs-dist, SheetJS en de doorstroomnorm engine geven identieke output als de JavaScript originelen, bewezen door de volledige test suite. Lost test files worden herschreven als TypeScript tests.

**In scope:** utils/*.js → .ts, parsers/*.js → .ts, recreate lost utils (aggregation, backup, spider), recreate 7 lost test files as .test.ts, update actiepunten.test.js to ESM imports, add fflate for zip, install type packages.

**Out of scope:** Tauri plugin-store (Phase 12), file dialog/drag-drop (Phase 13), React UI (Phase 14), app.js (dead code — not migrated).

</domain>

<decisions>
## Implementation Decisions

### Migration strategy

- **D-11-01:** Rename `.js` → `.ts` in-place — no intermediate `.js` kept alongside the `.ts`
- **D-11-02:** Remove IIFE wrappers and `window.*` assignments; replace with named ES module exports (`export function`, `export const`)
- **D-11-03:** Test files switch to ESM import syntax (`import { fn } from '../utils/module'`) — no `require()`, no `global.window = global`
- **D-11-04:** `schema.ts` exports `DEELGEBIEDEN` and `SCORE_LEVELS` as named exports; `prognosis.ts` imports `DEELGEBIEDEN` from `'./schema'` (not from window)
- **D-11-05:** TypeScript strictness: `noImplicitAny: true` per migrated file only (via `// @ts-check` or per-file tsconfig override) — NOT `strictNullChecks`, NOT `strict: true` globally
- **D-11-06:** `vendor/pdf.min.mjs` and `vendor/pdf.worker.min.mjs` stay as-is; only `parsers/pdf.ts` changes

### Module format and globals

- **D-11-07:** `app.js` is dead code — no `window.*` bridging layer needed; migrated modules export named functions only
- **D-11-08:** SheetJS: `import * as XLSX from 'xlsx'` in `parsers/excel.ts` — replaces `window.XLSX` global
- **D-11-09:** `parsers/pdf.ts` exposes the same API as the old `window.parseSinglePDF` (identical function signature), but as a named export
- **D-11-10:** Type packages: install `@types/pdfjs-dist` and `@types/xlsx`; where types are still incomplete or wrong, cast with `as any` rather than blocking
- **D-11-11:** `tests/actiepunten.test.js` updated to ESM import: remove `global.window = global`, replace `require('../utils/actiepunten.js')` with `import { actiepuntenStore, normalizeOnderwerp, isHerhaling } from '../utils/actiepunten'`

### Lost test files (reconstruction)

- **D-11-12:** Lost utils recreated directly as `.ts` — no `.js` intermediary step
- **D-11-13:** Recreated test files use `.test.ts` extension
- **D-11-14:** Test behavior reconstructed from `app.js` (behavior-driven: what the app does, not implementation internals)
- **D-11-15:** Target ~128 total passing tests across all test files
- **D-11-16:** Zip support restored via `fflate` (npm) — replaces lost `vendor/zip.min.js`; `utils/backup.ts` imports from `fflate`
- **D-11-17:** `parsers/pdf.ts` and `parsers/excel.ts` tests use fixture files in `tests/fixtures/` — a small real `.pdf` and `.xls` file committed to the repo; tests read these files and assert on parsed output
- **D-11-18:** `tests/parseToetsplan.test.ts` is NOT recreated — `parseToetsplan` was deliberately removed in Phase 8; dead code has no test

### Migration order

- **D-11-19:** Bottom-up migration order: `schema.ts` → `utils/*.ts` (prognosis, datamodel, klassen, leerlijnen, actiepunten) → recreate lost utils (aggregation, backup, spider) → `parsers/*.ts` → tests
- **D-11-20:** All files migrated in Phase 11 — utils, parsers, tests all in one phase; Phase 12+ can assume clean TypeScript throughout
- **D-11-21:** Type errors strategy: cast to `as any` with `// TODO: type` comment and continue — goal is zero compile errors and passing tests, not perfect types in Phase 11

### Claude's Discretion

- Exact TypeScript interface shapes for internal data structures (StudentRecord, KlasData, etc.) — use `as any` initially and add interfaces where obvious
- Whether to create a `types/index.ts` barrel for shared types or inline them per-module
- fflate API choice (sync `strToU8`/`zipSync` vs async) — use sync for simplicity since backup is user-triggered

</decisions>

<specifics>
## Specific Ideas

- Migration is in-place: after Phase 11, `utils/*.ts` and `parsers/*.ts` exist; the old `.js` files are gone
- `utils/backup.ts` replaces the zip functionality lost from `vendor/zip.min.js` — fflate gives both zip creation and reading
- Parser fixture files should be minimal — smallest valid PDF and .xls that exercises the core parsing path
- `actiepunten.test.js` is the one surviving test file; it gets updated to ESM imports but stays as the baseline to confirm the shim update doesn't break anything

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements and success criteria
- `.planning/ROADMAP.md` §Phase 11 — MIG-01, MIG-02, MIG-03 requirements and success criteria

### Prior phase context and decisions
- `.planning/phases/10-scaffold-toolchain/10-03-SUMMARY.md` — Vitest config, jest shim, surviving test file (actiepunten.test.js), gap list
- `.planning/phases/10-scaffold-toolchain/10-VERIFICATION.md` — TCH-03 partial acceptance, list of permanently lost files
- `.planning/STATE.md` §Accumulated Context — D-08 (noImplicitAny per-module), D-09 (pdfjs worker path), D-10 (SheetJS cpexcel registration)

### Source files to migrate (current state)
- `utils/schema.js` — domain constants (DEELGEBIEDEN, SCORE_LEVELS); no IIFE
- `utils/prognosis.js` — doorstroomnorm engine; likely window.* exports
- `utils/datamodel.js` — in-memory data model; window.* exports
- `utils/klassen.js` — multi-class state management; window.* globals
- `utils/leerlijnen.js` — leerlijn mapping persistence; window.* globals
- `utils/actiepunten.js` — actiepunten store; window.* globals
- `parsers/pdf.js` — PDF parser using pdfjs-dist; already uses ESM import for vendor
- `parsers/excel.js` — Excel parser using SheetJS; window.XLSX global

### Lost files to recreate (behavior source)
- `app.js` — canonical behavior source for reconstructing lost utils; aggregation, backup, and spider logic is embedded here

### Existing test infrastructure
- `tests/actiepunten.test.js` — only surviving test file; shows the old require/global.window pattern to replace
- `tests/vitest-setup.js` — jest shim; shows available mock APIs
- `vitest.config.ts` — test include pattern `tests/**/*.test.{js,ts}`; setupFiles; coverage paths

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/vitest-setup.js`: jest shim already handles `jest.fn`, `jest.resetModules`, `jest.spyOn` — new .test.ts files can use these directly
- `vitest.config.ts`: already configured for jsdom, globals, and `.test.{js,ts}` pattern — no changes needed for Phase 11 test files
- `vendor/pdf.min.mjs` + `vendor/pdf.worker.min.mjs`: already in place; `parsers/pdf.ts` imports from `'../vendor/pdf.min.mjs'`

### Established Patterns
- `parsers/pdf.js` already uses ESM import (`import * as pdfjsLib from '../vendor/pdf.min.mjs'`) — model for how other parsers should look after migration
- `utils/schema.js` already uses plain `const` (no IIFE) — simplest migration target; no wrapper removal needed
- Phase 10 decisions: `tsconfig.json` has `strict: false` globally; per-file `noImplicitAny` is added via `// @ts-nocheck` removal or per-file override

### Integration Points
- Phase 12 (Versleutelde Opslag) imports `utils/klassen.ts` and `utils/datamodel.ts` — these must export clean TypeScript interfaces
- Phase 13 (Bestandstoegang) calls `parsers/pdf.ts` and `parsers/excel.ts` — same function signatures as old `window.*` globals, now named exports
- Phase 14 (React UI) imports all utils as ES modules — clean exports from Phase 11 are a prerequisite

</code_context>

<deferred>
## Deferred Ideas

- Full `strict: true` (strictNullChecks, etc.) — deferred to post-v2.0; too disruptive alongside migration
- `types/index.ts` barrel with full interface definitions — can be added incrementally; Phase 11 uses `as any` where needed
- E2E test with real PDF files larger than the minimal fixture — Phase 13 (Bestandstoegang) is the right home for integration tests
- Migrating `app.js` itself — dead code, will be removed when React UI (Phase 14) replaces it entirely
- Migrating `index.html.bak` or `index.html` — not relevant; React replaces the HTML entry in Phase 14

</deferred>

---

*Phase: 11-typescript-migratie*
*Context gathered: 2026-05-13*
