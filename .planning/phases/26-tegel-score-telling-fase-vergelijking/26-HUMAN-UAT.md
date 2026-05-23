---
status: partial
phase: 26-tegel-score-telling-fase-vergelijking
source: [26-VERIFICATION.md]
started: 2026-05-23T14:52:00Z
updated: 2026-05-23T14:52:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Score-telling row shows real numbers in browser
expected: Each non-grey student tile renders a row like "14/19 ≥V · 1 O" below the status badge when the app is running with real data
result: [pending]

### 2. Multi-fase import produces visible trend arrow in correct direction
expected: Importing two periods for a student whose status improved (e.g. rood → oranje) shows an upward arrow ↑; a worsening student shows ↓; no arrow when equal or grijs
result: [pending]

### 3. Grijs tile has no score-telling DOM node
expected: A student without scores (grijs/Onbekend status) has no score-telling element in the DOM — inspect with DevTools to confirm the node is absent, not just hidden
result: [pending]

### 4. CSS border-trick triangle vertically aligns with score text
expected: The trend arrow (CSS border triangle) sits vertically aligned with the 12px score-telling text at all zoom levels
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
