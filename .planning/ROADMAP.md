# Roadmap: Mentordashboard CIOS — Dashboard 2

**Created:** 2026-03-24
**Milestone:** v1.0 — Werkend mentordashboard voor klas CSD2A

## Milestone Goal

Een mentor kan voortgang-PDFs en een verzuim-Excel importeren en heeft direct een klasoverzicht met rood/oranje/groen prognose per leerling, plus een detailweergave per leerling voor mentorgesprekken — volledig in de browser, geen installatie.

## Success Criteria

- [ ] Alle 19 voortgang-PDFs van CSD2A worden correct ingelezen (naam, deelgebieden, scores)
- [ ] Verzuim-Excel wordt correct gekoppeld aan leerlingen
- [ ] Doorstroomprognose klopt met handmatige berekening op basis van doorstroomnormen
- [ ] Klasoverzicht toont correcte rood/oranje/groen per leerling
- [ ] Mentorgesprek-voorbereiding duurt <2 minuten per leerling

---

## Phase 01 — PDF Parser & Data Model

**Goal:** Voortgang-PDFs betrouwbaar inlezen en opslaan in een bruikbaar data model.

**Requirements:** PDF-01 t/m PDF-08

**Plans:**
1. `01-01` — Data model definiëren (leerling, vak, opdracht, deelgebied-score)
2. `01-02` — PDF.js integreren + tekst extractie per pagina
3. `01-03` — Parser: header (naam, ID, periode) extractie
4. `01-04` — Parser: vakken + opdrachten + status + feed forward extractie
5. `01-05` — Parser: "Overzicht Deelgebieden" tabel extractie (V/G/E per deelgebied)
6. `01-06` — Batch import (meerdere PDFs tegelijk) + foutafhandeling

**Verification:** Parser leest alle 19 CSD2A PDFs correct in zonder handmatige correctie.

---

## Phase 02 — Excel Import & Koppeling

**Goal:** Verzuim-Excel inlezen en koppelen aan de leerlingdata uit PDFs.

**Requirements:** XLS-01 t/m XLS-04

**Plans:**
1. `02-01` — SheetJS integreren voor .xls support
2. `02-02` — Verzuimdata extraheren (naam, uren, laatste melding)
3. `02-03` — Koppeling verzuim ↔ voortgang op studentnummer en naam
4. `02-04` — Foutafhandeling bij ontbrekende koppeling / naamsvariaties

**Verification:** Alle 19 leerlingen uit Excel worden correct gekoppeld aan PDF-data.

---

## Phase 03 — Doorstroomnorm Engine

**Goal:** Automatisch doorstroomprognose berekenen per leerling op basis van officiële normen.

**Requirements:** NORM-01 t/m NORM-06

**Plans:**
1. `03-01` — Leerlijn-mapping UI: deelgebieden toewijzen aan leerlijn (lesgeven / organiseren / professioneel handelen)
2. `03-02` — Norm calculatie: V/G/E tellen per leerlijn per leerling
3. `03-03` — Prognose logica: Positief (BJ2), Versneld (SBC), Risico (negatief)
4. `03-04` — Gap-analyse: hoeveel deelgebieden ontbreken nog per norm

**Verification:** Prognose per leerling komt overeen met handmatige berekening aan de hand van doorstroomnormen.

---

## Phase 04 — Klasoverzicht

**Goal:** Overzichtstabel van de hele klas met status-indicator en navigatie naar detail.

**Requirements:** KLO-01 t/m KLO-05, PER-01 t/m PER-02

**Plans:**
1. `04-01` — App shell: HTML/CSS layout + navigatiestructuur
2. `04-02` — Klasoverzicht tabel met rood/oranje/groen status per leerling
3. `04-03` — Statussignaal: gecombineerde logica voortgang + verzuim
4. `04-04` — Sorteren + zoeken in de tabel
5. `04-05` — Data persistentie (localStorage/IndexedDB) + wissen

**Verification:** Klasoverzicht toont alle 19 leerlingen met correcte statuskleuren na import.

---

## Phase 05 — Detailweergave & Mentorgesprek

**Goal:** Volledig mentorgesprek-dossier per leerling op één scherm.

**Requirements:** DET-01 t/m DET-05, PER-03

**Plans:**
1. `05-01` — Detailpagina layout: voortgang per vak + feed forward
2. `05-02` — Verzuimblok in detail: aanwezigheid, geoorloofd, ongeoorloofd, trend
3. `05-03` — Prognoseblok: V/G/E per leerlijn + doorstroomadvies + gap-analyse
4. `05-04` — Notitieveld mentor (lokaal opgeslagen, persistent)
5. `05-05` — Navigatie terug naar klasoverzicht + leerling-aan-leerling navigatie

**Verification:** Mentor kan in <2 minuten alle benodigde info voor een mentorgesprek vinden op de detailpagina.

---

## Phase Summary

| Phase | Focus | Plans | Requirements |
|-------|-------|-------|--------------|
| 01 | PDF Parser | 6 | PDF-01–08 |
| 02 | Excel Import | 4 | XLS-01–04 |
| 03 | Doorstroomnorm | 4 | NORM-01–06 |
| 04 | Klasoverzicht | 5 | KLO-01–05, PER-01–02 |
| 05 | Detailweergave | 5 | DET-01–05, PER-03 |

**Totaal:** 5 fases, 24 plannen

---
*Roadmap created: 2026-03-24*
