# Phase 31: UI Polish — Nav & Spider - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Visual resize of three specific elements — no logic changes, no new data model:

1. **Nav-banner doubling** — `#main-nav min-height: 52px → 104px` and CIOS logo `36px → 72px` (UI-07)
2. **Nav-stripe scaling** — `.nav-stripe` grows with nav (`height: 100%` instead of hardcoded 52px)
3. **Spider card enlargement** — `.spider-card` width `160px → 280px` with responsive SVG via `viewBox` + `width="100%"` (UI-05)
4. **Section reorder** — `FeedbackActiepuntenSection` moves from Section 4 to absolute last (after BpvProgressSection) in `DetailWeergave.tsx` (UI-06)

**In scope:**
- `src/index.css` — `#main-nav` min-height, `.nav-stripe` height, `.spider-card` width, Section 26 spider card override
- `src/components/KlasTabStrip.tsx` — logo inline style height
- `src/components/DetailWeergave.tsx` — JSX section reorder only (no logic change)
- `utils/spider.ts` — add `viewBox` attribute and `width="100%"` to SVG output

**Out of scope:**
- New data calculations or business logic
- Any import flow changes
- Mac file upload fix (separate bug — deferred)
- Changes to spider chart axis logic or score calculations

</domain>

<decisions>
## Implementation Decisions

### Nav-banner & nav-stripe

- **D-NAV-01:** `#main-nav` — change `min-height: 52px` to `min-height: 104px` in `src/index.css`.
- **D-NAV-02:** Logo — change inline style in `KlasTabStrip.tsx` from `height: '36px'` to `height: '72px'`. Width stays `'auto'`.
- **D-NAV-03:** `.nav-stripe` — change `height: 52px` to `height: 100%`. This ensures the diagonal stripe automatically matches the nav height without requiring a second hardcoded value. The triangle becomes larger and more prominent, filling the full 104px nav height.
- **D-NAV-04:** No hardcoded hex colors in any modified CSS or JSX. Use `var(--accent)` etc.

### Spider card sizing

- **D-SPIDER-01:** `.spider-card { width: 160px }` (Section 26 in `src/index.css`) → `width: 280px`. Fixed at exactly 280px — not fluid. The `spider-charts-row` already has `flexWrap: 'wrap'` in DetailWeergave.tsx so cards wrap naturally on narrow windows.
- **D-SPIDER-02:** The SVG element produced by `SpiderChart.buildSpiderSVG()` in `utils/spider.ts` must have a `viewBox` attribute and `width="100%"` so the chart fills the 280px card container and scales responsively. Read `utils/spider.ts` to understand current SVG output before modifying.

### FeedbackActiepuntenSection position

- **D-FEEDBACK-01:** Move `<FeedbackActiepuntenSection>` to the absolute last JSX position in `DetailWeergave.tsx`, after `<BpvProgressSection>`. Pure JSX reorder — no logic change, no prop changes.

**New detail view section order after this phase:**
1. DoortstroomPrognoseSection
2. RekenenNederlandsSection
3. SpiderChartCard row
4. DeelgebiedenMatrix
5. VerzuimSection
6. BpvProgressSection
7. **FeedbackActiepuntenSection** ← moved to last

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Nav-banner & nav-stripe
- `src/components/KlasTabStrip.tsx` — logo inline style (`height: '36px'`) to update; `.nav-stripe` div already present as DOM element (not pseudo-element)
- `src/index.css` lines 261–285 — `#main-nav` (min-height: 52px) and `.nav-stripe` (height: 52px) blocks to update

### Spider chart
- `utils/spider.ts` — `SpiderChart.buildSpiderSVG()` — read before modifying; must understand current SVG attribute output to add `viewBox` and `width="100%"` correctly
- `src/index.css` §Section 26 (around line 1380) — `.spider-card { width: 160px }` override to update

### Detail view section order
- `src/components/DetailWeergave.tsx` lines 125–175 — all section imports and JSX positions; FeedbackActiepuntenSection is currently at lines 132–133

### Requirements
- `.planning/REQUIREMENTS.md` §UI — UI-05 (spider ≥280px + viewBox), UI-06 (FeedbackActiepunten last), UI-07 (nav 104px, logo 72px)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.nav-stripe` DOM div — already exists in `KlasTabStrip.tsx` (added in Phase 29). No structural change needed — only CSS height update.
- `spider-charts-row` in `DetailWeergave.tsx` — already uses `flexWrap: 'wrap'` and `gap: '16px'`. No container change needed for the wrapping behavior.
- CSS variable `var(--accent)` — use for any accent color references instead of hardcoded `#009FE3`.

### Established Patterns
- **Inline logo style** — logo height is set as inline style in KlasTabStrip.tsx `style={{ height: '36px', width: 'auto', marginRight: '16px' }}`. Update height inline, keep width/margin as-is.
- **Section 26 override** — `src/index.css` has a Section 26 comment block for spider card overrides. The `.spider-card { width: 160px; position: relative; }` on one line is the target.
- **No hardcoded hex in JSX** — all colors must use CSS variables. `#009FE3` is `var(--accent)`. This was enforced in Phase 29 and continues here.

### Integration Points
- `utils/spider.ts` `buildSpiderSVG()` — the only place SVG is built. Adding `viewBox` and `width="100%"` here affects all three SpiderChartCard instances simultaneously.
- `DetailWeergave.tsx` — pure JSX reorder for FeedbackActiepuntenSection. No other component imports or references this component directly.

</code_context>

<specifics>
## Specific Ideas

- **Nav-stripe at `height: 100%`**: When `#main-nav` has `position: relative` (it does — confirmed in index.css line 271), `height: 100%` on the absolutely-positioned `.nav-stripe` child resolves to the nav's computed height. No additional CSS needed.
- **Spider SVG viewBox**: Current SVG output from `buildSpiderSVG()` likely has hardcoded `width`/`height` attributes. Approach: retain the internal coordinate system as the `viewBox` value (e.g., `viewBox="0 0 200 200"`), remove the hardcoded `width`/`height` pixel attributes, add `width="100%"`. The chart will then scale to fill the `.spider-card` container.

</specifics>

<deferred>
## Deferred Ideas

- **Mac file upload bug** — User reported that file upload does not work on the Mac version. This is a separate bug fix, not part of this UI polish phase. Needs investigation: could be a regression from Phase 20 drag-drop fix (Tauri `dragDropEnabled: false`) behaving differently on macOS vs Windows, or a different Mac-specific issue. Should be a dedicated bug-fix phase once reproduced.

</deferred>

---

*Phase: 31-ui-polish-nav-spider*
*Context gathered: 2026-05-29*
