# Phase 29: UI Streamlining & Bugfixes - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the dashboard's visual consistency, clean up the detail view, and resolve two known cosmetic bugs. Phase 29 covers:

1. **Typography & spacing audit** — consistent font-sizes, line-heights, and padding across all views
2. **Tile cleanup** — more whitespace on LeerlingTegel cards
3. **Dark mode audit** — eliminate hardcoded color values (e.g., `#9ca3af` in BpvProgressSection), check all views for white spots or poor contrast
4. **View transitions** — 150–200ms CSS transitions on tab navigation, klasoverzicht ↔ detail navigation, and settings panel open/close
5. **FIX-01** — Nav diagonal stripe: replace `#main-nav::after` pseudo-element with a real DOM element
6. **FIX-02** — BPV section: distinguish "loading" state from "no import" state
7. **Doorstroomnorm criteria display** — replace DoortstroomPrognoseSection with a per-traject block view showing each criterion with score vs threshold and 3-state color
8. **Detail view cleanup** — remove LeerlijnenSection, VakkenSection, and NotitiesTextarea; make SpiderChartCard full-width

**In scope:**
- All CSS changes to `src/index.css` and `src/App.css`
- `DoortstroomPrognoseSection.tsx` rewrite
- `DetailWeergave.tsx` — remove 3 sections, make spider full-width
- `KlasTabStrip.tsx` — nav stripe DOM element fix
- `BpvProgressSection.tsx` — loading vs empty state
- `LeerlingTegel.tsx` — padding/gap increase
- CSS transitions for view switches

**Out of scope:**
- New data calculations (doorstroomnorm logic already in `berekenPrognose()`)
- Any new import flows or data model changes
- Removing the underlying data from the store (VakkenSection data and notities stay in storage)
- Changes to Phase 30 (documentatie, help, CI)

</domain>

<decisions>
## Implementation Decisions

### Doorstroomnorm criteria display (PROG-01)

- **D-PROG-01:** `DoortstroomPrognoseSection.tsx` is **fully replaced** by a new per-traject block layout. The current traject-tag + gap-items approach is removed.
- **D-PROG-02:** Three blocks: **SBL block**, **SBC block**, **Negatief block**. Each block has a header showing the block name and overall block status (groen/oranje/rood), followed by its individual criteria rows.
- **D-PROG-03:** Each criterion row shows: **label** (e.g., "≥13 ≥V"), **actual score vs threshold** (e.g., "14 / 13"), and a **3-state color indicator**: groen = threshold met, oranje = 1–2 below threshold, rood = clearly below.
- **D-PROG-04:** **BJ1 leerlingen** show BJ2 block + SBC block side by side (or stacked on narrow). The thresholds come from the configurable settings (Phase 25 — `berekenPrognose()` already reads them).
- **D-PROG-05:** The block header color reflects the overall block result: groen = all criteria met, oranje = partially met (on track), rood = one or more criteria clearly missed.

### FIX-01 — Nav diagonal stripe

- **D-FIX-01:** Remove the `#main-nav::after` CSS pseudo-element entirely. Replace with a `<div aria-hidden="true" className="nav-stripe">` inside `KlasTabStrip.tsx`, positioned absolutely at the top-right of the nav bar. Apply the same `linear-gradient(to bottom-left, #009FE3 ...)` style via the `.nav-stripe` CSS class. DOM elements render reliably in Tauri WebView2 where pseudo-elements with gradients do not.

### FIX-02 — BPV loading vs empty state

- **D-FIX-02a:** Introduce a `loading: boolean` state (starts `true`, set to `false` in the `Promise.all .then/.catch`). While `loading === true`, show **"BPV-data laden…"** (short text, same muted style as the empty state).
- **D-FIX-02b:** When loading is done and `record === null` (no BPV data imported), show: **"Geen stage-data — importeer de BPV Excel via het importscherm."** (improved over current wording).
- **D-FIX-02c:** When loading is done and `record !== null`, show the existing progress bar + breakdown.

### UI-02 — Tile cleanup (more whitespace)

- **D-UI-02:** Increase padding and gap on `.leerling-tegel` cards. All existing elements (naam, status badge, score-telling, trend pijl, verzuim stats) stay visible — no info removed, no secondary styling changes. Goal: cards that "breathe" more.

### UI-04 — View transitions

- **D-UI-04:** Three transition targets, all 150–200ms:
  1. **Tab navigation** — active tab indicator animates on click (already has `transition: all var(--transition-base)`, verify and tune)
  2. **Klasoverzicht ↔ Detailweergave** — fade-in on view mount (`opacity 0 → 1`)
  3. **Settings panel open/close** — slide-in already partially implemented in Phase 19; verify and complete

### Detail view cleanup

- **D-DETAIL-01:** **`LeerlijnenSection`** — removed from `DetailWeergave.tsx`. Import removed. Component file kept (not deleted) but no longer rendered. This info is now covered by the new doorstroomnorm blokken.
- **D-DETAIL-02:** **`VakkenSection`** — removed from `DetailWeergave.tsx`. Import removed. Component file kept. Feed forward teksten remain in the store but are no longer displayed.
- **D-DETAIL-03:** **`NotitiesTextarea`** — removed from `DetailWeergave.tsx`. Import removed. Component file kept. Saved notities data remains in the store (not deleted).
- **D-DETAIL-04:** **`SpiderChartCard` row** — goes full-width. The current `spider-charts-row` flex container spans three side-by-side charts. Make the container full-width (remove width constraint) so the charts use the full detail view width. The three charts (one per leerlijn) remain.

### New detail view section order (after cleanup)

1. Header (student info + nav arrows) — unchanged
2. `DoortstroomPrognoseSection` → **replaced by new criteria block view**
3. `RekenenNederlandsSection` — unchanged
4. `FeedbackActiepuntenSection` — unchanged
5. ~~`LeerlijnenSection`~~ — removed
6. `SpiderChartCard` row — **full-width**
7. `DeelgebiedenMatrix` — unchanged
8. `VerzuimSection` — unchanged
9. `BpvProgressSection` — fixed (FIX-02)
10. ~~`VakkenSection`~~ — removed
11. ~~`NotitiesTextarea`~~ — removed

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doorstroomnorm logic (PROG-01)
- `utils/prognosis.ts` — `berekenPrognose()` is the single source of truth for doorstroomnorm calculation. The new block view reads its output (it already returns per-trajectory results and per-criterion breakdown). **Read before rewriting DoortstroomPrognoseSection.**
- `utils/settings.ts` — `getDrempelwaarden()` / `getDefaultNormen()` — thresholds are configurable (Phase 25). The criteria block view must use these values, not hardcoded defaults.
- `.planning/phases/25-doorstroomnorm-configuratie/25-CONTEXT.md` — Phase 25 decisions on how thresholds are stored and read synchronously.

### Current DoortstroomPrognoseSection
- `src/components/DoortstroomPrognoseSection.tsx` — component to be rewritten. Read current implementation to understand what props it receives (`student`, `status`) before replacing.

### Detail view structure
- `src/components/DetailWeergave.tsx` — orchestrates all sections. Sections to remove (lines ~136, ~176, ~178–179). Section order documented in D-DETAIL decisions above.

### Nav stripe fix
- `src/index.css` lines 275–285 — current `#main-nav::after` block to be replaced by `.nav-stripe` class.
- `src/components/KlasTabStrip.tsx` — add `<div aria-hidden="true" className="nav-stripe">` inside `#main-nav`.

### BPV fix
- `src/components/BpvProgressSection.tsx` — add `loading` boolean state. Current logic at lines 23–30.

### Tile & typography
- `src/index.css` — `.leerling-tegel` padding/gap (UI-02), `--transition-base` usage (UI-04), typography tokens across sections (UI-01), dark mode variables `[data-theme="dark"]` (UI-03).
- `src/App.css` — secondary styles.

### Requirements
- `.planning/REQUIREMENTS.md` §UX Streamlining (UI-01..04) and §Bugfixes (FIX-01..02)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `berekenPrognose()` in `utils/prognosis.ts` — already computes per-trajectory results. The new criteria block view reads its output directly; no new calculation needed.
- `getDrempelwaarden()` in `utils/settings.ts` — async getter for configurable thresholds. The rewritten section should call this (or use the already-resolved `status.prognose` prop passed from DetailWeergave).
- `.status-groen` / `.status-oranje` / `.status-rood` CSS classes in `src/index.css` — existing RAG color system. Use these for the per-criterion color indicator.
- `var(--transition-base)` — CSS variable already used on `.nav-tab` and other interactive elements. Use it for the new transitions to maintain consistency.
- `KlasModal.tsx` — existing modal with overlay + dialog. Not needed for this phase but confirms the modal pattern if needed.

### Established Patterns
- **Section titles** — `.detail-section-title` (0.6875rem / 700 / uppercase / `var(--text-faint)`). Every section in DetailWeergave uses this. New doorstroomnorm block headers should follow this or use a slightly larger variant for block headers.
- **Dark mode via CSS variables** — all colors use `var(--bg-*)`, `var(--text-*)`, `var(--border-*)`. Never hardcode hex values in component files. The `#9ca3af` in BpvProgressSection (line 38) violates this and must be replaced with `var(--text-muted)`.
- **Async data in sections** — `useEffect` + `useState` pattern (see BpvProgressSection). Add a loading boolean before the existing null check.

### Integration Points
- `DetailWeergave.tsx` — the only file that renders the removed sections. Remove their imports and JSX blocks; no other files reference them directly.
- `src/index.css` `#main-nav::after` — remove this block entirely when adding `.nav-stripe`.
- `KlasTabStrip.tsx` — add nav-stripe div inside the `#main-nav` element. Ensure `position: relative` is already set on `#main-nav` (it is — line 270).

</code_context>

<specifics>
## Specific Ideas

- **Doorstroomnorm block layout:** Three blocks laid out vertically (or two-column for SBL+SBC on wider screens, Negatief below). Each block: header row with block name + overall status chip, then indented criteria rows. Consider a left color-bar (like a `border-left: 3px solid var(--status-groen-bg)`) on each block header to reinforce RAG at a glance.
- **Criterion row format:** `[Label] · [score] / [threshold] · [status dot or chip]`. Example: `≥13 ≥V · 14 / 13 · ✓` in green. Orange = 12/13 (one away). Red = 9/13.
- **Spider full-width:** Remove or override the fixed width on `.spider-charts-row`. The three `SpiderChartCard` components remain side by side but the container fills the full detail view width instead of being constrained.
- **Tile padding increase:** Current `.leerling-tegel` likely has `padding: ~1rem`. Increase to `1.25rem` or `1.5rem` and increase `gap` in the tile grid.
- **BJ1 trajectory display:** Check the `student.jaarlaag` or equivalent field to determine if BJ1 rules apply. The prognosis logic already branches on this; the UI block view should mirror that branching.

</specifics>

<deferred>
## Deferred Ideas

- **FeedbackActiepuntenSection visibility toggle** — user did not request removing this section; it stays. If it proves noisy in practice, consider a collapse toggle in a future phase.
- **DeelgebiedenMatrix toggle** — not discussed; stays as-is. Could be a candidate for a collapse-by-default toggle if the detail view still feels long after this phase.
- **VakkenSection restore option** — feed forward teksten data stays in the store. If mentors miss this view, it can be added back behind a toggle in a future phase.

</deferred>

---

*Phase: 29-ui-streamlining-bugfixes*
*Context gathered: 2026-05-27*
