# S01-PLAN.md — M43 Eindoordeel per deelgebied overal via S/C-formule

> Fase: 1 (Spec) — GSD. Bron: ADR-18 (Fase 0-beslissingen D1-D7), design doc `docs/designs/m43-eindoordeel-sc-formule-overal.md` (goedgekeurd) en `/plan-eng-review` 2026-09-23 (R1-R6, zie ADR-18a).
> Doel: matrix-eindoordeel, spider chart en BJ1/BJ2-doorstroomprognose rekenen voor dezelfde periode met één functie (`berekenEindoordelen`) op basis van de S/C-formule, i.p.v. "laatste score wint".
> UI-check: geen nieuwe UI of visuele wijziging (alleen andere databron) → **geen Fase 3**.

---

## Taken

### T0 — Verificatie + nulmeting (vóór enige code)
- Op echte PDF's (lokaal, niet gecommit, alleen `leerlingId`s):
  1. Wat staat er in de rij van een datapunt met status "niet ingeleverd" / "te laat ingeleverd en niet beoordeeld"? (a) al een O in deelgebiedcellen → D5 vervalt als aparte stap (anders dubbeltelling); (b) lege cellen → **stop D5**, parkeren tot projectleadbeslissing over de bron van "betrokken deelgebieden"; rest gaat door.
  2. Vergelijk "laatste periode" volgens `getAllRecordsForStudent` (alfabetisch) met `KlasOverzicht` (numeriek) op echte periodenamen. Afwijking → melden aan projectlead; M43 volgt `getAllRecordsForStudent`.
  3. Nulmeting-snapshot per leerling: BJ1/BJ2-label, tellingen per leerlijn, `berekenStatus`-kleur + trendpijl, matrix-eindoordelen, spider-scores.
- Uitkomst vastleggen in `S01-SUMMARY.md`.

### T1 — Kern: `berekenEindoordelen` (TDD)
- `utils/aggregation.ts`: `berekenEindoordelen(datapunten, { fase? })` → elk `DEELGEBIEDEN`-label aanwezig, `null` zonder beoordeling, onbekende labels genegeerd; fasefilter `getFase(dp) === fase || null`; S/C-kern + E-plafond ongewijzigd (D1, bestaande guards blijven); D5-stap alleen volgens T0.
- Doc-comment met het ASCII-datastroomdiagram (R2).
- `ONVOLDOENDE_INLEVER_STATUSSEN` → `utils/scoreAggregation.ts`, her-export vanuit `prognosis.ts`.
- Tests eerst (`tests/aggregation.test.ts`): E-plafond, grenzen S=±0.5 en 2.0, knock-out C≥3 met hoge S, alles-null, onbekend label, fasefilter (fase 2, fase 3, zonder tag), D5 volgens T0.

### T2 — Prognose-consumenten
- `berekenBj1Uitkomst` Trigger A, `berekenBj2GeneriekPad` ≥V, `berekenPrognose` (→ `telLeerlijnen`, T06-lus vervalt), `telLeerlijnenPerFase` (fase 2 én fase 3-pad Roosendaal): elk roept zelf `berekenEindoordelen` aan, signatures ongewijzigd (R1).
- Helper `actieveDeelgebieden(activeIds?)` vervangt 4 inline filters `prognosis.ts:98,194,287,453` (R3).
- `parsers/pdf.ts:841` blijft latest-wins schrijven (compatibiliteit); commentaar bijwerken. `aggregateLatestScores` alleen nog voor `pdf.ts`.
- Verouderde comments bijwerken: `prognosis.ts:146-152,250,283,413`, `parsers/pdf.ts:682`, `utils/datamodel.ts:43`.

### T3 — Regressiecontract tests (R4a/R4b)
- Testhelper `datapuntenVoorScores(scores)` (één datapunt per label); ~10 testbestanden omzetten **zonder assert-wijziging** (status, prognosis-*, prognose.diagnose incl. `:145`, status.bespreekgeval, DetailWeergave.vestiging).
- Bedoelde wijzigingen expliciet testen: compensatie O+E+G, `telLeerlijnenPerFase.test.ts:52` herschreven naar formule.

### T4 — UI-consumenten (R4c, R6)
- `DetailWeergave.tsx:58-62`: spider = `berekenEindoordelen(student.datapunten)` van het laatste record (D2a), cross-periode-lus weg.
- `DeelgebiedenMatrix.tsx:91,96-97`: 1 periode → formule over dat record; 2 periodes → formule per record (D4).
- Hydration-fix `DeelgebiedenMatrix.tsx:232` (spatie tussen `<td />` en comment); TODO T-2026-09-22-01 naar Completed bij oplevering.
- Nieuwe tests: `tests/DeelgebiedenMatrix.eindoordeel.test.tsx` (1 en 2 periodes, geen hydration-warning), `tests/DetailWeergave.spider.test.tsx` (scores-bron = laatste record).

### T5 — Na-meting
- Zelfde snapshot als T0; verschillentabel met verklaring per verschil (compensatie, geen cross-periode meer, D5-wisselwerking met BJ1 Trigger B); akkoord projectlead.
- `npm test`, `npm run typecheck`, `npm run typecheck-migrated` groen.

## Volgorde
T0 → T1 → (T2 → T3) ‖ T4 → T5. Lane A (T2/T3, `utils/` + prognose-tests) en Lane B (T4, `src/components/` + componenttests) kunnen parallel na T1.

## Niet in scope
Oud `telLeerlijnen`/`isNegatief`-pad verwijderen (TODO T-2026-09-23-01); migratie/wijziging van opgeslagen `deelgebiedScores` (D7); één definitie van "laatste periode" gelijktrekken; T-2026-06-18-14 (twijfelgeval-label).

## Release
MINOR-bump + CHANGELOG-entry (prognoses kunnen veranderen). `v2.12.0` (M42) is nog niet getagd; volgorde van releases bepaalt de projectlead.
