---
status: resolved
phase: 22-bpv-stage-excel
source: [22-01-SUMMARY.md, 22-02-SUMMARY.md]
started: 2026-05-20T00:00:00Z
updated: 2026-05-20T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. BPV stage excel import via dropzone
expected: Drop an Excel file with a BPV/stage/logboek filename onto ImportPage; BpvProgressSection in student detail shows per-placement breakdown (locatie, ingeleverd, goedgekeurd, in behandeling)
result: pass
note: Filename "Logboek_voortgang_*" required adding "logboek" to the routing heuristic (fixed inline). "Organisation" column correctly detected as locatie.
verified: 2026-05-20

### 2. Non-Excel file rejected
expected: Drop a non-Excel file with a BPV-matching filename; error message appears ("Onbekend BPV-bestandsformaat")
result: skipped
reason: Not tested separately — magic-byte check confirmed in utils/bpv.ts:172-177

## Summary

total: 2
passed: 1
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps
