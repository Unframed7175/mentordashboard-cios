---
status: resolved
phase: 24-onboarding-wizard
source: [24-01-SUMMARY.md, 24-02-SUMMARY.md, 24-03-SUMMARY.md]
started: 2026-05-20T00:00:00Z
updated: 2026-05-20T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. 6-step wizard flow
expected: On fresh install (no students), onboarding wizard appears. Step through all 6 steps — step 5 shows verzuim drempelwaarden inputs, step 6 is completion screen. After finishing, app lands on dashboard.
result: pass
verified: 2026-05-20

### 2. Afbreken button
expected: On steps 2–5, clicking Afbreken navigates to import screen without completing the wizard. No partial class remains.
result: pass
verified: 2026-05-20

### 3. Ghost-class guard
expected: If a class exists but has no students, reopening the app shows the wizard again (not the dashboard).
result: pass
verified: 2026-05-20

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
