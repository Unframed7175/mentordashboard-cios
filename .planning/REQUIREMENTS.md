# Requirements: Mentordashboard CIOS — Dashboard 2

**Defined:** 2026-03-24
**Core Value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.

## v1 Requirements

### PDF Parsing (Voortgang)

- [ ] **PDF-01**: App leest een voortgang-PDF in via drag-and-drop of bestandskiezer
- [ ] **PDF-02**: Naam, leerling-ID en periode worden correct uitgelezen
- [ ] **PDF-03**: Per vak worden opdrachten en hun status uitgelezen (Op tijd ingeleverd / Zelfevaluatie afgerond / leeg)
- [ ] **PDF-04**: Feed Forward tekst per opdracht wordt uitgelezen
- [ ] **PDF-05**: "Overzicht Deelgebieden" tabel wordt uitgelezen — scores V/G/E per deelgebied per opdracht
- [ ] **PDF-06**: Meerdere PDFs tegelijk importeerbaar (hele klas in één keer)
- [ ] **PDF-07**: Parser is robuust bij kleine layout-variaties tussen leerlingen/periodes
- [ ] **PDF-08**: Foutmelding bij onleesbare of onverwachte PDF-structuur

### Excel Import (Verzuim)

- [ ] **XLS-01**: App leest .xls verzuimexport in via bestandskiezer
- [ ] **XLS-02**: Per leerling: aanwezigheid, geoorloofd, ongeoorloofd, totaal en laatste verzuimmelding uitgelezen
- [ ] **XLS-03**: Tijdformaat "107u24m" wordt correct geparsed naar minuten
- [ ] **XLS-04**: Koppeling tussen leerling in verzuim-Excel en voortgang-PDF via naam of studentnummer

### Doorstroomnorm Calculatie

- [ ] **NORM-01**: Mentor kan deelgebieden toewijzen aan leerlijnen (lesgeven / organiseren / professioneel handelen)
- [ ] **NORM-02**: App telt automatisch V/G/E per leerlijn per leerling
- [ ] **NORM-03**: Prognose "Positief (BJ2)" berekend: ≥13 deelgebieden voldoende totaal
- [ ] **NORM-04**: Prognose "Versneld (SBC)" berekend: lesgeven ≥4 G, organiseren ≥3 G, prof. handelen ≥5 G
- [ ] **NORM-05**: Risicosignaal "Negatief": >6 deelgebieden onvoldoende OF >2 onvoldoende binnen één leerlijn
- [ ] **NORM-06**: Prognose toont hoeveel deelgebieden nog ontbreken t.o.v. norm (gap-analyse)

### Klasoverzicht

- [ ] **KLO-01**: Overzichtstabel alle leerlingen met rood/oranje/groen status
- [ ] **KLO-02**: Status gebaseerd op gecombineerd voortgang + verzuim signaal
- [ ] **KLO-03**: Klikbaar naar detailweergave per leerling
- [ ] **KLO-04**: Sorteren op naam, status, ongeoorloofd verzuim
- [ ] **KLO-05**: Zoeken/filteren op naam

### Detailweergave Leerling

- [ ] **DET-01**: Volledige voortgang per vak/opdracht met status en feed forward
- [ ] **DET-02**: Verzuimoverzicht: aanwezigheid, geoorloofd, ongeoorloofd, laatste melding
- [ ] **DET-03**: Doorstroomprognose met V/G/E-telling per leerlijn
- [ ] **DET-04**: Visuele gap-analyse: wat mist de leerling nog voor doorstroom?
- [ ] **DET-05**: Notitieveld voor mentor (lokaal opgeslagen)

### Data Persistentie

- [ ] **PER-01**: Geïmporteerde data blijft beschikbaar na pagina-refresh (localStorage of IndexedDB)
- [ ] **PER-02**: Mentor kan data wissen en opnieuw importeren
- [ ] **PER-03**: Mentor-notities blijven bewaard los van import-data

## v2 Requirements

### Uitbreiding

- Meerdere klassen beheren in één dashboard
- Vergelijking tussen periodes (fase 1 vs fase 2)
- Export naar PDF/Word voor mentorgesprekverslag
- Rekenen en Nederlands voortgang apart bijhouden met eigen norm

## Out of Scope

| Feature | Reason |
|---------|--------|
| API-koppeling met schoolsystemen | Bewust gekozen voor bestandsimport — systemen zijn te slecht |
| Inloggen / authenticatie | Lokale tool voor één mentor, geen multi-user in v1 |
| Mobiele app | Browser op laptop/desktop voldoet |
| Automatische PDF-download | Mentor exporteert handmatig uit systeem |
| Server-side opslag | Privacy — leerlingdata blijft lokaal |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PDF-01 t/m PDF-08 | Phase 1 — PDF Parser | Pending |
| XLS-01 t/m XLS-04 | Phase 2 — Excel Import | Pending |
| NORM-01 t/m NORM-06 | Phase 3 — Doorstroomnorm | Pending |
| KLO-01 t/m KLO-05 | Phase 4 — Klasoverzicht | Pending |
| DET-01 t/m DET-05 | Phase 5 — Detailweergave | Pending |
| PER-01 t/m PER-03 | Phase 4/5 — Persistentie | Pending |

**Coverage:**
- v1 requirements: 30 totaal
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 — project initialisatie*
