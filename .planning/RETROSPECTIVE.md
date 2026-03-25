# Retrospective: Mentordashboard CIOS

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-25
**Phases:** 5 | **Plans:** 10 | **Timeline:** ~2 days

### What Was Built

1. PDF parser (pdfjs-dist 5.5.207 ESM) — header + opdrachten + Overzicht Deelgebieden table extraction
2. Excel parser (SheetJS) — SomToday .xls format with dynamic sheet/header/ID detection
3. Doorstroomnorm engine — BJ2/SBC/Negatief prognose + leerlijn-toewijzing UI
4. Klasoverzicht — RAG tabel, sort, search, localStorage
5. Detailweergave — full dossier per student for mentorgesprek

### What Worked

- **Cross-AI review (Gemini) before execution** — correctly predicted all 3 HIGH/MEDIUM Excel format edge cases. This saved significant debugging time. The review-before-implement pattern is highly effective for domain-specific file formats.
- **GSD gap closure flow** — verify → gap found → plan gap → execute gap → re-verify worked cleanly for both the XLSX CDN guard and the leerlijn-toewijzing UI.
- **Incremental architecture** — window.* globals with classic scripts + ES modules only for pdf.js kept the "no build step" constraint clean throughout all phases.
- **Debugging with pdfjs internals** — reading the minified vendor bundle to understand `workerPort` vs `workerSrc` codepaths led to a definitive fix instead of trial-and-error.

### What Was Inefficient

- **REQUIREMENTS.md not updated during execution** — all 30 items remained unchecked until archive time. Updating requirements incrementally per phase would keep PROJECT.md's Validated section accurate.
- **workerPort detour** — multiple sessions spent on a wrong hypothesis (classic vs module worker). Should have read the vendor bundle first before applying a fix.
- **"bestandstype wordt niet ondersteund" diagnosis** — took multiple sessions to determine this was a Windows browser navigation error (dropping outside dropzone), not a PDF.js error.

### Patterns Established

- `window.* globals` for classic scripts + `type="module"` only for pdfjs — proven pattern for no-build-step browser apps
- Document-level `dragover`/`drop` preventDefault — required for any app using drag-and-drop file import to prevent browser navigation
- `workerSrc` (not `workerPort`) for pdfjs-dist 5.x — workerPort sends configure before module worker bootstraps
- Pre-flight `setTimeout` check for module globals — surfaces module load failures visibly to the user

### Key Lessons

- **Read the vendor bundle when debugging third-party module workers** — 30 minutes of grep reveals the actual codepath; saves hours of guessing
- **Cross-AI review before implementing domain-specific parsers** — Gemini correctly identified all SomToday format edge cases without seeing the actual files
- **Dutch OS error messages are not from your code** — "bestandstype wordt niet ondersteund" = Windows browser navigation, not app logic

### Cost Observations

- Model: claude-sonnet-4-6
- Sessions: ~4 sessions (context was summarized and continued across sessions)
- Notable: pdfjs debugging was the most expensive phase in terms of session turns; reading vendor source earlier would have cut this significantly
