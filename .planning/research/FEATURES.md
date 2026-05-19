# Feature Landscape: v2.2 Onboarding, Export & Data Completeness

**Domain:** Tauri desktop app — Dutch MBO mentor dashboard (CIOS Zuidwest-NL)
**Researched:** 2026-05-19
**Milestone:** v2.2 — four new feature areas + one bug fix
**Confidence:** MEDIUM-HIGH (Dutch MBO norms verified via rijksoverheid.nl + examenbladmbo.nl; UX patterns verified via PatternFly + Eleken; Tauri print limitations verified via GitHub issues)

---

## Context: What Already Exists

This research covers *only* what is new in v2.2. The following are already shipped and must NOT be re-built:

- Multi-class tabbladen, tab strip, klas modal (`KlasTabStrip`, `KlasModal`)
- Import page with PDF + Excel drag-drop and file dialog (`ImportPage`)
- Auto class detection from PDF header (Phase 16)
- Settings panel with dark mode, deelgebieden config, drempelwaarden, BPV config (`SettingsPage`)
- Student detail view with spider chart, KPI tiles, verzuim, deelgebieden matrix (`DetailWeergave`)
- BPV progress section showing gerealiseerdeUren vs verwachteUren (`BpvProgressSection`)
- Stage section showing organisatie, periode, goedgekeurde uren (`StageSection`)
- Aanvullend section with manual taalniveau/rekenniveau dropdowns (`AanvullendSection`)
- AES-256 encrypted local storage via Tauri plugin-store

**Key architectural constraint:** The app already tracks `taalniveau` and `rekenniveau` as manual dropdown fields in `AanvullendSection`. The v2.2 Rekenen & Nederlands feature must *extend* this — not replace it.

---

## Feature 1: Onboarding Wizard (ONB-01..08)

### What It Does

A multi-step modal flow that appears on first launch (no klassen present). Guides the mentor through klas aanmaken → voortgang PDFs uploaden → verzuim Excel → stage Excel (optioneel) → instellingen (optioneel).

### Table Stakes (must have)

| Requirement | Why Expected | Complexity | Notes |
|-------------|--------------|------------|-------|
| Progress indicator (step X of N) | Users need to know where they are; PatternFly + Eleken both identify this as the single most critical pattern | LOW | Numbered steps in left panel or top strip |
| Linear forward/back navigation | Standard wizard navigation; users must be able to correct mistakes | LOW | Prev/Next buttons in footer |
| Step 1 non-skippable: klas naam invoeren | Klas naam is required before any import can happen; existing `KlasModal` logic applies | LOW | Reuse existing `createKlas()` from `utils/klassen.ts` |
| Step 2 non-skippable: voortgang PDFs | Core data source — app is empty without it | MEDIUM | Reuse existing `ImportPage` PDF logic |
| Step 3 skippable: verzuim Excel | Verzuim is important but some mentors may not have the file yet | LOW | "Overslaan" button visible; must NOT block progress |
| Step 4 skippable: stage Excel | BPV parser is new in v2.2; file may not be available | LOW | "Overslaan" button visible; note "kan later worden geïmporteerd" |
| Step 5 skippable: instellingen | Default settings work out of the box | LOW | "Overslaan" button; links to settings panel later |
| Wizard dismissal → dashboard opens | ONB-07: After "Voltooien" the wizard closes and dashboard shows with the new klas active | LOW | `setView('klas')` in `App.tsx` |
| Never shows again when klassen exist | ONB-08: Check `Object.keys(klassenState.klassen).length > 0` at app startup | LOW | Add to `App.tsx` init logic |

### Differentiators (nice to have, not blocking)

| Feature | Value | Complexity | Notes |
|---------|-------|------------|-------|
| Inline file status per step (e.g., "3 leerlingen geladen") | Confirms success before moving on | MEDIUM | Show import result count in step footer |
| "Later instellen" link on optional steps | Reassures mentor they can configure later | LOW | Link to settings panel from the relevant step |
| Wizard re-trigger from Settings | Power-users may want to re-run onboarding for a new klas | LOW | "Wizard opnieuw starten" button in Settings |

### Anti-Features (do NOT build)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| "Skip to finish" from non-optional steps | Step 2 (PDFs) cannot be skipped — app has no data without it | Disable skip on mandatory steps; enable only on optional ones |
| Animated slide transitions | Adds complexity for no mentor value; Industry font + card layout conveys professionalism already | Plain step swap with `display: none / block` |
| Wizard with 8+ steps | Cognitive overload; research shows 3-5 steps is optimal | Keep to 5 steps; steps 3-5 are lightweight (one upload each) |
| Wizard that blocks importing additional klassen | Power user may want to skip wizard and use the existing import flow | Wizard is only shown on first run; subsequent klassen use existing modal + import flow |

### Step Flow (confirmed by ONB-01..08)

```
Step 1 — Klas aanmaken (REQUIRED)
  Input: klasnaam tekstinvoer
  Action: createKlas(naam) uit utils/klassen.ts
  Next enabled: when naam.trim().length > 0

Step 2 — Voortgang PDFs (REQUIRED)
  Input: dropzone + bestandsknop (reuse ImportPage PDF logic)
  Action: parseSinglePDF per file → addStudent
  Next enabled: when at least 1 student parsed successfully

Step 3 — Verzuim Excel (OPTIONAL)
  Input: dropzone + bestandsknop voor .xls/.xlsx
  Action: parseExcelFile → mergeVerzuim
  Skip label: "Overslaan — later importeren via Import-tabblad"
  Next enabled: always (skip or upload both advance)

Step 4 — Stage Excel / BPV-uren (OPTIONAL)
  Input: dropzone + bestandsknop voor .xls/.xlsx
  Action: parseBpvExcel → saveBpvData (new v2.2 real parser)
  Skip label: "Overslaan — nog geen stage-bestand"
  Next enabled: always

Step 5 — Instellingen (OPTIONAL)
  Input: embedded mini-settings (drempelwaarden, BPV verwachte uren)
  Action: links to existing settings state
  Skip label: "Overslaan — standaardinstellingen gebruiken"
  Finish button: "Dashboard openen"
```

### Skip Behavior (table stakes UX pattern)

- Optional steps show a secondary "Overslaan" button alongside the primary "Volgende" button.
- Skipped steps are not blocked from being completed later — all skip-able data can be imported via the existing Import tabblad or Settings panel.
- The PatternFly pattern places the skip button as a tertiary action to the right; the primary "Volgende" button is always leftmost.
- After the wizard completes (step 5 done or skipped), `App.tsx` transitions to `view = 'klas'`.

### Dependencies on Existing Features

- `createKlas()` from `utils/klassen.ts` — already exists
- PDF import logic in `ImportPage.tsx` — can be extracted into a shared hook/function
- Excel verzuim logic in `ImportPage.tsx` — same
- `parseBpvExcel()` in `utils/bpv.ts` — currently stubbed, must be implemented as part of BPV feature (Feature 3)
- `getBpvConfig()` + `saveBpvConfig()` from `utils/bpv.ts` — already functional

### Complexity Assessment

Overall: MEDIUM. The wizard is a UI shell wrapping logic that already exists. The hard part is extracting import logic from `ImportPage.tsx` into reusable units that work both inside the wizard and standalone. Step 4 depends on Feature 3 (BPV parser) being done first.

---

## Feature 2: Print-to-PDF Export — Mentorgesprekverslag (EXP-01..04)

### What It Does

A print-optimized view of a student's detail data, accessible via a "Afdrukken" button in `DetailWeergave`. Uses the browser's native print dialog (Ctrl+P equivalent) to produce an A4 PDF. No silent/headless PDF generation — browser print dialog is intentional.

### What a Mentorgesprekverslag Contains

Based on Dutch MBO mentor practice and the existing `DetailWeergave` sections:

| Section | Content | Source in App | Print Priority |
|---------|---------|---------------|----------------|
| Header | Leerlingnaam, datum gesprek, klasnaam, periode | student.naam, Date.now(), klassenState | Required |
| Doorstroom prognose | RAG status + norm uitleg (positief/negatief/versneld) | `DoortstroomPrognoseSection` | Required |
| Leerlijnen score | Score per leerlijn (lesgeven / organiseren / professioneel handelen) | `LeerlijnenSection` | Required |
| Deelgebieden matrix | V/G/E per deelgebied, beide periodes | `DeelgebiedenMatrix` | Required |
| Verzuim | Aanwezigheidspercentage, geoorloofd, ongeoorloofd, totaal | `VerzuimSection` | Required |
| BPV-uren | Gerealiseerd vs. verwacht, percentage | `BpvProgressSection` | Required (show "geen data" if absent) |
| Rekenen & Nederlands | Niveau + score/resultaat | New RNL section (Feature 4) | Required when data present |
| Actiepunten | Open/opgepakt/herhaling per item | `FeedbackActiepuntenSection` | Required |
| Notities | Freetekst notities mentor | `NotitiesTextarea` | Optional (privacy: show only if non-empty) |
| Stage info | Organisatie, periode, goedgekeurde uren | `StageSection` | Optional (show if data present) |
| Feed forward | Feedback tekst per vak | `VakkenSection` or `FeedbackActiepuntenSection` | Recommended |

### CSS @media print Patterns for A4

```css
@media print {
  /* Hide all screen chrome */
  .nav-bar,
  .detail-nav-btn,
  .print-btn,
  .klas-tab-strip,
  .settings-btn {
    display: none !important;
  }

  /* A4 page setup */
  @page {
    size: A4;
    margin: 2cm;
  }

  /* Prevent orphaned sections */
  .detail-section {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Force section titles to stay with content */
  .detail-section-title {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Tables: header rows repeat on new pages */
  thead {
    display: table-header-group;
  }

  /* Remove shadows and interactive colors */
  .stat-card,
  .detail-section {
    box-shadow: none !important;
    border: 1px solid #ddd;
  }

  /* Dark mode override for print */
  body {
    background: white !important;
    color: black !important;
  }

  /* Hide empty sections */
  .bpv-empty-state,
  .stage-empty-state {
    display: none;
  }
}
```

**Critical Tauri note (MEDIUM confidence):** Tauri does not have a native print API (GitHub issue #4917 and #5330 confirm this as an open feature request as of mid-2026). `window.print()` works in the Tauri WebView and triggers the OS print dialog, which includes "Save as PDF" on both Windows and macOS. This is the correct approach for EXP-01. Silent/headless PDF generation (without dialog) is NOT achievable without bundling wkhtmltopdf or using `react-pdf` — both are out of scope for v2.2.

### Implementation Approach

1. Add a print stylesheet to `index.css` (or a separate `print.css` imported globally).
2. Add an "Afdrukken" button in `DetailWeergave` that calls `window.print()`.
3. The print view renders the current student's detail sections. No separate route or component needed — CSS `@media print` shows/hides the right elements.
4. Use `display: flex` → `display: block` in print media to avoid flex-model page-break bugs (known issue with react-to-print GitHub #324).

### Table Stakes

| Requirement | Complexity | Notes |
|-------------|------------|-------|
| "Afdrukken" button visible in DetailWeergave (EXP-04) | LOW | Single button, calls `window.print()` |
| A4 layout with correct margins (EXP-03) | LOW | `@page { size: A4; margin: 2cm; }` |
| Nav/buttons hidden in print (EXP-03) | LOW | `@media print { .nav-bar { display: none } }` |
| Section headings stay with section body (EXP-03) | LOW | `page-break-inside: avoid` on `.detail-section` |
| Header with leerlingnaam + datum + klas (EXP-02) | LOW | New print-only header element, `@media screen { display: none }` |
| Doorstroomprognose + deelgebieden + verzuim in verslag (EXP-02) | LOW | These sections already exist in DetailWeergave |
| Dark mode does not bleed into print output | LOW | `@media print { body { background: white; color: black } }` |

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| react-to-print library | Adds a dependency; `window.print()` + CSS is sufficient for this use case |
| react-pdf / PDFKit | Requires separate render tree, complex layout code, additional bundle weight; no silent export needed |
| Word/DOCX export | Explicitly out of scope per REQUIREMENTS.md |
| Custom PDF header/footer via @page margin boxes | CSS @page margin boxes have inconsistent browser support in WebView2; stick to in-page header |

### Dependencies

- Existing `DetailWeergave.tsx` sections (all already exist)
- New RNL section from Feature 4 (should be included in print when present)
- BPV data from Feature 3 (already has empty-state handling in `BpvProgressSection`)

### Complexity Assessment

LOW-MEDIUM. Pure CSS + one button. The main work is writing and testing the print stylesheet across the sections. The print header (leerlingnaam, datum, klas) requires a new ~10-line component hidden in screen mode.

---

## Feature 3: BPV Stage Excel Parser (BPV-01..04)

### Current State (important context)

The BPV infrastructure is already fully built:
- `utils/bpv.ts` — `parseBpvExcel()` exists but is **stubbed** (returns `{}` after magic-byte validation)
- `BpvProgressSection.tsx` — shows gerealiseerdeUren vs verwachteUren with progress bar
- `StageSection.tsx` — shows organisatie, periode, startdatum, einddatum, urenGoedgekeurd, urenIngeleverd
- `BpvConfig` type: `{ verwachteUren: number }` (configured in Settings)
- `BpvStudentRecord` type: `{ gerealiseerdeUren: number }` (currently only populated by stub)

The only thing missing is the actual Excel parser in `parseBpvExcel()`.

### Dutch MBO BPV Excel Format — What to Expect

SomToday (the school's student tracking system) can export student data in CSV or Excel via "Vrije Export". There is no fixed national BPV Excel format — schools customize their own export definitions. Based on Dutch MBO BPV practice and the existing data model:

**High-probability columns (MEDIUM confidence — no sample file available):**

| Column Name Candidates | Field | Type | Notes |
|------------------------|-------|------|-------|
| Studentnummer / Leerlingnummer | leerlingId | string | Primary join key |
| Naam / Achternaam | naam | string | Fallback join key |
| Gerealiseerde uren / Uren gerealiseerd | gerealiseerdeUren | number | Core BPV metric |
| Geplande uren / Uren gepland / Verwachte uren | (config-level, not per-student) | number | May or may not appear per-student |
| Organisatie / Leerbedrijf / Stagebedrijf | organisatie | string | Stage company name |
| Startdatum | startdatum | date string | ISO or Dutch format |
| Einddatum | einddatum | date string | ISO or Dutch format |
| Goedgekeurde uren | urenGoedgekeurd | number | Hours formally approved |
| Ingediende uren / Ingediend | urenIngeleverd | number | Hours submitted by student |

**Critical constraint:** No sample BPV Excel file is available. Per BPV-01 in REQUIREMENTS.md: "vereist echt voorbeeldbestand". The parser MUST be designed for real-world discovery:

1. Scan all column headers in row 0 for fuzzy matches (case-insensitive, trimmed)
2. Log all unrecognized column names to console for debugging
3. Fall back gracefully: if no "gerealiseerde uren" column found, `gerealiseerdeUren = 0`
4. Ship with `debugExcelBestand()` (already in `parsers/excel.ts`) wired to a dev console call on import — this is how the real column names will be discovered

### Implementation Pattern

Follow the existing `parseExcelFile()` pattern in `parsers/excel.ts`:

```typescript
// Fuzzy column header matching (same pattern as verzuim parser)
function findCol(headers: string[], candidates: string[]): number {
  const norm = (s: string) => String(s).toLowerCase().trim().replace(/\s+/g, ' ');
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => norm(h).includes(norm(candidate)));
    if (idx >= 0) return idx;
  }
  return -1;
}
```

The verzuim parser already uses `normalizeNaam()` + 4-strategy name matching — the BPV parser should reuse `normalizeNaam()` from `utils/datamodel.ts` for leerling matching.

### Data Model Impact

`BpvStudentRecord` currently only has `gerealiseerdeUren`. The `StageSection` expects `organisatie`, `startdatum`, `einddatum`, `urenGoedgekeurd`, `urenIngeleverd`. These are stored in `klas.stageData[leerlingId]` (separate from `bpv_data`). The v2.2 implementation must decide:

**Option A:** Keep two separate data stores (current architecture): `bpv_data` for gerealiseerdeUren (used by BpvProgressSection), `klas.stageData` for organisatie/periode/uren (used by StageSection). Parser populates both from one Excel file.

**Option B:** Merge into a single `stageData` record per student that contains all BPV fields. Simpler, but requires touching the `BpvStudentRecord` type and any existing code that reads `bpv_data`.

Recommendation: Option A for minimum disruption. The parser writes to both stores in one pass.

### Table Stakes

| Requirement | Complexity | Notes |
|-------------|------------|-------|
| Magic-byte validation already exists | — | Already in stub; keep it |
| Parse gerealiseerdeUren per leerling | MEDIUM | Core field; join on studentnummer or naam |
| Fuzzy column header matching | MEDIUM | Column names will vary across school exports |
| Graceful empty state on import failure | LOW | BPV-04 already handled by `BpvProgressSection` |
| Import via existing ImportPage dropzone | LOW | BPV-03 — wire existing import UI to `parseBpvExcel()` |
| Debug logging of unrecognized columns | LOW | Essential since no sample file exists |

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Hardcoding exact column names | Will break on first school export variation |
| Assuming .xlsx only | School system may export .xls (same as verzuim) |
| Blocking import if column not found | Should parse what it can and log warnings |

### Critical Gap

No sample BPV Excel file exists. This feature CANNOT be validated end-to-end without a real export from the school system. The implementation should be written to be debuggable: wire `debugExcelBestand()` to a dev console call on first import so column names can be discovered and fed back into the parser.

### Complexity Assessment

MEDIUM-HIGH. The parsing logic is mechanical once column names are known, but column names are unknown. The parser must be robust to variation. The data model split (two stores) adds minor complexity.

---

## Feature 4: Rekenen & Nederlands (RNL-01..04)

### Dutch MBO Norm Context

**Confirmed (HIGH confidence — rijksoverheid.nl + examenbladmbo.nl):**

- MBO niveau 1, 2, 3: verplicht Rekenen 2F en Nederlands 2F
- MBO niveau 4: verplicht Rekenen 3F en Nederlands 3F
- CIOS CSD2 is a level 3 program → norm is **2F** for both subjects
- Scores are reported as: a cijfer (whole number for Rekenen, one decimal for Nederlands) derived from a vaardigheidsscore
- Pass/fail thresholds (cesuren): Rekenen 2F = 44 points, Nederlands 2F = 53 points on their respective proficiency scales
- A student either passes ("voldoende") or fails ("onvoldoende") each subject independently

**Score formats in the app context:**
- The current `AanvullendSection` stores manual dropdown values: taalniveau ∈ `{'', '2F', '3F'}` and rekenniveau ∈ `{'', 'MBO 3', 'MBO 4'}` — these represent the required level, not the achieved result
- RNL-01..04 require tracking actual *results* (passed/failed/score) separately from the required level

### What Already Exists vs. What's New

| Existing | New (v2.2) |
|----------|------------|
| Manual taalniveau dropdown (2F/3F) — required level | Actual Rekenen result: cijfer, voldoende/onvoldoende |
| Manual rekenniveau dropdown (MBO 3/MBO 4) — program level | Actual Nederlands result: cijfer, voldoende/onvoldoende |
| Fields stored as `student.taalniveau` and `student.rekenniveau` | New fields: `student.rekenResultaat`, `student.nederlandsResultaat` |
| PDF parser does NOT currently extract these from PDFs | PDF parser may be extended to extract these if present in PDF layout |

### RNL-04: Source from Existing PDFs

Per RNL-04: "Rekenen en Nederlands scores worden ingelezen uit de bestaande voortgang PDFs (geen apart bestand)."

This is the most uncertain requirement. The existing PDF parser (`parsers/pdf.ts`) does not currently extract taalniveau or rekenniveau from the PDF. Whether the "Mijn voortgang" PDF contains Rekenen/Nederlands scores is unknown — it depends on how SomToday formats the report.

**Possible PDF presence patterns (MEDIUM confidence — no sample to verify):**
- The PDF may include a "Generieke vakken" or "Taal en Rekenen" section at the bottom
- It may show "Rekenen 2F: Voldoende" or "Nederlands 2F: Niet beoordeeld"
- If not in the PDF, data must be entered manually (dropdown in AanvullendSection)

**Recommendation:** Design the feature to work in BOTH modes:
1. Parser extends to extract RNL data from PDF if found (try; skip if section absent)
2. Manual override dropdown in AanvullendSection as fallback (existing pattern)

### Data Model Extension

New fields on `StudentRecord`:

```typescript
interface StudentRecord {
  // ... existing fields ...
  
  // RNL-01/02: Actual exam results (separate from required level)
  rekenResultaat?: {
    niveau: '2F' | '3F';          // which exam was taken
    status: 'voldoende' | 'onvoldoende' | 'niet_afgenomen';
    cijfer?: number;               // whole number (Rekenen has no decimals)
  };
  nederlandsResultaat?: {
    niveau: '2F' | '3F';          // which exam was taken
    status: 'voldoende' | 'onvoldoende' | 'niet_afgenomen';
    cijfer?: number;               // one decimal (e.g., 6.5)
  };
}
```

### RNL-03: Own Doorstroomnorm

Rekenen en Nederlands have a separate norm from the deelgebieden prognose:

| Subject | Level | Norm | Consequence |
|---------|-------|------|-------------|
| Rekenen | 2F | Voldoende verplicht voor diploma MBO-3 | Separate indicator in detail view; does NOT affect deelgebieden RAG status |
| Nederlands | 2F | Voldoende verplicht voor diploma MBO-3 | Same |

The RNL norm should appear as a separate section in `DetailWeergave` (a new `RNlSection` component), distinct from `DoortstroomPrognoseSection`. It shows a simple "Voldaan / Niet voldaan" indicator per subject.

### Display in DetailWeergave

New component: `RNlSection.tsx`

```
┌─ Rekenen & Nederlands ──────────────────────┐
│ Rekenen 2F    [Voldoende / Onvoldoende / —] │
│ Nederlands 2F [Voldoende / Onvoldoende / —] │
│                                              │
│ (edit: klik om handmatig in te vullen)      │
└─────────────────────────────────────────────┘
```

The section should be editable inline (like `AanvullendSection`) since automatic PDF extraction may not always work.

### Table Stakes

| Requirement | Complexity | Notes |
|-------------|------------|-------|
| RNL-01: Rekenen weergave in detailview | LOW | New RNlSection component |
| RNL-02: Nederlands weergave in detailview | LOW | Same component |
| RNL-03: Eigen norm (voldoende = diplomaeis) | LOW | Static norm per MBO level; no calculation needed for level 3 |
| RNL-04: Probeer te extraheren uit bestaande PDFs | HIGH | PDF parser extension; uncertain if data is in PDF layout |
| Manual override fallback | LOW | Extend AanvullendSection or add inline editing to RNlSection |
| Opslaan via saveKlassen() | LOW | Same persistence pattern as existing fields |

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Including RNL in the deelgebieden RAG prognose | These are nationally normed exams with separate pass/fail logic; mixing them with deelgebieden scores would produce incorrect doorstroom advice |
| Adding a separate import file for RNL | RNL-04 explicitly says to use existing PDFs; no separate file |
| Showing Rekenen cijfer as a decimal | Rekenen grades have no decimals (confirmed: examenbladmbo.nl); Nederlands has one decimal |

### Complexity Assessment

MEDIUM-HIGH. The data model extension and UI are LOW complexity. The PDF parser extension is HIGH uncertainty because it's unknown whether SomToday's "Mijn voortgang" PDF includes Rekenen/Nederlands. The parser must gracefully handle absence (fall back to manual entry). Real-world testing with an actual PDF is required.

---

## Feature 5: Bug Fix — Drag-and-Drop (BUG-01)

### Known Context

Phase 16 UAT identified that drag-and-drop on the import field does not work. The existing `App.tsx` has document-level `dragover` and `drop` prevention handlers, but the ImportPage's drop zone may not be correctly receiving events.

The v1.0 `KEY DECISIONS` table notes: "Document-level drop prevention — Voorkomt browsernavigatie bij per ongeluk droppen van PDF buiten dropzone." This fix was applied but the per-zone drop handling may have been broken in the Tauri migration.

The fix is expected to involve Tauri's `onDragDropEvent` from `@tauri-apps/api/webview` — the correct approach for Tauri v2 (verified via Context7 in prior research). HTML `ondrop` / `event.dataTransfer.files` is the legacy pattern that may not work correctly in Tauri WebView.

This is a prerequisite for the onboarding wizard's file upload steps working correctly.

---

## Feature Dependency Map

```
BUG-01 (drag-drop fix)
  └─ Required by: ONB-03, ONB-04, ONB-05 (wizard file uploads)

BPV parser (Feature 3) — parseBpvExcel() real implementation
  └─ Required by: ONB-05 (wizard step 4 BPV upload)

RNL data model extension (Feature 4)
  └─ Required by: EXP-02 (print verslag must include RNL section)

Onboarding wizard (Feature 1)
  └─ Requires: BUG-01 + BPV parser working

Print export (Feature 2)
  └─ Requires: RNL section exists (to include in print)
  └─ Soft dependency: BPV data visible (already has empty-state)
```

**Recommended build order:**
1. BUG-01 — unblocks everything involving file drop
2. BPV parser (Feature 3) — enables real data in wizard and detail view
3. RNL section (Feature 4) — UI + data model; PDF extraction can be iterative
4. Print export (Feature 2) — pure CSS + button; quick win; can use existing sections
5. Onboarding wizard (Feature 1) — wraps existing features; best done last when all sub-features work standalone

---

## MVP for v2.2

**Must ship (blocking milestone completion):**
- BUG-01 drag-drop fix
- ONB-01..08 onboarding wizard (full 5-step flow)
- EXP-01..04 print-to-PDF (CSS + button)
- BPV-01..04 real BPV parser (with graceful fallback when column names unknown)
- RNL-01..03 Rekenen & Nederlands section with manual entry

**Can defer within milestone:**
- RNL-04 PDF auto-extraction (depends on PDF layout; deliver as "best effort, manual fallback")
- Onboarding wizard re-trigger from Settings

**Deferred to v2.3+:**
- RNL in klasoverzicht-tegels (noted in REQUIREMENTS.md Future Requirements)
- Silent PDF export without print dialog (Tauri does not support this yet)

---

## Sources

- [rijksoverheid.nl — Referentieniveaus taal en rekenen](https://www.rijksoverheid.nl/onderwerpen/basisvaardigheden/referentieniveaus-taal-en-rekenen) — HIGH confidence
- [examenbladmbo.nl — Nederlands 3F 2025-26](https://www.examenbladmbo.nl/2025-26/mbo-4/vakken/nederlands-3f) — HIGH confidence
- [examenbladmbo.nl — Beoordeling en vaststelling scores 2023-24](https://www.examenbladmbo.nl/2023-24/onderwerpen/beoordeling-vaststelling-scores) — HIGH confidence (cesuren confirmed)
- [PatternFly wizard design guidelines](https://www.patternfly.org/components/wizard/design-guidelines/) — HIGH confidence (skip button pattern, optional step grouping)
- [Eleken — Wizard UI pattern explained](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained) — MEDIUM confidence (general UX patterns)
- [Tauri GitHub #4917 + #5330 — print API feature requests](https://github.com/tauri-apps/tauri/issues/4917) — HIGH confidence (confirms no native print API)
- [SomToday — Informatie exporteren](https://somtoday-servicedesk.zendesk.com/hc/nl/articles/4404430485905-Informatie-exporteren) — MEDIUM confidence (general export, no BPV-specific columns)
- Existing codebase analysis: `utils/bpv.ts`, `StageSection.tsx`, `BpvProgressSection.tsx`, `AanvullendSection.tsx`, `parsers/excel.ts` — HIGH confidence (authoritative for current state)
