# Requirements — v2.2 Onboarding, Export & Data Completeness

**Milestone:** v2.2
**Status:** Draft — 2026-05-19

---

## Active Requirements

### Onboarding Wizard (ONB)

- [ ] **ONB-01**: Mentor ziet een stap-voor-stap onboarding wizard bij eerste start van de app (geen klassen aanwezig)
- [ ] **ONB-02**: Stap 1 — mentor voert een klasnaam in en maakt de klas aan
- [ ] **ONB-03**: Stap 2 — mentor uploadt één of meerdere voortgang PDFs voor de klas
- [ ] **ONB-04**: Stap 3 — mentor uploadt het verzuim Excel bestand (.xls)
- [ ] **ONB-05**: Stap 4 — mentor uploadt het stage Excel bestand (BPV-uren); stap is optioneel en kan worden overgeslagen
- [ ] **ONB-06**: Stap 5 — mentor configureert instellingen (drempelwaarden, deelgebieden/leerlijnen mapping); optioneel, kan worden overgeslagen
- [ ] **ONB-07**: Na voltooiing van de wizard opent het dashboard direct met de nieuwe klas geladen
- [ ] **ONB-08**: Wanneer al klassen bestaan, toont de app geen wizard meer bij opstarten

### Print-to-PDF Export (EXP)

- [x] **EXP-01**: Mentor kan vanuit de detailweergave een mentorgesprekverslag afdrukken als PDF via de browser print-dialoog
- [x] **EXP-02**: Het verslag bevat: leerlingnaam, datum, klasnaam, doorstroomprognose, voortgang per deelgebied (scores + status), verzuimcijfers en actiepunten
- [x] **EXP-03**: Het verslag is opgemaakt voor A4 papier — geen afgekapte inhoud, correcte paginering
- [x] **EXP-04**: Een print-knop is zichtbaar in de detailweergave (niet alleen via Ctrl+P)

### BPV Stage Excel Parser (BPV)

- [ ] **BPV-01**: App leest echte BPV-uren uit het stage Excel bestand per leerling
- [ ] **BPV-02**: BPV voortgangsindicatie toont werkelijke uren t.o.v. geconfigureerd doelurenaantal
- [ ] **BPV-03**: Stage Excel kan worden geïmporteerd via de bestaande importpagina (dropzone + dialoog)
- [ ] **BPV-04**: Als geen stage Excel is geïmporteerd, toont de BPV-sectie "Nog geen stage-data" (geen crash)

### Rekenen & Nederlands (RNL)

- [ ] **RNL-01**: Mentor kan Rekenen voortgang bijhouden — scores apart weergegeven in de detailweergave
- [ ] **RNL-02**: Mentor kan Nederlands voortgang bijhouden — scores apart weergegeven in de detailweergave
- [ ] **RNL-03**: Rekenen en Nederlands hebben elk een eigen doorstroomnorm los van de deelgebieden-prognose
- [ ] **RNL-04**: Rekenen/Nederlands scores worden ingelezen uit de bestaande voortgang PDFs (geen apart bestand)

### Bug Fix (BUG)

- [ ] **BUG-01**: Bestanden slepen en neerzetten op het importveld werkt correct — PDF, .xls en zip-bestanden worden herkend en verwerkt

---

## Future Requirements (deferred)

- Nav diagonal stripe (cosmetic CSS `::after` issue in Tauri WebView)
- Rekenen en Nederlands ook in klasoverzicht-tegels tonen
- Mobiele/tablet lay-out

---

## Out of Scope

- API-koppeling met SomToday of andere systemen — bewust bestandsimport gehouden
- Inloggen / authenticatie — lokale single-user tool
- Cloudopslag of synchronisatie — data blijft lokaal (AVG)
- Word/docx export — browser print-to-PDF voldoet
- Automatische PDF-download vanuit schoolsysteem

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| BUG-01 | Phase 20 | Pending |
| EXP-01 | Phase 21 | Complete |
| EXP-02 | Phase 21 | Complete |
| EXP-03 | Phase 21 | Complete |
| EXP-04 | Phase 21 | Complete |
| BPV-01 | Phase 22 | Pending |
| BPV-02 | Phase 22 | Pending |
| BPV-03 | Phase 22 | Pending |
| BPV-04 | Phase 22 | Pending |
| RNL-01 | Phase 23 | Pending |
| RNL-02 | Phase 23 | Pending |
| RNL-03 | Phase 23 | Pending |
| RNL-04 | Phase 23 | Pending |
| ONB-01 | Phase 24 | Pending |
| ONB-02 | Phase 24 | Pending |
| ONB-03 | Phase 24 | Pending |
| ONB-04 | Phase 24 | Pending |
| ONB-05 | Phase 24 | Pending |
| ONB-06 | Phase 24 | Pending |
| ONB-07 | Phase 24 | Pending |
| ONB-08 | Phase 24 | Pending |
