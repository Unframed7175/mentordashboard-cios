# Phase 6: Multi-class UI - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 delivers multi-class management: mentor can create named classes (CSD2A, CSD2B…), switch between them via tabs, each with isolated student/verzuim data, and the klasoverzicht is replaced by a tile grid. Data persists across browser sessions per class.

The leerlijn-toewijzing (deelgebied→leerlijn mapping) remains shared across classes.
The existing Import and Overzicht navigation structure is preserved but sits below a new class-tab row.
</domain>

<decisions>
## Implementation Decisions

### Tab Layout
- **D-01:** Class tabs appear in a **separate row above** the existing Import/Overzicht navigation bar. Hierarchy: class-tabs row → view-tabs row (Import / Klasoverzicht).
- **D-02:** Tab strip: `[ CSD2A ] [ CSD2B ] [ + ]` — active class highlighted, "+" button rightmost to create new class.

### New Class Creation
- **D-03:** "+" button opens a **small modal** with a single text input for the class name. Buttons: "Annuleren" + "Aanmaken". Enter key submits. New class tab appears immediately after creation.
- **D-04:** Class names are **free text** (no predefined list). Mentor types whatever name fits: "CSD2A", "Klas B", etc.

### Starting State
- **D-05:** App starts with **no classes** on first load. A clear prompt invites the mentor to create the first class: "Maak een klas aan om te beginnen." No default class is pre-created.
- **D-06:** After creating the first class, the app immediately switches to that class and shows the import UI.

### Data Isolation
- **D-07:** Each class has **fully isolated** student data, verzuim data, and notes (localStorage).
- **D-08:** The **leerlijn-toewijzing** (deelgebied→leerlijn mapping via `mentordashboard_leerlijnen_v1`) is **shared across all classes** — CIOS norms are the same for all classes; no need to re-configure per class.
- **D-09:** Class deletion (via bevestigingsdialoog) wipes all class-specific localStorage data for that class and removes the tab.

### Klasoverzicht: Tile Grid (replaces table)
- **D-10:** The existing `#klas-tabel` tabel is **replaced** by a tile/card grid. No table fallback.
- **D-11:** Grid layout: **3–4 tiles per row** (CSS grid, responsive). All 19 students fit in ~5–6 rows on a laptop screen.
- **D-12:** Each tile shows:
  - Student naam (prominent)
  - RAG achtergrondkleur of gekleurde rand (rood/oranje/groen) based on prognose + verzuim signaal
  - Prognose badge (small pill): "Positief", "Risico", or "Negatief"
  - Verzuim mini-statusbar: compact version of the existing stacked bar (aanwezigheid / geoorloofd / ongeoorloofd proportions), same color coding as the detail view verzuim bar
- **D-13:** Clicking a tile opens the detail view for that student (same behavior as clicking a row in v1.0 table).
- **D-14:** Sorting and search (KLO-04, KLO-05) must still work — either as controls above the tile grid, or as filter/sort chips.

### Claude's Discretion
- Exact localStorage key scheme for multi-class data (e.g., `mentordashboard_klas_CSD2A_v1` per class vs one root key `mentordashboard_klassen_v1` with nested structure) — planner decides.
- Whether `window.appState` grows a `classes` map vs `activeClass` string + per-class loaders — planner decides.
- Tile hover state and animation — keep consistent with existing button/card styles.
- Sort/search placement above the tile grid — planner decides exact UI placement.
- Class tab rename UX (double-click to rename? edit button?) — Claude's discretion if needed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing State Management
- `utils/datamodel.js` — `window.appState`, `saveState()`, `loadState()`, `clearState()`, `STORAGE_KEY = 'mentordashboard_v1'`
- `utils/leerlijnen.js` — `getLeerlijnenMapping()`, `saveLeerlijnenMapping()`, `resetLeerlijnenMapping()`, `STORAGE_KEY = 'mentordashboard_leerlijnen_v1'` (stays shared — do NOT namespace per class)

### Existing View System
- `app.js` lines ~520–570 — `showView('import'|'klas'|'detail')`, `navImport`, `navOverzicht` click handlers
- `index.html` lines ~642–660 — `#main-nav`, `.nav-tab`, `#nav-import`, `#nav-overzicht`

### Existing Klasoverzicht (to be replaced)
- `app.js` — `renderKlasoverzicht()` function and `#klas-tabel` — THIS IS REPLACED by tile grid in phase 6
- `index.html` — `#klas-tabel`, `.klas-table-wrap` — HTML to be replaced or repurposed

### Existing Verzuim Statusbar (to be reused in tile)
- `app.js` — `buildDetailVerzuim()` and associated stacked bar rendering — the mini-statusbar on tiles should reuse the same color scheme and proportions

### Requirements
- `.planning/REQUIREMENTS.md` §KLS-01..KLS-06 — full acceptance criteria for this phase

### V1.0 Decisions (inherited)
- `.planning/milestones/v1.0-ROADMAP.md` — architecture decisions: window.* globals, no build step, classic scripts + ESM for pdf.js only

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `window.saveState()` / `window.loadState()` / `window.clearState()` (datamodel.js) — extend or wrap for per-class namespacing; do not break the existing function signatures (other code calls them)
- `.nav-tab` CSS class + active state — reuse for class-tab strip styling
- Verzuim stacked bar color scheme from `buildDetailVerzuim()` — reuse for tile mini-bar
- `showView()` function — extend to handle class switching without breaking existing view logic

### Established Patterns
- `window.*` globals for all utility functions — new class management functions must follow this pattern
- Classic `<script>` for new utils (not ES module) — consistent with schema.js, datamodel.js, leerlijnen.js
- Dutch error messages and labels throughout — maintain language consistency

### Integration Points
- `app.js` `importPDFs()` and `importExcel()` — must target the active class's data, not the global `appState.students`
- `renderKlasoverzicht()` — replace entirely with `renderKlasGrid()` or similar tile renderer
- `app.js` detail view (`renderDetailView()`) — no change needed; it reads from the active class's students

</code_context>

<specifics>
## Specific Ideas

- **Tile mini-statusbar**: Same visual language as `buildDetailVerzuim()` stacked bar — proportional horizontal bar with green (aanwezigheid) / yellow (geoorloofd) / red (ongeoorloofd) segments. Width relative to total hours.
- **Class tab overflow**: If many classes are created, tabs should scroll horizontally (CSS `overflow-x: auto` on the tab strip) rather than wrapping.
- **Bevestigingsdialoog voor verwijderen**: Simple browser `confirm()` or small inline confirmation — "Klas 'CSD2A' en alle data verwijderen?" with Ja/Nee. No custom modal needed.

</specifics>

<deferred>
## Deferred Ideas

- Side-by-side class comparison (klasoverzicht van twee klassen naast elkaar) — Future v2+, noted in REQUIREMENTS.md
- Rename class UI (double-click on tab) — not in KLS requirements; defer if not naturally falling out of implementation

</deferred>

---

*Phase: 06-multi-class-ui*
*Context gathered: 2026-03-25*
