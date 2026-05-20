---
status: resolved
phase: 23-rekenen-nederlands
source: [23-01-SUMMARY.md, 23-02-SUMMARY.md]
started: 2026-05-20T00:00:00Z
updated: 2026-05-20T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. RekenenNederlandsSection visible with dropdowns and norm badges
expected: Student detail view shows a "Rekenen & Nederlands" section with 3F/2F/1F dropdowns for both Rekenen and Nederlands; norm badge appears inline next to each label
result: issue
reported: "Rekenen & Nederlands appeared twice — once under Aanvullende gegevens and once as its own section"
severity: major
resolution: Fixed inline — removed AanvullendSection from DetailWeergave.tsx (its Rekenniveau/Taalniveau fields were superseded by RekenenNederlandsSection). Also removed duplicate StageSection (superseded by BpvProgressSection).
verified: 2026-05-20

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
