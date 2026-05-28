# Milestones: Mentordashboard CIOS

## v2.3 Inzicht, Configuratie & Testers Onboarden — 2026-05-28

**Status:** ✅ Shipped
**Phases:** 25–30 | **Plans:** 14 | **Timeline:** 2026-05-21 → 2026-05-28 (7 days)
**Code:** 210 tests passing · ~158 commits · 21 src/ files + ci.yml + INSTRUCTIES.md + TESTPLAN.md · 4503 LOC TS/TSX

### Delivered

Doorstroomdrempels volledig configureerbaar in settings (SBL/SBC/negatief totaal/per leerlijn/BJ1 versneld-SBC). Score-telling op leerlingtegels ("14/19 ≥V · 1 O") met trend-pijl ↑↓ voor fase-vergelijking. Inline klas hernoemen (double-click) en lege klas verwijderen (hover × knop). Bug/feedback rapportage knop → mailto: met OS, versie en console ring buffer automatisch ingevuld. UI volledig gestreamlind (spacing, typografie, dark mode, nav-stripe fix, BPV loading state). In-app helppagina (? knop, 4 stappen), INSTRUCTIES.md en TESTPLAN.md (13 scenario's) voor collega-testers. GitHub Actions CI op Windows x64 + macOS Apple Silicon bij elke push naar main.

### Key Accomplishments

1. **Doorstroomnorm configuratie** — `utils/normen.ts` met LazyStore + Number.isFinite validatie; alle 8 hardcoded sites in prognosis.ts vervangen door `getNormenSync()`; SettingsPage Section 5 met SBC<SBL warning en "Herstel standaard" knop
2. **Score-telling + trend-pijl** — LeerlingTegel toont "14/19 ≥V · 1 O" + ↑↓ pijl; trendMap useMemo in KlasOverzicht met computeTrend guards (length/period/grijs/rank)
3. **Klasbeheer** — `renameKlas()` met TDD (data-integrity/unknown-id/duplicate-name guards); KlasTabStrip volledig herschreven: `<div role="tab">`, hover/focus-within × delete, double-click inline rename met isCommittingRef guard
4. **Bug/feedback rapportage** — `utils/feedback.ts` ring buffer (last 10 console errors), `setLastImport()`, `buildMailtoUrl()`; `window.onerror` + `console.error` patch in main.tsx; FeedbackModal UI
5. **UI streamlining** — Nav diagonal stripe CSS ::after fix; BPV loading vs empty state onderscheid; DoortstroomPrognoseSection volledig herschreven; view-fade-in transities; dark mode vlekken verwijderd
6. **Testers onboarden** — HelpPage.tsx (statische JSX, 4 secties); ? knop in KlasTabStrip; INSTRUCTIES.md (8 secties, contactinfo); TESTPLAN.md (13 scenario's met ☐ checkboxen); GitHub Actions CI met APPLE_SIGNING_IDENTITY:'-' en geen release keys

### Key Decisions

- `normalizeRekenScore()` apart van `normalizeScore()` — Rekenen/Nederlands heeft eigen score-formaat
- R&N is student-level (niet period-level) — schrijven naar ALLE records met zelfde leerlingId voorkomt write/read split bij BJ2 studenten met 2 periodes
- CI workflow afgeleid van release.yml — zelfde matrix maar zonder release-keys om ongewenste GitHub Releases te voorkomen
- `APPLE_SIGNING_IDENTITY: '-'` behouden in ci.yml — ad-hoc signing vereist voor macOS binary zonder Developer cert
- HelpPage static JSX — geen `dangerouslySetInnerHTML`, geen user-controlled content

### Known Gaps at Close

- RNL-04: PDF extraction for Rekenen/Nederlands deferred (no sample PDF with R&N section)
- BPV column matchers: blocked on real BPV Excel export file (gerealiseerdeUren shows 0)
- R&N scores in klasoverzicht-tegels deferred to future milestone

### Archive

- `.planning/milestones/v2.3-ROADMAP.md` — Phase details, decisions, issues, stats
- `.planning/milestones/v2.3-REQUIREMENTS.md` — All 36 requirements with outcomes

---

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
