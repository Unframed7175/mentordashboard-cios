---
status: partial
phase: 30-documentatie-help-ci
source: [30-VERIFICATION.md]
started: 2026-05-28
updated: 2026-05-28
---

## Current Test

[awaiting human testing]

## Tests

### 1. In-app helppagina visueel controleren
expected: Klikken op de "?" knop in de navigatiebalk opent de helppagina. De pagina toont 4 secties (Importeren, Bekijken, Afdrukken, Fout melden) met leesbare Nederlandse tekst. De "← Terug" knop keert terug naar het vorige scherm.
result: [pending]

### 2. ? knop active state zichtbaar
expected: Wanneer de helppagina open is, heeft de "?" knop een zichtbare active staat (kleur/stijl verandert) — identiek aan het gedrag van de instellingen-knop.
result: [pending]

### 3. GitHub Actions CI smoke build
expected: Na een push naar de `main` branch starten er 2 CI jobs (windows-latest + macos-latest) die beiden succesvol afgeronden worden. Er wordt geen GitHub Release aangemaakt. Controleren via de Actions tab: `gh run list --workflow=ci.yml --limit=3`
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
