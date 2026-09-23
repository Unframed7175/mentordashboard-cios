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
