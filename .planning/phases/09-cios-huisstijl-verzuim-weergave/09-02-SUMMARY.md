---
phase: "09"
plan: "02"
status: complete
completed: "2026-04-24"
requirements_delivered:
  - VRZ-01
  - VRZ-02
---

# Plan 09-02 Summary: Verzuim Aanwezigheidspercentage

## What Was Built

Replaced the conditional "Xu ongeoorloofd" text in `buildMiniVerzuimBar()` with a neutral `${pA}% aanwezig` display below the 3-part attendance bar.

## Key Change

**app.js `buildMiniVerzuimBar()` (lines 1256–1270)**

Removed:
- `kleurTekst` variable (conditional red/grey color based on 600-minute threshold)
- `ongeoorloofdTekst` variable (conditional "Xu ongeoorloofd" div)

Added:
- `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px;">${pA}% aanwezig</div>`

Always shows the attendance percentage in neutral `--text-muted` color. No conditional coloring.

## Files Modified

- `app.js` — `buildMiniVerzuimBar()` function only

## key-files

### created
(none)

### modified
- `app.js` — buildMiniVerzuimBar() simplified: 5 lines → 1 line output

## Self-Check: PASSED

- ✓ `${pA}% aanwezig` present in buildMiniVerzuimBar()
- ✓ `kleurTekst` removed from buildMiniVerzuimBar()
- ✓ `ongeoorloofdTekst` removed from buildMiniVerzuimBar()
- ✓ mvb-aanwezig, mvb-geoorloofd, mvb-ongeoorloofd segments unchanged
- ✓ VERZUIM_DREMPEL_MIN constant unchanged at line 1039
