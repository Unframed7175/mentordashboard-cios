# Requirements: Mentordashboard CIOS

**Core Value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.

---

## v2.0 Requirements — Stack Modernisering

**Defined:** 2026-05-12
**Milestone:** v2.0 Stack Modernisering
**Decisions locked:** OS keychain encryptie, zip.js backups leesbaar houden

### Toolchain & Scaffold (TCH)

- [x] **TCH-01**: Developer kan het project starten met `npm run dev` — geen Python http.server
- [x] **TCH-02**: App bouwt als installeerbare `.exe` (Windows) en `.dmg` (Mac) via één build-commando
- [x] **TCH-03**: Alle 128 bestaande tests slagen na migratie (nul regressies)
- [x] **TCH-04**: TypeScript type-fouten zijn zichtbaar tijdens development (per-module strict mode)

### Logica Migratie (MIG)

- [ ] **MIG-01**: PDF-parser (pdfjs-dist) geeft identieke resultaten na TypeScript-migratie
- [ ] **MIG-02**: Excel-parser (.xls SheetJS) geeft identieke resultaten incl. correcte Nederlandse tekens
- [ ] **MIG-03**: Doorstroomnorm engine (prognosis.js) geeft identieke berekeningen na TypeScript-migratie

### Versleutelde Opslag (STO)

- [ ] **STO-01**: Alle klassendata wordt opgeslagen via Tauri plugin-store (vervangt localStorage)
- [ ] **STO-02**: Leerlingdata wordt versleuteld opgeslagen (AES-256-GCM) met sleutel in OS keychain
- [ ] **STO-03**: Bestaande localStorage-data wordt automatisch gemigreerd bij eerste app-start
- [ ] **STO-04**: Mentor kan een individuele leerling volledig verwijderen (Artikel 17 AVG)

### Bestandstoegang (IMP)

- [ ] **IMP-01**: Mentor kan PDF-bestanden importeren via drag-drop én bestandsdialoog
- [ ] **IMP-02**: Mentor kan Excel-bestanden (.xls) importeren via drag-drop én bestandsdialoog
- [ ] **IMP-03**: Mentor kan bestaande zip.js-backups importeren in de nieuwe app

### UI — Klasoverzicht (KOV)

- [ ] **KOV-01**: Klasoverzicht tegel-grid toont identieke informatie als de huidige app
- [ ] **KOV-02**: Zoeken, sorteren en klas wisselen werken identiek in de React versie

### UI — Detailweergave (DET-v2)

- [ ] **DET-V2-01**: Detailweergave toont identieke informatie (voortgang, verzuim, prognose, notities)
- [ ] **DET-V2-02**: Actiepunten en feedback werken identiek in de React versie

### Packaging & Cross-platform (PKG)

- [ ] **PKG-01**: App draait correct op Windows 10/11 zonder extra installaties voor de eindgebruiker
- [ ] **PKG-02**: App draait correct op macOS 12+ zonder extra installaties voor de eindgebruiker
- [ ] **PKG-03**: UI ziet er visueel identiek uit op Windows (WebView2) én macOS (WebKit)

### Traceability

| REQ-ID | Phase | Plan |
|--------|-------|------|
| TCH-01 | Phase 10 — Scaffold & Toolchain | TBD |
| TCH-02 | Phase 10 — Scaffold & Toolchain | TBD |
| TCH-03 | Phase 10 — Scaffold & Toolchain | TBD |
| TCH-04 | Phase 10 — Scaffold & Toolchain | TBD |
| MIG-01 | Phase 11 — TypeScript Migratie | TBD |
| MIG-02 | Phase 11 — TypeScript Migratie | TBD |
| MIG-03 | Phase 11 — TypeScript Migratie | TBD |
| STO-01 | Phase 12 — Versleutelde Opslag | TBD |
| STO-02 | Phase 12 — Versleutelde Opslag | TBD |
| STO-03 | Phase 12 — Versleutelde Opslag | TBD |
| STO-04 | Phase 12 — Versleutelde Opslag | TBD |
| IMP-01 | Phase 13 — Bestandstoegang | TBD |
| IMP-02 | Phase 13 — Bestandstoegang | TBD |
| IMP-03 | Phase 13 — Bestandstoegang | TBD |
| KOV-01 | Phase 14 — React UI | TBD |
| KOV-02 | Phase 14 — React UI | TBD |
| DET-V2-01 | Phase 14 — React UI | TBD |
| DET-V2-02 | Phase 14 — React UI | TBD |
| PKG-01 | Phase 15 — Packaging & Cross-platform | TBD |
| PKG-02 | Phase 15 — Packaging & Cross-platform | TBD |
| PKG-03 | Phase 15 — Packaging & Cross-platform | TBD |

---

## v1.2 Requirements — Dashboard Redesign

**Defined:** 2026-04-23
**Milestone:** v1.2 Dashboard Redesign

### Verzuim Weergave (Attendance Display)

- [ ] **VRZ-01**: Klasoverzicht-tegel toont aanwezigheidspercentage (bijv. "87% aanwezig") onder de verzuimbalk i.p.v. "Xu ongeoorloofd"
- [ ] **VRZ-02**: 3-delige verzuimbalk (aanwezig / geoorloofd / ongeoorloofd) blijft ongewijzigd in de tegel

### Huisstijl Redesign (Brand Redesign)

- [ ] **DES-01**: Primaire accentkleur wordt CIOS cyaan `#00AEEF` — knoppen, links, actieve tabs, highlights
- [ ] **DES-02**: Header/navigatiebalk gebruikt CIOS navy donkerblauw (verfijnd van huidige `#1a1a2e`)
- [ ] **DES-03**: Typografie switcht naar een bold, modern sans-serif passend bij CIOS huisstijl
- [ ] **DES-04**: CSS variabelen (`--accent-blue`, `--bg-header`, kleurtokens) vervangen door CIOS kleurpallet door de hele app

## v1.1 Requirements — Klasbeheer & Export (COMPLETE)

**Defined:** 2026-03-25
**Milestone:** v1.1 Klasbeheer & Export

### Meerdere Klassen (Multi-class)

- [x] **KLS-01**: Mentor kan een nieuwe klas aanmaken met een naam (bijv. "CSD2A", "CSD2B")
- [x] **KLS-02**: Elke klas verschijnt als een eigen tabblad — schakelen wisselt de actieve klas zonder data te verliezen
- [x] **KLS-03**: Elke klas heeft eigen PDF-import, Excel-import en leerlijn-toewijzing
- [x] **KLS-04**: Alle klassen en hun data worden bewaard na pagina-refresh (localStorage)
- [x] **KLS-05**: Mentor kan een klas verwijderen met bevestigingsdialoog
- [x] **KLS-06**: De actieve klas wordt onthouden na pagina-refresh

### Periodes Vergelijken (Period Comparison)

- [x] **CMP-01**: Mentor kan per klas PDFs van meerdere periodes importeren (bijv. fase 1 én fase 2)
- [x] **CMP-02**: Detailweergave toont deelgebied-scores van fase 1 én fase 2 naast elkaar
- [x] **CMP-03**: Groei per deelgebied (V/G/E stijging/daling) is visueel onderscheidbaar in de vergelijking
- [x] **CMP-04**: Doorstroomprognose wordt berekend op de meest recente periode

## Future Requirements (v2+)

- Print-to-PDF export voor mentorgesprekverslag (EXP-01–04, uitgesteld uit v1.1)
- Rekenen en Nederlands voortgang apart bijhouden met eigen doorstroomnorm
- Vergelijking tussen klassen (klasoverzicht naast elkaar)
- Export naar bewerkbaar Word-document

## Out of Scope

| Feature | Reason |
|---------|--------|
| Word/docx export | Browser print-to-PDF voldoet — geen extra library |
| Rekenen & Nederlands norm | Vereist aparte normering-definitie — gepland voor v2 |
| Cloud sync / server opslag | Privacy — leerlingdata blijft lokaal |
| Meerdere mentoren / login | Lokale tool voor één mentor |
| Nieuwe functionaliteit in v1.2 | Puur visuele upgrade — geen nieuwe features |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| KLS-01 | Phase 6 — Multi-class UI | Complete |
| KLS-02 | Phase 6 — Multi-class UI | Complete |
| KLS-03 | Phase 6 — Multi-class UI | Complete |
| KLS-04 | Phase 6 — Multi-class UI | Complete |
| KLS-05 | Phase 6 — Multi-class UI | Complete |
| KLS-06 | Phase 6 — Multi-class UI | Complete |
| CMP-01 | Phase 7 — Periode Vergelijking | Complete |
| CMP-02 | Phase 7 — Periode Vergelijking | Complete |
| CMP-03 | Phase 7 — Periode Vergelijking | Complete |
| CMP-04 | Phase 7 — Periode Vergelijking | Complete |
| VRZ-01 | Phase 9 — CIOS Huisstijl & Verzuim Weergave | Pending |
| VRZ-02 | Phase 9 — CIOS Huisstijl & Verzuim Weergave | Pending |
| DES-01 | Phase 9 — CIOS Huisstijl & Verzuim Weergave | Pending |
| DES-02 | Phase 9 — CIOS Huisstijl & Verzuim Weergave | Pending |
| DES-03 | Phase 9 — CIOS Huisstijl & Verzuim Weergave | Pending |
| DES-04 | Phase 9 — CIOS Huisstijl & Verzuim Weergave | Pending |
| TCH-01 | Phase 10 — Scaffold & Toolchain | Complete |
| TCH-02 | Phase 10 — Scaffold & Toolchain | Complete |
| TCH-03 | Phase 10 — Scaffold & Toolchain | Complete |
| TCH-04 | Phase 10 — Scaffold & Toolchain | Complete |
| MIG-01 | Phase 11 — TypeScript Migratie | Pending |
| MIG-02 | Phase 11 — TypeScript Migratie | Pending |
| MIG-03 | Phase 11 — TypeScript Migratie | Pending |
| STO-01 | Phase 12 — Versleutelde Opslag | Pending |
| STO-02 | Phase 12 — Versleutelde Opslag | Pending |
| STO-03 | Phase 12 — Versleutelde Opslag | Pending |
| STO-04 | Phase 12 — Versleutelde Opslag | Pending |
| IMP-01 | Phase 13 — Bestandstoegang | Pending |
| IMP-02 | Phase 13 — Bestandstoegang | Pending |
| IMP-03 | Phase 13 — Bestandstoegang | Pending |
| KOV-01 | Phase 14 — React UI | Pending |
| KOV-02 | Phase 14 — React UI | Pending |
| DET-V2-01 | Phase 14 — React UI | Pending |
| DET-V2-02 | Phase 14 — React UI | Pending |
| PKG-01 | Phase 15 — Packaging & Cross-platform | Pending |
| PKG-02 | Phase 15 — Packaging & Cross-platform | Pending |
| PKG-03 | Phase 15 — Packaging & Cross-platform | Pending |
