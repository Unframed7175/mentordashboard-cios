---
status: partial
phase: 25-doorstroomnorm-configuratie
source: [25-VERIFICATION.md]
started: 2026-05-21T00:00:00Z
updated: 2026-05-21T00:00:00Z
---

## Current Test

[awaiting human testing — items 1-3 partially covered by Plan 03 checkpoint approval]

## Tests

### 1. Persistence round-trip (NORM-06)
expected: Change SBL threshold in Settings, close Tauri app entirely, reopen, open Settings → Section 5 shows the changed value (not the default)
result: [pending — partially covered: checkpoint step 9 approved]

### 2. KlasOverzicht RAG colour recompute (NORM-01..05)
expected: Change a threshold in Settings, navigate back to KlasOverzicht without restart — at least one student tile colour changes to reflect the new threshold
result: [pending — partially covered: checkpoint step 4 approved]

### 3. Herstel standaard end-to-end (NORM-07)
expected: Two-step confirm flow — "Herstel standaard" → confirm row appears → "Ja, herstel" → all 8 inputs revert to defaults → KlasOverzicht tile colours reflect default thresholds
result: [pending — partially covered: checkpoint step 10 approved]

### 4. DoortstroomPrognoseSection detail-view text update
expected: Change SBL threshold in Settings (e.g. to 10). Open a student detail view. The explanatory text in the DoortstroomPrognoseSection shows the configured value (e.g. "≥10") not the hardcoded default "≥13"
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
