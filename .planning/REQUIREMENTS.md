# Requirements: Mentordashboard CIOS

**Core Value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.

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
| VRZ-01 | Phase 9 — TBD | Pending |
| VRZ-02 | Phase 9 — TBD | Pending |
| DES-01 | Phase 9 — TBD | Pending |
| DES-02 | Phase 9 — TBD | Pending |
| DES-03 | Phase 9 — TBD | Pending |
| DES-04 | Phase 9 — TBD | Pending |
