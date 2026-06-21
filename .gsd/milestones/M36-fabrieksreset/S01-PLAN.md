# M36 — Fabrieksreset: schone eerste start zonder testdata
# Datum: 2026-06-12

## Doel

Handmatige, bevestigde "Alle gegevens wissen"-actie in Instellingen (typ-bevestiging `WISSEN`) met back-up-vangnet, zodat een machine met achtergebleven testdata na reset gegarandeerd in de onboarding-wizard start. Release als **v2.7.0** (feat).

## Bron

- Design doc (APPROVED, ENG CLEAR + DESIGN CLEAR, 0 critical gaps): `~/.gstack/projects/Unframed7175-mentordashboard-cios/rafael-master-design-20260611-213139.md`
- ADR-13 + ADR-13a (`.gsd/DECISIONS.md`)
- Testplan-artefact: `~/.gstack/projects/Unframed7175-mentordashboard-cios/rafael-master-eng-review-test-plan-20260612-080500.md`
- Wireframe (goedgekeurd): `~/.gstack/projects/Unframed7175-mentordashboard-cios/designs/gevarenzone-wisdialoog-20260612/wireframe.png`

## Taken

| ID | Prio | Taak | Bestanden | Verificatie | Status |
|---|---|---|---|---|---|
| T1 | P1 | Backup-payload v2: generieke store-snapshot via `store.entries()`; store-keys alléén terug bij 'overschrijven'-restore; 'samenvoegen' behoudt huidige store-keys | `utils/backup.ts` · `tests/backup*.test.ts` | `npm test` — incl. CRITICAL v1-regressietest + 'samenvoegen behoudt store-keys' | ⬜ |
| T2 | P1 | Reload alléén na v2-overschrijven-restore; v1- en samenvoegen-restores houden bestaande UX (`onImportComplete` → view 'klas') | `src/components/ImportPage.tsx` + test | `npm test` — v1/samenvoegen-restore triggert géén reload | ⬜ |
| T3 | P1 | `factoryReset()` (nieuw `utils/reset.ts`): `store.clear()` + `store.save()` → `localStorage.clear()` → injecteerbare reload; **geen in-memory mutaties**; faalpad laat geheugen én schijf intact | `utils/reset.ts` · `tests/reset.test.ts` | `npm test` — volgorde-assert + faalpad-assert (klassenState onaangetast, geen reload, geen localStorage.clear) | ⬜ |
| T4 | P1 | Gevarenzone-sectie + wisdialoog in SettingsPage: typ-bevestiging `WISSEN`, "Back-up maken"-knop (hergebruik export-handler), faalmelding, dubbelklik-guard | `src/components/SettingsPage.tsx` + componenttest | `npm test` — wis-knop disabled tot exact `WISSEN`; annuleren wist niets | ⬜ |
| DT1 | P1 | Dialoog-states conform states-tabel: idle / geldige invoer / back-up bezig / wissen bezig (dialoog niet sluitbaar) / fout / succes (reload) | `src/components/SettingsPage.tsx` + componenttest | `npm test` — per state juiste knoplabel/disabled-gedrag | ⬜ |
| DT2 | P1 | A11y: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus naar invoerveld bij openen, focus trap, ESC sluit (behalve tijdens wissen), Enter triggert nóóit de wis-actie, disabled-knop leesbaar contrast | `src/components/SettingsPage.tsx` + componenttest | `npm test` — focus-bij-openen, focus trap, Enter-gedrag | ⬜ |
| T5 | P2 | Dode `clearState()` verwijderen (eigen `refactor:`-commit) | `utils/datamodel.ts` | `npm test` + grep bevestigt nul callers | ⬜ |
| T6 | P1 | Handmatige QA-checklist op echte Tauri-build (Fase 4, vóór `/ship`): (1) reset → herstart → wizard én `store.json` op schijf leeg (verificatie LazyStore-aanname); (2) reset → wizard-abort → import → back-up-restore → alle data terug | testplan-artefact (al geschreven) | Handmatig op echte build | ⬜ |
| DT3 | P2 | Dark-mode verificatie wisdialoog (`body.dark` tokens) toevoegen aan handmatige QA-checklist | testplan-artefact | Handmatig — dialoog leesbaar in dark mode | ⬜ |

## Volgorde & lanes

```
Lane A (backup-domein):  T1 → T2                    (sequentieel)
Lane B (reset + UI):     T3 → T4 → DT1 → DT2        (sequentieel; UI bouwt op reset)
Lane C (micro):          T5                          (onafhankelijk; meeliften met Lane B)
Fase 4 (vóór /ship):     T6 + DT3                    (handmatige QA op echte Tauri-build)
```

Lane A en B kunnen parallel (bindende bouwvolgorde bewust afgewezen, eng-review D8). Merge-risico in `SettingsPage.tsx` is laag maar aanwezig — beide lanes raken `tests/`.

## UI-check (Fase 1 DoD)

UI-taken aanwezig (T4, DT1, DT2) → **Fase 3 staat ingepland als verplicht tussenstation vóór Fase 2.**

Invulling Fase 3 voor M36 (beperkt checkpoint — component-design-contract bestaat al):
- De goedgekeurde **UI-spec + wireframe** uit de design review (2026-06-12) fungeren als design contract: sectie-opmaak, dialoog-hiërarchie (begrijpen → vangnet → frictie → actie), states-tabel en a11y-spec liggen vast in het design doc.
- **Statische a11y-check** uitvoeren op de spec-kleuren: actieve wis-knop wit op `#DC2626` en disabled-knop donkere tekst op `#FCA5A5` — beide ≥ 4.5:1 verifiëren.
- Het `.gsd/DESIGN.md`-gat (geen projectbreed design system gegenereerd) is door de projectlead vastgelegd als TODO in de design review — **geen blokkade voor M36**.

## Beslissingen (bindend, uit ADR-13/13a + design review)

- `factoryReset()` muteert **geen** in-memory state; mislukte reset laat geheugen én schijf intact (geen halfgewiste toestand mogelijk).
- Keychain-sleutel (`nl.cios.mentordashboard.key`) blijft staan — anders is de pre-reset back-up onleesbaar.
- Backup-payload v2 = generieke store-snapshot; `klassen` blijft plaintext zoals v1; v1-restore blijft werken (CRITICAL regressietest).
- Geen geautomatiseerde E2E over de reload heen — volledige reset/restore-cycli zijn handmatige QA op echte Tauri-build.
- Back-up aanbieden, niet verplichten; wissen onmogelijk zonder exacte typ-bevestiging.
- Bewust afgewezen: same-machine disclaimer, AVG-motivering, bindende bouwvolgorde, NSIS uninstall-hook, per-module cache-resets, Tauri WebDriver E2E (eigen milestone waard), cross-machine restore (TODO `T-2026-06-12-01` in `TODOS.md`).

## Succescriteria

1. Machine met testdata: Instellingen → Alle gegevens wissen → app herstart in de aanmaak-wizard; `store.json` leeg, localStorage leeg.
2. Misklik herstelbaar: pre-reset back-up zet álle data terug via wizard-abort → importscherm → restore.
3. Wissen onmogelijk zonder typ-bevestiging `WISSEN`.
4. Bestaande tests blijven groen (358+); nieuwe tests dekken reset-logica, dialooggedrag, backup v2 (incl. v1-backwards-compat) en herstelpad.
5. Release als v2.7.0 via bestaande pipeline.

## Feedbackloop (na release)

Stuur de melder(s) één zin: "Installeer v2.7.0, ga naar Instellingen → Alle gegevens wissen, en bevestig dat je in de wizard landt." Bevestiging sluit de feedbackloop.
