---
phase: 02-excel-import
verified: 2026-03-25T00:00:00Z
status: gaps_found
score: 8/9 must-haves verified
gaps:
  - truth: "If SheetJS CDN failed to load, the Excel button shows a Dutch error instead of crashing"
    status: failed
    reason: "app.js has NO typeof window.XLSX guard before wiring the excelChooseBtn click handler. The button is unconditionally wired to trigger the file picker. When XLSX is undefined, calling window.parseExcelFile() throws a Dutch error ('SheetJS (XLSX) is niet geladen.') inside the change handler — so import does not silently corrupt data — but the button is NOT disabled and the button text is NOT changed to 'SheetJS niet geladen. Ververs de pagina.' as the plan required. The guard exists inside parseExcelFile (excel.js line 60), but the UI-level button guard described in plan 02-02 must_have truth 5 is absent from app.js."
    artifacts:
      - path: "app.js"
        issue: "Missing: if (typeof window.XLSX === 'undefined') { excelChooseBtn.disabled = true; excelChooseBtn.textContent = 'SheetJS niet geladen. Ververs de pagina.'; } block before the excelChooseBtn click handler (lines 408-489 of app.js)"
    missing:
      - "Add XLSX guard in app.js Excel section: check typeof window.XLSX === 'undefined', disable button, and set error text before attaching the click handler"
human_verification:
  - test: "Open index.html in browser with network blocked (or CDN blocked). Check that the 'Kies Excel-bestand' button is disabled and shows error text."
    expected: "Button reads 'SheetJS niet geladen. Ververs de pagina.' and is non-interactive"
    why_human: "Cannot simulate CDN failure programmatically without running a browser"
---

# Phase 2: Excel Import Verification Report

**Phase Goal:** Mentor kan de verzuim-Excel (.xls) importeren en alle verzuimdata wordt correct gekoppeld aan de leerlingen uit de PDF-import
**Verified:** 2026-03-25
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from Plan 02-01 must_haves)

| #  | Truth                                                                                                          | Status     | Evidence                                                                                  |
|----|----------------------------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------|
| 1  | parseVerzuimTime('107u24m') returns 6444                                                                       | VERIFIED   | Tested: regex `/^(\d+)u(\d+)m$/i` matches, returns 107*60+24 = 6444                     |
| 2  | parseVerzuimTime('0u45m') returns 45                                                                           | VERIFIED   | Tested: regex matches, returns 0*60+45 = 45                                               |
| 3  | parseVerzuimTime('12m') returns 12                                                                             | VERIFIED   | Regex does NOT match '12m' (requires both u and m), falls through to parseInt('12m')=12   |
| 4  | parseVerzuimTime('2u05m') returns 125                                                                          | VERIFIED   | Tested: regex matches, returns 2*60+5 = 125                                               |
| 5  | parseVerzuimTime(null) returns 0                                                                               | VERIFIED   | Line 11: null/undefined/'' guard returns 0                                                |
| 6  | parseVerzuimTime('') returns 0                                                                                 | VERIFIED   | Line 11: empty string guard returns 0                                                     |
| 7  | parseExcelFile scans ALL worksheets and picks the one whose name contains 'verzuim' or 'overzicht'            | VERIFIED   | Lines 88-99: forEach over SheetNames, score += 3 for 'verzuim', += 2 for 'overzicht'     |
| 8  | parseExcelFile uses header:1 raw array mode to detect header row dynamically                                   | VERIFIED   | Line 107: `XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })`                   |
| 9  | parseExcelFile detects header row by scanning first 20 rows for keywords                                       | VERIFIED   | Lines 128-136: loop ri < Math.min(rawRows.length, 20), scores rows on keyword matches     |
| 10 | parseExcelFile reconstructs naam from separate Roepnaam/Voorvoegsels/Achternaam columns                       | VERIFIED   | Lines 176-185: achternaam + voorvoegsels + roepnaam reconstructed as 'Achternaam, Roepnaam' |
| 11 | parseExcelFile strips .0 from float-stored studentnummers: '248109.0' becomes '248109'                        | VERIFIED   | Line 198: regex `/^(\d+)(?:[.,]0+)?$/`, tested: '248109.0' -> '248109'                  |
| 12 | parseExcelFile maps SomToday columns: Studentnummer, Geoorloofde afwezigheid, etc.                            | VERIFIED   | Lines 194-217: all SomToday column names present as candidates                            |
| 13 | mergeVerzuim uses 4 matching strategies (leerlingnummer, normalizeNaam, achternaam, substring)                 | VERIFIED   | Lines 125-164 of datamodel.js: all 4 strategies implemented with correct thresholds       |
| 14 | normalizeNaam('van den Dool, A.B.C. (Abigail)') matches 'van den dool, a.b.c. (abigail)'                     | VERIFIED   | Tested: toLowerCase + whitespace collapse produces exact match                             |

**Plan 02-01 truths: 14/14 VERIFIED**

### Observable Truths (from Plan 02-02 must_haves)

| #  | Truth                                                                                                          | Status     | Evidence                                                                                  |
|----|----------------------------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------|
| 1  | Mentor sees an Excel import section with a file picker button after PDF import                                 | VERIFIED   | index.html lines 672-683: #excel-import-section with h2 and button present in #import-view |
| 2  | Mentor can select a .xls or .xlsx file and it gets parsed and merged                                           | VERIFIED   | app.js lines 420-488: change handler calls parseExcelFile then mergeVerzuim               |
| 3  | After Excel import, matched student count and unmatched names are displayed                                    | VERIFIED   | app.js lines 444-455: excelResultTxt.textContent + excelUnmatched list populated         |
| 4  | Student records in appState have .verzuim property with correct fields after merge                             | VERIFIED   | datamodel.js lines 167-174: student.verzuim = { aanwezigheid, geoorloofd, ongeoorloofd, totaal, laatsteMelding } |
| 5  | If SheetJS CDN failed to load, the Excel button shows a Dutch error instead of crashing                        | FAILED     | app.js has NO typeof window.XLSX guard on excelChooseBtn. Button is unconditionally wired. parseExcelFile throws inside the change handler but button is not pre-disabled. |

**Plan 02-02 truths: 4/5 VERIFIED**

**Overall Score:** 8/9 composite must-haves verified (treating the XLSX guard truth as a single composite gap)

---

## Required Artifacts

| Artifact              | Expected                                                                    | Status     | Details                                                                   |
|-----------------------|-----------------------------------------------------------------------------|------------|---------------------------------------------------------------------------|
| `parsers/excel.js`    | Excel parser with SheetJS — multi-sheet scanning, header detection, SomToday column mapping | VERIFIED   | 229 lines, substantive implementation. Contains `window.parseExcelFile` and `window.parseVerzuimTime`. Not an ES module. |
| `utils/datamodel.js`  | Verzuim merge with 4-strategy matching and name normalization               | VERIFIED   | Lines 79-216: Phase 02 extension appended after existing code. Contains `window.normalizeNaam`, `window.mergeVerzuim` (4 strategies), `window.getVerzuim`. |
| `index.html`          | Excel import UI section with file picker and SheetJS CDN                   | VERIFIED   | Line 725: SheetJS CDN; line 730: parsers/excel.js; lines 672-683: #excel-import-section with all required elements |
| `app.js`              | Excel import handler with XLSX guard, wired to parseExcelFile and mergeVerzuim | PARTIAL    | Handler wired and fully functional; XLSX CDN load guard MISSING. |

---

## Key Link Verification

| From          | To                   | Via                                        | Status       | Details                                                              |
|---------------|----------------------|--------------------------------------------|--------------|----------------------------------------------------------------------|
| `index.html`  | `app.js`             | excel-file-input change event handler       | VERIFIED     | app.js line 420: `excelFileInput.addEventListener('change', async () => {` |
| `app.js`      | `parsers/excel.js`   | window.parseExcelFile call                  | VERIFIED     | app.js line 440: `window.parseExcelFile(file)`                       |
| `app.js`      | `utils/datamodel.js` | window.mergeVerzuim call after parsing      | VERIFIED     | app.js line 441: `window.mergeVerzuim(verzuimRecords)`               |
| `index.html`  | `parsers/excel.js`   | script tag loading parsers/excel.js         | VERIFIED     | index.html line 730: `<script src="parsers/excel.js"></script>` (no type="module") |
| `index.html`  | `SheetJS CDN`        | script tag loading xlsx.full.min.js from CDN | VERIFIED    | index.html line 725: `cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js` |
| `app.js`      | `excelChooseBtn`     | XLSX guard disabling button if CDN fails    | NOT_WIRED    | app.js lines 408-489: no `typeof window.XLSX` check before click handler |

---

## Data-Flow Trace (Level 4)

| Artifact     | Data Variable       | Source                          | Produces Real Data | Status     |
|--------------|---------------------|---------------------------------|--------------------|------------|
| `app.js`     | `verzuimRecords`    | `window.parseExcelFile(file)`   | Yes — reads File object via FileReader, parses with XLSX | FLOWING |
| `app.js`     | `result` (matched/unmatched) | `window.mergeVerzuim(verzuimRecords)` | Yes — iterates verzuimRecords, writes to student.verzuim | FLOWING |
| `app.js`     | `excelResultTxt`    | `result.matched` count          | Yes — derived from real merge result | FLOWING |
| `datamodel.js` | `student.verzuim` | mergeVerzuim writes to appState.students[*].verzuim | Yes — aanwezigheid, geoorloofd, ongeoorloofd, totaal, laatsteMelding | FLOWING |

---

## Behavioral Spot-Checks

| Behavior                              | Command                                                           | Result         | Status  |
|---------------------------------------|-------------------------------------------------------------------|----------------|---------|
| parseVerzuimTime all edge cases       | node -e (inline simulation)                                       | All 6 pass     | PASS    |
| normalizeNaam Dutch name variation    | node -e (inline simulation)                                       | Exact match    | PASS    |
| float stripping '248109.0' -> '248109' | node -e (inline simulation)                                      | Correct        | PASS    |
| XLSX guard in app.js                  | grep window.XLSX app.js                                           | No match found | FAIL    |
| No ES module syntax in classic scripts | grep ^import/^export both files                                   | None found     | PASS    |

Step 7b: Behavioral spot-checks on runnable logic executed inline (no server required). Browser-dependent behaviors (CDN load, file picker) flagged for human verification.

---

## Requirements Coverage

| Requirement | Source Plan | Description                                                                    | Status          | Evidence                                                            |
|-------------|-------------|--------------------------------------------------------------------------------|-----------------|---------------------------------------------------------------------|
| XLS-01      | 02-02       | App leest .xls verzuimexport in via bestandskiezer                             | SATISFIED       | index.html: `<input type="file" id="excel-file-input" accept=".xls,.xlsx">` wired via app.js |
| XLS-02      | 02-01       | Per leerling: aanwezigheid, geoorloofd, ongeoorloofd, totaal en laatste verzuimmelding uitgelezen | SATISFIED | excel.js returns all 5 fields; datamodel.js stores all 5 on student.verzuim |
| XLS-03      | 02-01       | Tijdformaat "107u24m" wordt correct geparsed naar minuten                      | SATISFIED       | parseVerzuimTime: "107u24m"=6444, "0u45m"=45, "12m"=12, "2u05m"=125 all verified |
| XLS-04      | 02-01, 02-02 | Koppeling tussen leerling in verzuim-Excel en voortgang-PDF via naam of studentnummer | PARTIALLY SATISFIED | 4-strategy matching implemented. XLS guard gap means if SheetJS CDN fails, user can click button and get uncaught error; this is a UX gap not a data-integrity gap. Core matching logic (XLS-04 proper) is fully implemented. |

**Coverage note:** All 4 XLS requirements are mapped and claimed by these plans. XLS-04 partially fails only due to the XLSX guard UX issue; the matching logic itself is correct.

---

## Anti-Patterns Found

| File          | Line | Pattern                                         | Severity  | Impact                                                              |
|---------------|------|-------------------------------------------------|-----------|---------------------------------------------------------------------|
| `parsers/excel.js` | 15 | Regex `/^(\d+)u(\d+)m$/i` (missing optional hours group) | Warning | Plan specified `/^(?:(\d+)u)?(\d+)m$/i`. Edge case "12m" still returns 12 via parseInt fallback; "3u" (hours-only) returns 3 instead of 180. Not in must-have list but diverges from spec and plan acceptance criteria. |
| `app.js`      | 408-489 | No `typeof window.XLSX === 'undefined'` guard on excelChooseBtn | Blocker | Must-have truth 5 of Plan 02-02 fails. If CDN fails, button stays enabled; error is surfaced only after user clicks button and file picker fires, not proactively. |

**02-01 SUMMARY deviation:** The 02-01-SUMMARY.md describes mergeVerzuim as having only 2 strategies (leerlingnummer + normalized name). This is inaccurate — the actual implementation has all 4 strategies. The SUMMARY was incomplete; the code is correct.

---

## Human Verification Required

### 1. SheetJS CDN Load Guard

**Test:** Open index.html in browser with CDN blocked (network tab, block cdn.sheetjs.com). Observe the "Kies Excel-bestand" button.
**Expected per plan:** Button is disabled and shows "SheetJS niet geladen. Ververs de pagina."
**Actual (verified by code):** Button stays enabled. User can click it, select a file, and sees "Excel-import mislukt: SheetJS (XLSX) is niet geladen." in the error banner.
**Why human:** CDN failure state requires a real browser environment to simulate.

### 2. Full end-to-end import flow

**Test:** Load index.html in browser. Import PDF(s) to populate students. Click "Kies Excel-bestand" and select a SomToday .xls export.
**Expected:** Result shows "N van M leerlingen gekoppeld aan voortgangdata." Matched count is correct. Console shows strategy used per student.
**Why human:** Requires a real browser with actual student data files.

### 3. Name normalization edge cases (live data)

**Test:** After Excel import, check console for students matched via "achternaam" or "achternaam-substring" strategies. Verify the correct student was matched.
**Expected:** Names with Dutch tussenvoegsels ("van den Dool") match correctly across PDF and Excel.
**Why human:** Requires actual SomToday export and CSD2A PDF files with known name variations.

---

## Gaps Summary

One gap blocks full goal achievement:

**XLSX CDN load guard missing (app.js):** Plan 02-02 required that if SheetJS CDN fails to load, `excelChooseBtn` is disabled and shows the Dutch error text "SheetJS niet geladen. Ververs de pagina." before the click handler is attached. The actual app.js wires the click handler unconditionally. The defensive error IS thrown inside `parseExcelFile` if XLSX is undefined, so data corruption is not a risk — but the UX truth fails: the button does not proactively warn the mentor.

This is a contained UI gap. All core parsing logic (XLS-02, XLS-03), data merging (XLS-04), and file picker wiring (XLS-01) are correctly implemented. The gap only affects the CDN-failure user experience path.

**Regex deviation (non-blocking):** `parseVerzuimTime` uses `/^(\d+)u(\d+)m$/i` instead of the plan-specified optional-hours variant. All 6 must-have test cases pass due to the parseInt fallback for minute-only strings. The "3u" hours-only edge case returns 3 minutes instead of 180 minutes — not a must-have truth but a spec deviation worth noting.

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
