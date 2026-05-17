---
status: partial
phase: 17-settings-panel-foundation
source: [17-VERIFICATION.md]
started: 2026-05-17T19:15:00Z
updated: 2026-05-17T19:15:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Dark mode visual coverage
expected: When `body.dark` is active (toggle ON), ALL components paint with dark tokens — including SpiderChartCard, DeelgebiedenMatrix, VerzuimSection, KlasOverzicht, LeerlingTegel, ImportPage, modal, and nav bar. No component should remain light-colored.
result: [pending]

### 2. SET-02 add-to-existing-class (runtime)
expected: With an active klas that already has students, open Settings → click "Bestanden toevoegen" → drop a new PDF into ImportPage. The student count of the existing klas should INCREASE by 1. No new klas should appear in KlasTabStrip.
result: [pending]

### 3. Dark mode persistence across restart
expected: Toggle dark mode ON in Settings, close the app, reopen it — the app opens in dark mode with no light flash. The toggle switch reflects the saved state.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
