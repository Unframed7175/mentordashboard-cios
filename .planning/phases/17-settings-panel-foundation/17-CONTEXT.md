# Phase 17: Settings Panel Foundation - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A settings page accessible from the nav bar (gear icon, far-right edge), implemented as a
4th full-page view state in App.tsx. The page provides: a dark mode toggle (user-controlled,
starts from OS preference, persisted in plugin-store) and an "Add files" shortcut that
navigates to the existing ImportPage. Placeholder section headers for Phase 18 content are
included but disabled/empty. A back button returns the mentor to the previous view.

</domain>

<decisions>
## Implementation Decisions

### Settings Page Layout (D-01 – D-04)
- **D-01:** Settings opens as a 4th full-page view state in App.tsx (`'settings'`), replacing
  the current view — same routing pattern as `'import'` / `'klas'` / `'detail'`.
- **D-02:** The settings icon is a ⚙ gear — Unicode character or inline SVG — pinned to the
  far-right edge of the KlasTabStrip nav bar, separated from the class tabs.
- **D-03:** The settings page uses cards per section — each section (Weergave, Bestanden,
  and Phase 18 placeholders) is a white card using the existing `.detail-section` /
  `.detail-section-title` CSS pattern.
- **D-04:** A `← Terug` back button sits in the settings page header, returning the mentor
  to whichever view was active before opening settings (App.tsx tracks `prevView`).

### Dark Mode Toggle (D-05 – D-08)
- **D-05:** Dark mode is user-controlled via a toggle switch (on/off) with a label. The
  toggle replaces the `@media (prefers-color-scheme: dark)` approach with a `body.dark` class
  — adding `body.dark { }` overrides in `index.css` that mirror the existing media query tokens.
  The media query is removed (or commented out) to prevent conflicts.
- **D-06:** On first launch, the app reads the OS preference (`window.matchMedia('(prefers-color-scheme: dark)').matches`)
  and uses it as the initial state. Once the user manually toggles, their explicit choice is
  saved and OS preference is ignored on subsequent starts.
- **D-07:** The dark/light preference is persisted under a separate `'settings'` key in
  Tauri plugin-store: `{ theme: 'dark' | 'light' }`. This keeps class data and app
  preferences isolated. Uses the same plugin-store save/load pattern from Phase 12.
- **D-08:** Dark mode applies **instantly on toggle** — no save/confirm step. The `body.dark`
  class is added/removed immediately, providing instant visual feedback.

### Add-Files Flow (D-09 – D-10)
- **D-09:** The settings page has an "Bestanden toevoegen" button in the Bestanden section.
  Clicking it navigates to the existing `ImportPage` view — no new importer built.
  Auto-detect skips when students already exist (Phase 16 behaviour), so the existing class
  is unaffected.
- **D-10:** After completing the import from the settings → ImportPage path, the app lands
  on the klas overview (`'klas'` view) — same as the existing `handleImportComplete` behaviour.
  No extra routing state needed.

### Phase 18 Placeholders (D-11)
- **D-11:** The settings page includes visible but disabled/empty section cards for
  "Deelgebieden & Leerlijnen" and "Drempelwaarden & BPV-uren" with a short placeholder text
  ("Komt in een volgende versie"). Phase 18 will replace the placeholder content.

### Claude's Discretion
- Exact gear icon implementation (Unicode ⚙ vs inline SVG) — whichever renders more cleanly
  at the nav bar size
- CSS class names for the settings page components
- Whether `prevView` is stored as a state variable or inferred from a navigation stack

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### App Routing & Nav
- `src/App.tsx` — Current 3-state view routing; add `'settings'` as 4th state here;
  also the location for `prevView` tracking and the settings icon dispatch
- `src/components/KlasTabStrip.tsx` — Nav bar component; settings icon + `onSettings` prop
  added here

### CSS & Dark Mode
- `src/index.css` — All `:root` CSS custom properties and the existing
  `@media (prefers-color-scheme: dark)` block; dark mode implementation converts this to
  `body.dark { }` class overrides. MUST extend this file, not replace it.

### Import Flow
- `src/components/ImportPage.tsx` — Existing import flow; settings "Bestanden toevoegen"
  navigates here. Auto-detect skips when students > 0 (Phase 16). No changes needed to
  ImportPage itself.

### Storage Pattern
- `utils/klassen.ts` — Plugin-store save/load pattern (Phase 12); replicate for the
  `'settings'` store key

### Requirements
- `.planning/REQUIREMENTS.md` — SET-01, SET-02, POL-01 definitions

### Roadmap
- `.planning/ROADMAP.md` — Phase 17 success criteria (4 criteria)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.detail-section` + `.detail-section-title` CSS classes in `index.css` — use directly
  for settings page section cards; no new card style needed
- `KlasModal` component — reference for modal/overlay patterns (not reused directly but
  shows how standalone dialog components are structured)
- Plugin-store load/save in `utils/klassen.ts` — replicate the `get` / `set` calls with
  key `'settings'` for theme persistence
- `ImportPage` — reused as-is via navigation; no props changes needed

### Established Patterns
- View routing: `setView('settings')` follows the existing `useState<'import' | 'klas' | 'detail' | 'settings'>` extension
- Back navigation: `DetailWeergave` has a `onBack` callback — same pattern for settings
- Dark mode CSS: all tokens already split between `:root` (light) and the media query (dark);
  converting to `body.dark { }` is a find-and-replace on the selector, not a redesign

### Integration Points
- `App.tsx` → `KlasTabStrip` — add `onSettings` prop + gear icon
- `App.tsx` → `SettingsPage` — new component rendered when `view === 'settings'`
- `SettingsPage` → plugin-store — load/save `'settings'` key on mount/toggle
- `SettingsPage` → `body.classList` — add/remove `'dark'` class on toggle
- `index.css` — `@media` block converted to `body.dark { }` block

</code_context>

<specifics>
## Specific Ideas

- Settings icon: ⚙ (Unicode gear) or inline SVG at ~20px, styled like the existing `.nav-tab`
  ghost button (same hover state, same border-radius)
- Dark mode toggle: CSS toggle switch component (no library), label "Donkere modus"
- Back button label: `← Terug` — matches the Dutch UI language used throughout the app
- Phase 18 placeholder text: "Komt in een volgende versie" (grayed out, non-interactive)
- Settings page sections (in order): Weergave (dark mode toggle), Bestanden (add files button),
  then Phase 18 placeholder cards

</specifics>

<deferred>
## Deferred Ideas

- Other UI / frontend changes observed during Phase 16 UAT — deferred to Phase 19 (UI Polish),
  which is specifically reserved for visual improvements
- Dark mode "System" option (three-way light/dark/system selector) — kept simple for Phase 17;
  could be added in Phase 19 if desired
- Settings page animations (slide-in transition for the settings view) — Phase 19 scope

</deferred>

---

*Phase: 17-settings-panel-foundation*
*Context gathered: 2026-05-17*
