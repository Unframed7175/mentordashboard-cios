# PROJECT.md — Mentordashboard CIOS

> Gegenereerd op: 2026-05-30 (retroactief, op basis van bestaande codebase)

---

## Wat is dit product

**Mentordashboard CIOS** is een offline desktopapplicatie voor MBO-mentoren bij CIOS Zuid-West.
Mentoren kunnen leerlinggegevens importeren vanuit SomToday en zien per leerling:
- Doorstroomprognose (RAG-kleuring: rood / oranje / groen / blauw / grijs)
- Deelgebiedscores (19 deelgebieden, 3 leerlijnen)
- Verzuim (geoorloofd + ongeoorloofd, in minuten)
- BPV-voortgang
- Rekenen & Nederlands resultaten
- Mentor actiepunten (CRUD)

Geen internetverbinding vereist. Alle data versleuteld opgeslagen op de lokale computer (AES-256-GCM via Rust/Tauri).

---

## Doelgroep

- **Primaire gebruiker:** MBO-mentoren bij CIOS Zuid-West
- **Besturingssystemen:** Windows (primair) + macOS
- **Technisch niveau:** laag — mentoren zijn geen ontwikkelaars
- **Contactpersoon developer:** rafaelalvarez1010@gmail.com / ralvarezstam@cioszuidwest.nl

---

## Scope (wat het wel doet)

- PDF-import van SomToday voortgangsrapporten (batch, meerdere leerlingen)
- Excel-import van SomToday verzuimoverzicht (.xls)
- Excel-import van SomToday BPV-overzicht
- Multi-klas beheer (aanmaken, hernoemen, verwijderen, switchen)
- Per-leerling detailweergave met alle subsecties
- Spider chart (visuele weergave 3 leerlijnen)
- Doorstroomprognose BJ1 en BJ2 (configureerbare normen)
- Verzuim drempelwaarden configureerbaar
- Backup exporteren en importeren (ZIP)
- Dark mode / light mode
- Onboarding wizard (eerste keer starten)
- Feedback / bug melden (opent e-mailclient)
- Help pagina

## Buiten scope (wat het niet doet)

- Geen cloudopslag of synchronisatie
- Geen integratie met SomToday API — alleen bestandsimport
- Geen gebruikersbeheer of login
- Geen automatische updates
- Geen mobiele versie

---

## Versiegeschiedenis (fasen)

| Fase | Onderwerp |
|---|---|
| 01 | PDF parser (PDF.js, deelgebied-tabel, drag-drop UI) |
| 02 | Excel verzuim import (SheetJS, mergeVerzuim) |
| 03 | Doorstroomnorm engine (BJ1/BJ2, leerlijnen) |
| 04 | Klasoverzicht UI (nav, sortering, zoeken, localStorage) |
| 06 | Multi-klas (tab strip, modal, klassen.js) |
| 07 | Groei-badges, dedup leerlingId+periode |
| 10 | Spider chart |
| 11 | Backup/restore (fflate ZIP) |
| 12 | Tauri migratie (plugin-store, AES-256-GCM encryptie) |
| 13 | Feedback & actiepunten (CRUD, herhaling detectie) |
| 17 | Instellingen (light/dark theme) |
| 18 | Verzuim drempels configureerbaar |
| 25 | Doorstroomnormen configureerbaar (8 velden) |
| 28 | Feedback modal, ring buffer, system info |
| 29 | UI polish (BPV sectie, tiles, tab strip) |
| 30 | Help pagina, CI workflow (Windows + macOS) |
| 31 | CSS sizing correcties |
| 32 | Rekenen/Nederlands rij in leerling tegel |
| 33 | KlasVerwijderenModal (klas verwijderen met bevestiging) |

---

## Huidige versie

`2.0.0` — stabiel, productie-klaar, in gebruik bij CIOS Zuid-West
