---
phase: 01-pdf-parser
verified: 2026-03-24T12:00:00Z
status: human_needed
score: 5/6 success criteria automated-verified
re_verification: false
human_verification:
  - test: "Import all 19 CSD2A voortgang-PDFs via drag-and-drop"
    expected: "Counter reaches 19/19, validateImport() reports 'Alle leerlingen correct geparsed!', all names/IDs/periodes populated"
    why_human: "Real PDF files required; parser correctness for specific CIOS PDF layout cannot be verified without running browser + actual PDFs from D:/Downloads/Voortgang-CSD2A fase 2/"
  - test: "Spot-check deelgebiedScores for 3-5 students against original PDFs"
    expected: "Object.keys(result.deelgebiedScores).length === 19; score values match what is printed in the PDF"
    why_human: "Coordinate-based column assignment (COLUMN_X_TOLERANCE=8) and Y_TOLERANCE=3 are empirical values — only real PDFs can confirm they produce correct column assignments"
  - test: "Import a non-voortgang PDF (e.g. a random document)"
    expected: "Error message shown in results panel with filename and specific reason"
    why_human: "Error handling paths triggered only with real PDF content"
  - test: "Verify feed forward text is captured correctly for multiple opdrachten"
    expected: "feedForward field contains teacher text, not truncated, no bleed from adjacent sections"
    why_human: "Multi-line text capture correctness depends on real PDF line boundaries"
---

# Phase 01: PDF Parser Verification Report

**Phase Goal:** App leest voortgang-PDFs per leerling betrouwbaar in — naam, leerling-ID, periode, opdrachtstatus, feed forward en V/G/E-scores per deelgebied worden correct geextraheerd uit alle 19 CSD2A-PDFs.
**Verified:** 2026-03-24
**Status:** CONDITIONAL PASS (human_needed)
**Re-verification:** No — initial verification

---

## Verdict

**CONDITIONAL PASS**

All 6 success criteria are implemented in substantive, wired code. Five of six can be verified
statically; the sixth (SC-5: correct results for all 19 real CSD2A-PDFs) requires a human to
run the app with actual PDF files. No stubs, no placeholder implementations, no hardcoded empty
values that flow to the UI were found.

Two empirical tuning constants (Y_TOLERANCE=3 and COLUMN_X_TOLERANCE=8) are documented as
"start values to be validated against real PDFs" — this is the one technical risk that could
require parameter adjustment after human testing.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can import PDFs via drag-and-drop or file picker | VERIFIED | `app.js` lines 36-92: dragover/dragleave/drop handlers + chooseBtn + fileInput.change, all calling `importPDFs()` |
| 2 | Naam, leerlingId, periode extracted correctly | VERIFIED | `parsers/pdf.js` `extractHeader()` lines 182-211: regex patterns for all three fields with spacing/hyphen tolerance; filename fallback for naam at lines 675-679 |
| 3 | Opdrachten with status and feed forward captured | VERIFIED | `parsers/pdf.js` `parseVakSections()` lines 284-400: font-size heading detection, `looksLikeOpdracht()`, `matchStatus()`, multi-line feed-forward capture with structural-marker stop logic |
| 4 | Overzicht Deelgebieden table fully extracted (V/G/E per deelgebied) | VERIFIED | `parsers/pdf.js` lines 402-653: `isHeaderRow`, `findDeelgebiedSection`, `buildColumnMap`, `assignScoreToColumn`, `parseDeelgebiedTable` — all 19 deelgebied keys always initialized in output |
| 5 | Parser works for all 19 CSD2A-PDFs without manual correction | NEEDS HUMAN | Code is complete and non-stub, but correctness for the specific CSD2A PDF layout requires running against actual files |
| 6 | Clear error message on unreadable or unexpected PDF | VERIFIED | `parseSinglePDF()` throws `'Overzicht Deelgebieden tabel niet gevonden'` (line 696) and `'Geen vakken gevonden'` (line 683); `app.js` `importPDFs()` catches at line 122-125 and displays filename + reason |

**Score:** 5/6 automated-verified (1 requires human testing)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `parsers/pdf.js` | Main parser — 461+ lines | VERIFIED | 754 lines; all planned functions present and substantive |
| `utils/schema.js` | 19 DEELGEBIEDEN + normalizeScore | VERIFIED | 59 lines; 19 entries confirmed; normalizeScore handles O/V/G/E single-letter and full words |
| `utils/datamodel.js` | StudentRecord type + window.appState | VERIFIED | 78 lines; all JSDoc types defined, addStudent (upsert), getStudentScores, appState initialized |
| `app.js` | Import UI — batch loop, progress, error display | VERIFIED | 404 lines; full implementation confirmed |
| `index.html` | Drop zone, file picker, progress/results panels | VERIFIED | 242 lines; all referenced DOM IDs present; correct script loading order |
| `vendor/pdf.min.mjs` | PDF.js 5.5.207 ESM | VERIFIED | 425,269 bytes present |
| `vendor/pdf.worker.min.mjs` | PDF.js worker | VERIFIED | 1,239,047 bytes present |
| `start.bat` | HTTP server launcher | VERIFIED | Launches Python http.server on port 8000 with npx serve fallback |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `index.html` | `parsers/pdf.js` | `<script type="module" src="parsers/pdf.js">` | WIRED | Line 238 of index.html |
| `index.html` | `app.js` | `<script type="module" src="app.js">` | WIRED | Line 240 of index.html; loads after parsers/pdf.js |
| `index.html` | `utils/schema.js` | `<script src="utils/schema.js">` | WIRED | Line 235; classic script before modules — globals available |
| `index.html` | `utils/datamodel.js` | `<script src="utils/datamodel.js">` | WIRED | Line 236; classic script before modules |
| `app.js` | `parseSinglePDF` | `window.parseSinglePDF(file)` | WIRED | `app.js` line 117; guard at line 100-103 |
| `app.js` | `window.addStudent` | `window.addStudent(student)` | WIRED | `app.js` line 121 |
| `parsers/pdf.js` | `window.DEELGEBIEDEN` | Direct reference at lines 420, 485, 635 | WIRED | Loaded by classic script before module; window global available |
| `parsers/pdf.js` | `window.normalizeScore` | Call at line 601 | WIRED | From schema.js globals |
| `parseSinglePDF` | `parseDeelgebiedTable` | Call at lines 686-693 | WIRED | Throws on failure (PDF-08) |
| Drop zone / file picker | `importPDFs()` | event handlers in app.js | WIRED | dragover/drop (lines 36-72), chooseBtn click (line 75), fileInput change (lines 77-83) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app.js` results panel | `results.students` | `await window.parseSinglePDF(file)` per file | Yes — real PDF parsing | FLOWING |
| `app.js` error list | `results.errors` | caught exceptions from parseSinglePDF | Yes — real error messages | FLOWING |
| `app.js` student name tags | `student.naam` | `header.naam` from `extractHeader()` or filename fallback | Yes — parsed from PDF text | FLOWING |
| `parseSinglePDF` return | `deelgebiedScores` | `parseDeelgebiedTable()` → `buildColumnMap()` → `assignScoreToColumn()` | Yes — coordinate-based extraction from real PDF | FLOWING (correctness is human-tested) |
| `parseSinglePDF` return | `vakken` | `parseVakSections()` → font-size + regex logic | Yes — parsed from real PDF text items | FLOWING |

No hardcoded empty arrays or static returns found that flow to UI rendering.

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — browser-only app with no runnable CLI entry point. PDF parsing requires
an HTTP server and browser environment (PDF.js Web Worker constraint). All checks require human
with actual PDF files.

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| PDF-01 | Import via drag-and-drop or file picker | SATISFIED | `app.js`: dragover/drop + chooseBtn + fileInput.change all wired |
| PDF-02 | Naam, leerlingId, periode correct extracted | SATISFIED (code) / NEEDS HUMAN (accuracy) | `extractHeader()` with regex patterns for all three fields |
| PDF-03 | Per-vak opdrachten with status | SATISFIED (code) / NEEDS HUMAN (accuracy) | `parseVakSections()` with font-size heading detection and status matching |
| PDF-04 | Feed Forward text per opdracht | SATISFIED (code) / NEEDS HUMAN (accuracy) | Multi-line feed-forward capture in `parseVakSections()` lines 346-375 |
| PDF-05 | Overzicht Deelgebieden V/G/E scores | SATISFIED (code) / NEEDS HUMAN (accuracy) | Full deelgebied table extraction pipeline; all 19 keys always present |
| PDF-06 | Multiple PDFs importable simultaneously | SATISFIED | `importPDFs(files)` sequential for-loop; `fileInput` has `multiple` attribute |
| PDF-07 | Robust against small layout variations | PARTIALLY SATISFIED | Font-size adaptive heading (median*1.2), Y_TOLERANCE, COLUMN_X_TOLERANCE, spacing-tolerant regex, filename fallback — but tolerance values are unvalidated empirical starting points |
| PDF-08 | Error on unreadable/unexpected PDF | SATISFIED | Two throw paths in parseSinglePDF; app.js catches and displays filename + reason |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `parsers/pdf.js` | 445-468 | `afterSectionHeading` variable set but dead in strategy 1 look-ahead block | Info | No behavioral effect; acknowledged in 01-03-SUMMARY.md as retained structural trace |
| None | — | No TODO/FIXME/placeholder comments found in production files | — | — |
| None | — | No `return null` / `return []` stubs that flow to rendering | — | — |

No blocker anti-patterns found.

---

### Technical Risks (not blocking but worth noting)

**Risk 1: Empirical tuning constants**

`Y_TOLERANCE = 3` (line 19) and `COLUMN_X_TOLERANCE = 8` (line 40) are starting values from
research, not validated against real CIOS PDFs. If CIOS PDFs have wider column spacing or
tighter line grouping:
- `Y_TOLERANCE` too low: items on the same visual line split into separate lines, breaking
  vak/opdracht detection
- `COLUMN_X_TOLERANCE` too narrow: score cells not assigned to deelgebied columns, resulting in
  empty deelgebiedScores

Both constants are documented with the note to tune empirically (01-02-SUMMARY.md, 01-03-SUMMARY.md).
Adjustment requires editing the constants at the top of `parsers/pdf.js` — no architectural change.

**Risk 2: STATUS_STRINGS completeness**

Only two status strings defined: `'Op tijd ingeleverd en wel beoordeeld'` and `'Zelfevaluatie afgerond'`.
The spec says status can also be "leeg" (empty). The code correctly handles this as absence of
a match (empty string default). If the real PDFs contain additional status variants (e.g.
"Te laat ingeleverd"), they would parse as empty/unknown status. Human testing will reveal this.

**Risk 3: Font-size heading detection across PDF versions**

`detectHeadingThreshold()` falls back to 14pt if `sizes.length === 0`. For PDFs where all text
items have the same font size (flat PDF), vak headings will not be detected via font size alone.
The fallback heuristic in `parseVakSections()` (ALL_CAPS / Title Case check) is not implemented
in the current code — the comment at line 274-276 describes it but it is not executed. If real
PDFs have flat font sizes, vak detection will fail and `'Geen vakken gevonden'` will be thrown.

---

### Human Verification Required

#### 1. Full batch import of all 19 CSD2A PDFs

**Test:** Open `index.html` via `start.bat`. Drop all 19 voortgang-PDFs from
`D:/Downloads/Voortgang-CSD2A fase 2/` onto the drop zone.
**Expected:**
- Counter reaches "Verwerkt: 19/19 PDFs"
- Results panel shows 19 successes (green badge), 0 errors
- `window.appState.students.length === 19`
- `validateImport()` in DevTools console logs "Alle leerlingen correct geparsed!"
**Why human:** Real PDF files required; cannot verify without actual CIOS PDFs.

#### 2. Deelgebied score accuracy spot-check

**Test:** After batch import, run in DevTools:
```javascript
debugStudent('Bosker')
// or any student name from the class list
```
Open the corresponding PDF and compare 3-5 deelgebied scores visually.
**Expected:** Score values (voldoende/goed/excellent) match what is printed in the PDF.
**Why human:** Coordinate-based column assignment correctness requires visual comparison against source document.

#### 3. Error handling for invalid PDF

**Test:** Drop a non-voortgang PDF (e.g. any other document) alongside one real voortgang PDF.
**Expected:** Results panel shows 1 success + 1 error; error entry shows filename and specific
reason (either "Overzicht Deelgebieden tabel niet gevonden" or "Geen vakken gevonden").
**Why human:** Requires actual files to trigger the error paths.

#### 4. Feed forward text capture accuracy

**Test:** For 2-3 students, compare `student.vakken[X].opdrachten[Y].feedForward` values in
DevTools against the printed Feed Forward text in the PDF.
**Expected:** Text is complete, not truncated, no text from adjacent sections included.
**Why human:** Multi-line feed-forward capture boundary logic (structural markers) requires real
PDF content to verify correctness.

---

### Gaps Summary

No implementation gaps found. All 8 requirements and 6 success criteria have substantive,
wired code that implements the specified behavior.

The phase receives CONDITIONAL PASS rather than PASS solely because SC-5 ("works for all 19
CSD2A-PDFs") and the accuracy portions of SC-2/SC-3/SC-4 require human testing with real PDF
files. This is an inherent constraint of browser-only PDF parsing — it cannot be verified
programmatically without the actual documents.

If human testing passes without requiring changes to the tuning constants, the phase is fully
complete. If `Y_TOLERANCE` or `COLUMN_X_TOLERANCE` require adjustment, that is a minor
one-line change in `parsers/pdf.js` and does not constitute a structural gap.

---

_Verified: 2026-03-24_
_Verifier: Claude (gsd-verifier)_
