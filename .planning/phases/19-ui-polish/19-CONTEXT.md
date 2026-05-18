# Phase 19: UI Polish - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 19 delivers the full visual polish of the Mentordashboard — a Material Design-inspired redesign plus the three POL requirements:

- **POL-02**: Spiderweb chart refactored to React SVG elements with axis labels and hover tooltips
- **POL-03**: All views render without horizontal scroll at ≥1024px
- **POL-04**: Hover/transition effects are consistent across all components including those added in Phases 16–18

Additionally the user requested a **full visual refresh** incorporating the CIOS Zuidwest corporate identity (brand colors, logo, Helvetica Neue font, Material Design elevation + branded nav header). This extends the scope beyond the original POL-02/03/04 requirements but is part of the same phase.

</domain>

<decisions>
## Implementation Decisions

### Corporate Identity & Visual Direction (D-01 – D-08)

- **D-01:** The app gets a full Material Design-inspired visual refresh: modern, cleaner layout, stronger CIOS branding. Target feel: professional app (not prototype), institutional brand presence, reduced visual clutter.
- **D-02:** Material Design elements in scope: (1) elevation/card shadows on tiles and sections, (2) colored nav/header with CIOS brand color. Ripple/ink animations and filled buttons are out of scope for this phase.
- **D-03:** The nav/header (KlasTabStrip) gets a CIOS branded background color. The user has a **reference image** showing the desired nav header design — the researcher/implementer must ask for it before implementing the nav header.
- **D-04:** Card elevation: Claude decides whether to update `--shadow-sm`/`--shadow-md` to Material-style values or add a new elevation token scale. Decision must be consistent across all card components.
- **D-05:** Brand colors: the user has the **exact brand file** with official CIOS Zuidwest colors. The implementer must ask for it at implementation time. The existing `#00AEEF` + `#003057` may be updated.
- **D-06:** Logo: two separate logo files exist for light and dark modes. The user will provide them at implementation — they may need minor adjustments. The researcher must note: "Ask user for logo files (light + dark) before implementing the header."
- **D-07:** Typography — **Industry font** family. Apply the same size/line-spacing spec as originally designed (user will provide font files for bundling in Tauri):
  - **Page title**: Industry, font size varies (context-dependent), line spacing 37
  - **Sub header**: Industry Regular, font size 12, line spacing 14
  - **Intro text**: Industry Regular, font size 12, line spacing 16
  - **Flat/body text**: Industry Regular, font size 9, line spacing 14
- **D-08:** Font loading strategy: bundle Industry font files inside the Tauri app (user provides licensed files). Use `@font-face` in `index.css`. Researcher must note: "Ask user for Industry font files before implementing typography."

### Spider Chart — Tooltips & Axis Labels (D-09 – D-11)

- **D-09:** `SpiderChart.buildSpiderSVG` in `utils/spider.ts` is refactored to return **React JSX (SVG elements)** instead of a raw string. `SpiderChartCard.tsx` renders JSX directly instead of using `dangerouslySetInnerHTML`. This enables React-level event handlers (`onMouseEnter`/`onMouseLeave`) on each axis point.
- **D-10:** Axis labels: **short abbreviated labels** (e.g., `V&A`, `M&M`) are always visible at each axis endpoint in the SVG. These are the existing `dg.label` values — no new abbreviations needed.
- **D-11:** Tooltip content on hover over an axis point: **full deelgebied name + score text** (e.g., "Vakkennis & Attitude: Goed"). Plain text, no color indicator.

### Responsive Layout (D-12 – D-13)

- **D-12:** The researcher audits all views (KlasOverzicht, DetailWeergave, SettingsPage, ImportPage) at 1024px minimum width and identifies every overflow source. The user does not know in advance what breaks — researcher discovery is the first step.
- **D-13:** Stacking behavior at narrow widths: Claude decides per component type. Tiles may shrink proportionally; multi-section layouts may collapse to single column. Researcher proposes approach per component, planner confirms.

### Hover & Transition Consistency (D-14 – D-15)

- **D-14:** Researcher audits **all interactive components added in Phases 16–18** (settings page sections/cards, BPV progress section, auto-detect toast, leerlijn/drempel inputs, toggle switches) for missing hover and focus states. All gaps found are fixed.
- **D-15:** Transition timing: Claude decides per element size and type. Convention: `--transition-fast` (150ms) for small interactive elements (icon buttons, toggles); `--transition-base` (200ms) for cards, tiles, and larger surfaces.

### Settings Page Animation (D-16 – D-17)

- **D-16:** The settings view opens with a **slide-in from the right** animation (approximately 200ms ease), matching the Material Design pattern for a detail/side panel.
- **D-17:** Other view transitions (klas ↔ detail, import → klas): Claude decides which transitions benefit from directional animation. Settings is the primary candidate; other transitions may remain instant or get a lighter fade — planner proposes.

### Claude's Discretion

- Card shadow values (update existing tokens vs. new Material elevation scale)
- Transition timing per element type (based on --transition-fast / --transition-base guideline in D-15)
- Which other view transitions besides settings get animation (D-17)
- CSS class names for new tooltip/label components
- Whether to debounce or throttle spider chart tooltip visibility
- Font size mapping: "font size varies" for page title — planner proposes specific px/rem values per context

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### CSS & Design Tokens
- `src/index.css` — ALL CSS custom properties (`:root` light + `body.dark` dark tokens), existing transition variables (`--transition-fast`, `--transition-base`, `--transition-slow`), existing hover effects. MUST extend this file, never replace.
- `src/App.css` — App-level layout CSS

### Spider Chart
- `utils/spider.ts` — `SpiderChart.buildSpiderSVG` — the function to refactor from string to JSX. Read the full file before touching it.
- `src/components/SpiderChartCard.tsx` — Component that renders the spider chart. Currently uses `dangerouslySetInnerHTML`. Phase 19 removes this in favor of JSX rendering.

### Component Files to Update
- `src/components/KlasTabStrip.tsx` — Nav bar with gear icon; gets branded background color in Phase 19
- `src/components/KlasOverzicht.tsx` / `src/components/LeerlingTegel.tsx` — Tile grid; audit for responsive overflow
- `src/components/DetailWeergave.tsx` — Detail view; audit for responsive overflow + hover completeness
- `src/components/SettingsPage.tsx` — Gets slide-in animation; audit Phase 18 additions for hover states
- `src/components/BpvProgressSection.tsx` (Phase 18) — New component; audit for hover + responsive
- `src/App.tsx` — View routing; handles slide animation state for settings transition

### Prior Phase Context
- `.planning/phases/17-settings-panel-foundation/17-CONTEXT.md` — D-05/D-08: dark mode CSS approach (`body.dark` class), dark mode CSS variables in `index.css`
- `.planning/phases/18-settings-panel-advanced/18-CONTEXT.md` — All Phase 18 component decisions (deelgebieden table, BPV section, threshold inputs)

### Requirements
- `.planning/REQUIREMENTS.md` — POL-01, POL-02, POL-03, POL-04 formal definitions
- `.planning/ROADMAP.md` — Phase 19 success criteria

### Assets to Request from User (CRITICAL)
The following assets are NOT in the codebase — implementer MUST request them from the user before starting the relevant tasks:
1. **CIOS brand color file** — exact brand colors (may update #00AEEF / #003057)
2. **Logo files** — two files: light mode and dark mode variant (may need adjusting)
3. **Industry font files** — licensed copies for bundling in Tauri (for `@font-face`)
4. **Nav header reference image** — user's design reference for the colored nav/header

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `--transition-fast: 150ms ease`, `--transition-base: 200ms ease`, `--transition-slow: 300ms ease` — already defined in `index.css`. Phase 19 adds new hover effects using these, not new values.
- `.detail-section` / `.detail-section-title` CSS classes — established section card pattern. Elevation update affects all cards using these classes.
- `--shadow-sm`, `--shadow-md` CSS variables — current shadow tokens to be potentially updated for Material elevation style.
- `body.dark { }` approach — Phase 17 dark mode class. New branded colors must provide dark variants.

### Established Patterns
- All CSS lives in `src/index.css` via CSS custom properties — Phase 19 extends this file only.
- `SpiderChart.buildSpiderSVG` currently returns `string` — Phase 19 changes the return type to `JSX.Element`. This is a breaking change; `SpiderChartCard.tsx` must be updated together.
- Plugin-store (tauri-plugin-store) `LazyStore('store.json')` — used by settings; no new store keys needed for Phase 19.
- View routing pattern: `useState<'import' | 'klas' | 'detail' | 'settings'>` in `App.tsx` — animation state (e.g., slide direction) can be co-located here.

### Integration Points
- `utils/spider.ts` → `SpiderChartCard.tsx` → `DetailWeergave.tsx`: full chain affected by spider refactor
- `KlasTabStrip.tsx` → `App.tsx` (`onSettings` prop): animation trigger sits at this boundary
- `src/index.css` `:root` block: all new brand tokens go here; `body.dark` block for dark variants

### Constraints
- The `dangerouslySetInnerHTML` SVG rendering is a security measure (Phase 14 comment). Refactoring to JSX removes this surface — note this in the implementation plan, since the existing comment references it.
- Helvetica Neue: requires `@font-face` declaration + font files in `src/assets/fonts/` (or similar). Tauri bundles `src/` directory; ensure the font path is within the Vite/Tauri bundle boundary.

</code_context>

<specifics>
## Specific Ideas

- **Nav header reference image**: user has a specific design in mind — researcher/implementer must ask for this image before designing the nav header. Do not guess.
- **Brand asset hand-off**: user will provide brand color file, logo files (light + dark), and Industry font files at implementation time. Create a hand-off checklist item in the plan.
- **Typography mapping needed**: the typography spec uses print units (pt) and line spacing values that need conversion to CSS `px`/`rem` and `line-height` ratios. Planner should propose a conversion table for review.
- **Helvetica Neue font size note**: "font size varies" for page title means context-dependent (h1 vs h2 vs page-level title). Planner proposes a specific size-per-context table.
- **Spider chart refactor security note**: the existing `SpiderChartCard.tsx` contains a comment noting the SVG string injection as a security choice. When removing `dangerouslySetInnerHTML`, update or remove this comment.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-ui-polish*
*Context gathered: 2026-05-18*
