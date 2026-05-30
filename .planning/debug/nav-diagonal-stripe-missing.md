---
slug: nav-diagonal-stripe-missing
status: resolved
trigger: manual
created: 2026-05-19
resolved: 2026-05-19
---

# Debug: Nav Diagonal Stripe Missing

## Symptom

The CIOS blue diagonal accent stripe (`#main-nav::after`) implemented in Phase 19 UI Polish
was completely invisible in the running application.

## Root Cause

Two compounding CSS issues in `src/index.css`:

### Primary cause: `overflow: hidden` on `#main-nav` (line 276)

```css
#main-nav {
  ...
  overflow: hidden;   /* ← clips the ::after pseudo-element */
}
```

`overflow: hidden` clips all content — including absolutely-positioned descendants — to the
element's padding box. In Chromium (Tauri's engine), when the flex container's paint area is
exactly 52px tall and the `::after` is also 52px tall starting at top:0, the pixel-perfect
alignment means any sub-pixel height difference (from border-box sizing, borders, or fractional
DPI scaling) causes the pseudo-element to be clipped to zero visible area.

### Secondary cause: duplicate `position` declarations

```css
  position: sticky;   /* ← overridden by next line */
  position: relative;
```

The `position: sticky` declaration is dead code (the subsequent `position: relative` wins).
While not the cause of invisibility, it is confusing and was left from a previous fix attempt.

## What Was NOT the Cause

- The `::after` CSS rule was present and correctly targeted (no duplicate rules found).
- The global reset `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
  does not clear `content` or `position`, so it did not suppress the pseudo-element.
- The `z-index: 2` on `::after` vs `z-index: 1` on `.nav-tab` was actually backwards for UX
  (stripe would paint over the settings button), but was not the cause of invisibility.

## Fix Applied

**File:** `src/index.css`

### Change 1 — Remove `overflow: hidden` and duplicate `position: sticky` from `#main-nav`

Before:
```css
#main-nav {
  ...
  position: sticky;
  position: relative;
  top: 0;
  z-index: 50;
  overflow: hidden;
}
```

After:
```css
#main-nav {
  ...
  position: relative;
  top: 0;
  z-index: 50;
}
```

### Change 2 — Lower `::after` z-index to 0 (behind tabs and settings button)

Before:
```css
#main-nav::after {
  ...
  z-index: 2;
}
```

After:
```css
#main-nav::after {
  ...
  z-index: 0;
}
```

This ensures the stripe renders as a decorative background accent — visible through the
transparent tab backgrounds, but not obscuring the clickable settings button in the corner.

## Verification

After the fix:
- `#main-nav` is a standard `position: relative` flex container with no overflow clipping.
- `::after` at `z-index: 0` paints above the nav background but below all `.nav-tab` buttons
  (`z-index: 1`), keeping the stripe purely decorative.
- The gradient `linear-gradient(to bottom-left, #009FE3 0%, #009FE3 25%, transparent 70%)`
  produces a blue triangle in the top-right corner that fades diagonally toward the center.

## Cycles

1 investigation cycle, 1 fix cycle.
