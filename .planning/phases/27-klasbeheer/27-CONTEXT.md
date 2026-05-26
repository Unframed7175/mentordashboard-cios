# Phase 27: Klasbeheer - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Add two class-management actions to the tab strip: delete an empty class via a hover `×` icon on its tab, and rename any class by double-clicking its tab (inline input). The existing delete button in KlasOverzicht is removed — the tab `×` becomes the single delete path.

**In scope:**
- `×` icon on tab hover — only for classes with 0 students
- `window.confirm` before delete
- Double-click on tab → inline `<input>` for rename
- Enter or blur saves, Escape cancels
- Non-empty trim validation on save
- `renameKlas()` utility function (does not exist yet)
- Remove existing delete button from KlasOverzicht

**Out of scope:**
- Renaming from anywhere other than the tab strip
- Deleting non-empty classes (must be empty to delete)
- Any other class-management features (reorder tabs, merge classes, etc.)

</domain>

<decisions>
## Implementation Decisions

### Delete affordance (D-01 – D-02)

- **D-01:** Delete affordance is a `×` icon that appears **on hover inside the tab** — only for classes with `students.length === 0`. No visible icon when not hovering. CSS `:hover` on the tab reveals the `×`.
- **D-02:** Clicking `×` triggers `window.confirm('Klas X verwijderen? Dit kan niet ongedaan worden gemaakt.')`. Same pattern as the existing KlasOverzicht delete. On confirm → `deleteKlas(klasId)` + `setRefreshKey`.

### Rename trigger (D-03)

- **D-03:** Rename is triggered by **double-click on the tab text** (`onDoubleClick`). No pencil icon, no hover icon for rename. Double-click is the only trigger.

### Rename edit UX (D-04 – D-06)

- **D-04:** Rename uses an **inline `<input>` inside the tab** — the tab button text is replaced with a text input pre-filled with the current class name. No modal.
- **D-05:** Save behavior: **Enter saves, Escape cancels, blur saves**. If the trimmed value is empty on save, revert to the original name.
- **D-06:** Validation: **non-empty trim only**. `naam.trim().length > 0` required. No uniqueness check.

### Existing delete button (D-07)

- **D-07:** The delete button in `KlasOverzicht.tsx` (lines ~139-145) is **removed**. The tab `×` is the single delete path going forward. Mentors must empty a class before they can delete it.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Class management data layer
- `utils/klassen.ts` — `deleteKlas(klasId)`, `createKlas(naam)`, `saveKlassen()`, `klassenState` (singleton with `.klassen` map and `.activeKlasId`). `renameKlas()` does NOT exist yet — must be added here.
- `utils/klassen.ts` lines 94-118 — `deleteKlas` implementation; follow the same save + `setActiveKlas` pattern for the `×` delete.

### UI components to modify
- `src/components/KlasTabStrip.tsx` — receives `klassen: Array<{ id: string; naam: string }>` prop from App.tsx. Currently no delete or rename affordance. Add hover `×` and double-click rename here.
- `src/components/KlasOverzicht.tsx` lines ~139-145 — existing delete button to be **removed** (D-07).
- `src/App.tsx` lines ~114-120 — KlasTabStrip props; may need `onDeleteKlas` and `onRenameKlas` callback props added.

### Requirements
- `.planning/REQUIREMENTS.md` §KLS — KLS-01, KLS-02, KLS-03

### Style & patterns
- `src/index.css` — `.nav-tab` class defines existing tab styling. Hover state must align with existing `:hover` rules. Use `var(--text-muted)` for the `×` icon color.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `deleteKlas(klasId)` in `utils/klassen.ts` — already handles delete + auto-switch to another class + `saveKlassen()`. The tab `×` handler calls this directly.
- `window.confirm(...)` pattern — already used in KlasOverzicht for delete confirmation. Reuse the same approach (D-02).
- `setRefreshKey(k => k + 1)` in `App.tsx` — triggers re-render of KlasTabStrip and KlasOverzicht after any klas mutation. The rename handler must call this after saving.

### Established Patterns
- `KlasTabStrip` receives a `klassen` prop array (derived from `klassenState.klassen` at render time in App.tsx). New `onDeleteKlas(klasId)` and `onRenameKlas(klasId, newNaam)` callbacks should follow the same prop-passing pattern (App.tsx owns the state, KlasTabStrip is presentational).
- Inline edit pattern does not yet exist in this codebase — the tab strip will be the first instance. Keep it simple: local component state `editingKlasId: string | null` tracks which tab is in edit mode.

### Integration Points
- `App.tsx` → `KlasTabStrip` → needs two new callbacks: `onDeleteKlas` and `onRenameKlas`
- `utils/klassen.ts` → needs new `renameKlas(klasId, newNaam)` export (update `naam` field + `saveKlassen()`)
- `KlasOverzicht.tsx` → remove the existing delete button block (~5 lines)
- After delete or rename: `setRefreshKey(k => k + 1)` must be called in App.tsx so all consumers (KlasTabStrip, KlasOverzicht, KPI header) re-render with fresh data

</code_context>

<specifics>
## Specific Ideas

- The `×` icon should only be reachable/visible on hover — use CSS `:hover` on the `.nav-tab` to show/hide it. The `×` itself should be a `<button>` inside the tab (prevent the click from also triggering `onSwitch`).
- For the inline input, `autoFocus` on mount so the user can type immediately after double-clicking.
- The input width should match the current tab width (or the text width) — avoid layout shift when entering edit mode.

</specifics>

<deferred>
## Deferred Ideas

- **Spider chart size + doorstroomprognose display in detail view** — mentioned during discussion. Belongs in Phase 29 (UI Streamlining & Bugfixes), not here.

</deferred>

---

*Phase: 27-klasbeheer*
*Context gathered: 2026-05-23*
