---
status: approved
phase: 32-rn-status-tegels
source: [32-VERIFICATION.md]
started: 2026-05-29T18:39:00Z
updated: 2026-05-29T18:50:00Z
---

## Current Test

approved

## Tests

### 1. Visuele weergave R&N rij in tegel
expected: De R&N statusregel verschijnt op de tegel direct onder de score-telling rij, met correct geformatteerde tekst 'R {score}', 'N {score}' of 'R {score} · N {score}' in het juiste font/kleur (--text-muted).
result: passed

### 2. Geen lege ruimte op tegels zonder R&N data
expected: Geen R&N-rij zichtbaar op tegels voor leerlingen zonder R&N-scores; de tegel heeft exact dezelfde hoogte als vóór Phase 32.
result: passed (na fix: align-items: start op #klas-grid — lege ruimte was zichtbaar, na fix opgelost)

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
