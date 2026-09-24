# M43-LEARNINGS — Eindoordeel per deelgebied overal via S/C-formule

> Geschreven na afronding Fase 4 (2026-09-24). Versie v2.13.0 (nog niet getagd). Gemerged via PR #31 (docs) en PR #32 (code, merge `a7ab976`).

## Wat werkte

- **Afleiden bij het lezen i.p.v. opslaan (ADR-18 D7).** De opgeslagen latest-wins-`deelgebiedScores` gaven "twee waarheden": de matrix-rij Eindoordeel rekende met de S/C-formule, prognose/spider/twee-periode-matrix met "laatste score wint". Door alles via één functie (`berekenEindoordelen`) uit `record.datapunten` af te leiden, was er geen datamigratie nodig en rekenen oude imports automatisch mee. Het veld blijft alleen voor compatibiliteit/backups.
- **T0 op echte exports vóór enige code.** Leverde twee dingen op die het design niet wist: (1) de oude "niet ingeleverd → O"-lus (T06) was altijd een no-op, omdat `dp.scores` alleen ingevulde cellen bevat; (2) één export bevat nu alle fases van een schooljaar (niet meer één export per fase). Ook de omgekeerde trendpijl bij het nieuwe periodeformaat kwam hier boven (TODO T-2026-09-23-03).
- **`/review` vond een echte stille fout:** onbekende scorestrings telden als voldoende in de S/C-formule. Fix: `hasOwnProperty`-check op `SCORE_VALUE` (commit `a09337f`) + regressietests (ADR-18c F3).

## Wat beter kan

- **Voor/na-meting op echte data zegt vroeg in het jaar niets.** Op de echte exports (begin schooljaar, ≤1 beoordeling per deelgebied) waren formule en latest-wins identiek → geen enkel verschil. Een synthetische set (compensatie, E-plafond, knock-out) was nodig om de verandering zichtbaar te maken. Les: bij een formulewijziging vooraf checken of de testdata de gewijzigde paden wel raakt. De echte meting moet later in het jaar herhaald worden (zelfde script, zie S01-SUMMARY T5).
- **Gevolgen van de formule pas in `/review` zichtbaar.** Met V = 0 compenseert een latere V een eerdere O niet (deelgebied blijft het hele jaar onvoldoende), en herkansingen als aparte PDF-rij tellen als extra beoordeling i.p.v. vervanging. Bewust zo gelaten (ADR-18c F1); TODO T-2026-09-23-04 om dit met echte exports opnieuw te beoordelen. Volgende keer: in Fase 0 een scenario "verbetering door het jaar heen" doorrekenen.

## QA-valkuilen (vite-dev)

- Herladen van de pagina wist de geïmporteerde data (geen Tauri-store in browsermodus, alleen in-memory): na een reload opnieuw importeren.
- Dark mode zit op `body.dark` (KNOWLEDGE P-03): voor de donkere axe-run die class zetten, niet op een ander thema-mechanisme gokken.
- Wacht na een thema-wissel op de CSS-kleurtransitie vóór axe draait; anders meet je tijdelijke color-contrast-violations (niet reproduceerbaar, meetartefact).

## Openstaand / volgende milestone

- Tag `v2.13.0` pushen (en `v2.12.0` van M42) — projectlead, bewuste actie (triggert `release.yml` + auto-updater).
- TODO T-2026-09-23-02 (D5: niet-ingeleverd → O, wacht op echte export met zo'n datapunt).
- TODO T-2026-09-23-03 (periode-sortering trendpijl/spider, aparte `fix/`-branch).
- TODO T-2026-09-23-04 (herkansingen en late verbetering in de S/C-formule).
- TODO T-2026-09-23-01 (oud `telLeerlijnen`/`isNegatief`-pad verwijderen).
