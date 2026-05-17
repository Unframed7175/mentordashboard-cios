---
plan: "17-04"
phase: "17-settings-panel-foundation"
status: complete
gap_closure: true
completed: 2026-05-17
key-files:
  created: []
  modified:
    - src/index.css
    - src/components/DeelgebiedenMatrix.tsx
---

## Summary

Closed the single UAT gap from Phase 17: dark mode did not fully cover DeelgebiedenMatrix category headers, score chips, and gap badges.

## What Was Built

**Task 1 — CSS (src/index.css):**
- Added `--dm-lesgeven-bg/text/border`, `--dm-organiseren-bg/text/border`, and `--dm-profhandelen-bg/text/border` custom properties to the `:root` block (light-mode values).
- Added a second `body.dark { ... }` block immediately after the existing one, overriding the three `--dm-*` token sets with dark-appropriate colours.
- Added `body.dark .score-o/v/g/e` rules with dark red/amber/green/indigo backgrounds.
- Added `body.dark .gap-ok/danger/warn/info` rules with matching dark palette colours.
- Added `.dm-header-lesgeven`, `.dm-header-organiseren`, `.dm-header-profhandelen` utility classes that consume the custom properties (includes padding and text-align).

**Task 2 — TSX (src/components/DeelgebiedenMatrix.tsx):**
- Removed `headerStyle` from each GROEPEN entry (eliminated three hardcoded inline hex objects).
- Added `className` string to each GROEPEN entry (`dm-header-lesgeven`, etc.).
- Replaced `style={{ ...g.headerStyle, padding: ..., textAlign: ... }}` on the `<th>` with `className={g.className}`.

## Verification

- `grep -c "body.dark .score-o" src/index.css` → 1 ✓
- `grep -c "body.dark .gap-ok" src/index.css` → 1 ✓
- `grep -c "dm-header-lesgeven" src/index.css` → 1 ✓
- `grep -c "headerStyle" src/components/DeelgebiedenMatrix.tsx` → 0 ✓
- `npx tsc --noEmit` → 0 errors ✓
- `npm test` → 53 passed, 0 failed ✓

## Self-Check: PASSED

All success criteria met. No deviations from plan.
