# Phase 8: Revert toetsplan changes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 08-revert-toetsplan-changes
**Areas discussed:** Revert scope, Toetsplan UI, D2 sortering

---

## Revert scope

| Option | Description | Selected |
|--------|-------------|----------|
| Alles van Phase 11 | Alle 12 commits terugdraaien — toetsplan-merge weg, BJ1/BJ2 fix weg, deadline-kolom weg, debugMerge weg. Terug naar exact de staat na Phase 7. | ✓ |
| Alleen merge-logic, BJ1/BJ2 fix behouden | Toetsplan-merge/sort/deadline weg, maar BJ1/BJ2 fase-detectie fix blijft staan. | |
| Alleen deadline-kolom en sort weg | Minimale revert — alleen deadline-kolom en sortering verwijderen. | |

**User's choice:** Alles van Phase 11 (aanbevolen optie)
**Notes:** Volledige revert naar staat na Phase 7.

---

## Toetsplan UI

| Option | Description | Selected |
|--------|-------------|----------|
| Behouden | Toetsplan-importzone blijft staan in de UI — alleen Phase 11 merge-logica verdwijnt. | |
| Ook verwijderen | Toetsplan-importzone volledig uit UI en app.js halen — clean staat zonder toetsplan-functionaliteit. | ✓ |

**User's choice:** Ook verwijderen
**Notes:** Volledige cleanup — toetsplan-zone HTML, handleToetsplanImport(), getActiveToetsplan() allemaal weg.

---

## D2 sortering

| Option | Description | Selected |
|--------|-------------|----------|
| Zoals vóór Phase 11 | Originele volgorde uit het PDF — geen deadline-sortering, geen toetsplan-driven ordering. | ✓ |
| Alfabetisch op datapunt-naam | Datapunten alfabetisch sorteren als alternatief. | |

**User's choice:** Zoals vóór Phase 11 (aanbevolen optie)
**Notes:** PDF-volgorde hersteld, deadline-kolom weg.

---

## Claude's Discretion

- Exacte git-strategie (revert commits vs. handmatige cleanup)
- Check of `normDatapunt()` / `tokenSubset()` elders gebruikt worden vóór verwijderen
- localStorage backward compatibility voor `klas.toetsplan` property

## Deferred Ideas

- Herintroductie toetsplan-functionaliteit in latere fase — expliciet buiten scope Phase 8.
