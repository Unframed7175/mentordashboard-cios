---
status: partial
phase: 11-typescript-migratie
source: [11-VERIFICATION.md]
started: 2026-05-14T12:30:00Z
updated: 2026-05-14T12:30:00Z
---

## Current Test

[awaiting human testing — fixture-afhankelijke verificaties]

## Tests

### 1. MIG-01 — PDF parser output verificatie

expected: parsers/pdf.ts (parseSinglePDF) parset een echte CIOS voortgang-PDF en retourneert een array van objecten met naam-eigenschap; identieke output als de originele parsers/pdf.js
result: [pending — vereist tests/fixtures/sample-voortgang.pdf]

**Hoe te verifiëren:**
1. Voeg een geanonimiseerde CIOS voortgang PDF toe als `tests/fixtures/sample-voortgang.pdf`
2. Voer `npm run test -- tests/parseStage.test.ts` uit
3. Verwacht: 3 tests slagen (inclusief parseSinglePDF type check)

### 2. MIG-02 — Excel parser Nederlandse tekens (Müller-test)

expected: parsers/excel.ts (parseExcelFile) parset een .xls bestand met cp1252/cp1253 encoding correct; rij met "Müller" wordt correct geparsed
result: [pending — vereist tests/fixtures/sample-verzuim.xls]

**Hoe te verifiëren:**
1. Maak een minimaal .xls bestand met kolommen Leerlingnummer/Naam/Afwezig en één rij "Müller"
2. Sla op als `tests/fixtures/sample-verzuim.xls`
3. Voer `npm run test -- tests/excel.test.ts` uit
4. Verwacht: Müller-test slaagt (cpexcel cp1252 decoding werkt)

### 3. MIG-03 — Prognose identieke output vs JS origineel

expected: berekenPrognose retourneert identieke labels (negatief/neutraal/sbl/sbc/versneld) als de originele prognosis.js voor dezelfde invoer
result: [pending — side-by-side vergelijking niet uitgevoerd]

**Hoe te verifiëren:**
1. Laad de originele index.html.bak in een browser
2. Importeer een leerling met bekende voortgang
3. Vergelijk de prognose-label met output van berekenPrognose via `npm run test -- tests/prognosis.test.ts`
4. Alle 5 tests slagen (negatief/neutraal/sbl/sbc/versneld scenarios)

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
