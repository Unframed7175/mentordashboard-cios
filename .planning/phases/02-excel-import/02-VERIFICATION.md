---
phase: 02-excel-import
verified: 2026-03-25T00:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 8/9
  gaps_closed:
    - "If SheetJS CDN failed to load, the Excel button shows a Dutch error instead of crashing"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Open index.html in browser with CDN blocked (network tab, block cdn.sheetjs.com). Observe the 'Kies Excel-bestand' button."
    expected: "Button is disabled and shows 'SheetJS niet geladen. Ververs de pagina.' — non-interactive"
    why_human: "CDN failure state requires a real browser environment to simulate"
  - test: "Load index.html in browser. Import PDF(s) to populate students. Click 'Kies Excel-bestand' and select a SomToday .xls export."
    expected: "Result shows 'N van M leerlingen gekoppeld aan voortgangdata.' Matched count is correct. Console shows strategy used per student."
    why_human: "Requires a real browser with actual student data files"
  - test: "After Excel import, check console for students matched via 'achternaam' or 'achternaam-substring' strategies. Verify the correct student was matched."
    expected: "Names with Dutch tussenvoegsels ('van den Dool') match correctly across PDF and Excel."
    why_human: "Requires actual SomToday export and CSD2A PDF files with known name variations"
---

# Phase 2: Excel Import Verification Report

**Phase Goal:** Mentor kan de verzuim-Excel (.xls) importeren en alle verzuimdata wordt correct gekoppeld aan de leerlingen uit de PDF-import
**Verified:** 2026-03-25
**Status:** passed
**Re-verification:** Yes — after gap closure (plan 02-03)

---

## Re-Verification Summary

Previous verification (initial): **8/9** — one gap: XLSX CDN load guard missing from app.js.

Gap plan 02-03 added the guard block at app.js lines 418-424:

```javascript
// Guard: if SheetJS CDN failed to load, disable button with Dutch error
if (typeof window.XLSX === 'undefined') {
  excelChooseBtn.disabled = true;
  excelChooseBtn.textContent = 'SheetJS niet geladen. Ververs de pagina.';
} else {
  excelChooseBtn.addEventListener('click', () => excelFileInput.click());
}
```

All three required elements present:
- `typeof window.XLSX === 'undefined'` check at line 419
- `excelChooseBtn.disabled = true` at line 420
- Dutch error text `'SheetJS niet geladen. Ververs de pagina.'` at line 421
- Click handler inside `else` block at line 423 (only wired when XLSX is loaded)
- `excelFileInput.addEventListener('change', ...)` at line 426 remains unconditional (per plan: it has its own internal guard)

No regressions detected. No other lines were modified.

---

## Goal Achievement

### Observable Truths (from Plan 02-01 must_haves)

| #  | Truth                                                                                                          | Status     | Evidence                                                                                  |
|----|----------------------------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------|
| 1  | parseVerzuimTime('107u24m') returns 6444                                                                       | VERIFIED   | Regex `/^(\d+)u(\d+)m$/i` matches, returns 107*60+24 = 6444                              |
| 2  | parseVerzuimTime('0u45m') returns 45                                                                           | VERIFIED   | Regex matches, returns 0*60+45 = 45                                                       |
| 3  | parseVerzuimTime('12m') returns 12                                                                             | VERIFIED   | Regex does not match '12m'; falls through to parseInt('12m')=12                           |
| 4  | parseVerzuimTime('2u05m') returns 125                                                                          | VERIFIED   | Regex matches, returns 2*60+5 = 125                                                       |
| 5  | parseVerzuimTime(null) returns 0                                                                               | VERIFIED   | excel.js line 11: null/undefined/'' guard returns 0                                       |
| 6  | parseVerzuimTime('') returns 0                                                                                 | VERIFIED   | excel.js line 11: empty string guard returns 0                                            |
| 7  | parseExcelFile scans ALL worksheets and picks the one whose name contains 'verzuim' or 'overzicht'            | VERIFIED   | excel.js lines 88-99: forEach over SheetNames, score += 3 for 'verzuim', += 2 for 'overzicht' |
| 8  | parseExcelFile uses header:1 raw array mode to detect header row dynamically                                   | VERIFIED   | excel.js line 107: `XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })`          |
| 9  | parseExcelFile detects header row by scanning first 20 rows for keywords                                       | VERIFIED   | excel.js lines 128-136: loop ri < Math.min(rawRows.length, 20), scores rows on keyword matches |
| 10 | parseExcelFile reconstructs naam from separate Roepnaam/Voorvoegsels/Achternaam columns                       | VERIFIED   | excel.js lines 176-185: achternaam + voorvoegsels + roepnaam as 'Achternaam, Roepnaam'   |
| 11 | parseExcelFile strips .0 from float-stored studentnummers: '248109.0' becomes '248109'                        | VERIFIED   | excel.js line 198: regex `/^(\d+)(?:[.,]0+)?$/`                                          |
| 12 | parseExcelFile maps SomToday columns: Studentnummer, Geoorloofde afwezigheid, etc.                            | VERIFIED   | excel.js lines 194-217: all SomToday column names present as candidates                  |
| 13 | mergeVerzuim uses 4 matching strategies (leerlingnummer, normalizeNaam, achternaam, substring)                 | VERIFIED   | datamodel.js lines 125-164: all 4 strategies implemented with correct thresholds         |
| 14 | normalizeNaam('van den Dool, A.B.C. (Abigail)') matches 'van den dool, a.b.c. (abigail)'                     | VERIFIED   | datamodel.js line 101: toLowerCase + whitespace collapse                                  |

**Plan 02-01 truths: 14/14 VERIFIED**

### Observable Truths (from Plan 02-02 must_haves)

| #  | Truth                                                                                                          | Status     | Evidence                                                                                  |
|----|----------------------------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------|
| 1  | Mentor sees an Excel import section with a file picker button after PDF import                                 | VERIFIED   | index.html lines 672-683: #excel-import-section with h2 and button present in #import-view |
| 2  | Mentor can select a .xls or .xlsx file and it gets parsed and merged                                           | VERIFIED   | app.js lines 426-495: change handler calls parseExcelFile then mergeVerzuim               |
| 3  | After Excel import, matched student count and unmatched names are displayed                                    | VERIFIED   | app.js lines 444-455: excelResultTxt.textContent + excelUnmatched list populated         |
| 4  | Student records in appState have .verzuim property with correct fields after merge                             | VERIFIED   | datamodel.js lines 167-174: student.verzuim = { aanwezigheid, geoorloofd, ongeoorloofd, totaal, laatsteMelding } |
| 5  | If SheetJS CDN failed to load, the Excel button shows a Dutch error instead of crashing                        | VERIFIED   | app.js lines 418-424: `if (typeof window.XLSX === 'undefined')` — button disabled, textContent set to Dutch error. Click handler only wired in `else` branch. |

**Plan 02-02 truths: 5/5 VERIFIED**

### Observable Truths (from Plan 02-03 must_haves — gap closure)

| #  | Truth                                                                                                          | Status     | Evidence                                                                                  |
|----|----------------------------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------|
| 1  | If SheetJS CDN failed to load, the Excel button is disabled and shows Dutch error text instead of being clickable | VERIFIED | app.js lines 419-424: guard present, `disabled = true`, `textContent = 'SheetJS niet geladen. Ververs de pagina.'`, addEventListener inside `else` only |

**Plan 02-03 truths: 1/1 VERIFIED**

**Overall Score: 9/9 composite must-haves verified**

---

## Required Artifacts

| Artifact              | Expected                                                                    | Status     | Details                                                                   |
|-----------------------|-----------------------------------------------------------------------------|------------|---------------------------------------------------------------------------|
| `parsers/excel.js`    | Excel parser with SheetJS — multi-sheet scanning, header detection, SomToday column mapping | VERIFIED   | 229 lines, substantive implementation. Contains `window.parseExcelFile` and `window.parseVerzuimTime`. Not an ES module. |
| `utils/datamodel.js`  | Verzuim merge with 4-strategy matching and name normalization               | VERIFIED   | Lines 79-216: Phase 02 extension appended after existing code. Contains `window.normalizeNaam`, `window.mergeVerzuim` (4 strategies), `window.getVerzuim`. |
| `index.html`          | Excel import UI section with file picker and SheetJS CDN                   | VERIFIED   | Line 725: SheetJS CDN; line 730: parsers/excel.js; lines 672-683: #excel-import-section with all required elements |
| `app.js`              | Excel import handler with XLSX guard, wired to parseExcelFile and mergeVerzuim | VERIFIED   | Lines 418-424: XLSX CDN guard present. Handler wired and fully functional. Gap closed by plan 02-03. |

---

## Key Link Verification

| From          | To                   | Via                                        | Status       | Details                                                              |
|---------------|----------------------|--------------------------------------------|--------------|----------------------------------------------------------------------|
| `index.html`  | `app.js`             | excel-file-input change event handler       | VERIFIED     | app.js line 426: `excelFileInput.addEventListener('change', async () => {` |
| `app.js`      | `parsers/excel.js`   | window.parseExcelFile call                  | VERIFIED     | app.js (change handler): `window.parseExcelFile(file)`               |
| `app.js`      | `utils/datamodel.js` | window.mergeVerzuim call after parsing      | VERIFIED     | app.js (change handler): `window.mergeVerzuim(verzuimRecords)`       |
| `index.html`  | `parsers/excel.js`   | script tag loading parsers/excel.js         | VERIFIED     | index.html line 730: `<script src="parsers/excel.js"></script>` (no type="module") |
| `index.html`  | `SheetJS CDN`        | script tag loading xlsx.full.min.js from CDN | VERIFIED    | index.html line 725: `cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js` |
| `app.js`      | `excelChooseBtn`     | XLSX guard disabling button if CDN fails    | VERIFIED     | app.js lines 419-424: `typeof window.XLSX === 'undefined'` guard present; button disabled + error text set; click handler inside `else` only |

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

| Behavior                              | Command                                     | Result         | Status  |
|---------------------------------------|---------------------------------------------|----------------|---------|
| parseVerzuimTime all edge cases       | inline simulation                           | All 6 pass     | PASS    |
| normalizeNaam Dutch name variation    | inline simulation                           | Exact match    | PASS    |
| float stripping '248109.0' -> '248109' | inline simulation                          | Correct        | PASS    |
| XLSX guard in app.js (was FAIL)       | grep `typeof window.XLSX` app.js           | Line 419 match | PASS    |
| guard text in app.js                  | grep `SheetJS niet geladen` app.js         | Line 421 match | PASS    |
| button disabled in guard block        | grep `excelChooseBtn.disabled = true` app.js | Line 420 match | PASS    |
| click handler inside else             | read app.js lines 418-424                  | `else {` confirmed at line 422 | PASS |
| change handler unconditional          | read app.js line 426                       | Outside if/else block | PASS |
| No ES module syntax in classic scripts | grep ^import/^export both files            | None found     | PASS    |

Step 7b: All automated spot-checks pass. Browser-dependent behaviors (CDN load, file picker) remain flagged for human verification.

---

## Requirements Coverage

| Requirement | Source Plan | Description                                                                    | Status    | Evidence                                                            |
|-------------|-------------|--------------------------------------------------------------------------------|-----------|---------------------------------------------------------------------|
| XLS-01      | 02-02, 02-03 | App leest .xls verzuimexport in via bestandskiezer                            | SATISFIED | index.html: `<input type="file" id="excel-file-input" accept=".xls,.xlsx">` wired via app.js; XLSX guard prevents click when CDN absent |
| XLS-02      | 02-01       | Per leerling: aanwezigheid, geoorloofd, ongeoorloofd, totaal en laatste verzuimmelding uitgelezen | SATISFIED | excel.js returns all 5 fields; datamodel.js stores all 5 on student.verzuim |
| XLS-03      | 02-01       | Tijdformaat "107u24m" wordt correct geparsed naar minuten                      | SATISFIED | parseVerzuimTime: "107u24m"=6444, "0u45m"=45, "12m"=12, "2u05m"=125 all verified |
| XLS-04      | 02-01, 02-02 | Koppeling tussen leerling in verzuim-Excel en voortgang-PDF via naam of studentnummer | SATISFIED | 4-strategy matching implemented (leerlingnummer, normalizeNaam, achternaam, achternaam-substring). XLSX guard gap is now closed, so no UX path is unguarded. |

**All 4 XLS requirements: SATISFIED**

---

## Anti-Patterns Found

| File          | Line | Pattern                                         | Severity  | Impact                                                              |
|---------------|------|-------------------------------------------------|-----------|---------------------------------------------------------------------|
| `parsers/excel.js` | 15 | Regex `/^(\d+)u(\d+)m$/i` (missing optional hours group) | Warning (non-blocking) | Plan specified `/^(?:(\d+)u)?(\d+)m$/i`. Edge case "3u" (hours-only, no minutes) returns 3 instead of 180 via parseInt fallback. All 6 must-have test cases pass. Not in XLS requirements. |

No blockers remain.

---

## Human Verification Required

### 1. SheetJS CDN Load Guard (visual confirmation)

**Test:** Open index.html in browser with CDN blocked (network tab, block cdn.sheetjs.com). Observe the "Kies Excel-bestand" button.
**Expected:** Button is disabled and shows "SheetJS niet geladen. Ververs de pagina." — non-interactive.
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

No gaps remain. The single blocking gap from initial verification has been closed.

**Closed gap — XLSX CDN load guard (app.js):** Plan 02-03 added the guard block at app.js lines 418-424. When `window.XLSX` is undefined, `excelChooseBtn` is disabled and its text is set to "SheetJS niet geladen. Ververs de pagina." before the click handler is attached. The click handler is now inside the `else` branch and only fires when SheetJS is available. The `excelFileInput` change handler remains unconditional as required (it has its own internal guard via `parseExcelFile`).

**Non-blocking note:** `parseVerzuimTime` regex `/^(\d+)u(\d+)m$/i` deviates from the plan's optional-hours spec for the "3u" edge case. All required must-have truths pass. This is not tracked as a requirement gap.

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
