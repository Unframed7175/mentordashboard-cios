# M36-LEARNINGS — Fabrieksreset

> Geschreven door GSD na afronding Fase 4. Scope: projectgebonden lessen voor volgende milestone.

## Wat werkte

- **Twee-lanes aanpak (T1→T2 backup / T3→T4 reset+UI)** werkte goed: backup-lane en reset-lane waren onafhankelijk testbaar. Geen race conditions in implementatievolgorde.
- **Injecteerbare `reloadFn`** pattern (default `window.location.reload`) maakte zowel `factoryReset()` als `ImportPage` volledig testbaar zonder jsdom-hacks. Patroon is herbruikbaar.
- **ADR-13a besluit "geen in-memory mutaties"** hield de implementatie eerlijk: `factoryReset()` raakt `klassenState` niet aan, reload is de enige manier om het scherm te vernieuwen. Dit maakte het faalpad simpel en correct.
- **Code review (Fase 4)** vond twee kritieke fouten die in de TDD-cyclus waren gemist: (1) stale store-keys overleefden v2-overschrijven-restore (additieve loop), (2) backup-exportfouten werden stil geslokt. Beide zijn opgelost vóór ship.

## Wat beter kan

- **"Overschrijven" semantiek niet getest op stale keys (T1)**: de T1-tests controleerden of de snapshot-keys terug kwamen, maar niet of stale keys die *niet* in de snapshot staan, verdwijnen. De review vond dit alsnog. Volgende milestone: testcriteria expliciet formuleren voor "wat mag er NIET meer in de store zitten".
- **Focus trap niet in initiële DT2-spec opgenomen als testcriterium**: de implementatie werd toegevoegd tijdens de review, niet tijdens TDD. Volgende keer: a11y-spec explicieter in S01-PLAN.md uitschrijven met TAB-gedrag als apart testitem.
- **Backup-exportfout zichtbaar maken was niet in DT1/DT2 voorzien**: de states-tabel had geen "back-up fout"-state. Toegevoegd tijdens review. Patroon: voor elke async actie in een dialoog een fout-state definiëren in de spec.

## Technische schuld

- `store.clear()` + `store.save()` faalscenario (LazyStore in-memory leeg, disk intact): niet geblokkeerd door `factoryReset()` faalpad. Op Tauri onwaarschijnlijk maar gedocumenteerd als bekend risico.
- Store singleton (`LazyStore('store.json')`) in zowel `backup.ts` als `reset.ts`: intentioneel per ADR-13 maar concurrent `save()`-calls zijn theoretisch mogelijk. Geen blokkade voor v2.7.0.

## Volgende milestone

M37 — schema-configurabiliteit (gepland in STATE.md). Parser open-world maken voor jaarlijkse CIOS-schema-updates.
