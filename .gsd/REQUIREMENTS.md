# REQUIREMENTS.md — Mentordashboard CIOS

> Gegenereerd op: 2026-05-30 (retroactief, op basis van bestaande codebase)

---

## Functionele eisen

### F-01 · PDF import
- Mentor kan één of meerdere Cumlaude PDF-voortgangsrapporten importeren
- Drag-and-drop en bestandskiezer worden beide ondersteund
- Meerdere imports worden samengevoegd — eerder geïmporteerde leerlingen blijven behouden
- Deduplicatie op `leerlingId + periode` (nieuwste import wint)
- Importfouten worden zichtbaar gemeld (per bestand met reden)

### F-02 · Verzuim import
- Mentor kan een Cumlaude verzuimoverzicht (.xls) importeren
- Verzuim wordt gekoppeld aan bestaande leerlingen op basis van naam
- Geoorloofd en ongeoorloofd verzuim (in minuten) worden opgeslagen

### F-03 · BPV import
- Mentor kan een Cumlaude BPV-overzicht (Excel) importeren
- BPV-data wordt gekoppeld aan bestaande leerlingen

### F-04 · Multi-klas beheer
- Mentor kan meerdere klassen aanmaken (met naam)
- Dubbele klasnamen worden afgewezen (case-insensitive)
- Mentor kan wisselen tussen klassen via tab strip
- Mentor kan een klas hernoemen
- Mentor kan een klas verwijderen na bevestiging (met leerlingtelling)
- Na verwijdering: automatisch switch naar eerste resterende klas, of naar import-scherm als geen klassen meer

### F-05 · Klasoverzicht
- Alle leerlingen in de actieve klas worden getoond als tegels
- Elke tegel toont: naam, RAG-kleur, status-label
- Tegels worden gesorteerd op status (rood eerst) en daarna op naam
- Klik op tegel opent detailweergave

### F-06 · Doorstroomprognose (RAG)
| Kleur | Label | Conditie |
|---|---|---|
| Grijs | Onbekend | Geen scores |
| Rood | Risico | Prognose = negatief |
| Oranje | Let op | Prognose = neutraal |
| Oranje | Verzuim | Ongeoorloofd > drempel OF geoorloofd > drempel |
| Blauw | Profieljaar SBC | Prognose = sbc (BJ2) |
| Blauw | Versneld SBC | Prognose = versneld_sbc (BJ1) |
| Groen | Op koers | Prognose = sbl of naar_bj2 of fallback |

### F-07 · Doorstroomnorm engine
- Trajecten: BJ1 (einde basisjaar 1) en BJ2 (einde basisjaar 2)
- Traject detectie: primair uit `periode`-veld PDF, fallback op `leerjaar`
- 19 deelgebieden, 3 leerlijnen: lesgeven, organiseren, prof_handelen
- 4 scorelevels: onvoldoende, voldoende, goed, excellent
- Normen zijn configureerbaar (8 drempelwaarden, zie F-12)

### F-08 · Detailweergave leerling
- Toont alle subsecties: deelgebieden matrix, doorstroomprognose, vakken/opdrachten, verzuim, BPV, rekenen/Nederlands, leerlijnen, spider chart, actiepunten
- Navigeer naar vorige/volgende leerling (in sorteervolgorde klasoverzicht)
- Terugknop naar klasoverzicht

### F-09 · Actiepunten (mentor notities)
- Mentor kan actiepunten aanmaken per leerling (onderwerp + datum + status)
- Statussen: open, opgepakt, herhaling
- Herhaling wordt automatisch gedetecteerd
- CRUD: aanmaken, bewerken, verwijderen
- Opgeslagen bij de leerling, persistent in plugin-store

### F-10 · Spider chart
- Visuele radar/spider chart met 3 assen (leerlijnen)
- Toont % voldoende-of-hoger per leerlijn

### F-11 · Backup & restore
- Mentor kan een gecomprimeerde backup exporteren (ZIP)
- Backup kan worden teruggezet: overschrijven of samenvoegen
- Backup bevat alle klassenState (klassen + studenten + actiepunten)

### F-12 · Instellingen
- Theme: light / dark / system
- Verzuim drempels: ongeoorloofd en geoorloofd (in minuten), configureerbaar
- Doorstroomnormen: 8 drempelwaarden configureerbaar, reset naar standaard

### F-13 · Onboarding wizard
- Verschijnt één keer bij eerste start (of na wissen app-data)
- Stappen: klas aanmaken, PDF's importeren, verzuim, BPV, voltooien
- Daarna niet meer zichtbaar

### F-14 · Feedback / bug melden
- Knop in navigatiebalk opent e-mailclient met pre-ingevuld adres
- Feedback modal met diagnostische info (ring buffer, system info)

### F-15 · Help pagina
- Inline help pagina met uitleg over de app

### F-16 · Distributie & installatie (M41)
- Eén publieke, deelbare downloadlink (landingspagina) — collega's komen nooit op de ruwe GitHub-releases-pagina
- Pre-install-gids per OS (Windows SmartScreen, macOS Gatekeeper incl. Apple Silicon), OS-kies-eerst, geruststelling vóór elke waarschuwing
- Downloadknoppen in gewone taal (Windows / Mac met Apple chip / Mac met Intel chip)
- Een update via de in-app updater toont géén nieuwe OS-waarschuwing (geverifieerd per OS)
- In-app Help bevat alleen post-install-uitleg (kleurlegenda, offline + versleuteld), geen installatie-instructies
- Succescriterium: 3–5 collega's installeren zonder live hulp en importeren hun eerste klas

### F-17 · Doorstroomnormering 2026/2027 (M42, gepland)
- Vervangt F-06/F-07 zodra geïmplementeerd; tot die tijd blijft de doorstroomprognose op `normen_onbekend` staan (ADR-16)
- Vestiging (Roosendaal / Goes / Dordrecht) is een eigenschap van de klas; ontbrekende vestiging → prognose blijft `normen_onbekend`
- BJ1-eind: bindend studieadvies met 3 uitkomsten — positief-naar-BJ2, positief-versneld-SBC, negatief (schoolverlaten) — criteria per fase (fase 2) geteld, niet over het hele jaar
- BJ2-eind: SBL/SBC-uitkomst met per-vestiging criteria (Roosendaal: studentkeuze-proces bij eerste voortgangsgesprek; Goes/Dordrecht: aparte SBC-criteria op basiskerntaken B1K1/B1K2)
- Sub-criterium "Betekenisvol Bewegen" (3 van 4 praktijkbeoordelingen ≥voldoende) telt mee voor het deelgebied Professionele houding
- Mentor kan "WVO-traject deelgenomen" handmatig vastleggen per BJ1-leerling (niet af te leiden uit de PDF-export)
- Bron: `26-27 Doorstroomnormeringen N3N4.pdf` (CIOS Zuidwest-NL), zie ADR-17

---

## Niet-functionele eisen

### NF-01 · Privacy & security
- Geen data naar externe servers
- Alle leerlingdata versleuteld opgeslagen (AES-256-GCM, Rust/Tauri backend)
- Geen internetverbinding vereist

### NF-02 · Platform
- Windows (primair, .exe installer)
- macOS (.dmg, Apple Silicon + Intel)
- Geen beheerdersrechten vereist voor installatie (Windows: current user)

### NF-03 · Performance
- PDF-batch import verwerkt meerdere bestanden zonder UI-blokkering
- Geen merkbare vertraging bij klasoverzicht met 30+ leerlingen

### NF-04 · Testbaarheid
- Alle businesslogica (prognose, status, parsers) is unit-testbaar zonder Tauri
- Vitest + jsdom voor component tests
- Tests vóór implementatie (TDD)

### NF-05 · Offline werking
- App start en werkt volledig zonder netwerkverbinding
- Geen externe CDN-afhankelijkheden (PDF.js als vendor bundle)
