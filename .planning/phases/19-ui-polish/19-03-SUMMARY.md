---
phase: 19
plan: "03"
subsystem: spider-chart
tags: [spider-chart, jsx-refactor, tooltip, accessibility, dangerouslySetInnerHTML]
dependency_graph:
  requires: [19-01, 19-02]
  provides: [JSX spider chart with axis labels and tooltips, spider CSS rules]
  affects: [utils/spider.tsx, src/components/SpiderChartCard.tsx, src/index.css]
tech_stack:
  added: [JSX.Element return type, React.useState tooltip, HoverState type]
  patterns: [JSX array map for SVG children, hit circle onMouseEnter/onMouseLeave, CSS position relative + absolute tooltip]
key_files:
  created: [utils/spider.tsx]
  modified: [src/components/SpiderChartCard.tsx, src/index.css, tests/spider.test.ts]
decisions:
  - "width: 160px on .spider-card (not 100%/max-width: 180px) — matches SVG width exactly for zero-offset tooltip coordinate mapping"
  - "HoverState coordinates scaled by 160/200 from SVG viewBox space to rendered pixel space"
  - "scoreDisplay defined as local helper in SpiderChartCard (not imported) — acceptable for Phase 19 scope"
  - "Test fix: HTML-encode axis[0].label before comparing renderToStaticMarkup output (V&A → V&amp;A)"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  files_changed: 4
---

# Phase 19 Plan 03: Spider Chart JSX Refactor Summary

**One-liner:** Spider chart refactored from string-returning `buildSpiderSVG` to JSX.Element with axis labels, hit circle tooltips, and `dangerouslySetInnerHTML` removed from SpiderChartCard.

## What Was Built

**Task 1 — utils/spider.ts → utils/spider.tsx:**

- Renamed `utils/spider.ts` to `utils/spider.tsx` (required by tsconfig `"jsx": "react-jsx"`)
- Added `import React from 'react'` at top
- Exported `HoverState` type: `{ axisIndex: number; x: number; y: number } | null`
- Changed `buildSpiderSVG` return type from `string` to `JSX.Element`
- Added optional `onHover?: (state: HoverState) => void` parameter
- Converted string concatenation loops to JSX `.map()` arrays: `gridRings`, `gridLines`
- Added new `axisLabels`: `<text>` elements at `maxRadius + 12` offset for each axis (D-10)
- Added new `hitCircles`: `<circle className="spider-hit-circle">` with `onMouseEnter`/`onMouseLeave` callbacks (D-11)
- Coordinates in callbacks scaled: `cx * (160/200)` converts SVG viewBox space to rendered pixel space
- Preserved: `sanitizeCssVar`, `scoreToRadius`, angle formula, camelCase SVG attributes (strokeWidth, fillOpacity)
- Fixed `--spider-prof-handelen-stroke` from indigo `#4F46E5` → CIOS blue `#009FE3` (Plan 02 leftover)
- All 7 spider tests GREEN

**Task 2 — SpiderChartCard.tsx + index.css:**

- Changed `import React` to `import React, { useState }` 
- Added `const [tooltip, setTooltip] = useState<{ axisIndex: number; x: number; y: number } | null>(null)`
- Added local `scoreDisplay(score)` helper (onvoldoende/voldoende/goed/excellent → display strings)
- Removed: security comment block (lines 41-44), `rawSvg` const, `!rawSvg` null check, script-strip regex, `dangerouslySetInnerHTML`
- Replaced `style={{ maxWidth: '180px' }}` inline style with `className="spider-card"` (CSS owns layout)
- New return: `<div className="spider-card">` containing: SVG JSX, conditional tooltip div, leerlijn-title div
- Appended Section 26 to `src/index.css`:
  - `.spider-card { width: 160px; position: relative; }`
  - `.spider-tooltip { position: absolute; ... transform: translate(-50%, -100%); ... }`
  - `.spider-hit-circle { fill: transparent; cursor: pointer; ... }`
  - `.spider-hit-circle:hover { fill: rgba(0, 0, 0, 0.08); }`

## Verification Results

- `npm test -- tests/spider.test.ts`: **7/7 passed**
- `npm test`: **93 passed, 0 failed** (full suite — no regressions)
- `npm run build`: **Succeeded** (Vite + Tauri — .msi and .exe bundles produced)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test assertion for HTML-encoded axis labels**
- **Found during:** Task 1 — first test run
- **Issue:** Test `axis labels worden gerenderd als text elementen` checked `html.toContain(axes[0].label)` where `axes[0].label = 'V&A'`. `renderToStaticMarkup` HTML-encodes `&` → `&amp;`, so the output contained `V&amp;A`, not `V&A`. The test always failed for labels with `&`.
- **Fix:** Changed assertion to HTML-encode the expected string before comparing: `axes[0].label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')`
- **Files modified:** `tests/spider.test.ts`
- **Commit:** `d4cbce2`

## Known Stubs

None — all data is wired. Tooltip content uses live axis labels and scoreDisplay output from actual scores.

## Threat Surface Scan

T-19-04 (Injection/XSS): Mitigated — `dangerouslySetInnerHTML` removed. JSX rendering auto-escapes all values. Axis labels (axis.label) come from trusted DEELGEBIEDEN schema. Tooltip text composed from enum-derived `scoreDisplay` values. No user input embedded.

T-19-05 (Tampering): Mitigated — `sanitizeCssVar` preserved and still applied to `fillVar`/`strokeVar` before embedding in `var(...)` attribute strings.

No new threat surface introduced beyond the plan's threat model.

## Self-Check: PASSED

- [x] `utils/spider.tsx` exists and contains `JSX.Element`, `HoverState`, `axisLabels`, `hitCircles`, `spider-hit-circle`, `onMouseEnter`, `onMouseLeave`
- [x] `utils/spider.ts` deleted
- [x] `src/components/SpiderChartCard.tsx` does NOT contain `dangerouslySetInnerHTML`
- [x] `src/components/SpiderChartCard.tsx` contains `useState`, `setTooltip`, `scoreDisplay`, `Geen scores beschikbaar`
- [x] `src/index.css` contains `.spider-tooltip`, `.spider-hit-circle`, `.spider-card { width: 160px`
- [x] Commit `d4cbce2` (Task 1) exists
- [x] Commit `07b0926` (Task 2) exists
- [x] All 7 spider tests GREEN; full suite 93/93 passed; build succeeded
