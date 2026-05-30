---
status: resolved
slug: datapunten-missing-blank-rows
trigger: "DeelgebiedenMatrix still missing datapunten rows that have no O/V/G/E scores in the PDF"
created: 2026-05-17T00:00:00Z
updated: 2026-05-17T01:00:00Z
---

## Symptoms

- **Expected:** All datapunten listed in the PDF appear in the matrix, even those with no scores yet (blank cells)
- **Actual:** Datapunten with completely blank score cells are still missing from the matrix
- **Previous fix:** `parsers/pdf.ts` was updated to include rows where `scoreItems.length > 0` but no score matched. However rows where `scoreItems.length === 0` are still treated as vak group headings and skipped via `continue`.
- **Root cause hypothesis:** The PDF parser uses `scoreItems.length === 0` as a proxy for "this is a heading row", but blank-scored datapunten rows also have no score items in the PDF text extraction.
- **Reproduction:** Import a PDF where some datapunten have no O/V/G/E yet → open student detail → those rows are absent from the matrix.

## Current Focus

hypothesis: RESOLVED
next_action: n/a
test: n/a
expecting: n/a

## Evidence

- `scoreItems.length === 0` is the sole discriminator between heading rows and blank-scored datapunten rows — both have zero score cells in PDF text extraction.
- Known vak group headings in SomToday PDFs are exactly: "Lesgeven", "Organiseren", "Prof. handelen" (confirmed from app.js lines 1485-1487 and planning docs).
- These map to the three `group` values in `utils/schema.ts`: `lesgeven`, `organiseren`, `prof_handelen`.

## Eliminated

- Rows with score cells but unrecognized values: FIXED in previous session (scoreItems.length > 0 check)

## Resolution

root_cause: >
  `parseDeelgebiedTable` used `scoreItems.length === 0` as a proxy for "this row is a vak group heading".
  Blank-scored datapunten rows (not yet graded) also have zero score cells in the PDF text stream,
  so they were silently treated as headings and discarded via `continue` instead of being pushed
  into the datapunten array.

fix: >
  Added a `VAK_HEADINGS` constant (a Set of the three known group heading strings: "lesgeven",
  "organiseren", "prof. handelen", "professioneel handelen") to `parsers/pdf.ts`.
  The `!hasAnyScore` / `scoreItems.length === 0` branch now checks
  `VAK_HEADINGS.has(labelText.toLowerCase())` before treating a row as a heading.
  Any no-score row that does NOT match the known headings is included as a datapunt
  with `scores: {}` instead of being skipped.

verification: >
  Import a PDF with blank-scored datapunten rows. All rows should now appear in the
  DeelgebiedenMatrix with empty cells rather than being absent. The three group heading
  rows (Lesgeven / Organiseren / Prof. handelen) should still function correctly as vak
  group separators.

files_changed:
  - parsers/pdf.ts (added VAK_HEADINGS constant; fixed parseDeelgebiedTable heading detection; exported VAK_HEADINGS)
