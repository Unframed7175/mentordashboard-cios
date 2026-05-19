# Mentordashboard CIOS — Dashboard 2

## What This Is

Een lokale webapplicatie voor mentoren van CIOS Zuidwest-NL die voortgang-PDFs per leerling en verzuim-Excel exports inleest en omzet naar een overzichtelijk dashboard. Het dashboard geeft per leerling een rood/oranje/groen prognose op basis van de officiële doorstroomnormeringen, zodat mentoren in minder dan 2 minuten klaar zijn voor een mentorgesprek — zonder door meerdere systemen te hoeven klikken. Meerdere klassen ondersteund met tabbladen, periodes vergelijkbaar per leerling, en PDF-export voor mentorgesprekverslagen.

## Core Value

Een mentor opent het dashboard, importeert de bestanden, en heeft direct alle info (voortgang + verzuim + doorstroomprognose) paraat voor elk mentorgesprek — zonder handmatig overschrijven.

## Current Milestone: v2.2 Onboarding, Export & Data Completeness

**Goal:** Mentoren kunnen de app in één gestructureerde flow instellen en alle benodigde data compleet aanleveren — inclusief BPV-stage uren en Rekenen/Nederlands — en een mentorgesprekverslag afdrukken als PDF.

**Target features:**
- Onboarding wizard — first-run stap-voor-stap: klas aanmaken → voortgang PDFs → verzuim Excel → stage Excel → instellingen
- Print-to-PDF export — mentorgesprekverslag afdrukken vanuit de detailweergave (EXP-01–04)
- BPV stage Excel parser — echte BPV-uren inlezen (nu gestubbed; vereist echt voorbeeldbestand)
- Rekenen & Nederlands — voortgang apart bijhouden met eigen doorstroomnorm
- Fix drag-and-drop — bestanden slepen op importveld werkt niet (bug Phase 16 UAT)

## Milestone: v2.1 Settings, Polish & Auto-class Detection — COMPLETE (2026-05-19)

**Goal:** Geef mentoren controle over app-instellingen en verwijder de handmatige workflow-wrijving bij eerste gebruik en terugkerende imports.

**Delivered:**
- ✓ Settings panel — dark mode toggle, bestandsbeheer, deelgebieden/leerlijnen config, drempelwaarden, BPV config (Phases 17–18)
- ✓ Auto class detection — klasnaam afleiden uit PDF-header bij eerste import (Phase 16)
- ✓ UI polish — Industry font, CIOS blue #009FE3, Material shadows, spider tooltips, responsive layout (Phase 19)

## Milestone: v2.0 Stack Modernisering — COMPLETE (2026-05-16)

**Goal:** Herbouw het mentordashboard op een professionele, toekomstbestendige stack die meerdere developers ondersteunt, native draait op Mac én Windows, en AVG-compliant leerlingdata opslaat.

**Delivered:**
- ✓ TypeScript + React + Vite — professionele DX, type-veiligheid (Phases 10–11)
- ✓ Tauri desktop wrapper — installeerbare .exe/.dmg app, capability-based security (Phases 10, 15)
- ✓ AES-256 versleutelde lokale opslag — AVG-compliant vervanging van plaintext localStorage (Phase 12)
- ✓ Bestandstoegang via drag-drop + dialoog — PDF, Excel, zip-backup (Phase 13)
- ✓ React componentenstructuur — UI volledig herschreven als herbruikbare componenten (Phase 14)
- ✓ Packaging & cross-platform — .exe (Windows) + .dmg (Mac) installers via CI/CD (Phase 15)

## Milestone: v1.2 Dashboard Redesign — COMPLETE (2026-04-24)

**Goal:** Mentordashboard krijgt een visuele upgrade in de CIOS Zuidwest huisstijl — cyaan kleurpallet, verbeterde tegels met aanwezigheidspercentage, en een professionele algehele uitstraling.

**Delivered:**
- ✓ Klasoverzicht-tegels tonen aanwezigheidspercentage (i.p.v. uren ongeoorloofd) in neutraal grijs (Phase 9)
- ✓ 3-delige verzuimbalk behouden (aanwezig / geoorloofd / ongeoorloofd) (Phase 9)
- ✓ Algeheel design in CIOS huisstijl: cyaan `#00AEEF`, navy `#003057`, bold sans-serif op structurele elementen (Phase 9)

## Milestone: v1.1 Klasbeheer & Export — COMPLETE (2026-04-23)

**Goal:** Mentor kan meerdere klassen beheren, fase 1 vs fase 2 per leerling vergelijken, en een volledig PDF-dossier afdrukken voor het mentorgesprek.

**Delivered:**
- ✓ Meerdere klassen als tabbladen (CSD2A / CSD2B) — eigen import, eigen data, schakelen zonder dataverlies (Phase 6)
- ✓ Periodes vergelijken in detailweergave — fase 1 + fase 2 naast elkaar, groei in V/G/E per deelgebied (Phase 7)
- ✓ Phase 11 toetsplan code volledig verwijderd — codebase hersteld naar schone post-Phase-7 staat (Phase 8)

## Current State (v1.0 baseline)

- **Shipped:** 2026-03-25
- **Stack:** ~3000 LOC JavaScript (browser-only, no build step, no server)
- **Files:** `index.html`, `app.js`, `parsers/pdf.js`, `parsers/excel.js`, `utils/schema.js`, `utils/datamodel.js`, `utils/prognosis.js`, `utils/leerlijnen.js`, `vendor/pdf.min.mjs` + `pdf.worker.min.mjs`
- **Status:** All 5 phases shipped. Ready for real-world use with CSD2A class.
- **Known gaps:** DET-02/03/04 partially validated — UI is implemented but full end-to-end verification requires live CSD2A data.

## Requirements

### Validated

- ✓ Voortgang PDF per leerling betrouwbaar inlezen (naam, deelgebied-scores V/G/E, opdracht-statussen, feed forward) — v1.0
- ✓ Verzuim Excel (.xls) inlezen: geoorloofd, ongeoorloofd, totaal per leerling — v1.0
- ✓ Doorstroomnorm calculatie: V/G/E tellen per leerlijn (lesgeven, organiseren, professioneel handelen) en vergelijken met BJ2 normen — v1.0
- ✓ Klasoverzicht: alle leerlingen met rood/oranje/groen status op basis van voortgang + verzuim — v1.0
- ✓ Detailweergave per leerling: volledige voortgang + verzuim + prognose op één scherm voor mentorgesprek — v1.0
- ✓ Leerlijn-mapping: mentor kan deelgebieden toewijzen aan leerlijnen (lesgeven / organiseren / professioneel handelen) — v1.0

### Validated (v1.1 milestone — completed 2026-04-23)

- ✓ Meerdere klassen beheren in één dashboard (tabbladen) — Validated in Phase 6
- ✓ Vergelijking tussen periodes (fase 1 vs fase 2) in detailweergave — Validated in Phase 7
- ✓ Codebase hersteld naar schone staat (Phase 11 toetsplan code verwijderd) — Validated in Phase 8

### Validated (v1.2 milestone — completed 2026-04-24)

- ✓ Aanwezigheidspercentage in klasoverzicht-tegels (i.p.v. uren ongeoorloofd) — Validated in Phase 9
- ✓ Algeheel UI redesign in CIOS Zuidwest huisstijl (cyaan, navy, bold sans-serif) — Validated in Phase 9

### Validated (v2.0 milestone — completed 2026-05-16)

- ✓ TypeScript + React + Vite — professionele codebase voor developer-contributors — Phases 10–11
- ✓ Tauri desktop wrapper — cross-platform .exe/.dmg, capability-based AVG-posture — Phases 10, 15
- ✓ AES-256 versleutelde lokale opslag — AVG-compliant vervanging van plaintext localStorage — Phase 12
- ✓ Per-leerling verwijderfunctie — Artikel 17 AVG compliance — Phase 12
- ✓ React componentenstructuur — UI herschreven als herbruikbare componenten — Phase 14

### Validated (v2.1 milestone — completed 2026-05-19)

- ✓ Settings panel (dark mode, bestandsbeheer, deelgebieden/leerlijnen configuratie, drempelwaarden, BPV config) — Phases 17–18
- ✓ Auto class detection bij eerste import — Phase 16
- ✓ UI polish (Industry font, CIOS blue, spider tooltips, responsive) — Phase 19

### Active (v2.2 milestone)

- [ ] Onboarding wizard — first-run stap-voor-stap klas + bestanden instellen
- [ ] Print-to-PDF export voor mentorgesprekverslag (EXP-01–04)
- [ ] BPV stage Excel parser — echte uren inlezen (vereist voorbeeldbestand)
- [ ] Rekenen & Nederlands voortgang apart bijhouden met eigen doorstroomnorm
- [ ] Fix drag-and-drop import (bug)

### Out of Scope

- API-koppeling met schoolsystemen — bewust gekozen voor bestandsimport vanwege slechte IT-systemen
- Inloggen / authenticatie — lokale tool voor één mentor, geen multi-user nodig
- Mobiele app — gebruik via browser op laptop/desktop
- Automatische PDF-download — mentor exporteert handmatig uit het systeem
- Word/docx export — browser print-to-PDF voldoet voor v1.1

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

## Constraints

- **Tech stack**: Puur browser (HTML/CSS/JS) — geen server, geen installatie, geen build-stap
- **Bestandsformaten**: PDF (voortgang) + .xls (oud Excel formaat, niet .xlsx)
- **PDF-variatie**: Layout van voortgang-PDFs kan licht variëren per leerling/periode — parser moet robuust zijn
- **Privacy**: Leerlingdata blijft lokaal — geen uploads naar externe diensten
- **Compatibiliteit**: Werkt in moderne browser (Chrome/Edge), geen installatie van dependencies door eindgebruiker

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browserapp zonder server | Geen installatie voor mentor, werkt overal | ✓ Goed — start.bat + Python http.server werkt eenvoudig |
| PDF per leerling (niet klassenrapport) | Zo genereert het systeem de exports | ✓ Correct — SomToday genereert inderdaad per leerling |
| .xls support vereist | Systeem exporteert in oud formaat | ✓ Correct — SheetJS verwerkt .xls zonder problemen |
| Leerlijn-mapping door mentor | Systeem kent de mapping niet; mentor weet dit | ✓ Goed — dropdown UI met localStorage persistentie werkt goed |
| workerSrc (niet workerPort) voor pdfjs | pdfjs 5.x doet intern `new Worker(src, {type:'module'})` — workerPort stuurt configure voor de worker klaar is | ✓ Kritiek — workerPort was kapot, revert naar workerSrc lost het op |
| Gemini cross-AI review vóór implementatie | Adversarial review pikt edge cases op die planning mist | ✓ Waardevol — alle 3 HIGH/MEDIUM issues voorspeld en bevestigd |
| Document-level drop prevention | Voorkomt browsernavigatie bij per ongeluk droppen van PDF buiten dropzone | ✓ Fix voor "bestandstype wordt niet ondersteund" Windows-fout |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase:** Move shipped requirements to Validated, log decisions, update Active.
**After each milestone:** Full review — Core Value, Out of Scope audit, Context update.

---
*Last updated: 2026-05-19 — v2.2 Onboarding, Export & Data Completeness milestone started*
