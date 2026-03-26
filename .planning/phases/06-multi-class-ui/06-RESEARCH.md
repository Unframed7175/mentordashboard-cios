# Phase 6: Multi-class UI — Research

**Researched:** 2026-03-26
**Domain:** Browser-only SPA state management, localStorage multi-tenancy, vanilla JS UI patterns
**Confidence:** HIGH (all findings based on direct source-code inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Class tabs in a **separate row above** existing Import/Klasoverzicht nav. Hierarchy: class-tabs row → view-tabs row.
- **D-02:** Tab strip: `[ CSD2A ] [ CSD2B ] [ + ]` — active highlighted, "+" rightmost.
- **D-03:** "+" opens a **small modal** with a text input. Buttons: "Annuleren" + "Aanmaken". Enter submits. New tab appears immediately.
- **D-04:** Class names are **free text** (no predefined list).
- **D-05:** App starts with **no classes** on first load. Prompt: "Maak een klas aan om te beginnen."
- **D-06:** After creating first class, switches immediately to that class and shows import UI.
- **D-07:** Each class has **fully isolated** student data, verzuim data, and notes.
- **D-08:** Leerlijn-toewijzing (`mentordashboard_leerlijnen_v1`) stays **shared** — do NOT namespace per class.
- **D-09:** Class deletion wipes all class-specific localStorage data and removes the tab (browser `confirm()` dialog).
- **D-10:** `#klas-tabel` table is **replaced** by a tile/card grid. No table fallback.
- **D-11:** Grid: `repeat(auto-fill, minmax(200px, 1fr))`, `gap: 16px`. 3–4 tiles per row on ~980px.
- **D-12:** Each tile shows: naam (prominent), RAG left-border, prognose badge, verzuim mini-bar.
- **D-13:** Clicking a tile opens the detail view (same as v1.0 table-row click).
- **D-14:** Sorting and search must still work — controls above tile grid.

### Claude's Discretion

- Exact localStorage key scheme (per-class key vs root key with nested structure).
- Whether `window.appState` grows a `classes` map vs `activeClass` string + per-class loaders.
- Tile hover state/animation — keep consistent with existing button/card styles.
- Sort/search placement above the tile grid — exact UI placement.
- Class tab rename UX — Claude's discretion if needed (not in KLS requirements).

### Deferred Ideas (OUT OF SCOPE)

- Side-by-side class comparison (two klassen naast elkaar) — v2+.
- Rename class UI — not in KLS requirements; defer unless naturally falling out of implementation.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KLS-01 | Mentor kan een nieuwe klas aanmaken met een naam | Modal pattern documented; `window.klassenState` + `createKlas()` design in Architecture Patterns |
| KLS-02 | Elke klas verschijnt als tabblad — schakelen wisselt actieve klas zonder dataverlies | `switchActiveKlas()` pattern; class data kept in memory map, not reloaded on switch |
| KLS-03 | Elke klas heeft eigen PDF-import, Excel-import, en leerlijn-toewijzing | `importPDFs()` and `mergeVerzuim()` must read/write active class's student array; leerlijnen stays shared |
| KLS-04 | Alle klassen en hun data worden bewaard na refresh (localStorage) | `saveKlassen()` / `loadKlassen()` design; new storage key `mentordashboard_klassen_v1` |
| KLS-05 | Mentor kan een klas verwijderen met bevestigingsdialoog | `deleteKlas()` pattern; browser `confirm()`; localStorage key removal |
| KLS-06 | De actieve klas wordt onthouden na refresh | `activeKlasId` persisted as part of the klassen payload |
</phase_requirements>

---

## Summary

The v1.0 app manages a single class worth of data via three mechanisms: `window.appState.students` (in-memory array), `localStorage['mentordashboard_v1']` (single-class persistence), and `localStorage['mentordashboard_notities']` (per-student notes keyed by `leerlingId`). The entire app is wired around this single-class assumption — `importPDFs()`, `mergeVerzuim()`, `renderKlasoverzicht()`, `showDetail()`, and the startup `loadState()` call all read/write `window.appState.students` directly.

Phase 6 must introduce a new data layer that wraps per-class state. The core model change is: replace the single `{ students, savedAt }` payload stored under `mentordashboard_v1` with a new `mentordashboard_klassen_v1` key that holds `{ klassen: { [id]: { naam, students } }, activeKlasId }`. In memory, `window.appState.students` must always reflect the active class — existing code that reads `window.appState.students` then requires no changes. `window.klassenState` (new) owns the classes registry and active-class bookkeeping.

The UI additions are a new `#klas-tabs` bar injected between `#site-header` and `#main-nav`, and replacement of the `#klas-tabel` table with a `#klas-grid` CSS-grid tile layout. The leerlijn-toewijzing section, the detail view, the import view, the nav-count badge, and the `berekenStatus()` / `berekenPrognose()` engine all remain untouched.

**Primary recommendation:** Introduce a new `utils/klassen.js` classic script that owns multi-class state (`window.klassenState`, `window.saveKlassen()`, `window.loadKlassen()`, `window.createKlas()`, `window.switchActiveKlas()`, `window.deleteKlas()`). Load it between `datamodel.js` and `app.js`. All mutation of `window.appState.students` in `app.js` becomes reads/writes of `window.klassenState.activeKlas.students` via the swap mechanism described below.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS | ES2020 (no build) | All logic | Project constraint — no framework, no npm |
| localStorage | Browser API | Multi-class persistence | Project constraint — no server, data stays local |
| CSS Grid | Baseline 2017 | Tile layout | `repeat(auto-fill, minmax(200px, 1fr))` per D-11 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SheetJS | 0.20.3 (CDN) | Excel parsing | Already loaded — no change needed |
| pdf.js | existing CDN | PDF parsing | Already loaded — no change needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single nested JSON key `mentordashboard_klassen_v1` | One key per class `mentordashboard_klas_{id}_v1` | Per-key approach: simpler delete (one `removeItem`), but harder to enumerate all classes and restore `activeKlasId`. Single nested key: one `setItem`/`getItem`, all class data co-located. Recommended: single nested key. |
| Pure `window.appState` augmentation | New `window.klassenState` | Augmenting existing state risks breaking existing `loadState()` / `saveState()` callers. New sibling object isolates the concern cleanly. |

**Installation:** No new libraries. No `npm install`.

---

## Architecture Patterns

### Recommended Project Structure

```
utils/
├── schema.js           (unchanged)
├── datamodel.js        (unchanged — window.appState, saveState/loadState still work for active class)
├── leerlijnen.js       (unchanged — shared across all classes, D-08)
├── klassen.js          (NEW — multi-class registry and switching)
└── prognosis.js        (unchanged)
parsers/
├── pdf.js              (unchanged)
└── excel.js            (unchanged)
app.js                  (patched — importPDFs, mergeVerzuim, startup, renderKlasoverzicht replaced)
index.html              (patched — #klas-tabs strip, #klas-grid, modal, script tag for klassen.js)
```

### Pattern 1: Window-global class registry (utils/klassen.js)

**What:** A new classic `<script>` that exposes `window.klassenState` and CRUD functions.
**When to use:** All class lifecycle operations (create, switch, delete, persist, restore).

```javascript
// Source: direct analysis of datamodel.js / leerlijnen.js patterns
var KLASSEN_KEY = 'mentordashboard_klassen_v1';

window.klassenState = {
  klassen: {},          // { [klasId]: { id, naam, students, lastSaved } }
  activeKlasId: null,
};

window.createKlas = function(naam) { /* ... */ };
window.switchActiveKlas = function(klasId) { /* ... */ };
window.deleteKlas = function(klasId) { /* ... */ };
window.saveKlassen = function() { /* ... */ };
window.loadKlassen = function() { /* returns true if restored */ };
window.getActiveStudents = function() {
  var k = window.klassenState.klassen[window.klassenState.activeKlasId];
  return k ? k.students : [];
};
```

### Pattern 2: appState bridge — keep existing callers working

**What:** After every `switchActiveKlas()`, `window.appState.students` is set to the new active class's student array. This means all existing code (`renderKlasoverzicht`, `berekenStatus`, `showDetail`, `addStudent`, `mergeVerzuim`, `saveState`) continues to work without modification.
**When to use:** Every `switchActiveKlas()` call.

```javascript
window.switchActiveKlas = function(klasId) {
  if (!window.klassenState.klassen[klasId]) return false;
  window.klassenState.activeKlasId = klasId;
  // Bridge: existing callers read window.appState.students
  window.appState.students = window.klassenState.klassen[klasId].students;
  window.saveKlassen();
  return true;
};
```

**Critical:** `window.appState.students` and `window.klassenState.klassen[activeId].students` must point to the **same array reference** after the switch. Mutations via `window.addStudent()` or `window.mergeVerzuim()` then automatically update the active class's data.

### Pattern 3: saveState bridge — dual-write during transition

**What:** The existing `window.saveState()` writes to `mentordashboard_v1`. In Phase 6, `autoSave()` in app.js must call `window.saveKlassen()` instead of (or in addition to) `window.saveState()`. `window.saveState()` itself does not need to change — it will keep writing the active-class students to `mentordashboard_v1`, which will be ignored on startup once `loadKlassen()` returns true.
**When to use:** Replace all `window._afterPDFImport = autoSave` references to call `saveKlassen` in addition.

```javascript
function autoSave() {
  window.saveKlassen();   // Phase 6: authoritative save
  window.saveState();     // Keep for backward compat — harmless redundancy
  updateNavCount();
  // ... rest unchanged
}
```

### Pattern 4: Startup sequence

**What:** On page load, try `loadKlassen()` first. If it returns data, restore the active class and switch into `klas` view. If not, show the empty-state prompt.
**When to use:** Replaces the current `if (window.loadState && window.loadState()) { showView('klas'); }` block.

```javascript
// At end of DOMContentLoaded (app.js)
if (window.loadKlassen && window.loadKlassen()) {
  renderKlasTabStrip();
  updateNavCount();
  if (ltSection && window.appState.students.length > 0) {
    ltSection.style.display = 'block';
    renderLeerlijntoewijzing();
  }
  showView(window.appState.students.length > 0 ? 'klas' : 'import');
} else {
  showEmptyKlassenState();
}
```

### Pattern 5: Tile grid replacing table

**What:** `renderKlasoverzicht()` is rewritten as `renderKlasGrid()`. The `#klas-tabel` element (and `.klas-table-wrap`) is replaced by `<div id="klas-grid">`. All sort/search logic is preserved, just the output HTML changes from `<tr>` to `.klas-tile` cards.
**When to use:** Whenever `renderKlasGrid()` is called (same trigger points as the old `renderKlasoverzicht()`).

```javascript
function renderKlasGrid() {
  // Same sort/filter/search logic as v1.0
  // Output: div.klas-tile per student with:
  //   - border-left: 3px solid {RAG color}
  //   - .status-badge pill
  //   - .mini-verzuim-bar  (reuse buildMiniVerzuimBar() unchanged)
}
```

### Pattern 6: Class tab strip

**What:** A new `<div id="klas-tabs">` is inserted in index.html between `#site-header` and `#main-nav`. It is rendered dynamically by `renderKlasTabStrip()` in app.js (or a new `klassen-ui.js`).
**When to use:** On every class create, switch, delete, and on startup restore.

```javascript
function renderKlasTabStrip() {
  const strip = document.getElementById('klas-tabs');
  strip.innerHTML = '';
  Object.values(window.klassenState.klassen).forEach(klas => {
    const btn = document.createElement('button');
    btn.className = 'nav-tab' + (klas.id === window.klassenState.activeKlasId ? ' active' : '');
    btn.textContent = klas.naam;
    btn.addEventListener('click', () => {
      window.switchActiveKlas(klas.id);
      renderKlasTabStrip();
      updateNavCount();
      showView('klas');
    });
    strip.appendChild(btn);
  });
  // "+" button
  const addBtn = document.createElement('button');
  addBtn.className = 'nav-tab';
  addBtn.style.color = '#3b82f6';
  addBtn.textContent = '+';
  addBtn.title = 'Nieuwe klas aanmaken';
  addBtn.addEventListener('click', openNieuweKlasModal);
  strip.appendChild(addBtn);
}
```

### Anti-Patterns to Avoid

- **Do not namespace `mentordashboard_leerlijnen_v1`** — D-08 locks this as shared. Never write `mentordashboard_leerlijnen_klas_X_v1`.
- **Do not mutate `window.appState.students` directly in class management code** — always go through `window.switchActiveKlas()` which sets the reference atomically.
- **Do not use `window.clearState()` for class deletion** — it wipes `mentordashboard_v1` and resets `window.appState.students`, but it does not touch the multi-class key. Implement `window.deleteKlas()` that removes the class from `window.klassenState.klassen` and calls `window.saveKlassen()`.
- **Do not re-render `renderLeerlijntoewijzing()` on class switch** — leerlijn mapping is shared; it does not need to change per class.
- **Do not store tile DOM nodes** — always re-render `renderKlasGrid()` on switch; student arrays may differ.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Class ID generation | UUID library or complex hash | `Date.now().toString(36)` or incrementing counter | IDs never need to be globally unique — local to one browser; simple timestamp string is collision-proof for one user |
| Modal focus trap | Custom focus management | Simple `input.focus()` on modal open + Enter/Escape keydown listener | This is a single-input modal; a full focus-trap library is overkill |
| Tile grid virtualization | Custom virtual scroll | None — CSS grid with 19 tiles is never a performance problem | 19 students = 19 DOM nodes; no virtualization needed |
| Name deduplication on class creation | Fuzzy match | Exact case-insensitive string comparison | Class names are short, user-typed labels; exact match is sufficient |

**Key insight:** All hard problems (PDF parsing, verzuim matching, prognosis calculation) are already solved. Phase 6 is state-routing plumbing + UI scaffolding.

---

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `mentordashboard_v1` — single-class students array. `mentordashboard_notities` — notes keyed by `leerlingId`. `mentordashboard_leerlijnen_v1` — deelgebied mapping. | `mentordashboard_v1`: existing data must be migrated on first load — see Migration section below. Notes: `leerlingId` is unique per student, so notes survive migration without re-keying. Leerlijnen: untouched. |
| Live service config | None — browser-only app, no external services | None |
| OS-registered state | None — no background tasks, no service workers | None |
| Secrets/env vars | None — no API keys, no .env | None |
| Build artifacts | None — no build step, no compiled output | None |

### Migration: `mentordashboard_v1` → `mentordashboard_klassen_v1`

Existing users (v1.0) have data in `mentordashboard_v1` and no data in `mentordashboard_klassen_v1`. On first load after Phase 6 ships, `loadKlassen()` will return false (no `mentordashboard_klassen_v1` key exists). This means:

- **Risk:** Existing mentor's students disappear on first load — they see the empty-state prompt.
- **Recommended mitigation:** In `loadKlassen()`, after the new key returns nothing, check if `mentordashboard_v1` has data. If so, auto-migrate: create one class named "Klas 1" (or read from the students' `leerjaar`/`periode` field if a class name can be inferred), populate it with the old students array, write to `mentordashboard_klassen_v1`, and remove `mentordashboard_v1`. Log a console message: `[klassen.js] Migratie van v1 naar multi-klas uitgevoerd.`
- **Notes data:** `mentordashboard_notities` keys are `leerlingId` strings. These are stable across migration since leerlingIds come from the PDF and are not changed by the migration. No notes migration is needed.
- **Leerlijnen data:** `mentordashboard_leerlijnen_v1` is shared and untouched. No migration needed.

Migration is a code path, not a data transformation job. A single function in `utils/klassen.js` handles it.

---

## Common Pitfalls

### Pitfall 1: Array reference aliasing breaks after class switch

**What goes wrong:** `window.appState.students = window.klassenState.klassen[id].students` sets a reference. If code later does `window.appState.students = []` (e.g., the existing `window.clearState()` call), the link is broken — the class data in `klassenState` is orphaned.
**Why it happens:** JS assignment replaces the reference in `appState` but the `klassenState` object still holds the old array.
**How to avoid:** Never call `window.clearState()` for multi-class delete. Implement `window.deleteKlas()` that operates on `klassenState` directly. Add a guard comment to `clearState()`: "v1.0 only — in Phase 6+ use deleteKlas()".
**Warning signs:** After clearing and re-importing, the students appear in appState but are lost after the next `saveKlassen()` call.

### Pitfall 2: `addStudent()` writes to the wrong class

**What goes wrong:** `window.addStudent()` in datamodel.js pushes to `window.appState.students`. If `switchActiveKlas()` does not correctly alias the reference, imported students land in the wrong array (or a dangling array).
**Why it happens:** The alias must be established before `importPDFs()` is called, not after.
**How to avoid:** Ensure `renderKlasTabStrip` and every tab-click calls `switchActiveKlas()` synchronously before any import action is possible. The import UI should be unreachable if no class is active.

### Pitfall 3: `mergeVerzuim()` searches global `window.appState.students`

**What goes wrong:** `mergeVerzuim()` (datamodel.js line 126) directly searches `window.appState.students`. If the bridge is intact this is fine. But if any code has re-assigned `window.appState.students` to a different object (e.g., a fresh `[]` for a new class without running through `switchActiveKlas`), verzuim records from one class can match against another class's students.
**Why it happens:** The merge function is stateless — it always searches whatever is in `window.appState.students` at call time.
**How to avoid:** The bridge pattern (Pattern 2) is the fix. Never set `window.appState.students` directly except in `switchActiveKlas()` and the startup migration.

### Pitfall 4: `wisDataBtn` ("Wis alle data") still calls `window.clearState()`

**What goes wrong:** The existing `#wis-data-btn` handler calls `window.clearState()` which wipes `mentordashboard_v1` and `window.appState.students = []`. In Phase 6 this orphans the active class's data in `klassenState`.
**Why it happens:** The button was designed for single-class use.
**How to avoid:** Replace the button's click handler to call `window.deleteKlas(window.klassenState.activeKlasId)` (with the confirm dialog). The `#wis-data-btn` button text can be repurposed to "Klas verwijderen" per D-09, or kept with updated logic. The old `window.clearState()` call must be removed from this handler in Phase 6.

### Pitfall 5: navCount badge shows student count for active class only

**What goes wrong:** `updateNavCount()` reads `window.appState.students.length` which is the active class. After Phase 6, a mentor might expect the count to show total students across all classes.
**Why it happens:** No change needed — this is actually correct behavior. The nav-count shows the active class's student count, which is what a tab-based UI implies.
**How to avoid:** Not a bug — document expected behavior. The badge is scoped to the active class.

### Pitfall 6: `detailStudentList` navigates within the active class only

**What goes wrong:** `detailStudentList` in app.js holds `leerlingId` values for prev/next navigation. On class switch, this list must be invalidated.
**Why it happens:** `detailStudentList` is set during `renderKlasoverzicht()` (now `renderKlasGrid()`). If a user switches class while in the detail view, the list is stale.
**How to avoid:** In `switchActiveKlas()`, call `showView('klas')` immediately (never leave the detail view open across a class switch). This forces `renderKlasGrid()` to rebuild `detailStudentList` for the new class.

### Pitfall 7: New class modal submitted with duplicate name

**What goes wrong:** Mentor creates "CSD2A" twice. Two classes exist with the same name but different IDs.
**Why it happens:** D-04 allows free-text names with no uniqueness constraint.
**How to avoid:** On submit, check if any existing class name matches (case-insensitive). If so, show inline validation: "Er bestaat al een klas met de naam 'CSD2A'." This is a UX guard, not a hard constraint — if the mentor wants two identically-named classes they can, but the warning prevents accidents.

---

## Code Examples

### saveKlassen / loadKlassen (utils/klassen.js)

```javascript
// Source: direct analysis of datamodel.js saveState/loadState pattern
var KLASSEN_KEY = 'mentordashboard_klassen_v1';

window.saveKlassen = function() {
  try {
    var payload = {
      klassen: window.klassenState.klassen,
      activeKlasId: window.klassenState.activeKlasId,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(KLASSEN_KEY, JSON.stringify(payload));
    return true;
  } catch(e) {
    console.warn('[klassen.js] saveKlassen mislukt:', e.message);
    return false;
  }
};

window.loadKlassen = function() {
  try {
    var raw = localStorage.getItem(KLASSEN_KEY);
    if (!raw) {
      // Migration check: does v1.0 data exist?
      return window._migrateV1ToKlassen();
    }
    var data = JSON.parse(raw);
    if (data.klassen && typeof data.klassen === 'object') {
      window.klassenState.klassen = data.klassen;
      window.klassenState.activeKlasId = data.activeKlasId || null;
      if (window.klassenState.activeKlasId) {
        // Restore bridge
        window.appState.students =
          window.klassenState.klassen[window.klassenState.activeKlasId].students || [];
      }
      return Object.keys(data.klassen).length > 0;
    }
    return false;
  } catch(e) {
    console.warn('[klassen.js] loadKlassen mislukt:', e.message);
    return false;
  }
};
```

### Migration helper

```javascript
// Source: analysis of mentordashboard_v1 structure in datamodel.js
window._migrateV1ToKlassen = function() {
  try {
    var raw = localStorage.getItem('mentordashboard_v1');
    if (!raw) return false;
    var data = JSON.parse(raw);
    if (!data.students || !data.students.length) return false;

    var id = 'klas_' + Date.now().toString(36);
    var klas = { id: id, naam: 'Klas 1', students: data.students };
    window.klassenState.klassen[id] = klas;
    window.klassenState.activeKlasId = id;
    window.appState.students = klas.students;
    window.saveKlassen();
    localStorage.removeItem('mentordashboard_v1');
    console.log('[klassen.js] Migratie van v1 naar multi-klas uitgevoerd (' + data.students.length + ' leerlingen → Klas 1)');
    return true;
  } catch(e) {
    console.warn('[klassen.js] Migratie mislukt:', e.message);
    return false;
  }
};
```

### Tile HTML (inside renderKlasGrid)

```javascript
// Source: analysis of buildMiniVerzuimBar() and berekenStatus() in app.js
// RAG colors from 06-UI-SPEC.md
var RAG_BORDER = { groen: '#22c55e', oranje: '#f97316', rood: '#ef4444', grijs: '#d1d5db', blauw: '#3b82f6' };

function buildKlasTile(student, status) {
  var borderColor = RAG_BORDER[status.kleur] || RAG_BORDER.grijs;
  var badgeClass  = 'status-' + status.kleur;  // reuses existing CSS
  var miniBar     = buildMiniVerzuimBar(student);
  return '<div class="klas-tile" data-id="' + escapeHtml(student.leerlingId) + '"'
    + ' style="border-left: 3px solid ' + borderColor + ';">'
    + '<div class="klas-tile-naam">' + escapeHtml(student.naam) + '</div>'
    + '<span class="status-badge ' + badgeClass + '">' + escapeHtml(status.label) + '</span>'
    + '<div class="klas-tile-verzuim">' + miniBar + '</div>'
    + '</div>';
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single class in `mentordashboard_v1` | Per-class data in `mentordashboard_klassen_v1` | Phase 6 | Requires startup migration for existing users |
| Table (`#klas-tabel`, `<tr>` rows) | CSS grid tile (`#klas-grid`, `.klas-tile` cards) | Phase 6 | `renderKlasoverzicht()` fully replaced; `klasTbody` reference removed |
| No class concept in `window.appState` | Active class tracked in `window.klassenState.activeKlasId` | Phase 6 | Bridge keeps all existing `window.appState.students` callers intact |

**Deprecated/outdated after Phase 6:**
- `#klas-tabel`, `#klas-tbody`, `.klas-table-wrap` HTML elements: replaced by `#klas-grid`.
- `window.clearState()` as the "delete everything" action: scoped to v1.0; Phase 6 uses `window.deleteKlas()`.
- `mentordashboard_v1` localStorage key: migrated away on first load; can be removed after migration.

---

## Open Questions

1. **`wis-data-btn` replacement or repurpose?**
   - What we know: The button currently says "Wis alle data" and calls `clearState()`. Phase 6 maps this to "Klas verwijderen" (D-09).
   - What's unclear: Should the existing button be retargeted, or should it be removed and a new button added? The UI-SPEC places "Klas verwijderen" in the `.klas-footer` which is where `#wis-data-btn` currently lives.
   - Recommendation: Retarget the existing button — change its `textContent` to "Klas verwijderen", add `.btn-danger`, update the click handler to call `window.deleteKlas()`. Remove the `window.clearState()` call from it.

2. **`mentordashboard_notities` scoping**
   - What we know: Notes are stored as `{ [leerlingId]: text }` under a single key not namespaced to any class. `leerlingId` values come from PDF parsing and are unique student numbers.
   - What's unclear: If two different classes (e.g., "Klas A" and "Klas B") happen to have a student with the same `leerlingId`, their notes would be shared. This seems unlikely (leerlingIds are national student numbers) but not impossible.
   - Recommendation: Leave notes un-namespaced for Phase 6. The risk is negligible for a single-mentor, local tool. If needed in a future phase, the key format can be extended to `{klasId}:{leerlingId}`.

3. **Leerlijn-toewijzing visibility per class**
   - What we know: The leerlijn-toewijzing section is shown/hidden based on `window.appState.students.length > 0`. On class switch, if the new class has no students, it would be hidden.
   - What's unclear: Should `renderLeerlijntoewijzing()` be re-called on class switch? The mapping is shared, so the table content is the same — but the visibility toggle depends on student count.
   - Recommendation: On `switchActiveKlas()`, call `updateNavCount()` and re-evaluate `ltSection` visibility based on the new active class's student count. Do not call `renderLeerlijntoewijzing()` again — the content is unchanged.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is a browser-only SPA with no external tool dependencies beyond those already loaded (SheetJS CDN, pdf.js CDN). No new CLIs, runtimes, or services are introduced.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test runner config found in the project |
| Config file | None |
| Quick run command | Open `index.html` in browser, follow manual test script |
| Full suite command | Same — browser manual testing |

The project has no automated test infrastructure. All validation is browser-manual. This is consistent with the no-build-step constraint.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KLS-01 | Create class via modal, tab appears | manual | — | N/A |
| KLS-02 | Tab click switches active class, data isolated | manual | — | N/A |
| KLS-03 | PDF + Excel import scoped to active class | manual | — | N/A |
| KLS-04 | Refresh restores all classes + active class | manual | — | N/A |
| KLS-05 | Delete class removes tab + data from localStorage | manual | — | N/A |
| KLS-06 | Active class remembered after refresh | manual | — | N/A |

### Sampling Rate

- **Per task:** Browser open → manual check of the scenario described in the task
- **Per wave merge:** Full manual regression: create two classes, import into each, switch, refresh, delete one, verify other is unaffected
- **Phase gate:** All KLS-01..KLS-06 success criteria from ROADMAP.md verified before `/gsd:verify-work`

### Wave 0 Gaps

None — no automated test infrastructure is expected. Manual testing covers all requirements.

---

## Sources

### Primary (HIGH confidence)

All findings derived from direct source code inspection:

- `D:/Downloads/dashboard-2/utils/datamodel.js` — `window.appState`, `window.saveState()`, `window.loadState()`, `window.clearState()`, `STORAGE_KEY = 'mentordashboard_v1'`, `window.addStudent()`, `window.mergeVerzuim()`
- `D:/Downloads/dashboard-2/utils/leerlijnen.js` — `STORAGE_KEY = 'mentordashboard_leerlijnen_v1'`, shared mapping, no per-class namespacing
- `D:/Downloads/dashboard-2/app.js` — `showView()`, `importPDFs()`, `renderKlasoverzicht()`, `buildMiniVerzuimBar()`, `berekenStatus()`, `autoSave()`, `window._afterPDFImport`, startup `loadState()` call, `wisDataBtn` handler, `detailStudentList`, `NOTITIES_KEY`
- `D:/Downloads/dashboard-2/index.html` — `#site-header`, `#main-nav`, `.nav-tab`, `#klas-tabel`, `#klas-tbody`, `#klasoverzicht-view`, `#klas-leeg`, `#wis-data-btn`, script loading order
- `D:/Downloads/dashboard-2/.planning/phases/06-multi-class-ui/06-CONTEXT.md` — all locked decisions D-01..D-14
- `D:/Downloads/dashboard-2/.planning/phases/06-multi-class-ui/06-UI-SPEC.md` — component inventory, colors, spacing, copywriting contract

### Secondary (MEDIUM confidence)

- `D:/Downloads/dashboard-2/.planning/REQUIREMENTS.md` — KLS-01..KLS-06 acceptance criteria
- `D:/Downloads/dashboard-2/.planning/ROADMAP.md` — Phase 6 success criteria

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; no new dependencies needed
- Architecture: HIGH — data model fully read from source; patterns derived from existing code structure
- Pitfalls: HIGH — all pitfalls identified from direct code inspection of affected call sites
- Migration: HIGH — `mentordashboard_v1` structure read from source; migration path is straightforward

**Research date:** 2026-03-26
**Valid until:** 2026-05-01 (stable codebase; no external dependencies to drift)
