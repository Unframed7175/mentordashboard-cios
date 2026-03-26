# Phase 7: Periode Vergelijking — Research

**Researched:** 2026-03-26
**Domain:** Vanilla JS/HTML/CSS — multi-period data model, comparison UI, growth indicators
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Multi-period data model**
- D-01: Keep `klas.students` as a flat `StudentRecord[]` array (no structural change).
- D-02: Change deduplication key from `leerlingId` alone to `leerlingId + periode`. Importing fase 2 PDFs adds new records alongside existing fase 1 records — it does NOT overwrite them.
- D-03: `window.addStudent()` in `utils/datamodel.js` gets one updated `findIndex` predicate: `s.leerlingId === student.leerlingId && s.periode === student.periode`.
- D-04: `saveKlassen()` / `loadKlassen()` in `utils/klassen.js` require no changes — the flat array serializes correctly as-is.

**Period detection**
- D-05: Period is auto-detected from `student.periode` (already parsed by `parsers/pdf.js`). No mentor action needed. No import UI change required.

**Comparison layout in detail view**
- D-06: Keep the existing wide deelgebied matrix (`buildDetailDeelgebieden`). Add two footer rows instead of one: "Fase 1 (periode label)" and "Fase 2 (periode label)". When only one period exists, show the single row as before (no second row, no empty slot).
- D-07: The Fase 2 row is the "current" row — prognose (CMP-04) and klasoverzicht tile color continue to use the most-recent period's `deelgebiedScores`. "Most recent" = the StudentRecord with the highest `periode` string alphabetically/chronologically among records for that leerlingId.
- D-08: The detail header meta line shows the most recent period label.

**Growth indicator style**
- D-09: Arrow + color badge appended to each score chip in the Fase 2 footer row:
  - ↑ green (`#16a34a`) — score improved (O→V, O→G, V→G)
  - ↓ red (`#dc2626`) — score declined (G→V, G→O, V→O)
  - = gray (`#9ca3af`) — score unchanged
  - No badge shown when fase 1 has no score for that deelgebied (null/—)
- D-10: New CSS classes: `.growth-up`, `.growth-down`, `.growth-same` — applied as a `<span>` appended to the existing dm-chip in the Fase 2 tfoot cell only.

**Klasoverzicht tile (CMP-04)**
- D-11: `berekenStatus()` and `renderKlasGrid()` always operate on the most-recent-period `deelgebiedScores` per student. `window.getActiveStudents()` (or equivalent) returns the correct record per leerlingId (most recent).

**Empty / single-period state**
- D-12: When only one period exists for a student, `buildDetailDeelgebieden` renders a single tfoot row (current behavior, no change). The comparison UI only appears when two distinct `periode` values are found for that `leerlingId`.

### Claude's Discretion

None specified — all decisions locked in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

- None raised during discussion — scope stayed within Phase 7 boundary.
- Out of scope for this phase: print layout (Phase 8), new import UI elements, changing the klasoverzicht tiles.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMP-01 | Mentor kan per klas PDFs van meerdere periodes importeren (bijv. fase 1 én fase 2) | D-02/D-03: dedup key change in `addStudent()` — the only code change needed to store multiple periods per student |
| CMP-02 | Detailweergave toont deelgebied-scores van fase 1 én fase 2 naast elkaar | D-06: `buildDetailDeelgebieden` extended with two tfoot rows; lookup pattern confirmed from code audit |
| CMP-03 | Groei per deelgebied (V/G/E stijging/daling) is visueel onderscheidbaar in de vergelijking | D-09/D-10: growth badge `<span>` with `.growth-up/.growth-down/.growth-same`; score ordering confirmed from `SCORE_LEVELS` in schema.js |
| CMP-04 | Doorstroomprognose wordt berekend op de meest recente periode | D-07/D-11: `getActiveStudents()` must deduplicate to one record per leerlingId before `berekenStatus()`/`renderKlasGrid()` consumes it |
</phase_requirements>

---

## Summary

Phase 7 is a targeted surgical extension to three files: `utils/datamodel.js`, `utils/klassen.js`, and `app.js`. The flat `klas.students` array already stores `StudentRecord` objects with a `periode` field (parsed by `parsers/pdf.js`). The only barrier to multi-period storage is a one-line dedup predicate in `addStudent()` that currently overwrites on `leerlingId` match — changing it to match on `leerlingId + periode` is the entire data model change.

The detail view (`buildDetailDeelgebieden`) currently renders a single `<tfoot>` row labelled "Eindoordeel". The Phase 7 change wraps this into a two-row tfoot when two distinct periods exist for the student: one row per period, labelled with the actual `student.periode` string. The Fase 2 row adds a growth badge `<span>` next to each score chip indicating change direction. When only one period exists, the existing single-row behavior is unchanged.

The klasoverzicht grid (`renderKlasGrid`) calls `berekenStatus()` for each entry in `window.appState.students`. After the dedup change, this array may contain multiple records for the same student. A deduplication step is required before the grid renders — returning only the most-recent-period record per `leerlingId`. This is the function contract change for `getActiveStudents()` in `klassen.js`.

**Primary recommendation:** Implement as three sequential tasks — (1) `addStudent()` dedup fix, (2) `getActiveStudents()` most-recent dedup, (3) `buildDetailDeelgebieden()` two-row tfoot with growth badges. Each task is independently verifiable.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS | ES2020 (browser built-in) | All logic — no framework | Established project constraint; no build step |
| Plain HTML/CSS | HTML5 / CSS3 | Markup and styling | Established project constraint |
| localStorage | Browser built-in | Persistence | Already used for all app state (klassen.js) |

No new libraries needed. This phase adds zero new dependencies.

### Supporting

No supporting libraries introduced. All patterns are implemented with existing project utilities:
- `window.SCORE_LEVELS` (`schema.js`) — canonical score ordering for growth direction comparison
- `window.DEELGEBIEDEN` (`schema.js`) — deelgebied iteration in tfoot generation
- `window.SCORE_CHIP_MAP` (`app.js`) — existing chip renderer

**Installation:** none required.

---

## Architecture Patterns

### Recommended Project Structure

No new files are needed. All changes land in existing files:

```
utils/
├── datamodel.js     # addStudent() dedup predicate — 1 line change (D-03)
└── klassen.js       # getActiveStudents() — add most-recent dedup (D-11)
app.js               # buildDetailDeelgebieden() — two-row tfoot + growth badges
                     # buildDetailHeader() — use most-recent periode label (D-08)
                     # showDetail() — gather all records for leerlingId, pass both to renderer
                     # berekenStatus() call sites — ensure they receive most-recent record
index.html           # 3 new CSS class definitions: .growth-up, .growth-down, .growth-same
```

### Pattern 1: Compound Dedup Key in addStudent()

**What:** Change the `findIndex` predicate from single-key to compound-key lookup.

**When to use:** Any time new period records must coexist in the flat array without overwriting existing ones.

**Existing code (lines 58-65 in datamodel.js):**
```javascript
// BEFORE (overwrites on leerlingId match):
window.addStudent = function(student) {
  const idx = window.appState.students.findIndex(s => s.leerlingId === student.leerlingId);
  if (idx >= 0) {
    window.appState.students[idx] = student;
  } else {
    window.appState.students.push(student);
  }
};
```

**After (D-03):**
```javascript
// AFTER (dedup on leerlingId + periode — preserves multi-period records):
window.addStudent = function(student) {
  var idx = window.appState.students.findIndex(function(s) {
    return s.leerlingId === student.leerlingId && s.periode === student.periode;
  });
  if (idx >= 0) {
    window.appState.students[idx] = student;
  } else {
    window.appState.students.push(student);
  }
};
```

**Note:** Uses `var` and anonymous function expression consistent with the project's classic-script style (not arrow functions in globals — see decisions log).

### Pattern 2: Most-Recent Record Lookup

**What:** Utility to resolve the "most recent" StudentRecord for a given `leerlingId` from a flat array containing multiple records per student.

**When to use:** `getActiveStudents()` return value (for renderKlasGrid), `showDetail()` (to find canonical student for berekenStatus), `buildDetailHeader()` (for meta line).

**Implementation approach — alphabetical sort on `periode` string:**
```javascript
// Helper: returns the StudentRecord with the highest periode string for a given leerlingId.
// "Most recent" per D-07 = alphabetically last (e.g., "BJ2 Fase 2 DD" > "BJ2 Fase 1 DD").
function getMostRecentRecord(students, leerlingId) {
  var records = students.filter(function(s) { return s.leerlingId === leerlingId; });
  if (records.length === 0) return null;
  if (records.length === 1) return records[0];
  return records.reduce(function(best, s) {
    return s.periode > best.periode ? s : best;
  });
}
```

**`getActiveStudents()` updated contract (D-11):**
The current implementation returns `klas.students` directly (all records). After the dedup change, it must return one record per `leerlingId` (most recent). The function signature is unchanged — callers that need ALL records for a student (i.e., `buildDetailDeelgebieden`) must query `window.appState.students` directly by `leerlingId`.

```javascript
window.getActiveStudents = function() {
  if (!window.klassenState.activeKlasId) return [];
  var klas = window.klassenState.klassen[window.klassenState.activeKlasId];
  if (!klas) return [];
  // Deduplicate to one (most recent) record per leerlingId for grid display
  var seen = {};
  var result = [];
  var sorted = klas.students.slice().sort(function(a, b) {
    return (b.periode || '').localeCompare(a.periode || '');
  });
  for (var i = 0; i < sorted.length; i++) {
    if (!seen[sorted[i].leerlingId]) {
      seen[sorted[i].leerlingId] = true;
      result.push(sorted[i]);
    }
  }
  return result;
};
```

**CRITICAL:** `renderKlasGrid()` currently iterates `window.appState.students` directly (line 857 in app.js), NOT through `getActiveStudents()`. This call site must also be updated to use the deduplicated list, OR `getActiveStudents()` must be called there. Research confirms `renderKlasGrid` does `const students = window.appState.students` — this must change.

### Pattern 3: Two-Row tfoot with Growth Badges

**What:** Extension of `buildDetailDeelgebieden(student)` to accept all records for a `leerlingId` and render two footer rows when two distinct periods exist.

**Signature change:** `buildDetailDeelgebieden` currently takes a single `student` object. Phase 7 changes it to accept an array of all records for that student (or the calling function in `buildDetailHTML` can pre-compute and pass period1/period2 explicitly).

**Recommended approach:** Keep signature `buildDetailDeelgebieden(student)` but internally look up all records for `student.leerlingId` from `window.appState.students`. This avoids signature churn on all callers (only called from `buildDetailHTML`).

**tfoot generation logic:**
```javascript
// Inside buildDetailDeelgebieden(student):
var allRecords = window.appState.students.filter(function(s) {
  return s.leerlingId === student.leerlingId;
});
allRecords.sort(function(a, b) {
  return (a.periode || '').localeCompare(b.periode || '');
});
// allRecords[0] = earliest (Fase 1), allRecords[allRecords.length - 1] = latest (Fase 2)
var hasTwoPeriods = allRecords.length >= 2
  && allRecords[0].periode !== allRecords[allRecords.length - 1].periode;
```

**Growth direction lookup — uses SCORE_LEVELS array order:**
```javascript
// SCORE_LEVELS = ['onvoldoende', 'voldoende', 'goed', 'excellent'] (schema.js)
function scoreRank(score) {
  return score ? window.SCORE_LEVELS.indexOf(score) : -1;
}

function growthBadge(score1, score2) {
  // score1 = Fase 1, score2 = Fase 2
  if (score1 === null || score1 === undefined) return ''; // no basis
  var r1 = scoreRank(score1);
  var r2 = scoreRank(score2);
  if (r2 < 0) return ''; // score2 is null — no badge (only show when fase1 exists)
  if (r2 > r1) return '<span class="growth-up" aria-label="gestegen">\u2191</span>';
  if (r2 < r1) return '<span class="growth-down" aria-label="gedaald">\u2193</span>';
  return '<span class="growth-same" aria-label="gelijk">=</span>';
}
```

**Key insight on score key lookup:** `deelgebiedScores` in `StudentRecord` uses the deelgebied `label` string as key (e.g., `"V&A"`, `"M&M"`), not the `id`. This is confirmed by the existing tfoot generation at app.js line 1192: `scores[dg.label] || null`. The growth comparison must use the same key.

### Pattern 4: showDetail() — gathering all records

**Current:** `showDetail(leerlingId)` calls `window.appState.students.find(s => s.leerlingId === leerlingId)` — returns first match only.

**After Phase 7:** Must also pass context allowing `buildDetailDeelgebieden` to access all records. Since `buildDetailDeelgebieden` will self-look-up from `window.appState.students`, no signature change is needed here. However, `buildDetailHTML(student)` receives the most-recent record and must call `berekenStatus` with it (most-recent scores for prognose — D-07). `showDetail` must change its `find()` to return the most-recent record:

```javascript
function showDetail(leerlingId) {
  // Get the most recent record for the leerlingId (for berekenStatus, header, etc.)
  var records = window.appState.students.filter(function(s) { return s.leerlingId === leerlingId; });
  if (records.length === 0) return;
  records.sort(function(a, b) { return (b.periode || '').localeCompare(a.periode || ''); });
  var student = records[0]; // most recent
  // ... rest unchanged
}
```

### Anti-Patterns to Avoid

- **Nesting multi-period data:** Do not restructure `klas.students` into `{ leerlingId: { periods: [...] } }`. D-01 locks the flat array — changing the shape breaks serialization, the bridge pattern, and all existing code.
- **Adding a period switcher UI:** D-12 / phase boundary is clear — no period toggle, no dropdown, no extra controls. Both rows are always shown simultaneously.
- **Using arrow functions in globals:** The project uses `var` + function expressions in `utils/*.js` globals (see `mergeVerzuim`, `addStudent`). Arrow functions appear inside `app.js` local functions only (module scope). New global functions in `klassen.js`/`datamodel.js` must follow the `var`/`function` style.
- **Changing `berekenStatus` signature:** `berekenStatus(student)` consumes `student.deelgebiedScores`. It doesn't need changing — it receives the most-recent record. The fix is ensuring callers pass the correct (most-recent) record.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Score ordering for growth direction | Custom score comparison map | `window.SCORE_LEVELS.indexOf(score)` | Already defined in schema.js; index gives ordinal rank directly |
| Score chip HTML | New chip renderer | `dmChip()` helper inside `buildDetailDeelgebieden` | Already defined; growth badge is appended to its output |
| Deelgebied iteration | Custom DEELGEBIEDEN list | `window.DEELGEBIEDEN` (schema.js) | All 19 IDs and labels are canonical; must not drift |
| LocalStorage serialization | Custom serializer | `saveKlassen()` + `loadKlassen()` as-is (D-04) | Flat array round-trips correctly; no changes needed |

**Key insight:** No new helper utilities are needed. Growth direction is two array index comparisons on the existing `SCORE_LEVELS` constant.

---

## Common Pitfalls

### Pitfall 1: renderKlasGrid reads appState.students directly

**What goes wrong:** After the dedup fix, `window.appState.students` may contain 2 records for the same `leerlingId` (one per period). `renderKlasGrid()` at line 857 does `const students = window.appState.students` and maps directly — every student appears twice in the grid.

**Why it happens:** The bridge pattern (`switchActiveKlas` sets `window.appState.students = klas.students`) means `appState.students` IS the raw klas array. `renderKlasGrid` was written when only one record per student existed.

**How to avoid:** Change `renderKlasGrid()` to call `window.getActiveStudents()` (which returns deduplicated most-recent records) instead of reading `window.appState.students` directly.

**Warning signs:** After importing Fase 2 PDFs, the klasoverzicht grid shows duplicate tiles for the same student name.

### Pitfall 2: deelgebiedScores key is label, not id

**What goes wrong:** Growth comparison code uses `dg.id` (e.g., `"va"`) as the key into `deelgebiedScores`, but the map uses `dg.label` (e.g., `"V&A"`). All lookups return `undefined`, no growth badges render.

**Why it happens:** `buildDetailDeelgebieden` at line 1192 uses `scores[dg.label] || null`. The PDF parser populates `deelgebiedScores` with label keys, not id keys.

**How to avoid:** Use `scores[dg.label]` consistently for all `deelgebiedScores` lookups in growth comparison logic.

**Warning signs:** All growth badges are absent even after two periods are imported.

### Pitfall 3: Alphabetical sort on periode string only works if strings are comparable

**What goes wrong:** If period strings from different PDFs don't sort alphabetically in the correct temporal order (e.g., "Periode 9" vs "Periode 10" sorts "10" < "9"), the "most recent" selection is wrong.

**Why it happens:** D-07 specifies "highest `periode` string alphabetically/chronologically". For the known period format "BJ2 Fase 1 DD" / "BJ2 Fase 2 DD" this is correct. For arbitrary period strings it may not be.

**How to avoid:** This is acceptable per D-07's explicit decision. Document in comments that the sort assumes `periode` strings are comparable in alphabetical order. The CIOS data format makes this safe.

**Warning signs:** Would only appear if a school uses non-sequential period strings like "Periode 9" and "Periode 10" in the same class.

### Pitfall 4: mergeVerzuim matches on first record per leerlingId

**What goes wrong:** `mergeVerzuim` searches `window.appState.students` with `.find()` returning the first match. After the dedup change, two records for the same `leerlingId` exist. Verzuim gets merged into the first one (possibly Fase 1) instead of the most-recent one.

**Why it happens:** `mergeVerzuim` is unchanged in this phase. It was written for single-record-per-student.

**How to avoid:** Verzuim is on the StudentRecord level. Since `berekenStatus` operates on the most-recent record (which may not have verzuim if Excel was imported before Fase 2), the planner must ensure the detail view reads verzuim from ANY record for that leerlingId (i.e., fall back to the record that has verzuim, regardless of period). This is a nuance — if verzuim data exists only on the Fase 1 record and `showDetail` passes the Fase 2 record to `buildDetailVerzuim`, the verzuim section will show "geen verzuimdata".

**Mitigation strategy:** When building detail view, merge verzuim from any record: the verzuim display should fall back to the first record with `student.verzuim` set, not necessarily the most-recent period record. OR: after `mergeVerzuim`, copy `student.verzuim` to all records for the same `leerlingId`. The planner should address this explicitly.

### Pitfall 5: detailStudentList contains duplicate leerlingIds

**What goes wrong:** `detailStudentList` is populated from `students.map(s => s.leerlingId)` at line 898. After multi-period import, this list has duplicate IDs. The prev/next navigation breaks (multiple entries for same ID).

**Why it happens:** `detailStudentList` was built for single-record-per-student.

**How to avoid:** `detailStudentList` should be built from `window.getActiveStudents()` (deduplicated), not from raw `window.appState.students`. This is already implied by the fix to `renderKlasGrid`.

---

## Code Examples

### Growth badge CSS (to add in index.html)

```css
/* Source: CONTEXT.md D-09, UI-SPEC § Growth Badge */
.growth-up   { font-size: 0.68rem; font-weight: 700; color: #16a34a; vertical-align: middle; margin-left: 2px; }
.growth-down { font-size: 0.68rem; font-weight: 700; color: #dc2626; vertical-align: middle; margin-left: 2px; }
.growth-same { font-size: 0.68rem; font-weight: 700; color: #9ca3af; vertical-align: middle; margin-left: 2px; }
```

### Two tfoot rows HTML structure (from UI-SPEC)

```html
<!-- Source: 07-UI-SPEC.md § Component 1 -->
<tfoot>
  <tr><!-- Fase 1 row -->
    <td class="cell-naam"><strong>BJ2 Fase 1 DD</strong></td>
    <td><span class="dm-chip score-v">V</span></td>
    <!-- ... one td per deelgebied -->
  </tr>
  <tr><!-- Fase 2 row (most recent) with growth badges -->
    <td class="cell-naam"><strong>BJ2 Fase 2 DD</strong></td>
    <td>
      <span class="dm-chip score-g">G</span>
      <span class="growth-up" aria-label="gestegen">↑</span>
    </td>
    <!-- ... one td per deelgebied -->
  </tr>
</tfoot>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single record per student (overwrite on re-import) | Multiple records per student, one per periode | Phase 7 (D-02/D-03) | addStudent dedup key must include periode |
| getActiveStudents returns raw klas.students | getActiveStudents returns most-recent record per leerlingId | Phase 7 (D-11) | renderKlasGrid and detailStudentList must use getActiveStudents |
| buildDetailDeelgebieden single tfoot row | Two tfoot rows when two periods exist | Phase 7 (D-06) | buildDetailDeelgebieden self-looks up all records for leerlingId |

---

## Open Questions

1. **Verzuim on most-recent vs. any record**
   - What we know: `mergeVerzuim` patches `student.verzuim` onto the first matching record in `appState.students`. After multi-period import, the first match may be Fase 1, not Fase 2.
   - What's unclear: Should `buildDetailVerzuim` receive the most-recent record (which may lack verzuim) or should verzuim be propagated to all records for a `leerlingId`?
   - Recommendation: In the plan, add a task to either (a) copy verzuim from any record to all records for same `leerlingId` after `mergeVerzuim`, or (b) have `buildDetailVerzuim` search all records for that `leerlingId` for a verzuim object. Option (b) is safer and requires no data mutation.

2. **deelgebiedScores key format consistency across periods**
   - What we know: The existing parser populates `deelgebiedScores` with label keys (`"V&A"`, `"M&M"`, etc.). This is confirmed by app.js line 1192.
   - What's unclear: Whether Fase 2 PDFs from the same school will always use identical column headers. If a PDF uses a different abbreviation, the growth comparison finds no match.
   - Recommendation: This is a data quality question, not a code question. The plan should include a verification step: after importing both periods, inspect `student.deelgebiedScores` keys to confirm they match across periods.

---

## Environment Availability

Step 2.6: SKIPPED — this phase has no external dependencies. All changes are code/CSS/HTML in existing files. No CLI tools, runtimes, databases, or external services are required beyond what already runs (a browser + the static file server started by `start.bat`).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — no automated test runner in this project |
| Config file | None |
| Quick run command | Open `index.html` in browser; manual verification |
| Full suite command | Manual UAT checklist (pattern from Phase 6 `06-HUMAN-UAT.md`) |

This project has no automated test infrastructure (confirmed by directory scan: no `jest.config.*`, `vitest.config.*`, `pytest.ini`, `test/` directory, or `package.json`). All validation is manual browser UAT.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMP-01 | Import Fase 1 PDFs, then Fase 2 PDFs — both sets visible in klas, no overwrite | manual | — | N/A |
| CMP-01 | Re-importing same Fase 1 PDF overwrites that period's record (not Fase 2) | manual | — | N/A |
| CMP-02 | Detail view shows two tfoot rows when two periods exist | manual | — | N/A |
| CMP-02 | Detail view shows one tfoot row when only one period exists | manual | — | N/A |
| CMP-03 | Growth badge ↑ appears for improved scores in Fase 2 tfoot row | manual | — | N/A |
| CMP-03 | Growth badge ↓ appears for declined scores | manual | — | N/A |
| CMP-03 | Growth badge = appears for unchanged scores | manual | — | N/A |
| CMP-03 | No badge shown when Fase 1 score is null for that deelgebied | manual | — | N/A |
| CMP-04 | Klasoverzicht tile color reflects most-recent period scores | manual | — | N/A |
| CMP-04 | Doorstroomprognose in detail view reflects most-recent period | manual | — | N/A |

### Sampling Rate

- **Per task commit:** Visual spot-check in browser (import PDFs, verify specific behaviors)
- **Per wave merge:** Full manual UAT run
- **Phase gate:** All CMP-01..04 UAT items green before `/gsd:verify-work`

### Wave 0 Gaps

None — no test infrastructure to create. Validation is manual UAT per project pattern.

---

## Sources

### Primary (HIGH confidence)

- `/d/Downloads/dashboard-2/utils/datamodel.js` — `addStudent()` current implementation (lines 58-65), `StudentRecord` typedef, `mergeVerzuim` matching strategy
- `/d/Downloads/dashboard-2/utils/klassen.js` — `getActiveStudents()` current implementation (lines 167-174), `switchActiveKlas` bridge pattern, `saveKlassen`/`loadKlassen` (confirms D-04: no serialization change needed)
- `/d/Downloads/dashboard-2/app.js` — `berekenStatus()` (lines 799-817), `renderKlasGrid()` (lines 854-912), `showDetail()` (lines 1035-1046), `buildDetailDeelgebieden()` (lines 1149-1210), `buildDetailHeader()` (lines 1064-1077), `SCORE_CHIP_MAP` (lines 1014-1019)
- `/d/Downloads/dashboard-2/utils/schema.js` — `SCORE_LEVELS` array ordering (line 3), `DEELGEBIEDEN` array with id/label/group (lines 8-28)
- `/d/Downloads/dashboard-2/index.html` — existing `.dm-chip`, `.score-*`, `.dg-matrix tfoot td` CSS (lines 416-432)
- `.planning/phases/07-periode-vergelijking/07-CONTEXT.md` — all locked decisions D-01 through D-12
- `.planning/phases/07-periode-vergelijking/07-UI-SPEC.md` — growth badge CSS values, tfoot HTML structure, component inventory

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` — Phase 6 decisions (bridge pattern, storage key, renderKlasGrid introduction)
- `.planning/REQUIREMENTS.md` — CMP-01..04 acceptance criteria

### Tertiary (LOW confidence)

None.

---

## Metadata

**Confidence breakdown:**
- Data model change: HIGH — code read, one-line predicate change confirmed
- getActiveStudents dedup: HIGH — current code read, dedup logic is straightforward
- buildDetailDeelgebieden two-row tfoot: HIGH — existing function fully read, extension pattern clear
- Growth badge CSS: HIGH — exact values in CONTEXT.md D-09 and UI-SPEC
- Verzuim propagation edge case: MEDIUM — identified as open question, mitigation path clear
- renderKlasGrid duplicate-tile pitfall: HIGH — confirmed by direct code inspection

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable codebase — no external dependencies)
