# Requirements: Mentordashboard CIOS — v1.1 Klasbeheer & Export

**Defined:** 2026-03-25
**Milestone:** v1.1 Klasbeheer & Export
**Core Value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.

## v1.1 Requirements

### Meerdere Klassen (Multi-class)

- [x] **KLS-01**: Mentor kan een nieuwe klas aanmaken met een naam (bijv. "CSD2A", "CSD2B")
- [x] **KLS-02**: Elke klas verschijnt als een eigen tabblad — schakelen wisselt de actieve klas zonder data te verliezen
- [x] **KLS-03**: Elke klas heeft eigen PDF-import, Excel-import en leerlijn-toewijzing
- [x] **KLS-04**: Alle klassen en hun data worden bewaard na pagina-refresh (localStorage)
- [x] **KLS-05**: Mentor kan een klas verwijderen met bevestigingsdialoog
- [x] **KLS-06**: De actieve klas wordt onthouden na pagina-refresh

### Periodes Vergelijken (Period Comparison)

- [ ] **CMP-01**: Mentor kan per klas PDFs van meerdere periodes importeren (bijv. fase 1 én fase 2)
- [ ] **CMP-02**: Detailweergave toont deelgebied-scores van fase 1 én fase 2 naast elkaar
- [ ] **CMP-03**: Groei per deelgebied (V/G/E stijging/daling) is visueel onderscheidbaar in de vergelijking
- [ ] **CMP-04**: Doorstroomprognose wordt berekend op de meest recente periode

### Print-to-PDF Export

- [ ] **EXP-01**: Detailweergave heeft een "Afdrukken voor mentorgesprek" knop
- [ ] **EXP-02**: CSS @media print stylesheet formatteert de detailweergave netjes voor A4
- [ ] **EXP-03**: Print-output bevat: naam, klas, prognose samenvatting, voortgang per vak, verzuim overzicht, en notities
- [ ] **EXP-04**: Navigatie-elementen, knoppen en import-UI worden verborgen in print-modus

## Future Requirements (v2+)

- Rekenen en Nederlands voortgang apart bijhouden met eigen doorstroomnorm
- Vergelijking tussen klassen (klasoverzicht naast elkaar)
- Export naar bewerkbaar Word-document

## Out of Scope

| Feature | Reason |
|---------|--------|
| Word/docx export | Browser print-to-PDF voldoet voor v1.1 — geen extra library |
| Rekenen & Nederlands norm | Vereist aparte normering-definitie — gepland voor v2 |
| Cloud sync / server opslag | Privacy — leerlingdata blijft lokaal |
| Meerdere mentoren / login | Lokale tool voor één mentor |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| KLS-01 | Phase 6 — Multi-class UI | Complete |
| KLS-02 | Phase 6 — Multi-class UI | Complete |
| KLS-03 | Phase 6 — Multi-class UI | Complete |
| KLS-04 | Phase 6 — Multi-class UI | Complete |
| KLS-05 | Phase 6 — Multi-class UI | Complete |
| KLS-06 | Phase 6 — Multi-class UI | Complete |
| CMP-01 | Phase 7 — Periode Vergelijking | Pending |
| CMP-02 | Phase 7 — Periode Vergelijking | Pending |
| CMP-03 | Phase 7 — Periode Vergelijking | Pending |
| CMP-04 | Phase 7 — Periode Vergelijking | Pending |
| EXP-01 | Phase 8 — Print-to-PDF Export | Pending |
| EXP-02 | Phase 8 — Print-to-PDF Export | Pending |
| EXP-03 | Phase 8 — Print-to-PDF Export | Pending |
| EXP-04 | Phase 8 — Print-to-PDF Export | Pending |
