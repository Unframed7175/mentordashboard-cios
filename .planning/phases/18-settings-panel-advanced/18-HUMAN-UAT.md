---
status: resolved
phase: 18-settings-panel-advanced
source: [18-VERIFICATION.md]
started: 2026-05-18T00:00:00Z
updated: 2026-05-20T00:00:00Z
---

## Current Test

UAT complete — 3 passed, 1 failed with 2 diagnosed gaps.

## Tests

### 1. Deelgebied persistence across restart
expected: Rename a deelgebied label, change its leerlijn, and deactivate one. Close and reopen the app. All three changes must be exactly as saved — no revert to schema defaults.
result: PASSED

### 2. Runtime threshold → VerzuimStatus end-to-end
expected: In Settings → Drempelwaarden, set "Ongeoorloofd verzuim waarschuwing" to 5 uur (5u). Open a leerling detail with >300 minutes ongeoorloofd verzuim. The tile/VerzuimSection must highlight as "hoog" (red text). Reset back to 10u — highlight disappears.
result: PASSED

### 3. Active filter visible in Matrix and Spider
expected: In Settings → Deelgebieden, toggle Actief off for 3 deelgebieden. Navigate to a leerling detail. The DeelgebiedenMatrix and SpiderChartCard must omit those 3 rows/axes. Re-activating them makes them reappear.
result: PASSED

### 4. BPV import error copy + student tile
expected: (a) Select a non-Excel file → error copy appears. (b) BpvProgressSection shows data in student tile after import.
result: FAILED
  - No error shown when selecting non-Excel file — parseBpvExcel (D-13 stub) returns {} without throwing, so error branch is dead code
  - BpvProgressSection always shows empty state — stub always writes {} to store, so no student record ever exists

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

### Gap A — parseBpvExcel: magic-byte validation so non-Excel files trigger the error copy
status: resolved
root_cause: D-13 stub returned {} unconditionally — even for PDFs/text files. Error branch in SettingsPage.handleBpvImport was dead code.
fix_applied: >
  utils/bpv.ts:172–177 — magic-byte check reads first 8 bytes of ArrayBuffer.
  PK signature (0x50 0x4B 0x03 0x04) = xlsx; D0CF signature (0xD0 0xCF 0x11 0xE0) = xls.
  Throws 'Onbekend BPV-bestandsformaat' if neither matches — error branch now live.
resolved_at: "2026-05-19 (phase 22 / utils/bpv.ts)"

### Gap B — BpvProgressSection always empty: real parser needed to store student records
status: resolved
root_cause: D-13 stub wrote {} → no student records → empty state always shown.
fix_applied: >
  utils/bpv.ts:171–260 — full parser implemented: magic-byte guard, XLSX.read(),
  BPV-specific sheet scorer (bpv/stage/uren/praktijk keywords), header row detection
  (first 20 rows scored against BPV_HEADER_KEYS), column extraction for
  'Stage-uren goedgekeurd' / 'Gerealiseerde uren' / etc., SUM across multiple rows
  per student, result keyed by leerlingId.
  ImportPage.tsx (phase 22): filename heuristic /bpv|stage|praktijk/i routes matching
  files to handleBpvExcel() which calls parseBpvExcel(), merges with existing getBpvData(),
  and calls saveBpvData() — BpvProgressSection now receives real data.
resolved_at: "2026-05-19 (phase 22 / utils/bpv.ts + ImportPage.tsx)"
