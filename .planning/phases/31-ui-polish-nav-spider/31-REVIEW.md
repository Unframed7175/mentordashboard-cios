---
phase: 31-ui-polish-nav-spider
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/index.css
  - src/components/KlasTabStrip.tsx
  - utils/spider.tsx
  - src/components/DetailWeergave.tsx
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 31: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files were reviewed covering nav height doubling (52→104px), logo height doubling (36→72px), spider-card width change (160→280px), SVG responsive sizing (`width="100%"`), hit-circle coordinate scale update (280/200), and the `FeedbackActiepuntenSection` JSX reorder.

The CSS cascade override and JSX reorder are structurally correct. Three warnings and three info items were found; none are blockers. The most significant issue is a stale-comment coordinate range that will mislead the next developer working on tooltip behaviour, and a missing explicit `height` on the SVG that can cause height-collapse in certain browser/container edge cases.

---

## Warnings

### WR-01: SVG `width="100%"` with no `height` attribute — potential height collapse

**File:** `utils/spider.tsx:69` and `utils/spider.tsx:154`

**Issue:** Both SVG elements (the empty-state guard at line 69 and the main render at line 154) use `width="100%"` with a `viewBox="0 0 200 200"` but no explicit `height` attribute. In standard browsers the intrinsic aspect ratio from `viewBox` correctly scales height to equal width (280px inside `.spider-card { width: 280px }`). However, inside a flex container without a cross-axis constraint, some browser engines (notably Safari ≤ 15 and certain WebView variants) collapse the SVG height to 0 when the containing flex item has no explicit block height, because `width="100%"` resolves before the aspect-ratio inference is applied. The result is an invisible chart — no error, no layout shift, just a blank space.

**Fix:** Add an explicit aspect-ratio-preserving height using CSS or an inline style:

```tsx
// Option A — CSS viewBox-driven approach (preferred, no JS needed):
// In index.css Section 26:
.spider-card svg { width: 100%; height: auto; aspect-ratio: 1 / 1; }

// Option B — explicit attribute on both SVG elements in spider.tsx:
<svg width="100%" height="auto" viewBox="0 0 200 200" style={{ display: 'block' }} ...>
```

Either option makes the height explicit and eliminates the collapse path.

---

### WR-02: Stale JSDoc coordinate range "0–160" misleads tooltip debugging

**File:** `utils/spider.tsx:34` and `utils/spider.tsx:54`

**Issue:** The `HoverState` type comment at line 34 documents the `x` / `y` fields as "rendered pixel coordinates (0–160) relative to .spider-card". The `@param onHover` JSDoc at line 54 also says "(coords in rendered px, 0–160)". After the Phase 31 change the scale factor is `280/200 = 1.4`, so the actual coordinate range is now **0–280**, not 0–160. A developer diagnosing a misaligned tooltip will look at these comments, trust the 0–160 range, and look for a bug in the wrong place. The comments contradict the code at line 148:

```ts
x: cx * (280 / 200),   // range is 0–280
y: cy * (280 / 200),
```

**Fix:** Update both comment occurrences to reflect the current range:

```ts
// line 34 — HoverState type comment:
// x, y: rendered pixel coordinates (0–280) relative to .spider-card.

// line 54 — @param onHover JSDoc:
// Receives { axisIndex, x, y } on enter (coords in rendered px, 0–280), null on leave.
```

---

### WR-03: Tooltip position is not offset-safe when card layout changes

**File:** `src/components/SpiderChartCard.tsx:52-54` (interacts with `utils/spider.tsx:148`)

**Issue:** The tooltip is positioned via `style={{ top: tooltip.y, left: tooltip.x }}` on `.spider-card` (which is `position: relative`). The `y` coordinate is computed as `cy * (280/200)` — a pixel offset from the SVG origin. This is correct **only when the SVG is flush with the top of `.spider-card` with zero preceding vertical offset**. Currently the SVG is the first child of the card so the offset is zero and the tooltips land correctly.

However, the scale-change to 280px makes the card taller (was 160×160, now 280×280). If future work adds a header row inside `.spider-card` above the SVG — a reasonable design step — every tooltip will be displaced downward by the height of that header and developers will not see an obvious error, just misaligned popups. The root fragility is that `spider.tsx` uses SVG-internal coordinates without accounting for any intra-card offset.

**Fix:** Pass the rendered offset from `onMouseEnter` using `getBoundingClientRect()` differencing instead of relying on static scale arithmetic, or document the constraint explicitly in the component:

```tsx
// In SpiderChartCard.tsx — document the assumption:
{/*
  NOTE: tooltip y/x from onHover are measured from the SVG origin.
  The SVG MUST remain the first child of .spider-card (no preceding siblings)
  for tooltip positioning to be accurate.
*/}
{SpiderChart.buildSpiderSVG(...)}
```

At minimum, add the comment so the constraint is visible to the next reviewer.

---

## Info

### IN-01: Duplicate CSS section number "22"

**File:** `src/index.css:1138` and `src/index.css:1544`

**Issue:** Section "22. ImportPage" is declared at line 1138, and a second "22. FeedbackModal textarea" block appears at line 1544. The duplicate numbering will cause confusion when cross-referencing sections by number in code comments or plan documents.

**Fix:** Renumber the later block. The sequential number following Section 25 (Doorstroomdrempels) would be Section 26 which is already used. Given the existing comment numbering, the FeedbackModal textarea block (line 1544) should be assigned Section 29 or the next free number:

```css
/* --------------------------------------------------------------------------
   29. FeedbackModal textarea
   -------------------------------------------------------------------------- */
```

---

### IN-02: Duplicate "Section 8" comment labels in DetailWeergave

**File:** `src/components/DetailWeergave.tsx:163` and `src/components/DetailWeergave.tsx:166`

**Issue:** Two consecutive JSX sections are both labelled "Section 8":

```tsx
{/* Section 8: VerzuimSection */}
<VerzuimSection student={student} />

{/* Section 8: BpvProgressSection */}
<BpvProgressSection leerlingId={leerlingId} />
```

The second one should be "Section 9" (and the comment on FeedbackActiepuntenSection at line 169 would then become "Section 10").

**Fix:**
```tsx
{/* Section 8: VerzuimSection */}
{/* Section 9: BpvProgressSection */}
{/* Section 10: FeedbackActiepuntenSection */}
```

---

### IN-03: `#main-nav` padding does not account for doubled logo height

**File:** `src/index.css:261-274`

**Issue:** `#main-nav` now has `min-height: 104px` and `padding: 0 1rem` (horizontal padding only, no vertical). The logo is 72px tall. With `align-items: center` the nav vertically centres its children, so the logo gets `(104 - 72) / 2 = 16px` of automatic top/bottom clearance from the min-height. This is fine visually. However, the `flex-wrap: wrap` means tabs that overflow will create a second line and grow the nav taller, pushing the nav-stripe (which is `height: 100%`) taller as well. The stripe may look unintentionally large when many tabs are open. This is a design awareness note, not a correctness defect.

**Fix (optional):** If the nav should not grow beyond 104px regardless of tab count, add `overflow-x: auto; flex-wrap: nowrap;` and a horizontal scroll. If wrapping is intentional, consider capping the stripe height: `.nav-stripe { max-height: 104px; }`.

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
