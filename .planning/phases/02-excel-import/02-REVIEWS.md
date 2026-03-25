---
phase: 02
reviewers: [gemini]
reviewed_at: 2026-03-25T00:00:00Z
plans_reviewed: [02-01-PLAN.md, 02-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 02: Excel Import

## Gemini Review

This review evaluates **Plan 02-01 (Excel Parser & Data Model)** and **Plan 02-02 (UI Wiring)** for Phase 2 of the Mentordashboard CIOS project.

### 1. Summary
The implementation plans provide a solid functional foundation for importing Excel data into a browser-only environment using SheetJS. The separation of concerns between parsing (`excel.js`), data management (`datamodel.js`), and UI orchestration (`app.js`) is appropriate for the project's scale. However, the plans are overly optimistic regarding the consistency of the SomToday `.xls` export format. Without incorporating the "known implementation complexities" (such as multi-sheet scanning, float-to-string conversion for IDs, and multi-part name reconstruction), the plans are highly likely to fail during the first real-world test.

---

### 2. Strengths

- **Zero-Dependency Logic:** Sticking to `window.*` globals and classic scripts avoids the complexity of build tools, perfectly aligning with the "no install" constraint.
- **Normalized Matching:** Including `normalizeNaam` (lowercase/trim) is essential for handling manual data entry inconsistencies.
- **Matching Priority:** The strategy of "ID first, then Name fallback" is the industry standard for merging datasets from different systems (PDF vs. Excel).
- **User Feedback:** Plan 02-02 explicitly includes an "unmatched names" list, which is critical for transparency when the automated matching fails.

---

### 3. Concerns

- **[HIGH] Sheet Selection Logic:** Plan 02-01 assumes data is in `SheetNames[0]`. Actual exports often contain metadata or "Instruction" sheets at index 0. If the parser doesn't scan for "Totaaloverzicht Verzuim," it will return empty or garbage data.
- **[HIGH] Column Name Fragility:** The plan expects a single "Naam" column and specific headers like "Leerlingnummer." The actual export splits names (Roepnaam/Voorvoegsels/Achternaam) and uses long-form headers ("Geoorloofde afwezigheid"). The parser will fail to find any data if it looks for "Geoorloofd."
- **[MEDIUM] Data Type Mismatch:** Excel often stores IDs as floats (e.g., `248109.0`). A strict comparison between the PDF's string `"248109"` and Excel's float will fail.
- **[MEDIUM] Time Parsing Edge Cases:** If a student has `0u45m` or just `12m`, a rigid regex like `(\d+)u(\d+)m` might return null or NaN if one part is missing.
- **[LOW] Script Dependency Chain:** High reliance on correct `<script>` tag order. If `excel.js` loads before SheetJS (CDN lag or network error), the app will crash on initialization.

---

### 4. Suggestions

- **Robust Sheet Targeting:** Instead of index 0, implement a loop that checks `workbook.SheetNames` for a name containing "Verzuim" or "Totaal."
- **Name Reconstruction:** Update `parseExcelFile` to automatically concatenate `Roepnaam` + `Voorvoegsels` + `Achternaam` if a single "Naam" column is missing.
- **Header Detection:** Use `XLSX.utils.sheet_to_json(sheet, {header: 1})` to get a raw array, then find the row that contains "Studentnummer" or "Achternaam." This allows the parser to ignore metadata rows at the top of the sheet.
- **ID Sanitization:** Wrap student IDs in `Math.floor(val).toString()` to strip decimal points added by Excel's float storage.
- **Defensive CDN Loading:** In `app.js`, check if `window.XLSX` is defined before allowing the Excel upload button to be clicked.

---

### 5. Risk Assessment: MEDIUM-HIGH

**Justification:** While the architectural approach is correct, the **data parsing logic is too fragile** for real-world SomToday exports. The "Known implementation complexity" notes indicate that the actual file format deviates significantly from the "clean" assumptions made in Plan 02-01. If implemented as currently written, the mentor would likely see "0 of 19 students matched," defeating the core value of the tool.

**Recommendation:** Approve the plans ONLY if they are updated to include **header row detection** and **multi-part name reconstruction.**

---

## Consensus Summary

*Single reviewer — no cross-reviewer consensus possible. codex not installed; claude is current runtime (skipped for independence).*

### Agreed Strengths

- window.* globals + classic script pattern is correct for the no-build constraint
- ID-first then name-fallback matching is the right strategy
- Unmatched names UI is essential for debuggability

### Agreed Concerns (Highest Priority)

1. **[HIGH] Sheet index assumption** — real SomToday exports have metadata at index 0; must scan by sheet name
2. **[HIGH] Column name mismatch** — "Naam", "Leerlingnummer", "Geoorloofd" don't exist in actual exports; must detect headers dynamically
3. **[MEDIUM] Float studentnummer** — Excel stores IDs as 248109.0; string comparison against "248109" will fail

### Divergent Views

*N/A — single reviewer.*

### Post-Execution Note

All three HIGH/MEDIUM concerns were confirmed by real-world testing. The implemented fix addressed each:
- Multi-sheet scanning with name-based scoring
- Raw array parsing (`header:1`) with dynamic header row detection
- Float stripping via regex `/^(\d+)(?:[.,]0+)?$/`
- 4-strategy name matching cascade (leerlingnummer → full name → achternaam exact → achternaam substring)
