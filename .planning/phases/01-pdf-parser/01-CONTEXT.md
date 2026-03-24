# Phase 1: PDF Parser - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Voortgang-PDFs per leerling betrouwbaar inlezen en de geëxtraheerde data in-memory beschikbaar stellen. Elke PDF bevat: naam, leerling-ID, periode, vakken met opdrachten (status + feed forward), en de "Overzicht Deelgebieden" tabel met V/G/E-scores. Persistentie naar IndexedDB/localStorage is buiten scope — dat is Phase 4.

Dit is de kritieke fase: als de parser onbetrouwbaar is, werkt het hele dashboard niet.

</domain>

<decisions>
## Implementation Decisions

### Import UX
- **D-01:** Drag-and-drop zone én "Kies bestanden" knop — beide opties beschikbaar
- **D-02:** Meerdere PDFs tegelijk selecteerbaar/dropbaar (de hele klas in één keer)
- **D-03:** Geen per-leerling workflow — batch import is de standaard

### Import feedback
- **D-04:** Live teller tijdens verwerking: "Verwerkt: 12/19 PDFs" — zichtbaar per bestand zodra het klaar is
- **D-05:** Import gaat door bij fouten in individuele bestanden — partial success is gewenst

### Foutafhandeling
- **D-06:** Per mislukt bestand: bestandsnaam + specifieke reden tonen (bijv. "Bosker_Javier.pdf: Overzicht Deelgebieden tabel niet gevonden")
- **D-07:** Succesvolle bestanden worden altijd verwerkt, ook als andere falen
- **D-08:** Na import: overzicht van successen én fouten, zodat de mentor weet welke PDFs opnieuw aangeboden moeten worden

### Parser betrouwbaarheid (kritiek)
- **D-09:** Parser moet robuust zijn voor kleine layout-variaties tussen leerlingen/periodes
- **D-10:** "Overzicht Deelgebieden" tabel-extractie is de moeilijkste stap — 19 kolommen (V&A, M&M, INS, O&DW, C&B, 1E&B, P&O, S&O, ORG, I&B, 2E&B, PrCo, VSK, LOB, INFO, DESK, BS, TOW, BH) met scores V/G/E
- **D-11:** Veldnamen als "Op tijd ingeleverd en wel beoordeeld", "Zelfevaluatie afgerond" zijn de statuswaarden om op te matchen

### Data model (in-memory)
- **D-12:** Parsed data wordt in-memory opgeslagen als gestructureerd object (array van leerlingobjecten)
- **D-13:** Geen persistentie in Phase 1 — dat is Phase 4's verantwoordelijkheid
- **D-14:** Data model moet de doorstroomnorm-calculatie (Phase 3) kunnen ondersteunen: deelgebied-scores per leerling moeten opvraagbaar zijn

### Claude's Discretion
- Keuze van PDF.js versie / configuratie
- Exacte structuur van het data model (zolang het D-14 ondersteunt)
- Visueel ontwerp van de import UI (past bij een functionele browser-tool)
- Hoe de deelgebied-kolommen worden gedetecteerd (header-matching strategie)

</decisions>

<specifics>
## Specific Ideas

- De 19 deelgebied-kolommen zijn exact: V&A, M&M, INS, O&DW, C&B, 1E&B, P&O, S&O, ORG, I&B, 2E&B, PrCo, VSK, LOB, INFO, DESK, BS, TOW, BH — de parser moet deze herkennen
- Status-waarden in de PDF zijn: "Op tijd ingeleverd en wel beoordeeld", "Zelfevaluatie afgerond", of leeg
- Scores in de deelgebied-tabel: V (Voldoende), G (Goed), E (Excellent) — soms ook leeg
- Er zijn ~19 leerlingen in klas CSD2A, elk hun eigen PDF-bestand
- De PDF-header bevat: "Naam: [naam]", "Leerling ID: [id]", "Periode: [periode]", "Leerjaar [x]"
- Voorbeeld bestandsnaam: "Voortgang-5-BJ2 Fase 2 DD-Bosker, J.G. (Javier-Andrès).pdf"

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` §PDF Parsing — Volledige lijst van PDF-01 t/m PDF-08 requirements
- `.planning/PROJECT.md` §Context — Beschrijving van PDF-structuur en deelgebied-kolommen
- `.planning/ROADMAP.md` §Phase 1 — Success criteria voor de PDF Parser fase

### Sample data
- `C:/Users/rafae/Desktop/Dashboard files/CIOS Files/` — Locatie van echt .xls bestand (verzuim)
- `D:/Downloads/Voortgang-CSD2A fase 2/` — Locatie van echte voortgang-PDFs (referentie bij testen)

No external specs or ADRs — requirements are fully captured in decisions above and REQUIREMENTS.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Geen bestaande code — greenfield project

### Established Patterns
- Browser-only: geen Node.js, geen build-stap, geen server
- Alle dependencies als vendored/CDN scripts (geen npm voor eindgebruiker)
- Data blijft lokaal (privacy-vereiste)

### Integration Points
- Phase 2 (Excel Import) sluit aan op hetzelfde data model dat Phase 1 produceert
- Phase 3 (Doorstroomnorm) leest deelgebied-scores uit het Phase 1 data model
- Phase 4 (Klasoverzicht) persisteert de gecombineerde data van Phase 1+2

</code_context>

<deferred>
## Deferred Ideas

- Persistentie van parsed data — Phase 4
- Koppeling met verzuim-data — Phase 2
- Doorstroomnorm calculatie — Phase 3

</deferred>

---

*Phase: 01-pdf-parser*
*Context gathered: 2026-03-24*
