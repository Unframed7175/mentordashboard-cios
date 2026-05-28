# Requirements: v2.4 Data Completeness, Keuzedelen & UI Polish

**Milestone:** v2.4
**Status:** Active
**Created:** 2026-05-28

---

## BPV: Echte Stage-uren (BPV)

- [ ] **BPV-05**: De BPV-sectie toont werkelijke gerealiseerde uren ingelezen uit het echte SomToday BPV Excel bestand (niet 0)
- [ ] **BPV-06**: De BPV column matchers herkennen minimaal 2 aliassen per kolomnaam zodat herbenoemingen in nieuwe exports niet falen
- [ ] **BPV-07**: Als de BPV kolomnamen niet herkend worden, toont de app "0 uren" en crasht niet

## Keuzedelen: Per-leerling bijhouden (KZLD)

- [ ] **KZLD-01**: Mentor kan per leerling een keuzedeel toevoegen met een vrije tekst naam
- [ ] **KZLD-02**: Per keuzedeel kan de mentor een vinkje "on track" aan- of uitzetten
- [ ] **KZLD-03**: Mentor kan een keuzedeel verwijderen uit de lijst van een leerling
- [ ] **KZLD-04**: Keuzedelen worden opgeslagen en hersteld na herstart van de app
- [ ] **KZLD-05**: De keuzedelen-sectie is zichtbaar in de detailweergave van elke leerling

## Klasoverzicht Tegels: R&N Status (TEGEL)

- [ ] **TEGEL-03**: De leerlingtegel toont een compacte Rekenen/Nederlands statusregel (bijv. "R 2F · N 3F") wanneer R&N data aanwezig is
- [ ] **TEGEL-04**: De R&N statusregel wordt verborgen als een leerling geen Rekenen/Nederlands scores heeft

## Klasbeheer: Klas Verwijderen (KLS)

- [ ] **KLS-04**: Mentor kan een niet-lege klas verwijderen via een bevestigingsdialoog met checkbox
- [ ] **KLS-05**: De bevestigingsdialoog toont de klasnaam en het aantal leerlingen dat verwijderd wordt
- [ ] **KLS-06**: De verwijder-knop is uitgeschakeld totdat de mentor de checkbox "Ik begrijp dat alle leerlingdata wordt verwijderd" aanvinkt
- [ ] **KLS-07**: Na verwijderen van de laatste klas navigeert de app naar het importscherm

## UI: Polish (UI)

- [ ] **UI-05**: Het spiderweb chart in de detailweergave is groter weergegeven (minimaal 280px breed, responsive via viewBox)
- [ ] **UI-06**: FeedbackActiepuntenSection staat als laatste sectie onderaan de detailweergave
- [ ] **UI-07**: De bovenste navigatiebalk (nav-banner) en het CIOS-logo zijn twee keer zo groot (nav min-height 104px, logo 72px)

---

## Future Requirements (deferred)

- RNL-04 — PDF extractie voor Rekenen/Nederlands (wacht op sample PDF met R&N sectie)
- R&N doorstroomnorm in prognose-engine (aparte sectie al aanwezig, prognose niet gecombineerd)

---

## Out of Scope

- Keuzedelen configureren via SettingsPage (klasse-breed) — mentor beheert keuzedelen per leerling
- BPV uren automatisch herberekenen na instellingenwijziging — import is de trigger
- Multi-device sync of export van keuzedelen — lokale tool, geen server

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| BPV-05 | TBD | ○ Pending |
| BPV-06 | TBD | ○ Pending |
| BPV-07 | TBD | ○ Pending |
| KZLD-01 | TBD | ○ Pending |
| KZLD-02 | TBD | ○ Pending |
| KZLD-03 | TBD | ○ Pending |
| KZLD-04 | TBD | ○ Pending |
| KZLD-05 | TBD | ○ Pending |
| TEGEL-03 | TBD | ○ Pending |
| TEGEL-04 | TBD | ○ Pending |
| KLS-04 | TBD | ○ Pending |
| KLS-05 | TBD | ○ Pending |
| KLS-06 | TBD | ○ Pending |
| KLS-07 | TBD | ○ Pending |
| UI-05 | TBD | ○ Pending |
| UI-06 | TBD | ○ Pending |
| UI-07 | TBD | ○ Pending |
