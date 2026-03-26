# Phase 7: Periode Vergelijking - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the detail view so a mentor can see a student's deelgebied scores from fase 1 and fase 2 side by side with visual growth indication. The doorstroomprognose is calculated on the most recently imported period. Import UI (Phase 6) is unchanged — the only change to import is how addStudent() deduplicates.

Out of scope for this phase: print layout (Phase 8), new import UI elements, changing the klasoverzicht tiles.

</domain>

<decisions>
## Implementation Decisions

### Multi-period data model
- **D-01:** Keep `klas.students` as a flat `StudentRecord[]` array (no structural change).
- **D-02:** Change deduplication key from `leerlingId` alone to `leerlingId + periode`. Importing fase 2 PDFs adds new records alongside existing fase 1 records — it does NOT overwrite them.
- **D-03:** `window.addStudent()` in `utils/datamodel.js` gets one updated `findIndex` predicate: `s.leerlingId === student.leerlingId && s.periode === student.periode`.
- **D-04:** `saveKlassen()` / `loadKlassen()` in `utils/klassen.js` require no changes — the flat array serializes correctly as-is.

### Period detection
- **D-05:** Period is auto-detected from `student.periode` (already parsed by `parsers/pdf.js`). No mentor action needed — each StudentRecord lands in the correct period slot automatically. No import UI change required.

### Comparison layout in detail view
- **D-06:** Keep the existing wide deelgebied matrix (`buildDetailDeelgebieden`). Add two footer rows instead of one: "Fase 1 (periode label)" and "Fase 2 (periode label)". When only one period exists, show the single row as before (no second row, no empty slot).
- **D-07:** The Fase 2 row is the "current" row — prognose (CMP-04) and klasoverzicht tile color continue to use the most-recent period's `deelgebiedScores`. "Most recent" = the StudentRecord with the highest `periode` string alphabetically/chronologically among records for that leerlingId.
- **D-08:** The detail header meta line shows the most recent period label.

### Growth indicator style
- **D-09:** Arrow + color badge appended to each score chip in the Fase 2 footer row:
  - ↑ green (`#16a34a`) — score improved (O→V, O→G, V→G)
  - ↓ red (`#dc2626`) — score declined (G→V, G→O, V→O)
  - = gray (`#9ca3af`) — score unchanged
  - No badge shown when fase 1 has no score for that deelgebied (null/—)
- **D-10:** New CSS classes: `.growth-up`, `.growth-down`, `.growth-same` — applied as a `<span>` appended to the existing dm-chip in the Fase 2 tfoot cell only.

### Klasoverzicht tile (CMP-04)
- **D-11:** `berekenStatus()` and `renderKlasGrid()` always operate on the most-recent-period `deelgebiedScores` per student. The planner should ensure `window.getActiveStudents()` (or equivalent) returns the correct record per leerlingId (most recent).

### Empty / single-period state
- **D-12:** When only one period exists for a student, `buildDetailDeelgebieden` renders a single tfoot row (current behavior, no change). The comparison UI only appears when two distinct `periode` values are found for that `leerlingId`.

</decisions>

<specifics>
## Specific Ideas

- Growth arrows should feel subtle — not alarming. They supplement the existing score chip, not replace it.
- The two tfoot rows should be clearly labeled with the actual periode string from the PDF (e.g., "BJ2 Fase 1 DD" and "BJ2 Fase 2 DD") so the mentor knows exactly which is which.
- No extra UI controls (period switcher, toggle) — the mentor just sees both rows in the existing table.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CMP-01 through CMP-04 (period comparison requirements, acceptance criteria)
- `.planning/ROADMAP.md` §"Phase 7: Periode Vergelijking" — success criteria and phase goal

### Existing code to modify
- `utils/datamodel.js` — `addStudent()` dedup logic (D-03), `StudentRecord` typedef (D-01)
- `utils/klassen.js` — `getActiveStudents()` must return most-recent-period record per leerlingId (D-11)
- `app.js` — `buildDetailDeelgebieden()` (D-06, D-09, D-10), `buildDetailHeader()` (D-08), `berekenStatus()` (D-07)

### Phase 6 decisions (carried forward)
- `.planning/phases/06-multi-class-ui/06-01-PLAN.md` — D-07 bridge pattern, D-08 (klassen.js structure), storage key

No external design specs. Requirements are fully captured in decisions above and REQUIREMENTS.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dm-chip` CSS class + `SCORE_CHIP_MAP` — existing score chip renderer; growth badge attaches to this
- `buildDetailDeelgebieden(student)` in `app.js` — the function to extend with two-row tfoot
- `berekenStatus(student)` in `app.js` — uses `student.deelgebiedScores`; must receive the most-recent-period record

### Established Patterns
- Window.* globals (no ES modules) — all new functions follow this pattern
- `klas.students` flat array — do not change the shape, only the dedup predicate
- `student.periode` string already parsed from PDF by `parsers/pdf.js` (line ~470 in app.js: `console.log('Periode:', student.periode)`)

### Integration Points
- `showDetail(leerlingId)` → `buildDetailHTML(student)` → `buildDetailDeelgebieden(student)`: needs to find ALL records for `leerlingId`, sort by periode, pass both to the renderer
- `window.getActiveStudents()` or equivalent in `klassen.js` used by `renderKlasGrid()` — must deduplicate to one record per leerlingId (most recent) for the tile display
- `autoSave()` calls `saveKlassen()` — no change needed; multi-record students serialize correctly

</code_context>

<deferred>
## Deferred Ideas

- None raised during discussion — scope stayed within Phase 7 boundary.

</deferred>

---

*Phase: 07-periode-vergelijking*
*Context gathered: 2026-03-26*
