# Roadmap: Mentordashboard CIOS — Dashboard 2

## Overview

Vijf fases die stap voor stap het dashboard opbouwen. Phase 1 bouwt de PDF-parser — het kritieke hart van het systeem dat voortgang-PDFs per leerling betrouwbaar uitleest. Phase 2 voegt verzuimdata toe via Excel-import en koppelt die aan leerlingen. Phase 3 implementeert de doorstroomnorm-engine die automatisch prognoses berekent. Phase 4 levert het klasoverzicht met rood/oranje/groen per leerling. Phase 5 maakt de detailweergave per leerling voor mentorgesprekken. Elke fase eindigt met een aantoonbaar werkende capability.

## Phases

- [ ] **Phase 1: PDF Parser** - Voortgang-PDFs per leerling betrouwbaar inlezen: naam, deelgebied-scores V/G/E, opdracht-statussen en feed forward
- [ ] **Phase 2: Excel Import** - Verzuim-Excel (.xls) inlezen en koppelen aan leerlingen uit PDF-data
- [ ] **Phase 3: Doorstroomnorm Engine** - Leerlijn-mapping, V/G/E-telling per leerlijn, en prognoseberekening op basis van officiële doorstroomnormen
- [ ] **Phase 4: Klasoverzicht** - Overzichtstabel van hele klas met rood/oranje/groen status, sorteren, zoeken en data-persistentie
- [ ] **Phase 5: Detailweergave** - Volledig mentorgesprek-dossier per leerling met voortgang, verzuim, prognose en notities

## Phase Details

### Phase 1: PDF Parser
**Goal**: App leest voortgang-PDFs per leerling betrouwbaar in — naam, leerling-ID, periode, opdrachtstatus, feed forward en V/G/E-scores per deelgebied worden correct geëxtraheerd uit alle 19 CSD2A-PDFs
**Depends on**: Nothing (first phase)
**Requirements**: PDF-01, PDF-02, PDF-03, PDF-04, PDF-05, PDF-06, PDF-07, PDF-08
**Success Criteria** (what must be TRUE):
  1. Mentor kan één of meerdere PDFs tegelijk importeren via drag-and-drop of bestandskiezer
  2. Naam, leerling-ID en periode worden correct uitgelezen voor elke leerling
  3. Alle opdrachten per vak worden uitgelezen met correcte status (Op tijd ingeleverd / Zelfevaluatie afgerond / leeg) en feed forward tekst
  4. "Overzicht Deelgebieden" tabel wordt volledig uitgelezen: V/G/E per deelgebied per opdracht
  5. Parser werkt correct voor alle 19 CSD2A-PDFs zonder handmatige correctie
  6. Bij een onleesbare of onverwachte PDF verschijnt een duidelijke foutmelding
**Plans**: TBD
**UI hint**: no

### Phase 2: Excel Import
**Goal**: Mentor kan de verzuim-Excel (.xls) importeren en alle verzuimdata wordt correct gekoppeld aan de leerlingen uit de PDF-import
**Depends on**: Phase 1
**Requirements**: XLS-01, XLS-02, XLS-03, XLS-04
**Success Criteria** (what must be TRUE):
  1. Mentor kan een .xls bestand importeren via bestandskiezer
  2. Per leerling: aanwezigheid, geoorloofd, ongeoorloofd, totaal en laatste verzuimmelding zijn correct uitgelezen
  3. Tijdformaat "107u24m" wordt correct omgezet naar minuten voor berekeningen
  4. Alle 19 leerlingen uit de Excel worden gekoppeld aan de bijbehorende PDF-data via naam of studentnummer
  5. Naamsvariaties (bijv. "van den Dool" vs "van den dool") worden correct afgehandeld
**Plans**: TBD
**UI hint**: no

### Phase 3: Doorstroomnorm Engine
**Goal**: App berekent automatisch een doorstroomprognose per leerling op basis van de officiële CIOS-normen, nadat de mentor deelgebieden heeft toegewezen aan leerlijnen
**Depends on**: Phase 2
**Requirements**: NORM-01, NORM-02, NORM-03, NORM-04, NORM-05, NORM-06
**Success Criteria** (what must be TRUE):
  1. Mentor kan deelgebieden toewijzen aan leerlijnen (lesgeven / organiseren / professioneel handelen) via een overzichtelijke UI
  2. App telt automatisch V/G/E per leerlijn per leerling
  3. Prognose "Positief (BJ2)" wordt correct berekend: ≥13 deelgebieden voldoende totaal
  4. Prognose "Versneld (SBC)" wordt correct berekend: lesgeven ≥4 G, organiseren ≥3 G, professioneel handelen ≥5 G
  5. Risicosignaal "Negatief" wordt correct berekend: >6 onvoldoende OF >2 onvoldoende binnen één leerlijn
  6. Gap-analyse toont hoeveel deelgebieden nog ontbreken t.o.v. elke norm
  7. Berekende prognose komt overeen met handmatige berekening voor alle 19 leerlingen
**Plans**: TBD
**UI hint**: no

### Phase 4: Klasoverzicht
**Goal**: Mentor ziet de hele klas in één tabel met rood/oranje/groen status per leerling, kan sorteren en zoeken, en data blijft bewaard na sluiten browser
**Depends on**: Phase 3
**Requirements**: KLO-01, KLO-02, KLO-03, KLO-04, KLO-05, PER-01, PER-02
**Success Criteria** (what must be TRUE):
  1. Alle 19 leerlingen verschijnen in een overzichtstabel na import
  2. Elke leerling heeft een duidelijke rood/oranje/groen kleur gebaseerd op gecombineerd voortgang + verzuim signaal
  3. Mentor kan sorteren op naam, status en ongeoorloofd verzuim
  4. Mentor kan zoeken op naam en de tabel filtert direct mee
  5. Na sluiten en heropenen van de browser zijn alle geïmporteerde data en instellingen nog aanwezig
  6. Mentor kan data wissen en opnieuw importeren
**Plans**: TBD
**UI hint**: yes

### Phase 5: Detailweergave
**Goal**: Mentor kan per leerling alle benodigde informatie voor een mentorgesprek op één scherm zien: volledige voortgang, verzuim, doorstroomprognose met gap-analyse en persoonlijke notities
**Depends on**: Phase 4
**Requirements**: DET-01, DET-02, DET-03, DET-04, DET-05, PER-03
**Success Criteria** (what must be TRUE):
  1. Klikken op een leerling in het klasoverzicht opent de detailpagina voor die leerling
  2. Volledige voortgang per vak/opdracht is zichtbaar met status en feed forward tekst
  3. Verzuimoverzicht toont aanwezigheid, geoorloofd, ongeoorloofd en laatste melding
  4. Doorstroomprognose toont V/G/E-telling per leerlijn met gap-analyse t.o.v. norm
  5. Mentor kan notities toevoegen per leerling (lokaal opgeslagen, persistent)
  6. Navigatie terug naar klasoverzicht en naar volgende/vorige leerling werkt correct
  7. Mentor kan in <2 minuten alle benodigde info voor een mentorgesprek vinden
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. PDF Parser | 0/? | Not started | - |
| 2. Excel Import | 0/? | Not started | - |
| 3. Doorstroomnorm Engine | 0/? | Not started | - |
| 4. Klasoverzicht | 0/? | Not started | - |
| 5. Detailweergave | 0/? | Not started | - |
