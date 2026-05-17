---
status: resolved
phase: 17-settings-panel-foundation
source: [17-VERIFICATION.md]
started: 2026-05-17T19:15:00Z
updated: 2026-05-17T20:47:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Dark mode visual coverage
expected: When `body.dark` is active (toggle ON), ALL components paint with dark tokens — including SpiderChartCard, DeelgebiedenMatrix, VerzuimSection, KlasOverzicht, LeerlingTegel, ImportPage, modal, and nav bar. No component should remain light-colored.
result: issue
reported: "only the colours in th matrix are still on the bright side , same goes for the header with the leerlijnen."
severity: minor

### 2. SET-02 add-to-existing-class (runtime)
expected: With an active klas that already has students, open Settings → click "Bestanden toevoegen" → drop a new PDF into ImportPage. The student count of the existing klas should INCREASE by 1. No new klas should appear in KlasTabStrip.
result: pass

### 3. Dark mode persistence across restart
expected: Toggle dark mode ON in Settings, close the app, reopen it — the app opens in dark mode with no light flash. The toggle switch reflects the saved state.
result: pass

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "When body.dark is active, ALL components paint with dark tokens including DeelgebiedenMatrix and leerlijnen header"
  status: resolved
  reason: "User reported: only the colours in th matrix are still on the bright side , same goes for the header with the leerlijnen."
  severity: minor
  test: 1
  artifacts:
    - src/components/DeelgebiedenMatrix.tsx
    - src/index.css
  missing:
    - body.dark overrides for .score-o, .score-v, .score-g, .score-e (index.css:877-880)
    - body.dark overrides for .gap-ok, .gap-danger, .gap-warn, .gap-info (index.css:509-512)
    - DeelgebiedenMatrix GROEPEN array uses hardcoded inline styles on <th> headers (DeelgebiedenMatrix.tsx:15,20,25) — needs CSS variables or dark-aware classes
  root_cause: >
    Three distinct sources: (1) DeelgebiedenMatrix.tsx GROEPEN array has hardcoded hex inline styles
    for category headers (Lesgeven/Organiseren/Prof.handelen) that bypass body.dark CSS cascade.
    (2) Score chips .score-o/v/g/e in index.css have no body.dark overrides — light pastels stay
    visible in dark mode. (3) Gap badge classes .gap-ok/danger/warn/info similarly lack body.dark rules.
