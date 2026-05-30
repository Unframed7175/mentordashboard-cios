---
status: resolved
slug: spiderweb-chart-broken
trigger: "Spiderweb (spinnenweb) chart area is blank — chart not rendering in student detail view"
created: 2026-05-16T00:00:00Z
updated: 2026-05-16T00:00:00Z
---

## Symptoms

- **Expected:** Student detail view shows a spiderweb/radar chart visualising scores per deelgebied
- **Actual:** The spiderweb chart area is blank — no chart renders, just empty space
- **Timeline:** Discovered during Phase 08 UAT (2026-05-16) running `npm run dev`
- **Reproduction:** Run `npm run dev`, import PDFs, open student detail, scroll to "Spiderweb overzicht" section

## Current Focus

hypothesis: resolved — two compounding issues in buildSpiderSVG
next_action: n/a
test: n/a
expecting: n/a

## Evidence

- timestamp: 2026-05-16T00:00:00Z
  file: utils/spider.ts
  observation: buildSpiderSVG generated SVG with no width/height attributes — only viewBox="0 0 200 200". In Tauri WebView without explicit dimensions the SVG collapses to zero height.
  conclusion: chart renders but is invisible (zero-height container)

- timestamp: 2026-05-16T00:00:00Z
  file: utils/spider.ts
  observation: buildSpiderSVG rendered only the data polygon — no concentric grid rings, no axis spokes. Even with non-null scores the chart has no visual frame, making it appear blank on a white background.
  conclusion: even if SVG is visible, chart is unreadable without reference grid

- timestamp: 2026-05-16T00:00:00Z
  file: utils/spider.ts (JSDoc lines 38-41)
  observation: JSDoc incorrectly stated axes should use dg.id as key and scores need conversion. SpiderChartCard.tsx correctly uses dg.label (per D-14-10 fix). JSDoc was misleading, risking future regression.
  conclusion: code correct but documentation wrong — fixed in same PR

- timestamp: 2026-05-16T00:00:00Z
  file: parsers/pdf.ts line 642
  observation: deelgebiedScores initialized with dg.label as key — confirmed matches SpiderChartCard axis keys. Data flow is correct.
  conclusion: key mismatch is NOT the bug; keys do match

## Eliminated

- Key mismatch between axes and scores — SpiderChartCard uses dg.label, pdf.ts stores by dg.label. These match.
- CSS variable missing — --spider-lesgeven etc. are all defined in src/index.css.
- sanitizeCssVar stripping valid chars — hyphens are allowed in the regex, CSS var names pass through correctly.

## Resolution

root_cause: buildSpiderSVG produced an SVG with no width/height attributes, causing it to render at zero height in the Tauri WebView. Additionally, the SVG lacked background grid rings and axis spokes, so even when sized correctly the chart appeared as an invisible or near-invisible polygon on a plain white card.

fix: Added width="160" height="160" to the SVG element. Added four concentric grid ring polygons (at 25/50/75/100% of maxRadius) and axis spoke lines, drawn in a neutral gray before the data polygon. Corrected the misleading JSDoc in buildSpiderSVG that incorrectly described dg.id as the key convention.

verification: tsc --noEmit passes with zero errors. All 43 tests pass (5 skipped, pre-existing). Visual: chart now renders with visible frame and data polygon.

files_changed:
  - utils/spider.ts
