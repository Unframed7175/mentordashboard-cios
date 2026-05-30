---
status: complete
phase: 33-klas-verwijderen-bevestiging
source:
  - .planning/phases/33-klas-verwijderen-bevestiging/33-01-SUMMARY.md
  - .planning/phases/33-klas-verwijderen-bevestiging/33-02-SUMMARY.md
  - .planning/phases/33-klas-verwijderen-bevestiging/33-03-SUMMARY.md
started: "2026-05-30T08:35:00Z"
updated: "2026-05-30T09:10:00Z"
retest: true
---

## Current Test

[testing complete]

## Tests

### 1. × knop zichtbaar voor alle klassen
expected: Op elk klassenbladertje in de tabbalk staat een × knop, ook voor klassen met leerlingen.
result: pass

### 2. × knop opent bevestigingsmodal
expected: Klikken op de × knop opent een modal overlay — geen browser confirm-dialoog, maar een eigen modal met een donkere achtergrond.
result: pass

### 3. Modal toont klasnaam en leerlingaantal
expected: De modal toont de tekst `Klas '{naam}' bevat {N} leerlingen.` met de juiste klasnaam en het actuele leerlingaantal.
result: issue
reported: "wanneer er 2 fases per leerling in zitten dan wordt het aantal verdubbeld."
severity: major

### 4. Confirm-knop disabled bij openen
expected: Bij het openen van de modal is de knop "Verwijderen" uitgeschakeld (grijs, niet klikbaar). Er is een checkbox met de tekst "Ik begrijp dat alle leerlingdata wordt verwijderd".
result: pass

### 5. Aanvinken checkbox activeert Verwijderen-knop
expected: Na het aanvinken van de checkbox wordt de "Verwijderen"-knop actief (niet meer grijs, klikbaar).
result: pass

### 6. Annuleren sluit de modal
expected: Klikken op "Annuleren" sluit de modal. De klas is niet verwijderd. De tabbalk toont nog steeds de klas.
result: pass

### 7. Klas verwijderen via modal werkt
expected: Checkbox aanvinken → "Verwijderen" klikken → de klas verdwijnt uit de tabbalk. Als er nog andere klassen zijn, blijft de app op het klassenscherm.
result: pass

### 8. Laatste klas verwijderd → importscherm
expected: Als de verwijderde klas de enige was (geen andere klassen meer), navigeert de app automatisch naar het importscherm.
result: pass

### 9. Modal toont juist leerlingaantal (gap closure re-test)
expected: Open klas met leerlingen die meerdere periodes/fases hebben. Klik × op die klas. Modal toont werkelijk uniek leerlingaantal — niet verdubbeld.
result: pass

### 10. Escape sluit de delete modal
expected: Open de verwijdermodal via de × knop. Druk op Escape. Modal sluit zonder de klas te verwijderen.
result: pass

### 11. Verwijderen actieve klas vanuit detailweergave
expected: Open een leerling in detailweergave (actieve klas). Klik × op diezelfde actieve klas. Bevestig. Als er andere klassen zijn, navigeert de app naar klasoverzicht — geen stale detailweergave.
result: pass

### 12. Laatste klas verwijderd navigeert naar importscherm
expected: Verwijder de enige overgebleven klas via de modal. App navigeert automatisch naar het importscherm.
result: pass

## Summary

total: 12
passed: 11
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Modal toont het werkelijke unieke leerlingaantal — niet verdubbeld bij leerlingen met 2 fases"
  status: resolved
  reason: "User reported: wanneer er 2 fases per leerling in zitten dan wordt het aantal verdubbeld."
  severity: major
  test: 3
  root_cause: "App.tsx:133 — handleDeleteKlas telt klas.students.length, maar students bevat één record per periode per leerling. Een leerling met 2 periodes telt als 2. Fix: count unique leerlingIds via new Set(klas.students.map(s => s.leerlingId)).size"
  artifacts:
    - src/App.tsx:133
  missing:
    - "Unieke leerlingId-telling in plaats van raw array length"
