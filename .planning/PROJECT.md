# Mentordashboard CIOS — Dashboard 2

## What This Is

Een lokale webapplicatie voor mentoren van CIOS Zuidwest-NL (klas CSD2A) die voortgang-PDFs per leerling en verzuim-Excel exports inleest en omzet naar een overzichtelijk dashboard. Het dashboard geeft per leerling een rood/oranje/groen prognose op basis van de officiële doorstroomnormeringen, zodat mentoren in minder dan 2 minuten klaar zijn voor een mentorgesprek — zonder door meerdere systemen te hoeven klikken.

## Core Value

Een mentor opent het dashboard, importeert de bestanden, en heeft direct alle info (voortgang + verzuim + doorstroomprognose) paraat voor elk mentorgesprek — zonder handmatig overschrijven.

## Requirements

### Validated

(Nog geen — eerst bouwen en valideren)

### Active

- [ ] Voortgang PDF per leerling betrouwbaar inlezen (naam, deelgebied-scores V/G/E, opdracht-statussen, feed forward)
- [ ] Verzuim Excel (.xls) inlezen: geoorloofd, ongeoorloofd, totaal per leerling
- [ ] Doorstroomnorm calculatie: V/G/E tellen per leerlijn (lesgeven, organiseren, professioneel handelen) en vergelijken met BJ2 normen
- [ ] Klasoverzicht: alle leerlingen met rood/oranje/groen status op basis van voortgang + verzuim
- [ ] Detailweergave per leerling: volledige voortgang + verzuim + prognose op één scherm voor mentorgesprek
- [ ] Leerlijn-mapping: mentor kan deelgebieden toewijzen aan leerlijnen (lesgeven / organiseren / professioneel handelen)

### Out of Scope

- API-koppeling met schoolsystemen — bewust gekozen voor bestandsimport vanwege slechte IT-systemen
- Inloggen / authenticatie — lokale tool voor één mentor, geen multi-user nodig in v1
- Meerdere klassen — v1 focust op CSD2A; uitbreiding later
- Mobiele app — gebruik via browser op laptop/desktop
- Automatische PDF-download — mentor exporteert handmatig uit het systeem

## Context

- **Instelling**: CIOS Zuidwest-NL (samenwerkingscollege Scalda + Da Vinci College)
- **Klas**: CSD2A — ~19 leerlingen, basisjaar 2 (BJ2), opleiding Sport- en bewegingscoördinator
- **Periode**: BJ2 Fase 2 DD (Dordrecht)
- **Voortgang bron**: Systeem genereert één PDF per leerling per fase ("Mijn voortgang")
  - Bevat: naam, leerling-ID, periode, vakken met opdrachten + status + feed forward
  - Bevat: "Overzicht Deelgebieden" tabel — opdrachten × deelgebiedkolommen (V&A, M&M, INS, O&DW, C&B, 1E&B, P&O, S&O, ORG, I&B, 2E&B, PrCo, VSK, LOB, INFO, DESK, BS, TOW, BH) met scores V/G/E
- **Verzuim bron**: Excel export (.xls) uit studentvolgsysteem, sheet "Totaaloverzicht Verzuim"
  - Kolommen: studentnummer, naam, mentor, klas, aanwezigheid, geoorloofde afwezigheid, ongeoorloofde afwezigheid, totale afwezigheid, laatste verzuimmelding
  - Tijdformaat: "107u24m" (uren en minuten als tekst)
- **Doorstroomnormen** (BJ2 fase 2 → doorstroom naar BJ2 fase 3 / SBL / SBC):
  - Positief (BJ2): ≥13 deelgebieden voldoende in fase 2
  - Versneld traject (SBC): lesgeven ≥4 goed, organiseren ≥3 goed, professioneel handelen ≥5 goed
  - Negatief: >6 deelgebieden onvoldoende OF >2 onvoldoende binnen één leerlijn
  - Rekenen en Nederlands apart bijhouden
- **Betrouwbaarheid PDF-parsing is kritiek** — dit is het kernprobleem; onbetrouwbare parsing maakt het dashboard onbruikbaar
- **Geen installatie vereist** — openen in browser, bestanden importeren, klaar

## Constraints

- **Tech stack**: Puur browser (HTML/CSS/JS) — geen server, geen installatie, geen build-stap
- **Bestandsformaten**: PDF (voortgang) + .xls (oud Excel formaat, niet .xlsx)
- **PDF-variatie**: Layout van voortgang-PDFs kan licht variëren per leerling/periode — parser moet robuust zijn
- **Privacy**: Leerlingdata blijft lokaal — geen uploads naar externe diensten
- **Compatibiliteit**: Werkt in moderne browser (Chrome/Edge), geen installatie van dependencies door eindgebruiker

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browserapp zonder server | Geen installatie voor mentor, werkt overal | — Pending |
| PDF per leerling (niet klassenrapport) | Zo genereert het systeem de exports | — Pending |
| .xls support vereist | Systeem exporteert in oud formaat | — Pending |
| Leerlijn-mapping door mentor | Systeem kent de mapping niet; mentor weet dit | — Pending |

---
*Last updated: 2026-03-24 — project initialisatie*
