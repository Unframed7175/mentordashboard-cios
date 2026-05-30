---
status: resolved
slug: klasoverzicht-unstyled
trigger: "KlasOverzicht renders as plain unstyled text — student list has no card layout, no CSS applied"
created: 2026-05-16T00:00:00Z
updated: 2026-05-16T00:30:00Z
---

## Symptoms

- **Expected:** KlasOverzicht shows a grid of styled student tiles (cards) with name, status badge, and verzuim percentage
- **Actual:** Student list renders as plain text — names and "Let op"/"Onbekend" labels appear inline with no card styling, no grid, no visual hierarchy. KlasTabStrip buttons also appear as unstyled plain HTML buttons.
- **Screenshot observation:** "Naam | Status | Verzuim" column headers appear as unstyled text buttons. Student names appear as a plain text list with status inline. DetailWeergave (student detail) appears correctly styled with colored table headers.
- **Timeline:** Discovered during Phase 08 UAT (2026-05-16) running `npm run dev`
- **Reproduction:** Run `npm run dev`, create a class, import student PDFs, view KlasOverzicht

## Current Focus

hypothesis: RESOLVED
next_action: none
test: n/a
expecting: n/a

## Evidence

- timestamp: 2026-05-16T00:05:00Z
  finding: >
    src/App.css is the unmodified Vite scaffold stylesheet (logo hover effects, generic button/input
    styles) — no app-specific CSS classes defined anywhere.
- timestamp: 2026-05-16T00:06:00Z
  finding: >
    main.tsx and App.tsx import no CSS file at all. The import "./App.css" line that Vite generates
    was removed and never replaced with app styles.
- timestamp: 2026-05-16T00:07:00Z
  finding: >
    src/index.css does not exist. Only one CSS file in src/: App.css (scaffold only).
- timestamp: 2026-05-16T00:08:00Z
  finding: >
    KlasOverzicht, LeerlingTegel, KlasTabStrip use only CSS classNames (klas-tile, nav-tab,
    kpi-strip, sort-btn, status-badge, mini-verzuim-bar, etc.) — none defined anywhere.
- timestamp: 2026-05-16T00:09:00Z
  finding: >
    DetailWeergave is styled because it uses extensive inline style props (maxWidth, margin, padding,
    display flex, etc.) — not CSS classes. That is why detail view looks styled while overview does not.
- timestamp: 2026-05-16T00:10:00Z
  finding: >
    The original vanilla JS app stored all CSS inside index.html <style> blocks with CSS custom
    properties. Phase 14 (React migration) ported all TSX components but never ported the stylesheet.

## Eliminated

- CSS modules / Tailwind missing: N/A — app uses plain CSS by design
- Import errors at runtime: no error, file simply doesn't exist
- Scoping/specificity conflict: no competing rules — the styles are completely absent

## Resolution

root_cause: >
  The app-specific stylesheet was never created during the Phase 14 React/Vite migration.
  All CSS was originally embedded in index.html <style> blocks in the vanilla JS app.
  When components were ported to TSX, the CSS was not ported. No CSS file was imported in
  main.tsx or App.tsx. Class names like klas-tile, nav-tab, status-badge, sort-btn, kpi-strip,
  mini-verzuim-bar, etc. existed in JSX but had no definitions anywhere.
  DetailWeergave appeared styled only because it uses inline style props throughout.

fix: >
  Created src/index.css with all required CSS: design tokens (:root variables for CIOS Phase 09
  colour system), global reset, nav tab strip, KPI strip, tile grid, LeerlingTegel card styles,
  status badges, mini verzuim bar, detail section cards, buttons, and all sub-component classes.
  Added `import "./index.css"` to src/main.tsx so the stylesheet loads globally at app start.

verification: >
  Run `npm run dev` — KlasTabStrip should render as a dark navy nav bar with styled tabs,
  KlasOverzicht should show a grid of white card tiles with coloured left borders, status badges,
  and mini verzuim bars. Sort buttons should be styled. KPI strip should show numbered tiles.

files_changed:
  - src/index.css (created — 350+ lines, all app CSS)
  - src/main.tsx (added `import "./index.css"`)
