# Phase 19: UI Polish - Research

**Researched:** 2026-05-18
**Domain:** React SVG refactor, CSS design tokens, responsive layout, typography, animation
**Confidence:** HIGH — all findings verified directly from codebase source files

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Full Material Design-inspired visual refresh — modern layout, stronger CIOS branding.
- **D-02:** Material elements in scope: elevation/card shadows, colored nav/header. Ripple and filled buttons are OUT.
- **D-03:** Nav/header gets CIOS branded design. Reference image confirmed (white nav + diagonal blue stripe top-right).
- **D-04:** Card elevation: Claude decides whether to update `--shadow-sm`/`--shadow-md` or add new tokens. Must be consistent.
- **D-05:** Brand colors confirmed: `#009FE3` (CIOS blue). All 6 accent tokens replaced.
- **D-06:** Logo: two separate files (light + dark). Located at user's design folder — must be exported to SVG/PNG.
- **D-07:** Typography — Industry font family. Size spec: body=12px(9pt), label/sub-header=16px(12pt), intro=16px(12pt), heading=24px (context-dependent).
- **D-08:** Font loading: bundle OTF files in Tauri via `@font-face` in `index.css`. Files are at `C:\Users\rafae\Desktop\bestanden voor dashboard testing\design\industry font\`.
- **D-09:** `buildSpiderSVG` refactored from `string` return to `JSX.Element`. `dangerouslySetInnerHTML` removed.
- **D-10:** Axis labels always visible at each axis endpoint. Use `dg.label` short values.
- **D-11:** Tooltip content: full deelgebied name + score text. Plain text, no color indicator.
- **D-12:** Researcher audits all views at 1024px minimum width. Overflow sources identified below.
- **D-13:** Stacking behavior is Claude's decision per component type.
- **D-14:** All interactive components from Phases 16–18 audited for missing hover/focus states.
- **D-15:** Transition timing: `--transition-fast` (150ms) for small elements; `--transition-base` (200ms) for cards/tiles.
- **D-16:** Settings view opens with slide-in from right (~200ms ease).
- **D-17:** Other view transitions: Claude decides. Settings is primary candidate; others may be instant or light fade.

### Claude's Discretion

- Card shadow values (update existing `--shadow-sm`/`--shadow-md` vs new elevation scale)
- Transition timing per element type (following --transition-fast/--transition-base guideline)
- Which other view transitions besides settings get animation (D-17)
- CSS class names for new tooltip/label components
- Whether to debounce or throttle spider chart tooltip visibility
- Font size mapping: "font size varies" for page title — planner proposes specific px/rem values
- Exit animation for settings panel (slide-out on dismiss) — optional

### Deferred Ideas (OUT OF SCOPE)

None.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POL-02 | Spiderweb chart has readable axis labels and shows hover tooltips with deelgebied name and score | Spider refactor section below — full refactor path documented with before/after signatures |
| POL-03 | Tile grid and detail view scale correctly at window widths ≥1024px without horizontal scroll | Responsive audit section below — each component's overflow risk identified |
| POL-04 | Hover effects and transitions are consistent — KPI tiles, student tiles and nav tabs animate subtly (150–200ms ease) | Hover audit section below — 4 confirmed gaps listed with exact CSS fixes |

</phase_requirements>

---

## Summary

Phase 19 delivers the complete visual polish of the Mentordashboard: (1) a brand refresh applying CIOS Zuidwest corporate identity (Industry font, `#009FE3` accent, logo, Material elevation), (2) spider chart refactor from raw SVG string to JSX with axis labels and hover tooltips (POL-02), (3) responsive overflow audit and fixes at ≥1024px (POL-03), and (4) consistent hover/transition states across all Phases 16–18 additions (POL-04).

All source files have been read directly. The current codebase is in excellent shape for this phase: CSS custom property architecture is clean, the spider chart function is isolated and small (123 lines), view routing is already set up for the animation state addition, and `index.css` is 1205 lines with clear numbered sections. The four hover state gaps, the spider chart's `string` return type, the `dangerouslySetInnerHTML` usage, and the missing font/logo assets are the only blockers — all are fully characterized below.

**Primary recommendation:** Execute in 4 waves: Wave 0 (test scaffolding), Wave 1 (CSS tokens + typography), Wave 2 (spider chart JSX refactor), Wave 3 (responsive fixes + hover gaps + settings animation). The CSS token and font work is prerequisite to the rest; spider chart is the highest technical complexity item and should proceed in parallel with CSS work.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Spider chart JSX refactor | Frontend Component | — | `buildSpiderSVG` lives in `utils/spider.ts`, consumed by `SpiderChartCard.tsx`. Both are React/browser tier. |
| Axis labels + tooltips | Frontend Component | — | SVG `<text>` elements and React `useState` tooltip. No backend needed. |
| CSS token updates (brand colors, shadows) | CSS (Design Tokens) | — | All tokens in `src/index.css` `:root` block. Applied globally via inheritance. |
| Typography (Industry font) | CSS (`@font-face`) | Build/Bundle | `@font-face` in `src/index.css`; font files must be within `src/assets/` for Vite/Tauri bundling. |
| Logo integration | Frontend Component | CSS | `<img>` in `KlasTabStrip.tsx`; CSS for positioning/sizing. |
| Nav diagonal stripe | CSS (`::after` pseudo-element) | — | Pure CSS, no markup change beyond adding `position: relative; overflow: hidden` to `#main-nav`. |
| Responsive overflow fixes | CSS | Frontend Component | Primarily CSS `flex-wrap`/`min-width: 0` changes; one inline style change in `LeerlingTegel.tsx`. |
| Hover state gaps | CSS | — | 4 missing CSS rules added to `src/index.css`. |
| Settings slide-in animation | CSS + React State | — | CSS `@keyframes`; React `settingsOpenCount` counter in `App.tsx` to force remount. |
| View transitions (klas → detail) | CSS | React State | Optional fade class applied at `view === 'detail'` mount. |

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x (existing) | JSX rendering for refactored spider chart | Already the app's component framework |
| TypeScript | 5.x (existing) | Type-safe JSX.Element return type | Project-wide TypeScript (Phase 11) |
| Tauri | 2.x (existing) | OTF font bundling via `src/assets/fonts/` | Already bundles `src/` directory |
| Vitest | 4.x (existing) | Unit tests for spider refactor | Existing test framework (89 tests passing) |

**No new npm packages required.** All Phase 19 work is CSS, TypeScript, and JSX changes within the existing stack.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tauri-apps/plugin-store` | existing | No new keys needed for Phase 19 | Already used; no changes |

**Installation:** None required.

---

## Architecture Patterns

### System Architecture Diagram

```
User interaction
      │
      ▼
[KlasTabStrip] ── click gear ──► [App.tsx] setView('settings')
      │                                │
      │ logo <img> + ::after stripe    │ settingsOpenCount++
      │                                ▼
      │                     [SettingsPage] key={settingsOpenCount}
      │                          .view-slide-in-right class
      │
      ▼
[DetailWeergave]
      │
      ├─► [SpiderChartCard] ── buildSpiderSVG() ──► [utils/spider.ts]
      │         │                                         │
      │         │ JSX.Element (Phase 19: was string)      │
      │         │                                         ▼
      │         │                              SVG <polygon> + <line>
      │         │                              + <text> axis labels (NEW)
      │         │                              + <circle> hit areas (NEW)
      │         │
      │         ├─► tooltip <div> (absolute, outside SVG)
      │         │    onMouseEnter/Leave on <circle> elements
      │         │
      │         └─► spider-card: position: relative (required for tooltip)
      │
      └─► CSS tokens: --accent → #009FE3, --shadow-sm/md updated
              src/index.css :root block
              body.dark { } dark mode extensions
```

### Recommended Project Structure (additions only)

```
src/
├── assets/
│   ├── fonts/                     # NEW — Industry OTF files
│   │   ├── IndustryTest-Book.otf
│   │   ├── IndustryTest-Bold.otf
│   │   └── IndustryTest-Demi.otf  # optional, for weight-600
│   ├── logo-light.svg             # NEW — CIOS logo (light mode)
│   ├── logo-dark.svg              # NEW — CIOS logo (dark mode)
│   └── react.svg                  # existing
├── components/
│   ├── KlasTabStrip.tsx           # EDIT — add logo <img> + isDark prop
│   ├── SpiderChartCard.tsx        # EDIT — JSX refactor, remove dangerouslySetInnerHTML
│   └── [other existing files]
├── index.css                      # EDIT — extend only, never replace
└── App.tsx                        # EDIT — add settingsOpenCount state
utils/
└── spider.ts                      # EDIT — return JSX.Element instead of string
```

### Pattern 1: Spider Chart JSX Refactor

**What:** Change `buildSpiderSVG` return type from `string` to `JSX.Element`. Eliminates `dangerouslySetInnerHTML`.
**When to use:** Required for POL-02 to enable `onMouseEnter`/`onMouseLeave` on SVG elements.

**Current signature (verified from `utils/spider.ts` line 46–51):**
```typescript
// Source: utils/spider.ts (verified)
buildSpiderSVG(
  axes: Array<{ key: string; label: string }>,
  scores: Record<string, string | null>,
  fillVar: string,
  strokeVar: string
): string
```

**Target signature:**
```typescript
// After refactor — JSX.Element return, React import required in spider.ts
import React from 'react';

buildSpiderSVG(
  axes: Array<{ key: string; label: string }>,
  scores: Record<string, string | null>,
  fillVar: string,
  strokeVar: string,
  onHover?: (idx: number | null) => void  // optional: pass hover handler
): JSX.Element
```

**Key refactor notes (verified from source):**
- Current `gridRings` and `gridLines` are built as string concatenation loops. These become `Array<JSX.Element>` with `.map()`.
- Current `polygon` data point element becomes `<polygon points={pointsStr} fill={...} />`.
- NEW: `<text>` elements for axis labels at `labelX = centerX + cos(angle) * (maxRadius + 12)`, `labelY = centerY + sin(angle) * (maxRadius + 12)`.
- NEW: `<circle>` hit areas at each data polygon vertex (`r={6}`, `fill="transparent"`, `cursor="pointer"`).
- Return: `<svg width="160" height="160" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">...</svg>` as JSX.

**SpiderChartCard changes (verified from `src/components/SpiderChartCard.tsx` lines 34–48):**
- Remove lines 34 (`rawSvg` const) + 36–38 (null check) + 40–44 (security comment + script strip) + 48 (`dangerouslySetInnerHTML`).
- The Phase 14 security comment at lines 41–44 documents the SVG injection defense. Remove the comment entirely when removing `dangerouslySetInnerHTML` — JSX eliminates this surface.
- Add `useState<{ axisIndex: number; x: number; y: number } | null>(null)` for tooltip.
- Render `SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar)` directly as JSX child.
- Add tooltip `<div>` as sibling to the SVG, inside `.spider-card`.
- `.spider-card` already has `maxWidth: 180px` as inline style (line 47) — add `position: relative` for tooltip positioning.

**Test impact (verified from `tests/spider.test.ts`):**
The existing spider tests (lines 15–37) assert `typeof svg === 'string'`. After refactor, the return is `JSX.Element` — these 4 tests will need updating. The tests check:
1. Return is string → change to `expect(React.isValidElement(svg)).toBe(true)`
2. Output contains `'<svg'` → check `svg.props.tagName` or render to string via `renderToStaticMarkup`
3. `'polygon'` in output → verify via rendered output
4. No throw on empty scores → preserve as-is

### Pattern 2: Tooltip Positioning

**What:** Absolutely positioned React `<div>` sibling to SVG. Hover state stored in `SpiderChartCard`.
**When to use:** Required for POL-02. SVG-native `<title>` elements not used (not styled, no interaction control).

```typescript
// Source: 19-UI-SPEC.md (verified specification)
const [tooltip, setTooltip] = useState<{ axisIndex: number; x: number; y: number } | null>(null);

// Inside JSX return:
<div className="spider-card" style={{ maxWidth: '180px', position: 'relative' }}>
  {SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar, setTooltip)}
  {tooltip && (
    <div
      className="spider-tooltip"
      style={{
        position: 'absolute',
        top: tooltip.y,
        left: tooltip.x,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}
    >
      {axes[tooltip.axisIndex].label}: {scoreDisplay(scores[axes[tooltip.axisIndex].key])}
    </div>
  )}
</div>
```

### Pattern 3: Settings Slide-In Animation

**What:** CSS `@keyframes` + React `key` remount trick.
**When to use:** D-16 — settings opens with 200ms right-to-left slide.

```css
/* Source: 19-UI-SPEC.md specification */
.view-slide-in-right {
  animation: slideInFromRight var(--transition-base) ease forwards;
}
@keyframes slideInFromRight {
  from { transform: translateX(100%); opacity: 0.7; }
  to   { transform: translateX(0);    opacity: 1;   }
}
```

**React side (verified — App.tsx currently has no `settingsOpenCount`):**
```typescript
// App.tsx additions (verified current state from src/App.tsx)
const [settingsOpenCount, setSettingsOpenCount] = useState(0);

function handleOpenSettings() {
  setPrevView(view as 'import' | 'klas' | 'detail');
  setSettingsOpenCount(c => c + 1);  // forces remount → re-triggers animation
  setView('settings');
}

// JSX:
{view === 'settings' && (
  <div className="view-slide-in-right" style={{ overflow: 'hidden' }}>
    <SettingsPage key={settingsOpenCount} onBack={handleBackFromSettings} onNavigateToImport={handleNavigateToImportFromSettings} />
  </div>
)}
```

**Parent overflow:** Add `overflow: hidden` to `#root` or the view container wrapper to prevent horizontal scrollbar flash during slide animation.

### Pattern 4: CSS Token Update (Brand Refresh)

**What:** Update 6 accent tokens in `:root` block + add 6 counterparts to `body.dark`.
**When to use:** D-05 — replace indigo accent `#4F46E5` with CIOS blue `#009FE3`.

```css
/* Source: verified against src/index.css lines 15-20 (current values) */
/* Target values from 19-UI-SPEC.md (confirmed) */
:root {
  --accent:        #009FE3;   /* was #4F46E5 */
  --accent-hover:  #007DBF;   /* was #4338CA */
  --accent-light:  #E0F5FD;   /* was #EEF2FF */
  --accent-border: #99D9F4;   /* was #C7D2FE */
  --accent-text:   #00547A;   /* was #3730A3 */
  --border-focus:  #009FE3;   /* was #4F46E5 */
  /* --nav-bg: #FFFFFF — unchanged, stays white */
}
body.dark {
  --accent:        #009FE3;
  --accent-hover:  #007DBF;
  --accent-light:  #003B57;
  --accent-border: #005F8E;
  --accent-text:   #7DD4F5;
  --border-focus:  #009FE3;
}
```

**Secondary effect:** The `.dg-naam-input:focus` and `.settings-number-input:focus` box-shadow rules hardcode the old indigo rgba value (`rgba(79, 70, 229, 0.12)` at lines 1112 and 1183). These must be updated to `rgba(0, 159, 227, 0.12)` when the accent token is updated.

### Anti-Patterns to Avoid

- **Replacing index.css:** CONTEXT.md canonical ref explicitly requires `extend only, never replace`. All changes are additions or targeted value updates.
- **Putting tooltip inside SVG:** The `<foreignObject>` SVG element has inconsistent cross-browser support in WebViews. Use an absolutely positioned `<div>` sibling instead.
- **Using `dangerouslySetInnerHTML` for axis labels:** The entire point of D-09 is to remove this pattern. Even the axis label `<text>` elements must be JSX.
- **Debouncing mouse hover:** The UI-SPEC explicitly notes "no debounce needed" for desktop Tauri app (no touch).
- **Adding new CSS files:** All CSS lives in `src/index.css`. No new `.css` or `.module.css` files.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltip positioning | Custom tooltip manager | Simple `position: absolute` + React state | Tauri desktop app, no mobile; CSS absolute is sufficient |
| Font loading | Custom font loader | `@font-face` in CSS | Native browser/WebView capability |
| Animation sequencing | Custom animation library | CSS `@keyframes` + React `key` remount | Single animation, no sequencing needed |
| Icon library | Install Heroicons / lucide-react | Keep Unicode ⚙ gear (already in KlasTabStrip) | Phase scope doesn't include icon library migration |

**Key insight:** This phase is CSS-first. The complexity lives in the spider chart JSX refactor — everything else is CSS property changes and lightweight React state additions.

---

## Hover & Transition Audit (POL-04)

### Confirmed Gaps — Missing CSS Rules

All four gaps verified by searching `src/index.css` (1205 lines total, sections 1–25 enumerated):

| # | Selector | Current State | Missing Rule | Fix |
|---|----------|---------------|--------------|-----|
| G1 | `.dg-leerlijn-select:hover` | `:focus` present (line 1128); NO `:hover` | `border-color` change on hover | Add `.dg-leerlijn-select:hover { border-color: var(--accent-border); }` |
| G2 | `.settings-number-input:hover` | `:focus` present (line 1181); NO `:hover` | `border-color` change on hover | Add `.settings-number-input:hover { border-color: var(--accent-border); }` |
| G3 | `.toggle-switch:hover .toggle-track:not(.on)` | Base `.toggle-track` present (line 1034); NO hover | background shift for off-state hover | Add `.toggle-switch:hover .toggle-track:not(.on) { background: var(--text-faint); }` |
| G4 | `.detail-section:hover` | Base `.detail-section` present (line 468) with `box-shadow: var(--shadow-sm)`; NO hover | shadow lift for all `.detail-section` cards including settings page sections | Add `.detail-section:hover { box-shadow: var(--shadow-md); transition: box-shadow var(--transition-base); }` |

### Present States (no action needed)

| Selector | Line | Status |
|----------|------|--------|
| `.dg-settings-row:hover td` | 1097 | PRESENT — `background: var(--accent-light)` |
| `.dg-naam-input:focus` | 1109 | PRESENT — focus ring + border |
| `.bpv-bar-fill` width transition | 1204 | PRESENT — `transition: width 300ms ease` |
| `.klas-tile:hover` | 416 | PRESENT — shadow lift + transform |
| `.kpi-tile:hover` | 354 | PRESENT — shadow lift |
| `.nav-tab:hover` | 265 | PRESENT — background + border |
| `.sort-btn:hover` | 322 | PRESENT — accent-light background |

### Spider Chart Hit Circles (new in Phase 19)

```css
/* New rule for spider tooltip hit areas */
.spider-hit-circle {
  fill: transparent;
  cursor: pointer;
  transition: fill var(--transition-fast);
}
.spider-hit-circle:hover {
  fill: rgba(0, 0, 0, 0.08);
}
```

### Spider Tooltip CSS

```css
/* New rule to add to src/index.css section 9 (or new section 26) */
.spider-tooltip {
  position: absolute;
  background: var(--bg-surface);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
  transform: translate(-50%, -100%);
  opacity: 1;
  transition: opacity var(--transition-fast);
}
```

### Reduced Motion

The `@media (prefers-reduced-motion: reduce)` block at **line 168** of `src/index.css` already zeroes all transition-duration and animation-duration globally. No exceptions needed for Phase 19 additions.

---

## Responsive Overflow Audit (POL-03)

Audit based on source code verification. Minimum supported width: 1024px.

### KlasOverzicht (`src/components/KlasOverzicht.tsx`)

**`#klas-grid` (verified from `src/index.css` line 376):**
```css
/* Current — already responsive */
grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
```
At 1024px with padding: `1024 - 40px (padding) = 984px usable`. `984 / 210 = 4.68` — 4 tiles fit. No overflow. Status: **OK, no change needed**.

**`.klas-toolbar` (verified from `src/index.css` line 280):**
```css
/* Current */
display: flex; align-items: center; gap: 0.625rem; padding: 1.25rem 1.25rem 0.75rem; flex-wrap: wrap;
```
`flex-wrap: wrap` already present (line 286). Status: **OK, no change needed**.

### LeerlingTegel (`src/components/LeerlingTegel.tsx`)

**No spider card in LeerlingTegel** — the `maxWidth: 180px` mentioned in the additional context is actually in `SpiderChartCard.tsx` line 47 (inline style on `.spider-card`). LeerlingTegel only renders name, status badge, and mini verzuim bar. The tile itself uses the grid cell width. Status: **OK**.

### DetailWeergave — Spider Section (verified from `src/components/DetailWeergave.tsx` lines 134–159)

```tsx
/* Current — spider row */
<div className="spider-charts-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start' }}>
  <SpiderChartCard ... />  {/* 3 cards */}
</div>
```
`flexWrap: 'wrap'` is already present. Each `SpiderChartCard` has `maxWidth: 180px`. At 1024px with `1280px max-width` container and `2rem 1rem` padding:
- Usable width: `1024 - 32px = 992px`
- 3 cards × 180px + 2 gaps × 16px = 572px — fits in 992px.
Status: **OK, no change needed**. The inline style in `SpiderChartCard.tsx` (`maxWidth: 180px`) should be converted to `width: 100%; max-width: 180px` per UI-SPEC to handle edge cases.

### DetailWeergave — `.aanvullend-grid`

Check required. The 2-column grid may compress. Fix if needed: `min-width: 0` on grid children.

### SettingsPage — `.settings-page`

`max-width: 640px; margin: 0 auto` (from Phase 17 CSS — already responsive). At 1024px the settings page has space. Status: **OK, no change needed**.

### DeelgebiedenMatrix — `.dg-settings-table-wrap` (verified from `src/index.css` lines 1080–1085)

```css
/* Current */
.dg-settings-table-wrap {
  max-height: 420px;
  overflow-y: auto;
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
}
```
The table has `overflow-y: auto` — internal vertical scroll only. No `overflow-x` set, so horizontal overflow of the table bleeds out. At 1024px this is contained by its parent (settings page at `max-width: 640px`). Status: **Likely OK**, but verify the wrapper does not bleed at 1024px since the settings column is narrower.

### BpvProgressSection (verified from `src/components/BpvProgressSection.tsx`)

```tsx
/* Current bar row */
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <div className="bpv-bar-track">...</div>
  <span>...</span>
</div>
```
`.bpv-bar-track` uses `flex: 1` (from `src/index.css` line 1193) — shrinks/grows to fill available width. No fixed widths. Status: **OK, no change needed**.

### Overflow Risk Summary

| Component | Risk | Action |
|-----------|------|--------|
| `#klas-grid` | None — auto-fill minmax | None |
| `.klas-toolbar` | None — flex-wrap present | None |
| `.klas-tile` | None — grid sizing | None |
| Spider row (DetailWeergave) | Low — flex-wrap present; 3×180px fits at 992px | Convert `maxWidth: 180px` to `width: 100%; max-width: 180px` in SpiderChartCard |
| `.aanvullend-grid` | Medium — 2-col grid may compress | Add `min-width: 0` on children; audit in browser |
| `.settings-page` | None — max-width: 640px | None |
| `.dg-settings-table-wrap` | Low — contained within settings max-width | Verify in browser |
| BpvProgressSection | None — flex: 1 on bar track | None |

---

## CSS Token Audit

### Current Token State (verified from `src/index.css` lines 14–108)

**Accent tokens (to be replaced):**
- `--accent: #4F46E5` (indigo — lines 16)
- `--accent-hover: #4338CA` (line 17)
- `--accent-light: #EEF2FF` (line 18)
- `--accent-border: #C7D2FE` (line 19)
- `--accent-text: #3730A3` (line 20)
- `--border-focus: #4F46E5` (line 37)
- Legacy aliases `--accent-blue` etc. at lines 85–89 — preserve (they reference `var(--accent)` and will pick up new value automatically)

**Shadow tokens (to be updated — Material elevation):**
- `--shadow-xs: 0 1px 2px rgba(15,23,42,0.06)` — preserve (line 40)
- `--shadow-sm: 0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)` — update (line 41)
- `--shadow-md: 0 4px 12px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.06)` — update (line 42)
- `--shadow-lg: 0 10px 24px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06)` — update (line 43)

**Transition tokens (preserve — correct values):**
- `--transition-fast: 150ms ease` (line 53)
- `--transition-base: 200ms ease` (line 54)
- `--transition-slow: 300ms ease` (line 55)

**Font-family (line 181 — to be replaced):**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```
Target:
```css
font-family: 'Industry', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Google Fonts import (line 9 — to be replaced):**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```
Replace with `@font-face` blocks (see Typography section below).

**Dark mode block structure (lines 110–166):**
Two `body.dark { }` blocks already exist — one for accent/surface/text tokens (lines 111–141), one for `--dm-*` matrix tokens (lines 143–155). Phase 19 adds accent overrides to the first block. The dark shadow values also need updating to match the new light-mode proportions.

---

## Typography System

### Industry Font Files (verified — directory listing confirmed)

**Location:** `C:\Users\rafae\Desktop\bestanden voor dashboard testing\design\industry font\`

**Available OTF files (full list, verified):**
- `IndustryTest-Book.otf` — weight 400 (Book/Regular)
- `IndustryTest-Bold.otf` — weight 700 (Bold)
- `IndustryTest-Demi.otf` — weight 600 (Demi)
- `IndustryTest-Medium.otf` — weight 500
- `IndustryTest-Light.otf` — weight 300
- (+ italic variants for all weights)

**Minimum files to copy:** `IndustryTest-Book.otf`, `IndustryTest-Bold.otf`, `IndustryTest-Demi.otf` (for weight-600 elements: `.btn`, `.nav-tab.active`).

**Target path:** `src/assets/fonts/` (within Vite/Tauri bundle boundary).

### @font-face Implementation

```css
/* Source: 19-UI-SPEC.md specification */
/* To be placed BEFORE :root block in src/index.css, replacing line 9 Google Fonts import */
@font-face {
  font-family: 'Industry';
  src: url('./assets/fonts/IndustryTest-Book.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Industry';
  src: url('./assets/fonts/IndustryTest-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Industry';
  src: url('./assets/fonts/IndustryTest-Demi.otf') format('opentype');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
```

### Typography Scale (from UI-SPEC)

| Role | Size | Weight | Line Height | Applies To |
|------|------|--------|-------------|------------|
| Body / flat text | 12px (9pt) | 400 | 1.56 | Table cells, section content, general body copy |
| Label / sub-header | 16px (12pt) | 400 | 1.17 | Section sub-headers, form labels, nav tabs |
| Intro text | 16px (12pt) | 400 | 1.33 | Settings section descriptions |
| KPI value | 24px (1.5rem) | 700 | 1.10 | `.kpi-value` — no change (already 1.5rem) |
| Student name (detail) | 20px | 700 | — | `.detail-student-naam` (currently 1.2rem) |
| Settings h1 | 20px | 700 | — | `.settings-header h1` (currently 1.25rem) |
| Section titles | 11px (0.6875rem) | 700 | — | `.detail-section-title` — uppercase label style, PRESERVE as-is |

**Note:** The `html, body, #root` base `font-size: 16px` is already set (line 183). The `font-family` change at line 181 is the primary action. Individual `font-size` overrides are only needed where the typography spec diverges significantly from current values.

---

## Corporate Identity — Nav Header

### Logo Integration

**Assets status (from UI-SPEC):**
- Light mode logo: Full "cios ZUIDWEST-NL" — provided as image. Must be exported to `src/assets/logo-light.svg` (or `.png`).
- Dark mode logo: "cios" mark only — provided as image. Must be exported to `src/assets/logo-dark.svg` (or `.png`).
- Current `src/assets/` contains only `react.svg` — both logo files need to be added.

**KlasTabStrip.tsx changes (verified from source — current `nav` has no logo):**
```tsx
// Add isDark prop to interface
interface KlasTabStripProps {
  // ... existing props
  isDark: boolean;  // NEW — to switch logo variant
}

// Add before the klas tab buttons:
<img
  src={isDark ? '/logo-dark.svg' : '/logo-light.svg'}
  alt="CIOS Zuidwest logo"
  style={{ height: '36px', width: 'auto', marginRight: '16px' }}
/>
```

**App.tsx:** Must pass `isDark` prop to `KlasTabStrip`. Source of truth for dark mode is the `body.dark` class or the theme state in `SettingsPage`. App.tsx should read the existing theme state (currently managed in `SettingsPage.tsx` — may need to be lifted to App-level state).

### Nav Diagonal Stripe

**`#main-nav` current CSS (verified from `src/index.css` line 236):**
```css
#main-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 1rem;
  background: var(--nav-bg);
  border-bottom: 1.5px solid var(--border-default);
  min-height: 52px;
  flex-wrap: wrap;
  box-shadow: var(--shadow-xs);
  position: sticky;
  top: 0;
  z-index: 50;
}
```

`position: sticky` already set. Need to add `position: relative; overflow: hidden` for the `::after` pseudo-element. Since `position: sticky` takes precedence for the scroll behavior and `position: relative` is inherited within the sticky context, the nav needs:

```css
/* Add to #main-nav in src/index.css */
#main-nav {
  /* ... existing ... */
  overflow: hidden;  /* contain the ::after diagonal */
}

#main-nav::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 120px; height: 52px;
  background: linear-gradient(to bottom-left, #009FE3 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}
```

Nav tabs must have `position: relative; z-index: 1` to render above the `::after` stripe. The `nav-tab` class already has no explicit z-index — add `z-index: 1` to `.nav-tab`.

---

## Common Pitfalls

### Pitfall 1: Spider Test Breakage After JSX Refactor

**What goes wrong:** `tests/spider.test.ts` line 15 asserts `typeof svg === 'string'`. After refactor, `buildSpiderSVG` returns `JSX.Element`. The test suite will fail on `spider.test.ts` immediately.
**Why it happens:** The test was written for the current string-return implementation.
**How to avoid:** Wave 0 must include updating spider tests before the refactor. Use `React.isValidElement(svg)` instead of `typeof svg === 'string'`. Use `@testing-library/react` or `renderToStaticMarkup` to check SVG structure.
**Warning signs:** Red test output mentioning `'string' !== 'object'` in the spider test file.

### Pitfall 2: Dark Mode Theme State Not Lifted to App

**What goes wrong:** `KlasTabStrip` needs `isDark` to switch logos. The dark mode state is currently owned by `SettingsPage.tsx` and toggled via `body.classList`. If App.tsx doesn't track dark mode state, it cannot pass the `isDark` prop.
**Why it happens:** Phase 17 implemented dark mode as a self-contained SettingsPage behavior.
**How to avoid:** Lift `isDark` to App.tsx state (read from plugin-store on mount, update on toggle). Pass down to KlasTabStrip. SettingsPage receives `isDark` + `onToggleDark` as props.
**Warning signs:** Logo always shows light variant even in dark mode.

### Pitfall 3: Hardcoded rgba() Focus Ring Values

**What goes wrong:** `.dg-naam-input:focus` (line 1112) and `.settings-number-input:focus` (line 1183) use hardcoded `rgba(79, 70, 229, 0.12)` (old indigo). After accent token update, the border-focus ring uses the new blue but the box-shadow rgba stays old indigo.
**Why it happens:** CSS custom properties don't work inside `rgba()` for the alpha version — the color was hardcoded.
**How to avoid:** Change to `rgba(0, 159, 227, 0.12)` (new CIOS blue) in both rules. Also update `.klas-zoek:focus` line 304.
**Warning signs:** Focus rings appear as indigo mismatch on blue-bordered inputs.

### Pitfall 4: `position: sticky` + `overflow: hidden` Conflict

**What goes wrong:** Adding `overflow: hidden` to `#main-nav` may break the `position: sticky` behavior in some browsers. A sticky element's stickiness depends on its scroll container not having `overflow: hidden`.
**Why it happens:** CSS spec quirk: `overflow: hidden` on a sticky element doesn't affect its sticky behavior (the overflow is on the element itself, not its scroll container). This is safe for the nav.
**How to avoid:** The nav's sticky positioning is set on `#main-nav` itself, while `overflow: hidden` controls what overflows *inside* the nav. These are different axes — the sticky behavior is unaffected. Verify in Tauri WebView after implementation.
**Warning signs:** Nav no longer sticks at top when scrolling.

### Pitfall 5: OTF Relative Path in CSS

**What goes wrong:** The `@font-face` `url()` path is relative to the CSS file location. If `src/index.css` uses `./assets/fonts/...`, this resolves relative to `src/`, which is correct. But if the path is wrong (e.g., `../assets/fonts/`), fonts silently fail and fall back to system sans-serif.
**Why it happens:** Vite resolves CSS `url()` paths relative to the CSS file.
**How to avoid:** Use `./assets/fonts/IndustryTest-Book.otf` (relative to `src/index.css`). Verify font is loaded in DevTools Network tab after implementation.
**Warning signs:** Text still renders in system sans-serif; DevTools shows 404 for font file.

### Pitfall 6: Spider Tooltip SVG Coordinate → DOM Mapping

**What goes wrong:** SVG uses a `viewBox="0 0 200 200"` but renders at `width="160" height="160"`. Mouse position coordinates from `onMouseEnter` are in SVG coordinate space (0–200). The tooltip `top`/`left` CSS values need DOM pixel coordinates (0–160).
**Why it happens:** SVG has an internal coordinate system separate from DOM layout.
**How to avoid:** Scale coordinates: `domX = svgX * (160/200)`, `domY = svgY * (160/200)`. Or use `getBoundingClientRect()` from the `<circle>` element's `onMouseEnter` event to get DOM coordinates directly.
**Warning signs:** Tooltips appear offset or in wrong position relative to hover targets.

---

## Code Examples

### Spider JSX Refactor — Axis Label Element

```tsx
// Source: 19-UI-SPEC.md specification + utils/spider.ts math (verified)
// Place after grid rings/lines, before data polygon:
axes.map((axis, i) => {
  const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
  const labelX = centerX + Math.cos(angle) * (maxRadius + 12);
  const labelY = centerY + Math.sin(angle) * (maxRadius + 12);
  return (
    <text
      key={`label-${i}`}
      x={labelX}
      y={labelY}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="10"
      fill="var(--text-secondary)"
    >
      {axis.label}
    </text>
  );
})
```

### Spider JSX Refactor — Hit Circle Element

```tsx
// Source: 19-UI-SPEC.md specification
// Placed at data polygon vertex position (score radius, not maxRadius)
axes.map((axis, i) => {
  const score = scores[axis.key] ?? null;
  const radiusRatio = scoreToRadius(score);
  const radius = radiusRatio * maxRadius;
  const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
  const x = centerX + Math.cos(angle) * radius;
  const y = centerY + Math.sin(angle) * radius;
  return (
    <circle
      key={`hit-${i}`}
      cx={x}
      cy={y}
      r={6}
      className="spider-hit-circle"
      onMouseEnter={() => onHover?.({ axisIndex: i, x: x * (160/200), y: y * (160/200) })}
      onMouseLeave={() => onHover?.(null)}
    />
  );
})
```

### Score Display Formatter

```typescript
// Source: 19-UI-SPEC.md copywriting contract
function scoreDisplay(score: string | null): string {
  switch (score) {
    case 'onvoldoende': return 'Onvoldoende';
    case 'voldoende':   return 'Voldoende';
    case 'goed':        return 'Goed';
    case 'excellent':   return 'Excellent';
    default:            return 'Geen score';
  }
}
```

---

## Wave Planning Recommendation

Based on dependency analysis of the identified work items:

### Wave 0: Test Infrastructure (prerequisite)
- Update `tests/spider.test.ts` — change string assertions to `React.isValidElement` checks
- Add tests for axis label rendering and tooltip state
- Dependency: must complete before Wave 2

### Wave 1: CSS Tokens + Typography (no component changes)
- Update 6 accent tokens in `:root` + add dark mode variants
- Update shadow tokens (Material elevation values)
- Update 3 hardcoded rgba focus ring values (lines 304, 1112, 1183)
- Add `@font-face` blocks (replace Google Fonts import at line 9)
- Update `font-family` on `html, body, #root` (line 181)
- Copy OTF font files to `src/assets/fonts/`
- Add nav `::after` diagonal stripe CSS
- Dependency: unblocked; proceed immediately

### Wave 2: Spider Chart Refactor (highest complexity)
- Refactor `utils/spider.ts` `buildSpiderSVG` to return `JSX.Element`
- Add `<text>` axis labels and `<circle>` hit areas
- Update `SpiderChartCard.tsx` — remove `dangerouslySetInnerHTML`, add tooltip state + rendering
- Add `.spider-tooltip` and `.spider-hit-circle` CSS to `src/index.css`
- Dependency: Wave 0 (tests must be updated first)

### Wave 3: Responsive Fixes + Hover Gaps + Animation (lowest risk)
- Add 4 missing hover CSS rules (G1–G4)
- Fix `SpiderChartCard` inline style (`maxWidth` → `width: 100%; max-width: 180px`)
- Audit `.aanvullend-grid` at 1024px
- Add `.view-slide-in-right` + `@keyframes` to CSS
- Add `settingsOpenCount` state to App.tsx + apply animation class
- Lift dark mode state to App.tsx; add `isDark` prop to KlasTabStrip
- Add logo `<img>` to KlasTabStrip + export logo files to `src/assets/`
- Add `overflow: hidden` to `#main-nav`; add `z-index: 1` to `.nav-tab`
- Add `position: relative` to `.spider-card` (if not done in Wave 2)
- Dependency: Wave 1 (CSS structure must be extended before adding more rules)

---

## Environment Availability

Step 2.6: SKIPPED — Phase 19 is purely code/CSS/asset changes. No external CLI tools, databases, or services beyond the existing Tauri/npm/Rust toolchain (already verified operational in Phase 15).

Font files are at `C:\Users\rafae\Desktop\bestanden voor dashboard testing\design\industry font\` — confirmed present (16 OTF files verified). Copy action required at Wave 1 execution time.

Logo files: provided as images in design session. Export to SVG/PNG required before Wave 3 execution.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vite.config.ts` (existing) |
| Quick run command | `npm test -- --reporter=verbose tests/spider.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POL-02 | `buildSpiderSVG` returns `JSX.Element` | unit | `npm test -- tests/spider.test.ts` | Yes — needs update in Wave 0 |
| POL-02 | Axis labels rendered as `<text>` elements | unit | `npm test -- tests/spider.test.ts` | Partial — needs new test cases |
| POL-02 | Tooltip appears on hover at correct position | manual | Tauri DevTools visual check | Manual only |
| POL-03 | No horizontal scroll at 1024px on all views | manual | Tauri window resize + scrollWidth check | Manual only |
| POL-04 | Hover states present on all 4 gap elements | manual | Visual check in Tauri | Manual only |

### Sampling Rate

- **Per task commit:** `npm test -- tests/spider.test.ts` (fast, covers the highest-risk change)
- **Per wave merge:** `npm test` (full 89-test suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/spider.test.ts` — 4 existing tests need string→JSX assertions updated; 2 new tests for axis labels and hit circles
- [ ] No new test files needed — POL-03 and POL-04 are visual/manual verifications

---

## Security Domain

ASVS categories applicable to Phase 19:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 19 has no auth changes |
| V3 Session Management | no | No session changes |
| V4 Access Control | no | No access control changes |
| V5 Input Validation | yes (minimal) | Spider tooltip content is computed from enum values (`scoreToRadius` switch) — no user input embedded in SVG |
| V6 Cryptography | no | No crypto changes |

**Security note on spider refactor:** The existing `SpiderChartCard.tsx` security comment (lines 41–44) documents the SVG string injection defense. The JSX refactor eliminates this surface entirely. The `sanitizeCssVar()` function in `utils/spider.ts` (line 9) strips non-alphanumeric characters from CSS variable names — this can be preserved in the JSX version or removed since JSX attribute values are automatically escaped. Axis labels come from `dg.label` schema values (trusted, not user-editable). Tooltip text is enum-derived. No new injection surface introduced.

---

## Assumptions Log

All claims in this research were verified directly from source files or confirmed specification documents. No unverified assumptions.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `isDark` prop lift to App.tsx is feasible without breaking SettingsPage | Nav Header | If SettingsPage has complex internal dark mode state, refactoring may be more involved than one prop lift |
| A2 | OTF fonts render correctly in Tauri's WebView (Chromium-based) | Typography | OTF format is broadly supported in modern Chromium; unlikely to fail |

---

## Open Questions (RESOLVED)

1. **Logo export format (SVG vs PNG)**
   - What we know: Logo images were provided in the design session as raster images.
   - What's unclear: Whether the user's source images can be exported as true SVG (vector) or are raster-only.
   - Recommendation: Export as PNG if SVG is not available from source. At 36px height, a PNG @2x (72px) is sufficient for Tauri's single display.

2. **`.aanvullend-grid` at 1024px**
   - What we know: It's a 2-column grid in DetailWeergave but the CSS rule was not directly inspected.
   - What's unclear: The exact `grid-template-columns` value and whether it has a minimum column width.
   - Recommendation: Implementer reads `.aanvullend-grid` CSS rule before Wave 3 and adds `min-width: 0` to children if needed.

3. **Dark mode theme state lift scope**
   - What we know: Phase 17 owns dark mode in SettingsPage; App.tsx has no `isDark` state.
   - What's unclear: Whether SettingsPage reads dark mode from plugin-store on mount and what the exact state ownership is.
   - Recommendation: Planner should specify: lift to App.tsx (load from plugin-store in `useEffect`) → pass `isDark` + `onToggleDark` to SettingsPage and `isDark` to KlasTabStrip.

---

## Sources

### Primary (HIGH confidence — directly verified from source files)

- `utils/spider.ts` — full file read; current function signature, return type, math, security context
- `src/components/SpiderChartCard.tsx` — full file read; `dangerouslySetInnerHTML` location (line 48), security comment (lines 41–44), `maxWidth: 180px` inline style (line 47)
- `src/index.css` — full file read (1205 lines); all token values, line numbers, gap analysis
- `src/App.tsx` — full file read; view state type, handler functions, current lack of `settingsOpenCount`
- `src/components/KlasTabStrip.tsx` — full file read; current props, nav structure
- `src/components/DetailWeergave.tsx` — full file read; spider row layout, section structure
- `src/components/BpvProgressSection.tsx` — full file read; bar track flex layout, no fixed widths
- `src/components/KlasOverzicht.tsx` — full file read; toolbar, grid, KPI strip
- `src/components/LeerlingTegel.tsx` — full file read; no spider card, tile structure
- `tests/spider.test.ts` — full file read; 4 existing test assertions (all string-based, need updating)
- `.planning/phases/19-ui-polish/19-CONTEXT.md` — all locked decisions
- `.planning/phases/19-ui-polish/19-UI-SPEC.md` — confirmed color values, typography conversions, nav design, tooltip spec
- Font directory listing — `IndustryTest-Book.otf`, `IndustryTest-Bold.otf`, `IndustryTest-Demi.otf` confirmed present (+ 13 additional variants)
- `src/assets/` directory listing — only `react.svg` present; `fonts/` subdirectory does not exist yet

### Secondary (MEDIUM confidence)

- Phase 17 and 18 CONTEXT.md files — CSS class names, component patterns, dark mode implementation approach

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all existing
- Architecture: HIGH — verified directly from source files
- Spider refactor: HIGH — full source read, exact line numbers documented
- CSS gaps: HIGH — grep + source verified; 4 gaps confirmed missing, line numbers for present rules
- Responsive audit: HIGH for most components; MEDIUM for `.aanvullend-grid` (CSS rule not directly inspected)
- Typography: HIGH — OTF files confirmed present, conversion table from UI-SPEC
- Font loading path: HIGH — Vite CSS `url()` resolution behavior is well-established

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (stable stack, no external dependencies)
