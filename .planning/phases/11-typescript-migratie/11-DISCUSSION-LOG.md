# Phase 11: TypeScript Migratie — Discussion Log

**Date:** 2026-05-13
**Facilitator:** Claude (gsd-discuss-phase)
**Areas discussed:** 4/4 selected

---

## Area 1: Migration strategy

**Q: How to handle the IIFE → ESM migration for window.* globals?**
A: Rename .js → .ts in-place, remove IIFEs, add named exports. No window.* bridging layer — app.js is dead code.

**Q: TypeScript strictness level per migrated file?**
A: noImplicitAny only (no strictNullChecks). Not full strict: true globally.

**Q: Should schema.ts export DEELGEBIEDEN and have prognosis.ts import it directly?**
A: Yes — schema.ts named exports; prognosis.ts imports from './schema'.

**Q: What happens to vendor/*.mjs files?**
A: Left as-is. Only parsers/pdf.ts changes, not the vendor files.

---

## Area 2: Module format

**Q: Does app.js need a window.* compatibility bridge during migration?**
A: No. app.js is dead code — no bridging needed. Named exports only.

**Q: How does SheetJS get imported in excel.ts?**
A: `import * as XLSX from 'xlsx'` — replaces window.XLSX global.

**Q: Does parsers/pdf.ts keep the same function signature as window.parseSinglePDF?**
A: Yes — identical signature, but as a named export.

**Q: How to handle missing or incorrect TypeScript types?**
A: Install @types/pdfjs-dist and @types/xlsx; fill gaps with `as any`.

**Q: Does actiepunten.test.js need to be updated for ESM imports?**
A: Yes — remove `global.window = global` and `require()`, replace with `import { actiepuntenStore, normalizeOnderwerp, isHerhaling } from '../utils/actiepunten'`.

---

## Area 3: Lost test files

**Q: Should recreated utils go straight to .ts or .js first?**
A: Straight to .ts — no .js intermediary.

**Q: What format for recreated test files?**
A: .test.ts format.

**Q: How to reconstruct test behavior without the original test files?**
A: Reconstruct behavior from app.js (behavior-driven: what the app does, not implementation internals).

**Q: How many tests should Phase 11 target in total?**
A: ~128 total passing tests (matching original pre-scaffold target).

**Q: Should zip support be restored and how?**
A: Yes — via fflate from npm (zero dependencies, ~8KB, sync API). Replaces vendor/zip.min.js.

**Q: fflate or jszip?**
A: fflate — lighter, actively maintained, used by Vite internally.

**Q: How should parsers/pdf.ts and parsers/excel.ts tests work?**
A: Fixture files in tests/fixtures/ — small real PDF and .xls committed to repo; tests assert on parsed output.

**Q: Should parseToetsplan.test.ts be recreated?**
A: No — parseToetsplan is dead code removed in Phase 8; no test needed.

---

## Area 4: Migration order

**Q: What order should files be migrated?**
A: Bottom-up: schema → utils → recreated utils → parsers → tests. Leaf modules first so dependents compile cleanly.

**Q: All files in Phase 11, or split parsers to Phase 12?**
A: All in Phase 11. Phase 12+ assumes clean TypeScript everywhere.

**Q: What to do when a type error is hard to fix immediately?**
A: `as any` + `// TODO: type` comment, continue. Goal is zero compile errors and passing tests, not perfect types.

---

## Decisions captured: 21 (D-11-01 through D-11-21)

See `11-CONTEXT.md` for the full decision list.
