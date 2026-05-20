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

---

## Milestone: v2.2 — Onboarding, Export & Data Completeness

**Shipped:** 2026-05-20
**Phases:** 5 (20–24) | **Plans:** 9 (+1 gap closure) | **Timeline:** 2 days
**Code:** 132 tests passing · 49 files changed · 4445 insertions

### What Was Built

1. Drag-drop fix — `dragDropEnabled: false` restores HTML5 DataTransfer in Tauri 2 (Phase 20)
2. Print-to-PDF — Afdrukken button, A4 landscape, RAG color preservation via `print-color-adjust: exact` (Phase 21)
3. BPV Excel parser — real XLSX with per-placement breakdown (locatie/ingeleverd/goedgekeurd) (Phase 22)
4. Rekenen & Nederlands — `normalizeRekenScore()` + norm badges, own doorstroomnorm (Phase 23)
5. 6-step onboarding wizard — first-run detection, ghost-class guard, abort flow, settings step (Phase 24)
6. PDF parser hardened — Unicode dash U+2010 fix, multi-page page-header row filtering

### What Worked

- **Cross-AI review (Gemini + Codex) before gap closure** — surfaced 4 concrete gaps (ONB-06 missing settings step, ghost-class trap, klasId null-guard, abort flow) before execution. All 4 were real and fixed in plan 24-03.
- **Milestone audit before completion** — running `/gsd-audit-milestone` caught ONB-08 (wizard re-ran after zero-PDF abort) which wasn't in any plan. Fixed in minutes before archiving.
- **Unicode character logging pattern** — when `startsWith('-')` silently failed, logging char codes (`U+XXXX` format) pinpointed U+2010 HYPHEN vs U+002D HYPHEN-MINUS immediately. Simple, decisive.
- **`klassenState` sync pattern** — module-level object populated during `loadKlassen()` before React mounts. Adding `onboardingCompleted` to it was a 3-file change with zero risk of timing issues.

### What Was Inefficient

- **No VERIFICATION.md for any v2.2 phase** — UAT files captured the validation but weren't in the standard format. Milestone audit had to operate without verification records, which cost extra time.
- **PDF parser fix took 3 iterations** — pendingBlank buffer → `startsWith('-')` (broken) → Unicode regex. The correct question to ask upfront was "what does the first character of a datapunt actually look like at the byte level?" Asking it after the first failure would have saved two iterations.
- **BPV-04 loading vs empty state** — cosmetic debt carried forward. Small issues like this tend to accumulate; worth closing in the same phase rather than deferring.

### Patterns Established

- `dragDropEnabled: false` in `tauri.conf.json` — required for any Tauri 2 app using HTML5 drag-drop; Tauri's native handler consumes OS drag events before the browser sees them
- Unicode-aware dash regex `/^[-‐‑‒–—―−]/` — SomToday PDFs use U+2010 HYPHEN, not ASCII hyphen. Any PDF text extraction must be Unicode-aware.
- `onboardingCompleted` boolean in LazyStore, read via `klassenState` sync object — clean pattern for any first-run gating that must be resolved before React mounts
- `print-color-adjust: exact` + `#root > *` isolation — required combination for RAG badge color preservation and correct print scope in a React/Tauri app

### Key Lessons

- **Log char codes when a string comparison silently fails** — visually identical characters often differ at the byte level (U+2010 vs U+002D). `charCodeAt(0).toString(16)` resolves it instantly.
- **Run `/gsd-audit-milestone` before completion, not after** — gaps found during audit are cheap to fix; gaps found post-archive become v.next tech debt.
- **Cross-AI review is most valuable right before gap closure** — adversarial review on a nearly-complete feature catches the corner cases that normal planning misses (abort flows, guard conditions, edge cases).

### Cost Observations

- Model: claude-sonnet-4-6
- Sessions: ~3 sessions across 2 days
- Notable: PDF parser iteration was the most expensive debugging stretch; Unicode char logging cut the final iteration to one round-trip
