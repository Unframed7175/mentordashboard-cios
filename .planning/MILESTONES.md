# Milestones: Mentordashboard CIOS

## v2.2 Onboarding, Export & Data Completeness — 2026-05-20

**Status:** ✅ Shipped
**Phases:** 20–24 | **Plans:** 9 (+1 gap closure) | **Timeline:** 2026-05-19 → 2026-05-20 (2 days)
**Code:** 132 tests passing · 49 files changed · 4445 insertions

### Delivered

6-step onboarding wizard for first-run mentors (klas aanmaken → PDFs → verzuim → BPV → instellingen → voltooiing), print-to-PDF export (A4 landscape, RAG color preservation), real BPV stage Excel parser with per-placement breakdown (locatie/ingeleverd/goedgekeurd), Rekenen & Nederlands section with own norm badges. Drag-drop import fixed (Tauri native intercept). PDF deelgebied parser hardened for Unicode dash characters and multi-page page headers.

### Key Accomplishments

1. **Drag-drop fix** — `dragDropEnabled: false` in tauri.conf.json restores HTML5 DataTransfer; HTML5 dropzones now work for PDF, .xls, and zip
2. **Print-to-PDF** — Afdrukken button + A4 landscape CSS isolation + `print-color-adjust: exact` for RAG badges; compacted to ≤4 pages
3. **BPV parser** — Real XLSX parser with per-placement breakdown: locatie, ingeleverd, goedgekeurd, in behandeling; `logboek` filename keyword added
4. **Rekenen & Nederlands** — `normalizeRekenScore()` + norm badges; duplicate AanvullendSection/StageSection removed
5. **Onboarding wizard** — 6 steps, ghost-class guard, klasId null-guard, abort flow, settings drempelwaarden step; `onboardingCompleted` flag persisted in store
6. **PDF parser hardened** — Unicode dash U+2010 regex fix; pending-buffer discards page-header rows on multi-page tables

### Known Gaps at Close

- RNL-04: PDF extraction for Rekenen/Nederlands deferred (no sample PDF with R&N section)
- MIG-01/MIG-02 integration tests skipped (no fixture files)
- Known deferred items: 2 (see STATE.md Deferred Items)

### Archive

- `.planning/milestones/v2.2-ROADMAP.md` — Phase details, decisions, issues
- `.planning/milestones/v2.2-REQUIREMENTS.md` — All 21 requirements with outcomes
- `.planning/v2.2-MILESTONE-AUDIT.md` — Audit report (status: tech_debt, 20/21)

## v1.0 MVP — 2026-03-25

**Status:** ✅ Shipped
**Phases:** 5 | **Plans:** 10 | **Timeline:** 2026-03-24 → 2026-03-25 (2 days)
**Code:** ~3000 LOC JavaScript (browser-only, no build step)

### Delivered

Browser-only mentordashboard (HTML/CSS/JS) for mentor Rafael Alvarez Stam at CIOS Zuidwest-NL (klas CSD2A, ~19 students). Mentor imports voortgang-PDFs and verzuim-Excel in one session and gets a complete mentorgesprek-ready overview — voortgang + verzuim + doorstroomprognose — without manual transcription.

### Key Accomplishments

1. **PDF parser** — Reads pdfjs-dist 5.5.207 ESM, extracts naam/leerlingnummer/periode, opdracht-statussen, feed forward, and Overzicht Deelgebieden V/G/E scores using coordinate-based table reconstruction
2. **Excel parser** — Handles real SomToday .xls exports: dynamic sheet/header detection, float studentnummer stripping, 4-strategy name matching (leerlingnummer → full name → achternaam exact → substring)
3. **Doorstroomnorm engine** — Correct BJ2/SBC/Negatief prognose calculation per the official CIOS norms; configurable leerlijn-toewijzing with localStorage persistence
4. **Klasoverzicht** — RAG status table for entire class with sort, search, localStorage persistence, and clear/re-import
5. **Detailweergave** — Per-student dossier view with voortgang accordion, verzuim stacked bar, prognose gap analysis, and persistent notities
6. **Cross-AI review (Gemini)** — Pre-implementation review correctly predicted all format edge cases in SomToday exports; review findings incorporated into plans

### Known Gaps

- DET-02/03/04 partially validated — UI implemented but full end-to-end validation requires live CSD2A data (verzuim fields and deelgebied scores from real PDFs)
- REQUIREMENTS.md tracking was not updated incrementally; all items marked complete at archive time based on code review

### Archive

- `.planning/milestones/v1.0-ROADMAP.md` — Phase details, decisions, issues
- `.planning/milestones/v1.0-REQUIREMENTS.md` — All 30 requirements with outcomes
