---
plan: "31-02"
phase: 31
status: complete
commit: 7298775
---

# Plan 31-02 Summary — Component changes

## What was built

Three targeted component changes:

1. **KlasTabStrip.tsx** — Logo inline style `height: '36px'` → `height: '72px'` (matches doubled nav height from plan 31-01)
2. **utils/spider.tsx** — Both SVG elements updated: `width="160" height="160"` → `width="100%"` (removes fixed height). Hit-circle coordinate scale updated from `160/200` to `280/200` to match the 280px card width. Stale comment updated.
3. **DetailWeergave.tsx** — `FeedbackActiepuntenSection` moved from position 3 (after RekenenNederlandsSection) to position 7 (last, after BpvProgressSection). Pure JSX reorder — no logic, props, or imports changed.

## Deviations

Updated a stale comment in `utils/spider.tsx` that still referenced `width="160"` — required to meet the acceptance criteria (zero grep matches for `width="160"`).

## Self-Check: PASSED

- `KlasTabStrip.tsx` logo `height: '72px'` ✓
- `utils/spider.tsx` has 2× `width="100%"` SVG elements, 0× `width="160"`, 0× `height="160"` ✓
- `utils/spider.tsx` hit-circle scale is `280/200` ✓
- `DetailWeergave.tsx` `FeedbackActiepuntenSection` is last section (after `BpvProgressSection`) ✓
- No hardcoded hex colors introduced ✓
- 210/210 tests pass ✓
