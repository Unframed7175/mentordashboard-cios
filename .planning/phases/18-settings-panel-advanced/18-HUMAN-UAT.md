---
status: partial
phase: 18-settings-panel-advanced
source: [18-VERIFICATION.md]
started: 2026-05-18T00:00:00Z
updated: 2026-05-18T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Deelgebied persistence across restart
expected: Rename a deelgebied label, change its leerlijn, and deactivate one. Close and reopen the app. All three changes must be exactly as saved — no revert to schema defaults.
result: [pending]

### 2. Runtime threshold → VerzuimStatus end-to-end
expected: In Settings → Drempelwaarden, set "Ongeoorloofd verzuim waarschuwing" to 5 uur (5u). Open a leerling detail with >300 minutes ongeoorloofd verzuim. The tile/VerzuimSection must highlight as "hoog" (red text). Reset back to 10u — highlight disappears.
result: [pending]

### 3. Active filter visible in Matrix and Spider
expected: In Settings → Deelgebieden, toggle Actief off for 3 deelgebieden. Navigate to a leerling detail. The DeelgebiedenMatrix and SpiderChartCard must omit those 3 rows/axes. Re-activating them makes them reappear.
result: [pending]

### 4. BPV import error copy
expected: Click "BPV-uren importeren" and select a non-Excel file (e.g., a PDF or .txt). The error copy "Onbekend BPV-bestandsformaat. Probeer een ander bestand." must appear below the button. With the current D-13 stub parseBpvExcel returns {} (no throw), so this error only fires if parseBpvExcel throws — a valid Excel may silently succeed with zero records.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
