## Pitfalls Research — v2.4

**Project:** Mentordashboard CIOS
**Milestone:** v2.4 — BPV real column matchers, Keuzedelen, R&N on klasoverzicht, Non-empty class deletion, CSS resizing
**Researched:** 2026-05-28
**Confidence:** HIGH — all findings are grounded in this codebase's actual history and source files

---

## Feature 1: BPV Real Column Matchers (SheetJS on real SomToday exports)

### Pitfall 1-A: cpexcel registration is load-order sensitive and must not be assumed global

**What goes wrong:** `utils/bpv.ts` registers cpexcel at module load time with the identical 3-line block from `parsers/excel.ts`. The mechanism is load-order sensitive — `XLSX.set_cptable` must run before the first `XLSX.read()` call on the same JS module thread. If any future plan splits `parseBpvExcel` into a separate file or wraps it behind a lazy import, the registration does not carry over. SheetJS silently falls back to ASCII encoding. Dutch names with `ë`, `ij`, `ü` come out as mojibake, causing zero leerlingId matches. The symptom looks like a column-matcher bug but is actually an encoding bug.

**What happened here:** Phase 22 Plan 01 explicitly documented copying the 3-line cpexcel block from `parsers/excel.ts` (`import * as XLSX from 'xlsx'`, `import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs'`, `XLSX.set_cptable`).

**Prevention:** Keep all `parseBpvExcel` logic in `utils/bpv.ts` where the registration already lives. Never lazy-import or re-export the function through an intermediate module without repeating the cpexcel registration before the first `XLSX.read()` call.

---

### Pitfall 1-B: `_bpvKolom()` fuzzy match silently returns 0 when column names change across school years

**What goes wrong:** The current `_bpvKolom()` helper uses `toLowerCase().includes(candidate)`. Phase 22 Plan 01 Summary documents that the real file has `"Stage-uren goedgekeurd"` as the hours column. If SomToday renames the column to `"Goedgekeurde stage-uren"` or `"Uren goedgekeurd"` in a new export template, the candidate `"stage-uren goedgekeurd"` fails the includes check. `gerealiseerdeUren` returns 0 silently. The BPV progress bar shows 0% for all students and no error is raised.

**Prevention:** Run `debugBpvExcel()` on the real file first — it logs the first 5 rows per sheet. Add a second candidate string for the hours column: both the confirmed name and likely aliases (e.g., `"stage-uren goedgekeurd"` and `"goedgekeurd"` as independent fallback candidates). The candidate list needs at least two independent aliases per critical column.

**Phase:** The plan that wires up column matchers to a newly provided BPV export file. Must run `debugBpvExcel()` before writing any column candidates.

---

### Pitfall 1-C: Merged cells and multi-row headers cause header detection to pick the wrong row

**What goes wrong:** The current header-row detection scans the first 20 rows and scores each row against `BPV_HEADER_KEYS`. SomToday exports sometimes have a merged title row above the real header (school name, export timestamp). SheetJS represents merged cells by only populating the top-left cell of the merge. A header detection loop that accepts the first row above a score threshold may stop at the merged title row and produce all-null column mappings.

**Prevention:** After identifying a candidate header row, assert that at least 3 distinct key columns are present (`Student` or equivalent, `Studentnummer` or equivalent, `Stage-uren goedgekeurd` or equivalent). If fewer than 3 match, continue scanning. Also pass `{ sheetStubs: true }` to `XLSX.read()` so merged cells produce stub entries in the row array rather than gaps.

**Phase:** BPV column matcher plan. Not blocking scaffold work.

---

### Pitfall 1-D: Summary sheet and detail sheet both pass the BPV scorer — hours get counted twice

**What goes wrong:** `parseBpvExcel` accumulates `gerealiseerdeUren` across all rows per student. The sheet scorer (bpv+4, stage+3, uren+2, praktijk+2) picks the single highest-scoring sheet. If a SomToday export contains both a per-placement detail sheet and a totals summary sheet, and both pass the scorer within a close margin, only the top-scoring sheet is processed. But if future code ever processes multiple sheets (e.g., to collect per-placement breakdown), each student's hours will be counted twice. `gerealiseerdeUren > verwachteUren` from day one with no user-facing error.

**Prevention:** Verify the sheet scorer always picks exactly one sheet. If two sheets score within 2 points of each other, log a warning via `debugBpvExcel` and use only the top-scoring one. Never accumulate across multiple sheets.

---

## Feature 2: Keuzedelen per Student (Extending StudentRecord Schema)

### Pitfall 2-A: New optional field is `undefined` on all pre-existing records after deserialization — not `null`, not `[]`

**What goes wrong:** `StudentRecord` is stored as AES-encrypted JSON in plugin-store via `saveKlassen()`. When a new optional field like `keuzedelen: string[]` is added, all records encrypted before the field existed will deserialize with that field absent (`undefined`), not `null` and not `[]`. Any code that calls `student.keuzedelen.length` without a null guard throws `TypeError: Cannot read properties of undefined`.

**This exact pattern already happened in this codebase:** Phase 23 documented it for `rekenResultaat` and `nederlandsResultaat`. The established fix is `?? null` at every read site for nullable fields. For array fields the equivalent is `student.keuzedelen ?? []`.

**Prevention:**
- Read site: `const keuzedelen = student.keuzedelen ?? []`
- Write site: `student.keuzedelen = updatedList` (full array replace, not mutation, so the key is present in the next serialization)
- No migration pass needed — lazy initialization at read time is the established and safe pattern for this codebase. Do NOT add a migration loop inside `loadKlassen()` that re-encrypts all records on load.

**Phase:** The plan that introduces the `keuzedelen` field. Apply `?? []` at every read site from day one.

---

### Pitfall 2-B: `null` vs `undefined` in JSON round-trip produces different behavior in tests

**What goes wrong:** `JSON.stringify(undefined)` omits the key entirely. `JSON.stringify(null)` writes `"keuzedelen":null`. After a round-trip through the store, a field initialized as `undefined` disappears; a field set to `null` survives as `null`. If component code checks `if (student.keuzedelen)` it evaluates false for all of `undefined`, `null`, and `[]`. But in Vitest tests, the behavior depends on which value was used in the fixture — test authors who write `{ keuzedelen: undefined }` in a fixture will get different results than those writing `{ keuzedelen: [] }`.

**Prevention:** Never rely on truthiness for array fields. Use `Array.isArray(student.keuzedelen) ? student.keuzedelen : []` at every read. In Vitest fixtures, always set `keuzedelen: []` explicitly — do not omit the field unless the test specifically targets the missing-field path.

---

### Pitfall 2-C: Object spread breaks the appState bridge — mutations must be in-place

**What goes wrong:** `klassenState.klassen[activeKlasId].students` shares its array reference with `appState.students` (the bridge set in `switchActiveKlas`, `utils/klassen.ts` line 88). A mutation `student.keuzedelen = newValue` followed by `saveKlassen()` updates the live array in memory and persists correctly. However, if a developer writes `appState.students[idx] = { ...student, keuzedelen: newValue }` to create a new object, the array element at `[idx]` is now a different object. The rest of the class persists correctly, but the replaced element's `leerlingId` bridge may be broken for any future mutation that searches for the student by reference.

**This is the established pattern:** Phase 27 (`renameKlas`) documents the same principle. Phase 23's `RekenenNederlandsSection` follows the `AanvullendSection` pattern: `rec[field] = value || null; await saveKlassen()`. No spread.

**Prevention:** Mutate in-place: `student.keuzedelen = newValue; await saveKlassen()`. Never create a new student object with object spread at the point of save.

---

## Feature 3: R&N on Klasoverzicht Tiles

### Pitfall 3-A: BJ2 reactivity bug — R&N mutation may land on the wrong periode record

**What goes wrong:** `rekenResultaat` and `nederlandsResultaat` are written by `RekenenNederlandsSection` onto whatever `student` object was in scope during the mutation. The klasoverzicht tile reads from `getActiveStudents()`, which deduplicates to one record per leerlingId by sorting on `periode` descending and taking the first (most-recent). If a student has two import phases (BJ2 Fase 1 and BJ2 Fase 2), `getActiveStudents()` returns the Fase 2 record. If the mentor happened to open the detail view while Fase 1 was the "active student" reference, the R&N mutation lands on the Fase 1 record. The tile reads the Fase 2 record and shows no R&N badge. No error, wrong data.

**This is the BJ2 reactivity bug pattern referenced in `STATE.md` (Phase 23 design notes).** It also appeared in the `trendMap` computation in `KlasOverzicht` and was fixed in Phase 26 by using `getAllRecordsForStudent` and comparing oldest vs newest periods.

**Prevention:** Apply R&N mutations to ALL records for a leerlingId simultaneously — the same pattern already used for `verzuim` in `datamodel.ts` lines 188–191:
```
appState.students
  .filter(s => s.leerlingId === student.leerlingId)
  .forEach(s => { s.rekenResultaat = value; });
await saveKlassen();
```
This ensures the mutation lands on both Fase 1 and Fase 2 records. The tile reads the Fase 2 record and gets the correct value regardless of which record the detail view was showing.

**Phase:** The plan that adds R&N badges to `LeerlingTegel`. Define the mutation strategy explicitly before writing JSX.

---

### Pitfall 3-B: R&N tile row increases tile height and shifts the grid

**What goes wrong:** `LeerlingTegel` uses `display: flex; flex-direction: column; gap: 0.75rem`. Adding an R&N row means a third visual line after the naam and the score-telling/trend row. If R&N badges render as two separate elements ("Rekenen: 2F" on one line, "Nederlands: 3F" on another), tile height increases significantly and the bento grid layout shifts unevenly, especially with mixed data (some students have R&N, some do not).

**Prevention:** Render R&N as a single compact row — e.g., `R 2F · N 3F` — with the same `.score-telling` CSS class used for the score-telling/trend row (defined in `index.css` lines 539–549). Only show the R&N row when at least one of `rekenResultaat` or `nederlandsResultaat` is non-null. Do not add a new CSS block; reuse `.score-telling`.

**Phase:** The LeerlingTegel plan. Define the R&N tile display format in the UI spec before writing JSX.

---

### Pitfall 3-C: Hardcoded hex colors in new badge JSX breaks dark mode immediately

**What goes wrong:** Phase 29 UI-03 audited and replaced all hardcoded hex colors (`'#10b981'`, `'#9ca3af'`, `'#dc2626'`) in components with CSS variables. This was a cleanup of colors that leaked during Phase 14, 18, and 23. Every new component added in v2.4 that uses inline `style` with hex color values will break dark mode on its first day.

**Prevention:** After writing any new JSX with inline `style`, grep `src/components/` for `#[0-9a-fA-F]` before committing — must return zero matches in new/modified files. Use only CSS variables from `src/index.css` `:root`:
- Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`, `var(--text-faint)`
- Status: `var(--status-groen-text)`, `var(--status-oranje-text)`, `var(--status-rood-text)`
- RAG bars: `var(--rag-groen)`, `var(--rag-oranje)`, `var(--rag-rood)`

**Phase:** Every plan that creates or modifies a component. Applies to all v2.4 phases.

---

## Feature 4: Non-Empty Class Deletion

### Pitfall 4-A: `canDelete` prop in App.tsx currently hard-gates on empty students — lifting the guard requires updating three places

**What goes wrong:** `App.tsx` line 156–158 computes `canDelete: Array.isArray(klas.students) && klas.students.length === 0`. This means the `×` button in `KlasTabStrip` is never rendered for non-empty classes. `deleteKlas()` in `utils/klassen.ts` has no such guard — it deletes any class without checking students. The guard is entirely in the UI layer. If v2.4 lifts the restriction, three changes are needed in concert: (1) update the `canDelete` computation in `App.tsx`, (2) update the `window.confirm` message in `handleDeleteKlas` to include student count, (3) verify `deleteKlas()` already handles the "delete active class" case correctly.

**Verification of `deleteKlas()` correctness:** The function already handles deletion of the active class (lines 101–111 of `utils/klassen.ts`): it switches to the first remaining class or sets `activeKlasId = null` and `appState.students = []` if no classes remain. This is correct. No change needed in `utils/klassen.ts`.

**Prevention:**
- The confirm message must clearly state how many students are deleted: `Klas '${naam}' bevat ${count} leerlingen en al hun data. Dit kan niet ongedaan worden gemaakt.`
- After `deleteKlas()`, the existing `setRefreshKey` in `handleDeleteKlas` triggers re-render but does not change `view`. Add a `setView('import')` guard when `Object.keys(klassenState.klassen).length === 0` — this matches the existing pattern in `handleKlasSwitch`.

**Phase:** The plan that modifies the delete interaction. All three changes (canDelete, confirm message, view fallback) must be in a single plan.

---

### Pitfall 4-B: Delete button renders on the active class tab when all classes become deletable

**What goes wrong:** Currently the `×` button only appears when `canDelete === true`, which is only for empty classes. If `canDelete` becomes always true, the active class tab also shows `×`. The existing `onClick` on the `×` button calls `e.stopPropagation()` and `onDeleteKlas` directly. There is no additional debounce or disabled state. A user who accidentally clicks `×` on their active class will trigger the confirm dialog but may be startled to find themselves looking at the import screen after confirming.

**Prevention:** Either (a) keep `canDelete: false` for the active class specifically to prevent self-deletion via the tab UI (the safest UX), or (b) ensure the confirm dialog clearly states which class is being deleted and what happens next. Option (a) is simpler: `canDelete: klas.id !== klassenState.activeKlasId` (or add a separate delete button in a class settings panel rather than on the tab strip).

**Phase:** Same plan as 4-A. Choose one approach and document it before implementation.

---

## Feature 5: CSS Resizing (Nav Banner Height, SpiderChart SVG)

### Pitfall 5-A: `.nav-stripe` height is hardcoded to 52px — breaks if `#main-nav min-height` changes

**What goes wrong:** The diagonal CIOS blue stripe is implemented as a `.nav-stripe` div (added in Phase 29 FIX-01, visible in current `KlasTabStrip.tsx` line 169 and `index.css` lines 276–285). Its CSS is `position: absolute; top: 0; right: 0; width: 140px; height: 52px` — hardcoded to match `#main-nav min-height: 52px`. Phase 29 PATTERNS.md explicitly documents this as the fix for the previous `::after` pseudo-element that failed to render in Tauri WebView. If any v2.4 plan changes `#main-nav min-height` (e.g., to accommodate a second tab row or a larger logo), the stripe clips or overflows at 52px.

**Prevention:** Always update `.nav-stripe { height: }` in `index.css` whenever `#main-nav { min-height: }` changes — they must be equal. Consider replacing `height: 52px` in `.nav-stripe` with `height: 100%` and verifying the gradient renders correctly (the `to bottom-left` gradient direction is relative to the element, so 100% height should work as long as the parent has a defined height via `min-height`).

**Phase:** Any plan that touches `#main-nav` sizing. Run a visual check of the stripe after every nav height change.

---

### Pitfall 5-B: SpiderChartCard SVG is fixed at 160px — does not respond to container resize

**What goes wrong:** `.spider-card { width: 160px }` is set in `index.css` section 26 (line 1380). `SpiderChartCard.tsx` calls `SpiderChart.buildSpiderSVG()` which generates a fixed-size SVG with hardcoded pixel dimensions. If any plan changes the layout containing `SpiderChartCard` (e.g., making the detail view full-width, or changing the spider section from a constrained column to a wider container), the SVG stays 160px wide inside a larger card. The visual result is a small chart with empty whitespace around it.

**Prevention:** When changing any layout that contains `SpiderChartCard`, check the `width: 160px` constraint on `.spider-card`. To make the chart responsive, the SVG must use `width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 W H"` — this preserves aspect ratio while filling the container. Do not change `SpiderChart.buildSpiderSVG` internals unless specifically tasked — flag this as a risk in any adjacent plan that resizes the container.

**Phase:** Any plan that changes the width of the spider chart container.

---

### Pitfall 5-C: `@media print` blocks may conflict with new CSS sections added in v2.4

**What goes wrong:** `src/index.css` already has `@media print` blocks (lines 1418–1477 from the print phase). If v2.4 adds new CSS sections with class names that have display rules, those classes need corresponding `@media print` overrides if they should appear in print output (e.g., a new R&N tile badge), or should be explicitly `display: none` in print if they are interactive-only elements (e.g., delete buttons on tiles).

**Prevention:** When adding a new CSS class to `index.css` for a visual UI element that could appear in print (tile badges, detail view additions), check whether the existing `@media print` block handles it. The current rule `#root > * { display: none; } .print-target { display: block !important; }` means only the print target is shown. New tile-level elements inside `.print-target` will appear automatically — but interactive controls (delete buttons, dropdowns) should have `.no-print { display: none !important; }` applied.

**Phase:** Any plan that adds CSS classes for interactive UI elements that appear inside `DetailWeergave` or `LeerlingTegel`.

---

## Phase-Specific Warnings Summary

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| BPV column matchers (real file) | `_bpvKolom()` misses renamed column → silent zero hours | Run `debugBpvExcel()` first; extend candidate alias list to 2+ per column |
| BPV column matchers (real file) | Merged title row causes header detection to stop too early | Assert ≥3 key columns present; use `{ sheetStubs: true }` |
| BPV column matchers (real file) | cpexcel registration lost if file is refactored | Keep `parseBpvExcel` in `utils/bpv.ts`; repeat registration if moved |
| Keuzedelen data model | Field absent on old records → `undefined` crash | `student.keuzedelen ?? []` at every read site from day one |
| Keuzedelen save | Object spread breaks bridge reference | Mutate in-place: `student.field = value; saveKlassen()` |
| Keuzedelen tests | Test fixture omits field → different behavior from production | Always set `keuzedelen: []` explicitly in fixtures |
| R&N on tiles | BJ2 reactivity bug — mutation lands on wrong periode record | Apply mutations to ALL records for leerlingId (verzuim pattern) |
| R&N on tiles | Tile grows too tall with 3rd row | Single compact row; reuse `.score-telling` CSS class |
| R&N on tiles | New badge uses hardcoded hex → dark mode breaks | Post-write grep for `#[0-9a-fA-F]`; must be zero matches |
| Non-empty class delete | Three places need updating in concert | `canDelete`, confirm message, view fallback in one plan |
| Non-empty class delete | Active class shows `×` button — accidental self-deletion | Keep `canDelete: false` for active class, or use a settings panel |
| Non-empty class delete | View stuck on 'klas' after last class deleted | `setView('import')` when `Object.keys(klassenState.klassen).length === 0` |
| Nav height change | `.nav-stripe` hardcoded to 52px | Update `.nav-stripe { height }` whenever `#main-nav { min-height }` changes |
| SpiderChart resize | SVG fixed at 160px inside larger container | Change to `width="100%"` + `viewBox`; flag risk in adjacent layout plans |
| Any new component | `@media print` does not cover new interactive controls | Add `.no-print` to interactive elements inside `.print-target` |

---

*Sources: Direct inspection of `utils/klassen.ts`, `utils/datamodel.ts`, `utils/schema.ts`, `src/App.tsx`, `src/components/KlasTabStrip.tsx`, `src/components/KlasOverzicht.tsx`, `src/components/BpvProgressSection.tsx`, `src/components/SpiderChartCard.tsx`, `src/index.css`, `.planning/STATE.md`, `.planning/phases/22-bpv-stage-excel/22-01-SUMMARY.md`, `.planning/phases/22-bpv-stage-excel/22-02-SUMMARY.md`, `.planning/phases/23-rekenen-nederlands/23-01-SUMMARY.md`, `.planning/phases/23-rekenen-nederlands/23-02-SUMMARY.md`, `.planning/phases/27-klasbeheer/27-01-SUMMARY.md`, `.planning/phases/29-ui-streamlining-bugfixes/29-PATTERNS.md`*
