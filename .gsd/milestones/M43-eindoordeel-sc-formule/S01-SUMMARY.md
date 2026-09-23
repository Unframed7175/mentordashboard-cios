# S01-SUMMARY.md — M43 Eindoordeel via S/C-formule

## T0 — Verificatie + nulmeting (2026-09-23)

**Input:** 4 echte exports "Rapport vanaf 2026-2027 niv 3-niv 4" (2 leerlingen + 2 exports van een testleerling), aangeleverd door de projectlead. Geparsed met `parseSinglePDF` via een tijdelijk, niet-gecommit Vitest-script (console gedempt; alleen `leerlingId`s vastgelegd). Snapshot staat buiten de repo (sessie-scratchpad).

**Context van de projectlead:** één export bevat nu alle fases van een leerjaar (niet meer één export per fase). Bevestigd: fase-tags 1/2/3 komen binnen één export voor (bv. `{1: 21, 2: 33, null: 6}`).

### 1. D5 — niet-ingeleverd → O
- **Niet verifieerbaar.** Geen enkel datapunt met status "niet ingeleverd" / "te laat ingeleverd en niet beoordeeld" in de 4 exports; ook de ruwe PDF-tekst (`pdftotext`) bevat die zin nergens. Het is begin schooljaar: 0-2 beoordeelde cellen per leerling, 0 opdrachtstatussen in de vak-secties.
- Uitkomst valt dus niet onder (a) of (b) uit het plan → stoppunt: D5 wacht op een export met een niet-ingeleverd datapunt (of een projectleadbeslissing).

### 2. "Laatste periode"-sortering
- `getAllRecordsForStudent` (alfabetisch): klopt voor de nieuwe periodestrings ("BJ1 DD ‐ 2026/2027" < "BJ2 DD ‐ 2026/2027").
- `KlasOverzicht.computeTrend` (numeriek, alle cijfers aan elkaar): **fout bij het nieuwe formaat.** "BJ1 Fase 1 RSD ‐ 2026/2027" → 1120262027, "BJ2 RSD ‐ 2026/2027" → 220262027, dus BJ1 wordt als *nieuwer* gesorteerd dan BJ2 en de trendpijl draait om. Bestaande bug, buiten M43-scope.

### 3. Nulmeting
| # | leerlingId | periode | datapunten | beoordeelde cellen | latest-wins = formule? | status (alle 3 vestigingen gelijk) |
|---|---|---|---|---|---|---|
| 0 | 301341 | BJ1 Fase 1 RSD | 56 | PO: G | ja | oranje Twijfelgeval (neutraal) |
| 1 | 250508 | BJ2 RSD | 43 | geen | ja | grijs Onbekend (bespreekgeval) |
| 2 | PCD_S1 | BJ2 DD | 58 | PO: V, OIH: O | ja | oranje Bespreekgeval |
| 3 | PCD_S1 | BJ1 DD | 60 | geen | ja | grijs Onbekend (neutraal) |

- Omdat elk deelgebied hoogstens één beoordeling heeft, geven formule en latest-wins **exact hetzelfde** voor alle 4. M43 verandert voor deze exports niets zichtbaars; de echte voor/na-vergelijking (T5) heeft data met meerdere beoordelingen per deelgebied nodig.

## T1-T4 — Implementatie (2026-09-23, branch `feature/m43-eindoordeel`)

| Taak | Commit | Inhoud |
|---|---|---|
| T1 | `391e9dd` | `berekenEindoordelen(datapunten, {fase?})` in `utils/aggregation.ts` (hergebruikt S/C-kern + E-plafond, elk label aanwezig, null zonder beoordeling, fasefilter), doc-comment-diagram (R2). 16 nieuwe tests, eerst RED. |
| T2+T3 | `7c8102f` | BJ1 Trigger A, BJ2 ≥V, `berekenPrognose`, `telLeerlijnenPerFase` (fase 2 + Roosendaal fase 3) via `berekenEindoordelen`; elke functie roept zelf aan (R1); helper `actieveDeelgebieden` (R3); T06-lus weg (was no-op); comments bijgewerkt. Fixture-helper `datapuntenVoorScores` (fase 0), geen assert gewijzigd (R4a). 4 fixtures met tegenstrijdige bronnen consistent gemaakt; `telLeerlijnenPerFase`-test herschreven naar formule en bewezen falend op oude code (R4b). |
| T4 | `0fcfcda` | Spider chart = formule over laatste record (D2a); matrix-voettekst 1 en 2 periodes via formule per record (D4); whitespace-tekstnodes in tfoot weg (R6). Componenttests met bewust tegenstrijdige bronnen (R4c). |

Afwijking van het plan: `ONVOLDOENDE_INLEVER_STATUSSEN` niet verplaatst (D5 geparkeerd, ADR-18b). `aggregateLatestScores` wordt alleen nog door `parsers/pdf.ts` gebruikt (compatibiliteitsveld).

**Verificatie:** `npm test` 666 passed / 5 skipped; `npm run typecheck` en `npm run typecheck-migrated` schoon.

## T5 — Voor/na-meting (ADR-18b: synthetisch + later echt)

Zelfde script op `master` (oud, tijdelijke worktree) en op deze branch (nieuw), over de 4 echte exports plus synthetische extra beoordelingen op de eerste 4 deelgebieden (alleen `leerlingId`s, niet gecommit).

| Variant | Matrix | Spider | Prognose-tellingen | Verklaring |
|---|---|---|---|---|
| echt | = | = | = | ≤1 beoordeling per deelgebied → formule = latest-wins |
| compensatie (G,O / G,O / E,O) | = | O→V, O→V, O→G | 3 O → ≥V (BJ1 `aantalO` −3, BJ2 `aantalV` +3) | O wordt gecompenseerd i.p.v. overschreven |
| E-plafond (G,G,V ×2) | = | V→G | = | blijft ≥V; categorie verandert niet |
| knock-out (7O, 1G, 4E) | = | E→O | ≥V −1, O +1 | C = 3 blokkeert ondanks 4 E's |

- Matrix: nergens verschil — de Eindoordeel-rij gebruikte de formule al.
- Alle 3 vestigingen gaven identieke uitkomsten. Geen status-/prognoselabel kantelde (tellingen blijven onder de drempels).
- Elk verschil is terug te voeren op een bedoelde regel. **Wacht op akkoord projectlead.** Later in het jaar: hetzelfde script op echte exports met meerdere beoordelingen per deelgebied.
